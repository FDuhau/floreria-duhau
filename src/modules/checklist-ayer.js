// ── CHECKLIST: lo que quedó sin hacer ayer (lógica pura) ─────────────────────
// Una tarea "quedó pendiente" si ayer tenía responsable asignado y no se hizo
// (ni tildada ni con hora de Fin). Las que nadie tenía asignadas no cuentan:
// son la mayoría de la planilla y no son un compromiso que se haya incumplido.

// Devuelve [{ i, resp, hoyResp, hoyHecha }] para los índices de tarea pendientes de ayer.
//   ayer / hoy: estado del día { checked, fin, responsable } (arrays por tarea)
export function pendientesDeAyer(ayer, hoy, cantTareas){
  if(!ayer) return [];
  const out = [];
  for(let i = 0; i < cantTareas; i++){
    const resp = String(ayer.responsable?.[i] || '').trim();
    if(!resp) continue;
    if(ayer.checked?.[i] || ayer.fin?.[i]) continue;
    const hoyHecha = !!(hoy?.checked?.[i] || hoy?.fin?.[i]);
    out.push({ i, resp, hoyResp: String(hoy?.responsable?.[i] || '').trim(), hoyHecha });
  }
  return out;
}

// De esas, las que hoy se pueden pasar: no están hechas y hoy no tienen responsable.
export const pasablesAHoy = lista => lista.filter(p => !p.hoyHecha && !p.hoyResp);

// Día anterior dentro de la semana de trabajo (lunes a sábado). null si es lunes o no es día de trabajo.
export function diaAnterior(dia, dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']){
  const k = dias.indexOf(dia);
  return k > 0 ? dias[k - 1] : null;
}
