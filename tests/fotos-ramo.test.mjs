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
