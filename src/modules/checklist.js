// Separado de app.js. Lo que necesita de app.js llega por configurarChecklist():
//   DIAS_SEMANA_NAMES, TODAY_DAY, TODAY_ISO, _btnGuiaArreglo, _setChecklistHistory, _setClStateByDay, addDaysISO, badgeDiaRelativa, checklistHistory, clStateByDay, closeModal, eventosData, fbSave, floristaNombre, getWeekLabel, notificarAsignacion, openVentaDetail, renderEvHoraCell, renderFlorTurnoCard, renderLlamadosChecklist, renderProductividadCL, renderVentaHoraCell, userRole

import { setTareasBusqueda } from './busqueda-global.js';
import { confirmModal, promptModal } from './modales.js';
import { showToast } from './tema-toast.js';
import { esc, fmtDate } from './utils.js';
import { _saveEventos, openEventoDetail } from './eventos.js';
import { icon } from './iconos.js';
import { ventasData } from './ventas.js';
import { comprimirImagen } from './imagenes.js';

let D = {};
export function configurarChecklist(deps){
  D = deps;
  if(['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].includes(D.TODAY_DAY)) currentDay = D.TODAY_DAY;
}

// ════════════════════════════════════════
// DATA — CHECKLIST
// Actividad options, Tiempo options, Responsable options are now editable per row
// ════════════════════════════════════════
const CL_ACTIVIDAD_OPTS = ['Nuevo','Retoque','Riego'];
export let CL_RESP_OPTS = ['Caro','Clo','Cris','Gabi','Ivan','Jardineria','Pao','Nora'];

// Sections: 'a'=Alvear (crema), 'b'=Posadas (azul), 'c'=Florería (rosa)
export const CL_TASKS = [
  // ── ALVEAR ──────────────────────────────────────────────────────────────
  {sec:'a',zona:'Bochitas',            actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'2° 3° 4° Piso',       actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Lobby Alvear',         actividad:'Riego',     obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Lobby Alvear',         actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Lobby Alvear',         actividad:'Retoque', obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Recepción Alvear',     actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Mesa Ratona Alvear',   actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Biblioteca',           actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Salón Privado',        actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Mesada P. Nobile',     actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Mesitas P. Nobile',    actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Mesas Duhau',          actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Baños Duhau',          actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Copón Duhau',          actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Copón Duhau',          actividad:'Retoque', obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Chimenea Vinoteca',    actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Mesada Vinoteca',      actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Chimeneas P. Nobile',  actividad:'Retoque',   obs:'',tiempo:'', responsable:''},
  {sec:'a',zona:'Elefante',             actividad:'Riego',     obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Elefante',             actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Foyer Spa',            actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Spa recepción',        actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Spa (cabinas)',         actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Spa (vestuarios D)',    actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Spa (vestuarios C)',    actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  // ── POSADAS ─────────────────────────────────────────────────────────────
  {sec:'b',zona:'Baños P. de las Artes',actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Lobby Posadas',         actividad:'Riego',     obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Lobby Posadas',         actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Mesa Ratona Posadas',   actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Recepción Posadas',     actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Gioia',                 actividad:'Retoque',   obs:'Arreglos perimetrales + 2 buffets',tiempo:'',responsable:''},
  {sec:'b',zona:'Gioia',                 actividad:'Retoque', obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Mesas Gioia',           actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Copón Gioia',           actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Foyer Posadas',         actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Totems',                actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Meeting Rooms',         actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Baños Meetings',        actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Tilo',                  actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Pisos',                 actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  // ── FLORERÍA ────────────────────────────────────────────────────────────
  {sec:'c',zona:'Maison (Bertone)',       actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'c',zona:'Cámara',                actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'c',zona:'Bolsa de Cámara',       actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'c',zona:'Ingreso Pedido',        actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'c',zona:'Ramos',                 actividad:'Retoque', obs:'1 de cada uno',tiempo:'',responsable:''},
  {sec:'c',zona:'Florería',              actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
];

const SEC_HEADERS = {
  a: {label:'ALVEAR',      cls:'cl-sec-a', rowCls:'row-sec-a', icon:''},
  b: {label:'POSADAS',     cls:'cl-sec-b', rowCls:'row-sec-b', icon:''},
  c: {label:'FLORERÍA',    cls:'cl-sec-c', rowCls:'row-sec-c', icon:''},
};

export let clState = null;   // referencia al día activo (alias)

// ── Tiempo promedio de referencia por tarea (lo define gerencia) ─────────────
// Minutos por índice de CL_TASKS; 0 = sin referencia. Compartido vía Firebase.
// Cada tarea guarda un tiempo estimado POR actividad: {nuevo, retoque, riego}.
// Antes era un único número por tarea; los datos viejos se migran tomando ese
// número como el tiempo de Retoque (y de Riego para las zonas de riego), y el
// tiempo de "Nuevo" arranca vacío para que gerencia lo cargue.
export let clTiemposRef = [];
function _normRef(v){
  if(v && typeof v === 'object'){
    return { nuevo:parseInt(v.nuevo)||0, retoque:parseInt(v.retoque)||0, riego:parseInt(v.riego)||0 };
  }
  const n = parseInt(v)||0; // dato viejo: tiempo único por tarea
  return { nuevo:0, retoque:n, riego:n };
}
function _refKey(act){
  const a = String(act||'').toLowerCase();
  return a==='nuevo' ? 'nuevo' : (a==='riego' ? 'riego' : 'retoque');
}
window._setClTiemposRef = (val) => {
  clTiemposRef = val ? CL_TASKS.map((_,i)=>_normRef(val[i])) : [];
};
// Tiempo estimado de la tarea i para una actividad dada. Sin actividad explícita
// usa la del día activo (o el default de la tarea).
export function getTiempoRef(i, act){
  const o = _normRef(clTiemposRef[i]);
  const a = act != null ? act : ((clState && clState.actividad && clState.actividad[i]) || CL_TASKS[i]?.actividad || 'Retoque');
  return o[_refKey(a)] || 0;
}

// ── Zonas/secciones editables por gerencia (persistidas en Firebase) ──────────
// CL_TASKS y SEC_HEADERS arrancan con los valores por defecto; si hay config
// guardada en Firebase, la reemplaza. Ojo: el estado del checklist (por día) y
// clTiemposRef se indexan por POSICIÓN, así que al agregar/borrar zonas hay que
// reindexar todos esos arrays para no desalinear.
const _CL_TASKS_DEFAULT = JSON.parse(JSON.stringify(CL_TASKS));
setTareasBusqueda(CL_TASKS);

window._setChecklistTareas = (arr) => {
  if(!Array.isArray(arr) || !arr.length) return;
  CL_TASKS.splice(0, CL_TASKS.length, ...arr.map(t=>({
    sec: t.sec||'a', zona: String(t.zona||''), actividad: t.actividad||'Retoque',
    obs: t.obs||'', tiempo:'', responsable:''
  })));
  if(document.getElementById('page-checklist')?.classList.contains('active') && !(window.estaEditando&&window.estaEditando('page-checklist'))) renderChecklistTable?.();
};
window._setChecklistSecciones = (obj) => {
  if(!obj || typeof obj !== 'object') return;
  Object.keys(obj).forEach(sec => {
    SEC_HEADERS[sec] = {
      label: obj[sec].label || SEC_HEADERS[sec]?.label || sec.toUpperCase(),
      icon:  obj[sec].icon  || SEC_HEADERS[sec]?.icon  || '',
      cls:    SEC_HEADERS[sec]?.cls    || ('cl-sec-'+sec),
      rowCls: SEC_HEADERS[sec]?.rowCls || ('row-sec-'+sec),
    };
  });
  if(document.getElementById('page-checklist')?.classList.contains('active')) renderChecklistTable?.();
};

function _persistChecklistConfig(){
  D.fbSave('checklistTareas', CL_TASKS.map(t=>({sec:t.sec, zona:t.zona, actividad:t.actividad, obs:t.obs||''})));
  const secObj = {};
  Object.keys(SEC_HEADERS).forEach(s=>{ secObj[s] = {label:SEC_HEADERS[s].label, icon:SEC_HEADERS[s].icon}; });
  D.fbSave('checklistSecciones', secObj);
}

const _CL_FIELDS = ['checked','actividad','obs','tiempo','inicio','fin','responsable'];

// Inserta una zona en CL_TASKS y reindexa el estado de cada día + clTiemposRef
function _clInsertTaskAt(index, task){
  Object.keys(D.clStateByDay).forEach(d => getOrCreateDayState(d)); // normalizar largos
  CL_TASKS.splice(index, 0, {sec:task.sec, zona:task.zona, actividad:task.actividad||'Retoque', obs:task.obs||'', tiempo:'', responsable:''});
  Object.values(D.clStateByDay).forEach(ds=>{
    _CL_FIELDS.forEach(k=>{
      if(!Array.isArray(ds[k])) return;
      const def = k==='checked' ? false : (k==='actividad' ? (task.actividad||'Retoque') : (k==='obs' ? (task.obs||'') : ''));
      ds[k].splice(index, 0, def);
    });
  });
  while(clTiemposRef.length < index) clTiemposRef.push(0);
  clTiemposRef.splice(index, 0, 0);
}

// Borra una zona y reindexa todo el estado
function _clRemoveTaskAt(index){
  Object.keys(D.clStateByDay).forEach(d => getOrCreateDayState(d));
  CL_TASKS.splice(index, 1);
  Object.values(D.clStateByDay).forEach(ds=>{
    _CL_FIELDS.forEach(k=>{ if(Array.isArray(ds[k])) ds[k].splice(index, 1); });
  });
  if(clTiemposRef.length > index) clTiemposRef.splice(index, 1);
}

// Intercambia dos zonas (y todo su estado por día + tiempos) para reordenar
function _clSwapTasks(i, j){
  if(i===j) return;
  Object.keys(D.clStateByDay).forEach(d => getOrCreateDayState(d));
  const tmp = CL_TASKS[i]; CL_TASKS[i] = CL_TASKS[j]; CL_TASKS[j] = tmp;
  Object.values(D.clStateByDay).forEach(ds=>{
    _CL_FIELDS.forEach(k=>{
      if(Array.isArray(ds[k]) && ds[k].length>Math.max(i,j)){ const t=ds[k][i]; ds[k][i]=ds[k][j]; ds[k][j]=t; }
    });
  });
  while(clTiemposRef.length <= Math.max(i,j)) clTiemposRef.push(0);
  const t = clTiemposRef[i]; clTiemposRef[i]=clTiemposRef[j]; clTiemposRef[j]=t;
}

// Persiste el estado completo (todos los días + tiempos + config) tras un cambio estructural
function _clPersistTrasCambio(){
  try{ localStorage.setItem(CL_STORAGE_KEY, JSON.stringify(D.clStateByDay)); }catch(e){}
  window._checklistLastSave = Date.now();
  Object.keys(D.clStateByDay).forEach(d=>{ if(window.fbSetPath) window.fbSetPath('checklist/'+d, D.clStateByDay[d]); });
  D.fbSave('clTiemposRef', clTiemposRef);
  _persistChecklistConfig();
}

// ── Acciones de gestión (solo gerencia) ──
export async function clAddZona(sec){
  if(D.userRole!=='gerencia') return;
  const nombre = await promptModal('Nombre de la nueva zona / arreglo:', { title:'Agregar zona' });
  if(!nombre || !nombre.trim()) return;
  const actividad = await promptModal('Actividad por defecto (Retoque / Nuevo / Riego):', { title:'Agregar zona', default:'Retoque' });
  // Insertar al final del grupo de esa sección para mantener el orden visual
  let insertIdx = CL_TASKS.length;
  for(let i=CL_TASKS.length-1;i>=0;i--){ if(CL_TASKS[i].sec===sec){ insertIdx=i+1; break; } }
  _clInsertTaskAt(insertIdx, { sec, zona:nombre.trim(), actividad:(actividad||'Retoque').trim() });
  _clPersistTrasCambio();
  clState = getOrCreateDayState(currentDay);
  renderChecklistTable();
  openGestionZonas();
  showToast(`Zona "${nombre.trim()}" agregada a ${SEC_HEADERS[sec]?.label||sec}`);
}

export async function clRenameZona(index){
  if(D.userRole!=='gerencia') return;
  const t = CL_TASKS[index]; if(!t) return;
  const nuevo = await promptModal('Nuevo nombre para la zona:', { title:'Renombrar zona', default:t.zona });
  if(!nuevo || !nuevo.trim() || nuevo.trim()===t.zona) return;
  // Migrar el registro persistente de "último Nuevo" al nuevo nombre
  const kOld=_zonaKey(t.sec,t.zona), kNew=_zonaKey(t.sec,nuevo.trim());
  if(ultimoNuevoZona[kOld]){ ultimoNuevoZona[kNew]=ultimoNuevoZona[kOld]; delete ultimoNuevoZona[kOld]; D.fbSave('ultimoNuevoZona', ultimoNuevoZona); }
  t.zona = nuevo.trim();
  _persistChecklistConfig();
  renderChecklistTable();
  openGestionZonas();
  showToast('Zona renombrada');
}

// Subir/bajar una zona dentro de su sección (dir = -1 arriba, +1 abajo)
export function clMoveZona(index, dir){
  if(D.userRole!=='gerencia') return;
  const t = CL_TASKS[index]; if(!t) return;
  const j = index + dir;
  if(j<0 || j>=CL_TASKS.length) return;
  if(CL_TASKS[j].sec !== t.sec) return;  // no cruzar de sección
  _clSwapTasks(index, j);
  _clPersistTrasCambio();
  clState = getOrCreateDayState(currentDay);
  renderChecklistTable();
  openGestionZonas();
}

export async function clDeleteZona(index){
  if(D.userRole!=='gerencia') return;
  const t = CL_TASKS[index]; if(!t) return;
  if(!await confirmModal(`¿Eliminar la zona "${t.zona}" del checklist?\nSe quita para todos los días.`)) return;
  _clRemoveTaskAt(index);
  _clPersistTrasCambio();
  clState = getOrCreateDayState(currentDay);
  renderChecklistTable();
  openGestionZonas();
  showToast('Zona eliminada');
}

export async function clRenameSeccion(sec){
  if(D.userRole!=='gerencia') return;
  const nuevo = await promptModal('Nuevo nombre para la sección:', { title:'Renombrar sección', default:SEC_HEADERS[sec]?.label||'' });
  if(!nuevo || !nuevo.trim()) return;
  if(SEC_HEADERS[sec]) SEC_HEADERS[sec].label = nuevo.trim();
  _persistChecklistConfig();
  renderChecklistTable();
  openGestionZonas();
  showToast('Sección renombrada');
}

export async function clAddSeccion(){
  if(D.userRole!=='gerencia') return;
  const nombre = await promptModal('Nombre de la nueva sección / área (ej. Palacio):', { title:'Agregar sección' });
  if(!nombre || !nombre.trim()) return;
  // Nuevo código de sección libre
  let code='d'; for(let c=100;c<123;c++){ const ch=String.fromCharCode(c); if(!SEC_HEADERS[ch]){ code=ch; break; } }
  SEC_HEADERS[code] = { label:nombre.trim(), icon:'', cls:'cl-sec-'+code, rowCls:'row-sec-'+code };
  _persistChecklistConfig();
  openGestionZonas();
  showToast(`Sección "${nombre.trim()}" creada — agregá zonas`);
}

export function openGestionZonas(){
  if(D.userRole!=='gerencia'){ showToast('Solo gerencia'); return; }
  let ov = document.getElementById('gestion-zonas-modal');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'gestion-zonas-modal';
    ov.className = 'modal-overlay';
    document.body.appendChild(ov);
  }
  // Agrupar índices por sección
  const bySec = {};
  CL_TASKS.forEach((t,i)=>{ (bySec[t.sec]=bySec[t.sec]||[]).push(i); });
  const secOrder = Object.keys(SEC_HEADERS);
  const seccionesHTML = secOrder.map(sec=>{
    const sh = SEC_HEADERS[sec];
    const idxs = bySec[sec] || [];
    const zonasHTML = idxs.map((i,pos)=>{
      const t = CL_TASKS[i];
      const upDis = pos===0 ? 'disabled style="opacity:.25;cursor:default"' : '';
      const dnDis = pos===idxs.length-1 ? 'disabled style="opacity:.25;cursor:default"' : '';
      return `<div style="display:flex;align-items:center;gap:6px;padding:7px 12px;background:var(--warm-white)">
        <div style="flex:1;min-width:0;font-size:13px;color:var(--charcoal)">${esc(t.zona)} <span style="font-size:12px;color:var(--mid-gray)">· ${esc(t.actividad)}</span></div>
        <button class="btn-icon" title="Subir" ${upDis} onclick="clMoveZona(${i},-1)">▲</button>
        <button class="btn-icon" title="Bajar" ${dnDis} onclick="clMoveZona(${i},1)">▼</button>
        <button class="btn-icon" title="Renombrar" onclick="clRenameZona(${i})"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>
        <button class="btn-icon" title="Eliminar" style="color:var(--red-alert)" onclick="clDeleteZona(${i})">✕</button>
      </div>`;
    }).join('');
    return `<div style="margin-bottom:14px;border:1px solid var(--light-gray);border-radius:10px;overflow:hidden">
      <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--cream)">
        <span style="font-size:15px">${sh.icon||''}</span>
        <strong style="flex:1;font-size:13.5px;color:var(--charcoal)">${esc(sh.label)}</strong>
        <button class="btn-icon" title="Renombrar sección" onclick="clRenameSeccion('${sec}')"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>
      </div>
      <div style="display:flex;flex-direction:column;gap:1px;background:var(--light-gray)">${zonasHTML || '<div style="padding:10px 12px;background:var(--warm-white);font-size:12px;color:var(--mid-gray)">Sin zonas todavía</div>'}</div>
      <div style="padding:8px 12px;background:var(--warm-white)"><button class="btn-secondary" style="font-size:12px;padding:5px 12px" onclick="clAddZona('${sec}')">+ Agregar zona a ${esc(sh.label)}</button></div>
    </div>`;
  }).join('');

  ov.innerHTML = `<div class="modal" style="max-width:600px;max-height:88vh;overflow-y:auto">
    <button class="modal-close" onclick="document.getElementById('gestion-zonas-modal').classList.remove('open')">✕</button>
    <div class="modal-title">Gestionar zonas del checklist</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:14px">Renombrá o agregá zonas y secciones. Los cambios se aplican a todos los días y se sincronizan con el equipo.</div>
    ${seccionesHTML}
    <div style="margin-top:8px"><button class="btn-add" style="font-size:12px;padding:8px 16px" onclick="clAddSeccion()">+ Agregar sección / área</button></div>
  </div>`;
  ov.classList.add('open');
}

// Actualiza el tiempo estimado de la tarea i para una actividad puntual
// (nuevo/retoque/riego). Sin actividad explícita usa la del día activo.
export function updTiempoRef(i, val, act){
  while(clTiemposRef.length < CL_TASKS.length) clTiemposRef.push({nuevo:0,retoque:0,riego:0});
  const o = _normRef(clTiemposRef[i]);
  const a = act != null ? act : ((clState && clState.actividad && clState.actividad[i]) || CL_TASKS[i]?.actividad || 'Retoque');
  o[_refKey(a)] = parseInt(val)||0;
  clTiemposRef[i] = o;
  D.fbSave('clTiemposRef', clTiemposRef);
}

// ── Tiempos estimados por área (gerencia) ─────────────────────────────────────
// Modal con TODAS las zonas del checklist agrupadas por sección para cargar el
// tiempo estimado (minutos) de cada una de un saque. Queda fijo (clTiemposRef en
// Firebase) y sirve para las métricas de cuánto se demora cada sección.
export function openTiemposEstimados(){
  if(D.userRole!=='gerencia'){ showToast('Solo gerencia'); return; }
  let ov = document.getElementById('cl-tiempos-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='cl-tiempos-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  let lastSec = null;
  const inpStyle = 'width:60px;padding:5px 6px;font-size:13px;text-align:center;border:1px solid var(--light-gray);border-radius:6px;background:var(--warm-white);color:var(--charcoal)';
  const minLbl = '<span style="font-size:12px;color:var(--mid-gray)">min</span>';
  const filas = CL_TASKS.map((t,i)=>{
    let head = '';
    if(t.sec !== lastSec){
      lastSec = t.sec;
      const sh = SEC_HEADERS[t.sec] || {};
      head = `<tr><td colspan="3" style="padding:12px 12px 4px;font-weight:700;color:var(--charcoal);font-size:13px;border-bottom:1px solid var(--light-gray)">${sh.icon||''} ${esc(sh.label||t.sec)}</td></tr>`;
    }
    const o = _normRef(clTiemposRef[i]);
    const esRiego = String(t.actividad).toLowerCase()==='riego';
    const inp = (act, val) => `<input type="number" min="0" value="${val||''}" placeholder="—" onchange="updTiempoRef(${i},this.value,'${act}')" style="${inpStyle}"> ${minLbl}`;
    // Zonas de riego: un único tiempo (Riego). El resto: Nuevo + Retoque.
    const celdas = esRiego
      ? `<td colspan="2" style="padding:6px 12px;text-align:right;white-space:nowrap"><span class="badge badge-riego" style="font-size:12px;margin-right:8px">Riego</span>${inp('riego', o.riego)}</td>`
      : `<td style="padding:6px 12px;text-align:right;white-space:nowrap">${inp('nuevo', o.nuevo)}</td>
         <td style="padding:6px 12px;text-align:right;white-space:nowrap">${inp('retoque', o.retoque)}</td>`;
    return head + `<tr>
      <td style="padding:6px 12px;font-size:13px;font-weight:500">${esc(t.zona)}</td>
      ${celdas}
    </tr>`;
  }).join('');
  ov.innerHTML = `<div class="modal" style="max-width:520px;max-height:85vh;display:flex;flex-direction:column">
    <button class="modal-close" onclick="closeModal('cl-tiempos-modal'); if(window.renderChecklistTable) renderChecklistTable();">✕</button>
    <div class="modal-title">Tiempos estimados por área</div>
    <div style="font-size:12px;color:var(--mid-gray);margin:-6px 0 12px">Cargá los minutos estimados de cada arreglo, por separado para cuando se hace <b>Nuevo</b> y para el <b>Retoque</b>. Queda fijo y sirve para medir cuánto se demora cada sección (marca en rojo las tareas que se pasan del tiempo).</div>
    <div style="overflow-y:auto;flex:1"><table style="width:100%;border-collapse:collapse">
      <thead><tr>
        <th style="text-align:left;padding:6px 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Zona</th>
        <th style="text-align:right;padding:6px 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Nuevo</th>
        <th style="text-align:right;padding:6px 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Retoque</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table></div>
    <div class="modal-actions" style="margin-top:14px">
      <button class="btn-add" onclick="closeModal('cl-tiempos-modal'); if(window.renderChecklistTable) renderChecklistTable();">Listo</button>
    </div>
  </div>`;
  ov.classList.add('open');
}

// ── Promedios reales por zona vs. estimado (gerencia) ─────────────────────────
// Recorre el historial del checklist, promedia la duración real de cada zona y
// la compara con el tiempo estimado (clTiemposRef). Para ver dónde se demora más
// de lo previsto.
export function openPromediosZona(){
  if(D.userRole!=='gerencia'){ showToast('Solo gerencia'); return; }
  // Promedio real por sec|zona|actividad
  const agg = {};
  (D.checklistHistory||[]).forEach(r=>{
    const dur = (+r.duracion) || calcDuracion(r.inicio||'', r.fin||'');
    if(!dur || dur<=0) return;
    const key = (r.sec||'')+'|'+(r.zona||'')+'|'+String(r.actividad||'').toLowerCase();
    if(!agg[key]) agg[key] = { n:0, sum:0 };
    agg[key].n++; agg[key].sum += dur;
  });

  const seen = new Set();
  let lastSec = null, filas = '', totalMuestras = 0, conDatos = 0;
  CL_TASKS.forEach((t,i)=>{
    const key = (t.sec||'')+'|'+(t.zona||'')+'|'+String(t.actividad||'').toLowerCase();
    if(seen.has(key)) return;
    seen.add(key);
    const a = agg[key];
    if(!a) return; // solo zonas con al menos un registro real
    conDatos++;
    totalMuestras += a.n;
    if(t.sec !== lastSec){
      lastSec = t.sec;
      const sh = SEC_HEADERS[t.sec] || {};
      filas += `<tr><td colspan="5" style="padding:12px 12px 4px;font-weight:700;color:var(--charcoal);font-size:13px;border-bottom:1px solid var(--light-gray)">${sh.icon||''} ${esc(sh.label||t.sec)}</td></tr>`;
    }
    const prom = Math.round(a.sum / a.n);
    const est  = getTiempoRef(i, t.actividad);
    let desvHTML = '<span style="color:var(--mid-gray)">—</span>';
    if(est > 0){
      const dp = Math.round((prom - est) / est * 100);
      const col = dp <= 10 ? 'var(--green-ok)' : dp <= 30 ? 'var(--amber)' : 'var(--red-alert)';
      desvHTML = `<span style="color:${col};font-weight:600">${dp>0?'+':''}${dp}%</span>`;
    }
    filas += `<tr>
      <td style="padding:6px 12px;font-size:13px;font-weight:500">${esc(t.zona)}</td>
      <td style="padding:6px 12px"><span class="badge ${getBadge(t.actividad)}" style="font-size:12px">${esc(t.actividad)}</span></td>
      <td style="padding:6px 12px;text-align:center;color:var(--mid-gray);font-size:12px" title="Cantidad de veces registradas">${a.n}</td>
      <td style="padding:6px 12px;text-align:right;font-weight:600">${fmtDur(prom)}</td>
      <td style="padding:6px 12px;text-align:right;color:var(--mid-gray)">${est?est+'m':'—'}</td>
      <td style="padding:6px 12px;text-align:right">${desvHTML}</td>
    </tr>`;
  });

  let ov = document.getElementById('cl-promedios-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='cl-promedios-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="modal" style="max-width:600px;max-height:85vh;display:flex;flex-direction:column">
    <button class="modal-close" onclick="closeModal('cl-promedios-modal')">✕</button>
    <div class="modal-title">Promedios reales por zona</div>
    <div style="font-size:12px;color:var(--mid-gray);margin:-6px 0 12px">Promedio de la duración real de cada zona vs. el tiempo estimado. Desvío en rojo = se tarda bastante más de lo previsto. ${conDatos?`${conDatos} zona${conDatos!==1?'s':''} con datos · ${totalMuestras} registro${totalMuestras!==1?'s':''}`:''}</div>
    ${conDatos
      ? `<div style="overflow-y:auto;flex:1"><table style="width:100%;border-collapse:collapse">
          <thead><tr>
            <th style="text-align:left;padding:6px 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Zona</th>
            <th style="text-align:left;padding:6px 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Act.</th>
            <th style="text-align:center;padding:6px 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)" title="Cuántas veces se registró">N</th>
            <th style="text-align:right;padding:6px 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Prom. real</th>
            <th style="text-align:right;padding:6px 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Estimado</th>
            <th style="text-align:right;padding:6px 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Desvío</th>
          </tr></thead>
          <tbody>${filas}</tbody>
        </table></div>`
      : '<p style="color:var(--mid-gray);font-size:13px;padding:20px;text-align:center">Todavía no hay tareas completadas con horario (Inicio–Fin) para promediar. Las floristas cronometran las tareas y acá vas viendo los promedios.</p>'}
    <div class="modal-actions" style="margin-top:14px">
      <button class="btn-add" onclick="closeModal('cl-promedios-modal')">Cerrar</button>
    </div>
  </div>`;
  ov.classList.add('open');
}

// Persistir un campo de un día puntual del checklist (localStorage + Firebase)
// ── Planificación fija (plantilla) del checklist ──────────────────────────────
// Guarda quién hace cada zona y si es Nuevo/Retoque por día de forma PERSISTENTE
// (no se borra al cambiar de semana). Cada semana nueva arranca con esta plantilla,
// así no hay que reasignar todo a mano; igual se puede editar cuando haga falta.
let checklistPlantilla = {}; // { [dia]: { responsable:[...], actividad:[...] } }
window._setChecklistPlantilla = v => { if(v && typeof v === 'object') checklistPlantilla = v; };
function _plantillaDia(day){
  if(!checklistPlantilla[day]) checklistPlantilla[day] = {};
  const p = checklistPlantilla[day];
  ['responsable','actividad'].forEach(k=>{
    if(!p[k]) p[k] = CL_TASKS.map(()=> '');
    if(!Array.isArray(p[k])) p[k] = Object.values(p[k]);
    while(p[k].length < CL_TASKS.length) p[k].push('');
  });
  return p;
}
function saveChecklistPlantilla(){ window._checklistPlantillaLastSave = Date.now(); D.fbSave('checklistPlantilla', checklistPlantilla); }
// Copia responsable + actividad del estado real de un día a la plantilla fija.
function _syncDiaAPlantilla(day){
  const ds = D.clStateByDay[day];
  if(!ds) return;
  const p = _plantillaDia(day);
  p.responsable = (ds.responsable||[]).map(r=>r||'');
  p.actividad   = (ds.actividad||[]).map((a,i)=> a || CL_TASKS[i].actividad);
  saveChecklistPlantilla();
}
// Aplica la plantilla fija a toda la semana (responsable + Nuevo/Retoque),
// sin tocar lo ya realizado (checks/tiempos). Para empujar la planificación a
// la semana en curso; las semanas nuevas ya la toman solas.
export function aplicarPlantillaSemana(){
  const hayDatos = Object.values(checklistPlantilla).some(d =>
    (d && d.responsable && d.responsable.some(Boolean)) ||
    (d && d.actividad && d.actividad.some(a => a && String(a).toLowerCase()==='nuevo')));
  if(!hayDatos){ showToast('Todavía no hay planificación fija guardada. Asigná responsables/Nuevo y se guarda sola.'); return; }
  D.DIAS_SEMANA_NAMES.forEach(day=>{
    const ds = getOrCreateDayState(day);
    const p = checklistPlantilla[day];
    CL_TASKS.forEach((t,i)=>{
      ds.responsable[i] = (p && p.responsable && p.responsable[i]) || '';
      ds.actividad[i]   = (p && p.actividad && p.actividad[i]) || t.actividad;
    });
    if(window.fbSetPath) window.fbSetPath('checklist/'+day, ds);
  });
  try{ localStorage.setItem(CL_STORAGE_KEY, JSON.stringify(D.clStateByDay)); }catch(e){}
  if(!window.fbSetPath) D.fbSave('checklist', D.clStateByDay);
  window._checklistLastSave = Date.now();
  renderVistaSemanal();
  if(document.getElementById('page-checklist')?.classList.contains('active')){ clState = getOrCreateDayState(currentDay); renderChecklistTable(); }
  showToast('✓ Planificación fija aplicada a toda la semana');
}

function _persistCampoDia(day, campo){
  try{ localStorage.setItem(CL_STORAGE_KEY, JSON.stringify(D.clStateByDay)); }catch(e){}
  window._checklistLastSave = Date.now();
  if(window.fbUpdate) window.fbUpdate('checklist/'+day, {[campo]: D.clStateByDay[day][campo]});
  else D.fbSave('checklist', D.clStateByDay);
  // Guardar la planificación como plantilla fija (para reusar cada semana)
  if(campo==='responsable' || campo==='actividad') _syncDiaAPlantilla(day);
}

// Setear la actividad de una tarea en un día. Si es Nuevo, esa tarea pasa a
// Retoque el resto de la semana (el Nuevo se hace 1 sola vez por semana).
// Devuelve los días que se corrigieron automáticamente.
function setActividadDia(day, i, val){
  getOrCreateDayState(day).actividad[i] = val;
  _persistCampoDia(day, 'actividad');
  if(String(val).toLowerCase()!=='nuevo') return [];
  const cambiados = [];
  Object.entries(D.clStateByDay).forEach(([d,ds])=>{
    if(d===day || !Array.isArray(ds?.actividad)) return;
    if(String(ds.actividad[i]||'').toLowerCase()==='nuevo'){
      ds.actividad[i] = 'Retoque';
      cambiados.push(d);
      _persistCampoDia(d, 'actividad');
    }
  });
  // Los días aún no creados ya arrancan en Retoque por default
  return cambiados;
}

// Cambio de actividad desde la tabla diaria (solo gerencia)
export function updActividad(i, val){
  const cambiados = setActividadDia(currentDay, i, val);
  if(String(val).toLowerCase()!=='nuevo') return;
  if(cambiados.length) showToast(`✓ Nuevo el ${currentDay} — ${CL_TASKS[i].zona} pasó a Retoque el resto de la semana (${cambiados.join(', ')})`);
  else showToast(`✓ Nuevo asignado a ${CL_TASKS[i].zona} — el resto de la semana queda en Retoque`);
}

// Al COMPLETAR un arreglo Nuevo, bajar a Retoque esa misma zona en cualquier
// otro día de la semana que todavía figure como Nuevo. Refuerza la regla "el
// Nuevo se hace 1 sola vez por semana" desde el hecho real (se hizo), no solo
// desde la planificación de gerencia. Sin esto, si la plantilla/planificación
// tenía la zona en Nuevo dos días (o gerencia lo cargó doble), la florista lo
// hacía un día y al día siguiente le volvía a aparecer como Nuevo.
// Fuerza la creación de todos los días de la semana para limpiar también los que
// aún no se abrieron y sincroniza la plantilla fija (así no reaparece la próxima
// semana). Toca por índice de fila i (no por nombre de zona), consistente con el
// resto del checklist.
function bajarNuevoRestoSemana(i, exceptDay){
  if(!CL_TASKS[i]) return;
  D.DIAS_SEMANA_NAMES.forEach(d=>{
    if(d===exceptDay) return;
    const ds = getOrCreateDayState(d);
    if(String(ds.actividad[i]||'').toLowerCase()==='nuevo'){
      ds.actividad[i] = 'Retoque';
      _persistCampoDia(d, 'actividad');
    }
  });
}

// ── Vista semanal del checklist (solo gerencia) ───────────────────────────────
// Grilla zonas × días para asignar responsables y marcar el Nuevo de cada zona
// de toda la semana de una sola vez.
export function openVistaSemanal(){
  renderVistaSemanal();
  document.getElementById('cl-week-modal').classList.add('open');
}

function renderVistaSemanal(){
  const el = document.getElementById('cl-week-grid');
  if(!el) return;
  const dias = D.DIAS_SEMANA_NAMES;
  const estados = {};
  dias.forEach(d=>{ estados[d] = getOrCreateDayState(d); });
  let lastSec = null;
  let html = `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;padding:10px 14px;background:#EEF3EC;border:1px solid #D8E3D4;border-radius:8px">
    <div style="font-size:12px;color:#3A4A34">✓ Esta planificación queda <strong>guardada fija</strong> y se aplica sola al empezar cada semana nueva. Editá cuando haga falta y se guarda solo.</div>
    <button class="btn-secondary" style="font-size:12px;white-space:nowrap" onclick="aplicarPlantillaSemana()" title="Volver a aplicar la planificación fija a la semana actual">Aplicar a esta semana</button>
  </div>
  <table class="stock-table" style="min-width:900px">
    <thead><tr><th style="min-width:150px;position:sticky;left:0;background:var(--warm-white);z-index:1">Zona</th>${dias.map(d=>{
      const nuevos = CL_TASKS.reduce((s,_,i)=>s+(String(estados[d].actividad[i]||'').toLowerCase()==='nuevo'?1:0),0);
      return `<th style="min-width:118px">${d===currentDay?'▸ ':''}${d.slice(0,3)}${nuevos?` <span style="font-size:12px;background:#B8602A;color:#fff;border-radius:8px;padding:1px 6px;vertical-align:middle">${nuevos} N</span>`:''}</th>`;
    }).join('')}</tr></thead><tbody>`;
  CL_TASKS.forEach((t,i)=>{
    if(t.sec !== lastSec){
      lastSec = t.sec;
      const sh = SEC_HEADERS[t.sec];
      html += `<tr class="cl-section-row ${sh.cls}"><td colspan="${dias.length+1}">${sh.icon}&nbsp;&nbsp;${sh.label}</td></tr>`;
    }
    html += `<tr><td style="font-weight:500;font-size:12px;position:sticky;left:0;background:var(--warm-white);z-index:1">${esc(t.zona)}</td>`;
    dias.forEach(d=>{
      const ds = estados[d];
      const actL = String(ds.actividad[i]||t.actividad).toLowerCase();
      const resp = ds.responsable[i]||'';
      const chip = actL==='riego'
        ? '<span class="badge badge-riego" style="font-size:12px">Riego</span>'
        : `<span class="badge ${actL==='nuevo'?'badge-nuevo':'badge-retoque'}" style="font-size:12px;cursor:pointer" title="Tocar para alternar Retoque/Nuevo" onclick="vsToggleActividad('${d}',${i})">${actL==='nuevo'?'NUEVO':'Retoque'}</span>`;
      html += `<td style="padding:5px 6px;vertical-align:top">
        <div style="margin-bottom:4px">${chip}</div>
        <select class="cl-select" style="font-size:12px;padding:3px 4px;max-width:110px" onchange="vsSetResp('${d}',${i},this.value)">
          <option value="">—</option>
          ${CL_RESP_OPTS.map(o=>`<option${o===resp?' selected':''}>${esc(o)}</option>`).join('')}
        </select>
      </td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

export function vsToggleActividad(day, i){
  const ds = getOrCreateDayState(day);
  const cur = String(ds.actividad[i]||CL_TASKS[i].actividad).toLowerCase();
  if(cur==='riego') return;
  const val = cur==='nuevo' ? 'Retoque' : 'Nuevo';
  const cambiados = setActividadDia(day, i, val);
  if(val==='Nuevo' && cambiados.length) showToast(`✓ Nuevo el ${day} — ${CL_TASKS[i].zona} pasó a Retoque: ${cambiados.join(', ')}`);
  renderVistaSemanal();
  if(document.getElementById('page-checklist')?.classList.contains('active')) renderChecklistTable();
}

export function vsSetResp(day, i, val){
  getOrCreateDayState(day).responsable[i] = val;
  _persistCampoDia(day, 'responsable');
  if(day===currentDay && document.getElementById('page-checklist')?.classList.contains('active')) renderChecklistTable();
}

// ── Semana actual ISO (ej: "2026-W22") ────────────────────────────────────────
export function getISOWeekKey(date){
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  const y = d.getUTCFullYear();
  const w = Math.ceil(((d - new Date(Date.UTC(y,0,1))) / 86400000 + 1) / 7);
  return `${y}-W${String(w).padStart(2,'0')}`;
}
const CURRENT_WEEK_KEY = getISOWeekKey(new Date());
const CL_STORAGE_KEY   = 'cl_state_' + CURRENT_WEEK_KEY;

// ── Cargar estado de la semana actual desde localStorage ──────────────────────
export function loadWeekState(){
  try {
    const saved = localStorage.getItem(CL_STORAGE_KEY);
    if(saved) return JSON.parse(saved);
  } catch(e){}
  return null;
}

// ── Guardar estado del checklist ─────────────────────────────────────────────
// Guarda solo el día que cambió, no toda la semana.
// Así dos personas editando días distintos nunca se pisan.
export function saveWeekState(day, campo, i){
  try {
    localStorage.setItem(CL_STORAGE_KEY, JSON.stringify(D.clStateByDay));
  } catch(e){}
  window._checklistLastSave = Date.now();
  const d = day || currentDay;
  const ds = D.clStateByDay[d];
  if(!ds) return;

  if(campo && i != null && window.fbSet && Array.isArray(ds[campo])){
    // Guardar SOLO la celda que cambió (checklist/<día>/<campo>/<i>).
    // Así dos floristas marcando tareas distintas del mismo día no se pisan:
    // cada uno escribe su propia celda y Firebase las mergea del lado del server.
    window.fbSet('checklist/'+d+'/'+campo+'/'+i, ds[campo][i]);
  } else if(campo && window.fbUpdate){
    // Guardar SOLO el campo que cambió — no pisa los otros campos
    const updates = {};
    updates[campo] = ds[campo];
    window.fbUpdate('checklist/'+d, updates);
  } else if(window.fbSetPath){
    // Guardado completo del día (para resets, creación inicial, etc.)
    window.fbSetPath('checklist/'+d, ds);
  } else {
    D.fbSave('checklist', D.clStateByDay);
  }
  // Guardar la planificación como plantilla fija (para reusar cada semana)
  if(campo==='responsable' || campo==='actividad') _syncDiaAPlantilla(d);
}

// ── Inicializar estado del día — trae de localStorage si existe ───────────────
export function getOrCreateDayState(day){
  if(!D.clStateByDay[day]){
    // Sembrar responsable y Nuevo/Retoque desde la plantilla fija si existe,
    // así una semana nueva ya arranca planificada sin cargar todo a mano.
    const plant = checklistPlantilla[day] || {};
    D.clStateByDay[day] = {
      checked:     CL_TASKS.map(()=>false),
      actividad:   CL_TASKS.map((t,i)=> (plant.actividad && plant.actividad[i]) || t.actividad),
      obs:         CL_TASKS.map(t=>t.obs||''),
      tiempo:      CL_TASKS.map(()=>''),
      inicio:      CL_TASKS.map(()=>''),
      fin:         CL_TASKS.map(()=>''),
      responsable: CL_TASKS.map((_,i)=> (plant.responsable && plant.responsable[i]) || ''),
    };
    // NO guardar a Firebase aquí — se guarda solo cuando el usuario hace un cambio explícito.
    // Si guardamos acá, pisamos los datos reales cuando otro dispositivo abre la app.
  } else {
    // Migración/reparación: convertir objetos de Firebase a arrays y completar campos faltantes
    const ds = D.clStateByDay[day];
    ['checked','actividad','obs','tiempo','inicio','fin','responsable'].forEach(k => {
      if(!ds[k]) ds[k] = CL_TASKS.map(()=> k==='actividad' ? '' : (k==='checked' ? false : ''));
      if(!Array.isArray(ds[k])) ds[k] = Object.values(ds[k]);
      // Asegurar largo correcto
      while(ds[k].length < CL_TASKS.length) ds[k].push(k==='checked' ? false : '');
    });
    // Reparar estados viejos: una tarea con hora de Fin registrada está completada.
    // Antes, editar el Fin a mano (gerencia) no la tildaba, así que quedaban tareas
    // con duración pero figurando pendientes. Se corrige al hidratar.
    ds.checked = ds.checked.map((c,i)=> c || !!(ds.fin && ds.fin[i]));
  }
  return D.clStateByDay[day];
}

// Registro PERSISTENTE de la última vez que cada zona se hizo Nuevo.
// Independiente del historial semanal: no se pierde al cambiar de semana ni al
// podar el historial. Clave: sec|zona (saneada para Firebase). Valor: fecha ISO.
export let ultimoNuevoZona = {};
window._setUltimoNuevoZona = (v) => { if(v && typeof v === 'object') ultimoNuevoZona = v; };
// El día inicial se fija en configurarChecklist() (necesita TODAY_DAY de app.js).
export let currentDay = 'Lunes';
let historyWeekFilter = null;

export function getBadge(act){
  const a = (act||'').toLowerCase();
  if(a.includes('nuevo')) return 'badge-nuevo';
  if(a.includes('retoque')) return 'badge-retoque';
  if(a.includes('reemplazo')) return 'badge-reemplazo';
  if(a.includes('riego')) return 'badge-riego';
  if(a.includes('mantenimiento')) return 'badge-mantenimiento';
  if(a.includes('pedido')) return 'badge-pedido';
  return 'badge-retoque';
}

export function initChecklist(){
  // ── Banner semana actual ──────────────────────────────────────────────────
  let weekBanner = document.getElementById('cl-week-banner');
  if(!weekBanner){
    weekBanner = document.createElement('div');
    weekBanner.id = 'cl-week-banner';
    weekBanner.className = 'cl-week';
    document.getElementById('day-tabs-container').before(weekBanner);
  }
  let totalDone = 0;
  try {
    totalDone = Object.values(D.clStateByDay||{}).reduce((s,d) => {
      const arr = Array.isArray(d?.checked) ? d.checked : (d?.checked ? Object.values(d.checked) : []);
      return s + arr.filter(Boolean).length;
    }, 0);
  } catch(e){ totalDone = 0; }
  const [anio, sem] = CURRENT_WEEK_KEY.split('-W');
  weekBanner.innerHTML = `
    <div class="cl-week-info">
      <span class="cl-week-tit">Semana ${Number(sem)||sem} <span class="cl-muted">· ${anio}</span></span>
      <span class="cl-week-sub">${totalDone} tarea${totalDone!==1?'s':''} completada${totalDone!==1?'s':''} esta semana</span>
    </div>
    <div class="cl-week-acc gerencia-only">
      <button class="cl-btn-quiet" onclick="resetDayState()">Limpiar día</button>
      <button class="cl-btn-quiet" onclick="resetWeekState()">Limpiar semana</button>
    </div>`;

  const tabs = document.getElementById('day-tabs-container');
  tabs.innerHTML = '';
  ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].forEach(d=>{
    const t = document.createElement('div');
    t.className = 'day-tab'+(d===currentDay?' active':'');
    t.textContent = d;
    t.onclick = ()=>{
      currentDay = d;
      clState = getOrCreateDayState(d);
      renderChecklistTable();
    };
    tabs.appendChild(t);
  });
  // Activar el estado del día actual
  clState = getOrCreateDayState(currentDay);
  renderChecklistTable();
  renderHistoryPanel();
  D.renderFlorTurnoCard();
  D.renderLlamadosChecklist();
  const _htc = document.getElementById('home-tasks-count'); if(_htc) _htc.textContent = CL_TASKS.length;
}

export async function resetDayState(){
  if(D.userRole !== 'gerencia'){ showToast('Solo gerencia puede limpiar el día'); return; }
  if(!await confirmModal(`¿Limpiar todas las tareas del ${currentDay}? El historial y los otros días se conservan.`)) return;
  // Reiniciar SOLO el día activo — se re-siembra desde la plantilla fija (igual que un día nuevo)
  delete D.clStateByDay[currentDay];
  clState = getOrCreateDayState(currentDay);
  try { localStorage.setItem(CL_STORAGE_KEY, JSON.stringify(D.clStateByDay)); } catch(e){}
  window._checklistLastSave = Date.now();
  if(window.fbSetPath) window.fbSetPath('checklist/'+currentDay, D.clStateByDay[currentDay]);
  else D.fbSave('checklist', D.clStateByDay);
  initChecklist();
  showToast(`${currentDay} reiniciado — tareas del día limpiadas`);
}

export async function resetWeekState(){
  if(D.userRole !== 'gerencia'){ showToast('Solo gerencia puede limpiar la semana'); return; }
  if(!await confirmModal('¿Limpiar todas las tareas de esta semana? El historial se conserva.')) return;
  D._setClStateByDay({});
  D.fbSave('checklist', D.clStateByDay); // Limpiar TODOS los días de Firebase
  clState = getOrCreateDayState(currentDay);
  try { localStorage.removeItem(CL_STORAGE_KEY); } catch(e){}
  initChecklist();
  showToast('Semana reiniciada — todas las tareas limpiadas');
}

export function calcDuracion(inicio, fin){
  if(!inicio || !fin) return null;
  const [h1,m1] = inicio.split(':').map(Number);
  const [h2,m2] = fin.split(':').map(Number);
  let mins = (h2*60+m2) - (h1*60+m1);
  if(mins < 0) mins += 24*60;
  return mins > 0 ? mins : null;
}
export function fmtDur(mins){
  if(mins === null || mins === undefined) return '—';
  const h = Math.floor(mins/60), m = mins%60;
  return h>0 ? (h+'h '+(m>0?m+'m':'')).trim() : m+'m';
}
export function durBadge(inicio, fin, ref){
  const mins = calcDuracion(inicio, fin);
  if(!mins) return '<span style="font-size:12px;color:var(--mid-gray)">—</span>';
  // Excedida: superó el tiempo promedio de referencia definido por gerencia
  if(ref && mins > ref){
    return `<span title="Excedió la referencia de ${ref}m" style="font-size:12px;font-weight:600;color:var(--red-alert);background:var(--alert-soft);padding:2px 8px;border-radius:10px">${fmtDur(mins)}</span>`;
  }
  const color = mins > 60 ? 'var(--amber)' : 'var(--green-ok)';
  const bg    = mins > 60 ? '#FDF8E8'      : '#EBF5E8';
  return `<span style="font-size:12px;font-weight:600;color:${color};background:${bg};padding:2px 8px;border-radius:10px">${fmtDur(mins)}</span>`;
}

// ── Último "Nuevo" por zona (contador de días, solo gerencia) ────────────────
// Recorre el historial del checklist y devuelve la fecha más reciente en que
// cada zona se completó con actividad Nuevo. Clave: sec + '|' + zona.
// Clave saneada para Firebase (las zonas pueden tener '.', '/', etc. que RTDB no permite en claves)
export function _zonaKey(sec, zona){ return (sec||'')+'|'+String(zona||'').replace(/[.#$/[\]]/g,'_'); }

// Última vez que cada zona se hizo Nuevo. Mezcla el registro persistente
// (ultimoNuevoZona, que sobrevive a cambios de semana y a la poda) con el
// historial semanal, quedándose siempre con la fecha más reciente.
export function mapUltimoNuevoPorZona(){
  const map = {};
  Object.entries(ultimoNuevoZona||{}).forEach(([k,fecha])=>{ if(fecha) map[k] = fecha; });
  (D.checklistHistory||[]).forEach(r=>{
    if(!r?.date || !r?.zona) return;
    if(!String(r.actividad||'').toLowerCase().includes('nuevo')) return;
    const k = _zonaKey(r.sec, r.zona);
    if(!map[k] || r.date > map[k]) map[k] = r.date;
  });
  return map;
}

// Marca (persistente) que una zona se hizo Nuevo hoy. Se llama al completar
// una tarea Nuevo; queda fijo para siempre aunque cambie la semana.
function registrarUltimoNuevo(sec, zona, actividad, fecha){
  if(!String(actividad||'').toLowerCase().includes('nuevo')) return;
  const k = _zonaKey(sec, zona);
  if(!ultimoNuevoZona[k] || (fecha||D.TODAY_ISO) > ultimoNuevoZona[k]){
    ultimoNuevoZona[k] = fecha || D.TODAY_ISO;
    D.fbSave('ultimoNuevoZona', ultimoNuevoZona);
  }
}

function badgeUltimoNuevo(fecha){
  if(!fecha) return '<span class="cl-meta-item">Sin registro de Nuevo</span>';
  const dias = Math.max(0, Math.floor((new Date(D.TODAY_ISO)-new Date(fecha))/86400000));
  const nivel = dias>=7 ? 'is-late' : dias>=5 ? 'is-warn' : 'is-ok';
  const txt = dias===0 ? 'Nuevo hoy' : dias===1 ? 'Nuevo ayer' : `Nuevo hace ${dias} días`;
  return `<span class="cl-meta-item cl-nuevo ${nivel}" title="Último Nuevo: ${fmtDate(fecha)}">${txt}</span>`;
}

// ── Nuevos atrasados (solo gerencia) ─────────────────────────────────────────
// Zonas cuyo último arreglo Nuevo ya tiene UMBRAL_NUEVO_ATRASADO días o más.
// Solo considera zonas que alguna vez se hicieron Nuevo (tienen cadencia); las
// que nunca tuvieron Nuevo (Retoque/Riego puro) no se listan para no hacer ruido.
const UMBRAL_NUEVO_ATRASADO = 7;
function nuevosAtrasados(umbral = UMBRAL_NUEVO_ATRASADO){
  const map = mapUltimoNuevoPorZona();
  const vistas = new Set();
  const out = [];
  CL_TASKS.forEach(t=>{
    const k = _zonaKey(t.sec, t.zona);
    if(vistas.has(k)) return;
    vistas.add(k);
    const fecha = map[k];
    if(!fecha) return;
    const dias = Math.floor((new Date(D.TODAY_ISO)-new Date(fecha))/86400000);
    if(dias >= umbral) out.push({sec:t.sec, zona:t.zona, dias, fecha});
  });
  return out.sort((a,b)=>b.dias-a.dias);
}

// Banner de aviso arriba del checklist (solo gerencia). Lista las zonas con el
// Nuevo vencido para que se reprogramen antes de que el arreglo se marchite.
function renderNuevosAtrasadosBanner(){
  let el = document.getElementById('cl-overdue-banner');
  if(D.userRole !== 'gerencia'){ if(el) el.innerHTML = ''; return; }
  if(!el){
    el = document.createElement('div');
    el.id = 'cl-overdue-banner';
    const anchor = document.getElementById('cl-progress-bar-wrap')
      || document.getElementById('cl-table-wrap')
      || document.getElementById('checklist-body')?.closest('.table-wrapper');
    if(anchor) anchor.before(el); else return;
  }
  const list = nuevosAtrasados();
  if(!list.length){ el.innerHTML = ''; return; }
  const chips = list.map(z=>{
    const sh = SEC_HEADERS[z.sec];
    const secTxt = sh ? sh.label.charAt(0)+sh.label.slice(1).toLowerCase() : '';
    const zEsc = esc(z.zona).replace(/'/g,"\\'");
    return `<button class="cl-aviso-chip" onclick="clProgramarNuevo('${z.sec}','${zEsc}')" title="${esc(secTxt)} · último Nuevo: ${fmtDate(z.fecha)} · tocá para programar un Nuevo el ${currentDay}">${esc(z.zona)} · <strong>${z.dias} días</strong><span class="cl-aviso-plus">+ Nuevo</span></button>`;
  }).join('');
  // Con muchas zonas, mostrar las más atrasadas y el resto a demanda
  const MAX_CHIPS = 6;
  const verMas = list.length > MAX_CHIPS
    ? `<button class="cl-link cl-aviso-mas" onclick="this.closest('.cl-aviso').classList.add('is-open')">Ver ${list.length-MAX_CHIPS} más</button>` : '';
  el.innerHTML = `<div class="cl-aviso">
    <div class="cl-aviso-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/></svg></div>
    <div class="cl-aviso-body">
      <div class="cl-aviso-tit">${list.length} zona${list.length!==1?'s':''} con Nuevo atrasado (${UMBRAL_NUEVO_ATRASADO}+ días)</div>
      <div class="cl-aviso-sub">Tocá una zona para programarle un Nuevo el ${currentDay}, o planificalo desde <button class="cl-link" onclick="openVistaSemanal()">la vista semanal</button>.</div>
      <div class="cl-aviso-chips">${chips}${verMas}</div>
    </div>
  </div>`;
}

// ── Fases de un evento: armado → colocación → retiro (las 2 últimas opcionales) ──
export function eventoFase(ev){
  if(ev.estado === 'Pendiente de Colocacion') return 'colocacion';
  if(ev.estado === 'Pendiente de Retiro') return 'retiro';
  return 'armado';
}
// Compara nombres de forma robusta: ignora mayúsculas, acentos y espacios
// de más. Evita que un evento asignado a "Iván " no le figure a "Ivan".
export function _normName(s){ return String(s||'').trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,' '); }
function _sameName(a,b){ const na=_normName(a); return na!=='' && na===_normName(b); }
export function eventoFlorFase(ev, fase){
  return fase === 'retiro' ? (ev.retiroAsignado||'')
    : fase === 'colocacion' ? (ev.colocacionAsignado||'')
    : (ev.asignado||'');
}
function eventoFaseTag(fase){
  if(fase === 'retiro') return '<span class="cl-fase-tag is-retiro">Retiro</span>';
  if(fase === 'colocacion') return '<span class="cl-fase-tag is-coloc">Colocación</span>';
  return '<span class="cl-fase-tag is-armado">Armado</span>';
}
// ¿Ya es momento de que el florista vea esta fase del evento?
// Armado: siempre (lo ve para prepararlo). Colocación/Retiro: recién el día
// programado (colocacionFecha/retiroFecha; si no se cargó, cae en ev.fecha) y,
// si hay hora cargada, a partir de esa hora. Un día futuro no se muestra: así
// el florista no ve un retiro/colocación antes de que corresponda.
const MARGEN_FASE_MIN = 30; // el florista ve la fase (y recibe el aviso) 30 min antes de la hora
function _hmToMin(hm){ if(!hm || !hm.includes(':')) return null; const [h,m]=hm.split(':').map(Number); return (h||0)*60+(m||0); }
export function faseVisibleFlorista(ev, fase){
  if(fase === 'armado') return true;
  const hoy = D.TODAY_ISO;
  const fecha = (fase === 'retiro' ? ev.retiroFecha : ev.colocacionFecha) || ev.fecha || '';
  const hora  = (fase === 'retiro' ? ev.retiroHora  : ev.colocacionHora)  || '';
  if(fecha && fecha > hoy) return false;                 // día futuro → todavía no
  if(fecha === hoy && hora){
    const d = new Date();
    const nowMin = d.getHours()*60 + d.getMinutes();
    const hMin = _hmToMin(hora);
    if(hMin != null && nowMin < hMin - MARGEN_FASE_MIN) return false; // falta más que el margen
  }
  return true;
}
// Devuelve la fase (armado/colocación/retiro) en la que ESTE florista está
// asignado a este evento y que ya corresponde mostrar por fecha/hora, o null.
// Independiente del estado global del evento: así la colocación/retiro le
// aparece a su florista el día y hora programados aunque el estado no se
// haya movido en el kanban. Prioriza la fase más avanzada que esté visible.
function florFaseVisible(ev, nombre){
  const asignadas = [];
  if(_sameName(ev.asignado, nombre)) asignadas.push('armado');
  if(_sameName(ev.colocacionAsignado, nombre)) asignadas.push('colocacion');
  if(_sameName(ev.retiroAsignado, nombre)) asignadas.push('retiro');
  for(const f of ['retiro','colocacion','armado']){
    if(asignadas.includes(f) && faseVisibleFlorista(ev, f)) return f;
  }
  return null;
}
// Aviso push al florista cuando se habilita la colocación/retiro (a MARGEN_FASE_MIN
// de la hora, ese día). Una sola vez por evento/fase/día (flag persistido en el
// evento). Corre en el timer de cada minuto.
export function checkRecordatoriosFaseEvento(){
  if(!Array.isArray(D.eventosData) || !D.eventosData.length) return;
  const hoy = D.TODAY_ISO;
  const d = new Date();
  const nowMin = d.getHours()*60 + d.getMinutes();
  let cambio = false;
  const fases = [
    ['colocacionAsignado','colocacionFecha','colocacionHora','colocacionFin','colocacionAvisada','Colocación','colocación'],
    ['retiroAsignado','retiroFecha','retiroHora','retiroFin','retiroAvisada','Retiro','retiro'],
  ];
  D.eventosData.forEach(ev=>{
    if(ev.estado === 'Pedidos Finalizados') return;
    fases.forEach(([kAsig,kFecha,kHora,kFin,kAviso,lbl,faseTxt])=>{
      const flor  = ev[kAsig];
      const fecha = ev[kFecha] || ev.fecha || '';
      const hora  = ev[kHora] || '';
      if(!flor || !hora || fecha !== hoy) return; // solo con florista, hora cargada y para hoy
      if(ev[kFin]) return;                          // ya se hizo
      if(ev[kAviso] === hoy) return;                // ya se avisó hoy
      const hMin = _hmToMin(hora);
      if(hMin == null || nowMin < hMin - MARGEN_FASE_MIN) return; // todavía no se habilitó
      D.notificarAsignacion(flor, `${lbl}: ${ev.nombre}`, `${faseTxt.charAt(0).toUpperCase()+faseTxt.slice(1)} programada ${hora}${ev.salon?' · '+ev.salon:''}. Ya te aparece en tu checklist.`);
      ev[kAviso] = hoy;
      cambio = true;
    });
  });
  if(cambio) _saveEventos();
}

export function renderChecklistTable(){
  if(!clState){
    clState = getOrCreateDayState(currentDay);
  }
  // Garantizar que los arrays existan y tengan el largo correcto
  const n = CL_TASKS.length;
  ['checked','actividad','obs','tiempo','inicio','fin','responsable'].forEach(k => {
    if(!Array.isArray(clState[k]) || clState[k].length < n){
      clState[k] = CL_TASKS.map((t,i) => {
        const existing = clState[k]?.[i];
        if(existing !== undefined && existing !== null) return existing;
        return k==='actividad' ? t.actividad : (k==='obs' ? (t.obs||'') : (k==='checked' ? false : ''));
      });
    }
  });

  // Update day tab active state + badge de progreso por día.
  // OJO: acotado al contenedor del checklist. Antes usaba document.querySelectorAll
  // ('.day-tab') global y pisaba el onclick de OTRAS solapas que comparten la clase
  // (ej. las de Composiciones Eventos/Hotel), dejándolas sin funcionar.
  (document.getElementById('day-tabs-container')?.querySelectorAll('.day-tab') || []).forEach(tabEl=>{
    const d = tabEl.dataset.day || tabEl.textContent.trim();
    tabEl.dataset.day = d;
    const ds = D.clStateByDay[d];
    const isActive = d===currentDay;
    tabEl.classList.toggle('active', isActive);
    const done = ds ? (Array.isArray(ds.checked) ? ds.checked : Object.values(ds.checked||{})).filter(Boolean).length : 0;
    const total = CL_TASKS.length;
    const pct = Math.round(done/total*100);
    const estado = pct===100 ? ' is-full' : done>0 ? '' : ' is-empty';
    const esHoy = d === D.TODAY_DAY;
    // Nombre (completo y abreviado para celular) + avance del día
    tabEl.innerHTML = `<span class="cl-day-name"><span class="cl-day-l">${d}</span><span class="cl-day-s">${d.slice(0,3)}</span>${esHoy?'<i class="cl-day-hoy" title="Hoy"></i>':''}</span>`
      + `<span class="cl-day-count${estado}">${done ? done+'/'+total : '—'}</span>`;
    tabEl.setAttribute('role','tab');
    tabEl.setAttribute('aria-selected', isActive ? 'true' : 'false');
    // Re-bind click since we replaced innerHTML
    tabEl.onclick = (()=>{
      const day = d;
      return ()=>{ currentDay=day; clState=getOrCreateDayState(day); renderChecklistTable(); };
    })();
  });

  // Progress bar
  const checkedArr = Array.isArray(clState.checked) ? clState.checked : Object.values(clState.checked||{});
  let done_count, total;
  if(D.userRole === 'florista'){
    // Solo contar tareas asignadas al florista
    const misTareas = CL_TASKS.map((_,i) => i).filter(i => clState.responsable[i] === D.floristaNombre);
    done_count = misTareas.filter(i => checkedArr[i]).length;
    total = misTareas.length;
  } else {
    done_count = checkedArr.filter(Boolean).length;
    total = CL_TASKS.length;
  }
  const pct = Math.round(done_count/total*100);
  let progressEl = document.getElementById('cl-progress-bar-wrap');
  if(!progressEl){
    progressEl = document.createElement('div');
    progressEl.id = 'cl-progress-bar-wrap';
    progressEl.className = 'cl-progress';
    // Antes de las tarjetas (floristas) y de la lista (resto)
    const wrapper = document.getElementById('cl-cards-wrap') || document.getElementById('cl-table-wrap');
    wrapper.before(progressEl);
  }
  // Alertas en vivo del día: tareas en curso, excedidas y sin asignar
  const alertas = alertasDia();
  const esFlor = D.userRole === 'florista';
  const chipsAlerta = esFlor ? '' : [
    alertas.enCurso ? `<span class="cl-alerta is-run">${alertas.enCurso} en curso</span>` : '',
    alertas.excedidas ? `<button class="cl-alerta is-over" onclick="clSetFiltro('estado','pend')" title="Superaron su tiempo de referencia">${alertas.excedidas} excedida${alertas.excedidas!==1?'s':''}</button>` : '',
    alertas.sinAsignar ? `<button class="cl-alerta is-sin" onclick="clSetFiltro('estado','sin')">${alertas.sinAsignar} sin asignar</button>` : '',
  ].join('');
  const pctOk = total ? pct : 0;
  progressEl.innerHTML = `
    <div class="cl-progress-head">
      <div class="cl-progress-txt"><strong>${done_count}</strong> de ${total} tareas hechas · ${currentDay}</div>
      <div class="cl-progress-side">${chipsAlerta}<span class="cl-progress-pct${pctOk===100?' is-full':''}">${pctOk===100 ? 'Día completo' : pctOk+'%'}</span></div>
    </div>
    <div class="cl-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pctOk}"><span style="width:${pctOk}%"></span></div>`;

  // Aviso de Nuevos atrasados (gerencia). Se ubica arriba de la barra de progreso.
  renderNuevosAtrasadosBanner();
  _asegurarRelojChecklist();

  // ── Floristas: vista de tarjetas (mobile-first) en lugar de la lista ──
  const cardsWrap = document.getElementById('cl-cards-wrap');
  const tableWrap = document.getElementById('cl-table-wrap');
  if(esFlor){
    if(tableWrap) tableWrap.style.display = 'none';
    if(cardsWrap){ cardsWrap.style.display = ''; renderChecklistCards(cardsWrap); }
    const fEl = document.getElementById('cl-filtro-wrap');
    if(fEl) fEl.style.display = 'none';
    _renderSelBar();
    D.renderProductividadCL();
    return;
  }
  if(tableWrap) tableWrap.style.display = '';
  if(cardsWrap) cardsWrap.style.display = 'none';

  const esGerencia = D.userRole === 'gerencia';
  if(!esGerencia){ clVista.sel = false; clSel.clear(); if(clVista.agrupar!=='zona' && D.userRole!=='operario') clVista.agrupar='zona'; }

  // ── Barra de herramientas: buscador (se crea una sola vez para no perder el
  // foco al re-renderizar) + filtros y acciones (se redibujan) ──
  let filtroEl = document.getElementById('cl-filtro-wrap');
  if(!filtroEl){
    filtroEl = document.createElement('div');
    filtroEl.id = 'cl-filtro-wrap';
    filtroEl.className = 'cl-toolbar';
    filtroEl.innerHTML = `
      <label class="cl-search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>
        <input id="cl-filtro-txt" type="search" placeholder="Buscar zona o responsable" autocomplete="off"
          oninput="clSetFiltro('txt',this.value)">
      </label>
      <div id="cl-toolbar-dyn" class="cl-toolbar-dyn"></div>`;
    document.getElementById('cl-table-wrap').before(filtroEl);
  }
  filtroEl.style.display = '';
  const nSin = CL_TASKS.reduce((s,t,i)=> s + (!clState.checked[i] && !(clState.responsable[i]||t.responsable) ? 1 : 0), 0);
  const nPorFiltro = { all: CL_TASKS.length, pend: CL_TASKS.length - done_count, hechas: done_count, sin: nSin };
  const segBtn = (f, lbl) => `<button class="cl-fbtn${clFiltro.estado===f?' active':''}" aria-pressed="${clFiltro.estado===f}" onclick="clSetFiltro('estado','${f}')">${lbl}<span class="cl-seg-n">${nPorFiltro[f]}</span></button>`;
  const diasConDatos = D.DIAS_SEMANA_NAMES.filter(d => d!==currentDay && (D.clStateByDay[d]?.responsable||[]).some(Boolean));
  const hayPasada = Object.keys(_asignacionesSemanaPasada()).length > 0;
  document.getElementById('cl-toolbar-dyn').innerHTML = `
    <div class="cl-seg" role="group" aria-label="Filtrar por estado">
      ${segBtn('all','Todas')}${segBtn('pend','Pendientes')}${segBtn('hechas','Hechas')}${nSin||clFiltro.estado==='sin' ? segBtn('sin','Sin asignar') : ''}
    </div>
    <div class="cl-seg" role="group" aria-label="Agrupar">
      <button class="cl-fbtn${clVista.agrupar==='zona'?' active':''}" onclick="clSetVista('agrupar','zona')">Por zona</button>
      <button class="cl-fbtn${clVista.agrupar==='persona'?' active':''}" onclick="clSetVista('agrupar','persona')">Por persona</button>
    </div>
    ${esGerencia ? `<div class="cl-acciones">
      <button class="cl-btn-tool${clVista.sel?' active':''}" onclick="clSetVista('sel',${!clVista.sel})" title="Elegir varias tareas para asignarlas juntas">${clVista.sel?'Terminar selección':'Seleccionar'}</button>
      ${diasConDatos.length || hayPasada ? `<select class="cl-btn-tool cl-copiar" onchange="clCopiarDe(this.value); this.value=''" aria-label="Copiar asignaciones">
        <option value="">Copiar de…</option>
        ${hayPasada ? `<option value="__pasada">${currentDay} pasado</option>` : ''}
        ${diasConDatos.map(d=>`<option value="${d}">${d}</option>`).join('')}
      </select>` : ''}
    </div>` : ''}`;

  const list = document.getElementById('checklist-body');
  // Contador de días desde el último Nuevo por zona — solo lo ve gerencia
  const ultimoNuevoMap = esGerencia ? mapUltimoNuevoPorZona() : null;
  const txt = clFiltro.txt.trim().toLowerCase();
  const porPersona = clVista.agrupar === 'persona';
  const minAhora = _minAhora();
  const esHoy = currentDay === D.TODAY_DAY;

  // Tareas visibles según el filtro
  const visibles = [];
  CL_TASKS.forEach((t,i)=>{
    const curResp = clState.responsable[i] || t.responsable || '';
    if(txt && !t.zona.toLowerCase().includes(txt) && !String(curResp).toLowerCase().includes(txt)) return;
    if(clFiltro.estado==='pend' && clState.checked[i]) return;
    if(clFiltro.estado==='hechas' && !clState.checked[i]) return;
    if(clFiltro.estado==='sin' && (clState.checked[i] || curResp)) return;
    visibles.push(i);
  });

  // Agrupar: por zona (sección) o por persona (responsable)
  const grupos = new Map();
  visibles.forEach(i=>{
    const t = CL_TASKS[i];
    const key = porPersona ? (clState.responsable[i] || t.responsable || '') : t.sec;
    if(!grupos.has(key)) grupos.set(key, []);
    grupos.get(key).push(i);
  });
  let claves = [...grupos.keys()];
  if(porPersona){
    const orden = k => k==='' ? -1 : (CL_RESP_OPTS.indexOf(k) < 0 ? 999 : CL_RESP_OPTS.indexOf(k));
    claves.sort((a,b)=> orden(a)-orden(b) || a.localeCompare(b));
  }

  // Estado de una tarea para ordenar: en curso → pendiente → hecha
  const rango = i => clState.checked[i] ? 2 : (clState.inicio?.[i] && !clState.fin?.[i] ? 0 : 1);

  const filaTarea = (i) => {
    const t = CL_TASKS[i];
    const done    = !!clState.checked[i];
    const curResp = clState.responsable[i] || t.responsable || '';
    const curAct  = clState.actividad[i]   || t.actividad;
    const curObs  = (clState.obs[i] && clState.obs[i] !== 'Observaciones') ? clState.obs[i] : (t.obs||'');
    const ref     = getTiempoRef(i, curAct);
    const actLower = String(curAct).toLowerCase();
    const nuevoInfo = ultimoNuevoMap && actLower!=='riego' ? badgeUltimoNuevo(ultimoNuevoMap[_zonaKey(t.sec,t.zona)]) : '';
    const secInfo = porPersona ? `<span class="cl-meta-item cl-meta-sec ${SEC_HEADERS[t.sec]?.cls||''}">${esc(_secNombre(t.sec))}</span>` : '';
    // En curso: minutos transcurridos y si ya superó la referencia
    let curso = '', excedida = false;
    const ini = clState.inicio?.[i] || '';
    if(!done && ini && !clState.fin?.[i] && esHoy){
      const trans = Math.max(0, minAhora - _hmToMin(ini));
      excedida = !!(ref && trans > ref);
      curso = `<span class="cl-meta-item cl-curso${excedida?' is-over':''}">${excedida ? `Excedida · ${fmtDur(trans)} de ${fmtDur(ref)}` : `En curso · ${fmtDur(trans)||'0m'}`}</span>`;
    }
    const refTxt = ref && !curso ? `<span class="cl-meta-item" title="Tiempo de referencia">${icon('clock')}${ref} min</span>` : '';
    const meta = [secInfo, curso, nuevoInfo, refTxt].filter(Boolean).join('');
    const sel = clVista.sel && clSel.has(i);
    const check = clVista.sel && done
      ? '<span class="cl-check-sp"></span>'
      : clVista.sel
      ? `<label class="cl-check cl-selbox" title="Seleccionar"><input type="checkbox" ${sel?'checked':''} onchange="clToggleSel(${i})"><span></span></label>`
      : `<label class="cl-check" title="${done?'Desmarcar':'Marcar como hecha'}"><input type="checkbox" class="task-check" ${done?'checked':''} onchange="toggleTask(${i},this)"><span></span></label>`;
    const clsFila = `cl-row${done?' is-done':''}${excedida?' is-over':''}${sel?' is-sel':''}`;

    // Tarea hecha: resumen en texto (sin campos), para que la lista respire
    if(done){
      const fin = clState.fin?.[i] || '';
      return `<div class="${clsFila}">
        ${check}
        <div class="cl-row-main">
          <div class="cl-row-zona">${esc(t.zona)}${actLower!=='riego'?D._btnGuiaArreglo(t.zona):''}</div>
          ${meta ? `<div class="cl-row-meta">${meta}</div>` : ''}
        </div>
        <div class="cl-row-act"><span class="badge ${getBadge(curAct)}">${esc(curAct)}</span></div>
        <div class="cl-row-obs">${curObs ? `<span class="cl-obs-txt">${esc(curObs)}</span>` : ''}</div>
        <div class="cl-row-horas"><span class="cl-rango">${ini||'—'}<i>–</i>${fin||'—'}</span>${durBadge(ini, fin, ref)}</div>
        <div class="cl-row-resp">${curResp ? `<span class="cl-persona">${esc(curResp)}</span>` : '<span class="cl-muted">Sin asignar</span>'}</div>
      </div>`;
    }

    // Actividad: la determina gerencia (default Retoque); el resto la ve como badge
    const actividadCell = esGerencia
      ? `<select class="cl-select cl-act-select cl-act-${actLower}" onchange="updActividad(${i},this.value)" aria-label="Actividad">
          ${CL_ACTIVIDAD_OPTS.map(o=>`<option${o.toLowerCase()===actLower?' selected':''}>${esc(o)}</option>`).join('')}
        </select>`
      : `<span class="badge ${getBadge(curAct)}">${esc(curAct)}</span>`;
    const respCell = D.userRole==='operario'
      ? (curResp ? `<span class="cl-persona">${esc(curResp)}</span>` : '<span class="cl-muted">Sin asignar</span>')
      : `<select class="cl-select${curResp?'':' is-empty'}" onchange="updCL(${i},'responsable',this.value)" aria-label="Responsable">
          <option value="">Asignar…</option>
          ${CL_RESP_OPTS.map(o=>`<option${o===curResp?' selected':''}>${esc(o)}</option>`).join('')}
        </select>`;
    return `<div class="${clsFila}">
      ${check}
      <div class="cl-row-main">
        <div class="cl-row-zona">${esc(t.zona)}${actLower!=='riego'?D._btnGuiaArreglo(t.zona):''}</div>
        ${meta ? `<div class="cl-row-meta">${meta}</div>` : ''}
      </div>
      <div class="cl-row-act">${actividadCell}</div>
      <div class="cl-row-obs"><input class="cl-obs-input cl-nota" value="${esc(curObs)}" placeholder="Agregar nota" aria-label="Observaciones"
        onchange="updCL(${i},'obs',this.value)"></div>
      <div class="cl-row-horas">${renderHoraCell(i,'inicio',false)}${renderHoraCell(i,'fin',false)}</div>
      <div class="cl-row-resp">${respCell}</div>
    </div>`;
  };

  // Plegado: las zonas completas arrancan plegadas (solo sin filtros activos)
  const sinFiltros = !txt && clFiltro.estado==='all';
  let html = '';

  // ── Urgentes: ventas / pedidos con entrega en menos de 2 h (o atrasados) ──
  const pendVentas = _ventasPendientesHoy();
  const urgentes = pendVentas.filter(x => x.urgente);
  if(urgentes.length){
    html += `<section class="cl-group cl-group-urgente">
      <header class="cl-group-hd"><span class="cl-group-dot"></span><h3 class="cl-group-name">Urgente · entrega próxima</h3><span class="cl-group-count">${urgentes.length}</span></header>
      ${urgentes.map(_filaVenta).join('')}
    </section>`;
  }

  html += claves.map(key=>{
    const idxs = grupos.get(key).slice().sort((a,b)=> rango(a)-rango(b) || a-b);
    let nombre, cls, delGrupo;
    if(porPersona){
      nombre = key || 'Sin asignar';
      cls = key ? 'cl-group-persona' : 'cl-group-sin';
      delGrupo = CL_TASKS.map((t,i)=>(clState.responsable[i]||t.responsable||'')===key?i:-1).filter(i=>i>=0);
    } else {
      const sh = SEC_HEADERS[key] || {label:key, cls:''};
      nombre = sh.label; cls = sh.cls;
      delGrupo = CL_TASKS.map((t,i)=>t.sec===key?i:-1).filter(i=>i>=0);
    }
    const hechas = delGrupo.filter(i=>clState.checked[i]).length;
    const completo = hechas===delGrupo.length;
    const gk = (porPersona?'p:':'z:')+key;
    const plegada = clPlegadas[gk] ?? (sinFiltros && completo);
    let resumen = `${hechas} de ${delGrupo.length}`;
    if(porPersona && key){
      const minEst = delGrupo.reduce((s,i)=> s + (getTiempoRef(i, clState.actividad[i]||CL_TASKS[i].actividad)||0), 0);
      const minPend = delGrupo.filter(i=>!clState.checked[i]).reduce((s,i)=> s + (getTiempoRef(i, clState.actividad[i]||CL_TASKS[i].actividad)||0), 0);
      resumen = `${hechas} de ${delGrupo.length} hechas${minEst?` · ${fmtDur(minEst)} estimado${minPend?` · faltan ${fmtDur(minPend)}`:''}`:''}`;
    }
    const selGrupo = clVista.sel ? `<button class="cl-link cl-group-sel" onclick="event.stopPropagation();clSelGrupo('${gk.replace(/'/g,"\\'")}')">Seleccionar pendientes</button>` : '';
    return `<section class="cl-group ${cls}${plegada?' is-plegada':''}">
      <header class="cl-group-hd" onclick="clTogglePlegar('${gk.replace(/'/g,"\\'")}', ${!plegada})" role="button" aria-expanded="${!plegada}" tabindex="0">
        <svg class="cl-group-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
        <span class="cl-group-dot"></span>
        <h3 class="cl-group-name">${esc(nombre)}</h3>
        ${selGrupo}
        <span class="cl-group-count${completo?' is-full':''}">${resumen}</span>
      </header>
      ${plegada ? '' : idxs.map(filaTarea).join('')}
    </section>`;
  }).join('');

  if(!claves.length){
    html += `<div class="cl-vacio">${txt || clFiltro.estado!=='all'
      ? 'Ninguna tarea coincide con el filtro.'
      : 'No hay tareas cargadas para este día.'}</div>`;
  }

  // ── Eventos del día (fase armado, colocación o retiro según el estado) ──
  // gerencia/operario: ven los activos que tengan alguien asignado en alguna fase
  const eventosHoy = D.eventosData.filter(ev =>
    ev.estado !== 'Pedidos Finalizados' && (ev.asignado || ev.colocacionAsignado || ev.retiroAsignado));
  if(eventosHoy.length > 0){
    html += `<section class="cl-group cl-group-eventos">
      <header class="cl-group-hd"><span class="cl-group-dot"></span><h3 class="cl-group-name">Eventos del día</h3><span class="cl-group-count">${eventosHoy.length}</span></header>
      ${eventosHoy.map(ev=>{
        const evIdx = D.eventosData.indexOf(ev);
        const fase = eventoFase(ev);
        const flor = eventoFlorFase(ev, fase);
        const iniVal = fase === 'retiro' ? ev.retiroInicio : fase === 'colocacion' ? ev.colocacionInicio : ev.inicio;
        const finVal = fase === 'retiro' ? ev.retiroFin : fase === 'colocacion' ? ev.colocacionFin : ev.fin;
        const meta = [ev.tipo, ev.salon, ev.pax ? ev.pax+' pax' : '', ev.hora].filter(Boolean).map(esc).join(' · ');
        return `<div class="cl-row cl-row-link" data-ev="${evIdx}" title="Ver detalle del evento">
          <span class="cl-check-sp"></span>
          <div class="cl-row-main">
            <div class="cl-row-zona">${esc(ev.nombre)}${D.badgeDiaRelativa(ev.fecha)}${eventoFaseTag(fase)}</div>
            ${meta ? `<div class="cl-row-meta"><span class="cl-meta-item">${meta}</span></div>` : ''}
          </div>
          <div class="cl-row-act"></div>
          <div class="cl-row-obs"></div>
          <div class="cl-row-horas">${D.renderEvHoraCell(evIdx,'inicio',ev,fase)}${D.renderEvHoraCell(evIdx,'fin',ev,fase)}${iniVal && finVal ? durBadge(iniVal, finVal) : ''}</div>
          <div class="cl-row-resp">${flor ? `<span class="cl-persona">${esc(flor)}</span>` : '<span class="cl-muted">Sin asignar</span>'}</div>
        </div>`;
      }).join('')}
    </section>`;
  }

  // ── Ventas / pedidos pendientes (no urgentes), ordenados por entrega ──
  const otrasVentas = pendVentas.filter(x => !x.urgente);
  if(otrasVentas.length > 0){
    html += `<section class="cl-group cl-group-ventas">
      <header class="cl-group-hd"><span class="cl-group-dot"></span><h3 class="cl-group-name">Ventas pendientes</h3><span class="cl-group-count">${otrasVentas.length}</span></header>
      ${otrasVentas.map(_filaVenta).join('')}
    </section>`;
  }

  list.innerHTML = html;
  // Tap en un evento/venta → abrir el detalle (excepto al tocar botones o selectores)
  list.querySelectorAll('.cl-row-link').forEach(row=>{
    row.addEventListener('click', e=>{
      if(e.target.closest('button, select, input, label')) return;
      if(row.dataset.ev !== undefined) openEventoDetail(Number(row.dataset.ev));
      else D.openVentaDetail(Number(row.dataset.venta));
    });
  });
  _renderSelBar();
  D.renderProductividadCL();
}

// ── Estado de la vista (gerencia/operario) ────────────────────────────────────
const clFiltro = { txt:'', estado:'all' };          // estado: all | pend | hechas | sin
const clVista  = { agrupar:'zona', sel:false };     // agrupar: zona | persona
const clSel    = new Set();                          // índices elegidos para asignar en bloque
const clPlegadas = {};                               // grupo → plegado (true/false)
export function clSetFiltro(k, v){ clFiltro[k] = v; renderChecklistTable(); }
export function clSetVista(k, v){
  clVista[k] = v;
  if(k==='sel' && !v) clSel.clear();
  renderChecklistTable();
}
export function clTogglePlegar(gk, plegar){ clPlegadas[gk] = plegar; renderChecklistTable(); }

function _secNombre(sec){ const l = SEC_HEADERS[sec]?.label || sec || ''; return l.charAt(0) + l.slice(1).toLowerCase(); }
function _minAhora(){ const n = new Date(); return n.getHours()*60 + n.getMinutes(); }

// Alertas del día activo: tareas en curso, excedidas (superan la referencia) y sin asignar
function alertasDia(){
  const out = { enCurso:0, excedidas:0, sinAsignar:0 };
  if(!clState) return out;
  const ahora = _minAhora();
  const esHoy = currentDay === D.TODAY_DAY;
  CL_TASKS.forEach((t,i)=>{
    if(clState.checked[i]) return;
    if(!(clState.responsable[i] || t.responsable)) out.sinAsignar++;
    const ini = clState.inicio?.[i];
    if(esHoy && ini && !clState.fin?.[i]){
      out.enCurso++;
      const ref = getTiempoRef(i, clState.actividad[i]||t.actividad);
      if(ref && ahora - _hmToMin(ini) > ref) out.excedidas++;
    }
  });
  return out;
}

// Re-dibuja el checklist cada minuto mientras está abierto, para que los
// contadores (en curso, entrega en X min) estén al día. No interrumpe si
// alguien está escribiendo o eligiendo en un campo.
let _relojCL = null;
function _asegurarRelojChecklist(){
  if(_relojCL) return;
  _relojCL = setInterval(()=>{
    if(!document.getElementById('page-checklist')?.classList.contains('active')) return;
    const ae = document.activeElement;
    if(ae && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName) && ae.closest('#page-checklist')) return;
    renderChecklistTable();
  }, 60000);
}

// ── Ventas / pedidos: entrega y urgencia ──────────────────────────────────────
// Un pedido con hora de entrega en menos de URGENTE_MIN minutos (o ya pasada)
// sube al principio del checklist como urgente.
const URGENTE_MIN = 120;
// Un pedido vencido hace más de 12 h ya no se trata como urgente (quedó olvidado
// como pendiente); sigue en "Ventas pendientes".
const URGENTE_VENCIDA_MIN = 12*60;
export function entregaVenta(v){
  let fecha = v.fechaEntrega || v.fecha || '';
  let hora = v.horaEntrega || '';
  if(!hora){
    // Pedidos de habitación viejos: la hora quedó en la descripción ("Para: 2026-11-05 15:30")
    const m = /Para:\s*(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/.exec(v.desc||'');
    if(m){ fecha = m[1]; hora = m[2]; }
  }
  if(!fecha || !hora) return { fecha, hora, mins:null };
  const [y,mo,d] = fecha.split('-').map(Number);
  const [h,mi] = hora.split(':').map(Number);
  const mins = Math.round((new Date(y, mo-1, d, h, mi) - new Date()) / 60000);
  return { fecha, hora, mins };
}
function _txtFaltan(mins){
  if(mins < 0) return `atrasada ${fmtDur(-mins)}`;
  if(mins === 0) return 'ahora';
  return `en ${fmtDur(mins)}`;
}
// Ventas pendientes que corresponde mostrar (asignadas, o para hoy aunque nadie
// las tenga todavía), con su entrega, ordenadas: urgentes primero y por hora.
function _ventasPendientesHoy(soloDe){
  return (ventasData||[]).map((v, vIdx) => ({ v, vIdx }))
    .filter(({v}) => v && v.estado === 'pendiente' && !v.fin)
    .map(x => ({ ...x, ent: entregaVenta(x.v) }))
    .filter(({v, ent}) => soloDe ? _sameName(v.asignado, soloDe) : (v.asignado || (ent.fecha||v.fecha) === D.TODAY_ISO))
    .map(x => ({ ...x, urgente: x.ent.mins !== null && x.ent.mins <= URGENTE_MIN && x.ent.mins > -URGENTE_VENCIDA_MIN }))
    .sort((a,b)=>{
      if(a.urgente !== b.urgente) return a.urgente ? -1 : 1;
      const ka = a.ent.mins ?? Infinity, kb = b.ent.mins ?? Infinity;
      return ka - kb;
    });
}
function _chipEntrega(x){
  if(!x.ent.hora) return '';
  const hoy = x.ent.fecha === D.TODAY_ISO;
  const cuando = (hoy ? '' : fmtDate(x.ent.fecha) + ' ') + x.ent.hora;
  if(x.urgente) return `<span class="cl-entrega is-urgente">Entrega ${cuando} · ${_txtFaltan(x.ent.mins)}</span>`;
  return `<span class="cl-entrega">Entrega ${cuando}</span>`;
}
function _filaVenta(x){
  const { v, vIdx } = x;
  const detalle = [v.cliente, v.dir, v.desc && !/^Hab\./.test(v.desc) ? v.desc : '', v.colores, v.dedicatoria ? '"'+v.dedicatoria+'"' : ''].filter(Boolean).map(esc).join(' · ');
  const resp = D.userRole === 'gerencia'
    ? `<select class="cl-select${v.asignado?'':' is-empty'}" onchange="clAsignarVenta(${vIdx},this.value)" aria-label="Florista">
        <option value="">Asignar…</option>
        ${CL_RESP_OPTS.map(o=>`<option${o===v.asignado?' selected':''}>${esc(o)}</option>`).join('')}
      </select>`
    : (v.asignado ? `<span class="cl-persona">${esc(v.asignado)}</span>` : '<span class="cl-muted">Sin asignar</span>');
  return `<div class="cl-row cl-row-link${x.urgente?' is-urgente':''}" data-venta="${vIdx}" title="Ver detalle del pedido">
    <span class="cl-check-sp"></span>
    <div class="cl-row-main">
      <div class="cl-row-zona">${esc(v.prod||'')}${x.ent.hora ? '' : D.badgeDiaRelativa(v.fecha)}${_chipEntrega(x)}</div>
      ${detalle ? `<div class="cl-row-meta"><span class="cl-meta-item">${detalle}</span></div>` : ''}
    </div>
    <div class="cl-row-act"></div>
    <div class="cl-row-obs"></div>
    <div class="cl-row-horas">${D.renderVentaHoraCell(vIdx,'inicio',v)}${D.renderVentaHoraCell(vIdx,'fin',v)}${v.inicio && v.fin ? durBadge(v.inicio, v.fin) : ''}</div>
    <div class="cl-row-resp">${resp}</div>
  </div>`;
}
export function clAsignarVenta(vIdx, nombre){
  const v = ventasData[vIdx];
  if(!v) return;
  v.asignado = nombre;
  D.fbSave('ventasData', ventasData);
  if(nombre) D.notificarAsignacion?.(nombre, `Pedido: ${v.prod||''}`, `${v.dir||v.cliente||''}${v.horaEntrega?' · entrega '+v.horaEntrega:''}. Ya te aparece en tu checklist.`);
  renderChecklistTable();
  showToast(nombre ? `${v.prod||'Pedido'} asignado a ${nombre}` : 'Pedido sin asignar');
}

// ── Asignar en bloque ─────────────────────────────────────────────────────────
export function clToggleSel(i){ if(clSel.has(i)) clSel.delete(i); else clSel.add(i); renderChecklistTable(); }
export function clSelGrupo(gk){
  const [tipo, key] = [gk.slice(0,1), gk.slice(2)];
  const idxs = CL_TASKS.map((t,i)=>i).filter(i=> !clState.checked[i] &&
    (tipo==='p' ? (clState.responsable[i]||CL_TASKS[i].responsable||'')===key : CL_TASKS[i].sec===key));
  const todas = idxs.length && idxs.every(i=>clSel.has(i));
  idxs.forEach(i=> todas ? clSel.delete(i) : clSel.add(i));
  renderChecklistTable();
}
function _renderSelBar(){
  let bar = document.getElementById('cl-selbar');
  if(!clVista.sel || D.userRole !== 'gerencia'){ if(bar) bar.remove(); return; }
  if(!bar){
    bar = document.createElement('div');
    bar.id = 'cl-selbar';
    bar.className = 'cl-selbar';
    document.getElementById('page-checklist').appendChild(bar);
  }
  const n = clSel.size;
  bar.innerHTML = `
    <span class="cl-selbar-n">${n ? `<strong>${n}</strong> tarea${n!==1?'s':''} elegida${n!==1?'s':''}` : 'Tocá las tareas que querés asignar'}</span>
    <select class="cl-select" ${n?'':'disabled'} onchange="clAsignarSel('responsable',this.value)" aria-label="Asignar a">
      <option value="">Asignar a…</option>
      ${CL_RESP_OPTS.map(o=>`<option>${esc(o)}</option>`).join('')}
      <option value="__nadie">Quitar responsable</option>
    </select>
    <select class="cl-select" ${n?'':'disabled'} onchange="clAsignarSel('actividad',this.value)" aria-label="Actividad">
      <option value="">Actividad…</option>
      ${CL_ACTIVIDAD_OPTS.map(o=>`<option>${esc(o)}</option>`).join('')}
    </select>
    <button class="cl-btn-quiet" onclick="clSetVista('sel',false)">Listo</button>`;
}
export function clAsignarSel(campo, val){
  if(!val || !clSel.size || D.userRole !== 'gerencia') return;
  const idxs = [...clSel].filter(i => !clState.checked[i]);
  if(campo === 'responsable'){
    const nombre = val === '__nadie' ? '' : val;
    idxs.forEach(i => { clState.responsable[i] = nombre; });
    saveWeekState(currentDay, 'responsable');
    showToast(nombre ? `${idxs.length} tarea${idxs.length!==1?'s':''} asignada${idxs.length!==1?'s':''} a ${nombre}` : `Se quitó el responsable de ${idxs.length} tarea${idxs.length!==1?'s':''}`);
  } else {
    let cambiados = [];
    idxs.forEach(i => { cambiados = cambiados.concat(setActividadDia(currentDay, i, val)); });
    showToast(`${idxs.length} tarea${idxs.length!==1?'s':''} en ${val}${cambiados.length?' · el resto de la semana quedó en Retoque':''}`);
  }
  clSel.clear();
  renderChecklistTable();
}

// ── Copiar asignaciones de otro día ───────────────────────────────────────────
// Del mismo día de la semana pasada (sale del historial: quién hizo cada zona y
// con qué actividad) o de otro día de esta semana (solo responsables, para no
// repetir un Nuevo que ya se hizo esta semana).
function _asignacionesSemanaPasada(){
  const d = new Date(D.TODAY_ISO + 'T12:00:00'); d.setDate(d.getDate() - 7);
  const wk = getISOWeekKey(d);
  const map = {};
  (D.checklistHistory||[]).forEach(h=>{
    if(h && h.weekKey === wk && h.day === currentDay && h.who) map[_zonaKey(h.sec, h.zona)] = { who:h.who, actividad:h.actividad };
  });
  return map;
}
export async function clCopiarDe(src){
  if(!src || D.userRole !== 'gerencia') return;
  const pend = CL_TASKS.map((_,i)=>i).filter(i => !clState.checked[i]);
  if(src === '__pasada'){
    const map = _asignacionesSemanaPasada();
    const aplicar = pend.filter(i => map[_zonaKey(CL_TASKS[i].sec, CL_TASKS[i].zona)]);
    if(!aplicar.length){ showToast('No hay registros del '+currentDay+' pasado para estas zonas'); return; }
    if(!await confirmModal(`¿Copiar responsables y actividad del ${currentDay} pasado en ${aplicar.length} tarea${aplicar.length!==1?'s':''} pendiente${aplicar.length!==1?'s':''}?`)) return;
    aplicar.forEach(i=>{
      const r = map[_zonaKey(CL_TASKS[i].sec, CL_TASKS[i].zona)];
      clState.responsable[i] = r.who;
      if(r.actividad && CL_ACTIVIDAD_OPTS.some(o=>o.toLowerCase()===String(r.actividad).toLowerCase())) setActividadDia(currentDay, i, r.actividad);
    });
    saveWeekState(currentDay, 'responsable');
    showToast(`Copiado del ${currentDay} pasado · ${aplicar.length} tareas`);
  } else {
    const ds = D.clStateByDay[src];
    if(!ds){ showToast('Ese día no tiene datos'); return; }
    const aplicar = pend.filter(i => ds.responsable?.[i]);
    if(!aplicar.length){ showToast(`El ${src} no tiene responsables cargados`); return; }
    if(!await confirmModal(`¿Copiar los responsables del ${src} en ${aplicar.length} tarea${aplicar.length!==1?'s':''} pendiente${aplicar.length!==1?'s':''} del ${currentDay}?`)) return;
    aplicar.forEach(i => { clState.responsable[i] = ds.responsable[i]; });
    saveWeekState(currentDay, 'responsable');
    showToast(`Responsables copiados del ${src}`);
  }
  renderChecklistTable();
}

// ── Programar Nuevo desde el aviso de atrasados ───────────────────────────────
export async function clProgramarNuevo(sec, zona){
  const i = CL_TASKS.findIndex(t => t.sec===sec && t.zona===zona);
  if(i < 0 || !clState) return;
  if(clState.checked[i]){ showToast(`${zona} ya está hecha el ${currentDay}`); return; }
  if(String(clState.actividad[i]||'').toLowerCase()==='nuevo'){ showToast(`${zona} ya figura como Nuevo el ${currentDay}`); return; }
  if(!await confirmModal(`¿Programar un arreglo Nuevo en ${zona} para el ${currentDay}?`)) return;
  updActividad(i, 'Nuevo');
  renderChecklistTable();
}

// ── Festejo al completar todas las tareas del día (floristas) ─────────────────
function festejarChecklist(){
  const cont = document.createElement('div');
  cont.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9997;overflow:hidden';
  const emojis = ['','','','','',''];
  for(let i=0;i<26;i++){
    const s = document.createElement('span');
    s.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    s.style.cssText = `position:absolute;top:-40px;left:${Math.random()*100}%;font-size:${18+Math.random()*16}px;animation:clConfetti ${2.2+Math.random()*1.6}s ease-in ${Math.random()*0.8}s forwards`;
    cont.appendChild(s);
  }
  document.body.appendChild(cont);
  setTimeout(()=>cont.remove(), 5500);
}

function _checkFestejoChecklist(){
  if(D.userRole!=='florista' || !D.floristaNombre) return;
  const mis = CL_TASKS.map((_,i)=>i).filter(i => (clState.responsable[i]||'') === D.floristaNombre);
  if(!mis.length || !mis.every(i=>clState.checked[i])) return;
  // Guarda por florista + día: en un dispositivo compartido cada florista tiene
  // su propio festejo. Antes la clave era solo por día, así que el primero que
  // terminaba dejaba sin "flores de decoración" al resto (la clave ya figuraba
  // usada). Incluir el nombre hace que a cada florista le salgan las flores.
  const k = 'clFestejo_' + D.TODAY_ISO + '_' + D.floristaNombre;
  try{ if(localStorage.getItem(k)) return; localStorage.setItem(k,'1'); }catch(e){}
  festejarChecklist();
  navigator.vibrate?.([60,60,60,60,120]);
  showToast(`¡Completaste todas tus tareas de hoy, ${D.floristaNombre}!`);
}

// ── Checklist en tarjetas para floristas (mobile-first) ───────────────────────
// Reemplaza la tabla por cards con botones grandes de Inicio/Fin. Reutiliza
// renderHoraCell / renderEvHoraCell / renderVentaHoraCell para los controles.
function renderChecklistCards(el){
  const misIdxs = CL_TASKS.map((_,i)=>i).filter(i => (clState.responsable[i]||CL_TASKS[i].responsable||'') === D.floristaNombre);

  const tareasHTML = misIdxs.map(i=>{
    const t = CL_TASKS[i];
    const done = clState.checked[i];
    const curAct = clState.actividad[i]||t.actividad;
    const curObs = (clState.obs[i] && clState.obs[i]!=='Observaciones') ? clState.obs[i] : (t.obs||'');
    const ref = getTiempoRef(i, curAct);
    const sh = SEC_HEADERS[t.sec];
    const dur = clState.inicio?.[i] && clState.fin?.[i] ? durBadge(clState.inicio[i], clState.fin[i], ref) : '';
    return `<div class="cl-card${done?' cl-card-done':''}">
      <div class="cl-card-top">
        <div>
          <div class="cl-card-zona">${done?'':''}${esc(t.zona)}${String(curAct).toLowerCase()!=='riego'?D._btnGuiaArreglo(t.zona):''}</div>
          <div class="cl-card-sec">${sh.icon} ${sh.label}</div>
        </div>
        <div class="cl-card-badges">
          <span class="badge ${getBadge(curAct)}">${esc(curAct)}</span>
          ${ref?`<span class="cl-card-ref" title="Tiempo promedio de referencia">${icon('clock')}${ref}m</span>`:''}
          ${dur}
        </div>
      </div>
      <input class="cl-obs-input cl-card-obs" value="${esc(curObs)}" placeholder="Observaciones..."
        onchange="updCL(${i},'obs',this.value)" ${done?'disabled':''}>
      <div class="cl-card-horas">
        <div class="cl-card-hora">${renderHoraCell(i,'inicio',done)}</div>
        <div class="cl-card-hora">${renderHoraCell(i,'fin',done)}</div>
      </div>
    </div>`;
  }).join('');

  // Eventos del día asignados a la florista (armado, colocación o retiro según fase)
  const eventosHoy = D.eventosData.filter(ev=>{
    if(ev.estado==='Pedidos Finalizados') return false;
    return florFaseVisible(ev, D.floristaNombre) !== null;
  });
  const evHTML = eventosHoy.map(ev=>{
    const evIdx = D.eventosData.indexOf(ev);
    const fase = florFaseVisible(ev, D.floristaNombre) || eventoFase(ev);
    const faseCls = fase==='retiro' ? 'cl-fase-retiro' : fase==='colocacion' ? 'cl-fase-coloc' : 'cl-fase-armado';
    const faseLbl = fase==='retiro' ? 'RETIRO' : fase==='colocacion' ? 'COLOCACIÓN' : 'ARMADO';
    return `<div class="cl-card cl-card-evento" onclick="if(!event.target.closest('button'))openEventoDetail(${evIdx})">
      <div class="cl-card-top">
        <div>
          <div class="cl-card-zona">${esc(ev.nombre)}</div>
          <div class="cl-card-sec">${esc(ev.tipo||'')}${ev.salon?' · '+esc(ev.salon):''}${ev.pax?' · '+ev.pax+' pax':''}${ev.hora?' · '+ev.hora:''}</div>
        </div>
        <span class="cl-card-fase ${faseCls}">${faseLbl}</span>
      </div>
      <div class="cl-card-horas">
        <div class="cl-card-hora">${D.renderEvHoraCell(evIdx,'inicio',ev,fase)}</div>
        <div class="cl-card-hora">${D.renderEvHoraCell(evIdx,'fin',ev,fase)}</div>
      </div>
    </div>`;
  }).join('');

  // Ventas / pedidos pendientes asignados: los de entrega próxima van primero, como urgentes
  const ventasMias = _ventasPendientesHoy(D.floristaNombre);
  const tarjetaVenta = (x) => {
    const { v, vIdx } = x;
    const detalle = [v.cliente, v.dir, v.colores].filter(Boolean).join(' · ');
    return `<div class="cl-card cl-card-venta${x.urgente?' cl-card-urgente':''}" onclick="if(!event.target.closest('button'))openVentaDetail(${vIdx})">
      <div class="cl-card-top">
        <div>
          <div class="cl-card-zona">${esc(v.prod||'')}</div>
          <div class="cl-card-sec">${esc(detalle)}</div>
        </div>
        ${_chipEntrega(x) || (v.fecha ? `<span class="cl-entrega">${fmtDate(v.fecha)}</span>` : '')}
      </div>
      <div class="cl-card-horas">
        <div class="cl-card-hora">${D.renderVentaHoraCell(vIdx,'inicio',v)}</div>
        <div class="cl-card-hora">${D.renderVentaHoraCell(vIdx,'fin',v)}</div>
      </div>
    </div>`;
  };
  const urgHTML = ventasMias.filter(x=>x.urgente).map(tarjetaVenta).join('');
  const vtHTML = ventasMias.filter(x=>!x.urgente).map(tarjetaVenta).join('');

  el.innerHTML = `
    ${urgHTML ? '<div class="cl-cards-sec-hdr cl-cards-urgente">Urgente · entrega próxima</div>'+urgHTML : ''}
    ${misIdxs.length ? tareasHTML : `<div class="cl-cards-empty">
      No tenés tareas asignadas para hoy, ${esc(D.floristaNombre)}
      <div class="cl-cards-empty-sub">Gerencia asigna las tareas desde la checklist general.</div>
    </div>`}
    ${evHTML ? '<div class="cl-cards-sec-hdr" style="color:#B8602A">Eventos del día</div>'+evHTML : ''}
    ${vtHTML ? '<div class="cl-cards-sec-hdr" style="color:var(--info)">Ventas pendientes</div>'+vtHTML : ''}`;
}

export function renderHoraCell(i, campo, done){
  const val = clState[campo]?.[i] || '';
  if(D.userRole === 'gerencia'){
    const dis = done ? 'disabled' : '';
    return `<input type="time" class="cl-time${val?' has-val':''}" value="${val}" ${dis} aria-label="${campo==='inicio'?'Hora de inicio':'Hora de fin'}"
      onchange="updCL(${i},'${campo}',this.value)">`;
  }
  if(val){
    const resetFn = done ? '' : `onclick="resetHora(${i},'${campo}')" title="Tocar para borrar"`;
    return `<span ${resetFn} class="cl-hora-val is-${campo}${done?'':' is-editable'}">${val}</span>`;
  }
  // Fin deshabilitado si: tarea completada O si no hay Inicio aún registrado
  const sinInicio = campo === 'fin' && !(clState.inicio?.[i]);
  const disAttr   = (done || sinInicio) ? 'disabled' : '';
  const disStyle  = done ? 'opacity:.45;cursor:not-allowed' : sinInicio ? 'opacity:.35;cursor:not-allowed' : '';
  const disStr    = disAttr ? `${disAttr} style="${disStyle}"` : '';
  const label = campo==='inicio' ? icon('play')+'Inicio' : icon('stop')+'Fin';
  const cls   = campo==='inicio' ? 'btn-hora-inicio' : 'btn-hora-fin';
  const title = sinInicio ? 'title="Primero registrá el Inicio"' : '';
  return `<button class="${cls}" ${disStr} ${title} onclick="registrarHora(${i},'${campo}')">${label}</button>`;
}

export function registrarHora(i, campo){
  if(!clState) return;
  if(D.userRole === 'florista' && clState.responsable[i] !== D.floristaNombre){
    showToast('Solo podés operar las tareas asignadas a vos'); return;
  }
  if(!clState.inicio) clState.inicio = CL_TASKS.map(()=>'');
  if(!clState.fin)    clState.fin    = CL_TASKS.map(()=>'');

  // ── VALIDACIÓN: no permitir Fin sin Inicio ────────────────────────────────
  if(campo === 'fin'){
    const inicioVal = clState.inicio[i] || '';
    if(!inicioVal){
      // Mostrar alerta prominente al florista
      showAlertaHorario('No hay Inicio registrado para esta tarea.\nPrimero registrá el Inicio antes de marcar el Fin.');
      return;
    }
  }

  const now = new Date();
  const hh  = String(now.getHours()).padStart(2,'0');
  const mm  = String(now.getMinutes()).padStart(2,'0');
  const horaActual = hh+':'+mm;

  // ── VALIDACIÓN: Fin no puede ser anterior al Inicio ───────────────────────
  if(campo === 'fin'){
    const inicioVal = clState.inicio[i];
    const durMin = calcDuracion(inicioVal, horaActual);
    if(durMin !== null && durMin < 0){
      showAlertaHorario('El Fin (' + horaActual + ') es anterior al Inicio (' + inicioVal + ').\nVerificá el horario.');
      return;
    }
  }

  clState[campo][i] = horaActual;

  if(campo === 'fin' && !clState.checked[i]){
    clState.checked[i] = true;
    const t    = CL_TASKS[i];
    const resp = clState.responsable[i] || '—';
    const inicioFinal = clState.inicio[i] || '';
    const durFinal    = calcDuracion(inicioFinal, horaActual);
    const ref         = getTiempoRef(i, clState.actividad[i]||t.actividad);
    const excedida    = !!(ref && durFinal && durFinal > ref);
    D.checklistHistory.push({
      date: D.TODAY_ISO, week: D.getWeekLabel(now),
      weekKey: CURRENT_WEEK_KEY, day: currentDay,
      sec: t.sec, zona: t.zona,
      actividad: clState.actividad[i]||t.actividad,
      obs: clState.obs[i]||'',
      tiempo: clState.tiempo[i]||'',
      inicio: inicioFinal, fin: horaActual,
      duracion: durFinal, ref: ref||0, excedida,
      who: resp, hora: now.toTimeString().slice(0,5)
    });
    localStorage.setItem('cl_history', JSON.stringify(D.checklistHistory));
    D.fbSave('checklistHistory', D.checklistHistory);
    registrarUltimoNuevo(t.sec, t.zona, clState.actividad[i]||t.actividad, D.TODAY_ISO);
    // Nuevo hecho = no vuelve a pedir Nuevo el resto de la semana en esta zona.
    if(String(clState.actividad[i]||t.actividad).toLowerCase().includes('nuevo')) bajarNuevoRestoSemana(i, currentDay);
    renderHistoryPanel();
    // Toast de confirmación con duración
    const durTxt = durFinal ? ' · Duración: ' + fmtDur(durFinal) : '';
    showToast('Tarea finalizada — Inicio: ' + inicioFinal + ' · Fin: ' + horaActual + durTxt);
    // Aviso a gerencia si se excedió el tiempo promedio de referencia
    if(excedida){
      window.pushSend?.('Tarea excedida',
        `${resp} tardó ${fmtDur(durFinal)} en "${t.zona} · ${clState.actividad[i]||t.actividad}" (referencia: ${ref}m)`,
        'tarea-excedida', 'roles:gerencia');
    }
    // Si la tarea era un arreglo Nuevo, ofrecer adjuntar foto (floristas)
    if(D.userRole==='florista' && String(clState.actividad[i]||t.actividad).toLowerCase().includes('nuevo')){
      ofrecerFotoNuevo(D.checklistHistory.length-1, t.zona);
    }
    saveWeekState(currentDay, 'checked', i);
    navigator.vibrate?.([40,60,80]);
    _checkFestejoChecklist();
  } else if(campo === 'inicio'){
    showToast('Inicio registrado: ' + horaActual);
    navigator.vibrate?.(30);
  }

  saveWeekState(currentDay, campo, i);
  renderChecklistTable();
}

// ── Foto del arreglo al completar un Nuevo ────────────────────────────────────
// La florista puede adjuntar una foto (comprimida) al terminar una tarea Nuevo;
// queda en el registro del historial y gerencia la ve desde el panel.
let _fotoHistIdx = -1;
let _fotoDataTmp = '';

function ofrecerFotoNuevo(histIdx, zona){
  const modal = document.getElementById('cl-foto-modal');
  if(!modal) return;
  _fotoHistIdx = histIdx; _fotoDataTmp = '';
  document.getElementById('cl-foto-zona').textContent = `Sacale una foto al arreglo nuevo de "${zona}" para que gerencia lo vea (opcional).`;
  document.getElementById('cl-foto-file').value = '';
  const p = document.getElementById('cl-foto-preview');
  p.src = ''; p.style.display = 'none';
  document.getElementById('cl-foto-save').disabled = true;
  modal.classList.add('open');
}

export function clFotoPreview(input){
  const file = input.files[0]; if(!file) return;
  comprimirImagen(file, 800, 0.65, data => {
    _fotoDataTmp = data;
    const p = document.getElementById('cl-foto-preview');
    p.src = data; p.style.display = 'block';
    document.getElementById('cl-foto-save').disabled = false;
  });
}

export function guardarFotoChecklist(){
  if(!_fotoDataTmp || _fotoHistIdx<0 || !D.checklistHistory[_fotoHistIdx]){ D.closeModal('cl-foto-modal'); return; }
  D.checklistHistory[_fotoHistIdx].img = _fotoDataTmp;
  try{ localStorage.setItem('cl_history', JSON.stringify(D.checklistHistory)); }catch(e){}
  D.fbSave('checklistHistory', D.checklistHistory);
  D.closeModal('cl-foto-modal');
  showToast('Foto guardada — gerencia la puede ver en el historial');
  renderHistoryPanel();
}

// ── Galería de fotos de arreglos Nuevos (gerencia) ────────────────────────────
export function openGaleriaNuevos(){
  const sel = document.getElementById('gal-nuevos-semana');
  if(sel){
    const semanas = [...new Set((D.checklistHistory||[]).filter(r=>r?.img).map(r=>r.week).filter(Boolean))].reverse();
    const cur = sel.value;
    sel.innerHTML = '<option value="">Todas las semanas</option>' + semanas.map(w=>`<option${w===cur?' selected':''}>${esc(w)}</option>`).join('');
  }
  renderGaleriaNuevos();
  document.getElementById('cl-galeria-modal').classList.add('open');
}

export function renderGaleriaNuevos(){
  const el = document.getElementById('cl-galeria-grid');
  if(!el) return;
  const semana = document.getElementById('gal-nuevos-semana')?.value || '';
  const fotos = (D.checklistHistory||[])
    .map((r,i)=>({r,i}))
    .filter(x => x.r?.img && (!semana || x.r.week === semana))
    .reverse()
    .slice(0, 80);
  const cnt = document.getElementById('gal-nuevos-count');
  if(cnt) cnt.textContent = fotos.length ? fotos.length + ' foto' + (fotos.length!==1?'s':'') : '';
  el.innerHTML = fotos.length ? fotos.map(({r,i})=>`
    <div class="gal-nuevo-item" onclick="verFotoChecklist(${i})" title="Ver en grande">
      <img src="${r.img}" loading="lazy" alt="${esc(r.zona||'')}">
      <div class="gal-nuevo-cap">
        <strong>${esc(r.zona||'')}</strong>
        <span>${fmtDate(r.date)}${r.who?' · '+esc(r.who):''}</span>
      </div>
    </div>`).join('')
    : '<p style="color:var(--mid-gray);font-size:13px;padding:24px;text-align:center">Todavía no hay fotos — las floristas pueden adjuntar una al terminar un arreglo Nuevo.</p>';
}

export function verFotoChecklist(idx){
  const img = D.checklistHistory[idx]?.img; if(!img) return;
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer';
  ov.innerHTML = `<img src="${img}" style="max-width:94vw;max-height:90vh;border-radius:12px">`;
  ov.onclick = () => ov.remove();
  document.body.appendChild(ov);
}

// Alerta prominente para errores de horario (más visible que un toast)
export function showAlertaHorario(msg){
  let overlay = document.getElementById('alerta-horario-overlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'alerta-horario-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px';
    overlay.innerHTML = `
      <div style="background:white;border-radius:16px;padding:32px 28px;max-width:340px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
        <div style="font-size:48px;margin-bottom:12px"></div>
        <div id="alerta-horario-msg" style="font-size:15px;font-weight:600;color:var(--charcoal);line-height:1.5;margin-bottom:24px;white-space:pre-line"></div>
        <button onclick="document.getElementById('alerta-horario-overlay').remove()"
          style="background:var(--charcoal);color:white;border:none;border-radius:10px;padding:12px 32px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;width:100%">
          Entendido
        </button>
      </div>`;
    document.body.appendChild(overlay);
  }
  document.getElementById('alerta-horario-msg').textContent = msg;
  overlay.style.display = 'flex';
  // Cerrar al tocar fuera
  overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
}

export async function resetHora(i, campo){
  if(!clState) return;
  // Si se borra el Inicio y ya hay Fin, también borrar el Fin para mantener consistencia
  if(campo === 'inicio' && clState.fin?.[i]){
    if(!await confirmModal('¿Borrar el horario de Inicio?\nEsto también borrará el Fin registrado (' + clState.fin[i] + ') para mantener la consistencia.')){
      return;
    }
    clState.fin[i] = '';
    // Si la tarea estaba marcada solo por el Fin, desmarcarla
    if(clState.checked[i]) clState.checked[i] = false;
  }
  clState[campo][i] = '';
  // Si se borra el Fin, la tarea deja de estar completada (queda reabierta).
  if(campo === 'fin' && clState.checked?.[i]){
    clState.checked[i] = false;
    saveWeekState(currentDay, 'checked', i);
  }
  saveWeekState(currentDay, campo, i);
  renderChecklistTable();
}

// ── Al volver a la app (tab activo), forzar resync de Firebase ────────────────
document.addEventListener('visibilitychange', () => {
  if(document.visibilityState === 'visible'){
    // Resetear el timestamp de última escritura para permitir que Firebase pise
    window._checklistLastSave = 0;
    // Mostrar indicador sutil de resincronización
    const page = document.getElementById('page-checklist');
    if(page && page.classList.contains('active')){
      showToast('Actualizando checklist...');
    }
  }
});

export function updCL(i, field, val){
  if(!clState) return;
  clState[field][i] = val;
  // Al cargar/editar la hora de Fin a mano (gerencia usa un <input time>), mantener
  // el estado "completada" en sincronía: con Fin la tarea queda tildada; sin Fin,
  // destildada. Sin esto, la tarea mostraba duración pero seguía figurando pendiente
  // y al recargar aparecía "vacía".
  if(field === 'fin'){
    const debeEstar = !!val;
    if(!Array.isArray(clState.checked)) clState.checked = CL_TASKS.map(()=>false);
    if(clState.checked[i] !== debeEstar){
      clState.checked[i] = debeEstar;
      saveWeekState(currentDay, 'checked', i);
    }
    saveWeekState(currentDay, field, i);
    renderChecklistTable();
    return;
  }
  saveWeekState(currentDay, field, i);
  if(field === 'responsable') renderChecklistTable();
}

export function toggleTask(i, el){
  if(!clState) return;
  // Florista individual: solo puede marcar sus tareas
  if(D.userRole === 'florista' && clState.responsable[i] !== D.floristaNombre){
    el.checked = !el.checked; // revertir
    showToast('Solo podés operar las tareas asignadas a vos');
    return;
  }
  clState.checked[i] = el.checked;
  if(el.checked){
    const t  = CL_TASKS[i];
    const now = new Date();
    const resp = clState.responsable[i] || '—';
    const actReg = clState.actividad[i]||t.actividad;
    const refReg = getTiempoRef(i, actReg);
    const durReg = calcDuracion(clState.inicio?.[i]||'', clState.fin?.[i]||'');
    D.checklistHistory.push({
      date: D.TODAY_ISO,
      week: D.getWeekLabel(now),
      weekKey: CURRENT_WEEK_KEY,
      day:  currentDay,
      sec:  t.sec,
      zona: t.zona,
      actividad: actReg,
      obs:  clState.obs[i]||'',
      tiempo: clState.tiempo[i]||'',
      inicio: clState.inicio?.[i]||'',
      fin:    clState.fin?.[i]||'',
      duracion: durReg,
      ref: refReg,
      excedida: !!(refReg && durReg && durReg > refReg),
      who:  resp,
      hora: now.toTimeString().slice(0,5)
    });
    localStorage.setItem('cl_history', JSON.stringify(D.checklistHistory));
    D.fbSave('checklistHistory', D.checklistHistory);
    registrarUltimoNuevo(t.sec, t.zona, clState.actividad[i]||t.actividad, D.TODAY_ISO);
    // Nuevo hecho = no vuelve a pedir Nuevo el resto de la semana en esta zona.
    if(String(clState.actividad[i]||t.actividad).toLowerCase().includes('nuevo')) bajarNuevoRestoSemana(i, currentDay);
    renderHistoryPanel();
    // Si la tarea era un arreglo Nuevo, ofrecer adjuntar foto (floristas)
    if(D.userRole==='florista' && String(clState.actividad[i]||t.actividad).toLowerCase().includes('nuevo')){
      ofrecerFotoNuevo(D.checklistHistory.length-1, t.zona);
    }
    navigator.vibrate?.(40);
    _checkFestejoChecklist();
  }
  saveWeekState(currentDay, 'checked', i);
  renderChecklistTable();
}

export async function confirmResetWeek(){
  if(D.userRole !== 'gerencia'){ showToast('Solo gerencia puede realizar esta acción'); return; }
  const toArr = v => Array.isArray(v) ? v : (v ? Object.values(v) : []);
  let done = 0;
  try { done = Object.values(D.clStateByDay||{}).reduce((sum,ds)=>sum+toArr(ds?.checked).filter(Boolean).length,0); } catch(e){}
  const msg = done>0
    ? `¿Cerrar la semana y empezar nueva?\nSe archivarán ${done} tareas completadas en el historial y la checklist quedará limpia.`
    : '¿Iniciar nueva semana? La checklist quedará limpia.';
  if(!await confirmModal(msg)) return;
  // Archive any checked tasks not yet saved to history
  const now = new Date();
  ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].forEach(day=>{
    const ds = D.clStateByDay[day];
    if(!ds) return;
    const checkedArr = toArr(ds.checked);
    checkedArr.forEach((checked,i)=>{
      if(checked){
        const t = CL_TASKS[i];
        const resp = ds.responsable[i]||'—';
        const alreadyIn = D.checklistHistory.some(h=>
          h.weekKey===CURRENT_WEEK_KEY && h.day===day && h.zona===t.zona
        );
        if(!alreadyIn){
          const hi2 = ds.inicio ? (ds.inicio[i]||'') : '';
          const hf2 = ds.fin    ? (ds.fin[i]   ||'') : '';
          D.checklistHistory.push({
            date: D.TODAY_ISO, week: D.getWeekLabel(now),
            weekKey: CURRENT_WEEK_KEY, day, sec: t.sec,
            zona: t.zona, actividad: ds.actividad[i]||t.actividad,
            obs: ds.obs[i]||'', tiempo: fmtDur(calcDuracion(hi2,hf2)),
            inicio: hi2, fin: hf2, duracion: calcDuracion(hi2,hf2),
            who: resp, hora: '—'
          });
        }
      }
    });
  });
  localStorage.setItem('cl_history', JSON.stringify(D.checklistHistory));
  D.fbSave('checklistHistory', D.checklistHistory);
  // Reset checklist
  D._setClStateByDay({});
  D.fbSave('checklist', D.clStateByDay); // Limpiar TODOS los días de Firebase
  clState = getOrCreateDayState(currentDay);
  try { localStorage.removeItem(CL_STORAGE_KEY); } catch(e){}
  initChecklist();
  showToast('Semana archivada — checklist limpia para la nueva semana');
}

export function toggleHistory(){
  if(D.userRole !== 'gerencia') return;
  const panel = document.getElementById('history-panel');
  const btn   = document.getElementById('history-toggle-btn');
  const show  = panel.style.display==='none';
  panel.style.display = show ? 'block' : 'none';
  btn.textContent = show ? '✕ Cerrar Historial' : 'Ver Historial';
}

// ── Poda automática del historial del checklist (solo gerencia) ───────────────
// El historial crece sin límite y encima guarda fotos (pesadas). Sin mantenimiento
// la app se vuelve lenta y Firebase pesado. Esta poda es conservadora:
//   · registros de más de 2 meses → se archivan (se quitan del historial activo)
//   · fotos de más de 60 días → se borra la foto pero el registro queda
//   · tope duro: como red de seguridad, máximo 4000 registros (los más recientes)
const HIST_MESES_RETENER = 2;
const HIST_DIAS_FOTO = 60;
const HIST_MAX = 4000;

export function podarHistorial(){
  if(D.userRole !== 'gerencia') return;
  const k = 'histPoda_' + D.TODAY_ISO;
  try{ if(localStorage.getItem(k)) return; }catch(e){}
  if(!Array.isArray(D.checklistHistory) || !D.checklistHistory.length){ try{ localStorage.setItem(k,'1'); }catch(e){} return; }

  const hoy = new Date(D.TODAY_ISO);
  const limiteReg = new Date(hoy); limiteReg.setMonth(limiteReg.getMonth() - HIST_MESES_RETENER);
  const limiteFotoISO = D.addDaysISO(D.TODAY_ISO, -HIST_DIAS_FOTO);
  const limiteRegISO = limiteReg.toISOString().slice(0,10);

  let quitados = 0, fotosQuitadas = 0;
  let podado = D.checklistHistory.filter(r => {
    if(r?.date && r.date < limiteRegISO){ quitados++; return false; }
    return true;
  });
  podado.forEach(r => {
    if(r?.img && r.date && r.date < limiteFotoISO){ delete r.img; fotosQuitadas++; }
  });
  if(podado.length > HIST_MAX){
    podado = [...podado].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).slice(-HIST_MAX);
    quitados = D.checklistHistory.length - podado.length;
  }

  try{ localStorage.setItem(k,'1'); }catch(e){}
  if(!quitados && !fotosQuitadas) return; // nada que hacer
  D._setChecklistHistory(podado);
  try{ localStorage.setItem('cl_history', JSON.stringify(D.checklistHistory)); }catch(e){}
  D.fbSave('checklistHistory', D.checklistHistory);
  const partes = [];
  if(quitados) partes.push(`${quitados} registro${quitados!==1?'s':''} de +${HIST_MESES_RETENER} meses`);
  if(fotosQuitadas) partes.push(`${fotosQuitadas} foto${fotosQuitadas!==1?'s':''} antigua${fotosQuitadas!==1?'s':''}`);
  showToast('Historial optimizado — se archivaron ' + partes.join(' y '));
  if(document.getElementById('history-panel')?.style.display !== 'none') renderHistoryPanel();
}

export function renderHistoryPanel(){
  const weeks = [...new Set(D.checklistHistory.map(r=>r.week))];
  const tabsEl = document.getElementById('history-week-tabs');
  tabsEl.innerHTML = '<span style="font-size:12px;color:var(--mid-gray);margin-right:8px">Filtrar semana:</span>';
  if(weeks.length===0){ tabsEl.innerHTML+='<span style="font-size:12px;color:var(--mid-gray)">Sin registros aún</span>'; }
  weeks.forEach(w=>{
    const btn = document.createElement('button');
    btn.className='history-week-btn'+(w===historyWeekFilter?' active':'');
    btn.textContent = w;
    btn.onclick=()=>{ historyWeekFilter=(historyWeekFilter===w?null:w); renderHistoryPanel(); };
    tabsEl.appendChild(btn);
  });
  const filtered = historyWeekFilter ? D.checklistHistory.filter(r=>r.week===historyWeekFilter) : D.checklistHistory;
  const tbody = document.getElementById('history-body');
  if(filtered.length===0){
    tbody.innerHTML='<tr><td colspan="12" style="padding:16px;text-align:center;color:var(--mid-gray)">Sin registros para mostrar</td></tr>';
    return;
  }
  const sorted = [...filtered].reverse();
    tbody.innerHTML = sorted.map(r=>{
    const realIdx = D.checklistHistory.indexOf(r);
    return `
    <tr>
      <td>${fmtDate(r.date)}</td>
      <td style="font-size:12px;color:var(--mid-gray)">${esc(r.week)}</td>
      <td>${esc(r.day)}</td>
      <td style="font-weight:500">${esc(r.zona)}</td>
      <td><span class="badge ${getBadge(r.actividad)}">${esc(r.actividad)}</span></td>
      <td style="font-size:12px;color:var(--mid-gray)">${r.obs&&r.obs!=='Observaciones'?esc(r.obs):'<span style="color:var(--light-gray)">—</span>'}</td>
      <td style="font-size:12px;font-weight:600;color:var(--charcoal)">${r.inicio||'<span style=\"color:var(--mid-gray)\">—</span>'}</td>
      <td style="font-size:12px;font-weight:600;color:var(--charcoal)">${r.fin||'<span style=\"color:var(--mid-gray)\">—</span>'}</td>
      <td style="text-align:center">${durBadge(r.inicio,r.fin,parseInt(r.ref)||0)}</td>
      <td><span class="responsable-tag">${esc(r.who)}</span></td>
      <td style="font-size:12px;color:var(--mid-gray)">${esc(r.hora)}</td>
      <td style="text-align:center">${r.img?`<button class="btn-icon" onclick="verFotoChecklist(${realIdx})" title="Ver foto del arreglo"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-2h5L16 7"/></svg></button>`:''}</td>
    </tr>`;}).join('');
}