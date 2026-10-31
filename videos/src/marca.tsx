import React from 'react';
import { Easing, Img, staticFile, useVideoConfig } from 'remotion';
import { TITULO, TEXTO, avance } from './comun';

// Datos de contacto que cierran todos los videos de la serie.
export const MARCA = 'IXCHEL';
export const MARCA_SUB = 'FRUTAS DEL SOCONUSCO';
export const TEL = '(962) 170 7553';
export const CORREO = 'ventasixchelfrutas@gmail.com';

// Formato del video: vertical (celular), cuadrado (tableta/feed) u horizontal (computadora).
export const useFormato = () => {
  const { width: w, height: h } = useVideoConfig();
  const u = Math.min(w, h) / 1080;
  const tipo: 'vertical' | 'cuadrado' | 'horizontal' = h > w * 1.1 ? 'vertical' : w > h * 1.1 ? 'horizontal' : 'cuadrado';
  // ángulo de cámara vertical para que el sujeto ocupe lo mismo en los tres formatos
  const fov = tipo === 'vertical' ? 44 : tipo === 'cuadrado' ? 34 : 26;
  return { w, h, u, tipo, fov };
};

// Rótulo: título grande y subtítulo. En horizontal va a la izquierda y el 3D a la derecha (proporción áurea).
export const Rotulo: React.FC<{
  t: number;
  desde: number;
  hasta: number;
  titulo: React.ReactNode;
  sub?: React.ReactNode;
  color?: string;
  acento?: string;
  abajo?: boolean;
}> = ({ t, desde, hasta, titulo, sub, color = '#fff8e6', abajo }) => {
  const { u, tipo, w, h } = useFormato();
  if (t < desde - 0.1 || t > hasta + 0.1) return null;
  const a = avance(t, desde, 0.45) * (1 - avance(t, hasta - 0.35, 0.35));
  const hor = tipo === 'horizontal';
  const tam = (tipo === 'vertical' ? 128 : tipo === 'cuadrado' ? 104 : 112) * u;
  const estilo: React.CSSProperties = hor
    ? { left: w * 0.06, width: w * 0.36, top: h * 0.2, textAlign: 'left' }
    : abajo
      ? { left: 0, right: 0, bottom: h * (tipo === 'vertical' ? 0.1 : 0.07), textAlign: 'center', padding: `0 ${70 * u}px` }
      : { left: 0, right: 0, top: h * (tipo === 'vertical' ? 0.1 : 0.06), textAlign: 'center', padding: `0 ${70 * u}px` };
  const velo = hor
    ? `linear-gradient(90deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.25) 38%, transparent 55%)`
    : abajo
      ? `linear-gradient(0deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.2) 28%, transparent 42%)`
      : `linear-gradient(180deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.22) 26%, transparent 40%)`;
  // entrada: sube, se enfoca y las letras se juntan; salida: se va hacia arriba difuminándose
  const ent = avance(t, desde, 0.6, Easing.out(Easing.exp));
  const sal = avance(t, hasta - 0.4, 0.4, Easing.in(Easing.cubic));
  const subA = avance(t, desde + 0.25, 0.6, Easing.out(Easing.cubic)) * (1 - sal);
  const raya = avance(t, desde + 0.15, 0.7, Easing.inOut(Easing.cubic)) * (1 - sal);
  return (
    <>
    <div style={{ position: 'absolute', inset: 0, background: velo, opacity: a }} />
    <div style={{ position: 'absolute', ...estilo, opacity: ent * (1 - sal), transform: `translateY(${((1 - ent) * 60 - sal * 50) * u}px) scale(${0.94 + 0.06 * ent})`, filter: `blur(${((1 - ent) * 10 + sal * 8) * u}px)` }}>
      <div style={{ fontFamily: TITULO, fontSize: tam, lineHeight: 0.92, color, letterSpacing: (2 + (1 - ent) * 22) * u, textShadow: `0 ${6 * u}px ${30 * u}px rgba(0,0,0,.45)` }}>{titulo}</div>
      <div style={{ height: 4 * u, width: `${61.8 * raya}%`, margin: hor ? `${16 * u}px 0 0` : `${16 * u}px auto 0`, background: 'linear-gradient(90deg, #ffd84d, #ff4a5a)', borderRadius: 4 * u }} />
      {sub && (
        <div style={{ marginTop: 16 * u, fontFamily: TEXTO, fontSize: tam * 0.42, lineHeight: 1.2, color, opacity: 0.92 * subA, transform: `translateY(${(1 - subA) * 20 * u}px)`, textShadow: `0 ${3 * u}px ${16 * u}px rgba(0,0,0,.55)` }}>{sub}</div>
      )}
    </div>
    </>
  );
};

