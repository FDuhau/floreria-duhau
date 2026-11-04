// ── STOCK E INVENTARIO ──────────────────────────────────────────────────────
// Stock de florería (alertas, comprometido por eventos, en pedido, filtros),
// stock mínimo sugerido e inventario por ubicación.
// Separado de app.js. Lo que necesita de app.js llega por configurarStock():
//   closeModal, comprasFlore, comprasJard, estaEditando, eventosData, fbSave, stockData

import { calcStockImpact } from './eventos.js';
import { _varasPorPaqResuelto } from './cotizador.js';
import { esc } from './utils.js';
import { showToast } from './tema-toast.js';
import { confirmModal } from './modales.js';
import { getAreaUsoZonas } from './compras.js';
import { ventasData } from './ventas.js';

let D = {};
export function configurarStock(deps){ D = deps; }


// ════════════════════════════════════════
// DATA — STOCK
// ════════════════════════════════════════

export function getAlerta(item, comprometido){
  const comp = comprometido !== undefined ? comprometido : 0;
  const libre = item.actual - comp;
  if(item.actual<=0) return 'comprar';
  if(item.actual<item.min) return 'comprar';
  if(comp>0 && libre<item.min) return 'comprar';
  if(item.actual<=item.min*1.6) return 'atencion';
  if(comp>0 && libre<=item.min*1.6) return 'atencion';
  return 'ok';
}

// Color / variedad de un renglón de stock (vacío si el producto no se separa por color)
function _stockColor(s){ return String(s.color||'').trim().toLowerCase(); }
export function _stockNombre(s){ return s.color ? `${s.prod} · ${s.color}` : s.prod; }
function _colorCoincide(color, desc){
  const c = String(color||'').trim().toLowerCase(), d = String(desc||'').trim().toLowerCase();
  return !!c && !!d && (d.includes(c) || c.includes(d));
}
// Renglones de stock de un producto por nombre exacto (todos sus colores)
export function _stockFilasDe(prod){
  const pl = String(prod||'').trim().toLowerCase();
  return D.stockData.filter(s => String(s.prod||'').trim().toLowerCase() === pl);
}
// Suma varas a un producto recibido. Si el pedido trae color en la descripción
// va al renglón de ese color (se crea si no existe); si no, al renglón sin color.
// Devuelve true si creó un renglón nuevo.
export function _stockIngresar(prod, desc, sector, qty){
  const prodLower = String(prod||'').toLowerCase();
  const filas = D.stockData.filter(s => s.prod.toLowerCase().includes(prodLower) || prodLower.includes(s.prod.toLowerCase()));
  const d = String(desc||'').trim();
  const sumar = f => { f.actual = +Math.max(0, f.actual + qty).toFixed(1); };
  if(d){
    const fila = filas.find(f => _colorCoincide(f.color, d));
    if(fila){ sumar(fila); return false; }
    D.stockData.push({ prod, color:d, area: sector || filas[0]?.area || 'Sin área', min:1, max:Math.max(qty*2,4), actual:qty });
    return true;
  }
  const sinColor = filas.filter(f => !f.color);
  if(sinColor.length){ sinColor.forEach(sumar); return false; }
  D.stockData.push({ prod, area: sector || 'Sin área', min:1, max:Math.max(qty*2,4), actual:qty });
  return true;
}

export function getStockEnPedido(item){
  // Pedidos en curso (pedidos aún no recibidos)
  const coloresDelProd = _stockFilasDe(item.prod).map(f=>f.color).filter(Boolean);
  const pending = [...D.comprasFlore,...D.comprasJard].filter(c=>
    c.estado!=='recibido' && !c.anulado && c.prod && c.prod.toLowerCase().includes(item.prod.toLowerCase()) &&
    (item.color ? _colorCoincide(item.color, c.desc) : !coloresDelProd.some(col => _colorCoincide(col, c.desc)))
  );
  return +(pending.reduce((s,c)=>s+parseFloat(c.qty||0),0).toFixed(1));
}

export function getStockComprometido(item){
  // Los eventos piden el producto sin color: lo comprometido se muestra en el renglón sin color
  if(item.color) return 0;
  // Suma de ingredientes requeridos por eventos que aún no se confirmaron/realizaron
  const ACTIVE_ESTADOS = ['Pedidos Pendientes','En Proceso','Pendiente de Colocacion','Pendiente de Retiro'];
  let total = 0;
  const prodLower = item.prod.toLowerCase();
  D.eventosData.forEach(ev=>{
    if(!ACTIVE_ESTADOS.includes(ev.estado)) return;
    if(!ev.arreglos?.length) return;
    const impact = calcStockImpact(ev.arreglos);
    Object.entries(impact).forEach(([prod,qty])=>{
      if(prod.toLowerCase()===prodLower) total += qty;
    });
  });
  return +(total.toFixed(1));
}

