// ── SUGERENCIA DE PEDIDO (Compras › Sugerencia de pedido) ───────────────────
// Arma sola una lista de compra con el stock bajo, lo que ya viene en camino,
// lo comprometido en eventos y la temporada de cada flor, agrupada por
// proveedor. Se puede copiar o mandar por WhatsApp y cargar cada renglón en
// Compras. No guarda nada: se recalcula cada vez que se abre.
// Lo que necesita de app.js llega por configurarSugerenciaPedido():
//   TODAY_ISO, comprasFlore, navigate, stockData

import { esc, parseMoney } from './utils.js';
import { showToast } from './tema-toast.js';
import { getStockComprometido, getStockEnPedido } from './stock.js';
import { _varasPorPaqResuelto, cotizadorPrecioVara } from './cotizador.js';
import { catalogoFlores } from './flores-temporada.js';
import { articuloDeFlor, estadoEnMes } from './flores-temporada-base.js';
import { claveUnificada, mismoArticulo } from './articulos-base.js';
import { avisoTemporada, sugerirPedido, textoPedido } from './sugerencia-pedido-base.js';

let D = {};
export function configurarSugerenciaPedido(deps){ D = deps; }

const $ = id => document.getElementById(id);
const fmt$ = n => '$' + Math.round(+n || 0).toLocaleString('es-AR');
let _ultimo = null;   // última sugerencia calculada (para copiar / pedir)

function _ultimaCompra(prod){
  let best = null;
  (D.comprasFlore || []).forEach(c => {
    if(c.anulado || !mismoArticulo(c.prod, prod)) return;
    const precio = parseMoney(c.costo);
    if(!(precio > 0)) return;
    if(!best || (c.fecha || '') >= best.fecha) best = { precio, prov: c.prov || best?.prov || '', fecha: c.fecha || '' };
  });
  return best;
}

// Estado de temporada por artículo (solo los casos que importan para comprar).
function _mapaTemporada(){
  const mes = new Date().getMonth() + 1;
  const m = new Map();
  catalogoFlores().forEach(f => {
    const nombre = articuloDeFlor(f, window.getAllInsumos ? window.getAllInsumos() : [], n => cotizadorPrecioVara(n));
    if(!nombre) return;
    const e = estadoEnMes(f, mes);
    if(e === 'termina' || e === 'fuera' || e === 'llega') m.set(claveUnificada(nombre), e);
  });
  return m;
}

export function renderSugerenciaPedido(){
  const out = $('sp-contenido');
  if(!out) return;
  const temp = _mapaTemporada();
  const r = sugerirPedido({
    stock: D.stockData || [],
    comprometido: getStockComprometido,
    enPedido: getStockEnPedido,
    varasPorPaq: p => _varasPorPaqResuelto(p),
    ultimaCompra: _ultimaCompra,
    estadoTemporada: p => temp.get(claveUnificada(p)) || null,
  });
  _ultimo = r;
  if(!r.items.length){
    out.innerHTML = '<div class="empty-state" style="padding:30px;text-align:center;color:var(--mid-gray)">No hay nada para pedir: todo el stock está por encima del mínimo (contando lo que ya viene en camino y lo comprometido en eventos).</div>';
    return;
  }
  const resumen = `<div style="font-size:13px;color:var(--mid-gray);margin-bottom:14px">${r.items.length} artículo${r.items.length!==1?'s':''} para reponer${r.costoTotal ? ` · costo estimado <strong style="color:var(--charcoal)">${fmt$(r.costoTotal)}</strong> (con el último precio de compra)` : ''}. Se pide hasta el máximo de cada uno, descontando lo que ya viene en camino.</div>`;
  out.innerHTML = resumen + r.porProveedor.map((g, gi) => {
    const filas = g.items.map(i => {
      const ii = r.items.indexOf(i);
      const nombre = i.color ? `${i.prod} · ${i.color}` : i.prod;
      const aviso = avisoTemporada(i.temporada);
      const motivo = i.motivo === 'evento'
        ? `Comprometido en eventos (${+i.comprometido.toFixed(1)})`
        : `Stock ${+i.actual.toFixed(1)}, mínimo ${+i.min.toFixed(1)}`;
      const pedir = i.paquetes
        ? `<strong>${i.paquetes} paq</strong> <span style="color:var(--mid-gray);font-size:12px">(${i.paquetes * i.varasPorPaq} varas)</span>`
        : `<strong>${i.faltan} varas</strong> <span style="color:var(--red-alert);font-size:12px" title="Cargá las varas por paquete en Compras">sin dato de paquete</span>`;
      return `<tr style="border-top:1px solid var(--light-gray)">
        <td style="padding:8px 8px 8px 0"><div style="font-weight:600">${esc(nombre)}</div><div style="font-size:12px;color:var(--mid-gray)">${esc(motivo)}${i.enCamino ? ` · ya vienen ${+i.enCamino.toFixed(1)}` : ''}</div>
          ${aviso ? `<div style="font-size:12px;color:var(--amber)">${esc(aviso)}</div>` : ''}</td>
        <td style="white-space:nowrap;padding:8px">${pedir}</td>
        <td style="white-space:nowrap;text-align:right;padding:8px">${i.costo != null ? fmt$(i.costo) : '<span style="color:var(--mid-gray)">—</span>'}</td>
        <td style="text-align:right;padding:8px 0 8px 8px"><button class="btn-secondary" onclick="spPedir(${ii})">Pedir</button></td>
      </tr>`;
    }).join('');
    return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:12px;padding:14px 18px;margin-bottom:16px">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
        <div style="font-size:15px;font-weight:600">${g.prov ? esc(g.prov) : 'Sin proveedor conocido'}</div>
        <div style="font-size:13px;color:var(--mid-gray)">${g.items.length} artículo${g.items.length!==1?'s':''}${g.costo ? ' · ' + fmt$(g.costo) : ''}${g.sinCosto && g.costo ? ' + sin precio' : ''}</div>
        <div style="margin-left:auto;display:flex;gap:6px">
          <button class="btn-secondary" onclick="spCopiar(${gi})">Copiar pedido</button>
          <button class="btn-secondary" onclick="spWhatsApp(${gi})">WhatsApp</button>
        </div>
      </div>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><tbody>${filas}</tbody></table></div>
    </div>`;
  }).join('');
}

const _texto = gi => {
  const g = _ultimo?.porProveedor[gi];
  if(!g) return '';
  const d = new Date(); 
  return textoPedido(g, { fecha: `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}` });
};

export async function spCopiar(gi){
  const t = _texto(gi);
  if(!t) return;
  try{ await navigator.clipboard.writeText(t); showToast('Pedido copiado: pegalo donde quieras'); }
  catch(e){ showToast('No se pudo copiar. Probá con el botón de WhatsApp'); }
}

export function spWhatsApp(gi){
  const t = _texto(gi);
  if(t) window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank');
}

// Lleva a Compras › Florería con el artículo, la cantidad (paquetes) y el proveedor cargados.
export function spPedir(ii){
  const i = _ultimo?.items[ii];
  if(!i) return;
  D.navigate?.('compras-floreria');
  setTimeout(() => {
    const set = (id, v) => { const el = $(id); if(el && v !== '' && v != null){ el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); } };
    set('cf-producto', i.prod);
    set('cf-desc', i.color);
    set('cf-cantidad', i.paquetes || i.faltan);
    set('cf-proveedor', i.prov);
    $('cf-producto')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 60);
}

Object.assign(window, { spCopiar, spWhatsApp, spPedir, renderSugerenciaPedido });
