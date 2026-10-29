// © MrJackDee™. All rights reserved.
// Home: a personal dashboard. A profile card up top, then animated tiles for each part of Jack's life,
// quick-launch "apps" for his other sites, a rotating quote, and the two live feeds at the bottom.
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useScroll, useSpring, useTransform, type TargetAndTransition } from 'motion/react';
import {
  ArrowUpRight, BookOpen, Building2, CalendarCheck, Compass, Cpu, Flower2, Footprints, GraduationCap,
  Globe, Newspaper, Plane, Rocket, Rss, Users,
} from 'lucide-react';
import { BOOK_URL, IntroContext, InstallButton, ShareButton, SocialIcons } from './SiteChrome';
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
// Written left to right once the opening screen clears, with a glowing pen point riding the edge of the ink
const Signature = ({ ready }: { ready: boolean }) => (
  <div className="relative inline-block mt-5 md:mt-8 mb-2 md:mb-4">
    <motion.h1
      initial={{ clipPath: 'inset(-30% 100% -30% 0)' }}
      animate={ready ? { clipPath: 'inset(-30% 0% -30% 0)' } : undefined}
      transition={{ duration: 1.8, delay: 0.35, ease: [0.45, 0.05, 0.55, 0.95] }}
      className="signature-text text-signature whitespace-nowrap text-white leading-[1.25] loading-text-shadow pr-3"
    >
      Jack Dee
    </motion.h1>
    <motion.span aria-hidden="true"
      className="absolute top-[55%] h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_16px_5px_rgba(255,255,255,0.85)]"
      initial={{ left: '0%', opacity: 0 }}
      animate={ready ? { left: ['0%', '96%'], opacity: [0, 1, 1, 0] } : undefined}
      transition={{ duration: 1.8, delay: 0.35, ease: [0.45, 0.05, 0.55, 0.95], times: [0, 0.08, 0.9, 1] }} />
  </div>
);

