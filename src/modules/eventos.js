// ── EVENTOS ─────────────────────────────────────────────────────────────────
// Listado y alta/edición de eventos (arreglos, zonas, impacto en stock),
// detalle, eventos del día, historial con precios y tarifas por pax, réplica.
// Separado de app.js. Lo que necesita de app.js llega por configurarEventos():
//   CL_RESP_OPTS, TODAY_ISO, _auditarGuardado, _setEventosData, _stockFilasDe, _stockNombre, _xlsxDownload, arregloEmoji, badgeDiaRelativa, calcCostoComposicion, closeModal, etiquetaDiaRelativa, eventoPricing, eventosData, fbSave, floristaNombre, fmtMonth, getFloristasActivos, kanbanData, notificarAsignacion, recetasData, renderHome, renderKanban, renderStock, syncEventosToKanban, userRole

import { aLista, aplicarOps, crearSync, mismaLista } from './eventos-sync.js';
import { _fotosParaGuardar } from './fotos.js';
import { showToast } from './tema-toast.js';
import { esc, fmtDate, parseMoney } from './utils.js';
import { confirmModal, promptModal } from './modales.js';
import { gastoComprasEvento, genEventoId } from './compras.js';
import { EV_ZONAS } from './zonas-evento.js';
import { leerFotoComprimida } from './imagenes.js';
import { validarCampos } from './validacion.js';

let D = {};
export function configurarEventos(deps){ D = deps; }

// ════════════════════════════════════════
// DATA — EVENTOS COMERCIAL (bidirectional with Kanban)
// ════════════════════════════════════════

// Persiste eventosData marcando el momento del guardado. El listener de Firebase
// usa ese timestamp para NO pisar una edición recién hecha con una sincronización
// que llega justo después (mismo patrón que compras y checklist).
//
// Guardado por CAMBIOS (src/modules/eventos-sync.js): en vez de escribir la lista
// completa (y pisar lo que otro dispositivo guardó a la vez), se calcula qué
// eventos se agregaron/borraron/modificaron y se aplican sobre la versión más
// nueva del servidor con una transacción. Si todavía no se sabe qué hay en el
// servidor, o hay eventos sin id, se guarda a la antigua.
const _evSync = crearSync();
let _evCola = Promise.resolve();   // los lotes se envían de a uno, en orden
let _evAvisoError = false;
export function _saveEventos(){
  window._eventosDataLastSave = Date.now();
  const lote = (window.fbTransact && window._eventosLoaded) ? _evSync.guardar(D.eventosData) : null;
  if(lote === null){ D.fbSave('eventosData', D.eventosData); return; }
  if(!lote.ops.length) return;
  _evCola = _evCola.then(() => _evEnviarLote(lote));
}
async function _evEnviarLote(lote){
  // Las fotos nuevas viajan aparte (igual que en fbSave)
  const ops = _fotosParaGuardar('eventosData', JSON.parse(JSON.stringify(lote.ops)));
  for(let intento = 0; ; intento++){
    try{
      await window.fbTransact('eventosData', cur => {
        const nueva = aplicarOps(aLista(cur), ops);
        return mismaLista(nueva, cur) ? undefined : nueva;  // nada que escribir
      });
      _evSync.confirmar(lote);
      _evAvisoError = false;
      D._auditarGuardado('eventosData');
      return;
    }catch(e){
      console.warn('No se pudo guardar eventos, reintento', e);
      if(!_evAvisoError){ _evAvisoError = true; showToast('No se pudo guardar el cambio en eventos. Sigo intentando — no cierres la app.','error'); }
      await new Promise(r => setTimeout(r, Math.min(60000, 3000 * 2 ** intento)));
    }
  }
}
// Llega la lista del servidor: se le suman los cambios locales aún sin confirmar.
// Devuelve true si cambió lo que hay en pantalla.
window._eventosFromServer = (arr) => {
  const local = _evSync.desdeServidor(arr);
  if(mismaLista(local, D.eventosData)) return false;
  D._setEventosData(local);
  return true;
};

export const ESTADO_COLORS={
  'Pedidos Pendientes':'background:#E8E4DC;color:#4A4A4A',
  'En Proceso':'background:#EBF0E8;color:#4A5C3E',
  'Pendiente de Colocacion':'background:#FDF0E8;color:#A05A2C',
  'Pendiente de Retiro':'background:#EFE8F8;color:#5A3E8A',
  'Confirmado':'background:#EBF5E8;color:#5A8A4A',
  'Pedidos Finalizados':'background:#E8F0F8;color:#2C5A80'
};

// Costo aproximado de compra de un evento: suma, por cada arreglo pedido, la
// cantidad × el costo de su composición (mismo cálculo que el Cotizador).
// `sinCosto` lista los arreglos que no tienen composición o no tienen precios.
function costoEvento(ev){
  let total = 0; const sinCosto = [];
  (ev.arreglos||[]).forEach(a=>{
    const nombre = String(a.arreglo||'').trim().toLowerCase();
    const r = (D.recetasData||[]).find(x=>(x.nombre||'').trim().toLowerCase()===nombre);
    const c = r ? D.calcCostoComposicion(r) : 0;
    if(c>0) total += (+a.qty||0) * c; else sinCosto.push(a.arreglo);
  });
  return { total, sinCosto };
}

// Eventos del Historial según búsqueda, tipo y mes elegidos en pantalla.
function histEventosFiltrados(){
  const search = (document.getElementById('hist-ev-search')?.value||'').toLowerCase();
  const tipo = document.getElementById('hist-ev-tipo')?.value||'';
  const mes = document.getElementById('hist-ev-mes')?.value||'';
  const soloSin = document.getElementById('hist-ev-sinprecio')?.value==='1';
  return D.eventosData.filter(ev=>{
    if(soloSin && parseMoney(ev.precio)>0) return false;
    if(ev.estado !== 'Pedidos Finalizados' && ev.estado !== 'Confirmado') return false;
    const matchSearch = !search || ev.nombre?.toLowerCase().includes(search) || evZonasLabel(ev).toLowerCase().includes(search) || ev.organizador?.toLowerCase().includes(search);
    return matchSearch && (!tipo || ev.tipo === tipo) && (!mes || (ev.fecha||'').startsWith(mes));
  });
}

// Exporta a Excel lo que se ve en el Historial (respeta búsqueda, tipo y mes).
export function exportHistorialEventosXLSX(){
  const X = window.XLSX;
  if(!X){ showToast('Error: XLSX no disponible'); return; }
  const lista = histEventosFiltrados().sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  if(!lista.length){ showToast('Sin eventos para exportar'); return; }
  const rows = lista.map(ev=>{
    const pr = parseMoney(ev.precio), c = costoEvento(ev);
    const esp = ingresoEsperado(ev), base = pr>0 ? pr : esp;
    const margen = (base>0 && c.total>0) ? Math.round(base-c.total) : '';
    return {
      Fecha: ev.fecha||'', Evento: ev.nombre||'', Organizador: ev.organizador||'', Tipo: ev.tipo||'',
      Salón: evZonasLabel(ev), Pax: +ev.pax||'',
      Arreglos: (ev.arreglos||[]).map(a=>`${a.qty}× ${a.arreglo}`).join(' · '),
      'Cant. arreglos': (ev.arreglos||[]).reduce((s,a)=>s+(+a.qty||0),0),
      'Precio hotel': pr>0 ? pr : (ev.precio||''),
      'Servicio (tarifa)': ev.tarifaPax||'', 'Tarifa por pax': tarifaPaxDe(ev)||'', 'Ingreso esperado': esp||'',
      'Costo aprox.': c.total>0 ? Math.round(c.total) : '',
      'Costo por pax': (c.total>0 && +ev.pax>0) ? Math.round(c.total/ev.pax) : '',
      Margen: margen, 'Margen sobre': margen==='' ? '' : (pr>0 ? 'precio real' : 'esperado'),
      'Margen %': margen==='' ? '' : Math.round(margen/base*100),
      'Arreglos sin costo': c.sinCosto.join(', ')
    };
  });
  const mes = document.getElementById('hist-ev-mes')?.value || 'todos';
  const ws = X.utils.json_to_sheet(rows);
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, 'Eventos');
  D._xlsxDownload(wb, `eventos-${mes}.xlsx`);
  showToast('Exportado: eventos-'+mes+'.xlsx ('+rows.length+' eventos)');
}

