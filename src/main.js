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
