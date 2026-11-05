import { esc, parseMoney, fmtDate, fmtDateTime } from './utils.js';
import { icon } from './iconos.js';
import { abrirDocumento, fmtPesos, kv } from './documento-marca.js';
import { configurarCaja, addCajaMovimiento, cajaData, cerrarCajaDia, cierresCajaData, delCaja, openCajaModal, renderCaja, renderCierreCajaHistorial, restaurarCajaArchivo, restaurarCajaDesdeResguardo, toggleCajaHistorial, toggleCajaMes, toggleCierreDetalle, updCaja, updCajaMonto, updCajaTipo } from './caja.js';
import { configurarVentas, addSale, comprobanteVenta, comprobanteVentaDesdeModal, delVenta, delVentaDesdeModal, openEditSaleModal, openSaleModal, populateSaleSelects, renderVentas, saleAutoFillPrice, sincronizarVentaCaja, updV, ventasCierreCopiar, ventasCierreMes, ventasClearFilters, ventasData, ventasShowMore } from './ventas.js';
import { configurarCompras, _compraImporte, abrirPedidoAuto, addCompra, addProveedor, applyCompraFilter, ceAddRow, ceCopiar, ceLoadEvento, ceRemoveRow, ceReset, ceSet, cevAdd, cevRemove, cevSet, cfImportCancel, cfImportConfirm, cfImportFile, cfImportParseSheet, clearCompraExtraFilters, clearCompraFilter, copiarBloquePedido, copiarUltimoPedido, delC, delProveedor, evImportConfirm, evImportFile, evImportToggle, exportarPedidoXLSX, gastoComprasEvento, genEventoId, generarPedidoAuto, getAreaUsoOpts, getAreaUsoZonas, getArr, getStockBadge, getTbody, guardarCompraEventos, openCompraEventos, paSetAreaDia, paSetDia, paToggleArea, paToggleEvento, populateFloreriaFormHelpers, populateProvSelects, renderCompraAlert, renderCompraEvento, renderCompraSummary, renderCompras, renderHistorialCompras, renderPeriodTabs, renderProvTags, setCompraEvento, toggleAnularCompra, toggleHistPedido, toggleHistorialCompras, toggleProvManager, updC, updHistCantCompra, updHistCostoCompra, updateKpiCompras } from './compras.js';
import { configurarEventos, ESTADO_COLORS, _saveEventos, addEvArregloRow, addEvArregloRowWithData, calcStockImpact, changeEventoEstado, clearEventImg, deleteEvento, descontarStockEvento, evRemoveArregloRow, evSetArreglo, evSetArregloQty, evZonasLabel, exportHistorialEventosXLSX, histEventoSetPrecio, histEventoSetTarifa, histTarifaAdd, histTarifaDel, histTarifaSet, mostrarEventosDelDia, openEventModal, openEventoDetail, previewEventImg, previewStockImpact, renderEventos, renderHistorialEventos, renderZonasPicker, replicarEvento, saveEvent, toggleEvZona } from './eventos.js';
import { configurarCotizador, _ingVaras, _varasPorPaqResuelto, addReglaTipo, addTipoEvento, calcCostoComposicion, copiarCotEvento, copiarCotizacion, copiarCotizacionOps, cotAgregar, cotAgregarComposicionOps, cotAgregarLP, cotAgregarOpsStock, cotCurTab, cotGuardarMargen, cotGuardarPrecio, cotRemove, cotRemoveOps, cotUpdateQty, cotUpdateQtyOps, cotVerTodas, cotizadorConfig, cotizadorPrecioVara, cotizadorPrecios, delReglaTipo, delTipoEvento, evAgregarComposicion, evAgregarFlor, eventoPricing, limpiarCarrito, limpiarCarritoOps, renderCarrito, renderCarritoOps, renderComposicionesCot, renderCotEventos, renderCotizador, renderCotizadorOps, renderEvCarrito, renderEvTipos, renderLPenCotizador, renderPreciosList, resolveCotizadorPrecio, setCotCurTab, setCotTab, updTipoEvento } from './cotizador.js';
import { configurarStock, _stockFilasDe, _stockIngresar, _stockNombre, addInvItem, adjustStock, aplicarSugerenciaStock, calcStockMinInteligente, delInvItem, delStock, filterByStatus, filterStock, getAlerta, getStockComprometido, getStockEnPedido, guardarStockManual, invAdjust, openAddStockModal, renderInventario, renderStock, renderStockAdmin, renderStockSugerencias, setStock, setStockMax, setStockMin, setStockSort, updInv, vaciarStock } from './stock.js';
import { configurarPersonal, _faltasDe, _legDetIdx, agregarFalta, eliminarEvaluacion, eliminarFalta, eliminarLegajo, evaluacionesData, exportLiquidacion, guardarEvaluacion, guardarLegajo, legEliminarDoc, legSubirDoc, legTipoOnChange, legVerDoc, legajoData, liqNombreCalendario, liquidacionConfig, openEvaluacionModal, openLegajoModal, renderEvaluaciones, renderFaltas, renderLegajo, renderLiquidacion, saveLiquidacionHoras, toggleFaltaJustificada, verDetalleLegajo } from './personal.js';
import { configurarKanban, KANBAN_DEFAULTS, ensureKanbanCols, guardarTareaGerencia, moveKanbanCard, openTareaGerencia, openTaskModal, removeKanbanCard, renderKanban, renderTareasGerencia, saveKanbanTask, syncEventosToKanban, tareasGerencia, tgDelete, tgMove, tgMoveTo } from './kanban.js';
import { configurarChecklist, CL_RESP_OPTS, CL_TASKS, _normName, _zonaKey, aplicarPlantillaSemana, calcDuracion, checkRecordatoriosFaseEvento, clAddSeccion, clAddZona, clDeleteZona, clFotoPreview, clMoveZona, clRenameSeccion, clRenameZona, clSetFiltro, clState, clTiemposRef, confirmResetWeek, currentDay, durBadge, eventoFase, eventoFlorFase, faseVisibleFlorista, fmtDur, getBadge, getISOWeekKey, getOrCreateDayState, getTiempoRef, guardarFotoChecklist, initChecklist, loadWeekState, mapUltimoNuevoPorZona, openGaleriaNuevos, openGestionZonas, openPromediosZona, openTiemposEstimados, openVistaSemanal, podarHistorial, registrarHora, renderChecklistTable, renderGaleriaNuevos, renderHistoryPanel, renderHoraCell, resetDayState, resetHora, resetWeekState, saveWeekState, showAlertaHorario, toggleHistory, toggleTask, ultimoNuevoZona, updActividad, updCL, updTiempoRef, verFotoChecklist, vsSetResp, vsToggleActividad } from './checklist.js';
import { configurarRecepcion, _recepFlagBadge, _recepFlagStyle, _subirCompraAlStock, recepCheckAll, recepConfirmar, recepConfirmarTodo, recepFotoInput, recepQuitarFoto, recepSubirStockTodo, recepToggle, recepToggleMal, recepUncheckAll, recepUpdObs, recepUpdPaq, recepUpdVaras, recepUpdateGlobal, recepVolverAControl, recibirPedidoCompleto, recibirRenglonCompra, renderRecepcionPedidos, toggleRecepAgrupado, verFotoRecep } from './recepcion.js';
import { configurarPresupuestos, cambiarEstadoPres, cpAddArr, cpAddFree, cpGuardar, cpRemoveArr, cpRemoveFree, cpReset, cpSetArr, cpSetFree, cvAdd, cvCargarListado, cvCopiar, cvFijarVarasPorPaq, cvRemove, cvReset, cvSet, cvTCargar, cvTLimpiar, cvTSetProd, eliminarPresupuesto, enviarPresupuestoWhatsApp, guardarPresupuesto, openPresupuestoModal, presupuestosData, renderCostoVaras, renderCotizarPresupuesto, renderPresupuestos, verPresupuesto } from './presupuestos.js';
import { badgeCategoriaVara } from './categoria-vara.js';
import { configurarComposiciones, _fmtCant, _fmtIngUnidad, addRecetaIngRow, arregloEmoji, clearRecetaImg, compHotelAdd, compTab, delArregloComposicion, delReceta, openRecetaModal, previewRecetaImg, recetaIngRowHTML, renderComposicionesHotel, renderRecetas, saveReceta, seedComposicionesBase, seedComposicionesHotelBase, setCompTab } from './composiciones.js';
import { configurarPedidosRamos, eliminarEsf, eventosSinFloreria, exportEsfReclamo, guardarEsf, initRamosToggle, notificarAsignacion, notificarVentaNueva, openEsfModal, openVentaDetail, ramosView, renderEventosSinFloreria, setRamosView } from './pedidos-ramos.js';
import { configurarCierreMensual, _xlsxDownload, applyCompraFiltersExtToArr, cierresMensualesData, exportCierrePDF, exportLegajoXLSX, exportVentasXLSX, generarCierreMensual, renderCierreMensual, verCierreMensual } from './cierre-mensual.js';
import { configurarHorarios, DIAS_SEMANA_NAMES, aplicarPlantillaAlMes, aplicarPlantillaForce, calcHorasDia, copiarDetalleFichajes, getEmpleadosActivos, getFloristasActivos, guardarDiaHorario, horNavMes, horariosAddPersona, horariosAddPersonaFromSel, horariosPlantilla, horariosRemovePersona, isJardinero, jornadaRealDia, limpiarDiaHorario, openDiaHorario, renderHorarios, renderPlantilla, renderProductividadHorarios, setPlantilla, togglePlantilla } from './horarios.js';
import { _evStripAcc, _evParseEvents, _evToEvento } from './daily-import.js';
import { confirmModal, alertModal, promptModal } from './modales.js';
import './lista-precios-css.js';
import { openGlobalSearch, closeGlobalSearch, handleSearchKey, runGlobalSearch, _gsearchGo } from './busqueda-global.js';
import { renderProveedores, openProveedorModal, guardarProveedor, eliminarProveedor } from './proveedores.js';
import { renderClientes, abrirFichaCliente, openNuevoClienteModal, editarCliente, guardarCliente, eliminarCliente, getClientesData } from './crm-clientes.js';
import { installPWA } from './pwa.js';
import { toggleSidebar, openSidebar, closeSidebar } from './sidebar.js';
import { configurarFotosRamo, abrirFotoRamo, elegirFotoRamo, eliminarFotoRamo, compartirFotoRamo, ofrecerFotoRamo, limpiarFotosRamoVencidas } from './fotos-ramo.js';
import { pedidosHabData, configurarPedidosHab, renderHomeHyatt, renderPedidosHab, enviarPedidoHab, updPedidoHabEstado, delPedidoHab, phAddItemRow, phSetItemTipo, phSetItemQty, phRemoveItemRow } from './pedidos-habitacion.js';
import { alertasAutomaticas } from './alertas-automaticas.js';
import { configurarCotizadorEventos, initCotizadorEventosHyatt, calcularArreglosEvento, recalcTotalEvento, generarTextoCotEvento, enviarCotizacionEvento, copiarCotizacionEvento } from './cotizador-eventos.js';
import { openZonasEventoModal, guardarZonasEvento } from './zonas-evento.js';
import { configurarCalendario, getEventosView, initEventosToggle, renderCalendario, calPrevMonth, calNextMonth } from './calendario.js';
import { configurarCostoHotel, renderCostoHotel, exportCostoHotel } from './costo-hotel.js';
import { PAGE_LABELS, JARDINERIA_BASE, HABITACIONES_BASE } from './datos-base.js';
import { renderBottomNav, updateBottomNav, irAAtajoInicial } from './nav-inferior.js';
import { renderSidebarNav, marcarNavegacion } from './navegacion.js';
import { toggleUserMenu, closeUserMenu, setUserMenuInfo } from './menu-usuario.js';
import { listaPreciosData, renderListaPrecios, lpUpdItem, lpDelItem, lpDelCat, openLpModal, saveLpItem, openLpCatModal, addLpCat, lpAddPhotos, lpRemovePhoto, lpOpenViewer } from './lista-precios.js';
import { leerFotoComprimida, comprimirImagen } from './imagenes.js';
import { toggleCfSplit, cfSplitAddRow, cfSplitRemoveRow, cfSplitUpdRow } from './compras-reparto.js';
import { openPushNotifModal, enviarPushNotif, initPushForUser, activarNotificaciones } from './notificaciones-push.js';
import { renderVelas, openVelaModal, guardarVela, delVela, velaAjustar, velaFotoPreview, cambiarFotoVela, openVelaFoto, getVelasData } from './stock-velas.js';
import { generarPresupuestoPDF } from './presupuesto-pdf.js';
import { checkOnboarding, nextOnboardingStep, finishOnboarding } from './onboarding.js';
import { showToast, toggleDarkMode, initDarkMode, exportPDF } from './tema-toast.js';
import { _fotosParaGuardar, resolverFoto, migrarFotos, fotosActivo } from './fotos.js';
import { configurarUnificarArticulos, renderUnificarArticulos, uaAgregarManual, uaDeshacer, uaMarcar, uaSet, uaUnir, uaVolverABuscar } from './unificar-articulos.js';
import { aplicarAliasANodo, listaSinRepetidos, mismoArticulo, nombreArticulo, setArticulosAlias, setArticulosConocidos } from './articulos-base.js';

// ════════════════════════════════════════
// CONTROL DE VERSIÓN — auto-limpieza de datos locales viejos
// Subí este número cada vez que cambies el formato de datos.
// Cuando un dispositivo detecta una versión distinta a la guardada,
// limpia el localStorage viejo UNA sola vez y recarga. Sin borrar caché a mano.
// ════════════════════════════════════════
const APP_VERSION = '2026-08-12-a';
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
// Nodos que solo gerencia descarga (ver fbStartSensibles). Si la copia local
// todavía no llegó de la base, guardarla pisaría el nodo entero con lo poco
// que haya en memoria: por eso se bloquea la escritura hasta que cargue.
const NODOS_SENSIBLES = ['cajaData','cierresCaja','cierresMensualesData','legajoData','faltasData','evaluacionesData','liquidacionConfig'];
function sensibleCargado(key){ return !!window._fbCargado?.[key]; }
const NODOS_CON_ARTICULOS = ['comprasFlore','comprasJard','stockData','recetasData','arreglosComposicion','presupuestosData','insumosCustom','cotizadorPrecios'];
function fbSave(key, data){
  // Artículos ya unificados: lo que se haya escrito con una forma vieja
  // ("naviza", "Astromelia") se guarda con el nombre que quedó.
  if(NODOS_CON_ARTICULOS.includes(key)) aplicarAliasANodo(key, data);
  if(NODOS_SENSIBLES.includes(key) && !sensibleCargado(key)){
    console.warn('fbSave bloqueado: '+key+' todavía no se cargó desde la base');
    showToast('Todavía no cargaron los datos de '+(key==='cajaData'?'la caja':key)+'. Esperá unos segundos y probá de nuevo.','error');
    return;
  }
  if(window.fbSet){
    const plain = _fotosParaGuardar(key, JSON.parse(JSON.stringify(data)));
    // Solo viaja lo que cambió (ver fbSaveSmart en firebase/index.js)
    if(window.fbSaveSmart) window.fbSaveSmart(key, plain); else window.fbSet(key, plain);
    _auditarGuardado(key);
    if(key === 'cajaData') window._maybeSnapshotCajaSafe?.();
  }
}
// Auditoría automática (excluir los propios logs y datos de sesión)
function _auditarGuardado(key){
  const AUDIT_SKIP = ['auditLog','pushTokens','pushBroadcast','loginPasswords','loginAuth','pushSubs'];
  if(!AUDIT_SKIP.includes(key) && window.currentUserLabel && window.fbSet){
    const entry = {
      ts: Date.now(),
      iso: new Date().toISOString(),
      user: window.currentUserLabel,
      key
    };
    window.fbSet('auditLog/' + entry.ts, entry);
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
document.getElementById('hero-date').textContent = DATE_STR;

// Tema guardado — el atributo se aplica inmediatamente; el botón se actualiza tras DOMContentLoaded
(()=>{
  const saved = localStorage.getItem('fd-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  const updateBtn = () => {
    const btn = document.getElementById('theme-toggle-btn');
    if(btn) btn.textContent = saved === 'dark' ? '' : '';
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

// fmtDate / fmtDateTime → src/modules/utils.js
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
  return `<span style="${colores[t]};font-size:12px;font-weight:700;letter-spacing:.6px;padding:2px 7px;border-radius:5px;margin-left:6px;vertical-align:middle;white-space:nowrap">${t}</span>`;
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
// esc / parseMoney → src/modules/utils.js


function navigate(pageId, navEl){
  updateBottomNav(pageId);
  // Redirigir home según rol
  if(pageId === 'home' && userRole === 'ventas') pageId = 'home-hyatt';
  // Compras tiene acceso SOLO a Costo del Hotel dentro de Reportes: si intenta
  // abrir el hub de Reportes o cualquier otro reporte, se lo lleva a ese.
  if(userRole === 'compras' && ['reportes','reportes-equipo','cierre-dia','reportes-ventas'].includes(pageId)) pageId = 'reportes-hotel';
  // Las antiguas páginas "índice" (grillas de accesos que repetían el menú)
  // ya no se usan: se redirige a la primera sección real de cada área.
  const HUBS = { operaciones:'checklist', comercial:'ventas-externas', control:'control-jardineria', compras:'compras-floreria', reportes:'reportes-ventas' };
  if(HUBS[pageId]) pageId = userRole === 'compras' && pageId === 'reportes' ? 'reportes-hotel' : HUBS[pageId];
  closeUserMenu();
  document.querySelectorAll('.content').forEach(p=>p.classList.remove('active'));
  const pg = document.getElementById('page-'+pageId);
  if(pg) pg.classList.add('active');
  const nav = marcarNavegacion(pageId);
  document.getElementById('breadcrumb').innerHTML = nav
    ? (nav.pagina ? '<em class="bc-fam">'+esc(nav.familia)+'</em><span class="bc-sep"> › </span><span>'+esc(nav.pagina)+'</span>' : '<span>'+esc(nav.familia)+'</span>')
    : '<span>'+esc(PAGE_LABELS[pageId]||pageId)+'</span>';
  if(navEl && !navEl.closest('#sidebar-nav')) navEl.classList.add('active');
  window.scrollTo?.(0, 0);

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
  if(pageId==='eventos-comercial'){ initEventosToggle(); if(getEventosView()==='calendario') renderCalendario(); else renderEventos(); }
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
  if(pageId==='stock-jardineria') renderStockJard();
  if(pageId==='jardineria-ops') renderJardOps();
  if(pageId==='hab-ops') renderHabOps();
  if(pageId==='recepcion-pedidos') renderRecepcionPedidos();
  if(pageId==='control-habitaciones') renderCtrlHab();
  if(pageId==='reportes-equipo') renderReportesEquipo();
  if(pageId==='cierre-dia') initCierreDia();
  if(pageId==='reportes-ventas') renderReportesVentas();
  if(pageId==='reportes-hotel') renderCostoHotel();
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
  if(pageId==='costo-varas') renderCostoVaras();
  if(pageId==='unificar-articulos') renderUnificarArticulos();
  if(pageId==='cierre-mensual'){ const sel=document.getElementById('cierre-mes-sel'); if(sel&&!sel.value) sel.value=CURR_MONTH; renderCierreMensual(); }
  if(pageId==='tareas-gerencia') renderTareasGerencia();

  // En mobile, cerrar el sidebar automáticamente al navegar — salvo si el ítem
  // es un encabezado de grupo (acordeón): esos solo despliegan sus áreas y el
  // sidebar queda abierto para que el usuario elija una.
  if(window.innerWidth <= 768 && !navEl?.classList?.contains('nav-group-hdr')) closeSidebar();
}

function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.querySelectorAll('.modal-overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');}));

// confirmModal / alertModal / promptModal → src/modules/modales.js




// Unified checklist state — same tasks all days
// clState: { checked[], actividad[], obs[], tiempo[], responsable[] }
let clStateByDay = {}; // estado independiente por día



// Cargar semana guardada al iniciar
(function(){
  const saved = loadWeekState();
  if(saved) clStateByDay = saved;
})();

let checklistHistory = [];
// clStateByDay y checklistHistory quedan en app.js (los reasigna Firebase); checklist.js usa estos setters.
function _setClStateByDay(v){ clStateByDay = v; }
function _setChecklistHistory(v){ checklistHistory = v; }
configurarChecklist({ get DIAS_SEMANA_NAMES(){ return DIAS_SEMANA_NAMES; }, TODAY_DAY, TODAY_ISO, _btnGuiaArreglo, _setChecklistHistory, _setClStateByDay, addDaysISO, badgeDiaRelativa, get checklistHistory(){ return checklistHistory; }, get clStateByDay(){ return clStateByDay; }, closeModal, get eventosData(){ return eventosData; }, fbSave, get floristaNombre(){ return floristaNombre; }, getWeekLabel, notificarAsignacion, openVentaDetail, renderEvHoraCell, renderFlorTurnoCard, renderLlamadosChecklist, renderProductividadCL, renderVentaHoraCell, get userRole(){ return userRole; } });


let stockData = [];
configurarStock({ closeModal, get comprasFlore(){ return comprasFlore; }, get comprasJard(){ return comprasJard; }, estaEditando, get eventosData(){ return eventosData; }, fbSave, get stockData(){ return stockData; } });
configurarRecepcion({ get comprasFlore(){ return comprasFlore; }, fbSave, get stockData(){ return stockData; } });
configurarPresupuestos({ TODAY_ISO, arregloEmoji, closeModal, get comprasFlore(){ return comprasFlore; }, fbSave, navigate, get recetasData(){ return recetasData; }, get stockData(){ return stockData; } });
configurarComposiciones({ get _arreglosComposicionLoaded(){ return _arreglosComposicionLoaded; }, _marcarArreglosComposicionCargado, _saveArreglosComposicion, get arreglosComposicion(){ return arreglosComposicion; }, calcCostoArreglo, closeModal, fbSave, getAllInsumos, openArregloComposicion, get recetasData(){ return recetasData; }, renderRentabilidadHotel, get userRole(){ return userRole; } });
configurarPedidosRamos({ TODAY_ISO, closeModal, fbSave, getFloristasActivos, getSucursalId, get recetasData(){ return recetasData; }, renderRamosDisp, get userRole(){ return userRole; } });
configurarCierreMensual({ CURR_MONTH, TODAY_ISO, get compraFilterExt(){ return compraFilterExt; }, get comprasFlore(){ return comprasFlore; }, get comprasJard(){ return comprasJard; }, get eventosData(){ return eventosData; }, fbSave, fmtMonth });
configurarHorarios({ get JARDINEROS_LIST(){ return JARDINEROS_LIST; }, TODAY_DAY, TODAY_ISO, get clStateByDay(){ return clStateByDay; }, get eventosData(){ return eventosData; }, fbSave, get loginAuth(){ return loginAuth; }, get loginPasswords(){ return loginPasswords; } });
configurarPersonal({ TODAY_ISO, _empleadosLegajoOpts, _mismoNombre, _nombreAppLegajo, calcHorasDia, closeModal, fbSave, getEmpleadosActivos, initPerfPanel, jornadaRealDia, renderLlamadosEval, renderPerfEmpleado });


let kanbanData = JSON.parse(JSON.stringify(KANBAN_DEFAULTS));
// kanbanData queda en app.js (lo reasigna Firebase); kanban.js lo reemplaza con _setKanbanData.
function _setKanbanData(v){ kanbanData = v; }
configurarKanban({ TODAY_ISO, _setKanbanData, closeModal, estaEditando, get eventosData(){ return eventosData; }, fbSave, get kanbanData(){ return kanbanData; }, renderHome });


// ════════════════════════════════════════
// DATA — PROVEEDORES
// ════════════════════════════════════════
let proveedoresList = [
  'Agro Insumos','Cooperativa Flores','Mercado Central','Vivero Norte','Vivero Palermo'
];
function getProvOpts(selected=''){
  return proveedoresList.map(p=>`<option value="${p}"${p===selected?' selected':''}>${p}</option>`).join('');
}

let comprasFlore = [];
let comprasJard = [];
configurarCompras({ CL_TASKS, TODAY_ISO, _recepFlagBadge, _recepFlagStyle, _saveEventos, _stockIngresar, _stockNombre, _subirCompraAlStock, _xlsxDownload, applyCompraFiltersExtToArr, arregloEmoji, get arreglosComposicion(){ return arreglosComposicion; }, calcStockImpact, closeModal, get comprasFlore(){ return comprasFlore; }, get comprasJard(){ return comprasJard; }, get cotizadorPrecios(){ return cotizadorPrecios; }, get eventosData(){ return eventosData; }, fbSave, getAlerta, getMonthLabel, getProvOpts, getSucursalId, get insumosBDBase(){ return insumosBDBase; }, get insumosCustom(){ return insumosCustom; }, get kanbanData(){ return kanbanData; }, get proveedoresList(){ return proveedoresList; }, get recetasData(){ return recetasData; }, renderCompraFiltersPanel, renderEventos, renderHome, renderRecepcionPedidos, renderRentabilidad, renderStock, get stockData(){ return stockData; }, syncEventosToKanban });


// eventosData queda en app.js (lo reasignan Firebase y el sync); eventos.js lo cambia por acá.
function _setEventosData(v){ eventosData = v; }

let eventosData = [];
configurarEventos({ get CL_RESP_OPTS(){ return CL_RESP_OPTS; }, TODAY_ISO, _auditarGuardado, _setEventosData, _stockFilasDe, _stockNombre, _xlsxDownload, arregloEmoji, badgeDiaRelativa, calcCostoComposicion, closeModal, etiquetaDiaRelativa, get eventoPricing(){ return eventoPricing; }, get eventosData(){ return eventosData; }, fbSave, get floristaNombre(){ return floristaNombre; }, fmtMonth, getFloristasActivos, get kanbanData(){ return kanbanData; }, notificarAsignacion, get recetasData(){ return recetasData; }, renderHome, renderKanban, renderStock, syncEventosToKanban, get userRole(){ return userRole; } });
configurarCotizador({ _fmtCant, arregloEmoji, fbSave, get recetasData(){ return recetasData; }, get stockData(){ return stockData; } });
configurarUnificarArticulos({ get _arreglosComposicionLoaded(){ return _arreglosComposicionLoaded; }, _saveArreglosComposicion, get arreglosComposicion(){ return arreglosComposicion; }, get comprasFlore(){ return comprasFlore; }, get comprasJard(){ return comprasJard; }, fbSave, fotosParaGuardar: _fotosParaGuardar, get insumosCustom(){ return insumosCustom; }, get recetasData(){ return recetasData; }, saveInsumosCustom, get stockData(){ return stockData; }, get userRole(){ return userRole; } });


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
      <div class="home-card-title">Mi turno hoy</div>
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
        <span>Productividad del Equipo</span>
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

    // Arreglos de florería HECHOS ese día — se leen del historial (checklistHistory),
    // que guarda who + date + tiempo. Antes se leía clStateByDay[fecha], pero ese
    // objeto está indexado por día de la semana (Lunes/Martes…), no por fecha, así
    // que nunca traía nada. El historial funciona para hoy y para fechas pasadas.
    const checklist = (checklistHistory||[])
      .filter(e => _mismoNombre(e.who, nombre) && String(e.date||'').slice(0,10) === fecha)
      .map(e => ({ zona: e.zona||'', sec: e.sec||'', actividad: e.actividad||'', obs: e.obs||'',
                   dur: (parseInt(e.duracion)||0) || calcDuracion(e.inicio||'', e.fin||'') || 0, done: true }));
    const tareasHechas = checklist.length;
    const tareasTotal  = checklist.length;

    // Tareas de jardinería del día (log)
    const jardineria = esJard
      ? (window.jardineriaLog||[]).filter(e=>e.fecha===fecha && _mismoNombre(e.quien, nombre))
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
  window.pushSend?.('Cierre del día', `${nPers} persona${nPers!==1?'s':''} asistieron hoy · mirá el detalle en Reportes › Cierre del Día`, 'cierre-dia', 'roles:gerencia');
  if(document.getElementById('page-cierre-dia')?.classList.contains('active')) renderCierreDia();
}

function initCierreDia(){
  const inp = document.getElementById('cd-fecha');
  if(inp && !inp.value) inp.value = TODAY_ISO;
  renderCierreDia();
  cdPersonaRango(_cdPersonaRango || 'dia'); // resalta el botón de rango activo
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
      <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-top:2px">${lbl}</div></div>`;
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
      <div style="font-size:40px;margin-bottom:10px"></div>
      <div style="font-size:15px;font-weight:600;color:var(--mid-gray)">Sin asistencia registrada para el ${fmtDate(fecha)}</div>
      <div style="font-size:13px;margin-top:6px">Aparecerá el detalle cuando el equipo fiche su turno o tenga tareas/eventos asignados.</div></div>`;
    return;
  }

  const genLbl = data.generadoTs ? `<div style="font-size:12px;color:var(--mid-gray);margin-bottom:14px">Generado ${new Date(data.generadoTs).toLocaleString('es-AR')}${resumenesDiarios[fecha]?.generadoTs===data.generadoTs?' · snapshot guardado':' · vista en vivo'}</div>` : '';

  cont.innerHTML = genLbl + data.personas.map(p=>{
    const turnoStr = p.desde ? `${p.desde}${p.hasta?' – '+p.hasta:' (en curso)'}` : 'Sin turno fichado';
    const horasStr = p.horasMin ? ` · ${fmtMin(p.horasMin)}` : '';
    const asistTag = p.ficho
      ? '<span style="font-size:12px;font-weight:700;background:var(--ok-soft);color:var(--green-ok);padding:2px 8px;border-radius:5px">✓ Fichó</span>'
      : '<span style="font-size:12px;font-weight:700;background:var(--amber-soft);color:#B4772A;padding:2px 8px;border-radius:5px">Planificado</span>';

    const checklistHtml = p.checklist.length
      ? `<div style="margin-top:10px"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">Checklist · ${p.tareasHechas}/${p.tareasTotal}</div>
          ${p.checklist.map(t=>`<div style="font-size:12.5px;padding:3px 0;color:${t.done?'var(--charcoal)':'#B4772A'}">${t.done?'✓':'○'} <strong>${esc(t.zona||t.sec)}</strong>${t.actividad?' · '+esc(t.actividad):''}${t.dur?` <span style="color:var(--mid-gray)">· ${fmtDur(t.dur)}</span>`:''}${t.obs?` <span style="color:var(--mid-gray)">— ${esc(t.obs)}</span>`:''}</div>`).join('')}</div>`
      : '';

    const jardHtml = p.jardineria.length
      ? `<div style="margin-top:10px"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">Jardinería</div>
          ${p.jardineria.map(t=>`<div style="font-size:12.5px;padding:3px 0;color:${t.done?'var(--charcoal)':'#B4772A'}">${t.done?'✓':'○'} ${esc(t.task||'Tarea')}${(t.horaInicio||t.horaFin)?` <span style="color:var(--mid-gray)">(${esc(t.horaInicio||'—')}${t.horaFin?' – '+esc(t.horaFin):''})</span>`:''}${t.obs?` — ${esc(t.obs)}`:''}</div>`).join('')}</div>`
      : '';

    const eventosHtml = p.eventos.length
      ? `<div style="margin-top:10px"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">Eventos</div>
          ${p.eventos.map(e=>`<div style="font-size:12.5px;padding:3px 0"><strong>${esc(e.nombre)}</strong> <span style="color:var(--mid-gray)">· ${e.roles.join(', ')}</span></div>`).join('')}</div>`
      : '';

    const ventasHtml = p.ventas.length
      ? `<div style="margin-top:10px"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">Ventas</div>
          ${p.ventas.map(v=>`<div style="font-size:12.5px;padding:3px 0">${esc(v.prod)}${v.cliente?' · '+esc(v.cliente):''} <span style="color:var(--mid-gray)">(${esc(v.estado)})</span></div>`).join('')}</div>`
      : '';

    const nada = !checklistHtml && !jardHtml && !eventosHtml && !ventasHtml
      ? '<div style="font-size:12.5px;color:var(--mid-gray);margin-top:8px">Sin tareas ni eventos registrados para el día.</div>' : '';

    return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:12px;padding:16px 18px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <strong style="font-size:15px;color:var(--charcoal)">${esc(p.nombre)}</strong>
          <span style="font-size:12px;color:var(--mid-gray)">${esc(p.area)}</span>
          ${asistTag}
        </div>
        <div style="font-size:12.5px;color:var(--mid-gray)">${icon('clock')}${turnoStr}${horasStr}</div>
      </div>
      ${checklistHtml}${jardHtml}${eventosHtml}${ventasHtml}${nada}
    </div>`;
  }).join('') + (data.ausentes.length
    ? `<div style="margin-top:8px;font-size:12.5px;color:var(--mid-gray)"><strong>Sin registro hoy:</strong> ${data.ausentes.map(esc).join(', ')}</div>`
    : '');

  // Panel de métricas por persona (día/semana/mes)
  const selP = document.getElementById('cd-persona');
  if(selP){
    const prev = selP.value;
    const empleados = (typeof getEmpleadosActivos==='function' ? getEmpleadosActivos() : []);
    selP.innerHTML = '<option value="">— Seleccionar persona —</option>' + empleados.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
    if(prev) selP.value = prev;
  }
  renderCdPersona();
}

// Rango del panel por persona del Cierre del Día: 'dia' | 'semana' | 'mes'.
let _cdPersonaRango = 'dia';
function cdPersonaRango(kind){
  _cdPersonaRango = kind;
  ['dia','semana','mes'].forEach(k=>{
    const b = document.getElementById('cd-rango-'+k);
    if(b){ b.style.background = k===kind ? 'var(--charcoal)' : ''; b.style.color = k===kind ? '#fff' : ''; }
  });
  renderCdPersona();
}

