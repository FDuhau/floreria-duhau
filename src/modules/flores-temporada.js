// ── FLORES POR TEMPORADA (Catálogo › Flores por temporada) ──────────────────
// Catálogo de las flores y follajes que trabajamos: colores en que vienen y
// meses en que se consiguen, para ver qué se puede pedir según la época.
// Cada ficha se enlaza con el artículo de Compras (mismo nombre unificado que
// usa "Unificar artículos") para mostrar el costo por vara vigente y si hoy
// entra como vara de estación, importada o premium.
//
// Datos: nodo `floresTemporada` (lista). Mientras esté vacío se muestra la
// base cargada desde la planilla de temporadas. Gerencia edita.
// Lo que necesita de app.js llega por configurarFloresTemporada().

import { esc } from './utils.js';
import { showToast } from './tema-toast.js';
import { confirmModal } from './modales.js';
import { cotizadorPrecioVara } from './cotizador.js';
import { badgeCategoriaVara } from './categoria-vara.js';
import { validarCampos } from './validacion.js';
import {
  FLORES_TEMPORADA_BASE, MESES, MESES_CORTO, estacionDeMes, normalizarCatalogo, normalizarFlor, idFlor,
  estadoEnMes, textoMeses, resumenMes, articuloDeFlor, muestraColor, todoElAnio,
} from './flores-temporada-base.js';

let D = {};
export function configurarFloresTemporada(deps){ D = deps; }

let _guardado = null;            // lo que vino de Firebase (null = nunca se editó)
let _mes = new Date().getMonth() + 1;
let _tipo = '';                  // '' | 'Flor' | 'Follaje'
let _color = '';
let _busca = '';
let _vista = 'mes';              // 'mes' | 'anio'
let _editId = null;

const $ = id => document.getElementById(id);
const fmt$ = n => '$' + Math.round(+n || 0).toLocaleString('es-AR');
const _esGerencia = () => !D.userRole || D.userRole === 'gerencia';
const _puedePedir = () => !D.userRole || ['gerencia', 'compras'].includes(D.userRole);

export function setFloresTemporada(val){
  _guardado = val ? normalizarCatalogo(val) : null;
  if(_guardado && !_guardado.length) _guardado = null;
  if($('page-flores-temporada')?.classList.contains('active') && !$('ft-modal')?.classList.contains('open')) renderFloresTemporada();
  if($('page-compras-floreria')?.classList.contains('active')) renderTemporadaCompras();
}

export function catalogoFlores(){ return _guardado || normalizarCatalogo(FLORES_TEMPORADA_BASE); }

function _articulo(f){
  const conocidos = D.articulosConocidos ? D.articulosConocidos() : [];
  return articuloDeFlor(f, conocidos, n => cotizadorPrecioVara(n));
}

function _filtrar(lista){
  const q = _busca.trim().toLowerCase();
  return lista.filter(f =>
    (!_tipo || f.tipo === _tipo) &&
    (!_color || f.colores.some(c => c.toLowerCase() === _color)) &&
    (!q || (f.nombre + ' ' + f.aclaracion + ' ' + f.colores.join(' ')).toLowerCase().includes(q)));
}

// ── Piezas ──────────────────────────────────────────────────
function _chipColor(c){
  const m = muestraColor(c);
  return `<span class="ft-color">${m ? `<span class="ft-swatch" style="background:${m}"></span>` : ''}${esc(c)}</span>`;
}

function _tiraMeses(f, mes){
  return `<div class="ft-tira" title="${esc(textoMeses(f.meses))}">${MESES_CORTO.map((m, i) =>
    `<span class="ft-tira-m${f.meses.includes(i+1) ? ' on' : ''}${i+1 === mes ? ' actual' : ''}">${m[0].toUpperCase()}</span>`).join('')}</div>`;
}

function _etiquetaEstado(f, mes){
  const e = estadoEnMes(f, mes);
  if(e === 'empieza') return '<span class="ft-tag ft-tag-nuevo">Empieza</span>';
  if(e === 'termina') return '<span class="ft-tag ft-tag-fin">Último mes</span>';
  if(e === 'llega') return `<span class="ft-tag ft-tag-llega">Llega en ${MESES[mes % 12]}</span>`;
  return '';
}

