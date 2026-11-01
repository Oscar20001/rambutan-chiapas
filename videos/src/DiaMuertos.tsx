import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/fonts';
import { TEXTO, TITULO } from './comun';
import { CORREO, TEL } from './marca';

// Día de Muertos en papel recortado: diorama de papel con fibra, orillas cortadas a mano y sombra entre capas.
// Animación a pasos (stop-motion, cambia cada 2 cuadros), cámara fija. Solo música, sin voz.

loadFont({ family: TEXTO, url: staticFile('eb-garamond-italic.woff2'), style: 'italic' });

export const DURACION_MUERTOS = 24;

const T = {
  pan: 3.2,
  abuela: 4.7,
  velas: 6.1,
  rambutan: 7.7,
  abuelo: 9.2,
  ola1: 10.6,
  huerta: 11.05,
  ola2: 14.6,
  final: 15.05,
  cierre: 18.7,
};

const rnd = (s: number) => {
  const x = Math.sin(s * 91.7 + 3.1) * 43758.5453;
  return x - Math.floor(x);
};
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const entre = (t: number, a: number, d: number) => clamp((t - a) / d);

const MORADO = '#5b2380';
const MORADO_O = '#3a1554';
const ROSA = '#ff3d8b';
const NARANJA = '#ff8a1a';
const AMARILLO = '#ffc21a';
const VERDE = '#2fb36b';
const AZUL = '#2f8fe0';
const CREMA = '#fff1d6';
const PICADO = [ROSA, NARANJA, AMARILLO, VERDE, AZUL, '#b04ae0'];

// ---------- filtros de papel ----------
const Filtros: React.FC = () => (
  <defs>
    <filter id="papel" x="-15%" y="-15%" width="130%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G" result="d" />
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="8" result="fib" />
      <feDiffuseLighting in="fib" surfaceScale="1.1" lightingColor="#ffffff" result="luz">
        <feDistantLight azimuth="235" elevation="62" />
      </feDiffuseLighting>
      <feComponentTransfer in="luz" result="luz2">
        <feFuncR type="linear" slope="0.5" intercept="0.55" />
        <feFuncG type="linear" slope="0.5" intercept="0.55" />
        <feFuncB type="linear" slope="0.5" intercept="0.55" />
      </feComponentTransfer>
      <feComposite in="luz2" in2="d" operator="in" result="luzr" />
      <feBlend in="d" in2="luzr" mode="multiply" result="tex" />
      <feDropShadow in="tex" dx="0" dy="6" stdDeviation="6" floodColor="#12001c" floodOpacity="0.55" />
    </filter>
    <filter id="papelSuave" x="-15%" y="-15%" width="130%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="11" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G" result="d" />
      <feDropShadow in="d" dx="0" dy="3" stdDeviation="3" floodColor="#12001c" floodOpacity="0.45" />
    </filter>
    <filter id="fibra" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed="2" result="fib" />
      <feDiffuseLighting in="fib" surfaceScale="1.4" lightingColor="#ffffff" result="luz">
        <feDistantLight azimuth="225" elevation="58" />
      </feDiffuseLighting>
      <feComponentTransfer in="luz" result="luz2">
        <feFuncR type="linear" slope="0.45" intercept="0.6" />
        <feFuncG type="linear" slope="0.45" intercept="0.6" />
        <feFuncB type="linear" slope="0.45" intercept="0.6" />
      </feComponentTransfer>
      <feComposite in="luz2" in2="SourceGraphic" operator="in" result="lr" />
      <feBlend in="SourceGraphic" in2="lr" mode="multiply" />
    </filter>
    <radialGradient id="brillo">
      <stop offset="0" stopColor="#ffd27a" stopOpacity="0.85" />
      <stop offset="0.4" stopColor="#ff9a2a" stopOpacity="0.3" />
      <stop offset="1" stopColor="#ff7a00" stopOpacity="0" />
    </radialGradient>
    <radialGradient id="luna">
      <stop offset="0" stopColor="#fff6dc" />
      <stop offset="1" stopColor="#f2d9a0" />
    </radialGradient>
  </defs>
);

