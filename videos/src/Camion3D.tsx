import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Camión tortón con redilas, con más detalle: cabina redondeada con pintura brillante, parabrisas,
// parrilla y defensa cromadas, faros, plafones, espejos, escape, tanque, llantas dobles con rines y birlos,
// salpicaderas y redilas de madera. Más el ambiente (reflejos) y sombras.

export const Ambiente: React.FC = () => {
  const { gl, scene } = useThree();
  useMemo(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  }, [gl, scene]);
  return null;
};

const pintura = (color: string) => new THREE.MeshPhysicalMaterial({ color, metalness: 0.35, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 });
const cromo = new THREE.MeshStandardMaterial({ color: '#e6e8ea', metalness: 1, roughness: 0.12 });
const negro = new THREE.MeshStandardMaterial({ color: '#141414', metalness: 0.2, roughness: 0.75 });
const llanta = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.92 });
const vidrio = new THREE.MeshPhysicalMaterial({ color: '#0d1a24', metalness: 0.9, roughness: 0.04, clearcoat: 1 });
const faro = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff6d8', emissiveIntensity: 2.5 });
const ambar = new THREE.MeshStandardMaterial({ color: '#ffb02e', emissive: '#ff9a00', emissiveIntensity: 2 });
const rojoLuz = new THREE.MeshStandardMaterial({ color: '#ff2a2a', emissive: '#ff1a1a', emissiveIntensity: 1.6 });

const Caja: React.FC<{ args: [number, number, number]; position: [number, number, number]; m: THREE.Material; r?: number; rotation?: [number, number, number] }> = ({ args, position, m, r = 0, rotation }) => {
  const geo = useMemo(() => (r > 0 ? new RoundedBoxGeometry(args[0], args[1], args[2], 4, r) : new THREE.BoxGeometry(...args)), [args[0], args[1], args[2], r]);
  return <mesh geometry={geo} material={m} position={position} rotation={rotation} castShadow receiveShadow />;
};

// perfil de la llanta, girado (torno) para que tenga hombros redondeados
const llantaGeo = (() => {
  const pts: THREE.Vector2[] = [];
  const R = 0.52;
  const r0 = 0.3;
  const w = 0.16;
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI;
    pts.push(new THREE.Vector2(R - 0.06 + Math.sin(a) * 0.06, -w + (i / 16) * 2 * w));
  }
  pts.unshift(new THREE.Vector2(r0, -w));
  pts.push(new THREE.Vector2(r0, w));
  const g = new THREE.LatheGeometry(pts, 48);
  g.rotateX(Math.PI / 2);
  return g;
})();

const Rueda: React.FC<{ position: [number, number, number]; doble?: boolean; giro: number; lado: 1 | -1 }> = ({ position, doble, giro, lado }) => {
  const una = (dz: number, k: number) => (
    <group key={k} position={[0, 0, dz]} rotation={[0, 0, -giro]}>
      <mesh geometry={llantaGeo} material={llanta} castShadow />
      {/* rin */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, lado * 0.1]} material={cromo}>
        <cylinderGeometry args={[0.31, 0.31, 0.06, 32]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, lado * 0.14]} material={negro}>
        <cylinderGeometry args={[0.1, 0.12, 0.05, 16]} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[Math.cos((i / 8) * Math.PI * 2) * 0.19, Math.sin((i / 8) * Math.PI * 2) * 0.19, lado * 0.14]} rotation={[Math.PI / 2, 0, 0]} material={cromo}>
          <cylinderGeometry args={[0.025, 0.025, 0.05, 6]} />
        </mesh>
      ))}
    </group>
  );
  return <group position={position}>{doble ? [una(0, 0), una(-lado * 0.34, 1)] : una(0, 0)}</group>;
};

const madera = ['#a8743f', '#b9834b', '#9c6a38', '#b07a45'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85 }));

// caja de fruta con rambutanes asomando
const CajaFruta: React.FC<{ position: [number, number, number]; semilla: number }> = ({ position, semilla }) => {
  const frutas = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.07, 1), new THREE.MeshStandardMaterial({ color: '#c8202b', roughness: 0.55 }), 18);
    for (let i = 0; i < 18; i++) {
      const x = ((i % 6) - 2.5) * 0.095 + Math.sin(i * 7 + semilla) * 0.02;
      const z = (Math.floor(i / 6) - 1) * 0.11 + Math.cos(i * 5 + semilla) * 0.02;
      m.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 0.17 + Math.sin(i * 3 + semilla) * 0.02, z));
    }
    return m;
  }, [semilla]);
  return (
    <group position={position}>
      <Caja args={[0.62, 0.3, 0.4]} position={[0, 0.0, 0]} m={madera[semilla % 4]} />
      <primitive object={frutas} />
    </group>
  );
};

