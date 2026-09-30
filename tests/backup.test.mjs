// Tests del backup (Node 20+): retención, y flujo completo con R2 y Firebase simulados.
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { keysToDelete, dayKey, backupDatabase, runScheduledBackup } from '../worker/backup.js';

// ── retención ──
const now = new Date('2026-09-30T07:00:00Z');
const keys = ['2026-09-29', '2026-08-31', '2026-08-30', '2026-09-01', '2025-09-01', '2024-01-01', '2024-01-02']
  .map(d => `daily/${d}.json.gz`).concat(['daily/raro.txt']);
assert.deepEqual(keysToDelete(keys, now).sort(), [
  'daily/2024-01-01.json.gz', 'daily/2024-01-02.json.gz', 'daily/2026-08-30.json.gz',
].sort());
assert.equal(dayKey(now), 'daily/2026-09-30.json.gz');

// ── R2 simulado ──
function fakeR2(){
  const store = new Map();
  return {
    store,
    async createMultipartUpload(k){
      const chunks = [];
      return {
        async uploadPart(n, data){ chunks[n - 1] = Buffer.from(data); return { partNumber: n }; },
        async complete(){ store.set(k, Buffer.concat(chunks)); },
        async abort(){},
      };
    },
    async get(k){ const b = store.get(k); return b && { body: new Blob([b]).stream() }; },
    async put(k, v){ store.set(k, typeof v === 'string' ? Buffer.from(v) : Buffer.from(await new Response(v).arrayBuffer())); },
    async head(k){ const b = store.get(k); return b && { size: b.length }; },
    async delete(k){ (Array.isArray(k) ? k : [k]).forEach(x => store.delete(x)); },
    async list({ prefix }){ return { objects: [...store.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })), truncated: false }; },
  };
}
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const sa = { client_email: 'bk@x.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }) };
const data = JSON.stringify({ eventos: Object.fromEntries(Array.from({ length: 3000 }, (_, i) => ['e' + i, { n: 'evento ' + i, x: Math.random() }])) });

const mkFetch = (dbBody, dbStatus = 200) => async (url) => {
  if(String(url).includes('oauth2')) return new Response(JSON.stringify({ access_token: 't' }));
  return new Response(dbBody, { status: dbStatus });
};
const mkEnv = () => ({ BACKUPS: fakeR2(), FIREBASE_SERVICE_ACCOUNT: JSON.stringify(sa), FIREBASE_DB_URL: 'https://db.example.com/' });

// backup correcto: el gzip subido descomprime al JSON original
{
  const env = mkEnv();
  const r = await backupDatabase(env, { fetchFn: mkFetch(data), now });
  assert.equal(r.key, 'daily/2026-09-30.json.gz');
  assert.equal(gunzipSync(env.BACKUPS.store.get(r.key)).toString(), data);
  assert.equal(env.BACKUPS.store.size, 1, 'no deja temporales');
}
// base vacía → falla y no pisa nada
{
  const env = mkEnv();
  await assert.rejects(backupDatabase(env, { fetchFn: mkFetch('null'), now }), /vacía/);
  assert.equal(env.BACKUPS.store.size, 0);
}
// Firebase caído → falla, registra _last.json con ok:false
{
  const env = mkEnv();
  await assert.rejects(runScheduledBackup(env, { fetchFn: mkFetch('x', 500), now }), /500/);
  assert.equal(JSON.parse(env.BACKUPS.store.get('_last.json')).ok, false);
}
// cron completo: backup + limpieza
{
  const env = mkEnv();
  env.BACKUPS.store.set('daily/2020-05-05.json.gz', Buffer.from('viejo'));
  const s = await runScheduledBackup(env, { fetchFn: mkFetch(data), now });
  assert.equal(s.pruned, 1);
  assert.ok(!env.BACKUPS.store.has('daily/2020-05-05.json.gz'));
}
// base grande (datos poco comprimibles → varias partes de 5 MiB)
{
  const { randomBytes } = await import('node:crypto');
  const big = JSON.stringify({ blob: randomBytes(16 * 1024 * 1024).toString('base64') });
  const env = mkEnv();
  const r = await backupDatabase(env, { fetchFn: mkFetch(big), now });
  assert.ok(r.gzBytes > 10 * 1024 * 1024, 'debió usar 3 partes');
  assert.equal(gunzipSync(env.BACKUPS.store.get(r.key)).toString(), big);
}
console.log('backup tests OK');
