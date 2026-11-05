// ════════════════════════════════════════════════════════════
//  Catálogo de flores y follajes por temporada: datos y lógica pura, sin DOM.
//  Testeada en tests/flores-temporada.test.mjs.
//
//  Cada flor/follaje tiene los meses en que se consigue en el mercado de
//  Buenos Aires (orientativo: con invernadero o importación muchas se
//  estiran), los colores en que suele venir y, opcionalmente, el nombre con
//  que se carga en Compras (para traer el costo por vara y su categoría).
//
//  La lista que se usa vive en Firebase (nodo `floresTemporada`). Mientras
//  nadie la edite se muestra FLORES_TEMPORADA_BASE, cargada desde la planilla
//  "Temporadas_flores.xlsx" (noviembre 2026). Los colores son una primera
//  propuesta para que el equipo corrija.
// ════════════════════════════════════════════════════════════
import { claveUnificada } from './articulos-base.js';

export const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
export const MESES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

// Estaciones del hemisferio sur, como en la planilla.
export const ESTACIONES = [
  { id: 'verano',    nombre: 'Verano',    meses: [12, 1, 2] },
  { id: 'otono',     nombre: 'Otoño',     meses: [3, 4, 5] },
  { id: 'invierno',  nombre: 'Invierno',  meses: [6, 7, 8] },
  { id: 'primavera', nombre: 'Primavera', meses: [9, 10, 11] },
];
export const estacionDeMes = mes => ESTACIONES.find(e => e.meses.includes(mes)) || ESTACIONES[0];

const TODO = [1,2,3,4,5,6,7,8,9,10,11,12];
// [nombre, aclaración, tipo, meses, colores, nota]
const _BASE = [
  ['Achilea', '', 'Flor', [11,12,1,2,3], ['blanco','amarillo','rosa','fucsia','terracota']],
  ['Alelíes', '', 'Flor', [6,7,8,9,10], ['blanco','crema','rosa','lila','violeta']],
  ['Alstroemeria', '', 'Flor', TODO, ['blanco','rosa','fucsia','amarillo','naranja','rojo','lila']],
  ['Amapola / Amapola capullo', '', 'Flor', [7,8,9,10], ['naranja','rojo','amarillo','blanco','rosa']],
  ['Amaranto', '', 'Flor', [12,1,2,3,4], ['bordó','verde','rosa']],
  ['Anthurium', '', 'Flor', TODO, ['rojo','blanco','rosa','verde','bordó']],
  ['Anémonas', '', 'Flor', [6,7,8,9], ['blanco','rojo','fucsia','violeta','azul']],
  ['Biznaga / Naviza', '', 'Flor', [11,12,1,2], ['blanco']],
  ['Botoncito', 'Margarita Feeling Green', 'Flor', TODO, ['verde','blanco']],
  ['Calitas mini', '', 'Flor', [9,10,11,12], ['blanco','amarillo','rosa','naranja','bordó','violeta']],
  ['Cardos', '', 'Flor', [12,1,2,3], ['azul','violeta','blanco'], 'Importados se consiguen todo el año.'],
  ['Conejito', 'Boca de dragón', 'Flor', [7,8,9,10,11], ['blanco','rosa','amarillo','naranja','rojo','lila']],
  ['Craspedias', '', 'Flor', [10,11,12,1,2,3], ['amarillo']],
  ['Crisantemo Otome', '', 'Flor', TODO, ['blanco','rosa','lila','verde']],
  ['Crisantemos', '', 'Flor', TODO, ['blanco','amarillo','rosa','verde','bordó','naranja']],
  ['Dianthus', '', 'Flor', TODO, ['blanco','rosa','rojo','fucsia','verde']],
  ['Equinox', 'Echinops ritro', 'Flor', [12,1,2,3], ['azul']],
  ['Fresias', '', 'Flor', [7,8,9], ['blanco','amarillo','rosa','lila','naranja','rojo']],
  ['Girasoles', '', 'Flor', [11,12,1,2,3], ['amarillo']],
  ['Gonfrena', '', 'Flor', [12,1,2,3,4], ['fucsia','violeta','blanco','rosa']],
  ['Green ball', '', 'Flor', TODO, ['verde']],
  ['Gretel', 'Retama', 'Flor', [9,10,11], ['amarillo']],
  ['Hipericum', '', 'Flor', TODO, ['rojo','rosa','verde','blanco','naranja']],
  ['Hortensia', '', 'Flor', [11,12,1,2], ['blanco','celeste','azul','rosa','lila','verde']],
  ['Jacinto peruano', '', 'Flor', [9,10], ['violeta','azul','blanco']],
  ['Lengua de vaca', 'Rumex crispus', 'Flor', [11,12,1], ['marrón','bordó','verde']],
  ['Lilium perfumado', '', 'Flor', TODO, ['blanco','rosa','fucsia']],
  ['Liliums', '', 'Flor', TODO, ['blanco','amarillo','naranja','rosa','rojo']],
  ['Limonium', '', 'Flor', [10,11,12,1,2,3], ['violeta','lila','blanco','rosa','amarillo']],
  ['Lisianthus', '', 'Flor', [10,11,12,1,2,3], ['blanco','champagne','rosa','lila','violeta','verde']],
  ['Margarita', '', 'Flor', [10,11,12,1,2], ['blanco']],
  ['Marimonias', 'Ranúnculos', 'Flor', [7,8,9,10], ['blanco','rosa','amarillo','naranja','rojo','bordó']],
  ['Molucela', '', 'Flor', [10,11,12], ['verde']],
  ['Ojito de perdiz', 'Adonis aestivalis', 'Flor', [10,11,12], ['rojo']],
  ['Ornitogalum', '', 'Flor', [9,10,11], ['blanco']],
  ['Peonías', '', 'Flor', [10,11,12], ['rosa','blanco','coral','fucsia','bordó']],
  ['Rosa importada', '', 'Flor', TODO, ['blanco','rojo','rosa','champagne','amarillo','naranja','lila']],
  ['Rosas de jardín', '', 'Flor', [10,11,3,4], ['rosa','blanco','amarillo','durazno','rojo'], 'Primavera (oct–nov) y otra tanda en otoño.'],
  ['Rosita spray', '', 'Flor', TODO, ['blanco','rosa','rojo','amarillo','naranja','lila']],
  ['San Vicente', 'Crisantemo fideo', 'Flor', TODO, ['blanco','amarillo','rosa','lila','bordó'], 'Pico en otoño.'],
  ['Solidago', '', 'Flor', [12,1,2,3,4,5], ['amarillo']],
  ['Sorgo', '', 'Flor', [1,2,3,4], ['marrón','bordó','verde']],
  ['Trachelium', '', 'Flor', [10,11,12,1,2,3], ['violeta','lila','blanco','bordó']],
  ['Aralia', '', 'Follaje', TODO, ['verde']],
  ['Azarero', '', 'Follaje', TODO, ['verde']],
  ['Azarero disciplinado', '', 'Follaje', TODO, ['verde']],
  ['Azarero Nana', '', 'Follaje', TODO, ['verde']],
  ['Azarero variegado', '', 'Follaje', TODO, ['verde','blanco']],
  ['Buxus', '', 'Follaje', TODO, ['verde']],
  ['Eucaliptus', '', 'Follaje', TODO, ['verde grisáceo']],
  ['Fotiña', '', 'Follaje', TODO, ['rojo','verde']],
  ['Laurentino', '', 'Follaje', TODO, ['verde']],
  ['Ligustro (frutos)', '', 'Follaje', [5,6,7,8], ['negro','verde']],
  ['Magnolia', '', 'Follaje', TODO, ['verde','marrón']],
  ['Monstera', '', 'Follaje', TODO, ['verde']],
  ['Pino', '', 'Follaje', TODO, ['verde']],
];

