# Seguridad — Florería Duhau

Estado y pasos de endurecimiento del backend (Firebase Realtime Database).

## El riesgo (resumen)

La app entra con **autenticación anónima** (`signInAnonymously`) y las reglas de
la base son `".read"/".write": "auth != null"`. Como el token anónimo se genera
solo al abrir la página, **cualquiera que tenga la URL** (o que use la config
pública de Firebase, que viaja en el bundle) puede **leer y escribir TODA la
base**: contraseñas (`loginPasswords`, hoy en texto plano), ventas, caja,
liquidación/sueldos, legajos, clientes (CRM), etc.

En la práctica, **el login es del lado del cliente y no protege los datos**: la
protección real la dan las reglas, y con login anónimo no pueden distinguir
quién es quién.

> El problema NO es el `apiKey` en el código (es normal y público en Firebase
> web). El problema es la combinación **reglas permisivas + login anónimo**.

## Mitigación pragmática aplicada: App Check

Se integró **Firebase App Check (reCAPTCHA v3)** en `src/firebase/index.js`.
App Check hace que Firebase **rechace** las peticiones que no provienen de la app
real (por ejemplo, un script externo que use la config pública para scrapear o
corromper la base). Sube mucho la barrera contra el abuso automatizado.

⚠️ **Limitación honesta:** App Check NO protege contra una persona que abra la
URL real en el navegador (esa persona ES la app y puede leer todo). Cerrar eso
requiere **autenticación real** (ver roadmap abajo).

### Estado y checklist

- [x] Código de App Check integrado (`src/firebase/index.js`).
- [x] Sitio reCAPTCHA v3 creado en `google.com/recaptcha/admin` (etiqueta
      "Floreria Duhau", dominio `floreria-duhau.operaciones-b40.workers.dev`).
- [x] **Clave secreta** cargada en la consola de Firebase (App Check → app web).
- [x] **Site key** (pública) cableada en el código
      (`APPCHECK_SITE_KEY`, sobreescribible con `VITE_APPCHECK_SITE_KEY`).
- [x] **Desplegado en producción** (Cloudflare publica solo al mergear a `main`;
      App Check ya está enviando tokens).
- [ ] **Monitoreo:** usar la app con normalidad unos días y revisar en
      **Firebase → App Check → APIs → Realtime Database** la métrica de
      *Solicitudes verificadas* (debería subir y mantenerse alta).
- [ ] **Enforce (paso final):** cuando el % verificado sea alto y estable,
      activar **"Aplicar"** en esa misma pantalla. Recién ahí se bloquea el
      acceso sin token de App Check.

> 🚫 **No activar "Aplicar/Enforce" antes de confirmar el monitoreo.** Si se
> aplica sin tráfico verificado, Firebase rechaza TODO y la app deja de cargar
> datos. Rollback: volver a "Sin aplicar" en la misma pantalla.

## Reglas de la base (`database.rules.json`)

- Las reglas **no se deployan con el sitio** (el deploy automático de Cloudflare
  solo publica el frontend). Si se cambian, hay que correr
  `firebase deploy --only database` o pegarlas en la consola de Firebase.
- Hoy siguen en `auth != null` (permisivas). Endurecerlas de verdad requiere la
  autenticación real del roadmap (con login anónimo no se puede restringir por
  rol, y en RTDB los permisos cascadean desde la raíz).

## Contraseñas hasheadas (aplicado)

Las contraseñas ya **no se guardan en texto plano**. Antes vivían como las
*claves* del objeto `loginPasswords`, así que cualquiera que leyera la base las
veía todas. Ahora:

- La base guarda `loginAuth`, indexado por id de usuario (el nombre en
  minúsculas, que no es secreto), con **salt aleatorio + hash PBKDF2-SHA256
  (150.000 iteraciones)** por usuario. No es reversible.
- El login recorre los usuarios y compara hashes (WebCrypto, del lado cliente).
  El personal **sigue ingresando su contraseña igual** — no cambia el flujo.
- **Migración automática y retrocompatible:** mientras exista `loginPasswords`
  (texto plano), el login funciona como antes. La primera vez que entra
  gerencia, se genera `loginAuth`, se autoverifica que su propia contraseña
  valida contra el nuevo esquema, y recién ahí se **borra `loginPasswords`** de
  la base. Si la autoverificación falla, no borra nada (nadie queda afuera).
- La gestión de usuarios ya no muestra las contraseñas (no se pueden ver, solo
  cambiar) y el mínimo subió a 4 caracteres.

> Nota: no se usó un "pepper" vía Worker a propósito — acoplaría el login a la
> red (si el Worker cae, nadie entra) y App Check ya bloquea la lectura externa
> de la base. PBKDF2 fuerte + borrar el texto plano es el salto grande sin ese
> riesgo. Igual conviene usar contraseñas menos previsibles.

## Roadmap del arreglo completo (autenticación real)

El paso que faltaría para cerrarlo del todo (cuando se quiera, es de mayor
alcance porque cambia cómo ingresa el personal):

1. Migrar a **Firebase Auth** (cuenta real por persona) en lugar del cotejo del
   lado del cliente.
2. Guardar el rol en `/users/{uid}` y reescribir las reglas por rol, por ejemplo:
   - `caja`, `liquidacion`, `legajo`, `evaluaciones` → solo `gerencia`.
   - El resto, lectura/escritura según corresponda al rol.
