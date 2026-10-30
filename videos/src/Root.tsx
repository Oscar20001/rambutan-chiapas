import React from 'react';
import { CalculateMetadataFunction, Composition, staticFile } from 'remotion';
import { Tiempos } from './comun';
import { ComoSeCome } from './ComoSeCome';
import { Compradores } from './Compradores';
import comoSeCome from './guiones/como-se-come.json';
import compradores from './guiones/compradores.json';

const FPS = 30;
const COLA = 1.6; // segundos que se queda la tarjeta final después de la última línea

// La duración del video y el momento de cada escena salen de la voz
// (tiempos.json, que escribe `npm run voz`): si cambias el guion, todo se acomoda solo.
const tiemposDe =
  (guion: { id: string }): CalculateMetadataFunction<Tiempos> =>
  async () => {
    const { inicios, fin } = await fetch(staticFile(`voz/${guion.id}/tiempos.json`)).then((r) => r.json());
    return { durationInFrames: Math.ceil((fin + COLA) * FPS), props: { voz: guion.id, inicios } };
  };

const vertical = { fps: FPS, width: 1080, height: 1920, durationInFrames: 600, defaultProps: { voz: '', inicios: [] } };

export const Root: React.FC = () => (
  <>
    <Composition id="ComoSeCome" component={ComoSeCome} {...vertical} calculateMetadata={tiemposDe(comoSeCome)} />
    <Composition id="Compradores" component={Compradores} {...vertical} calculateMetadata={tiemposDe(compradores)} />
  </>
);
