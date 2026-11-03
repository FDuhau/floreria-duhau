// ── NAVEGACIÓN PRINCIPAL ────────────────────────────────────────────────────
// Menú lateral agrupado por "familias" (Eventos, Stock, Cotizador…). Cada
// familia agrupa páginas relacionadas que antes aparecían repetidas en varios
// menús; adentro de la página se muestran como pestañas. Qué páginas ve cada
// rol se define en ROLE_PAGES (un solo lugar, en vez de buscar ítems por texto).

const ICONS = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  checklist: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M8.5 13l2 2 4-4"/>',
  tareas: '<path d="M4 6h16M4 12h10M4 18h7"/><path d="M16 17l2 2 4-4"/>',
  eventos: '<path d="M4 20l5-13 8 8z"/><path d="M14 4l1 2M18 3l-1 3M20 8l-2 1"/>',
  ventas: '<path d="M4 12l8-8h6v6l-8 8z"/><circle cx="15" cy="9" r="1.2"/>',
  cotizador: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h8"/>',
  catalogo: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
  stock: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  compras: '<path d="M3 4h2l2 12h11l2-8H6"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
  jardin: '<path d="M11 20C6 20 4 15 4 11c5 0 7 4 7 9z"/><path d="M13 20c5 0 7-5 7-11-5 0-7 4-7 11z"/>',
  equipo: '<circle cx="9" cy="8" r="3"/><path d="M2.5 20c0-3 3-5 6.5-5s6.5 2 6.5 5"/><path d="M16 6a3 3 0 010 6M22 20c0-2.4-1.8-4.3-4.5-5"/>',
  caja: '<path d="M3 8h15a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M3 8V6a2 2 0 012-2h11v4"/><circle cx="17" cy="13.5" r="1.3"/>',
  reportes: '<path d="M4 20V4M4 20h16"/><rect x="7" y="12" width="3" height="5"/><rect x="12" y="8" width="3" height="9"/><rect x="17" y="5" width="3" height="12"/>',
  mas: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
};
export function navIcon(name){
  return '<svg viewBox="0 0 24 24">' + (ICONS[name] || '<circle cx="12" cy="12" r="8"/>') + '</svg>';
}

// [página, etiqueta de la pestaña, oculta en pestañas?]
export const NAV_SECCIONES = [
  { titulo: 'Día a día', familias: [
    { id: 'inicio', label: 'Inicio', icon: 'home', pages: [['home', 'Inicio'], ['home-hyatt', 'Inicio']] },
    { id: 'checklist', label: 'Checklist', icon: 'checklist', pages: [['checklist', 'Checklist diaria']] },
    { id: 'tareas', label: 'Tareas pendientes', icon: 'tareas', pages: [['tareas-gerencia', 'Tareas pendientes']] },
    { id: 'eventos', label: 'Eventos', icon: 'eventos', pages: [
      ['eventos-comercial', 'Registro'], ['eventos-maison', 'Tablero'], ['historial-eventos', 'Historial'],
      ['eventos-sin-floreria', 'Sin florería'], ['compra-evento', 'Compra por evento'], ['rentabilidad-eventos', 'Rentabilidad'],
    ] },
    { id: 'jardin', label: 'Jardín', icon: 'jardin', pages: [
      ['jardineria-ops', 'Tareas'], ['control-jardineria', 'Seguimiento'], ['hab-ops', 'Visitas a habitaciones'],
      ['control-habitaciones', 'Control de habitaciones'], ['recordatorios-jardineria', 'Recordatorios'], ['stock-jardineria', 'Stock de plantas'],
    ] },
  ] },
  { titulo: 'Comercial', familias: [
    { id: 'ventas', label: 'Ventas', icon: 'ventas', pages: [
      ['ventas-externas', 'Ventas externas'], ['pedidos-habitacion', 'Pedidos de habitación'], ['crm-clientes', 'Clientes'],
    ] },
    { id: 'cotizador', label: 'Cotizador', icon: 'cotizador', pages: [
      ['cotizador', 'Cotizar'], ['cotizador-ops', 'Cotizar'], ['cotizador-eventos-hyatt', 'Cotizar evento'],
      ['presupuestos', 'Presupuestos'], ['cotizar-presupuesto', 'Armar cotización', true], ['costo-varas', 'Costo de varas'],
    ] },
    { id: 'catalogo', label: 'Catálogo', icon: 'catalogo', pages: [
      ['lista-precios', 'Precios'], ['ramos-disponibles', 'Ramos disponibles'], ['recetas-arreglos', 'Composiciones'], ['galeria', 'Galería'],
    ] },
  ] },
  { titulo: 'Gestión', familias: [
    { id: 'stock', label: 'Stock', icon: 'stock', pages: [
      ['stock', 'Florería'], ['stock-admin', 'Gestión de stock'], ['inventario', 'Por ubicación'], ['floreros', 'Floreros'], ['velas', 'Velas'],
    ] },
    { id: 'compras', label: 'Compras', icon: 'compras', pages: [
      ['compras-floreria', 'Florería'], ['compras-jardineria', 'Jardinería y general'], ['recepcion-pedidos', 'Recepción de pedidos'],
      ['proveedores', 'Proveedores'], ['precio-comparacion', 'Comparar precios'],
    ] },
    { id: 'equipo', label: 'Equipo', icon: 'equipo', pages: [
      ['legajo', 'Legajos'], ['control-horarios', 'Horarios'], ['evaluaciones', 'Evaluaciones'], ['liquidacion', 'Horas extra'], ['reportes-equipo', 'Reporte del equipo'],
    ] },
    { id: 'caja', label: 'Caja y cierres', icon: 'caja', pages: [
      ['caja', 'Caja'], ['cierre-dia', 'Cierre del día'], ['cierre-mensual', 'Cierre mensual'],
    ] },
    { id: 'reportes', label: 'Reportes', icon: 'reportes', pages: [
      ['reportes-ventas', 'Ventas'], ['reportes-hotel', 'Costo del hotel'],
    ] },
  ] },
];

