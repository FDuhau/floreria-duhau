// ── POST /api/login: valida el código de una persona y devuelve su token ──────
// El personal sigue escribiendo su código de siempre. El Worker lo compara con
// los hashes de `loginAuth` (mismo PBKDF2 que usa la app) y, si coincide,
// entrega un token de Firebase con el rol firmado: ese rol es el que las reglas
// de la base podrán chequear. Sin el secret FIREBASE_SERVICE_ACCOUNT responde
// 503 y la app sigue con el ingreso de antes.
import { getAccessToken, readDb, mintCustomToken } from './firebase-admin.js';

const DB_URL = 'https://floreria-duhau-84de5-default-rtdb.firebaseio.com';

function b64ToBytes(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function bytesToB64(buf) {
  let s = '';
  new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

// Igual que hashPassword de la app: sin espacios, sin mayúsculas, PBKDF2 150k.
export async function hashCode(code, saltB64) {
  const norm = String(code).trim().toLowerCase();
  const keyMat = await crypto.subtle.importKey('raw', new TextEncoder().encode(norm), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: b64ToBytes(saltB64), iterations: 150000, hash: 'SHA-256' },
    keyMat,
    256,
  );
  return bytesToB64(bits);
}

// Busca a quién pertenece el código. Devuelve { id, entry } o null.
export async function buscarUsuario(code, loginAuth) {
  for (const [id, e] of Object.entries(loginAuth || {})) {
    if (!e || !e.salt || !e.hash) continue;
    if ((await hashCode(code, e.salt)) === e.hash) return { id, entry: e };
  }
  return null;
}

// Datos que la app necesita para armar la sesión (nunca salt ni hash).
export function entryPublica(entry) {
  const out = { role: entry.role, label: entry.label };
  for (const k of ['floristaNombre', 'jardineroNombre', 'sucursal']) if (entry[k]) out[k] = entry[k];
  return out;
}

export async function handleLogin(request, env) {
  if (!env.FIREBASE_SERVICE_ACCOUNT) return json({ error: 'no_configurado' }, 503);
  let code;
  try {
    code = String((await request.json())?.code ?? '').trim();
  } catch (e) {
    return json({ error: 'JSON inválido' }, 400);
  }
  if (!code || code.length > 100) return json({ error: 'código inválido' }, 400);

  let sa;
  try {
    sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
    const access = await getAccessToken(sa);
    const loginAuth = await readDb(DB_URL, 'loginAuth', access);
    const found = await buscarUsuario(code, loginAuth);
    if (!found) return json({ error: 'incorrecto' }, 401);
    const e = found.entry;
    const token = await mintCustomToken(sa, found.id, {
      role: e.role,
      jardinero: !!(e.jardineroNombre || e.role === 'jardinero'),
    });
    return json({ token, id: found.id, entry: entryPublica(e) });
  } catch (err) {
    return json({ error: 'no_disponible' }, 503);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
