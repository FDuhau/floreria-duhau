// ── COTIZADOR ───────────────────────────────────────────────────────────────
// Cotizador de flores y floreros (gerencia y floristas), lista de precios,
// cotización por evento y costo de composiciones.
// Separado de app.js. Lo que necesita de app.js llega por configurarCotizador():
//   _fmtCant, arregloEmoji, fbSave, recetasData, stockData

import { esc, parseMoney } from './utils.js';
import { listaPreciosData } from './lista-precios.js';
import { confirmModal, promptModal } from './modales.js';
import { showToast } from './tema-toast.js';
import { getVarasPorPaq } from './compras.js';
import { ingVaras } from './dinero.js';

import { badgeCategoriaVara, usarConfigCategoriaVara } from './categoria-vara.js';

let D = {};
export function configurarCotizador(deps){ D = deps; }

// ════════════════════════════════════════
// COTIZADOR
// ════════════════════════════════════════
const COT_FLORES_LIST = [
  'Achilea','Aganpanto','Amaranto','Alelíes','Alstroemerias','Anemonas','Aster','Azucena',
  'Biznaga','Botoncito','Calas','Calitas mini','Cardos azules','Carqueja - Fede',
  'Caspia blanca','Celosia','Cera','Clavel rojo','Colsa','Conejitos','Copetes',
  'Cresta de gallo','Crisantemo fideo','Crisantemo Otome','Delfinium','Dianthus',
  'Eupatorium','Espuela de caballero','Flor azul','Fresias','Gerberas','Girasol',
  'Gloriosa','Gladiolos','Gonfrena','Green balls','Gypsophila Nacional','Gypsophila Importada',
  'Hipericum','Hortensias','Iris Violeta','Jazmines','Junquillo','Lilium Perfumado','Liliums',
  'Limonium','Lino','Lisianthus','Margaritas','Mini Margaritas','Marimonias','Melilotus',
  'Mini Gerberas','Moa','Molucela','Narcisos','Nardo','Naviza','Ojito de Perdiz','Organza',
  'Ornithogalum','Paico','Penacho','Peonias','Proteas','Repollo Comun','Repollo Especial',
  'Rosas Importadas','Rosas Nacionales','Rositas Spray','Sakura','San Vicentes','Scabiosa',
  'Statice','Solidago','Sorgo','Strelitzia','Mini Statice','Tulipanes','Trachelium',
  'Vidensauria','Zinnia'
];
const COT_FOLLAJE_LIST = [
  'Aguaribay','Abelia','Azarero Nana','Azarero Disciplinado','Aspidistra','Calistemo',
  'Buxus','Eucaliptus hoja alargada','Eucaliptus mini','Flor de humo','Formio','Hiedra',
  'Cycas','Fotiña','Kalaguala','Laurentino','Leptospermu','Laurel','Roble','Helecho plumoso',
  'Magnolia','Nigricans','Olea variegada','Ondulatum','Claveles','Monsteras','Eucaliptus',
  'Centaura (flor azul)','Pitosporum Maggi','Hibiscus','Ligustro (frutos)','Craspedia',
  'Suculentas','Orquideas Phaleanopsis','Orquideas Cymbidium','Azaleas','liriope variegado',
  'Heliconias','Cola de zorro'
];
const COT_ALL = [
  ...COT_FLORES_LIST.map(n=>({n, c:'flores'})),
  ...COT_FOLLAJE_LIST.map(n=>({n, c:'follaje'}))
];

export let cotizadorPrecios = {};
export let cotizadorConfig  = {margen: 30};
window._setCotizadorPrecios = v => { cotizadorPrecios = v; };
window._setCotizadorConfig  = v => { cotizadorConfig = v; };
usarConfigCategoriaVara(() => cotizadorConfig, prod => cotizadorPrecioVara(prod));
let cotizadorCarrito = [];
let cotCarritoOps    = [];
export let cotCurTab = 'cotizar';
// app.js expone window.cotCurTab; si alguien lo cambia desde afuera pasa por acá.
export function setCotCurTab(v){ cotCurTab = v; }

// ── Cotizador Ops (floristas) ─────────────────────────────────────────────────
export function renderCotizadorOps(){
  const search = (document.getElementById('cot-ops-search')?.value||'').toLowerCase();
  // Solo mostrar lo que está en stock (actual > 0)
  const enStock = D.stockData
    .map((s,i) => ({ n: s.prod, actual: s.actual, area: s.area, _si: i }))
    .filter(s => s.actual > 0);
  const list = search ? enStock.filter(f=>f.n.toLowerCase().includes(search)) : enStock;
  const grid   = document.getElementById('cot-ops-grid');
  if(!grid) return;

  const margen = cotizadorConfig?.margen ?? 30;

  if(enStock.length === 0){
    grid.innerHTML = '<div style="color:var(--mid-gray);font-size:13px;padding:16px 0;text-align:center">No hay ítems con stock disponible. Los productos aparecen acá automáticamente al confirmar la recepción de pedidos.</div>';
    return;
  }
  if(!list.length){
    grid.innerHTML = '<div style="color:var(--mid-gray);font-size:13px;padding:8px 0">Sin resultados para "'+esc(search)+'"</div>';
    return;
  }
  grid.innerHTML = list.map(f => {
    const costo      = cotizadorPrecios[f.n] || 0;
    const pFinal     = Math.round(costo*(1+margen/100));
    const precioTxt  = pFinal > 0
      ? `<span style="color:var(--sage-dark);font-weight:600">$${pFinal.toLocaleString('es-AR')}/vara</span>`
      : '<em style="color:var(--mid-gray);font-size:12px">sin precio</em>';
    return `<div style="background:var(--cream);border-radius:8px;padding:9px 12px;display:flex;align-items:center;gap:8px">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:var(--charcoal);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.n)}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
          <span style="font-size:12px;background:var(--ok-soft);color:var(--green-ok);padding:1px 6px;border-radius:8px;font-weight:600">${f.actual} uds</span>
          ${precioTxt}
          ${badgeCategoriaVara(costo)}
        </div>
      </div>
      <input type="number" id="cotops_${f._si}" value="1" min="1"
        style="width:48px;padding:4px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:center;font-family:inherit">
      <button onclick="cotAgregarOpsStock(${f._si})"
        style="background:var(--green-ok);color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">
        + Agregar
      </button>
    </div>`;
  }).join('');
  // Composiciones (bochita, cuenco, etc.)
  renderComposicionesCot();
  // Productos de Lista de Precios (floreros, etc.)
  renderLPenCotizador();
}

