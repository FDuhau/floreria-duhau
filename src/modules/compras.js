// ── COMPRAS (FLORERÍA Y JARDINERÍA) ─────────────────────────────────────────
// Carga de compras, filtros por período, historial, reparto entre eventos,
// importación desde Excel y desde el Daily Report (PDF), pedido automático.
// Separado de app.js. Lo que necesita de app.js llega por configurarCompras():
//   CL_TASKS, TODAY_ISO, _recepFlagBadge, _recepFlagStyle, _saveEventos, _stockIngresar, _stockNombre, _subirCompraAlStock, _xlsxDownload, applyCompraFiltersExtToArr, arregloEmoji, arreglosComposicion, calcStockImpact, closeModal, comprasFlore, comprasJard, cotizadorPrecios, eventosData, fbSave, getAlerta, getMonthLabel, getProvOpts, getSucursalId, insumosBDBase, insumosCustom, kanbanData, proveedoresList, recetasData, renderCompraFiltersPanel, renderEventos, renderHome, renderRecepcionPedidos, renderRentabilidad, renderStock, stockData, syncEventosToKanban

import { esc, fmtDate, parseMoney } from './utils.js';
import { confirmModal, promptModal } from './modales.js';
import { showToast } from './tema-toast.js';
import { validarCampos } from './validacion.js';
import { getCfSplitRows, resetCfSplitRows } from './compras-reparto.js';
import { _evParseEvents, _evStripAcc, _evToEvento } from './daily-import.js';
import { compraCant, compraImporte, resumenCompras } from './dinero.js';
import { icon } from './iconos.js';
import { claveCostoPara, mismoArticulo, nombreArticulo } from './articulos-base.js';

import { badgeCategoriaVara, cartelCategoriaVara, historialCostoVara } from './categoria-vara.js';

let D = {};
export function configurarCompras(deps){ D = deps; }

// Filters
let compraFilter = { floreria: null, jardineria: null }; // null = all, {from, to} = range

export function getArr(type){ return type==='floreria'?D.comprasFlore:D.comprasJard; }
export function getTbody(type){ return document.getElementById('tbody-'+type); }

// Áreas de uso = zonas del checklist (Lobby, Biblioteca, Salón Privado, Gioia, etc.)
export function getAreaUsoZonas(){
  return [...new Set(D.CL_TASKS.map(t=>t.zona))].sort((a,b)=>a.localeCompare(b,'es'));
}
// Opciones fijas del listado de Área / uso que no son zonas del checklist.
// "Evento": marca una compra destinada a un evento; después se puede vincular al
// evento puntual desde el historial (getAreaUsoOpts detecta el sector "evento").
const AREA_USO_FIJAS = ['Evento'];
export function getAreaUsoOpts(current){
  const zonas = getAreaUsoZonas();
  const cur = (current||'').trim();
  const fijasHTML = AREA_USO_FIJAS.map(f=>`<option value="${esc(f)}"${f===cur?' selected':''}>${esc(f)}</option>`).join('');
  // Preservar un valor viejo que no esté en la lista (ej. 'Florería')
  const extra = cur && !zonas.includes(cur) && !AREA_USO_FIJAS.includes(cur) ? `<option value="${esc(cur)}" selected>${esc(cur)}</option>` : '';
  return `<option value="">— Área / uso —</option>` + fijasHTML + extra +
    zonas.map(z=>`<option value="${esc(z)}"${z===cur?' selected':''}>${esc(z)}</option>`).join('');
}

export function populateFloreriaFormHelpers(){
  // Datalist de Flor/Follaje desde la base de insumos (igual que el pedido semanal rápido)
  const dl = document.getElementById('cf-producto-list');
  if(dl){
    const all = [...new Set([...D.insumosBDBase, ...(typeof D.insumosCustom!=='undefined'?D.insumosCustom:[])])].sort((a,b)=>a.localeCompare(b,'es'));
    dl.innerHTML = all.map(n=>`<option value="${esc(n)}">`).join('');
  }
  // Select de áreas del hotel
  const sec = document.getElementById('cf-sector');
  if(sec && sec.options.length <= 1){
    sec.innerHTML = getAreaUsoOpts('') +
      '<option value="__otra__">Otra (escribir)...</option>';
    sec.onchange = async function(){
      if(this.value === '__otra__'){
        const custom = await promptModal('Escribí el área / uso:', { title: 'Área / uso' });
        if(custom && custom.trim()){
          const opt = document.createElement('option');
          opt.value = custom.trim(); opt.textContent = custom.trim();
          this.insertBefore(opt, this.querySelector('option[value="__otra__"]'));
          this.value = custom.trim();
        } else { this.value=''; }
      }
    };
  }
}

export function copiarUltimoPedido(type){
  const arr = getArr(type);
  if(!arr.length){ showToast('No hay pedidos previos para copiar'); return; }
  const last = arr[0]; // el más reciente (se hace unshift al agregar)
  const p = type==='floreria' ? 'cf' : 'cj';
  const setVal = (id,val)=>{ const el=document.getElementById(p+'-'+id); if(el!=null) el.value = val ?? ''; };
  setVal('fecha', D.TODAY_ISO);            // fecha de hoy para el nuevo pedido
  setVal('pedidopor', last.pedidopor==='—'?'':last.pedidopor);
  setVal('producto', last.prod);
  setVal('cantidad', last.qty);
  setVal('desc', last.desc);
  setVal('costo', last.costo);
  // proveedor: seleccionar si existe en el select
  const provSel = document.getElementById(p+'-proveedor');
  if(provSel && last.prov){
    const match = [...provSel.options].find(o=>o.value===last.prov);
    if(match) provSel.value = last.prov;
  }
  // área/sector
  const secEl = document.getElementById(p+'-sector');
  if(secEl){
    if(secEl.tagName==='SELECT'){
      const match = [...secEl.options].find(o=>o.value===last.sector);
      if(match) secEl.value = last.sector;
      else if(last.sector){
        const opt=document.createElement('option'); opt.value=last.sector; opt.textContent=last.sector;
        secEl.insertBefore(opt, secEl.querySelector('option[value="__otra__"]')||null);
        secEl.value=last.sector;
      }
    } else secEl.value = last.sector || '';
  }
  showToast('Datos del último pedido cargados — ajustá lo que necesites');
  document.getElementById(p+'-producto')?.focus();
}

// ── Asociación de compras con eventos ──────────────────────────────────────
// Cada línea de compra puede vincularse a un evento pendiente, para después
// cruzar cuánto se gastó en insumos contra lo que se cobra por ese evento.
// Los eventos se identifican por un id estable (no por índice, que se corre
// al borrar). ensureEventoIds() completa el id de los eventos que aún no lo
// tengan (compat. con datos viejos) y persiste una sola vez.
export function genEventoId(){
  return 'ev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7);
}
function ensureEventoIds(){
  let changed = false;
  (D.eventosData||[]).forEach(ev=>{ if(ev && !ev.id){ ev.id = genEventoId(); changed = true; } });
  if(changed) D._saveEventos();
}
function eventosPendientes(){
  return (D.eventosData||[])
    .filter(ev => ev && ev.estado !== 'Pedidos Finalizados')
    .sort((a,b)=>(a.fecha||'9999').localeCompare(b.fecha||'9999'));
}
// Eventos dentro de ±dias de una fecha de referencia (INCLUYE finalizados). Sirve
// para vincular una orden de compra con fecha pasada al evento que ya pasó, que
// eventosPendientes() no lista por estar finalizado.
function eventosCercaDe(refFecha, dias){
  if(!refFecha) return eventosPendientes();
  const ref = new Date(refFecha).getTime();
  if(isNaN(ref)) return eventosPendientes();
  const rango = (dias||5) * 86400000;
  return (D.eventosData||[])
    .filter(ev => {
      if(!ev || !ev.fecha) return false;
      const t = new Date(ev.fecha).getTime();
      return !isNaN(t) && Math.abs(t - ref) <= rango;
    })
    .sort((a,b)=>(a.fecha||'9999').localeCompare(b.fecha||'9999'));
}
function eventoLabel(ev){
  return (ev?.nombre||'(evento)') + (ev?.fecha ? ' · ' + fmtDate(ev.fecha) : '');
}
function findEventoById(id){
  if(!id) return null;
  return (D.eventosData||[]).find(ev=>ev && ev.id===id) || null;
}
// refDate (opcional, ISO): fecha de la orden de compra. Si es anterior a hoy, se
// listan los eventos dentro de ±5 días de esa fecha (incluye finalizados), para
// poder vincular órdenes viejas; si no, los pendientes.
function getCompraEventoOpts(currentId, refDate){
  ensureEventoIds();
  const lista = (refDate && refDate < D.TODAY_ISO) ? eventosCercaDe(refDate, 5) : eventosPendientes();
  const cur = currentId || '';
  // Preservar un evento ya vinculado aunque haya pasado a finalizado / no listado
  let extra = '';
  if(cur && !lista.some(ev=>ev.id===cur)){
    const ev = findEventoById(cur);
    if(ev) extra = `<option value="${esc(cur)}" selected>${esc(eventoLabel(ev))}</option>`;
  }
  return `<option value="">— Sin evento (stock general) —</option>` + extra +
    lista.map(ev=>`<option value="${esc(ev.id)}"${ev.id===cur?' selected':''}>${esc(eventoLabel(ev))}</option>`).join('');
}
function populateCompraEventoSelect(p){
  const sel = document.getElementById(p+'-evento-link');
  if(sel){ const cur = sel.value; sel.innerHTML = getCompraEventoOpts(cur); sel.value = cur; }
  // Filtro de historial por evento
  const fsel = document.getElementById(p+'-filter-evento');
  if(fsel){
    const cur = fsel.value;
    const arr = getArr(p==='cf'?'floreria':'jardineria');
    const usadosMap = new Map();
    (arr||[]).forEach(r=>{
      if(!r) return;
      _compraEventosAlloc(r).forEach(a=>{ if(a && a.eventoId) usadosMap.set(a.eventoId, a.evento||findEventoById(a.eventoId)?.nombre||a.eventoId); });
    });
    const usados = [...usadosMap.entries()];
    fsel.innerHTML = '<option value="">Todos los eventos</option>' +
      usados.map(([id,nom])=>`<option value="${esc(id)}">${esc(nom)}</option>`).join('');
    fsel.value = cur;
  }
}
// Cambiar/quitar el evento de una línea de compra ya cargada, desde la tabla.
export function setCompraEvento(type, i, id){
  const r = getArr(type)[i];
  if(!r) return;
  const ev = id ? findEventoById(id) : null;
  r.eventoId = id || '';
  r.evento = ev ? (ev.nombre||'') : '';
  if(type==='floreria'){ window._comprasFloreLastSave = Date.now(); D.fbSave('comprasFlore', D.comprasFlore); }
  else { window._comprasJardLastSave = Date.now(); D.fbSave('comprasJard', D.comprasJard); }
  renderCompras(type);
  // Refrescar también el historial de pedidos recibidos, que ahora también
  // permite asociar el evento en sus renglones.
  const _hw = _histIds(type).wrap;
  if(document.getElementById(_hw)?.style.display !== 'none') renderHistorialCompras(type);
  if(document.getElementById('page-rentabilidad-eventos')?.classList.contains('active')) D.renderRentabilidad();
}

// ─── Reparto de una compra entre uno o más eventos (por cantidad) ───────────
// Modelo: r.eventos = [{eventoId, evento, qty}]. Se conserva r.eventoId/r.evento
// con el primer evento para compatibilidad con filtros/vistas antiguas.
let _cevState = null; // { type, idx, rows:[{eventoId, qty}] }

function _compraEventosAlloc(r){
  if(r && Array.isArray(r.eventos) && r.eventos.length) return r.eventos;
  if(r && r.eventoId) return [{ eventoId:r.eventoId, evento:r.evento||'', qty:_compraCant(r) }];
  return [];
}

// Celda con los eventos asignados (chips) + botón para abrir el editor.
function _compraEventosBtn(type, i, r){
  const allocs = _compraEventosAlloc(r);
  const chips = allocs.map(a=>{
    const ev = findEventoById(a.eventoId);
    const nom = ev ? (ev.nombre||'') : (a.evento||'evento');
    return `<span style="display:inline-block;background:#FCEEF2;border:1px solid #E0B3C4;color:#7A3A2A;border-radius:6px;font-size:12px;font-weight:600;padding:2px 6px;margin:0 3px 3px 0;white-space:nowrap">${esc(nom)} · ${esc(a.qty)}</span>`;
  }).join('');
  const has = allocs.length>0;
  const label = has ? 'Editar evento(s)' : 'Asignar evento(s)';
  const btnStyle = has
    ? 'background:#FCEEF2;border:1px solid #E0B3C4;color:#7A3A2A;font-weight:600'
    : 'background:#fff;border:1px solid var(--light-gray);color:var(--mid-gray)';
  return `<div style="margin-top:4px">${chips?`<div style="margin-bottom:3px">${chips}</div>`:''}<button type="button" onclick="openCompraEventos('${type}',${i})" style="${btnStyle};border-radius:6px;font-size:12px;padding:4px 8px;cursor:pointer;min-width:140px">${label}</button></div>`;
}

function _cevTotalHtml(){
  if(!_cevState) return '';
  const tot = _cevState.rows.reduce((s,row)=>s+(parseFloat(row.qty)||0), 0);
  const r = getArr(_cevState.type)[_cevState.idx];
  const disp = r ? _compraCant(r) : 0;
  const over = tot>disp;
  const totFmt = Number.isInteger(tot) ? tot : tot.toFixed(2);
  return `Repartido: <strong style="color:${over?'var(--red-alert)':'var(--charcoal)'}">${totFmt}</strong> / ${disp} comprado${over?' <span style="color:var(--red-alert)">· excede lo comprado</span>':''}`;
}

