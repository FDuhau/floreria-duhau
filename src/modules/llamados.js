// Separado de app.js. Lo que necesita de app.js llega por configurarLlamados():
//   TODAY_ISO, closeModal, fbSave, floristaNombre, jardineroNombre, userRole

import { showToast } from './tema-toast.js';
import { CL_RESP_OPTS, CL_TASKS, calcDuracion, clState, fmtDur } from './checklist.js';
import { esc, fmtDate } from './utils.js';
import { comprimirImagen } from './imagenes.js';
import { legajoData } from './personal.js';
import { confirmModal } from './modales.js';
import { icon } from './iconos.js';

let D = {};
export function configurarLlamados(deps){ D = deps; }

// ── LLAMADOS DE ATENCIÓN (checklist floreria) ────────────────────────────────
// Gerencia saca una foto de un error en un arreglo y se lo envía al responsable.
// Queda registrado en RRHH › Evaluaciones como historial de errores por persona.
export let llamadosData = [];
window._setLlamadosData = (arr) => {
  llamadosData.splice(0, llamadosData.length, ...(Array.isArray(arr)?arr:Object.values(arr||{})));
  if(document.getElementById('page-checklist')?.classList.contains('active')) renderLlamadosChecklist();
  if(document.getElementById('page-evaluaciones')?.classList.contains('active')) renderLlamadosEval();
  notificarLlamados();
};

function _llamadosActivos(){ return llamadosData.filter(l=>l && !l.resuelto); }

let _fotoLlamadoData = '';
export function openLlamadoModal(){
  if(D.userRole!=='gerencia'){ showToast('Solo gerencia'); return; }
  _fotoLlamadoData = '';
  const zonaSel = document.getElementById('llamado-zona');
  if(zonaSel){
    const zonas = [...new Set(CL_TASKS.map(t=>t.zona))];
    zonaSel.innerHTML = '<option value="">— Arreglo / zona —</option>' + zonas.map(z=>`<option value="${esc(z)}">${esc(z)}</option>`).join('');
  }
  const persSel = document.getElementById('llamado-persona');
  if(persSel){
    persSel.innerHTML = '<option value="">— Responsable —</option>' + CL_RESP_OPTS.filter(n=>n!=='Jardineria').map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
  }
  document.getElementById('llamado-nota').value = '';
  document.getElementById('llamado-file').value = '';
  const p = document.getElementById('llamado-preview'); if(p){ p.src=''; p.style.display='none'; }
  document.getElementById('llamado-modal').classList.add('open');
}

// Al elegir el arreglo, autoseleccionar el responsable de esa zona (día actual)
export function llamadoOnZonaChange(){
  const zona = document.getElementById('llamado-zona').value;
  if(!zona) return;
  const idx = CL_TASKS.findIndex(t=>t.zona===zona);
  if(idx<0) return;
  const resp = (clState && clState.responsable && clState.responsable[idx]) || CL_TASKS[idx].responsable || '';
  const persSel = document.getElementById('llamado-persona');
  if(resp && persSel && [...persSel.options].some(o=>o.value===resp)) persSel.value = resp;
}

export function llamadoFotoPreview(input){
  const file = input.files[0]; if(!file) return;
  comprimirImagen(file, 1200, 0.7, data => {
    _fotoLlamadoData = data;
    const p = document.getElementById('llamado-preview');
    if(p){ p.src = data; p.style.display='block'; }
  });
}

export function guardarLlamado(){
  const zona = document.getElementById('llamado-zona').value;
  const persona = document.getElementById('llamado-persona').value;
  const nota = document.getElementById('llamado-nota').value.trim();
  if(!persona){ showToast('Elegí el responsable'); return; }
  if(!nota && !_fotoLlamadoData){ showToast('Agregá una nota o una foto'); return; }
  const leg = legajoData.find(l=>(l.nombre+' '+l.apellido).trim()===persona || l.nombre===persona);
  const ll = {
    id: Date.now(),
    empleadoNombre: persona,
    empleadoId: leg?leg.id:'',
    zona: zona||'',
    nota,
    foto: _fotoLlamadoData||'',
    fecha: D.TODAY_ISO,
    creado: Date.now(),
    por: window.currentUserLabel||'Gerencia',
    resuelto: false,
    visto: false,
  };
  llamadosData.unshift(ll);
  D.fbSave('llamadosData', llamadosData);
  window.pushSend?.('Llamado de atención', `${zona?zona+': ':''}${nota||'Revisá tu arreglo'}`, 'llamado', persona);
  D.closeModal('llamado-modal');
  renderLlamadosChecklist();
  showToast('Llamado enviado a '+persona+' y registrado en Evaluaciones');
}

