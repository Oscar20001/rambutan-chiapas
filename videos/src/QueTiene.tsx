import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Corona, Estudio, Gotas } from './RambutanAbre';
import { Rambutan, caida } from './Anuncio3D';
import { CamaraSerie, suave } from './Naturaleza';
import { CierreSerie, Rotulo, useFormato } from './marca';
import { avance, TITULO, TEXTO } from './comun';

// Video 5 de la serie: "¿Qué tiene un rambután?". Voz de Antonio, rápida y juguetona (estilo TikTok).
// Estudio oscuro, la fruta cae, se abre con salpicadura, vista explotada con lo que sí y lo que no se come.
// Datos (base NCC, Universidad de Minnesota, vía Nutrition Advance): 79.5 g de agua y 75 kcal por 100 g,
// vitamina C y fibra; la cáscara y la semilla no se comen.

export const DURACION_QUE = 32;
// tiempos de la voz (transcripción palabra por palabra)
const T = { adentro: 1.8, agua: 3.0, vitamina: 6.8, fibra: 10.4, calorias: 11.4, ojo: 14.8, antojo: 19.1, cierre: 20.1 };
const ACENTO = '#ff2d55';

// proyecta un punto de la escena a la pantalla, contando el corrimiento de CamaraSerie
const aPantalla = (p: THREE.Vector3, pos: THREE.Vector3, mira: THREE.Vector3, fov: number, w: number, h: number, tipo: string) => {
  const cam = new THREE.PerspectiveCamera(fov, w / h, 0.1, 100);
  cam.position.copy(pos);
  cam.lookAt(mira);
  cam.updateMatrixWorld();
  const v = p.clone().project(cam);
  const dx = tipo === 'horizontal' ? (0.618 - 0.5) * w : 0;
  const dy = tipo === 'vertical' ? (0.56 - 0.5) * h : tipo === 'cuadrado' ? 0.05 * h : 0;
  return { x: (v.x * 0.5 + 0.5) * w + dx, y: (-v.y * 0.5 + 0.5) * h + dy };
};

const Marca: React.FC<{ x: number; y: number; a: number; si: boolean; texto: string; lado: 1 | -1; u: number }> = ({ x, y, a, si, texto, lado, u }) => {
  if (a <= 0) return null;
  const c = si ? '#25d366' : ACENTO;
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: Math.min(1, a * 1.4) }}>
      <div style={{ position: 'absolute', left: -12 * u, top: -12 * u, width: 24 * u, height: 24 * u, borderRadius: '50%', background: c, boxShadow: `0 0 ${24 * u}px ${c}` }} />
      <div style={{ position: 'absolute', top: -1, left: lado > 0 ? 0 : -150 * u * a, width: 150 * u * a, height: 2 * u, background: 'rgba(255,255,255,.8)' }} />
      <div
        style={{
          position: 'absolute',
          top: -40 * u,
          [lado > 0 ? 'left' : 'right']: 165 * u,
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          gap: 12 * u,
          flexDirection: lado > 0 ? 'row' : 'row-reverse',
          transform: `translateX(${(1 - a) * 30 * lado * u}px)`,
        } as React.CSSProperties}
      >
        <div style={{ width: 66 * u, height: 66 * u, borderRadius: '50%', background: c, color: '#0a0a0a', fontFamily: TITULO, fontSize: 54 * u, display: 'grid', placeItems: 'center', lineHeight: 1 }}>{si ? '✓' : '✕'}</div>
        <div style={{ fontFamily: TITULO, fontSize: 64 * u, color: 'white', letterSpacing: 3 * u }}>{texto}</div>
      </div>
    </div>
  );
};

// anillo que se llena hasta el 80 %
const Medidor: React.FC<{ v: number; tam: number; o: number }> = ({ v, tam, o }) => {
  const r = tam * 0.42;
  const L = 2 * Math.PI * r;
  return (
    <svg width={tam} height={tam} style={{ opacity: o }}>
      <circle cx={tam / 2} cy={tam / 2} r={r} stroke="rgba(255,255,255,.15)" strokeWidth={tam * 0.06} fill="none" />
      <circle cx={tam / 2} cy={tam / 2} r={r} stroke="#5fd0ff" strokeWidth={tam * 0.06} fill="none" strokeDasharray={`${L * v} ${L}`} strokeLinecap="round" transform={`rotate(-90 ${tam / 2} ${tam / 2})`} style={{ filter: 'drop-shadow(0 0 12px #5fd0ff)' }} />
      <text x={tam / 2} y={tam / 2 + tam * 0.1} textAnchor="middle" fontFamily={TITULO} fontSize={tam * 0.3} fill="#fff">
        {Math.round(v * 100)}%
      </text>
    </svg>
  );
};

