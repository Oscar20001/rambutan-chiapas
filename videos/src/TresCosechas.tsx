import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Estudio } from './RambutanAbre';
import { Arbol } from './Racimo';
import { CamaraSerie, Chispas, FondoCielo, Pajaro, cieloEntre, suave, Hora } from './Naturaleza';
import { CierreSerie, Rotulo, useFormato } from './marca';
import { TITULO } from './comun';

// Video 3 de la serie: "Las 3 cosechas". Solo música.
// Un día entero en la huerta (amanecer → día → atardecer → noche); cada momento es una temporada.
// Datos del Soconusco (Pérez Romero y Pohlan, LEISA 2004): temprana mayo–junio, normal finales de julio–agosto,
// tardía agosto–octubre; un árbol adulto da de 100 a 300 kg.

export const DURACION_COSECHAS = 22.5;
const S = { temprana: 3, normal: 7, tardia: 11, kilos: 15, cierre: 18.6 };

// cielo según la hora del video
const cieloEn = (t: number) => {
  const tramos: [number, Hora][] = [
    [0, 'amanecer'],
    [5, 'dia'],
    [10, 'dia'],
    [13, 'atardecer'],
    [16, 'noche'],
  ];
  let i = 0;
  while (i < tramos.length - 1 && t > tramos[i + 1][0]) i++;
  if (i === tramos.length - 1) return { c: cieloEntre('noche', 'noche', 0), noche: 1 };
  const [t0, a] = tramos[i];
  const [t1, b] = tramos[i + 1];
  const k = suave(t, t0, t1);
  return { c: cieloEntre(a, b, k), noche: b === 'noche' ? k : 0 };
};

const MESES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
// arcos en meses (0 = enero); fracciones para "finales de julio"
const COSECHAS = [
  { de: 4, a: 6, color: '#b8f02e', aparece: S.temprana },
  { de: 6.6, a: 8, color: '#ffd84d', aparece: S.normal },
  { de: 7, a: 10, color: '#ff5a4a', aparece: S.tardia },
];

