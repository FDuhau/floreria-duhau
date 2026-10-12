import { showToast } from './tema-toast.js';

// ════════════════════════════════════════
// FEATURE 1: PWA — Install Prompt
// ════════════════════════════════════════
let _pwaInstallEvent = null;
const _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const _isAndroid = /Android/.test(navigator.userAgent);
const _isInStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

if('serviceWorker' in navigator){
  // Auto-actualización: cuando se activa un service worker nuevo (versión nueva
  // desplegada), recargar la app sola para tomar el código nuevo. Evita que los
  // dispositivos queden pegados en una versión vieja cacheada.
  let _swReloading = false;
  // Solo si YA había un SW controlando (no en la primerísima instalación, para
  // no recargar de más la primera vez).
  if(navigator.serviceWorker.controller){
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if(_swReloading) return;
      _swReloading = true;
      try { window.showToast?.('Actualizando a la última versión…'); } catch(e){}
      setTimeout(() => location.reload(), 800);
    });
  }
  // Registrar el MISMO SW que index.html para no tener dos en conflicto en el
  // mismo scope (lo que puede romper la instalabilidad / beforeinstallprompt).
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(reg => {
      // Volver a chequear si hay versión nueva cada vez que la app gana foco
      // (útil para la PWA instalada que queda abierta mucho tiempo).
      document.addEventListener('visibilitychange', () => {
        if(document.visibilityState === 'visible') reg.update().catch(()=>{});
      });
    }).catch(()=>{});
  });
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  _pwaInstallEvent = e;
  _showPWABtn();
});

window.addEventListener('appinstalled', () => {
  const top = document.getElementById('pwa-topbar-btn');
  if(top) top.style.display = 'none';
  const fl = document.getElementById('pwa-install-btn');
  if(fl) fl.style.display = 'none';
  document.getElementById('pwa-ios-banner')?.remove();
  document.getElementById('pwa-android-banner')?.remove();
  showToast('App instalada correctamente');
});

// Muestra el botón de instalar: ícono en topbar + botón flotante prominente.
function _showPWABtn(){
  const top = document.getElementById('pwa-topbar-btn');
  if(top) top.style.display = '';
  const fl = document.getElementById('pwa-install-btn');
  if(fl) fl.style.display = 'flex';
}

function _initPWAPrompt(){
  if(_isInStandalone) return; // ya instalada
  if(_isIOS){
    // iOS no soporta beforeinstallprompt — mostrar banner con instrucciones manuales
    if(document.getElementById('pwa-ios-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'pwa-ios-banner';
    banner.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="font-size:24px;flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:13px;margin-bottom:4px">Instalar app en iPhone / iPad</div>
          <div style="font-size:12px;line-height:1.5">Tocá <strong>⎙ Compartir</strong> en la barra de Safari y luego <strong>"Agregar a pantalla de inicio"</strong></div>
        </div>
        <button onclick="document.getElementById('pwa-ios-banner').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#fff;padding:0;line-height:1">✕</button>
      </div>`;
    banner.style.cssText = 'position:fixed;bottom:80px;left:16px;right:16px;background:#1a1a18;color:#fff;border-radius:14px;padding:14px 16px;z-index:9000;box-shadow:0 8px 24px rgba(0,0,0,0.3);font-family:inherit';
    document.body.appendChild(banner);
  } else if(_isAndroid){
    // Android sin beforeinstallprompt (común al abrir desde el navegador in-app
    // de WhatsApp/Instagram, o por heurística de Chrome): instrucciones manuales.
    if(document.getElementById('pwa-android-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'pwa-android-banner';
    banner.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:12px">
        <div style="font-size:24px;flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:13px;margin-bottom:4px">Instalar app en Android</div>
          <div style="font-size:12px;line-height:1.5">Tocá el menú <strong>⋮</strong> de Chrome (arriba a la derecha) y elegí <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.<br><span style="opacity:.8">Si abriste el link desde WhatsApp, abrilo primero en Chrome.</span></div>
        </div>
        <button onclick="document.getElementById('pwa-android-banner').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#fff;padding:0;line-height:1">✕</button>
      </div>`;
    banner.style.cssText = 'position:fixed;bottom:80px;left:16px;right:16px;background:#1a1a18;color:#fff;border-radius:14px;padding:14px 16px;z-index:9000;box-shadow:0 8px 24px rgba(0,0,0,0.3);font-family:inherit';
    document.body.appendChild(banner);
  }
}

export function installPWA(){
  // Si el navegador ofrece la instalación nativa (Android/Chrome/Edge), usarla.
  if(_pwaInstallEvent){
    _pwaInstallEvent.prompt();
    _pwaInstallEvent.userChoice.then(choice => {
      if(choice.outcome==='accepted'){ showToast('App instalada'); document.getElementById('pwa-topbar-btn')?.style && (document.getElementById('pwa-topbar-btn').style.display='none'); document.getElementById('pwa-install-btn')?.style && (document.getElementById('pwa-install-btn').style.display='none'); }
      _pwaInstallEvent = null;
    });
    return;
  }
  // Sin evento nativo: instrucciones manuales según plataforma.
  if(_isIOS || _isAndroid){ _initPWAPrompt(); return; }
  // PC sin evento (ya instalada, o navegador sin soporte de instalación).
  showToast('Para instalarla, usá el ícono de instalar ⊕ en la barra de direcciones de Chrome/Edge.');
}

// Mostrar el botón de instalar siempre que no esté ya instalada, tanto en iOS
// como en Android (en Android beforeinstallprompt no siempre dispara).
// Mostrar el botón "Instalar app" en el menú lateral si todavía no está
// instalada (cualquier plataforma). No se auto-abre ningún banner: las
// instrucciones aparecen solo cuando el usuario toca el botón.
if(!_isInStandalone){
  window.addEventListener('load', _showPWABtn);
}
