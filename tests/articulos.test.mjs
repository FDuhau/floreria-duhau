import test from 'node:test';
import assert from 'node:assert/strict';
import {
  claveArticulo, mismoArticulo, aplicarAlias, nombreCanonico, claveCostoPara, costoGuardado,
  detectarGrupos, unificarEnDatos, aplicarAliasANodo, listaSinRepetidos, ultimoCostoVara,
} from '../src/modules/articulos-base.js';

test('claveArticulo ignora mayúsculas, tildes, plurales y espacios', () => {
  for (const [a, b] of [
    ['Monstera', 'MONSTERAS'], ['monstera', 'Monsteras '], ['Anémonas', 'anemona'], ['Rosas Importadas', 'rosa  importada'],
    ['Girasol', 'girasoles'], ['San Vicentes', 'san vicente'], ['Conejitos / Nardos / Alhelíes', 'Conejitos/Nardos/Alhelies'],
    ['Limón', 'Limones'], ['Liliums', 'Lilium'],
  ]) assert.equal(claveArticulo(a), claveArticulo(b), `${a} ~ ${b}`);
  assert.notEqual(claveArticulo('Pino'), claveArticulo('Pino Thuja'));
  assert.notEqual(claveArticulo('Limonium'), claveArticulo('Limón'));
  assert.equal(mismoArticulo('', ''), false);
});

test('alias: forma vieja → nombre que quedó, también dentro de "A / B"', () => {
  const alias = { [claveArticulo('Astromelia')]: 'Alstroemerias', [claveArticulo('Conejito')]: 'Conejitos' };
  assert.equal(aplicarAlias(alias, 'astromelias'), 'Alstroemerias');
  assert.equal(aplicarAlias(alias, 'Conejito / Alhelí'), 'Conejitos / Alhelí');
  assert.equal(aplicarAlias(alias, 'Pino'), 'Pino');
});

test('nombreCanonico usa el nombre que ya existe', () => {
  assert.equal(nombreCanonico('  naviza ', ['Naviza', 'Pino']), 'Naviza');
  assert.equal(nombreCanonico('Nuevo  producto', ['Naviza']), 'Nuevo producto');
});

test('costo: busca la otra forma del mismo artículo y guarda en la existente', () => {
  const precios = { 'Naviza': 1143, 'Pino': 0, 'pino': 1200 };
  assert.equal(costoGuardado(precios, 'naviza', {}), 1143);
  assert.equal(costoGuardado(precios, 'Pinos', {}), 1200);
  assert.equal(costoGuardado(precios, 'Rosa', {}), 0);
  assert.equal(claveCostoPara(precios, 'NAVIZA', {}), 'Naviza');
  assert.equal(claveCostoPara(precios, 'Pino', {}), 'Pino');
  assert.equal(claveCostoPara(precios, 'Hortensia', {}), 'Hortensia');
  assert.equal(claveCostoPara(precios, 'navisa', { [claveArticulo('navisa')]: 'Naviza' }), 'Naviza');
});

test('ultimoCostoVara: compra más reciente con varas por paquete; ignora anuladas', () => {
  const compras = [
    { prod: 'Rosas importadas', fecha: '2026-10-07', costo: '65000', varasPorPaq: 25 },
    { prod: 'Rosas Importadas', fecha: '2026-10-24', costo: '50000' },                  // sin varas/paq
    { prod: 'Rosas Importadas', fecha: '2026-10-23', costo: '70000', varasPorPaq: 25 },
    { prod: 'Rosas Importadas', fecha: '2026-10-30', costo: '90000', varasPorPaq: 25, anulado: true },
  ];
  assert.deepEqual(ultimoCostoVara(compras, ['Rosas importadas', 'Rosas Importadas']), { fecha: '2026-10-23', costo: 2800, prod: 'Rosas Importadas', prov: '' });
});

function datosEjemplo(){
  return {
    cotizadorPrecios: { 'Naviza': 8000, 'naviza': 8000, 'navisa': 889, 'Pino': 1200, 'pino': 2000, 'Pino Thuja': 3000 },
    comprasFlore: [
      { prod: 'Naviza', fecha: '2026-10-02', costo: '8000', varasPorPaq: 7 },
      { prod: 'naviza', fecha: '2026-10-07', costo: '8000', varasPorPaq: 7 },
      { prod: 'navisa', fecha: '2026-09-18', costo: '8000', varasPorPaq: 9 },
      { prod: 'Pino', fecha: '2026-10-30', costo: '12000', varasPorPaq: 10 },
      { prod: 'pino', fecha: '2026-10-28', costo: '12000', varasPorPaq: 10 },
    ],
    comprasJard: [],
    stockData: [
      { prod: 'Pino', area: 'evento', actual: 10, min: 1, max: 40 },
      { prod: 'pino', area: 'Evento', actual: 5, min: 2, max: 20 },
      { prod: 'pino', area: 'habitaciones', actual: 3, min: 1, max: 10 },
      { prod: 'Pino Thuja', area: 'evento', actual: 4, min: 1, max: 10 },
    ],
    recetasData: [{ nombre: 'Bochita', ings: [{ prod: 'Pino', qty: 1 }, { prod: 'pino', qty: 0.5 }, { prod: 'Naviza / Pino', qty: 1 }] }],
    arreglosComposicion: { 'Lobby': [{ prod: 'navisa', qty: 2, unidad: 'paq' }] },
    presupuestosData: [{ items: [{ prod: 'naviza', cant: 3 }] }],
    insumosCustom: ['Pino', 'pino', 'Viznaga'],
  };
}