export function renderComposicionesCot(){
  const wrap = document.getElementById('cot-ops-comp-wrap');
  if(!wrap) return;
  if(!D.recetasData.length){ wrap.innerHTML = ''; return; }
  const margen = cotizadorConfig?.margen ?? 30;
  const search = (document.getElementById('cot-ops-search')?.value||'').toLowerCase();
  const comps = search ? D.recetasData.filter(r => r.nombre.toLowerCase().includes(search)) : D.recetasData;
  if(!comps.length){ wrap.innerHTML = ''; return; }

  wrap.innerHTML = `<div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:8px;font-weight:500">Composiciones</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px">${comps.map(r => {
      const ri = D.recetasData.indexOf(r);
      const costoBase = calcCostoComposicion(r);
      const pFinal = Math.round(costoBase*(1+margen/100));
      const emoji = D.arregloEmoji(r.nombre);
      return `<div style="background:var(--cream);border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--charcoal)">${emoji} ${esc(r.nombre)}</div>
          <div style="font-size:12px;color:var(--mid-gray);margin-top:2px">${r.ings.map(g=>g.qty+' '+g.prod).join(', ')}</div>
          <div style="font-size:12px;color:var(--sage-dark);font-weight:600;margin-top:3px">${pFinal > 0 ? '$'+pFinal.toLocaleString('es-AR') : 'sin precio'}</div>
        </div>
        <input type="number" id="cotops_comp_${ri}" value="1" min="1"
          style="width:48px;padding:4px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:center;font-family:inherit">
        <button onclick="cotAgregarComposicionOps(${ri})"
          style="background:var(--green-ok);color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">
          + Agregar
        </button>
      </div>`;
    }).join('')}</div>`;
}

export function cotAgregarComposicionOps(ri){
  const r = D.recetasData[ri];
  if(!r) return;
  const qty = Math.max(1, +document.getElementById('cotops_comp_'+ri)?.value||1);
  const margen = cotizadorConfig?.margen ?? 30;
  const costoBase = calcCostoComposicion(r);
  const precio = Math.round(costoBase*(1+margen/100));
  const emoji = D.arregloEmoji(r.nombre);
  const nombre = emoji + ' ' + r.nombre;
  const ex = cotCarritoOps.find(c=>c.nombre===nombre);
  if(ex){ ex.qty += qty; }
  else { cotCarritoOps.push({nombre, precio, qty}); }
  renderCarritoOps();
  const el = document.getElementById('cotops_comp_'+ri);
  if(el) el.value = 1;
}

export function cotAgregarOpsStock(stockIdx){
  const s      = D.stockData[stockIdx];
  if(!s) return;
  const qty    = Math.max(1, +document.getElementById('cotops_'+stockIdx)?.value||1);
  const costo  = cotizadorPrecios[s.prod] || 0;
  const margen = cotizadorConfig?.margen ?? 30;
  const precio = Math.round(costo*(1+margen/100));
  const ex     = cotCarritoOps.find(c=>c.nombre===s.prod);
  if(ex){ ex.qty += qty; }
  else   { cotCarritoOps.push({nombre:s.prod, precio, qty}); }
  renderCarritoOps();
  const el = document.getElementById('cotops_'+stockIdx);
  if(el) el.value = 1;
}

