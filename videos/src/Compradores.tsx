import React from 'react';
import { Audio, Easing, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { avance, C, Cierre, Fruta, Marco, Tiempos, TEXTO, Titulo } from './comun';

// Frutas que caen en la primera escena: [x, retraso, tamaño, giro].
const LLUVIA: [number, number, number, number][] = [
  [80, 0.0, 190, -20], [330, 0.15, 150, 15], [560, 0.05, 210, -8], [800, 0.25, 170, 25],
  [180, 0.4, 140, 30], [700, 0.45, 160, -30], [450, 0.6, 180, 10], [900, 0.7, 130, -15],
];

// Pila de cajas: [x, y] de abajo hacia arriba.
const PILA: [number, number][] = [
  [130, 1150], [420, 1150], [710, 1150], [275, 890], [565, 890], [420, 630],
];

const Caja: React.FC = () => (
  <svg viewBox="0 0 240 230" width={240} height={230}>
    {[40, 85, 130, 175, 62, 108, 152].map((x, i) => (
      <circle key={i} cx={x + 10} cy={i < 4 ? 62 : 40} r={30} fill={i % 2 ? C.pelo : C.piel} />
    ))}
    <rect x="4" y="70" width="232" height="156" rx="8" fill={C.oro} stroke={C.verde} strokeWidth="6" />
    <rect x="4" y="118" width="232" height="10" fill={C.oroSuave} />
    <text x="120" y="190" textAnchor="middle" fontFamily="Bebas Neue" fontSize="54" fill={C.verde}>IXCHEL</text>
  </svg>
);

const Camion: React.FC = () => (
  <svg viewBox="0 0 520 260" width={780} height={390}>
    <rect x="10" y="40" width="330" height="160" rx="10" fill={C.oro} />
    <text x="175" y="140" textAnchor="middle" fontFamily="Bebas Neue" fontSize="62" fill={C.verde}>
      TU CAMIÓN
    </text>
    <path d="M350 90h90l60 60v50H350z" fill={C.pelo} />
    <path d="M370 105h62l40 42h-102z" fill="#cfe8f0" />
    <rect x="0" y="196" width="510" height="16" rx="6" fill={C.rojo} />
    {[90, 260, 430].map((x) => (
      <g key={x}>
        <circle cx={x} cy="215" r="34" fill="#222" />
        <circle cx={x} cy="215" r="14" fill={C.oroSuave} />
      </g>
    ))}
  </svg>
);

export const Compradores: React.FC<Tiempos> = ({ voz, inicios }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const t = frame / fps;
  const [e1, e2, e3, e4, fin] = [1, 2, 3, 4].map((n) => inicios[n] - 0.15).concat(inicios[5] - 0.3);
  const escena = [0, e1, e2, e3, e4].filter((s) => t >= s).length - 1;
  const entra = (s: number) => avance(t, s, 0.5);
  const sale = (s: number) => 1 - avance(t, s - 0.25, 0.25);

  return (
    <Marco>
      <Audio src={staticFile(`voz/${voz}/toma.mp3`)} />

      {escena === 0 && (
        <>
          {LLUVIA.map(([x, d, s, g], i) => {
            const k = avance(t, d, 1.1, Easing.bounce);
            return (
              <Fruta
                key={i}
                size={s}
                style={{
                  position: 'absolute',
                  left: x,
                  top: -260 + k * (height - 520 - (i % 3) * 160),
                  transform: `rotate(${g + t * 20 * (i % 2 ? 1 : -1)}deg)`,
                }}
              />
            );
          })}
          <Titulo size={190} style={{ position: 'absolute', top: 300, left: 60, right: 60, opacity: entra(0.1) * sale(e1), transform: `scale(${0.8 + 0.2 * entra(0.1)})` }}>
            ¿QUIERES COMPRAR <span style={{ color: C.pelo }}>RAMBUTÁN</span>
            <br />
            POR TONELADA?
          </Titulo>
        </>
      )}

      {escena === 1 && (
        <div style={{ position: 'absolute', inset: 0, opacity: entra(e1) * sale(e2) }}>
          <Titulo size={130} style={{ position: 'absolute', top: 230, left: 60, right: 60 }}>
            CAJAS Y CAJAS,
            <br />
            <span style={{ color: C.pelo }}>RECIÉN CORTADO</span>
          </Titulo>
          {PILA.map(([x, y], i) => {
            const k = avance(t, e1 + 0.3 + i * 0.22, 0.5, Easing.out(Easing.bounce));
            return (
              <div key={i} style={{ position: 'absolute', left: x, top: -400 + k * (y + 400) }}>
                <Caja />
              </div>
            );
          })}
          <Titulo size={110} style={{ position: 'absolute', top: 1500, left: 60, right: 60, opacity: avance(t, e1 + 1.6, 0.5) }}>
            TUXTLA CHICO, CHIAPAS
          </Titulo>
        </div>
      )}

      {escena === 2 && (
        <div style={{ position: 'absolute', inset: 0, opacity: entra(e2) * sale(e3) }}>
          <svg viewBox="-100 -100 200 200" width={360} height={360} style={{ position: 'absolute', left: 60, top: 140, transform: `rotate(${t * 25}deg)` }}>
            {Array.from({ length: 12 }, (_, i) => (
              <rect key={i} x={-6} y={-95} width={12} height={34} rx={6} fill={C.oro} transform={`rotate(${i * 30})`} />
            ))}
            <circle r={52} fill={C.oro} />
          </svg>
          {Array.from({ length: 18 }, (_, i) => {
            const x = 500 + ((i * 137) % 560);
            const y = ((t * 900 + i * 211) % 1500) - 100;
            return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 8, height: 60, borderRadius: 4, background: '#9fd3e6', opacity: 0.7 }} />;
          })}
          <div style={{ position: 'absolute', left: 290, top: 620, width: 500, height: 520 }}>
            <div
              style={{
                position: 'absolute', left: 150, top: 150, width: 200, height: 230, borderRadius: '50%',
                background: 'radial-gradient(circle at 38% 32%, #fff 0 18%, #f3efe2 45%, #d9d2bd 100%)',
                boxShadow: '0 10px 30px rgba(0,0,0,.25)', transform: `scale(${1 + avance(t, e2 + 1.2, 0.6) * 0.2})`,
              }}
            />
            {([-1, 1] as const).map((lado) => {
              const a = avance(t, e2 + 0.9, 0.8);
              return (
                <Fruta
                  key={lado}
                  size={500}
                  style={{
                    position: 'absolute', left: 0, top: 0,
                    clipPath: lado < 0 ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)',
                    transform: `translate(${lado * a * 170}px, ${a * 40}px) rotate(${lado * a * 30}deg)`,
                  }}
                />
              );
            })}
          </div>
          <Titulo size={170} style={{ position: 'absolute', top: 1330, left: 60, right: 60, opacity: avance(t, e2 + 0.3, 0.4) }}>
            DULCE Y <span style={{ color: C.pelo }}>JUGOSO</span>
          </Titulo>
        </div>
      )}

      {escena === 3 && (
        <div style={{ position: 'absolute', inset: 0, opacity: sale(e4) }}>
          <Titulo size={180} style={{ position: 'absolute', top: 300, left: 60, right: 60, opacity: entra(e3) }}>
            TÚ MANDAS
            <br />
            TU CAMIÓN
          </Titulo>
          <div style={{ position: 'absolute', top: 820, left: -800 + 950 * avance(t, e3 + 0.1, 1.2) }}>
            <Camion />
          </div>
          <div style={{ position: 'absolute', top: 1340, left: 60, right: 60, display: 'flex', justifyContent: 'center', gap: 24 }}>
            {['CAMIONETA', 'TORTÓN', 'TRÁILER'].map((v, i) => (
              <div
                key={v}
                style={{
                  fontFamily: 'Bebas Neue',
                  fontSize: 70,
                  border: `4px solid ${C.oro}`,
                  padding: '14px 28px 6px',
                  opacity: avance(t, e3 + 1.2 + i * 0.25, 0.3),
                  transform: `translateY(${(1 - avance(t, e3 + 1.2 + i * 0.25, 0.3)) * 30}px)`,
                }}
              >
                {v}
              </div>
            ))}
          </div>
        </div>
      )}

      {escena === 4 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <Titulo size={150} style={{ position: 'absolute', top: 280, left: 60, right: 60, opacity: entra(e4) }}>
            NOSOTROS, EN
            <br />
            LA HUERTA:
          </Titulo>
          {['COSECHAMOS', 'EMPACAMOS', 'CARGAMOS'].map((v, i) => {
            const k = avance(t, e4 + 0.4 + i * 0.55, 0.4, Easing.out(Easing.back(2)));
            return (
              <div key={v} style={{ position: 'absolute', left: 150, top: 720 + i * 260, display: 'flex', alignItems: 'center', gap: 50, opacity: k, transform: `translateX(${(1 - k) * -120}px)` }}>
                <div style={{ width: 150, height: 150, borderRadius: '50%', background: C.pelo, display: 'grid', placeItems: 'center' }}>
                  <svg viewBox="0 0 24 24" width={90} height={90}>
                    <path d="M4 12.5l5 5L20 6.5" fill="none" stroke={C.oro} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={30} strokeDashoffset={30 * (1 - k)} />
                  </svg>
                </div>
                <Titulo size={140}>{v}</Titulo>
              </div>
            );
          })}
        </div>
      )}

      {t >= fin && <Cierre t={t - fin} />}
    </Marco>
  );
};
