import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import './fonts';

/* ------------------------------------------------------------------
   Airlex Hellas — Instagram Story promo (1080×1920, 30fps, 24s)
   One continuous piece: the airflow background never cuts, and each
   message hands over to the next with an overlapping rise/blur move.
   Text stays inside Instagram's safe area (y ≈ 260–1580).
------------------------------------------------------------------- */

export const PROMO_FRAMES = 720;

const C = {
  navy: '#16264C',
  navy2: '#1C2F60',
  navy3: '#243B76',
  blue: '#4A73B8',
  light: '#6E9BE0',
  sky: '#7FA6E6',
  silver: '#C6D0E0',
  white: '#FFFFFF',
};
const FONT = 'Manrope, system-ui, sans-serif';
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0→1 over [start, start+dur] with the house easing */
const prog = (f: number, start: number, dur = 22) =>
  interpolate(f, [start, start + dur], [0, 1], {...clamp, easing: ease});

/* ---------------- Scene timing (overlaps make it continuous) ---------------- */
const S = {
  intro: [0, 104],
  partner: [92, 220],
  cats: [208, 340],
  stats: [328, 456],
  scale: [444, 548],
  iso: [536, 614],
  cta: [602, PROMO_FRAMES],
} as const;

/* ---------------- Persistent background: navy + flowing air ---------------- */
const WAVES = [
  {d: 'M0,60 C100,20 100,100 200,60 C300,20 300,100 400,60 C500,20 500,100 600,60 C700,20 700,100 800,60', color: C.sky, w: 2, top: 300, op: 0.22, speed: 1.1},
  {d: 'M0,60 C100,10 100,110 200,60 C300,10 300,110 400,60 C500,10 500,110 600,60 C700,10 700,110 800,60', color: C.silver, w: 1.5, top: 820, op: 0.14, speed: -0.8},
  {d: 'M0,60 C100,30 100,90 200,60 C300,30 300,90 400,60 C500,30 500,90 600,60 C700,30 700,90 800,60', color: C.blue, w: 2.5, top: 1330, op: 0.2, speed: 0.95},
  {d: 'M0,60 C100,25 100,95 200,60 C300,25 300,95 400,60 C500,25 500,95 600,60 C700,25 700,95 800,60', color: C.light, w: 1.5, top: 1700, op: 0.12, speed: -1.25},
];