const _llamadosAvisados = new Set();
function notificarLlamados(){
  if(D.userRole==='gerencia' || !D.floristaNombre) return;
  _llamadosActivos().filter(l=>l.empleadoNombre===D.floristaNombre && !l.visto).forEach(l=>{
    if(_llamadosAvisados.has(l.id)) return;
    _llamadosAvisados.add(l.id);
    showToast('Tenés un llamado de atención de gerencia');
    if(typeof Notification!=='undefined' && Notification.permission==='granted'){
      try{ new Notification('Llamado de atención', {body:`${l.zona?l.zona+': ':''}${l.nota||''}`, icon:'/icon-192.png', tag:'llamado'}); }catch(e){}
    }
  });
}

export function renderLlamadosChecklist(){
  const el = document.getElementById('cl-llamados');
  if(!el) return;
  let lista;
  if(D.userRole==='gerencia') lista = _llamadosActivos();
  else if(D.floristaNombre) lista = _llamadosActivos().filter(l=>l.empleadoNombre===D.floristaNombre);
  else lista = [];
  if(!lista.length){ el.innerHTML=''; return; }
  el.innerHTML = `<div class="jalert-wrap" style="border-color:#C99A00;background:var(--amber-soft)">
    <div class="jalert-hdr" style="color:var(--amber)">${lista.length} ${lista.length===1?'llamado de atención':'llamados de atención'}</div>
    ${lista.map(l=>`<div class="jalert-card">
      ${l.foto?`<img src="${l.foto}" class="jalert-foto" onclick="verFotoLlamado(${l.id})" alt="">`:''}
      <div class="jalert-body">
        <div class="jalert-tipo">${esc(l.zona||'Arreglo')}</div>
        ${D.userRole==='gerencia'?`<div class="jalert-zona">Para: ${esc(l.empleadoNombre)}</div>`:''}
        ${l.nota?`<div class="jalert-nota">${esc(l.nota)}</div>`:''}
        <div class="jalert-meta">${fmtDate(l.fecha)} · por ${esc(l.por||'gerencia')}</div>
      </div>
      <button class="jalert-btn" onclick="resolverLlamado(${l.id})">${D.userRole==='gerencia'?'✓ Cerrar':'✓ Entendido'}</button>
    </div>`).join('')}
  </div>`;
}

export function verFotoLlamado(id){
  const l = llamadosData.find(x=>x.id===id);
  if(!l?.foto) return;
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer';
  ov.innerHTML=`<img src="${l.foto}" style="max-width:94vw;max-height:90vh;border-radius:12px">`;
  ov.onclick=()=>ov.remove();
  document.body.appendChild(ov);
}

export async function resolverLlamado(id){
  const l = llamadosData.find(x=>x.id===id);
  if(!l) return;
  if(D.userRole==='gerencia' && !await confirmModal('¿Cerrar este llamado? Queda en el registro de Evaluaciones.')) return;
  l.resuelto = true; l.visto = true; l.resueltoFecha = D.TODAY_ISO;
  D.fbSave('llamadosData', llamadosData);
  renderLlamadosChecklist();
  if(document.getElementById('page-evaluaciones')?.classList.contains('active')) renderLlamadosEval();
  showToast('Listo');
}

export async function eliminarLlamado(id){
  if(D.userRole!=='gerencia') return;
  if(!await confirmModal('¿Eliminar este llamado del registro? Se borra la foto para siempre.')) return;
  const i = llamadosData.findIndex(x=>x.id===id);
  if(i>=0) llamadosData.splice(i,1);
  D.fbSave('llamadosData', llamadosData);
  renderLlamadosEval();
  showToast('Registro eliminado');
}

