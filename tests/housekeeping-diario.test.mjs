import test from 'node:test';
import assert from 'node:assert/strict';
import { armarHousekeeping, mailHousekeeping, estadoHabitacion } from '../worker/housekeeping-diario.js';

test('estados con los umbrales de la app', () => {
  assert.equal(estadoHabitacion(3), 'aldia');
  assert.equal(estadoHabitacion(4), 'proxima');
  assert.equal(estadoHabitacion(7), 'proxima');
  assert.equal(estadoHabitacion(8), 'urgente');
  assert.equal(estadoHabitacion(null), 'urgente');
  assert.equal(estadoHabitacion(5, 2, 4), 'urgente');
});

test('arma urgentes y próximas, la más atrasada primero', () => {
  const r = armarHousekeeping({
    hoy: '2026-11-13',
    habitaciones: [
      { hab: '1307', last: '2026-10-26' },
      { hab: '505', last: '2026-10-28', comentarioHK: 'planta <seca>' },
      { hab: '203', last: '2026-11-08' },
      { hab: '304', last: '2026-11-12' },
      { hab: '999' },
    ],
    urgencia: { okMax: 3, warnMax: 7 },
  });
  assert.deepEqual(r.urgentes.map((h) => h.hab), ['999', '1307', '505']);
  assert.deepEqual(r.proximas.map((h) => h.hab), ['203']);
  assert.equal(r.alDia, 1);
  const m = mailHousekeeping(r);
  assert.match(m.asunto, /3 urgentes, 1 próxima/);
  assert.match(m.html, /Hab\. 1307/);
  assert.match(m.html, /planta &lt;seca&gt;/);
});
