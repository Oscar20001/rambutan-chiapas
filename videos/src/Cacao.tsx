import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
// @ts-ignore: d3-geo no trae tipos
import { geoMercator, geoPath } from 'd3-geo';
// @ts-ignore: topojson-client no trae tipos
import { feature } from 'topojson-client';
import mundo from 'world-atlas/countries-50m.json';
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Tiempos, TITULO, TEXTO, avance, cuando } from './comun';
import { CierreSerie } from './marca';
import { Estudio } from './RambutanAbre';
import { Rambutan } from './Anuncio3D';
import { Arbol } from './Racimo';
import { volcanGeo } from './Croquis';
import { AUREO, FondoCielo, cieloEntre, rnd, suave } from './Naturaleza';

// Serie "Soconusco, tierra de frutas" · Video 1: "El dinero crecía en los árboles".
// Voz de Antonio, sin música. Gancho tipográfico en el primer segundo (palabra gigante sobre negro
// con un punto de luz) y escenas de estudio oscuro con luz de contorno, como los anuncios de producto.
// Datos: el Soconusco (Xoconochco) pagaba tributo en cacao a los mexicas (Códice Mendoza);
// en 1545 en Tlaxcala un guajolote valía 100 granos de cacao (tarifa de precios, Anderson y Dibble).

const ORO = '#ffcf6b';
const CREMA = '#fff6e2';

// ---------- formato: 9:16 celular, 4:5 feed/tableta, 16:9 computadora ----------
const useLienzo = () => {
  const { width: w, height: h } = useVideoConfig();
  const u = Math.min(w, h) / 1080;
  const tipo: 'vertical' | 'feed' | 'horizontal' = h / w > 1.5 ? 'vertical' : h >= w ? 'feed' : 'horizontal';
  const fov = tipo === 'vertical' ? 42 : tipo === 'feed' ? 32 : 24;
  return { w, h, u, tipo, fov };
};

// Cámara que deja al sujeto un poco abajo en vertical (el texto vive arriba) y a la derecha en horizontal.
const Camara: React.FC<{ pos: THREE.Vector3; mira: THREE.Vector3; fov: number; w: number; h: number; tipo: string }> = ({ pos, mira, fov, w, h, tipo }) => {
  const cam = useThreeCamara();
  cam.position.copy(pos);
  cam.lookAt(mira);
  cam.fov = fov;
  cam.near = 0.05;
  cam.far = 900;
  const ox = tipo === 'horizontal' ? -(0.64 - 0.5) * w : 0;
  const oy = tipo === 'vertical' ? -0.07 * h : tipo === 'feed' ? -0.06 * h : 0;
  cam.setViewOffset(w, h, ox, oy, w, h);
  cam.updateProjectionMatrix();
  return null;
};
const useThreeCamara = () => useThree((s) => s.camera) as THREE.PerspectiveCamera;

// ---------- piezas 3D ----------
// Mazorca de cacao: alargada, punta abajo, diez costillas y piel verrugosa, amarillo a naranja rojizo.
const mazorcaGeo = (phi0 = 0, phiL = Math.PI * 2) => {
  const g = new THREE.SphereGeometry(1, 160, 120, phi0, phiL);
  const pos = g.attributes.position;
  const col: number[] = [];
  const amarillo = new THREE.Color('#e7a72a');
  const naranja = new THREE.Color('#c4561a');
  const vino = new THREE.Color('#7b2612');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const th = Math.atan2(z, x);
    let r = Math.pow(Math.max(0, 1 - y * y), 0.55);
    r *= 1 - 0.4 * Math.pow(Math.max(0, -y), 2.2); // punta
    r *= 0.47;
    const costilla = Math.pow(Math.abs(Math.cos(th * 5)), 0.6);
    r *= 1 + 0.07 * costilla;
    r += (0.0045 * (Math.sin(y * 41 + th * 3.3) + Math.sin(th * 19 - y * 29)) + 0.003 * Math.sin(y * 97 + th * 37) * Math.sin(th * 11 + y * 13)) * r * 2.4; // verrugas irregulares
    const curva = 0.1 * y * y; // la mazorca se curva un poco
    pos.setXYZ(i, Math.cos(th) * r + curva, y * 1.25, Math.sin(th) * r);
    const k = Math.min(1, Math.max(0, 0.5 - y * 0.55 + 0.1 * Math.sin(th * 3 + y * 5)));
    const c = amarillo.clone().lerp(naranja, k).lerp(vino, Math.max(0, -y - 0.75) * 1.6 + (1 - costilla) * 0.18);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
};
const MAZORCA = mazorcaGeo();
const MITAD_A = mazorcaGeo(0, Math.PI);
const MITAD_B = mazorcaGeo(Math.PI, Math.PI);

