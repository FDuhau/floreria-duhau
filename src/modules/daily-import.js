// ════════════════════════════════════════════════════════════
//  Importar eventos desde el "Daily Report" (DDR - Florist) — parte pura
//  Extraída de app.js: interpreta las líneas ya leídas del PDF y arma los
//  eventos de la app. No toca el DOM ni el estado (tests/daily-import.test.mjs).
//  La lectura del PDF con pdf.js (_evExtractPages) sigue en app.js.
// ════════════════════════════════════════════════════════════

export const _EV_MESES = {enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12};
export function _evStripAcc(s){return String(s||'').toLowerCase().replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i').replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u').replace(/ñ/g,'n');}

export function _evBannerDate(txt){
  const m = _evStripAcc(txt).match(/fecha del evento\s+\w+,\s*([a-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if(!m) return '';
  const mm = _EV_MESES[m[1]]; if(!mm) return '';
  return `${m[3]}-${String(mm).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}`;
}
export function _evValRightOf(lines, label){
  for(const ln of lines){
    const idx = ln.cells.findIndex(c=>c.str.replace(/\s+/g,' ').startsWith(label));
    if(idx>=0 && ln.cells[idx+1]) return ln.cells[idx+1].str;
  }
  return '';
}
export function _evFirst(lines, re){ for(const ln of lines){ const m = ln.text.match(re); if(m) return m[1].trim(); } return ''; }

// "2 arreglos altos para buffet + 4 bochitas mesas cocktail + 4 bochitas para
// livings" (+ Tonos "Follaje") → ["2 arreglos altos para buffet con follaje",
// "8 bochitas con follaje"]: separa por +, suma los del mismo tipo (descartando
// el lugar) y aclara el material (con flores / con follaje) en todos los ítems.
export function _evTransformArreglo(desc, tono){
  const material = /follaje/i.test(tono||'') ? 'con follaje' : (tono ? 'con flores' : '');
  const parts = String(desc||'').split('+').map(s=>s.trim()).filter(Boolean);
  const LOC = /\b(para|del|de|en|mesas?|sobre)\b/i;
  const items = parts.map(p=>{
    const m = p.match(/^(\d+)\s+(.*)$/);
    const qty = m?+m[1]:1, rest = (m?m[2]:p).trim();
    const i = rest.search(LOC);
    let base = (i>=0?rest.slice(0,i):rest).trim().toLowerCase();
    if(!base) base = rest.toLowerCase();
    return {qty, rest, base};
  });
  const groups=[]; const by={};
  items.forEach(it=>{ if(by[it.base]==null){by[it.base]=groups.length;groups.push({base:it.base,qty:0,items:[]});} const g=groups[by[it.base]]; g.qty+=it.qty; g.items.push(it); });
  return groups.map(g=>{
    const text = g.items.length===1 ? `${g.items[0].qty} ${g.items[0].rest}` : `${g.qty} ${g.base}`;
    return material ? `${text} ${material}` : text;
  });
}

export const _EV_DAY_RE = /^(lun|mar|mi[eé]|jue|vie|s[áa]b|dom)/i;

// Divide el documento en bloques por el banner "Fecha del Evento …" y extrae
// los campos de cada evento por rótulo.
export function _evParseEvents(pages){
  const all = pages.flat();
  const blocks=[]; let cur=null;
  for(const ln of all){
    if(/fecha del evento\s+\w+,/i.test(_evStripAcc(ln.text))){ cur={date:_evBannerDate(ln.text), lines:[]}; blocks.push(cur); }
    else if(cur) cur.lines.push(ln);
  }
  return blocks.map(b=>{
    const L=b.lines;
    // Mapeo según el DDR: el NOMBRE del evento es la "Reserva" (ej. "AEXPI 2026"),
    // el "tipo de evento" es el campo "Evento :" (ej. "Acreditacion, stands...") y
    // el organizador es "Contacto en la Propiedad" (ej. "ULLA GUEDES").
    const reserva= _evValRightOf(L,'Reserva:');
    const tipoEvento = _evValRightOf(L,'Evento :') || _evValRightOf(L,'Evento:');
    const nombre = reserva || tipoEvento;
    const salon  = _evValRightOf(L,'Ubicacion');
    const ordenId= _evValRightOf(L,'Numero Orden');
    const sm     = _evValRightOf(L,'SM:');
    const contacto = _evValRightOf(L,'Contacto en');
    const catering = _evValRightOf(L,'Catering-');
    const pax  = _evFirst(L,/Cantidad de pax:\s*(\d+)/i);
    const tono = _evFirst(L,/Tonos de las flores:\s*(.+)/i);
    const armadoEvento = _evFirst(L,/Armado del evento:\s*(.+)/i);
    const listos = _evFirst(L,/Arreglos listos a las:\s*(.+)/i);
    let horaIni='', horaFin='';
    for(const ln of L){ if(_EV_DAY_RE.test(_evStripAcc(ln.cells[0]?.str||''))){ const hs=ln.cells.filter(c=>/^\d{1,2}:\d{2}$/.test(c.str)); horaIni=hs[0]?.str||''; horaFin=hs[1]?.str||''; break; } }
    let precio=''; for(const ln of L){ const c=ln.cells.find(c=>/^\d{1,3}(\.\d{3})*,\d{2}$/.test(c.str)); if(c){precio=c.str;break;} }
    // "Tipo de arreglo": el texto está en la(s) línea(s) siguientes al rótulo.
    let arregloRaw=''; const STOP=/^(Tonos de las flores:|Armado del evento:|Arreglos listos a las:|Cantidad de pax:|Precio|Diversos|Tipo EO)/i;
    const ti = L.findIndex(ln=>/^Tipo de arreglo:/i.test(ln.text));
    if(ti>=0){ const buf=[]; for(let k=ti+1;k<L.length;k++){ if(STOP.test(L[k].text)) break; buf.push(L[k].text); } arregloRaw=buf.join(' ').trim(); }
    const arreglos = arregloRaw ? _evTransformArreglo(arregloRaw, tono) : [];
    // Notas libres del bloque de servicio (texto suelto a x≈199 que no es rótulo).
    const KNOWN=/^(Tipo de arreglo:|Tonos de las flores:|Armado del evento:|Arreglos listos a las:|Cantidad de pax:|Flores$|Diversos|Todo$|Descripcion|Hora del)/i;
    const notaParts=[];
    for(const ln of L){ const c0=ln.cells[0]; if(c0 && c0.x>=190 && c0.x<=212 && !KNOWN.test(ln.text) && ln.text!==arregloRaw) notaParts.push(ln.text); }
    const notaLibre = notaParts.join(' ').trim();
    return {date:b.date, nombre, tipoEvento, salon, ordenId, reserva, sm, contacto, catering, pax, tono, armadoEvento, listos, horaIni, horaFin, precio, arreglos, notaLibre};
  }).filter(e=>e.ordenId || e.nombre);
}

// Arma el texto de notas del evento a partir de lo detectado.
export function _evComposeNotas(e){
  const L=[];
  if(e.arreglos.length) L.push('Arreglos:\n'+e.arreglos.map(a=>'- '+a).join('\n'));
  if(e.notaLibre) L.push(e.notaLibre);
  if(e.tono) L.push('Tono: '+e.tono);
  const arm=[]; if(e.armadoEvento) arm.push('Armado: '+e.armadoEvento); if(e.listos) arm.push('Listos: '+e.listos);
  if(arm.length) L.push(arm.join(' · '));
  if(e.horaIni||e.horaFin) L.push('Horario: '+(e.horaIni||'?')+(e.horaFin?'–'+e.horaFin:''));
  // El "Contacto en la Propiedad" ya va como Organizador del evento; en notas solo SM y Catering.
  const cont=[]; if(e.sm) cont.push('SM: '+e.sm); if(e.catering) cont.push('Catering: '+e.catering);
  if(cont.length) L.push(cont.join(' · '));
  if(e.ordenId) L.push('Nº Orden: '+e.ordenId);
  return L.join('\n');
}
// Firma de los datos descriptivos, para detectar si un daily posterior cambió algo.
export function _evSig(o){ return [o.fecha,o.nombre,o.tipoEvento||'',o.salon,o.hora,o.pax,String(o.precio||''),o.notas].join('¦'); }

// Convierte un evento parseado al objeto de la app (sin pisar workflow existente).
export function _evToEvento(e){
  return {
    nombre: e.nombre || 'Evento sin nombre',
    tipoEvento: e.tipoEvento || '',
    ordenId: e.ordenId || '',
    tipo: 'Evento',
    fecha: e.date || '',
    hora: e.horaIni || '',
    horaFin: e.horaFin || '',
    salon: e.salon || '',
    zonas: [],
    pax: +e.pax || 0,
    precio: e.precio || 'A confirmar',
    notas: _evComposeNotas(e),
    organizador: e.contacto || '',
    estado: 'Pedidos Pendientes',
    arreglos: [],
    importadoDaily: true
  };
}
