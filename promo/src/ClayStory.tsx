import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import './fonts';

/* ------------------------------------------------------------------
   «Ο κ. Γιώργος λιώνει» — claymorphic Instagram Story (1080×1920, 22s)
   One continuous set (a living room); a virtual camera glides between
   the beats of the story. No voiceover: subtitles + music + SFX only.
   Music and SFX are synthesized by scripts/make_clay_audio.py.
------------------------------------------------------------------- */

export const CLAY_FRAMES = 660;
const FPS = 30;
const FONT = 'Manrope, system-ui, sans-serif';
const clampX = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const inOut = Easing.inOut(Easing.cubic);

/** 0→1 between two times (seconds) */
const p = (t: number, a: number, b: number, e = ease) => interpolate(t, [a, b], [0, 1], {...clampX, easing: e});
/** Piecewise track of [time, value] keys with smooth in-out between them */
const track = (t: number, keys: [number, number][]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t <= t1) return interpolate(t, [t0, t1], [v0, v1], {...clampX, easing: inOut});
  }
  return keys[keys.length - 1][1];
};

/* ---------------- Clay material ---------------- */
const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) + amt * 255)));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
const clay = (color: string, depth = 1): React.CSSProperties => ({
  background: `radial-gradient(120% 120% at 30% 22%, ${shade(color, 0.14)} 0%, ${color} 45%, ${shade(color, -0.12)} 100%)`,
  boxShadow: `inset ${-10 * depth}px ${-14 * depth}px ${26 * depth}px rgba(0,0,0,.16),
              inset ${10 * depth}px ${12 * depth}px ${22 * depth}px rgba(255,255,255,.42),
              0 ${16 * depth}px ${28 * depth}px rgba(90,45,20,.22)`,
});
const P = {
  wall: '#F8D2B2', wallDark: '#EAB08A', floor: '#D99E74', sky: '#A9DCFF', sun: '#FFC23D', sunHot: '#FF8A3D',
  shirt: '#5B8DEF', skin: '#F2B48C', mustache: '#5A3A2A', red: '#E8574C', white: '#FAF7F2', navy: '#1F3466',
  blue: '#6E9BE0', ice: '#BFE9FF', wood: '#B7764B', gray: '#9AA3AE', penguin: '#2C3440', beak: '#FFB23E',
};

const Blob: React.FC<{x: number; y: number; w: number; h: number; color: string; r?: string; depth?: number; style?: React.CSSProperties; children?: React.ReactNode}> = ({
  x, y, w, h, color, r = '50%', depth = 1, style, children,
}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: r, ...clay(color, depth), ...style}}>{children}</div>
);

/* ---------------- Characters ---------------- */
const Eyes: React.FC<{t: number; mood: 'hot' | 'sad' | 'happy' | 'shock'; size?: number}> = ({t, mood, size = 1}) => {
  const blink = (t % 2.6) > 2.48 ? 0.15 : 1;
  const eye = (dx: number) => (
    <div style={{position: 'absolute', left: dx, top: 0, width: 46 * size, height: (mood === 'happy' ? 24 : 46) * size * blink, borderRadius: mood === 'happy' ? '46px 46px 0 0' : '50%', background: mood === 'happy' ? 'transparent' : '#fff', border: mood === 'happy' ? `${8 * size}px solid ${P.navy}` : 'none', borderBottom: 'none', boxShadow: mood === 'happy' ? 'none' : 'inset -3px -4px 6px rgba(0,0,0,.15)'}}>
      {mood !== 'happy' && <div style={{position: 'absolute', left: 14 * size, top: (mood === 'sad' ? 18 : 12) * size, width: 20 * size, height: 20 * size * blink, borderRadius: '50%', background: P.navy}} />}
    </div>
  );
  return <div style={{position: 'relative', width: 120 * size, height: 50 * size}}>{eye(0)}{eye(70 * size)}</div>;
};

