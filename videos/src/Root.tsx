import React from 'react';
import { CalculateMetadataFunction, Composition, staticFile } from 'remotion';
import { Tiempos } from './comun';
import { ComoSeCome } from './ComoSeCome';
import { Compradores } from './Compradores';
import { Huerta } from './Huerta';
import { DURACION as DURACION_VIAJE, Viaje } from './Viaje';
import { AnuncioCamion, AnuncioProducto } from './Anuncio3D';
import { DURACION_ABRE, RambutanAbre } from './RambutanAbre';
import { Alto, DURACION_ALTO } from './Alto';
import { VueloPrueba } from './VueloPrueba';
import { Carrusel, DOMINGO, DURA, SABADO } from './Carrusel';
import comoSeCome from './guiones/como-se-come.json';
import compradores from './guiones/compradores.json';

const FPS = 30;
const COLA = 1.6; // segundos que se queda la tarjeta final después de la última línea

// La duración del video y el momento de cada escena salen de la voz
// (tiempos.json, que escribe `npm run voz`): si cambias el guion, todo se acomoda solo.
const tiemposDe =
  (guion: { id: string }): CalculateMetadataFunction<Tiempos> =>
  async () => {
    const { inicios, fin, palabras = [] } = await fetch(staticFile(`voz/${guion.id}/tiempos.json`)).then((r) => r.json());
    return { durationInFrames: Math.ceil((fin + COLA) * FPS), props: { voz: guion.id, inicios, palabras } };
  };

const vertical = { fps: FPS, width: 1080, height: 1920, durationInFrames: 600, defaultProps: { voz: '', inicios: [], palabras: [] } };

export const Root: React.FC = () => (
  <>
    <Composition id="ComoSeCome" component={ComoSeCome} {...vertical} calculateMetadata={tiemposDe(comoSeCome)} />
    <Composition id="Huerta" component={Huerta} {...vertical} calculateMetadata={tiemposDe(compradores)} />
    <Composition id="Compradores" component={Compradores} {...vertical} calculateMetadata={tiemposDe(compradores)} />
    <Composition id="CarruselSabado" component={Carrusel} fps={FPS} width={1080} height={1920}
      durationInFrames={Math.round(SABADO.length * DURA * FPS + FPS)} defaultProps={{ laminas: SABADO }} />
    <Composition id="CarruselDomingo" component={Carrusel} fps={FPS} width={1080} height={1920}
      durationInFrames={Math.round(DOMINGO.length * DURA * FPS + FPS)} defaultProps={{ laminas: DOMINGO }} />
    <Composition id="AnuncioProducto" component={AnuncioProducto} fps={FPS} width={1080} height={1920} durationInFrames={22 * FPS} />
    <Composition id="AnuncioCamion" component={AnuncioCamion} fps={FPS} width={1080} height={1920} durationInFrames={22 * FPS} />
    <Composition id="RambutanAbre" component={RambutanAbre} fps={FPS} width={1080} height={1920} durationInFrames={Math.round(DURACION_ABRE * FPS)} />
    <Composition id="Alto" component={Alto} fps={FPS} width={1080} height={1920} durationInFrames={Math.round(DURACION_ALTO * FPS)} />
    <Composition id="VueloPrueba" component={VueloPrueba} fps={FPS} width={1080} height={1920} durationInFrames={150} />
    <Composition id="Viaje" component={Viaje} fps={60} width={1080} height={1920} durationInFrames={DURACION_VIAJE * 60} />
  </>
);