export function openCompraEventos(type, i){
  const r = getArr(type)[i];
  if(!r) return;
  const allocs = _compraEventosAlloc(r).map(a=>({ eventoId:a.eventoId||'', qty:(a.qty!=null?a.qty:'') }));
  if(!allocs.length) allocs.push({ eventoId:'', qty:'' });
  _cevState = { type, idx:i, rows:allocs, refDate:(r.fecha||'') };
  const sub = document.getElementById('cev-sub');
  if(sub) sub.innerHTML = `<strong>${esc(r.prod||'—')}</strong> · ${esc(_compraCant(r))} ${type==='floreria'?'paquete(s)':'unidad(es)'} · precio unit. $${parseMoney(r.costo).toLocaleString('es-AR')}<br>Repartí la compra entre los eventos indicando cuánta cantidad va a cada uno.`;
  _cevRender();
  document.getElementById('compra-eventos-modal').classList.add('open');
}

function _cevRender(){
  if(!_cevState) return;
  const cont = document.getElementById('cev-rows');
  if(!cont) return;
  const refDate = _cevState.refDate || '';
  const pastNote = (refDate && refDate < D.TODAY_ISO)
    ? `<div style="font-size:12px;color:var(--mid-gray);background:#FBF6EC;border:1px solid #E9DCAE;border-radius:6px;padding:6px 9px;margin-bottom:8px">Esta orden es del ${fmtDate(refDate)} (ya pasó): se muestran los eventos dentro de ±5 días de esa fecha, incluidos los finalizados.</div>`
    : '';
  cont.innerHTML = pastNote + _cevState.rows.map((row,ri)=>{
    return `<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
      <select class="form-input" onchange="cevSet(${ri},'eventoId',this.value)" style="flex:1;font-size:12px;min-width:0">${getCompraEventoOpts(row.eventoId, refDate)}</select>
      <input class="form-input" type="number" min="0" step="any" value="${esc(row.qty)}" placeholder="cant." onchange="cevSet(${ri},'qty',this.value)" style="width:70px;font-size:12px;text-align:center">
      <button type="button" onclick="cevRemove(${ri})" title="Quitar" style="border:none;background:none;color:var(--red-alert);cursor:pointer;font-size:14px;width:24px">✕</button>
    </div>`;
  }).join('');
  const totEl = document.getElementById('cev-total');
  if(totEl) totEl.innerHTML = _cevTotalHtml();
}

export function cevSet(ri, field, val){
  if(!_cevState || !_cevState.rows[ri]) return;
  _cevState.rows[ri][field] = val;
  if(field==='eventoId'){ _cevRender(); }
  else { const totEl = document.getElementById('cev-total'); if(totEl) totEl.innerHTML = _cevTotalHtml(); }
}

export function cevAdd(){
  if(!_cevState) return;
  _cevState.rows.push({ eventoId:'', qty:'' });
  _cevRender();
}

export function cevRemove(ri){
  if(!_cevState) return;
  _cevState.rows.splice(ri,1);
  if(!_cevState.rows.length) _cevState.rows.push({ eventoId:'', qty:'' });
  _cevRender();
}

export function guardarCompraEventos(){
  if(!_cevState) return;
  const { type, idx } = _cevState;
  const r = getArr(type)[idx];
  if(!r){ D.closeModal('compra-eventos-modal'); return; }
  const allocs = _cevState.rows
    .filter(row=>row.eventoId)
    .map(row=>{ const ev = findEventoById(row.eventoId); return { eventoId:row.eventoId, evento: ev?(ev.nombre||''):'', qty: parseFloat(row.qty)||0 }; });
  // Consolidar renglones repetidos del mismo evento
  const merged = [];
  allocs.forEach(a=>{ const ex = merged.find(m=>m.eventoId===a.eventoId); if(ex) ex.qty += a.qty; else merged.push({...a}); });
  if(merged.length){
    r.eventos = merged;
    r.eventoId = merged[0].eventoId;   // compat con filtros / rentabilidad antigua
    r.evento   = merged[0].evento;
  } else {
    delete r.eventos;
    r.eventoId = '';
    r.evento   = '';
  }
  if(type==='floreria'){ window._comprasFloreLastSave = Date.now(); D.fbSave('comprasFlore', D.comprasFlore); }
  else { window._comprasJardLastSave = Date.now(); D.fbSave('comprasJard', D.comprasJard); }
  D.closeModal('compra-eventos-modal');
  renderCompras(type);
  const _hw = _histIds(type).wrap;
  if(document.getElementById(_hw)?.style.display !== 'none') renderHistorialCompras(type);
  if(document.getElementById('page-rentabilidad-eventos')?.classList.contains('active')) D.renderRentabilidad();
}

// Total gastado en compras (florería + jardinería) vinculadas a un evento.
// Si la compra se reparte entre varios eventos (c.eventos), se toma solo la
// parte proporcional (precio unitario × cantidad asignada a ese evento).
export function gastoComprasEvento(eventoId){
  if(!eventoId) return 0;
  return [...(D.comprasFlore||[]), ...(D.comprasJard||[])].reduce((s,c)=>{
    if(!c || c.anulado) return s;   // lo anulado no cuenta en el gasto del evento
    if(Array.isArray(c.eventos) && c.eventos.length){
      const cant = c.eventos
        .filter(a=>a && a.eventoId===eventoId)
        .reduce((t,a)=>t+(parseFloat(a.qty)||0), 0);
      return s + parseMoney(c.costo)*cant;
    }
    if(c.eventoId===eventoId) return s + _compraImporte(c);
    return s;
  }, 0);
}

export function addCompra(type){
  // Guardia anti-borrado: no guardar compras antes de la primera sincronización
  // (evita sobrescribir el historial si la lista todavía está vacía en memoria).
  if(type==='floreria' ? !window._comprasFloreLoaded : !window._comprasJardLoaded){
    showToast('Las compras todavía se están cargando — esperá unos segundos e intentá de nuevo.','error'); return;
  }
  const p=type==='floreria'?'cf':'cj';
  const prod=nombreArticulo(document.getElementById(p+'-producto').value);
  if(!validarCampos([
    { id:p+'-producto', req:true, msg:'Elegí o escribí el producto' },
    { id:p+'-costo', tipo:'monto' },
    { id:p+'-fecha', tipo:'fecha' },
  ])) return;

  // Evento asociado (opcional) — se guarda el id estable + el nombre para mostrar
  const eventoId = document.getElementById(p+'-evento-link')?.value || '';
  const eventoObj = eventoId ? findEventoById(eventoId) : null;
  const eventoNombre = eventoObj ? (eventoObj.nombre||'') : '';

  const fecha = document.getElementById(p+'-fecha').value||D.TODAY_ISO;
  const pedidopor = document.getElementById(p+'-pedidopor').value||'—';
  const desc = document.getElementById(p+'-desc').value||'';
  const prov = document.getElementById(p+'-proveedor').value||'';
  // El campo "costo" es el PRECIO POR PAQUETE (lo que sale un paquete),
  // no el total del pedido. El importe de cada línea = precio × cantidad.
  const precioPaq = parseMoney(document.getElementById(p+'-costo').value);
  const sucursal = D.getSucursalId();

  // Reparto entre varias áreas (solo florería): una línea de compra por área,
  // con la cantidad de paquetes de cada una. El precio por paquete es el mismo
  // en todas las líneas (no se prorratea: cada paquete cuesta lo mismo).
  const splits = type==='floreria'
    ? getCfSplitRows().filter(r=>r.sector && parseFloat(r.qty)>0)
    : [];

  if(splits.length > 0){
    splits.forEach((r)=>{
      const qty = parseFloat(r.qty)||0;
      getArr(type).unshift({
        fecha, pedidopor, prod, desc,
        qty,
        costo: precioPaq>0 ? String(precioPaq) : '',
        prov,
        sector: r.sector,
        eventoId, evento: eventoNombre,
        estado:'pedido',
        sucursal
      });
    });
    resetCfSplitRows();
    document.getElementById('cf-split-wrap').style.display = 'none';
    showToast(`"${prod}" repartido en ${splits.length} áreas`);
  } else {
    getArr(type).unshift({
      fecha, pedidopor, prod, desc,
      qty:document.getElementById(p+'-cantidad').value||1,
      costo:document.getElementById(p+'-costo').value||'',
      prov,
      sector:document.getElementById(p+'-sector').value||'',
      eventoId, evento: eventoNombre,
      estado:'pedido',
      sucursal
    });
  }

  // Persistir en Firebase (antes no se guardaba al agregar: los ítems se
  // perdían al refrescar y el usuario compras no los veía en su dispositivo)
  if(type==='floreria'){ window._comprasFloreLastSave = Date.now(); D.fbSave('comprasFlore', D.comprasFlore); }
  else { window._comprasJardLastSave = Date.now(); D.fbSave('comprasJard', D.comprasJard); }

  // El costo por vara del cotizador (flores/follaje) se calcula en la recepción,
  // donde se conocen las varas por paquete reales (costo por paquete ÷ varas/paq).
  // Al cargar el pedido todavía no se sabe cuántas varas trae cada paquete, así
  // que no se toca el cotizador acá para no meter un precio por vara equivocado.

  ['fecha','pedidopor','producto','cantidad','desc','costo','proveedor','sector'].forEach(id=>{
    const el=document.getElementById(p+'-'+id);
    if(el) el.value='';
  });
  if(type==='floreria') cfCategoriaVaraPreview();
  renderCompras(type);
  if(document.getElementById('page-stock').classList.contains('active')) D.renderStock();
  updateKpiCompras();
}

// ── Importar pedido desde Excel/Sheets (.xlsx) — Compras Florería ──
// Lee el archivo tal como lo cargan hoy (columnas Fecha, Pedido por,
// Producto, Descripción, Cantidad, Precio por paquete, Proveedor, Área/uso),
// detectando las columnas por el nombre del encabezado. Nunca escribe nada
// directo: siempre pasa por una vista previa que hay que confirmar, y las
// filas importadas quedan en estado "pedido" (no tocan stock) — recién se
// suman al stock cuando se controlan/recepcionan como cualquier otro pedido.
let cfImportWb = null;
let cfImportRows = [];

const CF_IMPORT_SYNONYMS = {
  fecha:      ['fecha'],
  pedidopor:  ['pedido por','pedido realizado por','pedidopor','pedido'],
  prod:       ['flor / follaje','flor/follaje','producto','flor','articulo','artículo'],
  desc:       ['descripcion adicional','descripcion','descripción','desc','detalle','color'],
  qty:        ['cantidad','cant','paq','paquetes'],
  costoUnit:  ['precio','costo','precio unitario','precio por paquete','precio paquete'],
  prov:       ['proveedor','prov'],
  sector:     ['usuario final / area','usuario final / área','usuario final','area/uso','área/uso','area / uso','área / uso','area','área','sector']
};

function normHeaderTxt(s){
  return String(s||'').toLowerCase()
    .replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i')
    .replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u').replace(/ñ/g,'n')
    .trim();
}