function renderCdPersona(){
  const body = document.getElementById('cd-persona-body');
  if(!body) return;
  const nombre = document.getElementById('cd-persona')?.value || '';
  const fechaBase = document.getElementById('cd-fecha')?.value || TODAY_ISO;
  const lblEl = document.getElementById('cd-persona-rango');
  if(!nombre){
    body.innerHTML = '<div style="padding:20px;text-align:center;color:var(--mid-gray);font-size:13px">Elegí una persona para ver sus métricas.</div>';
    if(lblEl) lblEl.textContent = '';
    return;
  }
  let desde, hasta;
  if(_cdPersonaRango==='semana'){ const r = _rangoSemana(new Date(fechaBase)); desde = r.desde; hasta = r.hasta; }
  else if(_cdPersonaRango==='mes'){ desde = fechaBase.slice(0,7)+'-01'; const [y,mo]=fechaBase.split('-').map(Number); hasta = `${y}-${String(mo).padStart(2,'0')}-${String(new Date(y,mo,0).getDate()).padStart(2,'0')}`; }
  else { desde = fechaBase; hasta = fechaBase; }
  if(lblEl) lblEl.textContent = `Período: ${fmtDate(desde)}${desde!==hasta?' – '+fmtDate(hasta):''}`;
  const m = _metricasEmpleadoPeriodo(nombre, desde, hasta);
  if(!m.total.n){
    body.innerHTML = `<div style="padding:20px;text-align:center;color:var(--mid-gray);font-size:13px">Sin tareas registradas para ${esc(nombre)} en este rango.</div>`;
    return;
  }
  body.innerHTML = _metricasHTML(m);
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
      <div class="card-label">Progreso del checklist</div>
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
      <div class="card-label">Ventas acumuladas del mes</div>
      <svg viewBox="0 0 ${W} ${H}" class="hv-spark" preserveAspectRatio="none" aria-hidden="true">
        <polygon points="${areaPts}" fill="var(--sage)" opacity="0.14"/>
        <polyline points="${pts}" fill="none" stroke="var(--sage)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      </svg>
      <div class="hv-sub">${fmtARS(totalMes)} al día ${diaHoy}</div>
    </div>
    <div class="card hv-card card-clickable" onclick="navigate('checklist')">
      <div class="card-label">Arreglos Nuevos por zona</div>
      <div class="hv-semaforo">
        <span class="hv-sem hv-sem-rojo">${rojo}<small>+7 días<br>o sin registro</small></span>
        <span class="hv-sem hv-sem-ambar">${ambar}<small>5-6<br>días</small></span>
        <span class="hv-sem hv-sem-verde">${verde}<small>al<br>día</small></span>
      </div>
      <div class="hv-sub">${peoresTxt ? '' + peoresTxt : '✓ Todas las zonas al día'}</div>
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
        <div class="card-label">Eventos Hoy</div>
        <div class="card-value${eventosHoy.length ? '' : ' neutral'}">${eventosHoy.length}</div>
        <div class="card-sub">${eventosHoy.length === 1 ? '1 evento programado' : eventosHoy.length + ' eventos programados'}</div>
      </div>
      <div class="card card-clickable" onclick="navigate('eventos-maison')">
        <div class="card-label">Eventos Activos</div>
        <div class="card-value">${activos.length}</div>
        <div class="card-sub">sin finalizar</div>
      </div>
      ${!isFlorHome ? `<div class="card card-clickable" onclick="navigate('ventas-externas')">
        <div class="card-label">Ventas del Mes</div>
        <div class="card-value" style="font-size:22px">${fmtARS(totalMes)}</div>
        <div class="card-sub">${ventasMes.length} transacciones</div>
      </div>` : ''}
      <div class="card card-clickable" onclick="navigate('checklist')">
        <div class="card-label">Checklist Hoy</div>
        <div class="card-value${pct===100?' green':''}">${hechas}<span style="font-size:16px;font-weight:400;color:var(--mid-gray)">/${totalTareas}</span></div>
        <div class="card-sub">${pct}% completado</div>
      </div>
      ${recAlerts.length && !isFlorHome ? `<div class="card card-clickable" onclick="navigate('recordatorios-jardineria')" style="border-left:3px solid var(--red-alert)">
        <div class="card-label">Recordatorios Jardín</div>
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
        <button class="btn-secondary" style="padding:5px 12px;font-size:12px" onclick="navigate('eventos-maison')">Ver kanban →</button>
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
        <button class="btn-secondary" style="padding:5px 12px;font-size:12px" onclick="navigate('ventas-externas')">Ver →</button>
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
        <button class="btn-secondary" style="padding:5px 12px;font-size:12px" onclick="navigate('checklist')">Ver →</button>
      </div>
      <div class="home-cl-bar-wrap">
        <div class="home-cl-bar"><div class="home-cl-fill" style="width:${pct}%"></div></div>
        <span class="home-cl-pct">${pct}%</span>
      </div>
      <div class="home-cl-tasks">
        ${pct === 100
          ? '<div style="color:var(--sage-dark);font-weight:600;font-size:13px;padding:8px 0">¡Todas las tareas completadas!</div>'
          : pendientesCL.map(t => `<div class="home-cl-task">· ${esc(t.zona)} — ${esc(t.actividad||'')}</div>`).join('')
        }
      </div>
    </div>`;
  renderProductividadHome();
}

let jardRecordatorios=[];
let jardPlagas=[];
let jardStockPlantas=[];
let jardStockProductos=[];
let jardAlertas=[];


// ════════════════════════════════════════
// DATA — GALERÍA DE TRABAJOS
// ════════════════════════════════════════
let galeriaData=[];
window._setGaleriaData = (arr) => { galeriaData.splice(0, galeriaData.length, ...arr); };

let _galeriaLightboxIdx = 0;

// Sección activa del glosario dentro de Galería de Trabajos.
// 'hotel' = arreglos standard del hotel · 'eventos' = arreglos de eventos ·
// 'ramos' = ramos ya hechos · 'todos' = todas.
// Las fichas viejas sin sección se consideran 'eventos' (histórico de trabajos).
let galeriaSeccion = 'hotel';
function galSecDe(g){ return g.seccion==='hotel' ? 'hotel' : (g.seccion==='ramos' ? 'ramos' : 'eventos'); }

function setGaleriaSeccion(s){
  galeriaSeccion = s;
  ['hotel','eventos','ramos','todos'].forEach(k=>{
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
    `<option value="__otra__">Otra (escribir)...</option>`;
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
    const secLabel = galeriaSeccion==='hotel'?'standard del hotel':galeriaSeccion==='eventos'?'de eventos':galeriaSeccion==='ramos'?'de ramos':'';
    el.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--mid-gray)">
      <div style="font-size:48px;margin-bottom:16px"></div>
      <div style="font-size:14px">No hay fichas de arreglos ${esc(secLabel)} todavía.<br>Agregá la primera con "＋ Nueva ficha".</div>
    </div>`;
    return;
  }

  const TEMP_ICON = {Primavera:'',Verano:'',Otoño:'',Invierno:''};
  el.innerHTML = `<div style="columns:3 280px;column-gap:16px;orphans:1;widows:1">
    ${filtered.map((g)=>{
      const realIdx = galeriaData.indexOf(g);
      const foto = (g.fotos&&g.fotos[0]) || g.foto || '';
      const flores = Array.isArray(g.flores) ? g.flores : (g.flores?g.flores.split(',').map(f=>f.trim()):[]);
      const chips = galMateriaPrima(g).length ? galMateriaPrima(g) : flores;
      const _sd = galSecDe(g);
      const secBadge = _sd==='hotel'
        ? `<span style="background:#E8EEF4;color:var(--info);padding:2px 8px;border-radius:20px;font-size:12px;font-weight:600">Hotel</span>`
        : _sd==='ramos'
        ? `<span style="background:var(--sage-light);color:#3A5A3A;padding:2px 8px;border-radius:20px;font-size:12px;font-weight:600">Ramo</span>`
        : `<span style="background:var(--blush-light);color:#7A3A2A;padding:2px 8px;border-radius:20px;font-size:12px;font-weight:600">Evento</span>`;
      return `<div style="break-inside:avoid;margin-bottom:16px;border-radius:var(--radius-md);overflow:hidden;background:var(--warm-white);border:1px solid var(--light-gray);box-shadow:var(--shadow-sm);cursor:pointer;transition:var(--transition)" onclick="openFichaGaleria(${realIdx})" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='var(--shadow-md)'" onmouseout="this.style.transform='';this.style.boxShadow='var(--shadow-sm)'">
        ${foto
          ? `<img src="${foto}" style="width:100%;display:block;object-fit:cover;max-height:380px" loading="lazy">`
          : `<div style="width:100%;height:200px;background:linear-gradient(135deg,var(--blush-light),var(--sage-light));display:flex;align-items:center;justify-content:center;font-size:52px"></div>`
        }
        <div style="padding:14px 16px">
          <div style="font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:500;color:var(--charcoal);margin-bottom:6px">${esc(g.titulo||'Sin título')}</div>
          <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px">
            ${secBadge}
            ${g.sector?`<span style="background:var(--cream);color:var(--mid-gray);padding:2px 8px;border-radius:20px;font-size:12px">${esc(g.sector)}</span>`:''}
            ${g.tamano?`<span style="background:var(--cream);color:var(--mid-gray);padding:2px 8px;border-radius:20px;font-size:12px">${esc(g.tamano)}</span>`:''}
            ${g.temporada?`<span style="background:var(--cream);color:var(--mid-gray);padding:2px 8px;border-radius:20px;font-size:12px">${TEMP_ICON[g.temporada]||''} ${esc(g.temporada)}</span>`:''}
            ${chips.slice(0,3).map(f=>`<span style="background:var(--light-gray);color:var(--charcoal);padding:2px 8px;border-radius:20px;font-size:12px">${esc(f)}</span>`).join('')}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;color:var(--mid-gray)">${g.precio?esc(g.precio):(g.fecha?fmtDate(g.fecha):'')}</span>
            <div style="display:flex;gap:4px" onclick="event.stopPropagation()">
              ${(g.fotos&&g.fotos.length>1)?`<span style="font-size:12px;color:var(--mid-gray);padding:2px 6px">${g.fotos.length}</span>`:''}
              <button class="btn-icon" onclick="editarGaleria(${realIdx})" title="Editar"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>
              <button class="btn-icon" style="color:var(--red-alert)" onclick="eliminarGaleria(${realIdx})" title="Eliminar"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg></button>
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
    <td style="border:1px solid var(--light-gray);padding:9px 12px;font-weight:600;background:var(--surface-1);width:38%;vertical-align:top">${l}</td>
    <td style="border:1px solid var(--light-gray);padding:9px 12px;vertical-align:top">${v}</td>
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
        <button class="btn-secondary" style="font-size:12px" onclick="imprimirFicha(${idx})">Imprimir</button>
        <button class="btn-secondary" style="font-size:12px" onclick="closeModal('ficha-galeria-modal');editarGaleria(${idx})">Editar</button>
      </div>
    </div>
    <div style="display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start">
      <div style="flex:1;min-width:220px">
        ${fotos.length
          ? `<img src="${fotos[0]}" style="width:100%;border-radius:8px;object-fit:cover;cursor:zoom-in" onclick="abrirLightbox(${idx})">
             ${fotos.length>1?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">${fotos.slice(1).map(f=>`<img src="${f}" style="width:56px;height:56px;object-fit:cover;border-radius:5px;border:1px solid var(--light-gray)">`).join('')}</div>`:''}`
          : `<div style="width:100%;height:200px;background:linear-gradient(135deg,var(--blush-light),var(--sage-light));display:flex;align-items:center;justify-content:center;font-size:52px;border-radius:8px"></div>`}
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

async function imprimirFicha(idx){
  const g = galeriaData[idx];
  if(!g) return;
  // Abrir la ventana antes de esperar la foto (si no, el navegador la bloquea)
  const win = window.open('','_blank');
  // La ventana nueva no resuelve referencias fbimg: → traer la foto antes
  const foto = await resolverFoto((g.fotos&&g.fotos[0]) || g.foto || '');
  const sec = galSecDe(g)==='hotel' ? 'Standard Hotel' : galSecDe(g)==='ramos' ? 'Ramos' : 'Eventos';
  abrirDocumento({
    ventana: win,
    tipo: 'Ficha de arreglo · ' + sec,
    titulo: g.titulo || 'Ficha de arreglo',
    cuerpo: (foto ? `<img class="foto" src="${foto}" alt="">` : '') + kv(fichaRows(g), { izq: true }),
    archivo: 'Ficha - ' + (g.titulo || 'arreglo'),
  });
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
           :`<div style="font-size:80px"></div>`}
      <div style="margin-top:16px;text-align:center;max-width:600px;padding:0 20px">
        <div style="font-family:'Cormorant Garamond',serif;font-size:22px;color:white;margin-bottom:6px">${esc(g.titulo||'Sin título')}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:8px">
          ${g.tipoEvento?`<span style="background:rgba(196,147,122,.3);color:#EDE8E2;padding:3px 10px;border-radius:20px;font-size:12px">${esc(g.tipoEvento)}</span>`:''}
          ${flores.map(f=>`<span style="background:rgba(255,255,255,.12);color:rgba(255,255,255,.8);padding:3px 10px;border-radius:20px;font-size:12px">${esc(f)}</span>`).join('')}
        </div>
        ${g.notas?`<div style="font-size:12px;color:rgba(255,255,255,.5);line-height:1.6">${esc(g.notas)}</div>`:''}
        ${fotos.length>1?`<div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:6px">${fotoIdx+1} / ${fotos.length}</div>`:''}
      </div>`;
  }
  showFoto();
}

function galIngRowHTML(prod, qty){
  return `<div class="ev-arreglo-row" style="display:flex;gap:8px;margin-bottom:6px">
    <input list="gal-insumos-list" value="${esc(prod||'')}" placeholder="Materia prima (flor / follaje)" style="flex:2;min-width:0;border:1px solid var(--light-gray);border-radius:4px;padding:6px 8px;font-family:'DM Sans',sans-serif;font-size:12.5px;outline:none">
    <input type="text" value="${esc(qty||'')}" placeholder="Cant. (ej. 3, 1 paquete)" style="flex:1;min-width:0;border:1px solid var(--light-gray);border-radius:4px;padding:6px 8px;font-size:12.5px;outline:none;font-family:'DM Sans',sans-serif">
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
  const sec = idx!=null ? galSecDe(g) : (['eventos','ramos'].includes(galeriaSeccion) ? galeriaSeccion : 'hotel');
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
          <option value="hotel"${sec==='hotel'?' selected':''}>Standard Hotel</option>
          <option value="eventos"${sec==='eventos'?' selected':''}>Eventos</option>
          <option value="ramos"${sec==='ramos'?' selected':''}>Ramos</option>
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

    <div class="form-group"><label class="form-label">Materia prima <span style="color:var(--mid-gray);font-size:12px;font-weight:400">(elegí de la base o escribí una nueva)</span></label>
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
          <button onclick="galeriaQuitarFoto(${idx!=null?idx:'null'},${fi})" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,.6);color:white;border:none;border-radius:50%;width:18px;height:18px;font-size:12px;cursor:pointer;line-height:1">✕</button>
        </div>`).join('')}
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <label class="btn-secondary" style="cursor:pointer;font-size:12px">Subir fotos <input type="file" accept="image/*" multiple style="display:none" onchange="galeriaAddFotos(${idx!=null?idx:'null'},this)">
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
    leerFotoComprimida(file, data=>{
      fotosData.push(data);
      loaded++;
      if(loaded===files.length){
        document.getElementById('gal-fotos-data').value = JSON.stringify(fotosData);
        _refreshGalModalFotos(fotosData, idx);
      }
    });
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
    <button onclick="galeriaQuitarFoto(${idx!=null?idx:'null'},${fi})" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,.6);color:white;border:none;border-radius:50%;width:18px;height:18px;font-size:12px;cursor:pointer;line-height:1">✕</button>
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
  showToast('Ficha guardada en la galería');
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

window._setJardPlagas = (arr) => { jardPlagas.splice(0, jardPlagas.length, ...arr); };
window._setJardStockPlantas = (arr) => { jardStockPlantas.splice(0, jardStockPlantas.length, ...arr); };
window._setJardStockProductos = (arr) => { jardStockProductos.splice(0, jardStockProductos.length, ...arr); };

// ── ALERTAS URGENTES DE JARDÍN (foto) ─────────────────────────────────────────
// Gerencia carga una foto de algo del jardín que requiere atención urgente
// (zona + qué hacer). Les salta a los jardineros al instante como urgente.
const JARD_ALERTA_TIPOS = ['Poda','Riego','Fertilización','Desmalezado','Plaga','Limpieza','Otro'];
const JARD_ALERTA_ICON = { 'Poda':'','Riego':'','Fertilización':'','Desmalezado':'','Plaga':'','Limpieza':'','Otro':'' };

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
  if(userRole!=='gerencia'){ showToast('Solo gerencia'); return; }
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
  if(!zona){ showToast('Indicá la zona'); return; }
  const alerta = { id: Date.now(), zona, tipo, nota, foto: _fotoAlertaData||'', creado: Date.now(), por: window.currentUserLabel||'Gerencia', resuelto: false };
  jardAlertas.unshift(alerta);
  fbSave('jardAlertas', jardAlertas);
  // Push real a jardineros (incluye combinados como Ivan)
  window.pushSend?.('Jardín URGENTE: '+tipo, `${zona}${nota?' — '+nota:''}`, 'jard-urgente', 'roles:jardinero');
  closeModal('alerta-jard-modal');
  renderAlertasUrgentesJard();
  showToast('Alerta enviada a los jardineros');
}

async function resolverAlertaJardin(id){
  const a = jardAlertas.find(x=>x.id===id);
  if(!a) return;
  if(!await confirmModal(`¿Marcar como resuelta la alerta de ${a.tipo} en "${a.zona}"?`)) return;
  a.resuelto = true; a.resueltoPor = window.currentUserLabel||''; a.resueltoFecha = TODAY_ISO;
  fbSave('jardAlertas', jardAlertas);
  renderAlertasUrgentesJard();
  showToast('Alerta resuelta');
}

function _alertaAplica(){ return userRole==='jardinero' || userRole==='gerencia' || (userRole==='florista' && !!jardineroNombre); }

const _alertasAvisadas = new Set();
function notificarAlertasUrgentes(){
  if(!_alertaAplica() || userRole==='gerencia') return;
  _alertasActivas().forEach(a=>{
    if(_alertasAvisadas.has(a.id)) return;
    _alertasAvisadas.add(a.id);
    showToast(`Jardín urgente: ${a.tipo} en ${a.zona}`);
    if(typeof Notification!=='undefined' && Notification.permission==='granted'){
      try{ new Notification('Jardín URGENTE: '+a.tipo, { body:`${a.zona}${a.nota?' — '+a.nota:''}`, icon:'/icon-192.png', tag:'jard-urgente' }); }catch(e){}
    }
  });
}

function renderAlertasUrgentesJard(){
  const activas = _alertasActivas();
  const esGerencia = userRole==='gerencia';
  const html = activas.length ? `
    <div class="jalert-wrap">
      <div class="jalert-hdr">${activas.length} ${activas.length===1?'atención urgente':'atenciones urgentes'} del jardín</div>
      ${activas.map(a=>`<div class="jalert-card">
        ${a.foto?`<img src="${a.foto}" class="jalert-foto" onclick="verFotoAlerta(${a.id})" alt="">`:''}
        <div class="jalert-body">
          <div class="jalert-tipo">${JARD_ALERTA_ICON[a.tipo]||''} ${esc(a.tipo)}</div>
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
  if(userRole!=='gerencia'){ showToast('Solo gerencia'); return; }
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
  if(!persona){ showToast('Elegí el responsable'); return; }
  if(!nota && !_fotoLlamadoData){ showToast('Agregá una nota o una foto'); return; }
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
  window.pushSend?.('Llamado de atención', `${zona?zona+': ':''}${nota||'Revisá tu arreglo'}`, 'llamado', persona);
  closeModal('llamado-modal');
  renderLlamadosChecklist();
  showToast('Llamado enviado a '+persona+' y registrado en Evaluaciones');
}

const _llamadosAvisados = new Set();
function notificarLlamados(){
  if(userRole==='gerencia' || !floristaNombre) return;
  _llamadosActivos().filter(l=>l.empleadoNombre===floristaNombre && !l.visto).forEach(l=>{
    if(_llamadosAvisados.has(l.id)) return;
    _llamadosAvisados.add(l.id);
    showToast('Tenés un llamado de atención de gerencia');
    if(typeof Notification!=='undefined' && Notification.permission==='granted'){
      try{ new Notification('Llamado de atención', {body:`${l.zona?l.zona+': ':''}${l.nota||''}`, icon:'/icon-192.png', tag:'llamado'}); }catch(e){}
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
  el.innerHTML = `<div class="jalert-wrap" style="border-color:#C99A00;background:var(--amber-soft)">
    <div class="jalert-hdr" style="color:var(--amber)">${lista.length} ${lista.length===1?'llamado de atención':'llamados de atención'}</div>
    ${lista.map(l=>`<div class="jalert-card">
      ${l.foto?`<img src="${l.foto}" class="jalert-foto" onclick="verFotoLlamado(${l.id})" alt="">`:''}
      <div class="jalert-body">
        <div class="jalert-tipo">${esc(l.zona||'Arreglo')}</div>
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
  showToast('Listo');
}

async function eliminarLlamado(id){
  if(userRole!=='gerencia') return;
  if(!await confirmModal('¿Eliminar este llamado del registro? Se borra la foto para siempre.')) return;
  const i = llamadosData.findIndex(x=>x.id===id);
  if(i>=0) llamadosData.splice(i,1);
  fbSave('llamadosData', llamadosData);
  renderLlamadosEval();
  showToast('Registro eliminado');
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
      <div style="padding:10px 14px;background:var(--amber-soft);display:flex;justify-content:space-between;align-items:center">
        <strong style="color:var(--amber)">${esc(pers)}</strong>
        <span style="font-size:12px;color:var(--mid-gray)">${items.length} llamado${items.length!==1?'s':''}</span>
      </div>
      <div style="display:flex;flex-direction:column">
        ${items.map(l=>`<div style="display:flex;gap:10px;align-items:center;padding:9px 14px;border-top:1px solid var(--surface-2)">
          ${l.foto?`<img src="${l.foto}" onclick="verFotoLlamado(${l.id})" style="width:52px;height:52px;object-fit:cover;border-radius:6px;cursor:pointer;flex-shrink:0" alt="">`:'<div style="width:52px;height:52px;border-radius:6px;background:var(--surface-2);display:flex;align-items:center;justify-content:center;flex-shrink:0"></div>'}
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:var(--charcoal)">${esc(l.zona||'Arreglo')} ${l.resuelto?'<span style="font-size:12px;color:var(--green-ok)">✓ visto</span>':'<span style="font-size:12px;color:var(--amber)">pendiente</span>'}</div>
            ${l.nota?`<div style="font-size:12px;color:var(--mid-gray)">${esc(l.nota)}</div>`:''}
            <div style="font-size:12px;color:var(--mid-gray)">${fmtDate(l.fecha)} · por ${esc(l.por||'gerencia')}</div>
          </div>
          <button class="btn-icon" style="color:var(--red-alert)" title="Eliminar del registro" onclick="eliminarLlamado(${l.id})">✕</button>
        </div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

const JARD_TIPOS_ICON = { 'Riego':'','Fertilización':'','Desmalezado':'','Poda':'' };
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
  renderPlagasJard();
  const vencidos = jardRecordatorios.filter(r=>recEstado(r)==='vencido');
  const proximos = jardRecordatorios.filter(r=>recEstado(r)==='proximo');
  const ok       = jardRecordatorios.filter(r=>recEstado(r)==='ok');
  const nuevosSet = new Set(getRecordatoriosNuevos());

  document.getElementById('jrec-kpis').innerHTML = `
    <div class="cards-grid cards-grid-3" style="margin-bottom:24px">
      <div class="card"><div class="card-label">Vencidos</div><div class="card-value red">${vencidos.length}</div><div class="card-sub">requieren atención ya</div></div>
      <div class="card"><div class="card-label">Próximos</div><div class="card-value amber">${proximos.length}</div><div class="card-sub">en los próximos 3 días</div></div>
      <div class="card"><div class="card-label">Al día</div><div class="card-value green">${ok.length}</div><div class="card-sub">sin vencer</div></div>
    </div>`;

  // Cartel de recordatorios nuevos agregados por gerencia (para operarios)
  const nuevosBanner = nuevosSet.size ? `<div class="jrec-aviso-banner" style="cursor:default">
      <span class="jrec-aviso-icon"></span>
      <span><strong>${nuevosSet.size===1?'Hay un recordatorio nuevo':'Se agregaron '+nuevosSet.size+' recordatorios nuevos'}:</strong> ${esc([...nuevosSet].map(r=>`${r.tipo} · ${r.task}`).join('  ·  '))}</span>
    </div>` : '';

  const alertas = [...vencidos,...proximos];
  document.getElementById('jrec-alertas').innerHTML = nuevosBanner + (alertas.length
    ? `<div class="section-title" style="margin-bottom:14px">Alertas Activas</div>
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
    : `<div class="jrec-all-ok">Todo al día — sin alertas pendientes</div>`);

  // Al abrir la sección, el operario queda al día: se limpian badge y carteles
  if(nuevosSet.size) marcarRecordatoriosVistos();

  // Tabla de configuración: la ven gerencia y los jardineros (crear/editar).
  // Eliminar queda reservado a gerencia.
  const cfg = document.getElementById('jrec-config');
  if(!cfg) return;
  const puedeEditarRec = userRole==='gerencia' || userRole==='jardinero' || (userRole==='florista' && !!jardineroNombre);
  if(!puedeEditarRec){
    cfg.innerHTML=''; return;
  }
  const puedeBorrarRec = userRole==='gerencia';
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
              <td style="font-size:12px;color:var(--mid-gray)">${esc(r.group)}</td>
              <td><span class="jrec-tipo-badge" style="${JARD_TIPO_STYLE[r.tipo]||''}">${JARD_TIPOS_ICON[r.tipo]||''} ${esc(r.tipo)}</span></td>
              <td>${r.frecuencia} días</td>
              <td>${r.ultimaVez?fmtDate(r.ultimaVez):'—'}</td>
              <td><span style="${color}">${proximo}</span></td>
              <td style="white-space:nowrap">
                <button class="btn-icon" onclick="openRecordatorioModal(${i})" title="Editar"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>
                ${puedeBorrarRec ? `<button class="btn-icon" style="color:var(--red-alert)" onclick="deleteRecordatorio(${i})" title="Eliminar">✕</button>` : ''}
              </td>
            </tr>`;
          }).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--mid-gray);padding:24px">Sin recordatorios configurados</td></tr>'}
        </tbody>
      </table>
    </div>`;
}

// ── TABLA DE PLAGAS Y ENFERMEDADES ───────────────────────────────────────────
// Gerencia y jardineros pueden agregar, editar y registrar controles; eliminar es solo de gerencia.
// Cada fila tiene "volver a revisar cada N días" y un semáforo según el último control.
// Los tratamientos sugeridos son orientativos: la dosis siempre se confirma con la etiqueta del producto.
const PLAGAS_SUGERENCIAS = {
  'Cochinilla':        {t:'Jabón potásico o aceite de neem; retirar a mano las más visibles', c:7},
  'Pulgón':            {t:'Jabón potásico o aceite de neem; chorro de agua sobre los brotes', c:5},
  'Mosca blanca':      {t:'Aceite de neem o jabón potásico; trampas amarillas pegajosas', c:5},
  'Arañuela roja':     {t:'Aumentar humedad ambiente y pulverizar jabón potásico o aceite de neem', c:5},
  'Oídio (polvillo blanco)': {t:'Fungicida a base de azufre o bicarbonato; podar hojas muy afectadas', c:7},
  'Roya':              {t:'Retirar hojas afectadas y aplicar fungicida cúprico', c:7},
  'Hongos (manchas en hojas)': {t:'Retirar hojas afectadas, no mojar el follaje y aplicar fungicida cúprico', c:7},
  'Podredumbre de raíz': {t:'Reducir el riego, mejorar el drenaje y aplicar fungicida al suelo', c:7},
  'Hormigas':          {t:'Cebo para hormigas lejos de las plantas; controlar pulgones y cochinillas', c:7},
  'Caracoles y babosas': {t:'Cebo específico o trampas de cerveza; recolectar a la tarde', c:3},
  'Orugas':            {t:'Recolección manual o Bacillus thuringiensis', c:5},
  'Trips':             {t:'Trampas azules pegajosas y jabón potásico', c:5},
};
const PLAGAS_ESTADOS = {
  'Detectada':      'background:#fdecea;color:#b3261e',
  'En tratamiento': 'background:#fff4d6;color:#8a5a00',
  'Bajo control':   'background:#e3f1fb;color:#1b5e8a',
  'Resuelta':       'background:#e4f4e6;color:#2e7d32',
};
let plagasFiltroEstado = '';
let plagasFiltroTexto = '';

// Días hasta el próximo control: negativo = atrasado, null = sin fecha o ya resuelta
function plagaDiasParaControl(r){
  if(r.estado==='Resuelta') return null;
  if(!r.ultimo) return -1;
  const prox = addDaysISO(r.ultimo, parseInt(r.cada)||7);
  return Math.round((new Date(prox)-new Date(TODAY_ISO))/86400000);
}

function plagaSemaforo(r){
  const d = plagaDiasParaControl(r);
  if(d===null) return {txt:'Cerrada', st:'color:var(--mid-gray)', orden:3};
  if(d<0) return {txt: r.ultimo ? `Atrasada ${-d} d` : 'Sin controlar', st:'color:var(--red-alert);font-weight:600', orden:0};
  if(d<=2) return {txt: d===0?'Hoy':`En ${d} d`, st:'color:#A06A00;font-weight:600', orden:1};
  return {txt:`En ${d} d`, st:'color:#2e7d32', orden:2};
}

function plagaFiltrar(){
  plagasFiltroEstado = document.getElementById('jplag-f-estado')?.value || '';
  plagasFiltroTexto  = (document.getElementById('jplag-f-texto')?.value || '').toLowerCase();
  renderPlagasJard();
}

function renderPlagasJard(){
  const box = document.getElementById('jplag-tabla');
  if(!box) return;
  const puedeEditar = userRole==='gerencia' || userRole==='jardinero' || (userRole==='florista' && !!jardineroNombre);
  const puedeBorrar = userRole==='gerencia';
  const sem = jardPlagas.map(plagaSemaforo);
  const atrasadas = sem.filter(s=>s.orden===0).length;
  const proximas  = sem.filter(s=>s.orden===1).length;
  const activas   = jardPlagas.filter(r=>r.estado!=='Resuelta').length;
  const chip = (n,label,color) => `<div style="flex:1;min-width:120px;padding:10px 14px;border:1px solid var(--light-gray);border-left:3px solid ${color};border-radius:6px;background:#fff"><div style="font-size:22px;font-weight:600">${n}</div><div style="font-size:12px;color:var(--mid-gray)">${label}</div></div>`;
  const q = plagasFiltroTexto;
  const items = jardPlagas.map((r,i)=>({r,i,s:sem[i]}))
    .filter(x=>!plagasFiltroEstado || (x.r.estado||'Detectada')===plagasFiltroEstado)
    .filter(x=>!q || [x.r.planta,x.r.enfermedad,x.r.zona,x.r.tratamiento,x.r.quien].some(v=>(v||'').toLowerCase().includes(q)))
    .sort((a,b)=>a.s.orden-b.s.orden);
  const gravColor = {Alta:'var(--red-alert)', Media:'#A06A00', Leve:'var(--mid-gray)'};
  const filas = items.length ? items.map(({r,i,s})=>{
    const est = r.estado || 'Detectada';
    const hist = (r.historial||[]);
    const proxFecha = (r.estado!=='Resuelta' && r.ultimo) ? fmtDate(addDaysISO(r.ultimo, parseInt(r.cada)||7)) : '—';
    return `<tr>
      <td><strong>${esc(r.planta)}</strong>${r.zona?`<div style="font-size:12px;color:var(--mid-gray)">${esc(r.zona)}</div>`:''}</td>
      <td>${esc(r.enfermedad)}${r.gravedad?`<div style="font-size:12px;color:${gravColor[r.gravedad]||''}">Gravedad ${esc(r.gravedad)}</div>`:''}</td>
      <td>${esc(r.tratamiento)}</td>
      <td>${esc(r.dosis)}</td>
      <td><span style="padding:2px 8px;border-radius:10px;font-size:12px;white-space:nowrap;${PLAGAS_ESTADOS[est]||''}">${esc(est)}</span></td>
      <td>${r.ultimo?fmtDate(r.ultimo):'—'}</td>
      <td><span style="${s.st}">${esc(s.txt)}</span><div style="font-size:12px;color:var(--mid-gray)">${proxFecha}${r.cada?` · cada ${parseInt(r.cada)} d`:''}</div></td>
      <td>${esc(r.quien)}</td>
      <td style="max-width:240px;white-space:pre-wrap">${esc(r.obs)}${hist.length?`<div><a href="#" style="font-size:12px" onclick="verHistorialPlaga(${i});return false">Ver historial (${hist.length})</a></div>`:''}</td>
      <td style="white-space:nowrap">${puedeEditar?`<button class="btn-add" style="padding:4px 10px;font-size:12px" onclick="openControlPlaga(${i})">✓ Control</button> <button class="btn-icon" onclick="openPlagaJardModal(${i})" title="Editar"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>`:''}${puedeBorrar?`<button class="btn-icon" style="color:var(--red-alert)" onclick="deletePlagaJard(${i})" title="Eliminar">✕</button>`:''}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="10" style="text-align:center;color:var(--mid-gray);padding:24px">${jardPlagas.length?'Ningún control coincide con el filtro':'Todavía no hay controles cargados'}</td></tr>`;
  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
      <div class="section-title" style="margin:0">Plagas y enfermedades</div>
      ${puedeEditar?'<button class="btn-add" onclick="openPlagaJardModal(-1)">+ Nuevo control</button>':''}
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">
      ${chip(atrasadas,'Para revisar ya (atrasadas)','var(--red-alert)')}
      ${chip(proximas,'Se revisan hoy o en 2 días','#A06A00')}
      ${chip(activas,'Plagas activas','#1b5e8a')}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      <input type="text" class="ctrl-search" id="jplag-f-texto" placeholder="Buscar planta, plaga, zona..." value="${esc(plagasFiltroTexto)}" oninput="plagaFiltrar()" style="flex:1;min-width:180px">
      <select class="form-input" id="jplag-f-estado" onchange="plagaFiltrar()" style="width:170px;padding:6px 8px;font-size:12.5px">
        <option value="">Todos los estados</option>
        ${Object.keys(PLAGAS_ESTADOS).map(e=>`<option${plagasFiltroEstado===e?' selected':''}>${e}</option>`).join('')}
      </select>
    </div>
    <div class="table-wrapper">
      <table class="stock-table" style="min-width:1100px">
        <thead><tr>
          <th>Planta</th><th>Enfermedad</th><th>Tratamiento</th><th>Dosificación</th><th>Estado</th><th>Último control</th><th>Próximo control</th><th>Quién aplicó</th><th>Observación</th><th></th>
        </tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>`;
  // el input de búsqueda se vuelve a crear: devolverle el foco al escribir
  if(plagasFiltroTexto){ const t=document.getElementById('jplag-f-texto'); if(t && document.activeElement!==t){ t.focus(); t.setSelectionRange(t.value.length,t.value.length); } }
}

function plagaSugerir(){
  const sel = PLAGAS_SUGERENCIAS[document.getElementById('jplag-enfermedad').value.trim()];
  const ayuda = document.getElementById('jplag-ayuda');
  if(!sel){ ayuda.textContent=''; return; }
  const trat = document.getElementById('jplag-tratamiento');
  if(!trat.value.trim()) trat.value = sel.t;
  document.getElementById('jplag-cada').value = sel.c;
  ayuda.textContent = 'Dosis: seguí siempre la etiqueta del producto que uses. Si no tiene, probá primero en una hoja y esperá 24 h.';
}

function openPlagaJardModal(idx){
  const r = idx>=0 ? jardPlagas[idx] : null;
  document.getElementById('jplag-sugerencias').innerHTML = Object.keys(PLAGAS_SUGERENCIAS).map(k=>`<option value="${esc(k)}">`).join('');
  document.getElementById('jplag-modal-idx').value = idx;
  document.getElementById('jplag-planta').value = r?.planta || '';
  document.getElementById('jplag-zona').value = r?.zona || '';
  document.getElementById('jplag-gravedad').value = r?.gravedad || 'Leve';
  document.getElementById('jplag-enfermedad').value = r?.enfermedad || '';
  document.getElementById('jplag-tratamiento').value = r?.tratamiento || '';
  document.getElementById('jplag-dosis').value = r?.dosis || '';
  document.getElementById('jplag-estado').value = r?.estado || 'Detectada';
  document.getElementById('jplag-cada').value = r?.cada || 7;
  document.getElementById('jplag-ultimo').value = r?.ultimo || '';
  document.getElementById('jplag-quien').value = r ? (r.quien||'') : (jardineroNombre || '');
  document.getElementById('jplag-obs').value = r?.obs || '';
  document.getElementById('jplag-ayuda').textContent = '';
  document.getElementById('jplag-modal-title').textContent = r ? 'Editar control' : 'Nuevo control';
  document.getElementById('jplag-modal').classList.add('open');
}

function savePlagaJard(){
  const idx = parseInt(document.getElementById('jplag-modal-idx').value);
  const v = id => document.getElementById(id).value.trim();
  const rec = {
    planta: v('jplag-planta'),
    zona: v('jplag-zona'),
    gravedad: v('jplag-gravedad'),
    enfermedad: v('jplag-enfermedad'),
    tratamiento: v('jplag-tratamiento'),
    dosis: v('jplag-dosis'),
    estado: v('jplag-estado'),
    cada: Math.min(365, Math.max(1, parseInt(v('jplag-cada'))||7)),
    ultimo: document.getElementById('jplag-ultimo').value || null,
    quien: v('jplag-quien'),
    obs: v('jplag-obs'),
  };
  if(!rec.planta){ showToast('Poné el nombre de la planta'); return; }
  if(idx>=0){ rec.historial = jardPlagas[idx].historial || []; jardPlagas[idx]=rec; }
  else { rec.historial = []; jardPlagas.push(rec); }
  fbSave('jardPlagas', jardPlagas);
  closeModal('jplag-modal');
  renderPlagasJard();
}

// Registrar que se revisó/aplicó hoy: actualiza último control y deja constancia en el historial
function openControlPlaga(idx){
  const r = jardPlagas[idx];
  document.getElementById('jplag-ctl-idx').value = idx;
  document.getElementById('jplag-ctl-sub').textContent = `${r.planta} · ${r.enfermedad||'sin enfermedad indicada'}`;
  document.getElementById('jplag-ctl-fecha').value = TODAY_ISO;
  document.getElementById('jplag-ctl-quien').value = jardineroNombre || r.quien || '';
  document.getElementById('jplag-ctl-estado').value = r.estado || 'Detectada';
  document.getElementById('jplag-ctl-obs').value = '';
  document.getElementById('jplag-ctl-modal').classList.add('open');
}

function saveControlPlaga(){
  const idx = parseInt(document.getElementById('jplag-ctl-idx').value);
  const r = jardPlagas[idx];
  if(!r) return;
  const fecha = document.getElementById('jplag-ctl-fecha').value || TODAY_ISO;
  const quien = document.getElementById('jplag-ctl-quien').value.trim();
  const estado = document.getElementById('jplag-ctl-estado').value;
  const obs = document.getElementById('jplag-ctl-obs').value.trim();
  r.historial = r.historial || [];
  r.historial.push({fecha, quien, estado, obs});
  if(!r.ultimo || fecha>=r.ultimo){
    r.ultimo = fecha; r.quien = quien; r.estado = estado;
    if(obs) r.obs = obs;
  }
  fbSave('jardPlagas', jardPlagas);
  closeModal('jplag-ctl-modal');
  renderPlagasJard();
  showToast('Control registrado');
}

function verHistorialPlaga(idx){
  const r = jardPlagas[idx];
  const filas = (r.historial||[]).slice().reverse().map(h=>`${fmtDate(h.fecha)} · ${h.estado||''}${h.quien?' · '+h.quien:''}${h.obs?'\n   '+h.obs:''}`).join('\n');
  alertModal(`Historial de ${r.planta}\n\n${filas}`);
}

async function deletePlagaJard(idx){
  if(userRole !== 'gerencia'){ showToast('Solo gerencia puede eliminar'); return; }
  if(!await confirmModal('¿Eliminar este control?')) return;
  jardPlagas.splice(idx,1);
  fbSave('jardPlagas', jardPlagas);
  renderPlagasJard();
}

// ── STOCK DE JARDÍN: PLANTAS DE REEMPLAZO Y FERTILIZANTES / FITOSANITARIOS ───
// Gerencia y jardineros cargan y editan; eliminar es solo de gerencia.
// Cuando la cantidad llega al mínimo avisado, la fila se marca en rojo.
const STOCK_JARD_CFG = {
  plantas: {
    titulo:'Plantas para reemplazo', nuevo:'+ Nueva planta', vacio:'Todavía no hay plantas cargadas', clave:'jardStockPlantas',
    campos:[
      {k:'nombre', l:'Planta', req:true, max:120},
      {k:'ubicacion', l:'Dónde está', max:80, ph:'ej. Vivero, patio de servicio'},
      {k:'cantidad', l:'Cantidad', num:true},
      {k:'minimo', l:'Avisar si quedan', num:true},
      {k:'tamano', l:'Tamaño / maceta', max:80, ph:'ej. maceta 20'},
      {k:'obs', l:'Observación', area:true, max:500},
    ],
  },
  productos: {
    titulo:'Fertilizantes y fitosanitarios', nuevo:'+ Nuevo producto', vacio:'Todavía no hay productos cargados', clave:'jardStockProductos',
    campos:[
      {k:'nombre', l:'Producto', req:true, max:120},
      {k:'tipo', l:'Tipo', opts:['Fertilizante','Fitosanitario','Otro']},
      {k:'cantidad', l:'Cantidad', num:true},
      {k:'unidad', l:'Unidad', max:20, ph:'ej. litros, kg, envases'},
      {k:'minimo', l:'Avisar si quedan', num:true},
      {k:'vence', l:'Vencimiento', date:true},
      {k:'obs', l:'Observación', area:true, max:500},
    ],
  },
};
const stockJardLista = t => t==='plantas' ? jardStockPlantas : jardStockProductos;
let stockJardFiltro = {plantas:'', productos:''};

function stockJardFiltrar(t){
  stockJardFiltro[t] = (document.getElementById('jstock-f-'+t)?.value || '').toLowerCase();
  renderStockJard();
}

function renderStockJard(){
  const box = document.getElementById('jstock-tablas');
  if(!box) return;
  const puedeEditar = userRole==='gerencia' || userRole==='jardinero' || (userRole==='florista' && !!jardineroNombre);
  const puedeBorrar = userRole==='gerencia';
  const lapiz = '<svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg>';
  const bloque = t => {
    const cfg = STOCK_JARD_CFG[t];
    const lista = stockJardLista(t);
    const q = stockJardFiltro[t];
    const bajo = r => r.minimo!=='' && r.minimo!=null && r.cantidad!=='' && r.cantidad!=null && Number(r.cantidad) <= Number(r.minimo);
    const vencido = r => t==='productos' && r.vence && r.vence < TODAY_ISO;
    const nBajos = lista.filter(bajo).length;
    const items = lista.map((r,i)=>({r,i})).filter(x=>!q || [x.r.nombre,x.r.ubicacion,x.r.tipo,x.r.tamano,x.r.obs].some(v=>(v||'').toLowerCase().includes(q)));
    const heads = t==='plantas'
      ? ['Planta','Dónde está','Tamaño','Cantidad','Mínimo','Observación']
      : ['Producto','Tipo','Cantidad','Mínimo','Vencimiento','Observación'];
    const filas = items.length ? items.map(({r,i})=>{
      const rojo = bajo(r) ? 'background:#fdecea' : '';
      const cant = `<strong style="${bajo(r)?'color:var(--red-alert)':''}">${esc(String(r.cantidad??''))}${t==='productos'&&r.unidad?' '+esc(r.unidad):''}</strong>${bajo(r)?'<div style="font-size:12px;color:var(--red-alert)">Hay que reponer</div>':''}`;
      const min = r.minimo!==''&&r.minimo!=null ? esc(String(r.minimo)) : '—';
      const celdas = t==='plantas'
        ? `<td><strong>${esc(r.nombre)}</strong></td><td>${esc(r.ubicacion)}</td><td>${esc(r.tamano)}</td><td>${cant}</td><td>${min}</td>`
        : `<td><strong>${esc(r.nombre)}</strong></td><td>${esc(r.tipo)}</td><td>${cant}</td><td>${min}</td><td>${r.vence?`<span style="${vencido(r)?'color:var(--red-alert);font-weight:600':''}">${fmtDate(r.vence)}${vencido(r)?' (vencido)':''}</span>`:'—'}</td>`;
      return `<tr style="${rojo}">${celdas}<td style="max-width:240px;white-space:pre-wrap">${esc(r.obs)}</td>
        <td style="white-space:nowrap">${puedeEditar?`<button class="btn-icon" onclick="openStockJardModal('${t}',${i})" title="Editar">${lapiz}</button>`:''}${puedeBorrar?`<button class="btn-icon" style="color:var(--red-alert)" onclick="deleteStockJard('${t}',${i})" title="Eliminar">✕</button>`:''}</td></tr>`;
    }).join('') : `<tr><td colspan="7" style="text-align:center;color:var(--mid-gray);padding:24px">${lista.length?'Nada coincide con la búsqueda':cfg.vacio}</td></tr>`;
    return `<div style="margin-top:32px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div class="section-title" style="margin:0">${cfg.titulo}${nBajos?` <span style="font-size:12px;font-weight:600;color:var(--red-alert)">· ${nBajos} para reponer</span>`:''}</div>
        ${puedeEditar?`<button class="btn-add" onclick="openStockJardModal('${t}',-1)">${cfg.nuevo}</button>`:''}
      </div>
      <input type="text" class="ctrl-search" id="jstock-f-${t}" placeholder="Buscar..." value="${esc(q)}" oninput="stockJardFiltrar('${t}')" style="margin-bottom:12px;max-width:320px">
      <div class="table-wrapper"><table class="stock-table" style="min-width:760px">
        <thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}<th></th></tr></thead>
        <tbody>${filas}</tbody>
      </table></div>
    </div>`;
  };
  const activo = document.activeElement?.id || '';
  box.innerHTML = bloque('plantas') + bloque('productos');
  if(activo.startsWith('jstock-f-')){ const t=document.getElementById(activo); if(t){ t.focus(); t.setSelectionRange(t.value.length,t.value.length); } }
}

function openStockJardModal(t, idx){
  const cfg = STOCK_JARD_CFG[t];
  const r = idx>=0 ? stockJardLista(t)[idx] : null;
  document.getElementById('jstock-tipo').value = t;
  document.getElementById('jstock-idx').value = idx;
  document.getElementById('jstock-modal-title').textContent = (r?'Editar ':'Nuevo ') + (t==='plantas'?'planta':'producto');
  document.getElementById('jstock-campos').innerHTML = cfg.campos.map(c=>{
    const val = r?.[c.k] ?? (c.opts?c.opts[0]:'');
    const id = 'jstock-c-'+c.k;
    const input = c.opts ? `<select class="form-input-modal" id="${id}">${c.opts.map(o=>`<option${o===val?' selected':''}>${o}</option>`).join('')}</select>`
      : c.area ? `<textarea class="form-input-modal" id="${id}" rows="3" maxlength="${c.max}">${esc(String(val))}</textarea>`
      : c.num ? `<input type="number" class="form-input-modal" id="${id}" min="0" step="any" value="${esc(String(val))}">`
      : c.date ? `<input type="date" class="form-input-modal" id="${id}" value="${esc(String(val))}">`
      : `<input type="text" class="form-input-modal" id="${id}" maxlength="${c.max}" value="${esc(String(val))}"${c.ph?` placeholder="${esc(c.ph)}"`:''}>`;
    return `<div class="form-group"><label class="form-label">${c.l}</label>${input}</div>`;
  }).join('');
  document.getElementById('jstock-modal').classList.add('open');
}

function saveStockJard(){
  const t = document.getElementById('jstock-tipo').value;
  const idx = parseInt(document.getElementById('jstock-idx').value);
  const cfg = STOCK_JARD_CFG[t];
  const rec = {};
  cfg.campos.forEach(c=>{
    const v = document.getElementById('jstock-c-'+c.k).value.trim();
    rec[c.k] = c.num ? (v===''?'':Math.max(0, parseFloat(v)||0)) : v;
  });
  if(!rec.nombre){ showToast('Poné el nombre'); return; }
  const lista = stockJardLista(t);
  if(idx>=0) lista[idx]=rec; else lista.push(rec);
  fbSave(cfg.clave, lista);
  closeModal('jstock-modal');
  renderStockJard();
}

async function deleteStockJard(t, idx){
  if(userRole !== 'gerencia'){ showToast('Solo gerencia puede eliminar'); return; }
  if(!await confirmModal('¿Eliminar esta fila?')) return;
  const lista = stockJardLista(t);
  lista.splice(idx,1);
  fbSave(STOCK_JARD_CFG[t].clave, lista);
  renderStockJard();
}

function marcarRecordatorioHecho(idx){
  jardRecordatorios[idx].ultimaVez = TODAY_ISO;
  fbSave('jardRecordatorios', jardRecordatorios);
  renderRecordatoriosJard();
  renderHome();
  showToast('Marcado como hecho hoy');
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
  jardineriaData.forEach(t => {
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
  if(idx<0) window.pushSend?.('Recordatorio nuevo de jardinería', `${rec.tipo} · ${rec.task}`, 'jard-rec', 'roles:jardinero');
  closeModal('jrec-modal');
  renderRecordatoriosJard();
}

async function deleteRecordatorio(idx){
  if(userRole !== 'gerencia'){ showToast('Solo gerencia puede eliminar recordatorios'); return; }
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
  // Punto rojo en la barra inferior mobile (item Avisos )
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
      <span class="jrec-aviso-icon"></span>
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
  showToast(''+msg);
  if(typeof Notification!=='undefined' && Notification.permission==='granted'){
    try{ new Notification('Recordatorios de jardinería', { body:msg, icon:'/icon-192.png', tag:'jard-rec' }); }catch(e){}
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
// okMax: hasta N días = Al día · warnMax: hasta N días = Próxima · más allá = Urgente
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
  <div style="background:#FFFFFF;border:1px solid var(--light-gray);border-radius:12px;padding:14px 16px;margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
      <div style="font-size:12.5px;font-weight:700;color:var(--charcoal);letter-spacing:.3px">
        Umbrales de urgencia <span style="font-weight:400;color:var(--mid-gray)">· ajustá según la estación (en verano se riega más seguido)</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn-secondary" style="font-size:12px;padding:5px 10px" onclick="setUrgenciaPreset('verano')">Verano</button>
        <button class="btn-secondary" style="font-size:12px;padding:5px 10px" onclick="setUrgenciaPreset('primavera')">Primavera</button>
        <button class="btn-secondary" style="font-size:12px;padding:5px 10px" onclick="setUrgenciaPreset('otono')">Otoño</button>
        <button class="btn-secondary" style="font-size:12px;padding:5px 10px" onclick="setUrgenciaPreset('invierno')">Invierno</button>
      </div>
    </div>
    <div style="display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap;margin-top:12px">
      <label style="font-size:12px;color:var(--mid-gray)">Al día hasta (días)
        <input type="number" min="1" max="60" id="urg-ok-${scope}" value="${ok}"
          class="form-input" style="width:90px;padding:6px 8px;font-size:13px;margin-top:4px;display:block">
      </label>
      <label style="font-size:12px;color:var(--mid-gray)">Próxima hasta (días)
        <input type="number" min="2" max="90" id="urg-warn-${scope}" value="${warn}"
          class="form-input" style="width:90px;padding:6px 8px;font-size:13px;margin-top:4px;display:block">
      </label>
      <div style="font-size:12px;color:#B0AFA5;padding-bottom:8px">Urgente: más de <strong id="urg-preview-${scope}">${warn}</strong> días</div>
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
  showToast('Umbrales de '+season+' aplicados');
  renderCtrlJard?.(); renderCtrlHab?.();
}
function saveUrgenciaConfig(scope){
  if(userRole!=='gerencia'){ showToast('Solo gerencia'); return; }
  const okV = parseInt(document.getElementById('urg-ok-'+scope)?.value,10);
  const wV  = parseInt(document.getElementById('urg-warn-'+scope)?.value,10);
  if(isNaN(okV)||isNaN(wV)||okV<1||wV<=okV){ showToast('"Próxima" debe ser mayor que "Al día"'); return; }
  urgenciaConfig = { okMax:okV, warnMax:wV };
  fbSave('urgenciaConfig', urgenciaConfig);
  showToast('Umbrales guardados');
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
  showToast('Fecha actualizada');
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
  if(sec==='Palacio') return '';
  if(sec==='Jardín Central') return '';
  if(sec==='Edificio Posadas') return '';
  return '';
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
  const label = campo==='horaInicio'?icon('play')+'Inicio':icon('stop')+'Fin';
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
  showToast(`Tarea "${nombre.trim()}" agregada`);
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
  showToast('Tarea renombrada');
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
  showToast('Tarea eliminada');
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
  showToast(`Grupo "${g.trim()}" agregado`);
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
  showToast(`Sección "${s.trim()}" creada`);
}

// Al renombrar o borrar zonas, se arrastran las horas y el plan del día que estaban guardados con el nombre viejo
function _jardMoverClaves(fn){
  Object.keys(jardPlanDia).forEach(iso=>{
    Object.keys(jardPlanDia[iso]).forEach(k=>{
      const nk = fn(k.split('|||'));
      if(nk===k) return;
      delete jardPlanDia[iso][k];
      if(nk) jardPlanDia[iso][nk]=true;
    });
    if(!Object.keys(jardPlanDia[iso]).length) delete jardPlanDia[iso];
  });
  fbSave('jardPlanDia', jardPlanDia);
}
function _jardMoverHoras(secOld, grpOld, secNew, grpNew){
  const ko = secOld+'|||'+grpOld;
  if(!zonaHorasData[ko]) return;
  if(secNew!==null) zonaHorasData[secNew+'|||'+grpNew] = zonaHorasData[ko];
  delete zonaHorasData[ko];
  fbSave('zonaHorasData', zonaHorasData);
}
function _jardPoblarSecciones(){
  const sel = document.getElementById('ctrl-jard-section');
  if(!sel) return;
  const cur = sel.value;
  const secs = [...new Set(jardineriaData.map(r=>r.section))];
  sel.innerHTML = '<option value="">Todas las secciones</option>' + secs.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');
  sel.value = secs.includes(cur) ? cur : '';
}
function _jardRefrescarVistas(){
  renderCtrlJard?.();
  renderJardOps?.();
}

async function jardRenameGrupo(section, group){
  if(userRole!=='gerencia') return;
  const nuevo = await promptModal('Nuevo nombre del grupo / zona:', {title:'Renombrar grupo', default:group});
  if(!nuevo || !nuevo.trim() || nuevo.trim()===group) return;
  const n = nuevo.trim();
  jardineriaData.forEach(r=>{ if(r.section===section && r.group===group) r.group = n; });
  _jardMoverClaves(([s,g,t])=> (s===section && g===group) ? [s,n,t].join('|||') : [s,g,t].join('|||'));
  _jardMoverHoras(section, group, section, n);
  _saveJardineria();
  openGestionTareasJard();
  showToast('Grupo renombrado');
}

async function jardDeleteGrupo(section, group){
  if(userRole!=='gerencia') return;
  const cant = jardineriaData.filter(r=>r.section===section && r.group===group).length;
  if(!await confirmModal(`¿Eliminar el grupo "${group}" con sus ${cant} tareas? Se pierde el historial de visitas de ese grupo.`)) return;
  jardineriaData = jardineriaData.filter(r=>!(r.section===section && r.group===group));
  _jardMoverClaves(([s,g,t])=> (s===section && g===group) ? null : [s,g,t].join('|||'));
  _jardMoverHoras(section, group, null, null);
  _saveJardineria();
  openGestionTareasJard();
  showToast('Grupo eliminado');
}

async function jardRenameSeccion(section){
  if(userRole!=='gerencia') return;
  const nuevo = await promptModal('Nuevo nombre de la sección / zona:', {title:'Renombrar sección', default:section});
  if(!nuevo || !nuevo.trim() || nuevo.trim()===section) return;
  const n = nuevo.trim();
  const grupos = [...new Set(jardineriaData.filter(r=>r.section===section).map(r=>r.group))];
  jardineriaData.forEach(r=>{ if(r.section===section) r.section = n; });
  _jardMoverClaves(([s,g,t])=> s===section ? [n,g,t].join('|||') : [s,g,t].join('|||'));
  grupos.forEach(g=>_jardMoverHoras(section, g, n, g));
  _saveJardineria();
  openGestionTareasJard();
  showToast('Sección renombrada');
}

async function jardDeleteSeccion(section){
  if(userRole!=='gerencia') return;
  const cant = jardineriaData.filter(r=>r.section===section).length;
  if(!await confirmModal(`¿Eliminar la sección "${section}" completa, con sus ${cant} tareas? Se pierde el historial de visitas de toda la sección.`)) return;
  const grupos = [...new Set(jardineriaData.filter(r=>r.section===section).map(r=>r.group))];
  jardineriaData = jardineriaData.filter(r=>r.section!==section);
  _jardMoverClaves(([s,g,t])=> s===section ? null : [s,g,t].join('|||'));
  grupos.forEach(g=>_jardMoverHoras(section, g, null, null));
  _saveJardineria();
  openGestionTareasJard();
  showToast('Sección eliminada');
}

function openGestionTareasJard(){
  if(userRole!=='gerencia'){ showToast('Solo gerencia'); return; }
  _jardRefrescarVistas();
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
          <button class="btn-icon" title="Renombrar" onclick="jardRenameTarea(${i})"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>
          <button class="btn-icon" style="color:var(--red-alert)" title="Eliminar" onclick="jardDeleteTarea(${i})">✕</button>
        </div>`;
      }).join('');
      return `<div style="margin:6px 0;border:1px solid var(--light-gray);border-radius:8px;overflow:hidden">
        <div style="padding:7px 12px;background:var(--cream);font-size:12px;font-weight:600;color:var(--charcoal);display:flex;align-items:center;gap:8px">
          <span style="flex:1;min-width:0">${esc(grp)}</span>
          <button class="btn-icon" title="Renombrar grupo" onclick="jardRenameGrupo('${secEsc}','${grpEsc}')"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>
          <button class="btn-icon" style="color:var(--red-alert)" title="Eliminar grupo" onclick="jardDeleteGrupo('${secEsc}','${grpEsc}')">✕</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:1px;background:var(--light-gray)">${tareasHTML}</div>
        <div style="padding:6px 12px;background:var(--warm-white)"><button class="btn-secondary" style="font-size:12px;padding:4px 10px" onclick="jardAddTarea('${secEsc}','${grpEsc}')">+ Agregar tarea</button></div>
      </div>`;
    }).join('');
    return `<div style="margin-bottom:14px;border:1px solid var(--light-gray);border-radius:10px;overflow:hidden">
      <div style="padding:10px 12px;background:var(--ok-soft);font-size:13.5px;font-weight:700;color:var(--sage-dark);display:flex;align-items:center;gap:8px">
        <span style="flex:1;min-width:0">${getSectionEmoji(sec)} ${esc(sec)}</span>
        <button class="btn-icon" title="Renombrar sección" onclick="jardRenameSeccion('${secEsc}')"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>
        <button class="btn-icon" style="color:var(--red-alert)" title="Eliminar sección" onclick="jardDeleteSeccion('${secEsc}')">✕</button>
      </div>
      <div style="padding:8px 10px">${gruposHTML}
        <button class="btn-secondary" style="font-size:12px;padding:4px 10px;margin-top:4px" onclick="jardAddGrupo('${secEsc}')">+ Agregar grupo</button>
      </div>
    </div>`;
  }).join('');
  ov.innerHTML = `<div class="modal" style="max-width:620px;max-height:88vh;overflow-y:auto">
    <button class="modal-close" onclick="closeModal('gestion-tareas-jard-modal')">✕</button>
    <div class="modal-title">Gestionar tareas de jardinería</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:14px">Agregá, renombrá o eliminá secciones, grupos y tareas. Lo que ya está registrado se mantiene. Los cambios se aplican para todos y se sincronizan con el equipo.</div>
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
    <div class="card"><div class="card-label">Urgente</div><div class="card-value red" style="font-size:32px">${kAlert}</div><div class="card-sub">intervenir hoy</div></div>
    <div class="card"><div class="card-label">Próxima</div><div class="card-value amber" style="font-size:32px">${kWarn}</div><div class="card-sub">requieren visita pronto</div></div>
    <div class="card"><div class="card-label">Al día</div><div class="card-value green" style="font-size:32px">${kOk}</div><div class="card-sub">zonas recientes</div></div>`;

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
          <div style="font-size:12px;color:var(--mid-gray);margin-top:1px">${esc(z.section)} · ${z.items.length} tarea${z.items.length!==1?'s':''}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">
          ${z.alertCount?`<span style="background:var(--alert-soft);color:#C62828;padding:3px 9px;border-radius:12px;font-size:12px;font-weight:700">${z.alertCount} urgente${z.alertCount!==1?'s':''}</span>`:''}
          ${z.warnCount ?`<span style="background:#FFF8E1;color:#E65100;padding:3px 9px;border-radius:12px;font-size:12px;font-weight:700">${z.warnCount} pronto</span>`:''}
          ${z.okCount   ?`<span style="background:var(--ok-soft);color:var(--green-ok);padding:3px 9px;border-radius:12px;font-size:12px;font-weight:700">${z.okCount} al día</span>`:''}
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
        ? `<button class="btn-icon" title="${enPlan?'Quitar del plan de hoy':'Marcar para hoy'}" style="flex-shrink:0;font-size:14px" onclick="jardTogglePlanHoy(${i})">${enPlan?'':'☆'}</button>`
        : (enPlan?'<span style="flex-shrink:0;font-size:12px;background:var(--ok-soft);color:var(--sage-dark);padding:2px 7px;border-radius:8px;font-weight:600">Hoy</span>':'');
      const taskEl = document.createElement('div');
      taskEl.style.cssText = 'background:var(--warm-white);padding:14px;display:flex;flex-direction:column;gap:8px'+(enPlan?';box-shadow:inset 3px 0 0 var(--sage-dark)':'');
      taskEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div style="font-size:12px;font-weight:600;color:var(--charcoal);flex:1;line-height:1.4">${esc(r.task)}</div>
          ${planCtrl}
          <span style="flex-shrink:0;font-size:15px" title="Estado">${badge.status==='ok'?'':badge.status==='warn'?'':badge.status==='alert'?'':''}</span>
        </div>
        <div style="font-size:12px;color:var(--mid-gray)">${r.last?fmtDate(r.last):'<em>Sin registro</em>'} · ${getMonthVisits(r)} este mes</div>
        <textarea id="jops-obs-${i}" class="cl-obs-input" placeholder="Observaciones..." style="width:100%;font-size:12px;resize:vertical;min-height:44px;padding:5px 7px;border-radius:4px;border:1px solid var(--light-gray);font-family:inherit;background:var(--warm-white)"
          onchange="jardineriaData[${i}].obs=this.value">${esc(r.obs||'')}</textarea>
        <div style="display:flex;gap:8px;align-items:center">
          <div style="flex:1;text-align:center">
            <div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Inicio</div>
            ${jopsHoraCell(i,'horaInicio',r)}
          </div>
          <div style="flex:1;text-align:center">
            <div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Fin</div>
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
      ${jopsFilter==='all'?'Sin tareas cargadas.':jopsFilter==='plan'?(jardHayPlanHoy()?'Todas las tareas de hoy completadas.':'Gerencia todavía no marcó tareas para hoy. Se ven todas en «Todas».'):'Sin zonas en esta categoría.'}
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
  const label = campo==='horaInicio' ? icon('play')+'Inicio' : icon('stop')+'Fin';
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
  if(!nombre){ showToast('No hay jardinero identificado'); return; }
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
  showToast(campo==='inicio' ? 'Jornada iniciada: '+hh+':'+mm : 'Jornada finalizada: '+hh+':'+mm);
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
      <span style="font-size:20px"></span>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;color:var(--mid-gray);margin-bottom:2px">Mi jornada de hoy</div>
        <div style="font-size:17px;font-weight:700;color:var(--charcoal)">${esc(nombre||'—')}</div>
      </div>
      ${nombre && tareasHoy > 0 ? `<div style="text-align:center;min-width:60px">
        <div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Tareas hoy</div>
        <div style="font-size:26px;font-weight:700;color:var(--charcoal)">${tareasHoy}</div>
      </div>` : ''}
      ${dur > 0 ? `<div style="text-align:center;min-width:70px">
        <div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">${fin?'Horas':'Transcurrido'}</div>
        <div style="font-size:22px;font-weight:700;color:${fin?'var(--charcoal)':'var(--green-ok)'}">${fmtDur(dur)}</div>
      </div>` : ''}
    </div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--light-gray)">
      <span style="font-size:12px;color:var(--mid-gray);font-weight:600">Jornada:</span>
      ${inicio
        ? `<span onclick="jardResetHoraTurno('inicio')" title="Tocar para borrar" style="font-size:13px;font-weight:700;color:var(--accent);background:var(--ok-soft);padding:4px 12px;border-radius:8px;cursor:pointer">▶ ${inicio}</span>`
        : `<button class="btn-hora-inicio" onclick="jardRegistrarHoraTurno('inicio')">${icon('play')}Inicio de jornada</button>`}
      ${fin
        ? `<span onclick="jardResetHoraTurno('fin')" title="Tocar para borrar" style="font-size:13px;font-weight:700;color:var(--red-alert);background:var(--alert-soft);padding:4px 12px;border-radius:8px;cursor:pointer">${icon('stop')}${fin}</span>`
        : inicio ? `<button class="btn-hora-fin" onclick="jardRegistrarHoraTurno('fin')">${icon('stop')}Fin de jornada</button>` : ''}
    </div>
  </div>`;
}

// ── Turno Florista ────────────────────────────────────────────────────────────
// Almacena check-in/checkout real de cada florista (separado del horario planificado)
// Firebase path: florTurnos/{nombre}/{YYYY-MM-DD}/{inicio, fin}

function florRegistrarTurno(campo){
  if(!floristaNombre){ showToast('Error de sesión'); return; }
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
  showToast(campo==='inicio' ? 'Jornada iniciada: '+hh+':'+mm : 'Jornada finalizada: '+hh+':'+mm);
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
      <span style="font-size:20px"></span>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;color:var(--mid-gray);margin-bottom:2px">Mi jornada de hoy</div>
        <div style="font-size:17px;font-weight:700;color:var(--charcoal)">${esc(floristaNombre)}</div>
      </div>
      ${myTotal > 0 ? `<div style="text-align:center;min-width:60px">
        <div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Tareas</div>
        <div style="font-size:26px;font-weight:700;color:${taskColor}">${myDone}/${myTotal}</div>
      </div>` : ''}
      ${dur > 0 ? `<div style="text-align:center;min-width:70px">
        <div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">${fin?'Horas':'Transcurrido'}</div>
        <div style="font-size:22px;font-weight:700;color:${fin?'var(--charcoal)':'var(--green-ok)'}">${fmtDur(dur)}</div>
      </div>` : ''}
    </div>
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--light-gray)">
      <span style="font-size:12px;color:var(--mid-gray);font-weight:600">Jornada:</span>
      ${inicio
        ? `<span onclick="florResetTurno('inicio')" title="Tocar para borrar" style="font-size:13px;font-weight:700;color:var(--accent);background:var(--ok-soft);padding:4px 12px;border-radius:8px;cursor:pointer">▶ ${inicio}</span>`
        : `<button class="btn-hora-inicio" onclick="florRegistrarTurno('inicio')">${icon('play')}Inicio de jornada</button>`}
      ${fin
        ? `<span onclick="florResetTurno('fin')" title="Tocar para borrar" style="font-size:13px;font-weight:700;color:var(--red-alert);background:var(--alert-soft);padding:4px 12px;border-radius:8px;cursor:pointer">${icon('stop')}${fin}</span>`
        : inicio ? `<button class="btn-hora-fin" onclick="florRegistrarTurno('fin')">${icon('stop')}Fin de jornada</button>` : ''}
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
    let calHtml = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-top:12px;font-size:12px">`;
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
        <div style="font-size:12px;font-weight:600;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Últimos días trabajados</div>
        <div id="jard-prod-act-${nombre.replace(/\s/g,'_')}" style="display:flex;flex-direction:column;gap:8px">
          ${diasConActividad.map(([fecha, dd]) => _jardDiaHTML(nombre, fecha, dd)).join('')}
        </div>
      </div>`;
    }

    html += `<div style="background:var(--surface-1);border:1px solid var(--light-gray);border-radius:8px;padding:16px;margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px"></span>
          <span style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--charcoal)">${esc(nombre)}</span>
        </div>
        <div style="display:flex;gap:20px;flex-wrap:wrap">
          <div style="text-align:center"><div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Horas mes</div><div style="font-size:22px;font-weight:700;color:var(--charcoal)">${fmtDur(totalMin)}</div></div>
          <div style="text-align:center"><div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Días</div><div style="font-size:22px;font-weight:700;color:var(--charcoal)">${diasTrabajados}</div></div>
          <div style="text-align:center"><div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Prom. diario</div><div style="font-size:22px;font-weight:700;color:var(--green-ok)">${avgHoras>0?fmtDur(avgHoras):'—'}</div></div>
          <div style="text-align:center"><div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Tareas mes</div><div style="font-size:22px;font-weight:700;color:var(--charcoal)">${tareasTotal}</div></div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--mid-gray)">≥6h &nbsp;2-6h &nbsp;&lt;2h &nbsp;· Tocá un día para ver el detalle</div>
      ${calHtml}
      ${actividadHtml}
    </div>`;
  });
  el.innerHTML = html;
}

function _jardDiaHTML(nombre, fecha, dd){
  const tareasItems = dd.tareas.map(t => `
    <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid var(--surface-2)">
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600;color:var(--charcoal)">${esc(t.task)}</div>
        <div style="font-size:12px;color:var(--mid-gray)">${esc(t.group)} · ${esc(t.section)}</div>
        ${t.obs ? `<div style="font-size:12px;color:#5A5A50;margin-top:2px;font-style:italic">"${esc(t.obs)}"</div>` : ''}
      </div>
      ${t.horaInicio||t.horaFin ? `<div style="text-align:right;white-space:nowrap;font-size:12px;color:var(--mid-gray)">
        ${t.horaInicio?icon('play')+t.horaInicio:''}${t.horaFin?' · '+icon('stop')+t.horaFin:''}
        ${t.horaInicio&&t.horaFin?'<br><span style="color:var(--green-ok);font-weight:600">'+fmtDur(calcDuracion(t.horaInicio,t.horaFin))+'</span>':''}
      </div>` : ''}
    </div>`).join('');

  return `<div style="border:1px solid var(--light-gray);border-radius:6px;overflow:hidden">
    <div style="background:var(--cream);padding:8px 12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;cursor:pointer"
         onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:12px;font-weight:700;color:var(--charcoal)">${fmtDate(fecha)}</span>
        ${dd.inicio ? `<span style="font-size:12px;color:var(--mid-gray)">${icon('play')}${dd.inicio}${dd.fin?' · '+icon('stop')+dd.fin:' · en curso'}</span>` : ''}
      </div>
      <div style="display:flex;gap:12px;align-items:center">
        ${dd.dur>0 ? `<span style="font-size:12px;font-weight:700;color:var(--green-ok)">${fmtDur(dd.dur)}</span>` : ''}
        <span style="font-size:12px;color:var(--mid-gray)">${dd.tareas.length} tarea${dd.tareas.length!==1?'s':''}</span>
        <span style="font-size:12px;color:var(--mid-gray)">▾</span>
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
  _jardPoblarSecciones();
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
    <div class="card"><div class="card-label">Al día</div><div class="card-value green" style="font-size:32px">${kOk}</div><div class="card-sub">zonas recientes</div></div>
    <div class="card"><div class="card-label">Próxima</div><div class="card-value amber" style="font-size:32px">${kWarn}</div><div class="card-sub">requieren visita pronto</div></div>
    <div class="card"><div class="card-label">Urgente</div><div class="card-value red" style="font-size:32px">${kAlert}</div><div class="card-sub">intervenir hoy</div></div>
    <div class="card"><div class="card-label">Sin registro</div><div class="card-value" style="font-size:32px;color:var(--mid-gray)">${kNone}</div><div class="card-sub">primer registro pendiente</div></div>
    <div class="card"><div class="card-label">Visitas este mes</div><div class="card-value" style="font-size:32px;color:var(--charcoal)">${totalMesJard}</div><div class="card-sub">${fmtMonth(CURR_MONTH)}</div></div>`;

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
      gr.innerHTML=`<td colspan="7">${esc(r.group)}</td>`;
      tbody.appendChild(gr);
    }

    const monthVisits=getMonthVisits(r);
    const alCls=badge.status==='ok'?'ok':badge.status==='warn'?'atencion':'comprar';
    const alLbl=badge.status==='ok'?'Al día':badge.status==='warn'?'Próxima':badge.status==='alert'?'Urgente':'Sin datos';
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>
        <div style="font-weight:600;font-size:13px;color:var(--charcoal);line-height:1.4">${esc(r.group)}</div>
        <span class="section-pill ${getSectionPillCls(r.section)}" style="margin-top:4px;display:inline-block">${esc(r.section)}</span>
      </td>
      <td style="font-size:13px;color:var(--charcoal)">${esc(r.task)}</td>
      <td style="font-size:12.5px;color:var(--mid-gray);white-space:nowrap">
        ${ userRole==='gerencia'
          ? `<input type="date" value="${r.last||''}" max="${TODAY_ISO}"
               onchange="gerenciaSetFecha('jard',${i},this.value)"
               title="Editar fecha de última visita"
               style="font-size:12px;padding:4px 6px;border:1px solid var(--light-gray);border-radius:6px;color:var(--charcoal)">`
          : (r.last ? fmtDate(r.last) : '<em style="color:#B0AFA5;font-size:12px">Sin registro</em>') }
        ${ r.last ? `<div style="font-size:12px;color:#B0AFA5;margin-top:3px">${_diasDesdeTxt(r.last)}</div>` : '' }
      </td>
      <td>
        <span class="alerta-badge ${alCls}"
          style="font-size:12px;padding:3px 10px;${badge.status==='none'?'background:#ECEAE4;color:var(--mid-gray)':''}">
          ${alLbl}
        </span>
      </td>
      <td style="text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:400;color:var(--charcoal)">
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
    <div class="card"><div class="card-label">Urgente</div><div class="card-value red" style="font-size:32px">${kAlert}</div><div class="card-sub">visitar hoy</div></div>
    <div class="card"><div class="card-label">Próxima</div><div class="card-value amber" style="font-size:32px">${kWarn}</div><div class="card-sub">próxima visita</div></div>
    <div class="card"><div class="card-label">Al día</div><div class="card-value green" style="font-size:32px">${kOk}</div><div class="card-sub">al día</div></div>`;

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
        <div style="font-size:20px;font-weight:600;color:var(--charcoal);font-family:'Cormorant Garamond',serif">Hab. ${esc(r.hab)}</div>
        <span class="days-badge ${badge.cls}" style="flex-shrink:0">${badge.label}</span>
      </div>
      ${r.comentarioHK ? `<div style="background:var(--amber-soft);border:1px solid #E9D8B0;border-radius:6px;padding:8px 11px;font-size:12.5px;color:#8A5A16;line-height:1.4"><strong>Housekeeping:</strong> ${esc(r.comentarioHK)}</div>` : ''}
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--mid-gray)">
        <span>Última visita: ${r.last ? fmtDate(r.last) : '<em>Sin registro</em>'}</span>
        <span style="font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--charcoal)" title="Visitas este mes">${monthVisits} <span style="font-size:12px;color:var(--mid-gray)">este mes</span></span>
      </div>
      <textarea id="hops-obs-${i}" class="cl-obs-input" placeholder="Observaciones..." style="width:100%;font-size:12px;resize:vertical;min-height:44px;padding:5px 7px;border-radius:4px;border:1px solid var(--light-gray);font-family:inherit;background:var(--warm-white)"
        onchange="habitacionesData[${i}].notas=this.value">${esc(r.notas||'')}</textarea>
      <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
        <select id="hops-quien-${i}" class="cl-select" style="font-size:12px;padding:5px 8px;flex:1">
          <option value="">— Jardinero —</option>
          ${JARDINEROS_LIST.map(n=>`<option ${n===(jardineroNombre||jardCurrentJardinero)?'selected':''}>${esc(n)}</option>`).join('')}
        </select>
        <button class="mark-done-btn" style="flex:1" onclick="hopsVisita(${i})">✓ Visité hoy</button>
      </div>`;
    grid.appendChild(card);
  });

  if(grid.children.length === 0){
    grid.innerHTML = `<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--mid-gray);font-size:14px">
      ${hopsFilter==='all' ? 'Sin habitaciones cargadas.' : 'Sin habitaciones en esta categoría.'}
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
  const label = campo==='horaInicio' ? icon('play')+'Inicio' : icon('stop')+'Fin';
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
    <div class="card"><div class="card-label">Al día</div><div class="card-value green" style="font-size:32px">${kOk}</div><div class="card-sub">visitadas recientemente</div></div>
    <div class="card"><div class="card-label">Próxima</div><div class="card-value amber" style="font-size:32px">${kWarn}</div><div class="card-sub">programar ingreso</div></div>
    <div class="card"><div class="card-label">Urgente</div><div class="card-value red" style="font-size:32px">${kAlert}</div><div class="card-sub">ingresar esta semana</div></div>
    <div class="card"><div class="card-label">Total registradas</div><div class="card-value" style="font-size:32px">${habitacionesData.length}</div><div class="card-sub">habitaciones con plantas</div></div>
    <div class="card"><div class="card-label">Visitas este mes</div><div class="card-value" style="font-size:32px;color:var(--charcoal)">${totalMesHab}</div><div class="card-sub">${fmtMonth(CURR_MONTH)}</div></div>`;

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
    const alLbl=badge.status==='ok'?'Al día':badge.status==='warn'?'Próxima':'Urgente';
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td><span class="hab-num">Hab. ${esc(r.hab)}</span></td>
      <td style="font-size:12.5px;color:var(--mid-gray);white-space:nowrap">
        ${ userRole==='gerencia'
          ? `<input type="date" value="${r.last||''}" max="${TODAY_ISO}"
               onchange="gerenciaSetFecha('hab',${i},this.value)"
               title="Editar fecha de última visita"
               style="font-size:12px;padding:4px 6px;border:1px solid var(--light-gray);border-radius:6px;color:var(--charcoal)">`
          : (r.last ? fmtDate(r.last) : '<em style="color:#B0AFA5">—</em>') }
        ${ r.last ? `<div style="font-size:12px;color:#B0AFA5;margin-top:3px">${_diasDesdeTxt(r.last)}</div>` : '' }
      </td>
      <td>
        <span class="alerta-badge ${alCls}" style="font-size:12px;padding:3px 10px">${alLbl}</span>
      </td>
      <td style="text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:400;color:var(--charcoal)">
        ${monthVisits}
      </td>
      <td>
        ${isHK
          ? '<span style="color:var(--mid-gray);font-size:12px">solo lectura</span>'
          : `<div style="display:flex;gap:6px;align-items:center">
          <select id="hab-quien-${i}" class="cl-select" style="font-size:12px;padding:5px 8px;flex:1">
            <option value="">— Jardinero —</option>
            ${JARDINEROS_LIST.map(n=>`<option ${n===(jardineroNombre||jardCurrentJardinero)?'selected':''}>${esc(n)}</option>`).join('')}
          </select>
          <button class="mark-done-btn" onclick="markHabDone(${i},document.getElementById('hab-quien-${i}').value)">✓ Ingresé</button>
        </div>`}
      </td>
      <td style="vertical-align:middle">
        ${isHK
          ? `<span style="font-size:12.5px;color:var(--mid-gray)">${esc(r.notas||'—')}</span>`
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
    quien: quien || jardCurrentJardinero || '',
    obs: r.notas || '',
    horaInicio: r.horaInicio || '',
    horaFin: r.horaFin || ''
  });
  r.last = TODAY_ISO;
  r.liveVisits = (r.liveVisits||0)+1;
  if(!r.monthlyVisits) r.monthlyVisits={};
  r.monthlyVisits[CURR_MONTH] = (r.monthlyVisits[CURR_MONTH]||0)+1;
  r.quien = ''; r.notas = ''; r.comentarioHK = ''; r.canUndo = false;
  r.horaInicio = ''; r.horaFin = '';  // reiniciar el cronómetro (ya quedó en el log)
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
        <th style="text-align:left;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase;background:var(--cream)">Secci&oacute;n</th>
        <th style="text-align:left;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase;background:var(--cream)">Zona</th>
        <th style="text-align:left;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase;background:var(--cream)">Tarea</th>
        <th style="text-align:center;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase;background:var(--cream)">Visitas</th>
      </tr></thead><tbody>
      ${rows.map(r=>`<tr>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);font-size:12px;color:var(--mid-gray)">${esc(r.section)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);color:var(--mid-gray);font-size:12px">${esc(r.group)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);font-weight:500">${esc(r.task)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--charcoal)">${getMonthVisits(r,ym)}</td>
      </tr>`).join('')}</tbody></table>`
    : `<div style="padding:20px;text-align:center;color:var(--mid-gray)">Sin visitas registradas para ${fmtMonth(ym)}.</div>`;
  el.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
      <span style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:500">Mes:</span>${pills}
    </div>
    <div style="background:var(--cream);border-radius:8px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:500;margin-bottom:4px">${fmtMonth(ym)}</div>
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
        <th style="text-align:left;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase;background:var(--cream)">Habitaci&oacute;n</th>
        <th style="text-align:center;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase;background:var(--cream)">Visitas</th>
      </tr></thead><tbody>
      ${rows.map(r=>`<tr>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);font-weight:600;font-family:'Cormorant Garamond',serif;font-size:16px">Hab. ${esc(r.hab)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--charcoal)">${getMonthVisits(r,ym)}</td>
      </tr>`).join('')}</tbody></table>`
    : `<div style="padding:20px;text-align:center;color:var(--mid-gray)">Sin visitas registradas para ${fmtMonth(ym)}.</div>`;
  el.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
      <span style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:500">Mes:</span>${pills}
    </div>
    <div style="background:var(--cream);border-radius:8px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:500;margin-bottom:4px">${fmtMonth(ym)}</div>
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
    <td style="font-size:12px;color:var(--mid-gray)">${esc(r.section||'')}</td>
    <td style="font-size:12px">${esc(r.group||'')}</td>
    <td style="font-size:12px;font-weight:500">${esc(r.task||'')}</td>
    <td><span class="responsable-tag" style="font-size:12px">${esc(r.quien||'—')}</span></td>
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
    <td><span class="responsable-tag" style="font-size:12px">${esc(r.quien||'—')}</span></td>
    <td style="font-size:12px;color:var(--mid-gray)">${esc(r.obs||'—')}</td>
  </tr>`).join('');
  el.innerHTML = `<div class="table-wrapper"><table class="ctrl-table"><thead><tr>
    <th>Fecha</th><th>Habitación</th><th>Responsable</th><th>Observaciones</th>
  </tr></thead><tbody>${rows}</tbody></table></div>`;
}

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
      opts += '<optgroup label="Composiciones">';
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
      opts += `<optgroup label="${cat.emoji||''} ${esc(cat.cat)}">`;
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
      <div style="font-size:40px;margin-bottom:10px"></div>
      <div style="font-size:15px;font-weight:600;color:var(--mid-gray)">No hay ramos armados en este momento</div>
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
      : `<div class="lp-card-photo-placeholder" style="cursor:default"><span style="font-size:28px"></span></div>`;
    return `<div class="lp-card">
      ${foto}
      <div class="lp-card-body">
        ${r.categoria?`<span class="section-pill" style="background:var(--ok-soft);color:var(--sage-dark);display:inline-block;margin-bottom:6px">${esc(r.categoria)}</span>`:''}
        <div class="lp-card-name" style="font-weight:600">${esc(r.nombre)}</div>
        <div class="lp-card-desc" style="min-height:auto;color:var(--mid-gray);font-size:12.5px;margin:4px 0 8px">${esc(r.desc||'')}</div>
        <div class="lp-card-footer">
          <div class="lp-price-input" style="font-weight:700;color:var(--charcoal)">${esc(r.precio||'A consultar')}</div>
          <div class="lp-card-actions" style="display:flex;gap:6px">
            <button class="btn-add" style="padding:6px 12px;font-size:12px" onclick="openVentaRamo(${i})">✓ Vender</button>
            ${userRole!=='ventas' ? `<button class="btn-icon" onclick="cambiarFotoRamo(${i})" title="Cambiar foto"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-2h5L16 7"/></svg></button>` : ''}
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
    showToast('No hay productos cargados en la Lista de Precios');
    return;
  }
  catSel.innerHTML = '<option value="">— Seleccionar categoría —</option>' +
    listaPreciosData.map((c,i)=> (c.items||[]).length
      ? `<option value="${i}">${c.emoji||''} ${esc(c.cat)}</option>` : '').join('');
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
  info.innerHTML = `${it.desc?`${esc(it.desc)}<br>`:''}<span style="color:var(--mid-gray)">Precio: <strong style="color:var(--charcoal)">${esc(it.precio||'A consultar')}</strong></span>`;
}

