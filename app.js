// Ixchel, Frutas del Soconusco: carga, guía de embarque con camión y mapa, pestañas,
// cupón a WhatsApp con su animación y entradas al hacer scroll.

// Número de WhatsApp con lada de país, solo dígitos (ejemplo: 5219621234567).
// Mientras esté vacío, WhatsApp abre el mensaje listo y deja elegir a quién mandarlo.
const WHATSAPP = '';

// Distancias aproximadas por carretera desde Tuxtla Chico, Chiapas, y coordenadas reales para el mapa.
const ORIGEN = { lon: -92.17, lat: 14.94 };
const CIUDADES = [
  ['Monterrey, N.L.', 'Monterrey', 1900, -100.31, 25.67],
  ['Saltillo, Coah.', 'Saltillo', 1980, -101.0, 25.42],
  ['Reynosa, Tamps.', 'Reynosa', 1850, -98.28, 26.08],
  ['Nuevo Laredo, Tamps.', 'Nuevo Laredo', 2120, -99.51, 27.48],
  ['Torreón, Coah.', 'Torreón', 2150, -103.41, 25.54],
  ['Chihuahua, Chih.', 'Chihuahua', 2600, -106.09, 28.63],
  ['Ciudad Juárez, Chih.', 'Ciudad Juárez', 2950, -106.42, 31.69],
  ['Hermosillo, Son.', 'Hermosillo', 3050, -110.96, 29.07],
  ['Culiacán, Sin.', 'Culiacán', 2400, -107.39, 24.8],
  ['Mexicali, B.C.', 'Mexicali', 3750, -115.45, 32.62],
  ['Tijuana, B.C.', 'Tijuana', 3900, -117.04, 32.51],
  ['San Luis Potosí, S.L.P.', 'San Luis Potosí', 1560, -100.98, 22.15],
  ['Guadalajara, Jal.', 'Guadalajara', 1650, -103.35, 20.67],
  ['León, Gto.', 'León', 1530, -101.68, 21.12],
  ['Querétaro, Qro.', 'Querétaro', 1350, -100.39, 20.59],
  ['Ciudad de México', 'la Ciudad de México', 1150, -99.13, 19.43],
  ['Puebla, Pue.', 'Puebla', 1030, -98.2, 19.04],
  ['Veracruz, Ver.', 'Veracruz', 850, -96.13, 19.17],
  ['Mérida, Yuc.', 'Mérida', 1250, -89.62, 20.97],
];

const KG_POR_CAJA = 10;
const KM_POR_HORA = 55; // promedio de un camión con paradas
const MIN_T = 1;
const MAX_T = 60;
// cómo se pide: cuánto vale una tonelada en cada unidad y de cuánto en cuánto se sube
const UNIDADES = {
  t: { porTon: 1, paso: 1, etiqueta: 'Toneladas por pedido', nombre: ['tonelada', 'toneladas'] },
  kg: { porTon: 1000, paso: 500, etiqueta: 'Kilos por pedido', nombre: ['kilo', 'kilos'] },
  cajas: { porTon: 1000 / KG_POR_CAJA, paso: 50, etiqueta: `Cajas de ${KG_POR_CAJA} kg por pedido`, nombre: ['caja', 'cajas'] },
};

