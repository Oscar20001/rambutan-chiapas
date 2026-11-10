import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { Estudio } from './RambutanAbre';
import { CamaraSerie, FondoCielo, cieloEntre, rnd } from './Naturaleza';
import { conViento, LuzSol, Nubes, Pasto, SueloReal, Viento } from './Realismo';
import { volcanReal, rocaGeo, volcanTex } from './TierraVolcan';
import { Plataforma, Estela, PajaroReal } from './Modelos';
import { Rotulo, useFormato } from './marca';

// Vida diaria en la antigua Izapa (Tuxtla Chico), para la serie "Historias del antiguo Soconusco".
// Biblioteca de modelos: casa de bajareque con techo de palma, milpa (maíz con frijol y calabaza),
// cacaotal bajo árboles de sombra, metate, fogón con humo, canastos y personas animadas
// (caminar, moler, sembrar con coa, cargar con mecapal, cosechar).
// Datos verificados de Izapa: plazas con plataformas de piedra bola, estelas, juego de pelota;
// apogeo entre 500 a. C. y 100 d. C., unos 10,000 habitantes (México Desconocido).

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

// ---------- texturas ----------
const palmaTex = lienzo(512, 512, (g) => {
  g.fillStyle = '#a88a52';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const x = rnd(i * 1.3) * 512;
    const y = rnd(i * 2.1) * 512;
    const l = 30 + rnd(i * 3.7) * 70;
    const c = 70 + rnd(i * 4.9) * 90;
    g.strokeStyle = `rgba(${c + 40},${c + 15},${c * 0.45},${0.35 + rnd(i * 5.3) * 0.5})`;
    g.lineWidth = 1 + rnd(i * 6.1) * 2;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (rnd(i * 7.7) - 0.5) * 8, y + l);
    g.stroke();
  }
  // hiladas de palma amarradas
  for (let y = 0; y < 512; y += 64) {
    g.fillStyle = 'rgba(40,28,12,.35)';
    g.fillRect(0, y, 512, 6);
  }
}, [3, 3]);

const barroTex = lienzo(512, 512, (g) => {
  g.fillStyle = '#b8936a';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) {
    const x = rnd(i * 1.7) * 512;
    const y = rnd(i * 2.9) * 512;
    const r = 4 + rnd(i * 3.3) * 22;
    const c = 120 + rnd(i * 4.1) * 70;
    g.fillStyle = `rgba(${c + 30},${c},${c * 0.6},0.25)`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  // varas del bajareque que se asoman
  for (let x = 6; x < 512; x += 22) {
    g.strokeStyle = 'rgba(70,48,26,.18)';
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(x + rnd(x) * 4, 0);
    g.lineTo(x + rnd(x + 1) * 4, 512);
    g.stroke();
  }
}, [2, 1]);

const hojaTex = lienzo(256, 256, (g) => {
  g.fillStyle = '#2f5a24';
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 420; i++) {
    const x = rnd(i * 1.1) * 256;
    const y = rnd(i * 2.3) * 256;
    const a = rnd(i * 3.1) * Math.PI * 2;
    const l = 14 + rnd(i * 4.4) * 18;
    g.save();
    g.translate(x, y);
    g.rotate(a);
    const v = 30 + rnd(i * 5.5) * 50;
    g.fillStyle = `rgb(${v * 0.6},${v + 40},${v * 0.4})`;
    g.beginPath();
    g.ellipse(0, 0, l, l * 0.35, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}, [2, 2]);

const tejidoTex = lienzo(128, 128, (g) => {
  g.fillStyle = '#8a6a3a';
  g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 8)
    for (let x = 0; x < 128; x += 8) {
      g.fillStyle = (x + y) % 16 === 0 ? '#b08a50' : '#6e5228';
      g.fillRect(x, y, 8, 4);
    }
}, [4, 2]);

// ---------- casa de bajareque con techo de palma sobre plataforma de tierra ----------
const paredMat = new THREE.MeshStandardMaterial({ map: barroTex, roughness: 0.95 });
const techoMat = new THREE.MeshStandardMaterial({ map: palmaTex, roughness: 1, bumpMap: palmaTex ?? undefined, bumpScale: 2 });
const tierraMat = new THREE.MeshStandardMaterial({ color: '#7a5e40', roughness: 1 });
const puertaMat = new THREE.MeshStandardMaterial({ color: '#1a120a', roughness: 1 });
export const Casa: React.FC<{ position: [number, number, number]; giro?: number; escala?: number }> = ({ position, giro = 0, escala = 1 }) => (
  <group position={position} rotation={[0, giro, 0]} scale={escala}>
    <mesh position={[0, 0.15, 0]} material={tierraMat} castShadow receiveShadow>
      <boxGeometry args={[5.2, 0.3, 4.2]} />
    </mesh>
    <mesh position={[0, 1.2, 0]} material={paredMat} castShadow receiveShadow>
      <boxGeometry args={[4.2, 1.8, 3.2]} />
    </mesh>
    <mesh position={[0, 1.0, 1.61]} material={puertaMat}>
      <planeGeometry args={[0.8, 1.4]} />
    </mesh>
    {/* techo de cuatro aguas, alto y con alero */}
    <mesh position={[0, 3.1, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.32, 1, 1.02]} material={techoMat} castShadow>
      <coneGeometry args={[3.6, 2.4, 4, 1, true]} />
    </mesh>
  </group>
);

