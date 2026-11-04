// ── VALIDACIÓN DE FORMULARIOS ───────────────────────────────────────────────
// Marca en rojo el campo con problema, escribe debajo qué falta y lleva el foco
// ahí, en vez de no hacer nada o mostrar solo un aviso que se va.
//
//   validarCampos([
//     { id: 'cj-desc-caja', req: true, msg: 'Escribí una descripción' },
//     { id: 'cj-monto', tipo: 'monto', req: true },
//     { id: 'sale-fecha', tipo: 'fecha' },
//   ])  → true si está todo bien
//
// tipo 'monto': número mayor a 0 (acepta "$ 12.500,50").  tipo 'fecha': AAAA-MM-DD válida.
// Los campos con data-valida="monto|fecha" se revisan además al salir del campo.

import { parseMoney } from './utils.js';

function labelDe(el){
  const prev = el.previousElementSibling;
  if(prev && prev.tagName === 'LABEL') return prev;
  const cont = el.closest('.form-group, .modal-row > div, div');
  return cont?.querySelector(':scope > label') || null;
}

function valorVacio(el){
  const v = (el.value ?? '').trim();
  return !v || v === '__otro__';
}

function problema(el, r){
  const vacio = valorVacio(el);
  if(vacio) return r.req ? (r.msg || 'Este dato es obligatorio') : '';
  const v = el.value.trim();
  if(r.tipo === 'monto'){
    const n = parseMoney(v);
    if(!isFinite(n) || n <= 0) return r.msgTipo || 'Ingresá un monto mayor a 0';
  }
  if(r.tipo === 'fecha'){
    const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(v + 'T12:00:00') : null;
    if(!d || isNaN(d)) return 'Fecha inválida';
    const y = d.getFullYear();
    if(y < 2000 || y > 2100) return 'Revisá el año';
  }
  return '';
}

export function marcarError(el, msg){
  limpiarError(el);
  el.classList.add('campo-error');
  el.setAttribute('aria-invalid', 'true');
  const m = document.createElement('div');
  m.className = 'campo-error-msg';
  m.textContent = msg;
  el.insertAdjacentElement('afterend', m);
}
export function limpiarError(el){
  el.classList.remove('campo-error');
  el.removeAttribute('aria-invalid');
  const sig = el.nextElementSibling;
  if(sig?.classList.contains('campo-error-msg')) sig.remove();
}

export function validarCampos(reglas){
  let primero = null;
  reglas.forEach(r => {
    const el = document.getElementById(r.id);
    if(!el) return;
    const p = problema(el, r);
    if(p){ marcarError(el, p); primero = primero || el; }
    else limpiarError(el);
  });
  if(primero){
    primero.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(() => primero.focus({ preventScroll: true }), 150);
    return false;
  }
  return true;
}

// Marca con * los campos obligatorios de cada formulario.
export function marcarObligatorios(ids){
  ids.forEach(id => {
    const el = document.getElementById(id);
    const lb = el && labelDe(el);
    if(lb && !/\*\s*$/.test(lb.textContent)) lb.classList.add('req');
  });
}

// Al escribir se quita la marca; al salir de un campo con data-valida se revisa.
document.addEventListener('input', e => { if(e.target.classList?.contains('campo-error')) limpiarError(e.target); });
document.addEventListener('change', e => { if(e.target.classList?.contains('campo-error')) limpiarError(e.target); });
document.addEventListener('focusout', e => {
  const el = e.target, tipo = el?.dataset?.valida;
  if(!tipo || valorVacio(el)) return;
  const p = problema(el, { tipo });
  if(p) marcarError(el, p); else limpiarError(el);
});

window.validarCampos = validarCampos;
