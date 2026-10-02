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

## Ingreso por el Worker (etapa 2 del plan de autenticación)

El código del personal se valida en el Worker de Cloudflare (`POST /api/login`,
`worker/login.js`). Si es correcto, el Worker entrega las credenciales de la
cuenta de Firebase Authentication de esa persona (email y contraseña derivados
de un secreto propio, `AUTH_PEPPER`) y anota su rol en `userRoles/{uid}`, un
nodo donde solo escribe el Worker. Las reglas de la base leerán ese rol. Por ahora
NO lo exigen: conviven el ingreso nuevo y el viejo (si el Worker no está listo, la
app entra como antes).

No usa clave de cuenta de servicio (la organización de Google las bloquea).

Para activarlo (una sola vez):

1. Firebase → Authentication → Sign-in method → habilitar **Correo electrónico/contraseña**.
2. Firebase → Configuración del proyecto → Cuentas de servicio → "Secretos de la
   base de datos" → copiar el secreto.
3. Cloudflare → Workers & Pages → floreria-duhau → Settings → Variables and
   Secrets, dos **Secret**: `FIREBASE_DB_SECRET` (el del paso 2) y `AUTH_PEPPER`
   (cualquier texto largo y al azar, de 40+ caracteres, que nadie más conozca).
4. Probar que gerencia y el resto entran normalmente.

Si `AUTH_PEPPER` se cambia, las cuentas ya creadas dejan de coincidir: no tocarlo.

### Etapa 3: cerrar la base por rol

1. Pedir a cada persona del personal que entre dos veces (la primera pasa su código al formato nuevo, la segunda ya la verifica el Worker).
2. Abrir `/api/login-estado`: debe decir `"pendientes": 0` (si no, `pendientesIniciales` muestra las iniciales de quién falta).
3. Pegar `docs/database.rules.cerrada.json` en Firebase > Realtime Database > Reglas > Publicar. Las reglas no se despliegan con el sitio.
4. Volver atrás: pegar de nuevo el contenido de `database.rules.json` (reglas abiertas).

Con las reglas cerradas, caja, cierres, liquidación, legajos, evaluaciones, faltas y las claves solo las lee y escribe gerencia (la app empieza a escucharlas recién cuando gerencia entra, `fbStartSensibles`). El ingreso del personal depende del Worker: sin él, no pueden entrar. La herramienta de mover fotos (usa la raíz de la base) necesita volver temporalmente a las reglas abiertas.
