// Separado de app.js. Lo que necesita de app.js llega por configurarSeguimiento():
//   CURR_MONTH, JARDINEROS_LIST, TODAY_ISO, fbSave, fmtMonth, getAllMonths, getMonthVisits, habitacionesData, habitacionesLog, jardCurrentJardinero, jardineriaData, jardineriaLog, jardineroNombre, userRole

import { calcDuracion, fmtDur } from './checklist.js';
import { esc, fmtDate } from './utils.js';
import { icon } from './iconos.js';
import { _diasDesdeTxt, _jardPoblarSecciones, daysSince, getDaysBadge, getSectionEmoji, getSectionPillCls, renderAlertasUrgentesJard, renderJardOps, urgenciaPanelHTML, zonaHorasData } from './jardineria.js';

let D = {};
export function configurarSeguimiento(deps){
  D = deps;
  jardReporteMes = D.CURR_MONTH;
  habReporteMes = D.CURR_MONTH;
}

let ctrlJardFilterMode='all';
let ctrlHabFilterMode='all';

// ── Productividad del equipo (gerencia) ──────────────────────────────────────
export function renderJardProdEquipo(){
  const el = document.getElementById('jard-prod-body');
  if(!el) return;

  const y = new Date().getFullYear(), m = new Date().getMonth();
  const mesKey = y+'-'+String(m+1).padStart(2,'0');
  const diasEnMes = new Date(y, m+1, 0).getDate();

  const allNames = [...new Set([
    ...Object.keys(window.jardHorarios),
    ...D.jardineriaLog.map(l=>l.quien).filter(Boolean)
  ])].sort();

  if(!allNames.length){
    el.innerHTML = '<p style="color:var(--mid-gray);font-size:13px;padding:20px;text-align:center">Sin registros aún. Los jardineros deben registrar inicio y fin de jornada desde Tareas Jardinería.</p>';
    return;
  }

  const DIAS_CAL = ['Do','Lu','Ma','Mi','Ju','Vi','Sá'];
  let html = '';

  allNames.forEach(nombre => {
    const horarioNombre = window.jardHorarios[nombre] || {};
    const logNombre = D.jardineriaLog.filter(l => l.quien === nombre && l.fecha.startsWith(mesKey));

    // Armar datos por día del mes
    let totalMin = 0, diasTrabajados = 0;
    const diasData = {};
    Object.entries(horarioNombre).forEach(([fecha, d]) => {
      if(!fecha.startsWith(mesKey)) return;
      const dur = calcDuracion(d.inicio, d.fin);
      diasData[fecha] = { inicio:d.inicio, fin:d.fin, dur, tareas:[] };
      if(dur){ totalMin += dur; diasTrabajados++; }
    });
    logNombre.forEach(l => {
      if(!diasData[l.fecha]) diasData[l.fecha] = { inicio:'', fin:'', dur:0, tareas:[] };
      diasData[l.fecha].tareas.push(l);
    });
    const tareasTotal = logNombre.length;
    const avgHoras = diasTrabajados > 0 ? Math.round(totalMin/diasTrabajados) : 0;

    // Calendario
    const startDow = new Date(y, m, 1).getDay();
    let calHtml = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-top:12px;font-size:12px">`;
    DIAS_CAL.forEach(d => { calHtml += `<div style="text-align:center;color:var(--mid-gray);font-weight:600;padding:3px 0">${d}</div>`; });
    for(let i=0;i<startDow;i++) calHtml += `<div></div>`;
    for(let d=1; d<=diasEnMes; d++){
      const fechaStr = mesKey+'-'+String(d).padStart(2,'0');
      const dd = diasData[fechaStr];
      const esHoy = fechaStr === D.TODAY_ISO;
      const tieneRegistro = dd && (dd.dur>0 || dd.tareas.length>0);
      const bg = tieneRegistro ? (dd.dur>=360?'#2C6B3A':dd.dur>=120?'#D4A820':'#7CA87C') : (esHoy?'var(--cream)':'transparent');
      const color = tieneRegistro ? 'white' : esHoy ? 'var(--charcoal)' : 'var(--mid-gray)';
      const border = esHoy ? '1.5px solid var(--charcoal)' : '1px solid transparent';
      const titleTxt = dd ? (dd.inicio?`${dd.inicio}–${dd.fin||'?'} · ${fmtDur(dd.dur)} · `:'')+(dd.tareas.length+' tareas') : '';
      calHtml += `<div title="${titleTxt}" onclick="jardProdDiaClick('${nombre}','${fechaStr}')"
        style="text-align:center;padding:5px 2px;border-radius:6px;background:${bg};color:${color};border:${border};cursor:${tieneRegistro?'pointer':'default'};font-weight:${tieneRegistro?'700':'400'}">${d}</div>`;
    }
    calHtml += '</div>';

    // Detalle de los últimos días trabajados (los 5 más recientes)
    const diasConActividad = Object.entries(diasData)
      .filter(([,d]) => d.dur>0 || d.tareas.length>0)
      .sort((a,b) => b[0].localeCompare(a[0]))
      .slice(0,5);

    let actividadHtml = '';
    if(diasConActividad.length){
      actividadHtml = `<div style="margin-top:16px;border-top:1px solid var(--light-gray);padding-top:14px">
        <div style="font-size:12px;font-weight:600;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Últimos días trabajados</div>
        <div id="jard-prod-act-${nombre.replace(/\s/g,'_')}" style="display:flex;flex-direction:column;gap:8px">
          ${diasConActividad.map(([fecha, dd]) => _jardDiaHTML(nombre, fecha, dd)).join('')}
        </div>
      </div>`;
    }

    html += `<div style="background:var(--surface-1);border:1px solid var(--light-gray);border-radius:8px;padding:16px;margin-bottom:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px"></span>
          <span style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--charcoal)">${esc(nombre)}</span>
        </div>
        <div style="display:flex;gap:20px;flex-wrap:wrap">
          <div style="text-align:center"><div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Horas mes</div><div style="font-size:22px;font-weight:700;color:var(--charcoal)">${fmtDur(totalMin)}</div></div>
          <div style="text-align:center"><div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Días</div><div style="font-size:22px;font-weight:700;color:var(--charcoal)">${diasTrabajados}</div></div>
          <div style="text-align:center"><div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Prom. diario</div><div style="font-size:22px;font-weight:700;color:var(--green-ok)">${avgHoras>0?fmtDur(avgHoras):'—'}</div></div>
          <div style="text-align:center"><div style="font-size:12px;color:var(--mid-gray);text-transform:uppercase;letter-spacing:1px">Tareas mes</div><div style="font-size:22px;font-weight:700;color:var(--charcoal)">${tareasTotal}</div></div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--mid-gray)">≥6h &nbsp;2-6h &nbsp;&lt;2h &nbsp;· Tocá un día para ver el detalle</div>
      ${calHtml}
      ${actividadHtml}
    </div>`;
  });
  el.innerHTML = html;
}

