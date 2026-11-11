// Separado de app.js. Lo que necesita de app.js llega por configurarComposiciones():
//   _arreglosComposicionLoaded, _marcarArreglosComposicionCargado, _saveArreglosComposicion, arreglosComposicion, calcCostoArreglo, closeModal, fbSave, getAllInsumos, openArregloComposicion, recetasData, renderRentabilidadHotel, userRole

import { showToast } from './tema-toast.js';
import { confirmModal, promptModal } from './modales.js';
import { esc } from './utils.js';
import { nombreArticulo } from './articulos-base.js';
import { _ingVaras, calcCostoComposicion, cotizadorConfig } from './cotizador.js';
import { _stockFilasDe } from './stock.js';
import { precioSugerido, unidadesPosibles } from './composicion-base.js';
import { getAreaUsoZonas } from './compras.js';
import { leerFotoComprimida } from './imagenes.js';
import { badgeCategoriaVaraDe } from './categoria-vara.js';

let D = {};
export function configurarComposiciones(deps){ D = deps; }


// ════════════════════════════════════════
// DATA — COMPOSICIONES
// ════════════════════════════════════════
const ARREGLOS_BASE = ['Bochita','Cuenco','Pecera','Paila','Buffet'];

// ── Cantidades con fracción de vara (ej. 1/3 = una vara alcanza para 3 arreglos) ─
function _parseCant(str){
  str = String(str==null?'':str).trim().replace(',', '.');
  if(!str) return 0;
  const mixto = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);      // "1 1/2"
  if(mixto) return (+mixto[1]) + (+mixto[2])/(+mixto[3]);
  const frac = str.match(/^(\d+)\/(\d+)$/);               // "1/3"
  if(frac) return (+frac[1])/(+frac[2]);
  return parseFloat(str) || 0;
}
export function _fmtCant(q){
  q = +q || 0;
  if(q === 0) return '0';
  if(Number.isInteger(q)) return String(q);
  const ent = Math.floor(q), frac = q - ent;
  const tabla = [[0.5,'1/2'],[1/3,'1/3'],[2/3,'2/3'],[0.25,'1/4'],[0.75,'3/4'],[0.2,'1/5'],[1/6,'1/6'],[1/8,'1/8']];
  let f = ''; for(const [v,s] of tabla){ if(Math.abs(frac-v) < 0.02){ f = s; break; } }
  if(!f) return String(Math.round(q*100)/100);
  return ent > 0 ? ent + ' ' + f : f;
}
// Cantidad + unidad de un ingrediente (ej. "4 paq" o "3 varas").
export function _fmtIngUnidad(ing){
  const q = _fmtCant(ing.qty);
  if(ing && ing.unidad === 'paq') return `${q} paq`;
  return `${q} vara${(+ing.qty)===1?'':'s'}`;
}

// ── Catálogo base de composiciones (Upgrade + Eventos) ─
// Los ingredientes con "/" son opciones (se usa la que haya). Las fracciones
// significan qué parte de una vara lleva (1/3 = una vara rinde para 3 arreglos).
const _CN='Conejito / Nardos / Alhelí', _MS='Margarita / Sanvicente',
      _DCR='Dianthus / Cresta de gallo / Rosa nacional', _SLS='Solidago / Limonium / Statice',
      _LA='Laurentino / Azarero', _LRC='Lilium / Repollo / Crisantemo fideo o pomposo';
