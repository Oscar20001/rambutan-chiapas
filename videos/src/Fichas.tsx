import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { TEXTO, TITULO } from './comun';

// Carruseles de fotos con estilos distintos: lotería mexicana, piedra maya tallada, noche de luna y adivinanza.
export type Estilo = 'loteria' | 'piedra' | 'noche' | 'adivina';
export type Ficha = {
  num?: string;
  titulo: string;
  dato?: string;
  dibujo?: string; // emoji grande o 'conejo' | 'piramide' | 'luna'
  pie?: string;
  fuente?: string;
  color?: string;
};
export type CarruselFichas = { estilo: Estilo; fichas: Ficha[] };

const CREMA = '#fbf0d9';
const ORO = '#e8b33a';

const Greca: React.FC<{ c: string; y: number }> = ({ c, y }) => (
  <svg viewBox="0 0 1080 60" style={{ position: 'absolute', left: 0, top: y, width: 1080, height: 60 }}>
    {Array.from({ length: 18 }, (_, i) => (
      <path key={i} d={`M${i * 60} 55 V10 H${i * 60 + 45} V40 H${i * 60 + 20} V25`} fill="none" stroke={c} strokeWidth="7" />
    ))}
  </svg>
);

const Conejo: React.FC<{ c: string; s?: number }> = ({ c, s = 1 }) => (
  <svg viewBox="-80 -110 160 190" style={{ width: 300 * s, height: 360 * s }}>
    <g fill={c}>
      <ellipse cx="-12" cy="-62" rx="13" ry="42" transform="rotate(-16 -12 -62)" />
      <ellipse cx="18" cy="-60" rx="12" ry="40" transform="rotate(14 18 -60)" />
      <circle cx="4" cy="-14" r="28" />
      <ellipse cx="0" cy="34" rx="42" ry="46" />
      <circle cx="-42" cy="56" r="14" />
      <ellipse cx="26" cy="74" rx="28" ry="10" />
    </g>
  </svg>
);

const Dibujo: React.FC<{ d?: string; c: string; tam?: number }> = ({ d, c, tam = 330 }) => {
  if (!d) return null;
  if (d === 'conejo') return <Conejo c={c} />;
  if (d === 'fruta') return <Img src={staticFile('fruta.svg')} style={{ width: tam * 1.25 }} />;
  if (d === 'luna')
    return (
      <div style={{ width: 420, height: 420, borderRadius: '50%', background: CREMA, boxShadow: `0 0 120px ${CREMA}88`, display: 'grid', placeItems: 'center' }}>
        <Conejo c="#1b2a4a" s={0.8} />
      </div>
    );
  if (d === 'piramide')
    return (
      <svg viewBox="0 0 400 300" style={{ width: 460 }}>
        {[0, 1, 2, 3, 4, 5].map((k) => (
          <rect key={k} x={20 + k * 30} y={260 - k * 42} width={360 - k * 60} height="42" fill={c} opacity={k % 2 ? 1 : 0.8} />
        ))}
        <rect x="165" y="12" width="70" height="40" fill={c} />
        <polygon points="180,300 220,300 212,70 188,70" fill="rgba(0,0,0,.25)" />
      </svg>
    );
  return <div style={{ fontSize: tam, lineHeight: 1 }}>{d}</div>;
};

const Pie: React.FC<{ fg: string; bg: string }> = ({ fg, bg }) => (
  <div style={{ position: 'absolute', left: 60, right: 60, bottom: 50, height: 150, borderRadius: 26, background: fg, color: bg, display: 'flex', alignItems: 'center', gap: 22, padding: '0 34px', fontFamily: TITULO, fontSize: 32, letterSpacing: 3 }}>
    <Img src={staticFile('logo.svg')} style={{ width: 96, background: CREMA, borderRadius: '50%', padding: 6 }} />
    IXCHEL · FRUTAS DEL SOCONUSCO
    <span style={{ marginLeft: 'auto', fontSize: 46 }}>WA 962 170 7553</span>
  </div>
);

