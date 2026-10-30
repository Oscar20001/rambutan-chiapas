import React from 'react';
import { CalculateMetadataFunction, Composition, staticFile } from 'remotion';
import { getAudioDurationInSeconds } from '@remotion/media-utils';
import { Tiempos } from './comun';
import { ComoSeCome } from './ComoSeCome';
import { Compradores } from './Compradores';
import comoSeCome from './guiones/como-se-come.json';
import compradores from './guiones/compradores.json';

const FPS = 30;
const PAUSA = 0.45; // silencio entre líneas de voz
const COLA = 1.6; // segundos que se queda la tarjeta final después de la última línea

// La duración del video sale de la voz: si cambias el guion y vuelves a correr
// `npm run voz`, las escenas se acomodan solas.
const tiemposDe =
  (guion: { id: string; lineas: string[] }): CalculateMetadataFunction<Tiempos> =>
  async () => {
    const duraciones = await Promise.all(
      guion.lineas.map((_, n) => getAudioDurationInSeconds(staticFile(`voz/${guion.id}/${n}.mp3`))),
    );
    const inicios: number[] = [];
    let t = 0.3;
    for (const d of duraciones) {
      inicios.push(t);
      t += d + PAUSA;
    }
    return { durationInFrames: Math.ceil((t - PAUSA + COLA) * FPS), props: { inicios, duraciones } };
  };

const vertical = { fps: FPS, width: 1080, height: 1920, durationInFrames: 600, defaultProps: { inicios: [], duraciones: [] } };

export const Root: React.FC = () => (
  <>
    <Composition id="ComoSeCome" component={ComoSeCome} {...vertical} calculateMetadata={tiemposDe(comoSeCome)} />
    <Composition id="Compradores" component={Compradores} {...vertical} calculateMetadata={tiemposDe(compradores)} />
  </>
);