const COMPOSICIONES_BASE = [
  { nombre:'Upgrade · Bochita', ings:[{prod:_CN,qty:1},{prod:_MS,qty:2},{prod:_DCR,qty:2},{prod:'Astromelia',qty:1},{prod:_SLS,qty:1/5},{prod:_LA,qty:1/3},{prod:'Thuja',qty:1/6}] },
  { nombre:'Upgrade · Pecera', ings:[{prod:_CN,qty:3},{prod:_MS,qty:4},{prod:'Astromelia',qty:4},{prod:_DCR,qty:3},{prod:_LRC,qty:1},{prod:'Laurentino',qty:1},{prod:'Azarero',qty:1},{prod:'Thuja',qty:1/2}] },
  { nombre:'Upgrade · Arreglo alto de follaje', ings:[{prod:'Florero alto en cono',qty:1},{prod:'Monstera',qty:2}] },
  { nombre:'Evento · Bochita de follaje', ings:[{prod:'Laurentino',qty:1/3},{prod:'Azarero',qty:1/3},{prod:'Thuja',qty:1/6}] },
  { nombre:'Evento · Bochita de flores', ings:[{prod:_CN,qty:3},{prod:_MS,qty:3},{prod:_DCR,qty:2},{prod:'Astromelia',qty:1},{prod:_SLS,qty:1/5},{prod:_LA,qty:1/3},{prod:'Thuja',qty:1/6}] },
  { nombre:'Evento · Cuenco de follaje', ings:[{prod:'Laurentino',qty:2},{prod:'Azarero',qty:1},{prod:'Thuja',qty:1/3}] },
  { nombre:'Evento · Cuenco de flores', ings:[{prod:_CN,qty:3},{prod:_MS,qty:3},{prod:_DCR,qty:2},{prod:'Astromelia',qty:3},{prod:_SLS,qty:1/2},{prod:'Laurentino',qty:1/2},{prod:'Azarero',qty:1/2},{prod:'Thuja',qty:1/3}] },
  { nombre:'Evento · Pecera de follaje', ings:[{prod:'Laurentino',qty:3},{prod:'Azarero',qty:3},{prod:'Thuja',qty:1/2}] },
  { nombre:'Evento · Pecera de flores', ings:[{prod:_CN,qty:3},{prod:_MS,qty:4},{prod:'Astromelia',qty:4},{prod:_DCR,qty:6},{prod:_SLS,qty:1},{prod:'Laurentino',qty:1},{prod:'Azarero',qty:1},{prod:'Thuja',qty:1/2}] },
  { nombre:'Evento · Paila de follaje', ings:[{prod:'Laurentino',qty:3},{prod:'Azarero',qty:3},{prod:'Thuja',qty:1/2}] },
  { nombre:'Evento · Paila de flores', ings:[{prod:_CN,qty:3},{prod:_MS,qty:4},{prod:'Astromelia',qty:4},{prod:_DCR,qty:6},{prod:_SLS,qty:1},{prod:'Laurentino',qty:1},{prod:'Azarero',qty:2},{prod:'Thuja',qty:1/2}] },
  { nombre:'Evento · Arreglo alto Buffet de follaje', ings:[{prod:'Laurentino',qty:3},{prod:'Azarero',qty:3},{prod:'Thuja',qty:2}] },
  { nombre:'Evento · Arreglo alto Buffet de flores', ings:[{prod:_CN,qty:3},{prod:_MS,qty:3},{prod:'Astromelia',qty:3},{prod:_DCR,qty:3},{prod:'Laurentino',qty:2},{prod:'Azarero',qty:2},{prod:'Thuja',qty:2}] },
];

export async function seedComposicionesBase(){
  if(D.userRole!=='gerencia'){ showToast('Solo gerencia'); return; }
  const existentes = new Set(D.recetasData.map(r=>r.nombre));
  const nuevas = COMPOSICIONES_BASE.filter(c=>!existentes.has(c.nombre));
  if(!nuevas.length){ showToast('Las composiciones base ya están cargadas'); return; }
  if(!await confirmModal(`¿Cargar ${nuevas.length} composición${nuevas.length!==1?'es':''} base (Upgrade + Eventos)? Después las podés editar.`)) return;
  nuevas.forEach(c=>D.recetasData.push({ nombre:c.nombre, ings:c.ings.map(g=>({prod:g.prod, qty:g.qty})), img:'' }));
  D.fbSave('recetasData', D.recetasData);
  renderRecetas();
  showToast(`${nuevas.length} composiciones cargadas`);
}

