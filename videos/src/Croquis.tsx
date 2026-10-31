import React, { useMemo } from 'react';
import * as THREE from 'three';

// Croquis 3D de Tuxtla Chico (trazado a mano sobre el mapa que mandó Alex) con el volcán Tacaná al fondo.
// Unidades: 1 = 1 km. Origen en el centro de Tuxtla Chico; x hacia el este, z hacia el sur.
// El Tacaná (estratovolcán, 4,060 m, en la frontera con Guatemala) queda ~21 km al norte y ~6 km al este.

const PX = (x: number, y: number) => new THREE.Vector3((x - 668) / 75, 0, (y - 292) / 75);
export const IZAPA = PX(518, 438);
export const CHANGUITA = PX(498, 456);
export const TUXTLA = PX(668, 292);
export const TACANA = new THREE.Vector3(6.3, 0, -21);
export const ALTO_TACANA = 4.06;

const rnd = (s: number) => {
  const x = Math.sin(s * 78.233 + 1.7) * 43758.5453;
  return x - Math.floor(x);
};
const ruido = (x: number, z: number) => Math.sin(x * 1.3 + Math.sin(z * 0.7)) * Math.cos(z * 1.1 - x * 0.4) * 0.5 + Math.sin(x * 3.1 + z * 2.3) * 0.25;

// trazos del croquis, en píxeles del mapa
export const CARRETERA_200 = [[0, 800], [90, 735], [240, 640], [380, 555], [455, 505], [540, 462], [640, 405], [720, 350], [745, 300], [760, 230], [800, 150], [850, 30], [865, -40]];
const RAMAL_SUR = [[380, 555], [378, 700], [380, 830]];
const AL_CENTRO = [[750, 262], [700, 250], [650, 240], [610, 190], [570, 110], [545, -40]];
const SUCHIATE = [[870, -40], [885, 60], [905, 160], [945, 300], [905, 360], [890, 430], [935, 500], [925, 600], [975, 700], [1030, 830]];
const CAHOA = [[440, -40], [455, 80], [410, 230], [330, 340], [230, 405], [100, 430], [-60, 450]];
const CALLES: number[][][] = [];
for (let i = 0; i < 8; i++) CALLES.push([[600 + i * 20, 185], [585 + i * 20, 370]]);
for (let j = 0; j < 7; j++) CALLES.push([[585, 200 + j * 25], [760 - j * 8, 190 + j * 26]]);

const linea = (pts: number[][], alto = 0.02) => new THREE.CatmullRomCurve3(pts.map(([x, y]) => PX(x, y).setY(alto)));

const Trazo: React.FC<{ pts: number[][]; color: string; ancho: number; avance: number; brillo?: number }> = ({ pts, color, ancho, avance, brillo = 1 }) => {
  const geo = useMemo(() => new THREE.TubeGeometry(linea(pts), 200, ancho, 6, false), [pts, ancho]);
  const total = geo.index!.count;
  geo.setDrawRange(0, Math.floor((total * Math.min(1, Math.max(0, avance))) / 6) * 6);
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial color={new THREE.Color(color).multiplyScalar(brillo)} toneMapped={false} />
    </mesh>
  );
};

// volcán: cono con cañadas radiales, cráter y nieve/roca arriba, selva abajo
const volcanGeo = (() => {
  const g = new THREE.PlaneGeometry(26, 26, 220, 220);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  const col: number[] = [];
  const selva = new THREE.Color('#1f4a24');
  const pasto = new THREE.Color('#5b6b36');
  const roca = new THREE.Color('#6e655c');
  const cima = new THREE.Color('#b9b2a8');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    const a = Math.atan2(z, x);
    let h = ALTO_TACANA * Math.pow(Math.max(0, 1 - r / 11), 1.6);
    h += Math.max(0, 1 - r / 11) * (0.18 * Math.sin(a * 23 + r * 0.6) + 0.1 * Math.sin(a * 41 - r)) * Math.min(1, r / 2); // cañadas
    h -= Math.max(0, 0.35 - r) * 0.6; // cráter
    h += ruido(x * 0.5, z * 0.5) * 0.15;
    // flanco hermano (el volcán tiene domos al lado)
    h += 1.1 * Math.pow(Math.max(0, 1 - Math.hypot(x + 3, z - 1.5) / 4), 2);
    pos.setY(i, Math.max(0, h));
    const k = h / ALTO_TACANA;
    const c = k < 0.35 ? selva.clone().lerp(pasto, k / 0.35) : k < 0.75 ? pasto.clone().lerp(roca, (k - 0.35) / 0.4) : roca.clone().lerp(cima, (k - 0.75) / 0.25);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
})();

