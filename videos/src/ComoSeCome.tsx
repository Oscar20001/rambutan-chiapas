import React from 'react';
import { Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { avance, C, Cierre, Fruta, Marco, Tiempos, TEXTO, Titulo } from './comun';

const PASOS = [
  ['1. APRIETA', 'la cáscara con los dedos'],
  ['2. ÁBRELA', 'y aparece la pulpa blanca'],
  ['3. CÓMETELA', 'dulce y jugosa (la semilla no)'],
];
const rebote = (x: number) => {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

export const ComoSeCome: React.FC<Tiempos> = ({ inicios }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  // Cada escena entra justo antes de que la voz diga su línea.
  const [s1, s2, s3, fin] = [inicios[1] - 0.1, inicios[2] - 0.1, inicios[3] - 0.1, inicios[4] - 0.3];

  let escala = 0.3 + 0.7 * rebote(avance(t, 0, 0.9, (x) => x));
  if (t > s1 && t < s2) escala *= 1 - 0.07 * Math.sin(avance((t - s1) % 0.9, 0, 0.45, (x) => x) * Math.PI);
  const abre = avance(t, s2, 0.9);
  const come = avance(t, s3, 0.8);
  const paso = [s1, s2, s3].filter((s) => t >= s).length - 1;
  const entraPaso = paso >= 0 ? avance(t, [s1, s2, s3][paso], 0.35) : 0;
  const mitad = (lado: -1 | 1): React.CSSProperties => ({
    position: 'absolute',
    left: 0,
    top: 0,
    clipPath: lado < 0 ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)',
    transform: `translate(${lado * abre * 150}px, ${abre * 40}px) rotate(${lado * abre * 28}deg)`,
  });

  return (
    <Marco>
      {inicios.map((ini, n) => (
        <Sequence key={n} from={Math.round(ini * fps)}>
          <Audio src={staticFile(`voz/como-se-come/${n}.mp3`)} />
        </Sequence>
      ))}
      <Titulo
        size={132}
        style={{
          position: 'absolute',
          top: 220,
          left: 70,
          right: 70,
          opacity: avance(t, 0, 0.4),
          transform: `translateY(${(1 - avance(t, 0, 0.6)) * 60}px)`,
        }}
      >
        ¿SABES CÓMO SE COME UN <span style={{ color: C.pelo }}>RAMBUTÁN</span>?
      </Titulo>
      <div
        style={{
          position: 'absolute',
          left: 290,
          top: 700,
          width: 500,
          height: 520,
          transform: `scale(${escala}) rotate(${Math.sin(t * 3) * 3}deg)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 150,
            top: 150,
            width: 200,
            height: 230,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 32%, #fff 0 18%, #f3efe2 45%, #d9d2bd 100%)',
            boxShadow: '0 10px 30px rgba(0,0,0,.25)',
            opacity: t > s2 - 0.1 ? 1 : 0,
            transform: `translateY(${-come * 120}px) scale(${1 + come * 0.25})`,
          }}
        />
        <Fruta size={500} style={mitad(-1)} />
        <Fruta size={500} style={mitad(1)} />
      </div>
      {paso >= 0 && (
        <div
          style={{
            position: 'absolute',
            left: 70,
            right: 70,
            top: 1360,
            textAlign: 'center',
            opacity: entraPaso,
            transform: `translateY(${(1 - entraPaso) * 40}px)`,
          }}
        >
          <Titulo size={150}>{PASOS[paso][0]}</Titulo>
          <div style={{ fontFamily: TEXTO, fontSize: 52, color: C.oroSuave, marginTop: 14 }}>{PASOS[paso][1]}</div>
        </div>
      )}
      {t >= fin && <Cierre t={t - fin} />}
    </Marco>
  );
};
