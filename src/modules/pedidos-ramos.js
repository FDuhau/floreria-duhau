// Separado de app.js. Lo que necesita de app.js llega por configurarPedidosRamos():
//   TODAY_ISO, closeModal, fbSave, getFloristasActivos, getSucursalId, recetasData, renderRamosDisp, userRole

import { calcCostoComposicion, cotizadorConfig } from './cotizador.js';
import { esc, fmtDate, parseMoney } from './utils.js';
import { arregloEmoji } from './composiciones.js';
import { listaPreciosData } from './lista-precios.js';
import { CL_RESP_OPTS, renderChecklistTable } from './checklist.js';
import { confirmModal, promptModal } from './modales.js';
import { validarCampos } from './validacion.js';
import { renderVentas, ventasData } from './ventas.js';
import { showToast } from './tema-toast.js';
import { fotoRamoVigente } from './fotos-ramo.js';
import { MARCA, abrirDocumento } from './documento-marca.js';

let D = {};
export function configurarPedidosRamos(deps){ D = deps; }

// ════════════════════════════════════════
// PEDIDOS DE RAMOS — gerencia/comercial encarga un ramo y lo asigna a un florista.
// Se guarda como venta pendiente en ventasData → aparece en el checklist del florista.
// ════════════════════════════════════════
function buildArregloOptions(){
  let opts = '<option value="">— Seleccionar —</option>';
  if((D.recetasData||[]).length){
    opts += '<optgroup label="Composiciones">';
    D.recetasData.forEach(r => {
      const costo = calcCostoComposicion(r);
      const margen = cotizadorConfig?.margen ?? 30;
      const precio = Math.round(costo*(1+margen/100));
      opts += `<option value="${esc(r.nombre)}" data-precio="${precio}">${arregloEmoji(r.nombre)} ${esc(r.nombre)} — $${precio.toLocaleString('es-AR')}</option>`;
    });
    opts += '</optgroup>';
  }
  (listaPreciosData||[]).forEach(cat => {
    if(!(cat.items||[]).length) return;
    opts += `<optgroup label="${cat.emoji||''} ${esc(cat.cat)}">`;
    cat.items.forEach(it => {
      opts += `<option value="${esc(it.nombre)}" data-precio="${parseMoney(it.precio)}">${esc(it.nombre)} — ${esc(it.precio||'')}</option>`;
    });
    opts += '</optgroup>';
  });
  opts += '<option value="__otro__">+ Otro</option>';
  return opts;
}

function openPedidoRamoModal(){
  const f = document.getElementById('pedido-ramo-form'); if(f) f.reset();
  document.getElementById('pr-arreglo').innerHTML = buildArregloOptions();
  const floristas = typeof D.getFloristasActivos === 'function' ? D.getFloristasActivos() : CL_RESP_OPTS.filter(n=>n!=='Jardineria');
  document.getElementById('pr-asignado').innerHTML = '<option value="">— Sin asignar —</option>' + floristas.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
  document.getElementById('pr-fecha').value = D.TODAY_ISO;
  document.getElementById('modal-pedido-ramo').classList.add('open');
}

async function pedidoRamoAutoPrice(){
  const sel = document.getElementById('pr-arreglo');
  if(sel.value === '__otro__'){
    const custom = await promptModal('Nombre del arreglo o ramo:', { title: 'Otro producto' });
    if(custom && custom.trim()){
      const opt = document.createElement('option');
      opt.value = custom.trim(); opt.textContent = custom.trim(); opt.selected = true;
      sel.insertBefore(opt, sel.lastElementChild);
    } else { sel.value = ''; }
    return;
  }
  const o = sel.options[sel.selectedIndex];
  const precio = o?.dataset?.precio;
  if(precio && +precio > 0) document.getElementById('pr-precio').value = '$' + (+precio).toLocaleString('es-AR');
}

// Aviso dirigido a un florista cuando se le asigna algo (evento, pedido o venta)
export function notificarAsignacion(florista, title, body){
  if(!florista) return;
  window.pushSend?.(title, body, 'asignacion', florista);
}
window.notificarAsignacion = notificarAsignacion;

