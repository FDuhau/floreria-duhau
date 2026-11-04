// ── DOCUMENTOS CON MARCA ────────────────────────────────────────────────────
// Un solo diseño para todo lo que se imprime o se manda al cliente
// (presupuestos, órdenes de compra, cierres, fichas, comprobantes, reclamos):
// encabezado oscuro con el logo, cuerpo claro, pie con los datos de la
// florería y botones para descargar en PDF, imprimir o mandar por WhatsApp.

import { esc } from './utils.js';

export const MARCA = {
  nombre: 'Florería Duhau',
  sub: 'Park Hyatt Buenos Aires',
  direccion: 'Av. Alvear 1661, CABA',
  telefono: '+54 9 11 7050-1615',
};

const CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;color:#1A1A1A;background:#EFEDE9;padding:32px 16px;line-height:1.5}
  .sheet{max-width:780px;margin:0 auto;background:#FDFCFB;border-radius:16px;overflow:hidden;box-shadow:0 12px 44px rgba(0,0,0,.14)}
  .hero{background:#111110;color:#F7F5F2;padding:34px 48px;display:flex;align-items:center;justify-content:space-between;gap:20px}
  .hero .brand{font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:400;letter-spacing:.5px;line-height:1.1}
  .hero .brand small{display:block;font-family:'DM Sans',sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(247,245,242,.55);margin-top:9px}
  .hero .doc-num{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:rgba(247,245,242,.6);text-align:right;margin-top:6px}
  .hero img{width:76px;height:76px;opacity:.92;flex-shrink:0;display:block;margin-left:auto}
  .body{padding:36px 48px 40px}
  .doc-title{font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#9A8F7A;margin-bottom:8px;font-weight:600}
  .doc-head{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:500;margin-bottom:4px;line-height:1.1}
  .meta{font-size:12.5px;color:#7A7A72;margin-bottom:26px}
  h2{font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#9A8F7A;font-weight:600;margin:26px 0 10px}
  .box{background:#F4F2ED;border:1px solid #E8E6E0;border-radius:12px;padding:18px 22px;margin-bottom:22px}
  .box-label{font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#9A8F7A;margin-bottom:8px;font-weight:600}
  .box-text{font-size:14.5px;line-height:1.7;white-space:pre-wrap}
  table.t{width:100%;border-collapse:collapse;margin:6px 0 20px;font-size:13px}
  table.t th{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#7A7A72;font-weight:600;text-align:left;padding:9px 10px;border-bottom:2px solid #1A1A1A}
  table.t td{padding:10px;border-bottom:1px solid #E8E6E0;vertical-align:top}
  table.t .num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
  table.t tfoot td{font-weight:700;border-bottom:none;border-top:2px solid #1A1A1A}
  table.kv{width:100%;border-collapse:collapse;font-size:13.5px;margin-bottom:20px}
  table.kv td{padding:10px 0;border-bottom:1px solid #E8E6E0;vertical-align:top}
  table.kv td.k{color:#7A7A72;width:38%;padding-right:16px}
  table.kv td.v{font-weight:500;text-align:right}
  table.kv.izq td.v{text-align:left;font-weight:400}
  table.kv td.v ul{padding-left:18px}
  table.kv tr.fuerte td{font-weight:700;color:#1A1A1A;font-size:15px}
  .muted{color:#8A8A80;font-size:12px}
  .total-row{display:flex;justify-content:space-between;align-items:flex-end;border-top:2px solid #1A1A1A;padding-top:16px;margin:8px 0 10px}
  .total-label{font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#7A7A72;font-weight:600;padding-bottom:6px}
  .total-val{font-family:'Cormorant Garamond',serif;font-size:40px;font-weight:600;line-height:1}
  .notas{font-size:13.5px;color:#5A5A52;line-height:1.7;border-left:3px solid #C8BEA8;padding-left:16px;white-space:pre-wrap;margin-top:14px}
  .foto{width:100%;max-height:420px;object-fit:cover;border-radius:12px;margin-bottom:22px;display:block}
  .firmas{display:flex;gap:40px;flex-wrap:wrap;margin-top:56px}
  .firmas div{flex:1;min-width:160px;border-top:1px solid #555;padding-top:8px;font-size:12px;color:#555}
  p{font-size:13.5px;margin-bottom:12px}
  .footer{border-top:1px solid #E8E6E0;padding:20px 48px;font-size:12px;color:#9A8F7A;text-align:center;letter-spacing:.3px;line-height:1.9}
  .actions{max-width:780px;margin:22px auto 0;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
  .actions a,.actions button{font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;padding:13px 26px;border-radius:10px;cursor:pointer;border:none;text-decoration:none;display:inline-flex;align-items:center;gap:8px}
  .b-pdf{background:#1A1A1A;color:#fff}
  .b-pdf:disabled{opacity:.6;cursor:default}
  .b-wa{background:#25D366;color:#fff}
  .b-print{background:#E4E0D8;color:#1A1A1A}
  .sheet,.hero,.box,.total-row{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @page{size:A4;margin:0}
  @media print{html,body{background:#fff;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.sheet{box-shadow:none;border-radius:0;max-width:100%}.actions{display:none}}
  @media (max-width:600px){body{padding:0}.sheet{border-radius:0}.hero,.body,.footer{padding-left:22px;padding-right:22px}.doc-head{font-size:26px}.total-val{font-size:32px}}
`;

const SCRIPT_PDF = `
  async function descargarPDF(){
    var btn = document.getElementById('b-pdf');
    var old = btn.textContent; btn.disabled = true; btn.textContent = 'Generando…';
    try{
      var t0 = Date.now();
      while((!window.html2canvas || !(window.jspdf && window.jspdf.jsPDF)) && Date.now()-t0 < 12000){
        await new Promise(function(r){ setTimeout(r, 200); });
      }
      if(!window.html2canvas || !(window.jspdf && window.jspdf.jsPDF)){
        alert('No se pudieron cargar los componentes del PDF (revisá la conexión a internet). Como alternativa podés usar "Imprimir".');
        return;
      }
      if(document.fonts && document.fonts.ready){ try{ await document.fonts.ready; }catch(e){} }
      var canvas = await html2canvas(document.querySelector('.sheet'), { scale:2, useCORS:true, backgroundColor:'#FDFCFB' });
      var img = canvas.toDataURL('image/jpeg', 0.95);
      var pw = 595.28, ph = pw * canvas.height / canvas.width;
      var pdf = new window.jspdf.jsPDF({ unit:'pt', format:[pw, ph] });
      pdf.addImage(img, 'JPEG', 0, 0, pw, ph);
      var compartido = false;
      try{
        var file = new File([pdf.output('blob')], _pdfName, { type:'application/pdf' });
        if(navigator.canShare && navigator.canShare({ files:[file] })){ await navigator.share({ files:[file], title:_pdfName }); compartido = true; }
      }catch(e){ compartido = false; }
      if(!compartido) pdf.save(_pdfName);
    }catch(e){
      alert('No se pudo generar el PDF: ' + (e && e.message ? e.message : e));
    }finally{
      btn.disabled = false; btn.textContent = old;
    }
  }
`;

// Nombre de archivo seguro (sin caracteres que Windows/Android rechazan)
export function nombreArchivo(base){
  return String(base || MARCA.nombre).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() + '.pdf';
}

/**
 * Abre el documento en una pestaña nueva.
 * @param {object} o
 *   tipo      — "Presupuesto", "Orden de compra"…  (va arriba del título)
 *   titulo    — título grande (cliente, mes, nombre del arreglo…)
 *   meta      — línea gris debajo del título (fechas, número)
 *   numero    — texto chico en el encabezado oscuro (ej. "OC 0012")
 *   cuerpo    — HTML del contenido (ya escapado)
 *   archivo   — nombre del PDF sin extensión
 *   waURL     — si viene, agrega "Enviar por WhatsApp"
 *   ventana   — ventana ya abierta (para abrirla antes de un await y evitar el bloqueo de pop-ups)
 */
export function abrirDocumento(o){
  const win = o.ventana || window.open('', '_blank');
  if(!win){ alert('El navegador bloqueó la ventana nueva. Permití las ventanas emergentes para esta página.'); return null; }
  const logo = location.origin + '/icon-512.png';
  win.document.open();
  win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc((o.tipo || '') + (o.titulo ? ' — ' + o.titulo : ''))} · ${MARCA.nombre}</title>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>${CSS}</style></head><body>
    <div class="sheet">
      <div class="hero">
        <div class="brand">${MARCA.nombre}<small>${MARCA.sub}</small></div>
        <div><img src="${logo}" alt="" crossorigin="anonymous">${o.numero ? `<div class="doc-num">${esc(o.numero)}</div>` : ''}</div>
      </div>
      <div class="body">
        ${o.tipo ? `<div class="doc-title">${esc(o.tipo)}</div>` : ''}
        ${o.titulo ? `<div class="doc-head">${esc(o.titulo)}</div>` : ''}
        ${o.meta ? `<div class="meta">${o.meta}</div>` : ''}
        ${o.cuerpo || ''}
      </div>
      <div class="footer">${MARCA.nombre} · ${MARCA.sub} · ${MARCA.direccion}<br>Tel / WhatsApp: ${MARCA.telefono}</div>
    </div>
    <div class="actions">
      <button class="b-pdf" id="b-pdf" onclick="descargarPDF()">Descargar PDF</button>
      ${o.waURL ? `<a class="b-wa" href="${o.waURL}" target="_blank" rel="noopener">Enviar por WhatsApp</a>` : ''}
      <button class="b-print" onclick="window.print()">Imprimir</button>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
    <script>var _pdfName = ${JSON.stringify(nombreArchivo(o.archivo || o.tipo))};${SCRIPT_PDF}<\/script>
  </body></html>`);
  win.document.close();
  return win;
}

// Ayudantes de formato para armar cuerpos
export const fmtPesos = n => '$' + (Math.round(+n || 0)).toLocaleString('es-AR');
// kv(filas, { izq:true }) → valores alineados a la izquierda (texto largo, listas)
export const kv = (filas, op = {}) => `<table class="kv${op.izq ? ' izq' : ''}"><tbody>${filas.filter(Boolean).map(([k, v, fuerte]) =>
  `<tr${fuerte ? ' class="fuerte"' : ''}><td class="k">${k}</td><td class="v">${v}</td></tr>`).join('')}</tbody></table>`;
