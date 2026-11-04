// ── PERSONAL: LEGAJOS, EVALUACIONES Y HORAS EXTRA ───────────────────────────
// Legajo digital (con documentos), faltas, evaluaciones de desempeño y
// liquidación de horas extra.
// Separado de app.js. Lo que necesita de app.js llega por configurarPersonal():
//   TODAY_ISO, _empleadosLegajoOpts, _mismoNombre, _nombreAppLegajo, calcHorasDia, closeModal, fbSave, getEmpleadosActivos, initPerfPanel, jornadaRealDia, renderLlamadosEval, renderPerfEmpleado

import { esc, fmtDate } from './utils.js';
import { validarCampos } from './validacion.js';
import { showToast } from './tema-toast.js';
import { confirmModal } from './modales.js';
import { icon } from './iconos.js';
import { comprimirImagen } from './imagenes.js';
import { resolverFoto } from './fotos.js';
import { horasExtra } from './dinero.js';

let D = {};
export function configurarPersonal(deps){ D = deps; }

// ════════════════════════════════════════
// FEATURE 1: LEGAJO DIGITAL DE EMPLEADOS
// ════════════════════════════════════════
export let legajoData = [];
window._setLegajoData = arr => { legajoData = arr; };

export function renderLegajo(){
  const grid = document.getElementById('legajo-grid');
  if(!grid) return;
  if(!legajoData.length){
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--mid-gray)">Sin empleados registrados. Agregá el primero.</div>';
    return;
  }
  grid.innerHTML = legajoData.map((e,i)=>{
    const vac = (e.vacacionesAnuales||14) - (e.vacacionesTomadas||0);
    const esMono = e.tipo==='monotributista';
    const tipoBadge = esMono
      ? `<span style="background:#F3ECDD;color:#8A6D1F;padding:2px 8px;border-radius:20px;font-size:12px;font-weight:600">Monotributista · quincenal</span>`
      : `<span style="background:#E8EEF4;color:var(--info);padding:2px 8px;border-radius:20px;font-size:12px;font-weight:600">Nómina · mensual</span>`;
    return `<div class="card">
      <div style="font-size:16px;font-weight:600;margin-bottom:4px">${esc(e.nombre)} ${esc(e.apellido)}</div>
      <div style="font-size:12px;color:var(--mid-gray);margin-bottom:6px;text-transform:capitalize">${esc(e.cargo||'')}${e.sucursal?' · '+esc(e.sucursal):''}</div>
      <div style="font-size:12px;color:var(--mid-gray);margin-bottom:6px">Usuario en la app: <strong>${esc(D._nombreAppLegajo(e))}</strong></div>
      <div style="margin-bottom:8px">${tipoBadge}</div>
      <div style="font-size:12px;margin-bottom:4px">Ingreso: <strong>${e.fechaIngreso ? fmtDate(e.fechaIngreso) : '—'}</strong></div>
      <div style="font-size:12px;margin-bottom:4px">${esMono?'Horas ref.':'Horas contrato'}: <strong>${(+e.horasContrato||0)}h/mes</strong></div>
      <div style="font-size:12px;margin-bottom:12px">Vacaciones restantes: <strong>${vac}</strong> días</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn-secondary" style="font-size:12px" onclick="verDetalleLegajo(${i})">Ver detalle</button>
        <button class="btn-secondary" style="font-size:12px" onclick="openLegajoModal(${i})">Editar</button>
        <button class="btn-icon" style="color:var(--red-alert)" onclick="eliminarLegajo(${i})">✕</button>
      </div>
    </div>`;
  }).join('');
}

