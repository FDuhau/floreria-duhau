import { esc } from './utils.js';
import { confirmModal } from './modales.js';
import { comprimirImagen } from './imagenes.js';

// ════════════════════════════════════════
// FOTO DEL RAMO TERMINADO (Ventas Externas)
// ════════════════════════════════════════
// Cuando el florista termina un ramo de una venta, puede sacarle una foto para
// mostrársela al cliente. Para no cargar la base, la foto:
//  - se achica en el dispositivo antes de subirla (~1200px JPEG, ~150 KB);
//  - vive APARTE de ventasData, en `fotosRamo/<idVenta>`, y solo se descarga
//    cuando alguien la abre;
//  - se borra sola a las 48 hs: `fotosRamoMeta/<idVenta>` guarda solo la hora
//    de carga (liviano) y la limpieza la hace el Worker cada hora (cron) y,
//    como respaldo, la app al abrirse. Pasadas las 48 hs la app ya no la
//    muestra aunque la limpieza todavía no haya corrido.
// En la venta queda solo `fotoRamoTs` (número) para pintar el ícono sin
// descargar la foto.

export const FOTO_RAMO_TTL_MS = 48 * 3600 * 1000;

// Viven en app.js; se pasan una sola vez con configurarFotosRamo() al arrancar.
const D = {};
export function configurarFotosRamo(deps){ Object.assign(D, deps); }
const showToast = (...a) => window.showToast?.(...a);
const ventas = () => D.getVentas?.() || [];

export const fotoRamoVigente = (v, ahora = Date.now()) =>
  !!(v && v.fotoRamoTs && ahora - v.fotoRamoTs < FOTO_RAMO_TTL_MS);

// La foto se habilita cuando el ramo está terminado: el florista tocó "Fin"
// o la venta ya figura como entregada (ventas cargadas sin florista).
export const ramoTerminado = v => !!(v && (v.fin || v.estado === 'entregado'));

function _restante(ts){
  const ms = Math.max(0, ts + FOTO_RAMO_TTL_MS - Date.now());
  const h = Math.floor(ms / 3600000);
  if(h >= 1) return `${h} h`;
  return `${Math.max(1, Math.round(ms / 60000))} min`;
}
function _venceTexto(ts){
  const d = new Date(ts + FOTO_RAMO_TTL_MS);
  const fecha = `${d.getDate()}/${d.getMonth()+1}`;
  const hora = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  return `Se borra sola el ${fecha} a las ${hora} (en ${_restante(ts)})`;
}

const _CAM = (w=16) => `<svg viewBox="0 0 24 24" width="${w}" height="${w}" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>`;

// Botón con ícono para la tabla de Ventas Externas.
export function fotoRamoBtn(i, v){
  if(fotoRamoVigente(v)){
    return `<button class="btn-icon" onclick="abrirFotoRamo(${i})" title="Ver foto del ramo · se borra en ${_restante(v.fotoRamoTs)}" style="color:var(--green-ok);position:relative">${_CAM()}<span style="position:absolute;top:2px;right:2px;width:7px;height:7px;border-radius:50%;background:var(--green-ok)"></span></button>`;
  }
  if(ramoTerminado(v)){
    return `<button class="btn-icon" onclick="abrirFotoRamo(${i})" title="Subir foto del ramo terminado (se guarda 48 hs)" style="color:var(--sage-dark)">${_CAM()}</button>`;
  }
  const motivo = v.asignado ? `Se habilita cuando ${v.asignado} termine el ramo` : 'Se habilita cuando el ramo esté asignado y terminado';
  return `<button class="btn-icon" disabled title="${esc(motivo)}" style="color:var(--mid-gray);opacity:.35;cursor:not-allowed">${_CAM()}</button>`;
}

// ── Subida ────────────────────────────────────────────────────────────────────
function _input(cb){
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.style.display = 'none';
  inp.onchange = () => { const f = inp.files && inp.files[0]; inp.remove(); if(f) cb(f); };
  document.body.appendChild(inp);
  inp.click();
}
const _comprimir = (file, max, q) => new Promise(res => comprimirImagen(file, max, q, res));

// Abre el selector de archivo/cámara (tiene que llamarse desde un toque).
export function elegirFotoRamo(i){
  _input(file => subirFotoRamo(i, file));
}

