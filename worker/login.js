// ── POST /api/login: valida el código de una persona y devuelve su token ──────
// El personal sigue escribiendo su código de siempre. El Worker lo compara con
// los hashes de `loginAuth` (mismo PBKDF2 que usa la app) y, si coincide,
// entrega las credenciales de SU cuenta de Firebase y deja anotado su rol en
// `userRoles/{uid}` (solo el Worker escribe ahí): ese rol es el que las reglas
// de la base podrán chequear. Sin los secrets (FIREBASE_DB_SECRET y
// AUTH_PEPPER) responde 503 y la app sigue con el ingreso de antes.
import { readDb, writeDb, credencialesDe, asegurarCuenta, idt } from './firebase-admin.js';

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
  if (!env.FIREBASE_DB_SECRET || !env.AUTH_PEPPER || !env.FIREBASE_API_KEY) return json({ error: 'no_configurado' }, 503);
  let code;
  try {
    code = String((await request.json())?.code ?? '').trim();
  } catch (e) {
    return json({ error: 'JSON inválido' }, 400);
  }
  if (!code || code.length > 100) return json({ error: 'código inválido' }, 400);

  try {
    const loginAuth = await readDb(DB_URL, 'loginAuth', env.FIREBASE_DB_SECRET);
    const found = await buscarUsuario(code, loginAuth);
    if (!found) return json({ error: 'incorrecto' }, 401);
    const e = found.entry;
    const cred = await credencialesDe(env.AUTH_PEPPER, found.id);
    const uid = await asegurarCuenta(env.FIREBASE_API_KEY, cred);
    await writeDb(DB_URL, 'userRoles/' + uid, env.FIREBASE_DB_SECRET, {
      role: e.role,
      id: found.id,
      jardinero: !!(e.jardineroNombre || e.role === 'jardinero'),
    });
    return json({ email: cred.email, password: cred.password, id: found.id, entry: entryPublica(e) });
  } catch (err) {
    return json({ error: 'no_disponible' }, 503);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}

// GET /api/login-estado: chequeo de que todo está configurado. Solo muestra
// sí/no y códigos de error, nunca valores secretos.
export async function handleEstado(env) {
  const out = {
    secrets: { FIREBASE_DB_SECRET: !!env.FIREBASE_DB_SECRET, AUTH_PEPPER: !!env.AUTH_PEPPER, FIREBASE_API_KEY: !!env.FIREBASE_API_KEY },
  };
  try {
    const la = await readDb(DB_URL, 'loginAuth', env.FIREBASE_DB_SECRET || 'x');
    out.lecturaLoginAuth = la && Object.keys(la).length ? 'ok' : 'vacio';
  } catch (e) {
    out.lecturaLoginAuth = String(e.message || e).slice(0, 60);
  }
  try {
    // Un correo que no existe: si la clave y el proveedor están bien, responde EMAIL_NOT_FOUND.
    const r = await idt('signInWithPassword', env.FIREBASE_API_KEY || 'x', { email: 'chequeo@login.floreria-duhau.app', password: 'chequeo-no-existe' });
    out.autenticacion = r.ok ? 'ok' : String(r.data?.error?.message || 'error').slice(0, 80);
  } catch (e) {
    out.autenticacion = String(e.message || e).slice(0, 60);
  }
  // Recorrido completo con una cuenta de prueba: crear/entrar y escribir en la base.
  try {
    if (env.AUTH_PEPPER && env.FIREBASE_API_KEY) {
      const uid = await asegurarCuenta(env.FIREBASE_API_KEY, await credencialesDe(env.AUTH_PEPPER, '__chequeo__'));
      out.cuentaDePrueba = uid ? 'ok' : 'sin uid';
    }
  } catch (e) {
    out.cuentaDePrueba = String(e.message || e).slice(0, 80);
  }
  try {
    await writeDb(DB_URL, 'loginDiag', env.FIREBASE_DB_SECRET || 'x', { ultimaPrueba: new Date().toISOString() });
    out.escrituraBase = 'ok';
  } catch (e) {
    out.escrituraBase = String(e.message || e).slice(0, 60);
  }
  return json(out);
}