function _costo(f){
  const art = _articulo(f);
  if(!art) return '<span class="ft-costo ft-sin">Sin artículo en Compras</span>';
  const pu = cotizadorPrecioVara(art);
  return `<span class="ft-costo" title="Artículo en Compras: ${esc(art)}">${pu > 0 ? fmt$(pu) + ' la vara ' + badgeCategoriaVara(pu) : 'Sin costo cargado'}</span>`;
}

function _tarjeta(f, mes){
  return `<div class="ft-card${estadoEnMes(f, mes) === 'fuera' ? ' fuera' : ''}">
    <div class="ft-card-top">
      <div>
        <div class="ft-nombre">${esc(f.nombre)} ${_etiquetaEstado(f, mes)}</div>
        ${f.aclaracion ? `<div class="ft-aclara">${esc(f.aclaracion)}</div>` : ''}
      </div>
      <span class="ft-tipo ft-tipo-${f.tipo === 'Follaje' ? 'follaje' : 'flor'}">${f.tipo}</span>
    </div>
    <div class="ft-colores">${f.colores.map(_chipColor).join('') || '<span class="ft-sin">Sin colores cargados</span>'}</div>
    ${_tiraMeses(f, mes)}
    <div class="ft-meses-txt">${esc(textoMeses(f.meses))}${f.nota ? ' · ' + esc(f.nota) : ''}</div>
    <div class="ft-card-pie">
      ${_costo(f)}
      <span class="ft-acciones">
        ${_puedePedir() ? `<button class="btn-secondary ft-btn" onclick="ftPedir('${esc(f.id)}')" title="Cargar en una nueva orden de compra">Pedir</button>` : ''}
        ${_esGerencia() ? `<button class="btn-secondary ft-btn" onclick="ftEditar('${esc(f.id)}')">Editar</button>` : ''}
      </span>
    </div>
  </div>`;
}

const _grilla = (lista, mes) => lista.length ? `<div class="ft-grid">${lista.map(f => _tarjeta(f, mes)).join('')}</div>` : '<div class="empty-state">Nada para mostrar con estos filtros.</div>';

