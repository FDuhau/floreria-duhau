// Separado de app.js. Lo que necesita de app.js llega por configurarRecepcion():
//   TODAY_ISO, comprasFlore, fbSave, stockData

import { esc, fmtDate, parseMoney } from './utils.js';
import { getVarasPorPaq, renderCompras } from './compras.js';
import { showToast } from './tema-toast.js';
import { confirmModal } from './modales.js';
import { _stockIngresar, renderStock } from './stock.js';
import { cotizadorPrecios } from './cotizador.js';
import { claveCostoPara } from './articulos-base.js';
import { icon } from './iconos.js';
import { comprimirImagen } from './imagenes.js';
import { cartelCategoriaVara, historialCostoVara } from './categoria-vara.js';
import { cantidadReclamos, mensajeReclamo, reclamosPendientes } from './reclamos-base.js';
import { linkWhatsApp } from './ventas-base.js';
import { areasDeOrdenes, ordenEnArea, repartoDeArea, textoCantReparto } from './reparto-base.js';

let D = {};
export function configurarRecepcion(deps){ D = deps; }

// ════════════════════════════════════════
// RECEPCIÓN DE PEDIDOS
// ════════════════════════════════════════
let recepState = {}; // key: idx → { items: [{checked, cantRecibida}] }

let recepAgrupado = false;

// Qué le toca a cada área de este renglón. Con un área filtrada se resalta la suya.
function _repartoHTML(order, area){
  const rep = Array.isArray(order.reparto) ? order.reparto : [];
  if(!rep.length) return '';
  const propia = repartoDeArea(order, area);
  if(propia){
    return `<div style="margin-top:6px;font-size:13px;font-weight:700;color:var(--sage-dark);background:var(--ok-soft);display:inline-block;border-radius:8px;padding:3px 10px">Para ${esc(area)}: ${esc(textoCantReparto(propia))}</div>`;
  }
  return `<div style="margin-top:6px;font-size:12px;color:var(--mid-gray)">Reparto: ${rep.map(r => `${esc(r.area)} <strong style="color:var(--charcoal)">${esc(textoCantReparto(r))}</strong>`).join(' · ')}</div>`;
}

export function toggleRecepAgrupado(){
  recepAgrupado = !recepAgrupado;
  const btn = document.getElementById('recep-group-btn');
  if(btn) btn.classList.toggle('active', recepAgrupado);
  renderRecepcionPedidos();
}

