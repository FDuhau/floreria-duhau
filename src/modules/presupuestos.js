// Separado de app.js. Lo que necesita de app.js llega por configurarPresupuestos():
//   TODAY_ISO, arregloEmoji, closeModal, comprasFlore, fbSave, navigate, recetasData, stockData

import { esc, fmtDate, parseMoney } from './utils.js';
import { validarCampos } from './validacion.js';
import { showToast } from './tema-toast.js';
import { confirmModal } from './modales.js';
import { MARCA, abrirDocumento, fmtPesos } from './documento-marca.js';
import { calcCostoComposicion, cotizadorPrecios, resolveCotizadorPrecio } from './cotizador.js';
import { getUltimoPrecioCompra, recalcCotizadorPrecio } from './compras.js';
import { claveArticulo, costoGuardado, mismoArticulo } from './articulos-base.js';

let D = {};
export function configurarPresupuestos(deps){ D = deps; }



// ════════════════════════════════════════
// FEATURE 4: SEGUIMIENTO DE PRESUPUESTOS
// ════════════════════════════════════════
export let presupuestosData = [];
window._setPresupuestos = arr => { presupuestosData = arr && typeof arr === 'object' ? (Array.isArray(arr)?arr:Object.values(arr)) : []; renderPresupuestos(); };

export function renderPresupuestos(){
  const el = document.getElementById('presupuestos-body');
  if(!el) return;
  const sorted = [...presupuestosData].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
  const total = presupuestosData.length;
  const cerrados = presupuestosData.filter(p=>p.estado==='aceptado').length;
  const conversion = total ? Math.round(cerrados/total*100) : 0;
  const volumen = presupuestosData.filter(p=>p.estado==='aceptado').reduce((s,p)=>s+parseMoney(p.monto||0),0);
  const stats = document.getElementById('presupuestos-stats');
  if(stats) stats.innerHTML = `
    <div class="kpi-card"><div class="kpi-val">${total}</div><div class="kpi-lbl">Total enviados</div></div>
    <div class="kpi-card"><div class="kpi-val">${cerrados}</div><div class="kpi-lbl">Aceptados</div></div>
    <div class="kpi-card"><div class="kpi-val">${conversion}%</div><div class="kpi-lbl">Tasa de conversión</div></div>
    <div class="kpi-card"><div class="kpi-val">$${volumen.toLocaleString('es-AR',{minimumFractionDigits:0,maximumFractionDigits:0})}</div><div class="kpi-lbl">Volumen aceptado</div></div>`;
  if(!sorted.length){ el.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--mid-gray);padding:24px">Sin presupuestos aún. Usá «+ Nuevo presupuesto» para agregar.</td></tr>'; return; }
  const stColors = {pendiente:'#856404',aceptado:'#155724',rechazado:'#721c24',vencido:'#6c757d'};
  const stBg = {pendiente:'#fff3cd',aceptado:'#d4edda',rechazado:'#f8d7da',vencido:'#e2e3e5'};
  const stLbl = {pendiente:'Pendiente',aceptado:'Aceptado',rechazado:'Rechazado',vencido:'Vencido'};
  el.innerHTML = sorted.map(p=>{
    const i = presupuestosData.indexOf(p);
    const est = p.estado||'pendiente';
    return `<tr style="cursor:pointer" onclick="verPresupuesto(${i})">
    <td style="white-space:nowrap">${fmtDate(p.fecha)}</td>
    <td><strong>${esc(p.cliente||'—')}</strong></td>
    <td>${esc(p.concepto||'—')}</td>
    <td style="white-space:nowrap;font-weight:600">$${parseMoney(p.monto||0).toLocaleString('es-AR',{minimumFractionDigits:0})}</td>
    <td><span style="background:${stBg[est]||'#eee'};color:${stColors[est]||'#333'};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;white-space:nowrap">${stLbl[est]||est}</span></td>
    <td style="white-space:nowrap">${p.vencimiento ? fmtDate(p.vencimiento) : '—'}</td>
    <td onclick="event.stopPropagation()">
      <div class="table-actions">
        <button class="btn-mini" onclick="verPresupuesto(${i})">Ver</button>
        <button class="btn-mini wa" title="Enviar por WhatsApp" onclick="enviarPresupuestoWhatsApp(${i})">WhatsApp</button>
        <select class="cl-select" onchange="cambiarEstadoPres(${i},this.value)">
          <option value="">Estado…</option>
          <option value="aceptado">Aceptado ✓</option>
          <option value="rechazado">Rechazado </option>
          <option value="vencido">Vencido</option>
          <option value="pendiente">Pendiente</option>
        </select>
        <button class="btn-icon" title="Eliminar" onclick="eliminarPresupuesto(${i})"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg></button>
      </div>
    </td>
  </tr>`;
  }).join('');
}

export function openPresupuestoModal(){
  document.getElementById('pres-form').reset();
  document.getElementById('pres-fecha').value = D.TODAY_ISO;
  document.getElementById('modal-presupuesto').classList.add('open');
}

