// ── COMPOSICIONES: cuántos arreglos se pueden armar con el stock (lógica pura) ──

export const precioSugerido = (costo, margen) =>
  costo > 0 ? Math.round(costo * (1 + (Number(margen) || 0) / 100)) : 0;

// ings: [{prod, ...}]  ·  varasDe(ing) → varas por unidad de arreglo  ·  disponibleDe(prod) → varas en stock
// Devuelve null si no hay ingredientes con cantidad. Si hay: { n, limitante, sinStock:[prod] }
//   n: cuántos arreglos alcanzan (el ingrediente que más se acaba manda)
//   limitante: el ingrediente que corta
//   sinStock: ingredientes con 0 en stock
export function unidadesPosibles(ings, varasDe, disponibleDe){
  let n = Infinity, limitante = '';
  const sinStock = [];
  let hay = false;
  for(const ing of ings || []){
    const v = Number(varasDe(ing)) || 0;
    if(!(v > 0)) continue;
    hay = true;
    const disp = Math.max(Number(disponibleDe(ing.prod)) || 0, 0);
    if(disp <= 0) sinStock.push(ing.prod);
    const k = Math.floor((disp + 1e-9) / v);
    if(k < n){ n = k; limitante = ing.prod; }
  }
  return hay ? { n, limitante, sinStock } : null;
}

// Suma la base fija del hotel por flor entre todas las áreas elegidas y recién
// ahí la pasa a paquetes (así 0,33 vara en 10 áreas = 3,3 varas = 1 paquete, no 10).
// areas: [{area, ings:[{prod, qty, unidad}]}]; vppDe(prod) → varas por paquete o 0/null.
export function sumarBaseHotel(areas, vppDe){
  const porProd = new Map();
  (areas||[]).forEach(({area, ings}) => (ings||[]).forEach(ing => {
    if(!ing || !ing.prod) return;
    const q = +ing.qty || 0;
    const vpp = +vppDe(ing.prod) || 0;
    let o = porProd.get(ing.prod);
    if(!o){ o = { prod:ing.prod, varas:0, paq:0, sinDato:0, areas:[] }; porProd.set(ing.prod, o); }
    if(ing.unidad === 'paq'){ o.paq += q; }
    else if(vpp > 0){ o.varas += q; }
    else { o.sinDato += q; }
    o.vpp = vpp || o.vpp || 0;
    if(area && !o.areas.includes(area)) o.areas.push(area);
  }));
  return [...porProd.values()].map(o => {
    const total = o.paq + (o.vpp > 0 ? o.varas / o.vpp : 0) + o.sinDato;
    // tolerancia por decimales flotantes (3 × 0,33 + …)
    let qty = Math.ceil(Math.round(total * 1000) / 1000);
    if(qty <= 0) qty = 1;
    return { prod:o.prod, qty, varas: o.vpp > 0 ? +(o.varas + o.paq * o.vpp).toFixed(2) : null, vpp:o.vpp || 0, areas:o.areas };
  });
}
