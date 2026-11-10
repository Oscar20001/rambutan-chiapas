import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Estudio } from './RambutanAbre';
import { Arbol } from './Racimo';
import { CamaraSerie, Chispas, FondoCielo, Frutitos, Pajaro, cieloEntre, suave, rnd, AUREO, Lugar } from './Naturaleza';
import { Destello, LuzSol, Lluvia, ManchaTierra, Nubes, Pasto, Sombras, SueloReal, nublar, relojViento } from './Realismo';
import { CamionReal } from './Camion3D';
import { HojasCayendo, Monton, RacimoQueCae, Reja } from './Cosecha';
import { CierreSerie, Rotulo, useFormato } from './marca';
import { avance, TITULO } from './comun';

// Video 4 de la serie: "El primer rambután de México". Voz de Antonio como abuelo que cuenta una historia.
// El video empieza en sepia (1960) y recupera el color conforme avanza la historia.
// Datos: TecnoAgro (2019): llegó en 1960, primer árbol en el patio de la Estación Experimental Rosario Izapa
// (INIA, hoy INIFAP) en Tuxtla Chico; frutos de color y sabor variables; auge en los noventa; Chiapas, primer productor.

export const DURACION_PRIMER = 43;
// tiempos de la voz (transcripción palabra por palabra)
const T = { patio: 3.6, sembro: 8.0, primer: 10.9, caso: 13.9, colores: 16.5, semillas: 20.3, noventa: 24.2, hoy: 26.5, viva: 29.5, cierre: 32.0 };

const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ---------- el campo experimental: casa de muros blancos y techo de teja ----------
const texCanvas = (w: number, h: number, pinta: (g: CanvasRenderingContext2D) => void, rx = 1, ry = 1) => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  pinta(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
// enjarre de cal con manchas de humedad abajo
const muroTex = texCanvas(512, 512, (g) => {
  g.fillStyle = '#efe6d6';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4000; i++) {
    const v = 200 + Math.floor(rnd(i * 3.3) * 45);
    g.fillStyle = `rgba(${v},${v - 8},${v - 22},.35)`;
    g.fillRect(rnd(i) * 512, rnd(i * 1.9) * 512, 2 + rnd(i * 2.7) * 6, 2 + rnd(i * 4.1) * 6);
  }
  const gr = g.createLinearGradient(0, 380, 0, 512);
  gr.addColorStop(0, 'rgba(120,95,60,0)');
  gr.addColorStop(1, 'rgba(120,95,60,.45)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 512, 512);
});
// teja de barro: hileras de canales con sombra entre una y otra
const tejaTex = texCanvas(512, 512, (g) => {
  for (let x = 0; x < 512; x += 32) {
    const gr = g.createLinearGradient(x, 0, x + 32, 0);
    gr.addColorStop(0, '#6e2716');
    gr.addColorStop(0.5, '#c0583a');
    gr.addColorStop(1, '#7a2e1a');
    g.fillStyle = gr;
    g.fillRect(x, 0, 32, 512);
  }
  for (let y = 0; y < 512; y += 64) {
    g.fillStyle = 'rgba(40,10,0,.35)';
    g.fillRect(0, y, 512, 6);
  }
  for (let i = 0; i < 1500; i++) {
    g.fillStyle = `rgba(${rnd(i) > 0.5 ? '40,40,30' : '200,150,110'},.12)`;
    g.fillRect(rnd(i * 2.2) * 512, rnd(i * 3.1) * 512, 3, 3);
  }
}, 0.35, 0.35);
const muroMat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: muroTex, roughness: 0.92 });
const tejaMat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: tejaTex, roughness: 0.75 });
const oscuroMat = new THREE.MeshStandardMaterial({ color: '#2a1d14', roughness: 0.9 });
const maderaMat = new THREE.MeshStandardMaterial({ color: '#6b4a2b', roughness: 0.85 });
const techoGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(-3.6, 0);
  s.lineTo(0, 1.5);
  s.lineTo(3.6, 0);
  s.lineTo(-3.6, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 4.2, bevelEnabled: false });
  g.translate(0, 0, -2.1);
  return g;
})();
const Casa: React.FC = () => (
  <group position={[0, 0, -7]}>
    <mesh material={muroMat} position={[0, 1.4, 0]}>
      <boxGeometry args={[6.6, 2.8, 3.6]} />
    </mesh>
    <mesh geometry={techoGeo} material={tejaMat} position={[0, 2.8, 0]} />
    {/* corredor con arcos: pilares y vigas */}
    {[-2.6, -1.3, 0, 1.3, 2.6].map((x) => (
      <mesh key={x} material={muroMat} position={[x, 1.1, 2.3]}>
        <boxGeometry args={[0.28, 2.2, 0.28]} />
      </mesh>
    ))}
    <mesh material={tejaMat} position={[0, 2.35, 2.2]} rotation={[0.25, 0, 0]}>
      <boxGeometry args={[6.9, 0.08, 1.4]} />
    </mesh>
    <mesh material={oscuroMat} position={[0, 0.9, 1.81]}>
      <boxGeometry args={[0.9, 1.8, 0.05]} />
    </mesh>
    {[-2, 2].map((x) => (
      <mesh key={x} material={oscuroMat} position={[x, 1.5, 1.81]}>
        <boxGeometry args={[0.8, 0.8, 0.05]} />
      </mesh>
    ))}
  </group>
);

