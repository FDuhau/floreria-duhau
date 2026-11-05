// ── ESTADOS DE CARGA Y VACÍOS ───────────────────────────────────────────────
// 1) Mientras no llegaron de la base los datos que usa la página abierta, se
//    muestra "Cargando…" encima del contenido, en vez de una pantalla en blanco
//    o vacía que parece que "no hay nada" (como pasó con la caja).
// 2) Si una tabla queda sin filas, se muestra un mensaje en vez de un hueco.

// Datos principales de cada página (los que, si no llegaron, la dejan vacía).
const DATOS_DE_PAGINA = {
  'checklist': ['checklist', 'checklistTareas'],
  'tareas-gerencia': ['tareasGerencia'],
  'eventos-comercial': ['eventosData'], 'eventos-maison': ['eventosData'], 'historial-eventos': ['eventosData'],
  'rentabilidad-eventos': ['eventosData'], 'compra-evento': ['eventosData'], 'eventos-sin-floreria': ['eventosSinFloreria'],
  'jardineria-ops': ['jardineriaData'], 'control-jardineria': ['jardineriaData'],
  'hab-ops': ['habitacionesData'], 'control-habitaciones': ['habitacionesData'],
  'recordatorios-jardineria': ['jardRecordatorios'], 'stock-jardineria': ['jardStockPlantas'],
  'ventas-externas': ['ventasData'], 'pedidos-habitacion': ['pedidosHabData'], 'crm-clientes': ['clientesData'],
  'cotizador': ['cotizadorPrecios'], 'cotizador-ops': ['cotizadorPrecios'], 'presupuestos': ['presupuestosData'],
  'lista-precios': ['listaPreciosData'], 'ramos-disponibles': ['ramosDispData'], 'recetas-arreglos': ['recetasData'],
  'galeria': ['galeriaData'], 'flores-temporada': ['floresTemporada'],
  'stock': ['stockData'], 'stock-admin': ['stockData'], 'inventario': ['inventarioData'], 'floreros': ['florerosData'], 'velas': ['velasData'],
  'compras-floreria': ['comprasFlore'], 'compras-jardineria': ['comprasJard'], 'recepcion-pedidos': ['comprasFlore'],
  'proveedores': ['proveedoresList'],
  'legajo': ['legajoData'], 'control-horarios': ['horariosData'], 'evaluaciones': ['evaluacionesData'], 'liquidacion': ['liquidacionConfig'],
  'caja': ['cajaData'], 'cierre-dia': ['cajaData', 'cierresCaja'], 'cierre-mensual': ['cierresMensualesData'],
  'reportes-ventas': ['ventasData'],
};
const DEMORA_MS = 12000;   // pasado este tiempo, avisar que tarda más de lo normal

const llegados = {};
let inicio = Date.now();
let paginaVista = null;   // la demora se cuenta desde que se abrió la página
let timer = null;

window._fbLlego = path => {
  if(llegados[path]) return;
  llegados[path] = true;
  programar();
};

function paginaActiva(){ return document.querySelector('.content.active'); }

function actualizarCarga(){
  const pg = paginaActiva();
  document.querySelectorAll('.content.fd-cargando').forEach(el => { if(el !== pg) quitarCarga(el); });
  if(!pg) return;
  if(pg.id !== paginaVista){ paginaVista = pg.id; inicio = Date.now(); }
  const claves = DATOS_DE_PAGINA[pg.id.replace(/^page-/, '')] || [];
  const faltan = claves.filter(k => !llegados[k]);
  if(!faltan.length || !window.fbSet){ quitarCarga(pg); return; }   // sin Firebase (pruebas): no bloquear
  let box = pg.querySelector(':scope > .fd-loader');
  if(!box){
    box = document.createElement('div');
    box.className = 'fd-loader';
    box.setAttribute('role', 'status');
    box.innerHTML = '<span class="fd-spinner" aria-hidden="true"></span><span class="fd-loader-txt">Cargando datos…</span>';
    const tabs = pg.querySelector(':scope > .section-tabs');
    if(tabs) tabs.after(box); else pg.prepend(box);
    pg.classList.add('fd-cargando');
  }
  const lento = Date.now() - inicio > DEMORA_MS;
  box.classList.toggle('lento', lento);
  box.querySelector('.fd-loader-txt').textContent = lento
    ? 'Esto está tardando más de lo normal. Revisá la conexión a internet; la información aparece apenas llegue.'
    : 'Cargando datos…';
  if(!lento){ clearTimeout(timer); timer = setTimeout(actualizarCarga, DEMORA_MS - (Date.now() - inicio) + 50); }
}
function quitarCarga(pg){
  pg.classList.remove('fd-cargando');
  pg.querySelector(':scope > .fd-loader')?.remove();
}

// Tablas sin filas → mensaje. Se quita solo cuando la tabla vuelve a tener filas.
function actualizarVacios(){
  const pg = paginaActiva();
  if(!pg || pg.classList.contains('fd-cargando')) return;
  pg.querySelectorAll('tbody').forEach(tb => {
    const propio = tb.querySelector(':scope > tr.fd-empty-row');
    const filas = tb.children.length - (propio ? 1 : 0);
    if(filas > 0){ propio?.remove(); return; }
    if(propio || !tb.offsetParent) return;
    const cols = tb.closest('table')?.querySelector('thead tr')?.children.length || 1;
    const tr = document.createElement('tr');
    tr.className = 'fd-empty-row';
    tr.innerHTML = `<td colspan="${cols}">No hay registros para mostrar.</td>`;
    tb.appendChild(tr);
  });
}

let pendiente = false;
function programar(){
  if(pendiente) return;
  pendiente = true;
  setTimeout(() => { pendiente = false; actualizarCarga(); actualizarVacios(); }, 0);
}

function iniciar(){
  // Cambio de página (clase .active) o contenido re-renderizado
  new MutationObserver(muts => {
    if(muts.some(m => !(m.target.classList?.contains('fd-loader')) && !(m.target.closest?.('.fd-empty-row')))) programar();
  }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
  programar();
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
else iniciar();
