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
import { FichaVista, LOTERIA, MAYAS, IXCHEL, ADIVINA } from './Fichas';
import { Carrusel, DOMINGO, DURA, SABADO, COMPRAR, PREGUNTAS, SOCONUSCO } from './Carrusel';
import comoSeCome from './guiones/como-se-come.json';
import compradores from './guiones/compradores.json';
import cacao from './guiones/cacao.json';
import { Cacao } from './Cacao';

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

import { FlorAFruto, DURACION_FLOR } from './FlorAFruto';

import { TierraVolcan, DURACION_VOLCAN } from './TierraVolcan';

import { TresCosechas, DURACION_COSECHAS } from './TresCosechas';

import { PrimerRambutan, DURACION_PRIMER } from './PrimerRambutan';
import { QueTiene, DURACION_QUE } from './QueTiene';
import { DiaMuertos, DURACION_MUERTOS } from './DiaMuertos';
import { CORTOS, CortoAgua, CortoCosecha, CortoPela, CortoQuiz } from './Cortos';

export const Root: React.FC = () => (
  <>
    <Composition id="ComoSeCome" component={ComoSeCome} {...vertical} calculateMetadata={tiemposDe(comoSeCome)} />
    <Composition id="Huerta" component={Huerta} {...vertical} calculateMetadata={tiemposDe(compradores)} />
    <Composition id="Compradores" component={Compradores} {...vertical} calculateMetadata={tiemposDe(compradores)} />
    <Composition id="FichaLoteria" component={FichaVista} fps={30} width={1080} height={1920} durationInFrames={1} defaultProps={{ ...LOTERIA, i: 0 }} />
    <Composition id="FichaMayas" component={FichaVista} fps={30} width={1080} height={1920} durationInFrames={1} defaultProps={{ ...MAYAS, i: 0 }} />
    <Composition id="FichaIxchel" component={FichaVista} fps={30} width={1080} height={1920} durationInFrames={1} defaultProps={{ ...IXCHEL, i: 0 }} />
    <Composition id="FichaAdivina" component={FichaVista} fps={30} width={1080} height={1920} durationInFrames={1} defaultProps={{ ...ADIVINA, i: 0 }} />
    <Composition id="CarruselSabado" component={Carrusel} fps={FPS} width={1080} height={1920}
      durationInFrames={Math.round(SABADO.length * DURA * FPS + FPS)} defaultProps={{ laminas: SABADO }} />
    <Composition id="CarruselDomingo" component={Carrusel} fps={FPS} width={1080} height={1920}
      durationInFrames={Math.round(DOMINGO.length * DURA * FPS + FPS)} defaultProps={{ laminas: DOMINGO }} />
    <Composition id="CarruselComprar" component={Carrusel} fps={FPS} width={1080} height={1920}
      durationInFrames={Math.round(COMPRAR.length * DURA * FPS + FPS)} defaultProps={{ laminas: COMPRAR }} />
    <Composition id="CarruselPreguntas" component={Carrusel} fps={FPS} width={1080} height={1920}
      durationInFrames={Math.round(PREGUNTAS.length * DURA * FPS + FPS)} defaultProps={{ laminas: PREGUNTAS }} />
    <Composition id="CarruselSoconusco" component={Carrusel} fps={FPS} width={1080} height={1920}
      durationInFrames={Math.round(SOCONUSCO.length * DURA * FPS + FPS)} defaultProps={{ laminas: SOCONUSCO }} />
    <Composition id="FlorAFrutoV" component={FlorAFruto} fps={30} width={1080} height={1920} durationInFrames={Math.round(DURACION_FLOR * 30)} />
    <Composition id="FlorAFrutoH" component={FlorAFruto} fps={30} width={1920} height={1080} durationInFrames={Math.round(DURACION_FLOR * 30)} />
    <Composition id="FlorAFrutoC" component={FlorAFruto} fps={30} width={1080} height={1080} durationInFrames={Math.round(DURACION_FLOR * 30)} />
    <Composition id="TierraVolcanV" component={TierraVolcan} fps={30} width={1080} height={1920} durationInFrames={Math.round(DURACION_VOLCAN * 30)} />
    <Composition id="TierraVolcanH" component={TierraVolcan} fps={30} width={1920} height={1080} durationInFrames={Math.round(DURACION_VOLCAN * 30)} />
    <Composition id="TierraVolcanC" component={TierraVolcan} fps={30} width={1080} height={1080} durationInFrames={Math.round(DURACION_VOLCAN * 30)} />
    <Composition id="TresCosechasV" component={TresCosechas} fps={30} width={1080} height={1920} durationInFrames={Math.round(DURACION_COSECHAS * 30)} />
    <Composition id="TresCosechasH" component={TresCosechas} fps={30} width={1920} height={1080} durationInFrames={Math.round(DURACION_COSECHAS * 30)} />
    <Composition id="TresCosechasC" component={TresCosechas} fps={30} width={1080} height={1080} durationInFrames={Math.round(DURACION_COSECHAS * 30)} />
    <Composition id="PrimerRambutanV" component={PrimerRambutan} fps={30} width={1080} height={1920} durationInFrames={Math.round(DURACION_PRIMER * 30)} />
    <Composition id="PrimerRambutanH" component={PrimerRambutan} fps={30} width={1920} height={1080} durationInFrames={Math.round(DURACION_PRIMER * 30)} />
    <Composition id="PrimerRambutanC" component={PrimerRambutan} fps={30} width={1080} height={1080} durationInFrames={Math.round(DURACION_PRIMER * 30)} />
    <Composition id="MuertosH" component={DiaMuertos} fps={30} width={1920} height={1080} durationInFrames={DURACION_MUERTOS * 30} />
    <Composition id="MuertosV" component={DiaMuertos} fps={30} width={1080} height={1920} durationInFrames={DURACION_MUERTOS * 30} />
    <Composition id="CortoPela" component={CortoPela} fps={30} width={1080} height={1920} durationInFrames={CORTOS.pela * 30} />
    <Composition id="CortoAgua" component={CortoAgua} fps={30} width={1080} height={1920} durationInFrames={CORTOS.agua * 30} />
    <Composition id="CortoCosecha" component={CortoCosecha} fps={30} width={1080} height={1920} durationInFrames={CORTOS.cosecha * 30} />
    <Composition id="CortoQuiz" component={CortoQuiz} fps={30} width={1080} height={1920} durationInFrames={CORTOS.quiz * 30} />
    <Composition id="QueTieneV" component={QueTiene} fps={30} width={1080} height={1920} durationInFrames={Math.round(DURACION_QUE * 30)} />
    <Composition id="QueTieneH" component={QueTiene} fps={30} width={1920} height={1080} durationInFrames={Math.round(DURACION_QUE * 30)} />
    <Composition id="QueTieneC" component={QueTiene} fps={30} width={1080} height={1080} durationInFrames={Math.round(DURACION_QUE * 30)} />
    <Composition id="AnuncioProducto" component={AnuncioProducto} fps={FPS} width={1080} height={1920} durationInFrames={22 * FPS} />
    <Composition id="AnuncioCamion" component={AnuncioCamion} fps={FPS} width={1080} height={1920} durationInFrames={22 * FPS} />
    <Composition id="RambutanAbre" component={RambutanAbre} fps={FPS} width={1080} height={1920} durationInFrames={Math.round(DURACION_ABRE * FPS)} />
    <Composition id="Alto" component={Alto} fps={FPS} width={1080} height={1920} durationInFrames={Math.round(DURACION_ALTO * FPS)} />
    <Composition id="VueloPrueba" component={VueloPrueba} fps={FPS} width={1080} height={1920} durationInFrames={150} />
    <Composition id="CacaoV" component={Cacao} {...vertical} calculateMetadata={tiemposDe(cacao)} />
    <Composition id="CacaoF" component={Cacao} {...vertical} width={1080} height={1350} calculateMetadata={tiemposDe(cacao)} />
    <Composition id="CacaoH" component={Cacao} {...vertical} width={1920} height={1080} calculateMetadata={tiemposDe(cacao)} />
    <Composition id="CacaoMusicaV" component={Cacao} {...vertical} durationInFrames={31 * FPS} calculateMetadata={async () => {
      const d = await fetch(staticFile('soconusco/cacao-musica.json')).then((r) => r.json());
      return { props: { voz: '', inicios: d.inicios, palabras: d.palabras, musica: 'soconusco/cacao-musica.wav' } };
    }} />
    <Composition id="Viaje" component={Viaje} fps={60} width={1080} height={1920} durationInFrames={DURACION_VIAJE * 60} />
  </>
);
