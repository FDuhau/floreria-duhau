// ── SUGERENCIA DE PEDIDO A PROVEEDORES (lógica pura) ─────────────────────────
// Con el stock actual, lo que ya viene en camino y lo comprometido en eventos,
// calcula qué conviene pedir, en paquetes, con costo estimado, agrupado por
// proveedor y con aviso si la flor termina su temporada.

const num = x => +x || 0;

// Un renglón de stock entra en la sugerencia si lo que va a quedar libre
// (actual + en camino − comprometido) queda por debajo del mínimo.
// Se pide hasta el máximo (o el doble del mínimo si no hay máximo).
export function sugerirPedido({
  stock = [],
  comprometido = () => 0,
  enPedido = () => 0,
  varasPorPaq = () => 0,
  ultimaCompra = () => null,     // prod → { precio (por paquete), prov } | null
  estadoTemporada = () => null,  // prod → 'termina' | 'fuera' | 'llega' | ... | null
} = {}){
  const items = [];
  for(const s of stock){
    if(!s || !String(s.prod || '').trim()) continue;
    const min = num(s.min), actual = num(s.actual);
    const comp = num(comprometido(s)), camino = num(enPedido(s));
    const libre = actual + camino - comp;
    if(!(min > 0) && !(comp > actual + camino)) continue;
    if(libre >= min && libre >= 0) continue;
    const objetivo = num(s.max) > min ? num(s.max) : Math.max(min * 2, 1);
    const faltan = Math.max(Math.ceil(objetivo - libre), 1);
    const vpp = num(varasPorPaq(s.prod));
    const paquetes = vpp > 1 ? Math.ceil(faltan / vpp) : null;
    const compra = ultimaCompra(s.prod);
    const precioPaq = compra ? num(compra.precio) : 0;
    const costo = paquetes && precioPaq ? paquetes * precioPaq : null;
    const motivo = actual < min ? 'bajo' : (comp > 0 && actual - comp < min ? 'evento' : 'bajo');
    items.push({
      prod: s.prod, color: s.color || '', area: s.area || '',
      actual, min, objetivo, comprometido: comp, enCamino: camino, libre,
      faltan, varasPorPaq: vpp > 1 ? vpp : null, paquetes, precioPaq, costo,
      prov: (compra && compra.prov) || '', motivo,
      temporada: estadoTemporada(s.prod) || null,
      // 0 = sin nada, 1 = recién llega al mínimo: más chico, más urgente
      urgencia: min > 0 ? Math.max(libre, 0) / min : 0,
    });
  }
  items.sort((a, b) => a.urgencia - b.urgencia || String(a.prod).localeCompare(String(b.prod), 'es'));

  const grupos = new Map();
  for(const it of items){
    const k = it.prov || '';
    if(!grupos.has(k)) grupos.set(k, { prov: k, items: [], costo: 0, sinCosto: 0 });
    const g = grupos.get(k);
    g.items.push(it);
    if(it.costo != null) g.costo += it.costo; else g.sinCosto++;
  }
  const porProveedor = [...grupos.values()].sort((a, b) =>
    (a.prov === '') - (b.prov === '') || a.prov.localeCompare(b.prov, 'es'));
  return { items, porProveedor, costoTotal: items.reduce((s, i) => s + (i.costo || 0), 0) };
}

// Aviso según la temporada de la flor ('' si no hay nada que decir).
export function avisoTemporada(estado){
  if(estado === 'termina') return 'Último mes de temporada: conviene comprar de más ahora';
  if(estado === 'fuera') return 'Fuera de temporada: puede venir caro o no conseguirse';
  if(estado === 'llega') return 'Todavía no es temporada (empieza el mes que viene)';
  return '';
}

// Texto del pedido de un proveedor, listo para pegar en WhatsApp o mail.
export function textoPedido(grupo, { fecha = '' } = {}){
  const lineas = grupo.items.map(i => {
    const nombre = i.color ? `${i.prod} ${i.color}` : i.prod;
    return i.paquetes
      ? `• ${i.paquetes} paq de ${nombre} (${i.paquetes * i.varasPorPaq} varas)`
      : `• ${nombre}: ${i.faltan} varas`;
  });
  return `Hola${grupo.prov ? ' ' + grupo.prov : ''}, te paso el pedido${fecha ? ' para ' + fecha : ''}:\n${lineas.join('\n')}\nGracias!`;
}
