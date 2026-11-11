// ── CHECKLIST: repartir los Nuevo atrasados en lo que queda de la semana (lógica pura) ──
// Las zonas vienen ordenadas de más a menos atrasada; las más atrasadas van primero
// (hoy) y la carga queda pareja: los primeros días se llevan la zona extra si no divide justo.
export function repartirNuevos(zonas, dias){
  if(!zonas?.length || !dias?.length) return [];
  const base = Math.floor(zonas.length / dias.length);
  const extra = zonas.length % dias.length;
  const plan = [];
  let k = 0;
  dias.forEach((dia, d) => {
    const cant = base + (d < extra ? 1 : 0);
    if(!cant) return;
    plan.push({ dia, zonas: zonas.slice(k, k + cant) });
    k += cant;
  });
  return plan;
}

// Zonas atrasadas que todavía no tienen un Nuevo planificado (y sin hacer) en la semana.
//   atrasadas: [{sec, zona, ...}] · planificadas: Set de claves "sec|zona" ya programadas
export const sinPlanificar = (atrasadas, planificadas, claveDe) =>
  atrasadas.filter(z => !planificadas.has(claveDe(z)));