// ---------- piezas ----------
// tira de papel picado: banderitas caladas colgando de un hilo
const PapelPicado: React.FC<{ x0: number; x1: number; y: number; n: number; alto: number; t: number; semilla?: number }> = ({ x0, x1, y, n, alto, t, semilla = 0 }) => {
  const ancho = (x1 - x0) / n;
  return (
    <g filter="url(#papelSuave)">
      <path d={`M ${x0} ${y} Q ${(x0 + x1) / 2} ${y + alto * 0.12} ${x1} ${y}`} stroke="#e8d6b0" strokeWidth={2} fill="none" />
      {Array.from({ length: n }, (_, i) => {
        const cx = x0 + ancho * (i + 0.5);
        const caida = Math.sin(((i + 0.5) / n) * Math.PI) * alto * 0.06;
        const meneo = Math.sin(t * 2.2 + i * 1.3 + semilla) * 3;
        const w = ancho * 0.9;
        const col = PICADO[(i + semilla) % PICADO.length];
        const fleco = Array.from({ length: 9 }, (_, k) => `L ${w / 2 - (w / 8) * k} ${alto * (k % 2 ? 0.9 : 1)}`).join(' ');
        return (
          <g key={i} transform={`translate(${cx} ${y + caida}) rotate(${meneo})`}>
            <path d={`M ${-w / 2} 0 L ${w / 2} 0 ${fleco} Z`} fill={col} />
            {/* calado: flor central y rombos */}
            <circle cx={0} cy={alto * 0.42} r={w * 0.16} fill="#1a0826" opacity={0.85} />
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <ellipse key={k} cx={Math.cos((k * Math.PI) / 3) * w * 0.24} cy={alto * 0.42 + Math.sin((k * Math.PI) / 3) * w * 0.24} rx={w * 0.07} ry={w * 0.045} transform={`rotate(${k * 60} ${Math.cos((k * Math.PI) / 3) * w * 0.24} ${alto * 0.42 + Math.sin((k * Math.PI) / 3) * w * 0.24})`} fill="#1a0826" opacity={0.85} />
            ))}
            {[-1, 1].map((s) => (
              <path key={s} d={`M ${s * w * 0.36} ${alto * 0.12} l ${w * 0.05} ${alto * 0.07} l ${-w * 0.05} ${alto * 0.07} l ${-w * 0.05} ${-alto * 0.07} Z`} fill="#1a0826" opacity={0.85} />
            ))}
          </g>
        );
      })}
    </g>
  );
};

// escalón de la ofrenda con mantel morado y orilla de papel picado
const Escalon: React.FC<{ x0: number; x1: number; y: number; alto: number; semilla: number }> = ({ x0, x1, y, alto, semilla }) => {
  const n = Math.round((x1 - x0) / 46);
  const w = (x1 - x0) / n;
  return (
    <g filter="url(#papel)">
      <rect x={x0} y={y} width={x1 - x0} height={alto} fill={MORADO} />
      <rect x={x0} y={y} width={x1 - x0} height={12} fill="#7a3aa6" />
      {/* orilla de papel picado */}
      {Array.from({ length: n }, (_, i) => {
        const col = i % 2 ? ROSA : NARANJA;
        const x = x0 + i * w;
        return (
          <g key={i}>
            <path d={`M ${x} ${y + 10} h ${w} v 26 q ${-w / 4} 10 ${-w / 2} 0 q ${-w / 4} 10 ${-w / 2} 0 Z`} fill={(i + semilla) % 2 ? col : AMARILLO} />
            <circle cx={x + w / 2} cy={y + 24} r={4} fill={MORADO_O} />
          </g>
        );
      })}
    </g>
  );
};

const Llama: React.FC<{ x: number; y: number; t: number; s: number; k: number }> = ({ x, y, t, s, k }) => {
  if (k <= 0) return null;
  const f = 1 + Math.sin(t * 13 + s) * 0.08 + Math.sin(t * 23 + s * 2) * 0.05;
  return (
    <g>
      <circle cx={x} cy={y - 8} r={70 * k * f} fill="url(#brillo)" />
      <path d={`M ${x} ${y - 30 * k * f} C ${x + 9 * k} ${y - 14 * k} ${x + 8 * k} ${y} ${x} ${y} C ${x - 8 * k} ${y} ${x - 9 * k} ${y - 14 * k} ${x} ${y - 30 * k * f} Z`} fill="#ffb21a" />
      <path d={`M ${x} ${y - 18 * k * f} C ${x + 4 * k} ${y - 9 * k} ${x + 4 * k} ${y} ${x} ${y} C ${x - 4 * k} ${y} ${x - 4 * k} ${y - 9 * k} ${x} ${y - 18 * k * f} Z`} fill="#fff3b0" />
    </g>
  );
};