export function renderRecepcionPedidos(){
  // Fase 1 (por controlar): ni recibidos ni ya controlados.
  const allPending = D.comprasFlore
    .map((c,i) => ({...c, _idx: i}))
    .filter(c => c.estado !== 'recibido' && c.estado !== 'controlado' && !c.noLlego);
  // Fase 2 (revisión): controlados, todavía SIN subir al stock.
  const controlados = D.comprasFlore
    .map((c,i) => ({...c, _idx: i}))
    .filter(c => c.estado === 'controlado');

  const listEl  = document.getElementById('recep-list');
  const emptyEl = document.getElementById('recep-empty');
  const alertEl = document.getElementById('recep-alert-area');
  const filterBar = document.getElementById('recep-filter-bar');
  const groupedEl = document.getElementById('recep-grouped');

  if(!listEl) return;

  // La lista de revisión se muestra siempre que haya controlados (aunque no
  // queden pedidos por controlar).
  _renderRevisionRecep(controlados);
  _renderReclamos();

  if(allPending.length === 0){
    listEl.innerHTML = '';
    emptyEl.style.display = controlados.length ? 'none' : '';
    alertEl.innerHTML = '';
    if(filterBar) filterBar.style.display = 'none';
    if(groupedEl){ groupedEl.style.display = 'none'; groupedEl.innerHTML=''; }
    // Ocultar la barra de acciones y el botón de "Controlar todo" de la fase 1.
    const ab = document.getElementById('recep-action-bar'); if(ab) ab.style.display = 'none';
    const cw = document.getElementById('recep-confirm-all-wrap'); if(cw) cw.style.display = 'none';
    return;
  }
  emptyEl.style.display = 'none';
  if(filterBar) filterBar.style.display = 'flex';

  // Filtro por nombre de insumo (agrupa el mismo producto aunque esté en pedidos separados)
  const q = (document.getElementById('recep-search')?.value||'').trim().toLowerCase();
  // Filtro por área (sector): se combina con el de insumo
  const areaSel = document.getElementById('recep-area');
  if(areaSel){
    const areas = areasDeOrdenes(allPending);   // cada área por separado, aunque un renglón junte varias
    const prevArea = areaSel.value;
    areaSel.innerHTML = '<option value="">Todas las áreas</option>' + areas.map(a => `<option value="${esc(a)}">${esc(a)}</option>`).join('');
    areaSel.value = areas.includes(prevArea) ? prevArea : '';
  }
  const area = areaSel?.value || '';
  const pending = allPending.filter(o =>
    (!q || (o.prod||'').toLowerCase().includes(q)) &&
    ordenEnArea(o, area));

  // Sin alertas de urgencia — circuito simple pedido → recibido
  alertEl.innerHTML = '';

  // Vista agrupada por insumo: suma paquetes del mismo producto entre arreglos/secciones
  if(recepAgrupado && groupedEl){
    listEl.style.display = 'none';
    groupedEl.style.display = '';
    const groups = {};
    pending.forEach(o => {
      const key = (o.prod||'—').trim();
      if(!groups[key]) groups[key] = { prod:key, qty:0, n:0, sectores:new Set(), provs:new Set() };
      groups[key].qty += parseFloat(o.qty)||0;
      groups[key].n++;
      if(Array.isArray(o.reparto) && o.reparto.length){
        o.reparto.forEach(r => { if(!area || r.area === area) groups[key].sectores.add(`${r.area} (${textoCantReparto(r)})`); });
      } else if(o.sector) groups[key].sectores.add(o.sector);
      if(o.prov) groups[key].provs.add(o.prov);
    });
    const rows = Object.values(groups).sort((a,b)=>a.prod.localeCompare(b.prod,'es'));
    groupedEl.innerHTML = `<div style="font-size:12px;color:var(--mid-gray);margin-bottom:10px">${rows.length} insumo${rows.length!==1?'s':''} distinto${rows.length!==1?'s':''} · ${pending.length} pedido${pending.length!==1?'s':''}</div>
      <div class="table-wrapper"><table class="stock-table" style="min-width:520px">
        <thead><tr><th>Insumo</th><th style="text-align:center">Pedidos</th><th style="text-align:center">Total paquetes</th><th>Secciones / arreglos</th></tr></thead>
        <tbody>${rows.map(g=>`<tr>
          <td><strong>${esc(g.prod)}</strong></td>
          <td style="text-align:center">${g.n}</td>
          <td style="text-align:center"><strong style="font-size:15px;color:var(--sage-dark)">${g.qty}</strong></td>
          <td style="font-size:12px;color:var(--mid-gray)">${esc([...g.sectores].join(', ')||'—')}</td>
        </tr>`).join('')}</tbody>
      </table></div>`;
    const actionBar = document.getElementById('recep-action-bar');
    if(actionBar) actionBar.style.display = 'none';
    recepUpdateGlobal(allPending);
    return;
  }
  listEl.style.display = '';
  if(groupedEl){ groupedEl.style.display = 'none'; groupedEl.innerHTML=''; }

  // Show action bar
  const actionBar = document.getElementById('recep-action-bar');
  if(actionBar) actionBar.style.display = 'flex';

  if(pending.length === 0){
    listEl.innerHTML = '<div style="padding:32px;text-align:center;color:var(--mid-gray);font-size:13px">Sin resultados para "'+esc(q)+'"</div>';
    recepUpdateGlobal(allPending);
    return;
  }

  listEl.innerHTML = pending.map((order) => {
    const globalIdx = order._idx;
    if(!recepState[globalIdx]){
      recepState[globalIdx] = { checked: false, paqRecibidos: order.qty, varasPorPaq: getVarasPorPaq(order.prod) || 1 };
    }
    const st = recepState[globalIdx];
    // Migrar estado viejo (cantRecibida) al nuevo formato
    if(st.cantRecibida && !st.paqRecibidos){ st.paqRecibidos = st.cantRecibida; st.varasPorPaq = 1; }
    const totalVaras = (parseFloat(st.paqRecibidos)||0) * (parseFloat(st.varasPorPaq)||1);
    const estadoBadge = '<span style="background:var(--ok-soft);color:#3A5230;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:700">PEDIDO</span>';
    const paqOk = parseFloat(st.paqRecibidos) >= parseFloat(order.qty);
    const rowClass = st.checked ? (paqOk ? 'recep-ok' : 'recep-parcial') : '';

    return `<div class="recep-pedido" id="recep-pedido-${globalIdx}">
      <div class="recep-pedido-header">
        <div>
          <div class="recep-pedido-title">${esc(order.prod)}</div>
          <div class="recep-pedido-meta">${esc(order.fecha)} · ${esc(order.prov||'Sin proveedor')} · ${esc(order.sector||'')} ${estadoBadge}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:12px;opacity:.6">Pedido</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:400">${order.qty} paq</div>
        </div>
      </div>
      <div class="recep-item-row ${rowClass}" id="recep-row-${globalIdx}" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <input type="checkbox" class="recep-check" id="recep-chk-${globalIdx}"
          ${st.checked ? 'checked' : ''}
          onchange="recepToggle(${globalIdx}, this.checked)">
        <div style="flex:1;min-width:120px">
          <div style="font-weight:500">${esc(order.prod)}</div>
          ${order.desc ? `<div style="font-size:12px;color:var(--mid-gray)">${esc(order.desc)}</div>` : ''}
          ${_repartoHTML(order, area)}
        </div>
        <div style="text-align:center">
          <div style="font-size:12px;color:var(--mid-gray)">Pedido</div>
          <strong style="font-size:15px">${order.qty}</strong>
          <div style="font-size:12px;color:var(--mid-gray)">paquetes</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:12px;color:var(--mid-gray)">Recibidos</div>
          <input type="number" class="recep-qty-input" id="recep-paq-${globalIdx}"
            value="${st.paqRecibidos}" min="0"
            onchange="recepUpdPaq(${globalIdx}, this.value)"
            ${!st.checked ? 'disabled style="opacity:.5"' : ''}>
          <div style="font-size:12px;color:var(--mid-gray)">paquetes</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:12px;color:var(--mid-gray)">Varas/paq</div>
          <input type="number" class="recep-qty-input" id="recep-varas-${globalIdx}"
            value="${st.varasPorPaq}" min="1"
            onchange="recepUpdVaras(${globalIdx}, this.value)"
            ${!st.checked ? 'disabled style="opacity:.5"' : ''}>
          <div style="font-size:12px;color:var(--mid-gray)">unidades</div>
        </div>
        <div style="text-align:center;min-width:70px">
          <div style="font-size:12px;color:var(--mid-gray)">Total varas</div>
          <strong style="font-size:18px;color:${st.checked?'var(--sage-dark)':'var(--mid-gray)'}" id="recep-total-${globalIdx}">${st.checked ? totalVaras : '—'}</strong>
        </div>
        <div style="text-align:center;width:36px">
          ${st.checked
            ? (paqOk
              ? '<span style="font-size:18px"></span>'
              : '<span style="font-size:18px"></span><div style="font-size:12px;color:var(--amber)">Faltante</div>')
            : '<span style="font-size:18px;opacity:.3"></span>'
          }
        </div>
      </div>
      ${(()=>{
        // Cómo entra hoy esta vara (estación / importada / premium) con el
        // precio de la compra y las varas por paquete que se están cargando.
        const precio = parseMoney(order.costo), vpp = parseFloat(st.varasPorPaq)||0;
        if(!(precio>0) || !(vpp>1)) return '';
        const previo = historialCostoVara(order.prod, D.comprasFlore, order)[0]?.costoVara || 0;
        return `<div style="padding:0 14px 10px">${cartelCategoriaVara(precio/vpp, previo)}</div>`;
      })()}
      <div class="recep-footer">
        <div class="recep-progress">
          ${st.checked
            ? `<strong>${st.paqRecibidos}</strong> de <strong>${order.qty}</strong> paquetes`
              + (paqOk ? '' : ` <span style="color:var(--amber);font-weight:600">· Faltaron ${order.qty - st.paqRecibidos} paq — RECLAMAR</span>`)
              + ` · <strong>${totalVaras} varas totales</strong>`
              + `<span style="color:var(--green-ok);font-weight:600"> (${st.paqRecibidos} paq × ${st.varasPorPaq} varas)</span>`
            : '<span style="color:var(--mid-gray)">Pendiente — tildá para registrar</span>'}
        </div>
        ${st.checked && totalVaras > 0
          ? `<button onclick="recepConfirmar(${globalIdx})" style="background:#B8853A;color:white;border:none;border-radius:6px;padding:7px 16px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap">Controlar · ${totalVaras} varas</button>`
          : ''}
      </div>
      <div style="padding:8px 14px;border-top:1px solid var(--light-gray);display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:${order.recepAlerta?'rgba(200,60,60,.06)':'transparent'}">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:${order.recepAlerta?'var(--red-alert)':'var(--mid-gray)'};cursor:pointer;white-space:nowrap">
          <input type="checkbox" ${order.recepAlerta?'checked':''} onchange="recepToggleMal(${globalIdx}, this.checked)"> Mal estado
        </label>
        <input class="form-input" value="${esc(order.recepObs||'')}" placeholder="Aclaración (ej: vino golpeado, marchito, faltante…)" onchange="recepUpdObs(${globalIdx}, this.value)" style="flex:1;min-width:160px;font-size:12px">
        ${order.recepFoto
          ? `<button class="btn-secondary" style="font-size:12px;padding:5px 9px" onclick="verFotoRecep(${globalIdx})">Ver</button><button class="btn-icon" style="color:var(--red-alert)" onclick="recepQuitarFoto(${globalIdx})" title="Quitar foto">✕</button>`
          : `<label class="btn-secondary" style="font-size:12px;padding:5px 9px;cursor:pointer;white-space:nowrap">Foto<input type="file" accept="image/*" capture="environment" style="display:none" onchange="recepFotoInput(${globalIdx}, this)"></label>`}
      </div>
    </div>`;
  }).join('');
  recepUpdateGlobal(pending);
}

