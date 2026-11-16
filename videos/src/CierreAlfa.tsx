import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { CierreSerie } from './marca';

// Tarjeta de cierre sobre fondo transparente, para montarla encima de las escenas de Blender.
export const CierreAlfa: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      <CierreSerie t={f / fps} desde={0} minimo velo={0.72} fondo="radial-gradient(circle at 50% 40%, rgba(40,20,8,.75), rgba(8,4,2,.95) 75%)" />
    </AbsoluteFill>
  );
};