// Preferencias de la tabla de Stock (filtro, búsqueda y orden) — persistidas
const _STOCK_PREFS_KEY = 'fd-stock-prefs';
let stockFilter='all', stockSearch='', stockSort='estado';
(function(){
  try {
    const p = JSON.parse(localStorage.getItem(_STOCK_PREFS_KEY) || '{}');
    if(p.filter) stockFilter = p.filter;
    if(typeof p.search === 'string') stockSearch = p.search;
    if(p.sort) stockSort = p.sort;
  } catch(e){}
})();
function _saveStockPrefs(){
  try { localStorage.setItem(_STOCK_PREFS_KEY, JSON.stringify({filter:stockFilter, search:stockSearch, sort:stockSort})); } catch(e){}
}
// Refleja el estado guardado en los controles de la UI (al entrar a Stock)
function applyStockControls(){
  const inp = document.getElementById('stock-search-input');
  if(inp && document.activeElement !== inp && inp.value !== stockSearch) inp.value = stockSearch;
  const sel = document.getElementById('stock-sort');
  if(sel && sel.value !== stockSort) sel.value = stockSort;
  document.querySelectorAll('[data-stock-filter]').forEach(b=>{
    b.classList.toggle('active', b.getAttribute('data-stock-filter') === stockFilter);
  });
}
export function setStockSort(v){ stockSort = v; _saveStockPrefs(); renderStock(); }

// Equivalencia del stock actual en paquetes (varas por paquete de Compras)
function _stockPaqHtml(item){
  const vpp = _varasPorPaqResuelto(item.prod);
  if(vpp > 0){
    const paq = Math.round((item.actual / vpp) * 10) / 10;
    return `<div style="font-size:12px;color:var(--mid-gray);margin-top:3px;text-align:center" title="${vpp} varas por paquete">≈ ${paq} paq</div>`;
  }
  return `<div style="font-size:12px;color:var(--red-alert);margin-top:3px;text-align:center" title="Cargá las varas por paquete en Compras">sin dato de paq</div>`;
}