// cerca de madera del patio
const Cerca: React.FC = () => (
  <group>
    {Array.from({ length: 15 }, (_, i) => (
      <mesh key={i} material={maderaMat} position={[-7 + i, 0.5, 4.5]}>
        <boxGeometry args={[0.1, 1, 0.1]} />
      </mesh>
    ))}
    {[0.35, 0.75].map((y) => (
      <mesh key={y} material={maderaMat} position={[0, y, 4.5]}>
        <boxGeometry args={[14, 0.06, 0.05]} />
      </mesh>
    ))}
  </group>
);

// semilla que cae y brota: tallito con dos hojitas que crece hasta ser un arbolito
const Brote: React.FC<{ k: number }> = ({ k }) => {
  if (k <= 0) return null;
  const alto = 0.05 + k * 0.9;
  return (
    <group>
      <mesh position={[0, alto / 2, 0]}>
        <cylinderGeometry args={[0.012 + k * 0.02, 0.02 + k * 0.03, alto, 8]} />
        <meshStandardMaterial color="#6b7a3a" roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const v = suave(k, i * 0.18, i * 0.18 + 0.4);
        if (v <= 0) return null;
        const a = i * AUREO;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.08 * v, alto * (0.55 + i * 0.13), Math.sin(a) * 0.08 * v]} rotation={[0.6, -a, 0.3]} scale={[0.12 * v, 0.02, 0.22 * v]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshStandardMaterial color="#3f7a2e" roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
};

// copas de árbol con relieve (no esferas lisas): icosaedro deformado con ruido
const copaGeo = (() => {
  const g = new THREE.IcosahedronGeometry(1, 5);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i));
    const n = 1 + 0.12 * Math.sin(v.x * 7.1 + v.y * 3.3) * Math.cos(v.z * 6.7 - v.y * 2.1) + 0.06 * Math.sin(v.x * 15 + v.z * 13);
    v.multiplyScalar(n);
    v.y *= 0.82;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
})();

// follaje: muchas hojitas de varios verdes con brillo, para que la copa no se vea lisa
const follajeTex = texCanvas(512, 512, (g) => {
  g.fillStyle = '#1d3a16';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5200; i++) {
    const l = 18 + rnd(i * 6.1) * 34;
    g.fillStyle = `hsl(${88 + rnd(i * 4.4) * 30},${35 + rnd(i * 5.5) * 30}%,${l}%)`;
    g.beginPath();
    g.ellipse(rnd(i * 1.1) * 512, rnd(i * 2.3) * 512, 3 + rnd(i * 3.7) * 7, 1.5 + rnd(i * 7.9) * 3, rnd(i * 8.3) * 3.14, 0, Math.PI * 2);
    g.fill();
  }
}, 2, 2);

