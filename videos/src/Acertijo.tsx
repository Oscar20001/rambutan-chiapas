import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Tiempos, TITULO, TEXTO, avance, cuando } from './comun';
import { CierreSerie, useFormato } from './marca';
import { Estudio } from './RambutanAbre';
import { Rambutan } from './Anuncio3D';
import { Arbol } from './Racimo';
import { volcanGeo } from './Croquis';
import { CamaraSerie, Chispas, FondoCielo, cieloEntre, rnd, suave } from './Naturaleza';
import { LuzSol, ManchaTierra, Nubes, Pasto, Sombras, SueloReal, relojViento } from './Realismo';

// Acertijo 1: "El ladrón del árbol 7". Voz de Antonio (historia con suspenso), sin música.
// Historia → resumen de pistas → encuesta A/B/C/D con cuenta regresiva → respuesta → cierre.
// Respuesta real: en Chiapas hay murciélagos fruteros (p. ej. Artibeus jamaicensis) que comen fruta madura de noche
// y dispersan semillas.

const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const PAPEL = '#f4e8cc';
const TINTA = '#8a1c1c';

// ---------- texturas pintadas ----------
export const letrero = (lineas: string[], ancho = 512, alto = 256, fondo = '#7a5634', color = '#f6ecd2', tam = 150) => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = ancho;
  c.height = alto;
  const g = c.getContext('2d')!;
  g.fillStyle = fondo;
  g.fillRect(0, 0, ancho, alto);
  // vetas de madera
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = `rgba(40,20,5,${0.08 + rnd(i) * 0.12})`;
    g.lineWidth = 1 + rnd(i * 2) * 3;
    g.beginPath();
    const y = rnd(i * 3) * alto;
    g.moveTo(0, y);
    g.bezierCurveTo(ancho * 0.3, y + 6, ancho * 0.6, y - 6, ancho, y + 3);
    g.stroke();
  }
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `bold ${tam}px Georgia, serif`;
  lineas.forEach((l, i) => g.fillText(l, ancho / 2, alto / 2 + (i - (lineas.length - 1) / 2) * tam * 1.05));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
const TEX_7 = letrero(['7'], 256, 256, '#6e4b2c', '#f6ecd2', 190);
const TEX_MURCI = letrero(['PARA LOS', 'MURCIÉLAGOS'], 512, 256, '#6e4b2c', '#f6ecd2', 70);

// ---------- Don Chepe ----------
const piel = new THREE.MeshStandardMaterial({ color: '#a8714a', roughness: 0.6 });
const camisa = new THREE.MeshStandardMaterial({ color: '#e9e2d0', roughness: 0.85 });
const pantalon = new THREE.MeshStandardMaterial({ color: '#2f4466', roughness: 0.9 });
const bota = new THREE.MeshStandardMaterial({ color: '#4a2f1c', roughness: 0.7 });
const paja = new THREE.MeshStandardMaterial({ color: '#d9c48c', roughness: 0.9 });
const negro = new THREE.MeshStandardMaterial({ color: '#1b1714', roughness: 0.5 });
const canas = new THREE.MeshStandardMaterial({ color: '#d8d4cc', roughness: 0.8 });

const DonChepe: React.FC<{ t: number; position: [number, number, number]; giro?: number; senala?: number; sonrie?: number }> = ({ t, position, giro = 0, senala = 0, sonrie = 0 }) => {
  const resp = Math.sin(t * 2.2) * 0.008;
  const cabeza = Math.sin(t * 0.9) * 0.12;
  return (
    <group position={position} rotation={[0, giro, 0]}>
      {[-1, 1].map((l) => (
        <group key={l}>
          <mesh material={pantalon} position={[l * 0.1, 0.45, 0]}>
            <cylinderGeometry args={[0.075, 0.065, 0.82, 12]} />
          </mesh>
          <mesh material={bota} position={[l * 0.1, 0.05, 0.04]}>
            <boxGeometry args={[0.13, 0.1, 0.27]} />
          </mesh>
        </group>
      ))}
      <mesh material={negro} position={[0, 0.88, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.05, 20]} />
      </mesh>
      <mesh material={camisa} position={[0, 1.15 + resp, 0]} scale={[1, 1, 0.8]}>
        <capsuleGeometry args={[0.2, 0.38, 8, 20]} />
      </mesh>
      {/* brazo izquierdo colgando */}
      <group position={[-0.25, 1.38, 0]} rotation={[0, 0, 0.12]}>
        <mesh material={camisa} position={[0, -0.25, 0]}>
          <capsuleGeometry args={[0.06, 0.4, 6, 12]} />
        </mesh>
        <mesh material={piel} position={[0, -0.52, 0]}>
          <sphereGeometry args={[0.055, 12, 10]} />
        </mesh>
      </group>
      {/* brazo derecho: señala/cuenta hacia el árbol */}
      <group position={[0.25, 1.38, 0]} rotation={[-senala * 1.9, 0, -0.12 - senala * 0.2]}>
        <mesh material={camisa} position={[0, -0.25, 0]}>
          <capsuleGeometry args={[0.06, 0.4, 6, 12]} />
        </mesh>
        <mesh material={piel} position={[0, -0.52, 0]}>
          <sphereGeometry args={[0.055, 12, 10]} />
        </mesh>
      </group>
      <group position={[0, 1.6, 0]} rotation={[sonrie * -0.1, cabeza * (1 - senala), 0]}>
        <mesh material={piel} position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.06, 0.07, 0.1, 12]} />
        </mesh>
        <mesh material={piel} scale={[1, 1.12, 1]}>
          <sphereGeometry args={[0.13, 24, 20]} />
        </mesh>
        <mesh material={piel} position={[0, -0.01, 0.13]}>
          <sphereGeometry args={[0.032, 12, 10]} />
        </mesh>
        {/* bigote canoso */}
        <mesh material={canas} position={[0, -0.05, 0.12]} rotation={[0, 0, 0]} scale={[1, 0.35, 0.5]}>
          <sphereGeometry args={[0.06, 14, 10]} />
        </mesh>
        {[-1, 1].map((l) => (
          <group key={l}>
            <mesh material={negro} position={[l * 0.045, 0.03, 0.115]}>
              <sphereGeometry args={[0.014, 10, 8]} />
            </mesh>
            <mesh material={canas} position={[l * 0.047, 0.065, 0.115]} rotation={[0, 0, l * (0.15 - sonrie * 0.3)]}>
              <boxGeometry args={[0.04, 0.008, 0.01]} />
            </mesh>
            <mesh material={piel} position={[l * 0.13, 0, 0]}>
              <sphereGeometry args={[0.03, 10, 8]} />
            </mesh>
          </group>
        ))}
        {/* sombrero de palma */}
        <mesh material={paja} position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.018, 32]} />
        </mesh>
        <mesh material={paja} position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.11, 0.14, 0.13, 24]} />
        </mesh>
        <mesh material={negro} position={[0, 0.125, 0]}>
          <cylinderGeometry args={[0.142, 0.142, 0.03, 24]} />
        </mesh>
      </group>
    </group>
  );
};