// suelo ondulado del Soconusco alrededor del croquis
const sueloGeo = (() => {
  const g = new THREE.PlaneGeometry(60, 60, 160, 160);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const lejos = Math.min(1, Math.max(0, (Math.hypot(x, z - 2) - 8) / 10));
    pos.setY(i, -0.02 + ruido(x * 0.4, z * 0.4) * 0.25 * lejos);
  }
  g.computeVertexNormals();
  return g;
})();

const Arbolitos: React.FC = () => {
  const m = useMemo(() => {
    const n = 4200;
    const malla = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#2f6b32', roughness: 0.9, flatShading: true }), n);
    const mat = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const x = (rnd(i) - 0.5) * 22;
      const z = (rnd(i * 2) - 0.5) * 18 + 1;
      if (Math.hypot(x - 0, z - 0.3) < 1.6) {
        malla.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0)); // centro del pueblo: sin árboles
        continue;
      }
      const s = 0.035 + rnd(i * 3) * 0.05;
      mat.compose(new THREE.Vector3(x, s * 0.6, z), new THREE.Quaternion(), new THREE.Vector3(s, s * 0.8, s));
      malla.setMatrixAt(i, mat);
    }
    return malla;
  }, []);
  return <primitive object={m} />;
};

export const Croquis: React.FC<{ dibujo: number; pin: number; t: number }> = ({ dibujo, pin, t }) => (
  <group>
    <mesh geometry={sueloGeo}>
      <meshStandardMaterial color="#29502c" roughness={0.95} />
    </mesh>
    <Arbolitos />
    {/* mancha urbana de Tuxtla Chico */}
    <mesh position={[TUXTLA.x - 0.05, 0.01, TUXTLA.z + 0.2]} rotation={[-Math.PI / 2, 0, 0.15]}>
      <planeGeometry args={[2.4, 2.4]} />
      <meshBasicMaterial color="#2a3b46" transparent opacity={0.7 * Math.min(1, dibujo * 2)} />
    </mesh>
    {CALLES.map((c, i) => (
      <Trazo key={i} pts={c} color="#9fb4c4" ancho={0.008} avance={dibujo * 1.6 - 0.3 - i * 0.02} brillo={0.6} />
    ))}
    <Trazo pts={CARRETERA_200} color="#ff9a3c" ancho={0.035} avance={dibujo * 1.3} brillo={1.6} />
    <Trazo pts={RAMAL_SUR} color="#ff9a3c" ancho={0.022} avance={dibujo * 1.3 - 0.3} />
    <Trazo pts={AL_CENTRO} color="#ffd27a" ancho={0.02} avance={dibujo * 1.3 - 0.2} />
    <Trazo pts={SUCHIATE} color="#3ff4ff" ancho={0.03} avance={dibujo * 1.2} brillo={1.4} />
    <Trazo pts={CAHOA} color="#3ff4ff" ancho={0.016} avance={dibujo * 1.2 - 0.1} brillo={0.8} />
    {/* Izapa: montículos escalonados */}
    {[0, 1, 2].map((k) => (
      <mesh key={k} position={[IZAPA.x + (k - 1) * 0.09, 0.02, IZAPA.z - 0.05]}>
        <boxGeometry args={[0.07 - k * 0.015, 0.035, 0.07 - k * 0.015]} />
        <meshStandardMaterial color="#b98aff" emissive="#7a4dff" emissiveIntensity={0.6 * dibujo} />
      </mesh>
    ))}
    {/* pin de la huerta con columna de luz */}
    {pin > 0 && (
      <group position={[CHANGUITA.x, 0, CHANGUITA.z]}>
        <mesh position={[0, 1.2 * pin, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 2.4 * pin, 12, 1, true]} />
          <meshBasicMaterial color="#ff3d9a" transparent opacity={0.85} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} scale={1 + ((t * 1.2) % 1) * 3}>
          <ringGeometry args={[0.07, 0.09, 48]} />
          <meshBasicMaterial color="#ff3d9a" transparent opacity={1 - ((t * 1.2) % 1)} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 0.4, 0]} color="#ff3d9a" intensity={6 * pin} distance={3} />
      </group>
    )}
    {/* el Tacaná al fondo */}
    <mesh geometry={volcanGeo} position={[TACANA.x, 0, TACANA.z]}>
      <meshStandardMaterial vertexColors roughness={0.9} flatShading={false} />
    </mesh>
  </group>
);