test('detectarGrupos encuentra las formas repetidas y propone nombre y costo', () => {
  const { grupos, sugeridos } = detectarGrupos(datosEjemplo());
  const pino = grupos.find(g => g.clave === 'pino');
  assert.ok(pino);
  assert.equal(pino.maestro, 'Pino');
  assert.equal(pino.costo, 1200);                    // compra del 30/10
  assert.deepEqual(pino.variantes.map(v => v.nombre).sort(), ['Pino', 'pino']);
  const naviza = grupos.find(g => g.clave === 'naviza');
  assert.equal(naviza.costo, 1143);                  // 8000 ÷ 7, compra del 07/10
  // "navisa" no tiene la misma clave: aparece como sugerido, junto con Naviza.
  const sug = sugeridos.find(g => g.variantes.some(v => v.nombre === 'navisa'));
  assert.ok(sug && sug.variantes.some(v => v.nombre === 'Naviza'));
  assert.ok(!grupos.some(g => g.variantes.some(v => v.nombre === 'Pino Thuja')));
});

test('unificarEnDatos deja un solo nombre y un solo costo en todas las secciones', () => {
  const d = datosEjemplo();
  const { alias, resumen } = unificarEnDatos(d, [
    { maestro: 'Pino', variantes: ['Pino', 'pino'], costo: 1200 },
    { maestro: 'Naviza', variantes: ['Naviza', 'naviza', 'navisa'], costo: 1143 },
  ]);
  assert.deepEqual(d.cotizadorPrecios, { 'Naviza': 1143, 'Pino': 1200, 'Pino Thuja': 3000 });
  assert.deepEqual(d.comprasFlore.map(c => c.prod), ['Naviza', 'Naviza', 'Naviza', 'Pino', 'Pino']);
  // Stock: los renglones iguales (mismo área) se suman; el de otra área queda; Pino Thuja no se toca.
  assert.deepEqual(d.stockData, [
    { prod: 'Pino', area: 'evento', actual: 15, min: 2, max: 40 },
    { prod: 'Pino', area: 'habitaciones', actual: 3, min: 1, max: 10 },
    { prod: 'Pino Thuja', area: 'evento', actual: 4, min: 1, max: 10 },
  ]);
  assert.deepEqual(d.recetasData[0].ings, [{ prod: 'Pino', qty: 1.5 }, { prod: 'Naviza / Pino', qty: 1 }]);
  assert.equal(d.arreglosComposicion['Lobby'][0].prod, 'Naviza');
  assert.equal(d.presupuestosData[0].items[0].prod, 'Naviza');
  assert.deepEqual(d.insumosCustom, ['Pino', 'Viznaga']);
  assert.equal(alias[claveArticulo('navisa')], 'Naviza');
  assert.equal(resumen.stockUnidos, 1);
});

test('aplicarAliasANodo corrige lo que se guarda después con una forma vieja', () => {
  const alias = { [claveArticulo('navisa')]: 'Naviza', [claveArticulo('Naviza')]: 'Naviza' };
  const compras = [{ prod: 'NAVISA' }, { prod: 'Rosa' }];
  aplicarAliasANodo('comprasFlore', compras, alias);
  assert.deepEqual(compras.map(c => c.prod), ['Naviza', 'Rosa']);
  const precios = { 'Naviza': 1000, 'navisa': 1300 };
  aplicarAliasANodo('cotizadorPrecios', precios, alias);
  assert.deepEqual(precios, { 'Naviza': 1300 });
  const comp = [{ zona: 'Lobby', ings: [{ prod: 'navisa', qty: 1 }] }];
  aplicarAliasANodo('arreglosComposicion', comp, alias);
  assert.equal(comp[0].ings[0].prod, 'Naviza');
});

test('listaSinRepetidos sugiere una sola forma por artículo', () => {
  assert.deepEqual(listaSinRepetidos(['pino', 'Pino', 'Naviza', 'naviza'], ['Pino'], {}), ['Naviza', 'Pino']);
});

test('nombresPorArticulo: un nombre por artículo, con alias y preferidos', async () => {
  const { nombresPorArticulo } = await import('../src/modules/articulos-base.js');
  const r = nombresPorArticulo(['Anémonas', 'anemonas', 'Anemonas', 'Biznagas', 'biznaga', 'biznaga', 'navisa', 'Naviza'], ['Anémonas'],
    { [claveArticulo('navisa')]: 'Naviza', [claveArticulo('Naviza')]: 'Naviza' });
  assert.deepEqual(r.sort(), ['Anémonas', 'Naviza', 'biznaga'].sort());
});
