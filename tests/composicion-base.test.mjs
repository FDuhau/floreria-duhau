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

test('sumarBaseHotel suma fracciones entre áreas antes de pasar a paquetes', () => {
  const areas = Array.from({length:10}, (_,i)=>({area:'A'+i, ings:[{prod:'Rosa', qty:1/3}]}));
  const r = B.sumarBaseHotel(areas, () => 25);
  assert.equal(r.length, 1);
  assert.equal(r[0].qty, 1);
  assert.equal(r[0].areas.length, 10);
});
test('sumarBaseHotel redondea para arriba y respeta unidad paq y flor sin dato', () => {
  const r = B.sumarBaseHotel([
    {area:'A', ings:[{prod:'Lisianthus', qty:20}, {prod:'Clavel', qty:2, unidad:'paq'}, {prod:'X', qty:3}]},
    {area:'B', ings:[{prod:'Lisianthus', qty:20}]},
  ], p => p==='Lisianthus' ? 25 : 0);
  const por = Object.fromEntries(r.map(x=>[x.prod,x.qty]));
  assert.equal(por.Lisianthus, 2);
  assert.equal(por.Clavel, 2);
  assert.equal(por.X, 3);
});
test('sumarBaseHotel con factor 0,3 (reposición del viernes) pide el 30% de la base', () => {
  const areas = [{area:'A', ings:[{prod:'Rosa', qty:50}, {prod:'Pino', qty:10}]}];
  const r = Object.fromEntries(B.sumarBaseHotel(areas, () => 25, 0.3).map(x=>[x.prod,x.qty]));
  assert.equal(r.Rosa, 1);   // 50 varas = 2 paq → 0,6 → 1 paq
  const toda = Object.fromEntries(B.sumarBaseHotel(areas, () => 25, 1).map(x=>[x.prod,x.qty]));
  assert.equal(toda.Rosa, 2);
});
