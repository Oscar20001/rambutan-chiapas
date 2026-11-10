import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { Estudio } from './RambutanAbre';
import { CamaraSerie, FondoCielo, cieloEntre, rnd } from './Naturaleza';
import { Nubes, Pasto } from './Realismo';
import { Arbol } from './Racimo';
import { volcanReal, rocaGeo, volcanTex, selvaTex } from './TierraVolcan';
import { TITULO } from './comun';
import { useFormato } from './marca';

// Biblioteca de modelos realistas para la serie (2026-11-06), hechos a partir de las fotos que mandó Alex:
// Izapa (plataformas escalonadas de piedra bola con pasto y estelas), murciélago frutero (Artibeus, el
// común en el Soconusco: café, hoja nasal, alas de membrana con dedos), pájaro (luis bienteveo, ave común
// de Chiapas: pecho amarillo, cabeza rayada) y agua (estero con olas).

const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

const lienzo = (w: number, h: number, pinta: (g: CanvasRenderingContext2D) => void, rep: [number, number] = [1, 1]) => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  pinta(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep[0], rep[1]);
  t.anisotropy = 8;
  return t;
};

// ---------- piedra bola (cantos rodados de río, como en los muros de Izapa) ----------
const piedraBola = (oscura = 0) =>
  lienzo(1024, 1024, (g) => {
    g.fillStyle = '#3a3428';
    g.fillRect(0, 0, 1024, 1024);
    let i = 0;
    for (let y = -20; y < 1060; y += 46) {
      for (let x = -20 + ((y / 46) % 2) * 24; x < 1060; x += 52) {
        i++;
        const rx = 22 + rnd(i) * 10;
        const ry = 17 + rnd(i * 2) * 8;
        const cx = x + (rnd(i * 3) - 0.5) * 12;
        const cy = y + (rnd(i * 4) - 0.5) * 10;
        const l = 38 + rnd(i * 5) * 22 - oscura * 12;
        const gr = g.createRadialGradient(cx - rx * 0.35, cy - ry * 0.4, 2, cx, cy, Math.max(rx, ry));
        gr.addColorStop(0, `hsl(${35 + rnd(i * 6) * 15}, ${10 + rnd(i * 7) * 12}%, ${l + 14}%)`);
        gr.addColorStop(0.7, `hsl(${30 + rnd(i * 6) * 15}, ${10 + rnd(i * 7) * 10}%, ${l}%)`);
        gr.addColorStop(1, `hsl(30, 10%, ${l - 18}%)`);
        g.fillStyle = gr;
        g.beginPath();
        g.ellipse(cx, cy, rx, ry, (rnd(i * 8) - 0.5) * 0.6, 0, Math.PI * 2);
        g.fill();
        // musgo entre piedras
        if (rnd(i * 9) > 0.7) {
          g.fillStyle = `rgba(70,95,40,${0.25 + rnd(i * 10) * 0.3})`;
          g.beginPath();
          g.ellipse(cx + rx * 0.6, cy + ry * 0.7, rx * 0.6, ry * 0.3, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
  });
const pastoTex = lienzo(512, 512, (g) => {
  g.fillStyle = '#4f7a2c';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const x = rnd(i * 1.3) * 512;
    const y = rnd(i * 2.1) * 512;
    g.strokeStyle = `hsl(${78 + rnd(i * 3) * 30}, ${40 + rnd(i * 4) * 25}%, ${22 + rnd(i * 5) * 22}%)`;
    g.lineWidth = 1 + rnd(i) * 1.5;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (rnd(i * 6) - 0.5) * 6, y - 4 - rnd(i * 7) * 8);
    g.stroke();
  }
});
// estela tallada: losa con relieve de figura y glifos (inspirada en el estilo izapeño, no copia de una estela en particular)
const estelaTex = lienzo(512, 1024, (g) => {
  g.fillStyle = '#7a7466';
  g.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 3000; i++) {
    g.fillStyle = `rgba(${rnd(i) > 0.5 ? '255,255,255' : '0,0,0'},${0.04 + rnd(i * 2) * 0.06})`;
    g.fillRect(rnd(i * 3) * 512, rnd(i * 4) * 1024, 3 + rnd(i * 5) * 8, 3 + rnd(i * 6) * 8);
  }
  // relieve: trazo claro con sombra a un lado, como piedra tallada y gastada
  g.strokeStyle = '#9a927e';
  g.shadowColor = 'rgba(25,22,16,.85)';
  g.shadowOffsetX = 5;
  g.shadowOffsetY = 6;
  g.shadowBlur = 4;
  g.lineWidth = 16;
  g.lineCap = 'round';
  // banda del cielo arriba
  g.beginPath();
  g.moveTo(40, 150);
  g.bezierCurveTo(150, 90, 360, 90, 472, 150);
  g.stroke();
  g.beginPath();
  g.arc(256, 110, 30, 0, Math.PI * 2);
  g.stroke();
  // personaje de perfil con tocado
  g.beginPath();
  g.ellipse(230, 380, 60, 70, 0, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.moveTo(180, 320);
  g.quadraticCurveTo(250, 220, 340, 260);
  g.quadraticCurveTo(300, 300, 290, 330);
  g.stroke();
  g.beginPath();
  g.moveTo(230, 450);
  g.lineTo(220, 640);
  g.lineTo(150, 800);
  g.moveTo(220, 640);
  g.lineTo(300, 800);
  g.moveTo(225, 520);
  g.lineTo(330, 470);
  g.lineTo(380, 520);
  g.stroke();
  // árbol de la vida a la derecha
  g.beginPath();
  g.moveTo(400, 860);
  g.lineTo(400, 560);
  for (let k = 0; k < 4; k++) {
    g.moveTo(400, 600 + k * 60);
    g.quadraticCurveTo(440, 580 + k * 60, 460, 560 + k * 60);
  }
  g.stroke();
  // banda de tierra abajo
  g.strokeRect(40, 880, 432, 90);
  for (let k = 0; k < 6; k++) {
    g.beginPath();
    g.arc(80 + k * 70, 925, 18, 0, Math.PI * 2);
    g.stroke();
  }
});
const piedraMat = (rep: [number, number], oscura = 0) => {
  const t = piedraBola(oscura);
  if (t) t.repeat.set(rep[0], rep[1]);
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, bumpMap: t ?? undefined, bumpScale: 0.6 });
};

