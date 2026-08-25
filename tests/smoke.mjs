// Smoke test: arranca la app (build de dist vía vite preview), entra a
// todas las secciones como gerencia y falla si aparece cualquier error JS.
// No valida datos ni login (los inyecta): su objetivo es detectar que la
// UI de cada sección renderiza sin romperse tras un cambio.
//
// Uso:  npm run test:smoke
// Requiere un Chromium. En este entorno pasar CHROMIUM_PATH; en CI usar
//   npx playwright install chromium   (Playwright encuentra el suyo solo).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import net from 'node:net';

const PORT = Number(process.env.SMOKE_PORT || 4188);
const BASE = `http://localhost:${PORT}/`;
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || undefined;

const PAGES = [
  'home', 'checklist', 'control-jardineria', 'control-habitaciones',
  'recordatorios-jardineria', 'legajo', 'control-horarios', 'evaluaciones',
  'liquidacion', 'compras', 'compras-floreria', 'compras-jardineria',
  'compra-evento', 'stock-admin', 'floreros', 'velas', 'proveedores',
  'precio-comparacion', 'comercial', 'eventos-comercial', 'historial-eventos',
  'eventos-sin-floreria', 'recetas-arreglos', 'ventas-externas',
  'ramos-disponibles', 'lista-precios', 'pedidos-habitacion', 'galeria',
  'cotizador', 'presupuestos', 'crm-clientes', 'caja', 'rentabilidad-eventos',
  'cierre-mensual', 'reportes', 'reportes-ventas', 'reportes-stock',
  'reportes-equipo', 'operaciones', 'checklist', 'inventario', 'eventos-maison',
  'jardineria-ops', 'hab-ops', 'recepcion-pedidos', 'stock',
];

// Errores que NO son culpa de la app (red/Firebase/CDN externa bloqueada).
const IGNORE = /firebase|firestore|googleapis|gstatic|jsdelivr|net::ERR|Failed to load resource|ChunkLoadError|Chart is not defined/i;

function waitPort(port, timeoutMs = 60000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function tryOnce() {
      const s = net.connect(port, '127.0.0.1');
      s.on('connect', () => { s.destroy(); resolve(); });
      s.on('error', () => {
        s.destroy();
        if (Date.now() - start > timeoutMs) reject(new Error('preview no levantó'));
        else setTimeout(tryOnce, 300);
      });
    })();
  });
}

let preview, browser, failed = false;
const problems = [];

try {
  let previewLog = '';
  preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    stdio: ['ignore', 'pipe', 'pipe'], env: process.env,
  });
  preview.stdout.on('data', (d) => { previewLog += d; });
  preview.stderr.on('data', (d) => { previewLog += d; });
  try {
    await waitPort(PORT);
  } catch (e) {
    if (previewLog.trim()) console.error('--- vite preview ---\n' + previewLog.trim() + '\n--------------------');
    throw e;
  }

  browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(BASE, { waitUntil: 'load', timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const ls = document.getElementById('login-screen'); if (ls) ls.style.display = 'none';
    window.userRole = 'gerencia';
    document.body.classList.add('role-gerencia');
  });

  for (const pg of PAGES) {
    const before = errors.length;
    await page.evaluate((x) => { try { window.navigate && window.navigate(x); } catch (e) { /* la registra el listener */ } }, pg);
    await page.waitForTimeout(220);
    const nuevos = errors.slice(before).filter((e) => !IGNORE.test(e));
    if (nuevos.length) {
      failed = true;
      problems.push(`  ✗ ${pg}\n${nuevos.map((n) => '      ' + n).join('\n')}`);
    }
  }

  const total = errors.filter((e) => !IGNORE.test(e)).length;
  if (failed) {
    console.error(`\nSMOKE TEST — FALLÓ (${total} error(es) de app):\n${problems.join('\n')}\n`);
  } else {
    console.log(`\nSMOKE TEST — OK · ${PAGES.length} secciones sin errores de app.\n`);
  }
} catch (e) {
  failed = true;
  console.error('SMOKE TEST — error de infraestructura:', e.message);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (preview) preview.kill('SIGTERM');
}

process.exit(failed ? 1 : 0);
