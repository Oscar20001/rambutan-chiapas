import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Estudio } from './RambutanAbre';
import { volcanGeo, CHANGUITA, IZAPA, TACANA, ALTO_TACANA } from './Croquis';
import { CamaraSerie, FondoCielo, Pajaro, cieloEntre, suave, rnd, AUREO } from './Naturaleza';
import { CierreSerie, Rotulo, useFormato } from './marca';
import { Arbol } from './Racimo';

// Video 2 de la serie: "Tierra de volcán". Solo música. Atardecer.
// Vuelo desde la cima del Tacaná hasta las huertas de Tuxtla Chico, pasando por Izapa.
// Datos: Tacaná 4,060 m en la frontera México–Guatemala; el rambután se da en el Soconusco
// de 100 a 650 m (LEISA 2004); Izapa, zona arqueológica con más de 2,000 años (INAH).

export const DURACION_VOLCAN = 39.5;
// tiempos de la voz de Antonio
const S = { frontera: 6.2, faldas: 9.1, altura: 14.6, izapa: 18.7, huerta: 24.5, cierre: 28.2 };
const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const T = TACANA;

// claves de cámara (tiempo, posición, mira); la curva pasa suave por todas
const CLAVES: [number, THREE.Vector3, THREE.Vector3][] = [
  [0, P(T.x - 12, 2.2, T.z + 15), P(T.x, 2.5, T.z)],
  [S.frontera, P(T.x - 9, 4.2, T.z + 14), P(T.x + 1, 1.8, T.z)],
  [S.faldas, P(T.x - 6, 6.8, T.z + 17), P(T.x * 0.45, 0.4, T.z * 0.55)],
  [S.izapa, P(IZAPA.x + 0.7, 0.55, IZAPA.z + 1.2), P(IZAPA.x, 0.05, IZAPA.z)],
  [S.huerta, P(CHANGUITA.x + 0.5, 0.33, CHANGUITA.z + 0.9), P(CHANGUITA.x, 0.05, CHANGUITA.z)],
  [S.cierre + 0.6, P(CHANGUITA.x + 0.28, 0.15, CHANGUITA.z + 0.5), P(CHANGUITA.x, 0.07, CHANGUITA.z)],
];
const curvaPos = new THREE.CatmullRomCurve3(CLAVES.map((c) => c[1]), false, 'centripetal');
const curvaMira = new THREE.CatmullRomCurve3(CLAVES.map((c) => c[2]), false, 'centripetal');
const camara = (t: number) => {
  const n = CLAVES.length - 1;
  let i = 0;
  while (i < n - 1 && t > CLAVES[i + 1][0]) i++;
  const k = Math.min(1, Math.max(0, (t - CLAVES[i][0]) / (CLAVES[i + 1][0] - CLAVES[i][0])));
  const e = k * k * (3 - 2 * k) * 0.35 + k * 0.65; // casi lineal: el vuelo no se detiene en cada clave
  const u = (i + e) / n;
  return { pos: curvaPos.getPoint(u), mira: curvaMira.getPoint(u) };
};


// ---------- paisaje realista del Soconusco ----------
const alturaSuelo = (x: number, z: number) => {
  const hacia = Math.max(0, 1 - Math.hypot(x - T.x, z - T.z) / 24); // sube hacia el volcán
  return 0.6 * hacia * hacia + 0.05 * Math.sin(x * 1.3 + Math.sin(z * 0.7)) * Math.cos(z * 1.1 - x * 0.4) + 0.025 * Math.sin(x * 3.1 + z * 2.3);
};
export const sueloGeo = (() => {
  const g = new THREE.PlaneGeometry(70, 70, 260, 260);
  g.rotateX(-Math.PI / 2);
  g.translate(0, 0, -10);
  const pos = g.attributes.position;
  const col: number[] = [];
  const a = new THREE.Color('#2e5a26');
  const b = new THREE.Color('#4f7a30');
  const c = new THREE.Color('#7a8a3a');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, alturaSuelo(x, z));
    // parcelas: manchas de cultivos con bordes suaves
    const parcela = Math.sin(Math.floor(x * 1.6) * 12.9 + Math.floor(z * 1.6) * 78.2);
    const k = (parcela * 0.5 + 0.5) * 0.6 + rnd(i) * 0.08;
    const cc = k < 0.35 ? a.clone().lerp(b, k / 0.35) : b.clone().lerp(c, (k - 0.35) / 0.65);
    col.push(cc.r, cc.g, cc.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
})();

