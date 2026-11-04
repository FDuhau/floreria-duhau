import { fmtDate, esc } from './utils.js';
import { showToast } from './tema-toast.js';
import { abrirDocumento, fmtPesos } from './documento-marca.js';

const _hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

// ── PRESUPUESTO DEL COTIZADOR (documento para el cliente) ─────
// El margen se reparte en el precio de cada ítem: el cliente ve precios
// finales, nunca el costo ni el porcentaje de ganancia.
export function generarPresupuestoPDF(){
  const carrito = window.cotizadorCarrito || [];
  if(!carrito.length){ showToast('El carrito está vacío'); return; }

  const margen = +document.getElementById('cot-margen')?.value || 0;
  const cliente = document.getElementById('ppto-cliente')?.value?.trim() || '';
  const evento = document.getElementById('ppto-evento')?.value?.trim() || '';
  const fecha = document.getElementById('ppto-fecha')?.value || _hoy();
  const notas = document.getElementById('ppto-notas')?.value?.trim() || '';

  const items = carrito.map(c => {
    const unit = Math.round((+c.precio || 0) * (1 + margen / 100));
    return { nombre: c.nombre, qty: +c.qty || 1, unit, sub: unit * (+c.qty || 1) };
  });
  const total = items.reduce((s, i) => s + i.sub, 0);
  const nro = 'P-' + Date.now().toString().slice(-6);

  abrirDocumento({
    tipo: 'Presupuesto' + (cliente && evento ? ' · ' + evento : ''),
    titulo: cliente || evento || '',
    numero: nro,
    meta: `Fecha: ${fmtDate(fecha)} · Válido por 7 días`,
    cuerpo: `
      <table class="t"><thead><tr><th>Ítem</th><th class="num">Cant.</th><th class="num">Precio unit.</th><th class="num">Subtotal</th></tr></thead>
        <tbody>${items.map(i => `<tr><td>${esc(i.nombre)}</td><td class="num">${i.qty}</td><td class="num">${fmtPesos(i.unit)}</td><td class="num">${fmtPesos(i.sub)}</td></tr>`).join('')}</tbody>
      </table>
      <div class="total-row"><div class="total-label">Total</div><div class="total-val">${fmtPesos(total)}</div></div>
      ${notas ? `<div class="notas">${esc(notas)}</div>` : ''}`,
    archivo: `Presupuesto ${nro}${cliente ? ' - ' + cliente : ''}`,
  });
}