// ── FLOREROS DE LISTA DE PRECIOS en cotizador ───────────────────────────────
export function renderLPenCotizador(){
  const wrap = document.getElementById('cot-ops-lp-wrap');
  if(!wrap) return;
  // Solo mostrar categorías que contengan "florero" en el nombre
  const cats = listaPreciosData.filter(c => 
    (c.items||[]).length > 0 && c.cat.toLowerCase().includes('florero')
  );
  if(!cats.length){
    wrap.innerHTML = '';
    return;
  }
  wrap.innerHTML = cats.map((cat) => {
    const realCi = listaPreciosData.indexOf(cat);
    const items = cat.items.map((it, ii) => {
      const precio = parseMoney(it.precio);
      return `<div style="background:var(--cream);border-radius:8px;padding:9px 12px;display:flex;align-items:center;gap:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--charcoal);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(it.nombre)}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
            ${it.desc ? `<span style="font-size:12px;color:var(--mid-gray)">${esc(it.desc)}</span>` : ''}
            <span style="font-size:12px;color:var(--sage-dark);font-weight:600">${precio > 0 ? '$'+precio.toLocaleString('es-AR') : ''}</span>
          </div>
        </div>
        <input type="number" id="cotops_lp_${realCi}_${ii}" value="1" min="1"
          style="width:48px;padding:4px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:center;font-family:inherit">
        <button onclick="cotAgregarLP(${realCi},${ii})"
          style="background:var(--green-ok);color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">
          + Agregar
        </button>
      </div>`;
    }).join('');
    return `<div style="margin-bottom:16px">
      <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:8px;font-weight:500">${cat.emoji||''} ${esc(cat.cat)}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px">${items}</div>
    </div>`;
  }).join('');
}

export function cotAgregarLP(ci, ii){
  const cat = listaPreciosData[ci];
  const it = cat?.items?.[ii];
  if(!it) return;
  const qty = Math.max(1, +document.getElementById('cotops_lp_'+ci+'_'+ii)?.value||1);
  const precio = parseMoney(it.precio);
  const nombre = (cat.emoji||'') + ' ' + it.nombre;
  const ex = cotCarritoOps.find(c=>c.nombre===nombre);
  if(ex){ ex.qty += qty; }
  else { cotCarritoOps.push({nombre, precio, qty}); }
  renderCarritoOps();
  const el = document.getElementById('cotops_lp_'+ci+'_'+ii);
  if(el) el.value = 1;
}

export function cotRemoveOps(idx){
  cotCarritoOps.splice(idx,1);
  renderCarritoOps();
}

export function cotUpdateQtyOps(idx, val){
  cotCarritoOps[idx].qty = Math.max(1,+val||1);
  renderCarritoOps();
}

export function renderCarritoOps(){
  const listEl     = document.getElementById('cot-ops-list');
  const emptyEl    = document.getElementById('cot-ops-empty');
  const totalBlock = document.getElementById('cot-ops-total-block');
  if(!listEl) return;

  if(!cotCarritoOps.length){
    listEl.innerHTML = '';
    if(emptyEl)    emptyEl.style.display = '';
    if(totalBlock) totalBlock.style.display = 'none';
    return;
  }
  if(emptyEl)    emptyEl.style.display = 'none';
  if(totalBlock) totalBlock.style.display = '';

  const total = cotCarritoOps.reduce((s,c)=>s+(c.precio*c.qty),0);
  listEl.innerHTML = cotCarritoOps.map((c,i)=>{
    const sub = c.precio*c.qty;
    return `<div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--light-gray)">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:var(--charcoal)">${esc(c.nombre)}</div>
        <div style="font-size:12px;color:var(--mid-gray)">$${c.precio.toLocaleString('es-AR')}/vara</div>
      </div>
      <input type="number" min="1" value="${c.qty}"
        style="width:52px;padding:3px 6px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:center;font-family:inherit"
        oninput="cotUpdateQtyOps(${i},this.value)">
      <span style="min-width:80px;text-align:right;font-size:13px;font-weight:600;color:var(--charcoal)">$${sub.toLocaleString('es-AR')}</span>
      <button onclick="cotRemoveOps(${i})"
        style="background:none;border:none;color:var(--mid-gray);cursor:pointer;font-size:18px;padding:0 4px;line-height:1">×</button>
    </div>`;
  }).join('');
  document.getElementById('cot-ops-total').textContent = '$'+total.toLocaleString('es-AR');
}

export async function limpiarCarritoOps(){
  if(!cotCarritoOps.length) return;
  if(!await confirmModal('¿Limpiar la selección?')) return;
  cotCarritoOps = [];
  renderCarritoOps();
}

export function copiarCotizacionOps(){
  if(!cotCarritoOps.length) return;
  const total  = cotCarritoOps.reduce((s,c)=>s+(c.precio*c.qty),0);
  const lineas = cotCarritoOps.map(c=>`• ${c.nombre} × ${c.qty}  →  $${(c.precio*c.qty).toLocaleString('es-AR')}`).join('\n');
  const texto  = `Cotización Florería Duhau\n${'─'.repeat(32)}\n${lineas}\n${'─'.repeat(32)}\nTotal: $${total.toLocaleString('es-AR')}`;
  navigator.clipboard.writeText(texto).then(()=>showToast('Cotización copiada al portapapeles'));
}

export function cotGuardarMargen(val){
  const margen = Math.max(0, +val||0);
  cotizadorConfig = {...(cotizadorConfig||{}), margen};
  D.fbSave('cotizadorConfig', cotizadorConfig);
  showToast('Margen actualizado');
}

export function setCotTab(tab){
  cotCurTab = tab;
  ['cotizar','eventos','precios'].forEach(t => {
    const btn   = document.getElementById('cot-tab-btn-'+t);
    const panel = document.getElementById('cot-panel-'+t);
    const on = t === tab;
    if(btn){
      btn.style.color = on ? 'var(--green-ok)' : 'var(--mid-gray)';
      btn.style.borderBottom = on ? '2px solid var(--green-ok)' : 'none';
      btn.style.marginBottom = on ? '-2px' : '0';
    }
    if(panel) panel.style.display = on ? '' : 'none';
  });
  if(tab === 'cotizar') renderCotizador();
  else if(tab === 'eventos') renderEvTipos();
  else renderPreciosList();
}

