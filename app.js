// Ixchel, Frutas del Soconusco: carga, guía de embarque con camión y mapa, calendario de cosecha,
// ficha técnica, agenda de llamadas, cupón a WhatsApp y entradas al hacer scroll.
// El mismo archivo sirve la página en español (/) y en inglés (/en/): el idioma sale de <html lang>.

// ---------- datos que cambia el dueño ----------

// Números de WhatsApp con lada de país (52) y sin espacios. El primero recibe los mensajes de los botones.
const WHATSAPP = ['529622699611', '529621707553'];

// Dirección del script de Google que guarda las citas en tu Google Calendar (ver agenda/LEEME.md).
// Mientras esté vacía, la agenda funciona igual pero la cita se pide por WhatsApp.
const AGENDA_URL = 'https://script.google.com/macros/s/AKfycbztSLxlmv_WAln5U7EQABAqDwkOVE1SdVj75fD98BIzX7AyP5DPxHDgXbqXqsDtnGyC/exec';

// Horario de atención en hora de Chiapas: primera y última hora en que puede empezar una cita.
const AGENDA = { desde: 7, hasta: 18.5, minutos: 30, dias: 14, anticipacion: 60 };

// Precio de referencia por kilo en pesos. Mientras sea null, la guía no muestra precio.
const PRECIO_KG = null;

// Distancias aproximadas por carretera desde Tuxtla Chico, Chiapas, y coordenadas reales para el mapa.
const ORIGEN = { lon: -92.17, lat: 14.94 };
const CIUDADES = [
  { id: 'mty', nombre: 'Monterrey, N.L.', corta: 'Monterrey', km: 1900, lon: -100.31, lat: 25.67 },
  { id: 'saltillo', nombre: 'Saltillo, Coah.', corta: 'Saltillo', km: 1980, lon: -101.0, lat: 25.42 },
  { id: 'reynosa', nombre: 'Reynosa, Tamps.', corta: 'Reynosa', km: 1850, lon: -98.28, lat: 26.08 },
  { id: 'laredo', nombre: 'Nuevo Laredo, Tamps.', corta: 'Nuevo Laredo', km: 2120, lon: -99.51, lat: 27.48 },
  { id: 'torreon', nombre: 'Torreón, Coah.', corta: 'Torreón', km: 2150, lon: -103.41, lat: 25.54 },
  { id: 'chihuahua', nombre: 'Chihuahua, Chih.', corta: 'Chihuahua', km: 2600, lon: -106.09, lat: 28.63 },
  { id: 'juarez', nombre: 'Ciudad Juárez, Chih.', corta: 'Ciudad Juárez', km: 2950, lon: -106.42, lat: 31.69 },
  { id: 'hermosillo', nombre: 'Hermosillo, Son.', corta: 'Hermosillo', km: 3050, lon: -110.96, lat: 29.07 },
  { id: 'culiacan', nombre: 'Culiacán, Sin.', corta: 'Culiacán', km: 2400, lon: -107.39, lat: 24.8 },
  { id: 'mexicali', nombre: 'Mexicali, B.C.', corta: 'Mexicali', km: 3750, lon: -115.45, lat: 32.62 },
  { id: 'tijuana', nombre: 'Tijuana, B.C.', corta: 'Tijuana', km: 3900, lon: -117.04, lat: 32.51 },
  { id: 'slp', nombre: 'San Luis Potosí, S.L.P.', corta: 'San Luis Potosí', km: 1560, lon: -100.98, lat: 22.15 },
  { id: 'gdl', nombre: 'Guadalajara, Jal.', corta: 'Guadalajara', km: 1650, lon: -103.35, lat: 20.67 },
  { id: 'leon', nombre: 'León, Gto.', corta: 'León', km: 1530, lon: -101.68, lat: 21.12 },
  { id: 'qro', nombre: 'Querétaro, Qro.', corta: 'Querétaro', km: 1350, lon: -100.39, lat: 20.59 },
  { id: 'cdmx', nombre: { es: 'Ciudad de México', en: 'Mexico City' }, corta: { es: 'CDMX', en: 'Mexico City' }, km: 1150, lon: -99.13, lat: 19.43 },
  { id: 'puebla', nombre: 'Puebla, Pue.', corta: 'Puebla', km: 1030, lon: -98.2, lat: 19.04 },
  { id: 'veracruz', nombre: 'Veracruz, Ver.', corta: 'Veracruz', km: 850, lon: -96.13, lat: 19.17 },
  { id: 'merida', nombre: 'Mérida, Yuc.', corta: 'Mérida', km: 1250, lon: -89.62, lat: 20.97 },
];

// Meses de cosecha (1 = enero) y meses de pico.
const COSECHA = { meses: [7, 8, 9, 10], pico: [8, 9] };

const KG_POR_CAJA = 10;
const KM_POR_HORA = 55; // promedio de un camión con paradas
const MIN_T = 1;
const MAX_T = 60;

