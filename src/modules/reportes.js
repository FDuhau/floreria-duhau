// Separado de app.js. Lo que necesita de app.js llega por configurarReportes():
//   TODAY_ISO, _downloadCSV, checklistHistory, closeModal, eventosData, fbSave, fmtMonth, habitacionesLog, jardineriaLog, llamadosData, navigate

import { calcHorasDia, getEmpleadosActivos, isJardinero, jornadaRealDia } from './horarios.js';
import { _faltasDe, _legDetIdx, evaluacionesData, legajoData, liqNombreCalendario, renderLegajo } from './personal.js';
import { esc, fmtDate, parseMoney } from './utils.js';
import { _evStripAcc } from './daily-import.js';
import { CL_TASKS, calcDuracion, fmtDur, getBadge, getTiempoRef } from './checklist.js';
import { icon } from './iconos.js';
import { ventasData } from './ventas.js';

let D = {};
export function configurarReportes(deps){ D = deps; }

// ══════════════════════════════════════════════════════════════════════════════
// REPORTES / ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

const _chartInstances = {};
function _destroyChart(id){ if(_chartInstances[id]){ _chartInstances[id].destroy(); delete _chartInstances[id]; } }

export function _repMeses(selectId, mesesCount=12){
  const sel = document.getElementById(selectId);
  if(!sel) return;
  const cur = sel.value;
  const now = new Date();
  const opts = [];
  for(let i=0; i<mesesCount; i++){
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][d.getMonth()] + ' ' + d.getFullYear();
    opts.push(`<option value="${iso}"${iso===cur?' selected':''}>${label}</option>`);
  }
  sel.innerHTML = opts.join('');
}

