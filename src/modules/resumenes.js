// Separado de app.js. Lo que necesita de app.js llega por configurarResumenes():
//   TODAY_ISO, checklistHistory, clStateByDay, eventosData, fbSave, floristaNombre, fmtMin, jardRecordatorios, jardineroNombre, recEstado, userRole

import { getEmpleadosActivos, getFloristasActivos, isJardinero } from './horarios.js';
import { _metricasEmpleadoPeriodo, _metricasHTML, _mismoNombre, _rangoSemana } from './reportes.js';
import { CL_TASKS, _zonaKey, calcDuracion, currentDay, eventoFase, eventoFlorFase, faseVisibleFlorista, fmtDur, getISOWeekKey, mapUltimoNuevoPorZona } from './checklist.js';
import { ventasData } from './ventas.js';
import { esc, fmtDate, parseMoney } from './utils.js';
import { icon } from './iconos.js';
import { mostrarEventosDelDia } from './eventos.js';

let D = {};
export function configurarResumenes(deps){ D = deps; }

// ══════════════════════════════════════════════════════════════════════════════
// CIERRE DEL DÍA — detalle de asistencia y actividad del equipo (gerencia)
// A las 19hs se genera un resumen de quién asistió y qué hizo cada uno, se guarda
// un snapshot en Firebase (para métricas históricas) y se avisa a gerencia.
// La página "Cierre del Día" lo regenera en vivo para cualquier fecha.
// ══════════════════════════════════════════════════════════════════════════════
export let resumenesDiarios = {}; // { 'YYYY-MM-DD': snapshot } — snapshots guardados a las 19hs
window._setResumenesDiarios = v => { resumenesDiarios = (v && typeof v==='object') ? v : {}; if(document.getElementById('page-cierre-dia')?.classList.contains('active')) renderCierreDia(); };

function _hm2min(s){ if(!s||!s.includes(':')) return 0; const [h,m]=s.split(':').map(Number); return (h||0)*60+(m||0); }