// proyecta un punto 3D a la pantalla con la misma cámara de la escena (para poner etiquetas en HTML)
export const aPantalla = (p: THREE.Vector3, pos: THREE.Vector3, mira: THREE.Vector3, fov: number, w: number, h: number) => {
  const cam = new THREE.PerspectiveCamera(fov, w / h, 0.1, 500);
  cam.position.copy(pos);
  cam.lookAt(mira);
  cam.updateMatrixWorld();
  const v = p.clone().project(cam);
  return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, visible: v.z < 1 };
};

// ---------- vuelo: Tacaná → Tuxtla Chico → La Changuita (k de 0 a 1) ----------
const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const rutaCam = new THREE.CatmullRomCurve3([
  P(TACANA.x - 10, 2.6, TACANA.z + 9),
  P(TACANA.x - 5, 7.5, TACANA.z + 19),
  P(TUXTLA.x + 2.5, 6.5, TUXTLA.z + 9),
  P(TUXTLA.x - 0.5, 3.6, TUXTLA.z + 5.5),
  P(CHANGUITA.x + 0.7, 2.0, CHANGUITA.z + 2.6),
]);
const rutaMira = new THREE.CatmullRomCurve3([
  P(TACANA.x, 3.2, TACANA.z),
  P(TACANA.x * 0.5, 1.5, TACANA.z * 0.5),
  P(TUXTLA.x - 0.6, 0, TUXTLA.z + 0.8),
  P(CHANGUITA.x + 0.4, 0, CHANGUITA.z - 0.2),
  P(CHANGUITA.x, 0, CHANGUITA.z),
]);
export const camaraVuelo = (k: number) => {
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  return { pos: rutaCam.getPointAt(e), mira: rutaMira.getPointAt(e), fov: 40 };
};

export const LucesVuelo: React.FC = () => (
  <>
    <hemisphereLight args={['#b8d4ff', '#2c4a1e', 2.6]} />
    <directionalLight position={[-20, 14, 8]} intensity={5} color="#ffd2a0" />
    <fog attach="fog" args={['#6f86a8', 18, 70]} />
  </>
);

const MONO = '"DejaVu Sans Mono", monospace';
export const EtiquetasVuelo: React.FC<{ k: number; w: number; h: number }> = ({ k, w, h }) => {
  const { pos, mira, fov } = camaraVuelo(k);
  const etiquetas: { p: THREE.Vector3; t: string; s?: string; color: string; de: number; a: number }[] = [
    { p: P(TACANA.x, ALTO_TACANA + 0.2, TACANA.z), t: 'VOLCÁN TACANÁ', s: '4,060 m · frontera con Guatemala', color: '#ffffff', de: 0, a: 0.42 },
    { p: P(TUXTLA.x, 0.05, TUXTLA.z), t: 'TUXTLA CHICO', color: '#ffffff', de: 0.4, a: 0.86 },
    { p: PX(905, 300).setY(0.05), t: 'RÍO SUCHIATE', s: 'GUATEMALA →', color: '#3ff4ff', de: 0.45, a: 0.8 },
    { p: PX(300, 610).setY(0.05), t: 'CARRETERA 200', color: '#ff9a3c', de: 0.5, a: 0.85 },
    { p: P(IZAPA.x, 0.1, IZAPA.z), t: 'ZONA ARQUEOLÓGICA IZAPA', color: '#c9a8ff', de: 0.62, a: 1.2 },
    { p: P(CHANGUITA.x, 0.6, CHANGUITA.z), t: 'HUERTA IXCHEL', s: 'La Changuita', color: '#ff3d9a', de: 0.8, a: 1.2 },
  ];
  return (
    <>
      {etiquetas.map((e, i) => {
        if (k < e.de || k > e.a) return null;
        const o = Math.min(1, (k - e.de) / 0.06, (e.a - k) / 0.05);
        const s = aPantalla(e.p, pos, mira, fov, w, h);
        if (!s.visible || s.x < -200 || s.x > w + 200 || s.y < 0 || s.y > h) return null;
        return (
          <div key={i} style={{ position: 'absolute', left: s.x, top: s.y, opacity: o, transform: 'translate(-50%, -100%)', textAlign: 'center', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 54, color: e.color, letterSpacing: 3, textShadow: '0 2px 16px rgba(0,0,0,.9)' }}>{e.t}</div>
            {e.s && <div style={{ fontFamily: MONO, fontSize: 22, color: 'white', opacity: 0.85, textShadow: '0 2px 10px rgba(0,0,0,.9)' }}>{e.s}</div>}
            <div style={{ width: 2, height: 40, background: e.color, margin: '6px auto 0' }} />
          </div>
        );
      })}
    </>
  );
};
