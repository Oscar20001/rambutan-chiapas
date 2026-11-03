import React from 'react';
import { AbsoluteFill, Audio, Easing, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { QueTiene } from './QueTiene';
import { PrimerRambutan } from './PrimerRambutan';
import { CierreSerie, Rotulo, useFormato } from './marca';
import { avance, TEXTO, TITULO } from './comun';

// Cortos de 12 a 15 s con música para TikTok y reels: gancho fuerte en el primer segundo,
// un solo dato o juego por video y cierre con la marca. Reusan las escenas realistas de los videos 4 y 5.

export const CORTOS = {
  pela: 13,
  agua: 15,
  cosecha: 13,
  quiz: 12,
};

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// Gancho: texto enorme que entra de golpe en el primer segundo.
const Gancho: React.FC<{ t: number; desde: number; hasta: number; children: React.ReactNode; color?: string; arriba?: number }> = ({ t, desde, hasta, children, color = '#fff8e6', arriba }) => {
  const { u, tipo, h } = useFormato();
  if (t < desde || t > hasta + 0.3) return null;
  const e = avance(t, desde, 0.35, Easing.out(Easing.back(2.2)));
  const s = avance(t, hasta - 0.25, 0.3, Easing.in(Easing.cubic));
  const tam = (tipo === 'vertical' ? 150 : 120) * u;
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,.45), rgba(0,0,0,.15) 70%)', opacity: (1 - s) * Math.min(1, e) }} />
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

const Fuente: React.FC<{ t: number; desde: number; hasta: number; children: React.ReactNode }> = ({ t, desde, hasta, children }) => {
  const { u, h } = useFormato();
  const a = avance(t, desde, 0.4) * (1 - avance(t, hasta - 0.3, 0.3));
  if (a <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: h * 0.035, textAlign: 'center', fontFamily: TEXTO, fontSize: 30 * u, color: '#fff8e6', opacity: 0.85 * a, padding: `0 ${60 * u}px`, textShadow: '0 2px 8px rgba(0,0,0,.8)' }}>
      {children}
    </div>
  );
};

// ---------------- 1. ¡No lo muerdas! (cómo se pela) ----------------
export const CortoPela: React.FC = () => {
  const t = useT();
  const D = CORTOS.pela;
  // 0–4 s: cae y se abre · 4–10 s: vista explotada (cáscara, semilla, pulpa)
  const reloj = (s: number) => (s < 4 ? s : 14.6 + (s - 4) * 0.95);
  const corte = Math.max(0, 1 - Math.abs(t - 4) / 0.12);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <QueTiene limpio reloj={reloj} />
      {corte > 0 && <AbsoluteFill style={{ background: '#fff', opacity: corte * 0.8 }} />}
      <Gancho t={t} desde={0} hasta={1.75}>
        ¡NO LO
        <br />
        <span style={{ color: '#ff4a5a' }}>MUERDAS!</span>
      </Gancho>
      <Rotulo t={t} desde={1.8} hasta={3.95} titulo={<>APRIETA<br />Y <span style={{ color: '#ffd84d' }}>ÁBRELO</span></>} sub="Con los dedos, sin cuchillo." />
      <Rotulo t={t} desde={4.2} hasta={9.9} titulo={<>LA <span style={{ color: '#b8f02e' }}>PULPA</span> SÍ</>} sub="La cáscara y la semilla no se comen." />
      <CierreSerie t={t} desde={D - 3.1} fondo="radial-gradient(circle at 50% 40%, #3a1218, #0a0406 75%)" />
      <Audio src={staticFile('cortos/pela.wav')} />
    </AbsoluteFill>
  );
};