// ---------- textos en los dos idiomas ----------
const LANG = document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'es';
const TEXTOS = {
  es: {
    locale: 'es-MX',
    unidades: {
      t: { etiqueta: 'Toneladas por pedido', nombre: ['tonelada', 'toneladas'] },
      kg: { etiqueta: 'Kilos por pedido', nombre: ['kilo', 'kilos'] },
      cajas: { etiqueta: `Cajas de ${KG_POR_CAJA} kg por pedido`, nombre: ['caja', 'cajas'] },
    },
    vehiculo: { camioneta: 'camioneta de 3.5 t', torton: 'torton', trailer: ['tráiler de 53 pies', 'tráileres de 53 pies'] },
    camionVarios: (t, n, cap) => `${t} toneladas en ${n} tráileres de ${cap} t`,
    camionUno: (t, cap, veh) => `${t} de ${cap} toneladas en un ${veh}`,
    cajas: (n) => `${n} cajas`,
    unidadesN: (n) => (n === 1 ? '1 unidad' : `${n} unidades`),
    dias: (d) => `en ${d} a ${d + 1} días`,
    precio: (v) => `${v} aprox.`,
    guia: (d, t, extra) => `Hola, quiero cotizar rambután para recoger en la huerta y llevar a ${d.nombre}: ${t} ${d.t === 1 ? 'tonelada' : 'toneladas'}${extra}, ${d.cajasTxt} cajas de ${KG_POR_CAJA} kg. ¿Qué precio por kilo tienen esta semana y cuándo podrían cortar?`,
    mensajes: {
      hero: 'Hola, me interesa comprar rambután por tonelada. ¿Me pueden mandar el precio de esta semana?',
      carta: 'Hola, vi su sitio y me interesa comprar rambután de Tuxtla Chico. ¿Me pueden dar informes?',
      fruta: (f) => `Hola, me interesa el ${f.toLowerCase()}. ¿Qué disponibilidad y precio tienen?`,
      precio: 'Hola, ¿me pueden pasar el precio por kilo de esta semana para un pedido mayorista de rambután?',
      faq: 'Hola, tengo una pregunta sobre su rambután:',
      ficha: 'Hola, revisé su ficha técnica y quiero cotizar rambután. ¿Qué calibres tienen esta semana?',
      flotante: 'Hola, vi su sitio de rambután y quiero información.',
    },
    fruta: {
      rojo: ['Rambután rojo', 'El que más pide el mercado: cáscara roja intensa y pulpa blanca, jugosa y dulce.'],
      amarillo: ['Rambután amarillo', 'Cáscara dorada, igual de dulce y más escaso. Destaca en el anaquel de cualquier frutería.'],
      calibre: ['Por calibre', 'Cada caja va pareja: grande para exhibir, mediano para venta por kilo y chico para pulpa.'],
    },
    cupon: {
      inicio: 'Hola, quiero una cotización de rambután.',
      nombre: 'Nombre y empresa', ciudad: 'Ciudad de destino', ton: 'Toneladas por semana', tel: 'Teléfono',
      calibre: 'Calibre', frecuencia: 'Frecuencia',
    },
    meses: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    cosecha: {
      pico: (m) => `Estamos en ${m}, pico de cosecha: hay fruta para pedidos grandes.`,
      temporada: (m) => `Estamos en ${m}, en temporada: hay fruta, pregunta por volumen.`,
      antes: (m, inicio) => `Estamos en ${m}. La cosecha empieza en ${inicio}: aparta tu fruta desde ahora.`,
      despues: (m, inicio) => `Estamos en ${m}. La temporada terminó; la siguiente empieza en ${inicio}. Aparta tu programa.`,
    },
    agenda: {
      tipos: { llamada: 'llamada', whatsapp: 'mensaje por WhatsApp', video: 'videollamada' },
      dia: (d) => d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }),
      semana: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
      hoy: 'hoy',
      lleno: 'lleno',
      libres: (n) => (n === 1 ? '1 libre' : `${n} libres`),
      franjas: ['Mañana', 'Tarde', 'Noche'],
      elegir: 'Elige un día y una hora.',
      elegido: (tipo, dia, hora) => `${tipo[0].toUpperCase() + tipo.slice(1)} el ${dia} a las ${hora} (hora de Chiapas).`,
      faltan: 'Escribe tu nombre y tu teléfono, y elige día y hora.',
      cargando: 'Revisando horarios libres…',
      enVivo: 'Horarios libres en este momento.',
      sinConexion: 'No pudimos revisar los horarios. Tu cita se pedirá por WhatsApp.',
      ocupada: 'Esa hora se acaba de ocupar. Elige otra, por favor.',
      apartando: 'Apartando…',
      apartar: 'Apartar cita',
      listoTitulo: 'Cita apartada',
      listoTexto: (t) => `${t} Te confirmamos por WhatsApp.`,
      pedidaTitulo: 'Cita solicitada',
      pedidaTexto: (t) => `${t} Abrimos WhatsApp con tu solicitud; envíala y te confirmamos.`,
      sello: ['APARTADO', 'SOLICITADO'],
      mensaje: (c) => [
        `Hola, quiero agendar una ${c.tipo} para cotizar rambután.`,
        `Día: ${c.dia}, ${c.hora} (hora de Chiapas)`,
        `Nombre: ${c.nombre}`,
        `Teléfono: ${c.telefono}`,
        c.empresa && `Empresa y ciudad: ${c.empresa}`,
        c.notas && `Notas: ${c.notas}`,
      ].filter(Boolean).join('\n'),
      ics: (c) => `Cita con Ixchel, Frutas del Soconusco (${c.tipo})`,
    },
  },
  en: {
    locale: 'en-US',
    unidades: {
      t: { etiqueta: 'Metric tons per order', nombre: ['ton', 'tons'] },
      kg: { etiqueta: 'Kilograms per order', nombre: ['kg', 'kg'] },
      cajas: { etiqueta: `${KG_POR_CAJA} kg boxes per order`, nombre: ['box', 'boxes'] },
    },
    vehiculo: { camioneta: '3.5-ton pickup truck', torton: 'straight truck', trailer: ['53-foot trailer', '53-foot trailers'] },
    camionVarios: (t, n, cap) => `${t} tons in ${n} trailers of ${cap} t`,
    camionUno: (t, cap, veh) => `${t} of ${cap} tons in a ${veh}`,
    cajas: (n) => `${n} boxes`,
    unidadesN: (n) => (n === 1 ? '1 unit' : `${n} units`),
    dias: (d) => `in ${d} to ${d + 1} days`,
    precio: (v) => `about ${v}`,
    guia: (d, t, extra) => `Hello, I would like a quote for rambutan picked up at your orchard and taken to ${d.nombre}: ${t} metric ${d.t === 1 ? 'ton' : 'tons'}${extra}, ${d.cajasTxt} boxes of ${KG_POR_CAJA} kg. What is this week's price per kilo, and when could you harvest?`,
    mensajes: {
      hero: 'Hello, I am interested in buying rambutan by the ton. Could you send me this week\'s price?',
      carta: 'Hello, I saw your website and I am interested in rambutan from Tuxtla Chico. Could you send me more information?',
      fruta: (f) => `Hello, I am interested in ${f.toLowerCase()}. What availability and price do you have?`,
      precio: 'Hello, could you send me this week\'s price per kilo for a wholesale rambutan order?',
      faq: 'Hello, I have a question about your rambutan:',
      ficha: 'Hello, I read your spec sheet and would like a quote. Which sizes do you have this week?',
      flotante: 'Hello, I saw your rambutan website and would like more information.',
    },
    fruta: {
      rojo: ['Red rambutan', 'The one the market asks for most: deep red skin and white flesh, juicy and sweet.'],
      amarillo: ['Yellow rambutan', 'Golden skin, just as sweet and harder to find. It stands out on any produce shelf.'],
      calibre: ['Sorted by size', 'Every box is uniform: large for display, medium for sale by weight and small for pulp.'],
    },
    cupon: {
      inicio: 'Hello, I would like a rambutan quote.',
      nombre: 'Name and company', ciudad: 'Destination city', ton: 'Tons per week', tel: 'Phone',
      calibre: 'Size', frecuencia: 'Frequency',
    },
    meses: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    cosecha: {
      pico: (m) => `It is ${m}, peak harvest: there is fruit for large orders.`,
      temporada: (m) => `It is ${m}, in season: fruit is available, ask about volume.`,
      antes: (m, inicio) => `It is ${m}. Harvest starts in ${inicio}: reserve your fruit now.`,
      despues: (m, inicio) => `It is ${m}. The season is over; the next one starts in ${inicio}. Reserve your program.`,
    },
    agenda: {
      tipos: { llamada: 'phone call', whatsapp: 'WhatsApp chat', video: 'video call' },
      dia: (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }),
      semana: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      hoy: 'today',
      lleno: 'full',
      libres: (n) => `${n} open`,
      franjas: ['Morning', 'Afternoon', 'Evening'],
      elegir: 'Choose a day and a time.',
      elegido: (tipo, dia, hora) => `${tipo[0].toUpperCase() + tipo.slice(1)} on ${dia} at ${hora} (Chiapas time).`,
      faltan: 'Enter your name and phone, and choose a day and time.',
      cargando: 'Checking open times…',
      enVivo: 'Open times right now.',
      sinConexion: 'We could not check open times. Your appointment will be requested by WhatsApp.',
      ocupada: 'That time was just taken. Please choose another one.',
      apartando: 'Booking…',
      apartar: 'Book appointment',
      listoTitulo: 'You are booked',
      listoTexto: (t) => `${t} We will confirm on WhatsApp.`,
      pedidaTitulo: 'Request sent',
      pedidaTexto: (t) => `${t} We opened WhatsApp with your request; send it and we will confirm.`,
      sello: ['BOOKED', 'REQUESTED'],
      mensaje: (c) => [
        `Hello, I would like to book a ${c.tipo} to get a rambutan quote.`,
        `Day: ${c.dia}, ${c.hora} (Chiapas time)`,
        `Name: ${c.nombre}`,
        `Phone: ${c.telefono}`,
        c.empresa && `Company and city: ${c.empresa}`,
        c.notas && `Notes: ${c.notas}`,
      ].filter(Boolean).join('\n'),
      ics: (c) => `Meeting with Ixchel, Soconusco Fruit (${c.tipo})`,
    },
  },
};
const T = TEXTOS[LANG];
const local = (v) => (typeof v === 'object' ? v[LANG] : v);

