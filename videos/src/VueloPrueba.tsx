import React from 'react';
import { ThreeCanvas } from '@remotion/three';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { CamaraAbre } from './RambutanAbre';
import { Croquis, EtiquetasVuelo, LucesVuelo, camaraVuelo } from './Croquis';

export const VueloPrueba: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const k = frame / (durationInFrames - 1);
  const { pos, mira, fov } = camaraVuelo(k);
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(#1b3a6b, #6f86a8 55%, #f0b07a)' }}>
      <ThreeCanvas width={width} height={height} linear camera={{ fov: 40, position: [0, 5, 10] }}>
        <CamaraAbre pos={pos} mira={mira} fov={fov} />
        <LucesVuelo />
        <Croquis dibujo={Math.min(1, Math.max(0, (k - 0.3) / 0.45))} pin={Math.min(1, Math.max(0, (k - 0.7) / 0.2))} t={frame / fps} />
      </ThreeCanvas>
      <EtiquetasVuelo k={k} w={width} h={height} />
    </AbsoluteFill>
  );
};