const granoGeo = (() => {
  const g = new THREE.SphereGeometry(1, 28, 20);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = 1 + 0.05 * Math.sin(x * 9 + z * 7) * Math.cos(y * 8);
    pos.setXYZ(i, x * 0.13 * n, y * 0.075 * n, z * 0.2 * n);
  }
  g.computeVertexNormals();
  return g;
})();
const granoSeco = new THREE.MeshPhysicalMaterial({ color: '#5a2d1a', roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35, sheen: 0.4, sheenColor: new THREE.Color('#c9875a') });
const granoBaba = new THREE.MeshPhysicalMaterial({ color: '#efe3c8', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, transmission: 0.15, thickness: 0.2 });
const pielMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.4, side: THREE.DoubleSide });
const cortezaMat = new THREE.MeshStandardMaterial({ color: '#4a3424', roughness: 0.95 });

// lugares de los granos dentro de la mazorca: cinco hileras en espiral áurea
const DENTRO = Array.from({ length: 40 }, (_, i) => {
  const y = -0.85 + (1.7 * i) / 39;
  const a = i * AUREO;
  const ancho = Math.pow(Math.max(0, 1 - (y / 1.25) ** 2), 0.55) * 0.47;
  return { p: new THREE.Vector3(Math.cos(a) * ancho * 0.45, y, Math.sin(a) * ancho * 0.45), a };
});

const Mazorca: React.FC<{ abre?: number; position?: [number, number, number]; rotation?: [number, number, number]; escala?: number; tallo?: boolean }> = ({
  abre = 0,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  escala = 1,
  tallo = true,
}) => (
  <group position={position} rotation={rotation} scale={escala}>
    {tallo && (
      <mesh position={[0.1, 1.42, 0]} material={cortezaMat}>
        <cylinderGeometry args={[0.035, 0.06, 0.4, 10]} />
      </mesh>
    )}
    {abre <= 0 ? (
      <mesh geometry={MAZORCA} material={pielMat} />
    ) : (
      <>
        <mesh geometry={MITAD_A} material={pielMat} position={[0, 0, abre * 0.55]} rotation={[abre * 0.5, 0, 0]} />
        <mesh geometry={MITAD_B} material={pielMat} position={[0, 0, -abre * 0.55]} rotation={[-abre * 0.5, 0, 0]} />
        {DENTRO.map((d, i) => {
          const sale = abre * (0.15 + rnd(i) * 0.4);
          const p = d.p.clone().add(new THREE.Vector3(Math.cos(d.a) * sale * 0.9, 0, Math.sin(d.a) * sale * 0.9).add(new THREE.Vector3(sale * 0.2, 0, 0)));
          return <mesh key={i} geometry={granoGeo} material={granoBaba} position={p} rotation={[d.a + abre, d.a * 0.5, abre * rnd(i * 3) * 2]} />;
        })}
      </>
    )}
  </group>
);

// granos secos cayendo en cámara lenta, girando
const LluviaGranos: React.FC<{ t: number; n?: number; ancho?: number; velocidad?: number }> = ({ t, n = 36, ancho = 4, velocidad = 0.55 }) => (
  <group>
    {Array.from({ length: n }, (_, i) => {
      const z = -3 + rnd(i * 3) * 5.2;
      const ciclo = 7;
      const y = 3.2 - (((t * velocidad * (0.7 + rnd(i * 5) * 0.6) + rnd(i) * ciclo) % ciclo) * 1);
      return (
        <mesh key={i} geometry={granoGeo} material={granoSeco} position={[(rnd(i * 2) - 0.5) * ancho * 2, y, z]} rotation={[t * (0.6 + rnd(i * 7)), t * 0.8 + i, t * 0.4 * rnd(i * 9)]} scale={0.9 + rnd(i * 11) * 0.5} />
      );
    })}
  </group>
);

// cien granos que caen y se amontonan
const MONTON = Array.from({ length: 100 }, (_, i) => {
  const r = Math.sqrt(i / 100) * 1.05;
  const a = i * AUREO;
  return { p: new THREE.Vector3(Math.cos(a) * r, 0.62 * (1 - r / 1.1) + 0.04, Math.sin(a) * r * 0.85), sale: i / 100 };
});
const Monton: React.FC<{ t: number; desde: number; dura: number }> = ({ t, desde, dura }) => (
  <group>
    {MONTON.map((g, i) => {
      const inicio = desde + g.sale * dura;
      const l = t - inicio;
      if (l < 0) return null;
      const altura = 3.4 + rnd(i) * 0.8;
      const caer = Math.min(1, l / 0.55);
      const y = g.p.y + altura * (1 - caer * caer) + (caer === 1 ? Math.max(0, Math.sin((l - 0.55) * 18) * 0.04 * Math.exp(-(l - 0.55) * 8)) : 0);
      const giro = caer < 1 ? l * 7 : 0.55 * 7;
      return <mesh key={i} geometry={granoGeo} material={granoSeco} position={[g.p.x, y, g.p.z]} rotation={[giro + rnd(i * 2) * 3, rnd(i * 4) * 6, giro * 0.5]} />;
    })}
  </group>
);