export async function subirFotoRamo(i, file){
  const v = ventas()[i]; if(!v) return;
  if(!/^image\//i.test(file.type || '')){ showToast('Elegí una imagen.', 'error'); return; }
  if(!window.fbUpdate){ showToast('Sin conexión con la base. Probá de nuevo.', 'error'); return; }
  showToast('Subiendo foto del ramo…');
  let data = await _comprimir(file, 1200, 0.72);
  if(data.length > 600000) data = await _comprimir(file, 900, 0.6);
  if(!v.id){ v.id = D.genId(); }
  const ts = Date.now();
  try{
    // Foto y marca de tiempo juntas: o se guardan las dos o ninguna.
    await window.fbUpdate('', {
      ['fotosRamo/' + v.id]: { data, ts, por: window.currentUserLabel || '', venta: v.prod || '' },
      ['fotosRamoMeta/' + v.id]: ts,
    });
  }catch(e){ showToast('No se pudo subir la foto. Probá de nuevo.', 'error'); return; }
  _cache.set(v.id, data);
  v.fotoRamoTs = ts;
  D.fbSave('ventasData', ventas());
  D.onCambio?.();
  showToast('Foto del ramo guardada · se borra sola en 48 hs');
  abrirFotoRamo(i);
}

export async function eliminarFotoRamo(i){
  const v = ventas()[i]; if(!v || !v.id) return;
  if(!await confirmModal('¿Eliminar la foto de este ramo?')) return;
  try{ await window.fbUpdate('', { ['fotosRamo/' + v.id]: null, ['fotosRamoMeta/' + v.id]: null }); }
  catch(e){ showToast('No se pudo eliminar. Probá de nuevo.', 'error'); return; }
  _cache.delete(v.id);
  delete v.fotoRamoTs;
  D.fbSave('ventasData', ventas());
  D.onCambio?.();
  window.closeModal?.('foto-ramo-modal');
  showToast('Foto eliminada');
}

// ── Ver / compartir ───────────────────────────────────────────────────────────
const _cache = new Map(); // idVenta -> dataURL (solo en memoria, no en el dispositivo)
async function _leer(v){
  if(_cache.has(v.id)) return _cache.get(v.id);
  const f = await window.fbGetOnce?.('fotosRamo/' + v.id).catch(() => null);
  const data = (f && f.ts && Date.now() - f.ts < FOTO_RAMO_TTL_MS) ? f.data : '';
  if(data) _cache.set(v.id, data);
  return data;
}

function _modal(html){
  let ov = document.getElementById('foto-ramo-modal');
  if(!ov){ ov = document.createElement('div'); ov.id = 'foto-ramo-modal'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="modal" style="max-width:480px">
    <button class="modal-close" onclick="closeModal('foto-ramo-modal')">✕</button>${html}</div>`;
  ov.classList.add('open');
  return ov;
}
function _titulo(v){
  return `<div class="modal-title">Foto del ramo</div>
    <div style="font-size:12.5px;color:var(--mid-gray);margin:-6px 0 14px">${esc(v.prod || 'Venta')}${v.cliente ? ' · ' + esc(v.cliente) : ''}${v.asignado ? ' · armó ' + esc(v.asignado) : ''}</div>`;
}

export async function abrirFotoRamo(i){
  const v = ventas()[i]; if(!v) return;
  if(!fotoRamoVigente(v)){
    _modal(`${_titulo(v)}
      <div style="border:2px dashed var(--light-gray);border-radius:12px;padding:28px 16px;text-align:center;color:var(--mid-gray)">
        <div style="color:var(--sage-dark);margin-bottom:8px">${_CAM(34)}</div>
        <div style="font-size:13.5px;line-height:1.5">Sacale una foto al ramo terminado para mostrársela al cliente.<br><span style="font-size:12px">Se guarda 48 hs y después se borra sola.</span></div>
      </div>
      <div class="modal-actions" style="margin-top:16px">
        <button class="btn-secondary" onclick="closeModal('foto-ramo-modal')">Cerrar</button>
        <button class="btn-add" onclick="elegirFotoRamo(${i})">Subir foto</button>
      </div>`);
    return;
  }
  const ov = _modal(`${_titulo(v)}<div style="padding:40px;text-align:center;color:var(--mid-gray);font-size:13px">Cargando foto…</div>`);
  const data = await _leer(v);
  if(!ov.classList.contains('open')) return;
  if(!data){
    _modal(`${_titulo(v)}<div style="padding:24px;text-align:center;color:var(--mid-gray);font-size:13px">La foto ya no está disponible (pasaron 48 hs o se eliminó).</div>
      <div class="modal-actions"><button class="btn-secondary" onclick="closeModal('foto-ramo-modal')">Cerrar</button><button class="btn-add" onclick="elegirFotoRamo(${i})">Subir otra</button></div>`);
    return;
  }
  const puedeCompartir = !!navigator.canShare;
  _modal(`${_titulo(v)}
    <img src="${data}" alt="Foto del ramo" style="width:100%;max-height:60vh;object-fit:contain;border-radius:10px;background:#F4F2EE;cursor:zoom-in" onclick="openRamoPhoto(this.src, '${esc((v.prod||'Ramo').replace(/'/g,''))}')">
    <div style="font-size:11.5px;color:var(--mid-gray);margin-top:8px;text-align:center">${esc(_venceTexto(v.fotoRamoTs))}</div>
    <div class="modal-actions" style="margin-top:14px;flex-wrap:wrap;gap:8px">
      <button class="btn-secondary" style="color:var(--red-alert)" onclick="eliminarFotoRamo(${i})">Eliminar</button>
      <button class="btn-secondary" onclick="elegirFotoRamo(${i})">Reemplazar</button>
      <button class="btn-add" onclick="compartirFotoRamo(${i})">${puedeCompartir ? 'Enviar al cliente' : 'Descargar'}</button>
    </div>`);
}

export async function compartirFotoRamo(i){
  const v = ventas()[i]; if(!v) return;
  const data = await _leer(v); if(!data){ showToast('La foto ya no está disponible.', 'error'); return; }
  const nombre = `ramo-${(v.cliente || v.prod || 'cliente').replace(/[^\w-]+/g, '-').toLowerCase()}.jpg`;
  const blob = await (await fetch(data)).blob();
  const file = new File([blob], nombre, { type: 'image/jpeg' });
  if(navigator.canShare && navigator.canShare({ files: [file] })){
    try{ await navigator.share({ files: [file], title: 'Tu ramo · Florería Duhau' }); return; }
    catch(e){ if(e && e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// Al terminar un ramo (botón "Fin" del florista): ofrecer sacarle la foto.
export function ofrecerFotoRamo(i){
  const v = ventas()[i]; if(!v) return;
  _modal(`<div class="modal-title">¡Ramo terminado!</div>
    <div style="font-size:13.5px;line-height:1.5;margin-bottom:6px">¿Le sacás una foto a <strong>${esc(v.prod || 'el ramo')}</strong>${v.cliente ? ' de ' + esc(v.cliente) : ''} para mostrársela al cliente?</div>
    <div style="font-size:12px;color:var(--mid-gray)">Se guarda 48 hs y después se borra sola.</div>
    <div class="modal-actions" style="margin-top:16px">
      <button class="btn-secondary" onclick="closeModal('foto-ramo-modal')">Ahora no</button>
      <button class="btn-add" onclick="closeModal('foto-ramo-modal');elegirFotoRamo(${i})">${_CAM()} Sacar foto</button>
    </div>`);
}

// ── Limpieza (respaldo del cron del Worker) ───────────────────────────────────
// Lee solo las marcas de tiempo (unos bytes por foto) y borra las vencidas.
export async function limpiarFotosRamoVencidas(){
  if(!window.fbGetOnce || !window.fbUpdate) return;
  let meta;
  try{ meta = await window.fbGetOnce('fotosRamoMeta'); }catch(e){ return; }
  if(!meta || typeof meta !== 'object') return;
  const ahora = Date.now(), borrar = {};
  for(const [id, ts] of Object.entries(meta)){
    if(!(typeof ts === 'number') || ahora - ts >= FOTO_RAMO_TTL_MS){
      borrar['fotosRamo/' + id] = null;
      borrar['fotosRamoMeta/' + id] = null;
      _cache.delete(id);
    }
  }
  if(Object.keys(borrar).length) window.fbUpdate('', borrar).catch(() => {});
}