const UNIDADES = {
  t: { porTon: 1, paso: 1 },
  kg: { porTon: 1000, paso: 500 },
  cajas: { porTon: 1000 / KG_POR_CAJA, paso: 50 },
};

const fmt = new Intl.NumberFormat(T.locale, { maximumFractionDigits: 1 });
const pesos = new Intl.NumberFormat(T.locale, { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVG = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}) => { const n = document.createElementNS(SVG, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
const html = (tag, attrs = {}, text) => { const n = document.createElement(tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (text !== undefined) n.textContent = text; return n; };

function waLink(text, numero = WHATSAPP[0]) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(text)}`;
}

// Un enlace real abre WhatsApp en otra pestaña (o la app en el celular) sin que lo bloqueen.
function openWhatsApp(text) {
  const a = document.createElement('a');
  a.href = waLink(text);
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.append(a);
  a.click();
  a.remove();
}

// Chiapas está todo el año en UTC−6 (sin horario de verano). Las fechas de la agenda se manejan
// como "hora de Chiapas" guardada en los campos UTC de un Date, para no depender del reloj del visitante.
const OFFSET_CHIAPAS = -6;
const ahoraChiapas = () => new Date(Date.now() + OFFSET_CHIAPAS * 3600e3);

// ---------- animación de carga: corre una vez por visita y nunca tapa más de tres segundos ----------
(() => {
  const loader = $('#loader');
  if (!loader) return;
  let seen = false;
  try { seen = sessionStorage.getItem('ixchel-carga') === '1'; sessionStorage.setItem('ixchel-carga', '1'); } catch { /* sin almacenamiento */ }
  if (seen || reduced) { document.documentElement.classList.add('is-seen'); loader.remove(); return; }
  const hairs = $('[data-hairs]', loader);
  const n = 44;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r0 = 56, r1 = 82 + (i % 3) * 6;
    const x0 = 100 + Math.cos(a) * r0, y0 = 100 + Math.sin(a) * r0;
    const cx = 100 + Math.cos(a + 0.25) * (r0 + 18), cy = 100 + Math.sin(a + 0.25) * (r0 + 18);
    const x1 = 100 + Math.cos(a + 0.35) * r1, y1 = 100 + Math.sin(a + 0.35) * r1;
    const path = el('path', { d: `M${x0.toFixed(1)} ${y0.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`, pathLength: 1 });
    path.style.setProperty('--d', String(Math.round((i / n) * 700)));
    hairs.append(path);
  }
  const done = () => {
    if (loader.classList.contains('is-done')) return;
    loader.classList.add('is-done');
    setTimeout(() => loader.remove(), 700);
  };
  setTimeout(done, 2500);
  loader.addEventListener('click', done);
  window.addEventListener('keydown', done, { once: true });
})();

// ---------- guía de embarque: unidades, camión que se llena y mapa de la ruta ----------
const guia = (() => {
  const select = $('#ciudad');
  const input = $('#toneladas');
  const slip = $('.slip');
  if (!select || !input || !slip) return null;

  CIUDADES.forEach((c, i) => select.add(new Option(local(c.nombre), String(i))));
  select.value = '0';

  const out = (key, value) => $$(`[data-out="${key}"]`).forEach((n) => { n.textContent = value; });
  let unidad = 't';
  const U = () => UNIDADES[unidad];
  const label = $('[data-unit-label]');

  const limitar = (v) => {
    const u = U();
    const min = MIN_T * u.porTon, max = MAX_T * u.porTon;
    const n = Math.round(Number(v) / u.paso) * u.paso;
    return Number.isFinite(n) && v !== '' ? Math.min(max, Math.max(min, n)) : min;
  };
  const toneladas = () => limitar(input.value) / U().porTon;

  function vehiculo(t) {
    if (t <= 3) return { nombre: T.vehiculo.camioneta, cap: 3, unidades: 1 };
    if (t <= 10) return { nombre: T.vehiculo.torton, cap: 10, unidades: 1 };
    const n = Math.ceil(t / 22);
    return { nombre: T.vehiculo.trailer[n === 1 ? 0 : 1], cap: 22, unidades: n };
  }

  function datos() {
    const c = CIUDADES[Number(select.value)] || CIUDADES[0];
    const t = toneladas();
    const horas = Math.round(c.km / KM_POR_HORA);
    // corte, empaque y pre-enfriado ocupan el primer día; luego el camino
    const dias = Math.ceil((horas + 12) / 24);
    const cajas = Math.round((t * 1000) / KG_POR_CAJA);
    return { ...c, nombre: local(c.nombre), corta: local(c.corta), t, horas, dias, veh: vehiculo(t), cajas, cajasTxt: fmt.format(cajas) };
  }

  // --- el camión: una casilla por tonelada de su capacidad ---
  const truckG = $('[data-truck]');
  let truckCap = 0;
  function dibujarCamion(cap) {
    truckG.replaceChildren();
    const cols = cap <= 3 ? 3 : cap <= 10 ? 5 : 11;
    const rows = Math.ceil(cap / cols);
    const cell = 30, gap = 4;
    const boxW = cols * (cell + gap) + gap, boxH = rows * (cell + gap) + gap;
    const x0 = 10, y0 = 130 - boxH;
    const body = el('g', { class: 'truck__body' });
    body.append(el('rect', { x: x0, y: y0, width: boxW, height: boxH, fill: '#f4d96c' }));
    for (let i = 0; i < cap; i++) {
      const c = i % cols, r = rows - 1 - Math.floor(i / cols);
      const g = el('g', { class: 'truck__slot is-empty', 'data-slot': i });
      const x = x0 + gap + c * (cell + gap), y = y0 + gap + r * (cell + gap);
      g.append(el('rect', { x, y, width: cell, height: cell, fill: '#b5762c' }), el('rect', { x, y, width: cell, height: 8, fill: '#d9974a' }), el('circle', { cx: x + cell / 2, cy: y + 18, r: 6, fill: '#c8202b' }));
      body.append(g);
    }
    const cx = x0 + boxW + 6;
    body.append(
      el('path', { d: `M${cx} 70h50l34 34v26h-84z`, fill: '#9b1c23' }),
      el('path', { d: `M${cx + 12} 80h34l22 24h-56z`, fill: '#133621' }),
      el('rect', { x: x0, y: 130, width: cx + 84 - x0, height: 10, fill: '#7d151b' }),
    );
    for (const wx of [x0 + 36, x0 + boxW - 30, cx + 58]) body.append(el('circle', { cx: wx, cy: 146, r: 15, fill: '#0b2416' }), el('circle', { cx: wx, cy: 146, r: 5, fill: '#f4d96c' }));
    truckG.append(body);
    truckG.parentNode.setAttribute('viewBox', `0 ${Math.min(0, y0 - 10)} ${Math.max(520, cx + 100)} ${170 - Math.min(0, y0 - 10)}`);
    truckCap = cap;
  }
  function llenarCamion(d) {
    if (d.veh.cap !== truckCap) dibujarCamion(d.veh.cap);
    // en varios tráileres, el camión muestra la carga del último
    const enEste = d.veh.unidades > 1 ? d.t - (d.veh.unidades - 1) * 22 : d.t;
    const llenas = Math.max(1, Math.round(enEste));
    $$('[data-slot]', truckG).forEach((g, i) => {
      g.classList.toggle('is-empty', i >= llenas);
      g.style.transitionDelay = reduced ? '0ms' : `${i * 35}ms`;
    });
    const t = fmt.format(d.t);
    out('camion', d.veh.unidades > 1 ? T.camionVarios(t, d.veh.unidades, d.veh.cap) : T.camionUno(t, d.veh.cap, d.veh.nombre));
  }

  // --- el mapa: ciudades en su latitud y longitud real ---
  const mapG = $('[data-map]');
  const P = (lon, lat) => [(lon + 118) * 19 + 12, (33.5 - lat) * 19 + 12];
  const dots = [];
  let route, trail, mover, raf = 0, label2;
  // contorno simplificado de México (longitud, latitud)
  const MEXICO = [[-117.1,32.5],[-114.7,32.7],[-111,31.3],[-108.2,31.3],[-108.2,31.8],[-106.5,31.8],[-104.4,29.6],[-103,29],[-102.4,29.8],[-100.9,29.4],[-99.5,27.5],[-98.3,26.1],[-97.2,25.9],[-97.5,24],[-97.85,22.2],[-97.4,21],[-96.1,19.2],[-94.4,18.15],[-92.6,18.6],[-91.8,18.65],[-90.7,19.3],[-90.5,19.85],[-90.4,20.9],[-89.7,21.3],[-87.1,21.6],[-86.8,21.1],[-87.5,20.2],[-88.3,18.5],[-89.15,17.82],[-90.98,17.82],[-90.98,17.25],[-91.43,17.25],[-90.44,16.08],[-91.73,16.07],[-92.23,14.53],[-93.75,16.1],[-95.2,16.17],[-97.07,15.86],[-99.9,16.85],[-102.2,17.95],[-104.3,19.05],[-105.7,20.4],[-105.25,20.65],[-105.3,21.5],[-106.4,23.2],[-107.6,24.5],[-109.1,25.6],[-110.9,27.9],[-112.2,29.9],[-113.5,31.3],[-114.8,31.8],[-114.85,31],[-113.5,29],[-112.27,27.34],[-111.35,26],[-110.3,24.15],[-109.9,22.9],[-110.2,23.45],[-112,24.6],[-114.2,27.6],[-115,28],[-116.6,31.85]];
  // puntos de paso por carretera, para que la ruta siga el camino y no una línea recta
  const PASO = { ventosa: [-94.9, 16.5], coatza: [-94.4, 18.1], veracruz: [-96.13, 19.17], tampico: [-97.85, 22.2], puebla: [-98.2, 19.04], cdmx: [-99.13, 19.43], qro: [-100.39, 20.59], gdl: [-103.35, 20.67], slp: [-100.98, 22.15], torreon: [-103.41, 25.54], villa: [-92.9, 18.0], campeche: [-90.5, 19.85], hermosillo: [-110.96, 29.07], culiacan: [-107.39, 24.8], chihuahua: [-106.09, 28.63] };
  function pasos(id) {
    const base = ['ventosa', 'puebla'];
    const ruta = {
      merida: ['villa', 'campeche'],
      veracruz: ['coatza'],
      mty: ['coatza', 'veracruz', 'tampico'], saltillo: ['coatza', 'veracruz', 'tampico'], reynosa: ['coatza', 'veracruz', 'tampico'], laredo: ['coatza', 'veracruz', 'tampico'],
      puebla: ['ventosa'],
      cdmx: base,
      qro: [...base, 'cdmx'], leon: [...base, 'cdmx', 'qro'], slp: [...base, 'cdmx', 'qro'], gdl: [...base, 'cdmx', 'qro'],
      torreon: [...base, 'cdmx', 'qro', 'slp'],
      chihuahua: [...base, 'cdmx', 'qro', 'slp', 'torreon'],
      juarez: [...base, 'cdmx', 'qro', 'slp', 'torreon', 'chihuahua'],
      culiacan: [...base, 'cdmx', 'qro', 'gdl'],
      hermosillo: [...base, 'cdmx', 'qro', 'gdl', 'culiacan'],
    };
    return ruta[id] || [...base, 'cdmx', 'qro', 'gdl', 'culiacan', 'hermosillo'];
  }
  if (mapG) {
    mapG.append(el('path', { class: 'map__land', d: 'M' + MEXICO.map(([lo, la]) => P(lo, la).map((v) => v.toFixed(1)).join(' ')).join('L') + 'Z' }));
    trail = el('path', { class: 'map__trail' });
    route = el('path', { class: 'map__route' });
    mapG.append(trail, route);
    CIUDADES.forEach(({ lon, lat }) => { const [x, y] = P(lon, lat); const c = el('circle', { class: 'map__dot', cx: x, cy: y, r: 5 }); dots.push(c); mapG.append(c); });
    const [ox, oy] = P(ORIGEN.lon, ORIGEN.lat);
    mapG.append(el('circle', { class: 'map__pulse', cx: ox, cy: oy, r: 12 }), el('circle', { class: 'map__origin', cx: ox, cy: oy, r: 8 }));
    const lo = el('text', { class: 'map__label', x: ox - 14, y: oy + 34, 'text-anchor': 'end' }); lo.textContent = 'Tuxtla Chico'; mapG.append(lo);
    label2 = el('text', { class: 'map__label' }); mapG.append(label2);
    mover = el('g'); mover.append(el('rect', { x: -14, y: -9, width: 20, height: 14, fill: '#f4d96c' }), el('path', { d: 'M6 -4h6l5 5v4H6z', fill: '#c8202b' }), el('circle', { cx: -8, cy: 7, r: 3.5, fill: '#0b2416' }), el('circle', { cx: 11, cy: 7, r: 3.5, fill: '#0b2416' }));
    mapG.append(mover);
  }
  // marca la ciudad y traza el camino; devuelve el punto de salida
  function trazar(d) {
    const i = Number(select.value);
    dots.forEach((c, k) => { c.classList.toggle('is-on', k === i); c.setAttribute('r', k === i ? 9 : 5); });
    const [ox, oy] = P(ORIGEN.lon, ORIGEN.lat);
    const [tx, ty] = P(d.lon, d.lat);
    const pts = [[ox, oy], ...pasos(d.id).map((k) => P(...PASO[k])), [tx, ty]];
    const dd = 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L');
    route.setAttribute('d', dd); trail.setAttribute('d', dd);
    label2.textContent = d.corta;
    const right = tx < 420;
    label2.setAttribute('x', tx + (right ? 16 : -16)); label2.setAttribute('y', ty - 12); label2.setAttribute('text-anchor', right ? 'start' : 'end');
    return [ox, oy];
  }
  function dibujarRuta(d) {
    if (!mapG) return;
    trazar(d);
    const len = route.getTotalLength();
    cancelAnimationFrame(raf);
    if (reduced) { route.style.strokeDasharray = 'none'; const pt = route.getPointAtLength(len); mover.setAttribute('transform', `translate(${pt.x} ${pt.y})`); return; }
    route.style.strokeDasharray = `${len}`;
    const t0 = performance.now(), dur = 1600;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      route.style.strokeDashoffset = String(len * (1 - e));
      const pt = route.getPointAtLength(len * e);
      mover.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  // el mapa se anima cuando se ve, no antes
  let mapaVisto = !('IntersectionObserver' in window);
  if (mapG && !mapaVisto) {
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { mapaVisto = true; dibujarRuta(datos()); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(mapG.closest('svg'));
  }

  function pintar() {
    const d = datos();
    out('ciudad', d.nombre);
    out('ciudad-corta', d.corta);
    out('cajas', T.cajas(d.cajasTxt));
    out('vehiculo', d.veh.nombre);
    out('unidades', T.unidadesN(d.veh.unidades));
    out('km', `${fmt.format(d.km)} km`);
    out('horas', `${d.horas} h`);
    out('dias', T.dias(d.dias));
    if (PRECIO_KG) out('precio', T.precio(pesos.format(d.t * 1000 * PRECIO_KG)));
    llenarCamion(d);
    if (mapaVisto) dibujarRuta(d); else if (mapG) dibujarRutaQuieta(d);
  }
  // antes de verse, la ruta queda trazada pero oculta, sin medirla (medir fuerza un cálculo de página)
  function dibujarRutaQuieta(d) {
    if (reduced) { dibujarRuta(d); return; }
    const [ox, oy] = trazar(d);
    route.style.strokeDasharray = '0 100000';
    mover.setAttribute('transform', `translate(${ox} ${oy})`);
  }
  $$('[data-precio]').forEach((n) => { n.hidden = !PRECIO_KG; });

  function mensaje() {
    const d = datos();
    const extra = unidad === 't' ? '' : ` (${fmt.format(limitar(input.value))} ${T.unidades[unidad].nombre[1]})`;
    return T.guia(d, fmt.format(d.t), extra);
  }

  let timer;
  function cambio() {
    slip.classList.add('is-updating');
    clearTimeout(timer);
    timer = setTimeout(() => { pintar(); slip.classList.remove('is-updating'); }, 120);
  }

  function ponerUnidad(nueva) {
    const t = toneladas();
    unidad = nueva;
    const u = U();
    input.min = String(MIN_T * u.porTon); input.max = String(MAX_T * u.porTon); input.step = String(u.paso);
    input.value = String(limitar(t * u.porTon));
    if (label) label.textContent = T.unidades[unidad].etiqueta;
    cambio();
  }
  $$('input[name="unidad"]').forEach((r) => r.addEventListener('change', () => { if (r.checked) ponerUnidad(r.value); }));

  select.addEventListener('change', cambio);
  input.addEventListener('input', () => { if (input.value !== '') cambio(); });
  input.addEventListener('blur', () => { input.value = String(limitar(input.value)); cambio(); });
  $$('.calc__step').forEach((btn) => btn.addEventListener('click', () => {
    input.value = String(limitar(limitar(input.value) + Number(btn.dataset.step) * U().paso));
    cambio();
  }));

  pintar();
  return { mensaje };
})();

// ---------- pedidos por volumen: las cajas se apilan al verlas ----------
(() => {
  const list = $('[data-stack]');
  if (!list) return;
  $$('.tier__stack', list).forEach((st) => {
    const n = Number(getComputedStyle(st).getPropertyValue('--n')) * 2;
    for (let k = 0; k < n; k++) { const i = document.createElement('i'); i.style.setProperty('--k', String(k)); st.append(i); }
  });
  if (!('IntersectionObserver' in window)) { list.classList.add('is-stacked'); return; }
  const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { list.classList.add('is-stacked'); io.disconnect(); } }, { threshold: 0.25 });
  io.observe(list);
  window.addEventListener('load', () => setTimeout(() => list.classList.add('is-stacked'), 4000));
})();

// ---------- botones de WhatsApp ----------
const MENSAJES = {
  ...T.mensajes,
  fruta: () => T.mensajes.fruta($('#t-fruta')?.textContent || T.fruta.rojo[0]),
  guia: () => (guia ? guia.mensaje() : T.mensajes.hero),
};

$$('[data-wa]').forEach((a) => {
  const preparar = () => {
    const m = MENSAJES[a.dataset.wa];
    const text = typeof m === 'function' ? m() : m;
    if (!text) return; // sin mensaje, el enlace baja al cupón
    // el enlace se vuelve el de WhatsApp justo al tocarlo, con el mensaje del momento
    a.href = waLink(text, a.dataset.numero || WHATSAPP[0]);
    a.target = '_blank';
    a.rel = 'noopener';
  };
  a.addEventListener('click', preparar);
  // los enlaces fijos (botón flotante y contacto) ya llevan su destino desde el inicio
  if (a.hasAttribute('data-fijo')) preparar();
});

// ---------- pestañas de la fruta ----------
(() => {
  const plate = $('.plate');
  const tabs = $$('.tabs [role="tab"]');
  if (!plate || !tabs.length) return;
  const panel = $('#panel-fruta');
  const title = $('#t-fruta');
  const text = $('[data-copy]', panel);

  function select(tab, focus) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    const key = tab.dataset.tab;
    plate.dataset.variant = key;
    panel.setAttribute('aria-labelledby', tab.id);
    [title.textContent, text.textContent] = T.fruta[key];
    if (focus) tab.focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (e) => {
      const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select(tabs[(next + tabs.length) % tabs.length], true);
    });
  });
})();

// ---------- calendario de cosecha: marca el mes de hoy y dice qué hay ----------
(() => {
  const bar = $('[data-cosecha]');
  if (!bar) return;
  const mes = ahoraChiapas().getUTCMonth() + 1;
  $$('[data-mes]', bar).forEach((li) => {
    const m = Number(li.dataset.mes);
    li.style.setProperty('--m', String(m));
    li.classList.toggle('is-season', COSECHA.meses.includes(m));
    li.classList.toggle('is-peak', COSECHA.pico.includes(m));
    if (m === mes) { li.classList.add('is-now'); li.setAttribute('aria-current', 'date'); }
  });
  const nombre = T.meses[mes - 1];
  const inicio = T.meses[COSECHA.meses[0] - 1];
  const estado = COSECHA.pico.includes(mes) ? T.cosecha.pico(nombre)
    : COSECHA.meses.includes(mes) ? T.cosecha.temporada(nombre)
    : mes < COSECHA.meses[0] ? T.cosecha.antes(nombre, inicio)
    : T.cosecha.despues(nombre, inicio);
  $$('[data-cosecha-hoy]').forEach((n) => { n.textContent = estado; });
})();

// ---------- ficha técnica: se imprime o se guarda en PDF sola ----------
$$('[data-imprimir]').forEach((btn) => btn.addEventListener('click', () => {
  document.documentElement.classList.add('is-printing');
  const fin = () => { document.documentElement.classList.remove('is-printing'); window.removeEventListener('afterprint', fin); };
  window.addEventListener('afterprint', fin);
  window.print();
  setTimeout(fin, 1000);
}));

// ---------- agenda de llamadas: días y horas libres, cita en Google Calendar o por WhatsApp ----------
(() => {
  const form = $('#agenda-form');
  if (!form) return;
  const diasBox = $('[data-days]', form);
  const horasBox = $('[data-slots]', form);
  const pick = $('[data-pick]', form);
  const estado = $('[data-agenda-estado]');
  const error = $('#agenda-error');
  const enviar = $('.agenda__submit', form);
  const done = $('.agenda__done', form);
  const A = T.agenda;
  const ocupados = new Set();
  let dia = null, hora = null;

  const dos = (n) => String(n).padStart(2, '0');
  const clave = (d, minutos) => `${d.getUTCFullYear()}-${dos(d.getUTCMonth() + 1)}-${dos(d.getUTCDate())}T${dos(Math.floor(minutos / 60))}:${dos(minutos % 60)}`;
  const horaTxt = (minutos) => {
    const h = Math.floor(minutos / 60), m = dos(minutos % 60);
    if (LANG === 'en') return `${((h + 11) % 12) + 1}:${m} ${h < 12 ? 'a.m.' : 'p.m.'}`;
    return `${h}:${m}`;
  };
  const tipo = () => A.tipos[$('input[name="tipo"]:checked', form)?.value || 'llamada'];

  // días que se muestran: desde hoy, en hora de Chiapas
  const hoy = ahoraChiapas();
  const base = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  const dias = Array.from({ length: AGENDA.dias }, (_, i) => new Date(base.getTime() + i * 864e5));
  const horasDelDia = [];
  for (let m = AGENDA.desde * 60; m <= AGENDA.hasta * 60; m += AGENDA.minutos) horasDelDia.push(m);

  const pasada = (d, m) => d.getTime() + m * 60e3 < ahoraChiapas().getTime() + AGENDA.anticipacion * 60e3;
  const libres = (d) => horasDelDia.filter((m) => !pasada(d, m) && !ocupados.has(clave(d, m)));

  function pintarDias() {
    diasBox.replaceChildren();
    // columnas de lunes a domingo: el primer día se acomoda en su columna
    A.semana.forEach((s) => diasBox.append(html('span', { class: 'agenda__wd', 'aria-hidden': 'true' }, s)));
    const lunes = (dias[0].getUTCDay() + 6) % 7;
    for (let i = 0; i < lunes; i++) diasBox.append(html('span', { 'aria-hidden': 'true' }));
    dias.forEach((d, i) => {
      const n = libres(d).length;
      const b = html('button', { type: 'button', class: 'agenda__day', 'data-dia': String(i), 'aria-pressed': String(dia === i) });
      b.style.setProperty('--libre', String(n / horasDelDia.length));
      b.append(html('b', {}, String(d.getUTCDate())), html('small', {}, i === 0 ? A.hoy : n ? A.libres(n) : A.lleno));
      b.setAttribute('aria-label', `${A.dia(d)}: ${n ? A.libres(n) : A.lleno}`);
      if (i === 0) b.classList.add('is-today');
      if (!n) { b.disabled = true; b.classList.add('is-full'); }
      b.addEventListener('click', () => { dia = i; hora = null; pintarDias(); pintarHoras(); resumen(); });
      diasBox.append(b);
    });
  }

  function pintarHoras() {
    horasBox.replaceChildren();
    if (dia === null) return;
    const d = dias[dia];
    const franjas = [[0, 12 * 60], [12 * 60, 19 * 60], [19 * 60, 24 * 60]];
    franjas.forEach(([a, b], k) => {
      const lista = horasDelDia.filter((m) => m >= a && m < b);
      if (!lista.length) return;
      const g = html('div', { class: 'agenda__band', role: 'group', 'aria-label': A.franjas[k] });
      g.append(html('p', { class: 'agenda__band-name' }, A.franjas[k]));
      const grid = html('div', { class: 'agenda__times' });
      lista.forEach((m) => {
        const ocupado = pasada(d, m) || ocupados.has(clave(d, m));
        const b = html('button', { type: 'button', class: 'agenda__time', 'aria-pressed': String(hora === m) }, horaTxt(m));
        if (ocupado) { b.disabled = true; b.classList.add('is-busy'); }
        b.style.setProperty('--k', String(grid.childElementCount));
        b.addEventListener('click', () => { hora = m; $$('.agenda__time', horasBox).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); resumen(); });
        grid.append(b);
      });
      g.append(grid);
      horasBox.append(g);
    });
  }

  function resumen() {
    pick.textContent = dia !== null && hora !== null ? A.elegido(tipo(), A.dia(dias[dia]), horaTxt(hora)) : A.elegir;
    pick.classList.toggle('is-set', dia !== null && hora !== null);
    if (dia !== null && hora !== null && error && !error.hidden) validar(false);
  }
  $$('input[name="tipo"]', form).forEach((r) => r.addEventListener('change', resumen));

  // horarios ocupados desde Google Calendar, si el script está conectado
  async function cargar() {
    if (!AGENDA_URL) return;
    if (estado) estado.textContent = A.cargando;
    try {
      const desde = clave(dias[0], 0).slice(0, 10);
      const r = await fetch(`${AGENDA_URL}?desde=${desde}&dias=${AGENDA.dias}`);
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'agenda');
      ocupados.clear();
      j.ocupados.forEach((k) => ocupados.add(k));
      if (estado) estado.textContent = A.enVivo;
    } catch {
      if (estado) estado.textContent = A.sinConexion;
    }
    pintarDias(); pintarHoras(); resumen();
  }

  const campos = { nombre: $('#a-nombre'), telefono: $('#a-tel') };
  function validar(enfocar) {
    const faltan = Object.values(campos).filter((f) => !f.value.trim());
    Object.values(campos).forEach((f) => f.setAttribute('aria-invalid', String(faltan.includes(f))));
    const ok = !faltan.length && dia !== null && hora !== null;
    error.hidden = ok;
    if (!ok) {
      error.textContent = A.faltan;
      if (enfocar) (faltan[0] || $('.agenda__day:not(:disabled)', diasBox))?.focus();
    }
    return ok;
  }
  Object.values(campos).forEach((f) => f.addEventListener('input', () => { if (f.value.trim()) f.setAttribute('aria-invalid', 'false'); }));

  function archivoIcs(c, inicio) {
    // la hora de Chiapas pasa a UTC sumando seis horas
    const utc = new Date(inicio.getTime() - OFFSET_CHIAPAS * 3600e3);
    const fin = new Date(utc.getTime() + AGENDA.minutos * 60e3);
    const f = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const texto = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ixchel//Agenda//ES', 'BEGIN:VEVENT',
      `UID:${f(utc)}-${WHATSAPP[0]}@ixchel`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(utc)}`, `DTEND:${f(fin)}`,
      `SUMMARY:${A.ics(c)}`, `DESCRIPTION:WhatsApp +${WHATSAPP[0]}`, 'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    return `data:text/calendar;charset=utf-8,${encodeURIComponent(texto)}`;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if ($('#a-web')?.value) return; // campo trampa para robots
    if (!validar(true)) return;
    const d = dias[dia];
    const inicio = new Date(d.getTime() + hora * 60e3);
    const c = {
      tipo: tipo(), dia: A.dia(d), hora: horaTxt(hora), inicio: clave(d, hora),
      nombre: campos.nombre.value.trim(), telefono: campos.telefono.value.trim(),
      empresa: $('#a-empresa').value.trim(), notas: $('#a-notas').value.trim(),
      medio: $('input[name="tipo"]:checked', form)?.value || 'llamada', idioma: LANG,
    };
    const texto = A.mensaje(c);
    let apartada = false;
    if (AGENDA_URL) {
      enviar.disabled = true; enviar.textContent = A.apartando;
      try {
        const r = await fetch(AGENDA_URL, { method: 'POST', body: JSON.stringify(c) });
        const j = await r.json();
        if (j.ok) apartada = true;
        else if (j.error === 'ocupada') {
          ocupados.add(c.inicio); hora = null;
          pintarDias(); pintarHoras(); resumen();
          error.hidden = false; error.textContent = A.ocupada;
          enviar.disabled = false; enviar.textContent = A.apartar;
          return;
        }
      } catch { /* sin conexión con la agenda: se pide por WhatsApp */ }
      enviar.disabled = false; enviar.textContent = A.apartar;
    }
    if (!apartada) openWhatsApp(texto);
    else { ocupados.add(c.inicio); pintarDias(); }
    const resumenTxt = A.elegido(c.tipo, c.dia, c.hora);
    $('[data-done-title]', done).textContent = apartada ? A.listoTitulo : A.pedidaTitulo;
    $('[data-done-text]', done).textContent = apartada ? A.listoTexto(resumenTxt) : A.pedidaTexto(resumenTxt);
    $('[data-sello]', done).textContent = A.sello[apartada ? 0 : 1];
    $('[data-ics]', done).href = archivoIcs(c, inicio);
    $('[data-done-wa]', done).href = waLink(texto);
    done.hidden = false;
    $('[data-otra]', done).focus();
  });

  $('[data-otra]', done)?.addEventListener('click', () => {
    done.hidden = true;
    form.reset();
    dia = null; hora = null;
    pintarDias(); pintarHoras(); resumen();
    campos.nombre.focus();
  });

  pintarDias(); resumen();
  if (estado && !AGENDA_URL) estado.textContent = '';
  cargar();
})();

