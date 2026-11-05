// ── UNIFICAR ARTÍCULOS (gerencia) ───────────────────────────────────────────
// Muestra los artículos cargados con varios nombres (Naviza / naviza / navisa)
// en Compras, Stock, Recetas, Composiciones, Presupuestos, Insumos y Costos, y
// los deja en un solo nombre con un solo costo por vara.
//
// Antes de cambiar nada guarda una copia de todo lo que toca en
// `unificacionesArticulos/<ts>` (y un resumen liviano en
// `unificacionesArticulosMeta/<ts>`), así la última unificación se puede deshacer.
// Las formas unidas quedan como alias en `articulosAlias`: lo que se escriba
// después con una forma vieja se guarda con el nombre que quedó.
//
// Lo que necesita de app.js llega por configurarUnificarArticulos().

import { esc } from './utils.js';
import { showToast } from './tema-toast.js';
import { confirmModal } from './modales.js';
import { cotizadorPrecios } from './cotizador.js';
import { presupuestosData } from './presupuestos.js';
import { SECCIONES, articulosAlias, claveArticulo, contarUsos, detectarGrupos, setArticulosAlias, ultimoCostoVara, unificarEnDatos } from './articulos-base.js';

let D = {};
export function configurarUnificarArticulos(deps){ D = deps; }

let _grupos = null;      // [{ id, maestro, costo, variantes:[{nombre,usos,total,costo}], marcado, sugerido, manual, fuente, ultimaCompra }]
let _historial = null;   // [{ ts, user, cantidad, nombres, deshecho }]
let _trabajando = false;

const $ = id => document.getElementById(id);
const fmt$ = n => '$' + Math.round(+n || 0).toLocaleString('es-AR');
const fmtFecha = iso => iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : '';

function _datos(){
  return {
    comprasFlore: D.comprasFlore, comprasJard: D.comprasJard, stockData: D.stockData, recetasData: D.recetasData,
    arreglosComposicion: D.arreglosComposicion, presupuestosData, insumosCustom: D.insumosCustom, cotizadorPrecios,
  };
}

function _buscar(){
  const { grupos, sugeridos } = detectarGrupos(_datos());
  let id = 0;
  _grupos = [
    ...grupos.map(g => ({ ...g, id: ++id, marcado: true })),
    ...sugeridos.map(g => ({ ...g, id: ++id, marcado: false })),
  ];
}

export function renderUnificarArticulos(){
  const cont = $('ua-contenido');
  if(!cont) return;
  if(D.userRole && D.userRole !== 'gerencia'){ cont.innerHTML = '<div class="empty-state">Solo gerencia puede unificar artículos.</div>'; return; }
  if(!_grupos) _buscar();
  if(!_historial) _cargarHistorial();
  const exactos = _grupos.filter(g => !g.sugerido);
  const sug = _grupos.filter(g => g.sugerido);
  const marcados = _grupos.filter(g => g.marcado).length;

  const dl = $('ua-nombres');
  if(dl){
    const todos = [...new Set([...Object.keys(cotizadorPrecios || {}), ...(D.stockData || []).map(s => s.prod), ...(D.comprasFlore || []).map(c => c.prod)].filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'es'));
    dl.innerHTML = todos.map(n => `<option value="${esc(n)}">`).join('');
  }

  cont.innerHTML = `
    <div class="ua-resumen">
      ${exactos.length
        ? `Hay <strong>${exactos.length}</strong> artículo${exactos.length > 1 ? 's' : ''} cargado${exactos.length > 1 ? 's' : ''} con más de un nombre (mayúsculas, tildes, plural o espacios).`
        : 'No hay artículos repetidos por mayúsculas, tildes o plurales.'}
      Revisá el nombre que queda y el costo por vara, y tocá <strong>Unir</strong>. Antes de cambiar nada se guarda una copia.
    </div>
    ${exactos.map(_cardGrupo).join('')}
    ${sug.length ? `<div class="ua-subtitulo">Se escriben casi igual: ¿son lo mismo?</div>
      <div class="ua-ayuda">Estos no se unen salvo que los marques.</div>
      ${sug.map(_cardGrupo).join('')}` : ''}
    <div class="ua-subtitulo">Unir otros a mano</div>
    <div class="ua-ayuda">Para formas que no se parecen (por ej. Astromelia y Alstroemerias). Escribí los nombres separados por coma.</div>
    <div class="ua-manual">
      <input class="form-input" id="ua-manual-nombres" list="ua-nombres" placeholder="Ej.: Alstroemerias, Astromelias">
      <button class="btn-secondary" onclick="uaAgregarManual()">Agregar</button>
    </div>
    <div class="ua-barra">
      <span>${marcados} para unir</span>
      <button class="btn-add" ${marcados && !_trabajando ? '' : 'disabled'} onclick="uaUnir()">Unir ${marcados || ''}</button>
    </div>
    ${_renderHistorial()}`;
}

