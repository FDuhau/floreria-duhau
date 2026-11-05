// ════════════════════════════════════════════════════════════
//  Nombres de artículos (flores, follajes, insumos): pura, sin DOM.
//  Testeada en tests/articulos.test.mjs.
//
//  El mismo artículo se cargaba con varios nombres ("Naviza", "naviza",
//  "navisa", "Rosas importadas", "Rosa importada"...). Como el costo por vara
//  se guarda por nombre exacto, cada forma tenía su propio costo: a veces no
//  aparecía y a veces se leía uno viejo. Acá está:
//   - claveArticulo(): la forma "comparable" de un nombre (sin mayúsculas,
//     tildes, plurales ni espacios de más). Dos nombres con la misma clave son
//     el mismo artículo.
//   - los alias confirmados por gerencia (nodo `articulosAlias`: clave → nombre
//     que queda), para variantes que no se parecen por la clave (Astromelia /
//     Alstroemerias).
//   - detectarGrupos() / unificarEnDatos(): la herramienta "Unificar artículos".
// ════════════════════════════════════════════════════════════
import { parseMoney } from './utils.js';

// Alias confirmados por gerencia (nodo `articulosAlias`), cargados al abrir.
export let articulosAlias = {};
export function setArticulosAlias(v){ articulosAlias = v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }

function _singular(w){
  if(w.length > 4 && w.endsWith('ies')) return w.slice(0, -2);                       // alhelíes → alhelí
  if(w.length > 4 && w.endsWith('es') && 'lrndzjy'.includes(w[w.length-3])) return w.slice(0, -2); // flores → flor
  if(w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);      // rosas → rosa
  return w;
}