// plataforma escalonada: cuerpos de piedra bola con taludes y pasto encima, escalinata al frente
export const Plataforma: React.FC<{ ancho: number; fondo: number; alto: number; cuerpos: number; position?: [number, number, number]; giro?: number }> = ({ ancho, fondo, alto, cuerpos, position = [0, 0, 0], giro = 0 }) => {
  const piezas = useMemo(() => {
    const l: { w: number; d: number; y: number; h: number }[] = [];
    const h = alto / cuerpos;
    for (let i = 0; i < cuerpos; i++) l.push({ w: ancho * (1 - i * 0.18), d: fondo * (1 - i * 0.18), y: i * h, h });
    return l;
  }, [ancho, fondo, alto, cuerpos]);
  const mats = useMemo(() => {
    const lado = piedraMat([ancho / 3.2, alto / cuerpos / 3.2]);
    const top = new THREE.MeshStandardMaterial({ map: pastoTex, roughness: 0.95, color: '#c8d8a0' });
    return [lado, lado, top, lado, lado, lado];
  }, [ancho, alto, cuerpos]);
  const esc = useMemo(() => piedraMat([0.6, 0.2], 0.5), []);
  const nEsc = cuerpos * 5;
  return (
    <group position={position} rotation={[0, giro, 0]}>
      {piezas.map((p, i) => (
        <mesh key={i} position={[0, p.y + p.h / 2, 0]} material={mats} castShadow receiveShadow>
          {/* talud: tronco de pirámide de 4 lados */}
          <cylinderGeometry args={[(p.w * 0.94) / Math.SQRT2, p.w / Math.SQRT2, p.h, 4, 1, false, Math.PI / 4]} />
        </mesh>
      ))}
      {/* escalinata central */}
      {Array.from({ length: nEsc }, (_, i) => {
        const h = alto / nEsc;
        const z = ancho / 2 - (i / nEsc) * ancho * 0.36 + 0.02;
        return (
          <mesh key={i} position={[0, h * (i + 0.5), z - 0.1]} material={esc} castShadow receiveShadow>
            <boxGeometry args={[ancho * 0.22, h, 0.22]} />
          </mesh>
        );
      })}
    </group>
  );
};