// rama horizontal de la que cuelga la mazorca
const Rama: React.FC = () => (
  <group>
    <mesh position={[0.1, 1.72, 0]} rotation={[0, 0, Math.PI / 2 + 0.08]} material={cortezaMat}>
      <cylinderGeometry args={[0.11, 0.14, 7, 16]} />
    </mesh>
  </group>
);


// ---------- paisaje: huerta al pie del Tacaná ----------
const texRuido = (base: string[], n = 9000, tam = 512, puntos = 3) => {
  const c = document.createElement('canvas');
  c.width = c.height = tam;
  const x = c.getContext('2d')!;
  x.fillStyle = base[0];
  x.fillRect(0, 0, tam, tam);
  for (let i = 0; i < n; i++) {
    x.fillStyle = base[1 + (i % (base.length - 1))];
    x.globalAlpha = 0.25 + rnd(i * 3) * 0.5;
    x.fillRect(rnd(i) * tam, rnd(i * 2) * tam, 1 + rnd(i * 5) * puntos, 2 + rnd(i * 7) * puntos * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
let pastoTex: THREE.CanvasTexture | null = null;
const usePasto = () => {
  if (!pastoTex) {
    pastoTex = texRuido(['#3d5e2a', '#2c4a1e', '#4f7232', '#6b7f3a', '#26401a']);
    pastoTex.repeat.set(90, 90);
  }
  return pastoTex;
};
const sueloHuerta = (() => {
  const g = new THREE.PlaneGeometry(420, 420, 200, 200);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const lejos = Math.min(1, Math.max(0, (-z - 30) / 60));
    pos.setY(i, (Math.sin(x * 0.08) * Math.cos(z * 0.06) * 1.2 + Math.sin(x * 0.21 + z * 0.13) * 0.4) * lejos);
  }
  g.computeVertexNormals();
  return g;
})();
let nubeTex: THREE.CanvasTexture | null = null;
const useNube = () => {
  if (!nubeTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d')!;
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    nubeTex = new THREE.CanvasTexture(c);
  }
  return nubeTex;
};
const ARBOLES = Array.from({ length: 12 }, (_, i) => {
  const fila = i % 2 === 0 ? -1 : 1;
  const k = Math.floor(i / 2);
  return { p: [fila * (4.6 + rnd(i) * 0.8) + (k > 3 ? fila * 4 : 0), 0, 4 - k * 8.5 - rnd(i * 3) * 2] as [number, number, number], e: 0.85 + rnd(i * 5) * 0.3, fase: rnd(i * 7) * 6 };
});
const Huerta: React.FC<{ t: number; luz: string; bruma: string }> = ({ t, luz, bruma }) => {
  const pasto = usePasto();
  const nube = useNube();
  const matBruma = useMemo(() => new THREE.SpriteMaterial({ map: nube, transparent: true, depthWrite: false, opacity: 0.22 }), [nube]);
  matBruma.color.set(bruma);
  return (
    <group>
      <mesh geometry={sueloHuerta}>
        <meshStandardMaterial map={pasto} roughness={0.95} />
      </mesh>
      <mesh geometry={volcanGeo} position={[12, -0.5, -110]} scale={[8, 8.5, 8]}>
        <meshStandardMaterial vertexColors roughness={0.95} envMapIntensity={0.2} />
      </mesh>
      {ARBOLES.map((a, i) => (
        // el viento mece cada árbol a su ritmo
        <group key={i} position={a.p} rotation={[Math.sin(t * 1.1 + a.fase) * 0.012, 0, Math.sin(t * 0.9 + a.fase) * 0.02]}>
          <Arbol racimos={i < 4 ? 8 : 5} escala={a.e} />
        </group>
      ))}
      {/* bruma baja entre la huerta y nubes en la cima del volcán */}
      {Array.from({ length: 16 }, (_, i) => {
        const cima = i >= 10;
        const x = cima ? 12 + (rnd(i) - 0.5) * 60 + ((t * 1.2) % 20) : (rnd(i) - 0.5) * 90 + t * 0.6;
        const y = cima ? 26 + rnd(i * 3) * 8 : 1.5 + rnd(i * 3) * 2;
        const z = cima ? -105 + rnd(i * 5) * 10 : -20 - rnd(i * 5) * 60;
        const sc = cima ? 30 + rnd(i * 7) * 20 : 18 + rnd(i * 7) * 14;
        return <sprite key={i} material={matBruma} position={[x, y, z]} scale={[sc * 1.8, sc * 0.5, 1]} />;
      })}
    </group>
  );
};

// ---------- piezas 2D ----------
// grano de película + viñeta: quita lo "digital" y da look de cine
const Pelicula: React.FC<{ frame: number; w: number; h: number }> = ({ frame, w, h }) => (
  <>
    <svg width={w} height={h} style={{ position: 'absolute', inset: 0, opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
      <filter id="grano">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 12} />
      </filter>
      <rect width="100%" height="100%" filter="url(#grano)" />
    </svg>
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,.55) 100%)', pointerEvents: 'none' }} />
  </>
);

// texto que "golpea": entra grande y desenfocado y se asienta
const Golpe: React.FC<{ t: number; desde: number; hasta: number; tam: number; color?: string; children: React.ReactNode; estilo?: React.CSSProperties }> = ({
  t,
  desde,
  hasta,
  tam,
  color = CREMA,
  children,
  estilo,
}) => {
  if (t < desde || t > hasta + 0.3) return null;
  const e = interpolate(t, [desde, desde + 0.32], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.6)) });
  const sale = avance(t, hasta, 0.3);
  return (
    <div
      style={{
        fontFamily: TITULO,
        fontSize: tam,
        lineHeight: 0.88,
        color,
        letterSpacing: tam * 0.01,
        opacity: Math.min(1, e * 1.5) * (1 - sale),
        transform: `scale(${1.45 - 0.45 * e + sale * 0.08})`,
        filter: `blur(${(1 - Math.min(1, e)) * 14 + sale * 10}px)`,
        textShadow: `0 0 ${tam * 0.35}px rgba(0,0,0,.6)`,
        ...estilo,
      }}
    >
      {children}
    </div>
  );
};