// Construye el detalle del día a partir de los datos en memoria (sincronizados).
function generarResumenDiario(fecha){
  const nombres = (typeof getEmpleadosActivos==='function' ? getEmpleadosActivos() : []);
  const personas = [], ausentes = [];

  nombres.forEach(nombre => {
    const esJard = typeof isJardinero==='function' && isJardinero(nombre);
    // Turno / asistencia
    const fTurno = (window.florTurnos||{})[nombre]?.[fecha];
    const jTurno = esJard ? (window.jardHorarios||{})[nombre]?.[fecha] : null;
    const horario = (window.horariosData||{})[nombre]?.[fecha];
    const reales = [fTurno, jTurno].filter(t=>t?.inicio);
    let desde=null, hasta=null, horasMin=0, ficho=false, planificado=false;
    if(reales.length){
      ficho = true;
      desde = reales.map(t=>t.inicio).sort()[0];
      const fins = reales.map(t=>t.fin).filter(Boolean).sort();
      hasta = fins.length ? fins[fins.length-1] : null;
      if(desde && hasta) horasMin = Math.max(0, _hm2min(hasta)-_hm2min(desde));
    } else if(horario?.desde){
      planificado = true;
      desde = horario.desde; hasta = horario.hasta || null;
      if(desde && hasta) horasMin = Math.max(0, _hm2min(hasta)-_hm2min(desde));
    }

    // Arreglos de florería HECHOS ese día — se leen del historial (checklistHistory),
    // que guarda who + date + tiempo. Antes se leía clStateByDay[fecha], pero ese
    // objeto está indexado por día de la semana (Lunes/Martes…), no por fecha, así
    // que nunca traía nada. El historial funciona para hoy y para fechas pasadas.
    const checklist = (D.checklistHistory||[])
      .filter(e => _mismoNombre(e.who, nombre) && String(e.date||'').slice(0,10) === fecha)
      .map(e => ({ zona: e.zona||'', sec: e.sec||'', actividad: e.actividad||'', obs: e.obs||'',
                   dur: (parseInt(e.duracion)||0) || calcDuracion(e.inicio||'', e.fin||'') || 0, done: true }));
    const tareasHechas = checklist.length;
    const tareasTotal  = checklist.length;

    // Tareas de jardinería del día (log)
    const jardineria = esJard
      ? (window.jardineriaLog||[]).filter(e=>e.fecha===fecha && _mismoNombre(e.quien, nombre))
          .map(e=>({ task: e.task||e.tarea||e.grupo||'', horaInicio:e.horaInicio||'', horaFin:e.horaFin||'', obs:e.obs||'', done: !!e.horaFin }))
      : [];

    // Eventos del día en los que participó
    const eventos = [];
    (D.eventosData||[]).filter(ev=>ev.fecha===fecha).forEach(ev=>{
      const roles = [];
      if(ev.asignado===nombre) roles.push('armado');
      if(ev.colocacionAsignado===nombre) roles.push('colocación');
      if(ev.retiroAsignado===nombre) roles.push('retiro');
      if(roles.length) eventos.push({ nombre: ev.nombre||'(evento)', roles, estado: ev.estado||'' });
    });

    // Ventas gestionadas ese día
    const ventas = (ventasData||[]).filter(v=>v.asignado===nombre && v.fecha===fecha)
      .map(v=>({ prod:v.prod||'', cliente:v.cliente||'', estado:v.estado||'' }));

    const actividadTotal = checklist.length + jardineria.length + eventos.length + ventas.length;
    if(ficho || planificado || actividadTotal>0){
      personas.push({ nombre, area: esJard?'Jardinería':'Florería', ficho, planificado, desde, hasta, horasMin,
        tareasHechas, tareasTotal, checklist, jardineria, eventos, ventas, actividadTotal });
    } else {
      ausentes.push(nombre);
    }
  });

  personas.sort((a,b)=> (a.desde||'99:99').localeCompare(b.desde||'99:99') || a.nombre.localeCompare(b.nombre,'es'));
  return { fecha, generadoTs: Date.now(), personas, ausentes };
}

function guardarResumenDiario(fecha, data){
  resumenesDiarios[fecha] = data;
  if(window.fbSetPath) window.fbSetPath('resumenesDiarios/'+fecha, data);
  else D.fbSave('resumenesDiarios', resumenesDiarios);
}

// Chequeo periódico: a partir de las 19hs (solo en dispositivo de gerencia),
// una vez por día, genera el snapshot y avisa. Dedupe cruzado por el snapshot
// ya presente en Firebase.
let _cierreDiaSesion = '';
export function _checkCierreDia(){
  if(D.userRole !== 'gerencia') return;
  const now = new Date();
  if(now.getHours() < 19) return;
  const fecha = D.TODAY_ISO;
  if(_cierreDiaSesion === fecha) return;
  if(resumenesDiarios[fecha]?.generadoTs){ _cierreDiaSesion = fecha; return; } // ya generado (por otro dispositivo)
  const data = generarResumenDiario(fecha);
  // Si todavía no cargó el roster/datos, no marcar como hecho: reintentar el próximo minuto
  if(!data.personas.length && !data.ausentes.length) return;
  _cierreDiaSesion = fecha;
  guardarResumenDiario(fecha, data);
  const nPers = data.personas.length;
  window.pushSend?.('Cierre del día', `${nPers} persona${nPers!==1?'s':''} asistieron hoy · mirá el detalle en Reportes › Cierre del Día`, 'cierre-dia', 'roles:gerencia');
  if(document.getElementById('page-cierre-dia')?.classList.contains('active')) renderCierreDia();
}

export function initCierreDia(){
  const inp = document.getElementById('cd-fecha');
  if(inp && !inp.value) inp.value = D.TODAY_ISO;
  renderCierreDia();
  cdPersonaRango(_cdPersonaRango || 'dia'); // resalta el botón de rango activo
}

