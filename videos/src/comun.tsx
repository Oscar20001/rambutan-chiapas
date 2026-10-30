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

export type Tiempos = { voz: string; inicios: number[]; palabras: { t: number; w: string }[] };

// Segundo en que la voz dice `palabra` (la primera vez después de `desde`).
export const cuando = (palabras: Tiempos['palabras'], palabra: string, desde = 0, otro = 0) =>
  palabras.find((p) => p.t >= desde && p.w === palabra)?.t ?? otro;

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
  const entra = (i: number) => avance(t, 0.15 + i * 0.12, 0.45, Easing.out(Easing.back(2)));
  const pieza = (i: number): React.CSSProperties => ({
    opacity: Math.min(1, entra(i) * 1.3),
    transform: `translateY(${(1 - entra(i)) * 60}px) scale(${0.85 + 0.15 * entra(i)})`,
  });
  const late = 1 + 0.05 * Math.sin(t * 7);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 35%, ${C.piel}, ${C.rojo} 60%, #6a1016)`,
        clipPath: `circle(${f * 150}% at 50% 50%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: C.oro,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: -460,
          top: -40,
          width: 2000,
          height: 2000,
          background: 'repeating-conic-gradient(rgba(244,217,108,.09) 0 8deg, transparent 8deg 16deg)',
          transform: `rotate(${t * 12}deg)`,
          borderRadius: '50%',
        }}
      />
      <div style={{ position: 'relative' }}>
        <Img src={staticFile('logo.svg')} style={{ width: 330, height: 330, ...pieza(0), transform: `${pieza(0).transform} rotate(${Math.sin(t * 2) * 4}deg)` }} />
        <Titulo size={150} style={{ marginTop: 30, ...pieza(1) }}>
          RAMBUTÁN DE
          <br />
          TUXTLA CHICO
        </Titulo>
        <div style={{ fontSize: 54, marginTop: 20, ...pieza(2) }}>Soconusco, Chiapas</div>
        <div style={{ ...pieza(3) }}>
          <div
            style={{
              fontFamily: TITULO,
              fontSize: 84,
              marginTop: 60,
              background: C.oro,
              color: C.verde,
              display: 'inline-block',
              padding: '18px 40px 10px',
              borderRadius: 12,
              boxShadow: '0 10px 0 rgba(0,0,0,.25)',
            }}
          >
            BUSCAMOS COMPRADORES
          </div>
        </div>
        <div style={{ fontSize: 50, marginTop: 26, ...pieza(4) }}>Por tonelada · tú mandas el camión</div>
        <div style={{ ...pieza(5) }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 22,
              marginTop: 44,
              background: '#25d366',
              color: '#fff',
              borderRadius: 999,
              padding: '18px 44px 18px 30px',
              boxShadow: '0 12px 0 rgba(0,0,0,.25)',
              transform: `scale(${late})`,
            }}
          >
            <svg viewBox="0 0 32 32" width={74} height={74}>
              <path fill="#fff" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3Zm0 23.6a10.6 10.6 0 0 1-5.4-1.5l-.4-.2-3.9 1 1-3.8-.2-.4A10.6 10.6 0 1 1 16 26.6Zm5.8-7.9c-.3-.2-1.9-.9-2.2-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7 0a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.4 6.4 0 0 0 1.3 3.4 14.6 14.6 0 0 0 5.6 5c2.1.9 2.9 1 4 .8a3.4 3.4 0 0 0 2.2-1.6 2.8 2.8 0 0 0 .2-1.6c0-.1-.3-.2-.6-.3Z" />
            </svg>
            <span style={{ fontFamily: TITULO, fontSize: 92, lineHeight: 1, paddingTop: 8 }}>962 269 9611</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