function _usosTexto(usos){
  return Object.entries(usos || {}).map(([k, n]) => `${SECCIONES[k] || k} ${n}`).join(' · ');
}

function _fuenteTexto(g){
  if(g.fuente === 'compra' && g.ultimaCompra){
    const c = g.ultimaCompra;
    return `de la compra del ${fmtFecha(c.fecha)}${c.prov ? ' a ' + esc(c.prov) : ''} (${esc(c.prod)})`;
  }
  if(g.fuente === 'guardado') return 'el que ya figura (no hay compras con varas por paquete)';
  if(g.fuente === 'manual') return 'cargado a mano';
  return 'sin costo cargado';
}

function _cardGrupo(g){
  const opciones = [...new Set([g.maestro, ...g.variantes.map(v => v.nombre.trim())])];
  return `<div class="ua-card${g.marcado ? ' ua-on' : ''}">
    <label class="ua-check"><input type="checkbox" ${g.marcado ? 'checked' : ''} onchange="uaMarcar(${g.id}, this.checked)"> Unir</label>
    <div class="ua-campos">
      <label class="form-label">Nombre que queda
        <input class="form-input" list="ua-op-${g.id}" value="${esc(g.maestro)}" onchange="uaSet(${g.id}, 'maestro', this.value)">
        <datalist id="ua-op-${g.id}">${opciones.map(o => `<option value="${esc(o)}">`).join('')}</datalist>
      </label>
      <label class="form-label">Costo por vara
        <input class="form-input" inputmode="numeric" value="${g.costo ? Math.round(g.costo) : ''}" placeholder="sin costo" onchange="uaSet(${g.id}, 'costo', this.value)">
        <span class="ua-fuente">${_fuenteTexto(g)}</span>
      </label>
    </div>
    <ul class="ua-variantes">
      ${g.variantes.map(v => `<li><strong>${esc(v.nombre)}</strong>${v.nombre !== v.nombre.trim() ? ' <span class="ua-fuente">(con espacio)</span>' : ''}
        <span class="ua-fuente">${_usosTexto(v.usos)}${v.costo ? ' · costo ' + fmt$(v.costo) : ''}</span></li>`).join('')}
    </ul>
  </div>`;
}

export function uaMarcar(id, on){
  const g = _grupos?.find(x => x.id === id);
  if(g){ g.marcado = !!on; renderUnificarArticulos(); }
}

export function uaSet(id, campo, val){
  const g = _grupos?.find(x => x.id === id);
  if(!g) return;
  if(campo === 'maestro'){
    const n = String(val || '').replace(/\s+/g, ' ').trim();
    if(n) g.maestro = n;
  } else if(campo === 'costo'){
    const n = Math.round(parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0);
    g.costo = n > 0 ? n : 0;
    g.fuente = n > 0 ? 'manual' : '';
  }
  renderUnificarArticulos();
}

export function uaAgregarManual(){
  const inp = $('ua-manual-nombres');
  const pedidos = String(inp?.value || '').split(',').map(s => s.trim()).filter(Boolean);
  if(pedidos.length < 2){ showToast('Escribí al menos dos nombres separados por coma', 'error'); return; }
  // Cada nombre escrito trae todas sus formas (mismas mayúsculas/plurales).
  const claves = new Set(pedidos.map(claveArticulo));
  const usos = contarUsos(_datos());
  const nombres = new Set([...usos.keys()].filter(n => claves.has(claveArticulo(n))));
  if(nombres.size < 2){ showToast('No encontré esos artículos cargados. Revisá cómo están escritos.', 'error'); return; }
  const variantes = [...nombres].map(n => {
    const u = usos.get(n) || {};
    return { nombre: n, usos: u, total: Object.values(u).reduce((a, b) => a + b, 0), costo: +(cotizadorPrecios || {})[n] || 0 };
  }).sort((a, b) => b.total - a.total);
  const ult = ultimoCostoVara(D.comprasFlore, [...nombres]);
  const conCosto = variantes.find(v => v.costo > 0);
  const maestro = pedidos[0].charAt(0).toUpperCase() + pedidos[0].slice(1);
  // Saca de la lista los grupos que quedan adentro de este.
  _grupos = _grupos.filter(g => !g.variantes.some(v => nombres.has(v.nombre)));
  _grupos.push({
    id: Math.max(0, ..._grupos.map(g => g.id)) + 1, manual: true, marcado: true, clave: claveArticulo(maestro), maestro, variantes,
    costo: ult ? ult.costo : (conCosto ? conCosto.costo : 0), fuente: ult ? 'compra' : (conCosto ? 'guardado' : ''), ultimaCompra: ult,
  });
  if(inp) inp.value = '';
  renderUnificarArticulos();
}