export function openLegajoModal(idx){
  const e = idx >= 0 ? legajoData[idx] : {};
  document.getElementById('legajo-modal-title').textContent = idx >= 0 ? 'Editar Empleado' : 'Nuevo Empleado';
  document.getElementById('leg-idx').value = idx;
  document.getElementById('leg-nombre').value = e.nombre||'';
  document.getElementById('leg-apellido').value = e.apellido||'';
  document.getElementById('leg-dni').value = e.dni||'';
  document.getElementById('leg-fechaIngreso').value = e.fechaIngreso||'';
  const usuarios = D.getEmpleadosActivos();
  const actualUsr = idx >= 0 ? D._nombreAppLegajo(e) : '';
  if(actualUsr && !usuarios.includes(actualUsr)) usuarios.push(actualUsr);
  document.getElementById('leg-usuario').innerHTML = '<option value="">— Sin usuario (usa el nombre) —</option>' +
    usuarios.sort((a,b)=>a.localeCompare(b,'es')).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
  document.getElementById('leg-usuario').value = actualUsr;
  document.getElementById('leg-cargo').value = e.cargo||'florista';
  document.getElementById('leg-sucursal').value = e.sucursal||'';
  document.getElementById('leg-tipo').value = e.tipo || 'nomina';
  document.getElementById('leg-horasContrato').value = e.horasContrato||'';
  document.getElementById('leg-vacacionesAnuales').value = e.vacacionesAnuales||14;
  document.getElementById('leg-vacacionesTomadas').value = e.vacacionesTomadas||0;
  document.getElementById('leg-notas').value = e.notas||'';
  legTipoOnChange();
  document.getElementById('legajo-modal').classList.add('open');
}

// Ajusta el rótulo de "Horas por contrato" según el tipo: los monotributistas
// no tienen horas de contrato fijas (se factura por horas reales trabajadas).
export function legTipoOnChange(){
  const tipo = document.getElementById('leg-tipo')?.value || 'nomina';
  const lbl = document.getElementById('leg-horasContrato-label');
  if(lbl) lbl.textContent = tipo==='monotributista' ? 'Horas de referencia (h/mes, opcional)' : 'Horas por contrato (h/mes)';
}

export function guardarLegajo(){
  const idx = +document.getElementById('leg-idx').value;
  const nombre = document.getElementById('leg-nombre').value.trim();
  const apellido = document.getElementById('leg-apellido').value.trim();
  if(!validarCampos([{ id:'leg-nombre', req:true, msg:'Escribí el nombre' }])) return;
  const obj = {
    id: idx >= 0 ? legajoData[idx].id : Date.now(),
    nombre, apellido,
    usuario: document.getElementById('leg-usuario').value || '',
    dni: document.getElementById('leg-dni').value.trim(),
    fechaIngreso: document.getElementById('leg-fechaIngreso').value,
    cargo: document.getElementById('leg-cargo').value,
    sucursal: document.getElementById('leg-sucursal').value.trim(),
    tipo: document.getElementById('leg-tipo').value || 'nomina',
    horasContrato: +document.getElementById('leg-horasContrato').value||0,
    vacacionesAnuales: +document.getElementById('leg-vacacionesAnuales').value||14,
    vacacionesTomadas: +document.getElementById('leg-vacacionesTomadas').value||0,
    notas: document.getElementById('leg-notas').value.trim(),
    documentos: idx >= 0 ? (legajoData[idx].documentos||[]) : []
  };
  if(idx >= 0) legajoData[idx] = obj; else legajoData.push(obj);
  D.fbSave('legajoData', legajoData);
  D.closeModal('legajo-modal');
  renderLegajo();
  showToast('Empleado guardado');
}

export async function eliminarLegajo(idx){
  if(!await confirmModal('¿Eliminar este empleado del legajo?')) return;
  legajoData.splice(idx,1);
  D.fbSave('legajoData', legajoData);
  renderLegajo();
}

export let _legDetIdx = -1;

// Resumen de faltas del año en curso para el detalle del legajo.
function _legFaltasHTML(e){
  const anio = D.TODAY_ISO.slice(0,4);
  const fs = faltasData.filter(f=>(f.fecha||'').startsWith(anio)
    && D._mismoNombre(f.empleado, D._nombreAppLegajo(e)));
  const inj = fs.filter(f=>!f.justificada).length;
  return `<div style="margin-bottom:12px"><div class="card-label">Faltas ${anio}</div>
    <div>${fs.length ? `${fs.length} falta${fs.length!==1?'s':''} · <span style="color:var(--green-ok)">${fs.length-inj} justificada${fs.length-inj!==1?'s':''}</span> · <span style="color:${inj?'var(--red-alert)':'var(--mid-gray)'};font-weight:${inj?600:400}">${inj} sin justificar</span>` : 'Sin faltas registradas'}</div></div>`;
}

