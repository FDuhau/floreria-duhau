// ── Borrado automático de las fotos de ramos terminados (48 hs) ──────────────
// La app guarda cada foto en fotosRamo/<idVenta> y su hora de carga en
// fotosRamoMeta/<idVenta>. Este job (cron horario) lee solo las horas, que
// pesan unos bytes, y borra en una sola escritura las fotos vencidas.
import { readDb } from './firebase-admin.js';

const DB_URL = 'https://floreria-duhau-84de5-default-rtdb.firebaseio.com';
export const FOTO_RAMO_TTL_MS = 48 * 3600 * 1000;

export function fotosVencidas(meta, ahora = Date.now()) {
  const borrar = {};
  for (const [id, ts] of Object.entries(meta || {})) {
    if (typeof ts !== 'number' || ahora - ts >= FOTO_RAMO_TTL_MS) {
      borrar['fotosRamo/' + id] = null;
      borrar['fotosRamoMeta/' + id] = null;
    }
  }
  return borrar;
}

export async function limpiarFotosRamo(env, ahora = Date.now()) {
  if (!env.FIREBASE_DB_SECRET) return 0;
  const meta = await readDb(DB_URL, 'fotosRamoMeta', env.FIREBASE_DB_SECRET);
  const borrar = fotosVencidas(meta, ahora);
  const n = Object.keys(borrar).length / 2;
  if (!n) return 0;
  // PATCH en la raíz: varias rutas en una sola escritura (null = borrar).
  const r = await fetch(`${DB_URL}/.json?auth=${encodeURIComponent(env.FIREBASE_DB_SECRET)}`, {
    method: 'PATCH',
    body: JSON.stringify(borrar),
  });
  if (!r.ok) throw new Error('db ' + r.status);
  return n;
}
