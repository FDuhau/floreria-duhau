// ════════════════════════════════════════
// CONTROL DE VERSIÓN — auto-limpieza de datos locales viejos
// Subí este número cada vez que cambies el formato de datos.
// Cuando un dispositivo detecta una versión distinta a la guardada,
// limpia el localStorage viejo UNA sola vez y recarga. Sin borrar caché a mano.
// ════════════════════════════════════════
const APP_VERSION = '2026-06-15-a';
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
      // Si había una versión previa (no es primera visita), recargar limpio una vez
      if(stored !== null){
        location.reload();
      }
    }
  } catch(e){ /* localStorage no disponible: la app igual funciona con Firebase */ }
})();

// ════════════════════════════════════════
// FIREBASE SYNC HELPERS (called after fbReady)
// ════════════════════════════════════════
function fbSave(key, data){
  if(window.fbSet) window.fbSet(key, JSON.parse(JSON.stringify(data)));
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
const TODAY_ISO = NOW.toISOString().split('T')[0];
const CURR_MONTH = TODAY_ISO.slice(0,7); // "2026-06"
const TODAY_DAY = DAYS_ES[NOW.getDay()];
const DATE_STR = `${TODAY_DAY} ${NOW.getDate()} de ${MONTHS_ES[NOW.getMonth()]} ${NOW.getFullYear()}`;
document.getElementById('topbar-date').textContent = DATE_STR;
document.getElementById('topbar-day').textContent = TODAY_DAY;
document.getElementById('hero-date').textContent = '📅 ' + DATE_STR;

function fmtDate(iso){ if(!iso) return '—'; const p=iso.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; }
function fmtDateTime(iso, hora){ return fmtDate(iso) + (hora?' · '+hora:''); }
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
function parseMoney(s){ return parseFloat(String(s||'').replace(/[^0-9.]/g,''))||0; }

// ════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════
const PAGE_LABELS = {control:'Control Coordinador','control-jardineria':'Control › Seguimiento Jardinería','control-habitaciones':'Control › Habitaciones con Plantas',
  home:'Inicio', operaciones:'Operaciones',
  checklist:'Operaciones › Checklist', stock:'Operaciones › Stock',
  'eventos-maison':'Operaciones › Eventos / Maison',
  'jardineria-ops':'Operaciones › Tareas Jardinería',
  'hab-ops':'Operaciones › Habitaciones con Plantas',
  'recepcion-pedidos':'Operaciones › Recepción de Pedidos',
  compras:'Compras', 'compras-floreria':'Compras › Florería',
  'compras-jardineria':'Compras › Jardinería',
  'stock-admin':'Compras › Gestión de Stock',
  comercial:'Área Comercial', 'eventos-comercial':'Comercial › Eventos',
  'historial-eventos':'Comercial › Historial de Eventos',
  cotizador:'Comercial › Cotizador',
  'cotizador-ops':'Cotizador',
  'ventas-externas':'Comercial › Ventas', caja:'Comercial › Caja',
  glosario:'Comercial › Glosario',
  'lista-precios':'Comercial › Lista de Precios',
  'ramos-disponibles':'Comercial › Ramos Disponibles',
  'pedidos-habitacion':'Comercial › Pedidos de Habitación',
  'home-hyatt':'Panel Hyatt',
  'cotizador-eventos-hyatt':'Cotizador de Eventos',
  'control-horarios':'Control › Horarios y Productividad',
  'recetas-arreglos':'Comercial › Composiciones'
};
const COMPRAS_PAGES=['compras','compras-floreria','compras-jardineria','stock-admin'];
const CONTROL_PAGES=['control','control-jardineria','control-habitaciones'];
const COMERCIAL_PAGES = ['comercial','eventos-comercial','historial-eventos','ventas-externas','caja','glosario','lista-precios','ramos-disponibles','pedidos-habitacion','recetas-arreglos'];

// ── NAVEGACIÓN INFERIOR MOBILE ──────────────────────────────────────────────
const BOTTOM_NAV_ITEMS = {
  gerencia:  [{icon:'🏠',label:'Inicio',page:'home'},{icon:'📋',label:'Checklist',page:'checklist'},{icon:'🎉',label:'Eventos',page:'eventos-maison'},{icon:'💰',label:'Caja',page:'caja'}],
  florista:  [{icon:'📋',label:'Checklist',page:'checklist'},{icon:'📦',label:'Stock',page:'stock'},{icon:'🎉',label:'Eventos',page:'eventos-maison'},{icon:'🌺',label:'Ramos',page:'ramos-disponibles'},{icon:'💲',label:'Precios',page:'lista-precios'}],
  operario:  [{icon:'🏠',label:'Inicio',page:'home'},{icon:'🎉',label:'Eventos',page:'eventos-maison'},{icon:'📦',label:'Stock',page:'stock'},{icon:'💲',label:'Precios',page:'lista-precios'}],
  jardinero: [{icon:'🌿',label:'Jardín',page:'jardineria-ops'},{icon:'🏡',label:'Habitac.',page:'hab-ops'},{icon:'🔔',label:'Avisos',page:'recordatorios-jardineria'}],
  compras:   [{icon:'🛒',label:'Compras',page:'compras-floreria'},{icon:'📦',label:'Stock',page:'stock-admin'},{icon:'📬',label:'Recepción',page:'recepcion-pedidos'}],
  comercial: [{icon:'🎉',label:'Eventos',page:'eventos-comercial'},{icon:'💰',label:'Ventas',page:'ventas-externas'},{icon:'📖',label:'Glosario',page:'glosario'},{icon:'💲',label:'Precios',page:'lista-precios'}],
  ventas:    [{icon:'🌺',label:'Ramos',page:'ramos-disponibles'},{icon:'🏨',label:'Pedidos',page:'pedidos-habitacion'},{icon:'💲',label:'Precios',page:'lista-precios'}],
};

function renderBottomNav(role) {
  const nav = document.getElementById('bottom-nav');
  if(!nav) return;
  const items = BOTTOM_NAV_ITEMS[role] || [];
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
  if(pageId==='eventos-maison')     renderKanban();
  if(pageId==='compras-floreria')   renderCompras('floreria');
  if(pageId==='compras-jardineria') renderCompras('jardineria');
  if(pageId==='stock-admin')        renderStockAdmin();
  if(pageId==='eventos-comercial')  renderEventos();
  if(pageId==='historial-eventos')   renderHistorialEventos();
  if(pageId==='ventas-externas')    renderVentas();
  if(pageId==='caja')               renderCaja();
  if(pageId==='glosario')           renderGlosario();
  if(pageId==='lista-precios')      renderListaPrecios();
  if(pageId==='ramos-disponibles')  renderRamosDisp();
  if(pageId==='pedidos-habitacion') renderPedidosHab();
  if(pageId==='home-hyatt') renderHomeHyatt();
  if(pageId==='cotizador-eventos-hyatt') initCotizadorEventosHyatt();
  if(pageId==='control-horarios') renderHorarios();
  if(pageId==='cotizador')          renderCotizador();
  if(pageId==='cotizador-ops')      renderCotizadorOps();
  if(pageId==='recetas-arreglos')       renderRecetas();
  if(pageId==='recordatorios-jardineria') renderRecordatoriosJard();
  if(pageId==='control-jardineria') renderCtrlJard();
  if(pageId==='jardineria-ops') renderJardOps();
  if(pageId==='hab-ops') renderHabOps();
  if(pageId==='recepcion-pedidos') renderRecepcionPedidos();
  if(pageId==='control-habitaciones') renderCtrlHab();

  // En mobile, cerrar el sidebar automáticamente al navegar
  if(window.innerWidth <= 768) closeSidebar();
}

function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');}));

// ════════════════════════════════════════
// DATA — CHECKLIST
// Actividad options, Tiempo options, Responsable options are now editable per row
// ════════════════════════════════════════
const CL_ACTIVIDAD_OPTS = ['Nuevo','Retoque','Riego'];
const CL_TIEMPO_OPTS    = ['','5 min','10 min','15 min','20 min','25 min','30 min','40 min','45 min','60 min','90 min','120 min','180 min','15/20 min','20/15 min','25/15 min','30/15 min','30/20 min','40/20 min','45/20 min','45/30 min','60/30 min'];
let CL_RESP_OPTS = ['Caro','Clo','Cris','Gabi','Ivan','Jardineria','Pao','Nora'];


// Sections: 'a'=Alvear (crema), 'b'=Posadas (azul), 'c'=Florería (rosa)
const CL_TASKS = [
  // ── ALVEAR ──────────────────────────────────────────────────────────────
  {sec:'a',zona:'Bochitas',            actividad:'RETOQUE',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'2° 3° 4° Piso',       actividad:'RETOQUE',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Lobby Alvear',         actividad:'RIEGO',     obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Lobby Alvear',         actividad:'RETOQUE',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Lobby Alvear',         actividad:'NUEVO', obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Recepción Alvear',     actividad:'RETOQUE',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Mesa Ratona Alvear',   actividad:'RETOQUE',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Biblioteca',           actividad:'RETOQUE',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Salón Privado',        actividad:'RETOQUE',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Mesada P. Nobile',     actividad:'RETOQUE',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Mesitas P. Nobile',    actividad:'RETOQUE',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Mesas Duhau',          actividad:'RETOQUE',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Baños Duhau',          actividad:'NUEVO', obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Copón Duhau',          actividad:'RETOQUE',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Copón Duhau',          actividad:'NUEVO', obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Chimenea Vinoteca',    actividad:'RETOQUE',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Mesada Vinoteca',      actividad:'RETOQUE',   obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Chimeneas P. Nobile',  actividad:'RETOQUE',   obs:'',tiempo:'', responsable:''},
  {sec:'a',zona:'Elefante',             actividad:'RIEGO',     obs:'',tiempo:'',   responsable:''},
  {sec:'a',zona:'Elefante',             actividad:'RETOQUE',   obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Foyer Spa',            actividad:'NUEVO', obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Spa recepción',        actividad:'NUEVO', obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Spa (cabinas)',         actividad:'NUEVO', obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Spa (vestuarios D)',    actividad:'NUEVO', obs:'',tiempo:'',responsable:''},
  {sec:'a',zona:'Spa (vestuarios C)',    actividad:'NUEVO', obs:'',tiempo:'',responsable:''},
  // ── POSADAS ─────────────────────────────────────────────────────────────
  {sec:'b',zona:'Baños P. de las Artes',actividad:'NUEVO', obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Lobby Posadas',         actividad:'RIEGO',     obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Lobby Posadas',         actividad:'NUEVO', obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Mesa Ratona Posadas',   actividad:'RETOQUE',   obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Recepción Posadas',     actividad:'RETOQUE',   obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Gioia',                 actividad:'RETOQUE',   obs:'Arreglos perimetrales + 2 buffets',tiempo:'',responsable:''},
  {sec:'b',zona:'Gioia',                 actividad:'NUEVO', obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Mesas Gioia',           actividad:'RETOQUE',   obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Copón Gioia',           actividad:'RETOQUE',   obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Foyer Posadas',         actividad:'RETOQUE',   obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Totems',                actividad:'RETOQUE',   obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Meeting Rooms',         actividad:'RETOQUE',   obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Baños Meetings',        actividad:'NUEVO', obs:'',tiempo:'',responsable:''},
  {sec:'b',zona:'Tilo',                  actividad:'RETOQUE',   obs:'',tiempo:'',   responsable:''},
  {sec:'b',zona:'Pisos',                 actividad:'RETOQUE',   obs:'',tiempo:'',responsable:''},
  // ── FLORERÍA ────────────────────────────────────────────────────────────
  {sec:'c',zona:'Maison (Bertone)',       actividad:'RETOQUE',   obs:'',tiempo:'',responsable:''},
  {sec:'c',zona:'Cámara',                actividad:'NUEVO', obs:'',tiempo:'',responsable:''},
  {sec:'c',zona:'Bolsa de Cámara',       actividad:'RETOQUE',   obs:'',tiempo:'',   responsable:''},
  {sec:'c',zona:'Ingreso Pedido',        actividad:'RETOQUE',   obs:'',tiempo:'',   responsable:''},
  {sec:'c',zona:'Ramos',                 actividad:'NUEVO', obs:'1 de cada uno',tiempo:'',responsable:''},
  {sec:'c',zona:'Florería',              actividad:'RETOQUE',   obs:'',tiempo:'',responsable:''},
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
}

// ── Inicializar estado del día — trae de localStorage si existe ───────────────
function getOrCreateDayState(day){
  if(!clStateByDay[day]){
    clStateByDay[day] = {
      checked:     CL_TASKS.map(()=>false),
      actividad:   CL_TASKS.map(t=>t.actividad),
      obs:         CL_TASKS.map(t=>t.obs||''),
      tiempo:      CL_TASKS.map(()=>''),
      inicio:      CL_TASKS.map(()=>''),
      fin:         CL_TASKS.map(()=>''),
      responsable: CL_TASKS.map(()=>''),
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
  }
  return clStateByDay[day];
}

// Cargar semana guardada al iniciar
(function(){
  const saved = loadWeekState();
  if(saved) clStateByDay = saved;
})();

let checklistHistory = [];
let currentDay = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].includes(TODAY_DAY) ? TODAY_DAY : 'Lunes';
let historyWeekFilter = null;

function getBadge(act){
  const a = (act||'').toLowerCase();
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
  const totalPoss = Object.keys(clStateByDay).length * CL_TASKS.length || CL_TASKS.length;
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
  const _htc = document.getElementById('home-tasks-count'); if(_htc) _htc.textContent = CL_TASKS.length;
}

function resetWeekState(){
  if(userRole !== 'gerencia'){ showToast('⛔ Solo gerencia puede limpiar la semana'); return; }
  if(!confirm('¿Limpiar todas las tareas de esta semana? El historial se conserva.')) return;
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
function durBadge(inicio, fin){
  const mins = calcDuracion(inicio, fin);
  if(!mins) return '<span style="font-size:11px;color:var(--mid-gray)">—</span>';
  const color = mins > 60 ? 'var(--amber)' : 'var(--green-ok)';
  const bg    = mins > 60 ? '#FDF8E8'      : '#EBF5E8';
  return `<span style="font-size:11px;font-weight:600;color:${color};background:${bg};padding:2px 8px;border-radius:10px">${fmtDur(mins)}</span>`;
}

function renderChecklistTable(){
  if(!clState){
    clState = getOrCreateDayState(currentDay);
  }
  // Garantizar que los arrays existan y tengan el largo correcto
  const n = CL_TASKS.length;
  ['checked','actividad','obs','tiempo','inicio','fin','responsable'].forEach(k => {
    if(!Array.isArray(clState[k]) || clState[k].length < n){
      const def = k==='checked' ? false : k==='actividad' ? '' : '';
      clState[k] = CL_TASKS.map((t,i) => {
        const existing = clState[k]?.[i];
        if(existing !== undefined && existing !== null) return existing;
        return k==='actividad' ? t.actividad : (k==='obs' ? (t.obs||'') : (k==='checked' ? false : ''));
      });
    }
  });

  // Update day tab active state + badge de progreso por día
  document.querySelectorAll('.day-tab').forEach(tabEl=>{
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
    const wrapper = document.getElementById('checklist-body').closest('.table-wrapper');
    wrapper.before(progressEl);
  }
  progressEl.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
      <div style="flex:1;height:7px;background:var(--light-gray);border-radius:4px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:${pct===100?'var(--green-ok)':'var(--sage)'};border-radius:4px;transition:width .3s"></div>
      </div>
      <span style="font-size:12px;color:var(--mid-gray);white-space:nowrap">${done_count} / ${total} tareas${pct===100?' ✅ ¡Completada!':''}</span>
    </div>`;

  const tbody = document.getElementById('checklist-body');
  tbody.innerHTML = '';
  let lastSec = '';

  // Header dinámico según rol
  const thead = document.getElementById('checklist-thead');
  if(thead){
    if(userRole === 'florista'){
      thead.innerHTML = '<tr><th>Zona</th><th>Actividad</th><th>Observaciones</th><th style="width:90px">Inicio</th><th style="width:90px">Fin</th></tr>';
    } else {
      thead.innerHTML = '<tr><th style="width:32px">✓</th><th>Zona</th><th>Actividad</th><th>Observaciones</th><th style="width:90px">Inicio</th><th style="width:90px">Fin</th><th style="width:75px">Duración</th><th>Responsable</th><th style="width:32px"></th></tr>';
    }
  }

  // Para floristas: determinar qué secciones tienen tareas asignadas
  const isFlorista = userRole === 'florista';
  const floristaSections = isFlorista
    ? new Set(CL_TASKS.filter((_,i) => clState.responsable[i] === floristaNombre).map(t => t.sec))
    : null;

  CL_TASKS.forEach((t,i)=>{
    const curResp = clState.responsable[i] || t.responsable || '';

    // Florista individual: solo ver tareas asignadas a ellos
    if(isFlorista && curResp !== floristaNombre) return;

    // Section header
    if(t.sec !== lastSec){
      lastSec = t.sec;
      const sh = SEC_HEADERS[t.sec];
      const hr = document.createElement('tr');
      hr.className = 'cl-section-row ' + sh.cls;
      hr.innerHTML = `<td colspan="${isFlorista?5:9}">${sh.icon}&nbsp;&nbsp;${sh.label}</td>`;
      tbody.appendChild(hr);
    }

    const done    = clState.checked[i];
    const curAct  = clState.actividad[i]   || t.actividad;
    const curObs  = (clState.obs[i] && clState.obs[i] !== 'Observaciones') ? clState.obs[i] : (t.obs||'');
    const sh      = SEC_HEADERS[t.sec];

    const tr = document.createElement('tr');
    tr.className = sh.rowCls + (done ? ' task-row-done' : '');

    if(isFlorista){
      tr.innerHTML = `
        <td style="font-weight:500;font-size:12.5px;min-width:140px">${esc(t.zona)}</td>
        <td style="min-width:130px">
          <select class="cl-select" onchange="updCL(${i},'actividad',this.value)" ${done?'disabled':''}>
            ${CL_ACTIVIDAD_OPTS.map(o=>`<option${o===curAct?' selected':''}>${esc(o)}</option>`).join('')}
          </select>
        </td>
        <td style="min-width:150px">
          <input class="cl-obs-input" value="${esc(curObs)}" placeholder="Observaciones..."
            onchange="updCL(${i},'obs',this.value)" ${done?'disabled':''} style="width:100%">
        </td>
        <td style="width:90px;text-align:center;padding:4px 6px">${renderHoraCell(i,'inicio',done)}</td>
        <td style="width:90px;text-align:center;padding:4px 6px">${renderHoraCell(i,'fin',done)}</td>`;
    } else {
      tr.innerHTML = `
        <td style="width:32px"><input type="checkbox" class="task-check" ${done?'checked':''} onchange="toggleTask(${i},this)"></td>
        <td style="font-weight:500;font-size:12.5px;min-width:140px">${esc(t.zona)}</td>
        <td style="min-width:130px">
          <select class="cl-select" onchange="updCL(${i},'actividad',this.value)" ${done?'disabled':''}>
            ${CL_ACTIVIDAD_OPTS.map(o=>`<option${o===curAct?' selected':''}>${esc(o)}</option>`).join('')}
          </select>
        </td>
        <td style="min-width:150px">
          <input class="cl-obs-input" value="${esc(curObs)}" placeholder="Observaciones..."
            onchange="updCL(${i},'obs',this.value)" ${done?'disabled':''} style="width:100%">
        </td>
        <td style="width:90px;text-align:center;padding:4px 6px">${renderHoraCell(i,'inicio',done)}</td>
        <td style="width:90px;text-align:center;padding:4px 6px">${renderHoraCell(i,'fin',done)}</td>
        <td style="width:80px;text-align:center">${durBadge(clState.inicio?.[i], clState.fin?.[i])}</td>
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

  // ── Eventos asignados al florista para hoy ──
  const eventosHoy = eventosData.filter(ev =>
    ev.asignado &&
    ev.estado !== 'Pedidos Finalizados' &&
    (!isFlorista || ev.asignado === floristaNombre)
  );
  if(eventosHoy.length > 0){
    const evHeader = document.createElement('tr');
    evHeader.className = 'cl-section-row';
    evHeader.style.cssText = 'background:#FDF0E8';
    evHeader.innerHTML = `<td colspan="${isFlorista?5:9}" style="font-weight:600;color:#B8602A">🎉 Eventos del día</td>`;
    tbody.appendChild(evHeader);

    eventosHoy.forEach(ev => {
      const evIdx = eventosData.indexOf(ev);
      const evTr = document.createElement('tr');
      evTr.style.cssText = 'background:#FEFAF6';
      const canOperate = !isFlorista || ev.asignado === floristaNombre;

      if(isFlorista){
        evTr.innerHTML = `
          <td style="font-weight:600;font-size:12.5px;color:#B8602A">🎉 ${esc(ev.nombre)}</td>
          <td style="font-size:12px">${esc(ev.tipo)} · ${esc(ev.salon||'')}</td>
          <td style="font-size:11px;color:var(--mid-gray)">${ev.pax?ev.pax+' pax':''} ${ev.hora?'· '+ev.hora:''}</td>
          <td style="width:90px;text-align:center;padding:4px 6px">${renderEvHoraCell(evIdx,'inicio',ev)}</td>
          <td style="width:90px;text-align:center;padding:4px 6px">${renderEvHoraCell(evIdx,'fin',ev)}</td>`;
      } else {
        evTr.innerHTML = `
          <td style="width:32px"></td>
          <td style="font-weight:600;font-size:12.5px;color:#B8602A">🎉 ${esc(ev.nombre)}</td>
          <td style="font-size:12px">${esc(ev.tipo)}</td>
          <td style="font-size:11px;color:var(--mid-gray)">${esc(ev.salon||'')} · ${ev.pax?ev.pax+' pax':''} ${ev.hora?'· '+ev.hora:''}</td>
          <td style="width:90px;text-align:center;padding:4px 6px">${renderEvHoraCell(evIdx,'inicio',ev)}</td>
          <td style="width:90px;text-align:center;padding:4px 6px">${renderEvHoraCell(evIdx,'fin',ev)}</td>
          <td style="width:80px;text-align:center">${durBadge(ev.inicio, ev.fin)}</td>
          <td style="font-size:12px;color:var(--sage-dark);font-weight:600">${esc(ev.asignado||'')}</td>
          <td></td>`;
      }
      tbody.appendChild(evTr);
    });
  }

  // ── Ventas pendientes asignadas al florista ──
  const ventasHoy = (ventasData||[]).filter(v =>
    v.asignado && v.estado === 'pendiente' && !v.fin && !v.fin &&
    (!isFlorista || v.asignado === floristaNombre)
  );
  if(ventasHoy.length > 0){
    const vtHeader = document.createElement('tr');
    vtHeader.className = 'cl-section-row';
    vtHeader.style.cssText = 'background:#E8EDF8';
    vtHeader.innerHTML = `<td colspan="${isFlorista?5:9}" style="font-weight:600;color:#2C5A80">💐 Ventas pendientes</td>`;
    tbody.appendChild(vtHeader);

    ventasHoy.forEach(v => {
      const vIdx = ventasData.indexOf(v);
      const vtTr = document.createElement('tr');
      vtTr.style.cssText = 'background:#F5F7FC';

      const detalle = [v.desc, v.dedicatoria ? '✉️ "'+v.dedicatoria+'"' : '', v.dir ? '📍 '+v.dir : ''].filter(Boolean).join(' · ');

      if(isFlorista){
        vtTr.innerHTML = `
          <td style="font-weight:600;font-size:12.5px;color:#2C5A80">💐 ${esc(v.prod)}</td>
          <td style="font-size:12px">${esc(v.cliente||'')}</td>
          <td style="font-size:11px;color:var(--mid-gray);max-width:200px;overflow:hidden;text-overflow:ellipsis">${esc(detalle)}</td>
          <td style="width:90px;text-align:center;padding:4px 6px">${renderVentaHoraCell(vIdx,'inicio',v)}</td>
          <td style="width:90px;text-align:center;padding:4px 6px">${renderVentaHoraCell(vIdx,'fin',v)}</td>`;
      } else {
        vtTr.innerHTML = `
          <td style="width:32px"></td>
          <td style="font-weight:600;font-size:12.5px;color:#2C5A80">💐 ${esc(v.prod)}</td>
          <td style="font-size:12px">${esc(v.cliente||'')}</td>
          <td style="font-size:11px;color:var(--mid-gray);max-width:200px">${esc(detalle)}</td>
          <td style="width:90px;text-align:center;padding:4px 6px">${renderVentaHoraCell(vIdx,'inicio',v)}</td>
          <td style="width:90px;text-align:center;padding:4px 6px">${renderVentaHoraCell(vIdx,'fin',v)}</td>
          <td style="width:80px;text-align:center">${durBadge(v.inicio, v.fin)}</td>
          <td style="font-size:12px;color:var(--sage-dark);font-weight:600">${esc(v.asignado||'')}</td>
          <td></td>`;
      }
      tbody.appendChild(vtTr);
    });
  }

  // Mensaje si el florista no tiene tareas asignadas
  if(isFlorista && !tbody.querySelector('tr:not(.cl-section-row)')){
    tbody.innerHTML = `<tr><td colspan="5" style="padding:32px;text-align:center;color:var(--mid-gray)">
      <div style="font-size:28px;margin-bottom:8px">📋</div>
      <div style="font-size:14px;font-weight:500">No tenés tareas asignadas para hoy, ${floristaNombre}</div>
      <div style="font-size:12px;margin-top:4px">Gerencia asigna las tareas desde la checklist general.</div>
    </td></tr>`;
  }
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
    checklistHistory.push({
      date: TODAY_ISO, week: getWeekLabel(now),
      weekKey: CURRENT_WEEK_KEY, day: currentDay,
      sec: t.sec, zona: t.zona,
      actividad: clState.actividad[i]||t.actividad,
      obs: clState.obs[i]||'',
      tiempo: clState.tiempo[i]||'',
      inicio: inicioFinal, fin: horaActual,
      duracion: durFinal,
      who: resp, hora: now.toTimeString().slice(0,5)
    });
    localStorage.setItem('cl_history', JSON.stringify(checklistHistory));
    fbSave('checklistHistory', checklistHistory);
    renderHistoryPanel();
    // Toast de confirmación con duración
    const durTxt = durFinal ? ' · Duración: ' + fmtDur(durFinal) : '';
    showToast('✅ Tarea finalizada — Inicio: ' + inicioFinal + ' · Fin: ' + horaActual + durTxt);
    saveWeekState(currentDay, 'checked');
  } else if(campo === 'inicio'){
    showToast('▶ Inicio registrado: ' + horaActual);
  }

  saveWeekState(currentDay, campo);
  renderChecklistTable();
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

function resetHora(i, campo){
  if(!clState) return;
  // Si se borra el Inicio y ya hay Fin, también borrar el Fin para mantener consistencia
  if(campo === 'inicio' && clState.fin?.[i]){
    if(!confirm('¿Borrar el horario de Inicio?\nEsto también borrará el Fin registrado (' + clState.fin[i] + ') para mantener la consistencia.')){
      return;
    }
    clState.fin[i] = '';
    // Si la tarea estaba marcada solo por el Fin, desmarcarla
    if(clState.checked[i]) clState.checked[i] = false;
  }
  clState[campo][i] = '';
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

function updCL(i, field, val){ if(!clState) return; clState[field][i] = val; saveWeekState(currentDay, field); }

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
      who:  resp,
      hora: now.toTimeString().slice(0,5)
    });
    localStorage.setItem('cl_history', JSON.stringify(checklistHistory));
    fbSave('checklistHistory', checklistHistory);
    renderHistoryPanel();
  }
  saveWeekState(currentDay, 'checked');
  renderChecklistTable();
}


function confirmResetWeek(){
  if(userRole !== 'gerencia'){ showToast('⛔ Solo gerencia puede realizar esta acción'); return; }
  const toArr = v => Array.isArray(v) ? v : (v ? Object.values(v) : []);
  let done = 0;
  try { done = Object.values(clStateByDay||{}).reduce((sum,ds)=>sum+toArr(ds?.checked).filter(Boolean).length,0); } catch(e){}
  const msg = done>0
    ? `¿Cerrar la semana y empezar nueva?\nSe archivarán ${done} tareas completadas en el historial y la checklist quedará limpia.`
    : '¿Iniciar nueva semana? La checklist quedará limpia.';
  if(!confirm(msg)) return;
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
    tbody.innerHTML='<tr><td colspan="11" style="padding:16px;text-align:center;color:var(--mid-gray)">Sin registros para mostrar</td></tr>';
    return;
  }
  const sorted = [...filtered].reverse();
    tbody.innerHTML = sorted.map(r=>`
    <tr>
      <td>${fmtDate(r.date)}</td>
      <td style="font-size:11px;color:var(--mid-gray)">${esc(r.week)}</td>
      <td>${esc(r.day)}</td>
      <td style="font-weight:500">${esc(r.zona)}</td>
      <td><span class="badge ${getBadge(r.actividad)}">${esc(r.actividad)}</span></td>
      <td style="font-size:12px;color:var(--mid-gray)">${r.obs&&r.obs!=='Observaciones'?esc(r.obs):'<span style="color:var(--light-gray)">—</span>'}</td>
      <td style="font-size:12px;font-weight:600;color:var(--charcoal)">${r.inicio||'<span style=\"color:var(--mid-gray)\">—</span>'}</td>
      <td style="font-size:12px;font-weight:600;color:var(--charcoal)">${r.fin||'<span style=\"color:var(--mid-gray)\">—</span>'}</td>
      <td style="text-align:center">${durBadge(r.inicio,r.fin)}</td>
      <td><span class="responsable-tag">${esc(r.who)}</span></td>
      <td style="font-size:12px;color:var(--mid-gray)">${esc(r.hora)}</td>
    </tr>`).join('');
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
  const ACTIVE_ESTADOS = ['Pedidos Pendientes','En Proceso','Pendiente de Colocacion'];
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
      <td style="font-weight:600;font-size:13px">${item.actual%1===0?item.actual:item.actual.toFixed(1)}</td>
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
function delStock(i){
  const item = stockData[i];
  if(!item) return;
  if(!confirm('¿Eliminar "'+item.prod+'" del stock?\nEsto lo quita de la lista por completo.')) return;
  stockData.splice(i,1);
  fbSave('stockData', stockData);
  renderStock();
  renderStockAdmin();
  showToast('🗑️ '+item.prod+' eliminado del stock');
}
function filterByStatus(s,btn){ document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); stockFilter=s; renderStock(); }
function filterStock(v){ stockSearch=v.toLowerCase(); renderStock(); }

