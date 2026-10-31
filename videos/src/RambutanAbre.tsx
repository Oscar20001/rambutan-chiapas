import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { TITULO } from './comun';
import { Rambutan } from './Anuncio3D';

// "¿Alguna vez has visto lo que hay dentro de un rambután?" — anuncio estilo lanzamiento de producto:
// estudio oscuro, luces de contorno, salpicadura en cámara lenta, vista explotada y logo al final.
// Los tiempos salen de la voz de Antonio (ElevenLabs speech-to-text, palabra por palabra).

export const DURACION_ABRE = 31.2;
const ACENTO = '#ff2d55';
const MONO = '"DejaVu Sans Mono", monospace';

// segundos en que Antonio dice cada frase
const T = { mira: 4.2, fuera: 5.02, espinternos: 7.74, abres: 9.06, pulpa: 10.7, dulce: 13.08, centro: 14.72, noSeCome: 16.82, tuxtla: 18.08, compras: 20.34, camion: 21.72, whatsapp: 24.82, fin: 29.4 };

const tr = (t: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) => e(Math.min(1, Math.max(0, (t - a) / (b - a))));
const rnd = (s: number) => {
  const x = Math.sin(s * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

export const Estudio: React.FC = () => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useMemo(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.1;
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.35;
  }, [gl, scene]);
  return null;
};

export const CamaraAbre: React.FC<{ pos: THREE.Vector3; mira: THREE.Vector3; fov: number }> = ({ pos, mira, fov }) => {
  const cam = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  cam.position.copy(pos);
  cam.lookAt(mira);
  cam.fov = fov;
  cam.updateProjectionMatrix();
  return null;
};

// gotas de agua refractivas que salen disparadas al abrir, en cámara lenta
const N_GOTAS = 70;
const gotaMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0, metalness: 0.1, transparent: true, opacity: 0.6, emissive: new THREE.Color('#9fb8d8'), emissiveIntensity: 0.35, clearcoat: 1, envMapIntensity: 3, specularIntensity: 1 });
const gotaGeo = new THREE.SphereGeometry(1, 24, 16);
const Gotas: React.FC<{ s: number }> = ({ s }) => {
  const malla = useMemo(() => new THREE.InstancedMesh(gotaGeo, gotaMat, N_GOTAS), []);
  const m = new THREE.Matrix4();
  for (let i = 0; i < N_GOTAS; i++) {
    const a = rnd(i) * Math.PI * 2;
    const sube = 0.35 + rnd(i * 3.1) * 1.1;
    const v = new THREE.Vector3(Math.cos(a) * (0.9 + rnd(i * 5.3) * 1.6), sube * 2.2, Math.sin(a) * (0.9 + rnd(i * 5.3) * 1.6));
    const tt = Math.max(0, s);
    const p = v.clone().multiplyScalar(tt).add(new THREE.Vector3(0, -1.1 * tt * tt + 0.9, 0));
    const r = s <= 0 ? 0 : (0.025 + rnd(i * 7.7) * 0.06) * Math.min(1, s * 6) * (1 - Math.max(0, s - 1.6) / 0.6);
    m.compose(p, new THREE.Quaternion(), new THREE.Vector3(r, r * (1 + 0.3 * rnd(i)), r));
    malla.setMatrixAt(i, m);
  }
  malla.instanceMatrix.needsUpdate = true;
  return <primitive object={malla} />;
};

// corona de agua que se rompe alrededor de la fruta
const Corona: React.FC<{ s: number }> = ({ s }) => {
  if (s <= 0 || s > 1.4) return null;
  const k = Math.min(1, s / 1.4);
  return (
    <mesh position={[0, -0.6, 0]} scale={[1 + k * 2.2, 0.25 + Math.sin(k * Math.PI) * 0.9, 1 + k * 2.2]}>
      <cylinderGeometry args={[1, 0.8, 1, 64, 1, true]} />
      <meshPhysicalMaterial color="#ffffff" transmission={1} roughness={0.05} thickness={0.2} ior={1.33} transparent opacity={1 - k} side={THREE.DoubleSide} />
    </mesh>
  );
};