// ── Tarifas por pax que paga el hotel según el servicio (las edita gerencia) ──
// Se guardan dentro de eventoPricing.tarifasPax (ya sincronizado). Mientras
// gerencia no las cambie se usa la tabla que pasó el hotel.
const TARIFAS_PAX_BASE = [
  {nombre:'Almuerzo buffet · 2 arreglos altos', valor:2450},
  {nombre:'Desayuno · centro de mesas con follaje', valor:4600},
  {nombre:'Almuerzo · centro de mesas con flores', valor:7000},
  {nombre:'Cocktail · arreglos, juegos de living y estación en vivo', valor:12201},
  {nombre:'Menú informal · cocktail + mesa dulce', valor:13300},
  {nombre:'Bodas / cumpleaños · centro de mesa + 2 arreglos de estación', valor:13800},
  {nombre:'Meeting Package · follaje + arreglos altos estación', valor:6000}
];
function tarifasPaxLista(){
  const t = D.eventoPricing.tarifasPax;
  const l = Array.isArray(t) ? t : (t ? Object.values(t) : null);
  return (l && l.length) ? l : TARIFAS_PAX_BASE.map(x=>({...x}));
}
function tarifaPaxDe(ev){
  const t = tarifasPaxLista().find(x=>x.nombre===ev.tarifaPax);
  return t ? (+t.valor||0) : 0;
}
// Ingreso esperado de un evento: pax × tarifa del servicio elegido.
function ingresoEsperado(ev){ return (+ev.pax||0) * tarifaPaxDe(ev); }

function _guardarTarifasPax(l){
  D.eventoPricing.tarifasPax = l;
  D.fbSave('eventoPricing', D.eventoPricing);
  renderHistorialEventos();
}
export function histTarifaSet(i, campo, v){
  if(D.userRole!=='gerencia'){ showToast('Solo gerencia puede cambiar las tarifas'); return; }
  const l = tarifasPaxLista().map(x=>({...x}));
  if(!l[i]) return;
  if(campo==='valor') l[i].valor = Math.max(0, parseMoney(v));
  else {
    const nuevo = String(v||'').trim(); if(!nuevo) return;
    const viejo = l[i].nombre; l[i].nombre = nuevo;
    if(viejo!==nuevo){ D.eventosData.forEach(e=>{ if(e.tarifaPax===viejo) e.tarifaPax = nuevo; }); _saveEventos(); }
  }
  _guardarTarifasPax(l);
}
export function histTarifaAdd(){
  if(D.userRole!=='gerencia'){ showToast('Solo gerencia puede cambiar las tarifas'); return; }
  const l = tarifasPaxLista().map(x=>({...x}));
  l.push({nombre:'Nuevo servicio', valor:0});
  _guardarTarifasPax(l);
}
export function histTarifaDel(i){
  if(D.userRole!=='gerencia'){ showToast('Solo gerencia puede cambiar las tarifas'); return; }
  const l = tarifasPaxLista().map(x=>({...x}));
  l.splice(i,1);
  _guardarTarifasPax(l);
}
export function histEventoSetTarifa(i, nombre){
  const ev = D.eventosData[i]; if(!ev) return;
  ev.tarifaPax = nombre || '';
  _saveEventos();
  renderHistorialEventos();
}

// Carga el precio de un evento directo desde el Historial (eventos que se
// venden en USD y el hotel confirma a fin de mes).
export function histEventoSetPrecio(i, valor){
  const ev = D.eventosData[i]; if(!ev) return;
  const v = String(valor||'').trim();
  if(!(parseMoney(v)>0)){ showToast('Ingresá un precio mayor a 0'); return; }
  ev.precio = v;
  _saveEventos();
  renderHistorialEventos();
  showToast('Precio guardado: '+(ev.nombre||'evento'));
}

