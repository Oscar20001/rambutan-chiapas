import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AbsoluteFill, Easing, Img, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { TEXTO, TITULO, avance } from './comun';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Ambiente, CamionReal, LucesTarde, PisoHuerta } from './Camion3D';

// Anuncios 3D estilo estudio: rambután modelado a mano (piel + pelitos), caja de madera y camión,
// cámara en órbita y cortes secos para que Alex les ponga música en TikTok.

const CREMA = '#fff4dc';
const ROJO = '#c8202b';

// ---------- piezas 3D ----------

const fibo = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = Math.PI * (3 - Math.sqrt(5)) * i;
    return new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
  });

const rnd = (s: number) => {
  const x = Math.sin(s * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

// Un pelito (espinterno): filamento delgado y flexible que sale recto, se dobla y se riza en la punta;
// rojo en la base, rosado al medio y verde-amarillo en la punta, como en la fruta real.
const pelitoGeo = (() => {
  const L = 0.62;
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.01, L * 0.3, 0),
    new THREE.Vector3(0.07, L * 0.58, 0.01),
    new THREE.Vector3(0.17, L * 0.8, 0.03),
    new THREE.Vector3(0.27, L * 0.88, 0.07),
    new THREE.Vector3(0.31, L * 0.8, 0.12),
  ]);
  const SEG = 11;
  const RAD = 3;
  const g = new THREE.TubeGeometry(curva, SEG, 0.022, RAD, false);
  const pos = g.attributes.position;
  const col: number[] = [];
  const base = new THREE.Color('#a10f1c');
  const medio = new THREE.Color('#e2364a');
  const punta = new THREE.Color('#b8cf4a');
  for (let i = 0; i < pos.count; i++) {
    const anillo = Math.floor(i / (RAD + 1));
    const u = anillo / SEG;
    const c = curva.getPointAt(u);
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    // se adelgaza hacia la punta
    v.sub(c).multiplyScalar(1.15 - u * 0.85).add(c);
    pos.setXYZ(i, v.x, v.y, v.z);
    const k = u < 0.55 ? base.clone().lerp(medio, u / 0.55) : medio.clone().lerp(punta, Math.min(1, (u - 0.55) / 0.35));
    col.push(k.r, k.g, k.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
})();
const pelitoMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 });

const Pelitos: React.FC<{ semilla: number; mitad?: 'arriba' | 'abajo'; n?: number }> = ({ semilla, mitad, n = 620 }) => {
  const mesh = useMemo(() => {
    const pts = fibo(n).filter((p) => (mitad === 'arriba' ? p.y > 0.02 : mitad === 'abajo' ? p.y < -0.02 : true));
    const m = new THREE.InstancedMesh(pelitoGeo, pelitoMat, pts.length);
    const q = new THREE.Quaternion();
    const giro = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    pts.forEach((p, i) => {
      const n = p.clone().add(new THREE.Vector3(rnd(i + semilla) - 0.5, rnd(i * 3 + semilla) - 0.5, rnd(i * 7 + semilla) - 0.5).multiplyScalar(0.35)).normalize();
      q.setFromUnitVectors(up, n);
      giro.setFromAxisAngle(n, rnd(i * 11 + semilla) * Math.PI * 2);
      const largo = 0.8 + rnd(i * 5 + semilla) * 0.45;
      const mat = new THREE.Matrix4().compose(p.clone().multiply(new THREE.Vector3(0.98, 1.08, 0.98)), giro.multiply(q), new THREE.Vector3(largo, largo, largo));
      m.setMatrixAt(i, mat);
    });
    return m;
  }, [semilla, mitad, n]);
  return <primitive object={mesh} />;
};

