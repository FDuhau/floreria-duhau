// ── VENTAS ─────────────────────────────────────────────────────────────────
// Ventas externas: listado, filtros, edición inline y por modal, cierre del
// mes, comprobante de pedido y registro de ventas en efectivo en la caja.
// Separado de app.js. Lo que necesita de app.js llega por configurarVentas():
//   CL_RESP_OPTS, CURR_MONTH, ESTADO_COLORS, TODAY_ISO, arregloEmoji, calcCostoComposicion, closeModal, cotizadorConfig, ensureKanbanCols, fbSave, fmtMonth, genEventoId, getFloristasActivos, getSucursalId, kanbanData, notificarAsignacion, notificarVentaNueva, recetasData, renderKanban, sensibleCargado

import { margenDeVenta } from './dinero.js';
import { esc, fmtDate, parseMoney } from './utils.js';
import { fotoRamoBtn } from './fotos-ramo.js';
import { showToast } from './tema-toast.js';
import { cajaData, renderCaja } from './caja.js';
import { abrirDocumento, fmtPesos, kv } from './documento-marca.js';
import { DIA_MADRE_ARREGLOS } from './datos-base.js';
import { listaPreciosData } from './lista-precios.js';
import { confirmModal, promptModal } from './modales.js';
import { marcarObligatorios, validarCampos } from './validacion.js';
import { COBRO_LABEL, agruparPorDia, enPeriodo, linkWhatsApp, mensajeWhatsApp, montoVenta, resumenVentas, saldoVenta } from './ventas-base.js';
import { getClientesData } from './crm-clientes.js';

let D = {};
export function configurarVentas(deps){
  D = deps;
  VENTA_ESTADO_COLOR={'pendiente':D.ESTADO_COLORS['Pedidos Pendientes'],'confirmado':D.ESTADO_COLORS['Confirmado'],'entregado':D.ESTADO_COLORS['Pedidos Finalizados']};
}

// ════════════════════════════════════════
// DATA — VENTAS (fully editable inline + new columns)
// ════════════════════════════════════════
export let ventasData=[];

window._setVentasData = (arr) => { ventasData.splice(0, ventasData.length, ...arr); };

const VENTA_ESTADOS=['pendiente','confirmado','entregado'];
export const VENTA_ESTADO_LABEL={'pendiente':'Pendiente','confirmado':'Confirmado','entregado':'Entregado'};
// Se arma en configurarVentas (necesita ESTADO_COLORS de app.js)
let VENTA_ESTADO_COLOR={};

// Formas de pago canónicas (para el filtro y el cierre de mes)
const VENTA_PAGO_OPTS=[
  {value:'Efectivo',label:'Efectivo'},
  {value:'Tarjeta',label:'Tarjeta'},
  {value:'Transferencia',label:'Transferencia'},
  {value:'Link de pago',label:'Link de pago'},
  {value:'Mercado Pago',label:'Mercado Pago'},
  {value:'Cargo a rooms',label:'Cargo a rooms (hotel)'},
  {value:'Cargo a habitación',label:'Cargo a habitación (huésped)'},
  {value:'Cuenta corriente',label:'Cuenta corriente'},
  {value:'Cargo cliente / outlet F&B',label:'Cargo cliente / outlet F&B'},
];
// Normaliza formas de pago viejas (Débito/Crédito → Tarjeta) para filtrar bien.
export function normPago(fp){ return (fp==='Débito'||fp==='Crédito') ? 'Tarjeta' : (fp||''); }

// Costo estimado de una venta: si el producto coincide con una composición
// cargada (recetasData), usa su costo calculado. Devuelve null si no se puede
// estimar (producto suelto sin composición), para no mostrar un margen falso.
export function costoVenta(v){
  const nombre = (v?.prod||'').trim().toLowerCase();
  if(!nombre) return null;
  const r = (D.recetasData||[]).find(x=>(x.nombre||'').trim().toLowerCase()===nombre);
  if(!r) return null;
  const c = D.calcCostoComposicion(r);
  return (c!=null && isFinite(c) && c>0) ? c : null;
}
// Margen estimado de una venta (precio − costo composición − costo de envío).
// null si no hay costo estimable.
function margenVenta(v){
  const c = costoVenta(v);
  if(c==null) return null;
  return margenDeVenta(v, c);
}
// Grupo de cobranza para el cierre de mes: Cargo a rooms + Cargo a habitación = Hotel.
function grupoCobranza(fp){
  const p = normPago(fp);
  if(p==='Cargo a rooms'||p==='Cargo a habitación') return 'Hotel';
  return p || 'Sin forma de pago';
}
// Filtros activos de Ventas Externas (persistidos entre sesiones)
let ventasFilter={mes:'',pago:'',tipo:'',fact:'',txt:'',periodo:'',estado:'',cobro:'',resp:''};
const _VENTAS_PREFS_KEY='fd-ventas-prefs';
let _ventasNeedRestore=true;
function _saveVentasPrefs(){ try{ localStorage.setItem(_VENTAS_PREFS_KEY, JSON.stringify(ventasFilter)); }catch(e){} }
function _loadVentasPrefs(){ try{ return JSON.parse(localStorage.getItem(_VENTAS_PREFS_KEY)||'{}'); }catch(e){ return {}; } }
// Paginación incremental ("Mostrar más") de la tabla de ventas
const VENTAS_PAGE=50;
let ventasShown=VENTAS_PAGE, _ventasLastKey='';
export function ventasShowMore(){ ventasShown+=VENTAS_PAGE; renderVentas(); }
function _ventasMoreRow(total){
  if(total<=ventasShown) return '';
  const faltan=total-ventasShown;
  const mostrar=Math.min(VENTAS_PAGE,faltan);
  return `<tr><td colspan="30" style="text-align:center;padding:14px">
    <button class="btn-secondary" onclick="ventasShowMore()">Mostrar ${mostrar} más · quedan ${faltan} de ${total}</button>
  </td></tr>`;
}

