// Separado de app.js. Lo que necesita de app.js llega por configurarJardineria():
//   JARDINEROS_LIST, JARD_TIPOS_ICON, TODAY_ISO, _setJardCurrentJardinero, _setJardineriaDataArr, addDaysISO, closeModal, fbSave, floristaNombre, getMonthVisits, habitacionesData, jardAlertas, jardCurrentJardinero, jardPlagas, jardRecordatorios, jardStockPlantas, jardStockProductos, jardineriaData, jardineroNombre, markJardDone, renderCtrlHab, renderCtrlJard, renderHome, renderRecordatoriosJard, userRole

import { showToast } from './tema-toast.js';
import { comprimirImagen } from './imagenes.js';
import { alertModal, confirmModal, promptModal } from './modales.js';
import { esc, fmtDate } from './utils.js';
import { icon } from './iconos.js';
import { calcDuracion, fmtDur } from './checklist.js';

let D = {};
export function configurarJardineria(deps){ D = deps; }


// ── RECORDATORIOS JARDINERÍA ─────────────────────────────────────────────────
window._setJardRecordatorios = (arr) => {
  D.jardRecordatorios.splice(0, D.jardRecordatorios.length, ...arr);
  // Aviso en vivo a operarios cuando gerencia agrega recordatorios
  renderJardRecAviso();
  notificarRecordatoriosNuevos();
};

window._setJardPlagas = (arr) => { D.jardPlagas.splice(0, D.jardPlagas.length, ...arr); };
window._setJardStockPlantas = (arr) => { D.jardStockPlantas.splice(0, D.jardStockPlantas.length, ...arr); };
window._setJardStockProductos = (arr) => { D.jardStockProductos.splice(0, D.jardStockProductos.length, ...arr); };

// ── ALERTAS URGENTES DE JARDÍN (foto) ─────────────────────────────────────────
// Gerencia carga una foto de algo del jardín que requiere atención urgente
// (zona + qué hacer). Les salta a los jardineros al instante como urgente.
const JARD_ALERTA_TIPOS = ['Poda','Riego','Fertilización','Desmalezado','Plaga','Limpieza','Otro'];
const JARD_ALERTA_ICON = { 'Poda':'','Riego':'','Fertilización':'','Desmalezado':'','Plaga':'','Limpieza':'','Otro':'' };

window._setJardAlertas = (arr) => {
  const prev = D.jardAlertas.length;
  D.jardAlertas.splice(0, D.jardAlertas.length, ...(Array.isArray(arr)?arr:Object.values(arr||{})));
  renderAlertasUrgentesJard();
  // Aviso a jardineros/combinados cuando entra una alerta nueva (no en la carga inicial)
  if(prev>0) notificarAlertasUrgentes();
};

function _alertasActivas(){ return D.jardAlertas.filter(a=>a && !a.resuelto); }

let _fotoAlertaData = '';
export function openAlertaJardinModal(){
  if(D.userRole!=='gerencia'){ showToast('Solo gerencia'); return; }
  _fotoAlertaData = '';
  const sel = document.getElementById('alerta-jard-tipo');
  if(sel) sel.innerHTML = JARD_ALERTA_TIPOS.map(t=>`<option value="${t}">${JARD_ALERTA_ICON[t]} ${t}</option>`).join('');
  document.getElementById('alerta-jard-zona').value = '';
  document.getElementById('alerta-jard-nota').value = '';
  document.getElementById('alerta-jard-file').value = '';
  const p = document.getElementById('alerta-jard-preview'); if(p){ p.src=''; p.style.display='none'; }
  document.getElementById('alerta-jard-modal').classList.add('open');
}

export function alertaJardFotoPreview(input){
  const file = input.files[0]; if(!file) return;
  comprimirImagen(file, 1000, 0.7, data => {
    _fotoAlertaData = data;
    const p = document.getElementById('alerta-jard-preview');
    if(p){ p.src = data; p.style.display = 'block'; }
  });
}

export function guardarAlertaJardin(){
  const zona = document.getElementById('alerta-jard-zona').value.trim();
  const tipo = document.getElementById('alerta-jard-tipo').value;
  const nota = document.getElementById('alerta-jard-nota').value.trim();
  if(!zona){ showToast('Indicá la zona'); return; }
  const alerta = { id: Date.now(), zona, tipo, nota, foto: _fotoAlertaData||'', creado: Date.now(), por: window.currentUserLabel||'Gerencia', resuelto: false };
  D.jardAlertas.unshift(alerta);
  D.fbSave('jardAlertas', D.jardAlertas);
  // Push real a jardineros (incluye combinados como Ivan)
  window.pushSend?.('Jardín URGENTE: '+tipo, `${zona}${nota?' — '+nota:''}`, 'jard-urgente', 'roles:jardinero');
  D.closeModal('alerta-jard-modal');
  renderAlertasUrgentesJard();
  showToast('Alerta enviada a los jardineros');
}

export async function resolverAlertaJardin(id){
  const a = D.jardAlertas.find(x=>x.id===id);
  if(!a) return;
  if(!await confirmModal(`¿Marcar como resuelta la alerta de ${a.tipo} en "${a.zona}"?`)) return;
  a.resuelto = true; a.resueltoPor = window.currentUserLabel||''; a.resueltoFecha = D.TODAY_ISO;
  D.fbSave('jardAlertas', D.jardAlertas);
  renderAlertasUrgentesJard();
  showToast('Alerta resuelta');
}

function _alertaAplica(){ return D.userRole==='jardinero' || D.userRole==='gerencia' || (D.userRole==='florista' && !!D.jardineroNombre); }

const _alertasAvisadas = new Set();
function notificarAlertasUrgentes(){
  if(!_alertaAplica() || D.userRole==='gerencia') return;
  _alertasActivas().forEach(a=>{
    if(_alertasAvisadas.has(a.id)) return;
    _alertasAvisadas.add(a.id);
    showToast(`Jardín urgente: ${a.tipo} en ${a.zona}`);
    if(typeof Notification!=='undefined' && Notification.permission==='granted'){
      try{ new Notification('Jardín URGENTE: '+a.tipo, { body:`${a.zona}${a.nota?' — '+a.nota:''}`, icon:'/icon-192.png', tag:'jard-urgente' }); }catch(e){}
    }
  });
}