// ---------- el perro, echado y dormido ----------
const pelaje = new THREE.MeshStandardMaterial({ color: '#9a6a3c', roughness: 0.85 });
const pelajeOsc = new THREE.MeshStandardMaterial({ color: '#5a3a20', roughness: 0.85 });
const Perro: React.FC<{ t: number; position: [number, number, number]; giro?: number }> = ({ t, position, giro = 0 }) => {
  const resp = 1 + Math.sin(t * 2.4) * 0.04;
  return (
    <group position={position} rotation={[0, giro, 0]}>
      <mesh material={pelaje} position={[0, 0.15, 0]} rotation={[0, 0, Math.PI / 2]} scale={[resp, 1, resp]}>
        <capsuleGeometry args={[0.15, 0.42, 8, 18]} />
      </mesh>
      {/* patas delanteras estiradas */}
      {[-1, 1].map((l) => (
        <mesh key={l} material={pelaje} position={[0.42, 0.05, l * 0.08]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.04, 0.2, 6, 10]} />
        </mesh>
      ))}
      <group position={[0.42, 0.14, 0]} rotation={[0, 0, -0.15]}>
        <mesh material={pelaje} scale={[1.1, 0.9, 0.95]}>
          <sphereGeometry args={[0.11, 18, 14]} />
        </mesh>
        <mesh material={pelaje} position={[0.11, -0.03, 0]} scale={[1.4, 0.8, 0.85]}>
          <sphereGeometry args={[0.055, 14, 10]} />
        </mesh>
        <mesh material={negro} position={[0.185, -0.02, 0]}>
          <sphereGeometry args={[0.02, 10, 8]} />
        </mesh>
        {/* ojos cerrados: rayitas */}
        {[-1, 1].map((l) => (
          <mesh key={l} material={negro} position={[0.08, 0.035, l * 0.05]} rotation={[0, l * 0.5, 0]}>
            <boxGeometry args={[0.03, 0.005, 0.005]} />
          </mesh>
        ))}
        {[-1, 1].map((l) => (
          <mesh key={l} material={pelajeOsc} position={[-0.02, 0.06, l * 0.09]} rotation={[l * 0.9, 0, 0.3]} scale={[1, 1.6, 0.4]}>
            <sphereGeometry args={[0.045, 10, 8]} />
          </mesh>
        ))}
      </group>
      <mesh material={pelaje} position={[-0.38, 0.12, 0.05]} rotation={[0.3, 0, 1.2 + Math.sin(t * 1.3) * 0.08]}>
        <capsuleGeometry args={[0.025, 0.22, 6, 8]} />
      </mesh>
      {/* collar rojo */}
      <mesh position={[0.32, 0.17, 0]} rotation={[0, 0, Math.PI / 2 - 0.3]}>
        <torusGeometry args={[0.085, 0.015, 8, 24]} />
        <meshStandardMaterial color="#b0262a" roughness={0.5} />
      </mesh>
    </group>
  );
};

// ---------- portón con candado ----------
const madera = new THREE.MeshStandardMaterial({ color: '#6b4a2e', roughness: 0.9 });
const laton = new THREE.MeshStandardMaterial({ color: '#c9a24a', roughness: 0.25, metalness: 0.9 });
const fierro = new THREE.MeshStandardMaterial({ color: '#8a8f96', roughness: 0.35, metalness: 0.85 });
const Porton: React.FC<{ position: [number, number, number]; giro?: number }> = ({ position, giro = 0 }) => (
  <group position={position} rotation={[0, giro, 0]}>
    {[-1.6, 1.6].map((x) => (
      <mesh key={x} material={madera} position={[x, 0.9, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 1.8, 10]} />
      </mesh>
    ))}
    {[0.3, 0.75, 1.2, 1.55].map((y) => (
      <mesh key={y} material={madera} position={[0, y, 0]}>
        <boxGeometry args={[3.1, 0.12, 0.05]} />
      </mesh>
    ))}
    {[-1, -0.3, 0.3, 1].map((x) => (
      <mesh key={x} material={madera} position={[x, 0.9, 0.03]} rotation={[0, 0, x * 0.0]}>
        <boxGeometry args={[0.1, 1.5, 0.04]} />
      </mesh>
    ))}
    {/* cadena y candado al centro */}
    {Array.from({ length: 7 }, (_, i) => (
      <mesh key={i} material={fierro} position={[-0.18 + i * 0.06, 1.0 - Math.sin((i / 6) * Math.PI) * 0.08, 0.07]} rotation={[0, i % 2 ? Math.PI / 2 : 0, 0]}>
        <torusGeometry args={[0.028, 0.008, 6, 14]} />
      </mesh>
    ))}
    <group position={[0, 0.84, 0.09]}>
      <mesh material={laton}>
        <boxGeometry args={[0.13, 0.11, 0.05]} />
      </mesh>
      <mesh material={fierro} position={[0, 0.07, 0]}>
        <torusGeometry args={[0.04, 0.01, 8, 18, Math.PI]} />
      </mesh>
      <mesh material={negro} position={[0, -0.015, 0.027]}>
        <cylinderGeometry args={[0.012, 0.012, 0.005, 10]} />
      </mesh>
    </group>
  </group>
);

