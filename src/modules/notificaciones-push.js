import { showToast } from './tema-toast.js';

// closeModal vive en app.js: se lee por window al momento de usarlo.
const closeModal = (...a) => window.closeModal(...a);

// ── Push Notifications UI ─────────────────────────────────────────────────────
export function openPushNotifModal(){
  let ov=document.getElementById('push-modal');
  if(!ov){
    ov=document.createElement('div'); ov.id='push-modal'; ov.className='modal-overlay';
    ov.innerHTML=`<div class="modal" style="max-width:400px">
      <button class="modal-close" onclick="closeModal('push-modal')">✕</button>
      <div class="modal-title">Enviar Notificación</div>
      <div class="form-group"><label class="form-label">Título</label><input class="form-input-modal" id="pn-titulo" placeholder="ej. Recordatorio de reunión"></div>
      <div class="form-group"><label class="form-label">Mensaje</label><textarea class="form-input-modal" id="pn-body" rows="3" placeholder="ej. Reunión de equipo a las 10:00"></textarea></div>
      <div class="modal-actions">
        <button class="btn-secondary" onclick="closeModal('push-modal')">Cancelar</button>
        <button class="btn-add" onclick="enviarPushNotif()">Enviar a todos</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
  }
  ov.classList.add('open');
}

export async function enviarPushNotif(){
  const title=document.getElementById('pn-titulo')?.value?.trim();
  const body=document.getElementById('pn-body')?.value?.trim();
  if(!title||!body){ showToast('Completá título y mensaje'); return; }
  await window.pushSend?.(title,body);
  closeModal('push-modal');
  showToast('Notificación enviada al equipo');
}

export async function initPushForUser(){
  if(!('Notification' in window)) return;
  if(Notification.permission==='default'){
    const granted=await window.pushRequestPermission?.();
    if(granted) showToast('Notificaciones activadas — los avisos llegan aunque cierres la app');
  } else if(Notification.permission==='granted'){
    // Refrescar la suscripción con la identidad/roles del usuario logueado
    await window.pushRequestPermission?.();
  }
}

// Activación manual desde el menú (por si se denegó o no saltó el pedido)
export async function activarNotificaciones(){
  if(!('Notification' in window) || !('PushManager' in window)){
    showToast('Este navegador no soporta notificaciones push'); return;
  }
  if(Notification.permission==='denied'){
    showToast('Las notificaciones están bloqueadas — habilitalas en la configuración del navegador para este sitio'); return;
  }
  const ok = await window.pushRequestPermission?.();
  showToast(ok ? 'Notificaciones activadas en este dispositivo' : 'No se pudieron activar las notificaciones');
}
