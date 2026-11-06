// ── AVISO DE CAMBIO DE PRECIO DE LAS FLORES ───────────────────────────────────
// Detecta qué flores subieron (o bajaron) de precio en las últimas compras, si
// cambiaron de categoría (estación / importada / premium) y cuánto cambia el
// costo de cada composición que las usa. Todo sale de las compras ya cargadas:
// no guarda nada nuevo en la base.

import { categoriaVara, historialCostoVara } from './categoria-vara.js';
import { claveUnificada, mismoArticulo } from './articulos-base.js';

// Gastos cargados como compra que no son flores.
const NO_ES_FLOR = /\b(flete|tax|taxi|envio|env[ií]o)\b/i;

function diasEntre(desdeISO, hastaISO){
  const a = Date.parse(String(desdeISO).slice(0,10) + 'T12:00:00');
  const b = Date.parse(String(hastaISO).slice(0,10) + 'T12:00:00');
  if(isNaN(a) || isNaN(b)) return Infinity;
  return Math.round((b - a) / 86400000);
}

// Flores cuya última compra cambió el costo por vara respecto de la anterior.
//   opts.hoy: 'YYYY-MM-DD' · opts.dias: ventana (21) · opts.umbralPct: cambio mínimo (10)
//   opts.limites: límites de categoría (si no, los vigentes)
// Devuelve [{ prod, antes, ahora, pct, fecha, catAntes, catAhora, cambioCategoria, subio }]
// con los cambios de categoría primero y después por tamaño del cambio.
export function cambiosDePrecio(compras, opts = {}){
  const { hoy, dias = 21, umbralPct = 10, limites } = opts;
  const vistos = new Set();
  const out = [];
  (compras || []).forEach(c => {
    if(!c || c.anulado || !String(c.prod || '').trim() || NO_ES_FLOR.test(c.prod)) return;
    const clave = claveUnificada(c.prod);
    if(vistos.has(clave)) return;
    vistos.add(clave);
    const hist = historialCostoVara(c.prod, compras);
    if(hist.length < 2) return;
    const [ult, prev] = hist;
    if(!(ult.costoVara > 0) || !(prev.costoVara > 0)) return;
    if(hoy && diasEntre(ult.fecha, hoy) > dias) return;
    const pct = (ult.costoVara - prev.costoVara) / prev.costoVara * 100;
    const catAntes = categoriaVara(prev.costoVara, limites);
    const catAhora = categoriaVara(ult.costoVara, limites);
    const cambioCategoria = !!(catAntes && catAhora && catAntes.id !== catAhora.id);
    if(!cambioCategoria && Math.abs(pct) < umbralPct) return;
    out.push({
      prod: c.prod, antes: prev.costoVara, ahora: ult.costoVara, pct, fecha: ult.fecha,
      catAntes, catAhora, cambioCategoria, subio: ult.costoVara > prev.costoVara,
    });
  });
  return out.sort((a, b) =>
    (b.cambioCategoria - a.cambioCategoria) || (Math.abs(b.pct) - Math.abs(a.pct)));
}

// Composiciones que usan la flor y cuánto cambia el costo de cada una.
//   recetas: [{ nombre, ings:[{prod, qty, unidad}] }]
//   arreglos: { zona: [{prod, qty, unidad}] } (composiciones del hotel)
//   varasDe(ing): cantidad del ingrediente expresada en varas
// Devuelve [{ nombre, tipo:'receta'|'hotel', varas, dif }] (dif en $, más grande primero).
export function impactoEnComposiciones(prod, antes, ahora, { recetas = [], arreglos = {}, varasDe = (i => +i.qty || 0) } = {}){
  const out = [];
  const sumar = (nombre, tipo, ings) => {
    const varas = (ings || []).filter(g => mismoArticulo(g.prod, prod)).reduce((s, g) => s + (varasDe(g) || 0), 0);
    if(varas > 0) out.push({ nombre, tipo, varas, dif: (ahora - antes) * varas });
  };
  (recetas || []).forEach(r => sumar(r.nombre, 'receta', r.ings));
  Object.keys(arreglos || {}).forEach(z => sumar(z, 'hotel', arreglos[z]));
  return out.sort((a, b) => Math.abs(b.dif) - Math.abs(a.dif));
}

// Frase corta para el resumen del día. null si no hay cambios.
export function resumenCambios(cambios){
  if(!cambios || !cambios.length) return null;
  const cat = cambios.filter(c => c.cambioCategoria && c.subio);
  const suben = cambios.filter(c => c.subio).length;
  if(cat.length) return `${cat.length} flor${cat.length !== 1 ? 'es' : ''} subió de categoría: ${cat.slice(0, 3).map(c => c.prod).join(', ')}${cat.length > 3 ? '…' : ''}`;
  return `${cambios.length} flor${cambios.length !== 1 ? 'es' : ''} cambió de precio (${suben} subieron)`;
}