function _jardDiaHTML(nombre, fecha, dd){
  const tareasItems = dd.tareas.map(t => `
    <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid var(--surface-2)">
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600;color:var(--charcoal)">${esc(t.task)}</div>
        <div style="font-size:12px;color:var(--mid-gray)">${esc(t.group)} · ${esc(t.section)}</div>
        ${t.obs ? `<div style="font-size:12px;color:#5A5A50;margin-top:2px;font-style:italic">"${esc(t.obs)}"</div>` : ''}
      </div>
      ${t.horaInicio||t.horaFin ? `<div style="text-align:right;white-space:nowrap;font-size:12px;color:var(--mid-gray)">
        ${t.horaInicio?icon('play')+t.horaInicio:''}${t.horaFin?' · '+icon('stop')+t.horaFin:''}
        ${t.horaInicio&&t.horaFin?'<br><span style="color:var(--green-ok);font-weight:600">'+fmtDur(calcDuracion(t.horaInicio,t.horaFin))+'</span>':''}
      </div>` : ''}
    </div>`).join('');

  return `<div style="border:1px solid var(--light-gray);border-radius:6px;overflow:hidden">
    <div style="background:var(--cream);padding:8px 12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;cursor:pointer"
         onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:12px;font-weight:700;color:var(--charcoal)">${fmtDate(fecha)}</span>
        ${dd.inicio ? `<span style="font-size:12px;color:var(--mid-gray)">${icon('play')}${dd.inicio}${dd.fin?' · '+icon('stop')+dd.fin:' · en curso'}</span>` : ''}
      </div>
      <div style="display:flex;gap:12px;align-items:center">
        ${dd.dur>0 ? `<span style="font-size:12px;font-weight:700;color:var(--green-ok)">${fmtDur(dd.dur)}</span>` : ''}
        <span style="font-size:12px;color:var(--mid-gray)">${dd.tareas.length} tarea${dd.tareas.length!==1?'s':''}</span>
        <span style="font-size:12px;color:var(--mid-gray)">▾</span>
      </div>
    </div>
    <div style="padding:4px 12px 8px;${dd.tareas.length>2?'display:none':''}">
      ${tareasItems || '<div style="padding:8px 0;color:var(--mid-gray);font-size:12px">Sin tareas registradas ese día</div>'}
    </div>
  </div>`;
}

export function jardProdDiaClick(nombre, _fecha){
  // Resaltar en el calendario y hacer scroll al día en el detalle
  const actEl = document.getElementById('jard-prod-act-'+nombre.replace(/\s/g,'_'));
  if(!actEl) return;
  actEl.scrollIntoView({behavior:'smooth', block:'nearest'});
}

