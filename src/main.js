import './styles/main.css';
import './firebase/index.js';
import './modules/app.js';
import './modules/ui-enhance.js';

// XLSX se carga en su propio chunk (import dinámico) para no inflar el
// bundle inicial: solo hace falta al exportar/importar Excel. Queda en
// window.XLSX apenas termina de bajar en segundo plano, y ensureXLSX()
// permite garantizar su carga bajo demanda.
let _xlsxPromise = null;
function ensureXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (!_xlsxPromise) {
    _xlsxPromise = import('xlsx').then((m) => {
      window.XLSX = m;
      return m;
    });
  }
  return _xlsxPromise;
}
window.ensureXLSX = ensureXLSX;
// Precarga no bloqueante: apenas la app terminó de cargar.
if (document.readyState === 'complete') ensureXLSX();
else window.addEventListener('load', () => ensureXLSX());

// pdf.js — igual criterio que XLSX: chunk aparte, se baja bajo demanda al
// importar el daily report en PDF. Queda en window.pdfjsLib.
let _pdfjsPromise = null;
function ensurePDFJS() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (!_pdfjsPromise) {
    _pdfjsPromise = Promise.all([
      import('pdfjs-dist/build/pdf.min.mjs'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([lib, workerMod]) => {
      lib.GlobalWorkerOptions.workerSrc = workerMod.default;
      window.pdfjsLib = lib;
      return lib;
    }).catch((err) => {
      // Chunk viejo por deploy nuevo → recargar para traer los assets frescos.
      if (/dynamically imported module|module script failed/i.test(String(err && err.message || err))) window._reloadForNewVersion?.();
      _pdfjsPromise = null;
      throw err;
    });
  }
  return _pdfjsPromise;
}
window.ensurePDFJS = ensurePDFJS;

// Red de seguridad: si a los 12s todavía no llegaron los datos (nodo vacío o
// sin conexión), se consideran "cargados" igual para no bloquear el trabajo.
// El objetivo del flag es solo evitar guardar ANTES de la primera sincronización
// (que fue lo que borró compras/eventos al escribir sobre una lista vacía).
setTimeout(() => {
  if (!window._comprasFloreLoaded) window._comprasFloreLoaded = true;
  if (!window._comprasJardLoaded) window._comprasJardLoaded = true;
  if (!window._eventosLoaded) window._eventosLoaded = true;
}, 12000);

// Auto-recuperación de versión: si un import dinámico falla porque el chunk
// quedó viejo (deploy nuevo → el archivo con hash anterior ya no existe),
// recargar UNA vez para bajar los assets frescos. Evita el error
// "Failed to fetch dynamically imported module".
function _reloadForNewVersion() {
  try {
    if (sessionStorage.getItem('__fdReloadedForVersion')) return; // ya recargamos una vez
    sessionStorage.setItem('__fdReloadedForVersion', '1');
  } catch (e) { /* si no hay sessionStorage, igual recargamos una vez */ }
  location.reload();
}
window.addEventListener('vite:preloadError', (e) => { e.preventDefault?.(); _reloadForNewVersion(); });
window.addEventListener('error', (e) => {
  const msg = (e && (e.message || (e.error && e.error.message))) || '';
  if (/dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg)) _reloadForNewVersion();
});
window.addEventListener('unhandledrejection', (e) => {
  const msg = (e && e.reason && (e.reason.message || String(e.reason))) || '';
  if (/dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg)) _reloadForNewVersion();
});
window._reloadForNewVersion = _reloadForNewVersion;