export function guardarPresupuesto(){
  const cliente = document.getElementById('pres-cliente').value.trim();
  const concepto = document.getElementById('pres-concepto').value.trim();
  const telefono = document.getElementById('pres-telefono')?.value.trim() || '';
  const monto = document.getElementById('pres-monto').value;
  const vencimiento = document.getElementById('pres-vencimiento').value;
  const notas = document.getElementById('pres-notas').value.trim();
  if(!validarCampos([
    { id:'pres-cliente', req:true, msg:'Escribí el nombre del cliente' },
    { id:'pres-monto', req:true, tipo:'monto', msg:'Ingresá el monto' },
    { id:'pres-vencimiento', tipo:'fecha' },
  ])) return;
  presupuestosData.push({ id: Date.now(), fecha: D.TODAY_ISO, cliente, concepto, telefono, monto, vencimiento, notas, estado:'pendiente' });
  D.fbSave('presupuestosData', presupuestosData);
  D.closeModal('modal-presupuesto');
  renderPresupuestos();
  showToast('Presupuesto guardado');
}

export function cambiarEstadoPres(idx, estado){
  if(!estado || idx<0 || !presupuestosData[idx]) return;
  presupuestosData[idx].estado = estado;
  D.fbSave('presupuestosData', presupuestosData);
  renderPresupuestos();
  showToast('Estado actualizado');
}

export async function eliminarPresupuesto(idx){
  if(idx<0 || !presupuestosData[idx]) return;
  if(!await confirmModal('¿Eliminar este presupuesto?')) return;
  presupuestosData.splice(idx, 1);
  D.fbSave('presupuestosData', presupuestosData);
  renderPresupuestos();
  showToast('Eliminado');
}