// ── Catálogo base de arreglos fijos del hotel (por zona) ──────────────────────
// Los ingredientes con "/" son opciones (se usa la que haya en stock). Las
// fracciones = qué parte de una vara lleva cada unidad (ej. 1/3 = una vara
// rinde para 3 arreglos). Cada ingrediente lleva su unidad: V() = varas,
// P() = paquetes (se convierten a varas con las varas por paquete de Compras).
const _MAG='Magnolia / Níspero', _SLN='Solidago / Naviza',
      _SVM='San Vicente / Margarita', _CA2='Conejito / Alhelí';
const V=(prod,qty)=>({prod,qty});
const P=(prod,qty)=>({prod,qty,unidad:'paq'});
const COMPOSICIONES_HOTEL_BASE = [
  { zona:'Lobby de Alvear', ings:[P('Monstera',4),P(_MAG,2),P('Laurentino',1),P('Azarero',3),P('Eucalipto',1),P(_SLN,1)] },
  { zona:'Recepción Alvear', ings:[V('Laurentino',2),V('Azarero',2),V('Pino',3),V('Lilium',1),V('Astromelia',5),V(_SVM,5),V(_CA2,3),V('Repollo',1),V(_SLN,1)] },
  { zona:'Mesada Piano', ings:[V('Laurentino',3),V('Azarero',4),V('Pino',3),V('Lilium',2),V('Astromelia',5),V(_SVM,5),V(_CA2,5),V('Repollo',1),V(_SLN,2)] },
  { zona:'Mesitas Piano', ings:[P('Limonium',2)] },
  { zona:'Biblioteca', ings:[V('Laurentino',3),V('Azarero Disciplinado',3),V('Buxus',6),V('Ligustro',6)] },
  { zona:'Salón Privado', ings:[V('Laurentino',2),V('Azarero Disciplinado',2),V('Buxus',4),V('Ligustro',4)] },
  { zona:'Mesa ratona Alvear', ings:[V('Laurentino',2),V('Azarero Disciplinado',1),V('Azarero',1),V('Pino',1)] },
  { zona:'Mesada Vinoteca (c/u)', ings:[V('Laurentino',2),V('Azarero Disciplinado',1),V('Azarero',1),V('Buxus',1),V('Pino',1)] },
  { zona:'Chimenea Vinoteca', ings:[V('Laurentino',4),V('Azarero',4),V('Pino',3)] },
  { zona:'Copón Duhau', ings:[P('Monstera',4)] },
  { zona:'Elefante', ings:[V('Monstera',4),P('Laurentino',1),P('Azarero',1),V('Pino',5)] },
  { zona:'Spa · Recepción', ings:[V('Monstera',3)] },
  { zona:'Spa · Jacuzzi', ings:[V('Monstera',3)] },
  { zona:'Spa · Foyer', ings:[V('Laurentino',3),V('Azarero',3),V('Pino',2),V('Monstera',2)] },
  { zona:'Spa · Bochitas (20)', ings:[P('Pino',1/2)] },
  { zona:'Baños Duhau', ings:[V('Monstera',2)] },
  { zona:'Baños Duhau · Bochitas (6)', ings:[P('Limonium',1/2)] },
  { zona:'Lobby de Posadas', ings:[P('Limonium',10)] },
  { zona:'Recepción Posadas y mesita (c/u)', ings:[V('Laurentino',2),V('Azarero',2),V('Buxus',1),V('Pino',1)] },
  { zona:'Baño Paseo de las Artes · Bochitas (7)', ings:[P('Limonium',1/2)] },
  { zona:'Gioia mesitas (c/u)', ings:[V('Azarero nana',3)] },
  { zona:'Gioia Arbolitos (c/u)', ings:[P('Sauce',3),V('Laurentino',7),V('Azarero',7),V('Pino',6),V('Limón',7)] },
  { zona:'Copón Gioia', ings:[V('Laurentino',5),V('Azarero',6),V('Pino',4),V('Monstera',4)] },
  { zona:'Totems Meetings (c/u)', ings:[V('Monstera',2)] },
  { zona:'Meetings bochitas (c/u)', ings:[V('Laurentino',1/3),V('Azarero',1/3),V('Pino',1/6)] },
  { zona:'Meetings baños · Bochitas (9)', ings:[P('Limonium',1/2)] },
  { zona:'Tilo', ings:[V('Azarero',2),V('Laurentino',2),V('Pino',1),V('Conejito',3),V('Astromelia',3),V(_SVM,5)] },
  { zona:'Mesada Posadas (c/u)', ings:[V('Laurentino',4),V('Azarero',3),V('Pino',2)] },
  { zona:'Totems Posadas (c/u)', ings:[V('Laurentino',4),V('Azarero',3),V('Pino',2)] },
  { zona:'Bochitas Posadas (c/u)', ings:[V('Laurentino',1/2),V('Azarero',1/2),V('Pino',1/6)] },
];