export const Estela: React.FC<{ position: [number, number, number]; giro?: number; alto?: number }> = ({ position, giro = 0, alto = 1.6 }) => (
  <group position={position} rotation={[0, giro, 0]}>
    <mesh position={[0, alto / 2, 0]} castShadow>
      <boxGeometry args={[alto * 0.5, alto, alto * 0.14]} />
      <meshStandardMaterial attach="material-4" map={estelaTex} bumpMap={estelaTex ?? undefined} bumpScale={3} roughness={0.9} />
      <meshStandardMaterial attach="material-0" color="#6e685a" roughness={0.95} />
      <meshStandardMaterial attach="material-1" color="#6e685a" roughness={0.95} />
      <meshStandardMaterial attach="material-2" color="#6e685a" roughness={0.95} />
      <meshStandardMaterial attach="material-3" color="#6e685a" roughness={0.95} />
      <meshStandardMaterial attach="material-5" color="#6e685a" roughness={0.95} />
    </mesh>
    {/* altar redondo delante */}
    <mesh position={[0, 0.12, alto * 0.45]} castShadow>
      <cylinderGeometry args={[alto * 0.3, alto * 0.32, 0.24, 28]} />
      <meshStandardMaterial color="#7a7466" roughness={0.95} bumpMap={estelaTex ?? undefined} bumpScale={1} />
    </mesh>
  </group>
);

export const Izapa3D: React.FC<{ t: number; volcan?: boolean }> = ({ t, volcan = true }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[60, 64]} />
      <meshStandardMaterial map={(() => { const x = pastoTex?.clone(); if (x) { x.repeat.set(40, 40); x.needsUpdate = true; } return x ?? null; })()} color="#8a9a68" roughness={0.95} />
    </mesh>
    <Pasto n={30000} radio={16} alto={0.3} ancho={1} centro={[0, 0, 0]} hueco={0} />
    <Plataforma ancho={7} fondo={7} alto={2.4} cuerpos={3} position={[0, 0, -4]} />
    <Plataforma ancho={4} fondo={9} alto={1.0} cuerpos={2} position={[-8, 0, 1]} giro={Math.PI / 2} />
    <Plataforma ancho={4} fondo={9} alto={1.0} cuerpos={2} position={[8, 0, 1]} giro={-Math.PI / 2} />
    <Estela position={[-1.6, 0, 2.5]} />
    <Estela position={[1.6, 0, 2.5]} alto={1.3} />
    <Estela position={[0, 0, 3.4]} alto={1.8} />
    {/* árboles de sombra alrededor, como en las fotos */}
    {[
      [-11, -8, 1.1],
      [11, -9, 1.2],
      [-13, 6, 0.9],
      [14, 5, 1],
    ].map(([x, z, s], i) => (
      <group key={i} position={[x, 0, z]} scale={s}>
        <mesh position={[0, 1.8, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.3, 3.6, 8]} />
          <meshStandardMaterial color="#5a4632" roughness={0.9} />
        </mesh>
        {Array.from({ length: 7 }, (_, j) => (
          <mesh key={j} position={[Math.cos(j * 2.4) * 1.3, 4.2 + Math.sin(j * 1.7) * 0.6, Math.sin(j * 2.4) * 1.3]} castShadow>
            <icosahedronGeometry args={[1.4 + rnd(i * 9 + j) * 0.6, 1]} />
            <meshStandardMaterial color={`hsl(${95 + rnd(j) * 20}, 35%, ${22 + rnd(j * 2) * 10}%)`} roughness={0.9} flatShading />
          </mesh>
        ))}
      </group>
    ))}
    {volcan && (
      <group position={[18, -0.05, -70]} scale={[4, 4, 4]}>
        <mesh geometry={volcanReal}>
          <meshStandardMaterial vertexColors map={volcanTex} roughness={0.95} />
        </mesh>
        <mesh geometry={rocaGeo} position={[0, 0.002, 0]}>
          <meshStandardMaterial vertexColors transparent roughness={0.9} polygonOffset polygonOffsetFactor={-2} depthWrite={false} />
        </mesh>
      </group>
    )}
    <Nubes t={t} n={7} altura={22} dist={80} ancho={160} opacidad={0.7} tam={0.7} />
  </group>
);