// huertas que nacen en espiral áurea alrededor del primer árbol (filotaxia de Vogel)
const N_HUERTA = 900;
const Huertas: React.FC<{ cuantos: number; fruta: number }> = ({ cuantos, fruta }) => {
  const { copas, troncos, frutas, lugares } = useMemo(() => {
    const c = new THREE.InstancedMesh(copaGeo, new THREE.MeshStandardMaterial({ roughness: 0.8, map: follajeTex, bumpMap: follajeTex, bumpScale: 3 }), N_HUERTA);
    const tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.1, 1, 6), new THREE.MeshStandardMaterial({ color: '#5b4330', roughness: 0.95 }), N_HUERTA);
    const fr = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({ color: '#d0202e', roughness: 0.5, emissive: new THREE.Color('#400000'), emissiveIntensity: 0.4 }), N_HUERTA * 6);
    const l = Array.from({ length: N_HUERTA }, (_, i) => {
      const r = 1.9 * Math.sqrt(i + 4);
      const a = (i + 4) * AUREO;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      // se deja libre el lugar del tráiler y de la reja de la cosecha
      const libre = (x > -7 && x < 5.5 && z < -4.5 && z > -11.5) || (x > -1 && x < 5 && z > -1 && z < 4);
      return { x, z, s: libre ? 0 : 0.75 + rnd(i) * 0.35 };
    });
    l.forEach((_, i) => c.setColorAt(i, new THREE.Color().setHSL(0.25 + rnd(i * 3) * 0.06, 0.45, 0.55 + rnd(i * 5) * 0.2)));
    return { copas: c, troncos: tr, frutas: fr, lugares: l };
  }, []);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  lugares.forEach((l, i) => {
    const k = Math.max(0, Math.min(1, cuantos - i)); // cada árbol brota en su turno
    const s = l.s * (k < 1 ? Math.sin(k * Math.PI * 0.5) * (1 + 0.15 * Math.sin(k * Math.PI)) : 1);
    m4.compose(P(l.x, 1.2 * s + 0.6 * s, l.z), q, P(s * 1.1, s, s * 1.1));
    copas.setMatrixAt(i, m4);
    m4.compose(P(l.x, 0.6 * s, l.z), q, P(s, 1.2 * s, s));
    troncos.setMatrixAt(i, m4);
    for (let j = 0; j < 6; j++) {
      const a = j * AUREO + i;
      const yy = 0.1 + rnd(i * 7 + j) * 0.5;
      const rr = Math.sqrt(1 - yy * yy) * 1.08 * s;
      const fs = 0.065 * s * fruta;
      m4.compose(P(l.x + Math.cos(a) * rr, 1.8 * s + yy * s * 0.85, l.z + Math.sin(a) * rr), q, P(fs, fs, fs));
      frutas.setMatrixAt(i * 6 + j, m4);
    }
  });
  copas.instanceMatrix.needsUpdate = true;
  troncos.instanceMatrix.needsUpdate = true;
  frutas.instanceMatrix.needsUpdate = true;
  return (
    <>
      <primitive object={copas} />
      <primitive object={troncos} />
      <primitive object={frutas} />
    </>
  );
};

