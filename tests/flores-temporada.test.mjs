import test from 'node:test';
import assert from 'node:assert/strict';

const B = await import('../src/modules/flores-temporada-base.js');
const { setArticulosAlias } = await import('../src/modules/articulos-base.js');
const cat = B.normalizarCatalogo(B.FLORES_TEMPORADA_BASE);
const f = n => cat.find(x => x.nombre === n);

test('la base trae las 56 flores y follajes de la planilla', () => {
  assert.equal(cat.length, 56);
  assert.equal(cat.filter(x => x.tipo === 'Follaje').length, 13);
  assert.deepEqual(f('Lisianthus').meses, [1, 2, 3, 10, 11, 12]);
  assert.equal(new Set(cat.map(x => x.id)).size, cat.length);
});

test('texto de meses da la vuelta del año', () => {
  assert.equal(B.textoMeses([10, 11, 12, 1, 2, 3]), 'oct–mar');
  assert.equal(B.textoMeses([6, 7, 8, 9, 10]), 'jun–oct');
  assert.equal(B.textoMeses([3, 4, 10, 11]), 'mar–abr y oct–nov');
  assert.equal(B.textoMeses(B.FLORES_TEMPORADA_BASE[2].meses), 'todo el año');
  assert.equal(B.textoMeses([9]), 'sep');
});

test('estado en el mes', () => {
  assert.equal(B.estadoEnMes(f('Lisianthus'), 10), 'empieza');
  assert.equal(B.estadoEnMes(f('Lisianthus'), 12), 'temporada');
  assert.equal(B.estadoEnMes(f('Lisianthus'), 3), 'termina');
  assert.equal(B.estadoEnMes(f('Lisianthus'), 9), 'llega');
  assert.equal(B.estadoEnMes(f('Lisianthus'), 6), 'fuera');
  assert.equal(B.estadoEnMes(f('Pino'), 6), 'todo-el-anio');
});

test('resumen de noviembre', () => {
  const r = B.resumenMes(cat, 11);
  const n = l => l.map(x => x.nombre);
  assert.ok(n(r.temporada).includes('Peonías'));
  assert.ok(n(r.termina).includes('Conejito'));
  assert.ok(n(r.termina).includes('Gretel'));
  assert.ok(n(r.empieza).includes('Hortensia'));
  assert.ok(n(r.fuera).includes('Fresias'));
  assert.ok(!n(r.temporada).includes('Pino'));
  assert.ok(n(r.todoElAnio).includes('Pino'));
});

test('enlace con el artículo de Compras usa la clave unificada', () => {
  const conocidos = ['Biznaga', 'Alstroemerias', 'Astromelias', 'naviza', 'Naviza', 'Cardos azules', 'San Vicentes', 'Girasol', 'Rosas Importadas', 'Rosa importada'];
  const costo = n => ({ 'Naviza': 1500, 'Rosa importada': 3000 })[n] || 0;
  setArticulosAlias({});
  assert.equal(B.articuloDeFlor(f('Alstroemeria'), conocidos, costo), 'Alstroemerias');
  assert.equal(B.articuloDeFlor(f('Biznaga / Naviza'), conocidos, costo), 'Naviza');
  assert.equal(B.articuloDeFlor(f('Cardos'), conocidos, costo), 'Cardos azules');
  assert.equal(B.articuloDeFlor(f('San Vicente'), conocidos, costo), 'San Vicentes');
  assert.equal(B.articuloDeFlor(f('Girasoles'), conocidos, costo), 'Girasol');
  assert.equal(B.articuloDeFlor(f('Rosa importada'), conocidos, costo), 'Rosa importada');
  assert.equal(B.articuloDeFlor(f('Fotiña'), conocidos, costo), '');
  assert.equal(B.articuloDeFlor({ ...f('Fotiña'), articulo: 'Fotinia' }, conocidos, costo), 'Fotinia');
});

test('normalizar lo que viene de Firebase', () => {
  const x = B.normalizarFlor({ nombre: ' Nueva ', meses: { 0: 3, 1: '13', 2: 1 }, colores: 'rosa, , blanco', tipo: 'otro' });
  assert.deepEqual(x.meses, [1, 3]);
  assert.deepEqual(x.colores, ['rosa', 'blanco']);
  assert.equal(x.tipo, 'Flor');
  assert.equal(x.nombre, 'Nueva');
  assert.equal(B.muestraColor('Bordó'), '#6E1A2B');
});