// ── Texto y enlace de WhatsApp para un presupuesto ──
function presupuestoWaURL(p){
  const tel = (p.telefono||'').replace(/[^\d]/g,'');
  const monto = '$'+parseMoney(p.monto||0).toLocaleString('es-AR',{maximumFractionDigits:0});
  const lineas = [
    '*Florería Duhau* — Park Hyatt Buenos Aires',
    '',
    `Estimado/a ${p.cliente||''},`,
    'Le compartimos el presupuesto solicitado:',
    ''
  ];
  if(p.concepto) lineas.push(`• ${p.concepto}`);
  lineas.push(`*Total: ${monto}*`);
  if(p.vencimiento) lineas.push(`Válido hasta: ${fmtDate(p.vencimiento)}`);
  if(p.notas){ lineas.push(''); lineas.push(p.notas); }
  lineas.push('', '¡Gracias por elegirnos! ');
  const text = encodeURIComponent(lineas.join('\n'));
  return tel ? `https://wa.me/${tel}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function enviarPresupuestoWhatsApp(idx){
  const p = presupuestosData[idx];
  if(!p) return;
  window.open(presupuestoWaURL(p), '_blank');
}

// ── Documento de presupuesto con diseño de marca (ver / imprimir / PDF) ──
export function verPresupuesto(idx){
  const p = presupuestosData[idx];
  if(!p) return;
  const fecha = p.fecha ? fmtDate(p.fecha) : fmtDate(D.TODAY_ISO);
  const vto = p.vencimiento ? fmtDate(p.vencimiento) : '';
  abrirDocumento({
    tipo: 'Presupuesto',
    titulo: p.cliente || '',
    numero: p.id ? 'N° ' + String(p.id).slice(-6) : '',
    meta: `Fecha: ${fecha}${vto ? ' · Válido hasta ' + vto : ''}`,
    cuerpo: `${p.concepto ? `<div class="box"><div class="box-label">Detalle</div><div class="box-text">${esc(p.concepto)}</div></div>` : ''}
      <div class="total-row"><div class="total-label">Total</div><div class="total-val">${fmtPesos(parseMoney(p.monto || 0))}</div></div>
      ${vto ? `<div class="muted">Presupuesto válido hasta el ${vto}.</div>` : ''}
      ${p.notas ? `<div class="notas">${esc(p.notas)}</div>` : ''}`,
    archivo: 'Presupuesto - ' + (p.cliente || MARCA.nombre),
    waURL: presupuestoWaURL(p),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// COTIZADOR DE PRESUPUESTO (armado) — dos secciones:
//  A) Arreglos de evento: se elige el arreglo (composición) y se muestra el
//     detalle de cantidades y el costo de cada ingrediente según último precio.
//  B) Ítems sueltos: líneas libres con cantidad (admite fracciones 1/2, 1/4),
//     producto y precio (unitario o por paquete).
// El total arma un presupuesto que va a la lista de Presupuestos.
// ══════════════════════════════════════════════════════════════════════════════
let cpArrRows = [];   // [{arreglo, qty}]
let cpFreeRows = [];  // [{cant, prod, precio}]  (cant como texto para admitir 1/2)

function cpParseCant(s){
  s = String(s==null?'':s).trim().replace(',', '.');
  if(!s) return 0;
  if(s.includes('/')){
    const [a,b] = s.split('/').map(x=>parseFloat(x.trim()));
    return (b && !isNaN(a) && !isNaN(b)) ? a/b : 0;
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
const _cpMoney = n => '$'+Math.round(n||0).toLocaleString('es-AR');

export function renderCotizarPresupuesto(){
  const f = document.getElementById('cp-fecha'); if(f && !f.value) f.value = D.TODAY_ISO;
  if(!cpArrRows.length) cpArrRows = [{arreglo:'', qty:1}];
  if(!cpFreeRows.length) cpFreeRows = [{cant:'1', prod:'', precio:''}];
  const dl = document.getElementById('cp-prod-list');
  if(dl){
    const prods = [...new Set([...(D.stockData||[]).map(s=>s.prod), ...Object.keys(cotizadorPrecios||{})])].filter(Boolean).sort((a,b)=>a.localeCompare(b,'es'));
    dl.innerHTML = prods.map(p=>`<option value="${esc(p)}">`).join('');
  }
  cpRenderArrRows();
  cpRenderFreeRows();
  cpRender();
}

function cpRenderArrRows(){
  const cont = document.getElementById('cp-arr-rows');
  if(!cont) return;
  const nombres = [...new Set((D.recetasData||[]).map(r=>r.nombre))];
  cont.innerHTML = cpArrRows.map((row,i)=>{
    const opts = nombres.map(n=>`<option value="${esc(n)}"${n===row.arreglo?' selected':''}>${D.arregloEmoji(n)} ${esc(n)}</option>`).join('');
    return `<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
      <select onchange="cpSetArr(${i},'arreglo',this.value)" style="flex:2;min-width:170px;border:1px solid var(--light-gray);border-radius:6px;padding:7px 9px;font-size:13px">
        <option value="">— Arreglo de evento —</option>${opts}
      </select>
      <span style="color:var(--mid-gray)">×</span>
      <input type="number" min="1" value="${esc(row.qty)}" onchange="cpSetArr(${i},'qty',this.value)" style="width:64px;border:1px solid var(--light-gray);border-radius:6px;padding:7px;text-align:center;font-size:13px">
      <button class="btn-icon" style="color:var(--red-alert)" onclick="cpRemoveArr(${i})" title="Quitar">✕</button>
    </div>`;
  }).join('');
}

function _ddmm(f){ if(!f) return ''; const p=String(f).split('-'); return (p[2]&&p[1])?`${p[2]}/${p[1]}`:f; }

// Última compra válida (no anulada, con costo) de un producto de Florería.
function _cpUltimaCompra(prod){
  let best = null;
  (D.comprasFlore||[]).forEach(c=>{
    if(c.anulado || !mismoArticulo(c.prod, prod)) return;
    if(!(parseMoney(c.costo)>0)) return;
    if(!best || (c.fecha||'') >= (best.fecha||'')) best = c;
  });
  return best;
}

// Costo actual de una vara de un producto (Armar cotización y Costo de varas):
// último costo de compra por paquete ÷ varas por paquete. Las varas por paquete
// son las de esa compra o, si no las tiene, las últimas cargadas (mayores a 1)
// en compras anteriores del mismo producto. Si no hay un dato de varas por
// paquete confiable, se usa el precio por vara guardado en el cotizador.
function cpCostoVara(prod){
  const c = prod ? _cpUltimaCompra(prod) : null;
  const ref = c ? { precio: parseMoney(c.costo), fecha: c.fecha||'' } : null;
  let vpp = c ? (parseFloat(c.varasPorPaq) || 0) : 0;
  if(c && !(vpp > 1)){
    let f = '';
    (D.comprasFlore||[]).forEach(x=>{
      const v = parseFloat(x.varasPorPaq) || 0;
      if(x.anulado || v <= 1 || !mismoArticulo(x.prod, prod)) return;
      if((x.fecha||'') >= f){ f = x.fecha||''; vpp = v; }
    });
  }
  const guardado = prod ? costoGuardado(cotizadorPrecios, prod) : 0;
  const costoVara = (ref && vpp > 1) ? ref.precio / vpp : (guardado || (ref ? ref.precio / (vpp || 1) : 0));
  return { ref, vpp: vpp || null, costoVara };
}

function cpRenderFreeRows(){
  const cont = document.getElementById('cp-free-rows');
  if(!cont) return;
  cont.innerHTML = cpFreeRows.map((row,i)=>{
    // Referencia de costo de material: último precio de compra (por paquete)
    // con su fecha y, si se conoce cuántas varas trae el paquete, también el
    // costo por vara (precio por paquete ÷ varas por paquete).
    const { ref, costoVara } = cpCostoVara(row.prod);
    const refLabel = ref
      ? `costo ${_cpMoney(ref.precio)}/paq${ref.fecha?' · '+_ddmm(ref.fecha):''}${costoVara>0?' · '+_cpMoney(Math.round(costoVara))+'/vara':''}`
      : (row.prod ? '<span style="color:var(--mid-gray)">sin costo cargado</span>' : '');
    return `
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
      <input value="${esc(row.cant)}" onchange="cpSetFree(${i},'cant',this.value)" placeholder="1, 1/2, 1/4" title="Cantidad — admite fracciones como 1/2 o 1/4" style="width:78px;border:1px solid var(--light-gray);border-radius:6px;padding:7px;text-align:center;font-size:13px">
      <input value="${esc(row.prod)}" list="cp-prod-list" onchange="cpSetFree(${i},'prod',this.value)" placeholder="Producto (ej. hortensias, paq fresias)" style="flex:2;min-width:150px;border:1px solid var(--light-gray);border-radius:6px;padding:7px 9px;font-size:13px">
      <span style="color:var(--mid-gray)">$</span>
      <input type="number" min="0" value="${esc(row.precio)}" onchange="cpSetFree(${i},'precio',this.value)" placeholder="Precio" title="Precio por unidad o por paquete" style="width:100px;border:1px solid var(--light-gray);border-radius:6px;padding:7px;text-align:right;font-size:13px">
      <span style="font-size:12px;color:var(--sage-dark);white-space:nowrap;min-width:200px" title="Último costo de compra de este material: por paquete, su fecha y el costo por vara">${refLabel}</span>
      <button class="btn-icon" style="color:var(--red-alert)" onclick="cpRemoveFree(${i})" title="Quitar">✕</button>
    </div>`;
  }).join('');
}

export function cpSetArr(i,fld,v){ if(cpArrRows[i]) cpArrRows[i][fld] = fld==='qty'?(+v||0):v; cpRender(); }
export function cpAddArr(){ cpArrRows.push({arreglo:'',qty:1}); cpRenderArrRows(); cpRender(); }
export function cpRemoveArr(i){ cpArrRows.splice(i,1); if(!cpArrRows.length) cpArrRows=[{arreglo:'',qty:1}]; cpRenderArrRows(); cpRender(); }
export function cpSetFree(i,fld,v){
  const row = cpFreeRows[i];
  if(!row) return;
  row[fld] = v;
  if(fld==='precio'){ row._precioSugerido = false; row._precioSugFecha = ''; } // si lo tocan a mano, deja de ser sugerido
  // Al elegir el producto, sugerir el último costo de compra (con su fecha) si el precio está vacío
  if(fld==='prod'){
    const precioActual = parseFloat(row.precio);
    if(v && (!row.precio || row._precioSugerido || isNaN(precioActual) || precioActual===0)){
      const sug = getUltimoPrecioCompra(v);
      if(sug){ row.precio = sug.precio; row._precioSugerido = true; row._precioSugFecha = sug.fecha; }
      else if(row._precioSugerido){ row.precio = ''; row._precioSugerido = false; row._precioSugFecha = ''; }
      cpRenderFreeRows();
    }
  }
  cpRender();
}
export function cpAddFree(){ cpFreeRows.push({cant:'1',prod:'',precio:''}); cpRenderFreeRows(); cpRender(); }
export function cpRemoveFree(i){ cpFreeRows.splice(i,1); if(!cpFreeRows.length) cpFreeRows=[{cant:'1',prod:'',precio:''}]; cpRenderFreeRows(); cpRender(); }

function cpRender(){
  // ── Sección A: arreglos + composición (costo según último precio por vara) ──
  const arrOut = document.getElementById('cp-arr-detalle');
  let totalArr = 0;
  const arrValid = cpArrRows.filter(r=>r.arreglo && r.qty>0);
  if(arrOut){
    arrOut.innerHTML = !arrValid.length ? '' : arrValid.map(row=>{
      const receta = (D.recetasData||[]).find(r=>r.nombre===row.arreglo);
      if(!receta) return '';
      const ings = (receta.ings||[]).map(ing=>{
        const info = resolveCotizadorPrecio(ing.prod);
        const pu = info.pu;
        const varas = (+ing.qty||0) * row.qty;
        // Si el precio salió de una de las opciones (no del nombre completo),
        // guardamos cuál para mostrarlo como estimación.
        const opcion = (info.fuente && info.fuente !== ing.prod) ? info.fuente : '';
        return { prod: ing.prod, varas, pu, costo: varas*pu, opcion };
      });
      const costoArr = ings.reduce((s,x)=>s+x.costo,0);
      totalArr += costoArr;
      const faltan = ings.filter(x=>!x.pu).map(x=>x.prod);
      return `<div style="border:1px solid var(--light-gray);border-radius:10px;padding:12px 14px;margin-bottom:10px;background:var(--warm-white)">
        <div style="display:flex;justify-content:space-between;font-weight:600;margin-bottom:8px">
          <span>${D.arregloEmoji(row.arreglo)} ${esc(row.arreglo)} × ${row.qty}</span>
          <span>${_cpMoney(costoArr)}</span>
        </div>
        <table style="width:100%;font-size:12px;border-collapse:collapse">
          <thead><tr style="color:var(--mid-gray);font-size:12px;text-transform:uppercase">
            <th style="text-align:left;padding:2px 4px">Ingrediente</th><th style="text-align:center">Varas</th><th style="text-align:right">Precio/vara</th><th style="text-align:right">Costo</th>
          </tr></thead>
          <tbody>${ings.map(x=>`<tr style="border-top:1px solid var(--surface-2)">
            <td style="padding:3px 4px">${esc(x.prod)}</td>
            <td style="text-align:center">${x.varas%1===0?x.varas:x.varas.toFixed(1)}</td>
            <td style="text-align:right;color:${x.pu?'inherit':'var(--red-alert)'}"${x.opcion?` title="Precio estimado — tomado de la opción con dato: ${esc(x.opcion)}"`:''}>${x.pu?(x.opcion?'≈ ':'')+_cpMoney(x.pu):'sin dato'}</td>
            <td style="text-align:right;font-weight:600">${x.costo?_cpMoney(x.costo):'—'}</td>
          </tr>`).join('')}</tbody>
        </table>
        ${faltan.length?`<div style="font-size:12px;color:var(--red-alert);margin-top:6px">Sin último precio cargado: ${faltan.map(esc).join(', ')}</div>`:''}
      </div>`;
    }).join('');
  }
  // ── Sección B: ítems sueltos ──
  const freeOut = document.getElementById('cp-free-detalle');
  let totalFree = 0;
  const freeValid = cpFreeRows.filter(r=>r.prod && cpParseCant(r.cant)>0);
  freeValid.forEach(r=>{ totalFree += cpParseCant(r.cant) * (parseFloat(r.precio)||0); });
  if(freeOut){
    freeOut.innerHTML = !freeValid.length ? '' : `<table style="width:100%;font-size:12.5px;border-collapse:collapse">
        <thead><tr style="color:var(--mid-gray);font-size:12px;text-transform:uppercase">
          <th style="text-align:left;padding:3px 6px">Cant.</th><th style="text-align:left">Producto</th><th style="text-align:right">Precio</th><th style="text-align:right">Subtotal</th>
        </tr></thead>
        <tbody>${freeValid.map(r=>{ const c=cpParseCant(r.cant); const p=parseFloat(r.precio)||0; return `<tr style="border-top:1px solid var(--surface-2)">
          <td style="padding:3px 6px">${esc(r.cant)}</td><td>${esc(r.prod)}</td><td style="text-align:right">${_cpMoney(p)}</td><td style="text-align:right;font-weight:600">${_cpMoney(c*p)}</td>
        </tr>`; }).join('')}</tbody>
      </table>`;
  }
  const total = totalArr + totalFree;
  const totEl = document.getElementById('cp-totales');
  if(totEl){
    totEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px"><span>Costo arreglos de evento</span><strong>${_cpMoney(totalArr)}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px"><span>Ítems sueltos</span><strong>${_cpMoney(totalFree)}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:10px 0 0;margin-top:6px;border-top:2px solid var(--charcoal);font-size:17px"><span style="font-weight:700">Total</span><strong>${_cpMoney(total)}</strong></div>`;
  }
  window._cpTotal = total; window._cpTotalArr = totalArr; window._cpTotalFree = totalFree;
}