// Registro de llamados en RRHH › Evaluaciones (agrupado por persona)
export function renderLlamadosEval(){
  const el = document.getElementById('eval-llamados');
  if(!el) return;
  const search = (document.getElementById('ev-search')?.value||'').toLowerCase();
  let data = [...llamadosData];
  if(search) data = data.filter(l=>(l.empleadoNombre||'').toLowerCase().includes(search));
  if(!data.length){ el.innerHTML = `<div style="padding:16px;text-align:center;color:var(--mid-gray);font-size:13px">Sin llamados de atención registrados.</div>`; return; }
  const byPers = {};
  data.forEach(l=>{ (byPers[l.empleadoNombre]=byPers[l.empleadoNombre]||[]).push(l); });
  const personas = Object.keys(byPers).sort((a,b)=>byPers[b].length-byPers[a].length);
  el.innerHTML = personas.map(pers=>{
    const items = byPers[pers].sort((a,b)=>b.creado-a.creado);
    return `<div style="border:1px solid var(--light-gray);border-radius:10px;margin-bottom:12px;overflow:hidden">
      <div style="padding:10px 14px;background:var(--amber-soft);display:flex;justify-content:space-between;align-items:center">
        <strong style="color:var(--amber)">${esc(pers)}</strong>
        <span style="font-size:12px;color:var(--mid-gray)">${items.length} llamado${items.length!==1?'s':''}</span>
      </div>
      <div style="display:flex;flex-direction:column">
        ${items.map(l=>`<div style="display:flex;gap:10px;align-items:center;padding:9px 14px;border-top:1px solid var(--surface-2)">
          ${l.foto?`<img src="${l.foto}" onclick="verFotoLlamado(${l.id})" style="width:52px;height:52px;object-fit:cover;border-radius:6px;cursor:pointer;flex-shrink:0" alt="">`:'<div style="width:52px;height:52px;border-radius:6px;background:var(--surface-2);display:flex;align-items:center;justify-content:center;flex-shrink:0"></div>'}
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:var(--charcoal)">${esc(l.zona||'Arreglo')} ${l.resuelto?'<span style="font-size:12px;color:var(--green-ok)">✓ visto</span>':'<span style="font-size:12px;color:var(--amber)">pendiente</span>'}</div>
            ${l.nota?`<div style="font-size:12px;color:var(--mid-gray)">${esc(l.nota)}</div>`:''}
            <div style="font-size:12px;color:var(--mid-gray)">${fmtDate(l.fecha)} · por ${esc(l.por||'gerencia')}</div>
          </div>
          <button class="btn-icon" style="color:var(--red-alert)" title="Eliminar del registro" onclick="eliminarLlamado(${l.id})">✕</button>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

// ── Turno Florista ────────────────────────────────────────────────────────────
// Almacena check-in/checkout real de cada florista (separado del horario planificado)
// Firebase path: florTurnos/{nombre}/{YYYY-MM-DD}/{inicio, fin}

export function florRegistrarTurno(campo){
  if(!D.floristaNombre){ showToast('Error de sesión'); return; }
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  window.fbSetPath?.('florTurnos/'+D.floristaNombre+'/'+D.TODAY_ISO+'/'+campo, hh+':'+mm);
  if(!window.florTurnos) window.florTurnos = {};
  if(!window.florTurnos[D.floristaNombre]) window.florTurnos[D.floristaNombre] = {};
  if(!window.florTurnos[D.floristaNombre][D.TODAY_ISO]) window.florTurnos[D.floristaNombre][D.TODAY_ISO] = {};
  window.florTurnos[D.floristaNombre][D.TODAY_ISO][campo] = hh+':'+mm;
  // Usuario combinado (florista + jardinería, ej. Ivan): una sola jornada vale
  // para las dos áreas → reflejar el mismo inicio/fin en jardHorarios.
  if(D.jardineroNombre && D.jardineroNombre === D.floristaNombre){
    if(!window.jardHorarios) window.jardHorarios = {};
    if(!window.jardHorarios[D.floristaNombre]) window.jardHorarios[D.floristaNombre] = {};
    if(!window.jardHorarios[D.floristaNombre][D.TODAY_ISO]) window.jardHorarios[D.floristaNombre][D.TODAY_ISO] = {inicio:'',fin:'',tareas:0};
    window.jardHorarios[D.floristaNombre][D.TODAY_ISO][campo] = hh+':'+mm;
    window.fbSetPath?.('jardHorarios/'+D.floristaNombre+'/'+D.TODAY_ISO+'/'+campo, hh+':'+mm);
  }
  renderFlorTurnoCard();
  showToast(campo==='inicio' ? 'Jornada iniciada: '+hh+':'+mm : 'Jornada finalizada: '+hh+':'+mm);
}

export function florResetTurno(campo){
  if(!D.floristaNombre || !window.florTurnos?.[D.floristaNombre]?.[D.TODAY_ISO]) return;
  window.florTurnos[D.floristaNombre][D.TODAY_ISO][campo] = '';
  window.fbSetPath?.('florTurnos/'+D.floristaNombre+'/'+D.TODAY_ISO+'/'+campo, '');
  // Espejo para usuario combinado (ver florRegistrarTurno)
  if(D.jardineroNombre && D.jardineroNombre === D.floristaNombre && window.jardHorarios?.[D.floristaNombre]?.[D.TODAY_ISO]){
    window.jardHorarios[D.floristaNombre][D.TODAY_ISO][campo] = '';
    window.fbSetPath?.('jardHorarios/'+D.floristaNombre+'/'+D.TODAY_ISO+'/'+campo, '');
  }
  renderFlorTurnoCard();
}

export function renderFlorTurnoCard(){
  const el = document.getElementById('fl-turno-card');
  if(!el) return;
  if(D.userRole !== 'florista' || !D.floristaNombre){ el.innerHTML=''; return; }

  const turno = window.florTurnos?.[D.floristaNombre]?.[D.TODAY_ISO] || {};
  const inicio = turno.inicio||'', fin = turno.fin||'';
  const nowStr = new Date().getHours().toString().padStart(2,'0')+':'+new Date().getMinutes().toString().padStart(2,'0');
  const dur = inicio&&fin ? calcDuracion(inicio,fin) : (inicio ? calcDuracion(inicio,nowStr) : 0);

  // Progreso de tareas
  const day = window.currentDay;
  const dayState = (window.clStateByDay||{})[day]||window.clState||{};
  const resp = dayState.responsable||[], checked = dayState.checked||[];
  const myIdxs = resp.reduce((a,r,i)=>{ if(r===D.floristaNombre) a.push(i); return a; },[]);
  const myDone = myIdxs.filter(i=>checked[i]).length;
  const myTotal = myIdxs.length;
  const taskPct = myTotal>0 ? Math.round(myDone/myTotal*100) : 0;
  const taskColor = taskPct>=100?'var(--green-ok)':taskPct>=60?'#D4A820':'var(--mid-gray)';

  el.innerHTML = `<div class="prod-card prod-card-personal" style="display:flex;flex-direction:column;gap:12px">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span style="font-size:20px"></span>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;color:var(--mid-gray);margin-bottom:2px">Mi jornada de hoy</div>
        <div style="font-size:17px;font-weight:700;color:var(--charcoal)">${esc(D.floristaNombre)}</div>
      </div>
      ${myTotal > 0 ? `<div style="text-align:center;min-width:60px">
        <div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Tareas</div>
        <div style="font-size:26px;font-weight:700;color:${taskColor}">${myDone}/${myTotal}</div>
      </div>` : ''}
      ${dur > 0 ? `<div style="text-align:center;min-width:70px">
        <div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">${fin?'Horas':'Transcurrido'}</div>
        <div style="font-size:22px;font-weight:700;color:${fin?'var(--charcoal)':'var(--green-ok)'}">${fmtDur(dur)}</div>
      </div>` : ''}
    </div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--light-gray)">
      <span style="font-size:12px;color:var(--mid-gray);font-weight:600">Jornada:</span>
      ${inicio
        ? `<span onclick="florResetTurno('inicio')" title="Tocar para borrar" style="font-size:13px;font-weight:700;color:var(--accent);background:var(--ok-soft);padding:4px 12px;border-radius:8px;cursor:pointer">▶ ${inicio}</span>`
        : `<button class="btn-hora-inicio" onclick="florRegistrarTurno('inicio')">${icon('play')}Inicio de jornada</button>`}
      ${fin
        ? `<span onclick="florResetTurno('fin')" title="Tocar para borrar" style="font-size:13px;font-weight:700;color:var(--red-alert);background:var(--alert-soft);padding:4px 12px;border-radius:8px;cursor:pointer">${icon('stop')}${fin}</span>`
        : inicio ? `<button class="btn-hora-fin" onclick="florRegistrarTurno('fin')">${icon('stop')}Fin de jornada</button>` : ''}
    </div>
  </div>`;
}