// ---------------- 2. 81 % agua (datos animados) ----------------
const Gota: React.FC<{ v: number; tam: number; t: number }> = ({ v, tam, t }) => {
  // gota que se llena con agua ondulando; v de 0 a 1
  const W = 200;
  const H = 260;
  const nivel = H - 20 - v * (H - 40);
  const ola = (fase: number, amp: number) => {
    let d = `M 0 ${H} L 0 ${nivel}`;
    for (let x = 0; x <= W; x += 10) d += ` L ${x} ${nivel + Math.sin(x / 22 + t * 4 + fase) * amp}`;
    return d + ` L ${W} ${H} Z`;
  };
  const gota = 'M100 8 C 100 8 22 110 22 168 A 78 78 0 0 0 178 168 C 178 110 100 8 100 8 Z';
  return (
    <svg width={tam} height={(tam * H) / W} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <clipPath id="gota">
          <path d={gota} />
        </clipPath>
        <linearGradient id="agua" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fe0ff" />
          <stop offset="1" stopColor="#1677c9" />
        </linearGradient>
      </defs>
      <path d={gota} fill="rgba(255,255,255,.12)" stroke="#bfefff" strokeWidth={4} />
      <g clipPath="url(#gota)">
        <path d={ola(1.5, 5)} fill="#2aa3e8" opacity={0.5} />
        <path d={ola(0, 6)} fill="url(#agua)" />
        {[0, 1, 2, 3, 4].map((i) => {
          const y = H - ((t * 60 + i * 53) % (H - nivel + 20));
          return y > nivel ? <circle key={i} cx={50 + i * 25} cy={y} r={3 + (i % 3)} fill="rgba(255,255,255,.55)" /> : null;
        })}
      </g>
      <path d="M70 120 C 58 140 54 160 58 180" stroke="rgba(255,255,255,.6)" strokeWidth={8} fill="none" strokeLinecap="round" />
    </svg>
  );
};

const Dato: React.FC<{ k: number; valor: string; unidad: string; color: string; u: number }> = ({ k, valor, unidad, color, u }) => (
  <div style={{ opacity: k, transform: `translateY(${(1 - k) * 40 * u}px) scale(${0.85 + 0.15 * k})`, textAlign: 'center', background: 'rgba(10,10,10,.55)', border: `${3 * u}px solid ${color}`, borderRadius: 36 * u, padding: `${22 * u}px ${18 * u}px ${16 * u}px`, width: 290 * u }}>
    <div style={{ fontFamily: TITULO, fontSize: 130 * u, lineHeight: 0.85, color }}>{valor}</div>
    <div style={{ fontFamily: TEXTO, fontSize: 34 * u, color: '#fff8e6', marginTop: 8 * u, lineHeight: 1.1 }}>{unidad}</div>
  </div>
);

