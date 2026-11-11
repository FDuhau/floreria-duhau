import test from 'node:test';
import assert from 'node:assert/strict';
const B = await import('../src/modules/nuevos-semana-base.js');

test('reparte parejo y las más atrasadas van primero', () => {
  const p = B.repartirNuevos(['A', 'B', 'C', 'D', 'E'], ['Mié', 'Jue', 'Vie']);
  assert.deepEqual(p, [{ dia: 'Mié', zonas: ['A', 'B'] }, { dia: 'Jue', zonas: ['C', 'D'] }, { dia: 'Vie', zonas: ['E'] }]);
});

test('menos zonas que días: un día cada una, sin días vacíos', () => {
  const p = B.repartirNuevos(['A', 'B'], ['Vie', 'Sáb', 'Dom']);
  assert.deepEqual(p, [{ dia: 'Vie', zonas: ['A'] }, { dia: 'Sáb', zonas: ['B'] }]);
});

test('sin zonas o sin días no hay plan', () => {
  assert.deepEqual(B.repartirNuevos([], ['Vie']), []);
  assert.deepEqual(B.repartirNuevos(['A'], []), []);
});

test('se saltean las zonas ya planificadas', () => {
  const at = [{ sec: 'x', zona: 'A' }, { sec: 'x', zona: 'B' }];
  const r = B.sinPlanificar(at, new Set(['x|A']), z => z.sec + '|' + z.zona);
  assert.deepEqual(r.map(z => z.zona), ['B']);
});
