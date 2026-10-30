import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { avance, C, Cierre, cuando, Fruta, Tiempos, TITULO, Titulo } from './comun';
import { Arbol, Caja, Camion, Escalera, Globo, Racimo, Trabajador } from './personajes';

// "Buscamos compradores" contado en una huerta animada: la cámara recorre los árboles,
// los trabajadores cortan, prueban la fruta, llega el camión y lo cargan.
// Todo se acomoda a las palabras de la voz (tiempos.json).

const frenonCam = (t: number, desde: number) =>
  t > desde ? Math.exp(-(t - desde) * 6) * Math.sin((t - desde) * 45) * 9 : 0;

const rnd = (i: number) => {
  const x = Math.sin(i * 127.1) * 43758.5453;
  return x - Math.floor(x);
};
const lin = (t: number, a: number[], b: number[], easing = Easing.inOut(Easing.cubic)) =>
  interpolate(t, a, b, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing });

// Vaivén 0→1→0 que se repite cada `periodo` segundos.
const ciclo = (t: number, periodo: number) => ((t % periodo) + periodo) % periodo / periodo;

const ARBOLES_FONDO = [355, 765, 1175, 1585, 1995, 2405, 2815, 3225];
const CAM_S = 1.05;
const ARBOLES_FRENTE = [150, 560, 970, 1380, 1790];

