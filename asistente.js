// Ixchel: asistente virtual de la página.
// Responde preguntas frecuentes con la información del sitio, sin internet ni servidor:
// lo que escribe la persona no se guarda ni se envía. Si no sabe algo, ofrece pasar la pregunta a WhatsApp.
// Sirve igual en español (/) y en inglés (/en/): el idioma sale de <html lang>.
(() => {
  'use strict';
  const EN = document.documentElement.lang.toLowerCase().startsWith('en');
  const RAIZ = EN ? '../' : '';
  const WA = 'https://wa.me/529621707553';
  const P = EN
    ? { fruta: 'fruit.html', pedidos: 'orders.html', agenda: 'schedule.html', preguntas: 'faq.html', cotizar: 'quote.html', contacto: 'contact.html', privacidad: 'privacy.html', terminos: 'terms.html' }
    : { fruta: 'fruta.html', pedidos: 'pedidos.html', agenda: 'agenda.html', preguntas: 'preguntas.html', cotizar: 'cotizar.html', contacto: 'contacto.html', privacidad: 'privacidad.html', terminos: 'terminos.html' };

  // ---------- textos ----------
  const T = EN ? {
    abrir: 'Ask our assistant', boton: 'Questions?', titulo: 'Ixchel assistant', sub: 'Automatic answers · 24 h',
    cerrar: 'Close assistant', placeholder: 'Type your question…', enviar: 'Send',
    hola: 'Hi! I’m Ixchel’s virtual assistant. I can tell you about our rambutan, minimum order, harvest season, payments and how to pick up your load. What would you like to know?',
    aviso: 'Automatic assistant: answers are guidance, not a quote. Prices and orders are confirmed in writing by our team.',
    chips: ['Price', 'Minimum order', 'Season', 'Do you ship?', 'How to pay', 'Visit the orchard'],
    noSe: 'I don’t have that answer, but our team does. Send your question on WhatsApp and we’ll reply, every day from 7:00 to 19:00 (Chiapas time).',
    waPregunta: 'Ask on WhatsApp', waTexto: (q) => `Hello Ixchel, I have a question from your website: ${q}`,
    datos: 'Please don’t type bank details or passwords here. For your order, use WhatsApp or the quote form.',
    ver: 'See more',
  } : {
    abrir: 'Pregúntale al asistente', boton: '¿Dudas?', titulo: 'Asistente Ixchel', sub: 'Respuestas automáticas · 24 h',
    cerrar: 'Cerrar asistente', placeholder: 'Escribe tu pregunta…', enviar: 'Enviar',
    hola: '¡Hola! Soy el asistente virtual de Ixchel. Te cuento sobre nuestro rambután, el pedido mínimo, la temporada, los pagos y cómo recoger tu carga. ¿Qué te gustaría saber?',
    aviso: 'Asistente automático: sus respuestas orientan, no son una cotización. Precios y pedidos los confirma nuestro equipo por escrito.',
    chips: ['Precio', 'Pedido mínimo', 'Temporada', '¿Hacen envíos?', 'Cómo pagar', 'Visitar la huerta'],
    noSe: 'Esa respuesta no la tengo, pero nuestro equipo sí. Mándanos tu pregunta por WhatsApp y te contestamos, todos los días de 7:00 a 19:00 (hora de Chiapas).',
    waPregunta: 'Preguntar por WhatsApp', waTexto: (q) => `Hola Ixchel, tengo una pregunta desde su página: ${q}`,
    datos: 'Por seguridad, no escribas aquí datos bancarios ni contraseñas. Para tu pedido usa WhatsApp o el formulario de cotización.',
    ver: 'Ver más',
  };

  // ---------- lo que sabe: palabras clave (sin acentos) y respuesta ----------
  // r: respuesta; l: [texto, página] enlace opcional; wa: true muestra el botón de WhatsApp
  const BASE = EN ? [
    { k: ['price', 'cost', 'how much', 'quote', 'per kilo', 'per ton', 'rate'], r: 'The price changes with fruit size, week and availability, so we don’t publish a fixed one. Send us your city and how many tons you need and we’ll confirm the price in writing; a written quote is valid for 48 hours.', l: ['Get a quote', 'cotizar'], wa: true },
    { k: ['minimum', 'how many', 'small', 'kilos', 'kg', 'boxes', 'little', 'retail'], r: 'We sell wholesale only, from 5 metric tons per order (500 boxes of 10 kg). For weekly volumes during the season we set up a harvest program and set fruit aside for you.', l: ['Order sizes', 'pedidos'] },
    { k: ['ship', 'shipping', 'deliver', 'delivery', 'send', 'transport', 'truck', 'freight', 'logistic'], r: 'We don’t ship or provide transport. You send your truck or carrier to the orchard in Tuxtla Chico, Chiapas, and we harvest, pack and load it. For long trips bring a refrigerated box already cooled to 10–12 °C.', l: ['Shipping guide', 'pedidos'] },
    { k: ['sample', 'samples', 'taste', 'try'], r: 'We don’t send samples by mail or courier. You’re welcome to visit the orchard and taste the fruit before your first order; message us on WhatsApp to book your visit.', wa: true },
    { k: ['season', 'when', 'available', 'availability', 'harvest', 'month', 'now', 'stock'], r: 'Harvest runs from July to October, peaking in August and September. Right now we are taking orders and reserving fruit for next season. Tell us your dates and we’ll plan your harvest.', l: ['Harvest calendar', 'fruta'] },
    { k: ['pay', 'payment', 'deposit', 'transfer', 'refund', 'cash', 'card', 'advance'], r: 'You reserve fruit and a harvest date with a 35 % deposit, deducted from the total; the balance is paid before the truck is loaded. We only accept transfers or deposits to the account we give you in writing from our official WhatsApp or email, and we load once the payment shows. The deposit is non-refundable if you cancel or your truck doesn’t arrive. No payment on delivery.', l: ['Terms of sale', 'pedidos', '#condiciones'] },
    { k: ['where', 'location', 'address', 'visit', 'orchard', 'farm', 'map', 'come'], r: 'Our orchard is in Tuxtla Chico, in the Soconusco region of Chiapas, Mexico, near Tapachula. If you’d like to visit, let us know in advance and we’ll be waiting for you.', l: ['Contact and map', 'contacto'], wa: true },
    { k: ['hours', 'open', 'schedule', 'time', 'call', 'appointment', 'book', 'meeting', 'video'], r: 'We answer every day from 7:00 to 19:00, Chiapas time. You can book a call, a WhatsApp chat or a video call at the time that suits you.', l: ['Book a call', 'agenda'] },
    { k: ['size', 'sizes', 'caliber', 'variety', 'varieties', 'red', 'yellow', 'quality', 'spec'], r: 'We grow red and yellow rambutan (Nephelium lappaceum), separated into large, medium and small sizes in the pack. The spec sheet has everything your quality team needs.', l: ['Spec sheet', 'fruta', '#ficha'] },
    { k: ['pack', 'packing', 'box', 'packaging', 'presentation'], r: 'It comes in 10 kg boxes with fruit of the same size. A 53-foot trailer holds up to 2,200 boxes (22 t). If your customer needs another presentation, tell us and we’ll quote it.' },
    { k: ['last', 'shelf', 'life', 'cold', 'temperature', 'store', 'storage', 'fresh', 'keep'], r: 'Refrigerated at 10–12 °C with 90–95 % humidity it lasts about two weeks. At room temperature it darkens in three to five days. Never store it below 8 °C, cold damages the skin.', l: ['Care guide', 'pedidos', '#condiciones'] },
    { k: ['export', 'usa', 'united states', 'canada', 'abroad', 'international', 'border'], r: 'Send us your city and port of entry and we’ll review the sanitary requirements and export documents with you. Transport is on you and we load at the orchard.', wa: true },
    { k: ['claim', 'complaint', 'return', 'damaged', 'bad', 'guarantee'], r: 'You or your driver check quality, size and quantity while loading, and we send photos and video before the truck leaves. Claims are accepted at the orchard before departure; after that the load is accepted, because handling on the road no longer depends on us.', l: ['Terms of sale', 'pedidos', '#condiciones'] },
    { k: ['invoice', 'factura', 'tax', 'receipt', 'rfc'], r: 'Ask us about invoicing on WhatsApp when you request your quote and we’ll confirm the details for your order.', wa: true },
    { k: ['phone', 'whatsapp', 'email', 'contact', 'number', 'mail'], r: 'WhatsApp and phone: +52 962 170 7553. Email: ventasixchelfrutas@gmail.com. Those are our only official contacts.', l: ['Contact', 'contacto'], wa: true },
    { k: ['fraud', 'scam', 'fake', 'account', 'bank', 'safe', 'trust'], r: 'Only pay to the account we give you in writing from +52 962 170 7553 or ventasixchelfrutas@gmail.com. If someone asks you to pay from another number or profile in Ixchel’s name, don’t pay and let us know.', l: ['Terms of use', 'terminos'] },
    { k: ['health', 'vitamin', 'benefit', 'nutrition', 'calories', 'healthy'], r: 'Rambutan is a juicy tropical fruit, mostly water, and a source of vitamin C. That’s general information, not medical advice.' },
    { k: ['other fruit', 'mango', 'lychee', 'mangosteen', 'cacao', 'banana', 'more fruit'], r: 'Our main product is rambutan. Ask us on WhatsApp about other Soconusco fruits and we’ll tell you what we can offer.', wa: true },
    { k: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'], r: 'Hello! Ask me about price, minimum order, season, payments or how to pick up your load.' },
    { k: ['thanks', 'thank you', 'great', 'perfect', 'ok'], r: 'You’re welcome! When you’re ready, send us your city and tons on WhatsApp and we’ll get your quote going.', wa: true },
  ] : [
    { k: ['precio', 'cuesta', 'cuanto', 'costo', 'cotiza', 'cotizacion', 'kilo', 'vale', 'tarifa'], r: 'El precio cambia según calibre, semana y disponibilidad, por eso no publicamos uno fijo. Mándanos tu ciudad y cuántas toneladas necesitas y te lo confirmamos por escrito; la cotización vale 48 horas.', l: ['Cotizar', 'cotizar'], wa: true },
    { k: ['minimo', 'cuantas', 'poquito', 'poco', 'kilos', 'kg', 'cajas', 'menudeo', 'chico'], r: 'Vendemos solo al mayoreo, desde 5 toneladas por pedido (500 cajas de 10 kg). Para volúmenes semanales durante la temporada armamos un programa de cortes y te apartamos fruta.', l: ['Ver volúmenes', 'pedidos'] },
    { k: ['envio', 'envios', 'envian', 'mandan', 'entrega', 'entregan', 'transporte', 'flete', 'camion', 'llevan', 'paqueteria', 'domicilio'], r: 'No hacemos envíos ni damos transporte. Tú mandas tu camión o transportista a la huerta en Tuxtla Chico, Chiapas, y nosotros cortamos, empacamos y cargamos. Para viajes largos trae caja refrigerada ya fría, a 10–12 °C.', l: ['Guía de embarque', 'pedidos'] },
    { k: ['muestra', 'muestras', 'probar', 'prueba'], r: 'No enviamos muestras por paquetería. Puedes venir a la huerta y probar la fruta antes de tu primer pedido; escríbenos por WhatsApp para agendar tu visita.', wa: true },
    { k: ['temporada', 'cuando', 'hay', 'disponible', 'cosecha', 'mes', 'meses', 'ahorita', 'ahora', 'tienen'], r: 'La cosecha va de julio a octubre, con pico en agosto y septiembre. Ahorita estamos tomando pedidos y apartando fruta para la próxima temporada. Dinos tus fechas y planeamos tu corte.', l: ['Calendario de cosecha', 'fruta'] },
    { k: ['pago', 'pagar', 'pagos', 'anticipo', 'apartado', 'deposito', 'transferencia', 'reembolso', 'devuelven', 'efectivo', 'tarjeta'], r: 'Apartas fruta y fecha de corte con un anticipo del 35 %, que se descuenta del total; el resto se paga antes de cargar el camión. Solo aceptamos transferencias o depósitos a la cuenta que te damos por escrito desde nuestro WhatsApp o correo oficial, y cargamos cuando el pago ya se ve reflejado. El apartado no se devuelve si cancelas o no llega tu transporte. No hay pago contra entrega.', l: ['Condiciones de venta', 'pedidos', '#condiciones'] },
    { k: ['donde', 'ubicacion', 'direccion', 'visitar', 'visita', 'huerta', 'mapa', 'llegar', 'ir'], r: 'La huerta está en Tuxtla Chico, en el Soconusco, Chiapas, cerca de Tapachula. Si quieres conocerla, avísanos antes y te esperamos.', l: ['Contacto y mapa', 'contacto'], wa: true },
    { k: ['horario', 'hora', 'horas', 'abren', 'atienden', 'llamada', 'llamar', 'cita', 'agendar', 'videollamada'], r: 'Atendemos todos los días de 7:00 a 19:00, hora de Chiapas. Puedes agendar una llamada, un WhatsApp o una videollamada en el horario que te acomode.', l: ['Agendar llamada', 'agenda'] },
    { k: ['calibre', 'calibres', 'tamano', 'variedad', 'variedades', 'rojo', 'amarillo', 'calidad', 'ficha'], r: 'Tenemos rambután rojo y amarillo (Nephelium lappaceum), separado en calibre grande, mediano y chico. En la ficha técnica está todo lo que necesita tu área de calidad.', l: ['Ficha técnica', 'fruta', '#ficha'] },
    { k: ['empaque', 'empacado', 'caja', 'presentacion'], r: 'Viene en caja de 10 kg con fruta del mismo calibre. Un tráiler de 53 pies lleva hasta 2,200 cajas (22 t). Si tu cliente necesita otra presentación, dinos cuál y la cotizamos.' },
    { k: ['dura', 'aguanta', 'frio', 'temperatura', 'refrigerado', 'conservar', 'guardar', 'fresco', 'anaquel'], r: 'Refrigerado entre 10 y 12 °C con 90 a 95 % de humedad dura alrededor de dos semanas. A temperatura ambiente se oscurece en tres a cinco días. Nunca lo guardes abajo de 8 °C: el frío daña la cáscara.', l: ['Cómo cuidarlo', 'pedidos', '#condiciones'] },
    { k: ['exportar', 'exportacion', 'estados unidos', 'usa', 'canada', 'extranjero', 'frontera'], r: 'Escríbenos con tu ciudad y tu puerto de entrada y revisamos contigo los requisitos sanitarios y los documentos de exportación. El transporte corre por tu cuenta y nosotros cargamos en la huerta.', wa: true },
    { k: ['reclamo', 'queja', 'devolucion', 'maltratada', 'mala', 'garantia'], r: 'Tú o tu chofer revisan calidad, calibre y cantidad mientras se carga, y te mandamos fotos y video antes de que salga el camión. Los reclamos se hacen en la huerta antes de salir; después la carga queda aceptada, porque el manejo en el camino ya no depende de nosotros.', l: ['Condiciones de venta', 'pedidos', '#condiciones'] },
    { k: ['factura', 'facturan', 'rfc', 'fiscal'], r: 'Pregúntanos por la factura en WhatsApp cuando pidas tu cotización y te confirmamos los detalles para tu pedido.', wa: true },
    { k: ['telefono', 'whatsapp', 'correo', 'contacto', 'numero', 'email', 'mail'], r: 'WhatsApp y teléfono: 962 170 7553. Correo: ventasixchelfrutas@gmail.com. Son nuestros únicos contactos oficiales.', l: ['Contacto', 'contacto'], wa: true },
    { k: ['fraude', 'estafa', 'falso', 'cuenta', 'banco', 'seguro', 'confianza', 'robo'], r: 'Paga solo a la cuenta que te damos por escrito desde el 962 170 7553 o ventasixchelfrutas@gmail.com. Si alguien te pide pagar desde otro número o perfil a nombre de Ixchel, no pagues y avísanos.', l: ['Términos de uso', 'terminos'] },
    { k: ['salud', 'vitamina', 'vitaminas', 'beneficio', 'beneficios', 'nutricion', 'calorias', 'sano'], r: 'El rambután es una fruta tropical jugosa, en su mayoría agua, y aporta vitamina C. Es información general, no consejo médico.' },
    { k: ['otras frutas', 'mango', 'lichi', 'litchi', 'mangostan', 'cacao', 'platano', 'mas frutas'], r: 'Nuestro producto principal es el rambután. Pregúntanos por WhatsApp por otras frutas del Soconusco y te decimos qué podemos ofrecer.', wa: true },
    { k: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'que tal', 'saludos'], r: '¡Hola! Pregúntame por el precio, el pedido mínimo, la temporada, los pagos o cómo recoger tu carga.' },
    { k: ['gracias', 'muy bien', 'perfecto', 'excelente', 'ok', 'va'], r: '¡Con gusto! Cuando estés listo, mándanos por WhatsApp tu ciudad y las toneladas y arrancamos con tu cotización.', wa: true },
  ];

  const sinAcentos = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!.,;:()"']/g, ' ').replace(/\s+/g, ' ').trim();
  const nombreCiudad = (v) => (typeof v === 'object' ? v[EN ? 'en' : 'es'] : v);

  // cuántas toneladas, kilos o cajas menciona
  function cantidad(q) {
    const m = q.match(/(\d+(?:[.,]\d+)?)\s*(toneladas?|tons?|t\b|kilos?|kg|kgs|cajas?|boxes?)/);
    if (!m) return null;
    const n = parseFloat(m[1].replace(',', '.'));
    const u = m[2];
    if (/^(kilo|kg)/.test(u)) return n / 1000;
    if (/^(caja|box)/.test(u)) return (n * 10) / 1000;
    return n;
  }

  function respuestaCantidad(t) {
    const fmt = new Intl.NumberFormat(EN ? 'en-US' : 'es-MX', { maximumFractionDigits: 1 });
    if (t < 5) {
      return { r: EN ? `That’s about ${fmt.format(t)} t. Our minimum is 5 metric tons per order (500 boxes of 10 kg), because we sell wholesale only. If you can reach 5 t, we’ll gladly quote it.` : `Eso son unas ${fmt.format(t)} t. Nuestro mínimo es de 5 toneladas por pedido (500 cajas de 10 kg), porque vendemos solo al mayoreo. Si llegas a 5 t, con gusto te cotizamos.`, l: [EN ? 'Order sizes' : 'Ver volúmenes', 'pedidos'] };
    }
    const cajas = Math.round(t * 100);
    const veh = t <= 10 ? (EN ? 'a straight truck (torton)' : 'un torton') : t <= 22 ? (EN ? 'a 53-foot trailer' : 'un tráiler de 53 pies') : (EN ? `${Math.ceil(t / 22)} trailers of 53 feet` : `${Math.ceil(t / 22)} tráileres de 53 pies`);
    return { r: EN ? `${fmt.format(t)} t are about ${fmt.format(cajas)} boxes of 10 kg, and they fit in ${veh}. Send us your city and dates and we’ll confirm price and harvest in writing.` : `${fmt.format(t)} t son unas ${fmt.format(cajas)} cajas de 10 kg y caben en ${veh}. Mándanos tu ciudad y fechas y te confirmamos precio y corte por escrito.`, l: [EN ? 'Get a quote' : 'Cotizar', 'cotizar'], wa: true };
  }

  // distancia y días de camino a una ciudad de la guía
  function respuestaCiudad(q) {
    if (typeof CIUDADES === 'undefined') return null;
    const c = CIUDADES.find((x) => {
      const a = sinAcentos(nombreCiudad(x.corta)); const b = sinAcentos(nombreCiudad(x.nombre).split(',')[0]);
      return (a.length > 2 && q.includes(a)) || (b.length > 2 && q.includes(b));
    });
    if (!c) return null;
    const kmh = typeof KM_POR_HORA !== 'undefined' ? KM_POR_HORA : 55;
    const horas = Math.round(c.km / kmh);
    const dias = Math.ceil((horas + 12) / 24);
    const nom = nombreCiudad(c.nombre);
    const fmt = new Intl.NumberFormat(EN ? 'en-US' : 'es-MX');
    return { r: EN ? `From our orchard to ${nom} it’s about ${fmt.format(c.km)} km by road, roughly ${horas} hours of driving, so plan about ${dias} days from harvest to arrival with your own refrigerated truck. These are estimates.` : `De la huerta a ${nom} son unos ${fmt.format(c.km)} km por carretera, como ${horas} horas de manejo; calcula unos ${dias} días desde el corte hasta que llega, en tu propio camión refrigerado. Son tiempos aproximados.`, l: [EN ? 'Shipping guide' : 'Guía de embarque', 'pedidos'] };
  }

  function responder(texto) {
    const q = ' ' + sinAcentos(texto) + ' ';
    if (/\b(\d{4}[ -]?){3,4}\b|clabe|cvv|contrasena|password|nip\b/.test(q)) return { r: T.datos };
    const t = cantidad(q);
    if (t !== null) return respuestaCantidad(t);
    const ciudad = respuestaCiudad(q);
    if (ciudad && !/(precio|price|cuanto cuesta|how much)/.test(q)) return ciudad;
    let mejor = null; let puntos = 0;
    for (const item of BASE) {
      let p = 0;
      for (const k of item.k) {
        const kk = sinAcentos(k);
        if (q.includes(' ' + kk + ' ') || (kk.length > 4 && q.includes(kk))) p += kk.includes(' ') ? 2 : 1;
      }
      if (p > puntos) { puntos = p; mejor = item; }
    }
    if (mejor) return mejor;
    return { r: T.noSe, wa: true, pregunta: texto };
  }

  // ---------- la ventana ----------
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = RAIZ + 'asistente.css?v=20261110';
  document.head.appendChild(css);

  const caja = document.createElement('div');
  caja.className = 'asis';
  caja.innerHTML = `
    <button type="button" class="asis__boton" aria-expanded="false" aria-controls="asis-panel" aria-label="${T.abrir}">
      <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 7.5h20a2.5 2.5 0 0 1 2.5 2.5v10a2.5 2.5 0 0 1-2.5 2.5H14l-6 5v-5H6A2.5 2.5 0 0 1 3.5 20V10A2.5 2.5 0 0 1 6 7.5z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><circle cx="11" cy="15" r="1.7" fill="currentColor"/><circle cx="16" cy="15" r="1.7" fill="currentColor"/><circle cx="21" cy="15" r="1.7" fill="currentColor"/></svg>
      <span class="asis__boton-txt">${T.boton}</span>
    </button>
    <section class="asis__panel" id="asis-panel" role="dialog" aria-modal="false" aria-labelledby="asis-titulo" hidden>
      <header class="asis__cabeza">
        <img class="asis__logo" src="${RAIZ}img/logo.svg" alt="" width="40" height="40">
        <div class="asis__nombre"><p class="asis__titulo" id="asis-titulo">${T.titulo}</p><p class="asis__sub">${T.sub}</p></div>
        <button type="button" class="asis__cerrar" aria-label="${T.cerrar}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>
      </header>
      <div class="asis__chat" role="log" aria-live="polite" aria-relevant="additions"></div>
      <div class="asis__chips" role="group" aria-label="${EN ? 'Suggested questions' : 'Preguntas sugeridas'}"></div>
      <form class="asis__form" autocomplete="off">
        <label class="asis__oculto" for="asis-campo">${T.placeholder}</label>
        <input class="asis__campo" id="asis-campo" type="text" maxlength="300" placeholder="${T.placeholder}" enterkeyhint="send">
        <button class="asis__enviar" type="submit" aria-label="${T.enviar}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5L4 12z" fill="currentColor"/></svg></button>
      </form>
      <p class="asis__aviso">${T.aviso} <a href="${P.terminos}">${EN ? 'Terms' : 'Términos'}</a></p>
    </section>`;
  document.body.appendChild(caja);

  const boton = caja.querySelector('.asis__boton');
  const panel = caja.querySelector('.asis__panel');
  const chat = caja.querySelector('.asis__chat');
  const chips = caja.querySelector('.asis__chips');
  const form = caja.querySelector('.asis__form');
  const campo = caja.querySelector('.asis__campo');
  const reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let iniciado = false;

  function burbuja(quien, texto, extra) {
    const b = document.createElement('div');
    b.className = 'asis__msg asis__msg--' + quien;
    const p = document.createElement('p');
    p.textContent = texto;
    b.appendChild(p);
    if (extra) {
      const acc = document.createElement('div');
      acc.className = 'asis__acciones';
      if (extra.l) {
        const a = document.createElement('a');
        a.className = 'asis__link';
        a.href = P[extra.l[1]] + (extra.l[2] || '');
        a.textContent = extra.l[0] + ' →';
        acc.appendChild(a);
      }
      if (extra.wa) {
        const a = document.createElement('a');
        a.className = 'asis__wa';
        a.href = WA + (extra.pregunta ? '?text=' + encodeURIComponent(T.waTexto(extra.pregunta)) : '');
        a.target = '_blank'; a.rel = 'noopener';
        a.dataset.wa = 'asistente';
        a.textContent = extra.pregunta ? T.waPregunta : 'WhatsApp 962 170 7553';
        acc.appendChild(a);
      }
      if (acc.children.length) b.appendChild(acc);
    }
    chat.appendChild(b);
    chat.scrollTop = chat.scrollHeight;
  }

  function contestar(texto) {
    const limpio = texto.trim().slice(0, 300);
    if (!limpio) return;
    burbuja('yo', limpio);
    const res = responder(limpio);
    const escribiendo = document.createElement('div');
    escribiendo.className = 'asis__msg asis__msg--bot asis__msg--puntos';
    escribiendo.setAttribute('aria-hidden', 'true');
    escribiendo.innerHTML = '<span></span><span></span><span></span>';
    chat.appendChild(escribiendo);
    chat.scrollTop = chat.scrollHeight;
    setTimeout(() => { escribiendo.remove(); burbuja('bot', res.r, res); }, reducir ? 0 : 450);
  }

  function abrir() {
    panel.hidden = false;
    caja.classList.add('is-open');
    boton.setAttribute('aria-expanded', 'true');
    if (!iniciado) {
      iniciado = true;
      burbuja('bot', T.hola);
      T.chips.forEach((c) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'asis__chip'; b.textContent = c;
        b.addEventListener('click', () => contestar(c));
        chips.appendChild(b);
      });
    }
    // en celular no subimos el teclado de golpe
    if (window.matchMedia('(min-width: 48em)').matches) campo.focus(); else caja.querySelector('.asis__cerrar').focus();
  }
  function cerrar() {
    panel.hidden = true;
    caja.classList.remove('is-open');
    boton.setAttribute('aria-expanded', 'false');
    boton.focus();
  }

  boton.addEventListener('click', () => (panel.hidden ? abrir() : cerrar()));
  caja.querySelector('.asis__cerrar').addEventListener('click', cerrar);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) cerrar(); });
  form.addEventListener('submit', (e) => { e.preventDefault(); contestar(campo.value); campo.value = ''; });

  // aparece después de un momento para no tapar la carga de la página
  setTimeout(() => caja.classList.add('is-on'), reducir ? 0 : 1200);
})();