// ---------- murciélago frutero (Artibeus) ----------
const pielMurci = new THREE.MeshStandardMaterial({ color: '#5a4030', roughness: 0.95 });
const pechoMurci = new THREE.MeshStandardMaterial({ color: '#7a5a42', roughness: 0.95 });
const membrana = new THREE.MeshStandardMaterial({ color: '#3a2a22', roughness: 0.7, side: THREE.DoubleSide, transparent: true, opacity: 0.93 });
const huesoMat = new THREE.MeshStandardMaterial({ color: '#2a1e18', roughness: 0.8 });
const ojoMat = new THREE.MeshPhysicalMaterial({ color: '#0a0806', roughness: 0.1, clearcoat: 1 });
const rayaMat = new THREE.MeshStandardMaterial({ color: '#e8dcc8', roughness: 0.9 });
const furGeo = (() => {
  const g = new THREE.SphereGeometry(1, 28, 20);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = P(p.getX(i), p.getY(i), p.getZ(i));
    v.multiplyScalar(1 + (rnd(i * 1.7) - 0.5) * 0.06);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
})();
// ala: hombro → codo → muñeca → 3 dedos largos; la membrana se tensa entre ellos con borde festoneado
const alaMurci = (plegar: number) => {
  const muneca = P(0.16 - plegar * 0.06, 0.02, -0.02);
  const codo = P(0.08, 0.0, 0.03);
  const dedos = [
    P(0.42 - plegar * 0.22, 0.05, -0.08 + plegar * 0.04),
    P(0.36 - plegar * 0.2, 0.0, 0.1 + plegar * 0.02),
    P(0.22 - plegar * 0.12, -0.02, 0.2),
  ];
  const pie = P(0.03, -0.02, 0.17);
  const borde = [P(0, 0, -0.03), muneca, dedos[0], dedos[1], dedos[2], pie, P(0, 0, 0.12)];
  // membrana: triángulos desde la muñeca, con festón entre dedos
  const pts: number[] = [];
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => pts.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  tri(P(0, 0, -0.03), codo, muneca);
  tri(P(0, 0, -0.03), muneca, dedos[0]);
  for (let i = 0; i < 2; i++) {
    const a = dedos[i];
    const b = dedos[i + 1];
    const m = a.clone().lerp(b, 0.5).lerp(muneca, 0.22);
    tri(muneca, a, m);
    tri(muneca, m, b);
  }
  const m2 = dedos[2].clone().lerp(pie, 0.5).lerp(muneca, 0.15);
  tri(muneca, dedos[2], m2);
  tri(muneca, m2, pie);
  tri(codo, muneca, pie);
  tri(P(0, 0, 0.12), codo, pie);
  tri(P(0, 0, -0.03), codo, P(0, 0, 0.12));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.computeVertexNormals();
  return { g, huesos: [[P(0, 0, 0), codo], [codo, muneca], ...dedos.map((d) => [muneca, d])] as [THREE.Vector3, THREE.Vector3][], borde };
};
const Hueso: React.FC<{ a: THREE.Vector3; b: THREE.Vector3; r: number }> = ({ a, b, r }) => {
  const d = b.clone().sub(a);
  const q = new THREE.Quaternion().setFromUnitVectors(P(0, 1, 0), d.clone().normalize());
  return (
    <mesh position={a.clone().lerp(b, 0.5)} quaternion={q} material={huesoMat}>
      <cylinderGeometry args={[r * 0.7, r, d.length(), 6]} />
    </mesh>
  );
};
export const MurcielagoFrutero: React.FC<{ t: number; position?: THREE.Vector3; rumbo?: THREE.Vector3; fase?: number; escala?: number; colgado?: boolean }> = ({
  t,
  position = P(0, 0, 0),
  rumbo = P(0, 0, 1),
  fase = 0,
  escala = 1,
  colgado = false,
}) => {
  const ciclo = t * 9 + fase;
  const flap = colgado ? 0 : Math.sin(ciclo) * 0.85;
  const plegar = colgado ? 1 : Math.max(0, -Math.sin(ciclo)) * 0.55; // pliega en el golpe hacia arriba
  const ala = alaMurci(plegar);
  const yaw = Math.atan2(rumbo.x, rumbo.z);
  return (
    <group position={position} rotation={colgado ? [Math.PI, 0, 0] : [0, yaw, 0]} scale={escala}>
      {/* cuerpo y cabeza (la cabeza mira hacia +z) */}
      <mesh geometry={furGeo} material={pielMurci} scale={[0.05, 0.045, 0.085]} />
      <mesh geometry={furGeo} material={pechoMurci} position={[0, -0.012, 0.01]} scale={[0.042, 0.035, 0.07]} />
      <group position={[0, 0.012, 0.09]}>
        <mesh geometry={furGeo} material={pielMurci} scale={[0.036, 0.032, 0.04]} />
        {/* hocico corto y hoja nasal */}
        <mesh geometry={furGeo} material={pechoMurci} position={[0, -0.006, 0.032]} scale={[0.02, 0.016, 0.018]} />
        <mesh position={[0, 0.012, 0.046]} rotation={[-0.3, 0, 0]} material={pielMurci}>
          <coneGeometry args={[0.008, 0.022, 3]} />
        </mesh>
        {/* rayas blancas de la cara (típicas de Artibeus) */}
        {[-1, 1].map((l) => (
          <mesh key={l} position={[l * 0.016, 0.012, 0.028]} rotation={[0, l * 0.5, l * 0.6]} material={rayaMat} scale={[0.003, 0.016, 0.002]}>
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
        ))}
        {[-1, 1].map((l) => (
          <group key={l}>
            <mesh position={[l * 0.016, 0.006, 0.03]} material={ojoMat}>
              <sphereGeometry args={[0.007, 12, 10]} />
            </mesh>
            {/* orejas redondeadas */}
            <mesh position={[l * 0.024, 0.032, 0.0]} rotation={[0.2, l * 0.4, l * -0.35]} material={pielMurci} scale={[1, 1.3, 0.35]}>
              <sphereGeometry args={[0.015, 12, 10]} />
            </mesh>
          </group>
        ))}
      </group>
      {/* alas */}
      {[-1, 1].map((l) => (
        <group key={l} scale={[l, 1, 1]} position={[0.03 * l, 0.01, 0]}>
          <group rotation={[0, 0, flap]}>
            <mesh geometry={ala.g} material={membrana} castShadow />
            {ala.huesos.map(([a, b], i) => (
              <Hueso key={i} a={a} b={b} r={i < 2 ? 0.006 : 0.003} />
            ))}
            {/* pulgar con garrita */}
            <mesh position={ala.huesos[1][1].clone().add(P(0, 0.008, -0.012))} material={huesoMat}>
              <coneGeometry args={[0.004, 0.018, 5]} />
            </mesh>
          </group>
        </group>
      ))}
      {/* patitas */}
      {[-1, 1].map((l) => (
        <mesh key={l} position={[l * 0.02, -0.01, -0.08]} rotation={[1.2, 0, 0]} material={huesoMat}>
          <cylinderGeometry args={[0.003, 0.004, 0.04, 5]} />
        </mesh>
      ))}
    </group>
  );
};

