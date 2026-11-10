# Ixchel, Frutas del Soconusco

Sitio de venta de rambután por tonelada desde Tuxtla Chico, Chiapas.

Sitio estático (HTML, CSS y JavaScript sin dependencias) para conectar con compradores mayoristas de
rambután en todo México. Se abre directo con `index.html`.

## Páginas

El sitio está repartido en páginas: Inicio (`index.html`), La fruta (`fruta.html`), Pedidos y flete
(`pedidos.html`), Agenda (`agenda.html`), Preguntas (`preguntas.html`), Cotizar (`cotizar.html`) y
Contacto (`contacto.html`), y sus gemelas en inglés en `en/`. Cada página tiene una barra con el logo y una
flecha que regresan al inicio, y un menú que en celular se abre en una hoja.

**No edites esas páginas a mano: se generan.** Los textos viven en una sola fuente,
`tools/fuente/sitio.html`. Después de cambiarla corre, en este orden:

```bash
python3 tools/traducir.py   # arma tools/fuente/sitio-en.html (inglés)
python3 tools/faq.py        # preguntas frecuentes para Google
python3 tools/paginas.py    # reparte todo en las páginas del sitio (es y en)
```

Qué sección va en qué página, los títulos de cada encabezado y las tarjetas de la portada están en
`tools/paginas.py`.

**Sin internet.** `sw.js` guarda el sitio en el celular de quien lo visita: si se va la señal, las páginas ya
vistas siguen abriendo y aparece un aviso con el logo; las que no estén guardadas muestran `offline.html`, con el
logo animado y el teléfono. Cuando cambies archivos del sitio, sube `VERSION` en `sw.js` para que bajen lo nuevo.

## Lo que puedes cambiar

1. **WhatsApp.** En `app.js`, `const WHATSAPP = ['529621707553'];`. Ese número
   recibe los mensajes de todos los botones y aparece en el pie de página. Formato: 52 + 10 dígitos.
2. **Agenda de llamadas.** Funciona desde ya: la cita se pide por WhatsApp. Para que se aparte sola en tu
   Google Calendar y el sitio marque las horas ocupadas, sigue [`agenda/LEEME.md`](agenda/LEEME.md) y pega
   la dirección en `const AGENDA_URL = '';`. El horario está en `const AGENDA` (7:00 a 18:30, cada 30 min; atención hasta las 19:00).
3. **Precio de referencia.** `const PRECIO_KG = null;` en `app.js`. Si pones un número (pesos por kilo),
   la guía de embarque muestra el costo aproximado de la fruta del pedido.
4. **Temporada.** `const COSECHA` en `app.js` marca los meses de cosecha y de pico en el calendario.
5. **Inglés.** Las páginas en inglés (`en/`) se generan desde la fuente en español con
   `python3 tools/traducir.py`, `python3 tools/faq.py` y `python3 tools/paginas.py`. Si cambias un texto en `tools/fuente/sitio.html`, agrega su traducción en
   `tools/traducir.py` y vuelve a correrlo; el script avisa qué frases ya no encontró.
   Los textos que arma `app.js` (mensajes de WhatsApp, agenda, guía) están en `TEXTOS.es` y `TEXTOS.en`.
6. **Contenido de muestra que debes confirmar** (está escrito para que el diseño se vea completo):
   - Temporada "julio a octubre, con pico en agosto y septiembre".
   - Pedido mínimo de 1 tonelada y caja de 10 kg (también en `KG_POR_CAJA` de `app.js`).
   - Rambután amarillo y la separación por calibres (pestañas de "La fruta").
   - Ficha técnica: temperatura, humedad, vida de anaquel y cajas por tráiler.
   - Respuestas de preguntas frecuentes: forma de pago, exportación (la muestra ya está confirmada: se prueba en la huerta, no se envía).
   - La firma "La familia productora".
   - Distancias por carretera en `CIUDADES` (`app.js`): son aproximadas, ajústalas con tu transportista.
   - Los rangos de "Pedidos por volumen" (1–3 t, 4–10 t, 11–22 t) y las capacidades de cada vehículo.
   - Los cinco "Compromisos con tu carga" (por ejemplo, mandar fotos y video antes de salir).
   - "Más frutas del Soconusco, pronto": mango, cacao y zapote mamey son ejemplos.
   - El nombre de la marca "Ixchel" aparece en `tools/fuente/sitio.html` (título, etiqueta, carga, sello y pie).