export function renderHistorialEventos(){
  const tipoSel = document.getElementById('hist-ev-tipo');

  // Poblar filtro de tipos dinámicamente
  if(tipoSel){
    const cur = tipoSel.value;
    const allTipos = [...new Set(D.eventosData.map(e=>e.tipo).filter(Boolean))].sort();
    tipoSel.innerHTML = '<option value="">Todos los tipos</option>' + allTipos.map(t => `<option${t===cur?' selected':''}>${esc(t)}</option>`).join('');
  }

  // Poblar filtro de meses con los que tienen eventos
  const mesSel = document.getElementById('hist-ev-mes');
  const hechos = D.eventosData.filter(ev => ev.estado === 'Pedidos Finalizados' || ev.estado === 'Confirmado');
  if(mesSel){
    const cur = mesSel.value;
    const meses = [...new Set(hechos.map(e=>(e.fecha||'').slice(0,7)).filter(Boolean))].sort().reverse();
    mesSel.innerHTML = '<option value="">Todos los meses</option>' + meses.map(m => `<option value="${m}"${m===cur?' selected':''}>${esc(D.fmtMonth(m))}</option>`).join('');
  }
  const filtered = histEventosFiltrados();

  // Panel de tarifas por pax
  const tarEl = document.getElementById('hist-ev-tarifas');
  if(tarEl){
    const edit = D.userRole==='gerencia', dis = edit ? '' : ' disabled';
    tarEl.innerHTML = tarifasPaxLista().map((t,i)=>`<div style="display:flex;gap:6px;align-items:center;margin:4px 0">
      <input value="${esc(t.nombre)}"${dis} onchange="histTarifaSet(${i},'nombre',this.value)" style="flex:1;min-width:200px;font-size:12px;padding:5px 7px;border:1px solid var(--light-gray);border-radius:6px">
      <span style="color:var(--mid-gray)">$</span>
      <input value="${t.valor}"${dis} inputmode="decimal" onchange="histTarifaSet(${i},'valor',this.value)" style="width:90px;font-size:12px;padding:5px 7px;text-align:right;border:1px solid var(--light-gray);border-radius:6px">
      <span style="font-size:12px;color:var(--mid-gray)">por pax</span>
      ${edit?`<button class="btn-icon" style="color:var(--red-alert)" onclick="histTarifaDel(${i})" title="Quitar">✕</button>`:''}
    </div>`).join('') + (edit?'<button class="btn-secondary" style="font-size:12px;padding:4px 10px;margin-top:6px" onclick="histTarifaAdd()">+ Agregar servicio</button>':'<div style="font-size:12px;color:var(--mid-gray);margin-top:6px">Solo gerencia puede editar las tarifas.</div>');
  }

  // KPIs
  const kpisEl = document.getElementById('hist-ev-kpis');
  if(kpisEl){
    const totalPax    = (mesSel?.value?filtered:hechos).reduce((s,e)=>s+(+e.pax||0),0);
    const tiposUniq   = [...new Set(hechos.map(e=>e.tipo).filter(Boolean))].length;
    // Rentabilidad de lo filtrado: solo eventos con precio confirmado y costo completo
    let factur=0, costo=0, conDato=0;
    filtered.forEach(ev=>{
      const pr = parseMoney(ev.precio), c = costoEvento(ev);
      if(pr>0 && c.total>0 && !c.sinCosto.length){ factur+=pr; costo+=c.total; conDato++; }
    });
    const margenTot = factur-costo;
    const money = n => '$'+Math.round(n).toLocaleString('es-AR');
    const sinPrecio = filtered.filter(e=>!(parseMoney(e.precio)>0)).length;
    kpisEl.innerHTML = `
      <div class="card"><div class="card-label">${mesSel?.value?'Eventos de '+esc(D.fmtMonth(mesSel.value)):'Total eventos finalizados'}</div><div class="card-value" style="font-size:32px">${mesSel?.value?filtered.length:hechos.length}</div></div>
      <div class="card"><div class="card-label">Total pax acumulado</div><div class="card-value" style="font-size:32px">${totalPax}</div></div>
      <div class="card"><div class="card-label">Tipos de evento</div><div class="card-value" style="font-size:32px">${tiposUniq}</div></div>
      <div class="card" style="${sinPrecio?'border:1px solid #E0B06A':''}"><div class="card-label">Falta cargar precio</div><div class="card-value" style="font-size:32px;color:${sinPrecio?'#A05A2C':'var(--green-ok)'}">${sinPrecio}</div><div style="font-size:12px;color:var(--mid-gray);margin-top:4px">${sinPrecio?'eventos "a confirmar" (USD): cargalos desde la tabla':'todos los eventos tienen precio'}</div></div>
      <div class="card"><div class="card-label">Facturado (eventos con costo)</div><div class="card-value" style="font-size:26px">${money(factur)}</div><div style="font-size:12px;color:var(--mid-gray);margin-top:4px">${conDato} evento${conDato===1?'':'s'} con precio y composiciones cargadas</div></div>
      <div class="card"><div class="card-label">Costo aprox. de compra</div><div class="card-value" style="font-size:26px">${money(costo)}</div></div>
      <div class="card"><div class="card-label">Margen aproximado</div><div class="card-value" style="font-size:26px;color:${margenTot>=0?'var(--green-ok)':'var(--red-alert)'}">${money(margenTot)}${factur>0?` <span style="font-size:14px">(${Math.round(margenTot/factur*100)}%)</span>`:''}</div></div>`;
  }

  const tbody = document.getElementById('hist-ev-body');
  if(!tbody) return;

  if(filtered.length === 0){
    tbody.innerHTML = '<tr><td colspan="11" style="padding:24px;text-align:center;color:var(--mid-gray)">'+
      (hechos.length===0 ? 'Aún no hay eventos finalizados.' : 'Sin resultados para los filtros aplicados.')+'</td></tr>';
    return;
  }

  // Sort by fecha desc
  const sorted = [...filtered].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));

  tbody.innerHTML = sorted.map((ev,_i)=>{
    const realIdx = D.eventosData.indexOf(ev);
    const arreglosStr = ev.arreglos?.length
      ? ev.arreglos.map(a=>`${a.qty}× ${esc(a.arreglo)}`).join(' · ')
      : '<span style="color:var(--mid-gray)">—</span>';
    const pr = parseMoney(ev.precio), c = costoEvento(ev);
    const dash = '<span style="color:var(--mid-gray)">—</span>';
    const pax = +ev.pax||0, esp = ingresoEsperado(ev);
    const money = n => '$'+Math.round(n).toLocaleString('es-AR');
    const costoTd = !(ev.arreglos?.length) ? dash
      : (c.total>0 ? money(c.total)+(pax>0?`<div style="font-size:12px;color:var(--mid-gray)">${money(c.total/pax)}/pax</div>`:'') : dash)
        + (c.sinCosto.length ? `<div style="font-size:12px;color:var(--red-alert)" title="${esc(c.sinCosto.join(', '))}">sin costo: ${c.sinCosto.length}</div>` : '');
    // Margen sobre el precio real; si todavía no está cargado, sobre el esperado (pax × tarifa)
    const base = pr>0 ? pr : esp, estim = !(pr>0);
    let margenTd = dash;
    if(base>0 && c.total>0){
      const m = base - c.total, col = m>=0 ? 'var(--green-ok)' : 'var(--red-alert)';
      margenTd = `<span style="color:${col};font-weight:600">${m<0?'-':''}${money(Math.abs(m))}</span><div style="font-size:12px;color:${col}">${Math.round(m/base*100)}%${estim?' (est.)':''}${c.sinCosto.length?' (parcial)':''}</div>`;
    }
    const tarifas = tarifasPaxLista();
    const tarifaTd = `<div onclick="event.stopPropagation()"><select onchange="histEventoSetTarifa(${realIdx},this.value)" style="max-width:130px;font-size:12px;padding:3px">
      <option value="">—</option>${tarifas.map(t=>`<option value="${esc(t.nombre)}"${t.nombre===ev.tarifaPax?' selected':''}>${esc(t.nombre.split(' · ')[0])} (${money(t.valor)})</option>`).join('')}</select>
      ${esp>0?`<div style="font-size:12px;color:var(--mid-gray)">esperado ${money(esp)}</div>`:''}</div>`;
    return `<tr style="cursor:pointer${pr>0?'':';background:#FFFAF2'}" onclick="openEventoDetail(${realIdx})">
      <td style="font-weight:600;font-size:13px">${esc(ev.nombre||'')}</td>
      <td style="font-size:13px">${ev.organizador?esc(ev.organizador):'<span style="color:var(--mid-gray)">—</span>'}</td>
      <td><span class="badge badge-tipo">${esc(ev.tipo||'—')}</span></td>
      <td style="font-size:12px;color:var(--mid-gray)">${ev.fecha?fmtDate(ev.fecha):'—'}</td>
      <td style="font-size:13px">${esc(evZonasLabel(ev))}</td>
      <td style="text-align:center;font-size:13px">${ev.pax||'—'}</td>
      <td style="font-size:12px;color:var(--charcoal)">${arreglosStr}</td>
      <td style="font-weight:600;font-size:13px;color:var(--green-ok)">${pr>0 ? esc(ev.precio) :
        `<div onclick="event.stopPropagation()" style="display:flex;gap:4px;align-items:center"><span class="badge" style="background:var(--amber-soft);color:#A05A2C;white-space:nowrap">Falta precio</span><input id="hist-ev-p-${realIdx}" placeholder="Precio" inputmode="decimal" style="width:90px;font-size:12px;padding:4px 6px;border:1px solid #E0B06A;border-radius:6px" onkeydown="if(event.key==='Enter')histEventoSetPrecio(${realIdx},this.value)"><button class="btn-secondary" style="font-size:12px;padding:4px 8px" onclick="histEventoSetPrecio(${realIdx},document.getElementById('hist-ev-p-${realIdx}').value)">Guardar</button></div>`}</td>
      <td style="font-size:12px">${tarifaTd}</td>
      <td style="font-size:13px;text-align:right">${costoTd}</td>
      <td style="font-size:13px;text-align:right">${margenTd}</td>
    </tr>`;
  }).join('');
}

