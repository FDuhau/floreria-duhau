import { esc } from './utils.js';

// Vive en app.js: se lee por window al momento de usarlo.
const getAreaUsoOpts = (...a) => window.getAreaUsoOpts(...a);

// ── Reparto de un mismo artículo entre varias áreas (florería) ──
// Cuando lo que llega en una orden se destina a más de un sector del hotel
// (ej. 3 varas de Limonium: 2 al Lobby Alvear, 1 a Biblioteca), en vez de
// cargar el mismo producto varias veces a mano se define el reparto acá y
// addCompra() genera una línea de compra por área con su cantidad de paquetes.
// El precio por paquete es el mismo en todas (el importe sale de precio × cant).
let cfSplitRows = [];
export const getCfSplitRows = () => cfSplitRows;
export const resetCfSplitRows = () => { cfSplitRows = []; };

export function toggleCfSplit(){
  const wrap = document.getElementById('cf-split-wrap');
  if(!wrap) return;
  const visible = wrap.style.display !== 'none';
  if(visible){
    wrap.style.display = 'none';
  } else {
    wrap.style.display = '';
    if(cfSplitRows.length === 0){ cfSplitRows = [{sector:'',qty:''},{sector:'',qty:''}]; }
    renderCfSplitRows();
  }
}

export function cfSplitAddRow(){
  cfSplitRows.push({sector:'', qty:''});
  renderCfSplitRows();
}

export function cfSplitRemoveRow(i){
  cfSplitRows.splice(i,1);
  renderCfSplitRows();
}

export function cfSplitUpdRow(i, field, val){
  if(!cfSplitRows[i]) return;
  cfSplitRows[i][field] = val;
  renderCfSplitTotal();
}

export function renderCfSplitTotal(){
  const totalEl = document.getElementById('cf-split-total');
  if(!totalEl) return;
  const total = cfSplitRows.reduce((s,r)=>s+(parseFloat(r.qty)||0),0);
  totalEl.textContent = total > 0 ? `Total repartido: ${total}` : '';
}

export function renderCfSplitRows(){
  const el = document.getElementById('cf-split-rows');
  if(!el) return;
  el.innerHTML = cfSplitRows.map((r,i)=>`
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
      <select class="form-input" style="flex:2" onchange="cfSplitUpdRow(${i},'sector',this.value)">${getAreaUsoOpts(r.sector)}</select>
      <input class="form-input" type="number" placeholder="Cant." value="${esc(r.qty)}" style="width:80px" onchange="cfSplitUpdRow(${i},'qty',this.value)">
      <button class="btn-icon" style="color:var(--red-alert)" onclick="cfSplitRemoveRow(${i})">✕</button>
    </div>`).join('');
  renderCfSplitTotal();
}