// Aviso a gerencia/comercial cuando se registra una venta (ramo vendido o
// venta cargada en Ventas Externas): hubo una modificación y, si no tiene a
// alguien asignado, queda pendiente de asignar quién la prepara.
export function notificarVentaNueva(prod, cliente, asignado){
  const quien = cliente ? ' · ' + cliente : '';
  if(asignado){
    window.pushSend?.('Nueva venta registrada', `"${prod}"${quien} — asignada a ${asignado}`, 'venta-nueva', 'roles:gerencia,comercial');
  } else {
    window.pushSend?.('Nueva venta · pendiente de asignar', `"${prod}"${quien} — revisá y asigná quién la prepara`, 'venta-nueva', 'roles:gerencia,comercial');
  }
}
window.notificarVentaNueva = notificarVentaNueva;

function guardarPedidoRamo(){
  const prod = document.getElementById('pr-arreglo').value.trim();
  const cliente = document.getElementById('pr-cliente').value.trim();
  const asignado = document.getElementById('pr-asignado').value;
  if(!validarCampos([
    { id:'pr-arreglo', req:true, msg:'Elegí el arreglo' },
    { id:'pr-cliente', req:true, msg:'Escribí el nombre del cliente' },
    { id:'pr-precio', tipo:'monto' },
  ])) return;
  // El florista NO es obligatorio: si queda sin asignar, lo asigna Gerencia.
  ventasData.push({
    prod,
    desc: '',
    cliente,
    fecha: document.getElementById('pr-fecha').value || D.TODAY_ISO,
    dedicatoria: document.getElementById('pr-dedicatoria').value.trim(),
    precio: document.getElementById('pr-precio').value || '—',
    formaPago: document.getElementById('pr-pago').value,
    estado: 'pendiente',
    dir: document.getElementById('pr-dir').value.trim(),
    colores: document.getElementById('pr-colores').value.trim(),
    asignado,
    esPedidoRamo: true,
    sucursal: D.getSucursalId()
  });
  D.fbSave('ventasData', ventasData);
  D.closeModal('modal-pedido-ramo');
  renderPedidosRamos();
  if(document.getElementById('page-ventas-externas')?.classList.contains('active')) renderVentas();
  const cuando = document.getElementById('pr-fecha').value ? ' · ' + fmtDate(document.getElementById('pr-fecha').value) : '';
  if(asignado){
    notificarAsignacion(asignado, 'Nuevo pedido asignado', `Ramo para ${cliente}${cuando}`);
    showToast(`Pedido asignado a ${asignado} — aparece en su checklist`);
  } else {
    // Sin asignar: avisar a Gerencia para que lo asigne a un florista.
    window.pushSend?.('Nuevo pedido de ramo', `Para ${cliente}${cuando} — asigná un florista`, 'pedido-ramo', 'Gerencia');
    showToast('Pedido creado — Gerencia lo asignará a un florista');
  }
}

