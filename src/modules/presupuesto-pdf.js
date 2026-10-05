import { fmtDate } from './utils.js';
import { showToast } from './tema-toast.js';

const _hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

// ── PRESUPUESTOS EN PDF ───────────────────────────────────────
export function generarPresupuestoPDF(){
  const carrito = window.cotizadorCarrito || [];
  if(!carrito.length){ showToast('El carrito está vacío'); return; }

  const margen = +document.getElementById('cot-margen')?.value || 0;
  const cliente = document.getElementById('ppto-cliente')?.value?.trim() || '';
  const evento = document.getElementById('ppto-evento')?.value?.trim() || '';
  const fecha = document.getElementById('ppto-fecha')?.value || _hoy();
  const notas = document.getElementById('ppto-notas')?.value?.trim() || '';

  const totalCosto = carrito.reduce((s,c)=>s+(c.precio*c.qty),0);
  const precioFinal = Math.round(totalCosto*(1+margen/100));
  const nro = 'P-' + Date.now().toString().slice(-6);

  const win = window.open('','_blank');
  win.document.write(`<!DOCTYPE html><html lang="es"><head>
  <meta charset="UTF-8">
  <title>Presupuesto ${nro} — Florería Duhau</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'DM Sans',sans-serif; color:#1A1A1A; padding:48px; max-width:800px; margin:0 auto; }
    .logo { font-family:'Cormorant Garamond',serif; font-size:32px; font-weight:500; letter-spacing:1px; margin-bottom:4px; }
    .logo-sub { font-size:10px; letter-spacing:3px; text-transform:uppercase; color:#7A7A72; margin-bottom:32px; }
    .divider { border:none; border-top:1px solid #E8E6E0; margin:20px 0; }
    .header-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:28px; }
    .label { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#7A7A72; margin-bottom:4px; }
    .value { font-size:14px; }
    table { width:100%; border-collapse:collapse; margin:24px 0; }
    th { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:#7A7A72; padding:8px 12px; text-align:left; border-bottom:2px solid #1A1A1A; }
    td { padding:10px 12px; font-size:13px; border-bottom:1px solid #E8E6E0; }
    .total-row td { font-weight:700; font-size:15px; border-bottom:none; border-top:2px solid #1A1A1A; padding-top:14px; }
    .footer { margin-top:48px; font-size:10px; color:#7A7A72; text-align:center; letter-spacing:.5px; }
    .nro { font-size:12px; color:#7A7A72; }
    @media print { body { padding:24px; } }
  </style>
  </head><body>
  <div class="logo">Florería Duhau</div>
  <div class="logo-sub">Park Hyatt Buenos Aires</div>
  <hr class="divider">
  <div class="header-grid">
    <div>
      <div class="label">Presupuesto N°</div><div class="value">${nro}</div>
      <div class="label" style="margin-top:16px">Fecha</div><div class="value">${fmtDate(fecha)}</div>
    </div>
    <div>
      ${cliente?`<div class="label">Cliente</div><div class="value">${cliente}</div>`:''}
      ${evento?`<div class="label" style="margin-top:${cliente?'16px':'0'}">Evento / Ocasión</div><div class="value">${evento}</div>`:''}
    </div>
  </div>
  <table>
    <thead><tr><th>Ítem</th><th style="text-align:right">Precio unit.</th><th style="text-align:center">Qty</th><th style="text-align:right">Subtotal</th></tr></thead>
    <tbody>
      ${carrito.map(c=>`<tr>
        <td>${c.nombre}</td>
        <td style="text-align:right">$${c.precio.toLocaleString('es-AR')}</td>
        <td style="text-align:center">${c.qty}</td>
        <td style="text-align:right">$${(c.precio*c.qty).toLocaleString('es-AR')}</td>
      </tr>`).join('')}
      ${margen>0?`<tr><td colspan="3" style="text-align:right;font-size:12px;color:#7A7A72">Costo base</td><td style="text-align:right;font-size:12px;color:#7A7A72">$${totalCosto.toLocaleString('es-AR')}</td></tr>
      <tr><td colspan="3" style="text-align:right;font-size:12px;color:#7A7A72">Margen (${margen}%)</td><td style="text-align:right;font-size:12px;color:#7A7A72">$${(precioFinal-totalCosto).toLocaleString('es-AR')}</td></tr>`:''}
    </tbody>
    <tfoot><tr class="total-row"><td colspan="3">Total</td><td style="text-align:right">$${precioFinal.toLocaleString('es-AR')}</td></tr></tfoot>
  </table>
  ${notas?`<div style="margin-top:24px"><div class="label">Observaciones</div><div style="font-size:13px;line-height:1.6;margin-top:6px;color:#4A4A42">${notas}</div></div>`:''}
  <div class="footer">
    Florería Duhau · Park Hyatt Buenos Aires · Presupuesto válido por 7 días
  </div>
  <script>window.onload=()=>{ window.print(); }<\/script>
  </body></html>`);
  win.document.close();
}
