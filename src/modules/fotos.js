import { confirmModal } from './modales.js';
import { esc } from './utils.js';

// Estos viven en app.js y se leen por window al momento de usarlos.
const showToast = (...a) => window.showToast?.(...a);
const _hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

// ════════════════════════════════════════
// FOTOS FUERA DE LOS DATOS (bajar la descarga de Firebase)
// ════════════════════════════════════════
// Las fotos (base64) eran ~90% de la base y viajaban en cada apertura de la
// app. Ahora cada foto vive en `fotos/<id>` y en el registro queda la
// referencia "fbimg:<id>". La foto se descarga solo cuando una <img> la
// muestra en pantalla, y queda guardada en el dispositivo (IndexedDB): cada
// foto se baja una sola vez por celular/PC.
// La conversión de fotos nuevas se activa recién cuando gerencia corre la
// migración (fotosConfig/activo = true). Hasta entonces todo queda como antes.
const FOTO_REF = 'fbimg:';
const FOTO_MIN = 1500; // data: más cortos que esto no vale la pena separarlos
let _fotosActivo = false;
window._setFotosConfig = v => { _fotosActivo = !!(v && v.activo); };
export const fotosActivo = () => _fotosActivo;
const _fotosSubidas = new Set();
const _fotoMem = new Map(); // id -> dataURL | Promise<dataURL>

