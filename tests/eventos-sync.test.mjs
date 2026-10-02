// Tests de la sincronización segura de eventos: lógica pura + simulación de
// dos dispositivos contra una base con transacciones (como Firebase).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { norm, aLista, diffEventos, aplicarOps, mismaLista, crearSync } from '../src/modules/eventos-sync.js';

const ev = (id, extra = {}) => ({ id, nombre: 'Evento ' + id, fecha: '2026-10-10', estado: 'Pedidos Pendientes', ...extra });

test('norm: ignora lo que Firebase no guarda (null, undefined, vacíos)', () => {
  assert.deepEqual(norm({ a: 1, b: null, c: undefined, d: [], e: {}, f: '' }), { a: 1, f: '' });
  assert.equal(norm([]), undefined);
  assert.equal(norm(NaN), undefined);
  assert.equal(mismaLista([ev('a', { arreglos: [] })], [ev('a')]), true);
  assert.equal(mismaLista([ev('a')], [ev('a', { pax: 5 })]), false);
});

test('aLista: arreglo, objeto con huecos o vacío', () => {
  assert.deepEqual(aLista(null), []);
  assert.deepEqual(aLista({ 0: ev('a'), 2: ev('b') }).map((e) => e.id), ['a', 'b']);
  assert.deepEqual(aLista([ev('a'), null]).map((e) => e.id), ['a']);
});

test('diffEventos: agregar, borrar y modificar solo los campos tocados', () => {
  const prev = [ev('a'), ev('b'), ev('c', { notas: 'x', pax: 10 })];
  const next = [ev('a', { pax: 50 }), ev('c', { notas: undefined, pax: 10 }), ev('d')];
  const ops = diffEventos(prev, next);
  assert.deepEqual(ops, [
    { op: 'patch', id: 'a', set: { pax: 50 }, unset: [] },
    { op: 'patch', id: 'c', set: {}, unset: ['notas'] },
    { op: 'add', ev: ev('d') },
    { op: 'remove', id: 'b' },
  ]);
  assert.deepEqual(diffEventos(prev, prev), []);
});

test('diffEventos: sin id o con ids repetidos → null (guardar a la antigua)', () => {
  assert.equal(diffEventos([ev('a')], [ev('a'), { nombre: 'sin id' }]), null);
  assert.equal(diffEventos([ev('a'), ev('a')], [ev('a')]), null);
});

test('aplicarOps: idempotente, no muta, ignora patch de evento borrado', () => {
  const base = [ev('a'), ev('b')];
  const copia = JSON.stringify(base);
  const ops = [{ op: 'add', ev: ev('c') }, { op: 'remove', id: 'a' }, { op: 'patch', id: 'zzz', set: { x: 1 }, unset: [] }];
  const r1 = aplicarOps(base, ops);
  assert.deepEqual(r1.map((e) => e.id), ['b', 'c']);
  assert.deepEqual(aplicarOps(r1, ops), r1);              // aplicar dos veces = igual
  assert.equal(JSON.stringify(base), copia);              // no muta
  assert.deepEqual(aplicarOps(null, [{ op: 'add', ev: ev('x') }]).map((e) => e.id), ['x']);
});

// ── Simulación: base con transacciones + dos dispositivos ──────────────
function crearBase(inicial) {
  const db = { valor: JSON.parse(JSON.stringify(inicial)), clientes: [] };
  // Firebase guarda normalizado y devuelve objetos ordenados
  db.escribir = (lista) => { db.valor = norm(lista) || null; };
  db.transaccion = (fn) => { const r = fn(db.valor); if (r !== undefined) db.escribir(r); };
  db.difundir = () => db.clientes.forEach((c) => c.recibir(db.valor));
  return db;
}
function crearDispositivo(db) {
  const c = { sync: crearSync(), local: [], lotes: [] };
  c.recibir = (v) => { c.local = c.sync.desdeServidor(aLista(v)); };
  c.guardar = () => {                                    // = _saveEventos()
    const lote = c.sync.guardar(c.local);
    if (lote === null) { db.escribir(c.local); return; }
    if (!lote.ops.length) return;
    c.lotes.push(lote);
  };
  c.enviar = () => {                                     // la transacción llega al servidor
    c.lotes.forEach((l) => { db.transaccion((cur) => aplicarOps(aLista(cur), l.ops)); c.sync.confirmar(l); });
    c.lotes = [];
  };
  db.clientes.push(c); c.recibir(db.valor);
  return c;
}
const ids = (l) => aLista(l).map((e) => e.id).sort();