export async function seedComposicionesHotelBase(){
  if(D.userRole!=='gerencia'){ showToast('Solo gerencia'); return; }
  const n = COMPOSICIONES_HOTEL_BASE.length;
  if(!await confirmModal(`¿Cargar / actualizar las ${n} composiciones base de arreglos del hotel?\n\nSe (re)cargan las zonas del catálogo con las unidades correctas (paquetes o varas). Tus zonas propias no se tocan.`)) return;
  COMPOSICIONES_HOTEL_BASE.forEach(c=>{
    D.arreglosComposicion[c.zona] = c.ings.map(g=>({ prod:g.prod, qty:g.qty, ...(g.unidad==='paq'?{unidad:'paq'}:{}) }));
  });
  D._marcarArreglosComposicionCargado(); // ya hay datos en memoria: habilita edición/guardado
  D._saveArreglosComposicion();
  renderComposicionesHotel();
  if(document.getElementById('page-rentabilidad-eventos')?.classList.contains('active')) D.renderRentabilidadHotel();
  showToast(`${n} composiciones del hotel cargadas`);
}

// ── renderRecetas ─────────────────────────────────────────────────────────────
// Precio sugerido (con el margen del cotizador) y cuántos arreglos alcanzan con el stock de hoy.
function _stockVarasDe(prod){ return _stockFilasDe(prod).reduce((s,f)=>s+(parseFloat(f.actual)||0),0); }
function _filaPrecioYStock(ings, costo){
  const margen = cotizadorConfig?.margen ?? 30;
  const precio = precioSugerido(costo, margen);
  const u = unidadesPosibles(ings, _ingVaras, _stockVarasDe);
  let stockTxt = '';
  if(u){
    const col = u.n === 0 ? 'var(--red-alert)' : u.n <= 2 ? '#A06A00' : 'var(--green-ok)';
    const detalle = u.n === 0
      ? (u.sinStock.length ? 'sin stock de ' + u.sinStock.map(esc).join(', ') : 'falta ' + esc(u.limitante))
      : (u.limitante ? 'limita ' + esc(u.limitante) : '');
    stockTxt = `<span style="color:${col};font-weight:600">${u.n === 0 ? 'No alcanza' : 'Alcanza para ' + u.n}</span><span style="color:var(--mid-gray)"> · ${detalle}</span>`;
  }
  if(!precio && !stockTxt) return '';
  return `<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;margin-top:6px;font-size:12px">
    ${precio ? `<span style="color:var(--mid-gray)">Precio sugerido (+${margen}%): <b style="color:var(--charcoal)">$${precio.toLocaleString('es-AR')}</b></span>` : '<span></span>'}
    <span>${stockTxt}</span></div>`;
}