// ── Pantalla: resumen arriba, filtros y una tarjeta por día con sus ventas ───
const _IC_BUSCAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>';
const _IC_WA = '<svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M20 11.5a8 8 0 01-11.8 7L4 20l1.5-4.1A8 8 0 1120 11.5z"/><path d="M9.2 8.8c.3 2.6 2.4 4.7 5 5l1-1.2-1.7-1-.8.6c-.7-.3-1.4-1-1.7-1.7l.6-.8-1-1.7z" fill="currentColor" stroke="none"/></svg>';
const _IC_EDIT = '<svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg>';
const _pesos = n => '$' + Math.round(n || 0).toLocaleString('es-AR');
const _norm = x => String(x||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');

export function veSetPeriodo(p){
  const el = document.getElementById('ve-periodo');
  if(el) el.dataset.valor = p || '';
  renderVentas();
}

function _fechaGrupo(f){
  if(!f) return 'Sin fecha';
  if(f === D.TODAY_ISO) return 'Hoy · ' + fmtDate(f);
  const ayer = new Date(D.TODAY_ISO+'T12:00:00'); ayer.setDate(ayer.getDate()-1);
  if(f === ayer.toISOString().slice(0,10)) return 'Ayer · ' + fmtDate(f);
  const t = new Date(f+'T12:00:00').toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'});
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function _pillEstado(i, v){
  const est = v.estado || 'pendiente';
  return `<select class="vx-pill vx-st-${est}" onchange="updV(${i},'estado',this.value)" title="Estado del pedido" aria-label="Estado">
    ${VENTA_ESTADOS.map(s=>`<option value="${s}"${est===s?' selected':''}>${VENTA_ESTADO_LABEL[s]}</option>`).join('')}</select>`;
}
function _pillCobro(i, v){
  const c = v.cobro || '';
  const saldo = saldoVenta(v);
  return `<select class="vx-pill vx-co-${c||'sin'}" onchange="veSetCobro(${i},this.value)" title="${c==='sena'?'Seña de '+_pesos(parseMoney(v.sena))+' · falta '+_pesos(saldo):'Estado de cobro'}" aria-label="Cobro">
    <option value=""${!c?' selected':''}>Cobro: —</option>
    <option value="pagado"${c==='pagado'?' selected':''}>${COBRO_LABEL.pagado}</option>
    <option value="sena"${c==='sena'?' selected':''}>${COBRO_LABEL.sena}</option>
    <option value="pendiente"${c==='pendiente'?' selected':''}>${COBRO_LABEL.pendiente}</option></select>`;
}

function _filaVenta(i, v){
  const precio = montoVenta(v);
  const m = margenVenta(v);
  const saldo = saldoVenta(v);
  const quien = v.cliente || v.destinatario || 'Sin cliente';
  const para = v.destinatario && v.cliente ? ` · para ${esc(v.destinatario)}` : '';
  const metaPartes = [esc(v.prod||''), v.desc ? esc(v.desc) : '', v.dir ? esc(v.dir) : ''].filter(Boolean);
  const tags = [
    v.facturado==='Sí' ? '<span class="ve-tag ok">Facturada</span>' : (precio>0 ? '<span class="ve-tag warn">Sin facturar</span>' : ''),
    v.formaPago ? `<span class="ve-tag">${esc(v.formaPago)}</span>` : '',
    v.asignado ? `<span class="ve-tag">${esc(v.asignado)}</span>` : '',
  ].join('');
  return `<div class="vx-row${v.estado==='entregado'?' is-done':''}" role="button" tabindex="0" onclick="openEditSaleModal(${i})" onkeydown="if(event.key==='Enter'&&event.target===this)this.click()">
    <div class="vx-main">
      <div class="vx-cli">${esc(quien)}${para}${v.horaEntrega ? `<span class="vx-hora">${esc(v.horaEntrega)}</span>` : ''}</div>
      <div class="vx-meta">${metaPartes.join(' · ') || '—'}</div>
    </div>
    <div class="vx-tags" onclick="event.stopPropagation()">${_pillEstado(i,v)}${_pillCobro(i,v)}${tags}</div>
    <div class="vx-precio">
      <div class="vx-precio-v">${precio>0 ? _pesos(precio) : '—'}</div>
      ${saldo>0 ? `<div class="vx-saldo">Falta ${_pesos(saldo)}</div>` : (m!=null ? `<div class="vx-margen ${m>=0?'pos':'neg'}" title="Precio − costo estimado − envío">Margen ${_pesos(m)}</div>` : '')}
    </div>
    <div class="vx-acts" onclick="event.stopPropagation()">
      ${fotoRamoBtn(i, v)}
      <button class="btn-icon" onclick="veWhatsApp(${i})" title="Avisarle al cliente por WhatsApp" style="color:var(--sage-dark)">${_IC_WA}</button>
      <button class="btn-icon" onclick="openEditSaleModal(${i})" title="Editar" style="color:var(--sage-dark)">${_IC_EDIT}</button>
      <button class="btn-icon" style="color:var(--red-alert)" title="Eliminar" onclick="delVenta(${i})">✕</button>
    </div>
  </div>`;
}

export function renderVentas(){
  // Banner ítems desde Kanban
  const vkb = document.getElementById('ventas-kanban-banner');
  if(vkb){
    const fromOps = ventasData.filter(v=>v.fromKanban && v.estado==='pendiente');
    vkb.innerHTML = fromOps.length
      ? `<div class="alert-banner" style="background:var(--info-soft);border-color:#B0C8E0;color:var(--info)"><strong>${fromOps.length} ramo${fromOps.length>1?'s':''} cargado${fromOps.length>1?'s':''} desde Operaciones</strong> — completá precio y cliente.</div>`
      : '';
  }
  const $ = id => document.getElementById(id);
  const mesSel=$('ve-filter-mes'), pagoSel=$('ve-filter-pago'), tipoSel=$('ve-filter-tipo'), factSel=$('ve-filter-fact');
  const estSel=$('ve-filter-estado'), cobSel=$('ve-filter-cobro'), respSel=$('ve-filter-resp'), txtEl=$('ve-filter-txt'), perEl=$('ve-periodo');
  if(!$('ve-cards')) return;
  // ── Poblar selects de filtro (mes, forma de pago, tipo, responsable) ──
  if(mesSel){
    const cur = mesSel.value;
    const meses = [...new Set((ventasData||[]).map(v=>(v.fecha||'').slice(0,7)).filter(Boolean))].sort((a,b)=>b.localeCompare(a));
    mesSel.innerHTML = '<option value="">Todos los meses</option>' + meses.map(m=>`<option value="${m}">${D.fmtMonth(m)}</option>`).join('');
    mesSel.value = cur;
  }
  if(pagoSel && pagoSel.options.length<=1){
    pagoSel.innerHTML = '<option value="">Todas las formas de pago</option>' + VENTA_PAGO_OPTS.map(o=>`<option value="${o.value}">${o.label}</option>`).join('');
  }
  if(tipoSel){
    const cur = tipoSel.value;
    const tipos = [...new Set((ventasData||[]).map(v=>(v.prod||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    tipoSel.innerHTML = '<option value="">Todos los tipos</option>' + tipos.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');
    tipoSel.value = cur;
  }
  if(respSel){
    const cur = respSel.value;
    const resp = [...new Set((ventasData||[]).map(v=>(v.asignado||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    respSel.innerHTML = '<option value="">Todas las floristas</option><option value="__sin">Sin asignar</option>' + resp.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');
    respSel.value = cur;
  }
  // Restaurar filtros guardados en la primera carga (tras recargar la app)
  if(_ventasNeedRestore){
    const pr = _loadVentasPrefs();
    const put = (el, val) => { if(el && !el.value && val) el.value = val; };
    put(mesSel, pr.mes); put(pagoSel, pr.pago); put(tipoSel, pr.tipo); put(factSel, pr.fact);
    put(estSel, pr.estado); put(cobSel, pr.cobro); put(respSel, pr.resp);
    if(perEl && pr.periodo) perEl.dataset.valor = pr.periodo;
    _ventasNeedRestore = false;
  }
  const periodo = perEl?.dataset.valor || '';
  ventasFilter = {mes:mesSel?.value||'', pago:pagoSel?.value||'', tipo:tipoSel?.value||'', fact:factSel?.value||'',
    txt:txtEl?.value||'', periodo, estado:estSel?.value||'', cobro:cobSel?.value||'', resp:respSel?.value||''};
  _saveVentasPrefs();
  const f = ventasFilter;
  // Al cambiar el filtro, volver a la primera página (no en cada re-render por edición)
  const _vkey = JSON.stringify(ventasFilter);
  if(_vkey !== _ventasLastKey){ ventasShown = VENTAS_PAGE; _ventasLastKey = _vkey; }

  // Botones de período (Todo / Hoy / Esta semana / Este mes)
  document.querySelectorAll('#ve-periodo [data-per]').forEach(b=>{
    const on = (b.dataset.per||'') === periodo;
    b.classList.toggle('active', on); b.setAttribute('aria-pressed', on);
  });
  const hayFiltros = !!(f.mes||f.pago||f.tipo||f.fact||f.txt||f.periodo||f.estado||f.cobro||f.resp);
  const btnLimpiar = $('ve-limpiar'); if(btnLimpiar) btnLimpiar.style.display = hayFiltros ? '' : 'none';

  let lista = ventasData.map((v,i)=>({v,i})).filter(o=>!(o.v.esPedidoRamo && o.v.estado!=='entregado'));
  if(f.periodo) lista = lista.filter(o=>enPeriodo(o.v.fecha, f.periodo, D.TODAY_ISO));
  if(f.mes)  lista = lista.filter(o=>(o.v.fecha||'').startsWith(f.mes));
  if(f.pago) lista = lista.filter(o=>normPago(o.v.formaPago)===f.pago);
  if(f.tipo) lista = lista.filter(o=>(o.v.prod||'').trim()===f.tipo);
  if(f.estado) lista = lista.filter(o=>(o.v.estado||'pendiente')===f.estado);
  if(f.resp) lista = lista.filter(o=> f.resp==='__sin' ? !o.v.asignado : o.v.asignado===f.resp);
  // Cobro: "por cobrar" = lo que tiene saldo; "pagado" = marcado como cobrado.
  if(f.cobro==='deuda') lista = lista.filter(o=>saldoVenta(o.v)>0);
  else if(f.cobro) lista = lista.filter(o=>(o.v.cobro||'')===f.cobro);
  // Facturado: 'si' = facturadas; 'no' = sin facturar (incluye las que quedaron vacías).
  if(f.fact==='si') lista = lista.filter(o=>o.v.facturado==='Sí');
  if(f.fact==='no') lista = lista.filter(o=>o.v.facturado!=='Sí');
  if(f.txt.trim()){
    const q = _norm(f.txt.trim());
    lista = lista.filter(o=>_norm([o.v.cliente,o.v.destinatario,o.v.prod,o.v.desc,o.v.dir,o.v.asignado].join(' ')).includes(q));
  }
  lista.sort((a,b)=>(b.v.fecha||'').localeCompare(a.v.fecha||'') || String(b.v.horaEntrega||'').localeCompare(String(a.v.horaEntrega||'')));

  // Resumen de lo que se está viendo
  const r = resumenVentas(lista.map(o=>o.v));
  const kpis = $('ve-kpis');
  if(kpis){
    const k = (label, valor, sub, cls='') => `<div class="vx-kpi ${cls}"><div class="vx-kpi-l">${label}</div><div class="vx-kpi-v">${valor}</div><div class="vx-kpi-s">${sub}</div></div>`;
    kpis.innerHTML =
      k('Ventas', _pesos(r.total), `${r.n} venta${r.n!==1?'s':''}`) +
      k('Por cobrar', _pesos(r.porCobrar.monto), r.porCobrar.n ? `${r.porCobrar.n} venta${r.porCobrar.n!==1?'s':''}` : 'Todo cobrado', r.porCobrar.n?'warn':'') +
      k('Sin facturar', _pesos(r.sinFacturar.monto), r.sinFacturar.n ? `${r.sinFacturar.n} venta${r.sinFacturar.n!==1?'s':''}` : 'Todo facturado', r.sinFacturar.n?'warn':'');
  }

  const cont = $('ve-cards');
  if(!lista.length){
    cont.innerHTML = `<div class="ve-empty">${hayFiltros ? 'No hay ventas con estos filtros.' : 'Todavía no hay ventas cargadas.'}</div>`;
    return;
  }
  // Una tarjeta por día; la paginación corta por cantidad de ventas.
  const visibles = lista.slice(0, ventasShown);
  cont.innerHTML = agruparPorDia(visibles).map(g=>{
    const tot = g.items.reduce((s,o)=>s+montoVenta(o.v),0);
    return `<div class="cl-group vx-group">
      <div class="cl-group-hd"><span class="cl-group-dot"></span><h3 class="cl-group-name">${esc(_fechaGrupo(g.fecha))}</h3>
        <span class="cl-group-count">${g.items.length} venta${g.items.length!==1?'s':''}${tot>0?' · '+_pesos(tot):''}</span></div>
      ${g.items.map(o=>_filaVenta(o.i,o.v)).join('')}
    </div>`;
  }).join('') + (lista.length > ventasShown
    ? `<div style="text-align:center;padding:14px"><button class="btn-secondary" onclick="ventasShowMore()">Mostrar ${Math.min(VENTAS_PAGE,lista.length-ventasShown)} más · quedan ${lista.length-ventasShown}</button></div>` : '');
}

// Cambia el estado de cobro. Con "seña" pregunta cuánto dejó.
export async function veSetCobro(i, val){
  const v = ventasData[i];
  if(!v) return;
  if(val === 'sena'){
    const r = await promptModal(`¿De cuánto fue la seña? (precio total ${_pesos(montoVenta(v))})`, { title:'Seña', default: v.sena || '' });
    if(r == null || !(parseMoney(r) > 0)){ renderVentas(); return; }
    v.sena = String(Math.round(parseMoney(r)));
  } else {
    v.sena = '';
  }
  v.cobro = val;
  D.fbSave('ventasData', ventasData);
  renderVentas();
}

// Aviso al cliente por WhatsApp (con su teléfono si está en Clientes o en la venta).
export function veWhatsApp(i){
  const v = ventasData[i];
  if(!v) return;
  const nombre = _norm(v.cliente).trim();
  const cli = nombre ? (getClientesData()||[]).find(c=>_norm(c.nombre).trim()===nombre) : null;
  const tel = v.telefono || cli?.telefono || '';
  if(!tel) showToast('No tengo el teléfono: elegí el contacto en WhatsApp');
  window.open(linkWhatsApp(tel, mensajeWhatsApp(v)), '_blank');
}

export function ventasClearFilters(){
  ['ve-filter-mes','ve-filter-pago','ve-filter-tipo','ve-filter-fact','ve-filter-estado','ve-filter-cobro','ve-filter-resp','ve-filter-txt'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  const per = document.getElementById('ve-periodo'); if(per) per.dataset.valor = '';
  renderVentas();
}

// Cierre de mes: resumen de cobranzas del mes agrupado por forma de pago
// (Cargo a rooms + habitación = "Hotel"). Usa el mes filtrado o, si no hay
// ninguno seleccionado, el mes en curso. Muestra un modal con el detalle y
// un botón para copiar el texto (listo para WhatsApp).
export function ventasCierreMes(){
  const mes = document.getElementById('ve-filter-mes')?.value || D.CURR_MONTH;
  const delMes = (ventasData||[]).filter(v =>
    (v.fecha||'').startsWith(mes) && !(v.esPedidoRamo && v.estado!=='entregado'));
  if(!delMes.length){ showToast('No hay ventas en '+D.fmtMonth(mes)); return; }

  const grupos = {};
  delMes.forEach(v=>{
    const g = grupoCobranza(v.formaPago);
    if(!grupos[g]) grupos[g] = {total:0, count:0};
    grupos[g].total += parseMoney(v.precio);
    grupos[g].count++;
  });
  const orden = ['Efectivo','Tarjeta','Transferencia','Mercado Pago','Link de pago','Hotel','Cuenta corriente','Cargo cliente / outlet F&B','Sin forma de pago'];
  const claves = Object.keys(grupos).sort((a,b)=>{
    const ia = orden.indexOf(a), ib = orden.indexOf(b);
    return (ia<0?99:ia) - (ib<0?99:ib);
  });
  const totalGen = delMes.reduce((s,v)=>s+parseMoney(v.precio),0);

  // Facturación: cuánto se facturó y cuánto quedó pendiente en el mes.
  const factList = delMes.filter(v=>v.facturado==='Sí');
  const factTotal = factList.reduce((s,v)=>s+parseMoney(v.precio),0);
  const pendList = delMes.filter(v=>v.facturado!=='Sí' && parseMoney(v.precio)>0);
  const pendTotal = pendList.reduce((s,v)=>s+parseMoney(v.precio),0);
  // Envíos: gasto total de taxi/flete cargado en el mes y venta neta resultante.
  const enviosTotal = delMes.reduce((s,v)=>s+parseMoney(v.envioCosto),0);
  const enviosCount = delMes.filter(v=>parseMoney(v.envioCosto)>0).length;
  // Ganancia estimada: suma del margen de las ventas con costo estimable.
  const conMargen = delMes.map(margenVenta).filter(m=>m!=null);
  const gananciaTotal = conMargen.reduce((s,m)=>s+m,0);

  const filasHTML = claves.map(g=>`
    <div style="display:flex;justify-content:space-between;align-items:baseline;padding:9px 0;border-bottom:1px solid var(--light-gray)">
      <span>Ventas <strong>${esc(g)}</strong> <span style="color:var(--mid-gray);font-size:12px">· ${grupos[g].count} venta${grupos[g].count!==1?'s':''}</span></span>
      <strong style="white-space:nowrap">Cobrar $${grupos[g].total.toLocaleString('es-AR')}</strong>
    </div>`).join('');

  // Bloque de facturación + envíos (solo se muestra lo que tenga datos).
  const factHTML = `
    <div style="margin-top:14px;padding:12px 14px;background:#FBFAF8;border:1px solid var(--light-gray);border-radius:8px;font-size:13px">
      <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Facturado <span style="color:var(--mid-gray);font-size:12px">· ${factList.length}</span></span><strong>$${factTotal.toLocaleString('es-AR')}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;color:${pendTotal>0?'var(--red-alert)':'inherit'}"><span>Sin facturar <span style="font-size:12px;opacity:.8">· ${pendList.length}</span></span><strong>$${pendTotal.toLocaleString('es-AR')}</strong></div>
      ${enviosTotal>0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px dashed var(--light-gray);margin-top:4px"><span>Envíos (taxi/flete) <span style="color:var(--mid-gray);font-size:12px">· ${enviosCount}</span></span><strong style="color:var(--red-alert)">− $${enviosTotal.toLocaleString('es-AR')}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Neto (ventas − envíos)</span><strong>$${(totalGen-enviosTotal).toLocaleString('es-AR')}</strong></div>` : ''}
      ${conMargen.length ? `<div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px dashed var(--light-gray);margin-top:4px"><span>Ganancia estimada <span style="color:var(--mid-gray);font-size:12px">· ${conMargen.length} c/composición</span></span><strong style="color:var(--green-ok)">$${Math.round(gananciaTotal).toLocaleString('es-AR')}</strong></div>` : ''}
    </div>`;

  window._ventasCierreTexto = `Cierre ${D.fmtMonth(mes)}\n`
    + claves.map(g=>`Ventas ${g}: Cobrar $${grupos[g].total.toLocaleString('es-AR')}`).join('\n')
    + `\n———\nTotal: $${totalGen.toLocaleString('es-AR')} · ${delMes.length} ventas`
    + `\nFacturado: $${factTotal.toLocaleString('es-AR')} (${factList.length})`
    + `\nSin facturar: $${pendTotal.toLocaleString('es-AR')} (${pendList.length})`
    + (enviosTotal>0 ? `\nEnvíos: −$${enviosTotal.toLocaleString('es-AR')}\nNeto: $${(totalGen-enviosTotal).toLocaleString('es-AR')}` : '');

  let ov = document.getElementById('ventas-cierre-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='ventas-cierre-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="modal" style="max-width:460px">
    <button class="modal-close" onclick="closeModal('ventas-cierre-modal')">✕</button>
    <div class="modal-title">Cierre de mes · ${D.fmtMonth(mes)}</div>
    <div style="font-size:12px;color:var(--mid-gray);margin:-6px 0 14px">Cobranzas por forma de pago</div>
    ${filasHTML}
    <div style="display:flex;justify-content:space-between;align-items:baseline;padding:12px 0 0;margin-top:6px;border-top:2px solid var(--charcoal);font-size:17px">
      <span style="font-weight:700">Total</span>
      <strong>$${totalGen.toLocaleString('es-AR')}</strong>
    </div>
    ${factHTML}
    <div class="modal-actions" style="margin-top:18px">
      <button class="btn-secondary" onclick="closeModal('ventas-cierre-modal')">Cerrar</button>
      <button class="btn-add" onclick="ventasCierreCopiar()">Copiar resumen</button>
    </div>
  </div>`;
  ov.classList.add('open');
}
export function ventasCierreCopiar(){
  const txt = window._ventasCierreTexto || '';
  (navigator.clipboard?.writeText(txt) || Promise.reject()).then(
    ()=>showToast('Resumen copiado'),
    ()=>showToast('No se pudo copiar')
  );
}

export function updV(i,field,val){
  ventasData[i][field]=val;
  D.fbSave('ventasData',ventasData);
  sincronizarVentaCaja(i);
  // Al cambiar el estado, refrescar la planilla (color de fila) y el kanban
  // (quitar la tarjeta si el pedido dejó de estar pendiente).
  if(field==='estado'){
    if(document.getElementById('page-ventas-externas')?.classList.contains('active')) renderVentas();
    if(document.getElementById('page-eventos-maison')?.classList.contains('active')) D.renderKanban();
  }
}

// Si una venta en EFECTIVO queda ENTREGADA, sumarla automáticamente a Control de Caja (una sola vez).
export function sincronizarVentaCaja(i){
  const v = ventasData[i];
  if(!v) return;
  if(v.estado === 'entregado' && v.formaPago === 'Efectivo' && !v.cajaRegistrado){
    const monto = parseMoney(v.precio);
    // En un dispositivo sin la caja cargada (florista, o gerencia recién
    // entrando) no se toca la caja: la venta queda pendiente y la suma el
    // próximo dispositivo de gerencia que tenga la caja cargada.
    if(monto > 0 && !D.sensibleCargado('cajaData')){
      if(!v.cajaPendiente){ v.cajaPendiente = true; D.fbSave('ventasData', ventasData); }
      return;
    }
    if(monto > 0){
      cajaData.push({
        fecha: v.fecha || D.TODAY_ISO,
        desc: `Venta: ${v.prod}${v.cliente ? ' — ' + v.cliente : ''}`,
        ticket: '',
        tipo: 'ingreso',
        monto,
        sucursal: v.sucursal || D.getSucursalId(),
        ventaAuto: true
      });
      v.cajaRegistrado = true;
      delete v.cajaPendiente;
      D.fbSave('ventasData', ventasData);
      D.fbSave('cajaData', cajaData);
      if(document.getElementById('page-caja')?.classList.contains('active')) renderCaja();
      showToast(`$${monto.toLocaleString('es-AR')} sumado a Control de Caja (efectivo)`);
    }
  }
}
window.sincronizarVentaCaja = sincronizarVentaCaja;
// Al cargar la caja (gerencia), sumar las ventas en efectivo que quedaron
// pendientes porque se entregaron desde un dispositivo sin la caja.
window._procesarCajaPendientes = () => {
  if(!D.sensibleCargado('cajaData')) return;
  ventasData.forEach((v, i) => { if(v?.cajaPendiente && !v.cajaRegistrado) sincronizarVentaCaja(i); });
};
export function openSaleModal(){
  document.getElementById('sale-modal-title').textContent = 'Nueva Venta';
  document.getElementById('sale-edit-idx').value = '-1';
  document.getElementById('sale-fecha').value=D.TODAY_ISO;
  { const h = document.getElementById('sale-hora'); if(h) h.value = ''; }
  ['sale-desc','sale-cliente','sale-destinatario','sale-dedicatoria','sale-precio','sale-dir'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('sale-estado').value='pendiente';
  document.getElementById('sale-pago').value='';
  ['sale-facturado','sale-taxi','sale-envio','sale-cobro','sale-sena','sale-telefono'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  { const w = document.getElementById('sale-sena-wrap'); if(w) w.style.display = 'none'; }
  document.getElementById('sale-del-btn').style.display='none';
  document.getElementById('sale-doc-btn').style.display='none';
  document.getElementById('sale-save-btn').textContent='Agregar';
  populateSaleSelects('', '');
  document.getElementById('sale-modal').classList.add('open');
}

export async function delVentaDesdeModal(){
  const i = +document.getElementById('sale-edit-idx').value;
  if(i < 0) return;
  const antes = ventasData.length;
  await delVenta(i);
  if(ventasData.length < antes) D.closeModal('sale-modal');
}

// Comprobante de venta para mandar al cliente (no es factura)
export function comprobanteVenta(i){
  const v = ventasData[i];
  if(!v) return;
  const precio = parseMoney(v.precio);
  const envio = parseMoney(v.envioCosto);
  abrirDocumento({
    tipo: 'Comprobante de pedido',
    titulo: v.cliente || 'Cliente',
    numero: 'Pedido ' + String(v.id || v.ts || i + 1).slice(-6),
    meta: 'Fecha: ' + fmtDate(v.fecha || D.TODAY_ISO),
    cuerpo: kv([
        ['Arreglo', esc(v.prod || '—')],
        v.desc ? ['Detalle', esc(v.desc)] : null,
        v.destinatario ? ['Destinatario', esc(v.destinatario)] : null,
        v.dir ? ['Entrega', esc(v.dir)] : null,
        v.formaPago ? ['Forma de pago', esc(v.formaPago)] : null,
        envio > 0 ? ['Envío', fmtPesos(envio)] : null,
      ], { izq: true })
      + (v.dedicatoria ? `<div class="box"><div class="box-label">Dedicatoria</div><div class="box-text">${esc(v.dedicatoria)}</div></div>` : '')
      + (precio > 0 ? `<div class="total-row"><div class="total-label">Total</div><div class="total-val">${fmtPesos(precio + (envio > 0 ? envio : 0))}</div></div>` : '')
      + `<p class="muted">Comprobante interno de pedido. No válido como factura.</p>`,
    archivo: 'Pedido - ' + (v.cliente || v.prod || ''),
  });
}
export function comprobanteVentaDesdeModal(){
  const i = +document.getElementById('sale-edit-idx').value;
  if(i >= 0) comprobanteVenta(i);
}

export function openEditSaleModal(i){
  const v = ventasData[i];
  if(!v) return;
  document.getElementById('sale-modal-title').textContent = 'Editar Venta';
  document.getElementById('sale-edit-idx').value = i;
  populateSaleSelects(v.prod, v.asignado||'');
  document.getElementById('sale-desc').value = v.desc || '';
  document.getElementById('sale-fecha').value = v.fecha || '';
  { const h = document.getElementById('sale-hora'); if(h) h.value = v.horaEntrega || ''; }
  document.getElementById('sale-cliente').value = v.cliente || '';
  document.getElementById('sale-destinatario').value = v.destinatario || '';
  document.getElementById('sale-dedicatoria').value = v.dedicatoria || '';
  document.getElementById('sale-precio').value = v.precio || '';
  document.getElementById('sale-pago').value = v.formaPago || '';
  document.getElementById('sale-estado').value = v.estado || 'pendiente';
  document.getElementById('sale-dir').value = v.dir || '';
  document.getElementById('sale-facturado').value = v.facturado || '';
  document.getElementById('sale-taxi').value = v.taxiFlete || '';
  document.getElementById('sale-envio').value = v.envioCosto || '';
  { const c = document.getElementById('sale-cobro'); if(c) c.value = v.cobro || ''; }
  { const c = document.getElementById('sale-sena'); if(c) c.value = v.sena || ''; }
  { const w = document.getElementById('sale-sena-wrap'); if(w) w.style.display = v.cobro==='sena' ? '' : 'none'; }
  { const c = document.getElementById('sale-telefono'); if(c) c.value = v.telefono || ''; }
  document.getElementById('sale-del-btn').style.display = '';
  document.getElementById('sale-doc-btn').style.display = '';
  document.getElementById('sale-save-btn').textContent = 'Guardar';
  document.getElementById('sale-modal').classList.add('open');
}

export function populateSaleSelects(currentProd, currentAsignado){
  const prodSel = document.getElementById('sale-prod');
  let opts = '<option value="">— Seleccionar —</option>';
  if(D.recetasData.length){
    opts += '<optgroup label="Composiciones">';
    D.recetasData.forEach(r => {
      const costo = D.calcCostoComposicion(r);
      const margen = D.cotizadorConfig?.margen ?? 30;
      const precio = Math.round(costo*(1+margen/100));
      opts += `<option value="${esc(r.nombre)}" data-precio="${precio}"${r.nombre===currentProd?' selected':''}>${D.arregloEmoji(r.nombre)} ${esc(r.nombre)} — $${precio.toLocaleString('es-AR')}</option>`;
    });
    opts += '</optgroup>';
  }
  opts += '<optgroup label="Día de la Madre">';
  DIA_MADRE_ARREGLOS.forEach(a => {
    opts += `<option value="${esc(a.nombre)}" data-precio="${a.precio}"${a.nombre===currentProd?' selected':''}>${esc(a.nombre)} — $${a.precio.toLocaleString('es-AR')}</option>`;
  });
  opts += '</optgroup>';
  listaPreciosData.forEach(cat => {
    if(!(cat.items||[]).length) return;
    opts += `<optgroup label="${cat.emoji||''} ${esc(cat.cat)}">`;
    cat.items.forEach(it => {
      opts += `<option value="${esc(it.nombre)}" data-precio="${parseMoney(it.precio)}"${it.nombre===currentProd?' selected':''}>${esc(it.nombre)} — ${esc(it.precio||'A consultar')}</option>`;
    });
    opts += '</optgroup>';
  });
  // Si el producto actual no está en las listas, agregarlo
  if(currentProd && !prodSel){} // skip
  opts += '<option value="__otro__">+ Otro (escribir)</option>';
  prodSel.innerHTML = opts;
  if(currentProd && !prodSel.value){
    const opt = document.createElement('option');
    opt.value = currentProd; opt.textContent = currentProd; opt.selected = true;
    prodSel.insertBefore(opt, prodSel.lastElementChild);
  }

  const asigSel = document.getElementById('sale-asignado');
  if(asigSel){
    const floristas = typeof D.getFloristasActivos === 'function' ? D.getFloristasActivos() : D.CL_RESP_OPTS.filter(n=>n!=='Jardineria');
    asigSel.innerHTML = '<option value="">— Sin asignar —</option>' + floristas.map(n => `<option value="${esc(n)}"${n===currentAsignado?' selected':''}>${esc(n)}</option>`).join('');
  }
}

export async function saleAutoFillPrice(){
  const sel = document.getElementById('sale-prod');
  if(sel.value === '__otro__'){
    const custom = await promptModal('Nombre del arreglo o ramo:', { title: 'Otro producto' });
    if(custom && custom.trim()){
      const opt = document.createElement('option');
      opt.value = custom.trim(); opt.textContent = custom.trim(); opt.selected = true;
      sel.insertBefore(opt, sel.lastElementChild);
    } else { sel.value = ''; }
    return;
  }
  const selected = sel.options[sel.selectedIndex];
  const precio = selected?.dataset?.precio;
  if(precio && +precio > 0){
    document.getElementById('sale-precio').value = '$' + (+precio).toLocaleString('es-AR');
  }
}

// Campos obligatorios marcados con * (ver validacion.js)
setTimeout(() => marcarObligatorios(['sale-prod','cj-desc-caja','cj-monto','cf-producto','cj-producto','ev-nombre','ev-fecha','leg-nombre','crm-nombre','prov-nombre']), 0);

export function addSale(){
  const prod=document.getElementById('sale-prod').value.trim();
  if(!validarCampos([
    { id:'sale-prod', req:true, msg:'Elegí el arreglo o ramo' },
    { id:'sale-precio', tipo:'monto' },
    { id:'sale-fecha', tipo:'fecha' },
  ])) return;
  const estado = document.getElementById('sale-estado').value;
  const asignado = document.getElementById('sale-asignado')?.value || '';
  const editIdx = +document.getElementById('sale-edit-idx').value;

  const venta = {
    prod,
    desc:document.getElementById('sale-desc').value,
    cliente:document.getElementById('sale-cliente').value,
    destinatario:document.getElementById('sale-destinatario').value,
    fecha:document.getElementById('sale-fecha').value||D.TODAY_ISO,
    horaEntrega:document.getElementById('sale-hora')?.value||'',
    dedicatoria:document.getElementById('sale-dedicatoria').value,
    precio:document.getElementById('sale-precio').value||'—',
    formaPago:document.getElementById('sale-pago').value,
    estado,
    dir:document.getElementById('sale-dir').value||'',
    facturado:document.getElementById('sale-facturado')?.value||'',
    taxiFlete:document.getElementById('sale-taxi')?.value||'',
    envioCosto:document.getElementById('sale-envio')?.value||'',
    cobro:document.getElementById('sale-cobro')?.value||'',
    sena:document.getElementById('sale-cobro')?.value==='sena' ? (document.getElementById('sale-sena')?.value||'') : '',
    telefono:document.getElementById('sale-telefono')?.value?.trim()||'',
    asignado,
    sucursal: D.getSucursalId(),
  };

  const prevAsignadoVenta = editIdx >= 0 ? (ventasData[editIdx]?.asignado || '') : '';
  if(editIdx >= 0){
    // Edición: preservar inicio/fin y el flag de caja si existen
    venta.inicio = ventasData[editIdx].inicio || '';
    venta.fin = ventasData[editIdx].fin || '';
    venta.cajaRegistrado = ventasData[editIdx].cajaRegistrado || false;
    // Facturado, taxi/flete y costo de envío ahora también se editan en el
    // modal (en el celular no hay planilla). Se conservan los demás campos
    // de la venta que el modal no muestra (id, foto, origen kanban…).
    ventasData[editIdx] = { ...ventasData[editIdx], ...venta };
    D.fbSave('ventasData', ventasData);
    sincronizarVentaCaja(editIdx);
    showToast('Venta actualizada');
  } else {
    // Nueva venta
    venta.id = venta.id || D.genEventoId();
    ventasData.push(venta);
    D.fbSave('ventasData', ventasData);
    sincronizarVentaCaja(ventasData.length - 1);
    D.notificarVentaNueva(venta.prod, venta.cliente, asignado);

    // Si está pendiente, crear tarea en kanban (vinculada por ventaId para poder
    // quitarla del tablero cuando el pedido pase a confirmado/entregado).
    if(estado === 'pendiente'){
      D.ensureKanbanCols();
      const detalles = [
        venta.cliente ? ''+venta.cliente : '',
        venta.desc,
        venta.dedicatoria ? '"'+venta.dedicatoria+'"' : '',
        venta.dir ? ''+venta.dir : ''
      ].filter(Boolean).join('\n');
      D.kanbanData[0].cards.push({
        title: '' + prod,
        desc: detalles,
        tags: ['tag-floreria'],
        date: venta.fecha,
        asignado: asignado,
        ventaId: venta.id,
      });
      D.fbSave('kanbanData', D.kanbanData);
      showToast('Venta registrada + tarea creada en Kanban');
    } else {
      showToast('Venta registrada');
    }
  }

  if(asignado && asignado !== prevAsignadoVenta && estado === 'pendiente'){
    D.notificarAsignacion(asignado, 'Nueva venta asignada', `${venta.prod}${venta.cliente ? ' · ' + venta.cliente : ''}`);
  }
  D.closeModal('sale-modal');
  renderVentas();
}
export async function delVenta(i){ if(!await confirmModal('¿Eliminar esta venta?')) return; ventasData.splice(i,1); D.fbSave('ventasData',ventasData); renderVentas(); }