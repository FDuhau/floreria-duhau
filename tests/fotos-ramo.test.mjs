import test from 'node:test';
import assert from 'node:assert/strict';
import { fotosVencidas, FOTO_RAMO_TTL_MS } from '../worker/fotos-ramo.js';

test('fotosVencidas borra solo las fotos con 48 hs o más', () => {
  const ahora = 1_800_000_000_000;
  const meta = {
    nueva: ahora - 3600 * 1000,
    justo: ahora - FOTO_RAMO_TTL_MS,
    vieja: ahora - FOTO_RAMO_TTL_MS - 1,
    rota: 'x',
  };
  assert.deepEqual(fotosVencidas(meta, ahora), {
    'fotosRamo/justo': null, 'fotosRamoMeta/justo': null,
    'fotosRamo/vieja': null, 'fotosRamoMeta/vieja': null,
    'fotosRamo/rota': null, 'fotosRamoMeta/rota': null,
  });
});

test('fotosVencidas sin datos no borra nada', () => {
  assert.deepEqual(fotosVencidas(null), {});
});

test('la marca de foto sale de fotosRamoMeta y la venta guarda que hubo foto', async () => {
  globalThis.window ??= {};
  const m = await import('../src/modules/fotos-ramo.js');
  const ahora = Date.now();
  const v = { id: 'a', fotoRamoTs: ahora - 1000 };
  // Antes de que llegue la meta, vale la marca de la venta.
  assert.equal(m.fotoRamoVigente(v), true);
  // Con la meta cargada manda la meta: si no está, la foto ya no existe.
  m.setFotosRamoMeta({});
  assert.equal(m.fotoRamoVigente(v), false);
  assert.equal(m.fotoRamoHubo(v), true);
  m.setFotosRamoMeta({ a: ahora - 1000, b: ahora - m.FOTO_RAMO_TTL_MS - 1 });
  assert.equal(m.fotoRamoVigente(v), true);
  assert.equal(m.fotoRamoVigente({ id: 'b' }), false);
  // Una venta sin marca pero con foto en la meta también cuenta.
  assert.equal(m.fotoRamoVigente({ id: 'a' }), true);
  assert.match(m.fotoRamoBtn(0, v), /foto-ramo-pill ok/);
  assert.match(m.fotoRamoBtn(0, { id: 'x', fotoRamoTs: 1, fin: '10:00' }), /Tuvo foto/);
});
