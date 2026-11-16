import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { CierreSerie } from './marca';
import { Luces, Rambutan } from './Anuncio3D';

// Rambután 3D con sus pelitos rojos, girando despacio sobre fondo transparente.
const RambutanHeroe: React.FC<{ size: number; t: number }> = ({ size, t }) => (
  <div style={{ width: size, height: size, filter: 'drop-shadow(0 18px 30px rgba(0,0,0,.55))' }}>
    <ThreeCanvas width={size} height={size} linear gl={{ alpha: true, antialias: true }} camera={{ fov: 30, position: [0, 0.2, 8.2] }}>
      <Luces />
      <pointLight position={[0, 1.5, 3]} intensity={6} color="#ffd9a0" />
      <Rambutan semilla={7} rotation={[0.25, t * 0.9, 0.12 + Math.sin(t * 1.3) * 0.06]} position={[0, Math.sin(t * 1.6) * 0.06, 0]} escala={1.05} />
    </ThreeCanvas>
  </div>
);

// Tarjeta de cierre sobre fondo transparente, para montarla encima de las escenas de Blender.
export const CierreAlfa: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <CierreSerie t={t} desde={0} minimo velo={0.72} fondo="radial-gradient(circle at 50% 40%, rgba(40,20,8,.75), rgba(8,4,2,.95) 75%)" heroe={(size) => <RambutanHeroe size={size} t={t} />} />
    </AbsoluteFill>
  );
};
