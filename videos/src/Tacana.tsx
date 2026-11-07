import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Tiempos, TITULO, TEXTO, avance, cuando } from './comun';
import { CierreSerie, useFormato } from './marca';
import { Estudio } from './RambutanAbre';
import { ALTO_TACANA } from './Croquis';
import { CamaraSerie, FondoCielo, cieloEntre, rnd, suave, AUREO } from './Naturaleza';
import { Lluvia, Nubes, nublar } from './Realismo';
import { selvaTex } from './TierraVolcan';
import { TACANA_DEM } from './tacanaDem';
import { CHIAPAS } from './chiapasDatos';

// "Tacaná, la casa de fuego". Voz de Antonio, sin música, subtítulos palabra por palabra.
// Todo lo que dice la voz se ve: Chiapas en relieve (alturas reales), la placa de Cocos hundiéndose,
// la roca que se funde, el magma que sube, el volcán que crece capa por capa (corte), los 4,060 m,
// la frontera con las banderas, la erupción fuerte (~70 d.C.), la explosión de vapor de 1986,
// las fumarolas, la lluvia y los lodos volcánicos, y los frutales del Soconusco.
// Datos: Wikipedia es/en "Volcán Tacaná"; VolcanoDiscovery (fumarolas a 3,600 m).

const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const ORO = '#ffcf6b';
const CREMA = '#fff6e2';
const FUEGO = '#ff6a1a';

// ---------- texturas pintadas ----------
const lienzo = (w: number, h: number, pinta: (g: CanvasRenderingContext2D) => void) => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  pinta(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};
const humoTex = lienzo(128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.4, 'rgba(255,255,255,0.55)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
});
// etiqueta 3D: píldora oscura con letras claras
const etiqueta = (texto: string, color = CREMA, fondo = 'rgba(10,12,18,0.78)', borde = ORO) =>
  lienzo(1024, 200, (g) => {
    g.font = `120px "${TITULO}"`;
    const ancho = Math.min(1000, g.measureText(texto).width + 110);
    const x0 = (1024 - ancho) / 2;
    g.fillStyle = fondo;
    g.strokeStyle = borde;
    g.lineWidth = 8;
    g.beginPath();
    g.roundRect(x0, 30, ancho, 140, 70);
    g.fill();
    g.stroke();
    g.fillStyle = color;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(texto, 512, 106);
  });
const bandera = (cual: 'mx' | 'gt') =>
  lienzo(420, 260, (g) => {
    if (cual === 'mx') {
      ['#006847', '#ffffff', '#ce1126'].forEach((c, i) => {
        g.fillStyle = c;
        g.fillRect(i * 140, 0, 140, 260);
      });
      // escudo simplificado: águila sobre nopal
      g.fillStyle = '#8a5a2a';
      g.beginPath();
      g.ellipse(210, 130, 34, 40, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#3f7a2a';
      g.fillRect(196, 160, 28, 22);
    } else {
      ['#4997d0', '#ffffff', '#4997d0'].forEach((c, i) => {
        g.fillStyle = c;
        g.fillRect(i * 140, 0, 140, 260);
      });
      g.strokeStyle = '#3f7a2a';
      g.lineWidth = 9;
      g.beginPath();
      g.arc(210, 130, 40, 0.3, Math.PI - 0.3);
      g.stroke();
      g.fillStyle = '#e8d8a0';
      g.fillRect(190, 108, 40, 34);
    }
  });
const capaTex = lienzo(512, 512, (g) => {
  // manto: rojo profundo abajo, naranja arriba, con corrientes de convección
  const r = g.createLinearGradient(0, 0, 0, 512);
  r.addColorStop(0, '#5a200e');
  r.addColorStop(0.5, '#9a3412');
  r.addColorStop(1, '#e0561a');
  g.fillStyle = r;
  g.fillRect(0, 0, 512, 512);
  g.globalCompositeOperation = 'overlay';
  for (let i = 0; i < 60; i++) {
    const y0 = rnd(i * 5) * 512;
    g.strokeStyle = i % 2 ? 'rgba(255,190,90,0.25)' : 'rgba(40,0,0,0.3)';
    g.lineWidth = 4 + rnd(i * 7) * 14;
    g.beginPath();
    for (let x = 0; x <= 512; x += 16) g.lineTo(x, y0 + Math.sin(x * 0.012 + i) * 30 + Math.sin(x * 0.04 + i * 2) * 8);
    g.stroke();
  }
  g.globalCompositeOperation = 'source-over';
});
// roca con estratos y granos (corteza y losa del corte)
const estratos = (base: string[], grano: string, semilla: number) => {
  const t = lienzo(512, 512, (g) => {
    g.fillStyle = base[0];
    g.fillRect(0, 0, 512, 512);
    let y = 0;
    let k = 0;
    while (y < 512) {
      const alto = 10 + rnd(semilla + k * 3) * 40;
      g.fillStyle = base[k % base.length];
      g.globalAlpha = 0.55 + rnd(semilla + k * 5) * 0.45;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= 512; x += 32) g.lineTo(x, y + Math.sin(x * 0.02 + k) * 4);
      for (let x = 512; x >= 0; x -= 32) g.lineTo(x, y + alto + Math.sin(x * 0.017 + k * 2) * 5);
      g.fill();
      y += alto;
      k++;
    }
    g.globalAlpha = 1;
    for (let i = 0; i < 6000; i++) {
      g.fillStyle = i % 3 ? grano : 'rgba(0,0,0,0.25)';
      const r = 0.6 + rnd(semilla + i * 13) * 2.2;
      g.fillRect(rnd(semilla + i * 7) * 512, rnd(semilla + i * 11) * 512, r, r);
    }
  });
  if (t) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(0.18, 0.18);
  }
  return t;
};
if (capaTex) capaTex.wrapS = capaTex.wrapT = THREE.RepeatWrapping;
// lava que corre: franjas amarillas y naranjas que se desplazan
const lavaFlujoTex = lienzo(64, 512, (g) => {
  g.fillStyle = '#ff7a12';
  g.fillRect(0, 0, 64, 512);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = i % 3 ? 'rgba(255,220,120,0.8)' : 'rgba(150,30,0,0.7)';
    const y = rnd(i * 17) * 512;
    g.beginPath();
    g.ellipse(32 + (rnd(i * 5) - 0.5) * 30, y, 6 + rnd(i * 3) * 18, 10 + rnd(i * 7) * 40, 0, 0, Math.PI * 2);
    g.fill();
  }
});
if (lavaFlujoTex) lavaFlujoTex.wrapS = lavaFlujoTex.wrapT = THREE.RepeatWrapping;
const cortezaTex = estratos(['#7a5a3e', '#8a6a48', '#6a4c34', '#94744e', '#5e4430'], 'rgba(230,210,170,0.35)', 11);
const losaTex = estratos(['#353c46', '#3e4652', '#2c323a', '#46505c'], 'rgba(170,190,210,0.3)', 23);
const lavaTex = estratos(['#3a2a26', '#4a3028', '#2e2220'], 'rgba(255,120,60,0.25)', 37);
const cenizaTex = estratos(['#a09080', '#b4a490', '#8e8070'], 'rgba(255,255,255,0.3)', 41);
const brilloTex = lienzo(128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
});
const Brillo: React.FC<{ p: [number, number, number]; tam: number; color: string; o: number }> = ({ p, tam, color, o }) =>
  brilloTex && o > 0.01 ? (
    <sprite position={p} scale={[tam, tam, 1]}>
      <spriteMaterial map={brilloTex} color={color} transparent opacity={o} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  ) : null;

const Etiqueta: React.FC<{ tex: THREE.Texture | null; position: THREE.Vector3 | [number, number, number]; alto?: number; o: number }> = ({ tex, position, alto = 0.6, o }) =>
  tex && o > 0.01 ? (
    <sprite position={position} scale={[alto * 5.12 * (0.7 + 0.3 * o), alto * (0.7 + 0.3 * o), 1]} renderOrder={20}>
      <spriteMaterial map={tex} transparent opacity={o} depthTest={false} depthWrite={false} fog={false} toneMapped={false} />
    </sprite>
  ) : null;