function renderPedidosRamos(){
  const el = document.getElementById('pedidos-ramos-body');
  if(!el) return;
  // Solo pedidos en curso; los entregados ya pasaron a Ventas Externas
  const pedidos = (ventasData||[]).filter(v => v.esPedidoRamo && v.estado !== 'entregado' && !v.fin);
  const sorted = [...pedidos].sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  if(!sorted.length){ el.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--mid-gray);padding:24px">Sin pedidos. Tocá «+ Nuevo Pedido» para encargar un ramo y asignarlo a un florista.</td></tr>'; return; }
  const estLbl = {pendiente:'Pendiente', confirmado:'Confirmado', entregado:'Entregado'};
  const floristas = (typeof D.getFloristasActivos === 'function' ? D.getFloristasActivos() : []);
  el.innerHTML = sorted.map(v=>{
    const i = ventasData.indexOf(v);
    const hecho = v.estado==='entregado' || v.fin;
    // Gerencia asigna/reasigna el florista desde acá; el resto lo ve solo lectura.
    const asignCell = D.userRole === 'gerencia'
      ? `<select class="form-input" style="padding:5px 8px;font-size:12px;min-width:130px" onchange="asignarFloristaPedido(${i}, this.value)">
           <option value="">— Sin asignar —</option>
           ${floristas.map(f=>`<option value="${esc(f)}" ${v.asignado===f?'selected':''}>${esc(f)}</option>`).join('')}
         </select>`
      : (v.asignado
          ? `<span style="font-weight:600;color:var(--sage-dark)">${esc(v.asignado)}</span>`
          : `<span style="font-weight:600;color:#9A6A1E">Sin asignar</span>`);
    return `<tr${hecho?' style="opacity:.55"':''}>
      <td style="white-space:nowrap">${v.fecha?fmtDate(v.fecha):'—'}</td>
      <td><strong>${esc(v.prod||'—')}</strong></td>
      <td>${esc(v.cliente||'—')}</td>
      <td style="font-size:12px">${esc(v.colores||'—')}</td>
      <td>${asignCell}</td>
      <td style="white-space:nowrap;font-weight:600">${esc(v.precio||'—')}</td>
      <td><span style="font-size:12px">${estLbl[v.estado]||esc(v.estado||'')}${v.fin?' · '+esc(v.fin):''}</span></td>
      <td style="white-space:nowrap"><button class="btn-icon" title="Eliminar" onclick="eliminarPedidoRamo(${i})"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg></button></td>
    </tr>`;
  }).join('');
}

// Gerencia asigna (o reasigna) un florista a un pedido de ramo y le avisa.
function asignarFloristaPedido(i, nombre){
  const v = ventasData[i];
  if(!v) return;
  v.asignado = nombre || '';
  D.fbSave('ventasData', ventasData);
  renderPedidosRamos();
  if(document.getElementById('page-checklist')?.classList.contains('active')) renderChecklistTable?.();
  if(nombre){
    notificarAsignacion(nombre, 'Nuevo pedido asignado', `Ramo para ${v.cliente||''}${v.fecha ? ' · ' + fmtDate(v.fecha) : ''}`);
    showToast(`Asignado a ${nombre} — aparece en su checklist`);
  } else {
    showToast('Pedido sin asignar');
  }
}
window.asignarFloristaPedido = asignarFloristaPedido;

async function eliminarPedidoRamo(i){
  if(i<0 || !ventasData[i]) return;
  if(!await confirmModal('¿Eliminar este pedido?')) return;
  ventasData.splice(i,1);
  D.fbSave('ventasData', ventasData);
  renderPedidosRamos();
  showToast('Pedido eliminado');
}

