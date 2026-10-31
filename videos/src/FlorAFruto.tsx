import React, { useMemo } from 'react';
import { ThreeCanvas } from '@remotion/three';
import * as THREE from 'three';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Estudio } from './RambutanAbre';
import { Arbol, hojaGeo, hojaMat } from './Racimo';
import { Abeja, CamaraSerie, Chispas, FondoCielo, Frutitos, Pajaro, Panicula, cieloEntre, lugaresPanicula, suave, AUREO } from './Naturaleza';
import { CierreSerie, Rotulo, useFormato } from './marca';
import { TITULO } from './comun';

// Video 1 de la serie: "De flor a fruto". Solo música.
// Amanecer que se vuelve día; flores diminutas sin pétalos, abejas, frutitos verdes que maduran a rojo,
// el árbol completo con pájaros y el cierre con marca y contacto.
// Datos: flores de 2.5–5 mm sin pétalos, abejas de 7 a 11 h, 15–18 semanas de flor a fruto,
// no madura después de cortado (Wikipedia, "Rambutan").

export const DURACION_FLOR = 37.8;
// tiempos de la voz de Antonio (transcripción palabra por palabra)
const S = { flor: 4.2, abejas: 10.4, fruto: 14.7, arbol: 22.1, cierre: 26.5 };

const lerpV = (a: THREE.Vector3, b: THREE.Vector3, k: number) => a.clone().lerp(b, k);

const Hojas: React.FC = () => (
  <group position={[0, -0.25, 0]}>
    {Array.from({ length: 7 }, (_, i) => {
      const a = i * AUREO;
      return <mesh key={i} geometry={hojaGeo} material={hojaMat} position={[Math.cos(a) * 0.12, -0.05 * i, Math.sin(a) * 0.12]} rotation={[0.9, -a + Math.PI / 2, 0]} scale={0.55 + (i % 3) * 0.08} />;
    })}
  </group>
);

const Suelo: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
    <circleGeometry args={[80, 64]} />
    <meshStandardMaterial color="#4f7a2e" roughness={0.95} />
  </mesh>
);

// árboles lejanos sencillos (copas redondas) para dar profundidad a la huerta
const Huerta: React.FC = () => {
  const im = useMemo(() => {
    const m = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshStandardMaterial({ color: '#2f5a26', roughness: 0.9, flatShading: true }), 60);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 60; i++) {
      const a = i * AUREO;
      const r = 9 + Math.sqrt(i) * 3.2;
      const s = 1.8 + ((i * 7) % 5) * 0.25;
      m4.compose(new THREE.Vector3(Math.cos(a) * r, s * 1.4, Math.sin(a) * r - 4), new THREE.Quaternion(), new THREE.Vector3(s * 1.2, s, s * 1.2));
      m.setMatrixAt(i, m4);
    }
    return m;
  }, []);
  return <primitive object={im} />;
};