export function recepUpdateGlobal(pending){
  if(!pending){
    pending = D.comprasFlore
      .map((c,i) => ({...c, _idx: i}))
      .filter(c => c.estado !== 'recibido' && c.estado !== 'controlado' && !c.noLlego);
  }
  const total   = pending.length;
  const checked = pending.filter(o => recepState[o._idx]?.checked).length;
  const progEl  = document.getElementById('recep-global-progress');
  const wrapEl  = document.getElementById('recep-confirm-all-wrap');
  const summEl  = document.getElementById('recep-confirm-summary');
  const btnEl   = document.getElementById('recep-btn-all');
  if(progEl) progEl.innerHTML = `<strong>${checked}</strong> de <strong>${total}</strong> ítems controlados`;
  if(wrapEl) wrapEl.style.display = checked > 0 ? '' : 'none';
  if(summEl && checked > 0){
    const items = pending
      .filter(o => recepState[o._idx]?.checked)
      .map(o => {
        const st = recepState[o._idx];
        const tv = (parseFloat(st.paqRecibidos)||0) * (parseFloat(st.varasPorPaq)||1);
        return `<strong>${tv}</strong> varas de ${esc(o.prod)}`;
      })
      .join(' · ');
    summEl.innerHTML = `Vas a controlar: ${items}`;
  }
  if(btnEl) btnEl.disabled = checked === 0;
}