const Contador: React.FC<{ i: number; n: number; c: string }> = ({ i, n, c }) => (
  <div style={{ position: 'absolute', top: 70, right: 80, fontFamily: TITULO, fontSize: 40, letterSpacing: 4, color: c }}>
    {i + 1} / {n}
  </div>
);

// ---------- 1. Lotería ----------
const Loteria: React.FC<{ f: Ficha; i: number; n: number }> = ({ f, i, n }) => {
  const fondo = f.color ?? '#c8202b';
  return (
    <AbsoluteFill style={{ background: '#f4e3c1', fontFamily: TEXTO }}>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, rgba(0,0,0,.025) 0 6px, transparent 6px 14px)' }} />
      <div style={{ position: 'absolute', left: 70, right: 70, top: 150, height: 1380, background: CREMA, border: '10px solid #1d1d1d', borderRadius: 18, boxShadow: '0 30px 60px rgba(0,0,0,.25)' }}>
        <div style={{ position: 'absolute', inset: 22, border: '4px solid #1d1d1d', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 820, background: fondo, display: 'grid', placeItems: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,.35), transparent 60%)' }} />
            <Dibujo d={f.dibujo} c={CREMA} />
          </div>
          {f.num && <div style={{ position: 'absolute', left: 26, top: 14, fontFamily: TITULO, fontSize: 120, color: CREMA, textShadow: '4px 4px 0 #1d1d1d' }}>{f.num}</div>}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 830, textAlign: 'center', fontFamily: TITULO, fontSize: f.titulo.length > 14 ? 96 : 130, lineHeight: 0.95, color: '#1d1d1d', padding: '0 30px' }}>{f.titulo}</div>
          {f.dato && <div style={{ position: 'absolute', left: 40, right: 40, top: f.titulo.length > 14 ? 1040 : 980, textAlign: 'center', fontSize: 52, lineHeight: 1.2, color: '#2a2a2a' }}>{f.dato}</div>}
        </div>
      </div>
      {f.fuente && <div style={{ position: 'absolute', left: 90, right: 90, top: 1550, fontSize: 30, fontStyle: 'italic', color: '#5a4a32', textAlign: 'center' }}>Fuente: {f.fuente}</div>}
      <div style={{ position: 'absolute', top: 62, left: 80, fontFamily: TITULO, fontSize: 52, letterSpacing: 6, color: '#c8202b' }}>LOTERÍA DEL SOCONUSCO</div>
      <Contador i={i} n={n} c="#1d1d1d" />
      {f.pie && <div style={{ position: 'absolute', left: 80, right: 80, top: 1600, textAlign: 'center', fontSize: 34, color: '#1d1d1d' }}>{f.pie}</div>}
      <Pie fg="#1d1d1d" bg={CREMA} />
    </AbsoluteFill>
  );
};

// ---------- 2. Piedra maya tallada ----------
const Piedra: React.FC<{ f: Ficha; i: number; n: number }> = ({ f, i, n }) => (
  <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 35%, #6e6250, #3a3226 70%)', fontFamily: TEXTO, color: CREMA }}>
    <div style={{ position: 'absolute', inset: 0, opacity: 0.18, background: 'repeating-radial-gradient(circle at 30% 20%, #000 0 2px, transparent 2px 9px)' }} />
    <Greca c={ORO} y={150} />
    <Greca c={ORO} y={1600} />
    <div style={{ position: 'absolute', top: 64, left: 80, fontFamily: TITULO, fontSize: 48, letterSpacing: 8, color: ORO }}>SECRETOS DEL SOCONUSCO</div>
    <Contador i={i} n={n} c={ORO} />
    <div style={{ position: 'absolute', top: 260, left: 0, right: 0, display: 'grid', placeItems: 'center', filter: 'drop-shadow(6px 8px 0 rgba(0,0,0,.45))' }}>
      <Dibujo d={f.dibujo} c={ORO} tam={340} />
    </div>
    {f.num && <div style={{ position: 'absolute', top: 210, left: 90, fontFamily: TITULO, fontSize: 200, color: ORO, opacity: 0.9 }}>{f.num}</div>}
    <div style={{ position: 'absolute', left: 90, right: 90, top: 760, textAlign: 'center' }}>
      <div style={{ fontFamily: TITULO, fontSize: f.titulo.length > 18 ? 130 : 170, lineHeight: 0.92, textShadow: '0 6px 0 rgba(0,0,0,.5)' }}>{f.titulo}</div>
      {f.dato && <div style={{ fontSize: 64, lineHeight: 1.25, marginTop: 50 }}>{f.dato}</div>}
      {f.fuente && <div style={{ fontSize: 34, fontStyle: 'italic', marginTop: 34, color: ORO }}>Fuente: {f.fuente}</div>}
    </div>
    <Pie fg={ORO} bg="#2a2318" />
  </AbsoluteFill>
);