const Etiqueta: React.FC<{ x: number; y: number; hacia: 'izq' | 'der'; a: number; titulo: string; sub?: string }> = ({ x, y, hacia, a, titulo, sub }) => {
  if (a <= 0) return null;
  const largo = 180 * a;
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: Math.min(1, a * 1.5) }}>
      <div style={{ position: 'absolute', left: -9, top: -9, width: 18, height: 18, borderRadius: '50%', background: ACENTO, boxShadow: `0 0 24px ${ACENTO}` }} />
      <div style={{ position: 'absolute', top: -1, left: hacia === 'der' ? 0 : -largo, width: largo, height: 2, background: 'rgba(255,255,255,.8)' }} />
      <div style={{ position: 'absolute', top: -46, [hacia === 'der' ? 'left' : 'right']: 200, whiteSpace: 'nowrap', textAlign: hacia === 'der' ? 'left' : 'right' } as React.CSSProperties}>
        <div style={{ fontFamily: TITULO, fontSize: 64, color: 'white', letterSpacing: 3, lineHeight: 1 }}>{titulo}</div>
        {sub && <div style={{ fontFamily: MONO, fontSize: 24, color: ACENTO, marginTop: 6 }}>{sub}</div>}
      </div>
    </div>
  );
};

const Titular: React.FC<{ t: number; desde: number; hasta: number; top: number; tam: number; children: React.ReactNode; color?: string }> = ({ t, desde, hasta, top, tam, children, color = 'white' }) => {
  if (t < desde || t > hasta) return null;
  const a = tr(t, desde, desde + 0.6, Easing.out(Easing.exp));
  const b = 1 - tr(t, hasta - 0.35, hasta);
  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top, textAlign: 'center', opacity: a * b, transform: `translateY(${(1 - a) * 30}px)`, letterSpacing: 4 + (1 - a) * 24, filter: `blur(${(1 - a) * 8}px)` }}>
      <div style={{ fontFamily: TITULO, fontSize: tam, lineHeight: 0.92, color, textShadow: '0 0 40px rgba(0,0,0,.6)' }}>{children}</div>
    </div>
  );
};