export function recepCheckAll(){
  const q = (document.getElementById('recep-search')?.value||'').trim().toLowerCase();
  const area = document.getElementById('recep-area')?.value || '';
  const pending = D.comprasFlore
    .map((c,i) => ({...c, _idx: i}))
    .filter(c => c.estado !== 'recibido' && c.estado !== 'controlado' && !c.noLlego)
    .filter(c => (!q || (c.prod||'').toLowerCase().includes(q)) && ordenEnArea(c, area));
  pending.forEach(o => {
    if(!recepState[o._idx]) recepState[o._idx] = {};
    recepState[o._idx].checked = true;
    if(!recepState[o._idx].paqRecibidos) recepState[o._idx].paqRecibidos = o.qty;
    if(!recepState[o._idx].varasPorPaq) recepState[o._idx].varasPorPaq = getVarasPorPaq(o.prod) || 1;
  });
  renderRecepcionPedidos();
}

export function recepUncheckAll(){
  recepState = {};
  renderRecepcionPedidos();
}

// Fase 1: marca los ítems tildados como CONTROLADOS (no van al stock todavía).
// Pasan a la lista de Revisión, donde se hace el segundo check y recién ahí se
// suben al stock.
export async function recepConfirmarTodo(){
  const pending = D.comprasFlore
    .map((c,i) => ({...c, _idx: i}))
    .filter(c => c.estado !== 'recibido' && c.estado !== 'controlado' && !c.noLlego);
  const toConfirm = pending.filter(o => recepState[o._idx]?.checked);
  if(toConfirm.length === 0){ showToast('Marcá al menos un ítem.','error'); return; }
  // Lo pedido que NO se tildó se interpreta como "no llegó" (el proveedor no lo tenía):
  // se anula y desaparece de Compras y de Recepción, sin borrarse definitivamente.
  const noLlegaron = pending.filter(o => !recepState[o._idx]?.checked);
  const parciales = toConfirm.filter(o => parseFloat(recepState[o._idx].paqRecibidos) < parseFloat(o.qty));
  let msg = `¿Marcar como controlados ${toConfirm.length} ítem${toConfirm.length>1?'s':''}?`;
  if(parciales.length > 0) msg += `\n\n${parciales.length} con faltantes en paquetes — reclamar al proveedor.`;
  if(noLlegaron.length > 0) msg += `\n\n${noLlegaron.length} ítem${noLlegaron.length>1?'s sin tildar se marcan como "no llegó" y desaparecen':' sin tildar se marca como "no llegó" y desaparece'} de Compras.`;
  msg += '\n\nLos controlados pasan a la lista de REVISIÓN. El stock se actualiza recién cuando confirmes la revisión.';
  if(!await confirmModal(msg)) return;
  toConfirm.forEach(o => {
    const st = recepState[o._idx];
    const paqRec = parseFloat(st.paqRecibidos) || 0;
    const varasPaq = parseFloat(st.varasPorPaq) || 1;
    D.comprasFlore[o._idx].estado = 'controlado';
    D.comprasFlore[o._idx].paqRecibidos = paqRec;
    D.comprasFlore[o._idx].varasPorPaq = varasPaq;
    D.comprasFlore[o._idx].totalVaras = paqRec * varasPaq;
    delete recepState[o._idx];
  });
  noLlegaron.forEach(o => {
    D.comprasFlore[o._idx].anulado = true;
    D.comprasFlore[o._idx].noLlego = true;
    delete recepState[o._idx];
  });
  window._comprasFloreLastSave = Date.now(); D.fbSave('comprasFlore', D.comprasFlore);
  let toastMsg = `${toConfirm.length} ítem${toConfirm.length>1?'s controlados':' controlado'} — revisá el listado y subilo al stock`;
  if(noLlegaron.length > 0) toastMsg += ` · ${noLlegaron.length} marcado${noLlegaron.length>1?'s':''} "no llegó"`;
  showToast(toastMsg);
  renderRecepcionPedidos();
}

