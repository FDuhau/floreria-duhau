import test from 'node:test';
import assert from 'node:assert/strict';
const B = await import('../src/modules/reclamos-base.js');

const compras = [
  { prod: 'Rosa', prov: 'Mercado', fecha: '2026-11-05', qty: 10, estado: 'controlado', paqRecibidos: 8 },
  { prod: 'Lisianthus', prov: 'Mercado', fecha: '2026-11-05', qty: 5, estado: 'recibido', paqRecibidos: 5, recepAlerta: true, recepObs: 'marchitas' },
  { prod: 'Clavel', prov: 'Otro', fecha: '2026-11-05', qty: 4, estado: 'controlado', paqRecibidos: 4 },       // todo bien
  { prod: 'Fresia', prov: 'Otro', fecha: '2026-11-05', qty: 4, estado: 'pedido' },                             // sin controlar: no hay faltante aún
  { prod: 'Ya reclamado', prov: 'Otro', fecha: '2026-11-05', qty: 4, estado: 'controlado', paqRecibidos: 1, reclamado: true },
  { prod: 'Vieja', prov: 'Otro', fecha: '2026-09-01', qty: 4, estado: 'controlado', paqRecibidos: 1 },
  { prod: 'Anulada', prov: 'Otro', fecha: '2026-11-05', qty: 4, estado: 'controlado', paqRecibidos: 1, anulado: true },
];

test('agrupa por proveedor lo que falta o llegó mal', () => {
  const g = B.reclamosPendientes(compras, { hoy: '2026-11-06' });
  assert.deepEqual(g.map(x => [x.prov, x.items.length]), [['Mercado', 2]]);
  assert.equal(g[0].items[0].faltan, 2);
  assert.equal(g[0].items[1].malEstado, true);
  assert.equal(B.cantidadReclamos(g), 2);
});

test('mensaje con faltante y mal estado', () => {
  const g = B.reclamosPendientes(compras, { hoy: '2026-11-06' })[0];
  const m = B.mensajeReclamo(g);
  assert.match(m, /Rosa — pedido del 05\/11: faltaron 2 paq \(pedimos 10, llegaron 8\)/);
  assert.match(m, /Lisianthus.*llegó en mal estado \(marchitas\)/);
});

test('sin proveedor igual se agrupa', () => {
  const g = B.reclamosPendientes([{ prod: 'X', fecha: '2026-11-05', qty: 2, estado: 'controlado', paqRecibidos: 1 }], { hoy: '2026-11-06' });
  assert.equal(g[0].prov, 'Sin proveedor');
});