// ---------- cámara en tripié ----------
const CamaraTripie: React.FC<{ t: number; position: [number, number, number]; mira: [number, number, number] }> = ({ t, position, mira }) => {
  const giro = Math.atan2(mira[0] - position[0], mira[2] - position[2]);
  return (
    <group position={position} rotation={[0, giro, 0]}>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} material={negro} position={[Math.cos(a) * 0.18, 0.5, Math.sin(a) * 0.18]} rotation={[Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35]}>
            <cylinderGeometry args={[0.012, 0.015, 1.05, 8]} />
          </mesh>
        );
      })}
      <group position={[0, 1.08, 0]} rotation={[0.12, 0, 0]}>
        <mesh material={negro}>
          <boxGeometry args={[0.14, 0.1, 0.2]} />
        </mesh>
        <mesh material={negro} position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.045, 0.1, 16]} />
        </mesh>
        <mesh position={[0, 0, 0.191]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.004, 16]} />
          <meshStandardMaterial color="#1c2a48" roughness={0.05} metalness={0.6} />
        </mesh>
        <mesh position={[0.05, 0.035, 0.1]}>
          <sphereGeometry args={[0.009, 8, 6]} />
          <meshBasicMaterial color={Math.floor(t * 2) % 2 ? '#ff2a2a' : '#3a0505'} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
};

// ---------- murciélago frutero ----------
const alaGeo = (() => {
  // membrana con el borde de atrás en festón (entre los "dedos")
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0.05, 0.06);
  s.quadraticCurveTo(0.2, 0.12, 0.34, 0.05);
  s.quadraticCurveTo(0.3, -0.02, 0.32, -0.08);
  s.quadraticCurveTo(0.24, -0.04, 0.22, -0.12);
  s.quadraticCurveTo(0.15, -0.06, 0.1, -0.12);
  s.quadraticCurveTo(0.06, -0.06, 0, -0.06);
  s.lineTo(0, 0);
  const g = new THREE.ShapeGeometry(s, 12);
  g.rotateX(-Math.PI / 2);
  return g;
})();
const alaMat = new THREE.MeshStandardMaterial({ color: '#5a4236', roughness: 0.6, side: THREE.DoubleSide, emissive: new THREE.Color('#2a1c16'), transparent: true, opacity: 0.94 });
const cuerpoMurci = new THREE.MeshStandardMaterial({ color: '#8a6a56', roughness: 0.8, emissive: new THREE.Color('#24180f') });
export const Murcielago: React.FC<{ t: number; position: THREE.Vector3; rumbo: THREE.Vector3; fase?: number; escala?: number; fruta?: boolean }> = ({ t, position, rumbo, fase = 0, escala = 1, fruta }) => {
  const flap = Math.sin(t * 15 + fase) * 0.95;
  const yaw = Math.atan2(rumbo.x, rumbo.z);
  const pitch = -Math.atan2(rumbo.y, Math.hypot(rumbo.x, rumbo.z)) * 0.6;
  return (
    <group position={position} rotation={[pitch, yaw, Math.sin(t * 2 + fase) * 0.2]} scale={escala}>
      <mesh material={cuerpoMurci} scale={[0.6, 0.55, 1]}>
        <sphereGeometry args={[0.06, 12, 10]} />
      </mesh>
      <mesh material={cuerpoMurci} position={[0, 0.01, 0.07]}>
        <sphereGeometry args={[0.035, 12, 10]} />
      </mesh>
      {[-1, 1].map((l) => (
        <mesh key={l} material={cuerpoMurci} position={[l * 0.018, 0.045, 0.075]} rotation={[0.3, 0, l * -0.3]}>
          <coneGeometry args={[0.012, 0.035, 6]} />
        </mesh>
      ))}
      <group rotation={[0, 0, flap]}>
        <mesh geometry={alaGeo} material={alaMat} position={[0.02, 0, 0.03]} />
      </group>
      <group rotation={[0, 0, -flap]} scale={[-1, 1, 1]}>
        <mesh geometry={alaGeo} material={alaMat} position={[0.02, 0, 0.03]} />
      </group>
      {fruta && <Rambutan escala={0.03} pelos={120} position={[0, -0.05, 0.08]} />}
    </group>
  );
};

// ---------- brotes que crecen (semillas que dejan los murciélagos) ----------
const hojaBrote = new THREE.MeshStandardMaterial({ color: '#4f8a34', roughness: 0.6, side: THREE.DoubleSide });
const Brote: React.FC<{ k: number; position: [number, number, number]; giro?: number }> = ({ k, position, giro = 0 }) => {
  if (k <= 0) return null;
  const a = 0.05 + k * 0.4;
  return (
    <group position={position} rotation={[0, giro, 0]}>
      <mesh position={[0, a / 2, 0]} material={hojaBrote}>
        <cylinderGeometry args={[0.008, 0.012, a, 6]} />
      </mesh>
      {[-1, 1].map((l) => (
        <mesh key={l} position={[l * 0.05 * k, a, 0]} rotation={[0.2, 0, l * 0.6]} scale={[k, k, k]} material={hojaBrote}>
          <circleGeometry args={[0.07, 10, 0, Math.PI]} />
        </mesh>
      ))}
    </group>
  );
};

// ---------- luna ----------
export const Luna: React.FC<{ position: [number, number, number]; o?: number }> = ({ position, o = 1 }) => (
  <group position={position}>
    <mesh>
      <sphereGeometry args={[7, 32, 24]} />
      <meshBasicMaterial color="#f3f0e2" toneMapped={false} fog={false} transparent opacity={o} />
    </mesh>
    {[11, 16, 24].map((r, i) => (
      <mesh key={r}>
        <sphereGeometry args={[r, 24, 16]} />
        <meshBasicMaterial color="#cfd9ff" transparent opacity={[0.12, 0.06, 0.03][i] * o} depthWrite={false} fog={false} />
      </mesh>
    ))}
  </group>
);