export const RambutanAbre: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  // estados del modelo
  const abierto = tr(t, T.abres + 0.1, T.pulpa + 0.4, Easing.inOut(Easing.quad));
  const parte = tr(t, T.centro - 0.1, T.centro + 0.9);
  const explota = tr(t, T.centro + 0.2, T.centro + 1.2) * (1 - tr(t, T.tuxtla - 0.3, T.tuxtla + 0.6));
  const cierra = tr(t, T.tuxtla - 0.3, T.tuxtla + 0.8);
  const splash = t - T.abres;

  // cámara: aparece de la oscuridad → macro de pelitos → apertura → vista explotada → héroe → logo
  const giro = t * 0.35;
  let d = interpolate(t, [0, T.mira], [13.5, 9.4], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  let y = 0.6;
  let foco = new THREE.Vector3(0, 0, 0);
  let fov = 32;
  if (t >= T.fuera && t < T.abres) {
    const k = tr(t, T.fuera, T.fuera + 1.2);
    d = interpolate(k, [0, 1], [9.4, 5.4]);
    y = 0.9;
    foco = new THREE.Vector3(0.2, 0.5, 0);
    fov = 28;
  } else if (t >= T.abres && t < T.centro) {
    const k = tr(t, T.abres, T.abres + 1.4);
    d = interpolate(k, [0, 1], [10.5, 8.6]);
    y = interpolate(k, [0, 1], [1.5, 3.0]);
    foco = new THREE.Vector3(0, 0.4, 0);
  } else if (t >= T.centro && t < T.tuxtla) {
    d = interpolate(tr(t, T.centro, T.centro + 1.2), [0, 1], [9, 13.5]);
    y = 1.6;
    foco = new THREE.Vector3(0, 0.4 * (1 - explota) + 0.5 * explota, 0);
  } else if (t >= T.tuxtla) {
    d = interpolate(tr(t, T.tuxtla, T.whatsapp), [0, 1], [10.5, 12.5]);
    y = 0.8;
    foco = new THREE.Vector3(0, interpolate(tr(t, T.whatsapp - 0.3, T.whatsapp + 0.8), [0, 1], [0, -0.9]), 0);
  }
  const ang = t >= T.abres && t < T.tuxtla ? 0.35 + (t - T.abres) * 0.05 : giro;
  const pos = new THREE.Vector3(Math.sin(ang) * d, y, Math.cos(ang) * d);

  // luces: contorno que barre, más el acento rojo que entra en el golpe
  const barrido = (t * 0.6) % (Math.PI * 2);
  const golpe = Math.max(0, 1 - Math.abs(t - T.abres - 0.25) / 0.5);
  const entrada = tr(t, 0, 2.5, Easing.out(Easing.quad));
  const fruta = t < T.abres ? (
    <Rambutan semilla={3} rotation={[0.12, t >= T.fuera ? 0.3 + (t - T.fuera) * 0.25 : t * 0.4, 0.05]} />
  ) : (
    <Rambutan semilla={3} abierto={abierto * (1 - cierra)} parte={parte * (1 - cierra)} explota={explota} rotation={[0.12, 0.4, 0.04]} />
  );

  // brillo que cruza la pantalla en momentos clave
  const sweep = (t0: number) => tr(t, t0, t0 + 0.9, Easing.inOut(Easing.quad));
  const brillo = [T.mira, T.pulpa + 0.6, T.tuxtla + 0.3].map(sweep).find((v) => v > 0 && v < 1) ?? 0;
  const flash = Math.max(0, 1 - Math.abs(t - T.abres - 0.15) / 0.18) * 0.7 + Math.max(0, 1 - Math.abs(t - T.fin) / 0.15) * 0.8;

  const logoA = tr(t, T.whatsapp - 0.2, T.whatsapp + 0.7, Easing.out(Easing.exp));

  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 42%, #1c1012 0%, #08060a 55%, #020203 100%)' }}>
      <ThreeCanvas width={width} height={height} linear camera={{ fov: 32, position: [0, 0.6, 9] }}>
        <Estudio />
        <CamaraAbre pos={pos} mira={foco} fov={fov} />
        <ambientLight intensity={0.08 + entrada * 0.06} />
        {/* luz principal suave desde arriba */}
        <spotLight position={[2, 6, 5]} angle={0.5} penumbra={1} intensity={60 * entrada} color="#fff3e8" />
        {/* contornos que dan la vuelta */}
        <pointLight position={[Math.cos(barrido) * 5, 2.5, Math.sin(barrido) * 5 - 2]} intensity={45 * entrada} distance={14} color="#ffffff" />
        <pointLight position={[-4, 1, -3]} intensity={(30 + golpe * 80) * entrada} distance={12} color={ACENTO} />
        <pointLight position={[4, -1, -3]} intensity={20 * entrada} distance={12} color="#7fb6ff" />
        <group position={[0, interpolate(entrada, [0, 1], [-0.4, 0]), 0]}>{fruta}</group>
        <Gotas s={splash * 0.55} />
        <Corona s={splash * 0.8} />
        {/* piso negro brillante que refleja */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.25 - explota * 1.7, 0]}>
          <circleGeometry args={[8, 64]} />
          <meshStandardMaterial color="#000000" roughness={0.75} />
        </mesh>
      </ThreeCanvas>

      {/* barrido de luz */}
      {brillo > 0 && (
        <AbsoluteFill style={{ background: `linear-gradient(110deg, transparent ${brillo * 140 - 30}%, rgba(255,255,255,.22) ${brillo * 140 - 18}%, transparent ${brillo * 140 - 6}%)`, mixBlendMode: 'screen' }} />
      )}

      {/* textos que siguen la voz */}
      <Titular t={t} desde={0.3} hasta={T.mira - 0.1} top={260} tam={120}>
        ¿QUÉ HAY
        <br />
        DENTRO?
      </Titular>
      <Etiqueta x={640} y={720} hacia="der" a={tr(t, T.espinternos - 0.1, T.espinternos + 0.5) * (1 - tr(t, T.abres - 0.3, T.abres))} titulo="ESPINTERNOS" sub="los pelitos del rambután" />
      <Titular t={t} desde={T.dulce - 0.1} hasta={T.centro - 0.05} top={230} tam={150}>
        DULCE
        <br />
        <span style={{ color: ACENTO }}>Y JUGOSA</span>
      </Titular>
      <Etiqueta x={640} y={330} hacia="der" a={tr(t, T.centro + 0.9, T.centro + 1.4) * (1 - tr(t, T.tuxtla - 0.5, T.tuxtla - 0.1))} titulo="CÁSCARA" />
      <Etiqueta x={350} y={950} hacia="izq" a={tr(t, T.centro + 1.1, T.centro + 1.6) * (1 - tr(t, T.tuxtla - 0.5, T.tuxtla - 0.1))} titulo="PULPA" sub="blanca y brillante" />
      <Etiqueta x={470} y={860} hacia="der" a={tr(t, T.noSeCome - 0.2, T.noSeCome + 0.3) * (1 - tr(t, T.tuxtla - 0.5, T.tuxtla - 0.1))} titulo="SEMILLA" sub="no se come" />
      <Titular t={t} desde={T.tuxtla} hasta={T.compras - 0.05} top={250} tam={120}>
        TUXTLA CHICO
        <br />
        <span style={{ fontSize: 70, letterSpacing: 10, color: ACENTO }}>CHIAPAS</span>
      </Titular>
      <Titular t={t} desde={T.compras} hasta={T.whatsapp - 0.3} top={230} tam={140}>
        POR TONELADA
      </Titular>
      <Titular t={t} desde={T.camion} hasta={T.whatsapp - 0.3} top={1500} tam={52}>
        Tú mandas tu camión · lo cargamos en la huerta
      </Titular>

      {/* cierre: logo + WhatsApp */}
      {logoA > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1180, textAlign: 'center', opacity: logoA, transform: `scale(${0.92 + logoA * 0.08})` }}>
          <Img src={staticFile('logo.svg')} style={{ width: 150, background: '#fff4dc', borderRadius: '50%', padding: 8 }} />
          <div style={{ fontFamily: TITULO, fontSize: 96, color: 'white', letterSpacing: 6, marginTop: 18 }}>IXCHEL</div>
          <div style={{ fontFamily: MONO, fontSize: 26, color: 'rgba(255,255,255,.7)', letterSpacing: 6 }}>FRUTAS DEL SOCONUSCO</div>
          <div style={{ display: 'inline-block', marginTop: 40, padding: '14px 44px 8px', borderRadius: 60, background: ACENTO, color: 'white', fontFamily: TITULO, fontSize: 90, letterSpacing: 3, boxShadow: `0 0 60px ${ACENTO}88` }}>
            WA 962 269 9611
          </div>
        </div>
      )}

      <AbsoluteFill style={{ background: 'white', opacity: flash, mixBlendMode: 'screen' }} />
      {/* grano fino */}
      <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: 'overlay' }}>
        <svg width="100%" height="100%">
          <filter id="g">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 24} />
          </filter>
          <rect width="100%" height="100%" filter="url(#g)" />
        </svg>
      </AbsoluteFill>
      <Audio src={staticFile('abre/voz.mp3')} />
      
    </AbsoluteFill>
  );
};
