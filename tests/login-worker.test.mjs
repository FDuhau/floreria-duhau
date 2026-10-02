import test from 'node:test';
import assert from 'node:assert/strict';
import { credencialesDe } from '../worker/firebase-admin.js';
import { hashCode, buscarUsuario, entryPublica, handleLogin } from '../worker/login.js';

const b64 = (u8) => Buffer.from(u8).toString('base64');

test('las credenciales de cada persona son estables, distintas y no revelan el id', async () => {
  const a1 = await credencialesDe('pimienta', 'euge');
  const a2 = await credencialesDe('pimienta', 'euge');
  const b = await credencialesDe('pimienta', 'ivan');
  const c = await credencialesDe('otra', 'euge');
  assert.deepEqual(a1, a2);
  assert.notEqual(a1.email, b.email);
  assert.notEqual(a1.email, c.email);
  assert.notEqual(a1.password, b.password);
  assert.match(a1.email, /^[a-z0-9]{1,30}@login\.floreria-duhau\.app$/);
  assert.ok(!a1.email.includes('euge') && a1.password.length >= 40);
});

test('crea la cuenta la primera vez y anota el rol', async () => {
  const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
  const loginAuth = { euge: { role: 'comercial', label: 'Euge', salt, iter: 100000, hash: await hashCode('flor9', salt, 100000) } };
  const llamadas = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    llamadas.push({ url: String(url), method: init.method || 'GET', body: init.body });
    const u = String(url);
    const json = (o, status = 200) => new Response(JSON.stringify(o), { status });
    if (u.includes('loginAuth.json')) return json(loginAuth);
    if (u.includes('signInWithPassword')) return json({ error: { message: 'INVALID_LOGIN_CREDENTIALS' } }, 400);
    if (u.includes('accounts:signUp')) return json({ localId: 'uid123' });
    if (u.includes('userRoles/uid123.json')) return json({});
    return json({}, 404);
  };
  try {
    const env = { FIREBASE_DB_SECRET: 's', AUTH_PEPPER: 'p', FIREBASE_API_KEY: 'k' };
    const res = await handleLogin(new Request('http://x/api/login', { method: 'POST', body: '{"code":" Flor9 "}' }), env);
    assert.equal(res.status, 200);
    const d = await res.json();
    assert.equal(d.id, 'euge');
    assert.ok(d.email && d.password);
    assert.deepEqual(Object.keys(d.entry).sort(), ['label', 'role']);
    const rol = llamadas.find((l) => l.url.includes('userRoles/uid123.json'));
    assert.equal(rol.method, 'PUT');
    assert.equal(JSON.parse(rol.body).role, 'comercial');
    const mala = await handleLogin(new Request('http://x/api/login', { method: 'POST', body: '{"code":"nope"}' }), env);
    assert.equal(mala.status, 401);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('el hash coincide con el de la app y encuentra al dueño del código', async () => {
  const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
  const loginAuth = {
    ana: { role: 'florista', label: 'Ana', salt, iter: 100000, hash: await hashCode('Rosa1', salt, 100000) },
    otro: { role: 'gerencia', label: 'Otro', salt, iter: 100000, hash: await hashCode('xxxx', salt, 100000) },
  };
  assert.equal((await buscarUsuario('  rosa1 ', loginAuth)).id, 'ana');
  assert.equal(await buscarUsuario('nada', loginAuth), null);
});

test('la entrada pública nunca incluye salt ni hash', () => {
  const e = entryPublica({ role: 'florista', label: 'Ana', floristaNombre: 'Ana', salt: 's', hash: 'h' });
  assert.deepEqual(e, { role: 'florista', label: 'Ana', floristaNombre: 'Ana' });
});

test('sin los secrets responde 503 para que la app use el ingreso anterior', async () => {
  const res = await handleLogin(new Request('http://x/api/login', { method: 'POST', body: '{"code":"a"}' }), {});
  assert.equal(res.status, 503);
});

test('el chequeo de estado informa sin mostrar valores secretos', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    if (u.includes('loginAuth.json')) return new Response('{"a":{}}');
    if (u.includes('loginDiag')) return new Response('null');
    if (u.includes('accounts:signUp')) return new Response(JSON.stringify({ localId: 'u1' }));
    return new Response(JSON.stringify({ error: { message: 'EMAIL_NOT_FOUND' } }), { status: 400 });
  };
  try {
    const { handleEstado } = await import('../worker/login.js');
    const res = await handleEstado({ FIREBASE_DB_SECRET: 'supersecreto', AUTH_PEPPER: 'pimienta', FIREBASE_API_KEY: 'k' });
    const txt = await res.text();
    assert.ok(!txt.includes('supersecreto') && !txt.includes('pimienta'));
    const d = JSON.parse(txt);
    assert.equal(d.lecturaLoginAuth, 'ok');
    assert.equal(d.autenticacion, 'EMAIL_NOT_FOUND');
    assert.equal(d.cuentaDePrueba, 'ok');
    assert.equal(d.escrituraBase, 'ok');
    assert.equal(typeof d.hashTresMs, 'number');
    assert.deepEqual(d.secrets, { FIREBASE_DB_SECRET: true, AUTH_PEPPER: true, FIREBASE_API_KEY: true });
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('buscarUsuario ignora hashes viejos (150k) que el Worker no puede calcular', async () => {
  const salt = btoa('sal-vieja-123456');
  const loginAuth = { viejo: { role: 'comercial', label: 'Viejo', salt, hash: await hashCode('abc1', salt) } };
  assert.equal(await buscarUsuario('abc1', loginAuth), null);
});
