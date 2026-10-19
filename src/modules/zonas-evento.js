import { showToast } from './tema-toast.js';

// Viven en app.js y se leen por window al momento de usarlos.
const fbSave = (...a) => window.fbSave(...a);
const closeModal = (...a) => window.closeModal(...a);

// ── ZONAS A CUBRIR EN "NUEVO EVENTO" (editables por gerencia) ─────────────────
// Esta lista es la de arranque; si gerencia la edita, se guarda en Firebase
// (eventoZonas) y reemplaza a esta en todos los dispositivos.
export const EV_ZONAS = [
  'Piano Nobile','Privado Piano','Salon Privado','Biblioteca','Vinoteca',
  'Duhau','Duhau Privado','Terrazas Duhau','Paseo de las Artes/Floreria',
  'Grand Foyer','Gingko I','Gingko II','Gingko III','Tilo',
  'Nogal y Ceibo','Gioia','Terrazas Gioia','Foyer Posadas','Posadas I','Posadas II',
  'Terraza Tipa','Salon Cristal'
];

// Sin comillas ni signos que rompan el botón de la zona (se arma con onclick).
const _limpiarZona = z => String(z).replace(/['"`<>\\]/g, '').replace(/\s+/g, ' ').trim();

function _aplicarLista(arr){
  const vistas = new Set();
  const lista = [];
  arr.map(_limpiarZona).filter(Boolean).forEach(z => {
    const k = z.toLowerCase();
    if(!vistas.has(k)){ vistas.add(k); lista.push(z); }
  });
  if(!lista.length) return false;
  EV_ZONAS.splice(0, EV_ZONAS.length, ...lista);
  return true;
}

// Llega desde Firebase (nodo eventoZonas)
window._setEventoZonas = (val) => {
  const arr = Array.isArray(val) ? val : Object.values(val || {});
  if(_aplicarLista(arr)) window.renderZonasPicker?.();
};

export function openZonasEventoModal(){
  document.getElementById('zonas-evento-texto').value = EV_ZONAS.join('\n');
  document.getElementById('zonas-evento-modal').classList.add('open');
}

export function guardarZonasEvento(){
  const texto = document.getElementById('zonas-evento-texto').value;
  if(!_aplicarLista(texto.split('\n'))){ showToast('Dejá al menos una zona'); return; }
  fbSave('eventoZonas', EV_ZONAS);
  closeModal('zonas-evento-modal');
  window.renderZonasPicker?.();
  showToast('Zonas guardadas');
}