export function renderCierreDia(){
  const cont = document.getElementById('cd-detalle');
  if(!cont) return;
  const fecha = document.getElementById('cd-fecha')?.value || D.TODAY_ISO;
  let data = generarResumenDiario(fecha);
  // Si no hay datos en vivo (fecha vieja no cargada) pero hay snapshot, usarlo
  if(!data.personas.length && resumenesDiarios[fecha]?.personas?.length){
    data = resumenesDiarios[fecha];
  }

  // KPIs
  const kpisEl = document.getElementById('cd-kpis');
  if(kpisEl){
    const totalPers = data.personas.length;
    const totalHoras = data.personas.reduce((s,p)=>s+(p.horasMin||0),0);
    const tareasHechas = data.personas.reduce((s,p)=>s+(p.tareasHechas||0)+p.jardineria.filter(j=>j.done).length,0);
    const tareasTotal = data.personas.reduce((s,p)=>s+(p.tareasTotal||0)+p.jardineria.length,0);
    const eventosSet = new Set(data.personas.flatMap(p=>p.eventos.map(e=>e.nombre)));
    const ventasN = data.personas.reduce((s,p)=>s+p.ventas.length,0);
    const kpi = (val,lbl)=>`<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:12px;padding:14px 16px">
      <div style="font-size:24px;font-weight:700;color:var(--charcoal)">${val}</div>
      <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-top:2px">${lbl}</div></div>`;
    kpisEl.innerHTML = [
      kpi(totalPers, 'Asistieron'),
      kpi(D.fmtMin(totalHoras), 'Horas trabajadas'),
      kpi(`${tareasHechas}/${tareasTotal}`, 'Tareas hechas'),
      kpi(eventosSet.size, 'Eventos'),
      kpi(ventasN, 'Ventas'),
    ].join('');
  }

  if(!data.personas.length){
    cont.innerHTML = `<div style="text-align:center;padding:48px 20px;color:var(--mid-gray)">
      <div style="font-size:40px;margin-bottom:10px"></div>
      <div style="font-size:15px;font-weight:600;color:var(--mid-gray)">Sin asistencia registrada para el ${fmtDate(fecha)}</div>
      <div style="font-size:13px;margin-top:6px">Aparecerá el detalle cuando el equipo fiche su turno o tenga tareas/eventos asignados.</div></div>`;
    return;
  }

  const genLbl = data.generadoTs ? `<div style="font-size:12px;color:var(--mid-gray);margin-bottom:14px">Generado ${new Date(data.generadoTs).toLocaleString('es-AR')}${resumenesDiarios[fecha]?.generadoTs===data.generadoTs?' · snapshot guardado':' · vista en vivo'}</div>` : '';

  cont.innerHTML = genLbl + data.personas.map(p=>{
    const turnoStr = p.desde ? `${p.desde}${p.hasta?' – '+p.hasta:' (en curso)'}` : 'Sin turno fichado';
    const horasStr = p.horasMin ? ` · ${D.fmtMin(p.horasMin)}` : '';
    const asistTag = p.ficho
      ? '<span style="font-size:12px;font-weight:700;background:var(--ok-soft);color:var(--green-ok);padding:2px 8px;border-radius:5px">✓ Fichó</span>'
      : '<span style="font-size:12px;font-weight:700;background:var(--amber-soft);color:#B4772A;padding:2px 8px;border-radius:5px">Planificado</span>';

    const checklistHtml = p.checklist.length
      ? `<div style="margin-top:10px"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">Checklist · ${p.tareasHechas}/${p.tareasTotal}</div>
          ${p.checklist.map(t=>`<div style="font-size:12.5px;padding:3px 0;color:${t.done?'var(--charcoal)':'#B4772A'}">${t.done?'✓':'○'} <strong>${esc(t.zona||t.sec)}</strong>${t.actividad?' · '+esc(t.actividad):''}${t.dur?` <span style="color:var(--mid-gray)">· ${fmtDur(t.dur)}</span>`:''}${t.obs?` <span style="color:var(--mid-gray)">— ${esc(t.obs)}</span>`:''}</div>`).join('')}</div>`
      : '';

    const jardHtml = p.jardineria.length
      ? `<div style="margin-top:10px"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">Jardinería</div>
          ${p.jardineria.map(t=>`<div style="font-size:12.5px;padding:3px 0;color:${t.done?'var(--charcoal)':'#B4772A'}">${t.done?'✓':'○'} ${esc(t.task||'Tarea')}${(t.horaInicio||t.horaFin)?` <span style="color:var(--mid-gray)">(${esc(t.horaInicio||'—')}${t.horaFin?' – '+esc(t.horaFin):''})</span>`:''}${t.obs?` — ${esc(t.obs)}`:''}</div>`).join('')}</div>`
      : '';

    const eventosHtml = p.eventos.length
      ? `<div style="margin-top:10px"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">Eventos</div>
          ${p.eventos.map(e=>`<div style="font-size:12.5px;padding:3px 0"><strong>${esc(e.nombre)}</strong> <span style="color:var(--mid-gray)">· ${e.roles.join(', ')}</span></div>`).join('')}</div>`
      : '';

    const ventasHtml = p.ventas.length
      ? `<div style="margin-top:10px"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">Ventas</div>
          ${p.ventas.map(v=>`<div style="font-size:12.5px;padding:3px 0">${esc(v.prod)}${v.cliente?' · '+esc(v.cliente):''} <span style="color:var(--mid-gray)">(${esc(v.estado)})</span></div>`).join('')}</div>`
      : '';

    const nada = !checklistHtml && !jardHtml && !eventosHtml && !ventasHtml
      ? '<div style="font-size:12.5px;color:var(--mid-gray);margin-top:8px">Sin tareas ni eventos registrados para el día.</div>' : '';

    return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:12px;padding:16px 18px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <strong style="font-size:15px;color:var(--charcoal)">${esc(p.nombre)}</strong>
          <span style="font-size:12px;color:var(--mid-gray)">${esc(p.area)}</span>
          ${asistTag}
        </div>
        <div style="font-size:12.5px;color:var(--mid-gray)">${icon('clock')}${turnoStr}${horasStr}</div>
      </div>
      ${checklistHtml}${jardHtml}${eventosHtml}${ventasHtml}${nada}
    </div>`;
  }).join('') + (data.ausentes.length
    ? `<div style="margin-top:8px;font-size:12.5px;color:var(--mid-gray)"><strong>Sin registro hoy:</strong> ${data.ausentes.map(esc).join(', ')}</div>`
    : '');

  // Panel de métricas por persona (día/semana/mes)
  const selP = document.getElementById('cd-persona');
  if(selP){
    const prev = selP.value;
    const empleados = (typeof getEmpleadosActivos==='function' ? getEmpleadosActivos() : []);
    selP.innerHTML = '<option value="">— Seleccionar persona —</option>' + empleados.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if(prev) selP.value = prev;
  }
  renderCdPersona();
}

// Rango del panel por persona del Cierre del Día: 'dia' | 'semana' | 'mes'.
let _cdPersonaRango = 'dia';
export function cdPersonaRango(kind){
  _cdPersonaRango = kind;
  ['dia','semana','mes'].forEach(k=>{
    const b = document.getElementById('cd-rango-'+k);
    if(b){ b.style.background = k===kind ? 'var(--charcoal)' : ''; b.style.color = k===kind ? '#fff' : ''; }
  });
  renderCdPersona();
}

export function renderCdPersona(){
  const body = document.getElementById('cd-persona-body');
  if(!body) return;
  const nombre = document.getElementById('cd-persona')?.value || '';
  const fechaBase = document.getElementById('cd-fecha')?.value || D.TODAY_ISO;
  const lblEl = document.getElementById('cd-persona-rango');
  if(!nombre){
    body.innerHTML = '<div style="padding:20px;text-align:center;color:var(--mid-gray);font-size:13px">Elegí una persona para ver sus métricas.</div>';
    if(lblEl) lblEl.textContent = '';
    return;
  }
  let desde, hasta;
  if(_cdPersonaRango==='semana'){ const r = _rangoSemana(new Date(fechaBase)); desde = r.desde; hasta = r.hasta; }
  else if(_cdPersonaRango==='mes'){ desde = fechaBase.slice(0,7)+'-01'; const [y,mo]=fechaBase.split('-').map(Number); hasta = `${y}-${String(mo).padStart(2,'0')}-${String(new Date(y,mo,0).getDate()).padStart(2,'0')}`; }
  else { desde = fechaBase; hasta = fechaBase; }
  if(lblEl) lblEl.textContent = `Período: ${fmtDate(desde)}${desde!==hasta?' – '+fmtDate(hasta):''}`;
  const m = _metricasEmpleadoPeriodo(nombre, desde, hasta);
  if(!m.total.n){
    body.innerHTML = `<div style="padding:20px;text-align:center;color:var(--mid-gray);font-size:13px">Sin tareas registradas para ${esc(nombre)} en este rango.</div>`;
    return;
  }
  body.innerHTML = _metricasHTML(m);
}

// ── Briefing "Buen día" al entrar (una vez por día por dispositivo) ───────────
function _saludoHora(){
  const h = new Date().getHours();
  return h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
}

export function mostrarBriefingDia(retry = 0){
  const label = window.currentUserLabel || '';
  const k = 'briefing_' + D.TODAY_ISO + '_' + label;
  try{ if(localStorage.getItem(k)){ mostrarEventosDelDia(); return; } }catch(e){}
  // Esperar a que Firebase traiga datos (si todavía no llegó nada)
  if(retry < 3 && !(D.eventosData||[]).length && !Object.keys(D.clStateByDay||{}).length){
    setTimeout(()=>mostrarBriefingDia(retry+1), 1200);
    return;
  }
  try{ localStorage.setItem(k,'1'); }catch(e){}

  const fechaTxt = new Date(D.TODAY_ISO+'T12:00:00').toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' });
  const ds = D.clStateByDay[currentDay] || {};
  let rows = [];
  if(D.userRole==='florista' && D.floristaNombre){
    const mis = CL_TASKS.map((_,i)=>i).filter(i => (ds.responsable?.[i]||'') === D.floristaNombre);
    const horario = (window.horariosData||{})[D.floristaNombre]?.[D.TODAY_ISO];
    const evs = (D.eventosData||[]).filter(ev => ev.estado!=='Pedidos Finalizados' &&
      eventoFlorFase(ev, eventoFase(ev)) === D.floristaNombre && faseVisibleFlorista(ev, eventoFase(ev)));
    rows = [
      ['', mis.length ? `Tenés ${mis.length} tarea${mis.length!==1?'s':''} asignada${mis.length!==1?'s':''} para hoy` : 'Todavía no tenés tareas asignadas'],
      horario?.desde ? ['', `Tu turno: ${horario.desde} a ${horario.hasta||'—'}`] : null,
      evs.length ? ['', 'Eventos: ' + esc(evs.map(e=>e.nombre).slice(0,2).join(' · '))] : null,
    ];
  } else if(D.userRole==='gerencia'){
    const evsHoy = (D.eventosData||[]).filter(e => e.fecha===D.TODAY_ISO && e.estado!=='Pedidos Finalizados');
    const conTurno = getFloristasActivos().filter(n => (window.horariosData||{})[n]?.[D.TODAY_ISO]?.desde);
    const hechas = (ds.checked||[]).filter(Boolean).length;
    const venc = D.jardRecordatorios.filter(r=>D.recEstado(r)==='vencido').length;
    rows = [
      ['', evsHoy.length ? `${evsHoy.length} evento${evsHoy.length!==1?'s':''} hoy: ${esc(evsHoy.map(e=>e.nombre).slice(0,2).join(' · '))}` : 'Sin eventos hoy'],
      ['', conTurno.length ? 'Con turno hoy: ' + esc(conTurno.join(', ')) : 'Nadie con turno asignado hoy'],
      ['', `Checklist: ${hechas} de ${CL_TASKS.length} tareas hechas`],
      venc ? ['', `${venc} recordatorio${venc!==1?'s':''} de jardín vencido${venc!==1?'s':''}`] : null,
    ];
  } else if(D.userRole==='jardinero'){
    const venc = D.jardRecordatorios.filter(r=>D.recEstado(r)==='vencido').length;
    const prox = D.jardRecordatorios.filter(r=>D.recEstado(r)==='proximo').length;
    rows = [
      venc ? ['', `${venc} recordatorio${venc!==1?'s':''} vencido${venc!==1?'s':''} para atender`] : ['', 'Recordatorios de jardín al día'],
      prox ? ['', `${prox} por vencer en los próximos días`] : null,
    ];
  }
  rows = rows.filter(Boolean);

  const nombre = D.floristaNombre || D.jardineroNombre || (D.userRole==='gerencia' ? '' : label);
  const ov = document.createElement('div');
  ov.id = 'briefing-overlay';
  ov.className = 'briefing-overlay';
  ov.innerHTML = `
    <div class="briefing-card">
      <div class="briefing-flor"></div>
      <div class="briefing-saludo">${_saludoHora()}${nombre ? ', ' + esc(nombre) : ''}</div>
      <div class="briefing-fecha">${esc(fechaTxt)}</div>
      ${rows.length ? `<div class="briefing-rows">${rows.map(([ic,tx])=>`<div class="briefing-row"><span>${ic}</span><span>${tx}</span></div>`).join('')}</div>` : ''}
      <button class="btn-add briefing-btn" onclick="cerrarBriefing()">Empezar el día →</button>
    </div>`;
  ov.addEventListener('click', e => { if(e.target === ov) cerrarBriefing(); });
  document.body.appendChild(ov);
  requestAnimationFrame(()=>ov.classList.add('open'));
}

export function cerrarBriefing(){
  const ov = document.getElementById('briefing-overlay');
  if(!ov) return;
  ov.classList.remove('open');
  setTimeout(()=>ov.remove(), 400);
}

// ── Resumen semanal automático (gerencia) ─────────────────────────────────────
// Se genera del lado cliente: cuando gerencia entra en una semana nueva, arma el
// resumen de la semana que cerró y avisa por push a los demás dispositivos de
// gerencia. (El cron del Worker no puede leer Firebase sin service account, así
// que el resumen lo produce el cliente, que ya tiene todos los datos.)
function _rangoSemanaPasada(){
  const hoy = new Date(D.TODAY_ISO);
  const dow = (hoy.getDay()+6)%7; // 0=lunes
  const lunesEsta = new Date(hoy); lunesEsta.setDate(hoy.getDate()-dow);
  const lunesPasada = new Date(lunesEsta); lunesPasada.setDate(lunesEsta.getDate()-7);
  const domingoPasada = new Date(lunesEsta); domingoPasada.setDate(lunesEsta.getDate()-1);
  const iso = d => d.toISOString().slice(0,10);
  return { desde: iso(lunesPasada), hasta: iso(domingoPasada), weekKey: getISOWeekKey(lunesPasada) };
}

function calcularResumenSemanal(desde, hasta){
  const enRango = d => d && d>=desde && d<=hasta;
  const regs = (D.checklistHistory||[]).filter(r => enRango(r.date));
  const porFlor = {};
  regs.forEach(r => {
    const n = r.who || '—';
    porFlor[n] = porFlor[n] || { hechas:0, exc:0 };
    porFlor[n].hechas++;
    if(r.excedida) porFlor[n].exc++;
  });
  const ventas = (ventasData||[]).filter(v => enRango(v.fecha));
  const totalVentas = ventas.reduce((s,v)=>s+parseMoney(v.precio),0);
  const eventos = (D.eventosData||[]).filter(e => enRango(e.fecha) && (e.estado==='Pedidos Finalizados'||e.estado==='Confirmado'));
  // Zona con el Nuevo más atrasado
  const map = mapUltimoNuevoPorZona();
  let peorZona=null, peorDias=-1;
  [...new Map(CL_TASKS.filter(t=>String(t.actividad).toLowerCase()!=='riego').map(t=>[_zonaKey(t.sec,t.zona),t])).values()].forEach(t=>{
    const f = map[_zonaKey(t.sec,t.zona)];
    const dias = f ? Math.floor((new Date(D.TODAY_ISO)-new Date(f))/86400000) : 999;
    if(dias>peorDias){ peorDias=dias; peorZona=t.zona; }
  });
  return { regs:regs.length, porFlor, totalVentas, nVentas:ventas.length, eventos:eventos.length, peorZona, peorDias };
}

export function mostrarResumenSemanal(retry=0, force=false){
  if(D.userRole!=='gerencia') return;
  const { desde, hasta, weekKey } = _rangoSemanaPasada();
  const k = 'resumenSem_' + weekKey;
  if(!force){ try{ if(localStorage.getItem(k)) return; }catch(e){} }
  // Esperar a que Firebase traiga el historial
  if(!force && retry < 3 && !(D.checklistHistory||[]).length){ setTimeout(()=>mostrarResumenSemanal(retry+1), 2000); return; }

  const r = calcularResumenSemanal(desde, hasta);
  if(!force && !r.regs && !r.nVentas && !r.eventos) { try{ localStorage.setItem(k,'1'); }catch(e){} return; } // semana sin actividad
  try{ localStorage.setItem(k,'1'); }catch(e){}

  const fmtARS = n => '$' + Math.round(n).toLocaleString('es-AR');
  const flor = Object.entries(r.porFlor).sort((a,b)=>b[1].hechas-a[1].hechas);
  const rows = [
    ['', `${r.regs} tareas completadas` + (flor.length ? ' — ' + esc(flor.slice(0,3).map(([n,d])=>`${n}: ${d.hechas}`).join(', ')) : '')],
    flor.some(([,d])=>d.exc) ? ['', 'Excedidas: ' + esc(flor.filter(([,d])=>d.exc).map(([n,d])=>`${n} ${d.exc}`).join(', '))] : null,
    ['', `${fmtARS(r.totalVentas)} en ventas (${r.nVentas})`],
    ['', `${r.eventos} evento${r.eventos!==1?'s':''} realizado${r.eventos!==1?'s':''}`],
    r.peorZona && r.peorDias>=5 ? ['', `Zona más atrasada de Nuevo: ${esc(r.peorZona)} (${r.peorDias>900?'sin registro':r.peorDias+' días'})`] : null,
  ].filter(Boolean);

  const desdeTxt = new Date(desde+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'short'});
  const hastaTxt = new Date(hasta+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'short'});
  const ov = document.createElement('div');
  ov.id = 'briefing-overlay';
  ov.className = 'briefing-overlay';
  ov.innerHTML = `
    <div class="briefing-card">
      <div class="briefing-flor"></div>
      <div class="briefing-saludo">Resumen de la semana</div>
      <div class="briefing-fecha">${desdeTxt} — ${hastaTxt}</div>
      <div class="briefing-rows">${rows.map(([ic,tx])=>`<div class="briefing-row"><span>${ic}</span><span>${tx}</span></div>`).join('')}</div>
      <button class="btn-add briefing-btn" onclick="cerrarBriefing()">Cerrar</button>
    </div>`;
  ov.addEventListener('click', e => { if(e.target === ov) cerrarBriefing(); });
  document.body.appendChild(ov);
  requestAnimationFrame(()=>ov.classList.add('open'));

  // Aviso por push a los demás dispositivos de gerencia
  window.pushSend?.('Resumen semanal listo',
    `${r.regs} tareas · ${fmtARS(r.totalVentas)} en ventas · ${r.eventos} eventos`,
    'resumen-semanal', 'roles:gerencia');
}