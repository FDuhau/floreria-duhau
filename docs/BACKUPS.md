# Backups automáticos

Todos los días a las **03:00 (hora Argentina)** GitHub Actions descarga **toda** la base
de Firebase (caja, ventas, stock, eventos, legajos, fotos, auditLog…) y la guarda como
`backup-floreria-duhau-AAAA-MM-DD.zip`. Lo hace `.github/workflows/backup.yml`.

- **Dónde están:** en GitHub → repo → **Releases** → borrador **"Backups automáticos"**
  (`https://github.com/FDuhau/floreria-duhau/releases`). Es un *borrador*: solo lo ven
  quienes tienen permiso de escritura en el repo, aunque el repo sea público.
  **No lo publiques.**
- **Cuántos se guardan:** los últimos 60 días, y para siempre el del día 1 de cada mes.
- **Si algo falla** (sin conexión, base vacía o incompleta) la corrida queda en rojo en
  Actions y GitHub manda un mail.
- **Hacer uno ya:** Actions → **Backup diario** → **Run workflow**.

## Configuración (una sola vez)

Settings → Secrets and variables → Actions → **New repository secret**:

- Nombre: `FIREBASE_DB_SECRET`
- Valor: consola de Firebase → ⚙️ Configuración del proyecto → **Cuentas de servicio** →
  **Secretos de la base de datos** → Mostrar → copiar. (Es el mismo que ya usa el Worker
  de Cloudflare.)

## Restaurar

El `.json` de adentro del zip es la base tal cual está en Firebase (mismos nombres de nodo
que usa la app: `cajaData`, `ventasData`, `stockData`…).

- **Solo la caja:** en la app, Control de Caja → **Restaurar movimientos** → elegir el
  `.json`. Agrega solo los movimientos que falten, no borra nada.
- **Un nodo puntual o todo:** consola de Firebase → Realtime Database → ⋮ → **Importar JSON**
  sobre el nodo. ⚠️ Importar **reemplaza** lo que haya en ese nodo: hacerlo con cuidado y
  después de bajar un backup del estado actual.
