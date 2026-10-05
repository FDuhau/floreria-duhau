// Búsqueda global (Ctrl+K): stock, eventos, ventas, galería, ramos, checklist y páginas.
// ── BÚSQUEDA GLOBAL ──────────────────────────────────────────
let _gsearchIdx = -1;

// Lista de tareas del checklist (la misma que usa la app; se modifica en el lugar).
let _tareasChecklist;
export function setTareasBusqueda(arr){ _tareasChecklist = arr; }

export function openGlobalSearch(){
  document.getElementById('global-search-overlay').classList.add('open');
  const inp = document.getElementById('global-search-input');
  inp.value = '';
  inp.focus();
  document.getElementById('global-search-results').innerHTML = '<div class="gsearch-empty">Escribí para buscar en stock, ventas, eventos, glosario y más...</div>';
  _gsearchIdx = -1;
}

export function closeGlobalSearch(){
  document.getElementById('global-search-overlay').classList.remove('open');
  _gsearchIdx = -1;
}

export function handleSearchKey(e){
  const items = document.querySelectorAll('.gsearch-item');
  if(e.key === 'Escape'){ closeGlobalSearch(); return; }
  if(e.key === 'ArrowDown'){ e.preventDefault(); _gsearchIdx = Math.min(_gsearchIdx+1, items.length-1); _gsHighlight(items); return; }
  if(e.key === 'ArrowUp'){ e.preventDefault(); _gsearchIdx = Math.max(_gsearchIdx-1, 0); _gsHighlight(items); return; }
  if(e.key === 'Enter'){
    const active = document.querySelector('.gsearch-item.active');
    if(active) active.click();
    return;
  }
}

function _gsHighlight(items){
  items.forEach((it,i) => it.classList.toggle('active', i === _gsearchIdx));
  const active = items[_gsearchIdx];
  if(active) active.scrollIntoView({block:'nearest'});
}

export function runGlobalSearch(q){
  q = (q||'').trim().toLowerCase();
  const el = document.getElementById('global-search-results');
  if(!q){ el.innerHTML = '<div class="gsearch-empty">Escribí para buscar...</div>'; _gsearchIdx=-1; return; }

  const results = [];

  // Stock
  (window.stockData||[]).forEach(it => {
    if(!it) return;
    const name = (it.nombre||it.name||'').toLowerCase();
    const cat = (it.categoria||it.cat||'').toLowerCase();
    if(name.includes(q) || cat.includes(q))
      results.push({icon:'', label: it.nombre||it.name, sub: `Stock: ${it.cantidad??it.qty??'—'} · ${it.categoria||''}`, badge:'Stock', action:()=>{ closeGlobalSearch(); window.navigate('stock'); }});
  });

  // Eventos
  (window.eventosData||[]).forEach(ev => {
    if(!ev) return;
    const titulo = (ev.titulo||ev.nombre||'').toLowerCase();
    const zona = (ev.zona||'').toLowerCase();
    if(titulo.includes(q) || zona.includes(q))
      results.push({icon:'', label: ev.titulo||ev.nombre, sub: `${ev.fecha||''} · ${ev.zona||''}`, badge:'Eventos', action:()=>{ closeGlobalSearch(); window.navigate('eventos-maison'); }});
  });

  // Ventas
  (window.ventasData||[]).forEach(v => {
    if(!v) return;
    const desc = (v.descripcion||v.desc||'').toLowerCase();
    const tipo = (v.tipo||'').toLowerCase();
    if(desc.includes(q) || tipo.includes(q))
      results.push({icon:'', label: v.descripcion||v.desc||'Venta', sub: `$${v.monto||v.total||0} · ${v.fecha||''}`, badge:'Ventas', action:()=>{ closeGlobalSearch(); window.navigate('ventas'); }});
  });

  // Galería de Trabajos
  (window.galeriaData||[]).forEach(g => {
    if(!g) return;
    const nombre = (g.nombre||'').toLowerCase();
    const desc = (g.desc||'').toLowerCase();
    const cat = (g.cat||'').toLowerCase();
    if(nombre.includes(q) || desc.includes(q) || cat.includes(q))
      results.push({icon:'', label: g.nombre||'', sub: (g.desc||'').slice(0,60), badge:'Galería', action:()=>{ closeGlobalSearch(); window.navigate('galeria'); }});
  });

  // Ramos / Catálogo
  (window.ramosDispData||[]).forEach(r => {
    if(!r) return;
    const name = (r.nombre||'').toLowerCase();
    if(name.includes(q))
      results.push({icon:'', label: r.nombre, sub: `$${r.precio||0}`, badge:'Ramos', action:()=>{ closeGlobalSearch(); window.navigate('ramos-disponibles'); }});
  });

  // Checklist tasks
  if(typeof _tareasChecklist !== 'undefined'){
    _tareasChecklist.forEach(s => {
      (s.tasks||[]).forEach(t => {
        if((t||'').toLowerCase().includes(q))
          results.push({icon:'', label: t, sub: s.section||'', badge:'Checklist', action:()=>{ closeGlobalSearch(); window.navigate('checklist'); }});
      });
    });
  }

  // Páginas
  const pages = [
    {label:'Inicio', icon:'', page:'home'}, {label:'Checklist Diaria', icon:'', page:'checklist'},
    {label:'Stock Florería', icon:'', page:'stock'}, {label:'Ventas', icon:'', page:'ventas'},
    {label:'Eventos / Maison', icon:'', page:'eventos-maison'}, {label:'Glosario', icon:'', page:'glosario'},
    {label:'Reportes Equipo', icon:'', page:'reportes-equipo'}, {label:'Jardinería', icon:'', page:'jardineria-ops'},
    {label:'Control Horarios', icon:'', page:'control-horarios'}, {label:'Habilitaciones', icon:'', page:'hab-ops'},
  ];
  pages.forEach(p => {
    if(p.label.toLowerCase().includes(q))
      results.push({icon:p.icon, label:p.label, sub:'Ir a esta sección', badge:'Página', action:()=>{ closeGlobalSearch(); window.navigate(p.page); }});
  });

  if(!results.length){ el.innerHTML = '<div class="gsearch-empty">Sin resultados para "'+q+'"</div>'; _gsearchIdx=-1; return; }

  const shown = results.slice(0,15);
  el.innerHTML = shown.map((r,i) => `
    <div class="gsearch-item" onclick="_gsearchGo(${i})">
      <span class="gsearch-icon">${r.icon}</span>
      <div style="min-width:0">
        <div class="gsearch-label">${r.label||''}</div>
        ${r.sub ? `<div class="gsearch-sub">${r.sub}</div>` : ''}
      </div>
      <span class="gsearch-badge">${r.badge}</span>
    </div>`).join('');
  window._gsearchActions = shown.map(r => r.action);
  _gsearchIdx = -1;
}

export function _gsearchGo(i){
  const fn = (window._gsearchActions||[])[i];
  if(fn) fn();
}
