import test from 'node:test';
import assert from 'node:assert/strict';
import { armarResumen, mailResumen, hoyArgentina } from '../worker/resumen-diario.js';

test('hoy en Argentina (UTC-3)', () => {
  assert.equal(hoyArgentina(Date.parse('2026-11-07T02:30:00Z')), '2026-11-06');
  assert.equal(hoyArgentina(Date.parse('2026-11-06T11:00:00Z')), '2026-11-06');
});

test('arma el resumen con entregas, eventos, stock y precios', () => {
  const r = armarResumen({
    hoy: '2026-11-06',
    ventas: [
      { prod: 'Ramo <rosas>', fecha: '2026-11-06', horaEntrega: '15:00', estado: 'confirmado', destinatario: 'Ana' },
      { prod: 'Caja', fecha: '2026-11-06', horaEntrega: '10:00', estado: 'pendiente' },
      { prod: 'Hecho', fecha: '2026-11-06', estado: 'entregado' },
      { prod: 'Ayer', fecha: '2026-11-05', estado: 'pendiente' },
      { prod: 'Muy viejo', fecha: '2026-09-01', estado: 'pendiente' },
    ],
    eventos: { 0: { nombre: 'Boda', fecha: '2026-11-06', estado: 'Pedidos Pendientes' }, 1: { nombre: 'Cena', fecha: '2026-11-09', estado: 'Pedidos Pendientes' } },
    stock: [{ prod: 'Rosas', actual: 5, min: 20 }, { prod: 'Pino', actual: 50, min: 10 }],
    compras: [
      { prod: 'Lisianthus', fecha: '2026-11-01', costo: '24000', varasPorPaq: 8 },
      { prod: 'Lisianthus', fecha: '2026-11-05', costo: '48000', varasPorPaq: 8 },
    ],
  });
  assert.deepEqual(r.entregasHoy.map((v) => v.prod), ['Caja', 'Ramo <rosas>']);
  assert.deepEqual(r.atrasadas.map((v) => v.prod), ['Ayer']);
  assert.equal(r.eventosHoy.length, 1);
  assert.equal(r.proximos.length, 1);
  assert.deepEqual(r.stockBajo.map((s) => s.prod), ['Rosas']);
  assert.equal(r.precios.length, 1);
  const m = mailResumen(r);
  assert.match(m.asunto, /2 entregas, 1 evento/);
  assert.ok(m.html.includes('Ramo &lt;rosas&gt;'));
  assert.ok(m.html.includes('Lisianthus'));
});

test('sin datos igual arma un mail válido', () => {
  const m = mailResumen(armarResumen({ hoy: '2026-11-06' }));
  assert.match(m.html, /No hay entregas pendientes/);
});
