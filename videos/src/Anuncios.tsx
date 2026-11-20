import React from 'react';
import { AbsoluteFill, Audio, Easing, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { QueTiene } from './QueTiene';
import { PrimerRambutan } from './PrimerRambutan';
import { CierreSerie, Rotulo, useFormato } from './marca';
import { avance, TEXTO, TITULO } from './comun';

// Anuncios cortos (15 s, con música) para atraer compradores al mayoreo y comentarios.
// Gancho en el primer segundo, un solo mensaje, y cierre con los datos de contacto.

export const ANUNCIOS = { toneladas: 15, norte: 15 };

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

const Gancho: React.FC<{ t: number; desde: number; hasta: number; children: React.ReactNode; color?: string; arriba?: number }> = ({ t, desde, hasta, children, color = '#fff8e6', arriba }) => {
  const { u, tipo, h } = useFormato();
  if (t < desde || t > hasta + 0.3) return null;
  const e = avance(t, desde, 0.35, Easing.out(Easing.back(2.2)));
  const s = avance(t, hasta - 0.25, 0.3, Easing.in(Easing.cubic));
  const tam = (tipo === 'vertical' ? 140 : 112) * u;
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,.5), rgba(0,0,0,.18) 70%)', opacity: (1 - s) * Math.min(1, e) }} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: h * (arriba ?? 0.27),
          transform: `translateY(-50%) scale(${0.4 + 0.6 * e + s * 0.3})`,
          opacity: Math.min(1, e * 1.5) * (1 - s),
          filter: `blur(${s * 12 * u}px)`,
          textAlign: 'center',
          fontFamily: TITULO,
          fontSize: tam,
          lineHeight: 0.92,
          color,
          padding: `0 ${60 * u}px`,
          textShadow: `0 ${8 * u}px ${40 * u}px rgba(0,0,0,.6)`,
        }}
      >
        {children}
      </div>
    </>
  );
};

// ---------------- 1. ¿Cuántos rambutanes caben en 5 toneladas? ----------------
const Opcion: React.FC<{ letra: string; texto: string; k: number; gana: number; u: number }> = ({ letra, texto, k, gana, u }) => (
  <div
    style={{
      opacity: k * (1 - 0.6 * Math.max(0, gana < 0 ? -gana : 0)),
      transform: `translateX(${(1 - k) * -80 * u}px) scale(${1 + 0.12 * Math.max(0, gana)})`,
      display: 'flex',
      alignItems: 'center',
      gap: 26 * u,
      background: gana > 0 ? `rgba(184,240,46,${0.25 + 0.6 * gana})` : 'rgba(10,10,10,.62)',
      border: `${4 * u}px solid ${gana > 0 ? '#b8f02e' : 'rgba(255,248,230,.5)'}`,
      borderRadius: 30 * u,
      padding: `${16 * u}px ${36 * u}px ${10 * u}px`,
      width: 720 * u,
    }}
  >
    <div style={{ fontFamily: TITULO, fontSize: 96 * u, color: '#ffd84d', width: 70 * u }}>{letra}</div>
    <div style={{ fontFamily: TITULO, fontSize: 104 * u, color: '#fff8e6' }}>{texto}</div>
  </div>
);

