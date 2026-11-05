// ── CATEGORÍA DE VARA SEGÚN SU COSTO ACTUAL ───────────────────────────────────
// El mercado de flores es volátil: una flor que normalmente es "de estación"
// (Lisianthus, San Vicente…) puede estar cara una semana y entrar como
// importada o premium. La categoría NO es fija de la flor: se calcula siempre
// con el costo por vara vigente y los límites que define gerencia.
//
//   Estación  → costo por vara menor al límite "importada"
//   Importada → desde el límite "importada" hasta el límite "premium"
//   Premium   → desde el límite "premium" en adelante
//
// Los límites se guardan en cotizadorConfig.categoriasVara (mismo nodo de
// Firebase que el margen del cotizador, así se sincroniza solo).

import { mismoArticulo } from './articulos-base.js';
import { esc, parseMoney } from './utils.js';

// cotizador.js registra acá cómo leer su cotizadorConfig (así este módulo no
// depende de cotizador.js y se puede probar suelto).
let _cfg = () => ({});
let _precioVara = () => 0;
export function usarConfigCategoriaVara(fn, precioVara){ _cfg = fn; if(precioVara) _precioVara = precioVara; }

export const LIMITES_VARA_DEFAULT = { importada: 2500, premium: 5000 };

export const CATEGORIAS_VARA = {
  estacion:  { id:'estacion',  nombre:'Vara de estación', corto:'Estación'  },
  importada: { id:'importada', nombre:'Vara importada',   corto:'Importada' },
  premium:   { id:'premium',   nombre:'Vara premium',     corto:'Premium'   },
};

// Límites vigentes (si están mal cargados, vuelve a los de por defecto).
export function limitesCategoriaVara(cfg = _cfg()){
  const c = (cfg && cfg.categoriasVara) || {};
  let importada = +c.importada > 0 ? +c.importada : LIMITES_VARA_DEFAULT.importada;
  let premium   = +c.premium   > 0 ? +c.premium   : LIMITES_VARA_DEFAULT.premium;
  if(premium <= importada) premium = importada * 2;
  return { importada, premium };
}

// Categoría de una vara a partir de su costo. null si no hay costo.
export function categoriaVara(costoVara, limites = limitesCategoriaVara()){
  const c = +costoVara || 0;
  if(!(c > 0)) return null;
  if(c >= limites.premium) return CATEGORIAS_VARA.premium;
  if(c >= limites.importada) return CATEGORIAS_VARA.importada;
  return CATEGORIAS_VARA.estacion;
}

// Pastilla con la categoría. opts.largo = nombre completo ("Vara premium").
export function badgeCategoriaVara(costoVara, opts = {}){
  const cat = categoriaVara(costoVara);
  if(!cat) return '';
  const lim = limitesCategoriaVara();
  const pesos = n => '$' + Math.round(n).toLocaleString('es-AR');
  const rango = cat.id==='estacion' ? `menos de ${pesos(lim.importada)}`
    : cat.id==='importada' ? `de ${pesos(lim.importada)} a ${pesos(lim.premium)}`
    : `${pesos(lim.premium)} o más`;
  const title = `Hoy entra como ${cat.nombre.toLowerCase()}: ${pesos(costoVara)} la vara (${rango})`;
  return `<span class="cat-vara cat-vara-${cat.id}" title="${esc(title)}">${opts.largo ? cat.nombre : cat.corto}</span>`;
}

// Pastilla para un producto por su nombre, con el costo por vara vigente del
// cotizador (el mismo que usan los costos de composiciones).
export function badgeCategoriaVaraDe(prod, opts = {}){
  return badgeCategoriaVara(prod ? _precioVara(prod) : 0, opts);
}

// ── Historial de costo por vara de un producto (Compras Florería) ────────────
// Cada compra válida (no anulada, con precio) con su costo por vara. Las varas
// por paquete son las de esa compra o, si no las tiene, las últimas conocidas
// hasta esa fecha. Más reciente primero. `excluir`: una compra a dejar afuera
// (la que se está cargando, para comparar contra lo anterior).
export function historialCostoVara(prod, compras, excluir = null){
  if(!String(prod||'').trim()) return [];
  // Mismo artículo aunque esté escrito distinto (Anémonas / anemonas).
  const propias = (compras||[])
    .filter(c => c !== excluir && !c.anulado && mismoArticulo(c.prod, prod) && parseMoney(c.costo) > 0)
    .sort((a,b) => String(a.fecha||'').localeCompare(String(b.fecha||'')));
  let vppConocido = 0;
  const out = [];
  propias.forEach(c => {
    const v = parseFloat(c.varasPorPaq) || 0;
    if(v > 1) vppConocido = v;
    const vpp = v > 1 ? v : vppConocido;
    if(vpp > 1) out.push({ fecha: c.fecha||'', costoVara: parseMoney(c.costo) / vpp });
  });
  return out.reverse();
}