const COT_MOBILE_MAX = 12;
let cotVerTodo = false;
export function renderCotizador(){
  const search = (document.getElementById('cot-search')?.value||'').toLowerCase();
  const list = search ? COT_ALL.filter(f=>f.n.toLowerCase().includes(search)) : COT_ALL;
  const grid = document.getElementById('cot-flores-grid');
  if(!grid) return;
  if(!list.length){
    grid.innerHTML = '<div style="color:var(--mid-gray);font-size:13px;padding:8px 0">Sin resultados</div>';
    return;
  }
  // En el celular, sin búsqueda, se muestran las primeras flores y un botón
  // para ver el resto: así el presupuesto (que va debajo) queda a mano.
  const corto = !search && !cotVerTodo && window.innerWidth <= 768 && list.length > COT_MOBILE_MAX;
  const visibles = corto ? list.slice(0, COT_MOBILE_MAX) : list;
  grid.innerHTML = visibles.map(f => {
    const idx = COT_ALL.findIndex(x=>x.n===f.n);
    const precio = cotizadorPrecios[f.n] || 0;
    const badgeBg    = f.c==='flores' ? '#EBF5E8' : '#EEF0F8';
    const badgeColor = f.c==='flores' ? 'var(--green-ok)' : '#4A5FA6';
    const precioTxt  = precio > 0
      ? `$${precio.toLocaleString('es-AR')}/vara`
      : '<em style="color:var(--mid-gray);font-size:12px">sin precio</em>';
    return `<div style="background:var(--cream);border-radius:8px;padding:9px 12px;display:flex;align-items:center;gap:8px">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:var(--charcoal);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.n)}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;flex-wrap:wrap">
          <span style="font-size:12px;background:${badgeBg};color:${badgeColor};padding:1px 6px;border-radius:8px;font-weight:600;white-space:nowrap">${f.c}</span>
          <span style="font-size:12px">${precioTxt}</span>
          ${badgeCategoriaVara(precio)}
        </div>
      </div>
      <input type="number" id="cot_${idx}" value="1" min="1"
        style="width:48px;padding:4px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:center;font-family:inherit">
      <button onclick="cotAgregar(${idx})"
        style="background:var(--green-ok);color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">
        + Agregar
      </button>
    </div>`;
  }).join('') + (corto
    ? `<button class="btn-secondary" style="width:100%;margin-top:4px" onclick="cotVerTodas()">Ver las ${list.length} flores y follajes · o buscá arriba</button>` : '');
}
export function cotVerTodas(){ cotVerTodo = true; renderCotizador(); }

export function cotAgregar(cotIdx){
  const f = COT_ALL[cotIdx];
  const qty = Math.max(1, +document.getElementById('cot_'+cotIdx)?.value||1);
  const precio = cotizadorPrecios[f.n] || 0;
  const existing = cotizadorCarrito.find(c=>c.nombre===f.n);
  if(existing){ existing.qty += qty; }
  else { cotizadorCarrito.push({nombre:f.n, precio, qty}); }
  renderCarrito();
  const el = document.getElementById('cot_'+cotIdx);
  if(el) el.value = 1;
}

export function cotRemove(idx){
  cotizadorCarrito.splice(idx,1);
  renderCarrito();
}

export function cotUpdateQty(idx, val){
  cotizadorCarrito[idx].qty = Math.max(1,+val||1);
  renderCarrito();
}

export function renderCarrito(){
  const listEl      = document.getElementById('cot-carrito-list');
  const emptyEl     = document.getElementById('cot-carrito-empty');
  const totalBlock  = document.getElementById('cot-total-block');
  if(!listEl) return;

  if(!cotizadorCarrito.length){
    listEl.innerHTML = '';
    if(emptyEl) emptyEl.style.display = '';
    if(totalBlock) totalBlock.style.display = 'none';
    return;
  }
  if(emptyEl) emptyEl.style.display = 'none';
  if(totalBlock) totalBlock.style.display = '';

  const totalCosto = cotizadorCarrito.reduce((s,c)=>s+(c.precio*c.qty),0);
  const margen = +document.getElementById('cot-margen')?.value||0;
  const precioFinal = Math.round(totalCosto*(1+margen/100));

  listEl.innerHTML = cotizadorCarrito.map((c,i)=>{
    const sub = c.precio*c.qty;
    return `<div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--light-gray)">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:var(--charcoal)">${esc(c.nombre)}</div>
        <div style="font-size:12px;color:var(--mid-gray)">$${c.precio.toLocaleString('es-AR')}/vara</div>
      </div>
      <input type="number" min="1" value="${c.qty}"
        style="width:52px;padding:3px 6px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:center;font-family:inherit"
        oninput="cotUpdateQty(${i},this.value)">
      <span style="min-width:80px;text-align:right;font-size:13px;font-weight:600;color:var(--charcoal)">$${sub.toLocaleString('es-AR')}</span>
      <button onclick="cotRemove(${i})"
        style="background:none;border:none;color:var(--mid-gray);cursor:pointer;font-size:18px;padding:0 4px;line-height:1">×</button>
    </div>`;
  }).join('');

  document.getElementById('cot-total').textContent         = '$'+totalCosto.toLocaleString('es-AR');
  document.getElementById('cot-precio-final').textContent  = '$'+precioFinal.toLocaleString('es-AR');
}