test('simulación: dos altas a la vez → se conservan las dos', () => {
  const db = crearBase([ev('a')]);
  const A = crearDispositivo(db), B = crearDispositivo(db);
  A.local.push(ev('nuevoA')); A.guardar();
  B.local.push(ev('nuevoB')); B.guardar();
  A.enviar(); B.enviar(); db.difundir();
  assert.deepEqual(ids(db.valor), ['a', 'nuevoA', 'nuevoB']);
  assert.deepEqual(ids(A.local), ['a', 'nuevoA', 'nuevoB']);
  assert.deepEqual(ids(B.local), ['a', 'nuevoA', 'nuevoB']);
});

test('simulación: campos distintos del mismo evento → se conservan los dos cambios', () => {
  const db = crearBase([ev('a')]);
  const A = crearDispositivo(db), B = crearDispositivo(db);
  A.local[0].inicio = '08:00'; A.guardar();               // florista marca el inicio
  B.local[0].notas = 'agregar velas'; B.guardar();         // gerencia edita las notas (con datos viejos)
  B.enviar(); A.enviar(); db.difundir();
  assert.equal(db.valor[0].inicio, '08:00');
  assert.equal(db.valor[0].notas, 'agregar velas');
  assert.equal(B.local[0].inicio, '08:00');
});

test('simulación: borrar un evento no corre el cambio de otro (antes se cruzaban por posición)', () => {
  const db = crearBase([ev('a'), ev('b'), ev('c')]);
  const A = crearDispositivo(db), B = crearDispositivo(db);
  A.local.splice(0, 1); A.guardar();                      // A borra 'a' (los índices se corren)
  B.local[2].estado = 'Confirmado'; B.guardar();          // B edita 'c' (índice 2 en su pantalla)
  A.enviar(); B.enviar(); db.difundir();
  assert.deepEqual(ids(db.valor), ['b', 'c']);
  assert.equal(aLista(db.valor).find((e) => e.id === 'c').estado, 'Confirmado');
  assert.equal(aLista(db.valor).find((e) => e.id === 'b').estado, 'Pedidos Pendientes');
});

test('simulación: editar un evento que otro borró no lo resucita ni rompe', () => {
  const db = crearBase([ev('a'), ev('b')]);
  const A = crearDispositivo(db), B = crearDispositivo(db);
  A.local.splice(0, 1); A.guardar(); A.enviar();
  B.local[0].pax = 99; B.guardar(); B.enviar(); db.difundir();
  assert.deepEqual(ids(db.valor), ['b']);
});

test('simulación: cambios sin confirmar sobreviven a una actualización del servidor', () => {
  const db = crearBase([ev('a')]);
  const A = crearDispositivo(db), B = crearDispositivo(db);
  A.local.push(ev('mio')); A.guardar();                   // A guardó pero aún no llegó al servidor
  B.local[0].pax = 7; B.guardar(); B.enviar(); db.difundir(); // llega lo de B a A
  assert.deepEqual(ids(A.local), ['a', 'mio']);           // A no pierde su alta
  assert.equal(A.local[0].pax, 7);                        // y ve lo de B
  A.enviar(); db.difundir();
  assert.deepEqual(ids(db.valor), ['a', 'mio']);
  assert.equal(A.sync.pendientes(), 0);
});

test('simulación: base vacía y primer evento', () => {
  const db = crearBase(null);
  const A = crearDispositivo(db);
  A.local.push(ev('primero')); A.guardar(); A.enviar();
  assert.deepEqual(ids(db.valor), ['primero']);
});

test('simulación: eventos viejos sin id → guarda a la antigua (sin romper)', () => {
  const db = crearBase([{ nombre: 'viejo sin id' }]);
  const A = crearDispositivo(db);
  assert.equal(A.sync.guardar([{ nombre: 'viejo sin id' }, ev('n')]), null);
});

test('simulación: un guardado sin cambios no genera escritura', () => {
  const db = crearBase([ev('a')]);
  const A = crearDispositivo(db);
  A.guardar();
  assert.equal(A.lotes.length, 0);
});