// caja de texto responsiva: arriba en vertical/feed, a la izquierda en horizontal
const Texto: React.FC<{ children: React.ReactNode; abajo?: boolean }> = ({ children, abajo }) => {
  const { w, h, u, tipo } = useLienzo();
  const hor = tipo === 'horizontal';
  const st: React.CSSProperties = hor
    ? { left: w * 0.06, width: w * 0.42, top: 0, bottom: 0, alignItems: 'flex-start', textAlign: 'left', justifyContent: 'center' }
    : abajo
      ? { left: 60 * u, right: 60 * u, bottom: h * (tipo === 'vertical' ? 0.2 : 0.08), alignItems: 'center', textAlign: 'center' }
      : { left: 60 * u, right: 60 * u, top: h * (tipo === 'vertical' ? 0.1 : 0.06), alignItems: 'center', textAlign: 'center' };
  return <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', gap: 18 * u, ...st }}>{children}</div>;
};

const Sub: React.FC<{ t: number; desde: number; hasta: number; children: React.ReactNode; tam?: number }> = ({ t, desde, hasta, children, tam = 50 }) => {
  const { u } = useLienzo();
  if (t < desde - 0.05 || t > hasta + 0.3) return null;
  const a = avance(t, desde, 0.45) * (1 - avance(t, hasta, 0.3));
  return (
    <div style={{ fontFamily: TEXTO, fontStyle: 'italic', fontSize: tam * u, lineHeight: 1.15, color: CREMA, opacity: a * 0.95, transform: `translateY(${(1 - a) * 24 * u}px)`, textShadow: '0 2px 18px rgba(0,0,0,.8)' }}>
      {children}
    </div>
  );
};

