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

  // ── Íconos de línea para las tarjetas de los paneles (quick-links) ──
  const _leaf   = '<path d="M11 20C6 20 4 15 4 11c5 0 7 4 7 9z"/><path d="M13 20c5 0 7-5 7-11-5 0-7 4-7 11z"/>';
  const _flower = '<circle cx="12" cy="7" r="3"/><path d="M12 10v8M8 14l4 4 4-4"/>';
  const _box    = '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>';
  const _event  = '<path d="M4 20l5-13 8 8z"/><path d="M14 4l1 2M18 3l-1 3M20 8l-2 1"/>';
  const _cart   = '<path d="M3 4h2l2 12h11l2-8H6"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>';
  const _bed    = '<path d="M3 8v10M3 12h18v6M21 12v-2a2 2 0 00-2-2h-5v4"/><circle cx="7" cy="11" r="1.5"/>';
  const _tag    = '<path d="M4 12l8-8h6v6l-8 8z"/><circle cx="15" cy="9" r="1.2"/>';
  const _users  = '<circle cx="9" cy="8" r="3"/><path d="M2.5 20c0-3 3-5 6.5-5s6.5 2 6.5 5"/><path d="M16 6a3 3 0 010 6M22 20c0-2.4-1.8-4.3-4.5-5"/>';
  const _clip   = '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9z"/><path d="M8 11h8M8 15h5"/>';
  const _doc    = '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>';
  const _calc   = '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2"/>';
  const _image  = '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M4 18l5-5 4 4 3-3 4 4"/>';
  const _clock  = '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>';
  const _ban    = '<circle cx="12" cy="12" r="8"/><path d="M6.5 6.5l11 11"/>';
  const _wallet = '<path d="M3 8h15a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M3 8V6a2 2 0 012-2h11v4"/><circle cx="17" cy="13.5" r="1.3"/>';
  const _chart  = '<path d="M4 20V4M4 20h16"/><path d="M7 15l3-3 3 2 5-6"/>';
  const _scale  = '<path d="M12 4v16M6 20h12M5 9l7-3 7 3M5 9l-2 5h4zM19 9l-2 5h4z"/>';
  const _factory= '<path d="M4 21V10l5 3V10l5 3V7l6 4v10z"/><path d="M8 21v-4M12 21v-4M16 21v-4"/>';
  const _vase   = '<path d="M8 3h8l-1 4a4 4 0 01-6 0z"/><path d="M9 11c0 5 6 5 6 0"/><path d="M7 21h10"/>';
  const _candle = '<path d="M10 9h4v10h-4z"/><path d="M12 3c1.2 1.4 1.2 3 0 3s-1.2-1.6 0-3"/><path d="M8 21h8"/>';
  const _briefc = '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 12h18"/>';
  const _grid   = '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>';

  const QUICK_ICONS = {
    'checklist': _clip, 'stock': _box, 'inventario': _grid, 'eventos-maison': _event,
    'cotizador-ops': _calc, 'jardineria-ops': _leaf, 'hab-ops': _bed, 'recepcion-pedidos': _box,
    'floreros': _vase, 'velas': _candle,
    'compras-floreria': _flower, 'compras-jardineria': _leaf, 'compra-evento': _cart,
    'stock-admin': _box, 'proveedores': _factory, 'precio-comparacion': _scale,
    'eventos-comercial': _event, 'historial-eventos': _clock, 'eventos-sin-floreria': _ban,
    'recetas-arreglos': _flower, 'ventas-externas': _tag, 'ramos-disponibles': _flower,
    'lista-precios': _tag, 'pedidos-habitacion': _bed, 'galeria': _image, 'cotizador': _calc,
    'presupuestos': _doc, 'crm-clientes': _users, 'caja': _wallet, 'rentabilidad-eventos': _chart,
    'cierre-mensual': _clip, 'reportes': _chart, 'comercial': _briefc,
  };
  function _svg(inner){ return '<svg viewBox="0 0 24 24">' + inner + '</svg>'; }
  function _pageFromOnclick(el){
    const oc = el.getAttribute('onclick') || '';
    const m = oc.match(/navigate\(\s*['"]([^'"]+)['"]/);
    return m ? m[1] : null;
  }
  function fillQuickIcons(root){
    (root || document).querySelectorAll('.quick-link').forEach(function(card){
      const span = card.querySelector('.quick-link-icon');
      if (!span || span.dataset.filled === '1' || span.querySelector('svg')) return;
      const page = _pageFromOnclick(card);
      const inner = page && QUICK_ICONS[page];
      if (inner) { span.innerHTML = _svg(inner); span.dataset.filled = '1'; }
    });
  }

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

    // ── Íconos de línea en las tarjetas de los paneles ──
    fillQuickIcons(document);
    try {
      let pending = false;
      const obs = new MutationObserver(function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () { pending = false; fillQuickIcons(document); });
      });
      obs.observe(main || document.body, { childList: true, subtree: true });
    } catch (e) {}
  });
})();
