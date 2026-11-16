import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { CierreSerie, useFormato } from './marca';
import { Luces, Rambutan } from './Anuncio3D';

// Rambután 3D grande con sus pelitos rojos, de fondo y desvanecido, girando despacio detrás de los datos.
const RambutanFondo: React.FC<{ t: number }> = ({ t }) => {
  const { w, h, tipo } = useFormato();
  // en horizontal va del lado del logo; en vertical y cuadrado, al centro
  const x = tipo === 'horizontal' ? -1.6 : 0;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 0.28, filter: 'blur(1.5px) saturate(1.1)' }}>
      <ThreeCanvas width={w} height={h} linear gl={{ alpha: true, antialias: true }} camera={{ fov: 30, position: [0, 0, tipo === 'vertical' ? 11 : tipo === 'cuadrado' ? 7.6 : 6.2] }}>
        <Luces />
        <pointLight position={[0, 1.5, 3]} intensity={5} color="#ffd9a0" />
        <Rambutan semilla={7} rotation={[0.25, t * 0.35, 0.12]} position={[x, 0.15 + Math.sin(t * 0.9) * 0.05, 0]} escala={1.05} />
      </ThreeCanvas>
    </div>
  );
};

// Tarjeta de cierre sobre fondo transparente, para montarla encima de las escenas de Blender.
export const CierreAlfa: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <CierreSerie t={t} desde={0} minimo velo={0.72} fondo="radial-gradient(circle at 50% 40%, rgba(40,20,8,.75), rgba(8,4,2,.95) 75%)" fondo3d={<RambutanFondo t={t} />} />
    </AbsoluteFill>
  );
};