export const CortoAgua: React.FC = () => {
  const t = useT();
  const { u, tipo, h, w } = useFormato();
  const D = CORTOS.agua;
  const reloj = (s: number) => 3.0 + s * 0.75; // fruta abierta girando despacio
  const S = { agua: 1.6, vitc: 5.4, datos: 8.6, pregunta: 11.0, cierre: D - 3.2 };
  const llena = avance(t, S.agua + 0.3, 2.2, Easing.inOut(Easing.cubic)) * 0.81;
  const aAgua = avance(t, S.agua, 0.4) * (1 - avance(t, S.vitc - 0.3, 0.3));
  const barra = avance(t, S.vitc + 0.4, 1.6, Easing.out(Easing.cubic));
  const aVit = avance(t, S.vitc, 0.4) * (1 - avance(t, S.datos - 0.3, 0.3));
  const aDatos = (i: number) => avance(t, S.datos + i * 0.3, 0.5, Easing.out(Easing.back(1.6))) * (1 - avance(t, S.pregunta - 0.3, 0.3));
  const centro = tipo === 'vertical' ? h * 0.7 : h * 0.62;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <QueTiene limpio reloj={reloj} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,10,25,.35), rgba(0,0,0,.1) 40%, rgba(0,10,25,.45))' }} />
      <Gancho t={t} desde={0} hasta={1.5}>
        ¿CUÁNTA <span style={{ color: '#5fd0ff' }}>AGUA</span>
        <br />
        TIENE UN RAMBUTÁN?
      </Gancho>

      {/* gota que se llena hasta 81 % */}
      {aAgua > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: centro - 300 * u, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: aAgua, transform: `scale(${0.9 + 0.1 * aAgua})` }}>
          <Gota v={llena} tam={400 * u} t={t} />
          <div style={{ fontFamily: TITULO, fontSize: 210 * u, lineHeight: 0.85, color: '#fff', marginTop: -300 * u, textShadow: '0 6px 30px rgba(0,40,80,.8)' }}>{Math.round(llena * 100)}%</div>
          <div style={{ fontFamily: TITULO, fontSize: 90 * u, color: '#7fe0ff', marginTop: 150 * u, textShadow: '0 4px 20px rgba(0,0,0,.7)' }}>ES AGUA</div>
        </div>
      )}
      <Rotulo t={t} desde={S.agua + 0.1} hasta={S.vitc - 0.1} titulo={<>CASI TODO<br />ES <span style={{ color: '#5fd0ff' }}>AGUA</span></>} sub="Por eso es tan jugoso y refrescante." />

      {/* vitamina C: barra que se llena hasta 78 mg */}
      {aVit > 0 && (
        <div style={{ position: 'absolute', left: w * 0.1, right: w * 0.1, top: centro - 60 * u, opacity: aVit, transform: `translateY(${(1 - aVit) * 40 * u}px)` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', color: '#ffb02e', fontFamily: TITULO }}>
            <div style={{ fontSize: 96 * u }}>VITAMINA C</div>
            <div style={{ fontSize: 150 * u, lineHeight: 0.85, color: '#fff' }}>
              {Math.round(78 * barra)}
              <span style={{ fontSize: 60 * u, color: '#ffb02e' }}> MG</span>
            </div>
          </div>
          <div style={{ height: 70 * u, borderRadius: 40 * u, background: 'rgba(255,255,255,.15)', border: `${3 * u}px solid rgba(255,176,46,.8)`, overflow: 'hidden', marginTop: 16 * u }}>
            <div style={{ width: `${barra * 78}%`, height: '100%', borderRadius: 40 * u, background: 'linear-gradient(90deg, #ff7a00, #ffd84d)', boxShadow: '0 0 30px rgba(255,190,60,.8)' }} />
          </div>
          <div style={{ fontFamily: TEXTO, fontSize: 42 * u, color: '#fff8e6', marginTop: 18 * u, textAlign: 'center', textShadow: '0 3px 12px rgba(0,0,0,.8)' }}>en cada 100 gramos de pulpa</div>
        </div>
      )}
      <Rotulo t={t} desde={S.vitc} hasta={S.datos - 0.1} titulo={<>Y VIENE CARGADO DE<br /><span style={{ color: '#ffb02e' }}>VITAMINA C</span></>} />

      {/* tres datos que rebotan */}
      <Rotulo t={t} desde={S.datos} hasta={S.pregunta - 0.1} titulo={<>LIGERITO<br />Y <span style={{ color: '#b8f02e' }}>NATURAL</span></>} sub="En 100 gramos de pulpa:" />
      {t > S.datos && t < S.pregunta && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: centro - 60 * u, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 26 * u }}>
          <Dato k={aDatos(0)} valor={`${Math.round(75 * avance(t, S.datos, 1.2))}`} unidad="calorías" color="#ff4a5a" u={u} />
          <Dato k={aDatos(1)} valor={`${Math.round(16 * avance(t, S.datos + 0.3, 1.2))} g`} unidad="azúcar de la fruta" color="#ffd84d" u={u} />
          <Dato k={aDatos(2)} valor={`${Math.round(100 * avance(t, S.datos + 0.6, 1.2))}`} unidad="mg de potasio" color="#b8f02e" u={u} />
        </div>
      )}
      <Gancho t={t} desde={S.pregunta} hasta={S.cierre - 0.05}>
        ¿TE LO
        <br />
        <span style={{ color: '#ffd84d' }}>IMAGINABAS?</span>
        <div style={{ fontFamily: TEXTO, fontSize: 52 * u, marginTop: 20 * u }}>Cuéntanos en los comentarios 👇</div>
      </Gancho>
      <Fuente t={t} desde={S.agua} hasta={S.cierre}>
        Fuente: Matvaretabellen (Noruega), con datos de McCance &amp; Widdowson. Valores por 100 g de pulpa cruda.
      </Fuente>
      <CierreSerie t={t} desde={S.cierre} fondo="radial-gradient(circle at 50% 40%, #0f2f45, #04101a 75%)" />
      <Audio src={staticFile('cortos/agua.wav')} />
    </AbsoluteFill>
  );
};

