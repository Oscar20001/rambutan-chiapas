# Arma las páginas del sitio a partir de la fuente de una sola hoja.
# Uso: python3 tools/traducir.py && python3 tools/faq.py && python3 tools/paginas.py
#
# La fuente (tools/fuente/sitio.html y sitio-en.html) tiene todas las secciones juntas.
# Este script las reparte en páginas: Inicio, La fruta, Pedidos, Agenda, Preguntas, Cotizar y Contacto,
# cada una con su barra (logo y flecha para volver al inicio), su menú y su encabezado.
import html, pathlib, re

raiz = pathlib.Path(__file__).resolve().parent.parent
fuente = raiz / 'tools' / 'fuente'
BASE = 'https://oscar20001.github.io/rambutan-chiapas/'

# sección de la fuente -> página
SECCION = {
    'inicio': 'index', 'origen': 'index', 'confianza': 'index', 'mas-frutas': 'index',
    'fruta': 'fruta', 'ficha': 'fruta',
    'volumen': 'pedidos', 'envio': 'pedidos', 'ruta': 'pedidos', 'precio': 'pedidos', 'condiciones': 'pedidos',
    'agenda': 'agenda', 'preguntas': 'preguntas', 'cotizar': 'cotizar', 'contacto': 'contacto',
}
ORDEN = ['index', 'fruta', 'pedidos', 'agenda', 'preguntas', 'cotizar', 'contacto']
# en la portada: carta, menú de páginas, compromisos y más frutas
PORTADA = ['origen', '@menu', 'confianza', 'mas-frutas']

ICONO = {'fruta': 'p-fruta', 'pedidos': 'p-camion', 'agenda': 'p-agenda', 'preguntas': 'p-pregunta', 'cotizar': 'p-cupon', 'contacto': 'p-huerta'}