export function renderStock(){
  const tbody = document.getElementById('stock-body');
  tbody.innerHTML = '';
  let ok=0,at=0,co=0;

  // Pre-computar stock comprometido para todos los ítems de una vez
  const comprometidos = D.stockData.map(item => getStockComprometido(item));

  // Conteos sobre TODOS los ítems (independiente del filtro visible)
  D.stockData.forEach((item,i)=>{
    const al = getAlerta(item, comprometidos[i]);
    if(al==='ok') ok++; else if(al==='atencion') at++; else co++;
  });

  // Orden de índices: filtrado + búsqueda + orden elegido
  const _sev = {comprar:0, atencion:1, ok:2};
  const _al = i => getAlerta(D.stockData[i], comprometidos[i]);
  const _cmp = {
    estado:      (a,b)=> _sev[_al(a)]-_sev[_al(b)] || _stockNombre(D.stockData[a]).localeCompare(_stockNombre(D.stockData[b]),'es'),
    nombre:      (a,b)=> _stockNombre(D.stockData[a]).localeCompare(_stockNombre(D.stockData[b]),'es'),
    area:        (a,b)=> (D.stockData[a].area||'').localeCompare(D.stockData[b].area||'','es') || _stockNombre(D.stockData[a]).localeCompare(_stockNombre(D.stockData[b]),'es'),
    'actual-asc':(a,b)=> D.stockData[a].actual-D.stockData[b].actual,
    'actual-desc':(a,b)=> D.stockData[b].actual-D.stockData[a].actual,
    nivel:       (a,b)=> (D.stockData[a].actual/(D.stockData[a].max||1))-(D.stockData[b].actual/(D.stockData[b].max||1)),
  };
  const order = D.stockData.map((_,i)=>i).filter(i=>{
    const al = _al(i);
    return (stockFilter==='all'||al===stockFilter) &&
      (stockSearch===''||D.stockData[i].prod.toLowerCase().includes(stockSearch)||_stockColor(D.stockData[i]).includes(stockSearch)||D.stockData[i].area.toLowerCase().includes(stockSearch));
  });
  order.sort(_cmp[stockSort] || _cmp.estado);

  applyStockControls();

  order.forEach(i=>{
    const item = D.stockData[i];
    const comp = comprometidos[i];
    const al = getAlerta(item, comp);
    const pct = Math.min(100,Math.round((item.actual/item.max)*100));
    const alMap = {ok:['OK','ok'],atencion:['ATENCIÓN','atencion'],comprar:['COMPRAR','comprar']};
    const [alLabel,alClass] = alMap[al];

    // Columna "En Pedido" — pedidos aún no recibidos
    const enPedido = getStockEnPedido(item);
    const pedidoHtml = enPedido > 0
      ? `<span style="color:var(--green-ok);font-weight:600">+${enPedido%1===0?enPedido:enPedido.toFixed(1)}</span><span style="font-size:12px;color:var(--sage);margin-left:3px">en camino</span>`
      : `<span style="color:var(--sage-light)">—</span>`;

    // Columna "Comprometido" — ingredientes de eventos pendientes
    let compHtml;
    if(comp <= 0){
      compHtml = `<span style="color:var(--sage-light)">—</span>`;
    } else {
      const libre = +(item.actual - comp).toFixed(1);
      const needsBuy = libre < item.min;
      const color = needsBuy ? 'var(--red-alert)' : 'var(--amber)';
      const icon = needsBuy ? '' : '';
      const libreStr = libre%1===0 ? libre : libre.toFixed(1);
      const compStr  = comp%1===0  ? comp  : comp.toFixed(1);
      const warning  = needsBuy
        ? `<div style="font-size:12px;color:var(--red-alert);margin-top:2px">Libre: ${libreStr} — comprar</div>`
        : `<div style="font-size:12px;color:var(--mid-gray);margin-top:2px">Libre: ${libreStr}</div>`;
      compHtml = `<span style="color:${color};font-weight:600">${icon}${compStr}</span>${warning}`;
    }

    const paqHtml = _stockPaqHtml(item);

    tbody.innerHTML += `<tr>
      <td style="font-weight:500">${esc(item.prod)}${item.color?`<div style="font-size:12px;font-weight:400;color:var(--mid-gray)">${esc(item.color)}</div>`:''}</td>
      <td style="font-size:12px;color:var(--mid-gray)">${esc(item.area)}</td>
      <td>${item.min}</td><td>${item.max}</td>
      <td><div style="display:flex;align-items:center;gap:4px">
        <button class="btn-icon" style="width:24px;height:24px;border:1px solid var(--light-gray);border-radius:5px;font-size:15px" onclick="adjustStock(${i},-1)">−</button>
        <input type="number" value="${item.actual%1===0?item.actual:item.actual.toFixed(1)}" onchange="setStock(${i},+this.value)"
          style="width:56px;text-align:center;font-weight:600;font-size:13px;border:1px solid var(--light-gray);border-radius:5px;padding:3px 4px;background:var(--warm-white);color:var(--charcoal)" title="Editar cantidad actual">
        <button class="btn-icon" style="width:24px;height:24px;border:1px solid var(--light-gray);border-radius:5px;font-size:15px" onclick="adjustStock(${i},1)">+</button>
      </div>${paqHtml}</td>
      <td>${pedidoHtml}</td>
      <td>${compHtml}</td>
      <td><div style="display:flex;align-items:center;gap:6px">
        <div class="stock-bar"><div class="stock-fill ${alClass}" style="width:${pct}%"></div></div>
        <span style="font-size:12px;color:var(--mid-gray)">${pct}%</span>
      </div></td>
      <td><span class="alerta-badge ${alClass}">${alLabel}</span></td>
    </tr>`;
  });

  document.getElementById('sk-ok').textContent=ok;
  document.getElementById('sk-at').textContent=at;
  document.getElementById('sk-co').textContent=co;
  const _kc2=document.getElementById('kpi-comprar'); if(_kc2) _kc2.textContent=co;
  const _ka2=document.getElementById('kpi-atencion'); if(_ka2) _ka2.textContent=at;

  const alertEl = document.getElementById('stock-alert-area');
  alertEl.innerHTML='';
  if(co>0) alertEl.innerHTML+=`<div class="alert-banner"><strong>${co} producto${co>1?'s':''} en stock crítico</strong> — comprar hoy.</div>`;
  if(at>0) alertEl.innerHTML+=`<div class="alert-banner amber"><strong>${at} producto${at>1?'s':''} en nivel bajo</strong> — considerar reponer esta semana.</div>`;

  // Banner específico de comprometidos que exceden el stock libre
  const comprometidosAlerta = D.stockData.filter((s,i)=>{
    if(comprometidos[i]<=0) return false;
    return (s.actual - comprometidos[i]) < s.min;
  });
  if(comprometidosAlerta.length>0){
    alertEl.innerHTML+=`<div class="alert-banner amber"><strong>${comprometidosAlerta.length} producto${comprometidosAlerta.length>1?'s':''} comprometido${comprometidosAlerta.length>1?'s':''} en eventos pendientes</strong>: ${comprometidosAlerta.map(s=>esc(s.prod)).join(', ')} — comprá antes del evento.</div>`;
  }
}