// ---------- cupón: abre WhatsApp y el camión sale con la caja ----------
(() => {
  const form = $('#coupon');
  if (!form) return;
  const error = $('#coupon-error');
  const required = [$('#f-nombre'), $('#f-ciudad')];
  const send = $('#send');
  const sendLink = $('#send-link');
  const C = T.cupon;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const missing = required.filter((f) => !f.value.trim());
    required.forEach((f) => f.setAttribute('aria-invalid', String(missing.includes(f))));
    if (missing.length) {
      error.hidden = false;
      missing[0].focus();
      return;
    }
    error.hidden = true;
    const v = (id) => $(id)?.value.trim() || '';
    const opcion = (id) => { const s = $(id); return s && s.value ? s.options[s.selectedIndex].text : ''; };
    const lineas = [
      C.inicio,
      `${C.nombre}: ${v('#f-nombre')}`,
      `${C.ciudad}: ${v('#f-ciudad')}`,
      v('#f-ton') && `${C.ton}: ${v('#f-ton')}`,
      opcion('#f-calibre') && `${C.calibre}: ${opcion('#f-calibre')}`,
      opcion('#f-frecuencia') && `${C.frecuencia}: ${opcion('#f-frecuencia')}`,
      v('#f-tel') && `${C.tel}: ${v('#f-tel')}`,
    ].filter(Boolean);
    const text = lineas.join('\n');
    openWhatsApp(text);
    if (send) {
      sendLink.href = waLink(text);
      send.hidden = false;
      $('#send-again').focus();
    }
  });

  $('#send-again')?.addEventListener('click', () => {
    send.hidden = true;
    form.reset();
    required[0].focus();
  });

  required.forEach((f) => f.addEventListener('input', () => {
    if (f.value.trim()) f.setAttribute('aria-invalid', 'false');
    if (required.every((r) => r.value.trim())) error.hidden = true;
  }));
})();

