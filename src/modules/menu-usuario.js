// ── MENÚ DE USUARIO ─────────────────────────────────────────────────────────
// Botón con la inicial del usuario en la barra superior. Reúne los ajustes
// que antes eran botones sueltos al pie del menú lateral (contraseña,
// notificaciones, backup, usuarios…) y la versión de la app.

export function setUserMenuInfo(nombre){
  const n = String(nombre || '').trim();
  const nameEl = document.getElementById('user-menu-name');
  if(nameEl) nameEl.textContent = n || '—';
  const ini = document.getElementById('user-menu-initial');
  if(ini) ini.textContent = (n[0] || '·').toUpperCase();
  // Saludo del Inicio con el nombre de quien entró
  const hero = document.getElementById('home-hero-title');
  if(hero){
    const h = new Date().getHours();
    const saludo = h < 12 ? 'Buen día' : (h < 20 ? 'Buenas tardes' : 'Buenas noches');
    const primer = n.split(/\s+/)[0] || '';
    hero.textContent = primer ? `${saludo}, ${primer}` : saludo;
  }
}

export function closeUserMenu(){
  const m = document.getElementById('user-menu');
  if(!m || m.hidden) return;
  m.hidden = true;
  document.getElementById('user-menu-btn')?.setAttribute('aria-expanded', 'false');
}

export function toggleUserMenu(ev){
  ev?.stopPropagation?.();
  const m = document.getElementById('user-menu');
  if(!m) return;
  if(!m.hidden){ closeUserMenu(); return; }
  const fecha = document.getElementById('user-menu-date');
  if(fecha) fecha.textContent = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  m.hidden = false;
  document.getElementById('user-menu-btn')?.setAttribute('aria-expanded', 'true');
}

// Cerrar al tocar afuera, al elegir una opción o con Esc
document.addEventListener('click', (e) => {
  const m = document.getElementById('user-menu');
  if(!m || m.hidden) return;
  if(e.target.closest('#user-menu [role="menuitem"]') || !e.target.closest('.user-menu-wrap')) closeUserMenu();
});
document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeUserMenu(); });

// Menús "Más opciones" (<details class="tools-more">): cerrar al tocar afuera
document.addEventListener('click', (e) => {
  document.querySelectorAll('details.tools-more[open]').forEach(d => { if(!d.contains(e.target)) d.open = false; });
});
