// ── NAVEGACIÓN INFERIOR MOBILE ──────────────────────────────────────────────
const BOTTOM_NAV_ITEMS = {
  gerencia:  [{icon:'',label:'Inicio',page:'home'},{icon:'',label:'Checklist',page:'checklist'},{icon:'',label:'Eventos',page:'eventos-maison'},{icon:'',label:'Caja',page:'caja'}],
  florista:  [{icon:'',label:'Inicio',page:'home'},{icon:'',label:'Checklist',page:'checklist'},{icon:'',label:'Ramos',page:'ramos-disponibles'},{icon:'',label:'Stock',page:'stock'},{icon:'',label:'Eventos',page:'eventos-maison'}],
  operario:  [{icon:'',label:'Inicio',page:'home'},{icon:'',label:'Eventos',page:'eventos-maison'},{icon:'',label:'Stock',page:'stock'},{icon:'',label:'Precios',page:'lista-precios'}],
  jardinero: [{icon:'',label:'Jardín',page:'jardineria-ops'},{icon:'',label:'Habitac.',page:'hab-ops'},{icon:'',label:'Avisos',page:'recordatorios-jardineria'}],
  compras:   [{icon:'',label:'Compras',page:'compras-floreria'},{icon:'',label:'Stock',page:'stock-admin'},{icon:'',label:'Recepción',page:'recepcion-pedidos'}],
  comercial: [{icon:'',label:'Eventos',page:'eventos-comercial'},{icon:'',label:'Ventas',page:'ventas-externas'},{icon:'',label:'Galería',page:'galeria'},{icon:'',label:'Precios',page:'lista-precios'}],
  ventas:    [{icon:'',label:'Ramos',page:'ramos-disponibles'},{icon:'',label:'Pedidos',page:'pedidos-habitacion'},{icon:'',label:'Precios',page:'lista-precios'}],
  housekeeping: [{icon:'',label:'Habitaciones',page:'control-habitaciones'}],
};

// Íconos de línea (SVG) para la barra inferior móvil, por página
const _BOTTOM_ICON_PATHS = {
  'home':'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  'checklist':'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M8.5 13l2 2 4-4"/>',
  'eventos-maison':'<path d="M4 20l5-13 8 8z"/><path d="M14 4l1 2M18 3l-1 3M20 8l-2 1"/>',
  'eventos-comercial':'<path d="M4 20l5-13 8 8z"/><path d="M14 4l1 2M18 3l-1 3M20 8l-2 1"/>',
  'ramos-disponibles':'<circle cx="12" cy="7" r="3"/><path d="M12 10v8M8 14l4 4 4-4"/>',
  'stock':'<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  'stock-admin':'<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  'lista-precios':'<path d="M4 12l8-8h6v6l-8 8z"/><circle cx="15" cy="9" r="1.2"/>',
  'jardineria-ops':'<path d="M11 20C6 20 4 15 4 11c5 0 7 4 7 9z"/><path d="M13 20c5 0 7-5 7-11-5 0-7 4-7 11z"/>',
  'hab-ops':'<path d="M3 8v10M3 12h18v6M21 12v-2a2 2 0 00-2-2h-5v4"/><circle cx="7" cy="11" r="1.5"/>',
  'control-habitaciones':'<path d="M3 8v10M3 12h18v6M21 12v-2a2 2 0 00-2-2h-5v4"/><circle cx="7" cy="11" r="1.5"/>',
  'recordatorios-jardineria':'<path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 01-3.4 0"/>',
  'compras-floreria':'<path d="M3 4h2l2 12h11l2-8H6"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
  'recepcion-pedidos':'<path d="M3 12l3-8h12l3 8v6H3z"/><path d="M3 12h5l1 2h6l1-2h5"/>',
  'ventas-externas':'<path d="M4 12l8-8h6v6l-8 8z"/><circle cx="15" cy="9" r="1.2"/>',
  'galeria':'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
  'pedidos-habitacion':'<path d="M4 21V4h11v17M15 9h5v12M8 8h3M8 12h3M8 16h3"/>',
  'caja':'<path d="M3 8h15a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M3 8V6a2 2 0 012-2h11v4"/><circle cx="17" cy="13.5" r="1.3"/>',
};
function _bottomIcon(page){
  const p = _BOTTOM_ICON_PATHS[page] || '<circle cx="12" cy="12" r="8"/>';
  return '<svg viewBox="0 0 24 24">'+p+'</svg>';
}

export function renderBottomNav(role, esJardinero) {
  const nav = document.getElementById('bottom-nav');
  if(!nav) return;
  let items = BOTTOM_NAV_ITEMS[role] || [];
  // Florista que también es jardinero (ej. Ivan): barra combinada de ambos mundos
  if(role === 'florista' && esJardinero){
    items = [
      {icon:'',label:'Inicio',page:'home'},
      {icon:'',label:'Checklist',page:'checklist'},
      {icon:'',label:'Eventos',page:'eventos-maison'},
      {icon:'',label:'Jardín',page:'jardineria-ops'},
      {icon:'',label:'Habitac.',page:'hab-ops'},
    ];
  }
  nav.innerHTML = items.map(it =>
    `<div class="bottom-nav-item" data-page="${it.page}" onclick="navigate('${it.page}',null);updateBottomNav('${it.page}')">
      <span class="bottom-nav-icon">${_bottomIcon(it.page)}</span>
      <span class="bottom-nav-label">${it.label}</span>
    </div>`
  ).join('');
}

export function updateBottomNav(pageId) {
  document.querySelectorAll('.bottom-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pageId);
  });
}