// ---------- muescas del boleto y del cupón en celular ----------
(() => {
  // la muesca va donde se juntan las dos partes, sea cual sea el orden en pantalla
  const pairs = [['.ticket', '--stub-y'], ['.coupon', '--cut-y']];
  function place() {
    pairs.forEach(([box, prop]) => {
      const b = $(box);
      if (!b) return;
      const parts = [...b.children].filter((c) => c.tagName === 'DIV' && !c.hidden);
      const y = Math.max(...parts.map((c) => c.offsetTop));
      b.style.setProperty(prop, `${y}px`);
    });
  }
  place();
  window.addEventListener('resize', place, { passive: true });
  document.fonts?.ready.then(place);
})();

// ---------- botón flotante de WhatsApp: se esconde arriba, junto a los formularios y sobre el pie ----------
(() => {
  const fab = $('.fab');
  if (!fab) return;
  // se quita del camino donde ya hay un formulario a la vista
  const formas = $$('#cotizar, #agenda, #contacto, .foot');
  const visibles = new Set();
  const pintar = () => fab.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.6 && !visibles.size);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { es.forEach((x) => (x.isIntersecting ? visibles.add(x.target) : visibles.delete(x.target))); pintar(); }, { threshold: 0.15 });
    formas.forEach((f) => io.observe(f));
  }
  window.addEventListener('scroll', pintar, { passive: true });
  pintar();
})();