// las primeras frutas: cada una de un color distinto (de verde amarillento a rojo)
const MESA_LUGARES: Lugar[] = [-1.2, -0.6, 0, 0.6, 1.2].map((x, i) => ({ p: P(x, 1.25, 1.2), n: P(0, 1, 0), orden: i / 5 }));
const Mesa: React.FC<{ t: number }> = ({ t }) => (
  <group>
    <mesh material={maderaMat} position={[0, 0.95, 1.2]}>
      <boxGeometry args={[3.4, 0.08, 1.1]} />
    </mesh>
    {[-1.5, 1.5].map((x) => (
      <mesh key={x} material={maderaMat} position={[x, 0.47, 1.2]}>
        <boxGeometry args={[0.08, 0.95, 0.9]} />
      </mesh>
    ))}
    {MESA_LUGARES.map((l, i) => {
      const k = suave(t, T.colores + i * 0.35, T.colores + i * 0.35 + 0.5);
      if (k <= 0) return null;
      return (
        <group key={i} position={[0, (1 - k) * 0.6, 0]}>
          <Frutitos lugares={[{ ...l, p: l.p.clone().add(P(0, 0.22, 0)) }]} crecer={k} madurar={[0.25, 0.45, 0.62, 0.8, 1][i]} radio={0.2} pelos={200} />
        </group>
      );
    })}
  </group>
);


// año que corre hacia atrás: de hoy a 1960, y luego de 1960 a los noventa
const Anio: React.FC<{ t: number; u: number; tipo: string }> = ({ t, u, tipo }) => {
  let v: number | null = null;
  let o = 0;
  if (t < T.patio) {
    v = Math.round(2026 - (2026 - 1960) * suave(t, 0.1, 1.2));
    o = 1 - avance(t, T.patio - 0.5, 0.4);
  } else if (t > T.noventa - 0.3 && t < T.hoy) {
    v = Math.round(1960 + 30 * suave(t, T.noventa, T.noventa + 1.2));
    o = avance(t, T.noventa - 0.3, 0.3) * (1 - avance(t, T.hoy - 0.4, 0.4));
  }
  if (v === null) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: tipo === 'horizontal' ? '34%' : '40%', textAlign: 'center', opacity: o, fontFamily: TITULO, fontSize: (tipo === 'horizontal' ? 300 : 330) * u, color: '#fff3d6', letterSpacing: 10 * u, textShadow: `0 0 ${60 * u}px rgba(255,200,120,.6)` }}>
      {v}
    </div>
  );
};

// escenas nuevas: lluvia del paso de los años y la cosecha de hoy
const LLUEVE = [T.semillas + 0.2, T.noventa - 0.2] as const;
const COSECHA = 28.0;
const REJA = P(1.7, 0, 1.3);
const CORTES = [28.5, 29.4, 30.3, 31.3];