// Si dos grupos marcados comparten nombres (un grupo "casi igual" contiene uno
// exacto), se juntan en uno; queda el nombre y el costo del más grande.
function _unionesMarcadas(){
  const marcados = _grupos.filter(g => g.marcado);
  const out = [];
  marcados.forEach(g => {
    const nombres = new Set(g.variantes.map(v => v.nombre));
    const igual = out.find(u => u.variantes.some(n => nombres.has(n)));
    if(igual){
      g.variantes.forEach(v => { if(!igual.variantes.includes(v.nombre)) igual.variantes.push(v.nombre); });
      if(g.variantes.length > igual._n){ igual.maestro = g.maestro; igual.costo = g.costo; igual._n = g.variantes.length; }
    } else out.push({ maestro: g.maestro, costo: g.costo, variantes: g.variantes.map(v => v.nombre), _n: g.variantes.length });
  });
  return out.map(({ _n, ...u }) => u);
}

function _cargado(){
  if(!window._comprasFloreLoaded || !window._comprasJardLoaded) return 'las compras';
  if(!D._arreglosComposicionLoaded) return 'las composiciones';
  if(!(D.stockData || []).length) return 'el stock';
  return '';
}

// Copia para guardar: las fotos van aparte (como en cualquier guardado), así la
// copia pesa lo mismo que los datos (~600 KB) y no varios MB.
const _copia = (key, v) => {
  const plain = JSON.parse(JSON.stringify(v ?? null));
  return D.fotosParaGuardar ? D.fotosParaGuardar(key, plain) : plain;
};

function _foto(){
  return {
    comprasFlore: _copia('comprasFlore', D.comprasFlore), comprasJard: _copia('comprasJard', D.comprasJard), stockData: _copia('stockData', D.stockData),
    recetasData: _copia('recetasData', D.recetasData), presupuestosData: _copia('presupuestosData', presupuestosData), insumosCustom: _copia('insumosCustom', D.insumosCustom),
    cotizadorPrecios: _copia('cotizadorPrecios', cotizadorPrecios), articulosAlias: _copia('articulosAlias', articulosAlias),
    arreglosComposicion: _copia('arreglosComposicion', Object.entries(D.arreglosComposicion || {}).map(([zona, ings]) => ({ zona, ings: ings || [] }))),
  };
}

function _guardarTodo(){
  window._comprasFloreLastSave = Date.now(); D.fbSave('comprasFlore', D.comprasFlore);
  window._comprasJardLastSave = Date.now(); D.fbSave('comprasJard', D.comprasJard);
  D.fbSave('stockData', D.stockData);
  D.fbSave('recetasData', D.recetasData);
  D.fbSave('presupuestosData', presupuestosData);
  D.saveInsumosCustom();
  D.fbSave('cotizadorPrecios', cotizadorPrecios);
  D._saveArreglosComposicion();
}

export async function uaUnir(){
  if(_trabajando) return;
  const falta = _cargado();
  if(falta){ showToast(`Todavía se están cargando ${falta}. Esperá unos segundos y probá de nuevo.`, 'error'); return; }
  const uniones = _unionesMarcadas();
  if(!uniones.length) return;
  const vacios = uniones.filter(u => !u.maestro);
  if(vacios.length){ showToast('Falta el nombre que queda en algún artículo', 'error'); return; }
  const formas = uniones.reduce((s, u) => s + u.variantes.filter(v => v !== u.maestro).length, 0);
  if(!await confirmModal(`¿Unir ${uniones.length} artículo${uniones.length > 1 ? 's' : ''}?\n\n${formas} nombres distintos pasan a su nombre único en Compras, Stock, Recetas, Composiciones, Presupuestos e Insumos, y queda un solo costo por vara.\n\nAntes se guarda una copia y podés deshacerlo desde esta misma pantalla.`)) return;
  _trabajando = true; renderUnificarArticulos();
  const ts = Date.now();
  const user = window.currentUserLabel || 'Gerencia';
  try{
    showToast('Guardando copia de seguridad…');
    const antes = _foto();
    await window.fbSet(`unificacionesArticulos/${ts}`, { ts, user, uniones, antes });
    const { alias, resumen } = unificarEnDatos(_datos(), uniones);
    const nuevoAlias = { ...articulosAlias, ...alias };
    setArticulosAlias(nuevoAlias);
    D.fbSave('articulosAlias', nuevoAlias);
    _guardarTodo();
    const meta = { ts, user, cantidad: uniones.length, nombres: uniones.map(u => u.maestro).slice(0, 60), resumen };
    window.fbSet(`unificacionesArticulosMeta/${ts}`, meta);
    _historial = [meta, ...(_historial || [])];
    showToast(`Listo: ${uniones.length} artículo${uniones.length > 1 ? 's' : ''} unificado${uniones.length > 1 ? 's' : ''}`);
  }catch(e){
    console.error('Unificar artículos', e);
    showToast('No se pudo guardar la copia de seguridad: no se cambió nada. Revisá la conexión y probá de nuevo.', 'error');
  }finally{
    _trabajando = false;
    _grupos = null;
    renderUnificarArticulos();
  }
}