const Background: React.FC = () => {
  const f = useCurrentFrame();
  const drift = f * 0.35; // slow upward "camera" travel through the air
  const glowX = 70 + Math.sin(f / 70) * 12;
  const glowY = 12 + Math.cos(f / 90) * 6;
  return (
    <AbsoluteFill style={{background: `linear-gradient(165deg, ${C.navy} 0%, ${C.navy2} 55%, ${C.navy3} 100%)`}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 700px at ${glowX}% ${glowY}%, rgba(14,165,233,.30), transparent 60%),
                       radial-gradient(800px 700px at ${100 - glowX}% ${95 - glowY}%, rgba(110,155,224,.22), transparent 60%)`,
        }}
      />
      {WAVES.map((w, i) => {
        const x = -(((f * w.speed * 2.2) % 1080) + 1080) % 1080;
        const y = ((((w.top - drift * (0.6 + i * 0.15)) % 2200) + 2200) % 2200) - 140;
        return (
          <svg
            key={i}
            viewBox="0 0 800 120"
            preserveAspectRatio="none"
            style={{position: 'absolute', left: x, top: y, width: 2160, height: 200, opacity: w.op}}
          >
            <path d={w.d} fill="none" stroke={w.color} strokeWidth={w.w} strokeLinecap="round" />
            <path d={w.d} transform="translate(800 0)" fill="none" stroke={w.color} strokeWidth={w.w} strokeLinecap="round" />
          </svg>
        );
      })}
      {/* floating air particles */}
      {new Array(36).fill(0).map((_, i) => {
        const sx = random(`x${i}`) * 1080;
        const sy = random(`y${i}`) * 1920;
        const sp = 0.6 + random(`s${i}`) * 1.6;
        const size = 3 + random(`r${i}`) * 5;
        const y = (((sy - f * sp) % 1980) + 1980) % 1980 - 30;
        const x = sx + Math.sin((f + i * 40) / 45) * 14;
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%',
              background: i % 3 === 0 ? C.light : C.silver, opacity: 0.12 + random(`o${i}`) * 0.25,
            }}
          />
        );
      })}
      {/* soft vignette keeps edges calm for Instagram UI */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(10,18,40,.45) 0%, transparent 16%, transparent 80%, rgba(10,18,40,.55) 100%)'}} />
    </AbsoluteFill>
  );
};

/* ---------------- Scene shell: rise + un-blur in, lift + blur out ---------------- */
const Scene: React.FC<{dur: number; last?: boolean; children: React.ReactNode}> = ({dur, last, children}) => {
  const f = useCurrentFrame();
  const inP = prog(f, 0, 20);
  const outP = last ? 0 : prog(f, dur - 16, 16);
  const y = interpolate(inP, [0, 1], [90, 0]) + interpolate(outP, [0, 1], [0, -110]);
  const blur = interpolate(inP, [0, 1], [10, 0]) + interpolate(outP, [0, 1], [0, 12]);
  const opacity = inP * (1 - outP);
  const scale = interpolate(outP, [0, 1], [1, 0.96]);
  return (
    <AbsoluteFill
      style={{
        opacity, transform: `translateY(${y}px) scale(${scale})`, filter: `blur(${blur}px)`,
        fontFamily: FONT, color: C.white, alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Eyebrow: React.FC<{children: React.ReactNode; delay?: number}> = ({children, delay = 0}) => {
  const f = useCurrentFrame();
  const p = prog(f, delay, 18);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 18, opacity: p, transform: `translateY(${(1 - p) * 20}px)`}}>
      <div style={{width: 70 * p, height: 4, borderRadius: 4, background: C.light}} />
      <div style={{fontSize: 30, fontWeight: 800, letterSpacing: '0.16em', color: C.light, }}>{children}</div>
    </div>
  );
};

/** Words rise in one by one */
const RiseWords: React.FC<{text: string; start: number; size: number; weight?: number; color?: string; step?: number; lineHeight?: number}> = ({
  text, start, size, weight = 800, color = C.white, step = 3, lineHeight = 1.12,
}) => {
  const f = useCurrentFrame();
  return (
    <div style={{fontSize: size, fontWeight: weight, color, lineHeight, letterSpacing: '-0.02em', textAlign: 'center', maxWidth: 940}}>
      {text.split(' ').map((w, i) => {
        const p = prog(f, start + i * step, 18);
        return (
          <span key={i} style={{display: 'inline-block', marginRight: '0.26em', opacity: p, transform: `translateY(${(1 - p) * 40}px)`}}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

/* ---------------- Line icons (same set as the website), drawn on ---------------- */
type IconName = 'ac' | 'heat' | 'fan' | 'solar' | 'fire' | 'dome' | 'tunnel' | 'parts' | 'phone' | 'check';
const ICONS: Record<IconName, React.ReactNode[]> = {
  ac: [<rect key="a" x="2" y="5" width="20" height="7" rx="2" />, <path key="b" d="M6 16v3M10 16v4M14 16v3M18 16v4" />],
  heat: [<path key="a" d="M12 2c0 4-4 5-4 9a4 4 0 0 0 8 0c0-1.5-1-2.5-1-4 1 .5 2 2 2 4a5 5 0 0 1-10 0c0-5 5-6 5-9z" />],
  fan: [
    <circle key="a" cx="12" cy="12" r="1.6" />,
    <path key="b" d="M12 10.4c-1-2.6-1-6.4 1.2-7.8 2-1.3 4 .3 3.6 2.6-.3 1.9-2.3 3.6-4.8 5.2zM10.4 12c-2.6 1-6.4 1-7.8-1.2-1.3-2 .3-4 2.6-3.6 1.9.3 3.6 2.3 5.2 4.8zM13.6 12c2.6-1 6.4-1 7.8 1.2 1.3 2-.3 4-2.6 3.6-1.9-.3-3.6-2.3-5.2-4.8zM12 13.6c1 2.6 1 6.4-1.2 7.8-2 1.3-4-.3-3.6-2.6.3-1.9 2.3-3.6 4.8-5.2z" />,
  ],
  solar: [<circle key="a" cx="12" cy="12" r="4" />, <path key="b" d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />],
  fire: [<path key="a" d="M12 2 L4 8 v13 h16 V8 z" />, <path key="b" d="M9 21v-6a3 3 0 0 1 6 0v6" />],
  dome: [<path key="a" d="M3 20h18" />, <path key="b" d="M4 20V10a8 8 0 0 1 16 0v10" />, <path key="c" d="M12 2v8M8 3.5v6.5M16 3.5v6.5" />],
  tunnel: [<path key="a" d="M2 21V11a10 10 0 0 1 20 0v10" />, <path key="b" d="M2 21h4M18 21h4M9 21v-6a3 3 0 0 1 6 0v6" />],
  parts: [<path key="a" d="M14.7 6.3a4 4 0 0 1-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 1 5.4-5.4l-3 3-2-2z" />],
  phone: [<path key="a" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />],
  check: [<path key="a" d="M4 12.5l5 5L20 6.5" />],
};

const DrawIcon: React.FC<{name: IconName; size: number; start: number; color?: string; dur?: number; width?: number}> = ({
  name, size, start, color = C.sky, dur = 26, width = 1.8,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, start, dur);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name].map((el, i) =>
        React.cloneElement(el as React.ReactElement, {pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p, key: i}),
      )}
    </svg>
  );
};

/* =============================== SCENES =============================== */

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const logo = spring({frame: f - 2, fps, config: {damping: 13, mass: 0.8}});
  const ring = prog(f, 6, 40);
  const word1 = 'AIRLEX'.split('');
  const word2 = 'HELLAS'.split('');
  const letter = (ch: string, i: number, color: string, base: number) => {
    const p = prog(f, base + i * 2.2, 16);
    return (
      <span key={i} style={{display: 'inline-block', color, opacity: p, transform: `translateY(${(1 - p) * 60}px) rotate(${(1 - p) * 8}deg)`}}>
        {ch}
      </span>
    );
  };
  const sub = prog(f, 44, 22);
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 46, marginTop: -40}}>
      <div style={{position: 'relative', width: 230, height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${C.light}`, opacity: (1 - ring) * 0.8, transform: `scale(${0.7 + ring * 0.9})`}} />
        <div style={{position: 'absolute', inset: 20, borderRadius: '50%', background: 'radial-gradient(circle, rgba(127,166,230,.45), transparent 70%)', opacity: logo}} />
        <Img src={staticFile('logo.png')} style={{width: 170, height: 170, transform: `scale(${logo}) rotate(${(1 - logo) * -40}deg)`, filter: 'drop-shadow(0 18px 36px rgba(0,0,0,.45))'}} />
      </div>
      <div style={{fontSize: 118, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, display: 'flex', gap: 30}}>
        <span>{word1.map((c, i) => letter(c, i, C.white, 14))}</span>
        <span>{word2.map((c, i) => letter(c, i, C.light, 24))}</span>
      </div>
      <div style={{width: 520 * sub, height: 3, background: `linear-gradient(90deg, transparent, ${C.light}, transparent)`}} />
      <div style={{fontSize: 40, fontWeight: 600, color: C.silver, textAlign: 'center', lineHeight: 1.35, opacity: sub, transform: `translateY(${(1 - sub) * 24}px)`}}>
        Εμπορική διανομή
        <br />
        επαγγελματικού εξοπλισμού
      </div>
    </div>
  );
};

