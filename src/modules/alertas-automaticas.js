// ── ALERTAS AUTOMÁTICAS ───────────────────────────────────────────────────────
export function alertasAutomaticas(hoyISO){
  if(Notification.permission !== 'granted') return;

  const bajos = (window.stockData||[]).filter(s => s.alerta === 'comprar');
  if(bajos.length > 0){
    setTimeout(()=>{
      new Notification('⚠️ Stock bajo', {
        body: `${bajos.length} insumo${bajos.length>1?'s':''} por reponer: ${bajos.slice(0,3).map(s=>s.nombre).join(', ')}${bajos.length>3?'...':''}`,
        icon: '/icon-192.png', tag: 'stock-bajo'
      });
    }, 3000);
  }

  const eventosHoyAl = (window.eventosData||[]).filter(ev => ev.fecha === hoyISO && ev.estado !== 'Pedidos Finalizados');
  if(eventosHoyAl.length > 0){
    setTimeout(()=>{
      new Notification('📅 Eventos de hoy', {
        body: eventosHoyAl.map(e => e.nombre).join(' · '),
        icon: '/icon-192.png', tag: 'eventos-hoy'
      });
    }, 5000);
  }

  const now = new Date();
  const cierre = new Date();
  cierre.setHours(18,0,0,0);
  if(now < cierre){
    const delay = cierre.getTime() - now.getTime();
    setTimeout(()=>{
      if(Notification.permission === 'granted'){
        new Notification('💰 Recordatorio de caja', {
          body: 'Es hora de verificar y cerrar la caja del día.',
          icon: '/icon-192.png', tag: 'cierre-caja'
        });
      }
    }, delay);
  }
}