L = {
    'es': {
        'archivo': {'index': 'index.html', 'fruta': 'fruta.html', 'pedidos': 'pedidos.html', 'agenda': 'agenda.html', 'preguntas': 'preguntas.html', 'cotizar': 'cotizar.html', 'contacto': 'contacto.html'},
        'otro': 'en', 'prefijo': '', 'url': BASE,
        'menu': {'fruta': 'La fruta', 'pedidos': 'Pedidos', 'agenda': 'Agenda', 'preguntas': 'Preguntas', 'cotizar': 'Cotizar', 'contacto': 'Contacto'},
        'inicio': 'Inicio', 'volver': 'Volver al inicio', 'abrir': 'Menú', 'cerrar': 'Cerrar menú', 'secciones': 'Páginas del sitio', 'migas': 'Estás en',
        'lang': ('EN', 'en', 'EN: English version', 'English version'),
        'pagina': {
            'fruta': ('Rambután del Soconusco', 'La fruta', 'Variedades, calibres, ficha técnica y calendario de cosecha, para ti y tu área de calidad.', 'Rambután rojo y amarillo de Tuxtla Chico, Chiapas: variedades, calibres, ficha técnica y calendario de cosecha.'),
            'pedidos': ('Por tonelada, en la huerta', 'Pedidos y flete', 'Elige volumen, calcula cajas y vehículo, y mira la ruta a tu ciudad. Tú mandas el transporte y nosotros cargamos.', 'Pedidos de rambután por tonelada: volúmenes, guía de embarque con cajas, vehículo y días de camino, y ruta desde Chiapas a tu ciudad.'),
            'agenda': ('Todos los días, 7:00 a 19:00', 'Agenda una llamada', 'Aparta una llamada, un WhatsApp o una videollamada en el horario que te acomode, hora de Chiapas.', 'Agenda una llamada, WhatsApp o videollamada con Ixchel, de lunes a domingo de 7:00 a 19:00, hora de Chiapas.'),
            'preguntas': ('Antes del primer pedido', 'Preguntas', 'Lo que más nos preguntan los compradores: transporte, pedido mínimo, empaque, muestras y pagos.', 'Preguntas frecuentes de compradores de rambután: transporte, pedido mínimo, empaque, muestras, exportación y pagos.'),
            'cotizar': ('Precio de la semana', 'Cotizar', 'Llena tus datos y se abre WhatsApp con tu mensaje listo. Te respondemos con el precio y la fruta disponible.', 'Cotiza rambután por tonelada: llena tus datos y se abre WhatsApp con tu mensaje listo para Ixchel, Frutas del Soconusco.'),
            'contacto': ('Tuxtla Chico, Chiapas', 'Contacto', 'WhatsApp, teléfono, correo y cómo llegar a la huerta. Si quieres conocerla, avísanos antes y te esperamos.', 'Contacto de Ixchel, Frutas del Soconusco: WhatsApp (962) 170-7553, ventasixchelfrutas@gmail.com y ubicación de la huerta en Tuxtla Chico, Chiapas.'),
        },
        'tarjetas': {
            'titulo': 'Todo para tu pedido', 'lead': 'Cada cosa en su lugar. Elige por dónde empezar.',
            'fruta': 'Variedades, calibres, ficha técnica y temporada.',
            'pedidos': 'Calcula cajas, vehículo y días de camino a tu ciudad.',
            'agenda': 'Aparta una llamada o videollamada con nosotros.',
            'preguntas': 'Transporte, pedido mínimo, muestras y pagos.',
            'cotizar': 'Tu mensaje listo para WhatsApp en un minuto.',
            'contacto': 'Teléfono, correo y cómo llegar a la huerta.',
            'ir': 'Ir a',
        },
    },
    'en': {
        'archivo': {'index': 'index.html', 'fruta': 'fruit.html', 'pedidos': 'orders.html', 'agenda': 'schedule.html', 'preguntas': 'faq.html', 'cotizar': 'quote.html', 'contacto': 'contact.html'},
        'otro': 'es', 'prefijo': 'en/', 'url': BASE + 'en/',
        'menu': {'fruta': 'The fruit', 'pedidos': 'Orders', 'agenda': 'Book a call', 'preguntas': 'FAQ', 'cotizar': 'Quote', 'contacto': 'Contact'},
        'inicio': 'Home', 'volver': 'Back to home', 'abrir': 'Menu', 'cerrar': 'Close menu', 'secciones': 'Site pages', 'migas': 'You are here',
        'lang': ('ES', 'es', 'ES: versión en español', 'Versión en español'),
        'pagina': {
            'fruta': ('Soconusco rambutan', 'The fruit', 'Varieties, sizes, spec sheet and harvest calendar, for you and your quality team.', 'Red and yellow rambutan from Tuxtla Chico, Chiapas: varieties, sizes, spec sheet and harvest calendar.'),
            'pedidos': ('By the ton, at the orchard', 'Orders and freight', 'Pick a volume, work out boxes and vehicle, and see the route to your city. You send the truck and we load it.', 'Rambutan orders by the ton: volumes, a shipping guide with boxes, vehicle and days on the road, and the route from Chiapas to your city.'),
            'agenda': ('Every day, 7 a.m. to 7 p.m.', 'Book a call', 'Book a phone call, WhatsApp chat or video call at a time that suits you, Chiapas time.', 'Book a call, WhatsApp chat or video call with Ixchel, Monday to Sunday 7 a.m. to 7 p.m. Chiapas time.'),
            'preguntas': ('Before your first order', 'FAQ', 'What buyers ask us most: transport, minimum order, packing, samples and payment.', 'Rambutan buyer FAQ: transport, minimum order, packing, samples, export and payment.'),
            'cotizar': ('This week\'s price', 'Get a quote', 'Fill in your details and WhatsApp opens with your message ready. We reply with the price and available fruit.', 'Get a rambutan quote by the ton: fill in your details and WhatsApp opens with your message ready for Ixchel, Soconusco Fruit.'),
            'contacto': ('Tuxtla Chico, Chiapas', 'Contact', 'WhatsApp, phone, email and how to reach the orchard. If you want to visit, let us know and we will be there.', 'Contact Ixchel, Soconusco Fruit: WhatsApp +52 962 170 7553, ventasixchelfrutas@gmail.com and the orchard location in Tuxtla Chico, Chiapas.'),
        },
        'tarjetas': {
            'titulo': 'Everything for your order', 'lead': 'Each thing in its place. Pick where to start.',
            'fruta': 'Varieties, sizes, spec sheet and season.',
            'pedidos': 'Work out boxes, vehicle and days to your city.',
            'agenda': 'Book a phone or video call with us.',
            'preguntas': 'Transport, minimum order, samples and payment.',
            'cotizar': 'Your WhatsApp message ready in a minute.',
            'contacto': 'Phone, email and how to reach the orchard.',
            'ir': 'Go to',
        },
    },
}