export function renderEventos(){
  const grid=document.getElementById('eventos-grid');
  // Banner si hay eventos sin completar desde operaciones
  const fromOps = D.eventosData.filter(e=>e.fromKanban && e.estado!=='Pedidos Finalizados');
  const bannerEl = document.getElementById('eventos-kanban-banner');
  if(bannerEl){
    bannerEl.innerHTML = fromOps.length
      ? `<div class="alert-banner green" style="margin-bottom:16px"><strong>${fromOps.length} evento${fromOps.length>1?'s':''} cargado${fromOps.length>1?'s':''} desde Operaciones</strong> — revisá los datos y completá los detalles.</div>`
      : '';
  }
  // Solo mostrar eventos actuales (no finalizados — esos van a Historial)
  const eventosActivos = D.eventosData.filter(ev => ev.estado !== 'Pedidos Finalizados')
    .sort((a,b) => (a.fecha||'9999-12-31').localeCompare(b.fecha||'9999-12-31') || (a.hora||'').localeCompare(b.hora||''));
  grid.innerHTML=eventosActivos.map((ev)=>{
    const i = D.eventosData.indexOf(ev);
    const stStyle=ESTADO_COLORS[ev.estado]||'';
    const stOpts=['Pedidos Pendientes','En Proceso','Pendiente de Colocacion','Confirmado','Pedidos Finalizados'].map(o=>`<option value="${o}"${ev.estado===o?' selected':''}>${o}</option>`).join('');
    const fromOpsTag = ev.fromKanban ? '<span style="font-size:12px;background:var(--info-soft);color:var(--info);padding:2px 7px;border-radius:4px;font-weight:600;letter-spacing:.5px">DESDE OPERACIONES</span>' : '';
    const arreglosResumen = (ev.arreglos && ev.arreglos.length)
      ? `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px;align-items:center">
          <span style="font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Arreglos</span>
          ${ev.arreglos.map(a=>`<span style="background:var(--blush-light);color:#7A3A2A;font-size:12px;font-weight:600;padding:3px 9px;border-radius:20px;white-space:nowrap">${a.qty}× ${esc(a.arreglo)}</span>`).join('')}
        </div>`
      : '';
    return `<div class="event-card"${ev.fromKanban?' style="border-left:3px solid var(--info)"':''}>
      <div class="event-card-header">
        <div style="display:flex;flex-direction:column;gap:4px"><div class="event-name">${esc(ev.nombre)}${D.badgeDiaRelativa(ev.fecha)}</div>${fromOpsTag}</div>
        <span class="event-type">${esc(ev.tipo)}</span>
      </div>
      <div class="event-details">
        <strong>Fecha:</strong> ${fmtDate(ev.fecha)}${ev.hora?' <strong>·</strong> <strong>Hora:</strong> '+esc(ev.hora):''}<br>
        <strong>Salón:</strong> ${esc(evZonasLabel(ev))}<br>
        ${ev.pax?`<strong>Pax:</strong> ${ev.pax}<br>`:''}
        <strong>Notas:</strong> ${esc(ev.notas)}
      </div>
      ${arreglosResumen}
      <div class="event-footer">
        <div class="event-price">${esc(ev.precio)}</div>
        <div class="event-actions">
          <select class="event-status-sel" style="${stStyle}" onchange="changeEventoEstado(${i},this.value)">${stOpts}</select>
          <button class="btn-icon" title="Ver detalle" onclick="openEventoDetail(${i})"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></button>
          <button class="btn-icon" onclick="openEventModal(${i})" title="Editar"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 20h4L18 10l-4-4L4 16z"/><path d="M13 5l4 4"/></svg></button>
          <button class="btn-icon" onclick="replicarEvento(${i})" title="Replicar en otro día"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></button>
          <button class="btn-icon" style="color:var(--red-alert)" onclick="deleteEvento(${i})">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

export function changeEventoEstado(i,val){
  const prev = D.eventosData[i]?.estado;
  D.eventosData[i].estado=val;
  _saveEventos();
  D.syncEventosToKanban();
  D.fbSave('kanbanData', D.kanbanData);
  renderEventos();
  D.renderHome();
  if(document.getElementById('page-eventos-maison')?.classList.contains('active')) D.renderKanban();
  if(document.getElementById('page-historial-eventos')?.classList.contains('active')) renderHistorialEventos();
  // Descontar stock al confirmar
  const wasConfirmed = prev==='Confirmado'||prev==='Pedidos Finalizados';
  const nowConfirmed = val==='Confirmado'||val==='Pedidos Finalizados';
  if(!wasConfirmed && nowConfirmed && D.eventosData[i]?.arreglos?.length){
    const descuentos = descontarStockEvento(D.eventosData[i].arreglos);
    if(descuentos.length>0){
      showToast('Stock descontado al confirmar: '+descuentos.slice(0,3).join(' · '));
      if(document.getElementById('page-stock').classList.contains('active')) D.renderStock();
    }
  }
}
// openEventModal defined in recetas section
// saveEvent defined in recetas section

export async function deleteEvento(i){ if(!await confirmModal('¿Eliminar este evento?')) return; D.eventosData.splice(i,1); _saveEventos(); D.syncEventosToKanban(); D.fbSave('kanbanData', D.kanbanData); renderEventos(); D.renderHome(); }

// Replica un evento en otro día: copia todo el seteo (arreglos, zonas, pax,
// precio, tipo de evento, organizador, notas, imagen) y crea uno nuevo en la
// fecha elegida. Arranca en "Pedidos Pendientes" y SIN asignaciones ni fichajes
// del original (no descuenta stock ni re-notifica), con id nuevo y sin ordenId
// (para no chocar con la deduplicación del daily).
export async function replicarEvento(i){
  const src = D.eventosData[i];
  if(!src) return;
  if(!window._eventosLoaded){ showToast('Los eventos todavía se están cargando — esperá unos segundos e intentá de nuevo.','error'); return; }
  const nueva = await promptModal('Elegí el día para la copia (mismo seteo, otra fecha):', {
    title:'Replicar evento', okText:'Replicar', type:'date', default: src.fecha || D.TODAY_ISO
  });
  if(!nueva) return;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(nueva)){ showToast('Fecha inválida','error'); return; }
  const copia = {
    ...JSON.parse(JSON.stringify(src)),
    id: genEventoId(),
    fecha: nueva,
    estado: 'Pedidos Pendientes',
    ordenId: '',
    importadoDaily: false,
    // Limpiar asignaciones, fechas/horas de colocación-retiro y fichajes del original
    asignado:'', colocacionAsignado:'', retiroAsignado:'',
    colocacionFecha:'', colocacionHora:'', retiroFecha:'', retiroHora:'',
    inicio:'', fin:'', colocacionInicio:'', colocacionFin:'', retiroInicio:'', retiroFin:'',
    colocacionAvisada:'', retiroAvisada:''
  };
  D.eventosData.push(copia);
  _saveEventos();
  D.syncEventosToKanban();
  D.fbSave('kanbanData', D.kanbanData);
  renderEventos();
  D.renderHome?.();
  if(document.getElementById('page-eventos-maison')?.classList.contains('active')) D.renderKanban?.();
  showToast(`Evento replicado al ${fmtDate(nueva)} — quedó en Pedidos Pendientes`);
}

// ── Event modal: arreglos rows ────────────────────────────────────────────────
let evArreglosRows = [];
let evZonasSelected = [];

export function evZonasLabel(ev){
  return (ev.zonas?.length ? ev.zonas : ev.salon ? [ev.salon] : []).join(', ') || '—';
}

export function renderZonasPicker(){
  const c = document.getElementById('ev-zonas-picker');
  if(!c) return;
  c.innerHTML = EV_ZONAS.map(z => {
    const sel = evZonasSelected.includes(z);
    return `<button type="button" onclick="toggleEvZona('${z}')"
      style="padding:4px 11px;border-radius:14px;font-size:12px;border:1.5px solid ${sel?'var(--green-ok)':'var(--light-gray)'};background:${sel?'var(--green-ok)':'var(--warm-white)'};color:${sel?'#fff':'var(--charcoal)'};cursor:pointer;transition:all .15s;white-space:nowrap"
    >${sel?'✓ ':''}${z}</button>`;
  }).join('');
}

export function toggleEvZona(z){
  const idx = evZonasSelected.indexOf(z);
  if(idx >= 0) evZonasSelected.splice(idx,1);
  else evZonasSelected.push(z);
  renderZonasPicker();
}

// Los handlers de las filas de arreglos deben ir por funciones exportadas: el
// array evArreglosRows es interno del módulo y, minificado, su nombre cambia,
// así que un onchange inline "evArreglosRows[i]=..." rompía (ReferenceError) y
// el arreglo elegido nunca se guardaba en el evento.
export function evSetArreglo(idx, val){ if(evArreglosRows[idx]) evArreglosRows[idx].arreglo = val; previewStockImpact(); }
export function evSetArregloQty(idx, val){ if(evArreglosRows[idx]) evArreglosRows[idx].qty = +val || 0; previewStockImpact(); }
export function evRemoveArregloRow(idx){
  const el = document.getElementById('ev-arr-row-'+idx);
  if(el) el.remove();
  if(evArreglosRows[idx]) evArreglosRows[idx] = {arreglo:'', qty:0};
  previewStockImpact();
}

export function addEvArregloRow(){
  const list = document.getElementById('ev-arreglos-list');
  const idx = evArreglosRows.length;
  evArreglosRows.push({arreglo:'', qty:1});
  const arregloOpts = [...new Set(D.recetasData.map(r=>r.nombre))]
    .map(n=>`<option value="${esc(n)}">${D.arregloEmoji(n)} ${esc(n)}</option>`).join('');

  const div = document.createElement('div');
  div.className = 'ev-arreglo-row';
  div.id = 'ev-arr-row-'+idx;
  div.innerHTML = `
    <select onchange="evSetArreglo(${idx},this.value)" style="flex:2;border:1px solid var(--light-gray);border-radius:4px;padding:5px 8px;font-family:'DM Sans',sans-serif;font-size:12.5px;outline:none">
      <option value="">— Tipo de arreglo —</option>${arregloOpts}
    </select>
    <span style="font-size:12px;color:var(--mid-gray)">×</span>
    <input type="number" min="1" value="1" placeholder="Cant." onchange="evSetArregloQty(${idx},this.value)" style="width:60px;border:1px solid var(--light-gray);border-radius:4px;padding:5px 6px;font-size:12.5px;text-align:center;outline:none;font-family:'DM Sans',sans-serif">
    <button type="button" class="btn-icon" style="color:var(--red-alert)" onclick="evRemoveArregloRow(${idx})">✕</button>`;
  list.appendChild(div);
}

export function previewStockImpact(){
  const preview = document.getElementById('ev-stock-preview');
  if(!preview) return;
  const impact = calcStockImpact(evArreglosRows);
  if(Object.keys(impact).length===0){ preview.innerHTML=''; return; }

  const lines = Object.entries(impact).map(([prod,qty])=>{
    const filas = D._stockFilasDe(prod);
    const stockItem = filas.length ? { actual: +filas.reduce((t,f)=>t+f.actual,0).toFixed(1) } : null;
    const actual = stockItem ? stockItem.actual : '?';
    const after = stockItem ? +(stockItem.actual - qty).toFixed(1) : '?';
    const ok = typeof after==='number' && after>=0;
    return `<span style="margin-right:10px">${ok?'':''} <b>${esc(prod)}</b>: ${actual} → ${after>=0?after:'<span style="color:var(--red-alert)">'+after+'</span>'}${ok?'':' (insuficiente)'}</span>`;
  });
  const hasShortage = Object.entries(impact).some(([prod,qty])=>{
    const filas = D._stockFilasDe(prod);
    return filas.length && filas.reduce((t,f)=>t+f.actual,0) < qty;
  });
  preview.innerHTML = `<div class="${hasShortage?'stock-impact':'stock-impact ok'}">
    <div style="font-weight:600;margin-bottom:6px">${hasShortage?'Stock insuficiente para algunos ingredientes':'Stock suficiente para todos los arreglos'}</div>
    <div style="line-height:2">${lines.join('')}</div>
  </div>`;
}

export function calcStockImpact(arrRows){
  const impact = {};
  arrRows.forEach(row=>{
    if(!row.arreglo || !row.qty) return;
    const receta = D.recetasData.find(r=>r.nombre===row.arreglo);
    if(!receta) return;
    receta.ings.forEach(ing=>{
      impact[ing.prod] = (impact[ing.prod]||0) + ing.qty * row.qty;
    });
  });
  return impact;
}

export function descontarStockEvento(arrRows){
  const impact = calcStockImpact(arrRows);
  const descuentos = [];
  Object.entries(impact).forEach(([prod,qty])=>{
    // Primero el renglón sin color; lo que falte sale de los colores, del que más tiene al que menos
    const filas = D._stockFilasDe(prod).sort((a,b)=> (a.color?1:0)-(b.color?1:0) || b.actual-a.actual);
    let resto = qty;
    filas.forEach(s=>{
      if(resto <= 0) return;
      const antes = s.actual;
      const saca = Math.min(antes, resto);
      s.actual = +Math.max(0, antes - saca).toFixed(1);
      resto = +(resto - saca).toFixed(1);
      descuentos.push(`${D._stockNombre(s)}: ${antes} → ${s.actual}`);
    });
  });
  return descuentos;
}

// ── saveEvent ─────────────────────────────────────────────────────────────────
// ── Event image helpers ───────────────────────────────────────────────────────
export function previewEventImg(input){
  const file = input.files[0]; if(!file) return;
  leerFotoComprimida(file, data => {
    document.getElementById('ev-img-data').value = data;
    const preview = document.getElementById('ev-img-preview');
    preview.src = data; preview.style.display = 'block';
    document.getElementById('ev-img-clear').style.display = 'inline-block';
  });
}

export function clearEventImg(){
  document.getElementById('ev-img-data').value = '';
  document.getElementById('ev-img-preview').src = '';
  document.getElementById('ev-img-preview').style.display = 'none';
  document.getElementById('ev-img-clear').style.display = 'none';
  document.getElementById('ev-img-file').value = '';
}

// ── Evento detail modal ───────────────────────────────────────────────────────
export function openEventoDetail(i){
  const ev = D.eventosData[i]; if(!ev) return;

  // Image
  const imgWrap = document.getElementById('evento-detail-img-wrap');
  const imgEl = document.getElementById('evento-detail-img');
  if(ev.img){ imgEl.src = ev.img; imgWrap.style.display='block'; }
  else { imgWrap.style.display='none'; imgEl.src=''; }

  // Header
  document.getElementById('evento-detail-nombre').textContent = ev.nombre || '';
  document.getElementById('evento-detail-tipo').textContent = ev.tipo || '';

  // Estado badge
  const estadoColors = {
    'Pedidos Pendientes':  'background:#F5F0E8;color:#8B7355',
    'En Proceso': 'background:#E8F0F8;color:#2C5A80',
    'Pendiente de Colocacion':   'background:#FFF3E0;color:#E65100',
    'Pendiente de Retiro':   'background:#EFE8F8;color:#5A3E8A',
    'Confirmado': 'background:#E8F5E9;color:#2E7D32',
    'Pedidos Finalizados':      'background:#F3E5F5;color:#6A1B9A',
  };
  const estadoEl = document.getElementById('evento-detail-estado');
  estadoEl.textContent = ev.estado || '';
  estadoEl.style.cssText = (estadoColors[ev.estado]||'background:#eee;color:#666') + ';padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;letter-spacing:.5px';

  // Body grid fields
  const armadoTxt = ev.asignado ? ev.asignado + (ev.inicio && ev.fin ? ` (${ev.inicio}–${ev.fin})` : ev.inicio ? ` (desde ${ev.inicio})` : '') : null;
  const colocTxt  = ev.colocacionAsignado ? ev.colocacionAsignado + (ev.colocacionInicio && ev.colocacionFin ? ` (${ev.colocacionInicio}–${ev.colocacionFin})` : ev.colocacionInicio ? ` (desde ${ev.colocacionInicio})` : '') : null;
  const retiroTxt = ev.retiroAsignado ? ev.retiroAsignado + (ev.retiroInicio && ev.retiroFin ? ` (${ev.retiroInicio}–${ev.retiroFin})` : ev.retiroInicio ? ` (desde ${ev.retiroInicio})` : '') : null;
  // Cruce gasto vs cobro: total comprado asociado a este evento y precio cobrado
  const _gastoEv = gastoComprasEvento(ev.id);
  const _cobroEv = parseMoney(ev.precio);
  const fields = [
    ev.organizador ? ['Organizador', ev.organizador] : null,
    ev.tipoEvento ? ['Tipo de evento', ev.tipoEvento] : null,
    ev.fecha ? ['Fecha', fmtDate(ev.fecha) + (ev.hora ? ' · ' + ev.hora : '') + (D.etiquetaDiaRelativa(ev.fecha) ? ' · ' + D.etiquetaDiaRelativa(ev.fecha) : '')] : null,
    evZonasLabel(ev) !== '—' ? ['Salón / Zona', evZonasLabel(ev)] : null,
    ev.pax   ? ['Pax', ev.pax + ' personas'] : null,
    ev.precio && ev.precio !== 'A confirmar' ? ['Precio', ev.precio] : null,
    _gastoEv > 0 ? ['Gastado en compras', '$' + _gastoEv.toLocaleString('es-AR')] : null,
    (_gastoEv > 0 && _cobroEv > 0) ? ['Resultado (cobro − compras)', '$' + (_cobroEv - _gastoEv).toLocaleString('es-AR')] : null,
    armadoTxt ? ['Armado', armadoTxt] : null,
    colocTxt ? ['Colocación', colocTxt] : null,
    retiroTxt ? ['Retiro', retiroTxt] : null,
  ].filter(Boolean);
  document.getElementById('evento-detail-body').innerHTML = fields.map(([label, val]) =>
    `<div><div class="detail-field-label">${label}</div><div class="detail-field-value">${esc(String(val))}</div></div>`
  ).join('');

  // Notas
  const notasWrap = document.getElementById('evento-detail-notas-wrap');
  if(ev.notas && ev.notas.trim()){
    document.getElementById('evento-detail-notas').textContent = ev.notas;
    notasWrap.style.display = 'block';
  } else { notasWrap.style.display = 'none'; }

  // Arreglos
  const arreglosWrap = document.getElementById('evento-detail-arreglos-wrap');
  if(ev.arreglos && ev.arreglos.length){
    document.getElementById('evento-detail-arreglos').innerHTML = ev.arreglos.map(a=>{
      const receta = D.recetasData.find(r=>r.nombre===a.arreglo);
      const ings = receta?.ings || [];
      const ingsHTML = ings.length
        ? `<div style="margin-top:8px;background:var(--cream);border-radius:6px;padding:10px 12px">
            <div style="display:grid;grid-template-columns:1fr auto auto;gap:4px 12px;align-items:center">
              <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:600">Ingrediente</div>
              <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:600;text-align:center">× unidad</div>
              <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--green-ok);font-weight:600;text-align:center">Total cámara</div>
              ${ings.map(ing=>`
                <div style="font-size:12px;color:var(--charcoal)">${esc(ing.prod)}</div>
                <div style="font-size:12px;text-align:center;color:var(--mid-gray)">${ing.qty} ud${ing.qty>1?'s':''}</div>
                <div style="font-size:13px;font-weight:700;text-align:center;color:var(--green-ok)">${ing.qty * a.qty} ud${(ing.qty*a.qty)>1?'s':''}</div>
              `).join('')}
            </div>
          </div>`
        : '<div style="font-size:12px;color:var(--mid-gray);margin-top:4px;font-style:italic">Sin receta cargada</div>';
      return `<div style="padding:10px 0;border-bottom:1px solid var(--light-gray)">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:16px"></span>
          <span style="flex:1;font-size:13px;font-weight:600;color:var(--charcoal)">${esc(a.arreglo)}</span>
          <span style="background:var(--cream);border-radius:4px;padding:2px 10px;font-size:12px;font-weight:600">${a.qty} ud${a.qty>1?'s':''}</span>
        </div>
        ${ingsHTML}
      </div>`;
    }).join('');
    arreglosWrap.style.display = 'block';
  } else { arreglosWrap.style.display = 'none'; }

  // Edit button — solo gerencia/comercial puede editar; floristas solo visualizan
  const editBtn = document.getElementById('evento-detail-edit-btn');
  if(editBtn){
    editBtn.style.display = (D.userRole==='gerencia'||D.userRole==='comercial') ? '' : 'none';
    editBtn.onclick = () => {
      D.closeModal('evento-detail-modal');
      openEventModal(i);
    };
  }
  const repBtn = document.getElementById('evento-detail-replicar-btn');
  if(repBtn){
    repBtn.style.display = (D.userRole==='gerencia'||D.userRole==='comercial') ? '' : 'none';
    repBtn.onclick = () => {
      D.closeModal('evento-detail-modal');
      replicarEvento(i);
    };
  }

  document.getElementById('evento-detail-modal').classList.add('open');
}

// ── Popup automático de eventos del día (al abrir la app) ──
let _eventosDelDiaShown = false;
export function mostrarEventosDelDia(retry = 0){
  if(_eventosDelDiaShown) return;
  // Roles que reciben el aviso: floristas (con evento asignado), gerencia, operario y comercial
  if(!['florista','gerencia','operario','comercial'].includes(D.userRole)) return;
  // Esperar a que Firebase cargue los eventos
  if((!D.eventosData || !D.eventosData.length) && retry < 5){
    setTimeout(()=>mostrarEventosDelDia(retry+1), 1500);
    return;
  }
  const isFlor = D.userRole === 'florista';
  const hoy = (D.eventosData||[]).filter(ev =>
    ev.fecha === D.TODAY_ISO &&
    ev.estado !== 'Pedidos Finalizados' &&
    (!isFlor || ev.asignado === D.floristaNombre || ev.colocacionAsignado === D.floristaNombre || ev.retiroAsignado === D.floristaNombre)
  );
  if(!hoy.length) return; // floristas sin evento asignado hoy: no molestar
  _eventosDelDiaShown = true;

  const estadoBadge = est => {
    const map = {
      'Pedidos Pendientes':'background:#F5F0E8;color:#8B7355',
      'En Proceso':'background:#E8F0F8;color:#2C5A80',
      'Pendiente de Colocacion':'background:#FFF3E0;color:#E65100',
      'Confirmado':'background:#E8F5E9;color:#2E7D32'
    };
    return `<span style="${map[est]||'background:#eee;color:#666'};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;white-space:nowrap">${esc(est||'')}</span>`;
  };

  const sorted = [...hoy].sort((a,b)=>(a.hora||'').localeCompare(b.hora||''));
  let ov = document.getElementById('eventos-dia-modal');
  if(!ov){ ov = document.createElement('div'); ov.id='eventos-dia-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="modal" style="max-width:540px">
    <div class="modal-header"><h2>Eventos de hoy</h2><button class="modal-close" onclick="closeModal('eventos-dia-modal')">✕</button></div>
    <div style="font-size:12.5px;color:var(--mid-gray);margin-bottom:16px">${isFlor?'Tus eventos asignados para hoy. Tocá uno para ver el detalle.':'Eventos del día — priorizá la colocación de los que ya estén armados.'}</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${sorted.map(ev=>{ const i = D.eventosData.indexOf(ev); return `
        <div onclick="closeModal('eventos-dia-modal');openEventoDetail(${i})" style="cursor:pointer;border:1px solid var(--light-gray);border-radius:10px;padding:14px 16px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;transition:border-color .2s,box-shadow .2s" onmouseover="this.style.borderColor='#1A1A1A';this.style.boxShadow='var(--shadow-sm)'" onmouseout="this.style.borderColor='var(--light-gray)';this.style.boxShadow='none'">
          <div style="min-width:0">
            <div style="font-weight:600;font-size:14px;color:var(--charcoal)">${esc(ev.nombre||'')}</div>
            <div style="font-size:12px;color:var(--mid-gray);margin-top:3px">${esc(ev.tipo||'')}${ev.salon?' · '+esc(ev.salon):''}${ev.hora?' · '+esc(ev.hora)+'h':''}${(!isFlor&&ev.asignado)?' · '+esc(ev.asignado):''}</div>
          </div>
          ${estadoBadge(ev.estado)}
        </div>`; }).join('')}
    </div>
    <div class="modal-footer"><button class="btn-primary" onclick="closeModal('eventos-dia-modal');navigate('${isFlor?'checklist':'eventos-comercial'}')">Ver todos</button></div>
  </div>`;
  ov.classList.add('open');
}

export function saveEvent(){
  if(!window._eventosLoaded){ showToast('Los eventos todavía se están cargando — esperá unos segundos e intentá de nuevo.','error'); return; }
  const nombre=document.getElementById('ev-nombre').value.trim();
  if(!validarCampos([
    { id:'ev-nombre', req:true, msg:'Poné un nombre al evento' },
    { id:'ev-fecha', req:true, tipo:'fecha', msg:'Elegí la fecha del evento' },
  ])) return;
  const ev={
    nombre,
    id: (D.eventosData[+document.getElementById('ev-idx').value]?.id) || genEventoId(),
    organizador:document.getElementById('ev-organizador')?.value.trim()||'',
    tipoEvento:document.getElementById('ev-tipo-evento')?.value.trim()||'',
    tipo:document.getElementById('ev-tipo').value||'Social',
    fecha:document.getElementById('ev-fecha').value,
    hora:document.getElementById('ev-hora').value||'',
    zonas: [...evZonasSelected],
    salon: evZonasSelected.join(', '),
    pax:+document.getElementById('ev-pax').value||0,
    presupuesto:+document.getElementById('ev-presupuesto')?.value||0,
    costoEstimado:+document.getElementById('ev-costo-est')?.value||0,
    notas:document.getElementById('ev-notas').value,
    precio:document.getElementById('ev-precio').value||'A confirmar',
    estado:document.getElementById('ev-estado').value,
    asignado:document.getElementById('ev-asignado').value||'',
    colocacionAsignado:document.getElementById('ev-colocacion')?.value||'',
    colocacionFecha:document.getElementById('ev-colocacion-fecha')?.value||'',
    colocacionHora:document.getElementById('ev-colocacion-hora')?.value||'',
    retiroAsignado:document.getElementById('ev-retiro')?.value||'',
    retiroFecha:document.getElementById('ev-retiro-fecha')?.value||'',
    retiroHora:document.getElementById('ev-retiro-hora')?.value||'',
    arreglos: evArreglosRows.filter(r=>r.arreglo&&r.qty>0),
    img: document.getElementById('ev-img-data').value||'',
    inicio: D.eventosData[+document.getElementById('ev-idx').value]?.inicio || '',
    fin: D.eventosData[+document.getElementById('ev-idx').value]?.fin || '',
    colocacionInicio: D.eventosData[+document.getElementById('ev-idx').value]?.colocacionInicio || '',
    colocacionFin: D.eventosData[+document.getElementById('ev-idx').value]?.colocacionFin || '',
    retiroInicio: D.eventosData[+document.getElementById('ev-idx').value]?.retiroInicio || '',
    retiroFin: D.eventosData[+document.getElementById('ev-idx').value]?.retiroFin || '',
    // Flags de "ya se avisó al florista" — se preservan para no re-notificar al editar.
    colocacionAvisada: D.eventosData[+document.getElementById('ev-idx').value]?.colocacionAvisada || '',
    retiroAvisada: D.eventosData[+document.getElementById('ev-idx').value]?.retiroAvisada || ''
  };

  // Descontar stock si el evento se confirma directamente
  if(ev.estado==='Confirmado' || ev.estado==='Pedidos Finalizados'){
    const prevEstado = +document.getElementById('ev-idx').value >= 0
      ? D.eventosData[+document.getElementById('ev-idx').value]?.estado
      : null;
    const wasConfirmed = prevEstado==='Confirmado'||prevEstado==='Pedidos Finalizados';
    if(!wasConfirmed && ev.arreglos.length > 0){
      const descuentos = descontarStockEvento(ev.arreglos);
      if(descuentos.length>0){
        showToast('Stock descontado: '+descuentos.slice(0,3).join(' · ')+(descuentos.length>3?'…':''));
        if(document.getElementById('page-stock').classList.contains('active')) D.renderStock();
      }
    }
  }

  const idx=+document.getElementById('ev-idx').value;
  const prevAsignadoEv = idx >= 0 ? (D.eventosData[idx]?.asignado || '') : '';
  const prevColocEv = idx >= 0 ? (D.eventosData[idx]?.colocacionAsignado || '') : '';
  const prevRetiroEv = idx >= 0 ? (D.eventosData[idx]?.retiroAsignado || '') : '';
  if(idx===-1) D.eventosData.push(ev);
  else D.eventosData[idx]=ev;

  D.closeModal('event-modal');
  _saveEventos();
  if(ev.asignado && ev.asignado !== prevAsignadoEv){
    D.notificarAsignacion(ev.asignado, 'Nuevo evento asignado (armado)', `Se te asignó el armado de "${ev.nombre}"${ev.fecha ? ' · ' + fmtDate(ev.fecha) : ''}`);
  }
  if(ev.colocacionAsignado && ev.colocacionAsignado !== prevColocEv){
    D.notificarAsignacion(ev.colocacionAsignado, 'Colocación asignada', `Te asignaron la colocación de "${ev.nombre}"${ev.fecha ? ' · ' + fmtDate(ev.fecha) : ''}`);
  }
  if(ev.retiroAsignado && ev.retiroAsignado !== prevRetiroEv){
    D.notificarAsignacion(ev.retiroAsignado, 'Retiro asignado', `Te asignaron el retiro de "${ev.nombre}"${ev.fecha ? ' · ' + fmtDate(ev.fecha) : ''} — al finalizar el evento`);
  }
  D.syncEventosToKanban();
  D.fbSave('kanbanData', D.kanbanData);
  renderEventos();
  D.renderHome();
  if(document.getElementById('page-eventos-maison').classList.contains('active')) D.renderKanban();
}

// ── openEventModal ────────────────────────────────────────────────────────────
export function openEventModal(i){
  const isNew = i === -1;
  document.getElementById('event-modal-title').textContent = isNew ? 'Nuevo Evento' : 'Editar Evento';
  document.getElementById('ev-idx').value = i;

  const ev = isNew ? {} : (D.eventosData[i] || {});
  document.getElementById('ev-nombre').value  = ev.nombre  || '';
  const orgInput = document.getElementById('ev-organizador');
  if(orgInput) orgInput.value = ev.organizador || '';
  const tipoEvInput = document.getElementById('ev-tipo-evento');
  if(tipoEvInput) tipoEvInput.value = ev.tipoEvento || '';
  document.getElementById('ev-tipo').value    = ev.tipo    || '';
  document.getElementById('ev-fecha').value   = ev.fecha   || '';
  document.getElementById('ev-hora').value    = ev.hora    || '';
  const _setIf = (id,v)=>{ const el=document.getElementById(id); if(el) el.value = v||''; };
  _setIf('ev-colocacion-fecha', ev.colocacionFecha);
  _setIf('ev-colocacion-hora',  ev.colocacionHora);
  _setIf('ev-retiro-fecha',     ev.retiroFecha);
  _setIf('ev-retiro-hora',      ev.retiroHora);
  document.getElementById('ev-pax').value     = ev.pax     || '';
  if(document.getElementById('ev-presupuesto')) document.getElementById('ev-presupuesto').value = ev.presupuesto||'';
  if(document.getElementById('ev-costo-est')) document.getElementById('ev-costo-est').value = ev.costoEstimado||'';
  document.getElementById('ev-notas').value   = ev.notas   || '';
  document.getElementById('ev-precio').value  = ev.precio  || '';
  document.getElementById('ev-estado').value  = ev.estado  || 'Pedidos Pendientes';

  // Poblar selector de tipo de evento desde eventoPricing
  const tipoSel = document.getElementById('ev-tipo');
  if(tipoSel){
    const tipos = D.eventoPricing?.tipos || [];
    tipoSel.innerHTML = '<option value="">— Seleccionar tipo —</option>' +
      tipos.map(t => `<option value="${esc(t.nombre)}">${esc(t.nombre)}</option>`).join('') +
      '<option value="__otro__">+ Otro (escribir)</option>';
    // Si el tipo actual no está en la lista, agregarlo
    if(ev.tipo && ev.tipo !== '__otro__' && !tipos.find(t=>t.nombre===ev.tipo)){
      const opt = document.createElement('option');
      opt.value = ev.tipo; opt.textContent = ev.tipo;
      tipoSel.insertBefore(opt, tipoSel.lastElementChild);
    }
    tipoSel.value = ev.tipo || '';
  }

  // Poblar selectores de floristas (armado y colocación)
  const floristasEv = typeof D.getFloristasActivos === 'function' ? D.getFloristasActivos() : D.CL_RESP_OPTS.filter(n=>n!=='Jardineria');
  const asigSel = document.getElementById('ev-asignado');
  if(asigSel){
    asigSel.innerHTML = '<option value="">— Sin asignar —</option>' + floristasEv.map(n => `<option value="${esc(n)}"${n===(ev.asignado||'')?' selected':''}>${esc(n)}</option>`).join('');
  }
  const colocSel = document.getElementById('ev-colocacion');
  if(colocSel){
    colocSel.innerHTML = '<option value="">— Sin asignar —</option>' + floristasEv.map(n => `<option value="${esc(n)}"${n===(ev.colocacionAsignado||'')?' selected':''}>${esc(n)}</option>`).join('');
  }
  const retiroSel = document.getElementById('ev-retiro');
  if(retiroSel){
    retiroSel.innerHTML = '<option value="">— Sin asignar —</option>' + floristasEv.map(n => `<option value="${esc(n)}"${n===(ev.retiroAsignado||'')?' selected':''}>${esc(n)}</option>`).join('');
  }

  // Inicializar zonas — compatibilidad con eventos viejos que solo tienen 'salon'
  evZonasSelected = ev.zonas ? [...ev.zonas] : (ev.salon ? [ev.salon] : []);
  renderZonasPicker();

  // Init arreglos rows
  evArreglosRows = [];
  const list = document.getElementById('ev-arreglos-list');
  const preview = document.getElementById('ev-stock-preview');
  if(list) list.innerHTML='';
  if(preview) preview.innerHTML='';
  if(!isNew && ev.arreglos?.length){
    ev.arreglos.forEach(row=>{
      evArreglosRows.push({arreglo:row.arreglo, qty:row.qty});
      addEvArregloRowWithData(row.arreglo, row.qty);
    });
  }

  // restore image
  const evImgData = isNew ? '' : (D.eventosData[i]?.img||'');
  document.getElementById('ev-img-data').value = evImgData;
  const evPreview = document.getElementById('ev-img-preview');
  const evClearBtn = document.getElementById('ev-img-clear');
  if(evImgData){ evPreview.src=evImgData; evPreview.style.display='block'; evClearBtn.style.display='inline-block'; }
  else { evPreview.src=''; evPreview.style.display='none'; evClearBtn.style.display='none'; }
  document.getElementById('event-modal').classList.add('open');
}

export function addEvArregloRowWithData(arreglo, qty){
  const list = document.getElementById('ev-arreglos-list');
  const idx = evArreglosRows.length-1;
  const arregloOpts = [...new Set(D.recetasData.map(r=>r.nombre))]
    .map(n=>`<option value="${esc(n)}"${n===arreglo?' selected':''}>${D.arregloEmoji(n)} ${esc(n)}</option>`).join('');
  const div = document.createElement('div');
  div.className='ev-arreglo-row'; div.id='ev-arr-row-'+idx;
  div.innerHTML=`
    <select onchange="evSetArreglo(${idx},this.value)" style="flex:2;border:1px solid var(--light-gray);border-radius:4px;padding:5px 8px;font-family:'DM Sans',sans-serif;font-size:12.5px;outline:none">
      <option value="">— Tipo de arreglo —</option>${arregloOpts}
    </select>
    <span style="font-size:12px;color:var(--mid-gray)">×</span>
    <input type="number" min="1" value="${qty}" onchange="evSetArregloQty(${idx},this.value)" style="width:60px;border:1px solid var(--light-gray);border-radius:4px;padding:5px 6px;font-size:12.5px;text-align:center;outline:none;font-family:'DM Sans',sans-serif">
    <button type="button" class="btn-icon" style="color:var(--red-alert)" onclick="evRemoveArregloRow(${idx})">✕</button>`;
  list.appendChild(div);
}