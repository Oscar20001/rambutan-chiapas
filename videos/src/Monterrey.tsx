import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
// @ts-ignore: d3-geo no trae tipos
import { geoMercator, geoPath } from 'd3-geo';
// @ts-ignore: topojson-client no trae tipos
import { feature } from 'topojson-client';
import mundo from 'world-atlas/countries-50m.json';
import { Tiempos, TITULO, TEXTO, avance, cuando } from './comun';
import { CierreSerie, useFormato } from './marca';
import { Estudio } from './RambutanAbre';
import { Rambutan } from './Anuncio3D';
import { Arbol, Racimo, hojaGeo, hojaMat } from './Racimo';
import { volcanGeo } from './Croquis';
import { AUREO, CamaraSerie, Chispas, FondoCielo, Frutitos, Panicula, cieloEntre, lugaresPanicula, rnd, suave } from './Naturaleza';
import { Lluvia, LuzSol, ManchaTierra, Nubes, Pasto, Sombras, SueloReal, nublar } from './Realismo';
import { Monton, Reja } from './Cosecha';
import { CamionReal, PisoHuerta, LucesTarde } from './Camion3D';
import { Luna, Murcielago, letrero } from './Acertijo';

// "Este rambután terminó en Monterrey". Formato "empezar por el final" (flash-forward):
// abre en la mesa de Monterrey, rebobina al Soconusco, cuenta el viaje (flor, fruto verde, lluvia, sol,
// murciélagos de noche, maduración, corte, cajas, el tráiler del comprador, carretera) y cierra en la
// misma mesa. Voz de Antonio, sin música, con subtítulos animados palabra por palabra.
// Datos: flores diminutas sin pétalos; de flor a fruto 15–18 semanas; madura de verde a amarillo y rojo;
// murciélagos fruteros comen fruta madura de noche; Tuxtla Chico → Monterrey ≈ 2,000 km por carretera.
// El comprador manda su propio tráiler (nunca decimos que nosotros entregamos).

const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const ORO = '#ffcf6b';
const CREMA = '#fff6e2';
const ROJO = '#e8343f';

const TEX_MTY = letrero(['MONTERREY', 'N. L.'], 512, 256, '#f3ead8', '#7a1c1c', 92);

// ---------- piezas ----------
const Hojas: React.FC = () => (
  <group position={[0, -0.25, 0]}>
    {Array.from({ length: 7 }, (_, i) => {
      const a = i * AUREO;
      return <mesh key={i} geometry={hojaGeo} material={hojaMat} position={[Math.cos(a) * 0.12, -0.05 * i, Math.sin(a) * 0.12]} rotation={[0.9, -a + Math.PI / 2, 0]} scale={0.55 + (i % 3) * 0.08} />;
    })}
  </group>
);

const maderaMesa = new THREE.MeshStandardMaterial({ color: '#6b4329', roughness: 0.55 });
const plato = new THREE.MeshPhysicalMaterial({ color: '#a8552e', roughness: 0.45, clearcoat: 0.5 });
const Mesa: React.FC<{ t: number; abre: number }> = ({ t, abre }) => (
  <group>
    <mesh material={maderaMesa} position={[0, -1.05, 0]} receiveShadow>
      <boxGeometry args={[14, 0.2, 9]} />
    </mesh>
    {/* vetas */}
    {Array.from({ length: 9 }, (_, i) => (
      <mesh key={i} position={[0, -0.945, -4 + i]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 0.03]} />
        <meshStandardMaterial color="#4a2c1a" roughness={0.8} transparent opacity={0.5} />
      </mesh>
    ))}
    <mesh material={plato} position={[0, -0.9, 0]}>
      <cylinderGeometry args={[1.75, 1.4, 0.12, 64]} />
    </mesh>
    <Rambutan escala={0.42} pelos={620} abierto={abre} parte={abre * 0.6} semilla={3} position={[0, -0.42, 0]} rotation={[0.15, t * 0.15, 0]} />
    {/* dos más en el plato */}
    <Rambutan escala={0.34} pelos={400} semilla={5} position={[-1.15, -0.5, -0.6]} rotation={[0.3, 1, 0.2]} />
    <Rambutan escala={0.33} pelos={400} semilla={8} position={[1.1, -0.51, -0.75]} rotation={[-0.2, 2, 0.4]} />
    {/* letrero de mesa */}
    <group position={[2.9, -0.35, 0.6]} rotation={[0, -0.5, 0]}>
      <mesh rotation={[-0.25, 0, 0]}>
        <planeGeometry args={[2.0, 1.0]} />
        <meshStandardMaterial map={TEX_MTY ?? undefined} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  </group>
);