// Id estable por contenido (misma foto → mismo id, no se duplica)
function _fotoId(s){
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for(let i=0; i<s.length; i++){ const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
  h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
  return (h2>>>0).toString(36) + (h1>>>0).toString(36) + s.length.toString(36);
}
const _esFotoInline = v => typeof v === 'string' && v.length > FOTO_MIN && v.startsWith('data:');
const esFotoRef = v => typeof v === 'string' && v.startsWith(FOTO_REF);

// Recorre un valor y reemplaza cada foto inline por su referencia.
// onFoto(id, dataURL) se llama por cada foto encontrada.
function _separarFotos(v, onFoto){
  if(_esFotoInline(v)){ const id = _fotoId(v); onFoto(id, v); return FOTO_REF + id; }
  if(Array.isArray(v)) return v.map(x => _separarFotos(x, onFoto));
  if(v && typeof v === 'object'){ const o = {}; for(const k in v) o[k] = _separarFotos(v[k], onFoto); return o; }
  return v;
}
// Para fbSave: sube las fotos nuevas (antes que el registro: Firebase aplica
// las escrituras en orden) y devuelve el dato con referencias.
export function _fotosParaGuardar(key, plain){
  if(!_fotosActivo || key === 'fotos') return plain;
  return _separarFotos(plain, (id, data) => {
    _fotoMem.set(id, data); _fotoIdbPut(id, data);
    if(!_fotosSubidas.has(id)){ _fotosSubidas.add(id); window.fbSetPath?.('fotos/'+id, data); }
  });
}

// ── Caché local (IndexedDB) ──
let _fotoIdb = null;
function _fotoIdbOpen(){
  if(_fotoIdb) return _fotoIdb;
  _fotoIdb = new Promise(res => {
    try{
      const rq = indexedDB.open('fd-fotos', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('f');
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => res(null);
    }catch(e){ res(null); }
  });
  return _fotoIdb;
}
async function _fotoIdbGet(id){
  const db = await _fotoIdbOpen(); if(!db) return null;
  return new Promise(res => { try{ const rq = db.transaction('f').objectStore('f').get(id); rq.onsuccess = () => res(rq.result || null); rq.onerror = () => res(null); }catch(e){ res(null); } });
}
async function _fotoIdbPut(id, data){
  const db = await _fotoIdbOpen(); if(!db) return;
  try{ db.transaction('f','readwrite').objectStore('f').put(data, id); }catch(e){}
}

// Devuelve el dataURL de una referencia (o el valor tal cual si no lo es)
export function resolverFoto(v){
  if(!esFotoRef(v)) return Promise.resolve(v);
  const id = v.slice(FOTO_REF.length);
  if(_fotoMem.has(id)) return Promise.resolve(_fotoMem.get(id));
  const p = (async () => {
    let data = await _fotoIdbGet(id);
    if(!data && window.fbGetOnce){
      data = await window.fbGetOnce('fotos/'+id).catch(()=>null);
      if(data) _fotoIdbPut(id, data);
    }
    if(data) _fotoMem.set(id, data); else _fotoMem.delete(id);
    return data || '';
  })();
  _fotoMem.set(id, p);
  return p;
}
window.resolverFoto = resolverFoto;

// ── <img src="fbimg:..."> se resuelven solas al acercarse a la pantalla ──
const _FOTO_VACIA = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const _fotoIO = ('IntersectionObserver' in window) ? new IntersectionObserver(entries => {
  entries.forEach(en => { if(en.isIntersecting){ _fotoIO.unobserve(en.target); _cargarImg(en.target); } });
}, { rootMargin: '300px' }) : null;
function _cargarImg(img){
  const ref = img.dataset.fbimg; if(!ref) return;
  resolverFoto(ref).then(data => { if(img.dataset.fbimg === ref && data) img.src = data; });
}
function _prepararImg(img){
  const src = img.getAttribute('src');
  if(!esFotoRef(src)) return;
  img.dataset.fbimg = src;
  img.setAttribute('src', _FOTO_VACIA);
  if(_fotoIO) _fotoIO.observe(img); else _cargarImg(img);
}
function _revisarFotos(nodo){
  if(nodo.nodeType !== 1) return;
  if(nodo.tagName === 'IMG') _prepararImg(nodo);
  nodo.querySelectorAll?.('img[src^="'+FOTO_REF+'"]').forEach(_prepararImg);
}
new MutationObserver(muts => {
  for(const m of muts){
    if(m.type === 'attributes') _prepararImg(m.target);
    else m.addedNodes.forEach(_revisarFotos);
  }
}).observe(document.documentElement, { subtree:true, childList:true, attributes:true, attributeFilter:['src'] });

// ── Migración de fotos existentes (gerencia, una vez) ────────────────────────
// 1) Descarga un respaldo completo de la base (JSON).
// 2) Copia cada foto a fotos/<id> y la VERIFICA leyéndola de vuelta.
// 3) Con confirmación, reemplaza en cada registro la foto por su referencia
//    (solo si ese dato no cambió mientras tanto). No se borra ninguna foto.
// 4) Activa fotosConfig/activo: desde ahí las fotos nuevas se guardan aparte.
function _migrarFotosUI(html){
  let ov = document.getElementById('migrar-fotos-ov');
  if(!ov){ ov = document.createElement('div'); ov.id = 'migrar-fotos-ov'; ov.className = 'modal-overlay open'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="modal" style="max-width:460px"><div class="modal-title">Mover fotos fuera de los datos</div><div style="font-size:13px;line-height:1.5">${html}</div></div>`;
  return ov;
}
export async function migrarFotos(){
  if(window.userRole !== 'gerencia'){ showToast('Solo gerencia.','error'); return; }
  if(!window.fbGetOnce){ showToast('Firebase todavía no está listo.','error'); return; }
  if(!await confirmModal('Mover las fotos fuera de los datos\n\n1) Se descarga un respaldo completo de la base (archivo JSON de ~45 MB).\n2) Cada foto se copia a su propio lugar y se verifica.\n3) Te pido confirmación y recién entonces, en cada registro, la foto se reemplaza por una referencia.\n\nNo se borra ninguna foto. Conviene hacerlo cuando nadie esté usando la app (tarda unos minutos) y con todos los dispositivos ya actualizados.\n\n¿Empezar?')) return;
  const SKIP = new Set(['fotos','fotosIndex','fotosConfig','safeMeta','loginAuth','loginPasswords','pushSubs','pushBroadcast','auditLog']);
  let root;
  try{
    _migrarFotosUI('Descargando la base para el respaldo…');
    // Sección por sección, sin bajar fotos/ (si la migración se repite, las
    // fotos ya copiadas no se vuelven a descargar). Si no se pueden listar
    // las secciones, se baja la base entera como antes.
    let claves = null;
    try{ claves = window.fbTopKeys ? await window.fbTopKeys() : null; }catch(e){ claves = null; }
    if(claves){
      root = {};
      const aBajar = claves.filter(k => !SKIP.has(k));
      for(let n=0; n<aBajar.length; n++){
        _migrarFotosUI(`Descargando la base para el respaldo… sección ${n+1} de ${aBajar.length}`);
        root[aBajar[n]] = await window.fbGetOnce(aBajar[n]);
      }
    } else {
      root = await window.fbGetOnce('/');
    }
  }catch(e){ _migrarFotosUI('No se pudo leer la base (¿sin conexión?). No se cambió nada.<br><br><button class="btn-secondary" onclick="closeModal(\'migrar-fotos-ov\')">Cerrar</button>'); return; }

  // 1) Respaldo completo
  try{
    const blob = new Blob([JSON.stringify(root)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `respaldo-completo-antes-de-fotos-${_hoy()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
  }catch(e){}

  // 2) Encontrar fotos inline
  const hojas = []; // { path, data, id }
  const unicas = new Map();
  const recorrer = (v, path) => {
    if(_esFotoInline(v)){ const id = _fotoId(v); hojas.push({ path, data:v, id }); unicas.set(id, v); return; }
    if(v && typeof v === 'object') for(const k of Object.keys(v)) recorrer(v[k], path+'/'+k);
  };
  Object.keys(root||{}).forEach(k => { if(!SKIP.has(k)) recorrer(root[k], k); });
  if(!hojas.length){
    window.fbSetPath('fotosConfig', { activo:true, fecha:new Date().toISOString(), fotos:0 });
    _migrarFotosUI('No hay fotos para mover. Listo: las fotos nuevas ya se guardan aparte.<br><br><button class="btn-add" onclick="closeModal(\'migrar-fotos-ov\')">Cerrar</button>');
    return;
  }
  const mb = [...unicas.values()].reduce((a,x)=>a+x.length,0)/1e6;

  // 3) Copiar y verificar cada foto. fotosIndex/<id> marca las ya copiadas y
  //    verificadas: si la migración se corta y se repite, no se copian de nuevo.
  const conTiempo = (p, ms) => Promise.race([p, new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')), ms))]);
  let yaCopiadas = {};
  try{ yaCopiadas = (await conTiempo(window.fbGetOnce('fotosIndex'), 30000)) || {}; }catch(e){}
  let i = 0, fallas = 0, mbHechos = 0;
  for(const [id, data] of unicas){
    i++; mbHechos += data.length/1e6;
    if(yaCopiadas[id]) continue;
    _migrarFotosUI(`Copiando y verificando fotos… ${i} de ${unicas.size}<br><span style="color:var(--mid-gray);font-size:12px">${mbHechos.toFixed(1)} de ${mb.toFixed(1)} MB</span>`);
    try{
      await conTiempo(window.fbSetPath('fotos/'+id, data), 120000);
      const leida = await conTiempo(window.fbGetOnce('fotos/'+id), 120000);
      if(leida !== data){ fallas++; continue; }
      window.fbSetPath('fotosIndex/'+id, true);
    }catch(e){ fallas++; }
  }
  if(fallas){
    _migrarFotosUI(`⚠️ ${fallas} foto${fallas!==1?'s':''} no se pudieron verificar. <strong>No se reemplazó nada</strong> en los registros. Probá de nuevo con buena conexión (las ya copiadas no se vuelven a copiar).<br><br><button class="btn-secondary" onclick="closeModal('migrar-fotos-ov')">Cerrar</button>`);
    return;
  }
  document.getElementById('migrar-fotos-ov')?.remove();
  if(!await confirmModal(`Se copiaron y verificaron ${unicas.size} fotos (${mb.toFixed(1)} MB), usadas en ${hojas.length} registros.\n\nÚltimo paso: en cada registro la foto se reemplaza por una referencia a su copia. Las fotos se siguen viendo igual.\n\n¿Reemplazar ahora?`)){
    showToast('Migración pausada: las copias quedaron guardadas, los registros no se tocaron.');
    return;
  }

  // 4) Reemplazar sección por sección: se relee cada sección justo antes y solo
  //    se reemplaza la foto si ese dato sigue igual que en el respaldo.
  let hechas = 0, saltadas = 0;
  const porNodo = new Map();
  hojas.forEach(h => { const n = h.path.split('/')[0]; if(!porNodo.has(n)) porNodo.set(n, []); porNodo.get(n).push(h); });
  const leerRuta = (obj, path) => path.split('/').slice(1).reduce((o,k)=> (o==null ? o : o[k]), obj);
  let nNodo = 0;
  for(const [nodo, hs] of porNodo){
    nNodo++;
    _migrarFotosUI(`Reemplazando fotos por referencias… sección ${nNodo} de ${porNodo.size} (${esc(nodo)})<br><span style="color:var(--mid-gray);font-size:12px">${hechas} de ${hojas.length} fotos listas</span>`);
    let actual;
    try{ actual = await conTiempo(window.fbGetOnce(nodo), 180000); }
    catch(e){ saltadas += hs.length; continue; }
    const lote = {};
    hs.forEach(h => { if(leerRuta(actual, h.path) === h.data){ lote[h.path] = FOTO_REF + h.id; hechas++; } else saltadas++; });
    if(Object.keys(lote).length){
      try{ await conTiempo(window.fbUpdate('', lote), 60000); }
      catch(e){ /* la escritura queda en cola y se aplica sola al reconectar */ }
    }
  }
  window.fbSetPath('fotosConfig', { activo:true, fecha:new Date().toISOString(), fotos:unicas.size });
  _migrarFotosUI(`✅ Listo. ${hechas} foto${hechas!==1?'s':''} movida${hechas!==1?'s':''}${saltadas?` · ${saltadas} no se pudieron mover ahora (cambiaron durante la migración o se cortó la conexión): volvé a tocar el botón para completarlas`:''}.<br><br>Desde ahora las fotos nuevas se guardan aparte y cada dispositivo descarga cada foto una sola vez.<br><br><button class="btn-add" onclick="closeModal('migrar-fotos-ov')">Cerrar</button>`);
}
