import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { TITULO } from './comun';
import mundo from '../public/viaje/mundo.json';
import estados from '../public/viaje/estados.json';

// "Del espacio a la huerta": la cámara baja del espacio a México, al Soconusco y a la huerta de Ixchel
// en Tuxtla Chico, con HUD que marca latitud, longitud y altitud en tiempo real.

const MONO = '"DejaVu Sans Mono", monospace';
const CIAN = '#3ff4ff';
const ROSA = '#ff3d9a';
const NARANJA = '#ff9a3c';
// La Changuita, junto a la Zona Arqueológica de Izapa, Tuxtla Chico (aprox.)
const LAT = 14.928;
const LON = -92.178;

export const CORTES = [0, 3.5, 6.5, 10, 12.8]; // segundos: globo · mapa · huerta · ruta · llegada
export const DURACION = 15;

const rnd = (s: number) => {
  const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const ease = Easing.inOut(Easing.cubic);
const tr = (t: number, a: number, b: number, e = ease) => e(Math.min(1, Math.max(0, (t - a) / (b - a))));

// textura de brillo circular para halos (bloom falso, aditivo)
const halo = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.25, 'rgba(255,255,255,.55)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();

const Puntos: React.FC<{ pos: Float32Array; col: Float32Array; tam: number; opacidad?: number }> = ({ pos, col, tam, opacidad = 1 }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [pos, col]);
  return (
    <points geometry={geo}>
      <pointsMaterial size={tam} map={halo ?? undefined} vertexColors transparent opacity={opacidad} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
};

const Camara: React.FC<{ pos: THREE.Vector3; mira: THREE.Vector3; fov: number }> = ({ pos, mira, fov }) => {
  const { camera } = useThree();
  camera.position.copy(pos);
  (camera as THREE.PerspectiveCamera).fov = fov;
  (camera as THREE.PerspectiveCamera).near = 0.01;
  (camera as THREE.PerspectiveCamera).far = 500;
  camera.lookAt(mira);
  camera.updateProjectionMatrix();
  return null;
};

const enEsfera = (lat: number, lon: number, r: number) => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};

// ---------- mapas reales ----------
// Mundo: Natural Earth (world-atlas). Estados: @svg-maps/mexico (CC BY 4.0), en Mercator;
// lo alineamos con la caja real de México para poner los puntos en su lugar.

const svgMx = new SVGLoader().parse(`<svg>${estados.estados.map((e) => `<path id="${e.id}" name="${e.nombre}" d="${e.d}"/>`).join('')}</svg>`);
const MX = { lon0: -118.4, lon1: -86.7, lat0: 14.53, lat1: 32.72 };
const caja = new THREE.Box2();
svgMx.paths.forEach((p) => p.subPaths.forEach((sp) => sp.getPoints().forEach((v) => caja.expandByPoint(v))));
const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const ESC = 0.05;
const centro = caja.getCenter(new THREE.Vector2());
// lat/lon → plano del mapa (x, z)
export const enMapa = (lat: number, lon: number) => {
  const x = caja.min.x + ((lon - MX.lon0) / (MX.lon1 - MX.lon0)) * (caja.max.x - caja.min.x);
  const y = caja.max.y - ((merc(lat) - merc(MX.lat0)) / (merc(MX.lat1) - merc(MX.lat0))) * (caja.max.y - caja.min.y);
  return new THREE.Vector3((x - centro.x) * ESC, 0, (y - centro.y) * ESC);
};
// plano del mapa → lat/lon (para dibujar Chiapas sobre el globo)
const aLatLon = (v: THREE.Vector2) => {
  const lon = MX.lon0 + ((v.x - caja.min.x) / (caja.max.x - caja.min.x)) * (MX.lon1 - MX.lon0);
  const m = merc(MX.lat0) + ((caja.max.y - v.y) / (caja.max.y - caja.min.y)) * (merc(MX.lat1) - merc(MX.lat0));
  const lat = (2 * Math.atan(Math.exp(m)) - Math.PI / 2) * (180 / Math.PI);
  return [lat, lon];
};
const esChiapas = (p: { userData?: { node?: Element } }) => /chiapas/i.test(p.userData?.node?.getAttribute('name') ?? '');