// mano enguantada con tijera de podar
const guante = new THREE.MeshStandardMaterial({ color: '#7a5a3a', roughness: 0.85 });
const manga = new THREE.MeshStandardMaterial({ color: '#2f4f7a', roughness: 0.9 });
const acero = new THREE.MeshStandardMaterial({ color: '#c8ccd2', roughness: 0.25, metalness: 0.9 });
const mango = new THREE.MeshStandardMaterial({ color: '#c0262e', roughness: 0.5 });
const ManoTijera: React.FC<{ position: THREE.Vector3; corta: number }> = ({ position, corta }) => {
  const a = 0.38 * (1 - corta);
  return (
    <group position={position} rotation={[0, -0.6, -0.4]}>
      <mesh material={guante} position={[-0.32, 0, 0]} scale={[1.3, 0.75, 1]}>
        <sphereGeometry args={[0.16, 18, 14]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} material={guante} position={[-0.2, -0.04 - i * 0.035, 0.1 - i * 0.065]} rotation={[0, 0, Math.PI / 2 - 0.3]}>
          <capsuleGeometry args={[0.035, 0.14, 4, 8]} />
        </mesh>
      ))}
      <mesh material={guante} position={[-0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.15, 0.3, 14]} />
      </mesh>
      <mesh material={manga} position={[-1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.17, 0.2, 1.6, 16]} />
      </mesh>
      {[1, -1].map((s) => (
        <group key={s} rotation={[0, 0, s * a]}>
          <mesh material={mango} position={[-0.22, s * 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.03, 0.32, 4, 8]} />
          </mesh>
          <mesh material={acero} position={[0.13, s * 0.012, 0]} scale={[1, 0.35, 0.12]}>
            <sphereGeometry args={[0.13, 14, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// silueta del Cerro de la Silla (Monterrey), aproximada
const Silla: React.FC<{ w: number; h: number; color: string }> = ({ w, h, color }) => (
  <svg width={w} height={h} viewBox="0 0 1000 300" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, bottom: 0 }}>
    <path d="M0 300 L0 230 L120 200 L210 150 L290 110 L330 60 L360 95 L420 150 L480 175 L540 160 L590 120 L630 85 L655 45 L690 90 L760 150 L860 190 L1000 215 L1000 300 Z" fill={color} />
  </svg>
);

// mapa: Monterrey ↔ Tuxtla Chico
const geoMundo = feature(mundo as never, (mundo as unknown as { objects: { countries: never } }).objects.countries) as { features: { id: string }[] };
const VECINOS = new Set(['484', '320', '084', '222', '340', '840']);
const MTY: [number, number] = [-100.31, 25.67];
const TUX: [number, number] = [-92.17, 14.94];
const Mapa: React.FC<{ t: number; desde: number; k: number; w: number; h: number; u: number; hor: boolean; vuelta?: boolean }> = ({ t, desde, k, w, h, u, hor, vuelta }) => {
  const ancho = hor ? w * 0.55 : w * 1.05;
  const alto = hor ? h * 0.9 : h * 0.62;
  const { caminos, a, b, curva } = useMemo(() => {
    const marco = { type: 'Feature', geometry: { type: 'MultiPoint', coordinates: [[-104, 13.5], [-89.5, 27.2]] } } as never;
    const proy = geoMercator().fitSize([ancho, alto], marco);
    const camino = geoPath(proy);
    const caminos = geoMundo.features.filter((f) => VECINOS.has(f.id)).map((f) => ({ d: camino(f as never) ?? '', mx: f.id === '484' }));
    const a = proy(MTY)!;
    const b = proy(TUX)!;
    const c1 = proy([-98.2, 21.6])!;
    const c2 = proy([-95.2, 17.4])!;
    const curva = `M ${a[0]} ${a[1]} C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${b[0]} ${b[1]}`;
    return { caminos, a, b, curva };
  }, [ancho, alto]);
  const ap = avance(t - desde, 0, 0.5);
  const ox = hor ? w * 0.42 : (w - ancho) / 2;
  const oy = hor ? (h - alto) / 2 : h * 0.24;
  // vuelta=false: de Monterrey hacia el sur (rebobinando); vuelta=true: del sur a Monterrey
  const pos = vuelta ? k : k;
  return (
    <div style={{ position: 'absolute', left: ox, top: oy, width: ancho, height: alto, opacity: ap, transform: `scale(${1 + (t - desde) * 0.02})` }}>
      <svg width={ancho} height={alto} style={{ overflow: 'visible' }}>
        <defs>
          <filter id="brilloM" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={6 * u} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {caminos.map((c, i) => (
          <path key={i} d={c.d} fill={c.mx ? 'rgba(255,207,107,.08)' : 'rgba(255,255,255,.03)'} stroke={c.mx ? 'rgba(255,207,107,.6)' : 'rgba(255,255,255,.18)'} strokeWidth={(c.mx ? 2 : 1.2) * u} />
        ))}
        <path d={curva} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={4 * u} strokeDasharray={`${10 * u} ${10 * u}`} />
        <path d={curva} fill="none" stroke={ROJO} strokeWidth={6 * u} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={vuelta ? 1 - pos : -(1 - pos)} filter="url(#brilloM)" />
        {[{ p: a, n: 'MONTERREY', s: 'Nuevo León' }, { p: b, n: 'TUXTLA CHICO', s: 'Chiapas' }].map((m, i) => (
          <g key={i}>
            <circle cx={m.p[0]} cy={m.p[1]} r={(12 + 6 * Math.sin(t * 5 + i)) * u} fill="none" stroke={ORO} strokeWidth={2 * u} opacity={0.7} />
            <circle cx={m.p[0]} cy={m.p[1]} r={8 * u} fill={ORO} filter="url(#brilloM)" />
            <text x={m.p[0] + (i === 0 ? -24 : 24) * u} y={m.p[1] + (i === 0 ? -30 : 20) * u} textAnchor={i === 0 ? 'end' : 'start'} fontFamily={TITULO} fontSize={50 * u} fill={CREMA} letterSpacing={3 * u}>
              {m.n}
            </text>
            <text x={m.p[0] + (i === 0 ? -24 : 24) * u} y={m.p[1] + (i === 0 ? 4 : 54) * u} textAnchor={i === 0 ? 'end' : 'start'} fontFamily={TEXTO} fontStyle="italic" fontSize={32 * u} fill={CREMA} opacity={0.8}>
              {m.s}
            </text>
          </g>
        ))}
      </svg>
      {/* el rambután viajero sobre la ruta */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 44 * u,
          height: 44 * u,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #ff6a5a, #a8101c 70%)',
          boxShadow: `0 0 ${24 * u}px rgba(255,80,80,.9), 0 0 0 ${4 * u}px rgba(255,255,255,.4)`,
          offsetPath: `path('${curva}')`,
          offsetDistance: `${(vuelta ? pos : pos) * 100}%`,
          offsetRotate: '0deg',
        }}
      />
    </div>
  );
};

// texto de golpe (sello)
const Sello: React.FC<{ t: number; desde: number; hasta: number; top: number; size: number; color?: string; fondo?: string; giro?: number; children: React.ReactNode; left?: number; right?: number }> = ({
  t,
  desde,
  hasta,
  top,
  size,
  color = CREMA,
  fondo,
  giro = -2,
  children,
  left,
  right,
}) => {
  if (t < desde || t > hasta + 0.3) return null;
  const e = interpolate(t, [desde, desde + 0.28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2.2)) });
  const s = avance(t, hasta, 0.25);
  return (
    <div style={{ position: 'absolute', left: left ?? 0, right: right ?? 0, top, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div
        style={{
          fontFamily: TITULO,
          fontSize: size,
          lineHeight: 0.95,
          color,
          textAlign: 'center',
          letterSpacing: size * 0.03,
          padding: fondo ? `${size * 0.12}px ${size * 0.3}px ${size * 0.05}px` : 0,
          background: fondo,
          borderRadius: size * 0.12,
          textShadow: fondo ? undefined : `0 ${size * 0.05}px ${size * 0.25}px rgba(0,0,0,.75)`,
          boxShadow: fondo ? `0 ${size * 0.1}px ${size * 0.4}px rgba(0,0,0,.45)` : undefined,
          opacity: e * (1 - s),
          transform: `rotate(${giro}deg) scale(${(0.4 + 0.6 * e) * (1 + s * 0.2)})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// subtítulos animados: grupos de 3 palabras, la palabra que suena se ilumina y salta
const Subtitulos: React.FC<{ t: number; palabras: Tiempos['palabras']; hasta: number; top: number; size: number }> = ({ t, palabras, hasta, top, size }) => {
  if (t >= hasta || !palabras.length) return null;
  const i = palabras.findIndex((p, j) => t >= p.t && (j === palabras.length - 1 || t < palabras[j + 1].t));
  if (i < 0) return null;
  const g = Math.floor(i / 3) * 3;
  const grupo = palabras.slice(g, g + 3);
  // texto original con acentos: se toma de la propia transcripción
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', columnGap: size * 0.35, rowGap: 0 }}>
      {grupo.map((p, j) => {
        const activa = g + j === i;
        const dicha = g + j <= i;
        const pop = activa ? interpolate(t - p.t, [0, 0.12, 0.25], [0.85, 1.08, 1], { extrapolateRight: 'clamp' }) : 1;
        return (
          <span
            key={g + j}
            style={{
              fontFamily: TITULO,
              fontSize: size,
              color: activa ? ORO : dicha ? '#ffffff' : 'rgba(255,255,255,.55)',
              transform: `scale(${pop})`,
              display: 'inline-block',
              WebkitTextStroke: `${size * 0.05}px rgba(0,0,0,.85)`,
              paintOrder: 'stroke fill',
              textShadow: `0 ${size * 0.06}px ${size * 0.2}px rgba(0,0,0,.6)`,
              letterSpacing: size * 0.02,
            }}
          >
            {p.w.toUpperCase()}
          </span>
        );
      })}
    </div>
  );
};

// ---------- video ----------
export const Monterrey: React.FC<Tiempos> = ({ voz, inicios, palabras }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const { w, h, u, tipo, fov } = useFormato();
  const hor = tipo === 'horizontal';
  const vert = tipo === 'vertical';
  const PROV = [0.13, 6.26, 10.39, 16.9, 23.98, 27.36, 32.75, 37.36, 39.04, 43.5, 50.12, 54.11, 63.16, 65.46, 73.32, 78.09];
  const s = PROV.map((x, i) => inicios[i] ?? x);
  s[0] = 0;
  const W = (p: string, desde = 0, otro = 0) => cuando(palabras, p, desde, otro);
  const esc = s.filter((x) => t >= x).length - 1;
  const k = (a: number, b: number) => suave(t, a, b);
  const lerp = (a: THREE.Vector3, b: THREE.Vector3, x: number) => a.clone().lerp(b, x);

  const L = useMemo(lugaresPanicula, []);
  const frutos = useMemo(() => L.puntas.slice(0, 13).map((p, i) => ({ ...p, orden: i / 13 })), [L]);

  const tRebobina = s[1] + 1.4; // fin del efecto de rebobinado
  const mesa = esc === 0 || esc === 13 || esc === 14 || (esc === 1 && t < tRebobina);
  const mapa = esc === 1 && t >= tRebobina;
  const flor = esc >= 3 && esc <= 8 && esc !== 6;
  const huerta = esc === 2 || esc === 6 || esc === 9;
  const cajas = esc === 10;
  const camion = esc === 11 || esc === 12;

  // cielo por escena
  let cielo = cieloEntre('dia', 'dia', 0);
  let noche = 0;
  if (esc === 2) cielo = cieloEntre('amanecer', 'dia', k(s[2], s[3]));
  if (esc === 5) {
    const lluvia = 1 - k(W('sol', s[5], s[5] + 2.2) - 0.3, W('sol', s[5], s[5] + 2.2) + 0.4);
    cielo = nublar(cieloEntre('dia', 'dia', 0), lluvia * 0.85);
  }
  if (esc === 6 || esc === 7) {
    cielo = cieloEntre('atardecer', 'noche', esc === 6 ? k(s[6], s[6] + 1.2) : 1);
    noche = esc === 6 ? k(s[6], s[6] + 1.2) : 1;
  }
  if (esc === 8) {
    cielo = cieloEntre('noche', 'amanecer', k(s[8], s[8] + 2.5));
    noche = 1 - k(s[8], s[8] + 2.5);
  }
  if (esc === 12) cielo = cieloEntre('dia', 'atardecer', k(s[12], s[13]));
  const tSol = W('sol', s[5], s[5] + 2.2);
  const lluvia = esc === 5 ? 1 - k(tSol - 0.3, tSol + 0.4) : 0;

  // maduración del fruto protagonista
  const crecer = esc === 3 ? k(W('fruto', s[3], s[4] - 0.8) - 0.3, s[4]) * 0.35 : esc >= 4 ? 0.35 + k(s[4], s[7]) * 0.65 : 0;
  const madurar = esc < 8 ? 0.04 : k(s[8] + 0.2, W('rojo', s[8], s[8] + 3) + 0.3);
  const florecer = esc === 3 ? 0.15 + k(s[3], s[3] + 2.5) * 0.85 : 1;
  const caer = esc === 3 ? k(W('fruto', s[3], s[4] - 0.8) - 0.6, s[4]) : 1;

  // cámara
  let pos = P(0, 2, 6);
  let mira = P(0, 0, 0);
  let fovE = fov;
  const latido = esc === 7 ? 1 + Math.max(0, Math.sin((t - s[7]) * 7)) * 0.04 : 1;
  if (mesa) {
    if (esc === 0) {
      const x = interpolate(t, [0, 0.7], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.exp) });
      pos = lerp(P(0, 7, 16), P(0, 2.2, 7.6), x).add(P(Math.sin(t * 0.4) * 0.4, 0, -t * 0.25));
      mira = P(0, -0.35, 0);
    } else if (esc === 1) {
      // rebobinado: la cámara se aleja hacia atrás temblando
      const x = k(s[1], tRebobina);
      pos = lerp(P(0, 2.2, 6.2), P(0, 7, 16), x).add(P(Math.sin(t * 40) * 0.05, Math.cos(t * 37) * 0.05, 0));
      mira = P(0, 0.1, 0);
    } else {
      const x = k(s[13], s[14]);
      pos = lerp(P(0, 7, 16), P(0.6, 1.6, 5.4), Easing.out(Easing.cubic)(x)).add(P(0, 0, esc === 14 ? (t - s[14]) * 0.15 : 0));
      mira = P(0, -0.4, 0);
    }
  } else if (esc === 2) {
    const x = k(s[2], s[3]);
    pos = lerp(P(-14, 14, 26), P(-3, 2.6, 9), x);
    mira = lerp(P(4, 6, -60), P(0, 2.6, 0), x);
  } else if (flor) {
    const l = t - s[esc];
    const base = { 3: [-0.4, 3.0, 1.05], 4: [0.4, 2.3, 0.95], 5: [1.0, 2.5, 1.0], 7: [1.8, 2.0, 0.9], 8: [2.5, 2.4, 1.0] }[esc as 3 | 4 | 5 | 7 | 8];
    const giro = base[0] + l * 0.07;
    const dist = (base[1] - l * 0.06) / latido;
    pos = P(Math.sin(giro) * dist, base[2], Math.cos(giro) * dist);
    mira = P(0, esc >= 4 ? 0.95 : 0.9, 0);
    if (esc === 4 || esc === 7 || esc === 8) mira = frutos[6].p.clone().lerp(P(0, 0.9, 0), 0.5);
  } else if (esc === 6) {
    const x = k(s[6], s[7]);
    pos = lerp(P(5, 2, 13), P(4, 2.2, 11.5), x);
    mira = P(0.5, 6.4, 0);
  } else if (esc === 9) {
    const x = k(s[9], s[10]);
    pos = lerp(P(3.2, 2.6, 4.2), P(2.4, 1.9, 3.4), x);
    mira = lerp(P(0.9, 2.1, 1.3), P(1.0, 1.0, 1.8), k(W('racimo', s[9], s[9] + 3), s[10]));
  } else if (cajas) {
    const x = k(s[10], s[11]);
    pos = lerp(P(2.2, 1.6, 3.2), P(-1.5, 2.6, 4.4), x);
    mira = P(0, 0.15, 0);
  } else if (esc === 11) {
    const x = k(s[11], s[12]);
    pos = lerp(P(12, 2.2, 9), P(6, 4.5, 12), x);
    mira = P(-0.5, 1.6, 0);
    fovE = fov * 1.05;
  }
  // tráiler en carretera
  const xCamion = esc === 12 ? -18 + (t - s[12]) * 9 : 0;
  if (esc === 12) {
    pos = P(xCamion + 9, 2.4, 7.5);
    mira = P(xCamion, 1.5, 0);
  }

  // murciélagos rondando la copa
  const murcis = Array.from({ length: 7 }, (_, i) => {
    const r = 2.2 + rnd(i) * 1.6;
    const a = t * (0.9 + rnd(i * 2) * 0.5) + i * 0.9;
    const y = 7.2 + Math.sin(t * 1.3 + i) * 0.5 + rnd(i * 3) * 1.6;
    return { p: P(Math.cos(a) * r, y, Math.sin(a) * r), rumbo: P(-Math.sin(a), Math.cos(t * 1.3 + i) * 0.3, Math.cos(a)), fase: i * 1.7 };
  });
  const llegan = esc === 6 ? k(W('murciélagos', s[6], s[6] + 1) - 0.5, W('murciélagos', s[6], s[6] + 1) + 1.2) : 0;

  // cosecha
  const tCorte = W('cortaron', s[9], s[9] + 2.4);
  const corta = k(tCorte - 0.3, tCorte);
  const caida = Math.min(1, Math.max(0, (t - tCorte) / 0.6));
  const racimoP = P(1.15, 2.05, 1.45).lerp(P(1.0, 0.18, 2.0), caida * caida);

  const kmTotal = 1980;
  const km = esc === 12 ? Math.round(interpolate(t, [s[12], s[13] - 0.2], [0, kmTotal], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) })) : 0;

  const tituloTop = hor ? h * 0.1 : vert ? h * 0.1 : h * 0.07;
  const big = (hor ? 110 : vert ? 150 : 120) * u;
  const med = (hor ? 70 : vert ? 86 : 76) * u;
  const subTop = hor ? h * 0.8 : vert ? h * 0.7 : h * 0.78;
  const lado = hor ? { left: 0, right: w * 0.45 } : {};
  const rebobinando = esc === 1 && t < tRebobina;

  return (
    <AbsoluteFill style={{ background: '#05060a', overflow: 'hidden' }}>
      <AbsoluteFill style={{ filter: rebobinando ? `saturate(0.4) contrast(1.2) hue-rotate(${Math.sin(t * 30) * 12}deg)` : undefined }}>
        {/* fondo 2D */}
        {mesa && (
          <AbsoluteFill style={{ background: 'linear-gradient(180deg, #1c2a4a 0%, #e0794a 30%, #f2b36a 43%, #3a2214 44%, #2a180d 100%)' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '44%' }}>
              <Silla w={w} h={h * 0.3} color="rgba(58,40,70,.85)" />
            </div>
          </AbsoluteFill>
        )}
        {mapa && <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 45%, #13233a, #04070d 75%)' }} />}
        {(huerta || flor || cajas || camion) && <FondoCielo c={cielo} t={t} w={w} h={h} sol={[0.74, 0.17]} bokeh={flor ? 1 : 0} estrellas={noche} horizonte={flor ? 0 : 1} />}

        {!mapa && (
          <ThreeCanvas width={w} height={h} style={{ position: 'absolute', inset: 0 }} gl={{ alpha: true, antialias: true }} shadows="soft">
            <Estudio />
            <CamaraSerie pos={pos} mira={mira} fov={fovE} w={w} h={h} tipo={tipo} />
            {mesa && (
              <>
                <hemisphereLight args={['#ffd6a8', '#2a1a10', 0.6]} />
                <directionalLight position={[4, 6, 5]} intensity={3} color="#ffe2c0" castShadow />
                <directionalLight position={[-5, 3, -4]} intensity={2.2} color="#ff9a5a" />
                <spotLight position={[0, 8, 2]} angle={0.4} penumbra={0.8} intensity={60} color="#fff2dc" />
                <Mesa t={t} abre={esc === 14 ? 1 : esc === 13 ? k(W('árbol', s[13], s[14] - 1) - 0.2, W('árbol', s[13], s[14] - 1) + 1) : 0} />
                <Chispas centro={P(0, 1.2, 0)} radio={3} t={t} color="#ffd9a0" fuerza={0.5} tam={0.03} />
              </>
            )}

            {(huerta || cajas) && (
              <>
                <hemisphereLight args={[cielo.amb, '#0f160c', 0.45 + (1 - noche) * 0.5]} />
                <LuzSol position={noche > 0.5 ? [10, 16, 9] : [12, 9, 6]} color={noche > 0.5 ? '#a9bcff' : cielo.luz} intensity={noche > 0.5 ? 1.3 : 2.8} caja={12} />
                <fog attach="fog" args={[cielo.abajo, 25, 150]} />
                <Sombras />
                <SueloReal radio={170} rep={60} oscuro={noche * 0.35} />
                <Pasto n={45000} radio={12} alto={0.16} ancho={0.65} hueco={1.4} tono={-noche * 0.3} viento={0.22} />
                <ManchaTierra radio={2.6} />
                <Nubes t={t} n={8} altura={55} dist={150} arriba={noche > 0.5 ? '#4a5878' : '#ffffff'} abajo={noche > 0.5 ? '#1b2238' : '#e8c8b8'} opacidad={0.8} vel={1.2} />
                <mesh geometry={volcanGeo} position={[14, -0.5, -120]} scale={[8, 8.5, 8]}>
                  <meshStandardMaterial vertexColors roughness={0.95} envMapIntensity={0.2} />
                </mesh>
                <Luna position={[60, 70, -140]} o={noche} />
                {!cajas && <Arbol position={[0, 0, 0]} racimos={9} />}
                {[[-8, -2], [8, -1], [-7, -10], [7, -11], [0, -12], [-15, 2], [15, 3], [-14, -18], [12, -20]].map(([x, z], i) => (
                  <group key={i} rotation={[0, 0, Math.sin(t * 0.8 + i) * 0.012]}>
                    <Arbol position={[x, 0, z]} racimos={6} escala={0.9 + rnd(i) * 0.25} />
                  </group>
                ))}
                {esc === 6 && <pointLight position={[2, 9, 5]} intensity={35} distance={25} color="#dfe6ff" />}
                <Chispas centro={P(0, 1.2, 2)} radio={3.5} t={t} color="#d8ff70" fuerza={noche * 0.9} tam={0.02} />
                {esc === 6 &&
                  murcis.map((m, i) => (
                    <Murcielago key={i} t={t} position={m.p.clone().add(P(-16, 6, -10).multiplyScalar(1 - llegan))} rumbo={m.rumbo} fase={m.fase} escala={2.6} />
                  ))}
                {esc === 9 && (
                  <>
                    <Racimo n={9} semilla={4} pelos={90} escala={0.32} position={racimoP.toArray() as [number, number, number]} rotation={[caida * 0.9, 0.5 + caida * 0.6, Math.sin(t * 1.7) * 0.05 * (1 - caida)]} hojas />
                    <ManoTijera position={P(1.35 - corta * 0.08, 2.3, 1.55).add(P(0.6, 0.3, 0.4).multiplyScalar(1 - k(s[9] + 0.2, tCorte - 0.5)))} corta={corta} />
                    <Reja position={[1.0, 0, 2.0]} rotation={[0, 0.3, 0]} />
                    <Monton k={caida >= 1 ? 0.35 : 0.2} position={[1.0, 0.01, 2.0]} />
                  </>
                )}
                {cajas &&
                  Array.from({ length: 12 }, (_, i) => {
                    const fila = Math.floor(i / 4);
                    const col = i % 4;
                    const p: [number, number, number] = [-1.2 + col * 0.8, 0, -fila * 0.6 + (fila % 2) * 0.05];
                    const ki = k(s[10] + i * 0.25, s[10] + i * 0.25 + 0.9);
                    return (
                      <group key={i}>
                        <Reja position={p} color={i % 3 === 0 ? '#1d5fc4' : i % 3 === 1 ? '#2a8a3e' : '#c8202b'} />
                        <Monton k={ki} position={[p[0], 0.01, p[2]]} />
                      </group>
                    );
                  })}
              </>
            )}

            {flor && (
              <>
                <hemisphereLight args={[cielo.amb, '#3a5a20', 0.5 + (1 - noche) * 0.4]} />
                <directionalLight position={[4, 5, 3]} intensity={noche > 0.5 ? 0.9 : 2.6 * (1 - lluvia * 0.4)} color={noche > 0.5 ? '#a9bcff' : cielo.luz} />
                <directionalLight position={[-3, 1.5, -4]} intensity={1.0} color={noche > 0.5 ? '#6f80c0' : '#ffe0b0'} />
                {esc === 7 && <pointLight position={[0.8, 1.4, 1.4]} intensity={4} distance={4} color="#ffd9a0" />}
                <Panicula florecer={florecer} caer={caer} t={t} />
                <Hojas />
                {crecer > 0 && <Frutitos lugares={frutos} crecer={crecer} madurar={madurar} />}
                {esc === 3 && <Chispas centro={frutos[6].p} radio={0.12} t={t} fuerza={k(W('una', s[3] + 2, s[3] + 4) - 0.2, W('una', s[3] + 2, s[3] + 4) + 0.3)} tam={0.02} />}
                {esc === 5 && <Lluvia t={t} fuerza={lluvia} centro={P(0, -0.5, 0)} radio={3} alto={4} n={2500} suelo={-0.6} />}
                <Chispas centro={P(0, 0.9, 0)} radio={1.2} t={t} color="#d8ff70" fuerza={noche * 0.8} tam={0.012} />
              </>
            )}

            {camion && (
              <>
                <LucesTarde />
                <fog attach="fog" args={[cielo.abajo, 30, 110]} />
                <PisoHuerta />
                <mesh geometry={volcanGeo} position={[10, -0.5, -90]} scale={[6, 6.5, 6]}>
                  <meshStandardMaterial vertexColors roughness={0.95} envMapIntensity={0.2} />
                </mesh>
                <CamionReal position={[xCamion, 0, 0]} cajas={esc === 11 ? Math.round(interpolate(t, [W('tráiler', s[11], s[11] + 2), s[12] - 0.5], [0, 72], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })) : 72} giroRuedas={xCamion / 0.52} luces={esc === 12} />
                {esc === 11 && (
                  // portón de la huerta, abierto
                  <group position={[-1, 0, -3.2]}>
                    {[-1, 1].map((sx) => (
                      <mesh key={sx} position={[sx * 4.5, 1.1, 0]}>
                        <boxGeometry args={[0.25, 2.2, 0.25]} />
                        <meshStandardMaterial color="#6b4a2e" roughness={0.9} />
                      </mesh>
                    ))}
                  </group>
                )}
              </>
            )}
          </ThreeCanvas>
        )}
        <AbsoluteFill style={{ background: noche > 0.5 ? 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,.65) 100%)' : 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.45) 100%)' }} />
      </AbsoluteFill>

      {/* rebobinado tipo cinta */}
      {rebobinando && (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0px, rgba(255,255,255,.06) 2px, transparent 2px, transparent 6px)' }} />
          <div style={{ position: 'absolute', top: ((t * 900) % h), left: 0, right: 0, height: 26 * u, background: 'rgba(255,255,255,.18)', filter: 'blur(4px)' }} />
          <div style={{ position: 'absolute', left: 50 * u, top: 60 * u, fontFamily: TITULO, fontSize: 90 * u, color: '#fff', textShadow: '0 0 20px rgba(0,0,0,.6)' }}>◀◀ REBOBINA</div>
        </AbsoluteFill>
      )}
      {mapa && <Mapa t={t} desde={tRebobina} k={k(tRebobina, s[2] - 0.2)} w={w} h={h} u={u} hor={hor} />}

      {/* ---------- textos ---------- */}
      <Sello t={t} desde={0.15} hasta={W('dos', 0, 3.5) - 0.1} top={tituloTop} size={med} giro={-2} {...lado}>
        ESTE RAMBUTÁN TERMINÓ EN…
      </Sello>
      <Sello t={t} desde={W('monterrey', 0, 2.6) - 0.1} hasta={s[1] - 0.1} top={tituloTop + med * 1.3} size={big} color="#fff" fondo={ROJO} giro={2} {...lado}>
        MONTERREY
      </Sello>
      <Sello t={t} desde={W('dos', 0, 3.6) - 0.1} hasta={s[1] - 0.1} top={tituloTop + med * 1.3 + big * 1.3} size={big * 0.9} color={ORO} giro={-3} {...lado}>
        ≈ 2,000 KM
      </Sello>
      <Sello t={t} desde={W('nadie', s[1], s[1] + 0.4) - 0.1} hasta={s[2] - 0.15} top={mapa ? (hor ? h * 0.06 : h * 0.1) : tituloTop} size={med} giro={1} {...lado}>
        ¿CÓMO LLEGÓ AHÍ?
      </Sello>
      <Sello t={t} desde={W('tuxtla', s[2], s[2] + 3) - 0.2} hasta={s[3] - 0.15} top={tituloTop} size={med} color="#fff" fondo="rgba(19,54,33,.9)" giro={-1.5} {...lado}>
        TUXTLA CHICO, CHIAPAS
      </Sello>
      <Sello t={t} desde={W('tacaná', s[2], s[2] + 5) - 0.2} hasta={s[3] - 0.15} top={tituloTop + med * 1.5} size={med * 0.8} giro={1.5} {...lado}>
        🌋 AL PIE DEL TACANÁ
      </Sello>
      <Sello t={t} desde={W('miles', s[3], s[3] + 0.8) - 0.1} hasta={W('una', s[3] + 2, s[3] + 4) - 0.2} top={tituloTop} size={med} giro={-2} {...lado}>
        MILES DE FLORES DE MENOS DE 5 MM
      </Sello>
      <Sello t={t} desde={W('una', s[3] + 2, s[3] + 4) - 0.1} hasta={s[4] - 0.15} top={tituloTop} size={med} color={ORO} giro={2} {...lado}>
        ✨ SOLO UNA SE VOLVIÓ FRUTO
      </Sello>
      <Sello t={t} desde={W('verde', s[4], s[4] + 1.5) - 0.2} hasta={s[5] - 0.15} top={tituloTop} size={med} color="#c8f07a" giro={-1.5} {...lado}>
        SEMANA 1 · BOLITA VERDE
      </Sello>
      <Sello t={t} desde={W('aguaceros', s[5], s[5] + 0.8) - 0.15} hasta={tSol - 0.2} top={tituloTop} size={med} giro={-2} {...lado}>
        🌧 AGUACEROS DE MAYO
      </Sello>
      <Sello t={t} desde={tSol - 0.15} hasta={s[6] - 0.15} top={tituloTop} size={med} color={ORO} giro={2} {...lado}>
        ☀️ SOL DE JUNIO
      </Sello>
      <Sello t={t} desde={W('noche', s[6], s[6] + 0.8) - 0.15} hasta={s[7] - 0.15} top={tituloTop} size={med} color="#c9d4ff" giro={-2} {...lado}>
        🌙 CADA NOCHE…
      </Sello>
      <Sello t={t} desde={W('murciélagos', s[6], s[6] + 1.4) - 0.1} hasta={s[7] - 0.15} top={tituloTop + med * 1.4} size={med * 1.1} color="#fff" fondo="rgba(120,20,30,.92)" giro={1.5} {...lado}>
        🦇 MURCIÉLAGOS
      </Sello>
      <Sello t={t} desde={W('aguantó', s[7], s[7] + 0.6) - 0.1} hasta={s[8] - 0.1} top={tituloTop} size={big} color={ORO} giro={-3} {...lado}>
        ¡AGUANTÓ!
      </Sello>
      <Sello t={t} desde={W('amarillito', s[8], s[8] + 0.8) - 0.15} hasta={W('rojo', s[8], s[8] + 2.5) - 0.2} top={tituloTop} size={med} color="#ffe36a" giro={-2} {...lado}>
        VERDE → AMARILLO…
      </Sello>
      <Sello t={t} desde={W('rojo', s[8], s[8] + 2.5) - 0.1} hasta={s[9] - 0.15} top={tituloTop} size={big} color="#fff" fondo={ROJO} giro={2} {...lado}>
        ¡ROJO INTENSO!
      </Sello>
      <Sello t={t} desde={W('manos', s[9], s[9] + 1) - 0.15} hasta={s[10] - 0.15} top={tituloTop} size={med} giro={-1.5} {...lado}>
        ✂️ CORTADO A MANO, CON TODO Y RACIMO
      </Sello>
      <Sello t={t} desde={W('miles', s[10], s[10] + 1.5) - 0.15} hasta={s[11] - 0.15} top={tituloTop} size={med} color={ORO} giro={2} {...lado}>
        JUNTO A MILES DE HERMANOS
      </Sello>
      <Sello t={t} desde={W('tráiler', s[11], s[11] + 1.5) - 0.15} hasta={s[12] - 0.15} top={tituloTop} size={med} giro={-1.5} {...lado}>
        🚛 EL TRÁILER DEL COMPRADOR
      </Sello>
      <Sello t={t} desde={W('tonelada', s[11], s[12] - 1.2) - 0.15} hasta={s[12] - 0.15} top={tituloTop + med * 1.4} size={med * 1.1} color="#fff" fondo={ROJO} giro={1.5} {...lado}>
        VENTA POR TONELADA
      </Sello>
      {esc === 12 && (
        <div style={{ position: 'absolute', ...(hor ? { left: w * 0.06, top: h * 0.12 } : { left: 0, right: 0, top: tituloTop }), textAlign: 'center', fontFamily: TITULO, color: CREMA, textShadow: '0 6px 24px rgba(0,0,0,.7)' }}>
          <div style={{ fontSize: big * 1.2, lineHeight: 0.9, color: ORO }}>{km.toLocaleString('en-US')} KM</div>
          <div style={{ fontSize: med * 0.6, letterSpacing: 6 * u }}>RUMBO AL NORTE</div>
        </div>
      )}
      <Sello t={t} desde={W('monterrey', s[13], s[13] + 3) - 0.1} hasta={s[14] - 0.1} top={tituloTop} size={big} color="#fff" fondo={ROJO} giro={-2} {...lado}>
        MONTERREY
      </Sello>
      <Sello t={t} desde={W('dos', s[13], s[13] + 4) - 0.1} hasta={s[14] - 0.1} top={tituloTop + big * 1.25} size={big * 0.85} color={ORO} giro={2} {...lado}>
        ≈ 2,000 KM DESPUÉS
      </Sello>
      <Sello t={t} desde={s[14]} hasta={s[15] - 0.1} top={hor ? h * 0.3 : h * 0.26} size={big * 0.8} color="#fff" fondo="rgba(19,54,33,.92)" giro={-2} {...lado}>
        ¿DESDE QUÉ CIUDAD NOS VES? 👇
      </Sello>

      <Subtitulos t={t} palabras={palabras} hasta={s[15]} top={subTop} size={(hor ? 64 : vert ? 82 : 70) * u} />

      <CierreSerie t={t} desde={s[15]} fondo="radial-gradient(circle at 50% 40%, #4a1a1f, #0d0507 75%)" />
      <Continuara t={t} desde={durationInFrames / fps - 4.4} u={u} big={big} />
      {voz && <Audio src={staticFile(`voz/${voz}/toma.mp3`)} />}
    </AbsoluteFill>
  );
};

// cierre de suspenso: pantalla negra, latido y "CONTINUARÁ…" letra por letra
const Continuara: React.FC<{ t: number; desde: number; u: number; big: number }> = ({ t, desde, u, big }) => {
  if (t < desde) return null;
  const l = t - desde;
  const texto = 'CONTINUARÁ…';
  const n = Math.min(texto.length, Math.floor(Math.max(0, l - 0.5) / 0.09));
  const lat = 1 + Math.max(0, Math.sin(l * 6)) * 0.03;
  return (
    <AbsoluteFill style={{ opacity: avance(l, 0, 0.35), background: 'radial-gradient(circle at 50% 50%, #3a070d, #000 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{ fontFamily: TITULO, fontSize: big * 1.05, color: CREMA, letterSpacing: big * 0.06, transform: `scale(${lat})`, textShadow: `0 0 ${40 * u}px rgba(232,52,63,.8)` }}>
        {texto.slice(0, n)}
        <span style={{ opacity: Math.floor(l * 3) % 2 ? 1 : 0 }}>|</span>
      </div>
      <div style={{ fontFamily: TEXTO, fontStyle: 'italic', fontSize: 46 * u, color: CREMA, opacity: avance(l, 1.8, 0.6), marginTop: 20 * u, textAlign: 'center', padding: `0 ${60 * u}px` }}>
        ¿Cuál será la próxima ciudad? Síguenos para no perdértelo
      </div>
    </AbsoluteFill>
  );
};
