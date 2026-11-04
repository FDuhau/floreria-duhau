// ── TABLERO (KANBAN) Y TAREAS DE GERENCIA ──────────────────────────────────
// Tablero de pedidos/eventos por columnas (sincronizado con Eventos) y
// tablero de tareas pendientes de gerencia.
// Separado de app.js. Lo que necesita de app.js llega por configurarKanban():
//   TODAY_ISO, _setKanbanData, closeModal, estaEditando, eventosData, fbSave, kanbanData, renderHome

import { renderVentas, ventasData } from './ventas.js';
import { _saveEventos, evZonasLabel, renderEventos } from './eventos.js';
import { esc, fmtDate, fmtDateTime } from './utils.js';
import { showToast } from './tema-toast.js';
import { confirmModal } from './modales.js';

let D = {};
export function configurarKanban(deps){ D = deps; }

// ════════════════════════════════════════
// DATA — KANBAN
// Includes cards AND events from comercial
// ════════════════════════════════════════
// Quita un emoji decorativo al inicio de un texto (para títulos guardados)
function _noLeadIco(s){ return String(s==null?'':s).replace(/^\s*[\u{1F000}-\u{1FAFF}-]️?\s*/u,''); }

export const KANBAN_DEFAULTS = [
  {title:'Pedidos Pendientes', color:'#F4F1EC', cards:[]},
  {title:'En Proceso',        color:'#EBF0E8', cards:[]},
  {title:'Pendiente de Colocación', color:'#FDF0E8', cards:[]},
  {title:'Finalizados',       color:'#E8F0F8', cards:[]}
];

// kanbanData queda en app.js (lo reasigna Firebase); kanban.js lo reemplaza por acá.

const TAG_LABELS={'tag-floreria':'Florería','tag-maison':'Maison','tag-evento':'Evento','tag-urgente':'Urgente','tag-garden':'Jardinería'};
const ESTADO_COL = {'Pedidos Pendientes':0,'En Proceso':1,'Pendiente de Colocacion':2,'Pendiente de Retiro':2,'Confirmado':1,'Pedidos Finalizados':3};
let dragSrcCol=null,dragSrcIdx=null,editingTask=null;

export function ensureKanbanCols(){
  // Garantizar que kanbanData tenga 4 columnas válidas
  if(!Array.isArray(D.kanbanData) || D.kanbanData.length < 4){
    D._setKanbanData(JSON.parse(JSON.stringify(KANBAN_DEFAULTS)));
  }
  D.kanbanData.forEach((col,i) => {
    if(!col.cards) col.cards = [];
    if(!col.title) col.title = KANBAN_DEFAULTS[i].title;
    if(!col.color) col.color = KANBAN_DEFAULTS[i].color;
  });
}