export function renderCtrlJard(){
  renderAlertasUrgentesJard();
  _jardPoblarSecciones();
  const search=(document.getElementById('ctrl-jard-search')?.value||'').toLowerCase();
  const mode=ctrlJardFilterMode;
  const secFilter=(document.getElementById('ctrl-jard-section')?.value||'');

  // KPIs
  let kOk=0,kWarn=0,kAlert=0,kNone=0;
  D.jardineriaData.forEach(r=>{
    const s=getDaysBadge(daysSince(r.last)).status;
    if(s==='ok')kOk++;else if(s==='warn')kWarn++;else if(s==='alert')kAlert++;else kNone++;
  });
  const totalMesJard = D.jardineriaData.reduce((s,r)=>s+D.getMonthVisits(r),0);
  document.getElementById('ctrl-jard-kpis').innerHTML=urgenciaPanelHTML('jard')+`
    <div class="card"><div class="card-label">Al día</div><div class="card-value green" style="font-size:32px">${kOk}</div><div class="card-sub">zonas recientes</div></div>
    <div class="card"><div class="card-label">Próxima</div><div class="card-value amber" style="font-size:32px">${kWarn}</div><div class="card-sub">requieren visita pronto</div></div>
    <div class="card"><div class="card-label">Urgente</div><div class="card-value red" style="font-size:32px">${kAlert}</div><div class="card-sub">intervenir hoy</div></div>
    <div class="card"><div class="card-label">Sin registro</div><div class="card-value" style="font-size:32px;color:var(--mid-gray)">${kNone}</div><div class="card-sub">primer registro pendiente</div></div>
    <div class="card"><div class="card-label">Visitas este mes</div><div class="card-value" style="font-size:32px;color:var(--charcoal)">${totalMesJard}</div><div class="card-sub">${D.fmtMonth(D.CURR_MONTH)}</div></div>`;

  const tbody=document.getElementById('ctrl-jard-body');
  tbody.innerHTML='';
  let lastSec='',lastGroup='',renderedAny=false;

  D.jardineriaData.forEach((r,i)=>{
    const days=daysSince(r.last);
    const badge=getDaysBadge(days);
    if(mode==='alert'&&badge.status!=='alert') return;
    if(mode==='warn' &&badge.status!=='warn')  return;
    if(mode==='ok'   &&badge.status!=='ok')    return;
    if(mode==='none' &&badge.status!=='none')  return;
    if(secFilter&&r.section!==secFilter) return;
    if(search&&!r.group.toLowerCase().includes(search)&&!r.task.toLowerCase().includes(search)&&!r.section.toLowerCase().includes(search)) return;

    renderedAny=true;

    // Section header
    if(r.section!==lastSec){
      lastSec=r.section; lastGroup='';
      const sr=document.createElement('tr');
      sr.className='ctrl-section-row';
      sr.innerHTML=`<td colspan="7">${getSectionEmoji(r.section)} ZONA ${esc(r.section.toUpperCase())}</td>`;
      tbody.appendChild(sr);
    }
    // Group header
    if(r.group!==lastGroup){
      lastGroup=r.group;
      const gr=document.createElement('tr');
      gr.className='ctrl-group-row';
      gr.innerHTML=`<td colspan="7">${esc(r.group)}</td>`;
      tbody.appendChild(gr);
    }

    const monthVisits=D.getMonthVisits(r);
    const alCls=badge.status==='ok'?'ok':badge.status==='warn'?'atencion':'comprar';
    const alLbl=badge.status==='ok'?'Al día':badge.status==='warn'?'Próxima':badge.status==='alert'?'Urgente':'Sin datos';
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>
        <div style="font-weight:600;font-size:13px;color:var(--charcoal);line-height:1.4">${esc(r.group)}</div>
        <span class="section-pill ${getSectionPillCls(r.section)}" style="margin-top:4px;display:inline-block">${esc(r.section)}</span>
      </td>
      <td style="font-size:13px;color:var(--charcoal)">${esc(r.task)}</td>
      <td style="font-size:12.5px;color:var(--mid-gray);white-space:nowrap">
        ${ D.userRole==='gerencia'
          ? `<input type="date" value="${r.last||''}" max="${D.TODAY_ISO}"
               onchange="gerenciaSetFecha('jard',${i},this.value)"
               title="Editar fecha de última visita"
               style="font-size:12px;padding:4px 6px;border:1px solid var(--light-gray);border-radius:6px;color:var(--charcoal)">`
          : (r.last ? fmtDate(r.last) : '<em style="color:#B0AFA5;font-size:12px">Sin registro</em>') }
        ${ r.last ? `<div style="font-size:12px;color:#B0AFA5;margin-top:3px">${_diasDesdeTxt(r.last)}</div>` : '' }
      </td>
      <td>
        <span class="alerta-badge ${alCls}"
          style="font-size:12px;padding:3px 10px;${badge.status==='none'?'background:#ECEAE4;color:var(--mid-gray)':''}">
          ${alLbl}
        </span>
      </td>
      <td style="text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:400;color:var(--charcoal)">
        ${monthVisits}
      </td>
      <td>
        <div style="display:flex;gap:6px;align-items:center">
          <select id="jard-quien-${i}" class="cl-select" style="font-size:12px;padding:5px 8px;flex:1">
            <option value="">— Jardinero —</option>
            ${D.JARDINEROS_LIST.map(n=>`<option ${n===(D.jardineroNombre||D.jardCurrentJardinero)?'selected':''}>${n}</option>`).join('')}
          </select>
          <button class="mark-done-btn" onclick="markJardDone(${i},document.getElementById('jard-quien-${i}').value)">✓ Hecho</button>
        </div>
      </td>
      <td style="vertical-align:middle">
        <input class="cl-obs-input" value="${esc(r.obs||'')}" placeholder="Observaciones..."
          onchange="jardineriaData[${i}].obs=this.value"
          style="width:100%;min-width:160px">
      </td>
      `;
    tbody.appendChild(tr);
  });

  if(!renderedAny){
    tbody.innerHTML='<tr><td colspan="7" style="padding:20px;text-align:center;color:var(--mid-gray)">Sin resultados para este filtro.</td></tr>';
  }
  renderJardReporte();
}

export function markJardDone(i, quien){
  const r = D.jardineriaData[i];
  const zh = zonaHorasData[r.section+'|||'+r.group] || {};
  D.jardineriaLog.push({
    fecha: D.TODAY_ISO,
    section: r.section,
    group: r.group,
    task: r.task,
    quien: quien || D.jardCurrentJardinero || '',
    obs: r.obs || '',
    horaInicio: zh.inicio || r.horaInicio || '',
    horaFin: zh.fin || r.horaFin || ''
  });
  r.last = D.TODAY_ISO;
  r.liveVisits = (r.liveVisits||0)+1;
  if(!r.monthlyVisits) r.monthlyVisits={};
  r.monthlyVisits[D.CURR_MONTH] = (r.monthlyVisits[D.CURR_MONTH]||0)+1;
  r.quien = ''; r.obs = ''; r.canUndo = false;
  r.horaInicio = ''; r.horaFin = '';  // reiniciar el cronómetro (ya quedó en el log)
  // Actualizar contador de tareas en el turno del jardinero
  const quienFinal = quien || D.jardCurrentJardinero || '';
  if(quienFinal && window.jardHorarios[quienFinal]?.[D.TODAY_ISO]){
    window.jardHorarios[quienFinal][D.TODAY_ISO].tareas = (window.jardHorarios[quienFinal][D.TODAY_ISO].tareas||0)+1;
    D.fbSave('jardHorarios', window.jardHorarios);
  }
  D.fbSave('jardineriaData', D.jardineriaData);
  D.fbSave('jardineriaLog', D.jardineriaLog);
  if(document.getElementById('page-jardineria-ops')?.classList.contains('active')) renderJardOps();
  if(document.getElementById('page-control-jardineria')?.classList.contains('active')) renderCtrlJard();
}

export function toggleCtrlSection(wrapId, chevId){
  const wrap = document.getElementById(wrapId);
  const chev = document.getElementById(chevId);
  if(!wrap) return;
  const open = wrap.style.display !== 'none';
  wrap.style.display = open ? 'none' : 'block';
  if(chev) chev.style.transform = open ? '' : 'rotate(90deg)';
  // Cargar productividad al abrir
  if(!open && wrapId === 'jard-prod-wrap') renderJardProdEquipo();
}

export function ctrlJardFilter(mode,_btn){
  ctrlJardFilterMode=mode;
  ['all','alert','warn','ok','none'].forEach(m=>{
    const b=document.getElementById('ctj-'+m);
    if(b) b.classList.toggle('active',m===mode);
  });
  renderCtrlJard();
}

export function exportCtrlCSV(){
  const months = D.getAllMonths(D.jardineriaData);
  const pastMonths = months.filter(m=>m!==D.CURR_MONTH);
  const rows=[['Seccion','Zona / Grupo','Tarea / Planta','Ultima visita','Dias','Visitas este mes',...pastMonths.map(m=>D.fmtMonth(m))]];
  D.jardineriaData.forEach(r=>{
    const days=daysSince(r.last);
    rows.push([r.section,r.group,r.task,r.last||'Sin datos',days!==null?days:'—',
      D.getMonthVisits(r),...pastMonths.map(m=>D.getMonthVisits(r,m))]);
  });
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='jardineria_control_'+D.TODAY_ISO+'.csv';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

// ── HABITACIONES ────────────────────────
export function initCtrlHab(){}

let hopsFilter = 'all';
export function setHopsFilter(mode){
  hopsFilter = mode;
  ['all','alert','warn','ok'].forEach(m=>{
    const btn = document.getElementById('hops-btn-'+m);
    if(btn) btn.classList.toggle('active', m===mode);
  });
  renderHabOps();
}

export function renderHabOps(){
  let kOk=0,kWarn=0,kAlert=0;
  D.habitacionesData.forEach(r=>{
    const s=getDaysBadge(daysSince(r.last)).status;
    if(s==='ok')kOk++;else if(s==='warn')kWarn++;else kAlert++;
  });
  const kpisEl = document.getElementById('hops-kpis');
  if(kpisEl) kpisEl.innerHTML=`
    <div class="card"><div class="card-label">Urgente</div><div class="card-value red" style="font-size:32px">${kAlert}</div><div class="card-sub">visitar hoy</div></div>
    <div class="card"><div class="card-label">Próxima</div><div class="card-value amber" style="font-size:32px">${kWarn}</div><div class="card-sub">próxima visita</div></div>
    <div class="card"><div class="card-label">Al día</div><div class="card-value green" style="font-size:32px">${kOk}</div><div class="card-sub">al día</div></div>`;

  const statusOrder = {alert:0, warn:1, ok:2, none:3};
  const sorted = D.habitacionesData
    .map((r,i)=>({r, i, days:daysSince(r.last), badge:getDaysBadge(daysSince(r.last))}))
    .sort((a,b)=> statusOrder[a.badge.status] - statusOrder[b.badge.status] || (b.days||999) - (a.days||999));

  const grid = document.getElementById('hops-grid');
  if(!grid) return;
  grid.innerHTML = '';

  sorted.forEach(({r, i, badge})=>{
    if(hopsFilter !== 'all' && badge.status !== hopsFilter) return;

    const borderColor = badge.status==='alert' ? '#E53935' : badge.status==='warn' ? '#F59E0B' : '#43A047';
    const monthVisits = D.getMonthVisits(r);

    const card = document.createElement('div');
    card.style.cssText = `background:var(--warm-white);border:1px solid ${borderColor};border-left:4px solid ${borderColor};border-radius:6px;padding:16px;display:flex;flex-direction:column;gap:10px`;

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <div style="font-size:20px;font-weight:600;color:var(--charcoal);font-family:'Cormorant Garamond',serif">Hab. ${esc(r.hab)}</div>
        <span class="days-badge ${badge.cls}" style="flex-shrink:0">${badge.label}</span>
      </div>
      ${r.comentarioHK ? `<div style="background:var(--amber-soft);border:1px solid #E9D8B0;border-radius:6px;padding:8px 11px;font-size:12.5px;color:#8A5A16;line-height:1.4"><strong>Housekeeping:</strong> ${esc(r.comentarioHK)}</div>` : ''}
      <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--mid-gray)">
        <span>Última visita: ${r.last ? fmtDate(r.last) : '<em>Sin registro</em>'}</span>
        <span style="font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--charcoal)" title="Visitas este mes">${monthVisits} <span style="font-size:12px;color:var(--mid-gray)">este mes</span></span>
      </div>
      <textarea id="hops-obs-${i}" class="cl-obs-input" placeholder="Observaciones..." style="width:100%;font-size:12px;resize:vertical;min-height:44px;padding:5px 7px;border-radius:4px;border:1px solid var(--light-gray);font-family:inherit;background:var(--warm-white)"
        onchange="habitacionesData[${i}].notas=this.value">${esc(r.notas||'')}</textarea>
      <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
        <select id="hops-quien-${i}" class="cl-select" style="font-size:12px;padding:5px 8px;flex:1">
          <option value="">— Jardinero —</option>
          ${D.JARDINEROS_LIST.map(n=>`<option ${n===(D.jardineroNombre||D.jardCurrentJardinero)?'selected':''}>${esc(n)}</option>`).join('')}
        </select>
        <button class="mark-done-btn" style="flex:1" onclick="hopsVisita(${i})">✓ Visité hoy</button>
      </div>`;
    grid.appendChild(card);
  });

  if(grid.children.length === 0){
    grid.innerHTML = `<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--mid-gray);font-size:14px">
      ${hopsFilter==='all' ? 'Sin habitaciones cargadas.' : 'Sin habitaciones en esta categoría.'}
    </div>`;
  }
}

