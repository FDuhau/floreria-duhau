import { esc } from './utils.js';
import { confirmModal } from './modales.js';
import { showToast } from './tema-toast.js';
import { comprimirImagen } from './imagenes.js';

// Viven en app.js y se leen por window al momento de usarlos.
const fbSave = (...a) => window.fbSave(...a);
const closeModal = (...a) => window.closeModal(...a);

// ── STOCK DE VELAS ────────────────────────────────────────────────────────────
let velasData = [];
export const getVelasData = () => velasData;
let _velaFotoTmp = '';
window._setVelasData = (arr) => {
  if(window._velasLastSave && Date.now() - window._velasLastSave < 2000) return;
  velasData.splice(0, velasData.length, ...(Array.isArray(arr)?arr:Object.values(arr||{})));
  if(document.getElementById('page-velas')?.classList.contains('active')) renderVelas();
};

export function renderVelas(){
  const grid = document.getElementById('velas-grid');
  if(!grid) return;
  const search = (document.getElementById('velas-search')?.value||'').toLowerCase();
  const total = velasData.reduce((s,f)=>s+(+f.cantidad||0),0);
  const kpi = document.getElementById('velas-kpi');
  if(kpi) kpi.textContent = `${velasData.length} modelo${velasData.length!==1?'s':''} · ${total} velas en total`;
  if(!velasData.length){
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 20px;color:var(--mid-gray)">
      <div style="font-size:40px;margin-bottom:10px"></div>
      <div style="font-size:15px;font-weight:600;color:#7A7A72">Todavía no cargaste velas</div>
      <div style="font-size:13px;margin-top:6px">Cargá tus velas con foto y cantidad con "+ Agregar vela".</div></div>`;
    return;
  }
  const vis = velasData.map((f,i)=>({f,i})).filter(({f})=>!search || (f.nombre||'').toLowerCase().includes(search) || (f.notas||'').toLowerCase().includes(search));
  if(!vis.length){ grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--mid-gray)">Sin resultados para "${esc(search)}".</div>`; return; }
  grid.innerHTML = vis.map(({f,i})=>{
    const cant = +f.cantidad||0;
    const foto = f.foto
      ? `<img class="lp-card-photo" src="${f.foto}" style="cursor:pointer" onclick="openVelaFoto(${i})">`
      : `<div class="lp-card-photo-placeholder"><span style="font-size:30px"></span></div>`;
    return `<div class="lp-card">
      ${foto}
      <div class="lp-card-body">
        <div class="lp-card-name" style="font-weight:600">${esc(f.nombre||'Vela')}</div>
        ${f.notas?`<div style="font-size:12px;color:#7A7A72;margin:2px 0 6px">${esc(f.notas)}</div>`:''}
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <button class="btn-icon" style="border:1px solid var(--light-gray);border-radius:6px;width:30px;height:30px;font-size:18px" onclick="velaAjustar(${i},-1)">−</button>
          <span style="min-width:44px;text-align:center;font-size:22px;font-weight:700;color:${cant>0?'var(--charcoal)':'var(--red-alert)'}">${cant}</span>
          <button class="btn-icon" style="border:1px solid var(--light-gray);border-radius:6px;width:30px;height:30px;font-size:18px" onclick="velaAjustar(${i},1)">+</button>
          <span style="font-size:11px;color:var(--mid-gray)">en stock</span>
        </div>
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
          <button class="btn-secondary" style="font-size:11px" onclick="openVelaModal(${i})">Editar</button>
          <button class="btn-icon" onclick="cambiarFotoVela(${i})" title="Cambiar foto"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-2h5L16 7"/></svg></button>
          <button class="btn-icon" style="color:var(--red-alert)" onclick="delVela(${i})" title="Eliminar">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

export function velaAjustar(i, delta){
  if(!velasData[i]) return;
  velasData[i].cantidad = Math.max(0, (+velasData[i].cantidad||0) + delta);
  window._velasLastSave = Date.now();
  fbSave('velasData', velasData);
  renderVelas();
}

export function openVelaFoto(i){
  const f = velasData[i]; if(!f?.foto) return;
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer';
  ov.innerHTML=`<img src="${f.foto}" style="max-width:94vw;max-height:90vh;border-radius:12px">`;
  ov.onclick=()=>ov.remove(); document.body.appendChild(ov);
}

export function openVelaModal(idx){
  const f = idx>=0 ? velasData[idx] : {};
  _velaFotoTmp = f.foto||'';
  document.getElementById('vela-modal-title').textContent = idx>=0 ? 'Editar vela' : 'Nueva vela';
  document.getElementById('vela-idx').value = idx;
  document.getElementById('vela-nombre').value = f.nombre||'';
  document.getElementById('vela-cantidad').value = f.cantidad!=null ? f.cantidad : '';
  document.getElementById('vela-notas').value = f.notas||'';
  document.getElementById('vela-file').value = '';
  const p = document.getElementById('vela-preview');
  if(_velaFotoTmp){ p.src=_velaFotoTmp; p.style.display='block'; } else { p.src=''; p.style.display='none'; }
  document.getElementById('vela-modal').classList.add('open');
}

export function velaFotoPreview(input){
  const file = input.files[0]; if(!file) return;
  comprimirImagen(file, 1000, 0.7, data => { _velaFotoTmp = data; const p=document.getElementById('vela-preview'); p.src=data; p.style.display='block'; });
}

export function guardarVela(){
  const nombre = document.getElementById('vela-nombre').value.trim();
  if(!nombre){ showToast('Poné un nombre a la vela','error'); return; }
  const idx = +document.getElementById('vela-idx').value;
  const obj = {
    id: idx>=0 ? velasData[idx].id : Date.now(),
    nombre,
    cantidad: Math.max(0, +document.getElementById('vela-cantidad').value||0),
    notas: document.getElementById('vela-notas').value.trim(),
    foto: _velaFotoTmp||'',
  };
  if(idx>=0) velasData[idx]=obj; else velasData.push(obj);
  window._velasLastSave = Date.now();
  fbSave('velasData', velasData);
  closeModal('vela-modal');
  renderVelas();
  showToast('Vela guardada');
}

export async function delVela(i){
  if(!velasData[i]) return;
  if(!await confirmModal(`¿Eliminar "${velasData[i].nombre||'esta vela'}" del stock?`)) return;
  velasData.splice(i,1);
  window._velasLastSave = Date.now();
  fbSave('velasData', velasData);
  renderVelas();
}

export function cambiarFotoVela(i){
  if(!velasData[i]) return;
  const input = document.createElement('input');
  input.type='file'; input.accept='image/*'; input.style.display='none';
  document.body.appendChild(input);
  const cleanup=()=>{ if(input.isConnected) input.remove(); };
  input.onchange=()=>{
    const file=input.files?.[0]; if(!file){ cleanup(); return; }
    comprimirImagen(file, 1000, 0.7, data=>{
      if(velasData[i]){ velasData[i].foto=data; window._velasLastSave=Date.now(); fbSave('velasData', velasData); renderVelas(); showToast('Foto actualizada'); }
      cleanup();
    });
  };
  window.addEventListener('focus', function onF(){ window.removeEventListener('focus',onF); setTimeout(()=>{ if(input.isConnected && !input.files.length) cleanup(); }, 600); });
  input.click();
}
