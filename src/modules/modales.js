// ════════════════════════════════════════════════════════════
//  Ventanas estiladas (confirmar / avisar / pedir un dato)
//  Extraídas de app.js. Solo usan el DOM, no el estado de la app.
//  Siguen colgadas de window para el HTML que las llama directo.
// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════
// CONFIRMACIÓN ESTILADA (reemplaza a confirm() nativo)
// Devuelve una Promesa<boolean>. Uso: if(!await confirmModal('¿Borrar?')) return;
// Respeta \n en el mensaje (white-space:pre-line). Si el texto sugiere una
// acción destructiva (Eliminar/Borrar/Quitar/Limpiar/Resetear), el botón
// principal se pinta en rojo.
// ════════════════════════════════════════
export function confirmModal(message, opts){
  opts = opts || {};
  const danger = opts.danger != null
    ? opts.danger
    : /eliminar|borrar|quitar|limpiar|resetear|reemplaza/i.test(message || '');
  const title    = opts.title    || (danger ? 'Confirmar' : 'Confirmar');
  const okText   = opts.okText   || 'Confirmar';
  const cancelText = opts.cancelText || 'Cancelar';

  return new Promise(resolve => {
    let ov = document.getElementById('confirm-modal-overlay');
    if(!ov){
      ov = document.createElement('div');
      ov.id = 'confirm-modal-overlay';
      ov.className = 'modal-overlay';
      ov.innerHTML =
        '<div class="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title" aria-describedby="confirm-modal-msg">' +
          '<div class="modal-title" id="confirm-modal-title"></div>' +
          '<div class="confirm-modal-msg" id="confirm-modal-msg"></div>' +
          '<div class="modal-actions">' +
            '<button type="button" class="btn-secondary" id="confirm-modal-cancel"></button>' +
            '<button type="button" class="btn-add" id="confirm-modal-ok"></button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(ov);
    }
    const titleEl  = ov.querySelector('#confirm-modal-title');
    const msgEl    = ov.querySelector('#confirm-modal-msg');
    const okBtn    = ov.querySelector('#confirm-modal-ok');
    const cancelBtn= ov.querySelector('#confirm-modal-cancel');

    titleEl.textContent  = title;
    msgEl.textContent    = message || '';
    okBtn.textContent    = okText;
    cancelBtn.textContent= cancelText;
    okBtn.classList.toggle('btn-danger', !!danger);

    const prevFocus = document.activeElement;
    function cleanup(result){
      ov.classList.remove('open');
      document.removeEventListener('keydown', onKey, true);
      okBtn.onclick = cancelBtn.onclick = ov.onclick = null;
      if(prevFocus && prevFocus.focus){ try{ prevFocus.focus(); }catch(e){} }
      resolve(result);
    }
    function onKey(e){
      // Escape cancela. Enter actúa sobre el botón con foco (comportamiento nativo),
      // por eso no lo interceptamos: así evitamos confirmar sin querer.
      if(e.key === 'Escape'){ e.preventDefault(); cleanup(false); }
    }
    okBtn.onclick     = () => cleanup(true);
    cancelBtn.onclick = () => cleanup(false);
    ov.onclick        = e => { if(e.target === ov) cleanup(false); };
    document.addEventListener('keydown', onKey, true);

    ov.classList.add('open');
    // Foco en "Cancelar" por seguridad (evita borrados accidentales con Enter doble)
    setTimeout(() => { try{ cancelBtn.focus(); }catch(e){} }, 30);
  });
}
window.confirmModal = confirmModal;

