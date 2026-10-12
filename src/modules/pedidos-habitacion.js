import { esc, parseMoney, fmtDate } from './utils.js';
import { confirmModal } from './modales.js';
import { showToast } from './tema-toast.js';
import { listaPreciosData } from './lista-precios.js';

// Viven en app.js; se pasan una sola vez con configurarPedidosHab() al arrancar.
const D = {};
export function configurarPedidosHab(deps){ Object.assign(D, deps); }
const fbSave = (...a) => window.fbSave(...a);

// ── PEDIDOS DE HABITACIÓN ──────────────────────────────────────────────────────
export const pedidosHabData = [];

export function renderHomeHyatt(){
  // KPIs del panel
  const statsEl = document.getElementById('hyatt-home-stats');
  if(statsEl){
    const data = pedidosHabData || [];
    const pend = data.filter(p=>p.estado==='pendiente').length;
    const prep = data.filter(p=>p.estado==='preparando').length;
    const listos = data.filter(p=>p.estado==='listo').length;
    const mes = data.filter(p=>(p.fecha||'').startsWith(D.CURR_MONTH)).length;
    statsEl.innerHTML = `
      <div class="kpi-card"><div class="kpi-val">${pend}</div><div class="kpi-lbl">Pedidos pendientes</div></div>
      <div class="kpi-card"><div class="kpi-val">${prep}</div><div class="kpi-lbl">En preparación</div></div>
      <div class="kpi-card"><div class="kpi-val">${listos}</div><div class="kpi-lbl">Listos para entregar</div></div>
      <div class="kpi-card"><div class="kpi-val">${mes}</div><div class="kpi-lbl">Pedidos del mes</div></div>`;
  }

  const el = document.getElementById('hyatt-home-pedidos');
  if(!el) return;
  const ultimos = pedidosHabData.slice(0,5);
  if(!ultimos.length){
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--mid-gray)">No hay pedidos todavía. Cargá el primero desde "Pedidos de Habitación".</div>';
    return;
  }
  const estadoIcons = {pendiente:'⏳',preparando:'',listo:'',entregado:''};
  el.innerHTML = ultimos.map(p =>
    `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:8px;padding:10px 14px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
      <div><strong>${_phResumen(p)}</strong> — Hab. ${esc(p.habitacion)} · ${esc(p.cliente)}</div>
      <span style="font-size:13px">${estadoIcons[p.estado]||'⏳'} ${p.estado}</span>
    </div>`
  ).join('');
}

// ── Pedidos de habitación: arreglos MÚLTIPLES (uno o varios por pedido) ──
// Mismo criterio que los arreglos de un evento: se cargan varias filas
// {tipo, qty}. tipo viene como "comp:Nombre" (composición) o "ramo:Nombre".
let phItemRows = [];

function _phItemOptionsHTML(selected){
  let opts = '<option value="">— Seleccionar arreglo —</option>';
  if(D.recetas().length){
    opts += '<optgroup label="Composiciones">';
    D.recetas().forEach(r => { const v='comp:'+r.nombre; opts += `<option value="${esc(v)}" ${v===selected?'selected':''}>${esc(r.nombre)}</option>`; });
    opts += '</optgroup>';
  }
  const ramos = [...new Set((D.ramos()||[]).map(r=>r.nombre).filter(Boolean))];
  if(ramos.length){
    opts += '<optgroup label="Ramos">';
    ramos.forEach(n => { const v='ramo:'+n; opts += `<option value="${esc(v)}" ${v===selected?'selected':''}>${esc(n)}</option>`; });
    opts += '</optgroup>';
  }
  if(!D.recetas().length && !ramos.length) opts += '<option value="" disabled>Cargá composiciones o ramos primero</option>';
  return opts;
}

function renderPHItems(){
  const list = document.getElementById('ph-items-list');
  if(!list) return;
  if(!phItemRows.length) phItemRows = [{tipo:'', qty:1}];
  list.innerHTML = phItemRows.map((row,i)=>{
    const precio = _precioVariantePH(row.tipo);
    return `<div class="ph-item-row" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:6px">
      <select onchange="phSetItemTipo(${i},this.value)" style="flex:2;min-width:150px;border:1px solid #E4E2DC;border-radius:6px;padding:8px;font-family:inherit;font-size:13px;outline:none">${_phItemOptionsHTML(row.tipo)}</select>
      <span style="font-size:12px;color:var(--mid-gray)">×</span>
      <input type="number" min="1" value="${row.qty||1}" onchange="phSetItemQty(${i},this.value)" style="width:62px;border:1px solid #E4E2DC;border-radius:6px;padding:8px 6px;font-size:13px;text-align:center;outline:none;font-family:inherit">
      <span style="font-size:12px;color:var(--mid-gray);min-width:78px;text-align:right">${precio?esc(precio):'—'}</span>
      <button type="button" class="btn-icon" style="color:var(--red-alert)" onclick="phRemoveItemRow(${i})" title="Quitar">✕</button>
    </div>`;
  }).join('');
  const totalEl = document.getElementById('ph-items-total');
  if(totalEl){
    const total = phItemRows.reduce((s,r)=>{ const n=parseMoney(_precioVariantePH(r.tipo)); return s + (n>0 ? n*(+r.qty||0) : 0); }, 0);
    totalEl.textContent = total>0 ? 'Total: $'+total.toLocaleString('es-AR') : '';
  }
}

