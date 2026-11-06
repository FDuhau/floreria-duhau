// ── Resumen diario por mail ───────────────────────────────────────────────────
// Todos los días a las 8:00 (hora Argentina) el cron del Worker manda un mail con
// las entregas y eventos de hoy, lo que quedó pendiente de días anteriores, el
// stock bajo y las flores que cambiaron de precio. Lee la base con el mismo
// secreto que ya usa el resto del Worker y envía por Resend (https://resend.com).
//
// Se activa solo si existe el secret RESEND_API_KEY:
//   npx wrangler secret put RESEND_API_KEY
// Opcionales (en "vars" de wrangler.jsonc o en el panel):
//   RESUMEN_MAIL_PARA  destinatarios separados por coma (por defecto operaciones@…)
//   RESUMEN_MAIL_DE    remitente, p. ej. "Florería Duhau <avisos@lafloreriadelduhau.com.ar>"
//                      (el dominio tiene que estar verificado en Resend). Por defecto
//                      onboarding@resend.dev, que solo envía al mail con el que se creó la cuenta.
import { readDb } from './firebase-admin.js';
import { cambiosDePrecio } from '../src/modules/alertas-precio.js';

const DB_URL = 'https://floreria-duhau-84de5-default-rtdb.firebaseio.com';
export const HORA_ENVIO_UTC = 11;   // 08:00 en Argentina (UTC-3, sin horario de verano)

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const lista = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []).filter(Boolean);

// Fecha de hoy en Argentina (YYYY-MM-DD) a partir de un instante en ms.
export function hoyArgentina(ahora = Date.now()) {
  return new Date(ahora - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

function sumarDias(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Arma el contenido del resumen con los datos crudos de la base. Función pura.
export function armarResumen({ hoy, ventas, eventos, stock, compras }) {
  const abiertas = lista(ventas).filter((v) => v.estado !== 'entregado' && !v.anulada);
  const entregasHoy = abiertas.filter((v) => v.fecha === hoy)
    .sort((a, b) => String(a.horaEntrega || '99').localeCompare(String(b.horaEntrega || '99')));
  const atrasadas = abiertas.filter((v) => v.fecha && v.fecha < hoy && hoy <= sumarDias(v.fecha, 7));
  const eventosHoy = lista(eventos).filter((e) => e.fecha === hoy && e.estado !== 'Pedidos Finalizados');
  const proximos = lista(eventos).filter((e) => e.fecha > hoy && e.fecha <= sumarDias(hoy, 7) && e.estado !== 'Pedidos Finalizados')
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const stockBajo = lista(stock).filter((s) => s.prod && +s.min > 0 && (+s.actual || 0) < +s.min)
    .sort((a, b) => ((+a.actual || 0) / a.min) - ((+b.actual || 0) / b.min));
  const precios = cambiosDePrecio(lista(compras), { hoy, dias: 3 });
  return { hoy, entregasHoy, atrasadas, eventosHoy, proximos, stockBajo, precios };
}

const ddmm = (f) => { const p = String(f).split('-'); return p[2] ? `${p[2]}/${p[1]}` : f; };
const pesos = (n) => '$' + Math.round(n).toLocaleString('es-AR');

export function mailResumen(r) {
  const fecha = new Date(r.hoy + 'T12:00:00Z').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const sec = (titulo, items, vacio) => `<h3 style="margin:22px 0 6px;font-size:15px;color:#2f4a3a">${titulo}</h3>` +
    (items.length ? `<ul style="margin:0;padding-left:18px">${items.map((i) => `<li style="margin:3px 0">${i}</li>`).join('')}</ul>` : `<p style="margin:0;color:#777">${vacio}</p>`);
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;max-width:560px">
    <h2 style="margin:0 0 2px;color:#2f4a3a">Buen día</h2><div style="color:#777">${esc(fecha)}</div>
    ${sec('Entregas de hoy', r.entregasHoy.map((v) => `${v.horaEntrega ? `<strong>${esc(v.horaEntrega)}</strong> · ` : ''}${esc(v.prod)}${v.destinatario ? ' para ' + esc(v.destinatario) : ''}${v.dir ? ' · ' + esc(v.dir) : ''}`), 'No hay entregas pendientes para hoy.')}
    ${r.atrasadas.length ? sec('Quedaron pendientes de días anteriores', r.atrasadas.slice(0, 15).map((v) => `${ddmm(v.fecha)} · ${esc(v.prod)}${v.destinatario ? ' para ' + esc(v.destinatario) : ''}`), '') : ''}
    ${sec('Eventos de hoy', r.eventosHoy.map((e) => esc(e.nombre)), 'Sin eventos hoy.')}
    ${r.proximos.length ? sec('Eventos de los próximos 7 días', r.proximos.slice(0, 10).map((e) => `${ddmm(e.fecha)} · ${esc(e.nombre)}`), '') : ''}
    ${sec('Stock por debajo del mínimo', r.stockBajo.slice(0, 15).map((s) => `${esc(s.prod)}${s.color ? ' · ' + esc(s.color) : ''}: ${+s.actual || 0} (mínimo ${+s.min})`).concat(r.stockBajo.length > 15 ? [`y ${r.stockBajo.length - 15} más`] : []), 'Todo el stock está por encima del mínimo.')}
    ${r.precios.length ? sec('Flores que cambiaron de precio', r.precios.slice(0, 10).map((c) => `${esc(c.prod)}: ${pesos(c.antes)} → ${pesos(c.ahora)} la vara (${c.subio ? '+' : ''}${Math.round(c.pct)}%)${c.cambioCategoria ? ` · ${c.subio ? 'subió' : 'bajó'} a ${esc(c.catAhora.corto.toLowerCase())}` : ''}`), '') : ''}
    <p style="margin:26px 0 0;color:#999;font-size:12px">Resumen automático de la app de Florería Duhau.</p></div>`;
  const asunto = `Resumen del día: ${r.entregasHoy.length} entrega${r.entregasHoy.length !== 1 ? 's' : ''}, ${r.eventosHoy.length} evento${r.eventosHoy.length !== 1 ? 's' : ''}`;
  return { asunto, html };
}

export async function enviarResumenDiario(env, ahora = Date.now()) {
  if (!env.RESEND_API_KEY || !env.FIREBASE_DB_SECRET) return false;
  const leer = (p) => readDb(DB_URL, p, env.FIREBASE_DB_SECRET).catch(() => null);
  const [ventas, eventos, stock, compras] = await Promise.all([leer('ventasData'), leer('eventosData'), leer('stockData'), leer('comprasFlore')]);
  const { asunto, html } = mailResumen(armarResumen({ hoy: hoyArgentina(ahora), ventas, eventos, stock, compras }));
  const para = String(env.RESUMEN_MAIL_PARA || 'operaciones@lafloreriadelduhau.com.ar').split(',').map((s) => s.trim()).filter(Boolean);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.RESUMEN_MAIL_DE || 'Florería Duhau <onboarding@resend.dev>', to: para, subject: asunto, html }),
  });
  if (!r.ok) throw new Error('resend ' + r.status);
  return true;
}
