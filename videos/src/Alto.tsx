import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { TITULO } from './comun';
import { Caja, Rambutan, caida } from './Anuncio3D';
import { CamionReal } from './Camion3D';
import { Arbol, Racimo } from './Racimo';
import { Croquis, EtiquetasVuelo, LucesVuelo, camaraVuelo } from './Croquis';
import { CamaraAbre, Estudio } from './RambutanAbre';
import tiempos from '../public/alto/tiempos.json';

// "¡Alto! Si vendes fruta…" — gancho en el primer segundo para compradores, estilo lanzamiento de producto:
// estudio oscuro, luces de contorno, cámara lenta, golpes de luz en cada cambio y logo al final.
// Los tiempos (T) los escribe la transcripción de la voz de Antonio en public/alto/tiempos.json.

const T = tiempos as Record<'alto' | 'siVendes' | 'rambutan' | 'racimos' | 'fuera' | 'dentro' | 'cosechamos' | 'seleccionamos' | 'empacamos' | 'vendemos' | 'camion' | 'cargamos' | 'ixchel' | 'whatsapp' | 'fin', number>;
export const DURACION_ALTO = T.fin + 1.8;
const ACENTO = '#ff2d55';
const MONO = '"DejaVu Sans Mono", monospace';
const tr = (t: number, a: number, b: number, e = Easing.inOut(Easing.cubic)) => e(Math.min(1, Math.max(0, (t - a) / (b - a))));
const rnd = (s: number) => {
  const x = Math.sin(s * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

const Titular: React.FC<{ t: number; desde: number; hasta: number; top: number; tam: number; children: React.ReactNode; golpe?: boolean }> = ({ t, desde, hasta, top, tam, children, golpe }) => {
  if (t < desde || t > hasta) return null;
  const a = tr(t, desde, desde + (golpe ? 0.18 : 0.6), Easing.out(Easing.exp));
  const b = 1 - tr(t, hasta - 0.3, hasta);
  const escala = golpe ? 1.6 - 0.6 * a : 1;
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top, textAlign: 'center', opacity: a * b, transform: `translateY(${golpe ? 0 : (1 - a) * 30}px) scale(${escala})`, letterSpacing: golpe ? 6 : 4 + (1 - a) * 24, filter: golpe ? 'none' : `blur(${(1 - a) * 8}px)` }}>
      <div style={{ fontFamily: TITULO, fontSize: tam, lineHeight: 0.92, color: 'white', textShadow: '0 0 50px rgba(0,0,0,.7)' }}>{children}</div>
    </div>
  );
};

const Check: React.FC<{ t: number; desde: number; hasta: number; top: number; children: React.ReactNode }> = ({ t, desde, hasta, top, children }) => {
  if (t < desde || t > hasta) return null;
  const a = tr(t, desde, desde + 0.35, Easing.out(Easing.back(2)));
  return (
    <div style={{ position: 'absolute', left: 110, top, display: 'flex', alignItems: 'center', gap: 28, opacity: Math.min(1, a * 2) * (1 - tr(t, hasta - 0.3, hasta)), transform: `translateX(${(1 - a) * -60}px)` }}>
      <div style={{ width: 70, height: 70, borderRadius: 18, background: ACENTO, display: 'grid', placeItems: 'center', color: 'white', fontFamily: TITULO, fontSize: 60, transform: `scale(${a})`, boxShadow: `0 0 30px ${ACENTO}88` }}>✓</div>
      <div style={{ fontFamily: TITULO, fontSize: 76, color: 'white', letterSpacing: 3 }}>{children}</div>
    </div>
  );
};

// frutas que caen dentro de la caja, una tras otra
const enCaja = Array.from({ length: 16 }, (_, i) => [-1.5 + (i % 4) * 1.0 + (Math.floor(i / 4) % 2) * 0.3, -0.25 + Math.floor(i / 8) * 0.55, -0.95 + (Math.floor(i / 4) % 2) * 0.9 + (i % 2) * 0.35] as [number, number, number]);