// ---------- piezas 2D (papel tipo cartel, como en el video de referencia) ----------
const Carta: React.FC<{ t: number; desde: number; hasta: number; children: React.ReactNode; estilo?: React.CSSProperties; giro?: number }> = ({ t, desde, hasta, children, estilo, giro = -2 }) => {
  if (t < desde || t > hasta + 0.3) return null;
  const e = interpolate(t, [desde, desde + 0.35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.back(1.8)) });
  const s = avance(t, hasta, 0.3);
  return (
    <div
      style={{
        position: 'absolute',
        background: PAPEL,
        color: TINTA,
        fontFamily: TEXTO,
        fontWeight: 700,
        textAlign: 'center',
        padding: '0.35em 0.7em',
        borderRadius: 6,
        boxShadow: '0 10px 30px rgba(0,0,0,.45), inset 0 0 0 3px rgba(138,28,28,.15)',
        transform: `rotate(${giro}deg) scale(${(0.6 + 0.4 * e) * (1 - s * 0.2)})`,
        opacity: Math.min(1, e * 1.4) * (1 - s),
        ...estilo,
      }}
    >
      {children}
    </div>
  );
};

const OPCIONES: [string, string][] = [
  ['A', 'Un tlacuache'],
  ['B', 'Unos pájaros'],
  ['C', 'Murciélagos'],
  ['D', 'El vecino'],
];

