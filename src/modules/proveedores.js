import { esc } from './utils.js';
import { confirmModal } from './modales.js';
import { showToast } from './tema-toast.js';

// Viven en app.js y se leen por window al momento de usarlos.
const fbSave = (...a) => window.fbSave(...a);
const closeModal = (...a) => window.closeModal(...a);

// ── PROVEEDORES ───────────────────────────────────────────────────────────────
export function renderProveedores(){
  const search = (document.getElementById('prov-search')?.value||'').toLowerCase();
  const rubro = document.getElementById('prov-rubro')?.value||'';
  const list = (window.proveedoresList||[]).filter(p=>{
    const mSearch = !search || p.nombre?.toLowerCase().includes(search) || p.contacto?.toLowerCase().includes(search);
    const mRubro = !rubro || p.rubro === rubro;
    return mSearch && mRubro;
  });
  const el = document.getElementById('prov-list');
  if(!el) return;
  if(!list.length){
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--mid-gray)">No hay proveedores registrados. Agregá el primero.</div>';
    return;
  }
  const RUBRO_ICON = {Flores:'',Insumos:'',Packaging:'',Otros:''};
  el.innerHTML = `<div class="table-wrapper"><table style="width:100%;border-collapse:collapse;font-size:13px">
    <thead><tr>
      <th style="text-align:left;padding:10px 14px;font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--mid-gray);border-bottom:2px solid var(--light-gray);background:var(--warm-white)">Proveedor</th>
      <th style="text-align:left;padding:10px 14px;font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--mid-gray);border-bottom:2px solid var(--light-gray);background:var(--warm-white)">Rubro</th>
      <th style="text-align:left;padding:10px 14px;font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--mid-gray);border-bottom:2px solid var(--light-gray);background:var(--warm-white)">Contacto</th>
      <th style="text-align:left;padding:10px 14px;font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--mid-gray);border-bottom:2px solid var(--light-gray);background:var(--warm-white)">Teléfono</th>
      <th style="text-align:left;padding:10px 14px;font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--mid-gray);border-bottom:2px solid var(--light-gray);background:var(--warm-white)">Email</th>
      <th style="padding:10px 14px;border-bottom:2px solid var(--light-gray);background:var(--warm-white)"></th>
    </tr></thead>
    <tbody>${list.map((p)=>{
      const realIdx = (window.proveedoresList||[]).indexOf(p);
      return `<tr style="cursor:pointer" onclick="openProveedorModal(${realIdx})">
        <td style="padding:10px 14px;border-bottom:1px solid var(--light-gray);font-weight:600">${RUBRO_ICON[p.rubro]||''} ${esc(p.nombre||'—')}</td>
        <td style="padding:10px 14px;border-bottom:1px solid var(--light-gray)">${esc(p.rubro||'—')}</td>
        <td style="padding:10px 14px;border-bottom:1px solid var(--light-gray)">${esc(p.contacto||'—')}</td>
        <td style="padding:10px 14px;border-bottom:1px solid var(--light-gray)">${p.telefono?`<a href="tel:${esc(p.telefono)}" onclick="event.stopPropagation()">${esc(p.telefono)}</a>`:'—'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid var(--light-gray)">${p.email?`<a href="mailto:${esc(p.email)}" onclick="event.stopPropagation()">${esc(p.email)}</a>`:'—'}</td>
        <td style="padding:10px 14px;border-bottom:1px solid var(--light-gray);text-align:right">
          <button class="btn-icon" onclick="event.stopPropagation();eliminarProveedor(${realIdx})" title="Eliminar"><svg viewBox="0 0 24 24" width="16" height="16" style="stroke:currentColor;stroke-width:1.7;fill:none;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg></button>
        </td>
      </tr>
      ${p.notas?`<tr onclick="openProveedorModal(${realIdx})" style="cursor:pointer"><td colspan="6" style="padding:4px 14px 10px;border-bottom:1px solid var(--light-gray);font-size:12px;color:var(--mid-gray)">${esc(p.notas)}</td></tr>`:''}`;
    }).join('')}</tbody>
  </table></div>`;
}

export function openProveedorModal(idx){
  const p = idx != null ? (window.proveedoresList||[])[idx] : {};
  let ov = document.getElementById('prov-modal');
  if(!ov){ ov=document.createElement('div'); ov.id='prov-modal'; ov.className='modal-overlay'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="modal">
    <button class="modal-close" onclick="closeModal('prov-modal')">✕</button>
    <div class="modal-title">${idx!=null?'Editar':'Nuevo'} Proveedor</div>
    <div class="modal-row">
      <div class="form-group"><label class="form-label">Nombre *</label><input class="form-input-modal" id="prov-nombre" value="${esc(p.nombre||'')}"></div>
      <div class="form-group"><label class="form-label">Rubro</label><select class="form-input-modal" id="prov-rubro-sel">
        ${['Flores','Insumos','Packaging','Otros'].map(r=>`<option${r===(p.rubro||'')?' selected':''}>${r}</option>`).join('')}
      </select></div>
    </div>
    <div class="modal-row">
      <div class="form-group"><label class="form-label">Contacto</label><input class="form-input-modal" id="prov-contacto" value="${esc(p.contacto||'')}"></div>
      <div class="form-group"><label class="form-label">Teléfono</label><input class="form-input-modal" id="prov-tel" value="${esc(p.telefono||'')}" type="tel"></div>
    </div>
    <div class="form-group"><label class="form-label">Email</label><input class="form-input-modal" id="prov-email" value="${esc(p.email||'')}" type="email"></div>
    <div class="form-group"><label class="form-label">Notas</label><textarea class="form-input-modal" id="prov-notas" rows="3">${esc(p.notas||'')}</textarea></div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="closeModal('prov-modal')">Cancelar</button>
      <button class="btn-add" onclick="guardarProveedor(${idx!=null?idx:'null'})">Guardar</button>
    </div>
  </div>`;
  ov.classList.add('open');
}

export function guardarProveedor(idx){
  const nombre = document.getElementById('prov-nombre')?.value?.trim();
  if(!nombre){ showToast('Ingresá el nombre del proveedor'); return; }
  const p = {
    nombre,
    rubro: document.getElementById('prov-rubro-sel')?.value||'Otros',
    contacto: document.getElementById('prov-contacto')?.value?.trim()||'',
    telefono: document.getElementById('prov-tel')?.value?.trim()||'',
    email: document.getElementById('prov-email')?.value?.trim()||'',
    notas: document.getElementById('prov-notas')?.value?.trim()||''
  };
  const list = [...(window.proveedoresList||[])];
  if(idx != null) list[idx] = p; else list.push(p);
  window.proveedoresList = list;
  fbSave('proveedoresList', list);
  closeModal('prov-modal');
  renderProveedores();
  showToast('Proveedor guardado');
}

export async function eliminarProveedor(idx){
  if(!await confirmModal('¿Eliminar este proveedor?')) return;
  const list = [...(window.proveedoresList||[])];
  list.splice(idx,1);
  window.proveedoresList = list;
  fbSave('proveedoresList', list);
  renderProveedores();
  showToast('Proveedor eliminado');
}