export const CamionReal: React.FC<{ position?: [number, number, number]; cajas: number; giroRuedas?: number; luces?: boolean }> = ({ position = [0, 0, 0], cajas, giroRuedas = 0, luces = true }) => {
  const blanco = useMemo(() => pintura('#f2f3f1'), []);
  const rojo = useMemo(() => pintura('#b3141f'), []);
  // posiciones de las cajas en la plataforma (3 a lo ancho, 8 a lo largo, 3 pisos)
  const lugares = useMemo(() => {
    const l: [number, number, number][] = [];
    for (let piso = 0; piso < 3; piso++) for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) l.push([-4.15 + i * 0.66, 1.53 + piso * 0.31, -0.62 + j * 0.62]);
    return l;
  }, []);
  return (
    <group position={position}>
      {/* largueros del chasis */}
      {[-0.45, 0.45].map((z) => (
        <Caja key={z} args={[8.6, 0.22, 0.12]} position={[-0.6, 0.72, z]} m={negro} />
      ))}
      {/* cabina: cofre + cabina redondeados */}
      <Caja args={[1.6, 1.0, 2.2]} position={[2.95, 1.35, 0]} m={blanco} r={0.18} />
      <Caja args={[1.75, 1.85, 2.35]} position={[1.55, 1.95, 0]} m={blanco} r={0.16} />
      <Caja args={[1.78, 0.18, 2.38]} position={[1.55, 1.12, 0]} m={rojo} r={0.05} />
      <Caja args={[1.62, 0.12, 2.22]} position={[2.95, 0.92, 0]} m={rojo} r={0.04} />
      {/* parabrisas y ventanas */}
      <Caja args={[0.06, 0.78, 2.1]} position={[2.43, 2.3, 0]} m={vidrio} rotation={[0, 0, -0.12]} />
      {[-1, 1].map((s) => (
        <Caja key={s} args={[0.95, 0.68, 0.04]} position={[1.75, 2.32, s * 1.18]} m={vidrio} />
      ))}
      {/* línea de la puerta y manija */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Caja args={[0.025, 1.4, 0.01]} position={[1.0, 1.85, s * 1.18]} m={negro} />
          <Caja args={[0.18, 0.04, 0.03]} position={[1.25, 1.75, s * 1.2]} m={cromo} />
        </group>
      ))}
      {/* parrilla cromada con barras */}
      <Caja args={[0.08, 0.72, 1.3]} position={[3.76, 1.35, 0]} m={cromo} r={0.03} />
      {Array.from({ length: 9 }, (_, i) => (
        <Caja key={i} args={[0.04, 0.6, 0.04]} position={[3.81, 1.35, -0.56 + i * 0.14]} m={negro} />
      ))}
      {/* defensa */}
      <Caja args={[0.28, 0.3, 2.45]} position={[3.82, 0.78, 0]} m={cromo} r={0.08} />
      {/* faros */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Caja args={[0.08, 0.2, 0.32]} position={[3.78, 1.42, s * 0.88]} m={luces ? faro : cromo} r={0.04} />
          <Caja args={[0.06, 0.08, 0.16]} position={[3.78, 1.2, s * 0.9]} m={ambar} r={0.02} />
        </group>
      ))}
      {luces && (
        <>
          <spotLight position={[3.9, 1.4, 0.88]} target-position={[12, 0, 0.88]} angle={0.45} penumbra={0.6} intensity={30} distance={18} color="#fff3d6" />
          <spotLight position={[3.9, 1.4, -0.88]} target-position={[12, 0, -0.88]} angle={0.45} penumbra={0.6} intensity={30} distance={18} color="#fff3d6" />
        </>
      )}
      {/* plafones en el techo */}
      {Array.from({ length: 5 }, (_, i) => (
        <Caja key={i} args={[0.08, 0.06, 0.12]} position={[2.35, 2.92, -0.6 + i * 0.3]} m={ambar} r={0.02} />
      ))}
      {/* espejos */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Caja args={[0.04, 0.04, 0.42]} position={[2.3, 2.15, s * 1.38]} m={cromo} />
          <Caja args={[0.08, 0.5, 0.2]} position={[2.3, 2.15, s * 1.62]} m={negro} r={0.03} />
        </group>
      ))}
      {/* escape y tanque */}
      <mesh position={[0.62, 2.4, -1.05]} material={cromo} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 2.4, 20]} />
      </mesh>
      <mesh position={[0.4, 0.75, 1.05]} rotation={[0, 0, Math.PI / 2]} material={cromo} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 1.1, 32]} />
      </mesh>
      {/* escalones */}
      {[-1, 1].map((s) => (
        <Caja key={s} args={[0.5, 0.06, 0.28]} position={[1.6, 0.85, s * 1.2]} m={cromo} />
      ))}
      {/* salpicaderas */}
      <Caja args={[1.3, 0.12, 2.5]} position={[2.9, 1.0, 0]} m={negro} r={0.05} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Caja args={[2.4, 0.08, 0.7]} position={[-3.55, 1.05, s * 0.95]} m={negro} />
          <Caja args={[0.04, 0.5, 0.6]} position={[-4.85, 0.6, s * 0.95]} m={negro} />
        </group>
      ))}
      {/* plataforma y redilas */}
      <Caja args={[5.6, 0.16, 2.45]} position={[-2.2, 1.3, 0]} m={madera[3]} />
      {[-1, 1].map((s) =>
        Array.from({ length: 9 }, (_, i) => <Caja key={`${s}${i}`} args={[0.1, 1.2, 0.1]} position={[-4.95 + i * 0.69, 1.98, s * 1.2]} m={madera[(i + 2) % 4]} />),
      )}
      {[-1, 1].map((s) =>
        [0, 1, 2, 3].map((k) => <Caja key={`${s}t${k}`} args={[5.6, 0.12, 0.05]} position={[-2.2, 1.6 + k * 0.28, s * 1.22]} m={madera[k % 4]} />),
      )}
      {[0, 1, 2, 3].map((k) => (
        <Caja key={`f${k}`} args={[0.05, 0.12, 2.45]} position={[0.58, 1.6 + k * 0.28, 0]} m={madera[(k + 1) % 4]} />
      ))}
      <Caja args={[5.6, 0.08, 0.08]} position={[-2.2, 2.6, 1.22]} m={rojo} />
      <Caja args={[5.6, 0.08, 0.08]} position={[-2.2, 2.6, -1.22]} m={rojo} />
      {/* calaveras traseras */}
      {[-1, 1].map((s) => (
        <Caja key={s} args={[0.05, 0.12, 0.3]} position={[-5.02, 1.2, s * 0.95]} m={rojoLuz} r={0.02} />
      ))}
      {/* cajas */}
      {lugares.slice(0, cajas).map((p, i) => (
        <CajaFruta key={i} position={p} semilla={i} />
      ))}
      {/* ruedas: delanteras sencillas, traseras dobles en tándem */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Rueda position={[2.9, 0.52, s * 1.08]} giro={giroRuedas} lado={s as 1 | -1} />
          <Rueda position={[-2.85, 0.52, s * 1.06]} doble giro={giroRuedas} lado={s as 1 | -1} />
          <Rueda position={[-4.0, 0.52, s * 1.06]} doble giro={giroRuedas} lado={s as 1 | -1} />
        </group>
      ))}
    </group>
  );
};