// Espiral áurea muy tenue (geometría escondida en el fondo del cierre).
const EspiralAurea: React.FC<{ w: number; h: number; o: number }> = ({ w, h, o }) => {
  const phi = 1.6180339887;
  let rw = Math.max(w, h) * 0.9;
  let rh = rw / phi;
  let x = (w - rw) / 2;
  let y = (h - rh) / 2;
  const seg: string[] = [];
  for (let i = 0; i < 10; i++) {
    const k = i % 4;
    if (k === 0) { seg.push(`M ${x} ${y + rh} A ${rh} ${rh} 0 0 1 ${x + rh} ${y}`); x += rh; rw -= rh; }
    else if (k === 1) { seg.push(`M ${x} ${y} A ${rw} ${rw} 0 0 1 ${x + rw} ${y + rw}`); y += rw; rh -= rw; }
    else if (k === 2) { seg.push(`M ${x + rw} ${y} A ${rh} ${rh} 0 0 1 ${x + rw - rh} ${y + rh}`); rw -= rh; }
    else { seg.push(`M ${x + rw} ${y + rh} A ${rw} ${rw} 0 0 1 ${x} ${y + rh - rw}`); rh -= rw; }
  }
  return (
    <svg width={w} height={h} style={{ position: 'absolute', inset: 0, opacity: o }}>
      <path d={seg.join(' ')} stroke="#f5d77a" strokeWidth={2} fill="none" />
    </svg>
  );
};

// Cierre común: logo, marca, llamada a la acción, teléfono y correo. Responsivo a los tres formatos.
export const CierreSerie: React.FC<{ t: number; desde: number; fondo?: string }> = ({ t, desde, fondo = 'radial-gradient(circle at 50% 40%, #1f4a2a, #0a1a0f 75%)' }) => {
  const { u, tipo, w, h } = useFormato();
  if (t < desde) return null;
  const l = t - desde;
  const a = avance(l, 0, 0.5);
  const it = (k: number) => {
    const v = avance(l, 0.25 + k * 0.22, 0.45);
    return { opacity: v, transform: `translateY(${(1 - v) * 30 * u}px)` };
  };
  const hor = tipo === 'horizontal';
  return (
    <>
    <div style={{ position: 'absolute', inset: 0, background: fondo, opacity: a * 0.86 }} />
    <div style={{ position: 'absolute', inset: 0, opacity: a, display: 'flex', flexDirection: hor ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', gap: (hor ? 90 : 26) * u, color: '#fff8e6', textAlign: hor ? 'left' : 'center' }}>
      <EspiralAurea w={w} h={h} o={0.07 * a} />
      <div style={{ ...it(0), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 * u }}>
        <Img src={staticFile('logo.svg')} style={{ width: (hor ? 300 : 210) * u, background: '#fff4dc', borderRadius: '50%', padding: 10 * u, boxShadow: `0 0 ${60 * u}px rgba(255,210,120,.35)` }} />
        <div style={{ fontFamily: TITULO, fontSize: 120 * u, letterSpacing: 8 * u, lineHeight: 0.9 }}>{MARCA}</div>
        <div style={{ fontFamily: TITULO, fontSize: 38 * u, letterSpacing: 9 * u, opacity: 0.8 }}>{MARCA_SUB}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: hor ? 'flex-start' : 'center', gap: 20 * u }}>
        <div style={{ ...it(1), fontFamily: TITULO, fontSize: 70 * u, lineHeight: 1, color: '#ffd84d' }}>
          TRAE TU TRÁILER
          <br />
          TE VENDEMOS POR TONELADA
        </div>
        <div style={{ ...it(2), fontFamily: TEXTO, fontSize: 36 * u, opacity: 0.9 }}>Rambután de Tuxtla Chico, Chiapas</div>
        <div style={{ ...it(3), fontFamily: TITULO, fontSize: 40 * u, letterSpacing: 4 * u, opacity: 0.85 }}>LLAMA O ENVÍA WHATSAPP</div>
        <div style={{ ...it(3.4), fontFamily: TITULO, fontSize: 104 * u, letterSpacing: 3 * u, color: '#25d366', background: 'rgba(5,30,15,.85)', padding: `${8 * u}px ${44 * u}px 0`, borderRadius: 80 * u, boxShadow: `0 0 ${(40 + 30 * Math.max(0, Math.sin(l * 3))) * u}px rgba(37,211,102,${0.35 + 0.25 * Math.max(0, Math.sin(l * 3))})`, transform: `scale(${1 + 0.035 * Math.max(0, Math.sin(l * 3))})` }}>{TEL}</div>
        <div style={{ ...it(4), fontFamily: TEXTO, fontSize: 38 * u }}>{CORREO}</div>
      </div>
    </div>
    </>
  );
};
