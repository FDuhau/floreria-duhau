// Separado de app.js. Lo que necesita de app.js llega por configurarHorarios():
//   JARDINEROS_LIST, TODAY_DAY, TODAY_ISO, clStateByDay, eventosData, fbSave, loginAuth, loginPasswords

import { showToast } from './tema-toast.js';
import { confirmModal, promptModal } from './modales.js';
import { esc, fmtDate } from './utils.js';
import { CL_TASKS } from './checklist.js';
import { ventasData } from './ventas.js';

let D = {};
export function configurarHorarios(deps){ D = deps; }

// ══════════════════════════════════════════════════════════════════════════════
// HORARIOS Y PRODUCTIVIDAD
// ══════════════════════════════════════════════════════════════════════════════
window.horariosData = {}; // { 'Caro': { '2026-06-15': {desde:'08:00',hasta:'13:00'}, ... } }
export let horariosPlantilla = {}; // { 'Caro': { Lunes:{desde:'08:00',hasta:'13:00'}, ... } }
let horMes = new Date().getMonth();
let horAnio = new Date().getFullYear();
export const DIAS_SEMANA_NAMES = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DIAS_SEMANA_SHORT = ['Lun','Mar','Mié','Jue','Vie','Sáb'];

export function getFloristasActivos(){
  // Tras migrar a hashes los usuarios viven en loginAuth; antes, en loginPasswords.
  const fuente = (D.loginAuth && Object.keys(D.loginAuth).length) ? D.loginAuth : D.loginPasswords;
  const nombres = [];
  Object.values(fuente||{}).forEach(e => {
    if(e.role === 'florista' && e.floristaNombre) nombres.push(e.floristaNombre);
  });
  return [...new Set(nombres)].sort((a,b) => a.localeCompare(b,'es'));
}

export function getEmpleadosActivos(){
  // Dedup: alguien puede ser florista y jardinero a la vez (ej. Ivan), no debe aparecer dos veces
  return [...new Set([...getFloristasActivos(), ...D.JARDINEROS_LIST])];
}

export function isJardinero(nombre){
  return D.JARDINEROS_LIST.includes(nombre);
}

// Lista de personas que figuran en Horarios (plantilla + calendario).
// Por defecto = empleados activos (floristas + jardinería), para poder
// coordinar los horarios de ambos equipos en un solo lugar. Gerencia puede
// agregar o quitar nombres; esa lista personalizada se guarda en Firebase
// (horariosPersonas) y, si existe, manda sobre el default.
function getHorariosPersonas(){
  const custom = window.horariosPersonas;
  if(Array.isArray(custom) && custom.length) return [...new Set(custom)];
  return getEmpleadosActivos();
}
export function horariosAddPersona(nombre){
  const nom = (nombre||'').trim();
  if(!nom) return;
  const lista = getHorariosPersonas();
  if(lista.some(n=>n.toLowerCase()===nom.toLowerCase())){ showToast('Esa persona ya está en la lista'); return; }
  const nueva = [...lista, nom];
  window.horariosPersonas = nueva;
  D.fbSave('horariosPersonas', nueva);
  if(!horariosPlantilla[nom]) horariosPlantilla[nom] = {};
  renderPlantilla();
  renderHorarios();
  showToast(''+nom+' agregado a horarios');
}
export async function horariosRemovePersona(nombre){
  const nom = (nombre||'').trim();
  if(!nom) return;
  if(!await confirmModal(`¿Quitar a "${nom}" de la lista de horarios?\n\nNo se borra el usuario ni las horas ya cargadas, solo deja de figurar en esta planificación.`)) return;
  const nueva = getHorariosPersonas().filter(n=>n!==nom);
  window.horariosPersonas = nueva;
  D.fbSave('horariosPersonas', nueva);
  renderPlantilla();
  renderHorarios();
  showToast(''+nom+' quitado de horarios');
}
export async function horariosAddPersonaFromSel(sel){
  const v = sel.value;
  sel.value = '';
  if(!v) return;
  if(v === '__otra__'){
    const nom = await promptModal('Nombre de la persona a agregar:', { title: 'Agregar a horarios' });
    if(nom && nom.trim()) horariosAddPersona(nom.trim());
  } else {
    horariosAddPersona(v);
  }
}

export function calcHorasDia(desde, hasta){
  if(!desde || !hasta) return 0;
  const [h1,m1] = desde.split(':').map(Number);
  const [h2,m2] = hasta.split(':').map(Number);
  const diff = (h2*60+m2) - (h1*60+m1);
  return diff > 0 ? Math.round(diff/60*10)/10 : 0;
}