export async function limpiarCarrito(){
  if(!cotizadorCarrito.length) return;
  if(!await confirmModal('¿Limpiar el carrito?')) return;
  cotizadorCarrito = [];
  renderCarrito();
}

export function copiarCotizacion(){
  if(!cotizadorCarrito.length) return;
  const margen = +document.getElementById('cot-margen')?.value||0;
  const totalCosto  = cotizadorCarrito.reduce((s,c)=>s+(c.precio*c.qty),0);
  const precioFinal = Math.round(totalCosto*(1+margen/100));
  const lineas = cotizadorCarrito.map(c=>`• ${c.nombre} × ${c.qty}  →  $${(c.precio*c.qty).toLocaleString('es-AR')}`).join('\n');
  const texto = `Cotización Florería Duhau\n${'─'.repeat(32)}\n${lineas}\n${'─'.repeat(32)}\nCosto: $${totalCosto.toLocaleString('es-AR')}\nPrecio final: $${precioFinal.toLocaleString('es-AR')} (margen ${margen}%)`;
  navigator.clipboard.writeText(texto).then(()=>showToast('Cotización copiada al portapapeles'));
}

// ══════════════════════════════════════════════════════════════════════════════
// COTIZACIÓN POR EVENTO (gerencia)
// ══════════════════════════════════════════════════════════════════════════════
export let eventoPricing = { tipos: [] };
window._setEventoPricing = v => { eventoPricing = v; };
let evCarrito = [];

export function renderEvTipos(){
  const list = document.getElementById('ev-tipos-list');
  if(!list) return;
  if(!eventoPricing.tipos.length){
    list.innerHTML = '<div style="color:var(--mid-gray);font-size:12px;padding:6px 0">No hay tipos de evento. Agregá el primero (ej. Cocktail, Social, Corporativo).</div>';
  } else {
    list.innerHTML = eventoPricing.tipos.map((t,i) => {
      const reglas = t.reglas || [];
      const reglasHtml = reglas.map((r,ri) => `<div style="display:flex;align-items:center;gap:6px;padding:4px 0">
        <span style="font-size:12px;flex:1">${D.arregloEmoji(r.arreglo)} <strong>${esc(r.arreglo)}</strong> — 1 cada <strong>${r.cadaPax}</strong> personas</span>
        <button class="btn-icon" style="color:var(--red-alert);font-size:12px" onclick="delReglaTipo(${i},${ri})">✕</button>
      </div>`).join('');
      return `<div style="border:1px solid var(--light-gray);border-radius:8px;padding:12px;margin-bottom:8px;background:var(--warm-white)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <input class="form-input" value="${esc(t.nombre)}" onchange="updTipoEvento(${i},'nombre',this.value)" style="flex:1;padding:5px 8px;font-size:13px;font-weight:600" placeholder="Nombre del tipo">
          <div style="display:flex;align-items:center;gap:4px">
            <span style="font-size:12px;color:var(--mid-gray)">Margen:</span>
            <input class="form-input" type="number" value="${t.margen}" min="0" max="500" onchange="updTipoEvento(${i},'margen',+this.value)" style="width:60px;padding:5px;font-size:12px;text-align:center">
            <span style="font-size:12px;color:var(--mid-gray)">%</span>
          </div>
          <button class="btn-icon" style="color:var(--red-alert)" onclick="delTipoEvento(${i})">✕</button>
        </div>
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:4px">Arreglos por evento:</div>
        ${reglasHtml || '<div style="font-size:12px;color:var(--mid-gray);padding:4px 0">Sin arreglos configurados</div>'}
        <button class="btn-secondary" onclick="addReglaTipo(${i})" style="font-size:12px;padding:3px 10px;margin-top:4px">+ Agregar arreglo</button>
      </div>`;
    }).join('');
  }
  // Poblar select del cotizador de eventos (gerencia)
  const sel = document.getElementById('ev-cot-tipo');
  if(sel){
    const cur = sel.value;
    sel.innerHTML = '<option value="">— Seleccionar tipo de evento —</option>' +
      eventoPricing.tipos.map((t,i) => `<option value="${i}">${esc(t.nombre)} (${t.margen}%)</option>`).join('');
    sel.value = cur;
  }
  // Poblar select del cotizador Hyatt
  const selH = document.getElementById('ceh-tipo');
  if(selH){
    const cur = selH.value;
    selH.innerHTML = '<option value="">— Seleccionar —</option>' +
      eventoPricing.tipos.map((t,i) => `<option value="${i}">${esc(t.nombre)}</option>`).join('');
    selH.value = cur;
  }
}

export async function addReglaTipo(tipoIdx){
  const nombres = D.recetasData.map(r=>r.nombre);
  const arreglo = await promptModal('Nombre del arreglo (ej. Bochita, Pecera, Cuenco):\n\nDisponibles: ' + nombres.join(', '), { title: 'Agregar regla' });
  if(!arreglo || !arreglo.trim()) return;
  const cadaPax = await promptModal('1 ' + arreglo.trim() + ' cada ¿cuántas personas?', { title: 'Agregar regla', default: '10' });
  if(!cadaPax || +cadaPax <= 0) return;
  if(!eventoPricing.tipos[tipoIdx].reglas) eventoPricing.tipos[tipoIdx].reglas = [];
  eventoPricing.tipos[tipoIdx].reglas.push({ arreglo: arreglo.trim(), cadaPax: +cadaPax });
  D.fbSave('eventoPricing', eventoPricing);
  renderEvTipos();
}