export function verDetalleLegajo(idx){
  const e = legajoData[idx];
  if(!e) return;
  _legDetIdx = idx;
  const vac = (e.vacacionesAnuales||14) - (e.vacacionesTomadas||0);
  document.getElementById('leg-det-titulo').textContent = `${e.nombre} ${e.apellido}`;
  document.getElementById('leg-det-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div><div class="card-label">DNI</div><div>${esc(e.dni||'—')}</div></div>
      <div><div class="card-label">Cargo</div><div style="text-transform:capitalize">${esc(e.cargo||'—')}</div></div>
      <div><div class="card-label">Contratación</div><div>${e.tipo==='monotributista'?'Monotributista · cobra quincenal':'En nómina · cobra mensual'}</div></div>
      <div><div class="card-label">Sucursal</div><div>${esc(e.sucursal||'—')}</div></div>
      <div><div class="card-label">Fecha Ingreso</div><div>${e.fechaIngreso ? fmtDate(e.fechaIngreso) : '—'}</div></div>
      <div><div class="card-label">Horas por contrato</div><div>${(+e.horasContrato||0)}h/mes</div></div>
      <div><div class="card-label">Vacaciones Restantes</div><div>${vac} días (${e.vacacionesAnuales||14} anuales / ${e.vacacionesTomadas||0} tomadas)</div></div>
    </div>
    ${_legFaltasHTML(e)}
    <button class="btn-secondary" style="font-size:12px;margin-bottom:14px" onclick="legVerProductividad()">Ver historial y productividad</button>
    ${e.notas ? `<div class="card-label">Notas</div><div style="white-space:pre-wrap;font-size:13px;margin-bottom:8px">${esc(e.notas)}</div>` : ''}
    ${_legDocsHTML(e, idx)}
  `;
  document.getElementById('legajo-detalle-modal').classList.add('open');
}

// ── Documentación del legajo (contrato, alta de ARCA, otros) ──────────────────
// Los archivos se guardan como data URI en Firebase (imágenes comprimidas, PDFs
// tal cual). Límite por archivo para no inflar la base.
const _LEG_DOC_MAX = 5 * 1024 * 1024; // 5 MB

function _legDocNombre(tipo, fileName){
  if(tipo==='contrato') return 'Contrato de trabajo';
  if(tipo==='arca')     return 'Alta de ARCA';
  return fileName || 'Documento';
}

function _legDocMimeLabel(d){ return (d.mime==='application/pdf') ? 'PDF' : 'Imagen'; }

function _legDocSlot(e, idx, tipo, icono, label){
  const doc = (e.documentos||[]).find(d=>d.tipo===tipo);
  if(doc){
    return `<div class="leg-doc-row">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600">${icono} ${esc(label)}</div>
        <div style="font-size:12px;color:var(--mid-gray)">${esc(doc.nombre)}${doc.fecha?' · '+fmtDate(doc.fecha):''} · ${_legDocMimeLabel(doc)}</div>
      </div>
      <button class="btn-secondary" style="font-size:12px" onclick="legVerDoc(${idx},${doc.id})">Ver</button>
      <label class="btn-secondary" style="font-size:12px;cursor:pointer;margin:0">Reemplazar<input type="file" accept="image/*,application/pdf" style="display:none" onchange="legSubirDoc('${tipo}',this)"></label>
      <button class="btn-icon" style="color:var(--red-alert)" title="Eliminar" onclick="legEliminarDoc(${idx},${doc.id})">✕</button>
    </div>`;
  }
  return `<div class="leg-doc-row leg-doc-empty">
    <div style="flex:1;min-width:0">
      <div style="font-size:13px;font-weight:600;color:var(--mid-gray)">${icono} ${esc(label)}</div>
      <div style="font-size:12px;color:var(--mid-gray)">Sin cargar</div>
    </div>
    <label class="btn-add" style="font-size:12px;cursor:pointer;margin:0">${icon('upload')}Subir<input type="file" accept="image/*,application/pdf" style="display:none" onchange="legSubirDoc('${tipo}',this)"></label>
  </div>`;
}

function _legDocsHTML(e, idx){
  const otros = (e.documentos||[]).filter(d=>d.tipo==='otro');
  const otrosHTML = otros.map(d=>`<div class="leg-doc-row">
    <div style="flex:1;min-width:0">
      <div style="font-size:13px">${esc(d.nombre)}</div>
      <div style="font-size:12px;color:var(--mid-gray)">${d.fecha?fmtDate(d.fecha):''} · ${_legDocMimeLabel(d)}</div>
    </div>
    <button class="btn-secondary" style="font-size:12px" onclick="legVerDoc(${idx},${d.id})">Ver</button>
    <button class="btn-icon" style="color:var(--red-alert)" title="Eliminar" onclick="legEliminarDoc(${idx},${d.id})">✕</button>
  </div>`).join('');
  return `<div class="card-label" style="margin-top:14px">Documentación</div>
    ${_legDocSlot(e, idx, 'contrato', '', 'Contrato de trabajo')}
    ${_legDocSlot(e, idx, 'arca', '', 'Alta de ARCA')}
    ${otrosHTML}
    <label class="btn-secondary" style="font-size:12px;cursor:pointer;margin-top:4px;display:inline-block">+ Agregar otro documento<input type="file" accept="image/*,application/pdf" style="display:none" onchange="legSubirDoc('otro',this)"></label>
    <div style="font-size:12px;color:var(--mid-gray);margin-top:6px">PDF o foto, hasta 5 MB por archivo. Se sincroniza con el equipo.</div>`;
}

export function legSubirDoc(tipo, input){
  const file = input.files && input.files[0]; if(!file) return;
  const idx = _legDetIdx;
  const e = legajoData[idx];
  if(!e){ input.value=''; return; }
  if(file.size > _LEG_DOC_MAX){
    showToast('El archivo supera 5 MB. Subí un PDF más liviano o una foto de menor calidad.','error');
    input.value=''; return;
  }
  input.value='';
  const finalizar = (dataUrl, mime) => {
    if(!Array.isArray(e.documentos)) e.documentos = [];
    const doc = { id: Date.now(), tipo, nombre: _legDocNombre(tipo, file.name), mime, url: dataUrl, fecha: new Date().toISOString().slice(0,10) };
    if(tipo === 'otro'){
      e.documentos.push(doc);
    } else {
      const ex = e.documentos.findIndex(d=>d.tipo===tipo);
      if(ex>=0) e.documentos[ex] = doc; else e.documentos.push(doc);
    }
    D.fbSave('legajoData', legajoData);
    verDetalleLegajo(idx);
    showToast('Documento cargado ');
  };
  if(file.type === 'application/pdf'){
    const r = new FileReader();
    r.onload = ev => finalizar(ev.target.result, 'application/pdf');
    r.readAsDataURL(file);
  } else if(file.type.startsWith('image/')){
    comprimirImagen(file, 1400, 0.72, data => finalizar(data, 'image/jpeg'));
  } else {
    showToast('Formato no soportado. Subí un PDF o una imagen.','error');
  }
}

export async function legVerDoc(idx, docId){
  const e = legajoData[idx]; if(!e) return;
  const doc = (e.documentos||[]).find(d=>d.id===docId); if(!doc || !doc.url) return;
  const docUrl = await resolverFoto(doc.url);
  if(!docUrl){ showToast('No se pudo cargar el documento (¿sin conexión?)','error'); return; }
  try{
    const [meta, b64] = docUrl.split(',');
    const mime = (meta.match(/data:([^;]+)/)||[])[1] || doc.mime || 'application/octet-stream';
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: mime });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(()=>URL.revokeObjectURL(url), 60000);
  }catch(err){
    window.open(docUrl, '_blank');
  }
}

export async function legEliminarDoc(idx, docId){
  const e = legajoData[idx]; if(!e) return;
  if(!await confirmModal('¿Eliminar este documento del legajo?')) return;
  e.documentos = (e.documentos||[]).filter(d=>d.id!==docId);
  D.fbSave('legajoData', legajoData);
  verDetalleLegajo(idx);
}

// ════════════════════════════════════════
// FEATURE 2: EVALUACIONES DE DESEMPEÑO
// ════════════════════════════════════════
export let evaluacionesData = [];
window._setEvaluacionesData = arr => { evaluacionesData = arr; };

// ── Faltas / inasistencias (RRHH › Evaluaciones) ─────────────────────────────
// Registro manual de gerencia: {id, empleado, fecha, motivo, obs, justificada}.
let faltasData = [];
window._setFaltasData = arr => { faltasData = arr; };

export function _faltasDe(nombre){ return faltasData.filter(f=>D._mismoNombre(f.empleado, nombre)); }

export function renderFaltas(){
  const tbody = document.getElementById('faltas-tbody');
  if(!tbody) return;
  const opts = D._empleadosLegajoOpts();
  const selEmp = document.getElementById('falta-empleado');
  const selFil = document.getElementById('falta-filtro-emp');
  const vEmp = selEmp.value, vFil = selFil.value;
  selEmp.innerHTML = '<option value="">— Seleccionar —</option>' + opts;
  selFil.innerHTML = '<option value="">Todos los empleados</option>' + opts;
  selEmp.value = vEmp; selFil.value = vFil;
  const fecha = document.getElementById('falta-fecha');
  if(!fecha.value) fecha.value = D.TODAY_ISO;
  const fMes = document.getElementById('falta-filtro-mes');
  if(!fMes.dataset.init){ fMes.value = D.TODAY_ISO.slice(0,7); fMes.dataset.init = '1'; }

  const mes = fMes.value, just = document.getElementById('falta-filtro-just').value;
  const lista = faltasData
    .filter(f=>(!vFil || D._mismoNombre(f.empleado, vFil)) && (!mes || (f.fecha||'').startsWith(mes)))
    .sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));

  // Resumen por persona (según empleado/mes filtrados, sin el filtro de justificación)
  const porEmp = {};
  lista.forEach(f=>{ const o = porEmp[f.empleado] ||= {total:0, inj:0}; o.total++; if(!f.justificada) o.inj++; });
  document.getElementById('faltas-resumen').innerHTML = Object.entries(porEmp)
    .sort((a,b)=>b[1].total-a[1].total)
    .map(([n,o])=>`<span style="font-size:12px;padding:4px 10px;border-radius:14px;background:#F7F5F0;border:1px solid var(--light-gray)">
      <strong>${esc(n)}</strong>: ${o.total} falta${o.total!==1?'s':''}${o.inj?` · <span style="color:var(--red-alert);font-weight:600">${o.inj} sin justificar</span>`:' · <span style="color:var(--green-ok)">todas justificadas</span>'}</span>`).join('');

  const filas = lista.filter(f=> just==='si' ? f.justificada : just==='no' ? !f.justificada : true);
  tbody.innerHTML = filas.length ? filas.map(f=>`<tr>
    <td style="white-space:nowrap">${fmtDate(f.fecha)}</td>
    <td><strong>${esc(f.empleado)}</strong></td>
    <td>${esc(f.motivo||'—')}</td>
    <td style="font-size:12px;color:var(--mid-gray)">${esc(f.obs||'')}</td>
    <td style="text-align:center"><label style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:${f.justificada?'var(--green-ok)':'var(--red-alert)'}">
      <input type="checkbox" ${f.justificada?'checked':''} onchange="toggleFaltaJustificada(${f.id},this.checked)" style="width:17px;height:17px">${f.justificada?'Sí':'No'}</label></td>
    <td><button class="btn-icon" style="color:var(--red-alert)" title="Eliminar" onclick="eliminarFalta(${f.id})">✕</button></td>
  </tr>`).join('') : '<tr><td colspan="6" style="padding:18px;text-align:center;color:var(--mid-gray)">Sin faltas registradas para este filtro.</td></tr>';
}

export async function agregarFalta(){
  const empleado = document.getElementById('falta-empleado').value;
  const fecha = document.getElementById('falta-fecha').value;
  if(!empleado || !fecha){ showToast('Elegí el empleado y la fecha.','error'); return; }
  if(faltasData.some(f=>D._mismoNombre(f.empleado, empleado) && f.fecha===fecha)
     && !await confirmModal(`${empleado} ya tiene una falta cargada el ${fmtDate(fecha)}. ¿Agregar otra igual?`)) return;
  faltasData.push({
    id: Date.now(), empleado, fecha,
    motivo: document.getElementById('falta-motivo').value,
    obs: document.getElementById('falta-obs').value.trim(),
    justificada: document.getElementById('falta-justificada').checked,
  });
  D.fbSave('faltasData', faltasData);
  document.getElementById('falta-obs').value = '';
  document.getElementById('falta-justificada').checked = false;
  renderFaltas(); D.renderPerfEmpleado();
  showToast('Falta registrada');
}

export function toggleFaltaJustificada(id, val){
  const f = faltasData.find(x=>x.id===id); if(!f) return;
  f.justificada = !!val;
  D.fbSave('faltasData', faltasData);
  renderFaltas(); D.renderPerfEmpleado();
}

export async function eliminarFalta(id){
  if(!await confirmModal('¿Eliminar esta falta?')) return;
  faltasData = faltasData.filter(x=>x.id!==id);
  D.fbSave('faltasData', faltasData);
  renderFaltas(); D.renderPerfEmpleado();
}

export function renderEvaluaciones(){
  D.renderLlamadosEval();
  renderFaltas();
  D.initPerfPanel();
  D.renderPerfEmpleado();
  const tbody = document.getElementById('eval-tbody');
  if(!tbody) return;
  const search = (document.getElementById('ev-search')?.value||'').toLowerCase();
  const filterTrim = document.getElementById('ev-filter-trim')?.value||'';
  const trimSel = document.getElementById('ev-filter-trim');
  if(trimSel){
    const trimActual = trimSel.value;
    const trims = [...new Set(evaluacionesData.map(e=>e.trimestre).filter(Boolean))].sort().reverse();
    trimSel.innerHTML = '<option value="">— Todos los trimestres —</option>' + trims.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');
    trimSel.value = trimActual;
  }
  let data = evaluacionesData;
  if(search) data = data.filter(e=>(e.empleadoNombre||'').toLowerCase().includes(search));
  if(filterTrim) data = data.filter(e=>e.trimestre===filterTrim);
  if(!data.length){
    tbody.innerHTML = `<tr><td colspan="9" style="padding:20px;text-align:center;color:var(--mid-gray)">Sin evaluaciones.</td></tr>`;
    return;
  }
  const stars = n => '★'.repeat(Math.round(n||0))+'☆'.repeat(5-Math.round(n||0));
  const badge = p => {
    const cls = p>=4?'green':p>=3?'amber':'red';
    return `<span class="card-value ${cls}" style="font-size:13px">${p.toFixed(1)}</span>`;
  };
  tbody.innerHTML = data.map((e)=>{
    const realIdx = evaluacionesData.indexOf(e);
    const prom = ((+e.puntualidad||0)+(+e.calidad||0)+(+e.actitud||0)+(+e.productividad||0))/4;
    return `<tr>
      <td>${esc(e.empleadoNombre||'')}</td>
      <td>${esc(e.trimestre||'')}</td>
      <td title="${e.puntualidad}/5">${stars(e.puntualidad)}</td>
      <td title="${e.calidad}/5">${stars(e.calidad)}</td>
      <td title="${e.actitud}/5">${stars(e.actitud)}</td>
      <td title="${e.productividad}/5">${stars(e.productividad)}</td>
      <td>${badge(prom)}</td>
      <td>${esc(e.evaluador||'')}</td>
      <td>
        <button class="btn-secondary" style="font-size:12px" onclick="openEvaluacionModal(${realIdx})">Editar</button>
        <button class="btn-icon" style="color:var(--red-alert)" onclick="eliminarEvaluacion(${realIdx})">✕</button>
      </td>
    </tr>`;
  }).join('');
}

export function openEvaluacionModal(idx){
  const e = idx >= 0 ? evaluacionesData[idx] : {};
  document.getElementById('evaluacion-modal-title').textContent = idx >= 0 ? 'Editar Evaluación' : 'Nueva Evaluación';
  document.getElementById('eval-idx').value = idx;
  const empSel = document.getElementById('eval-empleado');
  empSel.innerHTML = '<option value="">— Seleccionar empleado —</option>' +
    legajoData.map(l=>{ const n=((l.nombre||'')+' '+(l.apellido||'')).trim(); return `<option value="${l.id}" data-nombre="${esc(n)}">${esc(n)}</option>`; }).join('');
  if(e.empleadoId) empSel.value = e.empleadoId;
  document.getElementById('eval-trimestre').value = e.trimestre||'';
  document.getElementById('eval-puntualidad').value = e.puntualidad||3;
  document.getElementById('eval-calidad').value = e.calidad||3;
  document.getElementById('eval-actitud').value = e.actitud||3;
  document.getElementById('eval-productividad').value = e.productividad||3;
  document.getElementById('eval-comentarios').value = e.comentarios||'';
  document.getElementById('eval-evaluador').value = e.evaluador||'';
  document.getElementById('evaluacion-modal').classList.add('open');
}

export function guardarEvaluacion(){
  const idx = +document.getElementById('eval-idx').value;
  const empSel = document.getElementById('eval-empleado');
  const empleadoId = empSel.value;
  const empleadoNombre = empSel.options[empSel.selectedIndex]?.dataset?.nombre||'';
  const trimestre = document.getElementById('eval-trimestre').value.trim();
  if(!empleadoId || !trimestre){ showToast('Empleado y trimestre son requeridos.','error'); return; }
  const obj = {
    id: idx >= 0 ? evaluacionesData[idx].id : Date.now(),
    empleadoId, empleadoNombre, trimestre,
    puntualidad: +document.getElementById('eval-puntualidad').value||3,
    calidad: +document.getElementById('eval-calidad').value||3,
    actitud: +document.getElementById('eval-actitud').value||3,
    productividad: +document.getElementById('eval-productividad').value||3,
    comentarios: document.getElementById('eval-comentarios').value.trim(),
    evaluador: document.getElementById('eval-evaluador').value.trim(),
    fecha: D.TODAY_ISO
  };
  if(idx >= 0) evaluacionesData[idx] = obj; else evaluacionesData.push(obj);
  D.fbSave('evaluacionesData', evaluacionesData);
  D.closeModal('evaluacion-modal');
  renderEvaluaciones();
  showToast('Evaluación guardada');
}

export async function eliminarEvaluacion(idx){
  if(!await confirmModal('¿Eliminar esta evaluación?')) return;
  evaluacionesData.splice(idx,1);
  D.fbSave('evaluacionesData', evaluacionesData);
  renderEvaluaciones();
}

// ════════════════════════════════════════
// FEATURE 3: LIQUIDACIÓN HORAS EXTRA
// ════════════════════════════════════════
export let liquidacionConfig = { horasEsperadas: 192, horas: {} };
window._setLiquidacionConfig = v => { if(v) liquidacionConfig = v; };

// Suma de horas PROGRAMADAS (calendario horariosData) de una persona en un mes 'YYYY-MM'
function liqProgramadasMes(name, mes){
  const data = (window.horariosData||{})[name] || {};
  let h = 0;
  for(const iso in data){ if(iso.startsWith(mes)){ const d = data[iso]||{}; h += D.calcHorasDia(d.desde, d.hasta); } }
  return Math.round(h*10)/10;
}
// Suma de horas TRABAJADAS reales (jornada fichada) de una persona en un mes 'YYYY-MM'
function liqTrabajadasMes(name, mes){
  const dias = new Set([
    ...Object.keys((window.florTurnos||{})[name]||{}),
    ...Object.keys((window.jardHorarios||{})[name]||{})
  ]);
  let h = 0;
  dias.forEach(iso => { if(iso.startsWith(mes)){ const r = D.jornadaRealDia(name, iso); if(r) h += r.horas; } });
  return Math.round(h*10)/10;
}
// Empareja un empleado del legajo con su nombre en el calendario (match flexible)
export function liqNombreCalendario(e){
  if(e.usuario) return e.usuario;
  const cands = D.getEmpleadosActivos();
  const nom = (e.nombre||'').trim().toLowerCase();
  const full = ((e.nombre||'')+' '+(e.apellido||'')).trim().toLowerCase();
  if(!nom) return null;
  let m = cands.find(c => c.toLowerCase() === nom);
  if(m) return m;
  m = cands.find(c => nom.startsWith(c.toLowerCase()) || c.toLowerCase().startsWith(nom));
  if(m) return m;
  m = cands.find(c => full.includes(c.toLowerCase()));
  return m || null;
}
// Calcula la fila de liquidación de un empleado (programadas/trabajadas auto del
// calendario, con override editable guardado en liquidacionConfig).
function liqFilaDatos(e, mes){
  const mesData = (liquidacionConfig.horas||{})[mes]||{};
  const ov = mesData[e.id] || {};
  const calName = liqNombreCalendario(e);
  const autoProg = calName ? liqProgramadasMes(calName, mes) : 0;
  const autoTrab = calName ? liqTrabajadasMes(calName, mes) : 0;
  const progEdit = ov.programadas != null && ov.programadas !== '';
  const trabEdit = ov.trabajadas != null && ov.trabajadas !== '';
  const prog = progEdit ? +ov.programadas : autoProg;
  const trab = trabEdit ? +ov.trabajadas : autoTrab;
  const valHora = +(ov.valorHora||0);
  const { hExtra, adicional } = horasExtra(prog, trab, valHora);
  return { calName, autoProg, autoTrab, progEdit, trabEdit, prog, trab, valHora, hExtra, adicional };
}

export function renderLiquidacion(){
  const tbody = document.getElementById('liq-tbody');
  const summary = document.getElementById('liq-summary');
  if(!tbody) return;
  const mesEl = document.getElementById('liq-mes');
  if(!mesEl.value){
    const now = new Date();
    mesEl.value = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  }
  const mes = mesEl.value;
  const empleados = legajoData.filter(e=>e.cargo !== '__inactivo__');
  if(!empleados.length){
    tbody.innerHTML = `<tr><td colspan="8" style="padding:20px;text-align:center;color:var(--mid-gray)">Sin empleados en el legajo.</td></tr>`;
    return;
  }
  let totalExtra = 0, totalPesos = 0;
  tbody.innerHTML = empleados.map((e)=>{
    const d = liqFilaDatos(e, mes);
    totalExtra += d.hExtra;
    totalPesos += d.adicional;
    const sinCal = d.calName ? '' : ' <span style="font-size:12px;color:var(--amber)" title="No se encontró su horario en el calendario; cargá las horas a mano"></span>';
    return `<tr>
      <td>${esc(e.nombre)} ${esc(e.apellido)}${sinCal}</td>
      <td style="text-transform:capitalize">${esc(e.cargo||'')}</td>
      <td><input class="form-input" type="number" min="0" step="0.5" value="${d.progEdit?esc(String(d.prog)):''}" placeholder="${d.autoProg||0}" title="Horas programadas del calendario (editable)" style="width:80px;padding:4px 8px;text-align:center" onchange="saveLiquidacionHoras(${e.id},'${mes}','programadas',this.value)"></td>
      <td><input class="form-input" type="number" min="0" step="0.5" value="${d.trabEdit?esc(String(d.trab)):''}" placeholder="${d.autoTrab||0}" title="Horas trabajadas reales según fichaje (editable)" style="width:80px;padding:4px 8px;text-align:center" onchange="saveLiquidacionHoras(${e.id},'${mes}','trabajadas',this.value)"></td>
      <td style="text-align:center;font-weight:700;color:${d.hExtra>0?'var(--sage-dark)':'var(--mid-gray)'}">${d.hExtra}</td>
      <td><input class="form-input" type="number" min="0" value="${d.valHora||''}" placeholder="$" style="width:90px;padding:4px 8px;text-align:right" onchange="saveLiquidacionHoras(${e.id},'${mes}','valorHora',this.value)"></td>
      <td style="text-align:right;font-weight:600">${d.adicional ? '$'+d.adicional.toLocaleString('es-AR',{minimumFractionDigits:2}) : '<span style="color:var(--mid-gray)">—</span>'}</td>
    </tr>`;
  }).join('');
  if(summary) summary.innerHTML = `
    <div class="cards-grid cards-grid-3">
      <div class="card"><div class="card-label">Total Horas Extra del Equipo</div><div class="card-value">${totalExtra.toFixed(1)} hs</div></div>
      <div class="card"><div class="card-label">Total a Liquidar</div><div class="card-value green">$${totalPesos.toLocaleString('es-AR',{minimumFractionDigits:2})}</div></div>
      <div class="card"><div class="card-label">Empleados</div><div class="card-value">${empleados.length}</div></div>
    </div>`;
}

export function saveLiquidacionHoras(empleadoId, mes, field, val){
  if(!liquidacionConfig.horas) liquidacionConfig.horas = {};
  if(!liquidacionConfig.horas[mes]) liquidacionConfig.horas[mes] = {};
  if(!liquidacionConfig.horas[mes][empleadoId]) liquidacionConfig.horas[mes][empleadoId] = {};
  const s = (val==null ? '' : String(val)).trim();
  if(s === ''){
    // Vacío = volver al valor automático del calendario
    delete liquidacionConfig.horas[mes][empleadoId][field];
  } else {
    liquidacionConfig.horas[mes][empleadoId][field] = +s;
  }
  D.fbSave('liquidacionConfig', liquidacionConfig);
  renderLiquidacion();
}

export function exportLiquidacion(){
  const mes = document.getElementById('liq-mes')?.value || '';
  let txt = `LIQUIDACIÓN HORAS EXTRA — ${mes}\n${'='.repeat(50)}\n`;
  let total = 0;
  legajoData.filter(e=>e.cargo !== '__inactivo__').forEach(e=>{
    const d = liqFilaDatos(e, mes);
    total += d.adicional;
    txt += `${e.nombre} ${e.apellido} (${e.cargo}): programadas ${d.prog}h, trabajadas ${d.trab}h, extra ${d.hExtra}h = $${d.adicional.toLocaleString('es-AR')}\n`;
  });
  txt += `${'='.repeat(50)}\nTOTAL: $${total.toLocaleString('es-AR',{minimumFractionDigits:2})}`;
  const blob = new Blob([txt],{type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `liquidacion-${mes}.txt`;
  a.click();
}