// Sube UNA compra controlada al stock: suma varas, actualiza el costo/vara del
// cotizador y la marca como recibida. Devuelve las varas ingresadas.
export function _subirCompraAlStock(idx){
  const o = D.comprasFlore[idx];
  if(!o) return 0;
  const paqRec = parseFloat(o.paqRecibidos) || 0;
  const varasPaq = parseFloat(o.varasPorPaq) || 1;
  const totalVaras = paqRec * varasPaq;
  if(totalVaras > 0){
    _stockIngresar(o.prod, o.desc, o.sector, totalVaras);
  }
  o.estado = 'recibido';
  o.totalVaras = totalVaras;
  const costoTotal = parseMoney(o.costo);
  if(costoTotal > 0 && varasPaq > 0) cotizadorPrecios[claveCostoPara(cotizadorPrecios, o.prod)] = Math.round(costoTotal / varasPaq);
  return totalVaras;
}

// Recibir UN renglón desde Compras (botón check por fila): sube ese ítem
// controlado al stock y lo deja "recibido", sin esperar a la revisión en lote.
export function recibirRenglonCompra(i){
  const o = D.comprasFlore[i];
  if(!o) return;
  _subirCompraAlStock(i);
  window._comprasFloreLastSave = Date.now();
  D.fbSave('comprasFlore', D.comprasFlore);
  D.fbSave('stockData', D.stockData);
  D.fbSave('cotizadorPrecios', cotizadorPrecios);
  showToast('✓ ' + (o.prod||'') + ' recibido');
  renderCompras('floreria');
  if(document.getElementById('page-stock')?.classList.contains('active')) renderStock();
  if(document.getElementById('page-recepcion-pedidos')?.classList.contains('active')) renderRecepcionPedidos();
}

// Recibir TODO un pedido (bloque por fecha) de una vez: sube al stock todos los
// ítems controlados de esa fecha, sin tener que tocar "Recibir" renglón por renglón.
export async function recibirPedidoCompleto(fecha){
  const items = D.comprasFlore
    .map((c,i)=>({c,i}))
    .filter(x => (x.c.fecha||'sin-fecha')===fecha && x.c.estado==='controlado' && !x.c.noLlego);
  if(!items.length){ showToast('No hay ítems controlados para recibir en este pedido.'); return; }
  const label = fecha!=='sin-fecha' ? fmtDate(fecha) : 'sin fecha';
  if(!await confirmModal(`¿Recibir los ${items.length} ítem${items.length>1?'s':''} controlado${items.length>1?'s':''} del pedido del ${label}?\n\nSe suben al stock y se actualizan los costos por vara.`)) return;
  items.forEach(x => _subirCompraAlStock(x.i));
  window._comprasFloreLastSave = Date.now();
  D.fbSave('comprasFlore', D.comprasFlore);
  D.fbSave('stockData', D.stockData);
  D.fbSave('cotizadorPrecios', cotizadorPrecios);
  showToast(`✓ ${items.length} ítem${items.length>1?'s recibidos':' recibido'} — precios actualizados`);
  renderCompras('floreria');
  if(document.getElementById('page-stock')?.classList.contains('active')) renderStock();
  if(document.getElementById('page-recepcion-pedidos')?.classList.contains('active')) renderRecepcionPedidos();
}