export const idFlor = nombre => 'f_' + claveUnificada(nombre).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

export const FLORES_TEMPORADA_BASE = _BASE.map(([nombre, aclaracion, tipo, meses, colores, nota]) => ({
  id: idFlor(nombre), nombre, aclaracion, tipo, meses: [...meses].sort((a, b) => a - b), colores, nota: nota || '', articulo: '',
}));

// Deja un registro prolijo (lo que venga de Firebase puede venir con huecos).
export function normalizarFlor(f){
  const meses = [...new Set((Array.isArray(f?.meses) ? f.meses : Object.values(f?.meses || {}))
    .map(Number).filter(m => m >= 1 && m <= 12))].sort((a, b) => a - b);
  const colores = (Array.isArray(f?.colores) ? f.colores : String(f?.colores || '').split(','))
    .map(c => String(c).trim()).filter(Boolean);
  const nombre = String(f?.nombre || '').trim();
  return {
    id: String(f?.id || idFlor(nombre)),
    nombre,
    aclaracion: String(f?.aclaracion || '').trim(),
    tipo: f?.tipo === 'Follaje' ? 'Follaje' : 'Flor',
    meses, colores,
    nota: String(f?.nota || '').trim(),
    articulo: String(f?.articulo || '').trim(),
  };
}

export function normalizarCatalogo(val){
  const arr = Array.isArray(val) ? val : Object.values(val || {});
  return arr.filter(f => f && String(f.nombre || '').trim()).map(normalizarFlor)
    .sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === 'Flor' ? -1 : 1) || a.nombre.localeCompare(b.nombre, 'es'));
}

// ── Temporada ───────────────────────────────────────────────
export const todoElAnio = f => (f?.meses || []).length >= 12;
export const disponibleEn = (f, mes) => (f?.meses || []).includes(mes);
const _sig = mes => mes === 12 ? 1 : mes + 1;
const _ant = mes => mes === 1 ? 12 : mes - 1;

