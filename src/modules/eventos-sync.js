// ════════════════════════════════════════════════════════════
//  Sincronización segura de eventos (pura, sin DOM ni Firebase)
//
//  Problema que resuelve: la lista de eventos se guardaba COMPLETA y por
//  posición. Dos personas que guardaban a la vez se pisaban (dos altas caían
//  en la misma posición; editar con datos viejos pisaba campos que otro había
//  cambiado). Acá cada guardado se convierte en CAMBIOS por id de evento
//  (agregar / borrar / campos modificados) que se aplican sobre la versión más
//  nueva del servidor, así lo que hizo el otro se conserva.
//  Tests: tests/eventos-sync.test.mjs
// ════════════════════════════════════════════════════════════

// Firebase no guarda null/undefined ni objetos/arrays vacíos, y devuelve las
// claves ordenadas. Normalizamos igual lo local y lo del servidor para que
// "lo mismo" compare como igual (si no, cada [] vacío sería un cambio falso).
export function norm(v) {
  if (v === null || v === undefined) return undefined;
  if (typeof v !== 'object') return typeof v === 'number' && !isFinite(v) ? undefined : v;
  const out = Array.isArray(v) ? [] : {};
  let n = 0;
  const keys = Array.isArray(v) ? v.map((_, i) => i) : Object.keys(v).sort();
  for (const k of keys) {
    const x = norm(v[k]);
    if (Array.isArray(out)) out.push(x === undefined ? null : x);
    else if (x !== undefined) out[k] = x;
    if (x !== undefined) n++;
  }
  return n ? out : undefined;
}
const key = (v) => JSON.stringify(norm(v) ?? null);
const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

// Firebase puede devolver un array con huecos como objeto: siempre a array.
export function aLista(v) {
  if (!v) return [];
  return (Array.isArray(v) ? v : Object.values(v)).filter((e) => e && typeof e === 'object');
}

// ¿Se puede sincronizar por id? Todos con id y sin repetidos.
function idsValidos(lista) {
  const vistos = new Set();
  for (const e of lista) {
    if (!e || typeof e !== 'object' || !e.id || vistos.has(e.id)) return false;
    vistos.add(e.id);
  }
  return true;
}

// Cambios entre lo que el dispositivo conocía (prev) y lo que tiene ahora (next).
// Devuelve null si no se puede (eventos sin id o repetidos): el que llama debe
// guardar a la antigua en ese caso.
//   { op:'add', ev } · { op:'remove', id } · { op:'patch', id, set:{}, unset:[] }
export function diffEventos(prev, next) {
  prev = aLista(prev);
  next = aLista(next);
  if (!idsValidos(prev) || !idsValidos(next)) return null;
  const antes = new Map(prev.map((e) => [e.id, e]));
  const ops = [];
  const vistos = new Set();
  for (const e of next) {
    vistos.add(e.id);
    const a = antes.get(e.id);
    if (!a) { ops.push({ op: 'add', ev: clone(e) }); continue; }
    const set = {};
    const unset = [];
    for (const k of new Set([...Object.keys(a), ...Object.keys(e)])) {
      if (key(a[k]) === key(e[k])) continue;
      if (norm(e[k]) === undefined) unset.push(k);
      else set[k] = clone(e[k]);
    }
    if (Object.keys(set).length || unset.length) ops.push({ op: 'patch', id: e.id, set, unset });
  }
  for (const a of prev) if (!vistos.has(a.id)) ops.push({ op: 'remove', id: a.id });
  return ops;
}

// Aplica cambios sobre una lista (la del servidor). No muta la entrada.
//  - add: si ya existe (otro lo cargó, o se reintenta) se deja la del servidor.
//  - remove: borra por id.
//  - patch: solo toca los campos que ESTE dispositivo cambió; el resto queda
//    como lo dejó el otro. Si el evento ya no existe (lo borraron), se ignora.
export function aplicarOps(lista, ops) {
  const out = aLista(lista).map(clone);
  for (const o of ops || []) {
    const i = out.findIndex((e) => e.id === (o.ev ? o.ev.id : o.id));
    if (o.op === 'add') {
      if (i < 0) out.push(clone(o.ev));
    } else if (o.op === 'remove') {
      if (i >= 0) out.splice(i, 1);
    } else if (o.op === 'patch') {
      if (i < 0) continue;
      Object.assign(out[i], clone(o.set));
      for (const k of o.unset || []) delete out[i][k];
    }
  }
  return out;
}

// ¿Dos listas son lo mismo (según cómo las guardaría Firebase)?
export function mismaLista(a, b) {
  return key(aLista(a)) === key(aLista(b));
}

// Cola de cambios de UN dispositivo. Mantiene:
//  - local: lo que se ve en pantalla
//  - prev: lo último que el dispositivo ya convirtió en cambios
//  - pendientes: lotes de cambios enviados y aún sin confirmar
// El servidor manda su versión (desdeServidor) → se recalcula local = servidor
// + cambios pendientes, para no perder lo que todavía no se confirmó.
export function crearSync() {
  let prev = null;          // null = todavía no se sabe qué hay en el servidor
  let pendientes = [];      // [{ id, ops }]
  let seq = 0;
  return {
    listo: () => prev !== null,
    // Primera carga o llegada de datos del servidor. Devuelve la lista local
    // que corresponde mostrar.
    desdeServidor(servidor) {
      const local = aplicarOps(servidor, pendientes.flatMap((p) => p.ops));
      prev = clone(local);
      return local;
    },
    // El usuario guardó: devuelve el lote { id, ops } a enviar (ops vacío si no
    // hubo cambios), o null si hay que guardar a la antigua.
    guardar(local) {
      if (prev === null) return null;
      const ops = diffEventos(prev, local);
      if (ops === null) return null;
      prev = clone(aLista(local));
      if (!ops.length) return { id: 0, ops };
      const lote = { id: ++seq, ops };
      pendientes.push(lote);
      return lote;
    },
    confirmar(lote) { pendientes = pendientes.filter((p) => p.id !== lote.id); },
    pendientes: () => pendientes.length,
  };
}