// Detalle de un pedido/venta — se abre al tocarlo en el checklist, igual que los eventos
export function openVentaDetail(vIdx){
  const v = ventasData[vIdx]; if(!v) return;
  const estados = {pendiente:'Pendiente', confirmado:'Confirmado', entregado:'Entregado'};
  const row = (label, val) => val ? `<div><div class="detail-field-label">${label}</div><div class="detail-field-value">${esc(String(val))}</div></div>` : '';
  let ov = document.getElementById('venta-detail-modal');
  if(!ov){ ov = document.createElement('div'); ov.id='venta-detail-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="modal" style="max-width:480px">
    <div class="modal-header"><h2>${esc(v.prod||'Pedido')}</h2><button class="modal-close" onclick="closeModal('venta-detail-modal')">✕</button></div>
    <div class="modal-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 16px">
        ${row('Cliente', v.cliente)}
        ${row('Para cuándo', v.fecha ? fmtDate(v.fecha) : '')}
        ${row('Tonalidades / colores', v.colores)}
        ${row('Forma de pago', v.formaPago)}
        ${row('Precio', v.precio)}
        ${row('Estado', estados[v.estado] || v.estado)}
      </div>
      ${v.dir ? `<div style="margin-top:14px"><div class="detail-field-label">Dirección de entrega</div><div class="detail-field-value">${esc(v.dir)}</div></div>` : ''}
      ${v.dedicatoria ? `<div style="margin-top:14px;background:var(--cream);border-radius:8px;padding:12px 14px"><div class="detail-field-label">Dedicatoria</div><div style="font-style:italic;font-size:14px;color:var(--charcoal);margin-top:4px">"${esc(v.dedicatoria)}"</div></div>` : ''}
      ${v.desc ? `<div style="margin-top:14px"><div class="detail-field-label">Detalle</div><div class="detail-field-value">${esc(v.desc)}</div></div>` : ''}
      ${(v.fin || v.estado==='entregado' || fotoRamoVigente(v)) ? `<div style="margin-top:14px"><button class="btn-secondary" onclick="closeModal('venta-detail-modal');abrirFotoRamo(${vIdx})">${fotoRamoVigente(v) ? 'Ver foto del ramo' : 'Subir foto del ramo'}</button></div>` : ''}
    </div>
  </div>`;
  ov.classList.add('open');
}
window.openVentaDetail = openVentaDetail;

// Cambio de vista dentro de Ramos Disponibles: Disponibles ↔ Pedidos
export let ramosView = 'disponibles';
export function setRamosView(v){
  ramosView = v;
  const td = document.getElementById('rd-tab-disp');
  const tp = document.getElementById('rd-tab-ped');
  if(td) td.classList.toggle('active', v==='disponibles');
  if(tp) tp.classList.toggle('active', v==='pedidos');
  const vd = document.getElementById('rd-view-disponibles');
  const vp = document.getElementById('rd-view-pedidos');
  if(vd) vd.style.display = v==='disponibles' ? '' : 'none';
  if(vp) vp.style.display = v==='pedidos' ? '' : 'none';
  if(v==='pedidos') renderPedidosRamos(); else D.renderRamosDisp();
}
window.setRamosView = setRamosView;

// Cableado robusto de los botones de vista (por si el onclick inline no dispara)
export function initRamosToggle(){
  const td = document.getElementById('rd-tab-disp');
  const tp = document.getElementById('rd-tab-ped');
  if(td && !td.dataset.wired){ td.dataset.wired = '1'; td.addEventListener('click', () => setRamosView('disponibles')); }
  if(tp && !tp.dataset.wired){ tp.dataset.wired = '1'; tp.addEventListener('click', () => setRamosView('pedidos')); }
}
window.initRamosToggle = initRamosToggle;
window.openPedidoRamoModal = openPedidoRamoModal;
window.pedidoRamoAutoPrice = pedidoRamoAutoPrice;
window.guardarPedidoRamo = guardarPedidoRamo;
window.renderPedidosRamos = renderPedidosRamos;
window.eliminarPedidoRamo = eliminarPedidoRamo;

// ════════════════════════════════════════
// EVENTOS SIN FLORERÍA — eventos en los que el hotel NO nos asignó
// la parte floral (trajo otra marca/ambientador). Sirve para llevar
// registro y reclamarle al hotel según contrato.
// ════════════════════════════════════════
export let eventosSinFloreria = [];
window._setEventosSinFloreria = arr => { eventosSinFloreria = arr && typeof arr === 'object' ? (Array.isArray(arr)?arr:Object.values(arr)) : []; renderEventosSinFloreria(); };

const ESF_ESTADOS = {
  pendiente:       {lbl:'Pendiente de reclamar', bg:'#fff3cd', col:'#856404'},
  reclamado:       {lbl:'Reclamado al hotel',    bg:'#cce5ff', col:'#004085'},
  compensado:      {lbl:'Compensado',            bg:'#d4edda', col:'#155724'},
  'sin-respuesta': {lbl:'Sin respuesta',         bg:'#f8d7da', col:'#721c24'}
};

export function renderEventosSinFloreria(){
  const el = document.getElementById('esf-body');
  if(!el) return;
  const sorted = [...eventosSinFloreria].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));

  // KPIs
  const total       = eventosSinFloreria.length;
  const pendientes  = eventosSinFloreria.filter(e=>e.estado!=='compensado').length;
  const aReclamar   = eventosSinFloreria.filter(e=>e.estado!=='compensado').reduce((s,e)=>s+parseMoney(e.monto||0),0);
  const compensado  = eventosSinFloreria.filter(e=>e.estado==='compensado').reduce((s,e)=>s+parseMoney(e.monto||0),0);
  const stats = document.getElementById('esf-stats');
  if(stats) stats.innerHTML = `
    <div class="kpi-card"><div class="kpi-val">${total}</div><div class="kpi-lbl">Eventos sin florería</div></div>
    <div class="kpi-card"><div class="kpi-val">${pendientes}</div><div class="kpi-lbl">Pendientes / abiertos</div></div>
    <div class="kpi-card"><div class="kpi-val">$${aReclamar.toLocaleString('es-AR',{maximumFractionDigits:0})}</div><div class="kpi-lbl">Monto a reclamar</div></div>
    <div class="kpi-card"><div class="kpi-val">$${compensado.toLocaleString('es-AR',{maximumFractionDigits:0})}</div><div class="kpi-lbl">Compensado</div></div>`;

  if(!sorted.length){
    el.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--mid-gray);padding:28px">'+
      'Sin eventos registrados todavía. Tocá «+ Registrar evento» cuando el hotel no nos asigne la parte floral.</td></tr>';
    return;
  }

  el.innerHTML = sorted.map(ev=>{
    const realIdx = eventosSinFloreria.indexOf(ev);
    const st = ESF_ESTADOS[ev.estado] || ESF_ESTADOS.pendiente;
    return `<tr style="cursor:pointer" onclick="openEsfModal(${realIdx})">
      <td style="white-space:nowrap">${ev.fecha?fmtDate(ev.fecha):'—'}</td>
      <td><strong>${esc(ev.nombre||'—')}</strong>${ev.tipo?`<div style="font-size:12px;color:var(--mid-gray)">${esc(ev.tipo)}</div>`:''}</td>
      <td>${esc(ev.salon||'—')}</td>
      <td>${esc(ev.marca||'—')}</td>
      <td style="font-size:12px;color:var(--charcoal);max-width:220px">${esc(ev.arregloCorr||'—')}</td>
      <td style="white-space:nowrap;font-weight:600;color:var(--red-alert)">${ev.monto?('$'+parseMoney(ev.monto).toLocaleString('es-AR',{maximumFractionDigits:0})):'—'}</td>
      <td><span style="background:${st.bg};color:${st.col};padding:2px 8px;border-radius:10px;font-size:12px;white-space:nowrap">${st.lbl}</span></td>
      <td onclick="event.stopPropagation()" style="white-space:nowrap">
        <button class="btn-icon" title="Editar" onclick="openEsfModal(${realIdx})"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>
        <button class="btn-icon" title="Eliminar" onclick="eliminarEsf(${realIdx})"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg></button>
      </td>
    </tr>`;
  }).join('');
}

export function openEsfModal(idx){
  const f = document.getElementById('esf-form'); if(f) f.reset();
  document.getElementById('esf-idx').value = idx;
  const titleEl = document.getElementById('esf-modal-title');
  if(idx>=0 && eventosSinFloreria[idx]){
    const ev = eventosSinFloreria[idx];
    titleEl.textContent = 'Editar evento sin florería';
    document.getElementById('esf-nombre').value        = ev.nombre||'';
    document.getElementById('esf-tipo').value          = ev.tipo||'';
    document.getElementById('esf-fecha').value         = ev.fecha||'';
    document.getElementById('esf-salon').value         = ev.salon||'';
    document.getElementById('esf-pax').value           = ev.pax||'';
    document.getElementById('esf-marca').value         = ev.marca||'';
    document.getElementById('esf-arreglo').value       = ev.arregloCorr||'';
    document.getElementById('esf-monto').value         = ev.monto||'';
    document.getElementById('esf-estado').value        = ev.estado||'pendiente';
    document.getElementById('esf-fecha-reclamo').value = ev.fechaReclamo||'';
    document.getElementById('esf-detalle').value       = ev.detalle||'';
  } else {
    titleEl.textContent = 'Registrar evento sin florería';
    document.getElementById('esf-fecha').value  = D.TODAY_ISO;
    document.getElementById('esf-estado').value = 'pendiente';
  }
  document.getElementById('modal-esf').classList.add('open');
}

export function guardarEsf(){
  const nombre = document.getElementById('esf-nombre').value.trim();
  if(!nombre){ showToast('Poné al menos el nombre del evento'); return; }
  const obj = {
    nombre,
    tipo:         document.getElementById('esf-tipo').value.trim(),
    fecha:        document.getElementById('esf-fecha').value,
    salon:        document.getElementById('esf-salon').value.trim(),
    pax:          document.getElementById('esf-pax').value,
    marca:        document.getElementById('esf-marca').value.trim(),
    arregloCorr:  document.getElementById('esf-arreglo').value.trim(),
    monto:        document.getElementById('esf-monto').value,
    estado:       document.getElementById('esf-estado').value || 'pendiente',
    fechaReclamo: document.getElementById('esf-fecha-reclamo').value,
    detalle:      document.getElementById('esf-detalle').value.trim(),
    sucursal:     D.getSucursalId()
  };
  const idx = parseInt(document.getElementById('esf-idx').value, 10);
  if(idx>=0 && eventosSinFloreria[idx]){
    obj.id = eventosSinFloreria[idx].id || Date.now();
    eventosSinFloreria[idx] = obj;
  } else {
    obj.id = Date.now();
    eventosSinFloreria.push(obj);
  }
  D.fbSave('eventosSinFloreria', eventosSinFloreria);
  D.closeModal('modal-esf');
  renderEventosSinFloreria();
  showToast('Evento guardado');
}

export async function eliminarEsf(idx){
  if(idx<0 || !eventosSinFloreria[idx]) return;
  if(!await confirmModal('¿Eliminar este registro de evento sin florería?')) return;
  eventosSinFloreria.splice(idx,1);
  D.fbSave('eventosSinFloreria', eventosSinFloreria);
  renderEventosSinFloreria();
  showToast('Eliminado');
}

// Genera un documento de reclamo formal e imprimible (PDF) para el hotel.
export function exportEsfReclamo(){
  if(!eventosSinFloreria.length){ showToast('No hay eventos registrados para reclamar'); return; }
  // Por defecto, el reclamo incluye los casos abiertos (no compensados).
  const abiertos = eventosSinFloreria.filter(e=>e.estado!=='compensado');
  const lista = (abiertos.length ? abiertos : eventosSinFloreria)
    .slice().sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  const total = lista.reduce((s,e)=>s+parseMoney(e.monto||0),0);
  const hoy = fmtDate(D.TODAY_ISO);
  const fmtMon = n => '$'+parseMoney(n||0).toLocaleString('es-AR',{minimumFractionDigits:0,maximumFractionDigits:0});

  const rows = lista.map(e=>`
    <tr>
      <td>${e.fecha?fmtDate(e.fecha):'—'}</td>
      <td><strong>${esc(e.nombre||'—')}</strong>${e.tipo?`<br><span class="muted">${esc(e.tipo)}</span>`:''}</td>
      <td>${esc(e.salon||'—')}</td>
      <td>${esc(e.marca||'—')}</td>
      <td>${esc(e.arregloCorr||'—')}</td>
      <td class="num">${e.monto?fmtMon(e.monto):'—'}</td>
    </tr>`).join('');

  abrirDocumento({
    tipo: 'Reclamo',
    titulo: 'Eventos sin asignación de servicio floral',
    meta: 'Fecha: ' + hoy,
    cuerpo: `<p>Por la presente dejamos constancia de los eventos detallados a continuación, en los cuales —conforme al acuerdo vigente— correspondía la asignación del servicio floral a Florería Duhau y la misma no fue otorgada, habiéndose contratado a un proveedor externo. Se solicita la regularización / compensación correspondiente.</p>
      <table class="t"><thead><tr>
        <th>Fecha</th><th>Evento</th><th>Salón / Zona</th><th>Marca externa</th><th>Arreglo que correspondía</th><th class="num">Monto</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="5" style="text-align:right">Total a reclamar</td><td class="num">${fmtMon(total)}</td></tr></tfoot>
      </table>
      <p class="muted">Cantidad de eventos incluidos: ${lista.length}.</p>
      <div class="firmas"><div>${MARCA.nombre}</div></div>`,
    archivo: 'Reclamo eventos - ' + hoy,
  });
}