export function adjustStock(i,d){
  D.stockData[i].actual=Math.max(0,+(D.stockData[i].actual+d).toFixed(1));
  D.fbSave('stockData', D.stockData);
  renderStock();
  if(document.getElementById('page-stock-admin')?.classList.contains('active')) renderStockAdmin();
}
export function setStock(i,v){
  D.stockData[i].actual=Math.max(0,+(+v).toFixed(1));
  D.fbSave('stockData', D.stockData);
  renderStock();
  if(document.getElementById('page-stock-admin')?.classList.contains('active')) renderStockAdmin();
}
// Vaciar todo el stock (limpieza de martes/jueves antes del pedido nuevo).
// Pone las cantidades en 0 pero conserva el listado de productos y sus mínimos.
export async function vaciarStock(){
  if(!D.stockData.length){ showToast('El stock ya está vacío'); return; }
  if(!await confirmModal(`¿Vaciar TODO el stock de florería?\n\nPone en 0 la cantidad de los ${D.stockData.length} producto${D.stockData.length!==1?'s':''} (para la limpieza de martes/jueves). El listado y los mínimos se conservan; cuando llegue el pedido nuevo se vuelve a cargar.`)) return;
  D.stockData.forEach(s=>{ s.actual = 0; });
  D.fbSave('stockData', D.stockData);
  renderStock();
  if(document.getElementById('page-stock-admin')?.classList.contains('active')) renderStockAdmin();
  showToast('Stock vaciado — listo para el pedido nuevo');
}
export function setStockMin(i,v){
  D.stockData[i].min=Math.max(0,+(+v).toFixed(1));
  D.fbSave('stockData', D.stockData);
  renderStockAdmin();
}
export function setStockMax(i,v){
  D.stockData[i].max=Math.max(0,+(+v).toFixed(1));
  D.fbSave('stockData', D.stockData);
  renderStockAdmin();
}
export async function delStock(i){
  const item = D.stockData[i];
  if(!item) return;
  if(!await confirmModal('¿Eliminar "'+_stockNombre(item)+'" del stock?\nEsto lo quita de la lista por completo.')) return;
  D.stockData.splice(i,1);
  D.fbSave('stockData', D.stockData);
  renderStock();
  renderStockAdmin();
  showToast(''+item.prod+' eliminado del stock');
}
export function filterByStatus(s){ stockFilter=s; _saveStockPrefs(); renderStock(); }
export function filterStock(v){ stockSearch=v.toLowerCase(); _saveStockPrefs(); renderStock(); }

// Alta manual de un artículo en el stock de florería (compras / gerencia), para
// cargar algo que quedó por fuera del flujo automático de recepción de compras.
export function openAddStockModal(){
  document.getElementById('as-prod').value = '';
  document.getElementById('as-color').value = '';
  document.getElementById('as-area').value = '';
  document.getElementById('as-actual').value = '0';
  document.getElementById('as-min').value = '1';
  document.getElementById('as-max').value = '10';
  const areas = [...new Set([...D.stockData.map(s=>s.area).filter(Boolean), ...getAreaUsoZonas()])].sort((a,b)=>a.localeCompare(b,'es'));
  const dl = document.getElementById('as-area-list');
  if(dl) dl.innerHTML = areas.map(a=>`<option value="${esc(a)}">`).join('');
  document.getElementById('add-stock-modal').classList.add('open');
}