const pielGeo = (() => {
  const g = new THREE.SphereGeometry(1, 128, 96);
  const pos = g.attributes.position;
  const col: number[] = [];
  const oscuro = new THREE.Color('#7d0a16');
  const vivo = new THREE.Color('#e3263a');
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i);
    // granitos (tubérculos) de donde nacen los pelitos
    const gr = Math.sin(v.x * 38) * Math.sin(v.y * 41) * Math.sin(v.z * 37);
    const k = 1 + 0.025 * Math.sin(v.x * 9) * Math.sin(v.y * 11) * Math.sin(v.z * 10) + 0.012 * gr;
    pos.setXYZ(i, v.x * k, v.y * k * 1.08, v.z * k);
    const c = oscuro.clone().lerp(vivo, 0.5 + 0.5 * gr * 0.8 + 0.15 * Math.sin(v.x * 5 + v.z * 3));
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
})();

// pulpa (arilo): elipsoide con arruguitas suaves; las dos mitades usan la misma deformación para que casen
const arilo = (v: THREE.Vector3) => {
  const k = 1 + 0.035 * Math.sin(v.x * 7 + v.y * 3) * Math.sin(v.y * 9) + 0.02 * Math.sin(v.z * 13 + v.x * 5);
  return new THREE.Vector3(v.x * 0.84 * k, v.y * 0.93 * k * (1 + 0.08 * Math.max(0, v.y)), v.z * 0.84 * k);
};
const ariloGeo = (phi0: number) => {
  const g = new THREE.SphereGeometry(1, 72, 54, phi0, Math.PI);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const v = arilo(new THREE.Vector3().fromBufferAttribute(pos, i));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
};
// corte de la pulpa: contorno real de la mitad, con el hueco donde va la semilla
const corteGeo = (() => {
  const forma = new THREE.Shape();
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const v = arilo(new THREE.Vector3(Math.cos(a), Math.sin(a), 0));
    i === 0 ? forma.moveTo(v.x, v.y) : forma.lineTo(v.x * 0.995, v.y * 0.995);
  }
  const g = new THREE.ShapeGeometry(forma, 48);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 1.84 + 0.5, pos.getY(i) / 2.1 + 0.5);
  return g;
})();
const pulpaMat = new THREE.MeshPhysicalMaterial({ color: '#f4ece0', roughness: 0.1, transmission: 0.3, thickness: 0.9, emissive: new THREE.Color('#d8d2c4'), emissiveIntensity: 0.18, ior: 1.38, attenuationColor: new THREE.Color('#efe4c8'), attenuationDistance: 1.2, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.4, sheenColor: new THREE.Color('#ffffff') });
// textura del corte: pulpa más blanca al centro, translúcida hacia la orilla, con fibras finas y el hueco de la semilla
const corteTex = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(256, 256, 40, 256, 256, 256);
  r.addColorStop(0, '#fffefa');
  r.addColorStop(0.55, '#f6f1e4');
  r.addColorStop(0.85, '#e4dccb');
  r.addColorStop(1, '#cfc6b2');
  g.fillStyle = r;
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i++) {
    const a = (i / 260) * Math.PI * 2 + Math.sin(i * 7.1) * 0.02;
    g.strokeStyle = `rgba(${200 + (i % 3) * 15},${190 + (i % 5) * 8},170,${0.12 + (i % 4) * 0.04})`;
    g.lineWidth = 1 + (i % 3) * 0.6;
    g.beginPath();
    g.moveTo(256 + Math.cos(a) * 70, 256 + Math.sin(a) * 120);
    g.lineTo(256 + Math.cos(a) * 250, 256 + Math.sin(a) * 250);
    g.stroke();
  }
  // brillo de jugo
  const b = g.createRadialGradient(200, 170, 5, 200, 170, 120);
  b.addColorStop(0, 'rgba(255,255,255,.7)');
  b.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = b;
  g.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
const corteMat = new THREE.MeshPhysicalMaterial({ map: corteTex, color: '#ffffff', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, emissive: new THREE.Color('#ffffff'), emissiveMap: corteTex, emissiveIntensity: 0.35, side: THREE.DoubleSide });
const cascaraDentro = '#f1dccb';