FLECHA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"/></svg>'
SIGUE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>'
DROP = '<svg viewBox="0 0 16 10" aria-hidden="true"><path d="M2 2l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>'

# figuras del menú: dibujadas para el negocio (racimo, camión cargado, calendario de corte, pregunta, ticket, huerta)
SIMBOLOS = '''
  <symbol id="p-fruta" viewBox="0 0 64 64"><path d="M32 4c2 6 2 10 0 15" fill="none" stroke="var(--leaf-vein)" stroke-width="2.5"/><path d="M33 9c6-6 15-6 20-2-6 5-14 5-20 2z" fill="var(--leaf-fill)"/><use href="#fruta" x="6" y="16" width="30" height="31"/><use href="#fruta" x="26" y="18" width="30" height="31"/><use href="#fruta" x="15" y="33" width="30" height="31"/></symbol>
  <symbol id="p-camion" viewBox="0 0 64 64"><g class="tile__load"><rect x="6" y="18" width="11" height="11" fill="#b5762c"/><rect x="18" y="18" width="11" height="11" fill="#b5762c"/><rect x="30" y="18" width="11" height="11" fill="#b5762c"/><rect x="12" y="7" width="11" height="11" fill="#d9974a"/><rect x="24" y="7" width="11" height="11" fill="#d9974a"/><circle cx="11.5" cy="23.5" r="2.6" fill="var(--fruit-skin)"/><circle cx="23.5" cy="23.5" r="2.6" fill="var(--fruit-skin)"/><circle cx="35.5" cy="23.5" r="2.6" fill="var(--fruit-skin)"/></g><path d="M4 30h40v14H4zM44 34h9l7 7v3H44z" fill="var(--red)"/><path d="M47 36h5l4 4h-9z" fill="var(--paper-ink)"/><circle cx="14" cy="47" r="6" fill="var(--paper-ink)"/><circle cx="14" cy="47" r="2.2" fill="var(--paper)"/><circle cx="50" cy="47" r="6" fill="var(--paper-ink)"/><circle cx="50" cy="47" r="2.2" fill="var(--paper)"/></symbol>
  <symbol id="p-agenda" viewBox="0 0 64 64"><rect x="8" y="12" width="48" height="44" fill="var(--paper-ink)"/><rect x="8" y="12" width="48" height="11" fill="var(--red)"/><rect x="17" y="6" width="5" height="12" fill="var(--paper-ink)"/><rect x="42" y="6" width="5" height="12" fill="var(--paper-ink)"/><g fill="var(--paper)"><rect x="14" y="28" width="8" height="7"/><rect x="28" y="28" width="8" height="7"/><rect x="14" y="40" width="8" height="7"/><rect x="28" y="40" width="8" height="7"/><rect x="42" y="40" width="8" height="7"/></g><use class="tile__mark" href="#fruta" x="40" y="26" width="12" height="12"/></symbol>
  <symbol id="p-pregunta" viewBox="0 0 64 64"><path d="M6 8h52v36H30L16 56V44H6z" fill="var(--paper-ink)"/><path d="M24 21c0-5 3.6-8 8-8s8 3 8 7c0 6-8 6-8 12" fill="none" stroke="var(--paper)" stroke-width="4.5" stroke-linecap="square"/><rect x="29.5" y="35" width="5" height="5" fill="var(--fruit-skin)"/></symbol>
  <symbol id="p-cupon" viewBox="0 0 64 64"><path d="M4 16h56v10a6 6 0 0 0 0 12v10H4V38a6 6 0 0 0 0-12z" fill="var(--red)"/><path d="M22 18v28" stroke="var(--paper)" stroke-width="2.4" stroke-dasharray="3 3"/><use href="#fruta" x="7" y="24" width="12" height="13"/><g fill="var(--paper)"><rect x="28" y="24" width="24" height="4"/><rect x="28" y="31" width="18" height="4"/><rect x="28" y="38" width="12" height="4"/></g></symbol>
  <symbol id="p-huerta" viewBox="0 0 64 64"><path d="M2 54l16-24 9 12 12-20 23 32z" fill="var(--leaf-fill)"/><path d="M39 22l5 7-5 1-4-2z" fill="var(--paper)"/><path d="M32 4c-7 0-12 5-12 11 0 8 12 22 12 22s12-14 12-22c0-6-5-11-12-11z" fill="var(--red)"/><circle cx="32" cy="15" r="4.5" fill="var(--paper)"/><rect x="0" y="54" width="64" height="6" fill="var(--paper-ink)"/></symbol>
'''


