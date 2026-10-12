import { esc } from './utils.js';
import { showToast } from './tema-toast.js';

// Viven en app.js; se pasan una sola vez con configurarCotizadorEventos() al arrancar.
const D = {};
export function configurarCotizadorEventos(deps){ Object.assign(D, deps); }

// ── COTIZADOR DE EVENTOS HYATT ────────────────────────────────────────────────
export function initCotizadorEventosHyatt(){
  D.renderEvTipos(); // pobla el select de tipos
}

export function calcularArreglosEvento(){
  const tipoIdx = document.getElementById('ceh-tipo')?.value;
  const pax = +document.getElementById('ceh-pax')?.value || 0;
  const resultado = document.getElementById('ceh-resultado');
  const listEl = document.getElementById('ceh-arreglos-list');
  if(!resultado || !listEl) return;

  if(!tipoIdx || tipoIdx === '' || pax <= 0){
    resultado.style.display = 'none';
    return;
  }
  resultado.style.display = '';
  const tipo = D.pricing().tipos[+tipoIdx];
  if(!tipo || !tipo.reglas || !tipo.reglas.length){
    listEl.innerHTML = '<div style="padding:16px;text-align:center;color:var(--mid-gray)">Este tipo de evento no tiene arreglos configurados. Pedile a gerencia que los configure.</div>';
    document.getElementById('ceh-total').textContent = '$0';
    return;
  }

  const margen = tipo.margen || 0;
  let totalPrecio = 0;

  listEl.innerHTML = tipo.reglas.map((r, ri) => {
    const qty = Math.ceil(pax / r.cadaPax);
    // Buscar precio del arreglo en composiciones
    const comp = D.recetas().find(c => c.nombre.toLowerCase() === r.arreglo.toLowerCase());
    let precioUnit = 0;
    if(comp){
      const costo = D.calcCostoComposicion(comp);
      precioUnit = Math.round(costo * (1 + margen/100));
    }
    const subtotal = precioUnit * qty;
    totalPrecio += subtotal;

    return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;padding:14px 16px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div>
          <span style="font-size:15px;font-weight:600;color:#1A1A1A">${D.arregloEmoji(r.arreglo)} ${esc(r.arreglo)}</span>
          <span style="font-size:12px;color:var(--mid-gray);margin-left:8px">1 cada ${r.cadaPax} personas</span>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:var(--mid-gray)">Cantidad sugerida</div>
          <input type="number" id="ceh-qty-${ri}" value="${qty}" min="0"
            onchange="recalcTotalEvento()"
            style="width:60px;padding:4px;border:1px solid var(--light-gray);border-radius:4px;font-size:16px;font-weight:700;text-align:center;font-family:inherit">
        </div>
      </div>
      ${precioUnit > 0 ? `<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:13px">
        <span style="color:var(--mid-gray)">$${precioUnit.toLocaleString('es-AR')} c/u</span>
        <strong style="color:var(--charcoal)">$${subtotal.toLocaleString('es-AR')}</strong>
      </div>` : '<div style="font-size:11px;color:var(--amber);margin-top:4px">Sin precio configurado — consultar a florería</div>'}
    </div>`;
  }).join('');

  document.getElementById('ceh-total').textContent = '$' + totalPrecio.toLocaleString('es-AR');
}

export function recalcTotalEvento(){
  const tipoIdx = document.getElementById('ceh-tipo')?.value;
  const tipo = D.pricing().tipos[+tipoIdx];
  if(!tipo) return;
  const margen = tipo.margen || 0;
  let total = 0;
  (tipo.reglas||[]).forEach((r, ri) => {
    const qty = +document.getElementById('ceh-qty-'+ri)?.value || 0;
    const comp = D.recetas().find(c => c.nombre.toLowerCase() === r.arreglo.toLowerCase());
    if(comp){
      const costo = D.calcCostoComposicion(comp);
      total += Math.round(costo * (1 + margen/100)) * qty;
    }
  });
  document.getElementById('ceh-total').textContent = '$' + total.toLocaleString('es-AR');
}

export function generarTextoCotEvento(){
  const nombre = document.getElementById('ceh-nombre')?.value || 'Evento';
  const pax = document.getElementById('ceh-pax')?.value || '—';
  const fecha = document.getElementById('ceh-fecha')?.value || '';
  const tipoIdx = document.getElementById('ceh-tipo')?.value;
  const tipo = D.pricing().tipos[+tipoIdx];
  if(!tipo) return '';
  const margen = tipo.margen || 0;

  let lineas = [];
  let total = 0;
  (tipo.reglas||[]).forEach((r, ri) => {
    const qty = +document.getElementById('ceh-qty-'+ri)?.value || 0;
    if(qty <= 0) return;
    const comp = D.recetas().find(c => c.nombre.toLowerCase() === r.arreglo.toLowerCase());
    let precio = 0;
    if(comp) precio = Math.round(D.calcCostoComposicion(comp) * (1 + margen/100));
    const sub = precio * qty;
    total += sub;
    lineas.push(`• ${qty} × ${r.arreglo}${precio ? '  —  $'+sub.toLocaleString('es-AR') : '  (precio a confirmar)'}`);
  });

  return `COTIZACIÓN DE EVENTO — Florería Duhau\n${'─'.repeat(40)}\nEvento: ${nombre}\nTipo: ${tipo.nombre}\nPersonas: ${pax}\n${fecha ? 'Fecha: '+fecha+'\n' : ''}${'─'.repeat(40)}\n\nARREGLOS FLORALES:\n${lineas.join('\n')}\n\n${'─'.repeat(40)}\nTOTAL ESTIMADO: $${total.toLocaleString('es-AR')}\n${'─'.repeat(40)}\n\nEste presupuesto es orientativo. Queda sujeto a confirmación por parte de Florería Duhau.\nConsultas: operaciones@lafloreriadelduhau.com.ar`;
}

export function enviarCotizacionEvento(){
  const texto = generarTextoCotEvento();
  if(!texto) return;
  const nombre = document.getElementById('ceh-nombre')?.value || 'Evento';
  const subject = encodeURIComponent('Cotización Evento: ' + nombre + ' — Florería Duhau');
  const body = encodeURIComponent(texto);
  window.open('mailto:operaciones@lafloreriadelduhau.com.ar?subject=' + subject + '&body=' + body, '_blank');
  showToast('Se abrió el mail con la cotización — envialo para confirmar');
}

export function copiarCotizacionEvento(){
  const texto = generarTextoCotEvento();
  if(!texto) return;
  navigator.clipboard.writeText(texto).then(() => showToast('Cotización copiada'));
}