export function _kpiCard(label, value, sub='', color='var(--sage-dark)'){
  return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;padding:14px 16px">
    <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px;font-weight:500">${label}</div>
    <div style="font-size:26px;font-weight:700;color:${color};line-height:1">${value}</div>
    ${sub ? `<div style="font-size:12px;color:var(--mid-gray);margin-top:4px">${sub}</div>` : ''}
  </div>`;
}

// ── Reportes Equipo ───────────────────────────────────────────────────────────
// ── AUDITORÍA DE CAMBIOS ──────────────────────────────────────────────────────
export let auditLogData = {};
window._setAuditLog = (val) => { auditLogData = val && typeof val === 'object' ? val : {}; };
// Horas del mes de un empleado: PROGRAMADAS (horario que carga gerencia) y
// TRABAJADAS (jornada real fichada — misma fuente `jornadaRealDia` que usan
// Productividad y la Liquidación, para que todos los reportes coincidan).
function _horasMesEmpleado(nombre, mesISO){
  const [anio, mes] = mesISO.split('-').map(Number);
  const diasMes = new Date(anio, mes, 0).getDate();
  let hsProg=0, hsTrab=0, dias=0;
  for(let d=1; d<=diasMes; d++){
    const iso = `${mesISO}-${String(d).padStart(2,'0')}`;
    const h = (window.horariosData||{})[nombre]?.[iso];
    if(h?.desde && h?.hasta){ hsProg += calcHorasDia(h.desde,h.hasta); dias++; }
    const real = jornadaRealDia(nombre, iso);
    if(real) hsTrab += real.horas;
  }
  return { hsProg, hsTrab, dias };
}

function _hhmmToMin(s){ if(!s || !/^\d{1,2}:\d{2}/.test(String(s))) return null; const [h,m]=String(s).split(':').map(Number); return h*60+m; }
function _mesPrevio(mesISO){ const [a,m]=mesISO.split('-').map(Number); const d=new Date(a,m-2,1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }

// Métricas mensuales consolidadas de un empleado (ficha 360 + ranking):
// asistencia, puntualidad, horas/cumplimiento, productividad, evaluación y llamados.
function _metricasEmpleadoMes(nombre, mesISO){
  const [anio,mes] = mesISO.split('-').map(Number);
  const diasMes = new Date(anio,mes,0).getDate();
  const GRACIA = 5; // minutos de tolerancia antes de contar "tarde"
  let hsProg=0, hsTrab=0, diasProg=0, diasFichados=0, diasTarde=0, minTarde=0;
  for(let d=1; d<=diasMes; d++){
    const iso = `${mesISO}-${String(d).padStart(2,'0')}`;
    const h = (window.horariosData||{})[nombre]?.[iso];
    if(h?.desde && h?.hasta){ hsProg += calcHorasDia(h.desde,h.hasta); diasProg++; }
    const real = jornadaRealDia(nombre, iso);
    if(real){
      hsTrab += real.horas; diasFichados++;
      const prog = h?.desde ? _hhmmToMin(h.desde) : null;
      const ini  = _hhmmToMin(real.inicio);
      if(prog!=null && ini!=null && ini > prog + GRACIA){ diasTarde++; minTarde += (ini - prog); }
    }
  }
  let tareasHechas=0, tareasExcedidas=0, minTareas=0;
  (D.checklistHistory||[]).forEach(e=>{
    if(e.who!==nombre || (e.date||'').slice(0,7)!==mesISO) return;
    tareasHechas++; if(e.excedida) tareasExcedidas++; minTareas += parseInt(e.duracion)||0;
  });
  (window.jardineriaLog||[]).forEach(e=>{
    if(e.quien!==nombre || (e.fecha||'').slice(0,7)!==mesISO) return;
    tareasHechas++;
  });
  const evs = (typeof evaluacionesData!=='undefined'?evaluacionesData:[]).filter(e=>e.empleadoNombre===nombre);
  const evalProm = evs.length ? evs.reduce((s,e)=>s+((+e.puntualidad||0)+(+e.calidad||0)+(+e.actitud||0)+(+e.productividad||0))/4,0)/evs.length : null;
  const llamados = (typeof D.llamadosData!=='undefined'?D.llamadosData:[]).filter(l=>l.empleadoNombre===nombre && (l.fecha||'').slice(0,7)===mesISO);
  return {
    hsProg:Math.round(hsProg*10)/10, hsTrab:Math.round(hsTrab*10)/10,
    cumplimiento: hsProg>0 ? Math.round(hsTrab/hsProg*100) : null,
    diasProg, diasFichados,
    asistencia: diasProg>0 ? Math.round(diasFichados/diasProg*100) : null,
    diasTarde, minTarde,
    tareasHechas, tareasExcedidas, minTareas,
    evalProm, evalCount:evs.length,
    llamados: llamados.length, llamadosList: llamados,
  };
}

export function openFichaEmpleado(nombre, mesISO){
  mesISO = mesISO || (document.getElementById('rep-eq-mes')?.value || D.TODAY_ISO.slice(0,7));
  const m = _metricasEmpleadoMes(nombre, mesISO);
  const prev = _metricasEmpleadoMes(nombre, _mesPrevio(mesISO));
  let ov = document.getElementById('ficha-empleado-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='ficha-empleado-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  const trend = (cur,prv)=>{ if(cur==null||prv==null) return ''; const dd=cur-prv; if(Math.abs(dd)<1) return ' <span style="color:var(--mid-gray);font-size:12px">→</span>'; return dd>0?` <span style="color:var(--green-ok);font-size:12px">▲${dd}</span>`:` <span style="color:var(--red-alert);font-size:12px">▼${Math.abs(dd)}</span>`; };
  const card = (label, value, sub, color) => `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;padding:12px 14px">
    <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">${label}</div>
    <div style="font-size:23px;font-weight:700;color:${color||'var(--charcoal)'};line-height:1.1">${value}</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-top:4px">${sub||''}</div>
  </div>`;
  const cumplCol = m.cumplimiento==null?'var(--mid-gray)':m.cumplimiento>=80?'var(--green-ok)':m.cumplimiento>=50?'#D4A820':'var(--red-alert)';
  const asisCol  = m.asistencia==null?'var(--mid-gray)':m.asistencia>=90?'var(--green-ok)':m.asistencia>=70?'#D4A820':'var(--red-alert)';
  const stars = m.evalProm!=null ? '★'.repeat(Math.round(m.evalProm))+'☆'.repeat(5-Math.round(m.evalProm)) : '—';
  ov.innerHTML = `<div class="modal" style="max-width:640px;max-height:88vh;overflow-y:auto">
    <button class="modal-close" onclick="closeModal('ficha-empleado-modal')">✕</button>
    <div class="modal-title">${esc(nombre)}</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:16px">Ficha del mes · ${esc(D.fmtMonth(mesISO))} · ${isJardinero(nombre)?'Jardinería':'Florería'}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">
      ${card('Asistencia', (m.asistencia!=null?m.asistencia+'%':'—'), `${m.diasFichados}/${m.diasProg} días fichados`, asisCol)}
      ${card('Puntualidad', m.diasTarde+(m.diasTarde===1?' tarde':' tarde'), m.minTarde?`${m.minTarde} min acumulados`:'sin demoras', m.diasTarde?'#D4A820':'var(--green-ok)')}
      ${card('Cumplimiento hs', (m.cumplimiento!=null?m.cumplimiento+'%'+trend(m.cumplimiento,prev.cumplimiento):'—'), `${m.hsTrab}h de ${m.hsProg}h`, cumplCol)}
      ${card('Tareas hechas', m.tareasHechas, m.tareasExcedidas?`${m.tareasExcedidas} pasadas de tiempo`:'en tiempo', 'var(--charcoal)')}
      ${card('Evaluación', stars, m.evalCount?`prom ${m.evalProm.toFixed(1)} · ${m.evalCount} eval`:'sin evaluar', 'var(--charcoal)')}
      ${card('Llamados de atención', m.llamados, 'este mes', m.llamados?'var(--red-alert)':'var(--green-ok)')}
    </div>
    ${m.llamadosList.length?`<div style="margin-top:18px"><div class="card-label">Llamados de atención del mes</div>${m.llamadosList.map(l=>`<div style="display:flex;gap:8px;align-items:center;padding:7px 0;border-top:1px solid var(--surface-2);font-size:12px">${l.foto?`<img src="${l.foto}" onclick="verFotoLlamado(${l.id})" style="width:34px;height:34px;object-fit:cover;border-radius:5px;cursor:pointer">`:'<span style="color:var(--amber)"></span>'}<span style="flex:1">${esc(l.zona||'Arreglo')}${l.nota?' — '+esc(l.nota):''}</span><span style="color:var(--mid-gray);font-size:12px">${fmtDate(l.fecha)}</span></div>`).join('')}</div>`:''}
  </div>`;
  ov.classList.add('open');
}

// ── Análisis de desempeño por empleado y período (RRHH › Evaluaciones) ────────
// Unifica el trabajo REAL de las tres áreas (Florería/checklist, Jardinería y
// Habitaciones) en un rango de fechas para poder evaluar desempeño con datos
// concretos: cuántas tareas hizo, promedio de tiempo por tarea y desglose.
// Rango lunes–domingo de la semana que contiene a `d` (Date). Devuelve ISO.
export function _rangoSemana(d){
  const iso = x => x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (base.getDay()+6)%7; // 0=lunes … 6=domingo
  const lun = new Date(base); lun.setDate(base.getDate()-dow);
  const dom = new Date(lun);  dom.setDate(lun.getDate()+6);
  return { desde: iso(lun), hasta: iso(dom) };
}

function _enRangoFecha(fecha, desde, hasta){
  const f = String(fecha||'').slice(0,10);
  if(!f) return false;
  if(desde && f < desde) return false;
  if(hasta && f > hasta) return false;
  return true;
}

// Compara nombres de forma tolerante (ignora mayúsculas, acentos y espacios de
// más). El selector de empleados usa el floristaNombre del login y el historial
// guarda el "responsable", que pueden diferir en mayúsculas/acentos.
export function _mismoNombre(a, b){
  const norm = s => _evStripAcc(String(s||'')).replace(/\s+/g,' ').trim();
  return norm(a) === norm(b) && norm(a) !== '';
}

export function _metricasEmpleadoPeriodo(nombre, desde, hasta){
  const areas = {
    'Florería':     { n:0, min:0, conTiempo:0, excedidas:0 },
    'Jardinería':   { n:0, min:0, conTiempo:0, excedidas:0 },
    'Habitaciones': { n:0, min:0, conTiempo:0, excedidas:0 },
  };
  const detalle = [];
  const porTarea = new Map(); // area|desc → {area, desc, n, min, conTiempo}
  const addTarea = (area, desc, dur) => {
    const k = area+'|'+desc;
    if(!porTarea.has(k)) porTarea.set(k, {area, desc, n:0, min:0, conTiempo:0});
    const o = porTarea.get(k);
    o.n++; if(dur){ o.min += dur; o.conTiempo++; }
  };

  (D.checklistHistory||[]).forEach(e=>{
    if(!_mismoNombre(e.who, nombre) || !_enRangoFecha(e.date, desde, hasta)) return;
    const dur = (parseInt(e.duracion)||0) || calcDuracion(e.inicio||'', e.fin||'') || 0;
    const a = areas['Florería']; a.n++; if(dur){ a.min+=dur; a.conTiempo++; } if(e.excedida) a.excedidas++;
    const desc = (e.zona||'Arreglo') + (e.actividad?(' · '+e.actividad):'');
    detalle.push({ fecha:e.date, area:'Florería', desc, dur, excedida:!!e.excedida, inicio:e.inicio||'', fin:e.fin||'' });
    addTarea('Florería', desc, dur);
  });
  (D.jardineriaLog||[]).forEach(e=>{
    if(!_mismoNombre(e.quien, nombre) || !_enRangoFecha(e.fecha, desde, hasta)) return;
    const dur = calcDuracion(e.horaInicio||'', e.horaFin||'') || 0;
    const a = areas['Jardinería']; a.n++; if(dur){ a.min+=dur; a.conTiempo++; }
    const desc = (e.group?e.group+' · ':'') + (e.task||'Tarea');
    detalle.push({ fecha:e.fecha, area:'Jardinería', desc, dur, excedida:false, inicio:e.horaInicio||'', fin:e.horaFin||'' });
    addTarea('Jardinería', desc, dur);
  });
  (D.habitacionesLog||[]).forEach(e=>{
    if(!_mismoNombre(e.quien, nombre) || !_enRangoFecha(e.fecha, desde, hasta)) return;
    const dur = calcDuracion(e.horaInicio||'', e.horaFin||'') || 0;
    const a = areas['Habitaciones']; a.n++; if(dur){ a.min+=dur; a.conTiempo++; }
    const desc = 'Hab. ' + (e.hab||'');
    detalle.push({ fecha:e.fecha, area:'Habitaciones', desc, dur, excedida:false, inicio:e.horaInicio||'', fin:e.horaFin||'' });
    addTarea('Habitaciones', desc, dur);
  });

  detalle.sort((a,b)=> (b.fecha||'').localeCompare(a.fecha||''));
  const total = { n:0, min:0, conTiempo:0, excedidas:0 };
  Object.values(areas).forEach(a=>{ total.n+=a.n; total.min+=a.min; total.conTiempo+=a.conTiempo; total.excedidas+=a.excedidas; });
  const tareas = [...porTarea.values()].sort((a,b)=> b.n - a.n || b.min - a.min);
  return { areas, total, detalle, tareas };
}

// Poblar selector de empleados + período por defecto (últimos 2 meses)
export function initPerfPanel(){
  const sel = document.getElementById('perf-empleado');
  if(!sel) return;
  const actual = sel.value;
  sel.innerHTML = '<option value="">'+(legajoData.length?'— Seleccionar empleado —':'— Sin legajos: cargalos en RRHH › Legajo —')+'</option>' + _empleadosLegajoOpts();
  if(actual) sel.value = actual;
  const dd = document.getElementById('perf-desde'), hh = document.getElementById('perf-hasta');
  const iso = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  if(dd && !dd.value){
    const hoy = new Date();
    dd.value = iso(new Date(hoy.getFullYear(), hoy.getMonth()-2, 1));
    if(hh && !hh.value) hh.value = iso(hoy);
  }
}

export function perfPreset(kind){
  const hoy = new Date();
  const iso = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  let desde;
  let hasta = iso(hoy);
  if(kind==='semana'){ const r = _rangoSemana(hoy); desde = r.desde; hasta = r.hasta; }
  else if(kind==='mes')       desde = iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  else if(kind==='2m')   desde = iso(new Date(hoy.getFullYear(), hoy.getMonth()-2, 1));
  else if(kind==='3m')   desde = iso(new Date(hoy.getFullYear(), hoy.getMonth()-3, 1));
  else if(kind==='trim'){ const q = Math.floor(hoy.getMonth()/3); desde = iso(new Date(hoy.getFullYear(), q*3, 1)); }
  else if(kind==='anio') desde = iso(new Date(hoy.getFullYear(), 0, 1));
  else desde = iso(new Date(hoy.getFullYear(), hoy.getMonth()-2, 1));
  const dd = document.getElementById('perf-desde'), hh = document.getElementById('perf-hasta');
  if(dd) dd.value = desde;
  if(hh) hh.value = hasta;
  renderPerfEmpleado();
}

export function renderPerfEmpleado(){
  const body = document.getElementById('perf-body');
  if(!body) return;
  const nombre = document.getElementById('perf-empleado')?.value || '';
  const desde  = document.getElementById('perf-desde')?.value || '';
  const hasta  = document.getElementById('perf-hasta')?.value || '';
  if(!nombre){
    body.innerHTML = '<div style="padding:22px;text-align:center;color:var(--mid-gray);font-size:13px">Elegí un empleado para ver sus métricas objetivas del período.</div>';
    return;
  }
  const m = _metricasEmpleadoPeriodo(nombre, desde, hasta);
  if(!m.total.n){
    // Diagnóstico: qué nombres SÍ figuran en el checklist del período (revela
    // desajustes de nombre entre el login y el "responsable" del checklist).
    const nombresHist = [...new Set((D.checklistHistory||[])
      .filter(e=>_enRangoFecha(e.date, desde, hasta))
      .map(e=>String(e.who||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    const hint = nombresHist.length
      ? `<div style="font-size:12px;color:var(--mid-gray);margin-top:10px">En el checklist de este período figuran: ${nombresHist.map(esc).join(' · ')}</div>`
      : '';
    body.innerHTML = `<div style="padding:22px;text-align:center;color:var(--mid-gray);font-size:13px">Sin tareas registradas para ${esc(nombre)} en este período.${hint}</div>` + _prodResumenHTML(nombre, desde, hasta, m);
    return;
  }
  body.innerHTML = _prodResumenHTML(nombre, desde, hasta, m) + _metricasHTML(m);
}

// ── Productividad vs. horas de contrato (RRHH › Evaluaciones) ────────────────
// Busca el legajo de un empleado (el login usa solo el nombre; el legajo tiene
// nombre y apellido) para tomar las horas de contrato mensuales.
function _legajoDeEmpleado(nombre){
  return (legajoData||[]).find(l=>_mismoNombre(_nombreAppLegajo(l), nombre)) || null;
}

// Nombre con el que la persona del legajo registra tareas/fichajes en la app:
// el usuario vinculado en el legajo; si no tiene, el usuario de la app que
// coincide con su nombre (o nombre + apellido); y si no, su nombre tal cual.
export function _nombreAppLegajo(l){
  if(!l) return '';
  return liqNombreCalendario(l) || (l.nombre||'').trim();
}

// Empleados de RRHH = los que tienen legajo. Devuelve [{value, label}] donde
// value es el nombre en la app (para cruzar con tareas) y label el nombre completo.
function _empleadosLegajo(){
  const vistos = new Set();
  return (legajoData||[]).map(l=>({ value:_nombreAppLegajo(l), label:((l.nombre||'')+' '+(l.apellido||'')).trim() }))
    .filter(o=>o.value && !vistos.has(o.value) && vistos.add(o.value))
    .sort((a,b)=>a.label.localeCompare(b.label,'es'));
}
export function _empleadosLegajoOpts(){
  return _empleadosLegajo().map(o=>`<option value="${esc(o.value)}">${esc(o.label)}${_mismoNombre(o.label.split(' ')[0],o.value)?'':' ('+esc(o.value)+')'}</option>`).join('');
}

// Al crear un usuario florista/jardinero se le abre su legajo (si no tiene).
export function _crearLegajoParaUsuario(nombre, cargo){
  if(_legajoDeEmpleado(nombre)) return false;
  legajoData.push({ id: Date.now(), nombre, apellido:'', usuario:nombre, dni:'', fechaIngreso:D.TODAY_ISO, cargo,
    sucursal:'', tipo:'nomina', horasContrato:0, vacacionesAnuales:14, vacacionesTomadas:0, notas:'', documentos:[] });
  D.fbSave('legajoData', legajoData);
  if(document.getElementById('page-legajo')?.classList.contains('active')) renderLegajo();
  return true;
}

const _PROD_MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function _isoDia(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

// Historial día por día + resumen mensual y trimestral de un empleado.
// - Tiempo en tareas: suma de las tareas con inicio/fin registrados.
// - Hs trabajadas: jornada fichada (misma fuente que Liquidación).
// - Hs contrato: horas/mes del legajo, prorrateadas por los días del mes que
//   caen en el período (y hasta hoy). Si no hay legajo, se usan las horas
//   programadas en Horarios.
// - Productividad: tiempo en tareas / hs contrato.
function _prodDatos(nombre, desde, hasta, detalle){
  const leg = _legajoDeEmpleado(nombre);
  const hsContratoMes = +leg?.horasContrato || 0;
  const tareasPorDia = {};
  detalle.forEach(d=>{ (tareasPorDia[d.fecha] ||= []).push(d); });
  const faltasPorDia = {};
  _faltasDe(nombre).forEach(f=>{ (faltasPorDia[f.fecha] ||= []).push(f); });

  const fin = hasta && hasta < D.TODAY_ISO ? hasta : D.TODAY_ISO;
  const ini = desde || Object.keys(tareasPorDia).sort()[0] || fin;
  const dias = [];
  const meses = new Map();
  const [ya,ma,da] = ini.split('-').map(Number);
  for(let d=new Date(ya,ma-1,da); _isoDia(d)<=fin; d.setDate(d.getDate()+1)){
    const iso = _isoDia(d);
    const mesKey = iso.slice(0,7);
    if(!meses.has(mesKey)){
      const [a,m] = mesKey.split('-').map(Number);
      meses.set(mesKey, { key:mesKey, diasMes:new Date(a,m,0).getDate(), diasEnRango:0, dias:0, tareas:0, minTareas:0, hsTrab:0, hsProg:0, faltas:0, faltasInj:0 });
    }
    const M = meses.get(mesKey);
    M.diasEnRango++;
    const tareas = tareasPorDia[iso] || [];
    const real = jornadaRealDia(nombre, iso);
    const h = (window.horariosData||{})[nombre]?.[iso];
    M.hsProg += (h?.desde && h?.hasta) ? calcHorasDia(h.desde, h.hasta) : 0;
    const faltas = faltasPorDia[iso] || [];
    M.faltas += faltas.length; M.faltasInj += faltas.filter(f=>!f.justificada).length;
    if(!tareas.length && !real){
      if(faltas.length) dias.push({ iso, tareas, minTareas:0, real:null, faltas });
      continue;
    }
    const minTareas = tareas.reduce((s,t)=>s+(t.dur||0),0);
    M.dias++; M.tareas += tareas.length; M.minTareas += minTareas; M.hsTrab += real?.horas || 0;
    dias.push({ iso, tareas, minTareas, real, faltas });
  }
  dias.reverse();

  const mesesArr = [...meses.values()].map(M=>{
    const [a,m] = M.key.split('-').map(Number);
    const hsRef = hsContratoMes ? hsContratoMes * M.diasEnRango / M.diasMes : M.hsProg;
    return { ...M, hsRef, label: _PROD_MESES[m-1]+' '+a };
  });
  const trims = new Map();
  mesesArr.forEach(M=>{
    const [a,m] = M.key.split('-').map(Number);
    const q = Math.floor((m-1)/3)+1;
    const k = a+'-T'+q;
    if(!trims.has(k)) trims.set(k, { key:k, label:`${q}º trimestre ${a}`, dias:0, tareas:0, minTareas:0, hsTrab:0, hsRef:0, faltas:0, faltasInj:0 });
    const T = trims.get(k);
    T.dias+=M.dias; T.tareas+=M.tareas; T.minTareas+=M.minTareas; T.hsTrab+=M.hsTrab; T.hsRef+=M.hsRef; T.faltas+=M.faltas; T.faltasInj+=M.faltasInj;
  });
  return { leg, hsContratoMes, dias, meses:mesesArr.reverse(), trims:[...trims.values()].reverse() };
}

function _prodPctColor(p){ return p==null ? 'var(--mid-gray)' : p>=80 ? 'var(--green-ok)' : p>=50 ? '#D4A820' : 'var(--red-alert)'; }
function _prodPct(num, den){ return den>0 ? Math.round(num/den*100) : null; }

function _prodResumenHTML(nombre, desde, hasta, m){
  const P = _prodDatos(nombre, desde, hasta, m.detalle);
  const th = (txt,align)=>`<th style="text-align:${align||'left'};padding:6px 10px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);white-space:nowrap">${txt}</th>`;
  const td = (txt,align,extra)=>`<td style="padding:6px 10px;font-size:12.5px;text-align:${align||'left'};white-space:nowrap;${extra||''}">${txt}</td>`;
  const pctCell = p => td(p==null?'—':p+'%','right',`font-weight:600;color:${_prodPctColor(p)}`);
  const hs = h => (Math.round(h*10)/10)+'h';

  const fuente = P.hsContratoMes
    ? `Horas de contrato según legajo: <strong>${P.hsContratoMes}h/mes</strong> (prorrateadas por los días del período).`
    : (P.leg ? 'El legajo no tiene horas de contrato cargadas: se usan las horas programadas en Horarios.'
             : `No se encontró a ${esc(nombre)} en el Legajo: se usan las horas programadas en Horarios. Cargá sus horas de contrato en RRHH › Legajo.`);

  const resumenRows = rows => rows.map(R=>`<tr>
    ${td(`<strong>${esc(R.label)}</strong>`)}
    ${td(R.dias,'center')}
    ${td(R.tareas,'center')}
    ${td(R.dias?(Math.round(R.tareas/R.dias*10)/10):'—','center')}
    ${td(fmtDur(R.minTareas),'right')}
    ${td(hs(R.hsTrab),'right')}
    ${td(R.hsRef?hs(R.hsRef):'—','right','color:var(--mid-gray)')}
    ${pctCell(_prodPct(R.hsTrab, R.hsRef))}
    ${pctCell(_prodPct(R.minTareas/60, R.hsRef))}
    ${td(R.faltas ? `${R.faltas}${R.faltasInj?` <span style="color:var(--red-alert);font-size:12px">(${R.faltasInj} sin just.)</span>`:' <span style="color:var(--green-ok);font-size:12px">(just.)</span>'}` : '0','center')}
  </tr>`).join('');
  const resumenHead = `<thead><tr>${th('Período')}${th('Días trab.','center')}${th('Tareas','center')}${th('Tareas/día','center')}${th('Tiempo en tareas','right')}${th('Hs trabajadas','right')}${th('Hs contrato','right')}${th('Cumplimiento','right')}${th('Productividad','right')}${th('Faltas','center')}</tr></thead>`;
  const tabla = (titulo, rows) => `<div style="margin-bottom:20px">
    <div style="font-size:13px;font-weight:600;color:var(--charcoal);margin-bottom:6px">${titulo}</div>
    <div class="table-wrapper"><table style="width:100%;border-collapse:collapse">${resumenHead}<tbody>${resumenRows(rows)}</tbody></table></div>
  </div>`;

  const diaRows = P.dias.map(D=>{
    const ocup = D.real ? _prodPct(D.minTareas/60, D.real.horas) : null;
    const tareasTxt = D.tareas.map(t=>`<div style="display:flex;gap:8px;padding:3px 0;border-top:1px solid var(--surface-2);font-size:12px">
        <span style="color:var(--mid-gray);min-width:84px">${t.inicio&&t.fin?esc(t.inicio)+'–'+esc(t.fin):'sin horario'}</span>
        <span style="color:var(--mid-gray);min-width:78px">${esc(t.area)}</span>
        <span style="flex:1">${esc(t.desc)}</span>
        <span style="${t.excedida?'color:var(--red-alert);font-weight:600':''}">${t.dur?fmtDur(t.dur):'—'}</span>
      </div>`).join('');
    const fecha = new Date(D.iso+'T12:00:00').toLocaleDateString('es-AR',{weekday:'short',day:'2-digit',month:'2-digit'});
    return `<details style="border-bottom:1px solid var(--light-gray)">
      <summary style="cursor:pointer;display:flex;gap:10px;align-items:center;padding:8px 6px;font-size:12.5px;flex-wrap:wrap">
        <strong style="min-width:92px;text-transform:capitalize">${esc(fecha)}</strong>
        <span style="min-width:70px">${D.tareas.length} tarea${D.tareas.length!==1?'s':''}</span>
        <span style="min-width:90px;color:var(--mid-gray)">${D.minTareas?fmtDur(D.minTareas)+' en tareas':'sin tiempos'}</span>
        <span style="min-width:120px;color:var(--mid-gray)">${D.real?`jornada ${esc(D.real.inicio)}–${esc(D.real.fin)} (${hs(D.real.horas)})`:'sin fichar'}</span>
        ${D.faltas.map(f=>`<span style="font-size:12px;font-weight:600;padding:2px 8px;border-radius:10px;${f.justificada?'background:var(--ok-soft);color:var(--green-ok)':'background:var(--alert-soft);color:var(--red-alert)'}">Falta ${f.justificada?'justificada':'sin justificar'} · ${esc(f.motivo||'')}</span>`).join('')}
        <span style="margin-left:auto;font-weight:600;color:${_prodPctColor(ocup)}" title="Tiempo en tareas sobre la jornada fichada">${ocup==null?'':ocup+'% ocupado'}</span>
      </summary>
      <div style="padding:2px 8px 10px">${tareasTxt || `<div style="font-size:12px;color:var(--mid-gray)">${D.real?'Fichó la jornada pero no registró tareas.':D.faltas.map(f=>esc(f.obs||'Sin observación')).join(' · ')}</div>`}</div>
    </details>`;
  }).join('');

  return `<div style="font-size:12px;color:var(--mid-gray);margin-bottom:12px;padding:8px 12px;background:#F7F5F0;border-radius:8px">${fuente}
      <br><strong>Cumplimiento</strong> = hs trabajadas (fichadas) / hs contrato · <strong>Productividad</strong> = tiempo en tareas / hs contrato.</div>
    ${tabla('Resumen mensual', P.meses)}
    ${tabla('Resumen trimestral', P.trims)}
    <div style="margin-bottom:20px">
      <div style="font-size:13px;font-weight:600;color:var(--charcoal);margin-bottom:6px">Historial por día (${P.dias.length} día${P.dias.length!==1?'s':''}) <span style="font-weight:400;font-size:12px;color:var(--mid-gray)">— tocá un día para ver sus tareas</span></div>
      <div style="max-height:420px;overflow-y:auto;border:1px solid var(--light-gray);border-radius:8px;background:var(--warm-white)">${diaRows || '<div style="padding:14px;font-size:12px;color:var(--mid-gray)">Sin actividad en el período.</div>'}</div>
    </div>`;
}

// Desde el detalle del Legajo: abre Evaluaciones con el empleado ya elegido.
export function legVerProductividad(){
  const e = legajoData[_legDetIdx]; if(!e) return;
  D.closeModal('legajo-detalle-modal');
  D.navigate('evaluaciones');
  const sel = document.getElementById('perf-empleado'); if(!sel) return;
  sel.value = _nombreAppLegajo(e);
  perfPreset('3m');
}

// Arma el HTML de las métricas de un empleado (tarjetas + desglose por área +
// por tarea + detalle). Reutilizado por Evaluaciones y por Cierre del Día.
export function _metricasHTML(m){
  const card = (label, value, sub, color) => `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;padding:12px 14px">
    <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">${label}</div>
    <div style="font-size:23px;font-weight:700;color:${color||'var(--charcoal)'};line-height:1.1">${value}</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-top:4px">${sub||''}</div>
  </div>`;
  const promTotal = m.total.conTiempo ? Math.round(m.total.min/m.total.conTiempo) : null;
  const cards = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:18px">
    ${card('Tareas hechas', m.total.n, `${m.total.conTiempo} con tiempo registrado`, 'var(--charcoal)')}
    ${card('Prom. por tarea', promTotal!=null?promTotal+' min':'—', promTotal!=null?'sobre las tareas cronometradas':'sin horarios cargados', 'var(--charcoal)')}
    ${card('Tiempo total', fmtDur(m.total.min), 'en tareas con horario', 'var(--charcoal)')}
    ${card('Pasadas de tiempo', m.total.excedidas, 'tareas de florería sobre el estimado', m.total.excedidas?'var(--red-alert)':'var(--green-ok)')}
  </div>`;

  // Desglose por área
  const areaRows = Object.entries(m.areas).filter(([,a])=>a.n>0).map(([nombreArea,a])=>{
    const prom = a.conTiempo ? Math.round(a.min/a.conTiempo)+' min' : '—';
    return `<tr>
      <td style="padding:6px 12px;font-size:13px;font-weight:500">${esc(nombreArea)}</td>
      <td style="padding:6px 12px;text-align:center">${a.n}</td>
      <td style="padding:6px 12px;text-align:right">${prom}</td>
      <td style="padding:6px 12px;text-align:right;color:var(--mid-gray)">${fmtDur(a.min)}</td>
    </tr>`;
  }).join('');
  const th = (txt,align)=>`<th style="text-align:${align||'left'};padding:6px 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">${txt}</th>`;
  const desgloseArea = `<div style="margin-bottom:20px">
    <div style="font-size:13px;font-weight:600;color:var(--charcoal);margin-bottom:6px">Por área</div>
    <div class="table-wrapper"><table style="width:100%;border-collapse:collapse">
      <thead><tr>${th('Área')}${th('Tareas','center')}${th('Prom. tiempo','right')}${th('Tiempo total','right')}</tr></thead>
      <tbody>${areaRows}</tbody>
    </table></div>
  </div>`;

  // Desglose por tarea
  const tareaRows = m.tareas.map(t=>{
    const prom = t.conTiempo ? Math.round(t.min/t.conTiempo)+' min' : '—';
    return `<tr>
      <td style="padding:6px 12px;font-size:12.5px;font-weight:500">${esc(t.desc)}</td>
      <td style="padding:6px 12px;font-size:12px;color:var(--mid-gray)">${esc(t.area)}</td>
      <td style="padding:6px 12px;text-align:center">${t.n}</td>
      <td style="padding:6px 12px;text-align:right">${prom}</td>
    </tr>`;
  }).join('');
  const desgloseTarea = `<div style="margin-bottom:20px">
    <div style="font-size:13px;font-weight:600;color:var(--charcoal);margin-bottom:6px">Por tarea</div>
    <div class="table-wrapper" style="max-height:280px;overflow-y:auto"><table style="width:100%;border-collapse:collapse">
      <thead><tr>${th('Tarea')}${th('Área')}${th('Veces','center')}${th('Prom. tiempo','right')}</tr></thead>
      <tbody>${tareaRows}</tbody>
    </table></div>
  </div>`;

  // Detalle tarea por tarea
  const detRows = m.detalle.map(d=>`<tr>
    <td style="padding:5px 12px;font-size:12px;white-space:nowrap">${fmtDate(d.fecha)}</td>
    <td style="padding:5px 12px;font-size:12px;color:var(--mid-gray)">${esc(d.area)}</td>
    <td style="padding:5px 12px;font-size:12px">${esc(d.desc)}</td>
    <td style="padding:5px 12px;text-align:right;font-size:12px;${d.excedida?'color:var(--red-alert);font-weight:600':''}">${d.dur?fmtDur(d.dur):'—'}</td>
  </tr>`).join('');
  const detalle = `<div>
    <div style="font-size:13px;font-weight:600;color:var(--charcoal);margin-bottom:6px">Detalle (${m.detalle.length} tarea${m.detalle.length!==1?'s':''})</div>
    <div class="table-wrapper" style="max-height:340px;overflow-y:auto"><table style="width:100%;border-collapse:collapse">
      <thead><tr>${th('Fecha')}${th('Área')}${th('Tarea')}${th('Tiempo','right')}</tr></thead>
      <tbody>${detRows}</tbody>
    </table></div>
  </div>`;

  return cards + desgloseArea + desgloseTarea + detalle;
}