def enlace(lang, pagina, actual):
    """ruta relativa desde la página actual (todas viven en la misma carpeta)"""
    return L[lang]['archivo'][pagina]


def nav(lang, actual, clase):
    t = L[lang]
    items = []
    for p in ORDEN[1:]:
        if p == 'contacto':
            continue
        cur = ' aria-current="page"' if p == actual else ''
        items.append(f'<a class="link" href="{enlace(lang, p, actual)}"{cur}>{t["menu"][p]}</a>')
    cur = ' aria-current="page"' if actual == 'contacto' else ''
    items.append(f'<a class="link drop-btn" href="{enlace(lang, "contacto", actual)}"{cur} aria-controls="menu-contacto" aria-haspopup="true">{t["menu"]["contacto"]} {DROP}</a>')
    corto, hl, aria, _ = t['lang']
    otro = L[t['otro']]
    destino = ('../' if lang == 'en' else 'en/') + otro['archivo'][actual]
    if destino.endswith('index.html'):
        destino = destino[:-len('index.html')] or './'
    items.append(f'<a class="lang" href="{destino}" hreflang="{hl}" lang="{hl}" aria-label="{aria}">{corto}</a>')
    return f'<nav class="{clase}" aria-label="{t["secciones"]}">\n      ' + '\n      '.join(items) + '\n    </nav>'


def barra(lang, actual):
    t = L[lang]
    inicio = enlace(lang, 'index', actual)
    return f'''<header class="bar" data-bar>
  <div class="bar__in">
    <a class="bar__back" href="{inicio}" aria-label="{t['volver']}">{FLECHA}</a>
    <a class="brand bar__brand" href="{inicio}" aria-label="Ixchel, {t['inicio']}">
      <svg class="brand__logo" viewBox="0 0 120 120" aria-hidden="true"><use href="#logo"/></svg>
      <span class="brand__name">Ixchel</span>
    </a>
    <button class="bar__toggle" type="button" aria-expanded="false" aria-controls="bar-nav" data-abrir="{t['abrir']}" data-cerrar="{t['cerrar']}"><span class="bar__burger" aria-hidden="true"><i></i><i></i><i></i></span><span class="bar__label">{t['abrir']}</span></button>
    {nav(lang, actual, 'bar__nav" id="bar-nav')}
  </div>
</header>'''