// ---------------- 3. Del árbol a tu tráiler (cosecha) ----------------
export const CortoCosecha: React.FC = () => {
  const t = useT();
  const D = CORTOS.cosecha;
  const reloj = (s: number) => 28.0 + s;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <PrimerRambutan limpio reloj={reloj} />
      <Gancho t={t} desde={0} hasta={1.7} arriba={0.3}>
        ASÍ SE COSECHA
        <br />
        EL <span style={{ color: '#ff4a5a' }}>RAMBUTÁN</span>
      </Gancho>
      <Rotulo t={t} desde={1.8} hasta={4.4} titulo={<>CORTADO<br /><span style={{ color: '#ffd84d' }}>A MANO</span></>} sub="Racimo por racimo, en Tuxtla Chico, Chiapas." />
      <Rotulo t={t} desde={4.5} hasta={7.1} titulo={<>DE LA RAMA<br />A LA <span style={{ color: '#5fa8ff' }}>REJA</span></>} />
      <Rotulo t={t} desde={7.2} hasta={9.8} titulo={<>Y DE LA REJA<br />A <span style={{ color: '#b8f02e' }}>TU TRÁILER</span></>} sub="Tú lo traes, nosotros lo cargamos en la huerta." />
      <CierreSerie t={t} desde={D - 3.1} fondo="radial-gradient(circle at 50% 40%, #3a2a14, #120c04 75%)" />
      <Audio src={staticFile('cortos/cosecha.wav')} />
    </AbsoluteFill>
  );
};

// ---------------- 4. ¿Mito o verdad? ----------------
export const CortoQuiz: React.FC = () => {
  const t = useT();
  const { u } = useFormato();
  const D = CORTOS.quiz;
  const R = 6.4; // revelación
  // fruta cerrada girando despacio; al revelar, se abre
  const reloj = (s: number) => (s < R ? 0.9 + s * 0.14 : 2.0 + (s - R) * 0.9);
  const cuenta = t > 3.4 && t < R ? 3 - Math.floor((t - 3.4) / 1.0) : 0;
  const pulso = t > 3.4 && t < R ? 1 - ((t - 3.4) % 1.0) : 0;
  const flash = Math.max(0, 1 - Math.abs(t - R) / 0.15);
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <QueTiene limpio reloj={reloj} />
      <Gancho t={t} desde={0} hasta={1.3}>
        ¿<span style={{ color: '#ffd84d' }}>MITO</span> O<br />
        <span style={{ color: '#b8f02e' }}>VERDAD</span>?
      </Gancho>
      <Rotulo t={t} desde={1.35} hasta={R - 0.05} titulo={<>EL RAMBUTÁN ES<br /><span style={{ color: '#ff4a5a' }}>PRIMO</span> DEL LICHI</>} sub="Comenta tu respuesta antes de que acabe 👇" />
      {cuenta > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '14%', textAlign: 'center', fontFamily: TITULO, fontSize: 300 * u, color: '#fff', opacity: 0.4 + 0.6 * pulso, transform: `scale(${1 + 0.3 * pulso})`, textShadow: '0 10px 50px rgba(0,0,0,.7)' }}>{cuenta}</div>
      )}
      {flash > 0 && <AbsoluteFill style={{ background: '#fff', opacity: flash * 0.7 }} />}
      <Gancho t={t} desde={R} hasta={D - 3.15} color="#b8f02e" arriba={0.22}>
        ✔ ¡VERDAD!
        <div style={{ fontFamily: TEXTO, fontSize: 54 * u, color: '#fff8e6', lineHeight: 1.2, marginTop: 24 * u }}>
          Los dos son de la misma familia de plantas,
          <br />
          las sapindáceas, igual que el longan.
        </div>
      </Gancho>
      <CierreSerie t={t} desde={D - 3.1} fondo="radial-gradient(circle at 50% 40%, #2a3a12, #0a1004 75%)" />
      <Audio src={staticFile('cortos/quiz.wav')} />
    </AbsoluteFill>
  );
};