export function renderReportesEquipo(){
  _repMeses('rep-eq-mes');
  const mesISO = document.getElementById('rep-eq-mes')?.value || D.TODAY_ISO.slice(0,7);
  const empleados = getEmpleadosActivos();

  // Poblar selector empleados
  const sel = document.getElementById('rep-eq-empleado');
  if(sel && sel.querySelectorAll('option').length <= 1){
    sel.innerHTML = '<option value="">— Todos —</option>' + empleados.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
  }
  const filtroEmp = document.getElementById('rep-eq-empleado')?.value || '';
  const lista = filtroEmp ? [filtroEmp] : empleados;

  let totalHsProg=0, totalHsTrab=0, diasConTurno=0, empleadosActivos=0;

  const prevMes = _mesPrevio(mesISO);
  const datosEmpleado = lista.map(nombre => {
    const m = _metricasEmpleadoMes(nombre, mesISO);
    const cumplPrev = _metricasEmpleadoMes(nombre, prevMes).cumplimiento;
    totalHsProg+=m.hsProg; totalHsTrab+=m.hsTrab; diasConTurno+=m.diasProg;
    if(m.hsProg>0) empleadosActivos++;
    return { nombre, hsProg:m.hsProg, hsTrab:m.hsTrab, dias:m.diasProg, m, cumplPrev };
  });
  // Ranking: mayor cumplimiento primero (los que no tienen datos, al final)
  datosEmpleado.sort((a,b)=>(b.m.cumplimiento??-1)-(a.m.cumplimiento??-1));

  // KPIs
  const pctGlobal = totalHsProg>0 ? Math.round(totalHsTrab/totalHsProg*100) : 0;
  document.getElementById('rep-eq-kpis').innerHTML =
    _kpiCard('Empleados activos', empleadosActivos, 'con turno en el mes') +
    _kpiCard('Horas programadas', totalHsProg.toFixed(1)+'h', 'en el mes') +
    _kpiCard('Horas registradas', totalHsTrab.toFixed(1)+'h', 'según registros', pctGlobal>=80?'var(--green-ok)':pctGlobal>=50?'#D4A820':'var(--red-alert)') +
    _kpiCard('Cumplimiento', pctGlobal+'%', 'horas trab./programadas', pctGlobal>=80?'var(--green-ok)':'#D4A820');

  // Gráfico barras hs programadas vs trabajadas
  _destroyChart('rep-eq-hs');
  const ctx1 = document.getElementById('rep-eq-chart-hs')?.getContext('2d');
  if(ctx1){
    _chartInstances['rep-eq-hs'] = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: datosEmpleado.map(d=>d.nombre),
        datasets: [
          { label: 'Programado', data: datosEmpleado.map(d=>d.hsProg), backgroundColor: 'rgba(101,130,90,0.3)', borderColor: '#65825A', borderWidth: 2, borderRadius: 4 },
          { label: 'Trabajado', data: datosEmpleado.map(d=>d.hsTrab), backgroundColor: 'rgba(101,130,90,0.8)', borderColor: '#65825A', borderWidth: 2, borderRadius: 4 }
        ]
      },
      options: { responsive:true, plugins:{ legend:{ labels:{ font:{size:11} } } }, scales:{ y:{ beginAtZero:true, ticks:{ font:{size:11} } }, x:{ ticks:{ font:{size:11} } } } }
    });
  }

  // Gráfico asistencia (días con turno por empleado)
  _destroyChart('rep-eq-asist');
  const ctx2 = document.getElementById('rep-eq-chart-asist')?.getContext('2d');
  if(ctx2){
    _chartInstances['rep-eq-asist'] = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: datosEmpleado.map(d=>d.nombre),
        datasets: [{ label: 'Días con turno', data: datosEmpleado.map(d=>d.dias), backgroundColor: 'rgba(180,150,100,0.7)', borderColor: '#B49664', borderWidth: 2, borderRadius: 4 }]
      },
      options: { responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ font:{size:11} } }, x:{ ticks:{ font:{size:11} } } } }
    });
  }

  // Tabla ranking (ordenada por cumplimiento) — clic en la fila abre la ficha 360
  document.getElementById('rep-eq-tabla').innerHTML = `<div style="font-size:12px;color:var(--mid-gray);margin-bottom:8px">Ranking del mes — tocá una fila para ver la ficha completa de la persona</div>
  <div class="table-wrapper"><table class="stock-table">
    <thead><tr><th>#</th><th>Empleado</th><th>Área</th><th>Asist.</th><th>Puntualidad</th><th>Hs prog</th><th>Hs reg</th><th>Cumplimiento</th><th>Llamados</th><th></th></tr></thead>
    <tbody>${datosEmpleado.map((d,rank)=>{
      const m = d.m;
      const pct = m.cumplimiento;
      const col = pct==null?'var(--mid-gray)':pct>=80?'var(--green-ok)':pct>=50?'#D4A820':'var(--red-alert)';
      const trend = (pct!=null && d.cumplPrev!=null && Math.abs(pct-d.cumplPrev)>=1)
        ? (pct-d.cumplPrev>0?' <span style="color:var(--green-ok);font-size:12px">▲</span>':' <span style="color:var(--red-alert);font-size:12px">▼</span>') : '';
      const asisCol = m.asistencia==null?'var(--mid-gray)':m.asistencia>=90?'var(--green-ok)':m.asistencia>=70?'#D4A820':'var(--red-alert)';
      const nEsc = esc(d.nombre).replace(/'/g,"\\'");
      return `<tr style="cursor:pointer" onclick="openFichaEmpleado('${nEsc}')">
        <td style="color:var(--mid-gray);font-weight:600">${pct!=null?rank+1:'—'}</td>
        <td><strong>${esc(d.nombre)}</strong></td>
        <td>${isJardinero(d.nombre)?'Jardinería':'Florería'}</td>
        <td style="color:${asisCol};font-weight:600">${m.asistencia!=null?m.asistencia+'%':'—'}</td>
        <td>${m.diasTarde?`<span style="color:var(--amber)">${icon('clock')}${m.diasTarde} (${m.minTarde}min)</span>`:(m.diasFichados?'<span style="color:var(--green-ok)">✓ en hora</span>':'—')}</td>
        <td>${d.hsProg}h</td>
        <td>${d.hsTrab}h</td>
        <td style="color:${col};font-weight:600">${pct!=null?pct+'%'+trend:'—'}</td>
        <td>${m.llamados?`<span style="color:var(--red-alert);font-weight:600">${m.llamados}</span>`:'—'}</td>
        <td><button class="btn-secondary" style="font-size:12px;padding:3px 10px" onclick="event.stopPropagation();openFichaEmpleado('${nEsc}')">Ficha</button></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;

  renderReporteTiempos(mesISO, filtroEmp);
}

