// Separado de app.js. Lo que necesita de app.js llega por configurarCierreMensual():
//   CURR_MONTH, TODAY_ISO, compraFilterExt, comprasFlore, comprasJard, eventosData, fbSave, fmtMonth

import { fmtDate, parseMoney } from './utils.js';
import { VENTA_ESTADO_LABEL, costoVenta, normPago, ventasData } from './ventas.js';
import { _compraImporte } from './compras.js';
import { cajaData } from './caja.js';
import { confirmModal } from './modales.js';
import { showToast } from './tema-toast.js';
import { abrirDocumento, fmtPesos, kv } from './documento-marca.js';
import { legajoData } from './personal.js';

let D = {};
export function configurarCierreMensual(deps){ D = deps; }

// ════════════════════════════════════════
// FEATURE 5: CIERRE MENSUAL AUTOMATIZADO
// ════════════════════════════════════════
export let cierresMensualesData = [];
window._setCierresMensuales = arr => { cierresMensualesData = arr && typeof arr === 'object' ? (Array.isArray(arr)?arr:Object.values(arr)) : []; renderCierreMensual(); };

export function renderCierreMensual(){
  const el = document.getElementById('cierre-mensual-body');
  if(!el) return;
  const sorted = [...cierresMensualesData].sort((a,b)=>(b.mes||'').localeCompare(a.mes||''));
  if(!sorted.length){ el.innerHTML = '<div style="color:var(--mid-gray);text-align:center;padding:40px">No hay cierres guardados. Generá el primero con el botón "Generar Cierre".</div>'; return; }
  el.innerHTML = sorted.map((c,i)=>`
    <div class="card" style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">
        <h3 style="margin:0">${D.fmtMonth(c.mes)}</h3>
        <div style="display:flex;gap:8px">
          <button class="btn-secondary" style="font-size:12px" onclick="verCierreMensual(${i})">Ver detalle</button>
          <button class="btn-secondary" style="font-size:12px" onclick="exportCierrePDF(${i})">PDF</button>
        </div>
      </div>
      <div class="cierre-kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">
        <div class="kpi-card"><div class="kpi-val">$${parseMoney(c.totalVentas||0).toLocaleString('es-AR',{minimumFractionDigits:0})}</div><div class="kpi-lbl">Ventas totales</div></div>
        <div class="kpi-card"><div class="kpi-val">$${parseMoney(c.totalCompras||0).toLocaleString('es-AR',{minimumFractionDigits:0})}</div><div class="kpi-lbl">Compras totales</div></div>
        <div class="kpi-card"><div class="kpi-val">${c.cantEventos||0}</div><div class="kpi-lbl">Eventos</div></div>
        <div class="kpi-card"><div class="kpi-val">$${parseMoney(c.totalCaja||0).toLocaleString('es-AR',{minimumFractionDigits:0})}</div><div class="kpi-lbl">Caja neta</div></div>
      </div>
    </div>`).join('');
}

export async function generarCierreMensual(){
  const mes = document.getElementById('cierre-mes-sel')?.value || D.CURR_MONTH;
  const ventas = (ventasData||[]).filter(v=>v.fecha&&v.fecha.startsWith(mes));
  const totalVentas = ventas.reduce((s,v)=>s+parseMoney(v.monto||v.total||0),0);
  const compras = [...(D.comprasFlore||[]),...(D.comprasJard||[])].filter(c=>c.fecha&&c.fecha.startsWith(mes)&&!c.anulado);
  const totalCompras = compras.reduce((s,c)=>s+_compraImporte(c),0);
  const eventos = (D.eventosData||[]).filter(e=>e.fecha&&e.fecha.startsWith(mes));
  const cajaMov = (cajaData||[]).filter(m=>m.fecha&&m.fecha.startsWith(mes));
  const ingresos = cajaMov.filter(m=>m.tipo==='ingreso').reduce((s,m)=>s+parseMoney(m.monto||0),0);
  const egresos = cajaMov.filter(m=>m.tipo==='egreso').reduce((s,m)=>s+parseMoney(m.monto||0),0);
  const cierre = {
    mes, fechaCierre: D.TODAY_ISO,
    totalVentas, totalCompras,
    cantEventos: eventos.length,
    cantVentas: ventas.length,
    cantCompras: compras.length,
    totalCaja: ingresos - egresos,
    ingresosCaja: ingresos, egresosCaja: egresos,
    margenBruto: totalVentas - totalCompras,
    resumen: `Cierre ${D.fmtMonth(mes)}: ${ventas.length} ventas, ${compras.length} compras, ${eventos.length} eventos`
  };
  const existing = cierresMensualesData.findIndex(c=>c.mes===mes);
  if(existing>=0){
    if(!await confirmModal(`Ya existe un cierre para ${D.fmtMonth(mes)}. ¿Reemplazarlo?`)) return;
    cierresMensualesData[existing] = cierre;
  } else {
    cierresMensualesData.push(cierre);
  }
  D.fbSave('cierresMensualesData', cierresMensualesData);
  renderCierreMensual();
  showToast(`Cierre de ${D.fmtMonth(mes)} generado`);
}