// medio cascarón con grosor: rojo por fuera, crema rosado por dentro y canto visible
const Cascara: React.FC<{ arriba: boolean }> = ({ arriba }) => {
  const t0 = arriba ? 0 : Math.PI / 2;
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 48, 24, 0, Math.PI * 2, t0, Math.PI / 2]} />
        <meshStandardMaterial color={ROJO} roughness={0.5} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.92, 48, 24, 0, Math.PI * 2, t0, Math.PI / 2]} />
        <meshStandardMaterial color={cascaraDentro} roughness={0.7} side={THREE.BackSide} />
      </mesh>
      <mesh rotation={[arriba ? Math.PI / 2 : -Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 1, 64]} />
        <meshStandardMaterial color="#e7a99a" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const Semilla: React.FC = () => (
  <group>
    <mesh scale={[0.3, 0.44, 0.19]}>
      <sphereGeometry args={[1, 40, 28]} />
      <meshStandardMaterial color="#a8794f" roughness={0.9} />
    </mesh>
    {/* telilla blanca pegada a la semilla */}
    <mesh scale={[0.275, 0.3, 0.235]} position={[0, -0.2, 0]}>
      <sphereGeometry args={[1, 32, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      <meshStandardMaterial color="#e8dcc6" roughness={0.8} transparent opacity={0.85} />
    </mesh>
  </group>
);

const MitadPulpa: React.FC<{ lado: 1 | -1; abre: number }> = ({ lado, abre }) => {
  // la mitad izquierda (x<0) gira hacia la cámara como un libro; la derecha igual del otro lado
  const geo = useMemo(() => ariloGeo(lado < 0 ? -Math.PI / 2 : Math.PI / 2), [lado]);
  return (
    <group position={[lado * abre * 0.55, abre * 0.1, abre * 0.15]} rotation={[0, lado * abre * 0.7, 0]}>
      <mesh geometry={geo} material={pulpaMat} />
      <group rotation={[0, (-lado * Math.PI) / 2, 0]}>
        <mesh geometry={corteGeo} material={corteMat} />
        {/* hueco de la semilla en el corte */}
        <mesh position={[0, 0, 0.004]} scale={[0.25, 0.44, 1]}>
          <circleGeometry args={[1, 48]} />
          <meshPhysicalMaterial color="#e9dcc2" roughness={0.3} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0, 0.006]} scale={[0.25, 0.44, 1]}>
          <ringGeometry args={[0.93, 1, 48]} />
          <meshStandardMaterial color="#dcc7a2" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
};

const useBrillo = () => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.6;
  }, [gl, scene]);
};

export const Rambutan: React.FC<{
  semilla?: number;
  abierto?: number; // 0 cerrado → 1 la mitad de arriba se levanta y deja ver la pulpa
  parte?: number; // 0 → 1 la pulpa se abre en dos y se ve la semilla
  explota?: number; // 0 → 1 vista explotada: tapa arriba, base abajo, pulpa y semilla al centro
  pelos?: number; // menos pelitos para racimos y árboles (rinde más)
  position?: [number, number, number];
  rotation?: [number, number, number];
  escala?: number;
}> = ({ semilla = 1, abierto = 0, parte = 0, explota = 0, pelos = 620, position = [0, 0, 0], rotation = [0, 0, 0], escala = 1 }) => {
  const piel = <meshStandardMaterial vertexColors roughness={0.55} metalness={0.02} />;
  if (abierto <= 0)
    return (
      <group position={position} rotation={rotation} scale={escala}>
        <mesh geometry={pielGeo}>{piel}</mesh>
        <Pelitos semilla={semilla} n={pelos} />
      </group>
    );
  return (
    <group position={position} rotation={rotation} scale={escala}>
      <PulpaYSemilla parte={parte} />
      {/* mitad de abajo de la cáscara */}
      <group position={[0, -explota * 1.7, 0]}>
        <Cascara arriba={false} />
        <Pelitos semilla={semilla} mitad="abajo" />
      </group>
      {/* mitad de arriba que se va */}
      <group position={[abierto * 2.3 * (1 - explota), abierto * 0.9 * (1 - explota) + explota * 2.3, abierto * 0.8 * (1 - explota)]} rotation={[0, 0, -abierto * 1.6 * (1 - explota)]}>
        <Cascara arriba />
        <Pelitos semilla={semilla} mitad="arriba" />
      </group>
    </group>
  );
};