// ---------- pájaro: luis bienteveo ----------
const negro = new THREE.MeshStandardMaterial({ color: '#141210', roughness: 0.55 });
const blanco = new THREE.MeshStandardMaterial({ color: '#f4f0e6', roughness: 0.8 });
// cuerpo en forma de huevo, una sola pieza: lomo café arriba, pecho amarillo abajo, garganta blanca al frente
const cuerpoAve = (() => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 30; i++) {
    const u = i / 30;
    const r = 0.1 * Math.pow(Math.sin(Math.PI * u), 0.62) * (1 - 0.38 * u);
    pts.push(new THREE.Vector2(Math.max(0.001, r), (0.5 - u) * 0.4));
  }
  const g = new THREE.LatheGeometry(pts, 36);
  g.rotateX(Math.PI / 2); // eje del lathe → z (adelante = +z)
  const p = g.attributes.position;
  const col: number[] = [];
  const cafe = new THREE.Color('#6a4a2a');
  const amar = new THREE.Color('#f2c81e');
  const blan = new THREE.Color('#f4f0e6');
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const z = p.getZ(i);
    const k = THREE.MathUtils.smoothstep(y, -0.01, 0.03); // 1 arriba
    const c = amar.clone().lerp(cafe, k);
    if (z > 0.13 && y > -0.03) c.lerp(blan, THREE.MathUtils.smoothstep(z, 0.13, 0.17) * (1 - k));
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
})();
const cuerpoAveMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
// textura de plumas: café con bordes canela y raquis marcados
const plumasTex = lienzo(256, 256, (g) => {
  g.fillStyle = '#5e4026';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 9; i++) {
    const x = i * 29;
    const gr = g.createLinearGradient(x, 0, x + 29, 0);
    gr.addColorStop(0, 'rgba(40,24,10,.55)');
    gr.addColorStop(0.55, 'rgba(120,80,40,.15)');
    gr.addColorStop(0.85, 'rgba(176,122,58,.75)');
    gr.addColorStop(1, 'rgba(40,24,10,.4)');
    g.fillStyle = gr;
    g.fillRect(x, 0, 29, 256);
  }
  // cobertoras más claras cerca del hombro
  const c = g.createLinearGradient(0, 0, 0, 256);
  c.addColorStop(0, 'rgba(120,84,46,.0)');
  c.addColorStop(0.75, 'rgba(120,84,46,.0)');
  c.addColorStop(1, 'rgba(140,100,56,.6)');
  g.fillStyle = c;
  g.fillRect(0, 0, 256, 256);
});
if (plumasTex) plumasTex.rotation = Math.PI / 2;
const plumaMat = new THREE.MeshStandardMaterial({ map: plumasTex, roughness: 0.85, side: THREE.DoubleSide });
// ala: silueta con puntas de plumas primarias; x = envergadura, y = cuerda (hacia atrás negativo)
const alaAveGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0.04);
  s.quadraticCurveTo(0.16, 0.06, 0.3, -0.02);
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = i / n;
    const b = (i + 1) / n;
    const x0 = 0.3 - a * 0.3;
    const x1 = 0.3 - b * 0.3;
    const y0 = -0.02 - Math.sin(a * Math.PI * 0.7) * 0.1;
    const y1 = -0.02 - Math.sin(b * Math.PI * 0.7) * 0.1;
    s.lineTo((x0 + x1) / 2 + 0.006, Math.min(y0, y1) - 0.028);
    s.lineTo(x1, y1);
  }
  s.lineTo(0, -0.06);
  s.lineTo(0, 0.04);
  const g = new THREE.ShapeGeometry(s, 8);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 0.32, (uv.getY(i) + 0.16) / 0.22);
  g.rotateX(-Math.PI / 2); // la cuerda queda hacia +z… la volteamos para que vaya hacia atrás
  g.rotateY(Math.PI);
  g.rotateY(-Math.PI);
  g.scale(1, 1, -1);
  return g;
})();
const colaGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(-0.025, 0);
  s.lineTo(-0.06, -0.17);
  s.quadraticCurveTo(0, -0.19, 0.06, -0.17);
  s.lineTo(0.025, 0);
  s.lineTo(-0.025, 0);
  const g = new THREE.ShapeGeometry(s, 6);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + 0.06) / 0.12, -uv.getY(i) / 0.19);
  g.rotateX(-Math.PI / 2);
  return g;
})();
export const PajaroReal: React.FC<{ t: number; position?: THREE.Vector3; rumbo?: THREE.Vector3; fase?: number; escala?: number; posado?: boolean }> = ({
  t,
  position = P(0, 0, 0),
  rumbo = P(0, 0, 1),
  fase = 0,
  escala = 1,
  posado = false,
}) => {
  const aleteo = Math.sin(t * 20 + fase);
  const yaw = Math.atan2(rumbo.x, rumbo.z);
  const cabeceo = posado ? Math.sin(t * 2 + fase) * 0.12 : 0;
  return (
    <group position={position} rotation={[posado ? -0.35 : 0, yaw, 0]} scale={escala}>
      <mesh geometry={cuerpoAve} material={cuerpoAveMat} castShadow />
      {/* cabeza: corona negra, ceja blanca ancha, antifaz negro, garganta blanca */}
      <group position={[0, 0.045, 0.165]} rotation={[cabeceo, posado ? Math.sin(t * 1.3 + fase) * 0.5 : 0, 0]}>
        <mesh material={blanco} scale={[1, 0.95, 1]}>
          <sphereGeometry args={[0.052, 24, 18]} />
        </mesh>
        <mesh material={negro} position={[0, 0.024, -0.004]} scale={[1.02, 0.55, 1.02]}>
          <sphereGeometry args={[0.052, 24, 12]} />
        </mesh>
        <mesh material={negro} position={[0, -0.004, 0.002]} scale={[1.04, 0.32, 0.98]}>
          <sphereGeometry args={[0.052, 24, 10]} />
        </mesh>
        {[-1, 1].map((l) => (
          <mesh key={l} position={[l * 0.04, 0.0, 0.024]} material={ojoMat}>
            <sphereGeometry args={[0.009, 12, 10]} />
          </mesh>
        ))}
        <mesh position={[0, -0.006, 0.075]} rotation={[Math.PI / 2, 0, 0]} material={negro} scale={[1, 1, 0.7]}>
          <coneGeometry args={[0.016, 0.07, 10]} />
        </mesh>
      </group>
      {/* alas: posado, dobladas sobre el lomo; volando, extendidas y aleteando */}
      {[-1, 1].map((l) => (
        <group key={l} position={[l * 0.06, 0.035, 0.07]} scale={[l, 1, 1]}>
          <group rotation={posado ? [0.1, 1.5, -0.3] : [0, -0.15, aleteo * 0.9]}>
            <mesh geometry={alaAveGeo} material={plumaMat} castShadow />
          </group>
        </group>
      ))}
      {/* cola */}
      <mesh geometry={colaGeo} material={plumaMat} position={[0, 0.02, -0.15]} rotation={[posado ? 0.5 : 0.08, 0, 0]} castShadow />
      {posado &&
        [-1, 1].map((l) => (
          <mesh key={l} position={[l * 0.025, -0.1, 0.03]} material={negro}>
            <cylinderGeometry args={[0.004, 0.004, 0.07, 5]} />
          </mesh>
        ))}
    </group>
  );
};