export async function delReglaTipo(tipoIdx, reglaIdx){
  if(!await confirmModal('¿Eliminar esta regla?')) return;
  eventoPricing.tipos[tipoIdx].reglas.splice(reglaIdx, 1);
  D.fbSave('eventoPricing', eventoPricing);
  renderEvTipos();
}

export async function addTipoEvento(){
  const nombre = await promptModal('Nombre del tipo de evento (ej. Social, Cocktail, Corporativo):', { title: 'Nuevo tipo de evento' });
  if(!nombre || !nombre.trim()) return;
  const margen = await promptModal('Margen de ganancia para este tipo (%):', { title: 'Nuevo tipo de evento', default: '40' });
  eventoPricing.tipos.push({ nombre: nombre.trim(), margen: parseInt(margen)||40 });
  D.fbSave('eventoPricing', eventoPricing);
  renderEvTipos();
  showToast('Tipo de evento agregado');
}

export function updTipoEvento(i, field, val){
  eventoPricing.tipos[i][field] = val;
  D.fbSave('eventoPricing', eventoPricing);
  renderEvTipos();
  renderCotEventos();
}

export async function delTipoEvento(i){
  if(!await confirmModal('¿Eliminar tipo "'+eventoPricing.tipos[i].nombre+'"?')) return;
  eventoPricing.tipos.splice(i,1);
  D.fbSave('eventoPricing', eventoPricing);
  renderEvTipos();
}

// Resuelve el costo por vara de un ingrediente de una composición.
// Cuando el ingrediente lista varias opciones separadas por "/" (ej.
// "Conejito / Nardos / Alhelí", porque se usa lo que haya en stock), la clave
// combinada no existe en cotizadorPrecios y el costo daba "sin dato". Acá se
// prueba cada opción y se toma la MÁS CARA con precio cargado, para no
// subvaluar la cotización. Devuelve {pu, fuente, opciones}.
export function resolveCotizadorPrecio(prodLabel){
  const label = (prodLabel||'').trim();
  if(!label) return { pu:0, fuente:'', opciones:[] };
  const directo = +cotizadorPrecios[label] || 0;
  if(directo > 0) return { pu:directo, fuente:label, opciones:[label] };
  if(label.includes('/')){
    const opciones = label.split('/').map(s=>s.trim()).filter(Boolean);
    let mejor = null;
    opciones.forEach(op=>{
      const p = +cotizadorPrecios[op] || 0;
      if(p > 0 && (!mejor || p > mejor.pu)) mejor = { pu:p, fuente:op };
    });
    return mejor ? { pu:mejor.pu, fuente:mejor.fuente, opciones } : { pu:0, fuente:'', opciones };
  }
  return { pu:0, fuente:'', opciones:[label] };
}
// Costo por vara (número) de un ingrediente, resolviendo opciones "A / B / C".
export function cotizadorPrecioVara(prodLabel){ return resolveCotizadorPrecio(prodLabel).pu; }

// Varas por paquete de un producto, resolviendo opciones "A / B" (toma la de
// la opción que tenga dato cargado en Compras). Devuelve 0 si no hay dato.
export function _varasPorPaqResuelto(prodLabel){
  const label = (prodLabel||'').trim();
  if(!label) return 0;
  const directo = getVarasPorPaq(label);
  if(directo) return directo;
  if(label.includes('/')){
    for(const op of label.split('/').map(s=>s.trim())){
      const v = getVarasPorPaq(op);
      if(v) return v;
    }
  }
  return 0;
}
// Cantidad de un ingrediente EXPRESADA EN VARAS. Si la unidad es "paq", se
// multiplica por las varas por paquete (de Compras); si no, ya está en varas.
export function _ingVaras(ing){
  return ingVaras(ing, ing && ing.unidad === 'paq' ? _varasPorPaqResuelto(ing.prod) : 0);
}

export function calcCostoComposicion(r){
  return r.ings.reduce((s, ing) => s + cotizadorPrecioVara(ing.prod) * _ingVaras(ing), 0);
}