// ── Página ──────────────────────────────────────────────────
export function renderFloresTemporada(){
  const cont = $('ft-contenido');
  if(!cont) return;
  const todo = catalogoFlores();
  const lista = _filtrar(todo);
  const mes = _mes;
  const est = estacionDeMes(mes);

  const colores = [...new Set(todo.flatMap(f => f.colores.map(c => c.toLowerCase())))].sort((a, b) => a.localeCompare(b, 'es'));
  const hoy = new Date().getMonth() + 1;

  const barra = `<div class="ft-barra">
    <div class="ft-meses-sel" role="tablist" aria-label="Mes">
      ${MESES_CORTO.map((m, i) => `<button type="button" role="tab" aria-selected="${i+1 === mes}" class="ft-mes-btn${i+1 === mes ? ' sel' : ''}${i+1 === hoy ? ' hoy' : ''}" onclick="ftMes(${i+1})" title="${MESES[i]}${i+1 === hoy ? ' (este mes)' : ''}">${m}</button>`).join('')}
    </div>
    <div class="ft-filtros">
      <input type="search" class="stock-search" placeholder="Buscar flor o color…" value="${esc(_busca)}" oninput="ftBuscar(this.value)" aria-label="Buscar">
      <select class="form-input" onchange="ftTipo(this.value)" aria-label="Tipo">
        <option value="">Flores y follajes</option>
        <option value="Flor"${_tipo === 'Flor' ? ' selected' : ''}>Solo flores</option>
        <option value="Follaje"${_tipo === 'Follaje' ? ' selected' : ''}>Solo follajes</option>
      </select>
      <select class="form-input" onchange="ftColor(this.value)" aria-label="Color">
        <option value="">Todos los colores</option>
        ${colores.map(c => `<option value="${esc(c)}"${_color === c ? ' selected' : ''}>${esc(c[0].toUpperCase() + c.slice(1))}</option>`).join('')}
      </select>
      <div class="ft-vista">
        <button type="button" class="${_vista === 'mes' ? 'sel' : ''}" onclick="ftVista('mes')">Por mes</button>
        <button type="button" class="${_vista === 'anio' ? 'sel' : ''}" onclick="ftVista('anio')">Calendario del año</button>
      </div>
    </div>
  </div>`;

  let cuerpo;
  if(_vista === 'anio'){
    cuerpo = `<div class="compras-list-wrap ft-anio-wrap"><table class="ft-anio">
      <thead><tr><th>Flor / follaje</th>${MESES_CORTO.map((m, i) => `<th class="${i+1 === mes ? 'actual' : ''}">${m}</th>`).join('')}<th>Colores</th></tr></thead>
      <tbody>${lista.map(f => `<tr>
        <td><strong>${esc(f.nombre)}</strong>${f.aclaracion ? `<div class="ft-aclara">${esc(f.aclaracion)}</div>` : ''}</td>
        ${MESES_CORTO.map((m, i) => `<td class="ft-celda${f.meses.includes(i+1) ? ' on' : ''}${i+1 === mes ? ' actual' : ''}" title="${f.meses.includes(i+1) ? 'Se consigue' : 'No se consigue'} en ${MESES[i]}"></td>`).join('')}
        <td class="ft-colores-txt">${esc(f.colores.join(', '))}</td>
      </tr>`).join('') || '<tr><td colspan="14" class="empty-state">Nada para mostrar con estos filtros.</td></tr>'}</tbody>
    </table></div>`;
  } else {
    const r = resumenMes(lista, mes);
    const flores = [...r.temporada, ...r.todoElAnio].filter(f => f.tipo === 'Flor').length;
    const follajes = [...r.temporada, ...r.todoElAnio].filter(f => f.tipo === 'Follaje').length;
    cuerpo = `
      <div class="ft-resumen">En <strong>${MESES[mes-1]}</strong> (${est.nombre.toLowerCase()}) se consiguen <strong>${flores}</strong> flor${flores === 1 ? '' : 'es'} y <strong>${follajes}</strong> follaje${follajes === 1 ? '' : 's'}${r.termina.length ? `; <strong>${r.termina.length}</strong> están en su último mes` : ''}.</div>
      <h3 class="ft-sec">De temporada en ${MESES[mes-1]} <span class="ft-n">${r.temporada.length}</span></h3>
      ${_grilla(r.temporada, mes)}
      ${r.llega.length ? `<h3 class="ft-sec">Llegan en ${MESES[mes % 12]} <span class="ft-n">${r.llega.length}</span></h3>${_grilla(r.llega, mes)}` : ''}
      <h3 class="ft-sec">Todo el año <span class="ft-n">${r.todoElAnio.length}</span></h3>
      ${_grilla(r.todoElAnio, mes)}
      ${r.fuera.length ? `<details class="ft-fuera"><summary>No se consiguen en ${MESES[mes-1]} (${r.fuera.length})</summary>${_grilla(r.fuera, mes)}</details>` : ''}`;
  }

  const aviso = _guardado ? '' : `<div class="ft-nota">Lista cargada desde la planilla de temporadas. Los colores son una primera propuesta: ${_esGerencia() ? 'corregilos con <em>Editar</em> en cada ficha.' : 'gerencia puede corregirlos.'}</div>`;
  cont.innerHTML = barra + aviso + cuerpo;
}

