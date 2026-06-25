# Plan: migración a autenticación real (Firebase Auth + reglas por rol)

> Documento de planificación. **Pendiente de ejecutar** — guardado para encararlo
> más adelante. Complementa `SECURITY.md` (la deuda de seguridad del backend).

## 1. Objetivo

Cerrar el agujero de fondo: que **solo personas autorizadas** puedan entrar, y
que cada rol vea/escriba **solo lo que le corresponde** (que caja, sueldos y
legajos sean inaccesibles para quien no es gerencia, incluso si abre la URL o
pega directamente contra la API de Firebase).

Hoy la app entra con **autenticación anónima** + cotejo de contraseña del lado
del cliente contra `loginPasswords`. Con login anónimo, las reglas no pueden
distinguir quién es quién, así que toda la base queda legible/escribible por
cualquiera con la URL.

## 2. Decisión clave (a definir) — método de ingreso

Hoy el ingreso es "escribir una palabra" (contraseña compartida por rol). Dos
formas de hacerlo real, con trade-off de **fricción vs. esfuerzo**:

| | **A. Email + contraseña por persona** | **B. Código simple respaldado por backend** |
|---|---|---|
| Cómo ingresa el personal | Email y contraseña reales (estándar Firebase Auth) | Sigue escribiendo su código; una Cloud Function lo valida y devuelve un token real con su rol |
| Seguridad | Alta (estándar) | Alta (el token y el rol los firma el backend) |
| Fricción para el personal | Media (email + recordar clave) | **Baja** (igual que hoy) |
| Esfuerzo de desarrollo | Menor (sin backend) | Mayor (Cloud Function + plan Blaze) |
| Provisión | Crear cuentas (script o consola) | Cargar los códigos en un nodo protegido |

**Recomendación:** para un local con personal no técnico y dispositivos
compartidos, la opción **B** preserva la experiencia actual y es igual de
segura. Si se prefiere lo más estándar y con menos piezas móviles, la **A**.
Esta decisión define el resto del plan.

## 3. Modelo de roles y permisos

Roles actuales (se mantienen): `gerencia, operario, jardinero, compras, ventas,
florista, comercial`.

El rol se guarda como **custom claim** del usuario (firmado, no manipulable
desde el cliente) o en `/users/{uid}/role`. Las reglas pasan de `auth != null`
a chequear el rol. Mapeo propuesto (principio: lo financiero/RRHH es solo
gerencia):

| Nodo | Quién lee/escribe |
|---|---|
| `cajaData`, `cierresCaja`, `cierresMensualesData`, `liquidacionConfig` | **solo gerencia** |
| `legajoData`, `evaluacionesData` | **solo gerencia** |
| `auditLog` | gerencia (lectura); escritura **append-only** (no se puede editar/borrar) |
| `clientesData` (CRM) | gerencia + comercial |
| `comprasFlore`, `comprasJard` | gerencia + compras |
| `jardineriaData`, `habitacionesData`, `jardRecordatorios`, `jardineriaLog`, `habitacionesLog`, `jardHorarios` | gerencia + jardinero |
| `ventasData`, `ramosDispData`, `pedidosHabData` | gerencia + florista/ventas |
| `checklist`, `stockData`, `eventosData`, `listaPreciosData`, `recetasData`, etc. | según corresponda (florista/operario/gerencia) |
| `loginPasswords` | **se elimina** (ya no hace falta con auth real) |

> El mapeo completo de los ~40 nodos (los de `fbListen` en `src/firebase/index.js`)
> se cierra en la Fase 2, nodo por nodo.

## 4. Cambios de código

- **`src/firebase/index.js`:** reemplazar `signInAnonymously` por el login real
  - Opción A: `signInWithEmailAndPassword`.
  - Opción B: `signInWithCustomToken` con el token devuelto por la Cloud Function.
  - Leer el rol del custom claim (`auth.token.role`) o de `/users/{uid}`.
- **`doLogin` (app.js):** en vez de cotejar contra `loginPasswords`, autenticar
  contra Firebase y obtener el rol del token.
  - **`applyRole` queda casi igual** (sigue recibiendo un `role`): la lógica de
    qué ve cada rol NO se toca, solo cambia de dónde sale el rol. Esto reduce
    mucho el riesgo del cambio.
- **Gestión de usuarios (modal de gerencia):** pasa a crear/desactivar cuentas
  reales (A) o códigos en el nodo protegido (B), en vez de editar `loginPasswords`.
- **Preservar el caso Ivan** (florista + jardinero): el claim puede incluir
  capacidades múltiples (mismo criterio que `JARDINEROS_LIST` hoy).
- Variables de sesión a mantener: `currentUserLabel`, `floristaNombre`,
  `jardineroNombre`, `currentSucursal` (hoy se setean en `doLogin`).

## 5. Reglas nuevas (ejemplo concreto)

```javascript
{
  "rules": {
    "cajaData":      { ".read": "auth.token.role == 'gerencia'",
                       ".write": "auth.token.role == 'gerencia'" },
    "legajoData":    { ".read": "auth.token.role == 'gerencia'",
                       ".write": "auth.token.role == 'gerencia'" },
    "auditLog":      { ".read": "auth.token.role == 'gerencia'",
                       "$id": { ".write": "auth != null && !data.exists()" } },
    "comprasFlore":  { ".read": "auth.token.role == 'gerencia' || auth.token.role == 'compras'",
                       ".write": "auth.token.role == 'gerencia' || auth.token.role == 'compras'" }
    // … resto de nodos según la tabla.
    // CLAVE: NO poner ".read"/".write" en la raíz, para que los permisos no
    // cascadeen y se pueda restringir nodo por nodo.
  }
}
```

> Si se usa `/users/{uid}/role` en vez de custom claims, el chequeo es
> `root.child('users').child(auth.uid).child('role').val() == 'gerencia'`.

## 6. Estrategia de rollout (sin dejar a nadie afuera)

1. **Preparar** cuentas/códigos en paralelo, con la app vieja todavía andando.
2. **Dual-run:** desplegar el login nuevo pero mantener las reglas viejas
   (`auth != null`) unos días → si algo falla, nadie queda bloqueado.
3. **Cortar:** una vez confirmado que todos entran con el sistema nuevo, deployar
   las reglas por rol.
4. **Rollback:** si algo se rompe, volver a las reglas `auth != null` es un solo
   comando (`firebase deploy --only database`).

## 7. Esfuerzo y riesgos

- **Opción A:** ~1–2 días de desarrollo + provisión de cuentas.
- **Opción B:** +1 día (Cloud Function + plan Blaze de Firebase, costo casi nulo
  a este volumen).
- **Riesgo principal:** lockout por reglas mal mapeadas → mitigado con el
  dual-run y el rollback de 1 comando.

## 8. Pre-requisitos / decisiones antes de arrancar

1. **Elegir A o B** (método de ingreso) — define todo lo demás.
2. Confirmar la **lista de personas y su rol** (para provisionar).
3. Para B: pasar el proyecto a **plan Blaze** (necesario para Cloud Functions).
4. Revisar y completar el **mapeo nodo → rol** de la sección 3.

## 9. Relación con lo ya hecho

- `SECURITY.md` documenta la deuda y la mitigación pragmática ya aplicada
  (App Check, PR #26).
- Este plan es el **fix completo**; App Check es solo un escudo parcial mientras
  tanto.