// ---------- menú desplegable de contacto ----------
(() => {
  const btn = $('.drop-btn');
  const menu = $('#menu-contacto');
  if (!btn || !menu) return;
  const movil = matchMedia('(max-width: 760px)');
  let abierto = false;
  btn.setAttribute('role', 'button');
  btn.setAttribute('aria-expanded', 'false');

  const colocar = () => {
    if (movil.matches) { menu.style.top = menu.style.left = ''; return; }
    const r = btn.getBoundingClientRect();
    const ancho = $('.drop__panel', menu).offsetWidth;
    menu.style.top = `${r.bottom + window.scrollY + 10}px`;
    menu.style.left = `${Math.max(16, Math.min(r.right - ancho, document.documentElement.clientWidth - ancho - 16)) + window.scrollX}px`;
  };
  const abrir = () => {
    abierto = true;
    menu.hidden = false;
    colocar();
    btn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.toggle('drop-lock', movil.matches);
    requestAnimationFrame(() => menu.classList.add('is-open'));
    $('a', menu)?.focus({ preventScroll: true });
  };
  const cerrar = (devolver) => {
    if (!abierto) return;
    abierto = false;
    btn.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    document.documentElement.classList.remove('drop-lock');
    const fin = () => { if (!abierto) menu.hidden = true; };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) fin(); else setTimeout(fin, 260);
    if (devolver) btn.focus({ preventScroll: true });
  };

  btn.addEventListener('click', (e) => { e.preventDefault(); abierto ? cerrar(true) : abrir(); });
  $('.drop__close', menu).addEventListener('click', () => cerrar(true));
  menu.addEventListener('click', (e) => {
    if (e.target === menu) cerrar(true); // el fondo oscuro en celular
    if (e.target.closest('a')) cerrar(false);
  });
  document.addEventListener('click', (e) => {
    if (abierto && !menu.contains(e.target) && !btn.contains(e.target)) cerrar(false);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(true); });
  window.addEventListener('resize', () => abierto && colocar());
})();