// ---------- 3. Noche de luna ----------
const Noche: React.FC<{ f: Ficha; i: number; n: number }> = ({ f, i, n }) => (
  <AbsoluteFill style={{ background: 'linear-gradient(#0b1430, #1b2a4a 55%, #3b2a5a)', fontFamily: TEXTO, color: CREMA }}>
    {Array.from({ length: 60 }, (_, k) => (
      <div key={k} style={{ position: 'absolute', left: (k * 397) % 1060, top: (k * 233) % 1500, width: 3 + (k % 3) * 2, height: 3 + (k % 3) * 2, borderRadius: '50%', background: CREMA, opacity: 0.4 + (k % 4) * 0.15 }} />
    ))}
    <svg viewBox="0 0 1080 400" style={{ position: 'absolute', bottom: 200, left: 0, width: 1080 }}>
      <path d="M0 400 V260 L120 260 L120 230 L170 230 L170 200 L220 200 L220 170 L260 170 L260 200 L310 200 L310 230 L360 230 L360 260 Q600 180 1080 280 V400 Z" fill="#0a0f22" />
      <path d="M700 400 L780 300 L860 330 L1080 220 V400 Z" fill="#070b18" />
    </svg>
    <div style={{ position: 'absolute', top: 64, left: 80, fontFamily: TITULO, fontSize: 48, letterSpacing: 8, color: '#c9b8ff' }}>LA LEYENDA DE IXCHEL</div>
    <Contador i={i} n={n} c="#c9b8ff" />
    <div style={{ position: 'absolute', top: 200, left: 0, right: 0, display: 'grid', placeItems: 'center' }}>
      <Dibujo d={f.dibujo} c={CREMA} tam={260} />
    </div>
    <div style={{ position: 'absolute', left: 90, right: 90, top: 720, textAlign: 'center' }}>
      <div style={{ fontFamily: TITULO, fontSize: f.titulo.length > 18 ? 116 : 146, lineHeight: 0.92, color: f.color ?? CREMA }}>{f.titulo}</div>
      {f.dato && <div style={{ fontSize: 60, lineHeight: 1.25, marginTop: 44 }}>{f.dato}</div>}
      {f.fuente && <div style={{ fontSize: 32, fontStyle: 'italic', marginTop: 30, color: '#c9b8ff' }}>Fuente: {f.fuente}</div>}
    </div>
    <Pie fg="#c9b8ff" bg="#0b1430" />
  </AbsoluteFill>
);