export function phAddItemRow(){ phItemRows.push({tipo:'', qty:1}); renderPHItems(); }
export function phSetItemTipo(i,val){ if(phItemRows[i]){ phItemRows[i].tipo = val; renderPHItems(); } }
export function phSetItemQty(i,val){ if(phItemRows[i]){ phItemRows[i].qty = Math.max(1,+val||1); renderPHItems(); } }
export function phRemoveItemRow(i){ phItemRows.splice(i,1); if(!phItemRows.length) phItemRows=[{tipo:'',qty:1}]; renderPHItems(); }

// Resumen de arreglos de un pedido, para mostrar. Soporta los pedidos viejos
// de un solo ítem (tipo/qty) y los nuevos con items[].
function _phResumen(p){
  const items = Array.isArray(p.items) && p.items.length ? p.items : [{tipo:p.tipo, qty:p.qty}];
  return items.map(it => `${it.qty}× ${esc(it.tipo||'')}`).join(' + ');
}

// Resuelve el precio del modelo elegido en el pedido de habitación.
// La variante viene como "comp:Nombre" (composición, precio = costo + margen)
// o "lp:Nombre" (ítem de la lista de precios). Devuelve el precio unitario.
function _precioVariantePH(val){
  if(!val) return '';
  if(val.startsWith('comp:')){
    const r = D.recetas().find(x => x.nombre === val.slice(5));
    if(r){
      const costo = D.calcCostoComposicion(r);
      const margen = D.cotizador()?.margen ?? 30;
      return '$' + Math.round(costo*(1+margen/100)).toLocaleString('es-AR');
    }
  } else if(val.startsWith('ramo:')){
    const nombre = val.slice(5);
    const r = (D.ramos()||[]).find(x => x.nombre === nombre);
    if(r) return r.precio || '';
  } else if(val.startsWith('lp:')){
    const nombre = val.slice(3);
    for(const cat of listaPreciosData){
      const it = (cat.items||[]).find(x => x.nombre === nombre);
      if(it) return it.precio || '';
    }
  }
  return '';
}

export function enviarPedidoHab(){
  // Uno o varios arreglos: se toma cada fila cargada con arreglo y cantidad.
  const items = phItemRows
    .filter(r => r.tipo && (+r.qty) > 0)
    .map(r => {
      const precioUnit = _precioVariantePH(r.tipo);
      return { tipo: r.tipo.replace(/^(comp|ramo):/,''), qty: +r.qty, precio: precioUnit, precioNum: parseMoney(precioUnit) };
    });
  if(!items.length){ showToast('Agregá al menos un arreglo'); return; }
  const cliente = document.getElementById('ph-cliente')?.value?.trim();
  if(!cliente){ showToast('Ingresá el nombre del huésped'); return; }

  const totalNum = items.reduce((s,it)=> s + (it.precioNum>0 ? it.precioNum*it.qty : 0), 0);
  const precioTotal = totalNum > 0 ? '$' + totalNum.toLocaleString('es-AR') : '';
  const resumen = items.map(it => `${it.qty}× ${it.tipo}`).join(' + ');

  const pedido = {
    items: items.map(it => ({ tipo: it.tipo, qty: it.qty, precio: it.precio })),
    resumen,
    // Compatibilidad con lecturas viejas (primer ítem)
    tipo: items[0].tipo,
    variante: '',
    qty: items[0].qty,
    cliente,
    habitacion: document.getElementById('ph-habitacion')?.value?.trim() || '—',
    tonalidad: document.getElementById('ph-tonalidad')?.value?.trim() || '',
    cuando: document.getElementById('ph-cuando')?.value || '',
    cobro: document.getElementById('ph-cobro')?.value || '',
    solicitante: document.getElementById('ph-solicitante')?.value?.trim() || '',
    obs: document.getElementById('ph-obs')?.value?.trim() || '',
    precio: precioTotal,
    fecha: D.TODAY_ISO,
    hora: new Date().toTimeString().slice(0,5),
    estado: 'pendiente'
  };

  pedidosHabData.unshift(pedido);
  fbSave('pedidosHabData', pedidosHabData);

  // ── AUTO: Crear tarea en Kanban para que florería lo prepare ──
  D.ensureKanbanCols();
  const vidHab = D.genEventoId();
  const cardTitle = resumen;
  const cardDesc = `Hab. ${pedido.habitacion} · ${cliente}${pedido.tonalidad?' · '+pedido.tonalidad:''}${pedido.cuando?' · Para: '+pedido.cuando.replace('T',' '):''}${pedido.obs?' · '+pedido.obs:''}`;
  D.kanban()[0].cards.push({
    title: cardTitle,
    desc: cardDesc,
    tags: ['tag-floreria'],
    date: pedido.cuando ? pedido.cuando.split('T')[0] : D.TODAY_ISO,
    pedidoHabIdx: pedidosHabData.length - 1,
    ventaId: vidHab,
  });
  fbSave('kanbanData', D.kanban());

  // ── AUTO: Registrar en Ventas Externas (con el precio total del pedido) ──
  D.ventas().push({
    prod: cardTitle,
    desc: cardDesc,
    cliente: cliente,
    fecha: D.TODAY_ISO,
    dedicatoria: pedido.obs || '',
    precio: precioTotal,
    formaPago: pedido.cobro || '',
    estado: 'pendiente',
    dir: 'Hab. ' + pedido.habitacion,
    id: vidHab,
    fromPedidoHab: true
  });
  fbSave('ventasData', D.ventas());

  // Limpiar formulario
  phItemRows = [{tipo:'', qty:1}];
  ['ph-cliente','ph-habitacion','ph-tonalidad','ph-cuando','ph-cobro','ph-obs','ph-solicitante'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = '';
  });

  renderPedidosHab();
  showToast('Pedido enviado · tarea creada en Kanban · registrado en Ventas');
}