// ---------- maíz: tallo, hojas arqueadas, espiga y elote ----------
const maizGeo = (() => {
  const partes: THREE.BufferGeometry[] = [];
  const pinta = (g: THREE.BufferGeometry, c: THREE.Color) => {
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  };
  const tallo = new THREE.CylinderGeometry(0.018, 0.03, 2.2, 6);
  tallo.translate(0, 1.1, 0);
  partes.push(pinta(tallo, new THREE.Color('#6f8f3a')).toNonIndexed());
  for (let k = 0; k < 9; k++) {
    const y0 = 0.35 + k * 0.2;
    const a = k * 2.4;
    const largo = 0.75 - k * 0.04;
    const pts: number[] = [];
    const seg = 7;
    for (let s = 0; s < seg; s++) {
      const f = (u: number, lado: number) => {
        const r = u * largo;
        const w = Math.sin(Math.PI * Math.min(1, u * 1.1)) * 0.045 * lado;
        const y = y0 + Math.sin(u * 1.6) * 0.32 - u * u * 0.45;
        return [Math.cos(a) * r - Math.sin(a) * w, y, Math.sin(a) * r + Math.cos(a) * w];
      };
      const u0 = s / seg;
      const u1 = (s + 1) / seg;
      const A = f(u0, -1), B = f(u0, 1), C = f(u1, -1), D = f(u1, 1);
      pts.push(...A, ...B, ...C, ...B, ...D, ...C);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.computeVertexNormals();
    partes.push(pinta(g, new THREE.Color().setHSL(0.24, 0.5, 0.3 + (k % 3) * 0.04)));
  }
  for (let k = 0; k < 6; k++) {
    const e = new THREE.CylinderGeometry(0.004, 0.007, 0.32, 3);
    e.translate(0, 0.16, 0);
    e.rotateZ(k === 0 ? 0 : 0.5);
    e.rotateY(k * 1.25);
    e.translate(0, 2.18, 0);
    partes.push(pinta(e, new THREE.Color('#c9a95a')).toNonIndexed());
  }
  const elote = new THREE.SphereGeometry(0.05, 8, 6);
  elote.scale(1, 3.2, 1);
  elote.rotateZ(0.35);
  elote.translate(0.06, 1.15, 0);
  partes.push(pinta(elote, new THREE.Color('#9aa858')).toNonIndexed());
  return mergeGeometries(partes.map((g) => { const x = g.index ? g.toNonIndexed() : g; x.deleteAttribute('uv'); return x; }))!;
})();

export const Milpa: React.FC<{ centro: [number, number]; ancho: number; fondo: number; seco?: number }> = ({ centro, ancho, fondo, seco = 0 }) => {
  const malla = useMemo(() => {
    const filas = Math.floor(fondo / 0.95);
    const cols = Math.floor(ancho / 0.8);
    const n = filas * cols;
    const mat = conViento(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }), 0.025, 'hoja', 1.4);
    const m = new THREE.InstancedMesh(maizGeo, mat, n);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    let i = 0;
    for (let f = 0; f < filas; f++)
      for (let c = 0; c < cols; c++) {
        const x = centro[0] - ancho / 2 + c * 0.8 + (rnd(i * 1.9) - 0.5) * 0.25;
        const z = centro[1] - fondo / 2 + f * 0.95 + (rnd(i * 2.7) - 0.5) * 0.2;
        q.setFromEuler(new THREE.Euler((rnd(i * 3.1) - 0.5) * 0.12, rnd(i * 4.3) * Math.PI * 2, (rnd(i * 5.9) - 0.5) * 0.12));
        const s = 0.8 + rnd(i * 6.7) * 0.4;
        m4.compose(P(x, 0, z), q, P(s, s, s));
        m.setMatrixAt(i, m4);
        const col = new THREE.Color('#ffffff').lerp(new THREE.Color('#e8c890'), seco * (0.6 + rnd(i * 7.1) * 0.4));
        m.setColorAt(i, col);
        i++;
      }
    return m;
  }, [centro[0], centro[1], ancho, fondo, seco]);
  // calabazas y frijol entre los surcos
  const calabazas = useMemo(
    () =>
      Array.from({ length: Math.floor(ancho * fondo * 0.08) }, (_, i) => ({
        x: centro[0] - ancho / 2 + rnd(i * 8.3) * ancho,
        z: centro[1] - fondo / 2 + rnd(i * 9.1) * fondo,
        s: 0.7 + rnd(i * 10.3) * 0.6,
        fruto: rnd(i * 11.7) > 0.6,
      })),
    [centro[0], centro[1], ancho, fondo],
  );
  return (
    <group>
      <primitive object={malla} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centro[0], 0.01, centro[1]]} receiveShadow>
        <planeGeometry args={[ancho + 1, fondo + 1]} />
        <meshStandardMaterial color="#5a4128" roughness={1} />
      </mesh>
      {calabazas.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]} scale={c.s}>
          <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2 + 0.3, 0, i]} castShadow>
            <circleGeometry args={[0.22, 10]} />
            <meshStandardMaterial color="#3f6a2a" side={THREE.DoubleSide} roughness={0.8} />
          </mesh>
          {c.fruto && (
            <mesh position={[0.15, 0.1, 0.1]} castShadow>
              <sphereGeometry args={[0.12, 12, 10]} />
              <meshStandardMaterial color="#d9a030" roughness={0.6} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
};

// ---------- cacao con mazorcas pegadas al tronco ----------
const troncoMat = new THREE.MeshStandardMaterial({ color: '#5a4630', roughness: 0.95 });
const copaMat = conViento(new THREE.MeshStandardMaterial({ map: hojaTex, color: '#c8e0a0', roughness: 0.85 }), 0.03, 'hoja', 1.1);
const COLORES_MAZORCA = ['#d8b03a', '#c98a2a', '#9a4a2a', '#a8b04a', '#b8702a'];
export const ArbolCacao: React.FC<{ position: [number, number, number]; semilla: number; escala?: number }> = ({ position, semilla, escala = 1 }) => (
  <group position={position} scale={escala} rotation={[0, semilla, 0]}>
    <mesh position={[0, 1, 0]} material={troncoMat} castShadow>
      <cylinderGeometry args={[0.09, 0.13, 2, 8]} />
    </mesh>
    {[0, 2.1, 4.2].map((a, i) => (
      <mesh key={i} position={[Math.cos(a) * 0.45, 2.15, Math.sin(a) * 0.45]} rotation={[Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8]} material={troncoMat} castShadow>
        <cylinderGeometry args={[0.04, 0.07, 1.2, 6]} />
      </mesh>
    ))}
    {Array.from({ length: 8 }, (_, j) => (
      <mesh key={j} position={[Math.cos(j * 2.4 + semilla) * 1.0, 2.9 + Math.sin(j * 1.7) * 0.35, Math.sin(j * 2.4 + semilla) * 1.0]} material={copaMat} castShadow>
        <icosahedronGeometry args={[0.85 + rnd(semilla * 9 + j) * 0.35, 2]} />
      </mesh>
    ))}
    {Array.from({ length: 7 }, (_, j) => {
      const a = j * 2.2 + semilla;
      const y = 0.6 + rnd(semilla * 3 + j) * 1.3;
      return (
        <mesh key={j} position={[Math.cos(a) * 0.14, y, Math.sin(a) * 0.14]} rotation={[0, -a, 0.15]} scale={[0.05, 0.11, 0.05]} castShadow>
          <sphereGeometry args={[1, 12, 10]} />
          <meshStandardMaterial color={COLORES_MAZORCA[Math.floor(rnd(semilla * 5 + j) * COLORES_MAZORCA.length)]} roughness={0.55} />
        </mesh>
      );
    })}
  </group>
);

// árbol grande de sombra (el cacao se cultiva bajo sombra)
export const ArbolSombra: React.FC<{ position: [number, number, number]; semilla: number; escala?: number }> = ({ position, semilla, escala = 1 }) => (
  <group position={position} scale={escala}>
    <mesh position={[0, 3, 0]} material={troncoMat} castShadow>
      <cylinderGeometry args={[0.22, 0.4, 6, 9]} />
    </mesh>
    {Array.from({ length: 9 }, (_, j) => (
      <mesh key={j} position={[Math.cos(j * 2.4 + semilla) * 2.2, 6.6 + Math.sin(j * 1.3) * 0.7, Math.sin(j * 2.4 + semilla) * 2.2]} material={copaMat} castShadow>
        <icosahedronGeometry args={[1.6 + rnd(semilla * 7 + j) * 0.6, 2]} />
      </mesh>
    ))}
  </group>
);

// ---------- canasto, metate y fogón ----------
const tejidoMat = new THREE.MeshStandardMaterial({ map: tejidoTex, roughness: 0.95, side: THREE.DoubleSide });
export const Canasto: React.FC<{ position: [number, number, number]; lleno?: number; contenido?: string; escala?: number }> = ({ position, lleno = 0, contenido = '#e0c060', escala = 1 }) => (
  <group position={position} scale={escala}>
    <mesh position={[0, 0.18, 0]} material={tejidoMat} castShadow>
      <cylinderGeometry args={[0.3, 0.22, 0.36, 16, 1, true]} />
    </mesh>
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={tejidoMat}>
      <circleGeometry args={[0.22, 16]} />
    </mesh>
    {lleno > 0.02 && (
      <mesh position={[0, 0.02 + lleno * 0.34, 0]} scale={[1, 0.35, 1]}>
        <sphereGeometry args={[0.22 + lleno * 0.07, 14, 10]} />
        <meshStandardMaterial color={contenido} roughness={0.7} />
      </mesh>
    )}
  </group>
);

const piedraMat = new THREE.MeshStandardMaterial({ color: '#5e5a54', roughness: 0.9 });
export const Metate: React.FC<{ position: [number, number, number]; giro?: number }> = ({ position, giro = 0 }) => (
  <group position={position} rotation={[0, giro, 0]}>
    <mesh position={[0, 0.16, 0]} rotation={[0.18, 0, 0]} material={piedraMat} castShadow receiveShadow>
      <boxGeometry args={[0.42, 0.08, 0.62]} />
    </mesh>
    {[[-0.15, -0.22], [0.15, -0.22], [0, 0.24]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.06, z]} material={piedraMat}>
        <cylinderGeometry args={[0.04, 0.05, 0.12 + (i === 2 ? 0.1 : 0), 6]} />
      </mesh>
    ))}
    {/* masa de maíz */}
    <mesh position={[0, 0.22, -0.15]} scale={[1, 0.4, 1]}>
      <sphereGeometry args={[0.09, 10, 8]} />
      <meshStandardMaterial color="#f0dca0" roughness={0.9} />
    </mesh>
  </group>
);