// ---------- Chiapas en relieve (alturas reales) ----------
const MAPA_W = 12;
const MAPA_EXAG = 0.9; // 4,200 m = 0.9 unidades (exagerado como las maquetas en relieve)
const chiapas = (() => {
  if (typeof atob === 'undefined') return null;
  const { n, m } = CHIAPAS;
  const bin = atob(CHIAPAS.alt);
  const alt = new Uint16Array(n * m);
  for (let i = 0; i < n * m; i++) alt[i] = bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8);
  const mb = atob(CHIAPAS.mask);
  const dentro = (i: number) => ((mb.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1) === 1;
  const D = (MAPA_W * m) / n;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const tintes: [number, string][] = [
    [0, '#2f6a34'],
    [300, '#3f7d38'],
    [800, '#6f9443'],
    [1400, '#a9a457'],
    [2100, '#9b7b4c'],
    [3000, '#7a685a'],
    [3800, '#d9d3c9'],
  ];
  const tinte = (a: number) => {
    let i = 0;
    while (i < tintes.length - 2 && a > tintes[i + 1][0]) i++;
    const k = Math.min(1, Math.max(0, (a - tintes[i][0]) / (tintes[i + 1][0] - tintes[i][0])));
    return new THREE.Color(tintes[i][1]).lerp(new THREE.Color(tintes[i + 1][1]), k);
  };
  for (let r = 0; r < m; r++)
    for (let c = 0; c < n; c++) {
      const a = alt[r * n + c];
      pos.push((c / (n - 1) - 0.5) * MAPA_W, (a / 4200) * MAPA_EXAG, (r / (m - 1) - 0.5) * D);
      const t = tinte(a).multiplyScalar(0.9 + rnd(r * 977 + c) * 0.12);
      col.push(t.r, t.g, t.b);
    }
  for (let r = 0; r < m - 1; r++)
    for (let c = 0; c < n - 1; c++) {
      const i = r * n + c;
      const ok = dentro(i) || dentro(i + 1) || dentro(i + n) || dentro(i + n + 1);
      if (ok) idx.push(i, i + n, i + 1, i + 1, i + n, i + n + 1);
    }
  // los vértices de afuera se pegan a la orilla real del estado: así el borde queda liso, sin escalones
  const cont = CHIAPAS.contorno.map(([u, v]) => [(u - 0.5) * MAPA_W, (v - 0.5) * D] as [number, number]);
  const usados = new Set(idx);
  usados.forEach((i) => {
    if (dentro(i)) return;
    const x = pos[i * 3];
    const z = pos[i * 3 + 2];
    let mejor = Infinity;
    let bx = x;
    let bz = z;
    for (let j = 0; j < cont.length; j++) {
      const [ax, az] = cont[j];
      const [cx, cz] = cont[(j + 1) % cont.length];
      const dx = cx - ax;
      const dz = cz - az;
      const l2 = dx * dx + dz * dz || 1;
      const k = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
      const px = ax + dx * k;
      const pz = az + dz * k;
      const d = (px - x) ** 2 + (pz - z) ** 2;
      if (d < mejor) {
        mejor = d;
        bx = px;
        bz = pz;
      }
    }
    pos[i * 3] = bx;
    pos[i * 3 + 2] = bz;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // base de la maqueta (el grosor que se ve en los costados)
  const forma = new THREE.Shape(CHIAPAS.contorno.map(([u, v]) => new THREE.Vector2((u - 0.5) * MAPA_W, -(v - 0.5) * D)));
  const base = new THREE.ExtrudeGeometry(forma, { depth: 0.35, bevelEnabled: false });
  base.rotateX(-Math.PI / 2);
  base.translate(0, -0.352, 0);
  const altura = (u: number, v: number) => {
    const c = Math.round(u * (n - 1));
    const r = Math.round(v * (m - 1));
    return (alt[Math.min(m - 1, Math.max(0, r)) * n + Math.min(n - 1, Math.max(0, c))] / 4200) * MAPA_EXAG;
  };
  const punto = (uv: number[], sobre = 0) => P((uv[0] - 0.5) * MAPA_W, altura(uv[0], uv[1]) + sobre, (uv[1] - 0.5) * D);
  const dentroUV = (u: number, v: number) => dentro(Math.round(v * (m - 1)) * n + Math.round(u * (n - 1)));
  return { g, base, punto, D, dentroUV };
})();

const zonaSoconusco = (() => {
  if (!chiapas) return [] as THREE.Vector3[];
  const a = CHIAPAS.puntos.tuxtlaChico;
  const b = CHIAPAS.puntos.tapachula;
  const cx = (a[0] + b[0]) / 2;
  const cy = (a[1] + b[1]) / 2;
  const l: THREE.Vector3[] = [];
  for (let i = 0; i < 900 && l.length < 140; i++) {
    const ang = i * AUREO;
    const r = Math.sqrt(i / 900) * 0.11;
    const u = cx + Math.cos(ang) * r * 1.3;
    const v = cy + Math.sin(ang) * r;
    if (!chiapas.dentroUV(u, v)) continue;
    const p = chiapas.punto([u, v]);
    if (p.y < 0.004) continue;
    l.push(p);
  }
  return l;
})();
const ChiapasRelieve: React.FC<{ t: number; brilloSoconusco?: number }> = ({ t, brilloSoconusco = 0 }) => {
  if (!chiapas) return null;
  const tac = chiapas.punto(CHIAPAS.puntos.tacana);
  const soc = chiapas.punto(CHIAPAS.puntos.tuxtlaChico);
  return (
    <group>
      <mesh geometry={chiapas.g} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.9} flatShading={false} />
      </mesh>
      <mesh geometry={chiapas.base}>
        <meshStandardMaterial color="#3a2a1e" roughness={0.95} />
      </mesh>
      {/* el Pacífico alrededor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.36, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#123a5a" roughness={0.35} metalness={0.1} />
      </mesh>
      {/* pin del Tacaná, late como brasa */}
      <mesh position={tac.clone().add(P(0, 0.22, 0))} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.07, 0.3, 20]} />
        <meshBasicMaterial color={FUEGO} toneMapped={false} />
      </mesh>
      <mesh position={tac.clone().add(P(0, 0.05, 0))} scale={1 + Math.sin(t * 5) * 0.25}>
        <sphereGeometry args={[0.09, 20, 14]} />
        <meshBasicMaterial color="#ffb070" transparent opacity={0.5} toneMapped={false} />
      </mesh>
      {/* el Soconusco se ilumina de verde */}
      {brilloSoconusco > 0 &&
        zonaSoconusco.map((p, i) => <Brillo key={i} p={[p.x, p.y + 0.03, p.z]} tam={0.32} color="#8dff7a" o={0.16 * brilloSoconusco * (0.8 + Math.sin(t * 2 + i) * 0.2)} />)}
    </group>
  );
};

// árboles chiquitos que brotan en el Soconusco (cacao, café, mango, rambután)
const ESPECIES = [
  { nombre: 'CACAO', copa: '#2d5a26', fruto: '#b8742a', alto: 0.16 },
  { nombre: 'CAFÉ', copa: '#24502a', fruto: '#c0262e', alto: 0.1 },
  { nombre: 'MANGO', copa: '#1f4a22', fruto: '#e8b030', alto: 0.22 },
  { nombre: 'RAMBUTÁN', copa: '#2a5a2a', fruto: '#e8343f', alto: 0.19 },
];
const Arbolito: React.FC<{ p: THREE.Vector3; e: number; esp: (typeof ESPECIES)[number]; sem: number }> = ({ p, e, esp, sem }) => {
  if (e <= 0) return null;
  const s = Easing.out(Easing.back(2))(Math.min(1, e));
  return (
    <group position={p} scale={s} rotation={[0, sem * 6, 0]}>
      <mesh position={[0, esp.alto * 0.35, 0]}>
        <cylinderGeometry args={[0.008, 0.012, esp.alto * 0.7, 6]} />
        <meshStandardMaterial color="#5a3a22" roughness={0.9} />
      </mesh>
      <mesh position={[0, esp.alto * 0.8, 0]} scale={[1, 0.8, 1]}>
        <icosahedronGeometry args={[esp.alto * 0.42, 1]} />
        <meshStandardMaterial color={esp.copa} roughness={0.85} flatShading />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const a = i * AUREO + sem;
        return (
          <mesh key={i} position={[Math.cos(a) * esp.alto * 0.38, esp.alto * (0.62 + rnd(i + sem) * 0.3), Math.sin(a) * esp.alto * 0.38]}>
            <sphereGeometry args={[esp.alto * 0.07, 8, 6]} />
            <meshStandardMaterial color={esp.fruto} roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
};

// ---------- diorama: corte de la Tierra ----------
// x hacia el este, y arriba (0 = superficie), el corte está en z = 0 y la maqueta va hacia z < 0.
const FONDO_D = 6;
const extruir = (pts: [number, number][], prof = FONDO_D) => {
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), { depth: prof, bevelEnabled: false });
  g.translate(0, 0, -prof);
  return g;
};
const LOSA_ARRIBA: [number, number][] = [
  [-11, -1.2],
  [-3, -1.2],
  [0.5, -2.4],
  [3.5, -4.0],
  [6.5, -6.4],
  [9, -9.5],
];
const losaGeo = extruir([...LOSA_ARRIBA, ...LOSA_ARRIBA.slice().reverse().map(([x, y]) => [x - 0.35, y - 1.0] as [number, number])]);
const cortezaGeo = extruir([
  [-3, 0],
  [11, 0],
  [11, -2.9],
  [1.6, -2.9],
  [0.5, -2.4],
  [-3, -1.2],
]);
const mantoGeo = (() => {
  const g = new THREE.BoxGeometry(22, 9, FONDO_D);
  g.translate(0, -1.2 - 4.5, -FONDO_D / 2 - 0.03);
  return g;
})();
const aguaGeo = (() => {
  const g = new THREE.BoxGeometry(8, 1.2, FONDO_D);
  g.translate(-7, -0.6, -FONDO_D / 2);
  return g;
})();
const pastoDiorama = (() => {
  const g = new THREE.PlaneGeometry(14, FONDO_D, 1, 1);
  g.rotateX(-Math.PI / 2);
  g.translate(4, 0.002, -FONDO_D / 2);
  return g;
})();
// punto sobre la losa (0..1 a lo largo)
const curvaLosa = new THREE.CatmullRomCurve3(LOSA_ARRIBA.map(([x, y]) => P(x, y, 0.02)));