// ---------- 4. Adivinanza ----------
const Adivina: React.FC<{ f: Ficha; i: number; n: number }> = ({ f, i, n }) => {
  const bg = f.color ?? '#ffcf1f';
  return (
    <AbsoluteFill style={{ background: bg, fontFamily: TEXTO, color: '#1d1d1d' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 15%, rgba(255,255,255,.5) 0 8%, transparent 8%), radial-gradient(circle at 85% 30%, rgba(255,255,255,.35) 0 5%, transparent 5%), radial-gradient(circle at 75% 85%, rgba(0,0,0,.08) 0 12%, transparent 12%)' }} />
      <div style={{ position: 'absolute', top: 64, left: 80, fontFamily: TITULO, fontSize: 52, letterSpacing: 6 }}>¿ADIVINAS?</div>
      <Contador i={i} n={n} c="#1d1d1d" />
      <div style={{ position: 'absolute', top: 210, left: 0, right: 0, display: 'grid', placeItems: 'center' }}>
        <div style={{ width: 560, height: 560, borderRadius: '50%', background: '#fff', border: '12px solid #1d1d1d', boxShadow: '18px 18px 0 #1d1d1d', display: 'grid', placeItems: 'center' }}>
          <Dibujo d={f.dibujo} c="#1d1d1d" tam={300} />
        </div>
      </div>
      {f.num && <div style={{ position: 'absolute', top: 170, left: 90, fontFamily: TITULO, fontSize: 150, transform: 'rotate(-8deg)', background: '#1d1d1d', color: bg, padding: '0 26px', borderRadius: 16 }}>{f.num}</div>}
      <div style={{ position: 'absolute', left: 80, right: 80, top: 880, textAlign: 'center' }}>
        <div style={{ fontFamily: TITULO, fontSize: f.titulo.length > 18 ? 112 : 140, lineHeight: 0.92 }}>{f.titulo}</div>
        {f.dato && <div style={{ fontSize: 52, lineHeight: 1.25, marginTop: 34 }}>{f.dato}</div>}
        {f.fuente && <div style={{ fontSize: 30, fontStyle: 'italic', marginTop: 26 }}>Fuente: {f.fuente}</div>}
      </div>
      <Pie fg="#1d1d1d" bg={bg} />
    </AbsoluteFill>
  );
};

export const FichaVista: React.FC<CarruselFichas & { i: number }> = ({ estilo, fichas, i }) => {
  const f = fichas[i];
  const n = fichas.length;
  if (estilo === 'loteria') return <Loteria f={f} i={i} n={n} />;
  if (estilo === 'piedra') return <Piedra f={f} i={i} n={n} />;
  if (estilo === 'noche') return <Noche f={f} i={i} n={n} />;
  return <Adivina f={f} i={i} n={n} />;
};

const CONTACTO = 'WhatsApp 962 170 7553 · ventasixchelfrutas@gmail.com · oscar20001.github.io/rambutan-chiapas';

export const LOTERIA: CarruselFichas = {
  estilo: 'loteria',
  fichas: [
    { titulo: '¿CUÁNTAS CONOCES?', dato: 'Las frutas que salen de la tierra del Soconusco, Chiapas. Desliza 👉', dibujo: '🃏', color: '#1f6f43' },
    { num: '1', titulo: 'EL MANGO ATAÚLFO', dato: 'Nació en el Soconusco y lleva el nombre del productor Ataúlfo Morales Gordillo. Tiene denominación de origen desde 2003.', dibujo: '🥭', color: '#f29f05', fuente: 'Diario Oficial de la Federación, 2003' },
    { num: '2', titulo: 'EL CACAO', dato: 'Los mokaya del Soconusco ya lo usaban hace unos 4,000 años. Fue tan valioso que se pagaba tributo con él.', dibujo: '🫘', color: '#6b3b1f', fuente: 'Gasco, FAMSI; Códice Mendoza' },
    { num: '3', titulo: 'EL CAFÉ', dato: 'Desde finales del siglo XIX las fincas de las faldas del Tacaná lo convirtieron en la gran exportación de la región.', dibujo: '☕', color: '#3b2416' },
    { num: '4', titulo: 'EL PLÁTANO', dato: 'Hoy es uno de los cultivos más grandes de la costa del Soconusco, junto con la papaya y el mango.', dibujo: '🍌', color: '#2a7fba' },
    { num: '5', titulo: 'EL RAMBUTÁN', dato: 'El más nuevo de la familia: llegó entre 1950 y 1960 y hoy Chiapas es el centro de su producción en México.', dibujo: 'fruta', color: '#2a9d8f', fuente: 'Revista Chapingo, 2011' },
    { titulo: '¿CON CUÁL TE QUEDAS?', dato: 'Comenta tu favorita 👇 Rambután por tonelada o por cajas. Cosechas: mayo a junio, julio a agosto y agosto a octubre.', dibujo: '🏆', color: '#7a2a8c', pie: CONTACTO },
  ],
};

export const MAYAS: CarruselFichas = {
  estilo: 'piedra',
  fichas: [
    { titulo: '5 SECRETOS QUE GUARDA ESTA TIERRA', dato: 'Lo que pasó en el Soconusco mucho antes que nosotros.', dibujo: 'piramide' },
    { num: '01', titulo: 'SU NOMBRE', dato: 'Xoconochco, en náhuatl: "lugar de tunas agrias".', dibujo: '🌵', fuente: 'Códice Mendoza' },
    { num: '02', titulo: 'LOS MOKAYA', dato: 'Hace unos 4,000 años aquí ya se tomaba cacao y se jugaba a la pelota.', dibujo: '🫘' },
    { num: '03', titulo: 'IZAPA', dato: 'Habitada desde hace unos 3,500 años en Tuxtla Chico. Se cree que ahí nació el calendario sagrado de 260 días.', dibujo: 'piramide', fuente: 'INAH' },
    { num: '04', titulo: 'TRIBUTO A LOS MEXICAS', dato: 'Desde 1486 el Soconusco pagaba con cacao, plumas finas y pieles de jaguar.', dibujo: '🪶', fuente: 'Códice Mendoza' },
    { num: '05', titulo: 'EL CACAO ERA DINERO', dato: 'En Mesoamérica los granos de cacao se usaban como moneda para comprar y vender.', dibujo: '🪙' },
    { titulo: 'HOY ESTA TIERRA DA RAMBUTÁN', dato: 'Desde Tuxtla Chico, por tonelada o por cajas. ' + CONTACTO, dibujo: 'piramide' },
  ],
};

export const IXCHEL: CarruselFichas = {
  estilo: 'noche',
  fichas: [
    { titulo: '¿POR QUÉ NOS LLAMAMOS IXCHEL?', dato: 'La historia detrás de nuestro nombre 🌙', dibujo: 'luna' },
    { titulo: 'UNA DIOSA MAYA', dato: 'Ixchel era la diosa maya de los partos y la medicina. Los curanderos le hacían fiesta con sus bultos de medicinas.', dibujo: '✨', fuente: 'Diego de Landa, siglo XVI' },
    { titulo: 'LA ISLA DE IXCHEL', dato: 'Mujeres de todo el mundo maya viajaban a su santuario en Cozumel para pedir una familia fértil.', dibujo: '🏝️', fuente: 'Diego de Landa, siglo XVI' },
    { titulo: 'EL CONEJO EN LA LUNA', dato: 'En el arte maya, la diosa de la luna aparece cargando un conejo. Mira la luna llena: ¿lo ves?', dibujo: 'conejo', color: '#c9b8ff' },
    { titulo: 'FERTILIDAD Y VIDA', dato: 'Por eso la elegimos: nuestra huerta en Tuxtla Chico vive de la tierra fértil del Soconusco.', dibujo: '🌱' },
    { titulo: 'IXCHEL, FRUTAS DEL SOCONUSCO', dato: 'Rambután por tonelada o por cajas. Aparta tu cosecha: mayo a octubre. ' + CONTACTO, dibujo: 'luna' },
  ],
};

export const ADIVINA: CarruselFichas = {
  estilo: 'adivina',
  fichas: [
    { titulo: '¿ADIVINAS QUÉ FRUTA ES?', dato: '3 pistas. Comenta tu respuesta ANTES de llegar al final 👇', dibujo: '❓' },
    { num: 'PISTA 1', titulo: 'TENGO PELOS', dato: 'Pero no soy un animal 🤭', dibujo: '🧶', color: '#ff7a59' },
    { num: 'PISTA 2', titulo: 'SOY PRIMA DEL LICHI', dato: 'Y en el sureste me confunden con la huaya.', dibujo: '🌳', color: '#6fd3c7' },
    { num: 'PISTA 3', titulo: 'MI NOMBRE SIGNIFICA "PELO"', dato: 'En malayo, rambut = pelo.', dibujo: '🗣️', color: '#b9a0ff' },
    { titulo: '¡SOY EL RAMBUTÁN!', dato: '¿Le atinaste? Dinos en los comentarios 👇', dibujo: 'fruta', color: '#ff5a6e' },
    { titulo: 'DE TUXTLA CHICO PARA TODO MÉXICO', dato: 'Por tonelada o por cajas. Cosechas de mayo a octubre. ' + CONTACTO, dibujo: '🚛', color: '#b8f02e' },
  ],
};