// Cartel que va al lado del precio al cargar una compra (o en la recepción):
// dice cómo entra la vara HOY y avisa si cambió de categoría respecto de lo
// que figuraba hasta ahora (para no agarrarla "por costumbre").
//   costoNuevo: costo por vara de lo que se está cargando (0 si no se sabe)
//   costoPrevio: costo por vara vigente hasta ahora (0 si no hay)
//   opts.sinDato: html si no hay costo nuevo · opts.nota: aclaración al pie
export function cartelCategoriaVara(costoNuevo, costoPrevio, opts = {}){
  const nueva = categoriaVara(costoNuevo);
  if(!nueva) return opts.sinDato || '';
  const previa = categoriaVara(costoPrevio);
  const pesos = n => '$' + Math.round(n).toLocaleString('es-AR');
  const cambio = previa && previa.id !== nueva.id;
  const subio = cambio && ['estacion','importada','premium'].indexOf(nueva.id) > ['estacion','importada','premium'].indexOf(previa.id);
  return `<div class="cat-vara-cartel cat-vara-cartel-${nueva.id}${cambio?' cat-vara-cartel-cambio':''}">
    <div><span style="font-weight:400">En este momento entra como</span> <strong>${nueva.nombre.toLowerCase()}</strong> · ${pesos(costoNuevo)} la vara</div>
    ${cambio
      ? `<div class="cat-vara-cartel-aviso">${subio?'Ojo: subió':'Bajó'} de categoría. Hasta ahora figuraba como ${previa.nombre.toLowerCase()} (${pesos(costoPrevio)} la vara).</div>`
      : (previa ? `<div class="cat-vara-cartel-sub">Sigue igual que antes (${pesos(costoPrevio)} la vara).</div>` : '')}
    ${opts.nota ? `<div class="cat-vara-cartel-sub">${esc(opts.nota)}</div>` : ''}
  </div>`;
}

// ── Configuración de límites (gerencia) ──────────────────────────────────────
export function htmlLimitesCategoriaVara(esGerencia){
  const lim = limitesCategoriaVara();
  const dis = esGerencia ? '' : 'disabled title="Solo gerencia puede cambiar los límites"';
  const inp = (k) => `<input type="number" min="1" step="100" value="${lim[k]}" ${dis} onchange="guardarLimitesCatVara('${k}',this.value)" style="width:100px;border:1px solid var(--light-gray);border-radius:6px;padding:6px 8px;text-align:right;font-size:13px">`;
  return `<div style="display:flex;gap:10px 18px;flex-wrap:wrap;align-items:center;font-size:13px">
    <span><span class="cat-vara cat-vara-estacion">Estación</span> menos de $${lim.importada.toLocaleString('es-AR')}</span>
    <span><span class="cat-vara cat-vara-importada">Importada</span> desde $ ${inp('importada')}</span>
    <span><span class="cat-vara cat-vara-premium">Premium</span> desde $ ${inp('premium')}</span>
  </div>`;
}

// Guarda un límite (solo gerencia) y avisa con onGuardado para refrescar vistas.
export function guardarLimitesCategoriaVara(campo, valor, { fbSave, showToast, onGuardado } = {}){
  if(window.userRole !== 'gerencia'){ showToast?.('Solo gerencia puede cambiar los límites'); return false; }
  const v = Math.round(parseMoney(valor));
  if(!(v > 0)){ showToast?.('Poné un monto mayor a 0'); onGuardado?.(); return false; }
  const lim = { ...limitesCategoriaVara(), [campo]: v };
  if(lim.premium <= lim.importada){
    showToast?.('El límite de premium tiene que ser mayor que el de importada');
    onGuardado?.();
    return false;
  }
  const cfg = _cfg();
  if(!cfg || typeof cfg !== 'object'){ showToast?.('La configuración todavía se está cargando'); return false; }
  cfg.categoriasVara = lim;
  fbSave?.('cotizadorConfig', cfg);
  showToast?.('Límites de categoría guardados');
  onGuardado?.();
  return true;
}
