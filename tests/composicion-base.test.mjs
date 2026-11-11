import test from 'node:test';
import assert from 'node:assert/strict';
const B = await import('../src/modules/composicion-base.js');

const stock = { Rosa: 25, Eucalipto: 4, Lisianthus: 0 };
const disp = p => stock[p] || 0;
const varas = ing => ing.qty;

test('el ingrediente que más se acaba marca cuántos alcanzan', () => {
  const r = B.unidadesPosibles([{ prod: 'Rosa', qty: 5 }, { prod: 'Eucalipto', qty: 3 }], varas, disp);
  assert.equal(r.n, 1);                 // 4 / 3 = 1
  assert.equal(r.limitante, 'Eucalipto');
  assert.deepEqual(r.sinStock, []);
});

test('sin stock de un ingrediente no se puede armar y se avisa cuál', () => {
  const r = B.unidadesPosibles([{ prod: 'Rosa', qty: 5 }, { prod: 'Lisianthus', qty: 2 }], varas, disp);
  assert.equal(r.n, 0);
  assert.deepEqual(r.sinStock, ['Lisianthus']);
});

test('fracciones de vara y sin ingredientes', () => {
  assert.equal(B.unidadesPosibles([{ prod: 'Rosa', qty: 1 / 3 }], varas, disp).n, 75);
  assert.equal(B.unidadesPosibles([], varas, disp), null);
  assert.equal(B.unidadesPosibles([{ prod: 'Rosa', qty: 0 }], varas, disp), null);
});

test('precio sugerido con margen', () => {
  assert.equal(B.precioSugerido(10000, 30), 13000);
  assert.equal(B.precioSugerido(0, 30), 0);
});
