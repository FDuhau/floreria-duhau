    // ════════════ FIREBASE SETUP ════════════
    import { initializeApp } from "firebase/app";
    import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
    import { getDatabase, ref, set, update, onValue } from "firebase/database";
    import { getAuth, signInAnonymously } from "firebase/auth";

    const firebaseConfig = {
      apiKey: "AIzaSyDU9kLCnXeO7qnINEy121Nktj1K96gJ9Lw",
      authDomain: "floreria-duhau-84de5.firebaseapp.com",
      databaseURL: "https://floreria-duhau-84de5-default-rtdb.firebaseio.com",
      projectId: "floreria-duhau-84de5",
      storageBucket: "floreria-duhau-84de5.firebasestorage.app",
      messagingSenderId: "921311806468",
      appId: "1:921311806468:web:0c82d94e40857eddb1e151"
    };

    const fbApp = initializeApp(firebaseConfig);

    // ── App Check ─────────────────────────────────────────────────
    // Mitiga el abuso de la base desde fuera de la app real (scripts que usan
    // la config pública). No reemplaza a una autenticación real, pero sube
    // mucho la barrera. Se activa SOLO si hay una clave de sitio reCAPTCHA v3
    // configurada (VITE_APPCHECK_SITE_KEY); sin clave es un no-op y la app
    // funciona igual que hoy. Pasos para activarlo: ver SECURITY.md.
    // Clave de sitio reCAPTCHA v3 (pública — la secreta va en la consola de Firebase).
    // Se puede sobreescribir por entorno con VITE_APPCHECK_SITE_KEY.
    const APPCHECK_SITE_KEY = import.meta.env.VITE_APPCHECK_SITE_KEY || '6Ld64DQtAAAAAObMaasjrkPECxeUAS4msjA32zmF';
    if(APPCHECK_SITE_KEY){
      try {
        initializeAppCheck(fbApp, {
          provider: new ReCaptchaV3Provider(APPCHECK_SITE_KEY),
          isTokenAutoRefreshEnabled: true,
        });
      } catch(e){ console.warn('App Check init error:', e); }
    }

    const db    = getDatabase(fbApp);
    const auth  = getAuth(fbApp);

    // Autenticación anónima — requerida por las reglas de la DB.
    // Sin este token, Firebase rechaza todos los reads/writes.
    signInAnonymously(auth).catch(e => console.warn('FB anon auth error:', e));

    // ── Helpers ───────────────────────────────────────────────────
    function fbSet(path, data){
      return _trackWrite(set(ref(db, path), data), 'FB write error:');
    }

    function fbSetPath(path, value){
      return _trackWrite(set(ref(db, path), value), 'FB path write error:');
    }

    function fbUpdate(path, updates){
      return _trackWrite(update(ref(db, path), updates), 'FB update error:');
    }

    function fbListen(path, cb){
      onValue(ref(db, path), snap => {
        const val = snap.val();
        if(val !== null) cb(val);
      });
    }

    // ════════════ ESTADO DE CONEXIÓN Y GUARDADO ════════════
    // Indicador visible arriba al centro: avisa cuando no hay conexión
    // y confirma cada guardado (Guardando… / Guardado ✓ / Error).
    // Usa .info/connected de Firebase (refleja la sincronización real,
    // no solo si hay wifi) + el evento offline del navegador para reaccionar
    // al instante. Las escrituras hechas sin conexión quedan en cola y se
    // sincronizan solas al volver, por eso el aviso tranquiliza al usuario.
    let _isConnected   = true;  // se asume conectado hasta que .info/connected diga lo contrario (evita parpadeo al cargar)
    let _pendingWrites = 0;     // escrituras en vuelo (o en cola si está offline)
    let _statusEl      = null;
    let _statusHideTimer = null;
    let _offlineTimer  = null;

    function _ensureStatusEl(){
      if(_statusEl) return _statusEl;
      const el = document.createElement('div');
      el.id = 'fb-status';
      el.className = 'fb-status';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      (document.body || document.documentElement).appendChild(el);
      _statusEl = el;
      return el;
    }

    function _renderStatus(){
      const el = _ensureStatusEl();
      clearTimeout(_statusHideTimer);
      // Prioridad: sin conexión > guardando.
      if(!_isConnected){
        el.textContent = '⚠ Sin conexión — los cambios se guardan al volver';
        el.dataset.state = 'offline';
        el.classList.add('visible');
        return;
      }
      if(_pendingWrites > 0){
        el.textContent = '⟳ Guardando…';
        el.dataset.state = 'saving';
        el.classList.add('visible');
        return;
      }
      // Con conexión y sin pendientes: ocultar.
      el.classList.remove('visible');
    }

    function _flashSaved(ok){
      // No molestamos con "Guardado" si seguimos offline o quedan escrituras.
      if(!_isConnected || _pendingWrites > 0) return;
      const el = _ensureStatusEl();
      clearTimeout(_statusHideTimer);
      el.textContent  = ok ? 'Guardado ✓' : '⚠ Error al guardar';
      el.dataset.state = ok ? 'saved' : 'error';
      el.classList.add('visible');
      _statusHideTimer = setTimeout(() => {
        if(_pendingWrites === 0 && _isConnected) el.classList.remove('visible');
      }, ok ? 1600 : 5000);
    }

    function _trackWrite(promise, errLabel){
      _pendingWrites++;
      _renderStatus();
      return promise.then(
        () => { _pendingWrites = Math.max(0, _pendingWrites - 1); _renderStatus(); _flashSaved(true); },
        (e) => { _pendingWrites = Math.max(0, _pendingWrites - 1); console.warn(errLabel || 'FB write error:', e); _renderStatus(); _flashSaved(false); }
      );
    }

    // Estado de conexión real con Firebase (más fiable que navigator.onLine).
    onValue(ref(db, '.info/connected'), snap => {
      const connected = snap.val() === true;
      if(connected){
        clearTimeout(_offlineTimer);
        _isConnected = true;
        _renderStatus();
      } else {
        // Debounce: evitar el falso "Sin conexión" durante el handshake inicial
        // o microcortes. Solo avisamos si persiste unos segundos.
        clearTimeout(_offlineTimer);
        _offlineTimer = setTimeout(() => { _isConnected = false; _renderStatus(); }, 3000);
      }
    });

    // El navegador detecta la caída de red al instante (Firebase puede tardar
    // hasta un minuto en notar el corte por su keepalive).
    window.addEventListener('offline', () => { clearTimeout(_offlineTimer); _isConnected = false; _renderStatus(); });
    // Al volver online dejamos que .info/connected confirme la sincronización real.

    // ── Expose to global scope so non-module script can call them ─
    window.fbSet     = fbSet;
    window.fbSetPath = fbSetPath;
    window.fbUpdate  = fbUpdate;
    window.fbListen  = fbListen;
    window.fbReady   = true;

    // ── Push Notifications (Web Push real vía Worker) ─────────────
    // El navegador se suscribe con la clave pública VAPID y la suscripción se
    // guarda en Firebase (pushSubs). Al enviar, el cliente filtra las
    // suscripciones por destinatario y el Worker (/api/push) cifra y entrega —
    // llega aunque la app esté cerrada.
    const VAPID_PUBLIC_KEY = 'BPdHl3-CEMyDYx0j780ImwvNPCGaBInhq6lnNOjv6iJu8lfdHb-gcu9kROVchB4jf5oEul748FN_PKwQpc2x0gE';

    let pushSubsCache = {};
    fbListen('pushSubs', val => { pushSubsCache = (val && typeof val === 'object') ? val : {}; });

    function _pushDeviceId(){
      try {
        let id = localStorage.getItem('pushDeviceId');
        if(!id){ id = Math.random().toString(36).slice(2,10) + Date.now().toString(36); localStorage.setItem('pushDeviceId', id); }
        return id;
      } catch(e){ return 'anon'; }
    }

    function _b64uToUint8(s){
      s = s.replace(/-/g,'+').replace(/_/g,'/');
      const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
      return Uint8Array.from(atob(s + pad), c => c.charCodeAt(0));
    }

    async function pushRequestPermission(){
      try {
        if(!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') return false;
        const perm = await Notification.requestPermission();
        if(perm !== 'granted') return false;
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: _b64uToUint8(VAPID_PUBLIC_KEY) });
        const ident = window._pushIdentity || {};
        const id = _pushDeviceId();
        const key = String(ident.label || 'anon').toLowerCase().replace(/[.#$/\[\]\s]/g,'_') + '_' + id;
        const subJson = sub.toJSON();
        const newEndpoint = subJson && subJson.endpoint || '';
        fbSetPath('pushSubs/' + key, {
          sub: subJson,
          label: ident.label || '',
          roles: ident.roles || [],
          deviceId: id,
          ts: Date.now(),
          ua: (navigator.userAgent || '').slice(0, 80),
        });
        // Limpiar suscripciones viejas de ESTE mismo dispositivo (mismo deviceId o
        // mismo endpoint push) que tengan otro label: si antes lo usó otra persona,
        // su entrada quedaba viva y este dispositivo recibía también los avisos
        // dirigidos a ella. Un dispositivo/endpoint = un solo usuario.
        Object.entries(pushSubsCache).forEach(([k, e]) => {
          if(!e || k === key) return;
          const mismoDevice   = e.deviceId === id;
          const mismoEndpoint = newEndpoint && e.sub && e.sub.endpoint === newEndpoint;
          if(mismoDevice || mismoEndpoint) fbSetPath('pushSubs/' + k, null);
        });
        return true;
      } catch(e){ console.warn('push subscribe error:', e); return false; }
    }

    async function pushSend(title, body, tag='general', target=''){
      // Aviso in-app para los dispositivos con la app abierta (comportamiento previo)
      fbSet('pushBroadcast/' + Date.now(), { title, body, tag, target, ts: Date.now() });
      // Push real a los dispositivos suscriptos (llega con la app cerrada)
      try {
        const myId = _pushDeviceId();
        const t = String(target || '').toLowerCase();
        const roles = t.startsWith('roles:') ? t.slice(6).split(',').map(s => s.trim()).filter(Boolean) : null;
        const destinos = Object.entries(pushSubsCache).filter(([,e]) => {
          if(!e?.sub?.endpoint) return false;
          if(e.deviceId === myId) return false; // no notificarse a sí mismo
          if(!t) return true;
          if(roles) return (e.roles || []).some(r => roles.includes(String(r).toLowerCase()));
          return String(e.label || '').toLowerCase() === t;
        });
        if(!destinos.length) return;
        const res = await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subs: destinos.map(([,e]) => e.sub), title, body, tag }),
        });
        const out = await res.json().catch(() => null);
        // Limpiar suscripciones muertas (dispositivo desinstalado / permiso revocado)
        out?.results?.forEach((r, i) => { if(r?.gone) fbSetPath('pushSubs/' + destinos[i][0], null); });
      } catch(e){ console.warn('push send error:', e); }
    }

    window.pushRequestPermission = pushRequestPermission;
    window.pushSend = pushSend;

    // Listen for broadcasts — show notification on all connected devices
    let _pushSessionStart = Date.now();
    fbListen('pushBroadcast', val => {
      if(!val) return;
      const me = (window.currentUserLabel || '').toLowerCase();
      const myRole = (window.userRole || '').toLowerCase();
      const entries = Object.values(val);
      const recientes = entries.filter(e => e.ts > _pushSessionStart);
      if(recientes.length) _pushSessionStart = Math.max(_pushSessionStart, ...recientes.map(e => e.ts + 1));
      recientes.forEach(e => {
        // Si la notificación es dirigida, mostrarla solo a quien corresponda.
        // - target "roles:florista,gerencia" → a todos los de esos roles
        // - target "Caro" / "Gerencia"      → solo a esa persona (por label)
        if(e.target){
          const t = String(e.target).toLowerCase();
          if(t.startsWith('roles:')){
            const roles = t.slice(6).split(',').map(s => s.trim()).filter(Boolean);
            if(!roles.includes(myRole)) return;
          } else if(t !== me){
            return;
          }
        }
        // Aviso in-app (visible aunque no haya permiso de notificaciones del navegador)
        window.showToast?.('🔔 ' + (e.title || '') + (e.body ? ' — ' + e.body : ''));
        // Notificación del navegador si hay permiso
        if(typeof Notification !== 'undefined' && Notification.permission === 'granted'){
          try { new Notification(e.title || 'Florería Duhau', { body: e.body || '', icon: '/icon-192.png', tag: e.tag || 'general' }); } catch(err){}
        }
      });
    });

    const _syncRespFloristas = val => {
      Object.values(val||{}).forEach(e => {
        if(e.role === 'florista' && e.floristaNombre && !window.CL_RESP_OPTS?.includes(e.floristaNombre)){
          window.CL_RESP_OPTS?.push(e.floristaNombre);
        }
      });
      if(window.CL_RESP_OPTS) window.CL_RESP_OPTS.sort((a,b) => a.localeCompare(b,'es'));
    };

    // Cargar contraseñas personalizadas ANTES del login
    fbListen('loginPasswords', val => {
      if(val && typeof val === 'object' && Object.keys(val).length > 0){
        // Actualizar la variable real que usa el login (no una copia en window)
        if(window._setLoginPasswords) window._setLoginPasswords(val);
        window.loginPasswords = val;
        _syncRespFloristas(val);
      }
    });

    // Esquema con hash (loginAuth): si existe, el login lo prioriza sobre loginPasswords
    fbListen('loginAuth', val => {
      // Marca que Firebase YA tiene loginAuth (evita que la gestión lo reconstruya
      // desde los defaults antes de que carguen los usuarios reales)
      if(val && typeof val === 'object' && Object.keys(val).length) window._loginAuthReady = true;
      if(window._setLoginAuth) window._setLoginAuth(val);
      if(val && typeof val === 'object') _syncRespFloristas(val);
    });

    // ── Listen to all shared data ─────────────────────────────────
    // Wait for main script to be ready
    window.addEventListener('load', () => {

      fbListen('checklist', val => {
        // No pisar datos locales si se guardó hace menos de 3 segundos
        if(window._checklistLastSave && Date.now() - window._checklistLastSave < 3000) return;
        if(!val || typeof val !== 'object') return; // Sin datos: mantener local

        // Sanitizar datos de Firebase
        const incoming = {};
        const days = Array.isArray(val) ? {} : val;
        Object.keys(days).forEach(day => {
          const ds = days[day];
          if(!ds || typeof ds !== 'object') return;
          incoming[day] = {};
          ['checked','actividad','obs','tiempo','inicio','fin','responsable'].forEach(k => {
            const raw = ds[k];
            if(Array.isArray(raw)) incoming[day][k] = raw;
            else if(raw && typeof raw === 'object') incoming[day][k] = Object.values(raw);
            else incoming[day][k] = [];
          });
        });

        // MERGE inteligente: no pisar datos locales con arrays vacíos
        const local = window.clStateByDay || {};
        Object.keys(incoming).forEach(day => {
          if(!local[day]){
            local[day] = incoming[day];
          } else {
            ['checked','actividad','obs','tiempo','inicio','fin','responsable'].forEach(k => {
              const fb = incoming[day][k] || [];
              const fbHas = fb.some(v => v !== '' && v !== false && v != null);
              if(fbHas) local[day][k] = fb;
            });
          }
        });
        window.clStateByDay = local;
        try { localStorage.setItem(window.CL_STORAGE_KEY, JSON.stringify(local)); } catch(e){}

        const ae = document.activeElement;
        const editando = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT')
                         && ae.closest('#page-checklist');
        if(editando) return;
        const active = document.querySelector('.day-tab.active');
        if(active){
          window.clState = window.getOrCreateDayState?.(window.currentDay);
          window.renderChecklistTable?.();
        }
      });

      fbListen('checklistHistory', val => {
        window.checklistHistory = Array.isArray(val) ? val : Object.values(val||{});
      });

      // Registro persistente del último Nuevo por zona (sobrevive a cambios de semana)
      fbListen('ultimoNuevoZona', val => {
        if(window._setUltimoNuevoZona) window._setUltimoNuevoZona(val || {});
        if(document.getElementById('page-checklist')?.classList.contains('active') && !window.estaEditando('page-checklist')) window.renderChecklistTable?.();
      });

      // Planificación fija (plantilla) del checklist — persistente entre semanas
      fbListen('checklistPlantilla', val => {
        if(window._setChecklistPlantilla) window._setChecklistPlantilla(val || {});
      });

      // Zonas/secciones del checklist editadas por gerencia
      fbListen('checklistSecciones', val => { if(window._setChecklistSecciones) window._setChecklistSecciones(val); });
      fbListen('checklistTareas', val => {
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        if(window._setChecklistTareas) window._setChecklistTareas(arr);
      });

      fbListen('clTiemposRef', val => {
        if(window._setClTiemposRef) window._setClTiemposRef(val || []);
        // Re-render si el checklist está activo y nadie está editando un campo
        const ae = document.activeElement;
        const editando = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT')
                         && ae.closest('#page-checklist');
        if(!editando && document.getElementById('page-checklist')?.classList.contains('active')) window.renderChecklistTable?.();
      });

      fbListen('eventosData', val => {
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        if(JSON.stringify(arr) === JSON.stringify(window.eventosData)) return;
        window.eventosData = arr;
        if(document.getElementById('page-eventos-comercial')?.classList.contains('active')){
          const calView = document.getElementById('eventos-cal-view');
          if(calView && calView.style.display !== 'none') window.renderCalendario?.();
          else window.renderEventos();
        }
        if(document.getElementById('page-eventos-maison')?.classList.contains('active')) window.renderKanban();
        // Los eventos asignados aparecen en el checklist del florista y en el home:
        // re-render en vivo para que impacten sin recargar.
        if(document.getElementById('page-checklist')?.classList.contains('active')) window.renderChecklistTable?.();
        if(document.getElementById('page-home')?.classList.contains('active')) window.renderHome?.();
      });

      fbListen('cotizadorPrecios', val => {
        window._setCotizadorPrecios?.(val && typeof val === 'object' && !Array.isArray(val) ? val : {});
        if(document.getElementById('page-cotizador')?.classList.contains('active')){
          if(window.cotCurTab==='cotizar') window.renderCotizador?.();
          else window.renderPreciosList?.();
        }
        if(document.getElementById('page-cotizador-ops')?.classList.contains('active')) window.renderCotizadorOps?.();
      });

      fbListen('cotizadorConfig', val => {
        const cfg = val && typeof val === 'object' ? val : {margen:30};
        window._setCotizadorConfig?.(cfg);
        const cfgInput = document.getElementById('cot-config-margen');
        if(cfgInput) cfgInput.value = cfg.margen ?? 30;
        if(document.getElementById('page-cotizador-ops')?.classList.contains('active')) window.renderCotizadorOps?.();
      });

      fbListen('eventoPricing', val => {
        if(val && typeof val === 'object'){
          const ep = val;
          if(!Array.isArray(ep.tipos)) ep.tipos = ep.tipos ? Object.values(ep.tipos) : [];
          window._setEventoPricing?.(ep);
        }
        if(document.getElementById('page-cotizador')?.classList.contains('active') && window.cotCurTab==='eventos') window.renderEvTipos?.();
      });

      fbListen('stockData', val => {
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        if(JSON.stringify(arr) === JSON.stringify(window.stockData)) return;
        window.stockData = arr;
        if(document.getElementById('page-stock')?.classList.contains('active') && !window.estaEditando('page-stock')) window.renderStock();
        if(document.getElementById('page-stock-admin')?.classList.contains('active') && !window.estaEditando('page-stock-admin')) window.renderStockAdmin();
      });

      fbListen('urgenciaConfig', val => {
        if(val && typeof val === 'object' && val.okMax!=null && val.warnMax!=null){
          window._setUrgenciaConfig?.({ okMax:+val.okMax, warnMax:+val.warnMax });
        }
        if(document.getElementById('page-control-jardineria')?.classList.contains('active')) window.renderCtrlJard?.();
        if(document.getElementById('page-control-habitaciones')?.classList.contains('active')) window.renderCtrlHab?.();
        if(document.getElementById('page-jardineria-ops')?.classList.contains('active')) window.renderJardOps?.();
        if(document.getElementById('page-hab-ops')?.classList.contains('active')) window.renderHabOps?.();
      });

      fbListen('jardineriaData', val => {
        if(!val) return;
        // No pisar cambios locales de estructura recién guardados (agregar/borrar tareas)
        if(window._jardDataLastSave && Date.now() - window._jardDataLastSave < 2000) return;
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        if(window._setJardineriaData) window._setJardineriaData(arr);
        if(document.getElementById('page-jardineria-ops')?.classList.contains('active') && !window.estaEditando('page-jardineria-ops')) window.renderJardOps();
        if(document.getElementById('page-control-jardineria')?.classList.contains('active') && !window.estaEditando('page-control-jardineria')) window.renderCtrlJard();
      });

      fbListen('jardPlanDia', val => {
        if(!val) return;
        if(window._setJardPlanDia) window._setJardPlanDia(val);
        if(document.getElementById('page-jardineria-ops')?.classList.contains('active') && !window.estaEditando('page-jardineria-ops')) window.renderJardOps();
      });

      fbListen('llamadosData', val => {
        if(window._setLlamadosData) window._setLlamadosData(Array.isArray(val) ? val : Object.values(val||{}));
      });

      fbListen('florerosData', val => {
        if(window._setFlorerosData) window._setFlorerosData(Array.isArray(val) ? val : Object.values(val||{}));
      });

      fbListen('resumenesDiarios', val => {
        if(window._setResumenesDiarios) window._setResumenesDiarios(val || {});
      });

      fbListen('velasData', val => {
        if(window._setVelasData) window._setVelasData(Array.isArray(val) ? val : Object.values(val||{}));
      });

      fbListen('habitacionesData', val => {
        if(!val) return;
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        if(window._setHabitacionesData) window._setHabitacionesData(arr);
        if(document.getElementById('page-hab-ops')?.classList.contains('active') && !window.estaEditando('page-hab-ops')) window.renderHabOps();
        if(document.getElementById('page-control-habitaciones')?.classList.contains('active') && !window.estaEditando('page-control-habitaciones')) window.renderCtrlHab();
      });

      fbListen('jardineriaLog', val => {
        if(!val) return;
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        if(window._setJardineriaLog) window._setJardineriaLog(arr);
        if(document.getElementById('page-control-jardineria')?.classList.contains('active')) window.renderJardLog?.();
      });

      fbListen('jardRecordatorios', val => {
        const arr = val ? (Array.isArray(val) ? val : Object.values(val)) : [];
        if(window._setJardRecordatorios) window._setJardRecordatorios(arr);
        if(document.getElementById('page-recordatorios-jardineria')?.classList.contains('active')) window.renderRecordatoriosJard?.();
        if(document.getElementById('page-home')?.classList.contains('active')) window.renderHome?.();
      });

      fbListen('jardAlertas', val => {
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        if(window._setJardAlertas) window._setJardAlertas(arr);
      });

      fbListen('jardHorarios', val => {
        window.jardHorarios = (val && typeof val === 'object') ? val : {};
        if(document.getElementById('page-jardineria-ops')?.classList.contains('active')) window.renderJardTurnoCard?.();
        if(document.getElementById('jard-prod-wrap')?.style.display !== 'none') window.renderJardProdEquipo?.();
      });

      fbListen('habitacionesLog', val => {
        if(!val) return;
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        if(window._setHabitacionesLog) window._setHabitacionesLog(arr);
        if(document.getElementById('page-control-habitaciones')?.classList.contains('active')) window.renderHabLog?.();
      });

      fbListen('zonaHorasData', val => {
        if(val && JSON.stringify(val) !== JSON.stringify(window.zonaHorasData)){
          window.zonaHorasData = val;
          if(document.getElementById('page-jardineria-ops')?.classList.contains('active')) window.renderJardOps();
        }
      });

      fbListen('proveedoresList', val => {
        if(!val) return;
        window.proveedoresList = Array.isArray(val) ? val : Object.values(val);
        if(document.getElementById('page-proveedores')?.classList.contains('active')) window.renderProveedores?.();
      });

      fbListen('kanbanData', val => {
        if(val){
          const arr = Array.isArray(val) ? val : Object.values(val);
          if(JSON.stringify(arr) !== JSON.stringify(window.kanbanData)){
            window.kanbanData = arr;
          }
        }
        window.ensureKanbanCols?.();
        if(document.getElementById('page-eventos-maison')?.classList.contains('active')) window.renderKanban();
      });

      fbListen('comprasFlore', val => {
        if(!val) return;
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        // No pisar datos locales si se guardó hace menos de 2 segundos (evitar race condition)
        if(window._comprasFloreLastSave && Date.now() - window._comprasFloreLastSave < 2000) return;
        window.comprasFlore = arr;
        if(document.getElementById('page-compras-floreria')?.classList.contains('active') && !window.estaEditando('page-compras-floreria')) window.renderCompras('floreria');
      });

      fbListen('comprasJard', val => {
        if(!val) return;
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        if(window._comprasJardLastSave && Date.now() - window._comprasJardLastSave < 2000) return;
        window.comprasJard = arr;
        if(document.getElementById('page-compras-jardineria')?.classList.contains('active') && !window.estaEditando('page-compras-jardineria')) window.renderCompras('jardineria');
      });

      fbListen('recetasData', val => {
        if(!val) return;
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        window.recetasData = arr;
        if(document.getElementById('page-recetas-arreglos')?.classList.contains('active') && !window.estaEditando('page-recetas-arreglos')) window.renderRecetas();
      });

      fbListen('ventasData', val => {
        if(!val) return;
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        if(window._setVentasData) window._setVentasData(arr);
        if(document.getElementById('page-ventas-externas')?.classList.contains('active') && !window.estaEditando('page-ventas-externas')) window.renderVentas();
        if(document.getElementById('page-ramos-disponibles')?.classList.contains('active')) window.renderPedidosRamos?.();
        if(document.getElementById('page-checklist')?.classList.contains('active') && !window.estaEditando('page-checklist')) window.renderChecklistTable?.();
      });

      fbListen('cajaData', val => {
        if(!val) return;
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        if(window._setCajaData) window._setCajaData(arr);
        if(document.getElementById('page-caja')?.classList.contains('active') && !window.estaEditando('page-caja')) window.renderCaja();
      });

      fbListen('galeriaData', val => {
        if(!val) return;
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        if(window._setGaleriaData) window._setGaleriaData(arr);
        if(document.getElementById('page-galeria')?.classList.contains('active') && !window.estaEditando('page-galeria')) window.renderGaleria();
      });

      fbListen('arreglosHotelConfig', val => {
        if(!val) return;
        if(window._setArreglosHotelConfig) window._setArreglosHotelConfig(val);
        if(document.getElementById('page-rentabilidad-eventos')?.classList.contains('active')) window.renderRentabilidadHotel?.();
      });

      fbListen('arreglosComposicion', val => {
        if(!val) return;
        if(window._setArreglosComposicion) window._setArreglosComposicion(val);
        if(document.getElementById('page-rentabilidad-eventos')?.classList.contains('active')) window.renderRentabilidadHotel?.();
        if(document.getElementById('page-recetas-arreglos')?.classList.contains('active')) window.renderComposicionesHotel?.();
      });

      fbListen('eventLaborRate', val => {
        if(window._setEventLaborRate) window._setEventLaborRate(val);
        if(document.getElementById('page-rentabilidad-eventos')?.classList.contains('active')) window.renderRentabilidad?.();
      });

      fbListen('listaPreciosData', val => {
        if(!val) return;
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        if(window._setListaPreciosData) window._setListaPreciosData(arr);
        if(document.getElementById('page-lista-precios')?.classList.contains('active') && !window.estaEditando('page-lista-precios')) window.renderListaPrecios();
      });

      fbListen('ramosDispData', val => {
        const arr = !val ? [] : (Array.isArray(val) ? val : Object.values(val||{}));
        if(window._setRamosDispData) window._setRamosDispData(arr);
        if(document.getElementById('page-ramos-disponibles')?.classList.contains('active') && !window.estaEditando('page-ramos-disponibles')) window.renderRamosDisp();
      });

      fbListen('pedidosHabData', val => {
        const arr = !val ? [] : (Array.isArray(val) ? val : Object.values(val||{}));
        window.pedidosHabData = arr;
        if(document.getElementById('page-pedidos-habitacion')?.classList.contains('active')) window.renderPedidosHab?.();
        // También refrescar en la vista de operarios si la tienen abierta
        if(document.getElementById('page-recepcion-pedidos-hab')?.classList.contains('active')) window.renderPedidosHabOps?.();
        // Refrescar KPIs del Panel Hyatt
        if(document.getElementById('page-home-hyatt')?.classList.contains('active')) window.renderHomeHyatt?.();
      });

      fbListen('horariosData', val => {
        window.horariosData = val && typeof val === 'object' ? val : {};
        if(document.getElementById('page-control-horarios')?.classList.contains('active')) window.renderHorarios?.();
        if(document.getElementById('page-home')?.classList.contains('active')) window.renderProductividadHome?.();
        if(document.getElementById('page-checklist')?.classList.contains('active')) window.renderProductividadCL?.();
      });

      fbListen('florTurnos', val => {
        window.florTurnos = val && typeof val === 'object' ? val : {};
        if(document.getElementById('page-checklist')?.classList.contains('active')) window.renderFlorTurnoCard?.();
        if(document.getElementById('page-home')?.classList.contains('active')) window.renderProductividadHome?.();
        if(document.getElementById('page-control-horarios')?.classList.contains('active')) window.renderHorarios?.();
      });

      fbListen('horariosPlantilla', val => {
        window.horariosPlantilla = val && typeof val === 'object' ? val : {};
        if(document.getElementById('plantilla-wrap')?.style.display !== 'none') window.renderPlantilla?.();
      });

      fbListen('horariosPersonas', val => {
        // Lista personalizada de personas en Horarios (floristas + jardinería).
        // Firebase puede devolver array u objeto; null/ausente => sin custom (default).
        window.horariosPersonas = Array.isArray(val) ? val : (val && typeof val === 'object' ? Object.values(val) : undefined);
        if(document.getElementById('page-control-horarios')?.classList.contains('active')){
          window.renderHorarios?.();
          if(document.getElementById('plantilla-wrap')?.style.display !== 'none') window.renderPlantilla?.();
        }
      });

      fbListen('sucursalesConfig', val => {
        if(val && typeof val === 'object'){
          const arr = Array.isArray(val) ? val : Object.values(val);
          if(arr.length) window.sucursalesConfig = arr;
        }
        if(document.getElementById('page-sucursales')?.classList.contains('active')) window.renderSucursales?.();
        if(document.getElementById('page-dashboard-consolidado')?.classList.contains('active')) window.renderDashboardConsolidado?.();
      });

      fbListen('clientesData', val => {
        const arr = !val ? [] : (Array.isArray(val) ? val : Object.values(val||{}));
        if(window._setClientesData) window._setClientesData(arr);
        if(document.getElementById('page-crm-clientes')?.classList.contains('active')) window.renderClientes?.();
      });

      fbListen('auditLog', val => {
        if(window._setAuditLog) window._setAuditLog(val||{});
        if(document.getElementById('page-auditoria')?.classList.contains('active')) window.renderAuditoria?.();
      });

      fbListen('cierresCaja', val => {
        const arr = !val ? [] : (Array.isArray(val) ? val : Object.values(val||{}));
        if(window._setCierresCaja) window._setCierresCaja(arr);
      });

      fbListen('legajoData', val => {
        const arr = !val ? [] : (Array.isArray(val) ? val : Object.values(val||{}));
        if(window._setLegajoData) window._setLegajoData(arr);
        if(document.getElementById('page-legajo')?.classList.contains('active')) window.renderLegajo?.();
      });

      fbListen('evaluacionesData', val => {
        const arr = !val ? [] : (Array.isArray(val) ? val : Object.values(val||{}));
        if(window._setEvaluacionesData) window._setEvaluacionesData(arr);
        if(document.getElementById('page-evaluaciones')?.classList.contains('active')) window.renderEvaluaciones?.();
      });

      fbListen('liquidacionConfig', val => {
        if(window._setLiquidacionConfig) window._setLiquidacionConfig(val||{ horasEsperadas: 192, horas: {} });
        if(document.getElementById('page-liquidacion')?.classList.contains('active')) window.renderLiquidacion?.();
      });


      fbListen('presupuestosData', val => {
        const arr = !val ? [] : (Array.isArray(val) ? val : Object.values(val||{}));
        if(window._setPresupuestos) window._setPresupuestos(arr);
      });

      fbListen('eventosSinFloreria', val => {
        const arr = !val ? [] : (Array.isArray(val) ? val : Object.values(val||{}));
        if(window._setEventosSinFloreria) window._setEventosSinFloreria(arr);
        if(document.getElementById('page-eventos-sin-floreria')?.classList.contains('active') && !window.estaEditando('page-eventos-sin-floreria')) window.renderEventosSinFloreria?.();
      });

      fbListen('cierresMensualesData', val => {
        const arr = !val ? [] : (Array.isArray(val) ? val : Object.values(val||{}));
        if(window._setCierresMensuales) window._setCierresMensuales(arr);
      });

    });