export function guardarStockManual(){
  const prod = document.getElementById('as-prod').value.trim();
  if(!prod){ showToast('Poné el nombre del producto','error'); return; }
  const color = document.getElementById('as-color').value.trim();
  const area = document.getElementById('as-area').value.trim() || 'Sin área';
  const dup = D.stockData.find(s => (s.prod||'').trim().toLowerCase()===prod.toLowerCase() && _stockColor(s)===color.toLowerCase() && (s.area||'').trim().toLowerCase()===area.toLowerCase());
  if(dup){ showToast('Ya existe ese producto en esa área'); return; }
  const actual = Math.max(0, parseFloat(document.getElementById('as-actual').value)||0);
  const min = Math.max(0, parseFloat(document.getElementById('as-min').value)||0);
  const max = Math.max(min, parseFloat(document.getElementById('as-max').value)||0);
  D.stockData.push(color ? { prod, color, area, min, max, actual } : { prod, area, min, max, actual });
  D.fbSave('stockData', D.stockData);
  D.closeModal('add-stock-modal');
  renderStockAdmin();
  renderStock();
  showToast(''+prod+' agregado al stock');
}

export function renderStockAdmin(){
  const tbody = document.getElementById('stock-admin-body');
  if(!tbody) return;
  tbody.innerHTML = '';
  const comprometidos = D.stockData.map(item => getStockComprometido(item));
  D.stockData.forEach((item,i)=>{
    const comp = comprometidos[i];
    const al = getAlerta(item, comp);
    const alMap = {ok:['OK','ok'],atencion:['ATENCIÓN','atencion'],comprar:['COMPRAR','comprar']};
    const [alLabel,alClass] = alMap[al];
    const pct = Math.min(100,Math.round((item.actual/(item.max||1))*100));

    const enPedido = getStockEnPedido(item);
    const pedidoHtml = enPedido > 0
      ? `<span style="color:var(--green-ok);font-weight:600">+${enPedido%1===0?enPedido:enPedido.toFixed(1)}</span><span style="font-size:12px;color:var(--sage);margin-left:3px">en camino</span>`
      : `<span style="color:var(--sage-light)">—</span>`;

    let compHtml;
    if(comp <= 0){
      compHtml = `<span style="color:var(--sage-light)">—</span>`;
    } else {
      const libre = +(item.actual - comp).toFixed(1);
      const needsBuy = libre < item.min;
      const color = needsBuy ? 'var(--red-alert)' : 'var(--amber)';
      const icon = needsBuy ? '' : '';
      const compStr = comp%1===0 ? comp : comp.toFixed(1);
      const libreStr = libre%1===0 ? libre : libre.toFixed(1);
      const sub = needsBuy
        ? `<div style="font-size:12px;color:var(--red-alert);margin-top:2px">Libre: ${libreStr} — comprar</div>`
        : `<div style="font-size:12px;color:var(--mid-gray);margin-top:2px">Libre: ${libreStr}</div>`;
      compHtml = `<span style="color:${color};font-weight:600">${icon}${compStr}</span>${sub}`;
    }

    tbody.innerHTML += `<tr>
      <td style="font-weight:500">${esc(item.prod)}${item.color?`<div style="font-size:12px;font-weight:400;color:var(--mid-gray)">${esc(item.color)}</div>`:''}</td>
      <td style="font-size:12px;color:var(--mid-gray)">${esc(item.area)}</td>
      <td><input type="number" step="0.5" min="0" value="${item.min}"
        style="width:58px;border:1px solid var(--light-gray);border-radius:6px;padding:4px 6px;font-size:12px;font-family:'DM Sans',sans-serif"
        onchange="setStockMin(${i},this.value)" title="Mínimo"></td>
      <td><input type="number" step="0.5" min="0" value="${item.max}"
        style="width:58px;border:1px solid var(--light-gray);border-radius:6px;padding:4px 6px;font-size:12px;font-family:'DM Sans',sans-serif"
        onchange="setStockMax(${i},this.value)" title="Máximo"></td>
      <td><div class="qty-ctrl">
        <button class="qty-btn" onclick="adjustStock(${i},-1)">−</button>
        <span class="qty-val">${item.actual}</span>
        <button class="qty-btn" onclick="adjustStock(${i},+1)">+</button>
      </div>${_stockPaqHtml(item)}</td>
      <td><input type="number" step="0.5" min="0" value="${item.actual}"
        style="width:60px;border:1px solid var(--light-gray);border-radius:6px;padding:4px 6px;font-size:12px;font-family:'DM Sans',sans-serif"
        onchange="setStock(${i},+this.value)" title="Ingresar cantidad directa"></td>
      <td>${pedidoHtml}</td>
      <td>${compHtml}</td>
      <td><div style="display:flex;align-items:center;gap:6px">
        <div class="stock-bar"><div class="stock-fill ${alClass}" style="width:${pct}%"></div></div>
        <span style="font-size:12px;color:var(--mid-gray)">${pct}%</span>
      </div></td>
      <td><span class="alerta-badge ${alClass}">${alLabel}</span></td>
      <td><button class="btn-icon" style="color:var(--red-alert)" onclick="delStock(${i})" title="Eliminar del stock">✕</button></td>
    </tr>`;
  });

  const alertEl = document.getElementById('stock-admin-alert');
  if(alertEl){
    const crits = D.stockData.filter((s,i)=>getAlerta(s,comprometidos[i])==='comprar');
    alertEl.innerHTML = crits.length
      ? `<div class="alert-banner"><strong>${crits.length} producto${crits.length>1?'s':''} en stock crítico:</strong> ${crits.map(s=>esc(s.prod)).join(', ')}.</div>`
      : '';
  }
}

