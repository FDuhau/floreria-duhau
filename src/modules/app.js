// ════════════════════════════════════════
// CONTROL DE VERSIÓN — auto-limpieza de datos locales viejos
// Subí este número cada vez que cambies el formato de datos.
// Cuando un dispositivo detecta una versión distinta a la guardada,
// limpia el localStorage viejo UNA sola vez y recarga. Sin borrar caché a mano.
// ════════════════════════════════════════
const APP_VERSION = '2026-07-24-f';
(function checkAppVersion(){
  try {
    const stored = localStorage.getItem('app_version');
    if(stored !== APP_VERSION){
      // Limpiar solo las claves locales de la app (no toca Firebase ni otras webs)
      const keysToClear = [];
      for(let k=0; k<localStorage.length; k++){
        const key = localStorage.key(k);
        if(key && (key.startsWith('cl_state_') || key === 'cl_history' || key === 'fl_insumos_custom')){
          keysToClear.push(key);
        }
      }
      keysToClear.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('app_version', APP_VERSION);
      // Limpiar TODOS los cachés del service worker para forzar la versión nueva
      // (evita quedar pegado en una versión vieja de la app).
      try { if(window.caches?.keys) window.caches.keys().then(ks => ks.forEach(k => window.caches.delete(k))); } catch(e){}
      // Si había una versión previa (no es primera visita), recargar limpio una vez
      if(stored !== null){
        location.reload();
      }
    }
  } catch(e){ /* localStorage no disponible: la app igual funciona con Firebase */ }
})();

// Mostrar la versión real en el cartelito del topbar (para diagnosticar caché:
// si un dispositivo muestra una versión vieja, está corriendo código viejo).
try {
  const _setVer = () => { const el = document.getElementById('app-version-label'); if(el) el.textContent = 'v' + APP_VERSION; };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _setVer); else _setVer();
} catch(e){}

// ════════════════════════════════════════
// FIREBASE SYNC HELPERS (called after fbReady)
// ════════════════════════════════════════
function fbSave(key, data){
  if(window.fbSet){
    window.fbSet(key, JSON.parse(JSON.stringify(data)));
    // Auditoría automática (excluir los propios logs y datos de sesión)
    const AUDIT_SKIP = ['auditLog','pushTokens','pushBroadcast','loginPasswords','loginAuth','pushSubs'];
    if(!AUDIT_SKIP.includes(key) && window.currentUserLabel){
      const entry = {
        ts: Date.now(),
        iso: new Date().toISOString(),
        user: window.currentUserLabel,
        key
      };
      window.fbSet('auditLog/' + entry.ts, entry);
    }
  }
}

// ¿El usuario está escribiendo/editando un campo dentro de esta página?
// Sirve para posponer re-renders que borrarían lo que está tipeando otro mientras sincroniza.
function estaEditando(pageId){
  const ae = document.activeElement;
  if(!ae) return false;
  if(!['INPUT','TEXTAREA','SELECT'].includes(ae.tagName)) return false;
  const page = document.getElementById(pageId);
  return page ? page.contains(ae) : false;
}
window.estaEditando = estaEditando;

// ════════════════════════════════════════
// DATE
// ════════════════════════════════════════
const DAYS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const NOW = new Date();
// Fecha local (no UTC) para evitar desfase horario en Argentina (UTC-3)
const TODAY_ISO = `${NOW.getFullYear()}-${String(NOW.getMonth()+1).padStart(2,'0')}-${String(NOW.getDate()).padStart(2,'0')}`;
const CURR_MONTH = TODAY_ISO.slice(0,7); // "2026-06"
const TODAY_DAY = DAYS_ES[NOW.getDay()];
const DATE_STR = `${TODAY_DAY} ${NOW.getDate()} de ${MONTHS_ES[NOW.getMonth()]} ${NOW.getFullYear()}`;
document.getElementById('topbar-date').textContent = DATE_STR;
document.getElementById('topbar-day').textContent = TODAY_DAY;
document.getElementById('hero-date').textContent = '📅 ' + DATE_STR;

// Tema guardado — el atributo se aplica inmediatamente; el botón se actualiza tras DOMContentLoaded
(()=>{
  const saved = localStorage.getItem('fd-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  const updateBtn = () => {
    const btn = document.getElementById('theme-toggle-btn');
    if(btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateBtn);
  else updateBtn();
})();

// Atajos de teclado globales
document.addEventListener('keydown', e => {
  if((e.ctrlKey || e.metaKey) && e.key === 'k'){
    e.preventDefault();
    if(document.getElementById('global-search-overlay').classList.contains('open')) closeGlobalSearch();
    else openGlobalSearch();
  }
  if(e.altKey && e.key.toLowerCase() === 'd') toggleDarkMode();
});

function fmtDate(iso){ if(!iso) return '—'; const p=iso.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; }
function fmtDateTime(iso, hora){ return fmtDate(iso) + (hora?' · '+hora:''); }
// Etiqueta relativa de fecha: HOY / MAÑANA / PASADO / AYER (o '' para el resto)
function etiquetaDiaRelativa(iso){
  if(!iso) return '';
  const hoy = new Date(TODAY_ISO + 'T00:00:00');
  const f = new Date(iso + 'T00:00:00');
  if(isNaN(f)) return '';
  const diff = Math.round((f - hoy) / 86400000);
  if(diff === 0) return 'HOY';
  if(diff === 1) return 'MAÑANA';
  if(diff === 2) return 'PASADO';
  if(diff === -1) return 'AYER';
  return '';
}
function badgeDiaRelativa(iso){
  const t = etiquetaDiaRelativa(iso);
  if(!t) return '';
  const colores = {
    'HOY':'background:#1A1A1A;color:#F7F5F2',
    'MAÑANA':'background:#B8602A;color:#fff',
    'PASADO':'background:#9A8F7A;color:#fff',
    'AYER':'background:#B03020;color:#fff'
  };
  return `<span style="${colores[t]};font-size:9px;font-weight:700;letter-spacing:.6px;padding:2px 7px;border-radius:5px;margin-left:6px;vertical-align:middle;white-space:nowrap">${t}</span>`;
}
function fmtMonth(ym){ const [y,m]=ym.split('-'); const n=MONTHS_ES[+m-1]; return n.charAt(0).toUpperCase()+n.slice(1)+' '+y; }
function getMonthVisits(r, ym){ return (r.monthlyVisits||{})[ym||CURR_MONTH]||0; }
function getAllMonths(dataArr){ const s=new Set(); dataArr.forEach(r=>Object.keys(r.monthlyVisits||{}).forEach(m=>s.add(m))); return [...s].sort().reverse(); }
function getWeekLabel(date=new Date()){
  const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
  d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));
  const y=d.getUTCFullYear();
  const wn=Math.ceil(((d-new Date(Date.UTC(y,0,1)))/86400000+1)/7);
  return `Semana ${wn} · ${y}`;
}
function getMonthLabel(iso){ if(!iso) return ''; const p=iso.split('-'); return MONTHS_ES[+p[1]-1]+' '+p[0]; }
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function parseMoney(s){
  if(typeof s === 'number') return isFinite(s) ? s : 0;
  let str = String(s ?? '').trim();
  const neg = str.startsWith('-');
  str = str.replace(/[^0-9.,]/g, '');
  if(!str) return 0;
  if(str.includes(',')){
    // Formato AR: punto = miles, coma = decimal  ("1.150.000,50")
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    // Solo puntos: si son grupos de miles (3 dígitos) los quitamos ("150.000" -> 150000)
    const parts = str.split('.');
    if(parts.length > 1 && parts.slice(1).every(p => p.length === 3)) str = parts.join('');
  }
  const n = parseFloat(str) || 0;
  return neg ? -n : n;
}

// ════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════
const PAGE_LABELS = {control:'Control','control-jardineria':'Control › Seguimiento Jardinería','control-habitaciones':'Control › Habitaciones con Plantas',
  home:'Inicio', operaciones:'Operaciones',
  checklist:'Operaciones › Checklist', stock:'Operaciones › Stock',
  inventario:'Operaciones › Inventario',
  'eventos-maison':'Operaciones › Eventos / Maison',
  'jardineria-ops':'Operaciones › Tareas Jardinería',
  'hab-ops':'Operaciones › Habitaciones con Plantas',
  'recepcion-pedidos':'Operaciones › Recepción de Pedidos',
  compras:'Compras', 'compras-floreria':'Compras › Florería',
  'compras-jardineria':'Compras › Jardinería',
  'compra-evento':'Compras › Compra por Evento',
  'stock-admin':'Compras › Gestión de Stock', floreros:'Compras › Stock de Floreros',
  comercial:'Área Comercial', 'eventos-comercial':'Comercial › Eventos',
  'historial-eventos':'Comercial › Historial de Eventos',
  'eventos-sin-floreria':'Comercial › Eventos sin Florería',
  cotizador:'Comercial › Cotizador',
  'cotizador-ops':'Cotizador',
  'ventas-externas':'Comercial › Ventas', caja:'Contable › Control de Caja',
  galeria:'Comercial › Galería de Trabajos',
  'lista-precios':'Comercial › Lista de Precios',
  'ramos-disponibles':'Comercial › Ramos Disponibles',
  'pedidos-ramos':'Comercial › Pedidos de Ramos',
  'pedidos-habitacion':'Comercial › Pedidos de Habitación',
  'home-hyatt':'Panel Hyatt',
  'cotizador-eventos-hyatt':'Cotizador de Eventos',
  'control-horarios':'Recursos Humanos › Horarios y Productividad',
  'recetas-arreglos':'Comercial › Composiciones',
  reportes:'Reportes', 'reportes-equipo':'Reportes › Equipo & Horarios',
  'reportes-ventas':'Reportes › Ventas & Comercial', 'reportes-stock':'Reportes › Stock & Compras',
  'reportes-margen':'Reportes › Dashboard de Margen',
  auditoria:'Auditoría de Cambios',
  'crm-clientes':'CRM · Clientes',
  sucursales:'Administración de Sucursales',
  'dashboard-consolidado':'Dashboard Consolidado',
  'calendario': 'Calendario de Eventos',
  'proveedores': 'Proveedores',
  'rentabilidad-eventos': 'Contable › Rentabilidad',
  legajo: 'Recursos Humanos › Legajo de Empleados',
  evaluaciones: 'Recursos Humanos › Evaluaciones de Desempeño',
  liquidacion: 'Recursos Humanos › Liquidación Horas Extra',
  'precio-comparacion': 'Compras › Comparar Precios',
  'presupuestos': 'Comercial › Presupuestos Enviados',
  'cotizar-presupuesto': 'Comercial › Armar cotización',
  'cierre-mensual': 'Contable › Cierre Mensual',
  'dashboard-gerencia': 'Gerencia › Dashboard Unificado',
  'cierre-dia': 'Reportes › Cierre del Día',
  'tv-dashboard': 'Pantalla TV / Dashboard'
};

// ── NAVEGACIÓN INFERIOR MOBILE ──────────────────────────────────────────────
const BOTTOM_NAV_ITEMS = {
  gerencia:  [{icon:'🏠',label:'Inicio',page:'home'},{icon:'📋',label:'Checklist',page:'checklist'},{icon:'🎉',label:'Eventos',page:'eventos-maison'},{icon:'💰',label:'Caja',page:'caja'}],
  florista:  [{icon:'🏠',label:'Inicio',page:'home'},{icon:'📋',label:'Checklist',page:'checklist'},{icon:'💐',label:'Ramos',page:'ramos-disponibles'},{icon:'📦',label:'Stock',page:'stock'},{icon:'🎉',label:'Eventos',page:'eventos-maison'}],
  operario:  [{icon:'🏠',label:'Inicio',page:'home'},{icon:'🎉',label:'Eventos',page:'eventos-maison'},{icon:'📦',label:'Stock',page:'stock'},{icon:'💲',label:'Precios',page:'lista-precios'}],
  jardinero: [{icon:'🌿',label:'Jardín',page:'jardineria-ops'},{icon:'🏡',label:'Habitac.',page:'hab-ops'},{icon:'🔔',label:'Avisos',page:'recordatorios-jardineria'}],
  compras:   [{icon:'🛒',label:'Compras',page:'compras-floreria'},{icon:'📦',label:'Stock',page:'stock-admin'},{icon:'📬',label:'Recepción',page:'recepcion-pedidos'}],
  comercial: [{icon:'🎉',label:'Eventos',page:'eventos-comercial'},{icon:'💰',label:'Ventas',page:'ventas-externas'},{icon:'🖼',label:'Galería',page:'galeria'},{icon:'💲',label:'Precios',page:'lista-precios'}],
  ventas:    [{icon:'🌺',label:'Ramos',page:'ramos-disponibles'},{icon:'🏨',label:'Pedidos',page:'pedidos-habitacion'},{icon:'💲',label:'Precios',page:'lista-precios'}],
  housekeeping: [{icon:'🛏',label:'Habitaciones',page:'control-habitaciones'}],
};

function renderBottomNav(role) {
  const nav = document.getElementById('bottom-nav');
  if(!nav) return;
  let items = BOTTOM_NAV_ITEMS[role] || [];
  // Florista que también es jardinero (ej. Ivan): barra combinada de ambos mundos
  if(role === 'florista' && jardineroNombre){
    items = [
      {icon:'🏠',label:'Inicio',page:'home'},
      {icon:'📋',label:'Checklist',page:'checklist'},
      {icon:'🎉',label:'Eventos',page:'eventos-maison'},
      {icon:'🌿',label:'Jardín',page:'jardineria-ops'},
      {icon:'🏡',label:'Habitac.',page:'hab-ops'},
    ];
  }
  nav.innerHTML = items.map(it =>
    `<div class="bottom-nav-item" data-page="${it.page}" onclick="navigate('${it.page}',null);updateBottomNav('${it.page}')">
      <span class="bottom-nav-icon">${it.icon}</span>
      <span class="bottom-nav-label">${it.label}</span>
    </div>`
  ).join('');
}

function updateBottomNav(pageId) {
  document.querySelectorAll('.bottom-nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pageId);
  });
}

// ── ACORDEÓN DE NAVEGACIÓN ──────────────────────────────────────────────────
const navOpenGroups = new Set();

function navExpandGroup(groupId) {
  navOpenGroups.add(groupId);
  document.querySelectorAll(`.nav-sub-item[data-group="${groupId}"]`).forEach(item => {
    if(item.dataset.roleVisible !== '0') item.style.setProperty('display', 'block', 'important');
  });
  const hdr = document.querySelector(`[data-group-id="${groupId}"]`);
  if(hdr) hdr.classList.add('nav-group-open');
}

function navCollapseGroup(groupId) {
  navOpenGroups.delete(groupId);
  document.querySelectorAll(`.nav-sub-item[data-group="${groupId}"]`).forEach(item => {
    item.style.setProperty('display', 'none', 'important');
  });
  const hdr = document.querySelector(`[data-group-id="${groupId}"]`);
  if(hdr) hdr.classList.remove('nav-group-open');
}

function navToggleGroup(groupId) {
  if(navOpenGroups.has(groupId)) navCollapseGroup(groupId);
  else navExpandGroup(groupId);
}

function finalizeNavGroups() {
  // Snapshot visibility set by role code, then collapse all groups
  document.querySelectorAll('.nav-sub-item[data-group]').forEach(item => {
    // role code sets style.display='none' for hidden items; anything else = visible
    item.dataset.roleVisible = item.style.display === 'none' ? '0' : '1';
    item.style.setProperty('display', 'none', 'important');
  });
  // Reset all group headers
  document.querySelectorAll('.nav-group-hdr').forEach(hdr => hdr.classList.remove('nav-group-open'));
  navOpenGroups.clear();
  // Expand active group if any
  const active = document.querySelector('.nav-sub-item.active');
  if(active?.dataset.group) navExpandGroup(active.dataset.group);
}
// ────────────────────────────────────────────────────────────────────────────

function navigate(pageId, navEl){
  updateBottomNav(pageId);
  // Redirigir home según rol
  if(pageId === 'home' && userRole === 'ventas') pageId = 'home-hyatt';
  document.querySelectorAll('.content').forEach(p=>p.classList.remove('active'));
  const pg = document.getElementById('page-'+pageId);
  if(pg) pg.classList.add('active');
  document.getElementById('breadcrumb').innerHTML = '🌸 <span>'+(PAGE_LABELS[pageId]||pageId)+'</span>';
  document.querySelectorAll('.nav-item,.nav-sub-item').forEach(n=>n.classList.remove('active'));
  if(navEl) navEl.classList.add('active');
  // Auto-expandir el grupo del sub-item navegado programáticamente
  if(navEl?.dataset?.group) navExpandGroup(navEl.dataset.group);

  if(pageId==='home')               renderHome();
  if(pageId==='checklist')          initChecklist();
  if(pageId==='stock')              renderStock();
  if(pageId==='inventario')         renderInventario();
  if(pageId==='eventos-maison')     renderKanban();
  if(pageId==='compras-floreria')   renderCompras('floreria');
  if(pageId==='compras-jardineria') renderCompras('jardineria');
  if(pageId==='compra-evento')      renderCompraEvento();
  if(pageId==='stock-admin')        renderStockAdmin();
  if(pageId==='floreros')           renderFloreros();
  if(pageId==='velas')              renderVelas();
  if(pageId==='eventos-comercial'){ initEventosToggle(); if(eventosView==='calendario') renderCalendario(); else renderEventos(); }
  if(pageId==='historial-eventos')   renderHistorialEventos();
  if(pageId==='eventos-sin-floreria') renderEventosSinFloreria();
  if(pageId==='ventas-externas')    renderVentas();
  if(pageId==='caja')               renderCaja();
  if(pageId==='galeria')            setGaleriaSeccion(galeriaSeccion);
  if(pageId==='lista-precios')      renderListaPrecios();
  if(pageId==='ramos-disponibles'){ initRamosToggle(); setRamosView(ramosView); }
  if(pageId==='pedidos-ramos'){ navigate('ramos-disponibles'); setRamosView('pedidos'); return; }
  if(pageId==='pedidos-habitacion') renderPedidosHab();
  if(pageId==='home-hyatt') renderHomeHyatt();
  if(pageId==='cotizador-eventos-hyatt') initCotizadorEventosHyatt();
  if(pageId==='control-horarios') renderHorarios();
  if(pageId==='cotizador')          renderCotizador();
  if(pageId==='cotizador-ops')      renderCotizadorOps();
  if(pageId==='recetas-arreglos')       setCompTab(compTab);
  if(pageId==='recordatorios-jardineria') renderRecordatoriosJard();
  if(pageId==='control-jardineria') renderCtrlJard();
  if(pageId==='jardineria-ops') renderJardOps();
  if(pageId==='hab-ops') renderHabOps();
  if(pageId==='recepcion-pedidos') renderRecepcionPedidos();
  if(pageId==='control-habitaciones') renderCtrlHab();
  if(pageId==='reportes-equipo') renderReportesEquipo();
  if(pageId==='cierre-dia') initCierreDia();
  if(pageId==='reportes-ventas') renderReportesVentas();
  if(pageId==='reportes-stock') renderReportesStock();
  if(pageId==='reportes-margen') renderDashboardMargen();
  if(pageId==='auditoria') renderAuditoria();
  if(pageId==='crm-clientes') renderClientes();
  if(pageId==='sucursales') renderSucursales();
  if(pageId==='dashboard-consolidado') renderDashboardConsolidado();
  if(pageId==='calendario') renderCalendario();
  if(pageId==='proveedores') renderProveedores();
  if(pageId==='rentabilidad-eventos') renderRentabilidad();
  if(pageId==='legajo') renderLegajo();
  if(pageId==='evaluaciones') renderEvaluaciones();
  if(pageId==='liquidacion') renderLiquidacion();
  if(pageId==='precio-comparacion') renderPrecioComparacion();
  if(pageId==='presupuestos') renderPresupuestos();
  if(pageId==='cotizar-presupuesto') renderCotizarPresupuesto();
  if(pageId==='cierre-mensual'){ const sel=document.getElementById('cierre-mes-sel'); if(sel&&!sel.value) sel.value=CURR_MONTH; renderCierreMensual(); }
  if(pageId==='dashboard-gerencia') renderDashboardGerencia();
  if(pageId==='tv-dashboard') renderTVDashboard();

  // En mobile, cerrar el sidebar automáticamente al navegar — salvo si el ítem
  // es un encabezado de grupo (acordeón): esos solo despliegan sus áreas y el
  // sidebar queda abierto para que el usuario elija una.
  if(window.innerWidth <= 768 && !navEl?.classList?.contains('nav-group-hdr')) closeSidebar();
}

function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');}));

// ════════════════════════════════════════
// CONFIRMACIÓN ESTILADA (reemplaza a confirm() nativo)
// Devuelve una Promesa<boolean>. Uso: if(!await confirmModal('¿Borrar?')) return;
// Respeta \n en el mensaje (white-space:pre-line). Si el texto sugiere una
// acción destructiva (Eliminar/Borrar/Quitar/Limpiar/Resetear), el botón
// principal se pinta en rojo.
// ════════════════════════════════════════
function confirmModal(message, opts){
  opts = opts || {};
  const danger = opts.danger != null
    ? opts.danger
    : /eliminar|borrar|quitar|limpiar|resetear|reemplaza/i.test(message || '');
  const title    = opts.title    || (danger ? 'Confirmar' : 'Confirmar');
  const okText   = opts.okText   || 'Confirmar';
  const cancelText = opts.cancelText || 'Cancelar';

  return new Promise(resolve => {
    let ov = document.getElementById('confirm-modal-overlay');
    if(!ov){
      ov = document.createElement('div');
      ov.id = 'confirm-modal-overlay';
      ov.className = 'modal-overlay';
      ov.innerHTML =
        '<div class="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title" aria-describedby="confirm-modal-msg">' +
          '<div class="modal-title" id="confirm-modal-title"></div>' +
          '<div class="confirm-modal-msg" id="confirm-modal-msg"></div>' +
          '<div class="modal-actions">' +
            '<button type="button" class="btn-secondary" id="confirm-modal-cancel"></button>' +
            '<button type="button" class="btn-add" id="confirm-modal-ok"></button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(ov);
    }
    const titleEl  = ov.querySelector('#confirm-modal-title');
    const msgEl    = ov.querySelector('#confirm-modal-msg');
    const okBtn    = ov.querySelector('#confirm-modal-ok');
    const cancelBtn= ov.querySelector('#confirm-modal-cancel');

    titleEl.textContent  = title;
    msgEl.textContent    = message || '';
    okBtn.textContent    = okText;
    cancelBtn.textContent= cancelText;
    okBtn.classList.toggle('btn-danger', !!danger);

    const prevFocus = document.activeElement;
    function cleanup(result){
      ov.classList.remove('open');
      document.removeEventListener('keydown', onKey, true);
      okBtn.onclick = cancelBtn.onclick = ov.onclick = null;
      if(prevFocus && prevFocus.focus){ try{ prevFocus.focus(); }catch(e){} }
      resolve(result);
    }
    function onKey(e){
      // Escape cancela. Enter actúa sobre el botón con foco (comportamiento nativo),
      // por eso no lo interceptamos: así evitamos confirmar sin querer.
      if(e.key === 'Escape'){ e.preventDefault(); cleanup(false); }
    }
    okBtn.onclick     = () => cleanup(true);
    cancelBtn.onclick = () => cleanup(false);
    ov.onclick        = e => { if(e.target === ov) cleanup(false); };
    document.addEventListener('keydown', onKey, true);

    ov.classList.add('open');
    // Foco en "Cancelar" por seguridad (evita borrados accidentales con Enter doble)
    setTimeout(() => { try{ cancelBtn.focus(); }catch(e){} }, 30);
  });
}
window.confirmModal = confirmModal;

// ════════════════════════════════════════
// AVISO ESTILADO (reemplaza a alert() de información)
// Modal de un solo botón. Devuelve Promise que resuelve al cerrar.
// Para errores de validación cortos preferí showToast(msg,'error').
// ════════════════════════════════════════
function alertModal(message, opts){
  opts = opts || {};
  const title  = opts.title  || 'Aviso';
  const okText = opts.okText || 'Entendido';
  return new Promise(resolve => {
    let ov = document.getElementById('alert-modal-overlay');
    if(!ov){
      ov = document.createElement('div');
      ov.id = 'alert-modal-overlay';
      ov.className = 'modal-overlay';
      ov.innerHTML =
        '<div class="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="alert-modal-title" aria-describedby="alert-modal-msg">' +
          '<div class="modal-title" id="alert-modal-title"></div>' +
          '<div class="confirm-modal-msg" id="alert-modal-msg"></div>' +
          '<div class="modal-actions">' +
            '<button type="button" class="btn-add" id="alert-modal-ok"></button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(ov);
    }
    ov.querySelector('#alert-modal-title').textContent = title;
    ov.querySelector('#alert-modal-msg').textContent   = message || '';
    const okBtn = ov.querySelector('#alert-modal-ok');
    okBtn.textContent = okText;
    const prevFocus = document.activeElement;
    function cleanup(){
      ov.classList.remove('open');
      document.removeEventListener('keydown', onKey, true);
      okBtn.onclick = ov.onclick = null;
      if(prevFocus && prevFocus.focus){ try{ prevFocus.focus(); }catch(e){} }
      resolve();
    }
    function onKey(e){ if(e.key === 'Escape' || e.key === 'Enter'){ e.preventDefault(); cleanup(); } }
    okBtn.onclick = cleanup;
    ov.onclick = e => { if(e.target === ov) cleanup(); };
    document.addEventListener('keydown', onKey, true);
    ov.classList.add('open');
    setTimeout(() => { try{ okBtn.focus(); }catch(e){} }, 30);
  });
}
window.alertModal = alertModal;

// ════════════════════════════════════════
// INPUT ESTILADO (reemplaza a prompt() nativo)
// Devuelve Promise<string|null>: el texto al aceptar, null al cancelar.
// opts: { title, okText, cancelText, default, password, placeholder }
// password se autodetecta si el mensaje menciona "contraseña".
// ════════════════════════════════════════
function promptModal(message, opts){
  opts = opts || {};
  const isPw = opts.password != null ? opts.password : /contraseña|password/i.test(message || '');
  const title    = opts.title    || 'Ingresá un dato';
  const okText   = opts.okText   || 'Aceptar';
  const cancelText = opts.cancelText || 'Cancelar';
  const def      = opts.default != null ? String(opts.default) : '';
  return new Promise(resolve => {
    let ov = document.getElementById('prompt-modal-overlay');
    if(!ov){
      ov = document.createElement('div');
      ov.id = 'prompt-modal-overlay';
      ov.className = 'modal-overlay';
      ov.innerHTML =
        '<div class="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="prompt-modal-title">' +
          '<div class="modal-title" id="prompt-modal-title"></div>' +
          '<div class="confirm-modal-msg" id="prompt-modal-msg"></div>' +
          '<input type="text" class="form-input-modal" id="prompt-modal-input" style="margin-top:12px">' +
          '<div class="modal-actions">' +
            '<button type="button" class="btn-secondary" id="prompt-modal-cancel"></button>' +
            '<button type="button" class="btn-add" id="prompt-modal-ok"></button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(ov);
    }
    ov.querySelector('#prompt-modal-title').textContent = title;
    const msgEl = ov.querySelector('#prompt-modal-msg');
    msgEl.textContent = message || '';
    msgEl.style.display = message ? '' : 'none';
    const input    = ov.querySelector('#prompt-modal-input');
    const okBtn    = ov.querySelector('#prompt-modal-ok');
    const cancelBtn= ov.querySelector('#prompt-modal-cancel');
    input.type = isPw ? 'password' : 'text';
    input.value = def;
    input.placeholder = opts.placeholder || '';
    okBtn.textContent = okText;
    cancelBtn.textContent = cancelText;

    const prevFocus = document.activeElement;
    function cleanup(result){
      ov.classList.remove('open');
      document.removeEventListener('keydown', onKey, true);
      okBtn.onclick = cancelBtn.onclick = ov.onclick = input.onkeydown = null;
      if(prevFocus && prevFocus.focus){ try{ prevFocus.focus(); }catch(e){} }
      resolve(result);
    }
    function onKey(e){ if(e.key === 'Escape'){ e.preventDefault(); cleanup(null); } }
    input.onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); cleanup(input.value); } };
    okBtn.onclick     = () => cleanup(input.value);
    cancelBtn.onclick = () => cleanup(null);
    ov.onclick        = e => { if(e.target === ov) cleanup(null); };
    document.addEventListener('keydown', onKey, true);
    ov.classList.add('open');
    setTimeout(() => { try{ input.focus(); input.select(); }catch(e){} }, 30);
  });
}
window.promptModal = promptModal;

// ════════════════════════════════════════
// DATA — CHECKLIST
// Actividad options, Tiempo options, Responsable options are now editable per row
// ════════════════════════════════════════
const CL_ACTIVIDAD_OPTS = ['Nuevo','Retoque','Riego'];
let CL_RESP_OPTS = ['Caro','Clo','Cris','Gabi','Ivan','Jardineria','Pao','Nora'];


// Sections: 'a'=Alvear (crema), 'b'=Posadas (azul), 'c'=Florería (rosa)
const CL_TASKS = [
  // ── ALVEAR ──────────────────────────────────────────────────────────────
  {sec:'a',zona:'Bochitas',            actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'2° 3° 4° Piso',       actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Lobby Alvear',         actividad:'Riego',     obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Lobby Alvear',         actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Lobby Alvear',         actividad:'Retoque', obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Recepción Alvear',     actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Mesa Ratona Alvear',   actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Biblioteca',           actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Salón Privado',        actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Mesada P. Nobile',     actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Mesitas P. Nobile',    actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Mesas Duhau',          actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Baños Duhau',          actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Copón Duhau',          actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Copón Duhau',          actividad:'Retoque', obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Chimenea Vinoteca',    actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Mesada Vinoteca',      actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Chimeneas P. Nobile',  actividad:'Retoque',   obs:'',tiempo:'', responsable:''},
  {sec:'a',zona:'Elefante',             actividad:'Riego',     obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Elefante',             actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Foyer Spa',            actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Spa recepción',        actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Spa (cabinas)',         actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Spa (vestuarios D)',    actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Spa (vestuarios C)',    actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  // ── POSADAS ─────────────────────────────────────────────────────────────
  {sec:'b',zona:'Baños P. de las Artes',actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Lobby Posadas',         actividad:'Riego',     obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Lobby Posadas',         actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Mesa Ratona Posadas',   actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Recepción Posadas',     actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Gioia',                 actividad:'Retoque',   obs:'Arreglos perimetrales + 2 buffets',tiempo:'',responsable:''},
  {sec:'b',zona:'Gioia',                 actividad:'Retoque', obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Mesas Gioia',           actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Copón Gioia',           actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Foyer Posadas',         actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Totems',                actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Meeting Rooms',         actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Baños Meetings',        actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Tilo',                  actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Pisos',                 actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  // ── FLORERÍA ────────────────────────────────────────────────────────────
  {sec:'c',zona:'Maison (Bertone)',       actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
  {sec:'c',zona:'Cámara',                actividad:'Retoque', obs:'',tiempo:'',responsable:''},
  {sec:'c',zona:'Bolsa de Cámara',       actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'c',zona:'Ingreso Pedido',        actividad:'Retoque',   obs:'',tiempo:'',   responsable:''},
  {sec:'c',zona:'Ramos',                 actividad:'Retoque', obs:'1 de cada uno',tiempo:'',responsable:''},
  {sec:'c',zona:'Florería',              actividad:'Retoque',   obs:'',tiempo:'',responsable:''},
];

const SEC_HEADERS = {
  a: {label:'ALVEAR',      cls:'cl-sec-a', rowCls:'row-sec-a', icon:'🟤'},
  b: {label:'POSADAS',     cls:'cl-sec-b', rowCls:'row-sec-b', icon:'🔵'},
  c: {label:'FLORERÍA',    cls:'cl-sec-c', rowCls:'row-sec-c', icon:'🌸'},
};

// Unified checklist state — same tasks all days
// clState: { checked[], actividad[], obs[], tiempo[], responsable[] }
let clStateByDay = {}; // estado independiente por día
let clState = null;   // referencia al día activo (alias)

// ── Tiempo promedio de referencia por tarea (lo define gerencia) ─────────────
// Minutos por índice de CL_TASKS; 0 = sin referencia. Compartido vía Firebase.
let clTiemposRef = [];
window._setClTiemposRef = (val) => {
  clTiemposRef = val ? CL_TASKS.map((_,i)=>parseInt(val[i])||0) : [];
};
function getTiempoRef(i){ return parseInt(clTiemposRef[i])||0; }

// ── Zonas/secciones editables por gerencia (persistidas en Firebase) ──────────
// CL_TASKS y SEC_HEADERS arrancan con los valores por defecto; si hay config
// guardada en Firebase, la reemplaza. Ojo: el estado del checklist (por día) y
// clTiemposRef se indexan por POSICIÓN, así que al agregar/borrar zonas hay que
// reindexar todos esos arrays para no desalinear.
const _CL_TASKS_DEFAULT = JSON.parse(JSON.stringify(CL_TASKS));

window._setChecklistTareas = (arr) => {
  if(!Array.isArray(arr) || !arr.length) return;
  CL_TASKS.splice(0, CL_TASKS.length, ...arr.map(t=>({
    sec: t.sec||'a', zona: String(t.zona||''), actividad: t.actividad||'Retoque',
    obs: t.obs||'', tiempo:'', responsable:''
  })));
  if(document.getElementById('page-checklist')?.classList.contains('active') && !(window.estaEditando&&window.estaEditando('page-checklist'))) renderChecklistTable?.();
};
window._setChecklistSecciones = (obj) => {
  if(!obj || typeof obj !== 'object') return;
  Object.keys(obj).forEach(sec => {
    SEC_HEADERS[sec] = {
      label: obj[sec].label || SEC_HEADERS[sec]?.label || sec.toUpperCase(),
      icon:  obj[sec].icon  || SEC_HEADERS[sec]?.icon  || '📍',
      cls:    SEC_HEADERS[sec]?.cls    || ('cl-sec-'+sec),
      rowCls: SEC_HEADERS[sec]?.rowCls || ('row-sec-'+sec),
    };
  });
  if(document.getElementById('page-checklist')?.classList.contains('active')) renderChecklistTable?.();
};

function _persistChecklistConfig(){
  fbSave('checklistTareas', CL_TASKS.map(t=>({sec:t.sec, zona:t.zona, actividad:t.actividad, obs:t.obs||''})));
  const secObj = {};
  Object.keys(SEC_HEADERS).forEach(s=>{ secObj[s] = {label:SEC_HEADERS[s].label, icon:SEC_HEADERS[s].icon}; });
  fbSave('checklistSecciones', secObj);
}

const _CL_FIELDS = ['checked','actividad','obs','tiempo','inicio','fin','responsable'];

// Inserta una zona en CL_TASKS y reindexa el estado de cada día + clTiemposRef
function _clInsertTaskAt(index, task){
  Object.keys(clStateByDay).forEach(d => getOrCreateDayState(d)); // normalizar largos
  CL_TASKS.splice(index, 0, {sec:task.sec, zona:task.zona, actividad:task.actividad||'Retoque', obs:task.obs||'', tiempo:'', responsable:''});
  Object.values(clStateByDay).forEach(ds=>{
    _CL_FIELDS.forEach(k=>{
      if(!Array.isArray(ds[k])) return;
      const def = k==='checked' ? false : (k==='actividad' ? (task.actividad||'Retoque') : (k==='obs' ? (task.obs||'') : ''));
      ds[k].splice(index, 0, def);
    });
  });
  while(clTiemposRef.length < index) clTiemposRef.push(0);
  clTiemposRef.splice(index, 0, 0);
}

// Borra una zona y reindexa todo el estado
function _clRemoveTaskAt(index){
  Object.keys(clStateByDay).forEach(d => getOrCreateDayState(d));
  CL_TASKS.splice(index, 1);
  Object.values(clStateByDay).forEach(ds=>{
    _CL_FIELDS.forEach(k=>{ if(Array.isArray(ds[k])) ds[k].splice(index, 1); });
  });
  if(clTiemposRef.length > index) clTiemposRef.splice(index, 1);
}

// Intercambia dos zonas (y todo su estado por día + tiempos) para reordenar
function _clSwapTasks(i, j){
  if(i===j) return;
  Object.keys(clStateByDay).forEach(d => getOrCreateDayState(d));
  const tmp = CL_TASKS[i]; CL_TASKS[i] = CL_TASKS[j]; CL_TASKS[j] = tmp;
  Object.values(clStateByDay).forEach(ds=>{
    _CL_FIELDS.forEach(k=>{
      if(Array.isArray(ds[k]) && ds[k].length>Math.max(i,j)){ const t=ds[k][i]; ds[k][i]=ds[k][j]; ds[k][j]=t; }
    });
  });
  while(clTiemposRef.length <= Math.max(i,j)) clTiemposRef.push(0);
  const t = clTiemposRef[i]; clTiemposRef[i]=clTiemposRef[j]; clTiemposRef[j]=t;
}

// Persiste el estado completo (todos los días + tiempos + config) tras un cambio estructural
function _clPersistTrasCambio(){
  try{ localStorage.setItem(CL_STORAGE_KEY, JSON.stringify(clStateByDay)); }catch(e){}
  window._checklistLastSave = Date.now();
  Object.keys(clStateByDay).forEach(d=>{ if(window.fbSetPath) window.fbSetPath('checklist/'+d, clStateByDay[d]); });
  fbSave('clTiemposRef', clTiemposRef);
  _persistChecklistConfig();
}

// ── Acciones de gestión (solo gerencia) ──
async function clAddZona(sec){
  if(userRole!=='gerencia') return;
  const nombre = await promptModal('Nombre de la nueva zona / arreglo:', { title:'Agregar zona' });
  if(!nombre || !nombre.trim()) return;
  const actividad = await promptModal('Actividad por defecto (Retoque / Nuevo / Riego):', { title:'Agregar zona', default:'Retoque' });
  // Insertar al final del grupo de esa sección para mantener el orden visual
  let insertIdx = CL_TASKS.length;
  for(let i=CL_TASKS.length-1;i>=0;i--){ if(CL_TASKS[i].sec===sec){ insertIdx=i+1; break; } }
  _clInsertTaskAt(insertIdx, { sec, zona:nombre.trim(), actividad:(actividad||'Retoque').trim() });
  _clPersistTrasCambio();
  clState = getOrCreateDayState(currentDay);
  renderChecklistTable();
  openGestionZonas();
  showToast(`✅ Zona "${nombre.trim()}" agregada a ${SEC_HEADERS[sec]?.label||sec}`);
}

async function clRenameZona(index){
  if(userRole!=='gerencia') return;
  const t = CL_TASKS[index]; if(!t) return;
  const nuevo = await promptModal('Nuevo nombre para la zona:', { title:'Renombrar zona', default:t.zona });
  if(!nuevo || !nuevo.trim() || nuevo.trim()===t.zona) return;
  // Migrar el registro persistente de "último Nuevo" al nuevo nombre
  const kOld=_zonaKey(t.sec,t.zona), kNew=_zonaKey(t.sec,nuevo.trim());
  if(ultimoNuevoZona[kOld]){ ultimoNuevoZona[kNew]=ultimoNuevoZona[kOld]; delete ultimoNuevoZona[kOld]; fbSave('ultimoNuevoZona', ultimoNuevoZona); }
  t.zona = nuevo.trim();
  _persistChecklistConfig();
  renderChecklistTable();
  openGestionZonas();
  showToast('✏️ Zona renombrada');
}

// Subir/bajar una zona dentro de su sección (dir = -1 arriba, +1 abajo)
function clMoveZona(index, dir){
  if(userRole!=='gerencia') return;
  const t = CL_TASKS[index]; if(!t) return;
  const j = index + dir;
  if(j<0 || j>=CL_TASKS.length) return;
  if(CL_TASKS[j].sec !== t.sec) return;  // no cruzar de sección
  _clSwapTasks(index, j);
  _clPersistTrasCambio();
  clState = getOrCreateDayState(currentDay);
  renderChecklistTable();
  openGestionZonas();
}

async function clDeleteZona(index){
  if(userRole!=='gerencia') return;
  const t = CL_TASKS[index]; if(!t) return;
  if(!await confirmModal(`¿Eliminar la zona "${t.zona}" del checklist?\nSe quita para todos los días.`)) return;
  _clRemoveTaskAt(index);
  _clPersistTrasCambio();
  clState = getOrCreateDayState(currentDay);
  renderChecklistTable();
  openGestionZonas();
  showToast('🗑️ Zona eliminada');
}

async function clRenameSeccion(sec){
  if(userRole!=='gerencia') return;
  const nuevo = await promptModal('Nuevo nombre para la sección:', { title:'Renombrar sección', default:SEC_HEADERS[sec]?.label||'' });
  if(!nuevo || !nuevo.trim()) return;
  if(SEC_HEADERS[sec]) SEC_HEADERS[sec].label = nuevo.trim();
  _persistChecklistConfig();
  renderChecklistTable();
  openGestionZonas();
  showToast('✏️ Sección renombrada');
}

async function clAddSeccion(){
  if(userRole!=='gerencia') return;
  const nombre = await promptModal('Nombre de la nueva sección / área (ej. Palacio):', { title:'Agregar sección' });
  if(!nombre || !nombre.trim()) return;
  // Nuevo código de sección libre
  let code='d'; for(let c=100;c<123;c++){ const ch=String.fromCharCode(c); if(!SEC_HEADERS[ch]){ code=ch; break; } }
  SEC_HEADERS[code] = { label:nombre.trim(), icon:'📍', cls:'cl-sec-'+code, rowCls:'row-sec-'+code };
  _persistChecklistConfig();
  openGestionZonas();
  showToast(`✅ Sección "${nombre.trim()}" creada — agregá zonas`);
}

function openGestionZonas(){
  if(userRole!=='gerencia'){ showToast('⛔ Solo gerencia'); return; }
  let ov = document.getElementById('gestion-zonas-modal');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'gestion-zonas-modal';
    ov.className = 'modal-overlay';
    document.body.appendChild(ov);
  }
  // Agrupar índices por sección
  const bySec = {};
  CL_TASKS.forEach((t,i)=>{ (bySec[t.sec]=bySec[t.sec]||[]).push(i); });
  const secOrder = Object.keys(SEC_HEADERS);
  const seccionesHTML = secOrder.map(sec=>{
    const sh = SEC_HEADERS[sec];
    const idxs = bySec[sec] || [];
    const zonasHTML = idxs.map((i,pos)=>{
      const t = CL_TASKS[i];
      const upDis = pos===0 ? 'disabled style="opacity:.25;cursor:default"' : '';
      const dnDis = pos===idxs.length-1 ? 'disabled style="opacity:.25;cursor:default"' : '';
      return `<div style="display:flex;align-items:center;gap:6px;padding:7px 12px;background:var(--warm-white)">
        <div style="flex:1;min-width:0;font-size:13px;color:var(--charcoal)">${esc(t.zona)} <span style="font-size:10px;color:var(--mid-gray)">· ${esc(t.actividad)}</span></div>
        <button class="btn-icon" title="Subir" ${upDis} onclick="clMoveZona(${i},-1)">▲</button>
        <button class="btn-icon" title="Bajar" ${dnDis} onclick="clMoveZona(${i},1)">▼</button>
        <button class="btn-icon" title="Renombrar" onclick="clRenameZona(${i})">✏️</button>
        <button class="btn-icon" title="Eliminar" style="color:var(--red-alert)" onclick="clDeleteZona(${i})">✕</button>
      </div>`;
    }).join('');
    return `<div style="margin-bottom:14px;border:1px solid var(--light-gray);border-radius:10px;overflow:hidden">
      <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--cream)">
        <span style="font-size:15px">${sh.icon||'📍'}</span>
        <strong style="flex:1;font-size:13.5px;color:var(--charcoal)">${esc(sh.label)}</strong>
        <button class="btn-icon" title="Renombrar sección" onclick="clRenameSeccion('${sec}')">✏️</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:1px;background:var(--light-gray)">${zonasHTML || '<div style="padding:10px 12px;background:var(--warm-white);font-size:12px;color:var(--mid-gray)">Sin zonas todavía</div>'}</div>
      <div style="padding:8px 12px;background:var(--warm-white)"><button class="btn-secondary" style="font-size:11.5px;padding:5px 12px" onclick="clAddZona('${sec}')">+ Agregar zona a ${esc(sh.label)}</button></div>
    </div>`;
  }).join('');

  ov.innerHTML = `<div class="modal" style="max-width:600px;max-height:88vh;overflow-y:auto">
    <button class="modal-close" onclick="document.getElementById('gestion-zonas-modal').classList.remove('open')">✕</button>
    <div class="modal-title">🗂 Gestionar zonas del checklist</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:14px">Renombrá o agregá zonas y secciones. Los cambios se aplican a todos los días y se sincronizan con el equipo.</div>
    ${seccionesHTML}
    <div style="margin-top:8px"><button class="btn-add" style="font-size:12px;padding:8px 16px" onclick="clAddSeccion()">+ Agregar sección / área</button></div>
  </div>`;
  ov.classList.add('open');
}

function updTiempoRef(i, val){
  while(clTiemposRef.length < CL_TASKS.length) clTiemposRef.push(0);
  clTiemposRef[i] = parseInt(val)||0;
  fbSave('clTiemposRef', clTiemposRef);
}

// ── Tiempos estimados por área (gerencia) ─────────────────────────────────────
// Modal con TODAS las zonas del checklist agrupadas por sección para cargar el
// tiempo estimado (minutos) de cada una de un saque. Queda fijo (clTiemposRef en
// Firebase) y sirve para las métricas de cuánto se demora cada sección.
function openTiemposEstimados(){
  if(userRole!=='gerencia'){ showToast('⛔ Solo gerencia'); return; }
  let ov = document.getElementById('cl-tiempos-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='cl-tiempos-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  let lastSec = null;
  const filas = CL_TASKS.map((t,i)=>{
    let head = '';
    if(t.sec !== lastSec){
      lastSec = t.sec;
      const sh = SEC_HEADERS[t.sec] || {};
      head = `<tr><td colspan="3" style="padding:12px 12px 4px;font-weight:700;color:var(--charcoal);font-size:13px;border-bottom:1px solid var(--light-gray)">${sh.icon||'📍'} ${esc(sh.label||t.sec)}</td></tr>`;
    }
    const ref = getTiempoRef(i);
    return head + `<tr>
      <td style="padding:6px 12px;font-size:13px;font-weight:500">${esc(t.zona)}</td>
      <td style="padding:6px 12px"><span class="badge ${getBadge(t.actividad)}" style="font-size:10px">${esc(t.actividad)}</span></td>
      <td style="padding:6px 12px;text-align:right;white-space:nowrap">
        <input type="number" min="0" value="${ref||''}" placeholder="—" onchange="updTiempoRef(${i},this.value)"
          style="width:64px;padding:5px 6px;font-size:13px;text-align:center;border:1px solid var(--light-gray);border-radius:6px;background:var(--warm-white);color:var(--charcoal)"> <span style="font-size:11px;color:var(--mid-gray)">min</span>
      </td>
    </tr>`;
  }).join('');
  ov.innerHTML = `<div class="modal" style="max-width:520px;max-height:85vh;display:flex;flex-direction:column">
    <button class="modal-close" onclick="closeModal('cl-tiempos-modal'); if(window.renderChecklistTable) renderChecklistTable();">✕</button>
    <div class="modal-title">⏱ Tiempos estimados por área</div>
    <div style="font-size:12px;color:var(--mid-gray);margin:-6px 0 12px">Cargá los minutos estimados de cada zona. Queda fijo y sirve para medir cuánto se demora cada sección (marca en rojo las tareas que se pasan del tiempo).</div>
    <div style="overflow-y:auto;flex:1"><table style="width:100%;border-collapse:collapse">
      <thead><tr>
        <th style="text-align:left;padding:6px 12px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Zona</th>
        <th style="text-align:left;padding:6px 12px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Actividad</th>
        <th style="text-align:right;padding:6px 12px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Estimado</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table></div>
    <div class="modal-actions" style="margin-top:14px">
      <button class="btn-add" onclick="closeModal('cl-tiempos-modal'); if(window.renderChecklistTable) renderChecklistTable();">Listo</button>
    </div>
  </div>`;
  ov.classList.add('open');
}

// ── Promedios reales por zona vs. estimado (gerencia) ─────────────────────────
// Recorre el historial del checklist, promedia la duración real de cada zona y
// la compara con el tiempo estimado (clTiemposRef). Para ver dónde se demora más
// de lo previsto.
function openPromediosZona(){
  if(userRole!=='gerencia'){ showToast('⛔ Solo gerencia'); return; }
  // Promedio real por sec|zona|actividad
  const agg = {};
  (checklistHistory||[]).forEach(r=>{
    const dur = (+r.duracion) || calcDuracion(r.inicio||'', r.fin||'');
    if(!dur || dur<=0) return;
    const key = (r.sec||'')+'|'+(r.zona||'')+'|'+String(r.actividad||'').toLowerCase();
    if(!agg[key]) agg[key] = { n:0, sum:0 };
    agg[key].n++; agg[key].sum += dur;
  });

  const seen = new Set();
  let lastSec = null, filas = '', totalMuestras = 0, conDatos = 0;
  CL_TASKS.forEach((t,i)=>{
    const key = (t.sec||'')+'|'+(t.zona||'')+'|'+String(t.actividad||'').toLowerCase();
    if(seen.has(key)) return;
    seen.add(key);
    const a = agg[key];
    if(!a) return; // solo zonas con al menos un registro real
    conDatos++;
    totalMuestras += a.n;
    if(t.sec !== lastSec){
      lastSec = t.sec;
      const sh = SEC_HEADERS[t.sec] || {};
      filas += `<tr><td colspan="5" style="padding:12px 12px 4px;font-weight:700;color:var(--charcoal);font-size:13px;border-bottom:1px solid var(--light-gray)">${sh.icon||'📍'} ${esc(sh.label||t.sec)}</td></tr>`;
    }
    const prom = Math.round(a.sum / a.n);
    const est  = getTiempoRef(i);
    let desvHTML = '<span style="color:var(--mid-gray)">—</span>';
    if(est > 0){
      const dp = Math.round((prom - est) / est * 100);
      const col = dp <= 10 ? 'var(--green-ok)' : dp <= 30 ? 'var(--amber)' : 'var(--red-alert)';
      desvHTML = `<span style="color:${col};font-weight:600">${dp>0?'+':''}${dp}%</span>`;
    }
    filas += `<tr>
      <td style="padding:6px 12px;font-size:13px;font-weight:500">${esc(t.zona)}</td>
      <td style="padding:6px 12px"><span class="badge ${getBadge(t.actividad)}" style="font-size:10px">${esc(t.actividad)}</span></td>
      <td style="padding:6px 12px;text-align:center;color:var(--mid-gray);font-size:12px" title="Cantidad de veces registradas">${a.n}</td>
      <td style="padding:6px 12px;text-align:right;font-weight:600">${fmtDur(prom)}</td>
      <td style="padding:6px 12px;text-align:right;color:var(--mid-gray)">${est?est+'m':'—'}</td>
      <td style="padding:6px 12px;text-align:right">${desvHTML}</td>
    </tr>`;
  });

  let ov = document.getElementById('cl-promedios-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='cl-promedios-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="modal" style="max-width:600px;max-height:85vh;display:flex;flex-direction:column">
    <button class="modal-close" onclick="closeModal('cl-promedios-modal')">✕</button>
    <div class="modal-title">📈 Promedios reales por zona</div>
    <div style="font-size:12px;color:var(--mid-gray);margin:-6px 0 12px">Promedio de la duración real de cada zona vs. el tiempo estimado. Desvío en rojo = se tarda bastante más de lo previsto. ${conDatos?`${conDatos} zona${conDatos!==1?'s':''} con datos · ${totalMuestras} registro${totalMuestras!==1?'s':''}`:''}</div>
    ${conDatos
      ? `<div style="overflow-y:auto;flex:1"><table style="width:100%;border-collapse:collapse">
          <thead><tr>
            <th style="text-align:left;padding:6px 12px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Zona</th>
            <th style="text-align:left;padding:6px 12px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Act.</th>
            <th style="text-align:center;padding:6px 12px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)" title="Cuántas veces se registró">N</th>
            <th style="text-align:right;padding:6px 12px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Prom. real</th>
            <th style="text-align:right;padding:6px 12px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Estimado</th>
            <th style="text-align:right;padding:6px 12px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Desvío</th>
          </tr></thead>
          <tbody>${filas}</tbody>
        </table></div>`
      : '<p style="color:var(--mid-gray);font-size:13px;padding:20px;text-align:center">Todavía no hay tareas completadas con horario (Inicio–Fin) para promediar. Las floristas cronometran las tareas y acá vas viendo los promedios.</p>'}
    <div class="modal-actions" style="margin-top:14px">
      <button class="btn-add" onclick="closeModal('cl-promedios-modal')">Cerrar</button>
    </div>
  </div>`;
  ov.classList.add('open');
}

// Persistir un campo de un día puntual del checklist (localStorage + Firebase)
// ── Planificación fija (plantilla) del checklist ──────────────────────────────
// Guarda quién hace cada zona y si es Nuevo/Retoque por día de forma PERSISTENTE
// (no se borra al cambiar de semana). Cada semana nueva arranca con esta plantilla,
// así no hay que reasignar todo a mano; igual se puede editar cuando haga falta.
let checklistPlantilla = {}; // { [dia]: { responsable:[...], actividad:[...] } }
window._setChecklistPlantilla = v => { if(v && typeof v === 'object') checklistPlantilla = v; };
function _plantillaDia(day){
  if(!checklistPlantilla[day]) checklistPlantilla[day] = {};
  const p = checklistPlantilla[day];
  ['responsable','actividad'].forEach(k=>{
    if(!p[k]) p[k] = CL_TASKS.map(()=> '');
    if(!Array.isArray(p[k])) p[k] = Object.values(p[k]);
    while(p[k].length < CL_TASKS.length) p[k].push('');
  });
  return p;
}
function saveChecklistPlantilla(){ window._checklistPlantillaLastSave = Date.now(); fbSave('checklistPlantilla', checklistPlantilla); }
// Copia responsable + actividad del estado real de un día a la plantilla fija.
function _syncDiaAPlantilla(day){
  const ds = clStateByDay[day];
  if(!ds) return;
  const p = _plantillaDia(day);
  p.responsable = (ds.responsable||[]).map(r=>r||'');
  p.actividad   = (ds.actividad||[]).map((a,i)=> a || CL_TASKS[i].actividad);
  saveChecklistPlantilla();
}
// Aplica la plantilla fija a toda la semana (responsable + Nuevo/Retoque),
// sin tocar lo ya realizado (checks/tiempos). Para empujar la planificación a
// la semana en curso; las semanas nuevas ya la toman solas.
function aplicarPlantillaSemana(){
  const hayDatos = Object.values(checklistPlantilla).some(d =>
    (d && d.responsable && d.responsable.some(Boolean)) ||
    (d && d.actividad && d.actividad.some(a => a && String(a).toLowerCase()==='nuevo')));
  if(!hayDatos){ showToast('Todavía no hay planificación fija guardada. Asigná responsables/Nuevo y se guarda sola.'); return; }
  DIAS_SEMANA_NAMES.forEach(day=>{
    const ds = getOrCreateDayState(day);
    const p = checklistPlantilla[day];
    CL_TASKS.forEach((t,i)=>{
      ds.responsable[i] = (p && p.responsable && p.responsable[i]) || '';
      ds.actividad[i]   = (p && p.actividad && p.actividad[i]) || t.actividad;
    });
    if(window.fbSetPath) window.fbSetPath('checklist/'+day, ds);
  });
  try{ localStorage.setItem(CL_STORAGE_KEY, JSON.stringify(clStateByDay)); }catch(e){}
  if(!window.fbSetPath) fbSave('checklist', clStateByDay);
  window._checklistLastSave = Date.now();
  renderVistaSemanal();
  if(document.getElementById('page-checklist')?.classList.contains('active')){ clState = getOrCreateDayState(currentDay); renderChecklistTable(); }
  showToast('✓ Planificación fija aplicada a toda la semana');
}

function _persistCampoDia(day, campo){
  try{ localStorage.setItem(CL_STORAGE_KEY, JSON.stringify(clStateByDay)); }catch(e){}
  window._checklistLastSave = Date.now();
  if(window.fbUpdate) window.fbUpdate('checklist/'+day, {[campo]: clStateByDay[day][campo]});
  else fbSave('checklist', clStateByDay);
  // Guardar la planificación como plantilla fija (para reusar cada semana)
  if(campo==='responsable' || campo==='actividad') _syncDiaAPlantilla(day);
}

// Setear la actividad de una tarea en un día. Si es Nuevo, esa tarea pasa a
// Retoque el resto de la semana (el Nuevo se hace 1 sola vez por semana).
// Devuelve los días que se corrigieron automáticamente.
function setActividadDia(day, i, val){
  getOrCreateDayState(day).actividad[i] = val;
  _persistCampoDia(day, 'actividad');
  if(String(val).toLowerCase()!=='nuevo') return [];
  const cambiados = [];
  Object.entries(clStateByDay).forEach(([d,ds])=>{
    if(d===day || !Array.isArray(ds?.actividad)) return;
    if(String(ds.actividad[i]||'').toLowerCase()==='nuevo'){
      ds.actividad[i] = 'Retoque';
      cambiados.push(d);
      _persistCampoDia(d, 'actividad');
    }
  });
  // Los días aún no creados ya arrancan en Retoque por default
  return cambiados;
}

// Cambio de actividad desde la tabla diaria (solo gerencia)
function updActividad(i, val){
  const cambiados = setActividadDia(currentDay, i, val);
  if(String(val).toLowerCase()!=='nuevo') return;
  if(cambiados.length) showToast(`✓ Nuevo el ${currentDay} — ${CL_TASKS[i].zona} pasó a Retoque el resto de la semana (${cambiados.join(', ')})`);
  else showToast(`✓ Nuevo asignado a ${CL_TASKS[i].zona} — el resto de la semana queda en Retoque`);
}

// Al COMPLETAR un arreglo Nuevo, bajar a Retoque esa misma zona en cualquier
// otro día de la semana que todavía figure como Nuevo. Refuerza la regla "el
// Nuevo se hace 1 sola vez por semana" desde el hecho real (se hizo), no solo
// desde la planificación de gerencia. Sin esto, si la plantilla/planificación
// tenía la zona en Nuevo dos días (o gerencia lo cargó doble), la florista lo
// hacía un día y al día siguiente le volvía a aparecer como Nuevo.
// Fuerza la creación de todos los días de la semana para limpiar también los que
// aún no se abrieron y sincroniza la plantilla fija (así no reaparece la próxima
// semana). Toca por índice de fila i (no por nombre de zona), consistente con el
// resto del checklist.
function bajarNuevoRestoSemana(i, exceptDay){
  if(!CL_TASKS[i]) return;
  DIAS_SEMANA_NAMES.forEach(d=>{
    if(d===exceptDay) return;
    const ds = getOrCreateDayState(d);
    if(String(ds.actividad[i]||'').toLowerCase()==='nuevo'){
      ds.actividad[i] = 'Retoque';
      _persistCampoDia(d, 'actividad');
    }
  });
}

// ── Vista semanal del checklist (solo gerencia) ───────────────────────────────
// Grilla zonas × días para asignar responsables y marcar el Nuevo de cada zona
// de toda la semana de una sola vez.
function openVistaSemanal(){
  renderVistaSemanal();
  document.getElementById('cl-week-modal').classList.add('open');
}

function renderVistaSemanal(){
  const el = document.getElementById('cl-week-grid');
  if(!el) return;
  const dias = DIAS_SEMANA_NAMES;
  const estados = {};
  dias.forEach(d=>{ estados[d] = getOrCreateDayState(d); });
  let lastSec = null;
  let html = `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;padding:10px 14px;background:#EEF3EC;border:1px solid #D8E3D4;border-radius:8px">
    <div style="font-size:12px;color:#3A4A34">✓ Esta planificación queda <strong>guardada fija</strong> y se aplica sola al empezar cada semana nueva. Editá cuando haga falta y se guarda solo.</div>
    <button class="btn-secondary" style="font-size:11.5px;white-space:nowrap" onclick="aplicarPlantillaSemana()" title="Volver a aplicar la planificación fija a la semana actual">📋 Aplicar a esta semana</button>
  </div>
  <table class="stock-table" style="min-width:900px">
    <thead><tr><th style="min-width:150px;position:sticky;left:0;background:var(--warm-white);z-index:1">Zona</th>${dias.map(d=>{
      const nuevos = CL_TASKS.reduce((s,_,i)=>s+(String(estados[d].actividad[i]||'').toLowerCase()==='nuevo'?1:0),0);
      return `<th style="min-width:118px">${d===currentDay?'▸ ':''}${d.slice(0,3)}${nuevos?` <span style="font-size:9px;background:#B8602A;color:#fff;border-radius:8px;padding:1px 6px;vertical-align:middle">${nuevos} N</span>`:''}</th>`;
    }).join('')}</tr></thead><tbody>`;
  CL_TASKS.forEach((t,i)=>{
    if(t.sec !== lastSec){
      lastSec = t.sec;
      const sh = SEC_HEADERS[t.sec];
      html += `<tr class="cl-section-row ${sh.cls}"><td colspan="${dias.length+1}">${sh.icon}&nbsp;&nbsp;${sh.label}</td></tr>`;
    }
    html += `<tr><td style="font-weight:500;font-size:12px;position:sticky;left:0;background:var(--warm-white);z-index:1">${esc(t.zona)}</td>`;
    dias.forEach(d=>{
      const ds = estados[d];
      const actL = String(ds.actividad[i]||t.actividad).toLowerCase();
      const resp = ds.responsable[i]||'';
      const chip = actL==='riego'
        ? '<span class="badge badge-riego" style="font-size:9px">Riego</span>'
        : `<span class="badge ${actL==='nuevo'?'badge-nuevo':'badge-retoque'}" style="font-size:9px;cursor:pointer" title="Tocar para alternar Retoque/Nuevo" onclick="vsToggleActividad('${d}',${i})">${actL==='nuevo'?'NUEVO':'Retoque'}</span>`;
      html += `<td style="padding:5px 6px;vertical-align:top">
        <div style="margin-bottom:4px">${chip}</div>
        <select class="cl-select" style="font-size:10.5px;padding:3px 4px;max-width:110px" onchange="vsSetResp('${d}',${i},this.value)">
          <option value="">—</option>
          ${CL_RESP_OPTS.map(o=>`<option${o===resp?' selected':''}>${esc(o)}</option>`).join('')}
        </select>
      </td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function vsToggleActividad(day, i){
  const ds = getOrCreateDayState(day);
  const cur = String(ds.actividad[i]||CL_TASKS[i].actividad).toLowerCase();
  if(cur==='riego') return;
  const val = cur==='nuevo' ? 'Retoque' : 'Nuevo';
  const cambiados = setActividadDia(day, i, val);
  if(val==='Nuevo' && cambiados.length) showToast(`✓ Nuevo el ${day} — ${CL_TASKS[i].zona} pasó a Retoque: ${cambiados.join(', ')}`);
  renderVistaSemanal();
  if(document.getElementById('page-checklist')?.classList.contains('active')) renderChecklistTable();
}

function vsSetResp(day, i, val){
  getOrCreateDayState(day).responsable[i] = val;
  _persistCampoDia(day, 'responsable');
  if(day===currentDay && document.getElementById('page-checklist')?.classList.contains('active')) renderChecklistTable();
}

// ── Semana actual ISO (ej: "2026-W22") ────────────────────────────────────────
function getISOWeekKey(date){
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  const y = d.getUTCFullYear();
  const w = Math.ceil(((d - new Date(Date.UTC(y,0,1))) / 86400000 + 1) / 7);
  return `${y}-W${String(w).padStart(2,'0')}`;
}
const CURRENT_WEEK_KEY = getISOWeekKey(new Date());
const CL_STORAGE_KEY   = 'cl_state_' + CURRENT_WEEK_KEY;

// ── Cargar estado de la semana actual desde localStorage ──────────────────────
function loadWeekState(){
  try {
    const saved = localStorage.getItem(CL_STORAGE_KEY);
    if(saved) return JSON.parse(saved);
  } catch(e){}
  return null;
}

// ── Guardar estado del checklist ─────────────────────────────────────────────
// Guarda solo el día que cambió, no toda la semana.
// Así dos personas editando días distintos nunca se pisan.
function saveWeekState(day, campo){
  try {
    localStorage.setItem(CL_STORAGE_KEY, JSON.stringify(clStateByDay));
  } catch(e){}
  window._checklistLastSave = Date.now();
  const d = day || currentDay;
  const ds = clStateByDay[d];
  if(!ds) return;

  if(campo && window.fbUpdate){
    // Guardar SOLO el campo que cambió — no pisa los otros campos
    const updates = {};
    updates[campo] = ds[campo];
    window.fbUpdate('checklist/'+d, updates);
  } else if(window.fbSetPath){
    // Guardado completo del día (para resets, creación inicial, etc.)
    window.fbSetPath('checklist/'+d, ds);
  } else {
    fbSave('checklist', clStateByDay);
  }
  // Guardar la planificación como plantilla fija (para reusar cada semana)
  if(campo==='responsable' || campo==='actividad') _syncDiaAPlantilla(d);
}

// ── Inicializar estado del día — trae de localStorage si existe ───────────────
function getOrCreateDayState(day){
  if(!clStateByDay[day]){
    // Sembrar responsable y Nuevo/Retoque desde la plantilla fija si existe,
    // así una semana nueva ya arranca planificada sin cargar todo a mano.
    const plant = checklistPlantilla[day] || {};
    clStateByDay[day] = {
      checked:     CL_TASKS.map(()=>false),
      actividad:   CL_TASKS.map((t,i)=> (plant.actividad && plant.actividad[i]) || t.actividad),
      obs:         CL_TASKS.map(t=>t.obs||''),
      tiempo:      CL_TASKS.map(()=>''),
      inicio:      CL_TASKS.map(()=>''),
      fin:         CL_TASKS.map(()=>''),
      responsable: CL_TASKS.map((_,i)=> (plant.responsable && plant.responsable[i]) || ''),
    };
    // NO guardar a Firebase aquí — se guarda solo cuando el usuario hace un cambio explícito.
    // Si guardamos acá, pisamos los datos reales cuando otro dispositivo abre la app.
  } else {
    // Migración/reparación: convertir objetos de Firebase a arrays y completar campos faltantes
    const ds = clStateByDay[day];
    ['checked','actividad','obs','tiempo','inicio','fin','responsable'].forEach(k => {
      if(!ds[k]) ds[k] = CL_TASKS.map(()=> k==='actividad' ? '' : (k==='checked' ? false : ''));
      if(!Array.isArray(ds[k])) ds[k] = Object.values(ds[k]);
      // Asegurar largo correcto
      while(ds[k].length < CL_TASKS.length) ds[k].push(k==='checked' ? false : '');
    });
    // Reparar estados viejos: una tarea con hora de Fin registrada está completada.
    // Antes, editar el Fin a mano (gerencia) no la tildaba, así que quedaban tareas
    // con duración pero figurando pendientes. Se corrige al hidratar.
    ds.checked = ds.checked.map((c,i)=> c || !!(ds.fin && ds.fin[i]));
  }
  return clStateByDay[day];
}

// Cargar semana guardada al iniciar
(function(){
  const saved = loadWeekState();
  if(saved) clStateByDay = saved;
})();

let checklistHistory = [];
// Registro PERSISTENTE de la última vez que cada zona se hizo Nuevo.
// Independiente del historial semanal: no se pierde al cambiar de semana ni al
// podar el historial. Clave: sec|zona (saneada para Firebase). Valor: fecha ISO.
let ultimoNuevoZona = {};
window._setUltimoNuevoZona = (v) => { if(v && typeof v === 'object') ultimoNuevoZona = v; };
let currentDay = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].includes(TODAY_DAY) ? TODAY_DAY : 'Lunes';
let historyWeekFilter = null;

function getBadge(act){
  const a = (act||'').toLowerCase();
  if(a.includes('nuevo')) return 'badge-nuevo';
  if(a.includes('retoque')) return 'badge-retoque';
  if(a.includes('reemplazo')) return 'badge-reemplazo';
  if(a.includes('riego')) return 'badge-riego';
  if(a.includes('mantenimiento')) return 'badge-mantenimiento';
  if(a.includes('pedido')) return 'badge-pedido';
  return 'badge-retoque';
}

function initChecklist(){
  // ── Banner semana actual ──────────────────────────────────────────────────
  let weekBanner = document.getElementById('cl-week-banner');
  if(!weekBanner){
    weekBanner = document.createElement('div');
    weekBanner.id = 'cl-week-banner';
    weekBanner.style.cssText = 'display:flex;align-items:center;justify-content:space-between;background:#FDFCFB;border:1px solid #E4E2DC;border-radius:4px;padding:10px 18px;margin-bottom:14px;flex-wrap:wrap;gap:10px';
    document.getElementById('day-tabs-container').before(weekBanner);
  }
  let totalDone = 0;
  try {
    totalDone = Object.values(clStateByDay||{}).reduce((s,d) => {
      const arr = Array.isArray(d?.checked) ? d.checked : (d?.checked ? Object.values(d.checked) : []);
      return s + arr.filter(Boolean).length;
    }, 0);
  } catch(e){ totalDone = 0; }
  weekBanner.innerHTML = `
    <div style="font-size:12px;color:var(--mid-gray)">
      📅 <strong style="color:var(--charcoal)">${CURRENT_WEEK_KEY.replace('-W',' · Semana ')}</strong>
      &nbsp;·&nbsp; ${totalDone} tarea${totalDone!==1?'s':''} completada${totalDone!==1?'s':''} esta semana
    </div>
    <button class="btn-secondary" style="font-size:11px;padding:5px 12px;color:var(--red-alert);border-color:var(--red-alert)"
      onclick="resetWeekState()">🗑 Limpiar semana</button>`;

  const tabs = document.getElementById('day-tabs-container');
  tabs.innerHTML = '';
  ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].forEach(d=>{
    const t = document.createElement('div');
    t.className = 'day-tab'+(d===currentDay?' active':'');
    t.textContent = d;
    t.onclick = ()=>{
      currentDay = d;
      clState = getOrCreateDayState(d);
      renderChecklistTable();
    };
    tabs.appendChild(t);
  });
  // Activar el estado del día actual
  clState = getOrCreateDayState(currentDay);
  renderChecklistTable();
  renderHistoryPanel();
  renderFlorTurnoCard();
  renderLlamadosChecklist();
  const _htc = document.getElementById('home-tasks-count'); if(_htc) _htc.textContent = CL_TASKS.length;
}

async function resetWeekState(){
  if(userRole !== 'gerencia'){ showToast('⛔ Solo gerencia puede limpiar la semana'); return; }
  if(!await confirmModal('¿Limpiar todas las tareas de esta semana? El historial se conserva.')) return;
  clStateByDay = {};
  fbSave('checklist', clStateByDay); // Limpiar TODOS los días de Firebase
  clState = getOrCreateDayState(currentDay);
  try { localStorage.removeItem(CL_STORAGE_KEY); } catch(e){}
  initChecklist();
  showToast('✅ Semana reiniciada — todas las tareas limpiadas');
}


function calcDuracion(inicio, fin){
  if(!inicio || !fin) return null;
  const [h1,m1] = inicio.split(':').map(Number);
  const [h2,m2] = fin.split(':').map(Number);
  let mins = (h2*60+m2) - (h1*60+m1);
  if(mins < 0) mins += 24*60;
  return mins > 0 ? mins : null;
}
function fmtDur(mins){
  if(mins === null || mins === undefined) return '—';
  const h = Math.floor(mins/60), m = mins%60;
  return h>0 ? (h+'h '+(m>0?m+'m':'')).trim() : m+'m';
}
function durBadge(inicio, fin, ref){
  const mins = calcDuracion(inicio, fin);
  if(!mins) return '<span style="font-size:11px;color:var(--mid-gray)">—</span>';
  // Excedida: superó el tiempo promedio de referencia definido por gerencia
  if(ref && mins > ref){
    return `<span title="Excedió la referencia de ${ref}m" style="font-size:11px;font-weight:600;color:var(--red-alert);background:#FDECEC;padding:2px 8px;border-radius:10px">⚠️ ${fmtDur(mins)}</span>`;
  }
  const color = mins > 60 ? 'var(--amber)' : 'var(--green-ok)';
  const bg    = mins > 60 ? '#FDF8E8'      : '#EBF5E8';
  return `<span style="font-size:11px;font-weight:600;color:${color};background:${bg};padding:2px 8px;border-radius:10px">${fmtDur(mins)}</span>`;
}

// ── Último "Nuevo" por zona (contador de días, solo gerencia) ────────────────
// Recorre el historial del checklist y devuelve la fecha más reciente en que
// cada zona se completó con actividad Nuevo. Clave: sec + '|' + zona.
// Clave saneada para Firebase (las zonas pueden tener '.', '/', etc. que RTDB no permite en claves)
function _zonaKey(sec, zona){ return (sec||'')+'|'+String(zona||'').replace(/[.#$/[\]]/g,'_'); }

// Última vez que cada zona se hizo Nuevo. Mezcla el registro persistente
// (ultimoNuevoZona, que sobrevive a cambios de semana y a la poda) con el
// historial semanal, quedándose siempre con la fecha más reciente.
function mapUltimoNuevoPorZona(){
  const map = {};
  Object.entries(ultimoNuevoZona||{}).forEach(([k,fecha])=>{ if(fecha) map[k] = fecha; });
  (checklistHistory||[]).forEach(r=>{
    if(!r?.date || !r?.zona) return;
    if(!String(r.actividad||'').toLowerCase().includes('nuevo')) return;
    const k = _zonaKey(r.sec, r.zona);
    if(!map[k] || r.date > map[k]) map[k] = r.date;
  });
  return map;
}

// Marca (persistente) que una zona se hizo Nuevo hoy. Se llama al completar
// una tarea Nuevo; queda fijo para siempre aunque cambie la semana.
function registrarUltimoNuevo(sec, zona, actividad, fecha){
  if(!String(actividad||'').toLowerCase().includes('nuevo')) return;
  const k = _zonaKey(sec, zona);
  if(!ultimoNuevoZona[k] || (fecha||TODAY_ISO) > ultimoNuevoZona[k]){
    ultimoNuevoZona[k] = fecha || TODAY_ISO;
    fbSave('ultimoNuevoZona', ultimoNuevoZona);
  }
}

function badgeUltimoNuevo(fecha){
  if(!fecha) return '<div style="font-size:10px;color:var(--mid-gray);margin-top:2px;font-weight:400">🌸 Sin registro de Nuevo</div>';
  const dias = Math.max(0, Math.floor((new Date(TODAY_ISO)-new Date(fecha))/86400000));
  const color = dias>=7 ? 'var(--red-alert)' : dias>=5 ? '#A06A00' : 'var(--sage-dark)';
  const txt = dias===0 ? 'Nuevo hoy' : dias===1 ? 'Nuevo ayer' : `Nuevo hace ${dias} días`;
  return `<div style="font-size:10px;font-weight:600;color:${color};margin-top:2px" title="Último Nuevo: ${fmtDate(fecha)}">🌸 ${txt}</div>`;
}

// ── Nuevos atrasados (solo gerencia) ─────────────────────────────────────────
// Zonas cuyo último arreglo Nuevo ya tiene UMBRAL_NUEVO_ATRASADO días o más.
// Solo considera zonas que alguna vez se hicieron Nuevo (tienen cadencia); las
// que nunca tuvieron Nuevo (Retoque/Riego puro) no se listan para no hacer ruido.
const UMBRAL_NUEVO_ATRASADO = 7;
function nuevosAtrasados(umbral = UMBRAL_NUEVO_ATRASADO){
  const map = mapUltimoNuevoPorZona();
  const vistas = new Set();
  const out = [];
  CL_TASKS.forEach(t=>{
    const k = _zonaKey(t.sec, t.zona);
    if(vistas.has(k)) return;
    vistas.add(k);
    const fecha = map[k];
    if(!fecha) return;
    const dias = Math.floor((new Date(TODAY_ISO)-new Date(fecha))/86400000);
    if(dias >= umbral) out.push({sec:t.sec, zona:t.zona, dias, fecha});
  });
  return out.sort((a,b)=>b.dias-a.dias);
}

// Banner de aviso arriba del checklist (solo gerencia). Lista las zonas con el
// Nuevo vencido para que se reprogramen antes de que el arreglo se marchite.
function renderNuevosAtrasadosBanner(){
  let el = document.getElementById('cl-overdue-banner');
  if(userRole !== 'gerencia'){ if(el) el.innerHTML = ''; return; }
  if(!el){
    el = document.createElement('div');
    el.id = 'cl-overdue-banner';
    const anchor = document.getElementById('cl-progress-bar-wrap')
      || document.getElementById('cl-table-wrap')
      || document.getElementById('checklist-body')?.closest('.table-wrapper');
    if(anchor) anchor.before(el); else return;
  }
  const list = nuevosAtrasados();
  if(!list.length){ el.innerHTML = ''; return; }
  const chips = list.map(z=>{
    const sh = SEC_HEADERS[z.sec];
    return `<span style="display:inline-block;background:#fff;border:1px solid #F0C0C0;border-radius:10px;padding:3px 9px;margin:3px 4px 0 0;font-size:11.5px;white-space:nowrap" title="Último Nuevo: ${fmtDate(z.fecha)}">${sh?sh.icon:''} ${esc(z.zona)} · <strong>${z.dias} días</strong></span>`;
  }).join('');
  el.innerHTML = `<div class="alert-banner" style="margin-bottom:14px">
    <div style="font-weight:600;margin-bottom:2px">🥀 ${list.length} zona${list.length!==1?'s':''} con Nuevo atrasado (${UMBRAL_NUEVO_ATRASADO}+ días)</div>
    <div style="font-size:11.5px;opacity:.85;margin-bottom:4px">Reprogramá un arreglo Nuevo desde la vista semanal antes de que se marchiten.</div>
    <div>${chips}</div>
  </div>`;
}

// ── Fases de un evento: armado → colocación → retiro (las 2 últimas opcionales) ──
function eventoFase(ev){
  if(ev.estado === 'Pendiente de Colocacion') return 'colocacion';
  if(ev.estado === 'Pendiente de Retiro') return 'retiro';
  return 'armado';
}
function eventoFlorFase(ev, fase){
  return fase === 'retiro' ? (ev.retiroAsignado||'')
    : fase === 'colocacion' ? (ev.colocacionAsignado||'')
    : (ev.asignado||'');
}
function eventoFaseTag(fase){
  if(fase === 'retiro') return '<span style="font-size:9px;font-weight:700;background:#7A5CB8;color:#fff;padding:2px 6px;border-radius:5px;margin-left:6px">🔄 RETIRO</span>';
  if(fase === 'colocacion') return '<span style="font-size:9px;font-weight:700;background:#E65100;color:#fff;padding:2px 6px;border-radius:5px;margin-left:6px">📍 COLOCACIÓN</span>';
  return '<span style="font-size:9px;font-weight:700;background:#5A8C3A;color:#fff;padding:2px 6px;border-radius:5px;margin-left:6px">🔨 ARMADO</span>';
}
// ¿Ya es momento de que el florista vea esta fase del evento?
// Armado: siempre (lo ve para prepararlo). Colocación/Retiro: recién el día
// programado (colocacionFecha/retiroFecha; si no se cargó, cae en ev.fecha) y,
// si hay hora cargada, a partir de esa hora. Un día futuro no se muestra: así
// el florista no ve un retiro/colocación antes de que corresponda.
const MARGEN_FASE_MIN = 30; // el florista ve la fase (y recibe el aviso) 30 min antes de la hora
function _hmToMin(hm){ if(!hm || !hm.includes(':')) return null; const [h,m]=hm.split(':').map(Number); return (h||0)*60+(m||0); }
function faseVisibleFlorista(ev, fase){
  if(fase === 'armado') return true;
  const hoy = TODAY_ISO;
  const fecha = (fase === 'retiro' ? ev.retiroFecha : ev.colocacionFecha) || ev.fecha || '';
  const hora  = (fase === 'retiro' ? ev.retiroHora  : ev.colocacionHora)  || '';
  if(fecha && fecha > hoy) return false;                 // día futuro → todavía no
  if(fecha === hoy && hora){
    const d = new Date();
    const nowMin = d.getHours()*60 + d.getMinutes();
    const hMin = _hmToMin(hora);
    if(hMin != null && nowMin < hMin - MARGEN_FASE_MIN) return false; // falta más que el margen
  }
  return true;
}
// Aviso push al florista cuando se habilita la colocación/retiro (a MARGEN_FASE_MIN
// de la hora, ese día). Una sola vez por evento/fase/día (flag persistido en el
// evento). Corre en el timer de cada minuto.
function checkRecordatoriosFaseEvento(){
  if(!Array.isArray(eventosData) || !eventosData.length) return;
  const hoy = TODAY_ISO;
  const d = new Date();
  const nowMin = d.getHours()*60 + d.getMinutes();
  let cambio = false;
  const fases = [
    ['colocacionAsignado','colocacionFecha','colocacionHora','colocacionFin','colocacionAvisada','📍 Colocación','colocación'],
    ['retiroAsignado','retiroFecha','retiroHora','retiroFin','retiroAvisada','🔄 Retiro','retiro'],
  ];
  eventosData.forEach(ev=>{
    if(ev.estado === 'Pedidos Finalizados') return;
    fases.forEach(([kAsig,kFecha,kHora,kFin,kAviso,lbl,faseTxt])=>{
      const flor  = ev[kAsig];
      const fecha = ev[kFecha] || ev.fecha || '';
      const hora  = ev[kHora] || '';
      if(!flor || !hora || fecha !== hoy) return; // solo con florista, hora cargada y para hoy
      if(ev[kFin]) return;                          // ya se hizo
      if(ev[kAviso] === hoy) return;                // ya se avisó hoy
      const hMin = _hmToMin(hora);
      if(hMin == null || nowMin < hMin - MARGEN_FASE_MIN) return; // todavía no se habilitó
      notificarAsignacion(flor, `${lbl}: ${ev.nombre}`, `${faseTxt.charAt(0).toUpperCase()+faseTxt.slice(1)} programada ${hora}${ev.salon?' · '+ev.salon:''}. Ya te aparece en tu checklist.`);
      ev[kAviso] = hoy;
      cambio = true;
    });
  });
  if(cambio) fbSave('eventosData', eventosData);
}

function renderChecklistTable(){
  if(!clState){
    clState = getOrCreateDayState(currentDay);
  }
  // Garantizar que los arrays existan y tengan el largo correcto
  const n = CL_TASKS.length;
  ['checked','actividad','obs','tiempo','inicio','fin','responsable'].forEach(k => {
    if(!Array.isArray(clState[k]) || clState[k].length < n){
      clState[k] = CL_TASKS.map((t,i) => {
        const existing = clState[k]?.[i];
        if(existing !== undefined && existing !== null) return existing;
        return k==='actividad' ? t.actividad : (k==='obs' ? (t.obs||'') : (k==='checked' ? false : ''));
      });
    }
  });

  // Update day tab active state + badge de progreso por día.
  // OJO: acotado al contenedor del checklist. Antes usaba document.querySelectorAll
  // ('.day-tab') global y pisaba el onclick de OTRAS solapas que comparten la clase
  // (ej. las de Composiciones Eventos/Hotel), dejándolas sin funcionar.
  (document.getElementById('day-tabs-container')?.querySelectorAll('.day-tab') || []).forEach(tabEl=>{
    const d = tabEl.dataset.day || tabEl.textContent.trim();
    tabEl.dataset.day = d;
    const ds = clStateByDay[d];
    const isActive = d===currentDay;
    tabEl.classList.toggle('active', isActive);
    const done = ds ? (Array.isArray(ds.checked) ? ds.checked : Object.values(ds.checked||{})).filter(Boolean).length : 0;
    const total = CL_TASKS.length;
    const pct = Math.round(done/total*100);
    let badge = '';
    if(done>0 && !isActive){
      const col = pct===100?'var(--green-ok)':pct>50?'var(--sage)':'var(--amber)';
      badge = `<span style="display:inline-block;margin-left:5px;background:${col};color:white;font-size:9px;font-weight:700;padding:1px 5px;border-radius:8px;vertical-align:middle">${done}/${total}</span>`;
    } else if(pct===100 && isActive){
      badge = ` ✅`;
    }
    // Reconstruct tab text
    tabEl.innerHTML = d + badge;
    // Re-bind click since we replaced innerHTML
    tabEl.onclick = (()=>{
      const day = d;
      return ()=>{ currentDay=day; clState=getOrCreateDayState(day); renderChecklistTable(); };
    })();
  });

  // Progress bar
  const checkedArr = Array.isArray(clState.checked) ? clState.checked : Object.values(clState.checked||{});
  let done_count, total;
  if(userRole === 'florista'){
    // Solo contar tareas asignadas al florista
    const misTareas = CL_TASKS.map((_,i) => i).filter(i => clState.responsable[i] === floristaNombre);
    done_count = misTareas.filter(i => checkedArr[i]).length;
    total = misTareas.length;
  } else {
    done_count = checkedArr.filter(Boolean).length;
    total = CL_TASKS.length;
  }
  const pct = Math.round(done_count/total*100);
  let progressEl = document.getElementById('cl-progress-bar-wrap');
  if(!progressEl){
    progressEl = document.createElement('div');
    progressEl.id = 'cl-progress-bar-wrap';
    // Antes de las tarjetas (floristas) y de la tabla (resto)
    const wrapper = document.getElementById('cl-cards-wrap') || document.getElementById('checklist-body').closest('.table-wrapper');
    wrapper.before(progressEl);
  }
  progressEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
      <div style="flex:1;height:7px;background:var(--light-gray);border-radius:4px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:${pct===100?'var(--green-ok)':'var(--sage)'};border-radius:4px;transition:width .3s"></div>
      </div>
      <span style="font-size:12px;color:var(--mid-gray);white-space:nowrap">${done_count} / ${total} tareas${pct===100?' ✅ ¡Completada!':''}</span>
    </div>`;

  // Aviso de Nuevos atrasados (gerencia). Se ubica arriba de la barra de progreso.
  renderNuevosAtrasadosBanner();

  // ── Floristas: vista de tarjetas (mobile-first) en lugar de la tabla ──
  const cardsWrap = document.getElementById('cl-cards-wrap');
  const tableWrap = document.getElementById('cl-table-wrap');
  if(userRole === 'florista'){
    if(tableWrap) tableWrap.style.display = 'none';
    if(cardsWrap){ cardsWrap.style.display = ''; renderChecklistCards(cardsWrap); }
    const fEl = document.getElementById('cl-filtro-wrap');
    if(fEl) fEl.style.display = 'none';
    renderProductividadCL();
    return;
  }
  if(tableWrap) tableWrap.style.display = '';
  if(cardsWrap) cardsWrap.style.display = 'none';

  // ── Filtro rápido (gerencia/operario): por zona/responsable y estado ──
  // Se crea una sola vez para no perder el foco del input al re-renderizar
  let filtroEl = document.getElementById('cl-filtro-wrap');
  if(!filtroEl){
    filtroEl = document.createElement('div');
    filtroEl.id = 'cl-filtro-wrap';
    filtroEl.innerHTML = `
      <input class="cl-obs-input" id="cl-filtro-txt" placeholder="🔍 Filtrar por zona o responsable..." style="flex:1;min-width:160px"
        oninput="clSetFiltro('txt',this.value)">
      <button class="filter-btn cl-fbtn" data-f="all"    onclick="clSetFiltro('estado','all')">Todas</button>
      <button class="filter-btn cl-fbtn" data-f="pend"   onclick="clSetFiltro('estado','pend')">Pendientes</button>
      <button class="filter-btn cl-fbtn" data-f="hechas" onclick="clSetFiltro('estado','hechas')">Hechas</button>`;
    filtroEl.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px';
    document.getElementById('cl-table-wrap').before(filtroEl);
  }
  filtroEl.style.display = '';
  filtroEl.querySelectorAll('.cl-fbtn').forEach(b=>b.classList.toggle('active', b.dataset.f===clFiltro.estado));

  const tbody = document.getElementById('checklist-body');
  tbody.innerHTML = '';
  let lastSec = '';

  // Header dinámico según rol
  const thead = document.getElementById('checklist-thead');
  if(thead){
    if(userRole === 'florista'){
      thead.innerHTML = '<tr><th>Zona</th><th>Actividad</th><th style="width:60px">⏱ Ref.</th><th>Observaciones</th><th style="width:90px">Inicio</th><th style="width:90px">Fin</th></tr>';
    } else {
      thead.innerHTML = '<tr><th style="width:32px">✓</th><th>Zona</th><th>Actividad</th><th style="width:60px">⏱ Ref.</th><th>Observaciones</th><th style="width:90px">Inicio</th><th style="width:90px">Fin</th><th style="width:75px">Duración</th><th>Responsable</th><th style="width:32px"></th></tr>';
    }
  }

  // Para floristas: determinar qué secciones tienen tareas asignadas
  const isFlorista = userRole === 'florista';
  // Contador de días desde el último Nuevo por zona — solo lo ve gerencia
  const ultimoNuevoMap = userRole==='gerencia' ? mapUltimoNuevoPorZona() : null;
  CL_TASKS.forEach((t,i)=>{
    const curResp = clState.responsable[i] || t.responsable || '';

    // Florista individual: solo ver tareas asignadas a ellos
    if(isFlorista && curResp !== floristaNombre) return;

    // Filtro rápido de gerencia: texto (zona/responsable) y estado
    if(!isFlorista){
      const txt = clFiltro.txt.trim().toLowerCase();
      if(txt && !t.zona.toLowerCase().includes(txt) && !String(curResp).toLowerCase().includes(txt)) return;
      if(clFiltro.estado==='pend' && clState.checked[i]) return;
      if(clFiltro.estado==='hechas' && !clState.checked[i]) return;
    }

    // Section header
    if(t.sec !== lastSec){
      lastSec = t.sec;
      const sh = SEC_HEADERS[t.sec];
      const hr = document.createElement('tr');
      hr.className = 'cl-section-row ' + sh.cls;
      hr.innerHTML = `<td colspan="${isFlorista?6:10}">${sh.icon}&nbsp;&nbsp;${sh.label}</td>`;
      tbody.appendChild(hr);
    }

    const done    = clState.checked[i];
    const curAct  = clState.actividad[i]   || t.actividad;
    const curObs  = (clState.obs[i] && clState.obs[i] !== 'Observaciones') ? clState.obs[i] : (t.obs||'');
    const sh      = SEC_HEADERS[t.sec];
    const ref     = getTiempoRef(i);

    // Actividad: la determina gerencia (default Retoque); el resto la ve como badge
    const actLower = String(curAct).toLowerCase();
    const actividadCell = userRole==='gerencia'
      ? `<select class="cl-select" onchange="updActividad(${i},this.value)" ${done?'disabled':''}>
          ${CL_ACTIVIDAD_OPTS.map(o=>`<option${o.toLowerCase()===actLower?' selected':''}>${esc(o)}</option>`).join('')}
        </select>`
      : `<span class="badge ${getBadge(curAct)}">${esc(curAct)}</span>`;
    // Tiempo promedio de referencia: gerencia lo edita, floristas lo ven
    const refCell = userRole==='gerencia'
      ? `<input type="number" min="0" value="${ref||''}" placeholder="min"
          style="width:52px;padding:4px 5px;font-size:12px;border:1px solid var(--light-gray);border-radius:4px;text-align:center;background:var(--warm-white);color:var(--charcoal)"
          onchange="updTiempoRef(${i},this.value)">`
      : (ref ? `<span style="font-size:11.5px;font-weight:600;color:var(--mid-gray);white-space:nowrap">⏱ ${ref}m</span>` : '<span style="font-size:11px;color:var(--mid-gray)">—</span>');

    const tr = document.createElement('tr');
    tr.className = sh.rowCls + (done ? ' task-row-done' : '');

    if(isFlorista){
      tr.innerHTML = `
        <td style="font-weight:500;font-size:12.5px;min-width:140px">${esc(t.zona)}</td>
        <td style="min-width:100px">${actividadCell}</td>
        <td style="width:60px;text-align:center">${refCell}</td>
        <td style="min-width:150px">
          <input class="cl-obs-input" value="${esc(curObs)}" placeholder="Observaciones..."
            onchange="updCL(${i},'obs',this.value)" ${done?'disabled':''} style="width:100%">
        </td>
        <td style="width:90px;text-align:center;padding:4px 6px">${renderHoraCell(i,'inicio',done)}</td>
        <td style="width:90px;text-align:center;padding:4px 6px">${renderHoraCell(i,'fin',done)}</td>`;
    } else {
      const nuevoInfo = ultimoNuevoMap && actLower!=='riego' ? badgeUltimoNuevo(ultimoNuevoMap[_zonaKey(t.sec,t.zona)]) : '';
      tr.innerHTML = `
        <td style="width:32px"><input type="checkbox" class="task-check" ${done?'checked':''} onchange="toggleTask(${i},this)"></td>
        <td style="font-weight:500;font-size:12.5px;min-width:140px">${esc(t.zona)}${nuevoInfo}</td>
        <td style="min-width:100px">${actividadCell}</td>
        <td style="width:60px;text-align:center">${refCell}</td>
        <td style="min-width:150px">
          <input class="cl-obs-input" value="${esc(curObs)}" placeholder="Observaciones..."
            onchange="updCL(${i},'obs',this.value)" ${done?'disabled':''} style="width:100%">
        </td>
        <td style="width:90px;text-align:center;padding:4px 6px">${renderHoraCell(i,'inicio',done)}</td>
        <td style="width:90px;text-align:center;padding:4px 6px">${renderHoraCell(i,'fin',done)}</td>
        <td style="width:80px;text-align:center">${durBadge(clState.inicio?.[i], clState.fin?.[i], ref)}</td>
        <td style="min-width:110px">
          ${userRole==='operario'
            ? '<span style="font-size:13px;color:var(--charcoal);padding:4px 2px;display:block">' + (curResp || '<em style="color:var(--mid-gray);font-size:12px">Sin asignar</em>') + '</span>'
            : '<select class="cl-select" onchange="updCL('+i+',\'responsable\',this.value)" '+(done?'disabled':'')+'>'+
              '<option value="">— Responsable —</option>'+
              CL_RESP_OPTS.map(o=>'<option'+(o===curResp?' selected':'')+'>'+esc(o)+'</option>').join('')+
              '</select>'
          }
        </td>
        <td style="width:32px;text-align:center"><span style="font-size:16px">${done?'\u2705':''}</span></td>`;
    }

    tbody.appendChild(tr);
  });

  // ── Eventos del día (fase armado, colocación o retiro según el estado) ──
  const eventosHoy = eventosData.filter(ev => {
    if(ev.estado === 'Pedidos Finalizados') return false;
    const fase = eventoFase(ev);
    const flor = eventoFlorFase(ev, fase);
    if(isFlorista) return flor === floristaNombre && faseVisibleFlorista(ev, fase);
    // gerencia/operario: ven los activos que tengan alguien asignado en alguna fase
    return ev.asignado || ev.colocacionAsignado || ev.retiroAsignado;
  });
  if(eventosHoy.length > 0){
    const evHeader = document.createElement('tr');
    evHeader.className = 'cl-section-row';
    evHeader.style.cssText = 'background:#FDF0E8';
    evHeader.innerHTML = `<td colspan="${isFlorista?6:10}" style="font-weight:600;color:#B8602A">🎉 Eventos del día</td>`;
    tbody.appendChild(evHeader);

    eventosHoy.forEach(ev => {
      const evIdx = eventosData.indexOf(ev);
      const evTr = document.createElement('tr');
      evTr.style.cssText = 'background:#FEFAF6';
      const fase = eventoFase(ev);
      const flor = eventoFlorFase(ev, fase);
      const faseTag = eventoFaseTag(fase);
      const iniVal = fase === 'retiro' ? ev.retiroInicio : fase === 'colocacion' ? ev.colocacionInicio : ev.inicio;
      const finVal = fase === 'retiro' ? ev.retiroFin : fase === 'colocacion' ? ev.colocacionFin : ev.fin;

      if(isFlorista){
        evTr.innerHTML = `
          <td style="font-weight:600;font-size:12.5px;color:#B8602A">🎉 ${esc(ev.nombre)}${badgeDiaRelativa(ev.fecha)}${faseTag}</td>
          <td style="font-size:12px">${esc(ev.tipo)} · ${esc(ev.salon||'')}</td>
          <td></td>
          <td style="font-size:11px;color:var(--mid-gray)">${ev.pax?ev.pax+' pax':''} ${ev.hora?'· '+ev.hora:''}</td>
          <td style="width:90px;text-align:center;padding:4px 6px">${renderEvHoraCell(evIdx,'inicio',ev,fase)}</td>
          <td style="width:90px;text-align:center;padding:4px 6px">${renderEvHoraCell(evIdx,'fin',ev,fase)}</td>`;
      } else {
        evTr.innerHTML = `
          <td style="width:32px"></td>
          <td style="font-weight:600;font-size:12.5px;color:#B8602A">🎉 ${esc(ev.nombre)}${badgeDiaRelativa(ev.fecha)}${faseTag}</td>
          <td style="font-size:12px">${esc(ev.tipo)}</td>
          <td></td>
          <td style="font-size:11px;color:var(--mid-gray)">${esc(ev.salon||'')} · ${ev.pax?ev.pax+' pax':''} ${ev.hora?'· '+ev.hora:''}</td>
          <td style="width:90px;text-align:center;padding:4px 6px">${renderEvHoraCell(evIdx,'inicio',ev,fase)}</td>
          <td style="width:90px;text-align:center;padding:4px 6px">${renderEvHoraCell(evIdx,'fin',ev,fase)}</td>
          <td style="width:80px;text-align:center">${durBadge(iniVal, finVal)}</td>
          <td style="font-size:12px;color:var(--sage-dark);font-weight:600">${flor ? esc(flor) : '<span style="color:var(--mid-gray)">sin asignar</span>'}</td>
          <td></td>`;
      }
      // Tap en el evento → abrir el detalle (excepto al tocar los botones inicio/fin)
      evTr.style.cursor = 'pointer';
      evTr.title = 'Ver detalle del evento';
      evTr.addEventListener('click', e => { if(e.target.closest('button')) return; openEventoDetail(evIdx); });
      tbody.appendChild(evTr);
    });
  }

  // ── Ventas / pedidos asignados pendientes (gerencia/operario ven todos; el florista ve los suyos) ──
  const ventasHoy = (ventasData||[]).filter(v =>
    v.asignado && v.estado === 'pendiente' && !v.fin &&
    (!isFlorista || v.asignado === floristaNombre)
  );
  if(ventasHoy.length > 0){
    const vtHeader = document.createElement('tr');
    vtHeader.className = 'cl-section-row';
    vtHeader.style.cssText = 'background:#E8EDF8';
    vtHeader.innerHTML = `<td colspan="${isFlorista?6:10}" style="font-weight:600;color:#2C5A80">💐 Ventas pendientes</td>`;
    tbody.appendChild(vtHeader);

    ventasHoy.forEach(v => {
      const vIdx = ventasData.indexOf(v);
      const vtTr = document.createElement('tr');
      vtTr.style.cssText = 'background:#F5F7FC';

      const detalle = [v.desc, v.colores ? '🎨 '+v.colores : '', v.dedicatoria ? '✉️ "'+v.dedicatoria+'"' : '', v.dir ? '📍 '+v.dir : '', v.fecha ? '📅 '+fmtDate(v.fecha) : ''].filter(Boolean).join(' · ');

      if(isFlorista){
        vtTr.innerHTML = `
          <td style="font-weight:600;font-size:12.5px;color:#2C5A80">💐 ${esc(v.prod)}${badgeDiaRelativa(v.fecha)}</td>
          <td style="font-size:12px">${esc(v.cliente||'')}</td>
          <td></td>
          <td style="font-size:11px;color:var(--mid-gray);max-width:200px;overflow:hidden;text-overflow:ellipsis">${esc(detalle)}</td>
          <td style="width:90px;text-align:center;padding:4px 6px">${renderVentaHoraCell(vIdx,'inicio',v)}</td>
          <td style="width:90px;text-align:center;padding:4px 6px">${renderVentaHoraCell(vIdx,'fin',v)}</td>`;
      } else {
        vtTr.innerHTML = `
          <td style="width:32px"></td>
          <td style="font-weight:600;font-size:12.5px;color:#2C5A80">💐 ${esc(v.prod)}${badgeDiaRelativa(v.fecha)}</td>
          <td style="font-size:12px">${esc(v.cliente||'')}</td>
          <td></td>
          <td style="font-size:11px;color:var(--mid-gray);max-width:200px">${esc(detalle)}</td>
          <td style="width:90px;text-align:center;padding:4px 6px">${renderVentaHoraCell(vIdx,'inicio',v)}</td>
          <td style="width:90px;text-align:center;padding:4px 6px">${renderVentaHoraCell(vIdx,'fin',v)}</td>
          <td style="width:80px;text-align:center">${durBadge(v.inicio, v.fin)}</td>
          <td style="font-size:12px;color:var(--sage-dark);font-weight:600">${esc(v.asignado||'')}</td>
          <td></td>`;
      }
      // Tap en el pedido/venta → abrir detalle (excepto al tocar los botones inicio/fin)
      vtTr.style.cursor = 'pointer';
      vtTr.title = 'Ver detalle del pedido';
      vtTr.addEventListener('click', e => { if(e.target.closest('button')) return; openVentaDetail(vIdx); });
      tbody.appendChild(vtTr);
    });
  }

  // Mensaje si el florista no tiene tareas asignadas
  if(isFlorista && !tbody.querySelector('tr:not(.cl-section-row)')){
    tbody.innerHTML = `<tr><td colspan="6" style="padding:32px;text-align:center;color:var(--mid-gray)">
      <div style="font-size:28px;margin-bottom:8px">📋</div>
      <div style="font-size:14px;font-weight:500">No tenés tareas asignadas para hoy, ${floristaNombre}</div>
      <div style="font-size:12px;margin-top:4px">Gerencia asigna las tareas desde la checklist general.</div>
    </td></tr>`;
  }
  renderProductividadCL();
}


// ── Filtro rápido del checklist (gerencia/operario) ───────────────────────────
const clFiltro = { txt:'', estado:'all' };
function clSetFiltro(k, v){ clFiltro[k] = v; renderChecklistTable(); }

// ── Festejo al completar todas las tareas del día (floristas) ─────────────────
function festejarChecklist(){
  const cont = document.createElement('div');
  cont.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9997;overflow:hidden';
  const emojis = ['🌸','🌷','🌹','💐','🌻','✨'];
  for(let i=0;i<26;i++){
    const s = document.createElement('span');
    s.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    s.style.cssText = `position:absolute;top:-40px;left:${Math.random()*100}%;font-size:${18+Math.random()*16}px;animation:clConfetti ${2.2+Math.random()*1.6}s ease-in ${Math.random()*0.8}s forwards`;
    cont.appendChild(s);
  }
  document.body.appendChild(cont);
  setTimeout(()=>cont.remove(), 5500);
}

function _checkFestejoChecklist(){
  if(userRole!=='florista' || !floristaNombre) return;
  const mis = CL_TASKS.map((_,i)=>i).filter(i => (clState.responsable[i]||'') === floristaNombre);
  if(!mis.length || !mis.every(i=>clState.checked[i])) return;
  // Guarda por florista + día: en un dispositivo compartido cada florista tiene
  // su propio festejo. Antes la clave era solo por día, así que el primero que
  // terminaba dejaba sin "flores de decoración" al resto (la clave ya figuraba
  // usada). Incluir el nombre hace que a cada florista le salgan las flores.
  const k = 'clFestejo_' + TODAY_ISO + '_' + floristaNombre;
  try{ if(localStorage.getItem(k)) return; localStorage.setItem(k,'1'); }catch(e){}
  festejarChecklist();
  navigator.vibrate?.([60,60,60,60,120]);
  showToast(`🎉 ¡Completaste todas tus tareas de hoy, ${floristaNombre}!`);
}

// ── Checklist en tarjetas para floristas (mobile-first) ───────────────────────
// Reemplaza la tabla por cards con botones grandes de Inicio/Fin. Reutiliza
// renderHoraCell / renderEvHoraCell / renderVentaHoraCell para los controles.
function renderChecklistCards(el){
  const misIdxs = CL_TASKS.map((_,i)=>i).filter(i => (clState.responsable[i]||CL_TASKS[i].responsable||'') === floristaNombre);

  const tareasHTML = misIdxs.map(i=>{
    const t = CL_TASKS[i];
    const done = clState.checked[i];
    const curAct = clState.actividad[i]||t.actividad;
    const curObs = (clState.obs[i] && clState.obs[i]!=='Observaciones') ? clState.obs[i] : (t.obs||'');
    const ref = getTiempoRef(i);
    const sh = SEC_HEADERS[t.sec];
    const dur = clState.inicio?.[i] && clState.fin?.[i] ? durBadge(clState.inicio[i], clState.fin[i], ref) : '';
    return `<div class="cl-card${done?' cl-card-done':''}">
      <div class="cl-card-top">
        <div>
          <div class="cl-card-zona">${done?'✅ ':''}${esc(t.zona)}</div>
          <div class="cl-card-sec">${sh.icon} ${sh.label}</div>
        </div>
        <div class="cl-card-badges">
          <span class="badge ${getBadge(curAct)}">${esc(curAct)}</span>
          ${ref?`<span class="cl-card-ref" title="Tiempo promedio de referencia">⏱ ${ref}m</span>`:''}
          ${dur}
        </div>
      </div>
      <input class="cl-obs-input cl-card-obs" value="${esc(curObs)}" placeholder="Observaciones..."
        onchange="updCL(${i},'obs',this.value)" ${done?'disabled':''}>
      <div class="cl-card-horas">
        <div class="cl-card-hora">${renderHoraCell(i,'inicio',done)}</div>
        <div class="cl-card-hora">${renderHoraCell(i,'fin',done)}</div>
      </div>
    </div>`;
  }).join('');

  // Eventos del día asignados a la florista (armado, colocación o retiro según fase)
  const eventosHoy = eventosData.filter(ev=>{
    if(ev.estado==='Pedidos Finalizados') return false;
    const fase = eventoFase(ev);
    const flor = eventoFlorFase(ev, fase);
    return flor === floristaNombre && faseVisibleFlorista(ev, fase);
  });
  const evHTML = eventosHoy.map(ev=>{
    const evIdx = eventosData.indexOf(ev);
    const fase = eventoFase(ev);
    const faseCls = fase==='retiro' ? 'cl-fase-retiro' : fase==='colocacion' ? 'cl-fase-coloc' : 'cl-fase-armado';
    const faseLbl = fase==='retiro' ? '🔄 RETIRO' : fase==='colocacion' ? '📍 COLOCACIÓN' : '🔨 ARMADO';
    return `<div class="cl-card cl-card-evento" onclick="if(!event.target.closest('button'))openEventoDetail(${evIdx})">
      <div class="cl-card-top">
        <div>
          <div class="cl-card-zona">🎉 ${esc(ev.nombre)}</div>
          <div class="cl-card-sec">${esc(ev.tipo||'')}${ev.salon?' · '+esc(ev.salon):''}${ev.pax?' · '+ev.pax+' pax':''}${ev.hora?' · '+ev.hora:''}</div>
        </div>
        <span class="cl-card-fase ${faseCls}">${faseLbl}</span>
      </div>
      <div class="cl-card-horas">
        <div class="cl-card-hora">${renderEvHoraCell(evIdx,'inicio',ev,fase)}</div>
        <div class="cl-card-hora">${renderEvHoraCell(evIdx,'fin',ev,fase)}</div>
      </div>
    </div>`;
  }).join('');

  // Ventas / pedidos pendientes asignados
  const ventasHoy = (ventasData||[]).filter(v => v.asignado===floristaNombre && v.estado==='pendiente' && !v.fin);
  const vtHTML = ventasHoy.map(v=>{
    const vIdx = ventasData.indexOf(v);
    const detalle = [v.cliente, v.colores?'🎨 '+v.colores:'', v.fecha?'📅 '+fmtDate(v.fecha):''].filter(Boolean).join(' · ');
    return `<div class="cl-card cl-card-venta" onclick="if(!event.target.closest('button'))openVentaDetail(${vIdx})">
      <div class="cl-card-top">
        <div>
          <div class="cl-card-zona">💐 ${esc(v.prod||'')}</div>
          <div class="cl-card-sec">${esc(detalle)}</div>
        </div>
      </div>
      <div class="cl-card-horas">
        <div class="cl-card-hora">${renderVentaHoraCell(vIdx,'inicio',v)}</div>
        <div class="cl-card-hora">${renderVentaHoraCell(vIdx,'fin',v)}</div>
      </div>
    </div>`;
  }).join('');

  el.innerHTML = `
    ${misIdxs.length ? tareasHTML : `<div class="cl-cards-empty">
      <div style="font-size:30px;margin-bottom:8px">📋</div>
      No tenés tareas asignadas para hoy, ${esc(floristaNombre)}
      <div class="cl-cards-empty-sub">Gerencia asigna las tareas desde la checklist general.</div>
    </div>`}
    ${evHTML ? '<div class="cl-cards-sec-hdr" style="color:#B8602A">🎉 Eventos del día</div>'+evHTML : ''}
    ${vtHTML ? '<div class="cl-cards-sec-hdr" style="color:#2C5A80">💐 Ventas pendientes</div>'+vtHTML : ''}`;
}

function renderHoraCell(i, campo, done){
  const val = clState[campo]?.[i] || '';
  if(userRole === 'gerencia'){
    const dis = done ? 'disabled' : '';
    return `<input type="time" value="${val}" ${dis}
      style="width:78px;padding:4px 5px;font-size:12px;border:1px solid var(--light-gray);border-radius:4px;text-align:center;background:var(--warm-white);color:var(--charcoal)"
      onchange="updCL(${i},'${campo}',this.value)">`;
  }
  if(val){
    const color   = campo==='inicio' ? '#2C4A3E' : '#8B3A3A';
    const bg      = campo==='inicio' ? '#EBF5E8' : '#FDF0F0';
    const resetFn = done ? '' : `onclick="resetHora(${i},'${campo}')" title="Tocar para borrar"`;
    return `<span ${resetFn} style="font-size:13px;font-weight:700;color:${color};background:${bg};padding:3px 10px;border-radius:8px;display:inline-block;${done?'':'cursor:pointer'}">${val}</span>`;
  }
  // Fin deshabilitado si: tarea completada O si no hay Inicio aún registrado
  const sinInicio = campo === 'fin' && !(clState.inicio?.[i]);
  const disAttr   = (done || sinInicio) ? 'disabled' : '';
  const disStyle  = done ? 'opacity:.45;cursor:not-allowed' : sinInicio ? 'opacity:.35;cursor:not-allowed' : '';
  const disStr    = disAttr ? `${disAttr} style="${disStyle}"` : '';
  const label = campo==='inicio' ? '▶&nbsp;Inicio' : '⏹&nbsp;Fin';
  const cls   = campo==='inicio' ? 'btn-hora-inicio' : 'btn-hora-fin';
  const title = sinInicio ? 'title="Primero registrá el Inicio"' : '';
  return `<button class="${cls}" ${disStr} ${title} onclick="registrarHora(${i},'${campo}')">${label}</button>`;
}

function registrarHora(i, campo){
  if(!clState) return;
  if(userRole === 'florista' && clState.responsable[i] !== floristaNombre){
    showToast('⛔ Solo podés operar las tareas asignadas a vos'); return;
  }
  if(!clState.inicio) clState.inicio = CL_TASKS.map(()=>'');
  if(!clState.fin)    clState.fin    = CL_TASKS.map(()=>'');

  // ── VALIDACIÓN: no permitir Fin sin Inicio ────────────────────────────────
  if(campo === 'fin'){
    const inicioVal = clState.inicio[i] || '';
    if(!inicioVal){
      // Mostrar alerta prominente al florista
      showAlertaHorario('⚠️ No hay Inicio registrado para esta tarea.\nPrimero registrá el Inicio antes de marcar el Fin.');
      return;
    }
  }

  const now = new Date();
  const hh  = String(now.getHours()).padStart(2,'0');
  const mm  = String(now.getMinutes()).padStart(2,'0');
  const horaActual = hh+':'+mm;

  // ── VALIDACIÓN: Fin no puede ser anterior al Inicio ───────────────────────
  if(campo === 'fin'){
    const inicioVal = clState.inicio[i];
    const durMin = calcDuracion(inicioVal, horaActual);
    if(durMin !== null && durMin < 0){
      showAlertaHorario('⚠️ El Fin (' + horaActual + ') es anterior al Inicio (' + inicioVal + ').\nVerificá el horario.');
      return;
    }
  }

  clState[campo][i] = horaActual;

  if(campo === 'fin' && !clState.checked[i]){
    clState.checked[i] = true;
    const t    = CL_TASKS[i];
    const resp = clState.responsable[i] || '—';
    const inicioFinal = clState.inicio[i] || '';
    const durFinal    = calcDuracion(inicioFinal, horaActual);
    const ref         = getTiempoRef(i);
    const excedida    = !!(ref && durFinal && durFinal > ref);
    checklistHistory.push({
      date: TODAY_ISO, week: getWeekLabel(now),
      weekKey: CURRENT_WEEK_KEY, day: currentDay,
      sec: t.sec, zona: t.zona,
      actividad: clState.actividad[i]||t.actividad,
      obs: clState.obs[i]||'',
      tiempo: clState.tiempo[i]||'',
      inicio: inicioFinal, fin: horaActual,
      duracion: durFinal, ref: ref||0, excedida,
      who: resp, hora: now.toTimeString().slice(0,5)
    });
    localStorage.setItem('cl_history', JSON.stringify(checklistHistory));
    fbSave('checklistHistory', checklistHistory);
    registrarUltimoNuevo(t.sec, t.zona, clState.actividad[i]||t.actividad, TODAY_ISO);
    // Nuevo hecho = no vuelve a pedir Nuevo el resto de la semana en esta zona.
    if(String(clState.actividad[i]||t.actividad).toLowerCase().includes('nuevo')) bajarNuevoRestoSemana(i, currentDay);
    renderHistoryPanel();
    // Toast de confirmación con duración
    const durTxt = durFinal ? ' · Duración: ' + fmtDur(durFinal) : '';
    showToast('✅ Tarea finalizada — Inicio: ' + inicioFinal + ' · Fin: ' + horaActual + durTxt);
    // Aviso a gerencia si se excedió el tiempo promedio de referencia
    if(excedida){
      window.pushSend?.('⏱ Tarea excedida',
        `${resp} tardó ${fmtDur(durFinal)} en "${t.zona} · ${clState.actividad[i]||t.actividad}" (referencia: ${ref}m)`,
        'tarea-excedida', 'roles:gerencia');
    }
    // Si la tarea era un arreglo Nuevo, ofrecer adjuntar foto (floristas)
    if(userRole==='florista' && String(clState.actividad[i]||t.actividad).toLowerCase().includes('nuevo')){
      ofrecerFotoNuevo(checklistHistory.length-1, t.zona);
    }
    saveWeekState(currentDay, 'checked');
    navigator.vibrate?.([40,60,80]);
    _checkFestejoChecklist();
  } else if(campo === 'inicio'){
    showToast('▶ Inicio registrado: ' + horaActual);
    navigator.vibrate?.(30);
  }

  saveWeekState(currentDay, campo);
  renderChecklistTable();
}

// ── Foto del arreglo al completar un Nuevo ────────────────────────────────────
// La florista puede adjuntar una foto (comprimida) al terminar una tarea Nuevo;
// queda en el registro del historial y gerencia la ve desde el panel.
let _fotoHistIdx = -1;
let _fotoDataTmp = '';

function comprimirImagen(file, maxDim, calidad, cb){
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width*escala);
      canvas.height = Math.round(img.height*escala);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      cb(canvas.toDataURL('image/jpeg', calidad));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function ofrecerFotoNuevo(histIdx, zona){
  const modal = document.getElementById('cl-foto-modal');
  if(!modal) return;
  _fotoHistIdx = histIdx; _fotoDataTmp = '';
  document.getElementById('cl-foto-zona').textContent = `Sacale una foto al arreglo nuevo de "${zona}" para que gerencia lo vea (opcional).`;
  document.getElementById('cl-foto-file').value = '';
  const p = document.getElementById('cl-foto-preview');
  p.src = ''; p.style.display = 'none';
  document.getElementById('cl-foto-save').disabled = true;
  modal.classList.add('open');
}

function clFotoPreview(input){
  const file = input.files[0]; if(!file) return;
  comprimirImagen(file, 800, 0.65, data => {
    _fotoDataTmp = data;
    const p = document.getElementById('cl-foto-preview');
    p.src = data; p.style.display = 'block';
    document.getElementById('cl-foto-save').disabled = false;
  });
}

function guardarFotoChecklist(){
  if(!_fotoDataTmp || _fotoHistIdx<0 || !checklistHistory[_fotoHistIdx]){ closeModal('cl-foto-modal'); return; }
  checklistHistory[_fotoHistIdx].img = _fotoDataTmp;
  try{ localStorage.setItem('cl_history', JSON.stringify(checklistHistory)); }catch(e){}
  fbSave('checklistHistory', checklistHistory);
  closeModal('cl-foto-modal');
  showToast('📷 Foto guardada — gerencia la puede ver en el historial');
  renderHistoryPanel();
}

// ── Galería de fotos de arreglos Nuevos (gerencia) ────────────────────────────
function openGaleriaNuevos(){
  const sel = document.getElementById('gal-nuevos-semana');
  if(sel){
    const semanas = [...new Set((checklistHistory||[]).filter(r=>r?.img).map(r=>r.week).filter(Boolean))].reverse();
    const cur = sel.value;
    sel.innerHTML = '<option value="">Todas las semanas</option>' + semanas.map(w=>`<option${w===cur?' selected':''}>${esc(w)}</option>`).join('');
  }
  renderGaleriaNuevos();
  document.getElementById('cl-galeria-modal').classList.add('open');
}

function renderGaleriaNuevos(){
  const el = document.getElementById('cl-galeria-grid');
  if(!el) return;
  const semana = document.getElementById('gal-nuevos-semana')?.value || '';
  const fotos = (checklistHistory||[])
    .map((r,i)=>({r,i}))
    .filter(x => x.r?.img && (!semana || x.r.week === semana))
    .reverse()
    .slice(0, 80);
  const cnt = document.getElementById('gal-nuevos-count');
  if(cnt) cnt.textContent = fotos.length ? fotos.length + ' foto' + (fotos.length!==1?'s':'') : '';
  el.innerHTML = fotos.length ? fotos.map(({r,i})=>`
    <div class="gal-nuevo-item" onclick="verFotoChecklist(${i})" title="Ver en grande">
      <img src="${r.img}" loading="lazy" alt="${esc(r.zona||'')}">
      <div class="gal-nuevo-cap">
        <strong>${esc(r.zona||'')}</strong>
        <span>${fmtDate(r.date)}${r.who?' · '+esc(r.who):''}</span>
      </div>
    </div>`).join('')
    : '<p style="color:var(--mid-gray);font-size:13px;padding:24px;text-align:center">Todavía no hay fotos — las floristas pueden adjuntar una al terminar un arreglo Nuevo.</p>';
}

function verFotoChecklist(idx){
  const img = checklistHistory[idx]?.img; if(!img) return;
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer';
  ov.innerHTML = `<img src="${img}" style="max-width:94vw;max-height:90vh;border-radius:12px">`;
  ov.onclick = () => ov.remove();
  document.body.appendChild(ov);
}

// Alerta prominente para errores de horario (más visible que un toast)
function showAlertaHorario(msg){
  let overlay = document.getElementById('alerta-horario-overlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'alerta-horario-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px';
    overlay.innerHTML = `
      <div style="background:white;border-radius:16px;padding:32px 28px;max-width:340px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3)">
        <div style="font-size:48px;margin-bottom:12px">⚠️</div>
        <div id="alerta-horario-msg" style="font-size:15px;font-weight:600;color:#1A1A1A;line-height:1.5;margin-bottom:24px;white-space:pre-line"></div>
        <button onclick="document.getElementById('alerta-horario-overlay').remove()"
          style="background:#1A1A1A;color:white;border:none;border-radius:10px;padding:12px 32px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;width:100%">
          Entendido
        </button>
      </div>`;
    document.body.appendChild(overlay);
  }
  document.getElementById('alerta-horario-msg').textContent = msg;
  overlay.style.display = 'flex';
  // Cerrar al tocar fuera
  overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
}

async function resetHora(i, campo){
  if(!clState) return;
  // Si se borra el Inicio y ya hay Fin, también borrar el Fin para mantener consistencia
  if(campo === 'inicio' && clState.fin?.[i]){
    if(!await confirmModal('¿Borrar el horario de Inicio?\nEsto también borrará el Fin registrado (' + clState.fin[i] + ') para mantener la consistencia.')){
      return;
    }
    clState.fin[i] = '';
    // Si la tarea estaba marcada solo por el Fin, desmarcarla
    if(clState.checked[i]) clState.checked[i] = false;
  }
  clState[campo][i] = '';
  // Si se borra el Fin, la tarea deja de estar completada (queda reabierta).
  if(campo === 'fin' && clState.checked?.[i]){
    clState.checked[i] = false;
    saveWeekState(currentDay, 'checked');
  }
  saveWeekState(currentDay, campo);
  renderChecklistTable();
}

// ── Al volver a la app (tab activo), forzar resync de Firebase ────────────────
document.addEventListener('visibilitychange', () => {
  if(document.visibilityState === 'visible'){
    // Resetear el timestamp de última escritura para permitir que Firebase pise
    window._checklistLastSave = 0;
    // Mostrar indicador sutil de resincronización
    const page = document.getElementById('page-checklist');
    if(page && page.classList.contains('active')){
      showToast('🔄 Actualizando checklist...');
    }
  }
});

function updCL(i, field, val){
  if(!clState) return;
  clState[field][i] = val;
  // Al cargar/editar la hora de Fin a mano (gerencia usa un <input time>), mantener
  // el estado "completada" en sincronía: con Fin la tarea queda tildada; sin Fin,
  // destildada. Sin esto, la tarea mostraba duración pero seguía figurando pendiente
  // y al recargar aparecía "vacía".
  if(field === 'fin'){
    const debeEstar = !!val;
    if(!Array.isArray(clState.checked)) clState.checked = CL_TASKS.map(()=>false);
    if(clState.checked[i] !== debeEstar){
      clState.checked[i] = debeEstar;
      saveWeekState(currentDay, 'checked');
    }
    saveWeekState(currentDay, field);
    renderChecklistTable();
    return;
  }
  saveWeekState(currentDay, field);
}

function toggleTask(i, el){
  if(!clState) return;
  // Florista individual: solo puede marcar sus tareas
  if(userRole === 'florista' && clState.responsable[i] !== floristaNombre){
    el.checked = !el.checked; // revertir
    showToast('⛔ Solo podés operar las tareas asignadas a vos');
    return;
  }
  clState.checked[i] = el.checked;
  if(el.checked){
    const t  = CL_TASKS[i];
    const now = new Date();
    const resp = clState.responsable[i] || '—';
    checklistHistory.push({
      date: TODAY_ISO,
      week: getWeekLabel(now),
      weekKey: CURRENT_WEEK_KEY,
      day:  currentDay,
      sec:  t.sec,
      zona: t.zona,
      actividad: clState.actividad[i]||t.actividad,
      obs:  clState.obs[i]||'',
      tiempo: clState.tiempo[i]||'',
      inicio: clState.inicio?.[i]||'',
      fin:    clState.fin?.[i]||'',
      duracion: calcDuracion(clState.inicio?.[i]||'', clState.fin?.[i]||''),
      ref: getTiempoRef(i),
      excedida: !!(getTiempoRef(i) && calcDuracion(clState.inicio?.[i]||'', clState.fin?.[i]||'') > getTiempoRef(i)),
      who:  resp,
      hora: now.toTimeString().slice(0,5)
    });
    localStorage.setItem('cl_history', JSON.stringify(checklistHistory));
    fbSave('checklistHistory', checklistHistory);
    registrarUltimoNuevo(t.sec, t.zona, clState.actividad[i]||t.actividad, TODAY_ISO);
    // Nuevo hecho = no vuelve a pedir Nuevo el resto de la semana en esta zona.
    if(String(clState.actividad[i]||t.actividad).toLowerCase().includes('nuevo')) bajarNuevoRestoSemana(i, currentDay);
    renderHistoryPanel();
    // Si la tarea era un arreglo Nuevo, ofrecer adjuntar foto (floristas)
    if(userRole==='florista' && String(clState.actividad[i]||t.actividad).toLowerCase().includes('nuevo')){
      ofrecerFotoNuevo(checklistHistory.length-1, t.zona);
    }
    navigator.vibrate?.(40);
    _checkFestejoChecklist();
  }
  saveWeekState(currentDay, 'checked');
  renderChecklistTable();
}


async function confirmResetWeek(){
  if(userRole !== 'gerencia'){ showToast('⛔ Solo gerencia puede realizar esta acción'); return; }
  const toArr = v => Array.isArray(v) ? v : (v ? Object.values(v) : []);
  let done = 0;
  try { done = Object.values(clStateByDay||{}).reduce((sum,ds)=>sum+toArr(ds?.checked).filter(Boolean).length,0); } catch(e){}
  const msg = done>0
    ? `¿Cerrar la semana y empezar nueva?\nSe archivarán ${done} tareas completadas en el historial y la checklist quedará limpia.`
    : '¿Iniciar nueva semana? La checklist quedará limpia.';
  if(!await confirmModal(msg)) return;
  // Archive any checked tasks not yet saved to history
  const now = new Date();
  ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].forEach(day=>{
    const ds = clStateByDay[day];
    if(!ds) return;
    const checkedArr = toArr(ds.checked);
    checkedArr.forEach((checked,i)=>{
      if(checked){
        const t = CL_TASKS[i];
        const resp = ds.responsable[i]||'—';
        const alreadyIn = checklistHistory.some(h=>
          h.weekKey===CURRENT_WEEK_KEY && h.day===day && h.zona===t.zona
        );
        if(!alreadyIn){
          const hi2 = ds.inicio ? (ds.inicio[i]||'') : '';
          const hf2 = ds.fin    ? (ds.fin[i]   ||'') : '';
          checklistHistory.push({
            date: TODAY_ISO, week: getWeekLabel(now),
            weekKey: CURRENT_WEEK_KEY, day, sec: t.sec,
            zona: t.zona, actividad: ds.actividad[i]||t.actividad,
            obs: ds.obs[i]||'', tiempo: fmtDur(calcDuracion(hi2,hf2)),
            inicio: hi2, fin: hf2, duracion: calcDuracion(hi2,hf2),
            who: resp, hora: '—'
          });
        }
      }
    });
  });
  localStorage.setItem('cl_history', JSON.stringify(checklistHistory));
  fbSave('checklistHistory', checklistHistory);
  // Reset checklist
  clStateByDay = {};
  fbSave('checklist', clStateByDay); // Limpiar TODOS los días de Firebase
  clState = getOrCreateDayState(currentDay);
  try { localStorage.removeItem(CL_STORAGE_KEY); } catch(e){}
  initChecklist();
  showToast('✅ Semana archivada — checklist limpia para la nueva semana');
}

function toggleHistory(){
  if(userRole !== 'gerencia') return;
  const panel = document.getElementById('history-panel');
  const btn   = document.getElementById('history-toggle-btn');
  const show  = panel.style.display==='none';
  panel.style.display = show ? 'block' : 'none';
  btn.textContent = show ? '✕ Cerrar Historial' : '📋 Ver Historial';
}

// ── Poda automática del historial del checklist (solo gerencia) ───────────────
// El historial crece sin límite y encima guarda fotos (pesadas). Sin mantenimiento
// la app se vuelve lenta y Firebase pesado. Esta poda es conservadora:
//   · registros de más de 6 meses → se archivan (se quitan del historial activo)
//   · fotos de más de 60 días → se borra la foto pero el registro queda
//   · tope duro: como red de seguridad, máximo 4000 registros (los más recientes)
const HIST_MESES_RETENER = 6;
const HIST_DIAS_FOTO = 60;
const HIST_MAX = 4000;

function podarHistorial(){
  if(userRole !== 'gerencia') return;
  const k = 'histPoda_' + TODAY_ISO;
  try{ if(localStorage.getItem(k)) return; }catch(e){}
  if(!Array.isArray(checklistHistory) || !checklistHistory.length){ try{ localStorage.setItem(k,'1'); }catch(e){} return; }

  const hoy = new Date(TODAY_ISO);
  const limiteReg = new Date(hoy); limiteReg.setMonth(limiteReg.getMonth() - HIST_MESES_RETENER);
  const limiteFotoISO = addDaysISO(TODAY_ISO, -HIST_DIAS_FOTO);
  const limiteRegISO = limiteReg.toISOString().slice(0,10);

  let quitados = 0, fotosQuitadas = 0;
  let podado = checklistHistory.filter(r => {
    if(r?.date && r.date < limiteRegISO){ quitados++; return false; }
    return true;
  });
  podado.forEach(r => {
    if(r?.img && r.date && r.date < limiteFotoISO){ delete r.img; fotosQuitadas++; }
  });
  if(podado.length > HIST_MAX){
    podado = [...podado].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).slice(-HIST_MAX);
    quitados = checklistHistory.length - podado.length;
  }

  try{ localStorage.setItem(k,'1'); }catch(e){}
  if(!quitados && !fotosQuitadas) return; // nada que hacer
  checklistHistory = podado;
  try{ localStorage.setItem('cl_history', JSON.stringify(checklistHistory)); }catch(e){}
  fbSave('checklistHistory', checklistHistory);
  const partes = [];
  if(quitados) partes.push(`${quitados} registro${quitados!==1?'s':''} de +${HIST_MESES_RETENER} meses`);
  if(fotosQuitadas) partes.push(`${fotosQuitadas} foto${fotosQuitadas!==1?'s':''} antigua${fotosQuitadas!==1?'s':''}`);
  showToast('🧹 Historial optimizado — se archivaron ' + partes.join(' y '));
  if(document.getElementById('history-panel')?.style.display !== 'none') renderHistoryPanel();
}

function renderHistoryPanel(){
  const weeks = [...new Set(checklistHistory.map(r=>r.week))];
  const tabsEl = document.getElementById('history-week-tabs');
  tabsEl.innerHTML = '<span style="font-size:11px;color:var(--mid-gray);margin-right:8px">Filtrar semana:</span>';
  if(weeks.length===0){ tabsEl.innerHTML+='<span style="font-size:12px;color:var(--mid-gray)">Sin registros aún</span>'; }
  weeks.forEach(w=>{
    const btn = document.createElement('button');
    btn.className='history-week-btn'+(w===historyWeekFilter?' active':'');
    btn.textContent = w;
    btn.onclick=()=>{ historyWeekFilter=(historyWeekFilter===w?null:w); renderHistoryPanel(); };
    tabsEl.appendChild(btn);
  });
  const filtered = historyWeekFilter ? checklistHistory.filter(r=>r.week===historyWeekFilter) : checklistHistory;
  const tbody = document.getElementById('history-body');
  if(filtered.length===0){
    tbody.innerHTML='<tr><td colspan="12" style="padding:16px;text-align:center;color:var(--mid-gray)">Sin registros para mostrar</td></tr>';
    return;
  }
  const sorted = [...filtered].reverse();
    tbody.innerHTML = sorted.map(r=>{
    const realIdx = checklistHistory.indexOf(r);
    return `
    <tr>
      <td>${fmtDate(r.date)}</td>
      <td style="font-size:11px;color:var(--mid-gray)">${esc(r.week)}</td>
      <td>${esc(r.day)}</td>
      <td style="font-weight:500">${esc(r.zona)}</td>
      <td><span class="badge ${getBadge(r.actividad)}">${esc(r.actividad)}</span></td>
      <td style="font-size:12px;color:var(--mid-gray)">${r.obs&&r.obs!=='Observaciones'?esc(r.obs):'<span style="color:var(--light-gray)">—</span>'}</td>
      <td style="font-size:12px;font-weight:600;color:var(--charcoal)">${r.inicio||'<span style=\"color:var(--mid-gray)\">—</span>'}</td>
      <td style="font-size:12px;font-weight:600;color:var(--charcoal)">${r.fin||'<span style=\"color:var(--mid-gray)\">—</span>'}</td>
      <td style="text-align:center">${durBadge(r.inicio,r.fin,parseInt(r.ref)||0)}</td>
      <td><span class="responsable-tag">${esc(r.who)}</span></td>
      <td style="font-size:12px;color:var(--mid-gray)">${esc(r.hora)}</td>
      <td style="text-align:center">${r.img?`<button class="btn-icon" onclick="verFotoChecklist(${realIdx})" title="Ver foto del arreglo">📷</button>`:''}</td>
    </tr>`;}).join('');
}

// ════════════════════════════════════════
// DATA — STOCK
// ════════════════════════════════════════
let stockData = [];

function getAlerta(item, comprometido){
  const comp = comprometido !== undefined ? comprometido : 0;
  const libre = item.actual - comp;
  if(item.actual<=0) return 'comprar';
  if(item.actual<item.min) return 'comprar';
  if(comp>0 && libre<item.min) return 'comprar';
  if(item.actual<=item.min*1.6) return 'atencion';
  if(comp>0 && libre<=item.min*1.6) return 'atencion';
  return 'ok';
}

function getStockEnPedido(item){
  // Pedidos en curso (pedidos aún no recibidos)
  const pending = [...comprasFlore,...comprasJard].filter(c=>
    c.estado!=='recibido' && c.prod && c.prod.toLowerCase().includes(item.prod.toLowerCase())
  );
  return +(pending.reduce((s,c)=>s+parseFloat(c.qty||0),0).toFixed(1));
}

function getStockComprometido(item){
  // Suma de ingredientes requeridos por eventos que aún no se confirmaron/realizaron
  const ACTIVE_ESTADOS = ['Pedidos Pendientes','En Proceso','Pendiente de Colocacion','Pendiente de Retiro'];
  let total = 0;
  const prodLower = item.prod.toLowerCase();
  eventosData.forEach(ev=>{
    if(!ACTIVE_ESTADOS.includes(ev.estado)) return;
    if(!ev.arreglos?.length) return;
    const impact = calcStockImpact(ev.arreglos);
    Object.entries(impact).forEach(([prod,qty])=>{
      if(prod.toLowerCase()===prodLower) total += qty;
    });
  });
  return +(total.toFixed(1));
}

let stockFilter='all', stockSearch='';

function renderStock(){
  const tbody = document.getElementById('stock-body');
  tbody.innerHTML = '';
  let ok=0,at=0,co=0;

  // Pre-computar stock comprometido para todos los ítems de una vez
  const comprometidos = stockData.map(item => getStockComprometido(item));

  stockData.forEach((item,i)=>{
    const comp = comprometidos[i];
    const al = getAlerta(item, comp);
    if(al==='ok') ok++; else if(al==='atencion') at++; else co++;
    const show = (stockFilter==='all'||al===stockFilter) &&
      (stockSearch===''||item.prod.toLowerCase().includes(stockSearch)||item.area.toLowerCase().includes(stockSearch));
    if(!show) return;
    const pct = Math.min(100,Math.round((item.actual/item.max)*100));
    const alMap = {ok:['🟢 OK','ok'],atencion:['🟡 ATENCIÓN','atencion'],comprar:['🔴 COMPRAR','comprar']};
    const [alLabel,alClass] = alMap[al];

    // Columna "En Pedido" — pedidos aún no recibidos
    const enPedido = getStockEnPedido(item);
    const pedidoHtml = enPedido > 0
      ? `<span style="color:var(--green-ok);font-weight:600">+${enPedido%1===0?enPedido:enPedido.toFixed(1)}</span><span style="font-size:10px;color:var(--sage);margin-left:3px">en camino</span>`
      : `<span style="color:var(--sage-light)">—</span>`;

    // Columna "Comprometido" — ingredientes de eventos pendientes
    let compHtml;
    if(comp <= 0){
      compHtml = `<span style="color:var(--sage-light)">—</span>`;
    } else {
      const libre = +(item.actual - comp).toFixed(1);
      const needsBuy = libre < item.min;
      const color = needsBuy ? 'var(--red-alert)' : 'var(--amber)';
      const icon = needsBuy ? '⚠️ ' : '';
      const libreStr = libre%1===0 ? libre : libre.toFixed(1);
      const compStr  = comp%1===0  ? comp  : comp.toFixed(1);
      const warning  = needsBuy
        ? `<div style="font-size:10px;color:var(--red-alert);margin-top:2px">Libre: ${libreStr} — comprar</div>`
        : `<div style="font-size:10px;color:var(--mid-gray);margin-top:2px">Libre: ${libreStr}</div>`;
      compHtml = `<span style="color:${color};font-weight:600">${icon}${compStr}</span>${warning}`;
    }

    tbody.innerHTML += `<tr>
      <td style="font-weight:500">${esc(item.prod)}</td>
      <td style="font-size:12px;color:var(--mid-gray)">${esc(item.area)}</td>
      <td>${item.min}</td><td>${item.max}</td>
      <td><div style="display:flex;align-items:center;gap:4px">
        <button class="btn-icon" style="width:24px;height:24px;border:1px solid var(--light-gray);border-radius:5px;font-size:15px" onclick="adjustStock(${i},-1)">−</button>
        <input type="number" value="${item.actual%1===0?item.actual:item.actual.toFixed(1)}" onchange="setStock(${i},+this.value)"
          style="width:56px;text-align:center;font-weight:600;font-size:13px;border:1px solid var(--light-gray);border-radius:5px;padding:3px 4px;background:var(--warm-white);color:var(--charcoal)" title="Editar cantidad actual">
        <button class="btn-icon" style="width:24px;height:24px;border:1px solid var(--light-gray);border-radius:5px;font-size:15px" onclick="adjustStock(${i},1)">+</button>
      </div></td>
      <td>${pedidoHtml}</td>
      <td>${compHtml}</td>
      <td><div style="display:flex;align-items:center;gap:6px">
        <div class="stock-bar"><div class="stock-fill ${alClass}" style="width:${pct}%"></div></div>
        <span style="font-size:11px;color:var(--mid-gray)">${pct}%</span>
      </div></td>
      <td><span class="alerta-badge ${alClass}">${alLabel}</span></td>
    </tr>`;
  });

  document.getElementById('sk-ok').textContent=ok;
  document.getElementById('sk-at').textContent=at;
  document.getElementById('sk-co').textContent=co;
  const _kc2=document.getElementById('kpi-comprar'); if(_kc2) _kc2.textContent=co;
  const _ka2=document.getElementById('kpi-atencion'); if(_ka2) _ka2.textContent=at;

  const alertEl = document.getElementById('stock-alert-area');
  alertEl.innerHTML='';
  if(co>0) alertEl.innerHTML+=`<div class="alert-banner">🔴 <strong>${co} producto${co>1?'s':''} en stock crítico</strong> — comprar hoy.</div>`;
  if(at>0) alertEl.innerHTML+=`<div class="alert-banner amber">🟡 <strong>${at} producto${at>1?'s':''} en nivel bajo</strong> — considerar reponer esta semana.</div>`;

  // Banner específico de comprometidos que exceden el stock libre
  const comprometidosAlerta = stockData.filter((s,i)=>{
    if(comprometidos[i]<=0) return false;
    return (s.actual - comprometidos[i]) < s.min;
  });
  if(comprometidosAlerta.length>0){
    alertEl.innerHTML+=`<div class="alert-banner amber">⚠️ <strong>${comprometidosAlerta.length} producto${comprometidosAlerta.length>1?'s':''} comprometido${comprometidosAlerta.length>1?'s':''} en eventos pendientes</strong>: ${comprometidosAlerta.map(s=>esc(s.prod)).join(', ')} — comprá antes del evento.</div>`;
  }
}

function adjustStock(i,d){
  stockData[i].actual=Math.max(0,+(stockData[i].actual+d).toFixed(1));
  fbSave('stockData', stockData);
  renderStock();
  if(document.getElementById('page-stock-admin')?.classList.contains('active')) renderStockAdmin();
}
function setStock(i,v){
  stockData[i].actual=Math.max(0,+(+v).toFixed(1));
  fbSave('stockData', stockData);
  renderStock();
  if(document.getElementById('page-stock-admin')?.classList.contains('active')) renderStockAdmin();
}
// Vaciar todo el stock (limpieza de martes/jueves antes del pedido nuevo).
// Pone las cantidades en 0 pero conserva el listado de productos y sus mínimos.
async function vaciarStock(){
  if(!stockData.length){ showToast('El stock ya está vacío'); return; }
  if(!await confirmModal(`¿Vaciar TODO el stock de florería?\n\nPone en 0 la cantidad de los ${stockData.length} producto${stockData.length!==1?'s':''} (para la limpieza de martes/jueves). El listado y los mínimos se conservan; cuando llegue el pedido nuevo se vuelve a cargar.`)) return;
  stockData.forEach(s=>{ s.actual = 0; });
  fbSave('stockData', stockData);
  renderStock();
  if(document.getElementById('page-stock-admin')?.classList.contains('active')) renderStockAdmin();
  showToast('🗑 Stock vaciado — listo para el pedido nuevo');
}
function setStockMin(i,v){
  stockData[i].min=Math.max(0,+(+v).toFixed(1));
  fbSave('stockData', stockData);
  renderStockAdmin();
}
function setStockMax(i,v){
  stockData[i].max=Math.max(0,+(+v).toFixed(1));
  fbSave('stockData', stockData);
  renderStockAdmin();
}
async function delStock(i){
  const item = stockData[i];
  if(!item) return;
  if(!await confirmModal('¿Eliminar "'+item.prod+'" del stock?\nEsto lo quita de la lista por completo.')) return;
  stockData.splice(i,1);
  fbSave('stockData', stockData);
  renderStock();
  renderStockAdmin();
  showToast('🗑️ '+item.prod+' eliminado del stock');
}
function filterByStatus(s,btn){ document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); stockFilter=s; renderStock(); }
function filterStock(v){ stockSearch=v.toLowerCase(); renderStock(); }

// Alta manual de un artículo en el stock de florería (compras / gerencia), para
// cargar algo que quedó por fuera del flujo automático de recepción de compras.
function openAddStockModal(){
  document.getElementById('as-prod').value = '';
  document.getElementById('as-area').value = '';
  document.getElementById('as-actual').value = '0';
  document.getElementById('as-min').value = '1';
  document.getElementById('as-max').value = '10';
  const areas = [...new Set([...stockData.map(s=>s.area).filter(Boolean), ...getAreaUsoZonas()])].sort((a,b)=>a.localeCompare(b,'es'));
  const dl = document.getElementById('as-area-list');
  if(dl) dl.innerHTML = areas.map(a=>`<option value="${esc(a)}">`).join('');
  document.getElementById('add-stock-modal').classList.add('open');
}

function guardarStockManual(){
  const prod = document.getElementById('as-prod').value.trim();
  if(!prod){ showToast('Poné el nombre del producto','error'); return; }
  const area = document.getElementById('as-area').value.trim() || 'Sin área';
  const dup = stockData.find(s => (s.prod||'').trim().toLowerCase()===prod.toLowerCase() && (s.area||'').trim().toLowerCase()===area.toLowerCase());
  if(dup){ showToast('⚠️ Ya existe ese producto en esa área'); return; }
  const actual = Math.max(0, parseFloat(document.getElementById('as-actual').value)||0);
  const min = Math.max(0, parseFloat(document.getElementById('as-min').value)||0);
  const max = Math.max(min, parseFloat(document.getElementById('as-max').value)||0);
  stockData.push({ prod, area, min, max, actual });
  fbSave('stockData', stockData);
  closeModal('add-stock-modal');
  renderStockAdmin();
  renderStock();
  showToast('✅ '+prod+' agregado al stock');
}

function renderStockAdmin(){
  const tbody = document.getElementById('stock-admin-body');
  if(!tbody) return;
  tbody.innerHTML = '';
  const comprometidos = stockData.map(item => getStockComprometido(item));
  stockData.forEach((item,i)=>{
    const comp = comprometidos[i];
    const al = getAlerta(item, comp);
    const alMap = {ok:['🟢 OK','ok'],atencion:['🟡 ATENCIÓN','atencion'],comprar:['🔴 COMPRAR','comprar']};
    const [alLabel,alClass] = alMap[al];
    const pct = Math.min(100,Math.round((item.actual/(item.max||1))*100));

    const enPedido = getStockEnPedido(item);
    const pedidoHtml = enPedido > 0
      ? `<span style="color:var(--green-ok);font-weight:600">+${enPedido%1===0?enPedido:enPedido.toFixed(1)}</span><span style="font-size:10px;color:var(--sage);margin-left:3px">en camino</span>`
      : `<span style="color:var(--sage-light)">—</span>`;

    let compHtml;
    if(comp <= 0){
      compHtml = `<span style="color:var(--sage-light)">—</span>`;
    } else {
      const libre = +(item.actual - comp).toFixed(1);
      const needsBuy = libre < item.min;
      const color = needsBuy ? 'var(--red-alert)' : 'var(--amber)';
      const icon = needsBuy ? '⚠️ ' : '';
      const compStr = comp%1===0 ? comp : comp.toFixed(1);
      const libreStr = libre%1===0 ? libre : libre.toFixed(1);
      const sub = needsBuy
        ? `<div style="font-size:10px;color:var(--red-alert);margin-top:2px">Libre: ${libreStr} — comprar</div>`
        : `<div style="font-size:10px;color:var(--mid-gray);margin-top:2px">Libre: ${libreStr}</div>`;
      compHtml = `<span style="color:${color};font-weight:600">${icon}${compStr}</span>${sub}`;
    }

    tbody.innerHTML += `<tr>
      <td style="font-weight:500">${esc(item.prod)}</td>
      <td style="font-size:12px;color:var(--mid-gray)">${esc(item.area)}</td>
      <td><input type="number" step="0.5" min="0" value="${item.min}"
        style="width:58px;border:1px solid var(--light-gray);border-radius:6px;padding:4px 6px;font-size:12px;font-family:'DM Sans',sans-serif"
        onchange="setStockMin(${i},this.value)" title="Mínimo"></td>
      <td><input type="number" step="0.5" min="0" value="${item.max}"
        style="width:58px;border:1px solid var(--light-gray);border-radius:6px;padding:4px 6px;font-size:12px;font-family:'DM Sans',sans-serif"
        onchange="setStockMax(${i},this.value)" title="Máximo"></td>
      <td><div class="qty-ctrl">
        <button class="qty-btn" onclick="adjustStock(${i},-1)">−</button>
        <span class="qty-val">${item.actual}</span>
        <button class="qty-btn" onclick="adjustStock(${i},+1)">+</button>
      </div></td>
      <td><input type="number" step="0.5" min="0" value="${item.actual}"
        style="width:60px;border:1px solid var(--light-gray);border-radius:6px;padding:4px 6px;font-size:12px;font-family:'DM Sans',sans-serif"
        onchange="setStock(${i},+this.value)" title="Ingresar cantidad directa"></td>
      <td>${pedidoHtml}</td>
      <td>${compHtml}</td>
      <td><div style="display:flex;align-items:center;gap:6px">
        <div class="stock-bar"><div class="stock-fill ${alClass}" style="width:${pct}%"></div></div>
        <span style="font-size:11px;color:var(--mid-gray)">${pct}%</span>
      </div></td>
      <td><span class="alerta-badge ${alClass}">${alLabel}</span></td>
      <td><button class="btn-icon" style="color:var(--red-alert)" onclick="delStock(${i})" title="Eliminar del stock">✕</button></td>
    </tr>`;
  });

  const alertEl = document.getElementById('stock-admin-alert');
  if(alertEl){
    const crits = stockData.filter((s,i)=>getAlerta(s,comprometidos[i])==='comprar');
    alertEl.innerHTML = crits.length
      ? `<div class="alert-banner">🔴 <strong>${crits.length} producto${crits.length>1?'s':''} en stock crítico:</strong> ${crits.map(s=>esc(s.prod)).join(', ')}.</div>`
      : '';
  }
}

// ════════════════════════════════════════
// DATA — KANBAN
// Includes cards AND events from comercial
// ════════════════════════════════════════
const KANBAN_DEFAULTS = [
  {title:'📋 Pedidos Pendientes', color:'#F4F1EC', cards:[]},
  {title:'🔄 En Proceso',        color:'#EBF0E8', cards:[]},
  {title:'📦 Pendiente de Colocación', color:'#FDF0E8', cards:[]},
  {title:'✅ Finalizados',       color:'#E8F0F8', cards:[]}
];
let kanbanData = JSON.parse(JSON.stringify(KANBAN_DEFAULTS));
const TAG_LABELS={'tag-floreria':'Florería','tag-maison':'Maison','tag-evento':'Evento','tag-urgente':'🔴 Urgente','tag-garden':'Jardinería'};
const ESTADO_COL = {'Pedidos Pendientes':0,'En Proceso':1,'Pendiente de Colocacion':2,'Pendiente de Retiro':2,'Confirmado':1,'Pedidos Finalizados':3};
let dragSrcCol=null,dragSrcIdx=null,editingTask=null;

function ensureKanbanCols(){
  // Garantizar que kanbanData tenga 4 columnas válidas
  if(!Array.isArray(kanbanData) || kanbanData.length < 4){
    kanbanData = JSON.parse(JSON.stringify(KANBAN_DEFAULTS));
  }
  kanbanData.forEach((col,i) => {
    if(!col.cards) col.cards = [];
    if(!col.title) col.title = KANBAN_DEFAULTS[i].title;
    if(!col.color) col.color = KANBAN_DEFAULTS[i].color;
  });
}

function syncEventosToKanban(){
  ensureKanbanCols();
  // Remove all evento-linked cards from kanban
  kanbanData.forEach(col=>{
    col.cards = col.cards.filter(c=>!c.eventoIdx && c.eventoIdx!==0);
  });
  // Re-add from eventosData
  eventosData.forEach((ev,idx)=>{
    const colIdx = ESTADO_COL[ev.estado] ?? 0;
    const hora = ev.hora ? ' · '+ev.hora : '';
    kanbanData[colIdx].cards.push({
      title: '🎉 '+ev.nombre,
      desc: `${evZonasLabel(ev)}${ev.pax?' · '+ev.pax+' pax':''}${hora}${ev.asignado?' · 👤 '+ev.asignado:''}\n${ev.notas||''}`,
      tags: ['tag-evento'],
      date: ev.fecha,
      isEvento: true,
      eventoIdx: idx,
      asignado: ev.asignado || '',
    });
  });
  // Ordenar cards por fecha: columnas activas ascendente (más urgente primero), Finalizados descendente (más reciente primero)
  kanbanData.forEach((col, colIdx) => {
    if(colIdx === 3){
      col.cards.sort((a,b) => (b.date||'').localeCompare(a.date||''));
    } else {
      col.cards.sort((a,b) => (a.date||'9999').localeCompare(b.date||'9999'));
    }
  });
}

// Mover una tarjeta del kanban con botones ‹ › (útil en touch, donde no hay drag & drop)
function moveKanbanCard(ci, i, dir){
  const nci = ci + dir;
  if(nci < 0 || nci >= kanbanData.length) return;
  const card = kanbanData[ci].cards.splice(i, 1)[0];
  if(!card) return;
  if(card.isEvento){
    const estadoMap = {0:'Pedidos Pendientes',1:'En Proceso',2:'Pendiente de Colocacion',3:'Pedidos Finalizados'};
    eventosData[card.eventoIdx].estado = estadoMap[nci]||'Pedidos Pendientes';
    fbSave('eventosData', eventosData);
    renderEventos(); renderHome();
  }
  kanbanData[nci].cards.push(card);
  fbSave('kanbanData', kanbanData);
  renderKanban();
}

function renderKanban(){
  syncEventosToKanban();

  // Alert banner for upcoming events (protegido contra eventos sin fecha)
  const alertEl = document.getElementById('kanban-eventos-alert');
  const próximos = eventosData.filter(e=>e.estado!=='Pedidos Finalizados'&&(e.fecha||'')>=TODAY_ISO).sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||'')).slice(0,2);
  if(alertEl) alertEl.innerHTML = próximos.length
    ? `<div class="alert-banner green">🎉 Próximos eventos: ${próximos.map(e=>`<strong>${esc(e.nombre)}</strong> — ${fmtDateTime(e.fecha,e.hora)}`).join(' · ')}</div>`
    : '';

  const board=document.getElementById('kanban-board');
  board.innerHTML='';
  kanbanData.forEach((col,ci)=>{
    const colEl=document.createElement('div');
    colEl.className='kanban-col';
    colEl.style.background=col.color;
    colEl.dataset.col=ci;
    colEl.addEventListener('dragover',e=>{e.preventDefault();colEl.classList.add('drag-over');});
    colEl.addEventListener('dragleave',()=>colEl.classList.remove('drag-over'));
    colEl.addEventListener('drop',e=>{
      e.preventDefault();colEl.classList.remove('drag-over');
      if(dragSrcCol===null) return;
      const card=kanbanData[dragSrcCol].cards.splice(dragSrcIdx,1)[0];
      if(card.isEvento){
        // Update event estado based on col
        const estadoMap = {0:'Pedidos Pendientes',1:'En Proceso',2:'Pendiente de Colocacion',3:'Pedidos Finalizados'};
        eventosData[card.eventoIdx].estado = estadoMap[ci]||'Pedidos Pendientes';
        fbSave('eventosData', eventosData);
        renderEventos(); renderHome();
      }
      kanbanData[ci].cards.push(card);
      fbSave('kanbanData', kanbanData);
      dragSrcCol=dragSrcIdx=null;
      renderKanban();
    });
    colEl.innerHTML=`<div class="kanban-col-header">
      <div class="kanban-col-title">${col.title}</div>
      <span class="kanban-count">${col.cards.length}</span>
    </div>`;
    col.cards.forEach((card,i)=>{
      try{
      if(!card) return;
      const cardEl=document.createElement('div');
      cardEl.className='kanban-card'+(card.isEvento?' evento-card':'')+(card.isEvento&&ci===3?' evento-hecho':'');
      cardEl.draggable=true;
      cardEl.addEventListener('dragstart',()=>{dragSrcCol=ci;dragSrcIdx=i;cardEl.classList.add('dragging');});
      cardEl.addEventListener('dragend',()=>cardEl.classList.remove('dragging'));
      const descLines = (card.desc||'').split('\n').filter(Boolean);
      // Urgencia por fecha del evento: borde y chip según cuántos días faltan
      let urgChip='';
      if(card.isEvento && ci!==3){
        const fechaEv = eventosData[card.eventoIdx]?.fecha;
        if(fechaEv){
          const dias = Math.round((new Date(fechaEv)-new Date(TODAY_ISO))/86400000);
          if(dias===0){ cardEl.classList.add('kanban-urg-hoy'); urgChip='<span class="kanban-urg-chip" style="background:var(--red-alert)">HOY</span>'; }
          else if(dias===1){ cardEl.classList.add('kanban-urg-prox'); urgChip='<span class="kanban-urg-chip" style="background:#D4820A">Mañana</span>'; }
          else if(dias>1 && dias<=3){ cardEl.classList.add('kanban-urg-prox'); urgChip=`<span class="kanban-urg-chip" style="background:#D4A820">En ${dias} días</span>`; }
          else if(dias<0){ cardEl.classList.add('kanban-urg-pasado'); urgChip='<span class="kanban-urg-chip" style="background:var(--mid-gray)">Pasado</span>'; }
        }
      }
      cardEl.innerHTML=`
        <div class="kanban-card-title">${esc(card.title)}${urgChip}</div>
        ${descLines.length?`<div class="kanban-card-desc">${descLines.map(esc).join('<br>')}</div>`:''}
        <div class="kanban-card-tags">${(card.tags||[]).map(t=>`<span class="kanban-tag ${t}">${TAG_LABELS[t]||t}</span>`).join('')}</div>
        <div class="kanban-card-meta">
          <span class="kanban-date">📅 ${card.date}</span>
          <div class="kanban-actions">
            <button class="btn-icon kanban-move" title="Mover a la columna anterior" ${ci===0?'disabled':''} onclick="moveKanbanCard(${ci},${i},-1)">‹</button>
            <button class="btn-icon kanban-move" title="Mover a la columna siguiente" ${ci===kanbanData.length-1?'disabled':''} onclick="moveKanbanCard(${ci},${i},1)">›</button>
            ${card.isEvento?`<button class="btn-icon" title="Ver detalle" onclick="openEventoDetail(${card.eventoIdx})">👁</button><button class="btn-icon" title="Ver en Comercial" onclick="navigate('eventos-comercial')">🔗</button>`:`<button class="btn-icon" onclick="openTaskModal(${ci},${i})">✏️</button>`}
            ${!card.isEvento?`<button class="btn-icon" style="color:var(--red-alert)" onclick="removeKanbanCard(${ci},${i})">✕</button>`:''}
          </div>
        </div>`;
      colEl.appendChild(cardEl);
      }catch(err){ console.warn('Kanban card render error:', err, card); }
    });
    if(ci<3){
      const addBtn=document.createElement('button');
      addBtn.className='add-card-btn';
      addBtn.innerHTML='+ Agregar tarea';
      addBtn.onclick=()=>openTaskModal(ci,null);
      colEl.appendChild(addBtn);
    }
    board.appendChild(colEl);
  });
}

function openTaskModal(ci,i){
  editingTask=(ci!==null&&i!==null)?{ci,i}:null;
  const modal=document.getElementById('task-modal');
  if(editingTask){
    const card=kanbanData[ci].cards[i];
    if(card.isEvento) return; // eventos se editan desde comercial
    document.getElementById('task-modal-title').textContent='Editar Tarea';
    document.getElementById('task-save-btn').textContent='Guardar';
    document.getElementById('task-title').value=card.title;
    document.getElementById('task-desc').value=card.desc||'';
    document.getElementById('task-col').value=ci;
    document.getElementById('task-tag').value=card.tags[0]||'tag-floreria';
    document.getElementById('task-date').value=card.date||TODAY_ISO;
  } else {
    document.getElementById('task-modal-title').textContent='Nueva Tarea';
    document.getElementById('task-save-btn').textContent='Agregar';
    document.getElementById('task-title').value='';
    document.getElementById('task-desc').value='';
    document.getElementById('task-col').value=ci??0;
    document.getElementById('task-tag').value='tag-floreria';
    document.getElementById('task-date').value=TODAY_ISO;
  }
  modal.classList.add('open');
}

function saveKanbanTask(){
  const title=document.getElementById('task-title').value.trim();
  if(!title) return;
  const ci=+document.getElementById('task-col').value;
  const tag=document.getElementById('task-tag').value;
  const date=document.getElementById('task-date').value||TODAY_ISO;
  const desc=document.getElementById('task-desc').value.trim();

  const isNew = !editingTask;

  if(editingTask){
    const {ci:oldCi,i}=editingTask;
    const card=kanbanData[oldCi].cards.splice(i,1)[0];
    card.title=title;card.desc=desc;card.tags=[tag];card.date=date;
    kanbanData[ci].cards.push(card);
  } else {
    kanbanData[ci].cards.push({title,desc,tags:[tag],date,isEvento:false});
  }

  // ── AUTO-SYNC: tag-evento → eventosData ──────────────────────────────────
  if(isNew && tag==='tag-evento'){
    eventosData.push({
      nombre: title,
      tipo: 'Evento',
      fecha: date,
      hora: '',
      salon: '',
      pax: 0,
      notas: desc||'',
      precio: 'A confirmar',
      estado: ['Pedidos Pendientes','En Proceso','Pendiente de Colocacion','Pedidos Finalizados'][ci]||'Pedidos Pendientes',
      fromKanban: true
    });
    fbSave('eventosData', eventosData);
    showToast('🎉 Evento registrado en Área Comercial: ' + title);
    if(document.getElementById('page-eventos-comercial').classList.contains('active')) renderEventos();
    renderHome();
  }

  // ── AUTO-SYNC: tag-floreria → ventasData ─────────────────────────────────
  if(isNew && tag==='tag-floreria'){
    ventasData.push({
      prod: title,
      desc: desc||'',
      fecha: date,
      cliente: '',
      dedicatoria: '',
      precio: '',
      estado: 'pendiente',
      dir: '',
      fromKanban: true
    });
    fbSave('ventasData', ventasData);
    showToast('💐 Tarea de Florería registrada en Ventas Externas: ' + title);
    if(document.getElementById('page-ventas-externas').classList.contains('active')) renderVentas();
  }

  closeModal('task-modal');
  fbSave('kanbanData', kanbanData);
  renderKanban();
}

async function removeKanbanCard(ci,i){
  if(!await confirmModal('¿Eliminar esta tarea?')) return;
  kanbanData[ci].cards.splice(i,1);
  fbSave('kanbanData', kanbanData);
  renderKanban();
}

// ════════════════════════════════════════
// DATA — PROVEEDORES
// ════════════════════════════════════════
let proveedoresList = [
  'Agro Insumos','Cooperativa Flores','Mercado Central','Vivero Norte','Vivero Palermo'
];
function getProvOpts(selected=''){
  return proveedoresList.map(p=>`<option value="${p}"${p===selected?' selected':''}>${p}</option>`).join('');
}

// DATA — COMPRAS (with period filter & history)
// ════════════════════════════════════════
let comprasFlore = [];
let comprasJard = [];

// Filters
let compraFilter = { floreria: null, jardineria: null }; // null = all, {from, to} = range

function getArr(type){ return type==='floreria'?comprasFlore:comprasJard; }
function getTbody(type){ return document.getElementById('tbody-'+type); }

// Áreas de uso = zonas del checklist (Lobby, Biblioteca, Salón Privado, Gioia, etc.)
function getAreaUsoZonas(){
  return [...new Set(CL_TASKS.map(t=>t.zona))].sort((a,b)=>a.localeCompare(b,'es'));
}
function getAreaUsoOpts(current){
  const zonas = getAreaUsoZonas();
  const cur = (current||'').trim();
  // Preservar un valor viejo que no esté en la lista (ej. 'Florería')
  const extra = cur && !zonas.includes(cur) ? `<option value="${esc(cur)}" selected>${esc(cur)}</option>` : '';
  return `<option value="">— Área / uso —</option>` + extra +
    zonas.map(z=>`<option value="${esc(z)}"${z===cur?' selected':''}>${esc(z)}</option>`).join('');
}

function populateFloreriaFormHelpers(){
  // Datalist de Flor/Follaje desde la base de insumos (igual que el pedido semanal rápido)
  const dl = document.getElementById('cf-producto-list');
  if(dl){
    const all = [...new Set([...insumosBDBase, ...(typeof insumosCustom!=='undefined'?insumosCustom:[])])].sort((a,b)=>a.localeCompare(b,'es'));
    dl.innerHTML = all.map(n=>`<option value="${esc(n)}">`).join('');
  }
  // Select de áreas del hotel
  const sec = document.getElementById('cf-sector');
  if(sec && sec.options.length <= 1){
    sec.innerHTML = getAreaUsoOpts('') +
      '<option value="__otra__">✏️ Otra (escribir)...</option>';
    sec.onchange = async function(){
      if(this.value === '__otra__'){
        const custom = await promptModal('Escribí el área / uso:', { title: 'Área / uso' });
        if(custom && custom.trim()){
          const opt = document.createElement('option');
          opt.value = custom.trim(); opt.textContent = custom.trim();
          this.insertBefore(opt, this.querySelector('option[value="__otra__"]'));
          this.value = custom.trim();
        } else { this.value=''; }
      }
    };
  }
}

function copiarUltimoPedido(type){
  const arr = getArr(type);
  if(!arr.length){ showToast('No hay pedidos previos para copiar'); return; }
  const last = arr[0]; // el más reciente (se hace unshift al agregar)
  const p = type==='floreria' ? 'cf' : 'cj';
  const setVal = (id,val)=>{ const el=document.getElementById(p+'-'+id); if(el!=null) el.value = val ?? ''; };
  setVal('fecha', TODAY_ISO);            // fecha de hoy para el nuevo pedido
  setVal('pedidopor', last.pedidopor==='—'?'':last.pedidopor);
  setVal('producto', last.prod);
  setVal('cantidad', last.qty);
  setVal('desc', last.desc);
  setVal('costo', last.costo);
  // proveedor: seleccionar si existe en el select
  const provSel = document.getElementById(p+'-proveedor');
  if(provSel && last.prov){
    const match = [...provSel.options].find(o=>o.value===last.prov);
    if(match) provSel.value = last.prov;
  }
  // área/sector
  const secEl = document.getElementById(p+'-sector');
  if(secEl){
    if(secEl.tagName==='SELECT'){
      const match = [...secEl.options].find(o=>o.value===last.sector);
      if(match) secEl.value = last.sector;
      else if(last.sector){
        const opt=document.createElement('option'); opt.value=last.sector; opt.textContent=last.sector;
        secEl.insertBefore(opt, secEl.querySelector('option[value="__otra__"]')||null);
        secEl.value=last.sector;
      }
    } else secEl.value = last.sector || '';
  }
  showToast('📋 Datos del último pedido cargados — ajustá lo que necesites');
  document.getElementById(p+'-producto')?.focus();
}

// ── Reparto de un mismo artículo entre varias áreas (florería) ──
// Cuando lo que llega en una orden se destina a más de un sector del hotel
// (ej. 3 varas de Limonium: 2 al Lobby Alvear, 1 a Biblioteca), en vez de
// cargar el mismo producto varias veces a mano se define el reparto acá y
// addCompra() genera una línea de compra por área con su cantidad de paquetes.
// El precio por paquete es el mismo en todas (el importe sale de precio × cant).
let cfSplitRows = [];

function toggleCfSplit(){
  const wrap = document.getElementById('cf-split-wrap');
  if(!wrap) return;
  const visible = wrap.style.display !== 'none';
  if(visible){
    wrap.style.display = 'none';
  } else {
    wrap.style.display = '';
    if(cfSplitRows.length === 0){ cfSplitRows = [{sector:'',qty:''},{sector:'',qty:''}]; }
    renderCfSplitRows();
  }
}

function cfSplitAddRow(){
  cfSplitRows.push({sector:'', qty:''});
  renderCfSplitRows();
}

function cfSplitRemoveRow(i){
  cfSplitRows.splice(i,1);
  renderCfSplitRows();
}

function cfSplitUpdRow(i, field, val){
  if(!cfSplitRows[i]) return;
  cfSplitRows[i][field] = val;
  renderCfSplitTotal();
}

function renderCfSplitTotal(){
  const totalEl = document.getElementById('cf-split-total');
  if(!totalEl) return;
  const total = cfSplitRows.reduce((s,r)=>s+(parseFloat(r.qty)||0),0);
  totalEl.textContent = total > 0 ? `Total repartido: ${total}` : '';
}

function renderCfSplitRows(){
  const el = document.getElementById('cf-split-rows');
  if(!el) return;
  el.innerHTML = cfSplitRows.map((r,i)=>`
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
      <select class="form-input" style="flex:2" onchange="cfSplitUpdRow(${i},'sector',this.value)">${getAreaUsoOpts(r.sector)}</select>
      <input class="form-input" type="number" placeholder="Cant." value="${esc(r.qty)}" style="width:80px" onchange="cfSplitUpdRow(${i},'qty',this.value)">
      <button class="btn-icon" style="color:var(--red-alert)" onclick="cfSplitRemoveRow(${i})">✕</button>
    </div>`).join('');
  renderCfSplitTotal();
}

// ── Asociación de compras con eventos ──────────────────────────────────────
// Cada línea de compra puede vincularse a un evento pendiente, para después
// cruzar cuánto se gastó en insumos contra lo que se cobra por ese evento.
// Los eventos se identifican por un id estable (no por índice, que se corre
// al borrar). ensureEventoIds() completa el id de los eventos que aún no lo
// tengan (compat. con datos viejos) y persiste una sola vez.
function genEventoId(){
  return 'ev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7);
}
function ensureEventoIds(){
  let changed = false;
  (eventosData||[]).forEach(ev=>{ if(ev && !ev.id){ ev.id = genEventoId(); changed = true; } });
  if(changed) fbSave('eventosData', eventosData);
}
function eventosPendientes(){
  return (eventosData||[])
    .filter(ev => ev && ev.estado !== 'Pedidos Finalizados')
    .sort((a,b)=>(a.fecha||'9999').localeCompare(b.fecha||'9999'));
}
function eventoLabel(ev){
  return (ev?.nombre||'(evento)') + (ev?.fecha ? ' · ' + fmtDate(ev.fecha) : '');
}
function findEventoById(id){
  if(!id) return null;
  return (eventosData||[]).find(ev=>ev && ev.id===id) || null;
}
function getCompraEventoOpts(currentId){
  ensureEventoIds();
  const pend = eventosPendientes();
  const cur = currentId || '';
  // Preservar un evento ya vinculado aunque haya pasado a finalizado / no listado
  let extra = '';
  if(cur && !pend.some(ev=>ev.id===cur)){
    const ev = findEventoById(cur);
    if(ev) extra = `<option value="${esc(cur)}" selected>${esc(eventoLabel(ev))}</option>`;
  }
  return `<option value="">— Sin evento (stock general) —</option>` + extra +
    pend.map(ev=>`<option value="${esc(ev.id)}"${ev.id===cur?' selected':''}>${esc(eventoLabel(ev))}</option>`).join('');
}
function populateCompraEventoSelect(p){
  const sel = document.getElementById(p+'-evento-link');
  if(sel){ const cur = sel.value; sel.innerHTML = getCompraEventoOpts(cur); sel.value = cur; }
  // Filtro de historial por evento
  const fsel = document.getElementById(p+'-filter-evento');
  if(fsel){
    const cur = fsel.value;
    const arr = getArr(p==='cf'?'floreria':'jardineria');
    const usadosMap = new Map();
    (arr||[]).forEach(r=>{
      if(!r) return;
      _compraEventosAlloc(r).forEach(a=>{ if(a && a.eventoId) usadosMap.set(a.eventoId, a.evento||findEventoById(a.eventoId)?.nombre||a.eventoId); });
    });
    const usados = [...usadosMap.entries()];
    fsel.innerHTML = '<option value="">Todos los eventos</option>' +
      usados.map(([id,nom])=>`<option value="${esc(id)}">${esc(nom)}</option>`).join('');
    fsel.value = cur;
  }
}
// Cambiar/quitar el evento de una línea de compra ya cargada, desde la tabla.
function setCompraEvento(type, i, id){
  const r = getArr(type)[i];
  if(!r) return;
  const ev = id ? findEventoById(id) : null;
  r.eventoId = id || '';
  r.evento = ev ? (ev.nombre||'') : '';
  if(type==='floreria'){ window._comprasFloreLastSave = Date.now(); fbSave('comprasFlore', comprasFlore); }
  else { window._comprasJardLastSave = Date.now(); fbSave('comprasJard', comprasJard); }
  renderCompras(type);
  // Refrescar también el historial de pedidos recibidos, que ahora también
  // permite asociar el evento en sus renglones.
  const _hw = _histIds(type).wrap;
  if(document.getElementById(_hw)?.style.display !== 'none') renderHistorialCompras(type);
  if(document.getElementById('page-rentabilidad-eventos')?.classList.contains('active')) renderRentabilidad();
}

// ─── Reparto de una compra entre uno o más eventos (por cantidad) ───────────
// Modelo: r.eventos = [{eventoId, evento, qty}]. Se conserva r.eventoId/r.evento
// con el primer evento para compatibilidad con filtros/vistas antiguas.
let _cevState = null; // { type, idx, rows:[{eventoId, qty}] }

function _compraEventosAlloc(r){
  if(r && Array.isArray(r.eventos) && r.eventos.length) return r.eventos;
  if(r && r.eventoId) return [{ eventoId:r.eventoId, evento:r.evento||'', qty:_compraCant(r) }];
  return [];
}

// Celda con los eventos asignados (chips) + botón para abrir el editor.
function _compraEventosBtn(type, i, r){
  const allocs = _compraEventosAlloc(r);
  const chips = allocs.map(a=>{
    const ev = findEventoById(a.eventoId);
    const nom = ev ? (ev.nombre||'') : (a.evento||'evento');
    return `<span style="display:inline-block;background:#FCEEF2;border:1px solid #E0B3C4;color:#7A3A2A;border-radius:6px;font-size:10px;font-weight:600;padding:2px 6px;margin:0 3px 3px 0;white-space:nowrap">${esc(nom)} · ${esc(a.qty)}</span>`;
  }).join('');
  const has = allocs.length>0;
  const label = has ? '✏️ Editar evento(s)' : '🎉 Asignar evento(s)';
  const btnStyle = has
    ? 'background:#FCEEF2;border:1px solid #E0B3C4;color:#7A3A2A;font-weight:600'
    : 'background:#fff;border:1px solid var(--light-gray);color:var(--mid-gray)';
  return `<div style="margin-top:4px">${chips?`<div style="margin-bottom:3px">${chips}</div>`:''}<button type="button" onclick="openCompraEventos('${type}',${i})" style="${btnStyle};border-radius:6px;font-size:11px;padding:4px 8px;cursor:pointer;min-width:140px">${label}</button></div>`;
}

function _cevTotalHtml(){
  if(!_cevState) return '';
  const tot = _cevState.rows.reduce((s,row)=>s+(parseFloat(row.qty)||0), 0);
  const r = getArr(_cevState.type)[_cevState.idx];
  const disp = r ? _compraCant(r) : 0;
  const over = tot>disp;
  const totFmt = Number.isInteger(tot) ? tot : tot.toFixed(2);
  return `Repartido: <strong style="color:${over?'var(--red-alert)':'var(--charcoal)'}">${totFmt}</strong> / ${disp} comprado${over?' <span style="color:var(--red-alert)">· excede lo comprado</span>':''}`;
}

function openCompraEventos(type, i){
  const r = getArr(type)[i];
  if(!r) return;
  const allocs = _compraEventosAlloc(r).map(a=>({ eventoId:a.eventoId||'', qty:(a.qty!=null?a.qty:'') }));
  if(!allocs.length) allocs.push({ eventoId:'', qty:'' });
  _cevState = { type, idx:i, rows:allocs };
  const sub = document.getElementById('cev-sub');
  if(sub) sub.innerHTML = `<strong>${esc(r.prod||'—')}</strong> · ${esc(_compraCant(r))} ${type==='floreria'?'paquete(s)':'unidad(es)'} · precio unit. $${parseMoney(r.costo).toLocaleString('es-AR')}<br>Repartí la compra entre los eventos indicando cuánta cantidad va a cada uno.`;
  _cevRender();
  document.getElementById('compra-eventos-modal').classList.add('open');
}

function _cevRender(){
  if(!_cevState) return;
  const cont = document.getElementById('cev-rows');
  if(!cont) return;
  cont.innerHTML = _cevState.rows.map((row,ri)=>{
    return `<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
      <select class="form-input" onchange="cevSet(${ri},'eventoId',this.value)" style="flex:1;font-size:12px;min-width:0">${getCompraEventoOpts(row.eventoId)}</select>
      <input class="form-input" type="number" min="0" step="any" value="${esc(row.qty)}" placeholder="cant." onchange="cevSet(${ri},'qty',this.value)" style="width:70px;font-size:12px;text-align:center">
      <button type="button" onclick="cevRemove(${ri})" title="Quitar" style="border:none;background:none;color:var(--red-alert);cursor:pointer;font-size:14px;width:24px">✕</button>
    </div>`;
  }).join('');
  const totEl = document.getElementById('cev-total');
  if(totEl) totEl.innerHTML = _cevTotalHtml();
}

function cevSet(ri, field, val){
  if(!_cevState || !_cevState.rows[ri]) return;
  _cevState.rows[ri][field] = val;
  if(field==='eventoId'){ _cevRender(); }
  else { const totEl = document.getElementById('cev-total'); if(totEl) totEl.innerHTML = _cevTotalHtml(); }
}

function cevAdd(){
  if(!_cevState) return;
  _cevState.rows.push({ eventoId:'', qty:'' });
  _cevRender();
}

function cevRemove(ri){
  if(!_cevState) return;
  _cevState.rows.splice(ri,1);
  if(!_cevState.rows.length) _cevState.rows.push({ eventoId:'', qty:'' });
  _cevRender();
}

function guardarCompraEventos(){
  if(!_cevState) return;
  const { type, idx } = _cevState;
  const r = getArr(type)[idx];
  if(!r){ closeModal('compra-eventos-modal'); return; }
  const allocs = _cevState.rows
    .filter(row=>row.eventoId)
    .map(row=>{ const ev = findEventoById(row.eventoId); return { eventoId:row.eventoId, evento: ev?(ev.nombre||''):'', qty: parseFloat(row.qty)||0 }; });
  // Consolidar renglones repetidos del mismo evento
  const merged = [];
  allocs.forEach(a=>{ const ex = merged.find(m=>m.eventoId===a.eventoId); if(ex) ex.qty += a.qty; else merged.push({...a}); });
  if(merged.length){
    r.eventos = merged;
    r.eventoId = merged[0].eventoId;   // compat con filtros / rentabilidad antigua
    r.evento   = merged[0].evento;
  } else {
    delete r.eventos;
    r.eventoId = '';
    r.evento   = '';
  }
  if(type==='floreria'){ window._comprasFloreLastSave = Date.now(); fbSave('comprasFlore', comprasFlore); }
  else { window._comprasJardLastSave = Date.now(); fbSave('comprasJard', comprasJard); }
  closeModal('compra-eventos-modal');
  renderCompras(type);
  const _hw = _histIds(type).wrap;
  if(document.getElementById(_hw)?.style.display !== 'none') renderHistorialCompras(type);
  if(document.getElementById('page-rentabilidad-eventos')?.classList.contains('active')) renderRentabilidad();
}

// Total gastado en compras (florería + jardinería) vinculadas a un evento.
// Si la compra se reparte entre varios eventos (c.eventos), se toma solo la
// parte proporcional (precio unitario × cantidad asignada a ese evento).
function gastoComprasEvento(eventoId){
  if(!eventoId) return 0;
  return [...(comprasFlore||[]), ...(comprasJard||[])].reduce((s,c)=>{
    if(!c) return s;
    if(Array.isArray(c.eventos) && c.eventos.length){
      const cant = c.eventos
        .filter(a=>a && a.eventoId===eventoId)
        .reduce((t,a)=>t+(parseFloat(a.qty)||0), 0);
      return s + parseMoney(c.costo)*cant;
    }
    if(c.eventoId===eventoId) return s + _compraImporte(c);
    return s;
  }, 0);
}

function addCompra(type){
  const p=type==='floreria'?'cf':'cj';
  const prod=document.getElementById(p+'-producto').value.trim();
  if(!prod){showToast('Ingresá el producto.','error');return;}

  // Evento asociado (opcional) — se guarda el id estable + el nombre para mostrar
  const eventoId = document.getElementById(p+'-evento-link')?.value || '';
  const eventoObj = eventoId ? findEventoById(eventoId) : null;
  const eventoNombre = eventoObj ? (eventoObj.nombre||'') : '';

  const fecha = document.getElementById(p+'-fecha').value||TODAY_ISO;
  const pedidopor = document.getElementById(p+'-pedidopor').value||'—';
  const desc = document.getElementById(p+'-desc').value||'';
  const prov = document.getElementById(p+'-proveedor').value||'';
  // El campo "costo" es el PRECIO POR PAQUETE (lo que sale un paquete),
  // no el total del pedido. El importe de cada línea = precio × cantidad.
  const precioPaq = parseMoney(document.getElementById(p+'-costo').value);
  const sucursal = getSucursalId();

  // Reparto entre varias áreas (solo florería): una línea de compra por área,
  // con la cantidad de paquetes de cada una. El precio por paquete es el mismo
  // en todas las líneas (no se prorratea: cada paquete cuesta lo mismo).
  const splits = type==='floreria'
    ? cfSplitRows.filter(r=>r.sector && parseFloat(r.qty)>0)
    : [];

  if(splits.length > 0){
    splits.forEach((r)=>{
      const qty = parseFloat(r.qty)||0;
      getArr(type).unshift({
        fecha, pedidopor, prod, desc,
        qty,
        costo: precioPaq>0 ? String(precioPaq) : '',
        prov,
        sector: r.sector,
        eventoId, evento: eventoNombre,
        estado:'pedido',
        sucursal
      });
    });
    cfSplitRows = [];
    document.getElementById('cf-split-wrap').style.display = 'none';
    showToast(`✅ "${prod}" repartido en ${splits.length} áreas`);
  } else {
    getArr(type).unshift({
      fecha, pedidopor, prod, desc,
      qty:document.getElementById(p+'-cantidad').value||1,
      costo:document.getElementById(p+'-costo').value||'',
      prov,
      sector:document.getElementById(p+'-sector').value||'',
      eventoId, evento: eventoNombre,
      estado:'pedido',
      sucursal
    });
  }

  // Persistir en Firebase (antes no se guardaba al agregar: los ítems se
  // perdían al refrescar y el usuario compras no los veía en su dispositivo)
  if(type==='floreria'){ window._comprasFloreLastSave = Date.now(); fbSave('comprasFlore', comprasFlore); }
  else { window._comprasJardLastSave = Date.now(); fbSave('comprasJard', comprasJard); }

  // El costo por vara del cotizador (flores/follaje) se calcula en la recepción,
  // donde se conocen las varas por paquete reales (costo por paquete ÷ varas/paq).
  // Al cargar el pedido todavía no se sabe cuántas varas trae cada paquete, así
  // que no se toca el cotizador acá para no meter un precio por vara equivocado.

  ['fecha','pedidopor','producto','cantidad','desc','costo','proveedor','sector'].forEach(id=>{
    const el=document.getElementById(p+'-'+id);
    if(el) el.value='';
  });
  renderCompras(type);
  if(document.getElementById('page-stock').classList.contains('active')) renderStock();
  updateKpiCompras();
}

// ── Importar pedido desde Excel/Sheets (.xlsx) — Compras Florería ──
// Lee el archivo tal como lo cargan hoy (columnas Fecha, Pedido por,
// Producto, Descripción, Cantidad, Precio por paquete, Proveedor, Área/uso),
// detectando las columnas por el nombre del encabezado. Nunca escribe nada
// directo: siempre pasa por una vista previa que hay que confirmar, y las
// filas importadas quedan en estado "pedido" (no tocan stock) — recién se
// suman al stock cuando se controlan/recepcionan como cualquier otro pedido.
let cfImportWb = null;
let cfImportRows = [];

const CF_IMPORT_SYNONYMS = {
  fecha:      ['fecha'],
  pedidopor:  ['pedido por','pedido realizado por','pedidopor','pedido'],
  prod:       ['flor / follaje','flor/follaje','producto','flor','articulo','artículo'],
  desc:       ['descripcion adicional','descripcion','descripción','desc','detalle','color'],
  qty:        ['cantidad','cant','paq','paquetes'],
  costoUnit:  ['precio','costo','precio unitario','precio por paquete','precio paquete'],
  prov:       ['proveedor','prov'],
  sector:     ['usuario final / area','usuario final / área','usuario final','area/uso','área/uso','area / uso','área / uso','area','área','sector']
};

function normHeaderTxt(s){
  return String(s||'').toLowerCase()
    .replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i')
    .replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u').replace(/ñ/g,'n')
    .trim();
}

function parseFechaImport(v){
  if(v==null || v==='') return '';
  if(typeof v === 'number'){
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    if(isNaN(d)) return '';
    return d.toISOString().slice(0,10);
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if(m){
    let [, dd, mm, yy] = m;
    if(yy.length===2) yy = (+yy < 70 ? '20'+yy : '19'+yy);
    return `${yy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
  }
  return '';
}

function cfImportFile(input){
  const file = input.files?.[0];
  if(!file) return;
  const X = window.XLSX;
  if(!X){ showToast('Error: librería XLSX no disponible','error'); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    try{
      cfImportWb = X.read(new Uint8Array(e.target.result), {type:'array'});
    } catch(err){
      showToast('No se pudo leer el archivo: '+err.message,'error');
      return;
    }
    const sheets = cfImportWb.SheetNames || [];
    if(!sheets.length){ showToast('El archivo no tiene hojas.','error'); return; }
    const sel = document.getElementById('cf-import-sheet-sel');
    sel.innerHTML = sheets.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
    // Preseleccionar la hoja que parezca el mes actual, si existe
    const mesActual = normHeaderTxt(getMonthLabel(TODAY_ISO));
    const match = sheets.find(s=>normHeaderTxt(s)===mesActual || mesActual.startsWith(normHeaderTxt(s)));
    if(match) sel.value = match;
    document.getElementById('cf-import-sheet-picker').style.display = 'flex';
    document.getElementById('cf-import-preview').style.display = 'none';
  };
  reader.readAsArrayBuffer(file);
}

function cfImportCancel(){
  cfImportWb = null;
  cfImportRows = [];
  document.getElementById('cf-import-sheet-picker').style.display = 'none';
  document.getElementById('cf-import-preview').style.display = 'none';
  document.getElementById('cf-import-file').value = '';
}

function cfImportParseSheet(){
  const X = window.XLSX;
  const sheetName = document.getElementById('cf-import-sheet-sel').value;
  const sheet = cfImportWb?.Sheets?.[sheetName];
  if(!sheet){ showToast('No se encontró la hoja seleccionada.','error'); return; }

  const rows = X.utils.sheet_to_json(sheet, {header:1, raw:true, defval:''});
  // Buscar la fila de encabezados: la primera con al menos 2 celdas de texto reconocibles
  let headerIdx = -1, colMap = {};
  for(let i=0;i<Math.min(rows.length,10);i++){
    const row = rows[i];
    const map = {};
    row.forEach((cell,ci)=>{
      const h = normHeaderTxt(cell);
      if(!h) return;
      for(const [field, syns] of Object.entries(CF_IMPORT_SYNONYMS)){
        if(map[field]!=null) continue;
        if(syns.some(s=>h===normHeaderTxt(s))) map[field] = ci;
      }
    });
    if(map.prod!=null && map.qty!=null){ headerIdx = i; colMap = map; break; }
  }
  if(headerIdx===-1){
    showToast('No pude detectar los encabezados (necesito al menos "Producto" y "Cantidad"). Revisá que la primera fila tenga los títulos de columna.','error');
    return;
  }

  const parsed = [];
  for(let i=headerIdx+1;i<rows.length;i++){
    const row = rows[i];
    const prod = colMap.prod!=null ? String(row[colMap.prod]??'').trim() : '';
    if(!prod) continue; // fila vacía o separadora
    const qty = colMap.qty!=null ? (parseFloat(row[colMap.qty]) || 0) : 0;
    if(qty<=0) continue;
    const costoUnit = colMap.costoUnit!=null ? parseMoney(row[colMap.costoUnit]) : 0;
    parsed.push({
      fecha: colMap.fecha!=null ? parseFechaImport(row[colMap.fecha]) : '',
      pedidopor: colMap.pedidopor!=null ? String(row[colMap.pedidopor]??'').trim() : '',
      prod,
      desc: colMap.desc!=null ? String(row[colMap.desc]??'').trim() : '',
      qty,
      costo: costoUnit>0 ? String(Math.round(costoUnit*qty*100)/100) : '',
      prov: colMap.prov!=null ? String(row[colMap.prov]??'').trim() : '',
      sector: colMap.sector!=null ? String(row[colMap.sector]??'').trim() : ''
    });
  }

  if(!parsed.length){
    showToast('No encontré filas con producto y cantidad para importar en esa hoja.','error');
    return;
  }

  cfImportRows = parsed;
  document.getElementById('cf-import-sheet-picker').style.display = 'none';
  renderCfImportPreview(colMap);
}

function renderCfImportPreview(colMap){
  const el = document.getElementById('cf-import-preview');
  if(!el) return;
  const campoLabel = {fecha:'Fecha',pedidopor:'Pedido por',prod:'Producto',desc:'Descripción',qty:'Cantidad',costoUnit:'Precio (por paquete)',prov:'Proveedor',sector:'Área/uso'};
  const detectados = Object.entries(colMap).map(([f,ci])=>`${campoLabel[f]||f}: col. ${String.fromCharCode(65+ci)}`).join(' · ');
  el.style.display = '';
  el.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px">Vista previa de importación — ${cfImportRows.length} pedido${cfImportRows.length!==1?'s':''}</div>
    <div style="font-size:11px;color:var(--mid-gray);margin-bottom:10px">Columnas detectadas: ${esc(detectados)}. Los pedidos se cargan en estado "Pedido" (no tocan el stock) — el stock se actualiza recién cuando los controles/recepciones como a cualquier otro pedido.</div>
    <div style="max-height:320px;overflow:auto;border:1px solid var(--light-gray);border-radius:6px">
      <table style="width:100%;font-size:11.5px;border-collapse:collapse">
        <thead><tr style="background:#FAF8F4;position:sticky;top:0">
          <th style="padding:5px 8px;text-align:left">Fecha</th><th style="padding:5px 8px;text-align:left">Pedido por</th>
          <th style="padding:5px 8px;text-align:left">Producto</th><th style="padding:5px 8px;text-align:left">Desc.</th>
          <th style="padding:5px 8px;text-align:center">Cant.</th><th style="padding:5px 8px;text-align:right">Costo total</th>
          <th style="padding:5px 8px;text-align:left">Proveedor</th><th style="padding:5px 8px;text-align:left">Área/uso</th>
        </tr></thead>
        <tbody>${cfImportRows.map(r=>`<tr style="border-top:1px solid #F0EDE8">
          <td style="padding:5px 8px">${esc(r.fecha||'—')}</td>
          <td style="padding:5px 8px">${esc(r.pedidopor||'—')}</td>
          <td style="padding:5px 8px;font-weight:500">${esc(r.prod)}</td>
          <td style="padding:5px 8px;color:var(--mid-gray)">${esc(r.desc||'—')}</td>
          <td style="padding:5px 8px;text-align:center">${esc(r.qty)}</td>
          <td style="padding:5px 8px;text-align:right">${r.costo?'$'+parseMoney(r.costo).toLocaleString('es-AR'):'—'}</td>
          <td style="padding:5px 8px">${esc(r.prov||'—')}</td>
          <td style="padding:5px 8px">${esc(r.sector||'—')}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn-add" onclick="cfImportConfirm()">✅ Confirmar importación de ${cfImportRows.length} pedidos</button>
      <button class="btn-secondary" onclick="cfImportCancel()">✕ Cancelar</button>
    </div>`;
}

async function cfImportConfirm(){
  if(!cfImportRows.length) return;
  if(!await confirmModal(`¿Importar ${cfImportRows.length} pedidos a Compras Florería? Quedarán en estado "Pedido", listos para controlar.`)) return;
  const sucursal = getSucursalId();
  let nuevosProv = 0;
  cfImportRows.forEach(r=>{
    // Registrar automáticamente proveedores nuevos que vengan en el Excel
    // y no estén ya en la lista, para que el desplegable los reconozca.
    if(r.prov && !proveedoresList.includes(r.prov)){
      proveedoresList.push(r.prov);
      nuevosProv++;
    }
    comprasFlore.unshift({
      fecha: r.fecha || TODAY_ISO,
      pedidopor: r.pedidopor || '—',
      prod: r.prod,
      desc: r.desc || '',
      qty: r.qty,
      costo: r.costo || '',
      prov: r.prov || '',
      sector: r.sector || '',
      estado: 'pedido',
      sucursal
    });
  });
  if(nuevosProv > 0){
    proveedoresList.sort((a,b)=>a.localeCompare(b,'es'));
    fbSave('proveedoresList', proveedoresList);
  }
  window._comprasFloreLastSave = Date.now();
  fbSave('comprasFlore', comprasFlore);
  showToast(`✅ ${cfImportRows.length} pedidos importados${nuevosProv?` (${nuevosProv} proveedor${nuevosProv!==1?'es':''} nuevo${nuevosProv!==1?'s':''} agregado${nuevosProv!==1?'s':''})`:''}`);
  cfImportCancel();
  renderCompras('floreria');
  updateKpiCompras();
}

function applyCompraFilter(type){
  const from = document.getElementById((type==='floreria'?'cf':'cj')+'-from').value;
  const to   = document.getElementById((type==='floreria'?'cf':'cj')+'-to').value;
  if(!from && !to){ clearCompraFilter(type); return; }
  compraFilter[type] = { from: from||'2000-01', to: to||'2099-12' };
  renderCompras(type);
}

function clearCompraFilter(type){
  compraFilter[type] = null;
  renderCompras(type);
}

function renderPeriodTabs(type){
  const arr = getArr(type);
  const months = [...new Set(arr.map(r=>r.fecha?r.fecha.slice(0,7):''))].filter(Boolean).sort().reverse();
  const tabsEl = document.getElementById('compras-'+(type==='floreria'?'flore':'jard')+'-period-tabs');
  const f = compraFilter[type];
  tabsEl.innerHTML = '<span style="font-size:11px;color:var(--mid-gray);margin-right:6px;white-space:nowrap">Acceso rápido:</span>';
  const allBtn = document.createElement('button');
  allBtn.className = 'hist-filter-btn'+(!f?' active':'');
  allBtn.textContent = 'Todo';
  allBtn.onclick = ()=>clearCompraFilter(type);
  tabsEl.appendChild(allBtn);
  months.forEach(m=>{
    const btn = document.createElement('button');
    const isCurrent = f && f.from===m && f.to===m;
    btn.className = 'hist-filter-btn'+(isCurrent?' active':'');
    btn.textContent = getMonthLabel(m+'-01');
    btn.onclick = ()=>{
      compraFilter[type] = isCurrent ? null : { from:m, to:m };
      renderCompras(type);
    };
    tabsEl.appendChild(btn);
  });
}

// Cantidad de paquetes de una compra (recibidos si ya llegó, si no lo pedido).
// Fallback a 1 para filas viejas sin cantidad cargada, así no se anula su importe.
function _compraCant(r){
  if(!r) return 0;
  const q = parseFloat(r.qty);
  return (!isNaN(q) && q>0) ? q : 1;
}
// Importe total de una línea de compra = precio (por paquete) × cantidad pedida.
// Se usa la cantidad del pedido (qty), no los paquetes recibidos, para que el
// importe siempre sea "precio × cantidad" tal como se ve en el renglón, y el
// total del pedido cierre con la suma de los renglones.
function _compraImporte(r){ return parseMoney(r && r.costo) * _compraCant(r); }

function renderCompraSummary(type, filtered){
  const summaryEl = document.getElementById('compras-'+(type==='floreria'?'flore':'jard')+'-summary');
  const activas = filtered.filter(r=>!r.anulado);
  const total = activas.reduce((s,r)=>s+_compraImporte(r),0);
  const recibidos = activas.filter(r=>r.estado==='recibido').reduce((s,r)=>s+_compraImporte(r),0);
  const enPedido = activas.filter(r=>r.estado!=='recibido').length;
  summaryEl.innerHTML = `
    <div class="card"><div class="card-label">💰 Total período</div><div class="card-value" style="font-size:26px">$${total.toLocaleString('es-AR')}</div><div class="card-sub">${activas.length} órdenes</div></div>
    <div class="card"><div class="card-label">📦 Recibido</div><div class="card-value green" style="font-size:26px">$${recibidos.toLocaleString('es-AR')}</div></div>
    <div class="card"><div class="card-label">📝 En pedido</div><div class="card-value amber" style="font-size:26px">${enPedido}</div><div class="card-sub">esperando recepción</div></div>`;
}

// Returns HTML badge showing stock status for a given product name
function getStockBadge(prodName){
  if(!prodName) return '<span class="stock-inline-badge sib-none">—</span>';
  const lower = prodName.toLowerCase();
  // Find all matching stock items
  const matches = stockData.filter(s =>
    s.prod.toLowerCase().includes(lower) || lower.includes(s.prod.toLowerCase())
  );
  if(matches.length === 0){
    return '<span class="stock-inline-badge sib-none">⚪ Sin datos</span>';
  }
  // Use the best (highest actual) match
  const best = matches.reduce((a,b) => a.actual > b.actual ? a : b);
  const al = getAlerta(best);
  if(al === 'ok'){
    return `<span class="stock-inline-badge sib-ok">🟢 ${best.actual} uds</span>`;
  } else if(al === 'atencion'){
    return `<span class="stock-inline-badge sib-low">🟡 ${best.actual} uds</span><div style="font-size:10px;color:#A06A00;margin-top:2px">Mín: ${best.min}</div>`;
  } else {
    const label = best.actual <= 0 ? 'Sin stock' : best.actual+' uds';
    return `<span class="stock-inline-badge sib-out">🔴 ${label}</span><div style="font-size:10px;color:var(--red-alert);margin-top:2px">Mín: ${best.min}</div>`;
  }
}

function renderCompras(type){
  if(type==='floreria') populateFloreriaFormHelpers();
  const arr = getArr(type);
  const p = type==='floreria' ? 'cf' : 'cj';
  populateCompraEventoSelect(p);
  const f = compraFilter[type];

  // Filtro de período (meses)
  let filtered = f
    ? arr.filter(r=>{ const ym=r.fecha?r.fecha.slice(0,7):''; return ym>=f.from && ym<=f.to; })
    : arr;

  renderPeriodTabs(type);

  // ── Poblar y leer filtros extra (proveedor, área, fecha) ──
  const provSel  = document.getElementById(p+'-filter-prov');
  const areaSel  = document.getElementById(p+'-filter-area');
  const desdeInp = document.getElementById(p+'-filter-desde');
  const hastaInp = document.getElementById(p+'-filter-hasta');

  if(provSel){
    const provActual = provSel.value;
    const provs = [...new Set(arr.filter(r=>r.prov).map(r=>r.prov))].sort((a,b)=>a.localeCompare(b,'es'));
    provSel.innerHTML = '<option value="">Todos los proveedores</option>' + provs.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');
    provSel.value = provActual;
  }
  if(areaSel){
    const areaActual = areaSel.value;
    const areas = [...new Set(arr.filter(r=>r.sector).map(r=>r.sector))].sort((a,b)=>a.localeCompare(b,'es'));
    areaSel.innerHTML = '<option value="">Todas las áreas</option>' + areas.map(a=>`<option value="${esc(a)}">${esc(a)}</option>`).join('');
    areaSel.value = areaActual;
  }

  const fProv  = provSel?.value || '';
  const fArea  = areaSel?.value || '';
  const fDesde = desdeInp?.value || '';
  const fHasta = hastaInp?.value || '';
  const fEvento = document.getElementById(p+'-filter-evento')?.value || '';

  if(fProv)   filtered = filtered.filter(r => r.prov === fProv);
  if(fArea)   filtered = filtered.filter(r => r.sector === fArea);
  if(fDesde)  filtered = filtered.filter(r => (r.fecha||'') >= fDesde);
  if(fHasta)  filtered = filtered.filter(r => (r.fecha||'') <= fHasta);
  if(fEvento) filtered = filtered.filter(r => _compraEventosAlloc(r).some(a=>a.eventoId===fEvento));

  filtered = applyCompraFiltersExtToArr(type, filtered);
  renderCompraFiltersPanel(type);
  renderCompraSummary(type, filtered);

  // Para la tabla: por defecto solo pedidos en curso (los recibidos se van solos).
  // Con "Incluir recibidos" tildado — o al filtrar por proveedor — se muestra todo
  // el historial, así se puede ver todo lo comprado a un proveedor (nuevo y viejo).
  // Con proveedor o un rango de fechas activo mostramos TODO (recibidos incluidos),
  // para que el filtro devuelva el historial completo del período, no solo lo pendiente.
  const incluirRecibidos = document.getElementById(p+'-filter-recibidos')?.checked || !!fProv || !!fDesde || !!fHasta;
  const activos = incluirRecibidos ? filtered : filtered.filter(r => r.estado !== 'recibido');
  const NCOLS = type==='floreria' ? 13 : 12;

  // Resumen del proveedor filtrado (total comprado + cantidad de pedidos)
  const provSummaryEl = document.getElementById(p+'-prov-summary');
  if(provSummaryEl){
    if(fProv && filtered.length){
      const totalProv = filtered.reduce((s,r)=>s+_compraImporte(r),0);
      const fechasProv = new Set(filtered.map(r=>r.fecha).filter(Boolean)).size;
      provSummaryEl.style.display='';
      provSummaryEl.innerHTML = `<strong>${esc(fProv)}</strong> · ${filtered.length} ítem${filtered.length!==1?'s':''} en ${fechasProv} pedido${fechasProv!==1?'s':''} · total <strong>$${totalProv.toLocaleString('es-AR')}</strong>`;
    } else { provSummaryEl.style.display='none'; provSummaryEl.innerHTML=''; }
  }

  const tbody = getTbody(type);
  if(!tbody) return;
  if(activos.length===0){
    tbody.innerHTML=`<tr><td colspan="${NCOLS}" style="padding:20px;text-align:center;color:var(--mid-gray)">${filtered.length>0?'✅ Todos los pedidos de este período fueron recibidos. Tildá "Incluir recibidos" para verlos.':'Sin compras en este período.'}</td></tr>`;
    if(type==='floreria') renderCompraAlert();
    return;
  }

  // ── Agrupar por fecha (cada fecha = bloque de pedido) ──
  const byDate = {};
  activos.forEach(r => {
    const d = r.fecha || 'sin-fecha';
    if(!byDate[d]) byDate[d] = [];
    byDate[d].push(r);
  });
  const fechas = Object.keys(byDate).sort((a,b) => b.localeCompare(a)); // más reciente primero

  let html = '';
  fechas.forEach(fecha => {
    const items = byDate[fecha];
    const totalBloque = items.reduce((s,r) => s + _compraImporte(r), 0);
    const cantItems = items.length;
    const cantTotal = items.reduce((s,r) => s + (+r.qty||0), 0);
    html += `<tr class="compra-date-header">
      <td colspan="${NCOLS}" style="background:#F4F1EC;padding:10px 14px;border-bottom:2px solid #E5E3DC">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <div>
            <strong style="font-size:14px;color:#1A1A1A">📦 Pedido del ${fecha!=='sin-fecha' ? fmtDate(fecha) : 'sin fecha'}</strong>
            <span style="color:#7A7A72;font-size:12px;margin-left:10px">${cantItems} ítem${cantItems!==1?'s':''} · ${cantTotal} unidades</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-weight:600;color:#1A1A1A;font-size:13px">${totalBloque ? '$'+totalBloque.toLocaleString('es-AR') : ''}</span>
            <button class="btn-secondary" style="font-size:11px;padding:4px 10px" onclick="copiarBloquePedido('${type}','${fecha}')" title="Copiar este pedido con fecha de hoy para modificar">📋 Copiar pedido</button>
          </div>
        </div>
      </td>
    </tr>`;
    items.forEach(r => {
      const i = arr.indexOf(r);
      // Importe y costo por vara — calculados igual que en el historial, para que
      // la misma información aparezca en todos lados.
      const _imp = parseMoney(r.costo)>0 ? '$'+_compraImporte(r).toLocaleString('es-AR') : '<span style="color:var(--mid-gray)">—</span>';
      const _cvDiv = parseFloat(r.varasPorPaq)||parseFloat(r.totalVaras)||parseFloat(r.qty)||0;
      const _cvVal = (parseMoney(r.costo)>0 && _cvDiv>0) ? Math.round(parseMoney(r.costo)/_cvDiv) : null;
      const _cv = _cvVal!=null ? '$'+_cvVal.toLocaleString('es-AR') : '<span style="color:var(--mid-gray)">—</span>';
      html += `<tr>
      <td data-label="Fecha"><input class="form-input" type="date" value="${esc(r.fecha)}" onchange="updC('${type}',${i},'fecha',this.value)" style="min-width:130px"></td>
      <td data-label="Pedido por"><input class="form-input" value="${esc(r.pedidopor)}" onchange="updC('${type}',${i},'pedidopor',this.value)" style="min-width:100px"></td>
      <td data-label="${type==='floreria'?'Flor / Follaje':'Producto'}"><input class="form-input" value="${esc(r.prod)}" onchange="updC('${type}',${i},'prod',this.value)" style="min-width:140px"></td>
      <td data-label="Descripción"><input class="form-input" value="${esc(r.desc)}" placeholder="—" onchange="updC('${type}',${i},'desc',this.value)" style="min-width:120px"></td>
      <td data-label="Cantidad"><input class="form-input" type="number" value="${esc(r.qty)}" onchange="updC('${type}',${i},'qty',this.value);renderStock();renderCompras('${type}')" style="width:65px"></td>
      <td data-label="${type==='floreria'?'Precio x paq':'Precio unit.'}"><input class="form-input" value="${esc(r.costo)}" placeholder="$" onchange="updC('${type}',${i},'costo',this.value);renderCompras('${type}')" style="width:90px"></td>
      <td data-label="Importe" style="text-align:right;font-weight:600;white-space:nowrap">${_imp}</td>
      ${type==='floreria'?`<td data-label="Costo/vara" style="text-align:right;font-weight:700;color:var(--sage-dark);white-space:nowrap">${_cv}</td>`:''}
      <td data-label="Proveedor"><select class="form-input" onchange="updC('${type}',${i},'prov',this.value)" style="min-width:130px"><option value=''>— Seleccionar —</option>${getProvOpts(r.prov)}</select></td>
      <td data-label="Área / Uso">${type==='floreria'
        ? `<select class="form-input" onchange="updC('${type}',${i},'sector',this.value)" style="min-width:140px">${getAreaUsoOpts(r.sector)}</select>`
        : `<input class="form-input" value="${esc(r.sector)}" onchange="updC('${type}',${i},'sector',this.value)" style="min-width:110px">`}
        ${_compraEventosBtn(type,i,r)}</td>
      <td data-label="Estado">
        <select class="form-select" onchange="updC('${type}',${i},'estado',this.value);updateKpiCompras()" style="min-width:120px">
          <option value="pedido" ${r.estado!=='recibido'?'selected':''}>📝 Pedido</option>
          <option value="recibido" ${r.estado==='recibido'?'selected':''}>📦 Recibido</option>
        </select>
      </td>
      <td data-label="Stock actual" style="vertical-align:middle">${getStockBadge(r.prod)}</td>
      <td class="compra-row-acciones" style="white-space:nowrap">
        <button class="btn-secondary" style="font-size:10px;padding:3px 7px;margin-right:4px" onclick="generarOrdenCompra(${i},'${type==='floreria'?'flore':'jard'}')" title="Generar Orden de Compra">📄 OC</button>
        <button class="btn-icon" style="color:var(--red-alert)" onclick="delC('${type}',${i})">✕</button>
      </td>
    </tr>`;
    });
  });
  tbody.innerHTML = html;

  if(type==='floreria') renderCompraAlert();
}

function renderCompraAlert(){
  const alertEl=document.getElementById('compra-floreria-alert');
  if(alertEl){
    const crits=stockData.filter(s=>getAlerta(s)==='comprar');
    alertEl.innerHTML=crits.length?`<div class="alert-banner" style="margin-bottom:16px">🔴 <strong>${crits.length} producto${crits.length>1?'s':''} con stock crítico:</strong> ${crits.map(s=>esc(s.prod)).join(', ')}. Consideralos para el próximo pedido.</div>`:'';
  }
}

function clearCompraExtraFilters(type){
  const p = type==='floreria' ? 'cf' : 'cj';
  const provSel = document.getElementById(p+'-filter-prov');
  const areaSel = document.getElementById(p+'-filter-area');
  const desdeInp = document.getElementById(p+'-filter-desde');
  const hastaInp = document.getElementById(p+'-filter-hasta');
  const recibInp = document.getElementById(p+'-filter-recibidos');
  const eventoSel = document.getElementById(p+'-filter-evento');
  if(provSel) provSel.value = '';
  if(areaSel) areaSel.value = '';
  if(desdeInp) desdeInp.value = '';
  if(hastaInp) hastaInp.value = '';
  if(recibInp) recibInp.checked = false;
  if(eventoSel) eventoSel.value = '';
  renderCompras(type);
}

function _histIds(type){
  return type==='jardineria'
    ? { btn:'hist-compras-jard-btn', bar:'hist-compras-jard-filterbar', search:'hist-compras-jard-search', prov:'hist-compras-jard-prov', summary:'hist-compras-jard-summary', wrap:'historial-compras-jard-wrap' }
    : { btn:'hist-compras-btn', bar:'hist-compras-filterbar', search:'hist-compras-search', prov:'hist-compras-prov', summary:'hist-compras-summary', wrap:'historial-compras-wrap' };
}

function toggleHistorialCompras(type='floreria'){
  const ids = _histIds(type);
  const wrap = document.getElementById(ids.wrap);
  if(!wrap) return;
  const visible = wrap.style.display !== 'none';
  wrap.style.display = visible ? 'none' : '';
  const bar = document.getElementById(ids.bar);
  if(bar) bar.style.display = visible ? 'none' : 'flex';
  document.getElementById(ids.btn).textContent = visible ? '📚 Ver historial de pedidos recibidos' : '📚 Ocultar historial';
  if(!visible) renderHistorialCompras(type);
}

function renderHistorialCompras(type='floreria'){
  const ids = _histIds(type);
  const arr = getArr(type);
  const wrap = document.getElementById(ids.wrap);
  if(!wrap) return;

  const todosRecibidos = arr.filter(r => r.estado === 'recibido');

  // Poblar el filtro de proveedores del historial
  const provSel = document.getElementById(ids.prov);
  if(provSel){
    const provActual = provSel.value;
    const provs = [...new Set(todosRecibidos.filter(r=>r.prov).map(r=>r.prov))].sort((a,b)=>a.localeCompare(b,'es'));
    provSel.innerHTML = '<option value="">Todos los proveedores</option>' + provs.map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('');
    provSel.value = provActual;
  }

  // Aplicar filtros de proveedor y búsqueda de producto
  const fProv = document.getElementById(ids.prov)?.value || '';
  const q = (document.getElementById(ids.search)?.value || '').trim().toLowerCase();
  let recibidos = todosRecibidos;
  if(fProv) recibidos = recibidos.filter(r => r.prov === fProv);
  if(q) recibidos = recibidos.filter(r => (r.prod||'').toLowerCase().includes(q));

  // Resumen del proveedor filtrado
  const summEl = document.getElementById(ids.summary);
  if(summEl){
    if(fProv && recibidos.length){
      const totalProv = recibidos.reduce((s,r)=>s+_compraImporte(r),0);
      const nPedidos = new Set(recibidos.map(r=>r.fecha).filter(Boolean)).size;
      summEl.style.display = '';
      summEl.innerHTML = `<strong>${esc(fProv)}</strong> · ${recibidos.length} ítem${recibidos.length!==1?'s':''} en ${nPedidos} pedido${nPedidos!==1?'s':''} · total <strong>$${totalProv.toLocaleString('es-AR')}</strong>`;
    } else { summEl.style.display = 'none'; summEl.innerHTML = ''; }
  }

  if(!recibidos.length){
    wrap.innerHTML = `<div style="text-align:center;padding:24px;color:var(--mid-gray)">${todosRecibidos.length ? 'Sin resultados para el filtro aplicado.' : 'No hay pedidos recibidos en el historial.'}</div>`;
    return;
  }

  // Agrupar por fecha
  const byDate = {};
  recibidos.forEach(r => {
    const d = r.fecha || 'sin-fecha';
    if(!byDate[d]) byDate[d] = [];
    byDate[d].push(r);
  });
  const fechas = Object.keys(byDate).sort((a,b) => b.localeCompare(a));

  let html = '';
  fechas.forEach(fecha => {
    const items = byDate[fecha];
    const totalBloque = items.reduce((s,r) => s + _compraImporte(r), 0);
    const metaExtra = type==='floreria'
      ? ' · ' + items.reduce((s,r) => s + (+r.totalVaras||+r.qty||0), 0) + ' varas'
      : ' · ' + items.reduce((s,r) => s + _compraCant(r), 0) + ' unidades';

    html += `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;margin-bottom:12px;overflow:hidden">
      <div style="background:#F4F1EC;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <strong style="font-size:14px;color:#1A1A1A">📦 Pedido del ${fecha!=='sin-fecha' ? fmtDate(fecha) : 'sin fecha'}</strong>
          <span style="color:#7A7A72;font-size:12px;margin-left:10px">${items.length} ítem${items.length!==1?'s':''}${metaExtra}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-weight:600;color:#1A1A1A;font-size:13px">${totalBloque ? '$'+totalBloque.toLocaleString('es-AR') : ''}</span>
          <button class="btn-secondary" style="font-size:11px;padding:4px 10px" onclick="copiarBloquePedido('${type}','${fecha}')" title="Copiar este pedido con fecha de hoy">📋 Copiar pedido</button>
        </div>
      </div>
      <div style="overflow-x:auto;-webkit-overflow-scrolling:touch">${type==='floreria' ? _histTablaFloreria(items) : _histTablaJardineria(items)}</div>
    </div>`;
  });

  wrap.innerHTML = html;
}

// Selector de evento para un renglón del historial. Solo se muestra en los
// renglones cuya área es "Evento" (o que ya tengan un evento asociado), para
// poder linkear esa compra con la rentabilidad del evento.
function _histEventoSelector(type, idx, r){
  if(r.anulado) return '';
  const esEvento = (r.sector||'').toLowerCase().includes('evento') || r.eventoId || (Array.isArray(r.eventos)&&r.eventos.length);
  if(!esEvento) return '';
  return _compraEventosBtn(type, idx, r);
}

// Tabla del historial de Florería (concepto de varas por paquete y costo por vara)
function _histTablaFloreria(items){
  return `<table style="width:100%;min-width:900px;font-size:12px;border-collapse:collapse">
        <thead><tr style="background:#FAF8F4">
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:10px">Producto</th>
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:10px">Proveedor</th>
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:10px">Área</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:10px">Paq</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:10px">Varas/paq</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:10px">Total varas</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:10px">Control</th>
          <th style="padding:6px 10px;text-align:right;color:var(--mid-gray);font-size:10px">Precio x paq</th>
          <th style="padding:6px 10px;text-align:right;color:var(--mid-gray);font-size:10px">Importe</th>
          <th style="padding:6px 10px;text-align:right;color:var(--mid-gray);font-size:10px">Costo/vara</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:10px"></th>
        </tr></thead>
        <tbody>${items.map(r => { const idx = comprasFlore.indexOf(r); const an = !!r.anulado; const rowStyle = an ? 'border-top:1px solid #F0EDE8;opacity:.5' : 'border-top:1px solid #F0EDE8'; const cvDiv = parseFloat(r.varasPorPaq)||parseFloat(r.totalVaras)||parseFloat(r.qty)||0; const cvVal = (parseMoney(r.costo)>0 && cvDiv>0) ? Math.round(parseMoney(r.costo)/cvDiv) : null; return `<tr style="${rowStyle}">
          <td style="padding:6px 10px;font-weight:500;${an?'text-decoration:line-through':''}">${esc(r.prod)}</td>
          <td style="padding:6px 10px;color:var(--mid-gray)">${esc(r.prov||'—')}</td>
          <td style="padding:6px 10px;color:var(--mid-gray)">${esc(r.sector||'—')}${_histEventoSelector('floreria',idx,r)}</td>
          <td style="padding:6px 10px;text-align:center"><input class="form-input" type="number" value="${esc(r.paqRecibidos ?? r.qty ?? '')}" onchange="updHistCantCompra('floreria',${idx},'paqRecibidos',this.value)" style="width:55px;text-align:center" ${an?'disabled':''}></td>
          <td style="padding:6px 10px;text-align:center"><input class="form-input" type="number" value="${esc(r.varasPorPaq ?? '')}" onchange="updHistCantCompra('floreria',${idx},'varasPorPaq',this.value)" style="width:55px;text-align:center" ${an?'disabled':''}></td>
          <td style="padding:6px 10px;text-align:center;font-weight:600">${r.totalVaras||r.qty||'—'}</td>
          <td style="padding:6px 10px;text-align:center">${an ? '<span style="font-size:9px;font-weight:700;background:#7A7A72;color:#fff;padding:2px 7px;border-radius:5px;white-space:nowrap">🚫 Anulado</span>' : controlBadgeCompra(r)}</td>
          <td style="padding:6px 10px;text-align:right"><input class="form-input" value="${esc(r.costo||'')}" placeholder="$" onchange="updHistCostoCompra('floreria',${idx},this.value)" style="width:90px;text-align:right" ${an?'disabled':''}></td>
          <td style="padding:6px 10px;text-align:right;font-weight:600">${parseMoney(r.costo)>0?'$'+_compraImporte(r).toLocaleString('es-AR'):'<span style="color:var(--mid-gray);font-weight:400">—</span>'}</td>
          <td style="padding:6px 10px;text-align:right;font-weight:700;color:var(--sage-dark)">${cvVal!=null?'$'+cvVal.toLocaleString('es-AR'):'<span style="color:var(--mid-gray);font-weight:400">—</span>'}</td>
          <td style="padding:6px 10px;text-align:center;white-space:nowrap"><button class="btn-secondary" style="font-size:10px;padding:3px 8px" onclick="toggleAnularCompra('floreria',${idx})">${an?'↩️ Reactivar':'🚫 Anular'}</button></td>
        </tr>`; }).join('')}</tbody>
      </table>`;
}

// Tabla del historial de Jardinería / General (productos por unidad, sin varas)
function _histTablaJardineria(items){
  return `<table style="width:100%;min-width:720px;font-size:12px;border-collapse:collapse">
        <thead><tr style="background:#FAF8F4">
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:10px">Producto</th>
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:10px">Descripción</th>
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:10px">Proveedor</th>
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:10px">Área / Uso</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:10px">Cantidad</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:10px">Control</th>
          <th style="padding:6px 10px;text-align:right;color:var(--mid-gray);font-size:10px">Precio unit.</th>
          <th style="padding:6px 10px;text-align:right;color:var(--mid-gray);font-size:10px">Importe</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:10px"></th>
        </tr></thead>
        <tbody>${items.map(r => { const idx = comprasJard.indexOf(r); const an = !!r.anulado; const rowStyle = an ? 'border-top:1px solid #F0EDE8;opacity:.5' : 'border-top:1px solid #F0EDE8'; return `<tr style="${rowStyle}">
          <td style="padding:6px 10px;font-weight:500;${an?'text-decoration:line-through':''}">${esc(r.prod)}</td>
          <td style="padding:6px 10px;color:var(--mid-gray)">${esc(r.desc||'—')}</td>
          <td style="padding:6px 10px;color:var(--mid-gray)">${esc(r.prov||'—')}</td>
          <td style="padding:6px 10px;color:var(--mid-gray)">${esc(r.sector||'—')}${_histEventoSelector('jardineria',idx,r)}</td>
          <td style="padding:6px 10px;text-align:center"><input class="form-input" type="number" value="${esc(r.paqRecibidos ?? r.qty ?? '')}" onchange="updHistCantCompra('jardineria',${idx},'paqRecibidos',this.value)" style="width:60px;text-align:center" ${an?'disabled':''}></td>
          <td style="padding:6px 10px;text-align:center">${an ? '<span style="font-size:9px;font-weight:700;background:#7A7A72;color:#fff;padding:2px 7px;border-radius:5px;white-space:nowrap">🚫 Anulado</span>' : controlBadgeCompra(r)}</td>
          <td style="padding:6px 10px;text-align:right"><input class="form-input" value="${esc(r.costo||'')}" placeholder="$" onchange="updHistCostoCompra('jardineria',${idx},this.value)" style="width:90px;text-align:right" ${an?'disabled':''}></td>
          <td style="padding:6px 10px;text-align:right;font-weight:600">${parseMoney(r.costo)>0?'$'+_compraImporte(r).toLocaleString('es-AR'):'<span style="color:var(--mid-gray);font-weight:400">—</span>'}</td>
          <td style="padding:6px 10px;text-align:center;white-space:nowrap"><button class="btn-secondary" style="font-size:10px;padding:3px 8px" onclick="toggleAnularCompra('jardineria',${idx})">${an?'↩️ Reactivar':'🚫 Anular'}</button></td>
        </tr>`; }).join('')}</tbody>
      </table>`;
}

// Insignia de control post-recepción: compara lo pedido vs. lo efectivamente recibido.
// La orden queda "recibida" en el stock pero permanece editable acá (no se cierra),
// para que Compras pueda cargar el precio de compra real una vez que llega la factura,
// corregir cantidades, o anularla si fue un error.
function controlBadgeCompra(r){
  const qty = parseFloat(r.qty) || 0;                                            // paquetes pedidos
  const recibido = (r.paqRecibidos != null && r.paqRecibidos !== '') ? (parseFloat(r.paqRecibidos) || 0) : qty; // recibidos
  const fn = n => n%1===0 ? n : (+n).toFixed(1);
  const diff = +(recibido - qty).toFixed(1);
  const base = 'font-size:10px;font-weight:600;padding:3px 8px;border-radius:6px;display:inline-block;line-height:1.4;white-space:nowrap';
  const info = `Pedí ${fn(qty)} · Llegó ${fn(recibido)}`;
  if(diff === 0){
    return `<span style="${base};background:#EBF5E8;color:#2C6B3A">✅ ${info}</span>`;
  }
  const detalle = diff < 0 ? `faltan ${fn(-diff)}` : `sobran ${fn(diff)}`;
  const colores = diff < 0 ? 'background:#FCEBEA;color:#B0281B' : 'background:#FDF3E3;color:#8A5A16';
  return `<span style="${base};${colores}">⚠️ ${info} · ${detalle}</span>`;
}

// Recalcula el costo por vara en el cotizador a partir del costo y el divisor
// (varas por paquete, o cantidad si no aplica) de una orden ya controlada.
function recalcCotizadorPrecio(order){
  const costoTotal = parseMoney(order.costo);
  const divisor = parseFloat(order.varasPorPaq) || parseFloat(order.qty) || 0;
  if(costoTotal > 0 && divisor > 0){
    cotizadorPrecios[order.prod] = Math.round(costoTotal / divisor);
    fbSave('cotizadorPrecios', cotizadorPrecios);
  }
}

// Permite corregir el precio de compra de una orden ya controlada/recibida
// (por ej. cuando llega la factura con el precio real) sin reabrir el pedido
// ni tocar el stock ya ingresado. Recalcula el costo por vara del cotizador
// para que los costos de arreglos y la Rentabilidad por área queden al día.
function updHistCostoCompra(type, idx, val){
  const order = getArr(type)[idx];
  if(!order) return;
  order.costo = val;
  if(type==='floreria') recalcCotizadorPrecio(order);
  if(type==='floreria'){ window._comprasFloreLastSave = Date.now(); fbSave('comprasFlore', comprasFlore); }
  else { window._comprasJardLastSave = Date.now(); fbSave('comprasJard', comprasJard); }
  showToast('💰 Precio de compra actualizado' + (type==='floreria' ? ' — costos de arreglos recalculados' : ''));
  renderHistorialCompras(type);
}

// Corrige la cantidad recibida (paquetes o varas/paquete) de una orden ya
// controlada, solo a fines de que las métricas de costos sean exactas —
// NO reajusta el stock ya ingresado (se hace manualmente en Gestión de Stock
// si hace falta).
function updHistCantCompra(type, idx, field, val){
  const order = getArr(type)[idx];
  if(!order) return;
  order[field] = Math.max(0, parseFloat(val) || 0);
  const paqRec = parseFloat(order.paqRecibidos) || 0;
  const varasPaq = parseFloat(order.varasPorPaq) || 0;
  if(paqRec > 0 && varasPaq > 0) order.totalVaras = paqRec * varasPaq;
  if(type==='floreria') recalcCotizadorPrecio(order);
  if(type==='floreria'){ window._comprasFloreLastSave = Date.now(); fbSave('comprasFlore', comprasFlore); }
  else { window._comprasJardLastSave = Date.now(); fbSave('comprasJard', comprasJard); }
  renderHistorialCompras(type);
}

// Anula/reactiva una orden ya controlada: queda excluida de los totales de
// costos, márgenes y Rentabilidad por área (para métricas reales), pero el
// stock ya ingresado no se toca automáticamente.
async function toggleAnularCompra(type, idx){
  const order = getArr(type)[idx];
  if(!order) return;
  if(!order.anulado){
    if(!await confirmModal(`¿Anular el pedido "${order.prod}" del ${fmtDate(order.fecha)}?\n\nSe excluirá de costos y métricas, pero el stock ya ingresado no se modifica.`)) return;
    order.anulado = true;
  } else {
    order.anulado = false;
  }
  if(type==='floreria'){ window._comprasFloreLastSave = Date.now(); fbSave('comprasFlore', comprasFlore); }
  else { window._comprasJardLastSave = Date.now(); fbSave('comprasJard', comprasJard); }
  showToast(order.anulado ? '🚫 Pedido anulado — excluido de costos y métricas' : '↩️ Pedido reactivado');
  renderHistorialCompras(type);
}

async function copiarBloquePedido(type, fecha){
  const arr = getArr(type);
  // Tomar todos los ítems de esa fecha (incluyendo recibidos, para replicar el pedido completo)
  const bloque = arr.filter(r => r.fecha === fecha);
  if(!bloque.length){ showToast('⚠️ No se encontraron ítems para esa fecha'); return; }
  if(!await confirmModal('¿Copiar el pedido del ' + fmtDate(fecha) + ' (' + bloque.length + ' ítems) con fecha de hoy?\nPodés modificar cantidades después.')) return;
  // Clonar cada ítem con fecha de hoy y estado 'pedido'
  const nuevos = bloque.map(r => ({
    fecha: TODAY_ISO,
    pedidopor: r.pedidopor || '—',
    prod: r.prod,
    desc: r.desc || '',
    qty: r.qty,
    costo: r.costo || '',
    prov: r.prov || '',
    sector: r.sector || '',
    estado: 'pedido'
  }));
  // Agregar al inicio del array
  nuevos.forEach(n => arr.unshift(n));
  fbSave(type==='floreria' ? 'comprasFlore' : 'comprasJard', arr);
  renderCompras(type);
  showToast('📋 Pedido copiado con ' + nuevos.length + ' ítems · fecha de hoy · ajustá lo que necesites');
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPRA POR EVENTO — cuánto comprar según composiciones + varas por paquete
// Toma las composiciones (varas de cada flor por arreglo) y las varas por paquete
// registradas en Compras para convertir las varas necesarias en paquetes a comprar.
// ══════════════════════════════════════════════════════════════════════════════
let ceRows = [];

// Varas por paquete de un producto: se toma el valor más reciente cargado en
// Compras Florería (varasPorPaq). Devuelve null si no hay dato.
function getVarasPorPaq(prod){
  const pl = String(prod||'').trim().toLowerCase();
  let best = null, bestFecha = '';
  (comprasFlore||[]).forEach(c=>{
    if(String(c.prod||'').trim().toLowerCase() !== pl) return;
    const vpp = parseFloat(c.varasPorPaq);
    if(!vpp || vpp<=0) return;
    const f = c.fecha||'';
    if(best===null || f >= bestFecha){ best = vpp; bestFecha = f; }
  });
  return best;
}

// Último precio de compra (por paquete) de un producto, del pedido más reciente
// cargado en Compras Florería. Devuelve {precio, fecha} o null si no hay dato.
function getUltimoPrecioCompra(prod){
  const pl = String(prod||'').trim().toLowerCase();
  let best = null, bestFecha = '';
  (comprasFlore||[]).forEach(c=>{
    if(String(c.prod||'').trim().toLowerCase() !== pl) return;
    const m = parseMoney(c.costo);
    if(!m || m<=0) return;
    const f = c.fecha||'';
    if(best===null || f >= bestFecha){ best = m; bestFecha = f; }
  });
  return best===null ? null : { precio: best, fecha: bestFecha };
}

function renderCompraEvento(){
  // Poblar selector de eventos pendientes que tengan arreglos cargados
  // (los finalizados no se listan: ya no se compra para ellos)
  const sel = document.getElementById('ce-evento');
  if(sel){
    const cur = sel.value;
    const evs = (eventosData||[]).map((ev,i)=>({ev,i}))
      .filter(o=>o.ev.arreglos?.length && o.ev.estado !== 'Pedidos Finalizados')
      .sort((a,b)=>(b.ev.fecha||'').localeCompare(a.ev.fecha||''));
    sel.innerHTML = '<option value="">— Elegí un evento (opcional) —</option>' +
      evs.map(({ev,i})=>`<option value="${i}">${esc(ev.nombre||'(evento)')}${ev.fecha?' · '+fmtDate(ev.fecha):''}</option>`).join('');
    sel.value = cur;
  }
  if(!ceRows.length) ceRows = [{arreglo:'', qty:1}];
  ceRenderRows();
  ceRender();
}

function ceRenderRows(){
  const cont = document.getElementById('ce-rows');
  if(!cont) return;
  if(!ceRows.length) ceRows = [{arreglo:'', qty:1}];
  const nombres = [...new Set((recetasData||[]).map(r=>r.nombre))];
  cont.innerHTML = ceRows.map((row,i)=>{
    const opts = nombres.map(n=>`<option value="${esc(n)}"${n===row.arreglo?' selected':''}>${arregloEmoji(n)} ${esc(n)}</option>`).join('');
    return `<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
      <select onchange="ceSet(${i},'arreglo',this.value)" style="flex:2;min-width:180px;border:1px solid #E4E2DC;border-radius:6px;padding:7px 9px;font-family:'DM Sans',sans-serif;font-size:13px;outline:none">
        <option value="">— Tipo de arreglo —</option>${opts}
      </select>
      <span style="font-size:12px;color:var(--mid-gray)">×</span>
      <input type="number" min="1" value="${esc(row.qty)}" onchange="ceSet(${i},'qty',this.value)" style="width:70px;border:1px solid #E4E2DC;border-radius:6px;padding:7px 6px;font-size:13px;text-align:center;outline:none;font-family:'DM Sans',sans-serif">
      <button type="button" class="btn-icon" style="color:var(--red-alert)" onclick="ceRemoveRow(${i})" title="Quitar">✕</button>
    </div>`;
  }).join('');
}

function ceSet(i, field, val){
  if(!ceRows[i]) return;
  ceRows[i][field] = field==='qty' ? (+val||0) : val;
  ceRender();
}
function ceAddRow(){ ceRows.push({arreglo:'', qty:1}); ceRenderRows(); ceRender(); }
function ceRemoveRow(i){ ceRows.splice(i,1); if(!ceRows.length) ceRows=[{arreglo:'',qty:1}]; ceRenderRows(); ceRender(); }
function ceReset(){ ceRows=[{arreglo:'',qty:1}]; const s=document.getElementById('ce-evento'); if(s) s.value=''; ceRenderRows(); ceRender(); }
function ceLoadEvento(evIdx){
  if(evIdx===''||evIdx==null){ return; }
  const ev = (eventosData||[])[+evIdx];
  if(!ev){ return; }
  const arr = (ev.arreglos||[]).filter(a=>a.arreglo && a.qty>0);
  if(!arr.length){ showToast('⚠️ Ese evento no tiene arreglos cargados'); return; }
  ceRows = arr.map(a=>({arreglo:a.arreglo, qty:+a.qty||1}));
  ceRenderRows();
  ceRender();
}

function ceRender(){
  const out = document.getElementById('ce-resultado');
  if(!out) return;
  const rows = ceRows.filter(r=>r.arreglo && r.qty>0);
  const impact = calcStockImpact(rows); // { prod: varas necesarias }
  const prods = Object.keys(impact).sort((a,b)=>a.localeCompare(b,'es'));
  if(!prods.length){
    out.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--mid-gray)">
      <div style="font-size:36px;margin-bottom:8px">🧮</div>
      <div style="font-size:14px">Agregá arreglos y cantidades para ver cuánto comprar.</div></div>`;
    return;
  }

  const filas = prods.map(prod=>{
    const varas = +impact[prod].toFixed(2);
    const vpp = getVarasPorPaq(prod);
    const paquetes = vpp ? Math.ceil(varas / vpp) : null;
    const vppStr = vpp!=null ? vpp : '<span style="color:var(--red-alert)">sin dato</span>';
    const paqStr = paquetes!=null
      ? `<strong style="font-size:15px">${paquetes}</strong>`
      : '<span style="color:var(--red-alert)" title="Cargá las varas por paquete en Compras Florería">—</span>';
    return `<tr style="border-top:1px solid #F0EDE8">
      <td style="padding:8px 12px;font-weight:500">${esc(prod)}</td>
      <td style="padding:8px 12px;text-align:center">${varas%1===0?varas:varas.toFixed(1)}</td>
      <td style="padding:8px 12px;text-align:center;color:var(--mid-gray)">${vppStr}</td>
      <td style="padding:8px 12px;text-align:center">${paqStr}</td>
    </tr>`;
  }).join('');

  // Resumen "Comprar" (solo los que tienen paquetes calculables)
  const compra = prods.map(prod=>{
    const vpp = getVarasPorPaq(prod);
    if(!vpp) return null;
    const paquetes = Math.ceil((+impact[prod]) / vpp);
    return { prod, paquetes };
  }).filter(Boolean);
  const faltantes = prods.filter(prod=>!getVarasPorPaq(prod));

  const compraStr = compra.map(c=>`${c.paquetes} ${esc(c.prod)}`).join(' · ');

  out.innerHTML = `
    <div style="background:#EBF5E8;border:1px solid #C6E0BE;border-radius:12px;padding:16px 18px;margin-bottom:16px">
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#2C6B3A;font-weight:600;margin-bottom:8px">🛒 Comprar</div>
      ${compra.length
        ? `<div style="font-size:16px;color:#1A1A1A;line-height:1.7">${compra.map(c=>`<strong>${c.paquetes}</strong> ${esc(c.prod)}`).join(' &nbsp;·&nbsp; ')}</div>`
        : '<div style="font-size:13px;color:var(--mid-gray)">Ningún producto tiene varas por paquete cargadas en Compras todavía.</div>'}
      ${faltantes.length ? `<div style="font-size:12px;color:var(--red-alert);margin-top:8px">⚠️ Sin varas por paquete (cargalas en Compras Florería): ${faltantes.map(esc).join(', ')}</div>` : ''}
      ${compra.length ? `<button class="btn-secondary" style="font-size:12px;margin-top:12px" onclick="ceCopiar()">📋 Copiar lista</button>` : ''}
    </div>
    <div class="table-wrapper">
      <table style="width:100%;border-collapse:collapse;font-size:13px;background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;overflow:hidden">
        <thead><tr style="background:#FAF8F4">
          <th style="padding:9px 12px;text-align:left;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Producto</th>
          <th style="padding:9px 12px;text-align:center;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Varas necesarias</th>
          <th style="padding:9px 12px;text-align:center;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Varas x paquete</th>
          <th style="padding:9px 12px;text-align:center;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Paquetes a comprar</th>
        </tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>
    <div style="font-size:11px;color:var(--mid-gray);margin-top:10px">Las varas necesarias salen de las composiciones (Comercial › Composiciones). Las varas por paquete se toman del último valor cargado en Compras Florería.</div>`;
  window._ceCompra = compra;
}

function ceCopiar(){
  const compra = window._ceCompra || [];
  if(!compra.length){ showToast('Nada para copiar'); return; }
  const txt = 'Comprar:\n' + compra.map(c=>`- ${c.paquetes} ${c.prod}`).join('\n');
  (navigator.clipboard?.writeText(txt) || Promise.reject()).then(
    ()=>showToast('📋 Lista copiada'),
    ()=>showToast('No se pudo copiar')
  );
}

function toggleProvManager(){
  const b = document.getElementById('prov-manager-body');
  if(b) b.style.display = b.style.display==='none' ? 'block' : 'none';
  renderProvTags();
}

function renderProvTags(){
  const el = document.getElementById('prov-tags');
  if(!el) return;
  el.innerHTML = proveedoresList.map((p,i)=>`
    <span style="display:inline-flex;align-items:center;gap:6px;background:var(--cream);border:1px solid var(--light-gray);border-radius:4px;padding:4px 10px;font-size:12px">
      ${p}
      <span style="cursor:pointer;color:var(--red-alert);font-size:14px;line-height:1" onclick="delProveedor(${i})">×</span>
    </span>`).join('');
}

function addProveedor(){
  const inp = document.getElementById('prov-new-input');
  const val = inp.value.trim();
  if(!val || proveedoresList.includes(val)) return;
  proveedoresList.push(val);
  proveedoresList.sort((a,b)=>a.localeCompare(b));
  inp.value = '';
  fbSave('proveedoresList', proveedoresList);
  renderProvTags();
  populateProvSelects();
  showToast('✅ Proveedor agregado: ' + val);
}

async function delProveedor(i){
  if(!await confirmModal('¿Eliminar proveedor "'+proveedoresList[i]+'"?')) return;
  proveedoresList.splice(i,1);
  fbSave('proveedoresList', proveedoresList);
  renderProvTags();
  populateProvSelects();
}

function populateProvSelects(){
  ['cf-proveedor','cj-proveedor'].forEach(id=>{
    const sel = document.getElementById(id);
    if(!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">— Seleccionar —</option>' + getProvOpts(cur);
  });
}

function updC(type,i,field,val){
  const order = getArr(type)[i];
  const prevEstado = order.estado;
  order[field] = val;

  // AUTO-STOCK: al marcar como "recibido" por primera vez → actualizar stock
  if(field==='estado' && val==='recibido' && prevEstado!=='recibido'){
    const qty = parseFloat(order.qty)||0;
    if(qty>0 && order.prod){
      const prodLower = order.prod.toLowerCase();
      let matched = false;

      // Buscar en stock existente
      stockData.forEach(s=>{
        if(s.prod.toLowerCase().includes(prodLower) || prodLower.includes(s.prod.toLowerCase())){
          s.actual = +Math.max(0,(s.actual+qty)).toFixed(1);
          matched = true;
        }
      });

      if(!matched){
        // No existe en stock → agregar nuevo ítem automáticamente
        stockData.push({
          prod: order.prod,
          area: order.sector || 'Sin área',
          min: 1,
          max: Math.max(qty * 2, 4),
          actual: qty
        });
        showToast('📦 Nuevo producto agregado al stock: ' + order.prod);
      } else {
        showToast('✅ Stock actualizado: +' + qty + ' ' + order.prod);
      }

      // Banner en página de stock si está visible
      const alertEl = document.getElementById('stock-alert-area');
      if(alertEl){
        alertEl.innerHTML = `<div class="alert-banner green">📦 <strong>${esc(order.prod)}</strong> recibido — se ${matched?'agregaron <strong>'+qty+'</strong> unidades al stock existente':'creó un nuevo ítem en stock con <strong>'+qty+'</strong> unidades'}.</div>`;
        setTimeout(()=>{ if(alertEl && alertEl.children[0]) alertEl.removeChild(alertEl.children[0]); renderStock(); }, 5000);
      }

      // Re-render stock si está abierto
      if(document.getElementById('page-stock').classList.contains('active')) renderStock();
      if(document.getElementById('page-compras-floreria').classList.contains('active')) renderCompras('floreria');
    }
  }
  window._comprasFloreLastSave = Date.now(); fbSave('comprasFlore', comprasFlore);
  window._comprasJardLastSave = Date.now(); fbSave('comprasJard', comprasJard);
  // Re-render para actualizar subtotales de bloque y KPIs
  renderCompras(type);
}

function showToast(msg, type){
  const COLORS = { info:'var(--sage-dark)', success:'#4A7A3A', error:'var(--red-alert)', warn:'#9A6A1E' };
  let t = document.getElementById('global-toast');
  if(!t){
    t = document.createElement('div');
    t.id='global-toast';
    document.body.appendChild(t);
  }
  t.style.cssText='position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:'+(COLORS[type]||COLORS.info)+';color:white;padding:12px 24px;border-radius:12px;font-size:13px;font-family:"Jost",sans-serif;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.25);transition:opacity .4s;max-width:min(90vw,420px);text-align:center;line-height:1.4;white-space:pre-line;';
  t.textContent=msg;
  t.style.opacity='1';
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>{ t.style.opacity='0'; }, type==='error'?5000:3500);
}
async function delC(type,i){
  if(!await confirmModal('¿Eliminar esta orden?')) return;
  getArr(type).splice(i,1);
  // Persistir la eliminación (antes no se guardaba: la orden reaparecía al refrescar)
  if(type==='floreria'){ window._comprasFloreLastSave = Date.now(); fbSave('comprasFlore', comprasFlore); }
  else { window._comprasJardLastSave = Date.now(); fbSave('comprasJard', comprasJard); }
  renderCompras(type);
  updateKpiCompras();
}
function updateKpiCompras(){
  const pend=[...comprasFlore,...comprasJard].filter(c=>c.estado!=='recibido').length;
  const el=document.getElementById('kpi-compras-pend');
  if(el) el.textContent=pend;
}

// ════════════════════════════════════════
// DATA — EVENTOS COMERCIAL (bidirectional with Kanban)
// ════════════════════════════════════════
let eventosData = [];

const ESTADO_COLORS={
  'Pedidos Pendientes':'background:#E8E4DC;color:#4A4A4A',
  'En Proceso':'background:#EBF0E8;color:#4A5C3E',
  'Pendiente de Colocacion':'background:#FDF0E8;color:#A05A2C',
  'Pendiente de Retiro':'background:#EFE8F8;color:#5A3E8A',
  'Confirmado':'background:#EBF5E8;color:#5A8A4A',
  'Pedidos Finalizados':'background:#E8F0F8;color:#2C5A80'
};

function renderHistorialEventos(){
  const search = (document.getElementById('hist-ev-search')?.value||'').toLowerCase();
  const tipoSel = document.getElementById('hist-ev-tipo');
  const tipo = tipoSel?.value||'';

  // Poblar filtro de tipos dinámicamente
  if(tipoSel){
    const cur = tipoSel.value;
    const allTipos = [...new Set(eventosData.map(e=>e.tipo).filter(Boolean))].sort();
    tipoSel.innerHTML = '<option value="">Todos los tipos</option>' + allTipos.map(t => `<option${t===cur?' selected':''}>${esc(t)}</option>`).join('');
  }

  const hechos = eventosData.filter(ev => ev.estado === 'Pedidos Finalizados' || ev.estado === 'Confirmado');
  const filtered = hechos.filter(ev=>{
    const matchSearch = !search || ev.nombre?.toLowerCase().includes(search) || evZonasLabel(ev).toLowerCase().includes(search) || ev.organizador?.toLowerCase().includes(search);
    const matchTipo   = !tipo   || ev.tipo === tipo;
    return matchSearch && matchTipo;
  });

  // KPIs
  const kpisEl = document.getElementById('hist-ev-kpis');
  if(kpisEl){
    const totalPax    = hechos.reduce((s,e)=>s+(+e.pax||0),0);
    const tiposUniq   = [...new Set(hechos.map(e=>e.tipo).filter(Boolean))].length;
    kpisEl.innerHTML = `
      <div class="card"><div class="card-label">Total eventos finalizados</div><div class="card-value" style="font-size:32px">${hechos.length}</div></div>
      <div class="card"><div class="card-label">Total pax acumulado</div><div class="card-value" style="font-size:32px">${totalPax}</div></div>
      <div class="card"><div class="card-label">Tipos de evento</div><div class="card-value" style="font-size:32px">${tiposUniq}</div></div>`;
  }

  const tbody = document.getElementById('hist-ev-body');
  if(!tbody) return;

  if(filtered.length === 0){
    tbody.innerHTML = '<tr><td colspan="8" style="padding:24px;text-align:center;color:var(--mid-gray)">'+
      (hechos.length===0 ? 'Aún no hay eventos finalizados.' : 'Sin resultados para los filtros aplicados.')+'</td></tr>';
    return;
  }

  // Sort by fecha desc
  const sorted = [...filtered].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));

  tbody.innerHTML = sorted.map((ev,_i)=>{
    const realIdx = eventosData.indexOf(ev);
    const arreglosStr = ev.arreglos?.length
      ? ev.arreglos.map(a=>`${a.qty}× ${esc(a.arreglo)}`).join(' · ')
      : '<span style="color:var(--mid-gray)">—</span>';
    return `<tr style="cursor:pointer" onclick="openEventoDetail(${realIdx})">
      <td style="font-weight:600;font-size:13px">${esc(ev.nombre||'')}</td>
      <td style="font-size:13px">${ev.organizador?esc(ev.organizador):'<span style="color:var(--mid-gray)">—</span>'}</td>
      <td><span class="badge badge-tipo">${esc(ev.tipo||'—')}</span></td>
      <td style="font-size:12px;color:var(--mid-gray)">${ev.fecha?fmtDate(ev.fecha):'—'}</td>
      <td style="font-size:13px">${esc(evZonasLabel(ev))}</td>
      <td style="text-align:center;font-size:13px">${ev.pax||'—'}</td>
      <td style="font-size:12px;color:var(--charcoal)">${arreglosStr}</td>
      <td style="font-weight:600;font-size:13px;color:#2E7D32">${esc(ev.precio||'—')}</td>
    </tr>`;
  }).join('');
}

// ════════════════════════════════════════
// COTIZADOR
// ════════════════════════════════════════
const COT_FLORES_LIST = [
  'Achilea','Aganpanto','Amaranto','Alelíes','Alstroemerias','Anemonas','Aster','Azucena',
  'Biznaga','Botoncito','Calas','Calitas mini','Cardos azules','Carqueja - Fede',
  'Caspia blanca','Celosia','Cera','Clavel rojo','Colsa','Conejitos','Copetes',
  'Cresta de gallo','Crisantemo fideo','Crisantemo Otome','Delfinium','Dianthus',
  'Eupatorium','Espuela de caballero','Flor azul','Fresias','Gerberas','Girasol',
  'Gloriosa','Gladiolos','Gonfrena','Green balls','Gypsophila Nacional','Gypsophila Importada',
  'Hipericum','Hortensias','Iris Violeta','Jazmines','Junquillo','Lilium Perfumado','Liliums',
  'Limonium','Lino','Lisianthus','Margaritas','Mini Margaritas','Marimonias','Melilotus',
  'Mini Gerberas','Moa','Molucela','Narcisos','Nardo','Naviza','Ojito de Perdiz','Organza',
  'Ornithogalum','Paico','Penacho','Peonias','Proteas','Repollo Comun','Repollo Especial',
  'Rosas Importadas','Rosas Nacionales','Rositas Spray','Sakura','San Vicentes','Scabiosa',
  'Statice','Solidago','Sorgo','Strelitzia','Mini Statice','Tulipanes','Trachelium',
  'Vidensauria','Zinnia'
];
const COT_FOLLAJE_LIST = [
  'Aguaribay','Abelia','Azarero Nana','Azarero Disciplinado','Aspidistra','Calistemo',
  'Buxus','Eucaliptus hoja alargada','Eucaliptus mini','Flor de humo','Formio','Hiedra',
  'Cycas','Fotiña','Kalaguala','Laurentino','Leptospermu','Laurel','Roble','Helecho plumoso',
  'Magnolia','Nigricans','Olea variegada','Ondulatum','Claveles','Monsteras','Eucaliptus',
  'Centaura (flor azul)','Pitosporum Maggi','Hibiscus','Ligustro (frutos)','Craspedia',
  'Suculentas','Orquideas Phaleanopsis','Orquideas Cymbidium','Azaleas','liriope variegado',
  'Heliconias','Cola de zorro'
];
const COT_ALL = [
  ...COT_FLORES_LIST.map(n=>({n, c:'flores'})),
  ...COT_FOLLAJE_LIST.map(n=>({n, c:'follaje'}))
];

let cotizadorPrecios = {};
let cotizadorConfig  = {margen: 30};
window._setCotizadorPrecios = v => { cotizadorPrecios = v; };
window._setCotizadorConfig  = v => { cotizadorConfig = v; };
let cotizadorCarrito = [];
let cotCarritoOps    = [];
let cotCurTab = 'cotizar';

// ── Cotizador Ops (floristas) ─────────────────────────────────────────────────
function renderCotizadorOps(){
  const search = (document.getElementById('cot-ops-search')?.value||'').toLowerCase();
  // Solo mostrar lo que está en stock (actual > 0)
  const enStock = stockData
    .map((s,i) => ({ n: s.prod, actual: s.actual, area: s.area, _si: i }))
    .filter(s => s.actual > 0);
  const list = search ? enStock.filter(f=>f.n.toLowerCase().includes(search)) : enStock;
  const grid   = document.getElementById('cot-ops-grid');
  if(!grid) return;

  const margen = cotizadorConfig?.margen ?? 30;

  if(enStock.length === 0){
    grid.innerHTML = '<div style="color:var(--mid-gray);font-size:13px;padding:16px 0;text-align:center">No hay ítems con stock disponible. Los productos aparecen acá automáticamente al confirmar la recepción de pedidos.</div>';
    return;
  }
  if(!list.length){
    grid.innerHTML = '<div style="color:var(--mid-gray);font-size:13px;padding:8px 0">Sin resultados para "'+esc(search)+'"</div>';
    return;
  }
  grid.innerHTML = list.map(f => {
    const costo      = cotizadorPrecios[f.n] || 0;
    const pFinal     = Math.round(costo*(1+margen/100));
    const precioTxt  = pFinal > 0
      ? `<span style="color:var(--sage-dark);font-weight:600">$${pFinal.toLocaleString('es-AR')}/vara</span>`
      : '<em style="color:var(--mid-gray);font-size:10px">sin precio</em>';
    return `<div style="background:var(--cream);border-radius:8px;padding:9px 12px;display:flex;align-items:center;gap:8px">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:var(--charcoal);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.n)}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
          <span style="font-size:10px;background:#EBF0E8;color:var(--green-ok);padding:1px 6px;border-radius:8px;font-weight:600">${f.actual} uds</span>
          ${precioTxt}
        </div>
      </div>
      <input type="number" id="cotops_${f._si}" value="1" min="1"
        style="width:48px;padding:4px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:center;font-family:inherit">
      <button onclick="cotAgregarOpsStock(${f._si})"
        style="background:var(--green-ok);color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">
        + Agregar
      </button>
    </div>`;
  }).join('');
  // Composiciones (bochita, cuenco, etc.)
  renderComposicionesCot();
  // Productos de Lista de Precios (floreros, etc.)
  renderLPenCotizador();
}

function renderComposicionesCot(){
  const wrap = document.getElementById('cot-ops-comp-wrap');
  if(!wrap) return;
  if(!recetasData.length){ wrap.innerHTML = ''; return; }
  const margen = cotizadorConfig?.margen ?? 30;
  const search = (document.getElementById('cot-ops-search')?.value||'').toLowerCase();
  const comps = search ? recetasData.filter(r => r.nombre.toLowerCase().includes(search)) : recetasData;
  if(!comps.length){ wrap.innerHTML = ''; return; }

  wrap.innerHTML = `<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:8px;font-weight:500">🫙 Composiciones</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px">${comps.map(r => {
      const ri = recetasData.indexOf(r);
      const costoBase = calcCostoComposicion(r);
      const pFinal = Math.round(costoBase*(1+margen/100));
      const emoji = arregloEmoji(r.nombre);
      return `<div style="background:var(--cream);border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--charcoal)">${emoji} ${esc(r.nombre)}</div>
          <div style="font-size:10px;color:var(--mid-gray);margin-top:2px">${r.ings.map(g=>g.qty+' '+g.prod).join(', ')}</div>
          <div style="font-size:12px;color:var(--sage-dark);font-weight:600;margin-top:3px">${pFinal > 0 ? '$'+pFinal.toLocaleString('es-AR') : 'sin precio'}</div>
        </div>
        <input type="number" id="cotops_comp_${ri}" value="1" min="1"
          style="width:48px;padding:4px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:center;font-family:inherit">
        <button onclick="cotAgregarComposicionOps(${ri})"
          style="background:var(--green-ok);color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">
          + Agregar
        </button>
      </div>`;
    }).join('')}</div>`;
}

function cotAgregarComposicionOps(ri){
  const r = recetasData[ri];
  if(!r) return;
  const qty = Math.max(1, +document.getElementById('cotops_comp_'+ri)?.value||1);
  const margen = cotizadorConfig?.margen ?? 30;
  const costoBase = calcCostoComposicion(r);
  const precio = Math.round(costoBase*(1+margen/100));
  const emoji = arregloEmoji(r.nombre);
  const nombre = emoji + ' ' + r.nombre;
  const ex = cotCarritoOps.find(c=>c.nombre===nombre);
  if(ex){ ex.qty += qty; }
  else { cotCarritoOps.push({nombre, precio, qty}); }
  renderCarritoOps();
  const el = document.getElementById('cotops_comp_'+ri);
  if(el) el.value = 1;
}

function cotAgregarOpsStock(stockIdx){
  const s      = stockData[stockIdx];
  if(!s) return;
  const qty    = Math.max(1, +document.getElementById('cotops_'+stockIdx)?.value||1);
  const costo  = cotizadorPrecios[s.prod] || 0;
  const margen = cotizadorConfig?.margen ?? 30;
  const precio = Math.round(costo*(1+margen/100));
  const ex     = cotCarritoOps.find(c=>c.nombre===s.prod);
  if(ex){ ex.qty += qty; }
  else   { cotCarritoOps.push({nombre:s.prod, precio, qty}); }
  renderCarritoOps();
  const el = document.getElementById('cotops_'+stockIdx);
  if(el) el.value = 1;
}

// ── FLOREROS DE LISTA DE PRECIOS en cotizador ───────────────────────────────
function renderLPenCotizador(){
  const wrap = document.getElementById('cot-ops-lp-wrap');
  if(!wrap) return;
  // Solo mostrar categorías que contengan "florero" en el nombre
  const cats = listaPreciosData.filter(c => 
    (c.items||[]).length > 0 && c.cat.toLowerCase().includes('florero')
  );
  if(!cats.length){
    wrap.innerHTML = '';
    return;
  }
  wrap.innerHTML = cats.map((cat) => {
    const realCi = listaPreciosData.indexOf(cat);
    const items = cat.items.map((it, ii) => {
      const precio = parseMoney(it.precio);
      return `<div style="background:var(--cream);border-radius:8px;padding:9px 12px;display:flex;align-items:center;gap:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--charcoal);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(it.nombre)}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
            ${it.desc ? `<span style="font-size:10px;color:var(--mid-gray)">${esc(it.desc)}</span>` : ''}
            <span style="font-size:12px;color:var(--sage-dark);font-weight:600">${precio > 0 ? '$'+precio.toLocaleString('es-AR') : ''}</span>
          </div>
        </div>
        <input type="number" id="cotops_lp_${realCi}_${ii}" value="1" min="1"
          style="width:48px;padding:4px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:center;font-family:inherit">
        <button onclick="cotAgregarLP(${realCi},${ii})"
          style="background:var(--green-ok);color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">
          + Agregar
        </button>
      </div>`;
    }).join('');
    return `<div style="margin-bottom:16px">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:8px;font-weight:500">${cat.emoji||'📦'} ${esc(cat.cat)}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px">${items}</div>
    </div>`;
  }).join('');
}

function cotAgregarLP(ci, ii){
  const cat = listaPreciosData[ci];
  const it = cat?.items?.[ii];
  if(!it) return;
  const qty = Math.max(1, +document.getElementById('cotops_lp_'+ci+'_'+ii)?.value||1);
  const precio = parseMoney(it.precio);
  const nombre = (cat.emoji||'') + ' ' + it.nombre;
  const ex = cotCarritoOps.find(c=>c.nombre===nombre);
  if(ex){ ex.qty += qty; }
  else { cotCarritoOps.push({nombre, precio, qty}); }
  renderCarritoOps();
  const el = document.getElementById('cotops_lp_'+ci+'_'+ii);
  if(el) el.value = 1;
}

function cotRemoveOps(idx){
  cotCarritoOps.splice(idx,1);
  renderCarritoOps();
}

function cotUpdateQtyOps(idx, val){
  cotCarritoOps[idx].qty = Math.max(1,+val||1);
  renderCarritoOps();
}

function renderCarritoOps(){
  const listEl     = document.getElementById('cot-ops-list');
  const emptyEl    = document.getElementById('cot-ops-empty');
  const totalBlock = document.getElementById('cot-ops-total-block');
  if(!listEl) return;

  if(!cotCarritoOps.length){
    listEl.innerHTML = '';
    if(emptyEl)    emptyEl.style.display = '';
    if(totalBlock) totalBlock.style.display = 'none';
    return;
  }
  if(emptyEl)    emptyEl.style.display = 'none';
  if(totalBlock) totalBlock.style.display = '';

  const total = cotCarritoOps.reduce((s,c)=>s+(c.precio*c.qty),0);
  listEl.innerHTML = cotCarritoOps.map((c,i)=>{
    const sub = c.precio*c.qty;
    return `<div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--light-gray)">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:var(--charcoal)">${esc(c.nombre)}</div>
        <div style="font-size:11px;color:var(--mid-gray)">$${c.precio.toLocaleString('es-AR')}/vara</div>
      </div>
      <input type="number" min="1" value="${c.qty}"
        style="width:52px;padding:3px 6px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:center;font-family:inherit"
        oninput="cotUpdateQtyOps(${i},this.value)">
      <span style="min-width:80px;text-align:right;font-size:13px;font-weight:600;color:var(--charcoal)">$${sub.toLocaleString('es-AR')}</span>
      <button onclick="cotRemoveOps(${i})"
        style="background:none;border:none;color:var(--mid-gray);cursor:pointer;font-size:18px;padding:0 4px;line-height:1">×</button>
    </div>`;
  }).join('');
  document.getElementById('cot-ops-total').textContent = '$'+total.toLocaleString('es-AR');
}

async function limpiarCarritoOps(){
  if(!cotCarritoOps.length) return;
  if(!await confirmModal('¿Limpiar la selección?')) return;
  cotCarritoOps = [];
  renderCarritoOps();
}

function copiarCotizacionOps(){
  if(!cotCarritoOps.length) return;
  const total  = cotCarritoOps.reduce((s,c)=>s+(c.precio*c.qty),0);
  const lineas = cotCarritoOps.map(c=>`• ${c.nombre} × ${c.qty}  →  $${(c.precio*c.qty).toLocaleString('es-AR')}`).join('\n');
  const texto  = `🌸 Cotización Florería Duhau\n${'─'.repeat(32)}\n${lineas}\n${'─'.repeat(32)}\nTotal: $${total.toLocaleString('es-AR')}`;
  navigator.clipboard.writeText(texto).then(()=>showToast('✅ Cotización copiada al portapapeles'));
}

function cotGuardarMargen(val){
  const margen = Math.max(0, +val||0);
  cotizadorConfig = {...(cotizadorConfig||{}), margen};
  fbSave('cotizadorConfig', cotizadorConfig);
  showToast('✅ Margen actualizado');
}

function setCotTab(tab){
  cotCurTab = tab;
  ['cotizar','eventos','precios'].forEach(t => {
    const btn   = document.getElementById('cot-tab-btn-'+t);
    const panel = document.getElementById('cot-panel-'+t);
    const on = t === tab;
    if(btn){
      btn.style.color = on ? 'var(--green-ok)' : 'var(--mid-gray)';
      btn.style.borderBottom = on ? '2px solid var(--green-ok)' : 'none';
      btn.style.marginBottom = on ? '-2px' : '0';
    }
    if(panel) panel.style.display = on ? '' : 'none';
  });
  if(tab === 'cotizar') renderCotizador();
  else if(tab === 'eventos') renderEvTipos();
  else renderPreciosList();
}

function renderCotizador(){
  const search = (document.getElementById('cot-search')?.value||'').toLowerCase();
  const list = search ? COT_ALL.filter(f=>f.n.toLowerCase().includes(search)) : COT_ALL;
  const grid = document.getElementById('cot-flores-grid');
  if(!grid) return;
  if(!list.length){
    grid.innerHTML = '<div style="color:var(--mid-gray);font-size:13px;padding:8px 0">Sin resultados</div>';
    return;
  }
  grid.innerHTML = list.map(f => {
    const idx = COT_ALL.findIndex(x=>x.n===f.n);
    const precio = cotizadorPrecios[f.n] || 0;
    const badgeBg    = f.c==='flores' ? '#EBF5E8' : '#EEF0F8';
    const badgeColor = f.c==='flores' ? 'var(--green-ok)' : '#4A5FA6';
    const precioTxt  = precio > 0
      ? `$${precio.toLocaleString('es-AR')}/vara`
      : '<em style="color:var(--mid-gray);font-size:10px">sin precio</em>';
    return `<div style="background:var(--cream);border-radius:8px;padding:9px 12px;display:flex;align-items:center;gap:8px">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:var(--charcoal);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f.n)}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;flex-wrap:wrap">
          <span style="font-size:10px;background:${badgeBg};color:${badgeColor};padding:1px 6px;border-radius:8px;font-weight:600;white-space:nowrap">${f.c}</span>
          <span style="font-size:11px">${precioTxt}</span>
        </div>
      </div>
      <input type="number" id="cot_${idx}" value="1" min="1"
        style="width:48px;padding:4px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:center;font-family:inherit">
      <button onclick="cotAgregar(${idx})"
        style="background:var(--green-ok);color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">
        + Agregar
      </button>
    </div>`;
  }).join('');
}

function cotAgregar(cotIdx){
  const f = COT_ALL[cotIdx];
  const qty = Math.max(1, +document.getElementById('cot_'+cotIdx)?.value||1);
  const precio = cotizadorPrecios[f.n] || 0;
  const existing = cotizadorCarrito.find(c=>c.nombre===f.n);
  if(existing){ existing.qty += qty; }
  else { cotizadorCarrito.push({nombre:f.n, precio, qty}); }
  renderCarrito();
  const el = document.getElementById('cot_'+cotIdx);
  if(el) el.value = 1;
}

function cotRemove(idx){
  cotizadorCarrito.splice(idx,1);
  renderCarrito();
}

function cotUpdateQty(idx, val){
  cotizadorCarrito[idx].qty = Math.max(1,+val||1);
  renderCarrito();
}

function renderCarrito(){
  const listEl      = document.getElementById('cot-carrito-list');
  const emptyEl     = document.getElementById('cot-carrito-empty');
  const totalBlock  = document.getElementById('cot-total-block');
  if(!listEl) return;

  if(!cotizadorCarrito.length){
    listEl.innerHTML = '';
    if(emptyEl) emptyEl.style.display = '';
    if(totalBlock) totalBlock.style.display = 'none';
    return;
  }
  if(emptyEl) emptyEl.style.display = 'none';
  if(totalBlock) totalBlock.style.display = '';

  const totalCosto = cotizadorCarrito.reduce((s,c)=>s+(c.precio*c.qty),0);
  const margen = +document.getElementById('cot-margen')?.value||0;
  const precioFinal = Math.round(totalCosto*(1+margen/100));

  listEl.innerHTML = cotizadorCarrito.map((c,i)=>{
    const sub = c.precio*c.qty;
    return `<div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--light-gray)">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:var(--charcoal)">${esc(c.nombre)}</div>
        <div style="font-size:11px;color:var(--mid-gray)">$${c.precio.toLocaleString('es-AR')}/vara</div>
      </div>
      <input type="number" min="1" value="${c.qty}"
        style="width:52px;padding:3px 6px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:center;font-family:inherit"
        oninput="cotUpdateQty(${i},this.value)">
      <span style="min-width:80px;text-align:right;font-size:13px;font-weight:600;color:var(--charcoal)">$${sub.toLocaleString('es-AR')}</span>
      <button onclick="cotRemove(${i})"
        style="background:none;border:none;color:var(--mid-gray);cursor:pointer;font-size:18px;padding:0 4px;line-height:1">×</button>
    </div>`;
  }).join('');

  document.getElementById('cot-total').textContent         = '$'+totalCosto.toLocaleString('es-AR');
  document.getElementById('cot-precio-final').textContent  = '$'+precioFinal.toLocaleString('es-AR');
}

async function limpiarCarrito(){
  if(!cotizadorCarrito.length) return;
  if(!await confirmModal('¿Limpiar el carrito?')) return;
  cotizadorCarrito = [];
  renderCarrito();
}

function copiarCotizacion(){
  if(!cotizadorCarrito.length) return;
  const margen = +document.getElementById('cot-margen')?.value||0;
  const totalCosto  = cotizadorCarrito.reduce((s,c)=>s+(c.precio*c.qty),0);
  const precioFinal = Math.round(totalCosto*(1+margen/100));
  const lineas = cotizadorCarrito.map(c=>`• ${c.nombre} × ${c.qty}  →  $${(c.precio*c.qty).toLocaleString('es-AR')}`).join('\n');
  const texto = `🌸 Cotización Florería Duhau\n${'─'.repeat(32)}\n${lineas}\n${'─'.repeat(32)}\nCosto: $${totalCosto.toLocaleString('es-AR')}\nPrecio final: $${precioFinal.toLocaleString('es-AR')} (margen ${margen}%)`;
  navigator.clipboard.writeText(texto).then(()=>showToast('✅ Cotización copiada al portapapeles'));
}

// ══════════════════════════════════════════════════════════════════════════════
// COTIZACIÓN POR EVENTO (gerencia)
// ══════════════════════════════════════════════════════════════════════════════
let eventoPricing = { tipos: [] };
window._setEventoPricing = v => { eventoPricing = v; };
let evCarrito = [];

function renderEvTipos(){
  const list = document.getElementById('ev-tipos-list');
  if(!list) return;
  if(!eventoPricing.tipos.length){
    list.innerHTML = '<div style="color:var(--mid-gray);font-size:12px;padding:6px 0">No hay tipos de evento. Agregá el primero (ej. Cocktail, Social, Corporativo).</div>';
  } else {
    list.innerHTML = eventoPricing.tipos.map((t,i) => {
      const reglas = t.reglas || [];
      const reglasHtml = reglas.map((r,ri) => `<div style="display:flex;align-items:center;gap:6px;padding:4px 0">
        <span style="font-size:12px;flex:1">${arregloEmoji(r.arreglo)} <strong>${esc(r.arreglo)}</strong> — 1 cada <strong>${r.cadaPax}</strong> personas</span>
        <button class="btn-icon" style="color:var(--red-alert);font-size:10px" onclick="delReglaTipo(${i},${ri})">✕</button>
      </div>`).join('');
      return `<div style="border:1px solid var(--light-gray);border-radius:8px;padding:12px;margin-bottom:8px;background:var(--warm-white)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <input class="form-input" value="${esc(t.nombre)}" onchange="updTipoEvento(${i},'nombre',this.value)" style="flex:1;padding:5px 8px;font-size:13px;font-weight:600" placeholder="Nombre del tipo">
          <div style="display:flex;align-items:center;gap:4px">
            <span style="font-size:10px;color:var(--mid-gray)">Margen:</span>
            <input class="form-input" type="number" value="${t.margen}" min="0" max="500" onchange="updTipoEvento(${i},'margen',+this.value)" style="width:60px;padding:5px;font-size:12px;text-align:center">
            <span style="font-size:11px;color:var(--mid-gray)">%</span>
          </div>
          <button class="btn-icon" style="color:var(--red-alert)" onclick="delTipoEvento(${i})">✕</button>
        </div>
        <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:4px">Arreglos por evento:</div>
        ${reglasHtml || '<div style="font-size:11px;color:var(--mid-gray);padding:4px 0">Sin arreglos configurados</div>'}
        <button class="btn-secondary" onclick="addReglaTipo(${i})" style="font-size:10px;padding:3px 10px;margin-top:4px">+ Agregar arreglo</button>
      </div>`;
    }).join('');
  }
  // Poblar select del cotizador de eventos (gerencia)
  const sel = document.getElementById('ev-cot-tipo');
  if(sel){
    const cur = sel.value;
    sel.innerHTML = '<option value="">— Seleccionar tipo de evento —</option>' +
      eventoPricing.tipos.map((t,i) => `<option value="${i}">${esc(t.nombre)} (${t.margen}%)</option>`).join('');
    sel.value = cur;
  }
  // Poblar select del cotizador Hyatt
  const selH = document.getElementById('ceh-tipo');
  if(selH){
    const cur = selH.value;
    selH.innerHTML = '<option value="">— Seleccionar —</option>' +
      eventoPricing.tipos.map((t,i) => `<option value="${i}">${esc(t.nombre)}</option>`).join('');
    selH.value = cur;
  }
}

async function addReglaTipo(tipoIdx){
  const nombres = recetasData.map(r=>r.nombre);
  const arreglo = await promptModal('Nombre del arreglo (ej. Bochita, Pecera, Cuenco):\n\nDisponibles: ' + nombres.join(', '), { title: 'Agregar regla' });
  if(!arreglo || !arreglo.trim()) return;
  const cadaPax = await promptModal('1 ' + arreglo.trim() + ' cada ¿cuántas personas?', { title: 'Agregar regla', default: '10' });
  if(!cadaPax || +cadaPax <= 0) return;
  if(!eventoPricing.tipos[tipoIdx].reglas) eventoPricing.tipos[tipoIdx].reglas = [];
  eventoPricing.tipos[tipoIdx].reglas.push({ arreglo: arreglo.trim(), cadaPax: +cadaPax });
  fbSave('eventoPricing', eventoPricing);
  renderEvTipos();
}

function delReglaTipo(tipoIdx, reglaIdx){
  eventoPricing.tipos[tipoIdx].reglas.splice(reglaIdx, 1);
  fbSave('eventoPricing', eventoPricing);
  renderEvTipos();
}

async function addTipoEvento(){
  const nombre = await promptModal('Nombre del tipo de evento (ej. Social, Cocktail, Corporativo):', { title: 'Nuevo tipo de evento' });
  if(!nombre || !nombre.trim()) return;
  const margen = await promptModal('Margen de ganancia para este tipo (%):', { title: 'Nuevo tipo de evento', default: '40' });
  eventoPricing.tipos.push({ nombre: nombre.trim(), margen: parseInt(margen)||40 });
  fbSave('eventoPricing', eventoPricing);
  renderEvTipos();
  showToast('🎉 Tipo de evento agregado');
}

function updTipoEvento(i, field, val){
  eventoPricing.tipos[i][field] = val;
  fbSave('eventoPricing', eventoPricing);
  renderEvTipos();
  renderCotEventos();
}

async function delTipoEvento(i){
  if(!await confirmModal('¿Eliminar tipo "'+eventoPricing.tipos[i].nombre+'"?')) return;
  eventoPricing.tipos.splice(i,1);
  fbSave('eventoPricing', eventoPricing);
  renderEvTipos();
}

// Resuelve el costo por vara de un ingrediente de una composición.
// Cuando el ingrediente lista varias opciones separadas por "/" (ej.
// "Conejito / Nardos / Alhelí", porque se usa lo que haya en stock), la clave
// combinada no existe en cotizadorPrecios y el costo daba "sin dato". Acá se
// prueba cada opción y se toma la MÁS CARA con precio cargado, para no
// subvaluar la cotización. Devuelve {pu, fuente, opciones}.
function resolveCotizadorPrecio(prodLabel){
  const label = (prodLabel||'').trim();
  if(!label) return { pu:0, fuente:'', opciones:[] };
  const directo = +cotizadorPrecios[label] || 0;
  if(directo > 0) return { pu:directo, fuente:label, opciones:[label] };
  if(label.includes('/')){
    const opciones = label.split('/').map(s=>s.trim()).filter(Boolean);
    let mejor = null;
    opciones.forEach(op=>{
      const p = +cotizadorPrecios[op] || 0;
      if(p > 0 && (!mejor || p > mejor.pu)) mejor = { pu:p, fuente:op };
    });
    return mejor ? { pu:mejor.pu, fuente:mejor.fuente, opciones } : { pu:0, fuente:'', opciones };
  }
  return { pu:0, fuente:'', opciones:[label] };
}
// Costo por vara (número) de un ingrediente, resolviendo opciones "A / B / C".
function cotizadorPrecioVara(prodLabel){ return resolveCotizadorPrecio(prodLabel).pu; }

// Varas por paquete de un producto, resolviendo opciones "A / B" (toma la de
// la opción que tenga dato cargado en Compras). Devuelve 0 si no hay dato.
function _varasPorPaqResuelto(prodLabel){
  const label = (prodLabel||'').trim();
  if(!label) return 0;
  const directo = getVarasPorPaq(label);
  if(directo) return directo;
  if(label.includes('/')){
    for(const op of label.split('/').map(s=>s.trim())){
      const v = getVarasPorPaq(op);
      if(v) return v;
    }
  }
  return 0;
}
// Cantidad de un ingrediente EXPRESADA EN VARAS. Si la unidad es "paq", se
// multiplica por las varas por paquete (de Compras); si no, ya está en varas.
function _ingVaras(ing){
  const q = +ing.qty || 0;
  if(ing && ing.unidad === 'paq'){
    return q * _varasPorPaqResuelto(ing.prod);
  }
  return q;
}

function calcCostoComposicion(r){
  return r.ings.reduce((s, ing) => s + cotizadorPrecioVara(ing.prod) * _ingVaras(ing), 0);
}

function renderCotEventos(){
  const tipoIdx = document.getElementById('ev-cot-tipo')?.value;
  const contenido = document.getElementById('ev-cot-contenido');
  if(!contenido) return;
  if(tipoIdx === '' || tipoIdx == null){
    contenido.style.display = 'none';
    return;
  }
  contenido.style.display = '';
  const tipo = eventoPricing.tipos[+tipoIdx];
  if(!tipo) return;
  const margen = tipo.margen || 0;
  const search = (document.getElementById('ev-cot-search')?.value||'').toLowerCase();

  const grid = document.getElementById('ev-cot-grid');
  if(!grid) return;

  let html = '';

  // ── COMPOSICIONES ──
  const comps = recetasData.filter(r => !search || r.nombre.toLowerCase().includes(search) || r.ings.some(g=>g.prod.toLowerCase().includes(search)));
  if(comps.length){
    html += `<div style="grid-column:1/-1;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--mid-gray);font-weight:500;margin-bottom:-4px">🫙 Composiciones</div>`;
    html += comps.map(r => {
      const ri = recetasData.indexOf(r);
      const costoBase = calcCostoComposicion(r);
      const pFinal = Math.round(costoBase*(1+margen/100));
      const emoji = arregloEmoji(r.nombre);
      const ingsList = r.ings.map(g => `${_fmtCant(g.qty)} ${g.prod}`).join(', ');
      const sinCosto = r.ings.some(g => !cotizadorPrecioVara(g.prod));
      return `<div style="background:var(--cream);border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--charcoal)">${emoji} ${esc(r.nombre)}</div>
          <div style="font-size:10px;color:var(--mid-gray);margin-top:2px;line-height:1.4">${esc(ingsList)}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
            <span style="font-size:11px;color:var(--mid-gray)">costo: $${costoBase.toLocaleString('es-AR')}</span>
            <span style="font-size:12px;color:var(--sage-dark);font-weight:600">→ $${pFinal.toLocaleString('es-AR')}</span>
            ${sinCosto ? '<span style="font-size:9px;color:var(--amber)">⚠️ falta precio</span>' : ''}
          </div>
        </div>
        <input type="number" id="evcot_comp_${ri}" value="1" min="1"
          style="width:48px;padding:4px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:center;font-family:inherit">
        <button onclick="evAgregarComposicion(${ri})"
          style="background:var(--green-ok);color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">
          + Agregar
        </button>
      </div>`;
    }).join('');
  }

  // ── FLORES SUELTAS (para upgrades) ──
  const enStock = stockData
    .map((s,i) => ({ n: s.prod, actual: s.actual, _si: i }))
    .filter(s => s.actual > 0);
  const flores = search ? enStock.filter(f=>f.n.toLowerCase().includes(search)) : enStock;
  if(flores.length){
    html += `<div style="grid-column:1/-1;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--mid-gray);font-weight:500;margin-top:12px;margin-bottom:-4px">🌸 Flores sueltas · upgrades</div>`;
    html += flores.map(f => {
      const costo = cotizadorPrecios[f.n] || 0;
      const pFinal = Math.round(costo*(1+margen/100));
      return `<div style="background:var(--cream);border-radius:8px;padding:9px 12px;display:flex;align-items:center;gap:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--charcoal)">${esc(f.n)}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
            <span style="font-size:10px;background:#EBF0E8;color:var(--green-ok);padding:1px 6px;border-radius:8px;font-weight:600">${f.actual} uds</span>
            <span style="font-size:11px;color:var(--mid-gray)">$${costo.toLocaleString('es-AR')}</span>
            <span style="font-size:12px;color:var(--sage-dark);font-weight:600">→ $${pFinal.toLocaleString('es-AR')}</span>
          </div>
        </div>
        <input type="number" id="evcot_${f._si}" value="1" min="1"
          style="width:48px;padding:4px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:center;font-family:inherit">
        <button onclick="evAgregarFlor(${f._si})"
          style="background:var(--green-ok);color:#fff;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap">
          + Agregar
        </button>
      </div>`;
    }).join('');
  }

  grid.innerHTML = html || '<div style="color:var(--mid-gray);font-size:13px;padding:8px 0">No hay composiciones ni stock disponible.</div>';
  renderEvCarrito();
}

function evAgregarComposicion(ri){
  const r = recetasData[ri];
  if(!r) return;
  const tipoIdx = document.getElementById('ev-cot-tipo')?.value;
  const tipo = eventoPricing.tipos[+tipoIdx];
  if(!tipo) return;
  const qty = Math.max(1, +document.getElementById('evcot_comp_'+ri)?.value||1);
  const costoBase = calcCostoComposicion(r);
  const precio = Math.round(costoBase*(1+tipo.margen/100));
  const emoji = arregloEmoji(r.nombre);
  const nombre = emoji + ' ' + r.nombre;
  const ex = evCarrito.find(c=>c.nombre===nombre);
  if(ex){ ex.qty += qty; }
  else { evCarrito.push({nombre, costo:costoBase, precio, qty, isComposicion:true}); }
  renderEvCarrito();
  const el = document.getElementById('evcot_comp_'+ri);
  if(el) el.value = 1;
}

function evAgregarFlor(stockIdx){
  const s = stockData[stockIdx];
  if(!s) return;
  const tipoIdx = document.getElementById('ev-cot-tipo')?.value;
  const tipo = eventoPricing.tipos[+tipoIdx];
  if(!tipo) return;
  const qty = Math.max(1, +document.getElementById('evcot_'+stockIdx)?.value||1);
  const costo = cotizadorPrecios[s.prod] || 0;
  const precio = Math.round(costo*(1+tipo.margen/100));
  const ex = evCarrito.find(c=>c.nombre===s.prod);
  if(ex){ ex.qty += qty; }
  else { evCarrito.push({nombre:s.prod, costo, precio, qty}); }
  renderEvCarrito();
  const el = document.getElementById('evcot_'+stockIdx);
  if(el) el.value = 1;
}

function renderEvCarrito(){
  const listEl = document.getElementById('ev-carrito-list');
  const emptyEl = document.getElementById('ev-carrito-empty');
  const totalBlock = document.getElementById('ev-total-block');
  if(!listEl) return;
  if(!evCarrito.length){
    listEl.innerHTML = '';
    if(emptyEl) emptyEl.style.display = '';
    if(totalBlock) totalBlock.style.display = 'none';
    return;
  }
  if(emptyEl) emptyEl.style.display = 'none';
  if(totalBlock) totalBlock.style.display = '';

  const tipoIdx = document.getElementById('ev-cot-tipo')?.value;
  const tipo = eventoPricing.tipos[+tipoIdx];
  const margenPct = tipo?.margen || 0;

  const totalCosto = evCarrito.reduce((s,c)=>s+(c.costo*c.qty),0);
  const totalFinal = evCarrito.reduce((s,c)=>s+(c.precio*c.qty),0);
  const margenVal = totalFinal - totalCosto;

  listEl.innerHTML = evCarrito.map((c,i)=>{
    const sub = c.precio*c.qty;
    return `<div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--light-gray)">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:var(--charcoal)">${esc(c.nombre)}</div>
        <div style="font-size:11px;color:var(--mid-gray)">$${c.precio.toLocaleString('es-AR')}/vara × ${c.qty}</div>
      </div>
      <span style="font-size:13px;font-weight:600;min-width:80px;text-align:right">$${sub.toLocaleString('es-AR')}</span>
      <button onclick="evCarrito.splice(${i},1);renderEvCarrito()" style="background:none;border:none;cursor:pointer;color:var(--red-alert);font-size:14px;padding:2px 6px">✕</button>
    </div>`;
  }).join('');

  document.getElementById('ev-cot-costo').textContent = '$'+totalCosto.toLocaleString('es-AR');
  document.getElementById('ev-cot-margen-label').textContent = margenPct;
  document.getElementById('ev-cot-margen-val').textContent = '$'+margenVal.toLocaleString('es-AR');
  document.getElementById('ev-cot-total').textContent = '$'+totalFinal.toLocaleString('es-AR');
}

function copiarCotEvento(){
  if(!evCarrito.length) return;
  const tipoIdx = document.getElementById('ev-cot-tipo')?.value;
  const tipo = eventoPricing.tipos[+tipoIdx];
  const tipoNombre = tipo?.nombre || 'Evento';
  const totalCosto = evCarrito.reduce((s,c)=>s+(c.costo*c.qty),0);
  const totalFinal = evCarrito.reduce((s,c)=>s+(c.precio*c.qty),0);
  const lineas = evCarrito.map(c=>`• ${c.nombre} × ${c.qty}  →  $${(c.precio*c.qty).toLocaleString('es-AR')}`).join('\n');
  const texto = `🎉 Cotización Evento — ${tipoNombre}\n🌸 Florería Duhau · Palacio Duhau\n${'─'.repeat(36)}\n${lineas}\n${'─'.repeat(36)}\nCosto base: $${totalCosto.toLocaleString('es-AR')}\nMargen ${tipo?.margen||0}%: $${(totalFinal-totalCosto).toLocaleString('es-AR')}\nPRECIO FINAL: $${totalFinal.toLocaleString('es-AR')}`;
  navigator.clipboard.writeText(texto).then(()=>showToast('✅ Cotización de evento copiada'));
}

function renderPreciosList(){
  const search = (document.getElementById('cot-search-precios')?.value||'').toLowerCase();
  const filtered = search ? COT_ALL.filter(f=>f.n.toLowerCase().includes(search)) : COT_ALL;
  const el = document.getElementById('cot-precios-list');
  if(!el) return;

  const renderGroup = (items, label, emoji) => {
    if(!items.length) return '';
    const rows = items.map(f=>{
      const allIdx = COT_ALL.findIndex(x=>x.n===f.n);
      const precio = cotizadorPrecios[f.n]||0;
      return `<div style="display:flex;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid var(--light-gray)">
        <div style="flex:1;font-size:13px;color:var(--charcoal)">${esc(f.n)}</div>
        <div style="display:flex;align-items:center;gap:4px">
          <span style="font-size:12px;color:var(--mid-gray)">$</span>
          <input type="number" min="0" value="${precio||''}" placeholder="0"
            style="width:90px;padding:5px 8px;border:1px solid var(--light-gray);border-radius:4px;font-size:13px;text-align:right;font-family:inherit"
            onblur="cotGuardarPrecio(${allIdx},this.value)"
            onkeydown="if(event.key==='Enter')this.blur()">
          <span style="font-size:11px;color:var(--mid-gray)">/vara</span>
        </div>
      </div>`;
    }).join('');
    return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:12px;overflow:hidden;margin-bottom:16px">
      <div style="padding:9px 12px;background:var(--cream);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;color:var(--mid-gray)">${emoji} ${label}</div>
      ${rows}
    </div>`;
  };

  const flores  = filtered.filter(f=>f.c==='flores');
  const follaje = filtered.filter(f=>f.c==='follaje');
  el.innerHTML = renderGroup(flores,'Flores','🌸') + renderGroup(follaje,'Follaje','🌿');
}

function cotGuardarPrecio(cotIdx, val){
  const nombre = COT_ALL[cotIdx].n;
  const precio = Math.max(0, +val||0);
  if(!cotizadorPrecios) cotizadorPrecios = {};
  cotizadorPrecios[nombre] = precio;
  fbSave('cotizadorPrecios', cotizadorPrecios);
  cotizadorCarrito.forEach(c=>{ if(c.nombre===nombre) c.precio=precio; });
  renderCarrito();
  if(cotCurTab==='cotizar') renderCotizador();
}

function renderEventos(){
  const grid=document.getElementById('eventos-grid');
  // Banner si hay eventos sin completar desde operaciones
  const fromOps = eventosData.filter(e=>e.fromKanban && e.estado!=='Pedidos Finalizados');
  const bannerEl = document.getElementById('eventos-kanban-banner');
  if(bannerEl){
    bannerEl.innerHTML = fromOps.length
      ? `<div class="alert-banner green" style="margin-bottom:16px">📋 <strong>${fromOps.length} evento${fromOps.length>1?'s':''} cargado${fromOps.length>1?'s':''} desde Operaciones</strong> — revisá los datos y completá los detalles.</div>`
      : '';
  }
  // Solo mostrar eventos actuales (no finalizados — esos van a Historial)
  const eventosActivos = eventosData.filter(ev => ev.estado !== 'Pedidos Finalizados')
    .sort((a,b) => (a.fecha||'9999-12-31').localeCompare(b.fecha||'9999-12-31') || (a.hora||'').localeCompare(b.hora||''));
  grid.innerHTML=eventosActivos.map((ev)=>{
    const i = eventosData.indexOf(ev);
    const stStyle=ESTADO_COLORS[ev.estado]||'';
    const stOpts=['Pedidos Pendientes','En Proceso','Pendiente de Colocacion','Confirmado','Pedidos Finalizados'].map(o=>`<option value="${o}"${ev.estado===o?' selected':''}>${o}</option>`).join('');
    const fromOpsTag = ev.fromKanban ? '<span style="font-size:10px;background:#E8F0F8;color:#2C5A80;padding:2px 7px;border-radius:4px;font-weight:600;letter-spacing:.5px">DESDE OPERACIONES</span>' : '';
    const arreglosResumen = (ev.arreglos && ev.arreglos.length)
      ? `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
          <span style="font-size:10px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">🌸 Arreglos</span>
          ${ev.arreglos.map(a=>`<span style="background:var(--blush-light);color:#7A3A2A;font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:20px;white-space:nowrap">${a.qty}× ${esc(a.arreglo)}</span>`).join('')}
        </div>`
      : '';
    return `<div class="event-card"${ev.fromKanban?' style="border-left:3px solid #2C5A80"':''}>
      <div class="event-card-header">
        <div style="display:flex;flex-direction:column;gap:4px"><div class="event-name">${esc(ev.nombre)}${badgeDiaRelativa(ev.fecha)}</div>${fromOpsTag}</div>
        <span class="event-type">${esc(ev.tipo)}</span>
      </div>
      <div class="event-details">
        <strong>Fecha:</strong> ${fmtDate(ev.fecha)}${ev.hora?' <strong>·</strong> <strong>Hora:</strong> '+esc(ev.hora):''}<br>
        <strong>Salón:</strong> ${esc(evZonasLabel(ev))}<br>
        ${ev.pax?`<strong>Pax:</strong> ${ev.pax}<br>`:''}
        <strong>Notas:</strong> ${esc(ev.notas)}
      </div>
      ${arreglosResumen}
      <div class="event-footer">
        <div class="event-price">${esc(ev.precio)}</div>
        <div class="event-actions">
          <select class="event-status-sel" style="${stStyle}" onchange="changeEventoEstado(${i},this.value)">${stOpts}</select>
          <button class="btn-icon" title="Ver detalle" onclick="openEventoDetail(${i})">👁</button>
          <button class="btn-icon" onclick="openEventModal(${i})" title="Editar">✏️</button>
          <button class="btn-icon" style="color:var(--red-alert)" onclick="deleteEvento(${i})">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function changeEventoEstado(i,val){
  const prev = eventosData[i]?.estado;
  eventosData[i].estado=val;
  fbSave('eventosData', eventosData);
  syncEventosToKanban();
  fbSave('kanbanData', kanbanData);
  renderEventos();
  renderHome();
  if(document.getElementById('page-eventos-maison')?.classList.contains('active')) renderKanban();
  if(document.getElementById('page-historial-eventos')?.classList.contains('active')) renderHistorialEventos();
  // Descontar stock al confirmar
  const wasConfirmed = prev==='Confirmado'||prev==='Pedidos Finalizados';
  const nowConfirmed = val==='Confirmado'||val==='Pedidos Finalizados';
  if(!wasConfirmed && nowConfirmed && eventosData[i]?.arreglos?.length){
    const descuentos = descontarStockEvento(eventosData[i].arreglos);
    if(descuentos.length>0){
      showToast('📦 Stock descontado al confirmar: '+descuentos.slice(0,3).join(' · '));
      if(document.getElementById('page-stock').classList.contains('active')) renderStock();
    }
  }
}
// openEventModal defined in recetas section
// saveEvent defined in recetas section

async function deleteEvento(i){ if(!await confirmModal('¿Eliminar este evento?')) return; eventosData.splice(i,1); renderEventos(); renderHome(); }

// ── Productividad por operario ────────────────────────────────────────────────
function fmtMin(min){
  if(min<=0) return '0m';
  const h=Math.floor(min/60), m=min%60;
  return h>0 ? `${h}h ${m}m` : `${m}m`;
}

function getProdEmpleado(nombre){
  let desde=null,hasta=null,totalMin=0,elapsed=0,remaining=0,timePct=0,started=false,finished=false;
  let myTotal=0,myDone=0;
  const esJard=isJardinero(nombre);
  const toMin=s=>{ const [h,m]=s.split(':').map(Number); return h*60+m; };
  const now=new Date(), nowMin=now.getHours()*60+now.getMinutes();

  // ── Turno: fichajes reales de florería y/o jardinería (usuarios combinados
  // como Ivan pueden fichar en cualquiera de los dos; se toma el rango completo)
  const fTurno=(window.florTurnos||{})[nombre]?.[TODAY_ISO];
  const jTurno=esJard ? (window.jardHorarios||{})[nombre]?.[TODAY_ISO] : null;
  const horario=(window.horariosData||{})[nombre]?.[TODAY_ISO];
  const reales=[fTurno,jTurno].filter(t=>t?.inicio);
  if(reales.length){
    desde=reales.map(t=>t.inicio).sort()[0];
    const abierto=reales.some(t=>!t.fin);
    started=true;
    if(!abierto){
      hasta=reales.map(t=>t.fin).sort().slice(-1)[0];
      finished=true;
      totalMin=toMin(hasta)-toMin(desde);
      elapsed=totalMin; remaining=0; timePct=100;
    } else {
      finished=false;
      elapsed=Math.max(0,nowMin-toMin(desde));
      const finPlan=horario?.hasta ? toMin(horario.hasta) : null;
      remaining=finPlan!=null ? Math.max(0,finPlan-nowMin) : 0;
      totalMin=finPlan!=null ? finPlan-toMin(desde) : elapsed;
      // Sin fin planificado no se puede calcular el % del turno
      timePct=finPlan!=null && totalMin>0 ? Math.round(elapsed/totalMin*100) : 0;
    }
  } else if(horario?.desde && horario?.hasta){
    // Solo horario planificado (todavía no fichó)
    totalMin=toMin(horario.hasta)-toMin(horario.desde);
    started=nowMin>=toMin(horario.desde);
    finished=nowMin>=toMin(horario.hasta);
    elapsed=Math.max(0,Math.min(nowMin-toMin(horario.desde),totalMin));
    remaining=Math.max(0,toMin(horario.hasta)-nowMin);
    timePct=totalMin>0 ? Math.round(elapsed/totalMin*100) : 0;
    desde=horario.desde; hasta=horario.hasta;
  }

  // ── Tareas: checklist de florería + log de jardinería (se suman ambas
  // fuentes para que a los usuarios combinados les computen todas)
  const day=window.currentDay;
  const dayState=(window.clStateByDay||{})[day]||window.clState||{};
  const resp=dayState.responsable||[], checked=dayState.checked||[];
  const myIdxs=resp.reduce((a,r,i)=>{ if(r===nombre) a.push(i); return a; },[]);
  myTotal+=myIdxs.length;
  myDone+=myIdxs.filter(i=>checked[i]).length;
  if(esJard){
    const logHoy=(window.jardineriaLog||[]).filter(e=>e.fecha===TODAY_ISO && e.quien===nombre);
    myTotal+=logHoy.length;
    myDone+=logHoy.filter(e=>e.horaFin).length;
  }
  const taskPct=myTotal>0 ? Math.round(myDone/myTotal*100) : 0;
  return {desde,hasta,totalMin,elapsed,remaining,timePct,myTotal,myDone,taskPct,started,finished};
}

function getProdFlorista(nombre){ return getProdEmpleado(nombre); }

function _prodCardHTML(nombre, d, full=true){
  if(!d.desde) return `<div class="prod-card prod-equipo-card" style="opacity:.6">
    <div class="prod-equipo-nombre">${esc(nombre)}</div>
    <div class="prod-equipo-sin-turno">Sin turno asignado hoy</div>
  </div>`;
  const taskColor=d.taskPct>=100?'#2C6B3A':d.taskPct>=60?'#D4A820':'var(--red-alert)';
  const timeColor=d.timePct>=100?'var(--red-alert)':d.timePct>=80?'#D4A820':'var(--green-ok)';
  const remStr=d.finished?'Turno finalizado':!d.started?`Empieza a las ${d.desde}`:`${fmtMin(d.remaining)} restantes`;
  const tag=d.taskPct>=100?'prod-tag-done':d.taskPct>=60?'prod-tag-ok':d.taskPct>=30?'prod-tag-warn':'prod-tag-late';
  const tagLabel=d.taskPct>=100?'✓ Todo hecho':d.taskPct>=60?'Buen progreso':d.taskPct>=30?'En curso':'Poco avance';
  if(full) return `<div class="prod-card prod-card-personal">
    <div class="prod-header">
      <div class="prod-nombre">${esc(nombre)}</div>
      <div class="prod-turno">${d.desde} – ${d.hasta}</div>
    </div>
    <div class="prod-bars">
      <div class="prod-bar-row">
        <span class="prod-bar-label">Tareas</span>
        <div class="prod-bar-wrap"><div class="prod-bar-fill" style="width:${d.taskPct}%;background:${taskColor}"></div></div>
        <span class="prod-bar-pct">${d.myDone}/${d.myTotal}</span>
      </div>
      <div class="prod-bar-row">
        <span class="prod-bar-label">Turno</span>
        <div class="prod-bar-wrap"><div class="prod-bar-fill" style="width:${d.timePct}%;background:${timeColor}"></div></div>
        <span class="prod-bar-pct">${d.timePct}%</span>
      </div>
    </div>
    <div class="prod-footer">${remStr}</div>
  </div>`;
  // compact (gerencia)
  return `<div class="prod-equipo-card">
    <div class="prod-equipo-nombre">${esc(nombre)}</div>
    <div class="prod-equipo-turno">${d.desde} – ${d.hasta} · ${remStr}</div>
    <div class="prod-bars">
      <div class="prod-bar-row">
        <span class="prod-bar-label">Tareas</span>
        <div class="prod-bar-wrap"><div class="prod-bar-fill" style="width:${d.taskPct}%;background:${taskColor}"></div></div>
        <span class="prod-bar-pct">${d.myDone}/${d.myTotal}</span>
      </div>
      <div class="prod-bar-row">
        <span class="prod-bar-label">Turno</span>
        <div class="prod-bar-wrap"><div class="prod-bar-fill" style="width:${d.timePct}%;background:${timeColor}"></div></div>
        <span class="prod-bar-pct">${d.timePct}%</span>
      </div>
    </div>
    <span class="prod-tag ${tag}">${tagLabel}</span>
  </div>`;
}

function renderProductividadHome(){
  const el=document.getElementById('home-prod');
  if(!el) return;
  if(userRole==='florista' && floristaNombre){
    el.innerHTML=`<div class="home-dash-card" style="margin-bottom:20px">
      <div class="home-card-title">⏱ Mi Turno Hoy</div>
      ${_prodCardHTML(floristaNombre, getProdFlorista(floristaNombre), true)}
    </div>`;
  } else if(userRole==='gerencia'){
    const nombres=getEmpleadosActivos();
    if(!nombres.length){ el.innerHTML=''; return; }
    const total=nombres.length;
    const conTurno=nombres.filter(n=>{
      if(isJardinero(n) && (window.jardHorarios||{})[n]?.[TODAY_ISO]?.inicio) return true;
      return !!(window.florTurnos||{})[n]?.[TODAY_ISO]?.inicio || !!(window.horariosData||{})[n]?.[TODAY_ISO]?.desde;
    }).length;
    const cards=nombres.map(n=>_prodCardHTML(n,getProdEmpleado(n),false)).join('');
    el.innerHTML=`<div class="home-dash-card" style="margin-bottom:20px">
      <div class="home-card-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>👥 Productividad del Equipo</span>
        <span style="font-size:12px;font-weight:400;color:var(--mid-gray)">${conTurno} de ${total} con turno hoy</span>
      </div>
      <div class="prod-equipo-grid">${cards}</div>
    </div>`;
  } else {
    el.innerHTML='';
  }
}

function renderProductividadCL(){
  const el=document.getElementById('cl-prod-card');
  if(!el){ return; }
  if(userRole==='florista' && floristaNombre){
    el.innerHTML=_prodCardHTML(floristaNombre, getProdFlorista(floristaNombre), true);
  } else {
    el.innerHTML='';
  }
}

// Refrescar productividad cada minuto (actualiza tiempo restante)
setInterval(()=>{
  if(document.getElementById('home-prod')?.innerHTML) renderProductividadHome();
  if(document.getElementById('cl-prod-card')?.innerHTML) renderProductividadCL();
  _checkCierreDia();
  checkRecordatoriosFaseEvento();
  // Re-render del checklist del florista para que la colocación/retiro aparezca
  // sola al llegar la hora (sin recargar).
  if(userRole==='florista' && document.getElementById('page-checklist')?.classList.contains('active')) renderChecklistTable();
}, 60000);

// ══════════════════════════════════════════════════════════════════════════════
// CIERRE DEL DÍA — detalle de asistencia y actividad del equipo (gerencia)
// A las 19hs se genera un resumen de quién asistió y qué hizo cada uno, se guarda
// un snapshot en Firebase (para métricas históricas) y se avisa a gerencia.
// La página "Cierre del Día" lo regenera en vivo para cualquier fecha.
// ══════════════════════════════════════════════════════════════════════════════
let resumenesDiarios = {}; // { 'YYYY-MM-DD': snapshot } — snapshots guardados a las 19hs
window._setResumenesDiarios = v => { resumenesDiarios = (v && typeof v==='object') ? v : {}; if(document.getElementById('page-cierre-dia')?.classList.contains('active')) renderCierreDia(); };

function _hm2min(s){ if(!s||!s.includes(':')) return 0; const [h,m]=s.split(':').map(Number); return (h||0)*60+(m||0); }

// Construye el detalle del día a partir de los datos en memoria (sincronizados).
function generarResumenDiario(fecha){
  const nombres = (typeof getEmpleadosActivos==='function' ? getEmpleadosActivos() : []);
  const dayState = (window.clStateByDay||{})[fecha] || (fecha===window.currentDay ? (window.clState||{}) : {});
  const resp = dayState.responsable||[], checked = dayState.checked||[], actividad = dayState.actividad||[], obs = dayState.obs||[];
  const personas = [], ausentes = [];

  nombres.forEach(nombre => {
    const esJard = typeof isJardinero==='function' && isJardinero(nombre);
    // Turno / asistencia
    const fTurno = (window.florTurnos||{})[nombre]?.[fecha];
    const jTurno = esJard ? (window.jardHorarios||{})[nombre]?.[fecha] : null;
    const horario = (window.horariosData||{})[nombre]?.[fecha];
    const reales = [fTurno, jTurno].filter(t=>t?.inicio);
    let desde=null, hasta=null, horasMin=0, ficho=false, planificado=false;
    if(reales.length){
      ficho = true;
      desde = reales.map(t=>t.inicio).sort()[0];
      const fins = reales.map(t=>t.fin).filter(Boolean).sort();
      hasta = fins.length ? fins[fins.length-1] : null;
      if(desde && hasta) horasMin = Math.max(0, _hm2min(hasta)-_hm2min(desde));
    } else if(horario?.desde){
      planificado = true;
      desde = horario.desde; hasta = horario.hasta || null;
      if(desde && hasta) horasMin = Math.max(0, _hm2min(hasta)-_hm2min(desde));
    }

    // Checklist de florería (tareas asignadas a la persona)
    const checklist = [];
    let tareasTotal = 0, tareasHechas = 0;
    resp.forEach((r,i)=>{
      if(r===nombre){
        tareasTotal++;
        const done = !!checked[i];
        if(done) tareasHechas++;
        const t = (CL_TASKS[i]||{});
        checklist.push({ zona: t.zona||'', sec: t.sec||'', actividad: actividad[i]||t.actividad||'', obs: obs[i]||'', done });
      }
    });

    // Tareas de jardinería del día (log)
    const jardineria = esJard
      ? (window.jardineriaLog||[]).filter(e=>e.fecha===fecha && e.quien===nombre)
          .map(e=>({ task: e.task||e.tarea||e.grupo||'', horaInicio:e.horaInicio||'', horaFin:e.horaFin||'', obs:e.obs||'', done: !!e.horaFin }))
      : [];

    // Eventos del día en los que participó
    const eventos = [];
    (eventosData||[]).filter(ev=>ev.fecha===fecha).forEach(ev=>{
      const roles = [];
      if(ev.asignado===nombre) roles.push('armado');
      if(ev.colocacionAsignado===nombre) roles.push('colocación');
      if(ev.retiroAsignado===nombre) roles.push('retiro');
      if(roles.length) eventos.push({ nombre: ev.nombre||'(evento)', roles, estado: ev.estado||'' });
    });

    // Ventas gestionadas ese día
    const ventas = (ventasData||[]).filter(v=>v.asignado===nombre && v.fecha===fecha)
      .map(v=>({ prod:v.prod||'', cliente:v.cliente||'', estado:v.estado||'' }));

    const actividadTotal = checklist.length + jardineria.length + eventos.length + ventas.length;
    if(ficho || planificado || actividadTotal>0){
      personas.push({ nombre, area: esJard?'Jardinería':'Florería', ficho, planificado, desde, hasta, horasMin,
        tareasHechas, tareasTotal, checklist, jardineria, eventos, ventas, actividadTotal });
    } else {
      ausentes.push(nombre);
    }
  });

  personas.sort((a,b)=> (a.desde||'99:99').localeCompare(b.desde||'99:99') || a.nombre.localeCompare(b.nombre,'es'));
  return { fecha, generadoTs: Date.now(), personas, ausentes };
}

function guardarResumenDiario(fecha, data){
  resumenesDiarios[fecha] = data;
  if(window.fbSetPath) window.fbSetPath('resumenesDiarios/'+fecha, data);
  else fbSave('resumenesDiarios', resumenesDiarios);
}

// Chequeo periódico: a partir de las 19hs (solo en dispositivo de gerencia),
// una vez por día, genera el snapshot y avisa. Dedupe cruzado por el snapshot
// ya presente en Firebase.
let _cierreDiaSesion = '';
function _checkCierreDia(){
  if(userRole !== 'gerencia') return;
  const now = new Date();
  if(now.getHours() < 19) return;
  const fecha = TODAY_ISO;
  if(_cierreDiaSesion === fecha) return;
  if(resumenesDiarios[fecha]?.generadoTs){ _cierreDiaSesion = fecha; return; } // ya generado (por otro dispositivo)
  const data = generarResumenDiario(fecha);
  // Si todavía no cargó el roster/datos, no marcar como hecho: reintentar el próximo minuto
  if(!data.personas.length && !data.ausentes.length) return;
  _cierreDiaSesion = fecha;
  guardarResumenDiario(fecha, data);
  const nPers = data.personas.length;
  window.pushSend?.('📊 Cierre del día', `${nPers} persona${nPers!==1?'s':''} asistieron hoy · mirá el detalle en Reportes › Cierre del Día`, 'cierre-dia', 'roles:gerencia');
  if(document.getElementById('page-cierre-dia')?.classList.contains('active')) renderCierreDia();
}

function initCierreDia(){
  const inp = document.getElementById('cd-fecha');
  if(inp && !inp.value) inp.value = TODAY_ISO;
  renderCierreDia();
}

function renderCierreDia(){
  const cont = document.getElementById('cd-detalle');
  if(!cont) return;
  const fecha = document.getElementById('cd-fecha')?.value || TODAY_ISO;
  let data = generarResumenDiario(fecha);
  // Si no hay datos en vivo (fecha vieja no cargada) pero hay snapshot, usarlo
  if(!data.personas.length && resumenesDiarios[fecha]?.personas?.length){
    data = resumenesDiarios[fecha];
  }

  // KPIs
  const kpisEl = document.getElementById('cd-kpis');
  if(kpisEl){
    const totalPers = data.personas.length;
    const totalHoras = data.personas.reduce((s,p)=>s+(p.horasMin||0),0);
    const tareasHechas = data.personas.reduce((s,p)=>s+(p.tareasHechas||0)+p.jardineria.filter(j=>j.done).length,0);
    const tareasTotal = data.personas.reduce((s,p)=>s+(p.tareasTotal||0)+p.jardineria.length,0);
    const eventosSet = new Set(data.personas.flatMap(p=>p.eventos.map(e=>e.nombre)));
    const ventasN = data.personas.reduce((s,p)=>s+p.ventas.length,0);
    const kpi = (val,lbl)=>`<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:12px;padding:14px 16px">
      <div style="font-size:24px;font-weight:700;color:var(--charcoal)">${val}</div>
      <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-top:2px">${lbl}</div></div>`;
    kpisEl.innerHTML = [
      kpi(totalPers, 'Asistieron'),
      kpi(fmtMin(totalHoras), 'Horas trabajadas'),
      kpi(`${tareasHechas}/${tareasTotal}`, 'Tareas hechas'),
      kpi(eventosSet.size, 'Eventos'),
      kpi(ventasN, 'Ventas'),
    ].join('');
  }

  if(!data.personas.length){
    cont.innerHTML = `<div style="text-align:center;padding:48px 20px;color:var(--mid-gray)">
      <div style="font-size:40px;margin-bottom:10px">🗓️</div>
      <div style="font-size:15px;font-weight:600;color:#7A7A72">Sin asistencia registrada para el ${fmtDate(fecha)}</div>
      <div style="font-size:13px;margin-top:6px">Aparecerá el detalle cuando el equipo fiche su turno o tenga tareas/eventos asignados.</div></div>`;
    return;
  }

  const genLbl = data.generadoTs ? `<div style="font-size:11px;color:var(--mid-gray);margin-bottom:14px">Generado ${new Date(data.generadoTs).toLocaleString('es-AR')}${resumenesDiarios[fecha]?.generadoTs===data.generadoTs?' · snapshot guardado':' · vista en vivo'}</div>` : '';

  cont.innerHTML = genLbl + data.personas.map(p=>{
    const turnoStr = p.desde ? `${p.desde}${p.hasta?' – '+p.hasta:' (en curso)'}` : 'Sin turno fichado';
    const horasStr = p.horasMin ? ` · ${fmtMin(p.horasMin)}` : '';
    const asistTag = p.ficho
      ? '<span style="font-size:10px;font-weight:700;background:#EBF5E8;color:#2C6B3A;padding:2px 8px;border-radius:5px">✓ Fichó</span>'
      : '<span style="font-size:10px;font-weight:700;background:#FDF0E8;color:#B4772A;padding:2px 8px;border-radius:5px">Planificado</span>';

    const checklistHtml = p.checklist.length
      ? `<div style="margin-top:10px"><div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">Checklist · ${p.tareasHechas}/${p.tareasTotal}</div>
          ${p.checklist.map(t=>`<div style="font-size:12.5px;padding:3px 0;color:${t.done?'var(--charcoal)':'#B4772A'}">${t.done?'✓':'○'} <strong>${esc(t.zona||t.sec)}</strong>${t.actividad?' · '+esc(t.actividad):''}${t.obs?` <span style="color:var(--mid-gray)">— ${esc(t.obs)}</span>`:''}</div>`).join('')}</div>`
      : '';

    const jardHtml = p.jardineria.length
      ? `<div style="margin-top:10px"><div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">Jardinería</div>
          ${p.jardineria.map(t=>`<div style="font-size:12.5px;padding:3px 0;color:${t.done?'var(--charcoal)':'#B4772A'}">${t.done?'✓':'○'} ${esc(t.task||'Tarea')}${(t.horaInicio||t.horaFin)?` <span style="color:var(--mid-gray)">(${esc(t.horaInicio||'—')}${t.horaFin?' – '+esc(t.horaFin):''})</span>`:''}${t.obs?` — ${esc(t.obs)}`:''}</div>`).join('')}</div>`
      : '';

    const eventosHtml = p.eventos.length
      ? `<div style="margin-top:10px"><div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">Eventos</div>
          ${p.eventos.map(e=>`<div style="font-size:12.5px;padding:3px 0">🎉 <strong>${esc(e.nombre)}</strong> <span style="color:var(--mid-gray)">· ${e.roles.join(', ')}</span></div>`).join('')}</div>`
      : '';

    const ventasHtml = p.ventas.length
      ? `<div style="margin-top:10px"><div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">Ventas</div>
          ${p.ventas.map(v=>`<div style="font-size:12.5px;padding:3px 0">💐 ${esc(v.prod)}${v.cliente?' · '+esc(v.cliente):''} <span style="color:var(--mid-gray)">(${esc(v.estado)})</span></div>`).join('')}</div>`
      : '';

    const nada = !checklistHtml && !jardHtml && !eventosHtml && !ventasHtml
      ? '<div style="font-size:12.5px;color:var(--mid-gray);margin-top:8px">Sin tareas ni eventos registrados para el día.</div>' : '';

    return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:12px;padding:16px 18px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <strong style="font-size:15px;color:var(--charcoal)">${esc(p.nombre)}</strong>
          <span style="font-size:11px;color:var(--mid-gray)">${esc(p.area)}</span>
          ${asistTag}
        </div>
        <div style="font-size:12.5px;color:var(--mid-gray)">⏱ ${turnoStr}${horasStr}</div>
      </div>
      ${checklistHtml}${jardHtml}${eventosHtml}${ventasHtml}${nada}
    </div>`;
  }).join('') + (data.ausentes.length
    ? `<div style="margin-top:8px;font-size:12.5px;color:var(--mid-gray)"><strong>Sin registro hoy:</strong> ${data.ausentes.map(esc).join(', ')}</div>`
    : '');
}

// ── Fila visual del home de gerencia: anillo, sparkline y semáforo ────────────
function _homeVisualHTML(hechas, totalTareas, pct, ventasMes, totalMes){
  const fmtARS = n => '$' + Math.round(n).toLocaleString('es-AR');

  // Anillo de progreso del checklist
  const C = 2*Math.PI*34;
  const off = (C*(1-Math.min(pct,100)/100)).toFixed(1);
  const ringColor = pct>=100 ? 'var(--green-ok)' : pct>=50 ? '#D4A820' : 'var(--sage)';

  // Sparkline: ventas acumuladas por día del mes
  const diaHoy = Math.max(parseInt(TODAY_ISO.slice(8,10),10), 1);
  const porDia = Array.from({length:diaHoy}, ()=>0);
  ventasMes.forEach(v=>{
    const d = parseInt((v.fecha||'').slice(8,10),10);
    if(d>=1 && d<=diaHoy) porDia[d-1] += parseMoney(v.precio);
  });
  let acum = 0;
  const serie = porDia.map(x => (acum += x));
  const max = Math.max(...serie, 1);
  const W = 220, H = 54;
  const pts = serie.map((v,i)=>`${((i/Math.max(serie.length-1,1))*W).toFixed(1)},${(H-4-(v/max)*(H-12)).toFixed(1)}`).join(' ');
  const areaPts = `0,${H} ${pts} ${W},${H}`;

  // Semáforo: días desde el último Nuevo por zona de arreglos
  const map = mapUltimoNuevoPorZona();
  const zonas = [...new Map(CL_TASKS.filter(t=>String(t.actividad).toLowerCase()!=='riego').map(t=>[_zonaKey(t.sec,t.zona), t])).values()];
  let rojo=0, ambar=0, verde=0; const peores=[];
  zonas.forEach(t=>{
    const f = map[_zonaKey(t.sec,t.zona)];
    const dias = f ? Math.floor((new Date(TODAY_ISO)-new Date(f))/86400000) : null;
    if(dias===null || dias>=7){ rojo++; peores.push({zona:t.zona, dias}); }
    else if(dias>=5) ambar++;
    else verde++;
  });
  peores.sort((a,b)=>(b.dias??999)-(a.dias??999));
  const peoresTxt = peores.slice(0,3).map(p=>`${esc(p.zona)} (${p.dias===null?'nunca':p.dias+'d'})`).join(' · ');

  return `<div class="home-visual-grid">
    <div class="card hv-card card-clickable" onclick="navigate('checklist')">
      <div class="card-label">✅ Progreso del checklist</div>
      <div class="hv-ring-row">
        <svg viewBox="0 0 80 80" class="hv-ring" aria-hidden="true">
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--light-gray)" stroke-width="8"/>
          <circle cx="40" cy="40" r="34" fill="none" stroke="${ringColor}" stroke-width="8" stroke-linecap="round"
            stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off}" transform="rotate(-90 40 40)"/>
          <text x="40" y="46" text-anchor="middle" class="hv-ring-txt">${pct}%</text>
        </svg>
        <div class="hv-sub">${hechas} de ${totalTareas} tareas<br>de hoy completadas</div>
      </div>
    </div>
    <div class="card hv-card card-clickable" onclick="navigate('ventas-externas')">
      <div class="card-label">💰 Ventas acumuladas del mes</div>
      <svg viewBox="0 0 ${W} ${H}" class="hv-spark" preserveAspectRatio="none" aria-hidden="true">
        <polygon points="${areaPts}" fill="var(--sage)" opacity="0.14"/>
        <polyline points="${pts}" fill="none" stroke="var(--sage)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      </svg>
      <div class="hv-sub">${fmtARS(totalMes)} al día ${diaHoy}</div>
    </div>
    <div class="card hv-card card-clickable" onclick="navigate('checklist')">
      <div class="card-label">🌸 Arreglos Nuevos por zona</div>
      <div class="hv-semaforo">
        <span class="hv-sem hv-sem-rojo">${rojo}<small>+7 días<br>o sin registro</small></span>
        <span class="hv-sem hv-sem-ambar">${ambar}<small>5-6<br>días</small></span>
        <span class="hv-sem hv-sem-verde">${verde}<small>al<br>día</small></span>
      </div>
      <div class="hv-sub">${peoresTxt ? '⚠️ ' + peoresTxt : '✓ Todas las zonas al día'}</div>
    </div>
  </div>`;
}

function renderHome(){
  if(!document.getElementById('home-kpis')) return;

  const hoy = TODAY_ISO;
  const mesActual = hoy.slice(0, 7);

  // ── Datos de eventos ──
  const activos = eventosData.filter(e => e.estado !== 'Pedidos Finalizados');
  const eventosHoy = activos.filter(e => e.fecha === hoy);
  const proximos = [...activos].sort((a,b) => (a.fecha||'').localeCompare(b.fecha||'')).slice(0, 8);

  // ── Datos de ventas del mes ──
  const ventasMes = ventasData.filter(v => (v.fecha||'').startsWith(mesActual));
  const totalMes = ventasMes.reduce((s,v) => s + parseMoney(v.precio), 0);
  const confirmadas = ventasMes.filter(v => v.estado === 'confirmado' || v.estado === 'entregado');
  const pendientes = ventasMes.filter(v => v.estado === 'pendiente');
  const recientes = [...ventasMes].sort((a,b) => (b.fecha||'').localeCompare(a.fecha||'')).slice(0, 5);

  // ── Datos de checklist ──
  const checked = Array.isArray(clState?.checked) ? clState.checked : [];
  const totalTareas = CL_TASKS.length;
  const hechas = checked.filter(Boolean).length;
  const pct = totalTareas > 0 ? Math.round(hechas / totalTareas * 100) : 0;
  const pendientesCL = CL_TASKS.filter((_,i) => !checked[i]).slice(0, 5);

  const fmtARS = n => '$' + Math.round(n).toLocaleString('es-AR');
  const recAlerts = jardRecordatorios.filter(r=>recEstado(r)==='vencido'||recEstado(r)==='proximo');

  // ── KPIs ──
  const isFlorHome = userRole !== 'gerencia'; // solo gerencia ve el panel completo (ventas, recordatorios, etc.)
  document.getElementById('home-kpis').innerHTML = `
    <div class="cards-grid cards-grid-4" style="margin-bottom:24px">
      <div class="card card-clickable" onclick="navigate('eventos-maison')">
        <div class="card-label">📅 Eventos Hoy</div>
        <div class="card-value${eventosHoy.length ? '' : ' neutral'}">${eventosHoy.length}</div>
        <div class="card-sub">${eventosHoy.length === 1 ? '1 evento programado' : eventosHoy.length + ' eventos programados'}</div>
      </div>
      <div class="card card-clickable" onclick="navigate('eventos-maison')">
        <div class="card-label">🗂 Eventos Activos</div>
        <div class="card-value">${activos.length}</div>
        <div class="card-sub">sin finalizar</div>
      </div>
      ${!isFlorHome ? `<div class="card card-clickable" onclick="navigate('ventas-externas')">
        <div class="card-label">💰 Ventas del Mes</div>
        <div class="card-value" style="font-size:22px">${fmtARS(totalMes)}</div>
        <div class="card-sub">${ventasMes.length} transacciones</div>
      </div>` : ''}
      <div class="card card-clickable" onclick="navigate('checklist')">
        <div class="card-label">✅ Checklist Hoy</div>
        <div class="card-value${pct===100?' green':''}">${hechas}<span style="font-size:16px;font-weight:400;color:var(--mid-gray)">/${totalTareas}</span></div>
        <div class="card-sub">${pct}% completado</div>
      </div>
      ${recAlerts.length && !isFlorHome ? `<div class="card card-clickable" onclick="navigate('recordatorios-jardineria')" style="border-left:3px solid var(--red-alert)">
        <div class="card-label">🌿 Recordatorios Jardín</div>
        <div class="card-value red">${recAlerts.length}</div>
        <div class="card-sub">${recAlerts.filter(r=>recEstado(r)==='vencido').length} vencido${recAlerts.filter(r=>recEstado(r)==='vencido').length!==1?'s':''} · ${recAlerts.filter(r=>recEstado(r)==='proximo').length} próximo${recAlerts.filter(r=>recEstado(r)==='proximo').length!==1?'s':''}</div>
      </div>` : ''}
    </div>`;

  // ── Fila visual (solo gerencia): anillo, sparkline y semáforo ──
  const visEl = document.getElementById('home-visual');
  if(visEl) visEl.innerHTML = isFlorHome ? '' : _homeVisualHTML(hechas, totalTareas, pct, ventasMes, totalMes);

  // ── Columna Eventos ──
  document.getElementById('home-eventos-col').innerHTML = `
    <div class="home-dash-card">
      <div class="home-dash-card-hdr">
        <div class="home-dash-title">Próximos Eventos</div>
        <button class="btn-secondary" style="padding:5px 12px;font-size:11px" onclick="navigate('eventos-maison')">Ver kanban →</button>
      </div>
      ${proximos.length ? proximos.map(ev => {
        const esHoy = ev.fecha === hoy;
        const st = ev.estado || '';
        const stStyle = ESTADO_COLORS[st] || '';
        return `<div class="home-ev-row" onclick="navigate('eventos-maison')" style="cursor:pointer">
          <div class="home-ev-info">
            <div class="home-ev-nombre">${esc(ev.nombre)}${esHoy ? ' <span class="badge-hoy">HOY</span>' : ''}</div>
            <div class="home-ev-meta">${fmtDate(ev.fecha)}${ev.hora?' · '+esc(ev.hora):''}${ev.tipo?' · '+esc(ev.tipo):''}</div>
          </div>
          <span class="home-ev-estado" style="${stStyle}">${st.replace('Pedidos ','')}</span>
        </div>`;
      }).join('') : '<div class="home-empty">No hay eventos activos</div>'}
    </div>`;

  // ── Columna Ventas (oculta para floristas) ──
  const ventasColEl = document.getElementById('home-ventas-col');
  if(ventasColEl){
    if(isFlorHome){
      ventasColEl.style.display = 'none';
      ventasColEl.innerHTML = '';
    } else {
      ventasColEl.style.display = '';
      ventasColEl.innerHTML = `
    <div class="home-dash-card" style="margin-bottom:16px">
      <div class="home-dash-card-hdr">
        <div class="home-dash-title">Ventas · ${mesActual.split('-').reverse().join('/')}</div>
        <button class="btn-secondary" style="padding:5px 12px;font-size:11px" onclick="navigate('ventas-externas')">Ver →</button>
      </div>
      <div class="home-ventas-stats">
        <div class="home-ventas-stat"><span class="home-ventas-stat-label">Confirmadas</span><span class="home-ventas-stat-val green">${fmtARS(confirmadas.reduce((s,v)=>s+parseMoney(v.precio),0))}</span></div>
        <div class="home-ventas-stat"><span class="home-ventas-stat-label">Pendientes</span><span class="home-ventas-stat-val amber">${fmtARS(pendientes.reduce((s,v)=>s+parseMoney(v.precio),0))}</span></div>
      </div>
      <div class="home-ventas-list">
        ${recientes.map(v => `<div class="home-venta-row">
          <span class="home-venta-prod">${esc(v.prod||'—')}</span>
          <span class="home-venta-precio">${esc(v.precio)}</span>
        </div>`).join('') || '<div class="home-empty">Sin ventas este mes</div>'}
      </div>
    </div>`;
    }
  }

  // ── Columna Checklist ──
  document.getElementById('home-checklist-col').innerHTML = `
    <div class="home-dash-card">
      <div class="home-dash-card-hdr">
        <div class="home-dash-title">Checklist de Hoy</div>
        <button class="btn-secondary" style="padding:5px 12px;font-size:11px" onclick="navigate('checklist')">Ver →</button>
      </div>
      <div class="home-cl-bar-wrap">
        <div class="home-cl-bar"><div class="home-cl-fill" style="width:${pct}%"></div></div>
        <span class="home-cl-pct">${pct}%</span>
      </div>
      <div class="home-cl-tasks">
        ${pct === 100
          ? '<div style="color:var(--sage-dark);font-weight:600;font-size:13px;padding:8px 0">🎉 ¡Todas las tareas completadas!</div>'
          : pendientesCL.map(t => `<div class="home-cl-task">· ${esc(t.zona)} — ${esc(t.actividad||'')}</div>`).join('')
        }
      </div>
    </div>`;
  renderProductividadHome();
}

// ════════════════════════════════════════
// DATA — VENTAS (fully editable inline + new columns)
// ════════════════════════════════════════
let ventasData=[];
let jardRecordatorios=[];
let jardAlertas=[]; // alertas urgentes con foto que carga gerencia para los jardineros
window._setVentasData = (arr) => { ventasData.splice(0, ventasData.length, ...arr); };

const VENTA_ESTADOS=['pendiente','confirmado','entregado'];
const VENTA_ESTADO_LABEL={'pendiente':'⏳ Pendiente','confirmado':'✅ Confirmado','entregado':'🚚 Entregado'};
const VENTA_ESTADO_COLOR={'pendiente':ESTADO_COLORS['Pedidos Pendientes'],'confirmado':ESTADO_COLORS['Confirmado'],'entregado':ESTADO_COLORS['Pedidos Finalizados']};

// Formas de pago canónicas (para el filtro y el cierre de mes)
const VENTA_PAGO_OPTS=[
  {value:'Efectivo',label:'💵 Efectivo'},
  {value:'Tarjeta',label:'💳 Tarjeta'},
  {value:'Transferencia',label:'🏦 Transferencia'},
  {value:'Link de pago',label:'🔗 Link de pago'},
  {value:'Mercado Pago',label:'💙 Mercado Pago'},
  {value:'Cargo a rooms',label:'🏨 Cargo a rooms (hotel)'},
  {value:'Cargo a habitación',label:'🛏 Cargo a habitación (huésped)'},
  {value:'Cuenta corriente',label:'📋 Cuenta corriente'},
];
// Normaliza formas de pago viejas (Débito/Crédito → Tarjeta) para filtrar bien.
function normPago(fp){ return (fp==='Débito'||fp==='Crédito') ? 'Tarjeta' : (fp||''); }

// Costo estimado de una venta: si el producto coincide con una composición
// cargada (recetasData), usa su costo calculado. Devuelve null si no se puede
// estimar (producto suelto sin composición), para no mostrar un margen falso.
function costoVenta(v){
  const nombre = (v?.prod||'').trim().toLowerCase();
  if(!nombre) return null;
  const r = (recetasData||[]).find(x=>(x.nombre||'').trim().toLowerCase()===nombre);
  if(!r) return null;
  const c = calcCostoComposicion(r);
  return (c!=null && isFinite(c) && c>0) ? c : null;
}
// Margen estimado de una venta (precio − costo composición − costo de envío).
// null si no hay costo estimable.
function margenVenta(v){
  const c = costoVenta(v);
  if(c==null) return null;
  return parseMoney(v.precio) - c - parseMoney(v.envioCosto);
}
// Celda <td> de margen para la tabla de ventas. Muestra "—" cuando no hay costo.
function margenCell(v){
  const m = margenVenta(v);
  if(m==null) return '<td style="white-space:nowrap;text-align:center"><span style="color:var(--mid-gray);font-size:11px" title="No hay composición cargada para estimar el costo de este producto">—</span></td>';
  const col = m>=0 ? 'var(--green-ok)' : 'var(--red-alert)';
  return `<td style="white-space:nowrap;text-align:right"><span style="color:${col};font-weight:600;font-size:12px" title="Precio − costo estimado − envío">$${Math.round(m).toLocaleString('es-AR')}</span></td>`;
}
// Grupo de cobranza para el cierre de mes: Cargo a rooms + Cargo a habitación = Hotel.
function grupoCobranza(fp){
  const p = normPago(fp);
  if(p==='Cargo a rooms'||p==='Cargo a habitación') return 'Hotel';
  return p || 'Sin forma de pago';
}
// Filtros activos de Ventas Externas
let ventasFilter={mes:'',pago:'',tipo:''};

function renderVentas(){
  // Banner ítems desde Kanban
  const vkb = document.getElementById('ventas-kanban-banner');
  if(vkb){
    const fromOps = ventasData.filter(v=>v.fromKanban && v.estado==='pendiente');
    vkb.innerHTML = fromOps.length
      ? `<div class="alert-banner" style="background:#E8F0F8;border-color:#B0C8E0;color:#2C5A80">📋 <strong>${fromOps.length} ramo${fromOps.length>1?'s':''} cargado${fromOps.length>1?'s':''} desde Operaciones</strong> — completá precio y cliente.</div>`
      : '';
  }
  // ── Poblar selects de filtro (mes, forma de pago, tipo = descripción de ramo) ──
  const mesSel = document.getElementById('ve-filter-mes');
  const pagoSel = document.getElementById('ve-filter-pago');
  const tipoSel = document.getElementById('ve-filter-tipo');
  if(mesSel){
    const cur = mesSel.value;
    const meses = [...new Set((ventasData||[]).map(v=>(v.fecha||'').slice(0,7)).filter(Boolean))].sort((a,b)=>b.localeCompare(a));
    mesSel.innerHTML = '<option value="">Todos los meses</option>' + meses.map(m=>`<option value="${m}">${fmtMonth(m)}</option>`).join('');
    mesSel.value = cur;
  }
  if(pagoSel && pagoSel.options.length<=1){
    pagoSel.innerHTML = '<option value="">Todas las formas de pago</option>' + VENTA_PAGO_OPTS.map(o=>`<option value="${o.value}">${o.label}</option>`).join('');
  }
  if(tipoSel){
    const cur = tipoSel.value;
    const tipos = [...new Set((ventasData||[]).map(v=>(v.prod||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    tipoSel.innerHTML = '<option value="">Todos los tipos de venta</option>' + tipos.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');
    tipoSel.value = cur;
  }
  const factSel = document.getElementById('ve-filter-fact');
  const fMes = mesSel?.value||'', fPago = pagoSel?.value||'', fTipo = tipoSel?.value||'', fFact = factSel?.value||'';
  ventasFilter = {mes:fMes, pago:fPago, tipo:fTipo, fact:fFact};

  const tbody=document.getElementById('ventas-body');
  let lista = ventasData.map((v,i)=>({v,i})).filter(o=>!(o.v.esPedidoRamo && o.v.estado!=='entregado'));
  if(fMes)  lista = lista.filter(o=>(o.v.fecha||'').startsWith(fMes));
  if(fPago) lista = lista.filter(o=>normPago(o.v.formaPago)===fPago);
  if(fTipo) lista = lista.filter(o=>(o.v.prod||'').trim()===fTipo);
  // Facturado: 'si' = facturadas; 'no' = sin facturar (incluye las que quedaron vacías).
  if(fFact==='si') lista = lista.filter(o=>o.v.facturado==='Sí');
  if(fFact==='no') lista = lista.filter(o=>o.v.facturado!=='Sí');
  lista.sort((a,b)=>(b.v.fecha||'').localeCompare(a.v.fecha||''));

  // Resumen del filtro (cantidad + total)
  const sumEl = document.getElementById('ve-filter-summary');
  if(sumEl){
    // Pendiente de facturar dentro de lo que se está viendo (respeta filtros).
    const pend = lista.filter(o=>o.v.facturado!=='Sí' && parseMoney(o.v.precio)>0);
    const totalPend = pend.reduce((s,o)=>s+parseMoney(o.v.precio),0);
    const pillPend = pend.length
      ? `<span style="background:#FDECEC;color:var(--red-alert);border:1px solid #F0C0C0;border-radius:10px;padding:2px 9px;font-weight:600;font-size:11.5px;white-space:nowrap">🧾 Sin facturar: ${pend.length} · $${totalPend.toLocaleString('es-AR')}</span>`
      : '';
    if(fMes||fPago||fTipo||fFact){
      const total = lista.reduce((s,o)=>s+parseMoney(o.v.precio),0);
      sumEl.innerHTML = `<span style="margin-right:8px"><strong>${lista.length}</strong> venta${lista.length!==1?'s':''} · <strong>$${total.toLocaleString('es-AR')}</strong></span>${pillPend}`;
    } else sumEl.innerHTML = pillPend;
  }

  tbody.innerHTML = lista.map(({v,i})=>`<tr${v.fromKanban?' style="background:rgba(122,154,184,.07)"':''}>
    <td><input class="form-input" value="${esc(v.prod)}" onchange="updV(${i},'prod',this.value)" style="min-width:140px"></td>
    <td><input class="form-input" value="${esc(v.desc)}" onchange="updV(${i},'desc',this.value)" style="min-width:150px" placeholder="Flores, colores..."></td>
    <td><input class="form-input" type="date" value="${esc(v.fecha)}" onchange="updV(${i},'fecha',this.value)" style="min-width:130px"></td>
    <td><input class="form-input" value="${esc(v.cliente)}" onchange="updV(${i},'cliente',this.value)" style="min-width:110px" placeholder="Quien abona"></td>
    <td><input class="form-input" value="${esc(v.destinatario||'')}" onchange="updV(${i},'destinatario',this.value)" style="min-width:110px" placeholder="Quien recibe"></td>
    <td><input class="form-input" value="${esc(v.dedicatoria||'')}" onchange="updV(${i},'dedicatoria',this.value)" style="min-width:130px" placeholder="—"></td>
    <td><input class="form-input" value="${esc(v.precio)}" onchange="updV(${i},'precio',this.value)" style="width:90px"></td>
    ${margenCell(v)}
    <td>
      <select class="form-select" onchange="updV(${i},'formaPago',this.value)" style="min-width:140px;font-size:12px">
        <option value="">—</option>
        <option value="Efectivo" ${v.formaPago==='Efectivo'?'selected':''}>💵 Efectivo</option>
        <option value="Tarjeta" ${v.formaPago==='Tarjeta'||v.formaPago==='Débito'||v.formaPago==='Crédito'?'selected':''}>💳 Tarjeta</option>
        <option value="Transferencia" ${v.formaPago==='Transferencia'?'selected':''}>🏦 Transferencia</option>
        <option value="Link de pago" ${v.formaPago==='Link de pago'?'selected':''}>🔗 Link de pago</option>
        <option value="Mercado Pago" ${v.formaPago==='Mercado Pago'?'selected':''}>💙 Mercado Pago</option>
        <option value="Cargo a rooms" ${v.formaPago==='Cargo a rooms'?'selected':''}>🏨 Cargo a rooms (hotel)</option>
        <option value="Cargo a habitación" ${v.formaPago==='Cargo a habitación'?'selected':''}>🛏 Cargo a habitación (huésped)</option>
        <option value="Cuenta corriente" ${v.formaPago==='Cuenta corriente'?'selected':''}>📋 Cuenta corriente</option>
      </select>
    </td>
    <td>
      <select class="form-select" onchange="updV(${i},'facturado',this.value)" style="min-width:90px;font-size:12px">
        <option value="" ${!v.facturado?'selected':''}>—</option>
        <option value="Sí" ${v.facturado==='Sí'?'selected':''}>✅ Sí</option>
        <option value="No" ${v.facturado==='No'?'selected':''}>❌ No</option>
      </select>
    </td>
    <td>
      <select class="form-select" style="${VENTA_ESTADO_COLOR[v.estado]||''};min-width:130px;font-size:11px;font-weight:600" onchange="updV(${i},'estado',this.value)">
        ${VENTA_ESTADOS.map(s=>`<option value="${s}"${v.estado===s?' selected':''}>${VENTA_ESTADO_LABEL[s]}</option>`).join('')}
      </select>
    </td>
    <td><input class="form-input" value="${esc(v.dir||'')}" onchange="updV(${i},'dir',this.value)" style="min-width:160px" placeholder="Dirección o retira"></td>
    <td>
      <select class="form-select" onchange="updV(${i},'taxiFlete',this.value)" style="min-width:100px;font-size:12px">
        <option value="" ${!v.taxiFlete?'selected':''}>—</option>
        <option value="Taxi" ${v.taxiFlete==='Taxi'?'selected':''}>🚕 Taxi</option>
        <option value="Flete" ${v.taxiFlete==='Flete'?'selected':''}>🚚 Flete</option>
      </select>
      <input class="form-input" value="${esc(v.envioCosto||'')}" onchange="updV(${i},'envioCosto',this.value)" placeholder="$ costo envío" style="width:100px;margin-top:4px;font-size:11px" title="Costo del taxi/flete (para el cierre de mes)">
    </td>
    <td style="white-space:nowrap">
      <button class="btn-icon" onclick="openEditSaleModal(${i})" title="Editar" style="color:var(--sage-dark)">✏️</button>
      <button class="btn-icon" style="color:var(--red-alert)" onclick="delVenta(${i})">✕</button>
    </td>
  </tr>`).join('');
}

function ventasClearFilters(){
  ['ve-filter-mes','ve-filter-pago','ve-filter-tipo','ve-filter-fact'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  renderVentas();
}

// Cierre de mes: resumen de cobranzas del mes agrupado por forma de pago
// (Cargo a rooms + habitación = "Hotel"). Usa el mes filtrado o, si no hay
// ninguno seleccionado, el mes en curso. Muestra un modal con el detalle y
// un botón para copiar el texto (listo para WhatsApp).
function ventasCierreMes(){
  const mes = document.getElementById('ve-filter-mes')?.value || CURR_MONTH;
  const delMes = (ventasData||[]).filter(v =>
    (v.fecha||'').startsWith(mes) && !(v.esPedidoRamo && v.estado!=='entregado'));
  if(!delMes.length){ showToast('No hay ventas en '+fmtMonth(mes)); return; }

  const grupos = {};
  delMes.forEach(v=>{
    const g = grupoCobranza(v.formaPago);
    if(!grupos[g]) grupos[g] = {total:0, count:0};
    grupos[g].total += parseMoney(v.precio);
    grupos[g].count++;
  });
  const orden = ['Efectivo','Tarjeta','Transferencia','Mercado Pago','Link de pago','Hotel','Cuenta corriente','Sin forma de pago'];
  const claves = Object.keys(grupos).sort((a,b)=>{
    const ia = orden.indexOf(a), ib = orden.indexOf(b);
    return (ia<0?99:ia) - (ib<0?99:ib);
  });
  const totalGen = delMes.reduce((s,v)=>s+parseMoney(v.precio),0);

  // Facturación: cuánto se facturó y cuánto quedó pendiente en el mes.
  const factList = delMes.filter(v=>v.facturado==='Sí');
  const factTotal = factList.reduce((s,v)=>s+parseMoney(v.precio),0);
  const pendList = delMes.filter(v=>v.facturado!=='Sí' && parseMoney(v.precio)>0);
  const pendTotal = pendList.reduce((s,v)=>s+parseMoney(v.precio),0);
  // Envíos: gasto total de taxi/flete cargado en el mes y venta neta resultante.
  const enviosTotal = delMes.reduce((s,v)=>s+parseMoney(v.envioCosto),0);
  const enviosCount = delMes.filter(v=>parseMoney(v.envioCosto)>0).length;
  // Ganancia estimada: suma del margen de las ventas con costo estimable.
  const conMargen = delMes.map(margenVenta).filter(m=>m!=null);
  const gananciaTotal = conMargen.reduce((s,m)=>s+m,0);

  const filasHTML = claves.map(g=>`
    <div style="display:flex;justify-content:space-between;align-items:baseline;padding:9px 0;border-bottom:1px solid var(--light-gray)">
      <span>Ventas <strong>${esc(g)}</strong> <span style="color:var(--mid-gray);font-size:11px">· ${grupos[g].count} venta${grupos[g].count!==1?'s':''}</span></span>
      <strong style="white-space:nowrap">Cobrar $${grupos[g].total.toLocaleString('es-AR')}</strong>
    </div>`).join('');

  // Bloque de facturación + envíos (solo se muestra lo que tenga datos).
  const factHTML = `
    <div style="margin-top:14px;padding:12px 14px;background:#FBFAF8;border:1px solid var(--light-gray);border-radius:8px;font-size:13px">
      <div style="display:flex;justify-content:space-between;padding:4px 0"><span>✅ Facturado <span style="color:var(--mid-gray);font-size:11px">· ${factList.length}</span></span><strong>$${factTotal.toLocaleString('es-AR')}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;color:${pendTotal>0?'var(--red-alert)':'inherit'}"><span>🧾 Sin facturar <span style="font-size:11px;opacity:.8">· ${pendList.length}</span></span><strong>$${pendTotal.toLocaleString('es-AR')}</strong></div>
      ${enviosTotal>0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px dashed var(--light-gray);margin-top:4px"><span>🚚 Envíos (taxi/flete) <span style="color:var(--mid-gray);font-size:11px">· ${enviosCount}</span></span><strong style="color:var(--red-alert)">− $${enviosTotal.toLocaleString('es-AR')}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Neto (ventas − envíos)</span><strong>$${(totalGen-enviosTotal).toLocaleString('es-AR')}</strong></div>` : ''}
      ${conMargen.length ? `<div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px dashed var(--light-gray);margin-top:4px"><span>💰 Ganancia estimada <span style="color:var(--mid-gray);font-size:11px">· ${conMargen.length} c/composición</span></span><strong style="color:var(--green-ok)">$${Math.round(gananciaTotal).toLocaleString('es-AR')}</strong></div>` : ''}
    </div>`;

  window._ventasCierreTexto = `📊 Cierre ${fmtMonth(mes)}\n`
    + claves.map(g=>`Ventas ${g}: Cobrar $${grupos[g].total.toLocaleString('es-AR')}`).join('\n')
    + `\n———\nTotal: $${totalGen.toLocaleString('es-AR')} · ${delMes.length} ventas`
    + `\n✅ Facturado: $${factTotal.toLocaleString('es-AR')} (${factList.length})`
    + `\n🧾 Sin facturar: $${pendTotal.toLocaleString('es-AR')} (${pendList.length})`
    + (enviosTotal>0 ? `\n🚚 Envíos: −$${enviosTotal.toLocaleString('es-AR')}\nNeto: $${(totalGen-enviosTotal).toLocaleString('es-AR')}` : '');

  let ov = document.getElementById('ventas-cierre-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='ventas-cierre-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="modal" style="max-width:460px">
    <button class="modal-close" onclick="closeModal('ventas-cierre-modal')">✕</button>
    <div class="modal-title">📊 Cierre de mes · ${fmtMonth(mes)}</div>
    <div style="font-size:12px;color:var(--mid-gray);margin:-6px 0 14px">Cobranzas por forma de pago</div>
    ${filasHTML}
    <div style="display:flex;justify-content:space-between;align-items:baseline;padding:12px 0 0;margin-top:6px;border-top:2px solid var(--charcoal);font-size:17px">
      <span style="font-weight:700">Total</span>
      <strong>$${totalGen.toLocaleString('es-AR')}</strong>
    </div>
    ${factHTML}
    <div class="modal-actions" style="margin-top:18px">
      <button class="btn-secondary" onclick="closeModal('ventas-cierre-modal')">Cerrar</button>
      <button class="btn-add" onclick="ventasCierreCopiar()">📋 Copiar resumen</button>
    </div>
  </div>`;
  ov.classList.add('open');
}
function ventasCierreCopiar(){
  const txt = window._ventasCierreTexto || '';
  (navigator.clipboard?.writeText(txt) || Promise.reject()).then(
    ()=>showToast('📋 Resumen copiado'),
    ()=>showToast('No se pudo copiar')
  );
}

function updV(i,field,val){ ventasData[i][field]=val; fbSave('ventasData',ventasData); sincronizarVentaCaja(i); }

// Si una venta en EFECTIVO queda ENTREGADA, sumarla automáticamente a Control de Caja (una sola vez).
function sincronizarVentaCaja(i){
  const v = ventasData[i];
  if(!v) return;
  if(v.estado === 'entregado' && v.formaPago === 'Efectivo' && !v.cajaRegistrado){
    const monto = parseMoney(v.precio);
    if(monto > 0){
      cajaData.push({
        fecha: v.fecha || TODAY_ISO,
        desc: `Venta: ${v.prod}${v.cliente ? ' — ' + v.cliente : ''}`,
        ticket: '',
        tipo: 'ingreso',
        monto,
        sucursal: v.sucursal || getSucursalId(),
        ventaAuto: true
      });
      v.cajaRegistrado = true;
      fbSave('ventasData', ventasData);
      fbSave('cajaData', cajaData);
      if(document.getElementById('page-caja')?.classList.contains('active')) renderCaja();
      showToast(`💵 $${monto.toLocaleString('es-AR')} sumado a Control de Caja (efectivo)`);
    }
  }
}
window.sincronizarVentaCaja = sincronizarVentaCaja;
function openSaleModal(){
  document.getElementById('sale-modal-title').textContent = 'Nueva Venta';
  document.getElementById('sale-edit-idx').value = '-1';
  document.getElementById('sale-fecha').value=TODAY_ISO;
  ['sale-desc','sale-cliente','sale-destinatario','sale-dedicatoria','sale-precio','sale-dir'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('sale-estado').value='pendiente';
  document.getElementById('sale-pago').value='';
  populateSaleSelects('', '');
  document.getElementById('sale-modal').classList.add('open');
}

function openEditSaleModal(i){
  const v = ventasData[i];
  if(!v) return;
  document.getElementById('sale-modal-title').textContent = 'Editar Venta';
  document.getElementById('sale-edit-idx').value = i;
  populateSaleSelects(v.prod, v.asignado||'');
  document.getElementById('sale-desc').value = v.desc || '';
  document.getElementById('sale-fecha').value = v.fecha || '';
  document.getElementById('sale-cliente').value = v.cliente || '';
  document.getElementById('sale-destinatario').value = v.destinatario || '';
  document.getElementById('sale-dedicatoria').value = v.dedicatoria || '';
  document.getElementById('sale-precio').value = v.precio || '';
  document.getElementById('sale-pago').value = v.formaPago || '';
  document.getElementById('sale-estado').value = v.estado || 'pendiente';
  document.getElementById('sale-dir').value = v.dir || '';
  document.getElementById('sale-modal').classList.add('open');
}

function populateSaleSelects(currentProd, currentAsignado){
  const prodSel = document.getElementById('sale-prod');
  let opts = '<option value="">— Seleccionar —</option>';
  if(recetasData.length){
    opts += '<optgroup label="🫙 Composiciones">';
    recetasData.forEach(r => {
      const costo = calcCostoComposicion(r);
      const margen = cotizadorConfig?.margen ?? 30;
      const precio = Math.round(costo*(1+margen/100));
      opts += `<option value="${esc(r.nombre)}" data-precio="${precio}"${r.nombre===currentProd?' selected':''}>${arregloEmoji(r.nombre)} ${esc(r.nombre)} — $${precio.toLocaleString('es-AR')}</option>`;
    });
    opts += '</optgroup>';
  }
  listaPreciosData.forEach(cat => {
    if(!(cat.items||[]).length) return;
    opts += `<optgroup label="${cat.emoji||'📦'} ${esc(cat.cat)}">`;
    cat.items.forEach(it => {
      opts += `<option value="${esc(it.nombre)}" data-precio="${parseMoney(it.precio)}"${it.nombre===currentProd?' selected':''}>${esc(it.nombre)} — ${esc(it.precio||'A consultar')}</option>`;
    });
    opts += '</optgroup>';
  });
  // Si el producto actual no está en las listas, agregarlo
  if(currentProd && !prodSel){} // skip
  opts += '<option value="__otro__">+ Otro (escribir)</option>';
  prodSel.innerHTML = opts;
  if(currentProd && !prodSel.value){
    const opt = document.createElement('option');
    opt.value = currentProd; opt.textContent = currentProd; opt.selected = true;
    prodSel.insertBefore(opt, prodSel.lastElementChild);
  }

  const asigSel = document.getElementById('sale-asignado');
  if(asigSel){
    const floristas = typeof getFloristasActivos === 'function' ? getFloristasActivos() : CL_RESP_OPTS.filter(n=>n!=='Jardineria');
    asigSel.innerHTML = '<option value="">— Sin asignar —</option>' + floristas.map(n => `<option value="${esc(n)}"${n===currentAsignado?' selected':''}>${esc(n)}</option>`).join('');
  }
}

async function saleAutoFillPrice(){
  const sel = document.getElementById('sale-prod');
  if(sel.value === '__otro__'){
    const custom = await promptModal('Nombre del arreglo o ramo:', { title: 'Otro producto' });
    if(custom && custom.trim()){
      const opt = document.createElement('option');
      opt.value = custom.trim(); opt.textContent = custom.trim(); opt.selected = true;
      sel.insertBefore(opt, sel.lastElementChild);
    } else { sel.value = ''; }
    return;
  }
  const selected = sel.options[sel.selectedIndex];
  const precio = selected?.dataset?.precio;
  if(precio && +precio > 0){
    document.getElementById('sale-precio').value = '$' + (+precio).toLocaleString('es-AR');
  }
}

function addSale(){
  const prod=document.getElementById('sale-prod').value.trim();
  if(!prod || prod === '__otro__') return;
  const estado = document.getElementById('sale-estado').value;
  const asignado = document.getElementById('sale-asignado')?.value || '';
  const editIdx = +document.getElementById('sale-edit-idx').value;

  const venta = {
    prod,
    desc:document.getElementById('sale-desc').value,
    cliente:document.getElementById('sale-cliente').value,
    destinatario:document.getElementById('sale-destinatario').value,
    fecha:document.getElementById('sale-fecha').value||TODAY_ISO,
    dedicatoria:document.getElementById('sale-dedicatoria').value,
    precio:document.getElementById('sale-precio').value||'—',
    formaPago:document.getElementById('sale-pago').value,
    estado,
    dir:document.getElementById('sale-dir').value||'',
    asignado,
    sucursal: getSucursalId(),
  };

  const prevAsignadoVenta = editIdx >= 0 ? (ventasData[editIdx]?.asignado || '') : '';
  if(editIdx >= 0){
    // Edición: preservar inicio/fin y el flag de caja si existen
    venta.inicio = ventasData[editIdx].inicio || '';
    venta.fin = ventasData[editIdx].fin || '';
    venta.cajaRegistrado = ventasData[editIdx].cajaRegistrado || false;
    // Preservar campos que se editan inline en la planilla (no están en el modal).
    venta.facturado = ventasData[editIdx].facturado || '';
    venta.taxiFlete = ventasData[editIdx].taxiFlete || '';
    venta.envioCosto = ventasData[editIdx].envioCosto || '';
    ventasData[editIdx] = venta;
    fbSave('ventasData', ventasData);
    sincronizarVentaCaja(editIdx);
    showToast('✅ Venta actualizada');
  } else {
    // Nueva venta
    ventasData.push(venta);
    fbSave('ventasData', ventasData);
    sincronizarVentaCaja(ventasData.length - 1);
    notificarVentaNueva(venta.prod, venta.cliente, asignado);

    // Si está pendiente, crear tarea en kanban
    if(estado === 'pendiente'){
      ensureKanbanCols();
      const detalles = [
        venta.cliente ? '👤 '+venta.cliente : '',
        venta.desc,
        venta.dedicatoria ? '✉️ "'+venta.dedicatoria+'"' : '',
        venta.dir ? '📍 '+venta.dir : ''
      ].filter(Boolean).join('\n');
      kanbanData[0].cards.push({
        title: '💐 ' + prod,
        desc: detalles,
        tags: ['tag-floreria'],
        date: venta.fecha,
        asignado: asignado,
      });
      fbSave('kanbanData', kanbanData);
      showToast('📋 Venta registrada + tarea creada en Kanban');
    } else {
      showToast('✅ Venta registrada');
    }
  }

  if(asignado && asignado !== prevAsignadoVenta && estado === 'pendiente'){
    notificarAsignacion(asignado, '💐 Nueva venta asignada', `${venta.prod}${venta.cliente ? ' · ' + venta.cliente : ''}`);
  }
  closeModal('sale-modal');
  renderVentas();
}
async function delVenta(i){ if(!await confirmModal('¿Eliminar esta venta?')) return; ventasData.splice(i,1); fbSave('ventasData',ventasData); renderVentas(); }

// ════════════════════════════════════════
// DATA — CAJA
// ════════════════════════════════════════
let cajaData=[];
window._setCajaData = (arr) => { cajaData.splice(0, cajaData.length, ...arr); };

function renderCaja(){
  const cierreFechaEl = document.getElementById('cierre-fecha');
  if(cierreFechaEl && !cierreFechaEl.value) cierreFechaEl.value = TODAY_ISO;
  renderCierreCajaHistorial();
  let totalIn=0,totalEg=0;
  cajaData.forEach(r=>{ if(r.tipo==='ingreso')totalIn+=r.monto;else totalEg+=r.monto; });
  const tbody=document.getElementById('caja-body');
  tbody.innerHTML='';
  let running=0;
  // Ordenar por fecha ascendente (más antiguo arriba) para que el saldo
  // acumulado sea correcto. Se conserva el índice real para editar/borrar,
  // y el orden de carga como desempate entre movimientos de la misma fecha.
  const orden = cajaData.map((r,i)=>({r,i}))
    .sort((a,b)=> (a.r.fecha||'9999-12-31').localeCompare(b.r.fecha||'9999-12-31') || (a.i-b.i));
  orden.forEach(({r,i})=>{
    running+=(r.tipo==='ingreso'?r.monto:-r.monto);
    const sc=running>=0?'saldo-pos':'saldo-neg';
    const rowClass=r.tipo==='ingreso'?'ingreso-row':'egreso-row';
    const tr=document.createElement('tr');
    tr.className=rowClass;
    tr.innerHTML=`
      <td><input class="form-input" type="date" value="${r.fecha||''}" onchange="updCaja(${i},'fecha',this.value)" style="min-width:120px;padding:5px 7px;font-size:12px"></td>
      <td><input class="form-input" value="${esc(r.desc)}" onchange="updCaja(${i},'desc',this.value)" style="min-width:180px;padding:5px 7px;font-size:12px"></td>
      <td><input class="form-input" value="${esc(r.ticket||'')}" onchange="updCaja(${i},'ticket',this.value)" placeholder="—" style="width:75px;padding:5px 7px;font-size:12px"></td>
      <td>
        <select class="form-select" onchange="updCajaTipo(${i},this.value)" style="font-size:11px;font-weight:600;padding:4px 6px;${r.tipo==='ingreso'?'background:#EBF5E8;color:var(--green-ok)':'background:#FBE8E8;color:var(--red-alert)'}">
          <option value="ingreso" ${r.tipo==='ingreso'?'selected':''}>💚 Ingreso</option>
          <option value="egreso"  ${r.tipo==='egreso' ?'selected':''}>🔴 Egreso</option>
        </select>
      </td>
      <td><input class="form-input" type="number" value="${r.monto}" min="0" onchange="updCajaMonto(${i},+this.value)" style="width:110px;padding:5px 7px;font-size:13px;font-weight:600;color:${r.tipo==='ingreso'?'var(--green-ok)':'var(--red-alert)'}"></td>
      <td><span class="${sc}">$${running.toLocaleString('es-AR')}</span></td>
      <td><button class="btn-icon" style="color:var(--red-alert)" onclick="delCaja(${i})">✕</button></td>`;
    tbody.appendChild(tr);
  });
  const saldoFinal=totalIn-totalEg;
  const sumEl=document.getElementById('caja-summary');
  sumEl.innerHTML=`
    <div class="card"><div class="card-label">💚 Total Ingresos</div><div class="card-value green" style="font-size:28px">$${totalIn.toLocaleString('es-AR')}</div></div>
    <div class="card"><div class="card-label">🔴 Total Egresos</div><div class="card-value red" style="font-size:28px">$${totalEg.toLocaleString('es-AR')}</div></div>
    <div class="card"><div class="card-label">💰 Saldo Actual</div><div class="card-value ${saldoFinal>=0?'green':'red'}" style="font-size:28px">$${saldoFinal.toLocaleString('es-AR')}</div></div>`;
}
function updCaja(i,field,val){ cajaData[i][field]=val; fbSave('cajaData',cajaData); renderCaja(); }
function updCajaTipo(i,val){ cajaData[i].tipo=val; fbSave('cajaData',cajaData); renderCaja(); }
function updCajaMonto(i,val){ cajaData[i].monto=isNaN(val)||val<0?0:val; fbSave('cajaData',cajaData); renderCaja(); }

function openCajaModal(){
  document.getElementById('cj-fecha-caja').value=TODAY_ISO;
  ['cj-desc-caja','cj-ticket','cj-monto'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('cj-tipo').value='ingreso';
  document.getElementById('caja-modal').classList.add('open');
}
function addCajaMovimiento(){
  const desc=document.getElementById('cj-desc-caja').value.trim();
  const monto=parseFloat(document.getElementById('cj-monto').value)||0;
  if(!desc||!monto){showToast('Completá descripción y monto.','error');return;}
  cajaData.push({
    fecha:document.getElementById('cj-fecha-caja').value||TODAY_ISO,
    desc, ticket:document.getElementById('cj-ticket').value,
    tipo:document.getElementById('cj-tipo').value, monto,
    sucursal: getSucursalId()
  });
  fbSave('cajaData', cajaData);
  closeModal('caja-modal');
  renderCaja();
}
async function delCaja(i){ if(!await confirmModal('¿Eliminar este movimiento?')) return; cajaData.splice(i,1); fbSave('cajaData',cajaData); renderCaja(); }

// ── CIERRE DE CAJA DIARIO ─────────────────────────────────────────────────────
let cierresCajaData = [];
window._setCierresCaja = (arr) => { cierresCajaData = arr && typeof arr === 'object' ? (Array.isArray(arr) ? arr : Object.values(arr)) : []; renderCierreCajaHistorial(); };

function cierresCajaDelDia(fecha){
  return cajaData.filter(r => (r.fecha||'') === fecha);
}

async function cerrarCajaDia(){
  const fecha = document.getElementById('cierre-fecha')?.value || TODAY_ISO;
  const movsDia = cierresCajaDelDia(fecha);
  if(!movsDia.length){ showToast('⚠️ No hay movimientos para esa fecha'); return; }
  if(!await confirmModal(`¿Cerrar caja del ${fmtDate(fecha)}? Se archivará el resumen del día.`)) return;

  let totalIn = 0, totalEg = 0;
  movsDia.forEach(r => { if(r.tipo==='ingreso') totalIn+=r.monto; else totalEg+=r.monto; });

  const cierre = {
    fecha,
    totalIngresos: totalIn,
    totalEgresos: totalEg,
    saldo: totalIn - totalEg,
    movimientos: movsDia,
    cerradoPor: window.currentUserLabel || '—',
    ts: Date.now()
  };

  // Archivar en cierresCaja
  if(!Array.isArray(cierresCajaData)) cierresCajaData = [];
  // Reemplazar si ya existe cierre del mismo día
  const idx = cierresCajaData.findIndex(c => c.fecha === fecha);
  if(idx >= 0) cierresCajaData[idx] = cierre;
  else cierresCajaData.push(cierre);
  fbSave('cierresCaja', cierresCajaData);

  showToast(`✅ Caja del ${fmtDate(fecha)} cerrada — Saldo: $${cierre.saldo.toLocaleString('es-AR')}`);
  renderCierreCajaHistorial();
}

function renderCierreCajaHistorial(){
  const el = document.getElementById('cierre-caja-historial');
  if(!el) return;
  const sorted = [...cierresCajaData].sort((a,b) => b.fecha?.localeCompare(a.fecha||''));
  if(!sorted.length){ el.innerHTML = '<div style="color:var(--mid-gray);font-size:13px;padding:16px">Sin cierres registrados aún.</div>'; return; }
  el.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr style="background:var(--cream)">
      <th style="padding:8px 12px;text-align:left;font-size:10px;letter-spacing:1px;color:var(--mid-gray);text-transform:uppercase">Fecha</th>
      <th style="padding:8px 12px;text-align:right;font-size:10px;letter-spacing:1px;color:var(--mid-gray);text-transform:uppercase">Ingresos</th>
      <th style="padding:8px 12px;text-align:right;font-size:10px;letter-spacing:1px;color:var(--mid-gray);text-transform:uppercase">Egresos</th>
      <th style="padding:8px 12px;text-align:right;font-size:10px;letter-spacing:1px;color:var(--mid-gray);text-transform:uppercase">Saldo</th>
      <th style="padding:8px 12px;text-align:left;font-size:10px;letter-spacing:1px;color:var(--mid-gray);text-transform:uppercase">Cerrado por</th>
    </tr></thead>
    <tbody>
    ${sorted.map(c => `<tr style="border-top:1px solid var(--light-gray)" onclick="toggleCierreDetalle(${c.ts})" style="cursor:pointer">
      <td style="padding:9px 12px;font-weight:500">${fmtDate(c.fecha)}</td>
      <td style="padding:9px 12px;text-align:right;color:var(--green-ok);font-weight:600">$${(c.totalIngresos||0).toLocaleString('es-AR')}</td>
      <td style="padding:9px 12px;text-align:right;color:var(--red-alert);font-weight:600">$${(c.totalEgresos||0).toLocaleString('es-AR')}</td>
      <td style="padding:9px 12px;text-align:right;font-weight:700;color:${(c.saldo||0)>=0?'var(--green-ok)':'var(--red-alert)'}">$${(c.saldo||0).toLocaleString('es-AR')}</td>
      <td style="padding:9px 12px;color:var(--mid-gray);font-size:12px">${c.cerradoPor||'—'}</td>
    </tr>`).join('')}
    </tbody>
  </table>`;
}

function toggleCierreDetalle(ts){
  // Mostrar detalle de movimientos en un toast/alert simple
  const cierre = cierresCajaData.find(c => c.ts === ts);
  if(!cierre) return;
  const lines = (cierre.movimientos||[]).map(m => `${m.tipo==='ingreso'?'💚':'🔴'} ${m.desc}: $${m.monto.toLocaleString('es-AR')}`).join('\n');
  alertModal(`${lines}\n\nSaldo: $${cierre.saldo.toLocaleString('es-AR')}`, { title: 'Cierre ' + fmtDate(cierre.fecha) });
}

// ════════════════════════════════════════
// DATA — GALERÍA DE TRABAJOS
// ════════════════════════════════════════
let galeriaData=[];
window._setGaleriaData = (arr) => { galeriaData.splice(0, galeriaData.length, ...arr); };

let _galeriaLightboxIdx = 0;

// Sección activa del glosario dentro de Galería de Trabajos.
// 'hotel' = arreglos standard del hotel · 'eventos' = arreglos de eventos · 'todos' = ambos.
// Las fichas viejas sin sección se consideran 'eventos' (histórico de trabajos).
let galeriaSeccion = 'hotel';
function galSecDe(g){ return g.seccion==='hotel' ? 'hotel' : 'eventos'; }

function setGaleriaSeccion(s){
  galeriaSeccion = s;
  ['hotel','eventos','todos'].forEach(k=>{
    document.getElementById('gal-tab-'+k)?.classList.toggle('active', k===s);
  });
  renderGaleria();
}

// Filas de la ficha técnica (glosario) — mismo modelo que la planilla impresa.
const GLOSARIO_ROWS = [
  ['Sector',            g=>g.sector],
  ['Cantidad',          g=>g.cantidad],
  ['Categoría',         g=>g.categoria || g.tipoEvento],
  ['Composición',       g=>g.composicion],
  ['Formato',           g=>g.formato],
  ['Base o florero',    g=>g.base],
  ['Tamaño',            g=>g.tamano],
  ['Paleta de color',   g=>g.paleta || g.temporada],
  ['Destinatario / uso',g=>g.destinatario],
  ['Empaque',           g=>g.empaque],
  ['Precio sugerido',   g=>g.precio],
  ['Tiempo de armado',  g=>g.tiempoArmado],
  ['Notas internas',    g=>g.notas],
];

// Materia prima de una ficha, ya formateada: "1 paquete de azarero", "3 Rosas"...
function galMateriaPrima(g){
  return (g.ings||[]).filter(i=>i && i.prod).map(i=>{
    const q = (i.qty!=null && String(i.qty).trim()) ? String(i.qty).trim()+' ' : '';
    return q + i.prod;
  });
}

// Áreas del hotel ya pactadas (zonas del checklist) + las que ya se usaron en fichas.
function getGaleriaSectorOpts(current){
  const zonas = getAreaUsoZonas();
  const usadas = [...new Set(galeriaData.map(g=>(g.sector||'').trim()).filter(Boolean))];
  const all = [...new Set([...zonas, ...usadas])].sort((a,b)=>a.localeCompare(b,'es'));
  const cur = (current||'').trim();
  const extra = cur && !all.includes(cur) ? `<option value="${esc(cur)}" selected>${esc(cur)}</option>` : '';
  return `<option value="">— Área del hotel —</option>` + extra +
    all.map(z=>`<option value="${esc(z)}"${z===cur?' selected':''}>${esc(z)}</option>`).join('') +
    `<option value="__otra__">✏️ Otra (escribir)...</option>`;
}

function renderGaleria(){
  const search  = (document.getElementById('gal-search')?.value||'').toLowerCase();

  const filtered = galeriaData.filter(g=>{
    const matSec = galeriaSeccion==='todos' || galSecDe(g)===galeriaSeccion;
    if(!matSec) return false;
    if(!search) return true;
    const hay = [g.titulo, g.sector, g.categoria, g.tipoEvento, g.destinatario,
      (g.flores||[]).join(' '), galMateriaPrima(g).join(' ')].join(' ').toLowerCase();
    return hay.includes(search);
  });

  const el = document.getElementById('galeria-grid');
  if(!el) return;

  if(!filtered.length){
    const secLabel = galeriaSeccion==='hotel'?'standard del hotel':galeriaSeccion==='eventos'?'de eventos':'';
    el.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--mid-gray)">
      <div style="font-size:48px;margin-bottom:16px">🌸</div>
      <div style="font-size:14px">No hay fichas de arreglos ${esc(secLabel)} todavía.<br>Agregá la primera con "＋ Nueva ficha".</div>
    </div>`;
    return;
  }

  const TEMP_ICON = {Primavera:'🌸',Verano:'☀️',Otoño:'🍂',Invierno:'❄️'};
  el.innerHTML = `<div style="columns:3 280px;column-gap:16px;orphans:1;widows:1">
    ${filtered.map((g)=>{
      const realIdx = galeriaData.indexOf(g);
      const foto = (g.fotos&&g.fotos[0]) || g.foto || '';
      const flores = Array.isArray(g.flores) ? g.flores : (g.flores?g.flores.split(',').map(f=>f.trim()):[]);
      const chips = galMateriaPrima(g).length ? galMateriaPrima(g) : flores;
      const secBadge = galSecDe(g)==='hotel'
        ? `<span style="background:#E8EEF4;color:#2C5A80;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600">🏨 Hotel</span>`
        : `<span style="background:var(--blush-light);color:#7A3A2A;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600">🎉 Evento</span>`;
      return `<div style="break-inside:avoid;margin-bottom:16px;border-radius:var(--radius-md);overflow:hidden;background:var(--warm-white);border:1px solid var(--light-gray);box-shadow:var(--shadow-sm);cursor:pointer;transition:var(--transition)" onclick="openFichaGaleria(${realIdx})" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.transform='';this.style.boxShadow='var(--shadow-sm)'">
        ${foto
          ? `<img src="${foto}" style="width:100%;display:block;object-fit:cover;max-height:380px" loading="lazy">`
          : `<div style="width:100%;height:200px;background:linear-gradient(135deg,var(--blush-light),var(--sage-light));display:flex;align-items:center;justify-content:center;font-size:52px">🌸</div>`
        }
        <div style="padding:14px 16px">
          <div style="font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:500;color:var(--charcoal);margin-bottom:6px">${esc(g.titulo||'Sin título')}</div>
          <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">
            ${secBadge}
            ${g.sector?`<span style="background:var(--cream);color:var(--mid-gray);padding:2px 8px;border-radius:20px;font-size:10px">📍 ${esc(g.sector)}</span>`:''}
            ${g.tamano?`<span style="background:var(--cream);color:var(--mid-gray);padding:2px 8px;border-radius:20px;font-size:10px">${esc(g.tamano)}</span>`:''}
            ${g.temporada?`<span style="background:var(--cream);color:var(--mid-gray);padding:2px 8px;border-radius:20px;font-size:10px">${TEMP_ICON[g.temporada]||''} ${esc(g.temporada)}</span>`:''}
            ${chips.slice(0,3).map(f=>`<span style="background:var(--light-gray);color:var(--charcoal);padding:2px 8px;border-radius:20px;font-size:10px">${esc(f)}</span>`).join('')}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:11px;color:var(--mid-gray)">${g.precio?esc(g.precio):(g.fecha?fmtDate(g.fecha):'')}</span>
            <div style="display:flex;gap:4px" onclick="event.stopPropagation()">
              ${(g.fotos&&g.fotos.length>1)?`<span style="font-size:10px;color:var(--mid-gray);padding:2px 6px">📷 ${g.fotos.length}</span>`:''}
              <button class="btn-icon" onclick="editarGaleria(${realIdx})" title="Editar">✏️</button>
              <button class="btn-icon" style="color:var(--red-alert)" onclick="eliminarGaleria(${realIdx})" title="Eliminar">🗑</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

// ── Ficha técnica (vista tipo planilla, como el glosario impreso) ──
// Devuelve las filas [label, valorHTML] que tienen contenido, en el orden de la planilla.
function fichaRows(g){
  const mp = galMateriaPrima(g);
  const rows = [];
  GLOSARIO_ROWS.forEach(([label, get])=>{
    const val = get(g);
    if(label==='Composición'){
      if(val) rows.push([label, esc(val)]);
      // Después de "Composición" va la materia prima (verdes / flores) como lista
      if(mp.length) rows.push(['Materia prima', '<ul style="margin:0;padding-left:18px">'+mp.map(m=>`<li>${esc(m)}</li>`).join('')+'</ul>']);
    } else if(val){
      rows.push([label, esc(val)]);
    }
  });
  return rows;
}

function fichaGaleriaHTML(g){
  return fichaRows(g).map(([l,v])=>`<tr>
    <td style="border:1px solid #E4E2DC;padding:9px 12px;font-weight:600;background:#FAF8F4;width:38%;vertical-align:top">${l}</td>
    <td style="border:1px solid #E4E2DC;padding:9px 12px;vertical-align:top">${v}</td>
  </tr>`).join('');
}

function openFichaGaleria(idx){
  const g = galeriaData[idx];
  if(!g) return;
  const fotos = g.fotos?.length ? g.fotos : (g.foto ? [g.foto] : []);
  const rowsHTML = fichaGaleriaHTML(g);
  let ov = document.getElementById('ficha-galeria-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='ficha-galeria-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="modal" style="max-width:920px">
    <button class="modal-close" onclick="closeModal('ficha-galeria-modal')">✕</button>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:6px">
      <div class="modal-title" style="margin:0">${esc(g.titulo||'Ficha de arreglo')}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn-secondary" style="font-size:12px" onclick="imprimirFicha(${idx})">🖨 Imprimir</button>
        <button class="btn-secondary" style="font-size:12px" onclick="closeModal('ficha-galeria-modal');editarGaleria(${idx})">✏️ Editar</button>
      </div>
    </div>
    <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start">
      <div style="flex:1;min-width:220px">
        ${fotos.length
          ? `<img src="${fotos[0]}" style="width:100%;border-radius:8px;object-fit:cover;cursor:zoom-in" onclick="abrirLightbox(${idx})">
             ${fotos.length>1?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${fotos.slice(1).map(f=>`<img src="${f}" style="width:56px;height:56px;object-fit:cover;border-radius:5px;border:1px solid var(--light-gray)">`).join('')}</div>`:''}`
          : `<div style="width:100%;height:200px;background:linear-gradient(135deg,var(--blush-light),var(--sage-light));display:flex;align-items:center;justify-content:center;font-size:52px;border-radius:8px">🌸</div>`}
      </div>
      <div style="flex:2;min-width:300px;overflow-x:auto">
        ${rowsHTML
          ? `<table style="width:100%;border-collapse:collapse;font-size:13px">${rowsHTML}</table>`
          : `<div style="color:var(--mid-gray);padding:20px;text-align:center">Esta ficha todavía no tiene datos técnicos.<br>Tocá "Editar" para completarla.</div>`}
      </div>
    </div>
  </div>`;
  ov.classList.add('open');
}

function imprimirFicha(idx){
  const g = galeriaData[idx];
  if(!g) return;
  const foto = (g.fotos&&g.fotos[0]) || g.foto || '';
  const win = window.open('','_blank');
  win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${esc(g.titulo||'Ficha de arreglo')}</title><style>
    body{font-family:Arial,sans-serif;margin:36px;color:#1a1a1a}
    h1{font-size:22px;margin:0 0 18px}
    .wrap{display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap}
    .foto{flex:1;min-width:220px}
    .foto img{width:100%;border-radius:8px;object-fit:cover}
    table{flex:2;min-width:300px;border-collapse:collapse;font-size:13px}
    td{border:1px solid #ccc;padding:8px 12px;vertical-align:top}
    td.k{font-weight:bold;background:#f5f5f0;width:36%}
    ul{margin:0;padding-left:18px}
    @media print{button{display:none}}
  </style></head><body>
    <h1>${esc(g.titulo||'Ficha de arreglo')} — ${galSecDe(g)==='hotel'?'Standard Hotel':'Eventos'}</h1>
    <div class="wrap">
      ${foto?`<div class="foto"><img src="${foto}"></div>`:''}
      <table>${fichaRows(g).map(([l,v])=>`<tr><td class="k">${l}</td><td>${v}</td></tr>`).join('')}</table>
    </div>
    <button onclick="window.print()" style="margin-top:24px;padding:8px 20px;cursor:pointer">🖨️ Imprimir</button>
  </body></html>`);
  win.document.close();
}

function abrirLightbox(idx){
  _galeriaLightboxIdx = idx;
  const g = galeriaData[idx];
  const fotos = g.fotos?.length ? g.fotos : (g.foto ? [g.foto] : []);
  let fotoIdx = 0;
  let ov = document.getElementById('galeria-lightbox');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'galeria-lightbox';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:2000;display:flex;align-items:center;justify-content:center;flex-direction:column';
    ov.addEventListener('click', e=>{ if(e.target===ov) ov.remove(); });
    document.body.appendChild(ov);
  }
  const flores = Array.isArray(g.flores) ? g.flores : (g.flores?g.flores.split(',').map(f=>f.trim()):[]);
  function showFoto(){
    const src = fotos[fotoIdx];
    ov.innerHTML = `
      <button onclick="document.getElementById('galeria-lightbox').remove()" style="position:absolute;top:20px;right:28px;background:none;border:none;color:white;font-size:32px;cursor:pointer;line-height:1">✕</button>
      ${fotos.length>1?`<button onclick="event.stopPropagation();fotoIdx=(fotoIdx-1+fotos.length)%fotos.length;showFoto()" style="position:absolute;left:20px;background:rgba(255,255,255,.15);border:none;color:white;font-size:28px;padding:12px 16px;border-radius:8px;cursor:pointer">‹</button>
      <button onclick="event.stopPropagation();fotoIdx=(fotoIdx+1)%fotos.length;showFoto()" style="position:absolute;right:20px;background:rgba(255,255,255,.15);border:none;color:white;font-size:28px;padding:12px 16px;border-radius:8px;cursor:pointer">›</button>`:''}
      ${src?`<img src="${src}" style="max-width:85vw;max-height:72vh;border-radius:8px;object-fit:contain;box-shadow:0 8px 40px rgba(0,0,0,.6)">`
           :`<div style="font-size:80px">🌸</div>`}
      <div style="margin-top:16px;text-align:center;max-width:600px;padding:0 20px">
        <div style="font-family:'Cormorant Garamond',serif;font-size:22px;color:white;margin-bottom:6px">${esc(g.titulo||'Sin título')}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:8px">
          ${g.tipoEvento?`<span style="background:rgba(196,147,122,.3);color:#EDE8E2;padding:3px 10px;border-radius:20px;font-size:11px">${esc(g.tipoEvento)}</span>`:''}
          ${flores.map(f=>`<span style="background:rgba(255,255,255,.12);color:rgba(255,255,255,.8);padding:3px 10px;border-radius:20px;font-size:11px">${esc(f)}</span>`).join('')}
        </div>
        ${g.notas?`<div style="font-size:12px;color:rgba(255,255,255,.5);line-height:1.6">${esc(g.notas)}</div>`:''}
        ${fotos.length>1?`<div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:6px">${fotoIdx+1} / ${fotos.length}</div>`:''}
      </div>`;
  }
  showFoto();
}

function galIngRowHTML(prod, qty){
  return `<div class="ev-arreglo-row" style="display:flex;gap:8px;margin-bottom:6px">
    <input list="gal-insumos-list" value="${esc(prod||'')}" placeholder="Materia prima (flor / follaje)" style="flex:2;min-width:0;border:1px solid #E4E2DC;border-radius:4px;padding:6px 8px;font-family:'DM Sans',sans-serif;font-size:12.5px;outline:none">
    <input type="text" value="${esc(qty||'')}" placeholder="Cant. (ej. 3, 1 paquete)" style="flex:1;min-width:0;border:1px solid #E4E2DC;border-radius:4px;padding:6px 8px;font-size:12.5px;outline:none;font-family:'DM Sans',sans-serif">
    <button type="button" class="btn-icon" style="color:var(--red-alert)" onclick="this.closest('.ev-arreglo-row').remove()">✕</button>
  </div>`;
}
function addGalIngRow(){
  const list = document.getElementById('gal-ings-list');
  if(!list) return;
  const div = document.createElement('div');
  div.innerHTML = galIngRowHTML('','');
  list.appendChild(div.firstElementChild);
}
// Mostrar/ocultar el campo de área personalizada según el select
function galSectorOnChange(){
  const sel = document.getElementById('gal-sector-sel');
  const custom = document.getElementById('gal-sector-custom');
  if(!sel||!custom) return;
  custom.style.display = sel.value==='__otra__' ? 'block' : 'none';
  if(sel.value==='__otra__') custom.focus();
}

function openGaleriaModal(idx){
  const g = idx!=null ? galeriaData[idx] : {};
  const sec = idx!=null ? galSecDe(g) : (galeriaSeccion==='eventos'?'eventos':'hotel');
  let ov = document.getElementById('galeria-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='galeria-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  const ings = (g.ings&&g.ings.length) ? g.ings : [{prod:'',qty:''}];
  const fld = (label, id, val, ph='') => `<div class="form-group"><label class="form-label">${label}</label>
    <input class="form-input-modal" id="${id}" value="${esc(val||'')}" placeholder="${esc(ph)}"></div>`;
  ov.innerHTML = `<div class="modal" style="max-width:640px">
    <button class="modal-close" onclick="closeModal('galeria-modal')">✕</button>
    <div class="modal-title">${idx!=null?'Editar ficha':'Nueva ficha de arreglo'}</div>

    <div class="modal-row">
      <div class="form-group"><label class="form-label">Sección *</label>
        <select class="form-input-modal" id="gal-seccion">
          <option value="hotel"${sec==='hotel'?' selected':''}>🏨 Standard Hotel</option>
          <option value="eventos"${sec==='eventos'?' selected':''}>🎉 Eventos</option>
        </select></div>
      <div class="form-group"><label class="form-label">Título del arreglo *</label>
        <input class="form-input-modal" id="gal-titulo" value="${esc(g.titulo||'')}" placeholder="ej. Lobby de Alvear — Follaje"></div>
    </div>

    <div class="modal-row">
      <div class="form-group"><label class="form-label">Área del hotel</label>
        <select class="form-input-modal" id="gal-sector-sel" onchange="galSectorOnChange()">${getGaleriaSectorOpts(g.sector)}</select>
        <input class="form-input-modal" id="gal-sector-custom" placeholder="Escribí la nueva área" style="display:none;margin-top:6px" value="">
      </div>
      <div class="form-group"><label class="form-label">Cantidad</label>
        <input class="form-input-modal" id="gal-cantidad" value="${esc(g.cantidad||'')}" placeholder="ej. dos"></div>
    </div>

    ${fld('Categoría','gal-categoria', g.categoria||g.tipoEvento, 'ej. Ambientación Hotelera')}

    <div class="form-group"><label class="form-label">Materia prima <span style="color:var(--mid-gray);font-size:10px;font-weight:400">(elegí de la base o escribí una nueva)</span></label>
      <div id="gal-ings-list">${ings.map(i=>galIngRowHTML(i.prod,i.qty)).join('')}</div>
      <datalist id="gal-insumos-list">${getAllInsumos().map(n=>`<option value="${esc(n)}">`).join('')}</datalist>
      <button type="button" class="btn-secondary" style="margin-top:4px;font-size:12px" onclick="addGalIngRow()">+ Agregar materia prima</button>
    </div>

    ${fld('Composición (texto libre, opcional)','gal-composicion', g.composicion, 'Notas de composición')}

    <div class="modal-row">
      ${fld('Formato','gal-formato', g.formato, 'ej. Arreglo')}
      ${fld('Tamaño','gal-tamano', g.tamano, 'ej. XL (medidas cm)')}
    </div>
    ${fld('Base o florero','gal-base', g.base, 'ej. Base Florero metal (medidas cm)')}
    <div class="modal-row">
      ${fld('Paleta de color','gal-paleta', g.paleta, 'ej. rojas')}
      ${fld('Empaque','gal-empaque', g.empaque, 'ej. no aplica')}
    </div>
    ${fld('Destinatario / uso','gal-destinatario', g.destinatario, 'ej. Entrada del Palacio')}
    <div class="modal-row">
      ${fld('Precio sugerido','gal-precio', g.precio, 'ej. por contrato')}
      ${fld('Tiempo de armado','gal-tiempo', g.tiempoArmado, 'ej. 90 min')}
    </div>

    <div class="modal-row">
      <div class="form-group"><label class="form-label">Temporada (opcional)</label>
        <select class="form-input-modal" id="gal-temporada">
          <option value="">—</option>
          ${['Primavera','Verano','Otoño','Invierno'].map(t=>`<option${t===(g.temporada||'')?' selected':''}>${t}</option>`).join('')}
        </select></div>
      <div class="form-group"><label class="form-label">Fecha (opcional)</label>
        <input class="form-input-modal" type="date" id="gal-fecha" value="${esc(g.fecha||'')}"></div>
    </div>

    <div class="form-group"><label class="form-label">Notas internas</label>
      <textarea class="form-input-modal" id="gal-notas" rows="2" placeholder="Detalles, observaciones...">${esc(g.notas||'')}</textarea></div>

    <div class="form-group"><label class="form-label">Fotos</label>
      <div id="gal-fotos-preview" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        ${(g.fotos||[]).map((f,fi)=>`<div style="position:relative;width:80px;height:80px;border-radius:6px;overflow:hidden;border:1px solid var(--light-gray)">
          <img src="${f}" style="width:100%;height:100%;object-fit:cover">
          <button onclick="galeriaQuitarFoto(${idx!=null?idx:'null'},${fi})" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,.6);color:white;border:none;border-radius:50%;width:18px;height:18px;font-size:11px;cursor:pointer;line-height:1">✕</button>
        </div>`).join('')}
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <label class="btn-secondary" style="cursor:pointer;font-size:12px">
          📷 Subir fotos <input type="file" accept="image/*" multiple style="display:none" onchange="galeriaAddFotos(${idx!=null?idx:'null'},this)">
        </label>
        <span style="color:var(--mid-gray);font-size:12px">o</span>
        <div style="display:flex;gap:6px;flex:1;min-width:180px">
          <input class="form-input-modal" id="gal-url-input" placeholder="Pegar URL de foto" style="margin-bottom:0;flex:1">
          <button class="btn-secondary" style="font-size:12px;white-space:nowrap" onclick="galeriaAddUrl(${idx!=null?idx:'null'})">+ URL</button>
        </div>
      </div>
    </div>
    <input type="hidden" id="gal-fotos-data" value="${esc(JSON.stringify(g.fotos||[]))}">
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal('galeria-modal')">Cancelar</button>
      <button class="btn-add" onclick="guardarGaleria(${idx!=null?idx:'null'})">Guardar ficha</button>
    </div>
  </div>`;
  ov.classList.add('open');
  // Si el área guardada no está en la lista, mostrar el campo custom
  const sel = document.getElementById('gal-sector-sel');
  const custom = document.getElementById('gal-sector-custom');
  if(sel && custom && g.sector && sel.value!==g.sector){
    sel.value='__otra__'; custom.style.display='block'; custom.value=g.sector;
  }
}

function galeriaAddFotos(idx, input){
  const files = Array.from(input.files);
  if(!files.length) return;
  const fotosData = JSON.parse(document.getElementById('gal-fotos-data')?.value||'[]');
  let loaded=0;
  files.forEach(file=>{
    const reader=new FileReader();
    reader.onload=e=>{
      fotosData.push(e.target.result);
      loaded++;
      if(loaded===files.length){
        document.getElementById('gal-fotos-data').value = JSON.stringify(fotosData);
        _refreshGalModalFotos(fotosData, idx);
      }
    };
    reader.readAsDataURL(file);
  });
}

function galeriaAddUrl(idx){
  const url = document.getElementById('gal-url-input')?.value?.trim();
  if(!url){ showToast('Ingresá una URL válida'); return; }
  const fotosData = JSON.parse(document.getElementById('gal-fotos-data')?.value||'[]');
  fotosData.push(url);
  document.getElementById('gal-fotos-data').value = JSON.stringify(fotosData);
  document.getElementById('gal-url-input').value = '';
  _refreshGalModalFotos(fotosData, idx);
}

function galeriaQuitarFoto(idx, fi){
  const fotosData = JSON.parse(document.getElementById('gal-fotos-data')?.value||'[]');
  fotosData.splice(fi,1);
  document.getElementById('gal-fotos-data').value = JSON.stringify(fotosData);
  _refreshGalModalFotos(fotosData, idx);
}

function _refreshGalModalFotos(fotosData, idx){
  const preview = document.getElementById('gal-fotos-preview');
  if(!preview) return;
  preview.innerHTML = fotosData.map((f,fi)=>`<div style="position:relative;width:80px;height:80px;border-radius:6px;overflow:hidden;border:1px solid var(--light-gray)">
    <img src="${f}" style="width:100%;height:100%;object-fit:cover">
    <button onclick="galeriaQuitarFoto(${idx!=null?idx:'null'},${fi})" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,.6);color:white;border:none;border-radius:50%;width:18px;height:18px;font-size:11px;cursor:pointer;line-height:1">✕</button>
  </div>`).join('');
}

function guardarGaleria(idx){
  const titulo = document.getElementById('gal-titulo')?.value?.trim();
  if(!titulo){ showToast('Ingresá un título'); return; }

  // Área: puede venir del select o del campo "Otra"
  const selArea = document.getElementById('gal-sector-sel')?.value||'';
  const customArea = document.getElementById('gal-sector-custom')?.value?.trim()||'';
  const sector = selArea==='__otra__' ? customArea : selArea;

  // Materia prima (ingredientes) desde las filas
  const ings = [];
  document.querySelectorAll('#gal-ings-list .ev-arreglo-row').forEach(row=>{
    const inputs = row.querySelectorAll('input');
    const prod = (inputs[0]?.value||'').trim();
    const qty  = (inputs[1]?.value||'').trim();
    if(prod){ ings.push({prod, qty}); addInsumoToBase(prod); }
  });
  // flores derivadas de la materia prima (para búsqueda y chips)
  const flores = ings.map(i=>i.prod);

  const fotos = JSON.parse(document.getElementById('gal-fotos-data')?.value||'[]');
  const prev = (idx!=null ? galeriaData[idx] : {}) || {};
  const trabajo = {
    ...prev,
    seccion: document.getElementById('gal-seccion')?.value||'hotel',
    titulo,
    sector,
    cantidad:    document.getElementById('gal-cantidad')?.value?.trim()||'',
    categoria:   document.getElementById('gal-categoria')?.value?.trim()||'',
    ings,
    composicion: document.getElementById('gal-composicion')?.value?.trim()||'',
    formato:     document.getElementById('gal-formato')?.value?.trim()||'',
    tamano:      document.getElementById('gal-tamano')?.value?.trim()||'',
    base:        document.getElementById('gal-base')?.value?.trim()||'',
    paleta:      document.getElementById('gal-paleta')?.value?.trim()||'',
    empaque:     document.getElementById('gal-empaque')?.value?.trim()||'',
    destinatario:document.getElementById('gal-destinatario')?.value?.trim()||'',
    tiempoArmado:document.getElementById('gal-tiempo')?.value?.trim()||'',
    temporada:   document.getElementById('gal-temporada')?.value||'',
    fecha:       document.getElementById('gal-fecha')?.value||'',
    precio:      document.getElementById('gal-precio')?.value?.trim()||'',
    notas:       document.getElementById('gal-notas')?.value?.trim()||'',
    flores,
    fotos
  };
  // tipoEvento queda como estaba (histórico); la nueva categoría lo reemplaza en la vista
  if(idx!=null) galeriaData[idx]=trabajo; else galeriaData.push(trabajo);
  fbSave('galeriaData', galeriaData);
  closeModal('galeria-modal');
  renderGaleria();
  showToast('✅ Ficha guardada en la galería');
}

function editarGaleria(idx){ openGaleriaModal(idx); }

async function eliminarGaleria(idx){
  if(!await confirmModal('¿Eliminar este trabajo de la galería?')) return;
  galeriaData.splice(idx,1);
  fbSave('galeriaData', galeriaData);
  renderGaleria();
  showToast('Trabajo eliminado');
}

// ════════════════════════════════════════
// RECEPCIÓN DE PEDIDOS
// ════════════════════════════════════════
let recepState = {}; // key: idx → { items: [{checked, cantRecibida}] }

let recepAgrupado = false;

function toggleRecepAgrupado(){
  recepAgrupado = !recepAgrupado;
  const btn = document.getElementById('recep-group-btn');
  if(btn) btn.classList.toggle('active', recepAgrupado);
  renderRecepcionPedidos();
}

function renderRecepcionPedidos(){
  const allPending = comprasFlore
    .map((c,i) => ({...c, _idx: i}))
    .filter(c => c.estado !== 'recibido');

  const listEl  = document.getElementById('recep-list');
  const emptyEl = document.getElementById('recep-empty');
  const alertEl = document.getElementById('recep-alert-area');
  const filterBar = document.getElementById('recep-filter-bar');
  const groupedEl = document.getElementById('recep-grouped');

  if(!listEl) return;

  if(allPending.length === 0){
    listEl.innerHTML = '';
    emptyEl.style.display = '';
    alertEl.innerHTML = '';
    if(filterBar) filterBar.style.display = 'none';
    if(groupedEl){ groupedEl.style.display = 'none'; groupedEl.innerHTML=''; }
    return;
  }
  emptyEl.style.display = 'none';
  if(filterBar) filterBar.style.display = 'flex';

  // Filtro por nombre de insumo (agrupa el mismo producto aunque esté en pedidos separados)
  const q = (document.getElementById('recep-search')?.value||'').trim().toLowerCase();
  const pending = q ? allPending.filter(o => (o.prod||'').toLowerCase().includes(q)) : allPending;

  // Sin alertas de urgencia — circuito simple pedido → recibido
  alertEl.innerHTML = '';

  // Vista agrupada por insumo: suma paquetes del mismo producto entre arreglos/secciones
  if(recepAgrupado && groupedEl){
    listEl.style.display = 'none';
    groupedEl.style.display = '';
    const groups = {};
    pending.forEach(o => {
      const key = (o.prod||'—').trim();
      if(!groups[key]) groups[key] = { prod:key, qty:0, n:0, sectores:new Set(), provs:new Set() };
      groups[key].qty += parseFloat(o.qty)||0;
      groups[key].n++;
      if(o.sector) groups[key].sectores.add(o.sector);
      if(o.prov) groups[key].provs.add(o.prov);
    });
    const rows = Object.values(groups).sort((a,b)=>a.prod.localeCompare(b.prod,'es'));
    groupedEl.innerHTML = `<div style="font-size:12px;color:var(--mid-gray);margin-bottom:10px">${rows.length} insumo${rows.length!==1?'s':''} distinto${rows.length!==1?'s':''} · ${pending.length} pedido${pending.length!==1?'s':''}</div>
      <div class="table-wrapper"><table class="stock-table" style="min-width:520px">
        <thead><tr><th>Insumo</th><th style="text-align:center">Pedidos</th><th style="text-align:center">Total paquetes</th><th>Secciones / arreglos</th></tr></thead>
        <tbody>${rows.map(g=>`<tr>
          <td><strong>${esc(g.prod)}</strong></td>
          <td style="text-align:center">${g.n}</td>
          <td style="text-align:center"><strong style="font-size:15px;color:var(--sage-dark)">${g.qty}</strong></td>
          <td style="font-size:11.5px;color:var(--mid-gray)">${esc([...g.sectores].join(', ')||'—')}</td>
        </tr>`).join('')}</tbody>
      </table></div>`;
    const actionBar = document.getElementById('recep-action-bar');
    if(actionBar) actionBar.style.display = 'none';
    recepUpdateGlobal(allPending);
    return;
  }
  listEl.style.display = '';
  if(groupedEl){ groupedEl.style.display = 'none'; groupedEl.innerHTML=''; }

  // Show action bar
  const actionBar = document.getElementById('recep-action-bar');
  if(actionBar) actionBar.style.display = 'flex';

  if(pending.length === 0){
    listEl.innerHTML = '<div style="padding:32px;text-align:center;color:var(--mid-gray);font-size:13px">Sin resultados para "'+esc(q)+'"</div>';
    recepUpdateGlobal(allPending);
    return;
  }

  listEl.innerHTML = pending.map((order) => {
    const globalIdx = order._idx;
    if(!recepState[globalIdx]){
      recepState[globalIdx] = { checked: false, paqRecibidos: order.qty, varasPorPaq: 1 };
    }
    const st = recepState[globalIdx];
    // Migrar estado viejo (cantRecibida) al nuevo formato
    if(st.cantRecibida && !st.paqRecibidos){ st.paqRecibidos = st.cantRecibida; st.varasPorPaq = 1; }
    const totalVaras = (parseFloat(st.paqRecibidos)||0) * (parseFloat(st.varasPorPaq)||1);
    const estadoBadge = '<span style="background:#EBF0E8;color:#3A5230;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">PEDIDO</span>';
    const paqOk = parseFloat(st.paqRecibidos) >= parseFloat(order.qty);
    const rowClass = st.checked ? (paqOk ? 'recep-ok' : 'recep-parcial') : '';

    return `<div class="recep-pedido" id="recep-pedido-${globalIdx}">
      <div class="recep-pedido-header">
        <div>
          <div class="recep-pedido-title">📦 ${esc(order.prod)}</div>
          <div class="recep-pedido-meta">${esc(order.fecha)} · ${esc(order.prov||'Sin proveedor')} · ${esc(order.sector||'')} ${estadoBadge}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;opacity:.6">Pedido</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:400">${order.qty} paq</div>
        </div>
      </div>
      <div class="recep-item-row ${rowClass}" id="recep-row-${globalIdx}" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <input type="checkbox" class="recep-check" id="recep-chk-${globalIdx}"
          ${st.checked ? 'checked' : ''}
          onchange="recepToggle(${globalIdx}, this.checked)">
        <div style="flex:1;min-width:120px">
          <div style="font-weight:500">${esc(order.prod)}</div>
          ${order.desc ? `<div style="font-size:11px;color:var(--mid-gray)">${esc(order.desc)}</div>` : ''}
        </div>
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--mid-gray)">Pedido</div>
          <strong style="font-size:15px">${order.qty}</strong>
          <div style="font-size:9px;color:var(--mid-gray)">paquetes</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--mid-gray)">Recibidos</div>
          <input type="number" class="recep-qty-input" id="recep-paq-${globalIdx}"
            value="${st.paqRecibidos}" min="0"
            onchange="recepUpdPaq(${globalIdx}, this.value)"
            ${!st.checked ? 'disabled style="opacity:.5"' : ''}>
          <div style="font-size:9px;color:var(--mid-gray)">paquetes</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--mid-gray)">Varas/paq</div>
          <input type="number" class="recep-qty-input" id="recep-varas-${globalIdx}"
            value="${st.varasPorPaq}" min="1"
            onchange="recepUpdVaras(${globalIdx}, this.value)"
            ${!st.checked ? 'disabled style="opacity:.5"' : ''}>
          <div style="font-size:9px;color:var(--mid-gray)">unidades</div>
        </div>
        <div style="text-align:center;min-width:70px">
          <div style="font-size:10px;color:var(--mid-gray)">Total varas</div>
          <strong style="font-size:18px;color:${st.checked?'var(--sage-dark)':'var(--mid-gray)'}" id="recep-total-${globalIdx}">${st.checked ? totalVaras : '—'}</strong>
        </div>
        <div style="text-align:center;width:36px">
          ${st.checked
            ? (paqOk
              ? '<span style="font-size:18px">✅</span>'
              : '<span style="font-size:18px">⚠️</span><div style="font-size:9px;color:var(--amber)">Faltante</div>')
            : '<span style="font-size:18px;opacity:.3">⬜</span>'
          }
        </div>
      </div>
      <div class="recep-footer">
        <div class="recep-progress">
          ${st.checked
            ? `<strong>${st.paqRecibidos}</strong> de <strong>${order.qty}</strong> paquetes`
              + (paqOk ? '' : ` <span style="color:var(--amber);font-weight:600">· Faltaron ${order.qty - st.paqRecibidos} paq — RECLAMAR</span>`)
              + ` · <strong>${totalVaras} varas totales</strong>`
              + `<span style="color:var(--green-ok);font-weight:600"> (${st.paqRecibidos} paq × ${st.varasPorPaq} varas)</span>`
            : '<span style="color:var(--mid-gray)">Pendiente — tildá para registrar</span>'}
        </div>
        ${st.checked && totalVaras > 0
          ? `<button onclick="recepConfirmar(${globalIdx})" style="background:var(--green-ok);color:white;border:none;border-radius:6px;padding:7px 16px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;white-space:nowrap">✓ Al stock · ${totalVaras} varas</button>`
          : ''}
      </div>
    </div>`;
  }).join('');
  recepUpdateGlobal(pending);
}

function recepUpdateGlobal(pending){
  if(!pending){
    pending = comprasFlore
      .map((c,i) => ({...c, _idx: i}))
      .filter(c => c.estado !== 'recibido');
  }
  const total   = pending.length;
  const checked = pending.filter(o => recepState[o._idx]?.checked).length;
  const progEl  = document.getElementById('recep-global-progress');
  const wrapEl  = document.getElementById('recep-confirm-all-wrap');
  const summEl  = document.getElementById('recep-confirm-summary');
  const btnEl   = document.getElementById('recep-btn-all');
  if(progEl) progEl.innerHTML = `<strong>${checked}</strong> de <strong>${total}</strong> ítems controlados`;
  if(wrapEl) wrapEl.style.display = checked > 0 ? '' : 'none';
  if(summEl && checked > 0){
    const items = pending
      .filter(o => recepState[o._idx]?.checked)
      .map(o => {
        const st = recepState[o._idx];
        const tv = (parseFloat(st.paqRecibidos)||0) * (parseFloat(st.varasPorPaq)||1);
        return `<strong>${tv}</strong> varas de ${esc(o.prod)}`;
      })
      .join(' · ');
    summEl.innerHTML = `Vas a confirmar: ${items}`;
  }
  if(btnEl) btnEl.disabled = checked === 0;
}

function recepCheckAll(){
  const pending = comprasFlore
    .map((c,i) => ({...c, _idx: i}))
    .filter(c => c.estado !== 'recibido');
  pending.forEach(o => {
    if(!recepState[o._idx]) recepState[o._idx] = {};
    recepState[o._idx].checked = true;
    if(!recepState[o._idx].paqRecibidos) recepState[o._idx].paqRecibidos = o.qty;
    if(!recepState[o._idx].varasPorPaq) recepState[o._idx].varasPorPaq = 1;
  });
  renderRecepcionPedidos();
}

function recepUncheckAll(){
  recepState = {};
  renderRecepcionPedidos();
}

async function recepConfirmarTodo(){
  const pending = comprasFlore
    .map((c,i) => ({...c, _idx: i}))
    .filter(c => c.estado !== 'recibido');
  const toConfirm = pending.filter(o => recepState[o._idx]?.checked);
  if(toConfirm.length === 0){ showToast('Marcá al menos un ítem.','error'); return; }
  const parciales = toConfirm.filter(o => parseFloat(recepState[o._idx].paqRecibidos) < parseFloat(o.qty));
  let msg = `¿Confirmar recepción de ${toConfirm.length} ítem${toConfirm.length>1?'s':''}?`;
  if(parciales.length > 0) msg += `\n\n⚠️ ${parciales.length} ítem${parciales.length>1?'s':''}con faltantes en paquetes — reclamar al proveedor.`;
  const totalVarasGlobal = toConfirm.reduce((s,o) => {
    const st = recepState[o._idx];
    return s + (parseFloat(st.paqRecibidos)||0) * (parseFloat(st.varasPorPaq)||1);
  }, 0);
  msg += `\n\n📊 Total a ingresar al stock: ${totalVarasGlobal} varas.`;
  msg += '\n\nEl stock se actualizará y los ítems desaparecerán de esta lista.';
  if(!await confirmModal(msg)) return;
  toConfirm.forEach(o => {
    const st = recepState[o._idx];
    const paqRec = parseFloat(st.paqRecibidos) || 0;
    const varasPaq = parseFloat(st.varasPorPaq) || 1;
    const totalVaras = paqRec * varasPaq;
    if(totalVaras > 0){
      const prodLower = o.prod.toLowerCase();
      let matched = false;
      stockData.forEach(s => {
        if(s.prod.toLowerCase().includes(prodLower) || prodLower.includes(s.prod.toLowerCase())){
          s.actual = +Math.max(0, s.actual + totalVaras).toFixed(1);
          matched = true;
        }
      });
      if(!matched) stockData.push({ prod: o.prod, area: o.sector||'Sin área', min:1, max:Math.max(totalVaras*2,4), actual:totalVaras });
    }
    comprasFlore[o._idx].estado = 'recibido';
    comprasFlore[o._idx].paqRecibidos = paqRec;
    comprasFlore[o._idx].varasPorPaq = varasPaq;
    comprasFlore[o._idx].totalVaras = totalVaras;
    // AUTO-PRECIO: costo por vara → cotizador
    const costoTotal = parseMoney(o.costo);
    if(costoTotal > 0 && varasPaq > 0){
      cotizadorPrecios[o.prod] = Math.round(costoTotal / varasPaq);
    }
    delete recepState[o._idx];
  });
  fbSave('stockData', stockData);
  window._comprasFloreLastSave = Date.now(); fbSave('comprasFlore', comprasFlore);
  fbSave('cotizadorPrecios', cotizadorPrecios);
  showToast(`✅ ${toConfirm.length} ítem${toConfirm.length>1?'s ingresados':' ingresado'} al stock — precios del cotizador actualizados`);
  renderRecepcionPedidos();
  if(document.getElementById('page-stock')?.classList.contains('active')) renderStock();
  if(document.getElementById('page-compras-floreria')?.classList.contains('active')) renderCompras('floreria');
}


function recepToggle(globalIdx, checked){
  if(!recepState[globalIdx]) recepState[globalIdx] = {};
  recepState[globalIdx].checked = checked;
  if(checked){
    const order = comprasFlore[globalIdx];
    if(!recepState[globalIdx].paqRecibidos)
      recepState[globalIdx].paqRecibidos = order.qty;
    if(!recepState[globalIdx].varasPorPaq)
      recepState[globalIdx].varasPorPaq = 1;
  }
  renderRecepcionPedidos();
}

function recepUpdPaq(globalIdx, val){
  if(!recepState[globalIdx]) recepState[globalIdx] = {};
  recepState[globalIdx].paqRecibidos = Math.max(0, parseFloat(val)||0);
  renderRecepcionPedidos();
}

function recepUpdVaras(globalIdx, val){
  if(!recepState[globalIdx]) recepState[globalIdx] = {};
  recepState[globalIdx].varasPorPaq = Math.max(1, parseFloat(val)||1);
  renderRecepcionPedidos();
}

function recepConfirmar(globalIdx){
  const order = comprasFlore[globalIdx];
  const st    = recepState[globalIdx];
  if(!st || !st.checked) return;

  const paqRec = parseFloat(st.paqRecibidos) || 0;
  const varasPaq = parseFloat(st.varasPorPaq) || 1;
  const totalVaras = paqRec * varasPaq;
  if(totalVaras <= 0){ showToast('⚠️ Ingresá paquetes y varas por paquete'); return; }

  // Update stock inmediato
  const prodLower = order.prod.toLowerCase();
  let matched = false;
  stockData.forEach(s => {
    if(s.prod.toLowerCase().includes(prodLower) || prodLower.includes(s.prod.toLowerCase())){
      s.actual = +Math.max(0, s.actual + totalVaras).toFixed(1);
      matched = true;
    }
  });
  if(!matched){
    stockData.push({
      prod: order.prod,
      area: order.sector || 'Sin área',
      min: 1,
      max: Math.max(totalVaras * 2, 4),
      actual: totalVaras
    });
  }
  fbSave('stockData', stockData);

  // Update order estado
  comprasFlore[globalIdx].estado = 'recibido';
  comprasFlore[globalIdx].paqRecibidos = paqRec;
  comprasFlore[globalIdx].varasPorPaq = varasPaq;
  comprasFlore[globalIdx].totalVaras = totalVaras;
  window._comprasFloreLastSave = Date.now(); fbSave('comprasFlore', comprasFlore);

  // AUTO-PRECIO: calcular costo por vara y actualizar cotizador
  const costoTotal = parseMoney(order.costo);
  if(costoTotal > 0 && varasPaq > 0){
    const costoVara = Math.round(costoTotal / varasPaq);
    cotizadorPrecios[order.prod] = costoVara;
    fbSave('cotizadorPrecios', cotizadorPrecios);
  }

  // Clear state
  delete recepState[globalIdx];

  showToast(`✅ ${totalVaras} varas de "${order.prod}" ingresadas al stock (${paqRec} paq × ${varasPaq} varas)`);
  renderRecepcionPedidos();
  if(document.getElementById('page-stock')?.classList.contains('active')) renderStock();
  if(document.getElementById('page-compras-floreria')?.classList.contains('active')) renderCompras('floreria');
}

// ════════════════════════════════════════
// BOOT
// ════════════════════════════════════════
(function init(){
  renderHome();
  updateKpiCompras();
  let co=0,at=0;
  stockData.forEach(s=>{const comp=getStockComprometido(s);const a=getAlerta(s,comp);if(a==='comprar')co++;else if(a==='atencion')at++;});
  const _kc=document.getElementById('kpi-comprar'); if(_kc) _kc.textContent=co;
  const _ka=document.getElementById('kpi-atencion'); if(_ka) _ka.textContent=at;
  const _htc=document.getElementById('home-tasks-count'); if(_htc) _htc.textContent=CL_TASKS.length;
})();

// ═══════════════════════════════════════
// CONTROL COORDINADOR — DATA (from Excel)
// ═══════════════════════════════════════
const JARDINERIA_BASE = [
  {section:"Palacio",group:"Entrada Alvear",task:"Rosales nunciature",last:"2026-05-19",visits:9},
  {section:"Palacio",group:"Entrada Alvear",task:"Rosales McGuire",last:"2026-05-19",visits:9},
  {section:"Palacio",group:"Entrada Alvear",task:"Buxus",last:"2026-05-19",visits:5},
  {section:"Palacio",group:"Entrada Alvear",task:"Magnolias",last:"2026-05-19",visits:5},
  {section:"Palacio",group:"Entrada Alvear",task:"Geranios Biblioteca",last:"2026-05-11",visits:2},
  {section:"Palacio",group:"Entrada Alvear",task:"Geranios Salón Privado",last:null,visits:0},
  {section:"Palacio",group:"Patio del Gimnasio",task:"Cantero de azaleas",last:"2026-05-15",visits:3},
  {section:"Palacio",group:"Patio del Gimnasio",task:"Cantero de monsteras",last:"2026-05-15",visits:3},
  {section:"Palacio",group:"Patio del Gimnasio",task:"Fuente",last:"2026-05-19",visits:4},
  {section:"Palacio",group:"Patio del Gimnasio",task:"Monsteras McGuire",last:"2026-05-15",visits:2},
  {section:"Palacio",group:"2do Piso",task:"Laureles de Jardín",last:"2026-05-18",visits:4},
  {section:"Palacio",group:"2do Piso",task:"Habitaciones",last:"2026-05-18",visits:5},
  {section:"Palacio",group:"2do Piso",task:"Orquídeas",last:"2026-05-18",visits:3},
  {section:"Palacio",group:"3ro y 4to Piso",task:"Jardineras con geranios",last:"2026-05-15",visits:5},
  {section:"Palacio",group:"3ro y 4to Piso",task:"Habitaciones",last:"2026-05-18",visits:7},
  {section:"Palacio",group:"3ro y 4to Piso",task:"Orquídeas",last:"2026-05-18",visits:4},
  {section:"Palacio",group:"3ro y 4to Piso",task:"Macetas con azareros (Azotea)",last:"2026-05-19",visits:2},
  {section:"Jardín Central",group:"Patio de la Florería",task:"Eugenias",last:"2026-05-19",visits:9},
  {section:"Jardín Central",group:"Patio de la Florería",task:"Kinotos",last:"2026-05-19",visits:9},
  {section:"Jardín Central",group:"Patio de la Florería",task:"Azareros",last:"2026-05-19",visits:9},
  {section:"Jardín Central",group:"Patio de la Florería",task:"Acer",last:"2026-05-19",visits:9},
  {section:"Jardín Central",group:"Patio de la Florería",task:"Monstera",last:"2026-05-16",visits:7},
  {section:"Jardín Central",group:"Terraza de Duhau",task:"Maceteros con Buxus",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Terraza de Piano Nobile",task:"Orquídeas Piano",last:"2026-05-19",visits:4},
  {section:"Jardín Central",group:"Terraza de Piano Nobile",task:"Cantero azalea Nunciatura",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Terraza de Piano Nobile",task:"Cantero azalea McGuire",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Terraza de Piano Nobile",task:"Macetitas de suculentas de mesas",last:"2026-05-19",visits:5},
  {section:"Jardín Central",group:"Cantero de Rosales Nunciatura",task:"Rosales Pierre de Rosan",last:"2026-05-19",visits:11},
  {section:"Jardín Central",group:"Cantero de Rosales Nunciatura",task:"Azarero",last:"2026-05-19",visits:10},
  {section:"Jardín Central",group:"Cantero de Rosales Nunciatura",task:"Helecho",last:"2026-05-19",visits:10},
  {section:"Jardín Central",group:"Cantero de Rosales Nunciatura",task:"Ericas",last:"2026-05-19",visits:10},
  {section:"Jardín Central",group:"Cantero de Rosales Nunciatura",task:"Cantero de geranios",last:"2026-05-19",visits:11},
  {section:"Jardín Central",group:"Cantero de azaleas McGuire",task:"Cantero de azaleas McGuire",last:"2026-05-05",visits:1},
  {section:"Jardín Central",group:"Cantero de azaleas McGuire",task:"Azaleas",last:"2026-05-19",visits:7},
  {section:"Jardín Central",group:"Césped Central",task:"Césped",last:"2026-05-19",visits:9},
  {section:"Jardín Central",group:"Césped Central",task:"Cycas",last:"2026-05-19",visits:8},
  {section:"Jardín Central",group:"Césped Central",task:"Rosales iceberg",last:"2026-05-19",visits:11},
  {section:"Jardín Central",group:"Césped Central",task:"Violetas rastreras",last:"2026-05-19",visits:9},
  {section:"Jardín Central",group:"Césped Central",task:"Azaleas",last:"2026-05-19",visits:8},
  {section:"Jardín Central",group:"Barra de Gioia",task:"Copones alegrías del hogar rojas",last:"2026-05-15",visits:7},
  {section:"Jardín Central",group:"Barra de Gioia",task:"Agaphantus enanos",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Barra de Gioia",task:"Canteros fijos de buxus Gioia",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Barra de Gioia",task:"Canteros móviles de buxus Gioia",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Cantero de Cipreses",task:"Neomaricas",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Cantero de Cipreses",task:"Magnolia",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Cantero Acer Palmatum",task:"Acer Palmatum",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Cantero Acer Palmatum",task:"Vincas",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Cantero Acer Palmatum",task:"Azaleas",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Terraza de la Tipa",task:"Tipa",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Terraza de la Tipa",task:"Cantero de ophiopogum",last:"2026-05-19",visits:7},
  {section:"Jardín Central",group:"Terraza de la Tipa",task:"Buxus",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Bosquecito de Ginkgos",task:"Macetas (12) alegrías del hogar blancas",last:"2026-05-14",visits:3},
  {section:"Jardín Central",group:"Bosquecito de Ginkgos",task:"Acer Palmatum",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Bosquecito de Ginkgos",task:"Azarero",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Bosquecito de Ginkgos",task:"Ginkgos",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Bosquecito de Ginkgos",task:"Azalea",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Bosquecito de Ginkgos",task:"Aspidistras",last:"2026-05-19",visits:6},
  {section:"Jardín Central",group:"Bosquecito de Ginkgos",task:"Buxus (ventana lobby Posadas)",last:"2026-05-19",visits:6},
  {section:"Edificio Posadas",group:"Entrada Posadas",task:"Cantero de azaleas",last:"2026-05-19",visits:6},
  {section:"Edificio Posadas",group:"Entrada Posadas",task:"Macetas entrada de reja",last:"2026-05-19",visits:5},
  {section:"Edificio Posadas",group:"Entrada Posadas",task:"Cantero de helechos cyrtonium",last:"2026-05-19",visits:5},
  {section:"Edificio Posadas",group:"Pared de Helechos",task:"Helechos",last:"2026-05-18",visits:4},
  {section:"Edificio Posadas",group:"Pared de Helechos",task:"Cantero aspidistras",last:"2026-05-18",visits:4},
  {section:"Edificio Posadas",group:"Terraza de 5to Piso",task:"Palos borrachos",last:"2026-05-19",visits:2},
  {section:"Edificio Posadas",group:"Terraza de 5to Piso",task:"Cantero",last:"2026-05-19",visits:3},
  {section:"Edificio Posadas",group:"Huerta — Revisión General",task:"Estado sanitario de cada módulo",last:"2026-05-19",visits:11},
  {section:"Edificio Posadas",group:"Huerta — Revisión General",task:"Uniformidad de crecimiento",last:"2026-05-19",visits:11},
  {section:"Edificio Posadas",group:"Huerta — Revisión General",task:"Detección de estrés hídrico",last:"2026-05-19",visits:11},
  {section:"Edificio Posadas",group:"Huerta — Control de Volumen",task:"Altura máxima 40–50 cm",last:"2026-05-19",visits:11},
  {section:"Edificio Posadas",group:"Huerta — Control de Volumen",task:"Recorte selectivo",last:"2026-05-19",visits:10},
  {section:"Edificio Posadas",group:"Huerta — Control de Volumen",task:"Eliminación de material desprolijo",last:"2026-05-19",visits:11},
  {section:"Edificio Posadas",group:"Huerta — Orden Visual",task:"Bordes limpios",last:"2026-05-19",visits:10},
  {section:"Edificio Posadas",group:"Huerta — Orden Visual",task:"Sin hojas secas visibles",last:"2026-05-19",visits:11},
  {section:"Edificio Posadas",group:"Huerta — Orden Visual",task:"Sin tierra desbordada",last:"2026-05-19",visits:11},
  {section:"Edificio Posadas",group:"Huerta — Orden Visual",task:"Sin herramientas olvidadas",last:"2026-05-19",visits:11},
  {section:"Edificio Posadas",group:"Huerta — Orden Visual",task:"Superficie homogénea",last:"2026-05-19",visits:10},
  {section:"Edificio Posadas",group:"Huerta — Sistema de Riego",task:"Revisión visual de goteros",last:"2026-05-19",visits:10},
  {section:"Edificio Posadas",group:"Huerta — Sistema de Riego",task:"Verificación humedad sustrato",last:"2026-05-19",visits:11},
  {section:"Edificio Posadas",group:"Huerta — Sistema de Riego",task:"Ajuste estacional si corresponde",last:"2026-05-19",visits:9},
  {section:"Edificio Posadas",group:"Pisos 5to al 17",task:"Habitaciones",last:"2026-05-18",visits:7},
  {section:"Edificio Posadas",group:"Pisos 5to al 17",task:"Plantas de los pasillos",last:"2026-05-18",visits:6},
];

const HABITACIONES_BASE = [
  {hab:"201",last:"2026-05-12",visits:14,notas:""},
  {hab:"202",last:"2026-05-04",visits:13,notas:""},
  {hab:"203",last:"2026-05-11",visits:6,notas:""},
  {hab:"204",last:"2026-05-06",visits:7,notas:""},
  {hab:"207",last:"2026-05-18",visits:5,notas:""},
  {hab:"208",last:"2026-05-18",visits:10,notas:""},
  {hab:"209",last:"2026-05-18",visits:9,notas:""},
  {hab:"302",last:"2026-05-11",visits:11,notas:""},
  {hab:"303",last:"2026-05-18",visits:11,notas:""},
  {hab:"304",last:"2026-05-07",visits:5,notas:""},
  {hab:"306",last:"2026-05-12",visits:12,notas:""},
  {hab:"307",last:"2026-05-12",visits:14,notas:""},
  {hab:"308",last:"2026-05-04",visits:7,notas:""},
  {hab:"309",last:"2026-05-12",visits:9,notas:""},
  {hab:"401",last:"2026-05-09",visits:10,notas:""},
  {hab:"402",last:"2026-05-09",visits:23,notas:""},
  {hab:"403",last:"2026-05-18",visits:10,notas:""},
  {hab:"404",last:"2026-05-12",visits:16,notas:""},
  {hab:"405",last:"2026-05-18",visits:8,notas:""},
  {hab:"504",last:"2026-05-18",visits:8,notas:""},
  {hab:"505",last:"2026-05-07",visits:8,notas:""},
  {hab:"506",last:"2026-05-18",visits:12,notas:""},
  {hab:"507",last:"2026-05-18",visits:8,notas:""},
  {hab:"508",last:"2026-05-06",visits:12,notas:""},
  {hab:"510",last:"2026-05-18",visits:12,notas:""},
  {hab:"511",last:"2026-05-18",visits:11,notas:""},
  {hab:"512",last:"2026-04-23",visits:8,notas:""},
  {hab:"1307",last:"2026-05-18",visits:9,notas:""},
  {hab:"1308",last:"2026-05-07",visits:16,notas:""},
  {hab:"1309",last:"2026-05-12",visits:16,notas:""},
  {hab:"1310",last:"2026-05-12",visits:9,notas:""},
  {hab:"1409",last:"2026-04-17",visits:9,notas:""},
];


// Runtime state
let jardineriaData = JARDINERIA_BASE.map(r=>({...r,liveVisits:0,monthlyVisits:{}}));
let habitacionesData = HABITACIONES_BASE.map(r=>({...r,liveVisits:0,monthlyVisits:{}}));
let jardineriaLog = [];
let habitacionesLog = [];
window.jardHorarios = {};
window.florTurnos = {};
let jardCurrentJardinero = (()=>{ try{ return localStorage.getItem('jardCurrentJardinero')||''; }catch(e){ return ''; } })();
const JARDINEROS_LIST = ['Sole','Berni','Ivan'];
// Sincroniza la lista COMPLETA desde Firebase (permite que gerencia agregue,
// renombre o elimine tareas y que se propague al equipo). La estructura de
// Firebase es la fuente de verdad; se conservan los campos de estado de cada tarea.
window._setJardineriaData = (arr) => {
  if(!Array.isArray(arr) || !arr.length) return;
  const next = arr.map(r => ({
    section: r.section || '', group: r.group || '', task: r.task || '',
    last: r.last ?? null,
    liveVisits:    r.liveVisits    || 0,
    monthlyVisits: r.monthlyVisits || {},
    obs:        r.obs        || '',
    quien:      r.quien      || '',
    horaInicio: r.horaInicio || '',
    horaFin:    r.horaFin    || '',
    canUndo: false,
  }));
  jardineriaData.splice(0, jardineriaData.length, ...next);
};
window._setHabitacionesData = (arr) => {
  arr.forEach((r, i) => {
    if(i >= habitacionesData.length) return;
    habitacionesData[i].last         = r.last;
    habitacionesData[i].liveVisits   = r.liveVisits   || 0;
    habitacionesData[i].monthlyVisits= r.monthlyVisits|| {};
    habitacionesData[i].canUndo      = false;
    if(r.obs       !== undefined) habitacionesData[i].obs       = r.obs;
    if(r.notas     !== undefined) habitacionesData[i].notas     = r.notas;
    if(r.comentarioHK !== undefined) habitacionesData[i].comentarioHK = r.comentarioHK;
    if(r.quien     !== undefined) habitacionesData[i].quien     = r.quien;
    if(r.horaInicio!== undefined) habitacionesData[i].horaInicio= r.horaInicio;
    if(r.horaFin   !== undefined) habitacionesData[i].horaFin   = r.horaFin;
  });
};
window._setJardineriaLog = (arr) => { jardineriaLog.splice(0, jardineriaLog.length, ...arr); };
window._setHabitacionesLog = (arr) => { habitacionesLog.splice(0, habitacionesLog.length, ...arr); };

// ── RECORDATORIOS JARDINERÍA ─────────────────────────────────────────────────
window._setJardRecordatorios = (arr) => {
  jardRecordatorios.splice(0, jardRecordatorios.length, ...arr);
  // Aviso en vivo a operarios cuando gerencia agrega recordatorios
  renderJardRecAviso();
  notificarRecordatoriosNuevos();
};

// ── ALERTAS URGENTES DE JARDÍN (foto) ─────────────────────────────────────────
// Gerencia carga una foto de algo del jardín que requiere atención urgente
// (zona + qué hacer). Les salta a los jardineros al instante como urgente.
const JARD_ALERTA_TIPOS = ['Poda','Riego','Fertilización','Desmalezado','Plaga','Limpieza','Otro'];
const JARD_ALERTA_ICON = { 'Poda':'✂️','Riego':'💧','Fertilización':'🌱','Desmalezado':'🌿','Plaga':'🐛','Limpieza':'🧹','Otro':'⚠️' };

window._setJardAlertas = (arr) => {
  const prev = jardAlertas.length;
  jardAlertas.splice(0, jardAlertas.length, ...(Array.isArray(arr)?arr:Object.values(arr||{})));
  renderAlertasUrgentesJard();
  // Aviso a jardineros/combinados cuando entra una alerta nueva (no en la carga inicial)
  if(prev>0) notificarAlertasUrgentes();
};

function _alertasActivas(){ return jardAlertas.filter(a=>a && !a.resuelto); }

let _fotoAlertaData = '';
function openAlertaJardinModal(){
  if(userRole!=='gerencia'){ showToast('⛔ Solo gerencia'); return; }
  _fotoAlertaData = '';
  const sel = document.getElementById('alerta-jard-tipo');
  if(sel) sel.innerHTML = JARD_ALERTA_TIPOS.map(t=>`<option value="${t}">${JARD_ALERTA_ICON[t]} ${t}</option>`).join('');
  document.getElementById('alerta-jard-zona').value = '';
  document.getElementById('alerta-jard-nota').value = '';
  document.getElementById('alerta-jard-file').value = '';
  const p = document.getElementById('alerta-jard-preview'); if(p){ p.src=''; p.style.display='none'; }
  document.getElementById('alerta-jard-modal').classList.add('open');
}

function alertaJardFotoPreview(input){
  const file = input.files[0]; if(!file) return;
  comprimirImagen(file, 1000, 0.7, data => {
    _fotoAlertaData = data;
    const p = document.getElementById('alerta-jard-preview');
    if(p){ p.src = data; p.style.display = 'block'; }
  });
}

function guardarAlertaJardin(){
  const zona = document.getElementById('alerta-jard-zona').value.trim();
  const tipo = document.getElementById('alerta-jard-tipo').value;
  const nota = document.getElementById('alerta-jard-nota').value.trim();
  if(!zona){ showToast('⚠️ Indicá la zona'); return; }
  const alerta = { id: Date.now(), zona, tipo, nota, foto: _fotoAlertaData||'', creado: Date.now(), por: window.currentUserLabel||'Gerencia', resuelto: false };
  jardAlertas.unshift(alerta);
  fbSave('jardAlertas', jardAlertas);
  // Push real a jardineros (incluye combinados como Ivan)
  window.pushSend?.('🚨 Jardín URGENTE: '+tipo, `${zona}${nota?' — '+nota:''}`, 'jard-urgente', 'roles:jardinero');
  closeModal('alerta-jard-modal');
  renderAlertasUrgentesJard();
  showToast('🚨 Alerta enviada a los jardineros');
}

async function resolverAlertaJardin(id){
  const a = jardAlertas.find(x=>x.id===id);
  if(!a) return;
  if(!await confirmModal(`¿Marcar como resuelta la alerta de ${a.tipo} en "${a.zona}"?`)) return;
  a.resuelto = true; a.resueltoPor = window.currentUserLabel||''; a.resueltoFecha = TODAY_ISO;
  fbSave('jardAlertas', jardAlertas);
  renderAlertasUrgentesJard();
  showToast('✅ Alerta resuelta');
}

function _alertaAplica(){ return userRole==='jardinero' || userRole==='gerencia' || (userRole==='florista' && !!jardineroNombre); }

const _alertasAvisadas = new Set();
function notificarAlertasUrgentes(){
  if(!_alertaAplica() || userRole==='gerencia') return;
  _alertasActivas().forEach(a=>{
    if(_alertasAvisadas.has(a.id)) return;
    _alertasAvisadas.add(a.id);
    showToast(`🚨 Jardín urgente: ${a.tipo} en ${a.zona}`);
    if(typeof Notification!=='undefined' && Notification.permission==='granted'){
      try{ new Notification('🚨 Jardín URGENTE: '+a.tipo, { body:`${a.zona}${a.nota?' — '+a.nota:''}`, icon:'/icon-192.png', tag:'jard-urgente' }); }catch(e){}
    }
  });
}

function renderAlertasUrgentesJard(){
  const activas = _alertasActivas();
  const esGerencia = userRole==='gerencia';
  const html = activas.length ? `
    <div class="jalert-wrap">
      <div class="jalert-hdr">🚨 ${activas.length} ${activas.length===1?'atención urgente':'atenciones urgentes'} del jardín</div>
      ${activas.map(a=>`<div class="jalert-card">
        ${a.foto?`<img src="${a.foto}" class="jalert-foto" onclick="verFotoAlerta(${a.id})" alt="">`:''}
        <div class="jalert-body">
          <div class="jalert-tipo">${JARD_ALERTA_ICON[a.tipo]||'⚠️'} ${esc(a.tipo)}</div>
          <div class="jalert-zona">${esc(a.zona)}</div>
          ${a.nota?`<div class="jalert-nota">${esc(a.nota)}</div>`:''}
          <div class="jalert-meta">Cargado por ${esc(a.por||'gerencia')}</div>
        </div>
        <button class="jalert-btn" onclick="resolverAlertaJardin(${a.id})">✓ Resuelto</button>
      </div>`).join('')}
    </div>` : (esGerencia ? '' : '');
  ['jops-alertas-urgentes','ctrl-jard-alertas'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
}

function verFotoAlerta(id){
  const a = jardAlertas.find(x=>x.id===id);
  if(!a?.foto) return;
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer';
  ov.innerHTML=`<img src="${a.foto}" style="max-width:94vw;max-height:90vh;border-radius:12px">`;
  ov.onclick=()=>ov.remove();
  document.body.appendChild(ov);
}

// ── LLAMADOS DE ATENCIÓN (checklist floreria) ────────────────────────────────
// Gerencia saca una foto de un error en un arreglo y se lo envía al responsable.
// Queda registrado en RRHH › Evaluaciones como historial de errores por persona.
let llamadosData = [];
window._setLlamadosData = (arr) => {
  llamadosData.splice(0, llamadosData.length, ...(Array.isArray(arr)?arr:Object.values(arr||{})));
  if(document.getElementById('page-checklist')?.classList.contains('active')) renderLlamadosChecklist();
  if(document.getElementById('page-evaluaciones')?.classList.contains('active')) renderLlamadosEval();
  notificarLlamados();
};

function _llamadosActivos(){ return llamadosData.filter(l=>l && !l.resuelto); }

let _fotoLlamadoData = '';
function openLlamadoModal(){
  if(userRole!=='gerencia'){ showToast('⛔ Solo gerencia'); return; }
  _fotoLlamadoData = '';
  const zonaSel = document.getElementById('llamado-zona');
  if(zonaSel){
    const zonas = [...new Set(CL_TASKS.map(t=>t.zona))];
    zonaSel.innerHTML = '<option value="">— Arreglo / zona —</option>' + zonas.map(z=>`<option value="${esc(z)}">${esc(z)}</option>`).join('');
  }
  const persSel = document.getElementById('llamado-persona');
  if(persSel){
    persSel.innerHTML = '<option value="">— Responsable —</option>' + CL_RESP_OPTS.filter(n=>n!=='Jardineria').map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
  }
  document.getElementById('llamado-nota').value = '';
  document.getElementById('llamado-file').value = '';
  const p = document.getElementById('llamado-preview'); if(p){ p.src=''; p.style.display='none'; }
  document.getElementById('llamado-modal').classList.add('open');
}

// Al elegir el arreglo, autoseleccionar el responsable de esa zona (día actual)
function llamadoOnZonaChange(){
  const zona = document.getElementById('llamado-zona').value;
  if(!zona) return;
  const idx = CL_TASKS.findIndex(t=>t.zona===zona);
  if(idx<0) return;
  const resp = (clState && clState.responsable && clState.responsable[idx]) || CL_TASKS[idx].responsable || '';
  const persSel = document.getElementById('llamado-persona');
  if(resp && persSel && [...persSel.options].some(o=>o.value===resp)) persSel.value = resp;
}

function llamadoFotoPreview(input){
  const file = input.files[0]; if(!file) return;
  comprimirImagen(file, 1200, 0.7, data => {
    _fotoLlamadoData = data;
    const p = document.getElementById('llamado-preview');
    if(p){ p.src = data; p.style.display='block'; }
  });
}

function guardarLlamado(){
  const zona = document.getElementById('llamado-zona').value;
  const persona = document.getElementById('llamado-persona').value;
  const nota = document.getElementById('llamado-nota').value.trim();
  if(!persona){ showToast('⚠️ Elegí el responsable'); return; }
  if(!nota && !_fotoLlamadoData){ showToast('⚠️ Agregá una nota o una foto'); return; }
  const leg = legajoData.find(l=>(l.nombre+' '+l.apellido).trim()===persona || l.nombre===persona);
  const ll = {
    id: Date.now(),
    empleadoNombre: persona,
    empleadoId: leg?leg.id:'',
    zona: zona||'',
    nota,
    foto: _fotoLlamadoData||'',
    fecha: TODAY_ISO,
    creado: Date.now(),
    por: window.currentUserLabel||'Gerencia',
    resuelto: false,
    visto: false,
  };
  llamadosData.unshift(ll);
  fbSave('llamadosData', llamadosData);
  window.pushSend?.('⚠️ Llamado de atención', `${zona?zona+': ':''}${nota||'Revisá tu arreglo'}`, 'llamado', persona);
  closeModal('llamado-modal');
  renderLlamadosChecklist();
  showToast('⚠️ Llamado enviado a '+persona+' y registrado en Evaluaciones');
}

const _llamadosAvisados = new Set();
function notificarLlamados(){
  if(userRole==='gerencia' || !floristaNombre) return;
  _llamadosActivos().filter(l=>l.empleadoNombre===floristaNombre && !l.visto).forEach(l=>{
    if(_llamadosAvisados.has(l.id)) return;
    _llamadosAvisados.add(l.id);
    showToast('⚠️ Tenés un llamado de atención de gerencia');
    if(typeof Notification!=='undefined' && Notification.permission==='granted'){
      try{ new Notification('⚠️ Llamado de atención', {body:`${l.zona?l.zona+': ':''}${l.nota||''}`, icon:'/icon-192.png', tag:'llamado'}); }catch(e){}
    }
  });
}

function renderLlamadosChecklist(){
  const el = document.getElementById('cl-llamados');
  if(!el) return;
  let lista;
  if(userRole==='gerencia') lista = _llamadosActivos();
  else if(floristaNombre) lista = _llamadosActivos().filter(l=>l.empleadoNombre===floristaNombre);
  else lista = [];
  if(!lista.length){ el.innerHTML=''; return; }
  el.innerHTML = `<div class="jalert-wrap" style="border-color:#C99A00;background:#FFFBF0">
    <div class="jalert-hdr" style="color:#8A6D00">⚠️ ${lista.length} ${lista.length===1?'llamado de atención':'llamados de atención'}</div>
    ${lista.map(l=>`<div class="jalert-card">
      ${l.foto?`<img src="${l.foto}" class="jalert-foto" onclick="verFotoLlamado(${l.id})" alt="">`:''}
      <div class="jalert-body">
        <div class="jalert-tipo">⚠️ ${esc(l.zona||'Arreglo')}</div>
        ${userRole==='gerencia'?`<div class="jalert-zona">Para: ${esc(l.empleadoNombre)}</div>`:''}
        ${l.nota?`<div class="jalert-nota">${esc(l.nota)}</div>`:''}
        <div class="jalert-meta">${fmtDate(l.fecha)} · por ${esc(l.por||'gerencia')}</div>
      </div>
      <button class="jalert-btn" onclick="resolverLlamado(${l.id})">${userRole==='gerencia'?'✓ Cerrar':'✓ Entendido'}</button>
    </div>`).join('')}
  </div>`;
}

function verFotoLlamado(id){
  const l = llamadosData.find(x=>x.id===id);
  if(!l?.foto) return;
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer';
  ov.innerHTML=`<img src="${l.foto}" style="max-width:94vw;max-height:90vh;border-radius:12px">`;
  ov.onclick=()=>ov.remove();
  document.body.appendChild(ov);
}

async function resolverLlamado(id){
  const l = llamadosData.find(x=>x.id===id);
  if(!l) return;
  if(userRole==='gerencia' && !await confirmModal('¿Cerrar este llamado? Queda en el registro de Evaluaciones.')) return;
  l.resuelto = true; l.visto = true; l.resueltoFecha = TODAY_ISO;
  fbSave('llamadosData', llamadosData);
  renderLlamadosChecklist();
  if(document.getElementById('page-evaluaciones')?.classList.contains('active')) renderLlamadosEval();
  showToast('✅ Listo');
}

async function eliminarLlamado(id){
  if(userRole!=='gerencia') return;
  if(!await confirmModal('¿Eliminar este llamado del registro? Se borra la foto para siempre.')) return;
  const i = llamadosData.findIndex(x=>x.id===id);
  if(i>=0) llamadosData.splice(i,1);
  fbSave('llamadosData', llamadosData);
  renderLlamadosEval();
  showToast('🗑️ Registro eliminado');
}

// Registro de llamados en RRHH › Evaluaciones (agrupado por persona)
function renderLlamadosEval(){
  const el = document.getElementById('eval-llamados');
  if(!el) return;
  const search = (document.getElementById('ev-search')?.value||'').toLowerCase();
  let data = [...llamadosData];
  if(search) data = data.filter(l=>(l.empleadoNombre||'').toLowerCase().includes(search));
  if(!data.length){ el.innerHTML = `<div style="padding:16px;text-align:center;color:var(--mid-gray);font-size:13px">Sin llamados de atención registrados.</div>`; return; }
  const byPers = {};
  data.forEach(l=>{ (byPers[l.empleadoNombre]=byPers[l.empleadoNombre]||[]).push(l); });
  const personas = Object.keys(byPers).sort((a,b)=>byPers[b].length-byPers[a].length);
  el.innerHTML = personas.map(pers=>{
    const items = byPers[pers].sort((a,b)=>b.creado-a.creado);
    return `<div style="border:1px solid var(--light-gray);border-radius:10px;margin-bottom:12px;overflow:hidden">
      <div style="padding:10px 14px;background:#FFFBF0;display:flex;justify-content:space-between;align-items:center">
        <strong style="color:#8A6D00">⚠️ ${esc(pers)}</strong>
        <span style="font-size:12px;color:var(--mid-gray)">${items.length} llamado${items.length!==1?'s':''}</span>
      </div>
      <div style="display:flex;flex-direction:column">
        ${items.map(l=>`<div style="display:flex;gap:10px;align-items:center;padding:9px 14px;border-top:1px solid #F0EDE8">
          ${l.foto?`<img src="${l.foto}" onclick="verFotoLlamado(${l.id})" style="width:52px;height:52px;object-fit:cover;border-radius:6px;cursor:pointer;flex-shrink:0" alt="">`:'<div style="width:52px;height:52px;border-radius:6px;background:#F0EDE8;display:flex;align-items:center;justify-content:center;flex-shrink:0">⚠️</div>'}
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:var(--charcoal)">${esc(l.zona||'Arreglo')} ${l.resuelto?'<span style="font-size:10px;color:var(--green-ok)">✓ visto</span>':'<span style="font-size:10px;color:var(--amber)">pendiente</span>'}</div>
            ${l.nota?`<div style="font-size:12px;color:#7A7A72">${esc(l.nota)}</div>`:''}
            <div style="font-size:11px;color:var(--mid-gray)">${fmtDate(l.fecha)} · por ${esc(l.por||'gerencia')}</div>
          </div>
          <button class="btn-icon" style="color:var(--red-alert)" title="Eliminar del registro" onclick="eliminarLlamado(${l.id})">✕</button>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

const JARD_TIPOS_ICON = { 'Riego':'💧','Fertilización':'🌱','Desmalezado':'🌿','Poda':'✂️' };
const JARD_TIPO_STYLE = {
  'Riego':        'background:#E8F4FD;color:#1A6B9A',
  'Fertilización':'background:#EBF5E8;color:#2D6A2D',
  'Desmalezado':  'background:#FDF8E8;color:#7A5A00',
  'Poda':         'background:#FBE8E8;color:#8B2020',
};

function addDaysISO(iso, days){
  const d = new Date(iso); d.setDate(d.getDate()+days);
  return d.toISOString().split('T')[0];
}

function recEstado(rec){
  if(!rec.ultimaVez) return 'vencido';
  const dias = Math.floor((new Date(TODAY_ISO)-new Date(rec.ultimaVez))/86400000);
  if(dias >= rec.frecuencia) return 'vencido';
  if(dias >= rec.frecuencia - 3) return 'proximo';
  return 'ok';
}

function recDiasRestantes(rec){
  if(!rec.ultimaVez) return null;
  const dias = Math.floor((new Date(TODAY_ISO)-new Date(rec.ultimaVez))/86400000);
  return rec.frecuencia - dias;
}

function renderRecordatoriosJard(){
  if(!document.getElementById('jrec-kpis')) return;
  const vencidos = jardRecordatorios.filter(r=>recEstado(r)==='vencido');
  const proximos = jardRecordatorios.filter(r=>recEstado(r)==='proximo');
  const ok       = jardRecordatorios.filter(r=>recEstado(r)==='ok');
  const nuevosSet = new Set(getRecordatoriosNuevos());

  document.getElementById('jrec-kpis').innerHTML = `
    <div class="cards-grid cards-grid-3" style="margin-bottom:24px">
      <div class="card"><div class="card-label">🔴 Vencidos</div><div class="card-value red">${vencidos.length}</div><div class="card-sub">requieren atención ya</div></div>
      <div class="card"><div class="card-label">🟡 Próximos</div><div class="card-value amber">${proximos.length}</div><div class="card-sub">en los próximos 3 días</div></div>
      <div class="card"><div class="card-label">🟢 Al día</div><div class="card-value green">${ok.length}</div><div class="card-sub">sin vencer</div></div>
    </div>`;

  // Cartel de recordatorios nuevos agregados por gerencia (para operarios)
  const nuevosBanner = nuevosSet.size ? `<div class="jrec-aviso-banner" style="cursor:default">
      <span class="jrec-aviso-icon">🔔</span>
      <span><strong>${nuevosSet.size===1?'Gerencia agregó un recordatorio nuevo':'Gerencia agregó '+nuevosSet.size+' recordatorios nuevos'}:</strong> ${esc([...nuevosSet].map(r=>`${r.tipo} · ${r.task}`).join('  ·  '))}</span>
    </div>` : '';

  const alertas = [...vencidos,...proximos];
  document.getElementById('jrec-alertas').innerHTML = nuevosBanner + (alertas.length
    ? `<div class="section-title" style="margin-bottom:14px">⚠️ Alertas Activas</div>
       ${alertas.map(r=>{
         const idx=jardRecordatorios.indexOf(r);
         const est=recEstado(r);
         const dr=recDiasRestantes(r);
         const diasLabel = dr===null ? 'Sin registro previo'
           : est==='vencido' ? `Vencido hace ${Math.abs(dr)} día${Math.abs(dr)!==1?'s':''}`
           : `Vence en ${dr} día${dr!==1?'s':''}`;
         return `<div class="jrec-alert-row jrec-${est}">
           <div class="jrec-alert-left">
             <div class="jrec-alert-nombre">${esc(r.task)}${nuevosSet.has(r)?'<span class="jrec-nuevo-badge">Nuevo</span>':''}</div>
             <div class="jrec-alert-meta">${esc(r.section)} · ${esc(r.group)}</div>
             <span class="jrec-tipo-badge" style="${JARD_TIPO_STYLE[r.tipo]||''}">${JARD_TIPOS_ICON[r.tipo]||''} ${esc(r.tipo)} · cada ${r.frecuencia} días</span>
           </div>
           <div class="jrec-alert-right">
             <div class="jrec-dias-label jrec-${est}">${diasLabel}</div>
             <button class="btn-add" style="padding:7px 16px;font-size:12px;margin-top:6px" onclick="marcarRecordatorioHecho(${idx})">✓ Hecho hoy</button>
           </div>
         </div>`;
       }).join('')}`
    : `<div class="jrec-all-ok">✅ Todo al día — sin alertas pendientes</div>`);

  // Al abrir la sección, el operario queda al día: se limpian badge y carteles
  if(nuevosSet.size) marcarRecordatoriosVistos();

  // Tabla de configuración (solo gerencia)
  const cfg = document.getElementById('jrec-config');
  if(!cfg) return;
  if(userRole !== 'gerencia'){
    cfg.innerHTML=''; return;
  }
  cfg.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div class="section-title" style="margin:0">Todos los Recordatorios</div>
      <button class="btn-add" onclick="openRecordatorioModal(-1)">+ Nuevo recordatorio</button>
    </div>
    <div class="table-wrapper">
      <table class="stock-table" style="min-width:700px">
        <thead><tr>
          <th>Zona / Planta</th><th>Grupo</th><th>Tipo</th><th>Cada</th><th>Última vez</th><th>Próximo</th><th></th>
        </tr></thead>
        <tbody>
          ${jardRecordatorios.length ? jardRecordatorios.map((r,i)=>{
            const est=recEstado(r);
            const proximo=r.ultimaVez ? fmtDate(addDaysISO(r.ultimaVez,r.frecuencia)) : '—';
            const color=est==='vencido'?'color:var(--red-alert);font-weight:600':est==='proximo'?'color:#A06A00;font-weight:600':'';
            return `<tr>
              <td><strong>${esc(r.task)}</strong></td>
              <td style="font-size:11.5px;color:var(--mid-gray)">${esc(r.group)}</td>
              <td><span class="jrec-tipo-badge" style="${JARD_TIPO_STYLE[r.tipo]||''}">${JARD_TIPOS_ICON[r.tipo]||''} ${esc(r.tipo)}</span></td>
              <td>${r.frecuencia} días</td>
              <td>${r.ultimaVez?fmtDate(r.ultimaVez):'—'}</td>
              <td><span style="${color}">${proximo}</span></td>
              <td style="white-space:nowrap">
                <button class="btn-icon" onclick="openRecordatorioModal(${i})" title="Editar">✏️</button>
                <button class="btn-icon" style="color:var(--red-alert)" onclick="deleteRecordatorio(${i})" title="Eliminar">✕</button>
              </td>
            </tr>`;
          }).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--mid-gray);padding:24px">Sin recordatorios configurados</td></tr>'}
        </tbody>
      </table>
    </div>`;
}

function marcarRecordatorioHecho(idx){
  jardRecordatorios[idx].ultimaVez = TODAY_ISO;
  fbSave('jardRecordatorios', jardRecordatorios);
  renderRecordatoriosJard();
  renderHome();
  showToast('✅ Marcado como hecho hoy');
}

function openRecordatorioModal(idx){
  const rec = idx>=0 ? jardRecordatorios[idx] : null;
  document.getElementById('jrec-modal-idx').value = idx;
  document.getElementById('jrec-modal-tipo').value = rec?.tipo || 'Riego';
  document.getElementById('jrec-modal-frecuencia').value = rec?.frecuencia || 7;
  document.getElementById('jrec-modal-ultima').value = rec?.ultimaVez || '';
  // Build task picker
  const sel = document.getElementById('jrec-modal-task');
  const groups = {};
  JARDINERIA_BASE.forEach(t => {
    const k = `${t.section} · ${t.group}`;
    if(!groups[k]) groups[k] = [];
    groups[k].push(t);
  });
  sel.innerHTML = Object.entries(groups).map(([grp,tasks])=>
    `<optgroup label="${esc(grp)}">${tasks.map(t=>`<option value="${esc(t.task)}" data-section="${esc(t.section)}" data-group="${esc(t.group)}"${rec?.task===t.task&&rec?.group===t.group?' selected':''}>${esc(t.task)}</option>`).join('')}</optgroup>`
  ).join('');
  document.getElementById('jrec-modal-title').textContent = rec ? 'Editar Recordatorio' : 'Nuevo Recordatorio';
  document.getElementById('jrec-modal').classList.add('open');
}

function saveRecordatorio(){
  const idx = parseInt(document.getElementById('jrec-modal-idx').value);
  const sel = document.getElementById('jrec-modal-task');
  const opt = sel.options[sel.selectedIndex];
  const rec = {
    task: opt.value,
    section: opt.dataset.section,
    group: opt.dataset.group,
    tipo: document.getElementById('jrec-modal-tipo').value,
    frecuencia: parseInt(document.getElementById('jrec-modal-frecuencia').value)||7,
    ultimaVez: document.getElementById('jrec-modal-ultima').value || null,
  };
  // Timestamp de creación: los operarios lo usan para detectar recordatorios nuevos
  if(idx>=0){ rec.creado = jardRecordatorios[idx].creado || null; jardRecordatorios[idx]=rec; }
  else { rec.creado = Date.now(); jardRecordatorios.push(rec); }
  fbSave('jardRecordatorios', jardRecordatorios);
  // Push real a los jardineros cuando gerencia agrega un recordatorio
  if(idx<0) window.pushSend?.('🌿 Recordatorio nuevo de jardinería', `${rec.tipo} · ${rec.task}`, 'jard-rec', 'roles:jardinero');
  closeModal('jrec-modal');
  renderRecordatoriosJard();
}

async function deleteRecordatorio(idx){
  if(!await confirmModal('¿Eliminar este recordatorio?')) return;
  jardRecordatorios.splice(idx,1);
  fbSave('jardRecordatorios', jardRecordatorios);
  renderRecordatoriosJard();
  renderJardRecAviso();
}

// ── Aviso de recordatorios nuevos a operarios de jardinería ──────────────────
// Los recordatorios que crea gerencia llevan timestamp `creado`. Cada
// dispositivo guarda en localStorage hasta cuándo los vio; todo lo posterior
// cuenta como "nuevo" y dispara badge, cartel en el panel general y toast.
function _avisosRecAplica(){
  return userRole==='jardinero' || (userRole==='florista' && !!jardineroNombre);
}

function getRecordatoriosNuevos(){
  if(!_avisosRecAplica()) return [];
  let visto=0;
  try{ visto=parseInt(localStorage.getItem('jardRecVisto')||'0',10)||0; }catch(e){}
  return jardRecordatorios.filter(r=>r.creado && r.creado>visto);
}

function marcarRecordatoriosVistos(){
  try{ localStorage.setItem('jardRecVisto', String(Date.now())); }catch(e){}
  renderJardRecAviso();
}

function renderJardRecAviso(){
  const nuevos=getRecordatoriosNuevos();
  // Punto rojo en la barra inferior mobile (item Avisos 🔔)
  document.querySelectorAll('.bottom-nav-item[data-page="recordatorios-jardineria"]').forEach(el=>{
    el.querySelector('.bottom-nav-badge')?.remove();
    if(nuevos.length) el.insertAdjacentHTML('beforeend',`<span class="bottom-nav-badge">${nuevos.length>9?'9+':nuevos.length}</span>`);
  });
  // Punto rojo en el menú lateral (Recordatorios Jardín)
  const navItem=document.getElementById('nav-rec-jard');
  if(navItem){
    navItem.querySelector('.nav-alert-dot')?.remove();
    if(nuevos.length) navItem.insertAdjacentHTML('beforeend','<span class="nav-alert-dot"></span>');
  }
  // Cartel en los paneles generales (Tareas Jardinería e Inicio)
  const detalle=nuevos.slice(0,3).map(r=>`${JARD_TIPOS_ICON[r.tipo]||''} ${r.tipo} · ${r.task}`).join('  ·  ');
  const html=nuevos.length ? `<div class="jrec-aviso-banner" onclick="navigate('recordatorios-jardineria')">
      <span class="jrec-aviso-icon">🔔</span>
      <span><strong>${nuevos.length===1?'Gerencia agregó un recordatorio nuevo':'Gerencia agregó '+nuevos.length+' recordatorios nuevos'}:</strong> ${esc(detalle)}${nuevos.length>3?' …':''}</span>
      <span class="jrec-aviso-cta">Ver →</span>
    </div>` : '';
  ['jops-aviso-rec','home-aviso-rec'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=html; });
}

// Toast (y notificación del navegador si hay permiso) una sola vez por sesión
const _recAvisados=new Set();
function notificarRecordatoriosNuevos(){
  const sinAvisar=getRecordatoriosNuevos().filter(r=>!_recAvisados.has(r.creado));
  if(!sinAvisar.length) return;
  sinAvisar.forEach(r=>_recAvisados.add(r.creado));
  const msg = sinAvisar.length===1
    ? `Gerencia agregó un recordatorio de jardinería: ${sinAvisar[0].tipo} · ${sinAvisar[0].task}`
    : `Gerencia agregó ${sinAvisar.length} recordatorios de jardinería`;
  showToast('🔔 '+msg);
  if(typeof Notification!=='undefined' && Notification.permission==='granted'){
    try{ new Notification('🌿 Recordatorios de jardinería', { body:msg, icon:'/icon-192.png', tag:'jard-rec' }); }catch(e){}
  }
}
let zonaHorasData = {};   // key: section+'|||'+group → {inicio:'', fin:'', fecha:''}
let _jopsZones = [];      // zonas renderizadas en orden, para referencias por índice
let ctrlJardFilterMode='all';
let ctrlHabFilterMode='all';

function daysSince(isoDate){
  if(!isoDate) return null;
  const ms=new Date(TODAY_ISO)-new Date(isoDate);
  return Math.floor(ms/86400000);
}

// Texto "hace X días" desde la última visita (sin color de umbral)
function _diasDesdeTxt(isoDate){
  const d = daysSince(isoDate);
  if(d===null || d===undefined) return '';
  if(d<=0) return 'hoy';
  return d===1 ? 'hace 1 día' : `hace ${d} días`;
}

// Umbrales de urgencia configurables por gerencia (regulables por estación).
// okMax: hasta N días = 🟢 Al día · warnMax: hasta N días = 🟡 Próxima · más allá = 🔴 Urgente
let urgenciaConfig = { okMax:3, warnMax:7 };
window._setUrgenciaConfig = v => { urgenciaConfig = v; };
const URGENCIA_PRESETS = {
  verano:   { okMax:2, warnMax:4 },
  primavera:{ okMax:3, warnMax:6 },
  otono:    { okMax:4, warnMax:8 },
  invierno: { okMax:6, warnMax:12 },
};
// ── UMBRALES DE URGENCIA (config gerencia) ──────────────
function urgenciaPanelHTML(scope){
  if(userRole!=='gerencia') return '';
  const ok = urgenciaConfig.okMax ?? 3, warn = urgenciaConfig.warnMax ?? 7;
  return `
  <div style="background:#FFFFFF;border:1px solid #E5E3DC;border-radius:12px;padding:14px 16px;margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
      <div style="font-size:12.5px;font-weight:700;color:#1A1A1A;letter-spacing:.3px">
        ⚙️ Umbrales de urgencia <span style="font-weight:400;color:#7A7A72">· ajustá según la estación (en verano se riega más seguido)</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn-secondary" style="font-size:11px;padding:5px 10px" onclick="setUrgenciaPreset('verano')">☀️ Verano</button>
        <button class="btn-secondary" style="font-size:11px;padding:5px 10px" onclick="setUrgenciaPreset('primavera')">🌸 Primavera</button>
        <button class="btn-secondary" style="font-size:11px;padding:5px 10px" onclick="setUrgenciaPreset('otono')">🍂 Otoño</button>
        <button class="btn-secondary" style="font-size:11px;padding:5px 10px" onclick="setUrgenciaPreset('invierno')">❄️ Invierno</button>
      </div>
    </div>
    <div style="display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap;margin-top:12px">
      <label style="font-size:11.5px;color:#7A7A72">🟢 Al día hasta (días)
        <input type="number" min="1" max="60" id="urg-ok-${scope}" value="${ok}"
          class="form-input" style="width:90px;padding:6px 8px;font-size:13px;margin-top:4px;display:block">
      </label>
      <label style="font-size:11.5px;color:#7A7A72">🟡 Próxima hasta (días)
        <input type="number" min="2" max="90" id="urg-warn-${scope}" value="${warn}"
          class="form-input" style="width:90px;padding:6px 8px;font-size:13px;margin-top:4px;display:block">
      </label>
      <div style="font-size:11.5px;color:#B0AFA5;padding-bottom:8px">🔴 Urgente: más de <strong id="urg-preview-${scope}">${warn}</strong> días</div>
      <button class="btn-add" style="padding:7px 14px" onclick="saveUrgenciaConfig('${scope}')">Guardar umbrales</button>
    </div>
  </div>`;
}
function setUrgenciaPreset(season){
  const p = URGENCIA_PRESETS[season]; if(!p) return;
  ['jard','hab'].forEach(s=>{
    const okI=document.getElementById('urg-ok-'+s), wI=document.getElementById('urg-warn-'+s), pv=document.getElementById('urg-preview-'+s);
    if(okI) okI.value=p.okMax; if(wI) wI.value=p.warnMax; if(pv) pv.textContent=p.warnMax;
  });
  urgenciaConfig = { okMax:p.okMax, warnMax:p.warnMax };
  fbSave('urgenciaConfig', urgenciaConfig);
  showToast('🌡️ Umbrales de '+season+' aplicados');
  renderCtrlJard?.(); renderCtrlHab?.();
}
function saveUrgenciaConfig(scope){
  if(userRole!=='gerencia'){ showToast('⛔ Solo gerencia'); return; }
  const okV = parseInt(document.getElementById('urg-ok-'+scope)?.value,10);
  const wV  = parseInt(document.getElementById('urg-warn-'+scope)?.value,10);
  if(isNaN(okV)||isNaN(wV)||okV<1||wV<=okV){ showToast('⚠️ "Próxima" debe ser mayor que "Al día"'); return; }
  urgenciaConfig = { okMax:okV, warnMax:wV };
  fbSave('urgenciaConfig', urgenciaConfig);
  showToast('✅ Umbrales guardados');
  renderCtrlJard?.(); renderCtrlHab?.();
}

// ── EDITAR FECHA de última visita (solo gerencia) ──────
function gerenciaSetFecha(tipo, idx, nuevaFecha){
  if(userRole!=='gerencia') return;
  if(!nuevaFecha) return;
  const arr = tipo==='jard' ? jardineriaData : habitacionesData;
  const r = arr[idx]; if(!r) return;
  r.last = nuevaFecha;
  if(tipo==='jard'){ fbSave('jardineriaData', jardineriaData); renderCtrlJard(); }
  else { fbSave('habitacionesData', habitacionesData); renderCtrlHab(); }
  showToast('📅 Fecha actualizada');
}

function getDaysBadge(days){
  const ok = urgenciaConfig.okMax ?? 3;
  const warn = urgenciaConfig.warnMax ?? 7;
  if(days===null||days===undefined) return {cls:'days-none',label:'Sin datos',bar:0,barCls:'background:var(--mid-gray)',status:'none'};
  if(days<=ok)   return {cls:'days-ok',  label:days+'d',bar:Math.min(100,days/(warn||7)*100), barCls:'background:var(--green-ok)',status:'ok'};
  if(days<=warn) return {cls:'days-warn',label:days+'d',bar:Math.min(100,days/(warn*2||14)*100),barCls:'background:var(--amber)',    status:'warn'};
  return          {cls:'days-alert',     label:days+'d',bar:100,                       barCls:'background:var(--red-alert)',status:'alert'};
}

function getSectionEmoji(sec){
  if(sec==='Palacio') return '🟢';
  if(sec==='Jardín Central') return '🌿';
  if(sec==='Edificio Posadas') return '🔵';
  return '⚪';
}
function getSectionPillCls(sec){
  if(sec==='Palacio') return 'sec-palacio';
  if(sec==='Jardín Central') return 'sec-jardin';
  return 'sec-posadas';
}

// ── JARDINERÍA ──────────────────────────
function initCtrlJard(){}

function zonaSetHora(idx, campo){
  const z = _jopsZones[idx]; if(!z) return;
  const key = z.section+'|||'+z.group;
  if(!zonaHorasData[key]) zonaHorasData[key]={inicio:'',fin:'',fecha:''};
  const now = new Date();
  const hora = now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  zonaHorasData[key][campo] = hora;
  zonaHorasData[key].fecha = TODAY_ISO;
  fbSave('zonaHorasData', zonaHorasData);
  renderJardOps();
}
function zonaResetHora(idx, campo){
  const z = _jopsZones[idx]; if(!z) return;
  const key = z.section+'|||'+z.group;
  if(zonaHorasData[key]) zonaHorasData[key][campo]='';
  fbSave('zonaHorasData', zonaHorasData);
  renderJardOps();
}
function zonaHoraBtn(idx, campo, zh){
  const val = (zh&&zh[campo])||'';
  if(val){
    const color = campo==='horaInicio'?'#2C4A3E':'#8B3A3A';
    const bg    = campo==='horaInicio'?'#EBF5E8':'#FDF0F0';
    return `<span style="font-size:13px;font-weight:700;color:${color};background:${bg};padding:3px 10px;border-radius:8px;display:inline-block">${val}</span>`;
  }
  const label = campo==='horaInicio'?'▶ Inicio':'⏹ Fin';
  const cls   = campo==='horaInicio'?'btn-hora-inicio':'btn-hora-fin';
  return `<button class="${cls}" onclick="event.stopPropagation();zonaSetHora(${idx},'${campo}')">${label}</button>`;
}

let jopsFilter = 'all';
function setJopsFilter(mode){
  jopsFilter = mode;
  ['all','plan','alert','warn','ok'].forEach(m=>{
    const btn = document.getElementById('jops-btn-'+m);
    if(btn) btn.classList.toggle('active', m===mode);
  });
  renderJardOps();
}

// ══ PLAN DEL DÍA + GESTIÓN DE TAREAS (jardinería) ═══════════════════════════
// Plan del día: gerencia marca qué tareas se hacen hoy → { iso: { taskKey: true } }
let jardPlanDia = {};
window._setJardPlanDia = v => { jardPlanDia = v || {}; };
function jardTaskKey(r){ return (r.section||'')+'|||'+(r.group||'')+'|||'+(r.task||''); }
function jardEnPlanHoy(r){ return !!(jardPlanDia[TODAY_ISO] && jardPlanDia[TODAY_ISO][jardTaskKey(r)]); }
function jardHayPlanHoy(){ return !!(jardPlanDia[TODAY_ISO] && Object.keys(jardPlanDia[TODAY_ISO]).length); }

function jardTogglePlanHoy(i){
  if(userRole!=='gerencia') return;
  const r = jardineriaData[i]; if(!r) return;
  const k = jardTaskKey(r);
  if(!jardPlanDia[TODAY_ISO]) jardPlanDia[TODAY_ISO] = {};
  if(jardPlanDia[TODAY_ISO][k]) delete jardPlanDia[TODAY_ISO][k];
  else jardPlanDia[TODAY_ISO][k] = true;
  if(!Object.keys(jardPlanDia[TODAY_ISO]).length) delete jardPlanDia[TODAY_ISO];
  fbSave('jardPlanDia', jardPlanDia);
  renderJardOps();
}

// ── Gestión de la lista de tareas de jardinería (solo gerencia) ──
function _saveJardineria(){ window._jardDataLastSave = Date.now(); fbSave('jardineriaData', jardineriaData); }

async function jardAddTarea(section, group){
  if(userRole!=='gerencia') return;
  const nombre = await promptModal('Nombre de la nueva tarea / planta:', {title:'Agregar tarea'});
  if(!nombre || !nombre.trim()) return;
  let idx = jardineriaData.length;
  for(let i=jardineriaData.length-1;i>=0;i--){ if(jardineriaData[i].section===section && jardineriaData[i].group===group){ idx=i+1; break; } }
  jardineriaData.splice(idx, 0, {section, group, task:nombre.trim(), last:null, liveVisits:0, monthlyVisits:{}, obs:'', quien:'', horaInicio:'', horaFin:'', canUndo:false});
  _saveJardineria();
  renderJardOps();
  openGestionTareasJard();
  showToast(`✅ Tarea "${nombre.trim()}" agregada`);
}

async function jardRenameTarea(i){
  if(userRole!=='gerencia') return;
  const r = jardineriaData[i]; if(!r) return;
  const nuevo = await promptModal('Nuevo nombre de la tarea:', {title:'Renombrar tarea', default:r.task});
  if(!nuevo || !nuevo.trim() || nuevo.trim()===r.task) return;
  const kOld = jardTaskKey(r);
  r.task = nuevo.trim();
  const kNew = jardTaskKey(r);
  Object.keys(jardPlanDia).forEach(iso=>{ if(jardPlanDia[iso][kOld]){ delete jardPlanDia[iso][kOld]; jardPlanDia[iso][kNew]=true; } });
  fbSave('jardPlanDia', jardPlanDia);
  _saveJardineria();
  renderJardOps();
  openGestionTareasJard();
  showToast('✏️ Tarea renombrada');
}

async function jardDeleteTarea(i){
  if(userRole!=='gerencia') return;
  const r = jardineriaData[i]; if(!r) return;
  if(!await confirmModal(`¿Eliminar la tarea "${r.task}" de ${r.group}?`)) return;
  const k = jardTaskKey(r);
  jardineriaData.splice(i,1);
  Object.keys(jardPlanDia).forEach(iso=>{ if(jardPlanDia[iso][k]) delete jardPlanDia[iso][k]; });
  fbSave('jardPlanDia', jardPlanDia);
  _saveJardineria();
  renderJardOps();
  openGestionTareasJard();
  showToast('🗑️ Tarea eliminada');
}

async function jardAddGrupo(section){
  if(userRole!=='gerencia') return;
  const g = await promptModal('Nombre del nuevo grupo / zona:', {title:'Agregar grupo'});
  if(!g || !g.trim()) return;
  const t = await promptModal('Primera tarea / planta del grupo:', {title:'Agregar grupo'});
  if(!t || !t.trim()) return;
  jardineriaData.push({section, group:g.trim(), task:t.trim(), last:null, liveVisits:0, monthlyVisits:{}, obs:'', quien:'', horaInicio:'', horaFin:'', canUndo:false});
  _saveJardineria();
  openGestionTareasJard();
  showToast(`✅ Grupo "${g.trim()}" agregado`);
}

async function jardAddSeccion(){
  if(userRole!=='gerencia') return;
  const s = await promptModal('Nombre de la nueva sección / zona (ej. Palacio):', {title:'Agregar sección'});
  if(!s || !s.trim()) return;
  const g = await promptModal('Primer grupo de la sección:', {title:'Agregar sección'});
  if(!g || !g.trim()) return;
  const t = await promptModal('Primera tarea del grupo:', {title:'Agregar sección'});
  if(!t || !t.trim()) return;
  jardineriaData.push({section:s.trim(), group:g.trim(), task:t.trim(), last:null, liveVisits:0, monthlyVisits:{}, obs:'', quien:'', horaInicio:'', horaFin:'', canUndo:false});
  _saveJardineria();
  openGestionTareasJard();
  showToast(`✅ Sección "${s.trim()}" creada`);
}

function openGestionTareasJard(){
  if(userRole!=='gerencia'){ showToast('⛔ Solo gerencia'); return; }
  let ov = document.getElementById('gestion-tareas-jard-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='gestion-tareas-jard-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  const bySec = {};
  jardineriaData.forEach((r,i)=>{
    bySec[r.section] = bySec[r.section] || {};
    (bySec[r.section][r.group] = bySec[r.section][r.group] || []).push(i);
  });
  const secHTML = Object.keys(bySec).map(sec=>{
    const secEsc = esc(sec).replace(/'/g,"\\'");
    const grupos = bySec[sec];
    const gruposHTML = Object.keys(grupos).map(grp=>{
      const grpEsc = esc(grp).replace(/'/g,"\\'");
      const tareasHTML = grupos[grp].map(i=>{
        const r = jardineriaData[i];
        return `<div style="display:flex;align-items:center;gap:8px;padding:6px 12px;background:var(--warm-white)">
          <div style="flex:1;min-width:0;font-size:12.5px;color:var(--charcoal)">${esc(r.task)}</div>
          <button class="btn-icon" title="Renombrar" onclick="jardRenameTarea(${i})">✏️</button>
          <button class="btn-icon" style="color:var(--red-alert)" title="Eliminar" onclick="jardDeleteTarea(${i})">✕</button>
        </div>`;
      }).join('');
      return `<div style="margin:6px 0;border:1px solid var(--light-gray);border-radius:8px;overflow:hidden">
        <div style="padding:7px 12px;background:var(--cream);font-size:12px;font-weight:600;color:var(--charcoal)">🌿 ${esc(grp)}</div>
        <div style="display:flex;flex-direction:column;gap:1px;background:var(--light-gray)">${tareasHTML}</div>
        <div style="padding:6px 12px;background:var(--warm-white)"><button class="btn-secondary" style="font-size:11px;padding:4px 10px" onclick="jardAddTarea('${secEsc}','${grpEsc}')">+ Agregar tarea</button></div>
      </div>`;
    }).join('');
    return `<div style="margin-bottom:14px;border:1px solid var(--light-gray);border-radius:10px;overflow:hidden">
      <div style="padding:10px 12px;background:#EBF0E8;font-size:13.5px;font-weight:700;color:var(--sage-dark)">${getSectionEmoji(sec)} ${esc(sec)}</div>
      <div style="padding:8px 10px">${gruposHTML}
        <button class="btn-secondary" style="font-size:11px;padding:4px 10px;margin-top:4px" onclick="jardAddGrupo('${secEsc}')">+ Agregar grupo</button>
      </div>
    </div>`;
  }).join('');
  ov.innerHTML = `<div class="modal" style="max-width:620px;max-height:88vh;overflow-y:auto">
    <button class="modal-close" onclick="closeModal('gestion-tareas-jard-modal')">✕</button>
    <div class="modal-title">🗂 Gestionar tareas de jardinería</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:14px">Agregá, renombrá o eliminá las tareas que hacen los jardineros. Los cambios se aplican para todos y se sincronizan con el equipo.</div>
    ${secHTML}
    <div style="margin-top:8px"><button class="btn-add" style="font-size:12px;padding:8px 16px" onclick="jardAddSeccion()">+ Agregar sección / zona</button></div>
  </div>`;
  ov.classList.add('open');
}

function renderJardOps(){
  renderJardTurnoCard();
  renderAlertasUrgentesJard();
  // KPIs
  let kOk=0,kWarn=0,kAlert=0,kNone=0;
  jardineriaData.forEach(r=>{
    const s=getDaysBadge(daysSince(r.last)).status;
    if(s==='ok')kOk++;else if(s==='warn')kWarn++;else if(s==='alert')kAlert++;else kNone++;
  });
  const kpisEl = document.getElementById('jops-kpis');
  if(kpisEl) kpisEl.innerHTML=`
    <div class="card"><div class="card-label">🔴 Urgente</div><div class="card-value red" style="font-size:32px">${kAlert}</div><div class="card-sub">intervenir hoy</div></div>
    <div class="card"><div class="card-label">🟡 Próxima</div><div class="card-value amber" style="font-size:32px">${kWarn}</div><div class="card-sub">requieren visita pronto</div></div>
    <div class="card"><div class="card-label">🟢 Al día</div><div class="card-value green" style="font-size:32px">${kOk}</div><div class="card-sub">zonas recientes</div></div>`;

  const statusOrder = {alert:0, warn:1, ok:2, none:3};

  // Agrupar por section + group (zona completa)
  const groupMap = new Map();
  jardineriaData.forEach((r,i)=>{
    const key = r.section+'|||'+r.group;
    if(!groupMap.has(key)) groupMap.set(key,{section:r.section,group:r.group,items:[]});
    groupMap.get(key).items.push({r,i,days:daysSince(r.last),badge:getDaysBadge(daysSince(r.last))});
  });

  // Para cada zona: determinar peor estado y ordenar tareas internas por urgencia
  const zones = [...groupMap.values()].map(z=>{
    z.items.sort((a,b)=>statusOrder[a.badge.status]-statusOrder[b.badge.status]||(b.days||999)-(a.days||999));
    z.worstStatus = z.items.reduce((w,it)=>statusOrder[it.badge.status]<statusOrder[w]?it.badge.status:w,'none');
    z.alertCount  = z.items.filter(it=>it.badge.status==='alert').length;
    z.warnCount   = z.items.filter(it=>it.badge.status==='warn').length;
    z.okCount     = z.items.filter(it=>it.badge.status==='ok').length;
    return z;
  });

  // Ordenar zonas: las más urgentes primero
  zones.sort((a,b)=>statusOrder[a.worstStatus]-statusOrder[b.worstStatus]);

  const grid = document.getElementById('jops-grid');
  if(!grid) return;
  grid.innerHTML = '';
  grid.style.cssText = 'display:flex;flex-direction:column;gap:12px';

  _jopsZones = [];  // resetear índice de zonas renderizadas
  let rendered = 0;
  const itemPasa = (it)=> jopsFilter==='all' ? true : jopsFilter==='plan' ? jardEnPlanHoy(it.r) : it.badge.status===jopsFilter;
  zones.forEach(z=>{
    // Mostrar zona si tiene al menos una tarea del filtro seleccionado
    if(jopsFilter !== 'all' && !z.items.some(itemPasa)) return;

    _jopsZones.push(z);  // índice = rendered

    const borderColor = z.worstStatus==='alert'?'#E53935':z.worstStatus==='warn'?'#F59E0B':z.worstStatus==='ok'?'#43A047':'#C0BEB6';
    const bgHeader    = z.worstStatus==='alert'?'#FFF5F5':z.worstStatus==='warn'?'#FFFBF0':z.worstStatus==='ok'?'#F0FAF0':'#F8F7F5';
    const chevId = 'jops-ch-'+rendered;

    const zoneEl = document.createElement('div');
    zoneEl.style.cssText = `border:1px solid ${borderColor};border-left:5px solid ${borderColor};border-radius:8px;overflow:hidden`;

    // Cabecera de zona — solo info (el horario se marca una vez en la jornada,
    // no por zona; cada tarea se cierra con "✓ Hecho").
    const headerEl = document.createElement('div');
    headerEl.style.cssText = `display:flex;flex-direction:column;gap:0;padding:12px 16px;background:${bgHeader};cursor:pointer;user-select:none`;
    headerEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">${getSectionEmoji(z.section)}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:14px;font-weight:700;color:var(--charcoal)">${esc(z.group)}</div>
          <div style="font-size:11px;color:var(--mid-gray);margin-top:1px">${esc(z.section)} · ${z.items.length} tarea${z.items.length!==1?'s':''}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">
          ${z.alertCount?`<span style="background:#FDECEA;color:#C62828;padding:3px 9px;border-radius:12px;font-size:11px;font-weight:700">🔴 ${z.alertCount} urgente${z.alertCount!==1?'s':''}</span>`:''}
          ${z.warnCount ?`<span style="background:#FFF8E1;color:#E65100;padding:3px 9px;border-radius:12px;font-size:11px;font-weight:700">🟡 ${z.warnCount} pronto</span>`:''}
          ${z.okCount   ?`<span style="background:#E8F5E9;color:#2E7D32;padding:3px 9px;border-radius:12px;font-size:11px;font-weight:700">🟢 ${z.okCount} al día</span>`:''}
          <span id="${chevId}" style="font-size:14px;color:var(--mid-gray);transition:transform .2s;display:inline-block">▼</span>
        </div>
      </div>`;

    // Contenedor de tareas de la zona (grid interno)
    const tasksEl = document.createElement('div');
    tasksEl.style.cssText = `display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1px;background:${borderColor}`;

    z.items.forEach(({r,i,badge})=>{
      if(jopsFilter==='plan' && !jardEnPlanHoy(r)) return;
      const enPlan = jardEnPlanHoy(r);
      const planCtrl = userRole==='gerencia'
        ? `<button class="btn-icon" title="${enPlan?'Quitar del plan de hoy':'Marcar para hoy'}" style="flex-shrink:0;font-size:14px" onclick="jardTogglePlanHoy(${i})">${enPlan?'📌':'☆'}</button>`
        : (enPlan?'<span style="flex-shrink:0;font-size:12px;background:#EBF0E8;color:var(--sage-dark);padding:2px 7px;border-radius:8px;font-weight:600">📌 Hoy</span>':'');
      const taskEl = document.createElement('div');
      taskEl.style.cssText = 'background:var(--warm-white);padding:14px;display:flex;flex-direction:column;gap:8px'+(enPlan?';box-shadow:inset 3px 0 0 var(--sage-dark)':'');
      taskEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div style="font-size:12px;font-weight:600;color:var(--charcoal);flex:1;line-height:1.4">${esc(r.task)}</div>
          ${planCtrl}
          <span style="flex-shrink:0;font-size:15px" title="Estado">${badge.status==='ok'?'🟢':badge.status==='warn'?'🟡':badge.status==='alert'?'🔴':'⚪'}</span>
        </div>
        <div style="font-size:11px;color:var(--mid-gray)">📅 ${r.last?fmtDate(r.last):'<em>Sin registro</em>'} · 📊 ${getMonthVisits(r)} este mes</div>
        <textarea id="jops-obs-${i}" class="cl-obs-input" placeholder="Observaciones..." style="width:100%;font-size:12px;resize:vertical;min-height:44px;padding:5px 7px;border-radius:4px;border:1px solid var(--light-gray);font-family:inherit;background:var(--warm-white)"
          onchange="jardineriaData[${i}].obs=this.value">${esc(r.obs||'')}</textarea>
        <div style="display:flex;gap:8px;align-items:center">
          <div style="flex:1;text-align:center">
            <div style="font-size:9px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Inicio</div>
            ${jopsHoraCell(i,'horaInicio',r)}
          </div>
          <div style="flex:1;text-align:center">
            <div style="font-size:9px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Fin</div>
            ${jopsHoraCell(i,'horaFin',r)}
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;margin-top:2px">
          <select id="jops-quien-${i}" class="cl-select" style="font-size:12px;padding:5px 8px;flex:1">
            <option value="">— Jardinero —</option>
            ${JARDINEROS_LIST.map(n=>`<option ${n===(jardineroNombre||jardCurrentJardinero)?'selected':''}>${n}</option>`).join('')}
          </select>
          <button class="mark-done-btn" style="flex:1" onclick="jopsDone(${i})">✓ Hecho</button>
        </div>`;
      tasksEl.appendChild(taskEl);
    });

    // Toggle colapsar/expandir — solo en la primera fila del header (no en los botones de hora)
    headerEl.firstElementChild.style.cursor = 'pointer';
    headerEl.firstElementChild.onclick = (e)=>{
      e.stopPropagation();
      const open = tasksEl.style.display !== 'none';
      tasksEl.style.display = open ? 'none' : 'grid';
      const ch = document.getElementById(chevId);
      if(ch) ch.style.transform = open ? 'rotate(-90deg)' : '';
    };
    headerEl.style.cursor = 'default';

    zoneEl.appendChild(headerEl);
    zoneEl.appendChild(tasksEl);
    grid.appendChild(zoneEl);
    rendered++;
  });

  if(rendered === 0){
    grid.innerHTML = `<div style="padding:40px;text-align:center;color:var(--mid-gray);font-size:14px">
      ${jopsFilter==='all'?'🌿 Sin tareas cargadas.':jopsFilter==='plan'?(jardHayPlanHoy()?'✅ Todas las tareas de hoy completadas.':'📋 Gerencia todavía no marcó tareas para hoy. Se ven todas en «Todas».'):'✅ Sin zonas en esta categoría.'}
    </div>`;
  }
}

// ── Hora cells para Jardinería ──────────────────
function jopsHoraCell(i, campo, r){
  const val = r[campo] || '';
  const done = false;
  if(userRole === 'gerencia'){
    const dis = done ? 'disabled' : '';
    return `<input type="time" value="${val}" ${dis}
      style="width:78px;padding:4px 5px;font-size:12px;border:1px solid var(--light-gray);border-radius:4px;text-align:center;background:var(--warm-white);color:var(--charcoal)"
      onchange="jopsUpdHora(${i},'${campo}',this.value)">`;
  }
  if(val){
    const color = campo==='horaInicio' ? '#2C4A3E' : '#8B3A3A';
    const bg    = campo==='horaInicio' ? '#EBF5E8' : '#FDF0F0';
    const reset = done ? '' : `onclick="jopsResetHora(${i},'${campo}')" title="Tocar para borrar"`;
    return `<span ${reset} style="font-size:13px;font-weight:700;color:${color};background:${bg};padding:3px 10px;border-radius:8px;display:inline-block;${done?'':'cursor:pointer'}">${val}</span>`;
  }
  const dis   = done ? 'disabled style="opacity:.45;cursor:not-allowed"' : '';
  const label = campo==='horaInicio' ? '▶&nbsp;Inicio' : '⏹&nbsp;Fin';
  const cls   = campo==='horaInicio' ? 'btn-hora-inicio' : 'btn-hora-fin';
  return `<button class="${cls}" ${dis} onclick="jopsRegistrarHora(${i},'${campo}')">${label}</button>`;
}

function jopsRegistrarHora(i, campo){
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2,'0');
  const mm  = String(now.getMinutes()).padStart(2,'0');
  jardineriaData[i][campo] = hh+':'+mm;
  fbSave('jardineriaData', jardineriaData);
  if(campo === 'horaFin'){
    jopsDone(i);
  } else {
    renderJardOps();
  }
}

function jopsResetHora(i, campo){
  jardineriaData[i][campo] = '';
  fbSave('jardineriaData', jardineriaData);
  renderJardOps();
}

function jopsUpdHora(i, campo, val){
  jardineriaData[i][campo] = val;
  fbSave('jardineriaData', jardineriaData);
  renderJardOps();
}

function jopsDone(i){
  const quien = document.getElementById('jops-quien-'+i)?.value || '';
  markJardDone(i, quien);
  renderJardOps();
  if(document.getElementById('page-control-jardineria')?.classList.contains('active')) renderCtrlJard();
}


// ── Turno de jardinero ────────────────────────────────────────────────────────
function jardSetJardinero(nombre){
  jardCurrentJardinero = nombre;
  try{ localStorage.setItem('jardCurrentJardinero', nombre); }catch(e){}
  renderJardTurnoCard();
}

function jardRegistrarHoraTurno(campo){
  const nombre = jardineroNombre || jardCurrentJardinero;
  if(!nombre){ showToast('⚠️ No hay jardinero identificado'); return; }
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  if(!window.jardHorarios[nombre]) window.jardHorarios[nombre] = {};
  if(!window.jardHorarios[nombre][TODAY_ISO]) window.jardHorarios[nombre][TODAY_ISO] = {inicio:'',fin:'',tareas:0};
  window.jardHorarios[nombre][TODAY_ISO][campo] = hh+':'+mm;
  jardCurrentJardinero = nombre;
  fbSave('jardHorarios', window.jardHorarios);
  // Usuario combinado (jardinería + florista, ej. Ivan): una sola jornada vale
  // para las dos áreas → reflejar el mismo inicio/fin en florTurnos.
  if(floristaNombre && floristaNombre === nombre){
    if(!window.florTurnos) window.florTurnos = {};
    if(!window.florTurnos[nombre]) window.florTurnos[nombre] = {};
    if(!window.florTurnos[nombre][TODAY_ISO]) window.florTurnos[nombre][TODAY_ISO] = {};
    window.florTurnos[nombre][TODAY_ISO][campo] = hh+':'+mm;
    window.fbSetPath?.('florTurnos/'+nombre+'/'+TODAY_ISO+'/'+campo, hh+':'+mm);
  }
  renderJardTurnoCard();
  showToast(campo==='inicio' ? '▶ Jornada iniciada: '+hh+':'+mm : '⏹ Jornada finalizada: '+hh+':'+mm);
}

function jardResetHoraTurno(campo){
  const nombre = jardineroNombre || jardCurrentJardinero;
  if(!nombre || !window.jardHorarios[nombre]?.[TODAY_ISO]) return;
  window.jardHorarios[nombre][TODAY_ISO][campo] = '';
  fbSave('jardHorarios', window.jardHorarios);
  // Espejo para usuario combinado (ver jardRegistrarHoraTurno)
  if(floristaNombre && floristaNombre === nombre && window.florTurnos?.[nombre]?.[TODAY_ISO]){
    window.florTurnos[nombre][TODAY_ISO][campo] = '';
    window.fbSetPath?.('florTurnos/'+nombre+'/'+TODAY_ISO+'/'+campo, '');
  }
  renderJardTurnoCard();
}

function renderJardTurnoCard(){
  const el = document.getElementById('jops-turno-card');
  if(!el) return;
  // "Mi jornada de hoy" es el fichaje personal del jardinero (inicio/fin de
  // su jornada). Gerencia no ficha la jornada de nadie, así que no la ve acá
  // — igual que la tarjeta equivalente de florería, que es solo para el florista.
  if(userRole !== 'jardinero'){ el.innerHTML=''; return; }

  const nombre = jardineroNombre || jardCurrentJardinero;
  const turno = nombre ? (window.jardHorarios[nombre]?.[TODAY_ISO]||{}) : {};
  const inicio = turno.inicio||'', fin = turno.fin||'';
  const tareasHoy = turno.tareas||0;
  const nowStr = new Date().getHours().toString().padStart(2,'0')+':'+new Date().getMinutes().toString().padStart(2,'0');
  const dur = inicio&&fin ? calcDuracion(inicio,fin) : (inicio ? calcDuracion(inicio,nowStr) : 0);

  el.innerHTML = `<div class="prod-card prod-card-personal" style="display:flex;flex-direction:column;gap:12px">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span style="font-size:20px">🌿</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:11px;color:var(--mid-gray);margin-bottom:2px">Mi jornada de hoy</div>
        <div style="font-size:17px;font-weight:700;color:var(--charcoal)">${esc(nombre||'—')}</div>
      </div>
      ${nombre && tareasHoy > 0 ? `<div style="text-align:center;min-width:60px">
        <div style="font-size:10px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Tareas hoy</div>
        <div style="font-size:26px;font-weight:700;color:var(--charcoal)">${tareasHoy}</div>
      </div>` : ''}
      ${dur > 0 ? `<div style="text-align:center;min-width:70px">
        <div style="font-size:10px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">${fin?'Horas':'Transcurrido'}</div>
        <div style="font-size:22px;font-weight:700;color:${fin?'var(--charcoal)':'#2C6B3A'}">${fmtDur(dur)}</div>
      </div>` : ''}
    </div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--light-gray)">
      <span style="font-size:11px;color:var(--mid-gray);font-weight:600">⏱ Jornada:</span>
      ${inicio
        ? `<span onclick="jardResetHoraTurno('inicio')" title="Tocar para borrar" style="font-size:13px;font-weight:700;color:#2C4A3E;background:#EBF5E8;padding:4px 12px;border-radius:8px;cursor:pointer">▶ ${inicio}</span>`
        : `<button class="btn-hora-inicio" onclick="jardRegistrarHoraTurno('inicio')">▶&nbsp;Inicio de jornada</button>`}
      ${fin
        ? `<span onclick="jardResetHoraTurno('fin')" title="Tocar para borrar" style="font-size:13px;font-weight:700;color:#8B3A3A;background:#FDF0F0;padding:4px 12px;border-radius:8px;cursor:pointer">⏹ ${fin}</span>`
        : inicio ? `<button class="btn-hora-fin" onclick="jardRegistrarHoraTurno('fin')">⏹&nbsp;Fin de jornada</button>` : ''}
    </div>
  </div>`;
}

// ── Turno Florista ────────────────────────────────────────────────────────────
// Almacena check-in/checkout real de cada florista (separado del horario planificado)
// Firebase path: florTurnos/{nombre}/{YYYY-MM-DD}/{inicio, fin}

function florRegistrarTurno(campo){
  if(!floristaNombre){ showToast('⚠️ Error de sesión'); return; }
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  window.fbSetPath?.('florTurnos/'+floristaNombre+'/'+TODAY_ISO+'/'+campo, hh+':'+mm);
  if(!window.florTurnos) window.florTurnos = {};
  if(!window.florTurnos[floristaNombre]) window.florTurnos[floristaNombre] = {};
  if(!window.florTurnos[floristaNombre][TODAY_ISO]) window.florTurnos[floristaNombre][TODAY_ISO] = {};
  window.florTurnos[floristaNombre][TODAY_ISO][campo] = hh+':'+mm;
  // Usuario combinado (florista + jardinería, ej. Ivan): una sola jornada vale
  // para las dos áreas → reflejar el mismo inicio/fin en jardHorarios.
  if(jardineroNombre && jardineroNombre === floristaNombre){
    if(!window.jardHorarios) window.jardHorarios = {};
    if(!window.jardHorarios[floristaNombre]) window.jardHorarios[floristaNombre] = {};
    if(!window.jardHorarios[floristaNombre][TODAY_ISO]) window.jardHorarios[floristaNombre][TODAY_ISO] = {inicio:'',fin:'',tareas:0};
    window.jardHorarios[floristaNombre][TODAY_ISO][campo] = hh+':'+mm;
    window.fbSetPath?.('jardHorarios/'+floristaNombre+'/'+TODAY_ISO+'/'+campo, hh+':'+mm);
  }
  renderFlorTurnoCard();
  showToast(campo==='inicio' ? '▶ Jornada iniciada: '+hh+':'+mm : '⏹ Jornada finalizada: '+hh+':'+mm);
}

function florResetTurno(campo){
  if(!floristaNombre || !window.florTurnos?.[floristaNombre]?.[TODAY_ISO]) return;
  window.florTurnos[floristaNombre][TODAY_ISO][campo] = '';
  window.fbSetPath?.('florTurnos/'+floristaNombre+'/'+TODAY_ISO+'/'+campo, '');
  // Espejo para usuario combinado (ver florRegistrarTurno)
  if(jardineroNombre && jardineroNombre === floristaNombre && window.jardHorarios?.[floristaNombre]?.[TODAY_ISO]){
    window.jardHorarios[floristaNombre][TODAY_ISO][campo] = '';
    window.fbSetPath?.('jardHorarios/'+floristaNombre+'/'+TODAY_ISO+'/'+campo, '');
  }
  renderFlorTurnoCard();
}

function renderFlorTurnoCard(){
  const el = document.getElementById('fl-turno-card');
  if(!el) return;
  if(userRole !== 'florista' || !floristaNombre){ el.innerHTML=''; return; }

  const turno = window.florTurnos?.[floristaNombre]?.[TODAY_ISO] || {};
  const inicio = turno.inicio||'', fin = turno.fin||'';
  const nowStr = new Date().getHours().toString().padStart(2,'0')+':'+new Date().getMinutes().toString().padStart(2,'0');
  const dur = inicio&&fin ? calcDuracion(inicio,fin) : (inicio ? calcDuracion(inicio,nowStr) : 0);

  // Progreso de tareas
  const day = window.currentDay;
  const dayState = (window.clStateByDay||{})[day]||window.clState||{};
  const resp = dayState.responsable||[], checked = dayState.checked||[];
  const myIdxs = resp.reduce((a,r,i)=>{ if(r===floristaNombre) a.push(i); return a; },[]);
  const myDone = myIdxs.filter(i=>checked[i]).length;
  const myTotal = myIdxs.length;
  const taskPct = myTotal>0 ? Math.round(myDone/myTotal*100) : 0;
  const taskColor = taskPct>=100?'var(--green-ok)':taskPct>=60?'#D4A820':'var(--mid-gray)';

  el.innerHTML = `<div class="prod-card prod-card-personal" style="display:flex;flex-direction:column;gap:12px">
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span style="font-size:20px">🌸</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:11px;color:var(--mid-gray);margin-bottom:2px">Mi jornada de hoy</div>
        <div style="font-size:17px;font-weight:700;color:var(--charcoal)">${esc(floristaNombre)}</div>
      </div>
      ${myTotal > 0 ? `<div style="text-align:center;min-width:60px">
        <div style="font-size:10px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Tareas</div>
        <div style="font-size:26px;font-weight:700;color:${taskColor}">${myDone}/${myTotal}</div>
      </div>` : ''}
      ${dur > 0 ? `<div style="text-align:center;min-width:70px">
        <div style="font-size:10px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">${fin?'Horas':'Transcurrido'}</div>
        <div style="font-size:22px;font-weight:700;color:${fin?'var(--charcoal)':'#2C6B3A'}">${fmtDur(dur)}</div>
      </div>` : ''}
    </div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--light-gray)">
      <span style="font-size:11px;color:var(--mid-gray);font-weight:600">⏱ Jornada:</span>
      ${inicio
        ? `<span onclick="florResetTurno('inicio')" title="Tocar para borrar" style="font-size:13px;font-weight:700;color:#2C4A3E;background:#EBF5E8;padding:4px 12px;border-radius:8px;cursor:pointer">▶ ${inicio}</span>`
        : `<button class="btn-hora-inicio" onclick="florRegistrarTurno('inicio')">▶&nbsp;Inicio de jornada</button>`}
      ${fin
        ? `<span onclick="florResetTurno('fin')" title="Tocar para borrar" style="font-size:13px;font-weight:700;color:#8B3A3A;background:#FDF0F0;padding:4px 12px;border-radius:8px;cursor:pointer">⏹ ${fin}</span>`
        : inicio ? `<button class="btn-hora-fin" onclick="florRegistrarTurno('fin')">⏹&nbsp;Fin de jornada</button>` : ''}
    </div>
  </div>`;
}

// ── Productividad del equipo (gerencia) ──────────────────────────────────────
function renderJardProdEquipo(){
  const el = document.getElementById('jard-prod-body');
  if(!el) return;

  const y = new Date().getFullYear(), m = new Date().getMonth();
  const mesKey = y+'-'+String(m+1).padStart(2,'0');
  const diasEnMes = new Date(y, m+1, 0).getDate();

  const allNames = [...new Set([
    ...Object.keys(window.jardHorarios),
    ...jardineriaLog.map(l=>l.quien).filter(Boolean)
  ])].sort();

  if(!allNames.length){
    el.innerHTML = '<p style="color:var(--mid-gray);font-size:13px;padding:20px;text-align:center">Sin registros aún. Los jardineros deben registrar inicio y fin de jornada desde Tareas Jardinería.</p>';
    return;
  }

  const DIAS_CAL = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];
  let html = '';

  allNames.forEach(nombre => {
    const horarioNombre = window.jardHorarios[nombre] || {};
    const logNombre = jardineriaLog.filter(l => l.quien === nombre && l.fecha.startsWith(mesKey));

    // Armar datos por día del mes
    let totalMin = 0, diasTrabajados = 0;
    const diasData = {};
    Object.entries(horarioNombre).forEach(([fecha, d]) => {
      if(!fecha.startsWith(mesKey)) return;
      const dur = calcDuracion(d.inicio, d.fin);
      diasData[fecha] = { inicio:d.inicio, fin:d.fin, dur, tareas:[] };
      if(dur){ totalMin += dur; diasTrabajados++; }
    });
    logNombre.forEach(l => {
      if(!diasData[l.fecha]) diasData[l.fecha] = { inicio:'', fin:'', dur:0, tareas:[] };
      diasData[l.fecha].tareas.push(l);
    });
    const tareasTotal = logNombre.length;
    const avgHoras = diasTrabajados > 0 ? Math.round(totalMin/diasTrabajados) : 0;

    // Calendario
    const startDow = new Date(y, m, 1).getDay();
    let calHtml = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-top:12px;font-size:11px">`;
    DIAS_CAL.forEach(d => { calHtml += `<div style="text-align:center;color:var(--mid-gray);font-weight:600;padding:3px 0">${d}</div>`; });
    for(let i=0;i<startDow;i++) calHtml += `<div></div>`;
    for(let d=1; d<=diasEnMes; d++){
      const fechaStr = mesKey+'-'+String(d).padStart(2,'0');
      const dd = diasData[fechaStr];
      const esHoy = fechaStr === TODAY_ISO;
      const tieneRegistro = dd && (dd.dur>0 || dd.tareas.length>0);
      const bg = tieneRegistro ? (dd.dur>=360?'#2C6B3A':dd.dur>=120?'#D4A820':'#7CA87C') : (esHoy?'var(--cream)':'transparent');
      const color = tieneRegistro ? 'white' : esHoy ? 'var(--charcoal)' : 'var(--mid-gray)';
      const border = esHoy ? '1.5px solid var(--charcoal)' : '1px solid transparent';
      const titleTxt = dd ? (dd.inicio?`${dd.inicio}–${dd.fin||'?'} · ${fmtDur(dd.dur)} · `:'')+(dd.tareas.length+' tareas') : '';
      calHtml += `<div title="${titleTxt}" onclick="jardProdDiaClick('${nombre}','${fechaStr}')"
        style="text-align:center;padding:5px 2px;border-radius:6px;background:${bg};color:${color};border:${border};cursor:${tieneRegistro?'pointer':'default'};font-weight:${tieneRegistro?'700':'400'}">${d}</div>`;
    }
    calHtml += '</div>';

    // Detalle de los últimos días trabajados (los 5 más recientes)
    const diasConActividad = Object.entries(diasData)
      .filter(([,d]) => d.dur>0 || d.tareas.length>0)
      .sort((a,b) => b[0].localeCompare(a[0]))
      .slice(0,5);

    let actividadHtml = '';
    if(diasConActividad.length){
      actividadHtml = `<div style="margin-top:16px;border-top:1px solid var(--light-gray);padding-top:14px">
        <div style="font-size:11px;font-weight:600;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Últimos días trabajados</div>
        <div id="jard-prod-act-${nombre.replace(/\s/g,'_')}" style="display:flex;flex-direction:column;gap:8px">
          ${diasConActividad.map(([fecha, dd]) => _jardDiaHTML(nombre, fecha, dd)).join('')}
        </div>
      </div>`;
    }

    html += `<div style="background:#FDFCFB;border:1px solid #E4E2DC;border-radius:8px;padding:16px;margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">🌿</span>
          <span style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--charcoal)">${esc(nombre)}</span>
        </div>
        <div style="display:flex;gap:20px;flex-wrap:wrap">
          <div style="text-align:center"><div style="font-size:10px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Horas mes</div><div style="font-size:22px;font-weight:700;color:var(--charcoal)">${fmtDur(totalMin)}</div></div>
          <div style="text-align:center"><div style="font-size:10px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Días</div><div style="font-size:22px;font-weight:700;color:var(--charcoal)">${diasTrabajados}</div></div>
          <div style="text-align:center"><div style="font-size:10px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Prom. diario</div><div style="font-size:22px;font-weight:700;color:#2C6B3A">${avgHoras>0?fmtDur(avgHoras):'—'}</div></div>
          <div style="text-align:center"><div style="font-size:10px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Tareas mes</div><div style="font-size:22px;font-weight:700;color:var(--charcoal)">${tareasTotal}</div></div>
        </div>
      </div>
      <div style="font-size:10px;color:var(--mid-gray)">🟢 ≥6h &nbsp;🟡 2-6h &nbsp;🌿 &lt;2h &nbsp;· Tocá un día para ver el detalle</div>
      ${calHtml}
      ${actividadHtml}
    </div>`;
  });
  el.innerHTML = html;
}

function _jardDiaHTML(nombre, fecha, dd){
  const tareasItems = dd.tareas.map(t => `
    <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #F0EEE8">
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600;color:var(--charcoal)">${esc(t.task)}</div>
        <div style="font-size:11px;color:var(--mid-gray)">${esc(t.group)} · ${esc(t.section)}</div>
        ${t.obs ? `<div style="font-size:11px;color:#5A5A50;margin-top:2px;font-style:italic">"${esc(t.obs)}"</div>` : ''}
      </div>
      ${t.horaInicio||t.horaFin ? `<div style="text-align:right;white-space:nowrap;font-size:11px;color:var(--mid-gray)">
        ${t.horaInicio?'▶ '+t.horaInicio:''}${t.horaFin?' · ⏹ '+t.horaFin:''}
        ${t.horaInicio&&t.horaFin?'<br><span style="color:#2C6B3A;font-weight:600">'+fmtDur(calcDuracion(t.horaInicio,t.horaFin))+'</span>':''}
      </div>` : ''}
    </div>`).join('');

  return `<div style="border:1px solid #E4E2DC;border-radius:6px;overflow:hidden">
    <div style="background:var(--cream);padding:8px 12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;cursor:pointer"
         onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:12px;font-weight:700;color:var(--charcoal)">${fmtDate(fecha)}</span>
        ${dd.inicio ? `<span style="font-size:11px;color:var(--mid-gray)">▶ ${dd.inicio}${dd.fin?' · ⏹ '+dd.fin:' · en curso'}</span>` : ''}
      </div>
      <div style="display:flex;gap:12px;align-items:center">
        ${dd.dur>0 ? `<span style="font-size:12px;font-weight:700;color:#2C6B3A">${fmtDur(dd.dur)}</span>` : ''}
        <span style="font-size:11px;color:var(--mid-gray)">${dd.tareas.length} tarea${dd.tareas.length!==1?'s':''}</span>
        <span style="font-size:11px;color:var(--mid-gray)">▾</span>
      </div>
    </div>
    <div style="padding:4px 12px 8px;${dd.tareas.length>2?'display:none':''}">
      ${tareasItems || '<div style="padding:8px 0;color:var(--mid-gray);font-size:12px">Sin tareas registradas ese día</div>'}
    </div>
  </div>`;
}

function jardProdDiaClick(nombre, _fecha){
  // Resaltar en el calendario y hacer scroll al día en el detalle
  const actEl = document.getElementById('jard-prod-act-'+nombre.replace(/\s/g,'_'));
  if(!actEl) return;
  actEl.scrollIntoView({behavior:'smooth', block:'nearest'});
}

function renderCtrlJard(){
  renderAlertasUrgentesJard();
  const search=(document.getElementById('ctrl-jard-search')?.value||'').toLowerCase();
  const mode=ctrlJardFilterMode;
  const secFilter=(document.getElementById('ctrl-jard-section')?.value||'');

  // KPIs
  let kOk=0,kWarn=0,kAlert=0,kNone=0;
  jardineriaData.forEach(r=>{
    const s=getDaysBadge(daysSince(r.last)).status;
    if(s==='ok')kOk++;else if(s==='warn')kWarn++;else if(s==='alert')kAlert++;else kNone++;
  });
  const totalMesJard = jardineriaData.reduce((s,r)=>s+getMonthVisits(r),0);
  document.getElementById('ctrl-jard-kpis').innerHTML=urgenciaPanelHTML('jard')+`
    <div class="card"><div class="card-label">🟢 Al día</div><div class="card-value green" style="font-size:32px">${kOk}</div><div class="card-sub">zonas recientes</div></div>
    <div class="card"><div class="card-label">🟡 Próxima</div><div class="card-value amber" style="font-size:32px">${kWarn}</div><div class="card-sub">requieren visita pronto</div></div>
    <div class="card"><div class="card-label">🔴 Urgente</div><div class="card-value red" style="font-size:32px">${kAlert}</div><div class="card-sub">intervenir hoy</div></div>
    <div class="card"><div class="card-label">⚪ Sin registro</div><div class="card-value" style="font-size:32px;color:var(--mid-gray)">${kNone}</div><div class="card-sub">primer registro pendiente</div></div>
    <div class="card"><div class="card-label">📊 Visitas este mes</div><div class="card-value" style="font-size:32px;color:var(--charcoal)">${totalMesJard}</div><div class="card-sub">${fmtMonth(CURR_MONTH)}</div></div>`;

  const tbody=document.getElementById('ctrl-jard-body');
  tbody.innerHTML='';
  let lastSec='',lastGroup='',renderedAny=false;

  jardineriaData.forEach((r,i)=>{
    const days=daysSince(r.last);
    const badge=getDaysBadge(days);
    if(mode==='alert'&&badge.status!=='alert') return;
    if(mode==='warn' &&badge.status!=='warn')  return;
    if(mode==='ok'   &&badge.status!=='ok')    return;
    if(mode==='none' &&badge.status!=='none')  return;
    if(secFilter&&r.section!==secFilter) return;
    if(search&&!r.group.toLowerCase().includes(search)&&!r.task.toLowerCase().includes(search)&&!r.section.toLowerCase().includes(search)) return;

    renderedAny=true;

    // Section header
    if(r.section!==lastSec){
      lastSec=r.section; lastGroup='';
      const sr=document.createElement('tr');
      sr.className='ctrl-section-row';
      sr.innerHTML=`<td colspan="7">${getSectionEmoji(r.section)} ZONA ${esc(r.section.toUpperCase())}</td>`;
      tbody.appendChild(sr);
    }
    // Group header
    if(r.group!==lastGroup){
      lastGroup=r.group;
      const gr=document.createElement('tr');
      gr.className='ctrl-group-row';
      gr.innerHTML=`<td colspan="7">🌿 ${esc(r.group)}</td>`;
      tbody.appendChild(gr);
    }

    const monthVisits=getMonthVisits(r);
    const alCls=badge.status==='ok'?'ok':badge.status==='warn'?'atencion':'comprar';
    const alLbl=badge.status==='ok'?'🟢 Al día':badge.status==='warn'?'🟡 Próxima':badge.status==='alert'?'🔴 Urgente':'⚪ Sin datos';
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>
        <div style="font-weight:600;font-size:13px;color:#1A1A1A;line-height:1.4">${esc(r.group)}</div>
        <span class="section-pill ${getSectionPillCls(r.section)}" style="margin-top:4px;display:inline-block">${esc(r.section)}</span>
      </td>
      <td style="font-size:13px;color:#1A1A1A">${esc(r.task)}</td>
      <td style="font-size:12.5px;color:#7A7A72;white-space:nowrap">
        ${ userRole==='gerencia'
          ? `<input type="date" value="${r.last||''}" max="${TODAY_ISO}"
               onchange="gerenciaSetFecha('jard',${i},this.value)"
               title="Editar fecha de última visita"
               style="font-size:12px;padding:4px 6px;border:1px solid #E5E3DC;border-radius:6px;color:#1A1A1A">`
          : (r.last ? fmtDate(r.last) : '<em style="color:#B0AFA5;font-size:11px">Sin registro</em>') }
        ${ r.last ? `<div style="font-size:11px;color:#B0AFA5;margin-top:3px">${_diasDesdeTxt(r.last)}</div>` : '' }
      </td>
      <td>
        <span class="alerta-badge ${alCls}"
          style="font-size:11px;padding:3px 10px;${badge.status==='none'?'background:#ECEAE4;color:#7A7A72':''}">
          ${alLbl}
        </span>
      </td>
      <td style="text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:400;color:#1A1A1A">
        ${monthVisits}
      </td>
      <td>
        <div style="display:flex;gap:6px;align-items:center">
          <select id="jard-quien-${i}" class="cl-select" style="font-size:12px;padding:5px 8px;flex:1">
            <option value="">— Jardinero —</option>
            ${JARDINEROS_LIST.map(n=>`<option ${n===(jardineroNombre||jardCurrentJardinero)?'selected':''}>${n}</option>`).join('')}
          </select>
          <button class="mark-done-btn" onclick="markJardDone(${i},document.getElementById('jard-quien-${i}').value)">✓ Hecho</button>
        </div>
      </td>
      <td style="vertical-align:middle">
        <input class="cl-obs-input" value="${esc(r.obs||'')}" placeholder="Observaciones..."
          onchange="jardineriaData[${i}].obs=this.value"
          style="width:100%;min-width:160px">
      </td>
      `;
    tbody.appendChild(tr);
  });

  if(!renderedAny){
    tbody.innerHTML='<tr><td colspan="7" style="padding:20px;text-align:center;color:var(--mid-gray)">Sin resultados para este filtro.</td></tr>';
  }
  renderJardReporte();
}

function markJardDone(i, quien){
  const r = jardineriaData[i];
  const zh = zonaHorasData[r.section+'|||'+r.group] || {};
  jardineriaLog.push({
    fecha: TODAY_ISO,
    section: r.section,
    group: r.group,
    task: r.task,
    quien: quien || jardCurrentJardinero || '',
    obs: r.obs || '',
    horaInicio: zh.inicio || r.horaInicio || '',
    horaFin: zh.fin || r.horaFin || ''
  });
  r.last = TODAY_ISO;
  r.liveVisits = (r.liveVisits||0)+1;
  if(!r.monthlyVisits) r.monthlyVisits={};
  r.monthlyVisits[CURR_MONTH] = (r.monthlyVisits[CURR_MONTH]||0)+1;
  r.quien = ''; r.obs = ''; r.canUndo = false;
  r.horaInicio = ''; r.horaFin = '';  // reiniciar el cronómetro (ya quedó en el log)
  // Actualizar contador de tareas en el turno del jardinero
  const quienFinal = quien || jardCurrentJardinero || '';
  if(quienFinal && window.jardHorarios[quienFinal]?.[TODAY_ISO]){
    window.jardHorarios[quienFinal][TODAY_ISO].tareas = (window.jardHorarios[quienFinal][TODAY_ISO].tareas||0)+1;
    fbSave('jardHorarios', window.jardHorarios);
  }
  fbSave('jardineriaData', jardineriaData);
  fbSave('jardineriaLog', jardineriaLog);
  if(document.getElementById('page-jardineria-ops')?.classList.contains('active')) renderJardOps();
  if(document.getElementById('page-control-jardineria')?.classList.contains('active')) renderCtrlJard();
}

function toggleCtrlSection(wrapId, chevId){
  const wrap = document.getElementById(wrapId);
  const chev = document.getElementById(chevId);
  if(!wrap) return;
  const open = wrap.style.display !== 'none';
  wrap.style.display = open ? 'none' : 'block';
  if(chev) chev.style.transform = open ? '' : 'rotate(90deg)';
  // Cargar productividad al abrir
  if(!open && wrapId === 'jard-prod-wrap') renderJardProdEquipo();
}

function ctrlJardFilter(mode,_btn){
  ctrlJardFilterMode=mode;
  ['all','alert','warn','ok','none'].forEach(m=>{
    const b=document.getElementById('ctj-'+m);
    if(b) b.classList.toggle('active',m===mode);
  });
  renderCtrlJard();
}

function exportCtrlCSV(){
  const months = getAllMonths(jardineriaData);
  const pastMonths = months.filter(m=>m!==CURR_MONTH);
  const rows=[['Seccion','Zona / Grupo','Tarea / Planta','Ultima visita','Dias','Visitas este mes',...pastMonths.map(m=>fmtMonth(m))]];
  jardineriaData.forEach(r=>{
    const days=daysSince(r.last);
    rows.push([r.section,r.group,r.task,r.last||'Sin datos',days!==null?days:'—',
      getMonthVisits(r),...pastMonths.map(m=>getMonthVisits(r,m))]);
  });
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='jardineria_control_'+TODAY_ISO+'.csv';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

// ── HABITACIONES ────────────────────────
function initCtrlHab(){}

let hopsFilter = 'all';
function setHopsFilter(mode){
  hopsFilter = mode;
  ['all','alert','warn','ok'].forEach(m=>{
    const btn = document.getElementById('hops-btn-'+m);
    if(btn) btn.classList.toggle('active', m===mode);
  });
  renderHabOps();
}

function renderHabOps(){
  let kOk=0,kWarn=0,kAlert=0;
  habitacionesData.forEach(r=>{
    const s=getDaysBadge(daysSince(r.last)).status;
    if(s==='ok')kOk++;else if(s==='warn')kWarn++;else kAlert++;
  });
  const kpisEl = document.getElementById('hops-kpis');
  if(kpisEl) kpisEl.innerHTML=`
    <div class="card"><div class="card-label">🔴 Urgente</div><div class="card-value red" style="font-size:32px">${kAlert}</div><div class="card-sub">visitar hoy</div></div>
    <div class="card"><div class="card-label">🟡 Próxima</div><div class="card-value amber" style="font-size:32px">${kWarn}</div><div class="card-sub">próxima visita</div></div>
    <div class="card"><div class="card-label">🟢 Al día</div><div class="card-value green" style="font-size:32px">${kOk}</div><div class="card-sub">al día</div></div>`;

  const statusOrder = {alert:0, warn:1, ok:2, none:3};
  const sorted = habitacionesData
    .map((r,i)=>({r, i, days:daysSince(r.last), badge:getDaysBadge(daysSince(r.last))}))
    .sort((a,b)=> statusOrder[a.badge.status] - statusOrder[b.badge.status] || (b.days||999) - (a.days||999));

  const grid = document.getElementById('hops-grid');
  if(!grid) return;
  grid.innerHTML = '';

  sorted.forEach(({r, i, badge})=>{
    if(hopsFilter !== 'all' && badge.status !== hopsFilter) return;

    const borderColor = badge.status==='alert' ? '#E53935' : badge.status==='warn' ? '#F59E0B' : '#43A047';
    const monthVisits = getMonthVisits(r);

    const card = document.createElement('div');
    card.style.cssText = `background:var(--warm-white);border:1px solid ${borderColor};border-left:4px solid ${borderColor};border-radius:6px;padding:16px;display:flex;flex-direction:column;gap:10px`;

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <div style="font-size:20px;font-weight:600;color:var(--charcoal);font-family:'Cormorant Garamond',serif">🛏 Hab. ${esc(r.hab)}</div>
        <span class="days-badge ${badge.cls}" style="flex-shrink:0">${badge.label}</span>
      </div>
      ${r.comentarioHK ? `<div style="background:#FDF3E3;border:1px solid #E9D8B0;border-radius:6px;padding:8px 11px;font-size:12.5px;color:#8A5A16;line-height:1.4"><strong>🧹 Housekeeping:</strong> ${esc(r.comentarioHK)}</div>` : ''}
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--mid-gray)">
        <span>📅 Última visita: ${r.last ? fmtDate(r.last) : '<em>Sin registro</em>'}</span>
        <span style="font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--charcoal)" title="Visitas este mes">📊 ${monthVisits} <span style="font-size:10px;color:var(--mid-gray)">este mes</span></span>
      </div>
      <textarea id="hops-obs-${i}" class="cl-obs-input" placeholder="Observaciones..." style="width:100%;font-size:12px;resize:vertical;min-height:44px;padding:5px 7px;border-radius:4px;border:1px solid var(--light-gray);font-family:inherit;background:var(--warm-white)"
        onchange="habitacionesData[${i}].notas=this.value">${esc(r.notas||'')}</textarea>
      <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
        <select id="hops-quien-${i}" class="cl-select" style="font-size:12px;padding:5px 8px;flex:1">
          <option value="">— Jardinero —</option>
          <option>Sole</option><option>Berni</option><option>Ivan</option>
        </select>
        <button class="mark-done-btn" style="flex:1" onclick="hopsVisita(${i})">✓ Visité hoy</button>
      </div>`;
    grid.appendChild(card);
  });

  if(grid.children.length === 0){
    grid.innerHTML = `<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--mid-gray);font-size:14px">
      ${hopsFilter==='all' ? '🪴 Sin habitaciones cargadas.' : '✅ Sin habitaciones en esta categoría.'}
    </div>`;
  }
}

function hopsVisita(i){
  const quien = document.getElementById('hops-quien-'+i)?.value || '';
  markHabDone(i, quien);
  renderHabOps();
  if(document.getElementById('page-control-habitaciones')?.classList.contains('active')) renderCtrlHab();
}


function habsRegistrarHora(i, campo){
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2,'0');
  const mm  = String(now.getMinutes()).padStart(2,'0');
  habitacionesData[i][campo] = hh+':'+mm;
  fbSave('habitacionesData', habitacionesData);
  if(campo === 'horaFin'){
    hopsVisita(i);
  } else {
    renderHabOps();
  }
}

function habsResetHora(i, campo){
  habitacionesData[i][campo] = '';
  fbSave('habitacionesData', habitacionesData);
  renderHabOps();
}

function habsHoraCell(i, campo, r){
  const val  = r[campo] || '';
  const done = false;
  if(val){
    const color = campo==='horaInicio' ? '#2C4A3E' : '#8B3A3A';
    const bg    = campo==='horaInicio' ? '#EBF5E8' : '#FDF0F0';
    const reset = done ? '' : `onclick="habsResetHora(${i},'${campo}')" title="Tocar para borrar"`;
    return `<span ${reset} style="font-size:13px;font-weight:700;color:${color};background:${bg};padding:3px 10px;border-radius:8px;display:inline-block;${done?'':'cursor:pointer'}">${val}</span>`;
  }
  const dis   = done ? 'disabled style="opacity:.45;cursor:not-allowed"' : '';
  const label = campo==='horaInicio' ? '▶&nbsp;Inicio' : '⏹&nbsp;Fin';
  const cls   = campo==='horaInicio' ? 'btn-hora-inicio' : 'btn-hora-fin';
  return `<button class="${cls}" ${dis} onclick="habsRegistrarHora(${i},'${campo}')">${label}</button>`;
}

function renderCtrlHab(){
  const search=(document.getElementById('ctrl-hab-search')?.value||'').toLowerCase();
  const mode=ctrlHabFilterMode;

  let kOk=0,kWarn=0,kAlert=0;
  habitacionesData.forEach(r=>{
    const s=getDaysBadge(daysSince(r.last)).status;
    if(s==='ok')kOk++;else if(s==='warn')kWarn++;else kAlert++;
  });

  const totalMesHab = habitacionesData.reduce((s,r)=>s+getMonthVisits(r),0);
  document.getElementById('ctrl-hab-kpis').innerHTML=urgenciaPanelHTML('hab')+`
    <div class="card"><div class="card-label">🟢 Al día</div><div class="card-value green" style="font-size:32px">${kOk}</div><div class="card-sub">visitadas recientemente</div></div>
    <div class="card"><div class="card-label">🟡 Próxima</div><div class="card-value amber" style="font-size:32px">${kWarn}</div><div class="card-sub">programar ingreso</div></div>
    <div class="card"><div class="card-label">🔴 Urgente</div><div class="card-value red" style="font-size:32px">${kAlert}</div><div class="card-sub">ingresar esta semana</div></div>
    <div class="card"><div class="card-label">Total registradas</div><div class="card-value" style="font-size:32px">${habitacionesData.length}</div><div class="card-sub">habitaciones con plantas</div></div>
    <div class="card"><div class="card-label">📊 Visitas este mes</div><div class="card-value" style="font-size:32px;color:var(--charcoal)">${totalMesHab}</div><div class="card-sub">${fmtMonth(CURR_MONTH)}</div></div>`;

  const tbody=document.getElementById('ctrl-hab-body');
  tbody.innerHTML='';
  let renderedAny=false;
  const isHK = userRole==='housekeeping';

  // Sort by days desc (most urgent first)
  const sorted=[...habitacionesData.entries()].sort((a,b)=>{
    const da=daysSince(a[1].last)??999;
    const db=daysSince(b[1].last)??999;
    return db-da;
  });

  sorted.forEach(([i,r])=>{
    const days=daysSince(r.last);
    const badge=getDaysBadge(days);
    if(mode==='alert'&&badge.status!=='alert') return;
    if(mode==='warn' &&badge.status!=='warn')  return;
    if(mode==='ok'   &&badge.status!=='ok')    return;
    if(search&&!r.hab.includes(search)) return;
    renderedAny=true;

    const monthVisits=getMonthVisits(r);
    const alCls=badge.status==='ok'?'ok':badge.status==='warn'?'atencion':'comprar';
    const alLbl=badge.status==='ok'?'🟢 Al día':badge.status==='warn'?'🟡 Próxima':'🔴 Urgente';
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td><span class="hab-num">Hab. ${esc(r.hab)}</span></td>
      <td style="font-size:12.5px;color:#7A7A72;white-space:nowrap">
        ${ userRole==='gerencia'
          ? `<input type="date" value="${r.last||''}" max="${TODAY_ISO}"
               onchange="gerenciaSetFecha('hab',${i},this.value)"
               title="Editar fecha de última visita"
               style="font-size:12px;padding:4px 6px;border:1px solid #E5E3DC;border-radius:6px;color:#1A1A1A">`
          : (r.last ? fmtDate(r.last) : '<em style="color:#B0AFA5">—</em>') }
        ${ r.last ? `<div style="font-size:11px;color:#B0AFA5;margin-top:3px">${_diasDesdeTxt(r.last)}</div>` : '' }
      </td>
      <td>
        <span class="alerta-badge ${alCls}" style="font-size:11px;padding:3px 10px">${alLbl}</span>
      </td>
      <td style="text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:400;color:#1A1A1A">
        ${monthVisits}
      </td>
      <td>
        ${isHK
          ? '<span style="color:var(--mid-gray);font-size:12px">👁 solo lectura</span>'
          : `<div style="display:flex;gap:6px;align-items:center">
          <select id="hab-quien-${i}" class="cl-select" style="font-size:12px;padding:5px 8px;flex:1">
            <option value="">— Jardinero —</option>
            <option>Sole</option><option>Berni</option><option>Ivan</option>
          </select>
          <button class="mark-done-btn" onclick="markHabDone(${i},document.getElementById('hab-quien-${i}').value)">✓ Ingresé</button>
        </div>`}
      </td>
      <td style="vertical-align:middle">
        ${isHK
          ? `<span style="font-size:12.5px;color:#7A7A72">${esc(r.notas||'—')}</span>`
          : `<input class="cl-obs-input" value="${esc(r.notas||'')}" placeholder="Observaciones..."
          onchange="habitacionesData[${i}].notas=this.value"
          style="width:100%;min-width:160px">`}
      </td>
      <td style="vertical-align:middle">
        <input class="cl-obs-input" value="${esc(r.comentarioHK||'')}" placeholder="Ej. planta seca, yuyos..."
          onchange="setHabComentarioHK(${i},this.value)"
          style="width:100%;min-width:150px;border-color:${r.comentarioHK?'#E9D8B0':'var(--light-gray)'};background:${r.comentarioHK?'#FDF9EF':'var(--warm-white)'}">
      </td>`;
    tbody.appendChild(tr);
  });

  if(!renderedAny){
    tbody.innerHTML='<tr><td colspan="7" style="padding:20px;text-align:center;color:var(--mid-gray)">Sin resultados para este filtro.</td></tr>';
  }
  renderHabReporte();
  renderHabLog();
}

function markHabDone(i, quien){
  const r = habitacionesData[i];
  habitacionesLog.push({
    fecha: TODAY_ISO,
    hab: r.hab,
    quien: quien || '',
    obs: r.notas || ''
  });
  r.last = TODAY_ISO;
  r.liveVisits = (r.liveVisits||0)+1;
  if(!r.monthlyVisits) r.monthlyVisits={};
  r.monthlyVisits[CURR_MONTH] = (r.monthlyVisits[CURR_MONTH]||0)+1;
  r.quien = ''; r.notas = ''; r.comentarioHK = ''; r.canUndo = false;
  fbSave('habitacionesData', habitacionesData);
  fbSave('habitacionesLog', habitacionesLog);
  if(document.getElementById('page-hab-ops')?.classList.contains('active')) renderHabOps();
  if(document.getElementById('page-control-habitaciones')?.classList.contains('active')) renderCtrlHab();
}

// Comentario de Housekeeping por habitación (se ve en Jardinería y se limpia al ingresar).
function setHabComentarioHK(i, val){
  if(!habitacionesData[i]) return;
  habitacionesData[i].comentarioHK = val;
  window._habLastSave = Date.now();
  fbSave('habitacionesData', habitacionesData);
  if(document.getElementById('page-hab-ops')?.classList.contains('active')) renderHabOps();
}

function ctrlHabFilter(mode,_btn){
  ctrlHabFilterMode=mode;
  ['all','alert','warn','ok'].forEach(m=>{
    const b=document.getElementById('cth-'+m);
    if(b) b.classList.toggle('active',m===mode);
  });
  renderCtrlHab();
}

function exportHabCSV(){
  const months = getAllMonths(habitacionesData);
  const pastMonths = months.filter(m=>m!==CURR_MONTH);
  const rows=[['Habitación','Última visita','Días','Estado','Visitas este mes',...pastMonths.map(m=>fmtMonth(m)),'Notas']];
  habitacionesData.forEach(r=>{
    const days=daysSince(r.last);
    const badge=getDaysBadge(days);
    rows.push([r.hab,r.last||'Sin datos',days!==null?days:'—',
      badge.status==='ok'?'Al día':badge.status==='warn'?'Próxima':'Urgente',
      getMonthVisits(r),...pastMonths.map(m=>getMonthVisits(r,m)),r.notas||'']);
  });
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='habitaciones_control_'+TODAY_ISO+'.csv';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

// ── REPORTES MENSUALES ──────────────────────────────────────────────────────
let jardReporteMes = CURR_MONTH;
let habReporteMes  = CURR_MONTH;
function setJardReporteMes(m){ jardReporteMes=m; renderJardReporte(); }
function setHabReporteMes(m){  habReporteMes=m;  renderHabReporte(); }

function renderJardReporte(){
  const el = document.getElementById('jard-reporte-body');
  if(!el) return;
  const months = getAllMonths(jardineriaData);
  if(months.length === 0){
    el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--mid-gray);font-size:13px">Aún no hay historial mensual. Los contadores arrancan desde este mes.</div>';
    return;
  }
  if(!months.includes(jardReporteMes)) jardReporteMes = months[0];
  const ym = jardReporteMes;
  const monthTotal = jardineriaData.reduce((s,r)=>s+getMonthVisits(r,ym),0);
  const pills = months.map(m=>`<button onclick="setJardReporteMes('${m}')"
      style="padding:4px 14px;border-radius:20px;border:1px solid var(--light-gray);background:${m===ym?'var(--charcoal)':'transparent'};color:${m===ym?'white':'var(--charcoal)'};font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">
      ${fmtMonth(m)}</button>`).join('');
  const rows = jardineriaData.filter(r=>getMonthVisits(r,ym)>0).sort((a,b)=>getMonthVisits(b,ym)-getMonthVisits(a,ym));
  const tableHtml = rows.length
    ? `<table style="width:100%;border-collapse:collapse;font-size:12.5px"><thead><tr>
        <th style="text-align:left;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;background:var(--cream)">Secci&oacute;n</th>
        <th style="text-align:left;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;background:var(--cream)">Zona</th>
        <th style="text-align:left;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;background:var(--cream)">Tarea</th>
        <th style="text-align:center;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;background:var(--cream)">Visitas</th>
      </tr></thead><tbody>
      ${rows.map(r=>`<tr>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);font-size:11px;color:var(--mid-gray)">${esc(r.section)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);color:var(--mid-gray);font-size:12px">${esc(r.group)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);font-weight:500">${esc(r.task)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--charcoal)">${getMonthVisits(r,ym)}</td>
      </tr>`).join('')}</tbody></table>`
    : `<div style="padding:20px;text-align:center;color:var(--mid-gray)">Sin visitas registradas para ${fmtMonth(ym)}.</div>`;
  el.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
      <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray);font-weight:500">Mes:</span>${pills}
    </div>
    <div style="background:var(--cream);border-radius:8px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--mid-gray);font-weight:500;margin-bottom:4px">${fmtMonth(ym)}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:400;color:var(--charcoal);line-height:1">${monthTotal} <span style="font-size:15px;color:var(--mid-gray)">visitas registradas</span></div>
      </div>
      <button class="btn-secondary" onclick="exportMesJard('${ym}')">&#8595; Exportar este mes</button>
    </div>${tableHtml}`;
}

function renderHabReporte(){
  const el = document.getElementById('hab-reporte-body');
  if(!el) return;
  const months = getAllMonths(habitacionesData);
  if(months.length === 0){
    el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--mid-gray);font-size:13px">Aún no hay historial mensual. Los contadores arrancan desde este mes.</div>';
    return;
  }
  if(!months.includes(habReporteMes)) habReporteMes = months[0];
  const ym = habReporteMes;
  const monthTotal = habitacionesData.reduce((s,r)=>s+getMonthVisits(r,ym),0);
  const pills = months.map(m=>`<button onclick="setHabReporteMes('${m}')"
      style="padding:4px 14px;border-radius:20px;border:1px solid var(--light-gray);background:${m===ym?'var(--charcoal)':'transparent'};color:${m===ym?'white':'var(--charcoal)'};font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">
      ${fmtMonth(m)}</button>`).join('');
  const rows = habitacionesData.filter(r=>getMonthVisits(r,ym)>0).sort((a,b)=>getMonthVisits(b,ym)-getMonthVisits(a,ym));
  const tableHtml = rows.length
    ? `<table style="width:100%;border-collapse:collapse;font-size:12.5px;max-width:400px"><thead><tr>
        <th style="text-align:left;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;background:var(--cream)">Habitaci&oacute;n</th>
        <th style="text-align:center;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;background:var(--cream)">Visitas</th>
      </tr></thead><tbody>
      ${rows.map(r=>`<tr>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);font-weight:600;font-family:'Cormorant Garamond',serif;font-size:16px">Hab. ${esc(r.hab)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--charcoal)">${getMonthVisits(r,ym)}</td>
      </tr>`).join('')}</tbody></table>`
    : `<div style="padding:20px;text-align:center;color:var(--mid-gray)">Sin visitas registradas para ${fmtMonth(ym)}.</div>`;
  el.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
      <span style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray);font-weight:500">Mes:</span>${pills}
    </div>
    <div style="background:var(--cream);border-radius:8px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--mid-gray);font-weight:500;margin-bottom:4px">${fmtMonth(ym)}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:400;color:var(--charcoal);line-height:1">${monthTotal} <span style="font-size:15px;color:var(--mid-gray)">visitas registradas</span></div>
      </div>
      <button class="btn-secondary" onclick="exportMesHab('${ym}')">&#8595; Exportar este mes</button>
    </div>${tableHtml}`;
}

function exportMesJard(ym){
  const rows=[['Seccion','Zona / Grupo','Tarea / Planta','Visitas '+fmtMonth(ym)]];
  jardineriaData.forEach(r=>{ const v=getMonthVisits(r,ym); if(v>0) rows.push([r.section,r.group,r.task,v]); });
  _downloadCSV(rows,'jardineria_'+ym+'.csv');
}
function exportMesHab(ym){
  const rows=[['Habitacion','Visitas '+fmtMonth(ym)]];
  habitacionesData.forEach(r=>{ const v=getMonthVisits(r,ym); if(v>0) rows.push([r.hab,v]); });
  _downloadCSV(rows,'habitaciones_'+ym+'.csv');
}
function _downloadCSV(rows, filename){
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function renderJardLog(){
  const el = document.getElementById('jard-log-body');
  if(!el) return;
  if(!jardineriaLog.length){
    el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--mid-gray);font-size:13px">Sin registros aún. Los registros aparecen aquí cuando alguien marca ✓ Hecho.</div>';
    return;
  }
  const sorted = [...jardineriaLog].reverse().slice(0,100);
  const rows = sorted.map(r=>`<tr>
    <td style="white-space:nowrap;font-size:12px">${r.fecha||''}</td>
    <td style="font-size:11px;color:var(--mid-gray)">${esc(r.section||'')}</td>
    <td style="font-size:12px">${esc(r.group||'')}</td>
    <td style="font-size:12px;font-weight:500">${esc(r.task||'')}</td>
    <td><span class="responsable-tag" style="font-size:11px">${esc(r.quien||'—')}</span></td>
    <td style="font-size:12px;color:var(--mid-gray)">${esc(r.obs||'—')}</td>
  </tr>`).join('');
  el.innerHTML = `<div class="table-wrapper"><table class="ctrl-table"><thead><tr>
    <th>Fecha</th><th>Sección</th><th>Zona</th><th>Tarea</th><th>Responsable</th><th>Observaciones</th>
  </tr></thead><tbody>${rows}</tbody></table></div>`;
}

function renderHabLog(){
  const el = document.getElementById('hab-log-body');
  if(!el) return;
  if(!habitacionesLog.length){
    el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--mid-gray);font-size:13px">Sin registros aún. Los registros aparecen aquí cuando alguien marca ✓ Ingresé.</div>';
    return;
  }
  const sorted = [...habitacionesLog].reverse().slice(0,100);
  const rows = sorted.map(r=>`<tr>
    <td style="white-space:nowrap;font-size:12px">${r.fecha||''}</td>
    <td><span class="hab-num">Hab. ${esc(r.hab||'')}</span></td>
    <td><span class="responsable-tag" style="font-size:11px">${esc(r.quien||'—')}</span></td>
    <td style="font-size:12px;color:var(--mid-gray)">${esc(r.obs||'—')}</td>
  </tr>`).join('');
  el.innerHTML = `<div class="table-wrapper"><table class="ctrl-table"><thead><tr>
    <th>Fecha</th><th>Habitación</th><th>Responsable</th><th>Observaciones</th>
  </tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ════════════════════════════════════════
// DATA — LISTA DE PRECIOS
// ════════════════════════════════════════
let listaPreciosData = [];
window._setListaPreciosData = (arr) => { listaPreciosData.splice(0, listaPreciosData.length, ...arr); };

// ── CSS para lista de precios ─────────────────────────────────────────────────
(function injectLpCss(){
  const s = document.createElement('style');
  s.textContent = `
    .lp-section { margin-bottom: 32px; }
    .lp-section-header {
      display: flex; align-items: center; justify-content: space-between;
      background: #111110; color: #F7F5F2; border-radius: 4px;
      padding: 12px 20px; margin-bottom: 0; cursor: pointer;
    }
    .lp-section-header:hover { background: #1E1E1C; }
    .lp-section-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400; display:flex;align-items:center;gap:10px; }
    .lp-section-actions { display:flex; gap:8px; align-items:center; }
    .lp-items-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 14px; padding: 16px 0 4px;
    }
    .lp-card {
      background: #FDFCFB; border: 1px solid #E4E2DC; border-radius: 4px;
      overflow: hidden; transition: box-shadow .2s;
    }
    .lp-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,.09); }
    .lp-card-photo {
      width: 100%; height: 150px; object-fit: cover; display: block;
      background: linear-gradient(135deg, #EDE8E2, #D8D4CC);
    }
    .lp-card-photo-placeholder {
      width: 100%; height: 150px; background: linear-gradient(135deg,#EDE8E2,#D8D4CC);
      display: flex; flex-direction:column; align-items: center; justify-content: center;
      font-size: 36px; color: var(--mid-gray); gap: 6px; cursor:pointer;
    }
    .lp-card-photo-placeholder span { font-size:11px; letter-spacing:1px; text-transform:uppercase; }
    .lp-card-body { padding: 14px 16px; }
    .lp-card-name {
      font-family: 'Cormorant Garamond', serif; font-size: 17px; font-weight: 500;
      color: var(--charcoal); margin-bottom: 3px; border:none; background:transparent;
      width:100%; outline:none; padding:2px 0; border-bottom:1px solid transparent;
      transition: border-color .2s;
    }
    .lp-card-name:focus { border-bottom-color: var(--sage); }
    .lp-card-desc {
      font-size: 11.5px; color: var(--mid-gray); margin-bottom: 10px; line-height: 1.5;
      border:none; background:transparent; width:100%; outline:none; resize:none;
      min-height:32px; font-family:'DM Sans',sans-serif; padding:2px 0;
      border-bottom:1px solid transparent; transition: border-color .2s;
    }
    .lp-card-desc:focus { border-bottom-color: var(--sage); }
    .lp-card-footer { display:flex; align-items:center; justify-content:space-between; }
    .lp-price-input {
      font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 500;
      color: #1A1A1A; border:none; background:transparent; outline:none; width:130px;
      border-bottom:1px solid transparent; transition: border-color .2s;
    }
    .lp-price-input:focus { border-bottom-color: var(--sage); }
    .lp-card-actions { display:flex; gap:4px; }
    .lp-photo-strip { display:flex; gap:5px; flex-wrap:wrap; padding:10px 14px 0; }
    .lp-photo-thumb {
      position:relative; width:60px; height:60px; border-radius:5px; overflow:hidden;
      border:1px solid var(--light-gray); flex-shrink:0;
    }
    .lp-photo-thumb img { width:100%;height:100%;object-fit:cover;cursor:pointer; }
    .lp-photo-del {
      position:absolute;top:2px;right:2px;background:rgba(0,0,0,.55);color:white;
      border:none;border-radius:50%;width:16px;height:16px;font-size:10px;cursor:pointer;
      display:flex;align-items:center;justify-content:center;line-height:1;
    }
    .lp-add-photo {
      width:60px;height:60px;border-radius:5px;border:2px dashed var(--light-gray);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      cursor:pointer;font-size:10px;color:var(--mid-gray);gap:2px;flex-shrink:0;
    }
  `;
  document.head.appendChild(s);
})();

// ── RAMOS DISPONIBLES ─────────────────────────────────────────────────────────
let ramosDispData = [];
window._setRamosDispData = (arr) => { ramosDispData.splice(0, ramosDispData.length, ...arr); };

function openRamoPhoto(src, nombre){
  let ov = document.getElementById('ramo-photo-viewer');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'ramo-photo-viewer';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:2000;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;padding:20px;cursor:zoom-out';
    ov.onclick = () => ov.remove();
    document.body.appendChild(ov);
  }
  ov.innerHTML = `
    <button onclick="event.stopPropagation();document.getElementById('ramo-photo-viewer').remove()" style="position:absolute;top:18px;right:26px;background:none;border:none;color:white;font-size:28px;cursor:pointer;font-family:'Cormorant Garamond',serif">✕</button>
    <div style="font-size:16px;color:rgba(255,255,255,.7);letter-spacing:.08em;margin-bottom:6px">${nombre}</div>
    <img src="${src}" style="max-width:90vw;max-height:82vh;border-radius:8px;object-fit:contain;box-shadow:0 10px 50px rgba(0,0,0,.5)">`;
}

function renderRamosDisp(){
  // Poblar selector de venta directa
  const vdProd = document.getElementById('vd-prod');
  if(vdProd && !vdProd._populated){
    let opts = '<option value="">— Seleccionar —</option>';
    if(recetasData.length){
      opts += '<optgroup label="🫙 Composiciones">';
      recetasData.forEach(r => {
        const costo = calcCostoComposicion(r);
        const margen = cotizadorConfig?.margen ?? 30;
        const precio = Math.round(costo*(1+margen/100));
        opts += `<option value="${esc(r.nombre)}" data-precio="${precio}">${arregloEmoji(r.nombre)} ${esc(r.nombre)} — $${precio.toLocaleString('es-AR')}</option>`;
      });
      opts += '</optgroup>';
    }
    listaPreciosData.forEach(cat => {
      if(!(cat.items||[]).length) return;
      opts += `<optgroup label="${cat.emoji||'📦'} ${esc(cat.cat)}">`;
      cat.items.forEach(it => {
        opts += `<option value="${esc(it.nombre)}" data-precio="${parseMoney(it.precio)}">${esc(it.nombre)} — ${esc(it.precio||'')}</option>`;
      });
      opts += '</optgroup>';
    });
    opts += '<option value="__otro__">+ Otro</option>';
    vdProd.innerHTML = opts;
    vdProd._populated = true;
  }
  const grid = document.getElementById('rd-grid');
  if(!grid) return;
  const search = (document.getElementById('rd-search')?.value||'').toLowerCase();

  const visibles = ramosDispData
    .map((r,i)=>({r,i}))
    .filter(({r}) => !search || (r.nombre||'').toLowerCase().includes(search) || (r.desc||'').toLowerCase().includes(search) || (r.categoria||'').toLowerCase().includes(search));

  if(ramosDispData.length === 0){
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 20px;color:var(--mid-gray)">
      <div style="font-size:40px;margin-bottom:10px">💐</div>
      <div style="font-size:15px;font-weight:600;color:#7A7A72">No hay ramos armados en este momento</div>
      <div style="font-size:13px;margin-top:6px">Cargá los ramos que estén listos para vender con "+ Cargar ramo armado".</div>
    </div>`;
    return;
  }
  if(visibles.length === 0){
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--mid-gray)">Sin resultados para "${esc(search)}".</div>`;
    return;
  }

  grid.innerHTML = visibles.map(({r,i}) => {
    const foto = r.foto
      ? `<img class="lp-card-photo" src="${r.foto}" style="cursor:pointer" onclick="openRamoPhoto(this.src,'${esc(r.nombre).replace(/'/g,"\\'")}')">`
      : `<div class="lp-card-photo-placeholder" style="cursor:default"><span style="font-size:28px">💐</span></div>`;
    return `<div class="lp-card">
      ${foto}
      <div class="lp-card-body">
        ${r.categoria?`<span class="section-pill" style="background:#EBF0E8;color:var(--sage-dark);display:inline-block;margin-bottom:6px">${esc(r.categoria)}</span>`:''}
        <div class="lp-card-name" style="font-weight:600">${esc(r.nombre)}</div>
        <div class="lp-card-desc" style="min-height:auto;color:#7A7A72;font-size:12.5px;margin:4px 0 8px">${esc(r.desc||'')}</div>
        <div class="lp-card-footer">
          <div class="lp-price-input" style="font-weight:700;color:#1A1A1A">${esc(r.precio||'A consultar')}</div>
          <div class="lp-card-actions" style="display:flex;gap:6px">
            <button class="btn-add" style="padding:6px 12px;font-size:12px" onclick="openVentaRamo(${i})">✓ Vender</button>
            ${userRole!=='ventas' ? `<button class="btn-icon" onclick="cambiarFotoRamo(${i})" title="Cambiar foto">📷</button>` : ''}
            ${userRole!=='ventas' ? `<button class="btn-icon" style="color:var(--red-alert)" onclick="delRamo(${i})" title="Descartar (no registra venta)">✕</button>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function openRamoModal(){
  // Poblar categorías desde la Lista de Precios
  const catSel = document.getElementById('ramo-cat-sel');
  const conItems = listaPreciosData.filter(c => (c.items||[]).length > 0);
  if(conItems.length === 0){
    showToast('⚠️ No hay productos cargados en la Lista de Precios');
    return;
  }
  catSel.innerHTML = '<option value="">— Seleccionar categoría —</option>' +
    listaPreciosData.map((c,i)=> (c.items||[]).length
      ? `<option value="${i}">${c.emoji||'🌿'} ${esc(c.cat)}</option>` : '').join('');
  document.getElementById('ramo-prod-sel').innerHTML = '<option value="">— Elegí primero una categoría —</option>';
  document.getElementById('ramo-prod-info').style.display = 'none';
  const f = document.getElementById('ramo-foto'); if(f) f.value='';
  document.getElementById('ramo-modal').classList.add('open');
}

function ramoOnCatChange(){
  const ci = document.getElementById('ramo-cat-sel').value;
  const prodSel = document.getElementById('ramo-prod-sel');
  document.getElementById('ramo-prod-info').style.display = 'none';
  if(ci === ''){ prodSel.innerHTML = '<option value="">— Elegí primero una categoría —</option>'; return; }
  const items = listaPreciosData[+ci]?.items || [];
  prodSel.innerHTML = '<option value="">— Seleccionar producto —</option>' +
    items.map((it,ii)=>`<option value="${ii}">${esc(it.nombre)}</option>`).join('');
}

function ramoOnProdChange(){
  const ci = document.getElementById('ramo-cat-sel').value;
  const ii = document.getElementById('ramo-prod-sel').value;
  const info = document.getElementById('ramo-prod-info');
  if(ci === '' || ii === ''){ info.style.display = 'none'; return; }
  const it = listaPreciosData[+ci]?.items[+ii];
  if(!it){ info.style.display = 'none'; return; }
  info.style.display = 'block';
  info.innerHTML = `${it.desc?`${esc(it.desc)}<br>`:''}<span style="color:#7A7A72">Precio: <strong style="color:#1A1A1A">${esc(it.precio||'A consultar')}</strong></span>`;
}

function saveRamo(){
  const ciV = document.getElementById('ramo-cat-sel').value;
  const iiV = document.getElementById('ramo-prod-sel').value;
  if(ciV === '' || iiV === ''){ showToast('⚠️ Elegí categoría y producto'); return; }
  const cat = listaPreciosData[+ciV];
  const it  = cat?.items[+iiV];
  if(!it){ showToast('⚠️ Producto no válido'); return; }
  const fileInput = document.getElementById('ramo-foto');
  const file = fileInput?.files?.[0];
  if(!file){ showToast('📷 Agregá la foto del ramo que armaste'); return; }

  const ramo = {
    nombre: it.nombre,
    desc: it.desc || '',
    precio: it.precio || 'A consultar',
    categoria: cat.cat,
    foto: '',
    creado: TODAY_ISO
  };
  comprimirImagen(file, 1000, 0.7, data => {
    ramo.foto = data;
    ramosDispData.push(ramo);
    fbSave('ramosDispData', ramosDispData);
    closeModal('ramo-modal');
    renderRamosDisp();
    showToast('💐 Ramo cargado');
  });
}

async function delRamo(i){
  if(!await confirmModal('¿Quitar este ramo de disponibles? (no registra venta)')) return;
  ramosDispData.splice(i,1);
  fbSave('ramosDispData', ramosDispData);
  renderRamosDisp();
}

// Cambiar la foto de un ramo ya cargado (sin tener que borrarlo y recargarlo).
// El input se agrega al DOM antes de abrirlo: si queda desconectado, varios
// navegadores móviles (iOS Safari) no disparan el onchange y "no deja" cambiarla.
// La imagen se comprime para no exceder el límite de escritura de Firebase.
function cambiarFotoRamo(i){
  if(!ramosDispData[i]) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';
  document.body.appendChild(input);
  const cleanup = () => { if(input.isConnected) input.remove(); };
  input.onchange = () => {
    const file = input.files?.[0];
    if(!file){ cleanup(); return; }
    comprimirImagen(file, 1000, 0.7, data => {
      if(ramosDispData[i]){
        ramosDispData[i].foto = data;
        fbSave('ramosDispData', ramosDispData);
        renderRamosDisp();
        showToast('📷 Foto actualizada');
      }
      cleanup();
    });
  };
  // Si el usuario cancela el selector, limpiamos el input al volver el foco.
  window.addEventListener('focus', function onFocus(){
    window.removeEventListener('focus', onFocus);
    setTimeout(()=>{ if(input.isConnected && !input.files.length) cleanup(); }, 600);
  });
  input.click();
}
window.cambiarFotoRamo = cambiarFotoRamo;

// ══ STOCK DE FLOREROS ══════════════════════════════════════════════════════
// Inventario de floreros con foto y cantidad, editable.
let florerosData = [];
let _florFotoTmp = '';
window._setFlorerosData = (arr) => {
  if(window._florerosLastSave && Date.now() - window._florerosLastSave < 2000) return;
  florerosData.splice(0, florerosData.length, ...(Array.isArray(arr)?arr:Object.values(arr||{})));
  if(document.getElementById('page-floreros')?.classList.contains('active')) renderFloreros();
};

function renderFloreros(){
  const grid = document.getElementById('floreros-grid');
  if(!grid) return;
  const search = (document.getElementById('floreros-search')?.value||'').toLowerCase();
  const total = florerosData.reduce((s,f)=>s+(+f.cantidad||0),0);
  const kpi = document.getElementById('floreros-kpi');
  if(kpi) kpi.textContent = `${florerosData.length} modelo${florerosData.length!==1?'s':''} · ${total} floreros en total`;
  if(!florerosData.length){
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 20px;color:var(--mid-gray)">
      <div style="font-size:40px;margin-bottom:10px">🏺</div>
      <div style="font-size:15px;font-weight:600;color:#7A7A72">Todavía no cargaste floreros</div>
      <div style="font-size:13px;margin-top:6px">Cargá tus floreros con foto y cantidad con "+ Agregar florero".</div></div>`;
    return;
  }
  const vis = florerosData.map((f,i)=>({f,i})).filter(({f})=>!search || (f.nombre||'').toLowerCase().includes(search) || (f.notas||'').toLowerCase().includes(search));
  if(!vis.length){ grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--mid-gray)">Sin resultados para "${esc(search)}".</div>`; return; }
  grid.innerHTML = vis.map(({f,i})=>{
    const cant = +f.cantidad||0;
    const foto = f.foto
      ? `<img class="lp-card-photo" src="${f.foto}" style="cursor:pointer" onclick="openFlorFoto(${i})">`
      : `<div class="lp-card-photo-placeholder"><span style="font-size:30px">🏺</span></div>`;
    return `<div class="lp-card">
      ${foto}
      <div class="lp-card-body">
        <div class="lp-card-name" style="font-weight:600">${esc(f.nombre||'Florero')}</div>
        ${f.notas?`<div style="font-size:12px;color:#7A7A72;margin:2px 0 6px">${esc(f.notas)}</div>`:''}
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <button class="btn-icon" style="border:1px solid var(--light-gray);border-radius:6px;width:30px;height:30px;font-size:18px" onclick="florAjustar(${i},-1)">−</button>
          <span style="min-width:44px;text-align:center;font-size:22px;font-weight:700;color:${cant>0?'var(--charcoal)':'var(--red-alert)'}">${cant}</span>
          <button class="btn-icon" style="border:1px solid var(--light-gray);border-radius:6px;width:30px;height:30px;font-size:18px" onclick="florAjustar(${i},1)">+</button>
          <span style="font-size:11px;color:var(--mid-gray)">en stock</span>
        </div>
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
          <button class="btn-secondary" style="font-size:11px" onclick="openFloreroModal(${i})">✏️ Editar</button>
          <button class="btn-icon" onclick="cambiarFotoFlorero(${i})" title="Cambiar foto">📷</button>
          <button class="btn-icon" style="color:var(--red-alert)" onclick="delFlorero(${i})" title="Eliminar">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function florAjustar(i, delta){
  if(!florerosData[i]) return;
  florerosData[i].cantidad = Math.max(0, (+florerosData[i].cantidad||0) + delta);
  window._florerosLastSave = Date.now();
  fbSave('florerosData', florerosData);
  renderFloreros();
}

function openFlorFoto(i){
  const f = florerosData[i]; if(!f?.foto) return;
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer';
  ov.innerHTML=`<img src="${f.foto}" style="max-width:94vw;max-height:90vh;border-radius:12px">`;
  ov.onclick=()=>ov.remove(); document.body.appendChild(ov);
}

function openFloreroModal(idx){
  const f = idx>=0 ? florerosData[idx] : {};
  _florFotoTmp = f.foto||'';
  document.getElementById('florero-modal-title').textContent = idx>=0 ? 'Editar florero' : 'Nuevo florero';
  document.getElementById('flor-idx').value = idx;
  document.getElementById('flor-nombre').value = f.nombre||'';
  document.getElementById('flor-cantidad').value = f.cantidad!=null ? f.cantidad : '';
  document.getElementById('flor-notas').value = f.notas||'';
  document.getElementById('flor-file').value = '';
  const p = document.getElementById('flor-preview');
  if(_florFotoTmp){ p.src=_florFotoTmp; p.style.display='block'; } else { p.src=''; p.style.display='none'; }
  document.getElementById('florero-modal').classList.add('open');
}

function florFotoPreview(input){
  const file = input.files[0]; if(!file) return;
  comprimirImagen(file, 1000, 0.7, data => { _florFotoTmp = data; const p=document.getElementById('flor-preview'); p.src=data; p.style.display='block'; });
}

function guardarFlorero(){
  const nombre = document.getElementById('flor-nombre').value.trim();
  if(!nombre){ showToast('Poné un nombre al florero','error'); return; }
  const idx = +document.getElementById('flor-idx').value;
  const obj = {
    id: idx>=0 ? florerosData[idx].id : Date.now(),
    nombre,
    cantidad: Math.max(0, +document.getElementById('flor-cantidad').value||0),
    notas: document.getElementById('flor-notas').value.trim(),
    foto: _florFotoTmp||'',
  };
  if(idx>=0) florerosData[idx]=obj; else florerosData.push(obj);
  window._florerosLastSave = Date.now();
  fbSave('florerosData', florerosData);
  closeModal('florero-modal');
  renderFloreros();
  showToast('🏺 Florero guardado');
}

async function delFlorero(i){
  if(!florerosData[i]) return;
  if(!await confirmModal(`¿Eliminar "${florerosData[i].nombre||'este florero'}" del stock?`)) return;
  florerosData.splice(i,1);
  window._florerosLastSave = Date.now();
  fbSave('florerosData', florerosData);
  renderFloreros();
}

// Cambiar la foto de un florero ya cargado (input conectado al DOM, ver cambiarFotoRamo)
function cambiarFotoFlorero(i){
  if(!florerosData[i]) return;
  const input = document.createElement('input');
  input.type='file'; input.accept='image/*'; input.style.display='none';
  document.body.appendChild(input);
  const cleanup=()=>{ if(input.isConnected) input.remove(); };
  input.onchange=()=>{
    const file=input.files?.[0]; if(!file){ cleanup(); return; }
    comprimirImagen(file, 1000, 0.7, data=>{
      if(florerosData[i]){ florerosData[i].foto=data; window._florerosLastSave=Date.now(); fbSave('florerosData', florerosData); renderFloreros(); showToast('📷 Foto actualizada'); }
      cleanup();
    });
  };
  window.addEventListener('focus', function onF(){ window.removeEventListener('focus',onF); setTimeout(()=>{ if(input.isConnected && !input.files.length) cleanup(); }, 600); });
  input.click();
}

// ── STOCK DE VELAS ────────────────────────────────────────────────────────────
let velasData = [];
let _velaFotoTmp = '';
window._setVelasData = (arr) => {
  if(window._velasLastSave && Date.now() - window._velasLastSave < 2000) return;
  velasData.splice(0, velasData.length, ...(Array.isArray(arr)?arr:Object.values(arr||{})));
  if(document.getElementById('page-velas')?.classList.contains('active')) renderVelas();
};

function renderVelas(){
  const grid = document.getElementById('velas-grid');
  if(!grid) return;
  const search = (document.getElementById('velas-search')?.value||'').toLowerCase();
  const total = velasData.reduce((s,f)=>s+(+f.cantidad||0),0);
  const kpi = document.getElementById('velas-kpi');
  if(kpi) kpi.textContent = `${velasData.length} modelo${velasData.length!==1?'s':''} · ${total} velas en total`;
  if(!velasData.length){
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 20px;color:var(--mid-gray)">
      <div style="font-size:40px;margin-bottom:10px">🕯️</div>
      <div style="font-size:15px;font-weight:600;color:#7A7A72">Todavía no cargaste velas</div>
      <div style="font-size:13px;margin-top:6px">Cargá tus velas con foto y cantidad con "+ Agregar vela".</div></div>`;
    return;
  }
  const vis = velasData.map((f,i)=>({f,i})).filter(({f})=>!search || (f.nombre||'').toLowerCase().includes(search) || (f.notas||'').toLowerCase().includes(search));
  if(!vis.length){ grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--mid-gray)">Sin resultados para "${esc(search)}".</div>`; return; }
  grid.innerHTML = vis.map(({f,i})=>{
    const cant = +f.cantidad||0;
    const foto = f.foto
      ? `<img class="lp-card-photo" src="${f.foto}" style="cursor:pointer" onclick="openVelaFoto(${i})">`
      : `<div class="lp-card-photo-placeholder"><span style="font-size:30px">🕯️</span></div>`;
    return `<div class="lp-card">
      ${foto}
      <div class="lp-card-body">
        <div class="lp-card-name" style="font-weight:600">${esc(f.nombre||'Vela')}</div>
        ${f.notas?`<div style="font-size:12px;color:#7A7A72;margin:2px 0 6px">${esc(f.notas)}</div>`:''}
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <button class="btn-icon" style="border:1px solid var(--light-gray);border-radius:6px;width:30px;height:30px;font-size:18px" onclick="velaAjustar(${i},-1)">−</button>
          <span style="min-width:44px;text-align:center;font-size:22px;font-weight:700;color:${cant>0?'var(--charcoal)':'var(--red-alert)'}">${cant}</span>
          <button class="btn-icon" style="border:1px solid var(--light-gray);border-radius:6px;width:30px;height:30px;font-size:18px" onclick="velaAjustar(${i},1)">+</button>
          <span style="font-size:11px;color:var(--mid-gray)">en stock</span>
        </div>
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
          <button class="btn-secondary" style="font-size:11px" onclick="openVelaModal(${i})">✏️ Editar</button>
          <button class="btn-icon" onclick="cambiarFotoVela(${i})" title="Cambiar foto">📷</button>
          <button class="btn-icon" style="color:var(--red-alert)" onclick="delVela(${i})" title="Eliminar">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function velaAjustar(i, delta){
  if(!velasData[i]) return;
  velasData[i].cantidad = Math.max(0, (+velasData[i].cantidad||0) + delta);
  window._velasLastSave = Date.now();
  fbSave('velasData', velasData);
  renderVelas();
}

function openVelaFoto(i){
  const f = velasData[i]; if(!f?.foto) return;
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer';
  ov.innerHTML=`<img src="${f.foto}" style="max-width:94vw;max-height:90vh;border-radius:12px">`;
  ov.onclick=()=>ov.remove(); document.body.appendChild(ov);
}

function openVelaModal(idx){
  const f = idx>=0 ? velasData[idx] : {};
  _velaFotoTmp = f.foto||'';
  document.getElementById('vela-modal-title').textContent = idx>=0 ? 'Editar vela' : 'Nueva vela';
  document.getElementById('vela-idx').value = idx;
  document.getElementById('vela-nombre').value = f.nombre||'';
  document.getElementById('vela-cantidad').value = f.cantidad!=null ? f.cantidad : '';
  document.getElementById('vela-notas').value = f.notas||'';
  document.getElementById('vela-file').value = '';
  const p = document.getElementById('vela-preview');
  if(_velaFotoTmp){ p.src=_velaFotoTmp; p.style.display='block'; } else { p.src=''; p.style.display='none'; }
  document.getElementById('vela-modal').classList.add('open');
}

function velaFotoPreview(input){
  const file = input.files[0]; if(!file) return;
  comprimirImagen(file, 1000, 0.7, data => { _velaFotoTmp = data; const p=document.getElementById('vela-preview'); p.src=data; p.style.display='block'; });
}

function guardarVela(){
  const nombre = document.getElementById('vela-nombre').value.trim();
  if(!nombre){ showToast('Poné un nombre a la vela','error'); return; }
  const idx = +document.getElementById('vela-idx').value;
  const obj = {
    id: idx>=0 ? velasData[idx].id : Date.now(),
    nombre,
    cantidad: Math.max(0, +document.getElementById('vela-cantidad').value||0),
    notas: document.getElementById('vela-notas').value.trim(),
    foto: _velaFotoTmp||'',
  };
  if(idx>=0) velasData[idx]=obj; else velasData.push(obj);
  window._velasLastSave = Date.now();
  fbSave('velasData', velasData);
  closeModal('vela-modal');
  renderVelas();
  showToast('🕯️ Vela guardada');
}

async function delVela(i){
  if(!velasData[i]) return;
  if(!await confirmModal(`¿Eliminar "${velasData[i].nombre||'esta vela'}" del stock?`)) return;
  velasData.splice(i,1);
  window._velasLastSave = Date.now();
  fbSave('velasData', velasData);
  renderVelas();
}

function cambiarFotoVela(i){
  if(!velasData[i]) return;
  const input = document.createElement('input');
  input.type='file'; input.accept='image/*'; input.style.display='none';
  document.body.appendChild(input);
  const cleanup=()=>{ if(input.isConnected) input.remove(); };
  input.onchange=()=>{
    const file=input.files?.[0]; if(!file){ cleanup(); return; }
    comprimirImagen(file, 1000, 0.7, data=>{
      if(velasData[i]){ velasData[i].foto=data; window._velasLastSave=Date.now(); fbSave('velasData', velasData); renderVelas(); showToast('📷 Foto actualizada'); }
      cleanup();
    });
  };
  window.addEventListener('focus', function onF(){ window.removeEventListener('focus',onF); setTimeout(()=>{ if(input.isConnected && !input.files.length) cleanup(); }, 600); });
  input.click();
}

function openVentaRamo(i){
  const r = ramosDispData[i];
  if(!r) return;
  document.getElementById('ramo-sell-idx').value = i;
  document.getElementById('ramo-sell-info').innerHTML =
    `<strong>${esc(r.nombre)}</strong>${r.desc?` · ${esc(r.desc)}`:''}<br><span style="color:#7A7A72">Precio: ${esc(r.precio||'A consultar')}</span>`;
  document.getElementById('ramo-sell-cliente').value='';
  document.getElementById('ramo-sell-destinatario').value='';
  document.getElementById('ramo-sell-pago').value='';
  document.getElementById('ramo-sell-dedicatoria').value='';
  document.getElementById('ramo-sell-dir').value='';
  document.getElementById('ramo-sell-modal').classList.add('open');
}

function confirmVentaRamo(){
  const i = +document.getElementById('ramo-sell-idx').value;
  const r = ramosDispData[i];
  if(!r) return;
  const cliente = document.getElementById('ramo-sell-cliente').value.trim();
  // Registrar automáticamente en Ventas Externas
  ventasData.push({
    prod: r.nombre,
    desc: r.desc || '',
    cliente: cliente,
    destinatario: document.getElementById('ramo-sell-destinatario').value.trim(),
    fecha: TODAY_ISO,
    dedicatoria: document.getElementById('ramo-sell-dedicatoria').value.trim(),
    precio: r.precio || '—',
    formaPago: document.getElementById('ramo-sell-pago').value,
    estado: 'confirmado',
    dir: document.getElementById('ramo-sell-dir').value.trim(),
    fromRamo: true
  });
  fbSave('ventasData', ventasData);
  // Avisar a todos los floristas y a gerencia para que lo saquen de la vidriera
  window.pushSend?.(
    '💐 Ramo vendido',
    `"${r.nombre}" se vendió${cliente ? ' a ' + cliente : ''} — sacalo de la vidriera`,
    'ramo-vendido',
    'roles:florista,gerencia'
  );
  // Aviso a gerencia/comercial: venta registrada, pendiente de asignar.
  notificarVentaNueva(r.nombre, cliente, '');
  // Quitar el ramo del catálogo (ya no está disponible)
  ramosDispData.splice(i,1);
  fbSave('ramosDispData', ramosDispData);
  closeModal('ramo-sell-modal');
  renderRamosDisp();
  showToast('✅ Venta registrada en Ventas Externas');
}

async function vdAutoPrice(){
  const sel = document.getElementById('vd-prod');
  if(sel.value === '__otro__'){
    const custom = await promptModal('Nombre del arreglo o ramo:', { title: 'Otro producto' });
    if(custom && custom.trim()){
      const opt = document.createElement('option');
      opt.value = custom.trim(); opt.textContent = custom.trim(); opt.selected = true;
      sel.insertBefore(opt, sel.lastElementChild);
    } else { sel.value = ''; }
    return;
  }
  const selected = sel.options[sel.selectedIndex];
  const precio = selected?.dataset?.precio;
  if(precio && +precio > 0){
    document.getElementById('vd-precio').value = '$' + (+precio).toLocaleString('es-AR');
  }
}

function registrarVentaDirecta(){
  const prod = document.getElementById('vd-prod')?.value?.trim();
  if(!prod || prod === '__otro__'){ showToast('⚠️ Seleccioná el arreglo o ramo'); return; }
  const cliente = document.getElementById('vd-cliente')?.value?.trim();
  if(!cliente){ showToast('⚠️ Ingresá el nombre del cliente'); return; }

  ventasData.push({
    prod,
    desc: '',
    cliente,
    destinatario: document.getElementById('vd-destinatario')?.value || '',
    fecha: TODAY_ISO,
    dedicatoria: document.getElementById('vd-dedicatoria')?.value || '',
    precio: document.getElementById('vd-precio')?.value || '—',
    formaPago: document.getElementById('vd-pago')?.value || '',
    estado: 'confirmado',
    dir: document.getElementById('vd-dir')?.value || '',
    fromVentaDirecta: true
  });
  fbSave('ventasData', ventasData);
  notificarVentaNueva(prod, cliente, '');

  // Limpiar formulario
  ['vd-prod','vd-cliente','vd-destinatario','vd-pago','vd-precio','vd-dedicatoria','vd-dir'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = '';
  });

  renderVentas();
  showToast('💰 Venta directa registrada');
}

// ── COTIZADOR DE EVENTOS HYATT ────────────────────────────────────────────────
function initCotizadorEventosHyatt(){
  renderEvTipos(); // pobla el select de tipos
}

function calcularArreglosEvento(){
  const tipoIdx = document.getElementById('ceh-tipo')?.value;
  const pax = +document.getElementById('ceh-pax')?.value || 0;
  const resultado = document.getElementById('ceh-resultado');
  const listEl = document.getElementById('ceh-arreglos-list');
  if(!resultado || !listEl) return;

  if(!tipoIdx || tipoIdx === '' || pax <= 0){
    resultado.style.display = 'none';
    return;
  }
  resultado.style.display = '';
  const tipo = eventoPricing.tipos[+tipoIdx];
  if(!tipo || !tipo.reglas || !tipo.reglas.length){
    listEl.innerHTML = '<div style="padding:16px;text-align:center;color:var(--mid-gray)">Este tipo de evento no tiene arreglos configurados. Pedile a gerencia que los configure.</div>';
    document.getElementById('ceh-total').textContent = '$0';
    return;
  }

  const margen = tipo.margen || 0;
  let totalPrecio = 0;

  listEl.innerHTML = tipo.reglas.map((r, ri) => {
    const qty = Math.ceil(pax / r.cadaPax);
    // Buscar precio del arreglo en composiciones
    const comp = recetasData.find(c => c.nombre.toLowerCase() === r.arreglo.toLowerCase());
    let precioUnit = 0;
    if(comp){
      const costo = calcCostoComposicion(comp);
      precioUnit = Math.round(costo * (1 + margen/100));
    }
    const subtotal = precioUnit * qty;
    totalPrecio += subtotal;

    return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;padding:14px 16px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <span style="font-size:15px;font-weight:600;color:#1A1A1A">${arregloEmoji(r.arreglo)} ${esc(r.arreglo)}</span>
          <span style="font-size:12px;color:var(--mid-gray);margin-left:8px">1 cada ${r.cadaPax} personas</span>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--mid-gray)">Cantidad sugerida</div>
          <input type="number" id="ceh-qty-${ri}" value="${qty}" min="0"
            onchange="recalcTotalEvento()"
            style="width:60px;padding:4px;border:1px solid var(--light-gray);border-radius:4px;font-size:16px;font-weight:700;text-align:center;font-family:inherit">
        </div>
      </div>
      ${precioUnit > 0 ? `<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:13px">
        <span style="color:var(--mid-gray)">$${precioUnit.toLocaleString('es-AR')} c/u</span>
        <strong style="color:var(--charcoal)">$${subtotal.toLocaleString('es-AR')}</strong>
      </div>` : '<div style="font-size:11px;color:var(--amber);margin-top:4px">⚠️ Sin precio configurado — consultar a florería</div>'}
    </div>`;
  }).join('');

  document.getElementById('ceh-total').textContent = '$' + totalPrecio.toLocaleString('es-AR');
}

function recalcTotalEvento(){
  const tipoIdx = document.getElementById('ceh-tipo')?.value;
  const tipo = eventoPricing.tipos[+tipoIdx];
  if(!tipo) return;
  const margen = tipo.margen || 0;
  let total = 0;
  (tipo.reglas||[]).forEach((r, ri) => {
    const qty = +document.getElementById('ceh-qty-'+ri)?.value || 0;
    const comp = recetasData.find(c => c.nombre.toLowerCase() === r.arreglo.toLowerCase());
    if(comp){
      const costo = calcCostoComposicion(comp);
      total += Math.round(costo * (1 + margen/100)) * qty;
    }
  });
  document.getElementById('ceh-total').textContent = '$' + total.toLocaleString('es-AR');
}

function generarTextoCotEvento(){
  const nombre = document.getElementById('ceh-nombre')?.value || 'Evento';
  const pax = document.getElementById('ceh-pax')?.value || '—';
  const fecha = document.getElementById('ceh-fecha')?.value || '';
  const tipoIdx = document.getElementById('ceh-tipo')?.value;
  const tipo = eventoPricing.tipos[+tipoIdx];
  if(!tipo) return '';
  const margen = tipo.margen || 0;

  let lineas = [];
  let total = 0;
  (tipo.reglas||[]).forEach((r, ri) => {
    const qty = +document.getElementById('ceh-qty-'+ri)?.value || 0;
    if(qty <= 0) return;
    const comp = recetasData.find(c => c.nombre.toLowerCase() === r.arreglo.toLowerCase());
    let precio = 0;
    if(comp) precio = Math.round(calcCostoComposicion(comp) * (1 + margen/100));
    const sub = precio * qty;
    total += sub;
    lineas.push(`• ${qty} × ${r.arreglo}${precio ? '  —  $'+sub.toLocaleString('es-AR') : '  (precio a confirmar)'}`);
  });

  return `🌸 COTIZACIÓN DE EVENTO — Florería Duhau\n${'─'.repeat(40)}\nEvento: ${nombre}\nTipo: ${tipo.nombre}\nPersonas: ${pax}\n${fecha ? 'Fecha: '+fecha+'\n' : ''}${'─'.repeat(40)}\n\nARREGLOS FLORALES:\n${lineas.join('\n')}\n\n${'─'.repeat(40)}\nTOTAL ESTIMADO: $${total.toLocaleString('es-AR')}\n${'─'.repeat(40)}\n\nEste presupuesto es orientativo. Queda sujeto a confirmación por parte de Florería Duhau.\nConsultas: operaciones@lafloreriadelduhau.com.ar`;
}

function enviarCotizacionEvento(){
  const texto = generarTextoCotEvento();
  if(!texto) return;
  const nombre = document.getElementById('ceh-nombre')?.value || 'Evento';
  const subject = encodeURIComponent('Cotización Evento: ' + nombre + ' — Florería Duhau');
  const body = encodeURIComponent(texto);
  window.open('mailto:operaciones@lafloreriadelduhau.com.ar?subject=' + subject + '&body=' + body, '_blank');
  showToast('📧 Se abrió el mail con la cotización — envialo para confirmar');
}

function copiarCotizacionEvento(){
  const texto = generarTextoCotEvento();
  if(!texto) return;
  navigator.clipboard.writeText(texto).then(() => showToast('📋 Cotización copiada'));
}

// ══════════════════════════════════════════════════════════════════════════════
// REPORTES / ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

const _chartInstances = {};
function _destroyChart(id){ if(_chartInstances[id]){ _chartInstances[id].destroy(); delete _chartInstances[id]; } }

function _repMeses(selectId, mesesCount=12){
  const sel = document.getElementById(selectId);
  if(!sel) return;
  const cur = sel.value;
  const now = new Date();
  const opts = [];
  for(let i=0; i<mesesCount; i++){
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][d.getMonth()] + ' ' + d.getFullYear();
    opts.push(`<option value="${iso}"${iso===cur?' selected':''}>${label}</option>`);
  }
  sel.innerHTML = opts.join('');
}

function _kpiCard(label, value, sub='', color='var(--sage-dark)'){
  return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;padding:14px 16px">
    <div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px;font-weight:500">${label}</div>
    <div style="font-size:26px;font-weight:700;color:${color};line-height:1">${value}</div>
    ${sub ? `<div style="font-size:11px;color:var(--mid-gray);margin-top:4px">${sub}</div>` : ''}
  </div>`;
}

// ── Reportes Equipo ───────────────────────────────────────────────────────────
// ── AUDITORÍA DE CAMBIOS ──────────────────────────────────────────────────────
let auditLogData = {};
window._setAuditLog = (val) => { auditLogData = val && typeof val === 'object' ? val : {}; };

const AUDIT_LABELS = {
  cajaData:'Caja', ventasData:'Ventas', stockData:'Stock', eventosData:'Eventos',
  galeriaData:'Galería de Trabajos', comprasFlore:'Compras Florería', comprasJard:'Compras Jardinería',
  horariosPlantilla:'Plantilla Horarios', checklist:'Checklist', recetasData:'Composiciones',
  jardineriaData:'Jardinería', habitacionesData:'Habitaciones', listaPreciosData:'Lista de Precios',
  ramosDispData:'Ramos Disponibles', cierresCaja:'Cierre de Caja'
};

function renderAuditoria(){
  const el = document.getElementById('auditoria-body');
  if(!el) return;

  const filtroUser = document.getElementById('audit-filtro-user')?.value || '';
  const filtroKey = document.getElementById('audit-filtro-seccion')?.value || '';
  const filtroFecha = document.getElementById('audit-filtro-fecha')?.value || '';

  let entries = Object.values(auditLogData);
  if(filtroUser) entries = entries.filter(e => (e.user||'').toLowerCase().includes(filtroUser.toLowerCase()));
  if(filtroKey) entries = entries.filter(e => e.key === filtroKey);
  if(filtroFecha) entries = entries.filter(e => (e.iso||'').startsWith(filtroFecha));

  entries.sort((a,b) => (b.ts||0) - (a.ts||0));
  const shown = entries.slice(0,100);

  if(!shown.length){ el.innerHTML='<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--mid-gray);font-size:13px">Sin registros</td></tr>'; return; }
  el.innerHTML = shown.map(e => {
    const d = new Date(e.ts||0);
    const hora = d.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
    const fecha = d.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'});
    return `<tr style="border-top:1px solid var(--light-gray)">
      <td style="padding:8px 12px;font-size:12px;color:var(--mid-gray)">${fecha} ${hora}</td>
      <td style="padding:8px 12px;font-size:13px;font-weight:500">${esc(e.user||'—')}</td>
      <td style="padding:8px 12px;font-size:13px">${AUDIT_LABELS[e.key]||esc(e.key||'—')}</td>
      <td style="padding:8px 12px"><span style="font-size:10px;background:var(--light-gray);padding:2px 8px;border-radius:10px;letter-spacing:.5px">${esc(e.key||'')}</span></td>
    </tr>`;
  }).join('');
}

// Horas del mes de un empleado: PROGRAMADAS (horario que carga gerencia) y
// TRABAJADAS (jornada real fichada — misma fuente `jornadaRealDia` que usan
// Productividad y la Liquidación, para que todos los reportes coincidan).
function _horasMesEmpleado(nombre, mesISO){
  const [anio, mes] = mesISO.split('-').map(Number);
  const diasMes = new Date(anio, mes, 0).getDate();
  let hsProg=0, hsTrab=0, dias=0;
  for(let d=1; d<=diasMes; d++){
    const iso = `${mesISO}-${String(d).padStart(2,'0')}`;
    const h = (window.horariosData||{})[nombre]?.[iso];
    if(h?.desde && h?.hasta){ hsProg += calcHorasDia(h.desde,h.hasta); dias++; }
    const real = jornadaRealDia(nombre, iso);
    if(real) hsTrab += real.horas;
  }
  return { hsProg, hsTrab, dias };
}

function _hhmmToMin(s){ if(!s || !/^\d{1,2}:\d{2}/.test(String(s))) return null; const [h,m]=String(s).split(':').map(Number); return h*60+m; }
function _mesPrevio(mesISO){ const [a,m]=mesISO.split('-').map(Number); const d=new Date(a,m-2,1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }

// Métricas mensuales consolidadas de un empleado (ficha 360 + ranking):
// asistencia, puntualidad, horas/cumplimiento, productividad, evaluación y llamados.
function _metricasEmpleadoMes(nombre, mesISO){
  const [anio,mes] = mesISO.split('-').map(Number);
  const diasMes = new Date(anio,mes,0).getDate();
  const GRACIA = 5; // minutos de tolerancia antes de contar "tarde"
  let hsProg=0, hsTrab=0, diasProg=0, diasFichados=0, diasTarde=0, minTarde=0;
  for(let d=1; d<=diasMes; d++){
    const iso = `${mesISO}-${String(d).padStart(2,'0')}`;
    const h = (window.horariosData||{})[nombre]?.[iso];
    if(h?.desde && h?.hasta){ hsProg += calcHorasDia(h.desde,h.hasta); diasProg++; }
    const real = jornadaRealDia(nombre, iso);
    if(real){
      hsTrab += real.horas; diasFichados++;
      const prog = h?.desde ? _hhmmToMin(h.desde) : null;
      const ini  = _hhmmToMin(real.inicio);
      if(prog!=null && ini!=null && ini > prog + GRACIA){ diasTarde++; minTarde += (ini - prog); }
    }
  }
  let tareasHechas=0, tareasExcedidas=0, minTareas=0;
  (checklistHistory||[]).forEach(e=>{
    if(e.who!==nombre || (e.date||'').slice(0,7)!==mesISO) return;
    tareasHechas++; if(e.excedida) tareasExcedidas++; minTareas += parseInt(e.duracion)||0;
  });
  (window.jardineriaLog||[]).forEach(e=>{
    if(e.quien!==nombre || (e.fecha||'').slice(0,7)!==mesISO) return;
    tareasHechas++;
  });
  const evs = (typeof evaluacionesData!=='undefined'?evaluacionesData:[]).filter(e=>e.empleadoNombre===nombre);
  const evalProm = evs.length ? evs.reduce((s,e)=>s+((+e.puntualidad||0)+(+e.calidad||0)+(+e.actitud||0)+(+e.productividad||0))/4,0)/evs.length : null;
  const llamados = (typeof llamadosData!=='undefined'?llamadosData:[]).filter(l=>l.empleadoNombre===nombre && (l.fecha||'').slice(0,7)===mesISO);
  return {
    hsProg:Math.round(hsProg*10)/10, hsTrab:Math.round(hsTrab*10)/10,
    cumplimiento: hsProg>0 ? Math.round(hsTrab/hsProg*100) : null,
    diasProg, diasFichados,
    asistencia: diasProg>0 ? Math.round(diasFichados/diasProg*100) : null,
    diasTarde, minTarde,
    tareasHechas, tareasExcedidas, minTareas,
    evalProm, evalCount:evs.length,
    llamados: llamados.length, llamadosList: llamados,
  };
}

function openFichaEmpleado(nombre, mesISO){
  mesISO = mesISO || (document.getElementById('rep-eq-mes')?.value || TODAY_ISO.slice(0,7));
  const m = _metricasEmpleadoMes(nombre, mesISO);
  const prev = _metricasEmpleadoMes(nombre, _mesPrevio(mesISO));
  let ov = document.getElementById('ficha-empleado-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='ficha-empleado-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  const trend = (cur,prv)=>{ if(cur==null||prv==null) return ''; const dd=cur-prv; if(Math.abs(dd)<1) return ' <span style="color:var(--mid-gray);font-size:12px">→</span>'; return dd>0?` <span style="color:var(--green-ok);font-size:12px">▲${dd}</span>`:` <span style="color:var(--red-alert);font-size:12px">▼${Math.abs(dd)}</span>`; };
  const card = (label, value, sub, color) => `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;padding:12px 14px">
    <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">${label}</div>
    <div style="font-size:23px;font-weight:700;color:${color||'var(--charcoal)'};line-height:1.1">${value}</div>
    <div style="font-size:11px;color:var(--mid-gray);margin-top:4px">${sub||''}</div>
  </div>`;
  const cumplCol = m.cumplimiento==null?'var(--mid-gray)':m.cumplimiento>=80?'var(--green-ok)':m.cumplimiento>=50?'#D4A820':'var(--red-alert)';
  const asisCol  = m.asistencia==null?'var(--mid-gray)':m.asistencia>=90?'var(--green-ok)':m.asistencia>=70?'#D4A820':'var(--red-alert)';
  const stars = m.evalProm!=null ? '★'.repeat(Math.round(m.evalProm))+'☆'.repeat(5-Math.round(m.evalProm)) : '—';
  ov.innerHTML = `<div class="modal" style="max-width:640px;max-height:88vh;overflow-y:auto">
    <button class="modal-close" onclick="closeModal('ficha-empleado-modal')">✕</button>
    <div class="modal-title">👤 ${esc(nombre)}</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:16px">Ficha del mes · ${esc(fmtMonth(mesISO))} · ${isJardinero(nombre)?'Jardinería':'Florería'}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">
      ${card('Asistencia', (m.asistencia!=null?m.asistencia+'%':'—'), `${m.diasFichados}/${m.diasProg} días fichados`, asisCol)}
      ${card('Puntualidad', m.diasTarde+(m.diasTarde===1?' tarde':' tarde'), m.minTarde?`${m.minTarde} min acumulados`:'sin demoras', m.diasTarde?'#D4A820':'var(--green-ok)')}
      ${card('Cumplimiento hs', (m.cumplimiento!=null?m.cumplimiento+'%'+trend(m.cumplimiento,prev.cumplimiento):'—'), `${m.hsTrab}h de ${m.hsProg}h`, cumplCol)}
      ${card('Tareas hechas', m.tareasHechas, m.tareasExcedidas?`${m.tareasExcedidas} pasadas de tiempo`:'en tiempo', 'var(--charcoal)')}
      ${card('Evaluación', stars, m.evalCount?`prom ${m.evalProm.toFixed(1)} · ${m.evalCount} eval`:'sin evaluar', 'var(--charcoal)')}
      ${card('Llamados de atención', m.llamados, 'este mes', m.llamados?'var(--red-alert)':'var(--green-ok)')}
    </div>
    ${m.llamadosList.length?`<div style="margin-top:18px"><div class="card-label">Llamados de atención del mes</div>${m.llamadosList.map(l=>`<div style="display:flex;gap:8px;align-items:center;padding:7px 0;border-top:1px solid #F0EDE8;font-size:12px">${l.foto?`<img src="${l.foto}" onclick="verFotoLlamado(${l.id})" style="width:34px;height:34px;object-fit:cover;border-radius:5px;cursor:pointer">`:'<span style="color:var(--amber)">⚠️</span>'}<span style="flex:1">${esc(l.zona||'Arreglo')}${l.nota?' — '+esc(l.nota):''}</span><span style="color:var(--mid-gray);font-size:11px">${fmtDate(l.fecha)}</span></div>`).join('')}</div>`:''}
  </div>`;
  ov.classList.add('open');
}

function renderReportesEquipo(){
  _repMeses('rep-eq-mes');
  const mesISO = document.getElementById('rep-eq-mes')?.value || TODAY_ISO.slice(0,7);
  const empleados = getEmpleadosActivos();

  // Poblar selector empleados
  const sel = document.getElementById('rep-eq-empleado');
  if(sel && sel.querySelectorAll('option').length <= 1){
    sel.innerHTML = '<option value="">— Todos —</option>' + empleados.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
  }
  const filtroEmp = document.getElementById('rep-eq-empleado')?.value || '';
  const lista = filtroEmp ? [filtroEmp] : empleados;

  let totalHsProg=0, totalHsTrab=0, diasConTurno=0, empleadosActivos=0;

  const prevMes = _mesPrevio(mesISO);
  const datosEmpleado = lista.map(nombre => {
    const m = _metricasEmpleadoMes(nombre, mesISO);
    const cumplPrev = _metricasEmpleadoMes(nombre, prevMes).cumplimiento;
    totalHsProg+=m.hsProg; totalHsTrab+=m.hsTrab; diasConTurno+=m.diasProg;
    if(m.hsProg>0) empleadosActivos++;
    return { nombre, hsProg:m.hsProg, hsTrab:m.hsTrab, dias:m.diasProg, m, cumplPrev };
  });
  // Ranking: mayor cumplimiento primero (los que no tienen datos, al final)
  datosEmpleado.sort((a,b)=>(b.m.cumplimiento??-1)-(a.m.cumplimiento??-1));

  // KPIs
  const pctGlobal = totalHsProg>0 ? Math.round(totalHsTrab/totalHsProg*100) : 0;
  document.getElementById('rep-eq-kpis').innerHTML =
    _kpiCard('Empleados activos', empleadosActivos, 'con turno en el mes') +
    _kpiCard('Horas programadas', totalHsProg.toFixed(1)+'h', 'en el mes') +
    _kpiCard('Horas registradas', totalHsTrab.toFixed(1)+'h', 'según registros', pctGlobal>=80?'var(--green-ok)':pctGlobal>=50?'#D4A820':'var(--red-alert)') +
    _kpiCard('Cumplimiento', pctGlobal+'%', 'horas trab./programadas', pctGlobal>=80?'var(--green-ok)':'#D4A820');

  // Gráfico barras hs programadas vs trabajadas
  _destroyChart('rep-eq-hs');
  const ctx1 = document.getElementById('rep-eq-chart-hs')?.getContext('2d');
  if(ctx1){
    _chartInstances['rep-eq-hs'] = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: datosEmpleado.map(d=>d.nombre),
        datasets: [
          { label: 'Programado', data: datosEmpleado.map(d=>d.hsProg), backgroundColor: 'rgba(101,130,90,0.3)', borderColor: '#65825A', borderWidth: 2, borderRadius: 4 },
          { label: 'Trabajado', data: datosEmpleado.map(d=>d.hsTrab), backgroundColor: 'rgba(101,130,90,0.8)', borderColor: '#65825A', borderWidth: 2, borderRadius: 4 }
        ]
      },
      options: { responsive:true, plugins:{ legend:{ labels:{ font:{size:11} } } }, scales:{ y:{ beginAtZero:true, ticks:{ font:{size:11} } }, x:{ ticks:{ font:{size:11} } } } }
    });
  }

  // Gráfico asistencia (días con turno por empleado)
  _destroyChart('rep-eq-asist');
  const ctx2 = document.getElementById('rep-eq-chart-asist')?.getContext('2d');
  if(ctx2){
    _chartInstances['rep-eq-asist'] = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: datosEmpleado.map(d=>d.nombre),
        datasets: [{ label: 'Días con turno', data: datosEmpleado.map(d=>d.dias), backgroundColor: 'rgba(180,150,100,0.7)', borderColor: '#B49664', borderWidth: 2, borderRadius: 4 }]
      },
      options: { responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ font:{size:11} } }, x:{ ticks:{ font:{size:11} } } } }
    });
  }

  // Tabla ranking (ordenada por cumplimiento) — clic en la fila abre la ficha 360
  document.getElementById('rep-eq-tabla').innerHTML = `<div style="font-size:11px;color:var(--mid-gray);margin-bottom:8px">🏆 Ranking del mes — tocá una fila para ver la ficha completa de la persona</div>
  <div class="table-wrapper"><table class="stock-table">
    <thead><tr><th>#</th><th>Empleado</th><th>Área</th><th>Asist.</th><th>Puntualidad</th><th>Hs prog</th><th>Hs reg</th><th>Cumplimiento</th><th>Llamados</th><th></th></tr></thead>
    <tbody>${datosEmpleado.map((d,rank)=>{
      const m = d.m;
      const pct = m.cumplimiento;
      const col = pct==null?'var(--mid-gray)':pct>=80?'var(--green-ok)':pct>=50?'#D4A820':'var(--red-alert)';
      const trend = (pct!=null && d.cumplPrev!=null && Math.abs(pct-d.cumplPrev)>=1)
        ? (pct-d.cumplPrev>0?' <span style="color:var(--green-ok);font-size:10px">▲</span>':' <span style="color:var(--red-alert);font-size:10px">▼</span>') : '';
      const asisCol = m.asistencia==null?'var(--mid-gray)':m.asistencia>=90?'var(--green-ok)':m.asistencia>=70?'#D4A820':'var(--red-alert)';
      const nEsc = esc(d.nombre).replace(/'/g,"\\'");
      return `<tr style="cursor:pointer" onclick="openFichaEmpleado('${nEsc}')">
        <td style="color:var(--mid-gray);font-weight:600">${pct!=null?rank+1:'—'}</td>
        <td><strong>${esc(d.nombre)}</strong></td>
        <td>${isJardinero(d.nombre)?'Jardinería':'Florería'}</td>
        <td style="color:${asisCol};font-weight:600">${m.asistencia!=null?m.asistencia+'%':'—'}</td>
        <td>${m.diasTarde?`<span style="color:#D4A820">⏰ ${m.diasTarde} (${m.minTarde}min)</span>`:(m.diasFichados?'<span style="color:var(--green-ok)">✓ en hora</span>':'—')}</td>
        <td>${d.hsProg}h</td>
        <td>${d.hsTrab}h</td>
        <td style="color:${col};font-weight:600">${pct!=null?pct+'%'+trend:'—'}</td>
        <td>${m.llamados?`<span style="color:var(--red-alert);font-weight:600">${m.llamados}</span>`:'—'}</td>
        <td><button class="btn-secondary" style="font-size:11px;padding:3px 10px" onclick="event.stopPropagation();openFichaEmpleado('${nEsc}')">Ficha</button></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;

  renderReporteTiempos(mesISO, filtroEmp);
}

// ── Reporte: tiempos del checklist, real vs referencia ────────────────────────
// Usa el historial del checklist (duración, referencia y flag excedida por
// registro) para mostrar promedio real vs tiempo de referencia por tarea y
// resumen de excedidas por florista.
function renderReporteTiempos(mesISO, filtroEmp){
  const el = document.getElementById('rep-eq-tiempos');
  if(!el) return;
  const regs = (checklistHistory||[]).filter(r =>
    (r?.date||'').startsWith(mesISO) && (parseInt(r?.duracion)||0) > 0 && (!filtroEmp || r.who === filtroEmp)
  );
  const titulo = '<div class="section-title" style="margin-bottom:6px">⏱ Tiempos del checklist — real vs referencia</div>'
    + '<div style="font-size:12px;color:var(--mid-gray);margin-bottom:14px">Tareas completadas con Inicio/Fin registrado en el mes. El desvío compara el promedio real contra el tiempo de referencia.</div>';
  if(!regs.length){
    el.innerHTML = titulo + '<p style="color:var(--mid-gray);font-size:13px">Sin tareas con duración registrada en el mes seleccionado.</p>';
    return;
  }

  // Por tarea (sección + zona + actividad)
  const porTarea = new Map();
  regs.forEach(r=>{
    const k = (r.sec||'')+'|'+(r.zona||'')+'|'+String(r.actividad||'').toLowerCase();
    if(!porTarea.has(k)) porTarea.set(k, {sec:r.sec, zona:r.zona, actividad:r.actividad, total:0, n:0, exc:0, ref:0});
    const o = porTarea.get(k);
    o.total += parseInt(r.duracion)||0; o.n++;
    if(r.excedida) o.exc++;
    const rr = parseInt(r.ref)||0; if(rr) o.ref = rr;
  });
  const tareas = [...porTarea.values()].map(o=>{
    if(!o.ref){
      // Registros viejos sin ref guardada: usar la referencia actual de la zona
      const idx = CL_TASKS.findIndex(t=>t.sec===o.sec && t.zona===o.zona);
      if(idx>=0) o.ref = getTiempoRef(idx);
    }
    o.prom = Math.round(o.total/o.n);
    o.desvio = o.ref ? Math.round((o.prom-o.ref)/o.ref*100) : null;
    return o;
  }).sort((a,b)=>(b.desvio??-999)-(a.desvio??-999));

  // Por florista
  const porFlor = new Map();
  regs.forEach(r=>{
    const k = r.who || '—';
    if(!porFlor.has(k)) porFlor.set(k, {n:0, total:0, exc:0});
    const o = porFlor.get(k); o.n++; o.total += parseInt(r.duracion)||0; if(r.excedida) o.exc++;
  });
  const florRows = [...porFlor.entries()].map(([nombre,o])=>({nombre, ...o, prom:Math.round(o.total/o.n)}))
    .sort((a,b)=>b.exc-a.exc || b.n-a.n);

  el.innerHTML = titulo + `
    <div class="table-wrapper" style="margin-bottom:20px"><table class="stock-table" style="min-width:640px">
      <thead><tr><th>Tarea</th><th>Actividad</th><th>Veces</th><th>Promedio real</th><th>Referencia</th><th>Desvío</th><th>Excedidas</th></tr></thead>
      <tbody>${tareas.map(o=>{
        const col = o.desvio===null ? 'var(--mid-gray)' : o.desvio>0 ? 'var(--red-alert)' : 'var(--green-ok)';
        const desTxt = o.desvio===null ? 'sin ref.' : (o.desvio>0?'+':'')+o.desvio+'%';
        return `<tr>
          <td><strong>${esc(o.zona||'')}</strong></td>
          <td><span class="badge ${getBadge(o.actividad)}">${esc(o.actividad||'')}</span></td>
          <td style="text-align:center">${o.n}</td>
          <td style="font-weight:600">${fmtDur(o.prom)}</td>
          <td>${o.ref?o.ref+'m':'—'}</td>
          <td style="color:${col};font-weight:600">${desTxt}</td>
          <td style="text-align:center">${o.exc?'<span style="color:var(--red-alert);font-weight:600">'+o.exc+' ⚠️</span>':'0'}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div>
    <div class="table-wrapper"><table class="stock-table" style="min-width:480px">
      <thead><tr><th>Florista</th><th>Tareas con tiempo</th><th>Promedio por tarea</th><th>Excedidas</th><th>% excedidas</th></tr></thead>
      <tbody>${florRows.map(o=>{
        const pct = Math.round(o.exc/o.n*100);
        const col = pct>=30?'var(--red-alert)':pct>=15?'#A06A00':'var(--green-ok)';
        return `<tr><td><strong>${esc(o.nombre)}</strong></td><td style="text-align:center">${o.n}</td><td style="font-weight:600">${fmtDur(o.prom)}</td><td style="text-align:center">${o.exc}</td><td style="color:${col};font-weight:600">${pct}%</td></tr>`;
      }).join('')}</tbody>
    </table></div>`;
}

function exportReporteEquipo(){
  const mesISO = document.getElementById('rep-eq-mes')?.value || TODAY_ISO.slice(0,7);
  const rows = [['Empleado','Área','Hs Programadas','Hs Trabajadas','Cumplimiento%']];
  getEmpleadosActivos().forEach(nombre=>{
    const { hsProg, hsTrab } = _horasMesEmpleado(nombre, mesISO);
    const pct=hsProg>0?Math.round(hsTrab/hsProg*100):0;
    rows.push([nombre,isJardinero(nombre)?'Jardinería':'Florería',hsProg.toFixed(1),hsTrab.toFixed(1),hsProg>0?pct:'—']);
  });
  _downloadCSV(rows, `reporte-equipo-${mesISO}.csv`);
}

// ── Reportes Ventas ───────────────────────────────────────────────────────────
function renderReportesVentas(){
  _repMeses('rep-vt-mes');
  const mesISO = document.getElementById('rep-vt-mes')?.value || TODAY_ISO.slice(0,7);

  // Últimos 6 meses para trend
  const now = new Date();
  const mesesLabels=[], mesesTotales=[];
  for(let i=5;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    mesesLabels.push(['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][d.getMonth()]);
    const total=(ventasData||[]).filter(v=>(v.fecha||'').startsWith(iso)).reduce((s,v)=>s+parseMoney(v.precio),0);
    mesesTotales.push(total);
  }

  const ventasMes=(ventasData||[]).filter(v=>(v.fecha||'').startsWith(mesISO));
  const totalMes=ventasMes.reduce((s,v)=>s+parseMoney(v.precio),0);
  const confirmadas=ventasMes.filter(v=>v.estado==='confirmado'||v.estado==='entregado').length;
  const pendientes=ventasMes.filter(v=>v.estado==='pendiente').length;
  const eventosHoy=(eventosData||[]).filter(e=>e.fecha?.startsWith(mesISO)).length;

  document.getElementById('rep-vt-kpis').innerHTML =
    _kpiCard('Total ventas', '$'+totalMes.toLocaleString('es-AR'), mesISO) +
    _kpiCard('Confirmadas', confirmadas, 'ventas confirmadas/entregadas', 'var(--green-ok)') +
    _kpiCard('Pendientes', pendientes, 'ventas pendientes') +
    _kpiCard('Eventos en el mes', eventosHoy, 'eventos/bodas');

  // Trend 6 meses
  _destroyChart('rep-vt-trend');
  const ctx1=document.getElementById('rep-vt-chart-trend')?.getContext('2d');
  if(ctx1){
    _chartInstances['rep-vt-trend']=new Chart(ctx1,{
      type:'line',
      data:{ labels:mesesLabels, datasets:[{ label:'Ventas ($)', data:mesesTotales, fill:true, backgroundColor:'rgba(101,130,90,0.15)', borderColor:'#65825A', borderWidth:2, tension:0.4, pointRadius:4 }] },
      options:{ responsive:true, plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true, ticks:{ font:{size:11}, callback:v=>'$'+v.toLocaleString('es-AR') } }, x:{ticks:{font:{size:11}}} } }
    });
  }

  // Eventos por estado (donut)
  const estadoCount={};
  (eventosData||[]).filter(e=>e.fecha?.startsWith(mesISO)).forEach(e=>{ estadoCount[e.estado||'Sin estado']=(estadoCount[e.estado||'Sin estado']||0)+1; });
  _destroyChart('rep-vt-ev');
  const ctx2=document.getElementById('rep-vt-chart-ev')?.getContext('2d');
  if(ctx2&&Object.keys(estadoCount).length){
    _chartInstances['rep-vt-ev']=new Chart(ctx2,{
      type:'doughnut',
      data:{ labels:Object.keys(estadoCount), datasets:[{ data:Object.values(estadoCount), backgroundColor:['#65825A','#B49664','#A0BFAB','#D4A820','#c0392b','#7f8c8d'] }] },
      options:{ responsive:true, plugins:{ legend:{ position:'bottom', labels:{ font:{size:11} } } } }
    });
  } else if(ctx2){ ctx2.canvas.parentElement.innerHTML += '<div style="text-align:center;color:var(--mid-gray);padding:20px;font-size:12px">Sin eventos este mes</div>'; }

  // Tabla
  const porEmp={};
  ventasMes.forEach(v=>{ const n=v.asignado||'Sin asignar'; if(!porEmp[n])porEmp[n]={total:0,cnt:0}; porEmp[n].total+=parseMoney(v.precio); porEmp[n].cnt++; });
  document.getElementById('rep-vt-tabla').innerHTML=`<div class="table-wrapper"><table class="stock-table">
    <thead><tr><th>Empleado</th><th>Ventas</th><th>Total</th></tr></thead>
    <tbody>${Object.entries(porEmp).sort((a,b)=>b[1].total-a[1].total).map(([n,d])=>`<tr><td>${esc(n)}</td><td>${d.cnt}</td><td>$${d.total.toLocaleString('es-AR')}</td></tr>`).join('')}</tbody>
  </table></div>`;
}

function exportReporteVentas(){
  const mesISO=document.getElementById('rep-vt-mes')?.value||TODAY_ISO.slice(0,7);
  const rows=[['Fecha','Descripción','Precio','Estado','Asignado']];
  (ventasData||[]).filter(v=>(v.fecha||'').startsWith(mesISO)).forEach(v=>rows.push([v.fecha,v.descripcion||'',v.precio||'',v.estado||'',v.asignado||'']));
  _downloadCSV(rows,`reporte-ventas-${mesISO}.csv`);
}

// ── Reportes Stock ────────────────────────────────────────────────────────────
function renderReportesStock(){
  _repMeses('rep-st-mes');
  const mesISO=document.getElementById('rep-st-mes')?.value||TODAY_ISO.slice(0,7);

  const stock=window.stockData||[];
  const criticos=stock.filter(s=>s.minimo>0 && s.cantidad<s.minimo);
  const sinStock=stock.filter(s=>s.cantidad<=0);
  const totalItems=stock.length;

  // Compras del mes
  const comprasMes=[...(window.comprasFlore||[]),...(window.comprasJard||[])].filter(c=>(c.fecha||'').startsWith(mesISO));
  const gastoMes=comprasMes.reduce((s,c)=>s+parseMoney(c.total||c.precio||0),0);

  // Gasto últimos 6 meses
  const now=new Date();
  const mesesLbls=[],mesesGasto=[];
  for(let i=5;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    mesesLbls.push(['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][d.getMonth()]);
    const g=[...(window.comprasFlore||[]),...(window.comprasJard||[])].filter(c=>(c.fecha||'').startsWith(iso)).reduce((s,c)=>s+parseMoney(c.total||c.precio||0),0);
    mesesGasto.push(g);
  }

  document.getElementById('rep-st-kpis').innerHTML=
    _kpiCard('Total ítems stock',totalItems,'productos en inventario')+
    _kpiCard('Stock crítico',criticos.length,'bajo el mínimo','var(--red-alert)')+
    _kpiCard('Sin stock',sinStock.length,'sin unidades disponibles','#D4A820')+
    _kpiCard('Gasto compras','$'+gastoMes.toLocaleString('es-AR'),mesISO);

  _destroyChart('rep-st-gasto');
  const ctx1=document.getElementById('rep-st-chart-gasto')?.getContext('2d');
  if(ctx1){ _chartInstances['rep-st-gasto']=new Chart(ctx1,{ type:'bar', data:{ labels:mesesLbls, datasets:[{ label:'Gasto ($)', data:mesesGasto, backgroundColor:'rgba(180,150,100,0.7)', borderColor:'#B49664', borderWidth:2, borderRadius:4 }] }, options:{ responsive:true, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true,ticks:{font:{size:11},callback:v=>'$'+v.toLocaleString('es-AR')}}, x:{ticks:{font:{size:11}}} } } }); }

  // Stock crítico bar chart
  const topCrit=criticos.slice(0,10);
  _destroyChart('rep-st-critico');
  const ctx2=document.getElementById('rep-st-chart-critico')?.getContext('2d');
  if(ctx2&&topCrit.length){ _chartInstances['rep-st-critico']=new Chart(ctx2,{ type:'bar', indexAxis:'y', data:{ labels:topCrit.map(s=>s.nombre||s.producto||''), datasets:[{ label:'Disponible', data:topCrit.map(s=>s.cantidad||0), backgroundColor:'rgba(192,57,43,0.6)', borderColor:'#c0392b', borderWidth:2, borderRadius:3 }, { label:'Mínimo', data:topCrit.map(s=>s.minimo||0), backgroundColor:'rgba(101,130,90,0.3)', borderColor:'#65825A', borderWidth:2, borderRadius:3 }] }, options:{ responsive:true, plugins:{legend:{labels:{font:{size:11}}}}, scales:{ x:{beginAtZero:true,ticks:{font:{size:11}}}, y:{ticks:{font:{size:10}}} } } }); }
  else if(ctx2){ ctx2.canvas.parentElement.innerHTML+='<div style="text-align:center;color:var(--green-ok);padding:20px;font-size:12px">✅ Sin ítems críticos</div>'; }

  document.getElementById('rep-st-tabla').innerHTML=criticos.length?`<div class="table-wrapper"><table class="stock-table">
    <thead><tr><th>Producto</th><th>Disponible</th><th>Mínimo</th><th>Diferencia</th></tr></thead>
    <tbody>${criticos.map(s=>`<tr><td><strong>${esc(s.nombre||s.producto||'')}</strong></td><td style="color:var(--red-alert)">${s.cantidad}</td><td>${s.minimo}</td><td style="color:var(--red-alert)">−${s.minimo-s.cantidad}</td></tr>`).join('')}</tbody>
  </table></div>`:'';
}

function exportReporteStock(){
  const rows=[['Producto','Categoría','Cantidad','Mínimo','Estado']];
  (window.stockData||[]).forEach(s=>rows.push([s.nombre||s.producto||'',s.categoria||'',s.cantidad||0,s.minimo||0,s.cantidad<=(s.minimo||0)?'CRÍTICO':'OK']));
  _downloadCSV(rows,'reporte-stock.csv');
}


// ── DASHBOARD DE MARGEN ───────────────────────────────────────────────────────
function renderDashboardMargen(){
  const mesISO = document.getElementById('margen-mes')?.value || TODAY_ISO.slice(0,7);
  _repMeses('margen-mes');

  const ventas = (window.ventasData||[]).filter(v => (v.fecha||'').slice(0,7) === mesISO);
  const compras = [
    ...(window.comprasFlore||[]),
    ...(window.comprasJard||[])
  ].filter(c => (c.fecha||'').slice(0,7) === mesISO && !c.anulado);

  const parseMon = parseMoney;

  const totalVentas = ventas.reduce((s,v) => s + parseMon(v.monto||v.total), 0);
  const totalCompras = compras.reduce((s,c) => s + _compraImporte(c), 0);
  const margenBruto = totalVentas - totalCompras;
  const pct = totalVentas > 0 ? ((margenBruto / totalVentas) * 100).toFixed(1) : 0;

  // KPIs
  const kpiEl = document.getElementById('margen-kpis');
  if(kpiEl) kpiEl.innerHTML = [
    _kpiCard('Ventas del mes', '$'+totalVentas.toLocaleString('es-AR'), ventas.length+' transacciones', 'var(--green-ok)'),
    _kpiCard('Compras / Costos', '$'+totalCompras.toLocaleString('es-AR'), compras.length+' registros', 'var(--red-alert)'),
    _kpiCard('Margen Bruto', '$'+margenBruto.toLocaleString('es-AR'), pct+'% del total vendido', margenBruto>=0?'var(--green-ok)':'var(--red-alert)'),
    _kpiCard('% Margen', pct+'%', margenBruto>=0?'Rentable ✓':'Déficit ⚠', margenBruto>=0?'var(--green-ok)':'var(--amber)'),
  ].join('');

  // Desglose ventas por tipo
  const porTipo = {};
  ventas.forEach(v => {
    const t = v.tipo||v.categoria||'Otros';
    if(!porTipo[t]) porTipo[t] = 0;
    porTipo[t] += parseMon(v.monto||v.total);
  });

  // Desglose compras por sector
  const porSector = {};
  compras.forEach(c => {
    const s = c.sector||c.tipo||'General';
    if(!porSector[s]) porSector[s] = 0;
    porSector[s] += _compraImporte(c);
  });

  const tablaEl = document.getElementById('margen-tabla');
  if(tablaEl) tablaEl.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:8px">
      <div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:12px;padding:16px">
        <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:12px;font-weight:500">Ventas por tipo</div>
        ${Object.keys(porTipo).length ? Object.entries(porTipo).sort((a,b)=>b[1]-a[1]).map(([t,v])=>`
          <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--light-gray);font-size:13px">
            <span>${esc(t)}</span><span style="font-weight:600;color:var(--green-ok)">$${v.toLocaleString('es-AR')}</span>
          </div>`).join('') : '<div style="color:var(--mid-gray);font-size:13px">Sin ventas registradas</div>'}
      </div>
      <div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:12px;padding:16px">
        <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:12px;font-weight:500">Compras por sector</div>
        ${Object.keys(porSector).length ? Object.entries(porSector).sort((a,b)=>b[1]-a[1]).map(([s,v])=>`
          <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--light-gray);font-size:13px">
            <span>${esc(s)}</span><span style="font-weight:600;color:var(--red-alert)">$${v.toLocaleString('es-AR')}</span>
          </div>`).join('') : '<div style="color:var(--mid-gray);font-size:13px">Sin compras registradas</div>'}
      </div>
    </div>
    <div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:12px;padding:16px;margin-top:16px">
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:12px;font-weight:500">Barra de margen</div>
      <div style="background:var(--light-gray);border-radius:8px;height:24px;overflow:hidden;position:relative">
        <div style="background:var(--green-ok);height:100%;width:${Math.min(100,Math.max(0,+pct))}%;transition:width .5s ease;border-radius:8px;display:flex;align-items:center;justify-content:flex-end;padding-right:8px">
          <span style="font-size:11px;font-weight:700;color:white">${pct}%</span>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--mid-gray);margin-top:6px">
        <span>0%</span><span style="color:var(--amber)">Punto de equilibrio</span><span>100%</span>
      </div>
    </div>`;
}

// ── Push Notifications UI ─────────────────────────────────────────────────────
function openPushNotifModal(){
  let ov=document.getElementById('push-modal');
  if(!ov){
    ov=document.createElement('div'); ov.id='push-modal'; ov.className='modal-overlay';
    ov.innerHTML=`<div class="modal" style="max-width:400px">
      <button class="modal-close" onclick="closeModal('push-modal')">✕</button>
      <div class="modal-title">🔔 Enviar Notificación</div>
      <div class="form-group"><label class="form-label">Título</label><input class="form-input-modal" id="pn-titulo" placeholder="ej. Recordatorio de reunión"></div>
      <div class="form-group"><label class="form-label">Mensaje</label><textarea class="form-input-modal" id="pn-body" rows="3" placeholder="ej. Reunión de equipo a las 10:00"></textarea></div>
      <div class="modal-actions">
        <button class="btn-secondary" onclick="closeModal('push-modal')">Cancelar</button>
        <button class="btn-add" onclick="enviarPushNotif()">📤 Enviar a todos</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
  }
  ov.classList.add('open');
}

async function enviarPushNotif(){
  const title=document.getElementById('pn-titulo')?.value?.trim();
  const body=document.getElementById('pn-body')?.value?.trim();
  if(!title||!body){ showToast('Completá título y mensaje'); return; }
  await window.pushSend?.(title,body);
  closeModal('push-modal');
  showToast('✅ Notificación enviada al equipo');
}

async function initPushForUser(){
  if(!('Notification' in window)) return;
  if(Notification.permission==='default'){
    const granted=await window.pushRequestPermission?.();
    if(granted) showToast('🔔 Notificaciones activadas — los avisos llegan aunque cierres la app');
  } else if(Notification.permission==='granted'){
    // Refrescar la suscripción con la identidad/roles del usuario logueado
    await window.pushRequestPermission?.();
  }
}

// Activación manual desde el menú (por si se denegó o no saltó el pedido)
async function activarNotificaciones(){
  if(!('Notification' in window) || !('PushManager' in window)){
    showToast('⚠️ Este navegador no soporta notificaciones push'); return;
  }
  if(Notification.permission==='denied'){
    showToast('⚠️ Las notificaciones están bloqueadas — habilitalas en la configuración del navegador para este sitio'); return;
  }
  const ok = await window.pushRequestPermission?.();
  showToast(ok ? '🔔 Notificaciones activadas en este dispositivo' : '⚠️ No se pudieron activar las notificaciones');
}

// ── PEDIDOS DE HABITACIÓN ──────────────────────────────────────────────────────
let pedidosHabData = [];

function renderHomeHyatt(){
  // KPIs del panel
  const statsEl = document.getElementById('hyatt-home-stats');
  if(statsEl){
    const data = pedidosHabData || [];
    const pend = data.filter(p=>p.estado==='pendiente').length;
    const prep = data.filter(p=>p.estado==='preparando').length;
    const listos = data.filter(p=>p.estado==='listo').length;
    const mes = data.filter(p=>(p.fecha||'').startsWith(CURR_MONTH)).length;
    statsEl.innerHTML = `
      <div class="kpi-card"><div class="kpi-val">${pend}</div><div class="kpi-lbl">Pedidos pendientes</div></div>
      <div class="kpi-card"><div class="kpi-val">${prep}</div><div class="kpi-lbl">En preparación</div></div>
      <div class="kpi-card"><div class="kpi-val">${listos}</div><div class="kpi-lbl">Listos para entregar</div></div>
      <div class="kpi-card"><div class="kpi-val">${mes}</div><div class="kpi-lbl">Pedidos del mes</div></div>`;
  }

  const el = document.getElementById('hyatt-home-pedidos');
  if(!el) return;
  const ultimos = pedidosHabData.slice(0,5);
  if(!ultimos.length){
    el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--mid-gray)">No hay pedidos todavía. Cargá el primero desde "Pedidos de Habitación".</div>';
    return;
  }
  const estadoIcons = {pendiente:'⏳',preparando:'🔄',listo:'✅',entregado:'📦'};
  el.innerHTML = ultimos.map(p =>
    `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:8px;padding:10px 14px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center">
      <div><strong>${arregloEmoji(p.tipo)} ${esc(p.tipo)}</strong>${p.variante?' · '+esc(p.variante):''} × ${p.qty} — Hab. ${esc(p.habitacion)} · ${esc(p.cliente)}</div>
      <span style="font-size:13px">${estadoIcons[p.estado]||'⏳'} ${p.estado}</span>
    </div>`
  ).join('');
}

function populatePHSubSelector(){
  const tipo = document.getElementById('ph-tipo')?.value;
  const subWrap = document.getElementById('ph-variante-wrap');
  const subSel = document.getElementById('ph-variante');
  const customInput = document.getElementById('ph-tipo-custom');
  if(!subWrap || !subSel) return;

  if(!tipo){ subWrap.style.display = 'none'; return; }

  if(tipo === 'Otro'){
    subWrap.style.display = '';
    subSel.style.display = 'none';
    customInput.style.display = '';
    return;
  }

  subWrap.style.display = '';
  subSel.style.display = '';
  customInput.style.display = 'none';

  let opts = '<option value="">— Seleccionar modelo —</option>';

  // Composiciones
  if(recetasData.length){
    opts += '<optgroup label="🫙 Composiciones">';
    recetasData.forEach(r => {
      const ings = r.ings.map(g=>g.qty+' '+g.prod).join(', ');
      const costo = calcCostoComposicion(r);
      const margen = cotizadorConfig?.margen ?? 30;
      const precio = Math.round(costo*(1+margen/100));
      opts += `<option value="comp:${esc(r.nombre)}">${arregloEmoji(r.nombre)} ${esc(r.nombre)} — $${precio.toLocaleString('es-AR')} (${ings})</option>`;
    });
    opts += '</optgroup>';
  }

  // Items de Lista de Precios
  listaPreciosData.forEach(cat => {
    if(!(cat.items||[]).length) return;
    opts += `<optgroup label="${cat.emoji||'📦'} ${esc(cat.cat)}">`;
    cat.items.forEach(it => {
      opts += `<option value="lp:${esc(it.nombre)}">${esc(it.nombre)} — ${esc(it.precio||'A consultar')}</option>`;
    });
    opts += '</optgroup>';
  });

  subSel.innerHTML = opts;
}

// Resuelve el precio del modelo elegido en el pedido de habitación.
// La variante viene como "comp:Nombre" (composición, precio = costo + margen)
// o "lp:Nombre" (ítem de la lista de precios). Devuelve el precio unitario.
function _precioVariantePH(val){
  if(!val) return '';
  if(val.startsWith('comp:')){
    const r = recetasData.find(x => x.nombre === val.slice(5));
    if(r){
      const costo = calcCostoComposicion(r);
      const margen = cotizadorConfig?.margen ?? 30;
      return '$' + Math.round(costo*(1+margen/100)).toLocaleString('es-AR');
    }
  } else if(val.startsWith('ramo:')){
    const nombre = val.slice(5);
    const r = (ramosDispData||[]).find(x => x.nombre === nombre);
    if(r) return r.precio || '';
  } else if(val.startsWith('lp:')){
    const nombre = val.slice(3);
    for(const cat of listaPreciosData){
      const it = (cat.items||[]).find(x => x.nombre === nombre);
      if(it) return it.precio || '';
    }
  }
  return '';
}

function enviarPedidoHab(){
  const tipo = document.getElementById('ph-tipo')?.value;
  if(!tipo){ showToast('⚠️ Seleccioná el arreglo o ramo'); return; }
  const cliente = document.getElementById('ph-cliente')?.value?.trim();
  if(!cliente){ showToast('⚠️ Ingresá el nombre del huésped'); return; }

  // El valor viene como "comp:Nombre" (composición) o "ramo:Nombre" (ramo)
  const tipoFinal = tipo.replace(/^(comp|ramo):/,'');
  const varianteLabel = '';
  const qty = +document.getElementById('ph-qty')?.value || 1;

  // Precio unitario del modelo elegido y total según cantidad
  const precioUnit = _precioVariantePH(tipo);
  const precioNum = parseMoney(precioUnit);
  const precioTotal = precioNum > 0 ? '$' + (precioNum * qty).toLocaleString('es-AR') : precioUnit;

  const pedido = {
    tipo: tipoFinal,
    variante: varianteLabel,
    qty,
    cliente,
    habitacion: document.getElementById('ph-habitacion')?.value?.trim() || '—',
    tonalidad: document.getElementById('ph-tonalidad')?.value?.trim() || '',
    cuando: document.getElementById('ph-cuando')?.value || '',
    cobro: document.getElementById('ph-cobro')?.value || '',
    solicitante: document.getElementById('ph-solicitante')?.value?.trim() || '',
    obs: document.getElementById('ph-obs')?.value?.trim() || '',
    precio: precioTotal,
    fecha: TODAY_ISO,
    hora: new Date().toTimeString().slice(0,5),
    estado: 'pendiente'
  };

  pedidosHabData.unshift(pedido);
  fbSave('pedidosHabData', pedidosHabData);

  // ── AUTO: Crear tarea en Kanban para que florería lo prepare ──
  ensureKanbanCols();
  const cardTitle = `${arregloEmoji(tipoFinal)} ${tipoFinal}${varianteLabel?' · '+varianteLabel:''} × ${pedido.qty}`;
  const cardDesc = `Hab. ${pedido.habitacion} · ${cliente}${pedido.tonalidad?' · '+pedido.tonalidad:''}${pedido.cuando?' · Para: '+pedido.cuando.replace('T',' '):''}${pedido.obs?' · '+pedido.obs:''}`;
  kanbanData[0].cards.push({
    title: cardTitle,
    desc: cardDesc,
    tags: ['tag-floreria'],
    date: pedido.cuando ? pedido.cuando.split('T')[0] : TODAY_ISO,
    pedidoHabIdx: pedidosHabData.length - 1
  });
  fbSave('kanbanData', kanbanData);

  // ── AUTO: Registrar en Ventas Externas (con el precio del modelo elegido) ──
  ventasData.push({
    prod: cardTitle,
    desc: cardDesc,
    cliente: cliente,
    fecha: TODAY_ISO,
    dedicatoria: pedido.obs || '',
    precio: precioTotal,
    formaPago: pedido.cobro || '',
    estado: 'pendiente',
    dir: 'Hab. ' + pedido.habitacion,
    fromPedidoHab: true
  });
  fbSave('ventasData', ventasData);

  // Limpiar formulario
  ['ph-tipo','ph-cliente','ph-habitacion','ph-tonalidad','ph-cuando','ph-cobro','ph-obs','ph-variante'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.value = '';
  });
  document.getElementById('ph-qty').value = 1;
  document.getElementById('ph-variante-wrap').style.display = 'none';
  document.getElementById('ph-tipo-custom').style.display = 'none';

  renderPedidosHab();
  showToast('📨 Pedido enviado · tarea creada en Kanban · registrado en Ventas');
}

// Llena el selector "Tipo de arreglo" del pedido de habitación SOLO con las
// composiciones ya cargadas (con receta) y los ramos disponibles. Nada más.
function populatePHTipos(){
  const sel = document.getElementById('ph-tipo');
  if(!sel) return;
  const cur = sel.value;
  let opts = '<option value="">— Seleccionar —</option>';
  if(recetasData.length){
    opts += '<optgroup label="🌸 Composiciones">';
    recetasData.forEach(r => {
      opts += `<option value="comp:${esc(r.nombre)}">${arregloEmoji(r.nombre)} ${esc(r.nombre)}</option>`;
    });
    opts += '</optgroup>';
  }
  const ramos = [...new Set((ramosDispData||[]).map(r=>r.nombre).filter(Boolean))];
  if(ramos.length){
    opts += '<optgroup label="💐 Ramos">';
    ramos.forEach(n => { opts += `<option value="ramo:${esc(n)}">💐 ${esc(n)}</option>`; });
    opts += '</optgroup>';
  }
  if(!recetasData.length && !ramos.length){
    opts += '<option value="" disabled>Cargá composiciones o ramos primero</option>';
  }
  sel.innerHTML = opts;
  if(cur) sel.value = cur;
}

function renderPedidosHab(){
  populatePHTipos();
  const list = document.getElementById('ph-lista');
  if(!list) return;
  if(!pedidosHabData.length){
    list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--mid-gray)">No hay pedidos todavía.</div>';
    return;
  }
  const estadoIcons = {pendiente:'⏳',preparando:'🔄',listo:'✅',entregado:'📦'};
  const estadoLabels = {pendiente:'Pendiente',preparando:'En preparación',listo:'Listo',entregado:'Entregado'};
  const estadoColors = {pendiente:'#FDF8E8',preparando:'#EBF0E8',listo:'#E8F0F8',entregado:'#F4F1EC'};

  list.innerHTML = pedidosHabData.map((p,i) => {
    const icon = estadoIcons[p.estado]||'⏳';
    const label = estadoLabels[p.estado]||'Pendiente';
    const bg = estadoColors[p.estado]||'#FDF8E8';
    const isGerOrOps = userRole === 'gerencia' || userRole === 'operario';
    return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;padding:14px 16px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
        <div>
          <span style="font-size:15px;font-weight:600;color:#1A1A1A">${arregloEmoji(p.tipo)} ${esc(p.tipo)}${p.variante?' · <span style="font-weight:400">'+esc(p.variante)+'</span>':''} × ${p.qty}</span>
          <span style="background:${bg};padding:3px 10px;border-radius:10px;font-size:11px;font-weight:600;margin-left:8px">${icon} ${label}</span>
        </div>
        <div style="font-size:11px;color:var(--mid-gray)">${p.fecha ? fmtDate(p.fecha) : ''} ${p.hora||''}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:6px 16px;margin-top:10px;font-size:13px">
        <div><span style="color:var(--mid-gray)">Huésped:</span> <strong>${esc(p.cliente)}</strong></div>
        <div><span style="color:var(--mid-gray)">Hab:</span> <strong>${esc(p.habitacion)}</strong></div>
        ${p.tonalidad?`<div><span style="color:var(--mid-gray)">Tonalidad:</span> ${esc(p.tonalidad)}</div>`:''}
        ${p.cuando?`<div><span style="color:var(--mid-gray)">Para:</span> ${esc(p.cuando.replace('T',' '))}</div>`:''}
        ${p.cobro?`<div><span style="color:var(--mid-gray)">Cobro:</span> ${esc(p.cobro)}</div>`:''}
        ${p.solicitante?`<div><span style="color:var(--mid-gray)">Solicitó:</span> ${esc(p.solicitante)}</div>`:''}
      </div>
      ${p.obs?`<div style="margin-top:8px;font-size:12px;color:var(--mid-gray);font-style:italic">"${esc(p.obs)}"</div>`:''}
      ${isGerOrOps ? `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
        <select class="form-input" style="width:170px;padding:5px 8px;font-size:12px" onchange="updPedidoHabEstado(${i},this.value)">
          <option value="pendiente" ${p.estado==='pendiente'?'selected':''}>⏳ Pendiente</option>
          <option value="preparando" ${p.estado==='preparando'?'selected':''}>🔄 En preparación</option>
          <option value="listo" ${p.estado==='listo'?'selected':''}>✅ Listo</option>
          <option value="entregado" ${p.estado==='entregado'?'selected':''}>📦 Entregado</option>
        </select>
        <button class="btn-icon" style="color:var(--red-alert);font-size:12px" onclick="delPedidoHab(${i})">✕ Eliminar</button>
      </div>` : ''}
    </div>`;
  }).join('');
}

function updPedidoHabEstado(i, val){
  pedidosHabData[i].estado = val;
  fbSave('pedidosHabData', pedidosHabData);
  renderPedidosHab();
}

async function delPedidoHab(i){
  if(!await confirmModal('¿Eliminar este pedido?')) return;
  pedidosHabData.splice(i,1);
  fbSave('pedidosHabData', pedidosHabData);
  renderPedidosHab();
  showToast('🗑️ Pedido eliminado');
}

// ── renderListaPrecios ────────────────────────────────────────────────────────
function renderListaPrecios(){
  const search = (document.getElementById('lp-search')?.value||'').toLowerCase();
  const grid = document.getElementById('lp-grid');
  if(!grid) return;
  const editable = userRole === 'gerencia';

  // Populate category select in modal (solo gerencia)
  if(editable){
    const catSel = document.getElementById('lp-cat-sel');
    if(catSel){
      catSel.innerHTML = listaPreciosData.map((c,i)=>
        `<option value="${i}">${c.emoji} ${esc(c.cat)}</option>`
      ).join('') + `<option value="new">+ Nueva categoría...</option>`;
    }
  }

  grid.innerHTML = listaPreciosData.map((cat, ci) => {
    const visible = cat.items.filter(it =>
      !search || it.nombre.toLowerCase().includes(search) || it.desc.toLowerCase().includes(search) || cat.cat.toLowerCase().includes(search)
    );
    if(search && visible.length===0) return '';

    const itemsHtml = (search ? visible : cat.items).map((it) => {
      const realIdx = cat.items.indexOf(it);
      const photos = it.photos||[];

      const mainPhoto = photos.length
        ? `<img class="lp-card-photo" src="${photos[0]}" onclick="lpOpenViewer(${ci},${realIdx},0)" style="cursor:pointer">`
        : (editable
          ? `<label class="lp-card-photo-placeholder">
              <span style="font-size:28px">📷</span><span>Agregar foto</span>
              <input type="file" accept="image/*" multiple style="display:none" onchange="lpAddPhotos(${ci},${realIdx},this)">
             </label>`
          : `<div class="lp-card-photo-placeholder"><span style="font-size:28px">📷</span></div>`);

      const photoStrip = photos.length > 1
        ? `<div class="lp-photo-strip">
            ${photos.map((p,pi)=>`
              <div class="lp-photo-thumb">
                <img src="${p}" onclick="lpOpenViewer(${ci},${realIdx},${pi})">
                ${editable ? `<button class="lp-photo-del" onclick="lpRemovePhoto(${ci},${realIdx},${pi})">✕</button>` : ''}
              </div>`).join('')}
            ${editable ? `<label class="lp-add-photo"><span style="font-size:20px">📷</span>+<input type="file" accept="image/*" multiple style="display:none" onchange="lpAddPhotos(${ci},${realIdx},this)"></label>` : ''}
          </div>` : '';

      if(editable){
        return `<div class="lp-card">
          ${mainPhoto}
          ${photos.length===1?`<div class="lp-photo-strip">
            <div class="lp-photo-thumb"><img src="${photos[0]}" onclick="lpOpenViewer(${ci},${realIdx},0)"><button class="lp-photo-del" onclick="lpRemovePhoto(${ci},${realIdx},0)">✕</button></div>
            <label class="lp-add-photo"><span style="font-size:20px">📷</span>+<input type="file" accept="image/*" multiple style="display:none" onchange="lpAddPhotos(${ci},${realIdx},this)"></label>
          </div>`:photoStrip}
          <div class="lp-card-body">
            <input class="lp-card-name" value="${esc(it.nombre)}" onchange="lpUpdItem(${ci},${realIdx},'nombre',this.value)">
            <textarea class="lp-card-desc" onchange="lpUpdItem(${ci},${realIdx},'desc',this.value)">${esc(it.desc)}</textarea>
            <div class="lp-card-footer">
              <input class="lp-price-input" value="${esc(it.precio)}" onchange="lpUpdItem(${ci},${realIdx},'precio',this.value)" placeholder="$0">
              <div class="lp-card-actions">
                <button class="btn-icon" style="color:var(--red-alert)" onclick="lpDelItem(${ci},${realIdx})" title="Eliminar">✕</button>
              </div>
            </div>
          </div>
        </div>`;
      } else {
        // SOLO LECTURA para operarios
        return `<div class="lp-card">
          ${mainPhoto}
          ${photos.length===1?`<div class="lp-photo-strip"><div class="lp-photo-thumb"><img src="${photos[0]}" onclick="lpOpenViewer(${ci},${realIdx},0)"></div></div>`:photoStrip}
          <div class="lp-card-body">
            <div class="lp-card-name" style="font-weight:600;cursor:default">${esc(it.nombre)}</div>
            <div class="lp-card-desc" style="min-height:auto;color:#7A7A72;font-size:12.5px;margin:4px 0 8px">${esc(it.desc)}</div>
            <div class="lp-card-footer">
              <div class="lp-price-input" style="font-weight:700;color:#1A1A1A;cursor:default">${esc(it.precio)}</div>
            </div>
          </div>
        </div>`;
      }
    }).join('');

    return `<div class="lp-section">
      <div class="lp-section-header">
        <div class="lp-section-title">${cat.emoji} ${esc(cat.cat)}</div>
        <div class="lp-section-actions">
          <span style="font-size:11px;opacity:.6;margin-right:8px">${cat.items.length} ítem${cat.items.length!==1?'s':''}</span>
          ${editable ? `<button class="btn-icon" style="color:#F7F5F2;font-size:18px" onclick="openLpModal(${ci},-1)" title="Agregar ítem">+</button>
          <button class="btn-icon" style="color:rgba(247,245,242,.5);font-size:13px" onclick="lpDelCat(${ci})" title="Eliminar categoría">✕</button>` : ''}
        </div>
      </div>
      <div class="lp-items-grid">${itemsHtml}</div>
    </div>`;
  }).join('');

  // Botón nueva categoría solo para gerencia
  if(editable){
    grid.innerHTML += `<div style="margin-top:8px">
      <button class="btn-secondary" onclick="openLpCatModal()" style="font-size:13px;padding:10px 20px">+ Nueva categoría</button>
    </div>`;
  }
}

function lpUpdItem(ci,ii,field,val){ listaPreciosData[ci].items[ii][field]=val; fbSave('listaPreciosData',listaPreciosData); }

async function lpDelItem(ci,ii){
  if(!await confirmModal('¿Eliminar este ítem?')) return;
  listaPreciosData[ci].items.splice(ii,1);
  fbSave('listaPreciosData',listaPreciosData);
  renderListaPrecios();
}

async function lpDelCat(ci){
  if(!await confirmModal('¿Eliminar la categoría "'+listaPreciosData[ci].cat+'" y todos sus ítems?')) return;
  listaPreciosData.splice(ci,1);
  fbSave('listaPreciosData',listaPreciosData);
  renderListaPrecios();
}

function openLpModal(ci,ii){
  document.getElementById('lp-cat-idx').value = ci;
  document.getElementById('lp-item-idx').value = ii;
  const isNew = ii===-1;
  document.getElementById('lp-modal-title').textContent = isNew ? 'Nuevo ítem' : 'Editar ítem';
  if(!isNew && ci>=0){
    const it = listaPreciosData[ci].items[ii];
    document.getElementById('lp-nombre').value = it.nombre;
    document.getElementById('lp-desc').value = it.desc||'';
    document.getElementById('lp-precio').value = it.precio;
    document.getElementById('lp-cat-sel').value = ci;
  } else {
    document.getElementById('lp-nombre').value='';
    document.getElementById('lp-desc').value='';
    document.getElementById('lp-precio').value='';
    if(ci>=0) document.getElementById('lp-cat-sel').value=ci;
  }
  document.getElementById('lp-modal').classList.add('open');
}

function saveLpItem(){
  const nombre = document.getElementById('lp-nombre').value.trim();
  if(!nombre) return;
  const catSel = document.getElementById('lp-cat-sel');
  if(catSel.value==='new'){ openLpCatModal(); return; }
  const ci = +catSel.value;
  const ii = +document.getElementById('lp-item-idx').value;
  const item = {
    nombre,
    desc: document.getElementById('lp-desc').value||'',
    precio: document.getElementById('lp-precio').value||'A consultar',
    photos: (ii>=0 && listaPreciosData[ci]?.items[ii]?.photos) || []
  };
  if(ii===-1) listaPreciosData[ci].items.push(item);
  else listaPreciosData[ci].items[ii]=item;
  fbSave('listaPreciosData',listaPreciosData);
  closeModal('lp-modal');
  renderListaPrecios();
}

function openLpCatModal(){ document.getElementById('lp-cat-modal').classList.add('open'); }

function addLpCat(){
  const nombre = document.getElementById('lp-cat-nombre').value.trim();
  if(!nombre) return;
  listaPreciosData.push({ cat: nombre, emoji: '🌿', items: [] });
  fbSave('listaPreciosData',listaPreciosData);
  closeModal('lp-cat-modal');
  document.getElementById('lp-cat-nombre').value='';
  renderListaPrecios();
}

function lpAddPhotos(ci,ii,input){
  const files = Array.from(input.files);
  if(!files.length) return;
  if(!listaPreciosData[ci].items[ii].photos) listaPreciosData[ci].items[ii].photos=[];
  let loaded=0;
  files.forEach(file=>{
    const reader=new FileReader();
    reader.onload=e=>{
      listaPreciosData[ci].items[ii].photos.push(e.target.result);
      loaded++;
      if(loaded===files.length){ fbSave('listaPreciosData',listaPreciosData); renderListaPrecios(); }
    };
    reader.readAsDataURL(file);
  });
}

function lpRemovePhoto(ci,ii,pi){
  listaPreciosData[ci].items[ii].photos.splice(pi,1);
  fbSave('listaPreciosData',listaPreciosData);
  renderListaPrecios();
}

function lpOpenViewer(ci,ii,pi){
  const photos = listaPreciosData[ci].items[ii].photos;
  const nombre = listaPreciosData[ci].items[ii].nombre;
  let cur = pi;
  let overlay = document.getElementById('lp-viewer-overlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id='lp-viewer-overlay';
    overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:2000;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px';
    overlay.onclick=e=>{ if(e.target===overlay) overlay.remove(); };
    document.body.appendChild(overlay);
  }
  function draw(){
    overlay.innerHTML=`
      <button onclick="document.getElementById('lp-viewer-overlay').remove()" style="position:absolute;top:20px;right:28px;background:none;border:none;color:white;font-size:30px;cursor:pointer;line-height:1">✕</button>
      <div style="font-family:'Cormorant Garamond',serif;font-size:20px;color:rgba(255,255,255,.75)">${esc(nombre)} · ${cur+1}/${photos.length}</div>
      <img src="${photos[cur]}" style="max-width:90vw;max-height:76vh;border-radius:8px;object-fit:contain;box-shadow:0 8px 48px rgba(0,0,0,.6)">
      <div style="display:flex;gap:14px">
        ${cur>0?`<button onclick="event.stopPropagation();cur--;draw()" style="background:rgba(255,255,255,.15);border:none;color:white;padding:9px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-family:'DM Sans',sans-serif">← Anterior</button>`:''}
        ${cur<photos.length-1?`<button onclick="event.stopPropagation();cur++;draw()" style="background:rgba(255,255,255,.15);border:none;color:white;padding:9px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-family:'DM Sans',sans-serif">Siguiente →</button>`:''}
      </div>`;
  }
  draw();
}



// ════════════════════════════════════════
// MOBILE SIDEBAR


// ════════════════════════════
// MOBILE SIDEBAR
// ════════════════════════════
function toggleSidebar(){
  const sidebar  = document.getElementById('sidebar');
  const isOpen   = sidebar.classList.contains('open');
  if(isOpen){ closeSidebar(); } else { openSidebar(); }
}
function openSidebar(){
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('visible');
  document.getElementById('hamburger-btn').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
  document.getElementById('hamburger-btn').classList.remove('open');
  document.body.style.overflow = '';
}

// Close sidebar on nav item click (mobile).
// Los encabezados de grupo (acordeón) NO cierran el sidebar: solo despliegan
// su submenú, así el usuario puede ver las áreas y elegir una sin que se
// cierre el listado. Solo los ítems que navegan a una página lo cierran.
document.querySelectorAll('.nav-item, .nav-sub-item').forEach(el => {
  el.addEventListener('click', () => {
    if(el.classList.contains('nav-group-hdr')) return;
    if(window.innerWidth <= 768) closeSidebar();
  });
});


// ── BACKUP DE DATOS ───────────────────────────────────────────────────────────
// Exporta todos los datos principales a un JSON descargable (solo gerencia).
// Cada fuente está envuelta en función para tolerar variables que cambien de
// nombre entre versiones sin romper el backup completo.
function descargarBackup(){
  const fuentes = {
    checklist: ()=>clStateByDay, checklistHistory: ()=>checklistHistory, clTiemposRef: ()=>clTiemposRef, ultimoNuevoZona: ()=>ultimoNuevoZona,
    checklistTareas: ()=>CL_TASKS.map(t=>({sec:t.sec,zona:t.zona,actividad:t.actividad,obs:t.obs||''})),
    eventosData: ()=>eventosData, kanbanData: ()=>kanbanData, eventosSinFloreria: ()=>eventosSinFloreria,
    stockData: ()=>stockData, recetasData: ()=>recetasData,
    comprasFlore: ()=>comprasFlore, comprasJard: ()=>comprasJard, proveedoresList: ()=>proveedoresList,
    ventasData: ()=>ventasData, cajaData: ()=>cajaData, cierresCajaData: ()=>cierresCajaData,
    cierresMensualesData: ()=>cierresMensualesData, presupuestosData: ()=>presupuestosData,
    clientesData: ()=>clientesData, listaPreciosData: ()=>listaPreciosData,
    ramosDispData: ()=>ramosDispData, florerosData: ()=>florerosData, velasData: ()=>velasData, pedidosHabData: ()=>pedidosHabData, galeriaData: ()=>galeriaData,
    cotizadorPrecios: ()=>cotizadorPrecios, eventoPricing: ()=>eventoPricing,
    jardineriaData: ()=>jardineriaData, jardineriaLog: ()=>jardineriaLog, jardRecordatorios: ()=>jardRecordatorios,
    habitacionesData: ()=>habitacionesData, habitacionesLog: ()=>habitacionesLog, zonaHorasData: ()=>zonaHorasData,
    horariosData: ()=>window.horariosData, horariosPlantilla: ()=>horariosPlantilla, horariosPersonas: ()=>window.horariosPersonas,
    florTurnos: ()=>window.florTurnos, jardHorarios: ()=>window.jardHorarios,
    legajoData: ()=>legajoData, evaluacionesData: ()=>evaluacionesData, llamadosData: ()=>llamadosData, liquidacionConfig: ()=>liquidacionConfig,
    sucursalesConfig: ()=>sucursalesConfig, loginPasswords: ()=>loginPasswords, auditLogData: ()=>auditLogData,
    resumenesDiarios: ()=>resumenesDiarios,
  };
  const data = { _meta: { app:'Florería Duhau', fecha:new Date().toISOString(), generadoPor: window.currentUserLabel||userRole||'' } };
  Object.entries(fuentes).forEach(([k,fn])=>{ try{ const v=fn(); if(v!==undefined) data[k]=v; }catch(e){} });
  const blob = new Blob([JSON.stringify(data)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `backup-floreria-duhau-${TODAY_ISO}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  try{ localStorage.setItem('ultimoBackupISO', TODAY_ISO); }catch(e){}
  showToast('💾 Backup descargado — guardalo en un lugar seguro');
}

// Recordatorio mensual: avisar a gerencia si hace más de 30 días del último backup
function recordarBackup(){
  try{
    const ult = localStorage.getItem('ultimoBackupISO');
    const dias = ult ? Math.floor((new Date(TODAY_ISO)-new Date(ult))/86400000) : null;
    if(dias===null || dias>30){
      showToast(dias===null
        ? '💾 Nunca se descargó un backup desde este dispositivo — botón "Backup de datos" en el menú'
        : `💾 Hace ${dias} días que no se descarga un backup — botón "Backup de datos" en el menú`, 'warn');
    }
  }catch(e){}
}

// ── LOGIN ────────────────────────────────────────────────────────────────────
// ── Expose globals for Firebase module ───────────────────────────────────────
(function exposeGlobals(){
  const vars = {
    get clStateByDay()       { return clStateByDay; },       set clStateByDay(v)      { clStateByDay=v; },
    get checklistHistory()   { return checklistHistory; },   set checklistHistory(v)  { checklistHistory=v; },
    get eventosData()        { return eventosData; },        set eventosData(v)       { eventosData=v; },
    get stockData()          { return stockData; },          set stockData(v)         { stockData=v; },
    get jardineriaData()     { return jardineriaData; },     set jardineriaData(v)    { jardineriaData=v; },
    get habitacionesData()   { return habitacionesData; },   set habitacionesData(v)  { habitacionesData=v; },
    get proveedoresList()    { return proveedoresList; },    set proveedoresList(v)   { proveedoresList=v; },
    get kanbanData()         { return kanbanData; },         set kanbanData(v)        { kanbanData=v; },
    get comprasFlore()       { return comprasFlore; },       set comprasFlore(v)      { comprasFlore=v; },
    get comprasJard()        { return comprasJard; },        set comprasJard(v)       { comprasJard=v; },
    get recetasData()        { return recetasData; },        set recetasData(v)       { recetasData=v; },
    get cotCurTab()          { return cotCurTab; },          set cotCurTab(v)         { cotCurTab=v; },
  };
  // Funciones de render expuestas como referencias directas (sin eval).
  // 'renderChecklist' no existe (la real es renderChecklistTable); se omite.
  const renderFns = {
    renderEventos, renderKanban, renderStock,
    renderJardOps, renderHabOps, renderCtrlJard, renderCtrlHab,
    renderCompras, renderRecetas, renderRamosDisp,
  };
  // Assign data vars via defineProperty (getters/setters need it)
  Object.keys(vars).forEach(k => {
    try {
      Object.defineProperty(window, k, {
        get: Object.getOwnPropertyDescriptor(vars, k).get,
        set: Object.getOwnPropertyDescriptor(vars, k).set,
        configurable: true
      });
    } catch(e) { /* already defined, skip */ }
  });
  Object.keys(renderFns).forEach(fn => {
    if(!(fn in window)) window[fn] = renderFns[fn];
  });
})();


// ── Roles de acceso ─────────────────────────────────────────────────────────
// 'operario' → solo ve Operaciones
// 'gerencia' → ve todo
let userRole = null;
let floristaNombre = null;
let jardineroNombre = null;
let currentSucursal = 'duhau'; // id de la sucursal del usuario logueado
let sucursalesConfig = [{id:'duhau',nombre:'Florería Duhau',direccion:'Park Hyatt Buenos Aires',activa:true}];
let _sucursalFiltroGerencia = ''; // '' = todas

function getSucursalId(){ return currentSucursal || 'duhau'; }
function getSucursalNombre(id){ const s = sucursalesConfig.find(x=>x.id===(id||'duhau')); return s?.nombre || (id||'duhau'); }
function filterBySucursal(arr, campo='sucursal'){
  if(!arr) return [];
  if(userRole === 'gerencia' && !_sucursalFiltroGerencia) return arr;
  const target = userRole === 'gerencia' ? _sucursalFiltroGerencia : getSucursalId();
  return arr.filter(r => (r[campo] || 'duhau') === target);
}
function applyRole(role){
  userRole = role;
  window.userRole = role; // expuesto para el listener de avisos (targeting por rol)
  // Marcar el body con la clase del rol — el CSS oculta .gerencia-only automáticamente
  document.body.classList.remove('role-gerencia','role-operario','role-jardinero','role-compras','role-ventas','role-florista','role-comercial','role-housekeeping');
  document.body.classList.add('role-' + role);

  // Ocultar botones productividad para no-gerencia
  const prodBtn = document.getElementById('prod-toggle-btn');
  if(prodBtn) prodBtn.style.display = role === 'gerencia' ? '' : 'none';
  const jopsProdBtn = document.getElementById('jops-prod-btn');
  if(jopsProdBtn) jopsProdBtn.style.display = role === 'gerencia' ? '' : 'none';

  // Búsqueda global: solo gerencia
  const searchBtn = document.querySelector('[onclick="openGlobalSearch()"]');
  if(searchBtn) searchBtn.style.display = role === 'gerencia' ? '' : 'none';

  // Para gerencia: sub-items visibles excepto los exclusivos de otros roles
  if(role === 'gerencia'){
    document.querySelectorAll('.nav-sub-item[data-group]').forEach(el => {
      if(!el.classList.contains('nav-floreria-only') && !el.classList.contains('nav-ventas-only') && !el.classList.contains('nav-jard-only'))
        el.style.display = '';
    });
    const GER_OPS_HIDE = ['Stock Florería','Cotizador','Recordatorios'];
    document.querySelectorAll('.nav-sub-item[data-group="grp-ops"]').forEach(el => {
      if(GER_OPS_HIDE.some(t => el.textContent.trim().includes(t))) el.style.display = 'none';
    });
    // Mostrar sección Reportes (solo gerencia)
    document.querySelectorAll('.nav-gerencia-only').forEach(el => el.style.display = '');
    document.querySelector('[data-group-id="grp-rep"]')?.style && (document.querySelector('[data-group-id="grp-rep"]').style.display = '');
  }

  if(role === 'operario'){
    // Ocultar TODO el sidebar
    document.querySelectorAll('.nav-section-label, .nav-item, .nav-sub-item').forEach(el => {
      el.style.display = 'none';
    });
    // Mostrar Inicio
    document.querySelectorAll('.nav-section-label').forEach(label => {
      if(label.textContent.trim() === 'Principal'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          if(sib.textContent.trim() === 'Inicio') sib.style.display = '';
          sib = sib.nextElementSibling;
        }
      }
    });
    // Mostrar bajo Operaciones: Eventos/Maison, Stock, Cotizador
    document.querySelectorAll('.nav-section-label').forEach(label => {
      if(label.textContent.trim() === 'Operaciones'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          const t = sib.textContent.trim();
          if(['Eventos / Maison','Stock Florería','Cotizador','🏺 Stock de Floreros','🕯️ Stock de Velas'].includes(t)){
            sib.style.display = '';
          }
          sib = sib.nextElementSibling;
        }
      }
    });
    // Mostrar bajo Comercial: Lista de Precios
    document.querySelectorAll('.nav-section-label').forEach(label => {
      if(label.textContent.trim() === 'Comercial'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          if(sib.textContent.trim() === 'Lista de Precios') sib.style.display = '';
          sib = sib.nextElementSibling;
        }
      }
    });
    // Ocultar quick-links no relevantes
    document.querySelectorAll('.quick-link').forEach(ql => {
      const title = ql.querySelector('.quick-link-title')?.textContent || '';
      if(!['Eventos','Stock','Cotizador','Lista de Precios'].some(t => title.includes(t))){
        ql.style.display = 'none';
      }
    });
  }

  if(role === 'florista'){
    document.querySelectorAll('.nav-section-label, .nav-item, .nav-sub-item').forEach(el => { el.style.display = 'none'; });
    // Florista que también es jardinero (ej. Ivan): además de lo de florería, ve jardinería
    const alsoJardinero = !!jardineroNombre;
    const OPS_ALLOW = ['Checklist Diaria','Stock Florería','Eventos / Maison','Cotizador','📦 Recepción de Pedidos','🏺 Stock de Floreros','🕯️ Stock de Velas'];
    if(alsoJardinero) OPS_ALLOW.push('Tareas Jardinería','Habitaciones con Plantas','🔔 Recordatorios Jardín');
    document.querySelectorAll('.nav-section-label').forEach(label => {
      if(label.textContent.trim() === 'Principal'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          if(sib.textContent.trim() === 'Inicio') sib.style.display = '';
          sib = sib.nextElementSibling;
        }
      }
      if(label.textContent.trim() === 'Operaciones'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          if(OPS_ALLOW.some(t => sib.textContent.trim() === t)) sib.style.display = '';
          sib = sib.nextElementSibling;
        }
      }
      if(label.textContent.trim() === 'Comercial'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          const t = sib.textContent.trim();
          if(t === 'Lista de Precios' || t === 'Ramos Disponibles' || t === 'Galería de Trabajos' || t === 'Composiciones') sib.style.display = '';
          sib = sib.nextElementSibling;
        }
      }
    });
    document.querySelector('[data-group-id="grp-ops"]').style.display = '';
    document.querySelector('[data-group-id="grp-com-vt"]').style.display = '';
    document.querySelector('[data-group-id="grp-com-ev"]').style.display = '';
    setTimeout(() => { navExpandGroup('grp-ops'); navExpandGroup('grp-com-vt'); navExpandGroup('grp-com-ev'); }, 50);
    const FL_QL = ['Checklist','Stock','Eventos','Cotizador','Recepción','Ramos','Lista de Precios','Galería','Composiciones'];
    if(alsoJardinero) FL_QL.push('Tareas Jardinería','Habitaciones con Plantas','Recordatorios Jardín');
    document.querySelectorAll('.quick-link').forEach(ql => {
      const title = ql.querySelector('.quick-link-title')?.textContent || '';
      // Mostrar explícitamente los permitidos (revela también los nav-jard-only ocultos por defecto)
      ql.style.display = FL_QL.some(t => title.includes(t)) ? '' : 'none';
    });
    showToast('👋 Hola ' + floristaNombre + '!');
  }

  if(role === 'comercial'){
    // Ocultar todo el sidebar
    document.querySelectorAll('.nav-section-label, .nav-item, .nav-sub-item').forEach(el => {
      el.style.display = 'none';
    });
    // Mostrar Inicio
    document.querySelectorAll('.nav-section-label').forEach(label => {
      if(label.textContent.trim() === 'Principal'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          if(sib.textContent.trim() === 'Inicio') sib.style.display = '';
          sib = sib.nextElementSibling;
        }
      }
    });
    // Mostrar bajo Comercial: SOLO el grupo Ventas, completo (ni más ni menos)
    document.querySelectorAll('.nav-section-label').forEach(label => {
      if(label.textContent.trim() === 'Comercial') label.style.display = '';
    });
    document.querySelectorAll('.nav-sub-item[data-group="grp-com-vt"]').forEach(el => {
      // Mostrar todos los ítems de Ventas salvo las variantes propias de otros roles
      if(!el.classList.contains('nav-floreria-only') && !el.classList.contains('nav-ventas-only')) el.style.display = '';
    });
    // Ocultar quick-links
    document.querySelectorAll('.quick-link').forEach(ql => ql.style.display = 'none');
    const grpComC = document.querySelector('[data-group-id="grp-com-vt"]');
    if(grpComC) grpComC.style.display = '';
    setTimeout(() => navExpandGroup('grp-com-vt'), 50);
    showToast('👋 Hola Euge!');
  }

  if(role === 'ventas'){
    // Ocultar TODO el sidebar
    document.querySelectorAll('.nav-section-label, .nav-item, .nav-sub-item').forEach(el => {
      el.style.display = 'none';
    });
    // Mostrar Inicio
    document.querySelectorAll('.nav-section-label').forEach(label => {
      if(label.textContent.trim() === 'Principal'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          if(sib.textContent.trim() === 'Inicio') sib.style.display = '';
          sib = sib.nextElementSibling;
        }
      }
    });
    // Mostrar bajo Comercial: secciones permitidas
    document.querySelectorAll('.nav-section-label').forEach(label => {
      if(label.textContent.trim() === 'Comercial'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          const t = sib.textContent.trim();
          if(['Ramos Disponibles','Lista de Precios','Pedidos de Habitación'].includes(t) || sib.classList.contains('nav-ventas-only')){
            sib.style.display = '';
          }
          sib = sib.nextElementSibling;
        }
      }
    });
    // Quick links: ocultar todos
    document.querySelectorAll('.quick-link').forEach(ql => ql.style.display = 'none');
    const grpComV = document.querySelector('[data-group-id="grp-com-vt"]');
    if(grpComV) grpComV.style.display = '';
    setTimeout(() => navExpandGroup('grp-com-vt'), 50);
    // Navegar al Panel Hyatt
    setTimeout(()=> navigate('home-hyatt'), 100);
    // Ocultar botón de cargar ramo (ventas solo ve y vende)
    const btnAddRamo = document.getElementById('btn-add-ramo');
    if(btnAddRamo) btnAddRamo.style.display = 'none';
  }

  if(role === 'compras'){
    // Ocultar TODO el sidebar
    document.querySelectorAll('.nav-section-label, .nav-item, .nav-sub-item').forEach(el => {
      el.style.display = 'none';
    });
    // Mostrar sección Compras completa (resumen + Florería + Jardinería + Gestión de Stock)
    document.querySelectorAll('.nav-section-label').forEach(label => {
      if(label.textContent.trim() === 'Compras'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          sib.style.display = '';
          sib = sib.nextElementSibling;
        }
      }
    });
    // Mostrar SOLO "Recepción de Pedidos" dentro de Operaciones (sin el resto)
    document.querySelectorAll('.nav-section-label').forEach(label => {
      if(label.textContent.trim() === 'Operaciones'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          if(sib.textContent.trim().includes('Recepción de Pedidos')) sib.style.display = '';
          sib = sib.nextElementSibling;
        }
      }
    });
    // Quick links: solo los relacionados a compras y recepción
    document.querySelectorAll('.quick-link').forEach(ql => {
      const title = ql.querySelector('.quick-link-title')?.textContent || '';
      if(!['Compras','Gestión de Stock','Recepción de Pedidos'].some(t => title.includes(t))) ql.style.display = 'none';
    });
    document.querySelector('[data-group-id="grp-compras"]').style.display = '';
    document.querySelector('[data-group-id="grp-ops"]').style.display = '';
    setTimeout(()=>{ navigate('compras'); navExpandGroup('grp-compras'); }, 100);
  }

  if(role === 'jardinero'){
    document.querySelectorAll('.nav-section-label, .nav-item, .nav-sub-item').forEach(el => {
      el.style.display = 'none';
    });
    // Operaciones: Tareas Jardinería, Habitaciones con Plantas, Recordatorios Jardín (nav-jard-only)
    document.querySelectorAll('.nav-section-label').forEach(label => {
      if(label.textContent.trim() === 'Operaciones'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          const t = sib.textContent.trim();
          if(t === 'Tareas Jardinería' || t === 'Habitaciones con Plantas' || sib.classList.contains('nav-jard-only'))
            sib.style.display = '';
          sib = sib.nextElementSibling;
        }
      }
    });
    document.querySelector('[data-group-id="grp-ops"]').style.display = '';
    setTimeout(() => navExpandGroup('grp-ops'), 50);
    document.querySelectorAll('.quick-link').forEach(ql => ql.style.display = 'none');
    setTimeout(()=>{ navigate('jardineria-ops'); if(jardineroNombre) showToast('👋 Hola '+jardineroNombre+'!'); }, 100);
  }

  if(role === 'housekeeping'){
    // Solo puede ver Control de Habitaciones (y comentar). Se oculta todo lo demás.
    document.querySelectorAll('.nav-section-label, .nav-item, .nav-sub-item').forEach(el => { el.style.display = 'none'; });
    document.querySelectorAll('.nav-section-label').forEach(label => {
      if(label.textContent.trim() === 'Control'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          if(sib.textContent.trim() === 'Habitaciones con Plantas') sib.style.display = '';
          sib = sib.nextElementSibling;
        }
      }
    });
    const gCtrl = document.querySelector('[data-group-id="grp-ctrl"]');
    if(gCtrl) gCtrl.style.display = '';
    setTimeout(() => navExpandGroup('grp-ctrl'), 50);
    document.querySelectorAll('.quick-link').forEach(ql => ql.style.display = 'none');
    setTimeout(()=>{ navigate('control-habitaciones'); showToast('👋 Housekeeping'); }, 100);
  }

  // Aplicar estado colapsado del acordeón según visibilidad de rol
  finalizeNavGroups();
  // Renderizar barra de navegación inferior mobile
  renderBottomNav(role);
  // Aviso de recordatorios nuevos: badge + cartel al entrar, toast demorado
  // para no pisar el saludo de bienvenida
  renderJardRecAviso();
  setTimeout(notificarRecordatoriosNuevos, 4000);
  // Recordatorio de backup mensual (solo gerencia, demorado)
  if(role === 'gerencia') setTimeout(recordarBackup, 8000);
  // Re-renderizar el Inicio ya con el rol aplicado (evita mostrar el panel completo a no-gerencia)
  if(document.getElementById('home-kpis')) renderHome();
}

// ══════════════════════════════════════════════════════════════════════════════
// HORARIOS Y PRODUCTIVIDAD
// ══════════════════════════════════════════════════════════════════════════════
window.horariosData = {}; // { 'Caro': { '2026-06-15': {desde:'08:00',hasta:'13:00'}, ... } }
let horariosPlantilla = {}; // { 'Caro': { Lunes:{desde:'08:00',hasta:'13:00'}, ... } }
let horMes = new Date().getMonth();
let horAnio = new Date().getFullYear();
const DIAS_SEMANA_NAMES = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DIAS_SEMANA_SHORT = ['Lun','Mar','Mié','Jue','Vie','Sáb'];

function getFloristasActivos(){
  // Tras migrar a hashes los usuarios viven en loginAuth; antes, en loginPasswords.
  const fuente = (loginAuth && Object.keys(loginAuth).length) ? loginAuth : loginPasswords;
  const nombres = [];
  Object.values(fuente||{}).forEach(e => {
    if(e.role === 'florista' && e.floristaNombre) nombres.push(e.floristaNombre);
  });
  return [...new Set(nombres)].sort((a,b) => a.localeCompare(b,'es'));
}

function getEmpleadosActivos(){
  // Dedup: alguien puede ser florista y jardinero a la vez (ej. Ivan), no debe aparecer dos veces
  return [...new Set([...getFloristasActivos(), ...JARDINEROS_LIST])];
}

function isJardinero(nombre){
  return JARDINEROS_LIST.includes(nombre);
}

// Lista de personas que figuran en Horarios (plantilla + calendario).
// Por defecto = empleados activos (floristas + jardinería), para poder
// coordinar los horarios de ambos equipos en un solo lugar. Gerencia puede
// agregar o quitar nombres; esa lista personalizada se guarda en Firebase
// (horariosPersonas) y, si existe, manda sobre el default.
function getHorariosPersonas(){
  const custom = window.horariosPersonas;
  if(Array.isArray(custom) && custom.length) return [...new Set(custom)];
  return getEmpleadosActivos();
}
function horariosAddPersona(nombre){
  const nom = (nombre||'').trim();
  if(!nom) return;
  const lista = getHorariosPersonas();
  if(lista.some(n=>n.toLowerCase()===nom.toLowerCase())){ showToast('Esa persona ya está en la lista'); return; }
  const nueva = [...lista, nom];
  window.horariosPersonas = nueva;
  fbSave('horariosPersonas', nueva);
  if(!horariosPlantilla[nom]) horariosPlantilla[nom] = {};
  renderPlantilla();
  renderHorarios();
  showToast('✅ '+nom+' agregado a horarios');
}
async function horariosRemovePersona(nombre){
  const nom = (nombre||'').trim();
  if(!nom) return;
  if(!await confirmModal(`¿Quitar a "${nom}" de la lista de horarios?\n\nNo se borra el usuario ni las horas ya cargadas, solo deja de figurar en esta planificación.`)) return;
  const nueva = getHorariosPersonas().filter(n=>n!==nom);
  window.horariosPersonas = nueva;
  fbSave('horariosPersonas', nueva);
  renderPlantilla();
  renderHorarios();
  showToast('🗑️ '+nom+' quitado de horarios');
}
async function horariosAddPersonaFromSel(sel){
  const v = sel.value;
  sel.value = '';
  if(!v) return;
  if(v === '__otra__'){
    const nom = await promptModal('Nombre de la persona a agregar:', { title: 'Agregar a horarios' });
    if(nom && nom.trim()) horariosAddPersona(nom.trim());
  } else {
    horariosAddPersona(v);
  }
}

function calcHorasDia(desde, hasta){
  if(!desde || !hasta) return 0;
  const [h1,m1] = desde.split(':').map(Number);
  const [h2,m2] = hasta.split(':').map(Number);
  const diff = (h2*60+m2) - (h1*60+m1);
  return diff > 0 ? Math.round(diff/60*10)/10 : 0;
}

// Jornada REAL fichada en el checklist para una persona en un día.
// Mira AMBAS fuentes: florTurnos (florista) y jardHorarios (jardinería), así
// los usuarios combinados como Ivan se toman bien fichen donde fichen.
// Si hay fichaje en las dos, usa el rango completo: del inicio más temprano
// al fin más tardío. Devuelve {inicio, fin, horas} o null si no fichó.
function jornadaRealDia(nombre, iso){
  const ft = (window.florTurnos||{})[nombre]?.[iso];
  const jt = (window.jardHorarios||{})[nombre]?.[iso];
  const turnos = [ft, jt].filter(x => x && x.inicio && x.fin);
  if(!turnos.length) return null;
  const inis = turnos.map(x => x.inicio).sort();
  const fins = turnos.map(x => x.fin).sort();
  const inicio = inis[0], fin = fins[fins.length-1];
  return { inicio, fin, horas: calcHorasDia(inicio, fin) };
}

function horNavMes(dir){
  horMes += dir;
  if(horMes > 11){ horMes = 0; horAnio++; }
  if(horMes < 0){ horMes = 11; horAnio--; }
  renderHorarios();
}

function togglePlantilla(){
  const wrap = document.getElementById('plantilla-wrap');
  const btn = document.getElementById('plantilla-toggle-btn');
  if(!wrap) return;
  const vis = wrap.style.display !== 'none';
  wrap.style.display = vis ? 'none' : '';
  btn.textContent = vis ? '▼ Mostrar plantilla' : '▲ Ocultar plantilla';
  if(!vis) renderPlantilla();
}

function renderPlantilla(){
  const container = document.getElementById('plantilla-table');
  if(!container) return;
  const personas = getHorariosPersonas();

  // Candidatos para agregar: empleados conocidos que aún no están en la lista
  const candidatos = getEmpleadosActivos().filter(n => !personas.includes(n));
  const addControl = `<div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
    <span style="font-size:11px;color:var(--mid-gray);font-weight:600">➕ Agregar persona:</span>
    <select onchange="horariosAddPersonaFromSel(this)" style="padding:6px 8px;border:1px solid var(--light-gray);border-radius:6px;font-size:12px;font-family:inherit;background:white">
      <option value="">— Elegí quién agregar —</option>
      ${candidatos.length ? '<optgroup label="Empleados">'+candidatos.map(n=>`<option value="${esc(n)}">${esc(n)}${isJardinero(n)?' · Jardinería':''}</option>`).join('')+'</optgroup>' : ''}
      <option value="__otra__">✏️ Otra persona (escribir)…</option>
    </select>
  </div>`;

  const tip = `<div style="font-size:11px;color:var(--mid-gray);margin-top:8px">💡 Completá los horarios base y tocá <strong>"Aplicar al mes"</strong> para rellenar todo el calendario de ${['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][horMes]}. Podés incluir jardinería para coordinar los horarios de ambos equipos.</div>`;

  if(!personas.length){
    container.innerHTML = '<div style="color:var(--mid-gray);padding:8px">No hay personas en la lista. Agregá una para empezar.</div>' + addControl + tip;
    return;
  }

  container.innerHTML = `<div class="table-wrapper"><table class="stock-table" style="font-size:12px">
    <thead><tr>
      <th style="min-width:120px">Persona</th>
      ${DIAS_SEMANA_SHORT.map(d => `<th style="text-align:center;min-width:130px">${d}</th>`).join('')}
    </tr></thead>
    <tbody>${personas.map(nombre => {
      if(!horariosPlantilla[nombre]) horariosPlantilla[nombre] = {};
      return `<tr>
        <td style="font-weight:600">
          <div style="display:flex;align-items:center;gap:6px">
            <span>${esc(nombre)}</span>
            ${isJardinero(nombre) ? '<span style="font-size:9px;background:#EBF5E8;color:#2C6B3A;padding:1px 6px;border-radius:8px;font-weight:600;white-space:nowrap">🌿 Jard.</span>' : ''}
            <button class="btn-icon" title="Quitar de la lista de horarios" onclick="horariosRemovePersona('${esc(nombre)}')" style="color:var(--red-alert);font-size:12px;padding:0 4px;margin-left:auto">✕</button>
          </div>
        </td>
        ${DIAS_SEMANA_NAMES.map(dia => {
          const h = horariosPlantilla[nombre][dia] || {};
          const hs = calcHorasDia(h.desde||'', h.hasta||'');
          return `<td style="text-align:center;padding:4px">
            <div style="display:flex;gap:2px;justify-content:center;align-items:center">
              <input type="time" value="${h.desde||''}" onchange="setPlantilla('${esc(nombre)}','${dia}','desde',this.value)"
                style="width:68px;padding:2px;border:1px solid var(--light-gray);border-radius:4px;font-size:11px;font-family:inherit">
              <span style="font-size:9px;color:var(--mid-gray)">→</span>
              <input type="time" value="${h.hasta||''}" onchange="setPlantilla('${esc(nombre)}','${dia}','hasta',this.value)"
                style="width:68px;padding:2px;border:1px solid var(--light-gray);border-radius:4px;font-size:11px;font-family:inherit">
            </div>
            ${hs > 0 ? `<div style="font-size:9px;color:var(--sage-dark);font-weight:600;margin-top:1px">${hs}h</div>` : ''}
          </td>`;
        }).join('')}
      </tr>`;
    }).join('')}</tbody>
  </table></div>${addControl}${tip}`;
}

function setPlantilla(nombre, dia, campo, val){
  if(!horariosPlantilla[nombre]) horariosPlantilla[nombre] = {};
  if(!horariosPlantilla[nombre][dia]) horariosPlantilla[nombre][dia] = {desde:'',hasta:''};
  horariosPlantilla[nombre][dia][campo] = val;
  fbSave('horariosPlantilla', horariosPlantilla);
  renderPlantilla();
}

function aplicarPlantillaAlMes(){
  const floristas = getHorariosPersonas();
  const diasEnMes = new Date(horAnio, horMes+1, 0).getDate();
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const diaSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

  let count = 0;
  for(let d = 1; d <= diasEnMes; d++){
    const date = new Date(horAnio, horMes, d);
    const dayName = diaSemana[date.getDay()];
    if(dayName === 'Domingo') continue; // Skip domingos
    const iso = `${horAnio}-${String(horMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

    floristas.forEach(nombre => {
      const plantilla = horariosPlantilla[nombre]?.[dayName];
      if(plantilla && plantilla.desde && plantilla.hasta){
        if(!window.horariosData[nombre]) window.horariosData[nombre] = {};
        // Solo aplicar si el día NO tiene horario cargado ya (no pisar excepciones)
        if(!window.horariosData[nombre][iso] || (!window.horariosData[nombre][iso].desde && !window.horariosData[nombre][iso].hasta)){
          window.horariosData[nombre][iso] = {desde: plantilla.desde, hasta: plantilla.hasta};
          count++;
        }
      }
    });
  }

  fbSave('horariosData', window.horariosData);
  renderHorarios();
  showToast(`✅ Plantilla aplicada a ${meses[horMes]} · ${count} horarios cargados`);
}

function aplicarPlantillaForce(){
  // Versión que pisa todo (para usar con confirmación)
  const floristas = getHorariosPersonas();
  const diasEnMes = new Date(horAnio, horMes+1, 0).getDate();
  const diaSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  let count = 0;
  for(let d = 1; d <= diasEnMes; d++){
    const date = new Date(horAnio, horMes, d);
    const dayName = diaSemana[date.getDay()];
    if(dayName === 'Domingo') continue;
    const iso = `${horAnio}-${String(horMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    floristas.forEach(nombre => {
      const plantilla = horariosPlantilla[nombre]?.[dayName];
      if(!window.horariosData[nombre]) window.horariosData[nombre] = {};
      if(plantilla && plantilla.desde && plantilla.hasta){
        window.horariosData[nombre][iso] = {desde: plantilla.desde, hasta: plantilla.hasta};
        count++;
      } else {
        delete window.horariosData[nombre][iso];
      }
    });
  }
  fbSave('horariosData', window.horariosData);
  renderHorarios();
  showToast(`✅ Mes completo recargado con plantilla · ${count} horarios`);
}

function renderHorarios(){
  const cal = document.getElementById('hor-calendar');
  const sel = document.getElementById('hor-florista-sel');
  if(!cal) return;

  const empleados = getHorariosPersonas();
  if(sel){
    const cur = sel.value;
    const flor = empleados.filter(n=>!isJardinero(n));
    const jard = empleados.filter(n=>isJardinero(n));
    sel.innerHTML = '<option value="">— Todos —</option>'
      + (flor.length ? '<optgroup label="Florería">' + flor.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('') + '</optgroup>' : '')
      + (jard.length ? '<optgroup label="Jardinería">' + jard.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('') + '</optgroup>' : '');
    sel.value = cur;
  }
  const filtro = sel?.value || '';
  const lista = filtro ? [filtro] : empleados;

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const primerDia = new Date(horAnio, horMes, 1);
  const diasEnMes = new Date(horAnio, horMes+1, 0).getDate();
  let startDay = primerDia.getDay(); // 0=dom
  if(startDay === 0) startDay = 7; // lun=1

  // Generar grilla del mes
  let calHtml = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <button class="btn-secondary" onclick="horNavMes(-1)" style="padding:5px 12px">◀</button>
    <strong style="font-size:15px;color:#1A1A1A">${meses[horMes]} ${horAnio}</strong>
    <button class="btn-secondary" onclick="horNavMes(1)" style="padding:5px 12px">▶</button>
  </div>`;

  calHtml += `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:var(--light-gray);border-radius:8px;overflow:hidden">`;
  ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].forEach(d => {
    calHtml += `<div style="background:#E5E3DC;padding:6px;text-align:center;font-size:10px;font-weight:600;color:var(--charcoal);letter-spacing:.5px">${d}</div>`;
  });

  // Celdas vacías antes del primer día
  for(let e = 1; e < startDay; e++){
    calHtml += '<div style="background:var(--warm-white);padding:6px"></div>';
  }

  // Días del mes
  for(let d = 1; d <= diasEnMes; d++){
    const iso = `${horAnio}-${String(horMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = iso === TODAY_ISO;
    const isPast = iso < TODAY_ISO;

    // Contar empleados con horario ese día
    let totalHs = 0;
    let asignados = 0;
    lista.forEach(n => {
      // Jornada REAL fichada en el checklist (florista y/o jardinería).
      // La plantilla (horariosData) queda solo como respaldo si no fichó.
      const real = jornadaRealDia(n, iso);
      if(real){ totalHs += real.horas; asignados++; }
      else {
        const h = window.horariosData[n]?.[iso];
        if(h && h.desde && h.hasta){ totalHs += calcHorasDia(h.desde, h.hasta); asignados++; }
      }
    });

    const bgColor = isToday ? '#EBF0E8' : isPast ? '#F8F7F5' : 'var(--warm-white)';
    const border = isToday ? '2px solid var(--green-ok)' : 'none';

    calHtml += `<div style="background:${bgColor};padding:6px;min-height:60px;cursor:pointer;border:${border}" onclick="openDiaHorario('${iso}')">
      <div style="font-size:12px;font-weight:${isToday?'700':'500'};color:${isToday?'var(--green-ok)':'#1A1A1A'};margin-bottom:3px">${d}</div>
      ${asignados > 0 ? `<div style="font-size:9px;color:var(--sage-dark);font-weight:600">${asignados} empleado${asignados>1?'s':''}</div>
        <div style="font-size:9px;color:var(--mid-gray)">${totalHs}h total</div>` : ''}
    </div>`;
  }
  calHtml += '</div>';
  cal.innerHTML = calHtml;

  renderInformeHoras(lista);
  renderProductividadHorarios(lista);
}

function openDiaHorario(iso){
  const filtro = document.getElementById('hor-florista-sel')?.value;
  const lista = filtro ? [filtro] : getEmpleadosActivos();
  const diaLabel = fmtDate(iso);

  let ov = document.getElementById('dia-horario-modal');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'dia-horario-modal';
    ov.className = 'modal-overlay';
    document.body.appendChild(ov);
  }

  ov.innerHTML = `<div class="modal" style="max-width:500px">
    <button class="modal-close" onclick="document.getElementById('dia-horario-modal').classList.remove('open')">✕</button>
    <div class="modal-title">📅 ${diaLabel}</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:14px">Cargá las horas de cada empleado para este día.</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${lista.map(nombre => {
        if(!window.horariosData[nombre]) window.horariosData[nombre] = {};
        const h = window.horariosData[nombre][iso] || {desde:'',hasta:''};
        const hs = calcHorasDia(h.desde, h.hasta);
        // Jornada REAL fichada en el checklist (florista y/o jardinería)
        const real = jornadaRealDia(nombre, iso);
        const fichado = real
          ? `<div style="font-size:10px;color:var(--green-ok);font-weight:600;margin-top:2px">✓ Fichó ${real.inicio}–${real.fin} · ${real.horas}h reales</div>`
          : '';
        return `<div style="padding:8px 0;border-bottom:1px solid var(--light-gray)">
          <div style="display:flex;align-items:center;gap:10px">
            <strong style="flex:1;font-size:13px;color:#1A1A1A;min-width:80px">${esc(nombre)}</strong>
            <input type="time" value="${h.desde||''}" id="hor_${nombre}_${iso}_desde"
              style="width:90px;padding:4px 6px;border:1px solid var(--light-gray);border-radius:4px;font-size:12px;font-family:inherit">
            <span style="font-size:11px;color:var(--mid-gray)">→</span>
            <input type="time" value="${h.hasta||''}" id="hor_${nombre}_${iso}_hasta"
              style="width:90px;padding:4px 6px;border:1px solid var(--light-gray);border-radius:4px;font-size:12px;font-family:inherit">
            <span style="font-size:11px;color:var(--sage-dark);font-weight:600;min-width:30px">${hs > 0 ? hs+'h' : ''}</span>
          </div>
          ${fichado}
        </div>`;
      }).join('')}
    </div>
    <div class="modal-actions" style="margin-top:16px">
      <button class="btn-secondary" onclick="limpiarDiaHorario('${iso}')">🗑 Limpiar día</button>
      <button class="btn-add" onclick="guardarDiaHorario('${iso}')">✓ Guardar</button>
    </div>
  </div>`;
  ov.classList.add('open');
}

function guardarDiaHorario(iso){
  const filtro = document.getElementById('hor-florista-sel')?.value;
  const lista = filtro ? [filtro] : getEmpleadosActivos();

  lista.forEach(nombre => {
    if(!window.horariosData[nombre]) window.horariosData[nombre] = {};
    const desde = document.getElementById('hor_'+nombre+'_'+iso+'_desde')?.value || '';
    const hasta = document.getElementById('hor_'+nombre+'_'+iso+'_hasta')?.value || '';
    if(desde && hasta){
      window.horariosData[nombre][iso] = {desde, hasta};
    } else {
      delete window.horariosData[nombre][iso];
    }
  });
  fbSave('horariosData', window.horariosData);
  document.getElementById('dia-horario-modal')?.classList.remove('open');
  renderHorarios();
  showToast('✅ Horarios guardados para ' + fmtDate(iso));
}

function limpiarDiaHorario(iso){
  getEmpleadosActivos().forEach(nombre => {
    if(window.horariosData[nombre]) delete window.horariosData[nombre][iso];
  });
  fbSave('horariosData', window.horariosData);
  document.getElementById('dia-horario-modal')?.classList.remove('open');
  renderHorarios();
  showToast('🗑 Horarios del día limpiados');
}

// ── Informe de horas del mes: PROGRAMADAS (calendario) vs REALES (ingreso/egreso) ──
// Para cada persona, por semana del mes en curso, compara las horas planificadas
// (horariosData) con las horas realmente fichadas (jornadaRealDia). Deja ver si
// alguien vino de más (real > programado) o de menos (real < programado).
function _mondayISO(iso){
  const d = new Date(iso+'T00:00:00');
  let day = d.getDay(); if(day===0) day = 7;
  d.setDate(d.getDate()-(day-1));
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function renderInformeHoras(lista){
  const cont = document.getElementById('hor-informe-hs');
  if(!cont) return;
  const dm = iso => iso.slice(8,10)+'/'+iso.slice(5,7);
  const r1 = n => Math.round(n*10)/10;
  const diasEnMes = new Date(horAnio, horMes+1, 0).getDate();
  // Agrupar los días del mes por semana (lunes a domingo)
  const semanas = new Map();
  for(let d=1; d<=diasEnMes; d++){
    const iso = `${horAnio}-${String(horMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const wk = _mondayISO(iso);
    if(!semanas.has(wk)) semanas.set(wk, []);
    semanas.get(wk).push(iso);
  }
  const weeks = [...semanas.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(e=>e[1]);

  const cards = lista.map(nombre => {
    let mesProg=0, mesReal=0;
    const filasWk = weeks.map(dias => {
      let prog=0, real=0;
      dias.forEach(iso => {
        const h = window.horariosData?.[nombre]?.[iso];
        if(h && h.desde && h.hasta) prog += calcHorasDia(h.desde, h.hasta);
        const rr = jornadaRealDia(nombre, iso);
        if(rr) real += rr.horas;
      });
      mesProg += prog; mesReal += real;
      if(prog===0 && real===0) return '';
      const diff = r1(real - prog);
      const col = Math.abs(diff)<0.5 ? 'var(--mid-gray)' : diff>0 ? 'var(--red-alert)' : 'var(--amber)';
      const txt = Math.abs(diff)<0.5 ? '=' : (diff>0?'+':'')+diff+'h';
      return `<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;padding:3px 0;border-top:1px dashed var(--light-gray)">
        <span style="color:var(--mid-gray);white-space:nowrap">Sem ${dm(dias[0])}–${dm(dias[dias.length-1])}</span>
        <span style="white-space:nowrap">Prog <strong>${r1(prog)}h</strong> · Real <strong>${r1(real)}h</strong> · <span style="color:${col};font-weight:700" title="Diferencia real − programado">${txt}</span></span>
      </div>`;
    }).join('');
    if(mesProg===0 && mesReal===0) return '';
    const diffMes = r1(mesReal - mesProg);
    const colM = Math.abs(diffMes)<0.5 ? 'var(--mid-gray)' : diffMes>0 ? 'var(--red-alert)' : 'var(--amber)';
    const txtM = Math.abs(diffMes)<0.5 ? '= en horario' : (diffMes>0?'+'+diffMes+'h de más':diffMes+'h de menos');
    return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;padding:12px 14px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:4px">
        <strong style="font-size:14px;color:var(--charcoal)">${esc(nombre)}</strong>
        <span style="font-size:12px">Mes: Prog <strong>${r1(mesProg)}h</strong> · Real <strong>${r1(mesReal)}h</strong> · <span style="color:${colM};font-weight:700">${txtM}</span></span>
      </div>
      ${filasWk}
    </div>`;
  }).filter(Boolean).join('');

  cont.innerHTML = cards || '<div style="color:var(--mid-gray);font-size:13px;padding:14px;text-align:center;background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px">Sin horas programadas ni fichadas este mes.</div>';
}

function renderProductividadHorarios(empleados){
  const container = document.getElementById('hor-productividad');
  const labelEl = document.getElementById('hor-hoy-label');
  if(!container) return;
  if(labelEl) labelEl.textContent = TODAY_DAY + ' ' + fmtDate(TODAY_ISO);

  const dayState = clStateByDay[TODAY_DAY];

  const dur = (a,b) => { if(!a || !b) return 0; const [h1,m1]=a.split(':').map(Number); const [h2,m2]=b.split(':').map(Number); const d=(h2*60+m2)-(h1*60+m1); return d>0?d:0; };

  container.innerHTML = empleados.map(nombre => {
    let tareasHechas = 0, tareasAsignadas = 0, minsTareas = 0;

    // 1) Horario PROGRAMADO (plantilla que carga gerencia)
    const hor = window.horariosData[nombre]?.[TODAY_ISO] || {};
    const hsProgramadas = calcHorasDia(hor.desde, hor.hasta);

    // 2) Jornada REAL fichada (florista y/o jardinería) — toma a Ivan bien
    const real = jornadaRealDia(nombre, TODAY_ISO);
    const minsJornada = real ? real.horas * 60 : 0;

    // 3) Tiempo en TAREAS asignadas (suma de duraciones) + conteo de tareas.
    //    Se computan TODAS las fuentes para que los usuarios combinados
    //    (florista + jardinería) sumen sus dos tipos de tarea.
    if(dayState){
      CL_TASKS.forEach((t,i) => {
        if((dayState.responsable?.[i] || '') !== nombre) return;
        tareasAsignadas++;
        minsTareas += dur(dayState.inicio?.[i], dayState.fin?.[i]);
        const checked = Array.isArray(dayState.checked) ? dayState.checked[i] : (dayState.checked?.[i]);
        if(checked) tareasHechas++;
      });
    }
    eventosData.forEach(ev => {
      if(ev.fecha !== TODAY_ISO) return;
      if(ev.asignado === nombre){ tareasAsignadas++; if(ev.inicio && ev.fin){ tareasHechas++; minsTareas += dur(ev.inicio, ev.fin); } }
      if(ev.colocacionAsignado === nombre){ tareasAsignadas++; if(ev.colocacionInicio && ev.colocacionFin){ tareasHechas++; minsTareas += dur(ev.colocacionInicio, ev.colocacionFin); } }
      if(ev.retiroAsignado === nombre){ tareasAsignadas++; if(ev.retiroInicio && ev.retiroFin){ tareasHechas++; minsTareas += dur(ev.retiroInicio, ev.retiroFin); } }
    });
    (ventasData||[]).forEach(v => {
      if(v.asignado === nombre && v.estado === 'pendiente'){ tareasAsignadas++; if(v.inicio && v.fin){ tareasHechas++; minsTareas += dur(v.inicio, v.fin); } }
    });
    (window.jardineriaLog||[]).forEach(e => {
      if(e.fecha !== TODAY_ISO || e.quien !== nombre) return;
      // Estar en el log = tarea hecha (se cierra con "Hecho", sin horario por tarea).
      tareasAsignadas++; tareasHechas++;
      if(e.horaInicio && e.horaFin) minsTareas += dur(e.horaInicio, e.horaFin);
    });

    const hsTrabajadas = Math.round(minsJornada/60*10)/10;
    const hsTareas     = Math.round(minsTareas/60*10)/10;
    const diff = hsTrabajadas - hsProgramadas;
    const pct  = hsProgramadas > 0 ? Math.round(hsTrabajadas/hsProgramadas*100) : 0;
    // % del tiempo de trabajo que se fue en tareas asignadas (si no fichó, vs programado)
    const baseTareas = minsJornada > 0 ? minsJornada : hsProgramadas*60;
    const pctTareas  = baseTareas > 0 ? Math.round(minsTareas/baseTareas*100) : 0;

    let statusColor, statusIcon, statusText;
    if(hsProgramadas === 0 && minsJornada === 0 && minsTareas === 0){
      statusColor = 'var(--mid-gray)'; statusIcon = '⬜'; statusText = 'No trabaja hoy';
    } else if(minsJornada === 0 && minsTareas > 0){
      statusColor = 'var(--amber)'; statusIcon = '🟡'; statusText = 'Tareas registradas · falta marcar jornada';
    } else if(minsJornada === 0){
      statusColor = 'var(--mid-gray)'; statusIcon = '⏳'; statusText = 'Sin actividad registrada';
    } else if(diff > 0.5){
      statusColor = 'var(--red-alert)'; statusIcon = '🔴'; statusText = `+${diff.toFixed(1)}h extra · revisar`;
    } else if(hsProgramadas === 0){
      statusColor = 'var(--green-ok)'; statusIcon = '✅'; statusText = `${hsTrabajadas}h trabajadas`;
    } else if(pct >= 80){
      statusColor = 'var(--green-ok)'; statusIcon = '✅'; statusText = 'Productividad OK';
    } else {
      statusColor = 'var(--amber)'; statusIcon = '🟡'; statusText = `${(hsProgramadas - hsTrabajadas).toFixed(1)}h disponibles`;
    }

    const barColor = diff > 0.5 ? 'var(--red-alert)' : pct >= 80 ? 'var(--green-ok)' : 'var(--amber)';
    const hayDatos = hsProgramadas > 0 || minsJornada > 0 || minsTareas > 0;

    return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;padding:14px 16px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <div>
          <strong style="font-size:14px;color:#1A1A1A">${esc(nombre)}</strong>
          <span style="font-size:12px;color:var(--mid-gray);margin-left:8px">${tareasHechas}/${tareasAsignadas} tareas</span>
        </div>
        <span style="font-size:12px;font-weight:600;color:${statusColor}">${statusIcon} ${statusText}</span>
      </div>
      ${hayDatos ? `<div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap">
        <div style="text-align:center;min-width:64px">
          <div style="font-size:10px;color:var(--mid-gray)">Programado</div>
          <div style="font-size:19px;font-weight:700;color:var(--charcoal)">${hsProgramadas}h</div>
          <div style="font-size:9px;color:var(--mid-gray)">${hor.desde||'—'} → ${hor.hasta||'—'}</div>
        </div>
        <div style="text-align:center;min-width:64px">
          <div style="font-size:10px;color:var(--mid-gray)">Trabajado</div>
          <div style="font-size:19px;font-weight:700;color:${barColor}">${hsTrabajadas}h</div>
          <div style="font-size:9px;color:var(--mid-gray)">${real ? real.inicio+' → '+real.fin : 'sin fichar'}</div>
        </div>
        <div style="text-align:center;min-width:64px">
          <div style="font-size:10px;color:var(--mid-gray)">En tareas</div>
          <div style="font-size:19px;font-weight:700;color:var(--sage-dark)">${hsTareas}h</div>
          <div style="font-size:9px;color:var(--mid-gray)">${tareasHechas} con horario</div>
        </div>
        <div style="flex:1;min-width:150px">
          <div style="font-size:9px;color:var(--mid-gray);margin-bottom:2px">Tiempo de trabajo (jornada)</div>
          <div style="height:8px;background:#E5E3DC;border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${Math.min(100,pct)}%;background:${barColor};border-radius:4px;transition:width .5s"></div>
          </div>
          <div style="font-size:10px;color:var(--mid-gray);margin:1px 0 8px;text-align:right">${pct}% de lo programado</div>
          <div style="font-size:9px;color:var(--mid-gray);margin-bottom:2px">Tiempo en tareas asignadas</div>
          <div style="height:8px;background:#E5E3DC;border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${Math.min(100,pctTareas)}%;background:var(--sage-dark);border-radius:4px;transition:width .5s"></div>
          </div>
          <div style="font-size:10px;color:var(--mid-gray);margin-top:1px;text-align:right">${pctTareas}% ${minsJornada>0?'de la jornada':'de lo programado'}</div>
        </div>
      </div>` : ''}
    </div>`;
  }).join('');
}

// ── SISTEMA DE LOGIN CON CONTRASEÑAS EDITABLES ───────────────────────────────

// Inicio/Fin para eventos (se muestra en checklist y computa en productividad)
function renderEvHoraCell(evIdx, campo, ev, fase){
  fase = fase || 'armado';
  const iniField = fase === 'retiro' ? 'retiroInicio' : fase === 'colocacion' ? 'colocacionInicio' : 'inicio';
  const finField = fase === 'retiro' ? 'retiroFin' : fase === 'colocacion' ? 'colocacionFin' : 'fin';
  const field = campo === 'inicio' ? iniField : finField;
  const val = ev[field] || '';
  if(val){
    return `<span style="font-size:13px;font-weight:600;color:var(--green-ok)">${val}</span>`;
  }
  if(campo === 'inicio' || (campo === 'fin' && ev[iniField])){
    return `<button onclick="registrarHoraEvento(${evIdx},'${campo}','${fase}')" style="background:${campo==='inicio'?'var(--green-ok)':'var(--amber)'};color:white;border:none;border-radius:4px;padding:4px 10px;font-size:11px;cursor:pointer;font-family:inherit">${campo==='inicio'?'▶ Inicio':'⏹ Fin'}</button>`;
  }
  return '<span style="color:var(--mid-gray);font-size:11px">—</span>';
}

function registrarHoraEvento(evIdx, campo, fase){
  fase = fase || 'armado';
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const hhmm = hh+':'+mm;
  const ev = eventosData[evIdx];

  if(fase === 'retiro'){
    ev[campo === 'inicio' ? 'retiroInicio' : 'retiroFin'] = hhmm;
    if(campo === 'fin'){
      // Retiro terminado → evento completo
      ev.estado = 'Pedidos Finalizados';
      fbSave('eventosData', eventosData);
      renderChecklistTable();
      if(document.getElementById('page-eventos-comercial')?.classList.contains('active')) renderEventos();
      if(document.getElementById('page-eventos-maison')?.classList.contains('active')) renderKanban();
      renderHome();
      showToast(`✅ Retiro finalizado: "${ev.nombre}". Evento completo.`);
      return;
    }
    fbSave('eventosData', eventosData);
    renderChecklistTable();
    showToast(`▶ Inicio de retiro: "${ev.nombre}" · ${hhmm}`);
    return;
  }

  if(fase === 'colocacion'){
    ev[campo === 'inicio' ? 'colocacionInicio' : 'colocacionFin'] = hhmm;
    if(campo === 'fin'){
      // Colocación terminada. Si hay retiro asignado, queda pendiente de retiro;
      // si no, el evento se finaliza (comportamiento de siempre).
      if(ev.retiroAsignado){
        ev.estado = 'Pendiente de Retiro';
        fbSave('eventosData', eventosData);
        renderChecklistTable();
        if(document.getElementById('page-eventos-comercial')?.classList.contains('active')) renderEventos();
        if(document.getElementById('page-eventos-maison')?.classList.contains('active')) renderKanban();
        renderHome();
        notificarAsignacion(ev.retiroAsignado, '🔄 Listo para retirar', `"${ev.nombre}" ya fue colocado. Retirá el arreglo al finalizar el evento.`);
        showToast(`✅ Colocación finalizada: "${ev.nombre}". Pendiente de retiro por ${ev.retiroAsignado}.`);
        return;
      }
      ev.estado = 'Pedidos Finalizados';
      fbSave('eventosData', eventosData);
      renderChecklistTable();
      if(document.getElementById('page-eventos-comercial')?.classList.contains('active')) renderEventos();
      if(document.getElementById('page-eventos-maison')?.classList.contains('active')) renderKanban();
      renderHome();
      showToast(`✅ Colocación finalizada: "${ev.nombre}". Evento completo.`);
      return;
    }
    fbSave('eventosData', eventosData);
    renderChecklistTable();
    showToast(`▶ Inicio de colocación: "${ev.nombre}" · ${hhmm}`);
    return;
  }

  // Armado
  ev[campo] = hhmm;
  if(campo === 'fin'){
    // Inicio+Fin = armado terminado → queda pendiente de colocación
    ev.estado = 'Pendiente de Colocacion';
    fbSave('eventosData', eventosData);
    renderChecklistTable();
    if(document.getElementById('page-eventos-comercial')?.classList.contains('active')) renderEventos();
    if(document.getElementById('page-eventos-maison')?.classList.contains('active')) renderKanban();
    renderHome();
    // Aviso a gerencia para que asigne la colocación
    window.pushSend?.('🌸 Evento listo para colocación', `"${ev.nombre}" fue armado por ${ev.asignado||'el equipo'}. Asigná la colocación.`, 'colocacion');
    showToast(`⏹ Armado finalizado: "${ev.nombre}". Avisamos a gerencia para la colocación.`);
    return;
  }
  fbSave('eventosData', eventosData);
  renderChecklistTable();
  showToast(`▶ Inicio de armado: "${ev.nombre}" · ${hhmm}`);
}

// Inicio/Fin para ventas
function renderVentaHoraCell(vIdx, campo, v){
  const val = v[campo] || '';
  if(val){
    return `<span style="font-size:13px;font-weight:600;color:var(--green-ok)">${val}</span>`;
  }
  if(campo === 'inicio' || (campo === 'fin' && v.inicio)){
    return `<button onclick="registrarHoraVenta(${vIdx},'${campo}')" style="background:${campo==='inicio'?'var(--green-ok)':'var(--amber)'};color:white;border:none;border-radius:4px;padding:4px 10px;font-size:11px;cursor:pointer;font-family:inherit">${campo==='inicio'?'▶ Inicio':'⏹ Fin'}</button>`;
  }
  return '<span style="color:var(--mid-gray);font-size:11px">—</span>';
}

function registrarHoraVenta(vIdx, campo){
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  ventasData[vIdx][campo] = hh+':'+mm;
  if(campo === 'fin'){
    ventasData[vIdx].estado = 'entregado';
  }
  fbSave('ventasData', ventasData);
  if(campo === 'fin') sincronizarVentaCaja(vIdx);
  renderChecklistTable();
  showToast(`${campo==='inicio'?'▶':'⏹'} ${campo} registrado para "${ventasData[vIdx].prod}": ${hh}:${mm}`);
}
const LOGIN_DEFAULTS = {
  'alvear':     { role:'gerencia',  label:'Gerencia' },
  'duhau':      { role:'operario',  label:'Operario General' },
  'sole':       { role:'jardinero', label:'Sole',  jardineroNombre:'Sole' },
  'berni':      { role:'jardinero', label:'Berni', jardineroNombre:'Berni' },
  'compras':    { role:'compras',   label:'Compras' },
  'hyatt':      { role:'ventas',    label:'Hyatt Ventas' },
  'caro':       { role:'florista',  label:'Caro',  floristaNombre:'Caro' },
  'clo':        { role:'florista',  label:'Clo',   floristaNombre:'Clo' },
  'cris':       { role:'florista',  label:'Cris',  floristaNombre:'Cris' },
  'gabi':       { role:'florista',  label:'Gabi',  floristaNombre:'Gabi' },
  'ivan':       { role:'florista',  label:'Ivan',  floristaNombre:'Ivan', jardineroNombre:'Ivan' },
  'pao':        { role:'florista',  label:'Pao',   floristaNombre:'Pao' },
  'nora':       { role:'florista',  label:'Nora',  floristaNombre:'Nora' },
  'euge':       { role:'comercial', label:'Euge' },
  'housekeeping':{ role:'housekeeping', label:'Housekeeping' },
};
let loginPasswords = JSON.parse(JSON.stringify(LOGIN_DEFAULTS));
let currentLoginKey = null; // la contraseña con la que se logueó
// Puente para que el listener de Firebase actualice ESTA variable (la que usa el
// login), no una copia separada en window. Sin esto, los cambios de contraseña
// se guardaban en Firebase pero el login seguía usando los valores por defecto.
window._setLoginPasswords = (v) => { if(v && typeof v === 'object') loginPasswords = v; };

// ── Autenticación con hash (PBKDF2) ───────────────────────────────────────────
// Las contraseñas ya no viajan en texto plano: en la base se guarda `loginAuth`,
// indexado por id de usuario (el label en minúsculas, que no es secreto), con
// salt aleatorio y hash PBKDF2. El personal sigue escribiendo su contraseña
// igual; el login recorre los usuarios y compara hashes.
// Retrocompatible: mientras no exista `loginAuth`, se usa `loginPasswords`
// (texto plano) como hasta ahora, y gerencia lo migra al entrar.
let loginAuth = null;         // { [id]: { role, label, ..., salt, hash } }
let currentAuthId = null;     // id del usuario logueado (para cambiar contraseña)
window._setLoginAuth = (v) => { loginAuth = (v && typeof v === 'object' && Object.keys(v).length) ? v : null; };

function _bufToB64(buf){ let s=''; new Uint8Array(buf).forEach(b=>s+=String.fromCharCode(b)); return btoa(s); }
function _randSalt(){ return _bufToB64(crypto.getRandomValues(new Uint8Array(16))); }

async function hashPassword(pw, saltB64){
  // Normaliza como el login histórico (case-insensitive, sin espacios)
  const norm = String(pw).trim().toLowerCase();
  const salt = Uint8Array.from(atob(saltB64), c=>c.charCodeAt(0));
  const keyMat = await crypto.subtle.importKey('raw', new TextEncoder().encode(norm), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt, iterations:150000, hash:'SHA-256' }, keyMat, 256);
  return _bufToB64(bits);
}

// Construye la entrada de identidad común (usada por login y push)
function _aplicarEntry(entry, id){
  if(entry.role === 'florista' && entry.floristaNombre && JARDINEROS_LIST.includes(entry.floristaNombre) && !entry.jardineroNombre){
    entry.jardineroNombre = entry.floristaNombre;
  }
  currentAuthId = id;
  if(entry.floristaNombre) floristaNombre = entry.floristaNombre;
  if(entry.jardineroNombre){ jardineroNombre = entry.jardineroNombre; jardCurrentJardinero = jardineroNombre; try{ localStorage.setItem('jardCurrentJardinero', jardineroNombre); }catch(e){} }
  window.currentUserLabel = entry.label || id;
  window._pushIdentity = { label: entry.label || id, roles: [entry.role, entry.jardineroNombre ? 'jardinero' : null].filter(Boolean) };
  currentSucursal = entry.sucursal || 'duhau';
}

// Verifica una contraseña. Devuelve {entry, id} o null.
async function verificarLogin(val){
  if(loginAuth){
    for(const [id, e] of Object.entries(loginAuth)){
      if(!e?.salt || !e?.hash) continue;
      const h = await hashPassword(val, e.salt);
      if(h === e.hash) return { entry: {...e}, id };
    }
    return null;
  }
  // Fallback texto plano (esquema viejo): la clave ES la contraseña
  const key = String(val).trim().toLowerCase();
  const e = loginPasswords[key];
  return e ? { entry: {...e}, id: (e.label||key).toLowerCase() } : null;
}

// Construye el objeto loginAuth (hashes) a partir de loginPasswords (texto plano)
async function _construirLoginAuth(src){
  const auth = {};
  for(const [pw, e] of Object.entries(src||{})){
    const salt = _randSalt();
    const hash = await hashPassword(pw, salt);
    const id = String(e.label || pw).toLowerCase().replace(/[.#$/[\]\s]/g, '_');
    auth[id] = { role:e.role, label:e.label||pw, salt, hash,
      ...(e.floristaNombre?{floristaNombre:e.floristaNombre}:{}),
      ...(e.jardineroNombre?{jardineroNombre:e.jardineroNombre}:{}),
      ...(e.sucursal?{sucursal:e.sucursal}:{}) };
  }
  return auth;
}

function _persistLoginAuth(){
  if(window.fbSetPath) window.fbSetPath('loginAuth', loginAuth);
  else fbSave('loginAuth', loginAuth);
}

// Migra a hashes al entrar gerencia. Autoverifica que la contraseña de gerencia
// siga validando antes de borrar el texto plano (para no dejar a nadie afuera).
async function migrarSeguridadLogin(pwGerenciaActual){
  // Si Firebase ya tiene loginAuth (aunque el listener no lo haya cargado aún),
  // NO migrar: reconstruir desde defaults pisaría los usuarios reales.
  if(loginAuth || window._loginAuthReady || !Object.keys(loginPasswords||{}).length) return;
  const auth = await _construirLoginAuth(loginPasswords);
  let ok = false;
  for(const e of Object.values(auth)){
    if(await hashPassword(pwGerenciaActual, e.salt) === e.hash){ ok = true; break; }
  }
  if(!ok){ console.warn('Migración de login abortada: autoverificación falló'); return; }
  loginAuth = auth;
  _persistLoginAuth();
  if(window.fbSetPath) window.fbSetPath('loginPasswords', null); // borra el texto plano de la base
  showToast('🔒 Contraseñas protegidas — ahora se guardan cifradas');
}

// Garantiza loginAuth antes de gestionar usuarios (ya estás logueado como gerencia).
// CRÍTICO: si Firebase tiene loginAuth pero el listener todavía no lo cargó,
// esperamos — reconstruir desde los defaults locales pisaría los floristas reales.
async function _ensureLoginAuth(){
  if(loginAuth) return true;
  // Esperar hasta ~3s a que el listener traiga loginAuth de Firebase
  for(let i=0; i<30 && !loginAuth && !window._loginAuthReady; i++){
    await new Promise(r=>setTimeout(r, 100));
  }
  if(loginAuth) return true;
  if(window._loginAuthReady){
    // Firebase lo tiene pero aún no asentó en la variable; esperar un poco más
    for(let i=0; i<20 && !loginAuth; i++){ await new Promise(r=>setTimeout(r, 100)); }
    if(loginAuth) return true;
    showToast('⚠️ Esperá unos segundos, cargando usuarios…');
    return false;
  }
  // Genuinamente no hay loginAuth en Firebase → migrar desde loginPasswords (reales)
  loginAuth = await _construirLoginAuth(loginPasswords);
  _persistLoginAuth();
  if(window.fbSetPath) window.fbSetPath('loginPasswords', null);
  return true;
}

// Setea (o crea) la contraseña de un usuario del esquema con hash
async function _setUserPassword(id, pw){
  if(!loginAuth || !loginAuth[id]) return false;
  const salt = _randSalt();
  const hash = await hashPassword(pw, salt);
  loginAuth[id] = { ...loginAuth[id], salt, hash };
  if(window.fbSetPath) window.fbSetPath('loginAuth/'+id, loginAuth[id]);
  else _persistLoginAuth();
  return true;
}

// ¿Ya existe un usuario con esa contraseña? (para evitar colisiones al crear)
async function _passwordEnUso(pw){
  if(!loginAuth) return !!loginPasswords[String(pw).trim().toLowerCase()];
  for(const e of Object.values(loginAuth)){
    if(e?.salt && await hashPassword(pw, e.salt) === e.hash) return true;
  }
  return false;
}

// ── Briefing "Buen día" al entrar (una vez por día por dispositivo) ───────────
function _saludoHora(){
  const h = new Date().getHours();
  return h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
}

function mostrarBriefingDia(retry = 0){
  const label = window.currentUserLabel || '';
  const k = 'briefing_' + TODAY_ISO + '_' + label;
  try{ if(localStorage.getItem(k)){ mostrarEventosDelDia(); return; } }catch(e){}
  // Esperar a que Firebase traiga datos (si todavía no llegó nada)
  if(retry < 3 && !(eventosData||[]).length && !Object.keys(clStateByDay||{}).length){
    setTimeout(()=>mostrarBriefingDia(retry+1), 1200);
    return;
  }
  try{ localStorage.setItem(k,'1'); }catch(e){}

  const fechaTxt = new Date(TODAY_ISO+'T12:00:00').toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' });
  const ds = clStateByDay[currentDay] || {};
  let rows = [];
  if(userRole==='florista' && floristaNombre){
    const mis = CL_TASKS.map((_,i)=>i).filter(i => (ds.responsable?.[i]||'') === floristaNombre);
    const horario = (window.horariosData||{})[floristaNombre]?.[TODAY_ISO];
    const evs = (eventosData||[]).filter(ev => ev.estado!=='Pedidos Finalizados' &&
      eventoFlorFase(ev, eventoFase(ev)) === floristaNombre && faseVisibleFlorista(ev, eventoFase(ev)));
    rows = [
      ['📋', mis.length ? `Tenés ${mis.length} tarea${mis.length!==1?'s':''} asignada${mis.length!==1?'s':''} para hoy` : 'Todavía no tenés tareas asignadas'],
      horario?.desde ? ['🕐', `Tu turno: ${horario.desde} a ${horario.hasta||'—'}`] : null,
      evs.length ? ['🎉', 'Eventos: ' + esc(evs.map(e=>e.nombre).slice(0,2).join(' · '))] : null,
    ];
  } else if(userRole==='gerencia'){
    const evsHoy = (eventosData||[]).filter(e => e.fecha===TODAY_ISO && e.estado!=='Pedidos Finalizados');
    const conTurno = getFloristasActivos().filter(n => (window.horariosData||{})[n]?.[TODAY_ISO]?.desde);
    const hechas = (ds.checked||[]).filter(Boolean).length;
    const venc = jardRecordatorios.filter(r=>recEstado(r)==='vencido').length;
    rows = [
      ['🎉', evsHoy.length ? `${evsHoy.length} evento${evsHoy.length!==1?'s':''} hoy: ${esc(evsHoy.map(e=>e.nombre).slice(0,2).join(' · '))}` : 'Sin eventos hoy'],
      ['👥', conTurno.length ? 'Con turno hoy: ' + esc(conTurno.join(', ')) : 'Nadie con turno asignado hoy'],
      ['✅', `Checklist: ${hechas} de ${CL_TASKS.length} tareas hechas`],
      venc ? ['🌿', `${venc} recordatorio${venc!==1?'s':''} de jardín vencido${venc!==1?'s':''}`] : null,
    ];
  } else if(userRole==='jardinero'){
    const venc = jardRecordatorios.filter(r=>recEstado(r)==='vencido').length;
    const prox = jardRecordatorios.filter(r=>recEstado(r)==='proximo').length;
    rows = [
      venc ? ['🔴', `${venc} recordatorio${venc!==1?'s':''} vencido${venc!==1?'s':''} para atender`] : ['🟢', 'Recordatorios de jardín al día'],
      prox ? ['🟡', `${prox} por vencer en los próximos días`] : null,
    ];
  }
  rows = rows.filter(Boolean);

  const nombre = floristaNombre || jardineroNombre || (userRole==='gerencia' ? '' : label);
  const ov = document.createElement('div');
  ov.id = 'briefing-overlay';
  ov.className = 'briefing-overlay';
  ov.innerHTML = `
    <div class="briefing-card">
      <div class="briefing-flor">🌸</div>
      <div class="briefing-saludo">${_saludoHora()}${nombre ? ', ' + esc(nombre) : ''}</div>
      <div class="briefing-fecha">${esc(fechaTxt)}</div>
      ${rows.length ? `<div class="briefing-rows">${rows.map(([ic,tx])=>`<div class="briefing-row"><span>${ic}</span><span>${tx}</span></div>`).join('')}</div>` : ''}
      <button class="btn-add briefing-btn" onclick="cerrarBriefing()">Empezar el día →</button>
    </div>`;
  ov.addEventListener('click', e => { if(e.target === ov) cerrarBriefing(); });
  document.body.appendChild(ov);
  requestAnimationFrame(()=>ov.classList.add('open'));
}

function cerrarBriefing(){
  const ov = document.getElementById('briefing-overlay');
  if(!ov) return;
  ov.classList.remove('open');
  setTimeout(()=>ov.remove(), 400);
}

// ── Resumen semanal automático (gerencia) ─────────────────────────────────────
// Se genera del lado cliente: cuando gerencia entra en una semana nueva, arma el
// resumen de la semana que cerró y avisa por push a los demás dispositivos de
// gerencia. (El cron del Worker no puede leer Firebase sin service account, así
// que el resumen lo produce el cliente, que ya tiene todos los datos.)
function _rangoSemanaPasada(){
  const hoy = new Date(TODAY_ISO);
  const dow = (hoy.getDay()+6)%7; // 0=lunes
  const lunesEsta = new Date(hoy); lunesEsta.setDate(hoy.getDate()-dow);
  const lunesPasada = new Date(lunesEsta); lunesPasada.setDate(lunesEsta.getDate()-7);
  const domingoPasada = new Date(lunesEsta); domingoPasada.setDate(lunesEsta.getDate()-1);
  const iso = d => d.toISOString().slice(0,10);
  return { desde: iso(lunesPasada), hasta: iso(domingoPasada), weekKey: getISOWeekKey(lunesPasada) };
}

function calcularResumenSemanal(desde, hasta){
  const enRango = d => d && d>=desde && d<=hasta;
  const regs = (checklistHistory||[]).filter(r => enRango(r.date));
  const porFlor = {};
  regs.forEach(r => {
    const n = r.who || '—';
    porFlor[n] = porFlor[n] || { hechas:0, exc:0 };
    porFlor[n].hechas++;
    if(r.excedida) porFlor[n].exc++;
  });
  const ventas = (ventasData||[]).filter(v => enRango(v.fecha));
  const totalVentas = ventas.reduce((s,v)=>s+parseMoney(v.precio),0);
  const eventos = (eventosData||[]).filter(e => enRango(e.fecha) && (e.estado==='Pedidos Finalizados'||e.estado==='Confirmado'));
  // Zona con el Nuevo más atrasado
  const map = mapUltimoNuevoPorZona();
  let peorZona=null, peorDias=-1;
  [...new Map(CL_TASKS.filter(t=>String(t.actividad).toLowerCase()!=='riego').map(t=>[_zonaKey(t.sec,t.zona),t])).values()].forEach(t=>{
    const f = map[_zonaKey(t.sec,t.zona)];
    const dias = f ? Math.floor((new Date(TODAY_ISO)-new Date(f))/86400000) : 999;
    if(dias>peorDias){ peorDias=dias; peorZona=t.zona; }
  });
  return { regs:regs.length, porFlor, totalVentas, nVentas:ventas.length, eventos:eventos.length, peorZona, peorDias };
}

function mostrarResumenSemanal(retry=0, force=false){
  if(userRole!=='gerencia') return;
  const { desde, hasta, weekKey } = _rangoSemanaPasada();
  const k = 'resumenSem_' + weekKey;
  if(!force){ try{ if(localStorage.getItem(k)) return; }catch(e){} }
  // Esperar a que Firebase traiga el historial
  if(!force && retry < 3 && !(checklistHistory||[]).length){ setTimeout(()=>mostrarResumenSemanal(retry+1), 2000); return; }

  const r = calcularResumenSemanal(desde, hasta);
  if(!force && !r.regs && !r.nVentas && !r.eventos) { try{ localStorage.setItem(k,'1'); }catch(e){} return; } // semana sin actividad
  try{ localStorage.setItem(k,'1'); }catch(e){}

  const fmtARS = n => '$' + Math.round(n).toLocaleString('es-AR');
  const flor = Object.entries(r.porFlor).sort((a,b)=>b[1].hechas-a[1].hechas);
  const rows = [
    ['✅', `${r.regs} tareas completadas` + (flor.length ? ' — ' + esc(flor.slice(0,3).map(([n,d])=>`${n}: ${d.hechas}`).join(', ')) : '')],
    flor.some(([,d])=>d.exc) ? ['⏱', 'Excedidas: ' + esc(flor.filter(([,d])=>d.exc).map(([n,d])=>`${n} ${d.exc}`).join(', '))] : null,
    ['💰', `${fmtARS(r.totalVentas)} en ventas (${r.nVentas})`],
    ['🎉', `${r.eventos} evento${r.eventos!==1?'s':''} realizado${r.eventos!==1?'s':''}`],
    r.peorZona && r.peorDias>=5 ? ['🌸', `Zona más atrasada de Nuevo: ${esc(r.peorZona)} (${r.peorDias>900?'sin registro':r.peorDias+' días'})`] : null,
  ].filter(Boolean);

  const desdeTxt = new Date(desde+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'short'});
  const hastaTxt = new Date(hasta+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'short'});
  const ov = document.createElement('div');
  ov.id = 'briefing-overlay';
  ov.className = 'briefing-overlay';
  ov.innerHTML = `
    <div class="briefing-card">
      <div class="briefing-flor">📊</div>
      <div class="briefing-saludo">Resumen de la semana</div>
      <div class="briefing-fecha">${desdeTxt} — ${hastaTxt}</div>
      <div class="briefing-rows">${rows.map(([ic,tx])=>`<div class="briefing-row"><span>${ic}</span><span>${tx}</span></div>`).join('')}</div>
      <button class="btn-add briefing-btn" onclick="cerrarBriefing()">Cerrar</button>
    </div>`;
  ov.addEventListener('click', e => { if(e.target === ov) cerrarBriefing(); });
  document.body.appendChild(ov);
  requestAnimationFrame(()=>ov.classList.add('open'));

  // Aviso por push a los demás dispositivos de gerencia
  window.pushSend?.('📊 Resumen semanal listo',
    `${r.regs} tareas · ${fmtARS(r.totalVentas)} en ventas · ${r.eventos} eventos`,
    'resumen-semanal', 'roles:gerencia');
}

async function doLogin(){
  const inp = document.getElementById('login-input');
  const err = document.getElementById('login-error');
  const val = inp.value.trim();
  if(!val) return;
  const found = await verificarLogin(val);
  if(found){
    const entry = found.entry;
    if(!loginAuth) currentLoginKey = val.trim().toLowerCase(); // modo viejo: cambio de contraseña propia
    _aplicarEntry(entry, found.id);
    applyRole(entry.role);
    renderSucursalIndicador();
    const screen = document.getElementById('login-screen');
    screen.classList.add('hide');
    setTimeout(()=>screen.remove(), 520);
    // Migración de seguridad: gerencia convierte las contraseñas a hashes la
    // primera vez que entra (retrocompatible, no rompe el flujo del personal).
    if(entry.role === 'gerencia' && !loginAuth){ setTimeout(()=>migrarSeguridadLogin(val), 3000); }
    // Activar notificaciones push si el navegador lo soporta
    setTimeout(()=>initPushForUser?.(), 2000);
    setTimeout(()=>alertasAutomaticas(), 4000);
    setTimeout(()=>checkOnboarding(entry.role), 800);
    // Briefing del día (si ya se vio hoy, cae al aviso de eventos de siempre)
    setTimeout(()=>mostrarBriefingDia(), 2200);
    // Mantenimiento: poda del historial (gerencia, una vez al día, sin urgencia)
    if(entry.role === 'gerencia') setTimeout(()=>podarHistorial(), 12000);
    // Resumen semanal: al entrar gerencia en una semana nueva (una vez por semana)
    if(entry.role === 'gerencia') setTimeout(()=>mostrarResumenSemanal(), 6000);
  } else {
    err.textContent = 'Contraseña incorrecta';
    inp.classList.add('error');
    setTimeout(()=>inp.classList.remove('error'), 400);
    inp.value = '';
    inp.focus();
  }
}

async function cambiarContrasena(){
  const nueva = await promptModal('Ingresá tu nueva contraseña (mínimo 4 caracteres):', { title: 'Cambiar contraseña', password: false });
  if(!nueva || nueva.trim().length < 4){ showToast('⚠️ La contraseña debe tener al menos 4 caracteres'); return; }
  const nuevaClean = nueva.trim();
  const confirmar = await promptModal('Confirmá la nueva contraseña:', { title: 'Cambiar contraseña', password: false });
  if(!confirmar || confirmar.trim().toLowerCase() !== nuevaClean.toLowerCase()){ showToast('⚠️ Las contraseñas no coinciden'); return; }
  if(loginAuth){
    if(!currentAuthId || !loginAuth[currentAuthId]){ showToast('⚠️ Error de sesión'); return; }
    await _setUserPassword(currentAuthId, nuevaClean);
  } else {
    // Modo viejo (texto plano): todavía sin migrar
    const entry = loginPasswords[currentLoginKey];
    if(!entry){ showToast('⚠️ Error de sesión'); return; }
    const nuevoKey = nuevaClean.toLowerCase();
    if(nuevoKey !== currentLoginKey && loginPasswords[nuevoKey]){ showToast('⚠️ Esa contraseña ya está en uso'); return; }
    loginPasswords[nuevoKey] = {...entry};
    if(nuevoKey !== currentLoginKey) delete loginPasswords[currentLoginKey];
    currentLoginKey = nuevoKey;
    fbSave('loginPasswords', loginPasswords);
  }
  showToast('✅ Contraseña cambiada. Ahora ingresás con: ' + nuevaClean);
}

async function openGestionPasswords(){
  if(userRole !== 'gerencia'){ showToast('⛔ Solo gerencia'); return; }
  if(!await _ensureLoginAuth()) return;
  let ov = document.getElementById('gestion-passwords-modal');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'gestion-passwords-modal';
    ov.className = 'modal-overlay';
    document.body.appendChild(ov);
  }
  const entries = Object.entries(loginAuth||{}).sort((a,b) => {
    const order = {gerencia:0,operario:1,florista:2,jardinero:3,compras:4,ventas:5,comercial:6,housekeeping:7};
    return (order[a[1].role]||9) - (order[b[1].role]||9);
  });
  const roleLabels = {gerencia:'👔 Gerencia',operario:'🏠 Operario',florista:'💐 Florista',jardinero:'🌿 Jardinero',compras:'📦 Compras',ventas:'🏨 Hyatt Ventas',comercial:'🎯 Comercial',housekeeping:'🧹 Housekeeping'};

  ov.innerHTML = `<div class="modal" style="max-width:600px;max-height:85vh;overflow-y:auto">
    <button class="modal-close" onclick="document.getElementById('gestion-passwords-modal').classList.remove('open')">✕</button>
    <div class="modal-title">👥 Gestión de Usuarios</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:6px">Cambiá o reseteá la contraseña de cualquier usuario.</div>
    <div style="font-size:11.5px;color:var(--sage-dark);background:#EBF5E8;border-radius:8px;padding:8px 12px;margin-bottom:16px">🔒 Las contraseñas se guardan cifradas — por seguridad no se pueden ver, solo cambiar.</div>
    <div style="display:flex;flex-direction:column;gap:1px;background:var(--light-gray);border-radius:8px;overflow:hidden">
      ${entries.map(([id, e]) => `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--warm-white)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:#1A1A1A">${esc(e.label || e.floristaNombre || id)}</div>
          <div style="font-size:11px;color:var(--mid-gray)">${roleLabels[e.role]||e.role}</div>
        </div>
        <div style="background:#F4F1EC;padding:4px 12px;border-radius:6px;font-size:12px;color:var(--mid-gray);min-width:70px;text-align:center">•••••</div>
        <button onclick="resetearPassword('${esc(id)}')" style="background:none;border:1px solid var(--light-gray);border-radius:6px;padding:5px 10px;font-size:11px;cursor:pointer;font-family:inherit;color:var(--charcoal);white-space:nowrap">✏️ Cambiar</button>
        ${(e.role==='florista'||e.role==='housekeeping') ? `<button onclick="eliminarUsuario('${esc(id)}')" style="background:none;border:1px solid #E8CECE;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer;font-family:inherit;color:var(--red-alert);white-space:nowrap">✕</button>` : ''}
      </div>`).join('')}
    </div>
    <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn-add" onclick="agregarUsuarioFlorista()" style="font-size:12px;padding:8px 16px">+ Agregar florista</button>
      <button class="btn-secondary" onclick="agregarUsuarioHousekeeping()" style="font-size:12px;padding:8px 16px">🧹 Agregar housekeeping</button>
    </div>
  </div>`;
  ov.classList.add('open');
}

async function agregarUsuarioHousekeeping(){
  if(userRole !== 'gerencia') return;
  if(!await _ensureLoginAuth()) return;
  const nombre = await promptModal('Nombre del usuario de housekeeping (ej. Housekeeping, Recepción):', { title: 'Nuevo usuario housekeeping', default: 'Housekeeping' });
  if(!nombre || !nombre.trim()) return;
  const nombreClean = nombre.trim();
  const password = await promptModal('Contraseña para ' + nombreClean + ':', { title: 'Nuevo usuario housekeeping', default: nombreClean.toLowerCase(), password: false });
  if(!password || password.trim().length < 4){ showToast('⚠️ Mínimo 4 caracteres'); return; }
  if(await _passwordEnUso(password.trim())){ showToast('⚠️ Esa contraseña ya está en uso'); return; }
  const id = nombreClean.toLowerCase().replace(/[.#$/[\]\s]/g,'_');
  if(loginAuth[id]){ showToast('⚠️ Ya existe un usuario con ese nombre'); return; }
  const salt = _randSalt();
  const hash = await hashPassword(password.trim(), salt);
  loginAuth[id] = { role:'housekeeping', label:nombreClean, salt, hash };
  if(window.fbSetPath) window.fbSetPath('loginAuth/'+id, loginAuth[id]); else _persistLoginAuth();
  showToast('✅ Usuario housekeeping "' + nombreClean + '" creado — contraseña: ' + password.trim());
  openGestionPasswords();
}

async function agregarUsuarioFlorista(){
  if(userRole !== 'gerencia') return;
  if(!await _ensureLoginAuth()) return;
  const nombre = await promptModal('Nombre del/la florista (ej. María):', { title: 'Nuevo usuario florista' });
  if(!nombre || !nombre.trim()) return;
  const nombreClean = nombre.trim();
  const password = await promptModal('Contraseña para ' + nombreClean + ':', { title: 'Nuevo usuario florista', default: nombreClean.toLowerCase(), password: false });
  if(!password || password.trim().length < 4){ showToast('⚠️ Mínimo 4 caracteres'); return; }
  if(await _passwordEnUso(password.trim())){ showToast('⚠️ Esa contraseña ya está en uso'); return; }
  const id = nombreClean.toLowerCase().replace(/[.#$/[\]\s]/g,'_');
  if(loginAuth[id]){ showToast('⚠️ Ya existe un usuario con ese nombre'); return; }
  const salt = _randSalt();
  const hash = await hashPassword(password.trim(), salt);
  loginAuth[id] = { role:'florista', label:nombreClean, floristaNombre:nombreClean, salt, hash };
  if(window.fbSetPath) window.fbSetPath('loginAuth/'+id, loginAuth[id]); else _persistLoginAuth();
  if(!CL_RESP_OPTS.includes(nombreClean)){
    CL_RESP_OPTS.push(nombreClean);
    CL_RESP_OPTS.sort((a,b) => a.localeCompare(b,'es'));
  }
  showToast('✅ Florista ' + nombreClean + ' creado/a — contraseña: ' + password.trim());
  openGestionPasswords();
}

async function resetearPassword(id){
  if(userRole !== 'gerencia') return;
  if(!await _ensureLoginAuth()) return;
  const entry = loginAuth[id];
  if(!entry){ showToast('Usuario no encontrado'); return; }
  const nueva = await promptModal('Nueva contraseña para ' + (entry.label||id) + ':', { title: 'Resetear contraseña', password: false });
  if(!nueva || nueva.trim().length < 4){ showToast('⚠️ Mínimo 4 caracteres'); return; }
  if(await _passwordEnUso(nueva.trim())){ showToast('⚠️ Esa contraseña ya está en uso por otro usuario'); return; }
  await _setUserPassword(id, nueva.trim());
  showToast('✅ Contraseña de ' + (entry.label||id) + ' cambiada a: ' + nueva.trim());
  openGestionPasswords();
}

async function eliminarUsuario(id){
  if(userRole !== 'gerencia') return;
  if(!await _ensureLoginAuth()) return;
  const entry = loginAuth[id];
  if(!entry) return;
  if(entry.role !== 'florista' && entry.role !== 'housekeeping'){ showToast('⚠️ Solo se pueden eliminar usuarios floristas o housekeeping'); return; }
  if(!await confirmModal('¿Eliminar al usuario ' + (entry.label||id) + '?\nYa no podrá ingresar al sistema.')) return;
  const idx = CL_RESP_OPTS.indexOf(entry.floristaNombre);
  if(idx > -1) CL_RESP_OPTS.splice(idx, 1);
  delete loginAuth[id];
  if(window.fbSetPath) window.fbSetPath('loginAuth/'+id, null); else _persistLoginAuth();
  showToast('🗑️ Usuario ' + (entry.label||id) + ' eliminado');
  openGestionPasswords();
}

async function resetearTodasPasswords(){
  if(userRole !== 'gerencia') return;
  if(!await confirmModal('¿Resetear TODAS las contraseñas a los valores originales?\n\nAlvear, Duhau, Caro, etc. volverán a ser las contraseñas.')) return;
  loginAuth = await _construirLoginAuth(LOGIN_DEFAULTS);
  _persistLoginAuth();
  if(window.fbSetPath) window.fbSetPath('loginPasswords', null);
  showToast('🔄 Todas las contraseñas reseteadas a valores originales');
  openGestionPasswords();
}
// Focus input on load
window.addEventListener('load', ()=>{
  const inp = document.getElementById('login-input');
  if(inp) inp.focus();
});



// Nota: las áreas de uso para los pedidos salen de las zonas del checklist
// (ver getAreaUsoZonas), para que coincidan con la rentabilidad por área.

// ════════════════════════════════════════
// DATA — BASE DE INSUMOS FLORERÍA
// ════════════════════════════════════════
let insumosBDBase = [
  'Abelia',
  'Achilea',
  'Aganpanto',
  'Aguaribay',
  'Alelíes',
  'Alstroemerias',
  'Amaranto',
  'Anemonas',
  'Aspidistra',
  'Aster',
  'Azaleas',
  'Azarero Disciplinado',
  'Azarero Nana',
  'Azucena',
  'Biznaga',
  'Botoncito',
  'Buxus',
  'Calas',
  'Calistemo',
  'Calitas mini',
  'Cardos azules',
  'Carqueja - Fede',
  'Caspia blanca',
  'Celosia',
  'Centaura (flor azul)',
  'Cera',
  'Clavel rojo',
  'Claveles',
  'Cola de zorro',
  'Colsa',
  'Conejitos',
  'Copetes',
  'Craspedia',
  'Cresta de gallo',
  'Crisantemo fideo',
  'Crisantemo Otome',
  'Cycas',
  'Delfinium',
  'Dianthus',
  'Espuela de caballero',
  'Eucaliptus',
  'Eucaliptus hoja alargada',
  'Eucaliptus mini',
  'Eupatorium',
  'Flor azul',
  'Flor de humo',
  'Formio',
  'Fotiña',
  'Fresias',
  'Gerberas',
  'Girasol',
  'Gladiolos',
  'Gloriosa',
  'Gonfrena',
  'Green balls',
  'Gypsophila Importada',
  'Gypsophila Nacional',
  'Helecho plumoso',
  'Heliconias',
  'Hibiscus',
  'Hiedra',
  'Hipericum',
  'Hortensias',
  'Iris Violeta',
  'Jazmines',
  'Junquillo',
  'Kalaguala',
  'Laurel',
  'Laurentino',
  'Leptospermu',
  'Ligustro (frutos)',
  'Lilium Perfumado',
  'Liliums',
  'Limonium',
  'Lino',
  'liriope variegado',
  'Lisianthus',
  'Magnolia',
  'Margaritas',
  'Marimonias',
  'Melilotus',
  'Mini Gerberas',
  'Mini Margaritas',
  'Mini Statice',
  'Moa',
  'Molucela',
  'Monsteras',
  'Narcisos',
  'Nardo',
  'Naviza',
  'Nigricans',
  'Ojito de Perdiz',
  'Olea variegada',
  'Ondulatum',
  'Organza',
  'Ornithogalum',
  'Orquideas Cymbidium',
  'Orquideas Phaleanopsis',
  'Paico',
  'Penacho',
  'Peonias',
  'Pitosporum Maggi',
  'Proteas',
  'Repollo Comun',
  'Repollo Especial',
  'Roble',
  'Rosas Importadas',
  'Rosas Nacionales',
  'Rositas Spray',
  'Sakura',
  'San Vicentes',
  'Scabiosa',
  'Solidago',
  'Sorgo',
  'Statice',
  'Strelitzia',
  'Suculentas',
  'Trachelium',
  'Tulipanes',
  'Vidensauria',
  'Zinnia'
];

// Insumos personalizados agregados por el usuario (se guardan en localStorage)
let insumosCustom = JSON.parse(localStorage.getItem('fl_insumos_custom')||'[]');

function getAllInsumos(){
  const all = [...new Set([...insumosBDBase, ...insumosCustom])];
  return all.sort((a,b)=>a.localeCompare(b,'es'));
}

function saveInsumosCustom(){
  localStorage.setItem('fl_insumos_custom', JSON.stringify(insumosCustom));
}

function addInsumoToBase(nombre){
  const n = nombre.trim();
  if(!n) return;
  if(!insumosBDBase.includes(n) && !insumosCustom.includes(n)){
    insumosCustom.push(n);
    saveInsumosCustom();
    populateFloreriaFormHelpers();
    showToast('📌 "'+n+'" agregado a la base de insumos');
  }
}


// ── PEDIDO RÁPIDO ────────────────────────────────────────────────────────────
let insumosGridVisible = false;

function toggleInsumosGrid(){
  insumosGridVisible = !insumosGridVisible;
  document.getElementById('insumos-grid-wrap').style.display = insumosGridVisible ? 'block' : 'none';
  document.getElementById('insumos-toggle-btn').textContent = insumosGridVisible ? '▲ Ocultar listado' : '▼ Ver listado';
  if(insumosGridVisible) renderInsumosGrid();
}

function renderInsumosGrid(){
  const search = (document.getElementById('insumo-search')?.value||'').toLowerCase();
  const grid = document.getElementById('insumos-grid');
  if(!grid) return;
  const all = getAllInsumos();
  const filtered = search ? all.filter(n=>n.toLowerCase().includes(search)) : all;

  grid.innerHTML = filtered.map(nombre=>{
    const id = 'chk-'+nombre.replace(/[^a-zA-Z0-9]/g,'_');
    const isCustom = insumosCustom.includes(nombre);
    return `<div class="insumo-row" id="row-${id}">
      <input type="checkbox" class="insumo-check" id="${id}" onchange="updateInsumoRow('${id}')">
      <label class="insumo-label" for="${id}">${esc(nombre)}${isCustom?' <span style="font-size:9px;color:var(--sage);font-weight:600">NUEVO</span>':''}</label>
      <input type="number" class="insumo-qty" id="qty-${id}" value="1" min="1" placeholder="Cant." style="display:none">
    </div>`;
  }).join('');

  updateInsumoCount();

  // Update custom badge
  const badge = document.getElementById('insumos-custom-badge');
  if(badge){
    if(insumosCustom.length>0){
      badge.textContent = insumosCustom.length+' insumos propios';
      badge.style.display='inline';
    } else {
      badge.style.display='none';
    }
  }
}

function updateInsumoRow(id){
  const chk = document.getElementById(id);
  const qty = document.getElementById('qty-'+id);
  const row = document.getElementById('row-'+id);
  if(chk && qty && row){
    qty.style.display = chk.checked ? 'block' : 'none';
    row.classList.toggle('selected', chk.checked);
  }
  updateInsumoCount();
}

function updateInsumoCount(){
  const count = document.querySelectorAll('.insumo-check:checked').length;
  const el = document.getElementById('insumos-selected-count');
  if(el) el.textContent = count;
}

function deselectAllInsumos(){
  document.querySelectorAll('.insumo-check').forEach(c=>{ c.checked=false; });
  document.querySelectorAll('.insumo-qty').forEach(q=>{ q.style.display='none'; });
  document.querySelectorAll('.insumo-row').forEach(r=>r.classList.remove('selected'));
  updateInsumoCount();
}

function agregarNuevoInsumo(){
  const input = document.getElementById('nuevo-insumo-input');
  const nombre = input?.value.trim();
  if(!nombre){ showToast('Ingresá el nombre del insumo.','error'); return; }
  addInsumoToBase(nombre);
  if(input) input.value='';
  renderInsumosGrid();
}

function agregarPedidoRapido(){
  const checks = document.querySelectorAll('.insumo-check:checked');
  if(checks.length===0){ showToast('Seleccioná al menos un insumo.','error'); return; }
  const fecha = document.getElementById('cf-fecha')?.value || TODAY_ISO;
  const pedidopor = document.getElementById('cf-pedidopor')?.value || '';
  let added = 0;
  checks.forEach(chk=>{
    const id = chk.id;
    const label = document.querySelector(`label[for="${id}"]`);
    const nombre = label ? label.textContent.replace(' NUEVO','').trim() : id;
    const qty = document.getElementById('qty-'+id)?.value || 1;
    comprasFlore.unshift({
      fecha, pedidopor: pedidopor||'—',
      prod: nombre, desc:'', qty: +qty,
      costo:'', prov:'', sector:'',
      estado:'pedido'
    });
    // Si es un insumo nuevo, registrarlo en la base
    addInsumoToBase(nombre);
    added++;
  });
  deselectAllInsumos();
  window._comprasFloreLastSave = Date.now(); fbSave('comprasFlore', comprasFlore);
  renderCompras('floreria');
  updateKpiCompras();
  showToast('✅ '+added+' insumo'+(added>1?'s':'')+' agregado'+(added>1?'s':'')+' al pedido');
  // Scroll a la tabla
  document.getElementById('tbody-floreria')?.closest('.compras-list-wrap')?.scrollIntoView({behavior:'smooth',block:'start'});
}



// ════════════════════════════════════════
// DATA — COMPOSICIONES
// ════════════════════════════════════════
const ARREGLOS_BASE = ['Bochita','Cuenco','Pecera','Paila','Buffet'];

let recetasData = [];

// ── Cantidades con fracción de vara (ej. 1/3 = una vara alcanza para 3 arreglos) ─
function _parseCant(str){
  str = String(str==null?'':str).trim().replace(',', '.');
  if(!str) return 0;
  const mixto = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);      // "1 1/2"
  if(mixto) return (+mixto[1]) + (+mixto[2])/(+mixto[3]);
  const frac = str.match(/^(\d+)\/(\d+)$/);               // "1/3"
  if(frac) return (+frac[1])/(+frac[2]);
  return parseFloat(str) || 0;
}
function _fmtCant(q){
  q = +q || 0;
  if(q === 0) return '0';
  if(Number.isInteger(q)) return String(q);
  const ent = Math.floor(q), frac = q - ent;
  const tabla = [[0.5,'1/2'],[1/3,'1/3'],[2/3,'2/3'],[0.25,'1/4'],[0.75,'3/4'],[0.2,'1/5'],[1/6,'1/6'],[1/8,'1/8']];
  let f = ''; for(const [v,s] of tabla){ if(Math.abs(frac-v) < 0.02){ f = s; break; } }
  if(!f) return String(Math.round(q*100)/100);
  return ent > 0 ? ent + ' ' + f : f;
}
// Cantidad + unidad de un ingrediente (ej. "4 paq" o "3 varas").
function _fmtIngUnidad(ing){
  const q = _fmtCant(ing.qty);
  if(ing && ing.unidad === 'paq') return `${q} paq`;
  return `${q} vara${(+ing.qty)===1?'':'s'}`;
}

// ── Catálogo base de composiciones (Upgrade + Eventos) ─
// Los ingredientes con "/" son opciones (se usa la que haya). Las fracciones
// significan qué parte de una vara lleva (1/3 = una vara rinde para 3 arreglos).
const _CN='Conejito / Nardos / Alhelí', _MS='Margarita / Sanvicente',
      _DCR='Dianthus / Cresta de gallo / Rosa nacional', _SLS='Solidago / Limonium / Statice',
      _LA='Laurentino / Azarero', _LRC='Lilium / Repollo / Crisantemo fideo o pomposo';
const COMPOSICIONES_BASE = [
  { nombre:'Upgrade · Bochita', ings:[{prod:_CN,qty:1},{prod:_MS,qty:2},{prod:_DCR,qty:2},{prod:'Astromelia',qty:1},{prod:_SLS,qty:1/5},{prod:_LA,qty:1/3},{prod:'Thuja',qty:1/6}] },
  { nombre:'Upgrade · Pecera', ings:[{prod:_CN,qty:3},{prod:_MS,qty:4},{prod:'Astromelia',qty:4},{prod:_DCR,qty:3},{prod:_LRC,qty:1},{prod:'Laurentino',qty:1},{prod:'Azarero',qty:1},{prod:'Thuja',qty:1/2}] },
  { nombre:'Upgrade · Arreglo alto de follaje', ings:[{prod:'Florero alto en cono',qty:1},{prod:'Monstera',qty:2}] },
  { nombre:'Evento · Bochita de follaje', ings:[{prod:'Laurentino',qty:1/3},{prod:'Azarero',qty:1/3},{prod:'Thuja',qty:1/6}] },
  { nombre:'Evento · Bochita de flores', ings:[{prod:_CN,qty:3},{prod:_MS,qty:3},{prod:_DCR,qty:2},{prod:'Astromelia',qty:1},{prod:_SLS,qty:1/5},{prod:_LA,qty:1/3},{prod:'Thuja',qty:1/6}] },
  { nombre:'Evento · Cuenco de follaje', ings:[{prod:'Laurentino',qty:2},{prod:'Azarero',qty:1},{prod:'Thuja',qty:1/3}] },
  { nombre:'Evento · Cuenco de flores', ings:[{prod:_CN,qty:3},{prod:_MS,qty:3},{prod:_DCR,qty:2},{prod:'Astromelia',qty:3},{prod:_SLS,qty:1/2},{prod:'Laurentino',qty:1/2},{prod:'Azarero',qty:1/2},{prod:'Thuja',qty:1/3}] },
  { nombre:'Evento · Pecera de follaje', ings:[{prod:'Laurentino',qty:3},{prod:'Azarero',qty:3},{prod:'Thuja',qty:1/2}] },
  { nombre:'Evento · Pecera de flores', ings:[{prod:_CN,qty:3},{prod:_MS,qty:4},{prod:'Astromelia',qty:4},{prod:_DCR,qty:6},{prod:_SLS,qty:1},{prod:'Laurentino',qty:1},{prod:'Azarero',qty:1},{prod:'Thuja',qty:1/2}] },
  { nombre:'Evento · Paila de follaje', ings:[{prod:'Laurentino',qty:3},{prod:'Azarero',qty:3},{prod:'Thuja',qty:1/2}] },
  { nombre:'Evento · Paila de flores', ings:[{prod:_CN,qty:3},{prod:_MS,qty:4},{prod:'Astromelia',qty:4},{prod:_DCR,qty:6},{prod:_SLS,qty:1},{prod:'Laurentino',qty:1},{prod:'Azarero',qty:2},{prod:'Thuja',qty:1/2}] },
  { nombre:'Evento · Arreglo alto Buffet de follaje', ings:[{prod:'Laurentino',qty:3},{prod:'Azarero',qty:3},{prod:'Thuja',qty:2}] },
  { nombre:'Evento · Arreglo alto Buffet de flores', ings:[{prod:_CN,qty:3},{prod:_MS,qty:3},{prod:'Astromelia',qty:3},{prod:_DCR,qty:3},{prod:'Laurentino',qty:2},{prod:'Azarero',qty:2},{prod:'Thuja',qty:2}] },
];

async function seedComposicionesBase(){
  if(userRole!=='gerencia'){ showToast('⛔ Solo gerencia'); return; }
  const existentes = new Set(recetasData.map(r=>r.nombre));
  const nuevas = COMPOSICIONES_BASE.filter(c=>!existentes.has(c.nombre));
  if(!nuevas.length){ showToast('Las composiciones base ya están cargadas'); return; }
  if(!await confirmModal(`¿Cargar ${nuevas.length} composición${nuevas.length!==1?'es':''} base (Upgrade + Eventos)? Después las podés editar.`)) return;
  nuevas.forEach(c=>recetasData.push({ nombre:c.nombre, ings:c.ings.map(g=>({prod:g.prod, qty:g.qty})), img:'' }));
  fbSave('recetasData', recetasData);
  renderRecetas();
  showToast(`✅ ${nuevas.length} composiciones cargadas`);
}

// ── Catálogo base de arreglos fijos del hotel (por zona) ──────────────────────
// Los ingredientes con "/" son opciones (se usa la que haya en stock). Las
// fracciones = qué parte de una vara lleva cada unidad (ej. 1/3 = una vara
// rinde para 3 arreglos). Cada ingrediente lleva su unidad: V() = varas,
// P() = paquetes (se convierten a varas con las varas por paquete de Compras).
const _MAG='Magnolia / Níspero', _SLN='Solidago / Naviza',
      _SVM='San Vicente / Margarita', _CA2='Conejito / Alhelí';
const V=(prod,qty)=>({prod,qty});
const P=(prod,qty)=>({prod,qty,unidad:'paq'});
const COMPOSICIONES_HOTEL_BASE = [
  { zona:'Lobby de Alvear', ings:[P('Monstera',4),P(_MAG,2),P('Laurentino',1),P('Azarero',3),P('Eucalipto',1),P(_SLN,1)] },
  { zona:'Recepción Alvear', ings:[V('Laurentino',2),V('Azarero',2),V('Pino',3),V('Lilium',1),V('Astromelia',5),V(_SVM,5),V(_CA2,3),V('Repollo',1),V(_SLN,1)] },
  { zona:'Mesada Piano', ings:[V('Laurentino',3),V('Azarero',4),V('Pino',3),V('Lilium',2),V('Astromelia',5),V(_SVM,5),V(_CA2,5),V('Repollo',1),V(_SLN,2)] },
  { zona:'Mesitas Piano', ings:[P('Limonium',2)] },
  { zona:'Biblioteca', ings:[V('Laurentino',3),V('Azarero Disciplinado',3),V('Buxus',6),V('Ligustro',6)] },
  { zona:'Salón Privado', ings:[V('Laurentino',2),V('Azarero Disciplinado',2),V('Buxus',4),V('Ligustro',4)] },
  { zona:'Mesa ratona Alvear', ings:[V('Laurentino',2),V('Azarero Disciplinado',1),V('Azarero',1),V('Pino',1)] },
  { zona:'Mesada Vinoteca (c/u)', ings:[V('Laurentino',2),V('Azarero Disciplinado',1),V('Azarero',1),V('Buxus',1),V('Pino',1)] },
  { zona:'Chimenea Vinoteca', ings:[V('Laurentino',4),V('Azarero',4),V('Pino',3)] },
  { zona:'Copón Duhau', ings:[P('Monstera',4)] },
  { zona:'Elefante', ings:[V('Monstera',4),P('Laurentino',1),P('Azarero',1),V('Pino',5)] },
  { zona:'Spa · Recepción', ings:[V('Monstera',3)] },
  { zona:'Spa · Jacuzzi', ings:[V('Monstera',3)] },
  { zona:'Spa · Foyer', ings:[V('Laurentino',3),V('Azarero',3),V('Pino',2),V('Monstera',2)] },
  { zona:'Spa · Bochitas (20)', ings:[P('Pino',1/2)] },
  { zona:'Baños Duhau', ings:[V('Monstera',2)] },
  { zona:'Baños Duhau · Bochitas (6)', ings:[P('Limonium',1/2)] },
  { zona:'Lobby de Posadas', ings:[P('Limonium',10)] },
  { zona:'Recepción Posadas y mesita (c/u)', ings:[V('Laurentino',2),V('Azarero',2),V('Buxus',1),V('Pino',1)] },
  { zona:'Baño Paseo de las Artes · Bochitas (7)', ings:[P('Limonium',1/2)] },
  { zona:'Gioia mesitas (c/u)', ings:[V('Azarero nana',3)] },
  { zona:'Gioia Arbolitos (c/u)', ings:[P('Sauce',3),V('Laurentino',7),V('Azarero',7),V('Pino',6),V('Limón',7)] },
  { zona:'Copón Gioia', ings:[V('Laurentino',5),V('Azarero',6),V('Pino',4),V('Monstera',4)] },
  { zona:'Totems Meetings (c/u)', ings:[V('Monstera',2)] },
  { zona:'Meetings bochitas (c/u)', ings:[V('Laurentino',1/3),V('Azarero',1/3),V('Pino',1/6)] },
  { zona:'Meetings baños · Bochitas (9)', ings:[P('Limonium',1/2)] },
  { zona:'Tilo', ings:[V('Azarero',2),V('Laurentino',2),V('Pino',1),V('Conejito',3),V('Astromelia',3),V(_SVM,5)] },
  { zona:'Mesada Posadas (c/u)', ings:[V('Laurentino',4),V('Azarero',3),V('Pino',2)] },
  { zona:'Totems Posadas (c/u)', ings:[V('Laurentino',4),V('Azarero',3),V('Pino',2)] },
  { zona:'Bochitas Posadas (c/u)', ings:[V('Laurentino',1/2),V('Azarero',1/2),V('Pino',1/6)] },
];

async function seedComposicionesHotelBase(){
  if(userRole!=='gerencia'){ showToast('⛔ Solo gerencia'); return; }
  const n = COMPOSICIONES_HOTEL_BASE.length;
  if(!await confirmModal(`¿Cargar / actualizar las ${n} composiciones base de arreglos del hotel?\n\nSe (re)cargan las zonas del catálogo con las unidades correctas (paquetes o varas). Tus zonas propias no se tocan.`)) return;
  COMPOSICIONES_HOTEL_BASE.forEach(c=>{
    arreglosComposicion[c.zona] = c.ings.map(g=>({ prod:g.prod, qty:g.qty, ...(g.unidad==='paq'?{unidad:'paq'}:{}) }));
  });
  _arreglosComposicionLoaded = true; // ya hay datos en memoria: habilita edición/guardado
  _saveArreglosComposicion();
  renderComposicionesHotel();
  if(document.getElementById('page-rentabilidad-eventos')?.classList.contains('active')) renderRentabilidadHotel();
  showToast(`✅ ${n} composiciones del hotel cargadas`);
}

// ── renderRecetas ─────────────────────────────────────────────────────────────
function renderRecetas(){
  const grid = document.getElementById('recetas-grid');
  if(!grid) return;
  grid.innerHTML = recetasData.map((r,i)=>`
    <div class="receta-card">
      ${r.img ? `<img src="${r.img}" alt="${esc(r.nombre)}" style="width:100%;height:140px;object-fit:cover;border-radius:4px;margin-bottom:12px">` : ''}
      <div class="receta-header">
        <div class="receta-nombre">${ARREGLOS_BASE.includes(r.nombre)?arregloEmoji(r.nombre)+' ':''}<b>${esc(r.nombre)}</b></div>
        <div style="display:flex;gap:6px">
          <button class="btn-icon" onclick="openRecetaModal(${i})" title="Editar">✏️</button>
          <button class="btn-icon" style="color:var(--red-alert)" onclick="delReceta(${i})" title="Eliminar">✕</button>
        </div>
      </div>
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:8px;font-weight:600">Ingredientes por unidad</div>
      <div class="receta-ingredientes">
        ${r.ings.map(ing=>`
          <div class="receta-ing-row">
            <span style="font-size:18px;line-height:1">🌿</span>
            <span style="flex:1;font-weight:500">${esc(ing.prod)}</span>
            <span style="background:#F0EEE8;border-radius:4px;padding:2px 8px;font-size:12px;font-weight:600">${_fmtCant(ing.qty)} vara${(+ing.qty)===1?'':'s'}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

// ── Solapas de la página Composiciones: Eventos (recetasData) / Hotel (checklist) ──
let compTab = 'eventos';
function setCompTab(t){
  compTab = t;
  document.getElementById('comp-tab-eventos')?.classList.toggle('active', t==='eventos');
  document.getElementById('comp-tab-hotel')?.classList.toggle('active', t==='hotel');
  const secE = document.getElementById('comp-sec-eventos');
  const secH = document.getElementById('comp-sec-hotel');
  const btns = document.getElementById('comp-header-btns');
  if(secE) secE.style.display = t==='eventos' ? '' : 'none';
  if(secH) secH.style.display = t==='hotel' ? '' : 'none';
  // Los botones "+ Nueva composición" y "Cargar catálogo base" son de eventos.
  if(btns) btns.style.display = t==='eventos' ? '' : 'none';
  const hotelBtns = document.getElementById('comp-hotel-btns');
  if(hotelBtns) hotelBtns.style.display = t==='hotel' ? 'flex' : 'none';
  if(t==='hotel') renderComposicionesHotel(); else renderRecetas();
}

// Composición de los arreglos fijos del hotel, tomados de las zonas del checklist.
// Reutiliza arreglosComposicion (el mismo store que usa Rentabilidad Hotel).
function renderComposicionesHotel(){
  const grid = document.getElementById('recetas-hotel-grid');
  if(!grid) return;

  // Solo se listan las zonas que YA tienen composición cargada (así no se
  // llena de zonas vacías). Para cargar una zona sin composición se usa el
  // selector "+ Definir composición".
  const conComp = Object.keys(arreglosComposicion||{})
    .filter(z => (arreglosComposicion[z]||[]).length)
    .sort((a,b)=>a.localeCompare(b,'es'));

  // Barra: agregar composición a una zona del checklist o a un nombre nuevo.
  const addBar = document.getElementById('comp-hotel-addbar');
  if(addBar){
    const sinComp = getAreaUsoZonas()
      .filter(z => !(arreglosComposicion[z]||[]).length)
      .sort((a,b)=>a.localeCompare(b,'es'));
    addBar.innerHTML = `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <select class="form-input" style="min-width:260px" onchange="compHotelAdd(this)">
        <option value="">+ Definir composición de una zona…</option>
        ${sinComp.length ? '<optgroup label="Zonas del checklist">'+sinComp.map(z=>`<option value="${esc(z)}">${esc(z)}</option>`).join('')+'</optgroup>' : ''}
        <option value="__otra__">✏️ Otra zona (escribir nombre)…</option>
      </select>
    </div>`;
  }

  if(!conComp.length){
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--mid-gray)">No hay arreglos del hotel con composición todavía. Usá «+ Definir composición» o «📋 Cargar catálogo base».</div>';
    return;
  }
  grid.innerHTML = conComp.map(zona=>{
    const ings = arreglosComposicion[zona] || [];
    const costo = Math.round(calcCostoArreglo(zona));
    const zEsc = esc(zona).replace(/'/g,"\\'");
    return `<div class="receta-card">
      <div class="receta-header">
        <div class="receta-nombre">📍 <b>${esc(zona)}</b></div>
        <div style="display:flex;gap:6px">
          <button class="btn-icon" onclick="openArregloComposicion('${zEsc}')" title="Editar composición">✏️</button>
          <button class="btn-icon" style="color:var(--red-alert)" onclick="delArregloComposicion('${zEsc}')" title="Eliminar composición">✕</button>
        </div>
      </div>
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray);margin:8px 0;font-weight:600">Ingredientes por unidad · costo $${costo.toLocaleString('es-AR')}</div>
      <div class="receta-ingredientes">
        ${ings.map(ing=>{
          const eqVaras = ing.unidad==='paq' ? _ingVaras(ing) : 0;
          return `<div class="receta-ing-row">
          <span style="font-size:18px;line-height:1">🌿</span>
          <span style="flex:1;font-weight:500">${esc(ing.prod)}</span>
          <span style="background:#F0EEE8;border-radius:4px;padding:2px 8px;font-size:12px;font-weight:600" title="${ing.unidad==='paq'?(eqVaras?_fmtCant(eqVaras)+' varas':'cargá varas por paquete en Compras'):''}">${_fmtIngUnidad(ing)}${ing.unidad==='paq'&&eqVaras?` · ${_fmtCant(eqVaras)}v`:''}</span>
        </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

async function compHotelAdd(sel){
  const v = sel.value;
  sel.value = '';
  if(!v) return;
  if(v === '__otra__'){
    const nom = await promptModal('Nombre de la zona / arreglo:', { title: 'Nueva zona del hotel' });
    if(nom && nom.trim()) openArregloComposicion(nom.trim());
  } else {
    openArregloComposicion(v);
  }
}

async function delArregloComposicion(zona){
  if(userRole!=='gerencia'){ showToast('⛔ Solo gerencia'); return; }
  if(!_arreglosComposicionLoaded){
    showToast('⏳ Las composiciones todavía se están cargando. Esperá unos segundos e intentá de nuevo.');
    return;
  }
  if(!await confirmModal(`¿Eliminar la composición de "${zona}"?`)) return;
  delete arreglosComposicion[zona];
  _saveArreglosComposicion();
  renderComposicionesHotel();
  if(document.getElementById('page-rentabilidad-eventos')?.classList.contains('active')) renderRentabilidadHotel();
  showToast('🗑️ Composición eliminada');
}

function previewRecetaImg(input){
  const file = input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const data = e.target.result;
    document.getElementById('rec-img-data').value = data;
    const preview = document.getElementById('rec-img-preview');
    preview.src = data; preview.style.display = 'block';
    document.getElementById('rec-img-clear').style.display = 'inline-block';
  };
  reader.readAsDataURL(file);
}

function clearRecetaImg(){
  document.getElementById('rec-img-data').value = '';
  document.getElementById('rec-img-preview').src = '';
  document.getElementById('rec-img-preview').style.display = 'none';
  document.getElementById('rec-img-clear').style.display = 'none';
  document.getElementById('rec-img-file').value = '';
}

function arregloEmoji(n){
  return {Bochita:'🫙',Cuenco:'🥣',Pecera:'🐟',Paila:'🪔',Buffet:'🌿'}[n]||'🌸';
}

// ── Modal receta ──────────────────────────────────────────────────────────────
function openRecetaModal(i){
  document.getElementById('rec-idx').value = i;
  const isNew = i===-1;
  document.getElementById('receta-modal-title').textContent = isNew ? 'Nueva Composición' : 'Editar Composición';
  const ingsList = document.getElementById('rec-ings-list');
  const nombreInp = document.getElementById('rec-nombre');
  const dl = document.getElementById('rec-flor-list');
  if(dl) dl.innerHTML = getAllInsumos().map(n=>`<option value="${esc(n)}">`).join('');

  if(!isNew){
    const r = recetasData[i];
    nombreInp.value = r.nombre || '';
    ingsList.innerHTML = r.ings.map((ing,ii)=>recetaIngRowHTML(ing.prod, ing.qty, ii)).join('');
  } else {
    nombreInp.value = '';
    ingsList.innerHTML = recetaIngRowHTML('',1,0);
  }
  // restore image
  const imgData = isNew ? '' : (recetasData[i]?.img||'');
  document.getElementById('rec-img-data').value = imgData;
  const preview = document.getElementById('rec-img-preview');
  const clearBtn = document.getElementById('rec-img-clear');
  if(imgData){ preview.src=imgData; preview.style.display='block'; clearBtn.style.display='inline-block'; }
  else { preview.src=''; preview.style.display='none'; clearBtn.style.display='none'; }
  document.getElementById('receta-modal').classList.add('open');
}

function recetaIngRowHTML(prod, qty, ii){
  return `<div class="ev-arreglo-row" id="rec-ing-${ii}">
    <input list="rec-flor-list" value="${esc(prod||'')}" placeholder="Flor / follaje (podés poner opciones: A / B / C)" style="flex:2;min-width:0;border:1px solid #E4E2DC;border-radius:4px;padding:5px 8px;font-family:'DM Sans',sans-serif;font-size:12.5px;outline:none">
    <input type="text" value="${esc(_fmtCant(qty||1))}" placeholder="Cant." title="Varas por unidad. Podés poner fracciones: 1/3, 1/2…" style="width:56px;border:1px solid #E4E2DC;border-radius:4px;padding:5px 6px;font-size:12.5px;text-align:center;outline:none;font-family:'DM Sans',sans-serif">
    <button type="button" class="btn-icon" style="color:var(--red-alert)" onclick="this.closest('.ev-arreglo-row').remove()">✕</button>
  </div>`;
}

function addRecetaIngRow(){
  const list = document.getElementById('rec-ings-list');
  const idx = list.children.length;
  const div = document.createElement('div');
  div.innerHTML = recetaIngRowHTML('',1,idx);
  list.appendChild(div.firstElementChild);
}

function saveReceta(){
  const nombre = document.getElementById('rec-nombre').value.trim();
  if(!nombre){ showToast('Ingresá el nombre del arreglo.','error'); return; }

  const rows = document.getElementById('rec-ings-list').querySelectorAll('.ev-arreglo-row');
  const ings = [];
  rows.forEach(row=>{
    const prodInp = row.querySelector('input[list]');
    const qtyInp  = row.querySelector('input[type=text]:not([list])');
    const prod = prodInp?.value.trim();
    if(prod) ings.push({ prod, qty: _parseCant(qtyInp?.value) || 1 });
  });
  if(ings.length===0){ showToast('Agregá al menos un ingrediente.','error'); return; }

  const idx = +document.getElementById('rec-idx').value;
  const receta = { nombre, ings, img: document.getElementById('rec-img-data').value||'' };
  if(idx===-1) recetasData.push(receta);
  else recetasData[idx] = receta;
  closeModal('receta-modal');
  fbSave('recetasData', recetasData);
  renderRecetas();
}

async function delReceta(i){
  if(!await confirmModal('¿Eliminar esta receta?')) return;
  recetasData.splice(i,1);
  fbSave('recetasData', recetasData);
  renderRecetas();
}

// ── Event modal: arreglos rows ────────────────────────────────────────────────
let evArreglosRows = [];
let evZonasSelected = [];

const EV_ZONAS = [
  'Piano Nobile','Privado Piano','Salon Privado','Biblioteca','Vinoteca',
  'Duhau','Duhau Privado','Terrazas Duhau','Paseo de las Artes/Floreria',
  'Grand Foyer','Gingko I','Gingko II','Gingko III','Tilo',
  'Nogal y Ceibo','Gioia','Terrazas Gioia','Foyer Posadas','Posadas I','Posadas II'
];

function evZonasLabel(ev){
  return (ev.zonas?.length ? ev.zonas : ev.salon ? [ev.salon] : []).join(', ') || '—';
}

function renderZonasPicker(){
  const c = document.getElementById('ev-zonas-picker');
  if(!c) return;
  c.innerHTML = EV_ZONAS.map(z => {
    const sel = evZonasSelected.includes(z);
    return `<button type="button" onclick="toggleEvZona('${z}')"
      style="padding:4px 11px;border-radius:14px;font-size:12px;border:1.5px solid ${sel?'var(--green-ok)':'var(--light-gray)'};background:${sel?'var(--green-ok)':'var(--warm-white)'};color:${sel?'#fff':'var(--charcoal)'};cursor:pointer;transition:all .15s;white-space:nowrap"
    >${sel?'✓ ':''}${z}</button>`;
  }).join('');
}

function toggleEvZona(z){
  const idx = evZonasSelected.indexOf(z);
  if(idx >= 0) evZonasSelected.splice(idx,1);
  else evZonasSelected.push(z);
  renderZonasPicker();
}

// Los handlers de las filas de arreglos deben ir por funciones exportadas: el
// array evArreglosRows es interno del módulo y, minificado, su nombre cambia,
// así que un onchange inline "evArreglosRows[i]=..." rompía (ReferenceError) y
// el arreglo elegido nunca se guardaba en el evento.
function evSetArreglo(idx, val){ if(evArreglosRows[idx]) evArreglosRows[idx].arreglo = val; previewStockImpact(); }
function evSetArregloQty(idx, val){ if(evArreglosRows[idx]) evArreglosRows[idx].qty = +val || 0; previewStockImpact(); }
function evRemoveArregloRow(idx){
  const el = document.getElementById('ev-arr-row-'+idx);
  if(el) el.remove();
  if(evArreglosRows[idx]) evArreglosRows[idx] = {arreglo:'', qty:0};
  previewStockImpact();
}

function addEvArregloRow(){
  const list = document.getElementById('ev-arreglos-list');
  const idx = evArreglosRows.length;
  evArreglosRows.push({arreglo:'', qty:1});
  const arregloOpts = [...new Set(recetasData.map(r=>r.nombre))]
    .map(n=>`<option value="${esc(n)}">${arregloEmoji(n)} ${esc(n)}</option>`).join('');

  const div = document.createElement('div');
  div.className = 'ev-arreglo-row';
  div.id = 'ev-arr-row-'+idx;
  div.innerHTML = `
    <select onchange="evSetArreglo(${idx},this.value)" style="flex:2;border:1px solid #E4E2DC;border-radius:4px;padding:5px 8px;font-family:'DM Sans',sans-serif;font-size:12.5px;outline:none">
      <option value="">— Tipo de arreglo —</option>${arregloOpts}
    </select>
    <span style="font-size:12px;color:var(--mid-gray)">×</span>
    <input type="number" min="1" value="1" placeholder="Cant." onchange="evSetArregloQty(${idx},this.value)" style="width:60px;border:1px solid #E4E2DC;border-radius:4px;padding:5px 6px;font-size:12.5px;text-align:center;outline:none;font-family:'DM Sans',sans-serif">
    <button type="button" class="btn-icon" style="color:var(--red-alert)" onclick="evRemoveArregloRow(${idx})">✕</button>`;
  list.appendChild(div);
}

function previewStockImpact(){
  const preview = document.getElementById('ev-stock-preview');
  if(!preview) return;
  const impact = calcStockImpact(evArreglosRows);
  if(Object.keys(impact).length===0){ preview.innerHTML=''; return; }

  const lines = Object.entries(impact).map(([prod,qty])=>{
    const stockItem = stockData.find(s=>s.prod.toLowerCase()===prod.toLowerCase());
    const actual = stockItem ? stockItem.actual : '?';
    const after = stockItem ? +(stockItem.actual - qty).toFixed(1) : '?';
    const ok = typeof after==='number' && after>=0;
    return `<span style="margin-right:10px">${ok?'✅':'⚠️'} <b>${esc(prod)}</b>: ${actual} → ${after>=0?after:'<span style="color:#B03020">'+after+'</span>'}${ok?'':' (insuficiente)'}</span>`;
  });
  const hasShortage = Object.entries(impact).some(([prod,qty])=>{
    const s = stockData.find(x=>x.prod.toLowerCase()===prod.toLowerCase());
    return s && s.actual < qty;
  });
  preview.innerHTML = `<div class="${hasShortage?'stock-impact':'stock-impact ok'}">
    <div style="font-weight:600;margin-bottom:6px">${hasShortage?'⚠️ Stock insuficiente para algunos ingredientes':'✅ Stock suficiente para todos los arreglos'}</div>
    <div style="line-height:2">${lines.join('')}</div>
  </div>`;
}

function calcStockImpact(arrRows){
  const impact = {};
  arrRows.forEach(row=>{
    if(!row.arreglo || !row.qty) return;
    const receta = recetasData.find(r=>r.nombre===row.arreglo);
    if(!receta) return;
    receta.ings.forEach(ing=>{
      impact[ing.prod] = (impact[ing.prod]||0) + ing.qty * row.qty;
    });
  });
  return impact;
}

function descontarStockEvento(arrRows){
  const impact = calcStockImpact(arrRows);
  const descuentos = [];
  Object.entries(impact).forEach(([prod,qty])=>{
    stockData.forEach(s=>{
      if(s.prod.toLowerCase()===prod.toLowerCase()){
        const antes = s.actual;
        s.actual = +Math.max(0, s.actual - qty).toFixed(1);
        descuentos.push(`${prod}: ${antes} → ${s.actual}`);
      }
    });
  });
  return descuentos;
}

// ── saveEvent ─────────────────────────────────────────────────────────────────
// ── Event image helpers ───────────────────────────────────────────────────────
function previewEventImg(input){
  const file = input.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const data = e.target.result;
    document.getElementById('ev-img-data').value = data;
    const preview = document.getElementById('ev-img-preview');
    preview.src = data; preview.style.display = 'block';
    document.getElementById('ev-img-clear').style.display = 'inline-block';
  };
  reader.readAsDataURL(file);
}

function clearEventImg(){
  document.getElementById('ev-img-data').value = '';
  document.getElementById('ev-img-preview').src = '';
  document.getElementById('ev-img-preview').style.display = 'none';
  document.getElementById('ev-img-clear').style.display = 'none';
  document.getElementById('ev-img-file').value = '';
}

// ── Evento detail modal ───────────────────────────────────────────────────────
function openEventoDetail(i){
  const ev = eventosData[i]; if(!ev) return;

  // Image
  const imgWrap = document.getElementById('evento-detail-img-wrap');
  const imgEl = document.getElementById('evento-detail-img');
  if(ev.img){ imgEl.src = ev.img; imgWrap.style.display='block'; }
  else { imgWrap.style.display='none'; imgEl.src=''; }

  // Header
  document.getElementById('evento-detail-nombre').textContent = ev.nombre || '';
  document.getElementById('evento-detail-tipo').textContent = ev.tipo || '';

  // Estado badge
  const estadoColors = {
    'Pedidos Pendientes':  'background:#F5F0E8;color:#8B7355',
    'En Proceso': 'background:#E8F0F8;color:#2C5A80',
    'Pendiente de Colocacion':   'background:#FFF3E0;color:#E65100',
    'Pendiente de Retiro':   'background:#EFE8F8;color:#5A3E8A',
    'Confirmado': 'background:#E8F5E9;color:#2E7D32',
    'Pedidos Finalizados':      'background:#F3E5F5;color:#6A1B9A',
  };
  const estadoEl = document.getElementById('evento-detail-estado');
  estadoEl.textContent = ev.estado || '';
  estadoEl.style.cssText = (estadoColors[ev.estado]||'background:#eee;color:#666') + ';padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.5px';

  // Body grid fields
  const armadoTxt = ev.asignado ? ev.asignado + (ev.inicio && ev.fin ? ` (${ev.inicio}–${ev.fin})` : ev.inicio ? ` (desde ${ev.inicio})` : '') : null;
  const colocTxt  = ev.colocacionAsignado ? ev.colocacionAsignado + (ev.colocacionInicio && ev.colocacionFin ? ` (${ev.colocacionInicio}–${ev.colocacionFin})` : ev.colocacionInicio ? ` (desde ${ev.colocacionInicio})` : '') : null;
  const retiroTxt = ev.retiroAsignado ? ev.retiroAsignado + (ev.retiroInicio && ev.retiroFin ? ` (${ev.retiroInicio}–${ev.retiroFin})` : ev.retiroInicio ? ` (desde ${ev.retiroInicio})` : '') : null;
  // Cruce gasto vs cobro: total comprado asociado a este evento y precio cobrado
  const _gastoEv = gastoComprasEvento(ev.id);
  const _cobroEv = parseMoney(ev.precio);
  const fields = [
    ev.organizador ? ['Organizador', ev.organizador] : null,
    ev.fecha ? ['Fecha', fmtDate(ev.fecha) + (ev.hora ? ' · ' + ev.hora : '') + (etiquetaDiaRelativa(ev.fecha) ? ' · ' + etiquetaDiaRelativa(ev.fecha) : '')] : null,
    evZonasLabel(ev) !== '—' ? ['Salón / Zona', evZonasLabel(ev)] : null,
    ev.pax   ? ['Pax', ev.pax + ' personas'] : null,
    ev.precio && ev.precio !== 'A confirmar' ? ['Precio', ev.precio] : null,
    _gastoEv > 0 ? ['💸 Gastado en compras', '$' + _gastoEv.toLocaleString('es-AR')] : null,
    (_gastoEv > 0 && _cobroEv > 0) ? ['📊 Resultado (cobro − compras)', '$' + (_cobroEv - _gastoEv).toLocaleString('es-AR')] : null,
    armadoTxt ? ['🔨 Armado', armadoTxt] : null,
    colocTxt ? ['📍 Colocación', colocTxt] : null,
    retiroTxt ? ['🔄 Retiro', retiroTxt] : null,
  ].filter(Boolean);
  document.getElementById('evento-detail-body').innerHTML = fields.map(([label, val]) =>
    `<div><div class="detail-field-label">${label}</div><div class="detail-field-value">${esc(String(val))}</div></div>`
  ).join('');

  // Notas
  const notasWrap = document.getElementById('evento-detail-notas-wrap');
  if(ev.notas && ev.notas.trim()){
    document.getElementById('evento-detail-notas').textContent = ev.notas;
    notasWrap.style.display = 'block';
  } else { notasWrap.style.display = 'none'; }

  // Arreglos
  const arreglosWrap = document.getElementById('evento-detail-arreglos-wrap');
  if(ev.arreglos && ev.arreglos.length){
    document.getElementById('evento-detail-arreglos').innerHTML = ev.arreglos.map(a=>{
      const receta = recetasData.find(r=>r.nombre===a.arreglo);
      const ings = receta?.ings || [];
      const ingsHTML = ings.length
        ? `<div style="margin-top:8px;background:var(--cream);border-radius:6px;padding:10px 12px">
            <div style="display:grid;grid-template-columns:1fr auto auto;gap:4px 12px;align-items:center">
              <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:600">Ingrediente</div>
              <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:600;text-align:center">× unidad</div>
              <div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:#2E7D32;font-weight:600;text-align:center">Total cámara</div>
              ${ings.map(ing=>`
                <div style="font-size:12px;color:var(--charcoal)">${esc(ing.prod)}</div>
                <div style="font-size:12px;text-align:center;color:var(--mid-gray)">${ing.qty} ud${ing.qty>1?'s':''}</div>
                <div style="font-size:13px;font-weight:700;text-align:center;color:#2E7D32">${ing.qty * a.qty} ud${(ing.qty*a.qty)>1?'s':''}</div>
              `).join('')}
            </div>
          </div>`
        : '<div style="font-size:11px;color:var(--mid-gray);margin-top:4px;font-style:italic">Sin receta cargada</div>';
      return `<div style="padding:10px 0;border-bottom:1px solid var(--light-gray)">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:16px">🌸</span>
          <span style="flex:1;font-size:13px;font-weight:600;color:var(--charcoal)">${esc(a.arreglo)}</span>
          <span style="background:var(--cream);border-radius:4px;padding:2px 10px;font-size:12px;font-weight:600">${a.qty} ud${a.qty>1?'s':''}</span>
        </div>
        ${ingsHTML}
      </div>`;
    }).join('');
    arreglosWrap.style.display = 'block';
  } else { arreglosWrap.style.display = 'none'; }

  // Edit button — solo gerencia/comercial puede editar; floristas solo visualizan
  const editBtn = document.getElementById('evento-detail-edit-btn');
  if(editBtn){
    editBtn.style.display = (userRole==='gerencia'||userRole==='comercial') ? '' : 'none';
    editBtn.onclick = () => {
      closeModal('evento-detail-modal');
      openEventModal(i);
    };
  }

  document.getElementById('evento-detail-modal').classList.add('open');
}

// ── Popup automático de eventos del día (al abrir la app) ──
let _eventosDelDiaShown = false;
function mostrarEventosDelDia(retry = 0){
  if(_eventosDelDiaShown) return;
  // Roles que reciben el aviso: floristas (con evento asignado), gerencia, operario y comercial
  if(!['florista','gerencia','operario','comercial'].includes(userRole)) return;
  // Esperar a que Firebase cargue los eventos
  if((!eventosData || !eventosData.length) && retry < 5){
    setTimeout(()=>mostrarEventosDelDia(retry+1), 1500);
    return;
  }
  const isFlor = userRole === 'florista';
  const hoy = (eventosData||[]).filter(ev =>
    ev.fecha === TODAY_ISO &&
    ev.estado !== 'Pedidos Finalizados' &&
    (!isFlor || ev.asignado === floristaNombre || ev.colocacionAsignado === floristaNombre || ev.retiroAsignado === floristaNombre)
  );
  if(!hoy.length) return; // floristas sin evento asignado hoy: no molestar
  _eventosDelDiaShown = true;

  const estadoBadge = est => {
    const map = {
      'Pedidos Pendientes':'background:#F5F0E8;color:#8B7355',
      'En Proceso':'background:#E8F0F8;color:#2C5A80',
      'Pendiente de Colocacion':'background:#FFF3E0;color:#E65100',
      'Confirmado':'background:#E8F5E9;color:#2E7D32'
    };
    return `<span style="${map[est]||'background:#eee;color:#666'};padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;white-space:nowrap">${esc(est||'')}</span>`;
  };

  const sorted = [...hoy].sort((a,b)=>(a.hora||'').localeCompare(b.hora||''));
  let ov = document.getElementById('eventos-dia-modal');
  if(!ov){ ov = document.createElement('div'); ov.id='eventos-dia-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="modal" style="max-width:540px">
    <div class="modal-header"><h2>🎉 Eventos de hoy</h2><button class="modal-close" onclick="closeModal('eventos-dia-modal')">✕</button></div>
    <div style="font-size:12.5px;color:var(--mid-gray);margin-bottom:16px">${isFlor?'Tus eventos asignados para hoy. Tocá uno para ver el detalle.':'Eventos del día — priorizá la colocación de los que ya estén armados.'}</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${sorted.map(ev=>{ const i = eventosData.indexOf(ev); return `
        <div onclick="closeModal('eventos-dia-modal');openEventoDetail(${i})" style="cursor:pointer;border:1px solid var(--light-gray);border-radius:10px;padding:14px 16px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;transition:border-color .2s,box-shadow .2s" onmouseover="this.style.borderColor='#1A1A1A';this.style.boxShadow='var(--shadow-sm)'" onmouseout="this.style.borderColor='var(--light-gray)';this.style.boxShadow='none'">
          <div style="min-width:0">
            <div style="font-weight:600;font-size:14px;color:var(--charcoal)">${esc(ev.nombre||'')}</div>
            <div style="font-size:12px;color:var(--mid-gray);margin-top:3px">${esc(ev.tipo||'')}${ev.salon?' · '+esc(ev.salon):''}${ev.hora?' · '+esc(ev.hora)+'h':''}${(!isFlor&&ev.asignado)?' · 👤 '+esc(ev.asignado):''}</div>
          </div>
          ${estadoBadge(ev.estado)}
        </div>`; }).join('')}
    </div>
    <div class="modal-footer"><button class="btn-primary" onclick="closeModal('eventos-dia-modal');navigate('${isFlor?'checklist':'eventos-comercial'}')">Ver todos</button></div>
  </div>`;
  ov.classList.add('open');
}

function saveEvent(){
  const nombre=document.getElementById('ev-nombre').value.trim();
  if(!nombre) return;
  const ev={
    nombre,
    id: (eventosData[+document.getElementById('ev-idx').value]?.id) || genEventoId(),
    organizador:document.getElementById('ev-organizador')?.value.trim()||'',
    tipo:document.getElementById('ev-tipo').value||'Social',
    fecha:document.getElementById('ev-fecha').value,
    hora:document.getElementById('ev-hora').value||'',
    zonas: [...evZonasSelected],
    salon: evZonasSelected.join(', '),
    pax:+document.getElementById('ev-pax').value||0,
    presupuesto:+document.getElementById('ev-presupuesto')?.value||0,
    costoEstimado:+document.getElementById('ev-costo-est')?.value||0,
    notas:document.getElementById('ev-notas').value,
    precio:document.getElementById('ev-precio').value||'A confirmar',
    estado:document.getElementById('ev-estado').value,
    asignado:document.getElementById('ev-asignado').value||'',
    colocacionAsignado:document.getElementById('ev-colocacion')?.value||'',
    colocacionFecha:document.getElementById('ev-colocacion-fecha')?.value||'',
    colocacionHora:document.getElementById('ev-colocacion-hora')?.value||'',
    retiroAsignado:document.getElementById('ev-retiro')?.value||'',
    retiroFecha:document.getElementById('ev-retiro-fecha')?.value||'',
    retiroHora:document.getElementById('ev-retiro-hora')?.value||'',
    arreglos: evArreglosRows.filter(r=>r.arreglo&&r.qty>0),
    img: document.getElementById('ev-img-data').value||'',
    inicio: eventosData[+document.getElementById('ev-idx').value]?.inicio || '',
    fin: eventosData[+document.getElementById('ev-idx').value]?.fin || '',
    colocacionInicio: eventosData[+document.getElementById('ev-idx').value]?.colocacionInicio || '',
    colocacionFin: eventosData[+document.getElementById('ev-idx').value]?.colocacionFin || '',
    retiroInicio: eventosData[+document.getElementById('ev-idx').value]?.retiroInicio || '',
    retiroFin: eventosData[+document.getElementById('ev-idx').value]?.retiroFin || '',
    // Flags de "ya se avisó al florista" — se preservan para no re-notificar al editar.
    colocacionAvisada: eventosData[+document.getElementById('ev-idx').value]?.colocacionAvisada || '',
    retiroAvisada: eventosData[+document.getElementById('ev-idx').value]?.retiroAvisada || ''
  };

  // Descontar stock si el evento se confirma directamente
  if(ev.estado==='Confirmado' || ev.estado==='Pedidos Finalizados'){
    const prevEstado = +document.getElementById('ev-idx').value >= 0
      ? eventosData[+document.getElementById('ev-idx').value]?.estado
      : null;
    const wasConfirmed = prevEstado==='Confirmado'||prevEstado==='Pedidos Finalizados';
    if(!wasConfirmed && ev.arreglos.length > 0){
      const descuentos = descontarStockEvento(ev.arreglos);
      if(descuentos.length>0){
        showToast('📦 Stock descontado: '+descuentos.slice(0,3).join(' · ')+(descuentos.length>3?'…':''));
        if(document.getElementById('page-stock').classList.contains('active')) renderStock();
      }
    }
  }

  const idx=+document.getElementById('ev-idx').value;
  const prevAsignadoEv = idx >= 0 ? (eventosData[idx]?.asignado || '') : '';
  const prevColocEv = idx >= 0 ? (eventosData[idx]?.colocacionAsignado || '') : '';
  const prevRetiroEv = idx >= 0 ? (eventosData[idx]?.retiroAsignado || '') : '';
  if(idx===-1) eventosData.push(ev);
  else eventosData[idx]=ev;

  closeModal('event-modal');
  fbSave('eventosData', eventosData);
  if(ev.asignado && ev.asignado !== prevAsignadoEv){
    notificarAsignacion(ev.asignado, '🎉 Nuevo evento asignado (armado)', `Se te asignó el armado de "${ev.nombre}"${ev.fecha ? ' · ' + fmtDate(ev.fecha) : ''}`);
  }
  if(ev.colocacionAsignado && ev.colocacionAsignado !== prevColocEv){
    notificarAsignacion(ev.colocacionAsignado, '📍 Colocación asignada', `Te asignaron la colocación de "${ev.nombre}"${ev.fecha ? ' · ' + fmtDate(ev.fecha) : ''}`);
  }
  if(ev.retiroAsignado && ev.retiroAsignado !== prevRetiroEv){
    notificarAsignacion(ev.retiroAsignado, '🔄 Retiro asignado', `Te asignaron el retiro de "${ev.nombre}"${ev.fecha ? ' · ' + fmtDate(ev.fecha) : ''} — al finalizar el evento`);
  }
  syncEventosToKanban();
  fbSave('kanbanData', kanbanData);
  renderEventos();
  renderHome();
  if(document.getElementById('page-eventos-maison').classList.contains('active')) renderKanban();
}

// ── openEventModal ────────────────────────────────────────────────────────────
function openEventModal(i){
  const isNew = i === -1;
  document.getElementById('event-modal-title').textContent = isNew ? 'Nuevo Evento' : 'Editar Evento';
  document.getElementById('ev-idx').value = i;

  const ev = isNew ? {} : (eventosData[i] || {});
  document.getElementById('ev-nombre').value  = ev.nombre  || '';
  const orgInput = document.getElementById('ev-organizador');
  if(orgInput) orgInput.value = ev.organizador || '';
  document.getElementById('ev-tipo').value    = ev.tipo    || '';
  document.getElementById('ev-fecha').value   = ev.fecha   || '';
  document.getElementById('ev-hora').value    = ev.hora    || '';
  const _setIf = (id,v)=>{ const el=document.getElementById(id); if(el) el.value = v||''; };
  _setIf('ev-colocacion-fecha', ev.colocacionFecha);
  _setIf('ev-colocacion-hora',  ev.colocacionHora);
  _setIf('ev-retiro-fecha',     ev.retiroFecha);
  _setIf('ev-retiro-hora',      ev.retiroHora);
  document.getElementById('ev-pax').value     = ev.pax     || '';
  if(document.getElementById('ev-presupuesto')) document.getElementById('ev-presupuesto').value = ev.presupuesto||'';
  if(document.getElementById('ev-costo-est')) document.getElementById('ev-costo-est').value = ev.costoEstimado||'';
  document.getElementById('ev-notas').value   = ev.notas   || '';
  document.getElementById('ev-precio').value  = ev.precio  || '';
  document.getElementById('ev-estado').value  = ev.estado  || 'Pedidos Pendientes';

  // Poblar selector de tipo de evento desde eventoPricing
  const tipoSel = document.getElementById('ev-tipo');
  if(tipoSel){
    const tipos = eventoPricing?.tipos || [];
    tipoSel.innerHTML = '<option value="">— Seleccionar tipo —</option>' +
      tipos.map(t => `<option value="${esc(t.nombre)}">${esc(t.nombre)}</option>`).join('') +
      '<option value="__otro__">+ Otro (escribir)</option>';
    // Si el tipo actual no está en la lista, agregarlo
    if(ev.tipo && ev.tipo !== '__otro__' && !tipos.find(t=>t.nombre===ev.tipo)){
      const opt = document.createElement('option');
      opt.value = ev.tipo; opt.textContent = ev.tipo;
      tipoSel.insertBefore(opt, tipoSel.lastElementChild);
    }
    tipoSel.value = ev.tipo || '';
  }

  // Poblar selectores de floristas (armado y colocación)
  const floristasEv = typeof getFloristasActivos === 'function' ? getFloristasActivos() : CL_RESP_OPTS.filter(n=>n!=='Jardineria');
  const asigSel = document.getElementById('ev-asignado');
  if(asigSel){
    asigSel.innerHTML = '<option value="">— Sin asignar —</option>' + floristasEv.map(n => `<option value="${esc(n)}"${n===(ev.asignado||'')?' selected':''}>${esc(n)}</option>`).join('');
  }
  const colocSel = document.getElementById('ev-colocacion');
  if(colocSel){
    colocSel.innerHTML = '<option value="">— Sin asignar —</option>' + floristasEv.map(n => `<option value="${esc(n)}"${n===(ev.colocacionAsignado||'')?' selected':''}>${esc(n)}</option>`).join('');
  }
  const retiroSel = document.getElementById('ev-retiro');
  if(retiroSel){
    retiroSel.innerHTML = '<option value="">— Sin asignar —</option>' + floristasEv.map(n => `<option value="${esc(n)}"${n===(ev.retiroAsignado||'')?' selected':''}>${esc(n)}</option>`).join('');
  }

  // Inicializar zonas — compatibilidad con eventos viejos que solo tienen 'salon'
  evZonasSelected = ev.zonas ? [...ev.zonas] : (ev.salon ? [ev.salon] : []);
  renderZonasPicker();

  // Init arreglos rows
  evArreglosRows = [];
  const list = document.getElementById('ev-arreglos-list');
  const preview = document.getElementById('ev-stock-preview');
  if(list) list.innerHTML='';
  if(preview) preview.innerHTML='';
  if(!isNew && ev.arreglos?.length){
    ev.arreglos.forEach(row=>{
      evArreglosRows.push({arreglo:row.arreglo, qty:row.qty});
      addEvArregloRowWithData(row.arreglo, row.qty);
    });
  }

  // restore image
  const evImgData = isNew ? '' : (eventosData[i]?.img||'');
  document.getElementById('ev-img-data').value = evImgData;
  const evPreview = document.getElementById('ev-img-preview');
  const evClearBtn = document.getElementById('ev-img-clear');
  if(evImgData){ evPreview.src=evImgData; evPreview.style.display='block'; evClearBtn.style.display='inline-block'; }
  else { evPreview.src=''; evPreview.style.display='none'; evClearBtn.style.display='none'; }
  document.getElementById('event-modal').classList.add('open');
}

function addEvArregloRowWithData(arreglo, qty){
  const list = document.getElementById('ev-arreglos-list');
  const idx = evArreglosRows.length-1;
  const arregloOpts = [...new Set(recetasData.map(r=>r.nombre))]
    .map(n=>`<option value="${esc(n)}"${n===arreglo?' selected':''}>${arregloEmoji(n)} ${esc(n)}</option>`).join('');
  const div = document.createElement('div');
  div.className='ev-arreglo-row'; div.id='ev-arr-row-'+idx;
  div.innerHTML=`
    <select onchange="evSetArreglo(${idx},this.value)" style="flex:2;border:1px solid #E4E2DC;border-radius:4px;padding:5px 8px;font-family:'DM Sans',sans-serif;font-size:12.5px;outline:none">
      <option value="">— Tipo de arreglo —</option>${arregloOpts}
    </select>
    <span style="font-size:12px;color:var(--mid-gray)">×</span>
    <input type="number" min="1" value="${qty}" onchange="evSetArregloQty(${idx},this.value)" style="width:60px;border:1px solid #E4E2DC;border-radius:4px;padding:5px 6px;font-size:12.5px;text-align:center;outline:none;font-family:'DM Sans',sans-serif">
    <button type="button" class="btn-icon" style="color:var(--red-alert)" onclick="evRemoveArregloRow(${idx})">✕</button>`;
  list.appendChild(div);
}

// ════════════════════════════════════════
// PRODUCTIVIDAD
// ════════════════════════════════════════
// ════ PRODUCTIVIDAD JARDINERÍA ══════════
function toggleJordProd(){
  if(userRole !== 'gerencia') return;
  const panel = document.getElementById('jops-prod-panel');
  const show  = panel.style.display === 'none';
  panel.style.display = show ? 'block' : 'none';
  if(show) renderJordProd();
}

function renderJordProd(){
  const periodEl = document.getElementById('jops-prod-period');
  const days = parseInt(periodEl?.value || '7');
  const cutoff = days > 0 ? new Date(Date.now() - days*86400000).toISOString().slice(0,10) : null;

  // Solo tareas con horaInicio y horaFin en el periodo
  const registros = jardineriaData.filter(r =>
    r.horaInicio && r.horaFin && r.last && (!cutoff || r.last >= cutoff)
  );

  const body = document.getElementById('jops-prod-body');

  if(registros.length === 0){
    body.innerHTML = '<p style="color:var(--mid-gray);font-size:13px;text-align:center;padding:20px">Sin tareas con horario registrado en el período.</p>';
    return;
  }

  // Agrupar por quien
  const byWho = {};
  registros.forEach(r => {
    const who = r.quien || '—';
    if(!byWho[who]) byWho[who] = { tareas:0, minutos:0, detalle:[] };
    const dur = calcDuracion(r.horaInicio, r.horaFin);
    byWho[who].tareas++;
    if(dur){ byWho[who].minutos += dur; byWho[who].detalle.push({task:r.task, group:r.group, section:r.section, horaInicio:r.horaInicio, horaFin:r.horaFin, dur, date:r.last}); }
  });

  const sorted = Object.entries(byWho).sort((a,b)=>b[1].minutos-a[1].minutos);
  const maxMin = sorted[0]?.[1]?.minutos || 1;

  let html = '<div style="display:grid;gap:16px">';
  sorted.forEach(([who, d]) => {
    const pct  = Math.round(d.minutos/maxMin*100);
    const avg  = d.tareas > 0 ? Math.round(d.minutos/d.tareas) : 0;
    const color = d.minutos > 240 ? 'var(--amber)' : '#2C4A3E';
    html += `<div style="background:#FDFCFB;border:1px solid #E4E2DC;border-radius:4px;padding:18px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:20px">🌿</span>
          <span style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--charcoal)">${esc(who)}</span>
        </div>
        <div style="display:flex;gap:16px;flex-wrap:wrap">
          <div style="text-align:center"><div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray)">Tareas</div><div style="font-size:22px;font-weight:700;color:var(--charcoal)">${d.tareas}</div></div>
          <div style="text-align:center"><div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray)">Total</div><div style="font-size:22px;font-weight:700;color:${color}">${fmtDur(d.minutos)}</div></div>
          <div style="text-align:center"><div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray)">Prom/tarea</div><div style="font-size:22px;font-weight:700;color:var(--sage)">${avg>0?fmtDur(avg):'—'}</div></div>
        </div>
      </div>
      <div style="height:8px;background:var(--light-gray);border-radius:4px;overflow:hidden;margin-bottom:12px">
        <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;transition:width .4s"></div>
      </div>
      ${d.detalle.length > 0 ? `<details><summary style="font-size:12px;color:var(--mid-gray);cursor:pointer;user-select:none">Ver detalle (${d.detalle.length} tareas)</summary>
        <div style="margin-top:10px;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead><tr style="background:var(--cream)">
              <th style="padding:6px 10px;text-align:left;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Fecha</th>
              <th style="padding:6px 10px;text-align:left;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Tarea</th>
              <th style="padding:6px 10px;text-align:left;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Zona</th>
              <th style="padding:6px 10px;text-align:center;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Inicio</th>
              <th style="padding:6px 10px;text-align:center;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Fin</th>
              <th style="padding:6px 10px;text-align:center;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Duración</th>
            </tr></thead>
            <tbody>${d.detalle.map(t=>`<tr style="border-bottom:1px solid var(--light-gray)">
              <td style="padding:6px 10px;color:var(--mid-gray)">${fmtDate(t.date)}</td>
              <td style="padding:6px 10px;font-weight:500">${esc(t.task)}</td>
              <td style="padding:6px 10px;color:#6B8F6B">${esc(t.group)}</td>
              <td style="padding:6px 10px;text-align:center;font-weight:700">${t.horaInicio}</td>
              <td style="padding:6px 10px;text-align:center;font-weight:700">${t.horaFin}</td>
              <td style="padding:6px 10px;text-align:center">${durBadge(t.horaInicio,t.horaFin)}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </details>` : ''}
    </div>`;
  });
  html += '</div>';
  body.innerHTML = html;
}

function toggleProductividad(){
  if(userRole !== 'gerencia') return;
  const panel = document.getElementById('productividad-panel');
  const show  = panel.style.display === 'none';
  panel.style.display = show ? 'block' : 'none';
  if(show) renderProductividad();
}

function renderProductividad(){
  const filterEl = document.getElementById('prod-week-filter');
  // Populate week options
  const weeks = [...new Set(checklistHistory.map(r=>r.week).filter(Boolean))].sort();
  const curVal = filterEl.value;
  filterEl.innerHTML = '<option value="">Todas las semanas</option>';
  weeks.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w; opt.textContent = w;
    if(w === curVal) opt.selected = true;
    filterEl.appendChild(opt);
  });

  const semanaFiltro = filterEl.value;
  const registros = semanaFiltro
    ? checklistHistory.filter(r => r.week === semanaFiltro)
    : checklistHistory;

  // Agrupar por operario
  const byWho = {};
  registros.forEach(r => {
    const who = r.who || '—';
    if(!byWho[who]) byWho[who] = { tareas: 0, conHorario: 0, minutos: 0, conRef: 0, excedidas: 0, detalle: [] };
    byWho[who].tareas++;
    if(r.inicio && r.fin){
      const dur = calcDuracion(r.inicio, r.fin);
      if(dur){
        byWho[who].conHorario++;
        byWho[who].minutos += dur;
        // Comparación con el tiempo de referencia de la tarea (si tiene).
        const ref = +r.ref || 0;
        const excedida = ref > 0 && dur > ref;
        if(ref > 0) byWho[who].conRef++;
        if(excedida) byWho[who].excedidas++;
        byWho[who].detalle.push({ zona: r.zona, actividad: r.actividad, inicio: r.inicio, fin: r.fin, dur, ref, excedida, day: r.day, date: r.date });
      }
    }
  });

  const body = document.getElementById('productividad-body');
  if(Object.keys(byWho).length === 0){
    body.innerHTML = '<p style="color:var(--mid-gray);font-size:13px;text-align:center;padding:20px">Sin datos para el período seleccionado.</p>';
    return;
  }

  // Ordenar por minutos desc
  const sorted = Object.entries(byWho).sort((a,b) => b[1].minutos - a[1].minutos);
  const maxMin = sorted[0]?.[1]?.minutos || 1;

  let html = '<div style="display:grid;gap:16px">';
  sorted.forEach(([who, d]) => {
    if(who === '—' && d.tareas === 0) return;
    const pct = Math.round(d.minutos / maxMin * 100);
    const avgMin = d.conHorario > 0 ? Math.round(d.minutos / d.conHorario) : 0;
    const color = d.minutos > 240 ? 'var(--amber)' : '#2C4A3E';
    const excPct = d.conRef > 0 ? Math.round(d.excedidas / d.conRef * 100) : 0;
    const excColor = d.excedidas === 0 ? 'var(--green-ok)' : excPct >= 40 ? 'var(--red-alert)' : 'var(--amber)';
    html += `
      <div style="background:#FDFCFB;border:1px solid #E4E2DC;border-radius:4px;padding:18px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:20px">👤</span>
            <span style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--charcoal)">${esc(who)}</span>
          </div>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <div style="text-align:center">
              <div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray)">Tareas</div>
              <div style="font-size:22px;font-weight:700;color:var(--charcoal)">${d.tareas}</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray)">Con horario</div>
              <div style="font-size:22px;font-weight:700;color:${color}">${d.conHorario}</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray)">Total registrado</div>
              <div style="font-size:22px;font-weight:700;color:${color}">${fmtDur(d.minutos)}</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray)">Prom/tarea</div>
              <div style="font-size:22px;font-weight:700;color:var(--sage)">${avgMin > 0 ? fmtDur(avgMin) : '—'}</div>
            </div>
            <div style="text-align:center" title="Tareas que superaron el tiempo de referencia">
              <div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray)">Se pasó</div>
              <div style="font-size:22px;font-weight:700;color:${excColor}">${d.conRef > 0 ? d.excedidas + '/' + d.conRef : '—'}</div>
            </div>
          </div>
        </div>
        <div style="height:8px;background:var(--light-gray);border-radius:4px;overflow:hidden;margin-bottom:12px">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;transition:width .4s"></div>
        </div>
        ${d.detalle.length > 0 ? `
        <details style="margin-top:4px">
          <summary style="font-size:12px;color:var(--mid-gray);cursor:pointer;user-select:none">Ver detalle de tareas (${d.detalle.length})</summary>
          <div style="margin-top:10px;overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead><tr style="background:var(--cream)">
                <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:10px;letter-spacing:1px;text-transform:uppercase">Día</th>
                <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:10px;letter-spacing:1px;text-transform:uppercase">Zona</th>
                <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:10px;letter-spacing:1px;text-transform:uppercase">Actividad</th>
                <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:10px;letter-spacing:1px;text-transform:uppercase">Inicio</th>
                <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:10px;letter-spacing:1px;text-transform:uppercase">Fin</th>
                <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:10px;letter-spacing:1px;text-transform:uppercase">Duración</th>
                <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:10px;letter-spacing:1px;text-transform:uppercase">Ref.</th>
              </tr></thead>
              <tbody>
                ${d.detalle.map(t=>`<tr style="border-bottom:1px solid var(--light-gray)">
                  <td style="padding:6px 10px;color:var(--mid-gray)">${esc(t.day)}</td>
                  <td style="padding:6px 10px;font-weight:500">${esc(t.zona)}</td>
                  <td style="padding:6px 10px"><span class="badge ${getBadge(t.actividad)}">${esc(t.actividad)}</span></td>
                  <td style="padding:6px 10px;text-align:center;font-weight:600">${t.inicio}</td>
                  <td style="padding:6px 10px;text-align:center;font-weight:600">${t.fin}</td>
                  <td style="padding:6px 10px;text-align:center">${durBadge(t.inicio,t.fin,t.ref)}</td>
                  <td style="padding:6px 10px;text-align:center;color:var(--mid-gray)">${t.ref ? t.ref+'m' : '—'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </details>` : ''}
      </div>`;
  });
  html += '</div>';
  body.innerHTML = html;
}
  

// Also discount stock when changing estado from event card directly
// changeEventoEstado extended with stock discount


// ── MULTI-SUCURSAL ────────────────────────────────────────────
function renderSucursalIndicador(){
  let el = document.getElementById('sucursal-badge');
  if(!el){
    el = document.createElement('span');
    el.id = 'sucursal-badge';
    el.style.cssText = 'font-size:10px;background:var(--light-gray);color:var(--mid-gray);padding:3px 9px;border-radius:10px;letter-spacing:.5px;cursor:default';
    document.querySelector('.topbar-right')?.insertBefore(el, document.querySelector('.theme-toggle-btn'));
  }
  const nombre = getSucursalNombre(currentSucursal);
  el.textContent = '📍 '+nombre;
  el.title = 'Sucursal actual: '+nombre;
}

function renderSucursales(){
  const el = document.getElementById('sucursales-lista');
  if(!el) return;
  el.innerHTML = sucursalesConfig.map((s,i)=>`
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;margin-bottom:10px">
      <div style="width:10px;height:10px;border-radius:50%;background:${s.activa?'var(--green-ok)':'var(--mid-gray)'};flex-shrink:0"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:600;color:var(--charcoal)">${esc(s.nombre)}</div>
        <div style="font-size:12px;color:var(--mid-gray)">${esc(s.id)} · ${esc(s.direccion||'—')}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <label style="font-size:12px;color:var(--mid-gray);display:flex;align-items:center;gap:4px;cursor:pointer">
          <input type="checkbox" ${s.activa?'checked':''} onchange="toggleSucursalActiva(${i},this.checked)"> Activa
        </label>
        <button class="btn-icon" onclick="openEditSucursal(${i})" title="Editar">✏️</button>
        ${sucursalesConfig.length>1?`<button class="btn-icon" style="color:var(--red-alert)" onclick="eliminarSucursal(${i})" title="Eliminar">✕</button>`:''}
      </div>
    </div>`).join('');
}

function openNuevaSucursalModal(idx=-1){
  const s = idx>=0 ? sucursalesConfig[idx] : {};
  document.getElementById('suc-idx').value = idx;
  document.getElementById('suc-nombre').value = s.nombre||'';
  document.getElementById('suc-id').value = s.id||'';
  document.getElementById('suc-direccion').value = s.direccion||'';
  document.getElementById('suc-modal').classList.add('open');
}
function openEditSucursal(idx){ openNuevaSucursalModal(idx); }

function guardarSucursal(){
  const nombre = document.getElementById('suc-nombre')?.value?.trim();
  const id = document.getElementById('suc-id')?.value?.trim().toLowerCase().replace(/\s+/g,'-');
  const direccion = document.getElementById('suc-direccion')?.value?.trim();
  if(!nombre||!id){ showToast('⚠️ Nombre e ID son obligatorios'); return; }
  const idx = +document.getElementById('suc-idx').value;
  const entry = { id, nombre, direccion, activa: true };
  if(idx>=0) sucursalesConfig[idx] = {...sucursalesConfig[idx],...entry};
  else sucursalesConfig.push(entry);
  fbSave('sucursalesConfig', sucursalesConfig);
  closeModal('suc-modal');
  renderSucursales();
  renderSucursalSelector();
  showToast('✅ Sucursal guardada');
}

function toggleSucursalActiva(idx,val){
  sucursalesConfig[idx].activa = val;
  fbSave('sucursalesConfig', sucursalesConfig);
  renderSucursales();
  renderSucursalSelector();
}

async function eliminarSucursal(idx){
  if(!await confirmModal('¿Eliminar esta sucursal? Los datos históricos no se borran.')) return;
  sucursalesConfig.splice(idx,1);
  fbSave('sucursalesConfig', sucursalesConfig);
  renderSucursales();
}

function renderSucursalSelector(){
  // Selector en el dashboard consolidado
  ['suc-filtro-cons'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.innerHTML='<option value="">— Todas las sucursales —</option>'+
      sucursalesConfig.map(s=>`<option value="${esc(s.id)}">${esc(s.nombre)}</option>`).join('');
  });
}

function renderDashboardConsolidado(){
  renderSucursalSelector();
  const sucFiltro = document.getElementById('suc-filtro-cons')?.value || '';
  const mesISO = document.getElementById('cons-mes')?.value || TODAY_ISO.slice(0,7);
  _repMeses('cons-mes');

  const parseMon = parseMoney;

  const sucursalesAMostrar = sucFiltro
    ? sucursalesConfig.filter(s=>s.id===sucFiltro)
    : sucursalesConfig.filter(s=>s.activa);

  const el = document.getElementById('cons-cards');
  if(!el) return;
  el.innerHTML = sucursalesAMostrar.map(suc=>{
    const ventas = (window.ventasData||[]).filter(v=>(v.sucursal||'duhau')===suc.id && (v.fecha||'').startsWith(mesISO));
    const caja = (window.cajaData||[]).filter(r=>(r.sucursal||'duhau')===suc.id && (r.fecha||'').startsWith(mesISO));
    const compras = [...(window.comprasFlore||[]),...(window.comprasJard||[])].filter(c=>(c.sucursal||'duhau')===suc.id && (c.fecha||'').startsWith(mesISO) && !c.anulado);
    const totalVentas = ventas.reduce((s,v)=>s+parseMon(v.precio||v.monto||v.total),0);
    const totalIngresos = caja.filter(r=>r.tipo==='ingreso').reduce((s,r)=>s+parseMon(r.monto),0);
    const totalEgresos = caja.filter(r=>r.tipo==='egreso').reduce((s,r)=>s+parseMon(r.monto),0);
    const totalCompras = compras.reduce((s,c)=>s+_compraImporte(c),0);
    const margen = totalVentas>0?((totalVentas-totalCompras)/totalVentas*100).toFixed(1):0;
    return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:14px;padding:20px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <div style="width:10px;height:10px;border-radius:50%;background:${suc.activa?'var(--green-ok)':'var(--mid-gray)'}"></div>
        <div style="font-size:16px;font-weight:600;color:var(--charcoal)">${esc(suc.nombre)}</div>
        <div style="font-size:11px;color:var(--mid-gray);margin-left:4px">${esc(suc.direccion||'')}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px">
        ${_kpiCard('Ventas Externas','$'+totalVentas.toLocaleString('es-AR'),ventas.length+' transacciones','var(--green-ok)')}
        ${_kpiCard('Ingresos Caja','$'+totalIngresos.toLocaleString('es-AR'),'vs $'+totalEgresos.toLocaleString('es-AR')+' egresos','var(--charcoal)')}
        ${_kpiCard('Compras','$'+totalCompras.toLocaleString('es-AR'),compras.length+' registros','var(--amber)')}
        ${_kpiCard('Margen Bruto',margen+'%',margen>=0?'Rentable ✓':'Déficit ⚠',+margen>=0?'var(--green-ok)':'var(--red-alert)')}
      </div>
    </div>`;
  }).join('') || '<div style="color:var(--mid-gray);font-size:13px;padding:24px">Sin sucursales activas.</div>';
}

// ── CRM CLIENTES ──────────────────────────────────────────────
let clientesData = [];
window._setClientesData = (arr) => { clientesData = arr && typeof arr === 'object' ? (Array.isArray(arr) ? arr : Object.values(arr)) : []; };

function renderClientes(){
  const el = document.getElementById('crm-lista');
  if(!el) return;
  const q = (document.getElementById('crm-search')?.value||'').toLowerCase();
  const filtro = document.getElementById('crm-filtro')?.value || '';

  let lista = [...clientesData];
  if(q) lista = lista.filter(c => (c.nombre||'').toLowerCase().includes(q) || (c.empresa||'').toLowerCase().includes(q) || (c.telefono||'').includes(q));
  if(filtro) lista = lista.filter(c => c.tipo === filtro);
  lista.sort((a,b)=>(a.nombre||'').localeCompare(b.nombre||''));

  if(!lista.length){ el.innerHTML='<div style="color:var(--mid-gray);font-size:13px;padding:24px">No hay clientes registrados.</div>'; return; }

  el.innerHTML = lista.map((c)=>{
    const idx = clientesData.indexOf(c);
    const eventos = (window.eventosData||[]).filter(e=>(e.clienteId||e.cliente||'')===(c.id||c.nombre));
    const compras = (window.ventasData||[]).filter(v=>(v.clienteId||v.cliente||'')===(c.id||c.nombre));
    const totalGastado = compras.reduce((s,v)=>s+(+v.monto||+v.total||0),0);
    return `<div class="crm-card" onclick="abrirFichaCliente(${idx})">
      <div class="crm-card-avatar">${(c.nombre||'?').charAt(0).toUpperCase()}</div>
      <div class="crm-card-info">
        <div class="crm-card-nombre">${esc(c.nombre||'—')}</div>
        ${c.empresa?`<div class="crm-card-sub">${esc(c.empresa)}</div>`:''}
        <div class="crm-card-meta">${c.telefono?'📞 '+esc(c.telefono)+'  ':''} ${c.email?'✉️ '+esc(c.email):''}
        </div>
      </div>
      <div class="crm-card-stats">
        ${eventos.length?`<span class="crm-badge">🎉 ${eventos.length} evento${eventos.length!==1?'s':''}</span>`:''}
        ${totalGastado>0?`<span class="crm-badge green">$${totalGastado.toLocaleString('es-AR')}</span>`:''}
        ${c.tipo?`<span class="crm-badge blue">${esc(c.tipo)}</span>`:''}
      </div>
    </div>`;
  }).join('');
}

function abrirFichaCliente(idx){
  const c = clientesData[idx];
  if(!c) return;
  const eventos = (window.eventosData||[]).filter(e=>(e.clienteId||e.cliente||'')===(c.id||c.nombre));
  const compras = (window.ventasData||[]).filter(v=>(v.clienteId||v.cliente||'')===(c.id||c.nombre));
  const totalGastado = compras.reduce((s,v)=>s+(+v.monto||+v.total||0),0);

  const historial = [
    ...eventos.map(e=>({fecha:e.fecha||'',tipo:'Evento',desc:e.titulo||e.nombre||'—',extra:e.zona||''})),
    ...compras.map(v=>({fecha:v.fecha||'',tipo:'Venta',desc:v.descripcion||v.desc||'—',extra:'$'+(+v.monto||+v.total||0).toLocaleString('es-AR')}))
  ].sort((a,b)=>b.fecha.localeCompare(a.fecha));

  document.getElementById('ficha-nombre').textContent = c.nombre||'—';
  document.getElementById('ficha-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      ${c.empresa?`<div><div class="form-label">Empresa</div><div style="font-size:14px">${esc(c.empresa)}</div></div>`:''}
      ${c.telefono?`<div><div class="form-label">Teléfono</div><div style="font-size:14px">${esc(c.telefono)}</div></div>`:''}
      ${c.email?`<div><div class="form-label">Email</div><div style="font-size:14px">${esc(c.email)}</div></div>`:''}
      ${c.tipo?`<div><div class="form-label">Tipo</div><div style="font-size:14px">${esc(c.tipo)}</div></div>`:''}
    </div>
    <div style="display:flex;gap:16px;margin-bottom:20px">
      <div class="kpi-card" style="flex:1;padding:14px"><div style="font-size:11px;color:var(--mid-gray);margin-bottom:4px">EVENTOS</div><div style="font-size:22px;font-weight:700">${eventos.length}</div></div>
      <div class="kpi-card" style="flex:1;padding:14px"><div style="font-size:11px;color:var(--mid-gray);margin-bottom:4px">COMPRAS</div><div style="font-size:22px;font-weight:700">${compras.length}</div></div>
      <div class="kpi-card" style="flex:1;padding:14px"><div style="font-size:11px;color:var(--mid-gray);margin-bottom:4px">TOTAL GASTADO</div><div style="font-size:20px;font-weight:700;color:var(--green-ok)">$${totalGastado.toLocaleString('es-AR')}</div></div>
    </div>
    ${c.notas?`<div style="margin-bottom:16px"><div class="form-label">Notas</div><div style="font-size:13px;color:var(--mid-gray);line-height:1.5">${esc(c.notas)}</div></div>`:''}
    <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:12px;font-weight:500">Historial</div>
    ${historial.length?historial.map(h=>`<div style="display:flex;gap:12px;padding:9px 0;border-bottom:1px solid var(--light-gray)">
      <span style="font-size:10px;background:var(--light-gray);padding:2px 7px;border-radius:8px;white-space:nowrap;align-self:flex-start">${h.tipo}</span>
      <div style="flex:1;min-width:0"><div style="font-size:13px">${esc(h.desc)}</div>${h.extra?`<div style="font-size:11px;color:var(--mid-gray)">${esc(h.extra)}</div>`:''}</div>
      <span style="font-size:11px;color:var(--mid-gray);white-space:nowrap">${fmtDate(h.fecha)}</span>
    </div>`).join(''):'<div style="color:var(--mid-gray);font-size:13px">Sin historial registrado.</div>'}
    <div class="modal-actions" style="margin-top:20px">
      <button class="btn-secondary" onclick="editarCliente(${idx})">✏️ Editar</button>
      <button class="btn-secondary" style="color:var(--red-alert)" onclick="eliminarCliente(${idx})">🗑 Eliminar</button>
    </div>`;
  document.getElementById('ficha-cliente-modal').classList.add('open');
}

function openNuevoClienteModal(idx=-1){
  const c = idx>=0 ? clientesData[idx] : {};
  document.getElementById('crm-idx').value = idx;
  ['crm-nombre','crm-empresa','crm-telefono','crm-email','crm-tipo','crm-notas'].forEach(id=>{
    const key = id.replace('crm-','');
    const el = document.getElementById(id);
    if(el) el.value = c[key]||'';
  });
  document.getElementById('crm-modal').classList.add('open');
}

function editarCliente(idx){ closeModal('ficha-cliente-modal'); openNuevoClienteModal(idx); }

function guardarCliente(){
  const nombre = document.getElementById('crm-nombre')?.value?.trim();
  if(!nombre){ showToast('⚠️ El nombre es obligatorio'); return; }
  const idx = +document.getElementById('crm-idx').value;
  const entry = {
    id: idx>=0 ? (clientesData[idx]?.id||Date.now()) : Date.now(),
    nombre,
    empresa: document.getElementById('crm-empresa')?.value?.trim()||'',
    telefono: document.getElementById('crm-telefono')?.value?.trim()||'',
    email: document.getElementById('crm-email')?.value?.trim()||'',
    tipo: document.getElementById('crm-tipo')?.value||'',
    notas: document.getElementById('crm-notas')?.value?.trim()||'',
    ts: Date.now()
  };
  if(idx>=0) clientesData[idx]=entry;
  else clientesData.push(entry);
  fbSave('clientesData', clientesData);
  closeModal('crm-modal');
  renderClientes();
  showToast(idx>=0?'✅ Cliente actualizado':'✅ Cliente registrado');
}

async function eliminarCliente(idx){
  if(!await confirmModal('¿Eliminar este cliente?')) return;
  clientesData.splice(idx,1);
  fbSave('clientesData', clientesData);
  closeModal('ficha-cliente-modal');
  renderClientes();
}

// ── PRESUPUESTOS EN PDF ───────────────────────────────────────
function generarPresupuestoPDF(){
  const carrito = window.cotizadorCarrito || [];
  if(!carrito.length){ showToast('⚠️ El carrito está vacío'); return; }

  const margen = +document.getElementById('cot-margen')?.value || 0;
  const cliente = document.getElementById('ppto-cliente')?.value?.trim() || '';
  const evento = document.getElementById('ppto-evento')?.value?.trim() || '';
  const fecha = document.getElementById('ppto-fecha')?.value || TODAY_ISO;
  const notas = document.getElementById('ppto-notas')?.value?.trim() || '';

  const totalCosto = carrito.reduce((s,c)=>s+(c.precio*c.qty),0);
  const precioFinal = Math.round(totalCosto*(1+margen/100));
  const nro = 'P-' + Date.now().toString().slice(-6);

  const win = window.open('','_blank');
  win.document.write(`<!DOCTYPE html><html lang="es"><head>
  <meta charset="UTF-8">
  <title>Presupuesto ${nro} — Florería Duhau</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'DM Sans',sans-serif; color:#1A1A1A; padding:48px; max-width:800px; margin:0 auto; }
    .logo { font-family:'Cormorant Garamond',serif; font-size:32px; font-weight:500; letter-spacing:1px; margin-bottom:4px; }
    .logo-sub { font-size:10px; letter-spacing:3px; text-transform:uppercase; color:#7A7A72; margin-bottom:32px; }
    .divider { border:none; border-top:1px solid #E8E6E0; margin:20px 0; }
    .header-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:28px; }
    .label { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#7A7A72; margin-bottom:4px; }
    .value { font-size:14px; }
    table { width:100%; border-collapse:collapse; margin:24px 0; }
    th { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#7A7A72; padding:8px 12px; text-align:left; border-bottom:2px solid #1A1A1A; }
    td { padding:10px 12px; font-size:13px; border-bottom:1px solid #E8E6E0; }
    .total-row td { font-weight:700; font-size:15px; border-bottom:none; border-top:2px solid #1A1A1A; padding-top:14px; }
    .footer { margin-top:48px; font-size:10px; color:#7A7A72; text-align:center; letter-spacing:.5px; }
    .nro { font-size:12px; color:#7A7A72; }
    @media print { body { padding:24px; } }
  </style>
  </head><body>
  <div class="logo">Florería Duhau</div>
  <div class="logo-sub">Park Hyatt Buenos Aires</div>
  <hr class="divider">
  <div class="header-grid">
    <div>
      <div class="label">Presupuesto N°</div><div class="value">${nro}</div>
      <div class="label" style="margin-top:16px">Fecha</div><div class="value">${fmtDate(fecha)}</div>
    </div>
    <div>
      ${cliente?`<div class="label">Cliente</div><div class="value">${cliente}</div>`:''}
      ${evento?`<div class="label" style="margin-top:${cliente?'16px':'0'}">Evento / Ocasión</div><div class="value">${evento}</div>`:''}
    </div>
  </div>
  <table>
    <thead><tr><th>Ítem</th><th style="text-align:right">Precio unit.</th><th style="text-align:center">Qty</th><th style="text-align:right">Subtotal</th></tr></thead>
    <tbody>
      ${carrito.map(c=>`<tr>
        <td>${c.nombre}</td>
        <td style="text-align:right">$${c.precio.toLocaleString('es-AR')}</td>
        <td style="text-align:center">${c.qty}</td>
        <td style="text-align:right">$${(c.precio*c.qty).toLocaleString('es-AR')}</td>
      </tr>`).join('')}
      ${margen>0?`<tr><td colspan="3" style="text-align:right;font-size:12px;color:#7A7A72">Costo base</td><td style="text-align:right;font-size:12px;color:#7A7A72">$${totalCosto.toLocaleString('es-AR')}</td></tr>
      <tr><td colspan="3" style="text-align:right;font-size:12px;color:#7A7A72">Margen (${margen}%)</td><td style="text-align:right;font-size:12px;color:#7A7A72">$${(precioFinal-totalCosto).toLocaleString('es-AR')}</td></tr>`:''}
    </tbody>
    <tfoot><tr class="total-row"><td colspan="3">Total</td><td style="text-align:right">$${precioFinal.toLocaleString('es-AR')}</td></tr></tfoot>
  </table>
  ${notas?`<div style="margin-top:24px"><div class="label">Observaciones</div><div style="font-size:13px;line-height:1.6;margin-top:6px;color:#4A4A42">${notas}</div></div>`:''}
  <div class="footer">
    Florería Duhau · Park Hyatt Buenos Aires · Presupuesto válido por 7 días
  </div>
  <script>window.onload=()=>{ window.print(); }<\/script>
  </body></html>`);
  win.document.close();
}

// ── ONBOARDING ────────────────────────────────────────────────
const ONBOARDING_STEPS = {
  gerencia: [
    { title:'Bienvenido al Panel de Gerencia', body:'Desde acá tenés visibilidad completa de operaciones, equipo, ventas, reportes y más. Usá el menú lateral para navegar entre secciones.', icon:'👋' },
    { title:'Reportes & Auditoría', body:'En Reportes encontrás análisis de equipo, ventas, márgenes y auditoría de cambios. Todo se actualiza en tiempo real desde Firebase.', icon:'📊' },
    { title:'Cierre de Caja', body:'Desde Control de Caja podés cerrar el día y archivar el resumen. El historial queda registrado con quién hizo el cierre.', icon:'🔒' },
    { title:'Búsqueda global', body:'Usá Ctrl+K para buscar rápidamente en stock, ventas, eventos, glosario y páginas desde cualquier lugar de la app.', icon:'🔍' },
  ],
  operario: [
    { title:'Panel de Operaciones', body:'Desde acá gestionás los eventos del hotel, el stock de florería y el cotizador. Tu trabajo del día a día está en la sección Operaciones.', icon:'⚙️' },
    { title:'Eventos / Maison', body:'En Eventos encontrás todos los eventos activos del hotel. Podés ver zonas, estados y detalles de cada uno.', icon:'🎉' },
    { title:'Stock Florería', body:'En Stock podés ver disponibilidad de flores e insumos. Reportá alertas de stock bajo a gerencia.', icon:'🌸' },
  ],
  florista: [
    { title:'Tu panel de trabajo', body:'Registrá tu inicio y fin de turno desde Checklist. Eso nos ayuda a calcular tu productividad del día.', icon:'🌸' },
    { title:'Checklist Diaria', body:'En Checklist encontrás las tareas asignadas a vos. Completalas a medida que avanza el día.', icon:'✅' },
    { title:'Inicio', body:'Desde Inicio podés ver el resumen del día: eventos, alertas de stock y productividad de la florería.', icon:'🏠' },
  ],
  jardinero: [
    { title:'Panel de Jardinería', body:'Registrá tu turno y completá las tareas de las zonas asignadas. Todo queda registrado en tiempo real.', icon:'🌿' },
    { title:'Tareas de Jardinería', body:'En Operaciones › Tareas Jardinería encontrás el detalle de cada zona y sección del hotel.', icon:'🌳' },
    { title:'Control & Horarios', body:'Desde Control podés ver tus horarios, productividad y recordatorios de mantenimiento.', icon:'🕐' },
  ],
  compras: [
    { title:'Área de Compras', body:'Gestionás las compras de florería y jardinería, recepción de pedidos y el stock general.', icon:'📦' },
    { title:'Recepción de Pedidos', body:'Registrá cada pedido recibido con proveedor, costo y estado. Eso actualiza el stock automáticamente.', icon:'🚚' },
    { title:'Stock Admin', body:'Desde Compras › Gestión de Stock podés ajustar máximos y mínimos de stock.', icon:'📊' },
  ],
  ventas: [
    { title:'Panel Hyatt', body:'Tenés acceso al catálogo de ramos disponibles y pedidos de habitación. Podés consultar lista de precios.', icon:'🏨' },
    { title:'Ramos Disponibles', body:'Aquí encontrás el catálogo actualizado de ramos con precios y descripción para ofrecer a los huéspedes.', icon:'💐' },
    { title:'Pedidos de Habitación', body:'Registrá pedidos de los huéspedes. El equipo de florería los recibe en tiempo real.', icon:'📝' },
  ],
  comercial: [
    { title:'Área Comercial', body:'Tenés acceso a eventos, ventas externas, caja, glosario, lista de precios y composiciones.', icon:'💼' },
    { title:'Eventos & Ventas', body:'Registrá eventos y ventas externas. Los datos alimentan los reportes de gerencia automáticamente.', icon:'🎉' },
    { title:'Glosario & Precios', body:'En Glosario encontrás el muestrario floral. La Lista de Precios está siempre actualizada.', icon:'📖' },
  ],
};

let _onboardingStep = 0;
let _onboardingRole = '';

function checkOnboarding(role){
  const key = 'fd-onboarding-' + role;
  if(localStorage.getItem(key)) return;
  _onboardingRole = role;
  _onboardingStep = 0;
  showOnboardingStep();
}

function showOnboardingStep(){
  const steps = ONBOARDING_STEPS[_onboardingRole] || [];
  if(!steps.length || _onboardingStep >= steps.length){ finishOnboarding(); return; }
  const step = steps[_onboardingStep];
  const total = steps.length;

  let ov = document.getElementById('onboarding-overlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'onboarding-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(4px)';
    document.body.appendChild(ov);
  }
  ov.innerHTML = `
    <div style="background:var(--warm-white);border-radius:20px;max-width:480px;width:100%;padding:40px;text-align:center;box-shadow:var(--shadow-lg);animation:slideUp .3s ease">
      <div style="font-size:48px;margin-bottom:20px">${step.icon}</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;margin-bottom:12px;color:var(--charcoal)">${step.title}</div>
      <div style="font-size:14px;color:var(--mid-gray);line-height:1.7;margin-bottom:28px">${step.body}</div>
      <div style="display:flex;gap:6px;justify-content:center;margin-bottom:24px">
        ${steps.map((_,i)=>`<div style="width:8px;height:8px;border-radius:50%;background:${i===_onboardingStep?'var(--charcoal)':'var(--light-gray)'};transition:background .2s"></div>`).join('')}
      </div>
      <div style="display:flex;gap:12px;justify-content:center">
        <button onclick="finishOnboarding()" style="background:none;border:1px solid var(--light-gray);border-radius:8px;padding:10px 20px;font-size:13px;cursor:pointer;color:var(--mid-gray);font-family:'DM Sans',sans-serif">Saltar</button>
        <button onclick="nextOnboardingStep()" style="background:var(--charcoal);color:var(--warm-white);border:none;border-radius:8px;padding:10px 24px;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif">${_onboardingStep<total-1?'Siguiente →':'Comenzar'}</button>
      </div>
    </div>`;
}

function nextOnboardingStep(){
  const steps = ONBOARDING_STEPS[_onboardingRole] || [];
  _onboardingStep++;
  if(_onboardingStep >= steps.length) finishOnboarding();
  else showOnboardingStep();
}

function finishOnboarding(){
  localStorage.setItem('fd-onboarding-' + _onboardingRole, '1');
  document.getElementById('onboarding-overlay')?.remove();
}

// ── MODO OSCURO ──────────────────────────────────────────────
function toggleDarkMode(){
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('fd-theme', next);
  const btn = document.getElementById('theme-toggle-btn');
  if(btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
}

function initDarkMode(){
  const saved = localStorage.getItem('fd-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('theme-toggle-btn');
  if(btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
}

// ── BÚSQUEDA GLOBAL ──────────────────────────────────────────
let _gsearchIdx = -1;

function openGlobalSearch(){
  document.getElementById('global-search-overlay').classList.add('open');
  const inp = document.getElementById('global-search-input');
  inp.value = '';
  inp.focus();
  document.getElementById('global-search-results').innerHTML = '<div class="gsearch-empty">Escribí para buscar en stock, ventas, eventos, glosario y más...</div>';
  _gsearchIdx = -1;
}

function closeGlobalSearch(){
  document.getElementById('global-search-overlay').classList.remove('open');
  _gsearchIdx = -1;
}

function handleSearchKey(e){
  const items = document.querySelectorAll('.gsearch-item');
  if(e.key === 'Escape'){ closeGlobalSearch(); return; }
  if(e.key === 'ArrowDown'){ e.preventDefault(); _gsearchIdx = Math.min(_gsearchIdx+1, items.length-1); _gsHighlight(items); return; }
  if(e.key === 'ArrowUp'){ e.preventDefault(); _gsearchIdx = Math.max(_gsearchIdx-1, 0); _gsHighlight(items); return; }
  if(e.key === 'Enter'){
    const active = document.querySelector('.gsearch-item.active');
    if(active) active.click();
    return;
  }
}

function _gsHighlight(items){
  items.forEach((it,i) => it.classList.toggle('active', i === _gsearchIdx));
  const active = items[_gsearchIdx];
  if(active) active.scrollIntoView({block:'nearest'});
}

function runGlobalSearch(q){
  q = (q||'').trim().toLowerCase();
  const el = document.getElementById('global-search-results');
  if(!q){ el.innerHTML = '<div class="gsearch-empty">Escribí para buscar...</div>'; _gsearchIdx=-1; return; }

  const results = [];

  // Stock
  (window.stockData||[]).forEach(it => {
    if(!it) return;
    const name = (it.nombre||it.name||'').toLowerCase();
    const cat = (it.categoria||it.cat||'').toLowerCase();
    if(name.includes(q) || cat.includes(q))
      results.push({icon:'🌸', label: it.nombre||it.name, sub: `Stock: ${it.cantidad??it.qty??'—'} · ${it.categoria||''}`, badge:'Stock', action:()=>{ closeGlobalSearch(); navigate('stock'); }});
  });

  // Eventos
  (window.eventosData||[]).forEach(ev => {
    if(!ev) return;
    const titulo = (ev.titulo||ev.nombre||'').toLowerCase();
    const zona = (ev.zona||'').toLowerCase();
    if(titulo.includes(q) || zona.includes(q))
      results.push({icon:'📅', label: ev.titulo||ev.nombre, sub: `${ev.fecha||''} · ${ev.zona||''}`, badge:'Eventos', action:()=>{ closeGlobalSearch(); navigate('eventos-maison'); }});
  });

  // Ventas
  (window.ventasData||[]).forEach(v => {
    if(!v) return;
    const desc = (v.descripcion||v.desc||'').toLowerCase();
    const tipo = (v.tipo||'').toLowerCase();
    if(desc.includes(q) || tipo.includes(q))
      results.push({icon:'💰', label: v.descripcion||v.desc||'Venta', sub: `$${v.monto||v.total||0} · ${v.fecha||''}`, badge:'Ventas', action:()=>{ closeGlobalSearch(); navigate('ventas'); }});
  });

  // Galería de Trabajos
  (window.galeriaData||[]).forEach(g => {
    if(!g) return;
    const nombre = (g.nombre||'').toLowerCase();
    const desc = (g.desc||'').toLowerCase();
    const cat = (g.cat||'').toLowerCase();
    if(nombre.includes(q) || desc.includes(q) || cat.includes(q))
      results.push({icon:'🖼', label: g.nombre||'', sub: (g.desc||'').slice(0,60), badge:'Galería', action:()=>{ closeGlobalSearch(); navigate('galeria'); }});
  });

  // Ramos / Catálogo
  (window.ramosDispData||[]).forEach(r => {
    if(!r) return;
    const name = (r.nombre||'').toLowerCase();
    if(name.includes(q))
      results.push({icon:'💐', label: r.nombre, sub: `$${r.precio||0}`, badge:'Ramos', action:()=>{ closeGlobalSearch(); navigate('ramos-disponibles'); }});
  });

  // Checklist tasks
  if(typeof CL_TASKS !== 'undefined'){
    CL_TASKS.forEach(s => {
      (s.tasks||[]).forEach(t => {
        if((t||'').toLowerCase().includes(q))
          results.push({icon:'✅', label: t, sub: s.section||'', badge:'Checklist', action:()=>{ closeGlobalSearch(); navigate('checklist'); }});
      });
    });
  }

  // Páginas
  const pages = [
    {label:'Inicio', icon:'🏠', page:'home'}, {label:'Checklist Diaria', icon:'📋', page:'checklist'},
    {label:'Stock Florería', icon:'🌸', page:'stock'}, {label:'Ventas', icon:'💰', page:'ventas'},
    {label:'Eventos / Maison', icon:'📅', page:'eventos-maison'}, {label:'Glosario', icon:'📖', page:'glosario'},
    {label:'Reportes Equipo', icon:'📊', page:'reportes-equipo'}, {label:'Jardinería', icon:'🌿', page:'jardineria-ops'},
    {label:'Control Horarios', icon:'🕐', page:'control-horarios'}, {label:'Habilitaciones', icon:'🏨', page:'hab-ops'},
  ];
  pages.forEach(p => {
    if(p.label.toLowerCase().includes(q))
      results.push({icon:p.icon, label:p.label, sub:'Ir a esta sección', badge:'Página', action:()=>{ closeGlobalSearch(); navigate(p.page); }});
  });

  if(!results.length){ el.innerHTML = '<div class="gsearch-empty">Sin resultados para "'+q+'"</div>'; _gsearchIdx=-1; return; }

  const shown = results.slice(0,15);
  el.innerHTML = shown.map((r,i) => `
    <div class="gsearch-item" onclick="_gsearchGo(${i})">
      <span class="gsearch-icon">${r.icon}</span>
      <div style="min-width:0">
        <div class="gsearch-label">${r.label||''}</div>
        ${r.sub ? `<div class="gsearch-sub">${r.sub}</div>` : ''}
      </div>
      <span class="gsearch-badge">${r.badge}</span>
    </div>`).join('');
  window._gsearchActions = shown.map(r => r.action);
  _gsearchIdx = -1;
}

function _gsearchGo(i){
  const fn = (window._gsearchActions||[])[i];
  if(fn) fn();
}

// ── EXPORTAR PDF ──────────────────────────────────────────────
function exportPDF(title){
  const orig = document.title;
  document.title = title || 'Florería Duhau — Exportar';
  window.print();
  setTimeout(() => { document.title = orig; }, 1000);
}

// ── CALENDARIO ────────────────────────────────────────────────────────────────
let calMes = CURR_MONTH;

// Cambio de vista en la sección Eventos: Lista ↔ Calendario
let eventosView = 'lista';
function setEventosView(v){
  eventosView = v;
  const lt = document.getElementById('ev-view-tab-lista');
  const ct = document.getElementById('ev-view-tab-cal');
  if(lt) lt.classList.toggle('active', v==='lista');
  if(ct) ct.classList.toggle('active', v==='calendario');
  const lv = document.getElementById('eventos-lista-view');
  const cv = document.getElementById('eventos-cal-view');
  if(lv) lv.style.display = v==='lista' ? '' : 'none';
  if(cv) cv.style.display = v==='calendario' ? '' : 'none';
  if(v==='calendario') renderCalendario(); else renderEventos();
}
window.setEventosView = setEventosView;

// Cableado robusto de los botones de vista (por si el onclick inline no dispara)
function initEventosToggle(){
  const lt = document.getElementById('ev-view-tab-lista');
  const ct = document.getElementById('ev-view-tab-cal');
  if(lt && !lt.dataset.wired){ lt.dataset.wired = '1'; lt.addEventListener('click', () => setEventosView('lista')); }
  if(ct && !ct.dataset.wired){ ct.dataset.wired = '1'; ct.addEventListener('click', () => setEventosView('calendario')); }
}
window.initEventosToggle = initEventosToggle;

function renderCalendario(){
  const [y, m] = calMes.split('-').map(Number);
  const label = document.getElementById('cal-mes-label');
  if(label) label.textContent = fmtMonth(calMes);

  const firstDay = new Date(y, m-1, 1);
  const lastDay = new Date(y, m, 0);
  const startWd = firstDay.getDay();

  const mesEvents = eventosData.filter(ev => (ev.fecha||'').startsWith(calMes));

  const ESTADO_BG = {
    'Pedidos Pendientes':'#E8E4DC',
    'En Proceso':'#EBF0E8',
    'Pendiente de Colocacion':'#FDF0E8',
    'Confirmado':'#EBF5E8',
    'Pedidos Finalizados':'#E8F0F8'
  };

  const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  let html = `<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px;margin-bottom:2px">
    ${days.map(d=>`<div style="text-align:center;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);padding:8px 0;overflow:hidden;text-overflow:ellipsis">${d}</div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px">`;

  for(let i=0; i<startWd; i++) html += `<div style="min-height:100px;min-width:0"></div>`;

  for(let d=1; d<=lastDay.getDate(); d++){
    const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayEvents = mesEvents.filter(ev => ev.fecha === dateStr);
    const isToday = dateStr === TODAY_ISO;
    html += `<div style="min-height:100px;min-width:0;overflow:hidden;border:1px solid var(--light-gray);border-radius:6px;padding:6px;background:${isToday?'var(--blush-light)':'var(--warm-white)'}">
      <div style="font-size:12px;font-weight:${isToday?'700':'400'};color:${isToday?'var(--blush)':'var(--mid-gray)'};margin-bottom:4px">${d}</div>
      ${dayEvents.map(ev=>{
        const arr = ev.arreglos||[];
        const totalArr = arr.reduce((s,a)=>s+(+a.qty||0),0);
        const arrDetalle = arr.length ? ' · Arreglos: '+arr.map(a=>`${a.qty}× ${a.arreglo}`).join(', ') : '';
        const arrBadge = totalArr ? `<span style="background:var(--blush-light);color:#7A3A2A;border-radius:10px;padding:0 5px;font-size:9.5px;font-weight:700;margin-left:4px;flex-shrink:0">🌸${totalArr}</span>` : '';
        return `<div onclick="openEventoDetail(${eventosData.indexOf(ev)})" style="background:${ESTADO_BG[ev.estado]||'#E8E4DC'};border-radius:4px;padding:3px 6px;margin-bottom:3px;font-size:11px;cursor:pointer;line-height:1.3;display:flex;align-items:center;overflow:hidden" title="${esc(ev.nombre)} · ${esc(ev.estado)}${esc(arrDetalle)}"><span style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${esc(ev.nombre)}</span>${arrBadge}</div>`;
      }).join('')}
    </div>`;
  }
  html += '</div>';

  html += `<div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">
    ${Object.entries(ESTADO_BG).map(([k,v])=>`<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--mid-gray)"><span style="width:12px;height:12px;border-radius:3px;background:${v};display:inline-block"></span>${k}</div>`).join('')}
  </div>`;

  const el = document.getElementById('cal-grid');
  if(el) el.innerHTML = html;
}

function calPrevMonth(){
  const [y,m] = calMes.split('-').map(Number);
  const prev = new Date(y, m-2, 1);
  calMes = `${prev.getFullYear()}-${String(prev.getMonth()+1).padStart(2,'0')}`;
  renderCalendario();
}
function calNextMonth(){
  const [y,m] = calMes.split('-').map(Number);
  const next = new Date(y, m, 1);
  calMes = `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}`;
  renderCalendario();
}

// ── PROVEEDORES ───────────────────────────────────────────────────────────────
function renderProveedores(){
  const search = (document.getElementById('prov-search')?.value||'').toLowerCase();
  const rubro = document.getElementById('prov-rubro')?.value||'';
  const list = (window.proveedoresList||[]).filter(p=>{
    const mSearch = !search || p.nombre?.toLowerCase().includes(search) || p.contacto?.toLowerCase().includes(search);
    const mRubro = !rubro || p.rubro === rubro;
    return mSearch && mRubro;
  });
  const el = document.getElementById('prov-list');
  if(!el) return;
  if(!list.length){
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--mid-gray)">No hay proveedores registrados. Agregá el primero.</div>';
    return;
  }
  const RUBRO_ICON = {Flores:'🌸',Insumos:'📦',Packaging:'🎁',Otros:'🏭'};
  el.innerHTML = `<div class="table-wrapper"><table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr>
      <th style="text-align:left;padding:10px 14px;font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--mid-gray);border-bottom:2px solid var(--light-gray);background:var(--warm-white)">Proveedor</th>
      <th style="text-align:left;padding:10px 14px;font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--mid-gray);border-bottom:2px solid var(--light-gray);background:var(--warm-white)">Rubro</th>
      <th style="text-align:left;padding:10px 14px;font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--mid-gray);border-bottom:2px solid var(--light-gray);background:var(--warm-white)">Contacto</th>
      <th style="text-align:left;padding:10px 14px;font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--mid-gray);border-bottom:2px solid var(--light-gray);background:var(--warm-white)">Teléfono</th>
      <th style="text-align:left;padding:10px 14px;font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--mid-gray);border-bottom:2px solid var(--light-gray);background:var(--warm-white)">Email</th>
      <th style="padding:10px 14px;border-bottom:2px solid var(--light-gray);background:var(--warm-white)"></th>
    </tr></thead>
    <tbody>${list.map((p)=>{
      const realIdx = (window.proveedoresList||[]).indexOf(p);
      return `<tr style="cursor:pointer" onclick="openProveedorModal(${realIdx})">
        <td style="padding:10px 14px;border-bottom:1px solid var(--light-gray);font-weight:600">${RUBRO_ICON[p.rubro]||'🏭'} ${esc(p.nombre||'—')}</td>
        <td style="padding:10px 14px;border-bottom:1px solid var(--light-gray)">${esc(p.rubro||'—')}</td>
        <td style="padding:10px 14px;border-bottom:1px solid var(--light-gray)">${esc(p.contacto||'—')}</td>
        <td style="padding:10px 14px;border-bottom:1px solid var(--light-gray)">${p.telefono?`<a href="tel:${esc(p.telefono)}" onclick="event.stopPropagation()">${esc(p.telefono)}</a>`:'—'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid var(--light-gray)">${p.email?`<a href="mailto:${esc(p.email)}" onclick="event.stopPropagation()">${esc(p.email)}</a>`:'—'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid var(--light-gray);text-align:right">
          <button class="btn-icon" onclick="event.stopPropagation();eliminarProveedor(${realIdx})" title="Eliminar">🗑</button>
        </td>
      </tr>
      ${p.notas?`<tr onclick="openProveedorModal(${realIdx})" style="cursor:pointer"><td colspan="6" style="padding:4px 14px 10px;border-bottom:1px solid var(--light-gray);font-size:12px;color:var(--mid-gray)">${esc(p.notas)}</td></tr>`:''}`;
    }).join('')}</tbody>
  </table></div>`;
}

function openProveedorModal(idx){
  const p = idx != null ? (window.proveedoresList||[])[idx] : {};
  let ov = document.getElementById('prov-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='prov-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="modal">
    <button class="modal-close" onclick="closeModal('prov-modal')">✕</button>
    <div class="modal-title">${idx!=null?'Editar':'Nuevo'} Proveedor</div>
    <div class="modal-row">
      <div class="form-group"><label class="form-label">Nombre *</label><input class="form-input-modal" id="prov-nombre" value="${esc(p.nombre||'')}"></div>
      <div class="form-group"><label class="form-label">Rubro</label><select class="form-input-modal" id="prov-rubro-sel">
        ${['Flores','Insumos','Packaging','Otros'].map(r=>`<option${r===(p.rubro||'')?' selected':''}>${r}</option>`).join('')}
      </select></div>
    </div>
    <div class="modal-row">
      <div class="form-group"><label class="form-label">Contacto</label><input class="form-input-modal" id="prov-contacto" value="${esc(p.contacto||'')}"></div>
      <div class="form-group"><label class="form-label">Teléfono</label><input class="form-input-modal" id="prov-tel" value="${esc(p.telefono||'')}" type="tel"></div>
    </div>
    <div class="form-group"><label class="form-label">Email</label><input class="form-input-modal" id="prov-email" value="${esc(p.email||'')}" type="email"></div>
    <div class="form-group"><label class="form-label">Notas</label><textarea class="form-input-modal" id="prov-notas" rows="3">${esc(p.notas||'')}</textarea></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal('prov-modal')">Cancelar</button>
      <button class="btn-add" onclick="guardarProveedor(${idx!=null?idx:'null'})">Guardar</button>
    </div>
  </div>`;
  ov.classList.add('open');
}

function guardarProveedor(idx){
  const nombre = document.getElementById('prov-nombre')?.value?.trim();
  if(!nombre){ showToast('Ingresá el nombre del proveedor'); return; }
  const p = {
    nombre,
    rubro: document.getElementById('prov-rubro-sel')?.value||'Otros',
    contacto: document.getElementById('prov-contacto')?.value?.trim()||'',
    telefono: document.getElementById('prov-tel')?.value?.trim()||'',
    email: document.getElementById('prov-email')?.value?.trim()||'',
    notas: document.getElementById('prov-notas')?.value?.trim()||''
  };
  const list = [...(window.proveedoresList||[])];
  if(idx != null) list[idx] = p; else list.push(p);
  window.proveedoresList = list;
  fbSave('proveedoresList', list);
  closeModal('prov-modal');
  renderProveedores();
  showToast('✅ Proveedor guardado');
}

async function eliminarProveedor(idx){
  if(!await confirmModal('¿Eliminar este proveedor?')) return;
  const list = [...(window.proveedoresList||[])];
  list.splice(idx,1);
  window.proveedoresList = list;
  fbSave('proveedoresList', list);
  renderProveedores();
  showToast('Proveedor eliminado');
}

// ── RENTABILIDAD POR EVENTO ───────────────────────────────────────────────────
// ── RENTABILIDAD TABS ─────────────────────────────────────────────────────────
let _rentTab = 'eventos';
let arreglosHotelConfig = {}; // { nombreArreglo: { precioHyatt, cantMensual } }
let arreglosComposicion = {}; // { zonaChecklist: [{prod, qty}] } — qué flores/varas lleva cada arreglo

window._setArreglosHotelConfig = v => { arreglosHotelConfig = v || {}; };
// Bandera: recién cuando Firebase entregó las composiciones al menos una vez se
// permite guardarlas/borrarlas. Evita el borrado por carrera: si se edita una
// zona con el objeto local todavía vacío (aún no sincronizó), el fbSave del
// objeto completo pisaría TODAS las demás composiciones en Firebase.
let _arreglosComposicionLoaded = false;
// Normaliza lo que viene de Firebase a { zona: [ings] }. Acepta el formato NUEVO
// (lista [{zona, ings}], apto para Firebase) y el VIEJO ({ "zona": [ings] }).
function _normArreglosComposicion(v){
  const obj = {};
  if(!v) return obj;
  const entries = Array.isArray(v) ? v : Object.values(v);
  const esNuevo = entries.length && entries.every(x => x && typeof x==='object' && !Array.isArray(x) && ('zona' in x));
  if(esNuevo){
    entries.forEach(x => { if(x.zona) obj[x.zona] = Array.isArray(x.ings) ? x.ings : Object.values(x.ings||{}); });
  } else if(typeof v === 'object' && !Array.isArray(v)){
    Object.entries(v).forEach(([k,val]) => { obj[k] = Array.isArray(val) ? val : Object.values(val||{}); });
  }
  return obj;
}
window._setArreglosComposicion = v => { arreglosComposicion = _normArreglosComposicion(v); _arreglosComposicionLoaded = true; };
// Guarda las composiciones del hotel como LISTA [{zona, ings}]. Clave = índice
// numérico, así los nombres con "/", "." etc. (ej. "Gioia mesitas (c/u)") ya no
// rompen la escritura a Firebase (RTDB no permite esos caracteres en las claves).
function _saveArreglosComposicion(){
  const arr = Object.entries(arreglosComposicion).map(([zona, ings]) => ({ zona, ings: ings||[] }));
  fbSave('arreglosComposicion', arr);
}

// Costo de un arreglo = Σ (varas equivalentes) × costo por vara. Los ingredientes
// en "paq" se convierten a varas con las varas por paquete de Compras.
function calcCostoArreglo(zona){
  return (arreglosComposicion[zona]||[]).reduce((s,ing)=>s+cotizadorPrecioVara(ing.prod)*_ingVaras(ing),0);
}

function rentSetTab(tab){
  _rentTab = tab;
  document.getElementById('rent-panel-eventos').style.display = tab === 'eventos' ? '' : 'none';
  document.getElementById('rent-panel-hotel').style.display  = tab === 'hotel'   ? '' : 'none';
  const btnEv    = document.getElementById('rent-tab-eventos');
  const btnHotel = document.getElementById('rent-tab-hotel');
  if(btnEv){
    btnEv.style.color       = tab === 'eventos' ? 'var(--sage-dark)' : 'var(--mid-gray)';
    btnEv.style.borderBottomColor = tab === 'eventos' ? 'var(--sage-dark)' : 'transparent';
  }
  if(btnHotel){
    btnHotel.style.color       = tab === 'hotel' ? 'var(--sage-dark)' : 'var(--mid-gray)';
    btnHotel.style.borderBottomColor = tab === 'hotel' ? 'var(--sage-dark)' : 'transparent';
  }
  if(tab === 'hotel') renderRentabilidadHotel();
}

function saveArregloHotelConfig(nombre, field, val){
  if(!arreglosHotelConfig[nombre]) arreglosHotelConfig[nombre] = {};
  arreglosHotelConfig[nombre][field] = +val || 0;
  fbSave('arreglosHotelConfig', arreglosHotelConfig);
  renderRentabilidadHotel();
}

// ── Lista de compra del hotel ────────────────────────────────────────────────
// Suma las composiciones de TODOS los arreglos del hotel × su cantidad (la misma
// que se edita en Rentabilidad Hotel) para saber cuánto hay que comprar. Separa
// varas de paquetes (son unidades distintas) y no las mezcla.
function listaCompraHotel(){
  const varas = {}, paq = {};
  let zonas = 0;
  Object.keys(arreglosComposicion||{}).forEach(zona=>{
    const ings = arreglosComposicion[zona] || [];
    if(!ings.length) return;
    zonas++;
    const cant = +(arreglosHotelConfig[zona]?.cantidad) > 0 ? +arreglosHotelConfig[zona].cantidad : 1;
    ings.forEach(g=>{
      const q = (parseFloat(g.qty)||0) * cant;
      if(!q) return;
      const bag = g.unidad==='paq' ? paq : varas;
      bag[g.prod] = (bag[g.prod]||0) + q;
    });
  });
  const toList = obj => Object.entries(obj).map(([prod,qty])=>({prod,qty})).sort((a,b)=>b.qty-a.qty);
  return { varas: toList(varas), paq: toList(paq), zonas };
}

function openListaCompraHotel(){
  const { varas, paq, zonas } = listaCompraHotel();
  const fila = ({prod,qty}) => {
    const comprar = Math.ceil(qty - 1e-9);
    const exacto = Math.abs(comprar - qty) > 0.01 ? ` <span style="color:var(--mid-gray);font-size:11px">(exacto ${_fmtCant(qty)})</span>` : '';
    return `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:7px 0;border-bottom:1px solid var(--light-gray)">
      <span>${esc(prod)}${exacto}</span><strong style="white-space:nowrap;font-size:15px">${comprar}</strong></div>`;
  };
  const bloque = (titulo, list) => list.length ? `
    <div style="margin-bottom:16px">
      <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray);font-weight:600;margin-bottom:4px">${titulo}</div>
      ${list.map(fila).join('')}
    </div>` : '';

  const txtList = list => list.map(r=>`• ${r.prod}: ${Math.ceil(r.qty-1e-9)}`).join('\n');
  window._listaCompraHotelTexto = `🛒 Compra para cubrir el hotel\n\n🌿 VARAS:\n${txtList(varas)||'—'}\n\n📦 PAQUETES:\n${txtList(paq)||'—'}`;

  let ov = document.getElementById('lista-compra-hotel-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='lista-compra-hotel-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  const vacio = !varas.length && !paq.length;
  ov.innerHTML = `<div class="modal" style="max-width:480px">
    <button class="modal-close" onclick="closeModal('lista-compra-hotel-modal')">✕</button>
    <div class="modal-title">🛒 Lista de compra del hotel</div>
    <div style="font-size:12px;color:var(--mid-gray);margin:-6px 0 14px">Suma de las composiciones × la cantidad de cada arreglo · ${zonas} arreglo${zonas!==1?'s':''} con composición</div>
    ${vacio
      ? '<p style="color:var(--mid-gray);font-size:13px;padding:16px;text-align:center">No hay arreglos con composición cargada. Cargalos en <strong>Composiciones › Arreglos del hotel</strong> («📋 Cargar catálogo base»).</p>'
      : bloque('🌿 Varas', varas) + bloque('📦 Paquetes', paq) + '<div style="font-size:11px;color:var(--mid-gray);margin-top:8px">Las flores con «/» son opciones: comprás esa cantidad de una de las dos. La cantidad de cada arreglo se ajusta en la tabla de abajo (columna «Cant.»).</div>'}
    ${vacio ? '' : `<div class="modal-actions" style="margin-top:18px">
      <button class="btn-secondary" onclick="closeModal('lista-compra-hotel-modal')">Cerrar</button>
      <button class="btn-add" onclick="listaCompraHotelCopiar()">📋 Copiar lista</button>
    </div>`}
  </div>`;
  ov.classList.add('open');
}
function listaCompraHotelCopiar(){
  const txt = window._listaCompraHotelTexto || '';
  (navigator.clipboard?.writeText(txt) || Promise.reject()).then(
    ()=>showToast('📋 Lista copiada — lista para WhatsApp'),
    ()=>showToast('No se pudo copiar')
  );
}

function renderRentabilidadHotel(){
  const tbody   = document.getElementById('rent-hotel-body');
  const kpisEl  = document.getElementById('rent-hotel-kpis');
  if(!tbody) return;

  // Selector "+ definir arreglo": zonas del checklist que aún no tienen composición
  const selAdd = document.getElementById('rent-arreglo-add');
  if(selAdd){
    const zonasCheck = [...new Set(CL_TASKS.map(t=>t.zona))].sort((a,b)=>a.localeCompare(b,'es'));
    const pendientes = zonasCheck.filter(z => !((arreglosComposicion[z]||[]).length));
    selAdd.innerHTML = '<option value="">+ Definir composición de un arreglo…</option>' +
      pendientes.map(z=>`<option value="${esc(z)}">${esc(z)}</option>`).join('');
  }

  // Mes para el costo real (default: mes actual)
  const mesEl = document.getElementById('rent-hotel-mes');
  if(mesEl && !mesEl.value){ const n=new Date(); mesEl.value = n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0'); }
  const mes = mesEl?.value || '';

  // Costo REAL por arreglo = compras de florería asignadas a esa área en el mes
  const costoRealPorArea = {};
  (comprasFlore||[]).forEach(c => {
    if(c.anulado) return;
    if(mes && (c.fecha||'').slice(0,7) !== mes) return;
    const area = (c.sector||'').trim();
    if(area) costoRealPorArea[area] = (costoRealPorArea[area]||0) + _compraImporte(c);
  });

  // Arreglos a mostrar: EXACTAMENTE los que tienen composición cargada en
  // Composiciones › Arreglos del hotel. (No se listan zonas que solo tengan
  // un precio Hyatt sin composición, para que no aparezcan sueltas.)
  const arreglos = Object.keys(arreglosComposicion||{})
    .filter(z => (arreglosComposicion[z]||[]).length)
    .sort((a,b)=>a.localeCompare(b,'es'));

  const alertasMargen = [], alertasSinCosto = [], alertasDesvio = [];
  let totalCosto = 0, totalFact = 0, totalReal = 0;
  const th = 'padding:9px 14px;border-bottom:1px solid var(--light-gray)';
  tbody.innerHTML = arreglos.map(zona => {
    const ings        = arreglosComposicion[zona] || [];
    const cfg         = arreglosHotelConfig[zona] || {};
    const cantidad    = +cfg.cantidad > 0 ? +cfg.cantidad : 1;
    const costoUnit   = Math.round(calcCostoArreglo(zona));
    const costo       = costoUnit * cantidad; // costo total (unidad × cantidad)
    const costoReal   = Math.round(costoRealPorArea[zona] || 0);
    const precioHyatt = cfg.precioHyatt || 0;
    const margen      = precioHyatt - costo;
    const margenPct   = precioHyatt > 0 ? (margen / precioHyatt * 100).toFixed(1) : null;
    totalCosto += costo; totalFact += precioHyatt; totalReal += costoReal;
    const mc = margenPct != null ? (+margenPct > 40 ? 'var(--green-ok)' : +margenPct > 20 ? 'var(--amber)' : 'var(--red-alert)') : 'var(--mid-gray)';
    const zEsc = esc(zona).replace(/'/g,"\\'");
    const resumen = ings.length
      ? ings.map(g=>`${_fmtIngUnidad(g)} ${esc(g.prod)}`).join(', ')
      : '<span style="color:var(--amber)">Sin composición cargada</span>';
    const faltaPrecio = ings.some(g => !cotizadorPrecioVara(g.prod));
    // Desvío real vs teórico
    let desvioHTML = '<span style="color:var(--mid-gray)">—</span>';
    if(costo>0 && costoReal>0){
      const dp = Math.round((costoReal-costo)/costo*100);
      const dcol = Math.abs(dp)<=15 ? 'var(--green-ok)' : Math.abs(dp)<=35 ? 'var(--amber)' : 'var(--red-alert)';
      desvioHTML = `<span style="color:${dcol};font-weight:600">${dp>0?'+':''}${dp}%</span>`;
      if(dp>35) alertasDesvio.push(`${zona} (+${dp}% sobre lo previsto)`);
    }
    // Recolectar alertas
    if(precioHyatt && margen<0) alertasMargen.push(zona);
    if(faltaPrecio) alertasSinCosto.push(zona);
    return `<tr>
      <td style="${th};font-weight:500;white-space:nowrap">📍 ${esc(zona)}</td>
      <td style="${th};font-size:11px;color:var(--mid-gray);max-width:240px">${resumen}${faltaPrecio?' <span title="Falta el costo por vara de alguna flor (cargá su compra recibida)">⚠️</span>':''}</td>
      <td style="${th};text-align:center">
        <input type="number" min="1" value="${cantidad}" title="Cantidad de arreglos de este tipo"
          style="width:60px;text-align:center;border:1px solid var(--light-gray);border-radius:6px;padding:4px 6px;font-size:13px;outline:none;background:var(--warm-white);color:var(--charcoal)"
          onchange="saveArregloHotelConfig('${zEsc}','cantidad',this.value)">
      </td>
      <td style="${th};text-align:right;color:var(--mid-gray)">$${costo.toLocaleString('es-AR')}${cantidad>1?`<div style="font-size:10px">$${costoUnit.toLocaleString('es-AR')} c/u</div>`:''}</td>
      <td style="${th};text-align:right;color:var(--charcoal)">${costoReal?'$'+costoReal.toLocaleString('es-AR'):'<span style="color:var(--mid-gray)">—</span>'}</td>
      <td style="${th};text-align:right">${desvioHTML}</td>
      <td style="${th};text-align:right">
        <input type="number" min="0" value="${precioHyatt||''}" placeholder="$"
          style="width:96px;text-align:right;border:1px solid var(--light-gray);border-radius:6px;padding:4px 8px;font-size:13px;outline:none;background:var(--warm-white);color:var(--charcoal)"
          onchange="saveArregloHotelConfig('${zEsc}','precioHyatt',this.value)">
      </td>
      <td style="${th};text-align:right;font-weight:600;color:${precioHyatt? (margen>=0?'var(--green-ok)':'var(--red-alert)') : 'var(--mid-gray)'}">${precioHyatt ? '$'+margen.toLocaleString('es-AR') : '—'}</td>
      <td style="${th};text-align:right;font-weight:700;color:${mc}">${margenPct != null ? margenPct+'%' : '—'}</td>
      <td style="${th};text-align:center;white-space:nowrap"><button class="btn-secondary" style="font-size:11px;padding:4px 10px" onclick="openArregloComposicion('${zEsc}')">✏️ Composición</button></td>
    </tr>`;
  }).join('') || `<tr><td colspan="10" style="padding:22px;text-align:center;color:var(--mid-gray)">No hay arreglos con composición cargada. Cargalos en <strong>Composiciones › Arreglos del hotel</strong> (botón «📋 Cargar catálogo base») o con el selector de arriba.</td></tr>`;

  // Panel de alertas
  const alEl = document.getElementById('rent-hotel-alertas');
  if(alEl){
    const bloques = [];
    if(alertasMargen.length)  bloques.push(`<div style="color:#8B2020">🔴 <strong>Margen negativo</strong> (el costo supera el precio Hyatt): ${alertasMargen.map(esc).join(', ')}</div>`);
    if(alertasDesvio.length)  bloques.push(`<div style="color:#8A6D00">⚠️ <strong>Costo real muy por encima del teórico</strong>: ${alertasDesvio.map(esc).join(', ')}</div>`);
    if(alertasSinCosto.length)bloques.push(`<div style="color:#8A6D00">🌸 <strong>Flores sin costo por vara</strong> (cargá su compra recibida): ${[...new Set(alertasSinCosto)].map(esc).join(', ')}</div>`);
    alEl.innerHTML = bloques.length
      ? `<div style="background:#FFFBF0;border:1px solid #E9DCae;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:12.5px;display:flex;flex-direction:column;gap:6px">${bloques.join('')}</div>`
      : '';
  }

  const margenGlobal = totalFact > 0 ? ((totalFact - totalCosto) / totalFact * 100).toFixed(1) : '—';
  if(kpisEl) kpisEl.innerHTML = `
    <div class="card"><div class="card-label">Arreglos definidos</div><div class="card-value" style="font-size:32px">${arreglos.length}</div></div>
    <div class="card"><div class="card-label">Costo teórico</div><div class="card-value" style="font-size:26px">$${totalCosto.toLocaleString('es-AR')}</div></div>
    <div class="card"><div class="card-label">Costo real (mes)</div><div class="card-value" style="font-size:26px;color:${totalReal>totalCosto*1.15?'var(--red-alert)':'var(--charcoal)'}">$${totalReal.toLocaleString('es-AR')}</div></div>
    <div class="card"><div class="card-label">Margen global hotel</div><div class="card-value ${+margenGlobal>40?'green':+margenGlobal>20?'amber':'red'}" style="font-size:32px">${margenGlobal}%</div></div>`;
}

// Elegir un arreglo del checklist desde el selector para cargarle la composición
function rentAddArreglo(sel){
  const z = sel.value;
  if(!z) return;
  sel.value = '';
  openArregloComposicion(z);
}

// ── Editor de composición de un arreglo (qué flores/varas lleva) ──────────────
let _compEditZona = null;
let _compEditRows = [];

function _floresDatalistOpts(){
  const all = [...new Set([...insumosBDBase, ...(typeof insumosCustom!=='undefined'?insumosCustom:[]), ...Object.keys(cotizadorPrecios||{})])]
    .filter(Boolean).sort((a,b)=>a.localeCompare(b,'es'));
  return all.map(n=>`<option value="${esc(n)}">`).join('');
}

function openArregloComposicion(zona){
  _compEditZona = zona;
  _compEditRows = JSON.parse(JSON.stringify(arreglosComposicion[zona] || []));
  if(!_compEditRows.length) _compEditRows = [{prod:'', qty:''}];
  _renderCompModal();
}

function _renderCompModal(){
  let ov = document.getElementById('arreglo-comp-modal');
  if(!ov){ ov = document.createElement('div'); ov.id='arreglo-comp-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  const rowsHTML = _compEditRows.map((r,i)=>{
    // Resuelve opciones "A / B": toma el costo por vara de la opción con dato.
    const cvInfo = resolveCotizadorPrecio(r.prod);
    const cv  = cvInfo.pu;
    const opcion = (cvInfo.fuente && cvInfo.fuente !== r.prod) ? cvInfo.fuente : '';
    const esPaq = r.unidad === 'paq';
    const varas = _ingVaras(r);                       // cantidad en varas (paq → × varas/paq)
    const vpp = esPaq ? _varasPorPaqResuelto(r.prod) : 0;
    const sub = cv * varas;
    const sinCosto = r.prod && !cv;
    const faltaVpp = esPaq && (+r.qty>0) && !vpp;      // paq sin varas/paq cargadas
    return `<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
      <input list="comp-flor-list" value="${esc(r.prod)}" placeholder="Flor / follaje (opciones: A / B / C)" onchange="compUpdRow(${i},'prod',this.value)"
        style="flex:1;min-width:0;border:1px solid var(--light-gray);border-radius:6px;padding:5px 8px;font-size:12.5px;background:var(--warm-white);color:var(--charcoal)">
      <input type="number" min="0" value="${esc(r.qty)}" placeholder="cant." onchange="compUpdRow(${i},'qty',this.value)"
        style="width:52px;text-align:center;border:1px solid var(--light-gray);border-radius:6px;padding:5px 4px;font-size:12.5px;background:var(--warm-white);color:var(--charcoal)">
      <select onchange="compUpdRow(${i},'unidad',this.value)" title="Unidad" style="width:62px;border:1px solid var(--light-gray);border-radius:6px;padding:5px 2px;font-size:11.5px;background:var(--warm-white);color:var(--charcoal)">
        <option value="vara"${!esPaq?' selected':''}>varas</option>
        <option value="paq"${esPaq?' selected':''}>paq</option>
      </select>
      <span style="width:58px;text-align:right;font-size:11px;color:${sinCosto?'var(--amber)':'var(--mid-gray)'}"${opcion?` title="Costo tomado de la opción: ${esc(opcion)}"`:''}>${cv?(opcion?'≈':'')+'$'+cv.toLocaleString('es-AR')+'/v':(r.prod?'sin costo':'—')}</span>
      <span style="width:82px;text-align:right;font-size:12.5px;font-weight:600">${sub?'$'+Math.round(sub).toLocaleString('es-AR'):(faltaVpp?'<span style="font-size:9px;color:var(--amber);font-weight:500">falta varas/paq</span>':'')}${esPaq&&vpp?`<div style="font-size:9px;color:var(--mid-gray);font-weight:500">${_fmtCant(varas)} varas</div>`:''}</span>
      <button class="btn-icon" style="color:var(--red-alert)" title="Quitar" onclick="compRemoveRow(${i})">✕</button>
    </div>`;
  }).join('');
  const total  = _compEditRows.reduce((s,r)=>s+cotizadorPrecioVara(r.prod)*_ingVaras(r),0);
  const faltan = [...new Set(_compEditRows.filter(r=>r.prod && !cotizadorPrecioVara(r.prod)).map(r=>r.prod))];
  ov.innerHTML = `<div class="modal" style="max-width:560px;max-height:88vh;overflow-y:auto">
    <button class="modal-close" onclick="closeModal('arreglo-comp-modal')">✕</button>
    <div class="modal-title">🫙 Composición · ${esc(_compEditZona)}</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:14px">Cargá qué flores lleva y la cantidad. Si un producto va por <strong>paquete</strong> (ej. Monstera, Limonium), elegí «paq» y se convierte a varas con las varas por paquete de <strong>Compras</strong>. El costo por vara también sale de Compras.</div>
    <datalist id="comp-flor-list">${_floresDatalistOpts()}</datalist>
    <div style="display:flex;gap:6px;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--mid-gray);margin-bottom:5px">
      <span style="flex:1">Flor / follaje</span><span style="width:52px;text-align:center">Cant.</span><span style="width:62px;text-align:center">Unidad</span><span style="width:58px;text-align:right">$/vara</span><span style="width:82px;text-align:right">Subtotal</span><span style="width:28px"></span>
    </div>
    ${rowsHTML}
    <button class="btn-secondary" style="font-size:11px;margin-top:4px" onclick="compAddRow()">+ Agregar flor</button>
    ${faltan.length?`<div style="font-size:11px;color:var(--amber);margin-top:10px">⚠️ Sin costo por vara todavía: ${esc(faltan.join(', '))}. Cargá su compra recibida en Compras para que se calcule.</div>`:''}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid var(--light-gray)">
      <div style="font-size:13px;color:var(--mid-gray)">Costo del arreglo: <strong style="font-size:17px;color:var(--charcoal)">$${Math.round(total).toLocaleString('es-AR')}</strong></div>
      <button class="btn-add" onclick="guardarArregloComposicion()">Guardar</button>
    </div>
  </div>`;
  ov.classList.add('open');
}

function compUpdRow(i, field, val){ if(_compEditRows[i]){ _compEditRows[i][field] = val; _renderCompModal(); } }
function compAddRow(){ _compEditRows.push({prod:'', qty:''}); _renderCompModal(); }
function compRemoveRow(i){ _compEditRows.splice(i,1); if(!_compEditRows.length) _compEditRows=[{prod:'',qty:''}]; _renderCompModal(); }

function guardarArregloComposicion(){
  if(!_arreglosComposicionLoaded){
    showToast('⏳ Las composiciones todavía se están cargando. Esperá unos segundos e intentá de nuevo.');
    return;
  }
  const rows = _compEditRows
    .filter(r => r.prod && r.prod.trim() && (+r.qty)>0)
    .map(r => ({prod:r.prod.trim(), qty:+r.qty, ...(r.unidad==='paq'?{unidad:'paq'}:{})}));
  if(rows.length) arreglosComposicion[_compEditZona] = rows;
  else delete arreglosComposicion[_compEditZona];
  _saveArreglosComposicion();
  closeModal('arreglo-comp-modal');
  renderRentabilidadHotel();       // refresca la vista de rentabilidad (si está activa)
  renderComposicionesHotel();      // refresca la solapa Hotel de Composiciones (si está activa)
  showToast('✅ Composición guardada');
}

// Valor hora del equipo para el costo de mano de obra de eventos
let eventLaborRate = 0;
window._setEventLaborRate = v => { eventLaborRate = +v || 0; };
function saveEventLaborRate(val){
  eventLaborRate = +val || 0;
  fbSave('eventLaborRate', eventLaborRate);
  renderRentabilidad();
}
function updEventoTraslado(idx, val){
  if(!eventosData[idx]) return;
  eventosData[idx].traslado = +val || 0;
  fbSave('eventosData', eventosData);
  renderRentabilidad();
}
// Horas cronometradas del evento: armado + colocación + retiro
function _eventoHorasTrabajo(ev){
  const dur=(a,b)=>{ if(!a||!b) return 0; const [h1,m1]=String(a).split(':').map(Number),[h2,m2]=String(b).split(':').map(Number); const d=(h2*60+m2)-(h1*60+m1); return d>0?d:0; };
  return (dur(ev.inicio,ev.fin) + dur(ev.colocacionInicio,ev.colocacionFin) + dur(ev.retiroInicio,ev.retiroFin))/60;
}
// Costo real del evento = insumos (costo estimado) + mano de obra + traslado
function _eventoCostoReal(ev){
  const insumos = +ev.costoEstimado||0;
  const manoObra = Math.round(_eventoHorasTrabajo(ev) * eventLaborRate);
  const traslado = +ev.traslado||0;
  return { insumos, manoObra, traslado, total: insumos+manoObra+traslado, horas: _eventoHorasTrabajo(ev) };
}

function renderRentabilidad(){
  const search = (document.getElementById('rent-search')?.value||'').toLowerCase();
  const tipoSel = document.getElementById('rent-tipo');
  const tipo = tipoSel?.value||'';
  const vhEl = document.getElementById('rent-valorhora');
  if(vhEl && document.activeElement!==vhEl) vhEl.value = eventLaborRate || '';

  if(tipoSel){
    const cur = tipoSel.value;
    const tipos = [...new Set(eventosData.map(e=>e.tipo).filter(Boolean))].sort();
    tipoSel.innerHTML = '<option value="">Todos los tipos</option>' + tipos.map(t=>`<option${t===cur?' selected':''}>${esc(t)}</option>`).join('');
    tipoSel.value = cur;
  }

  const filtered = eventosData.filter(ev=>{
    const m = !search || ev.nombre?.toLowerCase().includes(search) || ev.tipo?.toLowerCase().includes(search);
    const mt = !tipo || ev.tipo === tipo;
    return m && mt;
  }).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));

  // Precio del evento (del evento cargado) y costo de insumos (compras asociadas)
  const _precioEv = ev => parseMoney(ev.precio) || (+ev.presupuesto||0);
  const withPrecio = filtered.filter(ev => _precioEv(ev) > 0);
  const totalPrecio = withPrecio.reduce((s,e)=>s+_precioEv(e),0);
  const totalInsumos = filtered.reduce((s,e)=>s+gastoComprasEvento(e.id),0);
  const margenGlobal = totalPrecio > 0 ? ((totalPrecio - totalInsumos)/totalPrecio*100).toFixed(1) : '—';
  const kpisEl = document.getElementById('rent-kpis');
  if(kpisEl) kpisEl.innerHTML = `
    <div class="card"><div class="card-label">Eventos con precio</div><div class="card-value" style="font-size:32px">${withPrecio.length}</div></div>
    <div class="card"><div class="card-label">Total precio eventos</div><div class="card-value" style="font-size:28px">$${totalPrecio.toLocaleString('es-AR')}</div></div>
    <div class="card"><div class="card-label">Costo insumos total</div><div class="card-value" style="font-size:28px">$${Math.round(totalInsumos).toLocaleString('es-AR')}</div></div>
    <div class="card"><div class="card-label">Margen global</div><div class="card-value ${+margenGlobal>40?'green':+margenGlobal>20?'amber':'red'}" style="font-size:32px">${margenGlobal}%</div></div>`;

  const tbody = document.getElementById('rent-body');
  if(!tbody) return;
  if(!filtered.length){
    tbody.innerHTML = '<tr><td colspan="8" style="padding:24px;text-align:center;color:var(--mid-gray)">Sin eventos para mostrar.</td></tr>';
    _renderRentTiposSummary([]);
    return;
  }
  const td = 'padding:9px 12px;border-bottom:1px solid var(--light-gray)';
  tbody.innerHTML = filtered.map(ev=>{
    const idx = eventosData.indexOf(ev);
    const precio = _precioEv(ev);
    const insumos = gastoComprasEvento(ev.id);
    const margenMonto = precio - insumos;
    const margenPct = precio > 0 ? ((margenMonto)/precio*100).toFixed(1) : null;
    const margenColor = margenPct != null ? (+margenPct > 40 ? 'var(--green-ok)' : +margenPct > 20 ? 'var(--amber)' : 'var(--red-alert)') : 'var(--mid-gray)';
    // Mano de obra = solo horas de armado (inicio–fin), sin colocación ni retiro.
    const minsArmado = calcDuracion(ev.inicio, ev.fin);
    return `<tr>
      <td style="${td};font-weight:500;cursor:pointer" onclick="openEventoDetail(${idx})">${esc(ev.nombre||'—')}</td>
      <td style="${td}">${fmtDate(ev.fecha)}</td>
      <td style="${td}">${esc(ev.tipo||'—')}</td>
      <td style="${td};text-align:right;font-weight:500">${precio?'$'+precio.toLocaleString('es-AR'):'<span style="color:var(--mid-gray)">—</span>'}</td>
      <td style="${td};text-align:right;color:var(--mid-gray)">${insumos?'$'+Math.round(insumos).toLocaleString('es-AR'):'<span style="color:var(--mid-gray)">—</span>'}</td>
      <td style="${td};text-align:center;color:var(--charcoal)"${minsArmado?` title="Armado${ev.asignado?' · '+esc(ev.asignado):''}: ${esc(ev.inicio||'')}–${esc(ev.fin||'')}"`:''}>${minsArmado?fmtDur(minsArmado):'<span style="color:var(--mid-gray)">—</span>'}</td>
      <td style="${td};text-align:right;font-weight:700;color:${margenColor}">${margenPct!=null?margenPct+'%':'—'}${precio||insumos?`<div style="font-size:10px;color:var(--mid-gray);font-weight:500">$${Math.round(margenMonto).toLocaleString('es-AR')}</div>`:''}</td>
      <td style="${td}"><span style="padding:2px 10px;border-radius:20px;font-size:11px;font-weight:500;${ESTADO_COLORS[ev.estado]||''}">${esc(ev.estado||'—')}</span></td>
    </tr>`;
  }).join('');

  _renderRentTiposSummary(withPrecio);
}

// Rentabilidad promedio por tipo de evento
function _renderRentTiposSummary(eventos){
  const el = document.getElementById('rent-tipos-summary');
  if(!el) return;
  const porTipo = {};
  eventos.forEach(ev=>{
    const t = ev.tipo || 'Sin tipo';
    const ppto = parseMoney(ev.precio) || (+ev.presupuesto||0);
    const real = gastoComprasEvento(ev.id);
    if(!porTipo[t]) porTipo[t] = { n:0, ppto:0, real:0 };
    porTipo[t].n++; porTipo[t].ppto+=ppto; porTipo[t].real+=real;
  });
  const tipos = Object.keys(porTipo).sort((a,b)=>{
    const ma = porTipo[a].ppto>0?(porTipo[a].ppto-porTipo[a].real)/porTipo[a].ppto:-1;
    const mb = porTipo[b].ppto>0?(porTipo[b].ppto-porTipo[b].real)/porTipo[b].ppto:-1;
    return mb-ma;
  });
  if(!tipos.length){ el.innerHTML=''; return; }
  el.innerHTML = `<div class="section-title" style="margin-bottom:10px">📊 Rentabilidad por tipo de evento</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
    ${tipos.map(t=>{
      const o=porTipo[t];
      const margen = o.ppto>0 ? ((o.ppto-o.real)/o.ppto*100) : null;
      const col = margen==null?'var(--mid-gray)':margen>40?'var(--green-ok)':margen>20?'var(--amber)':'var(--red-alert)';
      return `<div class="card" style="padding:14px 16px">
        <div style="font-size:13px;font-weight:600;color:var(--charcoal);margin-bottom:6px">${esc(t)}</div>
        <div style="font-size:28px;font-weight:700;color:${col};line-height:1">${margen!=null?margen.toFixed(1)+'%':'—'}</div>
        <div style="font-size:11px;color:var(--mid-gray);margin-top:5px">${o.n} evento${o.n!==1?'s':''} · factura $${Math.round(o.ppto).toLocaleString('es-AR')}</div>
      </div>`;
    }).join('')}</div>`;
}

// ── ALERTAS AUTOMÁTICAS ───────────────────────────────────────────────────────
function alertasAutomaticas(){
  if(Notification.permission !== 'granted') return;

  const bajos = (window.stockData||[]).filter(s => s.alerta === 'comprar');
  if(bajos.length > 0){
    setTimeout(()=>{
      new Notification('⚠️ Stock bajo', {
        body: `${bajos.length} insumo${bajos.length>1?'s':''} por reponer: ${bajos.slice(0,3).map(s=>s.nombre).join(', ')}${bajos.length>3?'...':''}`,
        icon: '/icon-192.png', tag: 'stock-bajo'
      });
    }, 3000);
  }

  const eventosHoyAl = (window.eventosData||[]).filter(ev => ev.fecha === TODAY_ISO && ev.estado !== 'Pedidos Finalizados');
  if(eventosHoyAl.length > 0){
    setTimeout(()=>{
      new Notification('📅 Eventos de hoy', {
        body: eventosHoyAl.map(e => e.nombre).join(' · '),
        icon: '/icon-192.png', tag: 'eventos-hoy'
      });
    }, 5000);
  }

  const now = new Date();
  const cierre = new Date();
  cierre.setHours(18,0,0,0);
  if(now < cierre){
    const delay = cierre.getTime() - now.getTime();
    setTimeout(()=>{
      if(Notification.permission === 'granted'){
        new Notification('💰 Recordatorio de caja', {
          body: 'Es hora de verificar y cerrar la caja del día.',
          icon: '/icon-192.png', tag: 'cierre-caja'
        });
      }
    }, delay);
  }
}

// ════════════════════════════════════════
// FEATURE 1: LEGAJO DIGITAL DE EMPLEADOS
// ════════════════════════════════════════
let legajoData = [];
window._setLegajoData = arr => { legajoData = arr; };

function renderLegajo(){
  const grid = document.getElementById('legajo-grid');
  if(!grid) return;
  if(!legajoData.length){
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--mid-gray)">Sin empleados registrados. Agregá el primero.</div>';
    return;
  }
  grid.innerHTML = legajoData.map((e,i)=>{
    const vac = (e.vacacionesAnuales||14) - (e.vacacionesTomadas||0);
    return `<div class="card">
      <div style="font-size:16px;font-weight:600;margin-bottom:4px">${esc(e.nombre)} ${esc(e.apellido)}</div>
      <div style="font-size:12px;color:var(--mid-gray);margin-bottom:8px;text-transform:capitalize">${esc(e.cargo||'')} · ${esc(e.sucursal||'')}</div>
      <div style="font-size:12px;margin-bottom:4px">📅 Ingreso: <strong>${e.fechaIngreso ? fmtDate(e.fechaIngreso) : '—'}</strong></div>
      <div style="font-size:12px;margin-bottom:4px">⏱ Horas contrato: <strong>${(+e.horasContrato||0)}h/mes</strong></div>
      <div style="font-size:12px;margin-bottom:12px">🏖️ Vacaciones restantes: <strong>${vac}</strong> días</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn-secondary" style="font-size:11px" onclick="verDetalleLegajo(${i})">Ver detalle</button>
        <button class="btn-secondary" style="font-size:11px" onclick="openLegajoModal(${i})">Editar</button>
        <button class="btn-icon" style="color:var(--red-alert)" onclick="eliminarLegajo(${i})">✕</button>
      </div>
    </div>`;
  }).join('');
}

function openLegajoModal(idx){
  const e = idx >= 0 ? legajoData[idx] : {};
  document.getElementById('legajo-modal-title').textContent = idx >= 0 ? 'Editar Empleado' : 'Nuevo Empleado';
  document.getElementById('leg-idx').value = idx;
  document.getElementById('leg-nombre').value = e.nombre||'';
  document.getElementById('leg-apellido').value = e.apellido||'';
  document.getElementById('leg-dni').value = e.dni||'';
  document.getElementById('leg-fechaIngreso').value = e.fechaIngreso||'';
  document.getElementById('leg-cargo').value = e.cargo||'florista';
  document.getElementById('leg-sucursal').value = e.sucursal||'';
  document.getElementById('leg-horasContrato').value = e.horasContrato||'';
  document.getElementById('leg-vacacionesAnuales').value = e.vacacionesAnuales||14;
  document.getElementById('leg-vacacionesTomadas').value = e.vacacionesTomadas||0;
  document.getElementById('leg-notas').value = e.notas||'';
  document.getElementById('legajo-modal').classList.add('open');
}

function guardarLegajo(){
  const idx = +document.getElementById('leg-idx').value;
  const nombre = document.getElementById('leg-nombre').value.trim();
  const apellido = document.getElementById('leg-apellido').value.trim();
  if(!nombre || !apellido){ showToast('Nombre y apellido son requeridos.','error'); return; }
  const obj = {
    id: idx >= 0 ? legajoData[idx].id : Date.now(),
    nombre, apellido,
    dni: document.getElementById('leg-dni').value.trim(),
    fechaIngreso: document.getElementById('leg-fechaIngreso').value,
    cargo: document.getElementById('leg-cargo').value,
    sucursal: document.getElementById('leg-sucursal').value.trim(),
    horasContrato: +document.getElementById('leg-horasContrato').value||0,
    vacacionesAnuales: +document.getElementById('leg-vacacionesAnuales').value||14,
    vacacionesTomadas: +document.getElementById('leg-vacacionesTomadas').value||0,
    notas: document.getElementById('leg-notas').value.trim(),
    documentos: idx >= 0 ? (legajoData[idx].documentos||[]) : []
  };
  if(idx >= 0) legajoData[idx] = obj; else legajoData.push(obj);
  fbSave('legajoData', legajoData);
  closeModal('legajo-modal');
  renderLegajo();
  showToast('Empleado guardado');
}

async function eliminarLegajo(idx){
  if(!await confirmModal('¿Eliminar este empleado del legajo?')) return;
  legajoData.splice(idx,1);
  fbSave('legajoData', legajoData);
  renderLegajo();
}

let _legDetIdx = -1;

function verDetalleLegajo(idx){
  const e = legajoData[idx];
  if(!e) return;
  _legDetIdx = idx;
  const vac = (e.vacacionesAnuales||14) - (e.vacacionesTomadas||0);
  document.getElementById('leg-det-titulo').textContent = `${e.nombre} ${e.apellido}`;
  document.getElementById('leg-det-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div><div class="card-label">DNI</div><div>${esc(e.dni||'—')}</div></div>
      <div><div class="card-label">Cargo</div><div style="text-transform:capitalize">${esc(e.cargo||'—')}</div></div>
      <div><div class="card-label">Sucursal</div><div>${esc(e.sucursal||'—')}</div></div>
      <div><div class="card-label">Fecha Ingreso</div><div>${e.fechaIngreso ? fmtDate(e.fechaIngreso) : '—'}</div></div>
      <div><div class="card-label">Horas por contrato</div><div>${(+e.horasContrato||0)}h/mes</div></div>
      <div><div class="card-label">Vacaciones Restantes</div><div>${vac} días (${e.vacacionesAnuales||14} anuales / ${e.vacacionesTomadas||0} tomadas)</div></div>
    </div>
    ${e.notas ? `<div class="card-label">Notas</div><div style="white-space:pre-wrap;font-size:13px;margin-bottom:8px">${esc(e.notas)}</div>` : ''}
    ${_legDocsHTML(e, idx)}
  `;
  document.getElementById('legajo-detalle-modal').classList.add('open');
}

// ── Documentación del legajo (contrato, alta de ARCA, otros) ──────────────────
// Los archivos se guardan como data URI en Firebase (imágenes comprimidas, PDFs
// tal cual). Límite por archivo para no inflar la base.
const _LEG_DOC_MAX = 5 * 1024 * 1024; // 5 MB

function _legDocNombre(tipo, fileName){
  if(tipo==='contrato') return 'Contrato de trabajo';
  if(tipo==='arca')     return 'Alta de ARCA';
  return fileName || 'Documento';
}

function _legDocMimeLabel(d){ return (d.mime==='application/pdf') ? 'PDF' : 'Imagen'; }

function _legDocSlot(e, idx, tipo, icon, label){
  const doc = (e.documentos||[]).find(d=>d.tipo===tipo);
  if(doc){
    return `<div class="leg-doc-row">
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600">${icon} ${esc(label)}</div>
        <div style="font-size:11px;color:var(--mid-gray)">${esc(doc.nombre)}${doc.fecha?' · '+fmtDate(doc.fecha):''} · ${_legDocMimeLabel(doc)}</div>
      </div>
      <button class="btn-secondary" style="font-size:11px" onclick="legVerDoc(${idx},${doc.id})">Ver</button>
      <label class="btn-secondary" style="font-size:11px;cursor:pointer;margin:0">Reemplazar<input type="file" accept="image/*,application/pdf" style="display:none" onchange="legSubirDoc('${tipo}',this)"></label>
      <button class="btn-icon" style="color:var(--red-alert)" title="Eliminar" onclick="legEliminarDoc(${idx},${doc.id})">✕</button>
    </div>`;
  }
  return `<div class="leg-doc-row leg-doc-empty">
    <div style="flex:1;min-width:0">
      <div style="font-size:13px;font-weight:600;color:var(--mid-gray)">${icon} ${esc(label)}</div>
      <div style="font-size:11px;color:var(--mid-gray)">Sin cargar</div>
    </div>
    <label class="btn-add" style="font-size:11px;cursor:pointer;margin:0">⬆ Subir<input type="file" accept="image/*,application/pdf" style="display:none" onchange="legSubirDoc('${tipo}',this)"></label>
  </div>`;
}

function _legDocsHTML(e, idx){
  const otros = (e.documentos||[]).filter(d=>d.tipo==='otro');
  const otrosHTML = otros.map(d=>`<div class="leg-doc-row">
    <div style="flex:1;min-width:0">
      <div style="font-size:13px">📎 ${esc(d.nombre)}</div>
      <div style="font-size:11px;color:var(--mid-gray)">${d.fecha?fmtDate(d.fecha):''} · ${_legDocMimeLabel(d)}</div>
    </div>
    <button class="btn-secondary" style="font-size:11px" onclick="legVerDoc(${idx},${d.id})">Ver</button>
    <button class="btn-icon" style="color:var(--red-alert)" title="Eliminar" onclick="legEliminarDoc(${idx},${d.id})">✕</button>
  </div>`).join('');
  return `<div class="card-label" style="margin-top:14px">Documentación</div>
    ${_legDocSlot(e, idx, 'contrato', '📄', 'Contrato de trabajo')}
    ${_legDocSlot(e, idx, 'arca', '🏛️', 'Alta de ARCA')}
    ${otrosHTML}
    <label class="btn-secondary" style="font-size:11px;cursor:pointer;margin-top:4px;display:inline-block">+ Agregar otro documento<input type="file" accept="image/*,application/pdf" style="display:none" onchange="legSubirDoc('otro',this)"></label>
    <div style="font-size:10.5px;color:var(--mid-gray);margin-top:6px">PDF o foto, hasta 5 MB por archivo. Se sincroniza con el equipo.</div>`;
}

function legSubirDoc(tipo, input){
  const file = input.files && input.files[0]; if(!file) return;
  const idx = _legDetIdx;
  const e = legajoData[idx];
  if(!e){ input.value=''; return; }
  if(file.size > _LEG_DOC_MAX){
    showToast('El archivo supera 5 MB. Subí un PDF más liviano o una foto de menor calidad.','error');
    input.value=''; return;
  }
  input.value='';
  const finalizar = (dataUrl, mime) => {
    if(!Array.isArray(e.documentos)) e.documentos = [];
    const doc = { id: Date.now(), tipo, nombre: _legDocNombre(tipo, file.name), mime, url: dataUrl, fecha: new Date().toISOString().slice(0,10) };
    if(tipo === 'otro'){
      e.documentos.push(doc);
    } else {
      const ex = e.documentos.findIndex(d=>d.tipo===tipo);
      if(ex>=0) e.documentos[ex] = doc; else e.documentos.push(doc);
    }
    fbSave('legajoData', legajoData);
    verDetalleLegajo(idx);
    showToast('Documento cargado ✅');
  };
  if(file.type === 'application/pdf'){
    const r = new FileReader();
    r.onload = ev => finalizar(ev.target.result, 'application/pdf');
    r.readAsDataURL(file);
  } else if(file.type.startsWith('image/')){
    comprimirImagen(file, 1400, 0.72, data => finalizar(data, 'image/jpeg'));
  } else {
    showToast('Formato no soportado. Subí un PDF o una imagen.','error');
  }
}

function legVerDoc(idx, docId){
  const e = legajoData[idx]; if(!e) return;
  const doc = (e.documentos||[]).find(d=>d.id===docId); if(!doc || !doc.url) return;
  try{
    const [meta, b64] = doc.url.split(',');
    const mime = (meta.match(/data:([^;]+)/)||[])[1] || doc.mime || 'application/octet-stream';
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) arr[i] = bin.charCodeAt(i);
    const blob = new Blob([arr], { type: mime });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(()=>URL.revokeObjectURL(url), 60000);
  }catch(err){
    window.open(doc.url, '_blank');
  }
}

async function legEliminarDoc(idx, docId){
  const e = legajoData[idx]; if(!e) return;
  if(!await confirmModal('¿Eliminar este documento del legajo?')) return;
  e.documentos = (e.documentos||[]).filter(d=>d.id!==docId);
  fbSave('legajoData', legajoData);
  verDetalleLegajo(idx);
}

// ════════════════════════════════════════
// FEATURE 2: EVALUACIONES DE DESEMPEÑO
// ════════════════════════════════════════
let evaluacionesData = [];
window._setEvaluacionesData = arr => { evaluacionesData = arr; };

function renderEvaluaciones(){
  renderLlamadosEval();
  const tbody = document.getElementById('eval-tbody');
  if(!tbody) return;
  const search = (document.getElementById('ev-search')?.value||'').toLowerCase();
  const filterTrim = document.getElementById('ev-filter-trim')?.value||'';
  const trimSel = document.getElementById('ev-filter-trim');
  if(trimSel){
    const trimActual = trimSel.value;
    const trims = [...new Set(evaluacionesData.map(e=>e.trimestre).filter(Boolean))].sort().reverse();
    trimSel.innerHTML = '<option value="">— Todos los trimestres —</option>' + trims.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');
    trimSel.value = trimActual;
  }
  let data = evaluacionesData;
  if(search) data = data.filter(e=>(e.empleadoNombre||'').toLowerCase().includes(search));
  if(filterTrim) data = data.filter(e=>e.trimestre===filterTrim);
  if(!data.length){
    tbody.innerHTML = `<tr><td colspan="9" style="padding:20px;text-align:center;color:var(--mid-gray)">Sin evaluaciones.</td></tr>`;
    return;
  }
  const stars = n => '★'.repeat(Math.round(n||0))+'☆'.repeat(5-Math.round(n||0));
  const badge = p => {
    const cls = p>=4?'green':p>=3?'amber':'red';
    return `<span class="card-value ${cls}" style="font-size:13px">${p.toFixed(1)}</span>`;
  };
  tbody.innerHTML = data.map((e)=>{
    const realIdx = evaluacionesData.indexOf(e);
    const prom = ((+e.puntualidad||0)+(+e.calidad||0)+(+e.actitud||0)+(+e.productividad||0))/4;
    return `<tr>
      <td>${esc(e.empleadoNombre||'')}</td>
      <td>${esc(e.trimestre||'')}</td>
      <td title="${e.puntualidad}/5">${stars(e.puntualidad)}</td>
      <td title="${e.calidad}/5">${stars(e.calidad)}</td>
      <td title="${e.actitud}/5">${stars(e.actitud)}</td>
      <td title="${e.productividad}/5">${stars(e.productividad)}</td>
      <td>${badge(prom)}</td>
      <td>${esc(e.evaluador||'')}</td>
      <td>
        <button class="btn-secondary" style="font-size:11px" onclick="openEvaluacionModal(${realIdx})">Editar</button>
        <button class="btn-icon" style="color:var(--red-alert)" onclick="eliminarEvaluacion(${realIdx})">✕</button>
      </td>
    </tr>`;
  }).join('');
}

function openEvaluacionModal(idx){
  const e = idx >= 0 ? evaluacionesData[idx] : {};
  document.getElementById('evaluacion-modal-title').textContent = idx >= 0 ? 'Editar Evaluación' : 'Nueva Evaluación';
  document.getElementById('eval-idx').value = idx;
  const empSel = document.getElementById('eval-empleado');
  empSel.innerHTML = '<option value="">— Seleccionar empleado —</option>' +
    legajoData.map(l=>`<option value="${l.id}" data-nombre="${esc(l.nombre+' '+l.apellido)}">${esc(l.nombre+' '+l.apellido)}</option>`).join('');
  if(e.empleadoId) empSel.value = e.empleadoId;
  document.getElementById('eval-trimestre').value = e.trimestre||'';
  document.getElementById('eval-puntualidad').value = e.puntualidad||3;
  document.getElementById('eval-calidad').value = e.calidad||3;
  document.getElementById('eval-actitud').value = e.actitud||3;
  document.getElementById('eval-productividad').value = e.productividad||3;
  document.getElementById('eval-comentarios').value = e.comentarios||'';
  document.getElementById('eval-evaluador').value = e.evaluador||'';
  document.getElementById('evaluacion-modal').classList.add('open');
}

function guardarEvaluacion(){
  const idx = +document.getElementById('eval-idx').value;
  const empSel = document.getElementById('eval-empleado');
  const empleadoId = empSel.value;
  const empleadoNombre = empSel.options[empSel.selectedIndex]?.dataset?.nombre||'';
  const trimestre = document.getElementById('eval-trimestre').value.trim();
  if(!empleadoId || !trimestre){ showToast('Empleado y trimestre son requeridos.','error'); return; }
  const obj = {
    id: idx >= 0 ? evaluacionesData[idx].id : Date.now(),
    empleadoId, empleadoNombre, trimestre,
    puntualidad: +document.getElementById('eval-puntualidad').value||3,
    calidad: +document.getElementById('eval-calidad').value||3,
    actitud: +document.getElementById('eval-actitud').value||3,
    productividad: +document.getElementById('eval-productividad').value||3,
    comentarios: document.getElementById('eval-comentarios').value.trim(),
    evaluador: document.getElementById('eval-evaluador').value.trim(),
    fecha: TODAY_ISO
  };
  if(idx >= 0) evaluacionesData[idx] = obj; else evaluacionesData.push(obj);
  fbSave('evaluacionesData', evaluacionesData);
  closeModal('evaluacion-modal');
  renderEvaluaciones();
  showToast('Evaluación guardada');
}

async function eliminarEvaluacion(idx){
  if(!await confirmModal('¿Eliminar esta evaluación?')) return;
  evaluacionesData.splice(idx,1);
  fbSave('evaluacionesData', evaluacionesData);
  renderEvaluaciones();
}

// ════════════════════════════════════════
// FEATURE 3: LIQUIDACIÓN HORAS EXTRA
// ════════════════════════════════════════
let liquidacionConfig = { horasEsperadas: 192, horas: {} };
window._setLiquidacionConfig = v => { if(v) liquidacionConfig = v; };

// Suma de horas PROGRAMADAS (calendario horariosData) de una persona en un mes 'YYYY-MM'
function liqProgramadasMes(name, mes){
  const data = (window.horariosData||{})[name] || {};
  let h = 0;
  for(const iso in data){ if(iso.startsWith(mes)){ const d = data[iso]||{}; h += calcHorasDia(d.desde, d.hasta); } }
  return Math.round(h*10)/10;
}
// Suma de horas TRABAJADAS reales (jornada fichada) de una persona en un mes 'YYYY-MM'
function liqTrabajadasMes(name, mes){
  const dias = new Set([
    ...Object.keys((window.florTurnos||{})[name]||{}),
    ...Object.keys((window.jardHorarios||{})[name]||{})
  ]);
  let h = 0;
  dias.forEach(iso => { if(iso.startsWith(mes)){ const r = jornadaRealDia(name, iso); if(r) h += r.horas; } });
  return Math.round(h*10)/10;
}
// Empareja un empleado del legajo con su nombre en el calendario (match flexible)
function liqNombreCalendario(e){
  const cands = getEmpleadosActivos();
  const nom = (e.nombre||'').trim().toLowerCase();
  const full = ((e.nombre||'')+' '+(e.apellido||'')).trim().toLowerCase();
  if(!nom) return null;
  let m = cands.find(c => c.toLowerCase() === nom);
  if(m) return m;
  m = cands.find(c => nom.startsWith(c.toLowerCase()) || c.toLowerCase().startsWith(nom));
  if(m) return m;
  m = cands.find(c => full.includes(c.toLowerCase()));
  return m || null;
}
// Calcula la fila de liquidación de un empleado (programadas/trabajadas auto del
// calendario, con override editable guardado en liquidacionConfig).
function liqFilaDatos(e, mes){
  const mesData = (liquidacionConfig.horas||{})[mes]||{};
  const ov = mesData[e.id] || {};
  const calName = liqNombreCalendario(e);
  const autoProg = calName ? liqProgramadasMes(calName, mes) : 0;
  const autoTrab = calName ? liqTrabajadasMes(calName, mes) : 0;
  const progEdit = ov.programadas != null && ov.programadas !== '';
  const trabEdit = ov.trabajadas != null && ov.trabajadas !== '';
  const prog = progEdit ? +ov.programadas : autoProg;
  const trab = trabEdit ? +ov.trabajadas : autoTrab;
  const valHora = +(ov.valorHora||0);
  const hExtra = Math.max(0, Math.round((trab - prog)*10)/10);
  const adicional = +(hExtra * valHora * 1.5).toFixed(2);
  return { calName, autoProg, autoTrab, progEdit, trabEdit, prog, trab, valHora, hExtra, adicional };
}

function renderLiquidacion(){
  const tbody = document.getElementById('liq-tbody');
  const summary = document.getElementById('liq-summary');
  if(!tbody) return;
  const mesEl = document.getElementById('liq-mes');
  if(!mesEl.value){
    const now = new Date();
    mesEl.value = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  }
  const mes = mesEl.value;
  const empleados = legajoData.filter(e=>e.cargo !== '__inactivo__');
  if(!empleados.length){
    tbody.innerHTML = `<tr><td colspan="8" style="padding:20px;text-align:center;color:var(--mid-gray)">Sin empleados en el legajo.</td></tr>`;
    return;
  }
  let totalExtra = 0, totalPesos = 0;
  tbody.innerHTML = empleados.map((e)=>{
    const d = liqFilaDatos(e, mes);
    totalExtra += d.hExtra;
    totalPesos += d.adicional;
    const sinCal = d.calName ? '' : ' <span style="font-size:10px;color:var(--amber)" title="No se encontró su horario en el calendario; cargá las horas a mano">⚠</span>';
    return `<tr>
      <td>${esc(e.nombre)} ${esc(e.apellido)}${sinCal}</td>
      <td style="text-transform:capitalize">${esc(e.cargo||'')}</td>
      <td><input class="form-input" type="number" min="0" step="0.5" value="${d.progEdit?esc(String(d.prog)):''}" placeholder="${d.autoProg||0}" title="Horas programadas del calendario (editable)" style="width:80px;padding:4px 8px;text-align:center" onchange="saveLiquidacionHoras(${e.id},'${mes}','programadas',this.value)"></td>
      <td><input class="form-input" type="number" min="0" step="0.5" value="${d.trabEdit?esc(String(d.trab)):''}" placeholder="${d.autoTrab||0}" title="Horas trabajadas reales según fichaje (editable)" style="width:80px;padding:4px 8px;text-align:center" onchange="saveLiquidacionHoras(${e.id},'${mes}','trabajadas',this.value)"></td>
      <td style="text-align:center;font-weight:700;color:${d.hExtra>0?'var(--sage-dark)':'var(--mid-gray)'}">${d.hExtra}</td>
      <td><input class="form-input" type="number" min="0" value="${d.valHora||''}" placeholder="$" style="width:90px;padding:4px 8px;text-align:right" onchange="saveLiquidacionHoras(${e.id},'${mes}','valorHora',this.value)"></td>
      <td style="text-align:right;font-weight:600">${d.adicional ? '$'+d.adicional.toLocaleString('es-AR',{minimumFractionDigits:2}) : '<span style="color:var(--mid-gray)">—</span>'}</td>
    </tr>`;
  }).join('');
  if(summary) summary.innerHTML = `
    <div class="cards-grid cards-grid-3">
      <div class="card"><div class="card-label">Total Horas Extra del Equipo</div><div class="card-value">${totalExtra.toFixed(1)} hs</div></div>
      <div class="card"><div class="card-label">Total a Liquidar</div><div class="card-value green">$${totalPesos.toLocaleString('es-AR',{minimumFractionDigits:2})}</div></div>
      <div class="card"><div class="card-label">Empleados</div><div class="card-value">${empleados.length}</div></div>
    </div>`;
}

function saveLiquidacionHoras(empleadoId, mes, field, val){
  if(!liquidacionConfig.horas) liquidacionConfig.horas = {};
  if(!liquidacionConfig.horas[mes]) liquidacionConfig.horas[mes] = {};
  if(!liquidacionConfig.horas[mes][empleadoId]) liquidacionConfig.horas[mes][empleadoId] = {};
  const s = (val==null ? '' : String(val)).trim();
  if(s === ''){
    // Vacío = volver al valor automático del calendario
    delete liquidacionConfig.horas[mes][empleadoId][field];
  } else {
    liquidacionConfig.horas[mes][empleadoId][field] = +s;
  }
  fbSave('liquidacionConfig', liquidacionConfig);
  renderLiquidacion();
}

function exportLiquidacion(){
  const mes = document.getElementById('liq-mes')?.value || '';
  let txt = `LIQUIDACIÓN HORAS EXTRA — ${mes}\n${'='.repeat(50)}\n`;
  let total = 0;
  legajoData.filter(e=>e.cargo !== '__inactivo__').forEach(e=>{
    const d = liqFilaDatos(e, mes);
    total += d.adicional;
    txt += `${e.nombre} ${e.apellido} (${e.cargo}): programadas ${d.prog}h, trabajadas ${d.trab}h, extra ${d.hExtra}h = $${d.adicional.toLocaleString('es-AR')}\n`;
  });
  txt += `${'='.repeat(50)}\nTOTAL: $${total.toLocaleString('es-AR',{minimumFractionDigits:2})}`;
  const blob = new Blob([txt],{type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `liquidacion-${mes}.txt`;
  a.click();
}

// ════════════════════════════════════════
// FEATURE 4: ORDEN DE COMPRA EN PDF
// ════════════════════════════════════════
function generarOrdenCompra(idx, tipo='flore'){
  const data = tipo==='flore' ? comprasFlore : comprasJard;
  const c = data[idx];
  if(!c){ showToast('Orden no encontrada'); return; }
  const win = window.open('','_blank');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>OC #${idx+1}</title><style>
    body{font-family:Arial,sans-serif;margin:40px;color:#1a1a1a}
    h1{font-size:22px;margin-bottom:4px}
    .sub{color:#7a7a72;font-size:13px;margin-bottom:24px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th,td{border:1px solid #ccc;padding:8px 12px;text-align:left;font-size:13px}
    th{background:#f5f5f0}
    .total{font-size:16px;font-weight:bold;text-align:right;margin-bottom:32px}
    .firma{margin-top:60px;display:flex;gap:60px}
    .firma-box{border-top:1px solid #333;padding-top:8px;min-width:180px;font-size:12px}
    @media print{button{display:none}}
  </style></head><body>
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:8px">
      <div style="font-size:32px">🌸</div>
      <div><h1>Florería Duhau · Park Hyatt Buenos Aires</h1><div class="sub">Orden de Compra #${idx+1} — Emitida el ${fmtDate(TODAY_ISO)}</div></div>
    </div>
    <div style="margin-bottom:20px;font-size:13px">
      <strong>Fecha del pedido:</strong> ${c.fecha ? fmtDate(c.fecha) : '—'}<br>
      <strong>Proveedor:</strong> ${esc(c.prov||'—')}<br>
      <strong>Pedido por:</strong> ${esc(c.pedidopor||'—')}<br>
      <strong>Área / Sector:</strong> ${esc(c.sector||'—')}
    </div>
    <table>
      <thead><tr><th>Producto</th><th>Descripción</th><th>Cantidad</th><th>Precio Unit.</th><th>Subtotal</th></tr></thead>
      <tbody>
        <tr>
          <td>${esc(c.prod||'—')}</td>
          <td>${esc(c.desc||'—')}</td>
          <td>${esc(String(c.qty||1))}</td>
          <td>${c.costo ? '$'+parseMoney(c.costo).toLocaleString('es-AR') : '—'}</td>
          <td>${c.costo ? '$'+_compraImporte(c).toLocaleString('es-AR') : '—'}</td>
        </tr>
      </tbody>
    </table>
    <div class="total">Total: ${c.costo ? '$'+_compraImporte(c).toLocaleString('es-AR') : '—'}</div>
    ${c.notas ? `<div style="font-size:13px;margin-bottom:20px"><strong>Notas:</strong> ${esc(c.notas)}</div>` : ''}
    <div class="firma">
      <div class="firma-box">Firma Solicitante</div>
      <div class="firma-box">Firma Aprobación</div>
      <div class="firma-box">Firma Proveedor</div>
    </div>
    <button onclick="window.print()" style="margin-top:24px;padding:8px 20px;cursor:pointer">🖨️ Imprimir</button>
  </body></html>`);
  win.document.close();
}

// ════════════════════════════════════════
// FEATURE 5: COMPARACIÓN DE PRECIOS
// ════════════════════════════════════════
function renderPrecioComparacion(){
  const inp = document.getElementById('precio-search');
  if(inp) inp.value = '';
  const res = document.getElementById('precio-result');
  if(res) res.innerHTML = '<div style="color:var(--mid-gray);text-align:center;padding:40px">Escribí un producto para comparar precios entre proveedores.</div>';
}

function buscarComparacion(query){
  const res = document.getElementById('precio-result');
  if(!res) return;
  const q = (query||'').toLowerCase().trim();
  if(!q){ res.innerHTML = '<div style="color:var(--mid-gray);text-align:center;padding:40px">Escribí un producto para comparar precios entre proveedores.</div>'; return; }
  const allCompras = [...comprasFlore, ...comprasJard].filter(c => c.prod && c.prod.toLowerCase().includes(q) && c.prov && c.costo && !c.anulado);
  if(!allCompras.length){ res.innerHTML = '<div style="color:var(--mid-gray);text-align:center;padding:40px">Sin datos de precio para este producto.</div>'; return; }
  const byProv = {};
  allCompras.forEach(c=>{
    if(!byProv[c.prov]) byProv[c.prov] = [];
    byProv[c.prov].push({ precio: parseMoney(c.costo), fecha: c.fecha });
  });
  const rows = Object.entries(byProv).map(([prov,items])=>{
    const prices = items.map(i=>i.precio);
    const ultimo = items.sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''))[0];
    return { prov, ultimo: ultimo.precio, ultimaFecha: ultimo.fecha, promedio: prices.reduce((s,p)=>s+p,0)/prices.length, veces: prices.length };
  }).sort((a,b)=>a.ultimo-b.ultimo);
  const minPrecio = rows[0]?.ultimo;
  res.innerHTML = `<div class="table-wrapper"><table class="stock-table">
    <thead><tr><th>Proveedor</th><th>Último Precio</th><th>Fecha</th><th>Precio Promedio</th><th>Veces Comprado</th></tr></thead>
    <tbody>${rows.map(r=>`<tr style="${r.ultimo===minPrecio?'background:rgba(100,160,100,0.1)':''}">
      <td><strong>${esc(r.prov)}</strong>${r.ultimo===minPrecio?' <span style="color:var(--sage-dark);font-size:11px">✓ más barato</span>':''}</td>
      <td><strong>$${r.ultimo.toLocaleString('es-AR')}</strong></td>
      <td>${r.ultimaFecha ? fmtDate(r.ultimaFecha) : '—'}</td>
      <td>$${r.promedio.toLocaleString('es-AR',{minimumFractionDigits:0,maximumFractionDigits:0})}</td>
      <td>${r.veces}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

// ════════════════════════════════════════
// FEATURE 6: STOCK MÍNIMO INTELIGENTE
// ════════════════════════════════════════
function calcStockMinInteligente(){
  const DAYS = 90;
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-DAYS);
  const cutoffISO = cutoff.toISOString().slice(0,10);
  const consumo = {};
  const addConsumo = (prod, qty) => {
    if(!prod) return;
    const k = prod.toLowerCase();
    consumo[k] = (consumo[k]||0) + (+qty||0);
  };
  (ventasData||[]).filter(v=>v.fecha>=cutoffISO).forEach(v=>{
    addConsumo(v.prod||v.producto, v.qty||v.cantidad||1);
  });
  (eventosData||[]).filter(e=>e.fecha>=cutoffISO && e.arreglos?.length).forEach(ev=>{
    const impact = calcStockImpact(ev.arreglos||[]);
    Object.entries(impact).forEach(([prod,qty])=>addConsumo(prod,qty));
  });
  return stockData.map((s,i)=>{
    const k = s.prod.toLowerCase();
    const totalUsado = consumo[k]||0;
    const promDia = totalUsado/DAYS;
    const minSugerido = +(promDia*7).toFixed(1);
    const diff = +(minSugerido - (s.min||0)).toFixed(1);
    return { idx: i, prod: s.prod, promDia: +promDia.toFixed(3), minSugerido, minActual: s.min||0, diff };
  }).filter(r=>r.promDia>0||r.minActual>0);
}

function renderStockSugerencias(){
  const wrap = document.getElementById('stock-sugerencias-wrap');
  if(!wrap) return;
  const rows = calcStockMinInteligente();
  if(!rows.length){ wrap.innerHTML = '<div style="color:var(--mid-gray);padding:12px">Sin datos suficientes para sugerencias.</div>'; return; }
  wrap.innerHTML = `<div class="table-wrapper"><table class="stock-table">
    <thead><tr><th>Insumo</th><th>Consumo prom/día</th><th>Mínimo Sugerido</th><th>Mínimo Actual</th><th>Diferencia</th><th>Acción</th></tr></thead>
    <tbody>${rows.map(r=>`<tr>
      <td>${esc(r.prod)}</td>
      <td>${r.promDia}</td>
      <td>${r.minSugerido}</td>
      <td>${r.minActual}</td>
      <td><span class="${r.diff>0?'card-value amber':r.diff<0?'card-value green':''}" style="font-size:13px">${r.diff>0?'+':''}${r.diff}</span></td>
      <td>${r.diff!==0?`<button class="btn-secondary" style="font-size:11px" onclick="aplicarSugerenciaStock(${r.idx},${r.minSugerido})">Actualizar</button>`:''}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function aplicarSugerenciaStock(stockIdx, nuevoMin){
  stockData[stockIdx].min = nuevoMin;
  fbSave('stockData', stockData);
  renderStockSugerencias();
  showToast('Mínimo actualizado');
}

// ════════════════════════════════════════
// FEATURE 7: FILTROS MEJORADOS COMPRAS
// ════════════════════════════════════════
let compraFilterExt = { floreria: {}, jardineria: {} };

function renderCompraFiltersPanel(type){
  const p = type==='floreria'?'cf':'cj';
  const wrap = document.getElementById(p+'-ext-filters');
  if(!wrap) return;
  const arr = type==='floreria'?comprasFlore:comprasJard;
  const provs = [...new Set(arr.filter(r=>r.prov).map(r=>r.prov))].sort((a,b)=>a.localeCompare(b,'es'));
  const f = compraFilterExt[type]||{};
  const activeCount = [f.prov,f.estado,f.desde,f.hasta,f.montoMin,f.montoMax,f.producto].filter(Boolean).length;
  const badge = activeCount > 0 ? `<span style="background:var(--sage);color:#fff;border-radius:10px;padding:1px 7px;font-size:11px;margin-left:6px">${activeCount}</span>` : '';
  wrap.innerHTML = `
    <div style="margin-bottom:12px">
      <button class="btn-secondary" style="font-size:12px" onclick="toggleCompraFilters('${type}')">🔍 Filtros avanzados${badge}</button>
      ${activeCount>0?`<button class="btn-secondary" style="font-size:12px;margin-left:6px" onclick="clearCompraFiltersExt('${type}')">✕ Limpiar filtros</button>`:''}
    </div>
    <div id="${p}-ext-panel" style="display:none;background:var(--light-gray);border-radius:10px;padding:14px;margin-bottom:14px">
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end">
        <div><label class="form-label">Proveedor</label>
          <select class="form-input" id="${p}-fext-prov" onchange="applyCompraFiltersExt('${type}')" style="min-width:150px;padding:6px 8px;font-size:12px">
            <option value="">Todos</option>${provs.map(v=>`<option value="${esc(v)}" ${f.prov===v?'selected':''}>${esc(v)}</option>`).join('')}
          </select></div>
        <div><label class="form-label">Estado</label>
          <select class="form-input" id="${p}-fext-estado" onchange="applyCompraFiltersExt('${type}')" style="min-width:130px;padding:6px 8px;font-size:12px">
            <option value="">Todos</option>
            <option value="pedido" ${f.estado==='pedido'?'selected':''}>Pedido</option>
            <option value="recibido" ${f.estado==='recibido'?'selected':''}>Recibido</option>
          </select></div>
        <div><label class="form-label">Desde</label><input class="form-input" type="date" id="${p}-fext-desde" value="${f.desde||''}" onchange="applyCompraFiltersExt('${type}')" style="padding:6px 8px;font-size:12px"></div>
        <div><label class="form-label">Hasta</label><input class="form-input" type="date" id="${p}-fext-hasta" value="${f.hasta||''}" onchange="applyCompraFiltersExt('${type}')" style="padding:6px 8px;font-size:12px"></div>
        <div><label class="form-label">Monto mín ($)</label><input class="form-input" type="number" id="${p}-fext-mmin" value="${f.montoMin||''}" placeholder="0" onchange="applyCompraFiltersExt('${type}')" style="width:100px;padding:6px 8px;font-size:12px"></div>
        <div><label class="form-label">Monto máx ($)</label><input class="form-input" type="number" id="${p}-fext-mmax" value="${f.montoMax||''}" placeholder="∞" onchange="applyCompraFiltersExt('${type}')" style="width:100px;padding:6px 8px;font-size:12px"></div>
        <div style="flex:1;min-width:140px"><label class="form-label">Buscar producto</label><input class="form-input" id="${p}-fext-prod" value="${f.producto||''}" placeholder="Nombre producto..." oninput="applyCompraFiltersExt('${type}')" style="width:100%;padding:6px 8px;font-size:12px"></div>
      </div>
    </div>`;
  if(activeCount>0) document.getElementById(p+'-ext-panel').style.display = '';
}

function toggleCompraFilters(type){
  const p = type==='floreria'?'cf':'cj';
  const panel = document.getElementById(p+'-ext-panel');
  if(panel) panel.style.display = panel.style.display==='none'?'':'none';
}

function applyCompraFiltersExt(type){
  const p = type==='floreria'?'cf':'cj';
  compraFilterExt[type] = {
    prov: document.getElementById(p+'-fext-prov')?.value||'',
    estado: document.getElementById(p+'-fext-estado')?.value||'',
    desde: document.getElementById(p+'-fext-desde')?.value||'',
    hasta: document.getElementById(p+'-fext-hasta')?.value||'',
    montoMin: document.getElementById(p+'-fext-mmin')?.value||'',
    montoMax: document.getElementById(p+'-fext-mmax')?.value||'',
    producto: document.getElementById(p+'-fext-prod')?.value||''
  };
  renderCompras(type);
}

function clearCompraFiltersExt(type){
  compraFilterExt[type] = {};
  renderCompras(type);
}

function toggleStockSugerencias(){
  const panel = document.getElementById('stock-sugerencias-panel');
  if(!panel) return;
  const visible = panel.style.display !== 'none';
  panel.style.display = visible ? 'none' : '';
  if(!visible) renderStockSugerencias();
}

// ════════════════════════════════════════
// FEATURE 1: PWA — Install Prompt
// ════════════════════════════════════════
let _pwaInstallEvent = null;
const _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const _isAndroid = /Android/.test(navigator.userAgent);
const _isInStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

if('serviceWorker' in navigator){
  // Auto-actualización: cuando se activa un service worker nuevo (versión nueva
  // desplegada), recargar la app sola para tomar el código nuevo. Evita que los
  // dispositivos queden pegados en una versión vieja cacheada.
  let _swReloading = false;
  // Solo si YA había un SW controlando (no en la primerísima instalación, para
  // no recargar de más la primera vez).
  if(navigator.serviceWorker.controller){
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if(_swReloading) return;
      _swReloading = true;
      try { window.showToast?.('🔄 Actualizando a la última versión…'); } catch(e){}
      setTimeout(() => location.reload(), 800);
    });
  }
  // Registrar el MISMO SW que index.html para no tener dos en conflicto en el
  // mismo scope (lo que puede romper la instalabilidad / beforeinstallprompt).
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(reg => {
      // Volver a chequear si hay versión nueva cada vez que la app gana foco
      // (útil para la PWA instalada que queda abierta mucho tiempo).
      document.addEventListener('visibilitychange', () => {
        if(document.visibilityState === 'visible') reg.update().catch(()=>{});
      });
    }).catch(()=>{});
  });
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _pwaInstallEvent = e;
  _showPWABtn();
});

window.addEventListener('appinstalled', () => {
  const top = document.getElementById('pwa-topbar-btn');
  if(top) top.style.display = 'none';
  const fl = document.getElementById('pwa-install-btn');
  if(fl) fl.style.display = 'none';
  document.getElementById('pwa-ios-banner')?.remove();
  document.getElementById('pwa-android-banner')?.remove();
  showToast('✅ App instalada correctamente');
});

// Muestra el botón de instalar: ícono en topbar + botón flotante prominente.
function _showPWABtn(){
  const top = document.getElementById('pwa-topbar-btn');
  if(top) top.style.display = '';
  const fl = document.getElementById('pwa-install-btn');
  if(fl) fl.style.display = 'flex';
}

function _initPWAPrompt(){
  if(_isInStandalone) return; // ya instalada
  if(_isIOS){
    // iOS no soporta beforeinstallprompt — mostrar banner con instrucciones manuales
    if(document.getElementById('pwa-ios-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'pwa-ios-banner';
    banner.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="font-size:24px;flex-shrink:0">📲</div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:13px;margin-bottom:4px">Instalar app en iPhone / iPad</div>
          <div style="font-size:12px;line-height:1.5">Tocá <strong>⎙ Compartir</strong> en la barra de Safari y luego <strong>"Agregar a pantalla de inicio"</strong></div>
        </div>
        <button onclick="document.getElementById('pwa-ios-banner').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#fff;padding:0;line-height:1">✕</button>
      </div>`;
    banner.style.cssText = 'position:fixed;bottom:80px;left:16px;right:16px;background:#1a1a18;color:#fff;border-radius:14px;padding:14px 16px;z-index:9000;box-shadow:0 8px 24px rgba(0,0,0,0.3);font-family:inherit';
    document.body.appendChild(banner);
  } else if(_isAndroid){
    // Android sin beforeinstallprompt (común al abrir desde el navegador in-app
    // de WhatsApp/Instagram, o por heurística de Chrome): instrucciones manuales.
    if(document.getElementById('pwa-android-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'pwa-android-banner';
    banner.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="font-size:24px;flex-shrink:0">📲</div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:13px;margin-bottom:4px">Instalar app en Android</div>
          <div style="font-size:12px;line-height:1.5">Tocá el menú <strong>⋮</strong> de Chrome (arriba a la derecha) y elegí <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.<br><span style="opacity:.8">Si abriste el link desde WhatsApp, abrilo primero en Chrome.</span></div>
        </div>
        <button onclick="document.getElementById('pwa-android-banner').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#fff;padding:0;line-height:1">✕</button>
      </div>`;
    banner.style.cssText = 'position:fixed;bottom:80px;left:16px;right:16px;background:#1a1a18;color:#fff;border-radius:14px;padding:14px 16px;z-index:9000;box-shadow:0 8px 24px rgba(0,0,0,0.3);font-family:inherit';
    document.body.appendChild(banner);
  }
}

function installPWA(){
  // Si el navegador ofrece la instalación nativa (Android/Chrome/Edge), usarla.
  if(_pwaInstallEvent){
    _pwaInstallEvent.prompt();
    _pwaInstallEvent.userChoice.then(choice => {
      if(choice.outcome==='accepted'){ showToast('✅ App instalada'); document.getElementById('pwa-topbar-btn')?.style && (document.getElementById('pwa-topbar-btn').style.display='none'); document.getElementById('pwa-install-btn')?.style && (document.getElementById('pwa-install-btn').style.display='none'); }
      _pwaInstallEvent = null;
    });
    return;
  }
  // Sin evento nativo: instrucciones manuales según plataforma.
  if(_isIOS || _isAndroid){ _initPWAPrompt(); return; }
  // PC sin evento (ya instalada, o navegador sin soporte de instalación).
  showToast('Para instalarla, usá el ícono de instalar ⊕ en la barra de direcciones de Chrome/Edge.');
}

// Mostrar el botón de instalar siempre que no esté ya instalada, tanto en iOS
// como en Android (en Android beforeinstallprompt no siempre dispara).
// Mostrar el botón "Instalar app" en el menú lateral si todavía no está
// instalada (cualquier plataforma). No se auto-abre ningún banner: las
// instrucciones aparecen solo cuando el usuario toca el botón.
if(!_isInStandalone){
  window.addEventListener('load', _showPWABtn);
}

// ════════════════════════════════════════
// FEATURE 2: PANTALLA TV / MODO DASHBOARD
// ════════════════════════════════════════
let _tvInterval = null;
function toggleTVMode(){
  const el = document.getElementById('tv-overlay');
  if(!el) return;
  const isOn = el.classList.contains('tv-active');
  if(isOn){
    el.classList.remove('tv-active');
    clearInterval(_tvInterval); _tvInterval = null;
    showToast('Modo TV desactivado');
  } else {
    el.classList.add('tv-active');
    renderTVDashboard();
    _tvInterval = setInterval(renderTVDashboard, 60000);
    showToast('Modo TV activado — actualizando cada minuto');
    if(el.requestFullscreen) el.requestFullscreen().catch(()=>{});
  }
}

function renderTVDashboard(){
  const el = document.getElementById('tv-content');
  if(!el) return;
  const today = TODAY_ISO;
  const evHoy = (eventosData||[]).filter(e=>e.fecha===today).length;
  const evMes = (eventosData||[]).filter(e=>e.fecha&&e.fecha.startsWith(CURR_MONTH)).length;
  const ventasMes = (ventasData||[]).filter(v=>v.fecha&&v.fecha.startsWith(CURR_MONTH)).reduce((s,v)=>s+parseMoney(v.monto||v.total||0),0);
  const stockBajos = (stockData||[]).filter(s=>(s.cantidad||0)<=(s.min||0)).length;
  const pedidos = (pedidosHabData||[]).filter(p=>p.estado==='pendiente').length;
  const now = new Date();
  el.innerHTML = `
    <div class="tv-header">
      <div class="tv-logo">🌸 Florería Duhau · Park Hyatt Buenos Aires</div>
      <div class="tv-clock">${now.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})} · ${now.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})}</div>
    </div>
    <div class="tv-kpis">
      <div class="tv-kpi"><div class="tv-kpi-val">${evHoy}</div><div class="tv-kpi-lbl">Eventos hoy</div></div>
      <div class="tv-kpi"><div class="tv-kpi-val">${evMes}</div><div class="tv-kpi-lbl">Eventos este mes</div></div>
      <div class="tv-kpi"><div class="tv-kpi-val">$${ventasMes.toLocaleString('es-AR',{minimumFractionDigits:0,maximumFractionDigits:0})}</div><div class="tv-kpi-lbl">Ventas del mes</div></div>
      <div class="tv-kpi ${stockBajos>0?'tv-kpi-alert':''}"><div class="tv-kpi-val">${stockBajos}</div><div class="tv-kpi-lbl">Stock bajo mínimo</div></div>
      <div class="tv-kpi ${pedidos>0?'tv-kpi-alert':''}"><div class="tv-kpi-val">${pedidos}</div><div class="tv-kpi-lbl">Pedidos habitación pendientes</div></div>
    </div>
    <div class="tv-eventos">
      <div class="tv-section-title">📅 Próximos eventos</div>
      <div class="tv-ev-grid">${(eventosData||[]).filter(e=>e.fecha>=today).sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||'')).slice(0,6).map(e=>`
        <div class="tv-ev-card">
          <div class="tv-ev-date">${fmtDate(e.fecha)}</div>
          <div class="tv-ev-title">${esc(e.titulo||e.nombre||'Evento')}</div>
          <div class="tv-ev-zona">${esc(e.zona||e.lugarEvento||'')}</div>
        </div>`).join('')||'<div style="color:#888;padding:20px">Sin eventos próximos</div>'}
      </div>
    </div>
    <div class="tv-footer">
      <button onclick="toggleTVMode()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);color:#fff;padding:8px 20px;border-radius:8px;cursor:pointer;font-size:14px">✕ Salir modo TV</button>
    </div>`;
}

// ════════════════════════════════════════
// FEATURE 4: SEGUIMIENTO DE PRESUPUESTOS
// ════════════════════════════════════════
let presupuestosData = [];
window._setPresupuestos = arr => { presupuestosData = arr && typeof arr === 'object' ? (Array.isArray(arr)?arr:Object.values(arr)) : []; renderPresupuestos(); };

function renderPresupuestos(){
  const el = document.getElementById('presupuestos-body');
  if(!el) return;
  const sorted = [...presupuestosData].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
  const total = presupuestosData.length;
  const cerrados = presupuestosData.filter(p=>p.estado==='aceptado').length;
  const conversion = total ? Math.round(cerrados/total*100) : 0;
  const volumen = presupuestosData.filter(p=>p.estado==='aceptado').reduce((s,p)=>s+parseMoney(p.monto||0),0);
  const stats = document.getElementById('presupuestos-stats');
  if(stats) stats.innerHTML = `
    <div class="kpi-card"><div class="kpi-val">${total}</div><div class="kpi-lbl">Total enviados</div></div>
    <div class="kpi-card"><div class="kpi-val">${cerrados}</div><div class="kpi-lbl">Aceptados</div></div>
    <div class="kpi-card"><div class="kpi-val">${conversion}%</div><div class="kpi-lbl">Tasa de conversión</div></div>
    <div class="kpi-card"><div class="kpi-val">$${volumen.toLocaleString('es-AR',{minimumFractionDigits:0,maximumFractionDigits:0})}</div><div class="kpi-lbl">Volumen aceptado</div></div>`;
  if(!sorted.length){ el.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--mid-gray);padding:24px">Sin presupuestos aún. Usá «+ Nuevo presupuesto» para agregar.</td></tr>'; return; }
  const stColors = {pendiente:'#856404',aceptado:'#155724',rechazado:'#721c24',vencido:'#6c757d'};
  const stBg = {pendiente:'#fff3cd',aceptado:'#d4edda',rechazado:'#f8d7da',vencido:'#e2e3e5'};
  const stLbl = {pendiente:'Pendiente',aceptado:'Aceptado',rechazado:'Rechazado',vencido:'Vencido'};
  el.innerHTML = sorted.map(p=>{
    const i = presupuestosData.indexOf(p);
    const est = p.estado||'pendiente';
    return `<tr style="cursor:pointer" onclick="verPresupuesto(${i})">
    <td style="white-space:nowrap">${fmtDate(p.fecha)}</td>
    <td><strong>${esc(p.cliente||'—')}</strong></td>
    <td>${esc(p.concepto||'—')}</td>
    <td style="white-space:nowrap;font-weight:600">$${parseMoney(p.monto||0).toLocaleString('es-AR',{minimumFractionDigits:0})}</td>
    <td><span style="background:${stBg[est]||'#eee'};color:${stColors[est]||'#333'};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap">${stLbl[est]||est}</span></td>
    <td style="white-space:nowrap">${p.vencimiento ? fmtDate(p.vencimiento) : '—'}</td>
    <td onclick="event.stopPropagation()">
      <div class="table-actions">
        <button class="btn-mini" onclick="verPresupuesto(${i})">👁 Ver</button>
        <button class="btn-mini wa" title="Enviar por WhatsApp" onclick="enviarPresupuestoWhatsApp(${i})">💬 WhatsApp</button>
        <select class="cl-select" onchange="cambiarEstadoPres(${i},this.value)">
          <option value="">Estado…</option>
          <option value="aceptado">Aceptado ✓</option>
          <option value="rechazado">Rechazado ✗</option>
          <option value="vencido">Vencido</option>
          <option value="pendiente">Pendiente</option>
        </select>
        <button class="btn-icon" title="Eliminar" onclick="eliminarPresupuesto(${i})">🗑</button>
      </div>
    </td>
  </tr>`;
  }).join('');
}

function openPresupuestoModal(){
  document.getElementById('pres-form').reset();
  document.getElementById('pres-fecha').value = TODAY_ISO;
  document.getElementById('modal-presupuesto').classList.add('open');
}

function guardarPresupuesto(){
  const cliente = document.getElementById('pres-cliente').value.trim();
  const concepto = document.getElementById('pres-concepto').value.trim();
  const telefono = document.getElementById('pres-telefono')?.value.trim() || '';
  const monto = document.getElementById('pres-monto').value;
  const vencimiento = document.getElementById('pres-vencimiento').value;
  const notas = document.getElementById('pres-notas').value.trim();
  if(!cliente||!monto){ showToast('Completá cliente y monto'); return; }
  presupuestosData.push({ id: Date.now(), fecha: TODAY_ISO, cliente, concepto, telefono, monto, vencimiento, notas, estado:'pendiente' });
  fbSave('presupuestosData', presupuestosData);
  closeModal('modal-presupuesto');
  renderPresupuestos();
  showToast('Presupuesto guardado');
}

function cambiarEstadoPres(idx, estado){
  if(!estado || idx<0 || !presupuestosData[idx]) return;
  presupuestosData[idx].estado = estado;
  fbSave('presupuestosData', presupuestosData);
  renderPresupuestos();
  showToast('Estado actualizado');
}

async function eliminarPresupuesto(idx){
  if(idx<0 || !presupuestosData[idx]) return;
  if(!await confirmModal('¿Eliminar este presupuesto?')) return;
  presupuestosData.splice(idx, 1);
  fbSave('presupuestosData', presupuestosData);
  renderPresupuestos();
  showToast('Eliminado');
}

// ── Texto y enlace de WhatsApp para un presupuesto ──
function presupuestoWaURL(p){
  const tel = (p.telefono||'').replace(/[^\d]/g,'');
  const monto = '$'+parseMoney(p.monto||0).toLocaleString('es-AR',{maximumFractionDigits:0});
  const lineas = [
    '🌸 *Florería Duhau* — Park Hyatt Buenos Aires',
    '',
    `Estimado/a ${p.cliente||''},`,
    'Le compartimos el presupuesto solicitado:',
    ''
  ];
  if(p.concepto) lineas.push(`• ${p.concepto}`);
  lineas.push(`*Total: ${monto}*`);
  if(p.vencimiento) lineas.push(`Válido hasta: ${fmtDate(p.vencimiento)}`);
  if(p.notas){ lineas.push(''); lineas.push(p.notas); }
  lineas.push('', '¡Gracias por elegirnos! 💐');
  const text = encodeURIComponent(lineas.join('\n'));
  return tel ? `https://wa.me/${tel}?text=${text}` : `https://wa.me/?text=${text}`;
}

function enviarPresupuestoWhatsApp(idx){
  const p = presupuestosData[idx];
  if(!p) return;
  window.open(presupuestoWaURL(p), '_blank');
}

// ── Documento de presupuesto con diseño de marca (ver / imprimir / PDF) ──
function verPresupuesto(idx){
  const p = presupuestosData[idx];
  if(!p) return;
  const monto = '$'+parseMoney(p.monto||0).toLocaleString('es-AR',{minimumFractionDigits:0,maximumFractionDigits:0});
  const fecha = p.fecha ? fmtDate(p.fecha) : fmtDate(TODAY_ISO);
  const vto = p.vencimiento ? fmtDate(p.vencimiento) : '';
  const waURL = presupuestoWaURL(p);
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presupuesto — ${esc(p.cliente||'')}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'DM Sans',sans-serif;color:#1A1A1A;background:#EFEDE9;padding:32px 16px}
    .sheet{max-width:760px;margin:0 auto;background:#FDFCFB;border-radius:16px;overflow:hidden;box-shadow:0 12px 44px rgba(0,0,0,.14)}
    .hero{background:#111110;color:#F7F5F2;padding:40px 48px;display:flex;align-items:center;justify-content:space-between;gap:20px}
    .hero .brand{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:400;letter-spacing:.5px;line-height:1.1}
    .hero .brand small{display:block;font-family:'DM Sans',sans-serif;font-size:9.5px;letter-spacing:3px;text-transform:uppercase;color:rgba(247,245,242,.55);margin-top:10px}
    .hero img{width:62px;height:62px;opacity:.92;flex-shrink:0}
    .body{padding:40px 48px}
    .doc-title{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#9A8F7A;margin-bottom:8px;font-weight:600}
    .cliente{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:500;margin-bottom:4px;line-height:1.1}
    .meta{font-size:12.5px;color:#7A7A72;margin-bottom:28px}
    .concepto-box{background:#F4F2ED;border:1px solid #E8E6E0;border-radius:12px;padding:22px 24px;margin-bottom:24px}
    .concepto-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9A8F7A;margin-bottom:9px;font-weight:600}
    .concepto-text{font-size:15px;line-height:1.7;color:#1A1A1A;white-space:pre-wrap}
    .total-row{display:flex;justify-content:space-between;align-items:flex-end;border-top:2px solid #1A1A1A;padding-top:18px;margin-bottom:10px}
    .total-label{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#7A7A72;font-weight:600;padding-bottom:8px}
    .total-val{font-family:'Cormorant Garamond',serif;font-size:42px;font-weight:600;color:#1A1A1A;line-height:1}
    .valid{font-size:12px;color:#7A7A72;margin-bottom:22px}
    .notas{font-size:13.5px;color:#5A5A52;line-height:1.7;border-left:3px solid #C8BEA8;padding-left:16px;white-space:pre-wrap}
    .footer{border-top:1px solid #E8E6E0;padding:22px 48px;font-size:11px;color:#9A8F7A;text-align:center;letter-spacing:.3px;line-height:1.9}
    .actions{max-width:760px;margin:22px auto 0;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
    .actions a,.actions button{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;padding:13px 26px;border-radius:10px;cursor:pointer;border:none;text-decoration:none;display:inline-flex;align-items:center;gap:8px}
    .b-print{background:#1A1A1A;color:#fff}
    .b-wa{background:#25D366;color:#fff}
    @media print{ body{background:#fff;padding:0} .sheet{box-shadow:none;border-radius:0;max-width:100%} .actions{display:none} }
  </style></head><body>
    <div class="sheet">
      <div class="hero">
        <div class="brand">Florería Duhau<small>Park Hyatt Buenos Aires</small></div>
        <img src="/icon-512.png" alt="">
      </div>
      <div class="body">
        <div class="doc-title">Presupuesto</div>
        <div class="cliente">${esc(p.cliente||'')}</div>
        <div class="meta">Fecha: ${fecha}${vto?' · Válido hasta '+vto:''}</div>
        ${p.concepto?`<div class="concepto-box"><div class="concepto-label">Detalle</div><div class="concepto-text">${esc(p.concepto)}</div></div>`:''}
        <div class="total-row"><div class="total-label">Total</div><div class="total-val">${monto}</div></div>
        ${vto?`<div class="valid">Presupuesto válido hasta el ${vto}.</div>`:''}
        ${p.notas?`<div class="notas">${esc(p.notas)}</div>`:''}
      </div>
      <div class="footer">Florería Duhau · Park Hyatt Buenos Aires · Av. Alvear 1661, CABA<br>Tel / WhatsApp: +54 9 11 7050-1615</div>
    </div>
    <div class="actions">
      <button class="b-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
      <a class="b-wa" href="${waURL}" target="_blank" rel="noopener">💬 Enviar por WhatsApp</a>
    </div>
  </body></html>`);
  win.document.close();
}

// ══════════════════════════════════════════════════════════════════════════════
// COTIZADOR DE PRESUPUESTO (armado) — dos secciones:
//  A) Arreglos de evento: se elige el arreglo (composición) y se muestra el
//     detalle de cantidades y el costo de cada ingrediente según último precio.
//  B) Ítems sueltos: líneas libres con cantidad (admite fracciones 1/2, 1/4),
//     producto y precio (unitario o por paquete).
// El total arma un presupuesto que va a la lista de Presupuestos.
// ══════════════════════════════════════════════════════════════════════════════
let cpArrRows = [];   // [{arreglo, qty}]
let cpFreeRows = [];  // [{cant, prod, precio}]  (cant como texto para admitir 1/2)

function cpParseCant(s){
  s = String(s==null?'':s).trim().replace(',', '.');
  if(!s) return 0;
  if(s.includes('/')){
    const [a,b] = s.split('/').map(x=>parseFloat(x.trim()));
    return (b && !isNaN(a) && !isNaN(b)) ? a/b : 0;
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
const _cpMoney = n => '$'+Math.round(n||0).toLocaleString('es-AR');

function renderCotizarPresupuesto(){
  const f = document.getElementById('cp-fecha'); if(f && !f.value) f.value = TODAY_ISO;
  if(!cpArrRows.length) cpArrRows = [{arreglo:'', qty:1}];
  if(!cpFreeRows.length) cpFreeRows = [{cant:'1', prod:'', precio:''}];
  const dl = document.getElementById('cp-prod-list');
  if(dl){
    const prods = [...new Set([...(stockData||[]).map(s=>s.prod), ...Object.keys(cotizadorPrecios||{})])].filter(Boolean).sort((a,b)=>a.localeCompare(b,'es'));
    dl.innerHTML = prods.map(p=>`<option value="${esc(p)}">`).join('');
  }
  cpRenderArrRows();
  cpRenderFreeRows();
  cpRender();
}

function cpRenderArrRows(){
  const cont = document.getElementById('cp-arr-rows');
  if(!cont) return;
  const nombres = [...new Set((recetasData||[]).map(r=>r.nombre))];
  cont.innerHTML = cpArrRows.map((row,i)=>{
    const opts = nombres.map(n=>`<option value="${esc(n)}"${n===row.arreglo?' selected':''}>${arregloEmoji(n)} ${esc(n)}</option>`).join('');
    return `<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
      <select onchange="cpSetArr(${i},'arreglo',this.value)" style="flex:2;min-width:170px;border:1px solid #E4E2DC;border-radius:6px;padding:7px 9px;font-size:13px">
        <option value="">— Arreglo de evento —</option>${opts}
      </select>
      <span style="color:var(--mid-gray)">×</span>
      <input type="number" min="1" value="${esc(row.qty)}" onchange="cpSetArr(${i},'qty',this.value)" style="width:64px;border:1px solid #E4E2DC;border-radius:6px;padding:7px;text-align:center;font-size:13px">
      <button class="btn-icon" style="color:var(--red-alert)" onclick="cpRemoveArr(${i})" title="Quitar">✕</button>
    </div>`;
  }).join('');
}

function _ddmm(f){ if(!f) return ''; const p=String(f).split('-'); return (p[2]&&p[1])?`${p[2]}/${p[1]}`:f; }

function cpRenderFreeRows(){
  const cont = document.getElementById('cp-free-rows');
  if(!cont) return;
  cont.innerHTML = cpFreeRows.map((row,i)=>{
    // Referencia de costo de material: último precio de compra (por paquete)
    // con su fecha y, si se conoce cuántas varas trae el paquete, también el
    // costo por vara (precio por paquete ÷ varas por paquete).
    const ref = row.prod ? getUltimoPrecioCompra(row.prod) : null;
    const vpp = row.prod ? getVarasPorPaq(row.prod) : null;
    const costoVara = row.prod
      ? (+cotizadorPrecios[row.prod] || (ref && vpp ? ref.precio / vpp : 0))
      : 0;
    const refLabel = ref
      ? `💡 costo ${_cpMoney(ref.precio)}/paq${ref.fecha?' · '+_ddmm(ref.fecha):''}${costoVara>0?' · '+_cpMoney(Math.round(costoVara))+'/vara':''}`
      : (row.prod ? '<span style="color:var(--mid-gray)">sin costo cargado</span>' : '');
    return `
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
      <input value="${esc(row.cant)}" onchange="cpSetFree(${i},'cant',this.value)" placeholder="1, 1/2, 1/4" title="Cantidad — admite fracciones como 1/2 o 1/4" style="width:78px;border:1px solid #E4E2DC;border-radius:6px;padding:7px;text-align:center;font-size:13px">
      <input value="${esc(row.prod)}" list="cp-prod-list" onchange="cpSetFree(${i},'prod',this.value)" placeholder="Producto (ej. hortensias, paq fresias)" style="flex:2;min-width:150px;border:1px solid #E4E2DC;border-radius:6px;padding:7px 9px;font-size:13px">
      <span style="color:var(--mid-gray)">$</span>
      <input type="number" min="0" value="${esc(row.precio)}" onchange="cpSetFree(${i},'precio',this.value)" placeholder="Precio" title="Precio por unidad o por paquete" style="width:100px;border:1px solid #E4E2DC;border-radius:6px;padding:7px;text-align:right;font-size:13px">
      <span style="font-size:10.5px;color:var(--sage-dark);white-space:nowrap;min-width:200px" title="Último costo de compra de este material: por paquete, su fecha y el costo por vara">${refLabel}</span>
      <button class="btn-icon" style="color:var(--red-alert)" onclick="cpRemoveFree(${i})" title="Quitar">✕</button>
    </div>`;
  }).join('');
}

function cpSetArr(i,fld,v){ if(cpArrRows[i]) cpArrRows[i][fld] = fld==='qty'?(+v||0):v; cpRender(); }
function cpAddArr(){ cpArrRows.push({arreglo:'',qty:1}); cpRenderArrRows(); cpRender(); }
function cpRemoveArr(i){ cpArrRows.splice(i,1); if(!cpArrRows.length) cpArrRows=[{arreglo:'',qty:1}]; cpRenderArrRows(); cpRender(); }
function cpSetFree(i,fld,v){
  const row = cpFreeRows[i];
  if(!row) return;
  row[fld] = v;
  if(fld==='precio'){ row._precioSugerido = false; row._precioSugFecha = ''; } // si lo tocan a mano, deja de ser sugerido
  // Al elegir el producto, sugerir el último costo de compra (con su fecha) si el precio está vacío
  if(fld==='prod'){
    const precioActual = parseFloat(row.precio);
    if(v && (!row.precio || row._precioSugerido || isNaN(precioActual) || precioActual===0)){
      const sug = getUltimoPrecioCompra(v);
      if(sug){ row.precio = sug.precio; row._precioSugerido = true; row._precioSugFecha = sug.fecha; }
      else if(row._precioSugerido){ row.precio = ''; row._precioSugerido = false; row._precioSugFecha = ''; }
      cpRenderFreeRows();
    }
  }
  cpRender();
}
function cpAddFree(){ cpFreeRows.push({cant:'1',prod:'',precio:''}); cpRenderFreeRows(); cpRender(); }
function cpRemoveFree(i){ cpFreeRows.splice(i,1); if(!cpFreeRows.length) cpFreeRows=[{cant:'1',prod:'',precio:''}]; cpRenderFreeRows(); cpRender(); }

function cpRender(){
  // ── Sección A: arreglos + composición (costo según último precio por vara) ──
  const arrOut = document.getElementById('cp-arr-detalle');
  let totalArr = 0;
  const arrValid = cpArrRows.filter(r=>r.arreglo && r.qty>0);
  if(arrOut){
    arrOut.innerHTML = !arrValid.length ? '' : arrValid.map(row=>{
      const receta = (recetasData||[]).find(r=>r.nombre===row.arreglo);
      if(!receta) return '';
      const ings = (receta.ings||[]).map(ing=>{
        const info = resolveCotizadorPrecio(ing.prod);
        const pu = info.pu;
        const varas = (+ing.qty||0) * row.qty;
        // Si el precio salió de una de las opciones (no del nombre completo),
        // guardamos cuál para mostrarlo como estimación.
        const opcion = (info.fuente && info.fuente !== ing.prod) ? info.fuente : '';
        return { prod: ing.prod, varas, pu, costo: varas*pu, opcion };
      });
      const costoArr = ings.reduce((s,x)=>s+x.costo,0);
      totalArr += costoArr;
      const faltan = ings.filter(x=>!x.pu).map(x=>x.prod);
      return `<div style="border:1px solid var(--light-gray);border-radius:10px;padding:12px 14px;margin-bottom:10px;background:var(--warm-white)">
        <div style="display:flex;justify-content:space-between;font-weight:600;margin-bottom:8px">
          <span>${arregloEmoji(row.arreglo)} ${esc(row.arreglo)} × ${row.qty}</span>
          <span>${_cpMoney(costoArr)}</span>
        </div>
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <thead><tr style="color:var(--mid-gray);font-size:10px;text-transform:uppercase">
            <th style="text-align:left;padding:2px 4px">Ingrediente</th><th style="text-align:center">Varas</th><th style="text-align:right">Precio/vara</th><th style="text-align:right">Costo</th>
          </tr></thead>
          <tbody>${ings.map(x=>`<tr style="border-top:1px solid #F0EDE8">
            <td style="padding:3px 4px">${esc(x.prod)}</td>
            <td style="text-align:center">${x.varas%1===0?x.varas:x.varas.toFixed(1)}</td>
            <td style="text-align:right;color:${x.pu?'inherit':'var(--red-alert)'}"${x.opcion?` title="Precio estimado — tomado de la opción con dato: ${esc(x.opcion)}"`:''}>${x.pu?(x.opcion?'≈ ':'')+_cpMoney(x.pu):'sin dato'}</td>
            <td style="text-align:right;font-weight:600">${x.costo?_cpMoney(x.costo):'—'}</td>
          </tr>`).join('')}</tbody>
        </table>
        ${faltan.length?`<div style="font-size:11px;color:var(--red-alert);margin-top:6px">Sin último precio cargado: ${faltan.map(esc).join(', ')}</div>`:''}
      </div>`;
    }).join('');
  }
  // ── Sección B: ítems sueltos ──
  const freeOut = document.getElementById('cp-free-detalle');
  let totalFree = 0;
  const freeValid = cpFreeRows.filter(r=>r.prod && cpParseCant(r.cant)>0);
  freeValid.forEach(r=>{ totalFree += cpParseCant(r.cant) * (parseFloat(r.precio)||0); });
  if(freeOut){
    freeOut.innerHTML = !freeValid.length ? '' : `<table style="width:100%;font-size:12.5px;border-collapse:collapse">
        <thead><tr style="color:var(--mid-gray);font-size:10px;text-transform:uppercase">
          <th style="text-align:left;padding:3px 6px">Cant.</th><th style="text-align:left">Producto</th><th style="text-align:right">Precio</th><th style="text-align:right">Subtotal</th>
        </tr></thead>
        <tbody>${freeValid.map(r=>{ const c=cpParseCant(r.cant); const p=parseFloat(r.precio)||0; return `<tr style="border-top:1px solid #F0EDE8">
          <td style="padding:3px 6px">${esc(r.cant)}</td><td>${esc(r.prod)}</td><td style="text-align:right">${_cpMoney(p)}</td><td style="text-align:right;font-weight:600">${_cpMoney(c*p)}</td>
        </tr>`; }).join('')}</tbody>
      </table>`;
  }
  const total = totalArr + totalFree;
  const totEl = document.getElementById('cp-totales');
  if(totEl){
    totEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px"><span>Costo arreglos de evento</span><strong>${_cpMoney(totalArr)}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px"><span>Ítems sueltos</span><strong>${_cpMoney(totalFree)}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:10px 0 0;margin-top:6px;border-top:2px solid var(--charcoal);font-size:17px"><span style="font-weight:700">Total</span><strong>${_cpMoney(total)}</strong></div>`;
  }
  window._cpTotal = total; window._cpTotalArr = totalArr; window._cpTotalFree = totalFree;
}

function cpReset(){
  cpArrRows = [{arreglo:'',qty:1}];
  cpFreeRows = [{cant:'1',prod:'',precio:''}];
  ['cp-evento','cp-encargado','cp-cliente','cp-telefono','cp-vencimiento'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  const f=document.getElementById('cp-fecha'); if(f) f.value=TODAY_ISO;
  renderCotizarPresupuesto();
}

function cpGuardar(){
  cpRender();
  const evento = document.getElementById('cp-evento').value.trim();
  const encargado = document.getElementById('cp-encargado').value.trim();
  const cliente = document.getElementById('cp-cliente').value.trim() || evento;
  if(!cliente){ showToast('Poné el evento o el cliente','error'); return; }
  const total = window._cpTotal||0;
  if(total<=0){ showToast('Agregá arreglos o ítems con precio','error'); return; }

  const arrValid = cpArrRows.filter(r=>r.arreglo && r.qty>0);
  const freeValid = cpFreeRows.filter(r=>r.prod && cpParseCant(r.cant)>0);

  // Detalle multilínea (va en notas → se ve en el documento / WhatsApp)
  const det = [];
  if(evento) det.push(`Evento: ${evento}`);
  if(encargado) det.push(`Encargado: ${encargado}`);
  if(arrValid.length){
    det.push('', 'Arreglos:');
    arrValid.forEach(row=>{
      const receta = (recetasData||[]).find(r=>r.nombre===row.arreglo);
      const costo = receta ? calcCostoComposicion(receta)*row.qty : 0;
      det.push(`• ${row.qty}× ${row.arreglo} — ${_cpMoney(costo)}`);
      if(receta) (receta.ings||[]).forEach(ing=>{ det.push(`   – ${(+ing.qty||0)*row.qty} ${ing.prod}`); });
    });
  }
  if(freeValid.length){
    det.push('', 'Ítems:');
    freeValid.forEach(r=>{ const c=cpParseCant(r.cant); const p=parseFloat(r.precio)||0; det.push(`• ${r.cant} ${r.prod} — ${_cpMoney(c*p)}`); });
  }

  const concepto = evento
    ? `Evento: ${evento}${encargado?' · Enc.: '+encargado:''}`
    : `Cotización · ${arrValid.length} arreglo${arrValid.length!==1?'s':''} · ${freeValid.length} ítem${freeValid.length!==1?'s':''}`;

  presupuestosData.push({
    id: Date.now(),
    fecha: document.getElementById('cp-fecha').value || TODAY_ISO,
    cliente, evento, encargado,
    telefono: document.getElementById('cp-telefono').value.trim(),
    concepto,
    monto: total,
    vencimiento: document.getElementById('cp-vencimiento').value,
    notas: det.join('\n'),
    estado: 'pendiente',
    arreglos: arrValid,
    items: freeValid,
    costoArreglos: window._cpTotalArr||0,
    totalItems: window._cpTotalFree||0
  });
  fbSave('presupuestosData', presupuestosData);
  cpArrRows = []; cpFreeRows = [];
  showToast('✅ Presupuesto armado y guardado');
  navigate('presupuestos');
}

// ════════════════════════════════════════
// PEDIDOS DE RAMOS — gerencia/comercial encarga un ramo y lo asigna a un florista.
// Se guarda como venta pendiente en ventasData → aparece en el checklist del florista.
// ════════════════════════════════════════
function buildArregloOptions(){
  let opts = '<option value="">— Seleccionar —</option>';
  if((recetasData||[]).length){
    opts += '<optgroup label="🫙 Composiciones">';
    recetasData.forEach(r => {
      const costo = calcCostoComposicion(r);
      const margen = cotizadorConfig?.margen ?? 30;
      const precio = Math.round(costo*(1+margen/100));
      opts += `<option value="${esc(r.nombre)}" data-precio="${precio}">${arregloEmoji(r.nombre)} ${esc(r.nombre)} — $${precio.toLocaleString('es-AR')}</option>`;
    });
    opts += '</optgroup>';
  }
  (listaPreciosData||[]).forEach(cat => {
    if(!(cat.items||[]).length) return;
    opts += `<optgroup label="${cat.emoji||'📦'} ${esc(cat.cat)}">`;
    cat.items.forEach(it => {
      opts += `<option value="${esc(it.nombre)}" data-precio="${parseMoney(it.precio)}">${esc(it.nombre)} — ${esc(it.precio||'')}</option>`;
    });
    opts += '</optgroup>';
  });
  opts += '<option value="__otro__">+ Otro</option>';
  return opts;
}

function openPedidoRamoModal(){
  const f = document.getElementById('pedido-ramo-form'); if(f) f.reset();
  document.getElementById('pr-arreglo').innerHTML = buildArregloOptions();
  const floristas = typeof getFloristasActivos === 'function' ? getFloristasActivos() : CL_RESP_OPTS.filter(n=>n!=='Jardineria');
  document.getElementById('pr-asignado').innerHTML = '<option value="">— Sin asignar —</option>' + floristas.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
  document.getElementById('pr-fecha').value = TODAY_ISO;
  document.getElementById('modal-pedido-ramo').classList.add('open');
}

async function pedidoRamoAutoPrice(){
  const sel = document.getElementById('pr-arreglo');
  if(sel.value === '__otro__'){
    const custom = await promptModal('Nombre del arreglo o ramo:', { title: 'Otro producto' });
    if(custom && custom.trim()){
      const opt = document.createElement('option');
      opt.value = custom.trim(); opt.textContent = custom.trim(); opt.selected = true;
      sel.insertBefore(opt, sel.lastElementChild);
    } else { sel.value = ''; }
    return;
  }
  const o = sel.options[sel.selectedIndex];
  const precio = o?.dataset?.precio;
  if(precio && +precio > 0) document.getElementById('pr-precio').value = '$' + (+precio).toLocaleString('es-AR');
}

// Aviso dirigido a un florista cuando se le asigna algo (evento, pedido o venta)
function notificarAsignacion(florista, title, body){
  if(!florista) return;
  window.pushSend?.(title, body, 'asignacion', florista);
}
window.notificarAsignacion = notificarAsignacion;

// Aviso a gerencia/comercial cuando se registra una venta (ramo vendido o
// venta cargada en Ventas Externas): hubo una modificación y, si no tiene a
// alguien asignado, queda pendiente de asignar quién la prepara.
function notificarVentaNueva(prod, cliente, asignado){
  const quien = cliente ? ' · ' + cliente : '';
  if(asignado){
    window.pushSend?.('💐 Nueva venta registrada', `"${prod}"${quien} — asignada a ${asignado}`, 'venta-nueva', 'roles:gerencia,comercial');
  } else {
    window.pushSend?.('💐 Nueva venta · pendiente de asignar', `"${prod}"${quien} — revisá y asigná quién la prepara`, 'venta-nueva', 'roles:gerencia,comercial');
  }
}
window.notificarVentaNueva = notificarVentaNueva;

function guardarPedidoRamo(){
  const prod = document.getElementById('pr-arreglo').value.trim();
  const cliente = document.getElementById('pr-cliente').value.trim();
  const asignado = document.getElementById('pr-asignado').value;
  if(!prod || prod==='__otro__'){ showToast('Elegí el arreglo'); return; }
  if(!cliente){ showToast('Completá el cliente'); return; }
  // El florista NO es obligatorio: si queda sin asignar, lo asigna Gerencia.
  ventasData.push({
    prod,
    desc: '',
    cliente,
    fecha: document.getElementById('pr-fecha').value || TODAY_ISO,
    dedicatoria: document.getElementById('pr-dedicatoria').value.trim(),
    precio: document.getElementById('pr-precio').value || '—',
    formaPago: document.getElementById('pr-pago').value,
    estado: 'pendiente',
    dir: document.getElementById('pr-dir').value.trim(),
    colores: document.getElementById('pr-colores').value.trim(),
    asignado,
    esPedidoRamo: true,
    sucursal: getSucursalId()
  });
  fbSave('ventasData', ventasData);
  closeModal('modal-pedido-ramo');
  renderPedidosRamos();
  if(document.getElementById('page-ventas-externas')?.classList.contains('active')) renderVentas();
  const cuando = document.getElementById('pr-fecha').value ? ' · ' + fmtDate(document.getElementById('pr-fecha').value) : '';
  if(asignado){
    notificarAsignacion(asignado, '💐 Nuevo pedido asignado', `Ramo para ${cliente}${cuando}`);
    showToast(`💐 Pedido asignado a ${asignado} — aparece en su checklist`);
  } else {
    // Sin asignar: avisar a Gerencia para que lo asigne a un florista.
    window.pushSend?.('💐 Nuevo pedido de ramo', `Para ${cliente}${cuando} — asigná un florista`, 'pedido-ramo', 'Gerencia');
    showToast('💐 Pedido creado — Gerencia lo asignará a un florista');
  }
}

function renderPedidosRamos(){
  const el = document.getElementById('pedidos-ramos-body');
  if(!el) return;
  // Solo pedidos en curso; los entregados ya pasaron a Ventas Externas
  const pedidos = (ventasData||[]).filter(v => v.esPedidoRamo && v.estado !== 'entregado' && !v.fin);
  const sorted = [...pedidos].sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  if(!sorted.length){ el.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--mid-gray);padding:24px">Sin pedidos. Tocá «+ Nuevo Pedido» para encargar un ramo y asignarlo a un florista.</td></tr>'; return; }
  const estLbl = {pendiente:'⏳ Pendiente', confirmado:'✅ Confirmado', entregado:'🚚 Entregado'};
  const floristas = (typeof getFloristasActivos === 'function' ? getFloristasActivos() : []);
  el.innerHTML = sorted.map(v=>{
    const i = ventasData.indexOf(v);
    const hecho = v.estado==='entregado' || v.fin;
    // Gerencia asigna/reasigna el florista desde acá; el resto lo ve solo lectura.
    const asignCell = userRole === 'gerencia'
      ? `<select class="form-input" style="padding:5px 8px;font-size:12px;min-width:130px" onchange="asignarFloristaPedido(${i}, this.value)">
           <option value="">— Sin asignar —</option>
           ${floristas.map(f=>`<option value="${esc(f)}" ${v.asignado===f?'selected':''}>${esc(f)}</option>`).join('')}
         </select>`
      : (v.asignado
          ? `<span style="font-weight:600;color:var(--sage-dark)">${esc(v.asignado)}</span>`
          : `<span style="font-weight:600;color:#9A6A1E">⚠ Sin asignar</span>`);
    return `<tr${hecho?' style="opacity:.55"':''}>
      <td style="white-space:nowrap">${v.fecha?fmtDate(v.fecha):'—'}</td>
      <td><strong>${esc(v.prod||'—')}</strong></td>
      <td>${esc(v.cliente||'—')}</td>
      <td style="font-size:12px">${esc(v.colores||'—')}</td>
      <td>${asignCell}</td>
      <td style="white-space:nowrap;font-weight:600">${esc(v.precio||'—')}</td>
      <td><span style="font-size:11px">${estLbl[v.estado]||esc(v.estado||'')}${v.fin?' · '+esc(v.fin):''}</span></td>
      <td style="white-space:nowrap"><button class="btn-icon" title="Eliminar" onclick="eliminarPedidoRamo(${i})">🗑</button></td>
    </tr>`;
  }).join('');
}

// Gerencia asigna (o reasigna) un florista a un pedido de ramo y le avisa.
function asignarFloristaPedido(i, nombre){
  const v = ventasData[i];
  if(!v) return;
  v.asignado = nombre || '';
  fbSave('ventasData', ventasData);
  renderPedidosRamos();
  if(document.getElementById('page-checklist')?.classList.contains('active')) renderChecklistTable?.();
  if(nombre){
    notificarAsignacion(nombre, '💐 Nuevo pedido asignado', `Ramo para ${v.cliente||''}${v.fecha ? ' · ' + fmtDate(v.fecha) : ''}`);
    showToast(`💐 Asignado a ${nombre} — aparece en su checklist`);
  } else {
    showToast('Pedido sin asignar');
  }
}
window.asignarFloristaPedido = asignarFloristaPedido;

async function eliminarPedidoRamo(i){
  if(i<0 || !ventasData[i]) return;
  if(!await confirmModal('¿Eliminar este pedido?')) return;
  ventasData.splice(i,1);
  fbSave('ventasData', ventasData);
  renderPedidosRamos();
  showToast('Pedido eliminado');
}

// Detalle de un pedido/venta — se abre al tocarlo en el checklist, igual que los eventos
function openVentaDetail(vIdx){
  const v = ventasData[vIdx]; if(!v) return;
  const estados = {pendiente:'⏳ Pendiente', confirmado:'✅ Confirmado', entregado:'🚚 Entregado'};
  const row = (label, val) => val ? `<div><div class="detail-field-label">${label}</div><div class="detail-field-value">${esc(String(val))}</div></div>` : '';
  let ov = document.getElementById('venta-detail-modal');
  if(!ov){ ov = document.createElement('div'); ov.id='venta-detail-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="modal" style="max-width:480px">
    <div class="modal-header"><h2>💐 ${esc(v.prod||'Pedido')}</h2><button class="modal-close" onclick="closeModal('venta-detail-modal')">✕</button></div>
    <div class="modal-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 16px">
        ${row('Cliente', v.cliente)}
        ${row('Para cuándo', v.fecha ? fmtDate(v.fecha) : '')}
        ${row('Tonalidades / colores', v.colores)}
        ${row('Forma de pago', v.formaPago)}
        ${row('Precio', v.precio)}
        ${row('Estado', estados[v.estado] || v.estado)}
      </div>
      ${v.dir ? `<div style="margin-top:14px"><div class="detail-field-label">Dirección de entrega</div><div class="detail-field-value">📍 ${esc(v.dir)}</div></div>` : ''}
      ${v.dedicatoria ? `<div style="margin-top:14px;background:var(--cream);border-radius:8px;padding:12px 14px"><div class="detail-field-label">Dedicatoria</div><div style="font-style:italic;font-size:14px;color:var(--charcoal);margin-top:4px">"${esc(v.dedicatoria)}"</div></div>` : ''}
      ${v.desc ? `<div style="margin-top:14px"><div class="detail-field-label">Detalle</div><div class="detail-field-value">${esc(v.desc)}</div></div>` : ''}
    </div>
  </div>`;
  ov.classList.add('open');
}
window.openVentaDetail = openVentaDetail;

// Cambio de vista dentro de Ramos Disponibles: Disponibles ↔ Pedidos
let ramosView = 'disponibles';
function setRamosView(v){
  ramosView = v;
  const td = document.getElementById('rd-tab-disp');
  const tp = document.getElementById('rd-tab-ped');
  if(td) td.classList.toggle('active', v==='disponibles');
  if(tp) tp.classList.toggle('active', v==='pedidos');
  const vd = document.getElementById('rd-view-disponibles');
  const vp = document.getElementById('rd-view-pedidos');
  if(vd) vd.style.display = v==='disponibles' ? '' : 'none';
  if(vp) vp.style.display = v==='pedidos' ? '' : 'none';
  if(v==='pedidos') renderPedidosRamos(); else renderRamosDisp();
}
window.setRamosView = setRamosView;

// Cableado robusto de los botones de vista (por si el onclick inline no dispara)
function initRamosToggle(){
  const td = document.getElementById('rd-tab-disp');
  const tp = document.getElementById('rd-tab-ped');
  if(td && !td.dataset.wired){ td.dataset.wired = '1'; td.addEventListener('click', () => setRamosView('disponibles')); }
  if(tp && !tp.dataset.wired){ tp.dataset.wired = '1'; tp.addEventListener('click', () => setRamosView('pedidos')); }
}
window.initRamosToggle = initRamosToggle;
window.openPedidoRamoModal = openPedidoRamoModal;
window.pedidoRamoAutoPrice = pedidoRamoAutoPrice;
window.guardarPedidoRamo = guardarPedidoRamo;
window.renderPedidosRamos = renderPedidosRamos;
window.eliminarPedidoRamo = eliminarPedidoRamo;

// ════════════════════════════════════════
// EVENTOS SIN FLORERÍA — eventos en los que el hotel NO nos asignó
// la parte floral (trajo otra marca/ambientador). Sirve para llevar
// registro y reclamarle al hotel según contrato.
// ════════════════════════════════════════
let eventosSinFloreria = [];
window._setEventosSinFloreria = arr => { eventosSinFloreria = arr && typeof arr === 'object' ? (Array.isArray(arr)?arr:Object.values(arr)) : []; renderEventosSinFloreria(); };

const ESF_ESTADOS = {
  pendiente:       {lbl:'Pendiente de reclamar', bg:'#fff3cd', col:'#856404'},
  reclamado:       {lbl:'Reclamado al hotel',    bg:'#cce5ff', col:'#004085'},
  compensado:      {lbl:'Compensado',            bg:'#d4edda', col:'#155724'},
  'sin-respuesta': {lbl:'Sin respuesta',         bg:'#f8d7da', col:'#721c24'}
};

function renderEventosSinFloreria(){
  const el = document.getElementById('esf-body');
  if(!el) return;
  const sorted = [...eventosSinFloreria].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));

  // KPIs
  const total       = eventosSinFloreria.length;
  const pendientes  = eventosSinFloreria.filter(e=>e.estado!=='compensado').length;
  const aReclamar   = eventosSinFloreria.filter(e=>e.estado!=='compensado').reduce((s,e)=>s+parseMoney(e.monto||0),0);
  const compensado  = eventosSinFloreria.filter(e=>e.estado==='compensado').reduce((s,e)=>s+parseMoney(e.monto||0),0);
  const stats = document.getElementById('esf-stats');
  if(stats) stats.innerHTML = `
    <div class="kpi-card"><div class="kpi-val">${total}</div><div class="kpi-lbl">Eventos sin florería</div></div>
    <div class="kpi-card"><div class="kpi-val">${pendientes}</div><div class="kpi-lbl">Pendientes / abiertos</div></div>
    <div class="kpi-card"><div class="kpi-val">$${aReclamar.toLocaleString('es-AR',{maximumFractionDigits:0})}</div><div class="kpi-lbl">Monto a reclamar</div></div>
    <div class="kpi-card"><div class="kpi-val">$${compensado.toLocaleString('es-AR',{maximumFractionDigits:0})}</div><div class="kpi-lbl">Compensado</div></div>`;

  if(!sorted.length){
    el.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--mid-gray);padding:28px">'+
      'Sin eventos registrados todavía. Tocá «+ Registrar evento» cuando el hotel no nos asigne la parte floral.</td></tr>';
    return;
  }

  el.innerHTML = sorted.map(ev=>{
    const realIdx = eventosSinFloreria.indexOf(ev);
    const st = ESF_ESTADOS[ev.estado] || ESF_ESTADOS.pendiente;
    return `<tr style="cursor:pointer" onclick="openEsfModal(${realIdx})">
      <td style="white-space:nowrap">${ev.fecha?fmtDate(ev.fecha):'—'}</td>
      <td><strong>${esc(ev.nombre||'—')}</strong>${ev.tipo?`<div style="font-size:11px;color:var(--mid-gray)">${esc(ev.tipo)}</div>`:''}</td>
      <td>${esc(ev.salon||'—')}</td>
      <td>${esc(ev.marca||'—')}</td>
      <td style="font-size:12px;color:var(--charcoal);max-width:220px">${esc(ev.arregloCorr||'—')}</td>
      <td style="white-space:nowrap;font-weight:600;color:#B03020">${ev.monto?('$'+parseMoney(ev.monto).toLocaleString('es-AR',{maximumFractionDigits:0})):'—'}</td>
      <td><span style="background:${st.bg};color:${st.col};padding:2px 8px;border-radius:10px;font-size:11px;white-space:nowrap">${st.lbl}</span></td>
      <td onclick="event.stopPropagation()" style="white-space:nowrap">
        <button class="btn-icon" title="Editar" onclick="openEsfModal(${realIdx})">✏️</button>
        <button class="btn-icon" title="Eliminar" onclick="eliminarEsf(${realIdx})">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

function openEsfModal(idx){
  const f = document.getElementById('esf-form'); if(f) f.reset();
  document.getElementById('esf-idx').value = idx;
  const titleEl = document.getElementById('esf-modal-title');
  if(idx>=0 && eventosSinFloreria[idx]){
    const ev = eventosSinFloreria[idx];
    titleEl.textContent = 'Editar evento sin florería';
    document.getElementById('esf-nombre').value        = ev.nombre||'';
    document.getElementById('esf-tipo').value          = ev.tipo||'';
    document.getElementById('esf-fecha').value         = ev.fecha||'';
    document.getElementById('esf-salon').value         = ev.salon||'';
    document.getElementById('esf-pax').value           = ev.pax||'';
    document.getElementById('esf-marca').value         = ev.marca||'';
    document.getElementById('esf-arreglo').value       = ev.arregloCorr||'';
    document.getElementById('esf-monto').value         = ev.monto||'';
    document.getElementById('esf-estado').value        = ev.estado||'pendiente';
    document.getElementById('esf-fecha-reclamo').value = ev.fechaReclamo||'';
    document.getElementById('esf-detalle').value       = ev.detalle||'';
  } else {
    titleEl.textContent = 'Registrar evento sin florería';
    document.getElementById('esf-fecha').value  = TODAY_ISO;
    document.getElementById('esf-estado').value = 'pendiente';
  }
  document.getElementById('modal-esf').classList.add('open');
}

function guardarEsf(){
  const nombre = document.getElementById('esf-nombre').value.trim();
  if(!nombre){ showToast('Poné al menos el nombre del evento'); return; }
  const obj = {
    nombre,
    tipo:         document.getElementById('esf-tipo').value.trim(),
    fecha:        document.getElementById('esf-fecha').value,
    salon:        document.getElementById('esf-salon').value.trim(),
    pax:          document.getElementById('esf-pax').value,
    marca:        document.getElementById('esf-marca').value.trim(),
    arregloCorr:  document.getElementById('esf-arreglo').value.trim(),
    monto:        document.getElementById('esf-monto').value,
    estado:       document.getElementById('esf-estado').value || 'pendiente',
    fechaReclamo: document.getElementById('esf-fecha-reclamo').value,
    detalle:      document.getElementById('esf-detalle').value.trim(),
    sucursal:     getSucursalId()
  };
  const idx = parseInt(document.getElementById('esf-idx').value, 10);
  if(idx>=0 && eventosSinFloreria[idx]){
    obj.id = eventosSinFloreria[idx].id || Date.now();
    eventosSinFloreria[idx] = obj;
  } else {
    obj.id = Date.now();
    eventosSinFloreria.push(obj);
  }
  fbSave('eventosSinFloreria', eventosSinFloreria);
  closeModal('modal-esf');
  renderEventosSinFloreria();
  showToast('✅ Evento guardado');
}

async function eliminarEsf(idx){
  if(idx<0 || !eventosSinFloreria[idx]) return;
  if(!await confirmModal('¿Eliminar este registro de evento sin florería?')) return;
  eventosSinFloreria.splice(idx,1);
  fbSave('eventosSinFloreria', eventosSinFloreria);
  renderEventosSinFloreria();
  showToast('Eliminado');
}

// Genera un documento de reclamo formal e imprimible (PDF) para el hotel.
function exportEsfReclamo(){
  if(!eventosSinFloreria.length){ showToast('No hay eventos registrados para reclamar'); return; }
  // Por defecto, el reclamo incluye los casos abiertos (no compensados).
  const abiertos = eventosSinFloreria.filter(e=>e.estado!=='compensado');
  const lista = (abiertos.length ? abiertos : eventosSinFloreria)
    .slice().sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  const total = lista.reduce((s,e)=>s+parseMoney(e.monto||0),0);
  const hoy = fmtDate(TODAY_ISO);
  const fmtMon = n => '$'+parseMoney(n||0).toLocaleString('es-AR',{minimumFractionDigits:0,maximumFractionDigits:0});

  const rows = lista.map(e=>`
    <tr>
      <td>${e.fecha?fmtDate(e.fecha):'—'}</td>
      <td><strong>${esc(e.nombre||'—')}</strong>${e.tipo?`<br><span class="muted">${esc(e.tipo)}</span>`:''}</td>
      <td>${esc(e.salon||'—')}</td>
      <td>${esc(e.marca||'—')}</td>
      <td>${esc(e.arregloCorr||'—')}</td>
      <td class="num">${e.monto?fmtMon(e.monto):'—'}</td>
    </tr>`).join('');

  const win = window.open('','_blank');
  win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
  <title>Reclamo de eventos — Florería Duhau</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:'Georgia','Times New Roman',serif;margin:48px;color:#1a1a1a;line-height:1.6}
    .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1a1a1a;padding-bottom:16px;margin-bottom:24px}
    .brand{font-size:24px;letter-spacing:.5px}
    .brand small{display:block;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#777;margin-top:4px;font-family:Arial,sans-serif}
    .meta{text-align:right;font-size:12px;color:#555;font-family:Arial,sans-serif}
    h1{font-size:18px;margin:8px 0 4px}
    p.intro{font-size:13.5px;color:#333}
    table{width:100%;border-collapse:collapse;margin:22px 0;font-family:Arial,sans-serif}
    th,td{border:1px solid #ccc;padding:8px 10px;font-size:12px;vertical-align:top;text-align:left}
    th{background:#f2f0eb;text-transform:uppercase;letter-spacing:.5px;font-size:10px;color:#444}
    td.num,th.num{text-align:right;white-space:nowrap}
    .muted{color:#888;font-size:11px}
    tfoot td{font-weight:bold;font-size:14px;background:#faf8f4}
    .firma{margin-top:48px;font-size:12px;color:#555;font-family:Arial,sans-serif}
    .firma .line{margin-top:40px;border-top:1px solid #999;width:240px;padding-top:6px}
    .actions{margin-top:32px}
    button{padding:10px 22px;cursor:pointer;font-size:13px;border:1px solid #1a1a1a;background:#1a1a1a;color:#fff;border-radius:6px;font-family:Arial,sans-serif}
    @media print{.actions{display:none}body{margin:0}}
  </style></head><body>
    <div class="head">
      <div class="brand">Florería Duhau<small>Park Hyatt Buenos Aires</small></div>
      <div class="meta">Fecha: ${hoy}<br>Detalle de reclamo</div>
    </div>
    <h1>Reclamo — Eventos sin asignación de servicio floral</h1>
    <p class="intro">Por la presente dejamos constancia de los eventos detallados a continuación, en los cuales —conforme al acuerdo vigente— correspondía la asignación del servicio floral a Florería Duhau y la misma no fue otorgada, habiéndose contratado a un proveedor externo. Se solicita la regularización / compensación correspondiente.</p>
    <table>
      <thead><tr>
        <th>Fecha</th><th>Evento</th><th>Salón / Zona</th><th>Marca externa</th><th>Arreglo que correspondía</th><th class="num">Monto</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="5" style="text-align:right">TOTAL A RECLAMAR</td><td class="num">${fmtMon(total)}</td></tr></tfoot>
    </table>
    <p class="intro" style="font-size:12px;color:#666">Cantidad de eventos incluidos: ${lista.length}.</p>
    <div class="firma">
      <div class="line">Florería Duhau</div>
    </div>
    <div class="actions"><button onclick="window.print()">🖨️ Imprimir / Guardar PDF</button></div>
  </body></html>`);
  win.document.close();
}

// ════════════════════════════════════════
// FEATURE 5: CIERRE MENSUAL AUTOMATIZADO
// ════════════════════════════════════════
let cierresMensualesData = [];
window._setCierresMensuales = arr => { cierresMensualesData = arr && typeof arr === 'object' ? (Array.isArray(arr)?arr:Object.values(arr)) : []; renderCierreMensual(); };

function renderCierreMensual(){
  const el = document.getElementById('cierre-mensual-body');
  if(!el) return;
  const sorted = [...cierresMensualesData].sort((a,b)=>(b.mes||'').localeCompare(a.mes||''));
  if(!sorted.length){ el.innerHTML = '<div style="color:var(--mid-gray);text-align:center;padding:40px">No hay cierres guardados. Generá el primero con el botón "Generar Cierre".</div>'; return; }
  el.innerHTML = sorted.map((c,i)=>`
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="margin:0">${fmtMonth(c.mes)}</h3>
        <div style="display:flex;gap:8px">
          <button class="btn-secondary" style="font-size:12px" onclick="verCierreMensual(${i})">👁 Ver detalle</button>
          <button class="btn-secondary" style="font-size:12px" onclick="exportCierrePDF(${i})">📄 PDF</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">
        <div class="kpi-card"><div class="kpi-val">$${parseMoney(c.totalVentas||0).toLocaleString('es-AR',{minimumFractionDigits:0})}</div><div class="kpi-lbl">Ventas totales</div></div>
        <div class="kpi-card"><div class="kpi-val">$${parseMoney(c.totalCompras||0).toLocaleString('es-AR',{minimumFractionDigits:0})}</div><div class="kpi-lbl">Compras totales</div></div>
        <div class="kpi-card"><div class="kpi-val">${c.cantEventos||0}</div><div class="kpi-lbl">Eventos</div></div>
        <div class="kpi-card"><div class="kpi-val">$${parseMoney(c.totalCaja||0).toLocaleString('es-AR',{minimumFractionDigits:0})}</div><div class="kpi-lbl">Caja neta</div></div>
      </div>
    </div>`).join('');
}

async function generarCierreMensual(){
  const mes = document.getElementById('cierre-mes-sel')?.value || CURR_MONTH;
  const ventas = (ventasData||[]).filter(v=>v.fecha&&v.fecha.startsWith(mes));
  const totalVentas = ventas.reduce((s,v)=>s+parseMoney(v.monto||v.total||0),0);
  const compras = [...(comprasFlore||[]),...(comprasJard||[])].filter(c=>c.fecha&&c.fecha.startsWith(mes)&&!c.anulado);
  const totalCompras = compras.reduce((s,c)=>s+_compraImporte(c),0);
  const eventos = (eventosData||[]).filter(e=>e.fecha&&e.fecha.startsWith(mes));
  const cajaMov = (cajaData||[]).filter(m=>m.fecha&&m.fecha.startsWith(mes));
  const ingresos = cajaMov.filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+parseMoney(m.monto||0),0);
  const egresos = cajaMov.filter(m=>m.tipo==='egreso').reduce((s,m)=>s+parseMoney(m.monto||0),0);
  const cierre = {
    mes, fechaCierre: TODAY_ISO,
    totalVentas, totalCompras,
    cantEventos: eventos.length,
    cantVentas: ventas.length,
    cantCompras: compras.length,
    totalCaja: ingresos - egresos,
    ingresosCaja: ingresos, egresosCaja: egresos,
    margenBruto: totalVentas - totalCompras,
    resumen: `Cierre ${fmtMonth(mes)}: ${ventas.length} ventas, ${compras.length} compras, ${eventos.length} eventos`
  };
  const existing = cierresMensualesData.findIndex(c=>c.mes===mes);
  if(existing>=0){
    if(!await confirmModal(`Ya existe un cierre para ${fmtMonth(mes)}. ¿Reemplazarlo?`)) return;
    cierresMensualesData[existing] = cierre;
  } else {
    cierresMensualesData.push(cierre);
  }
  fbSave('cierresMensualesData', cierresMensualesData);
  renderCierreMensual();
  showToast(`✅ Cierre de ${fmtMonth(mes)} generado`);
}

function verCierreMensual(idx){
  const sorted = [...cierresMensualesData].sort((a,b)=>(b.mes||'').localeCompare(a.mes||''));
  const c = sorted[idx];
  if(!c) return;
  const win = window.open('','_blank');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cierre ${fmtMonth(c.mes)}</title>
  <style>body{font-family:Arial,sans-serif;margin:40px;color:#1a1a1a}h1{font-size:22px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ccc;padding:8px 12px;font-size:13px}th{background:#f5f5f0}.total{font-weight:bold;font-size:16px}</style></head><body>
  <h1>🌸 Cierre Mensual — ${fmtMonth(c.mes)}</h1>
  <p style="color:#777">Generado el ${fmtDate(c.fechaCierre)}</p>
  <table><tbody>
    <tr><th>Ventas totales</th><td class="total">$${parseMoney(c.totalVentas).toLocaleString('es-AR',{minimumFractionDigits:2})}</td></tr>
    <tr><th>Compras totales</th><td>$${parseMoney(c.totalCompras).toLocaleString('es-AR',{minimumFractionDigits:2})}</td></tr>
    <tr><th>Margen bruto</th><td class="total">$${parseMoney(c.margenBruto).toLocaleString('es-AR',{minimumFractionDigits:2})}</td></tr>
    <tr><th>Ingresos caja</th><td>$${parseMoney(c.ingresosCaja).toLocaleString('es-AR',{minimumFractionDigits:2})}</td></tr>
    <tr><th>Egresos caja</th><td>$${parseMoney(c.egresosCaja).toLocaleString('es-AR',{minimumFractionDigits:2})}</td></tr>
    <tr><th>Caja neta</th><td class="total">$${parseMoney(c.totalCaja).toLocaleString('es-AR',{minimumFractionDigits:2})}</td></tr>
    <tr><th>Cantidad ventas</th><td>${c.cantVentas}</td></tr>
    <tr><th>Cantidad compras</th><td>${c.cantCompras}</td></tr>
    <tr><th>Eventos del mes</th><td>${c.cantEventos}</td></tr>
  </tbody></table>
  <button onclick="window.print()" style="padding:8px 20px;cursor:pointer">🖨️ Imprimir</button>
  </body></html>`);
  win.document.close();
}

function exportCierrePDF(idx){ verCierreMensual(idx); }

// ════════════════════════════════════════
// FEATURE 6: DASHBOARD UNIFICADO DE GERENCIA
// ════════════════════════════════════════
let _dashGerTimer = null;
function renderDashboardGerencia(){
  const el = document.getElementById('dash-ger-body');
  if(!el) return;
  const mes = CURR_MONTH;
  const ventas = (ventasData||[]).filter(v=>v.fecha&&v.fecha.startsWith(mes));
  const tvMes = ventas.reduce((s,v)=>s+parseMoney(v.monto||v.total||0),0);
  const compras = [...(comprasFlore||[]),...(comprasJard||[])].filter(c=>c.fecha&&c.fecha.startsWith(mes)&&!c.anulado);
  const tcMes = compras.reduce((s,c)=>s+_compraImporte(c),0);
  const evMes = (eventosData||[]).filter(e=>e.fecha&&e.fecha.startsWith(mes));
  const evHoy = (eventosData||[]).filter(e=>e.fecha===TODAY_ISO);
  const stockBajos = (stockData||[]).filter(s=>(s.cantidad||0)<=(s.min||0));
  const pedPend = (pedidosHabData||[]).filter(p=>p.estado==='pendiente');
  const clientes = (clientesData||[]).length;
  const presupuestos = (presupuestosData||[]).filter(p=>p.fecha&&p.fecha.startsWith(mes));
  const presAceptados = presupuestos.filter(p=>p.estado==='aceptado');
  const conversion = presupuestos.length ? Math.round(presAceptados.length/presupuestos.length*100) : 0;
  const margen = tvMes > 0 ? Math.round((tvMes-tcMes)/tvMes*100) : 0;
  el.innerHTML = `
    <div class="dash-ger-update">Última actualización: ${new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})} · <button class="btn-secondary" style="font-size:11px" onclick="renderDashboardGerencia()">🔄 Actualizar</button></div>
    <div class="dash-ger-grid">
      <div class="dash-ger-section">
        <div class="dash-ger-title">💰 Finanzas del mes</div>
        <div class="kpi-grid-mini">
          <div class="kpi-card"><div class="kpi-val green">$${tvMes.toLocaleString('es-AR',{minimumFractionDigits:0})}</div><div class="kpi-lbl">Ventas del mes</div></div>
          <div class="kpi-card"><div class="kpi-val">$${tcMes.toLocaleString('es-AR',{minimumFractionDigits:0})}</div><div class="kpi-lbl">Compras del mes</div></div>
          <div class="kpi-card"><div class="kpi-val ${margen>=30?'green':margen>=15?'amber':'red'}">%${margen}</div><div class="kpi-lbl">Margen bruto</div></div>
          <div class="kpi-card"><div class="kpi-val">$${(tvMes-tcMes).toLocaleString('es-AR',{minimumFractionDigits:0})}</div><div class="kpi-lbl">Resultado</div></div>
        </div>
      </div>
      <div class="dash-ger-section">
        <div class="dash-ger-title">📅 Operaciones</div>
        <div class="kpi-grid-mini">
          <div class="kpi-card"><div class="kpi-val">${evHoy.length}</div><div class="kpi-lbl">Eventos hoy</div></div>
          <div class="kpi-card"><div class="kpi-val">${evMes.length}</div><div class="kpi-lbl">Eventos del mes</div></div>
          <div class="kpi-card ${pedPend.length>0?'kpi-alert':''}"><div class="kpi-val">${pedPend.length}</div><div class="kpi-lbl">Pedidos hab. pendientes</div></div>
          <div class="kpi-card ${stockBajos.length>0?'kpi-alert':''}"><div class="kpi-val">${stockBajos.length}</div><div class="kpi-lbl">Stock bajo mínimo</div></div>
        </div>
      </div>
      <div class="dash-ger-section">
        <div class="dash-ger-title">🤝 Comercial</div>
        <div class="kpi-grid-mini">
          <div class="kpi-card"><div class="kpi-val">${ventas.length}</div><div class="kpi-lbl">Ventas del mes</div></div>
          <div class="kpi-card"><div class="kpi-val">${presupuestos.length}</div><div class="kpi-lbl">Presupuestos enviados</div></div>
          <div class="kpi-card"><div class="kpi-val">${conversion}%</div><div class="kpi-lbl">Tasa conversión</div></div>
          <div class="kpi-card"><div class="kpi-val">${clientes}</div><div class="kpi-lbl">Clientes en CRM</div></div>
        </div>
      </div>
    </div>
    ${stockBajos.length>0?`<div class="dash-ger-alert"><strong>⚠️ Stock bajo mínimo:</strong> ${stockBajos.slice(0,5).map(s=>`${esc(s.prod)} (${s.cantidad}/${s.min})`).join(', ')}${stockBajos.length>5?` y ${stockBajos.length-5} más...`:''}</div>`:''}
    ${pedPend.length>0?`<div class="dash-ger-alert"><strong>🛎 Pedidos pendientes:</strong> ${pedPend.length} pedido(s) de habitación esperando atención.</div>`:''}`;
  if(_dashGerTimer) clearInterval(_dashGerTimer);
  _dashGerTimer = setInterval(renderDashboardGerencia, 300000);
}

// ════════════════════════════════════════
// FEATURE 7: EXPORTACIÓN A EXCEL (.xlsx)
// ════════════════════════════════════════
function _xlsxDownload(wb, filename){
  const X = window.XLSX;
  if(!X){ showToast('Error: librería XLSX no disponible'); return; }
  X.writeFile(wb, filename);
}

function exportVentasXLSX(){
  const X = window.XLSX;
  if(!X){ showToast('Error: XLSX no disponible'); return; }
  // Respetar los filtros de la pantalla (mes/pago/tipo/facturado). Sin mes elegido,
  // exporta el mes en curso. Antes exportaba contra campos inexistentes (monto/qty)
  // y salían todos los montos en $0 y sin cliente/forma de pago.
  const fMes  = document.getElementById('ve-filter-mes')?.value || CURR_MONTH;
  const fPago = document.getElementById('ve-filter-pago')?.value || '';
  const fTipo = document.getElementById('ve-filter-tipo')?.value || '';
  const fFact = document.getElementById('ve-filter-fact')?.value || '';
  let lista = (ventasData||[]).filter(v=>!(v.esPedidoRamo && v.estado!=='entregado'));
  lista = lista.filter(v=>(v.fecha||'').startsWith(fMes));
  if(fPago) lista = lista.filter(v=>normPago(v.formaPago)===fPago);
  if(fTipo) lista = lista.filter(v=>(v.prod||'').trim()===fTipo);
  if(fFact==='si') lista = lista.filter(v=>v.facturado==='Sí');
  if(fFact==='no') lista = lista.filter(v=>v.facturado!=='Sí');
  lista.sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  const rows = lista.map(v=>{
    const costo = costoVenta(v);
    const margen = costo!=null ? parseMoney(v.precio)-costo-parseMoney(v.envioCosto) : '';
    return {
      Fecha: v.fecha||'',
      Producto: v.prod||'',
      Descripción: v.desc||'',
      Cliente: v.cliente||'',
      Destinatario: v.destinatario||'',
      Dedicatoria: v.dedicatoria||'',
      Precio: parseMoney(v.precio),
      'Forma de pago': v.formaPago||'',
      Estado: (VENTA_ESTADO_LABEL[v.estado]||v.estado||'').replace(/^[^\wÁ-ú]+/,'').trim(),
      Facturado: v.facturado||'',
      'Taxi/Flete': v.taxiFlete||'',
      'Costo envío': parseMoney(v.envioCosto),
      'Margen estimado': margen==='' ? '' : Math.round(margen),
      Dirección: v.dir||'',
      Asignado: v.asignado||''
    };
  });
  if(!rows.length){ showToast('Sin ventas para exportar en '+fmtMonth(fMes)); return; }
  const ws = X.utils.json_to_sheet(rows);
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, 'Ventas');
  _xlsxDownload(wb, `ventas-${fMes}.xlsx`);
  showToast('✅ Exportado: ventas-'+fMes+'.xlsx ('+rows.length+' ventas)');
}

function exportComprasXLSX(){
  const X = window.XLSX;
  if(!X){ showToast('Error: XLSX no disponible'); return; }
  const mes = CURR_MONTH;
  const rows = [...(comprasFlore||[]),...(comprasJard||[])].filter(c=>c.fecha&&c.fecha.startsWith(mes)).map(c=>({
    Fecha: c.fecha||'', Proveedor: c.prov||'', Producto: c.prod||'', Cantidad: c.qty||1,
    'Precio unit.': parseMoney(c.costo||0), Importe: _compraImporte(c), Estado: c.anulado ? 'anulado' : (c.estado||''), Sector: c.sector||'', Evento: c.evento||'', Notas: c.notas||c.desc||''
  }));
  if(!rows.length){ showToast('Sin compras para exportar este mes'); return; }
  const ws = X.utils.json_to_sheet(rows);
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, 'Compras');
  _xlsxDownload(wb, `compras-${mes}.xlsx`);
  showToast('✅ Exportado: compras-'+mes+'.xlsx');
}

function exportStockXLSX(){
  const X = window.XLSX;
  if(!X){ showToast('Error: XLSX no disponible'); return; }
  const rows = (stockData||[]).map(s=>({
    Producto: s.prod||'', Categoría: s.cat||s.categoria||'', Cantidad: s.cantidad||0,
    Mínimo: s.min||0, Máximo: s.max||0, Unidad: s.unidad||'', Proveedor: s.prov||''
  }));
  if(!rows.length){ showToast('Sin datos de stock para exportar'); return; }
  const ws = X.utils.json_to_sheet(rows);
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, 'Stock');
  _xlsxDownload(wb, `stock-${TODAY_ISO}.xlsx`);
  showToast('✅ Exportado: stock-'+TODAY_ISO+'.xlsx');
}

function exportLegajoXLSX(){
  const X = window.XLSX;
  if(!X){ showToast('Error: XLSX no disponible'); return; }
  const rows = (legajoData||[]).map(e=>({
    Nombre: e.nombre||'', Cargo: e.cargo||'', Área: e.area||'', Ingreso: e.ingreso||'',
    'Horas Contrato': e.horasContrato||0, Estado: e.estado||'activo', Email: e.email||'', Tel: e.tel||''
  }));
  if(!rows.length){ showToast('Sin empleados para exportar'); return; }
  const ws = X.utils.json_to_sheet(rows);
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, 'Legajo');
  _xlsxDownload(wb, `legajo-${TODAY_ISO}.xlsx`);
  showToast('✅ Exportado: legajo-'+TODAY_ISO+'.xlsx');
}

function applyCompraFiltersExtToArr(type, arr){
  const f = compraFilterExt[type]||{};
  if(f.prov) arr = arr.filter(r=>r.prov===f.prov);
  if(f.estado) arr = arr.filter(r=>r.estado===f.estado);
  if(f.desde) arr = arr.filter(r=>r.fecha>=f.desde);
  if(f.hasta) arr = arr.filter(r=>r.fecha<=f.hasta);
  if(f.montoMin) arr = arr.filter(r=>parseMoney(r.costo)>=+f.montoMin);
  if(f.montoMax) arr = arr.filter(r=>parseMoney(r.costo)<=+f.montoMax);
  if(f.producto) arr = arr.filter(r=>(r.prod||'').toLowerCase().includes(f.producto.toLowerCase()));
  return arr;
}

// ════════════════════════════════════════════════════════════════════════════
// INVENTARIO POR UBICACIÓN (Operaciones)
// Lista simple de ítems (nombre + cantidad) agrupada por ubicación fija. Lo
// carga y edita todo el equipo. Se guarda en Firebase como inventarioData.
// ════════════════════════════════════════════════════════════════════════════
const INV_AREAS = ['Florería','Armario back','Jaula','Estacionamiento','Pozo'];
const INV_AREA_ICON = { 'Florería':'🌸', 'Armario back':'🗄️', 'Jaula':'🧺', 'Estacionamiento':'🅿️', 'Pozo':'🕳️' };
let inventarioData = []; // [{area, nombre, cantidad}]
window._setInventarioData = (arr) => {
  inventarioData = Array.isArray(arr) ? arr : (arr && typeof arr==='object' ? Object.values(arr) : []);
  if(document.getElementById('page-inventario')?.classList.contains('active') && !estaEditando('page-inventario')) renderInventario();
};
function _invSave(){ window._inventarioLastSave = Date.now(); fbSave('inventarioData', inventarioData); }

function renderInventario(){
  const cont = document.getElementById('inventario-body');
  if(!cont) return;
  const q = (document.getElementById('inv-search')?.value || '').trim().toLowerCase();
  cont.innerHTML = INV_AREAS.map((area, ai)=>{
    const items = inventarioData.map((it,i)=>({it,i})).filter(o=>o.it.area===area);
    const vis = q ? items.filter(o=>(o.it.nombre||'').toLowerCase().includes(q)) : items;
    const icon = INV_AREA_ICON[area] || '📦';
    const rows = vis.length ? vis.map(({it,i})=>`
        <tr>
          <td><input class="form-input" value="${esc(it.nombre||'')}" placeholder="Nombre del ítem" onchange="updInv(${i},'nombre',this.value)" style="min-width:180px"></td>
          <td style="white-space:nowrap;text-align:center">
            <button class="btn-icon" onclick="invAdjust(${i},-1)" title="Restar" style="font-weight:700;font-size:16px">−</button>
            <input class="form-input" type="number" min="0" value="${it.cantidad!=null?it.cantidad:0}" onchange="updInv(${i},'cantidad',this.value)" style="width:66px;text-align:center;display:inline-block">
            <button class="btn-icon" onclick="invAdjust(${i},1)" title="Sumar" style="font-weight:700;font-size:16px">+</button>
          </td>
          <td style="text-align:right"><button class="btn-icon" style="color:var(--red-alert)" onclick="delInvItem(${i})" title="Eliminar">✕</button></td>
        </tr>`).join('')
      : `<tr><td colspan="3" style="text-align:center;color:var(--mid-gray);font-size:12px;padding:14px">${q?'Sin resultados en esta ubicación':'Sin ítems todavía — tocá "＋ Agregar ítem"'}</td></tr>`;
    return `
      <div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:12px;padding:14px 16px;margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--charcoal)">${icon} ${esc(area)} <span style="font-size:12px;font-weight:400;color:var(--mid-gray)">· ${items.length} ítem${items.length!==1?'s':''}</span></div>
          <button class="btn-secondary" onclick="addInvItem(${ai})" style="font-size:12px">＋ Agregar ítem</button>
        </div>
        <div class="table-wrapper">
          <table class="ventas-table" style="min-width:340px">
            <thead><tr><th>Ítem</th><th style="text-align:center;width:150px">Cantidad</th><th style="width:40px"></th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }).join('');
}

function addInvItem(ai){
  const area = INV_AREAS[ai];
  if(!area) return;
  const search = document.getElementById('inv-search');
  if(search) search.value = ''; // que el ítem nuevo (vacío) sea visible
  inventarioData.push({ area, nombre:'', cantidad:0 });
  _invSave();
  renderInventario();
  // Enfocar el nombre recién agregado
  const inputs = document.getElementById('inventario-body')?.querySelectorAll('input[placeholder="Nombre del ítem"]');
  if(inputs && inputs.length) inputs[inputs.length-1].focus();
}

function updInv(i, field, val){
  if(!inventarioData[i]) return;
  if(field==='cantidad') val = Math.max(0, parseFloat(val)||0);
  inventarioData[i][field] = val;
  _invSave();
}

function invAdjust(i, d){
  if(!inventarioData[i]) return;
  inventarioData[i].cantidad = Math.max(0, (parseFloat(inventarioData[i].cantidad)||0) + d);
  _invSave();
  renderInventario();
}

async function delInvItem(i){
  const it = inventarioData[i];
  if(!it) return;
  if(it.nombre && !(await confirmModal(`¿Eliminar "${it.nombre}" del inventario?`))) return;
  inventarioData.splice(i,1);
  _invSave();
  renderInventario();
}

Object.assign(window, {
  renderInventario, addInvItem, updInv, invAdjust, delInvItem,
  _downloadCSV, addCajaMovimiento, addCompra, addEvArregloRow, addEvArregloRowWithData,
  evSetArreglo, evSetArregloQty, evRemoveArregloRow,
  addInsumoToBase, addLpCat, addProveedor, addRecetaIngRow,
  addReglaTipo, addSale, addTipoEvento, adjustStock, agregarNuevoInsumo, agregarPedidoRapido,
  agregarUsuarioFlorista, agregarUsuarioHousekeeping, setHabComentarioHK, aplicarPlantillaAlMes, aplicarPlantillaForce, applyCompraFilter,
  horariosAddPersona, horariosRemovePersona, horariosAddPersonaFromSel,
  applyRole, arregloEmoji, calcCostoComposicion, calcDuracion, calcHorasDia, calcStockImpact,
  calcularArreglosEvento, cambiarContrasena, changeEventoEstado, clearCompraExtraFilters,
  clearCompraFilter, clearEventImg, clearRecetaImg, closeModal, closeSidebar, confirmResetWeek,
  confirmVentaRamo, copiarBloquePedido, copiarCotEvento, copiarCotizacion, copiarCotizacionEvento,
  renderCompraEvento, ceAddRow, ceRemoveRow, ceSet, ceReset, ceLoadEvento, ceCopiar,
  setCompraEvento, openCompraEventos, cevSet, cevAdd, cevRemove, guardarCompraEventos,
  copiarCotizacionOps, copiarUltimoPedido, cotAgregar, cotAgregarComposicionOps, cotAgregarLP,
  cotAgregarOpsStock, cotGuardarMargen, cotGuardarPrecio, cotRemove, cotRemoveOps, cotUpdateQty,
  cotUpdateQtyOps, ctrlHabFilter, ctrlJardFilter, daysSince, delC, delCaja,
  delPedidoHab, delProveedor, delRamo, delReceta, delReglaTipo, delStock, delTipoEvento,
  delVenta, deleteEvento, descontarStockEvento, deselectAllInsumos, doLogin, durBadge,
  ventasClearFilters, ventasCierreMes, ventasCierreCopiar,
  eliminarUsuario, ensureKanbanCols, enviarCotizacionEvento, enviarPedidoHab, esc,
  estaEditando, evAgregarComposicion, evAgregarFlor, evZonasLabel, exportCtrlCSV, exportHabCSV,
  exportMesHab, exportMesJard, fbSave, filterByStatus, filterStock, fmtDate, fmtDateTime,
  fmtDur, fmtMonth, generarTextoCotEvento, gerenciaSetFecha, getAlerta, getAllInsumos,
  getAllMonths, getArr, getBadge, getDaysBadge, getEmpleadosActivos, getFloristasActivos, getISOWeekKey, isJardinero,
  getMonthLabel, getMonthVisits, getOrCreateDayState, getProvOpts, getSectionEmoji,
  getSectionPillCls, getStockBadge, getStockComprometido, getStockEnPedido, getTbody,
  getWeekLabel, guardarDiaHorario, habsHoraCell, habsRegistrarHora, habsResetHora,
  hopsVisita, horNavMes, initChecklist, initCotizadorEventosHyatt, initCtrlHab, initCtrlJard,
  jopsDone, jopsHoraCell, jopsRegistrarHora, jopsResetHora, jopsUpdHora, limpiarCarrito,
  jardTogglePlanHoy, openGestionTareasJard, jardAddTarea, jardRenameTarea, jardDeleteTarea, jardAddGrupo, jardAddSeccion,
  limpiarCarritoOps, limpiarDiaHorario, loadWeekState, lpAddPhotos, lpDelCat, lpDelItem,
  lpOpenViewer, lpRemovePhoto, lpUpdItem, markHabDone, markJardDone, marcarRecordatorioHecho, navToggleGroup, navExpandGroup, navCollapseGroup, finalizeNavGroups, navigate, openRecordatorioModal, renderBottomNav, renderRecordatoriosJard, saveRecordatorio, deleteRecordatorio, updateBottomNav, openCajaModal,
  openAlertaJardinModal, alertaJardFotoPreview, guardarAlertaJardin, resolverAlertaJardin, verFotoAlerta, renderAlertasUrgentesJard, toggleRecepAgrupado,
  openLlamadoModal, llamadoOnZonaChange, llamadoFotoPreview, guardarLlamado, renderLlamadosChecklist, verFotoLlamado, resolverLlamado, eliminarLlamado, renderLlamadosEval,
  openDiaHorario, openEditSaleModal, openEventModal, openEventoDetail, openGestionPasswords,
  openGaleriaModal, openLpCatModal, openLpModal, openRamoModal, openRamoPhoto,
  openRecetaModal, openSaleModal, openSidebar, openTaskModal, openVentaRamo, parseMoney,
  populateFloreriaFormHelpers, populatePHSubSelector, populateProvSelects, populateSaleSelects,
  previewEventImg, previewRecetaImg, previewStockImpact, ramoOnCatChange,
  ramoOnProdChange, recalcTotalEvento, recepCheckAll, recepConfirmar, recepConfirmarTodo,
  recepToggle, recepUncheckAll, recepUpdPaq, recepUpdVaras, recepUpdateGlobal, recetaIngRowHTML,
  registrarHora, registrarHoraEvento, registrarHoraVenta, registrarVentaDirecta, removeKanbanCard,
  renderCaja, renderCarrito, renderCarritoOps, renderChecklistTable,
  renderComposicionesCot, renderCompraAlert, renderCompraSummary, renderCompras, renderCotEventos,
  renderCotizador, renderCotizadorOps, renderCtrlHab, renderCtrlJard, renderEvCarrito,
  renderGaleria, abrirLightbox, galeriaAddFotos, galeriaAddUrl, galeriaQuitarFoto, guardarGaleria, editarGaleria, eliminarGaleria,
  setGaleriaSeccion, openFichaGaleria, imprimirFicha, addGalIngRow, galSectorOnChange,
  renderEvHoraCell, renderEvTipos, renderEventos, renderHabLog, renderHabOps,
  renderHabReporte, renderHistorialCompras, renderHistorialEventos, renderHistoryPanel, renderHome,
  renderHomeHyatt, renderHoraCell, renderHorarios, renderInsumosGrid, renderJardLog, renderJardOps,
  renderJardProdEquipo, renderJardTurnoCard, renderJardReporte, renderJordProd, renderKanban,
  jardSetJardinero, jardRegistrarHoraTurno, jardResetHoraTurno, jardProdDiaClick,
  florRegistrarTurno, florResetTurno, renderFlorTurnoCard,
  renderLPenCotizador, renderListaPrecios,
  renderPedidosHab, renderPeriodTabs, renderPlantilla, renderPreciosList, renderProductividad,
  renderProductividadHome, renderProductividadCL, renderProductividadHorarios, renderProvTags, renderRamosDisp, renderRecepcionPedidos,
  renderRecetas, seedComposicionesBase, seedComposicionesHotelBase, setCompTab, renderComposicionesHotel, compHotelAdd, delArregloComposicion, renderReportesEquipo, renderReportesVentas, renderReportesStock, openFichaEmpleado,
  renderCierreDia, initCierreDia,
  renderFloreros, openFloreroModal, guardarFlorero, delFlorero, florAjustar, florFotoPreview, cambiarFotoFlorero, openFlorFoto,
  renderVelas, openVelaModal, guardarVela, delVela, velaAjustar, velaFotoPreview, cambiarFotoVela, openVelaFoto,
  exportReporteEquipo, exportReporteVentas, exportReporteStock,
  openPushNotifModal, enviarPushNotif, initPushForUser,
  renderCalendario, calPrevMonth, calNextMonth,
  renderProveedores, openProveedorModal, guardarProveedor, eliminarProveedor,
  renderRentabilidad, renderRentabilidadHotel, rentSetTab, saveArregloHotelConfig, saveEventLaborRate, updEventoTraslado, alertasAutomaticas,
  openListaCompraHotel, listaCompraHotelCopiar, openTiemposEstimados, openPromediosZona,
  rentAddArreglo, openArregloComposicion, compUpdRow, compAddRow, compRemoveRow, guardarArregloComposicion,
  renderStock, renderStockAdmin, renderVentaHoraCell, renderVentas, renderZonasPicker,
  resetHora, resetWeekState, resetearPassword, resetearTodasPasswords, saleAutoFillPrice,
  saveEvent, saveInsumosCustom, saveKanbanTask, saveLpItem, saveRamo, saveReceta, saveUrgenciaConfig,
  saveWeekState, setCotTab, setHabReporteMes, setHopsFilter, setJardReporteMes, setJopsFilter,
  setPlantilla, setStock, setStockMax, setStockMin, vaciarStock, openAddStockModal, guardarStockManual, setUrgenciaPreset, showAlertaHorario,
  showToast, syncEventosToKanban, toggleCtrlSection, toggleEvZona, toggleHistorialCompras,
  toggleHistory, toggleInsumosGrid, toggleJordProd, togglePlantilla, toggleProductividad,
  toggleDarkMode, initDarkMode, openGlobalSearch, closeGlobalSearch, handleSearchKey, runGlobalSearch, _gsearchGo, exportPDF,
  renderAuditoria, cerrarCajaDia, renderCierreCajaHistorial, toggleCierreDetalle, renderDashboardMargen,
  renderSucursales, openNuevaSucursalModal, openEditSucursal, guardarSucursal, toggleSucursalActiva, eliminarSucursal,
  renderDashboardConsolidado, renderSucursalSelector, renderSucursalIndicador, getSucursalId, getSucursalNombre, filterBySucursal,
  renderClientes, abrirFichaCliente, openNuevoClienteModal, editarCliente, guardarCliente, eliminarCliente,
  generarPresupuestoPDF, checkOnboarding, nextOnboardingStep, finishOnboarding,
  toggleProvManager, toggleSidebar, toggleTask, updC, updCL, updActividad, updTiempoRef, updCaja, updCajaMonto, updCajaTipo,
  openVistaSemanal, vsToggleActividad, vsSetResp, aplicarPlantillaSemana, descargarBackup, clFotoPreview, guardarFotoChecklist, verFotoChecklist,
  openGestionZonas, clAddZona, clRenameZona, clDeleteZona, clMoveZona, clRenameSeccion, clAddSeccion,
  activarNotificaciones, openGaleriaNuevos, renderGaleriaNuevos, moveKanbanCard, clSetFiltro,
  cerrarBriefing, mostrarResumenSemanal,
  updPedidoHabEstado, updTipoEvento, updV, updateInsumoCount, updateInsumoRow,
  updateKpiCompras, urgenciaPanelHTML, vdAutoPrice, zonaHoraBtn, zonaResetHora, zonaSetHora,
  toggleStockSugerencias,
  renderLegajo, openLegajoModal, guardarLegajo, eliminarLegajo, verDetalleLegajo,
  legSubirDoc, legVerDoc, legEliminarDoc,
  renderEvaluaciones, openEvaluacionModal, guardarEvaluacion, eliminarEvaluacion,
  renderLiquidacion, saveLiquidacionHoras, exportLiquidacion,
  generarOrdenCompra,
  renderPrecioComparacion, buscarComparacion,
  calcStockMinInteligente, renderStockSugerencias, aplicarSugerenciaStock,
  renderCompraFiltersPanel, toggleCompraFilters, applyCompraFiltersExt, clearCompraFiltersExt,
  installPWA, toggleTVMode, renderTVDashboard,
  renderPresupuestos, openPresupuestoModal, guardarPresupuesto, cambiarEstadoPres, eliminarPresupuesto,
  verPresupuesto, enviarPresupuestoWhatsApp,
  renderCotizarPresupuesto, cpAddArr, cpRemoveArr, cpSetArr, cpAddFree, cpRemoveFree, cpSetFree, cpReset, cpGuardar,
  renderEventosSinFloreria, openEsfModal, guardarEsf, eliminarEsf, exportEsfReclamo,
  renderCierreMensual, generarCierreMensual, verCierreMensual, exportCierrePDF,
  renderDashboardGerencia,
  exportVentasXLSX, exportComprasXLSX, exportStockXLSX, exportLegajoXLSX,
  toggleCfSplit, cfSplitAddRow, cfSplitRemoveRow, cfSplitUpdRow,
  cfImportFile, cfImportCancel, cfImportParseSheet, cfImportConfirm,
  toggleAnularCompra, updHistCantCompra, updHistCostoCompra,
});
