import React from 'react';
import { loadFont } from '@remotion/fonts';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { TEXTO, TITULO, avance } from './comun';

// Los carruseles de Facebook, animados para TikTok (sin música: la pone Alex en la app).
// Cada lámina es una "etiqueta de caja de fruta": color pleno, rayos, marco doble y el rambután en medallón.

loadFont({ family: 'GaramondItalica', url: staticFile('eb-garamond-italic.woff2') });

export const DURA = 3.4; // segundos por lámina
const ENTRA = 0.55; // la lámina nueva se abre en círculo sobre la anterior
const CREMA = '#fff4dc';

type Trozo = string | [string, string]; // texto, o [texto, color]
export type Lamina = {
  bg: string;
  fg: string;
  ray: string;
  arriba: string;
  tag?: string;
  n?: string;
  titulo?: Trozo[][]; // líneas
  tam?: number;
  grande?: { texto: string; color?: string; tam?: number; cuenta?: [number, number, string?] };
  cuerpo?: Trozo[];
  fuente?: string;
  medallon?: 'esquina' | 'centro' | 'arriba' | 'logo';
  centrado?: boolean;
  escena?: 'piramide' | 'luna' | 'selva' | 'volcan';
};

const pinta = (trozos: Trozo[]) =>
  trozos.map((x, i) => (typeof x === 'string' ? <span key={i}>{x}</span> : <span key={i} style={{ color: x[1] }}>{x[0]}</span>));

const Medallon: React.FC<{ t: number; fps: number; fg: string; donde: Lamina['medallon'] }> = ({ t, fps, fg, donde }) => {
  const s = spring({ frame: (t - 0.25) * fps, fps, config: { damping: 9, mass: 0.8 } });
  const flota = Math.sin(t * 2.2) * 12;
  const gira = interpolate(s, [0, 1], [-200, 0]) + Math.sin(t * 1.6) * 6;
  const pos: Record<string, React.CSSProperties> = {
    esquina: { width: 440, height: 440, right: 70, top: 1230 },
    centro: { width: 560, height: 560, left: 260, top: 1050 },
    arriba: { width: 520, height: 520, left: 280, top: 230 },
    logo: { width: 0, height: 0 },
  };
  if (donde !== 'arriba') return null;
  return (
    <div
      style={{
        position: 'absolute',
        ...pos[donde ?? 'esquina'],
        borderRadius: '50%',
        background: CREMA,
        boxShadow: `0 0 0 12px ${fg}, 0 30px 60px rgba(0,0,0,.25)`,
        display: 'grid',
        placeItems: 'center',
        transform: `translateY(${flota}px) scale(${s}) rotate(${gira}deg)`,
      }}
    >
      <Img src={staticFile('fruta.svg')} style={{ width: '78%' }} />
    </div>
  );
};