// mapa del tributo: del Soconusco a Tenochtitlan
const geoMundo = feature(mundo as never, (mundo as unknown as { objects: { countries: never } }).objects.countries) as { features: { id: string }[] };
const VECINOS = new Set(['484', '320', '084', '222', '340']);
const SOCONUSCO: [number, number] = [-92.26, 14.9];
const TENOCH: [number, number] = [-99.13, 19.43];
const MapaTributo: React.FC<{ t: number; desde: number; ruta: [number, number]; w: number; h: number; u: number; tipo: string }> = ({ t, desde, ruta, w, h, u, tipo }) => {
  const hor = tipo === 'horizontal';
  const { caminos, a, b, curva } = useMemo(() => {
    const ancho = hor ? w * 0.56 : w * 1.2;
    const alto = hor ? h * 0.86 : tipo === 'vertical' ? h * 0.6 : h * 0.62;
    const marco = {
      type: 'Feature',
      geometry: { type: 'MultiPoint', coordinates: [[-100.6, 13.6], [-90.4, 20.6]] },
    } as never;
    const proy = geoMercator().fitSize([ancho, alto], marco);
    const camino = geoPath(proy);
    const caminos = geoMundo.features.filter((f) => VECINOS.has(f.id)).map((f) => ({ d: camino(f as never) ?? '', mx: f.id === '484' }));
    const a = proy(SOCONUSCO)!;
    const b = proy(TENOCH)!;
    // por la costa del Pacífico y luego tierra adentro (aprox. ruta por Oaxaca)
    const c1 = proy([-95.5, 15.6])!;
    const c2 = proy([-97.6, 17.4])!;
    const curva = `M ${a[0]} ${a[1]} C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${b[0]} ${b[1]}`;
    return { caminos, a, b, curva };
  }, [w, h, hor, tipo]);
  const l = t - desde;
  const ap = avance(l, 0, 0.6);
  const k = suave(t, ruta[0], ruta[1]);
  const ancho = hor ? w * 0.56 : w * 1.2;
  const alto = hor ? h * 0.86 : tipo === 'vertical' ? h * 0.6 : h * 0.62;
  const ox = hor ? w * 0.42 : (w - ancho) / 2;
  const oy = hor ? (h - alto) / 2 : tipo === 'vertical' ? h * 0.3 : h * 0.3;
  const zoom = 1 + l * 0.012;
  return (
    <div style={{ position: 'absolute', left: ox, top: oy, width: ancho, height: alto, opacity: ap, transform: `scale(${zoom})`, transformOrigin: '60% 60%' }}>
      <svg width={ancho} height={alto} style={{ overflow: 'visible' }}>
        <defs>
          <filter id="brillo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={6 * u} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {caminos.map((c, i) => (
          <path key={i} d={c.d} fill={c.mx ? 'rgba(255,207,107,.07)' : 'rgba(255,255,255,.025)'} stroke={c.mx ? 'rgba(255,207,107,.55)' : 'rgba(255,255,255,.18)'} strokeWidth={(c.mx ? 2 : 1.2) * u} />
        ))}
        <path d={curva} fill="none" stroke={ORO} strokeWidth={5 * u} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - k} filter="url(#brillo)" />
        {[{ p: a, n: 'XOCONOCHCO', s: 'Soconusco', on: 0 }, { p: b, n: 'TENOCHTITLAN', s: 'hoy CDMX', on: 0.98 }].map((m, i) => {
          const v = i === 0 ? ap : avance(k, m.on, 0.02);
          return (
            <g key={i} opacity={v}>
              <circle cx={m.p[0]} cy={m.p[1]} r={(12 + 6 * Math.sin(t * 5)) * u} fill="none" stroke={ORO} strokeWidth={2 * u} opacity={0.6} />
              <circle cx={m.p[0]} cy={m.p[1]} r={7 * u} fill={ORO} filter="url(#brillo)" />
              <text x={m.p[0] + (i === 0 ? -22 : 22) * u} y={m.p[1] + (i === 0 ? 52 : -40) * u} textAnchor={i === 0 ? 'end' : 'start'} fontFamily={TITULO} fontSize={46 * u} fill={CREMA} letterSpacing={3 * u}>
                {m.n}
              </text>
              <text x={m.p[0] + (i === 0 ? -22 : 22) * u} y={m.p[1] + (i === 0 ? 86 : -6) * u} textAnchor={i === 0 ? 'end' : 'start'} fontFamily={TEXTO} fontStyle="italic" fontSize={30 * u} fill={CREMA} opacity={0.75}>
                {m.s}
              </text>
            </g>
          );
        })}
      </svg>
      {/* granos viajeros con offset-path (CSS), que sí respeta la curva */}
      {Array.from({ length: 12 }, (_, i) => {
        const s = (l * 0.11 + i / 12) % 1;
        if (s > k || k < 0.04) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 16 * u,
              height: 24 * u,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #b06a3e, #4a2312 70%)',
              boxShadow: `0 0 ${14 * u}px rgba(255,207,107,.7)`,
              offsetPath: `path('${curva}')`,
              offsetDistance: `${s * 100}%`,
              offsetRotate: 'auto 90deg',
            }}
          />
        );
      })}
    </div>
  );
};

