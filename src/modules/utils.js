// ════════════════════════════════════════════════════════════
//  Utilidades puras (sin estado de la app)
//  Extraídas de app.js para empezar a modularizar. No dependen de
//  variables globales ni del DOM: solo transforman sus argumentos.
// ════════════════════════════════════════════════════════════

// Escapa texto para insertarlo en HTML de forma segura.
export function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Fecha ISO (YYYY-MM-DD) → DD/MM/YYYY. '—' si viene vacía.
export function fmtDate(iso) {
  if (!iso) return '—';
  const p = iso.split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

// Fecha + hora opcional.
export function fmtDateTime(iso, hora) {
  return fmtDate(iso) + (hora ? ' · ' + hora : '');
}

// Parsea montos en formato AR ("1.150.000,50") o simple a Number.
export function parseMoney(s) {
  if (typeof s === 'number') return isFinite(s) ? s : 0;
  let str = String(s ?? '').trim();
  const neg = str.startsWith('-');
  str = str.replace(/[^0-9.,]/g, '');
  if (!str) return 0;
  if (str.includes(',')) {
    // Formato AR: punto = miles, coma = decimal
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    // Solo puntos: si son grupos de miles (3 dígitos) los quitamos
    const parts = str.split('.');
    if (parts.length > 1 && parts.slice(1).every((p) => p.length === 3)) str = parts.join('');
  }
  const n = parseFloat(str) || 0;
  return neg ? -n : n;
}