// copa de la selva vista desde el aire: textura pintada con miles de copas y su sombra, con parcelas y claros
export const selvaTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 2048;
  const x = c.getContext('2d')!;
  x.fillStyle = '#28461f';
  x.fillRect(0, 0, 2048, 2048);
  // parcelas y potreros
  for (let i = 0; i < 26; i++) {
    x.save();
    x.translate(rnd(i * 3) * 2048, rnd(i * 5) * 2048);
    x.rotate(rnd(i * 7) * 0.6 - 0.3);
    x.fillStyle = ['#5f7a34', '#6f8a3c', '#4f6a2c', '#7a8a48'][i % 4];
    x.fillRect(0, 0, 140 + rnd(i * 9) * 260, 100 + rnd(i * 11) * 200);
    x.restore();
  }
  for (let i = 0; i < 22000; i++) {
    const px = rnd(i * 1.13) * 2048;
    const py = rnd(i * 2.07) * 2048;
    const r = 3 + rnd(i * 3.3) * 7;
    x.fillStyle = 'rgba(8,20,6,0.55)';
    x.beginPath();
    x.arc(px + r * 0.45, py + r * 0.45, r, 0, Math.PI * 2);
    x.fill();
    const l = 16 + rnd(i * 4.4) * 16;
    x.fillStyle = `hsl(${88 + rnd(i * 5.5) * 30}, ${38 + rnd(i * 6.6) * 20}%, ${l}%)`;
    x.beginPath();
    x.arc(px, py, r, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = `hsla(80, 50%, ${l + 14}%, 0.35)`;
    x.beginPath();
    x.arc(px - r * 0.3, py - r * 0.3, r * 0.45, 0, Math.PI * 2);
    x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(18, 18);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
})();

