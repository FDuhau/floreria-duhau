import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = globalThis.window || {};
globalThis.document = globalThis.document || { getElementById: () => null };

const { categoriaVara, limitesCategoriaVara, historialCostoVara, cartelCategoriaVara } = await import('../src/modules/categoria-vara.js');

test('categoría según límites por defecto', () => {
  const lim = { importada: 2500, premium: 5000 };
  assert.equal(categoriaVara(0, lim), null);
  assert.equal(categoriaVara(1200, lim).id, 'estacion');
  assert.equal(categoriaVara(2500, lim).id, 'importada');
  assert.equal(categoriaVara(4999, lim).id, 'importada');
  assert.equal(categoriaVara(5000, lim).id, 'premium');
});

test('límites inválidos vuelven a los de por defecto', () => {
  assert.deepEqual(limitesCategoriaVara({}), { importada: 2500, premium: 5000 });
  assert.deepEqual(limitesCategoriaVara({ categoriasVara: { importada: 3000, premium: 8000 } }), { importada: 3000, premium: 8000 });
  assert.deepEqual(limitesCategoriaVara({ categoriasVara: { importada: 3000, premium: 1000 } }), { importada: 3000, premium: 6000 });
});

test('historial de costo por vara usa las últimas varas por paquete conocidas', () => {
  const compras = [
    { prod: 'Lisianthus', fecha: '2026-10-01', costo: '10000', varasPorPaq: 10 },
    { prod: 'lisianthus', fecha: '2026-11-04', costo: '40000' },               // sin varas/paq → usa 10
    { prod: 'Lisianthus', fecha: '2026-10-20', costo: '99999', varasPorPaq: 10, anulado: true },
    { prod: 'Rosas', fecha: '2026-11-04', costo: '50000', varasPorPaq: 25 },
  ];
  const h = historialCostoVara('Lisianthus', compras);
  assert.deepEqual(h.map(x => x.costoVara), [4000, 1000]);
  assert.deepEqual(historialCostoVara('Lisianthus', compras, compras[1]).map(x => x.costoVara), [1000]);
});

test('cartel avisa cuando cambia de categoría', () => {
  const html = cartelCategoriaVara(6000, 1500);
  assert.match(html, /vara premium/);
  assert.match(html, /subió/);
  assert.match(html, /vara de estación/);
  assert.doesNotMatch(cartelCategoriaVara(1600, 1500), /subió/);
});