const PARTNER_WORDS = ['Κλιματισμό', 'Θέρμανση', 'Αερισμό', 'Ηλιακά', 'Πυροπροστασία'];
const Partner: React.FC = () => {
  const f = useCurrentFrame();
  const start = 22;
  const per = 18;
  const t = Math.max(0, f - start);
  const idx = Math.min(Math.floor(t / per), PARTNER_WORDS.length - 1);
  const local = t - idx * per;
  const roll = idx === PARTNER_WORDS.length - 1 ? 0 : prog(local, per - 8, 8);
  const appear = prog(f, start - 4, 12);
  const audience = prog(f, 96, 20);
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
      <Eyebrow>ΠΟΙΟΙ ΕΙΜΑΣΤΕ</Eyebrow>
      <RiseWords text="Ο εμπορικός σας συνεργάτης σε" start={4} size={76} />
      <div style={{height: 170, overflow: 'hidden', position: 'relative', width: 1040, opacity: appear, WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 22%, #000 78%, transparent 100%)'}}>
        {[PARTNER_WORDS[idx], PARTNER_WORDS[Math.min(idx + 1, PARTNER_WORDS.length - 1)]].map((w, i) => (
          <div
            key={i + w}
            style={{
              position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 108, fontWeight: 800, letterSpacing: '-0.03em',
              lineHeight: '170px', top: (i - roll) * 190,
              background: `linear-gradient(90deg, ${C.sky}, ${C.white} 60%, ${C.light})`, WebkitBackgroundClip: 'text', color: 'transparent',
              opacity: i === 1 && idx === PARTNER_WORDS.length - 1 ? 0 : 1,
            }}
          >
            {w}
          </div>
        ))}
      </div>
      <div style={{display: 'flex', gap: 14, marginTop: 6}}>
        {PARTNER_WORDS.map((_, i) => (
          <div key={i} style={{width: i === idx ? 54 : 14, height: 14, borderRadius: 14, background: i <= idx ? C.light : 'rgba(255,255,255,.22)', transition: 'none', opacity: appear}} />
        ))}
      </div>
      <div style={{fontSize: 38, fontWeight: 600, color: C.silver, textAlign: 'center', lineHeight: 1.4, marginTop: 30, opacity: audience, transform: `translateY(${(1 - audience) * 20}px)`}}>
        για τεχνικούς, μελετητές,
        <br />
        εγκαταστάτες &amp; εργολήπτες
      </div>
    </div>
  );
};

const CATS: {icon: IconName; label: string}[] = [
  {icon: 'ac', label: 'Κλιματισμός'},
  {icon: 'heat', label: 'Αντλίες Θερμότητας'},
  {icon: 'fan', label: 'Αερισμός'},
  {icon: 'solar', label: 'Ηλιακά / Boilers'},
  {icon: 'fire', label: 'Πυροπροστασία'},
  {icon: 'dome', label: 'Κούπολες'},
  {icon: 'tunnel', label: 'Έργα Υποδομών'},
  {icon: 'parts', label: 'Ανταλλακτικά'},
];
const Categories: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
      <Eyebrow>8 ΚΑΤΗΓΟΡΙΕΣ</Eyebrow>
      <RiseWords text="Όλα από ένα σημείο επαφής" start={4} size={74} />
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginTop: 24, width: 940}}>
        {CATS.map((c, i) => {
          const s = spring({frame: f - 16 - i * 4, fps, config: {damping: 15, mass: 0.7}});
          return (
            <div
              key={c.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 24, padding: '30px 30px', borderRadius: 30,
                background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.16)',
                opacity: s, transform: `translateY(${(1 - s) * 50}px) scale(${0.9 + s * 0.1})`,
              }}
            >
              <div style={{width: 84, height: 84, borderRadius: 22, background: 'rgba(110,155,224,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                <DrawIcon name={c.icon} size={52} start={20 + i * 4} />
              </div>
              <div style={{fontSize: 36, fontWeight: 700, lineHeight: 1.15}}>{c.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const STATS = [
  {to: 14, suffix: '', label: 'Οίκοι προϊόντων'},
  {to: 25, suffix: '', label: 'Παραγγελίες την ημέρα'},
  {to: 347, suffix: '+', label: 'Ευχαριστημένοι πελάτες'},
];
const Stats: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20}}>
      <Eyebrow>ΣΕ ΑΡΙΘΜΟΥΣ</Eyebrow>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20}}>
        {STATS.map((s, i) => {
          const st = 10 + i * 16;
          const p = prog(f, st, 18);
          const n = Math.round(interpolate(f, [st, st + 44], [0, s.to], {...clamp, easing: Easing.out(Easing.cubic)}));
          const line = prog(f, st + 10, 26);
          return (
            <div key={s.label} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '26px 0', opacity: p, transform: `translateY(${(1 - p) * 40}px)`}}>
              <div style={{fontSize: 200, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums'}}>
                {n}
                <span style={{color: C.light, fontSize: 120}}>{s.suffix}</span>
              </div>
              <div style={{fontSize: 40, fontWeight: 600, color: C.silver, marginTop: 10}}>{s.label}</div>
              {i < STATS.length - 1 && <div style={{width: 300 * line, height: 2, background: 'rgba(255,255,255,.25)', marginTop: 40}} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BRANDS = ['LG', 'Daikin', 'Abesco', 'Actionair', 'Klimaoprema'];
const Scale: React.FC = () => {
  const f = useCurrentFrame();
  const photo = prog(f, 8, 26);
  const kb = interpolate(f, [0, 104], [1.06, 1.18]);
  const marquee = -(f * 5.5) % 1260;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
      <Eyebrow>ΑΠΟ ΤΟ ΣΠΙΤΙ ΕΩΣ ΤΟ ΜΕΤΡΟ</Eyebrow>
      <RiseWords text="Λύσεις για κάθε κλίμακα έργου" start={4} size={74} />
      <div
        style={{
          width: 820, height: 600, borderRadius: 44, overflow: 'hidden', position: 'relative', marginTop: 8,
          boxShadow: '0 40px 90px rgba(0,0,0,.45)', border: '2px solid rgba(255,255,255,.16)',
          opacity: photo, transform: `translateY(${(1 - photo) * 60}px) scale(${0.94 + photo * 0.06})`,
        }}
      >
        <Img src={staticFile('aboutrooftop.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${kb})`}} />
        <AbsoluteFill style={{background: 'linear-gradient(170deg, rgba(22,38,76,.15) 30%, rgba(22,38,76,.85) 100%)'}} />
        <div style={{position: 'absolute', left: 40, right: 40, bottom: 36, fontSize: 36, fontWeight: 700, lineHeight: 1.3, opacity: prog(f, 30, 20)}}>
          Οικιακές εγκαταστάσεις, κτίρια, μετρό &amp; τούνελ
        </div>
      </div>
      <div style={{fontSize: 28, fontWeight: 700, letterSpacing: '.14em', color: C.light, marginTop: 14, opacity: prog(f, 26, 16)}}>ΑΞΙΟΠΙΣΤΟΙ ΟΙΚΟΙ</div>
      <div
        style={{
          width: 1080, overflow: 'hidden', opacity: prog(f, 28, 16),
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)',
        }}
      >
        <div style={{display: 'flex', gap: 24, transform: `translateX(${marquee}px)`, width: 'max-content'}}>
          {[...BRANDS, ...BRANDS, ...BRANDS].map((b, i) => (
            <div key={i} style={{padding: '18px 36px', borderRadius: 999, border: '1.5px solid rgba(255,255,255,.25)', fontSize: 40, fontWeight: 800, whiteSpace: 'nowrap', background: 'rgba(255,255,255,.05)'}}>
              {b}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ISOS = [
  {n: '9001', label: 'Ποιότητα'},
  {n: '14001', label: 'Περιβάλλον'},
  {n: '45001', label: 'Ασφάλεια'},
];
const Iso: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34}}>
      <Eyebrow>ΠΙΣΤΟΠΟΙΗΣΕΙΣ</Eyebrow>
      <RiseWords text="Πιστοποιημένη ποιότητα" start={2} size={78} />
      <div style={{display: 'flex', gap: 26, marginTop: 30}}>
        {ISOS.map((s, i) => {
          const p = prog(f, 12 + i * 6, 30);
          return (
            <div key={s.n} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: Math.min(1, p * 2)}}>
              <div style={{position: 'relative', width: 280, height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                <svg width={280} height={280} viewBox="0 0 100 100" style={{position: 'absolute', inset: 0, transform: 'rotate(-90deg)'}}>
                  <circle cx="50" cy="50" r="46" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.14)" strokeWidth="1.6" />
                  <circle cx="50" cy="50" r="46" fill="none" stroke={C.light} strokeWidth="2.4" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
                </svg>
                <div style={{fontSize: 34, fontWeight: 800, color: C.light, letterSpacing: '.1em'}}>ISO</div>
                <div style={{fontSize: 66, fontWeight: 800, letterSpacing: '-0.02em'}}>{s.n}</div>
              </div>
              <div style={{fontSize: 34, fontWeight: 700, color: C.silver}}>{s.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 22, marginTop: 40}}>
        {['Πανελλαδική εξυπηρέτηση', 'Τεχνική υποστήριξη'].map((t, i) => {
          const p = prog(f, 30 + i * 8, 18);
          return (
            <div key={t} style={{display: 'flex', alignItems: 'center', gap: 20, fontSize: 44, fontWeight: 700, opacity: p, transform: `translateX(${(1 - p) * -30}px)`}}>
              <div style={{width: 62, height: 62, borderRadius: '50%', background: 'rgba(110,155,224,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <DrawIcon name="check" size={38} start={34 + i * 8} dur={16} color={C.white} width={3} />
              </div>
              {t}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pill = spring({frame: f - 26, fps, config: {damping: 12, mass: 0.8}});
  const pulse = (f % 40) / 40;
  const shine = interpolate((f - 40) % 70, [0, 30], [-120, 220], clamp);
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 22, opacity: prog(f, 4, 18)}}>
        <Img src={staticFile('logo.png')} style={{width: 96, height: 96, filter: 'drop-shadow(0 10px 20px rgba(0,0,0,.4))'}} />
        <div style={{fontSize: 58, fontWeight: 800, letterSpacing: '-0.01em'}}>
          AIRLEX <span style={{color: C.light}}>HELLAS</span>
        </div>
      </div>
      <RiseWords text="Ζητήστε προσφορά για το έργο σας" start={10} size={88} step={3} />
      <div style={{position: 'relative', marginTop: 20, transform: `scale(${0.6 + pill * 0.4})`, opacity: Math.min(1, pill * 1.4)}}>
        <div style={{position: 'absolute', inset: -10, borderRadius: 999, border: `3px solid ${C.light}`, opacity: (1 - pulse) * 0.7, transform: `scale(${1 + pulse * 0.12})`}} />
        <div
          style={{
            position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 26, padding: '34px 62px', borderRadius: 999,
            background: C.light, boxShadow: '0 24px 60px rgba(110,155,224,.5)',
          }}
        >
          <DrawIcon name="phone" size={62} start={34} dur={20} color={C.white} width={2.2} />
          <div style={{fontSize: 74, fontWeight: 800, letterSpacing: '-0.01em'}}>210 9650850</div>
          <div style={{position: 'absolute', top: 0, bottom: 0, width: 160, left: `${shine}%`, background: 'linear-gradient(100deg, transparent, rgba(255,255,255,.45), transparent)'}} />
        </div>
      </div>
      <div style={{fontSize: 46, fontWeight: 700, marginTop: 14, opacity: prog(f, 40, 18), transform: `translateY(${(1 - prog(f, 40, 18)) * 20}px)`}}>
        airlex-site.web.app
      </div>
      <div style={{fontSize: 34, fontWeight: 600, color: C.silver, opacity: prog(f, 48, 18)}}>Ανδρέα Παπανδρέου 108, Γλυφάδα</div>
    </div>
  );
};

/* =============================== COMPOSITION =============================== */
const seq = (k: keyof typeof S) => ({from: S[k][0], durationInFrames: S[k][1] - S[k][0]});

export const Promo: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.navy}}>
    <Background />
    <Sequence {...seq('intro')}><Scene dur={seq('intro').durationInFrames}><Intro /></Scene></Sequence>
    <Sequence {...seq('partner')}><Scene dur={seq('partner').durationInFrames}><Partner /></Scene></Sequence>
    <Sequence {...seq('cats')}><Scene dur={seq('cats').durationInFrames}><Categories /></Scene></Sequence>
    <Sequence {...seq('stats')}><Scene dur={seq('stats').durationInFrames}><Stats /></Scene></Sequence>
    <Sequence {...seq('scale')}><Scene dur={seq('scale').durationInFrames}><Scale /></Scene></Sequence>
    <Sequence {...seq('iso')}><Scene dur={seq('iso').durationInFrames}><Iso /></Scene></Sequence>
    <Sequence {...seq('cta')}><Scene dur={seq('cta').durationInFrames} last><Cta /></Scene></Sequence>
  </AbsoluteFill>
);