// ---------- video ----------
export const Cacao: React.FC<Tiempos & { musica?: string }> = ({ voz, inicios, palabras, musica }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { w, h, u, tipo, fov } = useLienzo();
  const hor = tipo === 'horizontal';
  const I = (i: number, otro: number) => inicios[i] ?? otro;
  const W = (p: string, desde = 0, otro = 0) => cuando(palabras, p, desde, otro);

  const s1 = I(1, 5);
  const s2 = I(2, 10.7);
  const s3 = I(3, 18.8);
  const s4 = I(4, 25.5);
  const s5 = I(5, 31.9);
  const s6 = I(6, 34.8);

  const tDinero = W('dinero', 0, 2.7);
  const tCrecia = W('crecía', 0, 3.2);
  const tQuin = W('quinientos', s1, 5.6);
  const tSoco = W('soconusco', s1, 7.1);
  const tCacao = W('cacao', s1, 8.1);
  const tCobra = W('cobraban', s2, 11.8);
  const tCargas = W('cargas', s2, 13.6);
  const tTenoch = W('tenochtitlán', s2, W('tenochtitlan', s2, 17.2));
  const tBebia = W('bebía', s3, 20.3);
  const tGasta = W('gastaba', s3, 21.4);
  const tCien = W('cien', s3, 22.7);
  const tGuaj = W('guajolote', s3, 24.1);
  const tTacana = W('tacaná', s4, 28.4);
  const tFrutas = W('frutas', s4, 30);
  const tRamb = W('rambután', s5, 32.5);

  const zf = hor ? 1.4 : tipo === 'feed' ? 1.1 : 1; // en horizontal la cámara se aleja para que quepa el texto
  const big = (hor ? 150 : tipo === 'vertical' ? 190 : 165) * u;

  // corte con destello entre escenas
  const cortes = [s1, s2, s3, s4, s5, s6];
  const destello = Math.max(0, ...cortes.map((c) => (t >= c && t < c + 0.35 ? 1 - (t - c) / 0.35 : 0)));

  let escena: React.ReactNode = null;
  if (t < s1) {
    // 1 · GANCHO: negro, un punto de luz que crece y una mazorca colgando con luz de contorno
    const luz = avance(t, 0, 1.2);
    const barrido = interpolate(t, [0, s1], [-3, 3]);
    escena = (
      <>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% ${hor ? 50 : 58}%, rgba(255,190,90,${0.28 * luz}) 0%, rgba(60,25,8,${0.5 * luz}) ${18 + 20 * luz}%, #050302 70%)` }} />
        <ThreeCanvas width={w} height={h} style={{ position: 'absolute', inset: 0 }} gl={{ alpha: true, antialias: true }}>
          <Estudio />
          <Camara pos={new THREE.Vector3(Math.sin(t * 0.25) * 0.6, 0.2, (5.6 - t * 0.18) * zf)} mira={new THREE.Vector3(0, 0.2, 0)} fov={fov} w={w} h={h} tipo={tipo} />
          <ambientLight intensity={0.08} />
          <spotLight position={[barrido, 4, 3]} angle={0.5} penumbra={0.9} intensity={60 * luz} color="#ffd59a" />
          <directionalLight position={[-3, 2, -4]} intensity={4 * luz} color="#ffb36b" />
          <directionalLight position={[3, 1, -3]} intensity={2.5 * luz} color="#9ab8ff" />
          <Rama />
          <Mazorca position={[0.1, 0.05, 0]} rotation={[0, t * 0.35, Math.sin(t * 1.2) * 0.04]} />
          <LluviaGranos t={t} n={26} ancho={3} />
        </ThreeCanvas>
        <Texto>
          <Golpe t={t} desde={0} hasta={tDinero - 0.05} tam={big * 0.42} color={CREMA}>
            ¿Y SI TE DIJERA…
          </Golpe>
          <Golpe t={t} desde={tDinero - 0.08} hasta={s1 - 0.25} tam={big * 1.15} color={ORO}>
            EL DINERO
          </Golpe>
          <Golpe t={t} desde={tCrecia - 0.05} hasta={s1 - 0.25} tam={big * 0.55}>
            CRECÍA EN LOS ÁRBOLES
          </Golpe>
        </Texto>
      </>
    );
  } else if (t < s2) {
    // 2 · +500 AÑOS y vista explotada de la mazorca: los granos con su baba blanca
    const abre = suave(t, tCacao - 0.3, tCacao + 1.4);
    const anos = Math.round(interpolate(t, [Math.min(tQuin - 0.1, s1 + 0.15), Math.min(tQuin + 0.8, s1 + 1.1)], [0, 500], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }));
    escena = (
      <>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 60%, #3a1d0c 0%, #120804 55%, #040201 100%)' }} />
        <ThreeCanvas width={w} height={h} style={{ position: 'absolute', inset: 0 }} gl={{ alpha: true, antialias: true }}>
          <Estudio />
          <Camara pos={new THREE.Vector3(Math.sin((t - s1) * 0.3) * 2.2, 0.5, (5.4 + abre * 0.9) * zf)} mira={new THREE.Vector3(0, -0.1, 0)} fov={fov} w={w} h={h} tipo={tipo} />
          <ambientLight intensity={0.12} />
          <spotLight position={[2, 5, 4]} angle={0.55} penumbra={0.8} intensity={70} color="#ffe0b0" />
          <directionalLight position={[-3, 2, -4]} intensity={4} color="#ffae60" />
          <directionalLight position={[3, -1, -3]} intensity={2} color="#a0b8ff" />
          <Mazorca abre={abre} tallo={false} rotation={[0.9, (t - s1) * 0.25, Math.PI / 2 - 0.15]} position={[0, -0.1, 0]} />
        </ThreeCanvas>
        <Texto>
          <Golpe t={t} desde={s1 + 0.05} hasta={tSoco - 0.15} tam={big * 0.38}>
            HACE MÁS DE
          </Golpe>
          <Golpe t={t} desde={s1 + 0.05} hasta={tSoco - 0.15} tam={big * 1.5} color={ORO}>
            {anos} AÑOS
          </Golpe>
          <Golpe t={t} desde={tSoco - 0.1} hasta={s2 - 0.2} tam={big * 0.7} color={ORO}>
            SOCONUSCO
          </Golpe>
          <Sub t={t} desde={tCacao - 0.2} hasta={s2 - 0.2} tam={hor ? 52 : 56}>
            tenía el cacao más fino de Mesoamérica
          </Sub>
        </Texto>
      </>
    );
  } else if (t < s3) {
    // 3 · TRIBUTO: la ruta del cacao hasta Tenochtitlan
    escena = (
      <>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 60% 60%, #20140a 0%, #0b0704 60%, #030201 100%)' }} />
        <MapaTributo t={t} desde={s2} ruta={[tCobra, tTenoch + 0.4]} w={w} h={h} u={u} tipo={tipo} />
        <Texto>
          <Golpe t={t} desde={s2 + 0.05} hasta={s3 - 0.2} tam={big * 0.42}>
            LOS MEXICAS LO COBRABAN COMO
          </Golpe>
          <Golpe t={t} desde={W('tributo', s2, 12.6) - 0.1} hasta={s3 - 0.2} tam={big * 1.05} color={ORO}>
            TRIBUTO
          </Golpe>
          <Sub t={t} desde={tCargas - 0.1} hasta={s3 - 0.2}>
            cargas y cargas de granos, cruzando montañas
          </Sub>
        </Texto>
      </>
    );
  } else if (t < s4) {
    // 4 · SE GASTABA: cien granos caen y se amontonan = un guajolote
    const cuenta = Math.min(100, Math.max(0, Math.floor(((t - tCien + 0.1) / 1.3) * 100)));
    escena = (
      <>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 70%, #2e1708 0%, #0d0603 60%, #030101 100%)' }} />
        <ThreeCanvas width={w} height={h} style={{ position: 'absolute', inset: 0 }} gl={{ alpha: true, antialias: true }}>
          <Estudio />
          <Camara pos={new THREE.Vector3(Math.sin((t - s3) * 0.2) * 1.5, 2.1, (4.6 - (t - s3) * 0.08) * zf)} mira={new THREE.Vector3(0, 0.25, 0)} fov={fov} w={w} h={h} tipo={tipo} />
          <fog attach="fog" args={['#050302', 5, 13]} />
          <ambientLight intensity={0.1} />
          <spotLight position={[0, 6, 2]} angle={0.45} penumbra={0.8} intensity={55} color="#ffe2b8" />
          <directionalLight position={[-3, 2, -4]} intensity={3.5} color="#ffae60" />
          <directionalLight position={[4, 1, -2]} intensity={1.5} color="#a0b8ff" />
          {t < tCien + 0.4 && <LluviaGranos t={t} n={44} ancho={2.6} velocidad={1.3} />}
          <Monton t={t} desde={tCien - 0.1} dura={1.3} />
        </ThreeCanvas>
        <Texto>
          <Golpe t={t} desde={s3 + 0.05} hasta={tGasta - 0.1} tam={big * 0.5}>
            EL CACAO NO SOLO SE <span style={{ color: ORO }}>BEBÍA</span>
          </Golpe>
          <Golpe t={t} desde={tGasta - 0.08} hasta={tCien - 0.15} tam={big * 1.0} color={ORO}>
            SE GASTABA
          </Golpe>
          <Golpe t={t} desde={tCien - 0.1} hasta={s4 - 0.2} tam={big * 1.0} color={ORO}>
            {cuenta} GRANOS
          </Golpe>
          <Golpe t={t} desde={tGuaj - 0.1} hasta={s4 - 0.2} tam={big * 0.55}>
            = 1 GUAJOLOTE
          </Golpe>
          <Sub t={t} desde={tGuaj + 0.3} hasta={s4 - 0.2} tam={30}>
            Tarifa de precios de Tlaxcala, 1545
          </Sub>
        </Texto>
      </>
    );
  } else if (t < s5) {
    // 5 · Tierra volcánica al pie del Tacaná, amaneciendo; huerta en primer plano
    const l = t - s4;
    const cielo = cieloEntre('amanecer', 'dia', suave(t, s4, s5) * 0.6);
    escena = (
      <>
        <FondoCielo c={cielo} t={t} w={w} h={h} sol={[hor ? 0.72 : 0.7, hor ? 0.38 : 0.4]} bokeh={0} />
        <ThreeCanvas width={w} height={h} style={{ position: 'absolute', inset: 0 }} gl={{ alpha: true, antialias: true }}>
          <Estudio />
          <Camara pos={new THREE.Vector3(0.3 + l * 0.12, 1.6 + l * 0.12, 9 - l * 1.1)} mira={new THREE.Vector3(4, 9 + l * 0.3, -110)} fov={fov + 10} w={w} h={h} tipo={tipo} />
          <hemisphereLight args={[cielo.amb, '#2c3a1e', 1.2]} />
          <directionalLight position={[40, 14, -60]} intensity={3.2} color={cielo.luz} />
          <directionalLight position={[-20, 10, 20]} intensity={0.8} color="#ffe8c8" />
          <fog attach="fog" args={['#d9b49a', 25, 190]} />
          <Huerta t={t} luz={cielo.luz} bruma="#f3e2d0" />
        </ThreeCanvas>
        <div style={{ position: 'absolute', inset: 0, background: hor ? 'linear-gradient(90deg, rgba(0,0,0,.55), transparent 55%)' : 'linear-gradient(180deg, rgba(0,0,0,.55), transparent 40%)' }} />
        <Texto>
          <Golpe t={t} desde={s4 + 0.1} hasta={tFrutas - 0.15} tam={big * 0.75}>
            TIERRA VOLCÁNICA
          </Golpe>
          <Sub t={t} desde={tTacana - 0.2} hasta={tFrutas - 0.15}>
            al pie del volcán Tacaná
          </Sub>
          <Golpe t={t} desde={tFrutas - 0.1} hasta={s5 - 0.15} tam={big * 0.6}>
            FRUTAS QUE VALEN <span style={{ color: ORO }}>ORO</span>
          </Golpe>
        </Texto>
      </>
    );
  } else if (t < s6) {
    // 6 · el rambután en estudio, como producto premium
    const l = t - s5;
    escena = (
      <>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 58%, #4a0f14 0%, #1a0507 55%, #050102 100%)' }} />
        <ThreeCanvas width={w} height={h} style={{ position: 'absolute', inset: 0 }} gl={{ alpha: true, antialias: true }}>
          <Estudio />
          <Camara pos={new THREE.Vector3(0, 0.3, (6.5 - l * 0.35) * zf)} mira={new THREE.Vector3(0, 0, 0)} fov={fov} w={w} h={h} tipo={tipo} />
          <ambientLight intensity={0.15} />
          <spotLight position={[2, 5, 4]} angle={0.5} penumbra={0.8} intensity={70} color="#fff0d8" />
          <directionalLight position={[-3, 2, -4]} intensity={5} color="#ff8a6a" />
          <directionalLight position={[3, 1, -3]} intensity={3} color="#ffd59a" />
          <Rambutan escala={0.62} position={[0, -0.25, 0]} rotation={[0.3, l * 0.8, 0.1]} />
        </ThreeCanvas>
        <Texto>
          <Golpe t={t} desde={s5 + 0.05} hasta={s6 - 0.1} tam={big * 0.5}>
            COMO NUESTRO
          </Golpe>
          <Golpe t={t} desde={tRamb - 0.1} hasta={s6 - 0.1} tam={big * 1.0} color="#ff5a5a">
            RAMBUTÁN
          </Golpe>
          <Sub t={t} desde={tRamb + 0.2} hasta={s6 - 0.1}>
            de Tuxtla Chico, Chiapas
          </Sub>
        </Texto>
      </>
    );
  }

  return (
    <AbsoluteFill style={{ background: '#030201', overflow: 'hidden' }}>
      {escena}
      {destello > 0 && <div style={{ position: 'absolute', inset: 0, background: '#ffe6bf', opacity: destello * 0.55, mixBlendMode: 'screen' }} />}
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + Math.max(0, t - s6) * 0.004})` }}>
        <CierreSerie t={t} desde={s6} fondo="radial-gradient(circle at 50% 40%, #4a2612, #120804 75%)" />
      </div>
      {t > s6 + 1.5 && (
        // destello que barre la tarjeta cada pocos segundos para que no se sienta quieta
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(105deg, transparent ${((t - s6) * 22) % 160 - 40}%, rgba(255,230,180,.10) ${((t - s6) * 22) % 160 - 30}%, transparent ${((t - s6) * 22) % 160 - 20}%)` }} />
      )}
      <Pelicula frame={frame} w={w} h={h} />
      {voz && <Audio src={staticFile(`voz/${voz}/toma.mp3`)} />}
      {musica && <Audio src={staticFile(musica)} />}
    </AbsoluteFill>
  );
};