export const QueTiene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { w, h, u, tipo, fov } = useFormato();

  // la fruta cae del cielo y rebota al inicio
  const y0 = caida(t, 0.15, 6, 0);
  const golpe = Math.max(0, 1 - Math.abs(t - 0.72) / 0.25);
  const abierto = suave(t, T.adentro + 0.3, T.agua + 0.4);
  const explota = suave(t, T.ojo, T.ojo + 1.2) * (1 - suave(t, T.antojo - 0.2, T.antojo + 0.6));
  const parte = suave(t, T.ojo + 0.3, T.ojo + 1.3);
  const splash = t - (T.adentro + 0.55);

  // cámara: cerca y con sacudida en los golpes; se aleja en la vista explotada
  const sacude = golpe * 0.12;
  const giro = t < T.agua ? 0.3 + t * 0.22 : t < T.ojo ? -0.55 + (t - T.agua) * 0.04 : -0.35 + (t - T.ojo) * 0.08;
  let d = 9.5 - avance(t, 0, 1.5) * 1.5;
  let alto = 0.9;
  let foco = new THREE.Vector3(0, 0.1, 0);
  if (t > T.agua) {
    d = 8.6;
    alto = 2.4;
    foco = new THREE.Vector3(0, 0.3, 0);
  }
  if (t > T.ojo) {
    d = 8.6 + explota * 4.5;
    alto = 1.6;
    foco = new THREE.Vector3(0, 0.4, 0);
  }
  if (t > T.antojo) {
    d = 6.8;
    alto = 2.6;
    foco = new THREE.Vector3(0, 0.5, 0);
  }
  const lejos = tipo === 'vertical' ? 1.75 : tipo === 'cuadrado' ? 1.4 : 1.3;
  const pos = new THREE.Vector3(Math.sin(giro) * d * lejos + Math.sin(t * 40) * sacude, alto + Math.cos(t * 37) * sacude, Math.cos(giro) * d * lejos);

  const barrido = (t * 0.7) % (Math.PI * 2);
  const flash = Math.max(0, 1 - Math.abs(t - 0.72) / 0.15) * 0.6 + Math.max(0, 1 - Math.abs(t - (T.adentro + 0.55)) / 0.15) * 0.5;

  // etiquetas de la vista explotada (posiciones 3D → pantalla)
  const pCascara = aPantalla(new THREE.Vector3(0.9, 2.3 * explota + 0.6, 0), pos, foco, fov, w, h, tipo);
  const pSemilla = aPantalla(new THREE.Vector3(0, 0.75 * parte, 0.3), pos, foco, fov, w, h, tipo);
  const pPulpa = aPantalla(new THREE.Vector3(-0.8, 0.6 * parte, 0), pos, foco, fov, w, h, tipo);
  const aEt = avance(t, T.ojo + 1.0, 0.5) * (1 - avance(t, T.antojo - 0.3, 0.3));

  const porciento = suave(t, T.agua + 0.4, T.agua + 1.8) * 0.8;
  const kcal = Math.round(75 * suave(t, T.calorias + 0.3, T.calorias + 1.8));
  const panel = (k: number): React.CSSProperties => ({ opacity: k, transform: `translateY(${(1 - k) * 30 * u}px) scale(${0.9 + 0.1 * k})` });

  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, #1c1012 0%, #08060a 55%, #020203 100%)' }}>
      <ThreeCanvas width={w} height={h} style={{ position: 'absolute', inset: 0 }} gl={{ alpha: true, antialias: true }}>
        <Estudio />
        <CamaraSerie pos={pos} mira={foco} fov={fov} w={w} h={h} tipo={tipo} />
        <ambientLight intensity={0.14} />
        <spotLight position={[2, 6, 5]} angle={0.5} penumbra={1} intensity={60} color="#fff3e8" />
        <pointLight position={[Math.cos(barrido) * 5, 2.5, Math.sin(barrido) * 5 - 2]} intensity={45} distance={14} color="#ffffff" />
        <pointLight position={[-4, 1, -3]} intensity={30 + golpe * 90} distance={12} color={ACENTO} />
        <pointLight position={[4, -1, -3]} intensity={24} distance={12} color="#7fb6ff" />
        <group position={[0, y0, 0]}>
          {abierto <= 0 ? (
            <Rambutan semilla={7} rotation={[0.15, t * 1.4, 0.05]} />
          ) : (
            <Rambutan semilla={7} abierto={abierto} parte={parte} explota={explota} rotation={[0.12, 0.5, 0.04]} />
          )}
        </group>
        <Gotas s={splash * 0.6} />
        <Corona s={splash * 0.85} />
        <Gotas s={(t - T.agua - 0.6) * 0.5} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.25 - explota * 1.7, 0]}>
          <circleGeometry args={[8, 64]} />
          <meshStandardMaterial color="#000000" roughness={0.75} />
        </mesh>
      </ThreeCanvas>

      {flash > 0 && <AbsoluteFill style={{ background: '#fff', opacity: flash, mixBlendMode: 'screen' }} />}

      <Rotulo t={t} desde={0.1} hasta={T.adentro - 0.05} titulo={<>¡ABRE UN <span style={{ color: ACENTO }}>RAMBUTÁN</span><br />CONMIGO!</>} />
      <Rotulo t={t} desde={T.adentro} hasta={T.agua - 0.05} titulo={<>¿QUÉ TIENE<br />ADENTRO?</>} />
      <Rotulo t={t} desde={T.agua + 0.1} hasta={T.vitamina - 0.1} titulo={<>CASI TODO<br />ES <span style={{ color: '#5fd0ff' }}>AGUA</span></>} sub="Por eso es tan jugoso." />
      <Rotulo t={t} desde={T.vitamina} hasta={T.calorias - 0.1} titulo={<>VITAMINA <span style={{ color: '#ffb02e' }}>C</span><br />Y FIBRA</>} sub="Un antioxidante que tu cuerpo necesita a diario." />
      <Rotulo t={t} desde={T.calorias} hasta={T.ojo - 0.1} titulo={<>LIGERITO</>} sub="Unas 75 calorías por cada 100 gramos." />
      <Rotulo t={t} desde={T.ojo} hasta={T.antojo - 0.1} titulo={<>¡OJO!</>} sub="La cáscara y la semilla no se comen." />
      <Rotulo t={t} desde={T.antojo} hasta={T.cierre - 0.02} titulo={<>¿SE TE <span style={{ color: ACENTO }}>ANTOJÓ</span>?</>} />

      {/* datos grandes en la parte de abajo */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: (tipo === 'vertical' ? 150 : 50) * u, display: 'flex', justifyContent: tipo === 'horizontal' ? 'flex-start' : 'center', paddingLeft: tipo === 'horizontal' ? w * 0.07 : 0, gap: 30 * u }}>
        {t > T.agua && t < T.vitamina + 0.3 && (
          <div style={panel(avance(t, T.agua + 0.2, 0.5) * (1 - avance(t, T.vitamina - 0.2, 0.4)))}>
            <Medidor v={porciento} tam={300 * u} o={1} />
          </div>
        )}
        {t > T.vitamina && t < T.calorias && (
          <>
            <div style={{ ...panel(avance(t, T.vitamina + 0.3, 0.5) * (1 - avance(t, T.calorias - 0.4, 0.4))), padding: `${18 * u}px ${34 * u}px`, borderRadius: 30 * u, background: 'rgba(255,176,46,.16)', border: `${2 * u}px solid #ffb02e`, color: '#ffb02e', fontFamily: TITULO, fontSize: 80 * u }}>VITAMINA C</div>
            <div style={{ ...panel(avance(t, T.fibra, 0.5) * (1 - avance(t, T.calorias - 0.4, 0.4))), padding: `${18 * u}px ${34 * u}px`, borderRadius: 30 * u, background: 'rgba(184,240,46,.14)', border: `${2 * u}px solid #b8f02e`, color: '#b8f02e', fontFamily: TITULO, fontSize: 80 * u }}>FIBRA</div>
          </>
        )}
        {t > T.calorias && t < T.ojo && (
          <div style={{ ...panel(avance(t, T.calorias + 0.2, 0.5) * (1 - avance(t, T.ojo - 0.4, 0.4))), textAlign: 'center', color: '#fff' }}>
            <div style={{ fontFamily: TITULO, fontSize: 220 * u, lineHeight: 0.85 }}>{kcal}</div>
            <div style={{ fontFamily: TEXTO, fontSize: 40 * u, opacity: 0.85 }}>kcal en 100 g</div>
          </div>
        )}
      </div>

      <Marca x={pCascara.x} y={pCascara.y} a={aEt} si={false} texto="CÁSCARA" lado={1} u={u} />
      <Marca x={pSemilla.x} y={pSemilla.y} a={avance(t, T.ojo + 1.4, 0.5) * (1 - avance(t, T.antojo - 0.3, 0.3))} si={false} texto="SEMILLA" lado={1} u={u} />
      <Marca x={pPulpa.x} y={pPulpa.y} a={avance(t, T.ojo + 2.4, 0.5) * (1 - avance(t, T.antojo - 0.3, 0.3))} si texto="PULPA" lado={-1} u={u} />

      <CierreSerie t={t} desde={T.cierre} fondo="radial-gradient(circle at 50% 40%, #3a1218, #0a0406 75%)" />
      <Audio src={staticFile('serie/voz5.mp3')} />
    </AbsoluteFill>
  );
};