export function renderCotEventos(){
  const tipoIdx = document.getElementById('ev-cot-tipo')?.value;
  const contenido = document.getElementById('ev-cot-contenido');
  if(!contenido) return;
  if(tipoIdx === '' || tipoIdx == null){
    contenido.style.display = 'none';
    return;
  }
  contenido.style.display = '';
  const tipo = eventoPricing.tipos[+tipoIdx];
  if(!tipo) return;
  const margen = tipo.margen || 0;
  const search = (document.getElementById('ev-cot-search')?.value||'').toLowerCase();

  const grid = document.getElementById('ev-cot-grid');
  if(!grid) return;

  let html = '';

  // ── COMPOSICIONES ──
  const comps = D.recetasData.filter(r => !search || r.nombre.toLowerCase().includes(search) || r.ings.some(g=>g.prod.toLowerCase().includes(search)));
  if(comps.length){
    html += `<div style="grid-column:1/-1;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:500;margin-bottom:-4px">Composiciones</div>`;
    html += comps.map(r => {
      const ri = D.recetasData.indexOf(r);
      const costoBase = calcCostoComposicion(r);
      const pFinal = Math.round(costoBase*(1+margen/100));
      const emoji = D.arregloEmoji(r.nombre);
      const ingsList = r.ings.map(g => `${D._fmtCant(g.qty)} ${g.prod}`).join(', ');
      const sinCosto = r.ings.some(g => !cotizadorPrecioVara(g.prod));
      return `<div style="background:var(--cream);border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--charcoal)">${emoji} ${esc(r.nombre)}</div>
          <div style="font-size:12px;color:var(--mid-gray);margin-top:2px;line-height:1.4">${esc(ingsList)}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
            <span style="font-size:12px;color:var(--mid-gray)">costo: $${costoBase.toLocaleString('es-AR')}</span>
            <span style="font-size:12px;color:var(--sage-dark);font-weight:600">→ $${pFinal.toLocaleString('es-AR')}</span>
            ${sinCosto ? '<span style="font-size:12px;color:var(--amber)">falta precio</span>' : ''}
          </div>
        </div>
        <input type="number" id="evcot_comp_${ri}" value="1" min="1"
          style="width:48px;padding:4px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:center;font-family:inherit">
        <button onclick="evAgregarComposicion(${ri})"
          style="background:var(--green-ok);color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">
          + Agregar
        </button>
      </div>`;
    }).join('');
  }

  // ── FLORES SUELTAS (para upgrades) ──
  const enStock = D.stockData
    .map((s,i) => ({ n: s.prod, actual: s.actual, _si: i }))
    .filter(s => s.actual > 0);
  const flores = search ? enStock.filter(f=>f.n.toLowerCase().includes(search)) : enStock;
  if(flores.length){
    html += `<div style="grid-column:1/-1;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:500;margin-top:12px;margin-bottom:-4px">Flores sueltas · upgrades</div>`;
    html += flores.map(f => {
      const costo = cotizadorPrecios[f.n] || 0;
      const pFinal = Math.round(costo*(1+margen/100));
      return `<div style="background:var(--cream);border-radius:8px;padding:9px 12px;display:flex;align-items:center;gap:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--charcoal)">${esc(f.n)}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
            <span style="font-size:12px;background:var(--ok-soft);color:var(--green-ok);padding:1px 6px;border-radius:8px;font-weight:600">${f.actual} uds</span>
            <span style="font-size:12px;color:var(--mid-gray)">$${costo.toLocaleString('es-AR')}</span>
            <span style="font-size:12px;color:var(--sage-dark);font-weight:600">→ $${pFinal.toLocaleString('es-AR')}</span>
          </div>
        </div>
        <input type="number" id="evcot_${f._si}" value="1" min="1"
          style="width:48px;padding:4px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:center;font-family:inherit">
        <button onclick="evAgregarFlor(${f._si})"
          style="background:var(--green-ok);color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">
          + Agregar
        </button>
      </div>`;
    }).join('');
  }

  grid.innerHTML = html || '<div style="color:var(--mid-gray);font-size:13px;padding:8px 0">No hay composiciones ni stock disponible.</div>';
  renderEvCarrito();
}

export function evAgregarComposicion(ri){
  const r = D.recetasData[ri];
  if(!r) return;
  const tipoIdx = document.getElementById('ev-cot-tipo')?.value;
  const tipo = eventoPricing.tipos[+tipoIdx];
  if(!tipo) return;
  const qty = Math.max(1, +document.getElementById('evcot_comp_'+ri)?.value||1);
  const costoBase = calcCostoComposicion(r);
  const precio = Math.round(costoBase*(1+tipo.margen/100));
  const emoji = D.arregloEmoji(r.nombre);
  const nombre = emoji + ' ' + r.nombre;
  const ex = evCarrito.find(c=>c.nombre===nombre);
  if(ex){ ex.qty += qty; }
  else { evCarrito.push({nombre, costo:costoBase, precio, qty, isComposicion:true}); }
  renderEvCarrito();
  const el = document.getElementById('evcot_comp_'+ri);
  if(el) el.value = 1;
}

export function evAgregarFlor(stockIdx){
  const s = D.stockData[stockIdx];
  if(!s) return;
  const tipoIdx = document.getElementById('ev-cot-tipo')?.value;
  const tipo = eventoPricing.tipos[+tipoIdx];
  if(!tipo) return;
  const qty = Math.max(1, +document.getElementById('evcot_'+stockIdx)?.value||1);
  const costo = cotizadorPrecios[s.prod] || 0;
  const precio = Math.round(costo*(1+tipo.margen/100));
  const ex = evCarrito.find(c=>c.nombre===s.prod);
  if(ex){ ex.qty += qty; }
  else { evCarrito.push({nombre:s.prod, costo, precio, qty}); }
  renderEvCarrito();
  const el = document.getElementById('evcot_'+stockIdx);
  if(el) el.value = 1;
}

