import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { avance, C, Cierre, cuando, Fruta, Tiempos, TITULO, Titulo } from './comun';
import { Arbol, Caja, Camion, Escalera, Globo, Racimo, Trabajador } from './personajes';

// "Buscamos compradores" contado en una huerta animada: la cámara recorre los árboles,
// los trabajadores cortan, prueban la fruta, llega el camión y lo cargan.
// Todo se acomoda a las palabras de la voz (tiempos.json).

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

const Rotulo: React.FC<{ t: number; desde: number; hasta: number; top?: number; children: React.ReactNode }> = ({
  t,
  desde,
  hasta,
  top = 150,
  children,
}) => {
  if (t < desde - 0.1 || t > hasta + 0.3) return null;
  const k = avance(t, desde, 0.35, Easing.out(Easing.back(1.8)));
  const fuera = 1 - avance(t, hasta - 0.05, 0.3);
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 50,
        right: 50,
        opacity: Math.min(k, 1) * fuera,
        transform: `scale(${0.7 + 0.3 * k}) translateY(${(1 - fuera) * -30}px)`,
        color: C.verde,
        textShadow: '0 4px 0 rgba(255,255,255,.55)',
      }}
    >
      {children}
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
  const llegada = lin(t, [T.camion, T.camion + 1.8], [3700, 2600], Easing.out(Easing.cubic));
  const salida = lin(t, [T.ixchel + 0.3, T.escribenos + 0.2], [0, -1500], Easing.in(Easing.quad));
  const xCamion = llegada + salida;
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

      {/* escena 1: escalera, el que corta con la garrocha y el que recoge */}
      <Escalera x={1060} y={1700} alto={360} />
      <Trabajador
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
        x={660}
        y={1720}
        dir={-1}
        camisa={C.pelo}
        piel={0}
        brazoA={-150 + Math.sin(t * 5) * 18}
        brazoB={-140 + Math.cos(t * 5) * 18}
        risa={risaHuerta}
        salto={risaHuerta * Math.abs(Math.sin(t * 14)) * 18}
      />
      <Caja x={520} y={1740} llena={0.8} />
      <Trabajador
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
        x={2190}
        y={1730}
        dir={-1}
        camisa="#3b6fb6"
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
        t < T.jugoso + 1.2 &&
        Array.from({ length: 10 }, (_, i) => {
          const k = avance(t, T.jugoso, 0.9, Easing.out(Easing.quad));
          const a = (i / 10) * Math.PI * 2;
          return <circle key={i} cx={2040 + Math.cos(a) * k * 140} cy={1450 + Math.sin(a) * k * 110} r={10 * (1 - k) + 3} fill="#e8f6ff" />;
        })}
      <Globo x={1960} y={1340} texto="¡MMM!" k={mmm * (t < T.jugoso ? 1 : 1 - avance(t, T.jugoso, 0.2))} ancho={230} />
      <Globo x={2210} y={1340} texto="¡QUÉ RICO!" k={rico * (1 - avance(t, T.camion, 0.3))} ancho={340} />

      {/* escena 4: pila de cajas, cargadores y el camión */}
      {[0, 1, 2, 3, 4, 5].slice(0, Math.max(0, 6 - Math.floor(cajasArriba / 2))).map((i) => (
        <Caja key={i} x={2330 + (i % 2) * 130} y={1820 - Math.floor(i / 2) * 70} s={0.75} />
      ))}
      <Camion x={xCamion} y={1850} s={CAM_S} cajas={cajasArriba} giro={giro} />
      {cargando && cajasArriba < 12 && (
        <Caja
          x={lin(vuelo, [0, 1], [2470, xCamion + (215 + (cajasArriba % 4) * 112) * CAM_S], Easing.linear)}
          y={lin(vuelo, [0, 1], [1600, 1850 + (-92 - Math.floor(cajasArriba / 4) * 78) * CAM_S], Easing.linear) - Math.sin(vuelo * Math.PI) * 260}
          s={0.6 * CAM_S}
        />
      )}
      <Trabajador
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
    </svg>
  );

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(#ffd98a, #fff1c9 55%, #fff6dc)', overflow: 'hidden' }}>
      <Audio src={staticFile(`voz/${voz}/toma.mp3`)} />

      {/* cielo: sol, nubes y lluvia (no se mueven con la cámara) */}
      <svg
        viewBox="-100 -100 200 200"
        width={300}
        height={300}
        style={{ position: 'absolute', right: 40, top: 560 + camY * 0.4, transform: `rotate(${t * 20}deg) scale(${0.8 + 0.4 * avance(t, T.sol, 0.5, Easing.out(Easing.back(2)))})` }}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x={-6} y={-95} width={12} height={30} rx={6} fill="#f2a516" transform={`rotate(${i * 30})`} />
        ))}
        <circle r={55} fill="#f8b81f" />
      </svg>
      {[0, 1, 2].map((i) => (
        <svg key={i} width={340} height={140} viewBox="0 0 340 140" style={{ position: 'absolute', top: 520 + i * 90 + camY * 0.4, left: ((i * 520 - camX * 0.15 + t * 12) % 1500) - 200, opacity: 0.9 }}>
          <path d="M40 120 Q0 120 10 85 Q20 55 60 62 Q80 15 140 25 Q190 0 220 45 Q290 35 300 85 Q330 120 290 120 Z" fill="#fff" />
        </svg>
      ))}
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity: lluviaK }}>
        <path
          d={`M${lin(t, [T.lluvia - 0.3, T.lluvia + 0.5], [-500, 280])} 640 q-30 -70 60 -80 q40 -80 150 -50 q90 -40 140 40 q90 0 60 90 Z`}
          fill="#8fa3b0"
        />
        {Array.from({ length: 40 }, (_, i) => {
          const y = ((t * 1400 + rnd(i) * 1900) % 1400) + 640;
          return <line key={i} x1={rnd(i + 50) * 1080} x2={rnd(i + 50) * 1080 - 14} y1={y} y2={y + 60} stroke="#6fb4d6" strokeWidth={6} strokeLinecap="round" />;
        })}
      </svg>

      {/* cerros lejanos (paralaje) */}
      <svg width={4000} height={1920} style={{ position: 'absolute', left: -camX * 0.3, top: camY }}>
        <path d="M0 1160 Q300 900 650 1080 Q900 860 1300 1060 Q1650 880 2000 1070 Q2400 900 2800 1080 Q3200 920 4000 1100 L4000 1200 L0 1200 Z" fill="#7aa864" />
        <path d="M0 1180 Q400 1010 800 1120 Q1200 1000 1700 1130 Q2200 1010 2700 1130 Q3300 1020 4000 1140 L4000 1220 L0 1220 Z" fill="#5f9552" />
      </svg>

      {/* el mundo, con cámara y acercamiento */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '540px 1420px',
          transform: `scale(${zoom})`,
        }}
      >
        <div style={{ position: 'absolute', left: -camX, top: camY }}>{mundo}</div>
      </div>

      {/* confeti de rambutanes al final */}
      {fiesta &&
        Array.from({ length: 14 }, (_, i) => {
          const k = avance(t, T.ixchel + rnd(i) * 0.8, 2.2, Easing.in(Easing.quad));
          return (
            <Fruta key={i} size={70 + rnd(i + 9) * 50} style={{ position: 'absolute', left: rnd(i + 3) * 1000, top: -150 + k * 2100, transform: `rotate(${t * 200 * (i % 2 ? 1 : -1)}deg)` }} />
          );
        })}

      {/* rótulos */}
      <Rotulo t={t} desde={0.3} hasta={T.imagina - 0.2} top={180}>
        <Titulo size={150}>
          ¿QUIERES COMPRAR
          <br />
          <span style={{ color: C.piel }}>RAMBUTÁN</span>
          <br />
          POR TONELADA?
        </Titulo>
      </Rotulo>
      <Rotulo t={t} desde={T.imagina + 0.9} hasta={T.tuxtla - 0.4}>
        <Titulo size={130}>
          CAJAS Y CAJAS,
          <br />
          <span style={{ color: C.piel }}>RECIÉN CORTADO</span>
        </Titulo>
      </Rotulo>
      <Rotulo t={t} desde={T.tuxtla - 0.3} hasta={T.sol - 0.3}>
        <Titulo size={130}>
          TUXTLA CHICO,
          <br />
          <span style={{ color: C.piel }}>CHIAPAS</span>
        </Titulo>
      </Rotulo>
      <Rotulo t={t} desde={T.sol - 0.1} hasta={T.dulce - 0.4}>
        <Titulo size={120}>
          EL SOL Y LA LLUVIA
          <br />
          DEL <span style={{ color: C.piel }}>SOCONUSCO</span>
        </Titulo>
      </Rotulo>
      <Rotulo t={t} desde={T.dulce - 0.2} hasta={T.camion - 0.2}>
        <Titulo size={160}>
          DULCE Y <span style={{ color: C.piel }}>JUGOSO</span>
        </Titulo>
      </Rotulo>
      <Rotulo t={t} desde={T.camion - 0.1} hasta={T.nosotros - 0.2}>
        <Titulo size={140}>
          TÚ MANDAS
          <br />
          <span style={{ color: C.piel }}>TU CAMIÓN</span>
        </Titulo>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 22, marginTop: 40 }}>
          {[
            ['CAMIONETA', T.camioneta],
            ['TORTÓN', T.torton],
            ['TRÁILER', T.trailer],
          ].map(([v, s]) => {
            const k = avance(t, s as number, 0.3, Easing.out(Easing.back(2.5)));
            return (
              <div key={v as string} style={{ fontFamily: TITULO, fontSize: 66, background: C.verde, color: C.oro, padding: '14px 26px 6px', borderRadius: 14, opacity: Math.min(1, k), transform: `scale(${k})` }}>
                {v}
              </div>
            );
          })}
        </div>
      </Rotulo>
      <Rotulo t={t} desde={T.nosotros - 0.1} hasta={T.ixchel - 0.2} top={130}>
        <Titulo size={110}>NOSOTROS, EN LA HUERTA:</Titulo>
        <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          {[
            ['COSECHAMOS', T.cosechamos],
            ['EMPACAMOS', T.empacamos],
            ['CARGAMOS', T.cargamos],
          ].map(([v, s]) => {
            const k = avance(t, s as number, 0.35, Easing.out(Easing.back(2)));
            return (
              <div key={v as string} style={{ display: 'flex', alignItems: 'center', gap: 26, opacity: Math.min(1, k), transform: `translateX(${(1 - k) * -80}px)`, width: 640 }}>
                <div style={{ width: 96, height: 96, borderRadius: '50%', background: C.piel, display: 'grid', placeItems: 'center' }}>
                  <svg viewBox="0 0 24 24" width={60} height={60}>
                    <path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - Math.min(1, k))} />
                  </svg>
                </div>
                <Titulo size={100}>{v}</Titulo>
              </div>
            );
          })}
        </div>
      </Rotulo>
      <Rotulo t={t} desde={T.ixchel - 0.1} hasta={T.escribenos - 0.25} top={170}>
        <div style={{ textAlign: 'center' }}>
          <Img src={staticFile('logo.svg')} style={{ width: 300, height: 300 }} />
        </div>
        <Titulo size={110}>
          IXCHEL, FRUTAS
          <br />
          DEL <span style={{ color: C.piel }}>SOCONUSCO</span>
        </Titulo>
      </Rotulo>

      {t >= T.escribenos - 0.25 && <Cierre t={t - (T.escribenos - 0.25)} />}
    </AbsoluteFill>
  );
};
