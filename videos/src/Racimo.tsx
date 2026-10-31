import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Rambutan } from './Anuncio3D';

// Racimo colgando de su ramita con hojas, y árbol de rambután con varios racimos.
// Hecho a partir de fotos de referencia: hojas elípticas verde oscuro y brillantes, ramitas cafés, frutas apretadas.

const rnd = (s: number) => {
  const x = Math.sin(s * 91.7 + 3.1) * 43758.5453;
  return x - Math.floor(x);
};

// hoja elíptica con punta, doblada en la nervadura
export const hojaGeo = (() => {
  const f = new THREE.Shape();
  f.moveTo(0, 0);
  f.bezierCurveTo(0.32, 0.25, 0.36, 0.95, 0, 1.45);
  f.bezierCurveTo(-0.36, 0.95, -0.32, 0.25, 0, 0);
  const g = new THREE.ShapeGeometry(f, 16);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, Math.abs(x) * 0.35 - Math.pow(y / 1.45, 2) * 0.25);
  }
  g.computeVertexNormals();
  return g;
})();
export const hojaMat = new THREE.MeshPhysicalMaterial({ color: '#2f6b2a', roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2, side: THREE.DoubleSide });
const ramaMat = new THREE.MeshStandardMaterial({ color: '#7a5a3a', roughness: 0.85 });

const Tallo: React.FC<{ de: THREE.Vector3; a: THREE.Vector3; r?: number }> = ({ de, a, r = 0.025 }) => {
  const geo = useMemo(() => {
    const medio = de.clone().lerp(a, 0.5).add(new THREE.Vector3(0, 0.08, 0));
    return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(de, medio, a), 8, r, 5, false);
  }, [de, a, r]);
  return <mesh geometry={geo} material={ramaMat} />;
};

// posiciones de las frutas en un racimo colgante (en forma de cono invertido)
const lugaresRacimo = (n: number, semilla: number) => {
  const l: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const capa = Math.floor(i / 5);
    const a = (i % 5) * 1.257 + capa * 0.6 + rnd(i + semilla) * 0.4;
    const r = 0.55 - capa * 0.12 + rnd(i * 2 + semilla) * 0.12;
    l.push(new THREE.Vector3(Math.cos(a) * r, -0.9 - capa * 0.42 + rnd(i * 3 + semilla) * 0.15, Math.sin(a) * r));
  }
  return l;
};

export const Racimo: React.FC<{ n?: number; semilla?: number; pelos?: number; position?: [number, number, number]; rotation?: [number, number, number]; escala?: number; hojas?: boolean }> = ({
  n = 13,
  semilla = 1,
  pelos = 260,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  escala = 1,
  hojas = true,
}) => {
  const lugares = useMemo(() => lugaresRacimo(n, semilla), [n, semilla]);
  const nudo = new THREE.Vector3(0, -0.35, 0);
  return (
    <group position={position} rotation={rotation} scale={escala}>
      {/* ramita principal */}
      <Tallo de={new THREE.Vector3(0, 1.3, 0)} a={nudo} r={0.05} />
      {lugares.map((p, i) => (
        <group key={i}>
          <Tallo de={nudo} a={p.clone().add(new THREE.Vector3(0, 0.3, 0))} r={0.02} />
          <Rambutan semilla={semilla * 31 + i} pelos={pelos} escala={0.3} position={[p.x, p.y, p.z]} rotation={[rnd(i) * 3, rnd(i * 5) * 3, 0]} />
        </group>
      ))}
      {hojas &&
        [-1, 1].map((lado) => (
          <mesh key={lado} geometry={hojaGeo} material={hojaMat} position={[lado * 0.08, 0.2, 0.05]} rotation={[0.3, lado * 0.4, lado * -1.05]} scale={0.95} />
        ))}
    </group>
  );
};

// árbol: tronco, ramas y copa hecha de muchas hojas, con racimos colgando por fuera
const N_HOJAS = 2200;
export const Arbol: React.FC<{ position?: [number, number, number]; racimos?: number; escala?: number }> = ({ position = [0, 0, 0], racimos = 7, escala = 1 }) => {
  const copa = useMemo(() => {
    const m = new THREE.InstancedMesh(hojaGeo, hojaMat, N_HOJAS);
    const centros = [new THREE.Vector3(0, 4.6, 0), new THREE.Vector3(-1.6, 4.0, 0.4), new THREE.Vector3(1.6, 4.1, -0.3), new THREE.Vector3(0.3, 5.6, -0.4), new THREE.Vector3(-0.6, 4.3, 1.4), new THREE.Vector3(0.9, 4.0, 1.2)];
    const mat = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (let i = 0; i < N_HOJAS; i++) {
      const c = centros[i % centros.length];
      const d = new THREE.Vector3(rnd(i) - 0.5, rnd(i * 2) - 0.5, rnd(i * 3) - 0.5).normalize();
      const p = c.clone().add(d.clone().multiplyScalar(1.1 + rnd(i * 4) * 0.5));
      q.setFromEuler(new THREE.Euler(rnd(i * 5) * 6.28, rnd(i * 6) * 6.28, rnd(i * 7) * 6.28));
      const s = 0.38 + rnd(i * 8) * 0.18;
      mat.compose(p, q, new THREE.Vector3(s, s, s));
      m.setMatrixAt(i, mat);
      m.setColorAt(i, new THREE.Color().setHSL(0.28 + rnd(i * 9) * 0.05, 0.5, 0.18 + rnd(i * 10) * 0.12));
    }
    return m;
  }, []);
  const lugares = useMemo(
    () =>
      Array.from({ length: racimos }, (_, i) => {
        const a = (i / racimos) * Math.PI * 2 + 0.4;
        return new THREE.Vector3(Math.cos(a) * 2.2, 3.4 + rnd(i * 11) * 0.8, Math.sin(a) * 1.9);
      }),
    [racimos],
  );
  return (
    <group position={position} scale={escala}>
      <mesh position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.22, 0.38, 3.4, 16]} />
        <meshStandardMaterial color="#5b4330" roughness={0.95} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos(i * 1.6) * 0.6, 3.6, Math.sin(i * 1.6) * 0.6]} rotation={[Math.sin(i * 1.6) * 0.7, 0, -Math.cos(i * 1.6) * 0.7]}>
          <cylinderGeometry args={[0.07, 0.13, 1.8, 8]} />
          <meshStandardMaterial color="#5b4330" roughness={0.95} />
        </mesh>
      ))}
      <primitive object={copa} />
      {lugares.map((p, i) => (
        <Racimo key={i} n={9} semilla={i + 3} pelos={90} escala={0.55} position={[p.x, p.y, p.z]} rotation={[0, -Math.atan2(p.z, p.x), 0]} hojas={false} />
      ))}
    </group>
  );
};