const fmt = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVG = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}) => { const n = document.createElementNS(SVG, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

function waLink(text) {
  const base = WHATSAPP ? `https://wa.me/${WHATSAPP}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
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

  CIUDADES.forEach(([nombre], i) => select.add(new Option(nombre, String(i))));
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
    if (t <= 3) return { nombre: 'camioneta refrigerada', cap: 3, unidades: 1 };
    if (t <= 10) return { nombre: 'torton refrigerado', cap: 10, unidades: 1 };
    const n = Math.ceil(t / 22);
    return { nombre: n === 1 ? 'tráiler refrigerado de 53 pies' : 'tráileres refrigerados de 53 pies', cap: 22, unidades: n };
  }

  function datos() {
    const [nombre, corta, km, lon, lat] = CIUDADES[Number(select.value)] || CIUDADES[0];
    const t = toneladas();
    const horas = Math.round(km / KM_POR_HORA);
    // corte, empaque y pre-enfriado ocupan el primer día; luego el camino
    const dias = Math.ceil((horas + 12) / 24);
    return { nombre, corta, km, lon, lat, t, horas, dias, veh: vehiculo(t), cajas: Math.round((t * 1000) / KG_POR_CAJA) };
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
    out('camion', d.veh.unidades > 1
      ? `${t} toneladas en ${d.veh.unidades} tráileres de ${d.veh.cap} t`
      : `${t} de ${d.veh.cap} toneladas en un ${d.veh.nombre}`);
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
  function pasos(corta) {
    const ne = ['Monterrey', 'Saltillo', 'Reynosa', 'Nuevo Laredo'];
    if (corta === 'Mérida') return ['villa', 'campeche'];
    if (corta === 'Veracruz') return ['coatza'];
    if (ne.includes(corta)) return ['coatza', 'veracruz', 'tampico'];
    const base = ['ventosa', 'puebla'];
    if (corta === 'Puebla') return ['ventosa'];
    if (corta === 'la Ciudad de México') return base;
    if (corta === 'Querétaro' || corta === 'León' || corta === 'San Luis Potosí') return [...base, 'cdmx', 'qro'];
    if (corta === 'Guadalajara') return [...base, 'cdmx', 'qro'];
    if (corta === 'Torreón') return [...base, 'cdmx', 'qro', 'slp'];
    if (corta === 'Chihuahua') return [...base, 'cdmx', 'qro', 'slp', 'torreon'];
    if (corta === 'Ciudad Juárez') return [...base, 'cdmx', 'qro', 'slp', 'torreon', 'chihuahua'];
    if (corta === 'Culiacán') return [...base, 'cdmx', 'qro', 'gdl'];
    if (corta === 'Hermosillo') return [...base, 'cdmx', 'qro', 'gdl', 'culiacan'];
    return [...base, 'cdmx', 'qro', 'gdl', 'culiacan', 'hermosillo'];
  }
  if (mapG) {
    mapG.append(el('path', { class: 'map__land', d: 'M' + MEXICO.map(([lo, la]) => P(lo, la).map((v) => v.toFixed(1)).join(' ')).join('L') + 'Z' }));
    trail = el('path', { class: 'map__trail' });
    route = el('path', { class: 'map__route' });
    mapG.append(trail, route);
    CIUDADES.forEach(([, , , lon, lat]) => { const [x, y] = P(lon, lat); const c = el('circle', { class: 'map__dot', cx: x, cy: y, r: 5 }); dots.push(c); mapG.append(c); });
    const [ox, oy] = P(ORIGEN.lon, ORIGEN.lat);
    mapG.append(el('circle', { class: 'map__pulse', cx: ox, cy: oy, r: 12 }), el('circle', { class: 'map__origin', cx: ox, cy: oy, r: 8 }));
    const lo = el('text', { class: 'map__label', x: ox - 14, y: oy + 34, 'text-anchor': 'end' }); lo.textContent = 'Tuxtla Chico'; mapG.append(lo);
    label2 = el('text', { class: 'map__label' }); mapG.append(label2);
    mover = el('g'); mover.append(el('rect', { x: -14, y: -9, width: 20, height: 14, fill: '#f4d96c' }), el('path', { d: 'M6 -4h6l5 5v4H6z', fill: '#c8202b' }), el('circle', { cx: -8, cy: 7, r: 3.5, fill: '#0b2416' }), el('circle', { cx: 11, cy: 7, r: 3.5, fill: '#0b2416' }));
    mapG.append(mover);
  }
  function dibujarRuta(d) {
    if (!mapG) return;
    const i = Number(select.value);
    dots.forEach((c, k) => { c.classList.toggle('is-on', k === i); c.setAttribute('r', k === i ? 9 : 5); });
    const [ox, oy] = P(ORIGEN.lon, ORIGEN.lat);
    const [tx, ty] = P(d.lon, d.lat);
    const pts = [[ox, oy], ...pasos(d.corta).map((k) => P(...PASO[k])), [tx, ty]];
    const dd = 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L');
    route.setAttribute('d', dd); trail.setAttribute('d', dd);
    label2.textContent = d.corta === 'la Ciudad de México' ? 'CDMX' : d.corta;
    const right = tx < 420;
    label2.setAttribute('x', tx + (right ? 16 : -16)); label2.setAttribute('y', ty - 12); label2.setAttribute('text-anchor', right ? 'start' : 'end');
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
    out('ciudad-corta', d.corta === 'la Ciudad de México' ? 'CDMX' : d.corta);
    out('cajas', `${fmt.format(d.cajas)} cajas`);
    out('vehiculo', d.veh.nombre);
    out('unidades', d.veh.unidades === 1 ? '1 unidad' : `${d.veh.unidades} unidades`);
    out('km', `${fmt.format(d.km)} km`);
    out('horas', `${d.horas} h`);
    out('dias', `en ${d.dias} a ${d.dias + 1} días`);
    llenarCamion(d);
    if (mapaVisto) dibujarRuta(d); else if (mapG) dibujarRutaQuieta(d);
  }
  function dibujarRutaQuieta(d) { const r = reduced; dibujarRuta(d); if (!r) { cancelAnimationFrame(raf); route.style.strokeDashoffset = String(route.getTotalLength()); } }

  function mensaje() {
    const d = datos();
    const u = U();
    const cantidad = unidad === 't' ? '' : ` (${fmt.format(limitar(input.value))} ${u.nombre[1]})`;
    return `Hola, quiero cotizar rambután con entrega en ${d.nombre}: ${fmt.format(d.t)} ${d.t === 1 ? 'tonelada' : 'toneladas'}${cantidad}, ${fmt.format(d.cajas)} cajas de ${KG_POR_CAJA} kg. ¿Qué precio por kilo tienen esta semana y cuándo podrían cortar?`;
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
    if (label) label.textContent = u.etiqueta;
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
  hero: 'Hola, me interesa comprar rambután por tonelada. ¿Me pueden mandar el precio de esta semana?',
  carta: 'Hola, vi su sitio y me interesa comprar rambután de Tuxtla Chico. ¿Me pueden dar informes?',
  fruta: () => `Hola, me interesa el ${$('#t-fruta')?.textContent.toLowerCase() || 'rambután'}. ¿Qué disponibilidad y precio tienen?`,
  precio: 'Hola, ¿me pueden pasar el precio por kilo de esta semana para un pedido mayorista de rambután?',
  faq: 'Hola, tengo una pregunta sobre su rambután:',
  guia: () => (guia ? guia.mensaje() : MENSAJES.hero),
};

$$('[data-wa]').forEach((a) => {
  a.addEventListener('click', () => {
    const m = MENSAJES[a.dataset.wa];
    const text = typeof m === 'function' ? m() : m;
    if (!text) return; // sin mensaje, el enlace baja al cupón
    // el enlace se vuelve el de WhatsApp justo al tocarlo, con el mensaje del momento
    a.href = waLink(text);
    a.target = '_blank';
    a.rel = 'noopener';
  });
});

// ---------- pestañas de la fruta ----------
(() => {
  const plate = $('.plate');
  const tabs = $$('.tabs [role="tab"]');
  if (!plate || !tabs.length) return;
  const copy = {
    rojo: ['Rambután rojo', 'El que más pide el mercado: cáscara roja intensa y pulpa blanca, jugosa y dulce.'],
    amarillo: ['Rambután amarillo', 'Cáscara dorada, igual de dulce y más escaso. Destaca en el anaquel de cualquier frutería.'],
    calibre: ['Por calibre', 'Cada caja va pareja: grande para exhibir, mediano para venta por kilo y chico para pulpa.'],
  };
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
    [title.textContent, text.textContent] = copy[key];
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

// ---------- cupón: abre WhatsApp y el camión sale con la caja ----------
(() => {
  const form = $('#coupon');
  if (!form) return;
  const error = $('#coupon-error');
  const required = [$('#f-nombre'), $('#f-ciudad')];
  const send = $('#send');
  const sendLink = $('#send-link');

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
    const v = (id) => $(id).value.trim();
    const lineas = [
      'Hola, quiero una cotización de rambután.',
      `Nombre y empresa: ${v('#f-nombre')}`,
      `Ciudad de entrega: ${v('#f-ciudad')}`,
      v('#f-ton') && `Toneladas por semana: ${v('#f-ton')}`,
      v('#f-tel') && `Teléfono: ${v('#f-tel')}`,
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
      const parts = [...b.children].filter((c) => c.tagName === 'DIV');
      const y = Math.max(...parts.map((c) => c.offsetTop));
      b.style.setProperty(prop, `${y}px`);
    });
  }
  place();
  window.addEventListener('resize', place, { passive: true });
  document.fonts?.ready.then(place);
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