const VX = 4.5; // dónde nace el volcán
const R_V = 4.2;
const perfil = (h: number, r: number, n = 40) => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * r;
    let y = h * Math.pow(1 - x / r, 1.5);
    if (x < r * 0.07) y -= h * 0.06 * (1 - x / (r * 0.07)); // cráter
    pts.push(new THREE.Vector2(Math.max(0.001, x), Math.max(0, y)));
  }
  return pts.reverse();
};
const conoGeo = (() => {
  const g = new THREE.LatheGeometry(perfil(1, 1, 60), 72, Math.PI / 2, Math.PI);
  const pos = g.attributes.position;
  const col: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const m = Math.sin(Math.atan2(z, x) * 25) * 0.5 + 0.5;
    const c = y < 0.45 ? new THREE.Color('#2f5a2a').lerp(new THREE.Color('#5a6a34'), y / 0.45) : new THREE.Color('#5a6a34').lerp(new THREE.Color('#6e6258'), Math.min(1, (y - 0.45) / 0.3)).lerp(new THREE.Color('#9a9088'), Math.max(0, (y - 0.8) / 0.2));
    c.multiplyScalar(0.85 + m * 0.25);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
})();
// cara del corte: capas de lava y ceniza como cebolla
const CAPAS = 9;
const capaGeo = (k: number) => {
  const pts = perfil(1 - k * 0.085, 1 - k * 0.075, 30);
  const s = new THREE.Shape();
  s.moveTo(-pts[pts.length - 1].x, 0);
  pts.slice().reverse().forEach((p) => s.lineTo(-p.x, p.y));
  pts.forEach((p) => s.lineTo(p.x, p.y));
  s.lineTo(pts[pts.length - 1].x, 0);
  return new THREE.ShapeGeometry(s, 4);
};
const capasGeo = Array.from({ length: CAPAS }, (_, k) => capaGeo(k));

const Diorama: React.FC<{ t: number; fundir: number; subir: number; crece: number; erupcion: number; corte: number }> = ({ t, fundir, subir, crece, erupcion, corte }) => {
  // tamaño del volcán según cuántas capas ya se formaron
  const visibles = Math.min(CAPAS, Math.floor(crece * CAPAS + 0.0001));
  const exterior = CAPAS - visibles; // índice de la capa más grande que ya existe
  const esc = crece <= 0 ? 0 : 1 - exterior * 0.075;
  const altoV = crece <= 0 ? 0 : (1 - exterior * 0.085) * 3.6;
  const anchoV = esc * R_V;
  const camara = P(VX, -2.0, 0.015);
  // flechitas que bajan sobre la losa: la placa se hunde
  const flechas = Array.from({ length: 6 }, (_, i) => {
    const u = ((t * 0.06 + i / 6) % 1) * 0.85;
    const p = curvaLosa.getPointAt(u);
    const d = curvaLosa.getTangentAt(u);
    return { p, a: Math.atan2(d.y, d.x), o: Math.min(1, u * 8, (0.85 - u) * 8) };
  });
  // gotas de magma que nacen sobre la losa y suben por las grietas
  const gotas = Array.from({ length: 14 }, (_, i) => {
    const nace = i / 14;
    const vida = ((t * 0.18 + rnd(i) ) % 1);
    const x0 = 3.0 + rnd(i * 3) * 1.6;
    const y0 = -3.9 - rnd(i * 5) * 0.6;
    const k = subir > 0 ? vida : 0;
    const x = THREE.MathUtils.lerp(x0, VX + (rnd(i * 7) - 0.5) * 0.3, k);
    const y = THREE.MathUtils.lerp(y0, -2.1, k);
    return { x, y, r: 0.08 + rnd(i * 9) * 0.1, o: fundir > nace * 0.6 ? 1 : 0 };
  });
  const pulso = 0.8 + Math.sin(t * 4) * 0.2;
  // la placa de Cocos se desliza hacia abajo y el manto se mueve en corrientes
  if (losaTex) losaTex.offset.set(t * 0.06, -t * 0.045);
  if (capaTex) capaTex.offset.set(t * 0.02, Math.sin(t * 0.3) * 0.02);
  if (lavaFlujoTex) lavaFlujoTex.offset.set(0, -t * 0.9);
  // cada erupción baja lava por las laderas y deja una capa nueva
  const ciclo = (crece * CAPAS) % 1;
  const lavaLadera = crece > 0 && crece < 1 ? Math.min(1, ciclo * 1.6) : erupcion > 0 ? Math.min(1, ((t * 0.5) % 1) * 1.4) : 0;
  return (
    <group>
      <mesh geometry={mantoGeo}>
        <meshStandardMaterial map={capaTex} emissiveMap={capaTex} emissive="#ffffff" emissiveIntensity={0.7} roughness={0.9} />
      </mesh>
      <mesh geometry={losaGeo}>
        <meshStandardMaterial map={losaTex} roughness={0.8} />
      </mesh>
      <mesh geometry={cortezaGeo}>
        <meshStandardMaterial map={cortezaTex} roughness={0.95} />
      </mesh>
      <mesh geometry={pastoDiorama}>
        <meshStandardMaterial map={selvaTex} color="#7aa060" roughness={0.95} />
      </mesh>
      <mesh geometry={aguaGeo}>
        <meshPhysicalMaterial color="#1d6a9a" transparent opacity={0.72} roughness={0.15} transmission={0} />
      </mesh>
      {/* olas */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-7, 0.005 + Math.sin(t * 2) * 0.01, -FONDO_D / 2]}>
        <planeGeometry args={[8, FONDO_D]} />
        <meshStandardMaterial color="#4aa0d0" roughness={0.1} metalness={0.2} transparent opacity={0.6} />
      </mesh>
      {flechas.map((f, i) => (
        <mesh key={i} position={[f.p.x, f.p.y - 0.5, 0.03]} rotation={[0, 0, f.a - Math.PI / 2]}>
          <coneGeometry args={[0.16, 0.38, 3]} />
          <meshBasicMaterial color="#9fd8ff" transparent opacity={f.o * 0.9} toneMapped={false} />
        </mesh>
      ))}
      {/* zona donde la roca se funde, sobre la losa */}
      {fundir > 0 && (
        <mesh position={[3.8, -4.2, 0.025]} scale={[1.6 * fundir, 0.55 * fundir, 1]}>
          <circleGeometry args={[1, 40]} />
          <meshBasicMaterial color="#ff8a2a" transparent opacity={0.75 * pulso} toneMapped={false} />
        </mesh>
      )}
      {fundir > 0 && <Brillo p={[3.8, -4.2, 0.3]} tam={5 * fundir} color="#ff6a1a" o={0.8 * pulso} />}
      {gotas.map((g, i) =>
        g.o ? (
          <group key={i}>
            <mesh position={[g.x, g.y, 0.04]}>
              <circleGeometry args={[g.r, 20]} />
              <meshBasicMaterial color="#ffd27a" transparent opacity={0.95} toneMapped={false} />
            </mesh>
            <Brillo p={[g.x, g.y, 0.06]} tam={g.r * 7} color="#ff8a2a" o={0.7} />
          </group>
        ) : null,
      )}
      {subir > 0 && <Brillo p={[VX, -2.0, 0.08]} tam={3.2} color="#ff7a1a" o={0.9 * pulso * subir} />}
      {/* grietas y conducto */}
      {subir > 0 && (
        <>
          <mesh position={[VX, -2.0 + (subir * (2.0 + altoV)) / 2, 0.035]}>
            <planeGeometry args={[0.2, subir * (2.0 + altoV)]} />
            <meshBasicMaterial map={lavaFlujoTex} color="#ffffff" toneMapped={false} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => {
            const l = (t * 0.7 + i / 6) % 1;
            const y = -2.0 + l * subir * (2.0 + altoV);
            return <Brillo key={i} p={[VX, y, 0.09]} tam={0.6} color="#ffb040" o={0.6 * subir} />;
          })}
          <mesh position={camara} scale={[0.9, 0.35, 1]}>
            <circleGeometry args={[1, 40]} />
            <meshBasicMaterial color="#ff7a1a" transparent opacity={0.9 * pulso} toneMapped={false} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[VX + s * 0.5 * subir, -1.2, 0.034]} rotation={[0, 0, s * 0.5]}>
              <planeGeometry args={[0.05, 1.4 * subir]} />
              <meshBasicMaterial color="#ff9a2a" toneMapped={false} />
            </mesh>
          ))}
        </>
      )}
      {/* el volcán: mitad de atrás en 3D y el corte al frente */}
      {crece > 0 && (
        <group position={[VX, 0, 0]}>
          <mesh geometry={conoGeo} scale={[anchoV, altoV, anchoV]} castShadow receiveShadow>
            <meshStandardMaterial vertexColors roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
          {corte < 1 && (
            <mesh geometry={conoGeo} scale={[anchoV, altoV, anchoV]} rotation={[0, Math.PI, 0]}>
              <meshStandardMaterial vertexColors roughness={0.9} transparent opacity={1 - corte} />
            </mesh>
          )}
          {corte > 0 &&
            capasGeo.map((g, k) =>
              k >= exterior ? (
                <mesh key={k} geometry={g} position={[0, 0, 0.004 + (k - exterior) * 0.002]} scale={[R_V, 3.6, 1]}>
                  <meshStandardMaterial map={k % 2 ? cenizaTex : lavaTex} roughness={0.95} transparent opacity={corte} side={THREE.DoubleSide} />
                </mesh>
              ) : null,
            )}
        </group>
      )}
      {/* ríos de lava bajando por la mitad de atrás del cono */}
      {crece > 0 && lavaLadera > 0 &&
        [Math.PI * 0.62, Math.PI, Math.PI * 1.38].map((a, j) => {
          const pts = Array.from({ length: 20 }, (_, i) => {
            const u = (i / 19) * lavaLadera * 0.95;
            const r = 0.06 + u * anchoV;
            const y = altoV * Math.pow(1 - r / anchoV, 1.5) + 0.04;
            const aa = a + Math.sin(u * 7 + j) * 0.06;
            return P(VX + Math.cos(aa) * r, y, Math.sin(aa) * r);
          });
          const fin = pts[pts.length - 1];
          return (
            <group key={j}>
              <mesh>
                <tubeGeometry args={[new THREE.CatmullRomCurve3(pts), 40, 0.07, 6, false]} />
                <meshBasicMaterial map={lavaFlujoTex} toneMapped={false} />
              </mesh>
              <Brillo p={[fin.x, fin.y + 0.1, fin.z]} tam={1.1} color="#ff6a1a" o={0.8 * pulso} />
            </group>
          );
        })}
      {crece > 0 && (erupcion > 0 || (crece < 1 && ciclo < 0.7)) && (
        <>
          <Humo t={t} desde={P(VX, altoV + 0.1, -0.4)} n={22} color="#4a423c" sube={5} abre={1.2} vida={2.6} o={0.9} tam={1.6} viento={0.4} />
          <Brillo p={[VX, altoV + 0.2, 0]} tam={2.4} color="#ff5a12" o={0.7 * pulso} />
        </>
      )}
      {/* chorro de lava al reventar */}
      {erupcion > 0 && (
        <group position={[VX, altoV, -0.2]}>
          {Array.from({ length: 22 }, (_, i) => {
            const a = rnd(i) * Math.PI * 2;
            const v = 1 + rnd(i * 2) * 1.5;
            const l = ((t * 0.9 + rnd(i * 3)) % 1) * erupcion;
            return (
              <mesh key={i} position={[Math.cos(a) * v * l * 0.8, v * 2.2 * l - 3 * l * l, Math.sin(a) * v * l * 0.5]}>
                <sphereGeometry args={[0.07 + rnd(i * 4) * 0.06, 8, 6]} />
                <meshBasicMaterial color={i % 3 ? '#ff8a2a' : '#ffe08a'} toneMapped={false} />
              </mesh>
            );
          })}
          <pointLight color="#ff7a2a" intensity={30 * erupcion} distance={10} />
        </group>
      )}
    </group>
  );
};

