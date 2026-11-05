// Separado de app.js. Lo que necesita de app.js llega por configurarRamosDisponibles():
//   TODAY_ISO, closeModal, fbSave, floristaNombre, recetasData, userRole

import { calcCostoComposicion, cotizadorConfig } from './cotizador.js';
import { esc, parseMoney } from './utils.js';
import { arregloEmoji } from './composiciones.js';
import { listaPreciosData } from './lista-precios.js';
import { showToast } from './tema-toast.js';
import { comprimirImagen } from './imagenes.js';
import { confirmModal, promptModal } from './modales.js';
import { renderVentas, ventasData } from './ventas.js';
import { notificarVentaNueva } from './pedidos-ramos.js';

let D = {};
export function configurarRamosDisponibles(deps){ D = deps; }

// ── RAMOS DISPONIBLES ─────────────────────────────────────────────────────────
export let ramosDispData = [];
window._setRamosDispData = (arr) => { ramosDispData.splice(0, ramosDispData.length, ...arr); };

export function openRamoPhoto(src, nombre){
  let ov = document.getElementById('ramo-photo-viewer');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'ramo-photo-viewer';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:2000;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;padding:20px;cursor:zoom-out';
    ov.onclick = () => ov.remove();
    document.body.appendChild(ov);
  }
  ov.innerHTML = `
    <button onclick="event.stopPropagation();document.getElementById('ramo-photo-viewer').remove()" style="position:absolute;top:18px;right:26px;background:none;border:none;color:white;font-size:28px;cursor:pointer;font-family:'Cormorant Garamond',serif">✕</button>
    <div style="font-size:16px;color:rgba(255,255,255,.7);letter-spacing:.08em;margin-bottom:6px">${nombre}</div>
    <img src="${src}" style="max-width:90vw;max-height:82vh;border-radius:8px;object-fit:contain;box-shadow:0 10px 50px rgba(0,0,0,.5)">`;
}

