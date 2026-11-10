import React, { useMemo } from 'react';
import * as THREE from 'three';
import { pelitoGeo, pelitoMat, pielBaja } from './Anuncio3D';
import { Racimo, hojaGeo, hojaMat } from './Racimo';

// Cosecha: reja de plástico calada, montón de rambutanes que va subiendo, racimos que caen del árbol.
// Escala en metros.

const rnd = (s: number) => {
  const x = Math.sin(s * 57.3 + 1.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- reja de plástico con ranuras (alphaMap) ----------
const ranurasTex = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#000';
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 3; j++) {
      const x = 14 + i * 26.5;
      const y = 22 + j * 30;
      g.beginPath();
      g.roundRect(x, y, 16, 22, 5);
      g.fill();
    }
  const t = new THREE.CanvasTexture(c);
  return t;
})();

export const Reja: React.FC<{ position?: [number, number, number]; rotation?: [number, number, number]; color?: string; L?: number; A?: number; H?: number }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = '#1d5fc4',
  L = 0.7,
  A = 0.45,
  H = 0.34,
}) => {
  const pared = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0, alphaMap: ranurasTex ?? undefined, alphaTest: 0.5, side: THREE.DoubleSide }), [color]);
  const solido = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.4 }), [color]);
  const e = 0.014;
  return (
    <group position={position} rotation={rotation}>
      {/* fondo */}
      <mesh material={solido} position={[0, e / 2, 0]}>
        <boxGeometry args={[L, e, A]} />
      </mesh>
      {/* paredes caladas */}
      {[-1, 1].map((s) => (
        <mesh key={'l' + s} material={pared} position={[0, H / 2, (s * A) / 2]}>
          <boxGeometry args={[L, H, e]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={'c' + s} material={pared} position={[(s * L) / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[A, H, e]} />
        </mesh>
      ))}
      {/* borde de arriba reforzado y esquinas */}
      {[-1, 1].map((s) => (
        <mesh key={'b' + s} material={solido} position={[0, H - 0.015, (s * A) / 2]}>
          <boxGeometry args={[L + 0.03, 0.035, 0.03]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={'d' + s} material={solido} position={[(s * L) / 2, H - 0.015, 0]}>
          <boxGeometry args={[0.03, 0.035, A + 0.03]} />
        </mesh>
      ))}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`e${sx}${sz}`} material={solido} position={[(sx * L) / 2, H / 2, (sz * A) / 2]}>
            <boxGeometry args={[0.035, H, 0.035]} />
          </mesh>
        )),
      )}
    </group>
  );
};

