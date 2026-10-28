# Ixchel, Frutas del Soconusco

Sitio de venta de rambután por tonelada desde Tuxtla Chico, Chiapas.

Sitio estático (HTML, CSS y JavaScript sin dependencias) para conectar con compradores mayoristas de
rambután en todo México. Se abre directo con `index.html`.

## Antes de publicar

1. **Tu número de WhatsApp.** En `app.js`, línea `const WHATSAPP = '';`, escribe tu número con lada
   de país, solo dígitos. Ejemplo para un celular de Tapachula: `'5219621234567'`.
   Mientras esté vacío, los botones abren WhatsApp con el mensaje listo y dejan elegir el contacto.
2. **Contenido de muestra que debes confirmar** (está escrito para que el diseño se vea completo):
   - Temporada "julio a octubre, con pico en agosto y septiembre".
   - Pedido mínimo de 1 tonelada y caja de 10 kg (también en `KG_POR_CAJA` de `app.js`).
   - Rambután amarillo y la separación por calibres (pestañas de "La fruta").
   - Respuestas de preguntas frecuentes: muestra por paquetería, forma de pago, vida de anaquel.
   - Atención "lunes a sábado" y la firma "La familia productora".
   - Distancias por carretera en `CIUDADES` (`app.js`): son aproximadas, ajústalas con tu transportista.
   - Los rangos de "Pedidos por volumen" (1–3 t, 4–10 t, 11–22 t) y las capacidades de cada vehículo.
   - Los cinco "Compromisos con tu carga" (por ejemplo, mandar fotos y video antes de salir).
   - "Más frutas del Soconusco, pronto": mango, cacao y zapote mamey son ejemplos.
   - El nombre de la marca "Ixchel" aparece en `index.html` (título, etiqueta, carga, sello y pie).
3. **Fotos.** Las imágenes son ilustraciones hechas en código. Fotos reales de tu huerta, la cosecha,
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

- `index.html`: estructura y textos.
- `styles.css`: diseño (tres tintas: verde hoja, oro y rojo rambután).
- `app.js`: animación de carga, guía de embarque (unidades, camión que se llena, mapa con la ruta), pestañas, cupón que arma el mensaje de WhatsApp con su animación y entradas al hacer scroll.