export function syncEventosToKanban(){
  ensureKanbanCols();
  // Remove all evento-linked cards from kanban
  D.kanbanData.forEach(col=>{
    col.cards = col.cards.filter(c=>!c.eventoIdx && c.eventoIdx!==0);
  });
  // Quitar del tablero las tarjetas de florería cuyo pedido/venta ya NO está
  // pendiente (pasó a confirmado/entregado) o fue borrado. Vínculo por ventaId;
  // para tarjetas viejas sin vínculo, match por producto + fecha. Guarda: solo
  // se poda si las ventas ya cargaron (evita borrar por carrera al iniciar).
  const ventasArr = ventasData || [];
  if(ventasArr.length){
    const ventaPorId = {};
    ventasArr.forEach(v=>{ if(v && v.id) ventaPorId[v.id] = v; });
    let _podadas = 0;
    D.kanbanData.forEach(col=>{
      const antes = col.cards.length;
      col.cards = col.cards.filter(c=>{
        if(!c || c.isEvento || !(c.tags||[]).includes('tag-floreria')) return true;
        if(c.ventaId){
          const v = ventaPorId[c.ventaId];
          return !!(v && v.estado === 'pendiente'); // se queda solo si sigue pendiente
        }
        // Legacy sin vínculo: match por producto contenido en el título + fecha
        const tl = (c.title||'').toLowerCase();
        const cand = ventasArr.filter(v=> v.prod && tl.includes(String(v.prod).toLowerCase().trim()) && (v.fecha||'')===(c.date||''));
        if(cand.length){
          const hayPend = cand.some(v=>v.estado==='pendiente');
          const hayDone = cand.some(v=>v.estado==='entregado' || v.estado==='confirmado');
          if(!hayPend && hayDone) return false;
        }
        return true;
      });
      _podadas += antes - col.cards.length;
    });
    if(_podadas > 0) D.fbSave('kanbanData', D.kanbanData);
  }
  // Re-add from eventosData
  D.eventosData.forEach((ev,idx)=>{
    const colIdx = ESTADO_COL[ev.estado] ?? 0;
    const hora = ev.hora ? ' · '+ev.hora : '';
    D.kanbanData[colIdx].cards.push({
      title: ''+ev.nombre,
      desc: `${evZonasLabel(ev)}${ev.pax?' · '+ev.pax+' pax':''}${hora}${ev.asignado?' · '+ev.asignado:''}\n${ev.notas||''}`,
      tags: ['tag-evento'],
      date: ev.fecha,
      isEvento: true,
      eventoIdx: idx,
      asignado: ev.asignado || '',
    });
  });
  // Ordenar cards por fecha: columnas activas ascendente (más urgente primero), Finalizados descendente (más reciente primero)
  D.kanbanData.forEach((col, colIdx) => {
    if(colIdx === 3){
      col.cards.sort((a,b) => (b.date||'').localeCompare(a.date||''));
    } else {
      col.cards.sort((a,b) => (a.date||'9999').localeCompare(b.date||'9999'));
    }
  });
}

// Mover una tarjeta del kanban con botones ‹ › (útil en touch, donde no hay drag & drop)
export function moveKanbanCard(ci, i, dir){
  const nci = ci + dir;
  if(nci < 0 || nci >= D.kanbanData.length) return;
  const card = D.kanbanData[ci].cards.splice(i, 1)[0];
  if(!card) return;
  if(card.isEvento){
    const estadoMap = {0:'Pedidos Pendientes',1:'En Proceso',2:'Pendiente de Colocacion',3:'Pedidos Finalizados'};
    D.eventosData[card.eventoIdx].estado = estadoMap[nci]||'Pedidos Pendientes';
    _saveEventos();
    renderEventos(); D.renderHome();
  }
  D.kanbanData[nci].cards.push(card);
  D.fbSave('kanbanData', D.kanbanData);
  renderKanban();
}