// ---------- el Tacaná real (alturas del modelo de la serie) ----------
// relieve real (AWS Terrain Tiles z12): 18 km de lado = 22 unidades; 1 unidad ≈ 820 m, sin exagerar la altura
const DEM_L = 22;
const dem = (() => {
  const n = TACANA_DEM.n;
  const b = atob(TACANA_DEM.alt);
  const a = new Uint16Array(n * n);
  for (let i = 0; i < n * n; i++) a[i] = b.charCodeAt(i * 2) | (b.charCodeAt(i * 2 + 1) << 8);
  const max = a.reduce((m, v) => Math.max(m, v), 0);
  const base = 700;
  // las orillas bajan suave hasta la selva para que no se vea el corte de la maqueta
  const borde = (x: number, z: number) => {
    const r = Math.max(Math.abs(x), Math.abs(z)) / (DEM_L / 2);
    const rr = Math.hypot(x, z) / (DEM_L / 2);
    const k = Math.min(1, Math.max(0, (1 - Math.max(r, rr * 0.92)) / 0.3));
    return k * k * (3 - 2 * k);
  };
  const altura = (x: number, z: number) => {
    const fx = (x / DEM_L + 0.5) * (n - 1);
    const fz = (z / DEM_L + 0.5) * (n - 1);
    if (fx < 0 || fz < 0 || fx > n - 1 || fz > n - 1) return 0;
    const c = Math.min(n - 2, Math.floor(fx));
    const r = Math.min(n - 2, Math.floor(fz));
    const u = fx - c;
    const v = fz - r;
    const m = (rr: number, cc: number) => a[rr * n + cc];
    const hm = m(r, c) * (1 - u) * (1 - v) + m(r, c + 1) * u * (1 - v) + m(r + 1, c) * (1 - u) * v + m(r + 1, c + 1) * u * v;
    return (Math.max(0, hm - base) / (max - base)) * ALTO_TACANA * borde(x, z);
  };
  const g = new THREE.PlaneGeometry(DEM_L, DEM_L, n - 1, n - 1);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, altura(pos.getX(i), pos.getZ(i)));
  g.computeVertexNormals();
  const nor = g.attributes.normal;
  const col: number[] = [];
  const C = (h: string) => new THREE.Color(h);
  const selvaBaja = C('#2c4a22');
  const selvaAlta = C('#3a5a2c');
  const niebla = C('#4a6236');
  const pino = C('#46553a');
  const pasto = C('#7a7350');
  const roca = C('#5a514a');
  const cumbre = C('#7a7068');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = pos.getY(i);
    const k = y / ALTO_TACANA;
    const inc = 1 - nor.getY(i); // 0 plano, más = empinado
    const ruido = rnd(Math.floor(x * 9) * 131 + Math.floor(z * 9)) * 0.5 + (Math.sin(x * 7.3 + z * 2.1) * Math.cos(z * 6.1 - x * 1.7) * 0.5 + 0.5) * 0.5;
    let c = selvaBaja.clone().lerp(selvaAlta, Math.min(1, k / 0.35));
    if (k > 0.35) c = selvaAlta.clone().lerp(niebla, Math.min(1, (k - 0.35) / 0.2));
    if (k > 0.55) c = niebla.clone().lerp(pino, Math.min(1, (k - 0.55) / 0.15));
    if (k > 0.72) c = pino.clone().lerp(pasto, Math.min(1, (k - 0.72) / 0.1));
    if (k > 0.82) c = pasto.clone().lerp(roca, Math.min(1, (k - 0.82) / 0.08));
    if (k > 0.92) c = roca.clone().lerp(cumbre, Math.min(1, (k - 0.92) / 0.08));
    // laderas empinadas: roca y tierra expuesta
    c.lerp(roca, Math.min(0.55, Math.max(0, inc - 0.18) * 1.6) * (k > 0.25 ? 1 : 0.4));
    c.multiplyScalar(0.82 + ruido * 0.32);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return { g, altura };
})();
// textura fina de copas de árboles y piedras para que de cerca no se vea liso
const detalleTex = lienzo(512, 512, (g) => {
  g.fillStyle = '#d8d8d8';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const x = rnd(i) * 512;
    const y = rnd(i * 3 + 1) * 512;
    const r = 1 + rnd(i * 7 + 2) * 4;
    const l = 150 + Math.floor(rnd(i * 11 + 3) * 105);
    g.fillStyle = `rgb(${l},${l},${l})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
});
if (detalleTex) {
  detalleTex.wrapS = detalleTex.wrapT = THREE.RepeatWrapping;
  detalleTex.repeat.set(40, 40);
}
const alturaVolcan = dem.altura;
// cañadas reales: desde la cima se sigue la bajada más empinada del relieve (por ahí corre la lava y el lodo)
const rutas = Array.from({ length: 9 }, (_, j) => {
  const a = j * AUREO + 0.3;
  let x = Math.cos(a) * 0.35;
  let z = Math.sin(a) * 0.35;
  const l: THREE.Vector3[] = [P(x, alturaVolcan(x, z) + 0.03, z)];
  for (let i = 0; i < 140; i++) {
    const e = 0.05;
    const gx = alturaVolcan(x + e, z) - alturaVolcan(x - e, z);
    const gz = alturaVolcan(x, z + e) - alturaVolcan(x, z - e);
    const gl = Math.hypot(gx, gz) || 1;
    // baja por la pendiente, con un poco de empuje hacia afuera para no quedarse atorada
    const ox = x / (Math.hypot(x, z) || 1);
    const oz = z / (Math.hypot(x, z) || 1);
    x += (-gx / gl) * 0.06 + ox * 0.02;
    z += (-gz / gl) * 0.06 + oz * 0.02;
    if (Math.hypot(x, z) > 9.5) break;
    if (i % 2 === 0) l.push(P(x, alturaVolcan(x, z) + 0.04, z));
  }
  return l;
});
const RioLava: React.FC<{ pts: THREE.Vector3[]; avance: number; t: number; lodo?: boolean; grosor?: number }> = ({ pts, avance, t, lodo, grosor = 0.07 }) => {
  const n = Math.max(2, Math.floor(pts.length * Math.min(1, avance)));
  if (avance <= 0.01 || n < 2) return null;
  const tramo = pts.slice(0, n);
  const fin = tramo[tramo.length - 1];
  return (
    <group>
      <mesh>
        <tubeGeometry args={[new THREE.CatmullRomCurve3(tramo), Math.max(8, n * 2), grosor, 6, false]} />
        {lodo ? <meshStandardMaterial color="#5a4632" roughness={0.35} /> : <meshBasicMaterial map={lavaFlujoTex} toneMapped={false} />}
      </mesh>
      {!lodo && <Brillo p={[fin.x, fin.y + 0.15, fin.z]} tam={1.2} color="#ff5a12" o={0.75 + Math.sin(t * 6) * 0.15} />}
      {!lodo && <Humo t={t} desde={fin} n={5} color="#6a5a50" sube={1.2} abre={0.3} vida={2} o={0.6} tam={0.6} />}
    </group>
  );
};
// línea de frontera: de norte a sur por la cima (aproximada)
const fronteraPts = Array.from({ length: 160 }, (_, i) => {
  const z = -8 + (i / 159) * 16;
  const x = 0.04 + Math.sin(z * 0.5) * 0.25;
  return P(x, alturaVolcan(x, z) + 0.03, z);
});

const Humo: React.FC<{ t: number; desde: THREE.Vector3; n: number; color: string; sube: number; abre: number; vida: number; o: number; tam: number; viento?: number }> = ({ t, desde, n, color, sube, abre, vida, o, tam, viento = 0.3 }) => {
  if (!humoTex || o <= 0) return null;
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const l = ((t / vida + i / n + rnd(i) * 0.1) % 1);
        const a = rnd(i * 3) * Math.PI * 2;
        return (
          <sprite key={i} position={[desde.x + Math.cos(a) * abre * l + viento * l * sube, desde.y + sube * l, desde.z + Math.sin(a) * abre * l]} scale={[tam * (0.4 + l * 1.6), tam * (0.4 + l * 1.6), 1]}>
            <spriteMaterial map={humoTex} color={color} transparent opacity={o * Math.min(1, l * 6) * (1 - l)} depthWrite={false} rotation={rnd(i * 13) * 6 + l * (rnd(i) > 0.5 ? 1.2 : -1.2)} />
          </sprite>
        );
      })}
    </group>
  );
};

const Bandera: React.FC<{ tex: THREE.Texture | null; p: THREE.Vector3; t: number; fase: number }> = ({ tex, p, t, fase }) => {
  const geo = useMemo(() => new THREE.PlaneGeometry(0.9, 0.56, 16, 4), []);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + 0.45;
    pos.setZ(i, Math.sin(x * 6 - t * 6 + fase) * 0.06 * x);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return (
    <group position={p}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 1.2, 8]} />
        <meshStandardMaterial color="#d8d8d8" metalness={0.8} roughness={0.3} />
      </mesh>
      {tex && (
        <mesh geometry={geo} position={[0.45, 0.95, 0]}>
          <meshStandardMaterial map={tex} side={THREE.DoubleSide} roughness={0.7} />
        </mesh>
      )}
    </group>
  );
};

const VolcanReal: React.FC<{ t: number; brasa: number; frontera: number; nube: number; flujos: number; vapor: number; fumarolas: number; lodo: number }> = ({ t, brasa, frontera, nube, flujos, vapor, fumarolas, lodo }) => {
  const banderas = useMemo(() => ({ mx: bandera('mx'), gt: bandera('gt') }), []);
  const nFr = Math.floor(fronteraPts.length * frontera);
  const cima = P(0, ALTO_TACANA, 0);
  return (
    <group>
      <mesh geometry={dem.g} castShadow receiveShadow>
        <meshStandardMaterial vertexColors map={detalleTex} roughness={0.95} envMapIntensity={0.2} />
      </mesh>
      {/* la selva alrededor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[80, 64]} />
        <meshStandardMaterial map={selvaTex} color="#9ab080" roughness={0.95} />
      </mesh>
      {/* brasa en el cráter: está vivo */}
      {brasa > 0 && (
        <>
          <Brillo p={[0, ALTO_TACANA + 0.05, 0]} tam={1.1} color="#ff5a12" o={brasa * (0.55 + Math.sin(t * 5) * 0.2)} />
          <Humo t={t} desde={P(0, ALTO_TACANA, 0)} n={10} color="#d8d0c8" sube={1.4} abre={0.3} vida={3} o={brasa * 0.5} tam={0.6} viento={0.5} />
          <pointLight position={[0, ALTO_TACANA + 0.4, 0]} color="#ff6a1a" intensity={brasa * 25} distance={6} />
        </>
      )}
      {/* frontera México | Guatemala */}
      {frontera > 0 &&
        fronteraPts.slice(0, nFr).map((p, i) =>
          i % 3 === 0 ? (
            <mesh key={i} position={p}>
              <boxGeometry args={[0.05, 0.03, 0.09]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
          ) : null,
        )}
      {frontera > 0.6 && (
        <>
          <Bandera tex={banderas.mx} p={P(-1.6, alturaVolcan(-1.6, 0.8), 0.8)} t={t} fase={0} />
          <Bandera tex={banderas.gt} p={P(1.7, alturaVolcan(1.7, 0.6), 0.6)} t={t} fase={1.3} />
        </>
      )}
      {/* erupción fuerte: columna de ceniza y nubes de fuego bajando */}
      <Humo t={t} desde={cima} n={45} color="#4a403a" sube={8} abre={2} vida={3.5} o={nube} tam={2.8} viento={0.7} />
      {flujos > 0 &&
        Array.from({ length: 8 }, (_, j) => {
          const a = j * AUREO;
          return Array.from({ length: 6 }, (_, i) => {
            const l = ((t * 0.35 + i / 6 + j * 0.13) % 1) * flujos;
            const r = 0.4 + l * 7;
            const x = Math.cos(a) * r;
            const z = Math.sin(a) * r;
            return humoTex ? (
              <sprite key={`${j}-${i}`} position={[x, alturaVolcan(x, z) + 0.3, z]} scale={[0.9 + l * 1.6, 0.6 + l, 1]}>
                <spriteMaterial map={humoTex} color={l < 0.4 ? '#ffb070' : '#a06a50'} transparent opacity={0.85 * (1 - l)} depthWrite={false} toneMapped={false} />
              </sprite>
            ) : null;
          });
        })}
      {flujos > 0 && rutas.map((r, j) => <RioLava key={j} pts={r} avance={flujos * (0.6 + rnd(j * 3) * 0.4)} t={t + j} />)}
      {nube > 0 &&
        Array.from({ length: 40 }, (_, i) => {
          const l = (t * 0.8 + rnd(i)) % 1;
          const a = rnd(i * 5) * Math.PI * 2;
          const v = 1 + rnd(i * 7) * 2;
          return <Brillo key={i} p={[Math.cos(a) * v * l * 1.5, ALTO_TACANA + v * 2.2 * l - 3.2 * l * l, Math.sin(a) * v * l * 1.5]} tam={0.25} color={i % 3 ? '#ff8a2a' : '#ffe08a'} o={nube * (1 - l)} />;
        })}
      {nube > 0 && <Brillo p={[0, ALTO_TACANA + 0.3, 0]} tam={3.5} color="#ff4a0a" o={nube * (0.7 + Math.sin(t * 7) * 0.15)} />}
      {nube > 0 && <pointLight position={[0, ALTO_TACANA + 1, 0]} color="#ff5a1a" intensity={nube * 40} distance={14} />}
      {/* 1986: explosión de vapor en el flanco noroeste, a 3,800 m */}
      <Humo t={t} desde={P(-0.25, ALTO_TACANA * 0.93, -0.3)} n={14} color="#f2f2f2" sube={1.6} abre={0.5} vida={2.2} o={vapor} tam={0.8} />
      {/* fumarolas a 3,600 m */}
      {[0, 1, 2].map((i) => (
        <Humo key={i} t={t + i * 0.7} desde={P(-0.6 + i * 0.25, ALTO_TACANA * 0.87, 0.5 + i * 0.1)} n={8} color="#ffffff" sube={0.9} abre={0.15} vida={2.6} o={fumarolas * 0.8} tam={0.35} viento={0.4} />
      ))}
      {/* lodo volcánico bajando por las cañadas hacia los valles */}
      {lodo > 0 && rutas.map((r, j) => <RioLava key={j} pts={r} avance={lodo * (0.7 + rnd(j) * 0.3)} t={t} lodo grosor={0.04} />)}
    </group>
  );
};

// ---------- 2D ----------
const Sello: React.FC<{ t: number; desde: number; hasta: number; top: number; size: number; color?: string; fondo?: string; giro?: number; children: React.ReactNode }> = ({
  t,
  desde,
  hasta,
  top,
  size,
  color = CREMA,
  fondo,
  giro = -2,
  children,
}) => {
  if (t < desde || t > hasta + 0.3) return null;
  const e = interpolate(t, [desde, desde + 0.28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(2.2)) });
  const s = avance(t, hasta, 0.25);
  return (
    <div style={{ position: 'absolute', left: 30, right: 30, top, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
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
          textShadow: fondo ? undefined : `0 ${size * 0.05}px ${size * 0.25}px rgba(0,0,0,.8)`,
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

const Subtitulos: React.FC<{ t: number; palabras: Tiempos['palabras']; hasta: number; top: number; size: number }> = ({ t, palabras, hasta, top, size }) => {
  if (t >= hasta || !palabras.length) return null;
  const i = palabras.findIndex((p, j) => t >= p.t && (j === palabras.length - 1 || t < palabras[j + 1].t));
  if (i < 0) return null;
  const g = Math.floor(i / 3) * 3;
  const grupo = palabras.slice(g, g + 3);
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', columnGap: size * 0.35 }}>
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
            }}
          >
            {p.w.toUpperCase()}
          </span>
        );
      })}
    </div>
  );
};

// regla de profundidad / altura a un lado
const Regla: React.FC<{ valor: string; sub: string; o: number; u: number; top: number }> = ({ valor, sub, o, u, top }) =>
  o > 0 ? (
    <div style={{ position: 'absolute', right: 40 * u, top, opacity: o, textAlign: 'right', fontFamily: TITULO, color: CREMA, textShadow: '0 4px 18px rgba(0,0,0,.8)' }}>
      <div style={{ fontSize: 120 * u, color: ORO, lineHeight: 0.9 }}>{valor}</div>
      <div style={{ fontSize: 46 * u, letterSpacing: 2 }}>{sub}</div>
    </div>
  ) : null;

// ---------- video ----------
export const Tacana: React.FC<Tiempos> = ({ voz, inicios, palabras }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { w, h, u, tipo, fov } = useFormato();
  const hor = tipo === 'horizontal';
  const vert = tipo === 'vertical';
  const PROV = [0.2, 8.72, 13.05, 23.05, 30.62, 37.36, 47.36, 53.4, 60.5, 67.73, 79.42, 88.34, 96.63, 106.9];
  const s = PROV.map((x, i) => inicios[i] ?? x);
  s[0] = 0;
  const fin = palabras.length ? palabras[palabras.length - 1].t + 0.8 : s[13];
  s[13] = Math.max(s[12] + 3, fin);
  const W = (p: string, desde = 0, otro = 0) => cuando(palabras, p, desde, otro);
  const esc = s.filter((x) => t >= x).length - 1;
  const k = (a: number, b: number) => suave(t, a, b);
  const lerp = (a: THREE.Vector3, b: THREE.Vector3, x: number) => a.clone().lerp(b, x);

  const etiquetas = useMemo(
    () => ({
      pacifico: etiqueta('OCÉANO PACÍFICO'),
      cocos: etiqueta('PLACA DE COCOS', '#cfeaff'),
      continente: etiqueta('CONTINENTE'),
      magma: etiqueta('MAGMA', '#ffd08a', 'rgba(60,12,0,0.8)', FUEGO),
      tacana: etiqueta('VOLCÁN TACANÁ', '#ffd08a', 'rgba(60,12,0,0.8)', FUEGO),
      chiapas: etiqueta('CHIAPAS'),
      soconusco: etiqueta('SOCONUSCO', '#c8ffb8', 'rgba(10,40,12,0.8)', '#8dff7a'),
      especies: ESPECIES.map((e) => etiqueta(e.nombre, CREMA, 'rgba(10,30,12,0.8)', e.fruto)),
    }),
    [],
  );

  // ¿qué mundo se ve?
  const tTacana = W('tacaná', 0, 3.2);
  const mapa = (esc === 0 && t < tTacana + 0.2) || esc === 11 || esc === 12;
  const diorama = esc >= 2 && esc <= 5;
  const real = !mapa && !diorama && esc <= 10;

  // cielo
  let cielo = cieloEntre('atardecer', 'atardecer', 0);
  let estrellas = 0;
  if (esc <= 1) {
    cielo = cieloEntre('atardecer', 'noche', esc === 1 ? 0.6 : 0.3);
    estrellas = esc === 1 ? 0.5 : 0;
  }
  if (esc === 6 || esc === 7) cielo = cieloEntre('dia', 'dia', 0);
  if (esc === 8) {
    cielo = cieloEntre('noche', 'noche', 0);
    estrellas = 0.3;
  }
  if (esc === 9) cielo = cieloEntre('amanecer', 'dia', k(s[9], s[10]));
  const lluviaF = esc === 10 ? k(s[10], s[10] + 1.5) * (1 - k(W('vida', s[10], s[10] + 3), W('vida', s[10], s[10] + 3) + 1.5) * 0.6) : 0;
  if (esc === 10) cielo = nublar(cieloEntre('dia', 'dia', 0), lluviaF * 0.9);
  if (esc >= 11) cielo = cieloEntre('dia', 'atardecer', k(s[11], s[13]));

  // momentos clave
  const tMagma = W('magma', s[3], s[3] + 5);
  const fundir = esc === 3 ? k(s[3] + 1, tMagma + 0.5) : esc > 3 ? 1 : 0;
  const tRevienta = W('reventar', s[4], s[4] + 5);
  const subir = esc === 4 ? k(s[4] + 0.8, tRevienta) : esc > 4 ? 1 : 0;
  const crece = esc === 4 ? (t > tRevienta ? 0.12 : 0) : esc === 5 ? 0.12 + k(s[5] + 0.3, W('estratovolcán', s[5], s[6] - 1)) * 0.88 : esc > 5 ? 1 : 0;
  const erupcion = esc === 4 ? (t > tRevienta - 0.1 ? 1 : 0) : esc === 5 ? 1 - k(s[5] + 2, s[5] + 4) : 0;
  const temblor = esc === 4 ? Math.max(0, 1 - Math.abs(t - tRevienta) * 1.5) : esc === 8 ? 0.4 * k(s[8] + 1, s[8] + 2) : 0;
  const tFuego = W('fuego', 0, 6.5);
  const tVivo = W('vivo', s[1], s[2] - 1);
  const tMil = W('mil', s[6], s[6] + 2);
  const metros = esc === 6 ? Math.round(4060 * Math.min(1, k(s[6] + 0.2, tMil + 0.6))) : 0;
  const frontera = esc === 7 ? k(W('línea', s[7], s[7] + 2) - 0.2, W('guatemala', s[7], s[8] - 0.5)) : 0;
  const nube = esc === 8 ? k(s[8] + 0.6, s[8] + 2) : 0;
  const flujos = esc === 8 ? k(W('nubes', s[8], s[8] + 4) - 0.2, s[9] - 0.5) : 0;
  const tVapor = W('explosión', s[9], s[9] + 5);
  const vapor = esc === 9 ? k(tVapor - 0.3, tVapor + 0.3) * (1 - k(tVapor + 3, tVapor + 4)) : 0;
  const fumarolas = esc === 9 ? k(W('fumarolas', s[9], s[9] + 7) - 0.5, W('fumarolas', s[9], s[9] + 7) + 0.5) : esc === 10 ? 1 : 0;
  const lodo = esc === 10 ? k(W('ceniza', s[10], s[10] + 4), s[11] - 0.5) : 0;
  const brasa = esc === 0 ? k(tFuego - 0.3, tFuego + 0.4) : esc === 1 ? 1 : esc >= 6 && esc <= 9 ? 0.25 : 0;

  // cámara
  let pos = P(0, 6, 14);
  let mira = P(0, 0, 0);
  let fovE = fov;
  if (mapa && chiapas) {
    const tac = chiapas.punto(CHIAPAS.puntos.tacana);
    const soc = chiapas.punto(CHIAPAS.puntos.tuxtlaChico);
    if (esc === 0) {
      // Chiapas completo girando y picada hacia el Tacaná
      const x = Easing.inOut(Easing.cubic)(k(0.2, tTacana + 0.2));
      const g = t * 0.12;
      const lejos = P(Math.sin(g) * 3, 11, 9 + Math.cos(g) * 2);
      pos = lerp(lejos, tac.clone().add(P(-0.8, 1.3, 2.2)), x);
      mira = lerp(P(0, 0, 0.3), tac, x);
    } else if (esc === 11) {
      const x = k(s[11], s[12]);
      pos = lerp(soc.clone().add(P(-0.8, 4.6, 5.2)), soc.clone().add(P(0.4, 3.0, 3.6)), x);
      mira = lerp(soc.clone().add(P(-0.3, 0, 0)), tac.clone().lerp(soc, 0.7), x);
    } else {
      const g = 0.4 + (t - s[12]) * 0.08;
      pos = P(Math.sin(g) * 9, 7.5, Math.cos(g) * 9).add(P(0, 0, 0.5));
      mira = P(0.6, 0, 0.6);
    }
  } else if (diorama) {
    const l = t - s[esc];
    if (esc === 2) {
      const x = k(s[2], s[3]);
      pos = lerp(P(-9, 4, 14), P(-3, 1.5, 12), x);
      mira = lerp(P(-2, -1, -2), P(0, -2.2, -1), x);
    } else if (esc === 3) {
      const x = k(s[3], s[4]);
      pos = lerp(P(-1, -0.5, 11), P(3.5, -3.6, 6.5), x);
      mira = lerp(P(1, -2.5, -1), P(3.8, -4.2, 0), x);
    } else if (esc === 4) {
      const x = k(s[4], tRevienta);
      pos = lerp(P(3.5, -3.6, 6.5), P(5, 1.5, 11), x);
      mira = lerp(P(3.8, -4.0, 0), P(VX, -0.5, 0), x);
    } else {
      const x = k(s[5], s[6]);
      const g = -0.35 + x * 0.8;
      pos = P(VX + Math.sin(g) * 11, 2.8 + x * 1.5, Math.cos(g) * 11);
      mira = P(VX, 1.2, -1.2);
    }
    pos.add(P(Math.sin(l * 0.6) * 0.15, 0, 0));
  } else if (real) {
    if (esc === 0) {
      const x = k(tTacana, s[1]);
      pos = lerp(P(-9, 3.2, 13), P(-5.5, 4.6, 9), x);
      mira = P(0, 3.2, 0);
    } else if (esc === 1) {
      const x = k(s[1], s[2]);
      const latido = 1 + Math.max(0, Math.sin((t - tVivo) * 6)) * 0.03 * (t > tVivo ? 1 : 0);
      pos = lerp(P(-5.5, 4.6, 9), P(-2.6, 5.2, 4.2), x).multiplyScalar(1 / latido);
      mira = P(0, ALTO_TACANA - 0.3, 0);
    } else if (esc === 6) {
      // sube por la ladera hasta la cima mientras corre el contador
      const x = k(s[6], tMil + 0.6);
      pos = lerp(P(-12, 1.2, 13), P(-3.4, ALTO_TACANA + 1.2, 4.6), Easing.inOut(Easing.cubic)(x));
      mira = lerp(P(0, 2, 0), P(0.6, ALTO_TACANA - 0.2, -1), x);
      fovE = fov * 1.05;
    } else if (esc === 7) {
      const g = -0.4 + k(s[7], s[8]) * 0.9;
      pos = P(Math.sin(g) * 9, ALTO_TACANA + 3.4, Math.cos(g) * 9);
      mira = P(0, ALTO_TACANA - 0.6, 0);
    } else if (esc === 8) {
      const x = k(s[8], s[9]);
      pos = lerp(P(-10, 3, 15), P(-13, 6, 19), x);
      mira = P(0, 4.5, 0);
    } else if (esc === 9) {
      const x = k(s[9], s[10]);
      pos = lerp(P(-6, ALTO_TACANA + 1.6, 6), P(-4.2, ALTO_TACANA + 0.9, 4.4), x);
      mira = P(-0.4, ALTO_TACANA * 0.9, 0);
    } else {
      const x = k(s[10], s[11]);
      pos = lerp(P(-6, 6, 9), P(-12, 4, 16), x);
      mira = lerp(P(0, 2, 0), P(-2, 0.5, 4), x);
    }
  }
  if (temblor > 0) pos.add(P(Math.sin(t * 47) * 0.12 * temblor, Math.cos(t * 53) * 0.1 * temblor, 0));

  // árboles del Soconusco
  const arboles = useMemo(() => zonaSoconusco.slice(0, 90).map((p, i) => ({ p, esp: ESPECIES[i % 4], sem: rnd(i * 7), orden: i / 90 })), []);
  const tEspecie = ESPECIES.map((e, i) => W(['cacao', 'café', 'mango', 'rambután'][i], s[11], s[11] + 1 + i * 1.2));
  const brotan = (i: number, orden: number) => (esc >= 11 ? suave(t, tEspecie[i] - 0.3 + orden * 0.8, tEspecie[i] + 0.4 + orden * 0.8) : 0);

  const big = (hor ? 110 : vert ? 150 : 120) * u;
  const med = (hor ? 70 : vert ? 86 : 76) * u;
  const tituloTop = hor ? h * 0.08 : h * 0.1;
  const subTop = hor ? h * 0.82 : vert ? h * 0.72 : h * 0.8;
  const destello = esc === 4 ? Math.max(0, 1 - Math.abs(t - tRevienta) * 3) : esc === 8 ? Math.max(0, 1 - Math.abs(t - s[8] - 0.7) * 2.5) * 0.7 : 0;

  return (
    <AbsoluteFill style={{ background: '#05060a', overflow: 'hidden' }}>
      {voz && <Audio src={staticFile(`voz/${voz}/toma.mp3`)} />}
      {diorama ? (
        <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 35%, #1f2a3a, #07090f 75%)' }} />
      ) : (
        <FondoCielo c={cielo} t={t} w={w} h={h} sol={[0.25, 0.55]} bokeh={0} estrellas={estrellas} />
      )}
      <ThreeCanvas width={w} height={h} style={{ position: 'absolute', inset: 0 }} gl={{ alpha: true, antialias: true }} shadows="soft">
        <Estudio />
        <CamaraSerie pos={pos} mira={mira} fov={fovE} w={w} h={h} tipo={tipo} />
        <hemisphereLight args={[cielo.amb, '#2c3a1e', diorama ? 0.9 : 1.1]} />
        <directionalLight position={[-12, 14, 10]} intensity={diorama ? 2.2 : 2.6} color={diorama ? '#fff1dd' : cielo.luz} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[15, 6, -12]} intensity={0.9} color="#ffb08a" />
        {real && <fog attach="fog" args={[esc === 8 ? '#2a1a18' : '#b8a090', 18, 70]} />}
        {mapa && (
          <group>
            <ChiapasRelieve t={t} brilloSoconusco={esc >= 11 ? k(s[11], s[11] + 1.5) : 0} />
            {chiapas && (
              <>
                <Etiqueta tex={etiquetas.tacana} position={chiapas.punto(CHIAPAS.puntos.tacana, 0.75)} alto={esc === 0 ? 0.32 : 0.45} o={esc === 0 ? k(0.6, 1.4) : 1} />
                {esc === 0 && <Etiqueta tex={etiquetas.chiapas} position={P(0, 2.2, -1.2)} alto={0.8} o={k(0.1, 0.6) * (1 - k(1.6, 2.4))} />}
                {esc >= 11 && <Etiqueta tex={etiquetas.soconusco} position={chiapas.punto(CHIAPAS.puntos.tapachula, 0.6).add(P(-0.2, 0, 0.3))} alto={0.3} o={k(s[11] + 0.5, s[11] + 1.5)} />}
                {arboles.map((a, i) => (
                  <Arbolito key={i} p={a.p} e={brotan(i % 4, a.orden)} esp={a.esp} sem={a.sem} />
                ))}
                {esc === 11 &&
                  ESPECIES.map((e, i) => (
                    <Etiqueta key={i} tex={etiquetas.especies[i]} position={chiapas!.punto(CHIAPAS.puntos.tuxtlaChico, 0.5 + i * 0.16).add(P(-0.9 + i * 0.6, 0, 0.2))} alto={0.16} o={k(tEspecie[i], tEspecie[i] + 0.4)} />
                  ))}
              </>
            )}
          </group>
        )}
        {diorama && (
          <group>
            <Diorama t={t} fundir={fundir} subir={subir} crece={crece} erupcion={erupcion} corte={1} />
            <Etiqueta tex={etiquetas.pacifico} position={P(-7, 0.8, -1)} alto={0.55} o={esc === 2 ? k(s[2] + 0.5, s[2] + 1.2) : 0} />
            <Etiqueta tex={etiquetas.cocos} position={P(-5, -2.6, 0.3)} alto={0.55} o={esc === 2 ? k(W('cocos', s[2], s[2] + 4) - 0.2, W('cocos', s[2], s[2] + 4) + 0.3) : 0} />
            <Etiqueta tex={etiquetas.continente} position={P(7, 0.9, -1)} alto={0.55} o={esc === 2 ? k(W('continente', s[2], s[3] - 1) - 0.2, W('continente', s[2], s[3] - 1) + 0.3) : 0} />
            <Etiqueta tex={etiquetas.magma} position={P(3.8, -3.2, 0.3)} alto={0.45} o={esc === 3 ? k(tMagma - 0.2, tMagma + 0.3) : esc === 4 ? 1 - k(s[4] + 1, s[4] + 1.6) : 0} />
          </group>
        )}
        {real && (
          <group>
            <VolcanReal t={t} brasa={brasa} frontera={esc === 7 ? frontera : 0} nube={nube} flujos={flujos} vapor={vapor} fumarolas={fumarolas} lodo={lodo} />
            {esc !== 8 && <Nubes t={t} n={6} altura={9} dist={30} ancho={90} opacidad={0.6} tam={0.4} />}
            {esc === 10 && <Lluvia t={t} fuerza={lluviaF} centro={pos.clone().add(P(0, -1, -3))} radio={6} alto={6} n={500} suelo={0} />}
          </group>
        )}
      </ThreeCanvas>
      {destello > 0 && <div style={{ position: 'absolute', inset: 0, background: '#ffd2a0', opacity: destello * 0.75, mixBlendMode: 'screen' }} />}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)' }} />

      {/* rótulos */}
      <Sello t={t} desde={tTacana} hasta={s[1] - 0.2} top={tituloTop} size={big}>
        TACANÁ
      </Sello>
      <Sello t={t} desde={tFuego - 0.1} hasta={s[1] - 0.2} top={tituloTop + big * 1.05} size={med} fondo="#9b1c23" giro={2}>
        🔥 CASA DE FUEGO
      </Sello>
      <Sello t={t} desde={tVivo - 0.1} hasta={s[2] - 0.2} top={tituloTop} size={big} color="#ffb070">
        ¡TODAVÍA ESTÁ VIVO!
      </Sello>
      <Sello t={t} desde={s[2] + 0.3} hasta={s[3] - 0.2} top={tituloTop} size={med} fondo="rgba(10,20,40,.8)">
        🌊 TODO EMPEZÓ BAJO EL MAR
      </Sello>
      <Sello t={t} desde={W('derritió', s[3], s[3] + 4) - 0.1} hasta={s[4] - 0.2} top={tituloTop} size={med} fondo="#7a1c0c">
        LA ROCA SE FUNDE
      </Sello>
      <Sello t={t} desde={tRevienta - 0.1} hasta={s[5] - 0.2} top={tituloTop} size={big} color="#ffb070" giro={-4}>
        ¡ERUPCIÓN!
      </Sello>
      <Sello t={t} desde={W('estratovolcán', s[5], s[6] - 1.5) - 0.1} hasta={s[6] - 0.2} top={tituloTop} size={med} fondo="#3a2a20">
        ESTRATOVOLCÁN · CAPA SOBRE CAPA
      </Sello>
      <Sello t={t} desde={W('segundo', s[6], s[6] + 3) - 0.1} hasta={s[7] - 0.2} top={tituloTop + big * 1.1} size={med * 0.9} fondo="#133621">
        2º PICO MÁS ALTO DE CENTROAMÉRICA
      </Sello>
      <Sello t={t} desde={W('méxico', s[7], s[7] + 3) - 0.1} hasta={s[8] - 0.2} top={tituloTop} size={med} fondo="#006847">
        🇲🇽 MÉXICO
      </Sello>
      <Sello t={t} desde={W('guatemala', s[7], s[7] + 4) - 0.1} hasta={s[8] - 0.2} top={tituloTop + med * 1.3} size={med} fondo="#4997d0" giro={2}>
        GUATEMALA 🇬🇹
      </Sello>
      <Sello t={t} desde={s[8] + 0.4} hasta={s[9] - 0.2} top={tituloTop} size={med} fondo="#7a1c0c">
        HACE CASI 2,000 AÑOS
      </Sello>
      <Sello t={t} desde={W('mayo', s[9], s[9] + 3) - 0.1} hasta={W('fumarolas', s[9], s[10] - 2) - 0.3} top={tituloTop} size={med} fondo="#2a3a4a">
        8 DE MAYO DE 1986
      </Sello>
      <Sello t={t} desde={W('fumarolas', s[9], s[10] - 2) - 0.1} hasta={s[10] - 0.2} top={tituloTop} size={med} fondo="#2a3a4a">
        ♨️ FUMAROLAS A 3,600 M
      </Sello>
      <Sello t={t} desde={W('vida', s[10], s[10] + 3) - 0.1} hasta={s[11] - 0.2} top={tituloTop} size={med} fondo="#133621">
        🌧️ DEL FUEGO… A LA VIDA
      </Sello>
      <Sello t={t} desde={W('rambután', s[11], s[12] - 0.5) - 0.1} hasta={s[12] - 0.2} top={tituloTop} size={big} color="#ff6b74">
        ¡Y NUESTRO RAMBUTÁN!
      </Sello>
      <Sello t={t} desde={s[12] + 0.2} hasta={s[13] - 0.2} top={tituloTop} size={med * 0.95} fondo="#9b1c23">
        ¿SABÍAS QUE SIGNIFICA “CASA DE FUEGO”? 👇
      </Sello>
      <Sello t={t} desde={W('mayas', s[12], s[13] - 1) - 0.2} hasta={s[13] - 0.2} top={tituloTop + med * 1.5} size={med * 0.8} fondo="#133621" giro={2}>
        PRÓXIMO: LOS MAYAS DE IZAPA
      </Sello>

      <Regla valor={`${Math.round(100 * k(W('cien', s[3], s[3] + 3) - 0.6, W('cien', s[3], s[3] + 3) + 0.4))} KM`} sub="DE PROFUNDIDAD" o={esc === 3 ? k(W('cien', s[3], s[3] + 3) - 0.6, W('cien', s[3], s[3] + 3)) : 0} u={u} top={h * (vert ? 0.42 : 0.35)} />
      <Regla valor={`${metros.toLocaleString('en-US')} M`} sub="SOBRE EL NIVEL DEL MAR" o={esc === 6 ? k(s[6], s[6] + 0.4) : 0} u={u} top={tituloTop - 10 * u} />

      <Subtitulos t={t} palabras={palabras} hasta={s[13]} top={subTop} size={(hor ? 62 : 74) * u} />
      <CierreSerie t={t} desde={s[13]} fondo="radial-gradient(circle at 50% 40%, #4a1a0c, #0a0503 75%)" />
      <div style={{ position: 'absolute', bottom: 0, height: 0, fontFamily: TEXTO }} />
    </AbsoluteFill>
  );
};