// Piso de terracería/asfalto con huerta al fondo, para que el camión no flote.
export const PisoHuerta: React.FC = () => {
  const arboles = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 2);
    const m = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: '#2f6b33', roughness: 0.85 }), 40);
    const tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.2, 2, 8), new THREE.MeshStandardMaterial({ color: '#5a3a22', roughness: 0.9 }), 40);
    for (let i = 0; i < 40; i++) {
      const x = -26 + (i % 20) * 2.8 + Math.sin(i * 3) * 0.6;
      const z = -7 - Math.floor(i / 20) * 3.2 + Math.cos(i * 5) * 0.6;
      const s = 1.3 + Math.abs(Math.sin(i * 1.7)) * 0.6;
      m.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(x, 2.2 * s, z), new THREE.Quaternion(), new THREE.Vector3(s, s * 0.9, s)));
      tr.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 1, z));
      m.castShadow = true;
    }
    return { m, tr };
  }, []);
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#6f6455" roughness={0.97} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[120, 5]} />
        <meshStandardMaterial color="#3a3a3c" roughness={0.9} />
      </mesh>
      {Array.from({ length: 24 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-46 + i * 4, 0.01, 0]}>
          <planeGeometry args={[1.6, 0.12]} />
          <meshStandardMaterial color="#f2d16b" roughness={0.6} />
        </mesh>
      ))}
      <primitive object={arboles.m} />
      <primitive object={arboles.tr} />
    </>
  );
};

export const LucesTarde: React.FC = () => (
  <>
    <hemisphereLight args={['#bcd7ff', '#5a4a36', 0.6]} />
    <directionalLight
      position={[12, 14, 8]}
      intensity={3}
      color="#ffe2b8"
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-left={-14}
      shadow-camera-right={14}
      shadow-camera-top={14}
      shadow-camera-bottom={-14}
      shadow-bias={-0.0004}
    />
    <directionalLight position={[-10, 5, -8]} intensity={1.0} color="#9fc4ff" />
  </>
);