const CIUDADES: [number, number, number][] = [
  [19.43, -99.13, 3], [20.67, -103.35, 2], [25.69, -100.32, 2], [19.04, -98.2, 1.5], [32.51, -117.04, 1.6], [21.16, -86.85, 1.2],
  [20.97, -89.62, 1.3], [16.75, -93.12, 1.4], [14.9, -92.26, 1.3], [16.74, -92.64, 1], [17.99, -92.93, 1.2], [17.06, -96.72, 1],
  [19.17, -96.13, 1.2], [21.88, -102.29, 1], [22.15, -100.98, 1], [24.8, -107.39, 1], [29.07, -110.96, 1.1], [28.63, -106.07, 1.2],
  [31.69, -106.42, 1.3], [20.59, -100.39, 1.2], [16.85, -99.88, 1.1], [18.92, -99.23, 1], [19.7, -101.19, 1], [23.25, -106.41, 1],
];

const lineaGeo = (rings: number[][], aV: (lat: number, lon: number) => THREE.Vector3) => {
  const pts: number[] = [];
  rings.forEach((r) => {
    for (let i = 0; i + 3 < r.length; i += 2) {
      const a = aV(r[i + 1], r[i]);
      const b = aV(r[i + 3], r[i + 2]);
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
};

// ---------- escena 1: globo ----------

const atmosfera = new THREE.ShaderMaterial({
  uniforms: { c: { value: new THREE.Color(CIAN) } },
  vertexShader: `varying vec3 n; varying vec3 v; void main(){ n=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); v=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 c; varying vec3 n; varying vec3 v; void main(){ float f=pow(1.0-abs(dot(n,v)),2.6); gl_FragColor=vec4(c*f*1.6, f); }`,
  side: THREE.BackSide,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});
const borde = new THREE.ShaderMaterial({
  uniforms: { c: { value: new THREE.Color('#1aa8ff') } },
  vertexShader: `varying vec3 n; varying vec3 v; void main(){ n=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); v=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 c; varying vec3 n; varying vec3 v; void main(){ float f=pow(1.0-dot(n,v),3.0); vec3 base=vec3(0.01,0.06,0.18); gl_FragColor=vec4(base+c*f*0.9,1.); }`,
});

const Globo: React.FC<{ t: number }> = ({ t }) => {
  const d = useMemo(() => {
    const p: number[] = [];
    const c: number[] = [];
    const azul = new THREE.Color('#2f8cff');
    const mx = new THREE.Color('#7ff6ff');
    for (let i = 0; i < mundo.puntos.length; i += 2) {
      const lon = mundo.puntos[i];
      const lat = mundo.puntos[i + 1];
      const v = enEsfera(lat, lon, 2.005);
      p.push(v.x, v.y, v.z);
      const enMx = lat > 14 && lat < 33 && lon > -118 && lon < -86;
      const col = enMx ? mx : azul;
      c.push(col.r, col.g, col.b);
    }
    const luces: number[] = [];
    const lc: number[] = [];
    CIUDADES.forEach(([la, lo]) => {
      const v = enEsfera(la, lo, 2.012);
      luces.push(v.x, v.y, v.z);
      const col = new THREE.Color(NARANJA);
      lc.push(col.r, col.g, col.b);
    });
    const chiapas: number[][] = [];
    svgMx.paths.filter(esChiapas).forEach((pa) => pa.subPaths.forEach((sp) => chiapas.push(sp.getPoints().flatMap((v) => { const [la, lo] = aLatLon(v); return [lo, la]; }))));
    return {
      tierra: { pos: new Float32Array(p), col: new Float32Array(c) },
      luces: { pos: new Float32Array(luces), col: new Float32Array(lc) },
      bordes: lineaGeo(mundo.bordes, (la, lo) => enEsfera(la, lo, 2.004)),
      mexico: lineaGeo(mundo.mexico, (la, lo) => enEsfera(la, lo, 2.008)),
      chiapas: lineaGeo(chiapas, (la, lo) => enEsfera(la, lo, 2.012)),
    };
  }, []);
  const lonFrente = interpolate(t, [0, 3.5], [-40, LON + 6], { easing: Easing.out(Easing.cubic) });
  const latFrente = interpolate(t, [0, 3.5], [8, LAT + 4], { easing: Easing.out(Easing.cubic) });
  const meta = enEsfera(latFrente, lonFrente, 1).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(meta, new THREE.Vector3(0, 0, 1));
  const pin = enEsfera(LAT, LON, 2.03);
  const late = 0.6 + 0.4 * Math.sin(t * 9);
  return (
    <group quaternion={q}>
      <mesh material={borde}>
        <sphereGeometry args={[2, 96, 64]} />
      </mesh>
      <Puntos pos={d.tierra.pos} col={d.tierra.col} tam={0.035} opacidad={0.9} />
      <lineSegments geometry={d.bordes}>
        <lineBasicMaterial color="#5fb8ff" transparent opacity={0.35} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <lineSegments geometry={d.mexico}>
        <lineBasicMaterial color={CIAN} />
      </lineSegments>
      <lineSegments geometry={d.chiapas}>
        <lineBasicMaterial color={ROSA} />
      </lineSegments>
      <Puntos pos={d.luces.pos} col={d.luces.col} tam={0.12} />
      <mesh material={atmosfera} scale={1.18}>
        <sphereGeometry args={[2, 64, 48]} />
      </mesh>
      <sprite position={pin} scale={0.3 * late}>
        <spriteMaterial map={halo ?? undefined} color={ROSA} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  );
};

// ---------- escena 2: mapa del sur de México ----------

export const PIN_MAPA = (() => enMapa(LAT, LON))();
const Mapa: React.FC<{ t: number }> = ({ t }) => {
  const d = useMemo(() => {
    const otros: THREE.Shape[] = [];
    const chis: THREE.Shape[] = [];
    const bordes: number[] = [];
    const bordesCh: number[] = [];
    svgMx.paths.forEach((pa) => {
      const ch = esChiapas(pa);
      SVGLoader.createShapes(pa).forEach((sh) => (ch ? chis : otros).push(sh));
      pa.subPaths.forEach((sp) => {
        const pts = sp.getPoints();
        for (let i = 0; i + 1 < pts.length; i++) {
          const a = pts[i];
          const b = pts[i + 1];
          (ch ? bordesCh : bordes).push((a.x - centro.x) * ESC, 0.02, (a.y - centro.y) * ESC, (b.x - centro.x) * ESC, 0.02, (b.y - centro.y) * ESC);
        }
      });
    });
    const plano = (shapes: THREE.Shape[]) => {
      const g = new THREE.ShapeGeometry(shapes);
      g.translate(-centro.x, -centro.y, 0);
      g.scale(ESC, ESC, 1);
      g.rotateX(Math.PI / 2);
      return g;
    };
    const lg = (a: number[]) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
      return g;
    };
    // luces: ciudades reales y pueblos alrededor
    const p: number[] = [];
    const c: number[] = [];
    CIUDADES.forEach(([la, lo, k], n) => {
      for (let i = 0; i < 70 * k; i++) {
        const r = Math.pow(rnd(i * 13 + n), 2) * 0.35 * k;
        const a = rnd(i * 7 + n * 3) * Math.PI * 2;
        const v = enMapa(la + Math.sin(a) * r, lo + Math.cos(a) * r);
        p.push(v.x, 0.05, v.z);
        const col = new THREE.Color(rnd(i + n * 5) > 0.6 ? NARANJA : '#bff4ff');
        c.push(col.r, col.g, col.b);
      }
    });
    return { otros: plano(otros), chis: plano(chis), bordes: lg(bordes), bordesCh: lg(bordesCh), luces: { pos: new Float32Array(p), col: new Float32Array(c) } };
  }, []);
  const brillo = tr(t, 0.8, 1.8);
  const late = 0.7 + 0.3 * Math.sin(t * 10);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial color="#010714" />
      </mesh>
      <mesh geometry={d.otros}>
        <meshBasicMaterial color="#0b2f6b" side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={d.chis} position={[0, 0.005, 0]}>
        <meshBasicMaterial color={new THREE.Color('#0b2f6b').lerp(new THREE.Color('#13c8e8'), 0.2 + brillo * 0.35)} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments geometry={d.bordes}>
        <lineBasicMaterial color="#3f8dff" transparent opacity={0.6} />
      </lineSegments>
      <lineSegments geometry={d.bordesCh} position={[0, 0.01, 0]}>
        <lineBasicMaterial color={CIAN} />
      </lineSegments>
      <Puntos pos={d.luces.pos} col={d.luces.col} tam={0.22} />
      <sprite position={[PIN_MAPA.x, 0.1, PIN_MAPA.z]} scale={1.4 * late}>
        <spriteMaterial map={halo ?? undefined} color={ROSA} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  );
};

// ---------- escenas 3-5: la huerta ----------

const PASO = 2.2; // separación entre árboles
const N = 13;
const RUTA = [
  new THREE.Vector3(-14, 0.08, 14),
  new THREE.Vector3(-6.6, 0.08, 8.8),
  new THREE.Vector3(-1.1, 0.08, 8.8),
  new THREE.Vector3(-1.1, 0.08, 3.3),
  new THREE.Vector3(3.3, 0.08, 3.3),
  new THREE.Vector3(3.3, 0.08, -1.1),
];
export const PIN = RUTA[RUTA.length - 1];

const Huerta: React.FC<{ t: number; ruta: number; columna: number }> = ({ t, ruta, columna }) => {
  const d = useMemo(() => {
    const arboles: THREE.Matrix4[] = [];
    const frutas: number[] = [];
    const fc: number[] = [];
    for (let i = -N; i <= N; i++)
      for (let j = -N; j <= N; j++) {
        // calles cada 5 árboles (para el camión)
        if (i % 5 === 0 || j % 4 === 0) continue;
        const x = i * PASO + (rnd(i * 31 + j) - 0.5) * 0.4;
        const z = j * PASO + (rnd(j * 17 + i) - 0.5) * 0.4;
        const s = 0.85 + rnd(i * 7 + j * 3) * 0.35;
        arboles.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 1.1 * s, z), new THREE.Quaternion(), new THREE.Vector3(s, s * 0.8, s)));
        // rambutanes encendidos en la copa
        for (let k = 0; k < 14; k++) {
          const a = rnd(i * 100 + j * 10 + k) * Math.PI * 2;
          const h = rnd(k * 3 + i + j * 7);
          frutas.push(x + Math.cos(a) * 0.95 * s, (0.7 + h * 0.9) * s, z + Math.sin(a) * 0.95 * s);
          const c = new THREE.Color(rnd(k + i * j) > 0.4 ? '#ff3b4f' : NARANJA);
          fc.push(c.r, c.g, c.b);
        }
      }
    const copas = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshStandardMaterial({ color: '#1f7a5c', roughness: 0.8, emissive: '#0e4a40', emissiveIntensity: 0.9 }), arboles.length);
    arboles.forEach((m, i) => copas.setMatrixAt(i, m));
    // luciérnagas / lámparas rosas y naranjas sobre las calles
    const lp: number[] = [];
    const lc: number[] = [];
    for (let i = 0; i < 1600; i++) {
      const enX = rnd(i * 1.3) > 0.5;
      const calle = (Math.floor(rnd(i * 2.9) * 6) - 3) * (enX ? 5 : 4) * PASO;
      const largo = (rnd(i * 4.4) - 0.5) * 2 * N * PASO;
      lp.push(enX ? calle : largo, 0.15 + rnd(i) * 0.6, enX ? largo : calle);
      const c = new THREE.Color(rnd(i * 8.1) > 0.5 ? ROSA : NARANJA);
      lc.push(c.r, c.g, c.b);
    }
    // calles brillantes
    const ca: number[] = [];
    for (let k = -3; k <= 3; k++) {
      const x = k * 5 * PASO;
      ca.push(x, 0.02, -N * PASO, x, 0.02, N * PASO);
      const z = k * 4 * PASO;
      ca.push(-N * PASO, 0.02, z, N * PASO, 0.02, z);
    }
    const calles = new THREE.BufferGeometry();
    calles.setAttribute('position', new THREE.Float32BufferAttribute(ca, 3));
    const carretera = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(-34, 0.06, 27.9), new THREE.Vector3(34, 0.06, -19.9)), 2, 0.32, 8, false);
    const curva = new THREE.CatmullRomCurve3(RUTA, false, 'catmullrom', 0.05);
    const tubo = new THREE.TubeGeometry(curva, 400, 0.09, 8, false);
    const tuboGlow = new THREE.TubeGeometry(curva, 400, 0.32, 8, false);
    return { copas, frutas: { pos: new Float32Array(frutas), col: new Float32Array(fc) }, luces: { pos: new Float32Array(lp), col: new Float32Array(lc) }, calles, curva, tubo, tuboGlow, carretera };
  }, []);
  const total = d.tubo.index!.count;
  d.tubo.setDrawRange(0, Math.floor((total * ruta) / 3) * 3);
  d.tuboGlow.setDrawRange(0, Math.floor((d.tuboGlow.index!.count * ruta) / 3) * 3);
  const cabeza = d.curva.getPointAt(Math.min(0.999, Math.max(0.001, ruta)));
  const late = 0.75 + 0.25 * Math.sin(t * 8);
  return (
    <group>
      <ambientLight intensity={0.9} color="#6f9bff" />
      <directionalLight position={[10, 20, 5]} intensity={1.4} color="#9fd0ff" />
      <directionalLight position={[-8, 6, -10]} intensity={1.0} color={NARANJA} />
      <pointLight position={[PIN.x, 3, PIN.z]} intensity={columna * 40} distance={14} color={ROSA} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#031028" roughness={1} />
      </mesh>
      <lineSegments geometry={d.calles}>
        <lineBasicMaterial color={NARANJA} transparent opacity={0.55} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <mesh geometry={d.carretera}>
        <meshBasicMaterial color={NARANJA} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* Zona Arqueológica de Izapa: montículo escalonado */}
      <group position={[8.8, 0, 5.5]}>
        {[0, 1, 2, 3].map((k) => (
          <mesh key={k} position={[0, 0.25 + k * 0.5, 0]}>
            <boxGeometry args={[3.4 - k * 0.8, 0.5, 3.4 - k * 0.8]} />
            <meshStandardMaterial color="#8a6cff" emissive="#4a2fd0" emissiveIntensity={0.8} />
          </mesh>
        ))}
        <sprite position={[0, 2.6, 0]} scale={2.2}>
          <spriteMaterial map={halo ?? undefined} color="#a98bff" blending={THREE.AdditiveBlending} depthWrite={false} />
        </sprite>
      </group>
      <primitive object={d.copas} />
      <Puntos pos={d.frutas.pos} col={d.frutas.col} tam={0.42} />
      <Puntos pos={d.luces.pos} col={d.luces.col} tam={0.35} opacidad={0.8} />
      {ruta > 0 && (
        <>
          <mesh geometry={d.tubo}>
            <meshBasicMaterial color={CIAN} />
          </mesh>
          <mesh geometry={d.tuboGlow}>
            <meshBasicMaterial color={CIAN} transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <sprite position={cabeza} scale={1.4}>
            <spriteMaterial map={halo ?? undefined} color={CIAN} blending={THREE.AdditiveBlending} depthWrite={false} />
          </sprite>
        </>
      )}
      {/* pin */}
      <group position={[PIN.x, 0, PIN.z]}>
        <mesh position={[0, 0.9 + Math.sin(t * 4) * 0.08, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.32, 0.8, 24]} />
          <meshBasicMaterial color={ROSA} />
        </mesh>
        <mesh position={[0, 1.4 + Math.sin(t * 4) * 0.08, 0]}>
          <sphereGeometry args={[0.36, 24, 16]} />
          <meshBasicMaterial color={ROSA} />
        </mesh>
        <sprite position={[0, 1.2, 0]} scale={2.6 * late}>
          <spriteMaterial map={halo ?? undefined} color={ROSA} blending={THREE.AdditiveBlending} depthWrite={false} />
        </sprite>
        {/* anillo en el piso */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} scale={1 + ((t * 0.8) % 1) * 2}>
          <ringGeometry args={[0.6, 0.75, 48]} />
          <meshBasicMaterial color={ROSA} transparent opacity={1 - ((t * 0.8) % 1)} blending={THREE.AdditiveBlending} />
        </mesh>
        {/* columna de luz */}
        {columna > 0 && (
          <>
            <mesh position={[0, (40 * columna) / 2, 0]} scale={[1, columna, 1]}>
              <cylinderGeometry args={[0.35, 0.35, 40, 24, 1, true]} />
              <meshBasicMaterial color={ROSA} transparent opacity={0.85} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
            <mesh position={[0, (40 * columna) / 2, 0]} scale={[1, columna, 1]}>
              <cylinderGeometry args={[1.2, 1.2, 40, 24, 1, true]} />
              <meshBasicMaterial color={ROSA} transparent opacity={0.18} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
};

// ---------- HUD ----------

const fmt = (n: number, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const coord = (lat: number, lon: number) => `${fmt(Math.abs(lat), 4)}° ${lat >= 0 ? 'N' : 'S'}   ${fmt(Math.abs(lon), 4)}° ${lon >= 0 ? 'E' : 'W'}`;

const Esquina: React.FC<{ s: React.CSSProperties }> = ({ s }) => <div style={{ position: 'absolute', width: 60, height: 60, borderColor: CIAN, borderStyle: 'solid', opacity: 0.8, ...s }} />;

const Aberrado: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ textShadow: `-4px 0 rgba(255,40,120,.75), 4px 0 rgba(40,240,255,.75)`, ...style }}>{children}</div>
);

