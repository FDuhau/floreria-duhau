// Tests del importador del Daily Report (parte pura: parser y armado del evento).
// Correr con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  _evStripAcc, _evBannerDate, _evTransformArreglo, _evParseEvents, _evComposeNotas, _evToEvento,
} from '../src/modules/daily-import.js';

// Arma una línea como la que entrega pdf.js: celdas con x y texto.
const line = (...cells) => {
  const cs = cells.map((c) => (typeof c === 'string' ? { x: 0, str: c } : c));
  return { cells: cs, text: cs.map((c) => c.str).join('  ') };
};

test('_evStripAcc: minúsculas y sin tildes ni ñ', () => {
  assert.equal(_evStripAcc('Ubicación ÁÉÍÓÚ Ñandú'), 'ubicacion aeiou nandu');
  assert.equal(_evStripAcc(null), '');
});

test('_evBannerDate: fecha del banner en ISO; vacía si no entiende', () => {
  assert.equal(_evBannerDate('Fecha del Evento Martes, Septiembre 9, 2026'), '2026-09-09');
  assert.equal(_evBannerDate('Fecha del Evento Lunes, Setiembre 15, 2026'), '2026-09-15');
  assert.equal(_evBannerDate('Fecha del Evento Lunes, Foo 15, 2026'), '');
  assert.equal(_evBannerDate('otra cosa'), '');
});

test('_evTransformArreglo: separa por +, suma los del mismo tipo y aclara el material', () => {
  assert.deepEqual(
    _evTransformArreglo('2 arreglos altos para buffet + 4 bochitas mesas cocktail + 4 bochitas para livings', 'Follaje'),
    ['2 arreglos altos para buffet con follaje', '8 bochitas con follaje'],
  );
  assert.deepEqual(_evTransformArreglo('3 centros de mesa', 'Rosa y blanco'), ['3 centros de mesa con flores']);
  assert.deepEqual(_evTransformArreglo('3 centros de mesa', ''), ['3 centros de mesa']);
  assert.deepEqual(_evTransformArreglo('', 'Follaje'), []);
  assert.deepEqual(_evTransformArreglo('bochita', ''), ['1 bochita']); // sin cantidad → 1
});

const pagina = [
  line('Fecha del Evento Jueves, Septiembre 10, 2026'),
  line('Reserva:', 'AEXPI 2026'),
  line('Evento :', 'Acreditacion, stands'),
  line('Ubicacion', 'Salon Borges'),
  line('Numero Orden', '123456'),
  line('SM:', 'Juan Perez'),
  line('Contacto en la Propiedad', 'ULLA GUEDES'),
  line('Catering-', 'Coffee break'),
  line('Cantidad de pax: 120'),
  line('Tonos de las flores: Follaje'),
  line('Armado del evento: 07:00'),
  line('Arreglos listos a las: 09:00'),
  line('Jueves', '08:00', '18:00', '1.250.000,00'),
  line('Tipo de arreglo:'),
  line({ x: 200, str: '2 arreglos altos para buffet + 4 bochitas para livings' }),
  line('Precio'),
  line({ x: 199, str: 'Retirar al finalizar' }),
  // segundo evento, sin reserva: el nombre cae al "Evento :"
  line('Fecha del Evento Viernes, Septiembre 11, 2026'),
  line('Evento :', 'Cena de gala'),
  line('Numero Orden', '999'),
  // bloque sin orden ni nombre: se descarta
  line('Fecha del Evento Sabado, Septiembre 12, 2026'),
  line('Ubicacion', 'Salon X'),
];

test('_evParseEvents: extrae los campos por rótulo y descarta bloques vacíos', () => {
  const evs = _evParseEvents([pagina]);
  assert.equal(evs.length, 2);
  const e = evs[0];
  assert.equal(e.date, '2026-09-10');
  assert.equal(e.nombre, 'AEXPI 2026');            // el nombre es la Reserva
  assert.equal(e.tipoEvento, 'Acreditacion, stands');
  assert.equal(e.salon, 'Salon Borges');
  assert.equal(e.ordenId, '123456');
  assert.equal(e.sm, 'Juan Perez');
  assert.equal(e.contacto, 'ULLA GUEDES');
  assert.equal(e.catering, 'Coffee break');
  assert.equal(e.pax, '120');
  assert.equal(e.tono, 'Follaje');
  assert.equal(e.horaIni, '08:00');
  assert.equal(e.horaFin, '18:00');
  assert.equal(e.precio, '1.250.000,00');
  assert.deepEqual(e.arreglos, ['2 arreglos altos para buffet con follaje', '4 bochitas para livings con follaje']);
  assert.equal(e.notaLibre, 'Retirar al finalizar');
  assert.equal(evs[1].nombre, 'Cena de gala');
  assert.equal(evs[1].date, '2026-09-11');
});

test('_evParseEvents: sin banners no hay eventos', () => {
  assert.deepEqual(_evParseEvents([[line('Reserva:', 'X')]]), []);
  assert.deepEqual(_evParseEvents([]), []);
});

test('_evComposeNotas y _evToEvento: evento de la app sin pisar el flujo de trabajo', () => {
  const e = _evParseEvents([pagina])[0];
  const notas = _evComposeNotas(e);
  assert.match(notas, /Arreglos:\n- 2 arreglos altos para buffet con follaje/);
  assert.match(notas, /Tono: Follaje/);
  assert.match(notas, /Armado: 07:00 · Listos: 09:00/);
  assert.match(notas, /Horario: 08:00–18:00/);
  assert.match(notas, /SM: Juan Perez · Catering: Coffee break/);
  assert.match(notas, /Nº Orden: 123456/);
  const ev = _evToEvento(e);
  assert.equal(ev.nombre, 'AEXPI 2026');
  assert.equal(ev.fecha, '2026-09-10');
  assert.equal(ev.hora, '08:00');
  assert.equal(ev.pax, 120);
  assert.equal(ev.precio, '1.250.000,00');
  assert.equal(ev.organizador, 'ULLA GUEDES');
  assert.equal(ev.estado, 'Pedidos Pendientes');
  assert.equal(ev.importadoDaily, true);
  assert.deepEqual(ev.arreglos, []);
});

test('_evToEvento: valores por defecto con datos faltantes', () => {
  const ev = _evToEvento({ arreglos: [] });
  assert.equal(ev.nombre, 'Evento sin nombre');
  assert.equal(ev.precio, 'A confirmar');
  assert.equal(ev.pax, 0);
  assert.equal(ev.fecha, '');
});