// ---------- mapa: mapa o satélite y copiar la ubicación ----------
(() => {
  const mapa = $('#mapa');
  if (!mapa) return;
  const vista = mapa.closest('.visit__view');
  mapa.addEventListener('load', () => vista.classList.add('is-ready'));
  $$('[data-modo]').forEach((b) => b.addEventListener('click', () => {
    if (b.getAttribute('aria-pressed') === 'true') return;
    $$('[data-modo]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    vista.classList.remove('is-ready');
    mapa.src = `${mapa.dataset.src}&t=${b.dataset.modo}`;
  }));
  const copiar = $('[data-copiar]');
  if (!copiar) return;
  const original = copiar.textContent;
  copiar.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(copiar.dataset.copiar);
      copiar.textContent = copiar.dataset.ok;
      copiar.classList.add('is-ok');
      setTimeout(() => { copiar.textContent = original; copiar.classList.remove('is-ok'); }, 2200);
    } catch {
      window.open(copiar.dataset.copiar, '_blank', 'noopener');
    }
  });
})();

// ---------- entradas al hacer scroll (nunca dejan contenido oculto) ----------
(() => {
  const targets = $$('[data-reveal]');
  if (!targets.length) return;
  const show = (el) => el.classList.add('is-in');
  if (!('IntersectionObserver' in window)) { targets.forEach(show); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      show(entry.target);
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  targets.forEach((el) => io.observe(el));
  window.addEventListener('load', () => setTimeout(() => {
    targets.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) show(el); });
  }, 2000));
})();

$$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