const humoTex = lienzo(128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  gr.addColorStop(0, 'rgba(255,255,255,.9)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
});
export const Fogon: React.FC<{ t: number; position: [number, number, number]; humo?: number; alto?: number }> = ({ t, position, humo = 1, alto = 5 }) => (
  <group position={position}>
    {[0, 2.1, 4.2].map((a, i) => (
      <mesh key={i} position={[Math.cos(a) * 0.25, 0.1, Math.sin(a) * 0.25]} material={piedraMat} castShadow>
        <dodecahedronGeometry args={[0.13, 0]} />
      </mesh>
    ))}
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[Math.sin(t * 7 + i * 2) * 0.03, 0.18 + i * 0.05, Math.cos(t * 6 + i) * 0.03]} scale={[1, 1.3 + Math.sin(t * 11 + i) * 0.3, 1]}>
        <coneGeometry args={[0.12 - i * 0.03, 0.35 - i * 0.06, 8]} />
        <meshBasicMaterial color={['#ff7a1a', '#ffb030', '#fff0a0'][i]} transparent opacity={0.9} toneMapped={false} />
      </mesh>
    ))}
    <pointLight position={[0, 0.5, 0]} color="#ff9a40" intensity={3 + Math.sin(t * 13) * 0.8} distance={5} decay={2} />
    {Array.from({ length: 14 }, (_, i) => {
      const f = (t * 0.18 + i / 14) % 1;
      return (
        <sprite key={i} position={[Math.sin(i * 1.7 + t * 0.6) * 0.3 * f + f * 0.8, 0.5 + f * alto, Math.cos(i * 2.3) * 0.25 * f]} scale={[0.4 + f * 2.2, 0.4 + f * 2.2, 1]}>
          <spriteMaterial map={humoTex} color="#d8d4cc" transparent opacity={(1 - f) * 0.35 * humo * Math.min(1, f * 6)} depthWrite={false} />
        </sprite>
      );
    })}
  </group>
);