function parseFechaImport(v){
  if(v==null || v==='') return '';
  if(typeof v === 'number'){
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    if(isNaN(d)) return '';
    return d.toISOString().slice(0,10);
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if(m){
    let [, dd, mm, yy] = m;
    if(yy.length===2) yy = (+yy < 70 ? '20'+yy : '19'+yy);
    return `${yy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
  }
  return '';
}

export function cfImportFile(input){
  const file = input.files?.[0];
  if(!file) return;
  const X = window.XLSX;
  if(!X){ showToast('Error: librería XLSX no disponible','error'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    try{
      cfImportWb = X.read(new Uint8Array(e.target.result), {type:'array'});
    } catch(err){
      showToast('No se pudo leer el archivo: '+err.message,'error');
      return;
    }
    const sheets = cfImportWb.SheetNames || [];
    if(!sheets.length){ showToast('El archivo no tiene hojas.','error'); return; }
    const sel = document.getElementById('cf-import-sheet-sel');
    sel.innerHTML = sheets.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
    // Preseleccionar la hoja que parezca el mes actual, si existe
    const mesActual = normHeaderTxt(D.getMonthLabel(D.TODAY_ISO));
    const match = sheets.find(s=>normHeaderTxt(s)===mesActual || mesActual.startsWith(normHeaderTxt(s)));
    if(match) sel.value = match;
    document.getElementById('cf-import-sheet-picker').style.display = 'flex';
    document.getElementById('cf-import-preview').style.display = 'none';
  };
  reader.readAsArrayBuffer(file);
}

export function cfImportCancel(){
  cfImportWb = null;
  cfImportRows = [];
  document.getElementById('cf-import-sheet-picker').style.display = 'none';
  document.getElementById('cf-import-preview').style.display = 'none';
  document.getElementById('cf-import-file').value = '';
}

export function cfImportParseSheet(){
  const X = window.XLSX;
  const sheetName = document.getElementById('cf-import-sheet-sel').value;
  const sheet = cfImportWb?.Sheets?.[sheetName];
  if(!sheet){ showToast('No se encontró la hoja seleccionada.','error'); return; }

  const rows = X.utils.sheet_to_json(sheet, {header:1, raw:true, defval:''});
  // Buscar la fila de encabezados: la primera con al menos 2 celdas de texto reconocibles
  let headerIdx = -1, colMap = {};
  for(let i=0;i<Math.min(rows.length,10);i++){
    const row = rows[i];
    const map = {};
    row.forEach((cell,ci)=>{
      const h = normHeaderTxt(cell);
      if(!h) return;
      for(const [field, syns] of Object.entries(CF_IMPORT_SYNONYMS)){
        if(map[field]!=null) continue;
        if(syns.some(s=>h===normHeaderTxt(s))) map[field] = ci;
      }
    });
    if(map.prod!=null && map.qty!=null){ headerIdx = i; colMap = map; break; }
  }
  if(headerIdx===-1){
    showToast('No pude detectar los encabezados (necesito al menos "Producto" y "Cantidad"). Revisá que la primera fila tenga los títulos de columna.','error');
    return;
  }

  const parsed = [];
  for(let i=headerIdx+1;i<rows.length;i++){
    const row = rows[i];
    const prod = colMap.prod!=null ? String(row[colMap.prod]??'').trim() : '';
    if(!prod) continue; // fila vacía o separadora
    const qty = colMap.qty!=null ? (parseFloat(row[colMap.qty]) || 0) : 0;
    if(qty<=0) continue;
    const costoUnit = colMap.costoUnit!=null ? parseMoney(row[colMap.costoUnit]) : 0;
    parsed.push({
      fecha: colMap.fecha!=null ? parseFechaImport(row[colMap.fecha]) : '',
      pedidopor: colMap.pedidopor!=null ? String(row[colMap.pedidopor]??'').trim() : '',
      prod,
      desc: colMap.desc!=null ? String(row[colMap.desc]??'').trim() : '',
      qty,
      costo: costoUnit>0 ? String(costoUnit) : '', // precio por paquete: el importe se calcula como precio × cantidad
      prov: colMap.prov!=null ? String(row[colMap.prov]??'').trim() : '',
      sector: colMap.sector!=null ? String(row[colMap.sector]??'').trim() : ''
    });
  }

  if(!parsed.length){
    showToast('No encontré filas con producto y cantidad para importar en esa hoja.','error');
    return;
  }

  cfImportRows = parsed;
  document.getElementById('cf-import-sheet-picker').style.display = 'none';
  renderCfImportPreview(colMap);
}

function renderCfImportPreview(colMap){
  const el = document.getElementById('cf-import-preview');
  if(!el) return;
  const campoLabel = {fecha:'Fecha',pedidopor:'Pedido por',prod:'Producto',desc:'Descripción',qty:'Cantidad',costoUnit:'Precio (por paquete)',prov:'Proveedor',sector:'Área/uso'};
  const detectados = Object.entries(colMap).map(([f,ci])=>`${campoLabel[f]||f}: col. ${String.fromCharCode(65+ci)}`).join(' · ');
  el.style.display = '';
  el.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px">Vista previa de importación — ${cfImportRows.length} pedido${cfImportRows.length!==1?'s':''}</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:10px">Columnas detectadas: ${esc(detectados)}. Los pedidos se cargan en estado "Pedido" (no tocan el stock) — el stock se actualiza recién cuando los controles/recepciones como a cualquier otro pedido.</div>
    <div style="max-height:320px;overflow:auto;border:1px solid var(--light-gray);border-radius:6px">
      <table style="width:100%;font-size:12px;border-collapse:collapse">
        <thead><tr style="background:var(--surface-1);position:sticky;top:0">
          <th style="padding:5px 8px;text-align:left">Fecha</th><th style="padding:5px 8px;text-align:left">Pedido por</th>
          <th style="padding:5px 8px;text-align:left">Producto</th><th style="padding:5px 8px;text-align:left">Desc.</th>
          <th style="padding:5px 8px;text-align:center">Cant.</th><th style="padding:5px 8px;text-align:right">Precio x paq</th>
          <th style="padding:5px 8px;text-align:left">Proveedor</th><th style="padding:5px 8px;text-align:left">Área/uso</th>
        </tr></thead>
        <tbody>${cfImportRows.map(r=>`<tr style="border-top:1px solid var(--surface-2)">
          <td style="padding:5px 8px">${esc(r.fecha||'—')}</td>
          <td style="padding:5px 8px">${esc(r.pedidopor||'—')}</td>
          <td style="padding:5px 8px;font-weight:500">${esc(r.prod)}</td>
          <td style="padding:5px 8px;color:var(--mid-gray)">${esc(r.desc||'—')}</td>
          <td style="padding:5px 8px;text-align:center">${esc(r.qty)}</td>
          <td style="padding:5px 8px;text-align:right">${r.costo?'$'+parseMoney(r.costo).toLocaleString('es-AR'):'—'}</td>
          <td style="padding:5px 8px">${esc(r.prov||'—')}</td>
          <td style="padding:5px 8px">${esc(r.sector||'—')}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn-add" onclick="cfImportConfirm()">Confirmar importación de ${cfImportRows.length} pedidos</button>
      <button class="btn-secondary" onclick="cfImportCancel()">✕ Cancelar</button>
    </div>`;
}

export async function cfImportConfirm(){
  if(!cfImportRows.length) return;
  if(!window._comprasFloreLoaded){ showToast('Las compras todavía se están cargando — esperá unos segundos e intentá de nuevo.','error'); return; }
  if(!await confirmModal(`¿Importar ${cfImportRows.length} pedidos a Compras Florería? Quedarán en estado "Pedido", listos para controlar.`)) return;
  const sucursal = D.getSucursalId();
  let nuevosProv = 0;
  cfImportRows.forEach(r=>{
    // Registrar automáticamente proveedores nuevos que vengan en el Excel
    // y no estén ya en la lista, para que el desplegable los reconozca.
    if(r.prov && !D.proveedoresList.includes(r.prov)){
      D.proveedoresList.push(r.prov);
      nuevosProv++;
    }
    D.comprasFlore.unshift({
      fecha: r.fecha || D.TODAY_ISO,
      pedidopor: r.pedidopor || '—',
      prod: r.prod,
      desc: r.desc || '',
      qty: r.qty,
      costo: r.costo || '',
      prov: r.prov || '',
      sector: r.sector || '',
      estado: 'pedido',
      sucursal
    });
  });
  if(nuevosProv > 0){
    D.proveedoresList.sort((a,b)=>a.localeCompare(b,'es'));
    D.fbSave('proveedoresList', D.proveedoresList);
  }
  window._comprasFloreLastSave = Date.now();
  D.fbSave('comprasFlore', D.comprasFlore);
  showToast(`${cfImportRows.length} pedidos importados${nuevosProv?` (${nuevosProv} proveedor${nuevosProv!==1?'es':''} nuevo${nuevosProv!==1?'s':''} agregado${nuevosProv!==1?'s':''})`:''}`);
  cfImportCancel();
  renderCompras('floreria');
  updateKpiCompras();
}

// ════════════════════════════════════════════════════════════════════════
//  Importar EVENTOS desde el "Daily Report" (DDR - Florist) en PDF
//  El daily del Park Hyatt trae los eventos del día + 3 días siguientes, así
//  que dailies consecutivos se pisan: se deduplica por "Número Orden de
//  Evento" (único por orden). Nunca escribe directo: pasa por una vista
//  previa donde cada evento sale como NUEVO / YA CARGADO / MODIFICADO y se
//  confirma. Al actualizar un modificado solo se tocan los datos del evento,
//  nunca el estado ni las asignaciones que cargó el equipo.
// ════════════════════════════════════════════════════════════════════════
let evImportParsed = [];   // eventos detectados en el PDF, con su _status y _sel

// Lee un PDF (Uint8Array) con pdf.js y devuelve páginas como líneas ordenadas.
async function _evExtractPages(data){
  const pdfjs = await window.ensurePDFJS();
  const doc = await pdfjs.getDocument({ data, isEvalSupported:false }).promise;
  const pages = [];
  for(let p=1;p<=doc.numPages;p++){
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const buckets = {};
    for(const it of tc.items){
      if(!it.str.trim()) continue;
      const x = Math.round(it.transform[4]);
      const y = Math.round(it.transform[5]);
      const key = Math.round(y/4)*4;
      (buckets[key] ||= []).push({x, str:it.str.trim()});
    }
    const lines = Object.keys(buckets).map(Number).sort((a,b)=>b-a).map(y=>{
      const cells = buckets[y].sort((a,b)=>a.x-b.x);
      return { y, cells, text: cells.map(c=>c.str).join('  ') };
    });
    pages.push(lines);
  }
  return pages;
}

export function evImportFile(input){
  const file = input.files?.[0];
  input.value = '';
  if(!file) return;
  showToast('Leyendo el daily…');
  const reader = new FileReader();
  reader.onload = async (ev) => {
    try{
      const pages = await _evExtractPages(new Uint8Array(ev.target.result));
      const parsed = _evParseEvents(pages);
      if(!parsed.length){ showToast('No encontré eventos en ese PDF. ¿Es el Daily Report (DDR - Florist)?','error'); return; }
      // Deduplicar contra lo ya cargado. Clave primaria: Nº Orden de Evento.
      // Clave secundaria (respaldo): nombre + fecha — porque algunos dailies
      // reimprimen la misma orden con un Nº distinto, y el usuario piensa el
      // evento por "el del 2 de septiembre", no por su número. Así, aunque
      // cambie el Nº de Orden, un mismo evento (mismo nombre y fecha) no se
      // vuelve a crear.
      const byOrden = {}, byNombreFecha = {};
      D.eventosData.forEach((ev,i)=>{
        if(ev.ordenId) byOrden[ev.ordenId]=i;
        const k = _evStripAcc(ev.nombre)+'|'+(ev.fecha||'');
        if(byNombreFecha[k]==null) byNombreFecha[k]=i;
      });
      evImportParsed = parsed.map(e=>{
        const nuevo = _evToEvento(e);
        let existIdx = e.ordenId && byOrden[e.ordenId]!=null ? byOrden[e.ordenId] : -1;
        if(existIdx<0){
          const k = _evStripAcc(nuevo.nombre)+'|'+(nuevo.fecha||'');
          if(nuevo.nombre && nuevo.fecha && byNombreFecha[k]!=null) existIdx = byNombreFecha[k];
        }
        let status='nuevo', cambios=[];
        if(existIdx>=0){
          const prev = D.eventosData[existIdx];
          const campos = [['fecha','Fecha'],['nombre','Nombre'],['tipoEvento','Tipo de evento'],['organizador','Organizador'],['salon','Salón'],['hora','Hora'],['pax','Pax'],['precio','Precio'],['notas','Detalle']];
          campos.forEach(([k,lbl])=>{ if(String(prev[k]??'')!==String(nuevo[k]??'')) cambios.push(lbl); });
          status = cambios.length ? 'modificado' : 'cargado';
        }
        return { nuevo, existIdx, status, cambios, _sel: status!=='cargado' };
      });
      renderEvImportPreview();
      document.getElementById('ev-import-modal').classList.add('open');
    }catch(err){
      showToast('No pude leer el PDF: '+(err.message||err),'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

export function evImportToggle(i){ if(evImportParsed[i] && evImportParsed[i].status!=='cargado'){ evImportParsed[i]._sel=!evImportParsed[i]._sel; renderEvImportPreview(); } }

function renderEvImportPreview(){
  const el = document.getElementById('ev-import-body'); if(!el) return;
  const n = evImportParsed.filter(e=>e.status==='nuevo').length;
  const m = evImportParsed.filter(e=>e.status==='modificado').length;
  const c = evImportParsed.filter(e=>e.status==='cargado').length;
  const BADGE = {
    nuevo:      '<span style="background:#E6F2E6;color:#2E6B2E;font-size:12px;font-weight:600;padding:2px 7px;border-radius:4px">NUEVO</span>',
    modificado: '<span style="background:#FBF3D9;color:var(--amber);font-size:12px;font-weight:600;padding:2px 7px;border-radius:4px">MODIFICADO</span>',
    cargado:    '<span style="background:#EFEDE8;color:#8A857A;font-size:12px;font-weight:600;padding:2px 7px;border-radius:4px">YA CARGADO</span>'
  };
  const rows = evImportParsed.map((e,i)=>{
    const o=e.nuevo;
    const dis = e.status==='cargado';
    const cambios = e.cambios.length ? `<div style="font-size:12px;color:var(--amber);margin-top:3px">Cambió: ${esc(e.cambios.join(', '))}</div>` : '';
    const arreglos = o.notas ? `<div style="font-size:12px;color:var(--mid-gray);margin-top:4px;white-space:pre-wrap">${esc(o.notas)}</div>` : '';
    return `<div style="display:flex;gap:10px;padding:10px 4px;border-top:1px solid var(--surface-2);${dis?'opacity:.55':''}">
      <input type="checkbox" ${e._sel?'checked':''} ${dis?'disabled':''} onchange="evImportToggle(${i})" style="margin-top:3px;width:16px;height:16px;flex:0 0 auto">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          ${BADGE[e.status]}
          <strong style="font-size:13px">${esc(o.nombre)}</strong>
          <span style="font-size:12px;color:var(--mid-gray)">${o.fecha?fmtDate(o.fecha):'sin fecha'}${o.hora?' · '+esc(o.hora):''}${o.salon?' · '+esc(o.salon):''}${o.pax?' · '+o.pax+' pax':''}</span>
        </div>
        ${o.tipoEvento?`<div style="font-size:12px;color:var(--charcoal);margin-top:2px">${esc(o.tipoEvento)}${o.organizador?' · '+esc(o.organizador):''}</div>`:''}
        ${cambios}${arreglos}
      </div>
    </div>`;
  }).join('');
  const selCount = evImportParsed.filter(e=>e._sel).length;
  el.innerHTML = `
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:6px">
      ${n} nuevo${n!==1?'s':''} · ${m} modificado${m!==1?'s':''} · ${c} ya cargado${c!==1?'s':''}. Se importan solo los tildados; los modificados actualizan el evento sin tocar su estado ni las asignaciones.
    </div>
    <div style="max-height:52vh;overflow:auto">${rows}</div>
    <div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end">
      <button class="btn-secondary" onclick="closeModal('ev-import-modal')">Cancelar</button>
      <button class="btn-add" ${selCount?'':'disabled'} onclick="evImportConfirm()">Importar ${selCount} evento${selCount!==1?'s':''}</button>
    </div>`;
}

export function evImportConfirm(){
  // Guardia anti-borrado: no guardar eventos antes de que carguen desde la nube
  // (si eventosData está vacío en memoria, importar sobrescribiría los existentes).
  if(!window._eventosLoaded){ showToast('Los eventos todavía se están cargando — esperá unos segundos e intentá de nuevo.','error'); return; }
  const sel = evImportParsed.filter(e=>e._sel);
  if(!sel.length){ showToast('No hay eventos tildados.','error'); return; }
  let nuevos=0, actualizados=0;
  sel.forEach(e=>{
    if(e.status==='nuevo'){
      const ev = e.nuevo; ev.id = genEventoId();
      D.eventosData.push(ev); nuevos++;
    } else if(e.status==='modificado' && e.existIdx>=0){
      // Solo datos descriptivos; se preserva estado, asignaciones, fases, id, etc.
      const prev = D.eventosData[e.existIdx]; const nu = e.nuevo;
      ['nombre','tipoEvento','fecha','hora','horaFin','salon','pax','precio','notas','organizador','ordenId'].forEach(k=>{ prev[k]=nu[k]; });
      actualizados++;
    }
  });
  D._saveEventos();
  if(typeof D.syncEventosToKanban==='function'){ D.syncEventosToKanban(); D.fbSave('kanbanData', D.kanbanData); }
  D.closeModal('ev-import-modal');
  evImportParsed = [];
  let msg = [];
  if(nuevos) msg.push(`${nuevos} evento${nuevos!==1?'s':''} nuevo${nuevos!==1?'s':''}`);
  if(actualizados) msg.push(`${actualizados} actualizado${actualizados!==1?'s':''}`);
  showToast('Daily importado: '+msg.join(' · '));
  D.renderEventos(); D.renderHome();
}

export function applyCompraFilter(type){
  const from = document.getElementById((type==='floreria'?'cf':'cj')+'-from').value;
  const to   = document.getElementById((type==='floreria'?'cf':'cj')+'-to').value;
  if(!from && !to){ clearCompraFilter(type); return; }
  compraFilter[type] = { from: from||'2000-01', to: to||'2099-12' };
  renderCompras(type);
}

export function clearCompraFilter(type){
  compraFilter[type] = null;
  renderCompras(type);
}

export function renderPeriodTabs(type){
  const arr = getArr(type);
  const months = [...new Set(arr.map(r=>r.fecha?r.fecha.slice(0,7):''))].filter(Boolean).sort().reverse();
  const tabsEl = document.getElementById('compras-'+(type==='floreria'?'flore':'jard')+'-period-tabs');
  const f = compraFilter[type];
  tabsEl.innerHTML = '<span style="font-size:12px;color:var(--mid-gray);margin-right:6px;white-space:nowrap">Acceso rápido:</span>';
  const allBtn = document.createElement('button');
  allBtn.className = 'hist-filter-btn'+(!f?' active':'');
  allBtn.textContent = 'Todo';
  allBtn.onclick = ()=>clearCompraFilter(type);
  tabsEl.appendChild(allBtn);
  months.forEach(m=>{
    const btn = document.createElement('button');
    const isCurrent = f && f.from===m && f.to===m;
    btn.className = 'hist-filter-btn'+(isCurrent?' active':'');
    btn.textContent = D.getMonthLabel(m+'-01');
    btn.onclick = ()=>{
      compraFilter[type] = isCurrent ? null : { from:m, to:m };
      renderCompras(type);
    };
    tabsEl.appendChild(btn);
  });
}

// Cantidad de paquetes de una compra (recibidos si ya llegó, si no lo pedido).
// Fallback a 1 para filas viejas sin cantidad cargada, así no se anula su importe.
function _compraCant(r){ return compraCant(r); }
// Importe total de una línea de compra = precio (por paquete) × cantidad que
// llegó (si ya se controló/recibió), o la pedida si todavía no llegó.
export function _compraImporte(r){ return compraImporte(r); }

export function renderCompraSummary(type, filtered){
  const summaryEl = document.getElementById('compras-'+(type==='floreria'?'flore':'jard')+'-summary');
  const { total, recibido: recibidos, enPedido, ordenes } = resumenCompras(filtered);
  summaryEl.innerHTML = `
    <div class="card"><div class="card-label">Total período</div><div class="card-value" style="font-size:26px">$${total.toLocaleString('es-AR')}</div><div class="card-sub">${ordenes} órdenes</div></div>
    <div class="card"><div class="card-label">Recibido</div><div class="card-value green" style="font-size:26px">$${recibidos.toLocaleString('es-AR')}</div></div>
    <div class="card"><div class="card-label">En pedido</div><div class="card-value amber" style="font-size:26px">${enPedido}</div><div class="card-sub">esperando recepción</div></div>`;
}

// Returns HTML badge showing stock status for a given product name
export function getStockBadge(prodName){
  if(!prodName) return '<span class="stock-inline-badge sib-none">—</span>';
  // Renglones del mismo artículo (sin importar mayúsculas, tildes ni plural)
  const matches = D.stockData.filter(s => mismoArticulo(s.prod, prodName));
  if(matches.length === 0){
    return '<span class="stock-inline-badge sib-none">Sin datos</span>';
  }
  // Use the best (highest actual) match
  const best = matches.reduce((a,b) => a.actual > b.actual ? a : b);
  const al = D.getAlerta(best);
  if(al === 'ok'){
    return `<span class="stock-inline-badge sib-ok">${best.actual} uds</span>`;
  } else if(al === 'atencion'){
    return `<span class="stock-inline-badge sib-low">${best.actual} uds</span><div style="font-size:12px;color:var(--amber);margin-top:2px">Mín: ${best.min}</div>`;
  } else {
    const label = best.actual <= 0 ? 'Sin stock' : best.actual+' uds';
    return `<span class="stock-inline-badge sib-out">${label}</span><div style="font-size:12px;color:var(--red-alert);margin-top:2px">Mín: ${best.min}</div>`;
  }
}

export function renderCompras(type){
  if(type==='floreria') populateFloreriaFormHelpers();
  const arr = getArr(type);
  const p = type==='floreria' ? 'cf' : 'cj';
  populateCompraEventoSelect(p);
  const f = compraFilter[type];

  // Filtro de período (meses)
  let filtered = f
    ? arr.filter(r=>{ const ym=r.fecha?r.fecha.slice(0,7):''; return ym>=f.from && ym<=f.to; })
    : arr;

  renderPeriodTabs(type);

  // ── Poblar y leer filtros extra (proveedor, área, fecha) ──
  const provSel  = document.getElementById(p+'-filter-prov');
  const areaSel  = document.getElementById(p+'-filter-area');
  const desdeInp = document.getElementById(p+'-filter-desde');
  const hastaInp = document.getElementById(p+'-filter-hasta');

  if(provSel){
    const provActual = provSel.value;
    const provs = [...new Set(arr.filter(r=>r.prov).map(r=>r.prov))].sort((a,b)=>a.localeCompare(b,'es'));
    provSel.innerHTML = '<option value="">Todos los proveedores</option>' + provs.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');
    provSel.value = provActual;
  }
  if(areaSel){
    const areaActual = areaSel.value;
    const areas = [...new Set(arr.filter(r=>r.sector).map(r=>r.sector))].sort((a,b)=>a.localeCompare(b,'es'));
    areaSel.innerHTML = '<option value="">Todas las áreas</option>' + areas.map(a=>`<option value="${esc(a)}">${esc(a)}</option>`).join('');
    areaSel.value = areaActual;
  }

  const fProv  = provSel?.value || '';
  const fArea  = areaSel?.value || '';
  const fDesde = desdeInp?.value || '';
  const fHasta = hastaInp?.value || '';
  const fEvento = document.getElementById(p+'-filter-evento')?.value || '';

  if(fProv)   filtered = filtered.filter(r => r.prov === fProv);
  if(fArea)   filtered = filtered.filter(r => r.sector === fArea);
  if(fDesde)  filtered = filtered.filter(r => (r.fecha||'') >= fDesde);
  if(fHasta)  filtered = filtered.filter(r => (r.fecha||'') <= fHasta);
  if(fEvento) filtered = filtered.filter(r => _compraEventosAlloc(r).some(a=>a.eventoId===fEvento));

  filtered = D.applyCompraFiltersExtToArr(type, filtered);
  D.renderCompraFiltersPanel(type);
  renderCompraSummary(type, filtered);

  // Para la tabla: por defecto solo pedidos en curso (los recibidos se van solos).
  // Con "Incluir recibidos" tildado — o al filtrar por proveedor — se muestra todo
  // el historial, así se puede ver todo lo comprado a un proveedor (nuevo y viejo).
  // Con proveedor o un rango de fechas activo mostramos TODO (recibidos incluidos),
  // para que el filtro devuelva el historial completo del período, no solo lo pendiente.
  const incluirRecibidos = document.getElementById(p+'-filter-recibidos')?.checked || !!fProv || !!fDesde || !!fHasta;
  // Lo marcado "no llegó" (el proveedor no lo tenía) desaparece siempre de Compras.
  const visibles = filtered.filter(r => !r.noLlego);
  const activos = incluirRecibidos ? visibles : visibles.filter(r => r.estado !== 'recibido');
  const NCOLS = type==='floreria' ? 13 : 12;

  // Resumen del proveedor filtrado (total comprado + cantidad de pedidos)
  const provSummaryEl = document.getElementById(p+'-prov-summary');
  if(provSummaryEl){
    if(fProv && filtered.length){
      // Total del proveedor sin contar lo anulado (consistente con los KPI y el pedido).
      const activasProv = filtered.filter(r=>!r.anulado);
      const totalProv = activasProv.reduce((s,r)=>s+_compraImporte(r),0);
      const fechasProv = new Set(activasProv.map(r=>r.fecha).filter(Boolean)).size;
      provSummaryEl.style.display='';
      provSummaryEl.innerHTML = `<strong>${esc(fProv)}</strong> · ${activasProv.length} ítem${activasProv.length!==1?'s':''} en ${fechasProv} pedido${fechasProv!==1?'s':''} · total <strong>$${totalProv.toLocaleString('es-AR')}</strong>`;
    } else { provSummaryEl.style.display='none'; provSummaryEl.innerHTML=''; }
  }

  const tbody = getTbody(type);
  if(!tbody) return;
  if(activos.length===0){
    tbody.innerHTML=`<tr><td colspan="${NCOLS}" style="padding:20px;text-align:center;color:var(--mid-gray)">${filtered.length>0?'Todos los pedidos de este período fueron recibidos. Tildá "Incluir recibidos" para verlos.':'Sin compras en este período.'}</td></tr>`;
    if(type==='floreria') renderCompraAlert();
    return;
  }

  // ── Agrupar por fecha (cada fecha = bloque de pedido) ──
  const byDate = {};
  activos.forEach(r => {
    const d = r.fecha || 'sin-fecha';
    if(!byDate[d]) byDate[d] = [];
    byDate[d].push(r);
  });
  const fechas = Object.keys(byDate).sort((a,b) => b.localeCompare(a)); // más reciente primero

  let html = '';
  fechas.forEach(fecha => {
    const items = byDate[fecha];
    // El total y los conteos del pedido cuentan SOLO lo activo: lo anulado no suma
    // (queda visible tachado, pero no entra en el total ni en ítems/unidades).
    const activosBloque = items.filter(r => !r.anulado);
    const anuladosBloque = items.length - activosBloque.length;
    const totalBloque = activosBloque.reduce((s,r) => s + _compraImporte(r), 0);
    const cantItems = activosBloque.length;
    const cantTotal = activosBloque.reduce((s,r) => s + (+r.qty||0), 0);
    // Ítems de este pedido listos para recibir (controlados, que llegaron) → botón
    // para ingresar TODO el pedido al stock de una vez, sin ir renglón por renglón.
    const controladosBloque = type==='floreria'
      ? activosBloque.filter(r => r.estado==='controlado' && !r.noLlego).length
      : 0;
    html += `<tr class="compra-date-header">
      <td colspan="${NCOLS}" style="background:var(--surface-2);padding:10px 14px;border-bottom:2px solid var(--light-gray)">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <div>
            <strong style="font-size:14px;color:var(--charcoal)">Pedido del ${fecha!=='sin-fecha' ? fmtDate(fecha) : 'sin fecha'}</strong>
            <span style="color:var(--mid-gray);font-size:12px;margin-left:10px">${cantItems} ítem${cantItems!==1?'s':''} · ${cantTotal} unidades${anuladosBloque>0?` · <span style="color:var(--red-alert)">${anuladosBloque} anulado${anuladosBloque!==1?'s':''}</span>`:''}</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <span style="font-weight:600;color:var(--charcoal);font-size:13px">${totalBloque ? '$'+totalBloque.toLocaleString('es-AR') : ''}</span>
            ${controladosBloque>0 ? `<button class="btn-primary" style="font-size:12px;padding:4px 12px" onclick="recibirPedidoCompleto('${fecha}')" title="Recibir todos los ítems controlados de este pedido y subirlos al stock de una vez">✓ Recibir todo (${controladosBloque})</button>` : ''}
            <button class="btn-secondary" style="font-size:12px;padding:4px 10px" onclick="copiarBloquePedido('${type}','${fecha}')" title="Copiar este pedido con fecha de hoy para modificar">Copiar pedido</button>
          </div>
        </div>
      </td>
    </tr>`;
    items.forEach(r => {
      const i = arr.indexOf(r);
      // Importe y costo por vara — calculados igual que en el historial, para que
      // la misma información aparezca en todos lados.
      const _imp = parseMoney(r.costo)>0 ? '$'+_compraImporte(r).toLocaleString('es-AR') : '<span style="color:var(--mid-gray)">—</span>';
      const _cvDiv = parseFloat(r.varasPorPaq)||parseFloat(r.totalVaras)||parseFloat(r.qty)||0;
      const _cvVal = (parseMoney(r.costo)>0 && _cvDiv>0) ? Math.round(parseMoney(r.costo)/_cvDiv) : null;
      // Categoría de la vara (estación / importada / premium) con el costo de
      // ESTA compra: varas por paquete de la compra o, si todavía no se
      // recibió, las últimas conocidas del producto.
      const _catVpp = type==='floreria' ? ((parseFloat(r.varasPorPaq)||0)>1 ? parseFloat(r.varasPorPaq) : (getVarasPorPaq(r.prod)||0)) : 0;
      const _catBadge = (_catVpp>1 && parseMoney(r.costo)>0) ? '<div>'+badgeCategoriaVara(parseMoney(r.costo)/_catVpp)+'</div>' : '';
      const _cv = _cvVal!=null ? '$'+_cvVal.toLocaleString('es-AR')+_catBadge : '<span style="color:var(--mid-gray)">—</span>'+_catBadge;
      html += `<tr style="${D._recepFlagStyle(r)}">
      <td data-label="Fecha"><input class="form-input" type="date" value="${esc(r.fecha)}" onchange="updC('${type}',${i},'fecha',this.value)" style="min-width:130px"></td>
      <td data-label="Pedido por"><input class="form-input" value="${esc(r.pedidopor)}" onchange="updC('${type}',${i},'pedidopor',this.value)" style="min-width:100px"></td>
      <td data-label="${type==='floreria'?'Flor / Follaje':'Producto'}"><input class="form-input" value="${esc(r.prod)}" onchange="updC('${type}',${i},'prod',this.value)" style="min-width:140px">${D._recepFlagBadge(r, i)}</td>
      <td data-label="Descripción"><input class="form-input" value="${esc(r.desc)}" placeholder="—" onchange="updC('${type}',${i},'desc',this.value)" style="min-width:120px"></td>
      <td data-label="Cantidad"><input class="form-input" type="number" value="${esc(r.qty)}" onchange="updC('${type}',${i},'qty',this.value);renderStock();renderCompras('${type}')" style="width:65px"></td>
      <td data-label="${type==='floreria'?'Precio x paq':'Precio unit.'}"><input class="form-input" value="${esc(r.costo)}" placeholder="$" onchange="updC('${type}',${i},'costo',this.value);renderCompras('${type}')" style="width:90px"></td>
      <td data-label="Importe" style="text-align:right;font-weight:600;white-space:nowrap">${_imp}</td>
      ${type==='floreria'?`<td data-label="Costo/vara" style="text-align:right;font-weight:700;color:var(--sage-dark);white-space:nowrap">${_cv}</td>`:''}
      <td data-label="Proveedor"><select class="form-input" onchange="updC('${type}',${i},'prov',this.value)" style="min-width:130px"><option value=''>— Seleccionar —</option>${D.getProvOpts(r.prov)}</select></td>
      <td data-label="Área / Uso">${type==='floreria'
        ? `<select class="form-input" onchange="updC('${type}',${i},'sector',this.value)" style="min-width:140px">${getAreaUsoOpts(r.sector)}</select>`
        : `<input class="form-input" value="${esc(r.sector)}" onchange="updC('${type}',${i},'sector',this.value)" style="min-width:110px">`}
        ${_compraEventosBtn(type,i,r)}</td>
      <td data-label="Estado">
        ${r.estado==='controlado'
          ? `<span class="badge" style="background:#FBF3D9;color:var(--amber);border:1px solid #E9D9A0;font-size:12px;padding:3px 8px;border-radius:4px;white-space:nowrap">Controlado · falta precio</span>`
          : `<select class="form-select" onchange="updC('${type}',${i},'estado',this.value);updateKpiCompras()" style="min-width:120px">
          <option value="pedido" ${r.estado!=='recibido'?'selected':''}>Pedido</option>
          <option value="recibido" ${r.estado==='recibido'?'selected':''}>Recibido</option>
        </select>`}
      </td>
      <td data-label="Stock actual" style="vertical-align:middle">${getStockBadge(r.prod)}</td>
      <td class="compra-row-acciones" style="white-space:nowrap">
        ${type==='floreria' && r.estado==='controlado' ? `<button class="btn-primary" style="font-size:12px;padding:3px 8px;margin-right:4px" onclick="recibirRenglonCompra(${i})" title="Recibir este ítem y subirlo al stock">✓ Recibir</button>` : ''}
        <button class="btn-secondary" style="font-size:12px;padding:3px 7px;margin-right:4px" onclick="generarOrdenCompra(${i},'${type==='floreria'?'flore':'jard'}')" title="Generar Orden de Compra">OC</button>
        <button class="btn-icon" style="color:var(--red-alert)" onclick="delC('${type}',${i})">✕</button>
      </td>
    </tr>`;
    });
  });
  tbody.innerHTML = html;

  if(type==='floreria') renderCompraAlert();
}

export function renderCompraAlert(){
  const alertEl=document.getElementById('compra-floreria-alert');
  if(alertEl){
    const crits=D.stockData.filter(s=>D.getAlerta(s)==='comprar');
    alertEl.innerHTML=crits.length?`<div class="alert-banner" style="margin-bottom:16px"><strong>${crits.length} producto${crits.length>1?'s':''} con stock crítico:</strong> ${crits.map(s=>esc(s.prod)).join(', ')}. Consideralos para el próximo pedido.</div>`:'';
  }
}

export function clearCompraExtraFilters(type){
  const p = type==='floreria' ? 'cf' : 'cj';
  const provSel = document.getElementById(p+'-filter-prov');
  const areaSel = document.getElementById(p+'-filter-area');
  const desdeInp = document.getElementById(p+'-filter-desde');
  const hastaInp = document.getElementById(p+'-filter-hasta');
  const recibInp = document.getElementById(p+'-filter-recibidos');
  const eventoSel = document.getElementById(p+'-filter-evento');
  if(provSel) provSel.value = '';
  if(areaSel) areaSel.value = '';
  if(desdeInp) desdeInp.value = '';
  if(hastaInp) hastaInp.value = '';
  if(recibInp) recibInp.checked = false;
  if(eventoSel) eventoSel.value = '';
  renderCompras(type);
}

function _histIds(type){
  return type==='jardineria'
    ? { btn:'hist-compras-jard-btn', bar:'hist-compras-jard-filterbar', search:'hist-compras-jard-search', prov:'hist-compras-jard-prov', summary:'hist-compras-jard-summary', wrap:'historial-compras-jard-wrap' }
    : { btn:'hist-compras-btn', bar:'hist-compras-filterbar', search:'hist-compras-search', prov:'hist-compras-prov', summary:'hist-compras-summary', wrap:'historial-compras-wrap' };
}

export function toggleHistorialCompras(type='floreria'){
  const ids = _histIds(type);
  const wrap = document.getElementById(ids.wrap);
  if(!wrap) return;
  const visible = wrap.style.display !== 'none';
  wrap.style.display = visible ? 'none' : '';
  const bar = document.getElementById(ids.bar);
  if(bar) bar.style.display = visible ? 'none' : 'flex';
  document.getElementById(ids.btn).textContent = visible ? 'Ver historial de pedidos recibidos' : 'Ocultar historial';
  if(!visible) renderHistorialCompras(type);
}

export function renderHistorialCompras(type='floreria'){
  const ids = _histIds(type);
  const arr = getArr(type);
  const wrap = document.getElementById(ids.wrap);
  if(!wrap) return;

  const todosRecibidos = arr.filter(r => r.estado === 'recibido' && !r.anulado);

  // Poblar el filtro de proveedores del historial
  const provSel = document.getElementById(ids.prov);
  if(provSel){
    const provActual = provSel.value;
    const provs = [...new Set(todosRecibidos.filter(r=>r.prov).map(r=>r.prov))].sort((a,b)=>a.localeCompare(b,'es'));
    provSel.innerHTML = '<option value="">Todos los proveedores</option>' + provs.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');
    provSel.value = provActual;
  }

  // Aplicar filtros de proveedor y búsqueda de producto
  const fProv = document.getElementById(ids.prov)?.value || '';
  const q = (document.getElementById(ids.search)?.value || '').trim().toLowerCase();
  let recibidos = todosRecibidos;
  if(fProv) recibidos = recibidos.filter(r => r.prov === fProv);
  if(q) recibidos = recibidos.filter(r => (r.prod||'').toLowerCase().includes(q));

  // Resumen del proveedor filtrado
  const summEl = document.getElementById(ids.summary);
  if(summEl){
    if(fProv && recibidos.length){
      const totalProv = recibidos.reduce((s,r)=>s+_compraImporte(r),0);
      const nPedidos = new Set(recibidos.map(r=>r.fecha).filter(Boolean)).size;
      summEl.style.display = '';
      summEl.innerHTML = `<strong>${esc(fProv)}</strong> · ${recibidos.length} ítem${recibidos.length!==1?'s':''} en ${nPedidos} pedido${nPedidos!==1?'s':''} · total <strong>$${totalProv.toLocaleString('es-AR')}</strong>`;
    } else { summEl.style.display = 'none'; summEl.innerHTML = ''; }
  }

  if(!recibidos.length){
    wrap.innerHTML = `<div style="text-align:center;padding:24px;color:var(--mid-gray)">${todosRecibidos.length ? 'Sin resultados para el filtro aplicado.' : 'No hay pedidos recibidos en el historial.'}</div>`;
    return;
  }

  // Agrupar por fecha
  const byDate = {};
  recibidos.forEach(r => {
    const d = r.fecha || 'sin-fecha';
    if(!byDate[d]) byDate[d] = [];
    byDate[d].push(r);
  });
  const fechas = Object.keys(byDate).sort((a,b) => b.localeCompare(a));

  // Si se filtra (proveedor o búsqueda), abrir todo para ver los resultados; si no,
  // lista plegada: cada pedido muestra solo fecha, cantidad y monto, y se despliega
  // el detalle al tocarlo.
  const filtrando = !!fProv || !!q;

  let html = '';
  fechas.forEach(fecha => {
    const items = byDate[fecha];
    const totalBloque = items.reduce((s,r) => s + _compraImporte(r), 0);
    const metaExtra = type==='floreria'
      ? ' · ' + items.reduce((s,r) => s + (+r.totalVaras||+r.qty||0), 0) + ' varas'
      : ' · ' + items.reduce((s,r) => s + _compraCant(r), 0) + ' unidades';
    const key = type+'|'+fecha;
    const abierto = filtrando || _histPedidosAbiertos.has(key);

    html += `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;margin-bottom:10px;overflow:hidden">
      <div style="background:var(--surface-2);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;cursor:pointer"
        onclick="toggleHistPedido('${type}','${fecha}')" title="${abierto?'Ocultar':'Ver'} el detalle de este pedido">
        <div style="display:flex;align-items:center;gap:9px;min-width:0">
          <span id="histcar-${type}-${fecha}" style="color:var(--mid-gray);font-size:12px;width:12px;flex-shrink:0">${abierto?'▾':'▸'}</span>
          <div style="min-width:0">
            <strong style="font-size:14px;color:var(--charcoal)">Pedido del ${fecha!=='sin-fecha' ? fmtDate(fecha) : 'sin fecha'}</strong>
            <span style="color:var(--mid-gray);font-size:12px;margin-left:10px">${items.length} orden${items.length!==1?'es':''}${metaExtra}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-weight:700;color:var(--charcoal);font-size:14px">${totalBloque ? '$'+totalBloque.toLocaleString('es-AR') : ''}</span>
          ${type==='floreria' ? `<button class="btn-secondary" style="font-size:12px;padding:4px 10px" onclick="event.stopPropagation();exportarPedidoXLSX('${fecha}')" title="Descargar este pedido en Excel (mismo formato que el importador)">Exportar Excel</button>` : ''}
          <button class="btn-secondary" style="font-size:12px;padding:4px 10px" onclick="event.stopPropagation();copiarBloquePedido('${type}','${fecha}')" title="Copiar este pedido con fecha de hoy">Copiar pedido</button>
        </div>
      </div>
      ${abierto ? `<div id="histdet-${type}-${fecha}" style="overflow-x:auto;-webkit-overflow-scrolling:touch">${type==='floreria' ? _histTablaFloreria(items) : _histTablaJardineria(items)}</div>` : ''}
    </div>`;
  });

  wrap.innerHTML = html;
}

// Estado de qué pedidos del historial están desplegados (por tipo+fecha).
const _histPedidosAbiertos = new Set();
export function toggleHistPedido(type, fecha){
  const key = type+'|'+fecha;
  if(_histPedidosAbiertos.has(key)) _histPedidosAbiertos.delete(key);
  else _histPedidosAbiertos.add(key);
  renderHistorialCompras(type);
}

// Selector de evento para un renglón del historial. Solo se muestra en los
// renglones cuya área es "Evento" (o que ya tengan un evento asociado), para
// poder linkear esa compra con la rentabilidad del evento.
function _histEventoSelector(type, idx, r){
  if(r.anulado) return '';
  const esEvento = (r.sector||'').toLowerCase().includes('evento') || r.eventoId || (Array.isArray(r.eventos)&&r.eventos.length);
  if(!esEvento) return '';
  return _compraEventosBtn(type, idx, r);
}

// Área editable en el historial (permite corregir pedidos viejos, también
// los ya recibidos o anulados).
function _histAreaCell(type, idx, r){
  return `<select class="form-input" onchange="updHistSector('${type}',${idx},this.value)" style="min-width:130px;font-size:12px">${getAreaUsoOpts(r.sector)}</select>`;
}
async function updHistSector(type, idx, val){
  const r = getArr(type)[idx];
  if(!r) return;
  const tieneEv = !!r.eventoId || (Array.isArray(r.eventos) && r.eventos.length>0);
  const esEvento = (val||'').toLowerCase().includes('evento');
  if(tieneEv && !esEvento){
    if(!await confirmModal('Esta compra tiene evento(s) asignado(s). Si cambiás el área se van a quitar. ¿Continuar?')){
      renderHistorialCompras(type); return;
    }
    r.eventoId = ''; r.evento = ''; delete r.eventos;
  }
  r.sector = val;
  if(type==='floreria'){ window._comprasFloreLastSave = Date.now(); D.fbSave('comprasFlore', D.comprasFlore); }
  else { window._comprasJardLastSave = Date.now(); D.fbSave('comprasJard', D.comprasJard); }
  renderHistorialCompras(type);
  if(document.getElementById('page-rentabilidad-eventos')?.classList.contains('active')) D.renderRentabilidad();
}

// Tabla del historial de Florería (concepto de varas por paquete y costo por vara)
function _histTablaFloreria(items){
  return `<table style="width:100%;min-width:900px;font-size:12px;border-collapse:collapse">
        <thead><tr style="background:var(--surface-1)">
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:12px">Producto</th>
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:12px">Proveedor</th>
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:12px">Área</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:12px">Paq</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:12px">Varas/paq</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:12px">Total varas</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:12px">Control</th>
          <th style="padding:6px 10px;text-align:right;color:var(--mid-gray);font-size:12px">Precio x paq</th>
          <th style="padding:6px 10px;text-align:right;color:var(--mid-gray);font-size:12px">Importe</th>
          <th style="padding:6px 10px;text-align:right;color:var(--mid-gray);font-size:12px">Costo/vara</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:12px"></th>
        </tr></thead>
        <tbody>${items.map(r => { const idx = D.comprasFlore.indexOf(r); const an = !!r.anulado; const rowStyle = an ? 'border-top:1px solid #F0EDE8;opacity:.5' : 'border-top:1px solid #F0EDE8'; const cvDiv = parseFloat(r.varasPorPaq)||parseFloat(r.totalVaras)||parseFloat(r.qty)||0; const cvVal = (parseMoney(r.costo)>0 && cvDiv>0) ? Math.round(parseMoney(r.costo)/cvDiv) : null; return `<tr style="${rowStyle};${D._recepFlagStyle(r)}">
          <td style="padding:6px 10px;font-weight:500;${an?'text-decoration:line-through':''}">${esc(r.prod)}${r.desc?`<div style="font-size:12px;color:var(--mid-gray);font-weight:400">${esc(r.desc)}</div>`:''}${D._recepFlagBadge(r, idx)}</td>
          <td style="padding:6px 10px;color:var(--mid-gray)">${esc(r.prov||'—')}</td>
          <td style="padding:6px 10px;color:var(--mid-gray)">${_histAreaCell('floreria',idx,r)}${_histEventoSelector('floreria',idx,r)}</td>
          <td style="padding:6px 10px;text-align:center"><input class="form-input" type="number" value="${esc(r.paqRecibidos ?? r.qty ?? '')}" onchange="updHistCantCompra('floreria',${idx},'paqRecibidos',this.value)" style="width:55px;text-align:center" ${an?'disabled':''}></td>
          <td style="padding:6px 10px;text-align:center"><input class="form-input" type="number" value="${esc(r.varasPorPaq ?? '')}" onchange="updHistCantCompra('floreria',${idx},'varasPorPaq',this.value)" style="width:55px;text-align:center" ${an?'disabled':''}></td>
          <td style="padding:6px 10px;text-align:center;font-weight:600">${r.totalVaras||r.qty||'—'}</td>
          <td style="padding:6px 10px;text-align:center">${an ? '<span style="font-size:12px;font-weight:700;background:var(--mid-gray);color:#fff;padding:2px 7px;border-radius:5px;white-space:nowrap">Anulado</span>' : controlBadgeCompra(r)}</td>
          <td style="padding:6px 10px;text-align:right"><input class="form-input" value="${esc(r.costo||'')}" placeholder="$" onchange="updHistCostoCompra('floreria',${idx},this.value)" style="width:90px;text-align:right" ${an?'disabled':''}></td>
          <td style="padding:6px 10px;text-align:right;font-weight:600">${parseMoney(r.costo)>0?'$'+_compraImporte(r).toLocaleString('es-AR'):'<span style="color:var(--mid-gray);font-weight:400">—</span>'}</td>
          <td style="padding:6px 10px;text-align:right;font-weight:700;color:var(--sage-dark)">${cvVal!=null?'$'+cvVal.toLocaleString('es-AR')+((parseFloat(r.varasPorPaq)||0)>1?'<div>'+badgeCategoriaVara(cvVal)+'</div>':''):'<span style="color:var(--mid-gray);font-weight:400">—</span>'}</td>
          <td style="padding:6px 10px;text-align:center;white-space:nowrap"><button class="btn-secondary" style="font-size:12px;padding:3px 8px" onclick="toggleAnularCompra('floreria',${idx})">${an?icon('undo')+'Reactivar':'Anular'}</button></td>
        </tr>`; }).join('')}</tbody>
      </table>`;
}

// Tabla del historial de Jardinería / General (productos por unidad, sin varas)
function _histTablaJardineria(items){
  return `<table style="width:100%;min-width:720px;font-size:12px;border-collapse:collapse">
        <thead><tr style="background:var(--surface-1)">
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:12px">Producto</th>
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:12px">Descripción</th>
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:12px">Proveedor</th>
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:12px">Área / Uso</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:12px">Cantidad</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:12px">Control</th>
          <th style="padding:6px 10px;text-align:right;color:var(--mid-gray);font-size:12px">Precio unit.</th>
          <th style="padding:6px 10px;text-align:right;color:var(--mid-gray);font-size:12px">Importe</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:12px"></th>
        </tr></thead>
        <tbody>${items.map(r => { const idx = D.comprasJard.indexOf(r); const an = !!r.anulado; const rowStyle = an ? 'border-top:1px solid #F0EDE8;opacity:.5' : 'border-top:1px solid #F0EDE8'; return `<tr style="${rowStyle}">
          <td style="padding:6px 10px;font-weight:500;${an?'text-decoration:line-through':''}">${esc(r.prod)}</td>
          <td style="padding:6px 10px;color:var(--mid-gray)">${esc(r.desc||'—')}</td>
          <td style="padding:6px 10px;color:var(--mid-gray)">${esc(r.prov||'—')}</td>
          <td style="padding:6px 10px;color:var(--mid-gray)">${_histAreaCell('jardineria',idx,r)}${_histEventoSelector('jardineria',idx,r)}</td>
          <td style="padding:6px 10px;text-align:center"><input class="form-input" type="number" value="${esc(r.paqRecibidos ?? r.qty ?? '')}" onchange="updHistCantCompra('jardineria',${idx},'paqRecibidos',this.value)" style="width:60px;text-align:center" ${an?'disabled':''}></td>
          <td style="padding:6px 10px;text-align:center">${an ? '<span style="font-size:12px;font-weight:700;background:var(--mid-gray);color:#fff;padding:2px 7px;border-radius:5px;white-space:nowrap">Anulado</span>' : controlBadgeCompra(r)}</td>
          <td style="padding:6px 10px;text-align:right"><input class="form-input" value="${esc(r.costo||'')}" placeholder="$" onchange="updHistCostoCompra('jardineria',${idx},this.value)" style="width:90px;text-align:right" ${an?'disabled':''}></td>
          <td style="padding:6px 10px;text-align:right;font-weight:600">${parseMoney(r.costo)>0?'$'+_compraImporte(r).toLocaleString('es-AR'):'<span style="color:var(--mid-gray);font-weight:400">—</span>'}</td>
          <td style="padding:6px 10px;text-align:center;white-space:nowrap"><button class="btn-secondary" style="font-size:12px;padding:3px 8px" onclick="toggleAnularCompra('jardineria',${idx})">${an?icon('undo')+'Reactivar':'Anular'}</button></td>
        </tr>`; }).join('')}</tbody>
      </table>`;
}

// Insignia de control post-recepción: compara lo pedido vs. lo efectivamente recibido.
// La orden queda "recibida" en el stock pero permanece editable acá (no se cierra),
// para que Compras pueda cargar el precio de compra real una vez que llega la factura,
// corregir cantidades, o anularla si fue un error.
function controlBadgeCompra(r){
  const qty = parseFloat(r.qty) || 0;                                            // paquetes pedidos
  const recibido = (r.paqRecibidos != null && r.paqRecibidos !== '') ? (parseFloat(r.paqRecibidos) || 0) : qty; // recibidos
  const fn = n => n%1===0 ? n : (+n).toFixed(1);
  const diff = +(recibido - qty).toFixed(1);
  const base = 'font-size:12px;font-weight:600;padding:3px 8px;border-radius:6px;display:inline-block;line-height:1.4;white-space:nowrap';
  const info = `Pedí ${fn(qty)} · Llegó ${fn(recibido)}`;
  if(diff === 0){
    return `<span style="${base};background:var(--ok-soft);color:var(--green-ok)">${info}</span>`;
  }
  const detalle = diff < 0 ? `faltan ${fn(-diff)}` : `sobran ${fn(diff)}`;
  const colores = diff < 0 ? 'background:#FCEBEA;color:#B0281B' : 'background:#FDF3E3;color:#8A5A16';
  return `<span style="${base};${colores}">${info} · ${detalle}</span>`;
}

// Recalcula el costo por vara en el cotizador a partir del costo y el divisor
// (varas por paquete, o cantidad si no aplica) de una orden ya controlada.
// El costo de la compra es el precio de UN paquete: se divide por las varas por
// paquete de esa compra o, si no las tiene, por las últimas cargadas para el
// producto. Antes, sin ese dato se dividía por la cantidad de paquetes (o por 1)
// y quedaba el precio del paquete entero como costo de una vara.
export function recalcCotizadorPrecio(order){
  const costoTotal = parseMoney(order.costo);
  const divisor = parseFloat(order.varasPorPaq) || getVarasPorPaq(order.prod) || 0;
  if(costoTotal > 0 && divisor > 0){
    D.cotizadorPrecios[claveCostoPara(D.cotizadorPrecios, order.prod)] = Math.round(costoTotal / divisor);
    D.fbSave('cotizadorPrecios', D.cotizadorPrecios);
  }
}

// Permite corregir el precio de compra de una orden ya controlada/recibida
// (por ej. cuando llega la factura con el precio real) sin reabrir el pedido
// ni tocar el stock ya ingresado. Recalcula el costo por vara del cotizador
// para que los costos de arreglos y la Rentabilidad por área queden al día.
export function updHistCostoCompra(type, idx, val){
  const order = getArr(type)[idx];
  if(!order) return;
  order.costo = val;
  if(type==='floreria') recalcCotizadorPrecio(order);
  if(type==='floreria'){ window._comprasFloreLastSave = Date.now(); D.fbSave('comprasFlore', D.comprasFlore); }
  else { window._comprasJardLastSave = Date.now(); D.fbSave('comprasJard', D.comprasJard); }
  showToast('Precio de compra actualizado' + (type==='floreria' ? ' — costos de arreglos recalculados' : ''));
  renderHistorialCompras(type);
}

// Corrige la cantidad recibida (paquetes o varas/paquete) de una orden ya
// controlada, solo a fines de que las métricas de costos sean exactas —
// NO reajusta el stock ya ingresado (se hace manualmente en Gestión de Stock
// si hace falta).
export function updHistCantCompra(type, idx, field, val){
  const order = getArr(type)[idx];
  if(!order) return;
  order[field] = Math.max(0, parseFloat(val) || 0);
  const paqRec = parseFloat(order.paqRecibidos) || 0;
  const varasPaq = parseFloat(order.varasPorPaq) || 0;
  if(paqRec > 0 && varasPaq > 0) order.totalVaras = paqRec * varasPaq;
  if(type==='floreria') recalcCotizadorPrecio(order);
  if(type==='floreria'){ window._comprasFloreLastSave = Date.now(); D.fbSave('comprasFlore', D.comprasFlore); }
  else { window._comprasJardLastSave = Date.now(); D.fbSave('comprasJard', D.comprasJard); }
  renderHistorialCompras(type);
}

// Anula/reactiva una orden ya controlada: queda excluida de los totales de
// costos, márgenes y Rentabilidad por área (para métricas reales), pero el
// stock ya ingresado no se toca automáticamente.
export async function toggleAnularCompra(type, idx){
  const order = getArr(type)[idx];
  if(!order) return;
  if(!order.anulado){
    if(!await confirmModal(`¿Anular el pedido "${order.prod}" del ${fmtDate(order.fecha)}?\n\nSe excluirá de costos y métricas, pero el stock ya ingresado no se modifica.`)) return;
    order.anulado = true;
  } else {
    order.anulado = false;
  }
  if(type==='floreria'){ window._comprasFloreLastSave = Date.now(); D.fbSave('comprasFlore', D.comprasFlore); }
  else { window._comprasJardLastSave = Date.now(); D.fbSave('comprasJard', D.comprasJard); }
  showToast(order.anulado ? 'Pedido anulado — excluido de costos y métricas' : 'Pedido reactivado');
  renderHistorialCompras(type);
}

export async function copiarBloquePedido(type, fecha){
  const arr = getArr(type);
  // Tomar todos los ítems de esa fecha (incluyendo recibidos, para replicar el pedido completo)
  const bloque = arr.filter(r => r.fecha === fecha);
  if(!bloque.length){ showToast('No se encontraron ítems para esa fecha'); return; }
  if(!await confirmModal('¿Copiar el pedido del ' + fmtDate(fecha) + ' (' + bloque.length + ' ítems) con fecha de hoy?\nPodés modificar cantidades después.')) return;
  // Clonar cada ítem con fecha de hoy y estado 'pedido'
  const nuevos = bloque.map(r => ({
    fecha: D.TODAY_ISO,
    pedidopor: r.pedidopor || '—',
    prod: r.prod,
    desc: r.desc || '',
    qty: r.qty,
    costo: r.costo || '',
    prov: r.prov || '',
    sector: r.sector || '',
    estado: 'pedido'
  }));
  // Agregar al inicio del array
  nuevos.forEach(n => arr.unshift(n));
  D.fbSave(type==='floreria' ? 'comprasFlore' : 'comprasJard', arr);
  renderCompras(type);
  showToast('Pedido copiado con ' + nuevos.length + ' ítems · fecha de hoy · ajustá lo que necesites');
}

// Exporta un pedido del historial (Compras Florería) a .xlsx con las mismas
// columnas que lee el importador (cfImportParseSheet), así el archivo se puede
// volver a importar tal cual. Una hoja con el nombre del mes del pedido.
export async function exportarPedidoXLSX(fecha){
  if(window.ensureXLSX) await window.ensureXLSX();
  const X = window.XLSX;
  if(!X){ showToast('Error: librería XLSX no disponible','error'); return; }
  const bloque = (D.comprasFlore||[]).filter(r => (r.fecha||'sin-fecha') === fecha && !r.anulado);
  if(!bloque.length){ showToast('No hay ítems para exportar en ese pedido'); return; }
  const rows = bloque.map(r => ({
    'Fecha': r.fecha || '',
    'Pedido por': r.pedidopor || '',
    'Flor / Follaje': r.prod || '',
    'Descripción': r.desc || '',
    'Cantidad': parseFloat(r.qty) || 0,
    'Precio por paquete': parseMoney(r.costo) || '',
    'Proveedor': r.prov || '',
    'Área/uso': r.sector || ''
  }));
  const ws = X.utils.json_to_sheet(rows);
  ws['!cols'] = [{wch:12},{wch:16},{wch:28},{wch:26},{wch:10},{wch:18},{wch:22},{wch:20}];
  const wb = X.utils.book_new();
  const hoja = fecha!=='sin-fecha' ? D.getMonthLabel(fecha) : 'Pedido';
  X.utils.book_append_sheet(wb, ws, hoja);
  D._xlsxDownload(wb, `pedido-${fecha}.xlsx`);
  showToast('Exportado: pedido-'+fecha+'.xlsx ('+rows.length+' ítems)');
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPRA POR EVENTO — cuánto comprar según composiciones + varas por paquete
// Toma las composiciones (varas de cada flor por arreglo) y las varas por paquete
// registradas en Compras para convertir las varas necesarias en paquetes a comprar.
// ══════════════════════════════════════════════════════════════════════════════
let ceRows = [];

// Varas por paquete de un producto: se toma el valor más reciente cargado en
// Compras Florería (varasPorPaq). Devuelve null si no hay dato.
export function getVarasPorPaq(prod){
  let best = null, bestFecha = '';
  (D.comprasFlore||[]).forEach(c=>{
    if(!mismoArticulo(c.prod, prod)) return;
    const vpp = parseFloat(c.varasPorPaq);
    if(!vpp || vpp<=0) return;
    const f = c.fecha||'';
    if(best===null || f >= bestFecha){ best = vpp; bestFecha = f; }
  });
  return best;
}

// Último precio de compra (por paquete) de un producto, del pedido más reciente
// cargado en Compras Florería. Devuelve {precio, fecha} o null si no hay dato.
export function getUltimoPrecioCompra(prod){
  let best = null, bestFecha = '';
  (D.comprasFlore||[]).forEach(c=>{
    if(!mismoArticulo(c.prod, prod)) return;
    const m = parseMoney(c.costo);
    if(!m || m<=0) return;
    const f = c.fecha||'';
    if(best===null || f >= bestFecha){ best = m; bestFecha = f; }
  });
  return best===null ? null : { precio: best, fecha: bestFecha };
}

// Cartel al costado del precio al cargar una compra de Florería: dice si la
// vara entra hoy como de estación, importada o premium (según los límites de
// gerencia) y avisa si cambió respecto de la compra anterior. El costo por vara
// sale del precio por paquete ÷ las últimas varas por paquete conocidas.
export function cfCategoriaVaraPreview(){
  const out = document.getElementById('cf-cat-vara');
  if(!out) return;
  const prod = (document.getElementById('cf-producto')?.value||'').trim();
  const precio = parseMoney(document.getElementById('cf-costo')?.value);
  if(!prod || !(precio>0)){ out.innerHTML = ''; return; }
  const vpp = getVarasPorPaq(prod) || 0;
  if(!(vpp>1)){
    out.innerHTML = `<div class="cat-vara-cartel">Todavía no sé cuántas varas trae el paquete de ${esc(prod)}, así que no puedo decir si entra como estación, importada o premium. Se calcula al recibir el pedido.</div>`;
    return;
  }
  const previo = historialCostoVara(prod, D.comprasFlore)[0]?.costoVara || 0;
  out.innerHTML = cartelCategoriaVara(precio/vpp, previo, { nota:`Calculado con ${vpp} varas por paquete (última compra).` });
}
window.cfCategoriaVaraPreview = cfCategoriaVaraPreview;

// ════════════════════════════════════════════════════════════════════════
//  PEDIDO AUTOMÁTICO (Compras Florería)
//  Arma el pedido semanal de un tirón, para darle después los toques finales:
//   1) BASE FIJA del hotel = las composiciones por área (arreglosComposicion),
//      con etiqueta de día por área (Miércoles / Viernes / Ambos) para que el
//      pedido del miércoles y el del viernes puedan ser distintos.
//   2) FLORES DE EVENTOS pendientes = calculadas de los arreglos de cada evento.
//  Nunca escribe directo: muestra una vista previa donde se tilda qué incluir y
//  recién al confirmar carga las filas en Compras como "pedido".
// ════════════════════════════════════════════════════════════════════════
let comprasBaseDia = {};   // { area: 'mie' | 'vie' | 'ambos' } — en qué pedido entra cada área
window._setComprasBaseDia = v => { comprasBaseDia = (v && typeof v==='object' && !Array.isArray(v)) ? v : {}; };

let _paDia = 'mie';        // día elegido en el modal
let _paBaseSel = {};       // { area: bool } áreas tildadas
let _paEvSel = {};         // { evIdx: bool } eventos tildados

// Todas las áreas/zonas que YA tienen composición cargada — sea una zona del
// checklist o un nombre propio (mismo criterio que la sección Composiciones).
function _paAreasBase(){
  return Object.keys(D.arreglosComposicion||{})
    .filter(z => (D.arreglosComposicion[z]||[]).length)
    .sort((a,b)=>a.localeCompare(b,'es'));
}
function _paAreaDia(area){ return comprasBaseDia[area] || 'ambos'; }
function _paEventosPend(){
  return (D.eventosData||[]).map((ev,i)=>({ev,i}))
    .filter(o => o.ev.arreglos?.length && o.ev.estado !== 'Pedidos Finalizados')
    .sort((a,b)=>(a.ev.fecha||'').localeCompare(b.ev.fecha||''));
}
function _paResetBaseSel(){
  _paBaseSel = {};
  _paAreasBase().forEach(a => { const d = _paAreaDia(a); _paBaseSel[a] = (d==='ambos' || d===_paDia); });
}

// Construye las filas de compra que se van a generar (base + eventos).
function _paBuildRows(){
  const rows = [];
  const suc = D.getSucursalId();
  // Base fija por área (composiciones)
  _paAreasBase().forEach(area => {
    if(!_paBaseSel[area]) return;
    (D.arreglosComposicion[area]||[]).forEach(ing => {
      if(!ing.prod) return;
      let qty;
      if(ing.unidad==='paq'){ qty = +ing.qty||0; }
      else { const vpp = getVarasPorPaq(ing.prod); qty = vpp ? Math.ceil((+ing.qty||0)/vpp) : (+ing.qty||0); }
      if(qty<=0) qty = 1;
      const up = getUltimoPrecioCompra(ing.prod);
      rows.push({ fecha:D.TODAY_ISO, pedidopor:'—', prod:ing.prod, desc:'', qty, costo: up?String(up.precio):'', prov:'', sector:area, estado:'pedido', sucursal:suc });
    });
  });
  // Flores de eventos pendientes
  _paEventosPend().forEach(({ev,i}) => {
    if(!_paEvSel[i]) return;
    const impact = D.calcStockImpact(ev.arreglos||[]);
    Object.entries(impact).forEach(([prod,varas]) => {
      const vpp = getVarasPorPaq(prod);
      let qty = vpp ? Math.ceil(varas/vpp) : Math.ceil(varas);
      if(qty<=0) qty = 1;
      const up = getUltimoPrecioCompra(prod);
      rows.push({ fecha:D.TODAY_ISO, pedidopor:'—', prod, desc:'', qty, costo: up?String(up.precio):'', prov:'', sector:'', eventoId: ev.id||'', evento: ev.nombre||'', estado:'pedido', sucursal:suc });
    });
  });
  return rows;
}

export function abrirPedidoAuto(){
  _paDia = (new Date().getDay() >= 4) ? 'vie' : 'mie';  // Jue/Vie/Sáb/Dom → viernes; resto → miércoles
  _paResetBaseSel();
  _paEvSel = {}; _paEventosPend().forEach(({i}) => { _paEvSel[i] = true; });
  renderPedidoAuto();
  document.getElementById('pedido-auto-modal').classList.add('open');
}

export function paSetDia(dia){ _paDia = dia; _paResetBaseSel(); renderPedidoAuto(); }
export function paToggleArea(ai){ const a = _paAreasBase()[ai]; if(a){ _paBaseSel[a] = !_paBaseSel[a]; renderPedidoAuto(); } }
export function paSetAreaDia(ai, dia){
  const a = _paAreasBase()[ai]; if(!a) return;
  comprasBaseDia[a] = dia; D.fbSave('comprasBaseDia', comprasBaseDia);
  _paBaseSel[a] = (dia==='ambos' || dia===_paDia);
  renderPedidoAuto();
}
export function paToggleEvento(i){ _paEvSel[i] = !_paEvSel[i]; renderPedidoAuto(); }

function renderPedidoAuto(){
  const body = document.getElementById('pa-body'); if(!body) return;
  const areas = _paAreasBase();
  const eventos = _paEventosPend();
  const diaBtn = (d,lbl)=>`<button type="button" onclick="paSetDia('${d}')" class="${_paDia===d?'btn-add':'btn-secondary'}" style="font-size:12px;padding:6px 16px">${lbl}</button>`;

  let baseHTML;
  if(!areas.length){
    baseHTML = `<div style="font-size:12.5px;color:var(--mid-gray);padding:10px;background:var(--surface-1);border-radius:8px">No hay composiciones por área cargadas todavía. Cargá las flores de cada área en <strong>Composiciones</strong> y van a aparecer acá como base del pedido.</div>`;
  } else {
    baseHTML = areas.map((area,ai)=>{
      const ings = (D.arreglosComposicion[area]||[]);
      const resumen = ings.map(g=>`${g.qty} ${esc(g.prod)}`).join(', ');
      const dia = _paAreaDia(area);
      const sel = !!_paBaseSel[area];
      return `<div style="display:flex;gap:10px;align-items:flex-start;padding:8px 4px;border-top:1px solid var(--surface-2)">
        <input type="checkbox" ${sel?'checked':''} onchange="paToggleArea(${ai})" style="margin-top:3px;width:16px;height:16px;flex:0 0 auto">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:13px">${esc(area)} <span style="font-weight:400;color:var(--mid-gray)">· ${ings.length} flor${ings.length!==1?'es':''}</span></div>
          <div style="font-size:12px;color:var(--mid-gray);margin-top:2px">${resumen}</div>
        </div>
        <select onchange="paSetAreaDia(${ai},this.value)" style="font-size:12px;border:1px solid var(--light-gray);border-radius:6px;padding:4px 6px;flex:0 0 auto" title="En qué pedido entra esta área">
          <option value="ambos" ${dia==='ambos'?'selected':''}>Mié y Vie</option>
          <option value="mie" ${dia==='mie'?'selected':''}>Solo Mié</option>
          <option value="vie" ${dia==='vie'?'selected':''}>Solo Vie</option>
        </select>
      </div>`;
    }).join('');
  }

  let evHTML;
  if(!eventos.length){
    evHTML = `<div style="font-size:12.5px;color:var(--mid-gray);padding:10px;background:var(--surface-1);border-radius:8px">No hay eventos pendientes con arreglos cargados.</div>`;
  } else {
    evHTML = eventos.map(({ev,i})=>{
      const impact = D.calcStockImpact(ev.arreglos||[]);
      const resumen = Object.entries(impact).map(([p,v])=>`${Math.ceil(v)} ${esc(p)}`).join(', ') || 'sin flores';
      const sel = !!_paEvSel[i];
      return `<div style="display:flex;gap:10px;align-items:flex-start;padding:8px 4px;border-top:1px solid var(--surface-2)">
        <input type="checkbox" ${sel?'checked':''} onchange="paToggleEvento(${i})" style="margin-top:3px;width:16px;height:16px;flex:0 0 auto">
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:13px">${esc(ev.nombre||'(evento)')} <span style="font-weight:400;color:var(--mid-gray)">${ev.fecha?'· '+fmtDate(ev.fecha):''}</span></div>
          <div style="font-size:12px;color:var(--mid-gray);margin-top:2px">${resumen}</div>
        </div>
      </div>`;
    }).join('');
  }

  const rows = _paBuildRows();
  body.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:14px">
      <span style="font-size:12px;color:var(--mid-gray)">Pedido de:</span>
      ${diaBtn('mie','Miércoles')} ${diaBtn('vie','Viernes')}
    </div>
    <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:600;margin-bottom:2px">Base fija del hotel</div>
    <div style="max-height:34vh;overflow:auto;margin-bottom:14px">${baseHTML}</div>
    <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:600;margin-bottom:2px">Flores de eventos pendientes</div>
    <div style="max-height:24vh;overflow:auto;margin-bottom:14px">${evHTML}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid var(--light-gray);padding-top:12px">
      <div style="font-size:12.5px;color:var(--mid-gray)">Se van a cargar <strong style="color:var(--charcoal)">${rows.length}</strong> ítem${rows.length!==1?'s':''} como "pedido", con el último precio conocido de cada flor.</div>
      <div style="display:flex;gap:8px">
        <button class="btn-secondary" onclick="closeModal('pedido-auto-modal')">Cancelar</button>
        <button class="btn-add" ${rows.length?'':'disabled'} onclick="generarPedidoAuto()">Generar pedido</button>
      </div>
    </div>`;
}

export function generarPedidoAuto(){
  // Guardia anti-borrado: no generar (ni guardar) antes de que las compras
  // hayan cargado desde la nube — si comprasFlore aún está vacío en memoria,
  // guardar acá sobrescribiría el historial. (Fue la causa de la pérdida.)
  if(!window._comprasFloreLoaded){ showToast('Las compras todavía se están cargando — esperá unos segundos e intentá de nuevo.','error'); return; }
  const rows = _paBuildRows();
  if(!rows.length){ showToast('No hay nada para generar. Cargá composiciones por área o tildá algún ítem.','error'); return; }
  // unshift en bloque (reverse para conservar el orden original arriba de la lista)
  rows.slice().reverse().forEach(r => D.comprasFlore.unshift(r));
  window._comprasFloreLastSave = Date.now();
  D.fbSave('comprasFlore', D.comprasFlore);
  D.closeModal('pedido-auto-modal');
  renderCompras('floreria');
  if(document.getElementById('page-stock')?.classList.contains('active')) D.renderStock();
  updateKpiCompras();
  showToast(`Pedido generado: ${rows.length} ítem${rows.length!==1?'s':''} cargados como "pedido" — ajustá precios y proveedor.`);
}

export function renderCompraEvento(){
  // Poblar selector de eventos pendientes que tengan arreglos cargados
  // (los finalizados no se listan: ya no se compra para ellos)
  const sel = document.getElementById('ce-evento');
  if(sel){
    const cur = sel.value;
    const evs = (D.eventosData||[]).map((ev,i)=>({ev,i}))
      .filter(o=>o.ev.arreglos?.length && o.ev.estado !== 'Pedidos Finalizados')
      .sort((a,b)=>(b.ev.fecha||'').localeCompare(a.ev.fecha||''));
    sel.innerHTML = '<option value="">— Elegí un evento (opcional) —</option>' +
      evs.map(({ev,i})=>`<option value="${i}">${esc(ev.nombre||'(evento)')}${ev.fecha?' · '+fmtDate(ev.fecha):''}</option>`).join('');
    sel.value = cur;
  }
  if(!ceRows.length) ceRows = [{arreglo:'', qty:1}];
  ceRenderRows();
  ceRender();
}

function ceRenderRows(){
  const cont = document.getElementById('ce-rows');
  if(!cont) return;
  if(!ceRows.length) ceRows = [{arreglo:'', qty:1}];
  const nombres = [...new Set((D.recetasData||[]).map(r=>r.nombre))];
  cont.innerHTML = ceRows.map((row,i)=>{
    const opts = nombres.map(n=>`<option value="${esc(n)}"${n===row.arreglo?' selected':''}>${D.arregloEmoji(n)} ${esc(n)}</option>`).join('');
    return `<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
      <select onchange="ceSet(${i},'arreglo',this.value)" style="flex:2;min-width:180px;border:1px solid var(--light-gray);border-radius:6px;padding:7px 9px;font-family:'DM Sans',sans-serif;font-size:13px;outline:none">
        <option value="">— Tipo de arreglo —</option>${opts}
      </select>
      <span style="font-size:12px;color:var(--mid-gray)">×</span>
      <input type="number" min="1" value="${esc(row.qty)}" onchange="ceSet(${i},'qty',this.value)" style="width:70px;border:1px solid var(--light-gray);border-radius:6px;padding:7px 6px;font-size:13px;text-align:center;outline:none;font-family:'DM Sans',sans-serif">
      <button type="button" class="btn-icon" style="color:var(--red-alert)" onclick="ceRemoveRow(${i})" title="Quitar">✕</button>
    </div>`;
  }).join('');
}

export function ceSet(i, field, val){
  if(!ceRows[i]) return;
  ceRows[i][field] = field==='qty' ? (+val||0) : val;
  ceRender();
}
export function ceAddRow(){ ceRows.push({arreglo:'', qty:1}); ceRenderRows(); ceRender(); }
export function ceRemoveRow(i){ ceRows.splice(i,1); if(!ceRows.length) ceRows=[{arreglo:'',qty:1}]; ceRenderRows(); ceRender(); }
export function ceReset(){ ceRows=[{arreglo:'',qty:1}]; const s=document.getElementById('ce-evento'); if(s) s.value=''; ceRenderRows(); ceRender(); }
export function ceLoadEvento(evIdx){
  if(evIdx===''||evIdx==null){ return; }
  const ev = (D.eventosData||[])[+evIdx];
  if(!ev){ return; }
  const arr = (ev.arreglos||[]).filter(a=>a.arreglo && a.qty>0);
  if(!arr.length){ showToast('Ese evento no tiene arreglos cargados'); return; }
  ceRows = arr.map(a=>({arreglo:a.arreglo, qty:+a.qty||1}));
  ceRenderRows();
  ceRender();
}

function ceRender(){
  const out = document.getElementById('ce-resultado');
  if(!out) return;
  const rows = ceRows.filter(r=>r.arreglo && r.qty>0);
  const impact = D.calcStockImpact(rows); // { prod: varas necesarias }
  const prods = Object.keys(impact).sort((a,b)=>a.localeCompare(b,'es'));
  if(!prods.length){
    out.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--mid-gray)">
      <div style="font-size:36px;margin-bottom:8px"></div>
      <div style="font-size:14px">Agregá arreglos y cantidades para ver cuánto comprar.</div></div>`;
    return;
  }

  const filas = prods.map(prod=>{
    const varas = +impact[prod].toFixed(2);
    const vpp = getVarasPorPaq(prod);
    const paquetes = vpp ? Math.ceil(varas / vpp) : null;
    const vppStr = vpp!=null ? vpp : '<span style="color:var(--red-alert)">sin dato</span>';
    const paqStr = paquetes!=null
      ? `<strong style="font-size:15px">${paquetes}</strong>`
      : '<span style="color:var(--red-alert)" title="Cargá las varas por paquete en Compras Florería">—</span>';
    return `<tr style="border-top:1px solid var(--surface-2)">
      <td style="padding:8px 12px;font-weight:500">${esc(prod)}</td>
      <td style="padding:8px 12px;text-align:center">${varas%1===0?varas:varas.toFixed(1)}</td>
      <td style="padding:8px 12px;text-align:center;color:var(--mid-gray)">${vppStr}</td>
      <td style="padding:8px 12px;text-align:center">${paqStr}</td>
    </tr>`;
  }).join('');

  // Resumen "Comprar" (solo los que tienen paquetes calculables)
  const compra = prods.map(prod=>{
    const vpp = getVarasPorPaq(prod);
    if(!vpp) return null;
    const paquetes = Math.ceil((+impact[prod]) / vpp);
    return { prod, paquetes };
  }).filter(Boolean);
  const faltantes = prods.filter(prod=>!getVarasPorPaq(prod));

  const compraStr = compra.map(c=>`${c.paquetes} ${esc(c.prod)}`).join(' · ');

  out.innerHTML = `
    <div style="background:var(--ok-soft);border:1px solid #C6E0BE;border-radius:12px;padding:16px 18px;margin-bottom:16px">
      <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--green-ok);font-weight:600;margin-bottom:8px">Comprar</div>
      ${compra.length
        ? `<div style="font-size:16px;color:var(--charcoal);line-height:1.7">${compra.map(c=>`<strong>${c.paquetes}</strong> ${esc(c.prod)}`).join(' &nbsp;·&nbsp; ')}</div>`
        : '<div style="font-size:13px;color:var(--mid-gray)">Ningún producto tiene varas por paquete cargadas en Compras todavía.</div>'}
      ${faltantes.length ? `<div style="font-size:12px;color:var(--red-alert);margin-top:8px">Sin varas por paquete (cargalas en Compras Florería): ${faltantes.map(esc).join(', ')}</div>` : ''}
      ${compra.length ? `<button class="btn-secondary" style="font-size:12px;margin-top:12px" onclick="ceCopiar()">Copiar lista</button>` : ''}
    </div>
    <div class="table-wrapper">
      <table style="width:100%;border-collapse:collapse;font-size:13px;background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;overflow:hidden">
        <thead><tr style="background:var(--surface-1)">
          <th style="padding:9px 12px;text-align:left;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Producto</th>
          <th style="padding:9px 12px;text-align:center;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Varas necesarias</th>
          <th style="padding:9px 12px;text-align:center;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Varas x paquete</th>
          <th style="padding:9px 12px;text-align:center;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Paquetes a comprar</th>
        </tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>
    <div style="font-size:12px;color:var(--mid-gray);margin-top:10px">Las varas necesarias salen de las composiciones (Comercial › Composiciones). Las varas por paquete se toman del último valor cargado en Compras Florería.</div>`;
  window._ceCompra = compra;
}

export function ceCopiar(){
  const compra = window._ceCompra || [];
  if(!compra.length){ showToast('Nada para copiar'); return; }
  const txt = 'Comprar:\n' + compra.map(c=>`- ${c.paquetes} ${c.prod}`).join('\n');
  (navigator.clipboard?.writeText(txt) || Promise.reject()).then(
    ()=>showToast('Lista copiada'),
    ()=>showToast('No se pudo copiar')
  );
}

export function toggleProvManager(){
  const b = document.getElementById('prov-manager-body');
  if(b) b.style.display = b.style.display==='none' ? 'block' : 'none';
  renderProvTags();
}

export function renderProvTags(){
  const el = document.getElementById('prov-tags');
  if(!el) return;
  el.innerHTML = D.proveedoresList.map((p,i)=>`
    <span style="display:inline-flex;align-items:center;gap:6px;background:var(--cream);border:1px solid var(--light-gray);border-radius:4px;padding:4px 10px;font-size:12px">
      ${p}
      <span style="cursor:pointer;color:var(--red-alert);font-size:14px;line-height:1" onclick="delProveedor(${i})">×</span>
    </span>`).join('');
}

export function addProveedor(){
  const inp = document.getElementById('prov-new-input');
  const val = inp.value.trim();
  if(!val || D.proveedoresList.includes(val)) return;
  D.proveedoresList.push(val);
  D.proveedoresList.sort((a,b)=>a.localeCompare(b));
  inp.value = '';
  D.fbSave('proveedoresList', D.proveedoresList);
  renderProvTags();
  populateProvSelects();
  showToast('Proveedor agregado: ' + val);
}

export async function delProveedor(i){
  if(!await confirmModal('¿Eliminar proveedor "'+D.proveedoresList[i]+'"?')) return;
  D.proveedoresList.splice(i,1);
  D.fbSave('proveedoresList', D.proveedoresList);
  renderProvTags();
  populateProvSelects();
}

export function populateProvSelects(){
  ['cf-proveedor','cj-proveedor'].forEach(id=>{
    const sel = document.getElementById(id);
    if(!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">— Seleccionar —</option>' + D.getProvOpts(cur);
  });
}

export function updC(type,i,field,val){
  const order = getArr(type)[i];
  const prevEstado = order.estado;
  if(field==='prod') val = nombreArticulo(val);
  order[field] = val;

  // AUTO-RECIBIR (florería): si el renglón ya está CONTROLADO (los floristas lo
  // recepcionaron) y se le carga el PRECIO, se sube al stock solo y queda
  // "recibido" — evita el paso manual de "subir al stock".
  if(type==='floreria' && field==='costo' && order.estado==='controlado' && parseMoney(val)>0){
    D._subirCompraAlStock(i); // setea estado='recibido', suma varas al stock y calcula costo/vara
    window._comprasFloreLastSave = Date.now();
    D.fbSave('comprasFlore', D.comprasFlore);
    D.fbSave('stockData', D.stockData);
    D.fbSave('cotizadorPrecios', D.cotizadorPrecios);
    showToast('✓ ' + (order.prod||'') + ' recibido y subido al stock');
    renderCompras('floreria');
    if(document.getElementById('page-stock')?.classList.contains('active')) D.renderStock();
    if(document.getElementById('page-recepcion-pedidos')?.classList.contains('active')) D.renderRecepcionPedidos();
    return;
  }

  // AUTO-STOCK: al marcar como "recibido" por primera vez → actualizar stock
  if(field==='estado' && val==='recibido' && prevEstado!=='recibido'){
    const qty = parseFloat(order.qty)||0;
    if(qty>0 && order.prod){
      // Suma al renglón del color pedido (o al del producto sin color)
      const nuevo = D._stockIngresar(order.prod, order.desc, order.sector, qty);
      showToast(nuevo ? 'Nuevo producto agregado al stock: ' + D._stockNombre(D.stockData[D.stockData.length-1])
                      : 'Stock actualizado: +' + qty + ' ' + order.prod);

      // Banner en página de stock si está visible
      const alertEl = document.getElementById('stock-alert-area');
      if(alertEl){
        alertEl.innerHTML = `<div class="alert-banner green"><strong>${esc(order.prod)}</strong> recibido — se ${!nuevo?'agregaron <strong>'+qty+'</strong> unidades al stock existente':'creó un nuevo ítem en stock con <strong>'+qty+'</strong> unidades'}.</div>`;
        setTimeout(()=>{ if(alertEl && alertEl.children[0]) alertEl.removeChild(alertEl.children[0]); D.renderStock(); }, 5000);
      }

      // Re-render stock si está abierto
      if(document.getElementById('page-stock').classList.contains('active')) D.renderStock();
      if(document.getElementById('page-compras-floreria').classList.contains('active')) renderCompras('floreria');
    }
  }
  window._comprasFloreLastSave = Date.now(); D.fbSave('comprasFlore', D.comprasFlore);
  window._comprasJardLastSave = Date.now(); D.fbSave('comprasJard', D.comprasJard);
  // Re-render para actualizar subtotales de bloque y KPIs
  renderCompras(type);
}

export async function delC(type,i){
  if(!await confirmModal('¿Eliminar esta orden?')) return;
  getArr(type).splice(i,1);
  // Persistir la eliminación (antes no se guardaba: la orden reaparecía al refrescar)
  if(type==='floreria'){ window._comprasFloreLastSave = Date.now(); D.fbSave('comprasFlore', D.comprasFlore); }
  else { window._comprasJardLastSave = Date.now(); D.fbSave('comprasJard', D.comprasJard); }
  renderCompras(type);
  updateKpiCompras();
}
export function updateKpiCompras(){
  const pend=[...D.comprasFlore,...D.comprasJard].filter(c=>c.estado!=='recibido').length;
  const el=document.getElementById('kpi-compras-pend');
  if(el) el.textContent=pend;
}