def encabezado(lang, actual):
    t = L[lang]
    kicker, titulo, lead, _ = t['pagina'][actual]
    return f'''<div class="pagehead" data-pagehead>
  <div class="pagehead__in">
    <nav class="pagehead__crumbs small" aria-label="{t['migas']}"><a href="{enlace(lang, 'index', actual)}">{t['inicio']}</a><span aria-hidden="true">/</span><span aria-current="page">{t['menu'][actual]}</span></nav>
    <p class="pagehead__kicker">{kicker}</p>
    <h1 class="pagehead__title">{titulo}</h1>
    <p class="pagehead__lead">{lead}</p>
  </div>
  <svg class="pagehead__art" viewBox="0 0 64 64" aria-hidden="true"><use href="#{ICONO[actual]}"/></svg>
  <svg class="pagehead__fruit" viewBox="0 0 100 104" aria-hidden="true"><use href="#fruta"/></svg>
</div>'''


def tarjetas(lang):
    t = L[lang]
    k = t['tarjetas']
    filas = []
    for i, p in enumerate(ORDEN[1:], 1):
        filas.append(f'''    <li data-reveal style="--i:{min(i, 4)}"><a class="tile" href="{enlace(lang, p, 'index')}">
      <span class="tile__num nums" aria-hidden="true">{i:02d}</span>
      <svg class="tile__ico" viewBox="0 0 64 64" aria-hidden="true"><use href="#{ICONO[p]}"/></svg>
      <span class="tile__name">{t['menu'][p] if p != 'pedidos' else t['pagina']['pedidos'][1]}</span>
      <span class="tile__text">{k[p]}</span>
      <span class="tile__go"><span class="sr-only">{k['ir']} {t['menu'][p]}</span>{SIGUE}</span>
    </a></li>''')
    return f'''<section class="tiles section" id="paginas" aria-labelledby="t-paginas">
  <div class="tiles__head" data-reveal>
    <h2 class="tiles__title" id="t-paginas">{k['titulo']}</h2>
    <p class="tiles__lead">{k['lead']}</p>
  </div>
  <ul class="tiles__grid" role="list">
{chr(10).join(filas)}
  </ul>
</section>'''


def reescribir_enlaces(s, lang, actual):
    def cambia(m):
        ident = m.group(2)
        destino = SECCION.get(ident)
        if destino is None:
            return m.group(0)
        if destino == actual:
            nuevo = '#' + ident
        elif ident in ('inicio',) or ident == primera[destino]:
            nuevo = enlace(lang, destino, actual)
        else:
            nuevo = f'{enlace(lang, destino, actual)}#{ident}'
        return f'{m.group(1)}href="{nuevo}"'
    # solo enlaces <a>: los <use href="#fruta"> son dibujos y no se tocan
    return re.sub(r'(<a\b[^>]*?\s)href="#([\w-]+)"', cambia, s)


primera = {'index': 'inicio', 'fruta': 'fruta', 'pedidos': 'volumen', 'agenda': 'agenda', 'preguntas': 'preguntas', 'cotizar': 'cotizar', 'contacto': 'contacto'}


def cabeza(head, lang, actual):
    t = L[lang]
    url = t['url'] + ('' if actual == 'index' else t['archivo'][actual])
    otro = L[t['otro']]
    url_otro = otro['url'] + ('' if actual == 'index' else otro['archivo'][actual])
    es_url, en_url = (url, url_otro) if lang == 'es' else (url_otro, url)
    if actual != 'index':
        _, titulo, _, desc = t['pagina'][actual]
        marca = 'Ixchel, Frutas del Soconusco' if lang == 'es' else 'Ixchel, Soconusco Fruit'
        head = re.sub(r'<title>.*?</title>', f'<title>{html.escape(titulo)} · {marca}</title>', head, count=1)
        head = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + html.escape(desc), head, count=1)
        head = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + html.escape(f'{titulo} · {marca}'), head, count=1)
        head = re.sub(r'(<meta property="og:description" content=")[^"]*', lambda m: m.group(1) + html.escape(desc), head, count=1)
        # la organización va en la portada; las preguntas, en su página
        head = re.sub(r'<script type="application/ld\+json">\s*\{\s*"@context": "https://schema.org",\s*"@type": "Organization".*?</script>\n', '', head, count=1, flags=re.S)
    if actual != 'preguntas':
        head = re.sub(r'<script type="application/ld\+json" id="faq-ld">.*?</script>\n', '', head, count=1, flags=re.S)
    head = re.sub(r'(<meta property="og:url" content=")[^"]*', lambda m: m.group(1) + url, head, count=1)
    head = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m.group(1) + url, head, count=1)
    head = re.sub(r'(<link rel="alternate" hreflang="es-MX" href=")[^"]*', lambda m: m.group(1) + es_url, head, count=1)
    head = re.sub(r'(<link rel="alternate" hreflang="en" href=")[^"]*', lambda m: m.group(1) + en_url, head, count=1)
    head = re.sub(r'(<link rel="alternate" hreflang="x-default" href=")[^"]*', lambda m: m.group(1) + es_url, head, count=1)
    return head


