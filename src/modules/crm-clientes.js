import { esc, fmtDate } from './utils.js';
import { confirmModal } from './modales.js';
import { showToast } from './tema-toast.js';

// Viven en app.js y se leen por window al momento de usarlos.
const fbSave = (...a) => window.fbSave(...a);
const closeModal = (...a) => window.closeModal(...a);

// ── CRM CLIENTES ──────────────────────────────────────────────
let clientesData = [];
export const getClientesData = () => clientesData;
window._setClientesData = (arr) => { clientesData = arr && typeof arr === 'object' ? (Array.isArray(arr) ? arr : Object.values(arr)) : []; };

export function renderClientes(){
  const el = document.getElementById('crm-lista');
  if(!el) return;
  const q = (document.getElementById('crm-search')?.value||'').toLowerCase();
  const filtro = document.getElementById('crm-filtro')?.value || '';

  let lista = [...clientesData];
  if(q) lista = lista.filter(c => (c.nombre||'').toLowerCase().includes(q) || (c.empresa||'').toLowerCase().includes(q) || (c.telefono||'').includes(q));
  if(filtro) lista = lista.filter(c => c.tipo === filtro);
  lista.sort((a,b)=>(a.nombre||'').localeCompare(b.nombre||''));

  if(!lista.length){ el.innerHTML='<div style="color:var(--mid-gray);font-size:13px;padding:24px">No hay clientes registrados.</div>'; return; }

  el.innerHTML = lista.map((c)=>{
    const idx = clientesData.indexOf(c);
    const eventos = (window.eventosData||[]).filter(e=>(e.clienteId||e.cliente||'')===(c.id||c.nombre));
    const compras = (window.ventasData||[]).filter(v=>(v.clienteId||v.cliente||'')===(c.id||c.nombre));
    const totalGastado = compras.reduce((s,v)=>s+(+v.monto||+v.total||0),0);
    return `<div class="crm-card" onclick="abrirFichaCliente(${idx})">
      <div class="crm-card-avatar">${(c.nombre||'?').charAt(0).toUpperCase()}</div>
      <div class="crm-card-info">
        <div class="crm-card-nombre">${esc(c.nombre||'—')}</div>
        ${c.empresa?`<div class="crm-card-sub">${esc(c.empresa)}</div>`:''}
        <div class="crm-card-meta">${c.telefono?''+esc(c.telefono)+'  ':''} ${c.email?''+esc(c.email):''}
        </div>
      </div>
      <div class="crm-card-stats">
        ${eventos.length?`<span class="crm-badge">${eventos.length} evento${eventos.length!==1?'s':''}</span>`:''}
        ${totalGastado>0?`<span class="crm-badge green">$${totalGastado.toLocaleString('es-AR')}</span>`:''}
        ${c.tipo?`<span class="crm-badge blue">${esc(c.tipo)}</span>`:''}
      </div>
    </div>`;
  }).join('');
}