export function renderKanban(){
  syncEventosToKanban();

  // Alert banner for upcoming events (protegido contra eventos sin fecha)
  const alertEl = document.getElementById('kanban-eventos-alert');
  const próximos = D.eventosData.filter(e=>e.estado!=='Pedidos Finalizados'&&(e.fecha||'')>=D.TODAY_ISO).sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||'')).slice(0,2);
  if(alertEl) alertEl.innerHTML = próximos.length
    ? `<div class="alert-banner green">Próximos eventos: ${próximos.map(e=>`<strong>${esc(e.nombre)}</strong> — ${fmtDateTime(e.fecha,e.hora)}`).join(' · ')}</div>`
    : '';

  const board=document.getElementById('kanban-board');
  board.innerHTML='';
  D.kanbanData.forEach((col,ci)=>{
    const colEl=document.createElement('div');
    colEl.className='kanban-col';
    colEl.style.background=col.color;
    colEl.dataset.col=ci;
    colEl.addEventListener('dragover',e=>{e.preventDefault();colEl.classList.add('drag-over');});
    colEl.addEventListener('dragleave',()=>colEl.classList.remove('drag-over'));
    colEl.addEventListener('drop',e=>{
      e.preventDefault();colEl.classList.remove('drag-over');
      if(dragSrcCol===null) return;
      const card=D.kanbanData[dragSrcCol].cards.splice(dragSrcIdx,1)[0];
      if(card.isEvento){
        // Update event estado based on col
        const estadoMap = {0:'Pedidos Pendientes',1:'En Proceso',2:'Pendiente de Colocacion',3:'Pedidos Finalizados'};
        D.eventosData[card.eventoIdx].estado = estadoMap[ci]||'Pedidos Pendientes';
        _saveEventos();
        renderEventos(); D.renderHome();
      }
      D.kanbanData[ci].cards.push(card);
      D.fbSave('kanbanData', D.kanbanData);
      dragSrcCol=dragSrcIdx=null;
      renderKanban();
    });
    colEl.innerHTML=`<div class="kanban-col-header">
      <div class="kanban-col-title">${_noLeadIco(col.title)}</div>
      <span class="kanban-count">${col.cards.length}</span>
    </div>`;
    col.cards.forEach((card,i)=>{
      try{
      if(!card) return;
      const cardEl=document.createElement('div');
      cardEl.className='kanban-card'+(card.isEvento?' evento-card':'')+(card.isEvento&&ci===3?' evento-hecho':'');
      cardEl.draggable=true;
      cardEl.addEventListener('dragstart',()=>{dragSrcCol=ci;dragSrcIdx=i;cardEl.classList.add('dragging');});
      cardEl.addEventListener('dragend',()=>cardEl.classList.remove('dragging'));
      const descLines = (card.desc||'').split('\n').filter(Boolean);
      // Urgencia por fecha del evento: borde y chip según cuántos días faltan
      let urgChip='';
      if(card.isEvento && ci!==3){
        const fechaEv = D.eventosData[card.eventoIdx]?.fecha;
        if(fechaEv){
          const dias = Math.round((new Date(fechaEv)-new Date(D.TODAY_ISO))/86400000);
          if(dias===0){ cardEl.classList.add('kanban-urg-hoy'); urgChip='<span class="kanban-urg-chip" style="background:var(--red-alert)">HOY</span>'; }
          else if(dias===1){ cardEl.classList.add('kanban-urg-prox'); urgChip='<span class="kanban-urg-chip" style="background:#D4820A">Mañana</span>'; }
          else if(dias>1 && dias<=3){ cardEl.classList.add('kanban-urg-prox'); urgChip=`<span class="kanban-urg-chip" style="background:var(--amber)">En ${dias} días</span>`; }
          else if(dias<0){ cardEl.classList.add('kanban-urg-pasado'); urgChip='<span class="kanban-urg-chip" style="background:var(--mid-gray)">Pasado</span>'; }
        }
      }
      cardEl.innerHTML=`
        <div class="kanban-card-title">${esc(card.title)}${urgChip}</div>
        ${descLines.length?`<div class="kanban-card-desc">${descLines.map(esc).join('<br>')}</div>`:''}
        <div class="kanban-card-tags">${(card.tags||[]).map(t=>`<span class="kanban-tag ${t}">${TAG_LABELS[t]||t}</span>`).join('')}</div>
        <div class="kanban-card-meta">
          <span class="kanban-date">${card.date}</span>
          <div class="kanban-actions">
            <button class="btn-icon kanban-move" title="Mover a la columna anterior" ${ci===0?'disabled':''} onclick="moveKanbanCard(${ci},${i},-1)">‹</button>
            <button class="btn-icon kanban-move" title="Mover a la columna siguiente" ${ci===D.kanbanData.length-1?'disabled':''} onclick="moveKanbanCard(${ci},${i},1)">›</button>
            ${card.isEvento?`<button class="btn-icon" title="Ver detalle" onclick="openEventoDetail(${card.eventoIdx})"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></button><button class="btn-icon" title="Ver en Comercial" onclick="navigate('eventos-comercial')"></button>`:`<button class="btn-icon" onclick="openTaskModal(${ci},${i})"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>`}
            ${!card.isEvento?`<button class="btn-icon" style="color:var(--red-alert)" onclick="removeKanbanCard(${ci},${i})">✕</button>`:''}
          </div>
        </div>`;
      colEl.appendChild(cardEl);
      }catch(err){ console.warn('Kanban card render error:', err, card); }
    });
    if(ci<3){
      const addBtn=document.createElement('button');
      addBtn.className='add-card-btn';
      addBtn.innerHTML='+ Agregar tarea';
      addBtn.onclick=()=>openTaskModal(ci,null);
      colEl.appendChild(addBtn);
    }
    board.appendChild(colEl);
  });
}

