import test from 'node:test';
import assert from 'node:assert/strict';
const R = await import('../src/modules/reparto-base.js');

test('areasDeOrden usa el reparto y, si no hay, separa el sector', () => {
  assert.deepEqual(R.areasDeOrden({ reparto:[{area:'A'},{area:'B'}], sector:'X' }), ['A','B']);
  assert.deepEqual(R.areasDeOrden({ sector:'Biblioteca, Lobby de Alvear' }), ['Biblioteca','Lobby de Alvear']);
  assert.deepEqual(R.areasDeOrden({}), []);
});
test('ordenEnArea filtra por un área individual aunque el sector junte varias', () => {
  const o = { sector:'Biblioteca, Lobby de Alvear' };
  assert.equal(R.ordenEnArea(o, 'Lobby de Alvear'), true);
  assert.equal(R.ordenEnArea(o, 'Elefante'), false);
  assert.equal(R.ordenEnArea(o, ''), true);
});
test('areasDeOrdenes lista cada área una sola vez', () => {
  const r = R.areasDeOrdenes([{ sector:'B, A' }, { sector:'A' }, { reparto:[{area:'C'}] }]);
  assert.deepEqual(r, ['A','B','C']);
});
test('textoCantReparto y repartoDeArea', () => {
  assert.equal(R.textoCantReparto({ qty:2, unidad:'vara' }), '2 varas');
  assert.equal(R.textoCantReparto({ qty:1, unidad:'vara' }), '1 vara');
  assert.equal(R.textoCantReparto({ qty:0.5, unidad:'paq' }), '0,5 paq.');
  assert.deepEqual(R.repartoDeArea({ reparto:[{area:'A',qty:1,unidad:'vara'}] }, 'A'), {area:'A',qty:1,unidad:'vara'});
  assert.equal(R.repartoDeArea({}, 'A'), null);
});

import { repartoDesdeComposicion } from '../src/modules/reparto-base.js';
test('repartoDesdeComposicion arma el reparto de un pedido viejo', () => {
  const comp = { 'Baños Duhau':[{prod:'Monsteras',qty:2,unidad:'vara'}], 'Spa':[{prod:'Monsteras',qty:1,unidad:'vara'},{prod:'Rosas',qty:5}] };
  const r = repartoDesdeComposicion({prod:'Monsteras', sector:'Baños Duhau, Spa'}, comp);
  assert.deepEqual(r, [{area:'Baños Duhau',qty:2,unidad:'vara'},{area:'Spa',qty:1,unidad:'vara'}]);
});