export function ftMes(m){ _mes = +m || _mes; renderFloresTemporada(); }
export function ftTipo(v){ _tipo = v; renderFloresTemporada(); }
export function ftColor(v){ _color = v; renderFloresTemporada(); }
export function ftVista(v){ _vista = v === 'anio' ? 'anio' : 'mes'; renderFloresTemporada(); }
let _tBusca = null;
export function ftBuscar(v){
  _busca = v;
  clearTimeout(_tBusca);
  _tBusca = setTimeout(() => {
    renderFloresTemporada();
    const inp = document.querySelector('#ft-contenido input[type=search]');
    if(inp){ inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  }, 200);
}

// ── Pedir: lleva a Compras › Florería con el artículo cargado ──
export function ftPedir(id){
  const f = catalogoFlores().find(x => x.id === id);
  if(!f) return;
  const nombre = _articulo(f) || f.nombre.split('/')[0].trim();
  D.navigate?.('compras-floreria');
  setTimeout(() => {
    const inp = $('cf-producto');
    if(!inp) return;
    inp.value = nombre;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ($('cf-cantidad') || inp).focus();
  }, 60);
}

// ── Cartel en Compras › Florería ────────────────────────────
export function renderTemporadaCompras(){
  const el = $('cf-temporada');
  if(!el) return;
  const mes = new Date().getMonth() + 1;
  const r = resumenMes(catalogoFlores().filter(f => !todoElAnio(f)), mes);
  if(!r.temporada.length && !r.llega.length){ el.innerHTML = ''; return; }
  const nombres = l => l.map(f => esc(f.nombre)).join(', ');
  const sinFin = r.temporada.filter(f => !r.termina.includes(f));
  el.innerHTML = `<div class="ft-cartel">
    <div class="ft-cartel-tit">De temporada en ${MESES[mes-1]}</div>
    ${sinFin.length ? `<div>${nombres(sinFin)}.</div>` : ''}
    ${r.termina.length ? `<div><strong>Último mes:</strong> ${nombres(r.termina)}.</div>` : ''}
    ${r.llega.length ? `<div><strong>Llegan en ${MESES[mes % 12]}:</strong> ${nombres(r.llega)}.</div>` : ''}
    <button type="button" class="ft-cartel-link" onclick="navigate('flores-temporada')">Ver catálogo por temporada</button>
  </div>`;
}

// ── Edición (gerencia) ──────────────────────────────────────
function _modal(){
  let ov = $('ft-modal');
  if(ov) return ov;
  ov = document.createElement('div');
  ov.id = 'ft-modal';
  ov.className = 'modal-overlay';
  ov.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="ft-m-titulo">
    <div class="modal-title" id="ft-m-titulo">Flor / follaje</div>
    <div class="ft-form">
      <div><label class="form-label" for="ft-m-nombre">Nombre</label><input class="form-input" id="ft-m-nombre"></div>
      <div><label class="form-label" for="ft-m-tipo">Tipo</label><select class="form-input" id="ft-m-tipo"><option>Flor</option><option>Follaje</option></select></div>
      <div class="ft-form-full"><label class="form-label" for="ft-m-aclara">Aclaración</label><input class="form-input" id="ft-m-aclara" placeholder="Otro nombre, variedad…"></div>
      <div class="ft-form-full"><label class="form-label" for="ft-m-colores">Colores posibles</label><input class="form-input" id="ft-m-colores" placeholder="blanco, rosa, lila…"><div class="ft-ayuda">Separados por coma.</div></div>
      <div class="ft-form-full"><span class="form-label">Meses en que se consigue</span>
        <div class="ft-m-meses">${MESES_CORTO.map((m, i) => `<label><input type="checkbox" value="${i+1}"> ${m}</label>`).join('')}</div>
        <div class="ft-ayuda"><button type="button" class="ft-link" onclick="ftMarcarMeses(true)">Todo el año</button> · <button type="button" class="ft-link" onclick="ftMarcarMeses(false)">Ninguno</button></div>
      </div>
      <div class="ft-form-full"><label class="form-label" for="ft-m-articulo">Nombre en Compras</label><input class="form-input" id="ft-m-articulo" list="ft-m-articulos" placeholder="Automático"><datalist id="ft-m-articulos"></datalist><div class="ft-ayuda" id="ft-m-art-ayuda"></div></div>
      <div class="ft-form-full"><label class="form-label" for="ft-m-nota">Nota</label><input class="form-input" id="ft-m-nota" placeholder="Ej.: importados todo el año"></div>
    </div>
    <div class="modal-actions">
      <button type="button" class="btn-secondary ft-borrar" id="ft-m-borrar" onclick="ftBorrar()">Quitar del catálogo</button>
      <span style="flex:1"></span>
      <button type="button" class="btn-secondary" onclick="ftCerrar()">Cancelar</button>
      <button type="button" class="btn-add" onclick="ftGuardar()">Guardar</button>
    </div>
  </div>`;
  ov.addEventListener('click', e => { if(e.target === ov) ftCerrar(); });
  document.body.appendChild(ov);
  return ov;
}

export function ftEditar(id){
  if(!_esGerencia()){ showToast('Solo gerencia puede editar el catálogo.', 'error'); return; }
  const f = id ? catalogoFlores().find(x => x.id === id) : null;
  _editId = f ? f.id : null;
  const ov = _modal();
  $('ft-m-titulo').textContent = f ? 'Editar ' + f.nombre : 'Agregar flor o follaje';
  $('ft-m-nombre').value = f?.nombre || '';
  $('ft-m-tipo').value = f?.tipo || 'Flor';
  $('ft-m-aclara').value = f?.aclaracion || '';
  $('ft-m-colores').value = (f?.colores || []).join(', ');
  $('ft-m-nota').value = f?.nota || '';
  $('ft-m-articulo').value = f?.articulo || '';
  ov.querySelectorAll('.ft-m-meses input').forEach(c => { c.checked = !!f?.meses.includes(+c.value); });
  const conocidos = D.articulosConocidos ? D.articulosConocidos() : [];
  $('ft-m-articulos').innerHTML = conocidos.map(n => `<option value="${esc(n)}">`).join('');
  const auto = f ? articuloDeFlor({ ...f, articulo: '' }, conocidos, n => cotizadorPrecioVara(n)) : '';
  $('ft-m-art-ayuda').textContent = auto ? `Si lo dejás vacío se usa "${auto}".` : 'Elegí el artículo de Compras para ver su costo por vara.';
  $('ft-m-borrar').style.display = f ? '' : 'none';
  ov.classList.add('open');
  setTimeout(() => $('ft-m-nombre')?.focus(), 30);
}
export function ftMarcarMeses(v){ document.querySelectorAll('#ft-modal .ft-m-meses input').forEach(c => { c.checked = v; }); }
export function ftCerrar(){ $('ft-modal')?.classList.remove('open'); _editId = null; }

function _guardarLista(lista, msg){
  _guardado = normalizarCatalogo(lista);
  D.fbSave?.('floresTemporada', _guardado);
  showToast(msg);
  renderFloresTemporada();
}

export function ftGuardar(){
  if(!validarCampos([{ id: 'ft-m-nombre', req: true, msg: 'Poné el nombre.' }])) return;
  const meses = [...document.querySelectorAll('#ft-modal .ft-m-meses input:checked')].map(c => +c.value);
  const nombre = $('ft-m-nombre').value.trim();
  const lista = catalogoFlores().map(f => ({ ...f }));
  const otro = lista.find(f => f.id !== _editId && idFlor(f.nombre) === idFlor(nombre));
  if(otro){ showToast(`"${otro.nombre}" ya está en el catálogo.`, 'error'); return; }
  const datos = normalizarFlor({
    id: _editId || idFlor(nombre) + '_' + Date.now().toString(36),
    nombre, tipo: $('ft-m-tipo').value, aclaracion: $('ft-m-aclara').value,
    colores: $('ft-m-colores').value, meses, nota: $('ft-m-nota').value, articulo: $('ft-m-articulo').value,
  });
  const i = lista.findIndex(f => f.id === _editId);
  if(i >= 0) lista[i] = datos; else lista.push(datos);
  ftCerrar();
  _guardarLista(lista, i >= 0 ? 'Ficha actualizada' : `"${datos.nombre}" agregada al catálogo`);
}

export async function ftBorrar(){
  const f = catalogoFlores().find(x => x.id === _editId);
  if(!f) return;
  if(!await confirmModal(`¿Quitar "${f.nombre}" del catálogo de temporadas?`)) return;
  const lista = catalogoFlores().filter(x => x.id !== f.id);
  ftCerrar();
  _guardarLista(lista, `"${f.nombre}" quitada del catálogo`);
}