const PulpaYSemilla: React.FC<{ parte: number }> = ({ parte }) => {
  useBrillo();
  return (
    <group position={[0, parte * 0.75, 0]}>
      <MitadPulpa lado={-1} abre={parte} />
      <MitadPulpa lado={1} abre={parte} />
      <group position={[0, 0, parte * 0.35]} rotation={[0.2 * parte, parte * 0.6, 0]}>
        <Semilla />
      </group>
    </group>
  );
};

const madera = '#b07a45';
export const Caja: React.FC<{ position?: [number, number, number]; rotation?: [number, number, number]; escala?: number }> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  escala = 1,
}) => {
  const tabla = (p: [number, number, number], s: [number, number, number], k: number) => (
    <mesh key={k} position={p}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={k % 2 ? madera : '#c48c55'} roughness={0.85} />
    </mesh>
  );
  const t: React.ReactNode[] = [];
  let k = 0;
  // fondo
  t.push(tabla([0, -0.95, 0], [4.2, 0.1, 3], k++));
  // lados largos con dos tablas y hueco
  for (const z of [-1.5, 1.5]) for (const y of [-0.55, 0.25]) t.push(tabla([0, y, z], [4.2, 0.6, 0.1], k++));
  for (const x of [-2.1, 2.1]) for (const y of [-0.55, 0.25]) t.push(tabla([x, y, 0], [0.1, 0.6, 3.1], k++));
  // postes
  for (const x of [-2.05, 2.05]) for (const z of [-1.45, 1.45]) t.push(tabla([x, -0.3, z], [0.22, 1.4, 0.22], k++));
  return (
    <group position={position} rotation={rotation} scale={escala}>
      {t}
    </group>
  );
};

export const Camion: React.FC<{ position?: [number, number, number]; cajas: number }> = ({ position = [0, 0, 0], cajas }) => {
  const caja = (i: number) => {
    const col = i % 3;
    const fila = Math.floor(i / 3) % 2;
    const piso = Math.floor(i / 6);
    return <Caja key={i} escala={0.42} position={[-3.2 + col * 1.85, 0.95 + piso * 0.62, -0.7 + fila * 1.35]} />;
  };
  return (
    <group position={position}>
      {/* chasis */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[9.8, 0.4, 3.2]} />
        <meshStandardMaterial color="#2b2b2b" roughness={0.7} />
      </mesh>
      {/* plataforma de redilas */}
      <mesh position={[-1.4, 0.45, 0]}>
        <boxGeometry args={[6.4, 0.3, 3.2]} />
        <meshStandardMaterial color="#7a5230" roughness={0.9} />
      </mesh>
      {[-1.6, 1.6].map((z) =>
        [0, 1, 2].map((r) => (
          <mesh key={`${z}${r}`} position={[-1.4, 1.0 + r * 0.5, z]}>
            <boxGeometry args={[6.4, 0.12, 0.08]} />
            <meshStandardMaterial color="#e8b23a" />
          </mesh>
        )),
      )}
      {Array.from({ length: Math.min(cajas, 12) }, (_, i) => caja(i))}
      {/* cabina */}
      <mesh position={[3.4, 1.35, 0]}>
        <boxGeometry args={[2.6, 2.3, 3.1]} />
        <meshStandardMaterial color="#e8eef2" roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[4.71, 1.75, 0]}>
        <boxGeometry args={[0.05, 0.9, 2.6]} />
        <meshStandardMaterial color="#1b2a38" roughness={0.1} metalness={0.6} />
      </mesh>
      <mesh position={[3.4, 0.55, 0]}>
        <boxGeometry args={[2.65, 0.25, 3.15]} />
        <meshStandardMaterial color={ROJO} />
      </mesh>
      {[-3.2, -1.2, 3.4].map((x) =>
        [-1.55, 1.55].map((z) => (
          <mesh key={`${x}${z}`} position={[x, -0.25, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 0.45, 28]} />
            <meshStandardMaterial color="#151515" roughness={0.9} />
          </mesh>
        )),
      )}
    </group>
  );
};

