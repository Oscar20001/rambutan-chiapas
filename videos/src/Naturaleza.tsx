import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

// Piezas 3D de la naturaleza para la serie: panícula de flores, abejas, pájaros, frutos que crecen,
// cielo con bokeh y cámara que encuadra en proporción áurea según el formato.
// Geometría escondida: ramas y pelitos en ángulo áureo (137.5°), bokeh en la flor de la vida.

export const AUREO = Math.PI * (3 - Math.sqrt(5)); // 137.5° en radianes
export const PHI = 1.6180339887;
export const rnd = (s: number) => {
  const x = Math.sin(s * 127.1 + 1.7) * 43758.5453;
  return x - Math.floor(x);
};
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const suave = (t: number, a: number, b: number) => {
  const x = clamp01((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};

// ---------- cámara ----------
// ox, oy: cuánto se corre el sujeto (fracción de pantalla). En horizontal se va a la derecha (línea áurea).
export const CamaraSerie: React.FC<{ pos: THREE.Vector3; mira: THREE.Vector3; fov: number; w: number; h: number; tipo: string }> = ({ pos, mira, fov, w, h, tipo }) => {
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  cam.position.copy(pos);
  cam.lookAt(mira);
  cam.fov = fov;
  cam.near = 0.02;
  cam.far = 400;
  const ox = tipo === 'horizontal' ? -(0.618 - 0.5) * w : 0;
  const oy = tipo === 'vertical' ? -(0.56 - 0.5) * h : tipo === 'cuadrado' ? -0.05 * h : 0;
  cam.setViewOffset(w, h, ox, oy, w, h);
  cam.updateProjectionMatrix();
  return null;
};

// ---------- cielo por hora del día ----------
export type Hora = 'amanecer' | 'dia' | 'atardecer' | 'noche';
export const CIELOS: Record<Hora, { arriba: string; medio: string; abajo: string; sol: string; luz: string; amb: string; bokeh: string[] }> = {
  amanecer: { arriba: '#3a4f8f', medio: '#f19a6b', abajo: '#ffd9a0', sol: '#ffe2a8', luz: '#ffc58a', amb: '#8fa3d8', bokeh: ['#ffd7a0', '#ffb07a', '#cfe8a0'] },
  dia: { arriba: '#4f9be0', medio: '#a8d4f0', abajo: '#e8f4d8', sol: '#fffbe8', luz: '#fff4dc', amb: '#bcdcff', bokeh: ['#d8f0a0', '#9fd06a', '#fff3b0'] },
  atardecer: { arriba: '#3b2a6b', medio: '#e8603c', abajo: '#ffb347', sol: '#ffcf70', luz: '#ff9a50', amb: '#7a5aa8', bokeh: ['#ffb347', '#ff7a50', '#ffd27a'] },
  noche: { arriba: '#050a1c', medio: '#0e1a3a', abajo: '#1b2c4a', sol: '#dfe8ff', luz: '#9fb4ff', amb: '#2a3a6a', bokeh: ['#c8ff7a', '#9fe0ff', '#fff6c0'] },
};

// mezcla de dos cielos (para pasar del amanecer a la noche en un mismo video)
const mezcla = (a: string, b: string, k: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();
export const cieloEntre = (a: Hora, b: Hora, k: number) => {
  const A = CIELOS[a];
  const B = CIELOS[b];
  return {
    arriba: mezcla(A.arriba, B.arriba, k),
    medio: mezcla(A.medio, B.medio, k),
    abajo: mezcla(A.abajo, B.abajo, k),
    sol: mezcla(A.sol, B.sol, k),
    luz: mezcla(A.luz, B.luz, k),
    amb: mezcla(A.amb, B.amb, k),
    bokeh: A.bokeh.map((c, i) => mezcla(c, B.bokeh[i], k)),
  };
};

// Fondo de cielo con sol y bokeh. Los círculos del bokeh siguen la flor de la vida (centro + 2 anillos hexagonales).
const FLOR_DE_VIDA = (() => {
  const p: [number, number][] = [[0, 0]];
  for (let i = 0; i < 6; i++) p.push([Math.cos((i * Math.PI) / 3), Math.sin((i * Math.PI) / 3)]);
  for (let i = 0; i < 6; i++) p.push([2 * Math.cos((i * Math.PI) / 3), 2 * Math.sin((i * Math.PI) / 3)]);
  for (let i = 0; i < 6; i++) p.push([Math.sqrt(3) * Math.cos((i * Math.PI) / 3 + Math.PI / 6), Math.sqrt(3) * Math.sin((i * Math.PI) / 3 + Math.PI / 6)]);
  return p;
})();

export const FondoCielo: React.FC<{ c: ReturnType<typeof cieloEntre>; t: number; w: number; h: number; sol?: [number, number]; bokeh?: number; estrellas?: number; horizonte?: number }> = ({
  c,
  t,
  w,
  h,
  sol = [0.78, 0.2],
  bokeh = 1,
  estrellas = 0,
  horizonte = 0,
}) => {
  const m = Math.min(w, h);
  const cx = w * 0.5 + Math.sin(t * 0.07) * m * 0.03;
  const cy = h * 0.42;
  const R = m * 0.21;
  return (
    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${c.arriba} 0%, ${c.medio} 58%, ${c.abajo} 100%)`, overflow: 'hidden' }}>
      {estrellas > 0 &&
        Array.from({ length: 140 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: rnd(i) * w,
              top: rnd(i * 3) * h * 0.65,
              width: 1.5 + rnd(i * 5) * 2.5,
              height: 1.5 + rnd(i * 5) * 2.5,
              borderRadius: '50%',
              background: '#fff',
              opacity: estrellas * (0.4 + 0.6 * Math.abs(Math.sin(t * (0.8 + rnd(i * 7)) + i))),
            }}
          />
        ))}
      <div
        style={{
          position: 'absolute',
          left: w * sol[0] - m * 0.5,
          top: h * sol[1] - m * 0.5,
          width: m,
          height: m,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${c.sol} 0%, ${c.sol}cc 6%, ${c.sol}44 18%, transparent 55%)`,
        }}
      />
      {horizonte > 0 && (
        <svg width={w} height={h} style={{ position: 'absolute', inset: 0, opacity: horizonte }}>
          {/* silueta lejana del Tacaná entre la bruma */}
          <path
            d={`M 0 ${h * 0.7} L ${w * 0.18} ${h * 0.66} L ${w * 0.42} ${h * 0.5} Q ${w * 0.5} ${h * 0.43} ${w * 0.57} ${h * 0.5} L ${w * 0.8} ${h * 0.64} L ${w} ${h * 0.68} L ${w} ${h} L 0 ${h} Z`}
            fill={c.arriba}
            opacity={0.35}
          />
        </svg>
      )}
      {bokeh > 0 &&
        FLOR_DE_VIDA.map(([x, y], i) => {
          const col = c.bokeh[i % c.bokeh.length];
          const r = R * (0.55 + rnd(i * 13) * 0.35);
          const dx = Math.sin(t * 0.3 + i) * m * 0.01;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: cx + x * R * 1.05 - r + dx,
                top: cy + y * R * 1.05 - r,
                width: r * 2,
                height: r * 2,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${col}55 0%, ${col}33 60%, ${col}11 72%, transparent 74%)`,
                filter: `blur(${m * 0.006}px)`,
                opacity: bokeh * (0.55 + 0.45 * Math.sin(t * 0.6 + i * 1.3)),
              }}
            />
          );
        })}
    </div>
  );
};

// ---------- panícula de flores ----------
// Eje curvo con ramitas en ángulo áureo; flores diminutas sin pétalos (cáliz + estambres).
const N_RAMAS = 21;
export type Lugar = { p: THREE.Vector3; n: THREE.Vector3; orden: number };
export const lugaresPanicula = () => {
  const flores: Lugar[] = [];
  const puntas: Lugar[] = [];
  const ramas: { de: THREE.Vector3; a: THREE.Vector3 }[] = [];
  const eje = (y: number) => new THREE.Vector3(Math.sin(y * 1.3) * 0.12, y, Math.cos(y * 0.9) * 0.05 - 0.05);
  for (let k = 0; k < N_RAMAS; k++) {
    const f = k / (N_RAMAS - 1);
    const y = 0.15 + f * 1.55;
    const ang = k * AUREO;
    const largo = 0.62 * (1 - f * 0.75);
    const de = eje(y);
    const dir = new THREE.Vector3(Math.cos(ang), 0.55 + f * 0.4, Math.sin(ang)).normalize();
    const a = de.clone().add(dir.clone().multiplyScalar(largo)).add(new THREE.Vector3(0, -largo * 0.25 * (1 - f), 0));
    ramas.push({ de, a });
    const nf = 5 + Math.round(5 * (1 - f));
    for (let j = 0; j < nf; j++) {
      const q = (j + 1) / nf;
      const p = de.clone().lerp(a, q);
      const giro = j * AUREO + k;
      const n = new THREE.Vector3(Math.cos(giro), 0.6, Math.sin(giro)).normalize();
      p.add(n.clone().multiplyScalar(0.035));
      flores.push({ p, n, orden: f * 0.7 + q * 0.3 });
    }
    puntas.push({ p: a.clone(), n: dir, orden: f });
  }
  return { flores, puntas, ramas, eje };
};

const tallitoMat = new THREE.MeshStandardMaterial({ color: '#7d8a3a', roughness: 0.7 });
const calizMat = new THREE.MeshStandardMaterial({ color: '#dfe2a0', roughness: 0.55, emissive: new THREE.Color('#3a3a10'), emissiveIntensity: 0.15 });
const estambreMat = new THREE.MeshStandardMaterial({ color: '#f3efc0', roughness: 0.4, emissive: new THREE.Color('#5a5020'), emissiveIntensity: 0.25 });
const calizGeo = new THREE.SphereGeometry(0.03, 10, 8);
const estambreGeo = (() => {
  const g = new THREE.CylinderGeometry(0.0025, 0.004, 0.05, 4);
  g.translate(0, 0.025, 0);
  const cab = new THREE.SphereGeometry(0.008, 6, 5);
  cab.translate(0, 0.052, 0);
  const m = new THREE.BufferGeometry();
  const unir = (gs: THREE.BufferGeometry[]) => {
    const pos: number[] = [];
    const nor: number[] = [];
    gs.forEach((x) => {
      const y = x.index ? x.toNonIndexed() : x;
      pos.push(...(y.attributes.position.array as Float32Array));
      nor.push(...(y.attributes.normal.array as Float32Array));
    });
    m.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    m.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    return m;
  };
  return unir([g, cab]);
})();

const Rama: React.FC<{ de: THREE.Vector3; a: THREE.Vector3; r: number; mat?: THREE.Material }> = ({ de, a, r, mat = tallitoMat }) => {
  const geo = useMemo(() => {
    const m = de.clone().lerp(a, 0.5).add(new THREE.Vector3(0, 0.04, 0));
    return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(de, m, a), 10, r, 6, false);
  }, [de, a, r]);
  return <mesh geometry={geo} material={mat} />;
};

// florecer: 0..1 (las de abajo abren primero); caer: 0..1 (las flores se secan y caen)
export const Panicula: React.FC<{ florecer: number; caer?: number; t: number; position?: [number, number, number]; rotation?: [number, number, number]; escala?: number }> = ({
  florecer,
  caer = 0,
  t,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  escala = 1,
}) => {
  const L = useMemo(lugaresPanicula, []);
  const ejeGeo = useMemo(() => {
    const pts = Array.from({ length: 12 }, (_, i) => L.eje(-0.4 + (i / 11) * 2.2));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.022, 8, false);
  }, [L]);
  const { caliz, estambres } = useMemo(() => {
    const c = new THREE.InstancedMesh(calizGeo, calizMat, L.flores.length);
    const e = new THREE.InstancedMesh(estambreGeo, estambreMat, L.flores.length * 6);
    return { caliz: c, estambres: e };
  }, [L]);
  // actualiza instancias cada cuadro
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const arriba = new THREE.Vector3(0, 1, 0);
  L.flores.forEach((fl, i) => {
    const abre = suave(florecer, fl.orden * 0.75, fl.orden * 0.75 + 0.25);
    const cae = suave(caer, fl.orden * 0.6, fl.orden * 0.6 + 0.4);
    const s = (0.35 + 0.65 * abre) * (1 - cae);
    const p = fl.p.clone().add(new THREE.Vector3(0, -cae * cae * 0.6, 0));
    q.setFromUnitVectors(arriba, fl.n);
    m4.compose(p, q, new THREE.Vector3(s, s * (0.8 + 0.2 * abre), s));
    caliz.setMatrixAt(i, m4);
    for (let j = 0; j < 6; j++) {
      const gj = (j * Math.PI) / 3 + i;
      const inc = 0.15 + abre * 0.75;
      const d = new THREE.Vector3(Math.cos(gj) * Math.sin(inc), Math.cos(inc), Math.sin(gj) * Math.sin(inc));
      const qq = new THREE.Quaternion().setFromUnitVectors(arriba, d).premultiply(q);
      const se = abre * (1 - cae) * (0.9 + 0.1 * Math.sin(t * 2 + i));
      m4.compose(p, qq, new THREE.Vector3(se, se, se));
      estambres.setMatrixAt(i * 6 + j, m4);
    }
  });
  caliz.instanceMatrix.needsUpdate = true;
  estambres.instanceMatrix.needsUpdate = true;
  return (
    <group position={position} rotation={rotation} scale={escala}>
      <mesh geometry={ejeGeo} material={tallitoMat} />
      {L.ramas.map((r, i) => (
        <Rama key={i} de={r.de} a={r.a} r={0.009} />
      ))}
      <primitive object={caliz} />
      <primitive object={estambres} />
    </group>
  );
};

// ---------- abeja ----------
const rayasTex = (() => {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const x = c.getContext('2d')!;
  for (let i = 0; i < 8; i++) {
    x.fillStyle = i % 2 ? '#1a1206' : '#e8a514';
    x.fillRect(0, i * 32, 64, 32);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
const abdomenMat = new THREE.MeshStandardMaterial({ map: rayasTex, roughness: 0.6 });
const toraxMat = new THREE.MeshStandardMaterial({ color: '#4a3410', roughness: 0.9 });
const negroMat = new THREE.MeshStandardMaterial({ color: '#120c06', roughness: 0.4 });
const alaMat = new THREE.MeshPhysicalMaterial({ color: '#e8f2ff', roughness: 0.1, transparent: true, opacity: 0.38, side: THREE.DoubleSide, iridescence: 1, iridescenceIOR: 1.3 });
const alaGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.05, 0.08, 0.32, 0.1, 0.36, 0.02);
  s.bezierCurveTo(0.3, -0.06, 0.08, -0.05, 0, 0);
  return new THREE.ShapeGeometry(s, 12);
})();

export const Abeja: React.FC<{ position: THREE.Vector3; mira: THREE.Vector3; t: number; escala?: number }> = ({ position, mira, t, escala = 0.22 }) => {
  const aleteo = Math.sin(t * Math.PI * 2 * 11.3) * 0.7;
  const rot = useMemo(() => new THREE.Euler(), []);
  const m = new THREE.Matrix4().lookAt(position, mira, new THREE.Vector3(0, 1, 0));
  rot.setFromRotationMatrix(m);
  return (
    <group position={position} rotation={rot} scale={escala}>
      {/* el frente mira a -z */}
      <mesh material={abdomenMat} position={[0, 0, 0.26]} rotation={[Math.PI / 2 + 0.25, 0, 0]} scale={[0.15, 0.22, 0.14]}>
        <sphereGeometry args={[1, 20, 16]} />
      </mesh>
      <mesh material={toraxMat} position={[0, 0.02, 0.02]}>
        <sphereGeometry args={[0.12, 16, 12]} />
      </mesh>
      <mesh material={negroMat} position={[0, 0, -0.14]}>
        <sphereGeometry args={[0.085, 14, 10]} />
      </mesh>
      {[-1, 1].map((l) => (
        <group key={l}>
          <mesh material={negroMat} position={[l * 0.035, 0.07, -0.2]} rotation={[-0.9, 0, l * 0.4]}>
            <cylinderGeometry args={[0.006, 0.006, 0.14, 4]} />
          </mesh>
          <group position={[l * 0.06, 0.1, 0.02]} rotation={[0, l > 0 ? -0.35 : Math.PI + 0.35, l * aleteo]}>
            <mesh geometry={alaGeo} material={alaMat} rotation={[Math.PI / 2, 0, 0]} />
          </group>
          {[0, 1, 2].map((k) => (
            <mesh key={k} material={negroMat} position={[l * 0.08, -0.1, -0.04 + k * 0.08]} rotation={[0, 0, l * 0.7]}>
              <cylinderGeometry args={[0.007, 0.005, 0.16, 4]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

// ---------- pájaro (bienteveo: lomo café, pecho amarillo, antifaz) ----------
const lomoMat = new THREE.MeshStandardMaterial({ color: '#6b4a2b', roughness: 0.8 });
const pechoMat = new THREE.MeshStandardMaterial({ color: '#f2c511', roughness: 0.7 });
const blancoMat = new THREE.MeshStandardMaterial({ color: '#f4f0e6', roughness: 0.8 });
const picoMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.4 });
const alaPajaroGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.2, 0.12, 0.6, 0.12, 0.85, -0.05);
  s.lineTo(0.7, -0.1);
  s.lineTo(0.6, -0.04);
  s.lineTo(0.45, -0.14);
  s.lineTo(0.3, -0.12);
  s.bezierCurveTo(0.15, -0.14, 0.05, -0.12, 0, -0.1);
  return new THREE.ShapeGeometry(s, 10);
})();
const alaPajaroMat = new THREE.MeshStandardMaterial({ color: '#5a3d22', roughness: 0.8, side: THREE.DoubleSide });

export const Pajaro: React.FC<{ position: THREE.Vector3; rumbo: THREE.Vector3; t: number; escala?: number; fase?: number; posado?: boolean }> = ({ position, rumbo, t, escala = 0.35, fase = 0, posado }) => {
  const a = posado ? -1.2 : Math.sin(t * Math.PI * 2 * 3.4 + fase) * 0.9;
  const m = new THREE.Matrix4().lookAt(position, position.clone().add(rumbo), new THREE.Vector3(0, 1, 0));
  const rot = new THREE.Euler().setFromRotationMatrix(m);
  return (
    <group position={position} rotation={rot} scale={escala}>
      <mesh material={lomoMat} scale={[0.16, 0.15, 0.32]}>
        <sphereGeometry args={[1, 18, 14]} />
      </mesh>
      <mesh material={pechoMat} position={[0, -0.05, -0.03]} scale={[0.145, 0.12, 0.27]}>
        <sphereGeometry args={[1, 18, 14]} />
      </mesh>
      <mesh material={lomoMat} position={[0, 0.07, -0.32]}>
        <sphereGeometry args={[0.12, 16, 12]} />
      </mesh>
      <mesh material={blancoMat} position={[0, 0.1, -0.36]} scale={[1.02, 0.35, 0.9]}>
        <sphereGeometry args={[0.12, 16, 8]} />
      </mesh>
      <mesh material={picoMat} position={[0, 0.06, -0.48]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.035, 0.14, 8]} />
      </mesh>
      <mesh material={lomoMat} position={[0, 0.02, 0.4]} rotation={[0.15, 0, 0]} scale={[0.12, 0.02, 0.22]}>
        <boxGeometry args={[1, 1, 1]} />
      </mesh>
      {[-1, 1].map((l) => (
        <group key={l} position={[l * 0.1, 0.06, -0.05]} rotation={[0, 0, l * a]}>
          <mesh geometry={alaPajaroGeo} material={alaPajaroMat} rotation={[Math.PI / 2, 0, l > 0 ? 0 : Math.PI]} scale={[l > 0 ? 1 : 1, 1, 1]} />
        </group>
      ))}
    </group>
  );
};

// ---------- fruto que crece: de verde chiquito a rojo maduro ----------
const pelitoCurvo = (() => {
  const curva = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.3, 0.02), new THREE.Vector3(0.12, 0.5, 0.05));
  const g = new THREE.TubeGeometry(curva, 6, 0.045, 4, false);
  // afinar hacia la punta
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const k = 1 - Math.min(1, y / 0.55) * 0.75;
    const c = curva.getPoint(Math.min(1, y / 0.5));
    pos.setX(i, c.x + (pos.getX(i) - c.x) * k);
    pos.setZ(i, c.z + (pos.getZ(i) - c.z) * k);
  }
  g.computeVertexNormals();
  return g;
})();
const fibo = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / n;
    const r = Math.sqrt(1 - y * y);
    const a = i * AUREO;
    return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
  });

export const colorMadurez = (k: number) => {
  // verde → amarillo → naranja → rojo
  const paradas = ['#6f9e2c', '#a9b832', '#e3b62c', '#e2632a', '#c81e2c'];
  const x = clamp01(k) * (paradas.length - 1);
  const i = Math.min(paradas.length - 2, Math.floor(x));
  return new THREE.Color(paradas[i]).lerp(new THREE.Color(paradas[i + 1]), x - i);
};

export const Frutitos: React.FC<{ lugares: Lugar[]; crecer: number; madurar: number; pelos?: number; radio?: number }> = ({ lugares, crecer, madurar, pelos = 230, radio = 0.12 }) => {
  const { piel, pelo, mats } = useMemo(() => {
    const pielMat = new THREE.MeshStandardMaterial({ color: '#6f9e2c', roughness: 0.5 });
    const peloMat = new THREE.MeshStandardMaterial({ color: '#7fae3a', roughness: 0.55 });
    const p = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 28, 20), pielMat, lugares.length);
    const h = new THREE.InstancedMesh(pelitoCurvo, peloMat, lugares.length * pelos);
    return { piel: p, pelo: h, mats: { pielMat, peloMat } };
  }, [lugares.length, pelos]);
  const dirs = useMemo(() => fibo(pelos), [pelos]);
  const col = colorMadurez(madurar);
  mats.pielMat.color.copy(col).multiplyScalar(0.85);
  mats.peloMat.color.copy(col).lerp(new THREE.Color('#b8cf4a'), 0.12 * (1 - madurar) + 0.05);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  lugares.forEach((l, i) => {
    const g = suave(crecer, l.orden * 0.3, l.orden * 0.3 + 0.7);
    const r = radio * (0.08 + 0.92 * g);
    const c = l.p.clone().add(new THREE.Vector3(0, -r * 0.9, 0));
    m4.compose(c, new THREE.Quaternion(), new THREE.Vector3(r, r * 1.12, r));
    piel.setMatrixAt(i, m4);
    const largo = 0.25 + 0.75 * g;
    dirs.forEach((d, j) => {
      q.setFromUnitVectors(up, d);
      q.multiply(new THREE.Quaternion().setFromAxisAngle(up, j * 2.39));
      const p = c.clone().add(d.clone().multiplyScalar(r * 0.97));
      const s = r * largo;
      m4.compose(p, q, new THREE.Vector3(r * 0.9, s, r * 0.9));
      pelo.setMatrixAt(i * pelos + j, m4);
    });
  });
  piel.instanceMatrix.needsUpdate = true;
  pelo.instanceMatrix.needsUpdate = true;
  return (
    <>
      <primitive object={piel} />
      <primitive object={pelo} />
    </>
  );
};

// ---------- polen / luciérnagas ----------
export const Chispas: React.FC<{ n?: number; centro: THREE.Vector3; radio: number; t: number; color?: string; fuerza: number; tam?: number }> = ({ n = 60, centro, radio, t, color = '#fff2a0', fuerza, tam = 0.012 }) => {
  const im = useMemo(() => new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }), n), [n, color]);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const a = i * AUREO + t * (0.2 + rnd(i) * 0.3);
    const y = (rnd(i * 3) - 0.5) * radio * 1.4 + Math.sin(t * 0.8 + i) * 0.05;
    const r = radio * Math.sqrt(rnd(i * 5));
    const p = new THREE.Vector3(centro.x + Math.cos(a) * r, centro.y + y, centro.z + Math.sin(a) * r);
    const s = tam * fuerza * (0.5 + 0.5 * Math.sin(t * 3 + i * 1.7));
    m4.compose(p, new THREE.Quaternion(), new THREE.Vector3(s, s, s));
    im.setMatrixAt(i, m4);
  }
  im.instanceMatrix.needsUpdate = true;
  return <primitive object={im} />;
};
