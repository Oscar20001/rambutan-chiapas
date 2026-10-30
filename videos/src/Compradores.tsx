import React from 'react';
import { Audio, Easing, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { avance, C, Cierre, Fruta, Marco, Tiempos, TEXTO, Titulo } from './comun';

// Frutas que caen en la primera escena: [x, retraso, tamaño, giro].
const LLUVIA: [number, number, number, number][] = [
  [80, 0.0, 190, -20], [330, 0.15, 150, 15], [560, 0.05, 210, -8], [800, 0.25, 170, 25],
  [180, 0.4, 140, 30], [700, 0.45, 160, -30], [450, 0.6, 180, 10], [900, 0.7, 130, -15],
];

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
  const [e1, e2, e3, fin] = [inicios[1] - 0.15, inicios[2] - 0.15, inicios[3] - 0.15, inicios[4] - 0.3];
  const escena = [0, e1, e2, e3].filter((s) => t >= s).length - 1;
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
            ¿COMPRAS <span style={{ color: C.pelo }}>RAMBUTÁN</span>
            <br />
            POR TONELADA?
          </Titulo>
        </>
      )}

      {escena === 1 && (
        <div style={{ position: 'absolute', inset: 0, opacity: entra(e1) * sale(e2) }}>
          <Img
            src={staticFile('logo.svg')}
            style={{ position: 'absolute', left: 290, top: 330, width: 500, height: 500, transform: `rotate(${(1 - entra(e1)) * -20}deg) scale(${0.7 + 0.3 * entra(e1)})` }}
          />
          <Titulo size={170} style={{ position: 'absolute', top: 930, left: 60, right: 60 }}>
            DE TUXTLA CHICO,
            <br />
            CHIAPAS
          </Titulo>
          <div style={{ position: 'absolute', top: 1290, left: 60, right: 60, textAlign: 'center', fontFamily: TEXTO, fontSize: 64, color: C.oroSuave, fontStyle: 'italic' }}>
            el corazón del Soconusco
          </div>
        </div>
      )}

      {escena === 2 && (
        <div style={{ position: 'absolute', inset: 0, opacity: sale(e3) }}>
          <Titulo size={180} style={{ position: 'absolute', top: 300, left: 60, right: 60, opacity: entra(e2) }}>
            TÚ MANDAS
            <br />
            TU CAMIÓN
          </Titulo>
          <div style={{ position: 'absolute', top: 820, left: -800 + 950 * avance(t, e2 + 0.1, 1.2) }}>
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
                  opacity: avance(t, e2 + 1.2 + i * 0.25, 0.3),
                  transform: `translateY(${(1 - avance(t, e2 + 1.2 + i * 0.25, 0.3)) * 30}px)`,
                }}
              >
                {v}
              </div>
            ))}
          </div>
        </div>
      )}

      {escena === 3 && (
        <div style={{ position: 'absolute', inset: 0 }}>
          <Titulo size={150} style={{ position: 'absolute', top: 280, left: 60, right: 60, opacity: entra(e3) }}>
            NOSOTROS, EN
            <br />
            LA HUERTA:
          </Titulo>
          {['COSECHAMOS', 'EMPACAMOS', 'CARGAMOS'].map((v, i) => {
            const k = avance(t, e3 + 0.4 + i * 0.55, 0.4, Easing.out(Easing.back(2)));
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
