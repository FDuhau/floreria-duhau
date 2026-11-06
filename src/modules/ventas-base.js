// ── VENTAS EXTERNAS: lógica pura (sin pantalla) ──────────────────────────────
// Cobro, períodos, resumen de números y mensajes para el cliente.

const num = x => {
  if(typeof x === 'number') return isFinite(x) ? x : 0;
  const s = String(x ?? '').replace(/[^\d,.-]/g, '');
  if(!s) return 0;
  // "85.000" / "85.000,50" → miles con punto, decimales con coma
  const t = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : (/\.\d{3}$/.test(s) ? s.replace(/\./g, '') : s);
  const n = parseFloat(t);
  return isFinite(n) ? n : 0;
};
export const montoVenta = v => num(v?.precio);

export const COBRO_LABEL = { pagado: 'Cobrado', sena: 'Con seña', pendiente: 'Por cobrar' };

// Lo que falta cobrar de una venta. Sin dato de cobro ('' / undefined) no se
// cuenta: las ventas viejas no tienen el dato y no hay que marcarlas como deuda.
export function saldoVenta(v){
  const total = montoVenta(v);
  if(!(total > 0)) return 0;
  if(v?.cobro === 'pendiente') return total;
  if(v?.cobro === 'sena') return Math.max(total - num(v.sena), 0);
  return 0;
}

// ¿La fecha (YYYY-MM-DD) cae en el período? hoy | semana (lunes a domingo) | mes | '' (todo)
export function enPeriodo(fecha, periodo, hoy){
  if(!periodo) return true;
  const f = String(fecha || '').slice(0, 10);
  if(!f) return false;
  if(periodo === 'hoy') return f === hoy;
  if(periodo === 'mes') return f.slice(0, 7) === hoy.slice(0, 7);
  if(periodo === 'semana'){
    const d = new Date(hoy + 'T12:00:00Z');
    const dow = (d.getUTCDay() + 6) % 7;          // lunes = 0
    const lun = new Date(d); lun.setUTCDate(d.getUTCDate() - dow);
    const dom = new Date(lun); dom.setUTCDate(lun.getUTCDate() + 6);
    return f >= lun.toISOString().slice(0, 10) && f <= dom.toISOString().slice(0, 10);
  }
  return true;
}

// Números de arriba de la pantalla, sobre las ventas que se están viendo.
export function resumenVentas(lista){
  const r = { n: lista.length, total: 0, porCobrar: { n: 0, monto: 0 }, sinFacturar: { n: 0, monto: 0 } };
  for(const v of lista){
    const m = montoVenta(v);
    r.total += m;
    const s = saldoVenta(v);
    if(s > 0){ r.porCobrar.n++; r.porCobrar.monto += s; }
    if(v.facturado !== 'Sí' && m > 0){ r.sinFacturar.n++; r.sinFacturar.monto += m; }
  }
  return r;
}

// Agrupa por fecha, más reciente primero. [{fecha, items:[{v,i}]}]
export function agruparPorDia(lista){
  const g = new Map();
  for(const o of lista){
    const k = o.v.fecha || '';
    if(!g.has(k)) g.set(k, { fecha: k, items: [] });
    g.get(k).items.push(o);
  }
  return [...g.values()].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

const _primerNombre = s => String(s || '').trim().split(/\s+/)[0] || '';
const _ddmm = f => { const p = String(f || '').split('-'); return p[2] ? `${p[2]}/${p[1]}` : ''; };

// Mensaje de WhatsApp para el cliente según cómo está el pedido.
export function mensajeWhatsApp(v){
  const cli = _primerNombre(v.cliente) || _primerNombre(v.destinatario);
  const saludo = cli ? `Hola ${cli}!` : 'Hola!';
  const que = v.prod ? `tu pedido (${v.prod})` : 'tu pedido';
  if(v.estado === 'entregado'){
    return `${saludo} Te avisamos que ${que} ya fue entregado${v.destinatario ? ' a ' + _primerNombre(v.destinatario) : ''}. Gracias por elegirnos! — Florería Duhau`;
  }
  const cuando = v.fecha ? ` para el ${_ddmm(v.fecha)}${v.horaEntrega ? ' a las ' + v.horaEntrega : ''}` : '';
  const dest = v.dir ? ` Lo llevamos a ${v.dir}.` : '';
  const saldo = saldoVenta(v);
  const cobro = saldo > 0 ? ` Queda un saldo de $${Math.round(saldo).toLocaleString('es-AR')}.` : '';
  return `${saludo} Te confirmamos ${que}${cuando}.${dest}${cobro} Cualquier cosa avisanos. — Florería Duhau`;
}

// Link de WhatsApp. Con teléfono abre el chat del cliente; sin teléfono deja elegir el contacto.
export function linkWhatsApp(telefono, texto){
  let t = String(telefono || '').replace(/\D/g, '');
  if(t){
    if(t.startsWith('00')) t = t.slice(2);
    if(t.length <= 11 && !t.startsWith('54')) t = '54' + (t.startsWith('0') ? t.slice(1) : t);
  }
  return `https://wa.me/${t}?text=${encodeURIComponent(texto)}`;
}