export const Viaje: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const esc = CORTES.filter((c) => t >= c).length - 1;
  const local = t - CORTES[esc];

  // datos que cambian en vivo
  const vuelo = tr(t, 0, 12.8, Easing.inOut(Easing.quad));
  const lat = interpolate(tr(t, 0, 10, Easing.out(Easing.cubic)), [0, 1], [0, LAT]);
  const lon = interpolate(tr(t, 0, 10, Easing.out(Easing.cubic)), [0, 1], [-20, LON]);
  const alt = Math.max(0.12, 28078 * Math.pow(1 - vuelo, 3.2));

  // cámara por escena
  let pos = new THREE.Vector3(0, 0, 9);
  let mira = new THREE.Vector3();
  let fov = 40;
  if (esc === 0) {
    pos = new THREE.Vector3(0, 0, interpolate(local, [0, 3.5], [9.5, 4.2], { easing: Easing.in(Easing.cubic) }));
  } else if (esc === 1) {
    const k = tr(local, 0, 3, Easing.inOut(Easing.cubic));
    const foco = new THREE.Vector3(0, 0, 0).lerp(PIN_MAPA, k);
    const y = interpolate(k, [0, 1], [46, 8]);
    pos = new THREE.Vector3(foco.x, y, foco.z + y * 0.45);
    mira = foco;
    fov = 50;
  } else if (esc === 2) {
    const y = interpolate(local, [0, 3.5], [48, 11], { easing: Easing.out(Easing.cubic) });
    const a = interpolate(local, [0, 3.5], [0.9, 0.35]);
    pos = new THREE.Vector3(Math.sin(a) * y * 0.5, y, Math.cos(a) * y * 0.55);
    mira = new THREE.Vector3(0, 0, 0);
    fov = 50;
  } else if (esc === 3) {
    const r = tr(local, 0, 2.6);
    const cab = new THREE.CatmullRomCurve3(RUTA, false, 'catmullrom', 0.05).getPointAt(Math.min(0.999, r * 0.95 + 0.001));
    pos = new THREE.Vector3(cab.x - 6, 10, cab.z + 9);
    mira = cab.clone();
    fov = 50;
  } else {
    const a = 0.6 + local * 0.35;
    const r = interpolate(local, [0, 2.2], [13, 9], { easing: Easing.out(Easing.cubic) });
    pos = new THREE.Vector3(PIN.x + Math.sin(a) * r, interpolate(local, [0, 2.2], [9, 5]), PIN.z + Math.cos(a) * r);
    mira = new THREE.Vector3(PIN.x, 2.5, PIN.z);
    fov = 50;
  }
  const ruta = esc === 3 ? tr(local, 0, 2.6) : esc === 4 ? 1 : 0;
  const columna = esc === 4 ? tr(local, 0.1, 1.0, Easing.out(Easing.exp)) : 0;
  const flash = Math.max(...CORTES.slice(1).map((c) => (t >= c && t < c + 0.25 ? 1 - (t - c) / 0.25 : 0)), 0);
  const tiembla = flash * 10;

  // panel de navegación
  const panel = esc === 3 ? tr(local, 0.2, 0.7, Easing.out(Easing.exp)) : esc === 4 ? 1 - tr(local, 0, 0.4) : 0;
  const titulo = (txt: string, sub: string, desde: number, top = 330) => {
    const a = tr(local, desde, desde + 0.5, Easing.out(Easing.exp));
    return (
      <div style={{ position: 'absolute', left: 60, right: 60, top, textAlign: 'center', opacity: a, transform: `translateY(${(1 - a) * 40}px) scale(${1.08 - 0.08 * a})`, letterSpacing: (1 - a) * 30 }}>
        <Aberrado style={{ fontFamily: TITULO, fontSize: 150, color: 'white', lineHeight: 0.9 }}>{txt}</Aberrado>
        <div style={{ fontFamily: MONO, fontSize: 30, color: CIAN, marginTop: 18, letterSpacing: 4 }}>{sub}</div>
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${(rnd(frame) - 0.5) * tiembla}px, ${(rnd(frame + 9) - 0.5) * tiembla}px)` }}>
        <ThreeCanvas width={width} height={height} linear camera={{ fov: 40, position: [0, 0, 9] }}>
          <Camara pos={pos} mira={mira} fov={fov} />
          {esc === 0 && (
            <>
              <Globo t={local} />
              <Puntos pos={ESTRELLAS.pos} col={ESTRELLAS.col} tam={0.12} opacidad={0.7} />
            </>
          )}
          {esc === 1 && <Mapa t={local} />}
          {esc >= 2 && <Huerta t={t} ruta={ruta} columna={columna} />}
        </ThreeCanvas>
      </AbsoluteFill>

      {/* viñeta y velo frío */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,4,20,.75) 100%)' }} />

      {/* HUD */}
      <Esquina s={{ left: 40, top: 40, borderWidth: '4px 0 0 4px' }} />
      <Esquina s={{ right: 40, top: 40, borderWidth: '4px 4px 0 0' }} />
      <Esquina s={{ left: 40, bottom: 40, borderWidth: '0 0 4px 4px' }} />
      <Esquina s={{ right: 40, bottom: 40, borderWidth: '0 4px 4px 0' }} />
      <div style={{ position: 'absolute', left: 80, top: 90, fontFamily: MONO, color: CIAN, fontSize: 26, lineHeight: 1.5 }}>
        <div style={{ opacity: 0.6 }}>LAT / LON</div>
        <div style={{ color: 'white', fontSize: 30 }}>{coord(lat, lon)}</div>
      </div>
      <div style={{ position: 'absolute', right: 80, top: 90, fontFamily: MONO, color: CIAN, fontSize: 26, lineHeight: 1.5, textAlign: 'right' }}>
        <div style={{ opacity: 0.6 }}>ALTITUD</div>
        <div style={{ color: 'white', fontSize: 44 }}>
          {alt >= 10 ? fmt(alt) : fmt(alt, 2)} <span style={{ fontSize: 26, color: CIAN }}>km</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 80, top: 210, fontFamily: MONO, color: NARANJA, fontSize: 22, letterSpacing: 3 }}>
        ● {['ÓRBITA', 'SURESTE DE MÉXICO', 'TUXTLA CHICO · CHIAPAS', 'CARRETERA 200 → HUERTA', 'DESTINO: HUERTA IXCHEL'][esc]}
      </div>
      {/* regla de escala */}
      {esc < 3 && (
        <div style={{ position: 'absolute', left: 80, bottom: 90, fontFamily: MONO, color: CIAN, fontSize: 22 }}>
          <div style={{ width: 240, height: 14, borderLeft: `3px solid ${CIAN}`, borderRight: `3px solid ${CIAN}`, borderBottom: `3px solid ${CIAN}` }} />
          <div style={{ marginTop: 8 }}>{fmt(Math.max(0.05, alt / 6), alt / 6 >= 10 ? 0 : 2)} km</div>
        </div>
      )}

      {esc === 1 && titulo('CHIAPAS', 'SOCONUSCO · MÉXICO', 0.9, 330)}
      {esc === 2 && titulo('LA CHANGUITA', 'JUNTO A IZAPA · TUXTLA CHICO', 0.6, 330)}

      {/* panel de navegación */}
      {panel > 0 && (
        <div style={{ position: 'absolute', left: 60, right: 60, bottom: 90, transform: `translateY(${(1 - panel) * 300}px)`, opacity: panel, background: 'rgba(3,16,40,.82)', border: `2px solid ${CIAN}55`, borderRadius: 28, padding: '34px 44px', display: 'flex', alignItems: 'center', gap: 34 }}>
          <div style={{ width: 120, height: 120, borderRadius: 24, background: `${CIAN}22`, display: 'grid', placeItems: 'center', fontSize: 80, color: CIAN, fontFamily: TITULO }}>↱</div>
          <div>
            <div style={{ fontFamily: TITULO, fontSize: 110, color: 'white', lineHeight: 0.9 }}>POR TONELADA</div>
            <div style={{ fontFamily: MONO, fontSize: 30, color: CIAN, marginTop: 10 }}>por la Carretera 200 · carga en la huerta</div>
          </div>
        </div>
      )}

      {/* llegada */}
      {esc === 4 && (
        <>
          {titulo('IXCHEL', 'FRUTAS DEL SOCONUSCO', 0.3, 300)}
          <div style={{ position: 'absolute', left: 60, right: 60, bottom: 110, textAlign: 'center', opacity: tr(local, 0.8, 1.3) }}>
            <div style={{ fontFamily: 'DejaVu Sans', fontSize: 40, color: 'white' }}>Huerta de rambután · La Changuita, Izapa · Tuxtla Chico</div>
            <div style={{ fontFamily: MONO, fontSize: 26, color: CIAN, marginTop: 14 }}>{coord(LAT, LON)}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 20, marginTop: 34, padding: '14px 40px 8px', borderRadius: 60, background: ROSA, color: 'white', fontFamily: TITULO, fontSize: 84, letterSpacing: 2 }}>
              <Img src={staticFile('logo.svg')} style={{ width: 70, background: '#fff4dc', borderRadius: '50%', padding: 4, marginTop: -6 }} />
              WA 962 269 9611
            </div>
          </div>
        </>
      )}

      {/* golpe de luz en cada corte */}
      <AbsoluteFill style={{ background: 'white', opacity: flash * 0.65, mixBlendMode: 'screen' }} />
      {/* grano */}
      <AbsoluteFill style={{ opacity: 0.09, mixBlendMode: 'overlay' }}>
        <svg width="100%" height="100%">
          <filter id="g">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 30} />
          </filter>
          <rect width="100%" height="100%" filter="url(#g)" />
        </svg>
      </AbsoluteFill>
      <Audio src={staticFile('viaje/musica.wav')} />
    </AbsoluteFill>
  );
};

const ESTRELLAS = (() => {
  const p: number[] = [];
  const c: number[] = [];
  for (let i = 0; i < 1500; i++) {
    const v = new THREE.Vector3(rnd(i) - 0.5, rnd(i * 2.3) - 0.5, rnd(i * 4.7) - 0.5).normalize().multiplyScalar(60);
    p.push(v.x, v.y, v.z);
    const b = 0.3 + rnd(i * 9) * 0.7;
    c.push(b * 0.8, b * 0.9, b);
  }
  return { pos: new Float32Array(p), col: new Float32Array(c) };
})();