// ---------- montón de rambutanes dentro de la reja ----------
const N_PELOS = 46;
const pelosLocales = (() => {
  const l: THREE.Matrix4[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < N_PELOS; i++) {
    const y = 1 - (i / (N_PELOS - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = Math.PI * (3 - Math.sqrt(5)) * i;
    const p = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
    const n = p.clone().add(new THREE.Vector3(rnd(i) - 0.5, rnd(i * 3) - 0.5, rnd(i * 7) - 0.5).multiplyScalar(0.35)).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(up, n);
    const largo = 0.8 + rnd(i * 5) * 0.45;
    l.push(new THREE.Matrix4().compose(p.multiplyScalar(0.98), q, new THREE.Vector3(largo, largo, largo)));
  }
  return l;
})();

export const Monton: React.FC<{ k: number; L?: number; A?: number; r?: number; capas?: number; position?: [number, number, number] }> = ({ k, L = 0.66, A = 0.41, r = 0.055, capas = 3, position = [0, 0, 0] }) => {
  const lugares = useMemo(() => {
    const nx = Math.floor(L / (r * 2.05));
    const nz = Math.floor(A / (r * 2.05));
    const l: THREE.Matrix4[] = [];
    let i = 0;
    for (let c = 0; c < capas; c++)
      for (let a = 0; a < nx; a++)
        for (let b = 0; b < nz; b++) {
          i++;
          const x = -L / 2 + r * 1.05 + a * r * 2.05 + (c % 2) * r * 0.5 + (rnd(i) - 0.5) * r * 0.4;
          const z = -A / 2 + r * 1.05 + b * r * 2.05 + (c % 2) * r * 0.5 + (rnd(i * 2) - 0.5) * r * 0.4;
          const y = r + c * r * 1.7 + rnd(i * 3) * r * 0.3;
          const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(i * 4) * 6, rnd(i * 5) * 6, 0));
          l.push(new THREE.Matrix4().compose(new THREE.Vector3(Math.min(L / 2 - r, x), y, Math.min(A / 2 - r, z)), q, new THREE.Vector3(r, r, r)));
        }
    return l;
  }, [L, A, r, capas]);
  const { piel, pelos } = useMemo(() => {
    const piel = new THREE.InstancedMesh(pielBaja, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }), lugares.length);
    const pelos = new THREE.InstancedMesh(pelitoGeo, pelitoMat, lugares.length * N_PELOS);
    pelos.userData.noProyecta = true;
    return { piel, pelos };
  }, [lugares]);
  const cuantos = Math.floor(lugares.length * Math.max(0, Math.min(1, k)));
  const cero = new THREE.Matrix4().makeScale(0, 0, 0);
  const m = new THREE.Matrix4();
  lugares.forEach((lm, i) => {
    const ok = i < cuantos;
    piel.setMatrixAt(i, ok ? lm : cero);
    for (let j = 0; j < N_PELOS; j++) pelos.setMatrixAt(i * N_PELOS + j, ok ? m.multiplyMatrices(lm, pelosLocales[j]) : cero);
  });
  piel.instanceMatrix.needsUpdate = true;
  pelos.instanceMatrix.needsUpdate = true;
  return (
    <group position={position}>
      <primitive object={piel} />
      <primitive object={pelos} />
    </group>
  );
};

// ---------- racimo que se corta y cae ----------
// de: dónde cuelga; a: dónde cae; t0: cuándo se corta. Antes de cortarse se mece con el viento.
export const RacimoQueCae: React.FC<{ t: number; t0: number; de: THREE.Vector3; a: THREE.Vector3; semilla: number; escala?: number }> = ({ t, t0, de, a, semilla, escala = 0.3 }) => {
  const dt = t - t0;
  const caida = 0.62; // segundos de caída
  if (dt > caida) return null;
  let p = de.clone();
  let rot: [number, number, number] = [Math.sin(t * 1.7 + semilla) * 0.05, semilla, Math.cos(t * 1.3 + semilla) * 0.05];
  if (dt > 0) {
    const k = dt / caida;
    p = de.clone().lerp(a, k);
    p.y = de.y + (a.y - de.y) * k * k; // acelera como en caída libre
    rot = [k * 0.9, semilla + k * 0.6, k * 0.5];
  } else if (dt > -0.25) {
    // tirón del corte
    rot[2] += Math.sin((dt + 0.25) * 60) * 0.03;
  }
  return <Racimo n={9} semilla={semilla} pelos={70} escala={escala} position={p.toArray() as [number, number, number]} rotation={rot} hojas />;
};

// hojas sueltas que caen girando
export const HojasCayendo: React.FC<{ t: number; desde: number; centro: THREE.Vector3; n?: number }> = ({ t, desde, centro, n = 7 }) => {
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const dt = t - desde - i * 0.35;
        if (dt < 0 || dt > 4) return null;
        const y = centro.y - dt * 0.9;
        if (y < 0.02) return null;
        const x = centro.x + Math.sin(dt * 2.2 + i) * 0.35 + (rnd(i) - 0.5) * 1.2;
        const z = centro.z + Math.cos(dt * 1.7 + i) * 0.25 + (rnd(i * 3) - 0.5) * 1.2;
        return <mesh key={i} geometry={hojaGeo} material={hojaMat} position={[x, y, z]} rotation={[dt * 2.4 + i, dt * 1.3, Math.sin(dt * 3 + i) * 0.8]} scale={0.14} />;
      })}
    </group>
  );
};