export function openTaskModal(ci,i){
  editingTask=(ci!==null&&i!==null)?{ci,i}:null;
  const modal=document.getElementById('task-modal');
  if(editingTask){
    const card=D.kanbanData[ci].cards[i];
    if(card.isEvento) return; // eventos se editan desde comercial
    document.getElementById('task-modal-title').textContent='Editar Tarea';
    document.getElementById('task-save-btn').textContent='Guardar';
    document.getElementById('task-title').value=card.title;
    document.getElementById('task-desc').value=card.desc||'';
    document.getElementById('task-col').value=ci;
    document.getElementById('task-tag').value=card.tags[0]||'tag-floreria';
    document.getElementById('task-date').value=card.date||D.TODAY_ISO;
  } else {
    document.getElementById('task-modal-title').textContent='Nueva Tarea';
    document.getElementById('task-save-btn').textContent='Agregar';
    document.getElementById('task-title').value='';
    document.getElementById('task-desc').value='';
    document.getElementById('task-col').value=ci??0;
    document.getElementById('task-tag').value='tag-floreria';
    document.getElementById('task-date').value=D.TODAY_ISO;
  }
  modal.classList.add('open');
}

export function saveKanbanTask(){
  const title=document.getElementById('task-title').value.trim();
  if(!title) return;
  const ci=+document.getElementById('task-col').value;
  const tag=document.getElementById('task-tag').value;
  const date=document.getElementById('task-date').value||D.TODAY_ISO;
  const desc=document.getElementById('task-desc').value.trim();

  const isNew = !editingTask;

  if(editingTask){
    const {ci:oldCi,i}=editingTask;
    const card=D.kanbanData[oldCi].cards.splice(i,1)[0];
    card.title=title;card.desc=desc;card.tags=[tag];card.date=date;
    D.kanbanData[ci].cards.push(card);
  } else {
    D.kanbanData[ci].cards.push({title,desc,tags:[tag],date,isEvento:false});
  }

  // ── AUTO-SYNC: tag-evento → eventosData ──────────────────────────────────
  if(isNew && tag==='tag-evento'){
    D.eventosData.push({
      nombre: title,
      tipo: 'Evento',
      fecha: date,
      hora: '',
      salon: '',
      pax: 0,
      notas: desc||'',
      precio: 'A confirmar',
      estado: ['Pedidos Pendientes','En Proceso','Pendiente de Colocacion','Pedidos Finalizados'][ci]||'Pedidos Pendientes',
      fromKanban: true
    });
    _saveEventos();
    showToast('Evento registrado en Área Comercial: ' + title);
    if(document.getElementById('page-eventos-comercial').classList.contains('active')) renderEventos();
    D.renderHome();
  }

  // ── AUTO-SYNC: tag-floreria → ventasData ─────────────────────────────────
  if(isNew && tag==='tag-floreria'){
    ventasData.push({
      prod: title,
      desc: desc||'',
      fecha: date,
      cliente: '',
      dedicatoria: '',
      precio: '',
      estado: 'pendiente',
      dir: '',
      fromKanban: true
    });
    D.fbSave('ventasData', ventasData);
    showToast('Tarea de Florería registrada en Ventas Externas: ' + title);
    if(document.getElementById('page-ventas-externas').classList.contains('active')) renderVentas();
  }

  D.closeModal('task-modal');
  D.fbSave('kanbanData', D.kanbanData);
  renderKanban();
}

