// ══════════════════════════════════════════════════════════════
//  Editorial Minimal Pro — mejoras de UI
//  Toasts · Sidebar colapsable · Pie de usuario
//  Módulo autónomo: no depende de la lógica interna de app.js,
//  solo del DOM estático y de window.userRole (expuesto por applyRole).
// ══════════════════════════════════════════════════════════════
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // ── Toasts ──────────────────────────────────────────────────
  function toastWrap() {
    let w = document.getElementById('fd-toast-wrap');
    if (!w) {
      w = document.createElement('div');
      w.id = 'fd-toast-wrap';
      w.className = 'fd-toast-wrap';
      document.body.appendChild(w);
    }
    return w;
  }
  // showToast(mensaje, tipo?, ms?) — tipo: 'ok' | 'error' | 'warn' | 'info'
  window.showToast = function (msg, type = 'ok', ms = 3200) {
    try {
      const icons = { ok: '✓', error: '!', warn: '!', info: 'i' };
      const t = document.createElement('div');
      t.className = 'fd-toast ' + (type || 'ok');
      const ic = document.createElement('span');
      ic.className = 'fd-toast-ic';
      ic.textContent = icons[type] || '✓';
      const tx = document.createElement('span');
      tx.textContent = msg;
      t.appendChild(ic);
      t.appendChild(tx);
      toastWrap().appendChild(t);
      setTimeout(() => {
        t.classList.add('hide');
        setTimeout(() => t.remove(), 320);
      }, ms);
    } catch (e) { console.warn('showToast', e); }
  };

  const ROLE_LABELS = {
    gerencia: 'Gerencia', comercial: 'Comercial', florista: 'Florista',
    jardinero: 'Jardinería', compras: 'Compras', ventas: 'Ventas',
    operario: 'Operaciones', housekeeping: 'Housekeeping',
  };

  ready(function () {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    const main = document.querySelector('.main');

    // ── Sidebar colapsable (desktop) ──────────────────────────
    const btn = document.createElement('button');
    btn.className = 'sidebar-collapse-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Contraer o expandir menú');
    btn.title = 'Contraer / expandir menú';
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>';

    const applyCollapsed = (c) => {
      sidebar.classList.toggle('collapsed', c);
      if (main) main.classList.toggle('sidebar-collapsed', c);
    };
    let collapsed = false;
    try { collapsed = localStorage.getItem('fd-sidebar-collapsed') === '1'; } catch (e) {}
    applyCollapsed(collapsed);

    btn.addEventListener('click', () => {
      collapsed = !collapsed;
      applyCollapsed(collapsed);
      try { localStorage.setItem('fd-sidebar-collapsed', collapsed ? '1' : '0'); } catch (e) {}
    });
    sidebar.appendChild(btn);

    // ── Pie de usuario ────────────────────────────────────────
    const footer = document.createElement('div');
    footer.className = 'sb-user';
    footer.id = 'sb-user';
    footer.innerHTML =
      '<div class="sb-user-av" id="sb-user-av">FD</div>' +
      '<div class="sb-user-info">' +
        '<div class="sb-user-name" id="sb-user-name">Florería Duhau</div>' +
        '<div class="sb-user-role" id="sb-user-role">Sesión activa</div>' +
      '</div>';
    const anchor = sidebar.querySelector('.sidebar-footer');
    if (anchor) sidebar.insertBefore(footer, anchor);
    else sidebar.appendChild(footer);

    function updateUser() {
      const role = window.userRole;
      if (!role) return;
      const label = ROLE_LABELS[role] || role;
      const av = document.getElementById('sb-user-av');
      const rn = document.getElementById('sb-user-role');
      if (rn) rn.textContent = label;
      if (av) av.textContent = label.slice(0, 2).toUpperCase();
    }
    updateUser();
    // El rol se aplica después del login (body.class role-*): observamos el cambio.
    try {
      new MutationObserver(updateUser).observe(document.body, {
        attributes: true, attributeFilter: ['class'],
      });
    } catch (e) {}
  });
})();
