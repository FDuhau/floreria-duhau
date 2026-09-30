# Backups automáticos (Firebase → Cloudflare R2)

Todos los días a las **04:00 (Argentina)** el Worker descarga la base completa de
Firebase Realtime Database, la comprime (gzip) y la guarda en un bucket R2.
Código: `worker/backup.js`. Tests: `npm run test:backup`.

| Qué | Dónde | Retención |
|---|---|---|
| Un backup por día | `daily/AAAA-MM-DD.json.gz` | 30 días |
| El del día 1 de cada mes | (mismo prefijo) | 12 meses |
| Estado del último intento | `_last.json` (`ok` / `error`) | — |

Si la base vuelve vacía o algo falla, **no se pisa ningún backup existente** y el
cron figura como fallido en el dashboard de Cloudflare.

## Puesta en marcha (una sola vez)

1. **Bucket R2**: `npx wrangler r2 bucket create floreria-duhau-backups`
   (o Cloudflare → R2 → Create bucket). El token de deploy
   (`CLOUDFLARE_API_TOKEN`) necesita el permiso *Workers R2 Storage: Edit*.
2. **Cuenta de servicio de Firebase**: Firebase Console → Configuración del
   proyecto → Cuentas de servicio → *Generar nueva clave privada* (JSON).
   Cargala como secret (pegando el JSON completo):
   `npx wrangler secret put FIREBASE_SERVICE_ACCOUNT`
3. (Opcional) disparo manual: `npx wrangler secret put BACKUP_TOKEN` y luego
   `curl -X POST https://<tu-dominio>/api/backup -H "Authorization: Bearer <token>"`.
4. Deploy (push a `main`). Probá con el disparo manual o en el dashboard del
   Worker → Triggers → Cron → *Trigger*.

## Restaurar

1. Descargá el archivo desde R2 (dashboard o `npx wrangler r2 object get floreria-duhau-backups/daily/AAAA-MM-DD.json.gz --file backup.json.gz`).
2. `gunzip backup.json.gz`
3. Restaurar **todo**: Firebase Console → Realtime Database → ⋮ → *Importar JSON*.
   Restaurar **solo un nodo** (recomendado): abrí el JSON, copiá el nodo que
   necesitás (p. ej. `eventos`) y en la consola importalo en esa ruta.
   Antes de pisar nada, exportá el estado actual.

> Nota: el backup no reemplaza la migración a autenticación real; protege contra
> pérdida de datos, no contra accesos indebidos (ver `SECURITY.md`).
