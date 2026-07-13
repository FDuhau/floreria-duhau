// ── Web Push desde el Worker (sin dependencias) ──────────────────────────────
// Implementa el cifrado de payload RFC 8291 (aes128gcm) y la autorización
// VAPID RFC 8292 usando WebCrypto. Verificado contra el vector de prueba del
// Apéndice A del RFC 8291 (ver scratch de tests del repo de sesión).

const te = new TextEncoder();

export function b64uToBytes(s){
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const bin = atob(s + pad);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

export function bytesToB64u(bytes){
  let bin = '';
  new Uint8Array(bytes).forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concat(...arrs){
  const len = arrs.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  arrs.forEach(a => { out.set(a, off); off += a.length; });
  return out;
}

async function hkdf(salt, ikm, info, len){
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, len * 8));
}

// Cifrado aes128gcm con claves efímeras y salt provistos (inyectables para test)
export async function encryptWithKeys(sub, payloadStr, asKeyPair, salt){
  const uaPub = b64uToBytes(sub.keys.p256dh);      // punto público del navegador (65 bytes)
  const authSecret = b64uToBytes(sub.keys.auth);   // secreto de autenticación (16 bytes)
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asKeyPair.privateKey, 256));
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', asKeyPair.publicKey)); // 65 bytes

  const keyInfo = concat(te.encode('WebPush: info\0'), uaPub, asPub);
  const ikm   = await hkdf(authSecret, ecdh, keyInfo, 32);
  const cek   = await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);

  // Payload + delimitador de padding (0x02 = último registro)
  const plaintext = concat(te.encode(payloadStr), new Uint8Array([2]));
  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, plaintext));

  // Header aes128gcm: salt(16) | record size(4) | idlen(1) | clave pública efímera(65)
  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096);
  header[20] = 65;
  header.set(asPub, 21);
  return concat(header, ct);
}

export async function encryptPayload(sub, payloadStr){
  const asKeyPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return encryptWithKeys(sub, payloadStr, asKeyPair, salt);
}

// Header Authorization VAPID (RFC 8292): JWT ES256 firmado con la clave privada
export async function vapidAuthHeader(endpoint, publicKeyB64u, privateKeyB64u, subject){
  const pubBytes = b64uToBytes(publicKeyB64u); // 0x04 | x(32) | y(32)
  const jwk = {
    kty: 'EC', crv: 'P-256',
    x: bytesToB64u(pubBytes.slice(1, 33)),
    y: bytesToB64u(pubBytes.slice(33, 65)),
    d: privateKeyB64u,
  };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const aud = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600;
  const unsigned = bytesToB64u(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
    + '.' + bytesToB64u(te.encode(JSON.stringify({ aud, exp, sub: subject })));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, te.encode(unsigned)));
  return `vapid t=${unsigned}.${bytesToB64u(sig)}, k=${publicKeyB64u}`;
}

// Envía un push a una suscripción. Devuelve el status HTTP del push service.
export async function sendWebPush(sub, payloadStr, vapidPublic, vapidPrivate, subject){
  const body = await encryptPayload(sub, payloadStr);
  const auth = await vapidAuthHeader(sub.endpoint, vapidPublic, vapidPrivate, subject);
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
      'Urgency': 'high',
    },
    body,
  });
  return res.status;
}