function saveRamo(){
  const ciV = document.getElementById('ramo-cat-sel').value;
  const iiV = document.getElementById('ramo-prod-sel').value;
  if(ciV === '' || iiV === ''){ showToast('Elegí categoría y producto'); return; }
  const cat = listaPreciosData[+ciV];
  const it  = cat?.items[+iiV];
  if(!it){ showToast('Producto no válido'); return; }
  const fileInput = document.getElementById('ramo-foto');
  const file = fileInput?.files?.[0];
  if(!file){ showToast('Agregá la foto del ramo que armaste'); return; }

  const ramo = {
    nombre: it.nombre,
    desc: it.desc || '',
    precio: it.precio || 'A consultar',
    categoria: cat.cat,
    foto: '',
    creado: TODAY_ISO,
    quien: floristaNombre || window.currentUserLabel || ''
  };
  comprimirImagen(file, 1000, 0.7, data => {
    ramo.foto = data;
    ramosDispData.push(ramo);
    fbSave('ramosDispData', ramosDispData);
    closeModal('ramo-modal');
    renderRamosDisp();
    showToast('Ramo cargado');
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
        showToast('Foto actualizada');
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
      <div style="font-size:40px;margin-bottom:10px"></div>
      <div style="font-size:15px;font-weight:600;color:var(--mid-gray)">Todavía no cargaste floreros</div>
      <div style="font-size:13px;margin-top:6px">Cargá tus floreros con foto y cantidad con "+ Agregar florero".</div></div>`;
    return;
  }
  const vis = florerosData.map((f,i)=>({f,i})).filter(({f})=>!search || (f.nombre||'').toLowerCase().includes(search) || (f.notas||'').toLowerCase().includes(search));
  if(!vis.length){ grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--mid-gray)">Sin resultados para "${esc(search)}".</div>`; return; }
  grid.innerHTML = vis.map(({f,i})=>{
    const cant = +f.cantidad||0;
    const foto = f.foto
      ? `<img class="lp-card-photo" src="${f.foto}" style="cursor:pointer" onclick="openFlorFoto(${i})">`
      : `<div class="lp-card-photo-placeholder"><span style="font-size:30px"></span></div>`;
    return `<div class="lp-card">
      ${foto}
      <div class="lp-card-body">
        <div class="lp-card-name" style="font-weight:600">${esc(f.nombre||'Florero')}</div>
        ${f.notas?`<div style="font-size:12px;color:var(--mid-gray);margin:2px 0 6px">${esc(f.notas)}</div>`:''}
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <button class="btn-icon" style="border:1px solid var(--light-gray);border-radius:6px;width:30px;height:30px;font-size:18px" onclick="florAjustar(${i},-1)">−</button>
          <span style="min-width:44px;text-align:center;font-size:22px;font-weight:700;color:${cant>0?'var(--charcoal)':'var(--red-alert)'}">${cant}</span>
          <button class="btn-icon" style="border:1px solid var(--light-gray);border-radius:6px;width:30px;height:30px;font-size:18px" onclick="florAjustar(${i},1)">+</button>
          <span style="font-size:12px;color:var(--mid-gray)">en stock</span>
        </div>
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
          <button class="btn-secondary" style="font-size:12px" onclick="openFloreroModal(${i})">Editar</button>
          <button class="btn-icon" onclick="cambiarFotoFlorero(${i})" title="Cambiar foto"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-2h5L16 7"/></svg></button>
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
  showToast('Florero guardado');
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
      if(florerosData[i]){ florerosData[i].foto=data; window._florerosLastSave=Date.now(); fbSave('florerosData', florerosData); renderFloreros(); showToast('Foto actualizada'); }
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
    `<strong>${esc(r.nombre)}</strong>${r.desc?` · ${esc(r.desc)}`:''}<br><span style="color:var(--mid-gray)">Precio: ${esc(r.precio||'A consultar')}</span>`;
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
    'Ramo vendido',
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
  showToast('Venta registrada en Ventas Externas');
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
  if(!prod || prod === '__otro__'){ showToast('Seleccioná el arreglo o ramo'); return; }
  const cliente = document.getElementById('vd-cliente')?.value?.trim();
  if(!cliente){ showToast('Ingresá el nombre del cliente'); return; }

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
  showToast('Venta directa registrada');
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
    <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px;font-weight:500">${label}</div>
    <div style="font-size:26px;font-weight:700;color:${color};line-height:1">${value}</div>
    ${sub ? `<div style="font-size:12px;color:var(--mid-gray);margin-top:4px">${sub}</div>` : ''}
  </div>`;
}

// ── Reportes Equipo ───────────────────────────────────────────────────────────
// ── AUDITORÍA DE CAMBIOS ──────────────────────────────────────────────────────
let auditLogData = {};
window._setAuditLog = (val) => { auditLogData = val && typeof val === 'object' ? val : {}; };
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
    <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">${label}</div>
    <div style="font-size:23px;font-weight:700;color:${color||'var(--charcoal)'};line-height:1.1">${value}</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-top:4px">${sub||''}</div>
  </div>`;
  const cumplCol = m.cumplimiento==null?'var(--mid-gray)':m.cumplimiento>=80?'var(--green-ok)':m.cumplimiento>=50?'#D4A820':'var(--red-alert)';
  const asisCol  = m.asistencia==null?'var(--mid-gray)':m.asistencia>=90?'var(--green-ok)':m.asistencia>=70?'#D4A820':'var(--red-alert)';
  const stars = m.evalProm!=null ? '★'.repeat(Math.round(m.evalProm))+'☆'.repeat(5-Math.round(m.evalProm)) : '—';
  ov.innerHTML = `<div class="modal" style="max-width:640px;max-height:88vh;overflow-y:auto">
    <button class="modal-close" onclick="closeModal('ficha-empleado-modal')">✕</button>
    <div class="modal-title">${esc(nombre)}</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:16px">Ficha del mes · ${esc(fmtMonth(mesISO))} · ${isJardinero(nombre)?'Jardinería':'Florería'}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">
      ${card('Asistencia', (m.asistencia!=null?m.asistencia+'%':'—'), `${m.diasFichados}/${m.diasProg} días fichados`, asisCol)}
      ${card('Puntualidad', m.diasTarde+(m.diasTarde===1?' tarde':' tarde'), m.minTarde?`${m.minTarde} min acumulados`:'sin demoras', m.diasTarde?'#D4A820':'var(--green-ok)')}
      ${card('Cumplimiento hs', (m.cumplimiento!=null?m.cumplimiento+'%'+trend(m.cumplimiento,prev.cumplimiento):'—'), `${m.hsTrab}h de ${m.hsProg}h`, cumplCol)}
      ${card('Tareas hechas', m.tareasHechas, m.tareasExcedidas?`${m.tareasExcedidas} pasadas de tiempo`:'en tiempo', 'var(--charcoal)')}
      ${card('Evaluación', stars, m.evalCount?`prom ${m.evalProm.toFixed(1)} · ${m.evalCount} eval`:'sin evaluar', 'var(--charcoal)')}
      ${card('Llamados de atención', m.llamados, 'este mes', m.llamados?'var(--red-alert)':'var(--green-ok)')}
    </div>
    ${m.llamadosList.length?`<div style="margin-top:18px"><div class="card-label">Llamados de atención del mes</div>${m.llamadosList.map(l=>`<div style="display:flex;gap:8px;align-items:center;padding:7px 0;border-top:1px solid var(--surface-2);font-size:12px">${l.foto?`<img src="${l.foto}" onclick="verFotoLlamado(${l.id})" style="width:34px;height:34px;object-fit:cover;border-radius:5px;cursor:pointer">`:'<span style="color:var(--amber)"></span>'}<span style="flex:1">${esc(l.zona||'Arreglo')}${l.nota?' — '+esc(l.nota):''}</span><span style="color:var(--mid-gray);font-size:12px">${fmtDate(l.fecha)}</span></div>`).join('')}</div>`:''}
  </div>`;
  ov.classList.add('open');
}

// ── Análisis de desempeño por empleado y período (RRHH › Evaluaciones) ────────
// Unifica el trabajo REAL de las tres áreas (Florería/checklist, Jardinería y
// Habitaciones) en un rango de fechas para poder evaluar desempeño con datos
// concretos: cuántas tareas hizo, promedio de tiempo por tarea y desglose.
// Rango lunes–domingo de la semana que contiene a `d` (Date). Devuelve ISO.
function _rangoSemana(d){
  const iso = x => x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (base.getDay()+6)%7; // 0=lunes … 6=domingo
  const lun = new Date(base); lun.setDate(base.getDate()-dow);
  const dom = new Date(lun);  dom.setDate(lun.getDate()+6);
  return { desde: iso(lun), hasta: iso(dom) };
}

function _enRangoFecha(fecha, desde, hasta){
  const f = String(fecha||'').slice(0,10);
  if(!f) return false;
  if(desde && f < desde) return false;
  if(hasta && f > hasta) return false;
  return true;
}

// Compara nombres de forma tolerante (ignora mayúsculas, acentos y espacios de
// más). El selector de empleados usa el floristaNombre del login y el historial
// guarda el "responsable", que pueden diferir en mayúsculas/acentos.
function _mismoNombre(a, b){
  const norm = s => _evStripAcc(String(s||'')).replace(/\s+/g,' ').trim();
  return norm(a) === norm(b) && norm(a) !== '';
}

function _metricasEmpleadoPeriodo(nombre, desde, hasta){
  const areas = {
    'Florería':     { n:0, min:0, conTiempo:0, excedidas:0 },
    'Jardinería':   { n:0, min:0, conTiempo:0, excedidas:0 },
    'Habitaciones': { n:0, min:0, conTiempo:0, excedidas:0 },
  };
  const detalle = [];
  const porTarea = new Map(); // area|desc → {area, desc, n, min, conTiempo}
  const addTarea = (area, desc, dur) => {
    const k = area+'|'+desc;
    if(!porTarea.has(k)) porTarea.set(k, {area, desc, n:0, min:0, conTiempo:0});
    const o = porTarea.get(k);
    o.n++; if(dur){ o.min += dur; o.conTiempo++; }
  };

  (checklistHistory||[]).forEach(e=>{
    if(!_mismoNombre(e.who, nombre) || !_enRangoFecha(e.date, desde, hasta)) return;
    const dur = (parseInt(e.duracion)||0) || calcDuracion(e.inicio||'', e.fin||'') || 0;
    const a = areas['Florería']; a.n++; if(dur){ a.min+=dur; a.conTiempo++; } if(e.excedida) a.excedidas++;
    const desc = (e.zona||'Arreglo') + (e.actividad?(' · '+e.actividad):'');
    detalle.push({ fecha:e.date, area:'Florería', desc, dur, excedida:!!e.excedida, inicio:e.inicio||'', fin:e.fin||'' });
    addTarea('Florería', desc, dur);
  });
  (jardineriaLog||[]).forEach(e=>{
    if(!_mismoNombre(e.quien, nombre) || !_enRangoFecha(e.fecha, desde, hasta)) return;
    const dur = calcDuracion(e.horaInicio||'', e.horaFin||'') || 0;
    const a = areas['Jardinería']; a.n++; if(dur){ a.min+=dur; a.conTiempo++; }
    const desc = (e.group?e.group+' · ':'') + (e.task||'Tarea');
    detalle.push({ fecha:e.fecha, area:'Jardinería', desc, dur, excedida:false, inicio:e.horaInicio||'', fin:e.horaFin||'' });
    addTarea('Jardinería', desc, dur);
  });
  (habitacionesLog||[]).forEach(e=>{
    if(!_mismoNombre(e.quien, nombre) || !_enRangoFecha(e.fecha, desde, hasta)) return;
    const dur = calcDuracion(e.horaInicio||'', e.horaFin||'') || 0;
    const a = areas['Habitaciones']; a.n++; if(dur){ a.min+=dur; a.conTiempo++; }
    const desc = 'Hab. ' + (e.hab||'');
    detalle.push({ fecha:e.fecha, area:'Habitaciones', desc, dur, excedida:false, inicio:e.horaInicio||'', fin:e.horaFin||'' });
    addTarea('Habitaciones', desc, dur);
  });

  detalle.sort((a,b)=> (b.fecha||'').localeCompare(a.fecha||''));
  const total = { n:0, min:0, conTiempo:0, excedidas:0 };
  Object.values(areas).forEach(a=>{ total.n+=a.n; total.min+=a.min; total.conTiempo+=a.conTiempo; total.excedidas+=a.excedidas; });
  const tareas = [...porTarea.values()].sort((a,b)=> b.n - a.n || b.min - a.min);
  return { areas, total, detalle, tareas };
}

// Poblar selector de empleados + período por defecto (últimos 2 meses)
function initPerfPanel(){
  const sel = document.getElementById('perf-empleado');
  if(!sel) return;
  const actual = sel.value;
  sel.innerHTML = '<option value="">'+(legajoData.length?'— Seleccionar empleado —':'— Sin legajos: cargalos en RRHH › Legajo —')+'</option>' + _empleadosLegajoOpts();
  if(actual) sel.value = actual;
  const dd = document.getElementById('perf-desde'), hh = document.getElementById('perf-hasta');
  const iso = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  if(dd && !dd.value){
    const hoy = new Date();
    dd.value = iso(new Date(hoy.getFullYear(), hoy.getMonth()-2, 1));
    if(hh && !hh.value) hh.value = iso(hoy);
  }
}

function perfPreset(kind){
  const hoy = new Date();
  const iso = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  let desde;
  let hasta = iso(hoy);
  if(kind==='semana'){ const r = _rangoSemana(hoy); desde = r.desde; hasta = r.hasta; }
  else if(kind==='mes')       desde = iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  else if(kind==='2m')   desde = iso(new Date(hoy.getFullYear(), hoy.getMonth()-2, 1));
  else if(kind==='3m')   desde = iso(new Date(hoy.getFullYear(), hoy.getMonth()-3, 1));
  else if(kind==='trim'){ const q = Math.floor(hoy.getMonth()/3); desde = iso(new Date(hoy.getFullYear(), q*3, 1)); }
  else if(kind==='anio') desde = iso(new Date(hoy.getFullYear(), 0, 1));
  else desde = iso(new Date(hoy.getFullYear(), hoy.getMonth()-2, 1));
  const dd = document.getElementById('perf-desde'), hh = document.getElementById('perf-hasta');
  if(dd) dd.value = desde;
  if(hh) hh.value = hasta;
  renderPerfEmpleado();
}

function renderPerfEmpleado(){
  const body = document.getElementById('perf-body');
  if(!body) return;
  const nombre = document.getElementById('perf-empleado')?.value || '';
  const desde  = document.getElementById('perf-desde')?.value || '';
  const hasta  = document.getElementById('perf-hasta')?.value || '';
  if(!nombre){
    body.innerHTML = '<div style="padding:22px;text-align:center;color:var(--mid-gray);font-size:13px">Elegí un empleado para ver sus métricas objetivas del período.</div>';
    return;
  }
  const m = _metricasEmpleadoPeriodo(nombre, desde, hasta);
  if(!m.total.n){
    // Diagnóstico: qué nombres SÍ figuran en el checklist del período (revela
    // desajustes de nombre entre el login y el "responsable" del checklist).
    const nombresHist = [...new Set((checklistHistory||[])
      .filter(e=>_enRangoFecha(e.date, desde, hasta))
      .map(e=>String(e.who||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    const hint = nombresHist.length
      ? `<div style="font-size:12px;color:var(--mid-gray);margin-top:10px">En el checklist de este período figuran: ${nombresHist.map(esc).join(' · ')}</div>`
      : '';
    body.innerHTML = `<div style="padding:22px;text-align:center;color:var(--mid-gray);font-size:13px">Sin tareas registradas para ${esc(nombre)} en este período.${hint}</div>` + _prodResumenHTML(nombre, desde, hasta, m);
    return;
  }
  body.innerHTML = _prodResumenHTML(nombre, desde, hasta, m) + _metricasHTML(m);
}

// ── Productividad vs. horas de contrato (RRHH › Evaluaciones) ────────────────
// Busca el legajo de un empleado (el login usa solo el nombre; el legajo tiene
// nombre y apellido) para tomar las horas de contrato mensuales.
function _legajoDeEmpleado(nombre){
  return (legajoData||[]).find(l=>_mismoNombre(_nombreAppLegajo(l), nombre)) || null;
}

// Nombre con el que la persona del legajo registra tareas/fichajes en la app:
// el usuario vinculado en el legajo; si no tiene, el usuario de la app que
// coincide con su nombre (o nombre + apellido); y si no, su nombre tal cual.
function _nombreAppLegajo(l){
  if(!l) return '';
  return liqNombreCalendario(l) || (l.nombre||'').trim();
}

// Empleados de RRHH = los que tienen legajo. Devuelve [{value, label}] donde
// value es el nombre en la app (para cruzar con tareas) y label el nombre completo.
function _empleadosLegajo(){
  const vistos = new Set();
  return (legajoData||[]).map(l=>({ value:_nombreAppLegajo(l), label:((l.nombre||'')+' '+(l.apellido||'')).trim() }))
    .filter(o=>o.value && !vistos.has(o.value) && vistos.add(o.value))
    .sort((a,b)=>a.label.localeCompare(b.label,'es'));
}
function _empleadosLegajoOpts(){
  return _empleadosLegajo().map(o=>`<option value="${esc(o.value)}">${esc(o.label)}${_mismoNombre(o.label.split(' ')[0],o.value)?'':' ('+esc(o.value)+')'}</option>`).join('');
}

// Al crear un usuario florista/jardinero se le abre su legajo (si no tiene).
function _crearLegajoParaUsuario(nombre, cargo){
  if(_legajoDeEmpleado(nombre)) return false;
  legajoData.push({ id: Date.now(), nombre, apellido:'', usuario:nombre, dni:'', fechaIngreso:TODAY_ISO, cargo,
    sucursal:'', tipo:'nomina', horasContrato:0, vacacionesAnuales:14, vacacionesTomadas:0, notas:'', documentos:[] });
  fbSave('legajoData', legajoData);
  if(document.getElementById('page-legajo')?.classList.contains('active')) renderLegajo();
  return true;
}

const _PROD_MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function _isoDia(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

// Historial día por día + resumen mensual y trimestral de un empleado.
// - Tiempo en tareas: suma de las tareas con inicio/fin registrados.
// - Hs trabajadas: jornada fichada (misma fuente que Liquidación).
// - Hs contrato: horas/mes del legajo, prorrateadas por los días del mes que
//   caen en el período (y hasta hoy). Si no hay legajo, se usan las horas
//   programadas en Horarios.
// - Productividad: tiempo en tareas / hs contrato.
function _prodDatos(nombre, desde, hasta, detalle){
  const leg = _legajoDeEmpleado(nombre);
  const hsContratoMes = +leg?.horasContrato || 0;
  const tareasPorDia = {};
  detalle.forEach(d=>{ (tareasPorDia[d.fecha] ||= []).push(d); });
  const faltasPorDia = {};
  _faltasDe(nombre).forEach(f=>{ (faltasPorDia[f.fecha] ||= []).push(f); });

  const fin = hasta && hasta < TODAY_ISO ? hasta : TODAY_ISO;
  const ini = desde || Object.keys(tareasPorDia).sort()[0] || fin;
  const dias = [];
  const meses = new Map();
  const [ya,ma,da] = ini.split('-').map(Number);
  for(let d=new Date(ya,ma-1,da); _isoDia(d)<=fin; d.setDate(d.getDate()+1)){
    const iso = _isoDia(d);
    const mesKey = iso.slice(0,7);
    if(!meses.has(mesKey)){
      const [a,m] = mesKey.split('-').map(Number);
      meses.set(mesKey, { key:mesKey, diasMes:new Date(a,m,0).getDate(), diasEnRango:0, dias:0, tareas:0, minTareas:0, hsTrab:0, hsProg:0, faltas:0, faltasInj:0 });
    }
    const M = meses.get(mesKey);
    M.diasEnRango++;
    const tareas = tareasPorDia[iso] || [];
    const real = jornadaRealDia(nombre, iso);
    const h = (window.horariosData||{})[nombre]?.[iso];
    M.hsProg += (h?.desde && h?.hasta) ? calcHorasDia(h.desde, h.hasta) : 0;
    const faltas = faltasPorDia[iso] || [];
    M.faltas += faltas.length; M.faltasInj += faltas.filter(f=>!f.justificada).length;
    if(!tareas.length && !real){
      if(faltas.length) dias.push({ iso, tareas, minTareas:0, real:null, faltas });
      continue;
    }
    const minTareas = tareas.reduce((s,t)=>s+(t.dur||0),0);
    M.dias++; M.tareas += tareas.length; M.minTareas += minTareas; M.hsTrab += real?.horas || 0;
    dias.push({ iso, tareas, minTareas, real, faltas });
  }
  dias.reverse();

  const mesesArr = [...meses.values()].map(M=>{
    const [a,m] = M.key.split('-').map(Number);
    const hsRef = hsContratoMes ? hsContratoMes * M.diasEnRango / M.diasMes : M.hsProg;
    return { ...M, hsRef, label: _PROD_MESES[m-1]+' '+a };
  });
  const trims = new Map();
  mesesArr.forEach(M=>{
    const [a,m] = M.key.split('-').map(Number);
    const q = Math.floor((m-1)/3)+1;
    const k = a+'-T'+q;
    if(!trims.has(k)) trims.set(k, { key:k, label:`${q}º trimestre ${a}`, dias:0, tareas:0, minTareas:0, hsTrab:0, hsRef:0, faltas:0, faltasInj:0 });
    const T = trims.get(k);
    T.dias+=M.dias; T.tareas+=M.tareas; T.minTareas+=M.minTareas; T.hsTrab+=M.hsTrab; T.hsRef+=M.hsRef; T.faltas+=M.faltas; T.faltasInj+=M.faltasInj;
  });
  return { leg, hsContratoMes, dias, meses:mesesArr.reverse(), trims:[...trims.values()].reverse() };
}

function _prodPctColor(p){ return p==null ? 'var(--mid-gray)' : p>=80 ? 'var(--green-ok)' : p>=50 ? '#D4A820' : 'var(--red-alert)'; }
function _prodPct(num, den){ return den>0 ? Math.round(num/den*100) : null; }

function _prodResumenHTML(nombre, desde, hasta, m){
  const P = _prodDatos(nombre, desde, hasta, m.detalle);
  const th = (txt,align)=>`<th style="text-align:${align||'left'};padding:6px 10px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);white-space:nowrap">${txt}</th>`;
  const td = (txt,align,extra)=>`<td style="padding:6px 10px;font-size:12.5px;text-align:${align||'left'};white-space:nowrap;${extra||''}">${txt}</td>`;
  const pctCell = p => td(p==null?'—':p+'%','right',`font-weight:600;color:${_prodPctColor(p)}`);
  const hs = h => (Math.round(h*10)/10)+'h';

  const fuente = P.hsContratoMes
    ? `Horas de contrato según legajo: <strong>${P.hsContratoMes}h/mes</strong> (prorrateadas por los días del período).`
    : (P.leg ? 'El legajo no tiene horas de contrato cargadas: se usan las horas programadas en Horarios.'
             : `No se encontró a ${esc(nombre)} en el Legajo: se usan las horas programadas en Horarios. Cargá sus horas de contrato en RRHH › Legajo.`);

  const resumenRows = rows => rows.map(R=>`<tr>
    ${td(`<strong>${esc(R.label)}</strong>`)}
    ${td(R.dias,'center')}
    ${td(R.tareas,'center')}
    ${td(R.dias?(Math.round(R.tareas/R.dias*10)/10):'—','center')}
    ${td(fmtDur(R.minTareas),'right')}
    ${td(hs(R.hsTrab),'right')}
    ${td(R.hsRef?hs(R.hsRef):'—','right','color:var(--mid-gray)')}
    ${pctCell(_prodPct(R.hsTrab, R.hsRef))}
    ${pctCell(_prodPct(R.minTareas/60, R.hsRef))}
    ${td(R.faltas ? `${R.faltas}${R.faltasInj?` <span style="color:var(--red-alert);font-size:12px">(${R.faltasInj} sin just.)</span>`:' <span style="color:var(--green-ok);font-size:12px">(just.)</span>'}` : '0','center')}
  </tr>`).join('');
  const resumenHead = `<thead><tr>${th('Período')}${th('Días trab.','center')}${th('Tareas','center')}${th('Tareas/día','center')}${th('Tiempo en tareas','right')}${th('Hs trabajadas','right')}${th('Hs contrato','right')}${th('Cumplimiento','right')}${th('Productividad','right')}${th('Faltas','center')}</tr></thead>`;
  const tabla = (titulo, rows) => `<div style="margin-bottom:20px">
    <div style="font-size:13px;font-weight:600;color:var(--charcoal);margin-bottom:6px">${titulo}</div>
    <div class="table-wrapper"><table style="width:100%;border-collapse:collapse">${resumenHead}<tbody>${resumenRows(rows)}</tbody></table></div>
  </div>`;

  const diaRows = P.dias.map(D=>{
    const ocup = D.real ? _prodPct(D.minTareas/60, D.real.horas) : null;
    const tareasTxt = D.tareas.map(t=>`<div style="display:flex;gap:8px;padding:3px 0;border-top:1px solid var(--surface-2);font-size:12px">
        <span style="color:var(--mid-gray);min-width:84px">${t.inicio&&t.fin?esc(t.inicio)+'–'+esc(t.fin):'sin horario'}</span>
        <span style="color:var(--mid-gray);min-width:78px">${esc(t.area)}</span>
        <span style="flex:1">${esc(t.desc)}</span>
        <span style="${t.excedida?'color:var(--red-alert);font-weight:600':''}">${t.dur?fmtDur(t.dur):'—'}</span>
      </div>`).join('');
    const fecha = new Date(D.iso+'T12:00:00').toLocaleDateString('es-AR',{weekday:'short',day:'2-digit',month:'2-digit'});
    return `<details style="border-bottom:1px solid var(--light-gray)">
      <summary style="cursor:pointer;display:flex;gap:10px;align-items:center;padding:8px 6px;font-size:12.5px;flex-wrap:wrap">
        <strong style="min-width:92px;text-transform:capitalize">${esc(fecha)}</strong>
        <span style="min-width:70px">${D.tareas.length} tarea${D.tareas.length!==1?'s':''}</span>
        <span style="min-width:90px;color:var(--mid-gray)">${D.minTareas?fmtDur(D.minTareas)+' en tareas':'sin tiempos'}</span>
        <span style="min-width:120px;color:var(--mid-gray)">${D.real?`jornada ${esc(D.real.inicio)}–${esc(D.real.fin)} (${hs(D.real.horas)})`:'sin fichar'}</span>
        ${D.faltas.map(f=>`<span style="font-size:12px;font-weight:600;padding:2px 8px;border-radius:10px;${f.justificada?'background:var(--ok-soft);color:var(--green-ok)':'background:var(--alert-soft);color:var(--red-alert)'}">Falta ${f.justificada?'justificada':'sin justificar'} · ${esc(f.motivo||'')}</span>`).join('')}
        <span style="margin-left:auto;font-weight:600;color:${_prodPctColor(ocup)}" title="Tiempo en tareas sobre la jornada fichada">${ocup==null?'':ocup+'% ocupado'}</span>
      </summary>
      <div style="padding:2px 8px 10px">${tareasTxt || `<div style="font-size:12px;color:var(--mid-gray)">${D.real?'Fichó la jornada pero no registró tareas.':D.faltas.map(f=>esc(f.obs||'Sin observación')).join(' · ')}</div>`}</div>
    </details>`;
  }).join('');

  return `<div style="font-size:12px;color:var(--mid-gray);margin-bottom:12px;padding:8px 12px;background:#F7F5F0;border-radius:8px">${fuente}
      <br><strong>Cumplimiento</strong> = hs trabajadas (fichadas) / hs contrato · <strong>Productividad</strong> = tiempo en tareas / hs contrato.</div>
    ${tabla('Resumen mensual', P.meses)}
    ${tabla('Resumen trimestral', P.trims)}
    <div style="margin-bottom:20px">
      <div style="font-size:13px;font-weight:600;color:var(--charcoal);margin-bottom:6px">Historial por día (${P.dias.length} día${P.dias.length!==1?'s':''}) <span style="font-weight:400;font-size:12px;color:var(--mid-gray)">— tocá un día para ver sus tareas</span></div>
      <div style="max-height:420px;overflow-y:auto;border:1px solid var(--light-gray);border-radius:8px;background:var(--warm-white)">${diaRows || '<div style="padding:14px;font-size:12px;color:var(--mid-gray)">Sin actividad en el período.</div>'}</div>
    </div>`;
}

// Desde el detalle del Legajo: abre Evaluaciones con el empleado ya elegido.
function legVerProductividad(){
  const e = legajoData[_legDetIdx]; if(!e) return;
  closeModal('legajo-detalle-modal');
  navigate('evaluaciones');
  const sel = document.getElementById('perf-empleado'); if(!sel) return;
  sel.value = _nombreAppLegajo(e);
  perfPreset('3m');
}

// Arma el HTML de las métricas de un empleado (tarjetas + desglose por área +
// por tarea + detalle). Reutilizado por Evaluaciones y por Cierre del Día.
function _metricasHTML(m){
  const card = (label, value, sub, color) => `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;padding:12px 14px">
    <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:6px">${label}</div>
    <div style="font-size:23px;font-weight:700;color:${color||'var(--charcoal)'};line-height:1.1">${value}</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-top:4px">${sub||''}</div>
  </div>`;
  const promTotal = m.total.conTiempo ? Math.round(m.total.min/m.total.conTiempo) : null;
  const cards = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:18px">
    ${card('Tareas hechas', m.total.n, `${m.total.conTiempo} con tiempo registrado`, 'var(--charcoal)')}
    ${card('Prom. por tarea', promTotal!=null?promTotal+' min':'—', promTotal!=null?'sobre las tareas cronometradas':'sin horarios cargados', 'var(--charcoal)')}
    ${card('Tiempo total', fmtDur(m.total.min), 'en tareas con horario', 'var(--charcoal)')}
    ${card('Pasadas de tiempo', m.total.excedidas, 'tareas de florería sobre el estimado', m.total.excedidas?'var(--red-alert)':'var(--green-ok)')}
  </div>`;

  // Desglose por área
  const areaRows = Object.entries(m.areas).filter(([,a])=>a.n>0).map(([nombreArea,a])=>{
    const prom = a.conTiempo ? Math.round(a.min/a.conTiempo)+' min' : '—';
    return `<tr>
      <td style="padding:6px 12px;font-size:13px;font-weight:500">${esc(nombreArea)}</td>
      <td style="padding:6px 12px;text-align:center">${a.n}</td>
      <td style="padding:6px 12px;text-align:right">${prom}</td>
      <td style="padding:6px 12px;text-align:right;color:var(--mid-gray)">${fmtDur(a.min)}</td>
    </tr>`;
  }).join('');
  const th = (txt,align)=>`<th style="text-align:${align||'left'};padding:6px 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">${txt}</th>`;
  const desgloseArea = `<div style="margin-bottom:20px">
    <div style="font-size:13px;font-weight:600;color:var(--charcoal);margin-bottom:6px">Por área</div>
    <div class="table-wrapper"><table style="width:100%;border-collapse:collapse">
      <thead><tr>${th('Área')}${th('Tareas','center')}${th('Prom. tiempo','right')}${th('Tiempo total','right')}</tr></thead>
      <tbody>${areaRows}</tbody>
    </table></div>
  </div>`;

  // Desglose por tarea
  const tareaRows = m.tareas.map(t=>{
    const prom = t.conTiempo ? Math.round(t.min/t.conTiempo)+' min' : '—';
    return `<tr>
      <td style="padding:6px 12px;font-size:12.5px;font-weight:500">${esc(t.desc)}</td>
      <td style="padding:6px 12px;font-size:12px;color:var(--mid-gray)">${esc(t.area)}</td>
      <td style="padding:6px 12px;text-align:center">${t.n}</td>
      <td style="padding:6px 12px;text-align:right">${prom}</td>
    </tr>`;
  }).join('');
  const desgloseTarea = `<div style="margin-bottom:20px">
    <div style="font-size:13px;font-weight:600;color:var(--charcoal);margin-bottom:6px">Por tarea</div>
    <div class="table-wrapper" style="max-height:280px;overflow-y:auto"><table style="width:100%;border-collapse:collapse">
      <thead><tr>${th('Tarea')}${th('Área')}${th('Veces','center')}${th('Prom. tiempo','right')}</tr></thead>
      <tbody>${tareaRows}</tbody>
    </table></div>
  </div>`;

  // Detalle tarea por tarea
  const detRows = m.detalle.map(d=>`<tr>
    <td style="padding:5px 12px;font-size:12px;white-space:nowrap">${fmtDate(d.fecha)}</td>
    <td style="padding:5px 12px;font-size:12px;color:var(--mid-gray)">${esc(d.area)}</td>
    <td style="padding:5px 12px;font-size:12px">${esc(d.desc)}</td>
    <td style="padding:5px 12px;text-align:right;font-size:12px;${d.excedida?'color:var(--red-alert);font-weight:600':''}">${d.dur?fmtDur(d.dur):'—'}</td>
  </tr>`).join('');
  const detalle = `<div>
    <div style="font-size:13px;font-weight:600;color:var(--charcoal);margin-bottom:6px">Detalle (${m.detalle.length} tarea${m.detalle.length!==1?'s':''})</div>
    <div class="table-wrapper" style="max-height:340px;overflow-y:auto"><table style="width:100%;border-collapse:collapse">
      <thead><tr>${th('Fecha')}${th('Área')}${th('Tarea')}${th('Tiempo','right')}</tr></thead>
      <tbody>${detRows}</tbody>
    </table></div>
  </div>`;

  return cards + desgloseArea + desgloseTarea + detalle;
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
  document.getElementById('rep-eq-tabla').innerHTML = `<div style="font-size:12px;color:var(--mid-gray);margin-bottom:8px">Ranking del mes — tocá una fila para ver la ficha completa de la persona</div>
  <div class="table-wrapper"><table class="stock-table">
    <thead><tr><th>#</th><th>Empleado</th><th>Área</th><th>Asist.</th><th>Puntualidad</th><th>Hs prog</th><th>Hs reg</th><th>Cumplimiento</th><th>Llamados</th><th></th></tr></thead>
    <tbody>${datosEmpleado.map((d,rank)=>{
      const m = d.m;
      const pct = m.cumplimiento;
      const col = pct==null?'var(--mid-gray)':pct>=80?'var(--green-ok)':pct>=50?'#D4A820':'var(--red-alert)';
      const trend = (pct!=null && d.cumplPrev!=null && Math.abs(pct-d.cumplPrev)>=1)
        ? (pct-d.cumplPrev>0?' <span style="color:var(--green-ok);font-size:12px">▲</span>':' <span style="color:var(--red-alert);font-size:12px">▼</span>') : '';
      const asisCol = m.asistencia==null?'var(--mid-gray)':m.asistencia>=90?'var(--green-ok)':m.asistencia>=70?'#D4A820':'var(--red-alert)';
      const nEsc = esc(d.nombre).replace(/'/g,"\\'");
      return `<tr style="cursor:pointer" onclick="openFichaEmpleado('${nEsc}')">
        <td style="color:var(--mid-gray);font-weight:600">${pct!=null?rank+1:'—'}</td>
        <td><strong>${esc(d.nombre)}</strong></td>
        <td>${isJardinero(d.nombre)?'Jardinería':'Florería'}</td>
        <td style="color:${asisCol};font-weight:600">${m.asistencia!=null?m.asistencia+'%':'—'}</td>
        <td>${m.diasTarde?`<span style="color:var(--amber)">${icon('clock')}${m.diasTarde} (${m.minTarde}min)</span>`:(m.diasFichados?'<span style="color:var(--green-ok)">✓ en hora</span>':'—')}</td>
        <td>${d.hsProg}h</td>
        <td>${d.hsTrab}h</td>
        <td style="color:${col};font-weight:600">${pct!=null?pct+'%'+trend:'—'}</td>
        <td>${m.llamados?`<span style="color:var(--red-alert);font-weight:600">${m.llamados}</span>`:'—'}</td>
        <td><button class="btn-secondary" style="font-size:12px;padding:3px 10px" onclick="event.stopPropagation();openFichaEmpleado('${nEsc}')">Ficha</button></td>
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
  const titulo = '<div class="section-title" style="margin-bottom:6px">Tiempos del checklist — real vs referencia</div>'
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
      if(idx>=0) o.ref = getTiempoRef(idx, o.actividad);
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
          <td style="text-align:center">${o.exc?'<span style="color:var(--red-alert);font-weight:600">'+o.exc+' </span>':'0'}</td>
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

  // Comparativa mes vs mes anterior
  const [_yy,_mm] = mesISO.split('-').map(Number);
  const _prevD = new Date(_yy, _mm-2, 1);
  const prevISO = `${_prevD.getFullYear()}-${String(_prevD.getMonth()+1).padStart(2,'0')}`;
  const prevTotal = (ventasData||[]).filter(v=>(v.fecha||'').startsWith(prevISO)).reduce((s,v)=>s+parseMoney(v.precio),0);
  let deltaSub;
  if(prevTotal>0){
    const pct = Math.round((totalMes-prevTotal)/prevTotal*100);
    const up = pct>=0;
    deltaSub = `<span style="color:${up?'var(--green-ok)':'var(--red-alert)'};font-weight:600">${up?'▲':'▼'} ${Math.abs(pct)}%</span> vs mes anterior ($${prevTotal.toLocaleString('es-AR')})`;
  } else {
    deltaSub = totalMes>0 ? 'sin datos del mes anterior' : fmtMonth(mesISO);
  }

  document.getElementById('rep-vt-kpis').innerHTML =
    _kpiCard('Total ventas', '$'+totalMes.toLocaleString('es-AR'), deltaSub) +
    _kpiCard('Confirmadas', confirmadas, 'ventas confirmadas/entregadas', 'var(--green-ok)') +
    _kpiCard('Pendientes', pendientes, 'ventas pendientes') +
    _kpiCard('Eventos en el mes', eventosHoy, 'eventos/bodas');

  // Trend 6 meses
  _destroyChart('rep-vt-trend');
  const ctx1=document.getElementById('rep-vt-chart-trend')?.getContext('2d');
  if(ctx1 && typeof Chart!=='undefined'){
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
  if(ctx2&&Object.keys(estadoCount).length&&typeof Chart!=='undefined'){
    _chartInstances['rep-vt-ev']=new Chart(ctx2,{
      type:'doughnut',
      data:{ labels:Object.keys(estadoCount), datasets:[{ data:Object.values(estadoCount), backgroundColor:['#65825A','#B49664','#A0BFAB','#D4A820','#c0392b','#7f8c8d'] }] },
      options:{ responsive:true, plugins:{ legend:{ position:'bottom', labels:{ font:{size:11} } } } }
    });
  } else if(ctx2){ ctx2.canvas.parentElement.innerHTML += '<div style="text-align:center;color:var(--mid-gray);padding:20px;font-size:12px">Sin eventos este mes</div>'; }

  // Tabla
  const porEmp={};
  ventasMes.forEach(v=>{ const n=v.asignado||'Sin asignar'; if(!porEmp[n])porEmp[n]={total:0,cnt:0}; porEmp[n].total+=parseMoney(v.precio); porEmp[n].cnt++; });

  // Top productos del mes (por facturación)
  const porProd={};
  ventasMes.forEach(v=>{ const n=(v.prod||'').trim()||'Sin especificar'; if(!porProd[n])porProd[n]={total:0,cnt:0}; porProd[n].total+=parseMoney(v.precio); porProd[n].cnt++; });
  const topProd = Object.entries(porProd).sort((a,b)=>b[1].total-a[1].total).slice(0,8);
  const maxProd = topProd.length ? topProd[0][1].total : 0;

  document.getElementById('rep-vt-tabla').innerHTML=`
    <div class="section-title" style="font-size:16px">Ventas por empleado</div>
    <div class="table-wrapper"><table class="stock-table">
      <thead><tr><th>Empleado</th><th>Ventas</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${Object.entries(porEmp).sort((a,b)=>b[1].total-a[1].total).map(([n,d])=>`<tr><td>${esc(n)}</td><td>${d.cnt}</td><td style="text-align:right">$${d.total.toLocaleString('es-AR')}</td></tr>`).join('')||'<tr><td colspan="3" style="color:var(--mid-gray)">Sin ventas este mes</td></tr>'}</tbody>
    </table></div>
    <div class="section-title" style="font-size:16px;margin-top:22px">Top productos del mes</div>
    <div class="table-wrapper"><table class="stock-table">
      <thead><tr><th>Producto</th><th>Unidades</th><th style="text-align:right">Total</th><th style="width:120px">Participación</th></tr></thead>
      <tbody>${topProd.map(([n,d])=>{
        const pct = maxProd>0 ? Math.round(d.total/maxProd*100) : 0;
        return `<tr><td style="font-weight:500">${esc(n)}</td><td>${d.cnt}</td><td style="text-align:right">$${d.total.toLocaleString('es-AR')}</td>
          <td><div class="stock-bar" style="width:100px"><div class="stock-fill ok" style="width:${pct}%"></div></div></td></tr>`;
      }).join('')||'<tr><td colspan="4" style="color:var(--mid-gray)">Sin ventas este mes</td></tr>'}</tbody>
    </table></div>`;
}

function exportReporteVentas(){
  const mesISO=document.getElementById('rep-vt-mes')?.value||TODAY_ISO.slice(0,7);
  const rows=[['Fecha','Descripción','Precio','Estado','Asignado']];
  (ventasData||[]).filter(v=>(v.fecha||'').startsWith(mesISO)).forEach(v=>rows.push([v.fecha,v.descripcion||'',v.precio||'',v.estado||'',v.asignado||'']));
  _downloadCSV(rows,`reporte-ventas-${mesISO}.csv`);
}


// ════════════════════════════════════════
// MOBILE SIDEBAR


// ════════════════════════════
// MOBILE SIDEBAR
// ════════════════════════════

// ── BACKUP DE DATOS ───────────────────────────────────────────────────────────
// Exporta todos los datos principales a un JSON descargable (solo gerencia).
// Cada fuente está envuelta en función para tolerar variables que cambien de
// nombre entre versiones sin romper el backup completo.
async function descargarBackup(){
  // Guardia anti-backup incompleto: si nodos clave figuran vacíos es porque la
  // app todavía no terminó de sincronizar. Descargar así genera un backup
  // inservible (fue lo que pasó con un backup viejo). Avisar y confirmar.
  const _len = v => (Array.isArray(v)?v:Object.values(v||{})).length;
  const criticos = { 'compras florería':comprasFlore, 'ventas':ventasData, 'caja':cajaData, 'eventos':eventosData, 'stock':stockData };
  const vacios = Object.entries(criticos).filter(([,v])=>!_len(v)).map(([k])=>k);
  if(vacios.length >= 2){
    const ok = await confirmModal(`Parece que la app todavía no terminó de cargar todos los datos: ${vacios.join(', ')} figuran VACÍOS.\n\nSi descargás ahora, el backup puede salir INCOMPLETO y no servir para restaurar. Lo mejor es esperar unos segundos a que cargue todo y volver a intentar.\n\n¿Descargar igual?`);
    if(!ok) return;
  }
  const fuentes = {
    checklist: ()=>clStateByDay, checklistHistory: ()=>checklistHistory, clTiemposRef: ()=>clTiemposRef, ultimoNuevoZona: ()=>ultimoNuevoZona,
    checklistTareas: ()=>CL_TASKS.map(t=>({sec:t.sec,zona:t.zona,actividad:t.actividad,obs:t.obs||''})),
    eventosData: ()=>eventosData, kanbanData: ()=>kanbanData, eventosSinFloreria: ()=>eventosSinFloreria,
    stockData: ()=>stockData, recetasData: ()=>recetasData,
    comprasFlore: ()=>comprasFlore, comprasJard: ()=>comprasJard, proveedoresList: ()=>proveedoresList,
    ventasData: ()=>ventasData, cajaData: ()=>cajaData, cierresCajaData: ()=>cierresCajaData,
    cierresMensualesData: ()=>cierresMensualesData, presupuestosData: ()=>presupuestosData,
    clientesData: getClientesData, listaPreciosData: ()=>listaPreciosData,
    ramosDispData: ()=>ramosDispData, florerosData: ()=>florerosData, velasData: getVelasData, pedidosHabData: ()=>pedidosHabData, galeriaData: ()=>galeriaData,
    cotizadorPrecios: ()=>cotizadorPrecios, eventoPricing: ()=>eventoPricing,
    jardineriaData: ()=>jardineriaData, jardineriaLog: ()=>jardineriaLog, jardRecordatorios: ()=>jardRecordatorios, jardPlagas: ()=>jardPlagas, jardStockPlantas: ()=>jardStockPlantas, jardStockProductos: ()=>jardStockProductos,
    habitacionesData: ()=>habitacionesData, habitacionesLog: ()=>habitacionesLog, zonaHorasData: ()=>zonaHorasData,
    horariosData: ()=>window.horariosData, horariosPlantilla: ()=>horariosPlantilla, horariosPersonas: ()=>window.horariosPersonas,
    florTurnos: ()=>window.florTurnos, jardHorarios: ()=>window.jardHorarios,
    legajoData: ()=>legajoData, evaluacionesData: ()=>evaluacionesData, llamadosData: ()=>llamadosData, liquidacionConfig: ()=>liquidacionConfig,
    sucursalesConfig: ()=>sucursalesConfig, loginPasswords: ()=>loginPasswords, auditLogData: ()=>auditLogData,
    resumenesDiarios: ()=>resumenesDiarios,
    tareasGerencia: ()=>tareasGerencia,
  };
  // auditLog ya no se descarga al abrir la app: traerlo para el backup
  if(!Object.keys(auditLogData||{}).length && window.fbGetOnce){
    try{ window._setAuditLog(await window.fbGetOnce('auditLog')); }catch(e){}
  }
  const data = { _meta: { app:'Florería Duhau', fecha:new Date().toISOString(), generadoPor: window.currentUserLabel||userRole||'' } };
  // Las fotos viven aparte (fotos/<id>): incluirlas para que el backup sea completo
  if(fotosActivo() && window.fbGetOnce){
    try{ data.fotos = await window.fbGetOnce('fotos'); }
    catch(e){ if(!await confirmModal('No se pudieron descargar las fotos (¿sin conexión?).\n\n¿Descargar el backup sin las fotos?')) return; }
  }
  Object.entries(fuentes).forEach(([k,fn])=>{ try{ const v=fn(); if(v!==undefined) data[k]=v; }catch(e){} });
  const blob = new Blob([JSON.stringify(data)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `backup-floreria-duhau-${TODAY_ISO}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  try{ localStorage.setItem('ultimoBackupISO', TODAY_ISO); }catch(e){}
  showToast('Backup descargado — subilo a tu Google Drive para no perderlo');
}

// Recordatorio semanal: avisar a gerencia si hace más de 7 días del último backup
function recordarBackup(){
  try{
    const ult = localStorage.getItem('ultimoBackupISO');
    const dias = ult ? Math.floor((new Date(TODAY_ISO)-new Date(ult))/86400000) : null;
    if(dias===null || dias>7){
      showToast(dias===null
        ? 'Nunca se descargó un backup desde este dispositivo — botón "Backup de datos" en el menú, y subirlo a Drive'
        : `Hace ${dias} días que no se descarga un backup — botón "Backup de datos" en el menú, y subirlo a Drive`, 'warn');
    }
  }catch(e){}
}

// ════════════════════════════════════════════════════════════════════════
//  RESTAURAR / RESGUARDAR COMPRAS  (recuperación de historial)
//  - Restaurar: fusiona las compras de un backup con las actuales; agrega solo
//    las que faltan (no pisa ni duplica). Solo toca comprasFlore/comprasJard.
//  - Resguardo automático: espeja las compras a un nodo comprasFloreSafe /
//    comprasJardSafe que NUNCA se achica (solo se actualiza cuando cubre más
//    fechas), así una sobrescritura accidental no destruye el historial.
// ════════════════════════════════════════════════════════════════════════
let _restoreCompras = null;
let _safeMeta = { flore: 0, jard: 0 };  // cantidad de fechas distintas en el resguardo
// El resguardo ya no se descarga al abrir la app (pesa varios MB con fotos):
// se escucha solo su resumen `safeMeta`. Mientras no se conozca, NO se escribe
// el resguardo (escribirlo sin saber cuánto tiene podría achicarlo).
let _safeMetaReady = false, _safeMetaBootstrap = false;
let _safeEventosCount = 0;
window._setSafeMeta = v => {
  if(v && typeof v === 'object'){
    _safeMeta.flore = Math.max(_safeMeta.flore, +v.flore||0);
    _safeMeta.jard  = Math.max(_safeMeta.jard,  +v.jard||0);
    _safeEventosCount = Math.max(_safeEventosCount, +v.eventos||0);
    _safeMetaReady = true;
    window._maybeSnapshotComprasSafe?.(); window._maybeSnapshotEventosSafe?.();
    return;
  }
  // Todavía no existe safeMeta: calcularlo UNA vez leyendo los resguardos actuales.
  if(_safeMetaBootstrap || !window.fbGetOnce) return;
  _safeMetaBootstrap = true;
  Promise.all(['comprasFloreSafe','comprasJardSafe','eventosSafe'].map(k=>window.fbGetOnce(k)))
    .then(([f,j,e])=>{
      const meta = { flore:_rcDates(f), jard:_rcDates(j), eventos:_rcAsArr(e).length };
      window.fbSetPath?.('safeMeta', meta);
      window._setSafeMeta(meta);
    })
    .catch(()=>{ _safeMetaBootstrap = false; }); // sin conexión: se reintenta con el próximo aviso
};
function _rcAsArr(v){ return Array.isArray(v) ? v : Object.values(v||{}); }
function _rcSig(r){ return ['fecha','prod','desc','qty','sector','pedidopor','prov'].map(k=>String((r&&r[k])==null?'':r[k]).trim().toLowerCase()).join('|'); }
function _rcDates(arr){ return new Set(_rcAsArr(arr).map(r=>r&&r.fecha).filter(Boolean)).size; }

// Espejo de resguardo: solo escribe si el arreglo cubre MÁS fechas que el
// resguardo actual (monótono: nunca lo achica). Se llama tras cargar/guardar.
window._maybeSnapshotComprasSafe = () => {
  if(!_safeMetaReady) return;
  try{
    const df = _rcDates(comprasFlore);
    if((comprasFlore||[]).length && df > _safeMeta.flore){ _safeMeta.flore = df; fbSave('comprasFloreSafe', comprasFlore); window.fbUpdate?.('safeMeta', { flore: df }); }
    const dj = _rcDates(comprasJard);
    if((comprasJard||[]).length && dj > _safeMeta.jard){ _safeMeta.jard = dj; fbSave('comprasJardSafe', comprasJard); window.fbUpdate?.('safeMeta', { jard: dj }); }
  }catch(e){}
};

// Resguardo de eventos (nunca se achica): se actualiza solo cuando hay MÁS
// eventos que el resguardo, así una sobrescritura accidental no lo destruye.
window._maybeSnapshotEventosSafe = () => {
  if(!_safeMetaReady) return;
  try{ const n=(eventosData||[]).length; if(n && n > _safeEventosCount){ _safeEventosCount = n; fbSave('eventosSafe', eventosData); window.fbUpdate?.('safeMeta', { eventos: n }); } }catch(e){}
};

function abrirRestaurarCompras(){
  if(userRole!=='gerencia'){ showToast('Solo gerencia puede restaurar.','error'); return; }
  document.getElementById('restaurar-compras-file').click();
}

// Un evento se considera "el mismo" si coincide su id O su nombre+fecha (los
// eventos recreados tras el borrado tienen id nuevo pero mismo nombre y fecha).
function _evtIdK(e){ return e && e.id ? 'id:'+String(e.id) : null; }
function _evtNFK(e){ return 'nf:'+String(e&&e.nombre||'').trim().toLowerCase()+'|'+String(e&&e.fecha||''); }

function _rcMergePreview(oldF, oldJ, oldE, fuente){
  oldF = _rcAsArr(oldF).filter(r=>r&&r.prod);
  oldJ = _rcAsArr(oldJ).filter(r=>r&&r.prod);
  oldE = _rcAsArr(oldE).filter(e=>e&&(e.nombre||e.id));
  const curF = new Set((comprasFlore||[]).map(_rcSig));
  const curJ = new Set((comprasJard||[]).map(_rcSig));
  const curEIds = new Set(), curENF = new Set();
  (eventosData||[]).forEach(e=>{ const ik=_evtIdK(e); if(ik) curEIds.add(ik); curENF.add(_evtNFK(e)); });
  const seenF=new Set(), seenJ=new Set(), seenEIds=new Set();
  const addF = oldF.filter(r=>{ const s=_rcSig(r); if(curF.has(s)||seenF.has(s)) return false; seenF.add(s); return true; });
  const addJ = oldJ.filter(r=>{ const s=_rcSig(r); if(curJ.has(s)||seenJ.has(s)) return false; seenJ.add(s); return true; });
  const addE = oldE.filter(e=>{
    const ik=_evtIdK(e), nk=_evtNFK(e);
    // Ya existe en lo actual (por id, o recreado con id nuevo pero mismo nombre+fecha)
    if(ik && curEIds.has(ik)) return false;
    if(curENF.has(nk)) return false;
    // Dentro del backup, solo colapsar el MISMO registro repetido (por id) — no
    // fusionar eventos distintos que compartan nombre+fecha.
    if(ik && seenEIds.has(ik)) return false;
    if(ik) seenEIds.add(ik);
    return true;
  });
  _restoreCompras = { addF, addJ, addE, oldF:oldF.length, oldJ:oldJ.length, oldE:oldE.length, fuente };
  renderRestaurarComprasPreview();
  document.getElementById('restaurar-compras-modal').classList.add('open');
}

function restaurarComprasFile(input){
  const file = input.files?.[0]; input.value='';
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    let data;
    try{ data = JSON.parse(e.target.result); }
    catch(err){ showToast('No pude leer el backup (JSON inválido).','error'); return; }
    const oldF = _rcAsArr(data.comprasFlore).filter(r=>r&&r.prod);
    const oldJ = _rcAsArr(data.comprasJard).filter(r=>r&&r.prod);
    const oldE = _rcAsArr(data.eventosData).filter(e=>e&&(e.nombre||e.id));
    if(!oldF.length && !oldJ.length && !oldE.length){ showToast('Ese backup no tiene compras ni eventos (probablemente se descargó vacío).','error'); return; }
    _rcMergePreview(oldF, oldJ, oldE, 'el backup del ' + (data._meta&&data._meta.fecha ? fmtDate(data._meta.fecha.slice(0,10)) : 'archivo'));
  };
  reader.readAsText(file);
}

async function restaurarComprasDesdeSafe(){
  if(userRole!=='gerencia'){ showToast('Solo gerencia.','error'); return; }
  // El resguardo se lee recién ahora (ya no se descarga al abrir la app)
  let sf, sj, se;
  try{
    showToast('Leyendo el resguardo automático…');
    [sf, sj, se] = (await Promise.all(['comprasFloreSafe','comprasJardSafe','eventosSafe'].map(k=>window.fbGetOnce(k)))).map(_rcAsArr);
  }catch(e){ showToast('Sin conexión: no se pudo leer el resguardo.','error'); return; }
  if(!sf.length && !sj.length && !se.length){ showToast('Todavía no hay resguardo automático guardado.'); return; }
  _rcMergePreview(sf, sj, se, 'el resguardo automático');
}

function renderRestaurarComprasPreview(){
  const body=document.getElementById('rc-body'); if(!body||!_restoreCompras) return;
  const {addF,addJ,addE,oldF,oldJ,oldE,fuente}=_restoreCompras;
  const total=addF.length+addJ.length+addE.length;
  const porMes={}; addF.forEach(r=>{const m=(r.fecha||'').slice(0,7)||'sin fecha'; porMes[m]=(porMes[m]||0)+1;});
  const meses=Object.keys(porMes).sort().map(m=>`${m}: ${porMes[m]}`).join(' · ');
  body.innerHTML = `
    <div style="font-size:12.5px;color:var(--mid-gray);margin-bottom:12px">Fuente: ${esc(fuente)} · ${oldF} compras florería, ${oldJ} jardinería y ${oldE} eventos en el archivo.</div>
    <div style="background:var(--surface-2);border-radius:8px;padding:12px 14px;margin-bottom:14px">
      <div style="font-size:14px;font-weight:600;margin-bottom:4px">Se van a recuperar ${total} registro${total!==1?'s':''}</div>
      <div style="font-size:12.5px;color:var(--mid-gray)">Compras florería: <strong>${addF.length}</strong> · Jardinería: <strong>${addJ.length}</strong> · Eventos: <strong>${addE.length}</strong> — solo los que faltan; no se pisa ni duplica nada de lo actual.</div>
      ${meses?`<div style="font-size:12px;color:var(--mid-gray);margin-top:6px">Compras florería por mes → ${esc(meses)}</div>`:''}
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end">
      <button class="btn-secondary" onclick="closeModal('restaurar-compras-modal')">Cancelar</button>
      <button class="btn-add" ${total?'':'disabled'} onclick="confirmarRestaurarCompras()">Recuperar ${total} registro${total!==1?'s':''}</button>
    </div>`;
}

function confirmarRestaurarCompras(){
  if(!_restoreCompras) return;
  const {addF,addJ,addE}=_restoreCompras;
  if(!addF.length && !addJ.length && !addE.length){ showToast('No hay registros nuevos para recuperar.'); return; }
  if(addF.length){ addF.forEach(r=>comprasFlore.push(r)); window._comprasFloreLastSave=Date.now(); fbSave('comprasFlore', comprasFlore); }
  if(addJ.length){ addJ.forEach(r=>comprasJard.push(r)); window._comprasJardLastSave=Date.now(); fbSave('comprasJard', comprasJard); }
  if(addE.length){
    addE.forEach(e=>{ if(!e.id) e.id = genEventoId(); eventosData.push(e); });
    _saveEventos();
    if(typeof syncEventosToKanban==='function'){ syncEventosToKanban(); fbSave('kanbanData', kanbanData); }
  }
  const n = addF.length+addJ.length+addE.length;
  closeModal('restaurar-compras-modal'); _restoreCompras=null;
  renderCompras('floreria');
  if(typeof renderEventos==='function') renderEventos();
  if(document.getElementById('page-stock')?.classList.contains('active')) renderStock();
  updateKpiCompras();
  showToast(`Recuperados ${n} registro${n!==1?'s':''} (compras + eventos).`);
}

configurarVentas({ get CL_RESP_OPTS(){ return CL_RESP_OPTS; }, CURR_MONTH, ESTADO_COLORS, TODAY_ISO, arregloEmoji, calcCostoComposicion, closeModal, get cotizadorConfig(){ return cotizadorConfig; }, ensureKanbanCols, fbSave, fmtMonth, genEventoId, getFloristasActivos, getSucursalId, get kanbanData(){ return kanbanData; }, notificarAsignacion, notificarVentaNueva, get recetasData(){ return recetasData; }, renderKanban, sensibleCargado });
configurarCaja({ fbSave, closeModal, getSucursalId, sensibleCargado, TODAY_ISO });
configurarCostoHotel({
  comprasFlore: ()=>comprasFlore, _repMeses, _kpiCard, _downloadCSV, TODAY_ISO,
});
configurarCalendario({
  eventos: ()=>eventosData, renderEventos, fmtMonth, TODAY_ISO, CURR_MONTH,
});
configurarCotizadorEventos({
  recetas: ()=>recetasData, pricing: ()=>eventoPricing,
  renderEvTipos, calcCostoComposicion, arregloEmoji,
});
configurarFotosRamo({
  getVentas: ()=>ventasData, genId: genEventoId, fbSave: (...a)=>fbSave(...a),
  onCambio: ()=>{ if(document.getElementById('page-ventas-externas')?.classList.contains('active')) renderVentas(); },
});
// Borrar fotos de ramos con más de 48 hs (respaldo del cron del Worker).
(function _limpiezaFotosRamo(){
  const correr = () => { if(window.fbReady) limpiarFotosRamoVencidas(); else setTimeout(correr, 5000); };
  setTimeout(correr, 15000);
  setInterval(correr, 3600*1000);
})();
configurarPedidosHab({
  recetas: ()=>recetasData, ramos: ()=>ramosDispData, cotizador: ()=>cotizadorConfig,
  kanban: ()=>kanbanData, ventas: ()=>ventasData,
  ensureKanbanCols, genEventoId, calcCostoComposicion, TODAY_ISO, CURR_MONTH,
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
    get cotCurTab()          { return cotCurTab; },          set cotCurTab(v)         { setCotCurTab(v); },
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

  // Menú lateral: se arma según las páginas que puede ver el rol (navegacion.js)
  renderSidebarNav(role, !!jardineroNombre);
  setUserMenuInfo(window.currentUserLabel || floristaNombre || jardineroNombre || role);

  if(role === 'florista') showToast('Hola ' + floristaNombre + '!');
  if(role === 'comercial') showToast('Hola Euge!');
  if(role === 'ventas'){
    setTimeout(()=> navigate('home-hyatt'), 100);
    // Ocultar botón de cargar ramo (ventas solo ve y vende)
    const btnAddRamo = document.getElementById('btn-add-ramo');
    if(btnAddRamo) btnAddRamo.style.display = 'none';
  }
  if(role === 'compras') setTimeout(()=> navigate('compras-floreria'), 100);
  if(role === 'jardinero') setTimeout(()=>{ navigate('jardineria-ops'); if(jardineroNombre) showToast('Hola '+jardineroNombre+'!'); }, 100);
  if(role === 'housekeeping') setTimeout(()=>{ navigate('control-habitaciones'); showToast('Housekeeping'); }, 100);

  // Renderizar barra de navegación inferior mobile
  renderBottomNav(role, !!jardineroNombre);
  // Aviso de recordatorios nuevos: badge + cartel al entrar, toast demorado
  // para no pisar el saludo de bienvenida
  renderJardRecAviso();
  setTimeout(notificarRecordatoriosNuevos, 4000);
  // Recordatorio de backup mensual (solo gerencia, demorado)
  if(role === 'gerencia') setTimeout(recordarBackup, 8000);
  // Re-renderizar el Inicio ya con el rol aplicado (evita mostrar el panel completo a no-gerencia)
  if(document.getElementById('home-kpis')) renderHome();
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
    return `<button onclick="registrarHoraEvento(${evIdx},'${campo}','${fase}')" style="background:${campo==='inicio'?'var(--green-ok)':'var(--amber)'};color:white;border:none;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;font-family:inherit">${campo==='inicio'?icon('play')+'Inicio':icon('stop')+'Fin'}</button>`;
  }
  return '<span style="color:var(--mid-gray);font-size:12px">—</span>';
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
      _saveEventos();
      renderChecklistTable();
      if(document.getElementById('page-eventos-comercial')?.classList.contains('active')) renderEventos();
      if(document.getElementById('page-eventos-maison')?.classList.contains('active')) renderKanban();
      renderHome();
      showToast(`Retiro finalizado: "${ev.nombre}". Evento completo.`);
      return;
    }
    _saveEventos();
    renderChecklistTable();
    showToast(`Inicio de retiro: "${ev.nombre}" · ${hhmm}`);
    return;
  }

  if(fase === 'colocacion'){
    ev[campo === 'inicio' ? 'colocacionInicio' : 'colocacionFin'] = hhmm;
    if(campo === 'fin'){
      // Colocación terminada. Si hay retiro asignado, queda pendiente de retiro;
      // si no, el evento se finaliza (comportamiento de siempre).
      if(ev.retiroAsignado){
        ev.estado = 'Pendiente de Retiro';
        _saveEventos();
        renderChecklistTable();
        if(document.getElementById('page-eventos-comercial')?.classList.contains('active')) renderEventos();
        if(document.getElementById('page-eventos-maison')?.classList.contains('active')) renderKanban();
        renderHome();
        notificarAsignacion(ev.retiroAsignado, 'Listo para retirar', `"${ev.nombre}" ya fue colocado. Retirá el arreglo al finalizar el evento.`);
        showToast(`Colocación finalizada: "${ev.nombre}". Pendiente de retiro por ${ev.retiroAsignado}.`);
        return;
      }
      ev.estado = 'Pedidos Finalizados';
      _saveEventos();
      renderChecklistTable();
      if(document.getElementById('page-eventos-comercial')?.classList.contains('active')) renderEventos();
      if(document.getElementById('page-eventos-maison')?.classList.contains('active')) renderKanban();
      renderHome();
      showToast(`Colocación finalizada: "${ev.nombre}". Evento completo.`);
      return;
    }
    _saveEventos();
    renderChecklistTable();
    showToast(`Inicio de colocación: "${ev.nombre}" · ${hhmm}`);
    return;
  }

  // Armado
  ev[campo] = hhmm;
  if(campo === 'fin'){
    // Inicio+Fin = armado terminado → queda pendiente de colocación
    ev.estado = 'Pendiente de Colocacion';
    _saveEventos();
    renderChecklistTable();
    if(document.getElementById('page-eventos-comercial')?.classList.contains('active')) renderEventos();
    if(document.getElementById('page-eventos-maison')?.classList.contains('active')) renderKanban();
    renderHome();
    // Aviso a gerencia para que asigne la colocación
    window.pushSend?.('Evento listo para colocación', `"${ev.nombre}" fue armado por ${ev.asignado||'el equipo'}. Asigná la colocación.`, 'colocacion');
    showToast(`Armado finalizado: "${ev.nombre}". Avisamos a gerencia para la colocación.`);
    return;
  }
  _saveEventos();
  renderChecklistTable();
  showToast(`Inicio de armado: "${ev.nombre}" · ${hhmm}`);
}

// Inicio/Fin para ventas
function renderVentaHoraCell(vIdx, campo, v){
  const val = v[campo] || '';
  if(val){
    return `<span style="font-size:13px;font-weight:600;color:var(--green-ok)">${val}</span>`;
  }
  if(campo === 'inicio' || (campo === 'fin' && v.inicio)){
    return `<button onclick="registrarHoraVenta(${vIdx},'${campo}')" style="background:${campo==='inicio'?'var(--green-ok)':'var(--amber)'};color:white;border:none;border-radius:4px;padding:4px 10px;font-size:12px;cursor:pointer;font-family:inherit">${campo==='inicio'?icon('play')+'Inicio':icon('stop')+'Fin'}</button>`;
  }
  return '<span style="color:var(--mid-gray);font-size:12px">—</span>';
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
  showToast(`${campo==='inicio'?'Inicio':'Fin'} registrado para "${ventasData[vIdx].prod}": ${hh}:${mm}`);
  // Ramo terminado: ofrecer sacarle una foto para el cliente (se guarda 48 hs).
  if(campo === 'fin') ofrecerFotoRamo(vIdx);
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
window._setLoginAuth = (v) => { loginAuth = (v && typeof v === 'object' && Object.keys(v).length) ? v : null; _syncJardinerosDesdeAuth(); };
// Los jardineros agregados desde Gestión de Usuarios viven en loginAuth; sumamos
// sus nombres a JARDINEROS_LIST para que aparezcan en los desplegables de jardinería
// aunque no estén en la lista base hardcodeada.
function _syncJardinerosDesdeAuth(){
  Object.values(loginAuth||{}).forEach(e => {
    const n = e && (e.jardineroNombre || (e.role==='jardinero' ? e.label : ''));
    if(n && !JARDINEROS_LIST.includes(n)) JARDINEROS_LIST.push(n);
  });
}

function _bufToB64(buf){ let s=''; new Uint8Array(buf).forEach(b=>s+=String.fromCharCode(b)); return btoa(s); }
function _randSalt(){ return _bufToB64(crypto.getRandomValues(new Uint8Array(16))); }

// 100000 es el máximo que admite el Worker; los hashes viejos (sin `iter`) usan 150000.
const ITER_HASH = 100000;
async function hashPassword(pw, saltB64, iter = 150000){
  // Normaliza como el login histórico (case-insensitive, sin espacios)
  const norm = String(pw).trim().toLowerCase();
  const salt = Uint8Array.from(atob(saltB64), c=>c.charCodeAt(0));
  const keyMat = await crypto.subtle.importKey('raw', new TextEncoder().encode(norm), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt, iterations:iter, hash:'SHA-256' }, keyMat, 256);
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

// Pasa un hash viejo (150000 vueltas) al formato nuevo que puede verificar el Worker.
// Se hace al entrar con éxito, que es el único momento en que se conoce el código.
async function _actualizarHash(id, e, code){
  if((e.iter || 150000) === ITER_HASH || !window.fbSetPath) return;
  try{
    const salt = _randSalt();
    const hash = await hashPassword(code, salt, ITER_HASH);
    const nuevo = { ...e, salt, hash, iter: ITER_HASH };
    if(loginAuth) loginAuth[id] = nuevo;
    window.fbSetPath('loginAuth/'+id, nuevo);
  }catch(err){ console.warn('No se pudo actualizar el hash', err?.message||err); }
}

// Verifica una contraseña. Devuelve {entry, id} o null.
async function verificarLogin(val){
  if(loginAuth){
    for(const [id, e] of Object.entries(loginAuth)){
      if(!e?.salt || !e?.hash) continue;
      const h = await hashPassword(val, e.salt, e.iter || 150000);
      if(h === e.hash){
        _actualizarHash(id, e, val);
        return { entry: {...e}, id };
      }
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

// Pregunta al SERVIDOR si ya existe loginAuth. Devuelve el objeto si existe,
// null si el servidor confirma que no hay, o undefined si no se pudo confirmar
// (sin conexión, Firebase sin iniciar o demora). Que el listener todavía no
// haya traído los usuarios NO significa que no existan: sin esta confirmación
// la app reconstruía loginAuth desde los usuarios de fábrica y borraba a los
// agregados después (ej. jardineros nuevos) al entrar gerencia con mala señal.
async function _loginAuthEnServidor(){
  if(!window.fbGetOnce) return undefined;
  try{
    const val = await Promise.race([
      window.fbGetOnce('loginAuth'),
      new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')), 8000)),
    ]);
    if(val && typeof val === 'object' && Object.keys(val).length){
      window._loginAuthReady = true;
      window._setLoginAuth(val);
      return val;
    }
    return null;
  }catch(e){
    console.warn('No se pudo confirmar loginAuth en el servidor:', e?.message||e);
    return undefined;
  }
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
  // Solo migrar si el servidor CONFIRMA que no existe loginAuth.
  if(await _loginAuthEnServidor() !== null) return;
  const auth = await _construirLoginAuth(loginPasswords);
  let ok = false;
  for(const e of Object.values(auth)){
    if(await hashPassword(pwGerenciaActual, e.salt, e.iter || 150000) === e.hash){ ok = true; break; }
  }
  if(!ok){ console.warn('Migración de login abortada: autoverificación falló'); return; }
  loginAuth = auth;
  _persistLoginAuth();
  if(window.fbSetPath) window.fbSetPath('loginPasswords', null); // borra el texto plano de la base
  showToast('Contraseñas protegidas — ahora se guardan cifradas');
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
    showToast('Esperá unos segundos, cargando usuarios…');
    return false;
  }
  // Confirmar contra el servidor antes de reconstruir: si no hay conexión o ya
  // existen usuarios, NUNCA pisar loginAuth con los usuarios de fábrica.
  const srv = await _loginAuthEnServidor();
  if(srv) return true;
  if(srv === undefined){ showToast('Sin conexión con la base: no se pueden gestionar usuarios ahora','error'); return false; }
  // El servidor confirma que no hay loginAuth → migrar desde loginPasswords
  loginAuth = await _construirLoginAuth(loginPasswords);
  _persistLoginAuth();
  if(window.fbSetPath) window.fbSetPath('loginPasswords', null);
  return true;
}

// Setea (o crea) la contraseña de un usuario del esquema con hash
async function _setUserPassword(id, pw){
  if(!loginAuth || !loginAuth[id]) return false;
  const salt = _randSalt();
  const hash = await hashPassword(pw, salt, ITER_HASH);
  loginAuth[id] = { ...loginAuth[id], salt, hash, iter: ITER_HASH };
  if(window.fbSetPath) window.fbSetPath('loginAuth/'+id, loginAuth[id]);
  else _persistLoginAuth();
  return true;
}

// ¿Ya existe un usuario con esa contraseña? (para evitar colisiones al crear)
async function _passwordEnUso(pw){
  if(!loginAuth) return !!loginPasswords[String(pw).trim().toLowerCase()];
  for(const e of Object.values(loginAuth)){
    if(e?.salt && await hashPassword(pw, e.salt, e.iter || 150000) === e.hash) return true;
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
      ['', mis.length ? `Tenés ${mis.length} tarea${mis.length!==1?'s':''} asignada${mis.length!==1?'s':''} para hoy` : 'Todavía no tenés tareas asignadas'],
      horario?.desde ? ['', `Tu turno: ${horario.desde} a ${horario.hasta||'—'}`] : null,
      evs.length ? ['', 'Eventos: ' + esc(evs.map(e=>e.nombre).slice(0,2).join(' · '))] : null,
    ];
  } else if(userRole==='gerencia'){
    const evsHoy = (eventosData||[]).filter(e => e.fecha===TODAY_ISO && e.estado!=='Pedidos Finalizados');
    const conTurno = getFloristasActivos().filter(n => (window.horariosData||{})[n]?.[TODAY_ISO]?.desde);
    const hechas = (ds.checked||[]).filter(Boolean).length;
    const venc = jardRecordatorios.filter(r=>recEstado(r)==='vencido').length;
    rows = [
      ['', evsHoy.length ? `${evsHoy.length} evento${evsHoy.length!==1?'s':''} hoy: ${esc(evsHoy.map(e=>e.nombre).slice(0,2).join(' · '))}` : 'Sin eventos hoy'],
      ['', conTurno.length ? 'Con turno hoy: ' + esc(conTurno.join(', ')) : 'Nadie con turno asignado hoy'],
      ['', `Checklist: ${hechas} de ${CL_TASKS.length} tareas hechas`],
      venc ? ['', `${venc} recordatorio${venc!==1?'s':''} de jardín vencido${venc!==1?'s':''}`] : null,
    ];
  } else if(userRole==='jardinero'){
    const venc = jardRecordatorios.filter(r=>recEstado(r)==='vencido').length;
    const prox = jardRecordatorios.filter(r=>recEstado(r)==='proximo').length;
    rows = [
      venc ? ['', `${venc} recordatorio${venc!==1?'s':''} vencido${venc!==1?'s':''} para atender`] : ['', 'Recordatorios de jardín al día'],
      prox ? ['', `${prox} por vencer en los próximos días`] : null,
    ];
  }
  rows = rows.filter(Boolean);

  const nombre = floristaNombre || jardineroNombre || (userRole==='gerencia' ? '' : label);
  const ov = document.createElement('div');
  ov.id = 'briefing-overlay';
  ov.className = 'briefing-overlay';
  ov.innerHTML = `
    <div class="briefing-card">
      <div class="briefing-flor"></div>
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
    ['', `${r.regs} tareas completadas` + (flor.length ? ' — ' + esc(flor.slice(0,3).map(([n,d])=>`${n}: ${d.hechas}`).join(', ')) : '')],
    flor.some(([,d])=>d.exc) ? ['', 'Excedidas: ' + esc(flor.filter(([,d])=>d.exc).map(([n,d])=>`${n} ${d.exc}`).join(', '))] : null,
    ['', `${fmtARS(r.totalVentas)} en ventas (${r.nVentas})`],
    ['', `${r.eventos} evento${r.eventos!==1?'s':''} realizado${r.eventos!==1?'s':''}`],
    r.peorZona && r.peorDias>=5 ? ['', `Zona más atrasada de Nuevo: ${esc(r.peorZona)} (${r.peorDias>900?'sin registro':r.peorDias+' días'})`] : null,
  ].filter(Boolean);

  const desdeTxt = new Date(desde+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'short'});
  const hastaTxt = new Date(hasta+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'short'});
  const ov = document.createElement('div');
  ov.id = 'briefing-overlay';
  ov.className = 'briefing-overlay';
  ov.innerHTML = `
    <div class="briefing-card">
      <div class="briefing-flor"></div>
      <div class="briefing-saludo">Resumen de la semana</div>
      <div class="briefing-fecha">${desdeTxt} — ${hastaTxt}</div>
      <div class="briefing-rows">${rows.map(([ic,tx])=>`<div class="briefing-row"><span>${ic}</span><span>${tx}</span></div>`).join('')}</div>
      <button class="btn-add briefing-btn" onclick="cerrarBriefing()">Cerrar</button>
    </div>`;
  ov.addEventListener('click', e => { if(e.target === ov) cerrarBriefing(); });
  document.body.appendChild(ov);
  requestAnimationFrame(()=>ov.classList.add('open'));

  // Aviso por push a los demás dispositivos de gerencia
  window.pushSend?.('Resumen semanal listo',
    `${r.regs} tareas · ${fmtARS(r.totalVentas)} en ventas · ${r.eventos} eventos`,
    'resumen-semanal', 'roles:gerencia');
}

// Ingreso por el servicio de Cloudflare: valida el código y devuelve un token
// de Firebase con su cuenta y rol. Si el servicio no está listo (503, sin red) o no
// reconoce el código, devuelve null y el ingreso sigue como antes.
async function loginEnServidor(code){
  try{
    const r = await fetch('/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code }) });
    if(!r.ok) return null;
    const d = await r.json();
    if(!d?.email || !d?.password || !d?.entry || !window.fbSignInWithCredentials) return null;
    await window.fbSignInWithCredentials(d.email, d.password);
    return { entry: { ...d.entry }, id: d.id };
  }catch(e){
    console.warn('Ingreso por servidor no disponible:', e?.message || e);
    return null;
  }
}

async function doLogin(){
  const inp = document.getElementById('login-input');
  const err = document.getElementById('login-error');
  const val = inp.value.trim();
  if(!val) return;
  const found = (await loginEnServidor(val)) || await verificarLogin(val);
  if(found){
    const entry = found.entry;
    if(!loginAuth) currentLoginKey = val.trim().toLowerCase(); // modo viejo: cambio de contraseña propia
    _aplicarEntry(entry, found.id);
    applyRole(entry.role);
    // Caja, sueldos, legajos y claves solo se descargan para gerencia (las reglas de la base los cierran al resto).
    if(entry.role === 'gerencia') window.fbStartSensibles?.();
    renderSucursalIndicador();
    const screen = document.getElementById('login-screen');
    screen.classList.add('hide');
    setTimeout(()=>screen.remove(), 520);
    // Migración de seguridad: gerencia convierte las contraseñas a hashes la
    // primera vez que entra (retrocompatible, no rompe el flujo del personal).
    if(entry.role === 'gerencia' && !loginAuth){ setTimeout(()=>migrarSeguridadLogin(val), 3000); }
    // Activar notificaciones push si el navegador lo soporta
    setTimeout(()=>initPushForUser?.(), 2000);
    setTimeout(()=>alertasAutomaticas(TODAY_ISO), 4000);
    setTimeout(()=>checkOnboarding(entry.role), 800);
    setTimeout(()=>irAAtajoInicial(), 100);
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
  if(!nueva || nueva.trim().length < 4){ showToast('La contraseña debe tener al menos 4 caracteres'); return; }
  const nuevaClean = nueva.trim();
  const confirmar = await promptModal('Confirmá la nueva contraseña:', { title: 'Cambiar contraseña', password: false });
  if(!confirmar || confirmar.trim().toLowerCase() !== nuevaClean.toLowerCase()){ showToast('Las contraseñas no coinciden'); return; }
  if(loginAuth){
    if(!currentAuthId || !loginAuth[currentAuthId]){ showToast('Error de sesión'); return; }
    await _setUserPassword(currentAuthId, nuevaClean);
  } else {
    // Modo viejo (texto plano): todavía sin migrar
    const entry = loginPasswords[currentLoginKey];
    if(!entry){ showToast('Error de sesión'); return; }
    const nuevoKey = nuevaClean.toLowerCase();
    if(nuevoKey !== currentLoginKey && loginPasswords[nuevoKey]){ showToast('Esa contraseña ya está en uso'); return; }
    loginPasswords[nuevoKey] = {...entry};
    if(nuevoKey !== currentLoginKey) delete loginPasswords[currentLoginKey];
    currentLoginKey = nuevoKey;
    fbSave('loginPasswords', loginPasswords);
  }
  showToast('Contraseña cambiada. Ahora ingresás con: ' + nuevaClean);
}

async function openGestionPasswords(){
  if(userRole !== 'gerencia'){ showToast('Solo gerencia'); return; }
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
  const roleLabels = {gerencia:'Gerencia',operario:'Operario',florista:'Florista',jardinero:'Jardinero',compras:'Compras',ventas:'Hyatt Ventas',comercial:'Comercial',housekeeping:'Housekeeping'};

  ov.innerHTML = `<div class="modal" style="max-width:600px;max-height:85vh;overflow-y:auto">
    <button class="modal-close" onclick="document.getElementById('gestion-passwords-modal').classList.remove('open')">✕</button>
    <div class="modal-title">Gestión de Usuarios</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:6px">Cambiá o reseteá la contraseña de cualquier usuario.</div>
    <div style="font-size:12px;color:var(--sage-dark);background:var(--ok-soft);border-radius:8px;padding:8px 12px;margin-bottom:16px">Las contraseñas se guardan cifradas — por seguridad no se pueden ver, solo cambiar.</div>
    <div style="display:flex;flex-direction:column;gap:1px;background:var(--light-gray);border-radius:8px;overflow:hidden">
      ${entries.map(([id, e]) => `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--warm-white)">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--charcoal)">${esc(e.label || e.floristaNombre || id)}</div>
          <div style="font-size:12px;color:var(--mid-gray)">${roleLabels[e.role]||e.role}</div>
        </div>
        <div style="background:var(--surface-2);padding:4px 12px;border-radius:6px;font-size:12px;color:var(--mid-gray);min-width:70px;text-align:center">•••••</div>
        <button onclick="resetearPassword('${esc(id)}')" style="background:none;border:1px solid var(--light-gray);border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;font-family:inherit;color:var(--charcoal);white-space:nowrap">Cambiar</button>
        ${(e.role==='florista'||e.role==='housekeeping'||e.role==='jardinero') ? `<button onclick="eliminarUsuario('${esc(id)}')" style="background:none;border:1px solid #E8CECE;border-radius:6px;padding:5px 8px;font-size:12px;cursor:pointer;font-family:inherit;color:var(--red-alert);white-space:nowrap">✕</button>` : ''}
      </div>`).join('')}
    </div>
    <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn-add" onclick="agregarUsuarioFlorista()" style="font-size:12px;padding:8px 16px">+ Agregar florista</button>
      <button class="btn-secondary" onclick="agregarUsuarioJardinero()" style="font-size:12px;padding:8px 16px">Agregar jardinero</button>
      <button class="btn-secondary" onclick="agregarUsuarioHousekeeping()" style="font-size:12px;padding:8px 16px">Agregar housekeeping</button>
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
  if(!password || password.trim().length < 4){ showToast('Mínimo 4 caracteres'); return; }
  if(await _passwordEnUso(password.trim())){ showToast('Esa contraseña ya está en uso'); return; }
  const id = nombreClean.toLowerCase().replace(/[.#$/[\]\s]/g,'_');
  if(loginAuth[id]){ showToast('Ya existe un usuario con ese nombre'); return; }
  const salt = _randSalt();
  const hash = await hashPassword(password.trim(), salt, ITER_HASH);
  loginAuth[id] = { role:'housekeeping', label:nombreClean, salt, hash, iter:ITER_HASH };
  if(window.fbSetPath) window.fbSetPath('loginAuth/'+id, loginAuth[id]); else _persistLoginAuth();
  showToast('Usuario housekeeping "' + nombreClean + '" creado — contraseña: ' + password.trim());
  openGestionPasswords();
}

async function agregarUsuarioFlorista(){
  if(userRole !== 'gerencia') return;
  if(!await _ensureLoginAuth()) return;
  const nombre = await promptModal('Nombre del/la florista (ej. María):', { title: 'Nuevo usuario florista' });
  if(!nombre || !nombre.trim()) return;
  const nombreClean = nombre.trim();
  const password = await promptModal('Contraseña para ' + nombreClean + ':', { title: 'Nuevo usuario florista', default: nombreClean.toLowerCase(), password: false });
  if(!password || password.trim().length < 4){ showToast('Mínimo 4 caracteres'); return; }
  if(await _passwordEnUso(password.trim())){ showToast('Esa contraseña ya está en uso'); return; }
  const id = nombreClean.toLowerCase().replace(/[.#$/[\]\s]/g,'_');
  if(loginAuth[id]){ showToast('Ya existe un usuario con ese nombre'); return; }
  const salt = _randSalt();
  const hash = await hashPassword(password.trim(), salt, ITER_HASH);
  loginAuth[id] = { role:'florista', label:nombreClean, floristaNombre:nombreClean, salt, hash, iter:ITER_HASH };
  if(window.fbSetPath) window.fbSetPath('loginAuth/'+id, loginAuth[id]); else _persistLoginAuth();
  if(!CL_RESP_OPTS.includes(nombreClean)){
    CL_RESP_OPTS.push(nombreClean);
    CL_RESP_OPTS.sort((a,b) => a.localeCompare(b,'es'));
  }
  const legNuevo = _crearLegajoParaUsuario(nombreClean, 'florista');
  showToast('Florista ' + nombreClean + ' creado/a — contraseña: ' + password.trim() + (legNuevo?' · legajo creado':''));
  openGestionPasswords();
}

async function agregarUsuarioJardinero(){
  if(userRole !== 'gerencia') return;
  if(!await _ensureLoginAuth()) return;
  const nombre = await promptModal('Nombre del/la jardinero/a (ej. Sole):', { title: 'Nuevo usuario jardinero' });
  if(!nombre || !nombre.trim()) return;
  const nombreClean = nombre.trim();
  const password = await promptModal('Contraseña para ' + nombreClean + ':', { title: 'Nuevo usuario jardinero', default: nombreClean.toLowerCase(), password: false });
  if(!password || password.trim().length < 4){ showToast('Mínimo 4 caracteres'); return; }
  if(await _passwordEnUso(password.trim())){ showToast('Esa contraseña ya está en uso'); return; }
  const id = nombreClean.toLowerCase().replace(/[.#$/[\]\s]/g,'_');
  if(loginAuth[id]){ showToast('Ya existe un usuario con ese nombre'); return; }
  const salt = _randSalt();
  const hash = await hashPassword(password.trim(), salt, ITER_HASH);
  loginAuth[id] = { role:'jardinero', label:nombreClean, jardineroNombre:nombreClean, salt, hash, iter:ITER_HASH };
  if(window.fbSetPath) window.fbSetPath('loginAuth/'+id, loginAuth[id]); else _persistLoginAuth();
  if(!JARDINEROS_LIST.includes(nombreClean)) JARDINEROS_LIST.push(nombreClean);
  const legNuevo = _crearLegajoParaUsuario(nombreClean, 'jardinero');
  showToast('Jardinero/a ' + nombreClean + ' creado/a — contraseña: ' + password.trim() + (legNuevo?' · legajo creado':''));
  openGestionPasswords();
}

async function resetearPassword(id){
  if(userRole !== 'gerencia') return;
  if(!await _ensureLoginAuth()) return;
  const entry = loginAuth[id];
  if(!entry){ showToast('Usuario no encontrado'); return; }
  const nueva = await promptModal('Nueva contraseña para ' + (entry.label||id) + ':', { title: 'Resetear contraseña', password: false });
  if(!nueva || nueva.trim().length < 4){ showToast('Mínimo 4 caracteres'); return; }
  if(await _passwordEnUso(nueva.trim())){ showToast('Esa contraseña ya está en uso por otro usuario'); return; }
  await _setUserPassword(id, nueva.trim());
  showToast('Contraseña de ' + (entry.label||id) + ' cambiada a: ' + nueva.trim());
  openGestionPasswords();
}

async function eliminarUsuario(id){
  if(userRole !== 'gerencia') return;
  if(!await _ensureLoginAuth()) return;
  const entry = loginAuth[id];
  if(!entry) return;
  if(!['florista','housekeeping','jardinero'].includes(entry.role)){ showToast('Solo se pueden eliminar usuarios floristas, jardineros o housekeeping'); return; }
  if(!await confirmModal('¿Eliminar al usuario ' + (entry.label||id) + '?\nYa no podrá ingresar al sistema.')) return;
  if(entry.floristaNombre){ const idx = CL_RESP_OPTS.indexOf(entry.floristaNombre); if(idx > -1) CL_RESP_OPTS.splice(idx, 1); }
  if(entry.jardineroNombre){ const ji = JARDINEROS_LIST.indexOf(entry.jardineroNombre); if(ji > -1) JARDINEROS_LIST.splice(ji, 1); }
  delete loginAuth[id];
  if(window.fbSetPath) window.fbSetPath('loginAuth/'+id, null); else _persistLoginAuth();
  showToast('Usuario ' + (entry.label||id) + ' eliminado');
  openGestionPasswords();
}

async function resetearTodasPasswords(){
  if(userRole !== 'gerencia') return;
  if(!await _ensureLoginAuth()) return;
  if(!await confirmModal('¿Resetear las contraseñas de los usuarios originales?\n\nAlvear, Duhau, Caro, etc. volverán a ser las contraseñas. Los usuarios agregados después se mantienen con su contraseña actual.')) return;
  // Conservar los usuarios agregados desde Gestión (no están en LOGIN_DEFAULTS)
  const base = await _construirLoginAuth(LOGIN_DEFAULTS);
  const agregados = Object.fromEntries(Object.entries(loginAuth||{}).filter(([id]) => !base[id]));
  loginAuth = { ...agregados, ...base };
  _persistLoginAuth();
  if(window.fbSetPath) window.fbSetPath('loginPasswords', null);
  showToast('Todas las contraseñas reseteadas a valores originales');
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

// Artículos: nombres ya cargados (para que lo nuevo use la forma existente) y
// alias confirmados en "Unificar artículos" (nodo articulosAlias).
setArticulosConocidos(() => [...Object.keys(cotizadorPrecios||{}), ...(stockData||[]).map(s=>s.prod)]);
window._setArticulosAlias = v => setArticulosAlias(v);

// Insumos personalizados agregados por el usuario (se guardan en localStorage)
let insumosCustom = JSON.parse(localStorage.getItem('fl_insumos_custom')||'[]');

// Hidratar la materia prima propia desde Firebase (se comparte entre dispositivos).
// Fusiona con lo local para no perder lo cargado sin conexión.
window._setInsumosCustom = (arr) => {
  const remotos = !arr ? [] : (Array.isArray(arr) ? arr : Object.values(arr||{}));
  const merged = [...new Set([...insumosCustom, ...remotos.map(String).map(s=>s.trim()).filter(Boolean)])];
  insumosCustom.splice(0, insumosCustom.length, ...merged);
  aplicarAliasANodo('insumosCustom', insumosCustom); // formas viejas de artículos ya unificados
  localStorage.setItem('fl_insumos_custom', JSON.stringify(insumosCustom));
  // Refrescar el datalist de la galería si el modal está abierto
  const dl = document.getElementById('gal-insumos-list');
  if(dl) dl.innerHTML = getAllInsumos().map(n=>`<option value="${esc(n)}">`).join('');
  if(typeof populateFloreriaFormHelpers==='function') populateFloreriaFormHelpers();
};

function getAllInsumos(){
  return listaSinRepetidos([...Object.keys(cotizadorPrecios||{}), ...insumosBDBase, ...insumosCustom], Object.keys(cotizadorPrecios||{}));
}

function saveInsumosCustom(){
  localStorage.setItem('fl_insumos_custom', JSON.stringify(insumosCustom));
  // Compartir la materia prima propia con el resto de los dispositivos
  if(typeof fbSave==='function') fbSave('insumosCustom', insumosCustom);
}

function addInsumoToBase(nombre){
  const n = nombreArticulo(nombre);
  if(!n) return;
  if(!insumosBDBase.some(x=>mismoArticulo(x,n)) && !insumosCustom.some(x=>mismoArticulo(x,n))){
    insumosCustom.push(n);
    saveInsumosCustom();
    populateFloreriaFormHelpers();
    showToast('"'+n+'" agregado a la base de insumos');
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
      <label class="insumo-label" for="${id}">${esc(nombre)}${isCustom?' <span style="font-size:12px;color:var(--sage);font-weight:600">NUEVO</span>':''}</label>
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
  showToast(''+added+' insumo'+(added>1?'s':'')+' agregado'+(added>1?'s':'')+' al pedido');
  // Scroll a la tabla
  document.getElementById('tbody-floreria')?.closest('.compras-list-wrap')?.scrollIntoView({behavior:'smooth',block:'start'});
}

let recetasData = [];



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
    html += `<div style="background:var(--surface-1);border:1px solid var(--light-gray);border-radius:4px;padding:18px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:20px"></span>
          <span style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--charcoal)">${esc(who)}</span>
        </div>
        <div style="display:flex;gap:16px;flex-wrap:wrap">
          <div style="text-align:center"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Tareas</div><div style="font-size:22px;font-weight:700;color:var(--charcoal)">${d.tareas}</div></div>
          <div style="text-align:center"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Total</div><div style="font-size:22px;font-weight:700;color:${color}">${fmtDur(d.minutos)}</div></div>
          <div style="text-align:center"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Prom/tarea</div><div style="font-size:22px;font-weight:700;color:var(--sage)">${avg>0?fmtDur(avg):'—'}</div></div>
        </div>
      </div>
      <div style="height:8px;background:var(--light-gray);border-radius:4px;overflow:hidden;margin-bottom:12px">
        <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;transition:width .4s"></div>
      </div>
      ${d.detalle.length > 0 ? `<details><summary style="font-size:12px;color:var(--mid-gray);cursor:pointer;user-select:none">Ver detalle (${d.detalle.length} tareas)</summary>
        <div style="margin-top:10px;overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead><tr style="background:var(--cream)">
              <th style="padding:6px 10px;text-align:left;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Fecha</th>
              <th style="padding:6px 10px;text-align:left;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Tarea</th>
              <th style="padding:6px 10px;text-align:left;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Zona</th>
              <th style="padding:6px 10px;text-align:center;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Inicio</th>
              <th style="padding:6px 10px;text-align:center;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Fin</th>
              <th style="padding:6px 10px;text-align:center;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Duración</th>
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

// Junta TODO el trabajo con horario de inicio/fin: checklist del hotel, eventos
// (armado/colocación/retiro), ventas, jardinería y habitaciones. Antes el informe
// leía solo el historial de la checklist y los eventos nunca aparecían.
function _prodRegistros(){
  const out = (checklistHistory||[]).map(r => ({ ...r }));
  const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  // Una tarea cuenta si tiene inicio y fin, o si se la dio por hecha aunque no se
  // haya anotado el horario (igual que las de la checklist marcadas sin cronómetro).
  const add = (who, fecha, zona, actividad, inicio, fin, hecho) => {
    if(!who || !((inicio && fin) || hecho)) return;
    const iso = String(fecha||'').slice(0,10);
    const p = iso.split('-').map(Number);
    const d = p.length===3 && p[0] ? new Date(p[0], p[1]-1, p[2]) : null;
    out.push({ who, date: iso, week: d ? getWeekLabel(d) : '', day: d ? DIAS[d.getDay()] : '',
      zona, actividad, inicio: inicio||'', fin: fin||'', ref: 0 });
  };
  (eventosData||[]).forEach(ev => {
    const n = ev.nombre || '(evento)';
    const est = ev.estado;
    const finalizado = est === 'Pedidos Finalizados';
    const pasoArmado = finalizado || est === 'Pendiente de Colocacion' || est === 'Pendiente de Retiro';
    const pasoColoc  = finalizado || est === 'Pendiente de Retiro';
    // Un evento asignado cuya fecha ya pasó se da por hecho aunque nadie haya movido su estado.
    const pasado = f => !!f && f < TODAY_ISO;
    add(ev.asignado,           ev.fecha,                       n, 'Evento · Armado',     ev.inicio,           ev.fin,           pasoArmado || pasado(ev.fecha));
    add(ev.colocacionAsignado, ev.colocacionFecha || ev.fecha, n, 'Evento · Colocación', ev.colocacionInicio, ev.colocacionFin, pasoColoc  || pasado(ev.colocacionFecha || ev.fecha));
    add(ev.retiroAsignado,     ev.retiroFecha || ev.fecha,     n, 'Evento · Retiro',     ev.retiroInicio,     ev.retiroFin,     finalizado || pasado(ev.retiroFecha || ev.fecha));
  });
  (ventasData||[]).forEach(v => add(v.asignado, v.fecha, v.prod || 'Venta', 'Venta / pedido', v.inicio, v.fin, v.estado === 'entregado' || (!!v.fecha && v.fecha < TODAY_ISO)));
  (ramosDispData||[]).forEach(r => add(r.quien, r.creado, r.nombre || 'Ramo', 'Ramo armado', '', '', true));
  (jardineriaLog||[]).forEach(e => add(e.quien, e.fecha, [e.group, e.task].filter(Boolean).join(' · ') || 'Jardinería', 'Jardinería', e.horaInicio, e.horaFin, true));
  (habitacionesLog||[]).forEach(e => add(e.quien, e.fecha, e.hab || 'Habitación', 'Habitaciones', e.horaInicio, e.horaFin, true));
  return out;
}

function renderProductividad(){
  const filterEl = document.getElementById('prod-week-filter');
  const todos = _prodRegistros();
  // Populate week options
  const weeks = [...new Set(todos.map(r=>r.week).filter(Boolean))].sort();
  // La primera vez se abre en la semana en curso; después se respeta lo que elija gerencia.
  if(!window._prodSemanaInit){
    window._prodSemanaInit = true;
    const actual = getWeekLabel(new Date());
    if(weeks.includes(actual)) filterEl.dataset.pick = actual;
  }
  const curVal = filterEl.dataset.pick || filterEl.value;
  delete filterEl.dataset.pick;
  filterEl.innerHTML = '<option value="">Todas las semanas</option>';
  weeks.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w; opt.textContent = w;
    if(w === curVal) opt.selected = true;
    filterEl.appendChild(opt);
  });
  filterEl.value = weeks.includes(curVal) ? curVal : '';

  const semanaFiltro = filterEl.value;
  const registros = semanaFiltro
    ? todos.filter(r => r.week === semanaFiltro)
    : todos;

  // Agrupar por operario (ignora mayúsculas/acentos: "Iván" e "Ivan" son la misma persona)
  const byWho = {}, nombres = {};
  registros.forEach(r => {
    const clave = _normName(r.who) || '—';
    if(!nombres[clave]) nombres[clave] = r.who || '—';
    const who = clave;
    if(!byWho[who]) byWho[who] = { tareas: 0, conHorario: 0, minutos: 0, conRef: 0, excedidas: 0, detalle: [] };
    byWho[who].tareas++;
    let conDur = false;
    if(r.inicio && r.fin){
      const dur = calcDuracion(r.inicio, r.fin);
      if(dur){
        conDur = true;
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
    if(!conDur) byWho[who].detalle.push({ zona: r.zona, actividad: r.actividad, inicio: '', fin: '', dur: 0, ref: 0, excedida: false, day: r.day, date: r.date });
  });

  const body = document.getElementById('productividad-body');
  if(Object.keys(byWho).length === 0){
    body.innerHTML = '<p style="color:var(--mid-gray);font-size:13px;text-align:center;padding:20px">Sin datos para el período seleccionado.</p>';
    return;
  }

  // Detalle ordenado por fecha (y hora) para leer la jornada día por día
  Object.values(byWho).forEach(d => d.detalle.sort((a,b) => (a.date||'').localeCompare(b.date||'') || (a.inicio||'99').localeCompare(b.inicio||'99')));

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
      <div style="background:var(--surface-1);border:1px solid var(--light-gray);border-radius:4px;padding:18px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:20px"></span>
            <span style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--charcoal)">${esc(nombres[who] || who)}</span>
          </div>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <div style="text-align:center">
              <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Tareas</div>
              <div style="font-size:22px;font-weight:700;color:var(--charcoal)">${d.tareas}</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Con horario</div>
              <div style="font-size:22px;font-weight:700;color:${color}">${d.conHorario}</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Total registrado</div>
              <div style="font-size:22px;font-weight:700;color:${color}">${fmtDur(d.minutos)}</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Prom/tarea</div>
              <div style="font-size:22px;font-weight:700;color:var(--sage)">${avgMin > 0 ? fmtDur(avgMin) : '—'}</div>
            </div>
            <div style="text-align:center" title="Tareas que superaron el tiempo de referencia">
              <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Se pasó</div>
              <div style="font-size:22px;font-weight:700;color:${excColor}">${d.conRef > 0 ? d.excedidas + '/' + d.conRef : '—'}</div>
            </div>
          </div>
        </div>
        <div style="height:8px;background:var(--light-gray);border-radius:4px;overflow:hidden;margin-bottom:12px">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;transition:width .4s"></div>
        </div>
        ${d.detalle.length > 0 ? `
        <details open style="margin-top:4px">
          <summary style="font-size:12px;color:var(--mid-gray);cursor:pointer;user-select:none">Ver detalle de tareas (${d.detalle.length})</summary>
          <div style="margin-top:10px;overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead><tr style="background:var(--cream)">
                <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase">Día</th>
                <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase">Zona</th>
                <th style="padding:6px 10px;text-align:left;color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase">Actividad</th>
                <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase">Inicio</th>
                <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase">Fin</th>
                <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase">Duración</th>
                <th style="padding:6px 10px;text-align:center;color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase">Ref.</th>
              </tr></thead>
              <tbody>
                ${d.detalle.map(t=>`<tr style="border-bottom:1px solid var(--light-gray)">
                  <td style="padding:6px 10px;color:var(--mid-gray);white-space:nowrap">${esc(t.day)}${t.date ? ' ' + esc(t.date.slice(8,10) + '/' + t.date.slice(5,7)) : ''}</td>
                  <td style="padding:6px 10px;font-weight:500">${esc(t.zona)}</td>
                  <td style="padding:6px 10px"><span class="badge ${getBadge(t.actividad)}">${esc(t.actividad)}</span></td>
                  <td style="padding:6px 10px;text-align:center;font-weight:600">${t.inicio||'—'}</td>
                  <td style="padding:6px 10px;text-align:center;font-weight:600">${t.fin||'—'}</td>
                  <td style="padding:6px 10px;text-align:center">${t.inicio && t.fin ? durBadge(t.inicio,t.fin,t.ref) : '<span style="color:var(--mid-gray);font-size:12px">sin horario</span>'}</td>
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
    el.style.cssText = 'font-size:12px;background:var(--light-gray);color:var(--mid-gray);padding:3px 9px;border-radius:10px;letter-spacing:.5px;cursor:default';
    document.querySelector('.topbar-right')?.insertBefore(el, document.querySelector('.theme-toggle-btn'));
  }
  const nombre = getSucursalNombre(currentSucursal);
  el.textContent = ''+nombre;
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
        <button class="btn-icon" onclick="openEditSucursal(${i})" title="Editar"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>
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
  if(!nombre||!id){ showToast('Nombre e ID son obligatorios'); return; }
  const idx = +document.getElementById('suc-idx').value;
  const entry = { id, nombre, direccion, activa: true };
  if(idx>=0) sucursalesConfig[idx] = {...sucursalesConfig[idx],...entry};
  else sucursalesConfig.push(entry);
  fbSave('sucursalesConfig', sucursalesConfig);
  closeModal('suc-modal');
  renderSucursales();
  renderSucursalSelector();
  showToast('Sucursal guardada');
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
    const caja = (cajaData||[]).filter(r=>(r.sucursal||'duhau')===suc.id && (r.fecha||'').startsWith(mesISO));
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
        <div style="font-size:12px;color:var(--mid-gray);margin-left:4px">${esc(suc.direccion||'')}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px">
        ${_kpiCard('Ventas Externas','$'+totalVentas.toLocaleString('es-AR'),ventas.length+' transacciones','var(--green-ok)')}
        ${_kpiCard('Ingresos Caja','$'+totalIngresos.toLocaleString('es-AR'),'vs $'+totalEgresos.toLocaleString('es-AR')+' egresos','var(--charcoal)')}
        ${_kpiCard('Compras','$'+totalCompras.toLocaleString('es-AR'),compras.length+' registros','var(--amber)')}
        ${_kpiCard('Margen Bruto',margen+'%',margen>=0?'Rentable ✓':'Déficit ',+margen>=0?'var(--green-ok)':'var(--red-alert)')}
      </div>
    </div>`;
  }).join('') || '<div style="color:var(--mid-gray);font-size:13px;padding:24px">Sin sucursales activas.</div>';
}

// ── RENTABILIDAD POR EVENTO ───────────────────────────────────────────────────
// ── RENTABILIDAD TABS ─────────────────────────────────────────────────────────
let _rentTab = 'eventos';
let arreglosHotelConfig = {}; // { nombreArreglo: { precioHyatt, cantMensual } }
let arreglosComposicion = {}; // { zonaChecklist: [{prod, qty}] } — qué flores/varas lleva cada arreglo

// Foto de referencia por arreglo/zona — { zona: dataURL(jpeg) }. Se muestra en la
// "Guía del arreglo" (botón junto a la zona en el checklist) junto a la composición,
// para que la florista vea cómo debe quedar cada arreglo Nuevo.
let arreglosFotoRef = {};
let _arreglosFotoRefLoaded = false;
// Acepta el formato NUEVO (lista [{zona, img}], apto para Firebase — las claves con
// "/", "." etc. rompen la escritura a RTDB) y el VIEJO ({ "zona": img }).
function _normArreglosFotoRef(v){
  const obj = {};
  if(!v) return obj;
  const entries = Array.isArray(v) ? v : Object.values(v);
  const esLista = entries.length && entries.every(x => x && typeof x==='object' && !Array.isArray(x) && ('zona' in x));
  if(esLista){
    entries.forEach(x => { if(x && x.zona && x.img) obj[x.zona] = x.img; });
  } else if(typeof v === 'object' && !Array.isArray(v)){
    Object.entries(v).forEach(([k,val]) => { if(val) obj[k] = typeof val==='string' ? val : (val.img||''); });
  }
  return obj;
}
window._setArreglosFotoRef = v => { arreglosFotoRef = _normArreglosFotoRef(v); _arreglosFotoRefLoaded = true; };
// Guarda como LISTA [{zona, img}] (mismo criterio que arreglosComposicion).
function _saveArreglosFotoRef(){
  const arr = Object.entries(arreglosFotoRef).filter(([,img])=>img).map(([zona, img]) => ({ zona, img }));
  fbSave('arreglosFotoRef', arr);
}

// Vínculo manual entre una zona del checklist y la clave de una composición ya
// cargada, cuando los nombres no coinciden ni se pueden emparejar solos
// (ej. checklist "Mesa Ratona Posadas" → composición "Recepción Posadas y mesita").
// { zonaChecklist: claveComposicion }. Lo define gerencia una vez desde la Guía.
let arreglosCompLink = {};
function _normArreglosCompLink(v){
  const obj = {};
  if(!v) return obj;
  const entries = Array.isArray(v) ? v : Object.values(v);
  const esLista = entries.length && entries.every(x => x && typeof x==='object' && !Array.isArray(x) && ('zona' in x));
  if(esLista){
    entries.forEach(x => { if(x && x.zona && x.comp) obj[x.zona] = x.comp; });
  } else if(typeof v === 'object' && !Array.isArray(v)){
    Object.entries(v).forEach(([k,val]) => { if(val) obj[k] = typeof val==='string' ? val : (val.comp||''); });
  }
  return obj;
}
window._setArreglosCompLink = v => { arreglosCompLink = _normArreglosCompLink(v); };
function _saveArreglosCompLink(){
  const arr = Object.entries(arreglosCompLink).filter(([,comp])=>comp).map(([zona, comp]) => ({ zona, comp }));
  fbSave('arreglosCompLink', arr);
}

// Normaliza un nombre de zona/arreglo para poder emparejar el nombre del checklist
// con el de la composición cargada, aunque estén escritos distinto.
function _normZonaName(s){
  return String(s||'')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g,'')      // saca acentos
    .replace(/p\.?\s*nobile/g,'piano')                    // P. Nobile → Piano
    .replace(/\([^)]*\)/g,' ')                            // saca "(c/u)", "(20)", etc.
    .replace(/·/g,' ')
    .replace(/[^a-z0-9\s]/g,' ')
    .replace(/\b(de|del|la|el|los|las|y|con)\b/g,' ')     // palabras de relleno
    .replace(/\s+/g,' ').trim();
}
function _zonaTokens(s){ return new Set(_normZonaName(s).split(' ').filter(Boolean)); }
function _isSubset(a, b){ for(const x of a){ if(!b.has(x)) return false; } return a.size>0; }
// Claves de composiciones que efectivamente tienen ingredientes cargados.
function _composicionKeys(){
  return Object.keys(arreglosComposicion||{}).filter(k => (arreglosComposicion[k]||[]).length);
}
// Resuelve qué composición corresponde a una zona del checklist:
//   1) vínculo manual guardado por gerencia,
//   2) coincidencia exacta de nombre,
//   3) coincidencia normalizada (acentos, "de", Piano, "(c/u)", orden de palabras),
//   4) contención de tokens SOLO si es inequívoca (un único candidato).
// Devuelve { key, ings, source } o { key:null } si no hay match seguro.
function _resolveComposicionZona(zona){
  if(!zona) return { key:null, ings:[], source:'none' };
  const link = arreglosCompLink[zona];
  if(link && (arreglosComposicion[link]||[]).length) return { key:link, ings:arreglosComposicion[link], source:'link' };
  if((arreglosComposicion[zona]||[]).length) return { key:zona, ings:arreglosComposicion[zona], source:'exact' };
  const keys = _composicionKeys();
  const zNorm = _normZonaName(zona);
  const exactNorm = keys.filter(k => _normZonaName(k) === zNorm);
  if(exactNorm.length === 1) return { key:exactNorm[0], ings:arreglosComposicion[exactNorm[0]], source:'auto' };
  const zTok = _zonaTokens(zona);
  const cand = keys.filter(k => { const kt=_zonaTokens(k); return _isSubset(zTok,kt) || _isSubset(kt,zTok); });
  if(cand.length === 1) return { key:cand[0], ings:arreglosComposicion[cand[0]], source:'auto' };
  return { key:null, ings:[], source: cand.length>1 ? 'ambiguo' : 'none' };
}

window._setArreglosHotelConfig = v => { arreglosHotelConfig = v || {}; };
// Bandera: recién cuando Firebase entregó las composiciones al menos una vez se
// permite guardarlas/borrarlas. Evita el borrado por carrera: si se edita una
// zona con el objeto local todavía vacío (aún no sincronizó), el fbSave del
// objeto completo pisaría TODAS las demás composiciones en Firebase.
let _arreglosComposicionLoaded = false;
function _marcarArreglosComposicionCargado(){ _arreglosComposicionLoaded = true; }
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
    const exacto = Math.abs(comprar - qty) > 0.01 ? ` <span style="color:var(--mid-gray);font-size:12px">(exacto ${_fmtCant(qty)})</span>` : '';
    return `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:7px 0;border-bottom:1px solid var(--light-gray)">
      <span>${esc(prod)}${exacto}</span><strong style="white-space:nowrap;font-size:15px">${comprar}</strong></div>`;
  };
  const bloque = (titulo, list) => list.length ? `
    <div style="margin-bottom:16px">
      <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:600;margin-bottom:4px">${titulo}</div>
      ${list.map(fila).join('')}
    </div>` : '';

  const txtList = list => list.map(r=>`• ${r.prod}: ${Math.ceil(r.qty-1e-9)}`).join('\n');
  window._listaCompraHotelTexto = `Compra para cubrir el hotel\n\nVARAS:\n${txtList(varas)||'—'}\n\nPAQUETES:\n${txtList(paq)||'—'}`;

  let ov = document.getElementById('lista-compra-hotel-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='lista-compra-hotel-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  const vacio = !varas.length && !paq.length;
  ov.innerHTML = `<div class="modal" style="max-width:480px">
    <button class="modal-close" onclick="closeModal('lista-compra-hotel-modal')">✕</button>
    <div class="modal-title">Lista de compra del hotel</div>
    <div style="font-size:12px;color:var(--mid-gray);margin:-6px 0 14px">Suma de las composiciones × la cantidad de cada arreglo · ${zonas} arreglo${zonas!==1?'s':''} con composición</div>
    ${vacio
      ? '<p style="color:var(--mid-gray);font-size:13px;padding:16px;text-align:center">No hay arreglos con composición cargada. Cargalos en <strong>Composiciones › Arreglos del hotel</strong> («Cargar catálogo base»).</p>'
      : bloque('Varas', varas) + bloque('Paquetes', paq) + '<div style="font-size:12px;color:var(--mid-gray);margin-top:8px">Las flores con «/» son opciones: comprás esa cantidad de una de las dos. La cantidad de cada arreglo se ajusta en la tabla de abajo (columna «Cant.»).</div>'}
    ${vacio ? '' : `<div class="modal-actions" style="margin-top:18px">
      <button class="btn-secondary" onclick="closeModal('lista-compra-hotel-modal')">Cerrar</button>
      <button class="btn-add" onclick="listaCompraHotelCopiar()">Copiar lista</button>
    </div>`}
  </div>`;
  ov.classList.add('open');
}
function listaCompraHotelCopiar(){
  const txt = window._listaCompraHotelTexto || '';
  (navigator.clipboard?.writeText(txt) || Promise.reject()).then(
    ()=>showToast('Lista copiada — lista para WhatsApp'),
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
      <td style="${th};font-weight:500;white-space:nowrap">${esc(zona)}</td>
      <td style="${th};font-size:12px;color:var(--mid-gray);max-width:240px">${resumen}${faltaPrecio?' <span title="Falta el costo por vara de alguna flor (cargá su compra recibida)"></span>':''}</td>
      <td style="${th};text-align:center">
        <input type="number" min="1" value="${cantidad}" title="Cantidad de arreglos de este tipo"
          style="width:60px;text-align:center;border:1px solid var(--light-gray);border-radius:6px;padding:4px 6px;font-size:13px;outline:none;background:var(--warm-white);color:var(--charcoal)"
          onchange="saveArregloHotelConfig('${zEsc}','cantidad',this.value)">
      </td>
      <td style="${th};text-align:right;color:var(--mid-gray)">$${costo.toLocaleString('es-AR')}${cantidad>1?`<div style="font-size:12px">$${costoUnit.toLocaleString('es-AR')} c/u</div>`:''}</td>
      <td style="${th};text-align:right;color:var(--charcoal)">${costoReal?'$'+costoReal.toLocaleString('es-AR'):'<span style="color:var(--mid-gray)">—</span>'}</td>
      <td style="${th};text-align:right">${desvioHTML}</td>
      <td style="${th};text-align:right">
        <input type="number" min="0" value="${precioHyatt||''}" placeholder="$"
          style="width:96px;text-align:right;border:1px solid var(--light-gray);border-radius:6px;padding:4px 8px;font-size:13px;outline:none;background:var(--warm-white);color:var(--charcoal)"
          onchange="saveArregloHotelConfig('${zEsc}','precioHyatt',this.value)">
      </td>
      <td style="${th};text-align:right;font-weight:600;color:${precioHyatt? (margen>=0?'var(--green-ok)':'var(--red-alert)') : 'var(--mid-gray)'}">${precioHyatt ? '$'+margen.toLocaleString('es-AR') : '—'}</td>
      <td style="${th};text-align:right;font-weight:700;color:${mc}">${margenPct != null ? margenPct+'%' : '—'}</td>
      <td style="${th};text-align:center;white-space:nowrap"><button class="btn-secondary" style="font-size:12px;padding:4px 10px" onclick="openArregloComposicion('${zEsc}')">Composición</button></td>
    </tr>`;
  }).join('') || `<tr><td colspan="10" style="padding:22px;text-align:center;color:var(--mid-gray)">No hay arreglos con composición cargada. Cargalos en <strong>Composiciones › Arreglos del hotel</strong> (botón «Cargar catálogo base») o con el selector de arriba.</td></tr>`;

  // Panel de alertas
  const alEl = document.getElementById('rent-hotel-alertas');
  if(alEl){
    const bloques = [];
    if(alertasMargen.length)  bloques.push(`<div style="color:#8B2020"><strong>Margen negativo</strong> (el costo supera el precio Hyatt): ${alertasMargen.map(esc).join(', ')}</div>`);
    if(alertasDesvio.length)  bloques.push(`<div style="color:var(--amber)"><strong>Costo real muy por encima del teórico</strong>: ${alertasDesvio.map(esc).join(', ')}</div>`);
    if(alertasSinCosto.length)bloques.push(`<div style="color:var(--amber)"><strong>Flores sin costo por vara</strong> (cargá su compra recibida): ${[...new Set(alertasSinCosto)].map(esc).join(', ')}</div>`);
    alEl.innerHTML = bloques.length
      ? `<div style="background:var(--amber-soft);border:1px solid #E9DCae;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:12.5px;display:flex;flex-direction:column;gap:6px">${bloques.join('')}</div>`
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
  // Una sola forma por artículo (la del costo si la hay), para no sugerir duplicados.
  const all = listaSinRepetidos([...Object.keys(cotizadorPrecios||{}), ...insumosBDBase, ...(typeof insumosCustom!=='undefined'?insumosCustom:[])], Object.keys(cotizadorPrecios||{}));
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
      <select onchange="compUpdRow(${i},'unidad',this.value)" title="Unidad" style="width:62px;border:1px solid var(--light-gray);border-radius:6px;padding:5px 2px;font-size:12px;background:var(--warm-white);color:var(--charcoal)">
        <option value="vara"${!esPaq?' selected':''}>varas</option>
        <option value="paq"${esPaq?' selected':''}>paq</option>
      </select>
      <span style="width:58px;text-align:right;font-size:12px;color:${sinCosto?'var(--amber)':'var(--mid-gray)'}"${opcion?` title="Costo tomado de la opción: ${esc(opcion)}"`:''}>${cv?(opcion?'≈':'')+'$'+cv.toLocaleString('es-AR')+'/v':(r.prod?'sin costo':'—')}</span><span style="width:72px">${badgeCategoriaVara(cv)}</span>
      <span style="width:82px;text-align:right;font-size:12.5px;font-weight:600">${sub?'$'+Math.round(sub).toLocaleString('es-AR'):(faltaVpp?'<span style="font-size:12px;color:var(--amber);font-weight:500">falta varas/paq</span>':'')}${esPaq&&vpp?`<div style="font-size:12px;color:var(--mid-gray);font-weight:500">${_fmtCant(varas)} varas</div>`:''}</span>
      <button class="btn-icon" style="color:var(--red-alert)" title="Quitar" onclick="compRemoveRow(${i})">✕</button>
    </div>`;
  }).join('');
  const total  = _compEditRows.reduce((s,r)=>s+cotizadorPrecioVara(r.prod)*_ingVaras(r),0);
  const faltan = [...new Set(_compEditRows.filter(r=>r.prod && !cotizadorPrecioVara(r.prod)).map(r=>r.prod))];
  ov.innerHTML = `<div class="modal" style="max-width:560px;max-height:88vh;overflow-y:auto">
    <button class="modal-close" onclick="closeModal('arreglo-comp-modal')">✕</button>
    <div class="modal-title">Composición · ${esc(_compEditZona)}</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:14px">Cargá qué flores lleva y la cantidad. Si un producto va por <strong>paquete</strong> (ej. Monstera, Limonium), elegí «paq» y se convierte a varas con las varas por paquete de <strong>Compras</strong>. El costo por vara también sale de Compras.</div>
    <datalist id="comp-flor-list">${_floresDatalistOpts()}</datalist>
    <div style="display:flex;gap:6px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--mid-gray);margin-bottom:5px">
      <span style="flex:1">Flor / follaje</span><span style="width:52px;text-align:center">Cant.</span><span style="width:62px;text-align:center">Unidad</span><span style="width:58px;text-align:right">$/vara</span><span style="width:82px;text-align:right">Subtotal</span><span style="width:28px"></span>
    </div>
    ${rowsHTML}
    <button class="btn-secondary" style="font-size:12px;margin-top:4px" onclick="compAddRow()">+ Agregar flor</button>
    ${faltan.length?`<div style="font-size:12px;color:var(--amber);margin-top:10px">Sin costo por vara todavía: ${esc(faltan.join(', '))}. Cargá su compra recibida en Compras para que se calcule.</div>`:''}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-top:12px;border-top:1px solid var(--light-gray)">
      <div style="font-size:13px;color:var(--mid-gray)">Costo del arreglo: <strong style="font-size:17px;color:var(--charcoal)">$${Math.round(total).toLocaleString('es-AR')}</strong></div>
      <button class="btn-add" onclick="guardarArregloComposicion()">Guardar</button>
    </div>
  </div>`;
  ov.classList.add('open');
}