export const FlorAFruto: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const { w, h, u, tipo, fov } = useFormato();
  const L = useMemo(lugaresPanicula, []);
  const frutos = useMemo(() => L.puntas.slice(0, 13).map((p, i) => ({ ...p, orden: i / 13 })), [L]);

  const arbol = t >= S.arbol;
  // del amanecer al día durante los primeros 10 s
  const cielo = cieloEntre('amanecer', 'dia', suave(t, 0, 14));
  const solY = 0.34 - suave(t, 0, 14) * 0.16;

  // cámara
  let pos: THREE.Vector3;
  let mira: THREE.Vector3;
  if (!arbol) {
    const giro = -0.5 + t * 0.06 + suave(t, S.fruto, S.arbol) * 0.9;
    const dist = 3.3 - suave(t, 0, S.abejas) * 0.55 + suave(t, S.fruto, S.fruto + 2) * 0.25;
    const alto = 0.95 + Math.sin(t * 0.3) * 0.05 - suave(t, S.fruto, S.arbol) * 0.25;
    pos = new THREE.Vector3(Math.sin(giro) * dist, alto, Math.cos(giro) * dist);
    mira = new THREE.Vector3(0, 0.9 - suave(t, S.fruto, S.arbol) * 0.15, 0);
  } else {
    const k = suave(t, S.arbol, S.cierre + 0.5);
    const lejos = tipo === 'vertical' ? 1.45 : tipo === 'cuadrado' ? 1.2 : 1.3;
    pos = lerpV(new THREE.Vector3(1.5, 4.0, 10 * lejos), new THREE.Vector3(4.5, 3.3, 16 * lejos), k);
    mira = new THREE.Vector3(0, 3.4, 0);
  }

  // abejas: tres trayectorias que se acercan a las flores y revolotean (lissajous)
  const abejas = [0, 1, 2].map((i) => {
    const ta = t - S.abejas - i * 0.5;
    const llega = suave(ta, 0, 1.4);
    const a = ta * (0.9 + i * 0.2) + i * 2.1;
    const r = 0.75 - llega * 0.25;
    const p = new THREE.Vector3(Math.cos(a) * r, 0.5 + i * 0.35 + Math.sin(ta * 2.3 + i) * 0.12, Math.sin(a) * r);
    const lejos = new THREE.Vector3(-3 + i, 2.2, 1.5);
    const pp = lerpV(lejos, p, llega);
    const sig = new THREE.Vector3(Math.cos(a + 0.2) * r, pp.y, Math.sin(a + 0.2) * r);
    return { p: pp, mira: llega < 1 ? p : sig, ok: ta > -0.2 && t < S.fruto + 1.2 };
  });

  // pájaros que cruzan
  const vuelo = (t0: number, de: THREE.Vector3, a: THREE.Vector3, dura: number) => {
    const k = (t - t0) / dura;
    return { ok: k > 0 && k < 1, p: lerpV(de, a, k).add(new THREE.Vector3(0, Math.sin(k * Math.PI) * 0.4, 0)), r: a.clone().sub(de) };
  };
  const p1 = vuelo(0.5, new THREE.Vector3(-4, 1.6, -1.5), new THREE.Vector3(4, 1.9, -2.5), 2.4);
  const p2 = vuelo(S.arbol + 0.3, new THREE.Vector3(-9, 5.5, 2), new THREE.Vector3(8, 6.5, -3), 3.2);
  const p3 = vuelo(S.arbol + 0.9, new THREE.Vector3(-8, 4.5, -2), new THREE.Vector3(9, 5.2, -5), 3.6);

  const florecer = 0.12 + suave(t, S.flor - 0.3, S.abejas - 0.2) * 0.88;
  const caer = suave(t, S.fruto, S.fruto + 1.6);
  const crecer = suave(t, S.fruto + 0.4, S.fruto + 4.4);
  const madurar = suave(t, S.fruto + 2, S.arbol - 0.2);
  const semana = Math.max(1, Math.min(18, Math.round(1 + (t - S.fruto) / (S.arbol - 0.4 - S.fruto) * 17)));

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <FondoCielo c={cielo} t={t} w={w} h={h} sol={[0.74, solY]} bokeh={arbol ? 0 : 1} horizonte={arbol ? 1 : 0} />
      <ThreeCanvas width={w} height={h} style={{ position: 'absolute', inset: 0 }} gl={{ alpha: true, antialias: true }}>
        <Estudio />
        <CamaraSerie pos={pos} mira={mira} fov={fov} w={w} h={h} tipo={tipo} />
        <hemisphereLight args={[cielo.amb, '#3a5a20', 0.9]} />
        <directionalLight position={[4, 5, 3]} intensity={2.6} color={cielo.luz} />
        <directionalLight position={[-3, 1.5, -4]} intensity={1.2} color="#ffe0b0" />
        {arbol && <fog attach="fog" args={[cielo.abajo, 14, 60]} />}
        {!arbol && (
          <group>
            <Panicula florecer={florecer} caer={caer} t={t} />
            <Hojas />
            {crecer > 0 && <Frutitos lugares={frutos} crecer={crecer} madurar={madurar} />}
            {abejas.map((b, i) => b.ok && <Abeja key={i} position={b.p} mira={b.mira} t={t + i * 0.13} />)}
            <Chispas centro={new THREE.Vector3(0, 0.85, 0)} radio={0.7} t={t} fuerza={suave(t, S.abejas, S.abejas + 1) * (1 - suave(t, S.fruto, S.fruto + 1))} />
            {p1.ok && <Pajaro position={p1.p} rumbo={p1.r} t={t} escala={0.5} />}
          </group>
        )}
        {arbol && (
          <group>
            <Suelo />
            <Huerta />
            <Arbol position={[0, 0, 0]} racimos={9} />
            {p2.ok && <Pajaro position={p2.p} rumbo={p2.r} t={t} escala={0.55} />}
            {p3.ok && <Pajaro position={p3.p} rumbo={p3.r} t={t} escala={0.45} fase={1.3} />}
          </group>
        )}
      </ThreeCanvas>

      <Rotulo t={t} desde={0.3} hasta={S.flor - 0.1} titulo={<>¿DE DÓNDE SALE<br />UN <span style={{ color: '#ff4a5a' }}>RAMBUTÁN</span>?</>} />
      <Rotulo t={t} desde={S.flor + 0.2} hasta={S.abejas - 0.1} titulo={<>EMPIEZA CON<br />UNA FLOR</>} sub="Diminuta y sin pétalos: mide menos de medio centímetro." />
      <Rotulo t={t} desde={S.abejas + 0.2} hasta={S.fruto - 0.1} titulo={<>LAS ABEJAS<br />LA POLINIZAN</>} sub="Sobre todo de 7 a 11 de la mañana." />
      <Rotulo t={t} desde={S.fruto + 0.2} hasta={S.arbol - 0.1} titulo={<>DE FLOR<br />A FRUTO</>} sub="De 15 a 18 semanas, de verde a rojo." />
      <Rotulo t={t} desde={S.arbol + 0.2} hasta={S.cierre - 0.05} titulo={<>SOLO MADURA<br />EN EL ÁRBOL</>} sub="Por eso lo cosechamos ya en su punto." />

      {t > S.fruto + 0.6 && t < S.arbol - 0.1 && (
        <div
          style={{
            position: 'absolute',
            right: (tipo === 'horizontal' ? 70 : 60) * u,
            bottom: (tipo === 'vertical' ? 200 : 70) * u,
            textAlign: 'right',
            color: '#fff8e6',
            fontFamily: TITULO,
            opacity: suave(t, S.fruto + 0.6, S.fruto + 1.1) * (1 - suave(t, S.arbol - 0.5, S.arbol - 0.1)),
            textShadow: `0 ${4 * u}px ${24 * u}px rgba(0,0,0,.5)`,
          }}
        >
          <div style={{ fontSize: 44 * u, letterSpacing: 6 * u }}>SEMANA</div>
          <div style={{ fontSize: 190 * u, lineHeight: 0.85 }}>{semana}</div>
        </div>
      )}

      <CierreSerie t={t} desde={S.cierre} />
      <Audio src={staticFile('serie/voz1.mp3')} />
    </AbsoluteFill>
  );
};
