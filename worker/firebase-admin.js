// ── Acceso "admin" a Firebase desde el Worker (sin librerías) ─────────────────
// Usa la clave de servicio (secret FIREBASE_SERVICE_ACCOUNT, JSON) para:
//  - pedir un access token de Google y leer la base aunque las reglas se cierren
//  - firmar tokens personalizados de Firebase Auth con el rol de cada persona
// Todo con WebCrypto, que Workers y Node 20 traen de fábrica.

const enc = new TextEncoder();

function b64url(input) {
  const bytes = typeof input === 'string' ? enc.encode(input) : new Uint8Array(input);
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importKey(pem) {
  const body = pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

// JWT firmado con RS256.
export async function signJwt(payload, privateKeyPem) {
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const key = await importKey(privateKeyPem);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(`${head}.${body}`));
  return `${head}.${body}.${b64url(sig)}`;
}

// Token personalizado de Firebase Auth: el uid es el id del usuario y los
// claims llevan el rol (las reglas de la base leen auth.token.role).
export async function mintCustomToken(sa, uid, claims, now = Math.floor(Date.now() / 1000)) {
  return signJwt(
    {
      iss: sa.client_email,
      sub: sa.client_email,
      aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
      iat: now,
      exp: now + 3600,
      uid,
      claims,
    },
    sa.private_key,
  );
}

// Access token de Google para leer la base con permisos de servicio.
export async function getAccessToken(sa, now = Math.floor(Date.now() / 1000)) {
  const assertion = await signJwt(
    {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    sa.private_key,
  );
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${assertion}`,
  });
  if (!r.ok) throw new Error('token ' + r.status);
  return (await r.json()).access_token;
}

export async function readDb(dbUrl, path, accessToken) {
  const r = await fetch(`${dbUrl}/${path}.json`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) throw new Error('db ' + r.status);
  return r.json();
}
