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