// Escenas de fondo: pirámide maya, luna con conejo, selva y volcán (se alternan por lámina).
const ESCENAS = ['piramide', 'luna', 'selva', 'volcan'] as const;
const Conejo: React.FC<{ x: number; y: number; k: number; c: string }> = ({ x, y, k, c }) => (
  <g transform={`translate(${x} ${y}) scale(${k})`} fill={c}>
    <ellipse cx="-8" cy="-62" rx="9" ry="34" transform="rotate(-16 -8 -62)" />
    <ellipse cx="14" cy="-60" rx="8" ry="32" transform="rotate(14 14 -60)" />
    <circle cx="4" cy="-18" r="22" />
    <ellipse cx="0" cy="26" rx="34" ry="38" />
    <circle cx="-34" cy="44" r="12" />
    <ellipse cx="22" cy="60" rx="22" ry="9" />
  </g>
);
const Estrellas: React.FC<{ c: string; t: number }> = ({ c, t }) => (
  <g fill={c}>
    {Array.from({ length: 34 }, (_, i) => {
      const x = (i * 337) % 1000 + 40, y = (i * 211) % 1100 + 260;
      return <circle key={i} cx={x} cy={y} r={2 + (i % 3) * 1.6} opacity={0.35 + 0.35 * Math.abs(Math.sin(t * 2 + i))} />;
    })}
  </g>
);
const Fondo: React.FC<{ tipo: (typeof ESCENAS)[number]; c: string; luz: string; t: number }> = ({ tipo, c, luz, t }) => {
  const sombra = 'rgba(0,0,0,.22)';
  return (
    <svg viewBox="0 0 1080 1920" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      {tipo === 'piramide' && (
        <g>
          <Estrellas c={luz} t={t} />
          <circle cx="760" cy="1060" r="210" fill={luz} opacity=".45" />
          <Conejo x={760} y={1070} k={1.5} c={c} />
          {[0, 1, 2, 3, 4, 5, 6].map((k) => (
            <rect key={k} x={140 + k * 55} y={1820 - (k + 1) * 85} width={800 - k * 110} height="86" fill={k % 2 ? c : sombra} opacity={k % 2 ? 0.9 : 1} />
          ))}
          <rect x="455" y="1140" width="170" height="110" fill={c} />
          <rect x="505" y="1180" width="70" height="70" fill={sombra} />
          <polygon points="490,1820 590,1820 570,1260 510,1260" fill={sombra} />
          <path d="M0 1820 Q200 1700 120 1920 Z M1080 1800 Q880 1690 960 1920 Z" fill={c} />
        </g>
      )}
      {tipo === 'luna' && (
        <g>
          <Estrellas c={luz} t={t} />
          <circle cx="540" cy="1230" r="380" fill={luz} opacity=".42" />
          <circle cx="540" cy="1230" r="440" fill="none" stroke={luz} strokeWidth="6" opacity=".25" />
          <Conejo x={540} y={1250} k={3.2} c={c} />
          <path d="M0 1700 Q270 1600 540 1700 T1080 1680 V1920 H0 Z" fill={c} opacity=".85" />
        </g>
      )}
      {tipo === 'selva' && (
        <g>
          {[[-60, 1500, 30, 1.6], [1140, 1450, 150, 1.5], [-40, 900, 60, 1.1], [1120, 900, 125, 1.0], [300, 1950, -10, 1.4], [800, 1980, 10, 1.3]].map(([x, y, r, k], i) => (
            <g key={i} transform={`translate(${x} ${y}) rotate(${r + Math.sin(t * 1.3 + i) * 3}) scale(${k})`} fill={i % 2 ? c : sombra}>
              <path d="M0 0 C60 -160 200 -260 340 -250 C300 -120 180 -20 0 0 Z" />
              <path d="M0 0 C-20 -170 40 -330 150 -400 C170 -250 110 -90 0 0 Z" />
              <path d="M0 0 C120 -60 280 -60 380 20 C260 80 120 60 0 0 Z" />
            </g>
          ))}
          <circle cx="540" cy="1150" r="160" fill={luz} opacity=".35" />
        </g>
      )}
      {tipo === 'volcan' && (
        <g>
          <circle cx="820" cy="900" r="120" fill={luz} opacity=".45" />
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={560 + k * 40 + Math.sin(t + k) * 10} cy={1010 - k * 70 - (t * 12) % 30} r={60 + k * 25} fill={luz} opacity={0.22 - k * 0.05} />
          ))}
          <polygon points="80,1700 470,1080 650,1080 1040,1700" fill={c} opacity=".9" />
          <polygon points="470,1080 650,1080 600,1160 560,1130 520,1170" fill={luz} opacity=".5" />
          <path d="M0 1640 Q270 1540 540 1640 T1080 1600 V1920 H0 Z" fill={sombra} />
          {[120, 300, 480, 660, 840, 1000].map((x, i) => (
            <g key={i}>
              <rect x={x - 8} y={1700 - (i % 2) * 30} width="16" height="70" fill={c} />
              <circle cx={x} cy={1680 - (i % 2) * 30} r={55} fill={c} />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
};

const LaminaVista: React.FC<{ l: Lamina; t: number; i: number; total: number }> = ({ l, t, i, total }) => {
  const { fps } = useVideoConfig();
  const abre = avance(t, 0, ENTRA, Easing.inOut(Easing.cubic));
  const sube = (desde: number, dist = 70): React.CSSProperties => {
    const a = avance(t, desde, 0.5, Easing.out(Easing.exp));
    return { opacity: a, transform: `translateY(${(1 - a) * dist}px)` };
  };
  const pop = spring({ frame: (t - 0.3) * fps, fps, config: { damping: 11 } });
  const tam = l.tam ?? 200;
  const centro = l.centrado ? 'center' : 'left';

  let grande = l.grande?.texto;
  if (l.grande?.cuenta) {
    const [a, b, suf = ''] = l.grande.cuenta;
    const v = Math.round(interpolate(avance(t, 0.4, 1.1, Easing.out(Easing.cubic)), [0, 1], [a, b]));
    grande = `${v >= 1000 && b >= 1000 ? v.toLocaleString("en-US") : v}${suf}`;
  }

  return (
    <AbsoluteFill
      style={{
        background: l.bg,
        color: l.fg,
        fontFamily: TEXTO,
        overflow: 'hidden',
        clipPath: i === 0 ? undefined : `circle(${abre * 130}% at 50% 55%)`,
      }}
    >
<Fondo tipo={l.escena ?? (l.medallon === 'logo' || l.medallon === 'arriba' ? 'selva' : ESCENAS[i % ESCENAS.length])} c={l.ray} luz={CREMA} t={t} />
      <div
        style={{
          position: 'absolute',
          inset: 40,
          border: `7px solid ${l.fg}`,
          borderRadius: 34,
          transform: `scale(${interpolate(avance(t, 0.05, 0.6), [0, 1], [1.06, 1])})`,
          opacity: avance(t, 0.05, 0.4),
        }}
      />
      <div style={{ position: 'absolute', inset: 58, border: `2px solid ${l.fg}`, borderRadius: 24, opacity: 0.55 * avance(t, 0.2, 0.4) }} />

      {/* progreso tipo historias */}
      <div style={{ position: 'absolute', left: 90, right: 90, top: 92, display: 'flex', gap: 10 }}>
        {Array.from({ length: total }, (_, k) => (
          <div key={k} style={{ flex: 1, height: 8, borderRadius: 4, background: l.fg, opacity: 0.25, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: l.fg,
                width: k < i ? '100%' : k > i ? '0%' : `${avance(t, 0, DURA, Easing.linear) * 100}%`,
                opacity: 4,
              }}
            />
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 90,
          right: 90,
          top: 130,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: TITULO,
          fontSize: 40,
          letterSpacing: 5,
          ...sube(0.1, 20),
        }}
      >
        <span>{l.arriba}</span>
        <span>
          {i + 1} / {total}
        </span>
      </div>
      {l.n && (
        <div style={{ position: 'absolute', right: 90, top: 200, fontFamily: TITULO, fontSize: 170, transform: `scale(${pop})` }}>{l.n}</div>
      )}

      <div style={{ position: 'absolute', left: 95, right: 95, top: l.medallon === 'arriba' || l.medallon === 'logo' ? 860 : l.n ? 400 : 270, textAlign: centro }}>
        {l.tag && (
          <div
            style={{
              display: 'inline-block',
              background: l.fg,
              color: l.bg,
              fontFamily: TITULO,
              fontSize: 46,
              letterSpacing: 4,
              padding: '10px 26px 4px',
              borderRadius: 10,
              marginBottom: 30,
              transform: `scale(${pop})`,
              transformOrigin: 'left center',
            }}
          >
            {l.tag}
          </div>
        )}
        {l.titulo?.map((linea, k) => (
          <div key={k} style={{ overflow: 'hidden', paddingTop: 8 }}>
            <div
              style={{
                fontFamily: TITULO,
                fontSize: tam,
                lineHeight: 0.88,
                transform: `translateY(${(1 - avance(t, 0.25 + k * 0.09, 0.55, Easing.out(Easing.exp))) * 110}%)`,
              }}
            >
              {pinta(linea)}
            </div>
          </div>
        ))}
        {grande && (
          <div
            style={{
              fontFamily: TITULO,
              fontSize: l.grande?.tam ?? 380,
              lineHeight: 0.85,
              color: l.grande?.color,
              marginTop: 10,
              transform: `scale(${interpolate(avance(t, 0.35, 0.6, Easing.out(Easing.back(1.6))), [0, 1], [1.4, 1])})`,
              transformOrigin: centro === 'center' ? 'center' : 'left center',
              opacity: avance(t, 0.35, 0.3),
              filter: `blur(${(1 - avance(t, 0.35, 0.45)) * 14}px)`,
            }}
          >
            {grande}
          </div>
        )}
        {l.cuerpo && (
          <div style={{ fontSize: 62, lineHeight: 1.22, marginTop: 40, maxWidth: l.medallon === 'esquina' ? 860 : undefined, ...sube(0.7) }}>
            {pinta(l.cuerpo)}
          </div>
        )}
        {l.fuente && (
          <div style={{ fontFamily: 'GaramondItalica', fontSize: 32, marginTop: 30, opacity: 0.85 * avance(t, 1.0, 0.4) }}>Fuente: {l.fuente}</div>
        )}
      </div>

      {l.medallon === 'logo' && (
        <Img
          src={staticFile('logo.svg')}
          style={{ position: 'absolute', width: 520, left: 280, top: 230, transform: `scale(${pop}) rotate(${(1 - pop) * -30}deg)` }}
        />
      )}
      <Medallon t={t} fps={fps} fg={l.fg} donde={l.medallon} />

      <div
        style={{
          position: 'absolute',
          left: 40,
          right: 40,
          bottom: 40,
          height: 190,
          borderRadius: '0 0 34px 34px',
          background: l.fg,
          color: l.bg,
          display: 'flex',
          alignItems: 'center',
          gap: 26,
          padding: '0 44px',
          fontFamily: TITULO,
          fontSize: 34,
          letterSpacing: 3,
          whiteSpace: 'nowrap',
          transform: `translateY(${(1 - avance(t, 0.15, 0.5, Easing.out(Easing.exp))) * 230}px)`,
        }}
      >
        <Img src={staticFile('logo.svg')} style={{ width: 104, background: CREMA, borderRadius: '50%', padding: 8 }} />
        IXCHEL · FRUTAS DEL SOCONUSCO
        <span style={{ marginLeft: 'auto', fontSize: 50 }}>WA 962 170 7553</span>
      </div>
    </AbsoluteFill>
  );
};

export const Carrusel: React.FC<{ laminas: Lamina[] }> = ({ laminas }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seg = frame / fps;
  const actual = Math.min(laminas.length - 1, Math.floor(seg / DURA));
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {laminas.map((l, i) =>
        i === actual || i === actual - 1 ? <LaminaVista key={i} l={l} t={seg - i * DURA} i={i} total={laminas.length} /> : null,
      )}
    </AbsoluteFill>
  );
};

const V = (bg: string, fg: string, ray: string) => ({ bg, fg, ray });
const ORO = '#ffd21a';

export const SABADO: Lamina[] = [
  { ...V('#ff5a1f', '#2b0a3d', '#ff8a3d'), arriba: 'HISTORIA', titulo: [['EL VIAJE DEL'], [['RAMBUTÁN', CREMA]]], tam: 230,
    cuerpo: ['De las selvas de Asia a Tuxtla Chico, Chiapas.'], medallon: 'centro' },
  { ...V('#00a6a6', '#062a2a', '#25c4c4'), arriba: 'PARADA 1 · ASIA', tag: 'EL ORIGEN', titulo: [['NACIÓ EN LA'], ['SELVA DE LA'], ['ASIA TROPICAL']], tam: 175,
    cuerpo: ['Hoy los mayores productores del mundo son Tailandia, Indonesia y Malasia.'], fuente: 'NParks Singapur; Wikipedia.' },
  { ...V('#2440ff', CREMA, '#4a63ff'), arriba: 'EL NOMBRE', grande: { texto: 'RAMBUT', color: ORO, tam: 330 },
    cuerpo: ['= ', ['pelo', ORO], ', en malayo. Es la fruta peludita. Y ', ['Nephelium', ORO], ', su nombre científico, quiere decir "nubecita" en griego.'],
    fuente: 'NParks Singapur.' },
  { ...V('#ffc21a', '#3a0d0d', '#ffd75a'), arriba: 'PARADA 2 · AMÉRICA', tag: 'SIGLO XIX', grande: { texto: '1800s', cuenta: [1500, 1800, 's'] },
    cuerpo: ['Los holandeses lo llevaron de Indonesia a Surinam, en Sudamérica. De ahí se extendió por el trópico americano.'], fuente: 'Wikipedia, "Rambutan".' },
  { ...V('#e6007e', CREMA, '#ff3ca0'), arriba: 'PARADA 3 · CHIAPAS', tag: 'LLEGADA AL SOCONUSCO', grande: { texto: '1950–60', color: ORO, tam: 300 },
    cuerpo: ['Entre 1950 y 1960 llegó al Soconusco. Se da en zonas de 100 a 700 metros de altura.'], fuente: 'Revista Chapingo, 2011.' },
  { ...V('#6a1fd1', CREMA, '#8a46ef'), arriba: 'PARADA 4 · HOY', titulo: [['CHIAPAS,'], [['CORAZÓN', '#b8f02e']], ['DEL RAMBUTÁN']], tam: 190,
    cuerpo: ['Es el centro de producción de México: Tuxtla Chico, Metapa, Cacahoatán y más.'], fuente: 'Revista Chapingo, 2011; FreshPlaza, 2019.' },
  { ...V('#b8f02e', '#14301a', '#d2ff5c'), arriba: 'IXCHEL', titulo: [['DE TUXTLA CHICO'], ['PARA TODO MÉXICO']], tam: 150, centrado: true,
    cuerpo: ['Venta por tonelada. Tú mandas tu camión; nosotros cosechamos, empacamos y cargamos.'], medallon: 'arriba' },
];

export const DOMINGO: Lamina[] = [
  { ...V('#e6007e', CREMA, '#ff3ca0'), arriba: 'DATOS COMPROBADOS', titulo: [[['6 COSAS', ORO]], ['QUE NO SABÍAS'], ['DEL RAMBUTÁN']], tam: 165, centrado: true, medallon: 'centro' },
  { ...V('#ffc21a', '#3a0d0d', '#ffd75a'), arriba: 'DATO', n: '01', titulo: [['SUS PELITOS'], ['TIENEN NOMBRE']], tam: 190,
    cuerpo: ['Se llaman ', ['espinternos', '#c8202b'], ' y ayudan a la fruta a transpirar, algo que influye en su calidad.'], fuente: 'Wikipedia, "Rambutan".' },
  { ...V('#00a6a6', '#062a2a', '#25c4c4'), arriba: 'DATO', n: '02', titulo: [['ES PRIMO'], ['DEL LICHI']], tam: 220,
    cuerpo: ['Es de la misma familia que el lichi, el longan y la quenepa, a la que en el sureste le dicen huaya.'], fuente: 'NParks Singapur; Wikipedia.' },
  { ...V('#b8f02e', '#14301a', '#d2ff5c'), arriba: 'DATO', n: '03', grande: { texto: '27 M', cuenta: [0, 27, ' M'] }, titulo: [['PUEDE MEDIR SU ÁRBOL']], tam: 110,
    cuerpo: ['Más o menos la altura de un edificio de nueve pisos.'], fuente: 'NParks Singapur.' },
  { ...V('#6a1fd1', CREMA, '#8a46ef'), arriba: 'DATO', n: '04', titulo: [['HAY ÁRBOLES'], ['QUE ', ['NUNCA', ORO]], ['DAN FRUTA']], tam: 180,
    cuerpo: ['Los árboles macho solo tienen flores masculinas. Dan fruta los de flores femeninas o hermafroditas.'], fuente: 'Wikipedia, "Rambutan".' },
  { ...V('#ff5a1f', '#2b0a3d', '#ff8a3d'), arriba: 'DATO', n: '05', titulo: [['TIENE VITAMINA C']], tam: 150, grande: { texto: '22–47 MG', color: CREMA, tam: 230 },
    cuerpo: ['por cada 100 g de pulpa, medido en variedades de Hawái.'], fuente: 'NParks Singapur.' },
  { ...V('#2440ff', CREMA, '#4a63ff'), arriba: 'DATO', n: '06', titulo: [['NO SOLO'], ['ES ', ['ROJO', '#ff5a6e']]], tam: 220,
    cuerpo: ['Casi siempre es rojo, pero también existen rambutanes ', ['naranjas y amarillos', ORO], ', aunque son raros.'], fuente: 'Wikipedia, "Rambutan".' },
  { ...V('#ffc21a', '#3a0d0d', '#ffd75a'), arriba: 'IXCHEL', titulo: [['¿CUÁL NO'], ['SABÍAS?']], tam: 200, centrado: true, medallon: 'logo',
    cuerpo: ['Cuéntanos en los comentarios. Rambután por tonelada desde Tuxtla Chico: tú mandas tu camión.'] },
];

export const COMPRAR: Lamina[] = [
  { ...V('#2440ff', CREMA, '#4a63ff'), arriba: 'COSECHA 2027', titulo: [['¿YA APARTASTE'], ['TU ', ['RAMBUTÁN?', ORO]]], tam: 185, centrado: true, medallon: 'centro' },
  { ...V('#b8f02e', '#14301a', '#d2ff5c'), arriba: 'TEMPORADA', n: '01', tag: 'MAYO A JUNIO', titulo: [['COSECHA'], ['TEMPRANA']], tam: 210,
    cuerpo: ['La primera fruta del año en Tuxtla Chico, Chiapas.'] },
  { ...V('#ffc21a', '#3a0d0d', '#ffd75a'), arriba: 'TEMPORADA', n: '02', tag: 'FINALES DE JULIO A AGOSTO', titulo: [['COSECHA'], ['NORMAL']], tam: 210,
    cuerpo: ['La temporada fuerte: más volumen para tu bodega.'] },
  { ...V('#e6007e', CREMA, '#ff3ca0'), arriba: 'TEMPORADA', n: '03', tag: 'AGOSTO A OCTUBRE', titulo: [['COSECHA'], [['TARDÍA', ORO]]], tam: 210,
    cuerpo: ['Fruta hasta el otoño para cerrar el año.'] },
  { ...V('#00a6a6', '#062a2a', '#25c4c4'), arriba: 'CÓMO COMPRAR', titulo: [['POR TONELADA'], [['O POR CAJAS', CREMA]]], tam: 185,
    cuerpo: ['Tú mandas tu camión a la huerta y nosotros cosechamos, empacamos y cargamos.'] },
  { ...V('#ff5a1f', '#2b0a3d', '#ff8a3d'), arriba: 'IXCHEL', titulo: [['APARTA HOY'], [['TU CARGA', CREMA]]], tam: 200, centrado: true, medallon: 'logo',
    cuerpo: ['WhatsApp 962 170 7553 · ventasixchelfrutas@gmail.com · oscar20001.github.io/rambutan-chiapas'] },
];

export const PREGUNTAS: Lamina[] = [
  { ...V('#6a1fd1', CREMA, '#8a46ef'), arriba: 'ANTES DE COMPRAR', titulo: [['5 PREGUNTAS'], ['QUE TODOS'], [['NOS HACEN', ORO]]], tam: 170, centrado: true, medallon: 'centro' },
  { ...V('#ffc21a', '#3a0d0d', '#ffd75a'), arriba: 'PREGUNTA', n: '01', titulo: [['¿CÓMO'], ['VENDEN?']], tam: 220,
    cuerpo: [['Por tonelada o por cajas', '#c8202b'], ', para bodegas, centrales de abasto, distribuidores y fruterías.'] },
  { ...V('#e6007e', CREMA, '#ff3ca0'), arriba: 'PREGUNTA', n: '02', titulo: [['¿CUÁNDO'], ['HAY FRUTA?']], tam: 210,
    cuerpo: ['Mayo a junio, finales de julio a agosto y agosto a octubre. ', ['Aparta antes', ORO], ' de que arranque la cosecha.'] },
  { ...V('#00a6a6', '#062a2a', '#25c4c4'), arriba: 'PREGUNTA', n: '03', titulo: [['¿DE DÓNDE'], ['ES LA FRUTA?']], tam: 200,
    cuerpo: ['De nuestra huerta en ', ['Tuxtla Chico, Chiapas', CREMA], ', en el Soconusco, al pie del volcán Tacaná.'] },
  { ...V('#2440ff', CREMA, '#4a63ff'), arriba: 'PREGUNTA', n: '04', titulo: [['¿LO ENVÍAN?']], tam: 220,
    cuerpo: ['No hacemos envíos. ', ['Tú mandas tu camión', ORO], ' y nosotros lo cargamos en la huerta.'] },
  { ...V('#b8f02e', '#14301a', '#d2ff5c'), arriba: 'PREGUNTA', n: '05', titulo: [['¿CUÁNTO'], ['CUESTA?']], tam: 220,
    cuerpo: ['Depende de la temporada y la cantidad. ', ['Cotiza sin compromiso', '#c8202b'], ' por WhatsApp, de lunes a domingo de 7:00 a 19:00.'] },
  { ...V('#ff5a1f', '#2b0a3d', '#ff8a3d'), arriba: 'IXCHEL', titulo: [['¿OTRA'], ['PREGUNTA?']], tam: 210, centrado: true, medallon: 'logo',
    cuerpo: ['WhatsApp 962 170 7553 · ventasixchelfrutas@gmail.com · oscar20001.github.io/rambutan-chiapas'] },
];

export const SOCONUSCO: Lamina[] = [
  { ...V('#14301a', CREMA, '#24502c'), escena: 'luna', arriba: 'ORIGEN', titulo: [['¿SABÍAS QUE'], [['NACE JUNTO', '#b8f02e']], [['A UN VOLCÁN?', '#ff5a6e']]], tam: 175, centrado: true, medallon: 'centro' },
  { ...V('#ff5a1f', '#2b0a3d', '#ff8a3d'), escena: 'volcan', arriba: 'EL VOLCÁN', grande: { texto: '4,060 M', cuenta: [0, 4060, ' M'], tam: 260 }, titulo: [['VOLCÁN TACANÁ']], tam: 120,
    cuerpo: ['Mide 4,060 metros y marca la frontera entre México y Guatemala. Sus faldas bajan hasta las huertas del Soconusco.'] },
  { ...V('#00a6a6', '#062a2a', '#25c4c4'), escena: 'selva', arriba: 'LA ALTURA', grande: { texto: '100–700 M', color: CREMA, tam: 230 },
    cuerpo: ['Es la altura donde se da el rambután en el Soconusco: tierra caliente, húmeda y fértil.'], fuente: 'Revista Chapingo, 2011.' },
  { ...V('#e6007e', CREMA, '#ff3ca0'), escena: 'piramide', arriba: 'LA HISTORIA', titulo: [['ZONA ARQUEOLÓGICA'], [['IZAPA', ORO]]], tam: 170,
    cuerpo: ['Tuxtla Chico guarda Izapa, uno de los sitios más antiguos de Mesoamérica, hoy rodeado de huertas.'], fuente: 'INAH.' },
  { ...V('#ffc21a', '#3a0d0d', '#ffd75a'), escena: 'luna', arriba: 'LA PRODUCCIÓN', titulo: [['CHIAPAS ES EL'], [['CENTRO', '#c8202b']], ['DEL RAMBUTÁN']], tam: 180,
    cuerpo: ['Tuxtla Chico, Metapa y Cacahoatán están en el corazón de la producción de México.'], fuente: 'Revista Chapingo, 2011; FreshPlaza, 2019.' },
  { ...V('#b8f02e', '#14301a', '#d2ff5c'), arriba: 'IXCHEL', titulo: [['DEL SOCONUSCO'], ['A TU BODEGA']], tam: 160, centrado: true, medallon: 'arriba',
    cuerpo: ['Por tonelada o por cajas. WhatsApp 962 170 7553 · ventasixchelfrutas@gmail.com · oscar20001.github.io/rambutan-chiapas'] },
];