export function renderPedidosHab(){
  renderPHItems();
  const list = document.getElementById('ph-lista');
  if(!list) return;
  if(!pedidosHabData.length){
    list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--mid-gray)">No hay pedidos todavía.</div>';
    return;
  }
  const estadoIcons = {pendiente:'⏳',preparando:'',listo:'',entregado:''};
  const estadoLabels = {pendiente:'Pendiente',preparando:'En preparación',listo:'Listo',entregado:'Entregado'};
  const estadoColors = {pendiente:'#FDF8E8',preparando:'#EBF0E8',listo:'#E8F0F8',entregado:'#F4F1EC'};

  list.innerHTML = pedidosHabData.map((p,i) => {
    const icon = estadoIcons[p.estado]||'⏳';
    const label = estadoLabels[p.estado]||'Pendiente';
    const bg = estadoColors[p.estado]||'#FDF8E8';
    const isGerOrOps = window.userRole === 'gerencia' || window.userRole === 'operario';
    return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;padding:14px 16px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
        <div>
          <span style="font-size:15px;font-weight:600;color:#1A1A1A">${_phResumen(p)}</span>
          <span style="background:${bg};padding:3px 10px;border-radius:10px;font-size:11px;font-weight:600;margin-left:8px">${icon} ${label}</span>
        </div>
        <div style="font-size:11px;color:var(--mid-gray)">${p.fecha ? fmtDate(p.fecha) : ''} ${p.hora||''}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:6px 16px;margin-top:10px;font-size:13px">
        <div><span style="color:var(--mid-gray)">Huésped:</span> <strong>${esc(p.cliente)}</strong></div>
        <div><span style="color:var(--mid-gray)">Hab:</span> <strong>${esc(p.habitacion)}</strong></div>
        ${p.tonalidad?`<div><span style="color:var(--mid-gray)">Tonalidad:</span> ${esc(p.tonalidad)}</div>`:''}
        ${p.cuando?`<div><span style="color:var(--mid-gray)">Para:</span> ${esc(p.cuando.replace('T',' '))}</div>`:''}
        ${p.cobro?`<div><span style="color:var(--mid-gray)">Cobro:</span> ${esc(p.cobro)}</div>`:''}
        ${p.solicitante?`<div><span style="color:var(--mid-gray)">Solicitó:</span> ${esc(p.solicitante)}</div>`:''}
      </div>
      ${p.obs?`<div style="margin-top:8px;font-size:12px;color:var(--mid-gray);font-style:italic">"${esc(p.obs)}"</div>`:''}
      ${isGerOrOps ? `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
        <select class="form-input" style="width:170px;padding:5px 8px;font-size:12px" onchange="updPedidoHabEstado(${i},this.value)">
          <option value="pendiente" ${p.estado==='pendiente'?'selected':''}>⏳ Pendiente</option>
          <option value="preparando" ${p.estado==='preparando'?'selected':''}>En preparación</option>
          <option value="listo" ${p.estado==='listo'?'selected':''}>Listo</option>
          <option value="entregado" ${p.estado==='entregado'?'selected':''}>Entregado</option>
        </select>
        <button class="btn-icon" style="color:var(--red-alert);font-size:12px" onclick="delPedidoHab(${i})">✕ Eliminar</button>
      </div>` : ''}
    </div>`;
  }).join('');
}

export function updPedidoHabEstado(i, val){
  pedidosHabData[i].estado = val;
  fbSave('pedidosHabData', pedidosHabData);
  renderPedidosHab();
}

export async function delPedidoHab(i){
  if(!await confirmModal('¿Eliminar este pedido?')) return;
  pedidosHabData.splice(i,1);
  fbSave('pedidosHabData', pedidosHabData);
  renderPedidosHab();
  showToast('Pedido eliminado');
}
