import { esc } from './utils.js';
import { confirmModal } from './modales.js';

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
// En la venta queda `fotoRamoTs` (número) como registro permanente de que el
// ramo tuvo foto, aunque la foto ya se haya borrado.
//
// Guardado (nov-2026): la foto, su hora en fotosRamoMeta y la marca en la venta
// viajan en UNA sola escritura y después se relee la base para confirmar que
// quedó guardada. Antes la marca se guardaba aparte y los errores de escritura
// se tragaban en silencio, así que el florista veía "guardada" sin que lo
// estuviera. Si el celular cierra la app mientras saca la foto (Android lo hace
// seguido con la cámara), al volver se le avisa que no se guardó.

export const FOTO_RAMO_TTL_MS = 48 * 3600 * 1000;

// fotosRamoMeta llega por un listener (pesa unos bytes): es la fuente de verdad
// de qué fotos existen hoy. Hasta que llega se usa la marca de la venta.
let _meta = {}, _metaCargado = false;
export function setFotosRamoMeta(val){
  _meta = (val && typeof val === 'object') ? val : {};
  _metaCargado = true;
}

// Viven en app.js; se pasan una sola vez con configurarFotosRamo() al arrancar.
const D = {};
export function configurarFotosRamo(deps){ Object.assign(D, deps); }
const showToast = (...a) => window.showToast?.(...a);
const ventas = () => D.getVentas?.() || [];

// Hora de carga de la foto vigente de la venta (0 si no tiene).
export function fotoRamoTs(v){
  if(!v) return 0;
  if(_metaCargado && v.id){ const t = _meta[v.id]; return typeof t === 'number' ? t : 0; }
  return typeof v.fotoRamoTs === 'number' ? v.fotoRamoTs : 0;
}
export const fotoRamoVigente = (v, ahora = Date.now()) => {
  const ts = fotoRamoTs(v);
  return !!(ts && ahora - ts < FOTO_RAMO_TTL_MS);
};
// El ramo tuvo foto alguna vez (aunque ya se haya borrado a las 48 hs).
export const fotoRamoHubo = v => !!(v && (v.fotoRamoTs || fotoRamoTs(v)));

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

