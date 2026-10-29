// © MrJackDee™. All rights reserved.
// Home: a personal dashboard. A profile card up top, then animated tiles for each part of Jack's life,
// quick-launch "apps" for his other sites, a rotating quote, and the two live feeds at the bottom.
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useScroll, useSpring, useTransform, type TargetAndTransition } from 'motion/react';
import {
  ArrowUpRight, BookOpen, Building2, CalendarCheck, Compass, Cpu, Flower2, Footprints, GraduationCap,
  Globe, Newspaper, Plane, Rocket, Rss, Sunrise, Users,
} from 'lucide-react';
import { BOOK_URL, IntroContext, InstallButton, ShareButton, SigDraw, SocialIcons } from './SiteChrome';
import NewsFeed, { FollowingFeed } from './NewsFeed';

const HEADSHOT = 'https://lh3.googleusercontent.com/d/1FNA4TdQp7d3gw7Hyp-HBzfKLGWup4YdD';

/* ---------------- Greeting ---------------- */
// Uses the visitor's own clock, and recognizes people who have been here before
const useGreeting = () => {
  const [text] = useState(() => {
    const h = new Date().getHours();
    const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    let back = false;
    try { back = !!window.localStorage.getItem('geauxmab_seen'); window.localStorage.setItem('geauxmab_seen', '1'); } catch { /* storage blocked */ }
    return back ? `${part}, and welcome back.` : `${part}, and welcome.`;
  });
  return text;
};

/* ---------------- Handwritten name ---------------- */
// Traced letter by letter once the opening screen clears (held at the start until then)
const Signature = ({ ready }: { ready: boolean }) => (
  <h1 className="mt-5 md:mt-8 mb-2 md:mb-4 flex justify-center md:justify-start">
    <SigDraw start={0.35} wait={!ready} className="w-[16rem] md:w-[24rem] max-w-full" />
  </h1>
);

/* ---------------- Roles graphic ---------------- */
// Nerd face for "Techie": round face, thick-rimmed glasses, toothy grin (lucide has no nerd icon)
const NerdIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="8.5" cy="10" r="2.6" />
    <circle cx="15.5" cy="10" r="2.6" />
    <path d="M11.1 10h1.8M2.5 9.5l3.4.3M21.5 9.5l-3.4.3" />
    <path d="M8.5 15.5c1.9 1.6 5.1 1.6 7 0" />
    <path d="M11 16.4v1.3h2v-1.3" strokeWidth="1.5" />
  </svg>
);

// Five roles as icon chips (Techie, Strategist, Doctoral Candidate, Entrepreneur, SIGMA): they pop in after the signature, float gently, and a spotlight moves between them
const ROLES: { label: string; Icon?: typeof Cpu; seal?: boolean }[] = [
  { label: 'Techie', Icon: NerdIcon as unknown as typeof Cpu },
  { label: 'Strategist', Icon: Compass },
  { label: 'Doctoral Candidate', Icon: GraduationCap },
  { label: 'Entrepreneur', Icon: Rocket },
  { label: 'SIGMA', seal: true },
];

