// Tests de la aritmética de dinero (compras, caja, liquidación, márgenes).
// Correr con: npm run test:dinero
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMoney } from '../src/modules/utils.js';
import {
  compraCant, compraImporte, resumenCompras, cajaSigned, saldosCaja,
  horasExtra, margenDeVenta, ingVaras,
} from '../src/modules/dinero.js';

test('parseMoney: formatos argentinos y simples', () => {
  assert.equal(parseMoney('1.150.000,50'), 1150000.5);
  assert.equal(parseMoney('1.150.000'), 1150000);
  assert.equal(parseMoney('1150,5'), 1150.5);
  assert.equal(parseMoney('$ 2.500'), 2500);
  assert.equal(parseMoney('12.5'), 12.5);       // un punto con 1 decimal = decimal
  assert.equal(parseMoney('-3.000,25'), -3000.25);
  assert.equal(parseMoney(''), 0);
  assert.equal(parseMoney(null), 0);
  assert.equal(parseMoney('abc'), 0);
  assert.equal(parseMoney(1500), 1500);
  assert.equal(parseMoney(NaN), 0);
  assert.equal(parseMoney(Infinity), 0);
});

test('compraCant: usa qty; cae a 1 si falta, es 0 o es inválida', () => {
  assert.equal(compraCant({ qty: '3' }), 3);
  assert.equal(compraCant({ qty: 2.5 }), 2.5);
  assert.equal(compraCant({}), 1);
  assert.equal(compraCant({ qty: 0 }), 1);
  assert.equal(compraCant({ qty: -2 }), 1);
  assert.equal(compraCant({ qty: 'x' }), 1);
  assert.equal(compraCant(null), 0);
});

test('compraImporte = precio × cantidad pedida', () => {
  assert.equal(compraImporte({ costo: '1.500,50', qty: 2 }), 3001);
  assert.equal(compraImporte({ costo: 1000 }), 1000);        // sin qty → ×1
  assert.equal(compraImporte({ costo: '', qty: 5 }), 0);
  assert.equal(compraImporte(null), 0);
});

test('resumenCompras: lo anulado no cuenta; recibido vs en pedido', () => {
  const filas = [
    { costo: 1000, qty: 2, estado: 'recibido' },          // 2000 recibido
    { costo: '500', qty: 4, estado: 'pedido' },           // 2000 en pedido
    { costo: 9999, qty: 9, estado: 'recibido', anulado: true }, // ignorada
    { costo: 300, estado: 'pendiente' },                  // 300 en pedido
  ];
  assert.deepEqual(resumenCompras(filas), { total: 4300, recibido: 2000, enPedido: 2, ordenes: 3 });
  assert.deepEqual(resumenCompras([]), { total: 0, recibido: 0, enPedido: 0, ordenes: 0 });
});

test('cajaSigned: ingreso suma, el resto resta', () => {
  assert.equal(cajaSigned({ tipo: 'ingreso', monto: 100 }), 100);
  assert.equal(cajaSigned({ tipo: 'egreso', monto: 100 }), -100);
});

test('saldosCaja: saldo acumulado en orden cronológico, sin fecha al final', () => {
  const caja = [
    { fecha: '2026-03-10', tipo: 'egreso', monto: 300 },   // i=0
    { fecha: '2026-03-01', tipo: 'ingreso', monto: 1000 }, // i=1
    { tipo: 'ingreso', monto: 50 },                        // i=2 (sin fecha → último)
    { fecha: '2026-03-10', tipo: 'ingreso', monto: 200 },  // i=3 (mismo día que i=0, se carga después)
  ];
  const { orden, runByIdx } = saldosCaja(caja);
  assert.deepEqual(orden.map((o) => o.i), [1, 0, 3, 2]);
  assert.deepEqual(runByIdx, { 1: 1000, 0: 700, 3: 900, 2: 950 });
});

test('saldosCaja: no muta el arreglo original y soporta vacío', () => {
  const caja = [{ fecha: '2026-02-01', tipo: 'ingreso', monto: 1 }, { fecha: '2026-01-01', tipo: 'ingreso', monto: 1 }];
  saldosCaja(caja);
  assert.equal(caja[0].fecha, '2026-02-01');
  assert.deepEqual(saldosCaja([]), { orden: [], runByIdx: {} });
});

test('horasExtra: trabajadas − programadas, recargo 50 %, nunca negativo', () => {
  assert.deepEqual(horasExtra(160, 170, 1000), { hExtra: 10, adicional: 15000 });
  assert.deepEqual(horasExtra(160, 160, 1000), { hExtra: 0, adicional: 0 });
  assert.deepEqual(horasExtra(160, 150, 1000), { hExtra: 0, adicional: 0 });   // faltó: no resta
  assert.deepEqual(horasExtra(160, 162.25, 800), { hExtra: 2.3, adicional: 2760 }); // redondeo a 0,1
  assert.deepEqual(horasExtra(10, 12, 0), { hExtra: 2, adicional: 0 });
  assert.deepEqual(horasExtra(10, 12, undefined), { hExtra: 2, adicional: 0 });
  assert.equal(horasExtra(0, 0.1, 333.33).adicional, 50);                       // 2 decimales
});

test('margenDeVenta: precio − costo − envío; null si no hay costo', () => {
  assert.equal(margenDeVenta({ precio: '45.000', envioCosto: '3.000' }, 20000), 22000);
  assert.equal(margenDeVenta({ precio: 10000 }, 4000), 6000);
  assert.equal(margenDeVenta({ precio: 10000, envioCosto: 12000 }, 4000), -6000);
  assert.equal(margenDeVenta({ precio: 10000 }, null), null);
});

test('ingVaras: "paq" se multiplica por varas/paquete; varas quedan igual', () => {
  assert.equal(ingVaras({ qty: '2', unidad: 'paq' }, 25), 50);
  assert.equal(ingVaras({ qty: 3, unidad: 'vara' }, 25), 3);
  assert.equal(ingVaras({ qty: 'x', unidad: 'paq' }, 25), 0);
  assert.equal(ingVaras({ qty: 2, unidad: 'paq' }, 0), 0);   // sin dato de varas/paquete
});
