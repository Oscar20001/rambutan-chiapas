// Ixchel: medición de visitas. Cuenta cuántas personas entran, de dónde vienen, qué páginas ven
// y qué botones tocan (WhatsApp, llamar, correo, agenda, cotizar).
//
// Metricool ya está encendido. Para Clarity y Google Analytics pega aquí tus códigos
// (ver README, sección "Estadísticas de visitas"). Un código vacío no carga nada.

// Metricool: visitas de la web dentro del mismo panel de Metricool donde ves las redes. Ya está puesto.
const METRICOOL_HASH = '73a69efa0c08b2a05b29631feab54a7a';

// Microsoft Clarity: mapas de calor y grabaciones de cómo se mueve la gente en la página. Ejemplo: 'abc123xyz9'
const CLARITY_ID = 'z9m7y76m8q';

// Google Analytics 4: número de visitas, ciudades, de qué red social llegan y qué páginas ven. Ejemplo: 'G-AB12CD34EF'
const GA_ID = '';

// ---------- de aquí para abajo no hace falta cambiar nada ----------

(() => {
  const local = /^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname) || location.protocol === 'file:';
  if (local) return; // no contar las pruebas en la computadora

  const clarity = /^[a-z0-9]{6,20}$/i.test(CLARITY_ID);
  const ga = /^G-[A-Z0-9]{4,16}$/i.test(GA_ID);
  const metricool = /^[a-f0-9]{32}$/.test(METRICOOL_HASH);
  if (!clarity && !ga && !metricool) return;

  const cargar = (src, listo) => { const s = document.createElement('script'); s.async = true; s.src = src; if (listo) s.onload = listo; document.head.appendChild(s); };

  if (metricool) cargar('https://tracker.metricool.com/resources/be.js', () => { try { window.beTracker.t({ hash: METRICOOL_HASH }); } catch (e) { /* sin Metricool */ } });

  if (clarity) {
    window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    cargar('https://www.clarity.ms/tag/' + CLARITY_ID);
    window.clarity('set', 'idioma', document.documentElement.lang || 'es');
  }

  if (ga) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
    cargar('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID));
  }

  // Un evento = un botón importante que alguien tocó. Sale en GA4 (Eventos) y en Clarity (Filtros > Eventos personalizados).
  const evento = (nombre, datos = {}) => {
    const pagina = location.pathname.replace(/^.*\//, '') || 'index.html';
    if (ga) window.gtag('event', nombre, { pagina, ...datos });
    if (clarity) { window.clarity('event', nombre); if (datos.boton) window.clarity('set', 'ultimo_boton', String(datos.boton)); }
  };
  window.ixMedir = evento;

  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a, button');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (a.hasAttribute('data-wa') || /wa\.me|whatsapp/i.test(href)) evento('clic_whatsapp', { boton: a.getAttribute('data-wa') || 'enlace' });
    else if (href.startsWith('tel:')) evento('clic_llamar');
    else if (href.startsWith('mailto:')) evento('clic_correo');
    else if (/maps\.(google|app)|goo\.gl\/maps/.test(href)) evento('clic_mapa');
    else if (/facebook\.com|tiktok\.com|instagram\.com/.test(href)) evento('clic_red_social', { boton: new URL(href, location.href).hostname });
  }, true);

  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f && f.id) evento(f.id === 'agenda-form' ? 'agenda_enviada' : 'formulario_' + f.id);
  }, true);

  // Qué tanto bajan en la página: 25, 50, 75 y 100 %
  const marcas = [25, 50, 75, 100];
  addEventListener('scroll', () => {
    const alto = document.documentElement.scrollHeight - innerHeight;
    if (alto <= 0 || !marcas.length) return;
    const pct = (scrollY / alto) * 100;
    while (marcas.length && pct >= marcas[0] - 1) evento('bajo_pagina', { porcentaje: marcas.shift() });
  }, { passive: true });
})();