async function _cargarHistorial(){
  _historial = [];
  try{
    const v = await window.fbGetOnce?.('unificacionesArticulosMeta');
    _historial = Object.values(v || {}).sort((a, b) => b.ts - a.ts);
  }catch(e){ _historial = []; }
  if($('page-unificar-articulos')?.classList.contains('active')) renderUnificarArticulos();
}

function _renderHistorial(){
  if(!_historial || !_historial.length) return '';
  const ultima = _historial.find(h => !h.deshecho);
  return `<div class="ua-subtitulo">Unificaciones anteriores</div>
    <ul class="ua-historial">${_historial.slice(0, 8).map(h => `<li>
      <span>${new Date(h.ts).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · ${esc(h.user || '')} · ${h.cantidad} artículo${h.cantidad > 1 ? 's' : ''}${h.deshecho ? ' · <em>deshecha</em>' : ''}</span>
      ${ultima && h.ts === ultima.ts ? `<button class="btn-secondary" onclick="uaDeshacer(${h.ts})">Deshacer</button>` : ''}
    </li>`).join('')}</ul>`;
}

const _reemplazar = (arr, nuevo) => { if(Array.isArray(arr)) arr.splice(0, arr.length, ...(Array.isArray(nuevo) ? nuevo : Object.values(nuevo || {}))); };

export async function uaDeshacer(ts){
  if(_trabajando) return;
  const falta = _cargado();
  if(falta){ showToast(`Todavía se están cargando ${falta}. Esperá unos segundos y probá de nuevo.`, 'error'); return; }
  const fecha = new Date(ts).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  if(!await confirmModal(`¿Deshacer la unificación del ${fecha}?\n\nCompras, Stock, Recetas, Composiciones, Presupuestos, Insumos y Costos vuelven a como estaban en ese momento. Lo que se haya cargado en esas secciones después se pierde.`)) return;
  _trabajando = true; renderUnificarArticulos();
  try{
    const copia = await window.fbGetOnce(`unificacionesArticulos/${ts}`);
    const a = copia && copia.antes;
    if(!a || !a.comprasFlore){ showToast('No encontré la copia de esa unificación', 'error'); return; }
    // Una copia de seguridad de lo actual, por las dudas.
    await window.fbSet(`unificacionesArticulos/${Date.now()}`, { ts: Date.now(), user: window.currentUserLabel || 'Gerencia', deshace: ts, antes: _foto() });
    _reemplazar(D.comprasFlore, a.comprasFlore);
    _reemplazar(D.comprasJard, a.comprasJard);
    _reemplazar(D.stockData, a.stockData);
    _reemplazar(D.recetasData, a.recetasData);
    _reemplazar(presupuestosData, a.presupuestosData);
    _reemplazar(D.insumosCustom, a.insumosCustom);
    Object.keys(cotizadorPrecios).forEach(k => delete cotizadorPrecios[k]);
    Object.assign(cotizadorPrecios, a.cotizadorPrecios || {});
    window._setArreglosComposicion?.(a.arreglosComposicion || []);
    const alias = a.articulosAlias || {};
    setArticulosAlias(alias);
    D.fbSave('articulosAlias', alias);
    _guardarTodo();
    window.fbSet(`unificacionesArticulosMeta/${ts}/deshecho`, Date.now());
    const h = (_historial || []).find(x => x.ts === ts); if(h) h.deshecho = Date.now();
    showToast('Unificación deshecha');
  }catch(e){
    console.error('Deshacer unificación', e);
    showToast('No se pudo deshacer. Revisá la conexión y probá de nuevo.', 'error');
  }finally{
    _trabajando = false;
    _grupos = null;
    renderUnificarArticulos();
  }
}

export function uaVolverABuscar(){ _grupos = null; renderUnificarArticulos(); }
