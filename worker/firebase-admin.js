// ── Acceso a Firebase desde el Worker, SIN clave de cuenta de servicio ────────
// Usa dos cosas que sí se pueden crear en la consola:
//  - el "secreto de la base de datos" (FIREBASE_DB_SECRET) para leer loginAuth
//    y escribir userRoles aunque las reglas se cierren
//  - la API de Firebase Authentication con email y contraseña DERIVADOS de un
//    secreto propio (AUTH_PEPPER): nadie puede adivinarlos ni registrarse con
//    la cuenta de otra persona.
// Todo con WebCrypto y fetch, que Workers y Node 20 traen de fábrica.

const enc = new TextEncoder();
const IDT = 'https://identitytoolkit.googleapis.com/v1/accounts';

function toB64url(buf) {
  let s = '';
  new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toB64url(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}

// Email y contraseña de la cuenta de Firebase de cada persona (siempre los mismos).
export async function credencialesDe(pepper, id) {
  const e = (await hmac(pepper, 'email:' + id)).replace(/[^a-z0-9]/gi, '').slice(0, 30).toLowerCase();
  return { email: `${e}@login.floreria-duhau.app`, password: await hmac(pepper, 'pw:' + id) };
}

async function idt(path, apiKey, body) {
  const r = await fetch(`${IDT}:${path}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, returnSecureToken: true }),
  });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, data: d };
}

// Devuelve el uid de la cuenta, creándola la primera vez.
export async function asegurarCuenta(apiKey, { email, password }) {
  let r = await idt('signInWithPassword', apiKey, { email, password });
  if (r.ok) return r.data.localId;
  const msg = r.data?.error?.message || '';
  if (!/EMAIL_NOT_FOUND|INVALID_LOGIN_CREDENTIALS|INVALID_PASSWORD/.test(msg)) throw new Error('auth ' + msg);
  r = await idt('signUp', apiKey, { email, password });
  if (!r.ok) throw new Error('signup ' + (r.data?.error?.message || ''));
  return r.data.localId;
}

function dbUrl(dbBase, path, secret) {
  return `${dbBase}/${path}.json?auth=${encodeURIComponent(secret)}`;
}

export async function readDb(dbBase, path, secret) {
  const r = await fetch(dbUrl(dbBase, path, secret));
  if (!r.ok) throw new Error('db ' + r.status);
  return r.json();
}

export async function writeDb(dbBase, path, secret, value) {
  const r = await fetch(dbUrl(dbBase, path, secret), { method: 'PUT', body: JSON.stringify(value) });
  if (!r.ok) throw new Error('db ' + r.status);
}