const FAMILIAS = NAV_SECCIONES.flatMap(s => s.familias);
const TODAS = FAMILIAS.flatMap(f => f.pages.map(p => p[0]));

// Páginas que puede ver cada rol. Mantiene los mismos permisos que tenía el
// menú anterior (que se armaba ocultando ítems por texto en applyRole).
const ROLE_PAGES = {
  gerencia: TODAS.filter(p => !['stock', 'cotizador-ops', 'cotizador-eventos-hyatt', 'home-hyatt'].includes(p)),
  operario: ['home', 'eventos-maison', 'stock', 'cotizador-ops', 'floreros', 'velas', 'lista-precios'],
  florista: ['home', 'checklist', 'eventos-maison', 'stock', 'floreros', 'velas', 'cotizador-ops', 'recepcion-pedidos',
    'lista-precios', 'ramos-disponibles', 'galeria', 'recetas-arreglos'],
  comercial: ['home', 'eventos-comercial', 'ventas-externas', 'pedidos-habitacion', 'crm-clientes', 'cotizador', 'presupuestos', 'cotizar-presupuesto',
    'costo-varas', 'lista-precios', 'ramos-disponibles', 'galeria'],
  ventas: ['home-hyatt', 'cotizador-eventos-hyatt', 'pedidos-habitacion', 'lista-precios', 'ramos-disponibles'],
  compras: ['compras-floreria', 'compras-jardineria', 'recepcion-pedidos', 'proveedores', 'precio-comparacion', 'compra-evento',
    'stock-admin', 'floreros', 'velas', 'reportes-hotel'],
  jardinero: ['jardineria-ops', 'hab-ops', 'recordatorios-jardineria', 'stock-jardineria'],
  housekeeping: ['control-habitaciones'],
};
const JARDIN_EXTRA = ['jardineria-ops', 'hab-ops', 'recordatorios-jardineria', 'stock-jardineria'];

let _permitidas = new Set(ROLE_PAGES.gerencia);

export function paginasPermitidas(role, esJardinero){
  const base = ROLE_PAGES[role] || ROLE_PAGES.gerencia;
  return new Set(role === 'florista' && esJardinero ? [...base, ...JARDIN_EXTRA] : base);
}

export function familiaDe(pageId){
  return FAMILIAS.find(f => f.pages.some(p => p[0] === pageId)) || null;
}

function _pestanas(fam){
  return fam.pages.filter(p => _permitidas.has(p[0]) && !p[2]);
}

export function primeraPagina(fam){
  const t = _pestanas(fam);
  return t.length ? t[0][0] : null;
}

export function renderSidebarNav(role, esJardinero){
  _permitidas = paginasPermitidas(role, esJardinero);
  const cont = document.getElementById('sidebar-nav');
  if(!cont) return;
  cont.innerHTML = NAV_SECCIONES.map(sec => {
    const items = sec.familias.map(f => {
      const destino = primeraPagina(f);
      if(!destino) return '';
      return `<div class="nav-item" data-family="${f.id}" role="link" tabindex="0" onclick="navigate('${destino}',this)" onkeydown="if(event.key==='Enter')this.click()">
        <span class="nav-icon">${navIcon(f.icon)}</span><span class="nav-label">${f.label}</span>${f.id === 'jardin' ? '<span id="nav-rec-jard"></span>' : ''}</div>`;
    }).join('');
    return items ? `<div class="nav-section-label">${sec.titulo}</div>${items}` : '';
  }).join('');
}

// Llamada desde navigate(): marca la familia activa en el menú, arma las
// pestañas de la página y devuelve el texto del encabezado.
export function marcarNavegacion(pageId){
  const fam = familiaDe(pageId);
  document.querySelectorAll('#sidebar-nav .nav-item').forEach(n =>
    n.classList.toggle('active', !!fam && n.dataset.family === fam.id));
  document.querySelectorAll('.section-tabs').forEach(t => t.remove());
  if(!fam) return null;
  const tabs = _pestanas(fam);
  const actual = fam.pages.find(p => p[0] === pageId);
  const pg = document.getElementById('page-' + pageId);
  if(pg && tabs.length > 1){
    const html = `<nav class="section-tabs" aria-label="${fam.label}">${tabs.map(([id, label]) =>
      `<button type="button" class="section-tab${id === pageId ? ' active' : ''}" onclick="navigate('${id}')">${label}</button>`).join('')}</nav>`;
    pg.insertAdjacentHTML('afterbegin', html);
    pg.querySelector('.section-tab.active')?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  }
  if(tabs.length > 1 && actual) return { familia: fam.label, pagina: actual[1] };
  return { familia: fam.label, pagina: null };
}

export function puedeVer(pageId){
  return _permitidas.has(pageId) || !familiaDe(pageId);
}