// Botón para la tabla y las tarjetas de Ventas Externas. Con foto se ve como
// una etiqueta verde "Foto ✓" para saber de un vistazo qué ramos la tienen.
const _CHECK = `<svg viewBox="0 0 24 24" width="12" height="12" style="stroke:currentColor;stroke-width:2.6;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-1px"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
export function fotoRamoBtn(i, v){
  if(fotoRamoVigente(v)){
    return `<button class="foto-ramo-pill ok" onclick="abrirFotoRamo(${i})" title="Tiene foto del ramo · se borra en ${_restante(fotoRamoTs(v))}">${_CAM(14)}Foto ${_CHECK}</button>`;
  }
  if(fotoRamoHubo(v)){
    return `<button class="foto-ramo-pill old" onclick="abrirFotoRamo(${i})" title="Tuvo foto del ramo (ya se borró a las 48 hs)">${_CAM(14)}Tuvo foto</button>`;
  }
  if(ramoTerminado(v)){
    return `<button class="btn-icon" onclick="abrirFotoRamo(${i})" title="Sin foto · subir foto del ramo terminado (se guarda 48 hs)" style="color:var(--sage-dark)">${_CAM()}</button>`;
  }
  const motivo = v.asignado ? `Se habilita cuando ${v.asignado} termine el ramo` : 'Se habilita cuando el ramo esté asignado y terminado';
  return `<button class="btn-icon" disabled title="${esc(motivo)}" style="color:var(--mid-gray);opacity:.35;cursor:not-allowed">${_CAM()}</button>`;
}

// ── Subida ────────────────────────────────────────────────────────────────────
const PEND_KEY = 'fd-foto-ramo-pendiente';
const _pendLeer = () => { try{ return JSON.parse(localStorage.getItem(PEND_KEY) || 'null'); }catch(e){ return null; } };
const _pendGuardar = p => { try{ if(p) localStorage.setItem(PEND_KEY, JSON.stringify(p)); else localStorage.removeItem(PEND_KEY); }catch(e){ /* sin almacenamiento */ } };

// Deja registro de por qué falló una subida (unos bytes) para poder revisarlo.
function _diag(paso, v, err){
  try{
    const k = Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    window.fbSetPath?.('fotosRamoDiag/' + k, {
      paso, id: (v && v.id) || '', venta: (v && v.prod) || '', por: window.currentUserLabel || '',
      err: String((err && (err.message || err.code)) || err || '').slice(0, 200),
      ua: (navigator.userAgent || '').slice(0, 160), online: navigator.onLine !== false, ts: Date.now(),
    });
  }catch(e){ /* nada */ }
}

function _input(cb, onCancel){
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.style.display = 'none';
  inp.onchange = () => { const f = inp.files && inp.files[0]; inp.remove(); if(f) cb(f); else onCancel?.(); };
  inp.addEventListener('cancel', () => { inp.remove(); onCancel?.(); });
  document.body.appendChild(inp);
  inp.click();
}

// Achica la foto. Rechaza si el celular no la puede leer (p. ej. HEIC en
// Android) en vez de quedarse colgada para siempre.
function _comprimir(file, max, q){
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const t = setTimeout(() => { URL.revokeObjectURL(url); rej(new Error('timeout al leer la foto')); }, 30000);
    img.onload = () => {
      clearTimeout(t);
      try{
        const esc_ = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * esc_));
        c.height = Math.max(1, Math.round(img.height * esc_));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const data = c.toDataURL('image/jpeg', q);
        URL.revokeObjectURL(url);
        if(!/^data:image\/jpeg/.test(data) || data.length < 1000) rej(new Error('foto vacía'));
        else res(data);
      }catch(e){ URL.revokeObjectURL(url); rej(e); }
    };
    img.onerror = () => { clearTimeout(t); URL.revokeObjectURL(url); rej(new Error('formato no soportado (' + (file.type || 'sin tipo') + ')')); };
    img.src = url;
  });
}

const _conTiempo = (p, ms, msg) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms))]);
const _idx = id => ventas().findIndex(x => x && x.id === id);

// Abre el selector de archivo/cámara (tiene que llamarse desde un toque).
export function elegirFotoRamo(i){
  const v = ventas()[i]; if(!v) return;
  // La venta necesita un id fijo para atarle la foto (las viejas no tenían).
  if(!v.id){ v.id = D.genId(); D.fbSave('ventasData', ventas()); }
  _pendGuardar({ id: v.id, prod: v.prod || '', t: Date.now() });
  _input(file => subirFotoRamo(_idx(v.id), file), () => _pendGuardar(null));
}

function _subiendo(v, texto){
  _modal(`${_titulo(v)}
    <div style="padding:28px 12px;text-align:center">
      <div class="foto-ramo-spin"></div>
      <div style="font-size:14px;font-weight:600;margin-top:14px">${esc(texto)}</div>
      <div style="font-size:12px;color:var(--mid-gray);margin-top:6px">No cierres la app hasta que diga "Guardada".</div>
    </div>`, { sinCerrar: true });
}

function _errorSubida(i, v, msg){
  _modal(`${_titulo(v)}
    <div style="background:#FBEDEA;color:var(--red-alert);border-radius:10px;padding:14px 16px;font-size:13.5px;line-height:1.5">
      <strong>La foto NO se guardó.</strong><br>${esc(msg)}
    </div>
    <div class="modal-actions" style="margin-top:16px">
      <button class="btn-secondary" onclick="closeModal('foto-ramo-modal')">Cerrar</button>
      <button class="btn-add" onclick="elegirFotoRamo(${i})">Probar de nuevo</button>
    </div>`);
}

export async function subirFotoRamo(i, file){
  let v = ventas()[i]; if(!v || !v.id) return;
  const id = v.id;
  if(file.type && !/^image\//i.test(file.type)){ _pendGuardar(null); _errorSubida(i, v, 'El archivo elegido no es una imagen.'); return; }
  if(!window.fbUpdate || !window.fbGetOnce){ _errorSubida(i, v, 'Sin conexión con la base. Revisá el wifi y probá de nuevo.'); _diag('sin-fb', v); return; }

  _subiendo(v, 'Preparando la foto…');
  let data;
  try{
    data = await _comprimir(file, 1200, 0.72);
    if(data.length > 600000) data = await _comprimir(file, 900, 0.6);
  }catch(e){
    _diag('comprimir', v, e);
    _errorSubida(i, v, 'El celular no pudo leer esa foto. Sacala de nuevo con la cámara (no desde la galería) y volvé a subirla.');
    return;
  }

  _subiendo(v, 'Guardando la foto…');
  const ts = Date.now();
  const por = window.currentUserLabel || '';
  try{
    // La venta puede haber cambiado de posición mientras tanto: se busca por id.
    const idx = _idx(id);
    if(idx < 0) throw new Error('la venta ya no existe');
    // Foto, hora y marca en la venta, juntas: o se guardan todas o ninguna.
    await _conTiempo(window.fbUpdate('', {
      ['fotosRamo/' + id]: { data, ts, por, venta: v.prod || '' },
      ['fotosRamoMeta/' + id]: ts,
      ['ventasData/' + idx + '/fotoRamoTs']: ts,
      ['ventasData/' + idx + '/fotoRamoPor']: por,
    }), 90000, 'la subida tardó demasiado');
    // fbUpdate no avisa si la base rechazó la escritura: se confirma releyendo.
    const enBase = await _conTiempo(window.fbGetOnce('fotosRamoMeta/' + id), 20000, 'no se pudo confirmar');
    if(enBase !== ts) throw new Error('la base no la tiene');
  }catch(e){
    _diag('guardar', v, e);
    _errorSubida(i, v, navigator.onLine === false
      ? 'El celular está sin conexión. Conectate al wifi y probá de nuevo.'
      : 'No se pudo guardar en la base (' + (e.message || 'error') + '). Probá de nuevo.');
    return;
  }

  _pendGuardar(null);
  _cache.set(id, data);
  _meta = { ..._meta, [id]: ts };
  const i2 = _idx(id);
  v = ventas()[i2] || v;
  v.fotoRamoTs = ts; v.fotoRamoPor = por;
  D.onCambio?.();
  showToast('Foto del ramo guardada', 'success');
  abrirFotoRamo(i2 >= 0 ? i2 : i, { recien: true });
}

// Si la app se cerró mientras el florista sacaba la foto (Android suele cerrar
// la pestaña al abrir la cámara), avisar al volver que no se guardó.
export function revisarFotoRamoPendiente(){
  const p = _pendLeer(); if(!p || !p.id) return;
  if(Date.now() - (p.t || 0) > 3 * 3600 * 1000){ _pendGuardar(null); return; }
  const i = _idx(p.id);
  if(i < 0){ _pendGuardar(null); return; }
  const v = ventas()[i];
  if(fotoRamoTs(v) >= (p.t || 0)){ _pendGuardar(null); return; }
  _pendGuardar(null);
  _diag('app-cerrada', v, 'la app se cerró antes de guardar');
  _modal(`<div class="modal-title">La foto no se guardó</div>
    <div style="font-size:13.5px;line-height:1.5">La app se cerró mientras sacabas la foto de <strong>${esc(v.prod || 'el ramo')}</strong>${v.cliente ? ' de ' + esc(v.cliente) : ''}, así que no quedó guardada.</div>
    <div class="modal-actions" style="margin-top:16px">
      <button class="btn-secondary" onclick="closeModal('foto-ramo-modal')">Ahora no</button>
      <button class="btn-add" onclick="elegirFotoRamo(${i})">${_CAM()} Sacarla de nuevo</button>
    </div>`);
}

export async function eliminarFotoRamo(i){
  const v = ventas()[i]; if(!v || !v.id) return;
  if(!await confirmModal('¿Eliminar la foto de este ramo?')) return;
  const idx = _idx(v.id);
  const upd = { ['fotosRamo/' + v.id]: null, ['fotosRamoMeta/' + v.id]: null };
  if(idx >= 0){ upd['ventasData/' + idx + '/fotoRamoTs'] = null; upd['ventasData/' + idx + '/fotoRamoPor'] = null; }
  try{ await window.fbUpdate('', upd); }
  catch(e){ showToast('No se pudo eliminar. Probá de nuevo.', 'error'); return; }
  _cache.delete(v.id);
  const m = { ..._meta }; delete m[v.id]; _meta = m;
  delete v.fotoRamoTs; delete v.fotoRamoPor;
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

function _modal(html, { sinCerrar = false } = {}){
  let ov = document.getElementById('foto-ramo-modal');
  if(!ov){ ov = document.createElement('div'); ov.id = 'foto-ramo-modal'; ov.className = 'modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="modal" style="max-width:480px">
    ${sinCerrar ? '' : `<button class="modal-close" onclick="closeModal('foto-ramo-modal')">✕</button>`}${html}</div>`;
  ov.classList.add('open');
  return ov;
}
function _titulo(v){
  return `<div class="modal-title">Foto del ramo</div>
    <div style="font-size:12.5px;color:var(--mid-gray);margin:-6px 0 14px">${esc(v.prod || 'Venta')}${v.cliente ? ' · ' + esc(v.cliente) : ''}${v.asignado ? ' · armó ' + esc(v.asignado) : ''}</div>`;
}

export async function abrirFotoRamo(i, { recien = false } = {}){
  const v = ventas()[i]; if(!v) return;
  if(!fotoRamoVigente(v)){
    const aviso = fotoRamoHubo(v)
      ? `<div style="background:#F4F2EE;border-radius:10px;padding:10px 14px;font-size:12.5px;color:var(--charcoal);margin-bottom:12px">Este ramo tuvo foto${v.fotoRamoPor ? ' (la subió ' + esc(v.fotoRamoPor) + ')' : ''}, pero ya se borró porque pasaron 48 hs.</div>`
      : '';
    _modal(`${_titulo(v)}${aviso}
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
    ${recien ? `<div class="foto-ramo-ok">${_CHECK} Guardada</div>` : ''}
    <div style="font-size:12px;color:var(--mid-gray);margin-top:8px;text-align:center">${v.fotoRamoPor ? 'Subida por ' + esc(v.fotoRamoPor) + ' · ' : ''}${esc(_venceTexto(fotoRamoTs(v)))}</div>
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
// La marca fotoRamoTs de la venta queda: es el registro de que hubo foto.
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