function compUpdRow(i, field, val){ if(_compEditRows[i]){ _compEditRows[i][field] = field==='prod' ? nombreArticulo(val) : val; _renderCompModal(); } }
function compAddRow(){ _compEditRows.push({prod:'', qty:''}); _renderCompModal(); }
function compRemoveRow(i){ _compEditRows.splice(i,1); if(!_compEditRows.length) _compEditRows=[{prod:'',qty:''}]; _renderCompModal(); }

function guardarArregloComposicion(){
  if(!_arreglosComposicionLoaded){
    showToast('Las composiciones todavía se están cargando. Esperá unos segundos e intentá de nuevo.');
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
  showToast('Composición guardada');
}

// ── Guía del arreglo: composición + foto de referencia ────────────────────────
// La ve cualquier rol tocando el botón que aparece junto a la zona en el checklist
// (tabla de gerencia/operario y tarjetas de florista). Muestra qué flores lleva el
// arreglo y una foto de cómo debe quedar. Gerencia además puede cargar/cambiar la
// foto y editar la composición desde acá.
let _guiaFotoZona = null;
// Botón que se inserta junto al nombre de la zona en el checklist.
function _btnGuiaArreglo(zona){
  const zEsc = esc(zona).replace(/'/g,"\\'");
  return `<button class="cl-guia-btn" title="Ver composición y foto del arreglo"
      onclick="event.stopPropagation();openGuiaArreglo('${zEsc}')" aria-label="Ver guía del arreglo">
      <svg viewBox="0 0 24 24" width="13" height="13" style="stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
    </button>`;
}
function openGuiaArreglo(zona){
  _guiaFotoZona = zona;
  _renderGuiaArreglo();
}
function _renderGuiaArreglo(){
  const zona = _guiaFotoZona;
  if(!zona) return;
  let ov = document.getElementById('guia-arreglo-modal');
  if(!ov){ ov = document.createElement('div'); ov.id='guia-arreglo-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  // La composición sale de las composiciones del hotel ya cargadas. Como el nombre
  // de la zona del checklist no siempre coincide con el de la composición, se
  // resuelve con vínculo manual / coincidencia por nombre.
  const resol = _resolveComposicionZona(zona);
  const ings = resol.ings || [];
  const compKey = resol.key;
  const foto = arreglosFotoRef[zona] || '';
  const puedeEditar = userRole === 'gerencia';
  const zEsc = esc(zona).replace(/'/g,"\\'");
  const compKeyEsc = compKey ? esc(compKey).replace(/'/g,"\\'") : '';

  const origen = (compKey && compKey !== zona)
    ? `<div style="font-size:12px;color:var(--mid-gray);margin-bottom:8px">Tomada de <strong>${esc(compKey)}</strong>${resol.source==='auto'?' · emparejada automáticamente':''}</div>`
    : '';
  const listaHTML = ings.length
    ? origen + `<ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px">
        ${ings.map(g=>`<li style="display:flex;justify-content:space-between;gap:10px;font-size:13.5px;padding:8px 12px;background:var(--warm-white);border:1px solid var(--light-gray);border-radius:8px">
          <span style="color:var(--charcoal)">${esc(g.prod)}</span>
          <span style="color:var(--sage-dark);font-weight:600;white-space:nowrap">${_fmtIngUnidad(g)}</span>
        </li>`).join('')}
       </ul>`
    : `<div style="font-size:12.5px;color:var(--mid-gray);padding:14px;background:var(--surface-1);border-radius:8px;text-align:center">No encontramos la composición de este arreglo.${puedeEditar?' Vinculala con una ya cargada abajo.':''}</div>`;

  // Selector de vínculo con una composición existente (solo gerencia). No recarga
  // ingredientes: solo apunta esta zona a una composición ya cargada.
  let linkHTML = '';
  if(puedeEditar){
    const keys = _composicionKeys().sort((a,b)=>a.localeCompare(b,'es'));
    const cur = (resol.source==='link'||resol.source==='auto'||resol.source==='exact') ? compKey : '';
    linkHTML = `
      <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--light-gray)">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--mid-gray);font-weight:600;margin-bottom:6px">Composición del hotel vinculada</div>
        <select onchange="guiaVincularComp('${zEsc}',this.value)" style="width:100%;border:1px solid var(--light-gray);border-radius:8px;padding:8px 10px;font-size:12.5px;background:var(--warm-white);color:var(--charcoal)">
          <option value="">— Elegí la composición correcta —</option>
          ${keys.map(k=>`<option value="${esc(k)}"${k===cur?' selected':''}>${esc(k)}</option>`).join('')}
        </select>
        ${resol.source==='auto'?'<div style="font-size:12px;color:var(--mid-gray);margin-top:6px">Se emparejó sola por el nombre. Si no es la correcta, elegí la correcta arriba.</div>':''}
        ${resol.source==='ambiguo'?'<div style="font-size:12px;color:var(--amber);margin-top:6px">Hay varias composiciones parecidas: elegí cuál corresponde.</div>':''}
      </div>`;
  }

  const fotoHTML = foto
    ? `<img src="${foto}" onclick="verFotoArregloRef()" style="width:100%;max-height:340px;object-fit:cover;border-radius:10px;cursor:zoom-in;display:block" alt="Foto de ${esc(zona)}">`
    : `<div style="font-size:12.5px;color:var(--mid-gray);padding:28px 14px;background:var(--surface-1);border:1px dashed var(--light-gray);border-radius:10px;text-align:center">Sin foto de referencia todavía.${puedeEditar?' Agregá una para que la florista sepa cómo debe quedar.':''}</div>`;
  ov.innerHTML = `<div class="modal" style="max-width:460px;max-height:90vh;overflow-y:auto">
    <button class="modal-close" onclick="closeModal('guia-arreglo-modal')">✕</button>
    <div class="modal-title">Guía · ${esc(zona)}</div>
    <div style="margin-bottom:16px">${fotoHTML}</div>
    <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--mid-gray);font-weight:600;margin-bottom:8px">Composición</div>
    ${listaHTML}
    ${linkHTML}
    ${puedeEditar ? `
      <input type="file" id="guia-foto-file" accept="image/*" style="display:none" onchange="guiaFotoInput(this)">
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="btn-secondary" style="font-size:12px;flex:1;min-width:110px" onclick="document.getElementById('guia-foto-file').click()">${foto?'Cambiar foto':'Agregar foto'}</button>
        ${foto?`<button class="btn-secondary" style="font-size:12px;color:var(--red-alert)" onclick="guiaQuitarFoto()">Quitar foto</button>`:''}
        <button class="btn-add" style="font-size:12px;flex:1;min-width:110px" onclick="closeModal('guia-arreglo-modal');openArregloComposicion('${compKeyEsc||zEsc}')">${compKey?'Editar composición':'Crear composición'}</button>
      </div>` : ''}
  </div>`;
  ov.classList.add('open');
}
function guiaVincularComp(zona, key){
  if(key) arreglosCompLink[zona] = key;
  else delete arreglosCompLink[zona];
  _saveArreglosCompLink();
  showToast(key ? 'Composición vinculada' : 'Vínculo quitado');
  _renderGuiaArreglo();
}
function guiaFotoInput(input){
  const file = input.files[0]; if(!file) return;
  if(!_arreglosFotoRefLoaded){ showToast('Esperá unos segundos a que sincronice y probá de nuevo.'); return; }
  comprimirImagen(file, 1000, 0.7, data => {
    arreglosFotoRef[_guiaFotoZona] = data;
    _saveArreglosFotoRef();
    _renderGuiaArreglo();
    showToast('Foto de referencia guardada');
  });
}
async function guiaQuitarFoto(){
  if(!await confirmModal('¿Quitar la foto de referencia de este arreglo?')) return;
  delete arreglosFotoRef[_guiaFotoZona];
  _saveArreglosFotoRef();
  _renderGuiaArreglo();
  showToast('Foto quitada');
}
function verFotoArregloRef(){
  const img = arreglosFotoRef[_guiaFotoZona]; if(!img) return;
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;cursor:zoom-out';
  ov.innerHTML = `<img src="${img}" style="max-width:94vw;max-height:90vh;border-radius:12px">`;
  ov.onclick = () => ov.remove();
  document.body.appendChild(ov);
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
  _saveEventos();
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
      <td style="${td};text-align:right;font-weight:700;color:${margenColor}">${margenPct!=null?margenPct+'%':'—'}${precio||insumos?`<div style="font-size:12px;color:var(--mid-gray);font-weight:500">$${Math.round(margenMonto).toLocaleString('es-AR')}</div>`:''}</td>
      <td style="${td}"><span style="padding:2px 10px;border-radius:20px;font-size:12px;font-weight:500;${ESTADO_COLORS[ev.estado]||''}">${esc(ev.estado||'—')}</span></td>
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
  el.innerHTML = `<div class="section-title" style="margin-bottom:10px">Rentabilidad por tipo de evento</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px">
    ${tipos.map(t=>{
      const o=porTipo[t];
      const margen = o.ppto>0 ? ((o.ppto-o.real)/o.ppto*100) : null;
      const col = margen==null?'var(--mid-gray)':margen>40?'var(--green-ok)':margen>20?'var(--amber)':'var(--red-alert)';
      return `<div class="card" style="padding:14px 16px">
        <div style="font-size:13px;font-weight:600;color:var(--charcoal);margin-bottom:6px">${esc(t)}</div>
        <div style="font-size:28px;font-weight:700;color:${col};line-height:1">${margen!=null?margen.toFixed(1)+'%':'—'}</div>
        <div style="font-size:12px;color:var(--mid-gray);margin-top:5px">${o.n} evento${o.n!==1?'s':''} · factura $${Math.round(o.ppto).toLocaleString('es-AR')}</div>
      </div>`;
    }).join('')}</div>`;
}


// ════════════════════════════════════════
// FEATURE 4: ORDEN DE COMPRA EN PDF
// ════════════════════════════════════════
function generarOrdenCompra(idx, tipo='flore'){
  const data = tipo==='flore' ? comprasFlore : comprasJard;
  const c = data[idx];
  if(!c){ showToast('Orden no encontrada'); return; }
  const precio = c.costo ? fmtPesos(parseMoney(c.costo)) : '—';
  const importe = c.costo ? fmtPesos(_compraImporte(c)) : '—';
  const nro = 'OC ' + String(idx + 1).padStart(4, '0');
  abrirDocumento({
    tipo: 'Orden de compra',
    titulo: c.prov || 'Proveedor a definir',
    numero: nro,
    meta: `Emitida el ${fmtDate(TODAY_ISO)} · ${tipo==='flore' ? 'Florería' : 'Jardinería y general'}`,
    cuerpo: kv([
        ['Fecha del pedido', c.fecha ? fmtDate(c.fecha) : '—'],
        ['Pedido por', esc(c.pedidopor || '—')],
        ['Área / sector', esc(c.sector || '—')],
      ]) + `
      <table class="t"><thead><tr><th>Producto</th><th>Descripción</th><th class="num">Cant.</th><th class="num">Precio unit.</th><th class="num">Subtotal</th></tr></thead>
        <tbody><tr><td>${esc(c.prod || '—')}</td><td>${esc(c.desc || '—')}</td><td class="num">${esc(String(c.qty || 1))}</td><td class="num">${precio}</td><td class="num">${importe}</td></tr></tbody></table>
      <div class="total-row"><div class="total-label">Total</div><div class="total-val">${importe}</div></div>
      ${c.notas ? `<div class="notas">${esc(c.notas)}</div>` : ''}
      <div class="firmas"><div>Firma solicitante</div><div>Firma aprobación</div><div>Firma proveedor</div></div>`,
    archivo: nro + ' - ' + (c.prov || c.prod || ''),
  });
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
      <td><strong>${esc(r.prov)}</strong>${r.ultimo===minPrecio?' <span style="color:var(--sage-dark);font-size:12px">✓ más barato</span>':''}</td>
      <td><strong>$${r.ultimo.toLocaleString('es-AR')}</strong></td>
      <td>${r.ultimaFecha ? fmtDate(r.ultimaFecha) : '—'}</td>
      <td>$${r.promedio.toLocaleString('es-AR',{minimumFractionDigits:0,maximumFractionDigits:0})}</td>
      <td>${r.veces}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
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
  const badge = activeCount > 0 ? `<span style="background:var(--sage);color:#fff;border-radius:10px;padding:1px 7px;font-size:12px;margin-left:6px">${activeCount}</span>` : '';
  wrap.innerHTML = `
    <div style="margin-bottom:12px">
      <button class="btn-secondary" style="font-size:12px" onclick="toggleCompraFilters('${type}')">Filtros avanzados${badge}</button>
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












Object.assign(window, {
  abrirFotoRamo, elegirFotoRamo, eliminarFotoRamo, compartirFotoRamo,
  renderInventario, addInvItem, updInv, invAdjust, delInvItem,
  _downloadCSV, addCajaMovimiento, addCompra, addEvArregloRow, addEvArregloRowWithData,
  evSetArreglo, evSetArregloQty, evRemoveArregloRow,
  addInsumoToBase, addLpCat, addProveedor, addRecetaIngRow,
  addReglaTipo, addSale, addTipoEvento, adjustStock, agregarNuevoInsumo, agregarPedidoRapido,
  agregarUsuarioFlorista, agregarUsuarioJardinero, agregarUsuarioHousekeeping, setHabComentarioHK, aplicarPlantillaAlMes, aplicarPlantillaForce, applyCompraFilter,
  horariosAddPersona, horariosRemovePersona, horariosAddPersonaFromSel,
  applyRole, arregloEmoji, calcCostoComposicion, calcDuracion, calcHorasDia, calcStockImpact,
  calcularArreglosEvento, cambiarContrasena, changeEventoEstado, clearCompraExtraFilters,
  clearCompraFilter, clearEventImg, clearRecetaImg, closeModal, closeSidebar, confirmResetWeek,
  confirmVentaRamo, copiarBloquePedido, exportarPedidoXLSX, copiarCotEvento, copiarCotizacion, copiarCotizacionEvento,
  renderCompraEvento, ceAddRow, ceRemoveRow, ceSet, ceReset, ceLoadEvento, ceCopiar,
  setCompraEvento, openCompraEventos, cevSet, cevAdd, cevRemove, guardarCompraEventos,
  copiarCotizacionOps, copiarUltimoPedido, cotAgregar, cotAgregarComposicionOps, cotAgregarLP,
  cotAgregarOpsStock, cotGuardarMargen, cotGuardarPrecio, cotRemove, cotRemoveOps, cotUpdateQty,
  cotUpdateQtyOps, ctrlHabFilter, ctrlJardFilter, daysSince, delC, delCaja,
  delPedidoHab, delProveedor, delRamo, delReceta, delReglaTipo, delStock, delTipoEvento,
  delVenta, deleteEvento, replicarEvento, descontarStockEvento, deselectAllInsumos, doLogin, durBadge,
  ventasClearFilters, ventasCierreMes, ventasCierreCopiar,
  eliminarUsuario, ensureKanbanCols, enviarCotizacionEvento, enviarPedidoHab, esc,
  estaEditando, evAgregarComposicion, evAgregarFlor, evZonasLabel, exportCtrlCSV, exportHabCSV,
  exportMesHab, exportMesJard, fbSave, filterByStatus, filterStock, setStockSort, fmtDate, fmtDateTime,
  fmtDur, fmtMonth, generarTextoCotEvento, gerenciaSetFecha, getAlerta, getAllInsumos,
  getAllMonths, getArr, getBadge, getDaysBadge, getEmpleadosActivos, getFloristasActivos, getISOWeekKey, isJardinero,
  getMonthLabel, getMonthVisits, getOrCreateDayState, getProvOpts, getSectionEmoji,
  getSectionPillCls, getStockBadge, getStockComprometido, getStockEnPedido, getTbody,
  getWeekLabel, guardarDiaHorario, habsHoraCell, habsRegistrarHora, habsResetHora,
  hopsVisita, horNavMes, initChecklist, initCotizadorEventosHyatt, initCtrlHab, initCtrlJard,
  jopsDone, jopsHoraCell, jopsRegistrarHora, jopsResetHora, jopsUpdHora, limpiarCarrito,
  jardTogglePlanHoy, openGestionTareasJard, jardRenameGrupo, jardDeleteGrupo, jardRenameSeccion, jardDeleteSeccion, jardAddTarea, jardRenameTarea, jardDeleteTarea, jardAddGrupo, jardAddSeccion,
  limpiarCarritoOps, limpiarDiaHorario, loadWeekState, lpAddPhotos, lpDelCat, lpDelItem,
  lpOpenViewer, lpRemovePhoto, lpUpdItem, markHabDone, markJardDone, marcarRecordatorioHecho, navigate, toggleUserMenu, closeUserMenu, openRecordatorioModal, renderBottomNav, renderRecordatoriosJard, renderPlagasJard, renderStockJard, stockJardFiltrar, openStockJardModal, saveStockJard, deleteStockJard, openPlagaJardModal, savePlagaJard, deletePlagaJard, plagaSugerir, plagaFiltrar, openControlPlaga, saveControlPlaga, verHistorialPlaga, saveRecordatorio, deleteRecordatorio, updateBottomNav, openCajaModal,
  openAlertaJardinModal, alertaJardFotoPreview, guardarAlertaJardin, resolverAlertaJardin, verFotoAlerta, renderAlertasUrgentesJard, toggleRecepAgrupado,
  openLlamadoModal, llamadoOnZonaChange, llamadoFotoPreview, guardarLlamado, renderLlamadosChecklist, verFotoLlamado, resolverLlamado, eliminarLlamado, renderLlamadosEval,
  openDiaHorario, openEditSaleModal, openEventModal, openEventoDetail, openGestionPasswords,
  openGaleriaModal, openLpCatModal, openLpModal, openRamoModal, openRamoPhoto,
  openRecetaModal, openSaleModal, delVentaDesdeModal, comprobanteVenta, comprobanteVentaDesdeModal, cotVerTodas, restaurarCajaArchivo, restaurarCajaDesdeResguardo, openSidebar, openTaskModal, openVentaRamo, parseMoney,
  populateFloreriaFormHelpers, populateProvSelects, populateSaleSelects,
  phAddItemRow, phSetItemTipo, phSetItemQty, phRemoveItemRow,
  previewEventImg, previewRecetaImg, previewStockImpact, ramoOnCatChange,
  ramoOnProdChange, recalcTotalEvento, recepCheckAll, recepConfirmar, recepConfirmarTodo,
  recepToggle, recepUncheckAll, recepUpdPaq, recepUpdVaras, recepUpdateGlobal, recetaIngRowHTML,
  recepUpdObs, recepToggleMal, recepFotoInput, recepQuitarFoto, verFotoRecep,
  recepSubirStockTodo, recepVolverAControl, recibirRenglonCompra, recibirPedidoCompleto,
  registrarHora, registrarHoraEvento, registrarHoraVenta, registrarVentaDirecta, removeKanbanCard,
  renderCaja, renderCarrito, renderCarritoOps, renderChecklistTable,
  renderComposicionesCot, renderCompraAlert, renderCompraSummary, renderCompras, renderCotEventos,
  renderCotizador, renderCotizadorOps, renderCtrlHab, renderCtrlJard, renderEvCarrito,
  renderGaleria, abrirLightbox, galeriaAddFotos, galeriaAddUrl, galeriaQuitarFoto, guardarGaleria, editarGaleria, eliminarGaleria,
  setGaleriaSeccion, openFichaGaleria, imprimirFicha, addGalIngRow, galSectorOnChange,
  renderEvHoraCell, renderEvTipos, renderEventos, renderHabLog, renderHabOps,
  renderHabReporte, renderHistorialCompras, renderHistorialEventos, exportHistorialEventosXLSX, histEventoSetPrecio, histTarifaSet, histTarifaAdd, histTarifaDel, histEventoSetTarifa, renderHistoryPanel, renderHome,
  renderHomeHyatt, renderHoraCell, renderHorarios, renderInsumosGrid, renderJardLog, renderJardOps,
  renderJardProdEquipo, renderJardTurnoCard, renderJardReporte, renderJordProd, renderKanban,
  jardSetJardinero, jardRegistrarHoraTurno, jardResetHoraTurno, jardProdDiaClick,
  florRegistrarTurno, florResetTurno, renderFlorTurnoCard,
  renderLPenCotizador, renderListaPrecios,
  renderPedidosHab, renderPeriodTabs, renderPlantilla, renderPreciosList, renderProductividad,
  renderProductividadHome, renderProductividadCL, renderProductividadHorarios, renderProvTags, renderRamosDisp, renderRecepcionPedidos,
  renderRecetas, seedComposicionesBase, seedComposicionesHotelBase, setCompTab, renderComposicionesHotel, compHotelAdd, delArregloComposicion, renderReportesEquipo, renderReportesVentas, renderCostoHotel, exportCostoHotel, openFichaEmpleado,
  renderCierreDia, initCierreDia, renderCdPersona, cdPersonaRango,
  renderFloreros, openFloreroModal, guardarFlorero, delFlorero, florAjustar, florFotoPreview, cambiarFotoFlorero, openFlorFoto,
  renderVelas, openVelaModal, guardarVela, delVela, velaAjustar, velaFotoPreview, cambiarFotoVela, openVelaFoto,
  exportReporteEquipo, exportReporteVentas,
  openPushNotifModal, enviarPushNotif, initPushForUser,
  renderCalendario, calPrevMonth, calNextMonth,
  renderProveedores, openProveedorModal, guardarProveedor, eliminarProveedor,
  renderRentabilidad, renderRentabilidadHotel, rentSetTab, saveArregloHotelConfig, saveEventLaborRate, updEventoTraslado, alertasAutomaticas,
  openListaCompraHotel, listaCompraHotelCopiar, openTiemposEstimados, openPromediosZona, copiarDetalleFichajes,
  rentAddArreglo, openArregloComposicion, compUpdRow, compAddRow, compRemoveRow, guardarArregloComposicion,
  openGuiaArreglo, _renderGuiaArreglo, guiaFotoInput, guiaQuitarFoto, verFotoArregloRef, guiaVincularComp,
  renderTareasGerencia, openTareaGerencia, guardarTareaGerencia, tgMove, tgMoveTo, tgDelete,
  renderStock, renderStockAdmin, renderVentaHoraCell, renderVentas, renderZonasPicker, openZonasEventoModal, guardarZonasEvento,
  resetHora, resetDayState, resetWeekState, resetearPassword, resetearTodasPasswords, saleAutoFillPrice,
  saveEvent, saveInsumosCustom, saveKanbanTask, saveLpItem, saveRamo, saveReceta, saveUrgenciaConfig,
  saveWeekState, setCotTab, setHabReporteMes, setHopsFilter, setJardReporteMes, setJopsFilter,
  setPlantilla, setStock, setStockMax, setStockMin, vaciarStock, openAddStockModal, guardarStockManual, setUrgenciaPreset, showAlertaHorario,
  showToast, syncEventosToKanban, toggleCtrlSection, toggleEvZona, toggleHistorialCompras, toggleHistPedido,
  toggleHistory, toggleInsumosGrid, toggleJordProd, togglePlantilla, toggleProductividad,
  toggleDarkMode, initDarkMode, openGlobalSearch, closeGlobalSearch, handleSearchKey, runGlobalSearch, _gsearchGo, exportPDF,
  cerrarCajaDia, renderCierreCajaHistorial, toggleCierreDetalle,
  renderSucursales, openNuevaSucursalModal, openEditSucursal, guardarSucursal, toggleSucursalActiva, eliminarSucursal,
  renderDashboardConsolidado, renderSucursalSelector, renderSucursalIndicador, getSucursalId, getSucursalNombre, filterBySucursal,
  renderClientes, abrirFichaCliente, openNuevoClienteModal, editarCliente, guardarCliente, eliminarCliente,
  generarPresupuestoPDF, checkOnboarding, nextOnboardingStep, finishOnboarding,
  toggleProvManager, toggleSidebar, toggleTask, toggleCajaHistorial, toggleCajaMes, updC, updCL, updActividad, updTiempoRef, updCaja, updCajaMonto, updCajaTipo,
  openVistaSemanal, vsToggleActividad, vsSetResp, aplicarPlantillaSemana, descargarBackup, clFotoPreview, guardarFotoChecklist, verFotoChecklist,
  openGestionZonas, clAddZona, clRenameZona, clDeleteZona, clMoveZona, clRenameSeccion, clAddSeccion,
  activarNotificaciones, openGaleriaNuevos, renderGaleriaNuevos, moveKanbanCard, clSetFiltro,
  cerrarBriefing, mostrarResumenSemanal,
  updPedidoHabEstado, updTipoEvento, updV, updateInsumoCount, updateInsumoRow,
  updateKpiCompras, urgenciaPanelHTML, vdAutoPrice, zonaHoraBtn, zonaResetHora, zonaSetHora,
  toggleStockSugerencias,
  renderLegajo, openLegajoModal, guardarLegajo, eliminarLegajo, verDetalleLegajo, legTipoOnChange,
  legSubirDoc, legVerDoc, legEliminarDoc,
  renderEvaluaciones, openEvaluacionModal, guardarEvaluacion, eliminarEvaluacion,
  renderPerfEmpleado, perfPreset, legVerProductividad,
  renderFaltas, agregarFalta, toggleFaltaJustificada, eliminarFalta,
  migrarFotos,
  renderLiquidacion, saveLiquidacionHoras, exportLiquidacion,
  generarOrdenCompra,
  renderPrecioComparacion, buscarComparacion,
  calcStockMinInteligente, renderStockSugerencias, aplicarSugerenciaStock,
  renderCompraFiltersPanel, toggleCompraFilters, applyCompraFiltersExt, clearCompraFiltersExt,
  installPWA,
  renderPresupuestos, openPresupuestoModal, guardarPresupuesto, cambiarEstadoPres, eliminarPresupuesto,
  verPresupuesto, enviarPresupuestoWhatsApp,
  renderUnificarArticulos, uaAgregarManual, uaDeshacer, uaMarcar, uaSet, uaUnir, uaVolverABuscar,
  renderCostoVaras, cvTCargar, cvTSetProd, cvTLimpiar, cvFijarVarasPorPaq, cvSet, cvAdd, cvRemove, cvReset, cvCargarListado, cvCopiar,
  renderCotizarPresupuesto, cpAddArr, cpRemoveArr, cpSetArr, cpAddFree, cpRemoveFree, cpSetFree, cpReset, cpGuardar,
  renderEventosSinFloreria, openEsfModal, guardarEsf, eliminarEsf, exportEsfReclamo,
  renderCierreMensual, generarCierreMensual, verCierreMensual, exportCierrePDF,
  exportVentasXLSX, exportLegajoXLSX, ventasShowMore,
  getAreaUsoOpts, toggleCfSplit, cfSplitAddRow, cfSplitRemoveRow, cfSplitUpdRow,
  cfImportFile, cfImportCancel, cfImportParseSheet, cfImportConfirm,
  toggleAnularCompra, updHistCantCompra, updHistCostoCompra,
  evImportFile, evImportToggle, evImportConfirm,
  abrirPedidoAuto, paSetDia, paToggleArea, paSetAreaDia, paToggleEvento, generarPedidoAuto,
  abrirRestaurarCompras, restaurarComprasFile, restaurarComprasDesdeSafe, confirmarRestaurarCompras,
});
