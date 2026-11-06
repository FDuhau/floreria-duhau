// ── CAJA Y CIERRES DE CAJA ──────────────────────────────────────────────────
// Movimientos de caja, historial por mes, resguardo automático (cajaSafe),
// restaurar desde archivo/resguardo y cierre de caja diario.
// Separado de app.js; lo que necesita de app.js llega por configurarCaja().

import { esc, fmtDate } from './utils.js';
import { showToast } from './tema-toast.js';
import { confirmModal } from './modales.js';
import { validarCampos } from './validacion.js';
import { abrirDocumento, fmtPesos, kv } from './documento-marca.js';
import { cajaSigned, saldosCaja } from './dinero.js';

const D = {};
let TODAY_ISO = '';
export function configurarCaja(deps){ Object.assign(D, deps); TODAY_ISO = deps.TODAY_ISO; }
const fbSave = (...a) => D.fbSave(...a);
const closeModal = (...a) => D.closeModal(...a);
const getSucursalId = () => D.getSucursalId();
const sensibleCargado = key => D.sensibleCargado(key);

// ════════════════════════════════════════
// DATA — CAJA
// ════════════════════════════════════════
export let cajaData=[];
window._setCajaData = (arr) => { cajaData.splice(0, cajaData.length, ...arr); };

const CAJA_MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function _cajaMesLabel(m){ return m==='sin-fecha' ? 'Sin fecha' : `${CAJA_MESES[+m.slice(5,7)-1]} ${m.slice(0,4)}`; }

// Una fila editable de caja (se reusa en el mes actual y en el historial).
function cajaRowHTML(r, i, running){
  const sc = running>=0 ? 'saldo-pos' : 'saldo-neg';
  const rowClass = r.tipo==='ingreso' ? 'ingreso-row' : 'egreso-row';
  return `<tr class="${rowClass}">
    <td data-label="Fecha"><input class="form-input" type="date" value="${r.fecha||''}" onchange="updCaja(${i},'fecha',this.value)" style="min-width:120px;padding:5px 7px;font-size:12px"></td>
    <td data-label="Descripción"><input class="form-input" value="${esc(r.desc)}" onchange="updCaja(${i},'desc',this.value)" style="min-width:180px;padding:5px 7px;font-size:12px"></td>
    <td data-label="Ticket #"><input class="form-input" value="${esc(r.ticket||'')}" onchange="updCaja(${i},'ticket',this.value)" placeholder="—" style="width:75px;padding:5px 7px;font-size:12px"></td>
    <td data-label="Tipo">
      <select class="form-select" onchange="updCajaTipo(${i},this.value)" style="font-size:12px;font-weight:600;padding:4px 6px;${r.tipo==='ingreso'?'background:var(--ok-soft);color:var(--green-ok)':'background:#FBE8E8;color:var(--red-alert)'}">
        <option value="ingreso" ${r.tipo==='ingreso'?'selected':''}>Ingreso</option>
        <option value="egreso"  ${r.tipo==='egreso' ?'selected':''}>Egreso</option>
      </select>
    </td>
    <td data-label="Monto"><input class="form-input" type="number" value="${r.monto}" min="0" onchange="updCajaMonto(${i},+this.value)" style="width:110px;padding:5px 7px;font-size:13px;font-weight:600;color:${r.tipo==='ingreso'?'var(--green-ok)':'var(--red-alert)'}"></td>
    <td data-label="Saldo"><span class="${sc}">$${running.toLocaleString('es-AR')}</span></td>
    <td class="caja-row-acciones"><button class="btn-icon" style="color:var(--red-alert)" onclick="delCaja(${i})">✕</button></td>
  </tr>`;
}

