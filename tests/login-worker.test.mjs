import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createVerify } from 'node:crypto';
import { mintCustomToken } from '../worker/firebase-admin.js';
import { hashCode, buscarUsuario, entryPublica, handleLogin } from '../worker/login.js';

const b64 = (u8) => Buffer.from(u8).toString('base64');

test('el token personalizado queda firmado y lleva uid y rol', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  const sa = { client_email: 'x@proyecto.iam.gserviceaccount.com', private_key: pem };
  const tok = await mintCustomToken(sa, 'euge', { role: 'comercial' }, 1000);
  const [h, p, s] = tok.split('.');
  const v = createVerify('RSA-SHA256');
  v.update(`${h}.${p}`);
  assert.ok(v.verify(publicKey, Buffer.from(s, 'base64url')));
  const body = JSON.parse(Buffer.from(p, 'base64url').toString());
  assert.equal(body.uid, 'euge');
  assert.equal(body.claims.role, 'comercial');
  assert.equal(body.exp, 4600);
});

test('el hash coincide con el de la app y encuentra al dueño del código', async () => {
  const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
  const loginAuth = {
    ana: { role: 'florista', label: 'Ana', salt, hash: await hashCode('Rosa1', salt) },
    otro: { role: 'gerencia', label: 'Otro', salt, hash: await hashCode('xxxx', salt) },
  };
  assert.equal((await buscarUsuario('  rosa1 ', loginAuth)).id, 'ana');
  assert.equal(await buscarUsuario('nada', loginAuth), null);
});

test('la entrada pública nunca incluye salt ni hash', () => {
  const e = entryPublica({ role: 'florista', label: 'Ana', floristaNombre: 'Ana', salt: 's', hash: 'h' });
  assert.deepEqual(e, { role: 'florista', label: 'Ana', floristaNombre: 'Ana' });
});

test('sin clave de servicio responde 503 para que la app use el ingreso anterior', async () => {
  const res = await handleLogin(new Request('http://x/api/login', { method: 'POST', body: '{"code":"a"}' }), {});
  assert.equal(res.status, 503);
});
