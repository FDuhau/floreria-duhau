// Aviso flotante, modo oscuro y exportar a PDF (sin dependencias del resto de la app).
export function showToast(msg, type){
  const COLORS = { info:'var(--sage-dark)', success:'#4A7A3A', error:'var(--red-alert)', warn:'#9A6A1E' };
  let t = document.getElementById('global-toast');
  if(!t){
    t = document.createElement('div');
    t.id='global-toast';
    document.body.appendChild(t);
  }
  t.style.cssText='position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:'+(COLORS[type]||COLORS.info)+';color:white;padding:12px 24px;border-radius:12px;font-size:13px;font-family:"Jost",sans-serif;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.25);transition:opacity .4s;max-width:min(90vw,420px);text-align:center;line-height:1.4;white-space:pre-line;';
  t.textContent=msg;
  t.style.opacity='1';
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>{ t.style.opacity='0'; }, type==='error'?5000:3500);
}

// ── MODO OSCURO ──────────────────────────────────────────────
export function toggleDarkMode(){
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('fd-theme', next);
  const btn = document.getElementById('theme-toggle-btn');
  if(btn) btn.innerHTML = _themeIconSVG(next === 'dark');
}

const _SUN_SVG  = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/></svg>';
const _MOON_SVG = '<svg viewBox="0 0 24 24"><path d="M21 12.8A8 8 0 1111.2 3a6 6 0 009.8 9.8z"/></svg>';
function _themeIconSVG(isDark){ return isDark ? _SUN_SVG : _MOON_SVG; }

export function initDarkMode(){
  const saved = localStorage.getItem('fd-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('theme-toggle-btn');
  if(btn) btn.innerHTML = _themeIconSVG(saved === 'dark');
}


// ── EXPORTAR PDF ──────────────────────────────────────────────
export function exportPDF(title){
  const orig = document.title;
  document.title = title || 'Florería Duhau — Exportar';
  window.print();
  setTimeout(() => { document.title = orig; }, 1000);
}
