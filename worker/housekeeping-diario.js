// ── Mail diario a Housekeeping: habitaciones con plantas que hay que ingresar ──
// Todos los días a las 8:00 (hora Argentina), junto con el resumen diario, el Worker
// lee "Control de habitaciones" y le manda a Housekeeping la lista de habitaciones
// Urgentes (hay que ingresar esta semana) y Próximas (programar ingreso), con los
// mismos umbrales que usa la app (urgenciaConfig). Envía por Resend.
//
// Se activa solo si existen el secret RESEND_API_KEY y la variable HOUSEKEEPING_MAIL_PARA
// (destinatarios separados por coma). Remitente: RESUMEN_MAIL_DE (igual que el resumen).
// OJO: con el remitente de prueba onboarding@resend.dev solo llega al mail con el que se
// creó la cuenta de Resend; para escribirle a Housekeeping hay que verificar el dominio.
import { readDb } from './firebase-admin.js';

const DB_URL = 'https://floreria-duhau-84de5-default-rtdb.firebaseio.com';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const lista = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []).filter(Boolean);
const ddmm = (f) => { const p = String(f).split('-'); return p[2] ? `${p[2]}/${p[1]}/${p[0]}` : f; };

function diasDesde(hoy, last) {
  if (!last) return null;
  return Math.floor((new Date(hoy) - new Date(last)) / 86400000);
}

// Misma regla que getDaysBadge de la app: sin visita o más allá de warnMax = urgente.
export function estadoHabitacion(dias, okMax = 3, warnMax = 7) {
  if (dias === null || dias === undefined) return 'urgente';
  if (dias <= okMax) return 'aldia';
  if (dias <= warnMax) return 'proxima';
  return 'urgente';
}

// Función pura: arma las listas a partir de los datos crudos de la base.
export function armarHousekeeping({ hoy, habitaciones, urgencia }) {
  const okMax = +(urgencia && urgencia.okMax) || 3;
  const warnMax = +(urgencia && urgencia.warnMax) || 7;
  const todas = lista(habitaciones).filter((h) => h.hab).map((h) => {
    const dias = diasDesde(hoy, h.last);
    return { hab: String(h.hab), last: h.last || '', dias, estado: estadoHabitacion(dias, okMax, warnMax), obs: String(h.comentarioHK || h.obs || h.notas || '').trim() };
  });
  const porAntiguedad = (a, b) => (b.dias ?? 9999) - (a.dias ?? 9999);
  return {
    hoy,
    total: todas.length,
    urgentes: todas.filter((h) => h.estado === 'urgente').sort(porAntiguedad),
    proximas: todas.filter((h) => h.estado === 'proxima').sort(porAntiguedad),
    alDia: todas.filter((h) => h.estado === 'aldia').length,
  };
}

export function mailHousekeeping(r) {
  const fecha = new Date(r.hoy + 'T12:00:00Z').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const fila = (h) => `<li style="margin:3px 0"><strong>Hab. ${esc(h.hab)}</strong> · ${h.last ? `última visita ${esc(ddmm(h.last))} (hace ${h.dias} día${h.dias !== 1 ? 's' : ''})` : 'sin visitas registradas'}${h.obs ? ` · <em>${esc(h.obs)}</em>` : ''}</li>`;
  const sec = (titulo, sub, items) => `<h3 style="margin:22px 0 2px;font-size:15px;color:#2f4a3a">${titulo} (${items.length})</h3><div style="color:#777;font-size:13px;margin-bottom:6px">${sub}</div>` +
    (items.length ? `<ul style="margin:0;padding-left:18px">${items.map(fila).join('')}</ul>` : '<p style="margin:0;color:#777">Ninguna.</p>');
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;max-width:560px">
    <h2 style="margin:0 0 2px;color:#2f4a3a">Buen día, Housekeeping</h2><div style="color:#777">${esc(fecha)}</div>
    <p style="margin:14px 0 0">Estas son las habitaciones con plantas que necesitamos ingresar. Coordinar el ingreso con Florería es clave para que las plantas estén bien cuidadas.</p>
    ${sec('Urgentes', 'Necesitamos ingresar esta semana', r.urgentes)}
    ${sec('Próximas', 'Programar el ingreso', r.proximas)}
    <p style="margin:22px 0 0;color:#555">Habitaciones al día: ${r.alDia} de ${r.total}.</p>
    <p style="margin:26px 0 0;color:#999;font-size:12px">Aviso automático de la app de Florería Duhau (Control de habitaciones).</p></div>`;
  const asunto = `Habitaciones para ingresar: ${r.urgentes.length} urgente${r.urgentes.length !== 1 ? 's' : ''}, ${r.proximas.length} próxima${r.proximas.length !== 1 ? 's' : ''}`;
  return { asunto, html };
}

export async function enviarHousekeepingDiario(env, ahora = Date.now(), hoy) {
  if (!env.RESEND_API_KEY || !env.FIREBASE_DB_SECRET || !env.HOUSEKEEPING_MAIL_PARA) return false;
  const leer = (p) => readDb(DB_URL, p, env.FIREBASE_DB_SECRET).catch(() => null);
  const [habitaciones, urgencia] = await Promise.all([leer('habitacionesData'), leer('urgenciaConfig')]);
  if (!habitaciones) return false;
  const dia = hoy || new Date(ahora - 3 * 3600 * 1000).toISOString().slice(0, 10);
  const { asunto, html } = mailHousekeeping(armarHousekeeping({ hoy: dia, habitaciones, urgencia }));
  const para = String(env.HOUSEKEEPING_MAIL_PARA).split(',').map((s) => s.trim()).filter(Boolean);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.RESUMEN_MAIL_DE || 'Florería Duhau <onboarding@resend.dev>', to: para, subject: asunto, html }),
  });
  if (!r.ok) throw new Error('resend ' + r.status);
  return true;
}
