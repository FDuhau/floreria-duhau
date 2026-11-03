// ── ÍCONOS DE LÍNEA ─────────────────────────────────────────────────────────
// Un solo juego de íconos para toda la app (mismo trazo que el menú lateral),
// en lugar de emojis que cambian de aspecto según el teléfono. Se dibujan con
// currentColor, así toman el color del botón o del texto donde estén.
const PATHS = {
  play: '<path d="M8 5.5v13l10-6.5z" fill="currentColor"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5" fill="currentColor"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>',
  print: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5"/><path d="M5 4h14"/>',
  checkAll: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  uncheckAll: '<rect x="4" y="4" width="16" height="16" rx="3"/>',
};

export function icon(name){
  return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (PATHS[name] || '') + '</svg>';
}
window.icon = icon;