export function hopsVisita(i){
  const quien = document.getElementById('hops-quien-'+i)?.value || '';
  markHabDone(i, quien);
  renderHabOps();
  if(document.getElementById('page-control-habitaciones')?.classList.contains('active')) renderCtrlHab();
}

export function habsRegistrarHora(i, campo){
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2,'0');
  const mm  = String(now.getMinutes()).padStart(2,'0');
  D.habitacionesData[i][campo] = hh+':'+mm;
  D.fbSave('habitacionesData', D.habitacionesData);
  if(campo === 'horaFin'){
    hopsVisita(i);
  } else {
    renderHabOps();
  }
}

export function habsResetHora(i, campo){
  D.habitacionesData[i][campo] = '';
  D.fbSave('habitacionesData', D.habitacionesData);
  renderHabOps();
}

export function habsHoraCell(i, campo, r){
  const val  = r[campo] || '';
  const done = false;
  if(val){
    const color = campo==='horaInicio' ? '#2C4A3E' : '#8B3A3A';
    const bg    = campo==='horaInicio' ? '#EBF5E8' : '#FDF0F0';
    const reset = done ? '' : `onclick="habsResetHora(${i},'${campo}')" title="Tocar para borrar"`;
    return `<span ${reset} style="font-size:13px;font-weight:700;color:${color};background:${bg};padding:3px 10px;border-radius:8px;display:inline-block;${done?'':'cursor:pointer'}">${val}</span>`;
  }
  const dis   = done ? 'disabled style="opacity:.45;cursor:not-allowed"' : '';
  const label = campo==='horaInicio' ? icon('play')+'Inicio' : icon('stop')+'Fin';
  const cls   = campo==='horaInicio' ? 'btn-hora-inicio' : 'btn-hora-fin';
  return `<button class="${cls}" ${dis} onclick="habsRegistrarHora(${i},'${campo}')">${label}</button>`;
}