// ── Reporte: tiempos del checklist, real vs referencia ────────────────────────
// Usa el historial del checklist (duración, referencia y flag excedida por
// registro) para mostrar promedio real vs tiempo de referencia por tarea y
// resumen de excedidas por florista.
function renderReporteTiempos(mesISO, filtroEmp){
  const el = document.getElementById('rep-eq-tiempos');
  if(!el) return;
  const regs = (D.checklistHistory||[]).filter(r =>
    (r?.date||'').startsWith(mesISO) && (parseInt(r?.duracion)||0) > 0 && (!filtroEmp || r.who === filtroEmp)
  );
  const titulo = '<div class="section-title" style="margin-bottom:6px">Tiempos del checklist — real vs referencia</div>'
    + '<div style="font-size:12px;color:var(--mid-gray);margin-bottom:14px">Tareas completadas con Inicio/Fin registrado en el mes. El desvío compara el promedio real contra el tiempo de referencia.</div>';
  if(!regs.length){
    el.innerHTML = titulo + '<p style="color:var(--mid-gray);font-size:13px">Sin tareas con duración registrada en el mes seleccionado.</p>';
    return;
  }

  // Por tarea (sección + zona + actividad)
  const porTarea = new Map();
  regs.forEach(r=>{
    const k = (r.sec||'')+'|'+(r.zona||'')+'|'+String(r.actividad||'').toLowerCase();
    if(!porTarea.has(k)) porTarea.set(k, {sec:r.sec, zona:r.zona, actividad:r.actividad, total:0, n:0, exc:0, ref:0});
    const o = porTarea.get(k);
    o.total += parseInt(r.duracion)||0; o.n++;
    if(r.excedida) o.exc++;
    const rr = parseInt(r.ref)||0; if(rr) o.ref = rr;
  });
  const tareas = [...porTarea.values()].map(o=>{
    if(!o.ref){
      // Registros viejos sin ref guardada: usar la referencia actual de la zona
      const idx = CL_TASKS.findIndex(t=>t.sec===o.sec && t.zona===o.zona);
      if(idx>=0) o.ref = getTiempoRef(idx, o.actividad);
    }
    o.prom = Math.round(o.total/o.n);
    o.desvio = o.ref ? Math.round((o.prom-o.ref)/o.ref*100) : null;
    return o;
  }).sort((a,b)=>(b.desvio??-999)-(a.desvio??-999));

  // Por florista
  const porFlor = new Map();
  regs.forEach(r=>{
    const k = r.who || '—';
    if(!porFlor.has(k)) porFlor.set(k, {n:0, total:0, exc:0});
    const o = porFlor.get(k); o.n++; o.total += parseInt(r.duracion)||0; if(r.excedida) o.exc++;
  });
  const florRows = [...porFlor.entries()].map(([nombre,o])=>({nombre, ...o, prom:Math.round(o.total/o.n)}))
    .sort((a,b)=>b.exc-a.exc || b.n-a.n);

  el.innerHTML = titulo + `
    <div class="table-wrapper" style="margin-bottom:20px"><table class="stock-table" style="min-width:640px">
      <thead><tr><th>Tarea</th><th>Actividad</th><th>Veces</th><th>Promedio real</th><th>Referencia</th><th>Desvío</th><th>Excedidas</th></tr></thead>
      <tbody>${tareas.map(o=>{
        const col = o.desvio===null ? 'var(--mid-gray)' : o.desvio>0 ? 'var(--red-alert)' : 'var(--green-ok)';
        const desTxt = o.desvio===null ? 'sin ref.' : (o.desvio>0?'+':'')+o.desvio+'%';
        return `<tr>
          <td><strong>${esc(o.zona||'')}</strong></td>
          <td><span class="badge ${getBadge(o.actividad)}">${esc(o.actividad||'')}</span></td>
          <td style="text-align:center">${o.n}</td>
          <td style="font-weight:600">${fmtDur(o.prom)}</td>
          <td>${o.ref?o.ref+'m':'—'}</td>
          <td style="color:${col};font-weight:600">${desTxt}</td>
          <td style="text-align:center">${o.exc?'<span style="color:var(--red-alert);font-weight:600">'+o.exc+' </span>':'0'}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>
    <div class="table-wrapper"><table class="stock-table" style="min-width:480px">
      <thead><tr><th>Florista</th><th>Tareas con tiempo</th><th>Promedio por tarea</th><th>Excedidas</th><th>% excedidas</th></tr></thead>
      <tbody>${florRows.map(o=>{
        const pct = Math.round(o.exc/o.n*100);
        const col = pct>=30?'var(--red-alert)':pct>=15?'#A06A00':'var(--green-ok)';
        return `<tr><td><strong>${esc(o.nombre)}</strong></td><td style="text-align:center">${o.n}</td><td style="font-weight:600">${fmtDur(o.prom)}</td><td style="text-align:center">${o.exc}</td><td style="color:${col};font-weight:600">${pct}%</td></tr>`;
      }).join('')}</tbody>
    </table></div>`;
}

export function exportReporteEquipo(){
  const mesISO = document.getElementById('rep-eq-mes')?.value || D.TODAY_ISO.slice(0,7);
  const rows = [['Empleado','Área','Hs Programadas','Hs Trabajadas','Cumplimiento%']];
  getEmpleadosActivos().forEach(nombre=>{
    const { hsProg, hsTrab } = _horasMesEmpleado(nombre, mesISO);
    const pct=hsProg>0?Math.round(hsTrab/hsProg*100):0;
    rows.push([nombre,isJardinero(nombre)?'Jardinería':'Florería',hsProg.toFixed(1),hsTrab.toFixed(1),hsProg>0?pct:'—']);
  });
  D._downloadCSV(rows, `reporte-equipo-${mesISO}.csv`);
}

// ── Reportes Ventas ───────────────────────────────────────────────────────────
export function renderReportesVentas(){
  _repMeses('rep-vt-mes');
  const mesISO = document.getElementById('rep-vt-mes')?.value || D.TODAY_ISO.slice(0,7);

  // Últimos 6 meses para trend
  const now = new Date();
  const mesesLabels=[], mesesTotales=[];
  for(let i=5;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    mesesLabels.push(['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][d.getMonth()]);
    const total=(ventasData||[]).filter(v=>(v.fecha||'').startsWith(iso)).reduce((s,v)=>s+parseMoney(v.precio),0);
    mesesTotales.push(total);
  }

  const ventasMes=(ventasData||[]).filter(v=>(v.fecha||'').startsWith(mesISO));
  const totalMes=ventasMes.reduce((s,v)=>s+parseMoney(v.precio),0);
  const confirmadas=ventasMes.filter(v=>v.estado==='confirmado'||v.estado==='entregado').length;
  const pendientes=ventasMes.filter(v=>v.estado==='pendiente').length;
  const eventosHoy=(D.eventosData||[]).filter(e=>e.fecha?.startsWith(mesISO)).length;

  // Comparativa mes vs mes anterior
  const [_yy,_mm] = mesISO.split('-').map(Number);
  const _prevD = new Date(_yy, _mm-2, 1);
  const prevISO = `${_prevD.getFullYear()}-${String(_prevD.getMonth()+1).padStart(2,'0')}`;
  const prevTotal = (ventasData||[]).filter(v=>(v.fecha||'').startsWith(prevISO)).reduce((s,v)=>s+parseMoney(v.precio),0);
  let deltaSub;
  if(prevTotal>0){
    const pct = Math.round((totalMes-prevTotal)/prevTotal*100);
    const up = pct>=0;
    deltaSub = `<span style="color:${up?'var(--green-ok)':'var(--red-alert)'};font-weight:600">${up?'▲':'▼'} ${Math.abs(pct)}%</span> vs mes anterior ($${prevTotal.toLocaleString('es-AR')})`;
  } else {
    deltaSub = totalMes>0 ? 'sin datos del mes anterior' : D.fmtMonth(mesISO);
  }

  document.getElementById('rep-vt-kpis').innerHTML =
    _kpiCard('Total ventas', '$'+totalMes.toLocaleString('es-AR'), deltaSub) +
    _kpiCard('Confirmadas', confirmadas, 'ventas confirmadas/entregadas', 'var(--green-ok)') +
    _kpiCard('Pendientes', pendientes, 'ventas pendientes') +
    _kpiCard('Eventos en el mes', eventosHoy, 'eventos/bodas');

  // Trend 6 meses
  _destroyChart('rep-vt-trend');
  const ctx1=document.getElementById('rep-vt-chart-trend')?.getContext('2d');
  if(ctx1 && typeof Chart!=='undefined'){
    _chartInstances['rep-vt-trend']=new Chart(ctx1,{
      type:'line',
      data:{ labels:mesesLabels, datasets:[{ label:'Ventas ($)', data:mesesTotales, fill:true, backgroundColor:'rgba(101,130,90,0.15)', borderColor:'#65825A', borderWidth:2, tension:0.4, pointRadius:4 }] },
      options:{ responsive:true, plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true, ticks:{ font:{size:11}, callback:v=>'$'+v.toLocaleString('es-AR') } }, x:{ticks:{font:{size:11}}} } }
    });
  }

  // Eventos por estado (donut)
  const estadoCount={};
  (D.eventosData||[]).filter(e=>e.fecha?.startsWith(mesISO)).forEach(e=>{ estadoCount[e.estado||'Sin estado']=(estadoCount[e.estado||'Sin estado']||0)+1; });
  _destroyChart('rep-vt-ev');
  const ctx2=document.getElementById('rep-vt-chart-ev')?.getContext('2d');
  if(ctx2&&Object.keys(estadoCount).length&&typeof Chart!=='undefined'){
    _chartInstances['rep-vt-ev']=new Chart(ctx2,{
      type:'doughnut',
      data:{ labels:Object.keys(estadoCount), datasets:[{ data:Object.values(estadoCount), backgroundColor:['#65825A','#B49664','#A0BFAB','#D4A820','#c0392b','#7f8c8d'] }] },
      options:{ responsive:true, plugins:{ legend:{ position:'bottom', labels:{ font:{size:11} } } } }
    });
  } else if(ctx2){ ctx2.canvas.parentElement.innerHTML += '<div style="text-align:center;color:var(--mid-gray);padding:20px;font-size:12px">Sin eventos este mes</div>'; }

  // Tabla
  const porEmp={};
  ventasMes.forEach(v=>{ const n=v.asignado||'Sin asignar'; if(!porEmp[n])porEmp[n]={total:0,cnt:0}; porEmp[n].total+=parseMoney(v.precio); porEmp[n].cnt++; });

  // Top productos del mes (por facturación)
  const porProd={};
  ventasMes.forEach(v=>{ const n=(v.prod||'').trim()||'Sin especificar'; if(!porProd[n])porProd[n]={total:0,cnt:0}; porProd[n].total+=parseMoney(v.precio); porProd[n].cnt++; });
  const topProd = Object.entries(porProd).sort((a,b)=>b[1].total-a[1].total).slice(0,8);
  const maxProd = topProd.length ? topProd[0][1].total : 0;

  document.getElementById('rep-vt-tabla').innerHTML=`
    <div class="section-title" style="font-size:16px">Ventas por empleado</div>
    <div class="table-wrapper"><table class="stock-table">
      <thead><tr><th>Empleado</th><th>Ventas</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${Object.entries(porEmp).sort((a,b)=>b[1].total-a[1].total).map(([n,d])=>`<tr><td>${esc(n)}</td><td>${d.cnt}</td><td style="text-align:right">$${d.total.toLocaleString('es-AR')}</td></tr>`).join('')||'<tr><td colspan="3" style="color:var(--mid-gray)">Sin ventas este mes</td></tr>'}</tbody>
    </table></div>
    <div class="section-title" style="font-size:16px;margin-top:22px">Top productos del mes</div>
    <div class="table-wrapper"><table class="stock-table">
      <thead><tr><th>Producto</th><th>Unidades</th><th style="text-align:right">Total</th><th style="width:120px">Participación</th></tr></thead>
      <tbody>${topProd.map(([n,d])=>{
        const pct = maxProd>0 ? Math.round(d.total/maxProd*100) : 0;
        return `<tr><td style="font-weight:500">${esc(n)}</td><td>${d.cnt}</td><td style="text-align:right">$${d.total.toLocaleString('es-AR')}</td>
          <td><div class="stock-bar" style="width:100px"><div class="stock-fill ok" style="width:${pct}%"></div></div></td></tr>`;
      }).join('')||'<tr><td colspan="4" style="color:var(--mid-gray)">Sin ventas este mes</td></tr>'}</tbody>
    </table></div>`;
}

export function exportReporteVentas(){
  const mesISO=document.getElementById('rep-vt-mes')?.value||D.TODAY_ISO.slice(0,7);
  const rows=[['Fecha','Descripción','Precio','Estado','Asignado']];
  (ventasData||[]).filter(v=>(v.fecha||'').startsWith(mesISO)).forEach(v=>rows.push([v.fecha,v.descripcion||'',v.precio||'',v.estado||'',v.asignado||'']));
  D._downloadCSV(rows,`reporte-ventas-${mesISO}.csv`);
}