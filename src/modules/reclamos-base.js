// ── RECLAMOS AL PROVEEDOR (lógica pura) ──────────────────────────────────────
// Detecta lo que llegó de menos o en mal estado y arma el mensaje para reclamar.

const _n = x => { const v = parseFloat(x); return isFinite(v) ? v : 0; };
const _ddmm = f => { const p = String(f || '').split('-'); return p[2] ? `${p[2]}/${p[1]}` : ''; };

// Compras con algo para reclamar, agrupadas por proveedor.
//   Faltante: ya se controló y llegaron menos paquetes que los pedidos.
//   Mal estado: tildado en Recepción (con o sin aclaración).
// Se ignoran las anuladas, las ya reclamadas y las de hace más de `dias` días.
export function reclamosPendientes(compras, { hoy, dias = 30 } = {}){
  const lim = hoy ? new Date(new Date(hoy + 'T12:00:00Z').getTime() - dias * 86400000).toISOString().slice(0, 10) : '';
  const grupos = new Map();
  (compras || []).forEach((c, idx) => {
    if(!c || c.anulado || c.noLlego || c.reclamado) return;
    if(lim && c.fecha && String(c.fecha).slice(0, 10) < lim) return;
    const controlada = c.estado === 'controlado' || c.estado === 'recibido';
    const pedidos = _n(c.qty), recibidos = _n(c.paqRecibidos);
    const faltan = controlada && pedidos > 0 && recibidos < pedidos ? pedidos - recibidos : 0;
    const malEstado = !!c.recepAlerta;
    if(!faltan && !malEstado) return;
    const prov = String(c.prov || '').trim() || 'Sin proveedor';
    if(!grupos.has(prov)) grupos.set(prov, { prov, items: [] });
    grupos.get(prov).items.push({ idx, prod: c.prod || '', fecha: c.fecha || '', pedidos, recibidos, faltan, malEstado, obs: String(c.recepObs || '').trim(), foto: !!c.recepFoto });
  });
  return [...grupos.values()].sort((a, b) => a.prov.localeCompare(b.prov, 'es'));
}

export const cantidadReclamos = grupos => grupos.reduce((s, g) => s + g.items.length, 0);

// Mensaje listo para copiar o mandar por WhatsApp.
export function mensajeReclamo(grupo){
  const lineas = grupo.items.map(it => {
    const partes = [];
    if(it.faltan > 0) partes.push(`faltaron ${it.faltan} paq (pedimos ${it.pedidos}, llegaron ${it.recibidos})`);
    if(it.malEstado) partes.push('llegó en mal estado' + (it.obs ? ` (${it.obs})` : ''));
    const cuando = it.fecha ? ` — pedido del ${_ddmm(it.fecha)}` : '';
    return `• ${it.prod}${cuando}: ${partes.join(' y ')}`;
  });
  return `Hola! Les escribimos de Florería Duhau. Revisando el último pedido encontramos:\n${lineas.join('\n')}\n\n¿Nos pueden ayudar a resolverlo (reposición o nota de crédito)? Gracias!`;
}