// Cómo está una flor en un mes:
//  'todo-el-anio' | 'empieza' (primer mes de la temporada) | 'termina' (último)
//  | 'temporada' | 'llega' (no está, pero entra el mes que viene) | 'fuera'
export function estadoEnMes(f, mes){
  if(!f || !(f.meses || []).length) return 'fuera';
  if(todoElAnio(f)) return 'todo-el-anio';
  if(disponibleEn(f, mes)){
    if(!disponibleEn(f, _sig(mes))) return 'termina';
    if(!disponibleEn(f, _ant(mes))) return 'empieza';
    return 'temporada';
  }
  return disponibleEn(f, _sig(mes)) ? 'llega' : 'fuera';
}

// Tramos de meses seguidos, dando la vuelta del año: [10,11,12,1,2,3] → "oct–mar".
export function textoMeses(meses){
  const set = new Set(meses || []);
  if(set.size >= 12) return 'todo el año';
  if(!set.size) return 'sin datos';
  // Arrancar en un mes cuyo anterior no esté, para que dic–ene quede junto.
  let inicio = [...set].sort((a, b) => a - b).find(m => !set.has(_ant(m)));
  const tramos = [];
  let m = inicio, vistos = 0, actual = null;
  while(vistos < 12){
    if(set.has(m)){ if(!actual) actual = [m, m]; else actual[1] = m; }
    else if(actual){ tramos.push(actual); actual = null; }
    m = _sig(m); vistos++;
  }
  if(actual) tramos.push(actual);
  return tramos.map(([a, b]) => a === b ? MESES_CORTO[a-1] : MESES_CORTO[a-1] + '–' + MESES_CORTO[b-1]).join(' y ');
}

// Agrupa el catálogo para un mes: lo que hay (de temporada / todo el año),
// lo que se termina, lo que llega el mes que viene.
export function resumenMes(catalogo, mes){
  const r = { temporada: [], todoElAnio: [], termina: [], empieza: [], llega: [], fuera: [] };
  for(const f of catalogo || []){
    const e = estadoEnMes(f, mes);
    if(e === 'todo-el-anio') r.todoElAnio.push(f);
    else if(e === 'fuera') r.fuera.push(f);
    else if(e === 'llega') r.llega.push(f);
    else {
      r.temporada.push(f);
      if(e === 'termina') r.termina.push(f);
      if(e === 'empieza') r.empieza.push(f);
    }
  }
  return r;
}

// ── Enlace con los artículos de Compras ─────────────────────
// Nombre con el que se carga en Compras/Costos. Si se eligió a mano, ese. Si
// no, el artículo conocido con la misma clave (con alias de "Unificar
// artículos"), probando cada opción de "Biznaga / Naviza"; si no, uno que
// empiece igual ("Cardos" → "Cardos azules"). `conCosto(nombre)` desempata a
// favor del que tiene costo por vara cargado.
export function articuloDeFlor(f, conocidos = [], conCosto = () => 0){
  if(!f) return '';
  if(f.articulo) return f.articulo;
  const lista = [...new Set((conocidos || []).filter(Boolean).map(s => String(s).trim()))];
  const claves = lista.map(n => [n, claveUnificada(n)]);
  const objetivos = [f.nombre, ...String(f.nombre).split('/')].map(s => claveUnificada(String(s).trim())).filter(Boolean);
  const mejor = cands => cands.sort((a, b) => ((+conCosto(b) > 0) - (+conCosto(a) > 0)) || a.length - b.length)[0] || '';
  // Todas las opciones juntas ("Biznaga / Naviza"): gana la que tiene costo.
  const exactos = claves.filter(([, c]) => objetivos.includes(c)).map(([n]) => n);
  if(exactos.length) return mejor(exactos);
  const empieza = claves.filter(([, c]) => objetivos.some(k => c.startsWith(k + ' '))).map(([n]) => n);
  if(empieza.length) return mejor(empieza);
  return '';
}

// ── Colores ─────────────────────────────────────────────────
// Muestra de color para los nombres más comunes (los demás van sin muestra).
const _MUESTRAS = {
  blanco: '#FFFFFF', crema: '#F3E9D2', champagne: '#EAD9B8', amarillo: '#F2C94C', naranja: '#EE8A3C',
  terracota: '#C0643E', durazno: '#F6B48F', coral: '#F07A6A', rojo: '#C62E2E', bordo: '#6E1A2B',
  rosa: '#F2A7BE', fucsia: '#D6338A', lila: '#C3A6D8', violeta: '#7A4FA0', celeste: '#9CC8EA',
  azul: '#3C64B1', verde: '#5E8C4A', 'verde grisaceo': '#8FA79A', marron: '#7A5434', negro: '#2A2A2A',
};
export function muestraColor(nombre){
  const k = String(nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return _MUESTRAS[k] || null;
}