export function renderEvCarrito(){
  const listEl = document.getElementById('ev-carrito-list');
  const emptyEl = document.getElementById('ev-carrito-empty');
  const totalBlock = document.getElementById('ev-total-block');
  if(!listEl) return;
  if(!evCarrito.length){
    listEl.innerHTML = '';
    if(emptyEl) emptyEl.style.display = '';
    if(totalBlock) totalBlock.style.display = 'none';
    return;
  }
  if(emptyEl) emptyEl.style.display = 'none';
  if(totalBlock) totalBlock.style.display = '';

  const tipoIdx = document.getElementById('ev-cot-tipo')?.value;
  const tipo = eventoPricing.tipos[+tipoIdx];
  const margenPct = tipo?.margen || 0;

  const totalCosto = evCarrito.reduce((s,c)=>s+(c.costo*c.qty),0);
  const totalFinal = evCarrito.reduce((s,c)=>s+(c.precio*c.qty),0);
  const margenVal = totalFinal - totalCosto;

  listEl.innerHTML = evCarrito.map((c,i)=>{
    const sub = c.precio*c.qty;
    return `<div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--light-gray)">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:var(--charcoal)">${esc(c.nombre)}</div>
        <div style="font-size:12px;color:var(--mid-gray)">$${c.precio.toLocaleString('es-AR')}/vara × ${c.qty}</div>
      </div>
      <span style="font-size:13px;font-weight:600;min-width:80px;text-align:right">$${sub.toLocaleString('es-AR')}</span>
      <button onclick="evCarrito.splice(${i},1);renderEvCarrito()" style="background:none;border:none;cursor:pointer;color:var(--red-alert);font-size:14px;padding:2px 6px">✕</button>
    </div>`;
  }).join('');

  document.getElementById('ev-cot-costo').textContent = '$'+totalCosto.toLocaleString('es-AR');
  document.getElementById('ev-cot-margen-label').textContent = margenPct;
  document.getElementById('ev-cot-margen-val').textContent = '$'+margenVal.toLocaleString('es-AR');
  document.getElementById('ev-cot-total').textContent = '$'+totalFinal.toLocaleString('es-AR');
}

export function copiarCotEvento(){
  if(!evCarrito.length) return;
  const tipoIdx = document.getElementById('ev-cot-tipo')?.value;
  const tipo = eventoPricing.tipos[+tipoIdx];
  const tipoNombre = tipo?.nombre || 'Evento';
  const totalCosto = evCarrito.reduce((s,c)=>s+(c.costo*c.qty),0);
  const totalFinal = evCarrito.reduce((s,c)=>s+(c.precio*c.qty),0);
  const lineas = evCarrito.map(c=>`• ${c.nombre} × ${c.qty}  →  $${(c.precio*c.qty).toLocaleString('es-AR')}`).join('\n');
  const texto = `Cotización Evento — ${tipoNombre}\nFlorería Duhau · Palacio Duhau\n${'─'.repeat(36)}\n${lineas}\n${'─'.repeat(36)}\nCosto base: $${totalCosto.toLocaleString('es-AR')}\nMargen ${tipo?.margen||0}%: $${(totalFinal-totalCosto).toLocaleString('es-AR')}\nPRECIO FINAL: $${totalFinal.toLocaleString('es-AR')}`;
  navigator.clipboard.writeText(texto).then(()=>showToast('Cotización de evento copiada'));
}

export function renderPreciosList(){
  const search = (document.getElementById('cot-search-precios')?.value||'').toLowerCase();
  const filtered = search ? COT_ALL.filter(f=>f.n.toLowerCase().includes(search)) : COT_ALL;
  const el = document.getElementById('cot-precios-list');
  if(!el) return;

  const renderGroup = (items, label, emoji) => {
    if(!items.length) return '';
    const rows = items.map(f=>{
      const allIdx = COT_ALL.findIndex(x=>x.n===f.n);
      const precio = cotizadorPrecios[f.n]||0;
      return `<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid var(--light-gray)">
        <div style="flex:1;font-size:13px;color:var(--charcoal)">${esc(f.n)}</div>
        <div style="display:flex;align-items:center;gap:4px">
          <span style="font-size:12px;color:var(--mid-gray)">$</span>
          <input type="number" min="0" value="${precio||''}" placeholder="0"
            style="width:90px;padding:5px 8px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:right;font-family:inherit"
            onblur="cotGuardarPrecio(${allIdx},this.value)"
            onkeydown="if(event.key==='Enter')this.blur()">
          <span style="font-size:12px;color:var(--mid-gray)">/vara</span>
        </div>
      </div>`;
    }).join('');
    return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:12px;overflow:hidden;margin-bottom:16px">
      <div style="padding:9px 12px;background:var(--cream);font-size:12px;letter-spacing:1px;text-transform:uppercase;font-weight:600;color:var(--mid-gray)">${emoji} ${label}</div>
      ${rows}
    </div>`;
  };

  const flores  = filtered.filter(f=>f.c==='flores');
  const follaje = filtered.filter(f=>f.c==='follaje');
  el.innerHTML = renderGroup(flores,'Flores','') + renderGroup(follaje,'Follaje','');
}

export function cotGuardarPrecio(cotIdx, val){
  const nombre = COT_ALL[cotIdx].n;
  const precio = Math.max(0, +val||0);
  if(!cotizadorPrecios) cotizadorPrecios = {};
  cotizadorPrecios[nombre] = precio;
  D.fbSave('cotizadorPrecios', cotizadorPrecios);
  cotizadorCarrito.forEach(c=>{ if(c.nombre===nombre) c.precio=precio; });
  renderCarrito();
  if(cotCurTab==='cotizar') renderCotizador();
}