export function renderCtrlHab(){
  const search=(document.getElementById('ctrl-hab-search')?.value||'').toLowerCase();
  const mode=ctrlHabFilterMode;

  let kOk=0,kWarn=0,kAlert=0;
  D.habitacionesData.forEach(r=>{
    const s=getDaysBadge(daysSince(r.last)).status;
    if(s==='ok')kOk++;else if(s==='warn')kWarn++;else kAlert++;
  });

  const totalMesHab = D.habitacionesData.reduce((s,r)=>s+D.getMonthVisits(r),0);
  document.getElementById('ctrl-hab-kpis').innerHTML=urgenciaPanelHTML('hab')+`
    <div class="card"><div class="card-label">Al día</div><div class="card-value green" style="font-size:32px">${kOk}</div><div class="card-sub">visitadas recientemente</div></div>
    <div class="card"><div class="card-label">Próxima</div><div class="card-value amber" style="font-size:32px">${kWarn}</div><div class="card-sub">programar ingreso</div></div>
    <div class="card"><div class="card-label">Urgente</div><div class="card-value red" style="font-size:32px">${kAlert}</div><div class="card-sub">ingresar esta semana</div></div>
    <div class="card"><div class="card-label">Total registradas</div><div class="card-value" style="font-size:32px">${D.habitacionesData.length}</div><div class="card-sub">habitaciones con plantas</div></div>
    <div class="card"><div class="card-label">Visitas este mes</div><div class="card-value" style="font-size:32px;color:var(--charcoal)">${totalMesHab}</div><div class="card-sub">${D.fmtMonth(D.CURR_MONTH)}</div></div>`;

  const tbody=document.getElementById('ctrl-hab-body');
  tbody.innerHTML='';
  let renderedAny=false;
  const isHK = D.userRole==='housekeeping';

  // Sort by days desc (most urgent first)
  const sorted=[...D.habitacionesData.entries()].sort((a,b)=>{
    const da=daysSince(a[1].last)??999;
    const db=daysSince(b[1].last)??999;
    return db-da;
  });

  sorted.forEach(([i,r])=>{
    const days=daysSince(r.last);
    const badge=getDaysBadge(days);
    if(mode==='alert'&&badge.status!=='alert') return;
    if(mode==='warn' &&badge.status!=='warn')  return;
    if(mode==='ok'   &&badge.status!=='ok')    return;
    if(search&&!r.hab.includes(search)) return;
    renderedAny=true;

    const monthVisits=D.getMonthVisits(r);
    const alCls=badge.status==='ok'?'ok':badge.status==='warn'?'atencion':'comprar';
    const alLbl=badge.status==='ok'?'Al día':badge.status==='warn'?'Próxima':'Urgente';
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td><span class="hab-num">Hab. ${esc(r.hab)}</span></td>
      <td style="font-size:12.5px;color:var(--mid-gray);white-space:nowrap">
        ${ D.userRole==='gerencia'
          ? `<input type="date" value="${r.last||''}" max="${D.TODAY_ISO}"
               onchange="gerenciaSetFecha('hab',${i},this.value)"
               title="Editar fecha de última visita"
               style="font-size:12px;padding:4px 6px;border:1px solid var(--light-gray);border-radius:6px;color:var(--charcoal)">`
          : (r.last ? fmtDate(r.last) : '<em style="color:#B0AFA5">—</em>') }
        ${ r.last ? `<div style="font-size:12px;color:#B0AFA5;margin-top:3px">${_diasDesdeTxt(r.last)}</div>` : '' }
      </td>
      <td>
        <span class="alerta-badge ${alCls}" style="font-size:12px;padding:3px 10px">${alLbl}</span>
      </td>
      <td style="text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:400;color:var(--charcoal)">
        ${monthVisits}
      </td>
      <td>
        ${isHK
          ? '<span style="color:var(--mid-gray);font-size:12px">solo lectura</span>'
          : `<div style="display:flex;gap:6px;align-items:center">
          <select id="hab-quien-${i}" class="cl-select" style="font-size:12px;padding:5px 8px;flex:1">
            <option value="">— Jardinero —</option>
            ${D.JARDINEROS_LIST.map(n=>`<option ${n===(D.jardineroNombre||D.jardCurrentJardinero)?'selected':''}>${esc(n)}</option>`).join('')}
          </select>
          <button class="mark-done-btn" onclick="markHabDone(${i},document.getElementById('hab-quien-${i}').value)">✓ Ingresé</button>
        </div>`}
      </td>
      <td style="vertical-align:middle">
        ${isHK
          ? `<span style="font-size:12.5px;color:var(--mid-gray)">${esc(r.notas||'—')}</span>`
          : `<input class="cl-obs-input" value="${esc(r.notas||'')}" placeholder="Observaciones..."
          onchange="habitacionesData[${i}].notas=this.value"
          style="width:100%;min-width:160px">`}
      </td>
      <td style="vertical-align:middle">
        <input class="cl-obs-input" value="${esc(r.comentarioHK||'')}" placeholder="Ej. planta seca, yuyos..."
          onchange="setHabComentarioHK(${i},this.value)"
          style="width:100%;min-width:150px;border-color:${r.comentarioHK?'#E9D8B0':'var(--light-gray)'};background:${r.comentarioHK?'#FDF9EF':'var(--warm-white)'}">
      </td>`;
    tbody.appendChild(tr);
  });

  if(!renderedAny){
    tbody.innerHTML='<tr><td colspan="7" style="padding:20px;text-align:center;color:var(--mid-gray)">Sin resultados para este filtro.</td></tr>';
  }
  renderHabReporte();
  renderHabLog();
}

export function markHabDone(i, quien){
  const r = D.habitacionesData[i];
  D.habitacionesLog.push({
    fecha: D.TODAY_ISO,
    hab: r.hab,
    quien: quien || D.jardCurrentJardinero || '',
    obs: r.notas || '',
    horaInicio: r.horaInicio || '',
    horaFin: r.horaFin || ''
  });
  r.last = D.TODAY_ISO;
  r.liveVisits = (r.liveVisits||0)+1;
  if(!r.monthlyVisits) r.monthlyVisits={};
  r.monthlyVisits[D.CURR_MONTH] = (r.monthlyVisits[D.CURR_MONTH]||0)+1;
  r.quien = ''; r.notas = ''; r.comentarioHK = ''; r.canUndo = false;
  r.horaInicio = ''; r.horaFin = '';  // reiniciar el cronómetro (ya quedó en el log)
  D.fbSave('habitacionesData', D.habitacionesData);
  D.fbSave('habitacionesLog', D.habitacionesLog);
  if(document.getElementById('page-hab-ops')?.classList.contains('active')) renderHabOps();
  if(document.getElementById('page-control-habitaciones')?.classList.contains('active')) renderCtrlHab();
}

// Comentario de Housekeeping por habitación (se ve en Jardinería y se limpia al ingresar).
export function setHabComentarioHK(i, val){
  if(!D.habitacionesData[i]) return;
  D.habitacionesData[i].comentarioHK = val;
  window._habLastSave = Date.now();
  D.fbSave('habitacionesData', D.habitacionesData);
  if(document.getElementById('page-hab-ops')?.classList.contains('active')) renderHabOps();
}

export function ctrlHabFilter(mode,_btn){
  ctrlHabFilterMode=mode;
  ['all','alert','warn','ok'].forEach(m=>{
    const b=document.getElementById('cth-'+m);
    if(b) b.classList.toggle('active',m===mode);
  });
  renderCtrlHab();
}

export function exportHabCSV(){
  const months = D.getAllMonths(D.habitacionesData);
  const pastMonths = months.filter(m=>m!==D.CURR_MONTH);
  const rows=[['Habitación','Última visita','Días','Estado','Visitas este mes',...pastMonths.map(m=>D.fmtMonth(m)),'Notas']];
  D.habitacionesData.forEach(r=>{
    const days=daysSince(r.last);
    const badge=getDaysBadge(days);
    rows.push([r.hab,r.last||'Sin datos',days!==null?days:'—',
      badge.status==='ok'?'Al día':badge.status==='warn'?'Próxima':'Urgente',
      D.getMonthVisits(r),...pastMonths.map(m=>D.getMonthVisits(r,m)),r.notas||'']);
  });
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='habitaciones_control_'+D.TODAY_ISO+'.csv';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

// ── REPORTES MENSUALES ──────────────────────────────────────────────────────
let jardReporteMes = ''; // se fija en configurarSeguimiento() (necesita CURR_MONTH)
let habReporteMes  = '';
export function setJardReporteMes(m){ jardReporteMes=m; renderJardReporte(); }
export function setHabReporteMes(m){  habReporteMes=m;  renderHabReporte(); }

export function renderJardReporte(){
  const el = document.getElementById('jard-reporte-body');
  if(!el) return;
  const months = D.getAllMonths(D.jardineriaData);
  if(months.length === 0){
    el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--mid-gray);font-size:13px">Aún no hay historial mensual. Los contadores arrancan desde este mes.</div>';
    return;
  }
  if(!months.includes(jardReporteMes)) jardReporteMes = months[0];
  const ym = jardReporteMes;
  const monthTotal = D.jardineriaData.reduce((s,r)=>s+D.getMonthVisits(r,ym),0);
  const pills = months.map(m=>`<button onclick="setJardReporteMes('${m}')"
      style="padding:4px 14px;border-radius:20px;border:1px solid var(--light-gray);background:${m===ym?'var(--charcoal)':'transparent'};color:${m===ym?'white':'var(--charcoal)'};font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">
      ${D.fmtMonth(m)}</button>`).join('');
  const rows = D.jardineriaData.filter(r=>D.getMonthVisits(r,ym)>0).sort((a,b)=>D.getMonthVisits(b,ym)-D.getMonthVisits(a,ym));
  const tableHtml = rows.length
    ? `<table style="width:100%;border-collapse:collapse;font-size:12.5px"><thead><tr>
        <th style="text-align:left;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase;background:var(--cream)">Secci&oacute;n</th>
        <th style="text-align:left;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase;background:var(--cream)">Zona</th>
        <th style="text-align:left;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase;background:var(--cream)">Tarea</th>
        <th style="text-align:center;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase;background:var(--cream)">Visitas</th>
      </tr></thead><tbody>
      ${rows.map(r=>`<tr>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);font-size:12px;color:var(--mid-gray)">${esc(r.section)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);color:var(--mid-gray);font-size:12px">${esc(r.group)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);font-weight:500">${esc(r.task)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--charcoal)">${D.getMonthVisits(r,ym)}</td>
      </tr>`).join('')}</tbody></table>`
    : `<div style="padding:20px;text-align:center;color:var(--mid-gray)">Sin visitas registradas para ${D.fmtMonth(ym)}.</div>`;
  el.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
      <span style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:500">Mes:</span>${pills}
    </div>
    <div style="background:var(--cream);border-radius:8px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:500;margin-bottom:4px">${D.fmtMonth(ym)}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:400;color:var(--charcoal);line-height:1">${monthTotal} <span style="font-size:15px;color:var(--mid-gray)">visitas registradas</span></div>
      </div>
      <button class="btn-secondary" onclick="exportMesJard('${ym}')">&#8595; Exportar este mes</button>
    </div>${tableHtml}`;
}

export function renderHabReporte(){
  const el = document.getElementById('hab-reporte-body');
  if(!el) return;
  const months = D.getAllMonths(D.habitacionesData);
  if(months.length === 0){
    el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--mid-gray);font-size:13px">Aún no hay historial mensual. Los contadores arrancan desde este mes.</div>';
    return;
  }
  if(!months.includes(habReporteMes)) habReporteMes = months[0];
  const ym = habReporteMes;
  const monthTotal = D.habitacionesData.reduce((s,r)=>s+D.getMonthVisits(r,ym),0);
  const pills = months.map(m=>`<button onclick="setHabReporteMes('${m}')"
      style="padding:4px 14px;border-radius:20px;border:1px solid var(--light-gray);background:${m===ym?'var(--charcoal)':'transparent'};color:${m===ym?'white':'var(--charcoal)'};font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">
      ${D.fmtMonth(m)}</button>`).join('');
  const rows = D.habitacionesData.filter(r=>D.getMonthVisits(r,ym)>0).sort((a,b)=>D.getMonthVisits(b,ym)-D.getMonthVisits(a,ym));
  const tableHtml = rows.length
    ? `<table style="width:100%;border-collapse:collapse;font-size:12.5px;max-width:400px"><thead><tr>
        <th style="text-align:left;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase;background:var(--cream)">Habitaci&oacute;n</th>
        <th style="text-align:center;padding:8px 12px;border-bottom:2px solid var(--light-gray);color:var(--mid-gray);font-size:12px;letter-spacing:1px;text-transform:uppercase;background:var(--cream)">Visitas</th>
      </tr></thead><tbody>
      ${rows.map(r=>`<tr>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);font-weight:600;font-family:'Cormorant Garamond',serif;font-size:16px">Hab. ${esc(r.hab)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid var(--light-gray);text-align:center;font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:var(--charcoal)">${D.getMonthVisits(r,ym)}</td>
      </tr>`).join('')}</tbody></table>`
    : `<div style="padding:20px;text-align:center;color:var(--mid-gray)">Sin visitas registradas para ${D.fmtMonth(ym)}.</div>`;
  el.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:center">
      <span style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:500">Mes:</span>${pills}
    </div>
    <div style="background:var(--cream);border-radius:8px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--mid-gray);font-weight:500;margin-bottom:4px">${D.fmtMonth(ym)}</div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:38px;font-weight:400;color:var(--charcoal);line-height:1">${monthTotal} <span style="font-size:15px;color:var(--mid-gray)">visitas registradas</span></div>
      </div>
      <button class="btn-secondary" onclick="exportMesHab('${ym}')">&#8595; Exportar este mes</button>
    </div>${tableHtml}`;
}

export function exportMesJard(ym){
  const rows=[['Seccion','Zona / Grupo','Tarea / Planta','Visitas '+D.fmtMonth(ym)]];
  D.jardineriaData.forEach(r=>{ const v=D.getMonthVisits(r,ym); if(v>0) rows.push([r.section,r.group,r.task,v]); });
  _downloadCSV(rows,'jardineria_'+ym+'.csv');
}
export function exportMesHab(ym){
  const rows=[['Habitacion','Visitas '+D.fmtMonth(ym)]];
  D.habitacionesData.forEach(r=>{ const v=D.getMonthVisits(r,ym); if(v>0) rows.push([r.hab,v]); });
  _downloadCSV(rows,'habitaciones_'+ym+'.csv');
}
export function _downloadCSV(rows, filename){
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function renderJardLog(){
  const el = document.getElementById('jard-log-body');
  if(!el) return;
  if(!D.jardineriaLog.length){
    el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--mid-gray);font-size:13px">Sin registros aún. Los registros aparecen aquí cuando alguien marca ✓ Hecho.</div>';
    return;
  }
  const sorted = [...D.jardineriaLog].reverse().slice(0,100);
  const rows = sorted.map(r=>`<tr>
    <td style="white-space:nowrap;font-size:12px">${r.fecha||''}</td>
    <td style="font-size:12px;color:var(--mid-gray)">${esc(r.section||'')}</td>
    <td style="font-size:12px">${esc(r.group||'')}</td>
    <td style="font-size:12px;font-weight:500">${esc(r.task||'')}</td>
    <td><span class="responsable-tag" style="font-size:12px">${esc(r.quien||'—')}</span></td>
    <td style="font-size:12px;color:var(--mid-gray)">${esc(r.obs||'—')}</td>
  </tr>`).join('');
  el.innerHTML = `<div class="table-wrapper"><table class="ctrl-table"><thead><tr>
    <th>Fecha</th><th>Sección</th><th>Zona</th><th>Tarea</th><th>Responsable</th><th>Observaciones</th>
  </tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function renderHabLog(){
  const el = document.getElementById('hab-log-body');
  if(!el) return;
  if(!D.habitacionesLog.length){
    el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--mid-gray);font-size:13px">Sin registros aún. Los registros aparecen aquí cuando alguien marca ✓ Ingresé.</div>';
    return;
  }
  const sorted = [...D.habitacionesLog].reverse().slice(0,100);
  const rows = sorted.map(r=>`<tr>
    <td style="white-space:nowrap;font-size:12px">${r.fecha||''}</td>
    <td><span class="hab-num">Hab. ${esc(r.hab||'')}</span></td>
    <td><span class="responsable-tag" style="font-size:12px">${esc(r.quien||'—')}</span></td>
    <td style="font-size:12px;color:var(--mid-gray)">${esc(r.obs||'—')}</td>
  </tr>`).join('');
  el.innerHTML = `<div class="table-wrapper"><table class="ctrl-table"><thead><tr>
    <th>Fecha</th><th>Habitación</th><th>Responsable</th><th>Observaciones</th>
  </tr></thead><tbody>${rows}</tbody></table></div>`;
}