// ---------- cámara y luces ----------

const Camara: React.FC<{ pos: [number, number, number]; mira: [number, number, number]; fov?: number }> = ({ pos, mira, fov = 35 }) => {
  const { camera } = useThree();
  camera.position.set(...pos);
  (camera as THREE.PerspectiveCamera).fov = fov;
  camera.lookAt(...mira);
  camera.updateProjectionMatrix();
  return null;
};

const Luces: React.FC<{ tibio?: boolean }> = ({ tibio = true }) => (
  <>
    <ambientLight intensity={0.55} />
    <directionalLight position={[4, 6, 5]} intensity={2.2} color={tibio ? '#fff1dc' : '#ffffff'} />
    <directionalLight position={[-5, 2, -4]} intensity={1.6} color="#ffd2a6" />
    <directionalLight position={[0, -3, 4]} intensity={0.4} />
  </>
);

const Piso: React.FC<{ color: string; y?: number }> = ({ color, y = -1.2 }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]}>
    <circleGeometry args={[30, 64]} />
    <meshStandardMaterial color={color} roughness={0.95} />
  </mesh>
);

// ---------- texto en pantalla ----------

const Letrero: React.FC<{ t: number; desde: number; hasta: number; children: React.ReactNode; y?: number; tam?: number; color?: string; detras?: boolean }> = ({
  t,
  desde,
  hasta,
  children,
  y = 1450,
  tam = 120,
  color = CREMA,
  detras,
}) => {
  if (t < desde || t > hasta) return null;
  const a = avance(t, desde, 0.45, Easing.out(Easing.exp));
  const sale = 1 - avance(t, hasta - 0.25, 0.25);
  return (
    <div
      style={{
        position: 'absolute',
        left: 60,
        right: 60,
        top: y,
        textAlign: 'center',
        fontFamily: TITULO,
        fontSize: tam,
        lineHeight: 0.9,
        color,
        letterSpacing: detras ? 6 : 2,
        opacity: a * sale,
        transform: `translateY(${(1 - a) * 60}px)`,
        filter: `blur(${(1 - a) * 10}px)`,
        textShadow: detras ? 'none' : '0 6px 30px rgba(0,0,0,.25)',
      }}
    >
      {children}
    </div>
  );
};

const Pie: React.FC<{ t: number; desde: number; fondo: string; tinta: string }> = ({ t, desde, fondo, tinta }) => {
  const a = avance(t, desde, 0.6, Easing.out(Easing.exp));
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 560, transform: `translateY(${(1 - a) * 560}px)`, background: fondo, color: tinta, padding: '60px 70px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Img src={staticFile('logo.svg')} style={{ width: 130, background: CREMA, borderRadius: '50%', padding: 8 }} />
        <div style={{ fontFamily: TITULO, fontSize: 64, letterSpacing: 3, lineHeight: 0.95 }}>
          IXCHEL
          <br />
          <span style={{ fontSize: 40 }}>FRUTAS DEL SOCONUSCO</span>
        </div>
      </div>
      <div style={{ fontFamily: TEXTO, fontSize: 46, textAlign: 'center' }}>Venta por tonelada. Tú mandas tu camión.</div>
      <div style={{ fontFamily: TITULO, fontSize: 110, letterSpacing: 2, color: '#25d366', background: '#0b2415', padding: '6px 40px 0', borderRadius: 60 }}>WA 962 269 9611</div>
    </div>
  );
};

// ---------- utilidades de tiempo ----------