// Jornada REAL fichada en el checklist para una persona en un día.
// Mira AMBAS fuentes: florTurnos (florista) y jardHorarios (jardinería), así
// los usuarios combinados como Ivan se toman bien fichen donde fichen.
// Si hay fichaje en las dos, usa el rango completo: del inicio más temprano
// al fin más tardío. Devuelve {inicio, fin, horas} o null si no fichó.
export function jornadaRealDia(nombre, iso){
  const ft = (window.florTurnos||{})[nombre]?.[iso];
  const jt = (window.jardHorarios||{})[nombre]?.[iso];
  const turnos = [ft, jt].filter(x => x && x.inicio && x.fin);
  if(!turnos.length) return null;
  const inis = turnos.map(x => x.inicio).sort();
  const fins = turnos.map(x => x.fin).sort();
  const inicio = inis[0], fin = fins[fins.length-1];
  return { inicio, fin, horas: calcHorasDia(inicio, fin) };
}

export function horNavMes(dir){
  horMes += dir;
  if(horMes > 11){ horMes = 0; horAnio++; }
  if(horMes < 0){ horMes = 11; horAnio--; }
  renderHorarios();
}

export function togglePlantilla(){
  const wrap = document.getElementById('plantilla-wrap');
  const btn = document.getElementById('plantilla-toggle-btn');
  if(!wrap) return;
  const vis = wrap.style.display !== 'none';
  wrap.style.display = vis ? 'none' : '';
  btn.textContent = vis ? '▼ Mostrar plantilla' : '▲ Ocultar plantilla';
  if(!vis) renderPlantilla();
}

export function renderPlantilla(){
  const container = document.getElementById('plantilla-table');
  if(!container) return;
  const personas = getHorariosPersonas();

  // Candidatos para agregar: empleados conocidos que aún no están en la lista
  const candidatos = getEmpleadosActivos().filter(n => !personas.includes(n));
  const addControl = `<div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
    <span style="font-size:12px;color:var(--mid-gray);font-weight:600">Agregar persona:</span>
    <select onchange="horariosAddPersonaFromSel(this)" style="padding:6px 8px;border:1px solid var(--light-gray);border-radius:6px;font-size:12px;font-family:inherit;background:white">
      <option value="">— Elegí quién agregar —</option>
      ${candidatos.length ? '<optgroup label="Empleados">'+candidatos.map(n=>`<option value="${esc(n)}">${esc(n)}${isJardinero(n)?' · Jardinería':''}</option>`).join('')+'</optgroup>' : ''}
      <option value="__otra__">Otra persona (escribir)…</option>
    </select>
  </div>`;

  const tip = `<div style="font-size:12px;color:var(--mid-gray);margin-top:8px">Completá los horarios base y tocá <strong>"Aplicar al mes"</strong> para rellenar todo el calendario de ${['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][horMes]}. Podés incluir jardinería para coordinar los horarios de ambos equipos.</div>`;

  if(!personas.length){
    container.innerHTML = '<div style="color:var(--mid-gray);padding:8px">No hay personas en la lista. Agregá una para empezar.</div>' + addControl + tip;
    return;
  }

  container.innerHTML = `<div class="table-wrapper"><table class="stock-table" style="font-size:12px">
    <thead><tr>
      <th style="min-width:120px">Persona</th>
      ${DIAS_SEMANA_SHORT.map(d => `<th style="text-align:center;min-width:130px">${d}</th>`).join('')}
    </tr></thead>
    <tbody>${personas.map(nombre => {
      if(!horariosPlantilla[nombre]) horariosPlantilla[nombre] = {};
      return `<tr>
        <td style="font-weight:600">
          <div style="display:flex;align-items:center;gap:6px">
            <span>${esc(nombre)}</span>
            ${isJardinero(nombre) ? '<span style="font-size:12px;background:var(--ok-soft);color:var(--green-ok);padding:1px 6px;border-radius:8px;font-weight:600;white-space:nowrap">Jard.</span>' : ''}
            <button class="btn-icon" title="Quitar de la lista de horarios" onclick="horariosRemovePersona('${esc(nombre)}')" style="color:var(--red-alert);font-size:12px;padding:0 4px;margin-left:auto">✕</button>
          </div>
        </td>
        ${DIAS_SEMANA_NAMES.map(dia => {
          const h = horariosPlantilla[nombre][dia] || {};
          const hs = calcHorasDia(h.desde||'', h.hasta||'');
          return `<td style="text-align:center;padding:4px">
            <div style="display:flex;gap:2px;justify-content:center;align-items:center">
              <input type="time" value="${h.desde||''}" onchange="setPlantilla('${esc(nombre)}','${dia}','desde',this.value)"
                style="width:68px;padding:2px;border:1px solid var(--light-gray);border-radius:4px;font-size:12px;font-family:inherit">
              <span style="font-size:12px;color:var(--mid-gray)">→</span>
              <input type="time" value="${h.hasta||''}" onchange="setPlantilla('${esc(nombre)}','${dia}','hasta',this.value)"
                style="width:68px;padding:2px;border:1px solid var(--light-gray);border-radius:4px;font-size:12px;font-family:inherit">
            </div>
            ${hs > 0 ? `<div style="font-size:12px;color:var(--sage-dark);font-weight:600;margin-top:1px">${hs}h</div>` : ''}
          </td>`;
        }).join('')}
      </tr>`;
    }).join('')}</tbody>
  </table></div>${addControl}${tip}`;
}