export function renderRamosDisp(){
  // Poblar selector de venta directa
  const vdProd = document.getElementById('vd-prod');
  if(vdProd && !vdProd._populated){
    let opts = '<option value="">— Seleccionar —</option>';
    if(D.recetasData.length){
      opts += '<optgroup label="Composiciones">';
      D.recetasData.forEach(r => {
        const costo = calcCostoComposicion(r);
        const margen = cotizadorConfig?.margen ?? 30;
        const precio = Math.round(costo*(1+margen/100));
        opts += `<option value="${esc(r.nombre)}" data-precio="${precio}">${arregloEmoji(r.nombre)} ${esc(r.nombre)} — $${precio.toLocaleString('es-AR')}</option>`;
      });
      opts += '</optgroup>';
    }
    listaPreciosData.forEach(cat => {
      if(!(cat.items||[]).length) return;
      opts += `<optgroup label="${cat.emoji||''} ${esc(cat.cat)}">`;
      cat.items.forEach(it => {
        opts += `<option value="${esc(it.nombre)}" data-precio="${parseMoney(it.precio)}">${esc(it.nombre)} — ${esc(it.precio||'')}</option>`;
      });
      opts += '</optgroup>';
    });
    opts += '<option value="__otro__">+ Otro</option>';
    vdProd.innerHTML = opts;
    vdProd._populated = true;
  }
  const grid = document.getElementById('rd-grid');
  if(!grid) return;
  const search = (document.getElementById('rd-search')?.value||'').toLowerCase();

  const visibles = ramosDispData
    .map((r,i)=>({r,i}))
    .filter(({r}) => !search || (r.nombre||'').toLowerCase().includes(search) || (r.desc||'').toLowerCase().includes(search) || (r.categoria||'').toLowerCase().includes(search));

  if(ramosDispData.length === 0){
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 20px;color:var(--mid-gray)">
      <div style="font-size:40px;margin-bottom:10px"></div>
      <div style="font-size:15px;font-weight:600;color:var(--mid-gray)">No hay ramos armados en este momento</div>
      <div style="font-size:13px;margin-top:6px">Cargá los ramos que estén listos para vender con "+ Cargar ramo armado".</div>
    </div>`;
    return;
  }
  if(visibles.length === 0){
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--mid-gray)">Sin resultados para "${esc(search)}".</div>`;
    return;
  }

  grid.innerHTML = visibles.map(({r,i}) => {
    const foto = r.foto
      ? `<img class="lp-card-photo" src="${r.foto}" style="cursor:pointer" onclick="openRamoPhoto(this.src,'${esc(r.nombre).replace(/'/g,"\\'")}')">`
      : `<div class="lp-card-photo-placeholder" style="cursor:default"><span style="font-size:28px"></span></div>`;
    return `<div class="lp-card">
      ${foto}
      <div class="lp-card-body">
        ${r.categoria?`<span class="section-pill" style="background:var(--ok-soft);color:var(--sage-dark);display:inline-block;margin-bottom:6px">${esc(r.categoria)}</span>`:''}
        <div class="lp-card-name" style="font-weight:600">${esc(r.nombre)}</div>
        <div class="lp-card-desc" style="min-height:auto;color:var(--mid-gray);font-size:12.5px;margin:4px 0 8px">${esc(r.desc||'')}</div>
        <div class="lp-card-footer">
          <div class="lp-price-input" style="font-weight:700;color:var(--charcoal)">${esc(r.precio||'A consultar')}</div>
          <div class="lp-card-actions" style="display:flex;gap:6px">
            <button class="btn-add" style="padding:6px 12px;font-size:12px" onclick="openVentaRamo(${i})">✓ Vender</button>
            ${D.userRole!=='ventas' ? `<button class="btn-icon" onclick="cambiarFotoRamo(${i})" title="Cambiar foto"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-2h5L16 7"/></svg></button>` : ''}
            ${D.userRole!=='ventas' ? `<button class="btn-icon" style="color:var(--red-alert)" onclick="delRamo(${i})" title="Descartar (no registra venta)">✕</button>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

export function openRamoModal(){
  // Poblar categorías desde la Lista de Precios
  const catSel = document.getElementById('ramo-cat-sel');
  const conItems = listaPreciosData.filter(c => (c.items||[]).length > 0);
  if(conItems.length === 0){
    showToast('No hay productos cargados en la Lista de Precios');
    return;
  }
  catSel.innerHTML = '<option value="">— Seleccionar categoría —</option>' +
    listaPreciosData.map((c,i)=> (c.items||[]).length
      ? `<option value="${i}">${c.emoji||''} ${esc(c.cat)}</option>` : '').join('');
  document.getElementById('ramo-prod-sel').innerHTML = '<option value="">— Elegí primero una categoría —</option>';
  document.getElementById('ramo-prod-info').style.display = 'none';
  const f = document.getElementById('ramo-foto'); if(f) f.value='';
  document.getElementById('ramo-modal').classList.add('open');
}

export function ramoOnCatChange(){
  const ci = document.getElementById('ramo-cat-sel').value;
  const prodSel = document.getElementById('ramo-prod-sel');
  document.getElementById('ramo-prod-info').style.display = 'none';
  if(ci === ''){ prodSel.innerHTML = '<option value="">— Elegí primero una categoría —</option>'; return; }
  const items = listaPreciosData[+ci]?.items || [];
  prodSel.innerHTML = '<option value="">— Seleccionar producto —</option>' +
    items.map((it,ii)=>`<option value="${ii}">${esc(it.nombre)}</option>`).join('');
}

export function ramoOnProdChange(){
  const ci = document.getElementById('ramo-cat-sel').value;
  const ii = document.getElementById('ramo-prod-sel').value;
  const info = document.getElementById('ramo-prod-info');
  if(ci === '' || ii === ''){ info.style.display = 'none'; return; }
  const it = listaPreciosData[+ci]?.items[+ii];
  if(!it){ info.style.display = 'none'; return; }
  info.style.display = 'block';
  info.innerHTML = `${it.desc?`${esc(it.desc)}<br>`:''}<span style="color:var(--mid-gray)">Precio: <strong style="color:var(--charcoal)">${esc(it.precio||'A consultar')}</strong></span>`;
}

export function saveRamo(){
  const ciV = document.getElementById('ramo-cat-sel').value;
  const iiV = document.getElementById('ramo-prod-sel').value;
  if(ciV === '' || iiV === ''){ showToast('Elegí categoría y producto'); return; }
  const cat = listaPreciosData[+ciV];
  const it  = cat?.items[+iiV];
  if(!it){ showToast('Producto no válido'); return; }
  const fileInput = document.getElementById('ramo-foto');
  const file = fileInput?.files?.[0];
  if(!file){ showToast('Agregá la foto del ramo que armaste'); return; }

  const ramo = {
    nombre: it.nombre,
    desc: it.desc || '',
    precio: it.precio || 'A consultar',
    categoria: cat.cat,
    foto: '',
    creado: D.TODAY_ISO,
    quien: D.floristaNombre || window.currentUserLabel || ''
  };
  comprimirImagen(file, 1000, 0.7, data => {
    ramo.foto = data;
    ramosDispData.push(ramo);
    D.fbSave('ramosDispData', ramosDispData);
    D.closeModal('ramo-modal');
    renderRamosDisp();
    showToast('Ramo cargado');
  });
}

export async function delRamo(i){
  if(!await confirmModal('¿Quitar este ramo de disponibles? (no registra venta)')) return;
  ramosDispData.splice(i,1);
  D.fbSave('ramosDispData', ramosDispData);
  renderRamosDisp();
}

// Cambiar la foto de un ramo ya cargado (sin tener que borrarlo y recargarlo).
// El input se agrega al DOM antes de abrirlo: si queda desconectado, varios
// navegadores móviles (iOS Safari) no disparan el onchange y "no deja" cambiarla.
// La imagen se comprime para no exceder el límite de escritura de Firebase.
function cambiarFotoRamo(i){
  if(!ramosDispData[i]) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';
  document.body.appendChild(input);
  const cleanup = () => { if(input.isConnected) input.remove(); };
  input.onchange = () => {
    const file = input.files?.[0];
    if(!file){ cleanup(); return; }
    comprimirImagen(file, 1000, 0.7, data => {
      if(ramosDispData[i]){
        ramosDispData[i].foto = data;
        D.fbSave('ramosDispData', ramosDispData);
        renderRamosDisp();
        showToast('Foto actualizada');
      }
      cleanup();
    });
  };
  // Si el usuario cancela el selector, limpiamos el input al volver el foco.
  window.addEventListener('focus', function onFocus(){
    window.removeEventListener('focus', onFocus);
    setTimeout(()=>{ if(input.isConnected && !input.files.length) cleanup(); }, 600);
  });
  input.click();
}
window.cambiarFotoRamo = cambiarFotoRamo;

// ══ STOCK DE FLOREROS ══════════════════════════════════════════════════════
// Inventario de floreros con foto y cantidad, editable.
export let florerosData = [];
let _florFotoTmp = '';
window._setFlorerosData = (arr) => {
  if(window._florerosLastSave && Date.now() - window._florerosLastSave < 2000) return;
  florerosData.splice(0, florerosData.length, ...(Array.isArray(arr)?arr:Object.values(arr||{})));
  if(document.getElementById('page-floreros')?.classList.contains('active')) renderFloreros();
};

export function renderFloreros(){
  const grid = document.getElementById('floreros-grid');
  if(!grid) return;
  const search = (document.getElementById('floreros-search')?.value||'').toLowerCase();
  const total = florerosData.reduce((s,f)=>s+(+f.cantidad||0),0);
  const kpi = document.getElementById('floreros-kpi');
  if(kpi) kpi.textContent = `${florerosData.length} modelo${florerosData.length!==1?'s':''} · ${total} floreros en total`;
  if(!florerosData.length){
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 20px;color:var(--mid-gray)">
      <div style="font-size:40px;margin-bottom:10px"></div>
      <div style="font-size:15px;font-weight:600;color:var(--mid-gray)">Todavía no cargaste floreros</div>
      <div style="font-size:13px;margin-top:6px">Cargá tus floreros con foto y cantidad con "+ Agregar florero".</div></div>`;
    return;
  }
  const vis = florerosData.map((f,i)=>({f,i})).filter(({f})=>!search || (f.nombre||'').toLowerCase().includes(search) || (f.notas||'').toLowerCase().includes(search));
  if(!vis.length){ grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--mid-gray)">Sin resultados para "${esc(search)}".</div>`; return; }
  grid.innerHTML = vis.map(({f,i})=>{
    const cant = +f.cantidad||0;
    const foto = f.foto
      ? `<img class="lp-card-photo" src="${f.foto}" style="cursor:pointer" onclick="openFlorFoto(${i})">`
      : `<div class="lp-card-photo-placeholder"><span style="font-size:30px"></span></div>`;
    return `<div class="lp-card">
      ${foto}
      <div class="lp-card-body">
        <div class="lp-card-name" style="font-weight:600">${esc(f.nombre||'Florero')}</div>
        ${f.notas?`<div style="font-size:12px;color:var(--mid-gray);margin:2px 0 6px">${esc(f.notas)}</div>`:''}
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px">
          <button class="btn-icon" style="border:1px solid var(--light-gray);border-radius:6px;width:30px;height:30px;font-size:18px" onclick="florAjustar(${i},-1)">−</button>
          <span style="min-width:44px;text-align:center;font-size:22px;font-weight:700;color:${cant>0?'var(--charcoal)':'var(--red-alert)'}">${cant}</span>
          <button class="btn-icon" style="border:1px solid var(--light-gray);border-radius:6px;width:30px;height:30px;font-size:18px" onclick="florAjustar(${i},1)">+</button>
          <span style="font-size:12px;color:var(--mid-gray)">en stock</span>
        </div>
        <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
          <button class="btn-secondary" style="font-size:12px" onclick="openFloreroModal(${i})">Editar</button>
          <button class="btn-icon" onclick="cambiarFotoFlorero(${i})" title="Cambiar foto"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 7l1.5-2h5L16 7"/></svg></button>
          <button class="btn-icon" style="color:var(--red-alert)" onclick="delFlorero(${i})" title="Eliminar">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

export function florAjustar(i, delta){
  if(!florerosData[i]) return;
  florerosData[i].cantidad = Math.max(0, (+florerosData[i].cantidad||0) + delta);
  window._florerosLastSave = Date.now();
  D.fbSave('florerosData', florerosData);
  renderFloreros();
}

export function openFlorFoto(i){
  const f = florerosData[i]; if(!f?.foto) return;
  const ov = document.createElement('div');
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer';
  ov.innerHTML=`<img src="${f.foto}" style="max-width:94vw;max-height:90vh;border-radius:12px">`;
  ov.onclick=()=>ov.remove(); document.body.appendChild(ov);
}

export function openFloreroModal(idx){
  const f = idx>=0 ? florerosData[idx] : {};
  _florFotoTmp = f.foto||'';
  document.getElementById('florero-modal-title').textContent = idx>=0 ? 'Editar florero' : 'Nuevo florero';
  document.getElementById('flor-idx').value = idx;
  document.getElementById('flor-nombre').value = f.nombre||'';
  document.getElementById('flor-cantidad').value = f.cantidad!=null ? f.cantidad : '';
  document.getElementById('flor-notas').value = f.notas||'';
  document.getElementById('flor-file').value = '';
  const p = document.getElementById('flor-preview');
  if(_florFotoTmp){ p.src=_florFotoTmp; p.style.display='block'; } else { p.src=''; p.style.display='none'; }
  document.getElementById('florero-modal').classList.add('open');
}

export function florFotoPreview(input){
  const file = input.files[0]; if(!file) return;
  comprimirImagen(file, 1000, 0.7, data => { _florFotoTmp = data; const p=document.getElementById('flor-preview'); p.src=data; p.style.display='block'; });
}

export function guardarFlorero(){
  const nombre = document.getElementById('flor-nombre').value.trim();
  if(!nombre){ showToast('Poné un nombre al florero','error'); return; }
  const idx = +document.getElementById('flor-idx').value;
  const obj = {
    id: idx>=0 ? florerosData[idx].id : Date.now(),
    nombre,
    cantidad: Math.max(0, +document.getElementById('flor-cantidad').value||0),
    notas: document.getElementById('flor-notas').value.trim(),
    foto: _florFotoTmp||'',
  };
  if(idx>=0) florerosData[idx]=obj; else florerosData.push(obj);
  window._florerosLastSave = Date.now();
  D.fbSave('florerosData', florerosData);
  D.closeModal('florero-modal');
  renderFloreros();
  showToast('Florero guardado');
}

export async function delFlorero(i){
  if(!florerosData[i]) return;
  if(!await confirmModal(`¿Eliminar "${florerosData[i].nombre||'este florero'}" del stock?`)) return;
  florerosData.splice(i,1);
  window._florerosLastSave = Date.now();
  D.fbSave('florerosData', florerosData);
  renderFloreros();
}

// Cambiar la foto de un florero ya cargado (input conectado al DOM, ver cambiarFotoRamo)
export function cambiarFotoFlorero(i){
  if(!florerosData[i]) return;
  const input = document.createElement('input');
  input.type='file'; input.accept='image/*'; input.style.display='none';
  document.body.appendChild(input);
  const cleanup=()=>{ if(input.isConnected) input.remove(); };
  input.onchange=()=>{
    const file=input.files?.[0]; if(!file){ cleanup(); return; }
    comprimirImagen(file, 1000, 0.7, data=>{
      if(florerosData[i]){ florerosData[i].foto=data; window._florerosLastSave=Date.now(); D.fbSave('florerosData', florerosData); renderFloreros(); showToast('Foto actualizada'); }
      cleanup();
    });
  };
  window.addEventListener('focus', function onF(){ window.removeEventListener('focus',onF); setTimeout(()=>{ if(input.isConnected && !input.files.length) cleanup(); }, 600); });
  input.click();
}

export function openVentaRamo(i){
  const r = ramosDispData[i];
  if(!r) return;
  document.getElementById('ramo-sell-idx').value = i;
  document.getElementById('ramo-sell-info').innerHTML =
    `<strong>${esc(r.nombre)}</strong>${r.desc?` · ${esc(r.desc)}`:''}<br><span style="color:var(--mid-gray)">Precio: ${esc(r.precio||'A consultar')}</span>`;
  document.getElementById('ramo-sell-cliente').value='';
  document.getElementById('ramo-sell-destinatario').value='';
  document.getElementById('ramo-sell-pago').value='';
  document.getElementById('ramo-sell-dedicatoria').value='';
  document.getElementById('ramo-sell-dir').value='';
  document.getElementById('ramo-sell-modal').classList.add('open');
}

export function confirmVentaRamo(){
  const i = +document.getElementById('ramo-sell-idx').value;
  const r = ramosDispData[i];
  if(!r) return;
  const cliente = document.getElementById('ramo-sell-cliente').value.trim();
  // Registrar automáticamente en Ventas Externas
  ventasData.push({
    prod: r.nombre,
    desc: r.desc || '',
    cliente: cliente,
    destinatario: document.getElementById('ramo-sell-destinatario').value.trim(),
    fecha: D.TODAY_ISO,
    dedicatoria: document.getElementById('ramo-sell-dedicatoria').value.trim(),
    precio: r.precio || '—',
    formaPago: document.getElementById('ramo-sell-pago').value,
    estado: 'confirmado',
    dir: document.getElementById('ramo-sell-dir').value.trim(),
    fromRamo: true
  });
  D.fbSave('ventasData', ventasData);
  // Avisar a todos los floristas y a gerencia para que lo saquen de la vidriera
  window.pushSend?.(
    'Ramo vendido',
    `"${r.nombre}" se vendió${cliente ? ' a ' + cliente : ''} — sacalo de la vidriera`,
    'ramo-vendido',
    'roles:florista,gerencia'
  );
  // Aviso a gerencia/comercial: venta registrada, pendiente de asignar.
  notificarVentaNueva(r.nombre, cliente, '');
  // Quitar el ramo del catálogo (ya no está disponible)
  ramosDispData.splice(i,1);
  D.fbSave('ramosDispData', ramosDispData);
  D.closeModal('ramo-sell-modal');
  renderRamosDisp();
  showToast('Venta registrada en Ventas Externas');
}

export async function vdAutoPrice(){
  const sel = document.getElementById('vd-prod');
  if(sel.value === '__otro__'){
    const custom = await promptModal('Nombre del arreglo o ramo:', { title: 'Otro producto' });
    if(custom && custom.trim()){
      const opt = document.createElement('option');
      opt.value = custom.trim(); opt.textContent = custom.trim(); opt.selected = true;
      sel.insertBefore(opt, sel.lastElementChild);
    } else { sel.value = ''; }
    return;
  }
  const selected = sel.options[sel.selectedIndex];
  const precio = selected?.dataset?.precio;
  if(precio && +precio > 0){
    document.getElementById('vd-precio').value = '$' + (+precio).toLocaleString('es-AR');
  }
}

export function registrarVentaDirecta(){
  const prod = document.getElementById('vd-prod')?.value?.trim();
  if(!prod || prod === '__otro__'){ showToast('Seleccioná el arreglo o ramo'); return; }
  const cliente = document.getElementById('vd-cliente')?.value?.trim();
  if(!cliente){ showToast('Ingresá el nombre del cliente'); return; }

  ventasData.push({
    prod,
    desc: '',
    cliente,
    destinatario: document.getElementById('vd-destinatario')?.value || '',
    fecha: D.TODAY_ISO,
    dedicatoria: document.getElementById('vd-dedicatoria')?.value || '',
    precio: document.getElementById('vd-precio')?.value || '—',
    formaPago: document.getElementById('vd-pago')?.value || '',
    estado: 'confirmado',
    dir: document.getElementById('vd-dir')?.value || '',
    fromVentaDirecta: true
  });
  D.fbSave('ventasData', ventasData);
  notificarVentaNueva(prod, cliente, '');

  // Limpiar formulario
  ['vd-prod','vd-cliente','vd-destinatario','vd-pago','vd-precio','vd-dedicatoria','vd-dir'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.value = '';
  });

  renderVentas();
  showToast('Venta directa registrada');
}