/* ---------------- Roles graphic ---------------- */
// Five roles as icon chips: they pop in after the signature, float gently, and a spotlight moves between them
const ROLES: { label: string; Icon?: typeof Cpu; seal?: boolean }[] = [
  { label: 'Techie', Icon: Cpu },
  { label: 'Strategist', Icon: Compass },
  { label: 'Life Student', Icon: BookOpen },
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
    <ul className="mt-5 flex flex-wrap justify-center md:justify-start gap-2" aria-label="Techie, Strategist, Life Student, Entrepreneur, SIGMA">
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
          <motion.p {...show(2.1)} className="font-display text-lead font-semibold text-white/95 max-w-md mx-auto md:mx-0">
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

/* ---------------- Life tiles ---------------- */
type Tile = {
  key: string; title: string; line: string; to: string; Icon: typeof Cpu;
  image?: string; wide?: boolean; motion: 'float' | 'spin' | 'pulse' | 'swing' | 'drift';
};

const ICON_MOTION: Record<Tile['motion'], TargetAndTransition> = {
  float: { y: [0, -5, 0] },
  spin: { rotate: [0, 12, -8, 0] },
  pulse: { scale: [1, 1.14, 1] },
  swing: { rotate: [0, -10, 10, 0] },
  drift: { x: [0, 5, 0] },
};

const TILES: Tile[] = [
  { key: 'brotherhood', title: 'Brotherhood', line: '25+ years a Sigma. Still all in.', to: '/bio', Icon: Users,
    image: 'https://lh3.googleusercontent.com/d/1ujWt304YSwhQIHht7yrT4GNP18dQJ-fY', motion: 'pulse', wide: true },
  { key: 'scholarship', title: 'Scholarship', line: 'Doctoral candidate. Lifelong student.', to: '/leadership', Icon: GraduationCap, motion: 'float' },
  { key: 'business', title: 'Business', line: 'Building DonOra Global.', to: '/leadership', Icon: Building2, motion: 'drift' },
  { key: 'wellness', title: 'Yoga & Meditation', line: 'Strength, stillness, staying grounded.', to: '/lifestyle', Icon: Flower2, motion: 'spin' },
  { key: 'style', title: 'Air Jordans', line: 'Retros, royal blue and the hunt.', to: '/lifestyle', Icon: Footprints,
    image: 'https://lh3.googleusercontent.com/d/19I2Izijp1jMdeVZgewWrnqxCDylxasxP', motion: 'swing' },
  { key: 'travel', title: 'On the Move', line: 'New places, new perspective.', to: '/lifestyle', Icon: Plane,
    image: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1200&auto=format&fit=crop', motion: 'drift' },
  { key: 'journal', title: 'The Journal', line: 'Daily notes, newspaper style.', to: '/journal', Icon: Newspaper, motion: 'float' },
  { key: 'following', title: "What I'm Following", line: 'Politics, AI, credit and culture.', to: '#following', Icon: Rss, motion: 'pulse', wide: true },
];

const LifeTile = ({ t, i, onOpen, extra }: { t: Tile; i: number; onOpen: () => void; extra?: string }) => {
  const { Icon } = t;
  return (
    <motion.button onClick={onOpen}
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: (i % 4) * 0.08, type: 'spring', stiffness: 220, damping: 20 }}
      whileHover={{ y: -6, rotate: i % 2 ? 0.8 : -0.8 }}
      whileTap={{ scale: 0.96 }}
      className={`group relative overflow-hidden rounded-[26px] text-left border border-white/15 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] ${
        t.wide ? 'col-span-2' : ''} ${t.image ? 'bg-[#0e335e]' : 'bg-gradient-to-br from-[#1d5fa8] via-[#164f90] to-[#0e335e]'} aspect-[4/5] sm:aspect-[5/4] ${t.wide ? '!aspect-[2/1]' : ''}`}>
      {t.image && (
        <motion.img src={t.image} alt="" referrerPolicy="no-referrer" loading="lazy"
          className={`absolute inset-0 h-full w-full ${t.key === 'brotherhood' ? 'object-contain p-6 opacity-40' : 'object-cover opacity-80'}`}
          animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 14 + i, repeat: Infinity, ease: 'easeInOut' }} />
      )}
      {/* soft glow orb that wanders behind the content */}
      <motion.span aria-hidden="true" className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl"
        animate={{ x: [0, -20, 0], y: [0, 16, 0] }} transition={{ duration: 8 + i, repeat: Infinity, ease: 'easeInOut' }} />
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0b2a50]/95 via-[#0b2a50]/30 to-transparent" />
      {/* light sweep every few seconds */}
      <motion.span aria-hidden="true" className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
        animate={{ x: ['0%', '400%'] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 5 + i * 0.7, delay: 1 + i * 0.4 }} />
      <span aria-hidden="true" className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />

      <span className="relative flex h-full flex-col justify-between p-4 sm:p-5">
        <span className="flex items-start justify-between">
          <motion.span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-royal-blue shadow-lg"
            animate={ICON_MOTION[t.motion]} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}>
            <Icon size={20} />
          </motion.span>
          <ArrowUpRight size={18} className="text-white/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white" />
        </span>
        <span>
          <span className="block text-base sm:text-lg font-bold leading-tight text-white">{t.title}</span>
          <span className="mt-1 block text-xs sm:text-sm leading-snug text-white/85">{extra || t.line}</span>
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
    <section className="px-4 sm:px-6 pt-10 md:pt-14">
      <div className="max-w-6xl mx-auto">
        <DashLabel>Life in Motion</DashLabel>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {TILES.map((t, i) => (
            <LifeTile key={t.key} t={t} i={i} onOpen={() => open(t.to)}
              extra={t.key === 'journal' && latest ? `Latest: ${latest}` : undefined} />
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------------- Apps (other sites) ---------------- */
const APPS = [
  { name: 'MrJackDee', href: 'https://www.mrjackdee.com/', Icon: Globe, note: 'My corner of the web' },
  { name: 'BeVISIBLE', href: 'https://bevisible.work/', Icon: GraduationCap, note: 'My doctoral research' },
  { name: 'DonOra Global', href: 'https://www.donoraglobal.com/', Icon: Building2, note: 'My company' },
  { name: 'Book Time', href: BOOK_URL, Icon: CalendarCheck, note: 'Grab an hour with me' },
];

const Apps = () => (
  <section className="px-4 sm:px-6 pt-10 md:pt-14">
    <div className="max-w-6xl mx-auto">
      <DashLabel>My Apps</DashLabel>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-4 max-w-2xl">
        {APPS.map(({ name, href, Icon, note }, i) => (
          <motion.a key={name} href={href} {...(href === BOOK_URL ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
            initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            transition={{ delay: i * 0.08, type: 'spring', stiffness: 380, damping: 18 }}
            whileHover={{ y: -4 }} whileTap={{ scale: 0.9 }}
            className="group flex flex-col items-center text-center" title={note}>
            <span className="flex h-16 w-16 sm:h-[72px] sm:w-[72px] items-center justify-center rounded-[22px] bg-white text-royal-blue shadow-[0_14px_30px_-12px_rgba(0,0,0,0.6)] transition-shadow group-hover:shadow-[0_0_24px_rgba(255,255,255,0.5)]">
              <Icon size={28} />
            </span>
            <span className="mt-2 text-[11px] sm:text-xs font-bold tracking-wide text-white leading-tight">{name}</span>
            <span className="hidden sm:block text-[11px] text-[#c8c9c7] leading-tight">{note}</span>
          </motion.a>
        ))}
      </div>
    </div>
  </section>
);

/* ---------------- Quote widget ---------------- */
const QUOTES = [
  'Grief does not go away. It just becomes the fuel you learn to run on when everything else runs out.',
  'I stopped trying to prove I belonged in the room the moment I realized my job was to build a better one.',
  'My faith does not make the path easier. It makes me harder to break when the path gets rough.',
  'Fitness taught me what no degree could. That consistency in the uncomfortable is the only real credential that transfers everywhere.',
  'Paying it forward is not generosity. It is accountability. Someone invested in me before I earned it, and I owe that debt to the next person in line.',
];

const QuoteWidget = () => {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((n) => (n + 1) % QUOTES.length), 7000); return () => clearInterval(t); }, []);
  return (
    <section className="px-4 sm:px-6 pt-10 md:pt-14">
      <div className="max-w-6xl mx-auto">
        <DashLabel>Words I Live By</DashLabel>
        <div className="relative mt-4 overflow-hidden rounded-[26px] bg-white text-royal-blue px-6 py-7 sm:px-10 sm:py-9 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]">
          <span aria-hidden="true" className="absolute -top-6 left-4 font-serif text-[120px] leading-none text-royal-blue/10">"</span>
          <div className="relative min-h-[120px] sm:min-h-[96px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.p key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5 }}
                className="text-lg sm:text-2xl font-bold italic leading-snug" style={{ fontFamily: 'Georgia, serif' }}>
                {QUOTES[i]}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="relative mt-5 flex items-center justify-between gap-4">
            <span className="signature-text text-3xl">Jack Dee</span>
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {QUOTES.map((_, n) => (
                <span key={n} className="relative h-1.5 w-6 overflow-hidden rounded-full bg-royal-blue/15">
                  {n === i && <motion.span className="absolute inset-y-0 left-0 bg-royal-blue" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 7, ease: 'linear' }} />}
                  {n < i && <span className="absolute inset-0 bg-royal-blue" />}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const DashLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs sm:text-sm font-bold tracking-wide text-white">{children}</span>
    <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-white/40 to-transparent" />
  </div>
);

// Built and approved one section at a time (Web Development README, section 9).
// Section 1 (Welcome) is live; the remaining sections are added as each one is approved.
export const HomePage = () => (
  <motion.main initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-10">
    <Welcome />
  </motion.main>
);
