import React from 'react';
import { staticFile } from 'remotion';
import { C, TITULO } from './comun';

// Dibujos planos para las escenas de la huerta. Todo en coordenadas del "mundo";
// cada pieza se coloca con translate desde su base (los pies, el tronco, las llantas).

const PIEL = ['#a8673f', '#8d5530', '#c07a4a', '#9a5b36'];
const SOMBRERO = '#e9c77b';
const PANTALON = '#2c3e50';

// Racimo de rambutanes: varias frutas juntas.
export const Racimo: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {[
      [-22, 0],
      [18, -4],
      [-2, 18],
      [26, 22],
      [-28, 26],
    ].map(([dx, dy], i) => (
      <image key={i} href={staticFile('fruta.svg')} x={dx - 22} y={dy - 22} width={44} height={46} />
    ))}
  </g>
);

const RACIMOS: [number, number][] = [
  [-120, -330], [-40, -420], [70, -380], [140, -300], [-160, -240], [10, -280], [110, -220], [-70, -190],
];

// Árbol de rambután. `sway` en grados mueve la copa; `cortados` quita racimos (ya cosechados).
export const Arbol: React.FC<{ x: number; y: number; s?: number; sway?: number; cortados?: number }> = ({
  x,
  y,
  s = 1,
  sway = 0,
  cortados = 0,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-22 0 L-14 -180 Q-60 -230 -90 -250 M14 -180 L22 0 Z" fill="#5b3a22" />
    <path d="M-20 0 Q-10 -120 -14 -190 L14 -190 Q10 -120 22 0 Z" fill="#6b4428" />
    <path d="M-6 -170 Q-60 -220 -100 -230" stroke="#6b4428" strokeWidth="14" fill="none" strokeLinecap="round" />
    <path d="M6 -180 Q60 -230 100 -250" stroke="#6b4428" strokeWidth="14" fill="none" strokeLinecap="round" />
    <g transform={`rotate(${sway} 0 -180)`}>
      {[
        [-150, -270, 110, '#1a4a2c'],
        [150, -270, 110, '#1a4a2c'],
        [0, -330, 150, '#1f5a35'],
        [-100, -380, 110, '#2a6e40'],
        [100, -380, 110, '#2a6e40'],
        [0, -450, 100, '#2f7a46'],
      ].map(([cx, cy, r, f], i) => (
        <circle key={i} cx={cx as number} cy={cy as number} r={r as number} fill={f as string} />
      ))}
      {RACIMOS.slice(0, RACIMOS.length - cortados).map(([cx, cy], i) => (
        <Racimo key={i} x={cx} y={cy} s={0.85} />
      ))}
    </g>
  </g>
);

export type Pose = {
  brazoA?: number; // brazo de atrás, grados (0 = colgando)
  brazoB?: number; // brazo de enfrente
  pierna?: number; // vaivén de piernas al caminar
  risa?: number; // 0..1 boca abierta
  salto?: number; // px hacia arriba
  mano?: React.ReactNode; // lo que lleva en la mano de enfrente
};

// Trabajador con sombrero. Base en los pies. dir = 1 mira a la derecha, -1 a la izquierda.
export const Trabajador: React.FC<
  { x: number; y: number; s?: number; dir?: 1 | -1; camisa: string; piel?: number } & Pose
> = ({ x, y, s = 1, dir = 1, camisa, piel = 0, brazoA = 8, brazoB = -8, pierna = 0, risa = 0, salto = 0, mano }) => {
  const p = PIEL[piel % PIEL.length];
  return (
    <g transform={`translate(${x} ${y - salto}) scale(${s * dir} ${s})`}>
      <ellipse cx="0" cy={salto / s + 4} rx="46" ry="10" fill="rgba(0,0,0,.18)" />
      {/* piernas */}
      <g transform={`rotate(${pierna} 0 -110)`}>
        <rect x="-26" y="-112" width="24" height="112" rx="10" fill={PANTALON} />
        <rect x="-32" y="-12" width="34" height="14" rx="6" fill="#3b2416" />
      </g>
      <g transform={`rotate(${-pierna} 0 -110)`}>
        <rect x="2" y="-112" width="24" height="112" rx="10" fill={PANTALON} />
        <rect x="0" y="-12" width="34" height="14" rx="6" fill="#3b2416" />
      </g>
      {/* brazo de atrás */}
      <g transform={`rotate(${brazoA} -30 -205)`}>
        <rect x="-44" y="-212" width="24" height="100" rx="12" fill={camisa} />
        <circle cx="-32" cy="-108" r="13" fill={p} />
      </g>
      {/* torso */}
      <rect x="-40" y="-230" width="80" height="128" rx="26" fill={camisa} />
      <path d="M-14 -230 L0 -205 L14 -230" fill={p} />
      <rect x="-40" y="-118" width="80" height="16" fill="#5b3a22" />
      {/* cabeza */}
      <rect x="-10" y="-246" width="20" height="20" fill={p} />
      <circle cx="0" cy="-272" r="34" fill={p} />
      <circle cx="12" cy="-280" r="4.5" fill="#1b1b1b" />
      <circle cx="-8" cy="-280" r="4.5" fill="#1b1b1b" />
      <path d="M-14 -292 q6 -5 12 0 M6 -292 q6 -5 12 0" stroke="#1b1b1b" strokeWidth="3" fill="none" />
      {risa > 0.05 ? (
        <ellipse cx="4" cy="-258" rx={12} ry={4 + risa * 9} fill="#5a1414" />
      ) : (
        <path d="M-8 -260 Q4 -248 16 -260" stroke="#3a1a10" strokeWidth="4" fill="none" strokeLinecap="round" />
      )}
      {/* sombrero */}
      <ellipse cx="0" cy="-298" rx="64" ry="13" fill={SOMBRERO} />
      <path d="M-32 -298 Q-30 -346 0 -346 Q30 -346 32 -298 Z" fill={SOMBRERO} />
      <rect x="-32" y="-310" width="64" height="9" fill={C.rojo} />
      {/* brazo de enfrente con lo que carga */}
      <g transform={`rotate(${brazoB} 30 -205)`}>
        <rect x="20" y="-212" width="24" height="100" rx="12" fill={camisa} />
        <circle cx="32" cy="-108" r="13" fill={p} />
        {mano && <g transform="translate(32 -104)">{mano}</g>}
      </g>
    </g>
  );
};

// Caja de cosecha con frutas asomando.
export const Caja: React.FC<{ x?: number; y?: number; s?: number; llena?: number }> = ({
  x = 0,
  y = 0,
  s = 1,
  llena = 1,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {llena > 0 &&
      [-62, -30, 2, 34, 66, -46, -14, 18, 50].slice(0, Math.ceil(llena * 9)).map((dx, i) => (
        <circle key={i} cx={dx} cy={i < 5 ? -70 : -88} r={22} fill={i % 2 ? C.pelo : C.piel} />
      ))}
    <rect x="-90" y="-80" width="180" height="80" rx="6" fill={C.oro} stroke="#8a6a2a" strokeWidth="5" />
    <rect x="-90" y="-46" width="180" height="7" fill={C.oroSuave} />
    <text x="0" y="-12" textAnchor="middle" fontFamily={TITULO} fontSize="34" fill={C.verde}>
      IXCHEL
    </text>
  </g>
);

export const Escalera: React.FC<{ x: number; y: number; alto: number }> = ({ x, y, alto }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M-40 0 L-18 ${-alto} M40 0 L18 ${-alto}`} stroke="#8a5a2b" strokeWidth="12" strokeLinecap="round" />
    {Array.from({ length: Math.floor(alto / 55) }, (_, i) => {
      const yy = -30 - i * 55;
      const w = 40 - (22 * (i * 55 + 30)) / alto;
      return <line key={i} x1={-w} x2={w} y1={yy} y2={yy} stroke="#8a5a2b" strokeWidth="9" />;
    })}
  </g>
);

// Camión de redilas visto de lado, cabina a la izquierda. Base en las llantas.
export const Camion: React.FC<{ x: number; y: number; s?: number; cajas?: number; giro?: number }> = ({
  x,
  y,
  s = 1,
  cajas = 0,
  giro = 0,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {/* caja de carga abierta */}
    <rect x="150" y="-250" width="470" height="170" fill="none" />
    {Array.from({ length: Math.min(cajas, 12) }, (_, i) => (
      <Caja key={i} x={215 + (i % 4) * 112} y={-92 - Math.floor(i / 4) * 78} s={0.6} />
    ))}
    <rect x="150" y="-110" width="480" height="40" fill={C.pelo} />
    {[160, 280, 400, 520, 620].map((xx) => (
      <rect key={xx} x={xx} y="-230" width="12" height="130" fill="#7a2a20" />
    ))}
    <rect x="150" y="-236" width="482" height="12" fill="#7a2a20" />
    <rect x="150" y="-170" width="482" height="10" fill="#7a2a20" />
    {/* cabina */}
    <path d="M10 -70 L10 -180 Q14 -230 70 -236 L150 -236 L150 -70 Z" fill={C.oro} />
    <path d="M30 -150 Q34 -205 76 -210 L130 -210 L130 -150 Z" fill="#cfe8f0" />
    <rect x="0" y="-80" width="640" height="26" rx="8" fill="#3b3b3b" />
    {[90, 420, 540].map((xx) => (
      <g key={xx} transform={`translate(${xx} -40) rotate(${giro})`}>
        <circle r="44" fill="#1f1f1f" />
        <circle r="18" fill={C.oroSuave} />
        <rect x="-3" y="-30" width="6" height="22" fill="#555" />
      </g>
    ))}
    <rect x="4" y="-110" width="18" height="14" rx="3" fill="#fff6c9" />
  </g>
);

// Globo de diálogo. Base en la punta (lo que apunta a quien habla).
export const Globo: React.FC<{ x: number; y: number; texto: string; k: number; ancho?: number }> = ({
  x,
  y,
  texto,
  k,
  ancho = 300,
}) =>
  k <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${k})`} opacity={Math.min(1, k * 1.5)}>
      <path d={`M-12 0 L0 -40 L24 -40 Z`} fill="#fff" />
      <rect x={-ancho / 2} y={-150} width={ancho} height={112} rx={40} fill="#fff" />
      <text x="0" y={-72} textAnchor="middle" fontFamily={TITULO} fontSize={64} fill={C.verde}>
        {texto}
      </text>
    </g>
  );
