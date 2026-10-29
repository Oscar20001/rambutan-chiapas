# Agenda de llamadas: cómo conectarla a tu Google Calendar

La agenda del sitio ya funciona sin esto: cuando alguien elige día y hora, se abre WhatsApp con su
solicitud. Al conectar Google Calendar, además:

- La cita se aparta sola y aparece en tu Google Calendar, con aviso 30 y 5 minutos antes.
- Te llega un correo y se anota en la hoja "Citas Ixchel" de tu Google Drive.
- El sitio marca como ocupadas solo las horas que ya apartó un comprador. Tus eventos personales no cuentan.
- **Solo tú ves nombres y teléfonos.** Los visitantes solo ven qué horas están libres u ocupadas.

Toma unos 10 minutos y es gratis. Necesitas la cuenta de Google donde quieres recibir las citas.

## Pasos

1. Entra a <https://script.google.com> con tu cuenta de Google y toca **Nuevo proyecto**.
2. Arriba, cambia el nombre "Proyecto sin título" por **Agenda Ixchel**.
3. Borra todo lo que hay en `Código.gs` y pega el contenido completo de `agenda/Codigo.gs` de este repositorio.
4. Toca el engrane **Configuración del proyecto** (a la izquierda) y en **Zona horaria** elige
   `(GMT-06:00) Hora central - Ciudad de México`.
5. Regresa al editor y toca **Implementar → Nueva implementación**.
   - En el engrane de "Seleccionar tipo", elige **Aplicación web**.
   - Descripción: `Agenda del sitio`.
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier usuario**.
   - Toca **Implementar** y luego **Autorizar acceso**. Google te avisa que la app no está verificada:
     toca **Configuración avanzada → Ir a Agenda Ixchel** y **Permitir**. Es tu propio script, por eso sale ese aviso.
6. Copia la **URL de la aplicación web**. Termina en `/exec`.
7. Mándamela, o pégala tú en `app.js`, en la línea `const AGENDA_URL = '';`, entre las comillas.

Listo. Para ver tus citas abre Google Calendar en tu celular o en <https://calendar.google.com>.
La hoja **Citas Ixchel** queda en tu Google Drive con todas las citas recibidas.

## Cambiar el horario

El horario está en dos lugares y deben coincidir:

- `app.js`: `const AGENDA = { desde: 7, hasta: 18.5, ... }` (18.5 es la última cita, a las 18:30).
- `agenda/Codigo.gs`: `DESDE` y `HASTA`. Después de cambiarlo, en Apps Script toca
  **Implementar → Administrar implementaciones → editar → Versión: nueva** para publicarlo.

Para bloquear un rato o un día (por ejemplo, un domingo de descanso), crea en tu Google Calendar un
evento cuyo título empiece con **Ocupado** (por ejemplo "Ocupado: viaje a Tapachula"). El sitio mostrará
esas horas ocupadas. Si es un evento de todo el día, bloquea el día completo.

## Actualizar el script cuando cambie `Codigo.gs`

1. En script.google.com abre **Agenda Ixchel**, borra todo el código y pega el nuevo `agenda/Codigo.gs`. Guarda (Ctrl + S).
2. Toca **Implementar → Administrar implementaciones**, luego el **lápiz** (editar).
3. En **Versión** elige **Nueva versión** y toca **Implementar**. La URL no cambia.