// ════════════════════════════════════════
// FEATURE 6: STOCK MÍNIMO INTELIGENTE
// ════════════════════════════════════════
export function calcStockMinInteligente(){
  const DAYS = 90;
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-DAYS);
  const cutoffISO = cutoff.toISOString().slice(0,10);
  const consumo = {};
  const addConsumo = (prod, qty) => {
    if(!prod) return;
    const k = prod.toLowerCase();
    consumo[k] = (consumo[k]||0) + (+qty||0);
  };
  (ventasData||[]).filter(v=>v.fecha>=cutoffISO).forEach(v=>{
    addConsumo(v.prod||v.producto, v.qty||v.cantidad||1);
  });
  (D.eventosData||[]).filter(e=>e.fecha>=cutoffISO && e.arreglos?.length).forEach(ev=>{
    const impact = calcStockImpact(ev.arreglos||[]);
    Object.entries(impact).forEach(([prod,qty])=>addConsumo(prod,qty));
  });
  return D.stockData.map((s,i)=>{
    const k = s.prod.toLowerCase();
    const totalUsado = consumo[k]||0;
    const promDia = totalUsado/DAYS;
    const minSugerido = +(promDia*7).toFixed(1);
    const diff = +(minSugerido - (s.min||0)).toFixed(1);
    return { idx: i, prod: s.prod, promDia: +promDia.toFixed(3), minSugerido, minActual: s.min||0, diff };
  }).filter(r=>r.promDia>0||r.minActual>0);
}

