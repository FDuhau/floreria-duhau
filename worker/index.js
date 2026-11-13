// ── Worker de Cloudflare: assets estáticos + API de notificaciones push ───────
// Las requests que no matchean un asset caen acá. /api/push recibe las
// suscripciones (el cliente las lee de Firebase, ya filtradas por destinatario)
// y les envía la notificación cifrada vía Web Push.
import { sendWebPush } from './webpush.js';
import { handleLogin, handleEstado } from './login.js';
import { limpiarFotosRamo } from './fotos-ramo.js';
import { enviarResumenDiario, HORA_ENVIO_UTC } from './resumen-diario.js';
import { enviarHousekeepingDiario } from './housekeeping-diario.js';

export default {
  async fetch(request, env){
    const url = new URL(request.url);
    if(url.pathname === '/api/push' && request.method === 'POST'){
      return handlePush(request, env);
    }
    if(url.pathname === '/api/login' && request.method === 'POST'){
      return handleLogin(request, env);
    }
    if(url.pathname === '/api/login-estado' && request.method === 'GET'){
      return handleEstado(env);
    }
    return env.ASSETS.fetch(request);
  },
  // Cron (ver "triggers" en wrangler.jsonc): borra las fotos de ramos con más de 48 hs.
  async scheduled(event, env, ctx){
    ctx.waitUntil(limpiarFotosRamo(env).catch((e) => console.warn('limpiarFotosRamo:', e)));
    // Resumen diario por mail: una vez por día, a las 8:00 de Argentina.
    if(new Date(event.scheduledTime).getUTCHours() === HORA_ENVIO_UTC){
      ctx.waitUntil(enviarResumenDiario(env, event.scheduledTime).catch((e) => console.warn('resumenDiario:', e)));
      // Mail a Housekeeping con las habitaciones a ingresar (si hay destinatarios cargados).
      ctx.waitUntil(enviarHousekeepingDiario(env, event.scheduledTime).catch((e) => console.warn('housekeepingDiario:', e)));
    }
  },
};

async function handlePush(request, env){
  if(!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY){
    return json({ error: 'VAPID keys no configuradas' }, 500);
  }
  let data;
  try { data = await request.json(); } catch(e){ return json({ error: 'JSON inválido' }, 400); }
  const subs = Array.isArray(data?.subs) ? data.subs.slice(0, 60) : [];
  if(!subs.length) return json({ results: [] });

  const payload = JSON.stringify({
    title: String(data?.title || 'Florería Duhau').slice(0, 120),
    body:  String(data?.body  || '').slice(0, 400),
    tag:   String(data?.tag   || 'general').slice(0, 40),
  });
  const subject = env.VAPID_SUBJECT || 'mailto:operaciones@lafloreriadelduhau.com.ar';

  const results = await Promise.all(subs.map(async (s) => {
    try {
      if(!s?.endpoint || !s?.keys?.p256dh || !s?.keys?.auth) return { ok: false, error: 'sub incompleta' };
      const status = await sendWebPush(s, payload, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY, subject);
      // 404/410 = la suscripción ya no existe; el cliente la borra de Firebase
      return { ok: status >= 200 && status < 300, status, gone: status === 404 || status === 410 };
    } catch(e){
      return { ok: false, error: String(e && e.message || e).slice(0, 140) };
    }
  }));
  return json({ results });
}

function json(obj, status = 200){
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