def armar(lang, archivo_fuente, carpeta):
    s = (fuente / archivo_fuente).read_text(encoding='utf-8')
    i_loader = s.index('<div class="loader"')
    i_hero = s.index('<header class="hero"')
    i_main = s.index('<main>')
    i_fin = s.index('</main>')
    arriba, loader, hero, cuerpo, abajo = s[:i_loader], s[i_loader:i_hero], s[i_hero:i_main], s[i_main + len('<main>'):i_fin], s[i_fin + len('</main>'):]
    head, cuerpo_arriba = arriba.split('</head>', 1)
    # figuras del menú junto a los demás dibujos
    cuerpo_arriba = cuerpo_arriba.replace('  <defs>', SIMBOLOS + '  <defs>', 1)
    secciones = {}
    for m in re.finditer(r'<section class="[^"]*" id="([\w-]+)".*?\n</section>', cuerpo, re.S):
        secciones[m.group(1)] = m.group(0)
    faltan = [k for k in SECCION if k != 'inicio' and k not in secciones]
    assert not faltan, f'secciones que no encontré en {archivo_fuente}: {faltan}'

    # el menú de la portada apunta a las páginas
    hero = re.sub(r'<nav class="card__nav".*?</nav>', lambda m: nav(lang, 'index', 'card__nav'), hero, count=1, flags=re.S)

    for pagina in ORDEN:
        partes = []
        if pagina == 'index':
            partes += [loader, hero, '<main id="contenido">\n']
            for k in PORTADA:
                partes.append(tarjetas(lang) if k == '@menu' else secciones[k])
                partes.append('\n\n')
        else:
            partes += [barra(lang, pagina), '\n\n<main id="contenido">\n', encabezado(lang, pagina), '\n\n']
            for k, p in SECCION.items():
                if p == pagina and k in secciones:
                    partes.append(secciones[k])
                    partes.append('\n\n')
        partes.append('</main>')
        partes.append(abajo)
        pie = ''.join(partes)
        texto = cabeza(head, lang, pagina) + '</head>' + cuerpo_arriba + pie
        texto = texto.replace('<body>', f'<body data-pagina="{pagina}">', 1)
        texto = reescribir_enlaces(texto, lang, pagina)
        # idioma: cada página enlaza a su gemela
        t = L[lang]
        otro = L[t['otro']]
        destino = ('../' if lang == 'en' else 'en/') + otro['archivo'][pagina]
        if destino.endswith('index.html'):
            destino = destino[:-len('index.html')] or './'
        texto = re.sub(r'(<a class="foot__lang" href=")[^"]*', lambda m: m.group(1) + destino, texto)
        # "volver arriba" en las páginas sube a la barra
        if pagina != 'index':
            texto = texto.replace(f'class="foot__up" href="{enlace(lang, "index", pagina)}"', 'class="foot__up" href="#contenido"')
        (carpeta / t['archivo'][pagina]).write_text(texto, encoding='utf-8')
        print(f'{carpeta.relative_to(raiz) if carpeta != raiz else "."}/{t["archivo"][pagina]}')


armar('es', 'sitio.html', raiz)
(raiz / 'en').mkdir(exist_ok=True)
armar('en', 'sitio-en.html', raiz / 'en')