const Veladora: React.FC<{ x: number; y: number; t: number; prende: number; s: number; escala?: number }> = ({ x, y, t, prende, s, escala = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${escala}) translate(${-x} ${-y})`}>
    <g filter="url(#papel)">
      <rect x={x - 22} y={y - 64} width={44} height={64} rx={6} fill="#c8102e" />
      <rect x={x - 22} y={y - 64} width={44} height={10} fill="#e8394f" />
      <rect x={x - 14} y={y - 46} width={28} height={30} fill={CREMA} opacity={0.9} />
      <path d={`M ${x - 8} ${y - 34} l 8 -8 l 8 8 l -8 8 Z`} fill={AMARILLO} />
      <line x1={x} y1={y - 64} x2={x} y2={y - 72} stroke="#3a2a1a" strokeWidth={3} />
    </g>
    <Llama x={x} y={y - 70} t={t} s={s} k={prende} />
  </g>
);

const PanDeMuerto: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g filter="url(#papel)">
    <ellipse cx={x} cy={y - 6} rx={92} ry={12} fill="#7a4a1a" />
    <path d={`M ${x - 82} ${y - 6} C ${x - 82} ${y - 92} ${x + 82} ${y - 92} ${x + 82} ${y - 6} Z`} fill="#d98a3a" />
    <path d={`M ${x - 70} ${y - 22} C ${x - 60} ${y - 70} ${x + 60} ${y - 70} ${x + 70} ${y - 22}`} stroke="#b8692a" strokeWidth={14} fill="none" strokeLinecap="round" />
    {/* huesitos */}
    {[-1, 1].map((s) => (
      <g key={s}>
        <path d={`M ${x - 60 * s} ${y - 14} Q ${x} ${y - 110} ${x + 62 * s} ${y - 22}`} stroke="#c87830" strokeWidth={13} fill="none" strokeLinecap="round" />
        {[0.25, 0.5, 0.75].map((k) => (
          <circle key={k} cx={x - 60 * s + 122 * s * k} cy={y - 14 - Math.sin(k * Math.PI) * 50} r={9} fill="#c87830" />
        ))}
      </g>
    ))}
    <circle cx={x} cy={y - 78} r={14} fill="#c87830" />
    {/* azúcar */}
    {Array.from({ length: 40 }, (_, i) => (
      <circle key={i} cx={x - 70 + rnd(i) * 140} cy={y - 14 - rnd(i * 3) * 66 * Math.sin(rnd(i) * Math.PI)} r={2.2} fill="#fff8ec" />
    ))}
  </g>
);

const Retrato: React.FC<{ x: number; y: number; quien: 'abuela' | 'abuelo'; etiqueta: number; t: number }> = ({ x, y, quien, etiqueta, t }) => {
  const W = 130;
  const H = 160;
  return (
    <g>
      <g filter="url(#papel)">
        <rect x={x - W / 2} y={y - H} width={W} height={H} fill="#6b3f1d" />
        <rect x={x - W / 2 + 12} y={y - H + 12} width={W - 24} height={H - 24} fill="#e9d2a6" />
        {quien === 'abuela' ? (
          <g fill="#5a3a22">
            <circle cx={x} cy={y - H + 58} r={22} />
            <circle cx={x} cy={y - H + 30} r={11} />
            <path d={`M ${x - 46} ${y - 12} C ${x - 44} ${y - 70} ${x + 44} ${y - 70} ${x + 46} ${y - 12} Z`} />
            {/* rebozo */}
            <path d={`M ${x - 46} ${y - 30} L ${x + 46} ${y - 52} L ${x + 46} ${y - 40} L ${x - 46} ${y - 18} Z`} fill="#8a5a36" />
          </g>
        ) : (
          <g fill="#5a3a22">
            <circle cx={x} cy={y - H + 64} r={21} />
            {/* sombrero */}
            <ellipse cx={x} cy={y - H + 46} rx={50} ry={11} />
            <path d={`M ${x - 22} ${y - H + 46} C ${x - 20} ${y - H + 16} ${x + 20} ${y - H + 16} ${x + 22} ${y - H + 46} Z`} />
            <path d={`M ${x - 46} ${y - 12} C ${x - 44} ${y - 66} ${x + 44} ${y - 66} ${x + 46} ${y - 12} Z`} />
            {/* bigote */}
            <path d={`M ${x - 10} ${y - H + 74} q 10 6 20 0`} stroke="#e9d2a6" strokeWidth={3} fill="none" />
          </g>
        )}
        <rect x={x - W / 2 + 12} y={y - H + 12} width={W - 24} height={H - 24} fill="#a07040" opacity={0.18} />
      </g>
      {etiqueta > 0 && (
        <g transform={`translate(${x + (quien === 'abuela' ? -W / 2 - 4 : W / 2 + 4)} ${y - H + 22}) rotate(${(quien === 'abuela' ? -8 : 8) + Math.sin(t * 2) * 2})`} opacity={etiqueta} filter="url(#papelSuave)">
          <line x1={0} y1={0} x2={quien === 'abuela' ? -18 : 18} y2={16} stroke="#e8d6b0" strokeWidth={2} />
          <g transform={`translate(${quien === 'abuela' ? -150 : 18} 12)`}>
            <path d="M 0 0 h 132 l 14 18 l -14 18 h -132 Z" fill={CREMA} transform={quien === 'abuela' ? 'scale(-1 1) translate(-146 0)' : ''} />
            <text x={quien === 'abuela' ? 76 : 70} y={25} textAnchor="middle" fontFamily={TEXTO} fontStyle="italic" fontSize={21} fill="#5a2a1a">
              para {quien === 'abuela' ? 'la abuela' : 'el abuelo'}
            </text>
          </g>
        </g>
      )}
    </g>
  );
};

// rambután en papel: bolita roja con pelitos recortados
const RambutanPapel: React.FC<{ x: number; y: number; r: number; s: number }> = ({ x, y, r, s }) => {
  const n = 18;
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd(s) * 0.4;
    const a2 = a + Math.PI / n;
    const l = r * (1.32 + rnd(s + i) * 0.12);
    d += `${i === 0 ? 'M' : 'L'} ${x + Math.cos(a) * r} ${y + Math.sin(a) * r} Q ${x + Math.cos(a + 0.12) * l} ${y + Math.sin(a + 0.12) * l} ${x + Math.cos(a2 + 0.15) * l * 1.05} ${y + Math.sin(a2 + 0.15) * l * 1.05} `;
  }
  return (
    <g>
      <path d={d + 'Z'} fill="#3f9a2a" />
      <circle cx={x} cy={y} r={r} fill={s % 3 === 0 ? '#e8243c' : s % 3 === 1 ? '#d61f35' : '#f0384a'} />
      <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.28} fill="#ff7a86" opacity={0.6} />
    </g>
  );
};

const RacimoPapel: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frutas: [number, number][] = [
    [-70, -28], [-35, -30], [0, -32], [35, -30], [70, -28],
    [-52, -62], [-17, -66], [18, -66], [53, -62],
    [-34, -96], [0, -100], [34, -96],
    [-16, -128], [18, -128],
  ];
  return (
    <g filter="url(#papel)">
      {/* jícara */}
      <path d={`M ${x - 110} ${y - 30} Q ${x} ${y + 26} ${x + 110} ${y - 30} Z`} fill="#8a3a1a" />
      <path d={`M ${x - 110} ${y - 30} Q ${x} ${y - 14} ${x + 110} ${y - 30}`} stroke="#ffc21a" strokeWidth={5} fill="none" />
      {/* hojas */}
      <path d={`M ${x - 40} ${y - 120} C ${x - 140} ${y - 170} ${x - 150} ${y - 90} ${x - 70} ${y - 80} Z`} fill="#2a8a3a" />
      <path d={`M ${x + 30} ${y - 120} C ${x + 140} ${y - 180} ${x + 160} ${y - 100} ${x + 70} ${y - 84} Z`} fill="#22743a" />
      {frutas.map(([dx, dy], i) => (
        <RambutanPapel key={i} x={x + dx} y={y + dy} r={19} s={i + 2} />
      ))}
    </g>
  );
};

const Cempasuchil: React.FC<{ x: number; y: number; r: number; s?: number }> = ({ x, y, r, s = 0 }) => {
  const anillo = (rr: number, n: number, col: string, giro: number) => {
    let d = '';
    for (let i = 0; i <= n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 + giro;
      const l = i % 2 ? rr * 0.78 : rr;
      d += `${i === 0 ? 'M' : 'L'} ${x + Math.cos(a) * l} ${y + Math.sin(a) * l} `;
    }
    return <path d={d + 'Z'} fill={col} />;
  };
  return (
    <g>
      {anillo(r, 12, '#e8650a', s)}
      {anillo(r * 0.78, 10, NARANJA, s + 0.3)}
      {anillo(r * 0.55, 8, '#ffa31a', s + 0.6)}
      {anillo(r * 0.32, 6, AMARILLO, s + 0.9)}
    </g>
  );
};

const Maceta: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g filter="url(#papel)">
    <path d={`M ${x - 20} ${y - 40} Q ${x - 40} ${y - 110} ${x - 50} ${y - 130}`} stroke="#2a8a3a" strokeWidth={5} fill="none" />
    <path d={`M ${x + 20} ${y - 40} Q ${x + 40} ${y - 110} ${x + 48} ${y - 126}`} stroke="#2a8a3a" strokeWidth={5} fill="none" />
    <path d={`M ${x} ${y - 40} L ${x} ${y - 150}`} stroke="#2a8a3a" strokeWidth={5} />
    <Cempasuchil x={x - 50} y={y - 132} r={26} s={1} />
    <Cempasuchil x={x + 48} y={y - 128} r={24} s={2} />
    <Cempasuchil x={x} y={y - 156} r={30} s={3} />
    <path d={`M ${x - 40} ${y - 46} L ${x + 40} ${y - 46} L ${x + 30} ${y} L ${x - 30} ${y} Z`} fill="#b8582a" />
    <rect x={x - 44} y={y - 52} width={88} height={12} fill="#d26a32" />
  </g>
);

// caída con rebote corto, como pieza que se suelta sobre la mesa
const cae = (t: number, t0: number) => {
  const k = entre(t, t0, 0.5);
  if (k <= 0) return { y: -1200, ok: false };
  if (k < 0.6) return { y: -700 * (1 - Math.pow(k / 0.6, 2)), ok: true };
  const b = (k - 0.6) / 0.4;
  return { y: -Math.sin(b * Math.PI) * 26 * (1 - b), ok: true };
};

const Ofrenda: React.FC<{ t: number; completa: number }> = ({ t, completa }) => {
  const pan = cae(t, T.pan);
  const abuela = cae(t, T.abuela);
  const rambutan = cae(t, T.rambutan);
  const abuelo = cae(t, T.abuelo);
  const velas = [0, 1, 2, 3].map((i) => cae(t, T.velas - 0.45 + i * 0.12));
  const prende = (i: number) => (completa > 0 ? 1 : ease(entre(t, T.velas + i * 0.32, 0.25)));
  const lleno = completa > 0;
  // arco de cempasúchil que se arma flor por flor
  const nArco = 26;
  const arco = Array.from({ length: nArco }, (_, i) => {
    const a = Math.PI + (i / (nArco - 1)) * Math.PI;
    const aparece = entre(t, T.final + 0.25 + (i % 13) * 0.07, 0.25);
    return { x: 500 + Math.cos(a) * 410, y: 800 + Math.sin(a) * 430, ok: lleno && aparece > 0, k: ease(aparece) };
  });
  return (
    <g>
      {/* arco detrás de la ofrenda */}
      {lleno && (
        <g filter="url(#papel)">
          <path d={`M 90 800 A 410 430 0 0 1 910 800`} stroke="#2a7a3a" strokeWidth={10} fill="none" strokeDasharray={`${2000 * ease(entre(t, T.final + 0.1, 1.2))} 3000`} />
          {arco.map((f, i) => f.ok && <Cempasuchil key={i} x={f.x} y={f.y} r={30 * f.k} s={i} />)}
        </g>
      )}
      <Escalon x0={290} x1={710} y={530} alto={130} semilla={0} />
      <Escalon x0={190} x1={810} y={660} alto={130} semilla={1} />
      <Escalon x0={90} x1={910} y={790} alto={150} semilla={0} />
      {/* piezas */}
      {abuela.ok && <g transform={`translate(0 ${abuela.y})`}><Retrato x={415} y={530} quien="abuela" etiqueta={ease(entre(t, T.abuela + 0.5, 0.3))} t={t} /></g>}
      {abuelo.ok && <g transform={`translate(0 ${abuelo.y})`}><Retrato x={585} y={530} quien="abuelo" etiqueta={ease(entre(t, T.abuelo + 0.5, 0.3))} t={t} /></g>}
      {pan.ok && <g transform={`translate(0 ${pan.y})`}><PanDeMuerto x={500} y={660} /></g>}
      {rambutan.ok && <g transform={`translate(0 ${rambutan.y})`}><RacimoPapel x={500} y={790} /></g>}
      {/* la veladora que ya estaba prendida */}
      <Veladora x={160} y={790} t={t} prende={1} s={0} />
      {velas[0].ok && <g transform={`translate(0 ${velas[0].y})`}><Veladora x={840} y={790} t={t} prende={prende(0)} s={1} /></g>}
      {velas[1].ok && <g transform={`translate(0 ${velas[1].y})`}><Veladora x={250} y={660} t={t} prende={prende(1)} s={2} /></g>}
      {velas[2].ok && <g transform={`translate(0 ${velas[2].y})`}><Veladora x={750} y={660} t={t} prende={prende(2)} s={3} /></g>}
      {velas[3].ok && <g transform={`translate(0 ${velas[3].y})`}><Veladora x={330} y={530} t={t} prende={prende(3)} s={4} escala={0.85} /></g>}
      {lleno && (
        <>
          <Veladora x={670} y={530} t={t} prende={1} s={5} escala={0.85} />
          <g transform={`translate(0 ${cae(t, T.final + 0.6).y})`}><Maceta x={300} y={790} /></g>
          <g transform={`translate(0 ${cae(t, T.final + 0.75).y})`}><Maceta x={700} y={790} /></g>
          {/* camino de pétalos */}
          <g filter="url(#papelSuave)">
            {Array.from({ length: 34 }, (_, i) => {
              const k = entre(t, T.final + 0.9 + i * 0.03, 0.2);
              if (k <= 0) return null;
              const y = 950 + (i / 34) * 220;
              const x = 500 + Math.sin(i * 0.9) * 40 + (rnd(i) - 0.5) * 60;
              return <ellipse key={i} cx={x} cy={y} rx={9} ry={6} transform={`rotate(${rnd(i * 2) * 180} ${x} ${y})`} fill={i % 3 ? NARANJA : AMARILLO} opacity={k} />;
            })}
          </g>
        </>
      )}
    </g>
  );
};

// pétalos que caen (a pasos)
const Petalos: React.FC<{ t: number; desde: number; n: number; W: number; H: number }> = ({ t, desde, n, W, H }) => {
  if (t < desde) return null;
  return (
    <g filter="url(#papelSuave)">
      {Array.from({ length: n }, (_, i) => {
        const v = 120 + rnd(i) * 120;
        const dt = t - desde - rnd(i * 5) * 3;
        if (dt < 0) return null;
        const y = -40 + ((dt * v) % (H + 80));
        const x = rnd(i * 7) * W + Math.sin(dt * 1.6 + i) * 30;
        return <ellipse key={i} cx={x} cy={y} rx={10} ry={6} transform={`rotate(${dt * 90 + i * 40} ${x} ${y})`} fill={i % 3 ? NARANJA : i % 2 ? AMARILLO : ROSA} />;
      })}
    </g>
  );
};

// huerta de rambután de noche, en papel
const HuertaNoche: React.FC<{ t: number; W: number; H: number }> = ({ t, W, H }) => {
  const k = t - T.huerta;
  const arbol = (x: number, y: number, s: number, i: number) => (
    <g key={i} filter="url(#papel)">
      <path d={`M ${x - 14 * s} ${y} L ${x - 8 * s} ${y - 120 * s} L ${x + 8 * s} ${y - 120 * s} L ${x + 14 * s} ${y} Z`} fill="#4a2a18" />
      {[[-60, -150, 70], [50, -160, 72], [0, -205, 80], [-30, -110, 60], [40, -112, 58]].map(([dx, dy, r], j) => (
        <circle key={j} cx={x + dx * s} cy={y + dy * s} r={r * s} fill={j % 2 ? '#1f5a32' : '#247040'} />
      ))}
      {Array.from({ length: 9 }, (_, j) => (
        <RambutanPapel key={j} x={x + (rnd(i * 10 + j) - 0.5) * 170 * s} y={y - (110 + rnd(i * 10 + j + 3) * 120) * s} r={9 * s} s={j + i} />
      ))}
    </g>
  );
  const linternas = Array.from({ length: 9 }, (_, i) => ({ x: W * (0.12 + i * 0.095), y: H * 0.86 + Math.sin(i * 1.7) * 10 }));
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill="#140a2e" />
      {/* estrellas */}
      {Array.from({ length: 60 }, (_, i) => (
        <circle key={i} cx={rnd(i) * W} cy={rnd(i * 3) * H * 0.5} r={1.5 + rnd(i * 5) * 2} fill="#fff6dc" opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i))} />
      ))}
      <g filter="url(#papel)">
        <circle cx={W * 0.78} cy={H * 0.2} r={Math.min(W, H) * 0.09} fill="url(#luna)" />
      </g>
      {/* volcán y lomas en capas */}
      <g filter="url(#papel)">
        <path d={`M 0 ${H * 0.6} L ${W * 0.18} ${H * 0.5} L ${W * 0.32} ${H * 0.3} L ${W * 0.36} ${H * 0.31} L ${W * 0.5} ${H * 0.5} L ${W} ${H * 0.55} L ${W} ${H} L 0 ${H} Z`} fill="#2a1a4e" />
      </g>
      <g filter="url(#papel)">
        <path d={`M 0 ${H * 0.7} Q ${W * 0.25} ${H * 0.6} ${W * 0.5} ${H * 0.68} T ${W} ${H * 0.64} L ${W} ${H} L 0 ${H} Z`} fill="#22163a" />
      </g>
      {[0, 1, 2, 3].map((i) => arbol(W * (0.14 + i * 0.24), H * 0.8 - (i % 2) * 18, Math.min(W, H) / 900 * 1.05, i + 1))}
      {/* papel picado entre los árboles */}
      <PapelPicado x0={W * 0.14} x1={W * 0.86} y={H * 0.48} n={12} alto={H * 0.07} t={t} semilla={2} />
      <g filter="url(#papel)">
        <path d={`M 0 ${H * 0.82} Q ${W * 0.5} ${H * 0.78} ${W} ${H * 0.82} L ${W} ${H} L 0 ${H} Z`} fill="#3a1f2a" />
      </g>
      {/* camino de pétalos y veladoras */}
      <g filter="url(#papelSuave)">
        {Array.from({ length: 50 }, (_, i) => {
          const x = (i / 50) * W;
          const y = H * 0.9 + Math.sin(i * 0.7) * 12;
          return entre(k, i * 0.03, 0.2) > 0 ? <ellipse key={i} cx={x} cy={y} rx={10} ry={6} fill={i % 3 ? NARANJA : AMARILLO} transform={`rotate(${i * 37} ${x} ${y})`} /> : null;
        })}
      </g>
      {linternas.map((l, i) => (
        <Veladora key={i} x={l.x} y={l.y} t={t} prende={ease(entre(k, 0.3 + i * 0.12, 0.3))} s={i + 7} escala={0.9} />
      ))}
    </g>
  );
};

// ola de papel de china con pétalos que barre la pantalla
const Ola: React.FC<{ t: number; t0: number; W: number; H: number }> = ({ t, t0, W, H }) => {
  const k = (t - t0) / 0.9;
  if (k < 0 || k > 1) return null;
  const x = W * 1.05 - k * W * 3.3; // borde izquierdo de la ola
  const capa = (dx: number, col: string, amp: number, f: number) => {
    let d = `M ${x + dx} ${0}`;
    for (let y = 0; y <= H; y += H / 24) d += ` L ${x + dx + Math.sin(y / (H / f) * Math.PI * 2 + t * 6) * amp} ${y}`;
    const x2 = x + dx + W * 2.2;
    d += ` L ${x2} ${H}`;
    for (let y = H; y >= 0; y -= H / 24) d += ` L ${x2 + Math.sin(y / (H / f) * Math.PI * 2 + 1 + t * 6) * amp} ${y}`;
    return <path d={d + ' Z'} fill={col} />;
  };
  return (
    <g filter="url(#papel)">
      {capa(0, ROSA, 40, 3)}
      {capa(70, NARANJA, 50, 2.5)}
      {capa(150, MORADO, 46, 3.5)}
      {Array.from({ length: 40 }, (_, i) => {
        const px = x + 40 + rnd(i) * W * 2.4;
        const py = rnd(i * 3) * H;
        return <ellipse key={i} cx={px} cy={py} rx={14} ry={8} fill={i % 2 ? AMARILLO : '#fff1d6'} transform={`rotate(${i * 47 + t * 120} ${px} ${py})`} />;
      })}
    </g>
  );
};

// ---------- textos ----------
const Texto: React.FC<{ t: number; desde: number; hasta: number; grande: React.ReactNode; chico?: React.ReactNode; top: number; u: number }> = ({ t, desde, hasta, grande, chico, top, u }) => {
  if (t < desde || t > hasta) return null;
  const a = entre(t, desde, 0.3) * (1 - entre(t, hasta - 0.3, 0.3));
  const y = (1 - ease(entre(t, desde, 0.4))) * 20;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, textAlign: 'center', opacity: a, transform: `translateY(${y * u}px)`, padding: `0 ${50 * u}px` }}>
      <div style={{ fontFamily: TEXTO, fontWeight: 700, fontSize: 76 * u, lineHeight: 1.05, color: CREMA, textShadow: `0 ${4 * u}px ${16 * u}px rgba(20,0,30,.8)` }}>{grande}</div>
      {chico && <div style={{ fontFamily: TEXTO, fontStyle: 'italic', fontSize: 50 * u, lineHeight: 1.1, color: '#ffb0d0', marginTop: 8 * u, textShadow: `0 ${3 * u}px ${12 * u}px rgba(20,0,30,.8)` }}>{chico}</div>}
    </div>
  );
};

// ---------- video ----------
export const DiaMuertos: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const t = (Math.floor(frame / 2) * 2) / fps; // stop-motion: la imagen cambia cada 2 cuadros
  const u = Math.min(W, H) / 1080;
  const vertical = H > W * 1.1;
  // escenario cuadrado de 1000 unidades
  const lado = vertical ? W * 1.0 : H * 1.1;
  const sx = (W - lado) / 2;
  const sy = vertical ? H * 0.34 : H * 0.95 - 940 * (lado / 1000);
  const k = lado / 1000;
  const enHuerta = t >= T.huerta && t < T.final;
  const completa = t >= T.final ? 1 : 0;
  const topTexto = vertical ? H * 0.17 : H * 0.15;
  const cierre = entre(t, T.cierre, 0.6);

  return (
    <AbsoluteFill style={{ background: '#1a0826' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        <Filtros />
        {!enHuerta ? (
          <g>
            {/* fondo: pared de papel morado con fibra y piso */}
            <rect x={0} y={0} width={W} height={H} fill="#2d0f44" filter="url(#fibra)" />
            <rect x={0} y={sy + 940 * k} width={W} height={H} fill="#24102e" filter="url(#fibra)" />
            {Array.from({ length: 30 }, (_, i) => (
              <circle key={i} cx={rnd(i) * W} cy={rnd(i * 3) * (sy + 400 * k)} r={2 + rnd(i * 5) * 2} fill="#ffd9f0" opacity={0.25 + 0.3 * Math.abs(Math.sin(t + i))} />
            ))}
            <PapelPicado x0={-20} x1={W + 20} y={vertical ? H * 0.04 : 6} n={vertical ? 7 : 14} alto={vertical ? H * 0.08 : H * 0.11} t={t} />
            {!vertical && (
              <>
                <g transform={`translate(${sx - 200 * k} ${sy}) scale(${k})`}><Maceta x={0} y={940} /></g>
                <g transform={`translate(${sx + lado + 200 * k} ${sy}) scale(${k})`}><Maceta x={0} y={940} /></g>
              </>
            )}
            <g transform={`translate(${sx} ${sy}) scale(${k})`}>
              <Ofrenda t={t} completa={completa} />
            </g>
            {completa > 0 && <Petalos t={t} desde={T.final + 0.4} n={vertical ? 46 : 60} W={W} H={H} />}
          </g>
        ) : (
          <HuertaNoche t={t} W={W} H={H} />
        )}
        <Ola t={t} t0={T.ola1} W={W} H={H} />
        <Ola t={t} t0={T.ola2} W={W} H={H} />
      </svg>

      {/* textos (capa aparte, encima de la animación) */}
      <Texto t={t} desde={0.3} hasta={T.pan - 0.05} grande="Hoy regresan…" chico="y la ofrenda sigue vacía." top={topTexto} u={u} />
      <Texto t={t} desde={T.pan} hasta={T.abuela - 0.05} grande="El pan de muerto…" top={topTexto} u={u} />
      <Texto t={t} desde={T.abuela} hasta={T.velas - 0.05} grande="la foto de la abuela…" top={topTexto} u={u} />
      <Texto t={t} desde={T.velas} hasta={T.rambutan - 0.05} grande="las veladoras…" top={topTexto} u={u} />
      <Texto t={t} desde={T.rambutan} hasta={T.ola1} grande="y el rambután" chico="del árbol que sembró el abuelo." top={topTexto} u={u} />
      <Texto t={t} desde={T.huerta + 0.3} hasta={T.ola2} grande="Cada cosecha…" chico="también es de ellos." top={vertical ? H * 0.22 : H * 0.08} u={u} />
      <Texto t={t} desde={T.final + 0.4} hasta={T.cierre} grande="Que su recuerdo" chico="nunca se apague." top={topTexto} u={u} />

      {/* cierre: marca con corona de cempasúchil y datos de contacto */}
      {cierre > 0 && (
        <AbsoluteFill style={{ background: `rgba(26,8,38,${0.88 * cierre})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 * u }}>
          <div style={{ position: 'relative', width: 380 * u, height: 380 * u, opacity: cierre, transform: `scale(${0.9 + 0.1 * ease(cierre)})` }}>
            <svg width={380 * u} height={380 * u} viewBox="0 0 380 380" style={{ position: 'absolute', inset: 0 }}>
              <g filter="url(#papel)">
                {Array.from({ length: 18 }, (_, i) => {
                  const a = (i / 18) * Math.PI * 2;
                  const ok = entre(t, T.cierre + 0.2 + i * 0.04, 0.2) > 0;
                  return ok ? <Cempasuchil key={i} x={190 + Math.cos(a) * 160} y={190 + Math.sin(a) * 160} r={28} s={i} /> : null;
                })}
              </g>
            </svg>
            <Img src={staticFile('logo.svg')} style={{ position: 'absolute', left: 80 * u, top: 80 * u, width: 220 * u, height: 220 * u, background: '#fff4dc', borderRadius: '50%', padding: 12 * u, boxSizing: 'border-box' }} />
          </div>
          <div style={{ opacity: entre(t, T.cierre + 0.5, 0.4), fontFamily: TEXTO, fontStyle: 'italic', fontSize: 52 * u, color: '#ffb0d0', textAlign: 'center', padding: `0 ${50 * u}px` }}>Honramos a quienes sembraron esta tierra.</div>
          <div style={{ opacity: entre(t, T.cierre + 0.8, 0.4), fontFamily: TITULO, fontSize: 96 * u, letterSpacing: 6 * u, color: CREMA, lineHeight: 0.95, textAlign: 'center' }}>{vertical ? <>IXCHEL<br />FRUTAS DEL SOCONUSCO</> : 'IXCHEL · FRUTAS DEL SOCONUSCO'}</div>
          <div style={{ opacity: entre(t, T.cierre + 1.1, 0.4), fontFamily: TITULO, fontSize: 60 * u, color: AMARILLO, textAlign: 'center', lineHeight: 1 }}>{vertical ? <>TRAE TU TRÁILER<br />VENTA POR TONELADA</> : 'TRAE TU TRÁILER · VENTA POR TONELADA'}</div>
          <div style={{ opacity: entre(t, T.cierre + 1.4, 0.4), fontFamily: TITULO, fontSize: 92 * u, color: '#25d366', background: 'rgba(5,30,15,.85)', padding: `${8 * u}px ${40 * u}px 0`, borderRadius: 80 * u }}>{TEL} · WHATSAPP</div>
          <div style={{ opacity: entre(t, T.cierre + 1.6, 0.4), fontFamily: TEXTO, fontSize: 40 * u, color: CREMA }}>{CORREO}</div>
        </AbsoluteFill>
      )}
      {cierre > 0 && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <PapelPicado x0={-20} x1={W + 20} y={vertical ? H * 0.03 : 6} n={vertical ? 7 : 14} alto={vertical ? H * 0.07 : H * 0.1} t={t} semilla={3} />
          <Petalos t={t} desde={T.cierre} n={30} W={W} H={H} />
        </svg>
      )}
      <Audio src={staticFile('muertos/musica.wav')} volume={0.55} />
    </AbsoluteFill>
  );
};