export function renderAlertasUrgentesJard(){
  const activas = _alertasActivas();
  const esGerencia = D.userRole==='gerencia';
  const html = activas.length ? `
    <div class="jalert-wrap">
      <div class="jalert-hdr">${activas.length} ${activas.length===1?'atención urgente':'atenciones urgentes'} del jardín</div>
      ${activas.map(a=>`<div class="jalert-card">
        ${a.foto?`<img src="${a.foto}" class="jalert-foto" onclick="verFotoAlerta(${a.id})" alt="">`:''}
        <div class="jalert-body">
          <div class="jalert-tipo">${JARD_ALERTA_ICON[a.tipo]||''} ${esc(a.tipo)}</div>
          <div class="jalert-zona">${esc(a.zona)}</div>
          ${a.nota?`<div class="jalert-nota">${esc(a.nota)}</div>`:''}
          <div class="jalert-meta">Cargado por ${esc(a.por||'gerencia')}</div>
        </div>
        <button class="jalert-btn" onclick="resolverAlertaJardin(${a.id})">✓ Resuelto</button>
      </div>`).join('')}
    </div>` : (esGerencia ? '' : '');
  ['jops-alertas-urgentes','ctrl-jard-alertas'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
}

export function verFotoAlerta(id){
  const a = D.jardAlertas.find(x=>x.id===id);
  if(!a?.foto) return;
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer';
  ov.innerHTML=`<img src="${a.foto}" style="max-width:94vw;max-height:90vh;border-radius:12px">`;
  ov.onclick=()=>ov.remove();
  document.body.appendChild(ov);
}

// ── TABLA DE PLAGAS Y ENFERMEDADES ───────────────────────────────────────────
// Gerencia y jardineros pueden agregar, editar y registrar controles; eliminar es solo de gerencia.
// Cada fila tiene "volver a revisar cada N días" y un semáforo según el último control.
// Los tratamientos sugeridos son orientativos: la dosis siempre se confirma con la etiqueta del producto.
const PLAGAS_SUGERENCIAS = {
  'Cochinilla':        {t:'Jabón potásico o aceite de neem; retirar a mano las más visibles', c:7},
  'Pulgón':            {t:'Jabón potásico o aceite de neem; chorro de agua sobre los brotes', c:5},
  'Mosca blanca':      {t:'Aceite de neem o jabón potásico; trampas amarillas pegajosas', c:5},
  'Arañuela roja':     {t:'Aumentar humedad ambiente y pulverizar jabón potásico o aceite de neem', c:5},
  'Oídio (polvillo blanco)': {t:'Fungicida a base de azufre o bicarbonato; podar hojas muy afectadas', c:7},
  'Roya':              {t:'Retirar hojas afectadas y aplicar fungicida cúprico', c:7},
  'Hongos (manchas en hojas)': {t:'Retirar hojas afectadas, no mojar el follaje y aplicar fungicida cúprico', c:7},
  'Podredumbre de raíz': {t:'Reducir el riego, mejorar el drenaje y aplicar fungicida al suelo', c:7},
  'Hormigas':          {t:'Cebo para hormigas lejos de las plantas; controlar pulgones y cochinillas', c:7},
  'Caracoles y babosas': {t:'Cebo específico o trampas de cerveza; recolectar a la tarde', c:3},
  'Orugas':            {t:'Recolección manual o Bacillus thuringiensis', c:5},
  'Trips':             {t:'Trampas azules pegajosas y jabón potásico', c:5},
};
const PLAGAS_ESTADOS = {
  'Detectada':      'background:#fdecea;color:#b3261e',
  'En tratamiento': 'background:#fff4d6;color:#8a5a00',
  'Bajo control':   'background:#e3f1fb;color:#1b5e8a',
  'Resuelta':       'background:#e4f4e6;color:#2e7d32',
};
let plagasFiltroEstado = '';
let plagasFiltroTexto = '';

// Días hasta el próximo control: negativo = atrasado, null = sin fecha o ya resuelta
function plagaDiasParaControl(r){
  if(r.estado==='Resuelta') return null;
  if(!r.ultimo) return -1;
  const prox = D.addDaysISO(r.ultimo, parseInt(r.cada)||7);
  return Math.round((new Date(prox)-new Date(D.TODAY_ISO))/86400000);
}

function plagaSemaforo(r){
  const d = plagaDiasParaControl(r);
  if(d===null) return {txt:'Cerrada', st:'color:var(--mid-gray)', orden:3};
  if(d<0) return {txt: r.ultimo ? `Atrasada ${-d} d` : 'Sin controlar', st:'color:var(--red-alert);font-weight:600', orden:0};
  if(d<=2) return {txt: d===0?'Hoy':`En ${d} d`, st:'color:#A06A00;font-weight:600', orden:1};
  return {txt:`En ${d} d`, st:'color:#2e7d32', orden:2};
}

export function plagaFiltrar(){
  plagasFiltroEstado = document.getElementById('jplag-f-estado')?.value || '';
  plagasFiltroTexto  = (document.getElementById('jplag-f-texto')?.value || '').toLowerCase();
  renderPlagasJard();
}

export function renderPlagasJard(){
  const box = document.getElementById('jplag-tabla');
  if(!box) return;
  const puedeEditar = D.userRole==='gerencia' || D.userRole==='jardinero' || (D.userRole==='florista' && !!D.jardineroNombre);
  const puedeBorrar = D.userRole==='gerencia';
  const sem = D.jardPlagas.map(plagaSemaforo);
  const atrasadas = sem.filter(s=>s.orden===0).length;
  const proximas  = sem.filter(s=>s.orden===1).length;
  const activas   = D.jardPlagas.filter(r=>r.estado!=='Resuelta').length;
  const chip = (n,label,color) => `<div style="flex:1;min-width:120px;padding:10px 14px;border:1px solid var(--light-gray);border-left:3px solid ${color};border-radius:6px;background:#fff"><div style="font-size:22px;font-weight:600">${n}</div><div style="font-size:12px;color:var(--mid-gray)">${label}</div></div>`;
  const q = plagasFiltroTexto;
  const items = D.jardPlagas.map((r,i)=>({r,i,s:sem[i]}))
    .filter(x=>!plagasFiltroEstado || (x.r.estado||'Detectada')===plagasFiltroEstado)
    .filter(x=>!q || [x.r.planta,x.r.enfermedad,x.r.zona,x.r.tratamiento,x.r.quien].some(v=>(v||'').toLowerCase().includes(q)))
    .sort((a,b)=>a.s.orden-b.s.orden);
  const gravColor = {Alta:'var(--red-alert)', Media:'#A06A00', Leve:'var(--mid-gray)'};
  const filas = items.length ? items.map(({r,i,s})=>{
    const est = r.estado || 'Detectada';
    const hist = (r.historial||[]);
    const proxFecha = (r.estado!=='Resuelta' && r.ultimo) ? fmtDate(D.addDaysISO(r.ultimo, parseInt(r.cada)||7)) : '—';
    return `<tr>
      <td><strong>${esc(r.planta)}</strong>${r.zona?`<div style="font-size:12px;color:var(--mid-gray)">${esc(r.zona)}</div>`:''}</td>
      <td>${esc(r.enfermedad)}${r.gravedad?`<div style="font-size:12px;color:${gravColor[r.gravedad]||''}">Gravedad ${esc(r.gravedad)}</div>`:''}</td>
      <td>${esc(r.tratamiento)}</td>
      <td>${esc(r.dosis)}</td>
      <td><span style="padding:2px 8px;border-radius:10px;font-size:12px;white-space:nowrap;${PLAGAS_ESTADOS[est]||''}">${esc(est)}</span></td>
      <td>${r.ultimo?fmtDate(r.ultimo):'—'}</td>
      <td><span style="${s.st}">${esc(s.txt)}</span><div style="font-size:12px;color:var(--mid-gray)">${proxFecha}${r.cada?` · cada ${parseInt(r.cada)} d`:''}</div></td>
      <td>${esc(r.quien)}</td>
      <td style="max-width:240px;white-space:pre-wrap">${esc(r.obs)}${hist.length?`<div><a href="#" style="font-size:12px" onclick="verHistorialPlaga(${i});return false">Ver historial (${hist.length})</a></div>`:''}</td>
      <td style="white-space:nowrap">${puedeEditar?`<button class="btn-add" style="padding:4px 10px;font-size:12px" onclick="openControlPlaga(${i})">✓ Control</button> <button class="btn-icon" onclick="openPlagaJardModal(${i})" title="Editar"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>`:''}${puedeBorrar?`<button class="btn-icon" style="color:var(--red-alert)" onclick="deletePlagaJard(${i})" title="Eliminar">✕</button>`:''}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="10" style="text-align:center;color:var(--mid-gray);padding:24px">${D.jardPlagas.length?'Ningún control coincide con el filtro':'Todavía no hay controles cargados'}</td></tr>`;
  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <div class="section-title" style="margin:0">Plagas y enfermedades</div>
      ${puedeEditar?'<button class="btn-add" onclick="openPlagaJardModal(-1)">+ Nuevo control</button>':''}
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">
      ${chip(atrasadas,'Para revisar ya (atrasadas)','var(--red-alert)')}
      ${chip(proximas,'Se revisan hoy o en 2 días','#A06A00')}
      ${chip(activas,'Plagas activas','#1b5e8a')}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      <input type="text" class="ctrl-search" id="jplag-f-texto" placeholder="Buscar planta, plaga, zona..." value="${esc(plagasFiltroTexto)}" oninput="plagaFiltrar()" style="flex:1;min-width:180px">
      <select class="form-input" id="jplag-f-estado" onchange="plagaFiltrar()" style="width:170px;padding:6px 8px;font-size:12.5px">
        <option value="">Todos los estados</option>
        ${Object.keys(PLAGAS_ESTADOS).map(e=>`<option${plagasFiltroEstado===e?' selected':''}>${e}</option>`).join('')}
      </select>
    </div>
    <div class="table-wrapper">
      <table class="stock-table" style="min-width:1100px">
        <thead><tr>
          <th>Planta</th><th>Enfermedad</th><th>Tratamiento</th><th>Dosificación</th><th>Estado</th><th>Último control</th><th>Próximo control</th><th>Quién aplicó</th><th>Observación</th><th></th>
        </tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>`;
  // el input de búsqueda se vuelve a crear: devolverle el foco al escribir
  if(plagasFiltroTexto){ const t=document.getElementById('jplag-f-texto'); if(t && document.activeElement!==t){ t.focus(); t.setSelectionRange(t.value.length,t.value.length); } }
}

export function plagaSugerir(){
  const sel = PLAGAS_SUGERENCIAS[document.getElementById('jplag-enfermedad').value.trim()];
  const ayuda = document.getElementById('jplag-ayuda');
  if(!sel){ ayuda.textContent=''; return; }
  const trat = document.getElementById('jplag-tratamiento');
  if(!trat.value.trim()) trat.value = sel.t;
  document.getElementById('jplag-cada').value = sel.c;
  ayuda.textContent = 'Dosis: seguí siempre la etiqueta del producto que uses. Si no tiene, probá primero en una hoja y esperá 24 h.';
}

export function openPlagaJardModal(idx){
  const r = idx>=0 ? D.jardPlagas[idx] : null;
  document.getElementById('jplag-sugerencias').innerHTML = Object.keys(PLAGAS_SUGERENCIAS).map(k=>`<option value="${esc(k)}">`).join('');
  document.getElementById('jplag-modal-idx').value = idx;
  document.getElementById('jplag-planta').value = r?.planta || '';
  document.getElementById('jplag-zona').value = r?.zona || '';
  document.getElementById('jplag-gravedad').value = r?.gravedad || 'Leve';
  document.getElementById('jplag-enfermedad').value = r?.enfermedad || '';
  document.getElementById('jplag-tratamiento').value = r?.tratamiento || '';
  document.getElementById('jplag-dosis').value = r?.dosis || '';
  document.getElementById('jplag-estado').value = r?.estado || 'Detectada';
  document.getElementById('jplag-cada').value = r?.cada || 7;
  document.getElementById('jplag-ultimo').value = r?.ultimo || '';
  document.getElementById('jplag-quien').value = r ? (r.quien||'') : (D.jardineroNombre || '');
  document.getElementById('jplag-obs').value = r?.obs || '';
  document.getElementById('jplag-ayuda').textContent = '';
  document.getElementById('jplag-modal-title').textContent = r ? 'Editar control' : 'Nuevo control';
  document.getElementById('jplag-modal').classList.add('open');
}

export function savePlagaJard(){
  const idx = parseInt(document.getElementById('jplag-modal-idx').value);
  const v = id => document.getElementById(id).value.trim();
  const rec = {
    planta: v('jplag-planta'),
    zona: v('jplag-zona'),
    gravedad: v('jplag-gravedad'),
    enfermedad: v('jplag-enfermedad'),
    tratamiento: v('jplag-tratamiento'),
    dosis: v('jplag-dosis'),
    estado: v('jplag-estado'),
    cada: Math.min(365, Math.max(1, parseInt(v('jplag-cada'))||7)),
    ultimo: document.getElementById('jplag-ultimo').value || null,
    quien: v('jplag-quien'),
    obs: v('jplag-obs'),
  };
  if(!rec.planta){ showToast('Poné el nombre de la planta'); return; }
  if(idx>=0){ rec.historial = D.jardPlagas[idx].historial || []; D.jardPlagas[idx]=rec; }
  else { rec.historial = []; D.jardPlagas.push(rec); }
  D.fbSave('jardPlagas', D.jardPlagas);
  D.closeModal('jplag-modal');
  renderPlagasJard();
}

// Registrar que se revisó/aplicó hoy: actualiza último control y deja constancia en el historial
export function openControlPlaga(idx){
  const r = D.jardPlagas[idx];
  document.getElementById('jplag-ctl-idx').value = idx;
  document.getElementById('jplag-ctl-sub').textContent = `${r.planta} · ${r.enfermedad||'sin enfermedad indicada'}`;
  document.getElementById('jplag-ctl-fecha').value = D.TODAY_ISO;
  document.getElementById('jplag-ctl-quien').value = D.jardineroNombre || r.quien || '';
  document.getElementById('jplag-ctl-estado').value = r.estado || 'Detectada';
  document.getElementById('jplag-ctl-obs').value = '';
  document.getElementById('jplag-ctl-modal').classList.add('open');
}

export function saveControlPlaga(){
  const idx = parseInt(document.getElementById('jplag-ctl-idx').value);
  const r = D.jardPlagas[idx];
  if(!r) return;
  const fecha = document.getElementById('jplag-ctl-fecha').value || D.TODAY_ISO;
  const quien = document.getElementById('jplag-ctl-quien').value.trim();
  const estado = document.getElementById('jplag-ctl-estado').value;
  const obs = document.getElementById('jplag-ctl-obs').value.trim();
  r.historial = r.historial || [];
  r.historial.push({fecha, quien, estado, obs});
  if(!r.ultimo || fecha>=r.ultimo){
    r.ultimo = fecha; r.quien = quien; r.estado = estado;
    if(obs) r.obs = obs;
  }
  D.fbSave('jardPlagas', D.jardPlagas);
  D.closeModal('jplag-ctl-modal');
  renderPlagasJard();
  showToast('Control registrado');
}

export function verHistorialPlaga(idx){
  const r = D.jardPlagas[idx];
  const filas = (r.historial||[]).slice().reverse().map(h=>`${fmtDate(h.fecha)} · ${h.estado||''}${h.quien?' · '+h.quien:''}${h.obs?'\n   '+h.obs:''}`).join('\n');
  alertModal(`Historial de ${r.planta}\n\n${filas}`);
}

export async function deletePlagaJard(idx){
  if(D.userRole !== 'gerencia'){ showToast('Solo gerencia puede eliminar'); return; }
  if(!await confirmModal('¿Eliminar este control?')) return;
  D.jardPlagas.splice(idx,1);
  D.fbSave('jardPlagas', D.jardPlagas);
  renderPlagasJard();
}

// ── STOCK DE JARDÍN: PLANTAS DE REEMPLAZO Y FERTILIZANTES / FITOSANITARIOS ───
// Gerencia y jardineros cargan y editan; eliminar es solo de gerencia.
// Cuando la cantidad llega al mínimo avisado, la fila se marca en rojo.
const STOCK_JARD_CFG = {
  plantas: {
    titulo:'Plantas para reemplazo', nuevo:'+ Nueva planta', vacio:'Todavía no hay plantas cargadas', clave:'jardStockPlantas',
    campos:[
      {k:'nombre', l:'Planta', req:true, max:120},
      {k:'ubicacion', l:'Dónde está', max:80, ph:'ej. Vivero, patio de servicio'},
      {k:'cantidad', l:'Cantidad', num:true},
      {k:'minimo', l:'Avisar si quedan', num:true},
      {k:'tamano', l:'Tamaño / maceta', max:80, ph:'ej. maceta 20'},
      {k:'obs', l:'Observación', area:true, max:500},
    ],
  },
  productos: {
    titulo:'Fertilizantes y fitosanitarios', nuevo:'+ Nuevo producto', vacio:'Todavía no hay productos cargados', clave:'jardStockProductos',
    campos:[
      {k:'nombre', l:'Producto', req:true, max:120},
      {k:'tipo', l:'Tipo', opts:['Fertilizante','Fitosanitario','Otro']},
      {k:'cantidad', l:'Cantidad', num:true},
      {k:'unidad', l:'Unidad', max:20, ph:'ej. litros, kg, envases'},
      {k:'minimo', l:'Avisar si quedan', num:true},
      {k:'vence', l:'Vencimiento', date:true},
      {k:'obs', l:'Observación', area:true, max:500},
    ],
  },
};
const stockJardLista = t => t==='plantas' ? D.jardStockPlantas : D.jardStockProductos;
let stockJardFiltro = {plantas:'', productos:''};

export function stockJardFiltrar(t){
  stockJardFiltro[t] = (document.getElementById('jstock-f-'+t)?.value || '').toLowerCase();
  renderStockJard();
}

export function renderStockJard(){
  const box = document.getElementById('jstock-tablas');
  if(!box) return;
  const puedeEditar = D.userRole==='gerencia' || D.userRole==='jardinero' || (D.userRole==='florista' && !!D.jardineroNombre);
  const puedeBorrar = D.userRole==='gerencia';
  const lapiz = '<svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg>';
  const bloque = t => {
    const cfg = STOCK_JARD_CFG[t];
    const lista = stockJardLista(t);
    const q = stockJardFiltro[t];
    const bajo = r => r.minimo!=='' && r.minimo!=null && r.cantidad!=='' && r.cantidad!=null && Number(r.cantidad) <= Number(r.minimo);
    const vencido = r => t==='productos' && r.vence && r.vence < D.TODAY_ISO;
    const nBajos = lista.filter(bajo).length;
    const items = lista.map((r,i)=>({r,i})).filter(x=>!q || [x.r.nombre,x.r.ubicacion,x.r.tipo,x.r.tamano,x.r.obs].some(v=>(v||'').toLowerCase().includes(q)));
    const heads = t==='plantas'
      ? ['Planta','Dónde está','Tamaño','Cantidad','Mínimo','Observación']
      : ['Producto','Tipo','Cantidad','Mínimo','Vencimiento','Observación'];
    const filas = items.length ? items.map(({r,i})=>{
      const rojo = bajo(r) ? 'background:#fdecea' : '';
      const cant = `<strong style="${bajo(r)?'color:var(--red-alert)':''}">${esc(String(r.cantidad??''))}${t==='productos'&&r.unidad?' '+esc(r.unidad):''}</strong>${bajo(r)?'<div style="font-size:12px;color:var(--red-alert)">Hay que reponer</div>':''}`;
      const min = r.minimo!==''&&r.minimo!=null ? esc(String(r.minimo)) : '—';
      const celdas = t==='plantas'
        ? `<td><strong>${esc(r.nombre)}</strong></td><td>${esc(r.ubicacion)}</td><td>${esc(r.tamano)}</td><td>${cant}</td><td>${min}</td>`
        : `<td><strong>${esc(r.nombre)}</strong></td><td>${esc(r.tipo)}</td><td>${cant}</td><td>${min}</td><td>${r.vence?`<span style="${vencido(r)?'color:var(--red-alert);font-weight:600':''}">${fmtDate(r.vence)}${vencido(r)?' (vencido)':''}</span>`:'—'}</td>`;
      return `<tr style="${rojo}">${celdas}<td style="max-width:240px;white-space:pre-wrap">${esc(r.obs)}</td>
        <td style="white-space:nowrap">${puedeEditar?`<button class="btn-icon" onclick="openStockJardModal('${t}',${i})" title="Editar">${lapiz}</button>`:''}${puedeBorrar?`<button class="btn-icon" style="color:var(--red-alert)" onclick="deleteStockJard('${t}',${i})" title="Eliminar">✕</button>`:''}</td></tr>`;
    }).join('') : `<tr><td colspan="7" style="text-align:center;color:var(--mid-gray);padding:24px">${lista.length?'Nada coincide con la búsqueda':cfg.vacio}</td></tr>`;
    return `<div style="margin-top:32px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div class="section-title" style="margin:0">${cfg.titulo}${nBajos?` <span style="font-size:12px;font-weight:600;color:var(--red-alert)">· ${nBajos} para reponer</span>`:''}</div>
        ${puedeEditar?`<button class="btn-add" onclick="openStockJardModal('${t}',-1)">${cfg.nuevo}</button>`:''}
      </div>
      <input type="text" class="ctrl-search" id="jstock-f-${t}" placeholder="Buscar..." value="${esc(q)}" oninput="stockJardFiltrar('${t}')" style="margin-bottom:12px;max-width:320px">
      <div class="table-wrapper"><table class="stock-table" style="min-width:760px">
        <thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}<th></th></tr></thead>
        <tbody>${filas}</tbody>
      </table></div>
    </div>`;
  };
  const activo = document.activeElement?.id || '';
  box.innerHTML = bloque('plantas') + bloque('productos');
  if(activo.startsWith('jstock-f-')){ const t=document.getElementById(activo); if(t){ t.focus(); t.setSelectionRange(t.value.length,t.value.length); } }
}

export function openStockJardModal(t, idx){
  const cfg = STOCK_JARD_CFG[t];
  const r = idx>=0 ? stockJardLista(t)[idx] : null;
  document.getElementById('jstock-tipo').value = t;
  document.getElementById('jstock-idx').value = idx;
  document.getElementById('jstock-modal-title').textContent = (r?'Editar ':'Nuevo ') + (t==='plantas'?'planta':'producto');
  document.getElementById('jstock-campos').innerHTML = cfg.campos.map(c=>{
    const val = r?.[c.k] ?? (c.opts?c.opts[0]:'');
    const id = 'jstock-c-'+c.k;
    const input = c.opts ? `<select class="form-input-modal" id="${id}">${c.opts.map(o=>`<option${o===val?' selected':''}>${o}</option>`).join('')}</select>`
      : c.area ? `<textarea class="form-input-modal" id="${id}" rows="3" maxlength="${c.max}">${esc(String(val))}</textarea>`
      : c.num ? `<input type="number" class="form-input-modal" id="${id}" min="0" step="any" value="${esc(String(val))}">`
      : c.date ? `<input type="date" class="form-input-modal" id="${id}" value="${esc(String(val))}">`
      : `<input type="text" class="form-input-modal" id="${id}" maxlength="${c.max}" value="${esc(String(val))}"${c.ph?` placeholder="${esc(c.ph)}"`:''}>`;
    return `<div class="form-group"><label class="form-label">${c.l}</label>${input}</div>`;
  }).join('');
  document.getElementById('jstock-modal').classList.add('open');
}

export function saveStockJard(){
  const t = document.getElementById('jstock-tipo').value;
  const idx = parseInt(document.getElementById('jstock-idx').value);
  const cfg = STOCK_JARD_CFG[t];
  const rec = {};
  cfg.campos.forEach(c=>{
    const v = document.getElementById('jstock-c-'+c.k).value.trim();
    rec[c.k] = c.num ? (v===''?'':Math.max(0, parseFloat(v)||0)) : v;
  });
  if(!rec.nombre){ showToast('Poné el nombre'); return; }
  const lista = stockJardLista(t);
  if(idx>=0) lista[idx]=rec; else lista.push(rec);
  D.fbSave(cfg.clave, lista);
  D.closeModal('jstock-modal');
  renderStockJard();
}

export async function deleteStockJard(t, idx){
  if(D.userRole !== 'gerencia'){ showToast('Solo gerencia puede eliminar'); return; }
  if(!await confirmModal('¿Eliminar esta fila?')) return;
  const lista = stockJardLista(t);
  lista.splice(idx,1);
  D.fbSave(STOCK_JARD_CFG[t].clave, lista);
  renderStockJard();
}

export function marcarRecordatorioHecho(idx){
  D.jardRecordatorios[idx].ultimaVez = D.TODAY_ISO;
  D.fbSave('jardRecordatorios', D.jardRecordatorios);
  D.renderRecordatoriosJard();
  D.renderHome();
  showToast('Marcado como hecho hoy');
}

export function openRecordatorioModal(idx){
  const rec = idx>=0 ? D.jardRecordatorios[idx] : null;
  document.getElementById('jrec-modal-idx').value = idx;
  document.getElementById('jrec-modal-tipo').value = rec?.tipo || 'Riego';
  document.getElementById('jrec-modal-frecuencia').value = rec?.frecuencia || 7;
  document.getElementById('jrec-modal-ultima').value = rec?.ultimaVez || '';
  // Build task picker
  const sel = document.getElementById('jrec-modal-task');
  const groups = {};
  D.jardineriaData.forEach(t => {
    const k = `${t.section} · ${t.group}`;
    if(!groups[k]) groups[k] = [];
    groups[k].push(t);
  });
  sel.innerHTML = Object.entries(groups).map(([grp,tasks])=>
    `<optgroup label="${esc(grp)}">${tasks.map(t=>`<option value="${esc(t.task)}" data-section="${esc(t.section)}" data-group="${esc(t.group)}"${rec?.task===t.task&&rec?.group===t.group?' selected':''}>${esc(t.task)}</option>`).join('')}</optgroup>`
  ).join('');
  document.getElementById('jrec-modal-title').textContent = rec ? 'Editar Recordatorio' : 'Nuevo Recordatorio';
  document.getElementById('jrec-modal').classList.add('open');
}

export function saveRecordatorio(){
  const idx = parseInt(document.getElementById('jrec-modal-idx').value);
  const sel = document.getElementById('jrec-modal-task');
  const opt = sel.options[sel.selectedIndex];
  const rec = {
    task: opt.value,
    section: opt.dataset.section,
    group: opt.dataset.group,
    tipo: document.getElementById('jrec-modal-tipo').value,
    frecuencia: parseInt(document.getElementById('jrec-modal-frecuencia').value)||7,
    ultimaVez: document.getElementById('jrec-modal-ultima').value || null,
  };
  // Timestamp de creación: los operarios lo usan para detectar recordatorios nuevos
  if(idx>=0){ rec.creado = D.jardRecordatorios[idx].creado || null; D.jardRecordatorios[idx]=rec; }
  else { rec.creado = Date.now(); D.jardRecordatorios.push(rec); }
  D.fbSave('jardRecordatorios', D.jardRecordatorios);
  // Push real a los jardineros cuando gerencia agrega un recordatorio
  if(idx<0) window.pushSend?.('Recordatorio nuevo de jardinería', `${rec.tipo} · ${rec.task}`, 'jard-rec', 'roles:jardinero');
  D.closeModal('jrec-modal');
  D.renderRecordatoriosJard();
}

export async function deleteRecordatorio(idx){
  if(D.userRole !== 'gerencia'){ showToast('Solo gerencia puede eliminar recordatorios'); return; }
  if(!await confirmModal('¿Eliminar este recordatorio?')) return;
  D.jardRecordatorios.splice(idx,1);
  D.fbSave('jardRecordatorios', D.jardRecordatorios);
  D.renderRecordatoriosJard();
  renderJardRecAviso();
}

// ── Aviso de recordatorios nuevos a operarios de jardinería ──────────────────
// Los recordatorios que crea gerencia llevan timestamp `creado`. Cada
// dispositivo guarda en localStorage hasta cuándo los vio; todo lo posterior
// cuenta como "nuevo" y dispara badge, cartel en el panel general y toast.
function _avisosRecAplica(){
  return D.userRole==='jardinero' || (D.userRole==='florista' && !!D.jardineroNombre);
}

export function getRecordatoriosNuevos(){
  if(!_avisosRecAplica()) return [];
  let visto=0;
  try{ visto=parseInt(localStorage.getItem('jardRecVisto')||'0',10)||0; }catch(e){}
  return D.jardRecordatorios.filter(r=>r.creado && r.creado>visto);
}

export function marcarRecordatoriosVistos(){
  try{ localStorage.setItem('jardRecVisto', String(Date.now())); }catch(e){}
  renderJardRecAviso();
}

export function renderJardRecAviso(){
  const nuevos=getRecordatoriosNuevos();
  // Punto rojo en la barra inferior mobile (item Avisos )
  document.querySelectorAll('.bottom-nav-item[data-page="recordatorios-jardineria"]').forEach(el=>{
    el.querySelector('.bottom-nav-badge')?.remove();
    if(nuevos.length) el.insertAdjacentHTML('beforeend',`<span class="bottom-nav-badge">${nuevos.length>9?'9+':nuevos.length}</span>`);
  });
  // Punto rojo en el menú lateral (Recordatorios Jardín)
  const navItem=document.getElementById('nav-rec-jard');
  if(navItem){
    navItem.querySelector('.nav-alert-dot')?.remove();
    if(nuevos.length) navItem.insertAdjacentHTML('beforeend','<span class="nav-alert-dot"></span>');
  }
  // Cartel en los paneles generales (Tareas Jardinería e Inicio)
  const detalle=nuevos.slice(0,3).map(r=>`${D.JARD_TIPOS_ICON[r.tipo]||''} ${r.tipo} · ${r.task}`).join('  ·  ');
  const html=nuevos.length ? `<div class="jrec-aviso-banner" onclick="navigate('recordatorios-jardineria')">
      <span class="jrec-aviso-icon"></span>
      <span><strong>${nuevos.length===1?'Gerencia agregó un recordatorio nuevo':'Gerencia agregó '+nuevos.length+' recordatorios nuevos'}:</strong> ${esc(detalle)}${nuevos.length>3?' …':''}</span>
      <span class="jrec-aviso-cta">Ver →</span>
    </div>` : '';
  ['jops-aviso-rec','home-aviso-rec'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
}

// Toast (y notificación del navegador si hay permiso) una sola vez por sesión
const _recAvisados=new Set();
export function notificarRecordatoriosNuevos(){
  const sinAvisar=getRecordatoriosNuevos().filter(r=>!_recAvisados.has(r.creado));
  if(!sinAvisar.length) return;
  sinAvisar.forEach(r=>_recAvisados.add(r.creado));
  const msg = sinAvisar.length===1
    ? `Gerencia agregó un recordatorio de jardinería: ${sinAvisar[0].tipo} · ${sinAvisar[0].task}`
    : `Gerencia agregó ${sinAvisar.length} recordatorios de jardinería`;
  showToast(''+msg);
  if(typeof Notification!=='undefined' && Notification.permission==='granted'){
    try{ new Notification('Recordatorios de jardinería', { body:msg, icon:'/icon-192.png', tag:'jard-rec' }); }catch(e){}
  }
}
export let zonaHorasData = {};   // key: section+'|||'+group → {inicio:'', fin:'', fecha:''}
let _jopsZones = [];      // zonas renderizadas en orden, para referencias por índice

export function daysSince(isoDate){
  if(!isoDate) return null;
  const ms=new Date(D.TODAY_ISO)-new Date(isoDate);
  return Math.floor(ms/86400000);
}

// Texto "hace X días" desde la última visita (sin color de umbral)
export function _diasDesdeTxt(isoDate){
  const d = daysSince(isoDate);
  if(d===null || d===undefined) return '';
  if(d<=0) return 'hoy';
  return d===1 ? 'hace 1 día' : `hace ${d} días`;
}

// Umbrales de urgencia configurables por gerencia (regulables por estación).
// okMax: hasta N días = Al día · warnMax: hasta N días = Próxima · más allá = Urgente
let urgenciaConfig = { okMax:3, warnMax:7 };
window._setUrgenciaConfig = v => { urgenciaConfig = v; };
const URGENCIA_PRESETS = {
  verano:   { okMax:2, warnMax:4 },
  primavera:{ okMax:3, warnMax:6 },
  otono:    { okMax:4, warnMax:8 },
  invierno: { okMax:6, warnMax:12 },
};
// ── UMBRALES DE URGENCIA (config gerencia) ──────────────
export function urgenciaPanelHTML(scope){
  if(D.userRole!=='gerencia') return '';
  const ok = urgenciaConfig.okMax ?? 3, warn = urgenciaConfig.warnMax ?? 7;
  return `
  <div style="background:#FFFFFF;border:1px solid var(--light-gray);border-radius:12px;padding:14px 16px;margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
      <div style="font-size:12.5px;font-weight:700;color:var(--charcoal);letter-spacing:.3px">
        Umbrales de urgencia <span style="font-weight:400;color:var(--mid-gray)">· ajustá según la estación (en verano se riega más seguido)</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn-secondary" style="font-size:12px;padding:5px 10px" onclick="setUrgenciaPreset('verano')">Verano</button>
        <button class="btn-secondary" style="font-size:12px;padding:5px 10px" onclick="setUrgenciaPreset('primavera')">Primavera</button>
        <button class="btn-secondary" style="font-size:12px;padding:5px 10px" onclick="setUrgenciaPreset('otono')">Otoño</button>
        <button class="btn-secondary" style="font-size:12px;padding:5px 10px" onclick="setUrgenciaPreset('invierno')">Invierno</button>
      </div>
    </div>
    <div style="display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap;margin-top:12px">
      <label style="font-size:12px;color:var(--mid-gray)">Al día hasta (días)
        <input type="number" min="1" max="60" id="urg-ok-${scope}" value="${ok}"
          class="form-input" style="width:90px;padding:6px 8px;font-size:13px;margin-top:4px;display:block">
      </label>
      <label style="font-size:12px;color:var(--mid-gray)">Próxima hasta (días)
        <input type="number" min="2" max="90" id="urg-warn-${scope}" value="${warn}"
          class="form-input" style="width:90px;padding:6px 8px;font-size:13px;margin-top:4px;display:block">
      </label>
      <div style="font-size:12px;color:#B0AFA5;padding-bottom:8px">Urgente: más de <strong id="urg-preview-${scope}">${warn}</strong> días</div>
      <button class="btn-add" style="padding:7px 14px" onclick="saveUrgenciaConfig('${scope}')">Guardar umbrales</button>
    </div>
  </div>`;
}
export function setUrgenciaPreset(season){
  const p = URGENCIA_PRESETS[season]; if(!p) return;
  ['jard','hab'].forEach(s=>{
    const okI=document.getElementById('urg-ok-'+s), wI=document.getElementById('urg-warn-'+s), pv=document.getElementById('urg-preview-'+s);
    if(okI) okI.value=p.okMax; if(wI) wI.value=p.warnMax; if(pv) pv.textContent=p.warnMax;
  });
  urgenciaConfig = { okMax:p.okMax, warnMax:p.warnMax };
  D.fbSave('urgenciaConfig', urgenciaConfig);
  showToast('Umbrales de '+season+' aplicados');
  D.renderCtrlJard?.(); D.renderCtrlHab?.();
}
export function saveUrgenciaConfig(scope){
  if(D.userRole!=='gerencia'){ showToast('Solo gerencia'); return; }
  const okV = parseInt(document.getElementById('urg-ok-'+scope)?.value,10);
  const wV  = parseInt(document.getElementById('urg-warn-'+scope)?.value,10);
  if(isNaN(okV)||isNaN(wV)||okV<1||wV<=okV){ showToast('"Próxima" debe ser mayor que "Al día"'); return; }
  urgenciaConfig = { okMax:okV, warnMax:wV };
  D.fbSave('urgenciaConfig', urgenciaConfig);
  showToast('Umbrales guardados');
  D.renderCtrlJard?.(); D.renderCtrlHab?.();
}

// ── EDITAR FECHA de última visita (solo gerencia) ──────
export function gerenciaSetFecha(tipo, idx, nuevaFecha){
  if(D.userRole!=='gerencia') return;
  if(!nuevaFecha) return;
  const arr = tipo==='jard' ? D.jardineriaData : D.habitacionesData;
  const r = arr[idx]; if(!r) return;
  r.last = nuevaFecha;
  if(tipo==='jard'){ D.fbSave('jardineriaData', D.jardineriaData); D.renderCtrlJard(); }
  else { D.fbSave('habitacionesData', D.habitacionesData); D.renderCtrlHab(); }
  showToast('Fecha actualizada');
}

export function getDaysBadge(days){
  const ok = urgenciaConfig.okMax ?? 3;
  const warn = urgenciaConfig.warnMax ?? 7;
  if(days===null||days===undefined) return {cls:'days-none',label:'Sin datos',bar:0,barCls:'background:var(--mid-gray)',status:'none'};
  if(days<=ok)   return {cls:'days-ok',  label:days+'d',bar:Math.min(100,days/(warn||7)*100), barCls:'background:var(--green-ok)',status:'ok'};
  if(days<=warn) return {cls:'days-warn',label:days+'d',bar:Math.min(100,days/(warn*2||14)*100),barCls:'background:var(--amber)',    status:'warn'};
  return          {cls:'days-alert',     label:days+'d',bar:100,                       barCls:'background:var(--red-alert)',status:'alert'};
}

export function getSectionEmoji(sec){
  if(sec==='Palacio') return '';
  if(sec==='Jardín Central') return '';
  if(sec==='Edificio Posadas') return '';
  return '';
}
export function getSectionPillCls(sec){
  if(sec==='Palacio') return 'sec-palacio';
  if(sec==='Jardín Central') return 'sec-jardin';
  return 'sec-posadas';
}

// ── JARDINERÍA ──────────────────────────
export function initCtrlJard(){}

export function zonaSetHora(idx, campo){
  const z = _jopsZones[idx]; if(!z) return;
  const key = z.section+'|||'+z.group;
  if(!zonaHorasData[key]) zonaHorasData[key]={inicio:'',fin:'',fecha:''};
  const now = new Date();
  const hora = now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  zonaHorasData[key][campo] = hora;
  zonaHorasData[key].fecha = D.TODAY_ISO;
  D.fbSave('zonaHorasData', zonaHorasData);
  renderJardOps();
}
export function zonaResetHora(idx, campo){
  const z = _jopsZones[idx]; if(!z) return;
  const key = z.section+'|||'+z.group;
  if(zonaHorasData[key]) zonaHorasData[key][campo]='';
  D.fbSave('zonaHorasData', zonaHorasData);
  renderJardOps();
}
export function zonaHoraBtn(idx, campo, zh){
  const val = (zh&&zh[campo])||'';
  if(val){
    const color = campo==='horaInicio'?'#2C4A3E':'#8B3A3A';
    const bg    = campo==='horaInicio'?'#EBF5E8':'#FDF0F0';
    return `<span style="font-size:13px;font-weight:700;color:${color};background:${bg};padding:3px 10px;border-radius:8px;display:inline-block">${val}</span>`;
  }
  const label = campo==='horaInicio'?icon('play')+'Inicio':icon('stop')+'Fin';
  const cls   = campo==='horaInicio'?'btn-hora-inicio':'btn-hora-fin';
  return `<button class="${cls}" onclick="event.stopPropagation();zonaSetHora(${idx},'${campo}')">${label}</button>`;
}

let jopsFilter = 'all';
export function setJopsFilter(mode){
  jopsFilter = mode;
  ['all','plan','alert','warn','ok'].forEach(m=>{
    const btn = document.getElementById('jops-btn-'+m);
    if(btn) btn.classList.toggle('active', m===mode);
  });
  renderJardOps();
}

// ══ PLAN DEL DÍA + GESTIÓN DE TAREAS (jardinería) ═══════════════════════════
// Plan del día: gerencia marca qué tareas se hacen hoy → { iso: { taskKey: true } }
let jardPlanDia = {};
window._setJardPlanDia = v => { jardPlanDia = v || {}; };
function jardTaskKey(r){ return (r.section||'')+'|||'+(r.group||'')+'|||'+(r.task||''); }
function jardEnPlanHoy(r){ return !!(jardPlanDia[D.TODAY_ISO] && jardPlanDia[D.TODAY_ISO][jardTaskKey(r)]); }
function jardHayPlanHoy(){ return !!(jardPlanDia[D.TODAY_ISO] && Object.keys(jardPlanDia[D.TODAY_ISO]).length); }

export function jardTogglePlanHoy(i){
  if(D.userRole!=='gerencia') return;
  const r = D.jardineriaData[i]; if(!r) return;
  const k = jardTaskKey(r);
  if(!jardPlanDia[D.TODAY_ISO]) jardPlanDia[D.TODAY_ISO] = {};
  if(jardPlanDia[D.TODAY_ISO][k]) delete jardPlanDia[D.TODAY_ISO][k];
  else jardPlanDia[D.TODAY_ISO][k] = true;
  if(!Object.keys(jardPlanDia[D.TODAY_ISO]).length) delete jardPlanDia[D.TODAY_ISO];
  D.fbSave('jardPlanDia', jardPlanDia);
  renderJardOps();
}

// ── Gestión de la lista de tareas de jardinería (solo gerencia) ──
function _saveJardineria(){ window._jardDataLastSave = Date.now(); D.fbSave('jardineriaData', D.jardineriaData); }

export async function jardAddTarea(section, group){
  if(D.userRole!=='gerencia') return;
  const nombre = await promptModal('Nombre de la nueva tarea / planta:', {title:'Agregar tarea'});
  if(!nombre || !nombre.trim()) return;
  let idx = D.jardineriaData.length;
  for(let i=D.jardineriaData.length-1;i>=0;i--){ if(D.jardineriaData[i].section===section && D.jardineriaData[i].group===group){ idx=i+1; break; } }
  D.jardineriaData.splice(idx, 0, {section, group, task:nombre.trim(), last:null, liveVisits:0, monthlyVisits:{}, obs:'', quien:'', horaInicio:'', horaFin:'', canUndo:false});
  _saveJardineria();
  renderJardOps();
  openGestionTareasJard();
  showToast(`Tarea "${nombre.trim()}" agregada`);
}

export async function jardRenameTarea(i){
  if(D.userRole!=='gerencia') return;
  const r = D.jardineriaData[i]; if(!r) return;
  const nuevo = await promptModal('Nuevo nombre de la tarea:', {title:'Renombrar tarea', default:r.task});
  if(!nuevo || !nuevo.trim() || nuevo.trim()===r.task) return;
  const kOld = jardTaskKey(r);
  r.task = nuevo.trim();
  const kNew = jardTaskKey(r);
  Object.keys(jardPlanDia).forEach(iso=>{ if(jardPlanDia[iso][kOld]){ delete jardPlanDia[iso][kOld]; jardPlanDia[iso][kNew]=true; } });
  D.fbSave('jardPlanDia', jardPlanDia);
  _saveJardineria();
  renderJardOps();
  openGestionTareasJard();
  showToast('Tarea renombrada');
}

export async function jardDeleteTarea(i){
  if(D.userRole!=='gerencia') return;
  const r = D.jardineriaData[i]; if(!r) return;
  if(!await confirmModal(`¿Eliminar la tarea "${r.task}" de ${r.group}?`)) return;
  const k = jardTaskKey(r);
  D.jardineriaData.splice(i,1);
  Object.keys(jardPlanDia).forEach(iso=>{ if(jardPlanDia[iso][k]) delete jardPlanDia[iso][k]; });
  D.fbSave('jardPlanDia', jardPlanDia);
  _saveJardineria();
  renderJardOps();
  openGestionTareasJard();
  showToast('Tarea eliminada');
}

export async function jardAddGrupo(section){
  if(D.userRole!=='gerencia') return;
  const g = await promptModal('Nombre del nuevo grupo / zona:', {title:'Agregar grupo'});
  if(!g || !g.trim()) return;
  const t = await promptModal('Primera tarea / planta del grupo:', {title:'Agregar grupo'});
  if(!t || !t.trim()) return;
  D.jardineriaData.push({section, group:g.trim(), task:t.trim(), last:null, liveVisits:0, monthlyVisits:{}, obs:'', quien:'', horaInicio:'', horaFin:'', canUndo:false});
  _saveJardineria();
  openGestionTareasJard();
  showToast(`Grupo "${g.trim()}" agregado`);
}

export async function jardAddSeccion(){
  if(D.userRole!=='gerencia') return;
  const s = await promptModal('Nombre de la nueva sección / zona (ej. Palacio):', {title:'Agregar sección'});
  if(!s || !s.trim()) return;
  const g = await promptModal('Primer grupo de la sección:', {title:'Agregar sección'});
  if(!g || !g.trim()) return;
  const t = await promptModal('Primera tarea del grupo:', {title:'Agregar sección'});
  if(!t || !t.trim()) return;
  D.jardineriaData.push({section:s.trim(), group:g.trim(), task:t.trim(), last:null, liveVisits:0, monthlyVisits:{}, obs:'', quien:'', horaInicio:'', horaFin:'', canUndo:false});
  _saveJardineria();
  openGestionTareasJard();
  showToast(`Sección "${s.trim()}" creada`);
}

// Al renombrar o borrar zonas, se arrastran las horas y el plan del día que estaban guardados con el nombre viejo
function _jardMoverClaves(fn){
  Object.keys(jardPlanDia).forEach(iso=>{
    Object.keys(jardPlanDia[iso]).forEach(k=>{
      const nk = fn(k.split('|||'));
      if(nk===k) return;
      delete jardPlanDia[iso][k];
      if(nk) jardPlanDia[iso][nk]=true;
    });
    if(!Object.keys(jardPlanDia[iso]).length) delete jardPlanDia[iso];
  });
  D.fbSave('jardPlanDia', jardPlanDia);
}
function _jardMoverHoras(secOld, grpOld, secNew, grpNew){
  const ko = secOld+'|||'+grpOld;
  if(!zonaHorasData[ko]) return;
  if(secNew!==null) zonaHorasData[secNew+'|||'+grpNew] = zonaHorasData[ko];
  delete zonaHorasData[ko];
  D.fbSave('zonaHorasData', zonaHorasData);
}
export function _jardPoblarSecciones(){
  const sel = document.getElementById('ctrl-jard-section');
  if(!sel) return;
  const cur = sel.value;
  const secs = [...new Set(D.jardineriaData.map(r=>r.section))];
  sel.innerHTML = '<option value="">Todas las secciones</option>' + secs.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  sel.value = secs.includes(cur) ? cur : '';
}
function _jardRefrescarVistas(){
  D.renderCtrlJard?.();
  renderJardOps?.();
}

export async function jardRenameGrupo(section, group){
  if(D.userRole!=='gerencia') return;
  const nuevo = await promptModal('Nuevo nombre del grupo / zona:', {title:'Renombrar grupo', default:group});
  if(!nuevo || !nuevo.trim() || nuevo.trim()===group) return;
  const n = nuevo.trim();
  D.jardineriaData.forEach(r=>{ if(r.section===section && r.group===group) r.group = n; });
  _jardMoverClaves(([s,g,t])=> (s===section && g===group) ? [s,n,t].join('|||') : [s,g,t].join('|||'));
  _jardMoverHoras(section, group, section, n);
  _saveJardineria();
  openGestionTareasJard();
  showToast('Grupo renombrado');
}

export async function jardDeleteGrupo(section, group){
  if(D.userRole!=='gerencia') return;
  const cant = D.jardineriaData.filter(r=>r.section===section && r.group===group).length;
  if(!await confirmModal(`¿Eliminar el grupo "${group}" con sus ${cant} tareas? Se pierde el historial de visitas de ese grupo.`)) return;
  D._setJardineriaDataArr(D.jardineriaData.filter(r=>!(r.section===section && r.group===group)));
  _jardMoverClaves(([s,g,t])=> (s===section && g===group) ? null : [s,g,t].join('|||'));
  _jardMoverHoras(section, group, null, null);
  _saveJardineria();
  openGestionTareasJard();
  showToast('Grupo eliminado');
}

export async function jardRenameSeccion(section){
  if(D.userRole!=='gerencia') return;
  const nuevo = await promptModal('Nuevo nombre de la sección / zona:', {title:'Renombrar sección', default:section});
  if(!nuevo || !nuevo.trim() || nuevo.trim()===section) return;
  const n = nuevo.trim();
  const grupos = [...new Set(D.jardineriaData.filter(r=>r.section===section).map(r=>r.group))];
  D.jardineriaData.forEach(r=>{ if(r.section===section) r.section = n; });
  _jardMoverClaves(([s,g,t])=> s===section ? [n,g,t].join('|||') : [s,g,t].join('|||'));
  grupos.forEach(g=>_jardMoverHoras(section, g, n, g));
  _saveJardineria();
  openGestionTareasJard();
  showToast('Sección renombrada');
}

export async function jardDeleteSeccion(section){
  if(D.userRole!=='gerencia') return;
  const cant = D.jardineriaData.filter(r=>r.section===section).length;
  if(!await confirmModal(`¿Eliminar la sección "${section}" completa, con sus ${cant} tareas? Se pierde el historial de visitas de toda la sección.`)) return;
  const grupos = [...new Set(D.jardineriaData.filter(r=>r.section===section).map(r=>r.group))];
  D._setJardineriaDataArr(D.jardineriaData.filter(r=>r.section!==section));
  _jardMoverClaves(([s,g,t])=> s===section ? null : [s,g,t].join('|||'));
  grupos.forEach(g=>_jardMoverHoras(section, g, null, null));
  _saveJardineria();
  openGestionTareasJard();
  showToast('Sección eliminada');
}

export function openGestionTareasJard(){
  if(D.userRole!=='gerencia'){ showToast('Solo gerencia'); return; }
  _jardRefrescarVistas();
  let ov = document.getElementById('gestion-tareas-jard-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='gestion-tareas-jard-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  const bySec = {};
  D.jardineriaData.forEach((r,i)=>{
    bySec[r.section] = bySec[r.section] || {};
    (bySec[r.section][r.group] = bySec[r.section][r.group] || []).push(i);
  });
  const secHTML = Object.keys(bySec).map(sec=>{
    const secEsc = esc(sec).replace(/'/g,"\\'");
    const grupos = bySec[sec];
    const gruposHTML = Object.keys(grupos).map(grp=>{
      const grpEsc = esc(grp).replace(/'/g,"\\'");
      const tareasHTML = grupos[grp].map(i=>{
        const r = D.jardineriaData[i];
        return `<div style="display:flex;align-items:center;gap:8px;padding:6px 12px;background:var(--warm-white)">
          <div style="flex:1;min-width:0;font-size:12.5px;color:var(--charcoal)">${esc(r.task)}</div>
          <button class="btn-icon" title="Renombrar" onclick="jardRenameTarea(${i})"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>
          <button class="btn-icon" style="color:var(--red-alert)" title="Eliminar" onclick="jardDeleteTarea(${i})">✕</button>
        </div>`;
      }).join('');
      return `<div style="margin:6px 0;border:1px solid var(--light-gray);border-radius:8px;overflow:hidden">
        <div style="padding:7px 12px;background:var(--cream);font-size:12px;font-weight:600;color:var(--charcoal);display:flex;align-items:center;gap:8px">
          <span style="flex:1;min-width:0">${esc(grp)}</span>
          <button class="btn-icon" title="Renombrar grupo" onclick="jardRenameGrupo('${secEsc}','${grpEsc}')"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>
          <button class="btn-icon" style="color:var(--red-alert)" title="Eliminar grupo" onclick="jardDeleteGrupo('${secEsc}','${grpEsc}')">✕</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:1px;background:var(--light-gray)">${tareasHTML}</div>
        <div style="padding:6px 12px;background:var(--warm-white)"><button class="btn-secondary" style="font-size:12px;padding:4px 10px" onclick="jardAddTarea('${secEsc}','${grpEsc}')">+ Agregar tarea</button></div>
      </div>`;
    }).join('');
    return `<div style="margin-bottom:14px;border:1px solid var(--light-gray);border-radius:10px;overflow:hidden">
      <div style="padding:10px 12px;background:var(--ok-soft);font-size:13.5px;font-weight:700;color:var(--sage-dark);display:flex;align-items:center;gap:8px">
        <span style="flex:1;min-width:0">${getSectionEmoji(sec)} ${esc(sec)}</span>
        <button class="btn-icon" title="Renombrar sección" onclick="jardRenameSeccion('${secEsc}')"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>
        <button class="btn-icon" style="color:var(--red-alert)" title="Eliminar sección" onclick="jardDeleteSeccion('${secEsc}')">✕</button>
      </div>
      <div style="padding:8px 10px">${gruposHTML}
        <button class="btn-secondary" style="font-size:12px;padding:4px 10px;margin-top:4px" onclick="jardAddGrupo('${secEsc}')">+ Agregar grupo</button>
      </div>
    </div>`;
  }).join('');
  ov.innerHTML = `<div class="modal" style="max-width:620px;max-height:88vh;overflow-y:auto">
    <button class="modal-close" onclick="closeModal('gestion-tareas-jard-modal')">✕</button>
    <div class="modal-title">Gestionar tareas de jardinería</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:14px">Agregá, renombrá o eliminá secciones, grupos y tareas. Lo que ya está registrado se mantiene. Los cambios se aplican para todos y se sincronizan con el equipo.</div>
    ${secHTML}
    <div style="margin-top:8px"><button class="btn-add" style="font-size:12px;padding:8px 16px" onclick="jardAddSeccion()">+ Agregar sección / zona</button></div>
  </div>`;
  ov.classList.add('open');
}

export function renderJardOps(){
  renderJardTurnoCard();
  renderAlertasUrgentesJard();
  // KPIs
  let kOk=0,kWarn=0,kAlert=0,kNone=0;
  D.jardineriaData.forEach(r=>{
    const s=getDaysBadge(daysSince(r.last)).status;
    if(s==='ok')kOk++;else if(s==='warn')kWarn++;else if(s==='alert')kAlert++;else kNone++;
  });
  const kpisEl = document.getElementById('jops-kpis');
  if(kpisEl) kpisEl.innerHTML=`
    <div class="card"><div class="card-label">Urgente</div><div class="card-value red" style="font-size:32px">${kAlert}</div><div class="card-sub">intervenir hoy</div></div>
    <div class="card"><div class="card-label">Próxima</div><div class="card-value amber" style="font-size:32px">${kWarn}</div><div class="card-sub">requieren visita pronto</div></div>
    <div class="card"><div class="card-label">Al día</div><div class="card-value green" style="font-size:32px">${kOk}</div><div class="card-sub">zonas recientes</div></div>`;

  const statusOrder = {alert:0, warn:1, ok:2, none:3};

  // Agrupar por section + group (zona completa)
  const groupMap = new Map();
  D.jardineriaData.forEach((r,i)=>{
    const key = r.section+'|||'+r.group;
    if(!groupMap.has(key)) groupMap.set(key,{section:r.section,group:r.group,items:[]});
    groupMap.get(key).items.push({r,i,days:daysSince(r.last),badge:getDaysBadge(daysSince(r.last))});
  });

  // Para cada zona: determinar peor estado y ordenar tareas internas por urgencia
  const zones = [...groupMap.values()].map(z=>{
    z.items.sort((a,b)=>statusOrder[a.badge.status]-statusOrder[b.badge.status]||(b.days||999)-(a.days||999));
    z.worstStatus = z.items.reduce((w,it)=>statusOrder[it.badge.status]<statusOrder[w]?it.badge.status:w,'none');
    z.alertCount  = z.items.filter(it=>it.badge.status==='alert').length;
    z.warnCount   = z.items.filter(it=>it.badge.status==='warn').length;
    z.okCount     = z.items.filter(it=>it.badge.status==='ok').length;
    return z;
  });

  // Ordenar zonas: las más urgentes primero
  zones.sort((a,b)=>statusOrder[a.worstStatus]-statusOrder[b.worstStatus]);

  const grid = document.getElementById('jops-grid');
  if(!grid) return;
  grid.innerHTML = '';
  grid.style.cssText = 'display:flex;flex-direction:column;gap:12px';

  _jopsZones = [];  // resetear índice de zonas renderizadas
  let rendered = 0;
  const itemPasa = (it)=> jopsFilter==='all' ? true : jopsFilter==='plan' ? jardEnPlanHoy(it.r) : it.badge.status===jopsFilter;
  zones.forEach(z=>{
    // Mostrar zona si tiene al menos una tarea del filtro seleccionado
    if(jopsFilter !== 'all' && !z.items.some(itemPasa)) return;

    _jopsZones.push(z);  // índice = rendered

    const borderColor = z.worstStatus==='alert'?'#E53935':z.worstStatus==='warn'?'#F59E0B':z.worstStatus==='ok'?'#43A047':'#C0BEB6';
    const bgHeader    = z.worstStatus==='alert'?'#FFF5F5':z.worstStatus==='warn'?'#FFFBF0':z.worstStatus==='ok'?'#F0FAF0':'#F8F7F5';
    const chevId = 'jops-ch-'+rendered;

    const zoneEl = document.createElement('div');
    zoneEl.style.cssText = `border:1px solid ${borderColor};border-left:5px solid ${borderColor};border-radius:8px;overflow:hidden`;

    // Cabecera de zona — solo info (el horario se marca una vez en la jornada,
    // no por zona; cada tarea se cierra con "✓ Hecho").
    const headerEl = document.createElement('div');
    headerEl.style.cssText = `display:flex;flex-direction:column;gap:0;padding:12px 16px;background:${bgHeader};cursor:pointer;user-select:none`;
    headerEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">${getSectionEmoji(z.section)}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700;color:var(--charcoal)">${esc(z.group)}</div>
          <div style="font-size:12px;color:var(--mid-gray);margin-top:1px">${esc(z.section)} · ${z.items.length} tarea${z.items.length!==1?'s':''}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">
          ${z.alertCount?`<span style="background:var(--alert-soft);color:#C62828;padding:3px 9px;border-radius:12px;font-size:12px;font-weight:700">${z.alertCount} urgente${z.alertCount!==1?'s':''}</span>`:''}
          ${z.warnCount ?`<span style="background:#FFF8E1;color:#E65100;padding:3px 9px;border-radius:12px;font-size:12px;font-weight:700">${z.warnCount} pronto</span>`:''}
          ${z.okCount   ?`<span style="background:var(--ok-soft);color:var(--green-ok);padding:3px 9px;border-radius:12px;font-size:12px;font-weight:700">${z.okCount} al día</span>`:''}
          <span id="${chevId}" style="font-size:14px;color:var(--mid-gray);transition:transform .2s;display:inline-block">▼</span>
        </div>
      </div>`;

    // Contenedor de tareas de la zona (grid interno)
    const tasksEl = document.createElement('div');
    tasksEl.style.cssText = `display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1px;background:${borderColor}`;

    z.items.forEach(({r,i,badge})=>{
      if(jopsFilter==='plan' && !jardEnPlanHoy(r)) return;
      const enPlan = jardEnPlanHoy(r);
      const planCtrl = D.userRole==='gerencia'
        ? `<button class="btn-icon" title="${enPlan?'Quitar del plan de hoy':'Marcar para hoy'}" style="flex-shrink:0;font-size:14px" onclick="jardTogglePlanHoy(${i})">${enPlan?'':'☆'}</button>`
        : (enPlan?'<span style="flex-shrink:0;font-size:12px;background:var(--ok-soft);color:var(--sage-dark);padding:2px 7px;border-radius:8px;font-weight:600">Hoy</span>':'');
      const taskEl = document.createElement('div');
      taskEl.style.cssText = 'background:var(--warm-white);padding:14px;display:flex;flex-direction:column;gap:8px'+(enPlan?';box-shadow:inset 3px 0 0 var(--sage-dark)':'');
      taskEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div style="font-size:12px;font-weight:600;color:var(--charcoal);flex:1;line-height:1.4">${esc(r.task)}</div>
          ${planCtrl}
          <span style="flex-shrink:0;font-size:15px" title="Estado">${badge.status==='ok'?'':badge.status==='warn'?'':badge.status==='alert'?'':''}</span>
        </div>
        <div style="font-size:12px;color:var(--mid-gray)">${r.last?fmtDate(r.last):'<em>Sin registro</em>'} · ${D.getMonthVisits(r)} este mes</div>
        <textarea id="jops-obs-${i}" class="cl-obs-input" placeholder="Observaciones..." style="width:100%;font-size:12px;resize:vertical;min-height:44px;padding:5px 7px;border-radius:4px;border:1px solid var(--light-gray);font-family:inherit;background:var(--warm-white)"
          onchange="jardineriaData[${i}].obs=this.value">${esc(r.obs||'')}</textarea>
        <div style="display:flex;gap:8px;align-items:center">
          <div style="flex:1;text-align:center">
            <div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Inicio</div>
            ${jopsHoraCell(i,'horaInicio',r)}
          </div>
          <div style="flex:1;text-align:center">
            <div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Fin</div>
            ${jopsHoraCell(i,'horaFin',r)}
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:2px">
          <select id="jops-quien-${i}" class="cl-select" style="font-size:12px;padding:5px 8px;flex:1">
            <option value="">— Jardinero —</option>
            ${D.JARDINEROS_LIST.map(n=>`<option ${n===(D.jardineroNombre||D.jardCurrentJardinero)?'selected':''}>${n}</option>`).join('')}
          </select>
          <button class="mark-done-btn" style="flex:1" onclick="jopsDone(${i})">✓ Hecho</button>
        </div>`;
      tasksEl.appendChild(taskEl);
    });

    // Toggle colapsar/expandir — solo en la primera fila del header (no en los botones de hora)
    headerEl.firstElementChild.style.cursor = 'pointer';
    headerEl.firstElementChild.onclick = (e)=>{
      e.stopPropagation();
      const open = tasksEl.style.display !== 'none';
      tasksEl.style.display = open ? 'none' : 'grid';
      const ch = document.getElementById(chevId);
      if(ch) ch.style.transform = open ? 'rotate(-90deg)' : '';
    };
    headerEl.style.cursor = 'default';

    zoneEl.appendChild(headerEl);
    zoneEl.appendChild(tasksEl);
    grid.appendChild(zoneEl);
    rendered++;
  });

  if(rendered === 0){
    grid.innerHTML = `<div style="padding:40px;text-align:center;color:var(--mid-gray);font-size:14px">
      ${jopsFilter==='all'?'Sin tareas cargadas.':jopsFilter==='plan'?(jardHayPlanHoy()?'Todas las tareas de hoy completadas.':'Gerencia todavía no marcó tareas para hoy. Se ven todas en «Todas».'):'Sin zonas en esta categoría.'}
    </div>`;
  }
}

// ── Hora cells para Jardinería ──────────────────
export function jopsHoraCell(i, campo, r){
  const val = r[campo] || '';
  const done = false;
  if(D.userRole === 'gerencia'){
    const dis = done ? 'disabled' : '';
    return `<input type="time" value="${val}" ${dis}
      style="width:78px;padding:4px 5px;font-size:12px;border:1px solid var(--light-gray);border-radius:4px;text-align:center;background:var(--warm-white);color:var(--charcoal)"
      onchange="jopsUpdHora(${i},'${campo}',this.value)">`;
  }
  if(val){
    const color = campo==='horaInicio' ? '#2C4A3E' : '#8B3A3A';
    const bg    = campo==='horaInicio' ? '#EBF5E8' : '#FDF0F0';
    const reset = done ? '' : `onclick="jopsResetHora(${i},'${campo}')" title="Tocar para borrar"`;
    return `<span ${reset} style="font-size:13px;font-weight:700;color:${color};background:${bg};padding:3px 10px;border-radius:8px;display:inline-block;${done?'':'cursor:pointer'}">${val}</span>`;
  }
  const dis   = done ? 'disabled style="opacity:.45;cursor:not-allowed"' : '';
  const label = campo==='horaInicio' ? icon('play')+'Inicio' : icon('stop')+'Fin';
  const cls   = campo==='horaInicio' ? 'btn-hora-inicio' : 'btn-hora-fin';
  return `<button class="${cls}" ${dis} onclick="jopsRegistrarHora(${i},'${campo}')">${label}</button>`;
}

export function jopsRegistrarHora(i, campo){
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2,'0');
  const mm  = String(now.getMinutes()).padStart(2,'0');
  D.jardineriaData[i][campo] = hh+':'+mm;
  D.fbSave('jardineriaData', D.jardineriaData);
  if(campo === 'horaFin'){
    jopsDone(i);
  } else {
    renderJardOps();
  }
}

export function jopsResetHora(i, campo){
  D.jardineriaData[i][campo] = '';
  D.fbSave('jardineriaData', D.jardineriaData);
  renderJardOps();
}

export function jopsUpdHora(i, campo, val){
  D.jardineriaData[i][campo] = val;
  D.fbSave('jardineriaData', D.jardineriaData);
  renderJardOps();
}

export function jopsDone(i){
  const quien = document.getElementById('jops-quien-'+i)?.value || '';
  D.markJardDone(i, quien);
  renderJardOps();
  if(document.getElementById('page-control-jardineria')?.classList.contains('active')) D.renderCtrlJard();
}

// ── Turno de jardinero ────────────────────────────────────────────────────────
export function jardSetJardinero(nombre){
  D._setJardCurrentJardinero(nombre);
  try{ localStorage.setItem('jardCurrentJardinero', nombre); }catch(e){}
  renderJardTurnoCard();
}

export function jardRegistrarHoraTurno(campo){
  const nombre = D.jardineroNombre || D.jardCurrentJardinero;
  if(!nombre){ showToast('No hay jardinero identificado'); return; }
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  if(!window.jardHorarios[nombre]) window.jardHorarios[nombre] = {};
  if(!window.jardHorarios[nombre][D.TODAY_ISO]) window.jardHorarios[nombre][D.TODAY_ISO] = {inicio:'',fin:'',tareas:0};
  window.jardHorarios[nombre][D.TODAY_ISO][campo] = hh+':'+mm;
  D._setJardCurrentJardinero(nombre);
  D.fbSave('jardHorarios', window.jardHorarios);
  // Usuario combinado (jardinería + florista, ej. Ivan): una sola jornada vale
  // para las dos áreas → reflejar el mismo inicio/fin en florTurnos.
  if(D.floristaNombre && D.floristaNombre === nombre){
    if(!window.florTurnos) window.florTurnos = {};
    if(!window.florTurnos[nombre]) window.florTurnos[nombre] = {};
    if(!window.florTurnos[nombre][D.TODAY_ISO]) window.florTurnos[nombre][D.TODAY_ISO] = {};
    window.florTurnos[nombre][D.TODAY_ISO][campo] = hh+':'+mm;
    window.fbSetPath?.('florTurnos/'+nombre+'/'+D.TODAY_ISO+'/'+campo, hh+':'+mm);
  }
  renderJardTurnoCard();
  showToast(campo==='inicio' ? 'Jornada iniciada: '+hh+':'+mm : 'Jornada finalizada: '+hh+':'+mm);
}

export function jardResetHoraTurno(campo){
  const nombre = D.jardineroNombre || D.jardCurrentJardinero;
  if(!nombre || !window.jardHorarios[nombre]?.[D.TODAY_ISO]) return;
  window.jardHorarios[nombre][D.TODAY_ISO][campo] = '';
  D.fbSave('jardHorarios', window.jardHorarios);
  // Espejo para usuario combinado (ver jardRegistrarHoraTurno)
  if(D.floristaNombre && D.floristaNombre === nombre && window.florTurnos?.[nombre]?.[D.TODAY_ISO]){
    window.florTurnos[nombre][D.TODAY_ISO][campo] = '';
    window.fbSetPath?.('florTurnos/'+nombre+'/'+D.TODAY_ISO+'/'+campo, '');
  }
  renderJardTurnoCard();
}

export function renderJardTurnoCard(){
  const el = document.getElementById('jops-turno-card');
  if(!el) return;
  // "Mi jornada de hoy" es el fichaje personal del jardinero (inicio/fin de
  // su jornada). Gerencia no ficha la jornada de nadie, así que no la ve acá
  // — igual que la tarjeta equivalente de florería, que es solo para el florista.
  if(D.userRole !== 'jardinero'){ el.innerHTML=''; return; }

  const nombre = D.jardineroNombre || D.jardCurrentJardinero;
  const turno = nombre ? (window.jardHorarios[nombre]?.[D.TODAY_ISO]||{}) : {};
  const inicio = turno.inicio||'', fin = turno.fin||'';
  const tareasHoy = turno.tareas||0;
  const nowStr = new Date().getHours().toString().padStart(2,'0')+':'+new Date().getMinutes().toString().padStart(2,'0');
  const dur = inicio&&fin ? calcDuracion(inicio,fin) : (inicio ? calcDuracion(inicio,nowStr) : 0);

  el.innerHTML = `<div class="prod-card prod-card-personal" style="display:flex;flex-direction:column;gap:12px">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span style="font-size:20px"></span>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;color:var(--mid-gray);margin-bottom:2px">Mi jornada de hoy</div>
        <div style="font-size:17px;font-weight:700;color:var(--charcoal)">${esc(nombre||'—')}</div>
      </div>
      ${nombre && tareasHoy > 0 ? `<div style="text-align:center;min-width:60px">
        <div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Tareas hoy</div>
        <div style="font-size:26px;font-weight:700;color:var(--charcoal)">${tareasHoy}</div>
      </div>` : ''}
      ${dur > 0 ? `<div style="text-align:center;min-width:70px">
        <div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">${fin?'Horas':'Transcurrido'}</div>
        <div style="font-size:22px;font-weight:700;color:${fin?'var(--charcoal)':'var(--green-ok)'}">${fmtDur(dur)}</div>
      </div>` : ''}
    </div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--light-gray)">
      <span style="font-size:12px;color:var(--mid-gray);font-weight:600">Jornada:</span>
      ${inicio
        ? `<span onclick="jardResetHoraTurno('inicio')" title="Tocar para borrar" style="font-size:13px;font-weight:700;color:var(--accent);background:var(--ok-soft);padding:4px 12px;border-radius:8px;cursor:pointer">▶ ${inicio}</span>`
        : `<button class="btn-hora-inicio" onclick="jardRegistrarHoraTurno('inicio')">${icon('play')}Inicio de jornada</button>`}
      ${fin
        ? `<span onclick="jardResetHoraTurno('fin')" title="Tocar para borrar" style="font-size:13px;font-weight:700;color:var(--red-alert);background:var(--alert-soft);padding:4px 12px;border-radius:8px;cursor:pointer">${icon('stop')}${fin}</span>`
        : inicio ? `<button class="btn-hora-fin" onclick="jardRegistrarHoraTurno('fin')">${icon('stop')}Fin de jornada</button>` : ''}
    </div>
  </div>`;
}