export function verCierreMensual(idx){
  const sorted = [...cierresMensualesData].sort((a,b)=>(b.mes||'').localeCompare(a.mes||''));
  const c = sorted[idx];
  if(!c) return;
  const $ = n => fmtPesos(parseMoney(n));
  abrirDocumento({
    tipo: 'Cierre mensual',
    titulo: D.fmtMonth(c.mes),
    meta: 'Generado el ' + fmtDate(c.fechaCierre),
    cuerpo: `<h2>Resultado</h2>` + kv([
        ['Ventas totales', $(c.totalVentas)],
        ['Compras totales', $(c.totalCompras)],
        ['Margen bruto', $(c.margenBruto), true],
      ]) + `<h2>Caja</h2>` + kv([
        ['Ingresos', $(c.ingresosCaja)],
        ['Egresos', $(c.egresosCaja)],
        ['Caja neta', $(c.totalCaja), true],
      ]) + `<h2>Actividad</h2>` + kv([
        ['Ventas', c.cantVentas ?? '—'],
        ['Compras', c.cantCompras ?? '—'],
        ['Eventos', c.cantEventos ?? '—'],
      ]),
    archivo: 'Cierre mensual - ' + D.fmtMonth(c.mes),
  });
}

export function exportCierrePDF(idx){ verCierreMensual(idx); }

// ════════════════════════════════════════
// FEATURE 7: EXPORTACIÓN A EXCEL (.xlsx)
// ════════════════════════════════════════
export function _xlsxDownload(wb, filename){
  const X = window.XLSX;
  if(!X){ showToast('Error: librería XLSX no disponible'); return; }
  X.writeFile(wb, filename);
}

export function exportVentasXLSX(){
  const X = window.XLSX;
  if(!X){ showToast('Error: XLSX no disponible'); return; }
  // Respetar los filtros de la pantalla (mes/pago/tipo/facturado). Sin mes elegido,
  // exporta el mes en curso. Antes exportaba contra campos inexistentes (monto/qty)
  // y salían todos los montos en $0 y sin cliente/forma de pago.
  const fMes  = document.getElementById('ve-filter-mes')?.value || D.CURR_MONTH;
  const fPago = document.getElementById('ve-filter-pago')?.value || '';
  const fTipo = document.getElementById('ve-filter-tipo')?.value || '';
  const fFact = document.getElementById('ve-filter-fact')?.value || '';
  let lista = (ventasData||[]).filter(v=>!(v.esPedidoRamo && v.estado!=='entregado'));
  lista = lista.filter(v=>(v.fecha||'').startsWith(fMes));
  if(fPago) lista = lista.filter(v=>normPago(v.formaPago)===fPago);
  if(fTipo) lista = lista.filter(v=>(v.prod||'').trim()===fTipo);
  if(fFact==='si') lista = lista.filter(v=>v.facturado==='Sí');
  if(fFact==='no') lista = lista.filter(v=>v.facturado!=='Sí');
  lista.sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  const rows = lista.map(v=>{
    const costo = costoVenta(v);
    const margen = costo!=null ? parseMoney(v.precio)-costo-parseMoney(v.envioCosto) : '';
    return {
      Fecha: v.fecha||'',
      Producto: v.prod||'',
      Descripción: v.desc||'',
      Cliente: v.cliente||'',
      Destinatario: v.destinatario||'',
      Dedicatoria: v.dedicatoria||'',
      Precio: parseMoney(v.precio),
      'Forma de pago': v.formaPago||'',
      Estado: (VENTA_ESTADO_LABEL[v.estado]||v.estado||'').replace(/^[^\wÁ-ú]+/,'').trim(),
      Facturado: v.facturado||'',
      'Taxi/Flete': v.taxiFlete||'',
      'Costo envío': parseMoney(v.envioCosto),
      'Margen estimado': margen==='' ? '' : Math.round(margen),
      Dirección: v.dir||'',
      Asignado: v.asignado||''
    };
  });
  if(!rows.length){ showToast('Sin ventas para exportar en '+D.fmtMonth(fMes)); return; }
  const ws = X.utils.json_to_sheet(rows);
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, 'Ventas');
  _xlsxDownload(wb, `ventas-${fMes}.xlsx`);
  showToast('Exportado: ventas-'+fMes+'.xlsx ('+rows.length+' ventas)');
}

export function exportLegajoXLSX(){
  const X = window.XLSX;
  if(!X){ showToast('Error: XLSX no disponible'); return; }
  const rows = (legajoData||[]).map(e=>({
    Nombre: e.nombre||'', Cargo: e.cargo||'', Área: e.area||'', Ingreso: e.ingreso||'',
    'Horas Contrato': e.horasContrato||0, Estado: e.estado||'activo', Email: e.email||'', Tel: e.tel||''
  }));
  if(!rows.length){ showToast('Sin empleados para exportar'); return; }
  const ws = X.utils.json_to_sheet(rows);
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, 'Legajo');
  _xlsxDownload(wb, `legajo-${D.TODAY_ISO}.xlsx`);
  showToast('Exportado: legajo-'+D.TODAY_ISO+'.xlsx');
}

export function applyCompraFiltersExtToArr(type, arr){
  const f = D.compraFilterExt[type]||{};
  if(f.prov) arr = arr.filter(r=>r.prov===f.prov);
  if(f.estado) arr = arr.filter(r=>r.estado===f.estado);
  if(f.desde) arr = arr.filter(r=>r.fecha>=f.desde);
  if(f.hasta) arr = arr.filter(r=>r.fecha<=f.hasta);
  if(f.montoMin) arr = arr.filter(r=>parseMoney(r.costo)>=+f.montoMin);
  if(f.montoMax) arr = arr.filter(r=>parseMoney(r.costo)<=+f.montoMax);
  if(f.producto) arr = arr.filter(r=>(r.prod||'').toLowerCase().includes(f.producto.toLowerCase()));
  return arr;
}