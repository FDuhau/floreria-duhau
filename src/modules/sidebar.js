// Menú lateral del celular (abrir / cerrar)
export function toggleSidebar(){
  const sidebar  = document.getElementById('sidebar');
  const isOpen   = sidebar.classList.contains('open');
  if(isOpen){ closeSidebar(); } else { openSidebar(); }
}
export function openSidebar(){
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('visible');
  document.getElementById('hamburger-btn').classList.add('open');
  document.body.style.overflow = 'hidden';
}
export function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
  document.getElementById('hamburger-btn').classList.remove('open');
  document.body.style.overflow = '';
}

// Si se agranda la ventana (o se achica el zoom) con el menú del celular
// abierto, hay que cerrarlo: si no, la capa oscura y el bloqueo de scroll
// quedan pegados sobre la vista de escritorio.
window.matchMedia('(min-width: 769px)').addEventListener('change', e => { if(e.matches) closeSidebar(); });