export function renderCaja(){
  const cierreFechaEl = document.getElementById('cierre-fecha');
  if(cierreFechaEl && !cierreFechaEl.value) cierreFechaEl.value = TODAY_ISO;
  renderCierreCajaHistorial();

  const curMonth = TODAY_ISO.slice(0,7);
  const mesDe = r => (r.fecha||curMonth).slice(0,7); // sin fecha → se cuenta en el mes actual

  // Orden cronológico + saldo acumulado global por movimiento (igual en mes actual e historial)
  const { orden, runByIdx } = saldosCaja(cajaData);
  const delMes  = orden.filter(({r})=> mesDe(r)===curMonth);
  const older   = orden.filter(({r})=> mesDe(r)!==curMonth);

  // ── Tabla del mes actual ──
  const tbody=document.getElementById('caja-body');
  let inMes=0, egMes=0;
  tbody.innerHTML = delMes.length
    ? delMes.map(({r,i})=>{ if(r.tipo==='ingreso')inMes+=r.monto; else egMes+=r.monto; return cajaRowHTML(r,i,runByIdx[i]); }).join('')
    : `<tr><td colspan="7" style="padding:22px;text-align:center;color:var(--mid-gray)">Sin movimientos este mes todavía. Agregá el primero con "+ Nuevo Movimiento".</td></tr>`;

  const tit = document.getElementById('caja-mes-titulo');
  if(tit) tit.textContent = `Movimientos de ${_cajaMesLabel(curMonth)}`;

  const arrastre  = older.reduce((s,{r})=> s+cajaSigned(r), 0);
  const saldoFinal = arrastre + inMes - egMes;

  // ── Resumen (enfocado en el mes) ──
  const sumEl=document.getElementById('caja-summary');
  sumEl.innerHTML=`
    <div class="card"><div class="card-label">Saldo anterior</div><div class="card-value ${arrastre>=0?'green':'red'}" style="font-size:22px">$${arrastre.toLocaleString('es-AR')}</div></div>
    <div class="card"><div class="card-label">Ingresos del mes</div><div class="card-value green" style="font-size:24px">$${inMes.toLocaleString('es-AR')}</div></div>
    <div class="card"><div class="card-label">Egresos del mes</div><div class="card-value red" style="font-size:24px">$${egMes.toLocaleString('es-AR')}</div></div>
    <div class="card"><div class="card-label">Saldo Actual</div><div class="card-value ${saldoFinal>=0?'green':'red'}" style="font-size:24px">$${saldoFinal.toLocaleString('es-AR')}</div></div>`;

  renderCajaHistorial(older, runByIdx);
}

let _cajaHistExpanded = false;
let _cajaMesesAbiertos = {};
export function toggleCajaHistorial(){
  _cajaHistExpanded = !_cajaHistExpanded;
  const cont = document.getElementById('caja-historial');
  const btn  = document.getElementById('caja-historial-toggle');
  if(cont) cont.style.display = _cajaHistExpanded ? 'block' : 'none';
  if(btn)  btn.textContent = _cajaHistExpanded ? 'Ocultar historial de meses anteriores' : 'Ver historial de meses anteriores';
}
export function toggleCajaMes(mes){ _cajaMesesAbiertos[mes] = !_cajaMesesAbiertos[mes]; renderCaja(); }