export function abrirFichaCliente(idx){
  const c = clientesData[idx];
  if(!c) return;
  const eventos = (window.eventosData||[]).filter(e=>(e.clienteId||e.cliente||'')===(c.id||c.nombre));
  const compras = (window.ventasData||[]).filter(v=>(v.clienteId||v.cliente||'')===(c.id||c.nombre));
  const totalGastado = compras.reduce((s,v)=>s+(+v.monto||+v.total||0),0);

  const historial = [
    ...eventos.map(e=>({fecha:e.fecha||'',tipo:'Evento',desc:e.titulo||e.nombre||'—',extra:e.zona||''})),
    ...compras.map(v=>({fecha:v.fecha||'',tipo:'Venta',desc:v.descripcion||v.desc||'—',extra:'$'+(+v.monto||+v.total||0).toLocaleString('es-AR')}))
  ].sort((a,b)=>b.fecha.localeCompare(a.fecha));

  document.getElementById('ficha-nombre').textContent = c.nombre||'—';
  document.getElementById('ficha-body').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      ${c.empresa?`<div><div class="form-label">Empresa</div><div style="font-size:14px">${esc(c.empresa)}</div></div>`:''}
      ${c.telefono?`<div><div class="form-label">Teléfono</div><div style="font-size:14px">${esc(c.telefono)}</div></div>`:''}
      ${c.email?`<div><div class="form-label">Email</div><div style="font-size:14px">${esc(c.email)}</div></div>`:''}
      ${c.tipo?`<div><div class="form-label">Tipo</div><div style="font-size:14px">${esc(c.tipo)}</div></div>`:''}
    </div>
    <div style="display:flex;gap:16px;margin-bottom:20px">
      <div class="kpi-card" style="flex:1;padding:14px"><div style="font-size:11px;color:var(--mid-gray);margin-bottom:4px">EVENTOS</div><div style="font-size:22px;font-weight:700">${eventos.length}</div></div>
      <div class="kpi-card" style="flex:1;padding:14px"><div style="font-size:11px;color:var(--mid-gray);margin-bottom:4px">COMPRAS</div><div style="font-size:22px;font-weight:700">${compras.length}</div></div>
      <div class="kpi-card" style="flex:1;padding:14px"><div style="font-size:11px;color:var(--mid-gray);margin-bottom:4px">TOTAL GASTADO</div><div style="font-size:20px;font-weight:700;color:var(--green-ok)">$${totalGastado.toLocaleString('es-AR')}</div></div>
    </div>
    ${c.notas?`<div style="margin-bottom:16px"><div class="form-label">Notas</div><div style="font-size:13px;color:var(--mid-gray);line-height:1.5">${esc(c.notas)}</div></div>`:''}
    <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mid-gray);margin-bottom:12px;font-weight:500">Historial</div>
    ${historial.length?historial.map(h=>`<div style="display:flex;gap:12px;padding:9px 0;border-bottom:1px solid var(--light-gray)">
      <span style="font-size:10px;background:var(--light-gray);padding:2px 7px;border-radius:8px;white-space:nowrap;align-self:flex-start">${h.tipo}</span>
      <div style="flex:1;min-width:0"><div style="font-size:13px">${esc(h.desc)}</div>${h.extra?`<div style="font-size:11px;color:var(--mid-gray)">${esc(h.extra)}</div>`:''}</div>
      <span style="font-size:11px;color:var(--mid-gray);white-space:nowrap">${fmtDate(h.fecha)}</span>
    </div>`).join(''):'<div style="color:var(--mid-gray);font-size:13px">Sin historial registrado.</div>'}
    <div class="modal-actions" style="margin-top:20px">
      <button class="btn-secondary" onclick="editarCliente(${idx})">Editar</button>
      <button class="btn-secondary" style="color:var(--red-alert)" onclick="eliminarCliente(${idx})">Eliminar</button>
    </div>`;
  document.getElementById('ficha-cliente-modal').classList.add('open');
}

export function openNuevoClienteModal(idx=-1){
  const c = idx>=0 ? clientesData[idx] : {};
  document.getElementById('crm-idx').value = idx;
  ['crm-nombre','crm-empresa','crm-telefono','crm-email','crm-tipo','crm-notas'].forEach(id=>{
    const key = id.replace('crm-','');
    const el = document.getElementById(id);
    if(el) el.value = c[key]||'';
  });
  document.getElementById('crm-modal').classList.add('open');
}

export function editarCliente(idx){ closeModal('ficha-cliente-modal'); openNuevoClienteModal(idx); }

export function guardarCliente(){
  const nombre = document.getElementById('crm-nombre')?.value?.trim();
  if(!nombre){ showToast('El nombre es obligatorio'); return; }
  const idx = +document.getElementById('crm-idx').value;
  const entry = {
    id: idx>=0 ? (clientesData[idx]?.id||Date.now()) : Date.now(),
    nombre,
    empresa: document.getElementById('crm-empresa')?.value?.trim()||'',
    telefono: document.getElementById('crm-telefono')?.value?.trim()||'',
    email: document.getElementById('crm-email')?.value?.trim()||'',
    tipo: document.getElementById('crm-tipo')?.value||'',
    notas: document.getElementById('crm-notas')?.value?.trim()||'',
    ts: Date.now()
  };
  if(idx>=0) clientesData[idx]=entry;
  else clientesData.push(entry);
  fbSave('clientesData', clientesData);
  closeModal('crm-modal');
  renderClientes();
  showToast(idx>=0?'Cliente actualizado':'Cliente registrado');
}

export async function eliminarCliente(idx){
  if(!await confirmModal('¿Eliminar este cliente?')) return;
  clientesData.splice(idx,1);
  fbSave('clientesData', clientesData);
  closeModal('ficha-cliente-modal');
  renderClientes();
}
