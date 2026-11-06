import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis.window || {};
globalThis.document = globalThis.document || { getElementById: () => null };

const { cambiosDePrecio, impactoEnComposiciones, resumenCambios } = await import('../src/modules/alertas-precio.js');
const lim = { importada: 2500, premium: 5000 };

const compras = [
  { prod: 'Lisianthus', fecha: '2026-10-20', costo: '24000', varasPorPaq: 8 },   // 3000 → importada
  { prod: 'lisianthus', fecha: '2026-11-04', costo: '48000', varasPorPaq: 8 },   // 6000 → premium
  { prod: 'Rosas', fecha: '2026-10-20', costo: '50000', varasPorPaq: 25 },        // 2000
  { prod: 'Rosas', fecha: '2026-11-04', costo: '51000', varasPorPaq: 25 },        // 2040 (+2%)
  { prod: 'Pino', fecha: '2026-10-01', costo: '10000', varasPorPaq: 10 },
  { prod: 'Pino', fecha: '2026-10-05', costo: '5000', varasPorPaq: 10 },          // viejo, fuera de ventana
  { prod: 'Flete', fecha: '2026-11-01', costo: '9000' },
];

test('detecta suba de categoría y deja afuera cambios chicos, viejos y gastos', () => {
  const c = cambiosDePrecio(compras, { hoy: '2026-11-06', limites: lim });
  assert.equal(c.length, 1);
  assert.equal(c[0].cambioCategoria, true);
  assert.equal(c[0].subio, true);
  assert.equal(c[0].catAntes.id, 'importada');
  assert.equal(c[0].catAhora.id, 'premium');
  assert.equal(Math.round(c[0].pct), 100);
});

test('una baja grande sin cambio de categoría también avisa', () => {
  const c = cambiosDePrecio([
    { prod: 'Gerbera', fecha: '2026-11-01', costo: '10000', varasPorPaq: 10 },
    { prod: 'Gerbera', fecha: '2026-11-05', costo: '6000', varasPorPaq: 10 },
  ], { hoy: '2026-11-06', limites: lim });
  assert.equal(c.length, 1);
  assert.equal(c[0].subio, false);
  assert.equal(c[0].cambioCategoria, false);
});

test('impacto en composiciones suma las varas de la flor', () => {
  const imp = impactoEnComposiciones('Lisianthus', 3000, 6000, {
    recetas: [{ nombre: 'Ramo chico', ings: [{ prod: 'lisianthus', qty: 3 }, { prod: 'Rosas', qty: 5 }] }, { nombre: 'Otro', ings: [{ prod: 'Pino', qty: 2 }] }],
    arreglos: { 'Lobby': [{ prod: 'Lisianthus', qty: 10 }] },
  });
  assert.deepEqual(imp.map(i => [i.nombre, i.dif]), [['Lobby', 30000], ['Ramo chico', 9000]]);
});

test('resumen corto', () => {
  assert.equal(resumenCambios([]), null);
  const c = cambiosDePrecio(compras, { hoy: '2026-11-06', limites: lim });
  assert.match(resumenCambios(c), /subió de categoría: lisianthus/i);
});