function renderCajaHistorial(older, runByIdx){
  const wrap = document.getElementById('caja-historial-wrap');
  const cont = document.getElementById('caja-historial');
  if(!wrap || !cont) return;
  if(!older.length){ wrap.style.display='none'; cont.innerHTML=''; return; }
  wrap.style.display='block';
  cont.style.display = _cajaHistExpanded ? 'block' : 'none';
  const btn = document.getElementById('caja-historial-toggle');
  if(btn) btn.textContent = _cajaHistExpanded ? 'Ocultar historial de meses anteriores' : 'Ver historial de meses anteriores';

  // Agrupar por mes, más reciente primero
  const porMes = {};
  older.forEach(({r,i})=>{ const m=(r.fecha||'').slice(0,7)||'sin-fecha'; (porMes[m]=porMes[m]||[]).push({r,i}); });
  const meses = Object.keys(porMes).sort((a,b)=>b.localeCompare(a));

  cont.innerHTML = meses.map(m=>{
    const rows = porMes[m];
    let inM=0, egM=0;
    rows.forEach(({r})=>{ if(r.tipo==='ingreso')inM+=r.monto; else egM+=r.monto; });
    const neto = inM-egM;
    const abierto = !!_cajaMesesAbiertos[m];
    const bodyRows = rows.map(({r,i})=>cajaRowHTML(r,i,runByIdx[i])).join('');
    return `<div style="border:1px solid var(--light-gray);border-radius:8px;margin-bottom:10px;overflow:hidden">
      <div onclick="toggleCajaMes('${m}')" style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;background:var(--warm-white)">
        <span style="font-weight:600;font-size:13px">${abierto?'▼':'▶'} ${_cajaMesLabel(m)} · ${rows.length} mov.</span>
        <span style="font-size:12px;color:var(--mid-gray)">$${inM.toLocaleString('es-AR')} · $${egM.toLocaleString('es-AR')} · neto <strong style="color:${neto>=0?'var(--green-ok)':'var(--red-alert)'}">$${neto.toLocaleString('es-AR')}</strong></span>
      </div>
      ${abierto?`<div class="table-wrapper"><table class="caja-table"><thead><tr><th>Fecha</th><th>Descripción</th><th>Ticket #</th><th>Tipo</th><th>Monto</th><th>Saldo</th><th></th></tr></thead><tbody>${bodyRows}</tbody></table></div>`:''}
    </div>`;
  }).join('');
}
export function updCaja(i,field,val){ cajaData[i][field]=val; fbSave('cajaData',cajaData); renderCaja(); }
export function updCajaTipo(i,val){ cajaData[i].tipo=val; fbSave('cajaData',cajaData); renderCaja(); }
export function updCajaMonto(i,val){ cajaData[i].monto=isNaN(val)||val<0?0:val; fbSave('cajaData',cajaData); renderCaja(); }

export function openCajaModal(){
  document.getElementById('cj-fecha-caja').value=TODAY_ISO;
  ['cj-desc-caja','cj-ticket','cj-monto'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('cj-tipo').value='ingreso';
  document.getElementById('caja-modal').classList.add('open');
}
export function addCajaMovimiento(){
  const desc=document.getElementById('cj-desc-caja').value.trim();
  const monto=parseFloat(document.getElementById('cj-monto').value)||0;
  if(!validarCampos([
    { id:'cj-desc-caja', req:true, msg:'Escribí de qué es el movimiento' },
    { id:'cj-monto', req:true, tipo:'monto', msg:'Ingresá el monto' },
    { id:'cj-fecha-caja', tipo:'fecha' },
  ])) return;
  cajaData.push({
    fecha:document.getElementById('cj-fecha-caja').value||TODAY_ISO,
    desc, ticket:document.getElementById('cj-ticket').value,
    tipo:document.getElementById('cj-tipo').value, monto,
    sucursal: getSucursalId()
  });
  fbSave('cajaData', cajaData);
  closeModal('caja-modal');
  renderCaja();
}
// ── RESGUARDO AUTOMÁTICO DE CAJA ──────────────────────────────────────────────
// Cada movimiento que alguna vez estuvo en la caja se copia a `cajaSafe/<clave>`.
// Ese nodo solo SUMA: la app nunca borra ni pisa una entrada (y las reglas
// cerradas lo hacen de una sola escritura). Si la caja se vacía o se pisa por
// error, "Recuperar del resguardo" la rearma sin depender de un backup manual.
function _cajaClave(m){ return [m.fecha, (m.desc||'').trim(), m.tipo, +m.monto].join('|'); }
function _cajaSafeId(m){
  // Hash corto y estable (las claves de Firebase no admiten . $ # [ ] /)
  const str = _cajaClave(m) + '|' + (m.ticket||'');
  let h1 = 5381, h2 = 52711;
  for(let i = 0; i < str.length; i++){ const c = str.charCodeAt(i); h1 = Math.imul(h1, 33) ^ c; h2 = Math.imul(h2, 31) ^ c; }
  return String(m.fecha||'sinfecha').replace(/[.$#[\]/]/g, '-') + '_' + (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36);
}
let _cajaSafeIds = null, _cajaSafeCargando = false;
window._maybeSnapshotCajaSafe = async () => {
  if(window.userRole !== 'gerencia' || !sensibleCargado('cajaData') || !cajaData.length || !window.fbGetOnce || !window.fbUpdate) return;
  if(!_cajaSafeIds){
    if(_cajaSafeCargando) return;
    _cajaSafeCargando = true;
    try{ _cajaSafeIds = new Set(Object.keys(await window.fbGetOnce('cajaSafe') || {})); }
    catch(e){ return; }   // sin conexión: se reintenta en el próximo guardado
    finally{ _cajaSafeCargando = false; }
  }
  const nuevos = {};
  cajaData.forEach(m => {
    if(!m || !m.fecha || !(+m.monto > 0)) return;
    const id = _cajaSafeId(m);
    if(_cajaSafeIds.has(id) || nuevos[id]) return;
    const { fecha, desc, ticket, tipo, monto, sucursal, ventaAuto } = m;
    nuevos[id] = { fecha, desc: desc||'', ticket: ticket||'', tipo, monto: +monto, sucursal: sucursal||'', ...(ventaAuto ? { ventaAuto: true } : {}), resguardadoTs: Date.now() };
  });
  const ids = Object.keys(nuevos);
  if(!ids.length) return;
  try{ await window.fbUpdate('cajaSafe', nuevos); ids.forEach(id => _cajaSafeIds.add(id)); }
  catch(e){ console.warn('No se pudo actualizar el resguardo de caja', e); }
};

// Agrega a la caja solo los movimientos que faltan (misma fecha, descripción,
// tipo y monto), previa confirmación. Nunca borra ni modifica nada existente.
async function _restaurarCajaMovs(lista, fuente){
  const movs = (lista||[]).filter(m => m && m.fecha && (m.tipo === 'ingreso' || m.tipo === 'egreso') && +m.monto > 0);
  if(!movs.length){ showToast(`${fuente} no tiene movimientos de caja.`,'error'); return; }
  const existentes = new Set(cajaData.map(_cajaClave));
  const vistos = new Set();
  const nuevos = movs.filter(m => { const k = _cajaClave(m); if(existentes.has(k) || vistos.has(k)) return false; vistos.add(k); return true; })
    .sort((a,b) => (a.fecha||'').localeCompare(b.fecha||''));
  if(!nuevos.length){ showToast(`Todos los movimientos de ${fuente} ya están en la caja.`); return; }
  const ing = nuevos.filter(m=>m.tipo==='ingreso').reduce((a,m)=>a + +m.monto, 0);
  const egr = nuevos.filter(m=>m.tipo==='egreso').reduce((a,m)=>a + +m.monto, 0);
  const ok = await confirmModal(`Se van a agregar ${nuevos.length} movimiento${nuevos.length!==1?'s':''} a la caja desde ${fuente} (${movs.length} en total).\n\nIngresos: $${ing.toLocaleString('es-AR')}\nEgresos: $${egr.toLocaleString('es-AR')}\n\nNo se borra ni modifica ningún movimiento existente. ¿Continuar?`);
  if(!ok) return;
  nuevos.forEach(m => {
    const { fecha, desc, ticket, tipo, monto, sucursal, ventaAuto } = m;
    cajaData.push({ fecha, desc: desc||'', ticket: ticket||'', tipo, monto: +monto, sucursal: sucursal || getSucursalId(), ...(ventaAuto ? { ventaAuto: true } : {}), restaurado: true });
  });
  fbSave('cajaData', cajaData);
  renderCaja();
  showToast(`${nuevos.length} movimientos restaurados en la caja`);
}

// Restaurar movimientos de caja desde un archivo: acepta un backup completo
// de la app (usa su cajaData) o una lista de movimientos.
export function restaurarCajaArchivo(input){
  const file = input.files?.[0]; input.value = '';
  if(!file) return;
  if(window.userRole !== 'gerencia'){ showToast('Solo gerencia.','error'); return; }
  if(!sensibleCargado('cajaData')){ showToast('La caja todavía no terminó de cargar. Esperá unos segundos.','error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    let data;
    try{ data = JSON.parse(e.target.result); }
    catch(err){ showToast('No pude leer el archivo (JSON inválido).','error'); return; }
    const lista = Array.isArray(data) ? data : (Array.isArray(data?.cajaData) ? data.cajaData : Object.values(data?.cajaData || {}));
    _restaurarCajaMovs(lista, 'el archivo');
  };
  reader.readAsText(file);
}

// Recuperar desde el resguardo automático (cajaSafe)
export async function restaurarCajaDesdeResguardo(){
  if(window.userRole !== 'gerencia'){ showToast('Solo gerencia.','error'); return; }
  if(!sensibleCargado('cajaData')){ showToast('La caja todavía no terminó de cargar. Esperá unos segundos.','error'); return; }
  let safe;
  try{ showToast('Leyendo el resguardo automático…'); safe = await window.fbGetOnce('cajaSafe'); }
  catch(e){ showToast('Sin conexión: no se pudo leer el resguardo.','error'); return; }
  const lista = Object.values(safe || {});
  if(!lista.length){ showToast('Todavía no hay resguardo automático de la caja.'); return; }
  _restaurarCajaMovs(lista, 'el resguardo automático');
}

export async function delCaja(i){ if(!await confirmModal('¿Eliminar este movimiento?')) return; cajaData.splice(i,1); fbSave('cajaData',cajaData); renderCaja(); }

// ── CIERRE DE CAJA DIARIO ─────────────────────────────────────────────────────
export let cierresCajaData = [];
window._setCierresCaja = (arr) => { cierresCajaData = arr && typeof arr === 'object' ? (Array.isArray(arr) ? arr : Object.values(arr)) : []; renderCierreCajaHistorial(); };

function cierresCajaDelDia(fecha){
  return cajaData.filter(r => (r.fecha||'') === fecha);
}

export async function cerrarCajaDia(){
  const fecha = document.getElementById('cierre-fecha')?.value || TODAY_ISO;
  const movsDia = cierresCajaDelDia(fecha);
  if(!movsDia.length){ showToast('No hay movimientos para esa fecha'); return; }
  if(!await confirmModal(`¿Cerrar caja del ${fmtDate(fecha)}? Se archivará el resumen del día.`)) return;

  let totalIn = 0, totalEg = 0;
  movsDia.forEach(r => { if(r.tipo==='ingreso') totalIn+=r.monto; else totalEg+=r.monto; });

  const cierre = {
    fecha,
    totalIngresos: totalIn,
    totalEgresos: totalEg,
    saldo: totalIn - totalEg,
    movimientos: movsDia,
    cerradoPor: window.currentUserLabel || '—',
    ts: Date.now()
  };

  // Archivar en cierresCaja
  if(!Array.isArray(cierresCajaData)) cierresCajaData = [];
  // Reemplazar si ya existe cierre del mismo día
  const idx = cierresCajaData.findIndex(c => c.fecha === fecha);
  if(idx >= 0) cierresCajaData[idx] = cierre;
  else cierresCajaData.push(cierre);
  fbSave('cierresCaja', cierresCajaData);

  showToast(`Caja del ${fmtDate(fecha)} cerrada — Saldo: $${cierre.saldo.toLocaleString('es-AR')}`);
  renderCierreCajaHistorial();
}

export function renderCierreCajaHistorial(){
  const el = document.getElementById('cierre-caja-historial');
  if(!el) return;
  const sorted = [...cierresCajaData].sort((a,b) => b.fecha?.localeCompare(a.fecha||''));
  if(!sorted.length){ el.innerHTML = '<div style="color:var(--mid-gray);font-size:13px;padding:16px">Sin cierres registrados aún.</div>'; return; }
  el.innerHTML = `<div class="table-wrapper" style="border:none;box-shadow:none"><table class="cierre-dia-table" style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr style="background:var(--cream)">
      <th style="padding:8px 12px;text-align:left;font-size:12px;letter-spacing:1px;color:var(--mid-gray);text-transform:uppercase">Fecha</th>
      <th style="padding:8px 12px;text-align:right;font-size:12px;letter-spacing:1px;color:var(--mid-gray);text-transform:uppercase">Ingresos</th>
      <th style="padding:8px 12px;text-align:right;font-size:12px;letter-spacing:1px;color:var(--mid-gray);text-transform:uppercase">Egresos</th>
      <th style="padding:8px 12px;text-align:right;font-size:12px;letter-spacing:1px;color:var(--mid-gray);text-transform:uppercase">Saldo</th>
      <th style="padding:8px 12px;text-align:left;font-size:12px;letter-spacing:1px;color:var(--mid-gray);text-transform:uppercase">Cerrado por</th>
    </tr></thead>
    <tbody>
    ${sorted.map(c => `<tr style="border-top:1px solid var(--light-gray)" onclick="toggleCierreDetalle(${c.ts})" style="cursor:pointer">
      <td style="padding:9px 12px;font-weight:500">${fmtDate(c.fecha)}</td>
      <td style="padding:9px 12px;text-align:right;color:var(--green-ok);font-weight:600">$${(c.totalIngresos||0).toLocaleString('es-AR')}</td>
      <td style="padding:9px 12px;text-align:right;color:var(--red-alert);font-weight:600">$${(c.totalEgresos||0).toLocaleString('es-AR')}</td>
      <td style="padding:9px 12px;text-align:right;font-weight:700;color:${(c.saldo||0)>=0?'var(--green-ok)':'var(--red-alert)'}">$${(c.saldo||0).toLocaleString('es-AR')}</td>
      <td style="padding:9px 12px;color:var(--mid-gray);font-size:12px">${c.cerradoPor||'—'}</td>
    </tr>`).join('')}
    </tbody>
  </table></div>`;
}

export function toggleCierreDetalle(ts){
  const c = cierresCajaData.find(x => x.ts === ts);
  if(!c) return;
  const movs = c.movimientos || [];
  const filas = movs.map(m => `<tr><td>${esc(m.desc || '—')}${m.ticket ? `<br><span class="muted">Ticket ${esc(m.ticket)}</span>` : ''}</td>
      <td>${m.tipo==='ingreso' ? 'Ingreso' : 'Egreso'}</td>
      <td class="num">${m.tipo==='ingreso' ? '' : '−'}${fmtPesos(m.monto)}</td></tr>`).join('');
  abrirDocumento({
    tipo: 'Cierre de caja',
    titulo: fmtDate(c.fecha),
    meta: `Cerrado por ${esc(c.cerradoPor || '—')}${c.ts ? ' · ' + new Date(c.ts).toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit', hour12:false }) + ' hs' : ''}`,
    cuerpo: (movs.length
        ? `<table class="t"><thead><tr><th>Movimiento</th><th>Tipo</th><th class="num">Monto</th></tr></thead><tbody>${filas}</tbody></table>`
        : `<p class="muted">Sin movimientos ese día.</p>`) + kv([
        ['Ingresos', fmtPesos(c.totalIngresos)],
        ['Egresos', fmtPesos(c.totalEgresos)],
        ['Saldo del día', fmtPesos(c.saldo), true],
      ]) + `<div class="firmas"><div>Firma responsable</div><div>Firma gerencia</div></div>`,
    archivo: 'Cierre de caja - ' + fmtDate(c.fecha),
  });
}