export const PrimerRambutan: React.FC<{ limpio?: boolean; reloj?: (s: number) => number }> = ({ limpio, reloj }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = reloj ? reloj(frame / fps) : frame / fps;
  const { w, h, u, tipo, fov } = useFormato();
  relojViento.value = t;

  // de sepia (1960) a color (hoy)
  const sepia = 0.85 * (1 - suave(t, T.primer, T.colores + 0.5));
  const lluvia = suave(t, LLUEVE[0], LLUEVE[0] + 1.2) * (1 - suave(t, LLUEVE[1] - 0.6, LLUEVE[1] + 0.6));
  const tarde = suave(t, COSECHA, 40) * 0.45;
  const base = t < COSECHA ? cieloEntre('amanecer', 'dia', suave(t, 2, T.hoy)) : cieloEntre('dia', 'atardecer', tarde);
  const cielo = nublar(base, lluvia * 0.85);
  const crece = suave(t, T.sembro + 1.2, T.caso); // del brote al árbol
  const brote = suave(t, T.sembro + 0.6, T.primer);
  const lejos = tipo === 'vertical' ? 1.35 : tipo === 'cuadrado' ? 1.15 : 1.3;
  const cosecha = t >= COSECHA;
  // relámpago a media lluvia
  const rayo = Math.max(0, 1 - Math.abs(t - 21.6) / 0.08) * 0.7 + Math.max(0, 1 - Math.abs(t - 21.85) / 0.06) * 0.4;

  // cámara por escenas (con un vaivén leve de cámara en mano)
  let pos: THREE.Vector3;
  let mira: THREE.Vector3;
  if (t < T.sembro) {
    const k = suave(t, 0, T.sembro);
    pos = P(-4 + k * 3, 3.2 - k * 1.4, (14 - k * 6) * lejos);
    mira = P(0, 1.2 - k * 0.6, -2 + k * 2);
  } else if (t < T.caso) {
    const k = suave(t, T.sembro, T.caso);
    pos = P(1.2 + k * 2, 0.6 + k * 3.2, (2.6 + k * 8) * lejos);
    mira = P(0, 0.2 + k * 3, 0);
  } else if (t < T.semillas) {
    const k = suave(t, T.caso, T.semillas);
    pos = P(-0.6 + k * 1.2, 1.9, (4.4 - k * 0.6) * lejos);
    mira = P(0, 1.3, 1.2);
  } else if (!cosecha) {
    // vista aérea: llueve, pasan los años y las huertas nacen en espiral; luego sale el sol
    const k = suave(t, T.semillas, COSECHA);
    pos = P(6 + k * 10, 14 + k * 24, (18 + k * 20) * lejos);
    mira = P(0, 0, 0);
  } else {
    // a ras de suelo junto a la reja: caen los racimos; atrás se carga el tráiler
    const k = suave(t, COSECHA, 43);
    pos = P(4.4 - k * 1.0, 1.75 + k * 0.4, (5.6 - k * 0.5) * lejos);
    mira = P(0.9, 1.15 + k * 0.3, -0.6);
  }
  pos.add(P(Math.sin(t * 0.9) * 0.04, Math.sin(t * 1.3) * 0.03, 0));

  const cuantos = (N_HUERTA + 20) * suave(t, T.semillas + 0.4, T.hoy + 1.5);
  const fruta = suave(t, T.hoy, T.hoy + 1.5);
  const pajaros = [0, 1, 2].map((i) => {
    const k = (t - 24.6 - i * 0.4) / 4;
    return { ok: k > 0 && k < 1, p: P(-12 + k * 24, 9 + i * 0.6, -4 - i * 2), fase: i };
  });
  const pajarosCosecha = [0, 1].map((i) => {
    const k = (t - 33 - i * 0.6) / 5;
    return { ok: k > 0 && k < 1, p: P(-8 + k * 18, 5.5 + i * 0.5, -6 - i), fase: i * 1.3 };
  });
  const aereo = t >= T.semillas - 0.2 && !cosecha;
  const enMonton = CORTES.filter((c) => t > c + 0.62).length;
  const monton = enMonton / 4 + (enMonton > 0 ? 0 : 0) + suave(t, CORTES[3] + 0.7, 40) * 0.25;
  const cajas = Math.min(48, 30 + Math.floor((t - COSECHA) * 1.4));
  // sol: dónde cae en pantalla para el destello
  const solPant: [number, number] = cosecha ? [0.86, 0.22] : [0.7, 0.3];
  const destello = (cosecha ? 0.75 : suave(t, LLUEVE[1] - 0.3, LLUEVE[1] + 1) * 0.7) * (1 - sepia);

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill style={{ filter: `sepia(${sepia}) contrast(${1 + sepia * 0.12}) brightness(${1 - sepia * 0.08})` }}>
        <FondoCielo c={cielo} t={t} w={w} h={h} sol={solPant} bokeh={0} horizonte={0.7} />
        <ThreeCanvas width={w} height={h} style={{ position: 'absolute', inset: 0 }} gl={{ alpha: true, antialias: true }} shadows="soft">
          <Estudio />
          <CamaraSerie pos={pos} mira={mira} fov={fov} w={w} h={h} tipo={tipo} />
          <hemisphereLight args={[cielo.amb, '#3a4a20', 0.75 + lluvia * 0.4]} />
          <LuzSol position={cosecha ? [10, 9, -6] : [9, 12, 7]} mira={aereo ? [0, 0, 0] : cosecha ? [-0.5, 0, -2.5] : [0, 0, -1]} color={cielo.luz} intensity={(3.2 - lluvia * 2.4) * (cosecha ? 1.05 : 1)} caja={aereo ? 62 : cosecha ? 11 : 10} mapa={aereo ? 4096 : 2048} />
          <directionalLight position={[-6, 4, -6]} intensity={0.6} color="#ffe0b0" />
          <fog attach="fog" args={[cielo.abajo, aereo ? 50 + (1 - lluvia) * 20 : 30, aereo ? 190 - lluvia * 70 : 120]} />
          <Sombras />
          <SueloReal radio={170} rep={60} oscuro={lluvia * 0.35} />
          {!aereo && <Pasto n={70000} radio={14} alto={0.15} ancho={0.65} hueco={cosecha ? 3.0 : 0.6} viento={0.22 + lluvia * 0.2} />}
          {cosecha && <ManchaTierra radio={3.8} />}
          <Nubes t={t} n={10} altura={55} dist={150} arriba={lluvia > 0.3 ? '#a8b0bc' : '#ffffff'} abajo={lluvia > 0.3 ? '#4b5462' : '#b4bccb'} opacidad={0.9} vel={1.4} />
          {t < T.semillas + 1 && <Casa />}
          {t < T.semillas + 1 && <Cerca />}
          {/* montoncito de tierra donde se siembra */}
          {t < T.caso + 0.5 && (
            <mesh position={[0, 0.02, 0]} scale={[0.5, 0.08, 0.5]}>
              <sphereGeometry args={[1, 20, 10]} />
              <meshStandardMaterial color="#5a3d26" roughness={1} />
            </mesh>
          )}
          {/* la semilla cae */}
          {t > T.sembro - 0.3 && t < T.sembro + 1 && (
            <mesh position={[0, Math.max(0.06, 1.6 - (t - T.sembro + 0.3) * 3), 0]} scale={[0.05, 0.07, 0.04]}>
              <sphereGeometry args={[1, 12, 10]} />
              <meshStandardMaterial color="#a8794f" roughness={0.9} />
            </mesh>
          )}
          {crece < 0.15 && <Brote k={brote} />}
          {crece >= 0.15 && t < T.caso + 0.2 && <Arbol position={[0, 0, 0]} racimos={6} escala={0.15 + crece * 0.85} />}
          {t >= T.caso && t < T.semillas && <Mesa t={t} />}
          {t >= T.semillas - 0.2 && <Huertas cuantos={cuantos} fruta={fruta} />}
          {t >= T.semillas && <Arbol position={[0, 0, 0]} racimos={14} />}
          {lluvia > 0.01 && <Lluvia t={t} fuerza={lluvia} centro={P(pos.x * 0.6, 0, pos.z * 0.6)} radio={26} alto={30} n={6000} />}
          {cosecha && (
            <group>
              <Reja position={REJA.toArray() as [number, number, number]} rotation={[0, 0.35, 0]} />
              <group position={REJA.toArray() as [number, number, number]} rotation={[0, 0.35, 0]}>
                <Monton k={monton} position={[0, 0.015, 0]} />
              </group>
              <Reja position={[REJA.x - 0.9, 0, REJA.z + 0.2]} rotation={[0, -0.2, 0]} color="#c41f2a" />
              <group position={[REJA.x - 0.9, 0, REJA.z + 0.2]} rotation={[0, -0.2, 0]}>
                <Monton k={1} position={[0, 0.015, 0]} />
              </group>
              <Reja position={[REJA.x - 0.45, 0, REJA.z - 0.55]} rotation={[0, 0.1, 0]} color="#2a8a3e" />
              <Reja position={[REJA.x - 0.45, 0.34, REJA.z - 0.55]} rotation={[0, 0.16, 0]} color="#2a8a3e" />
              {CORTES.map((c, i) => (
                <RacimoQueCae key={i} t={t} t0={c} de={P(REJA.x - 0.1 + (i % 2) * 0.25, 3.2 + (i % 3) * 0.15, REJA.z - 0.15 + (i % 2) * 0.1)} a={P(REJA.x, 0.55, REJA.z)} semilla={20 + i} />
              ))}
              <HojasCayendo t={t} desde={CORTES[0] - 0.1} centro={P(REJA.x, 3.2, REJA.z)} n={8} />
              <CamionReal position={[-1.2, 0, -8]} cajas={cajas} luces={false} />
              {pajarosCosecha.map((b, i) => b.ok && <Pajaro key={i} position={b.p} rumbo={P(1, 0, 0.15)} t={t} escala={0.4} fase={b.fase} />)}
            </group>
          )}
          <Chispas centro={P(0, 2.2, 0)} radio={2.4} t={t} color="#ffe6a0" fuerza={suave(t, T.primer - 0.5, T.primer + 0.5) * (1 - suave(t, T.caso - 0.4, T.caso))} tam={0.03} />
          {cosecha && <Chispas centro={P(REJA.x, 1.6, REJA.z)} radio={2.2} t={t} color="#fff0c0" fuerza={0.6} tam={0.012} />}
          {pajaros.map((b, i) => b.ok && <Pajaro key={i} position={b.p} rumbo={P(1, 0, 0.1)} t={t} escala={0.5} fase={b.fase} />)}
        </ThreeCanvas>
        <Destello x={w * solPant[0]} y={h * solPant[1]} w={w} h={h} fuerza={destello} color={cielo.sol} />
        {/* grano de película vieja mientras dura el sepia */}
        {sepia > 0.05 && (
          <AbsoluteFill
            style={{
              opacity: sepia * 0.5,
              background: `repeating-linear-gradient(${(frame * 37) % 180}deg, rgba(255,255,255,.035) 0px, rgba(0,0,0,.05) 2px, transparent 3px), radial-gradient(ellipse at center, transparent 55%, rgba(30,15,0,.65) 100%)`,
            }}
          />
        )}
        {/* viñeta suave y relámpago */}
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,.35) 100%)' }} />
        {rayo > 0 && <AbsoluteFill style={{ background: '#e8eeff', opacity: rayo, mixBlendMode: 'screen' }} />}
      </AbsoluteFill>

      {!limpio && (
        <>
      <Anio t={t} u={u} tipo={tipo} />
      <Rotulo t={t} desde={T.patio + 0.1} hasta={T.primer - 0.1} titulo={<>CAMPO EXPERIMENTAL<br /><span style={{ color: '#ffd84d' }}>ROSARIO IZAPA</span></>} sub="Tuxtla Chico, Chiapas. Alguien sembró un árbol que nadie conocía." />
      <Rotulo t={t} desde={T.primer} hasta={T.caso - 0.1} titulo={<>EL PRIMER<br /><span style={{ color: '#ff4a5a' }}>RAMBUTÁN</span> DE MÉXICO</>} />
      <Rotulo t={t} desde={T.caso} hasta={T.semillas - 0.1} titulo={<>NADIE LE<br />HACÍA CASO</>} sub="Cada fruta salía de un color y un sabor distinto." />
      <Rotulo t={t} desde={T.semillas} hasta={T.noventa - 0.2} titulo={<>DE SUS SEMILLAS<br />NACIERON LAS HUERTAS</>} sub="Las primeras del Soconusco." />
      <Rotulo t={t} desde={T.hoy} hasta={T.viva - 0.1} titulo={<>HOY CHIAPAS ES<br />EL <span style={{ color: '#ffd84d' }}>MAYOR PRODUCTOR</span></>} sub="De rambután en todo el país." />
      <Rotulo t={t} desde={T.viva} hasta={T.cierre - 0.05} titulo={<>ESA HISTORIA<br />SIGUE <span style={{ color: '#b8f02e' }}>VIVA</span></>} sub="En nuestra huerta." />

      <CierreSerie t={t} desde={T.cierre} fondo="radial-gradient(circle at 50% 40%, #3a2a14, #120c04 75%)" />
      <Audio src={staticFile('serie/voz4.mp3')} />
        </>
      )}
    </AbsoluteFill>
  );
};