// Fase 2: sube TODO lo controlado al stock (el segundo check ya se hizo).
export async function recepSubirStockTodo(){
  const controlados = D.comprasFlore.map((c,i)=>({...c,_idx:i})).filter(c=>c.estado==='controlado');
  if(!controlados.length){ showToast('No hay ítems controlados para subir.'); return; }
  const totalVaras = controlados.reduce((s,o)=>s+(parseFloat(o.totalVaras)||0),0);
  if(!await confirmModal(`¿Subir al stock ${controlados.length} ítem${controlados.length>1?'s':''}?\n\nTotal: ${totalVaras} varas.\nSe actualiza el stock y se calculan los costos por vara.`)) return;
  controlados.forEach(o=>_subirCompraAlStock(o._idx));
  D.fbSave('stockData', D.stockData);
  window._comprasFloreLastSave = Date.now(); D.fbSave('comprasFlore', D.comprasFlore);
  D.fbSave('cotizadorPrecios', cotizadorPrecios);
  showToast(`${controlados.length} ítem${controlados.length>1?'s ingresados':' ingresado'} al stock — precios actualizados`);
  renderRecepcionPedidos();
  if(document.getElementById('page-stock')?.classList.contains('active')) renderStock();
  if(document.getElementById('page-compras-floreria')?.classList.contains('active')) renderCompras('floreria');
}

// Devuelve un ítem controlado a la lista de control (para corregir).
export function recepVolverAControl(globalIdx){
  const o = D.comprasFlore[globalIdx];
  if(!o) return;
  o.estado = 'pedido';
  window._comprasFloreLastSave = Date.now(); D.fbSave('comprasFlore', D.comprasFlore);
  showToast(`"${o.prod}" volvió a control`);
  renderRecepcionPedidos();
}

// Lista de revisión (fase 2): ítems controlados, con el segundo check antes de
// subir al stock. Se dibuja en #recep-revision.
function _renderRevisionRecep(controlados){
  const el = document.getElementById('recep-revision');
  if(!el) return;
  if(!controlados || !controlados.length){ el.style.display='none'; el.innerHTML=''; return; }
  el.style.display = '';
  const totalVaras = controlados.reduce((s,o)=>s+(parseFloat(o.totalVaras)||0),0);
  el.innerHTML = `
    <div style="background:#FBF7EE;border:1px solid #E7D9B8;border-radius:10px;padding:16px 18px;margin-top:22px">
      <div style="font-weight:700;color:#8A6A1A;margin-bottom:4px">Revisión — ${controlados.length} ítem${controlados.length!==1?'s':''} controlado${controlados.length!==1?'s':''}, todavía SIN subir al stock</div>
      <div style="font-size:12px;color:var(--mid-gray);margin-bottom:12px">Segundo check: revisá el listado completo (que no falte nada ni haya un error) y recién ahí subilo al stock.</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${controlados.map(o=>{
          const idx = o._idx;
          return `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;background:${o.recepAlerta?'rgba(200,60,60,.08)':'var(--warm-white)'};border:1px solid var(--light-gray);border-radius:8px;padding:8px 12px">
            <div style="flex:1;min-width:160px">
              <div style="font-weight:600">${esc(o.prod)}${o.recepAlerta?' <span style="color:var(--red-alert);font-size:12px">mal estado</span>':''}</div>
              <div style="font-size:12px;color:var(--mid-gray)">${o.paqRecibidos||0} paq × ${o.varasPorPaq||1} = <strong>${o.totalVaras||0} varas</strong>${o.prov?' · '+esc(o.prov):''}${o.sector?' · '+esc(o.sector):''}</div>
              ${_recepFlagBadge(o, idx)}
            </div>
            <button class="btn-secondary" style="font-size:12px;padding:5px 10px;white-space:nowrap" onclick="recepVolverAControl(${idx})" title="Volver a control para corregir">${icon('undo')}Corregir</button>
          </div>`;
        }).join('')}
      </div>
      <div style="text-align:center;margin-top:16px">
        <div style="font-size:12px;color:var(--mid-gray);margin-bottom:10px">Total a ingresar: <strong>${totalVaras} varas</strong></div>
        <button class="btn-recep-confirm" onclick="recepSubirStockTodo()" style="font-size:14px;padding:12px 34px">Confirmar y subir todo al stock</button>
      </div>
    </div>`;
}