const tramo = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const suave = (x: number) => Easing.inOut(Easing.cubic)(x);
export const caida = (t: number, desde: number, altura: number, hasta: number) => {
  // cae con un rebote pequeño
  const d = t - desde;
  if (d <= 0) return altura;
  const dur = 0.55;
  if (d < dur) return interpolate(d, [0, dur], [altura, hasta], { easing: Easing.in(Easing.quad) });
  const r = d - dur;
  return hasta + Math.max(0, Math.sin(Math.min(r / 0.3, 1) * Math.PI)) * 0.35;
};

// posiciones de rambutanes dentro de la caja
const enCaja = Array.from({ length: 11 }, (_, i) => {
  const col = i % 4;
  const fila = Math.floor(i / 4) % 3;
  return [-1.5 + col * 1.0 + (fila % 2) * 0.45, -0.25 + Math.floor(i / 8) * 0.6, -0.9 + fila * 0.95] as [number, number, number];
});

// ---------- anuncio 1: producto (sábado) ----------

export const AnuncioProducto: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  // escenas: 0 héroe · 1 macro · 2 abre · 3 caja · 4 cierre
  const cortes = [0, 3.6, 7.2, 11.6, 16.6];
  const esc = cortes.filter((c) => t >= c).length - 1;
  const fondos = ['#0f3d2a', '#14301a', '#ffd21a', '#ff5a1f', '#0f3d2a'];
  const fondo = fondos[esc];
  const local = t - cortes[esc];

  let cam: [number, number, number] = [0, 0.4, 7];
  let mira: [number, number, number] = [0, 0, 0];
  let fov = 35;
  const giro = t * 0.9;
  if (esc === 0) {
    const d = interpolate(local, [0, 3.6], [8.5, 6.2], { easing: Easing.out(Easing.cubic) });
    cam = [Math.sin(local * 0.5) * d, 0.6, Math.cos(local * 0.5) * d];
  } else if (esc === 1) {
    const a = 0.6 + local * 0.35;
    cam = [Math.sin(a) * 2.6, 1.0 - local * 0.15, Math.cos(a) * 2.6];
    mira = [0.2, 0.5, 0];
    fov = 30;
  } else if (esc === 2) {
    const z = interpolate(local, [2.2, 3.8], [9.5, 7.9], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
    cam = [0.6, 2.4 + (z - 9.5) * 0.25, z];
    mira = [0, 1.0, 0];
  } else if (esc === 3) {
    const a = -0.6 + local * 0.18;
    cam = [Math.sin(a) * 10, 5.5, Math.cos(a) * 10];
    mira = [0, -0.4, 0];
  } else {
    const a = local * 0.35;
    cam = [Math.sin(a) * 11, 4.5, Math.cos(a) * 11];
    mira = [0, 0.6, 0];
  }

  const abierto = esc === 2 ? suave(tramo(local, 0.9, 2.2)) : 0;
  const parte = esc === 2 ? suave(tramo(local, 2.3, 3.4)) : 0;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${interpolateColors(0.15, [0, 1], [fondo, '#ffffff'])}, ${fondo} 70%)` }}>
      {/* letras gigantes detrás del objeto */}
      {esc === 0 && (
        <div style={{ position: 'absolute', top: 640, width: '100%', textAlign: 'center', fontFamily: TITULO, fontSize: 330, color: '#1f5a35', letterSpacing: 4, opacity: avance(local, 0.1, 0.6) }}>
          RAMBUTÁN
        </div>
      )}
      {esc === 3 && (
        <div style={{ position: 'absolute', top: 210, width: '100%', textAlign: 'center', fontFamily: TITULO, fontSize: 250, color: '#ff8a3d', lineHeight: 0.85 }}>
          TUXTLA
          <br />
          CHICO
        </div>
      )}
      <ThreeCanvas width={width} height={height} linear camera={{ fov: 35, position: [0, 0, 7] }}>
        <Camara pos={cam} mira={mira} fov={fov} />
        <Luces />
        {esc <= 2 && <Rambutan semilla={3} abierto={abierto} parte={parte} rotation={[0.15, esc === 2 ? 0.4 : giro, 0.05]} position={[0, esc === 2 ? 0 : 0.15, 0]} />}
        {esc === 2 && <Piso color="#e3a72f" y={-1.25} />}
        {esc >= 3 && (
          <>
            <Piso color={esc === 3 ? '#ff7a3d' : '#4f9a63'} y={-1.05} />
            <group rotation={[0, esc === 4 ? 0 : 0, 0]}>
              <Caja />
              {enCaja.map((p, i) => {
                const desde = esc === 3 ? 0.3 + i * 0.32 : -10;
                return <Rambutan key={i} semilla={i + 5} escala={0.5} position={[p[0], caida(local, desde, 7, p[1]), p[2]]} rotation={[i, i * 2, 0]} />;
              })}
            </group>
          </>
        )}
      </ThreeCanvas>

      <Letrero t={t} desde={0.5} hasta={3.5} y={1500} tam={86}>
        DE CHIAPAS PARA TODO MÉXICO
      </Letrero>
      <Letrero t={t} desde={3.8} hasta={7.1} y={1450} tam={150}>
        ROJO
        <br />
        INTENSO
      </Letrero>
      <Letrero t={t} desde={4.6} hasta={7.1} y={1720} tam={44}>
        Pelitos firmes con punta verde: recién cortado
      </Letrero>
      <Letrero t={t} desde={8.6} hasta={11.5} y={180} tam={170} color="#3a0d0d">
        DULCE
        <br />Y JUGOSO
      </Letrero>
      <Letrero t={t} desde={9.9} hasta={11.5} y={1790} tam={46} color="#3a0d0d">
        Pulpa blanca y jugosa · la semilla no se come
      </Letrero>
      <Letrero t={t} desde={12.0} hasta={16.5} y={1520} tam={110}>
        COSECHADO A MANO
      </Letrero>
      {esc === 4 && (
        <>
          <Letrero t={t} desde={16.8} hasta={30} y={150} tam={140}>
            ¿COMPRAS
            <br />
            POR TONELADA?
          </Letrero>
          <Pie t={t} desde={17.6} fondo={CREMA} tinta="#14301a" />
        </>
      )}
    </AbsoluteFill>
  );
};

// ---------- anuncio 2: del árbol a tu camión (domingo) ----------

export const AnuncioCamion: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const cortes = [0, 4.2, 9.0, 15.0];
  const esc = cortes.filter((c) => t >= c).length - 1;
  const local = t - cortes[esc];
  const fondos = ['#2440ff', '#e6007e', '#6fa8dc', '#6fa8dc'];
  const fondo = fondos[esc];

  const avanzaCam = esc === 3 ? interpolate(t - 15.0, [3.2, 7], [0, 4], { extrapolateLeft: 'clamp', easing: Easing.in(Easing.cubic) }) : 0;
  let cam: [number, number, number] = [0, 0, 8];
  let mira: [number, number, number] = [0, 0, 0];
  let fov = 35;
  if (esc === 0) {
    const a = -0.3 + local * 0.12;
    cam = [Math.sin(a) * 7, -0.6, Math.cos(a) * 7];
    mira = [0, 0.6, 0];
  } else if (esc === 1) {
    const a = 0.5 - local * 0.08;
    cam = [Math.sin(a) * 9.5, 6.5, Math.cos(a) * 9.5];
    mira = [0, -0.3, 0];
  } else {
    const a = (esc === 2 ? 0.75 : 0.35) + local * (esc === 2 ? -0.07 : 0.05);
    const d = esc === 2 ? 23 : 26;
    cam = [Math.sin(a) * d + (esc === 3 ? avanzaCam : 0), esc === 2 ? 6 : 7, Math.cos(a) * d];
    mira = [-0.5 + (esc === 3 ? avanzaCam : 0), 1.6, 0];
    fov = 40;
  }

  // racimo colgando de una rama
  const racimo = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2;
    return [Math.cos(a) * (i % 2 ? 1.1 : 0.7), -0.4 - (i % 3) * 0.75, Math.sin(a) * 0.9] as [number, number, number];
  });
  const mece = Math.sin(t * 1.6) * 0.06;
  const cajasEnCamion = esc === 2 ? Math.floor(tramo(local, 0.3, 5.4) * 72) : esc === 3 ? 72 : 0;
  const avanza = esc === 3 ? interpolate(local, [3.2, 7], [0, 9], { extrapolateLeft: 'clamp', easing: Easing.in(Easing.cubic) }) : 0;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 40%, ${interpolateColors(0.18, [0, 1], [fondo, '#ffffff'])}, ${fondo} 72%)` }}>
      <ThreeCanvas width={width} height={height} linear camera={{ fov: 35, position: [0, 0, 8] }}>
        <Camara pos={cam} mira={mira} fov={fov} />
        <Luces />
        {esc === 0 && (
          <group rotation={[0, 0, mece]} position={[0, 2.2, 0]}>
            <mesh position={[0, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.18, 0.24, 9, 16]} />
              <meshStandardMaterial color="#5a3a22" roughness={0.9} />
            </mesh>
            {[-2.4, 2.1].map((x, k) => (
              <mesh key={k} position={[x, 1.6, 0.3]} rotation={[0.5, k, 0.9]} scale={[1.4, 0.5, 0.2]}>
                <sphereGeometry args={[1, 24, 12]} />
                <meshStandardMaterial color="#1f7a3e" roughness={0.6} />
              </mesh>
            ))}
            {racimo.map((p, i) => (
              <group key={i}>
                <mesh position={[p[0] / 2, (p[1] + 1.2) / 2 + 0.3, p[2] / 2]} rotation={[p[2] * 0.4, 0, -p[0] * 0.4]}>
                  <cylinderGeometry args={[0.04, 0.04, 1.4 - p[1], 6]} />
                  <meshStandardMaterial color="#6b8a2a" />
                </mesh>
                <Rambutan semilla={i + 20} escala={0.55} position={p} rotation={[i, i * 1.7, 0]} />
              </group>
            ))}
          </group>
        )}
        {esc === 1 && (
          <>
            <Piso color="#c3006a" y={-1.05} />
            <Caja />
            {enCaja.map((p, i) => (
              <Rambutan key={i} semilla={i + 40} escala={0.5} position={[p[0], caida(local, 0.2 + i * 0.3, 7, p[1]), p[2]]} rotation={[i, i * 2, 0]} />
            ))}
          </>
        )}
        {esc >= 2 && (
          <>
            <Ambiente />
            <LucesTarde />
            <PisoHuerta />
            <CamionReal cajas={cajasEnCamion} position={[avanza, 0, 0]} giroRuedas={avanza / 0.52} />
          </>
        )}
      </ThreeCanvas>

      <Letrero t={t} desde={0.4} hasta={4.1} y={1430} tam={170}>
        DEL ÁRBOL...
      </Letrero>
      <Letrero t={t} desde={1.2} hasta={4.1} y={1620} tam={46}>
        Huertas de Tuxtla Chico, Chiapas
      </Letrero>
      <Letrero t={t} desde={4.4} hasta={8.9} y={160} tam={170}>
        ...A LA CAJA...
      </Letrero>
      <Letrero t={t} desde={5.4} hasta={8.9} y={1600} tam={52}>
        Cosechamos y empacamos en la huerta
      </Letrero>
      <Letrero t={t} desde={9.2} hasta={14.9} y={170} tam={170}>
        ...A TU CAMIÓN
      </Letrero>
      <Letrero t={t} desde={10.2} hasta={14.9} y={1560} tam={56}>
        Camioneta, tortón o tráiler: nosotros lo cargamos
      </Letrero>
      {esc === 3 && (
        <>
          <Letrero t={t} desde={15.2} hasta={30} y={150} tam={140}>
            RAMBUTÁN
            <br />
            POR TONELADA
          </Letrero>
          <Pie t={t} desde={16.2} fondo={CREMA} tinta="#14301a" />
        </>
      )}
    </AbsoluteFill>
  );
};
