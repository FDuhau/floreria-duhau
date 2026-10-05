import { esc } from './utils.js';
import { confirmModal } from './modales.js';
import { leerFotoComprimida } from './imagenes.js';

// Viven en app.js: se leen por window al momento de usarlos.
const fbSave = (...a) => window.fbSave(...a);
const closeModal = (...a) => window.closeModal(...a);

// ════════════════════════════════════════
// DATA — LISTA DE PRECIOS
// ════════════════════════════════════════
export const listaPreciosData = [];
window._setListaPreciosData = (arr) => { listaPreciosData.splice(0, listaPreciosData.length, ...arr); };

// ── renderListaPrecios ────────────────────────────────────────────────────────
export function renderListaPrecios(){
  const search = (document.getElementById('lp-search')?.value||'').toLowerCase();
  const grid = document.getElementById('lp-grid');
  if(!grid) return;
  const editable = window.userRole === 'gerencia';

  // Populate category select in modal (solo gerencia)
  if(editable){
    const catSel = document.getElementById('lp-cat-sel');
    if(catSel){
      catSel.innerHTML = listaPreciosData.map((c,i)=>
        `<option value="${i}">${c.emoji} ${esc(c.cat)}</option>`
      ).join('') + `<option value="new">+ Nueva categoría...</option>`;
    }
  }

  grid.innerHTML = listaPreciosData.map((cat, ci) => {
    const visible = cat.items.filter(it =>
      !search || it.nombre.toLowerCase().includes(search) || it.desc.toLowerCase().includes(search) || cat.cat.toLowerCase().includes(search)
    );
    if(search && visible.length===0) return '';

    const itemsHtml = (search ? visible : cat.items).map((it) => {
      const realIdx = cat.items.indexOf(it);
      const photos = it.photos||[];

      const mainPhoto = photos.length
        ? `<img class="lp-card-photo" src="${photos[0]}" onclick="lpOpenViewer(${ci},${realIdx},0)" style="cursor:pointer">`
        : (editable
          ? `<label class="lp-card-photo-placeholder">
              <span style="font-size:28px"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-2h5L16 7"/></svg></span><span>Agregar foto</span>
              <input type="file" accept="image/*" multiple style="display:none" onchange="lpAddPhotos(${ci},${realIdx},this)">
             </label>`
          : `<div class="lp-card-photo-placeholder"><span style="font-size:28px"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-2h5L16 7"/></svg></span></div>`);

      const photoStrip = photos.length > 1
        ? `<div class="lp-photo-strip">
            ${photos.map((p,pi)=>`
              <div class="lp-photo-thumb">
                <img src="${p}" onclick="lpOpenViewer(${ci},${realIdx},${pi})">
                ${editable ? `<button class="lp-photo-del" onclick="lpRemovePhoto(${ci},${realIdx},${pi})">✕</button>` : ''}
              </div>`).join('')}
            ${editable ? `<label class="lp-add-photo"><span style="font-size:20px"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-2h5L16 7"/></svg></span>+<input type="file" accept="image/*" multiple style="display:none" onchange="lpAddPhotos(${ci},${realIdx},this)"></label>` : ''}
          </div>` : '';

      if(editable){
        return `<div class="lp-card">
          ${mainPhoto}
          ${photos.length===1?`<div class="lp-photo-strip">
            <div class="lp-photo-thumb"><img src="${photos[0]}" onclick="lpOpenViewer(${ci},${realIdx},0)"><button class="lp-photo-del" onclick="lpRemovePhoto(${ci},${realIdx},0)">✕</button></div>
            <label class="lp-add-photo"><span style="font-size:20px"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-2h5L16 7"/></svg></span>+<input type="file" accept="image/*" multiple style="display:none" onchange="lpAddPhotos(${ci},${realIdx},this)"></label>
          </div>`:photoStrip}
          <div class="lp-card-body">
            <input class="lp-card-name" value="${esc(it.nombre)}" onchange="lpUpdItem(${ci},${realIdx},'nombre',this.value)">
            <textarea class="lp-card-desc" onchange="lpUpdItem(${ci},${realIdx},'desc',this.value)">${esc(it.desc)}</textarea>
            <div class="lp-card-footer">
              <input class="lp-price-input" value="${esc(it.precio)}" onchange="lpUpdItem(${ci},${realIdx},'precio',this.value)" placeholder="$0">
              <div class="lp-card-actions">
                <button class="btn-icon" style="color:var(--red-alert)" onclick="lpDelItem(${ci},${realIdx})" title="Eliminar">✕</button>
              </div>
            </div>
          </div>
        </div>`;
      } else {
        // SOLO LECTURA para operarios
        return `<div class="lp-card">
          ${mainPhoto}
          ${photos.length===1?`<div class="lp-photo-strip"><div class="lp-photo-thumb"><img src="${photos[0]}" onclick="lpOpenViewer(${ci},${realIdx},0)"></div></div>`:photoStrip}
          <div class="lp-card-body">
            <div class="lp-card-name" style="font-weight:600;cursor:default">${esc(it.nombre)}</div>
            <div class="lp-card-desc" style="min-height:auto;color:#7A7A72;font-size:12.5px;margin:4px 0 8px">${esc(it.desc)}</div>
            <div class="lp-card-footer">
              <div class="lp-price-input" style="font-weight:700;color:#1A1A1A;cursor:default">${esc(it.precio)}</div>
            </div>
          </div>
        </div>`;
      }
    }).join('');

    return `<div class="lp-section">
      <div class="lp-section-header">
        <div class="lp-section-title">${cat.emoji} ${esc(cat.cat)}</div>
        <div class="lp-section-actions">
          <span style="font-size:11px;opacity:.6;margin-right:8px">${cat.items.length} ítem${cat.items.length!==1?'s':''}</span>
          ${editable ? `<button class="btn-icon" style="color:#F7F5F2;font-size:18px" onclick="openLpModal(${ci},-1)" title="Agregar ítem">+</button>
          <button class="btn-icon" style="color:rgba(247,245,242,.5);font-size:13px" onclick="lpDelCat(${ci})" title="Eliminar categoría">✕</button>` : ''}
        </div>
      </div>
      <div class="lp-items-grid">${itemsHtml}</div>
    </div>`;
  }).join('');

  // Botón nueva categoría solo para gerencia
  if(editable){
    grid.innerHTML += `<div style="margin-top:8px">
      <button class="btn-secondary" onclick="openLpCatModal()" style="font-size:13px;padding:10px 20px">+ Nueva categoría</button>
    </div>`;
  }
}

export function lpUpdItem(ci,ii,field,val){ listaPreciosData[ci].items[ii][field]=val; fbSave('listaPreciosData',listaPreciosData); }

export async function lpDelItem(ci,ii){
  if(!await confirmModal('¿Eliminar este ítem?')) return;
  listaPreciosData[ci].items.splice(ii,1);
  fbSave('listaPreciosData',listaPreciosData);
  renderListaPrecios();
}

export async function lpDelCat(ci){
  if(!await confirmModal('¿Eliminar la categoría "'+listaPreciosData[ci].cat+'" y todos sus ítems?')) return;
  listaPreciosData.splice(ci,1);
  fbSave('listaPreciosData',listaPreciosData);
  renderListaPrecios();
}

export function openLpModal(ci,ii){
  document.getElementById('lp-cat-idx').value = ci;
  document.getElementById('lp-item-idx').value = ii;
  const isNew = ii===-1;
  document.getElementById('lp-modal-title').textContent = isNew ? 'Nuevo ítem' : 'Editar ítem';
  if(!isNew && ci>=0){
    const it = listaPreciosData[ci].items[ii];
    document.getElementById('lp-nombre').value = it.nombre;
    document.getElementById('lp-desc').value = it.desc||'';
    document.getElementById('lp-precio').value = it.precio;
    document.getElementById('lp-cat-sel').value = ci;
  } else {
    document.getElementById('lp-nombre').value='';
    document.getElementById('lp-desc').value='';
    document.getElementById('lp-precio').value='';
    if(ci>=0) document.getElementById('lp-cat-sel').value=ci;
  }
  document.getElementById('lp-modal').classList.add('open');
}

export function saveLpItem(){
  const nombre = document.getElementById('lp-nombre').value.trim();
  if(!nombre) return;
  const catSel = document.getElementById('lp-cat-sel');
  if(catSel.value==='new'){ openLpCatModal(); return; }
  const ci = +catSel.value;
  const ii = +document.getElementById('lp-item-idx').value;
  const item = {
    nombre,
    desc: document.getElementById('lp-desc').value||'',
    precio: document.getElementById('lp-precio').value||'A consultar',
    photos: (ii>=0 && listaPreciosData[ci]?.items[ii]?.photos) || []
  };
  if(ii===-1) listaPreciosData[ci].items.push(item);
  else listaPreciosData[ci].items[ii]=item;
  fbSave('listaPreciosData',listaPreciosData);
  closeModal('lp-modal');
  renderListaPrecios();
}

export function openLpCatModal(){ document.getElementById('lp-cat-modal').classList.add('open'); }

export function addLpCat(){
  const nombre = document.getElementById('lp-cat-nombre').value.trim();
  if(!nombre) return;
  listaPreciosData.push({ cat: nombre, emoji: '', items: [] });
  fbSave('listaPreciosData',listaPreciosData);
  closeModal('lp-cat-modal');
  document.getElementById('lp-cat-nombre').value='';
  renderListaPrecios();
}

export function lpAddPhotos(ci,ii,input){
  const files = Array.from(input.files);
  if(!files.length) return;
  if(!listaPreciosData[ci].items[ii].photos) listaPreciosData[ci].items[ii].photos=[];
  let loaded=0;
  files.forEach(file=>{
    leerFotoComprimida(file, data=>{
      listaPreciosData[ci].items[ii].photos.push(data);
      loaded++;
      if(loaded===files.length){ fbSave('listaPreciosData',listaPreciosData); renderListaPrecios(); }
    });
  });
}

export function lpRemovePhoto(ci,ii,pi){
  listaPreciosData[ci].items[ii].photos.splice(pi,1);
  fbSave('listaPreciosData',listaPreciosData);
  renderListaPrecios();
}

export function lpOpenViewer(ci,ii,pi){
  const photos = listaPreciosData[ci].items[ii].photos;
  const nombre = listaPreciosData[ci].items[ii].nombre;
  let cur = pi;
  let overlay = document.getElementById('lp-viewer-overlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id='lp-viewer-overlay';
    overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:2000;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px';
    overlay.onclick=e=>{ if(e.target===overlay) overlay.remove(); };
    document.body.appendChild(overlay);
  }
  function draw(){
    overlay.innerHTML=`
      <button onclick="document.getElementById('lp-viewer-overlay').remove()" style="position:absolute;top:20px;right:28px;background:none;border:none;color:white;font-size:30px;cursor:pointer;line-height:1">✕</button>
      <div style="font-family:'Cormorant Garamond',serif;font-size:20px;color:rgba(255,255,255,.75)">${esc(nombre)} · ${cur+1}/${photos.length}</div>
      <img src="${photos[cur]}" style="max-width:90vw;max-height:76vh;border-radius:8px;object-fit:contain;box-shadow:0 8px 48px rgba(0,0,0,.6)">
      <div style="display:flex;gap:14px">
        ${cur>0?`<button onclick="event.stopPropagation();cur--;draw()" style="background:rgba(255,255,255,.15);border:none;color:white;padding:9px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-family:'DM Sans',sans-serif">← Anterior</button>`:''}
        ${cur<photos.length-1?`<button onclick="event.stopPropagation();cur++;draw()" style="background:rgba(255,255,255,.15);border:none;color:white;padding:9px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-family:'DM Sans',sans-serif">Siguiente →</button>`:''}
      </div>`;
  }
  draw();
}