/** Mr. Giorgos. melt: 0 standing → 1 puddle. */
const Giorgos: React.FC<{t: number; melt: number; reform: number; scarf: number; ice: number}> = ({t, melt, reform, scarf, ice}) => {
  const m = melt * (1 - reform);
  // squash-and-stretch wobble when he pops back into shape
  const wob = reform > 0 && reform < 1 ? Math.sin(reform * Math.PI * 4) * (1 - reform) * 0.18 : 0;
  const sy = interpolate(m, [0, 1], [1, 0.3]) + wob;
  const sx = interpolate(m, [0, 1], [1, 1.75]) - wob;
  const mood = reform > 0.5 ? 'happy' : m > 0.6 ? 'sad' : 'hot';
  const sweat = m < 0.95 && reform < 0.3;
  return (
    <div style={{position: 'absolute', left: 330, top: 1470, width: 0, height: 0}}>
      {/* puddle */}
      <div style={{position: 'absolute', left: -280 * m - 110, top: -30, width: 220 + 560 * m, height: 70, borderRadius: '50%', ...clay(P.shirt, 0.6), opacity: m}} />
      <div style={{position: 'absolute', left: 0, top: 0, transform: `scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
        {/* legs */}
        <Blob x={-80} y={-150} w={60} h={150} color={P.navy} r="30px" />
        <Blob x={20} y={-150} w={60} h={150} color={P.navy} r="30px" />
        {/* body */}
        <Blob x={-140} y={-470} w={280} h={360} color={P.shirt} r="46% 46% 40% 40%" />
        {/* scarf (after rescue) */}
        <div style={{position: 'absolute', left: -120, top: -490, width: 240, height: 70, borderRadius: 40, ...clay(P.red, 0.7), transform: `scaleX(${scarf})`, opacity: scarf}} />
        <div style={{position: 'absolute', left: 40, top: -440, width: 60, height: 150, borderRadius: 30, ...clay(P.red, 0.6), transform: `rotate(-12deg) scaleY(${scarf})`, transformOrigin: 'top', opacity: scarf}} />
        {/* head */}
        <Blob x={-115} y={-700} w={230} h={230} color={P.skin}>
          <div style={{position: 'absolute', left: 55, top: 70}}><Eyes t={t} mood={mood as 'hot'} /></div>
          {/* mustache */}
          <div style={{position: 'absolute', left: 52, top: 132, width: 126, height: 40, borderRadius: '40px 40px 60px 60px', ...clay(P.mustache, 0.5)}} />
          {/* mouth */}
          <div style={{position: 'absolute', left: 86, top: 176, width: 58, height: mood === 'happy' ? 34 : 14, borderRadius: mood === 'happy' ? '0 0 40px 40px' : '20px 20px 0 0', background: '#7A2E2A', opacity: 0.9}} />
          {/* cheeks */}
          <div style={{position: 'absolute', left: 28, top: 130, width: 40, height: 24, borderRadius: '50%', background: 'rgba(255,90,80,.35)'}} />
          <div style={{position: 'absolute', left: 162, top: 130, width: 40, height: 24, borderRadius: '50%', background: 'rgba(255,90,80,.35)'}} />
          {/* ice cube on head */}
          {ice > 0 && ice < 1 && (
            <div style={{position: 'absolute', left: 70, top: -70 + ice * 40, width: 90 * (1 - ice * 0.8), height: 80 * (1 - ice * 0.85), borderRadius: 18, ...clay(P.ice, 0.6), opacity: 0.95}} />
          )}
        </Blob>
      </div>
      {/* sweat drops (outside the scale so they stay round) */}
      {sweat &&
        [0, 1, 2].map((i) => {
          const ph = ((t * 1.3 + i * 0.37) % 1);
          return (
            <div key={i} style={{position: 'absolute', left: -150 + i * 140, top: -620 * sy + ph * 220, width: 26, height: 36, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', ...clay('#7CC8FF', 0.4), opacity: 1 - ph}} />
          );
        })}
    </div>
  );
};

const Sun: React.FC<{t: number; grumpy: number}> = ({t, grumpy}) => {
  const shiver = grumpy > 0.5 ? Math.sin(t * 60) * 4 : 0;
  const color = grumpy > 0.5 ? '#FFD98A' : P.sun;
  return (
    <div style={{position: 'absolute', left: 290 + shiver, top: 470, width: 0, height: 0}}>
      <div style={{position: 'absolute', left: -170, top: -170, width: 340, height: 340, transform: `rotate(${t * 25}deg)`}}>
        {new Array(10).fill(0).map((_, i) => (
          <div key={i} style={{position: 'absolute', left: 155, top: -6, width: 30, height: 70, borderRadius: 20, ...clay(P.sunHot, 0.5), transform: `rotate(${i * 36}deg)`, transformOrigin: '15px 176px'}} />
        ))}
      </div>
      <Blob x={-110} y={-110} w={220} h={220} color={color}>
        {/* sunglasses */}
        <div style={{position: 'absolute', left: 30, top: 66, display: 'flex', gap: 14, transform: `translateY(${grumpy * -60}px)`, opacity: 1 - grumpy * 0.8}}>
          <div style={{width: 70, height: 46, borderRadius: '10px 10px 30px 30px', background: '#1E2430'}} />
          <div style={{width: 70, height: 46, borderRadius: '10px 10px 30px 30px', background: '#1E2430'}} />
        </div>
        {grumpy > 0.5 && <div style={{position: 'absolute', left: 50, top: 80}}><Eyes t={t} mood="sad" size={0.9} /></div>}
        <div style={{position: 'absolute', left: 70, top: 150, width: 80, height: grumpy > 0.5 ? 14 : 34, borderRadius: grumpy > 0.5 ? '20px 20px 0 0' : '0 0 40px 40px', background: '#8A3A1E'}} />
      </Blob>
    </div>
  );
};

const Penguin: React.FC<{t: number; enter: number}> = ({t, enter}) => {
  const x = interpolate(enter, [0, 1], [-320, 640]);
  const dance = enter >= 1 ? Math.sin(t * 9) : 0;
  return (
    <div style={{position: 'absolute', left: x, top: 1500, width: 0, height: 0, transform: `rotate(${enter < 1 ? -70 : dance * 10}deg)`, transformOrigin: '0 0'}}>
      <Blob x={-80} y={-250} w={160} h={250} color={P.penguin} r="48% 48% 44% 44%">
        <div style={{position: 'absolute', left: 30, top: 70, width: 100, height: 170, borderRadius: '50%', background: '#FBF8F2', boxShadow: 'inset -4px -6px 10px rgba(0,0,0,.1)'}} />
        <div style={{position: 'absolute', left: 30, top: 34}}><Eyes t={t} mood="happy" size={0.55} /></div>
        <div style={{position: 'absolute', left: 62, top: 64, width: 36, height: 22, borderRadius: '0 0 30px 30px', ...clay(P.beak, 0.4)}} />
      </Blob>
      <Blob x={-90 - dance * 10} y={-170} w={40} h={100} color={P.penguin} r="30px" style={{transform: `rotate(${20 + dance * 30}deg)`}} />
      <Blob x={50 + dance * 10} y={-170} w={40} h={100} color={P.penguin} r="30px" style={{transform: `rotate(${-20 - dance * 30}deg)`}} />
      <Blob x={-60} y={-14} w={56} h={26} color={P.beak} />
      <Blob x={6} y={-14} w={56} h={26} color={P.beak} />
    </div>
  );
};

const Technician: React.FC<{t: number}> = ({t}) => {
  // pops out of the van, hops onto the desk, then stretches like clay up to the AC
  const pop = p(t, 11.85, 12.15);
  const hop = p(t, 12.15, 12.6);
  const stretch = track(t, [[12.6, 1], [12.85, 2.75], [14.3, 2.75], [14.6, 1]]);
  const x = interpolate(hop, [0, 1], [600, 760]);
  const y = interpolate(hop, [0, 1], [1560, 1040]) - Math.sin(hop * Math.PI) * 260;
  const working = t > 12.8 && t < 14.3 ? Math.sin(t * 40) * 3 : 0;
  if (t < 11.85) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: `scale(${pop}) scaleY(${stretch})`, transformOrigin: '0 0'}}>
      <Blob x={-70} y={-250} w={140} h={250} color={P.navy} r="44% 44% 30% 30%">
        <div style={{position: 'absolute', left: 20, top: 120, width: 100, height: 18, borderRadius: 10, background: P.blue, opacity: 0.9}} />
      </Blob>
      <Blob x={-62} y={-380} w={124} h={124 / stretch} color={P.skin} r="50%">
        <div style={{position: 'absolute', left: 22, top: 44 / stretch, transform: `scaleY(${1 / stretch})`, transformOrigin: 'top'}}><Eyes t={t} mood="happy" size={0.62} /></div>
      </Blob>
      {/* cap */}
      <Blob x={-66} y={-392} w={132} h={50 / stretch} color={P.blue} r="60px 60px 12px 12px" />
      {/* wrench arm */}
      <div style={{position: 'absolute', left: 50, top: -330, width: 26, height: 120, borderRadius: 14, ...clay(P.navy, 0.5), transform: `rotate(${-150 + working * 8}deg)`, transformOrigin: 'top'}}>
        <div style={{position: 'absolute', left: -6, top: 110, width: 38, height: 18, borderRadius: 8, ...clay(P.gray, 0.4)}} />
      </div>
    </div>
  );
};

const Van: React.FC<{t: number}> = ({t}) => {
  const arrive = p(t, 10.6, 11.4, Easing.out(Easing.cubic));
  const x = interpolate(arrive, [0, 1], [1700, 860]);
  const squash = t > 11.4 && t < 11.8 ? Math.sin(p(t, 11.4, 11.8, Easing.linear) * Math.PI * 3) * 0.06 * (1 - p(t, 11.4, 11.8, Easing.linear)) : 0;
  const honk = (t > 11.45 && t < 11.6) || (t > 11.68 && t < 11.84) ? 1 : 0;
  const wheelRot = (1 - arrive) * 900;
  if (t < 10.5) return null;
  return (
    <div style={{position: 'absolute', left: x, top: 1650, width: 0, height: 0, transform: `scale(${1 + squash}, ${1 - squash})`, transformOrigin: '0 0'}}>
      <Blob x={-260} y={-300} w={520} h={250} color={P.white} r="60px 90px 40px 40px">
        <div style={{position: 'absolute', left: 330, top: 30, width: 150, height: 90, borderRadius: '16px 50px 16px 16px', background: 'linear-gradient(160deg,#CFEFFF,#86C6F2)', boxShadow: 'inset -4px -6px 10px rgba(0,0,0,.15)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: 150, height: 34, background: P.blue}} />
        <div style={{position: 'absolute', left: 40, top: 60, fontFamily: FONT, fontWeight: 800, fontSize: 52, color: P.navy, letterSpacing: '-0.02em'}}>AIRLEX</div>
      </Blob>
      {[-170, 140].map((wx) => (
        <div key={wx} style={{position: 'absolute', left: wx, top: -100, width: 110, height: 110, borderRadius: '50%', ...clay('#33363D', 0.7), transform: `rotate(${wheelRot}deg)`}}>
          <div style={{position: 'absolute', left: 35, top: 35, width: 40, height: 40, borderRadius: '50%', ...clay(P.gray, 0.4)}} />
          <div style={{position: 'absolute', left: 51, top: 8, width: 8, height: 22, borderRadius: 4, background: '#555'}} />
        </div>
      ))}
      {/* speed lines while driving in */}
      {arrive < 1 && [0, 1, 2].map((i) => (
        <div key={i} style={{position: 'absolute', left: 280 + i * 30, top: -260 + i * 60, width: 160 * (1 - arrive), height: 12, borderRadius: 8, background: 'rgba(255,255,255,.8)'}} />
      ))}
      {honk === 1 && <div style={{position: 'absolute', left: -380, top: -340, fontFamily: FONT, fontWeight: 800, fontSize: 70, color: P.navy, transform: 'rotate(-10deg)'}}>Μπιπ!</div>}
    </div>
  );
};

const AcUnit: React.FC<{t: number}> = ({t}) => {
  // old unit: coughs (4.2–4.9), droops; falls at 12.3. new unit slides in 12.6.
  const cough = [4.2, 4.55, 4.9].reduce((acc, c) => acc + (t > c && t < c + 0.25 ? Math.sin((t - c) * 60) * 8 : 0), 0);
  const droop = p(t, 4.95, 5.6);
  const fall = p(t, 12.3, 12.75, Easing.in(Easing.quad));
  const oldY = interpolate(fall, [0, 1], [150, 1300]);
  const oldRot = fall * 24;
  const newIn = p(t, 12.6, 13.0, Easing.out(Easing.back(1.6)));
  const newY = interpolate(newIn, [0, 1], [-400, 150]);
  const on = p(t, 14.2, 14.5);
  return (
    <>
      {/* smoke puffs */}
      {[4.2, 4.55, 4.9].map((c, i) => {
        const k = p(t, c, c + 1.4, Easing.out(Easing.quad));
        if (k <= 0 || k >= 1) return null;
        return <div key={i} style={{position: 'absolute', left: 760 + i * 40 - k * 60, top: 330 - k * 260, width: 90 + k * 90, height: 90 + k * 90, borderRadius: '50%', ...clay('#8E8E95', 0.5), opacity: 1 - k}} />;
      })}
      {/* old, tired unit */}
      <div style={{position: 'absolute', left: 600, top: oldY, width: 420, height: 170, transform: `translateX(${cough}px) rotate(${oldRot}deg)`, opacity: t > 13.2 ? 0 : 1}}>
        <Blob x={0} y={0} w={420} h={170} color="#E3D6BF" r="40px">
          <div style={{position: 'absolute', left: 30, right: 30, top: 118, height: 22, borderRadius: 12, background: '#B9A88C', transform: `rotate(${droop * 6}deg)`, transformOrigin: 'left'}} />
          <div style={{position: 'absolute', left: 340, top: 30, width: 18, height: 18, borderRadius: '50%', background: t < 4.9 ? '#E8574C' : '#6b6b6b'}} />
          {t > 5 && t < 12.3 && <div style={{position: 'absolute', left: 150, top: 40, fontFamily: FONT, fontWeight: 800, fontSize: 40, color: '#8a7b63'}}>x_x</div>}
        </Blob>
      </div>
      {/* shiny new unit */}
      {t > 12.6 && (
        <div style={{position: 'absolute', left: 600, top: newY, width: 420, height: 170}}>
          <Blob x={0} y={0} w={420} h={170} color={P.white} r="40px">
            <div style={{position: 'absolute', left: 30, right: 30, top: 116, height: 24, borderRadius: 12, background: '#DDE6F0', transform: `rotate(${-on * 4}deg)`, transformOrigin: 'left'}} />
            <div style={{position: 'absolute', left: 340, top: 30, width: 18, height: 18, borderRadius: '50%', background: on > 0.5 ? '#3DDC97' : '#ccc', boxShadow: on > 0.5 ? '0 0 18px #3DDC97' : 'none'}} />
            <div style={{position: 'absolute', left: 36, top: 26, fontFamily: FONT, fontWeight: 800, fontSize: 26, color: P.blue, letterSpacing: '.1em'}}>22°C</div>
          </Blob>
        </div>
      )}
      {/* sparkles when it switches on */}
      {[0, 1, 2, 3, 4].map((i) => {
        const k = p(t, 14.2 + i * 0.05, 14.9 + i * 0.05);
        if (k <= 0 || k >= 1) return null;
        const ang = (i / 5) * Math.PI * 2;
        return <div key={i} style={{position: 'absolute', left: 810 + Math.cos(ang) * 260 * k, top: 235 + Math.sin(ang) * 160 * k, width: 34, height: 34, background: '#FFE27A', clipPath: 'polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)', opacity: 1 - k, transform: `scale(${1.4 - k})`}} />;
      })}
    </>
  );
};

/* Cool breeze ribbons + snow after the rescue */
const Breeze: React.FC<{t: number}> = ({t}) => {
  const k = p(t, 14.6, 15.2);
  if (k <= 0) return null;
  return (
    <>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, opacity: 0.75 * k}}>
        {[0, 1, 2, 3].map((i) => {
          const off = ((t * 900 + i * 260) % 1400);
          return (
            <path key={i} d={`M 780 ${330 + i * 30} C 600 ${520 + i * 80}, 520 ${700 + i * 60}, 360 ${900 + i * 90}`}
              fill="none" stroke="#BFE9FF" strokeWidth={16 - i * 2} strokeLinecap="round" strokeDasharray="220 1200" strokeDashoffset={-off} />
          );
        })}
      </svg>
      {new Array(22).fill(0).map((_, i) => {
        const x = random(`sx${i}`) * 1080;
        const sp = 120 + random(`sp${i}`) * 160;
        const y = ((t - 14.8) * sp + random(`sy${i}`) * 1900) % 1900 - 40;
        const s = 14 + random(`ss${i}`) * 16;
        return <div key={i} style={{position: 'absolute', left: x + Math.sin(t * 2 + i) * 20, top: y, width: s, height: s, borderRadius: '50%', ...clay('#FFFFFF', 0.3), opacity: k}} />;
      })}
    </>
  );
};

const Phone: React.FC<{t: number}> = ({t}) => {
  const ringing = (t > 8.1 && t < 8.75) || (t > 8.95 && t < 9.6);
  const shake = ringing ? Math.sin(t * 70) * 7 : 0;
  const hop = ringing ? Math.abs(Math.sin(t * 22)) * 12 : 0;
  const bubble = spring({frame: Math.round((t - 9.7) * FPS), fps: FPS, config: {damping: 11}});
  return (
    <div style={{position: 'absolute', left: 820, top: 965 - hop, width: 0, height: 0}}>
      <div style={{transform: `rotate(${shake}deg)`}}>
        <Blob x={-80} y={-20} w={160} h={90} color={P.red} r="30px 30px 24px 24px" />
        <Blob x={-90} y={-60} w={180} h={50} color={shade(P.red, -0.05)} r="40px" />
      </div>
      {ringing && <div style={{position: 'absolute', left: -150, top: -170, fontFamily: FONT, fontWeight: 800, fontSize: 56, color: P.navy, transform: `rotate(${-8 + shake}deg)`}}>Ντριιιν!</div>}
      {t > 9.7 && t < 10.8 && (
        <div style={{position: 'absolute', left: -380, top: -300, transform: `scale(${bubble})`, transformOrigin: '80% 100%'}}>
          <div style={{padding: '26px 34px', borderRadius: 40, ...clay(P.white, 0.7), fontFamily: FONT, fontWeight: 800, fontSize: 50, color: P.navy, whiteSpace: 'nowrap'}}>
            📞 210 9650850
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------- The room (world) ---------------- */
const Room: React.FC<{t: number}> = ({t}) => {
  const temp = Math.round(track(t, [[0.9, 30], [2.8, 42], [14.8, 42], [15.8, 22]]));
  const tempFill = interpolate(temp, [20, 44], [0.12, 0.95], clampX);
  const hot = temp > 30;
  const melt = p(t, 2.7, 3.6, Easing.inOut(Easing.quad));
  const reform = p(t, 15.35, 16.4, Easing.linear);
  const scarf = p(t, 16.2, 16.6);
  const ice = t < 6.1 ? 0 : p(t, 6.1, 7.4, Easing.linear);
  const grumpy = p(t, 17.1, 17.4);
  const pengEnter = p(t, 16.5, 17.2, Easing.out(Easing.cubic));
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}}>
      {/* wall + floor (oversized so camera moves never show an edge) */}
      <div style={{position: 'absolute', left: -800, top: -800, width: 2680, height: 2040, background: `linear-gradient(180deg, ${shade(P.wall, 0.03)}, ${P.wall})`}} />
      <div style={{position: 'absolute', left: -800, top: 1200, width: 2680, height: 60, ...clay(P.wallDark, 0.6), borderRadius: 0}} />
      <div style={{position: 'absolute', left: -800, top: 1260, width: 2680, height: 1400, background: `repeating-linear-gradient(90deg, ${P.floor} 0 220px, ${shade(P.floor, -0.04)} 220px 224px)`}} />
      {/* heat tint on the wall */}
      <div style={{position: 'absolute', left: -800, top: -800, width: 2680, height: 3400, background: 'rgba(255,120,60,.16)', opacity: hot && t < 15 ? interpolate(temp, [30, 42], [0, 1], clampX) : 0}} />

      {/* window with sky + sun */}
      <Blob x={70} y={230} w={440} h={500} color={P.white} r="48px" />
      <div style={{position: 'absolute', left: 100, top: 260, width: 380, height: 440, borderRadius: 32, overflow: 'hidden', background: `linear-gradient(180deg, ${P.sky}, #DDF3FF)`, boxShadow: 'inset 0 10px 20px rgba(0,0,0,.12)'}}>
        <div style={{position: 'absolute', left: -190, top: -260}}><Sun t={t} grumpy={grumpy} /></div>
        <div style={{position: 'absolute', left: ((t * 18) % 520) - 140, top: 330, width: 150, height: 56, borderRadius: 40, ...clay('#FFFFFF', 0.4)}} />
      </div>
      <div style={{position: 'absolute', left: 284, top: 260, width: 12, height: 440, background: P.white, boxShadow: '2px 0 4px rgba(0,0,0,.1)'}} />

      {/* framed picture (a snowy mountain — foreshadowing) */}
      <Blob x={120} y={860} w={240} h={180} color={P.wood} r="18px">
        <div style={{position: 'absolute', left: 18, top: 18, right: 18, bottom: 18, borderRadius: 10, background: 'linear-gradient(180deg,#CFEAFF,#F5FBFF)', overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 30, bottom: -10, width: 0, height: 0, borderLeft: '70px solid transparent', borderRight: '70px solid transparent', borderBottom: '110px solid #8FB3D9'}} />
          <div style={{position: 'absolute', left: 78, top: 30, width: 0, height: 0, borderLeft: '22px solid transparent', borderRight: '22px solid transparent', borderBottom: '34px solid #fff'}} />
        </div>
      </Blob>

      {/* thermometer */}
      <div style={{position: 'absolute', left: 555, top: 380}}>
        <Blob x={0} y={0} w={86} h={330} color={P.white} r="43px" />
        <div style={{position: 'absolute', left: 28, top: 300 - 280 * tempFill, width: 30, height: 280 * tempFill + 10, borderRadius: 15, background: temp > 30 ? P.red : '#4FA8F0'}} />
        <Blob x={-12} y={292} w={110} h={110} color={temp > 30 ? P.red : '#4FA8F0'} />
        <div style={{position: 'absolute', left: -60, top: -96, padding: '10px 22px', borderRadius: 30, ...clay(P.white, 0.5), fontFamily: FONT, fontWeight: 800, fontSize: 48, color: temp > 30 ? P.red : '#2F86D6', whiteSpace: 'nowrap'}}>
          {temp}°C
        </div>
      </div>

      <AcUnit t={t} />

      {/* desk + phone */}
      <Blob x={590} y={1030} w={460} h={60} color={P.wood} r="22px" />
      <Blob x={630} y={1080} w={44} h={180} color={shade(P.wood, -0.06)} r="18px" />
      <Blob x={970} y={1080} w={44} h={180} color={shade(P.wood, -0.06)} r="18px" />
      <Phone t={t} />

      <Giorgos t={t} melt={melt} reform={reform} scarf={scarf} ice={ice} />
      <Penguin t={t} enter={pengEnter} />
      <Van t={t} />
      <Technician t={t} />
      <Breeze t={t} />
      {/* steam lines while hot */}
      {t < 14.8 && [0, 1, 2].map((i) => {
        const k = ((t * 0.8 + i / 3) % 1);
        return <div key={i} style={{position: 'absolute', left: 200 + i * 110, top: 900 - k * 180, width: 14, height: 60, borderRadius: 10, background: 'rgba(255,255,255,.55)', opacity: (1 - k) * melt, transform: `rotate(${Math.sin(t * 4 + i) * 12}deg)`}} />;
      })}
    </div>
  );
};

/* ---------------- Camera ---------------- */
const CAM: {x: [number, number][]; y: [number, number][]; z: [number, number][]} = {
  // focus point in world coords and zoom
  x: [[0, 300], [1.0, 560], [2.2, 400], [3.7, 400], [4.2, 800], [5.8, 400], [8.0, 700], [10.3, 640], [12.0, 640], [12.5, 800], [14.6, 560], [19.2, 540]],
  y: [[0, 500], [1.0, 560], [2.2, 1150], [3.7, 1190], [4.2, 330], [5.8, 1200], [8.0, 1060], [10.3, 1180], [12.0, 1180], [12.5, 520], [14.6, 1000], [19.2, 1000]],
  z: [[0, 1.3], [1.0, 1.25], [2.2, 1.1], [3.7, 1.15], [4.2, 1.45], [5.8, 1.2], [8.0, 1.25], [10.3, 1.0], [12.0, 1.0], [12.5, 1.12], [14.6, 0.98], [19.2, 1.0]],
};

/* ---------------- Subtitles ---------------- */
const SUBS: [number, number, string][] = [
  [0.3, 2.0, 'Αύγουστος. 42°C στη σκιά.'],
  [2.0, 4.0, 'Ο κ. Γιώργος αρχίζει να… λιώνει.'],
  [4.1, 5.9, 'Και το κλιματιστικό; Παραιτήθηκε.'],
  [5.9, 8.0, 'Δοκίμασε τα πάντα. Τίποτα.'],
  [8.1, 10.5, 'Ένα τηλεφώνημα στην Airlex…'],
  [10.6, 12.7, '…και σε χρόνο ρεκόρ:'],
  [12.7, 14.9, 'Νέο κλιματιστικό. Τοποθέτηση. Έτοιμο!'],
  [15.0, 17.1, 'Ο κ. Γιώργος ξαναβρήκε το σχήμα του.'],
  [17.1, 19.2, 'Ο ήλιος… όχι και τόσο.'],
];
const Subtitle: React.FC<{t: number}> = ({t}) => {
  const s = SUBS.find(([a, b]) => t >= a && t < b);
  if (!s) return null;
  const [a, b, text] = s;
  const inK = spring({frame: Math.round((t - a) * FPS), fps: FPS, config: {damping: 13, mass: 0.6}});
  const outK = p(t, b - 0.18, b);
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 1395, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          padding: '24px 40px', borderRadius: 44, ...clay(P.white, 0.8), fontFamily: FONT, fontWeight: 800, fontSize: 50,
          lineHeight: 1.2, color: P.navy, textAlign: 'center', maxWidth: 960,
          transform: `translateY(${(1 - inK) * 40 + outK * 20}px) scale(${0.85 + inK * 0.15})`, opacity: Math.min(1, inK * 1.5) * (1 - outK),
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* ---------------- End card ---------------- */
const EndCard: React.FC<{t: number}> = ({t}) => {
  const drop = spring({frame: Math.round((t - 19.3) * FPS), fps: FPS, config: {damping: 9, mass: 0.9}});
  const lines = (d: number) => p(t, 19.6 + d, 20.0 + d);
  if (t < 19.25) return null;
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT}}>
      <div
        style={{
          width: 880, padding: '70px 50px 64px', borderRadius: 80, ...clay(P.navy, 1.4), color: '#fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, marginTop: -120,
          transform: `translateY(${(1 - drop) * -1300}px) rotate(${(1 - drop) * -6}deg)`,
        }}
      >
        <Img src={staticFile('logo.png')} style={{width: 130, height: 130, filter: 'drop-shadow(0 12px 18px rgba(0,0,0,.35))'}} />
        <div style={{fontSize: 76, fontWeight: 800, letterSpacing: '-0.02em'}}>
          AIRLEX <span style={{color: P.blue}}>HELLAS</span>
        </div>
        <div style={{fontSize: 46, fontWeight: 700, color: '#C6D0E0', opacity: lines(0)}}>Δροσιά σε χρόνο ρεκόρ.</div>
        <div style={{marginTop: 16, padding: '26px 50px', borderRadius: 999, ...clay(P.blue, 0.9), fontSize: 62, fontWeight: 800, opacity: lines(0.15), transform: `scale(${0.8 + lines(0.15) * 0.2})`}}>
          210 9650850
        </div>
        <div style={{fontSize: 40, fontWeight: 700, opacity: lines(0.3)}}>airlex-site.web.app</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Composition ---------------- */
export const ClayStory: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const fx = track(t, CAM.x);
  const fy = track(t, CAM.y);
  const z = track(t, CAM.z);
  const endBlur = p(t, 19.2, 19.7);
  return (
    <AbsoluteFill style={{background: P.wall, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${540 - fx * z}px, ${860 - fy * z}px) scale(${z})`, transformOrigin: '0 0', filter: `blur(${endBlur * 10}px)`}}>
        <Room t={t} />
      </div>
      <AbsoluteFill style={{background: 'rgba(31,52,102,.35)', opacity: endBlur}} />
      {/* clay grain over everything */}
      <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.16, mixBlendMode: 'multiply', pointerEvents: 'none'}}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={7} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <Subtitle t={t} />
      <EndCard t={t} />
      <Audio src={staticFile('clay/music.wav')} volume={0.85} />
      <Audio src={staticFile('clay/sfx.wav')} volume={1} />
    </AbsoluteFill>
  );
};
