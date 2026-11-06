import test from 'node:test';
import assert from 'node:assert/strict';
const { sugerirPedido, avisoTemporada, textoPedido } = await import('../src/modules/sugerencia-pedido-base.js');

const stock = [
  { prod: 'Rosas', area: 'Florería', actual: 10, min: 40, max: 100 },
  { prod: 'Pino', area: 'Florería', actual: 50, min: 10, max: 30 },
  { prod: 'Lisianthus', area: 'Florería', actual: 30, min: 20, max: 60 },   // bajo solo por un evento
  { prod: 'Gerbera', area: 'Florería', actual: 5, min: 20, max: 40 },       // viene en camino
  { prod: 'Astromelia', area: 'Florería', actual: 0, min: 20, max: 40 },    // sin datos de paquete
];
const base = {
  stock,
  comprometido: s => (s.prod === 'Lisianthus' ? 25 : 0),
  enPedido: s => (s.prod === 'Gerbera' ? 40 : 0),
  varasPorPaq: p => ({ Rosas: 25, Lisianthus: 10, Gerbera: 10 }[p] || 0),
  ultimaCompra: p => ({ Rosas: { precio: 50000, prov: 'Mercado' }, Lisianthus: { precio: 30000, prov: 'Mercado' } }[p] || null),
  estadoTemporada: p => (p === 'Lisianthus' ? 'termina' : null),
};

test('sugiere solo lo que queda por debajo del mínimo', () => {
  const r = sugerirPedido(base);
  assert.deepEqual(r.items.map(i => i.prod).sort(), ['Astromelia', 'Lisianthus', 'Rosas']);
});

test('calcula paquetes, costo y motivo', () => {
  const r = sugerirPedido(base);
  const rosas = r.items.find(i => i.prod === 'Rosas');
  assert.equal(rosas.faltan, 90);      // objetivo 100 − libre 10
  assert.equal(rosas.paquetes, 4);     // 90 / 25 → 4
  assert.equal(rosas.costo, 200000);
  assert.equal(rosas.motivo, 'bajo');
  const lis = r.items.find(i => i.prod === 'Lisianthus');
  assert.equal(lis.motivo, 'evento');
  assert.equal(lis.libre, 5);
  assert.equal(lis.temporada, 'termina');
  const astro = r.items.find(i => i.prod === 'Astromelia');
  assert.equal(astro.paquetes, null);
  assert.equal(astro.costo, null);
});

test('agrupa por proveedor y deja "sin proveedor" al final', () => {
  const r = sugerirPedido(base);
  assert.deepEqual(r.porProveedor.map(g => g.prov), ['Mercado', '']);
  assert.equal(r.porProveedor[0].costo, 200000 + r.items.find(i => i.prod === 'Lisianthus').costo);
  assert.equal(r.porProveedor[1].sinCosto, 1);
});

test('lo más urgente va primero', () => {
  const r = sugerirPedido(base);
  assert.equal(r.items[0].prod, 'Astromelia');
});

test('avisos y texto del pedido', () => {
  assert.match(avisoTemporada('termina'), /Último mes/);
  assert.equal(avisoTemporada('temporada'), '');
  const g = sugerirPedido(base).porProveedor[0];
  const t = textoPedido(g, { fecha: '07/11' });
  assert.match(t, /Hola Mercado/);
  assert.match(t, /4 paq de Rosas \(100 varas\)/);
});
