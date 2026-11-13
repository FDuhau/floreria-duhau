// Reparto de un pedido entre áreas. Cuando el pedido automático junta una misma flor de
// varias áreas en un solo renglón, guarda además cuánto le toca a cada una (`reparto`),
// así el florista que controla puede filtrar por área y ver qué flores y cuántas acomodar.
// Sin dependencias: se puede probar solo.

// Un renglón viejo trae las áreas pegadas en `sector` ("Biblioteca, Lobby de Alvear").
export function areasDeSector(sector){
  return String(sector || '').split(',').map(s => s.trim()).filter(Boolean);
}

// Áreas de una orden: las del reparto si lo tiene; si no, las del sector.
export function areasDeOrden(o){
  if(o && Array.isArray(o.reparto) && o.reparto.length) return o.reparto.map(r => r.area).filter(Boolean);
  return areasDeSector(o && o.sector);
}

export function ordenEnArea(o, area){
  return !area || areasDeOrden(o).includes(area);
}

function _n(q){ return String(+(+q || 0).toFixed(2)).replace('.', ','); }

// "2 varas" / "1 vara" / "0,5 paq."
export function textoCantReparto(r){
  const q = +r.qty || 0;
  return r.unidad === 'paq' ? `${_n(q)} paq.` : `${_n(q)} ${q === 1 ? 'vara' : 'varas'}`;
}

// Lista de áreas distintas de un conjunto de órdenes, ordenada.
export function areasDeOrdenes(ordenes){
  const set = new Set();
  (ordenes || []).forEach(o => areasDeOrden(o).forEach(a => set.add(a)));
  return [...set].sort((a, b) => a.localeCompare(b, 'es'));
}

// Lo que le toca a un área de esta orden (o null si no hay reparto de esa área).
export function repartoDeArea(o, area){
  if(!area || !o || !Array.isArray(o.reparto)) return null;
  return o.reparto.find(r => r.area === area) || null;
}