function renderStockAdmin(){
  const tbody = document.getElementById('stock-admin-body');
  if(!tbody) return;
  tbody.innerHTML = '';
  const comprometidos = stockData.map(item => getStockComprometido(item));
  let alertHtml = '';

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
const ESTADO_COL = {'Pedidos Pendientes':0,'En Proceso':1,'Pendiente de Colocacion':2,'Confirmado':1,'Pedidos Finalizados':3};
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

function renderKanban(){
  syncEventosToKanban();

  // Alert banner for upcoming events
  const alertEl = document.getElementById('kanban-eventos-alert');
  const próximos = eventosData.filter(e=>e.estado!=='Pedidos Finalizados'&&e.fecha>=TODAY_ISO).sort((a,b)=>a.fecha.localeCompare(b.fecha)).slice(0,2);
  alertEl.innerHTML = próximos.length
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
      const cardEl=document.createElement('div');
      cardEl.className='kanban-card'+(card.isEvento?' evento-card':'')+(card.isEvento&&ci===3?' evento-hecho':'');
      cardEl.draggable=true;
      cardEl.addEventListener('dragstart',()=>{dragSrcCol=ci;dragSrcIdx=i;cardEl.classList.add('dragging');});
      cardEl.addEventListener('dragend',()=>cardEl.classList.remove('dragging'));
      const descLines = (card.desc||'').split('\n').filter(Boolean);
      cardEl.innerHTML=`
        <div class="kanban-card-title">${esc(card.title)}</div>
        ${descLines.length?`<div class="kanban-card-desc">${descLines.map(esc).join('<br>')}</div>`:''}
        <div class="kanban-card-tags">${card.tags.map(t=>`<span class="kanban-tag ${t}">${TAG_LABELS[t]||t}</span>`).join('')}</div>
        <div class="kanban-card-meta">
          <span class="kanban-date">📅 ${card.date}</span>
          <div class="kanban-actions">
            ${card.isEvento?`<button class="btn-icon" title="Ver detalle" onclick="openEventoDetail(${card.eventoIdx})">👁</button><button class="btn-icon" title="Ver en Comercial" onclick="navigate('eventos-comercial')">🔗</button>`:`<button class="btn-icon" onclick="openTaskModal(${ci},${i})">✏️</button>`}
            ${!card.isEvento?`<button class="btn-icon" style="color:var(--red-alert)" onclick="removeKanbanCard(${ci},${i})">✕</button>`:''}
          </div>
        </div>`;
      colEl.appendChild(cardEl);
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

function removeKanbanCard(ci,i){
  if(!confirm('¿Eliminar esta tarea?')) return;
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
    sec.innerHTML = '<option value="">— Seleccionar área —</option>' +
      HOTEL_SECCIONES.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('') +
      '<option value="__otra__">✏️ Otra (escribir)...</option>';
    sec.onchange = function(){
      if(this.value === '__otra__'){
        const custom = prompt('Escribí el área / uso:');
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

function addCompra(type){
  const p=type==='floreria'?'cf':'cj';
  const prod=document.getElementById(p+'-producto').value.trim();
  if(!prod){alert('Ingresá el producto.');return;}
  getArr(type).unshift({
    fecha:document.getElementById(p+'-fecha').value||TODAY_ISO,
    pedidopor:document.getElementById(p+'-pedidopor').value||'—',
    prod,
    desc:document.getElementById(p+'-desc').value||'',
    qty:document.getElementById(p+'-cantidad').value||1,
    costo:document.getElementById(p+'-costo').value||'',
    prov:document.getElementById(p+'-proveedor').value||'',
    sector:document.getElementById(p+'-sector').value||'',
    estado:'pedido'
  });
  ['fecha','pedidopor','producto','cantidad','desc','costo','proveedor','sector'].forEach(id=>{
    const el=document.getElementById(p+'-'+id);
    if(el) el.value='';
  });
  renderCompras(type);
  if(document.getElementById('page-stock').classList.contains('active')) renderStock();
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

function renderCompraSummary(type, filtered){
  const summaryEl = document.getElementById('compras-'+(type==='floreria'?'flore':'jard')+'-summary');
  const total = filtered.reduce((s,r)=>s+parseMoney(r.costo),0);
  const recibidos = filtered.filter(r=>r.estado==='recibido').reduce((s,r)=>s+parseMoney(r.costo),0);
  const enPedido = filtered.filter(r=>r.estado!=='recibido').length;
  summaryEl.innerHTML = `
    <div class="card"><div class="card-label">💰 Total período</div><div class="card-value" style="font-size:26px">$${total.toLocaleString('es-AR')}</div><div class="card-sub">${filtered.length} órdenes</div></div>
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
  const f = compraFilter[type];

  // Filtro de período (meses)
  let filtered = f
    ? arr.filter(r=>{ const ym=r.fecha?r.fecha.slice(0,7):''; return ym>=f.from && ym<=f.to; })
    : arr;

  renderPeriodTabs(type);

  // ── Poblar y leer filtros extra (proveedor, área, fecha) ──
  const provSel  = document.getElementById(p+'-filter-prov');
  const areaSel  = document.getElementById(p+'-filter-area');
  const fechaInp = document.getElementById(p+'-filter-fecha');

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
  const fFecha = fechaInp?.value || '';

  if(fProv)  filtered = filtered.filter(r => r.prov === fProv);
  if(fArea)  filtered = filtered.filter(r => r.sector === fArea);
  if(fFecha) filtered = filtered.filter(r => r.fecha === fFecha);

  renderCompraSummary(type, filtered);

  // Para la tabla: solo mostrar pedidos en curso (los recibidos se van automáticamente)
  const activos = filtered.filter(r => r.estado !== 'recibido');

  const tbody = getTbody(type);
  if(!tbody) return;
  if(activos.length===0){
    tbody.innerHTML=`<tr><td colspan="11" style="padding:20px;text-align:center;color:var(--mid-gray)">${filtered.length>0?'✅ Todos los pedidos de este período fueron recibidos.':'Sin compras en este período.'}</td></tr>`;
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
    const totalBloque = items.reduce((s,r) => s + parseMoney(r.costo), 0);
    const cantItems = items.length;
    const cantTotal = items.reduce((s,r) => s + (+r.qty||0), 0);
    html += `<tr class="compra-date-header">
      <td colspan="11" style="background:#F4F1EC;padding:10px 14px;border-bottom:2px solid #E5E3DC">
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
      html += `<tr>
      <td><input class="form-input" type="date" value="${esc(r.fecha)}" onchange="updC('${type}',${i},'fecha',this.value)" style="min-width:130px"></td>
      <td><input class="form-input" value="${esc(r.pedidopor)}" onchange="updC('${type}',${i},'pedidopor',this.value)" style="min-width:100px"></td>
      <td><input class="form-input" value="${esc(r.prod)}" onchange="updC('${type}',${i},'prod',this.value)" style="min-width:140px"></td>
      <td><input class="form-input" value="${esc(r.desc)}" placeholder="—" onchange="updC('${type}',${i},'desc',this.value)" style="min-width:120px"></td>
      <td><input class="form-input" type="number" value="${esc(r.qty)}" onchange="updC('${type}',${i},'qty',this.value);renderStock()" style="width:65px"></td>
      <td><input class="form-input" value="${esc(r.costo)}" placeholder="$" onchange="updC('${type}',${i},'costo',this.value);renderCompraSummary('${type}',compraFilter['${type}']?getArr('${type}').filter(r=>r.fecha&&r.fecha.slice(0,7)>=compraFilter['${type}'].from&&r.fecha.slice(0,7)<=compraFilter['${type}'].to):getArr('${type}'))" style="width:90px"></td>
      <td><select class="form-input" onchange="updC('${type}',${i},'prov',this.value)" style="min-width:130px"><option value=''>— Seleccionar —</option>${getProvOpts(r.prov)}</select></td>
      <td><input class="form-input" value="${esc(r.sector)}" onchange="updC('${type}',${i},'sector',this.value)" style="min-width:110px"></td>
      <td>
        <select class="form-select" onchange="updC('${type}',${i},'estado',this.value);updateKpiCompras()" style="min-width:120px">
          <option value="pedido" ${r.estado!=='recibido'?'selected':''}>📝 Pedido</option>
          <option value="recibido" ${r.estado==='recibido'?'selected':''}>📦 Recibido</option>
        </select>
      </td>
      <td style="vertical-align:middle">${getStockBadge(r.prod)}</td>
      <td><button class="btn-icon" style="color:var(--red-alert)" onclick="delC('${type}',${i})">✕</button></td>
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
  const fechaInp = document.getElementById(p+'-filter-fecha');
  if(provSel) provSel.value = '';
  if(areaSel) areaSel.value = '';
  if(fechaInp) fechaInp.value = '';
  renderCompras(type);
}

function toggleHistorialCompras(){
  const wrap = document.getElementById('historial-compras-wrap');
  if(!wrap) return;
  const visible = wrap.style.display !== 'none';
  wrap.style.display = visible ? 'none' : '';
  document.getElementById('hist-compras-btn').textContent = visible ? '📚 Ver historial de pedidos recibidos' : '📚 Ocultar historial';
  if(!visible) renderHistorialCompras();
}

function renderHistorialCompras(){
  const wrap = document.getElementById('historial-compras-wrap');
  if(!wrap) return;

  const recibidos = comprasFlore.filter(r => r.estado === 'recibido');
  if(!recibidos.length){
    wrap.innerHTML = '<div style="text-align:center;padding:24px;color:var(--mid-gray)">No hay pedidos recibidos en el historial.</div>';
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
    const totalBloque = items.reduce((s,r) => s + parseMoney(r.costo), 0);
    const totalVaras = items.reduce((s,r) => s + (+r.totalVaras||+r.qty||0), 0);

    html += `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;margin-bottom:12px;overflow:hidden">
      <div style="background:#F4F1EC;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <strong style="font-size:14px;color:#1A1A1A">📦 Pedido del ${fecha!=='sin-fecha' ? fmtDate(fecha) : 'sin fecha'}</strong>
          <span style="color:#7A7A72;font-size:12px;margin-left:10px">${items.length} ítem${items.length!==1?'s':''} · ${totalVaras} varas</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-weight:600;color:#1A1A1A;font-size:13px">${totalBloque ? '$'+totalBloque.toLocaleString('es-AR') : ''}</span>
          <button class="btn-secondary" style="font-size:11px;padding:4px 10px" onclick="copiarBloquePedido('floreria','${fecha}')" title="Copiar este pedido con fecha de hoy">📋 Copiar pedido</button>
        </div>
      </div>
      <table style="width:100%;font-size:12px;border-collapse:collapse">
        <thead><tr style="background:#FAF8F4">
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:10px">Producto</th>
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:10px">Proveedor</th>
          <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:10px">Área</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:10px">Paq</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:10px">Varas/paq</th>
          <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:10px">Total varas</th>
          <th style="padding:6px 10px;text-align:right;color:var(--mid-gray);font-size:10px">Precio</th>
        </tr></thead>
        <tbody>${items.map(r => `<tr style="border-top:1px solid #F0EDE8">
          <td style="padding:6px 10px;font-weight:500">${esc(r.prod)}</td>
          <td style="padding:6px 10px;color:var(--mid-gray)">${esc(r.prov||'—')}</td>
          <td style="padding:6px 10px;color:var(--mid-gray)">${esc(r.sector||'—')}</td>
          <td style="padding:6px 10px;text-align:center">${r.paqRecibidos||r.qty||'—'}</td>
          <td style="padding:6px 10px;text-align:center">${r.varasPorPaq||'—'}</td>
          <td style="padding:6px 10px;text-align:center;font-weight:600">${r.totalVaras||r.qty||'—'}</td>
          <td style="padding:6px 10px;text-align:right">${esc(r.costo||'—')}</td>
        </tr>`).join('')}</tbody>
      </table>
    </div>`;
  });

  wrap.innerHTML = html;
}

function copiarBloquePedido(type, fecha){
  const arr = getArr(type);
  // Tomar todos los ítems de esa fecha (incluyendo recibidos, para replicar el pedido completo)
  const bloque = arr.filter(r => r.fecha === fecha);
  if(!bloque.length){ showToast('⚠️ No se encontraron ítems para esa fecha'); return; }
  if(!confirm('¿Copiar el pedido del ' + fmtDate(fecha) + ' (' + bloque.length + ' ítems) con fecha de hoy?\nPodés modificar cantidades después.')) return;
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

function delProveedor(i){
  if(!confirm('¿Eliminar proveedor "'+proveedoresList[i]+'"?')) return;
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

function showToast(msg){
  let t = document.getElementById('global-toast');
  if(!t){
    t = document.createElement('div');
    t.id='global-toast';
    t.style.cssText='position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:var(--sage-dark);color:white;padding:12px 24px;border-radius:12px;font-size:13px;font-family:"Jost",sans-serif;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.25);transition:opacity .4s;white-space:nowrap;';
    document.body.appendChild(t);
  }
  t.textContent=msg;
  t.style.opacity='1';
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>{ t.style.opacity='0'; },3500);
}
function delC(type,i){ if(!confirm('¿Eliminar esta orden?')) return; getArr(type).splice(i,1); renderCompras(type); updateKpiCompras(); }
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
    const matchSearch = !search || ev.nombre?.toLowerCase().includes(search) || evZonasLabel(ev).toLowerCase().includes(search);
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
    tbody.innerHTML = '<tr><td colspan="7" style="padding:24px;text-align:center;color:var(--mid-gray)">'+
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
  wrap.innerHTML = cats.map((cat, ci) => {
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

function limpiarCarritoOps(){
  if(!cotCarritoOps.length) return;
  if(!confirm('¿Limpiar la selección?')) return;
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

function limpiarCarrito(){
  if(!cotizadorCarrito.length) return;
  if(!confirm('¿Limpiar el carrito?')) return;
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

function addReglaTipo(tipoIdx){
  const nombres = recetasData.map(r=>r.nombre);
  const arreglo = prompt('Nombre del arreglo (ej. Bochita, Pecera, Cuenco):\n\nDisponibles: ' + nombres.join(', '));
  if(!arreglo || !arreglo.trim()) return;
  const cadaPax = prompt('1 ' + arreglo.trim() + ' cada ¿cuántas personas?', '10');
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

function addTipoEvento(){
  const nombre = prompt('Nombre del tipo de evento (ej. Social, Cocktail, Corporativo):');
  if(!nombre || !nombre.trim()) return;
  const margen = prompt('Margen de ganancia para este tipo (%):', '40');
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

function delTipoEvento(i){
  if(!confirm('¿Eliminar tipo "'+eventoPricing.tipos[i].nombre+'"?')) return;
  eventoPricing.tipos.splice(i,1);
  fbSave('eventoPricing', eventoPricing);
  renderEvTipos();
}

function calcCostoComposicion(r){
  return r.ings.reduce((s, ing) => s + (cotizadorPrecios[ing.prod] || 0) * (+ing.qty||0), 0);
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
      const ingsList = r.ings.map(g => `${g.qty} ${g.prod}`).join(', ');
      const sinCosto = r.ings.some(g => !cotizadorPrecios[g.prod]);
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
  const eventosActivos = eventosData.filter(ev => ev.estado !== 'Pedidos Finalizados');
  grid.innerHTML=eventosActivos.map((ev)=>{
    const i = eventosData.indexOf(ev);
    const stStyle=ESTADO_COLORS[ev.estado]||'';
    const stOpts=['Pedidos Pendientes','En Proceso','Pendiente de Colocacion','Confirmado','Pedidos Finalizados'].map(o=>`<option value="${o}"${ev.estado===o?' selected':''}>${o}</option>`).join('');
    const fromOpsTag = ev.fromKanban ? '<span style="font-size:10px;background:#E8F0F8;color:#2C5A80;padding:2px 7px;border-radius:4px;font-weight:600;letter-spacing:.5px">DESDE OPERACIONES</span>' : '';
    return `<div class="event-card"${ev.fromKanban?' style="border-left:3px solid #2C5A80"':''}>
      <div class="event-card-header">
        <div style="display:flex;flex-direction:column;gap:4px"><div class="event-name">${esc(ev.nombre)}</div>${fromOpsTag}</div>
        <span class="event-type">${esc(ev.tipo)}</span>
      </div>
      <div class="event-details">
        <strong>Fecha:</strong> ${fmtDate(ev.fecha)}${ev.hora?' <strong>·</strong> <strong>Hora:</strong> '+esc(ev.hora):''}<br>
        <strong>Salón:</strong> ${esc(evZonasLabel(ev))}<br>
        ${ev.pax?`<strong>Pax:</strong> ${ev.pax}<br>`:''}
        <strong>Notas:</strong> ${esc(ev.notas)}
      </div>
      <div class="event-footer">
        <div class="event-price">${esc(ev.precio)}</div>
        <div style="display:flex;gap:8px;align-items:center">
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

function deleteEvento(i){ if(!confirm('¿Eliminar este evento?')) return; eventosData.splice(i,1); renderEventos(); renderHome(); }

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
      <div class="card card-clickable" onclick="navigate('ventas-externas')">
        <div class="card-label">💰 Ventas del Mes</div>
        <div class="card-value" style="font-size:22px">${fmtARS(totalMes)}</div>
        <div class="card-sub">${ventasMes.length} transacciones</div>
      </div>
      <div class="card card-clickable" onclick="navigate('checklist')">
        <div class="card-label">✅ Checklist Hoy</div>
        <div class="card-value${pct===100?' green':''}">${hechas}<span style="font-size:16px;font-weight:400;color:var(--mid-gray)">/${totalTareas}</span></div>
        <div class="card-sub">${pct}% completado</div>
      </div>
      ${recAlerts.length ? `<div class="card card-clickable" onclick="navigate('recordatorios-jardineria')" style="border-left:3px solid var(--red-alert)">
        <div class="card-label">🌿 Recordatorios Jardín</div>
        <div class="card-value red">${recAlerts.length}</div>
        <div class="card-sub">${recAlerts.filter(r=>recEstado(r)==='vencido').length} vencido${recAlerts.filter(r=>recEstado(r)==='vencido').length!==1?'s':''} · ${recAlerts.filter(r=>recEstado(r)==='proximo').length} próximo${recAlerts.filter(r=>recEstado(r)==='proximo').length!==1?'s':''}</div>
      </div>` : ''}
    </div>`;

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

  // ── Columna Ventas ──
  document.getElementById('home-ventas-col').innerHTML = `
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
}

// ════════════════════════════════════════
// DATA — VENTAS (fully editable inline + new columns)
// ════════════════════════════════════════
let ventasData=[];
let jardRecordatorios=[];
window._setVentasData = (arr) => { ventasData.splice(0, ventasData.length, ...arr); };

const VENTA_ESTADOS=['pendiente','confirmado','entregado'];
const VENTA_ESTADO_LABEL={'pendiente':'⏳ Pendiente','confirmado':'✅ Confirmado','entregado':'🚚 Entregado'};
const VENTA_ESTADO_COLOR={'pendiente':ESTADO_COLORS['Pedidos Pendientes'],'confirmado':ESTADO_COLORS['Confirmado'],'entregado':ESTADO_COLORS['Pedidos Finalizados']};

function renderVentas(){
  // Banner ítems desde Kanban
  const vkb = document.getElementById('ventas-kanban-banner');
  if(vkb){
    const fromOps = ventasData.filter(v=>v.fromKanban && v.estado==='pendiente');
    vkb.innerHTML = fromOps.length
      ? `<div class="alert-banner" style="background:#E8F0F8;border-color:#B0C8E0;color:#2C5A80">📋 <strong>${fromOps.length} ramo${fromOps.length>1?'s':''} cargado${fromOps.length>1?'s':''} desde Operaciones</strong> — completá precio y cliente.</div>`
      : '';
  }
  const tbody=document.getElementById('ventas-body');
  tbody.innerHTML = ventasData.map((v,i)=>`<tr${v.fromKanban?' style="background:rgba(122,154,184,.07)"':''}>
    <td><input class="form-input" value="${esc(v.prod)}" onchange="updV(${i},'prod',this.value)" style="min-width:140px"></td>
    <td><input class="form-input" value="${esc(v.desc)}" onchange="updV(${i},'desc',this.value)" style="min-width:150px" placeholder="Flores, colores..."></td>
    <td><input class="form-input" type="date" value="${esc(v.fecha)}" onchange="updV(${i},'fecha',this.value)" style="min-width:130px"></td>
    <td><input class="form-input" value="${esc(v.cliente)}" onchange="updV(${i},'cliente',this.value)" style="min-width:110px"></td>
    <td><input class="form-input" value="${esc(v.dedicatoria||'')}" onchange="updV(${i},'dedicatoria',this.value)" style="min-width:130px" placeholder="—"></td>
    <td><input class="form-input" value="${esc(v.precio)}" onchange="updV(${i},'precio',this.value)" style="width:90px"></td>
    <td>
      <select class="form-select" onchange="updV(${i},'formaPago',this.value)" style="min-width:140px;font-size:12px">
        <option value="">—</option>
        <option value="Efectivo" ${v.formaPago==='Efectivo'?'selected':''}>💵 Efectivo</option>
        <option value="Tarjeta" ${v.formaPago==='Tarjeta'||v.formaPago==='Débito'||v.formaPago==='Crédito'?'selected':''}>💳 Tarjeta</option>
        <option value="Transferencia" ${v.formaPago==='Transferencia'?'selected':''}>🏦 Transferencia</option>
        <option value="Cargo a rooms" ${v.formaPago==='Cargo a rooms'||v.formaPago==='Cargo a habitación'?'selected':''}>🏨 Cargo a rooms</option>
        <option value="Cuenta corriente" ${v.formaPago==='Cuenta corriente'?'selected':''}>📋 Cuenta corriente</option>
      </select>
    </td>
    <td>
      <select class="form-select" style="${VENTA_ESTADO_COLOR[v.estado]||''};min-width:130px;font-size:11px;font-weight:600" onchange="updV(${i},'estado',this.value)">
        ${VENTA_ESTADOS.map(s=>`<option value="${s}"${v.estado===s?' selected':''}>${VENTA_ESTADO_LABEL[s]}</option>`).join('')}
      </select>
    </td>
    <td><input class="form-input" value="${esc(v.dir||'')}" onchange="updV(${i},'dir',this.value)" style="min-width:160px" placeholder="Dirección o retira"></td>
    <td style="white-space:nowrap">
      <button class="btn-icon" onclick="openEditSaleModal(${i})" title="Editar" style="color:var(--sage-dark)">✏️</button>
      <button class="btn-icon" style="color:var(--red-alert)" onclick="delVenta(${i})">✕</button>
    </td>
  </tr>`).join('');
}

function updV(i,field,val){ ventasData[i][field]=val; fbSave('ventasData',ventasData); }
function openSaleModal(){
  document.getElementById('sale-modal-title').textContent = 'Nueva Venta';
  document.getElementById('sale-edit-idx').value = '-1';
  document.getElementById('sale-fecha').value=TODAY_ISO;
  ['sale-desc','sale-cliente','sale-dedicatoria','sale-precio','sale-dir'].forEach(id=>document.getElementById(id).value='');
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

function saleAutoFillPrice(){
  const sel = document.getElementById('sale-prod');
  if(sel.value === '__otro__'){
    const custom = prompt('Nombre del arreglo o ramo:');
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
    fecha:document.getElementById('sale-fecha').value||TODAY_ISO,
    dedicatoria:document.getElementById('sale-dedicatoria').value,
    precio:document.getElementById('sale-precio').value||'—',
    formaPago:document.getElementById('sale-pago').value,
    estado,
    dir:document.getElementById('sale-dir').value||'',
    asignado,
  };

  if(editIdx >= 0){
    // Edición: preservar inicio/fin si existen
    venta.inicio = ventasData[editIdx].inicio || '';
    venta.fin = ventasData[editIdx].fin || '';
    ventasData[editIdx] = venta;
    fbSave('ventasData', ventasData);
    showToast('✅ Venta actualizada');
  } else {
    // Nueva venta
    ventasData.push(venta);
    fbSave('ventasData', ventasData);

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

  closeModal('sale-modal');
  renderVentas();
}
function delVenta(i){ if(!confirm('¿Eliminar esta venta?')) return; ventasData.splice(i,1); fbSave('ventasData',ventasData); renderVentas(); }

// ════════════════════════════════════════
// DATA — CAJA
// ════════════════════════════════════════
let cajaData=[];
window._setCajaData = (arr) => { cajaData.splice(0, cajaData.length, ...arr); };

function renderCaja(){
  let totalIn=0,totalEg=0;
  cajaData.forEach(r=>{ if(r.tipo==='ingreso')totalIn+=r.monto;else totalEg+=r.monto; });
  const tbody=document.getElementById('caja-body');
  tbody.innerHTML='';
  let running=0;
  cajaData.forEach((r,i)=>{
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
  if(!desc||!monto){alert('Completá descripción y monto.');return;}
  cajaData.push({
    fecha:document.getElementById('cj-fecha-caja').value||TODAY_ISO,
    desc, ticket:document.getElementById('cj-ticket').value,
    tipo:document.getElementById('cj-tipo').value, monto
  });
  fbSave('cajaData', cajaData);
  closeModal('caja-modal');
  renderCaja();
}
function delCaja(i){ if(!confirm('¿Eliminar este movimiento?')) return; cajaData.splice(i,1); fbSave('cajaData',cajaData); renderCaja(); }

// ════════════════════════════════════════
// DATA — GLOSARIO
// ════════════════════════════════════════
let glosarioData=[];
window._setGlosarioData = (arr) => { glosarioData.splice(0, glosarioData.length, ...arr); };

function renderGlosario(){
  document.getElementById('glosario-grid').innerHTML=glosarioData.map((g,i)=>{
    const photos = g.photos||[];
    // Photo strip — muestra hasta 4 thumbs
    const photoStrip = photos.length
      ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
          ${photos.map((p,pi)=>`
            <div style="position:relative;width:72px;height:72px;border-radius:6px;overflow:hidden;border:1px solid var(--light-gray)">
              <img src="${p}" style="width:100%;height:100%;object-fit:cover;cursor:pointer" onclick="openPhotoViewer(${i},${pi})">
              <button onclick="removePhoto(${i},${pi})" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,.55);color:white;border:none;border-radius:50%;width:18px;height:18px;font-size:11px;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center">✕</button>
            </div>`).join('')}
          <label style="width:72px;height:72px;border-radius:6px;border:2px dashed var(--light-gray);display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;font-size:11px;color:var(--mid-gray);gap:4px" title="Agregar foto">
            <span style="font-size:22px">📷</span>+
            <input type="file" accept="image/*" multiple style="display:none" onchange="addPhotos(${i},this)">
          </label>
        </div>`
      : `<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;color:var(--mid-gray);margin-bottom:10px;padding:8px;border:2px dashed var(--light-gray);border-radius:8px">
          <span style="font-size:20px">📷</span> Agregar fotos de referencia
          <input type="file" accept="image/*" multiple style="display:none" onchange="addPhotos(${i},this)">
        </label>`;

    return `<div class="glosario-item">
      <div class="glosario-body" style="padding:16px">
        ${photoStrip}
        <div style="margin-bottom:8px">
          <input value="${esc(g.nombre)}" onchange="updGlosario(${i},'nombre',this.value)"
            style="width:100%;font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--charcoal);border:none;border-bottom:1px solid transparent;background:transparent;outline:none;padding:2px 0;transition:border-color .2s"
            onfocus="this.style.borderBottomColor='var(--sage)'" onblur="this.style.borderBottomColor='transparent'">
        </div>
        <div style="margin-bottom:8px">
          <textarea onchange="updGlosario(${i},'desc',this.value)"
            style="width:100%;font-size:12px;color:var(--mid-gray);border:none;background:transparent;outline:none;resize:none;line-height:1.6;min-height:54px;padding:2px 0;border-bottom:1px solid transparent;transition:border-color .2s;font-family:'DM Sans',sans-serif"
            onfocus="this.style.borderBottomColor='var(--sage)'" onblur="this.style.borderBottomColor='transparent'">${esc(g.desc)}</textarea>
        </div>
        <div style="margin-bottom:8px">
          <input value="${esc(g.dimension||'')}" onchange="updGlosario(${i},'dimension',this.value)" placeholder="Dimensión / Tamaño"
            style="width:100%;font-size:12px;color:var(--charcoal);border:none;background:transparent;outline:none;padding:2px 0;border-bottom:1px solid transparent;transition:border-color .2s;font-family:'DM Sans',sans-serif;font-style:italic"
            onfocus="this.style.borderBottomColor='var(--sage)'" onblur="this.style.borderBottomColor='transparent'">
        </div>
        <div class="glosario-price">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:11px;color:var(--mid-gray)">$</span>
            <input value="${esc(g.precio)}" onchange="updGlosario(${i},'precio',this.value)"
              style="font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--sage-dark);border:none;background:transparent;outline:none;width:120px;border-bottom:1px solid transparent;transition:border-color .2s"
              onfocus="this.style.borderBottomColor='var(--sage)'" onblur="this.style.borderBottomColor='transparent'">
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <input value="${esc(g.emoji)}" onchange="updGlosario(${i},'emoji',this.value)"
              style="width:36px;text-align:center;font-size:18px;border:1px solid var(--light-gray);border-radius:6px;padding:2px 4px;outline:none" title="Emoji">
            <button class="btn-icon" style="color:var(--red-alert)" onclick="delGlosario(${i})">✕</button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}
function openGlosarioModal(){
  ['gl-nombre','gl-desc','gl-dimension','gl-precio','gl-emoji'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = '';
  });
  document.getElementById('gl-foto-data').value = '';
  document.getElementById('gl-foto-preview').style.display = 'none';
  document.getElementById('glosario-modal').classList.add('open');
}

function previewGlFoto(input){
  if(!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('gl-foto-data').value = e.target.result;
    document.getElementById('gl-foto-img').src = e.target.result;
    document.getElementById('gl-foto-preview').style.display = '';
  };
  reader.readAsDataURL(input.files[0]);
}

function addGlosario(){
  const nombre=document.getElementById('gl-nombre').value.trim();
  if(!nombre) return;
  const foto = document.getElementById('gl-foto-data').value;
  const photos = foto ? [foto] : [];
  glosarioData.push({
    nombre,
    desc: document.getElementById('gl-desc').value,
    dimension: document.getElementById('gl-dimension').value || '',
    precio: document.getElementById('gl-precio').value || '—',
    emoji: document.getElementById('gl-emoji').value || '🌸',
    photos
  });
  fbSave('glosarioData', glosarioData);
  closeModal('glosario-modal'); renderGlosario();
}
function delGlosario(i){ if(!confirm('¿Eliminar este arreglo?')) return; glosarioData.splice(i,1); fbSave('glosarioData',glosarioData); renderGlosario(); }
function updGlosario(i,field,val){ glosarioData[i][field]=val; fbSave('glosarioData',glosarioData); }

function addPhotos(i, input){
  const files = Array.from(input.files);
  if(!files.length) return;
  if(!glosarioData[i].photos) glosarioData[i].photos=[];
  let loaded=0;
  files.forEach(file=>{
    const reader = new FileReader();
    reader.onload = e=>{
      glosarioData[i].photos.push(e.target.result);
      loaded++;
      if(loaded===files.length){ fbSave('glosarioData',glosarioData); renderGlosario(); }
    };
    reader.readAsDataURL(file);
  });
}

function removePhoto(i,pi){
  glosarioData[i].photos.splice(pi,1);
  fbSave('glosarioData',glosarioData);
  renderGlosario();
}

function openPhotoViewer(i,pi){
  const photos = glosarioData[i].photos;
  let current = pi;
  let overlay = document.getElementById('photo-viewer-overlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'photo-viewer-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:2000;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px';
    overlay.onclick = e=>{ if(e.target===overlay) overlay.remove(); };
    document.body.appendChild(overlay);
  }
  function renderViewer(){
    overlay.innerHTML = `
      <button onclick="document.getElementById('photo-viewer-overlay').remove()" style="position:absolute;top:20px;right:28px;background:none;border:none;color:white;font-size:28px;cursor:pointer">✕</button>
      <div style="font-family:'Cormorant Garamond',serif;font-size:18px;color:rgba(255,255,255,.7);margin-bottom:4px">${esc(glosarioData[i].nombre)} · ${current+1}/${photos.length}</div>
      <img src="${photos[current]}" style="max-width:88vw;max-height:75vh;border-radius:8px;object-fit:contain;box-shadow:0 8px 40px rgba(0,0,0,.5)">
      <div style="display:flex;gap:16px;margin-top:8px">
        ${current>0?`<button onclick="event.stopPropagation();current=${current-1};renderViewer()" style="background:rgba(255,255,255,.15);border:none;color:white;padding:8px 20px;border-radius:8px;cursor:pointer;font-size:14px">← Anterior</button>`:''}
        ${current<photos.length-1?`<button onclick="event.stopPropagation();current=${current+1};renderViewer()" style="background:rgba(255,255,255,.15);border:none;color:white;padding:8px 20px;border-radius:8px;cursor:pointer;font-size:14px">Siguiente →</button>`:''}
      </div>`;
  }
  renderViewer();
}


// ════════════════════════════════════════
// RECEPCIÓN DE PEDIDOS
// ════════════════════════════════════════
let recepState = {}; // key: idx → { items: [{checked, cantRecibida}] }

function renderRecepcionPedidos(){
  const pending = comprasFlore
    .map((c,i) => ({...c, _idx: i}))
    .filter(c => c.estado !== 'recibido');

  const listEl  = document.getElementById('recep-list');
  const emptyEl = document.getElementById('recep-empty');
  const alertEl = document.getElementById('recep-alert-area');

  if(!listEl) return;

  if(pending.length === 0){
    listEl.innerHTML = '';
    emptyEl.style.display = '';
    alertEl.innerHTML = '';
    return;
  }
  emptyEl.style.display = 'none';

  // Sin alertas de urgencia — circuito simple pedido → recibido
  alertEl.innerHTML = '';

  // Group by fecha+proveedor for display
  // Show action bar
  const actionBar = document.getElementById('recep-action-bar');
  if(actionBar) actionBar.style.display = 'flex';

  listEl.innerHTML = pending.map((order, localIdx) => {
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

function recepConfirmarTodo(){
  const pending = comprasFlore
    .map((c,i) => ({...c, _idx: i}))
    .filter(c => c.estado !== 'recibido');
  const toConfirm = pending.filter(o => recepState[o._idx]?.checked);
  if(toConfirm.length === 0){ alert('Marcá al menos un ítem.'); return; }
  const parciales = toConfirm.filter(o => parseFloat(recepState[o._idx].paqRecibidos) < parseFloat(o.qty));
  let msg = `¿Confirmar recepción de ${toConfirm.length} ítem${toConfirm.length>1?'s':''}?`;
  if(parciales.length > 0) msg += `\n\n⚠️ ${parciales.length} ítem${parciales.length>1?'s':''}con faltantes en paquetes — reclamar al proveedor.`;
  const totalVarasGlobal = toConfirm.reduce((s,o) => {
    const st = recepState[o._idx];
    return s + (parseFloat(st.paqRecibidos)||0) * (parseFloat(st.varasPorPaq)||1);
  }, 0);
  msg += `\n\n📊 Total a ingresar al stock: ${totalVarasGlobal} varas.`;
  msg += '\n\nEl stock se actualizará y los ítems desaparecerán de esta lista.';
  if(!confirm(msg)) return;
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
window._setJardineriaData = (arr) => {
  arr.forEach((r, i) => {
    if(i >= jardineriaData.length) return;
    jardineriaData[i].last         = r.last;
    jardineriaData[i].liveVisits   = r.liveVisits   || 0;
    jardineriaData[i].monthlyVisits= r.monthlyVisits|| {};
    jardineriaData[i].canUndo      = false;
    if(r.obs       !== undefined) jardineriaData[i].obs       = r.obs;
    if(r.quien     !== undefined) jardineriaData[i].quien     = r.quien;
    if(r.horaInicio!== undefined) jardineriaData[i].horaInicio= r.horaInicio;
    if(r.horaFin   !== undefined) jardineriaData[i].horaFin   = r.horaFin;
  });
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
    if(r.quien     !== undefined) habitacionesData[i].quien     = r.quien;
    if(r.horaInicio!== undefined) habitacionesData[i].horaInicio= r.horaInicio;
    if(r.horaFin   !== undefined) habitacionesData[i].horaFin   = r.horaFin;
  });
};
window._setJardineriaLog = (arr) => { jardineriaLog.splice(0, jardineriaLog.length, ...arr); };
window._setHabitacionesLog = (arr) => { habitacionesLog.splice(0, habitacionesLog.length, ...arr); };

// ── RECORDATORIOS JARDINERÍA ─────────────────────────────────────────────────
window._setJardRecordatorios = (arr) => { jardRecordatorios.splice(0, jardRecordatorios.length, ...arr); };

const JARD_TIPOS = ['Riego','Fertilización','Desmalezado','Poda'];
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

  document.getElementById('jrec-kpis').innerHTML = `
    <div class="cards-grid cards-grid-3" style="margin-bottom:24px">
      <div class="card"><div class="card-label">🔴 Vencidos</div><div class="card-value red">${vencidos.length}</div><div class="card-sub">requieren atención ya</div></div>
      <div class="card"><div class="card-label">🟡 Próximos</div><div class="card-value amber">${proximos.length}</div><div class="card-sub">en los próximos 3 días</div></div>
      <div class="card"><div class="card-label">🟢 Al día</div><div class="card-value green">${ok.length}</div><div class="card-sub">sin vencer</div></div>
    </div>`;

  const alertas = [...vencidos,...proximos];
  document.getElementById('jrec-alertas').innerHTML = alertas.length
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
             <div class="jrec-alert-nombre">${esc(r.task)}</div>
             <div class="jrec-alert-meta">${esc(r.section)} · ${esc(r.group)}</div>
             <span class="jrec-tipo-badge" style="${JARD_TIPO_STYLE[r.tipo]||''}">${JARD_TIPOS_ICON[r.tipo]||''} ${esc(r.tipo)} · cada ${r.frecuencia} días</span>
           </div>
           <div class="jrec-alert-right">
             <div class="jrec-dias-label jrec-${est}">${diasLabel}</div>
             <button class="btn-add" style="padding:7px 16px;font-size:12px;margin-top:6px" onclick="marcarRecordatorioHecho(${idx})">✓ Hecho hoy</button>
           </div>
         </div>`;
       }).join('')}`
    : `<div class="jrec-all-ok">✅ Todo al día — sin alertas pendientes</div>`;

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
  if(idx>=0) jardRecordatorios[idx]=rec; else jardRecordatorios.push(rec);
  fbSave('jardRecordatorios', jardRecordatorios);
  closeModal('jrec-modal');
  renderRecordatoriosJard();
}

function deleteRecordatorio(idx){
  if(!confirm('¿Eliminar este recordatorio?')) return;
  jardRecordatorios.splice(idx,1);
  fbSave('jardRecordatorios', jardRecordatorios);
  renderRecordatoriosJard();
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

// Umbrales de urgencia configurables por gerencia (regulables por estación).
// okMax: hasta N días = 🟢 Al día · warnMax: hasta N días = 🟡 Próxima · más allá = 🔴 Urgente
let urgenciaConfig = { okMax:3, warnMax:7 };
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
  ['all','alert','warn','ok'].forEach(m=>{
    const btn = document.getElementById('jops-btn-'+m);
    if(btn) btn.classList.toggle('active', m===mode);
  });
  renderJardOps();
}

function renderJardOps(){
  // KPIs
  let kOk=0,kWarn=0,kAlert=0,kNone=0;
  jardineriaData.forEach(r=>{
    const s=getDaysBadge(daysSince(r.last)).status;
    if(s==='ok')kOk++;else if(s==='warn')kWarn++;else if(s==='alert')kAlert++;else kNone++;
  });
  const kpisEl = document.getElementById('jops-kpis');
  if(kpisEl) kpisEl.innerHTML=`
    <div class="card"><div class="card-label">🔴 Urgente (+7d)</div><div class="card-value red" style="font-size:32px">${kAlert}</div><div class="card-sub">intervenir hoy</div></div>
    <div class="card"><div class="card-label">🟡 Próxima (4-7d)</div><div class="card-value amber" style="font-size:32px">${kWarn}</div><div class="card-sub">requieren visita pronto</div></div>
    <div class="card"><div class="card-label">🟢 Al día (≤3d)</div><div class="card-value green" style="font-size:32px">${kOk}</div><div class="card-sub">zonas recientes</div></div>`;

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
  zones.forEach(z=>{
    // Mostrar zona si tiene al menos una tarea del filtro seleccionado
    if(jopsFilter !== 'all' && !z.items.some(it=>it.badge.status===jopsFilter)) return;

    _jopsZones.push(z);  // índice = rendered
    const zIdx = rendered;
    const zh = zonaHorasData[z.section+'|||'+z.group] || {};

    const borderColor = z.worstStatus==='alert'?'#E53935':z.worstStatus==='warn'?'#F59E0B':z.worstStatus==='ok'?'#43A047':'#C0BEB6';
    const bgHeader    = z.worstStatus==='alert'?'#FFF5F5':z.worstStatus==='warn'?'#FFFBF0':z.worstStatus==='ok'?'#F0FAF0':'#F8F7F5';
    const chevId = 'jops-ch-'+rendered;

    const zoneEl = document.createElement('div');
    zoneEl.style.cssText = `border:1px solid ${borderColor};border-left:5px solid ${borderColor};border-radius:8px;overflow:hidden`;

    // Cabecera de zona — dos filas: info + botones de hora
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
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid rgba(0,0,0,0.07);flex-wrap:wrap">
        <span style="font-size:11px;color:var(--mid-gray);font-weight:600;margin-right:2px">⏱ Zona:</span>
        ${zonaHoraBtn(zIdx,'horaInicio',zh)}
        ${zonaHoraBtn(zIdx,'horaFin',zh)}
        ${zh.inicio&&zh.fin?durBadge(zh.inicio,zh.fin):''}
        ${zh.fecha&&zh.fecha!==TODAY_ISO?`<span style="font-size:10px;color:var(--mid-gray);margin-left:4px">último: ${fmtDate(zh.fecha)}</span>`:''}
      </div>`;

    // Contenedor de tareas de la zona (grid interno)
    const tasksEl = document.createElement('div');
    tasksEl.style.cssText = `display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1px;background:${borderColor}`;

    z.items.forEach(({r,i,badge})=>{
      const taskEl = document.createElement('div');
      taskEl.style.cssText = 'background:var(--warm-white);padding:14px;display:flex;flex-direction:column;gap:8px';
      taskEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div style="font-size:12px;font-weight:600;color:var(--charcoal);flex:1;line-height:1.4">${esc(r.task)}</div>
          <span class="days-badge ${badge.cls}" style="flex-shrink:0">${badge.label}</span>
        </div>
        <div style="font-size:11px;color:var(--mid-gray)">📅 ${r.last?fmtDate(r.last):'<em>Sin registro</em>'} · 📊 ${getMonthVisits(r)} este mes</div>
        <textarea id="jops-obs-${i}" class="cl-obs-input" placeholder="Observaciones..." style="width:100%;font-size:12px;resize:vertical;min-height:44px;padding:5px 7px;border-radius:4px;border:1px solid var(--light-gray);font-family:inherit;background:var(--warm-white)"
          onchange="jardineriaData[${i}].obs=this.value">${esc(r.obs||'')}</textarea>
        <div style="display:flex;gap:8px;align-items:center;margin-top:2px">
          <select id="jops-quien-${i}" class="cl-select" style="font-size:12px;padding:5px 8px;flex:1">
            <option value="">— Jardinero —</option>
            <option>Sole</option><option>Berni</option><option>Ivan</option>
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
      ${jopsFilter==='all'?'🌿 Sin tareas cargadas.':'✅ Sin zonas en esta categoría.'}
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


function renderCtrlJard(){
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
    <div class="card"><div class="card-label">🟢 Al día (≤${urgenciaConfig.okMax}d)</div><div class="card-value green" style="font-size:32px">${kOk}</div><div class="card-sub">zonas recientes</div></div>
    <div class="card"><div class="card-label">🟡 Próxima (${urgenciaConfig.okMax+1}-${urgenciaConfig.warnMax}d)</div><div class="card-value amber" style="font-size:32px">${kWarn}</div><div class="card-sub">requieren visita pronto</div></div>
    <div class="card"><div class="card-label">🔴 Urgente (+${urgenciaConfig.warnMax}d)</div><div class="card-value red" style="font-size:32px">${kAlert}</div><div class="card-sub">intervenir hoy</div></div>
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
      sr.innerHTML=`<td colspan="8">${getSectionEmoji(r.section)} ZONA ${esc(r.section.toUpperCase())}</td>`;
      tbody.appendChild(sr);
    }
    // Group header
    if(r.group!==lastGroup){
      lastGroup=r.group;
      const gr=document.createElement('tr');
      gr.className='ctrl-group-row';
      gr.innerHTML=`<td colspan="8">🌿 ${esc(r.group)}</td>`;
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
      </td>
      <td>
        <span class="days-badge ${badge.cls}">${badge.label}</span>
        <div class="ctrl-bar"><div class="ctrl-bar-fill" style="width:${badge.bar}%;${badge.barCls}"></div></div>
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
            <option>Sole</option><option>Berni</option><option>Ivan</option>
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
    tbody.innerHTML='<tr><td colspan="8" style="padding:20px;text-align:center;color:var(--mid-gray)">Sin resultados para este filtro.</td></tr>';
  }
  renderJardReporte();
  renderJardLog();
}

function markJardDone(i, quien){
  const r = jardineriaData[i];
  jardineriaLog.push({
    fecha: TODAY_ISO,
    section: r.section,
    group: r.group,
    task: r.task,
    quien: quien || '',
    obs: r.obs || ''
  });
  r.last = TODAY_ISO;
  r.liveVisits = (r.liveVisits||0)+1;
  if(!r.monthlyVisits) r.monthlyVisits={};
  r.monthlyVisits[CURR_MONTH] = (r.monthlyVisits[CURR_MONTH]||0)+1;
  r.quien = ''; r.obs = ''; r.canUndo = false;
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
}

function ctrlJardFilter(mode,btn){
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
    <div class="card"><div class="card-label">🔴 Urgente (+7d)</div><div class="card-value red" style="font-size:32px">${kAlert}</div><div class="card-sub">visitar hoy</div></div>
    <div class="card"><div class="card-label">🟡 Próxima (4-7d)</div><div class="card-value amber" style="font-size:32px">${kWarn}</div><div class="card-sub">próxima visita</div></div>
    <div class="card"><div class="card-label">🟢 Al día (≤3d)</div><div class="card-value green" style="font-size:32px">${kOk}</div><div class="card-sub">al día</div></div>`;

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
    <div class="card"><div class="card-label">🟢 Al día (≤${urgenciaConfig.okMax}d)</div><div class="card-value green" style="font-size:32px">${kOk}</div><div class="card-sub">visitadas recientemente</div></div>
    <div class="card"><div class="card-label">🟡 Próxima (${urgenciaConfig.okMax+1}-${urgenciaConfig.warnMax}d)</div><div class="card-value amber" style="font-size:32px">${kWarn}</div><div class="card-sub">programar ingreso</div></div>
    <div class="card"><div class="card-label">🔴 Urgente (+${urgenciaConfig.warnMax}d)</div><div class="card-value red" style="font-size:32px">${kAlert}</div><div class="card-sub">ingresar esta semana</div></div>
    <div class="card"><div class="card-label">Total registradas</div><div class="card-value" style="font-size:32px">${habitacionesData.length}</div><div class="card-sub">habitaciones con plantas</div></div>
    <div class="card"><div class="card-label">📊 Visitas este mes</div><div class="card-value" style="font-size:32px;color:var(--charcoal)">${totalMesHab}</div><div class="card-sub">${fmtMonth(CURR_MONTH)}</div></div>`;

  const tbody=document.getElementById('ctrl-hab-body');
  tbody.innerHTML='';
  let renderedAny=false;

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
      </td>
      <td>
        <span class="days-badge ${badge.cls}">${badge.label}</span>
        <div class="ctrl-bar"><div class="ctrl-bar-fill" style="width:${badge.bar}%;${badge.barCls}"></div></div>
      </td>
      <td>
        <span class="alerta-badge ${alCls}" style="font-size:11px;padding:3px 10px">${alLbl}</span>
      </td>
      <td style="text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:400;color:#1A1A1A">
        ${monthVisits}
      </td>
      <td>
        <div style="display:flex;gap:6px;align-items:center">
          <select id="hab-quien-${i}" class="cl-select" style="font-size:12px;padding:5px 8px;flex:1">
            <option value="">— Jardinero —</option>
            <option>Sole</option><option>Berni</option><option>Ivan</option>
          </select>
          <button class="mark-done-btn" onclick="markHabDone(${i},document.getElementById('hab-quien-${i}').value)">✓ Ingresé</button>
        </div>
      </td>
      <td style="vertical-align:middle">
        <input class="cl-obs-input" value="${esc(r.notas||'')}" placeholder="Observaciones..."
          onchange="habitacionesData[${i}].notas=this.value"
          style="width:100%;min-width:160px">
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
  r.quien = ''; r.notas = ''; r.canUndo = false;
  fbSave('habitacionesData', habitacionesData);
  fbSave('habitacionesLog', habitacionesLog);
  if(document.getElementById('page-hab-ops')?.classList.contains('active')) renderHabOps();
  if(document.getElementById('page-control-habitaciones')?.classList.contains('active')) renderCtrlHab();
}

function ctrlHabFilter(mode,btn){
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
            ${userRole!=='ventas' ? `<button class="btn-icon" style="color:var(--red-alert)" onclick="delRamo(${i})" title="Quitar">✕</button>` : ''}
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
  const reader = new FileReader();
  reader.onload = e => {
    ramo.foto = e.target.result;
    ramosDispData.push(ramo);
    fbSave('ramosDispData', ramosDispData);
    closeModal('ramo-modal');
    renderRamosDisp();
    showToast('💐 Ramo cargado');
  };
  reader.readAsDataURL(file);
}

function delRamo(i){
  if(!confirm('¿Quitar este ramo de disponibles? (no registra venta)')) return;
  ramosDispData.splice(i,1);
  fbSave('ramosDispData', ramosDispData);
  renderRamosDisp();
}

function openVentaRamo(i){
  const r = ramosDispData[i];
  if(!r) return;
  document.getElementById('ramo-sell-idx').value = i;
  document.getElementById('ramo-sell-info').innerHTML =
    `<strong>${esc(r.nombre)}</strong>${r.desc?` · ${esc(r.desc)}`:''}<br><span style="color:#7A7A72">Precio: ${esc(r.precio||'A consultar')}</span>`;
  document.getElementById('ramo-sell-cliente').value='';
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
    fecha: TODAY_ISO,
    dedicatoria: document.getElementById('ramo-sell-dedicatoria').value.trim(),
    precio: r.precio || '—',
    formaPago: document.getElementById('ramo-sell-pago').value,
    estado: 'confirmado',
    dir: document.getElementById('ramo-sell-dir').value.trim(),
    fromRamo: true
  });
  fbSave('ventasData', ventasData);
  // Quitar el ramo del catálogo (ya no está disponible)
  ramosDispData.splice(i,1);
  fbSave('ramosDispData', ramosDispData);
  closeModal('ramo-sell-modal');
  renderRamosDisp();
  showToast('✅ Venta registrada en Ventas Externas');
}

function vdAutoPrice(){
  const sel = document.getElementById('vd-prod');
  if(sel.value === '__otro__'){
    const custom = prompt('Nombre del arreglo o ramo:');
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
    fecha: TODAY_ISO,
    dedicatoria: document.getElementById('vd-dedicatoria')?.value || '',
    precio: document.getElementById('vd-precio')?.value || '—',
    formaPago: document.getElementById('vd-pago')?.value || '',
    estado: 'confirmado',
    dir: document.getElementById('vd-dir')?.value || '',
    fromVentaDirecta: true
  });
  fbSave('ventasData', ventasData);

  // Limpiar formulario
  ['vd-prod','vd-cliente','vd-pago','vd-precio','vd-dedicatoria','vd-dir'].forEach(id => {
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

// ── PEDIDOS DE HABITACIÓN ──────────────────────────────────────────────────────
let pedidosHabData = [];

function renderHomeHyatt(){
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

function enviarPedidoHab(){
  const tipo = document.getElementById('ph-tipo')?.value;
  if(!tipo){ showToast('⚠️ Seleccioná el tipo de arreglo'); return; }
  const cliente = document.getElementById('ph-cliente')?.value?.trim();
  if(!cliente){ showToast('⚠️ Ingresá el nombre del huésped'); return; }

  const tipoCustom = document.getElementById('ph-tipo-custom')?.value?.trim();
  const variante = document.getElementById('ph-variante')?.value || '';
  const tipoFinal = tipo === 'Otro' ? (tipoCustom || 'Arreglo especial') : tipo;
  const varianteLabel = variante.replace(/^(comp|lp):/,'');

  const pedido = {
    tipo: tipoFinal,
    variante: varianteLabel,
    qty: +document.getElementById('ph-qty')?.value || 1,
    cliente,
    habitacion: document.getElementById('ph-habitacion')?.value?.trim() || '—',
    tonalidad: document.getElementById('ph-tonalidad')?.value?.trim() || '',
    cuando: document.getElementById('ph-cuando')?.value || '',
    cobro: document.getElementById('ph-cobro')?.value || '',
    solicitante: document.getElementById('ph-solicitante')?.value?.trim() || '',
    obs: document.getElementById('ph-obs')?.value?.trim() || '',
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

  // ── AUTO: Registrar en Ventas Externas ──
  ventasData.push({
    prod: cardTitle,
    desc: cardDesc,
    cliente: cliente,
    fecha: TODAY_ISO,
    dedicatoria: pedido.obs || '',
    precio: '',
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

function renderPedidosHab(){
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

function delPedidoHab(i){
  if(!confirm('¿Eliminar este pedido?')) return;
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

    const itemsHtml = (search ? visible : cat.items).map((it, ii) => {
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

function lpDelItem(ci,ii){
  if(!confirm('¿Eliminar este ítem?')) return;
  listaPreciosData[ci].items.splice(ii,1);
  fbSave('listaPreciosData',listaPreciosData);
  renderListaPrecios();
}

function lpDelCat(ci){
  if(!confirm('¿Eliminar la categoría "'+listaPreciosData[ci].cat+'" y todos sus ítems?')) return;
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
  const overlay  = document.getElementById('sidebar-overlay');
  const btn      = document.getElementById('hamburger-btn');
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

// Close sidebar on nav item click (mobile)
document.querySelectorAll('.nav-item, .nav-sub-item').forEach(el => {
  el.addEventListener('click', () => {
    if(window.innerWidth <= 768) closeSidebar();
  });
});


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
  };
  const fns = [
    'renderChecklist','renderEventos','renderKanban','renderStock',
    'renderJardOps','renderHabOps','renderCtrlJard','renderCtrlHab',
    'renderCompras','renderRecetas','renderRamosDisp'
  ];
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
  // Expose render functions as simple references (no redefine needed, just alias)
  fns.forEach(fn => {
    try { if(!(fn in window)) window[fn] = eval(fn); } catch(e){}
  });
})();


// ── Roles de acceso ─────────────────────────────────────────────────────────
// 'operario' → solo ve Operaciones
// 'gerencia' → ve todo
let userRole = null;
let floristaNombre = null;
const FLORISTAS_LOGIN = {
  'caro':'Caro','clo':'Clo','cris':'Cris','gabi':'Gabi',
  'ivan':'Ivan','pao':'Pao','nora':'Nora'
};

function applyRole(role){
  userRole = role;
  // Marcar el body con la clase del rol — el CSS oculta .gerencia-only automáticamente
  document.body.classList.remove('role-gerencia','role-operario','role-jardinero','role-compras','role-ventas','role-florista','role-comercial');
  document.body.classList.add('role-' + role);

  // Ocultar botones productividad para no-gerencia
  const prodBtn = document.getElementById('prod-toggle-btn');
  if(prodBtn) prodBtn.style.display = role === 'gerencia' ? '' : 'none';
  const jopsProdBtn = document.getElementById('jops-prod-btn');
  if(jopsProdBtn) jopsProdBtn.style.display = role === 'gerencia' ? '' : 'none';

  // Para gerencia: sub-items visibles excepto los exclusivos de otros roles
  if(role === 'gerencia'){
    document.querySelectorAll('.nav-sub-item[data-group]').forEach(el => {
      if(!el.classList.contains('nav-floreria-only') && !el.classList.contains('nav-ventas-only'))
        el.style.display = '';
    });
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
          if(['Eventos / Maison','Stock Florería','Cotizador'].includes(t)){
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
    // Ocultar TODO el sidebar
    document.querySelectorAll('.nav-section-label, .nav-item, .nav-sub-item').forEach(el => {
      el.style.display = 'none';
    });
    // Operaciones: Checklist, Stock, Eventos/Maison, Recepción de Pedidos
    const OPS_ALLOW = ['Checklist Diaria','Stock Florería','Eventos / Maison','Cotizador','📦 Recepción de Pedidos'];
    document.querySelectorAll('.nav-section-label').forEach(label => {
      if(label.textContent.trim() === 'Operaciones'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          if(OPS_ALLOW.some(t => sib.textContent.trim() === t)) sib.style.display = '';
          sib = sib.nextElementSibling;
        }
      }
      // Comercial: Ramos Disponibles, Lista de Precios
      if(label.textContent.trim() === 'Comercial'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          const t = sib.textContent.trim();
          if(t === 'Lista de Precios' || t === 'Ramos Disponibles') sib.style.display = '';
          sib = sib.nextElementSibling;
        }
      }
    });
    // Mostrar headers de acordeón
    document.querySelector('[data-group-id="grp-ops"]').style.display = '';
    document.querySelector('[data-group-id="grp-com"]').style.display = '';
    // Ocultar quick-links
    document.querySelectorAll('.quick-link').forEach(ql => ql.style.display = 'none');
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
    // Mostrar bajo Comercial: las secciones permitidas
    document.querySelectorAll('.nav-section-label').forEach(label => {
      if(label.textContent.trim() === 'Comercial'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          const t = sib.textContent.trim();
          if(['Ventas Externas','Glosario & Muestrario','Lista de Precios','Ramos Disponibles'].includes(t) || sib.classList.contains('nav-floreria-only')){
            sib.style.display = '';
          }
          sib = sib.nextElementSibling;
        }
      }
    });
    // Ocultar quick-links
    document.querySelectorAll('.quick-link').forEach(ql => ql.style.display = 'none');
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
    // Navegar directo a Compras
    setTimeout(()=> navigate('compras'), 100);
  }

  if(role === 'jardinero'){
    // Ocultar TODO el sidebar excepto el ítem Tareas Jardinería
    document.querySelectorAll('.nav-section-label, .nav-item, .nav-sub-item').forEach(el => {
      el.style.display = 'none';
    });
    // Mostrar solo Operaciones > Tareas Jardinería + Control > Habitaciones con Plantas
    document.querySelectorAll('.nav-section-label').forEach(label => {
      const text = label.textContent.trim();
      if(text === 'Operaciones'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          const t = sib.textContent.trim();
          if(t === 'Tareas Jardinería' || t === 'Habitaciones con Plantas') sib.style.display = '';
          sib = sib.nextElementSibling;
        }
      }
      // Mostrar Control con Recordatorios para jardinero
      if(text === 'Control'){
        label.style.display = '';
        let sib = label.nextElementSibling;
        while(sib && !sib.classList.contains('nav-section-label')){
          // Mostrar el header del grupo grp-ctrl y el ítem Recordatorios Jardín
          if(sib.dataset?.groupId === 'grp-ctrl' || sib.textContent.trim() === 'Recordatorios Jardín'){
            sib.style.display = '';
          }
          sib = sib.nextElementSibling;
        }
        // Expandir el grupo ctrl para que se vean los sub-items
        setTimeout(() => navExpandGroup('grp-ctrl'), 50);
      }
    });
    // Quick links: solo mostrar Tareas Jardinería y Habitaciones con Plantas
    document.querySelectorAll('.quick-link').forEach(ql => {
      const title = ql.querySelector('.quick-link-title')?.textContent || '';
      if(!title.includes('Tareas Jardinería') && !title.includes('Habitaciones con Plantas')) ql.style.display = 'none';
    });
    // Navegar directo a tareas jardinería
    setTimeout(()=> navigate('jardineria-ops'), 100);
  }

  // Aplicar estado colapsado del acordeón según visibilidad de rol
  finalizeNavGroups();
  // Renderizar barra de navegación inferior mobile
  renderBottomNav(role);
}

// ══════════════════════════════════════════════════════════════════════════════
// HORARIOS Y PRODUCTIVIDAD
// ══════════════════════════════════════════════════════════════════════════════
let horariosData = {}; // { 'Caro': { '2026-06-15': {desde:'08:00',hasta:'13:00'}, ... } }
let horariosPlantilla = {}; // { 'Caro': { Lunes:{desde:'08:00',hasta:'13:00'}, ... } }
let horMes = new Date().getMonth();
let horAnio = new Date().getFullYear();
const DIAS_SEMANA_NAMES = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DIAS_SEMANA_SHORT = ['Lun','Mar','Mié','Jue','Vie','Sáb'];

function getFloristasActivos(){
  const nombres = [];
  Object.values(loginPasswords||{}).forEach(e => {
    if(e.role === 'florista' && e.floristaNombre) nombres.push(e.floristaNombre);
  });
  return nombres.sort((a,b) => a.localeCompare(b,'es'));
}

function calcHorasDia(desde, hasta){
  if(!desde || !hasta) return 0;
  const [h1,m1] = desde.split(':').map(Number);
  const [h2,m2] = hasta.split(':').map(Number);
  const diff = (h2*60+m2) - (h1*60+m1);
  return diff > 0 ? Math.round(diff/60*10)/10 : 0;
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
  const floristas = getFloristasActivos();
  if(!floristas.length){ container.innerHTML = '<div style="color:var(--mid-gray);padding:8px">No hay floristas.</div>'; return; }

  container.innerHTML = `<div class="table-wrapper"><table class="stock-table" style="font-size:12px">
    <thead><tr>
      <th style="min-width:90px">Florista</th>
      ${DIAS_SEMANA_SHORT.map(d => `<th style="text-align:center;min-width:130px">${d}</th>`).join('')}
    </tr></thead>
    <tbody>${floristas.map(nombre => {
      if(!horariosPlantilla[nombre]) horariosPlantilla[nombre] = {};
      return `<tr>
        <td style="font-weight:600">${esc(nombre)}</td>
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
  </table></div>
  <div style="font-size:11px;color:var(--mid-gray);margin-top:8px">💡 Completá los horarios base y tocá <strong>"Aplicar al mes"</strong> para rellenar todo el calendario de ${['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][horMes]}.</div>`;
}

function setPlantilla(nombre, dia, campo, val){
  if(!horariosPlantilla[nombre]) horariosPlantilla[nombre] = {};
  if(!horariosPlantilla[nombre][dia]) horariosPlantilla[nombre][dia] = {desde:'',hasta:''};
  horariosPlantilla[nombre][dia][campo] = val;
  fbSave('horariosPlantilla', horariosPlantilla);
  renderPlantilla();
}

function aplicarPlantillaAlMes(){
  const floristas = getFloristasActivos();
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
        if(!horariosData[nombre]) horariosData[nombre] = {};
        // Solo aplicar si el día NO tiene horario cargado ya (no pisar excepciones)
        if(!horariosData[nombre][iso] || (!horariosData[nombre][iso].desde && !horariosData[nombre][iso].hasta)){
          horariosData[nombre][iso] = {desde: plantilla.desde, hasta: plantilla.hasta};
          count++;
        }
      }
    });
  }

  fbSave('horariosData', horariosData);
  renderHorarios();
  showToast(`✅ Plantilla aplicada a ${meses[horMes]} · ${count} horarios cargados`);
}

function aplicarPlantillaForce(){
  // Versión que pisa todo (para usar con confirmación)
  const floristas = getFloristasActivos();
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
      if(!horariosData[nombre]) horariosData[nombre] = {};
      if(plantilla && plantilla.desde && plantilla.hasta){
        horariosData[nombre][iso] = {desde: plantilla.desde, hasta: plantilla.hasta};
        count++;
      } else {
        delete horariosData[nombre][iso];
      }
    });
  }
  fbSave('horariosData', horariosData);
  renderHorarios();
  showToast(`✅ Mes completo recargado con plantilla · ${count} horarios`);
}

function renderHorarios(){
  const cal = document.getElementById('hor-calendar');
  const sel = document.getElementById('hor-florista-sel');
  if(!cal) return;

  const floristas = getFloristasActivos();
  if(sel){
    const cur = sel.value;
    sel.innerHTML = '<option value="">— Todos —</option>' + floristas.map(n => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    sel.value = cur;
  }
  const filtro = sel?.value || '';
  const lista = filtro ? [filtro] : floristas;

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

    // Contar floristas con horario ese día
    let totalHs = 0;
    let asignados = 0;
    lista.forEach(n => {
      const h = horariosData[n]?.[iso];
      if(h && h.desde && h.hasta){
        totalHs += calcHorasDia(h.desde, h.hasta);
        asignados++;
      }
    });

    const bgColor = isToday ? '#EBF0E8' : isPast ? '#F8F7F5' : 'var(--warm-white)';
    const border = isToday ? '2px solid var(--green-ok)' : 'none';

    calHtml += `<div style="background:${bgColor};padding:6px;min-height:60px;cursor:pointer;border:${border}" onclick="openDiaHorario('${iso}')">
      <div style="font-size:12px;font-weight:${isToday?'700':'500'};color:${isToday?'var(--green-ok)':'#1A1A1A'};margin-bottom:3px">${d}</div>
      ${asignados > 0 ? `<div style="font-size:9px;color:var(--sage-dark);font-weight:600">${asignados} florista${asignados>1?'s':''}</div>
        <div style="font-size:9px;color:var(--mid-gray)">${totalHs}h total</div>` : ''}
    </div>`;
  }
  calHtml += '</div>';
  cal.innerHTML = calHtml;

  renderProductividadHorarios(lista);
}

function openDiaHorario(iso){
  const floristas = getFloristasActivos();
  const filtro = document.getElementById('hor-florista-sel')?.value;
  const lista = filtro ? [filtro] : floristas;
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
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:14px">Cargá las horas de cada florista para este día.</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${lista.map(nombre => {
        if(!horariosData[nombre]) horariosData[nombre] = {};
        const h = horariosData[nombre][iso] || {desde:'',hasta:''};
        const hs = calcHorasDia(h.desde, h.hasta);
        return `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--light-gray)">
          <strong style="flex:1;font-size:13px;color:#1A1A1A;min-width:80px">${esc(nombre)}</strong>
          <input type="time" value="${h.desde||''}" id="hor_${nombre}_${iso}_desde"
            style="width:90px;padding:4px 6px;border:1px solid var(--light-gray);border-radius:4px;font-size:12px;font-family:inherit">
          <span style="font-size:11px;color:var(--mid-gray)">→</span>
          <input type="time" value="${h.hasta||''}" id="hor_${nombre}_${iso}_hasta"
            style="width:90px;padding:4px 6px;border:1px solid var(--light-gray);border-radius:4px;font-size:12px;font-family:inherit">
          <span style="font-size:11px;color:var(--sage-dark);font-weight:600;min-width:30px">${hs > 0 ? hs+'h' : ''}</span>
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
  const floristas = getFloristasActivos();
  const filtro = document.getElementById('hor-florista-sel')?.value;
  const lista = filtro ? [filtro] : floristas;

  lista.forEach(nombre => {
    if(!horariosData[nombre]) horariosData[nombre] = {};
    const desde = document.getElementById('hor_'+nombre+'_'+iso+'_desde')?.value || '';
    const hasta = document.getElementById('hor_'+nombre+'_'+iso+'_hasta')?.value || '';
    if(desde && hasta){
      horariosData[nombre][iso] = {desde, hasta};
    } else {
      delete horariosData[nombre][iso];
    }
  });
  fbSave('horariosData', horariosData);
  document.getElementById('dia-horario-modal')?.classList.remove('open');
  renderHorarios();
  showToast('✅ Horarios guardados para ' + fmtDate(iso));
}

function limpiarDiaHorario(iso){
  const floristas = getFloristasActivos();
  floristas.forEach(nombre => {
    if(horariosData[nombre]) delete horariosData[nombre][iso];
  });
  fbSave('horariosData', horariosData);
  document.getElementById('dia-horario-modal')?.classList.remove('open');
  renderHorarios();
  showToast('🗑 Horarios del día limpiados');
}

function renderProductividadHorarios(floristas){
  const container = document.getElementById('hor-productividad');
  const labelEl = document.getElementById('hor-hoy-label');
  if(!container) return;
  if(labelEl) labelEl.textContent = currentDay + ' ' + fmtDate(TODAY_ISO);

  const dayState = clStateByDay[currentDay];

  container.innerHTML = floristas.map(nombre => {
    const hor = horariosData[nombre]?.[TODAY_ISO] || {};
    const hsProgramadas = calcHorasDia(hor.desde, hor.hasta);

    let minsTrabjados = 0;
    let tareasHechas = 0;
    let tareasAsignadas = 0;
    if(dayState){
      CL_TASKS.forEach((t,i) => {
        const resp = dayState.responsable?.[i] || '';
        if(resp !== nombre) return;
        tareasAsignadas++;
        const ini = dayState.inicio?.[i];
        const fin = dayState.fin?.[i];
        if(ini && fin){
          const [h1,m1] = ini.split(':').map(Number);
          const [h2,m2] = fin.split(':').map(Number);
          const diff = (h2*60+m2) - (h1*60+m1);
          if(diff > 0) minsTrabjados += diff;
        }
        const checked = Array.isArray(dayState.checked) ? dayState.checked[i] : (dayState.checked?.[i]);
        if(checked) tareasHechas++;
      });
    }
    // Sumar tiempo de eventos asignados al florista hoy
    eventosData.forEach(ev => {
      if(ev.asignado === nombre && ev.fecha === TODAY_ISO && ev.inicio && ev.fin){
        const [h1,m1] = ev.inicio.split(':').map(Number);
        const [h2,m2] = ev.fin.split(':').map(Number);
        const diff = (h2*60+m2) - (h1*60+m1);
        if(diff > 0){ minsTrabjados += diff; tareasHechas++; tareasAsignadas++; }
      } else if(ev.asignado === nombre && ev.fecha === TODAY_ISO){
        tareasAsignadas++;
      }
    });
    // Sumar tiempo de ventas asignadas al florista
    (ventasData||[]).forEach(v => {
      if(v.asignado === nombre && v.estado === 'pendiente' && v.inicio && v.fin){
        const [h1,m1] = v.inicio.split(':').map(Number);
        const [h2,m2] = v.fin.split(':').map(Number);
        const diff = (h2*60+m2) - (h1*60+m1);
        if(diff > 0){ minsTrabjados += diff; tareasHechas++; tareasAsignadas++; }
      } else if(v.asignado === nombre && v.estado === 'pendiente'){
        tareasAsignadas++;
      }
    });
    const hsTrabajadas = Math.round(minsTrabjados/60*10)/10;
    const diff = hsTrabajadas - hsProgramadas;
    const pct = hsProgramadas > 0 ? Math.round(hsTrabajadas/hsProgramadas*100) : 0;

    let statusColor, statusIcon, statusText;
    if(hsProgramadas === 0){
      statusColor = 'var(--mid-gray)'; statusIcon = '⬜'; statusText = 'No trabaja hoy';
    } else if(hsTrabajadas === 0){
      statusColor = 'var(--mid-gray)'; statusIcon = '⏳'; statusText = 'Sin actividad registrada';
    } else if(diff > 0.5){
      statusColor = 'var(--red-alert)'; statusIcon = '🔴'; statusText = `+${diff.toFixed(1)}h extra · revisar`;
    } else if(pct >= 80){
      statusColor = 'var(--green-ok)'; statusIcon = '✅'; statusText = 'Productividad OK';
    } else {
      statusColor = 'var(--amber)'; statusIcon = '🟡'; statusText = `${(hsProgramadas - hsTrabajadas).toFixed(1)}h disponibles`;
    }

    const barPct = Math.min(100, pct);
    const barColor = diff > 0.5 ? 'var(--red-alert)' : pct >= 80 ? 'var(--green-ok)' : 'var(--amber)';

    return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;padding:14px 16px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <div>
          <strong style="font-size:14px;color:#1A1A1A">${esc(nombre)}</strong>
          <span style="font-size:12px;color:var(--mid-gray);margin-left:8px">${tareasHechas}/${tareasAsignadas} tareas</span>
        </div>
        <span style="font-size:12px;font-weight:600;color:${statusColor}">${statusIcon} ${statusText}</span>
      </div>
      ${hsProgramadas > 0 ? `<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--mid-gray)">Programado</div>
          <div style="font-size:20px;font-weight:700;color:var(--charcoal)">${hsProgramadas}h</div>
          <div style="font-size:9px;color:var(--mid-gray)">${hor.desde||''} → ${hor.hasta||''}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:10px;color:var(--mid-gray)">Trabajado</div>
          <div style="font-size:20px;font-weight:700;color:${barColor}">${hsTrabajadas}h</div>
        </div>
        <div style="flex:1;min-width:120px">
          <div style="height:8px;background:#E5E3DC;border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${barPct}%;background:${barColor};border-radius:4px;transition:width .5s"></div>
          </div>
          <div style="font-size:10px;color:var(--mid-gray);margin-top:3px;text-align:right">${pct}%</div>
        </div>
      </div>` : ''}
    </div>`;
  }).join('');
}

// ── SISTEMA DE LOGIN CON CONTRASEÑAS EDITABLES ───────────────────────────────

// Inicio/Fin para eventos (se muestra en checklist y computa en productividad)
function renderEvHoraCell(evIdx, campo, ev){
  const val = ev[campo] || '';
  if(val){
    return `<span style="font-size:13px;font-weight:600;color:var(--green-ok)">${val}</span>`;
  }
  if(campo === 'inicio' || (campo === 'fin' && ev.inicio)){
    return `<button onclick="registrarHoraEvento(${evIdx},'${campo}')" style="background:${campo==='inicio'?'var(--green-ok)':'var(--amber)'};color:white;border:none;border-radius:4px;padding:4px 10px;font-size:11px;cursor:pointer;font-family:inherit">${campo==='inicio'?'▶ Inicio':'⏹ Fin'}</button>`;
  }
  return '<span style="color:var(--mid-gray);font-size:11px">—</span>';
}

function registrarHoraEvento(evIdx, campo){
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  eventosData[evIdx][campo] = hh+':'+mm;
  if(campo === 'fin'){
    eventosData[evIdx].estado = 'Pedidos Finalizados';
  }
  fbSave('eventosData', eventosData);
  renderChecklistTable();
  showToast(`${campo==='inicio'?'▶':'⏹'} ${campo} registrado para "${eventosData[evIdx].nombre}": ${hh}:${mm}`);
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
  renderChecklistTable();
  showToast(`${campo==='inicio'?'▶':'⏹'} ${campo} registrado para "${ventasData[vIdx].prod}": ${hh}:${mm}`);
}
const LOGIN_DEFAULTS = {
  'alvear':     { role:'gerencia',  label:'Gerencia' },
  'duhau':      { role:'operario',  label:'Operario General' },
  'jardineria': { role:'jardinero', label:'Jardinero' },
  'compras':    { role:'compras',   label:'Compras' },
  'hyatt':      { role:'ventas',    label:'Hyatt Ventas' },
  'caro':       { role:'florista',  label:'Caro',  floristaNombre:'Caro' },
  'clo':        { role:'florista',  label:'Clo',   floristaNombre:'Clo' },
  'cris':       { role:'florista',  label:'Cris',  floristaNombre:'Cris' },
  'gabi':       { role:'florista',  label:'Gabi',  floristaNombre:'Gabi' },
  'ivan':       { role:'florista',  label:'Ivan',  floristaNombre:'Ivan' },
  'pao':        { role:'florista',  label:'Pao',   floristaNombre:'Pao' },
  'nora':       { role:'florista',  label:'Nora',  floristaNombre:'Nora' },
  'euge':       { role:'comercial', label:'Euge' },
};
let loginPasswords = JSON.parse(JSON.stringify(LOGIN_DEFAULTS));
let currentLoginKey = null; // la contraseña con la que se logueó

function doLogin(){
  const val = document.getElementById('login-input').value.trim();
  const inp = document.getElementById('login-input');
  const err = document.getElementById('login-error');
  const key = val.toLowerCase();
  const entry = loginPasswords[key];
  if(entry){
    currentLoginKey = key;
    if(entry.floristaNombre) floristaNombre = entry.floristaNombre;
    applyRole(entry.role);
    const screen = document.getElementById('login-screen');
    screen.classList.add('hide');
    setTimeout(()=>screen.remove(), 520);
  } else {
    err.textContent = 'Contraseña incorrecta';
    inp.classList.add('error');
    setTimeout(()=>inp.classList.remove('error'), 400);
    inp.value = '';
    inp.focus();
  }
}

function cambiarContrasena(){
  const entry = loginPasswords[currentLoginKey];
  if(!entry){ showToast('⚠️ Error de sesión'); return; }
  const nueva = prompt('Ingresá tu nueva contraseña (mínimo 3 caracteres):');
  if(!nueva || nueva.trim().length < 3){ showToast('⚠️ La contraseña debe tener al menos 3 caracteres'); return; }
  const nuevoKey = nueva.trim().toLowerCase();
  if(nuevoKey === currentLoginKey){ showToast('Es la misma contraseña actual'); return; }
  if(loginPasswords[nuevoKey]){ showToast('⚠️ Esa contraseña ya está en uso por otro usuario'); return; }
  const confirmar = prompt('Confirmá la nueva contraseña:');
  if(!confirmar || confirmar.trim().toLowerCase() !== nuevoKey){ showToast('⚠️ Las contraseñas no coinciden'); return; }
  loginPasswords[nuevoKey] = {...entry};
  delete loginPasswords[currentLoginKey];
  currentLoginKey = nuevoKey;
  fbSave('loginPasswords', loginPasswords);
  showToast('✅ Contraseña cambiada. Ahora ingresás con: ' + nueva.trim());
}

function openGestionPasswords(){
  if(userRole !== 'gerencia'){ showToast('⛔ Solo gerencia'); return; }
  let ov = document.getElementById('gestion-passwords-modal');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'gestion-passwords-modal';
    ov.className = 'modal-overlay';
    document.body.appendChild(ov);
  }
  const entries = Object.entries(loginPasswords).sort((a,b) => {
    const order = {gerencia:0,operario:1,florista:2,jardinero:3,compras:4,ventas:5};
    return (order[a[1].role]||9) - (order[b[1].role]||9);
  });
  const roleLabels = {gerencia:'👔 Gerencia',operario:'🏠 Operario',florista:'💐 Florista',jardinero:'🌿 Jardinero',compras:'📦 Compras',ventas:'🏨 Hyatt Ventas'};

  ov.innerHTML = `<div class="modal" style="max-width:600px;max-height:85vh;overflow-y:auto">
    <button class="modal-close" onclick="document.getElementById('gestion-passwords-modal').classList.remove('open')">✕</button>
    <div class="modal-title">👥 Gestión de Usuarios y Contraseñas</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:16px">Podés ver, resetear o cambiar la contraseña de cualquier usuario.</div>
    <div style="display:flex;flex-direction:column;gap:1px;background:var(--light-gray);border-radius:8px;overflow:hidden">
      ${entries.map(([key, e]) => `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--warm-white)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:#1A1A1A">${esc(e.label || e.floristaNombre || key)}</div>
          <div style="font-size:11px;color:var(--mid-gray)">${roleLabels[e.role]||e.role}</div>
        </div>
        <div style="background:#F4F1EC;padding:4px 12px;border-radius:6px;font-family:monospace;font-size:13px;font-weight:600;color:#1A1A1A;min-width:80px;text-align:center">${esc(key)}</div>
        <button onclick="resetearPassword('${esc(key)}')" style="background:none;border:1px solid var(--light-gray);border-radius:6px;padding:5px 10px;font-size:11px;cursor:pointer;font-family:inherit;color:var(--charcoal);white-space:nowrap">✏️ Cambiar</button>
        ${e.role==='florista' ? `<button onclick="eliminarUsuario('${esc(key)}')" style="background:none;border:1px solid #E8CECE;border-radius:6px;padding:5px 8px;font-size:11px;cursor:pointer;font-family:inherit;color:var(--red-alert);white-space:nowrap">✕</button>` : ''}
      </div>`).join('')}
    </div>
    <div style="margin-top:16px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <button class="btn-add" onclick="agregarUsuarioFlorista()" style="font-size:12px;padding:8px 16px">+ Agregar florista</button>
      <button class="btn-secondary" onclick="resetearTodasPasswords()" style="font-size:11px;color:var(--red-alert)">🔄 Resetear todas a valores originales</button>
    </div>
  </div>`;
  ov.classList.add('open');
}

function agregarUsuarioFlorista(){
  if(userRole !== 'gerencia') return;
  const nombre = prompt('Nombre del/la florista (ej. María):');
  if(!nombre || !nombre.trim()) return;
  const nombreClean = nombre.trim();
  const passDefault = nombreClean.toLowerCase();
  const password = prompt('Contraseña para ' + nombreClean + ':', passDefault);
  if(!password || password.trim().length < 3){ showToast('⚠️ Mínimo 3 caracteres'); return; }
  const key = password.trim().toLowerCase();
  if(loginPasswords[key]){ showToast('⚠️ Esa contraseña ya está en uso'); return; }
  loginPasswords[key] = { role: 'florista', label: nombreClean, floristaNombre: nombreClean };
  fbSave('loginPasswords', loginPasswords);
  // Agregar a la lista de responsables del checklist
  if(!CL_RESP_OPTS.includes(nombreClean)){
    CL_RESP_OPTS.push(nombreClean);
    CL_RESP_OPTS.sort((a,b) => a.localeCompare(b,'es'));
  }
  showToast('✅ Florista ' + nombreClean + ' creado/a — contraseña: ' + password.trim());
  openGestionPasswords();
}

function resetearPassword(key){
  if(userRole !== 'gerencia') return;
  const entry = loginPasswords[key];
  if(!entry){ showToast('Usuario no encontrado'); return; }
  const nueva = prompt('Nueva contraseña para ' + (entry.label||key) + ':');
  if(!nueva || nueva.trim().length < 3){ showToast('⚠️ Mínimo 3 caracteres'); return; }
  const nuevoKey = nueva.trim().toLowerCase();
  if(nuevoKey !== key && loginPasswords[nuevoKey]){ showToast('⚠️ Esa contraseña ya está en uso'); return; }
  if(nuevoKey !== key){
    loginPasswords[nuevoKey] = {...entry};
    delete loginPasswords[key];
    if(key === currentLoginKey) currentLoginKey = nuevoKey;
  }
  fbSave('loginPasswords', loginPasswords);
  showToast('✅ Contraseña de ' + (entry.label||key) + ' cambiada a: ' + nueva.trim());
  openGestionPasswords(); // refrescar modal
}

function eliminarUsuario(key){
  if(userRole !== 'gerencia') return;
  const entry = loginPasswords[key];
  if(!entry) return;
  if(entry.role !== 'florista'){ showToast('⚠️ Solo se pueden eliminar usuarios floristas'); return; }
  if(!confirm('¿Eliminar al usuario ' + (entry.label||key) + '?\nYa no podrá ingresar al sistema.')) return;
  // Quitar de responsables
  const idx = CL_RESP_OPTS.indexOf(entry.floristaNombre);
  if(idx > -1) CL_RESP_OPTS.splice(idx, 1);
  delete loginPasswords[key];
  fbSave('loginPasswords', loginPasswords);
  showToast('🗑️ Usuario ' + (entry.label||key) + ' eliminado');
  openGestionPasswords();
}

function resetearTodasPasswords(){
  if(userRole !== 'gerencia') return;
  if(!confirm('¿Resetear TODAS las contraseñas a los valores originales?\n\nAlvear, Duhau, Caro, etc. volverán a ser las contraseñas.')) return;
  loginPasswords = JSON.parse(JSON.stringify(LOGIN_DEFAULTS));
  fbSave('loginPasswords', loginPasswords);
  showToast('🔄 Todas las contraseñas reseteadas a valores originales');
  openGestionPasswords();
}
// Focus input on load
window.addEventListener('load', ()=>{
  const inp = document.getElementById('login-input');
  if(inp) inp.focus();
});



// ════════════════════════════════════════
// DATA — SECCIONES DEL HOTEL (áreas de uso para pedidos)
// ════════════════════════════════════════
const HOTEL_SECCIONES = [
  'Lobby Alvear',
  'Lobby Posadas',
  'Salón privado + Biblioteca',
  'Mesada Piano + Recepción Alvear + Biblioteca',
  'Centros mesa P.N.',
  'Centros Mesa Duhau',
  'Habitaciones',
  'Copón Duhau',
  'Copón Duhau + Elefante',
  'Buffet Gioia + Copón Gioia + Recep. Posadas + Mesita Posadas + F. Posadas + M.R',
  'Árboles Gioia',
  'Centros de mesa Gioia',
  'Bertone',
  'Florería',
  'Eventos'
];

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
  if(!nombre){ alert('Ingresá el nombre del insumo.'); return; }
  addInsumoToBase(nombre);
  if(input) input.value='';
  renderInsumosGrid();
}

function agregarPedidoRapido(){
  const checks = document.querySelectorAll('.insumo-check:checked');
  if(checks.length===0){ alert('Seleccioná al menos un insumo.'); return; }
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
            <span style="background:#F0EEE8;border-radius:4px;padding:2px 8px;font-size:12px;font-weight:600">${ing.qty} ud${ing.qty>1?'s':''}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');
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
  const nombreSel = document.getElementById('rec-nombre');
  const nombreCustom = document.getElementById('rec-nombre-custom');

  // Custom nombre toggle
  nombreSel.onchange = ()=>{
    nombreCustom.style.display = nombreSel.value==='custom' ? 'block' : 'none';
  };

  if(!isNew){
    const r = recetasData[i];
    if(ARREGLOS_BASE.includes(r.nombre)) nombreSel.value = r.nombre;
    else { nombreSel.value='custom'; nombreCustom.style.display='block'; nombreCustom.value=r.nombre; }
    ingsList.innerHTML = r.ings.map((ing,ii)=>recetaIngRowHTML(ing.prod, ing.qty, ii)).join('');
  } else {
    nombreSel.value = 'Bochita';
    nombreCustom.style.display='none'; nombreCustom.value='';
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
  const opts = getAllInsumos().map(n=>`<option value="${esc(n)}"${n===prod?' selected':''}>${esc(n)}</option>`).join('');
  return `<div class="ev-arreglo-row" id="rec-ing-${ii}">
    <select style="flex:2;border:1px solid #E4E2DC;border-radius:4px;padding:5px 8px;font-family:'DM Sans',sans-serif;font-size:12.5px;outline:none">
      <option value="">— Flor / Follaje —</option>${opts}
    </select>
    <input type="number" min="1" value="${qty||1}" placeholder="Cant." style="width:60px;border:1px solid #E4E2DC;border-radius:4px;padding:5px 6px;font-size:12.5px;text-align:center;outline:none;font-family:'DM Sans',sans-serif">
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
  const nombreSel = document.getElementById('rec-nombre').value;
  const nombre = nombreSel==='custom'
    ? document.getElementById('rec-nombre-custom').value.trim()
    : nombreSel;
  if(!nombre){ alert('Ingresá el nombre del arreglo.'); return; }

  const rows = document.getElementById('rec-ings-list').querySelectorAll('.ev-arreglo-row');
  const ings = [];
  rows.forEach(row=>{
    const sel = row.querySelector('select');
    const inp = row.querySelector('input[type=number]');
    if(sel?.value) ings.push({ prod: sel.value, qty: +inp?.value||1 });
  });
  if(ings.length===0){ alert('Agregá al menos un ingrediente.'); return; }

  const idx = +document.getElementById('rec-idx').value;
  const receta = { nombre, ings, img: document.getElementById('rec-img-data').value||'' };
  if(idx===-1) recetasData.push(receta);
  else recetasData[idx] = receta;
  closeModal('receta-modal');
  fbSave('recetasData', recetasData);
  renderRecetas();
}

function delReceta(i){
  if(!confirm('¿Eliminar esta receta?')) return;
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

function addEvArregloRow(){
  const list = document.getElementById('ev-arreglos-list');
  const idx = evArreglosRows.length;
  evArreglosRows.push({arreglo:'', qty:1});
  const arregloOpts = [...recetasData.map(r=>r.nombre), ...ARREGLOS_BASE.filter(a=>!recetasData.find(r=>r.nombre===a))]
    .filter((v,i,a)=>a.indexOf(v)===i)
    .map(n=>`<option value="${esc(n)}">${arregloEmoji(n)} ${esc(n)}</option>`).join('');

  const div = document.createElement('div');
  div.className = 'ev-arreglo-row';
  div.id = 'ev-arr-row-'+idx;
  div.innerHTML = `
    <select onchange="evArreglosRows[${idx}].arreglo=this.value;previewStockImpact()" style="flex:2;border:1px solid #E4E2DC;border-radius:4px;padding:5px 8px;font-family:'DM Sans',sans-serif;font-size:12.5px;outline:none">
      <option value="">— Tipo de arreglo —</option>${arregloOpts}
    </select>
    <span style="font-size:12px;color:var(--mid-gray)">×</span>
    <input type="number" min="1" value="1" placeholder="Cant." onchange="evArreglosRows[${idx}].qty=+this.value;previewStockImpact()" style="width:60px;border:1px solid #E4E2DC;border-radius:4px;padding:5px 6px;font-size:12.5px;text-align:center;outline:none;font-family:'DM Sans',sans-serif">
    <button type="button" class="btn-icon" style="color:var(--red-alert)" onclick="document.getElementById('ev-arr-row-${idx}').remove();evArreglosRows[${idx}]={arreglo:'',qty:0};previewStockImpact()">✕</button>`;
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
    'Confirmado': 'background:#E8F5E9;color:#2E7D32',
    'Pedidos Finalizados':      'background:#F3E5F5;color:#6A1B9A',
  };
  const estadoEl = document.getElementById('evento-detail-estado');
  estadoEl.textContent = ev.estado || '';
  estadoEl.style.cssText = (estadoColors[ev.estado]||'background:#eee;color:#666') + ';padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.5px';

  // Body grid fields
  const fields = [
    ev.fecha ? ['Fecha', fmtDate(ev.fecha) + (ev.hora ? ' · ' + ev.hora : '')] : null,
    evZonasLabel(ev) !== '—' ? ['Salón / Zona', evZonasLabel(ev)] : null,
    ev.pax   ? ['Pax', ev.pax + ' personas'] : null,
    ev.precio && ev.precio !== 'A confirmar' ? ['Precio', ev.precio] : null,
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

  // Edit button
  document.getElementById('evento-detail-edit-btn').onclick = () => {
    closeModal('evento-detail-modal');
    openEventModal(i);
  };

  document.getElementById('evento-detail-modal').classList.add('open');
}

function saveEvent(){
  const nombre=document.getElementById('ev-nombre').value.trim();
  if(!nombre) return;
  const ev={
    nombre,
    tipo:document.getElementById('ev-tipo').value||'Social',
    fecha:document.getElementById('ev-fecha').value,
    hora:document.getElementById('ev-hora').value||'',
    zonas: [...evZonasSelected],
    salon: evZonasSelected.join(', '),
    pax:+document.getElementById('ev-pax').value||0,
    notas:document.getElementById('ev-notas').value,
    precio:document.getElementById('ev-precio').value||'A confirmar',
    estado:document.getElementById('ev-estado').value,
    asignado:document.getElementById('ev-asignado').value||'',
    arreglos: evArreglosRows.filter(r=>r.arreglo&&r.qty>0),
    img: document.getElementById('ev-img-data').value||'',
    inicio: eventosData[+document.getElementById('ev-idx').value]?.inicio || '',
    fin: eventosData[+document.getElementById('ev-idx').value]?.fin || ''
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
  if(idx===-1) eventosData.push(ev);
  else eventosData[idx]=ev;

  closeModal('event-modal');
  fbSave('eventosData', eventosData);
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
  document.getElementById('ev-tipo').value    = ev.tipo    || '';
  document.getElementById('ev-fecha').value   = ev.fecha   || '';
  document.getElementById('ev-hora').value    = ev.hora    || '';
  document.getElementById('ev-pax').value     = ev.pax     || '';
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

  // Poblar selector de floristas
  const asigSel = document.getElementById('ev-asignado');
  if(asigSel){
    const floristas = typeof getFloristasActivos === 'function' ? getFloristasActivos() : CL_RESP_OPTS.filter(n=>n!=='Jardineria');
    asigSel.innerHTML = '<option value="">— Sin asignar —</option>' + floristas.map(n => `<option value="${esc(n)}"${n===(ev.asignado||'')?' selected':''}>${esc(n)}</option>`).join('');
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
  const arregloOpts = [...recetasData.map(r=>r.nombre), ...ARREGLOS_BASE.filter(a=>!recetasData.find(r=>r.nombre===a))]
    .filter((v,i,a)=>a.indexOf(v)===i)
    .map(n=>`<option value="${esc(n)}"${n===arreglo?' selected':''}>${arregloEmoji(n)} ${esc(n)}</option>`).join('');
  const div = document.createElement('div');
  div.className='ev-arreglo-row'; div.id='ev-arr-row-'+idx;
  div.innerHTML=`
    <select onchange="evArreglosRows[${idx}].arreglo=this.value;previewStockImpact()" style="flex:2;border:1px solid #E4E2DC;border-radius:4px;padding:5px 8px;font-family:'DM Sans',sans-serif;font-size:12.5px;outline:none">
      <option value="">— Tipo de arreglo —</option>${arregloOpts}
    </select>
    <span style="font-size:12px;color:var(--mid-gray)">×</span>
    <input type="number" min="1" value="${qty}" onchange="evArreglosRows[${idx}].qty=+this.value;previewStockImpact()" style="width:60px;border:1px solid #E4E2DC;border-radius:4px;padding:5px 6px;font-size:12.5px;text-align:center;outline:none;font-family:'DM Sans',sans-serif">
    <button type="button" class="btn-icon" style="color:var(--red-alert)" onclick="document.getElementById('ev-arr-row-${idx}').remove();evArreglosRows[${idx}]={arreglo:'',qty:0};previewStockImpact()">✕</button>`;
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
    if(!byWho[who]) byWho[who] = { tareas: 0, conHorario: 0, minutos: 0, detalle: [] };
    byWho[who].tareas++;
    if(r.inicio && r.fin){
      const dur = calcDuracion(r.inicio, r.fin);
      if(dur){
        byWho[who].conHorario++;
        byWho[who].minutos += dur;
        byWho[who].detalle.push({ zona: r.zona, actividad: r.actividad, inicio: r.inicio, fin: r.fin, dur, day: r.day, date: r.date });
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
              </tr></thead>
              <tbody>
                ${d.detalle.map(t=>`<tr style="border-bottom:1px solid var(--light-gray)">
                  <td style="padding:6px 10px;color:var(--mid-gray)">${esc(t.day)}</td>
                  <td style="padding:6px 10px;font-weight:500">${esc(t.zona)}</td>
                  <td style="padding:6px 10px"><span class="badge ${getBadge(t.actividad)}">${esc(t.actividad)}</span></td>
                  <td style="padding:6px 10px;text-align:center;font-weight:600">${t.inicio}</td>
                  <td style="padding:6px 10px;text-align:center;font-weight:600">${t.fin}</td>
                  <td style="padding:6px 10px;text-align:center">${durBadge(t.inicio,t.fin)}</td>
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


// Renombrar función duplicada

Object.assign(window, {
  _downloadCSV, addCajaMovimiento, addCompra, addEvArregloRow, addEvArregloRowWithData,
  addGlosario, addInsumoToBase, addLpCat, addPhotos, addProveedor, addRecetaIngRow,
  addReglaTipo, addSale, addTipoEvento, adjustStock, agregarNuevoInsumo, agregarPedidoRapido,
  agregarUsuarioFlorista, aplicarPlantillaAlMes, aplicarPlantillaForce, applyCompraFilter,
  applyRole, arregloEmoji, calcCostoComposicion, calcDuracion, calcHorasDia, calcStockImpact,
  calcularArreglosEvento, cambiarContrasena, changeEventoEstado, clearCompraExtraFilters,
  clearCompraFilter, clearEventImg, clearRecetaImg, closeModal, closeSidebar, confirmResetWeek,
  confirmVentaRamo, copiarBloquePedido, copiarCotEvento, copiarCotizacion, copiarCotizacionEvento,
  copiarCotizacionOps, copiarUltimoPedido, cotAgregar, cotAgregarComposicionOps, cotAgregarLP,
  cotAgregarOpsStock, cotGuardarMargen, cotGuardarPrecio, cotRemove, cotRemoveOps, cotUpdateQty,
  cotUpdateQtyOps, ctrlHabFilter, ctrlJardFilter, daysSince, delC, delCaja, delGlosario,
  delPedidoHab, delProveedor, delRamo, delReceta, delReglaTipo, delStock, delTipoEvento,
  delVenta, deleteEvento, descontarStockEvento, deselectAllInsumos, doLogin, durBadge,
  eliminarUsuario, ensureKanbanCols, enviarCotizacionEvento, enviarPedidoHab, esc,
  estaEditando, evAgregarComposicion, evAgregarFlor, evZonasLabel, exportCtrlCSV, exportHabCSV,
  exportMesHab, exportMesJard, fbSave, filterByStatus, filterStock, fmtDate, fmtDateTime,
  fmtDur, fmtMonth, generarTextoCotEvento, gerenciaSetFecha, getAlerta, getAllInsumos,
  getAllMonths, getArr, getBadge, getDaysBadge, getFloristasActivos, getISOWeekKey,
  getMonthLabel, getMonthVisits, getOrCreateDayState, getProvOpts, getSectionEmoji,
  getSectionPillCls, getStockBadge, getStockComprometido, getStockEnPedido, getTbody,
  getWeekLabel, guardarDiaHorario, habsHoraCell, habsRegistrarHora, habsResetHora,
  hopsVisita, horNavMes, initChecklist, initCotizadorEventosHyatt, initCtrlHab, initCtrlJard,
  jopsDone, jopsHoraCell, jopsRegistrarHora, jopsResetHora, jopsUpdHora, limpiarCarrito,
  limpiarCarritoOps, limpiarDiaHorario, loadWeekState, lpAddPhotos, lpDelCat, lpDelItem,
  lpOpenViewer, lpRemovePhoto, lpUpdItem, markHabDone, markJardDone, marcarRecordatorioHecho, navToggleGroup, navExpandGroup, navCollapseGroup, finalizeNavGroups, navigate, openRecordatorioModal, renderBottomNav, renderRecordatoriosJard, saveRecordatorio, deleteRecordatorio, updateBottomNav, openCajaModal,
  openDiaHorario, openEditSaleModal, openEventModal, openEventoDetail, openGestionPasswords,
  openGlosarioModal, openLpCatModal, openLpModal, openPhotoViewer, openRamoModal, openRamoPhoto,
  openRecetaModal, openSaleModal, openSidebar, openTaskModal, openVentaRamo, parseMoney,
  populateFloreriaFormHelpers, populatePHSubSelector, populateProvSelects, populateSaleSelects,
  previewEventImg, previewGlFoto, previewRecetaImg, previewStockImpact, ramoOnCatChange,
  ramoOnProdChange, recalcTotalEvento, recepCheckAll, recepConfirmar, recepConfirmarTodo,
  recepToggle, recepUncheckAll, recepUpdPaq, recepUpdVaras, recepUpdateGlobal, recetaIngRowHTML,
  registrarHora, registrarHoraEvento, registrarHoraVenta, registrarVentaDirecta, removeKanbanCard,
  removePhoto, renderCaja, renderCarrito, renderCarritoOps, renderChecklistTable,
  renderComposicionesCot, renderCompraAlert, renderCompraSummary, renderCompras, renderCotEventos,
  renderCotizador, renderCotizadorOps, renderCtrlHab, renderCtrlJard, renderEvCarrito,
  renderEvHoraCell, renderEvTipos, renderEventos, renderGlosario, renderHabLog, renderHabOps,
  renderHabReporte, renderHistorialCompras, renderHistorialEventos, renderHistoryPanel, renderHome,
  renderHomeHyatt, renderHoraCell, renderHorarios, renderInsumosGrid, renderJardLog, renderJardOps,
  renderJardReporte, renderJordProd, renderKanban, renderLPenCotizador, renderListaPrecios,
  renderPedidosHab, renderPeriodTabs, renderPlantilla, renderPreciosList, renderProductividad,
  renderProductividadHorarios, renderProvTags, renderRamosDisp, renderRecepcionPedidos,
  renderRecetas, renderStock, renderStockAdmin, renderVentaHoraCell, renderVentas, renderZonasPicker,
  resetHora, resetWeekState, resetearPassword, resetearTodasPasswords, saleAutoFillPrice,
  saveEvent, saveInsumosCustom, saveKanbanTask, saveLpItem, saveRamo, saveReceta, saveUrgenciaConfig,
  saveWeekState, setCotTab, setHabReporteMes, setHopsFilter, setJardReporteMes, setJopsFilter,
  setPlantilla, setStock, setStockMax, setStockMin, setUrgenciaPreset, showAlertaHorario,
  showToast, syncEventosToKanban, toggleCtrlSection, toggleEvZona, toggleHistorialCompras,
  toggleHistory, toggleInsumosGrid, toggleJordProd, togglePlantilla, toggleProductividad,
  toggleProvManager, toggleSidebar, toggleTask, updC, updCL, updCaja, updCajaMonto, updCajaTipo,
  updGlosario, updPedidoHabEstado, updTipoEvento, updV, updateInsumoCount, updateInsumoRow,
  updateKpiCompras, urgenciaPanelHTML, vdAutoPrice, zonaHoraBtn, zonaResetHora, zonaSetHora,
});