const Rueda: React.FC<{ t: number; tam: number }> = ({ t, tam }) => {
  const r = tam * 0.4;
  const c = tam / 2;
  const arco = (de: number, a: number, rr: number, k: number) => {
    const a0 = (de / 12) * Math.PI * 2 - Math.PI / 2;
    const a1 = a0 + ((a - de) / 12) * Math.PI * 2 * k;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${c + Math.cos(a0) * rr} ${c + Math.sin(a0) * rr} A ${rr} ${rr} 0 ${large} 1 ${c + Math.cos(a1) * rr} ${c + Math.sin(a1) * rr}`;
  };
  const o = suave(t, S.temprana - 0.3, S.temprana + 0.3) * (1 - suave(t, S.kilos - 0.4, S.kilos));
  return (
    <svg width={tam} height={tam} style={{ opacity: o, filter: `drop-shadow(0 0 ${tam * 0.03}px rgba(0,0,0,.6))` }}>
      <circle cx={c} cy={c} r={r} fill="rgba(0,0,0,.35)" stroke="rgba(255,248,230,.5)" strokeWidth={tam * 0.006} />
      {/* doce divisiones: el reloj del año */}
      {MESES.map((m, i) => {
        const a = ((i + 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
        const a2 = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return (
          <g key={i}>
            <line x1={c + Math.cos(a2) * r * 0.62} y1={c + Math.sin(a2) * r * 0.62} x2={c + Math.cos(a2) * r} y2={c + Math.sin(a2) * r} stroke="rgba(255,248,230,.25)" strokeWidth={tam * 0.004} />
            <text x={c + Math.cos(a) * r * 0.78} y={c + Math.sin(a) * r * 0.78 + tam * 0.025} textAnchor="middle" fontFamily={TITULO} fontSize={tam * 0.075} fill="#fff8e6">
              {m}
            </text>
          </g>
        );
      })}
      {COSECHAS.map((k, i) => {
        const v = suave(t, k.aparece, k.aparece + 1.2);
        if (v <= 0) return null;
        return <path key={i} d={arco(k.de, k.a, r * (1.08 + i * 0.09), v)} stroke={k.color} strokeWidth={tam * 0.035} strokeLinecap="round" fill="none" />;
      })}
    </svg>
  );
};

const Suelo: React.FC<{ noche: number }> = ({ noche }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]}>
    <circleGeometry args={[90, 64]} />
    <meshStandardMaterial color={new THREE.Color('#4f7a2e').lerp(new THREE.Color('#14240f'), noche * 0.6)} roughness={0.95} />
  </mesh>
);

// hileras de árboles lejanos (copas suaves) que forman la huerta
const Hileras: React.FC = () => {
  const im = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 3), new THREE.MeshStandardMaterial({ roughness: 0.9 }), 80);
    const m4 = new THREE.Matrix4();
    let n = 0;
    for (let f = 0; f < 4; f++)
      for (let c = -10; c < 10; c++) {
        const x = c * 7 + (f % 2) * 3.5;
        const z = -16 - f * 8;
        const s = 2.6 + ((c * 7 + f * 3) % 5) * 0.2;
        m4.compose(new THREE.Vector3(x, s * 1.5, z), new THREE.Quaternion(), new THREE.Vector3(s * 1.15, s, s * 1.15));
        m.setMatrixAt(n, m4);
        m.setColorAt(n, new THREE.Color().setHSL(0.28 + ((c + f) % 3) * 0.015, 0.45, 0.17 + ((c * 3 + f) % 4) * 0.02));
        n++;
      }
    return m;
  }, []);
  return <primitive object={im} />;
};

export const TresCosechas: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { w, h, u, tipo, fov } = useFormato();
  const { c: cielo, noche } = cieloEn(t);

  // el sol cruza el cielo y se pone; luego sale la luna
  const ks = Math.min(1, t / 15.5);
  const sol: [number, number] = noche > 0.6 ? [0.22, 0.2] : [0.12 + ks * 0.76, 0.62 - Math.sin(ks * Math.PI) * 0.5];
  const ang = -0.6 + t * 0.075;
  const lejos = tipo === 'vertical' ? 1.4 : tipo === 'cuadrado' ? 1.3 : 1.55;
  const pos = new THREE.Vector3(Math.sin(ang) * 11 * lejos, 2.6 + Math.sin(t * 0.25) * 0.3, Math.cos(ang) * 11 * lejos);
  const mira = new THREE.Vector3(0, 3.3, 0);
  const luzDir = new THREE.Vector3((sol[0] - 0.5) * 30, 4 + (0.62 - sol[1]) * 30, 8);

  const vuelo = (t0: number, dura: number, y: number, z: number, fase: number) => {
    const k = (t - t0) / dura;
    return { ok: k > 0 && k < 1, p: new THREE.Vector3(-14 + k * 28, y + Math.sin(k * Math.PI) * 1.2, z), fase };
  };
  const pajaros = [vuelo(1.2, 3.5, 6.5, -4, 0), vuelo(1.6, 3.8, 7.2, -6, 1.1), vuelo(8, 3.6, 7, -3, 0.5), vuelo(12, 4, 6.2, -5, 2)];

  const rueda = (tipo === 'horizontal' ? 400 : 470) * u;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <FondoCielo c={cielo} t={t} w={w} h={h} sol={sol} bokeh={0} estrellas={noche} horizonte={0.6} />
      <ThreeCanvas width={w} height={h} style={{ position: 'absolute', inset: 0 }} gl={{ alpha: true, antialias: true }}>
        <Estudio />
        <CamaraSerie pos={pos} mira={mira} fov={fov} w={w} h={h} tipo={tipo} />
        <hemisphereLight args={[cielo.amb, '#2a3a18', 1.0 - noche * 0.6]} />
        <directionalLight position={luzDir.toArray()} intensity={2.8 - noche * 2.3} color={cielo.luz} />
        <directionalLight position={[-8, 6, -6]} intensity={0.6 + noche * 0.4} color={noche > 0.5 ? '#7f95ff' : '#ffe0b0'} />
        <fog attach="fog" args={[cielo.abajo, 18, 70]} />
        <Suelo noche={noche} />
        <Hileras />
        <Arbol position={[0, 0, 0]} racimos={9} />
        <Arbol position={[-8, 0, -4]} racimos={6} escala={0.9} />
        {pajaros.map((p, i) => p.ok && noche < 0.5 && <Pajaro key={i} position={p.p} rumbo={new THREE.Vector3(1, 0, 0.05)} t={t} escala={0.35} fase={p.fase} />)}
        {noche > 0 && <Chispas n={90} centro={new THREE.Vector3(0, 2.4, 0)} radio={5.5} t={t} color="#d8ff6a" fuerza={noche} tam={0.05} />}
      </ThreeCanvas>

      <Rotulo t={t} desde={0.3} hasta={S.temprana - 0.1} titulo={<>¿CUÁNDO HAY<br /><span style={{ color: '#ff4a5a' }}>RAMBUTÁN</span>?</>} sub="Así se dan las cosechas en el Soconusco." />
      <Rotulo t={t} desde={S.temprana + 0.2} hasta={S.normal - 0.1} titulo={<>COSECHA<br /><span style={{ color: '#b8f02e' }}>TEMPRANA</span></>} sub="De mayo a junio." />
      <Rotulo t={t} desde={S.normal + 0.2} hasta={S.tardia - 0.1} titulo={<>COSECHA<br /><span style={{ color: '#ffd84d' }}>NORMAL</span></>} sub="De finales de julio a agosto." />
      <Rotulo t={t} desde={S.tardia + 0.2} hasta={S.kilos - 0.1} titulo={<>COSECHA<br /><span style={{ color: '#ff5a4a' }}>TARDÍA</span></>} sub="De agosto a octubre." />
      <Rotulo t={t} desde={S.kilos + 0.2} hasta={S.cierre - 0.05} titulo={<>UN ÁRBOL ADULTO<br />DA DE <span style={{ color: '#ffd84d' }}>100 A 300 KG</span></>} sub="De fruta, según estudios en el Soconusco." />

      <div
        style={
          tipo === 'horizontal'
            ? { position: 'absolute', left: w * 0.08, bottom: h * 0.08 }
            : { position: 'absolute', left: (w - rueda) / 2, bottom: h * (tipo === 'vertical' ? 0.08 : 0.03) }
        }
      >
        <Rueda t={t} tam={rueda} />
      </div>

      <CierreSerie t={t} desde={S.cierre} fondo="radial-gradient(circle at 50% 40%, #1a2a4a, #050a1c 75%)" />
      <Audio src={staticFile('cosechas/musica.wav')} />
    </AbsoluteFill>
  );
};
