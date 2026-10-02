// ════════════════════════════════════════════════════════════
//  Aritmética de dinero (pura, sin DOM ni estado de la app)
//  Extraída de app.js para poder testearla (tests/dinero.test.mjs).
//  Las funciones que necesitan datos de la app (precios, varas por
//  paquete) los reciben por parámetro.
// ════════════════════════════════════════════════════════════
import { parseMoney } from './utils.js';

// Cantidad de paquetes de una compra. Fallback a 1 para filas viejas sin
// cantidad cargada, así no se anula su importe.
export function compraCant(r) {
  if (!r) return 0;
  const q = parseFloat(r.qty);
  return !isNaN(q) && q > 0 ? q : 1;
}

// Importe de una línea de compra = precio (por paquete) × cantidad pedida.
export function compraImporte(r) {
  return parseMoney(r && r.costo) * compraCant(r);
}

// Totales del resumen de compras. Lo anulado no cuenta en nada.
export function resumenCompras(filas) {
  const activas = filas.filter((r) => !r.anulado);
  const total = activas.reduce((s, r) => s + compraImporte(r), 0);
  const recibido = activas.filter((r) => r.estado === 'recibido').reduce((s, r) => s + compraImporte(r), 0);
  const enPedido = activas.filter((r) => r.estado !== 'recibido').length;
  return { total, recibido, enPedido, ordenes: activas.length };
}

// Movimiento de caja con signo: ingreso suma, cualquier otro tipo resta.
export function cajaSigned(r) {
  return r.tipo === 'ingreso' ? r.monto : -r.monto;
}

// Orden cronológico (los sin fecha al final, desempate por orden de carga) y
// saldo acumulado por movimiento. Devuelve { orden:[{r,i}], runByIdx }.
export function saldosCaja(cajaData) {
  const orden = cajaData
    .map((r, i) => ({ r, i }))
    .sort((a, b) => (a.r.fecha || '9999-12-31').localeCompare(b.r.fecha || '9999-12-31') || a.i - b.i);
  let running = 0;
  const runByIdx = {};
  orden.forEach(({ r, i }) => {
    running += cajaSigned(r);
    runByIdx[i] = running;
  });
  return { orden, runByIdx };
}

// Horas extra y su importe (recargo 50 %). Las horas se redondean a 0,1.
export function horasExtra(programadas, trabajadas, valorHora) {
  const hExtra = Math.max(0, Math.round((trabajadas - programadas) * 10) / 10);
  const adicional = +(hExtra * (+valorHora || 0) * 1.5).toFixed(2);
  return { hExtra, adicional };
}

// Margen de una venta = precio − costo − costo de envío. null sin costo estimable.
export function margenDeVenta(v, costo) {
  if (costo == null) return null;
  return parseMoney(v.precio) - costo - parseMoney(v.envioCosto);
}

// Cantidad de un ingrediente expresada en varas (si es "paq", × varas/paquete).
export function ingVaras(ing, varasPorPaq) {
  const q = +ing.qty || 0;
  return ing && ing.unidad === 'paq' ? q * varasPorPaq : q;
}

// Costo del hotel en un mes (YYYY-MM): compras de florería con área del hotel,
// sin evento asociado y sin anular ni "no llegó". Agrupa por área (arreglo).
// Las que no tienen área cargada no entran al total: se devuelven aparte
// ("sinArea") para que se puedan revisar. Devuelve { areas:[{area,total,lineas}], total, sinArea }.
export function costoHotelMes(compras, mes) {
  const areas = new Map();
  const sinArea = [];
  let total = 0;
  for (const r of compras || []) {
    if (!r || r.anulado || r.noLlego) continue;
    if (String(r.fecha || '').slice(0, 7) !== mes) continue;
    if (r.eventoId || (Array.isArray(r.eventos) && r.eventos.length)) continue;
    const area = String(r.sector || '').trim();
    if (area.toLowerCase() === 'evento') continue;
    if (!area) { sinArea.push(r); continue; }
    const importe = compraImporte(r);
    if (!areas.has(area)) areas.set(area, { area, total: 0, lineas: [] });
    const a = areas.get(area);
    a.total += importe;
    a.lineas.push(r);
    total += importe;
  }
  const lista = [...areas.values()].sort((x, y) => y.total - x.total);
  return { areas: lista, total, sinArea };
}
