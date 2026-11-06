import test from 'node:test';
import assert from 'node:assert/strict';
const { pendientesDeAyer, pasablesAHoy, diaAnterior } = await import('../src/modules/checklist-ayer.js');

const ayer = {
  checked: [true, false, false, false, false],
  fin: ['', '', '', '10:30', ''],
  responsable: ['Ana', 'Lucía', '', 'Sofía', 'Lucía'],
};
const hoy = {
  checked: [false, false, false, false, true],
  fin: ['', '', '', '', ''],
  responsable: ['', 'Lucía', '', '', ''],
};

test('solo cuentan las tareas asignadas ayer que no se hicieron', () => {
  const r = pendientesDeAyer(ayer, hoy, 5);
  // 0 está hecha, 2 no tenía responsable, 3 tiene hora de fin
  assert.deepEqual(r.map(p => p.i), [1, 4]);
  assert.equal(r[0].resp, 'Lucía');
  assert.equal(r[0].hoyResp, 'Lucía');
  assert.equal(r[1].hoyHecha, true);
});

test('se pueden pasar a hoy las que hoy no están hechas ni asignadas', () => {
  const ayer2 = { ...ayer, responsable: ['', 'Lucía', 'Ana', '', ''], checked: [false, false, false, false, false], fin: ['', '', '', '', ''] };
  const r = pendientesDeAyer(ayer2, hoy, 5);
  assert.deepEqual(r.map(p => p.i), [1, 2]);
  assert.deepEqual(pasablesAHoy(r).map(p => p.i), [2]);   // la 1 ya está asignada hoy
});

test('sin datos de ayer no hay nada', () => {
  assert.deepEqual(pendientesDeAyer(null, hoy, 5), []);
});

test('día anterior', () => {
  assert.equal(diaAnterior('Viernes'), 'Jueves');
  assert.equal(diaAnterior('Lunes'), null);
  assert.equal(diaAnterior('Domingo'), null);
});