const normal = (p: string) => p.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// Título que aparece palabra por palabra justo cuando la voz la dice.
// `texto`: "/" corta renglón y *palabra* la pinta de rojo.
const Frase: React.FC<{
  t: number;
  palabras: Tiempos['palabras'];
  texto: string;
  desde: number;
  hasta: number;
  size: number;
  top?: number;
}> = ({ t, palabras, texto, desde, hasta, size, top = 150 }) => {
  if (t < desde - 0.6 || t > hasta + 0.4) return null;
  let cursor = desde - 0.6;
  const renglones = texto.split('/').map((r) =>
    r.trim().split(/\s+/).map((crudo) => {
      const rojo = crudo.includes('*');
      const limpio = crudo.replace(/\*/g, '');
      const dicha = palabras.find((p) => p.t >= cursor && p.w === normal(limpio));
      const cuando = dicha ? dicha.t : cursor + 0.12;
      cursor = cuando;
      return { limpio, rojo, cuando };
    }),
  );
  const fuera = avance(t, hasta - 0.05, 0.3, Easing.in(Easing.cubic));
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontFamily: TITULO,
        fontSize: size,
        lineHeight: 0.95,
        opacity: 1 - fuera,
        transform: `translateY(${-fuera * 60}px) scale(${1 - fuera * 0.1})`,
      }}
    >
      {renglones.map((r, i) => (
        <div key={i}>
          {r.map(({ limpio, rojo, cuando }, j) => {
            const k = avance(t, cuando - 0.06, 0.32, Easing.out(Easing.back(2.6)));
            const golpe = 1 + 0.07 * Math.sin(Math.PI * avance(t, cuando, 0.3, Easing.linear));
            return (
              <span
                key={j}
                style={{
                  display: 'inline-block',
                  margin: `0 ${size * 0.17}px`,
                  color: rojo ? C.piel : C.verde,
                  opacity: Math.min(1, k * 1.4),
                  transform: `translateY(${(1 - k) * 50}px) rotate(${(1 - k) * (j % 2 ? 10 : -10)}deg) scale(${(0.4 + 0.6 * k) * golpe})`,
                  textShadow: '0 5px 0 rgba(255,255,255,.7), 0 10px 24px rgba(0,0,0,.18)',
                }}
              >
                {limpio}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const Huerta: React.FC<Tiempos> = ({ voz, inicios, palabras }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const w = (p: string, desde = 0, otro = 0) => cuando(palabras, p, desde, otro);

  // Momentos clave, sacados de la voz.
  const T = {
    imagina: inicios[1],
    tuxtla: w('tuxtla', 0, inicios[1] + 5),
    sol: w('sol', 0, inicios[2]),
    lluvia: w('lluvia', 0, inicios[2] + 0.5),
    dulce: w('dulce', 0, inicios[2] + 2),
    jugoso: w('jugoso', 0, inicios[2] + 3.5),
    camion: inicios[3],
    camioneta: w('camioneta', 0, inicios[3] + 1),
    torton: w('tortón', 0, inicios[3] + 2),
    trailer: w('tráiler', 0, inicios[3] + 3),
    nosotros: inicios[4],
    cosechamos: w('cosechamos', 0, inicios[4] + 0.5),
    empacamos: w('empacamos', 0, inicios[4] + 1.5),
    cargamos: w('cargamos', 0, inicios[4] + 2.4),
    ixchel: inicios[5],
    escribenos: w('escríbenos', 0, inicios[5] + 2.3),
  };

  // Cámara: baja del cielo, recorre la huerta, se acerca al que prueba la fruta,
  // sigue al camino y se queda con el camión.
  const camY = lin(t, [0, 2.6], [520, 0]);
  const camX = lin(
    t,
    [0, T.imagina - 0.3, T.sol - 0.4, T.sol + 0.8, T.camion - 0.2, T.camion + 2, T.ixchel, T.escribenos],
    [0, 0, 1050, 1450, 1450, 2250, 2250, 2350],
  );
  const camVel = Math.abs(
    lin(t + 0.03, [0, T.imagina - 0.3, T.sol - 0.4, T.sol + 0.8, T.camion - 0.2, T.camion + 2, T.ixchel, T.escribenos], [0, 0, 1050, 1450, 1450, 2250, 2250, 2350]) - camX,
  ) / 0.03;
  const desenfoque = Math.min(5, camVel / 300);
  const temblor = frenonCam(t, T.camion + 1.8);
  const zoom = lin(t, [T.dulce - 0.6, T.dulce, T.jugoso + 0.7, T.camion + 0.1], [1, 1.75, 1.75, 1]);
  const lluviaK = lin(t, [T.lluvia - 0.2, T.lluvia + 0.4, T.dulce - 0.4, T.dulce + 0.2], [0, 1, 1, 0]);
  const viento = Math.sin(t * 2.2) * (1.5 + lluviaK * 4);

  // --- Huerta: cosecha (escena 1) ---
  const corteP = 1.4;
  const cortes = Math.max(0, Math.floor((t - T.imagina) / corteP));
  const caida = ciclo(t - T.imagina, corteP);
  const cosechando = t > T.imagina && t < T.sol;
  const risaHuerta = lin(t, [T.tuxtla - 1.6, T.tuxtla - 1.2, T.tuxtla + 0.4, T.tuxtla + 0.8], [0, 1, 1, 0], Easing.linear);
  const xCargador = lin(t, [T.imagina, T.sol - 0.5], [250, 1250], Easing.linear);

  // --- Prueba de la fruta (escena 2) ---
  const muerde = lin(t, [T.dulce - 0.5, T.dulce], [0, 1]);
  const mmm = avance(t, T.dulce + 0.15, 0.3, Easing.out(Easing.back(2)));
  const rico = avance(t, T.jugoso + 0.1, 0.3, Easing.out(Easing.back(2)));

  // --- Camión (escena 3 y 4) ---
  const posCamion = (tt: number) =>
    lin(tt, [T.camion, T.camion + 1.8], [3700, 2600], Easing.out(Easing.cubic)) +
    lin(tt, [T.ixchel + 0.3, T.escribenos + 0.2], [0, -1500], Easing.in(Easing.quad));
  const xCamion = posCamion(t);
  const velCamion = (posCamion(t + 0.05) - posCamion(t - 0.05)) * 10;
  const alto = T.camion + 1.8; // cuando se frena
  const frenon = t > alto ? Math.exp(-(t - alto) * 5) * Math.sin((t - alto) * 30) : 0;
  const rebote = Math.abs(velCamion) > 30 ? Math.sin(t * 28) * 3 : frenon * 8;
  const giro = -(xCamion - 3700) * 0.8;
  const cargaP = 0.8;
  const cargando = t > T.nosotros && t < T.ixchel;
  const cajasArriba = cargando || t >= T.ixchel ? Math.min(12, Math.floor((Math.min(t, T.ixchel) - T.nosotros) / cargaP)) : 0;
  const vuelo = ciclo(t - T.nosotros, cargaP);
  const fiesta = t > T.ixchel;

  // Mundo: todo lo que se mueve con la cámara.
  const mundo = (
    <svg width={4000} height={1920} viewBox="0 0 4000 1920" style={{ position: 'absolute', left: 0, top: 0 }}>
      {/* suelo */}
      <rect x="0" y="1150" width="4000" height="770" fill="#3f7a3a" />
      <rect x="0" y="1150" width="4000" height="40" fill="#4e8a45" />
      {ARBOLES_FONDO.map((x, i) => (
        <Arbol key={x} x={x} y={1260} s={0.72} sway={viento * 0.6 + Math.sin(t + i) * 0.5} />
      ))}
      {/* surcos */}
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={`M${i * 340 - 100} 1920 L${i * 340 + 60} 1300`} stroke="#3a7035" strokeWidth="18" opacity=".6" />
      ))}
      {/* camino de terracería */}
      <path d="M1950 1920 L2150 1700 L4000 1700 L4000 1920 Z" fill="#b98a5a" />
      <path d="M2150 1700 L4000 1700" stroke="#9c7046" strokeWidth="8" />
      {ARBOLES_FRENTE.map((x, i) => (
        <Arbol key={x} x={x} y={1460} s={1.05} sway={viento + Math.sin(t * 1.3 + i) * 0.8} cortados={i === 2 ? Math.min(6, cortes) : 0} />
      ))}

      {/* mariposas */}
      {[
        [400, 1250, 0],
        [1250, 1180, 2],
        [2050, 1300, 4],
        [2700, 1350, 6],
      ].map(([bx, by, ph], i) => {
        const mx = bx + Math.sin(t * 0.9 + ph) * 160;
        const my = by + Math.sin(t * 1.7 + ph) * 60;
        const ala = Math.abs(Math.sin(t * 16 + ph));
        return (
          <g key={i} transform={`translate(${mx} ${my}) rotate(${Math.cos(t * 0.9 + ph) * 25})`}>
            <g transform={`scale(${0.25 + ala * 0.75} 1)`}>
              <path d="M0 0 C-30 -40 -50 -10 -30 8 C-40 30 -10 30 0 6 C10 30 40 30 30 8 C50 -10 30 -40 0 0 Z" fill={i % 2 ? C.oro : '#f08a3c'} />
            </g>
            <rect x="-3" y="-14" width="6" height="28" rx="3" fill="#2a1a12" />
          </g>
        );
      })}
      {/* escena 1: escalera, el que corta con la garrocha y el que recoge */}
      <Escalera x={1060} y={1700} alto={360} />
      <Trabajador
        t={t}
        semilla={1}
        x={1060}
        y={1440}
        dir={-1}
        camisa="#3b6fb6"
        piel={1}
        brazoB={-150 + (cosechando ? Math.sin(t * 9) * 10 : 0)}
        brazoA={-40}
        risa={risaHuerta}
        mano={<line x1="0" y1="0" x2="0" y2="-230" stroke="#8a5a2b" strokeWidth="8" strokeLinecap="round" />}
      />
      {cosechando && caida < 0.75 && (
        <Racimo x={960 + caida * 60} y={1080 + Math.pow(caida / 0.75, 2) * 560} s={0.9} />
      )}
      <Caja x={1000} y={1720} llena={Math.min(1, cortes / 5)} />
      <Trabajador
        t={t}
        semilla={2}
        x={660}
        y={1720}
        dir={-1}
        mujer
        camisa={C.pelo}
        piel={0}
        brazoA={-150 + Math.sin(t * 5) * 18}
        brazoB={-140 + Math.cos(t * 5) * 18}
        risa={risaHuerta}
        salto={risaHuerta * Math.abs(Math.sin(t * 14)) * 18}
      />
      <Caja x={520} y={1740} llena={0.8} />
      <Trabajador
        t={t}
        semilla={3}
        x={xCargador}
        y={1780}
        dir={1}
        camisa="#ffffff"
        piel={2}
        pierna={cosechando ? Math.sin(t * 10) * 22 : 0}
        brazoB={-172}
        brazoA={-172}
        risa={risaHuerta}
      />
      <Caja x={xCargador} y={1780 - 350} s={0.7} />
      <Globo x={700} y={1330} texto="¡JAJAJA!" k={risaHuerta} />
      <Globo x={1120} y={1060} texto="¡ESO!" k={risaHuerta} ancho={220} />

      {/* escena 2: el que prueba la fruta y su compañero */}
      <Trabajador
        t={t}
        semilla={4}
        x={1990}
        y={1720}
        dir={1}
        camisa={C.oro}
        piel={3}
        brazoB={lin(t, [T.dulce - 0.8, T.dulce - 0.2], [-20, -150])}
        risa={muerde * (0.4 + 0.3 * Math.abs(Math.sin(t * 8)))}
        mano={
          <g>
            <circle cx="0" cy="-6" r="20" fill="#f3efe2" />
            <image href={staticFile('fruta.svg')} x={-30} y={-6} width={60} height={62} style={{ clipPath: 'inset(50% 0 0 0)' }} />
          </g>
        }
      />
      <Trabajador
        t={t}
        semilla={5}
        x={2190}
        y={1730}
        dir={-1}
        mujer
        camisa="#e07ab0"
        piel={0}
        brazoB={-120}
        risa={rico}
        salto={rico * Math.abs(Math.sin(t * 12)) * 20}
      />
      {t > T.dulce && t < T.camion + 0.5 &&
        Array.from({ length: 6 }, (_, i) => {
          const k = ciclo(t - T.dulce + i * 0.33, 2);
          return (
            <path
              key={i}
              transform={`translate(${1990 + (rnd(i) - 0.5) * 260} ${1380 - k * 300}) scale(${1.6 + rnd(i + 4)})`}
              d="M0 8 C-14 -4 -12 -16 -4 -16 C0 -16 0 -12 0 -10 C0 -12 0 -16 4 -16 C12 -16 14 -4 0 8 Z"
              fill={C.piel}
              opacity={1 - k}
            />
          );
        })}
      {t > T.jugoso &&
        t < T.jugoso + 1.1 &&
        Array.from({ length: 16 }, (_, i) => {
          const k = avance(t, T.jugoso, 1.1, Easing.linear);
          const a = -Math.PI * (0.1 + 0.8 * (i / 15));
          const vel = 380 + rnd(i) * 260;
          return (
            <ellipse
              key={i}
              cx={2040 + Math.cos(a) * vel * k}
              cy={1440 + Math.sin(a) * vel * k + 900 * k * k}
              rx={9 * (1 - k) + 4}
              ry={14 * (1 - k) + 5}
              fill="#e8f6ff"
              stroke="#bfe3f5"
              strokeWidth="2"
            />
          );
        })}
      <Globo x={1960} y={1340} texto="¡MMM!" k={mmm * (t < T.jugoso ? 1 : 1 - avance(t, T.jugoso, 0.2))} ancho={230} />
      <Globo x={2210} y={1340} texto="¡QUÉ RICO!" k={rico * (1 - avance(t, T.camion, 0.3))} ancho={340} />

      {/* escena 4: pila de cajas, cargadores y el camión */}
      {[0, 1, 2, 3, 4, 5].slice(0, Math.max(0, 6 - Math.floor(cajasArriba / 2))).map((i) => (
        <Caja key={i} x={2330 + (i % 2) * 130} y={1820 - Math.floor(i / 2) * 70} s={0.75} />
      ))}
      {Array.from({ length: 9 }, (_, i) => {
        const tp = t - (i + 1) * 0.1;
        const v = (posCamion(tp + 0.05) - posCamion(tp - 0.05)) * 10;
        if (Math.abs(v) < 60) return null;
        const atras = v < 0 ? 640 * CAM_S + 20 : -20;
        const r = 30 + i * 14;
        return <circle key={i} cx={posCamion(tp) + atras + (v < 0 ? i * 18 : -i * 18)} cy={1830 - i * 9} r={r} fill="#d8b48a" opacity={0.55 - i * 0.055} />;
      })}
      <g transform={`translate(0 ${rebote})`}>
        <Camion x={xCamion} y={1850} s={CAM_S} cajas={cajasArriba} giro={giro} />
      </g>
      {Math.abs(velCamion) > 30 &&
        [0, 1, 2].map((i) => {
          const k = ciclo(t + i * 0.2, 0.6);
          return <circle key={i} cx={xCamion + 655 * CAM_S + k * 60} cy={1790 - k * 90} r={14 + k * 30} fill="#9a9a9a" opacity={0.45 * (1 - k)} />;
        })}
      {cargando && cajasArriba < 12 && (
        <Caja
          x={lin(vuelo, [0, 1], [2470, xCamion + (215 + (cajasArriba % 4) * 112) * CAM_S], Easing.linear)}
          y={lin(vuelo, [0, 1], [1600, 1850 + (-92 - Math.floor(cajasArriba / 4) * 78) * CAM_S], Easing.linear) - Math.sin(vuelo * Math.PI) * 260}
          s={0.6 * CAM_S}
        />
      )}
      <Trabajador
        t={t}
        semilla={6}
        x={2480}
        y={1860}
        dir={1}
        camisa={C.pelo}
        piel={2}
        brazoA={cargando ? -150 + Math.sin(vuelo * Math.PI * 2) * 30 : fiesta ? -160 + Math.sin(t * 10) * 20 : 10}
        brazoB={cargando ? -140 + Math.sin(vuelo * Math.PI * 2) * 30 : fiesta ? -170 + Math.sin(t * 10) * 25 : -10}
        risa={fiesta ? 1 : lin(t, [T.cargamos + 0.4, T.cargamos + 0.7], [0, 1], Easing.linear)}
        salto={fiesta ? Math.abs(Math.sin(t * 9)) * 40 : 0}
      />
      <Trabajador
        t={t}
        semilla={7}
        x={2300}
        y={1880}
        dir={1}
        camisa="#ffffff"
        piel={1}
        brazoB={fiesta ? -170 + Math.sin(t * 11) * 25 : -60 + Math.sin(t * 6) * 15}
        brazoA={fiesta ? -160 : 0}
        risa={fiesta || t > T.cargamos + 0.4 ? 1 : 0}
        salto={fiesta ? Math.abs(Math.cos(t * 9)) * 40 : 0}
      />
      <Globo x={2490} y={1480} texto="¡QUÉ FELICIDAD!" k={avance(t, T.cargamos + 0.5, 0.3, Easing.out(Easing.back(2))) * (1 - avance(t, T.ixchel, 0.3))} ancho={460} />
      <Globo x={2490} y={1440} texto="¡ADIÓS!" k={avance(t, T.ixchel + 0.6, 0.3, Easing.out(Easing.back(2)))} ancho={250} />
      {/* destellos al probar la fruta */}
      {t > T.dulce - 0.2 && t < T.camion &&
        Array.from({ length: 8 }, (_, i) => {
          const k = ciclo(t * 1.3 + rnd(i + 20), 1);
          const sx = 2030 + (rnd(i + 30) - 0.5) * 300;
          const sy = 1420 + (rnd(i + 40) - 0.5) * 220;
          const e = Math.sin(k * Math.PI) * (0.8 + rnd(i) * 0.8);
          return <path key={i} transform={`translate(${sx} ${sy}) scale(${e}) rotate(${t * 90})`} d="M0 -22 L5 -5 L22 0 L5 5 L0 22 L-5 5 L-22 0 L-5 -5 Z" fill="#fff6b0" />;
        })}
    </svg>
  );

  // Cielo: amanece en los primeros segundos.
  const amanecer = avance(t, 0, 2.8, Easing.inOut(Easing.quad));
  const cieloArriba = interpolateColors(amanecer, [0, 1], ['#f59a6b', '#8fd0f0']);
  const cieloAbajo = interpolateColors(amanecer, [0, 1], ['#ffd59a', '#fff3cf']);
  const solTop = lin(t, [0, 2.8], [900, 520]) + camY * 0.4;
  const arcoiris = lin(t, [T.dulce - 0.4, T.dulce + 0.6, T.camion - 0.3, T.camion + 0.4], [0, 0.85, 0.85, 0]);
  const brinco = (desde: number) => avance(t, desde, 0.35, Easing.out(Easing.back(2.5)));

  return (
    <AbsoluteFill style={{ background: `linear-gradient(${cieloArriba}, ${cieloAbajo} 60%)`, overflow: 'hidden' }}>
      <Audio src={staticFile(`voz/${voz}/toma.mp3`)} />

      {/* rayos de sol */}
      <div
        style={{
          position: 'absolute',
          left: 1080 - 190 - 900,
          top: solTop + 150 - 900,
          width: 1800,
          height: 1800,
          borderRadius: '50%',
          background: 'repeating-conic-gradient(rgba(255,240,180,.28) 0 7deg, transparent 7deg 18deg)',
          transform: `rotate(${t * 6}deg)`,
          WebkitMaskImage: 'radial-gradient(circle, #000 15%, transparent 65%)',
          maskImage: 'radial-gradient(circle, #000 15%, transparent 65%)',
        }}
      />
      <svg
        viewBox="-100 -100 200 200"
        width={300}
        height={300}
        style={{ position: 'absolute', right: 40, top: solTop, transform: `rotate(${t * 20}deg) scale(${0.85 + 0.35 * avance(t, T.sol, 0.5, Easing.out(Easing.back(2)))})` }}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={-6} y={-95} width={12} height={30} rx={6} fill="#f2a516" transform={`rotate(${i * 30})`} />
        ))}
        <circle r={58} fill="#fbd24a" />
        <circle r={55} fill="#f8b81f" />
        <circle cx={-18} cy={-18} r={18} fill="rgba(255,255,255,.35)" />
      </svg>

      {/* arcoíris después de la lluvia */}
      <svg width={1080} height={900} style={{ position: 'absolute', left: 0, top: 380 + camY * 0.4, opacity: arcoiris }}>
        {['#e0473a', '#f08a3c', '#f4d96c', '#6cc06a', '#4aa3df', '#7a5cc8'].map((c, i) => (
          <path key={c} d={`M${-60 + i * 26} 900 A ${600 - i * 26} ${600 - i * 26} 0 0 1 ${1140 - i * 26} 900`} stroke={c} strokeWidth={26} fill="none" opacity={0.75} />
        ))}
      </svg>

      {/* volcán Tacaná a lo lejos */}
      <svg width={4000} height={1920} style={{ position: 'absolute', left: -camX * 0.12, top: camY * 0.6 }}>
        <path d="M250 1160 L620 760 Q660 730 700 760 L1080 1160 Z" fill="#9db8b0" />
        <path d="M620 760 Q660 730 700 760 L740 805 Q700 790 660 812 Q630 790 590 800 Z" fill="#f4f1ea" />
        <path d="M1500 1160 L1800 900 Q1830 880 1860 905 L2200 1160 Z" fill="#a9c2b6" />
      </svg>

      {/* nubes y pájaros */}
      {[0, 1, 2, 3].map((i) => (
        <svg key={i} width={340} height={140} viewBox="0 0 340 140" style={{ position: 'absolute', top: 460 + i * 85 + camY * 0.4, left: ((i * 420 - camX * 0.15 + t * (10 + i * 4)) % 1500) - 200, opacity: 0.92, transform: `scale(${0.7 + rnd(i) * 0.6})` }}>
          <path d="M40 120 Q0 120 10 85 Q20 55 60 62 Q80 15 140 25 Q190 0 220 45 Q290 35 300 85 Q330 120 290 120 Z" fill="#fff" />
        </svg>
      ))}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: 6 }, (_, i) => {
          const bx = ((t * (70 + rnd(i) * 50) + i * 260 - camX * 0.25) % 1400) - 160;
          const by = 380 + i * 55 + Math.sin(t * 1.4 + i) * 22 + camY * 0.4;
          const ala = Math.sin(t * 11 + i * 2) * 16;
          return <path key={i} transform={`translate(${bx} ${by}) scale(${0.8 + rnd(i + 7) * 0.6})`} d={`M-22 0 Q-11 ${-ala - 4} 0 0 Q11 ${-ala - 4} 22 0`} stroke="#2a3a33" strokeWidth={4} fill="none" strokeLinecap="round" />;
        })}
      </svg>

      {/* nube de lluvia */}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: lluviaK }}>
        <path
          d={`M${lin(t, [T.lluvia - 0.3, T.lluvia + 0.5], [-500, 280])} 640 q-30 -70 60 -80 q40 -80 150 -50 q90 -40 140 40 q90 0 60 90 Z`}
          fill="#8fa3b0"
          transform="scale(1.4) translate(-120 -170)"
        />
      </svg>

      {/* cerros lejanos (paralaje) */}
      <svg width={4000} height={1920} style={{ position: 'absolute', left: -camX * 0.3, top: camY }}>
        <path d="M0 1160 Q300 900 650 1080 Q900 860 1300 1060 Q1650 880 2000 1070 Q2400 900 2800 1080 Q3200 920 4000 1100 L4000 1200 L0 1200 Z" fill="#7aa864" />
        <path d="M0 1180 Q400 1010 800 1120 Q1200 1000 1700 1130 Q2200 1010 2700 1130 Q3300 1020 4000 1140 L4000 1220 L0 1220 Z" fill="#5f9552" />
      </svg>

      {/* el mundo, con cámara, acercamiento, temblor y desenfoque de movimiento */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '540px 1420px',
          transform: `scale(${zoom}) translate(${temblor * 0.4}px, ${temblor}px)`,
          filter: desenfoque > 0.3 ? `blur(${desenfoque}px)` : undefined,
        }}
      >
        <div style={{ position: 'absolute', left: -camX, top: camY }}>{mundo}</div>
      </div>

      {/* lluvia y salpicaduras */}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: lluviaK }}>
        {Array.from({ length: 55 }, (_, i) => {
          const y = ((t * 1500 + rnd(i) * 1900) % 1500) + 500;
          const x = rnd(i + 50) * 1100;
          return <line key={i} x1={x} x2={x - 16} y1={y} y2={y + 64} stroke="#7fc1e0" strokeWidth={5} strokeLinecap="round" opacity={0.8} />;
        })}
        {Array.from({ length: 18 }, (_, i) => {
          const k = ciclo(t * 2 + rnd(i + 70), 1);
          return <ellipse key={i} cx={rnd(i + 80) * 1080} cy={1560 + rnd(i + 90) * 330} rx={6 + k * 30} ry={2 + k * 8} fill="none" stroke="#cfeaf7" strokeWidth={3} opacity={1 - k} />;
        })}
      </svg>

      {/* pasto en primer plano (se mueve más rápido que la cámara) */}
      <svg width={1080} height={260} style={{ position: 'absolute', left: 0, bottom: -camY * 1.2 - 20, filter: 'blur(1.5px)' }}>
        {Array.from({ length: 26 }, (_, i) => {
          const gx = ((i * 97 - camX * 1.35) % 2522 + 2522) % 2522 - 100;
          if (gx > 1180) return null;
          const sw = Math.sin(t * 2.4 + i) * (6 + lluviaK * 8);
          return (
            <g key={i} transform={`translate(${gx} 260)`}>
              {[-18, 0, 18].map((dx, j) => (
                <path key={j} d={`M${dx - 8} 0 Q${dx + sw * 0.5} -${90 + (i * 7 + j * 13) % 60} ${dx + sw} -${150 + (i * 11 + j * 17) % 70} Q${dx + 4 + sw * 0.3} -60 ${dx + 8} 0 Z`} fill={j === 1 ? '#2c6b33' : '#245a2b'} />
              ))}
              {i % 4 === 0 && <circle cx={sw} cy={-150 - (i % 3) * 20} r={11} fill={i % 8 === 0 ? C.oro : '#f08a3c'} />}
            </g>
          );
        })}
      </svg>

      {/* confeti de rambutanes al final */}
      {fiesta &&
        Array.from({ length: 22 }, (_, i) => {
          const k = avance(t, T.ixchel + rnd(i) * 0.9, 2.2, Easing.in(Easing.quad));
          return (
            <Fruta key={i} size={60 + rnd(i + 9) * 60} style={{ position: 'absolute', left: rnd(i + 3) * 1020 + Math.sin(t * 3 + i) * 30, top: -150 + k * 2100, transform: `rotate(${t * 200 * (i % 2 ? 1 : -1)}deg)` }} />
          );
        })}

      {/* rótulos, palabra por palabra con la voz */}
      <Frase t={t} palabras={palabras} texto="¿QUIERES COMPRAR / *RAMBUTÁN* / POR TONELADA?" desde={inicios[0]} hasta={T.imagina - 0.2} size={150} top={170} />
      <Frase t={t} palabras={palabras} texto="IMAGINA... / CAJAS Y CAJAS / *RECIÉN* *CORTADO*" desde={T.imagina} hasta={T.tuxtla - 0.5} size={124} />
      <Frase t={t} palabras={palabras} texto="TUXTLA CHICO, / *CHIAPAS*" desde={T.tuxtla - 0.3} hasta={T.sol - 0.3} size={140} />
      <Frase t={t} palabras={palabras} texto="EL SOL Y LA LLUVIA / DEL *SOCONUSCO*" desde={T.sol - 0.1} hasta={T.dulce - 0.4} size={120} />
      <Frase t={t} palabras={palabras} texto="*DULCE* Y / *JUGOSO*" desde={T.dulce - 0.3} hasta={T.camion - 0.2} size={190} />
      <Frase t={t} palabras={palabras} texto="TÚ MANDAS / *TU* *CAMIÓN*" desde={T.camion} hasta={T.nosotros - 0.2} size={140} />
      {t > T.camion && t < T.nosotros + 0.1 && (
        <div style={{ position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22, opacity: 1 - avance(t, T.nosotros - 0.25, 0.3) }}>
          {[
            ['CAMIONETA', T.camioneta],
            ['TORTÓN', T.torton],
            ['TRÁILER', T.trailer],
          ].map(([v, s]) => {
            const k = brinco(s as number);
            return (
              <div key={v as string} style={{ fontFamily: TITULO, fontSize: 66, background: C.verde, color: C.oro, padding: '14px 26px 6px', borderRadius: 18, boxShadow: '0 10px 0 rgba(0,0,0,.2)', opacity: Math.min(1, k), transform: `scale(${k}) rotate(${(1 - k) * 12}deg)` }}>
                {v}
              </div>
            );
          })}
        </div>
      )}
      <Frase t={t} palabras={palabras} texto="NOSOTROS..." desde={T.nosotros} hasta={T.ixchel - 0.2} size={104} top={120} />
      {t > T.nosotros && t < T.ixchel + 0.1 && (
        <div style={{ position: 'absolute', top: 250, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, opacity: 1 - avance(t, T.ixchel - 0.25, 0.3) }}>
          {[
            ['COSECHAMOS', T.cosechamos],
            ['EMPACAMOS', T.empacamos],
            ['CARGAMOS', T.cargamos],
          ].map(([v, s]) => {
            const k = brinco(s as number);
            return (
              <div key={v as string} style={{ display: 'flex', alignItems: 'center', gap: 26, opacity: Math.min(1, k), transform: `translateX(${(1 - k) * -80}px)`, width: 640 }}>
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: C.piel, display: 'grid', placeItems: 'center', boxShadow: '0 8px 0 rgba(0,0,0,.18)', transform: `scale(${1 + 0.2 * Math.sin(Math.PI * avance(t, s as number, 0.3, Easing.linear))})` }}>
                  <svg viewBox="0 0 24 24" width={60} height={60}>
                    <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - Math.min(1, k))} />
                  </svg>
                </div>
                <Titulo size={100} style={{ color: C.verde, textShadow: '0 5px 0 rgba(255,255,255,.7)' }}>{v}</Titulo>
              </div>
            );
          })}
        </div>
      )}
      {/* contador de cajas arriba del camión */}
      {cargando && (
        <div style={{ position: 'absolute', right: 40, top: 640, background: C.verde, color: C.oro, borderRadius: 24, padding: '14px 30px 6px', fontFamily: TITULO, fontSize: 58, boxShadow: '0 10px 0 rgba(0,0,0,.2)', transform: `scale(${brinco(T.nosotros + 0.3) * (1 + 0.15 * (1 - ciclo(t - T.nosotros, cargaP)))})` }}>
          CAJAS ARRIBA: <span style={{ color: '#fff' }}>{cajasArriba}</span>
        </div>
      )}
      {t > T.ixchel - 0.2 && t < T.escribenos && (
        <div style={{ position: 'absolute', top: 140, left: 0, right: 0, textAlign: 'center', opacity: 1 - avance(t, T.escribenos - 0.3, 0.3) }}>
          <div style={{ position: 'relative', display: 'inline-block', transform: `scale(${brinco(T.ixchel - 0.1)}) rotate(${(1 - brinco(T.ixchel - 0.1)) * -20}deg)` }}>
            <div style={{ position: 'absolute', inset: -120, borderRadius: '50%', background: 'repeating-conic-gradient(rgba(244,217,108,.55) 0 10deg, transparent 10deg 20deg)', transform: `rotate(${t * 40}deg)`, WebkitMaskImage: 'radial-gradient(circle, #000 30%, transparent 70%)', maskImage: 'radial-gradient(circle, #000 30%, transparent 70%)' }} />
            <Img src={staticFile('logo.svg')} style={{ position: 'relative', width: 300, height: 300 }} />
          </div>
        </div>
      )}
      <Frase t={t} palabras={palabras} texto="IXCHEL, FRUTAS / DEL *SOCONUSCO*" desde={T.ixchel - 0.1} hasta={T.escribenos - 0.25} size={110} top={500} />

      {/* viñeta suave */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(20,30,10,.28) 100%)', pointerEvents: 'none' }} />

      {t >= T.escribenos - 0.25 && <Cierre t={t - (T.escribenos - 0.25)} />}
    </AbsoluteFill>
  );
};