const RoleReel = ({ ready }: { ready: boolean }) => {
  const [lit, setLit] = useState(-1);
  useEffect(() => {
    if (!ready) return;
    let t: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      setLit(0);
      t = setInterval(() => setLit((i) => (i + 1) % ROLES.length), 1800);
    }, 3000);
    return () => { clearTimeout(start); clearInterval(t); };
  }, [ready]);
  return (
    <ul className="mt-5 flex flex-wrap justify-center md:justify-start gap-2" aria-label="Techie, Strategist, Doctoral Candidate, Entrepreneur, SIGMA">
      {ROLES.map(({ label, Icon, seal }, i) => {
        const on = lit === i;
        return (
          <motion.li key={label}
            initial={{ opacity: 0, y: 14, scale: 0.6 }}
            animate={ready ? { opacity: 1, y: [0, -3, 0], scale: on ? 1.06 : 1 } : undefined}
            transition={{
              opacity: { delay: 2.0 + i * 0.12, duration: 0.3 },
              scale: { delay: on ? 0 : 2.0 + i * 0.12, type: 'spring', stiffness: 420, damping: 18 },
              y: { delay: 2.8 + i * 0.3, duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
            }}
            className={`flex items-center gap-1.5 rounded-full border pl-1 pr-3 py-1 text-xs sm:text-sm font-bold tracking-wide transition-colors duration-500 ${
              on ? 'bg-white text-royal-blue border-white shadow-[0_0_24px_rgba(255,255,255,0.6)]' : 'bg-white/[0.07] text-white border-white/25'}`}>
            <span className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-500 ${on ? 'bg-royal-blue text-white' : 'bg-white text-royal-blue'}`}>
              {seal ? <img src="/img/pbs-seal.png" alt="" className="h-6 w-6" /> : Icon && <Icon size={14} />}
            </span>
            {label}
          </motion.li>
        );
      })}
    </ul>
  );
};

/* ---------------- Crest artwork ---------------- */
// Original line art inspired by a crest: rings, rays and stars. It turns slowly and drifts with scroll.
const CrestArt = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -60]);
  const rays = Array.from({ length: 36 }, (_, i) => i * 10);
  return (
    <motion.div aria-hidden="true" style={{ y }} className="pointer-events-none absolute inset-[-38%]">
      <motion.svg viewBox="0 0 400 400" className="h-full w-full" animate={{ rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}>
        <g fill="none" stroke="white">
          <circle cx="200" cy="200" r="190" strokeOpacity="0.12" strokeWidth="1" />
          <circle cx="200" cy="200" r="168" strokeOpacity="0.18" strokeWidth="1" strokeDasharray="2 6" />
          <circle cx="200" cy="200" r="146" strokeOpacity="0.1" strokeWidth="10" />
          <circle cx="200" cy="200" r="124" strokeOpacity="0.22" strokeWidth="1" />
          {rays.map((a) => (
            <line key={a} x1="200" y1="44" x2="200" y2={a % 30 === 0 ? 66 : 58} strokeOpacity={a % 30 === 0 ? 0.35 : 0.15} strokeWidth="1.5"
              transform={`rotate(${a} 200 200)`} />
          ))}
        </g>
        <g fill="white" fillOpacity="0.35">
          {[0, 72, 144, 216, 288].map((a) => (
            <path key={a} transform={`rotate(${a} 200 200) translate(200 30)`} d="M0 -6 L1.8 -1.8 L6 -1.8 L2.6 1 L3.8 5.5 L0 2.8 L-3.8 5.5 L-2.6 1 L-6 -1.8 L-1.8 -1.8 Z" />
          ))}
        </g>
      </motion.svg>
    </motion.div>
  );
};

/* ---------------- Magnetic primary button ---------------- */
// On desktop the most important action leans toward the cursor; glowing, turning border marks it as the one to press
const MagneticBook = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 18 });
  const sy = useSpring(y, { stiffness: 260, damping: 18 });
  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.3);
    y.set((e.clientY - r.top - r.height / 2) * 0.4);
  };
  return (
    <motion.a href={BOOK_URL} onPointerMove={onMove} onPointerLeave={() => { x.set(0); y.set(0); }}
      style={{ x: sx, y: sy }} whileTap={{ scale: 0.95 }}
      className="glow-border btn-pill btn-solid inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-royal-blue text-sm font-bold tracking-wide">
      <CalendarCheck size={17} /> Book Time
    </motion.a>
  );
};

/* ---------------- Section 1: Welcome ---------------- */
const Welcome = () => {
  const ready = useContext(IntroContext);
  const hello = useGreeting();
  const show = (delay: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: ready ? { opacity: 1, y: 0 } : undefined,
    transition: { delay, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] as const },
  });
  return (
    <section className="px-4 sm:px-6 pt-8 md:pt-16 pb-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] items-center gap-10 md:gap-14">
        {/* Photo scene */}
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={ready ? { opacity: 1, scale: 1 } : undefined}
          transition={{ type: 'spring', stiffness: 140, damping: 18 }}
          className="relative mx-auto aspect-square w-[min(15rem,62vw)] md:w-[min(24rem,34vw)]">
          <CrestArt />
          <a href="https://www.mrjackdee.com/" target="_blank" rel="noopener noreferrer" aria-label="Visit MrJackDee.com"
            className="photo-link absolute inset-0 block">
            <motion.span aria-hidden="true" className="absolute -inset-2.5 rounded-full border-2 border-transparent border-t-white border-l-white/40"
              animate={{ rotate: 360 }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }} />
            <span className="absolute inset-0 overflow-hidden rounded-full border-[5px] border-white bg-white shadow-[0_30px_70px_-20px_rgba(0,0,0,0.7)]">
              <img src={HEADSHOT} alt="Jack Dee" className="h-full w-full object-cover object-top" referrerPolicy="no-referrer" />
              {/* one consistent royal-blue grade for photos across the site */}
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-royal-blue/45 via-transparent to-transparent" />
            </span>
          </a>
          <picture className="absolute bottom-[2%] right-[4%] pointer-events-none">
            <source srcSet="/img/life-member.webp" type="image/webp" />
            <img src="/img/life-member.png" alt="Phi Beta Sigma Life Member insignia" className="h-14 md:h-20 w-auto drop-shadow-[0_10px_18px_rgba(0,0,0,0.55)]" />
          </picture>
        </motion.div>

        {/* Name, roles and actions on a frosted panel */}
        <div className="glass rounded-[32px] px-5 py-7 sm:px-8 md:px-10 md:py-10 text-center md:text-left">
          <motion.p {...show(0.1)} className="text-sm font-bold tracking-wide text-[#c8c9c7]">
            {hello} I'm
          </motion.p>
          <Signature ready={ready} />
          <motion.p {...show(2.1)} className="text-lead font-semibold text-white/95 max-w-md mx-auto md:mx-0">
            Brother, scholar, builder, lifelong student. This is where all of it lives.
          </motion.p>
          <RoleReel ready={ready} />
          <motion.div {...show(2.7)} className="mt-7 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <MagneticBook />
            <ShareButton variant="pill" />
          </motion.div>
          <motion.div {...show(2.9)} className="mt-6 flex justify-center md:justify-start">
            <SocialIcons variant="header" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ---------------- Section 2: Life in Motion ---------------- */
// A bento grid: one tile per part of Jack's life, each with its own original line art,
// its own small motion, a light sweep, and a 3D tilt that follows the finger or cursor.

// Original line-art motifs drawn for each tile (white strokes on the tile's blue)
const ART: Record<string, React.ReactNode> = {
  brotherhood: (
    <g fill="none" stroke="white" strokeOpacity="0.28">
      <circle cx="100" cy="100" r="88" strokeDasharray="2 7" />
      <circle cx="100" cy="100" r="70" />
      <circle cx="100" cy="100" r="52" strokeOpacity="0.16" strokeWidth="8" />
      {Array.from({ length: 24 }, (_, i) => <line key={i} x1="100" y1="6" x2="100" y2="18" transform={`rotate(${i * 15} 100 100)`} />)}
    </g>
  ),
  scholarship: (
    <g fill="none" stroke="white" strokeOpacity="0.32" strokeWidth="2" strokeLinejoin="round">
      <path d="M30 140 L100 120 L170 140 L170 60 L100 40 L30 60 Z" />
      <path d="M100 40 L100 120" />
      <path d="M45 70 L85 58 M45 88 L85 76 M45 106 L85 94 M115 58 L155 70 M115 76 L155 88 M115 94 L155 106" strokeOpacity="0.2" />
      {Array.from({ length: 7 }, (_, i) => <line key={i} x1="100" y1="30" x2="100" y2="6" transform={`rotate(${(i - 3) * 18} 100 40)`} strokeOpacity="0.22" />)}
    </g>
  ),
  wellness: (
    <g fill="none" stroke="white" strokeOpacity="0.32" strokeWidth="2">
      <path d="M100 150 C70 120 70 80 100 50 C130 80 130 120 100 150 Z" />
      <path d="M100 150 C60 140 40 110 44 80 C70 90 92 115 100 150 Z" />
      <path d="M100 150 C140 140 160 110 156 80 C130 90 108 115 100 150 Z" />
      <path d="M40 165 Q100 150 160 165" strokeOpacity="0.2" />
    </g>
  ),
  journal: (
    <g fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="2">
      <rect x="30" y="30" width="140" height="140" rx="8" />
      <path d="M45 52 H155" strokeWidth="6" strokeOpacity="0.25" />
      <path d="M45 72 H155 M45 82 H155" strokeOpacity="0.2" />
      <rect x="45" y="94" width="50" height="40" strokeOpacity="0.22" />
      <path d="M105 98 H155 M105 110 H155 M105 122 H155 M105 134 H140 M45 148 H155" strokeOpacity="0.18" />
    </g>
  ),
  jordans: (
    <g fill="none" stroke="white" strokeOpacity="0.32" strokeWidth="2" strokeLinejoin="round">
      <path d="M28 130 L36 96 C60 96 78 80 88 60 L112 66 C112 82 124 92 142 96 C162 100 174 110 174 126 L174 136 L28 136 Z" />
      <path d="M28 136 L174 136 L174 146 L28 146 Z" strokeOpacity="0.22" />
      <path d="M92 74 L120 80 M88 84 L118 90 M84 94 L114 100" strokeOpacity="0.22" />
      <circle cx="140" cy="116" r="7" strokeOpacity="0.22" />
    </g>
  ),
  faith: (
    <g fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="2">
      <path d="M20 140 H180" />
      <path d="M50 140 A50 50 0 0 1 150 140" />
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1="100" y1="80" x2="100" y2="40" transform={`rotate(${(i - 4) * 20} 100 140)`} strokeOpacity="0.2" />)}
      <path d="M60 160 Q100 150 140 160 M80 172 Q100 166 120 172" strokeOpacity="0.18" />
    </g>
  ),
  travel: (
    <g fill="none" stroke="white" strokeOpacity="0.32" strokeWidth="2">
      <path d="M20 160 C60 150 70 90 110 80 C140 72 160 50 176 30" strokeDasharray="5 7" strokeOpacity="0.28" />
      <circle cx="20" cy="160" r="5" />
      <path d="M168 40 l14 -16 -4 20 -10 -4 z" fill="white" fillOpacity="0.35" stroke="none" />
      <circle cx="100" cy="100" r="78" strokeOpacity="0.12" />
    </g>
  ),
  following: (
    <g fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="2">
      <circle cx="100" cy="100" r="22" />
      <circle cx="100" cy="100" r="46" strokeOpacity="0.22" />
      <circle cx="100" cy="100" r="70" strokeOpacity="0.15" />
      <circle cx="100" cy="100" r="94" strokeOpacity="0.1" />
      <path d="M100 100 L166 34" strokeOpacity="0.3" />
    </g>
  ),
};

type Tile = {
  key: keyof typeof ART; title: string; line: string; to: string; Icon: typeof Cpu;
  span: string; motion: 'float' | 'spin' | 'pulse' | 'swing' | 'drift'; artMotion: 'turn' | 'breathe' | 'drift'; photo?: string;
};

const ICON_MOTION: Record<Tile['motion'], TargetAndTransition> = {
  float: { y: [0, -5, 0] },
  spin: { rotate: [0, 12, -8, 0] },
  pulse: { scale: [1, 1.14, 1] },
  swing: { rotate: [0, -10, 10, 0] },
  drift: { x: [0, 5, 0] },
};
const ART_MOTION: Record<Tile['artMotion'], TargetAndTransition> = {
  turn: { rotate: 360 },
  breathe: { scale: [1, 1.08, 1] },
  drift: { x: [0, 10, 0], y: [0, -8, 0] },
};

// span: phone (2 columns) then desktop (4 columns) footprint
const TILES: Tile[] = [
  { key: 'brotherhood', title: 'Brotherhood', line: 'Since 1998, Phi Beta Sigma has been home. Life Member #2174.', to: '/bio', Icon: Users,
    span: 'col-span-2 lg:row-span-2', motion: 'pulse', artMotion: 'turn' },
  { key: 'scholarship', title: 'Scholarship', line: 'Chasing a doctorate because curiosity never retires.', to: '/leadership', Icon: GraduationCap,
    span: '', motion: 'float', artMotion: 'breathe' },
  { key: 'wellness', title: 'Yoga & Meditation', line: 'Breath first. Everything else second.', to: '/lifestyle', Icon: Flower2,
    span: '', motion: 'spin', artMotion: 'breathe' },
  { key: 'journal', title: 'The Journal', line: 'Daily notes, written like the morning paper.', to: '/journal', Icon: Newspaper,
    span: 'col-span-2', motion: 'float', artMotion: 'drift' },
  { key: 'jordans', title: 'Air Jordans', line: 'Retros, royal blue and the thrill of the hunt.', to: '/lifestyle', Icon: Footprints,
    span: '', motion: 'swing', artMotion: 'drift', photo: 'https://lh3.googleusercontent.com/d/19I2Izijp1jMdeVZgewWrnqxCDylxasxP' },
  { key: 'faith', title: 'Faith', line: 'It does not make the road easier. It makes me steadier.', to: '/lifestyle', Icon: Sunrise,
    span: '', motion: 'pulse', artMotion: 'breathe' },
  { key: 'travel', title: 'On the Move', line: 'New places keep my perspective honest.', to: '/lifestyle', Icon: Plane,
    span: '', motion: 'drift', artMotion: 'drift' },
  { key: 'following', title: "What I'm Following", line: 'Politics, AI, credit and culture, fresh daily.', to: '#following', Icon: Rss,
    span: '', motion: 'pulse', artMotion: 'breathe' },
];

const LifeTile = ({ t, i, onOpen, extra }: { t: Tile; i: number; onOpen: () => void; extra?: string }) => {
  const { Icon } = t;
  const big = t.key === 'brotherhood';
  // 3D tilt that follows the pointer
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 18 });
  const sry = useSpring(ry, { stiffness: 200, damping: 18 });
  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 10);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 10);
  };
  return (
    <motion.button onClick={onOpen} onPointerMove={onMove} onPointerLeave={() => { rx.set(0); ry.set(0); }}
      initial={{ opacity: 0, y: 28, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: (i % 4) * 0.09, type: 'spring', stiffness: 200, damping: 20 }}
      whileTap={{ scale: 0.96 }}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 800 }}
      className={`@container group relative overflow-hidden rounded-[26px] text-left border border-white/20 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)]
        bg-gradient-to-br from-[#2a6ab5] via-[#164f90] to-[#0d3260] ${t.span}
        ${big ? 'min-h-[220px] lg:min-h-0' : t.span.includes('col-span-2') ? 'min-h-[170px]' : 'min-h-[190px] sm:min-h-[210px]'}`}>
      {t.photo && (
        <motion.img src={t.photo} alt="" referrerPolicy="no-referrer" loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-55 mix-blend-luminosity"
          animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
      )}
      {big && (
        <img src="https://lh3.googleusercontent.com/d/1ujWt304YSwhQIHht7yrT4GNP18dQJ-fY" alt="" referrerPolicy="no-referrer"
          className="absolute right-4 top-4 z-10 h-24 lg:h-40 w-auto drop-shadow-[0_12px_24px_rgba(0,0,0,0.5)]" />
      )}
      {/* tile artwork */}
      <motion.svg aria-hidden="true" viewBox="0 0 200 200"
        className={`absolute ${big ? '-left-10 -bottom-16 h-72 w-72 lg:h-[26rem] lg:w-[26rem]' : '-right-8 -bottom-10 h-40 w-40 sm:h-44 sm:w-44'}`}
        animate={ART_MOTION[t.artMotion]}
        transition={t.artMotion === 'turn' ? { duration: 60, repeat: Infinity, ease: 'linear' } : { duration: 9 + i, repeat: Infinity, ease: 'easeInOut' }}>
        {ART[t.key]}
      </motion.svg>
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0a2647]/90 via-[#0a2647]/25 to-transparent" />
      {/* light sweep every few seconds */}
      <motion.span aria-hidden="true" className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
        animate={{ x: ['0%', '400%'] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 6 + i * 0.7, delay: 1.5 + i * 0.5 }} />
      <span aria-hidden="true" className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

      <span className="relative flex h-full flex-col justify-between gap-6 p-4 sm:p-5">
        <span className="flex items-start justify-between">
          <motion.span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-royal-blue shadow-lg"
            animate={ICON_MOTION[t.motion]} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}>
            <Icon size={20} />
          </motion.span>
          {!big && <ArrowUpRight size={18} className="text-white/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />}
        </span>
        <span>
          <span className={`font-display block font-bold leading-tight text-white ${big ? 'text-[clamp(1.2rem,8cqi,2.4rem)]' : 'text-[clamp(0.85rem,9cqi,1.15rem)]'}`}>{t.title}</span>
          <span className={`mt-1 block leading-snug text-white/90 ${big ? 'text-sm lg:text-base max-w-sm' : 'text-xs sm:text-sm'}`}>{extra || t.line}</span>
          {big && (
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold tracking-wide text-royal-blue">
              My Journey <ArrowUpRight size={14} />
            </span>
          )}
        </span>
      </span>
    </motion.button>
  );
};

const LifeTiles = () => {
  const navigate = useNavigate();
  const [latest, setLatest] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/journal').then((r) => r.json()).then((d) => setLatest(d.entries?.[0]?.title || null)).catch(() => {});
  }, []);
  const open = (to: string) => {
    if (to.startsWith('#')) document.getElementById(to.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else navigate(to);
  };
  return (
    <section className="px-4 sm:px-6 pt-10 md:pt-16">
      <div className="max-w-6xl mx-auto">
<SectionHead title="Life in Motion" note="Every part of the story, one tap away." />
        <div className="grid grid-cols-2 lg:grid-cols-4 lg:auto-rows-[200px] gap-3 sm:gap-4 [grid-auto-flow:dense]">
          {TILES.map((t, i) => (
            <LifeTile key={t.key} t={t} i={i} onOpen={() => open(t.to)}
              extra={t.key === 'journal' && latest ? `Latest: ${latest}` : undefined} />
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------------- Section heading (shared by sections 2-5) ---------------- */
export const SectionHead = ({ title, note }: { title: string; note?: string }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
    className="mb-5 md:mb-7 flex items-end justify-between gap-4">
    <h2 className="font-display text-display font-extrabold text-white tracking-tight">{title}</h2>
    {note && <p className="hidden sm:block text-sm text-white/75 max-w-xs text-right">{note}</p>}
  </motion.div>
);

/* ---------------- Section 3: My Apps ---------------- */
// Phone-style app icons for Jack's other sites, on a frosted dock
const APPS = [
  { name: 'MrJackDee', href: 'https://www.mrjackdee.com/', Icon: Globe, note: 'My corner of the web' },
  { name: 'BeVISIBLE', href: 'https://bevisible.work/', Icon: GraduationCap, note: 'My doctoral research' },
  { name: 'DonOra Global', href: 'https://www.donoraglobal.com/', Icon: Building2, note: 'My company' },
  { name: 'Book Time', href: BOOK_URL, Icon: CalendarCheck, note: 'Grab an hour with me' },
];

const Apps = () => (
  <section className="px-4 sm:px-6 pt-12 md:pt-16">
    <div className="max-w-6xl mx-auto">
      <SectionHead title="My Apps" note="The rest of my world, one tap away." />
      <div className="glass rounded-[32px] px-3 py-6 sm:px-8 sm:py-8">
        <div className="grid grid-cols-4 gap-2 sm:gap-6">
          {APPS.map(({ name, href, Icon, note }, i) => (
            <motion.a key={name} href={href} {...(href === BOOK_URL ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
              initial={{ opacity: 0, scale: 0.5, y: 12 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.09, type: 'spring', stiffness: 380, damping: 18 }}
              whileHover={{ y: -6, rotate: [0, -4, 4, 0], transition: { rotate: { duration: 0.4 } } }} whileTap={{ scale: 0.88 }}
              className="group flex flex-col items-center text-center" aria-label={`${name}: ${note}`}>
              <span className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-[22px] bg-gradient-to-br from-white to-[#dbe7fb] text-royal-blue shadow-[0_16px_32px_-12px_rgba(0,0,0,0.6)] transition-shadow group-hover:shadow-[0_0_28px_rgba(255,255,255,0.55)]">
                <Icon size={30} />
                {name === 'Book Time' && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-400" />
                  </span>
                )}
              </span>
              <span className="mt-2.5 text-[11px] sm:text-sm font-bold tracking-wide text-white leading-tight">{name}</span>
              <span className="hidden sm:block mt-0.5 text-xs text-[#c8c9c7] leading-tight">{note}</span>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ---------------- Section 4: Words I Live By ---------------- */
// Jack's quotes on a frosted card; each one writes itself in word by word, with a progress bar per quote
const QUOTES = [
  'Grief does not go away. It just becomes the fuel you learn to run on when everything else runs out.',
  'I stopped trying to prove I belonged in the room the moment I realized my job was to build a better one.',
  'My faith does not make the path easier. It makes me harder to break when the path gets rough.',
  'Fitness taught me what no degree could. That consistency in the uncomfortable is the only real credential that transfers everywhere.',
  'Paying it forward is not generosity. It is accountability. Someone invested in me before I earned it, and I owe that debt to the next person in line.',
];
const QUOTE_MS = 8000;

const QuoteWidget = () => {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setI((n) => (n + 1) % QUOTES.length), QUOTE_MS);
    return () => clearTimeout(t);
  }, [i, paused]);
  return (
    <section className="px-4 sm:px-6 pt-12 md:pt-16">
      <div className="max-w-6xl mx-auto">
        <SectionHead title="Words I Live By" />
        <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
          className="glass relative overflow-hidden rounded-[32px] px-6 py-8 sm:px-12 sm:py-12">
          <span aria-hidden="true" className="absolute -top-10 left-3 sm:left-6 text-[160px] leading-none text-white/10">"</span>
          <div className="relative min-h-[150px] sm:min-h-[120px] flex items-center" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.p key={i} exit={{ opacity: 0, y: -10, transition: { duration: 0.3 } }}
                className="text-xl sm:text-3xl font-semibold leading-snug text-white">
                {QUOTES[i].split(' ').map((w, n) => (
                  <motion.span key={n} className="inline-block mr-[0.28em]"
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ delay: n * 0.045, duration: 0.35, ease: 'easeOut' }}>
                    {w}
                  </motion.span>
                ))}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="relative mt-6 flex items-center justify-between gap-4">
            <span className="signature-text text-xl sm:text-2xl font-bold text-white">Jack Dee</span>
            <div className="flex items-center gap-1.5">
              {QUOTES.map((_, n) => (
                <button key={n} onClick={() => setI(n)} aria-label={`Quote ${n + 1}`}
                  className="tap-target relative h-1.5 w-6 sm:w-8 overflow-hidden rounded-full bg-white/20">
                  {n === i && !paused && <motion.span key={`p${i}`} className="absolute inset-y-0 left-0 bg-white" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: QUOTE_MS / 1000, ease: 'linear' }} />}
                  {(n < i || (n === i && paused)) && <span className="absolute inset-0 bg-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Home is built section by section per the Web Development README (section 9).
export const HomePage = () => (
  <motion.main initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-6">
    <Welcome />
    <LifeTiles />
    <Apps />
    <QuoteWidget />
    <NewsFeed />
    <div id="following" className="scroll-mt-24"><FollowingFeed /></div>
    {/* Closing: save to home screen, then the shared footer */}
    <section className="pt-4 pb-10 flex justify-center">
      <InstallButton />
    </section>
  </motion.main>
);