export function cpReset(){
  cpArrRows = [{arreglo:'',qty:1}];
  cpFreeRows = [{cant:'1',prod:'',precio:''}];
  ['cp-evento','cp-encargado','cp-cliente','cp-telefono','cp-vencimiento'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  const f=document.getElementById('cp-fecha'); if(f) f.value=D.TODAY_ISO;
  renderCotizarPresupuesto();
}

export function cpGuardar(){
  cpRender();
  const evento = document.getElementById('cp-evento').value.trim();
  const encargado = document.getElementById('cp-encargado').value.trim();
  const cliente = document.getElementById('cp-cliente').value.trim() || evento;
  if(!cliente){ showToast('Poné el evento o el cliente','error'); return; }
  const total = window._cpTotal||0;
  if(total<=0){ showToast('Agregá arreglos o ítems con precio','error'); return; }

  const arrValid = cpArrRows.filter(r=>r.arreglo && r.qty>0);
  const freeValid = cpFreeRows.filter(r=>r.prod && cpParseCant(r.cant)>0);

  // Detalle multilínea (va en notas → se ve en el documento / WhatsApp)
  const det = [];
  if(evento) det.push(`Evento: ${evento}`);
  if(encargado) det.push(`Encargado: ${encargado}`);
  if(arrValid.length){
    det.push('', 'Arreglos:');
    arrValid.forEach(row=>{
      const receta = (D.recetasData||[]).find(r=>r.nombre===row.arreglo);
      const costo = receta ? calcCostoComposicion(receta)*row.qty : 0;
      det.push(`• ${row.qty}× ${row.arreglo} — ${_cpMoney(costo)}`);
      if(receta) (receta.ings||[]).forEach(ing=>{ det.push(`   – ${(+ing.qty||0)*row.qty} ${ing.prod}`); });
    });
  }
  if(freeValid.length){
    det.push('', 'Ítems:');
    freeValid.forEach(r=>{ const c=cpParseCant(r.cant); const p=parseFloat(r.precio)||0; det.push(`• ${r.cant} ${r.prod} — ${_cpMoney(c*p)}`); });
  }

  const concepto = evento
    ? `Evento: ${evento}${encargado?' · Enc.: '+encargado:''}`
    : `Cotización · ${arrValid.length} arreglo${arrValid.length!==1?'s':''} · ${freeValid.length} ítem${freeValid.length!==1?'s':''}`;

  presupuestosData.push({
    id: Date.now(),
    fecha: document.getElementById('cp-fecha').value || D.TODAY_ISO,
    cliente, evento, encargado,
    telefono: document.getElementById('cp-telefono').value.trim(),
    concepto,
    monto: total,
    vencimiento: document.getElementById('cp-vencimiento').value,
    notas: det.join('\n'),
    estado: 'pendiente',
    arreglos: arrValid,
    items: freeValid,
    costoArreglos: window._cpTotalArr||0,
    totalItems: window._cpTotalFree||0
  });
  D.fbSave('presupuestosData', presupuestosData);
  cpArrRows = []; cpFreeRows = [];
  showToast('Presupuesto armado y guardado');
  D.navigate('presupuestos');
}

// ══════════════════════════════════════════════════════════════════════════════
// COSTO DE VARAS — calculadora rápida: listado de flores con cantidades y costo
// actual de cada una + total. Solo calcula (no guarda nada). Usa cpCostoVara(),
// la misma lógica de costos que la carga flor por flor de "Armar cotización".
// ══════════════════════════════════════════════════════════════════════════════
let cvRows = [];   // [{cant, prod}]  (cant como texto para admitir 1/2)

function cvProductos(){
  return _sinRepetidos([...(D.stockData||[]).map(s=>s.prod), ...Object.keys(cotizadorPrecios||{}), ...(D.comprasFlore||[]).map(c=>c.prod)]);
}
// Una sola forma por artículo (la primera que aparece: stock, costos, compras).
function _sinRepetidos(nombres){
  const vistos = new Set();
  return nombres.filter(n => {
    if(!n || !String(n).trim()) return false;
    const k = claveArticulo(n);
    if(vistos.has(k)) return false;
    vistos.add(k); return true;
  }).sort((a,b)=>a.localeCompare(b,'es'));
}

// Empareja lo escrito con un producto conocido: exacto (sin mayúsculas/tildes) y,
// si no, el único producto que lo contenga. Si no encuentra, deja el texto igual.
function cvResolverProd(txt){
  const norm = x => String(x||'').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const t = norm(txt);
  if(!t) return '';
  const prods = cvProductos();
  const exacto = prods.find(p=>claveArticulo(p)===claveArticulo(txt));
  if(exacto) return exacto;
  const parecidos = prods.filter(p=>norm(p).includes(t));
  if(parecidos.length===1) return parecidos[0];
  // Abreviaturas ("Rosa Importa" → "Rosas importadas"): cada palabra escrita es
  // el comienzo de alguna palabra del producto; vale solo si hay uno.
  const toks = t.split(/\s+/).filter(Boolean);
  const porPalabras = prods.filter(p=>{ const pt = norm(p).split(/\s+/); return toks.every(w=>pt.some(x=>x.startsWith(w))); });
  return porPalabras.length===1 ? porPalabras[0] : String(txt).trim();
}

function cvParseLinea(linea){
  const l = linea.trim();
  if(!l) return null;
  let m = l.match(/^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s*(?:x|varas?\s+de|de)?\s+(.+)$/i);   // "20 rosas", "20 x rosas"
  if(m) return { cant:m[1].replace(/\s/g,''), prod:cvResolverProd(m[2]) };
  m = l.match(/^(.+?)\s*(?:x|:|-|\t)?\s*(\d+(?:[.,]\d+)?)$/i);                               // "rosas 20", "rosas x20"
  if(m) return { cant:m[2], prod:cvResolverProd(m[1]) };
  return { cant:'1', prod:cvResolverProd(l) };
}

export function renderCostoVaras(){
  if(!cvRows.length) cvRows = [{cant:'1', prod:''}];
  cvTRender();
  const dl = document.getElementById('cv-prod-list');
  if(dl) dl.innerHTML = cvProductos().map(p=>`<option value="${esc(p)}">`).join('');
  cvRender();
}

// Productos cuya última compra no tiene varas por paquete cargadas (o dice 1):
// ahí el costo por vara sale igual al del paquete entero. Se corrigen desde acá.
function cvSospechosos(){
  const vistos = {};
  (D.comprasFlore||[]).forEach(c=>{ if(c.prod) vistos[String(c.prod).trim().toLowerCase()] = c.prod; });
  return Object.values(vistos)
    .map(prod => ({ prod, c:_cpUltimaCompra(prod) }))
    .filter(o => o.c && !((cpCostoVara(o.prod).vpp||0) > 1))
    .map(o => o.c)
    .sort((x,y)=>String(x.prod).localeCompare(String(y.prod),'es'));
}

// Carga las varas por paquete en la última compra del producto y recalcula su
// costo por vara en el cotizador (mismo recálculo que el historial de compras).
export function cvFijarVarasPorPaq(prod, val){
  const v = parseFloat(String(val).replace(',','.'));
  if(!(v>0)) return;
  const ult = _cpUltimaCompra(prod);
  if(!ult) return;
  ult.varasPorPaq = v;
  const paqRec = parseFloat(ult.paqRecibidos)||0;
  if(paqRec>0) ult.totalVaras = paqRec * v;
  recalcCotizadorPrecio(ult);
  window._comprasFloreLastSave = Date.now(); D.fbSave('comprasFlore', D.comprasFlore);
  showToast('Varas por paquete guardadas: '+prod);
  cvRender();
}

function cvRender(){
  const cont = document.getElementById('cv-rows');
  if(!cont) return;
  const rev = document.getElementById('cv-revisar');
  if(rev){
    const sosp = cvSospechosos();
    rev.style.display = sosp.length ? '' : 'none';
    rev.innerHTML = !sosp.length ? '' : `<div style="font-size:13px;font-weight:600;margin-bottom:4px">Revisar varas por paquete (${sosp.length})</div>
      <div style="font-size:12px;color:var(--mid-gray);margin-bottom:10px">A estas flores no les cargaron cuántas varas trae el paquete, así que el costo por vara sale igual al del paquete. Poné las varas por paquete y se corrige el costo.</div>
      ${sosp.map(c=>`<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap">
        <div style="flex:2;min-width:140px;font-size:13px">${esc(c.prod)}<span style="color:var(--mid-gray);font-size:12px"> · paquete ${_cpMoney(parseMoney(c.costo))}${c.fecha?' · '+_ddmm(c.fecha):''}</span></div>
        <input type="number" min="1" placeholder="varas/paq" value="${(parseFloat(c.varasPorPaq)||0)>0?esc(c.varasPorPaq):''}" onchange="cvFijarVarasPorPaq(${JSON.stringify(c.prod).replace(/"/g,'&quot;')},this.value)" style="width:90px;border:1px solid var(--light-gray);border-radius:6px;padding:7px;text-align:center;font-size:13px">
      </div>`).join('')}`;
  }
  let total = 0, sinCosto = 0, varasTot = 0;
  cont.innerHTML = cvRows.map((row,i)=>{
    const cant = cpParseCant(row.cant);
    const { ref, vpp, costoVara } = cpCostoVara(row.prod);
    const sub = cant * costoVara;
    if(row.prod && cant>0){
      varasTot += cant;
      if(costoVara>0) total += sub; else sinCosto++;
    }
    const costoTxt = !row.prod ? ''
      : costoVara>0 ? `<strong>${_cpMoney(costoVara)}</strong><span style="color:var(--mid-gray)"> /vara</span>${ref&&ref.fecha?`<div style="font-size:12px;color:var(--mid-gray)">costo del ${_ddmm(ref.fecha)}</div>`:''}${ref&&!(vpp>1)?'<div style="font-size:12px;color:var(--red-alert)">revisar varas por paquete ↓</div>':''}`
      : '<span style="color:var(--red-alert);font-size:12px">sin costo cargado</span>';
    return `<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
      <input value="${esc(row.cant)}" inputmode="decimal" onchange="cvSet(${i},'cant',this.value)" title="Cantidad de varas — admite 1/2, 1/4" style="width:70px;border:1px solid var(--light-gray);border-radius:6px;padding:8px;text-align:center;font-size:14px">
      <input value="${esc(row.prod)}" list="cv-prod-list" onchange="cvSet(${i},'prod',this.value)" placeholder="Flor (ej. rosas, hortensias)" style="flex:2;min-width:140px;border:1px solid var(--light-gray);border-radius:6px;padding:8px 10px;font-size:14px">
      <div style="min-width:130px;text-align:right;font-size:13px">${costoTxt}</div>
      <div style="min-width:90px;text-align:right;font-size:14px;font-weight:700">${costoVara>0&&cant>0?_cpMoney(sub):'—'}</div>
      <button class="btn-icon" style="color:var(--red-alert)" onclick="cvRemove(${i})" title="Quitar">✕</button>
    </div>`;
  }).join('');
  const tot = document.getElementById('cv-total');
  if(tot) tot.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;font-size:20px"><span style="font-weight:700">Total</span><strong>${_cpMoney(total)}</strong></div>
    <div style="font-size:12px;color:var(--mid-gray);margin-top:4px">${varasTot%1===0?varasTot:varasTot.toFixed(1)} varas en total${sinCosto?` · <span style="color:var(--red-alert)">${sinCosto} sin costo cargado (no suman al total)</span>`:''}</div>`;
}

export function cvSet(i,fld,v){
  const row = cvRows[i]; if(!row) return;
  row[fld] = fld==='prod' ? cvResolverProd(v) : v;
  // Al completar la última fila, se abre otra vacía para seguir cargando
  if(i===cvRows.length-1 && row.prod) cvRows.push({cant:'1', prod:''});
  cvRender();
}
export function cvAdd(){ cvRows.push({cant:'1', prod:''}); cvRender(); }
export function cvRemove(i){ cvRows.splice(i,1); if(!cvRows.length) cvRows=[{cant:'1',prod:''}]; cvRender(); }
export function cvReset(){ cvRows=[{cant:'1',prod:''}]; const t=document.getElementById('cv-pegar'); if(t) t.value=''; cvRender(); }

export function cvCargarListado(){
  const ta = document.getElementById('cv-pegar');
  const nuevas = (ta?.value||'').split(/\n|;/).map(cvParseLinea).filter(Boolean);
  if(!nuevas.length){ showToast('Pegá primero el listado'); return; }
  cvRows = cvRows.filter(r=>r.prod).concat(nuevas, [{cant:'1', prod:''}]);
  if(ta) ta.value = '';
  cvRender();
}

export function cvCopiar(){
  const filas = cvRows.filter(r=>r.prod && cpParseCant(r.cant)>0).map(r=>{
    const c = cpParseCant(r.cant), { costoVara } = cpCostoVara(r.prod);
    return `${r.cant} ${r.prod}` + (costoVara>0 ? ` — ${_cpMoney(costoVara)}/vara = ${_cpMoney(c*costoVara)}` : ' — sin costo');
  });
  if(!filas.length) return;
  const total = cvRows.reduce((s,r)=>s+cpParseCant(r.cant)*cpCostoVara(r.prod).costoVara, 0);
  navigator.clipboard.writeText(`Costo de varas\n${filas.join('\n')}\nTotal: ${_cpMoney(total)}`).then(()=>showToast('Costos copiados'));
}

// ── Tabla por tamaños (flores en filas, tamaños en columnas) ──────────────────
// Se pega la tabla copiada de Excel y se muestra el costo de cada tamaño.
let cvTabla = null;   // { cols:[nombres], rows:[{prod, cants:[texto por columna]}] }

function cvParseTabla(txt){
  const lineas = String(txt||'').split(/\r?\n/).filter(l=>l.trim());
  if(!lineas.length) return null;
  const partir = l => (l.includes('\t') ? l.split('\t') : l.split(/;|\s{2,}/)).map(c=>c.trim());
  const filas = lineas.map(partir);
  const esNum = c => c!=='' && cpParseCant(c)>0;
  const hayNums = f => f.slice(1).some(esNum);
  let cols;
  if(!hayNums(filas[0])){ cols = filas.shift().slice(1).filter((c,i,a)=>c!==''||i<a.length-1); }
  const n = Math.max(...filas.map(f=>f.length-1), 0);
  if(!cols || !cols.length) cols = Array.from({length:n}, (_,i)=>'Columna '+(i+1));
  const rows = filas.map(f=>({ prod:cvResolverProd(f[0]), cants: cols.map((_,i)=>f[i+1]||'') }))
    .filter(r=>r.prod && r.cants.some(esNum));
  return rows.length ? { cols, rows } : null;
}

export function cvTCargar(){
  const ta = document.getElementById('cv-tabla-txt');
  const t = cvParseTabla(ta?.value);
  if(!t){ showToast('No pude leer la tabla. Copiala desde Excel con los títulos de las columnas'); return; }
  cvTabla = t;
  cvTRender();
}
export function cvTSetProd(i, v){ if(cvTabla && cvTabla.rows[i]){ cvTabla.rows[i].prod = cvResolverProd(v); cvTRender(); } }
export function cvTLimpiar(){ cvTabla = null; const ta=document.getElementById('cv-tabla-txt'); if(ta) ta.value=''; cvTRender(); }

function cvTRender(){
  const out = document.getElementById('cv-tabla-out');
  if(!out) return;
  if(!cvTabla){ out.innerHTML = ''; return; }
  const { cols, rows } = cvTabla;
  const tot = cols.map(()=>0);
  let sinCosto = 0;
  const filas = rows.map((r,i)=>{
    const { costoVara } = cpCostoVara(r.prod);
    if(!(costoVara>0)) sinCosto++;
    const celdas = cols.map((_,c)=>{
      const cant = cpParseCant(r.cants[c]);
      if(!(cant>0)) return '<td style="text-align:right;padding:4px 8px;color:var(--mid-gray)">—</td>';
      if(!(costoVara>0)) return `<td style="text-align:right;padding:4px 8px"><span style="color:var(--mid-gray);font-size:12px">${esc(r.cants[c])} ×</span> —</td>`;
      tot[c] += cant*costoVara;
      return `<td style="text-align:right;padding:4px 8px"><span style="color:var(--mid-gray);font-size:12px">${esc(r.cants[c])} ×</span> ${_cpMoney(cant*costoVara)}</td>`;
    }).join('');
    return `<tr style="border-top:1px solid var(--surface-2)">
      <td style="padding:4px 8px;min-width:150px"><input value="${esc(r.prod)}" list="cv-prod-list" onchange="cvTSetProd(${i},this.value)" style="width:100%;border:1px solid ${costoVara>0?'var(--light-gray)':'var(--red-alert)'};border-radius:6px;padding:5px 7px;font-size:12.5px"></td>
      <td style="text-align:right;padding:4px 8px;white-space:nowrap;font-size:12px">${costoVara>0?_cpMoney(costoVara)+'/vara':'<span style="color:var(--red-alert)">sin costo</span>'}</td>${celdas}</tr>`;
  }).join('');
  out.innerHTML = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr style="color:var(--mid-gray);font-size:12px;text-transform:uppercase"><th style="text-align:left;padding:4px 8px">Flor</th><th style="text-align:right;padding:4px 8px">Costo vara</th>${cols.map(c=>`<th style="text-align:right;padding:4px 8px">${esc(c)}</th>`).join('')}</tr></thead>
    <tbody>${filas}</tbody>
    <tfoot><tr style="border-top:2px solid var(--charcoal);font-weight:700;font-size:15px"><td style="padding:8px" colspan="2">Costo total</td>${tot.map(t=>`<td style="text-align:right;padding:8px">${_cpMoney(t)}</td>`).join('')}</tr></tfoot>
  </table></div>
  ${sinCosto?`<div style="font-size:12px;color:var(--red-alert);margin-top:8px">${sinCosto} flor${sinCosto>1?'es':''} sin costo cargado (en rojo): elegí el nombre correcto de la lista y no suman al total.</div>`:''}
  <button class="btn-secondary" onclick="cvTLimpiar()" style="font-size:12px;margin-top:10px">✕ Limpiar tabla</button>`;
}