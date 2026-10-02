// Guía de bienvenida por rol (primer ingreso de cada persona).
// ── ONBOARDING ────────────────────────────────────────────────
const ONBOARDING_STEPS = {
  gerencia: [
    { title:'Bienvenido al Panel de Gerencia', body:'Desde acá tenés visibilidad completa de operaciones, equipo, ventas, reportes y más. Usá el menú lateral para navegar entre secciones.', icon:'' },
    { title:'Reportes & Auditoría', body:'En Reportes encontrás análisis de equipo, cierre del día, ventas y costo del hotel. Todo se actualiza en tiempo real desde Firebase.', icon:'' },
    { title:'Cierre de Caja', body:'Desde Control de Caja podés cerrar el día y archivar el resumen. El historial queda registrado con quién hizo el cierre.', icon:'' },
    { title:'Búsqueda global', body:'Usá Ctrl+K para buscar rápidamente en stock, ventas, eventos, glosario y páginas desde cualquier lugar de la app.', icon:'' },
  ],
  operario: [
    { title:'Panel de Operaciones', body:'Desde acá gestionás los eventos del hotel, el stock de florería y el cotizador. Tu trabajo del día a día está en la sección Operaciones.', icon:'' },
    { title:'Eventos / Maison', body:'En Eventos encontrás todos los eventos activos del hotel. Podés ver zonas, estados y detalles de cada uno.', icon:'' },
    { title:'Stock Florería', body:'En Stock podés ver disponibilidad de flores e insumos. Reportá alertas de stock bajo a gerencia.', icon:'' },
  ],
  florista: [
    { title:'Tu panel de trabajo', body:'Registrá tu inicio y fin de turno desde Checklist. Eso nos ayuda a calcular tu productividad del día.', icon:'' },
    { title:'Checklist Diaria', body:'En Checklist encontrás las tareas asignadas a vos. Completalas a medida que avanza el día.', icon:'' },
    { title:'Inicio', body:'Desde Inicio podés ver el resumen del día: eventos, alertas de stock y productividad de la florería.', icon:'' },
  ],
  jardinero: [
    { title:'Panel de Jardinería', body:'Registrá tu turno y completá las tareas de las zonas asignadas. Todo queda registrado en tiempo real.', icon:'' },
    { title:'Tareas de Jardinería', body:'En Operaciones › Tareas Jardinería encontrás el detalle de cada zona y sección del hotel.', icon:'' },
    { title:'Control & Horarios', body:'Desde Control podés ver tus horarios, productividad y recordatorios de mantenimiento.', icon:'' },
  ],
  compras: [
    { title:'Área de Compras', body:'Gestionás las compras de florería y jardinería, recepción de pedidos y el stock general.', icon:'' },
    { title:'Recepción de Pedidos', body:'Registrá cada pedido recibido con proveedor, costo y estado. Eso actualiza el stock automáticamente.', icon:'' },
    { title:'Stock Admin', body:'Desde Compras › Gestión de Stock podés ajustar máximos y mínimos de stock.', icon:'' },
  ],
  ventas: [
    { title:'Panel Hyatt', body:'Tenés acceso al catálogo de ramos disponibles y pedidos de habitación. Podés consultar lista de precios.', icon:'' },
    { title:'Ramos Disponibles', body:'Aquí encontrás el catálogo actualizado de ramos con precios y descripción para ofrecer a los huéspedes.', icon:'' },
    { title:'Pedidos de Habitación', body:'Registrá pedidos de los huéspedes. El equipo de florería los recibe en tiempo real.', icon:'' },
  ],
  comercial: [
    { title:'Área Comercial', body:'Tenés acceso a eventos, ventas externas, caja, glosario, lista de precios y composiciones.', icon:'' },
    { title:'Eventos & Ventas', body:'Registrá eventos y ventas externas. Los datos alimentan los reportes de gerencia automáticamente.', icon:'' },
    { title:'Glosario & Precios', body:'En Glosario encontrás el muestrario floral. La Lista de Precios está siempre actualizada.', icon:'' },
  ],
};

let _onboardingStep = 0;
let _onboardingRole = '';

export function checkOnboarding(role){
  const key = 'fd-onboarding-' + role;
  if(localStorage.getItem(key)) return;
  _onboardingRole = role;
  _onboardingStep = 0;
  showOnboardingStep();
}

function showOnboardingStep(){
  const steps = ONBOARDING_STEPS[_onboardingRole] || [];
  if(!steps.length || _onboardingStep >= steps.length){ finishOnboarding(); return; }
  const step = steps[_onboardingStep];
  const total = steps.length;

  let ov = document.getElementById('onboarding-overlay');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'onboarding-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(4px)';
    document.body.appendChild(ov);
  }
  ov.innerHTML = `
    <div style="background:var(--warm-white);border-radius:20px;max-width:480px;width:100%;padding:40px;text-align:center;box-shadow:var(--shadow-lg);animation:slideUp .3s ease">
      <div style="font-size:48px;margin-bottom:20px">${step.icon}</div>
      <div style="font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:500;margin-bottom:12px;color:var(--charcoal)">${step.title}</div>
      <div style="font-size:14px;color:var(--mid-gray);line-height:1.7;margin-bottom:28px">${step.body}</div>
      <div style="display:flex;gap:6px;justify-content:center;margin-bottom:24px">
        ${steps.map((_,i)=>`<div style="width:8px;height:8px;border-radius:50%;background:${i===_onboardingStep?'var(--charcoal)':'var(--light-gray)'};transition:background .2s"></div>`).join('')}
      </div>
      <div style="display:flex;gap:12px;justify-content:center">
        <button onclick="finishOnboarding()" style="background:none;border:1px solid var(--light-gray);border-radius:8px;padding:10px 20px;font-size:13px;cursor:pointer;color:var(--mid-gray);font-family:'DM Sans',sans-serif">Saltar</button>
        <button onclick="nextOnboardingStep()" style="background:var(--charcoal);color:var(--warm-white);border:none;border-radius:8px;padding:10px 24px;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif">${_onboardingStep<total-1?'Siguiente →':'Comenzar'}</button>
      </div>
    </div>`;
}

export function nextOnboardingStep(){
  const steps = ONBOARDING_STEPS[_onboardingRole] || [];
  _onboardingStep++;
  if(_onboardingStep >= steps.length) finishOnboarding();
  else showOnboardingStep();
}

export function finishOnboarding(){
  localStorage.setItem('fd-onboarding-' + _onboardingRole, '1');
  document.getElementById('onboarding-overlay')?.remove();
}