// Clave comparable: "  Rosas  Importadas " y "rosa importada" → "rosa importada".
export function claveArticulo(nombre){
  const t = String(nombre ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/[.,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return t.split(' ').map(_singular).join(' ');
}

// Clave teniendo en cuenta los alias confirmados (Astromelia → Alstroemerias).
export const claveUnificada = (n, alias = articulosAlias) => claveArticulo(aplicarAlias(alias, String(n ?? '').trim()));
export const mismoArticulo = (a, b) => !!String(a ?? '').trim() && claveUnificada(a) === claveUnificada(b);

// ── Alias confirmados ───────────────────────────────────────
// alias: { clave: 'Nombre que queda' }. Devuelve el nombre que queda o null.
export function nombreAlias(alias = articulosAlias, nombre){
  if(!alias || !nombre) return null;
  return alias[claveArticulo(nombre)] || null;
}

// Aplica los alias a un nombre; si es "A / B / C" lo hace con cada opción.
export function aplicarAlias(alias = articulosAlias, nombre){
  if(!nombre || typeof nombre !== 'string') return nombre;
  const directo = nombreAlias(alias, nombre);
  if(directo) return directo;
  if(nombre.includes('/')){
    const partes = nombre.split('/').map(s => s.trim());
    const nuevas = partes.map(p => nombreAlias(alias, p) || p);
    if(nuevas.some((p, i) => p !== partes[i])) return nuevas.join(' / ');
  }
  return nombre;
}

// Nombre con el que se guarda algo que se acaba de escribir: el alias si lo
// hay; si no, el nombre YA existente con la misma clave (así "naviza" se guarda
// como "Naviza" si ese ya existe); si no, lo escrito sin espacios de más.
export function nombreCanonico(nombre, conocidos = [], alias = articulosAlias){
  const n = String(nombre ?? '').replace(/\s+/g, ' ').trim();
  if(!n) return n;
  const a = aplicarAlias(alias, n);
  if(a !== n) return a;
  const k = claveArticulo(n);
  const lista = [...(conocidos || [])];
  if(lista.includes(n)) return n;
  const igual = lista.find(c => c && claveArticulo(c) === k);
  return igual ? String(igual).trim() : n;
}

// ── Costo por vara guardado (cotizadorPrecios) ──────────────
// Clave de cotizadorPrecios donde guardar el costo de `nombre`: el nombre que
// queda (alias), o la clave ya existente del mismo artículo, o el nombre.
export function claveCostoPara(precios, nombre, alias = articulosAlias){
  const n = String(nombre ?? '').trim();
  if(!n) return n;
  const a = nombreAlias(alias, n);
  if(a) return a;
  if(precios && Object.prototype.hasOwnProperty.call(precios, n)) return n;
  const k = claveArticulo(n);
  const keys = Object.keys(precios || {}).filter(x => claveArticulo(x) === k);
  return keys.find(x => (+precios[x] || 0) > 0) || keys[0] || n;
}

// Costo por vara guardado de un nombre (sin la lógica de opciones "A / B").
// Exacto primero; si no, el del nombre que queda (alias) o el de otra forma
// del mismo artículo.
export function costoGuardado(precios, nombre, alias = articulosAlias){
  if(!precios || !nombre) return 0;
  const n = String(nombre).trim();
  const directo = +precios[n] || 0;
  if(directo > 0) return directo;
  const a = nombreAlias(alias, n);
  if(a && (+precios[a] || 0) > 0) return +precios[a];
  const k = claveArticulo(n);
  for(const [key, val] of Object.entries(precios)){
    if((+val || 0) > 0 && claveArticulo(key) === k) return +val;
  }
  return 0;
}

// ── Detección de duplicados ─────────────────────────────────
// data: { comprasFlore, comprasJard, stockData, recetasData,
//         arreglosComposicion ({zona:[ings]}), presupuestosData,
//         insumosCustom, cotizadorPrecios }
export const SECCIONES = {
  costos: 'Costos', comprasFlore: 'Compras florería', comprasJard: 'Compras jardín', stock: 'Stock',
  recetas: 'Recetas', composiciones: 'Composiciones', presupuestos: 'Presupuestos', insumos: 'Insumos',
};

export function contarUsos(data){
  const usos = new Map(); // nombre → {seccion: n}
  const add = (n, sec) => {
    if(typeof n !== 'string' || !n.trim()) return;
    const u = usos.get(n) || {};
    u[sec] = (u[sec] || 0) + 1;
    usos.set(n, u);
  };
  Object.keys(data.cotizadorPrecios || {}).forEach(n => add(n, 'costos'));
  (data.comprasFlore || []).forEach(c => add(c && c.prod, 'comprasFlore'));
  (data.comprasJard || []).forEach(c => add(c && c.prod, 'comprasJard'));
  (data.stockData || []).forEach(s => add(s && s.prod, 'stock'));
  (data.recetasData || []).forEach(r => (r && r.ings || []).forEach(i => add(i && i.prod, 'recetas')));
  Object.values(data.arreglosComposicion || {}).forEach(ings => (ings || []).forEach(i => add(i && i.prod, 'composiciones')));
  (data.presupuestosData || []).forEach(p => (p && p.items || []).forEach(i => add(i && i.prod, 'presupuestos')));
  (data.insumosCustom || []).forEach(n => add(n, 'insumos'));
  return usos;
}

const _total = u => Object.values(u || {}).reduce((s, n) => s + n, 0);

// Costo por vara de la compra más reciente (no anulada) de alguno de los
// nombres, que tenga precio y varas por paquete cargadas.
export function ultimoCostoVara(compras, nombres){
  const set = new Set(nombres);
  let best = null;
  (compras || []).forEach(c => {
    if(!c || c.anulado || !set.has(c.prod)) return;
    const precio = parseMoney(c.costo);
    const vpp = parseFloat(c.varasPorPaq) || 0;
    if(!(precio > 0) || !(vpp > 0)) return;
    if(!best || (c.fecha || '') >= best.fecha) best = { fecha: c.fecha || '', costo: Math.round(precio / vpp), prod: c.prod, prov: c.prov || '' };
  });
  return best;
}

function _maestroSugerido(variantes){
  // El nombre más usado; ante empate, el que empieza con mayúscula.
  const orden = [...variantes].sort((a, b) => b.total - a.total || (/^[A-ZÁÉÍÓÚÑ]/.test(b.nombre) - /^[A-ZÁÉÍÓÚÑ]/.test(a.nombre)) || a.nombre.localeCompare(b.nombre, 'es'));
  const n = orden[0].nombre.replace(/\s+/g, ' ').trim();
  return n.charAt(0).toUpperCase() + n.slice(1);
}

function _armarGrupo(nombres, usos, data, extra = {}){
  const variantes = nombres.map(n => ({ nombre: n, usos: usos.get(n) || {}, total: _total(usos.get(n)), costo: +(data.cotizadorPrecios || {})[n] || 0 }))
    .sort((a, b) => b.total - a.total);
  const maestro = _maestroSugerido(variantes);
  const ult = ultimoCostoVara(data.comprasFlore, nombres);
  let costo = 0, fuente = '';
  if(ult){ costo = ult.costo; fuente = 'compra'; }
  else {
    const conCosto = variantes.find(v => v.costo > 0);
    if(conCosto){ costo = conCosto.costo; fuente = 'guardado'; }
  }
  return { clave: claveArticulo(maestro), maestro, variantes, costo, fuente, ultimaCompra: ult, ...extra };
}

// Parecido entre dos claves (0..1), para sugerir variantes con faltas de
// ortografía (navisa / naviza). Distancia de Levenshtein normalizada.
export function parecido(a, b){
  if(a === b) return 1;
  const m = a.length, n = b.length;
  if(!m || !n) return 0;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for(let i = 1; i <= m; i++){
    const cur = [i];
    for(let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j-1] + 1, prev[j-1] + (a[i-1] === b[j-1] ? 0 : 1));
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

// Devuelve { grupos, sugeridos }:
//  - grupos: nombres con la misma clave (mayúsculas, tildes, plurales, espacios).
//  - sugeridos: pares de artículos distintos que se escriben casi igual (posible
//    falta de ortografía); NO se marcan para unir por defecto.
export function detectarGrupos(data, { umbral = 0.8 } = {}){
  const usos = contarUsos(data);
  const porClave = new Map();
  for(const n of usos.keys()){
    const k = claveArticulo(n);
    if(!k) continue;
    if(!porClave.has(k)) porClave.set(k, []);
    porClave.get(k).push(n);
  }
  const grupos = [];
  for(const nombres of porClave.values()) if(nombres.length > 1) grupos.push(_armarGrupo(nombres, usos, data));
  const claves = [...porClave.keys()].filter(k => k.length >= 4 && !k.includes('/')).sort();
  // Se agrupan en cadena (molucella ~ moluccela ~ molucela = un solo grupo).
  const raiz = new Map(claves.map(k => [k, k]));
  const buscar = k => { while(raiz.get(k) !== k) k = raiz.get(k); return k; };
  for(let i = 0; i < claves.length; i++){
    for(let j = i + 1; j < claves.length; j++){
      const a = claves[i], b = claves[j];
      if(Math.abs(a.length - b.length) > 2) continue;
      // Si uno es el otro con una palabra más ("pino" / "pino thuja") son distintos.
      if(a.split(' ').length !== b.split(' ').length) continue;
      if(parecido(a, b) >= umbral) raiz.set(buscar(b), buscar(a));
    }
  }
  const cadenas = new Map();
  claves.forEach(k => { const r = buscar(k); if(!cadenas.has(r)) cadenas.set(r, []); cadenas.get(r).push(k); });
  const sugeridos = [...cadenas.values()].filter(ks => ks.length > 1)
    .map(ks => _armarGrupo(ks.flatMap(k => porClave.get(k)), usos, data, { sugerido: true }));
  const porNombre = (x, y) => x.maestro.localeCompare(y.maestro, 'es');
  return { grupos: grupos.sort(porNombre), sugeridos: sugeridos.sort(porNombre) };
}

// ── Unificación ─────────────────────────────────────────────
// uniones: [{ maestro: 'Naviza', variantes: ['naviza','navisa',...], costo: 1143 }]
// Cambia `data` en el lugar (las mismas listas que usa la app) y devuelve
// { alias, resumen }. alias: { clave de cada variante: maestro } para guardar en
// `articulosAlias`, así lo que se escriba después con esas formas queda unificado.
export function unificarEnDatos(data, uniones){
  const alias = {};
  uniones.forEach(u => {
    const m = String(u.maestro || '').replace(/\s+/g, ' ').trim();
    if(!m) return;
    alias[claveArticulo(m)] = m;
    (u.variantes || []).forEach(v => { alias[claveArticulo(v)] = m; });
  });
  const ren = n => aplicarAlias(alias, n);
  const resumen = { compras: 0, stock: 0, stockUnidos: 0, recetas: 0, composiciones: 0, presupuestos: 0, insumos: 0, costos: 0 };

  const renombrar = (obj, campo, contador) => {
    if(!obj || typeof obj[campo] !== 'string') return;
    const nuevo = ren(obj[campo]);
    if(nuevo !== obj[campo]){ obj[campo] = nuevo; resumen[contador]++; }
  };

  (data.comprasFlore || []).forEach(c => renombrar(c, 'prod', 'compras'));
  (data.comprasJard || []).forEach(c => renombrar(c, 'prod', 'compras'));
  (data.presupuestosData || []).forEach(p => (p && p.items || []).forEach(i => renombrar(i, 'prod', 'presupuestos')));

  // Ingredientes: renombrar y juntar los que quedan repetidos (misma unidad).
  const unirIngs = (ings, contador) => {
    if(!Array.isArray(ings)) return ings;
    ings.forEach(i => renombrar(i, 'prod', contador));
    const out = [];
    ings.forEach(i => {
      if(!i || !i.prod){ out.push(i); return; }
      const igual = out.find(o => o && o.prod === i.prod && (o.unidad || '') === (i.unidad || ''));
      if(igual) igual.qty = +((+igual.qty || 0) + (+i.qty || 0)).toFixed(4);
      else out.push(i);
    });
    ings.splice(0, ings.length, ...out);
    return ings;
  };
  (data.recetasData || []).forEach(r => r && unirIngs(r.ings, 'recetas'));
  Object.values(data.arreglosComposicion || {}).forEach(ings => unirIngs(ings, 'composiciones'));

  // Stock: renombrar y sumar los renglones que quedan iguales (producto, área, color).
  if(Array.isArray(data.stockData)){
    data.stockData.forEach(s => renombrar(s, 'prod', 'stock'));
    const out = [];
    const llave = s => [s.prod, String(s.area || '').trim().toLowerCase(), String(s.color || '').trim().toLowerCase()].join('|');
    data.stockData.forEach(s => {
      const igual = s && s.prod ? out.find(o => o && o.prod && llave(o) === llave(s)) : null;
      if(igual){
        igual.actual = +((+igual.actual || 0) + (+s.actual || 0)).toFixed(1);
        igual.min = Math.max(+igual.min || 0, +s.min || 0);
        igual.max = Math.max(+igual.max || 0, +s.max || 0);
        resumen.stockUnidos++;
      } else out.push(s);
    });
    data.stockData.splice(0, data.stockData.length, ...out);
  }

  if(Array.isArray(data.insumosCustom)){
    const vistos = new Set();
    const out = [];
    data.insumosCustom.forEach(n => {
      const nuevo = ren(n);
      if(nuevo !== n) resumen.insumos++;
      const k = claveArticulo(nuevo);
      if(vistos.has(k)) return;
      vistos.add(k); out.push(nuevo);
    });
    data.insumosCustom.splice(0, data.insumosCustom.length, ...out);
  }

  // Costos: queda solo el nombre maestro, con el costo elegido.
  const precios = data.cotizadorPrecios;
  if(precios){
    uniones.forEach(u => {
      const m = alias[claveArticulo(u.maestro)];
      if(!m) return;
      const claves = new Set([claveArticulo(m), ...(u.variantes || []).map(claveArticulo)]);
      let previo = 0;
      Object.keys(precios).forEach(k => {
        if(!claves.has(claveArticulo(k)) && !(u.variantes || []).includes(k)) return;
        if(k === m){ previo = +precios[k] || 0; return; }
        if(!previo) previo = +precios[k] || 0;
        delete precios[k]; resumen.costos++;
      });
      const costo = Math.round(+u.costo || 0);
      if(costo > 0) precios[m] = costo;
      else if(previo > 0) precios[m] = previo;
    });
  }
  return { alias, resumen };
}

// Aplica los alias ya confirmados a un nodo antes de guardarlo (lo que se haya
// escrito con una forma vieja queda con el nombre que quedó). Cambia en el lugar.
export function aplicarAliasANodo(key, valor, alias = articulosAlias){
  if(!alias || !Object.keys(alias).length || !valor) return valor;
  const ren = o => { if(o && typeof o.prod === 'string'){ const n = aplicarAlias(alias, o.prod); if(n !== o.prod) o.prod = n; } };
  const lista = v => Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v) : []);
  switch(key){
    case 'comprasFlore': case 'comprasJard': case 'stockData':
      lista(valor).forEach(ren); break;
    case 'recetasData':
      lista(valor).forEach(r => lista(r && r.ings).forEach(ren)); break;
    case 'arreglosComposicion':
      lista(valor).forEach(x => lista(x && x.ings !== undefined ? x.ings : x).forEach(ren)); break;
    case 'presupuestosData':
      lista(valor).forEach(p => lista(p && p.items).forEach(ren)); break;
    case 'insumosCustom':
      if(Array.isArray(valor)){
        const vistos = new Set(); const out = [];
        valor.forEach(n => { const m = aplicarAlias(alias, n); const k = claveArticulo(m); if(!vistos.has(k)){ vistos.add(k); out.push(m); } });
        valor.splice(0, valor.length, ...out);
      }
      break;
    case 'cotizadorPrecios':
      Object.keys(valor).forEach(k => {
        const m = nombreAlias(alias, k);
        if(!m || m === k) return;
        // La forma vieja se acaba de escribir: su valor es el más nuevo.
        if((+valor[k] || 0) > 0) valor[m] = valor[k];
        delete valor[k];
      });
      break;
  }
  return valor;
}

// Lista de nombres para sugerencias (datalist): una sola forma por artículo,
// prefiriendo el nombre que quedó (alias) y los `preferidos` (ej. los del costo).
export function listaSinRepetidos(nombres, preferidos = [], alias = articulosAlias){
  const elegido = new Map(); // clave → nombre
  const pref = new Set(preferidos || []);
  const masters = new Set(Object.values(alias || {}));
  const puntaje = n => (masters.has(n) ? 2 : 0) + (pref.has(n) ? 1 : 0);
  [...(nombres || []), ...masters].forEach(n => {
    if(typeof n !== 'string' || !n.trim()) return;
    const nn = aplicarAlias(alias, n.trim());
    const k = claveArticulo(nn);
    const prev = elegido.get(k);
    if(prev === undefined || puntaje(nn) > puntaje(prev)) elegido.set(k, nn);
  });
  return [...elegido.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

// Nombres ya cargados en la app (costos, stock, insumos). app.js lo registra al
// arrancar con setArticulosConocidos(() => [...]).
let _conocidos = () => [];
export function setArticulosConocidos(fn){ if(typeof fn === 'function') _conocidos = fn; }

// Nombre con el que se guarda un artículo recién escrito: si ya existe con otra
// forma (mayúsculas, tildes, plural, espacios) se usa el que ya existe.
export function nombreArticulo(nombre){
  let lista;
  try{ lista = _conocidos() || []; }catch(e){ lista = []; }
  return nombreCanonico(nombre, lista, articulosAlias);
}

// Agrupa nombres por artículo y devuelve un nombre por grupo: el alias si lo
// hay; si no, el que figura en `preferidos` (ej. los del costo); si no, el más
// repetido. Sirve para listas y tableros que no deben mostrar duplicados.
export function nombresPorArticulo(nombres, preferidos = [], alias = articulosAlias){
  const grupos = new Map(); // clave → Map(nombre → veces)
  (nombres || []).forEach(n => {
    if(typeof n !== 'string' || !n.trim()) return;
    const nn = aplicarAlias(alias, n.replace(/\s+/g, ' ').trim());
    const k = claveArticulo(nn);
    if(!grupos.has(k)) grupos.set(k, new Map());
    const m = grupos.get(k); m.set(nn, (m.get(nn) || 0) + 1);
  });
  const pref = new Set(preferidos || []);
  const masters = new Set(Object.values(alias || {}));
  return [...grupos.values()].map(m => [...m.entries()]
    .sort((a, b) => (masters.has(b[0]) - masters.has(a[0])) || (pref.has(b[0]) - pref.has(a[0])) || (b[1] - a[1]))[0][0]);
}
