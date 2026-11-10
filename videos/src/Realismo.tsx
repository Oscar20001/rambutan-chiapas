import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
const AUREO = Math.PI * (3 - Math.sqrt(5));
const rnd = (s: number) => {
  const x = Math.sin(s * 91.7 + 3.1) * 43758.5453;
  return x - Math.floor(x);
};

// Piezas para que las escenas se vean reales: viento en hojas y pasto, sombras del sol,
// nubes de volumen, lluvia con salpicaduras, suelo con textura y destello del sol.

// ---------- viento ----------
// Un solo reloj para todos los materiales con viento; cada video lo mueve con <Viento t={t} />.
const reloj = { value: 0 };
export const relojViento = reloj;
export const Viento: React.FC<{ t: number }> = ({ t }) => {
  reloj.value = t;
  return null;
};

// Parchea el material: los vértices se mecen según su altura y la posición de cada instancia
// (así cada hoja o cada brizna se mueve a destiempo, como en una ráfaga real).
export const conViento = <M extends THREE.Material>(mat: M, amp: number, modo: 'hoja' | 'pasto', vel = 1.6): M => {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTiempo = reloj;
    sh.vertexShader =
      'uniform float uTiempo;\n' +
      sh.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec3 ipos = vec3(0.0);
        #ifdef USE_INSTANCING
          ipos = vec3(instanceMatrix[3]);
        #endif
        float fase = uTiempo * ${vel.toFixed(3)} + ipos.x * 0.37 + ipos.z * 0.29 + ipos.y * 0.21;
        ${
          modo === 'pasto'
            ? `float racha = 0.6 + 0.4 * sin(uTiempo * 0.9 - ipos.x * 0.18 - ipos.z * 0.11);
               float kk = position.y * position.y;
               transformed.x += (sin(fase) * 0.55 + sin(fase * 2.3) * 0.2 + 0.45) * kk * ${amp.toFixed(4)} * racha;
               transformed.z += cos(fase * 0.8) * 0.35 * kk * ${amp.toFixed(4)} * racha;`
            : `float kk = position.y;
               transformed += vec3(sin(fase * 2.1), sin(fase * 2.7 + 1.3) * 0.6, cos(fase * 1.7)) * kk * ${amp.toFixed(4)};`
        }`,
      );
  };
  mat.customProgramCacheKey = () => `viento-${modo}-${amp}-${vel}`;
  mat.needsUpdate = true;
  return mat;
};

// ---------- sombras ----------
// Marca todas las mallas para que proyecten y reciban sombra (las que tengan userData.sinSombra no).
export const Sombras: React.FC = () => {
  const scene = useThree((s) => s.scene);
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && !o.userData.sinSombra) {
      m.castShadow = !o.userData.noProyecta;
      m.receiveShadow = true;
    }
  });
  return null;
};

// Sol con sombra suave. "caja" es la mitad del área que cubre la sombra.
export const LuzSol: React.FC<{ position: [number, number, number]; color: string; intensity: number; caja?: number; mira?: [number, number, number]; mapa?: number }> = ({
  position,
  color,
  intensity,
  caja = 14,
  mira = [0, 0, 0],
  mapa = 2048,
}) => {
  const luz = useMemo(() => new THREE.DirectionalLight(), []);
  luz.position.set(position[0] + mira[0], position[1] + mira[1], position[2] + mira[2]);
  luz.target.position.set(...mira);
  luz.target.updateMatrixWorld();
  luz.color.set(color);
  luz.intensity = intensity;
  luz.castShadow = true;
  luz.shadow.mapSize.set(mapa, mapa);
  const c = luz.shadow.camera as THREE.OrthographicCamera;
  c.left = -caja;
  c.right = caja;
  c.top = caja;
  c.bottom = -caja;
  c.near = 0.5;
  c.far = Math.hypot(...position) * 2 + caja * 2;
  c.updateProjectionMatrix();
  luz.shadow.bias = -0.0004;
  luz.shadow.normalBias = 0.03;
  luz.shadow.radius = 4;
  return (
    <>
      <primitive object={luz} />
      <primitive object={luz.target} />
    </>
  );
};

// ---------- texturas hechas a mano (canvas) ----------
const lienzo = (n: number, pinta: (g: CanvasRenderingContext2D, n: number) => void, rep = 1) => {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  pinta(c.getContext('2d')!, n);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rep, rep);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

// suelo de huerta: pasto con manchas de tierra y hojarasca
export const sueloTex = (rep = 20, seco = 0) =>
  lienzo(
    1024,
    (g, n) => {
      g.fillStyle = seco ? '#6d6a3a' : '#4d6e2a';
      g.fillRect(0, 0, n, n);
      for (let i = 0; i < 26000; i++) {
        const x = rnd(i) * n;
        const y = rnd(i * 1.7 + 3) * n;
        const r = 1 + rnd(i * 2.3) * 3.5;
        const k = rnd(i * 3.1);
        g.fillStyle = k < 0.07 ? 'rgba(110,80,45,.55)' : k < 0.12 ? 'rgba(150,120,60,.5)' : `hsla(${78 + rnd(i * 4.1) * 30},${40 + rnd(i * 5.3) * 25}%,${16 + rnd(i * 6.7) * 22}%,.55)`;
        g.beginPath();
        g.ellipse(x, y, r, r * (0.3 + rnd(i * 7) * 0.5), rnd(i * 8) * 3.14, 0, Math.PI * 2);
        g.fill();
      }
    },
    rep,
  );

// relieve para el mismo suelo (bumpMap en gris)
export const relieveTex = (rep = 20) =>
  lienzo(
    512,
    (g, n) => {
      g.fillStyle = '#808080';
      g.fillRect(0, 0, n, n);
      for (let i = 0; i < 9000; i++) {
        const v = Math.floor(70 + rnd(i * 9.1) * 120);
        g.fillStyle = `rgba(${v},${v},${v},.5)`;
        g.beginPath();
        g.arc(rnd(i * 2.9) * n, rnd(i * 4.3) * n, 1 + rnd(i * 5.9) * 3, 0, Math.PI * 2);
        g.fill();
      }
    },
    rep,
  );

// mancha suave para nubes, humo y bokeh
const nubeTex = (() => {
  if (typeof document === 'undefined') return null;
  return lienzo(256, (g, n) => {
    for (let i = 0; i < 70; i++) {
      const a = rnd(i * 3.3) * Math.PI * 2;
      const d = Math.sqrt(rnd(i * 5.1)) * n * 0.26;
      const x = n / 2 + Math.cos(a) * d;
      const y = n / 2 + Math.sin(a) * d * 0.7;
      const r = n * (0.08 + rnd(i * 7.7) * 0.14);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,.22)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, n, n);
    }
  });
})();

// ---------- pasto ----------
const briznaGeo = (() => {
  const g = new THREE.PlaneGeometry(0.05, 1, 1, 5);
  g.translate(0, 0.5, 0);
  const p = g.attributes.position;
  const col: number[] = [];
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    p.setX(i, p.getX(i) * (1 - y * 0.92));
    p.setZ(i, y * y * 0.18);
    const c = new THREE.Color('#203a12').lerp(new THREE.Color('#9fc25a'), Math.pow(y, 0.8));
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
})();

// Pasto de briznas que se mecen con el viento. Las briznas se achican hacia la orilla para que no se vea el corte.
export const Pasto: React.FC<{ n?: number; radio?: number; alto?: number; ancho?: number; centro?: [number, number, number]; viento?: number; tono?: number; hueco?: number }> = ({
  n = 30000,
  radio = 12,
  alto = 0.35,
  ancho = 1,
  centro = [0, 0, 0],
  viento = 0.25,
  tono = 0,
  hueco = 0,
}) => {
  const malla = useMemo(() => {
    const mat = conViento(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }), viento, 'pasto', 1.3);
    const m = new THREE.InstancedMesh(briznaGeo, mat, n);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    for (let i = 0; i < n; i++) {
      const r = hueco + (radio - hueco) * Math.sqrt(rnd(i * 1.13 + 0.5));
      const a = i * AUREO + rnd(i * 2.7) * 0.3;
      const borde = 1 - Math.pow(Math.max(0, (r - radio * 0.7) / (radio * 0.3)), 1.5);
      const h = alto * (0.55 + rnd(i * 3.9) * 0.8) * Math.max(0.15, borde);
      e.set((rnd(i * 4.4) - 0.5) * 0.5, rnd(i * 5.2) * Math.PI * 2, (rnd(i * 6.1) - 0.5) * 0.5);
      q.setFromEuler(e);
      m4.compose(new THREE.Vector3(centro[0] + Math.cos(a) * r, centro[1], centro[2] + Math.sin(a) * r), q, new THREE.Vector3(ancho * (0.7 + rnd(i * 7.3) * 0.8), h, ancho));
      m.setMatrixAt(i, m4);
      const c = new THREE.Color().setHSL(0.23 + rnd(i * 8.8) * 0.07 - tono * 0.08, 0.45 + rnd(i * 9.4) * 0.2, 0.42 + rnd(i * 10.6) * 0.2 + tono * 0.1);
      m.setColorAt(i, c);
    }
    m.userData.noProyecta = true;
    return m;
  }, [n, radio, alto, ancho, centro[0], centro[1], centro[2], viento, tono, hueco]);
  return <primitive object={malla} />;
};

// Suelo grande con textura y relieve
const orillaTex = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(128, 128, 60, 128, 128, 128);
  gr.addColorStop(0, '#fff');
  gr.addColorStop(1, '#000');
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
})();
export const SueloReal: React.FC<{ radio?: number; rep?: number; y?: number; color?: string; oscuro?: number; orilla?: boolean }> = ({ radio = 160, rep = 40, y = 0, color = '#ffffff', oscuro = 0, orilla = false }) => {
  const [map, bump] = useMemo(() => [sueloTex(rep), relieveTex(rep)], [rep]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} userData={{ noProyecta: true }}>
      <circleGeometry args={[radio, 96]} />
      <meshStandardMaterial map={map} bumpMap={bump} bumpScale={0.6} roughness={0.96} color={new THREE.Color(color).lerp(new THREE.Color('#000'), oscuro)} alphaMap={orilla ? orillaTex ?? undefined : undefined} transparent={orilla} depthWrite={!orilla} />
    </mesh>
  );
};

// ---------- nubes de volumen ----------
// Cada nube es un grupo de manchas suaves; la parte de abajo más gris, como las nubes de verdad.
export const Nubes: React.FC<{ t: number; n?: number; altura?: number; dist?: number; ancho?: number; arriba?: string; abajo?: string; opacidad?: number; vel?: number; tam?: number }> = ({
  t,
  n = 9,
  altura = 45,
  dist = 140,
  ancho = 260,
  arriba = '#ffffff',
  abajo = '#aeb8c8',
  opacidad = 0.95,
  vel = 0.8,
  tam = 1,
}) => {
  const piezas = useMemo(() => {
    const l: { x: number; y: number; z: number; s: number; k: number; nube: number }[] = [];
    for (let c = 0; c < n; c++) {
      const cx = (rnd(c * 3.7) - 0.5) * ancho;
      const cz = -dist - rnd(c * 5.3) * dist * 0.6;
      const cy = altura + rnd(c * 2.2) * altura * 0.35;
      const s = (18 + rnd(c * 9.1) * 22) * tam;
      for (let j = 0; j < 12; j++) {
        const a = j * AUREO;
        const r = Math.sqrt(j / 12) * s * 0.9;
        const y = Math.abs(Math.sin(a)) * s * 0.28 * (1 - j / 14);
        l.push({ x: cx + Math.cos(a) * r, y: cy + y, z: cz + Math.sin(a) * r * 0.3, s: s * (0.55 + rnd(c * 13 + j) * 0.45), k: Math.min(1, y / (s * 0.25)), nube: c });
      }
    }
    return l;
  }, [n, altura, dist, ancho, tam]);
  if (!nubeTex) return null;
  const A = new THREE.Color(arriba);
  const B = new THREE.Color(abajo);
  return (
    <group>
      {piezas.map((p, i) => (
        <sprite key={i} position={[p.x + t * vel * (1 + (p.nube % 3) * 0.3), p.y, p.z]} scale={[p.s * 1.6, p.s, 1]}>
          <spriteMaterial map={nubeTex} color={B.clone().lerp(A, 0.35 + p.k * 0.65)} transparent opacity={opacidad} depthWrite={false} fog={false} />
        </sprite>
      ))}
    </group>
  );
};

// ---------- lluvia ----------
const gotaGeo = new THREE.BoxGeometry(0.012, 0.55, 0.012);
const salpicaGeo = new THREE.RingGeometry(0.6, 1, 20);
export const Lluvia: React.FC<{ t: number; fuerza: number; centro?: THREE.Vector3; radio?: number; alto?: number; n?: number; suelo?: number }> = ({
  t,
  fuerza,
  centro = new THREE.Vector3(0, 0, 0),
  radio = 18,
  alto = 16,
  n = 4000,
  suelo = 0,
}) => {
  const { gotas, salp } = useMemo(() => {
    const gotas = new THREE.InstancedMesh(gotaGeo, new THREE.MeshBasicMaterial({ color: '#dfe8f5', transparent: true, opacity: 0.5, depthWrite: false }), n);
    const salp = new THREE.InstancedMesh(salpicaGeo, new THREE.MeshBasicMaterial({ color: '#e8f0ff', transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }), 400);
    gotas.userData.sinSombra = true;
    salp.userData.sinSombra = true;
    gotas.frustumCulled = false;
    salp.frustumCulled = false;
    return { gotas, salp };
  }, [n]);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.12));
  const visibles = Math.floor(n * Math.min(1, fuerza));
  for (let i = 0; i < n; i++) {
    if (i >= visibles) {
      m4.makeScale(0, 0, 0);
      gotas.setMatrixAt(i, m4);
      continue;
    }
    const vel = 14 + rnd(i * 3.1) * 4;
    const y = alto - ((t * vel + rnd(i * 1.9) * alto) % alto);
    m4.compose(new THREE.Vector3(centro.x + (rnd(i) - 0.5) * radio * 2 - y * 0.12, suelo + y, centro.z + (rnd(i * 2.3) - 0.5) * radio * 2), q, new THREE.Vector3(1, 1 + rnd(i * 4.7), 1));
    gotas.setMatrixAt(i, m4);
  }
  const qs = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  for (let i = 0; i < 400; i++) {
    const per = 0.45;
    const f = ((t + rnd(i * 6.1) * per) % per) / per;
    const s = i < 400 * Math.min(1, fuerza) ? 0.03 + f * 0.16 : 0;
    m4.compose(new THREE.Vector3(centro.x + (rnd(i * 7.7) - 0.5) * radio * 1.6, suelo + 0.02, centro.z + (rnd(i * 8.3) - 0.5) * radio * 1.6), qs, new THREE.Vector3(s, s, s));
    salp.setMatrixAt(i, m4);
  }
  gotas.instanceMatrix.needsUpdate = true;
  salp.instanceMatrix.needsUpdate = true;
  (gotas.material as THREE.MeshBasicMaterial).opacity = 0.45 * Math.min(1, fuerza);
  (salp.material as THREE.MeshBasicMaterial).opacity = 0.35 * Math.min(1, fuerza);
  return (
    <>
      <primitive object={gotas} />
      <primitive object={salp} />
    </>
  );
};

// ---------- destello del sol (2D, encima del video) ----------
// Reflejos hexagonales en la línea sol→centro, como los de un lente real (y discretamente, la geometría del hexágono).
export const Destello: React.FC<{ x: number; y: number; w: number; h: number; fuerza: number; color?: string }> = ({ x, y, w, h, fuerza, color = '#fff2cc' }) => {
  if (fuerza <= 0.01) return null;
  const cx = w / 2;
  const cy = h / 2;
  const m = Math.min(w, h);
  const ghosts = [0.35, 0.62, 1.0, 1.38, 1.62];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen', opacity: fuerza }}>
      <div style={{ position: 'absolute', left: x - m * 0.6, top: y - m * 0.6, width: m * 1.2, height: m * 1.2, borderRadius: '50%', background: `radial-gradient(circle, ${color} 0%, ${color}66 8%, ${color}22 25%, transparent 60%)` }} />
      <div style={{ position: 'absolute', left: x - m * 0.9, top: y - m * 0.004, width: m * 1.8, height: m * 0.008, background: `linear-gradient(90deg, transparent, ${color}88, transparent)`, filter: `blur(${m * 0.002}px)` }} />
      {ghosts.map((k, i) => {
        const gx = x + (cx - x) * k;
        const gy = y + (cy - y) * k;
        const r = m * (0.02 + (i % 3) * 0.025);
        return (
          <svg key={i} width={r * 2} height={r * 2} style={{ position: 'absolute', left: gx - r, top: gy - r, opacity: 0.18 + (i % 2) * 0.1 }}>
            <polygon points={Array.from({ length: 6 }, (_, j) => `${r + Math.cos((j * Math.PI) / 3) * r},${r + Math.sin((j * Math.PI) / 3) * r}`).join(' ')} fill={i % 2 ? '#9fd8ff' : color} opacity={0.5} />
          </svg>
        );
      })}
    </div>
  );
};

// Cielo de tormenta para mezclar con cualquier cielo (k = cuánto llueve)
export const nublar = <C extends { arriba: string; medio: string; abajo: string; luz: string; amb: string; sol: string; bokeh: string[] }>(c: C, k: number): C => {
  const g = (a: string, b: string) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();
  return { ...c, arriba: g(c.arriba, '#3b4350'), medio: g(c.medio, '#6b7482'), abajo: g(c.abajo, '#9aa2ac'), luz: g(c.luz, '#aeb6c2'), amb: g(c.amb, '#7a8494'), sol: g(c.sol, '#9aa2ac') };
};

// Tierra despejada bajo el árbol (como en las huertas limpias), con hojarasca y orilla difuminada
const tierraTex = (() => {
  if (typeof document === 'undefined') return null;
  const n = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(n / 2, n / 2, n * 0.25, n / 2, n / 2, n / 2);
  gr.addColorStop(0, 'rgba(92,70,46,1)');
  gr.addColorStop(0.75, 'rgba(92,70,46,.85)');
  gr.addColorStop(1, 'rgba(92,70,46,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, n, n);
  for (let i = 0; i < 9000; i++) {
    const a = rnd(i * 1.3) * Math.PI * 2;
    const d = Math.sqrt(rnd(i * 2.9)) * n * 0.45;
    const x = n / 2 + Math.cos(a) * d;
    const y = n / 2 + Math.sin(a) * d;
    const k = rnd(i * 4.7);
    // hojas secas, hojas verdes caídas y granitos de tierra
    g.fillStyle = k < 0.25 ? `hsla(${28 + rnd(i) * 15},45%,${28 + rnd(i * 5) * 18}%,.8)` : k < 0.32 ? 'hsla(95,35%,22%,.8)' : `rgba(${60 + rnd(i * 7) * 50},${45 + rnd(i * 7) * 35},${30 + rnd(i * 7) * 20},.5)`;
    g.beginPath();
    if (k < 0.32) g.ellipse(x, y, 5 + rnd(i * 9) * 7, 2 + rnd(i * 11) * 2.5, rnd(i * 13) * 3.14, 0, Math.PI * 2);
    else g.arc(x, y, 0.8 + rnd(i * 17) * 2, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
})();
export const ManchaTierra: React.FC<{ radio: number; centro?: [number, number, number] }> = ({ radio, centro = [0, 0, 0] }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centro[0], centro[1] + 0.006, centro[2]]} userData={{ noProyecta: true }}>
    <circleGeometry args={[radio, 64]} />
    <meshStandardMaterial map={tierraTex ?? undefined} transparent roughness={1} depthWrite={false} />
  </mesh>
);