export function recepToggle(globalIdx, checked){
  if(!recepState[globalIdx]) recepState[globalIdx] = {};
  recepState[globalIdx].checked = checked;
  if(checked){
    const order = D.comprasFlore[globalIdx];
    if(!recepState[globalIdx].paqRecibidos)
      recepState[globalIdx].paqRecibidos = order.qty;
    if(!recepState[globalIdx].varasPorPaq)
      recepState[globalIdx].varasPorPaq = getVarasPorPaq(order.prod) || 1;
  }
  renderRecepcionPedidos();
}

export function recepUpdPaq(globalIdx, val){
  if(!recepState[globalIdx]) recepState[globalIdx] = {};
  recepState[globalIdx].paqRecibidos = Math.max(0, parseFloat(val)||0);
  renderRecepcionPedidos();
}

export function recepUpdVaras(globalIdx, val){
  if(!recepState[globalIdx]) recepState[globalIdx] = {};
  recepState[globalIdx].varasPorPaq = Math.max(1, parseFloat(val)||1);
  renderRecepcionPedidos();
}

// ── Observación / foto de recepción (ej: "vino en mal estado") ────────────────
// Se guarda en la compra (comprasFlore) y queda visible flageado en la tabla de
// Compras y en el Historial, para que el encargado de compras lo vea al cargar
// precios. Guarda directo en el pedido (no depende de confirmar la recepción).
function _recepSave(){ window._comprasFloreLastSave = Date.now(); D.fbSave('comprasFlore', D.comprasFlore); }
export function recepUpdObs(globalIdx, val){
  if(!D.comprasFlore[globalIdx]) return;
  D.comprasFlore[globalIdx].recepObs = val;
  _recepSave();
}
export function recepToggleMal(globalIdx, checked){
  if(!D.comprasFlore[globalIdx]) return;
  D.comprasFlore[globalIdx].recepAlerta = !!checked;
  _recepSave();
  renderRecepcionPedidos();
}
export function recepFotoInput(globalIdx, inputEl){
  const file = inputEl?.files?.[0];
  if(!file || !D.comprasFlore[globalIdx]) return;
  comprimirImagen(file, 1000, 0.6, data => {
    D.comprasFlore[globalIdx].recepFoto = data;
    _recepSave();
    renderRecepcionPedidos();
    showToast('Foto adjuntada a la recepción');
  });
}
export function recepQuitarFoto(globalIdx){
  if(!D.comprasFlore[globalIdx]) return;
  delete D.comprasFlore[globalIdx].recepFoto;
  _recepSave();
  renderRecepcionPedidos();
}
export function verFotoRecep(globalIdx){
  const c = D.comprasFlore[globalIdx];
  if(!c?.recepFoto){ showToast('Sin foto'); return; }
  let ov = document.getElementById('recep-foto-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='recep-foto-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="modal" style="max-width:560px;text-align:center">
    <button class="modal-close" onclick="closeModal('recep-foto-modal')">✕</button>
    <div class="modal-title">Recepción · ${esc(c.prod||'')}</div>
    ${c.recepObs?`<div style="font-size:12px;color:${c.recepAlerta?'var(--red-alert)':'var(--mid-gray)'};margin:-6px 0 10px;font-weight:600">${c.recepAlerta?'':''}${esc(c.recepObs)}</div>`:''}
    <img src="${c.recepFoto}" style="max-width:100%;border-radius:8px">
  </div>`;
  ov.classList.add('open');
}
// Estilo de fila y badge para señalar un pedido con observación/mal estado.
export function _recepFlagStyle(r){
  if(!r) return '';
  if(r.recepAlerta) return 'background:rgba(200,60,60,.10)';
  if(r.recepObs || r.recepFoto) return 'background:rgba(212,150,20,.10)';
  return '';
}
export function _recepFlagBadge(r, idx){
  if(!r || !(r.recepAlerta || r.recepObs || r.recepFoto)) return '';
  const col = r.recepAlerta ? 'var(--red-alert)' : '#9A6A00';
  const lbl = r.recepAlerta ? 'Recibido en mal estado' : 'Obs. recepción';
  const foto = r.recepFoto ? ` · <a onclick="verFotoRecep(${idx})" style="cursor:pointer;text-decoration:underline">ver foto</a>` : '';
  const txt = r.recepObs ? ': '+esc(r.recepObs) : '';
  return `<div style="margin-top:3px;font-size:12px;font-weight:600;color:${col}">${lbl}${txt}${foto}</div>`;
}

// Fase 1: controlar un ítem (NO va al stock todavía; pasa a Revisión).
export function recepConfirmar(globalIdx){
  const order = D.comprasFlore[globalIdx];
  const st    = recepState[globalIdx];
  if(!st || !st.checked) return;

  const paqRec = parseFloat(st.paqRecibidos) || 0;
  const varasPaq = parseFloat(st.varasPorPaq) || 1;
  const totalVaras = paqRec * varasPaq;
  if(totalVaras <= 0){ showToast('Ingresá paquetes y varas por paquete'); return; }

  order.estado = 'controlado';
  order.paqRecibidos = paqRec;
  order.varasPorPaq = varasPaq;
  order.totalVaras = totalVaras;
  window._comprasFloreLastSave = Date.now(); D.fbSave('comprasFlore', D.comprasFlore);

  delete recepState[globalIdx];

  showToast(`"${order.prod}" controlado — revisalo abajo antes de subir al stock`);
  renderRecepcionPedidos();
}

// ── Reclamos al proveedor: faltantes y mercadería en mal estado ──────────────
// Junta lo que llegó de menos o en mal estado de los últimos 30 días, por
// proveedor, con el mensaje listo para copiar o mandar por WhatsApp.
function _reclamosGrupos(){ return reclamosPendientes(D.comprasFlore, { hoy: D.TODAY_ISO, dias: 30 }); }

function _renderReclamos(){
  const el = document.getElementById('recep-reclamos');
  if(!el) return;
  const grupos = _reclamosGrupos();
  if(!grupos.length){ el.style.display = 'none'; el.innerHTML = ''; return; }
  el.style.display = '';
  const n = cantidadReclamos(grupos);
  el.innerHTML = `<div style="background:#FDF3F1;border:1px solid #F0D0CA;border-radius:10px;padding:16px 18px;margin-bottom:20px">
    <div style="font-weight:700;color:var(--red-alert);margin-bottom:2px">Para reclamar — ${n} ítem${n!==1?'s':''}</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:12px">Lo que llegó de menos o en mal estado. Copiá el mensaje o mandalo por WhatsApp, y después marcalo como reclamado.</div>
    ${grupos.map((g, gi) => `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:8px;padding:12px 14px;margin-bottom:10px">
      <div style="font-weight:600;margin-bottom:6px">${esc(g.prov)}</div>
      ${g.items.map(it => `<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;padding:6px 0;border-top:1px solid var(--light-gray);font-size:13px">
        <div style="flex:1;min-width:160px"><strong>${esc(it.prod)}</strong>
          <span style="color:var(--mid-gray)">${it.fecha ? ' · ' + esc(fmtDate(it.fecha)) : ''}</span>
          <div style="font-size:12px;color:var(--red-alert);font-weight:600">${[it.faltan > 0 ? `Faltaron ${it.faltan} paq (pedidos ${it.pedidos}, llegaron ${it.recibidos})` : '', it.malEstado ? 'Mal estado' + (it.obs ? ': ' + esc(it.obs) : '') : ''].filter(Boolean).join(' · ')}${it.foto ? ` · <a onclick="verFotoRecep(${it.idx})" style="cursor:pointer;text-decoration:underline">ver foto</a>` : ''}</div>
        </div>
        <button class="btn-secondary" style="font-size:12px;padding:5px 10px;white-space:nowrap" onclick="recepMarcarReclamado(${it.idx})">Ya reclamé</button>
      </div>`).join('')}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <button class="btn-secondary" onclick="recepCopiarReclamo(${gi})">Copiar mensaje</button>
        <button class="btn-secondary" onclick="recepWhatsAppReclamo(${gi})">WhatsApp</button>
      </div>
    </div>`).join('')}
  </div>`;
}

export async function recepCopiarReclamo(gi){
  const g = _reclamosGrupos()[gi]; if(!g) return;
  try{ await navigator.clipboard.writeText(mensajeReclamo(g)); showToast('Mensaje copiado'); }
  catch(e){ showToast('No se pudo copiar. Probá con el botón de WhatsApp'); }
}
export function recepWhatsAppReclamo(gi){
  const g = _reclamosGrupos()[gi]; if(!g) return;
  window.open(linkWhatsApp('', mensajeReclamo(g)), '_blank', 'noopener');
}
export function recepMarcarReclamado(idx){
  const c = D.comprasFlore[idx]; if(!c) return;
  c.reclamado = true;
  c.reclamadoFecha = D.TODAY_ISO;
  _recepSave();
  showToast('Marcado como reclamado');
  renderRecepcionPedidos();
}
Object.assign(window, { recepCopiarReclamo, recepWhatsAppReclamo, recepMarcarReclamado });
