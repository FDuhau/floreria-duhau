import { esc } from './utils.js';

// Viven en app.js; se pasan una sola vez con configurarCalendario() al arrancar.
const D = {};
export function configurarCalendario(deps){ Object.assign(D, deps); calMes = deps.CURR_MONTH; }

// ── CALENDARIO ────────────────────────────────────────────────────────────────
let calMes = null;

// Cambio de vista en la sección Eventos: Lista ↔ Calendario
let eventosView = 'lista';
export const getEventosView = () => eventosView;
export function setEventosView(v){
  eventosView = v;
  const lt = document.getElementById('ev-view-tab-lista');
  const ct = document.getElementById('ev-view-tab-cal');
  if(lt) lt.classList.toggle('active', v==='lista');
  if(ct) ct.classList.toggle('active', v==='calendario');
  const lv = document.getElementById('eventos-lista-view');
  const cv = document.getElementById('eventos-cal-view');
  if(lv) lv.style.display = v==='lista' ? '' : 'none';
  if(cv) cv.style.display = v==='calendario' ? '' : 'none';
  if(v==='calendario') renderCalendario(); else D.renderEventos();
}
window.setEventosView = setEventosView;

// Cableado robusto de los botones de vista (por si el onclick inline no dispara)
export function initEventosToggle(){
  const lt = document.getElementById('ev-view-tab-lista');
  const ct = document.getElementById('ev-view-tab-cal');
  if(lt && !lt.dataset.wired){ lt.dataset.wired = '1'; lt.addEventListener('click', () => setEventosView('lista')); }
  if(ct && !ct.dataset.wired){ ct.dataset.wired = '1'; ct.addEventListener('click', () => setEventosView('calendario')); }
}
window.initEventosToggle = initEventosToggle;

export function renderCalendario(){
  const [y, m] = calMes.split('-').map(Number);
  const label = document.getElementById('cal-mes-label');
  if(label) label.textContent = D.fmtMonth(calMes);

  const firstDay = new Date(y, m-1, 1);
  const lastDay = new Date(y, m, 0);
  const startWd = firstDay.getDay();

  const mesEvents = D.eventos().filter(ev => (ev.fecha||'').startsWith(calMes));

  const ESTADO_BG = {
    'Pedidos Pendientes':'#E8E4DC',
    'En Proceso':'#EBF0E8',
    'Pendiente de Colocacion':'#FDF0E8',
    'Confirmado':'#EBF5E8',
    'Pedidos Finalizados':'#E8F0F8'
  };

  const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  let html = `<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px;margin-bottom:2px">
    ${days.map(d=>`<div style="text-align:center;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);padding:8px 0;overflow:hidden;text-overflow:ellipsis">${d}</div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px">`;

  for(let i=0; i<startWd; i++) html += `<div style="min-height:100px;min-width:0"></div>`;

  for(let d=1; d<=lastDay.getDate(); d++){
    const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayEvents = mesEvents.filter(ev => ev.fecha === dateStr);
    const isToday = dateStr === D.TODAY_ISO;
    html += `<div style="min-height:100px;min-width:0;overflow:hidden;border:1px solid var(--light-gray);border-radius:6px;padding:6px;background:${isToday?'var(--blush-light)':'var(--warm-white)'}">
      <div style="font-size:12px;font-weight:${isToday?'700':'400'};color:${isToday?'var(--blush)':'var(--mid-gray)'};margin-bottom:4px">${d}</div>
      ${dayEvents.map(ev=>{
        const arr = ev.arreglos||[];
        const totalArr = arr.reduce((s,a)=>s+(+a.qty||0),0);
        const arrDetalle = arr.length ? ' · Arreglos: '+arr.map(a=>`${a.qty}× ${a.arreglo}`).join(', ') : '';
        const arrBadge = totalArr ? `<span style="background:var(--blush-light);color:#7A3A2A;border-radius:10px;padding:0 5px;font-size:9.5px;font-weight:700;margin-left:4px;flex-shrink:0">${totalArr}</span>` : '';
        return `<div onclick="openEventoDetail(${D.eventos().indexOf(ev)})" style="background:${ESTADO_BG[ev.estado]||'#E8E4DC'};border-radius:4px;padding:3px 6px;margin-bottom:3px;font-size:11px;cursor:pointer;line-height:1.3;display:flex;align-items:center;overflow:hidden" title="${esc(ev.nombre)} · ${esc(ev.estado)}${esc(arrDetalle)}"><span style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${esc(ev.nombre)}</span>${arrBadge}</div>`;
      }).join('')}
    </div>`;
  }
  html += '</div>';

  html += `<div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">
    ${Object.entries(ESTADO_BG).map(([k,v])=>`<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--mid-gray)"><span style="width:12px;height:12px;border-radius:3px;background:${v};display:inline-block"></span>${k}</div>`).join('')}
  </div>`;

  const el = document.getElementById('cal-grid');
  if(el) el.innerHTML = html;
}

export function calPrevMonth(){
  const [y,m] = calMes.split('-').map(Number);
  const prev = new Date(y, m-2, 1);
  calMes = `${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,'0')}`;
  renderCalendario();
}
export function calNextMonth(){
  const [y,m] = calMes.split('-').map(Number);
  const next = new Date(y, m, 1);
  calMes = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}`;
  renderCalendario();
}