// ════════════════════════════════════════
// AVISO ESTILADO (reemplaza a alert() de información)
// Modal de un solo botón. Devuelve Promise que resuelve al cerrar.
// Para errores de validación cortos preferí showToast(msg,'error').
// ════════════════════════════════════════
export function alertModal(message, opts){
  opts = opts || {};
  const title  = opts.title  || 'Aviso';
  const okText = opts.okText || 'Entendido';
  return new Promise(resolve => {
    let ov = document.getElementById('alert-modal-overlay');
    if(!ov){
      ov = document.createElement('div');
      ov.id = 'alert-modal-overlay';
      ov.className = 'modal-overlay';
      ov.innerHTML =
        '<div class="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="alert-modal-title" aria-describedby="alert-modal-msg">' +
          '<div class="modal-title" id="alert-modal-title"></div>' +
          '<div class="confirm-modal-msg" id="alert-modal-msg"></div>' +
          '<div class="modal-actions">' +
            '<button type="button" class="btn-add" id="alert-modal-ok"></button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(ov);
    }
    ov.querySelector('#alert-modal-title').textContent = title;
    ov.querySelector('#alert-modal-msg').textContent   = message || '';
    const okBtn = ov.querySelector('#alert-modal-ok');
    okBtn.textContent = okText;
    const prevFocus = document.activeElement;
    function cleanup(){
      ov.classList.remove('open');
      document.removeEventListener('keydown', onKey, true);
      okBtn.onclick = ov.onclick = null;
      if(prevFocus && prevFocus.focus){ try{ prevFocus.focus(); }catch(e){} }
      resolve();
    }
    function onKey(e){ if(e.key === 'Escape' || e.key === 'Enter'){ e.preventDefault(); cleanup(); } }
    okBtn.onclick = cleanup;
    ov.onclick = e => { if(e.target === ov) cleanup(); };
    document.addEventListener('keydown', onKey, true);
    ov.classList.add('open');
    setTimeout(() => { try{ okBtn.focus(); }catch(e){} }, 30);
  });
}
window.alertModal = alertModal;

// ════════════════════════════════════════
// INPUT ESTILADO (reemplaza a prompt() nativo)
// Devuelve Promise<string|null>: el texto al aceptar, null al cancelar.
// opts: { title, okText, cancelText, default, password, placeholder }
// password se autodetecta si el mensaje menciona "contraseña".
// ════════════════════════════════════════
export function promptModal(message, opts){
  opts = opts || {};
  const isPw = opts.password != null ? opts.password : /contraseña|password/i.test(message || '');
  const title    = opts.title    || 'Ingresá un dato';
  const okText   = opts.okText   || 'Aceptar';
  const cancelText = opts.cancelText || 'Cancelar';
  const def      = opts.default != null ? String(opts.default) : '';
  return new Promise(resolve => {
    let ov = document.getElementById('prompt-modal-overlay');
    if(!ov){
      ov = document.createElement('div');
      ov.id = 'prompt-modal-overlay';
      ov.className = 'modal-overlay';
      ov.innerHTML =
        '<div class="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="prompt-modal-title">' +
          '<div class="modal-title" id="prompt-modal-title"></div>' +
          '<div class="confirm-modal-msg" id="prompt-modal-msg"></div>' +
          '<input type="text" class="form-input-modal" id="prompt-modal-input" style="margin-top:12px">' +
          '<div class="modal-actions">' +
            '<button type="button" class="btn-secondary" id="prompt-modal-cancel"></button>' +
            '<button type="button" class="btn-add" id="prompt-modal-ok"></button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(ov);
    }
    ov.querySelector('#prompt-modal-title').textContent = title;
    const msgEl = ov.querySelector('#prompt-modal-msg');
    msgEl.textContent = message || '';
    msgEl.style.display = message ? '' : 'none';
    const input    = ov.querySelector('#prompt-modal-input');
    const okBtn    = ov.querySelector('#prompt-modal-ok');
    const cancelBtn= ov.querySelector('#prompt-modal-cancel');
    input.type = isPw ? 'password' : (opts.type || 'text');
    input.value = def;
    input.placeholder = opts.placeholder || '';
    okBtn.textContent = okText;
    cancelBtn.textContent = cancelText;

    const prevFocus = document.activeElement;
    function cleanup(result){
      ov.classList.remove('open');
      document.removeEventListener('keydown', onKey, true);
      okBtn.onclick = cancelBtn.onclick = ov.onclick = input.onkeydown = null;
      if(prevFocus && prevFocus.focus){ try{ prevFocus.focus(); }catch(e){} }
      resolve(result);
    }
    function onKey(e){ if(e.key === 'Escape'){ e.preventDefault(); cleanup(null); } }
    input.onkeydown = e => { if(e.key === 'Enter'){ e.preventDefault(); cleanup(input.value); } };
    okBtn.onclick     = () => cleanup(input.value);
    cancelBtn.onclick = () => cleanup(null);
    ov.onclick        = e => { if(e.target === ov) cleanup(null); };
    document.addEventListener('keydown', onKey, true);
    ov.classList.add('open');
    setTimeout(() => { try{ input.focus(); input.select(); }catch(e){} }, 30);
  });
}
window.promptModal = promptModal;
