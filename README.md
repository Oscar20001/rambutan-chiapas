# Ixchel, Frutas del Soconusco

Sitio de venta de rambután por tonelada desde Tuxtla Chico, Chiapas.

Sitio estático (HTML, CSS y JavaScript sin dependencias) para conectar con compradores mayoristas de
rambután en todo México. Se abre directo con `index.html`.

## Lo que puedes cambiar

1. **WhatsApp.** En `app.js`, `const WHATSAPP = ['529622699611', '529621707553'];`. El primer número
   recibe los mensajes de todos los botones; los dos aparecen en el pie de página. Formato: 52 + 10 dígitos.
2. **Agenda de llamadas.** Funciona desde ya: la cita se pide por WhatsApp. Para que se aparte sola en tu
   Google Calendar y el sitio marque las horas ocupadas, sigue [`agenda/LEEME.md`](agenda/LEEME.md) y pega
   la dirección en `const AGENDA_URL = '';`. El horario está en `const AGENDA` (7:00 a 18:30, cada 30 min; atención hasta las 19:00).
3. **Precio de referencia.** `const PRECIO_KG = null;` en `app.js`. Si pones un número (pesos por kilo),
   la guía de embarque muestra el costo aproximado de la fruta del pedido.
4. **Temporada.** `const COSECHA` en `app.js` marca los meses de cosecha y de pico en el calendario.
5. **Inglés.** La página en inglés es `en/index.html` y se genera desde la de español con
   `python3 tools/traducir.py` y luego `python3 tools/faq.py` (las preguntas frecuentes para Google). Si cambias un texto en `index.html`, agrega su traducción en
   `tools/traducir.py` y vuelve a correrlo; el script avisa qué frases ya no encontró.
   Los textos que arma `app.js` (mensajes de WhatsApp, agenda, guía) están en `TEXTOS.es` y `TEXTOS.en`.
6. **Contenido de muestra que debes confirmar** (está escrito para que el diseño se vea completo):
   - Temporada "julio a octubre, con pico en agosto y septiembre".
   - Pedido mínimo de 1 tonelada y caja de 10 kg (también en `KG_POR_CAJA` de `app.js`).
   - Rambután amarillo y la separación por calibres (pestañas de "La fruta").
   - Ficha técnica: temperatura, humedad, vida de anaquel y cajas por tráiler.
   - Respuestas de preguntas frecuentes: muestra por paquetería, forma de pago, exportación.
   - La firma "La familia productora".
   - Distancias por carretera en `CIUDADES` (`app.js`): son aproximadas, ajústalas con tu transportista.
   - Los rangos de "Pedidos por volumen" (1–3 t, 4–10 t, 11–22 t) y las capacidades de cada vehículo.
   - Los cinco "Compromisos con tu carga" (por ejemplo, mandar fotos y video antes de salir).
   - "Más frutas del Soconusco, pronto": mango, cacao y zapote mamey son ejemplos.
   - El nombre de la marca "Ixchel" aparece en `index.html` (título, etiqueta, carga, sello y pie).
7. **Fotos.** Las imágenes son ilustraciones hechas en código. Fotos reales de tu huerta, la cosecha,
   las cajas y el camión cargando harán el sitio mucho más creíble. Los lugares para cambiarlas:
   el fondo del inicio (`.hero__art`), el cuadro de "La fruta" (`.plate__pic`) y las dos imágenes de
   preguntas (`.faq__tall`, `.faq__square`).

## Publicación

El sitio se publica con GitHub Pages desde la rama `main`, carpeta `/ (root)`, en
https://oscar20001.github.io/rambutan-chiapas/. Cada cambio que se sube a `main` se publica solo
en uno o dos minutos.

Para verlo en tu computadora, abre `index.html` en el navegador.

## Marca

`img/logo.svg` es el logo: la luna con el conejo blanco (en la tradición maya acompaña a Ixchel, diosa
de la luna), la pirámide escalonada y un perfil maya con penacho. El mismo dibujo está dentro de
`index.html` como `<symbol id="logo">` para usarlo en la etiqueta, el sello y el pie.

## Archivos

- `index.html`: estructura y textos en español. `en/index.html`: la misma página en inglés (generada).
- `agenda/Codigo.gs` y `agenda/LEEME.md`: el script de Google que guarda las citas en tu calendario.
- `tools/traducir.py`: genera la página en inglés.
- `styles.css`: diseño (tres tintas: verde hoja, oro y rojo rambután).
- `app.js`: animación de carga, guía de embarque (unidades, camión que se llena, mapa con la ruta), pestañas, calendario de cosecha, ficha imprimible, agenda de llamadas, cupón que arma el mensaje de WhatsApp, botón flotante y entradas al hacer scroll.
