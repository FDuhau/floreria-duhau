// ── Worker de Cloudflare: assets estáticos + API de notificaciones push ───────
// Las requests que no matchean un asset caen acá. /api/push recibe las
// suscripciones (el cliente las lee de Firebase, ya filtradas por destinatario)
// y les envía la notificación cifrada vía Web Push.
import { sendWebPush } from './webpush.js';

export default {
  async fetch(request, env){
    const url = new URL(request.url);
    if(url.pathname === '/api/push' && request.method === 'POST'){
      return handlePush(request, env);
    }
    return env.ASSETS.fetch(request);
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