// ---------- video ----------
export const Acertijo: React.FC<Tiempos> = ({ voz, inicios, palabras }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { w, h, u, tipo, fov } = useFormato();
  const u0 = u;
  const hor = tipo === 'horizontal';
  const I = (i: number, otro: number) => inicios[i] ?? otro;
  const W = (p: string, desde = 0, otro = 0) => cuando(palabras, p, desde, otro);
  relojViento.value = t;

  const s = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => I(i, [0, 9.4, 16.5, 24.5, 29.8, 35.2, 41.3, 46.8, 52.7, 57.4, 69.6, 79.9, 85.1][i]));
  const tLadron = W('ladrón', 0, 8.4);
  const tCien = W('cien', s[1], 10.4);
  const tManana = W('mañana', s[1], 13.2);
  const tSesenta = W('sesenta', s[1], 15);
  const tAmarro = W('amarró', s[2], 18.3);
  const tLadro = W('ladró', s[2], 22.2);
  const tHuella = W('huella', s[3], 26.7);
  const tNadie = W('nadie', s[4], 34);
  const tCamara = W('cámara', s[4], 30.4);
  const tMordidas = W('mordidas', s[5], 39.7);
  const tAltas = W('altas', s[6], 43.8);
  const tNoche = W('noche', s[6] + 3, 46);
  const tComen = W('comentarios', s[7], 51.5);
  const tEran = W('eran', s[9], 57.4);
  const tSin = W('ruido', s[9], 62.9);
  const tHuellas = W('huellas', s[9], 64);
  const tTronco = W('tronco', s[9], 65.6);
  const tMadura = W('madura', s[9], 67.8);
  const tDejo = W('dejó', s[10], 71.7);
  const tSemillas = W('semillas', s[10], 75.7);
  const tSelva = W('selva', s[10], 77.4);

  const esc = s.filter((x) => t >= x).length - 1; // escena actual

  // hora del día: atardecer al contar, amanece al ver que faltan, noche en la investigación, amanecer al final
  let cielo = cieloEntre('noche', 'noche', 0);
  if (esc === 1) cielo = t < tManana - 0.4 ? cieloEntre('atardecer', 'noche', suave(t, tCien + 0.5, tManana - 0.4)) : cieloEntre('noche', 'amanecer', suave(t, tManana - 0.4, tManana + 0.6));
  if (esc >= 10) cielo = cieloEntre('noche', 'amanecer', suave(t, s[10], s[10] + 2.5));
  const noche = esc === 1 ? (t < tManana - 0.4 ? suave(t, tCien + 0.5, tManana - 0.4) : 1 - suave(t, tManana - 0.4, tManana + 0.6)) : esc >= 10 ? 1 - suave(t, s[10], s[10] + 2.5) : 1;

  // cámara por escena
  const k = (a: number, b: number) => suave(t, a, b);
  const lerp = (a: THREE.Vector3, b: THREE.Vector3, x: number) => a.clone().lerp(b, x);
  let pos = P(0, 3, 10);
  let mira = P(0, 3, 0);
  if (esc === 0) {
    const x = k(0, s[1]);
    pos = lerp(P(-16, 11, 20), P(-5, 3.2, 9.5), x);
    mira = lerp(P(0, 4, -10), P(0, 3.2, 0), x);
  } else if (esc === 1) {
    const x = k(s[1], s[2]);
    pos = lerp(P(4.8, 1.8, 6.2), P(3.6, 1.6, 4.8), x);
    mira = P(0.7, 2.1, 0.5);
  } else if (esc === 2) {
    if (t < tAmarro - 0.15) {
      const x = k(s[2], tAmarro);
      pos = lerp(P(-4.6, 1.35, 10.2), P(-4.25, 1.05, 8.4), x);
      mira = P(-4, 0.92, 7.1);
    } else {
      const x = k(tAmarro, s[3]);
      pos = lerp(P(2.9, 1.0, 3.6), P(2.4, 0.75, 2.9), x);
      mira = P(1.0, 0.25, 1.1);
    }
  } else if (esc === 3) {
    const x = k(s[3], s[4]);
    pos = lerp(P(-1.6, 0.9, 3.6), P(-0.6, 0.55, 2.8), x);
    mira = P(-0.9, 0.0, 1.9);
  } else if (esc === 4) {
    if (t < tNadie - 1.2) {
      const x = k(s[4], tNadie - 1.2);
      pos = lerp(P(4.6, 1.6, 5.6), P(3.9, 1.4, 4.6), x);
      mira = P(2, 0.9, 2.3);
    } else {
      // lo que ve la cámara: el tronco, de noche, nadie sube
      pos = P(2.25, 1.1, 2.75);
      mira = P(0, 1.6, 0);
    }
  } else if (esc === 5) {
    const x = k(s[5], s[6]);
    pos = lerp(P(0.4, 0.7, 2.9), P(0.0, 0.45, 2.2), x);
    mira = P(-0.55, 0.02, 1.25);
  } else if (esc === 6) {
    const x = k(s[6], s[7]);
    pos = lerp(P(3.4, 1.5, 6.4), P(2.8, 1.3, 5.6), x);
    mira = lerp(P(0, 3.5, 0), P(0, 6.2, -0.5), x);
  } else if (esc === 7 || esc === 8) {
    const x = k(s[7], s[9]);
    pos = lerp(P(-7, 4, 11), P(-6, 3.6, 10), x);
    mira = P(0, 3.4, 0);
  } else if (esc === 9) {
    const x = k(s[9], s[10]);
    pos = lerp(P(5, 2, 13), P(4, 2.2, 11.5), x);
    mira = P(0.5, 7, 0);
  } else if (esc === 10) {
    const x = k(s[10], s[11]);
    pos = lerp(P(5.4, 1.9, 7.6), P(3.8, 1.5, 5.4), x);
    mira = P(0.3, 1.5, 1.2);
  } else {
    const x = k(s[11], s[12] + 3);
    pos = lerp(P(4, 3, 9), P(-6, 10, 16), x);
    mira = P(0, 3, 0);
  }
  const fovE = esc === 3 || esc === 5 ? fov * 0.9 : esc === 6 ? fov * 1.15 : fov;
  const visor = esc === 4 && t >= tNadie - 1.2; // visión nocturna de la cámara
  const enfoque = esc === 7 || esc === 8; // fondo desenfocado mientras se piensa

  // contador sobre Don Chepe
  const cuenta = esc === 1 ? (t < tManana ? Math.round(interpolate(t, [tCien - 0.3, tCien + 0.6], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })) : Math.round(interpolate(t, [tSesenta - 0.4, tSesenta + 0.6], [100, 64], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))) : 0;

  // murciélagos: vuelan alrededor de la copa en la revelación y en el final
  const murcis = Array.from({ length: 7 }, (_, i) => {
    const r = 2.2 + rnd(i) * 1.6;
    const vel = 0.9 + rnd(i * 2) * 0.5;
    const a = t * vel + i * 0.9;
    const y = 7.6 + Math.sin(t * 1.3 + i) * 0.5 + rnd(i * 3) * 1.6;
    const p = P(Math.cos(a) * r, y, Math.sin(a) * r);
    const rumbo = P(-Math.sin(a), Math.cos(t * 1.3 + i) * 0.3, Math.cos(a));
    return { p, rumbo, fase: i * 1.7, fruta: i % 3 === 0 };
  });
  const llegan = esc === 9 ? suave(t, tEran - 0.3, tEran + 1.5) : esc === 6 && t > tNoche - 0.2 ? 0 : 0;
  const vanse = esc === 11 ? suave(t, s[11], s[12]) : 0;

  const big = (hor ? 120 : tipo === 'vertical' ? 150 : 128) * u;
  const caja: React.CSSProperties = hor ? { left: w * 0.05, width: w * 0.4 } : { left: 60 * u, right: 60 * u };
  const arriba = hor ? h * 0.12 : h * (tipo === 'vertical' ? 0.09 : 0.06);

  return (
    <AbsoluteFill style={{ background: '#02040a', overflow: 'hidden' }}>
      <AbsoluteFill style={{ filter: visor ? 'grayscale(1) sepia(1) hue-rotate(60deg) saturate(2.4) brightness(1.5) contrast(1.15)' : enfoque ? 'blur(10px) brightness(0.55)' : undefined }}>
        <FondoCielo c={cielo} t={t} w={w} h={h} sol={[0.74, 0.17]} bokeh={0} estrellas={noche} />
        <ThreeCanvas width={w} height={h} style={{ position: 'absolute', inset: 0 }} gl={{ alpha: true, antialias: true }} shadows="soft">
          <Estudio />
          <CamaraSerie pos={pos} mira={mira} fov={fovE} w={w} h={h} tipo={tipo} />
          <hemisphereLight args={[cielo.amb, '#0f160c', 0.45 + (1 - noche) * 0.5]} />
          <LuzSol position={noche > 0.5 ? [10, 16, 9] : [12, 7, 6]} color={noche > 0.5 ? '#a9bcff' : cielo.luz} intensity={noche > 0.5 ? 1.3 : 2.6} caja={12} />
          <fog attach="fog" args={[cielo.abajo, 25, 150]} />
          <Sombras />
          <SueloReal radio={170} rep={60} oscuro={noche * 0.35} />
          <Pasto n={50000} radio={12} alto={0.16} ancho={0.65} hueco={1.4} tono={-noche * 0.3} viento={0.22} />
          <ManchaTierra radio={2.6} />
          <Nubes t={t} n={8} altura={55} dist={150} arriba={noche > 0.5 ? '#4a5878' : '#ffffff'} abajo={noche > 0.5 ? '#1b2238' : '#c9a8b8'} opacidad={0.75} vel={1.2} />
          <mesh geometry={volcanGeo} position={[18, -0.5, -120]} scale={[8, 8.5, 8]}>
            <meshStandardMaterial vertexColors roughness={0.95} envMapIntensity={0.2} />
          </mesh>
          <Luna position={[60, 70, -140]} o={noche} />
          {/* el árbol 7 y la huerta alrededor */}
          <Arbol position={[0, 0, 0]} racimos={esc === 1 && t < tManana ? 14 : 9} />
          {[[-8, -2], [8, -1], [-7, -10], [7, -11], [0, -12], [-15, 2], [15, 3]].map(([x, z], i) => (
            <group key={i} rotation={[0, 0, Math.sin(t * 0.8 + i) * 0.012]}>
              <Arbol position={[x, 0, z]} racimos={6} escala={0.9 + rnd(i) * 0.25} />
            </group>
          ))}
          <mesh position={[0.05, 1.5, 0.37]} rotation={[0, 0.1, 0]}>
            <planeGeometry args={[0.3, 0.3]} />
            <meshStandardMaterial map={TEX_7 ?? undefined} roughness={0.8} />
          </mesh>
          {esc >= 10 && (
            <mesh position={[0.9, 0.9, 1.25]} rotation={[0, 0.35, 0]}>
              <planeGeometry args={[0.9, 0.45]} />
              <meshStandardMaterial map={TEX_MURCI ?? undefined} roughness={0.8} />
            </mesh>
          )}
          {esc >= 10 && (
            <mesh material={madera} position={[0.9, 0.45, 1.24]}>
              <boxGeometry args={[0.05, 0.9, 0.05]} />
            </mesh>
          )}
          <Porton position={[-4, 0, 7]} giro={0} />
          {(esc === 1 || esc >= 10) && <DonChepe t={t} position={esc === 1 ? [1.5, 0, 2.4] : [1.8, 0, 2.2]} giro={esc === 1 ? -1.25 : 0.6} senala={esc === 1 ? suave(t, tCien - 0.6, tCien) * (1 - suave(t, tManana - 0.6, tManana - 0.2)) : 0} sonrie={esc >= 10 ? 1 : 0} />}
          {esc >= 2 && esc <= 8 && (
            <>
              <Perro t={t} position={[1.0, 0, 1.1]} giro={-0.6} />
              {/* lazo del perro al tronco */}
              <mesh position={[0.6, 0.18, 0.75]} rotation={[0, 0.75, Math.PI / 2 - 0.05]}>
                <cylinderGeometry args={[0.008, 0.008, 0.75, 6]} />
                <meshStandardMaterial color="#c9b48a" roughness={0.9} />
              </mesh>
            </>
          )}
          {esc >= 4 && esc <= 8 && <CamaraTripie t={t} position={[2.2, 0, 2.7]} mira={[0, 1.6, 0]} />}
          {/* cáscaras mordidas bajo el árbol */}
          {esc >= 5 && esc <= 9 &&
            [[-0.55, 1.25, 0.2], [-0.35, 1.45, 1.3], [-0.8, 1.05, 2.4], [-0.2, 1.1, 3.1], [-0.65, 1.6, 4.0]].map(([x, z, r], i) => (
              <Rambutan key={i} escala={0.032} pelos={160} abierto={1} parte={0.4} explota={0} semilla={i + 2} position={[x, 0.03, z]} rotation={[0.4, r, 0.3]} />
            ))}
          {(esc === 9 || esc === 11) && <pointLight position={[2, 9, 5]} intensity={35} distance={25} color="#dfe6ff" />}
          {/* luciérnagas */}
          <Chispas centro={P(0, 1.2, 2)} radio={3.5} t={t} color="#d8ff70" fuerza={noche * 0.9} tam={0.02} />
          {/* murciélagos: llegan en la respuesta y se van al amanecer */}
          {(esc === 9 || esc === 11 || (esc === 6 && t > tAltas)) &&
            murcis.map((m, i) => {
              const sombra = esc === 6; // en las pistas solo se adivina una silueta lejos
              const lejos = esc === 9 ? 1 - llegan : esc === 11 ? vanse : 0;
              const p = sombra ? P(-6 + ((t - tAltas) * 3 + i * 2) % 14, 9 + i * 0.4, -6 - i) : m.p.clone().add(P(-14, 6, -10).multiplyScalar(lejos));
              if (sombra && i > 2) return null;
              return <Murcielago key={i} t={t} position={p} rumbo={sombra ? P(1, 0, 0) : m.rumbo} fase={m.fase} escala={sombra ? 2.5 : 2.6} fruta={!sombra && m.fruta} />;
            })}
          {esc >= 10 &&
            Array.from({ length: 9 }, (_, i) => (
              <Brote key={i} k={suave(t, tSemillas - 0.5 + i * 0.25, tSemillas + 1.5 + i * 0.25)} position={[-2.6 + (i % 3) * 0.7 + rnd(i) * 0.3, 0, 3.2 + Math.floor(i / 3) * 0.6]} giro={rnd(i * 2) * 6} />
            ))}
        </ThreeCanvas>
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.5) 100%)' }} />
      </AbsoluteFill>

      {/* visor de la cámara nocturna */}
      {visor && (
        <AbsoluteFill style={{ border: `${6 * u}px solid rgba(220,255,220,.6)`, margin: 40 * u, borderRadius: 12 * u }}>
          <div style={{ position: 'absolute', left: 30 * u, top: 24 * u, fontFamily: TITULO, fontSize: 56 * u, color: '#ff4a4a', opacity: Math.floor(t * 2) % 2 ? 1 : 0.3 }}>● REC</div>
          <div style={{ position: 'absolute', right: 30 * u, top: 24 * u, fontFamily: TITULO, fontSize: 44 * u, color: '#d8ffd8' }}>03:{String(12 + Math.floor((t - tNadie) * 7) % 48).padStart(2, '0')} AM</div>
        </AbsoluteFill>
      )}

      {/* ---------- textos ---------- */}
      {/* gancho: aparece desde el primer cuadro */}
      <Carta t={t} desde={0} hasta={s[1] - 0.2} estilo={{ ...caja, top: arriba, fontSize: 48 * u, background: TINTA, color: PAPEL }} giro={-3}>
        🕵️ ACERTIJO
      </Carta>
      <Carta t={t} desde={0.15} hasta={tLadron - 0.1} estilo={{ ...caja, top: arriba + 120 * u, fontSize: big * 0.55, lineHeight: 1 }} giro={1.5}>
        EL LADRÓN DEL ÁRBOL 7
      </Carta>
      <Carta t={t} desde={tLadron - 0.1} hasta={s[1] - 0.2} estilo={{ ...caja, top: arriba + 120 * u, fontSize: big * 0.5, lineHeight: 1 }} giro={-1}>
        ¿PUEDES DESCUBRIR QUIÉN ES?
      </Carta>
      {/* contador como en un cartel */}
      {esc === 1 && cuenta > 0 && (
        <Carta t={t} desde={tCien - 0.3} hasta={s[2] - 0.2} estilo={{ left: hor ? w * 0.08 : w * 0.08, top: hor ? h * 0.3 : h * 0.28, fontFamily: TITULO, fontSize: 130 * u, padding: '0.1em 0.45em', color: cuenta < 100 ? '#b0262a' : '#2a4a1a' }} giro={-4}>
          {cuenta}
        </Carta>
      )}
      <Carta t={t} desde={s[1] + 0.1} hasta={tManana - 0.4} estilo={{ ...caja, top: arriba, fontSize: 52 * u }} giro={2}>
        ANTES DE DORMIR
      </Carta>
      <Carta t={t} desde={tManana - 0.3} hasta={s[2] - 0.2} estilo={{ ...caja, top: arriba, fontSize: 52 * u }} giro={-2}>
        A LA MAÑANA SIGUIENTE…
      </Carta>
      <Carta t={t} desde={W('candado', s[2], 16.8) - 0.1} hasta={tAmarro - 0.2} estilo={{ ...caja, top: arriba, fontSize: 56 * u }} giro={-2}>
        🔒 CANDADO PUESTO
      </Carta>
      <Carta t={t} desde={tLadro - 0.2} hasta={s[3] - 0.2} estilo={{ ...caja, top: arriba, fontSize: 56 * u }} giro={2}>
        🐕 EL PERRO NO LADRÓ
      </Carta>
      {esc === 2 && t > tAmarro + 0.6 && (
        <div style={{ position: 'absolute', left: w * (hor ? 0.62 : 0.6), top: h * (hor ? 0.42 : 0.5), fontFamily: TITULO, color: '#fff6dc', textShadow: '0 4px 16px rgba(0,0,0,.6)' }}>
          {['z', 'Z', 'Z'].map((z, i) => (
            <div key={i} style={{ fontSize: (40 + i * 18) * u, opacity: 0.5 + 0.5 * Math.sin(t * 3 - i), transform: `translate(${i * 30 * u}px, ${-((t * 30 + i * 40) % 90) * u}px)` }}>{z}</div>
          ))}
        </div>
      )}
      <Carta t={t} desde={tHuella - 0.2} hasta={s[4] - 0.2} estilo={{ ...caja, top: arriba, fontSize: 56 * u }} giro={-2}>
        🔍 NI UNA HUELLA
      </Carta>
      {esc === 3 && (
        // lupa sobre la tierra mojada
        <div style={{ position: 'absolute', left: w * 0.5 - 170 * u + Math.sin(t * 1.2) * 60 * u, top: h * (hor ? 0.45 : 0.55) - 170 * u, width: 340 * u, height: 340 * u, borderRadius: '50%', border: `${16 * u}px solid #3a2a1a`, boxShadow: `inset 0 0 ${40 * u}px rgba(255,255,255,.35), 0 ${10 * u}px ${30 * u}px rgba(0,0,0,.5)`, background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,.18), transparent 50%)' }}>
          <div style={{ position: 'absolute', right: -110 * u, bottom: -90 * u, width: 160 * u, height: 34 * u, background: '#3a2a1a', borderRadius: 20 * u, transform: 'rotate(40deg)' }} />
        </div>
      )}
      <Carta t={t} desde={tCamara} hasta={tNadie - 1.25} estilo={{ ...caja, top: arriba, fontSize: 52 * u }} giro={2}>
        📹 CÁMARA AL TRONCO
      </Carta>
      <Carta t={t} desde={tNadie - 0.1} hasta={s[5] - 0.2} estilo={{ ...caja, top: arriba + 70 * u, fontSize: 60 * u }} giro={-1}>
        NADIE SUBIÓ
      </Carta>
      <Carta t={t} desde={s[5] + 0.1} hasta={s[6] - 0.2} estilo={{ ...caja, top: arriba, fontSize: 46 * u, background: TINTA, color: PAPEL }} giro={-2}>
        PISTA 1
      </Carta>
      <Carta t={t} desde={tMordidas - 0.2} hasta={s[6] - 0.2} estilo={{ ...caja, top: arriba + 100 * u, fontSize: 56 * u }} giro={1.5}>
        MORDIDAS CHIQUITAS
      </Carta>
      <Carta t={t} desde={s[6] + 0.1} hasta={tAltas - 0.2} estilo={{ ...caja, top: arriba, fontSize: 46 * u, background: TINTA, color: PAPEL }} giro={2}>
        PISTA 2
      </Carta>
      <Carta t={t} desde={W('ramas', s[6], 43) - 0.2} hasta={s[7] - 0.2} estilo={{ ...caja, top: arriba + 100 * u, fontSize: 52 * u }} giro={-1.5}>
        SOLO LAS RAMAS MÁS ALTAS
      </Carta>
      <Carta t={t} desde={tNoche - 0.4} hasta={s[7] - 0.2} estilo={{ ...caja, top: arriba + 200 * u, fontSize: 52 * u }} giro={1}>
        🌙 SIEMPRE DE NOCHE
      </Carta>

      {/* resumen + encuesta + cuenta regresiva */}
      {(esc === 7 || esc === 8) && (() => {
        const items = ['Candado en el portón', 'El perro no ladró', 'Ni una huella', 'Nadie subió al tronco', 'Mordidas chiquitas', 'Solo las ramas altas', 'Siempre de noche'];
        const e = avance(t, s[7], 0.4);
        const enCuenta = esc === 8;
        const u = (hor ? 1 : tipo === 'vertical' ? 1.4 : 1.2) * u0;
        const n = 5 - Math.floor(Math.max(0, t - s[8]) / ((s[9] - s[8]) / 5));
        const prog = ((t - s[8]) % ((s[9] - s[8]) / 5)) / ((s[9] - s[8]) / 5);
        return (
          <AbsoluteFill style={{ display: 'flex', flexDirection: hor ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: 36 * u, padding: `0 ${50 * u}px`, opacity: e }}>
            <div style={{ background: PAPEL, color: TINTA, fontFamily: TEXTO, borderRadius: 10 * u, padding: `${26 * u}px ${36 * u}px`, boxShadow: '0 14px 40px rgba(0,0,0,.5)', transform: `rotate(-1.5deg) scale(${0.85 + 0.15 * e})`, width: hor ? w * 0.4 : undefined }}>
              <div style={{ fontWeight: 700, fontSize: 44 * u, textAlign: 'center', marginBottom: 12 * u }}>LAS PISTAS</div>
              {items.map((it, i) => {
                const v = avance(t, s[7] + 0.3 + i * 0.35, 0.3);
                return (
                  <div key={i} style={{ fontSize: 36 * u, color: '#3a2a1a', opacity: v, transform: `translateX(${(1 - v) * -30 * u}px)`, lineHeight: 1.35 }}>
                    <span style={{ color: '#2e8a3e', fontWeight: 700 }}>✓</span> {it}
                  </div>
                );
              })}
              <div style={{ fontWeight: 700, fontSize: 40 * u, textAlign: 'center', marginTop: 14 * u, color: TINTA }}>¿QUIÉN SE LOS COMÍA?</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 * u }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 * u }}>
                {OPCIONES.map(([l, txt], i) => {
                  const v = avance(t, s[7] + 2.4 + i * 0.2, 0.35, Easing.out(Easing.back(2)));
                  return (
                    <div key={l} style={{ background: '#fff', borderRadius: 14 * u, padding: `${12 * u}px ${18 * u}px`, display: 'flex', alignItems: 'center', gap: 12 * u, transform: `scale(${v})`, boxShadow: '0 8px 20px rgba(0,0,0,.4)', minWidth: 260 * u }}>
                      <span style={{ fontFamily: TITULO, fontSize: 50 * u, color: '#fff', background: TINTA, borderRadius: '50%', width: 66 * u, height: 66 * u, display: 'grid', placeItems: 'center', paddingTop: 6 * u }}>{l}</span>
                      <span style={{ fontFamily: TEXTO, fontWeight: 700, fontSize: 36 * u, color: '#2a1a10' }}>{txt}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontFamily: TITULO, fontSize: 52 * u, color: '#fff6dc', textShadow: '0 4px 14px rgba(0,0,0,.7)', opacity: avance(t, tComen - 0.6, 0.4) }}>COMENTA TU LETRA 👇</div>
              {enCuenta && (
                <div style={{ position: 'relative', width: 190 * u, height: 190 * u, display: 'grid', placeItems: 'center' }}>
                  <svg width={190 * u} height={190 * u} style={{ position: 'absolute', inset: 0 }}>
                    <circle cx={95 * u} cy={95 * u} r={82 * u} fill="rgba(0,0,0,.65)" stroke="rgba(255,255,255,.2)" strokeWidth={10 * u} />
                    <circle cx={95 * u} cy={95 * u} r={82 * u} fill="none" stroke="#ffcf6b" strokeWidth={10 * u} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={prog} transform={`rotate(-90 ${95 * u} ${95 * u})`} />
                  </svg>
                  <span style={{ fontFamily: TITULO, fontSize: 110 * u, color: '#fff', transform: `scale(${1.25 - prog * 0.25})`, paddingTop: 10 * u }}>{Math.max(1, n)}</span>
                </div>
              )}
              {enCuenta && <div style={{ fontFamily: TEXTO, fontWeight: 700, fontSize: 38 * u, color: '#fff6dc', letterSpacing: 2 * u }}>PIENSA · PUEDES PAUSAR</div>}
            </div>
          </AbsoluteFill>
        );
      })()}

      {/* respuesta */}
      <Carta t={t} desde={tEran - 0.1} hasta={s[10] - 0.2} estilo={{ ...caja, top: arriba, fontSize: big * 0.48, background: TINTA, color: PAPEL, lineHeight: 1.05 }} giro={-2}>
        ¡C · MURCIÉLAGOS FRUTEROS!
      </Carta>
      {esc === 9 && (
        <div style={{ position: 'absolute', ...caja, top: hor ? h * 0.42 : h * 0.62, display: 'flex', flexDirection: 'column', gap: 10 * u, alignItems: hor ? 'flex-start' : 'center' }}>
          {[
            [W('llegan', s[9], 60.7), '🌙 Vuelan de noche'],
            [tSin, '🤫 Sin hacer ruido'],
            [tHuellas, '🐾 No dejan huellas'],
            [tTronco, '🌳 No suben por el tronco'],
            [tMadura, '🔴 Escogen la fruta más madura'],
          ].map(([d, txt], i) => {
            const v = avance(t, (d as number) - 0.2, 0.35, Easing.out(Easing.back(2)));
            return (
              <div key={i} style={{ background: 'rgba(244,232,204,.95)', color: '#2a1a10', fontFamily: TEXTO, fontWeight: 700, fontSize: (tipo === 'vertical' ? 50 : 38) * u, padding: `${6 * u}px ${18 * u}px`, borderRadius: 8 * u, opacity: v, transform: `scale(${0.7 + 0.3 * v})` }}>
                <span style={{ color: '#2e8a3e' }}>✓</span> {txt as string}
              </div>
            );
          })}
        </div>
      )}
      <Carta t={t} desde={tDejo - 0.2} hasta={tSemillas - 0.3} estilo={{ ...caja, top: arriba, fontSize: 52 * u }} giro={1.5}>
        UN ÁRBOL SOLO PARA ELLOS 💛
      </Carta>
      <Carta t={t} desde={tSemillas - 0.2} hasta={s[11] - 0.2} estilo={{ ...caja, top: arriba, fontSize: 50 * u }} giro={-1.5}>
        🌱 RIEGAN SEMILLAS
      </Carta>
      <Carta t={t} desde={tSelva - 0.2} hasta={s[11] - 0.2} estilo={{ ...caja, top: arriba + 100 * u, fontSize: 46 * u }} giro={1}>
        LA SELVA DEL SOCONUSCO CRECE
      </Carta>
      <Carta t={t} desde={s[11] + 0.05} hasta={s[12] - 0.15} estilo={{ ...caja, top: hor ? h * 0.35 : h * 0.3, fontSize: big * 0.62, background: TINTA, color: PAPEL }} giro={-2}>
        ¿LO ADIVINASTE?
      </Carta>
      <Carta t={t} desde={W('compártelo', s[11], 82.9) - 0.2} hasta={s[12] - 0.15} estilo={{ ...caja, top: (hor ? h * 0.35 : h * 0.3) + 190 * u, fontSize: 44 * u }} giro={1.5}>
        Compártelo con quien no le atinó 👇
      </Carta>

      <CierreSerie t={t} desde={s[12]} fondo="radial-gradient(circle at 50% 40%, #1d2a4a, #05070f 75%)" />
      {voz && <Audio src={staticFile(`voz/${voz}/toma.mp3`)} />}
    </AbsoluteFill>
  );
};
