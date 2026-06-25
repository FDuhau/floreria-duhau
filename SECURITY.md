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

App Check está **desactivado hasta que lo configures** (si no hay clave, es un
no-op y la app funciona igual). Para activarlo:

1. **Consola de Firebase → App Check** → registrá la app web con el proveedor
   **reCAPTCHA v3**. Vas a obtener una **site key** (no es secreta).
2. Definí la variable de entorno en el build:
   `VITE_APPCHECK_SITE_KEY=<tu-site-key>` (en el entorno de build de
   Cloudflare / wrangler, o un archivo `.env` local para `vite build`).
3. Hacé `npm run deploy` para publicar el sitio con App Check activo.
4. En **App Check → APIs → Realtime Database**, dejá primero el modo
   *Monitoreo* unos días; cuando veas que el tráfico legítimo pasa, activá
   **Enforce** (obligatorio). Recién ahí queda bloqueado el acceso sin token.

## Acción pendiente tuya (no se deploya solo)

- Las reglas (`database.rules.json`) **no se deployan con el sitio**. Si las
  cambiás, hay que correr `firebase deploy --only database` o pegarlas en la
  consola. Hoy no hay CI que lo haga.

## Roadmap del arreglo completo (autenticación real)

Esto cierra el agujero de verdad, pero cambia cómo ingresa el personal y
necesita provisionar credenciales. Pasos sugeridos:

1. Migrar el login a **Firebase Auth** (cuenta real por persona; email+clave o
   el esquema que prefieras), en lugar del cotejo de contraseña del lado del
   cliente.
2. Guardar el rol en `/users/{uid}` y reescribir las reglas por rol, por ejemplo:
   - `caja`, `liquidacion`, `legajo`, `evaluaciones` → solo `gerencia`.
   - El resto, lectura/escritura según corresponda al rol.
3. Mientras tanto, **subir la fortaleza de las contraseñas actuales** (hoy son
   palabras cortas y previsibles).

Cuando quieras encarar esto, se planifica aparte (es un cambio de mayor alcance).