export function setPlantilla(nombre, dia, campo, val){
  if(!horariosPlantilla[nombre]) horariosPlantilla[nombre] = {};
  if(!horariosPlantilla[nombre][dia]) horariosPlantilla[nombre][dia] = {desde:'',hasta:''};
  horariosPlantilla[nombre][dia][campo] = val;
  D.fbSave('horariosPlantilla', horariosPlantilla);
  renderPlantilla();
}

export function aplicarPlantillaAlMes(){
  const floristas = getHorariosPersonas();
  const diasEnMes = new Date(horAnio, horMes+1, 0).getDate();
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const diaSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

  let count = 0;
  for(let d = 1; d <= diasEnMes; d++){
    const date = new Date(horAnio, horMes, d);
    const dayName = diaSemana[date.getDay()];
    if(dayName === 'Domingo') continue; // Skip domingos
    const iso = `${horAnio}-${String(horMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

    floristas.forEach(nombre => {
      const plantilla = horariosPlantilla[nombre]?.[dayName];
      if(plantilla && plantilla.desde && plantilla.hasta){
        if(!window.horariosData[nombre]) window.horariosData[nombre] = {};
        // Solo aplicar si el día NO tiene horario cargado ya (no pisar excepciones)
        if(!window.horariosData[nombre][iso] || (!window.horariosData[nombre][iso].desde && !window.horariosData[nombre][iso].hasta)){
          window.horariosData[nombre][iso] = {desde: plantilla.desde, hasta: plantilla.hasta};
          count++;
        }
      }
    });
  }

  D.fbSave('horariosData', window.horariosData);
  renderHorarios();
  showToast(`Plantilla aplicada a ${meses[horMes]} · ${count} horarios cargados`);
}

export function aplicarPlantillaForce(){
  // Versión que pisa todo (para usar con confirmación)
  const floristas = getHorariosPersonas();
  const diasEnMes = new Date(horAnio, horMes+1, 0).getDate();
  const diaSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  let count = 0;
  for(let d = 1; d <= diasEnMes; d++){
    const date = new Date(horAnio, horMes, d);
    const dayName = diaSemana[date.getDay()];
    if(dayName === 'Domingo') continue;
    const iso = `${horAnio}-${String(horMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    floristas.forEach(nombre => {
      const plantilla = horariosPlantilla[nombre]?.[dayName];
      if(!window.horariosData[nombre]) window.horariosData[nombre] = {};
      if(plantilla && plantilla.desde && plantilla.hasta){
        window.horariosData[nombre][iso] = {desde: plantilla.desde, hasta: plantilla.hasta};
        count++;
      } else {
        delete window.horariosData[nombre][iso];
      }
    });
  }
  D.fbSave('horariosData', window.horariosData);
  renderHorarios();
  showToast(`Mes completo recargado con plantilla · ${count} horarios`);
}

export function renderHorarios(){
  const cal = document.getElementById('hor-calendar');
  const sel = document.getElementById('hor-florista-sel');
  if(!cal) return;

  const empleados = getHorariosPersonas();
  if(sel){
    const cur = sel.value;
    const flor = empleados.filter(n=>!isJardinero(n));
    const jard = empleados.filter(n=>isJardinero(n));
    sel.innerHTML = '<option value="">— Todos —</option>'
      + (flor.length ? '<optgroup label="Florería">' + flor.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('') + '</optgroup>' : '')
      + (jard.length ? '<optgroup label="Jardinería">' + jard.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('') + '</optgroup>' : '');
    sel.value = cur;
  }
  const filtro = sel?.value || '';
  const lista = filtro ? [filtro] : empleados;

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const primerDia = new Date(horAnio, horMes, 1);
  const diasEnMes = new Date(horAnio, horMes+1, 0).getDate();
  let startDay = primerDia.getDay(); // 0=dom
  if(startDay === 0) startDay = 7; // lun=1

  // Generar grilla del mes
  let calHtml = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <button class="btn-secondary" onclick="horNavMes(-1)" style="padding:5px 12px">◀</button>
    <strong style="font-size:15px;color:var(--charcoal)">${meses[horMes]} ${horAnio}</strong>
    <button class="btn-secondary" onclick="horNavMes(1)" style="padding:5px 12px">▶</button>
  </div>`;

  calHtml += `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:var(--light-gray);border-radius:8px;overflow:hidden">`;
  ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].forEach(d => {
    calHtml += `<div style="background:var(--light-gray);padding:6px;text-align:center;font-size:12px;font-weight:600;color:var(--charcoal);letter-spacing:.5px">${d}</div>`;
  });

  // Celdas vacías antes del primer día
  for(let e = 1; e < startDay; e++){
    calHtml += '<div style="background:var(--warm-white);padding:6px"></div>';
  }

  // Días del mes
  for(let d = 1; d <= diasEnMes; d++){
    const iso = `${horAnio}-${String(horMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isToday = iso === D.TODAY_ISO;
    const isPast = iso < D.TODAY_ISO;

    // Contar empleados con horario ese día
    let totalHs = 0;
    let asignados = 0;
    lista.forEach(n => {
      // Jornada REAL fichada en el checklist (florista y/o jardinería).
      // La plantilla (horariosData) queda solo como respaldo si no fichó.
      const real = jornadaRealDia(n, iso);
      if(real){ totalHs += real.horas; asignados++; }
      else {
        const h = window.horariosData[n]?.[iso];
        if(h && h.desde && h.hasta){ totalHs += calcHorasDia(h.desde, h.hasta); asignados++; }
      }
    });

    const bgColor = isToday ? '#EBF0E8' : isPast ? '#F8F7F5' : 'var(--warm-white)';
    const border = isToday ? '2px solid var(--green-ok)' : 'none';

    calHtml += `<div style="background:${bgColor};padding:6px;min-height:60px;cursor:pointer;border:${border}" onclick="openDiaHorario('${iso}')">
      <div style="font-size:12px;font-weight:${isToday?'700':'500'};color:${isToday?'var(--green-ok)':'var(--charcoal)'};margin-bottom:3px">${d}</div>
      ${asignados > 0 ? `<div style="font-size:12px;color:var(--sage-dark);font-weight:600">${asignados} empleado${asignados>1?'s':''}</div>
        <div style="font-size:12px;color:var(--mid-gray)">${totalHs}h total</div>` : ''}
    </div>`;
  }
  calHtml += '</div>';
  cal.innerHTML = calHtml;

  renderInformeHoras(lista);
  renderProductividadHorarios(lista);
}

export function openDiaHorario(iso){
  const filtro = document.getElementById('hor-florista-sel')?.value;
  const lista = filtro ? [filtro] : getEmpleadosActivos();
  const diaLabel = fmtDate(iso);

  let ov = document.getElementById('dia-horario-modal');
  if(!ov){
    ov = document.createElement('div');
    ov.id = 'dia-horario-modal';
    ov.className = 'modal-overlay';
    document.body.appendChild(ov);
  }

  ov.innerHTML = `<div class="modal" style="max-width:500px">
    <button class="modal-close" onclick="document.getElementById('dia-horario-modal').classList.remove('open')">✕</button>
    <div class="modal-title">${diaLabel}</div>
    <div style="font-size:12px;color:var(--mid-gray);margin-bottom:14px">Cargá las horas de cada empleado para este día.</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${lista.map(nombre => {
        if(!window.horariosData[nombre]) window.horariosData[nombre] = {};
        const h = window.horariosData[nombre][iso] || {desde:'',hasta:''};
        const hs = calcHorasDia(h.desde, h.hasta);
        // Jornada REAL fichada en el checklist (florista y/o jardinería)
        const real = jornadaRealDia(nombre, iso);
        const fichado = real
          ? `<div style="font-size:12px;color:var(--green-ok);font-weight:600;margin-top:2px">✓ Fichó ${real.inicio}–${real.fin} · ${real.horas}h reales</div>`
          : '';
        return `<div style="padding:8px 0;border-bottom:1px solid var(--light-gray)">
          <div style="display:flex;align-items:center;gap:10px">
            <strong style="flex:1;font-size:13px;color:var(--charcoal);min-width:80px">${esc(nombre)}</strong>
            <input type="time" value="${h.desde||''}" id="hor_${nombre}_${iso}_desde"
              style="width:90px;padding:4px 6px;border:1px solid var(--light-gray);border-radius:4px;font-size:12px;font-family:inherit">
            <span style="font-size:12px;color:var(--mid-gray)">→</span>
            <input type="time" value="${h.hasta||''}" id="hor_${nombre}_${iso}_hasta"
              style="width:90px;padding:4px 6px;border:1px solid var(--light-gray);border-radius:4px;font-size:12px;font-family:inherit">
            <span style="font-size:12px;color:var(--sage-dark);font-weight:600;min-width:30px">${hs > 0 ? hs+'h' : ''}</span>
          </div>
          ${fichado}
        </div>`;
      }).join('')}
    </div>
    <div class="modal-actions" style="margin-top:16px">
      <button class="btn-secondary" onclick="limpiarDiaHorario('${iso}')">Limpiar día</button>
      <button class="btn-add" onclick="guardarDiaHorario('${iso}')">✓ Guardar</button>
    </div>
  </div>`;
  ov.classList.add('open');
}

export function guardarDiaHorario(iso){
  const filtro = document.getElementById('hor-florista-sel')?.value;
  const lista = filtro ? [filtro] : getEmpleadosActivos();

  lista.forEach(nombre => {
    if(!window.horariosData[nombre]) window.horariosData[nombre] = {};
    const desde = document.getElementById('hor_'+nombre+'_'+iso+'_desde')?.value || '';
    const hasta = document.getElementById('hor_'+nombre+'_'+iso+'_hasta')?.value || '';
    if(desde && hasta){
      window.horariosData[nombre][iso] = {desde, hasta};
    } else {
      delete window.horariosData[nombre][iso];
    }
  });
  D.fbSave('horariosData', window.horariosData);
  document.getElementById('dia-horario-modal')?.classList.remove('open');
  renderHorarios();
  showToast('Horarios guardados para ' + fmtDate(iso));
}

export function limpiarDiaHorario(iso){
  getEmpleadosActivos().forEach(nombre => {
    if(window.horariosData[nombre]) delete window.horariosData[nombre][iso];
  });
  D.fbSave('horariosData', window.horariosData);
  document.getElementById('dia-horario-modal')?.classList.remove('open');
  renderHorarios();
  showToast('Horarios del día limpiados');
}

// ── Informe de horas del mes: PROGRAMADAS (calendario) vs REALES (ingreso/egreso) ──
// Para cada persona, por semana del mes en curso, compara las horas planificadas
// (horariosData) con las horas realmente fichadas (jornadaRealDia). Deja ver si
// alguien vino de más (real > programado) o de menos (real < programado).
function _mondayISO(iso){
  const d = new Date(iso+'T00:00:00');
  let day = d.getDay(); if(day===0) day = 7;
  d.setDate(d.getDate()-(day-1));
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
// Detalle día por día de los fichajes (ingreso/salida) de UNA persona en el mes.
// Pensado para facturación de monotributistas: días que vino y horas reales.
function _detalleFichajesPersona(nombre){
  const dm = iso => iso.slice(8,10)+'/'+iso.slice(5,7);
  const r1 = n => Math.round(n*10)/10;
  const DOW = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const diasEnMes = new Date(horAnio, horMes+1, 0).getDate();
  let filas = '', txt = [], totHoras=0, totDias=0, totProg=0;
  // Subtotales por quincena (1–15 y 16–fin) — pensado para la facturación
  // quincenal de los monotributistas.
  const q = {1:{dias:0,horas:0,prog:0}, 2:{dias:0,horas:0,prog:0}};
  // Fila de subtotal de una quincena
  const subtotalRow = (label, qq) => qq.dias ? `<tr style="background:var(--cream)">
      <td style="padding:5px 12px;font-size:12px;font-weight:700;color:var(--charcoal)">${label} · ${qq.dias} día${qq.dias!==1?'s':''}</td>
      <td></td><td></td>
      <td style="padding:5px 12px;text-align:right;font-weight:700;font-size:12px">${r1(qq.horas)}h</td>
      <td style="padding:5px 12px;text-align:right;color:var(--mid-gray);font-size:12px">${qq.prog?r1(qq.prog)+'h':'—'}</td>
    </tr>` : '';
  let q1cerrada = false;
  for(let d=1; d<=diasEnMes; d++){
    // Al pasar del día 15 al 16, cerrar la 1ª quincena con su subtotal.
    if(d===16 && !q1cerrada){ filas += subtotalRow('1ª quincena (1–15)', q[1]); q1cerrada = true; }
    const iso = `${horAnio}-${String(horMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const h = window.horariosData?.[nombre]?.[iso];
    const prog = (h && h.desde && h.hasta) ? calcHorasDia(h.desde, h.hasta) : 0;
    totProg += prog;
    const qn = d<=15 ? 1 : 2;
    q[qn].prog += prog;
    const real = jornadaRealDia(nombre, iso);
    if(!real) continue; // solo los días que efectivamente vino (fichó)
    totDias++; totHoras += real.horas;
    q[qn].dias++; q[qn].horas += real.horas;
    const dow = DOW[new Date(iso+'T00:00:00').getDay()];
    filas += `<tr>
      <td style="padding:6px 12px;font-size:13px">${dow} ${dm(iso)}</td>
      <td style="padding:6px 12px;text-align:center;color:var(--green-ok);font-weight:600">${real.inicio}</td>
      <td style="padding:6px 12px;text-align:center;color:var(--red-alert);font-weight:600">${real.fin}</td>
      <td style="padding:6px 12px;text-align:right;font-weight:700">${r1(real.horas)}h</td>
      <td style="padding:6px 12px;text-align:right;color:var(--mid-gray)">${prog?r1(prog)+'h':'—'}</td>
    </tr>`;
    txt.push(`${dow} ${dm(iso)}: ${real.inicio}-${real.fin} (${r1(real.horas)}h)`);
  }
  if(!q1cerrada) filas += subtotalRow('1ª quincena (1–15)', q[1]);
  filas += subtotalRow('2ª quincena (16–fin)', q[2]);
  const txtQ = `1ª quincena (1–15): ${q[1].dias} día${q[1].dias!==1?'s':''} · ${r1(q[1].horas)}h\n2ª quincena (16–fin): ${q[2].dias} día${q[2].dias!==1?'s':''} · ${r1(q[2].horas)}h`;
  window._detalleFichajesTexto = `${nombre} — ${MESES[horMes]} ${horAnio}\n${txt.join('\n')||'Sin días trabajados'}\n———\n${txtQ}\nTotal: ${totDias} día${totDias!==1?'s':''} · ${r1(totHoras)}h reales · ${r1(totProg)}h programadas`;
  const cuerpo = filas || `<tr><td colspan="5" style="padding:16px;text-align:center;color:var(--mid-gray)">Sin días fichados este mes.</td></tr>`;
  return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;padding:14px 16px">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
      <strong style="font-size:15px;color:var(--charcoal)">${esc(nombre)} · ${MESES[horMes]} ${horAnio}</strong>
      <button class="btn-secondary" style="font-size:12px;padding:5px 10px" onclick="copiarDetalleFichajes()">Copiar</button>
    </div>
    <div class="table-wrapper"><table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr>
        <th style="text-align:left;padding:6px 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Día</th>
        <th style="text-align:center;padding:6px 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Ingreso</th>
        <th style="text-align:center;padding:6px 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Salida</th>
        <th style="text-align:right;padding:6px 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Horas</th>
        <th style="text-align:right;padding:6px 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray)">Prog.</th>
      </tr></thead>
      <tbody>${cuerpo}</tbody>
      <tfoot><tr style="border-top:2px solid var(--charcoal)">
        <td style="padding:8px 12px;font-weight:700">${totDias} día${totDias!==1?'s':''}</td>
        <td></td><td></td>
        <td style="padding:8px 12px;text-align:right;font-weight:700">${r1(totHoras)}h reales</td>
        <td style="padding:8px 12px;text-align:right;color:var(--mid-gray)">${r1(totProg)}h prog</td>
      </tr></tfoot>
    </table></div>
    <div style="font-size:12px;color:var(--mid-gray);margin-top:8px">Ingreso / Salida = fichaje real del día. «Prog.» = lo planificado en el calendario. Los subtotales por quincena (1–15 y 16–fin) sirven para cruzar la facturación quincenal de monotributistas. Cambiá el mes con ◀ ▶ de arriba.</div>
  </div>`;
}
export function copiarDetalleFichajes(){
  const t = window._detalleFichajesTexto || '';
  (navigator.clipboard?.writeText(t) || Promise.reject()).then(()=>showToast('Detalle copiado'), ()=>showToast('No se pudo copiar'));
}

function renderInformeHoras(lista){
  const cont = document.getElementById('hor-informe-hs');
  if(!cont) return;
  // Una sola persona seleccionada → planilla detallada de fichajes (ingreso/salida).
  if(lista.length === 1){ cont.innerHTML = _detalleFichajesPersona(lista[0]); return; }
  const dm = iso => iso.slice(8,10)+'/'+iso.slice(5,7);
  const r1 = n => Math.round(n*10)/10;
  const diasEnMes = new Date(horAnio, horMes+1, 0).getDate();
  // Agrupar los días del mes por semana (lunes a domingo)
  const semanas = new Map();
  for(let d=1; d<=diasEnMes; d++){
    const iso = `${horAnio}-${String(horMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const wk = _mondayISO(iso);
    if(!semanas.has(wk)) semanas.set(wk, []);
    semanas.get(wk).push(iso);
  }
  const weeks = [...semanas.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(e=>e[1]);

  const cards = lista.map(nombre => {
    let mesProg=0, mesReal=0;
    const filasWk = weeks.map(dias => {
      let prog=0, real=0;
      dias.forEach(iso => {
        const h = window.horariosData?.[nombre]?.[iso];
        if(h && h.desde && h.hasta) prog += calcHorasDia(h.desde, h.hasta);
        const rr = jornadaRealDia(nombre, iso);
        if(rr) real += rr.horas;
      });
      mesProg += prog; mesReal += real;
      if(prog===0 && real===0) return '';
      const diff = r1(real - prog);
      const col = Math.abs(diff)<0.5 ? 'var(--mid-gray)' : diff>0 ? 'var(--red-alert)' : 'var(--amber)';
      const txt = Math.abs(diff)<0.5 ? '=' : (diff>0?'+':'')+diff+'h';
      return `<div style="display:flex;justify-content:space-between;gap:10px;font-size:12px;padding:3px 0;border-top:1px dashed var(--light-gray)">
        <span style="color:var(--mid-gray);white-space:nowrap">Sem ${dm(dias[0])}–${dm(dias[dias.length-1])}</span>
        <span style="white-space:nowrap">Prog <strong>${r1(prog)}h</strong> · Real <strong>${r1(real)}h</strong> · <span style="color:${col};font-weight:700" title="Diferencia real − programado">${txt}</span></span>
      </div>`;
    }).join('');
    if(mesProg===0 && mesReal===0) return '';
    const diffMes = r1(mesReal - mesProg);
    const colM = Math.abs(diffMes)<0.5 ? 'var(--mid-gray)' : diffMes>0 ? 'var(--red-alert)' : 'var(--amber)';
    const txtM = Math.abs(diffMes)<0.5 ? '= en horario' : (diffMes>0?'+'+diffMes+'h de más':diffMes+'h de menos');
    return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;padding:12px 14px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:4px">
        <strong style="font-size:14px;color:var(--charcoal)">${esc(nombre)}</strong>
        <span style="font-size:12px">Mes: Prog <strong>${r1(mesProg)}h</strong> · Real <strong>${r1(mesReal)}h</strong> · <span style="color:${colM};font-weight:700">${txtM}</span></span>
      </div>
      ${filasWk}
    </div>`;
  }).filter(Boolean).join('');

  cont.innerHTML = cards || '<div style="color:var(--mid-gray);font-size:13px;padding:14px;text-align:center;background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px">Sin horas programadas ni fichadas este mes.</div>';
}

export function renderProductividadHorarios(empleados){
  const container = document.getElementById('hor-productividad');
  const labelEl = document.getElementById('hor-hoy-label');
  if(!container) return;
  if(labelEl) labelEl.textContent = D.TODAY_DAY + ' ' + fmtDate(D.TODAY_ISO);

  const dayState = D.clStateByDay[D.TODAY_DAY];

  const dur = (a,b) => { if(!a || !b) return 0; const [h1,m1]=a.split(':').map(Number); const [h2,m2]=b.split(':').map(Number); const d=(h2*60+m2)-(h1*60+m1); return d>0?d:0; };

  container.innerHTML = empleados.map(nombre => {
    let tareasHechas = 0, tareasAsignadas = 0, minsTareas = 0;

    // 1) Horario PROGRAMADO (plantilla que carga gerencia)
    const hor = window.horariosData[nombre]?.[D.TODAY_ISO] || {};
    const hsProgramadas = calcHorasDia(hor.desde, hor.hasta);

    // 2) Jornada REAL fichada (florista y/o jardinería) — toma a Ivan bien
    const real = jornadaRealDia(nombre, D.TODAY_ISO);
    const minsJornada = real ? real.horas * 60 : 0;

    // 3) Tiempo en TAREAS asignadas (suma de duraciones) + conteo de tareas.
    //    Se computan TODAS las fuentes para que los usuarios combinados
    //    (florista + jardinería) sumen sus dos tipos de tarea.
    if(dayState){
      CL_TASKS.forEach((t,i) => {
        if((dayState.responsable?.[i] || '') !== nombre) return;
        tareasAsignadas++;
        minsTareas += dur(dayState.inicio?.[i], dayState.fin?.[i]);
        const checked = Array.isArray(dayState.checked) ? dayState.checked[i] : (dayState.checked?.[i]);
        if(checked) tareasHechas++;
      });
    }
    D.eventosData.forEach(ev => {
      if(ev.fecha !== D.TODAY_ISO) return;
      if(ev.asignado === nombre){ tareasAsignadas++; if(ev.inicio && ev.fin){ tareasHechas++; minsTareas += dur(ev.inicio, ev.fin); } }
      if(ev.colocacionAsignado === nombre){ tareasAsignadas++; if(ev.colocacionInicio && ev.colocacionFin){ tareasHechas++; minsTareas += dur(ev.colocacionInicio, ev.colocacionFin); } }
      if(ev.retiroAsignado === nombre){ tareasAsignadas++; if(ev.retiroInicio && ev.retiroFin){ tareasHechas++; minsTareas += dur(ev.retiroInicio, ev.retiroFin); } }
    });
    (ventasData||[]).forEach(v => {
      if(v.asignado === nombre && v.estado === 'pendiente'){ tareasAsignadas++; if(v.inicio && v.fin){ tareasHechas++; minsTareas += dur(v.inicio, v.fin); } }
    });
    (window.jardineriaLog||[]).forEach(e => {
      if(e.fecha !== D.TODAY_ISO || e.quien !== nombre) return;
      // Estar en el log = tarea hecha (se cierra con "Hecho", sin horario por tarea).
      tareasAsignadas++; tareasHechas++;
      if(e.horaInicio && e.horaFin) minsTareas += dur(e.horaInicio, e.horaFin);
    });

    const hsTrabajadas = Math.round(minsJornada/60*10)/10;
    const hsTareas     = Math.round(minsTareas/60*10)/10;
    const diff = hsTrabajadas - hsProgramadas;
    const pct  = hsProgramadas > 0 ? Math.round(hsTrabajadas/hsProgramadas*100) : 0;
    // % del tiempo de trabajo que se fue en tareas asignadas (si no fichó, vs programado)
    const baseTareas = minsJornada > 0 ? minsJornada : hsProgramadas*60;
    const pctTareas  = baseTareas > 0 ? Math.round(minsTareas/baseTareas*100) : 0;

    let statusColor, statusIcon, statusText;
    if(hsProgramadas === 0 && minsJornada === 0 && minsTareas === 0){
      statusColor = 'var(--mid-gray)'; statusIcon = ''; statusText = 'No trabaja hoy';
    } else if(minsJornada === 0 && minsTareas > 0){
      statusColor = 'var(--amber)'; statusIcon = ''; statusText = 'Tareas registradas · falta marcar jornada';
    } else if(minsJornada === 0){
      statusColor = 'var(--mid-gray)'; statusIcon = ''; statusText = 'Sin actividad registrada';
    } else if(diff > 0.5){
      statusColor = 'var(--red-alert)'; statusIcon = ''; statusText = `+${diff.toFixed(1)}h extra · revisar`;
    } else if(hsProgramadas === 0){
      statusColor = 'var(--green-ok)'; statusIcon = ''; statusText = `${hsTrabajadas}h trabajadas`;
    } else if(pct >= 80){
      statusColor = 'var(--green-ok)'; statusIcon = ''; statusText = 'Productividad OK';
    } else {
      statusColor = 'var(--amber)'; statusIcon = ''; statusText = `${(hsProgramadas - hsTrabajadas).toFixed(1)}h disponibles`;
    }

    const barColor = diff > 0.5 ? 'var(--red-alert)' : pct >= 80 ? 'var(--green-ok)' : 'var(--amber)';
    const hayDatos = hsProgramadas > 0 || minsJornada > 0 || minsTareas > 0;

    return `<div style="background:var(--warm-white);border:1px solid var(--light-gray);border-radius:10px;padding:14px 16px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <div>
          <strong style="font-size:14px;color:var(--charcoal)">${esc(nombre)}</strong>
          <span style="font-size:12px;color:var(--mid-gray);margin-left:8px">${tareasHechas}/${tareasAsignadas} tareas</span>
        </div>
        <span style="font-size:12px;font-weight:600;color:${statusColor}">${statusIcon} ${statusText}</span>
      </div>
      ${hayDatos ? `<div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap">
        <div style="text-align:center;min-width:64px">
          <div style="font-size:12px;color:var(--mid-gray)">Programado</div>
          <div style="font-size:19px;font-weight:700;color:var(--charcoal)">${hsProgramadas}h</div>
          <div style="font-size:12px;color:var(--mid-gray)">${hor.desde||'—'} → ${hor.hasta||'—'}</div>
        </div>
        <div style="text-align:center;min-width:64px">
          <div style="font-size:12px;color:var(--mid-gray)">Trabajado</div>
          <div style="font-size:19px;font-weight:700;color:${barColor}">${hsTrabajadas}h</div>
          <div style="font-size:12px;color:var(--mid-gray)">${real ? real.inicio+' → '+real.fin : 'sin fichar'}</div>
        </div>
        <div style="text-align:center;min-width:64px">
          <div style="font-size:12px;color:var(--mid-gray)">En tareas</div>
          <div style="font-size:19px;font-weight:700;color:var(--sage-dark)">${hsTareas}h</div>
          <div style="font-size:12px;color:var(--mid-gray)">${tareasHechas} con horario</div>
        </div>
        <div style="flex:1;min-width:150px">
          <div style="font-size:12px;color:var(--mid-gray);margin-bottom:2px">Tiempo de trabajo (jornada)</div>
          <div style="height:8px;background:var(--light-gray);border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${Math.min(100,pct)}%;background:${barColor};border-radius:4px;transition:width .5s"></div>
          </div>
          <div style="font-size:12px;color:var(--mid-gray);margin:1px 0 8px;text-align:right">${pct}% de lo programado</div>
          <div style="font-size:12px;color:var(--mid-gray);margin-bottom:2px">Tiempo en tareas asignadas</div>
          <div style="height:8px;background:var(--light-gray);border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${Math.min(100,pctTareas)}%;background:var(--sage-dark);border-radius:4px;transition:width .5s"></div>
          </div>
          <div style="font-size:12px;color:var(--mid-gray);margin-top:1px;text-align:right">${pctTareas}% ${minsJornada>0?'de la jornada':'de lo programado'}</div>
        </div>
      </div>` : ''}
    </div>`;
  }).join('');
}