import { esc, parseMoney } from './utils.js';
import { compraCant, compraImporte, costoHotelMes } from './dinero.js';

// Viven en app.js; se pasan una sola vez con configurarCostoHotel() al arrancar.
const D = {};
export function configurarCostoHotel(deps){ Object.assign(D, deps); }

// ── COSTO DEL HOTEL POR MES ───────────────────────────────────────────────────
// Compras de florería de las áreas del hotel (sin eventos), por arreglo y total.
function _costoHotelActual(){
  const mes = document.getElementById('hotel-mes')?.value || D.TODAY_ISO.slice(0,7);
  return { mes, ...costoHotelMes(window.comprasFlore||D.comprasFlore()||[], mes) };
}
export function renderCostoHotel(){
  D._repMeses('hotel-mes');
  const { areas, total, sinArea } = _costoHotelActual();
  const fmt = n => '$' + Math.round(n).toLocaleString('es-AR');
  const kpis = document.getElementById('hotel-kpis');
  if(kpis) kpis.innerHTML =
    D._kpiCard('Total hotel', fmt(total), 'compras del mes, sin eventos') +
    D._kpiCard('Arreglos / áreas', areas.length, 'con compras en el mes');
  const cont = document.getElementById('hotel-tabla');
  if(!cont) return;
  const aviso = sinArea.length
    ? `<div style="background:#FFF6E0;border:1px solid #E8D28A;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12.5px">${sinArea.length} compra(s) del mes no tienen área cargada, por eso no se suman al hotel (${fmt(sinArea.reduce((s,r)=>s+compraImporte(r),0))}). Asignales un área en Compras Florería si son del hotel.</div>`
    : '';
  if(!areas.length){
    cont.innerHTML = aviso + '<div style="text-align:center;padding:40px;color:var(--mid-gray)">No hay compras del hotel en este mes.</div>';
    return;
  }
  cont.innerHTML = aviso + areas.map(a=>`
    <div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:12px;padding:14px 16px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-weight:700;margin-bottom:8px"><span>${esc(a.area)}</span><span>${fmt(a.total)}</span></div>
      <table style="width:100%;font-size:12.5px;border-collapse:collapse">
        ${a.lineas.slice().sort((x,y)=>(x.fecha||'').localeCompare(y.fecha||'')).map(r=>`<tr style="border-top:1px solid var(--light-gray)">
          <td style="padding:4px 6px;white-space:nowrap">${esc(r.fecha||'')}</td>
          <td style="padding:4px 6px">${esc(r.prod||'')}${r.prov?` <span style="color:var(--mid-gray)">· ${esc(r.prov)}</span>`:''}</td>
          <td style="padding:4px 6px;text-align:right">${esc(String(compraCant(r)))} × ${fmt(parseMoney(r.costo))}</td>
          <td style="padding:4px 6px;text-align:right;font-weight:600">${fmt(compraImporte(r))}</td></tr>`).join('')}
      </table>
    </div>`).join('') +
    `<div style="text-align:right;font-size:16px;font-weight:700;padding:6px 4px">Total hotel: ${fmt(total)}</div>`;
}
export function exportCostoHotel(){
  const { mes, areas, total } = _costoHotelActual();
  const rows=[['Área / arreglo','Fecha','Producto','Proveedor','Cantidad','Precio por paquete','Importe']];
  areas.forEach(a=>{
    a.lineas.forEach(r=>rows.push([a.area,r.fecha||'',r.prod||'',r.prov||'',r.qty||1,parseMoney(r.costo),compraImporte(r)]));
    rows.push([a.area+' — subtotal','','','','','',a.total]);
  });
  rows.push(['TOTAL HOTEL','','','','','',total]);
  D._downloadCSV(rows,`costo-hotel-${mes}.csv`);
}