export function renderStockSugerencias(){
  const wrap = document.getElementById('stock-sugerencias-wrap');
  if(!wrap) return;
  const rows = calcStockMinInteligente();
  if(!rows.length){ wrap.innerHTML = '<div style="color:var(--mid-gray);padding:12px">Sin datos suficientes para sugerencias.</div>'; return; }
  wrap.innerHTML = `<div class="table-wrapper"><table class="stock-table">
    <thead><tr><th>Insumo</th><th>Consumo prom/día</th><th>Mínimo Sugerido</th><th>Mínimo Actual</th><th>Diferencia</th><th>Acción</th></tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td>${esc(r.prod)}</td>
      <td>${r.promDia}</td>
      <td>${r.minSugerido}</td>
      <td>${r.minActual}</td>
      <td><span class="${r.diff>0?'card-value amber':r.diff<0?'card-value green':''}" style="font-size:13px">${r.diff>0?'+':''}${r.diff}</span></td>
      <td>${r.diff!==0?`<button class="btn-secondary" style="font-size:12px" onclick="aplicarSugerenciaStock(${r.idx},${r.minSugerido})">Actualizar</button>`:''}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

export function aplicarSugerenciaStock(stockIdx, nuevoMin){
  D.stockData[stockIdx].min = nuevoMin;
  D.fbSave('stockData', D.stockData);
  renderStockSugerencias();
  showToast('Mínimo actualizado');
}

// ════════════════════════════════════════════════════════════════════════════
// INVENTARIO POR UBICACIÓN (Operaciones)
// Lista simple de ítems (nombre + cantidad) agrupada por ubicación fija. Lo
// carga y edita todo el equipo. Se guarda en Firebase como inventarioData.
// ════════════════════════════════════════════════════════════════════════════
const INV_AREAS = ['Florería','Armario back','Jaula','Estacionamiento','Pozo'];
const INV_AREA_ICON = { 'Florería':'', 'Armario back':'', 'Jaula':'', 'Estacionamiento':'', 'Pozo':'' };
let inventarioData = []; // [{area, nombre, cantidad}]
window._setInventarioData = (arr) => {
  inventarioData = Array.isArray(arr) ? arr : (arr && typeof arr==='object' ? Object.values(arr) : []);
  if(document.getElementById('page-inventario')?.classList.contains('active') && !D.estaEditando('page-inventario')) renderInventario();
};
function _invSave(){ window._inventarioLastSave = Date.now(); D.fbSave('inventarioData', inventarioData); }

export function renderInventario(){
  const cont = document.getElementById('inventario-body');
  if(!cont) return;
  const q = (document.getElementById('inv-search')?.value || '').trim().toLowerCase();
  cont.innerHTML = INV_AREAS.map((area, ai)=>{
    const items = inventarioData.map((it,i)=>({it,i})).filter(o=>o.it.area===area);
    const vis = q ? items.filter(o=>(o.it.nombre||'').toLowerCase().includes(q)) : items;
    const icon = INV_AREA_ICON[area] || '';
    const rows = vis.length ? vis.map(({it,i})=>`
        <tr>
          <td><input class="form-input" value="${esc(it.nombre||'')}" placeholder="Nombre del ítem" onchange="updInv(${i},'nombre',this.value)" style="min-width:180px"></td>
          <td style="white-space:nowrap;text-align:center">
            <button class="btn-icon" onclick="invAdjust(${i},-1)" title="Restar" style="font-weight:700;font-size:16px">−</button>
            <input class="form-input" type="number" min="0" value="${it.cantidad!=null?it.cantidad:0}" onchange="updInv(${i},'cantidad',this.value)" style="width:66px;text-align:center;display:inline-block">
            <button class="btn-icon" onclick="invAdjust(${i},1)" title="Sumar" style="font-weight:700;font-size:16px">+</button>
          </td>
          <td style="text-align:right"><button class="btn-icon" style="color:var(--red-alert)" onclick="delInvItem(${i})" title="Eliminar">✕</button></td>
        </tr>`).join('')
      : `<tr><td colspan="3" style="text-align:center;color:var(--mid-gray);font-size:12px;padding:14px">${q?'Sin resultados en esta ubicación':'Sin ítems todavía — tocá "＋ Agregar ítem"'}</td></tr>`;
    return `
      <div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:12px;padding:14px 16px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--charcoal)">${icon} ${esc(area)} <span style="font-size:12px;font-weight:400;color:var(--mid-gray)">· ${items.length} ítem${items.length!==1?'s':''}</span></div>
          <button class="btn-secondary" onclick="addInvItem(${ai})" style="font-size:12px">＋ Agregar ítem</button>
        </div>
        <div class="table-wrapper">
          <table class="ventas-table" style="min-width:340px">
            <thead><tr><th>Ítem</th><th style="text-align:center;width:150px">Cantidad</th><th style="width:40px"></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }).join('');
}

export function addInvItem(ai){
  const area = INV_AREAS[ai];
  if(!area) return;
  const search = document.getElementById('inv-search');
  if(search) search.value = ''; // que el ítem nuevo (vacío) sea visible
  inventarioData.push({ area, nombre:'', cantidad:0 });
  _invSave();
  renderInventario();
  // Enfocar el nombre recién agregado
  const inputs = document.getElementById('inventario-body')?.querySelectorAll('input[placeholder="Nombre del ítem"]');
  if(inputs && inputs.length) inputs[inputs.length-1].focus();
}

export function updInv(i, field, val){
  if(!inventarioData[i]) return;
  if(field==='cantidad') val = Math.max(0, parseFloat(val)||0);
  inventarioData[i][field] = val;
  _invSave();
}

export function invAdjust(i, d){
  if(!inventarioData[i]) return;
  inventarioData[i].cantidad = Math.max(0, (parseFloat(inventarioData[i].cantidad)||0) + d);
  _invSave();
  renderInventario();
}

export async function delInvItem(i){
  const it = inventarioData[i];
  if(!it) return;
  if(it.nombre && !(await confirmModal(`¿Eliminar "${it.nombre}" del inventario?`))) return;
  inventarioData.splice(i,1);
  _invSave();
  renderInventario();
}