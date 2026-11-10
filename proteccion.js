// Ixchel: protección contra copias y suplantación.
// Si esta página se abre desde una dirección que no es la oficial, o metida dentro de otra página,
// avisa al visitante y le da el enlace a la página verdadera.
//
// Si un día el sitio se muda a un dominio propio (por ejemplo ixchelfrutas.mx), agrégalo en DOMINIOS
// y cambia OFICIAL. Si no, la página verdadera mostraría el aviso.
(() => {
  const OFICIAL = 'https://oscar20001.github.io/rambutan-chiapas/';
  const DOMINIOS = ['oscar20001.github.io'];

  const host = location.hostname.toLowerCase();
  const local = !host || location.protocol === 'file:' || /^(localhost$|127\.|0\.0\.0\.0$|192\.168\.|10\.|\[?::1\]?$)/.test(host);
  const traductor = /\.translate\.goog$/.test(host); // Google Translate muestra la página desde su propia dirección
  const propio = DOMINIOS.includes(host) && (host !== 'oscar20001.github.io' || location.pathname.startsWith('/rambutan-chiapas'));
  let enmarcado = false;
  try { enmarcado = window.top !== window.self && window.top.location.hostname !== host; } catch (e) { enmarcado = true; }

  if ((propio || local || traductor) && !enmarcado) return;

  // Si otra página nos metió en un marco, intentamos salir a la dirección verdadera.
  // Si lo logramos, la página se recarga sola; si no nos dejan, a los 0.8 s se muestra el aviso.
  let espera = 0;
  if (enmarcado && (propio || local)) { try { window.top.location.href = window.self.location.href; espera = 800; } catch (e) { /* no nos dejaron */ } }

  const en = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const t = en
    ? { h: 'Warning: this is not the official Ixchel page', p: 'This address is a copy. Do not pay or share your details here. The only official site is:', b: 'Go to the official site' }
    : { h: 'Cuidado: esta no es la página oficial de Ixchel', p: 'Esta dirección es una copia. No pagues ni compartas tus datos aquí. El único sitio oficial es:', b: 'Ir al sitio oficial' };

  const aviso = () => {
    if (document.getElementById('ixchel-aviso-copia')) return;
    const d = document.createElement('div');
    d.id = 'ixchel-aviso-copia';
    d.setAttribute('role', 'alert');
    d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(12,36,22,.96);color:#f4d96c;font:18px/1.45 Georgia,serif;text-align:center;overflow:auto';
    const c = document.createElement('div');
    c.style.cssText = 'max-width:34rem';
    const h = document.createElement('p'); h.textContent = t.h; h.style.cssText = 'margin:0 0 12px;font:700 26px/1.15 Arial,sans-serif;color:#fff';
    const p = document.createElement('p'); p.textContent = t.p; p.style.cssText = 'margin:0 0 8px';
    const u = document.createElement('p'); u.textContent = OFICIAL.replace('https://', ''); u.style.cssText = 'margin:0 0 20px;font-weight:700;word-break:break-all;color:#fff';
    const a = document.createElement('a'); a.href = OFICIAL; a.rel = 'noopener'; a.target = '_top'; a.textContent = t.b;
    a.style.cssText = 'display:inline-block;padding:14px 22px;border-radius:999px;background:#f4d96c;color:#133621;font:700 18px/1 Arial,sans-serif;text-decoration:none';
    c.append(h, p, u, a); d.append(c); document.body.append(d);
  };
  const mostrar = () => setTimeout(aviso, espera);
  if (document.body) mostrar(); else document.addEventListener('DOMContentLoaded', mostrar);
})();