// ---------- personas ----------
export type Pose = 'caminar' | 'moler' | 'sembrar' | 'cargar' | 'cosechar' | 'parado' | 'platicar';
const pielMat = new THREE.MeshStandardMaterial({ color: '#7e5236', roughness: 0.7 });
const peloMat = new THREE.MeshStandardMaterial({ color: '#141010', roughness: 0.6 });
const algodonMat = new THREE.MeshStandardMaterial({ color: '#ece4d0', roughness: 0.9 });
const TELAS = ['#a83a2a', '#2f4f8a', '#c88a2a', '#5a7a3a', '#7a3a5a'];

const Hueso: React.FC<{ largo: number; r: number; mat: THREE.Material }> = ({ largo, r, mat }) => (
  <mesh position={[0, -largo / 2, 0]} material={mat} castShadow>
    <capsuleGeometry args={[r, largo - r * 2, 4, 8]} />
  </mesh>
);

export const Persona: React.FC<{
  t: number;
  pose: Pose;
  position: [number, number, number];
  giro?: number;
  mujer?: boolean;
  fase?: number;
  escala?: number;
  ruta?: { a: [number, number]; vel: number };
  tela?: number;
}> = ({ t, pose, position, giro = 0, mujer = false, fase = 0, escala = 1, ruta, tela = 0 }) => {
  const tt = t + fase;
  let x = position[0];
  let z = position[2];
  let rumbo = giro;
  const camina = pose === 'caminar' || pose === 'cargar';
  if (ruta && camina) {
    const dx = ruta.a[0] - position[0];
    const dz = ruta.a[1] - position[2];
    const largo = Math.hypot(dx, dz);
    const k = ((tt * ruta.vel) / largo) % 1;
    x += dx * k;
    z += dz * k;
    rumbo = Math.atan2(dx, dz);
  }
  const w = pose === 'cargar' ? 5 : 6.5;
  const s = Math.sin(tt * w);
  let cadera = 0.92;
  let lean = 0;
  let piernaI = 0, piernaD = 0, rodI = 0, rodD = 0;
  let brazoI = 0.05, brazoD = 0.05, codoI = -0.15, codoD = -0.15, abreI = 0.08, abreD = 0.08;
  let cabeza = 0;
  if (camina) {
    piernaI = -s * 0.45;
    piernaD = s * 0.45;
    rodI = Math.max(0, s) * 0.7;
    rodD = Math.max(0, -s) * 0.7;
    brazoI = s * 0.35;
    brazoD = -s * 0.35;
    cadera += Math.abs(Math.cos(tt * w)) * 0.03;
    lean = pose === 'cargar' ? 0.3 : 0.05;
    if (pose === 'cargar') {
      brazoI = brazoD = -0.9;
      codoI = codoD = -1.6;
    }
  } else if (pose === 'moler') {
    cadera = 0.5;
    rodI = rodD = 1.55;
    const m = Math.sin(tt * 3.2);
    lean = 0.5 + m * 0.1;
    brazoI = brazoD = -0.95 - m * 0.25;
    codoI = codoD = -0.25 + m * 0.2;
    abreI = abreD = -0.08;
    cabeza = -0.4;
  } else if (pose === 'sembrar') {
    const c = (tt * 0.9) % 1;
    const golpe = c < 0.25 ? Math.sin((c / 0.25) * Math.PI) : 0;
    lean = 0.35 + golpe * 0.15;
    piernaI = -0.25;
    piernaD = 0.15;
    rodI = 0.25;
    brazoD = -0.9 + golpe * 0.5;
    brazoI = -0.6 + golpe * 0.4;
    codoD = -0.6;
    codoI = -0.8;
    cabeza = -0.3;
  } else if (pose === 'cosechar') {
    const c = (Math.sin(tt * 1.6) + 1) / 2;
    brazoD = -2.6 * c - 0.2;
    codoD = -0.3 - (1 - c) * 0.6;
    brazoI = -0.4 - c * 0.6;
    codoI = -1.0;
    lean = -0.1 * c + (1 - c) * 0.3;
    cabeza = 0.5 * c - 0.2;
  } else if (pose === 'platicar') {
    brazoD = -0.6 - Math.max(0, Math.sin(tt * 2.3)) * 0.5;
    codoD = -1.2;
    cabeza = Math.sin(tt * 1.1) * 0.15;
    abreD = 0.3;
  } else {
    lean = 0.02;
    cabeza = Math.sin(tt * 0.7) * 0.1;
  }
  const telaMat = useMemo(() => new THREE.MeshStandardMaterial({ color: TELAS[tela % TELAS.length], roughness: 0.9 }), [tela]);
  const brazo = (lado: 1 | -1, rot: number, codo: number, abre: number, mano?: React.ReactNode) => (
    <group position={[0.2 * lado, 0.52, 0]} rotation={[rot, 0, abre * lado]}>
      <Hueso largo={0.3} r={0.045} mat={pielMat} />
      <group position={[0, -0.3, 0]} rotation={[codo, 0, 0]}>
        <Hueso largo={0.28} r={0.04} mat={pielMat} />
        <group position={[0, -0.3, 0]}>{mano}</group>
      </group>
    </group>
  );
  const pierna = (lado: 1 | -1, rot: number, rod: number) => (
    <group position={[0.1 * lado, 0, 0]} rotation={[rot, 0, 0]}>
      <Hueso largo={0.44} r={0.06} mat={pielMat} />
      <group position={[0, -0.44, 0]} rotation={[rod, 0, 0]}>
        <Hueso largo={0.44} r={0.05} mat={pielMat} />
        <mesh position={[0, -0.46, 0.05]} material={pielMat}>
          <boxGeometry args={[0.08, 0.04, 0.2]} />
        </mesh>
      </group>
    </group>
  );
  const coa =
    pose === 'sembrar' ? (
      <mesh position={[0, -0.2, 0.1]} rotation={[0.3, 0, 0]} material={troncoMat}>
        <cylinderGeometry args={[0.015, 0.02, 1.5, 5]} />
      </mesh>
    ) : null;
  return (
    <group position={[x, position[1], z]} rotation={[0, rumbo, 0]} scale={escala}>
      <group position={[0, cadera, 0]}>
        {pierna(-1, piernaI, rodI)}
        {pierna(1, piernaD, rodD)}
        {/* falda (mujer) o taparrabo de algodón (hombre) */}
        {mujer ? (
          <mesh position={[0, -0.28, 0]} material={telaMat} castShadow rotation={[lean * 0.3, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.25, pose === 'moler' ? 0.35 : 0.62, 12, 1, true]} />
          </mesh>
        ) : (
          <mesh position={[0, -0.05, 0]} material={algodonMat} castShadow>
            <cylinderGeometry args={[0.16, 0.17, 0.16, 12]} />
          </mesh>
        )}
        <group rotation={[lean, 0, 0]}>
          <mesh position={[0, 0.28, 0]} material={mujer ? algodonMat : pielMat} castShadow>
            <capsuleGeometry args={[0.13, 0.28, 4, 10]} />
          </mesh>
          {mujer && (
            <mesh position={[0, 0.3, 0]} material={telaMat}>
              <cylinderGeometry args={[0.142, 0.142, 0.05, 14]} />
            </mesh>
          )}
          {brazo(-1, brazoI, codoI, abreI)}
          {brazo(1, brazoD, codoD, abreD, coa)}
          <group position={[0, 0.62, 0]} rotation={[cabeza, 0, 0]}>
            <mesh position={[0, 0.1, 0]} material={pielMat} castShadow>
              <sphereGeometry args={[0.105, 14, 12]} />
            </mesh>
            <mesh position={[0, 0.14, -0.015]} material={peloMat} scale={[1.05, 0.9, 1.05]}>
              <sphereGeometry args={[0.105, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            </mesh>
            {mujer && (
              <mesh position={[0, -0.02, -0.09]} material={peloMat}>
                <capsuleGeometry args={[0.05, 0.22, 4, 8]} />
              </mesh>
            )}
          </group>
          {/* carga en la espalda con mecapal */}
          {pose === 'cargar' && (
            <group>
              <mesh position={[0, 0.32, -0.28]} castShadow>
                <boxGeometry args={[0.42, 0.5, 0.3]} />
                <meshStandardMaterial map={tejidoTex} roughness={0.95} />
              </mesh>
              <mesh position={[0, 0.66, -0.12]} rotation={[0.9, 0, 0]} material={algodonMat}>
                <torusGeometry args={[0.13, 0.012, 4, 16, Math.PI]} />
              </mesh>
            </group>
          )}
        </group>
      </group>
    </group>
  );
};

// ---------- el pueblo ----------
const CASAS: [number, number, number][] = [
  [-6, 4, 0.3], [5, 6, -0.4], [9, -3, -1.2], [-10, -4, 1.1], [-3, 12, 0.1], [12, 9, -0.8], [-14, 8, 0.7], [2, -8, 3.0], [-8, -12, 1.4], [14, -10, -1.9],
];
const CACAOS = Array.from({ length: 36 }, (_, i) => ({ x: -36 + (i % 6) * 3.1 + (rnd(i * 3.3) - 0.5), z: -4 + Math.floor(i / 6) * 3.1 + (rnd(i * 5.1) - 0.5), s: i }));
const SOMBRAS = [[-33, 0], [-24, 4], [-30, 12], [-21, 13], [-37, 8]];

export const Pueblo: React.FC<{ t: number; seco?: number }> = ({ t, seco = 0.15 }) => (
  <group>
    <SueloReal radio={160} rep={50} color="#c8c0a0" />
    <Pasto n={26000} radio={22} alto={0.28} centro={[0, 0, 0]} hueco={3} />
    <Pasto n={14000} radio={14} alto={0.3} centro={[0, 0, -28]} hueco={0} />
    {/* patio de tierra apisonada al centro */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
      <circleGeometry args={[5, 40]} />
      <meshStandardMaterial color="#8a6a48" roughness={1} />
    </mesh>
    {CASAS.map(([x, z, g], i) => (
      <Casa key={i} position={[x, 0, z]} giro={g} escala={0.85 + rnd(i * 4.1) * 0.25} />
    ))}
    <Fogon t={t} position={[1.4, 0, 0.9]} />
    <Fogon t={t + 3} position={[-11, 0, -1]} humo={0.8} />
    <Fogon t={t + 7} position={[10, 0, 11]} humo={0.7} />
    <Metate position={[2.3, 0, 1.8]} />
    <Canasto position={[1.6, 0, 2.7]} lleno={0.7} contenido="#e8c84a" escala={0.8} />
    <Milpa centro={[26, 3]} ancho={18} fondo={18} seco={seco} />
    {CACAOS.map((c, i) => (
      <ArbolCacao key={i} position={[c.x, 0, c.z]} semilla={c.s} escala={0.9 + rnd(i * 2.2) * 0.25} />
    ))}
    {SOMBRAS.map(([x, z], i) => (
      <ArbolSombra key={i} position={[x, 0, z]} semilla={i * 3.7} escala={1 + rnd(i) * 0.3} />
    ))}
    {/* centro ceremonial: plataformas de piedra bola, estelas y altares */}
    <group position={[0, 0, -28]}>
      <Plataforma ancho={9} fondo={9} alto={3.2} cuerpos={3} position={[0, 0, -7]} />
      <Plataforma ancho={4.5} fondo={11} alto={1.2} cuerpos={2} position={[-10, 0, 0]} giro={Math.PI / 2} />
      <Plataforma ancho={4.5} fondo={11} alto={1.2} cuerpos={2} position={[10, 0, 0]} giro={-Math.PI / 2} />
      <Estela position={[-2.2, 0, -1.6]} />
      <Estela position={[2.2, 0, -1.6]} alto={1.4} />
      <Estela position={[0, 0, -0.8]} alto={2} />
    </group>
    {/* árboles alrededor del pueblo */}
    {[[-20, -20], [22, -22], [-24, 22], [18, 24], [30, -12], [-6, 26], [40, 18], [-45, -10]].map(([x, z], i) => (
      <ArbolSombra key={i} position={[x, 0, z]} semilla={i * 5.3 + 1} escala={1.1 + rnd(i * 3) * 0.4} />
    ))}
    {/* el Tacaná al fondo, al noreste */}
    <group position={[25, -0.1, -150]} scale={[7.5, 7.5, 7.5]}>
      <mesh geometry={volcanReal}>
        <meshStandardMaterial vertexColors map={volcanTex} roughness={0.95} />
      </mesh>
      <mesh geometry={rocaGeo} position={[0, 0.002, 0]}>
        <meshStandardMaterial vertexColors transparent roughness={0.9} polygonOffset polygonOffsetFactor={-2} depthWrite={false} />
      </mesh>
    </group>
  </group>
);

// ---------- avance (sin voz) para mostrar los modelos ----------
const TOMAS = [
  { d: 6, t: 'IZAPA', s: 'Tuxtla Chico, hace unos 2,000 años' },
  { d: 6, t: 'MOLER EL MAÍZ', s: 'Masa en el metate, junto al fogón' },
  { d: 6, t: 'LA MILPA', s: 'Maíz, frijol y calabaza' },
  { d: 6, t: 'EL CACAO', s: 'Bajo la sombra de árboles grandes' },
  { d: 6, t: 'LA PLAZA', s: 'Estelas y plataformas de piedra bola' },
];
export const DURA_IZAPA = TOMAS.reduce((a, b) => a + b.d, 0) + 1;

export const IzapaVida: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { w, h, tipo, fov } = useFormato();
  let ini = 0;
  let e = 0;
  for (let i = 0; i < TOMAS.length; i++) {
    if (t >= ini + TOMAS[i].d && i < TOMAS.length - 1) {
      ini += TOMAS[i].d;
      e = i + 1;
    } else break;
  }
  const l = t - ini;
  const x = Easing.inOut(Easing.cubic)(Math.min(1, l / TOMAS[e].d));
  const lerp = (a: THREE.Vector3, b: THREE.Vector3, k: number) => a.clone().lerp(b, k);
  let pos: THREE.Vector3;
  let mira: THREE.Vector3;
  let hora = cieloEntre('amanecer', 'dia', 0.3);
  if (e === 0) {
    pos = lerp(P(-18, 22, 40), P(-6, 9, 22), x);
    mira = lerp(P(4, 0, -10), P(2, 1, -4), x);
    hora = cieloEntre('amanecer', 'dia', 0.2 + x * 0.3);
  } else if (e === 1) {
    pos = lerp(P(4.8, 1.5, 4.9), P(4.0, 1.15, 4.0), x);
    mira = P(2.2, 0.45, 2.0);
    hora = cieloEntre('amanecer', 'dia', 0.6);
  } else if (e === 2) {
    pos = lerp(P(15, 1.7, 13), P(19, 2.3, 9), x);
    mira = lerp(P(20, 1.3, 7), P(23, 1.1, 4), x);
    hora = cieloEntre('dia', 'dia', 0);
  } else if (e === 3) {
    pos = lerp(P(-16.5, 1.3, 12), P(-18.3, 1.15, 10.2), x);
    mira = lerp(P(-24, 1.1, 5), P(-25, 1.0, 4.5), x);
    hora = cieloEntre('dia', 'atardecer', 0.2);
  } else {
    pos = lerp(P(0, 2.2, -10), P(0, 7, -2), x);
    mira = lerp(P(0, 1.4, -32), P(0, 2, -34), x);
    hora = cieloEntre('dia', 'atardecer', 0.55 + x * 0.25);
  }
  const foco = mira.clone();
  const fundido = interpolate(t, [0, 0.6, DURA_IZAPA - 1.2, DURA_IZAPA - 0.2], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const corte = Math.min(1, l / 0.35, (TOMAS[e].d - l) / 0.35 + (e === TOMAS.length - 1 ? 1 : 0));
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill style={{ opacity: fundido * Math.max(0.15, corte) }}>
        <FondoCielo c={hora} t={t} w={w} h={h} sol={[0.72, 0.42]} bokeh={0} />
        <ThreeCanvas width={w} height={h} style={{ position: 'absolute', inset: 0 }} gl={{ alpha: true, antialias: true }} shadows="soft">
          <Estudio />
          <Viento t={t} />
          <fog attach="fog" args={[hora.abajo, 45, 230]} />
          <CamaraSerie pos={pos} mira={mira} fov={fov} w={w} h={h} tipo={tipo} />
          <hemisphereLight args={[hora.amb, '#3a3a1e', 0.9]} />
          <LuzSol position={[18, 22, 14]} color={hora.luz} intensity={2.6} caja={e === 0 ? 34 : 12} mira={[foco.x, 0, foco.z]} />
          <Pueblo t={t} />
          <Nubes t={t} n={8} altura={30} dist={110} ancho={220} opacidad={0.75} tam={0.9} />
          {/* gente del pueblo */}
          <Persona t={t} pose="moler" position={[2.3, 0, 2.38]} giro={Math.PI} mujer tela={0} />
          <Persona t={t} pose="platicar" position={[0.4, 0, 2.6]} giro={1.9} mujer tela={1} fase={1} />
          <Persona t={t} pose="caminar" position={[-4, 0, 1]} ruta={{ a: [8, -6], vel: 0.9 }} tela={2} />
          <Persona t={t} pose="cargar" position={[20, 0, 14]} ruta={{ a: [4, 2], vel: 0.7 }} fase={2} />
          <Persona t={t} pose="caminar" position={[-6, 0, -6]} ruta={{ a: [0, -20], vel: 0.8 }} mujer tela={3} fase={4} escala={0.7} />
          <Persona t={t} pose="cosechar" position={[21.5, 0, 6]} giro={0.6} />
          <Persona t={t} pose="cosechar" position={[24, 0, 3.5]} giro={-0.4} mujer tela={4} fase={1.3} />
          <Persona t={t} pose="sembrar" position={[19.5, 0, 9.5]} giro={0.9} fase={0.4} />
          <Canasto position={[22.1, 0, 6.6]} lleno={0.3 + Math.min(0.6, t * 0.02)} contenido="#d8b860" />
          <Persona t={t} pose="cosechar" position={[-24.5, 0, 4.6]} giro={-2.2} />
          <Persona t={t} pose="cargar" position={[-22, 0, 8]} ruta={{ a: [-8, 2], vel: 0.7 }} fase={5} />
          <Canasto position={[-24.0, 0, 5.4]} lleno={0.6} contenido="#d98a22" />
          <Persona t={t} pose="parado" position={[-1.5, 0, -24]} giro={Math.PI} mujer tela={1} />
          <Persona t={t} pose="parado" position={[1.2, 0, -23.5]} giro={Math.PI + 0.2} tela={2} fase={2} />
          <Persona t={t} pose="platicar" position={[3, 0, -22]} giro={Math.PI - 0.6} fase={3} />
          <Persona t={t} pose="caminar" position={[-8, 0, -20]} ruta={{ a: [6, -20], vel: 0.6 }} mujer tela={0} fase={6} />
          {[0, 1, 2].map((i) => (
            <PajaroReal key={i} t={t + i} position={P(-20 + ((t * 3 + i * 9) % 50), 9 + i * 1.5, -6 + i * 4)} rumbo={P(1, 0, 0.1)} escala={0.5} fase={i} />
          ))}
        </ThreeCanvas>
      </AbsoluteFill>
      <Rotulo t={l} desde={0.4} hasta={TOMAS[e].d - 0.2} titulo={TOMAS[e].t} sub={TOMAS[e].s} abajo />
    </AbsoluteFill>
  );
};