export const AnuncioToneladas: React.FC = () => {
  const t = useT();
  const { u, h } = useFormato();
  const D = ANUNCIOS.toneladas;
  const R = 6.6; // revelación
  // primero la fruta abierta girando; tras la revelación, el camión cargándose en la huerta
  const relojFruta = (s: number) => 3.0 + s * 0.6;
  const relojHuerta = (s: number) => 31 + (s - R) * 1.0;
  const cuenta = t > 3.6 && t < R ? 3 - Math.floor((t - 3.6) / 1.0) : 0;
  const pulso = t > 3.6 && t < R ? 1 - ((t - 3.6) % 1.0) : 0;
  const flash = Math.max(0, 1 - Math.abs(t - R) / 0.15);
  const op = (i: number) => avance(t, 1.7 + i * 0.25, 0.4, Easing.out(Easing.back(1.5))) * (1 - avance(t, R + 1.6, 0.3));
  const gana = (i: number) => (t < R ? 0 : i === 2 ? avance(t, R, 0.4) : -avance(t, R, 0.4));
  const contador = Math.round(150000 * avance(t, R + 0.2, 1.4, Easing.out(Easing.cubic)));
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {t < R ? <QueTiene limpio reloj={relojFruta} /> : <PrimerRambutan limpio reloj={relojHuerta} />}
      <Gancho t={t} desde={0} hasta={1.6} arriba={0.3}>
        ¿CUÁNTOS RAMBUTANES
        <br />
        CABEN EN <span style={{ color: '#ff4a5a' }}>5 TONELADAS</span>?
      </Gancho>
      {t > 1.6 && t < R + 2 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: h * 0.2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 * u }}>
          <div style={{ fontFamily: TITULO, fontSize: 84 * u, color: '#fff8e6', opacity: op(0), textShadow: '0 6px 30px rgba(0,0,0,.8)', textAlign: 'center', lineHeight: 0.95 }}>
            ¿CUÁNTOS CABEN EN
            <br />
            <span style={{ color: '#ff4a5a' }}>5 TONELADAS</span>?
          </div>
          <Opcion letra="A" texto="15 MIL" k={op(0)} gana={gana(0)} u={u} />
          <Opcion letra="B" texto="50 MIL" k={op(1)} gana={gana(1)} u={u} />
          <Opcion letra="C" texto="150 MIL" k={op(2)} gana={gana(2)} u={u} />
          {t < R && <div style={{ fontFamily: TEXTO, fontSize: 50 * u, color: '#fff8e6', opacity: op(2), textShadow: '0 3px 12px rgba(0,0,0,.9)' }}>Comenta tu letra antes de que acabe 👇</div>}
        </div>
      )}
      {cuenta > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '9%', textAlign: 'center', fontFamily: TITULO, fontSize: 280 * u, color: '#fff', opacity: 0.4 + 0.6 * pulso, transform: `scale(${1 + 0.3 * pulso})`, textShadow: '0 10px 50px rgba(0,0,0,.7)' }}>{cuenta}</div>
      )}
      {flash > 0 && <AbsoluteFill style={{ background: '#fff', opacity: flash * 0.75 }} />}
      {t > R + 1.9 && t < D - 3.1 && (
        <Gancho t={t} desde={R + 1.9} hasta={D - 3.15} color="#b8f02e" arriba={0.3}>
          {contador.toLocaleString('es-MX')}
          <div style={{ fontFamily: TITULO, fontSize: 90 * u, color: '#fff8e6', marginTop: 6 * u }}>RAMBUTANES, MÁS O MENOS</div>
          <div style={{ fontFamily: TEXTO, fontSize: 46 * u, color: '#fff8e6', lineHeight: 1.2, marginTop: 22 * u }}>
            Cada uno pesa unos 30 a 40 gramos.
            <br />
            Y ese es nuestro pedido mínimo 🚛
          </div>
        </Gancho>
      )}
      <CierreSerie t={t} desde={D - 3.1} fondo="radial-gradient(circle at 50% 40%, #3a1218, #0a0406 75%)" />
      <Audio src={staticFile('cortos/toneladas.wav')} />
    </AbsoluteFill>
  );
};

// ---------------- 2. ¿Tienes frutería o bodega en el norte? ----------------
export const AnuncioNorte: React.FC = () => {
  const t = useT();
  const D = ANUNCIOS.norte;
  const reloj = (s: number) => 28.5 + s * 0.85; // cosecha y camión cargándose en la huerta
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <PrimerRambutan limpio reloj={reloj} />
      <Gancho t={t} desde={0} hasta={1.9} arriba={0.3}>
        ¿TIENES FRUTERÍA,
        <br />
        BODEGA O TIENDA
        <br />
        EN EL <span style={{ color: '#ffd84d' }}>NORTE</span>?
      </Gancho>
      <Rotulo t={t} desde={2.0} hasta={4.7} titulo={<>ESTO ES <span style={{ color: '#ff4a5a' }}>RAMBUTÁN</span></>} sub="Fruta exótica del Soconusco, cortada a mano en Tuxtla Chico, Chiapas." />
      <Rotulo t={t} desde={4.8} hasta={7.5} titulo={<>3 COSECHAS<br />AL <span style={{ color: '#b8f02e' }}>AÑO</span></>} sub="Mayo a junio · finales de julio a agosto · agosto a octubre." />
      <Rotulo t={t} desde={7.6} hasta={10.2} titulo={<>DESDE <span style={{ color: '#ffd84d' }}>5 TONELADAS</span></>} sub="Tú mandas tu camión y nosotros lo cargamos en la huerta." />
      <Gancho t={t} desde={10.3} hasta={11.85} arriba={0.3} color="#ffd84d">
        APARTA TU
        <br />
        COSECHA 2027
      </Gancho>
      <CierreSerie t={t} desde={D - 3.1} fondo="radial-gradient(circle at 50% 40%, #3a2a14, #120c04 75%)" />
      <Audio src={staticFile('cortos/norte.wav')} />
    </AbsoluteFill>
  );
};
