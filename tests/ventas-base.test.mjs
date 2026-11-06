import test from 'node:test';
import assert from 'node:assert/strict';
const B = await import('../src/modules/ventas-base.js');

test('saldo: solo cuenta lo que está por cobrar o con seña', () => {
  assert.equal(B.saldoVenta({ precio: '85.000', cobro: 'pendiente' }), 85000);
  assert.equal(B.saldoVenta({ precio: '$ 150000', cobro: 'sena', sena: '50.000' }), 100000);
  assert.equal(B.saldoVenta({ precio: '60000', cobro: 'pagado' }), 0);
  assert.equal(B.saldoVenta({ precio: '60000' }), 0);               // venta vieja sin dato
  assert.equal(B.saldoVenta({ precio: '—', cobro: 'pendiente' }), 0);
  assert.equal(B.saldoVenta({ precio: '1000', cobro: 'sena', sena: '5000' }), 0);
});

test('períodos', () => {
  const hoy = '2026-11-06';   // viernes
  assert.ok(B.enPeriodo('2026-11-06', 'hoy', hoy));
  assert.ok(!B.enPeriodo('2026-11-05', 'hoy', hoy));
  assert.ok(B.enPeriodo('2026-11-02', 'semana', hoy));   // lunes
  assert.ok(B.enPeriodo('2026-11-08', 'semana', hoy));   // domingo
  assert.ok(!B.enPeriodo('2026-11-01', 'semana', hoy));
  assert.ok(!B.enPeriodo('2026-11-09', 'semana', hoy));
  assert.ok(B.enPeriodo('2026-11-30', 'mes', hoy));
  assert.ok(!B.enPeriodo('2026-10-31', 'mes', hoy));
  assert.ok(B.enPeriodo('', '', hoy));
  assert.ok(!B.enPeriodo('', 'hoy', hoy));
});

test('resumen y agrupado por día', () => {
  const lista = [
    { v: { precio: '85000', facturado: 'Sí', cobro: 'pagado', fecha: '2026-11-06' }, i: 0 },
    { v: { precio: '120000', facturado: 'No', cobro: 'pendiente', fecha: '2026-11-06' }, i: 1 },
    { v: { precio: '150000', facturado: 'Sí', cobro: 'sena', sena: '50000', fecha: '2026-11-02' }, i: 2 },
  ];
  const r = B.resumenVentas(lista.map(o => o.v));
  assert.equal(r.n, 3);
  assert.equal(r.total, 355000);
  assert.deepEqual(r.porCobrar, { n: 2, monto: 220000 });
  assert.deepEqual(r.sinFacturar, { n: 1, monto: 120000 });
  const g = B.agruparPorDia(lista);
  assert.deepEqual(g.map(x => [x.fecha, x.items.length]), [['2026-11-06', 2], ['2026-11-02', 1]]);
});

test('mensaje y link de WhatsApp', () => {
  const m = B.mensajeWhatsApp({ cliente: 'María López', prod: 'Ramo de rosas', fecha: '2026-11-06', horaEntrega: '15:00', dir: 'Posadas 1086', estado: 'confirmado', precio: '100', cobro: 'pendiente' });
  assert.match(m, /^Hola María!/);
  assert.match(m, /para el 06\/11 a las 15:00/);
  assert.match(m, /Posadas 1086/);
  assert.match(m, /saldo de \$100/);
  assert.match(B.mensajeWhatsApp({ cliente: 'Juan', estado: 'entregado', destinatario: 'Ana Pérez' }), /ya fue entregado a Ana/);
  assert.equal(B.linkWhatsApp('11 5555-1234', 'hola'), 'https://wa.me/541155551234?text=hola');
  assert.equal(B.linkWhatsApp('+54 9 11 5555 1234', 'hola'), 'https://wa.me/5491155551234?text=hola');
  assert.equal(B.linkWhatsApp('', 'a b'), 'https://wa.me/?text=a%20b');
});