7. **Fotos.** Las imágenes son ilustraciones hechas en código. Fotos reales de tu huerta, la cosecha,
   las cajas y el camión cargando harán el sitio mucho más creíble. Los lugares para cambiarlas:
   el fondo del inicio (`.hero__art`), el cuadro de "La fruta" (`.plate__pic`) y las dos imágenes de
   preguntas (`.faq__tall`, `.faq__square`).

## Protección contra copias

- `proteccion.js` se carga en todas las páginas. Si la página se abre desde una dirección que no es la oficial, o metida dentro de otra página, tapa todo con un aviso y da el enlace al sitio verdadero.
- **Si el sitio se muda a un dominio propio**, agrega el dominio en `DOMINIOS` y cambia `OFICIAL` dentro de `proteccion.js`, y actualiza la dirección en `oficial.html` y `en/official.html`. Si no, la página verdadera mostraría el aviso.
- `oficial.html` (y `en/official.html`) lista los únicos canales oficiales y cómo reportar una suplantación.

## Estadísticas de visitas

El archivo `medicion.js` mide las visitas. Una herramienta vacía no se carga.

- **Metricool** (ya encendido con `METRICOOL_HASH`): visitas de la web en el mismo panel de las redes, en Analítica → Web.
- **Microsoft Clarity** (https://clarity.microsoft.com): mapas de calor (dónde dan clic y hasta dónde bajan) y grabaciones de cómo usa la gente cada página. Pega el código del proyecto en `CLARITY_ID`.
- **Google Analytics 4** (https://analytics.google.com): cuántas personas entran, de qué ciudad, desde qué red social y qué páginas ven. Pega el "ID de medición" (empieza con `G-`) en `GA_ID`.

Eventos que se cuentan: `clic_whatsapp` (con el botón que tocaron), `clic_llamar`, `clic_correo`, `clic_mapa`, `clic_red_social`, `agenda_enviada` y `bajo_pagina` (25, 50, 75 y 100 %). No se mide nada al abrir el sitio en la propia computadora (localhost).

## Publicación

El sitio se publica con GitHub Pages desde la rama `main`, carpeta `/ (root)`, en
https://oscar20001.github.io/rambutan-chiapas/. Cada cambio que se sube a `main` se publica solo
en uno o dos minutos.

Para verlo en tu computadora, abre `index.html` en el navegador.

## Marca

`img/logo.svg` es el logo: la luna con el conejo blanco (en la tradición maya acompaña a Ixchel, diosa
de la luna), la pirámide escalonada y un perfil maya con penacho. El mismo dibujo está dentro de
`tools/fuente/sitio.html` como `<symbol id="logo">` para usarlo en la etiqueta, el sello y el pie.

## Archivos

- `tools/fuente/sitio.html`: estructura y textos en español (la fuente). `tools/paginas.py` la reparte en las páginas; `en/`: las mismas páginas en inglés (generadas).
- `agenda/Codigo.gs` y `agenda/LEEME.md`: el script de Google que guarda las citas en tu calendario.
- `tools/traducir.py`: genera la página en inglés.
- `styles.css`: diseño (tres tintas: verde hoja, oro y rojo rambután).
- `app.js`: animación de carga, guía de embarque (unidades, camión que se llena, mapa con la ruta), pestañas, calendario de cosecha, ficha imprimible, agenda de llamadas, cupón que arma el mensaje de WhatsApp, botón flotante y entradas al hacer scroll.