export function renderRecetas(){
  const grid = document.getElementById('recetas-grid');
  if(!grid) return;
  grid.innerHTML = D.recetasData.map((r,i)=>`
    <div class="receta-card">
      ${r.img ? `<img src="${r.img}" alt="${esc(r.nombre)}" style="width:100%;height:140px;object-fit:cover;border-radius:4px;margin-bottom:12px">` : ''}
      <div class="receta-header">
        <div class="receta-nombre">${ARREGLOS_BASE.includes(r.nombre)?arregloEmoji(r.nombre)+' ':''}<b>${esc(r.nombre)}</b></div>
        <div style="display:flex;gap:6px">
          <button class="btn-icon" onclick="openRecetaModal(${i})" title="Editar"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>
          <button class="btn-icon" style="color:var(--red-alert)" onclick="delReceta(${i})" title="Eliminar">✕</button>
        </div>
      </div>
      <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:8px;font-weight:600">Ingredientes por unidad</div>
      <div class="receta-ingredientes">
        ${r.ings.map(ing=>`
          <div class="receta-ing-row">
            <span style="font-size:18px;line-height:1"></span>
            <span style="flex:1;font-weight:500">${esc(ing.prod)} ${badgeCategoriaVaraDe(ing.prod)}</span>
            <span style="background:var(--surface-2);border-radius:4px;padding:2px 8px;font-size:12px;font-weight:600">${_fmtCant(ing.qty)} vara${(+ing.qty)===1?'':'s'}</span>
          </div>`).join('')}
      </div>
      ${(()=>{ const c = calcCostoComposicion(r); return `<div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:10px;padding-top:8px;border-top:1px solid var(--light-gray);font-size:12px"><span style="color:var(--mid-gray);letter-spacing:1px;text-transform:uppercase;font-weight:600;font-size:12px">Costo por unidad</span><b style="font-size:14px">${c>0?'$'+Math.round(c).toLocaleString('es-AR'):'sin costo'}</b></div>` + _filaPrecioYStock(r.ings, c); })()}
    </div>`).join('');
}

// ── Solapas de la página Composiciones: Eventos (recetasData) / Hotel (checklist) ──
export let compTab = 'eventos';
export function setCompTab(t){
  compTab = t;
  document.getElementById('comp-tab-eventos')?.classList.toggle('active', t==='eventos');
  document.getElementById('comp-tab-hotel')?.classList.toggle('active', t==='hotel');
  const secE = document.getElementById('comp-sec-eventos');
  const secH = document.getElementById('comp-sec-hotel');
  const btns = document.getElementById('comp-header-btns');
  if(secE) secE.style.display = t==='eventos' ? '' : 'none';
  if(secH) secH.style.display = t==='hotel' ? '' : 'none';
  // Los botones "+ Nueva composición" y "Cargar catálogo base" son de eventos.
  if(btns) btns.style.display = t==='eventos' ? '' : 'none';
  const hotelBtns = document.getElementById('comp-hotel-btns');
  if(hotelBtns) hotelBtns.style.display = t==='hotel' ? 'flex' : 'none';
  if(t==='hotel') renderComposicionesHotel(); else renderRecetas();
}

// Composición de los arreglos fijos del hotel, tomados de las zonas del checklist.
// Reutiliza arreglosComposicion (el mismo store que usa Rentabilidad Hotel).
export function renderComposicionesHotel(){
  const grid = document.getElementById('recetas-hotel-grid');
  if(!grid) return;

  // Solo se listan las zonas que YA tienen composición cargada (así no se
  // llena de zonas vacías). Para cargar una zona sin composición se usa el
  // selector "+ Definir composición".
  const conComp = Object.keys(D.arreglosComposicion||{})
    .filter(z => (D.arreglosComposicion[z]||[]).length)
    .sort((a,b)=>a.localeCompare(b,'es'));

  // Barra: agregar composición a una zona del checklist o a un nombre nuevo.
  const addBar = document.getElementById('comp-hotel-addbar');
  if(addBar){
    const sinComp = getAreaUsoZonas()
      .filter(z => !(D.arreglosComposicion[z]||[]).length)
      .sort((a,b)=>a.localeCompare(b,'es'));
    addBar.innerHTML = `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <select class="form-input" style="min-width:260px" onchange="compHotelAdd(this)">
        <option value="">+ Definir composición de una zona…</option>
        ${sinComp.length ? '<optgroup label="Zonas del checklist">'+sinComp.map(z=>`<option value="${esc(z)}">${esc(z)}</option>`).join('')+'</optgroup>' : ''}
        <option value="__otra__">Otra zona (escribir nombre)…</option>
      </select>
    </div>`;
  }

  if(!conComp.length){
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--mid-gray)">No hay arreglos del hotel con composición todavía. Usá «+ Definir composición» o «Cargar catálogo base».</div>';
    return;
  }
  grid.innerHTML = conComp.map(zona=>{
    const ings = D.arreglosComposicion[zona] || [];
    const costo = Math.round(D.calcCostoArreglo(zona));
    const zEsc = esc(zona).replace(/'/g,"\\'");
    return `<div class="receta-card">
      <div class="receta-header">
        <div class="receta-nombre"><b>${esc(zona)}</b></div>
        <div style="display:flex;gap:6px">
          <button class="btn-icon" onclick="openArregloComposicion('${zEsc}')" title="Editar composición"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>
          <button class="btn-icon" style="color:var(--red-alert)" onclick="delArregloComposicion('${zEsc}')" title="Eliminar composición">✕</button>
        </div>
      </div>
      <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin:8px 0;font-weight:600">Ingredientes por unidad</div>
      <div class="receta-ingredientes">
        ${ings.map(ing=>{
          const eqVaras = ing.unidad==='paq' ? _ingVaras(ing) : 0;
          return `<div class="receta-ing-row">
          <span style="font-size:18px;line-height:1"></span>
          <span style="flex:1;font-weight:500">${esc(ing.prod)} ${badgeCategoriaVaraDe(ing.prod)}</span>
          <span style="background:var(--surface-2);border-radius:4px;padding:2px 8px;font-size:12px;font-weight:600" title="${ing.unidad==='paq'?(eqVaras?_fmtCant(eqVaras)+' varas':'cargá varas por paquete en Compras'):''}">${_fmtIngUnidad(ing)}${ing.unidad==='paq'&&eqVaras?` · ${_fmtCant(eqVaras)}v`:''}</span>
        </div>`;
        }).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:10px;padding-top:8px;border-top:1px solid var(--light-gray);font-size:12px"><span style="color:var(--mid-gray);letter-spacing:1px;text-transform:uppercase;font-weight:600;font-size:12px">Costo por unidad</span><b style="font-size:14px">${costo>0?'$'+costo.toLocaleString('es-AR'):'sin costo'}</b></div>
      ${_filaPrecioYStock(ings, costo)}
    </div>`;
  }).join('');
}

export async function compHotelAdd(sel){
  const v = sel.value;
  sel.value = '';
  if(!v) return;
  if(v === '__otra__'){
    const nom = await promptModal('Nombre de la zona / arreglo:', { title: 'Nueva zona del hotel' });
    if(nom && nom.trim()) D.openArregloComposicion(nom.trim());
  } else {
    D.openArregloComposicion(v);
  }
}

export async function delArregloComposicion(zona){
  if(D.userRole!=='gerencia'){ showToast('Solo gerencia'); return; }
  if(!D._arreglosComposicionLoaded){
    showToast('Las composiciones todavía se están cargando. Esperá unos segundos e intentá de nuevo.');
    return;
  }
  if(!await confirmModal(`¿Eliminar la composición de "${zona}"?`)) return;
  delete D.arreglosComposicion[zona];
  D._saveArreglosComposicion();
  renderComposicionesHotel();
  if(document.getElementById('page-rentabilidad-eventos')?.classList.contains('active')) D.renderRentabilidadHotel();
  showToast('Composición eliminada');
}

export function previewRecetaImg(input){
  const file = input.files[0];
  if(!file) return;
  leerFotoComprimida(file, data => {
    document.getElementById('rec-img-data').value = data;
    const preview = document.getElementById('rec-img-preview');
    preview.src = data; preview.style.display = 'block';
    document.getElementById('rec-img-clear').style.display = 'inline-block';
  });
}

export function clearRecetaImg(){
  document.getElementById('rec-img-data').value = '';
  document.getElementById('rec-img-preview').src = '';
  document.getElementById('rec-img-preview').style.display = 'none';
  document.getElementById('rec-img-clear').style.display = 'none';
  document.getElementById('rec-img-file').value = '';
}

export function arregloEmoji(n){
  return {Bochita:'',Cuenco:'',Pecera:'',Paila:'',Buffet:''}[n]||'';
}

// ── Modal receta ──────────────────────────────────────────────────────────────
export function openRecetaModal(i){
  document.getElementById('rec-idx').value = i;
  const isNew = i===-1;
  document.getElementById('receta-modal-title').textContent = isNew ? 'Nueva Composición' : 'Editar Composición';
  const ingsList = document.getElementById('rec-ings-list');
  const nombreInp = document.getElementById('rec-nombre');
  const dl = document.getElementById('rec-flor-list');
  if(dl) dl.innerHTML = D.getAllInsumos().map(n=>`<option value="${esc(n)}">`).join('');

  if(!isNew){
    const r = D.recetasData[i];
    nombreInp.value = r.nombre || '';
    ingsList.innerHTML = r.ings.map((ing,ii)=>recetaIngRowHTML(ing.prod, ing.qty, ii)).join('');
  } else {
    nombreInp.value = '';
    ingsList.innerHTML = recetaIngRowHTML('',1,0);
  }
  // restore image
  const imgData = isNew ? '' : (D.recetasData[i]?.img||'');
  document.getElementById('rec-img-data').value = imgData;
  const preview = document.getElementById('rec-img-preview');
  const clearBtn = document.getElementById('rec-img-clear');
  if(imgData){ preview.src=imgData; preview.style.display='block'; clearBtn.style.display='inline-block'; }
  else { preview.src=''; preview.style.display='none'; clearBtn.style.display='none'; }
  document.getElementById('receta-modal').classList.add('open');
}

export function recetaIngRowHTML(prod, qty, ii){
  return `<div class="ev-arreglo-row" id="rec-ing-${ii}">
    <input list="rec-flor-list" value="${esc(prod||'')}" placeholder="Flor / follaje (podés poner opciones: A / B / C)" style="flex:2;min-width:0;border:1px solid var(--light-gray);border-radius:4px;padding:5px 8px;font-family:'DM Sans',sans-serif;font-size:12.5px;outline:none">
    <input type="text" value="${esc(_fmtCant(qty||1))}" placeholder="Cant." title="Varas por unidad. Podés poner fracciones: 1/3, 1/2…" style="width:56px;border:1px solid var(--light-gray);border-radius:4px;padding:5px 6px;font-size:12.5px;text-align:center;outline:none;font-family:'DM Sans',sans-serif">
    <button type="button" class="btn-icon" style="color:var(--red-alert)" onclick="this.closest('.ev-arreglo-row').remove()">✕</button>
  </div>`;
}

export function addRecetaIngRow(){
  const list = document.getElementById('rec-ings-list');
  const idx = list.children.length;
  const div = document.createElement('div');
  div.innerHTML = recetaIngRowHTML('',1,idx);
  list.appendChild(div.firstElementChild);
}

export function saveReceta(){
  const nombre = document.getElementById('rec-nombre').value.trim();
  if(!nombre){ showToast('Ingresá el nombre del arreglo.','error'); return; }

  const rows = document.getElementById('rec-ings-list').querySelectorAll('.ev-arreglo-row');
  const ings = [];
  rows.forEach(row=>{
    const prodInp = row.querySelector('input[list]');
    const qtyInp  = row.querySelector('input[type=text]:not([list])');
    const prod = nombreArticulo(prodInp?.value || '');
    if(prod) ings.push({ prod, qty: _parseCant(qtyInp?.value) || 1 });
  });
  if(ings.length===0){ showToast('Agregá al menos un ingrediente.','error'); return; }

  const idx = +document.getElementById('rec-idx').value;
  const receta = { nombre, ings, img: document.getElementById('rec-img-data').value||'' };
  if(idx===-1) D.recetasData.push(receta);
  else D.recetasData[idx] = receta;
  D.closeModal('receta-modal');
  D.fbSave('recetasData', D.recetasData);
  renderRecetas();
}

export async function delReceta(i){
  if(!await confirmModal('¿Eliminar esta receta?')) return;
  D.recetasData.splice(i,1);
  D.fbSave('recetasData', D.recetasData);
  renderRecetas();
}