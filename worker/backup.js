// ── Backup automático de Firebase Realtime Database → Cloudflare R2 ──────────
// Un Cron Trigger diario lee TODA la base por REST con una cuenta de servicio
// (que ignora las reglas de seguridad), la comprime en streaming (gzip) y la
// sube a R2 por partes, así que no carga la base entera en memoria.
//
//   daily/YYYY-MM-DD.json.gz   un backup por día
//   _last.json                 estado del último intento (ok / error)
//
// Retención: los diarios se guardan 30 días; los del día 1 de cada mes, 12 meses.

const te = new TextEncoder();
const PART_SIZE = 5 * 1024 * 1024;          // R2: partes iguales de >= 5 MiB (salvo la última)
const MIN_BYTES = 200;                       // una base vacía ("null") no es un backup válido
const DAILY_DAYS = 30;
const MONTHLY_DAYS = 400;
const SCOPES = 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email';

function b64u(bytes){
  let bin = '';
  new Uint8Array(bytes).forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function pemToDer(pem){
  const body = String(pem).replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');
  return Uint8Array.from(atob(body), c => c.charCodeAt(0));
}

// Token OAuth2 de la cuenta de servicio (JWT RS256 → oauth2.googleapis.com/token)
export async function getAccessToken(sa, fetchFn = fetch){
  const now = Math.floor(Date.now() / 1000);
  const header = b64u(te.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = b64u(te.encode(JSON.stringify({
    iss: sa.client_email, scope: SCOPES,
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  })));
  const key = await crypto.subtle.importKey(
    'pkcs8', pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, te.encode(header + '.' + claim));
  const jwt = header + '.' + claim + '.' + b64u(sig);
  const r = await fetchFn('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + jwt,
  });
  if(!r.ok) throw new Error('OAuth ' + r.status);
  const j = await r.json();
  if(!j.access_token) throw new Error('OAuth sin access_token');
  return j.access_token;
}

export function dayKey(date){
  return 'daily/' + date.toISOString().slice(0, 10) + '.json.gz';
}

// Qué claves borrar según la retención. `keys` = claves existentes en daily/
export function keysToDelete(keys, now = new Date()){
  const DAY = 86400000;
  const today = Date.parse(now.toISOString().slice(0, 10) + 'T00:00:00Z'); // días enteros
  return keys.filter(k => {
    const m = /^daily\/(\d{4}-\d{2}-\d{2})\.json\.gz$/.exec(k);
    if(!m) return false;                               // no tocar lo que no reconocemos
    const age = (today - Date.parse(m[1] + 'T00:00:00Z')) / DAY;
    const isMonthly = m[1].endsWith('-01');
    return age > (isMonthly ? MONTHLY_DAYS : DAILY_DAYS);
  });
}

// Descarga la base completa y la sube a R2 (gzip + multipart). Devuelve métricas.
export async function backupDatabase(env, { fetchFn = fetch, now = new Date() } = {}){
  if(!env.BACKUPS) throw new Error('Falta el binding R2 BACKUPS');
  if(!env.FIREBASE_SERVICE_ACCOUNT) throw new Error('Falta el secret FIREBASE_SERVICE_ACCOUNT');
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const dbUrl = String(env.FIREBASE_DB_URL || '').replace(/\/+$/, '');
  if(!dbUrl) throw new Error('Falta FIREBASE_DB_URL');

  const token = await getAccessToken(sa, fetchFn);
  const res = await fetchFn(dbUrl + '/.json?format=export', {
    headers: { Authorization: 'Bearer ' + token },
  });
  if(!res.ok || !res.body) throw new Error('Firebase respondió ' + res.status);

  let rawBytes = 0;
  const counter = new TransformStream({
    transform(chunk, ctrl){ rawBytes += chunk.byteLength; ctrl.enqueue(chunk); },
  });
  const gz = res.body.pipeThrough(counter).pipeThrough(new CompressionStream('gzip'));

  const key = dayKey(now);
  // Se sube primero a una clave temporal: si algo falla, el backup de hoy anterior sigue intacto.
  const tmpKey = 'tmp/' + now.getTime() + '.json.gz';
  const mpu = await env.BACKUPS.createMultipartUpload(tmpKey);
  const parts = [];
  let size = 0;
  try {
    let buf = new Uint8Array(0);
    const flush = async (chunk) => {
      const part = await mpu.uploadPart(parts.length + 1, chunk);
      parts.push(part);
      size += chunk.byteLength;
    };
    const reader = gz.getReader();
    for(;;){
      const { done, value } = await reader.read();
      if(value){
        const merged = new Uint8Array(buf.length + value.length);
        merged.set(buf); merged.set(value, buf.length);
        buf = merged;
        while(buf.length >= PART_SIZE){
          await flush(buf.slice(0, PART_SIZE));
          buf = buf.slice(PART_SIZE);
        }
      }
      if(done) break;
    }
    if(rawBytes < MIN_BYTES) throw new Error('La base vino vacía (' + rawBytes + ' bytes); no se guarda');
    if(buf.length || !parts.length) await flush(buf);
    await mpu.complete(parts);
  } catch(e){
    try { await mpu.abort(); } catch(_e){ /* ya abortado */ }
    throw e;
  }

  // Promover el temporal al definitivo (R2 no tiene rename: copiar leyendo y borrar)
  const obj = await env.BACKUPS.get(tmpKey);
  if(!obj) throw new Error('No se encontró el backup recién subido');
  await env.BACKUPS.put(key, obj.body, { httpMetadata: { contentType: 'application/gzip' }, customMetadata: { rawBytes: String(rawBytes) } });
  await env.BACKUPS.delete(tmpKey);

  const head = await env.BACKUPS.head(key);
  if(!head || head.size !== size) throw new Error('Verificación falló: tamaño distinto al subido');
  return { key, rawBytes, gzBytes: size };
}

async function pruneOld(env, now){
  const keys = [];
  let cursor;
  do {
    const l = await env.BACKUPS.list({ prefix: 'daily/', cursor });
    l.objects.forEach(o => keys.push(o.key));
    cursor = l.truncated ? l.cursor : undefined;
  } while(cursor);
  const del = keysToDelete(keys, now);
  if(del.length) await env.BACKUPS.delete(del);
  return del.length;
}

// Punto de entrada del cron: backup + limpieza + registro de estado
export async function runScheduledBackup(env, opts = {}){
  const now = opts.now || new Date();
  let status;
  try {
    const r = await backupDatabase(env, opts);
    const pruned = await pruneOld(env, now);
    status = { ok: true, at: now.toISOString(), ...r, pruned };
    console.log('Backup OK', JSON.stringify(status));
  } catch(e){
    status = { ok: false, at: now.toISOString(), error: String(e && e.message || e) };
    console.error('Backup FALLÓ', JSON.stringify(status));
  }
  try {
    await env.BACKUPS.put('_last.json', JSON.stringify(status), { httpMetadata: { contentType: 'application/json' } });
  } catch(_e){ /* el estado es informativo */ }
  if(!status.ok) throw new Error(status.error); // que figure como fallo en el dashboard de Cron
  return status;
}