export const Alto: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const cortes = [0, T.siVendes, T.rambutan, T.fuera, T.cosechamos, T.vendemos, T.ixchel];
  const esc = cortes.filter((c) => t >= c - 0.001).length - 1;
  const local = t - cortes[esc];

  // impacto del racimo al caer (gancho)
  const caeHasta = 0.75;
  const yRacimo = t < caeHasta ? interpolate(t, [0, caeHasta], [7, 0], { easing: Easing.in(Easing.quad) }) : Math.sin(Math.min(1, (t - caeHasta) / 0.6) * Math.PI) * 0.25 * Math.exp(-(t - caeHasta) * 3);
  const impacto = Math.max(0, 1 - Math.abs(t - caeHasta) / 0.2);
  const tiembla = impacto * 18 + Math.max(...cortes.slice(1).map((c) => Math.max(0, 1 - Math.abs(t - c) / 0.15))) * 6;

  // cámara por escena
  let pos = new THREE.Vector3(0, 0.6, 9);
  let mira = new THREE.Vector3(0, -0.6, 0);
  let fov = 32;
  if (esc === 0) {
    pos = new THREE.Vector3(0.8, 0.2, 9.5 - local * 0.3);
    mira = new THREE.Vector3(0, -0.7 + yRacimo * 0.6, 0);
  } else if (esc === 1) {
    const a = 0.3 + local * 0.45;
    pos = new THREE.Vector3(Math.sin(a) * 9, 0.2, Math.cos(a) * 9);
    mira = new THREE.Vector3(0, -1.0, 0);
  } else if (esc === 2) {
    const k = tr(local, 0, cortes[3] - cortes[2]);
    pos = new THREE.Vector3(Math.sin(0.5 + k * 0.6) * 12.5, interpolate(k, [0, 1], [1.5, 5.5]), Math.cos(0.5 + k * 0.6) * 12.5);
    mira = new THREE.Vector3(0, interpolate(k, [0, 1], [2.6, 3.8]), 0);
    fov = 38;
  } else if (esc === 3) {
    const d = interpolate(tr(t, T.fuera, T.fuera + 1.2), [0, 1], [11, 7.5]) + tr(t, T.dentro - 0.2, T.dentro + 0.8) * 4;
    const a = 0.4 + local * 0.18;
    pos = new THREE.Vector3(Math.sin(a) * d, 1.2 + tr(t, T.dentro, T.dentro + 1) * 1.8, Math.cos(a) * d);
    mira = new THREE.Vector3(0, 0.3, 0);
  } else if (esc === 4) {
    const a = -0.5 + local * 0.12;
    pos = new THREE.Vector3(Math.sin(a) * 15, 8, Math.cos(a) * 15);
    mira = new THREE.Vector3(0, -0.6, 0);
  } else if (esc === 5) {
    const a = 0.9 - local * 0.1;
    pos = new THREE.Vector3(Math.sin(a) * 22, 5, Math.cos(a) * 22);
    mira = new THREE.Vector3(-1.2, 0.8, 0);
    fov = 40;
  } else {
    pos = new THREE.Vector3(0, 0.5, 12);
    mira = new THREE.Vector3(0, -1.4, 0);
  }

  const enVuelo = esc === 2 && t < T.racimos;
  const kVuelo = tr(t, T.rambutan, T.racimos, Easing.linear);
  if (enVuelo) ({ pos, mira, fov } = camaraVuelo(kVuelo));
  if (esc === 2 && !enVuelo) {
    const k = tr(t, T.racimos, T.fuera);
    pos = new THREE.Vector3(Math.sin(0.5 + k * 0.6) * 12.5, interpolate(k, [0, 1], [1.5, 5.5]), Math.cos(0.5 + k * 0.6) * 12.5);
  }
  const abierto = esc === 3 ? tr(t, T.dentro - 0.3, T.dentro + 0.6) : 0;
  const parte = esc === 3 ? tr(t, T.dentro + 0.7, T.dentro + 1.5) : 0;
  const cajas = esc === 5 ? Math.floor(tr(t, T.vendemos + 0.2, T.ixchel - 0.4, Easing.linear) * 72) : 0;
  const flash = impacto * 0.55 + Math.max(0, 1 - Math.abs(t - T.fin) / 0.15) * 0.8;
  const barrido = (t * 0.7) % (Math.PI * 2);
  const logoA = tr(t, T.ixchel - 0.1, T.ixchel + 0.7, Easing.out(Easing.exp));

  return (
    <AbsoluteFill style={{ background: enVuelo ? 'linear-gradient(#1b3a6b, #6f86a8 55%, #f0b07a)' : 'radial-gradient(ellipse at 50% 42%, #1c1012 0%, #08060a 55%, #020203 100%)' }}>
      <AbsoluteFill style={{ transform: `translate(${(rnd(frame) - 0.5) * tiembla}px, ${(rnd(frame + 7) - 0.5) * tiembla}px)` }}>
        <ThreeCanvas width={width} height={height} linear camera={{ fov: 32, position: [0, 0.6, 9] }}>
          <Estudio />
          <CamaraAbre pos={pos} mira={mira} fov={fov} />
          {enVuelo && <LucesVuelo />}
          {enVuelo && <Croquis dibujo={tr(kVuelo, 0.3, 0.75, Easing.linear)} pin={tr(kVuelo, 0.7, 0.9, Easing.linear)} t={t} />}
          <ambientLight intensity={0.12} />
          <spotLight position={[2, 9, 6]} angle={0.6} penumbra={1} intensity={esc === 2 ? 220 : 90} color="#fff3e8" />
          <pointLight position={[Math.cos(barrido) * 6, 3, Math.sin(barrido) * 6 - 2]} intensity={55} distance={18} color="#ffffff" />
          <pointLight position={[-5, 1.5, -4]} intensity={45 + impacto * 120} distance={16} color={ACENTO} />
          <pointLight position={[5, 0, -4]} intensity={25} distance={16} color="#7fb6ff" />
          {esc <= 1 && <Racimo n={13} semilla={2} pelos={300} position={[0, yRacimo, 0]} rotation={[0, t * 0.15, 0]} />}
          {esc === 2 && !enVuelo && <Arbol position={[0, -0.2, 0]} racimos={8} />}
          {esc === 3 && <Rambutan semilla={7} abierto={abierto} parte={parte} rotation={[0.12, 0.4 + (abierto > 0 ? 0 : local * 0.25), 0.05]} />}
          {esc === 4 && (
            <group>
              <Caja />
              {enCaja.map((p, i) => {
                const desde = T.cosechamos + 0.1 + i * ((T.vendemos - T.cosechamos - 0.8) / enCaja.length);
                return <Rambutan key={i} semilla={i + 50} pelos={200} escala={0.48} position={[p[0], caida(t, desde, 7, p[1]), p[2]]} rotation={[i, i * 2, 0]} />;
              })}
            </group>
          )}
          {esc === 5 && <CamionReal cajas={cajas} position={[0, -1.25, 0]} luces />}
          {esc === 6 && <Rambutan semilla={9} pelos={500} escala={0.9} position={[0, 0.9, 0]} rotation={[0.1, t * 0.5, 0]} />}
          {!enVuelo && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, esc === 2 ? -0.2 : -1.25, 0]}>
            <circleGeometry args={[30, 64]} />
            <meshStandardMaterial color="#000000" roughness={0.75} />
          </mesh>}
        </ThreeCanvas>
      </AbsoluteFill>

      {/* textos que siguen la voz */}
      <Titular t={t} desde={caeHasta - 0.05} hasta={T.siVendes} top={300} tam={260} golpe>
        <span style={{ color: ACENTO }}>¡ALTO!</span>
      </Titular>
      <Titular t={t} desde={T.siVendes} hasta={T.rambutan - 0.05} top={240} tam={130}>
        SI VENDES
        <br />
        FRUTA…
      </Titular>
      <Titular t={t} desde={T.siVendes + 1.1} hasta={T.rambutan - 0.05} top={1480} tam={70}>
        <span style={{ color: ACENTO }}>ESTO TE VA A INTERESAR</span>
      </Titular>
      {enVuelo && <EtiquetasVuelo k={kVuelo} w={width} h={height} />}
      <Titular t={t} desde={T.racimos} hasta={T.fuera - 0.05} top={230} tam={100}>
        RACIMOS RECIÉN
        <br />
        <span style={{ color: ACENTO }}>CORTADOS DEL ÁRBOL</span>
      </Titular>
      <Titular t={t} desde={T.fuera} hasta={T.dentro - 0.05} top={230} tam={100}>
        PELITOS ROJOS
        <br />
        <span style={{ color: '#b8cf4a' }}>CON PUNTA VERDE</span>
      </Titular>
      <Titular t={t} desde={T.dentro + 0.3} hasta={T.cosechamos - 0.05} top={230} tam={120}>
        PULPA BLANCA
        <br />
        <span style={{ color: ACENTO }}>DULCE Y JUGOSA</span>
      </Titular>
      <Check t={t} desde={T.cosechamos} hasta={T.vendemos} top={230}>COSECHADO A MANO</Check>
      <Check t={t} desde={T.seleccionamos} hasta={T.vendemos} top={330}>SELECCIONADO</Check>
      <Check t={t} desde={T.empacamos} hasta={T.vendemos} top={430}>EMPACADO EN LA HUERTA</Check>
      <Titular t={t} desde={T.vendemos} hasta={T.ixchel - 0.05} top={220} tam={150}>
        POR TONELADA
      </Titular>
      <Titular t={t} desde={T.camion} hasta={T.ixchel - 0.05} top={1500} tam={60}>
        TÚ MANDAS TU CAMIÓN
        <br />
        <span style={{ color: ACENTO }}>NOSOTROS LO CARGAMOS</span>
      </Titular>
      {esc === 5 && (
        <div style={{ position: 'absolute', right: 70, top: 420, fontFamily: MONO, color: 'white', textAlign: 'right' }}>
          <div style={{ fontSize: 24, opacity: 0.7, letterSpacing: 4 }}>CARGA</div>
          <div style={{ fontFamily: TITULO, fontSize: 110, lineHeight: 1 }}>{Math.round((cajas / 72) * 100)}%</div>
        </div>
      )}

      {/* cierre */}
      {logoA > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1150, textAlign: 'center', opacity: logoA, transform: `scale(${0.92 + logoA * 0.08})` }}>
          <Img src={staticFile('logo.svg')} style={{ width: 150, background: '#fff4dc', borderRadius: '50%', padding: 8 }} />
          <div style={{ fontFamily: TITULO, fontSize: 96, color: 'white', letterSpacing: 6, marginTop: 18 }}>IXCHEL</div>
          <div style={{ fontFamily: MONO, fontSize: 26, color: 'rgba(255,255,255,.7)', letterSpacing: 6 }}>FRUTAS DEL SOCONUSCO</div>
          <div style={{ display: 'inline-block', marginTop: 40, padding: '14px 44px 8px', borderRadius: 60, background: ACENTO, color: 'white', fontFamily: TITULO, fontSize: 90, letterSpacing: 3, boxShadow: `0 0 60px ${ACENTO}88` }}>
            WA 962 269 9611
          </div>
        </div>
      )}

      <AbsoluteFill style={{ background: 'white', opacity: flash, mixBlendMode: 'screen' }} />
      <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: 'overlay' }}>
        <svg width="100%" height="100%">
          <filter id="g">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 24} />
          </filter>
          <rect width="100%" height="100%" filter="url(#g)" />
        </svg>
      </AbsoluteFill>
      {T.fin > 0 && <Audio src={staticFile('alto/voz.mp3')} />}
      <Audio src={staticFile('alto/musica.wav')} volume={0.3} />
    </AbsoluteFill>
  );
};
