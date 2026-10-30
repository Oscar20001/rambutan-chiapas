import React from 'react';
import { loadFont } from '@remotion/fonts';
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from 'remotion';

// Los mismos colores y letras del sitio web.
export const C = {
  verde: '#133621',
  hoja: '#1f5a35',
  oro: '#f4d96c',
  oroSuave: '#d8c477',
  rojo: '#9b1c23',
  piel: '#c8202b',
  pelo: '#e0473a',
};
export const TITULO = 'Bebas Neue';
export const TEXTO = 'EB Garamond';

loadFont({ family: TITULO, url: staticFile('bebas-neue.woff2') });
loadFont({ family: TEXTO, url: staticFile('eb-garamond-normal.woff2') });

export type Tiempos = { inicios: number[]; duraciones: number[] };

// 0 → 1 entre `desde` y `desde + dura` segundos.
export const avance = (t: number, desde: number, dura: number, easing = Easing.out(Easing.cubic)) =>
  interpolate(t, [desde, desde + dura], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

export const Marco: React.FC<{ fondo?: string; children: React.ReactNode }> = ({ fondo = C.verde, children }) => {
  const franja: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 22,
    background: `repeating-linear-gradient(90deg, ${C.rojo} 0 54px, ${C.pelo} 54px 108px)`,
  };
  return (
    <AbsoluteFill style={{ background: fondo, color: C.oro, fontFamily: TEXTO, overflow: 'hidden' }}>
      {children}
      <div style={{ ...franja, top: 0 }} />
      <div style={{ ...franja, bottom: 0 }} />
    </AbsoluteFill>
  );
};

export const Fruta: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  <Img src={staticFile('fruta.svg')} style={{ width: size, height: size * 1.04, ...style }} />
);

export const Titulo: React.FC<{ size: number; style?: React.CSSProperties; children: React.ReactNode }> = ({
  size,
  style,
  children,
}) => (
  <div style={{ fontFamily: TITULO, fontSize: size, lineHeight: 0.9, textAlign: 'center', ...style }}>{children}</div>
);

// Tarjeta final con el logo y el WhatsApp. `t` en segundos desde que aparece.
export const Cierre: React.FC<{ t: number }> = ({ t }) => {
  const f = avance(t, 0, 0.45);
  const s = 1.06 - 0.06 * avance(t, 0, 0.6);
  return (
    <AbsoluteFill
      style={{
        background: C.rojo,
        opacity: f,
        transform: `scale(${s})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: C.oro,
      }}
    >
      <div>
        <Img src={staticFile('logo.svg')} style={{ width: 330, height: 330 }} />
        <Titulo size={150} style={{ marginTop: 30 }}>
          RAMBUTÁN DE
          <br />
          TUXTLA CHICO
        </Titulo>
        <div style={{ fontSize: 54, marginTop: 20 }}>Soconusco, Chiapas</div>
        <div
          style={{
            fontFamily: TITULO,
            fontSize: 84,
            marginTop: 70,
            background: C.oro,
            color: C.verde,
            display: 'inline-block',
            padding: '18px 40px 10px',
          }}
        >
          BUSCAMOS COMPRADORES
        </div>
        <div style={{ fontSize: 50, marginTop: 26 }}>Por tonelada · tú mandas el camión</div>
        <Titulo size={96} style={{ marginTop: 40 }}>
          WHATSAPP 962 269 9611
        </Titulo>
      </div>
    </AbsoluteFill>
  );
};