// ---------- agua: estero con olitas y reflejo ----------
export const Agua: React.FC<{ t: number; tam?: number; color?: string; position?: [number, number, number] }> = ({ t, tam = 40, color = '#2a6a7a', position = [0, 0, 0] }) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(tam, tam, 120, 120);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [tam]);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    p.setY(i, Math.sin(x * 0.9 + t * 1.6) * 0.04 + Math.sin(z * 1.3 - t * 1.2 + x * 0.3) * 0.035 + Math.sin((x + z) * 2.7 + t * 2.4) * 0.012);
  }
  p.needsUpdate = true;
  geo.computeVertexNormals();
  return (
    <mesh geometry={geo} position={position} receiveShadow>
      <meshPhysicalMaterial color={color} roughness={0.08} metalness={0.15} clearcoat={1} clearcoatRoughness={0.05} transparent opacity={0.92} envMapIntensity={1.2} />
    </mesh>
  );
};

// ---------- vitrina para revisar los modelos ----------
const ESCENAS = ['IZAPA', 'MURCIÉLAGO FRUTERO', 'LUIS BIENTEVEO', 'ÁRBOL DE RAMBUTÁN', 'ESTERO'];
export const DURA_VITRINA = 5;
export const Vitrina: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { w, h, u, tipo, fov } = useFormato();
  const e = Math.min(ESCENAS.length - 1, Math.floor(t / DURA_VITRINA));
  const l = t - e * DURA_VITRINA;
  const g = -0.6 + l * 0.25;
  let pos = P(0, 2, 6);
  let mira = P(0, 0, 0);
  if (e === 0) {
    pos = P(Math.sin(g) * 16, 5 + l * 0.2, Math.cos(g) * 16);
    mira = P(0, 1, -2);
  } else if (e === 1) {
    pos = P(Math.sin(g) * 2.3, 0.7, Math.cos(g) * 2.3);
    mira = P(0, 0, 0);
  } else if (e === 2) {
    pos = P(Math.sin(g + 0.8) * 1.7, 0.35, Math.cos(g + 0.8) * 1.7);
    mira = P(0, 0.05, 0);
  } else if (e === 3) {
    pos = P(Math.sin(g) * 13, 4, Math.cos(g) * 13);
    mira = P(0, 3.6, 0);
  } else {
    pos = P(Math.sin(g) * 8, 1.4, Math.cos(g) * 8);
    mira = P(0, 0, -6);
  }
  const cielo = cieloEntre('dia', 'atardecer', e === 4 ? 0.6 : 0.15);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {e === 1 || e === 2 ? <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 40%, #3a4a5a, #0a0d12 75%)' }} /> : <FondoCielo c={cielo} t={t} w={w} h={h} sol={[0.3, 0.5]} bokeh={0} />}
      <ThreeCanvas width={w} height={h} style={{ position: 'absolute', inset: 0 }} gl={{ alpha: true, antialias: true }} shadows="soft">
        <Estudio />
        <CamaraSerie pos={pos} mira={mira} fov={fov} w={w} h={h} tipo={tipo} />
        <hemisphereLight args={[cielo.amb, '#2c3a1e', 1.0]} />
        <directionalLight position={[-8, 12, 8]} intensity={2.8} color={cielo.luz} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[6, 3, -8]} intensity={1.6} color="#ffd8b0" />
        {e === 0 && <Izapa3D t={t} />}
        {e === 1 && <MurcielagoFrutero t={t} escala={2.2} rumbo={P(0, 0, 1)} />}
        {e === 2 && <PajaroReal t={t} escala={1.6} posado={l < 2.5} />}
        {e === 3 && (
          <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <circleGeometry args={[40, 48]} />
              <meshStandardMaterial map={selvaTex} color="#c8d8a8" roughness={0.95} />
            </mesh>
            <Arbol racimos={12} />
          </group>
        )}
        {e === 4 && (
          <group>
            <Agua t={t} />
            <Nubes t={t} n={6} altura={14} dist={40} ancho={90} opacidad={0.8} tam={0.5} />
          </group>
        )}
      </ThreeCanvas>
      <div style={{ position: 'absolute', top: h * 0.08, left: 0, right: 0, textAlign: 'center', fontFamily: TITULO, fontSize: 90 * u, color: '#fff6e2', textShadow: '0 4px 20px rgba(0,0,0,.8)' }}>{ESCENAS[e]}</div>
    </AbsoluteFill>
  );
};
