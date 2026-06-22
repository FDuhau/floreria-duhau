    // ════════════ FIREBASE SETUP ════════════
    import { initializeApp } from "firebase/app";
    import { getDatabase, ref, set, update, onValue, get } from "firebase/database";
    import { getMessaging, getToken, onMessage } from "firebase/messaging";

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
    const db    = getDatabase(fbApp);

    // ── Helpers ───────────────────────────────────────────────────
    function fbSet(path, data){
      set(ref(db, path), data).catch(e => console.warn('FB write error:', e));
    }

    // Escritura granular: actualiza UNA sub-ruta sin pisar el resto del nodo.
    // Ej: fbSetPath('checklist/Lunes/checked/3', true) → no toca las otras tareas/días.
    function fbSetPath(path, value){
      set(ref(db, path), value).catch(e => console.warn('FB path write error:', e));
    }

    function fbUpdate(path, updates){
      update(ref(db, path), updates).catch(e => console.warn('FB update error:', e));
    }

    function fbListen(path, cb){
      onValue(ref(db, path), snap => {
        const val = snap.val();
        if(val !== null) cb(val);
      });
    }

    // ── Expose to global scope so non-module script can call them ─
    window.fbSet     = fbSet;
    window.fbSetPath = fbSetPath;
    window.fbUpdate  = fbUpdate;
    window.fbListen  = fbListen;
    window.fbReady   = true;

    // ── Push Notifications (FCM) ──────────────────────────────────
    const FCM_VAPID = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjZkiDgE85ia8p7dDdMY5c8KL3YE'; // reemplazar con tu clave VAPID
    let messaging = null;
    try { messaging = getMessaging(fbApp); } catch(e){}

    async function pushRequestPermission(){
      if(!messaging) return false;
      try {
        const perm = await Notification.requestPermission();
        if(perm !== 'granted') return false;
        const reg = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, { vapidKey: FCM_VAPID, serviceWorkerRegistration: reg });
        if(token){
          const uid = window.currentUserLabel || 'anon';
          fbSetPath('pushTokens/' + uid.replace(/[.#$/\[\]]/g,'_'), token);
          if(messaging) onMessage(messaging, payload => {
            window.showToast?.('🔔 ' + (payload.notification?.title||'') + ': ' + (payload.notification?.body||''));
          });
          return true;
        }
      } catch(e){ console.warn('FCM error:', e); }
      return false;
    }

    async function pushSend(title, body, tag='general'){
      fbSet('pushBroadcast/' + Date.now(), { title, body, tag, ts: Date.now() });
    }

    window.pushRequestPermission = pushRequestPermission;
    window.pushSend = pushSend;

    // Listen for broadcasts — show notification on all connected devices
    let _pushSessionStart = Date.now();
    fbListen('pushBroadcast', val => {
      if(!val || Notification.permission !== 'granted') return;
      const entries = Object.values(val);
      const recientes = entries.filter(e => e.ts > _pushSessionStart);
      recientes.forEach(e => {
        new Notification(e.title||'Florería Duhau', { body: e.body||'', icon: '/icon-192.png', tag: e.tag||'general' });
        _pushSessionStart = Math.max(_pushSessionStart, e.ts + 1);
      });
    });

    // Cargar contraseñas personalizadas ANTES del login
    fbListen('loginPasswords', val => {
      if(val && typeof val === 'object' && Object.keys(val).length > 0){
        window.loginPasswords = val;
        // Sincronizar floristas con la lista de responsables del checklist
        Object.values(val).forEach(e => {
          if(e.role === 'florista' && e.floristaNombre && !window.CL_RESP_OPTS?.includes(e.floristaNombre)){
            window.CL_RESP_OPTS?.push(e.floristaNombre);
          }
        });
        if(window.CL_RESP_OPTS) window.CL_RESP_OPTS.sort((a,b) => a.localeCompare(b,'es'));
      }
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
              const loc = local[day][k] || [];
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

      fbListen('eventosData', val => {
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        if(JSON.stringify(arr) === JSON.stringify(window.eventosData)) return;
        window.eventosData = arr;
        if(document.getElementById('page-eventos-comercial')?.classList.contains('active')) window.renderEventos();
        if(document.getElementById('page-eventos-maison')?.classList.contains('active')) window.renderKanban();
      });

      fbListen('cotizadorPrecios', val => {
        cotizadorPrecios = val && typeof val === 'object' && !Array.isArray(val) ? val : {};
        if(document.getElementById('page-cotizador')?.classList.contains('active')){
          if(cotCurTab==='cotizar') renderCotizador();
          else renderPreciosList();
        }
        if(document.getElementById('page-cotizador-ops')?.classList.contains('active')) renderCotizadorOps();
      });

      fbListen('cotizadorConfig', val => {
        cotizadorConfig = val && typeof val === 'object' ? val : {margen:30};
        const cfgInput = document.getElementById('cot-config-margen');
        if(cfgInput) cfgInput.value = cotizadorConfig.margen ?? 30;
        if(document.getElementById('page-cotizador-ops')?.classList.contains('active')) renderCotizadorOps();
      });

      fbListen('eventoPricing', val => {
        if(val && typeof val === 'object'){
          eventoPricing = val;
          if(!Array.isArray(eventoPricing.tipos)) eventoPricing.tipos = eventoPricing.tipos ? Object.values(eventoPricing.tipos) : [];
        }
        if(document.getElementById('page-cotizador')?.classList.contains('active') && cotCurTab==='eventos') renderEvTipos();
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
          urgenciaConfig = { okMax:+val.okMax, warnMax:+val.warnMax };
        }
        if(document.getElementById('page-control-jardineria')?.classList.contains('active')) window.renderCtrlJard?.();
        if(document.getElementById('page-control-habitaciones')?.classList.contains('active')) window.renderCtrlHab?.();
        if(document.getElementById('page-jardineria-ops')?.classList.contains('active')) window.renderJardOps?.();
        if(document.getElementById('page-hab-ops')?.classList.contains('active')) window.renderHabOps?.();
      });

      fbListen('jardineriaData', val => {
        if(!val) return;
        const arr = Array.isArray(val) ? val : Object.values(val||{});
        if(window._setJardineriaData) window._setJardineriaData(arr);
        if(document.getElementById('page-jardineria-ops')?.classList.contains('active') && !window.estaEditando('page-jardineria-ops')) window.renderJardOps();
        if(document.getElementById('page-control-jardineria')?.classList.contains('active') && !window.estaEditando('page-control-jardineria')) window.renderCtrlJard();
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

    });