export async function removeKanbanCard(ci,i){
  if(!await confirmModal('¿Eliminar esta tarea?')) return;
  D.kanbanData[ci].cards.splice(i,1);
  D.fbSave('kanbanData', D.kanbanData);
  renderKanban();
}

// ════════════════════════════════════════
// TAREAS PENDIENTES DE GERENCIA (tablero tipo Trello, solo gerencia)
// Store propio, independiente del kanban de eventos. Cada tarea es una "cosa a
// seguir" con estado (columna), prioridad, nota y fecha límite opcional.
// ════════════════════════════════════════
const TG_COLS = [
  { key:'todo',  title:'Por hacer', color:'#F4F1EC' },
  { key:'doing', title:'En curso',  color:'#EBF0E8' },
  { key:'done',  title:'Hecho',     color:'#E8F0F8' },
];
const TG_PRIO = {
  alta:  { label:'Alta',  bg:'#FCE9E4', fg:'#B23B1E' },
  media: { label:'Media', bg:'#FBF1DE', fg:'#8A6D00' },
  baja:  { label:'Baja',  bg:'#EAF0E8', fg:'#3A5230' },
};
export let tareasGerencia = [];
window._setTareasGerencia = v => {
  tareasGerencia = !v ? [] : (Array.isArray(v) ? v : Object.values(v));
  if(document.getElementById('page-tareas-gerencia')?.classList.contains('active') && !D.estaEditando('page-tareas-gerencia')) renderTareasGerencia();
};
function _saveTareasGerencia(){ window._tareasGerenciaLastSave = Date.now(); D.fbSave('tareasGerencia', tareasGerencia); }
function _tgGenId(){ return 'tg-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7); }
function _tgFind(id){ return tareasGerencia.find(x=>x && x.id===id) || null; }

let _tgDragId = null;
export function renderTareasGerencia(){
  const board = document.getElementById('tg-board');
  if(!board) return;
  const sum = document.getElementById('tg-summary');
  if(sum){
    const pend = tareasGerencia.filter(t=>t && t.col!=='done').length;
    const done = tareasGerencia.filter(t=>t && t.col==='done').length;
    sum.innerHTML = tareasGerencia.length
      ? `<div style="font-size:12.5px;color:var(--mid-gray)">${pend} pendiente${pend!==1?'s':''} · ${done} hecha${done!==1?'s':''}</div>`
      : `<div style="font-size:12.5px;color:var(--mid-gray)">Todavía no hay tareas. Tocá «+ Nueva tarea» para empezar a cargar y seguir pendientes.</div>`;
  }
  board.innerHTML = '';
  TG_COLS.forEach((col, colIdx)=>{
    const cards = tareasGerencia
      .filter(t => t && (t.col||'todo') === col.key)
      .sort((a,b)=>{
        if(col.key==='done') return (b.updated||b.created||0) - (a.updated||a.created||0);
        const pw = {alta:0,media:1,baja:2};
        const pa = pw[a.prio]??1, pb = pw[b.prio]??1;
        if(pa!==pb) return pa-pb;
        return (a.date||'9999').localeCompare(b.date||'9999');
      });
    const colEl = document.createElement('div');
    colEl.className = 'kanban-col';
    colEl.style.background = col.color;
    colEl.addEventListener('dragover', e=>{ e.preventDefault(); colEl.classList.add('drag-over'); });
    colEl.addEventListener('dragleave', ()=>colEl.classList.remove('drag-over'));
    colEl.addEventListener('drop', e=>{ e.preventDefault(); colEl.classList.remove('drag-over'); if(_tgDragId){ tgMoveTo(_tgDragId, col.key); _tgDragId=null; } });
    colEl.innerHTML = `<div class="kanban-col-header"><div class="kanban-col-title">${esc(col.title)}</div><span class="kanban-count">${cards.length}</span></div>`;
    cards.forEach(t=>{
      const cardEl = document.createElement('div');
      cardEl.className = 'kanban-card' + (col.key==='done'?' evento-hecho':'');
      cardEl.draggable = true;
      cardEl.addEventListener('dragstart', ()=>{ _tgDragId=t.id; cardEl.classList.add('dragging'); });
      cardEl.addEventListener('dragend', ()=>cardEl.classList.remove('dragging'));
      const prio = TG_PRIO[t.prio];
      const prioChip = prio ? `<span class="kanban-tag" style="background:${prio.bg};color:${prio.fg}">${esc(prio.label)}</span>` : '';
      // Chip de vencida/hoy para tareas con fecha límite que aún no están hechas
      let dueChip = '';
      if(t.date && col.key!=='done'){
        const dias = Math.round((new Date(t.date)-new Date(D.TODAY_ISO))/86400000);
        if(dias<0)      dueChip = `<span class="kanban-tag" style="background:#FCE9E4;color:var(--red-alert)">Vencida</span>`;
        else if(dias===0) dueChip = `<span class="kanban-tag" style="background:#FBF1DE;color:var(--amber)">Hoy</span>`;
      }
      const descLines = (t.desc||'').split('\n').filter(Boolean);
      const tagsHTML = (prioChip||dueChip) ? `<div class="kanban-card-tags">${prioChip}${dueChip}</div>` : '';
      cardEl.innerHTML = `
        <div class="kanban-card-title">${esc(t.title)}</div>
        ${descLines.length?`<div class="kanban-card-desc">${descLines.map(esc).join('<br>')}</div>`:''}
        ${tagsHTML}
        <div class="kanban-card-meta">
          <span class="kanban-date">${t.date?esc(fmtDate(t.date)):''}</span>
          <div class="kanban-actions">
            <button class="btn-icon kanban-move" title="Columna anterior" ${colIdx===0?'disabled':''} onclick="tgMove('${t.id}',-1)">‹</button>
            <button class="btn-icon kanban-move" title="Columna siguiente" ${colIdx===TG_COLS.length-1?'disabled':''} onclick="tgMove('${t.id}',1)">›</button>
            <button class="btn-icon" title="Editar" onclick="openTareaGerencia('${t.id}')"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>
            <button class="btn-icon" style="color:var(--red-alert)" title="Eliminar" onclick="tgDelete('${t.id}')">✕</button>
          </div>
        </div>`;
      colEl.appendChild(cardEl);
    });
    const addBtn = document.createElement('button');
    addBtn.className = 'add-card-btn';
    addBtn.textContent = '+ Agregar';
    addBtn.onclick = ()=>openTareaGerencia(null, col.key);
    colEl.appendChild(addBtn);
    board.appendChild(colEl);
  });
}

export function tgMove(id, dir){
  const t = _tgFind(id); if(!t) return;
  const idx = TG_COLS.findIndex(c=>c.key===(t.col||'todo'));
  const ni = idx + dir;
  if(ni<0 || ni>=TG_COLS.length) return;
  t.col = TG_COLS[ni].key; t.updated = Date.now();
  _saveTareasGerencia(); renderTareasGerencia();
}
export function tgMoveTo(id, colKey){
  const t = _tgFind(id); if(!t || !TG_COLS.some(c=>c.key===colKey) || t.col===colKey) return;
  t.col = colKey; t.updated = Date.now();
  _saveTareasGerencia(); renderTareasGerencia();
}
export async function tgDelete(id){
  const t = _tgFind(id); if(!t) return;
  if(!await confirmModal('¿Eliminar esta tarea?\n"'+ (t.title||'') +'"')) return;
  tareasGerencia = tareasGerencia.filter(x=>x && x.id!==id);
  _saveTareasGerencia();
  D.closeModal('tarea-gerencia-modal');
  renderTareasGerencia();
}

let _tgEditId = null;
export function openTareaGerencia(id, defCol){
  _tgEditId = id || null;
  const t = id ? _tgFind(id) : null;
  let ov = document.getElementById('tarea-gerencia-modal');
  if(!ov){ ov = document.createElement('div'); ov.id='tarea-gerencia-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  const cur = {
    title: t?.title || '',
    desc:  t?.desc  || '',
    col:   t?.col   || defCol || 'todo',
    prio:  t?.prio  || 'media',
    date:  t?.date  || '',
  };
  ov.innerHTML = `<div class="modal" style="max-width:440px">
    <button class="modal-close" onclick="closeModal('tarea-gerencia-modal')">✕</button>
    <div class="modal-title">${id?'Editar tarea':'Nueva tarea'}</div>
    <label class="form-label">Tarea</label>
    <input id="tg-f-title" class="form-input" placeholder="¿Qué hay que hacer o seguir?" value="${esc(cur.title)}">
    <label class="form-label" style="margin-top:10px">Detalle (opcional)</label>
    <textarea id="tg-f-desc" class="form-input" rows="3" placeholder="Notas, contexto...">${esc(cur.desc)}</textarea>
    <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">
      <div style="flex:1;min-width:110px">
        <label class="form-label">Estado</label>
        <select id="tg-f-col" class="form-input">${TG_COLS.map(c=>`<option value="${c.key}"${c.key===cur.col?' selected':''}>${esc(c.title)}</option>`).join('')}</select>
      </div>
      <div style="flex:1;min-width:110px">
        <label class="form-label">Prioridad</label>
        <select id="tg-f-prio" class="form-input">${Object.entries(TG_PRIO).map(([k,v])=>`<option value="${k}"${k===cur.prio?' selected':''}>${esc(v.label)}</option>`).join('')}</select>
      </div>
      <div style="flex:1;min-width:110px">
        <label class="form-label">Fecha límite (opcional)</label>
        <input id="tg-f-date" type="date" class="form-input" value="${esc(cur.date)}">
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px;align-items:center">
      ${id?`<button class="btn-secondary" style="color:var(--red-alert);margin-right:auto" onclick="tgDelete('${id}')">Eliminar</button>`:''}
      <button class="btn-secondary" onclick="closeModal('tarea-gerencia-modal')">Cancelar</button>
      <button class="btn-add" onclick="guardarTareaGerencia()">${id?'Guardar':'Agregar'}</button>
    </div>
  </div>`;
  ov.classList.add('open');
  setTimeout(()=>{ try{ document.getElementById('tg-f-title').focus(); }catch(e){} }, 30);
}
export function guardarTareaGerencia(){
  const el = id=>document.getElementById(id);
  const title = (el('tg-f-title')?.value||'').trim();
  if(!title){ showToast('Escribí la tarea'); return; }
  const desc = (el('tg-f-desc')?.value||'').trim();
  const col  = el('tg-f-col')?.value || 'todo';
  const prio = el('tg-f-prio')?.value || 'media';
  const date = el('tg-f-date')?.value || '';
  if(_tgEditId){
    const t = _tgFind(_tgEditId);
    if(t) Object.assign(t, { title, desc, col, prio, date, updated:Date.now() });
  } else {
    tareasGerencia.push({ id:_tgGenId(), title, desc, col, prio, date, created:Date.now(), updated:Date.now() });
  }
  _saveTareasGerencia();
  D.closeModal('tarea-gerencia-modal');
  renderTareasGerencia();
  showToast('Tarea guardada');
}