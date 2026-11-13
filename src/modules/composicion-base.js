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
// factor: fracción de la base a pedir (1 = toda; 0,3 = reposición del viernes).
// areas: [{area, ings:[{prod, qty, unidad}]}]; vppDe(prod) → varas por paquete o 0/null.
export function sumarBaseHotel(areas, vppDe, factor = 1){
  const porProd = new Map();
  (areas||[]).forEach(({area, ings}) => (ings||[]).forEach(ing => {
    if(!ing || !ing.prod) return;
    const q = +ing.qty || 0;
    const vpp = +vppDe(ing.prod) || 0;
    const color = String(ing.color||'').trim();
    const clave = ing.prod + '||' + color.toLowerCase();   // misma flor en otro color = otro renglón
    let o = porProd.get(clave);
    if(!o){ o = { prod:ing.prod, color, varas:0, paq:0, sinDato:0, areas:[], porArea:[] }; porProd.set(clave, o); }
    // Cuánto le toca a cada área, en la unidad en que está cargada la composición
    if(area && q > 0){
      const unidad = ing.unidad === 'paq' ? 'paq' : 'vara';
      const prev = o.porArea.find(x => x.area === area && x.unidad === unidad);
      if(prev) prev.qty += q; else o.porArea.push({ area, qty:q, unidad });
    }
    if(ing.unidad === 'paq'){ o.paq += q; }
    else if(vpp > 0){ o.varas += q; }
    else { o.sinDato += q; }
    o.vpp = vpp || o.vpp || 0;
    if(area && !o.areas.includes(area)) o.areas.push(area);
  }));
  return [...porProd.values()].map(o => {
    const total = (o.paq + (o.vpp > 0 ? o.varas / o.vpp : 0) + o.sinDato) * factor;
    // tolerancia por decimales flotantes (3 × 0,33 + …)
    let qty = Math.ceil(Math.round(total * 1000) / 1000);
    if(qty <= 0) qty = 1;
    return { prod:o.prod, color:o.color, qty, varas: o.vpp > 0 ? +(o.varas + o.paq * o.vpp).toFixed(2) : null, vpp:o.vpp || 0, areas:o.areas, porArea:o.porArea.map(x => ({ area:x.area, unidad:x.unidad, qty:+(x.qty * factor).toFixed(3) })) };
  });
}
