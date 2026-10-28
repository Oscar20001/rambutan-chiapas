// Agenda de Ixchel: guarda las citas del sitio en tu Google Calendar y en una hoja de cálculo.
// Se pega en script.google.com y se publica como "Aplicación web" (ver LEEME.md).
// Solo tú ves los nombres y teléfonos: el sitio recibe únicamente qué horas están ocupadas.
// Una hora sale ocupada solo si un comprador ya la apartó desde el sitio, o si tú creas en tu
// calendario un evento cuyo título empiece con "Ocupado" (para bloquear un rato o un día).
// Tus demás eventos personales no cuentan.

const ZONA = 'America/Mexico_City'; // Chiapas usa la misma hora todo el año (UTC−6)
const DESDE = 7;      // primera cita: 7:00
const HASTA = 22.5;   // última cita: 22:30, termina a las 23:00
const MINUTOS = 30;   // duración de cada cita
const MAX_DIAS = 31;

function calendario() {
  return CalendarApp.getDefaultCalendar();
}

// ¿Este evento ocupa la agenda? Las citas del sitio llevan la etiqueta ixchel=cita.
function ocupa(ev) {
  if (ev.isAllDayEvent()) return /^ocupado/i.test(ev.getTitle());
  return ev.getTag('ixchel') === 'cita' || /^ocupado/i.test(ev.getTitle());
}

// Hoja "Citas Ixchel" en tu Google Drive: se crea sola la primera vez.
function hoja() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('HOJA');
  let libro;
  if (id) {
    try { libro = SpreadsheetApp.openById(id); } catch (e) { libro = null; }
  }
  if (!libro) {
    libro = SpreadsheetApp.create('Citas Ixchel');
    libro.getSheets()[0].appendRow(['Recibida', 'Día y hora (Chiapas)', 'Medio', 'Nombre', 'Teléfono', 'Empresa y ciudad', 'Notas', 'Idioma']);
    props.setProperty('HOJA', libro.getId());
  }
  return libro.getSheets()[0];
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// "2026-10-29T09:30" en hora de Chiapas → Date
function fecha(clave) {
  return new Date(clave + ':00-06:00');
}

function clave(d) {
  return Utilities.formatDate(d, ZONA, "yyyy-MM-dd'T'HH:mm");
}

// GET ?desde=2026-10-28&dias=14 → { ok, ocupados: ["2026-10-28T09:00", ...] }
function doGet(e) {
  try {
    const desde = String((e.parameter || {}).desde || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(desde)) return responder({ ok: false, error: 'desde' });
    const dias = Math.min(MAX_DIAS, Math.max(1, Number(e.parameter.dias) || 14));
    const inicio = fecha(desde + 'T00:00');
    const fin = new Date(inicio.getTime() + dias * 864e5);
    const ocupados = {};
    calendario().getEvents(inicio, fin).forEach(function (ev) {
      if (!ocupa(ev)) return;
      const a = Math.max(ev.getStartTime().getTime(), inicio.getTime()), b = Math.min(ev.getEndTime().getTime(), fin.getTime());
      // marca cada media hora que el evento toca
      let t = Math.floor(a / (MINUTOS * 60e3)) * MINUTOS * 60e3;
      for (; t < b; t += MINUTOS * 60e3) ocupados[clave(new Date(t))] = true;
    });
    return responder({ ok: true, ocupados: Object.keys(ocupados) });
  } catch (err) {
    return responder({ ok: false, error: 'servidor' });
  }
}

// POST con la cita en JSON → { ok } o { ok: false, error: 'ocupada' | 'datos' | 'horario' }
function doPost(e) {
  let c;
  try { c = JSON.parse(e.postData.contents); } catch (err) { return responder({ ok: false, error: 'datos' }); }
  const texto = function (v, max) { return String(v || '').replace(/[\r\n]+/g, ' ').trim().slice(0, max); };
  const nombre = texto(c.nombre, 80), telefono = texto(c.telefono, 40);
  const empresa = texto(c.empresa, 120), notas = texto(c.notas, 300);
  const medio = ['llamada', 'whatsapp', 'video'].indexOf(c.medio) >= 0 ? c.medio : 'llamada';
  if (!nombre || !telefono || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(String(c.inicio))) return responder({ ok: false, error: 'datos' });

  const inicio = fecha(c.inicio);
  const fin = new Date(inicio.getTime() + MINUTOS * 60e3);
  const h = Number(c.inicio.slice(11, 13)) + Number(c.inicio.slice(14, 16)) / 60;
  if (h < DESDE || h > HASTA || (h * 60) % MINUTOS !== 0) return responder({ ok: false, error: 'horario' });
  if (inicio.getTime() < Date.now() + 30 * 60e3 || inicio.getTime() > Date.now() + MAX_DIAS * 864e5) return responder({ ok: false, error: 'horario' });

  const candado = LockService.getScriptLock();
  candado.waitLock(10000);
  try {
    if (calendario().getEvents(inicio, fin).some(ocupa)) return responder({ ok: false, error: 'ocupada' });
    const nombresMedio = { llamada: 'Llamada', whatsapp: 'WhatsApp', video: 'Videollamada' };
    const tel = telefono.replace(/[^\d+]/g, '');
    const ev = calendario().createEvent(
      nombresMedio[medio] + ' · ' + nombre,
      inicio,
      fin,
      { description: ['Teléfono: ' + telefono, 'WhatsApp: https://wa.me/' + tel.replace(/^\+/, ''), empresa && 'Empresa y ciudad: ' + empresa, notas && 'Notas: ' + notas, 'Idioma: ' + (c.idioma === 'en' ? 'inglés' : 'español'), 'Agendada desde el sitio web'].filter(Boolean).join('\n') }
    );
    ev.setTag('ixchel', 'cita');
    ev.addPopupReminder(30);
    ev.addPopupReminder(5);
    hoja().appendRow([new Date(), c.inicio.replace('T', ' '), nombresMedio[medio], nombre, "'" + telefono, empresa, notas, c.idioma === 'en' ? 'inglés' : 'español']);
    try {
      MailApp.sendEmail(Session.getEffectiveUser().getEmail(), 'Nueva cita: ' + nombresMedio[medio] + ' con ' + nombre + ', ' + c.inicio.replace('T', ' '),
        'Teléfono: ' + telefono + '\nEmpresa y ciudad: ' + (empresa || '-') + '\nNotas: ' + (notas || '-') + '\n\nYa está en tu Google Calendar.');
    } catch (err) { /* sin correo, la cita igual queda en el calendario */ }
    return responder({ ok: true });
  } finally {
    candado.releaseLock();
  }
}