// el Tacaná con colores más reales: selva espesa abajo, pastizal de altura, roca y cima gris, con manchas que rompen las cañadas
export const volcanReal = (() => {
  const g = volcanGeo.clone();
  const pos = g.attributes.position;
  // suavizar las cañadas (3 pasadas de promedio con los vecinos de la malla 221 × 221)
  const N = 221;
  for (let pas = 0; pas < 3; pas++) {
    const y = Float32Array.from({ length: pos.count }, (_, i) => pos.getY(i));
    for (let r = 1; r < N - 1; r++)
      for (let c = 1; c < N - 1; c++) {
        const i = r * N + c;
        pos.setY(i, (y[i] * 4 + y[i - 1] + y[i + 1] + y[i - N] + y[i + N]) / 8);
      }
  }
  g.computeVertexNormals();
  const col: number[] = [];
  // los colores multiplican la textura de selva: abajo claro (se ve la selva), arriba gris rojizo (roca)
  const selva = new THREE.Color('#e8f0d8');
  const selva2 = new THREE.Color('#ffffff');
  const pasto = new THREE.Color('#f0e0b0');
  const roca = new THREE.Color('#b89a8a');
  const cima = new THREE.Color('#e0d0c8');
  for (let i = 0; i < pos.count; i++) {
    const k = pos.getY(i) / ALTO_TACANA;
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const m = Math.sin(x * 4.1 + Math.sin(z * 3.3)) * Math.cos(z * 3.7 - x) * 0.5 + 0.5;
    const base = selva.clone().lerp(selva2, m);
    const c = k < 0.5 ? base.lerp(pasto, Math.max(0, (k - 0.35) / 0.15) * 0.8) : k < 0.78 ? pasto.clone().lerp(roca, (k - 0.5) / 0.28) : roca.clone().lerp(cima, (k - 0.78) / 0.22);
    c.multiplyScalar(0.85 + m * 0.3);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
})();
// capa de roca y pinar en lo alto (color con transparencia por vértice, encima de la selva)
export const rocaGeo = (() => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', volcanReal.attributes.position);
  g.setAttribute('normal', volcanReal.attributes.normal);
  g.setIndex(volcanReal.index);
  const pos = volcanReal.attributes.position;
  const col: number[] = [];
  const pino = new THREE.Color('#1f3320');
  const roca = new THREE.Color('#5a4c44');
  const cima = new THREE.Color('#8a7e76');
  for (let i = 0; i < pos.count; i++) {
    const k = pos.getY(i) / ALTO_TACANA;
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const m = Math.sin(x * 9.1 + Math.sin(z * 7.3)) * Math.cos(z * 8.7 - x * 2) * 0.5 + 0.5;
    const c = k < 0.72 ? pino.clone() : k < 0.88 ? pino.clone().lerp(roca, (k - 0.72) / 0.16) : roca.clone().lerp(cima, (k - 0.88) / 0.12);
    c.multiplyScalar(0.8 + m * 0.4);
    const a = Math.min(1, Math.max(0, (k - 0.5) / 0.15)) * (k < 0.75 ? 0.55 + m * 0.35 : 1);
    col.push(c.r, c.g, c.b, a);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  return g;
})();

export const volcanTex = (() => {
  const t = selvaTex.clone();
  t.repeat.set(7, 7);
  t.needsUpdate = true;
  return t;
})();
const pastoTex = (() => {
  const t = selvaTex.clone();
  t.repeat.set(70, 70);
  t.needsUpdate = true;
  return t;
})();

// Izapa: montículos escalonados cubiertos de pasto, como se ven hoy
const Izapa: React.FC = () => (
  <group position={[IZAPA.x, alturaSuelo(IZAPA.x, IZAPA.z), IZAPA.z]}>
    {[
      [0, 0, 0.09],
      [0.13, 0.05, 0.06],
      [-0.1, 0.08, 0.05],
    ].map(([x, z, s], k) => (
      <group key={k} position={[x, 0, z]}>
        {[0, 1, 2].map((p) => (
          <mesh key={p} position={[0, s * 0.18 * (p + 0.5), 0]}>
            <boxGeometry args={[s * (1 - p * 0.28), s * 0.18, s * (1 - p * 0.28)]} />
            <meshStandardMaterial color={p === 2 ? '#7d8a5a' : '#6b7a48'} roughness={0.95} />
          </mesh>
        ))}
      </group>
    ))}
  </group>
);

const Paisaje: React.FC = () => (
  <group>
    <mesh geometry={sueloGeo}>
      <meshStandardMaterial map={selvaTex} roughness={0.95} />
    </mesh>
    <mesh geometry={volcanReal} position={[T.x, 0, T.z]}>
      <meshStandardMaterial vertexColors map={volcanTex} roughness={0.95} envMapIntensity={0.2} />
    </mesh>
    <mesh geometry={rocaGeo} position={[T.x, 0.002, T.z]}>
      <meshStandardMaterial vertexColors transparent roughness={0.9} envMapIntensity={0.2} polygonOffset polygonOffsetFactor={-2} depthWrite={false} />
    </mesh>
    <Izapa />
  </group>
);

// textura suave para nubes
const nubeTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();

const Nubes: React.FC<{ t: number; color: string }> = ({ t, color }) => {
  const mats = useMemo(() => Array.from({ length: 3 }, () => new THREE.SpriteMaterial({ map: nubeTex, transparent: true, depthWrite: false, opacity: 0.35 })), []);
  mats.forEach((m) => m.color.set(color));
  return (
    <group>
      {Array.from({ length: 14 }, (_, i) => {
        const a = i * AUREO;
        const r = 3.2 + (i % 7) * 0.6;
        const y = ALTO_TACANA - 0.9 + rnd(i) * 0.9;
        const dx = (t * 0.12 + rnd(i * 3) * 4) % 4;
        const s = 1.4 + rnd(i * 5) * 1.6;
        return <sprite key={i} material={mats[i % 3]} position={[T.x + Math.cos(a) * r + dx - 2, y, T.z + Math.sin(a) * r]} scale={[s * 1.8, s, 1]} />;
      })}
    </group>
  );
};

// semilla de la vida: siete anillos que laten sobre la huerta (geometría escondida)
// semilla de la vida en el suelo de la huerta, casi invisible: luz dorada del atardecer
const SemillaCerca: React.FC<{ t: number; o: number }> = ({ t, o }) => (
  <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
    {Array.from({ length: 7 }, (_, i) => {
      const a = (i * Math.PI) / 3;
      const r = 2.6;
      return (
        <mesh key={i} position={[i === 0 ? 0 : Math.cos(a) * r, i === 0 ? 0 : Math.sin(a) * r, 0]}>
          <ringGeometry args={[r - 0.05, r, 96]} />
          <meshBasicMaterial color="#ffd27a" transparent opacity={o * (0.06 + 0.03 * Math.sin(t * 2 + i))} toneMapped={false} />
        </mesh>
      );
    })}
  </group>
);

const Semilla: React.FC<{ t: number; o: number }> = ({ t, o }) => (
  <group position={[CHANGUITA.x, alturaSuelo(CHANGUITA.x, CHANGUITA.z) + 0.004, CHANGUITA.z]} rotation={[-Math.PI / 2, 0, 0]}>
    {Array.from({ length: 7 }, (_, i) => {
      const a = (i * Math.PI) / 3;
      const r = 0.12;
      const x = i === 0 ? 0 : Math.cos(a) * r;
      const y = i === 0 ? 0 : Math.sin(a) * r;
      return (
        <mesh key={i} position={[x, y, 0]}>
          <ringGeometry args={[r - 0.004, r, 64]} />
          <meshBasicMaterial color="#ffd27a" transparent opacity={o * (0.25 + 0.15 * Math.sin(t * 2 + i))} toneMapped={false} />
        </mesh>
      );
    })}
  </group>
);

export const TierraVolcan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { w, h, tipo, fov } = useFormato();
  const cerca = t >= S.huerta;
  const kc = suave(t, S.huerta, S.cierre + 0.6);
  const lejosC = tipo === 'vertical' ? 1.35 : tipo === 'cuadrado' ? 1.25 : 1.5;
  const { pos, mira } = cerca
    ? { pos: P(7.5 - kc * 2.5, 2.4 - kc * 0.6, (10.5 - kc * 2.5) * lejosC), mira: P(0, 3.1, 0) }
    : camara(t);
  const flash = t >= S.huerta && t < S.huerta + 0.45 ? 1 - (t - S.huerta) / 0.45 : 0;
  // atardecer que se va apagando hacia el final
  const cielo = cieloEntre('atardecer', 'noche', suave(t, S.huerta, S.cierre + 2) * 0.35);
  const metros = Math.round(4060 * suave(t, 1.7, 3.6));

  // parvada en V cruzando el atardecer
  const parvada = Array.from({ length: 7 }, (_, i) => {
    const fila = Math.ceil(i / 2) * (i % 2 ? 1 : -1);
    const k = (t - S.huerta + 0.2) / 4.5;
    const base = P(-14 + k * 28, 8.5 + Math.abs(fila) * 0.1, -6 - k * 4);
    return { ok: k > 0 && k < 1, p: base.add(P(-Math.abs(fila) * 0.7, 0, fila * 0.6)), fase: i * 0.7 };
  });

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <FondoCielo c={cielo} t={t} w={w} h={h} sol={[0.3, 0.6]} bokeh={0} estrellas={suave(t, S.huerta, S.cierre) * 0.5} />
      <ThreeCanvas width={w} height={h} style={{ position: 'absolute', inset: 0 }} gl={{ alpha: true, antialias: true }}>
        <Estudio />
        <CamaraSerie pos={pos} mira={mira} fov={fov} w={w} h={h} tipo={tipo} />
        <hemisphereLight args={[cielo.amb, '#2c3a1e', 1.1]} />
        <directionalLight position={[-30, 9, 12]} intensity={cerca ? 3.2 : 2.2} color={cielo.luz} />
        <directionalLight position={[25, 6, -30]} intensity={1.5} color="#ffb08a" />
        <directionalLight position={[20, 10, -10]} intensity={0.8} color="#8a7ad8" />
        <fog attach="fog" args={cerca ? ['#c98a6a', 12, 60] : ['#c9876a', 22, 85]} />
        {!cerca && <Paisaje />}
        {!cerca && <Nubes t={t} color={cielo.sol} />}
        {cerca && (
          <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[90, 64]} />
              <meshStandardMaterial map={pastoTex} color="#b8c890" roughness={0.95} />
            </mesh>
            <Arbol position={[0, 0, 0]} racimos={9} />
            <Arbol position={[-7.5, 0, -5]} racimos={7} escala={0.95} />
            <Arbol position={[7, 0, -7]} racimos={7} escala={1.05} />
            <SemillaCerca t={t} o={suave(t, S.huerta + 0.5, S.huerta + 2)} />
            {parvada.map((b, i) => b.ok && <Pajaro key={i} position={b.p} rumbo={P(1, 0, -0.15)} t={t} escala={0.3} fase={b.fase} />)}
          </group>
        )}
      </ThreeCanvas>

      {flash > 0 && <div style={{ position: 'absolute', inset: 0, background: '#ffe2b0', opacity: flash }} />}
      <Rotulo t={t} desde={0.3} hasta={S.frontera - 0.1} titulo={<>ESTE VOLCÁN<br />MIDE <span style={{ color: '#ffcf70' }}>{metros.toLocaleString('en-US')} M</span></>} sub="Volcán Tacaná, Chiapas." />
      <Rotulo t={t} desde={S.frontera + 0.2} hasta={S.faldas - 0.1} titulo={<>Y MARCA LA<br />FRONTERA</>} sub="Entre México y Guatemala." />
      <Rotulo t={t} desde={S.faldas + 0.2} hasta={S.altura - 0.1} titulo={<>EN SUS FALDAS<br />ESTÁ EL SOCONUSCO</>} sub="Tierra caliente, húmeda y fértil." />
      <Rotulo t={t} desde={S.altura + 0.1} hasta={S.izapa - 0.1} titulo={<>DE <span style={{ color: '#ffcf70' }}>100 A 650</span><br />METROS</>} sub="La altura donde se da el rambután." />
      <Rotulo t={t} desde={S.izapa + 0.2} hasta={S.huerta - 0.1} titulo={<>IZAPA</>} sub="Zona arqueológica de Tuxtla Chico, con más de 2,000 años de historia." />
      <Rotulo t={t} desde={S.huerta + 0.2} hasta={S.cierre - 0.05} titulo={<>AQUÍ CRECE<br />NUESTRO <span style={{ color: '#ff4a5a' }}>RAMBUTÁN</span></>} sub="Tuxtla Chico, Chiapas." />

      <CierreSerie t={t} desde={S.cierre} fondo="radial-gradient(circle at 50% 40%, #4a2a3a, #120a14 75%)" />
      <Audio src={staticFile('serie/voz2.mp3')} />
    </AbsoluteFill>
  );
};
