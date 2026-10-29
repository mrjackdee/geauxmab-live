// © MrJackDee™. All rights reserved.
import React, { useEffect, useRef, useState } from 'react';
import {
  motion,
  MotionConfig,
  AnimatePresence,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  type Variants,
} from 'motion/react';
import {
  ArrowLeft, Menu, X, ArrowUpRight,
  Globe, Building2, Linkedin, Mail, Facebook, Instagram,
  CalendarCheck, Smartphone, Share, Share2, SquarePlus, Check, House, Zap,
} from 'lucide-react';
import Booking from './Booking';
import { ClockToggle, formatClock, useClock24, useViewZone, zoneLabel, UseMyTime } from './clock';
import { PrivacyPolicy, TermsOfService } from './Legal';

// Booking app for https://book.geauxmab.com (standalone build: npm run build:book)
// Mirrors the main site's look (royal blue, Arial, square buttons, tracking)
// with a custom booking flow (./Booking.tsx) backed by the Worker's /api routes.

const IMG = {
  headshotWebp: '/img/jack-dee.webp',
  headshotJpg: '/img/jack-dee.jpg',
  sealWebp: '/img/pbs-seal.webp',
  sealPng: '/img/pbs-seal.png',
  sealWatermark: '/img/pbs-seal-watermark.webp',
  lifeMemberWebp: '/img/life-member.webp',
  lifeMemberPng: '/img/life-member.png',
  chapterWebp: '/img/chapter-omicron-sigma.webp',
  chapterPng: '/img/chapter-omicron-sigma.png',
  regionWebp: '/img/region-gulf-coast.webp',
  regionPng: '/img/region-gulf-coast.png',
};

const SITE = 'https://geauxmab.com';
const SITE_LINKS = [
  { name: 'Home', href: `${SITE}/#/` },
  { name: 'The Brotherhood', href: `${SITE}/#/bio` },
  { name: 'The Scholarship', href: `${SITE}/#/leadership` },
  { name: 'The Service', href: `${SITE}/#/lifestyle` },
];

// X's current logo (lucide only ships the old Twitter bird)
const XLogo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Direct profile links (no link shorteners). `tip` is the hover label.
type Social = { href: string; label: string; tip: string; Icon: React.ComponentType<{ size?: number }> };
// Grouped as Personal | Social | Business, with dividers between groups
const SOCIAL_GROUPS: { title: string; items: Social[] }[] = [
  { title: 'Personal', items: [
    { href: 'https://www.MrJackDee.com/', label: 'Personal Website', tip: 'MrJackDee.com', Icon: Globe },
  ] },
  { title: 'Social', items: [
    { href: 'https://www.facebook.com/geauxmab', label: 'Facebook', tip: 'Facebook', Icon: Facebook },
    { href: 'https://www.instagram.com/the.jackdee', label: 'Instagram', tip: 'Instagram', Icon: Instagram },
    { href: 'https://x.com/MrKreducator', label: 'X', tip: 'X', Icon: XLogo },
  ] },
  { title: 'Business', items: [
    { href: 'https://www.donoraglobal.com/', label: 'DonOra Global', tip: 'DonOra Global', Icon: Building2 },
    { href: 'https://www.linkedin.com/in/mrjackdee/', label: 'LinkedIn', tip: 'LinkedIn', Icon: Linkedin },
    { href: 'mailto:jd@geauxmab.com', label: 'Email Jack Dee', tip: 'Email', Icon: Mail },
  ] },
];

type SocialVariant = 'header' | 'menu' | 'footer';

// One animated icon with a label bubble on hover / keyboard focus
const SocialIcon = ({ s, i, variant }: { s: Social; i: number; variant: SocialVariant }) => {
  const box = {
    header: 'w-8 h-8 bg-white/10 border border-white/20 text-white hover:bg-white hover:text-royal-blue',
    menu: 'w-11 h-11 bg-royal-blue/5 text-royal-blue hover:bg-royal-blue hover:text-white',
    footer: 'w-8 h-8 sm:w-9 sm:h-9 text-white hover:bg-white hover:text-royal-blue',
  }[variant];
  const tipPos = variant === 'header' ? 'top-full mt-2' : 'bottom-full mb-2';
  const tipColor = variant === 'menu' ? 'bg-royal-blue text-white' : 'bg-white text-royal-blue';
  const { Icon } = s;
  return (
    <span className="relative group">
      <motion.a href={s.href} aria-label={s.label}
        {...(s.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
        initial={{ opacity: 0, y: 8, scale: 0.6 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15 + i * 0.07, type: 'spring', stiffness: 380, damping: 18 }}
        whileHover={{ y: -3, scale: 1.12, rotate: i % 2 ? 6 : -6 }}
        whileTap={{ scale: 0.9 }}
        className={`tap-target rounded-full flex items-center justify-center transition-colors hover:shadow-[0_0_16px_rgba(255,255,255,0.45)] ${box}`}>
        <Icon size={variant === 'header' ? 15 : 18} />
      </motion.a>
      <span role="tooltip"
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${tipPos} z-[70] whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide shadow-lg ${tipColor}
          opacity-0 scale-90 transition-[opacity,scale] duration-150 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100`}>
        {s.tip}
      </span>
    </span>
  );
};

// Personal | Social | Business: dividers in the header and footer rows, labeled groups in the menu
const SocialIcons = ({ variant }: { variant: SocialVariant }) => {
  let n = 0; // running index keeps the pop-in stagger continuous across groups
  if (variant === 'menu') {
    return (
      <div className="space-y-5">
        {SOCIAL_GROUPS.map(({ title, items }) => (
          <div key={title}>
            <p className="text-[11px] tracking-wide text-royal-blue/50 mb-3">{title}</p>
            <div className="flex flex-wrap gap-3">
              {items.map((s) => <SocialIcon key={s.label} s={s} i={n++} variant="menu" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
      {SOCIAL_GROUPS.map(({ title, items }, g) => (
        <React.Fragment key={title}>
          {g > 0 && <span aria-hidden="true" className="mx-0.5 sm:mx-1 h-5 w-px bg-white/30" />}
          {items.map((s) => <SocialIcon key={s.label} s={s} i={n++} variant={variant} />)}
        </React.Fragment>
      ))}
    </div>
  );
};

const SHARE = {
  title: 'Jack Dee | GeauxMAB.com',
  text: 'Book time with Jack Dee. Pick a time and lock it in.',
  url: 'https://book.geauxmab.com/',
};

type View = 'home' | 'book' | 'privacy' | 'terms';
const viewFromHash = (): View => {
  const h = window.location.hash.replace('#', '');
  return h === 'book' || h === 'privacy' || h === 'terms' ? h : 'home';
};
const VIEW_TITLE: Record<View, string> = { home: 'Let’s Connect', book: 'Jack Dee | Calendar', privacy: 'Privacy Policy', terms: 'Terms of Service' };


/* ---------------- Seal watermark (white line art) ---------------- */
// Brand standards: the seal always stays upright. In the background it only drifts and breathes.
const SealWatermark = ({ className = '' }: { className?: string }) => (
  <motion.div
    className="w-full h-full"
    animate={{ scale: [1, 1.06, 1], x: [0, 18, 0], y: [0, -14, 0] }}
    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
  >
    <motion.img
      src={IMG.sealWatermark}
      alt=""
      aria-hidden="true"
      width={900}
      height={900}
      decoding="async"
      className={`w-full h-full select-none ${className}`}
    />
  </motion.div>
);

/* ---------------- Splash ---------------- */
const Splash = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.04 }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-royal-blue overflow-hidden"
        aria-hidden="true"
      >
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.15, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-[820px] h-[820px] border border-white/10 rounded-full" />
          <div className="absolute w-[600px] h-[600px] border border-white/5 rounded-full" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 1.25 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160vw] md:w-[90vh] max-w-[1000px] aspect-square pointer-events-none"
        >
          <SealWatermark className="opacity-30" />
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.06, 0.1, 0.06] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white rounded-full blur-[120px] pointer-events-none"
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-40 h-40 md:w-52 md:h-52">
            <motion.span
              className="absolute -inset-2 rounded-full border-2 border-transparent border-t-white border-r-white/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            />
            <motion.picture
              initial={{ opacity: 0, scale: 0.5, filter: 'blur(12px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ type: 'spring', stiffness: 90, damping: 12, delay: 0.1 }}
              className="block w-full h-full"
            >
              <source srcSet={IMG.sealWebp} type="image/webp" />
              <img src={IMG.sealPng} alt="" className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]" width={360} height={360} />
            </motion.picture>
          </div>

          {/* Handwritten: the signature is revealed left to right, as if a pen is writing it */}
          <motion.h1
            initial={{ clipPath: 'inset(-30% 100% -30% 0)' }}
            animate={{ clipPath: 'inset(-30% 0% -30% 0)' }}
            transition={{ duration: 1.6, delay: 0.55, ease: [0.45, 0.05, 0.55, 0.95] }}
            className="signature-text text-6xl md:text-8xl text-white mt-6 px-6 loading-text-shadow"
          >
            Jack Dee
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.8, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="text-xs md:text-sm font-bold tracking-wide text-white/90 mt-2"
          >
            Book Time &middot; GeauxMAB
          </motion.p>
          <div className="mt-8 h-[2px] w-64 bg-white/10 overflow-hidden rounded-full">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="h-full w-1/2 bg-gradient-to-r from-transparent via-white to-transparent"
            />
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ---------------- Tilt portrait ---------------- */
const Portrait = () => {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 15 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 15 });

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <div className="w-full max-w-[min(16.5rem,36svh)] sm:max-w-sm mx-auto my-7 md:my-12" style={{ perspective: 1000 }}>
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={() => { mx.set(0); my.set(0); }}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative"
      >
        {/* Photo opens MrJackDee.com in a new tab */}
        <a href="https://www.mrjackdee.com/" target="_blank" rel="noopener noreferrer" aria-label="Visit MrJackDee.com (opens in a new tab)"
          className="photo-link relative block aspect-square overflow-hidden rounded-[32px] shadow-2xl border-8 border-white bg-white">
          <picture>
            <source srcSet={IMG.headshotWebp} type="image/webp" />
            <img src={IMG.headshotJpg} alt="Jack Dee" width={400} height={400} className="w-full h-full object-cover" />
          </picture>
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent pointer-events-none"
            initial={{ x: '-120%' }}
            animate={{ x: '120%' }}
            transition={{ duration: 2.2, delay: 2.6, repeat: Infinity, repeatDelay: 6 }}
          />
        </a>

        {/* Gold Life Member insignia sits fixed and upright on the photo's lower-right corner */}
        <motion.div
          className="absolute -bottom-5 -right-3 h-15 md:-bottom-6 md:-right-5 md:h-18 pointer-events-none"
          style={{ translateZ: 60 }}
        >
          <picture>
            <source srcSet={IMG.lifeMemberWebp} type="image/webp" />
            <img src={IMG.lifeMemberPng} alt="Phi Beta Sigma Life Member insignia"
                 className="h-full w-auto drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]" width={122} height={176} />
          </picture>
        </motion.div>

      </motion.div>
    </div>
  );
};

/* ---------------- Save to Home Screen ---------------- */
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const InstallButton = ({ compact = false }: { compact?: boolean }) => {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [sheet, setSheet] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone;
    if (standalone) setInstalled(true);
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);

  if (installed) return null;

  const onClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      setDeferred(null);
    } else {
      setSheet(true);
    }
  };

  return (
    <>
      {compact ? (
        <motion.button whileTap={{ scale: 0.94 }} onClick={onClick} aria-label="Save to Home Screen"
          className="h-10 w-10 sm:w-auto sm:pl-3 sm:pr-4 rounded-full bg-white text-royal-blue text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg">
          <SquarePlus size={16} /> <span className="hidden sm:inline">Save App</span>
        </motion.button>
      ) : (
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onClick}
          className="btn-pill btn-ghost px-8 py-4 rounded-full bg-white/5 border border-white/60 text-white font-bold tracking-wide text-xs hover:bg-white hover:text-royal-blue transition-all flex items-center justify-center gap-2">
          <Smartphone size={16} /> Save to Home Screen
        </motion.button>
      )}

      <AnimatePresence>
        {sheet && (
          <motion.div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-royal-blue/70 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)}>
            <motion.div role="dialog" aria-modal="true" aria-label="Save to Home Screen"
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[28px] p-7 shadow-2xl text-royal-blue">
              <div className="flex items-center gap-4 mb-6">
                <img src="/apple-touch-icon.png" alt="" width={56} height={56} className="w-14 h-14 rounded-2xl shadow-md" />
                <div>
                  <p className="font-bold text-royal-blue">Jack Dee | GeauxMAB.com</p>
                  <p className="text-xs text-royal-blue/70">Save it like an app. One tap to book next time.</p>
                </div>
              </div>
              <ol className="space-y-4 text-sm">
                <li className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-royal-blue/10 text-royal-blue flex items-center justify-center shrink-0"><Share size={18} /></span>
                  <span>Tap <b>Share</b> in your browser's toolbar.</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-royal-blue/10 text-royal-blue flex items-center justify-center shrink-0"><SquarePlus size={18} /></span>
                  <span>Choose <b>Add to Home Screen</b>, then tap <b>Add</b>.</span>
                </li>
              </ol>
              <button onClick={() => setSheet(false)}
                className="btn-pill mt-7 mx-auto block px-10 py-3 rounded-full bg-royal-blue text-white font-bold tracking-wide text-xs">
                Got It
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ---------------- Booking status ---------------- */
// Glows green only when Calendly confirms real open times this month or next
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

type Availability = { state: 'checking' | 'open' | 'full' | 'unknown'; upcoming: string[] };

// Checks this month and next; refreshes every 5 minutes and when the app comes back into view
const useAvailability = (): Availability => {
  const [av, setAv] = useState<Availability>({ state: 'checking', upcoming: [] });

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      try {
        const res = await Promise.all([monthKey(now), monthKey(next)].map(async (m) => {
          const r = await fetch(`/api/slots?month=${m}`);
          const d = await r.json();
          if (!r.ok) throw new Error('unavailable');
          return d as { slots: string[]; mock?: boolean };
        }));
        const all = [...new Set(res.flatMap((d) => d.slots))].filter((t) => Date.parse(t) > Date.now()).sort();
        const live = !res.some((d) => d.mock); // local test times never count as real availability
        if (alive) setAv({ state: !live ? 'unknown' : all.length ? 'open' : 'full', upcoming: all.slice(0, 4) });
      } catch {
        if (alive) setAv({ state: 'unknown', upcoming: [] });
      }
    };
    check();
    const t = setInterval(check, 5 * 60 * 1000);
    const onShow = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { alive = false; clearInterval(t); document.removeEventListener('visibilitychange', onShow); };
  }, []);

  return av;
};

const BookingStatus = ({ state }: { state: Availability['state'] }) => {
  const open = state === 'open';
  const label = { checking: 'Checking My Calendar', open: 'Time Available', full: 'Fully Booked Right Now', unknown: 'See My Calendar' }[state];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-700 ${
      open ? 'border-emerald-400/70 bg-emerald-400/10 shadow-[0_0_18px_rgba(52,211,153,0.55)]' : 'border-white/30 bg-white/5'}`}>
      <span className="relative flex w-2 h-2">
        {open && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />}
        <span className={`relative inline-flex w-2 h-2 rounded-full ${open ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]' : 'bg-white/50'}`} />
      </span>
      <span className={`text-[11px] font-bold tracking-wide ${open ? 'text-emerald-200' : 'text-white/80'}`}>{label}</span>
    </div>
  );
};

/* ---------------- Live clocks ---------------- */
const JACK_TZ = 'America/New_York';
const clock = (tz: string, d: Date, h24 = false) => formatClock(d, tz, h24);
const tzAbbr = (tz: string, d: Date) =>
  new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(d).find((p) => p.type === 'timeZoneName')?.value || '';

const LiveClocks = () => {
  const [h24] = useClock24();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(t); }, []);
  const { tz: mine, overridden } = useViewZone();
  const label = overridden ? `Showing ${zoneLabel(mine)}` : 'Your Local Time';
  const same = clock(mine, now) === clock(JACK_TZ, now);
  const cells = same
    ? [{ who: label, t: clock(JACK_TZ, now, h24), z: tzAbbr(JACK_TZ, now) }]
    : [{ who: label, t: clock(mine, now, h24), z: tzAbbr(mine, now) }, { who: 'My Time', t: clock(JACK_TZ, now, h24), z: tzAbbr(JACK_TZ, now) }];
  return (
    <div className="flex flex-col items-center">
    <div className="flex flex-wrap justify-center gap-2">
      {cells.map((c) => (
        <div key={c.who} className="inline-flex flex-col items-center rounded-2xl bg-white text-royal-blue px-5 py-2 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.5)]">
          <span className="text-[11px] font-bold tracking-wide text-royal-blue/60">{c.who}</span>
          <span className="mt-0.5 text-lg font-bold tabular-nums whitespace-nowrap leading-tight">
            {c.t} <span className="text-[11px] font-bold tracking-wide text-royal-blue/60">{c.z}</span>
          </span>
        </div>
      ))}
    </div>
    <UseMyTime />
    </div>
  );
};

/* ---------------- Next available slots ---------------- */
// Quick picks only: the Let's Connect button above opens the full calendar
const SlotsDivider = ({ delay }: { delay: number }) => (
  <div className="flex items-center justify-center md:justify-start gap-3">
    <motion.span aria-hidden="true" className="h-px w-9 bg-white/40 origin-right"
      initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay, duration: 0.5, ease: 'easeOut' }} />
    <motion.span className="text-[11px] font-bold tracking-wide text-[#c8c9c7] whitespace-nowrap"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.35, duration: 0.4 }}>
      To Quick Book
    </motion.span>
    <motion.span aria-hidden="true" className="h-px w-9 bg-white/40 origin-left"
      initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay, duration: 0.5, ease: 'easeOut' }} />
  </div>
);

const NextOpen = ({ av, onPick }: { av: Availability; onPick: (iso: string) => void }) => {
  const { tz: localTz } = useViewZone();
  const dayOf = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: localTz }).format(d);
  const fmtDay = (iso: string) => {
    const k = dayOf(new Date(iso));
    if (k === dayOf(new Date())) return 'Today';
    if (k === dayOf(new Date(Date.now() + 86400000))) return 'Tomorrow';
    return new Intl.DateTimeFormat('en-US', { timeZone: localTz, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso));
  };
  const [h24] = useClock24();
  const fmtT = (iso: string) => formatClock(iso, localTz, h24);

  return (
    <div className="relative w-fit max-w-full rounded-[28px] bg-[#113b6c] border border-white/15 p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] overflow-hidden text-center">
      <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <h2 className="flex items-center justify-center gap-2 whitespace-nowrap text-sm sm:text-base md:text-lg font-bold tracking-wide  text-white">
        <Zap size={16} /> Next Openings
      </h2>
      <p className="mt-1 text-xs text-white/70">Click to select</p>
      <div className="mt-3"><ClockToggle /></div>
      <div className="mt-4 grid grid-cols-[repeat(2,auto)] justify-center gap-2 text-left">
        {av.state === 'checking' && !av.upcoming.length
          ? [0, 1, 2, 3].map((i) => (
            <motion.div key={i} className="h-[58px] w-28 rounded-2xl bg-white/[0.06]"
              animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }} />
          ))
          : av.upcoming.map((t, i) => (
            <motion.button key={t} onClick={() => onPick(t)}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.96 }}
              className="group rounded-2xl border border-white/20 bg-white/[0.06] px-3 py-2.5 text-left hover:bg-white hover:border-white transition-colors">
              <p className="text-[11px] font-bold tracking-wide text-[#c8c9c7] group-hover:text-royal-blue/70">{fmtDay(t)}</p>
              <p className="text-base font-bold tabular-nums text-white group-hover:text-royal-blue whitespace-nowrap">
                {fmtT(t)} <span className="text-[11px] font-bold tracking-wide text-[#c8c9c7] group-hover:text-royal-blue/60">{tzAbbr(localTz, new Date(t))}</span>
              </p>
            </motion.button>
          ))}
      </div>
      <div className="mt-7">
        <LiveClocks />
      </div>
    </div>
  );
};

/* ---------------- Share ---------------- */
// Native share sheet on phones (Messages, WhatsApp, Mail...), copy-link fallback elsewhere
const ShareButton = ({ variant = 'icon' }: { variant?: 'icon' | 'pill' | 'tab' }) => {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    if (navigator.share) {
      try { await navigator.share(SHARE); } catch { /* closed the sheet */ }
      return;
    }
    try { await navigator.clipboard.writeText(SHARE.url); } catch { window.prompt('Copy this link', SHARE.url); return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <>
      {variant === 'tab' ? (
        <motion.button whileTap={{ scale: 0.9 }} onClick={onShare} aria-label="Share this app"
          className="flex-1 flex flex-col items-center justify-center gap-1 text-white/70">
          <Share2 size={21} />
          <span className="text-[11px] font-bold tracking-wider">Share</span>
        </motion.button>
      ) : variant === 'icon' ? (
        <motion.button whileTap={{ scale: 0.9 }} onClick={onShare} aria-label="Share this app"
          className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-royal-blue transition-colors">
          <Share2 size={17} />
        </motion.button>
      ) : (
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onShare}
          className="btn-pill px-8 py-4 rounded-full bg-white/5 border border-white/60 text-white font-bold tracking-wide text-xs hover:bg-white hover:text-royal-blue transition-all flex items-center justify-center gap-2">
          <Share2 size={16} /> Share
        </motion.button>
      )}
      <AnimatePresence>
        {copied && (
          <motion.div role="status" aria-live="polite"
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="fixed left-1/2 -translate-x-1/2 z-[90] bg-white text-royal-blue rounded-full shadow-2xl px-5 py-3 flex items-center gap-2 text-sm font-bold"
            style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}>
            <Check size={16} className="text-royal-blue" /> Link copied
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* ---------------- Reveal helper ---------------- */
const Reveal = ({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ---------------- Affiliations (menu) ---------------- */
// Shown as memberships, not endorsements; logos are used exactly as published
const LINKS = {
  fraternity: 'https://phibetasigma1914.org/',
  region: 'https://www.pbsgulfcoastregion.org/',
  chapter: 'https://omicronsigma1914.org/',
};

const AFFILIATIONS = [
  { webp: IMG.lifeMemberWebp, png: IMG.lifeMemberPng, alt: 'Phi Beta Sigma Life Member insignia',
    title: 'Life Member #2174', sub: 'Phi Beta Sigma Fraternity, Inc.', href: LINKS.fraternity },
  { webp: IMG.regionWebp, png: IMG.regionPng, alt: 'Gulf Coast Region logo',
    title: 'Gulf Coast Region', sub: 'Texas · Louisiana · New Mexico', href: LINKS.region },
  { webp: IMG.chapterWebp, png: IMG.chapterPng, alt: 'Omicron Sigma Alumni Chapter logo',
    title: 'North Dallas Sigmas', sub: 'Omicron Sigma Alumni Chapter · Dallas, Texas', href: LINKS.chapter },
];

const Affiliations = () => (
  <div>
    <p className="text-[11px] tracking-wide text-royal-blue/50 mb-3">Affiliations</p>
    <ul className="space-y-2">
      {AFFILIATIONS.map(({ webp, png, alt, title, sub, href }, i) => {
        const body = (
          <>
            <picture className="shrink-0 w-14 h-14 flex items-center justify-center">
              <source srcSet={webp} type="image/webp" />
              <img src={png} alt={alt} width={56} height={56} className="max-w-full max-h-full object-contain" />
            </picture>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-sm font-bold text-royal-blue">{title}</span>
              <span className="block text-xs text-royal-blue/60">{sub}</span>
            </span>
            {href && <ArrowUpRight size={16} className="shrink-0 text-royal-blue/40 group-hover:text-royal-blue" />}
          </>
        );
        return (
          <motion.li key={title} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06 }}>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-royal-blue/5 transition-colors">{body}</a>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2">{body}</div>
            )}
          </motion.li>
        );
      })}
    </ul>
  </div>
);

/* ---------------- Site menu (links back to geauxmab.com) ---------------- */
const SiteMenu = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <AnimatePresence>
    {open && (
      <motion.div className="fixed inset-0 z-[75]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="absolute inset-0 bg-royal-blue/60 backdrop-blur-sm" onClick={onClose} />
        <motion.nav aria-label="GeauxMAB.com"
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="absolute right-0 top-0 bottom-0 w-[86vw] max-w-sm bg-white text-royal-blue rounded-l-[32px] shadow-2xl p-7 flex flex-col"
          style={{ paddingTop: 'calc(1.75rem + env(safe-area-inset-top))' }}>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-royal-blue text-white rounded-xl flex items-center justify-center font-bold">JD</div>
              <div className="leading-tight">
                <p className="font-bold text-royal-blue tracking-tight">GeauxMAB.com</p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close menu" className="w-10 h-10 rounded-full bg-royal-blue/10 flex items-center justify-center text-royal-blue/80">
              <X size={18} />
            </button>
          </div>
          <ul className="space-y-2">
            {SITE_LINKS.map((l, i) => (
              <motion.li key={l.name} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.06 }}>
                <a href={l.href} className="group flex items-center justify-between px-5 py-4 rounded-2xl hover:bg-royal-blue/10 transition-colors">
                  <span className="text-sm font-bold tracking-wide text-royal-blue group-hover:text-royal-blue">{l.name}</span>
                  <ArrowUpRight size={16} className="text-royal-blue/50 group-hover:text-royal-blue transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </motion.li>
            ))}
          </ul>
          <div className="mt-8 pt-6 border-t border-royal-blue/10">
            <Affiliations />
          </div>
          <div className="mt-auto pt-6 border-t border-royal-blue/10">
            <SocialIcons variant="menu" />
          </div>
        </motion.nav>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ---------------- Tab bar (phones) ---------------- */
type TabId = View;

const Tab = ({ active, label, Icon, onClick }: { active: boolean; label: string; Icon: typeof House; onClick: () => void }) => (
  <motion.button whileTap={{ scale: 0.9 }} onClick={onClick} aria-label={label} aria-current={active ? 'page' : undefined}
    className={`relative flex-1 flex flex-col items-center justify-center gap-1 ${active ? 'text-white' : 'text-white/70'}`}>
    {active && (
      <motion.span layoutId="tab-glow" className="absolute top-1.5 w-12 h-8 rounded-full bg-white/15 shadow-[0_0_18px_rgba(255,255,255,0.35)]"
        transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
    )}
    <Icon size={21} className="relative" />
    <span className="relative text-[11px] font-bold tracking-wider">{label}</span>
  </motion.button>
);

const TabBar = ({ view, onHome, onBook, onMenu }: { view: TabId; onHome: () => void; onBook: () => void; onMenu: () => void }) => (
  <nav aria-label="App" className="md:hidden fixed inset-x-0 bottom-0 z-[60] bg-royal-blue border-t border-white/15 shadow-[0_-10px_30px_rgba(0,0,0,0.35)]"
    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
    <div aria-hidden="true" className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    <div className="h-16 flex">
      <Tab active={view === 'home'} label="Home" Icon={House} onClick={onHome} />
      <Tab active={view === 'book'} label="Book" Icon={CalendarCheck} onClick={onBook} />
      <ShareButton variant="tab" />
      <Tab active={false} label="More" Icon={Menu} onClick={onMenu} />
    </div>
  </nav>
);

/* ---------------- App bar ---------------- */
const AppBar = ({ view, onBack, onMenu }: { view: View; onBack: () => void; onMenu: () => void }) => (
  <header className="sticky top-0 z-50 bg-royal-blue/95 border-b border-white/10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
    <div className="max-w-6xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-2">
      <AnimatePresence mode="wait" initial={false}>
        {view !== 'home' ? (
          <motion.button key="back" onClick={onBack} aria-label="Back to home"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-royal-blue transition-colors">
            <ArrowLeft size={18} />
          </motion.button>
        ) : (
          <motion.div key="brand" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-3 min-w-0">
            <div className="leading-tight shrink-0">
              <p className="text-white font-bold tracking-tight">Jack Dee</p>
              <p className="text-[11px] font-bold tracking-wide text-white whitespace-nowrap">Life Member #2174</p>
            </div>
            {/* Fraternity seal, region, then chapter: same size and centerline, each opens its site */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {[
                { webp: IMG.sealWebp, png: IMG.sealPng, tip: 'Phi Beta Sigma', alt: 'Phi Beta Sigma Fraternity, Inc.', href: LINKS.fraternity },
                { webp: IMG.regionWebp, png: IMG.regionPng, tip: 'Gulf Coast Region', alt: 'Gulf Coast Region', href: LINKS.region },
                { webp: IMG.chapterWebp, png: IMG.chapterPng, tip: 'North Dallas Sigmas', alt: 'North Dallas Sigmas, Omicron Sigma Alumni Chapter', href: LINKS.chapter },
              ].map(({ webp, png, tip, alt, href }) => (
                <span key={tip} className="relative group shrink-0">
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${alt} (opens in a new tab)`} className="tap-target block rounded-full">
                    <picture>
                      <source srcSet={webp} type="image/webp" />
                      <img src={png} alt="" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-md" />
                    </picture>
                  </a>
                  {/* Same hover label style as the social icons */}
                  <span role="tooltip"
                    className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[70] whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide shadow-lg bg-white text-royal-blue
                      opacity-0 scale-90 transition-[opacity,scale] duration-150 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100">
                    {tip}
                  </span>
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p key={view} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          className="absolute left-1/2 -translate-x-1/2 text-[11px] font-bold tracking-wide text-white/80 hidden sm:block">
          {VIEW_TITLE[view]}
        </motion.p>
      </AnimatePresence>
      <div className="flex items-center gap-2">
        <div className="hidden md:block"><ShareButton /></div>
        <InstallButton compact />
        <motion.button whileTap={{ scale: 0.94 }} onClick={onMenu} aria-label="Open GeauxMAB.com menu"
          className="hidden md:flex w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white items-center justify-center hover:bg-white hover:text-royal-blue transition-colors">
          <Menu size={18} />
        </motion.button>
      </div>
    </div>
  </header>
);

/* ---------------- Page ---------------- */
export default function CalendarPage() {
  const [splash, setSplash] = useState(true); // opening screen plays on every load
  const [menu, setMenu] = useState(false);
  const [quick, setQuick] = useState<string | null>(null);
  const av = useAvailability();
  const [view, setView] = useState<View>(viewFromHash);
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 140]);

  useEffect(() => {
    if (!splash) return;
    const t = setTimeout(() => setSplash(false), 3000);
    return () => clearTimeout(t);
  }, [splash]);

  // Phone back button / swipe back returns to the home screen
  useEffect(() => {
    const onHash = () => { setView(viewFromHash()); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const openBook = (time?: string) => { setQuick(time ?? null); window.location.hash = 'book'; window.scrollTo({ top: 0 }); };
  const goHome = () => { if (window.location.hash) window.location.hash = ''; else setView('home'); };

  const heroDelay = splash ? 3.1 : 0.1;

  const screen: Variants = {
    initial: (dir: number) => ({ opacity: 0, x: dir * 60 }),
    animate: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] as const } },
    exit: (dir: number) => ({ opacity: 0, x: dir * -60, transition: { duration: 0.3 } }),
  };
  const dir = view === 'home' ? -1 : 1;

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-[100dvh] font-sans antialiased text-white bg-royal-blue selection:bg-white selection:text-royal-blue overflow-x-hidden">
      <Splash show={splash} />

      {/* Living background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <motion.div style={{ y: bgY }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:left-[62%] w-[150vw] max-w-[1100px] md:w-[78vw] aspect-square">
          <SealWatermark className="opacity-30" />
        </motion.div>
        <motion.div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-white/10 blur-[100px]"
          animate={{ x: [0, -40, 0], y: [0, 30, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute -bottom-40 -left-32 w-[480px] h-[480px] rounded-full bg-white/[0.07] blur-[110px]"
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      <AppBar view={view} onBack={goHome} onMenu={() => setMenu(true)} />
      <TabBar view={view} onHome={() => { if (view !== 'home') goHome(); else window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        onBook={() => openBook()} onMenu={() => setMenu(true)} />
      <SiteMenu open={menu} onClose={() => setMenu(false)} />

      <main className="relative z-10">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          {view === 'home' ? (
            <motion.div key="home" custom={dir} variants={screen} initial="initial" animate="animate" exit="exit">
              {/* Social row sits under the header and scrolls away with the page */}
              <div className="border-b border-white/10">
                <div className="max-w-6xl mx-auto px-3 sm:px-5 py-2.5">
                  <SocialIcons variant="header" />
                </div>
              </div>
              {/* Home screen */}
              <section className="pt-6 md:pt-16 pb-16">
                <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-4 md:gap-12 items-center">
                  <div className="text-center md:text-left order-2 md:order-1">
                    {/* Only shows when Calendly confirms real open times; otherwise nothing takes up space */}
                    <AnimatePresence>
                      {av.state === 'open' && (
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: heroDelay, duration: 0.5 }} className="mb-7">
                          <BookingStatus state={av.state} />
                        </motion.div>
                      )}
                    </AnimatePresence>



                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: heroDelay + 0.65, duration: 0.5 }}
                      className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 justify-center md:justify-start">
                      <div className="inline-flex flex-col items-center gap-2">
                        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => openBook()}
                          className="btn-pill btn-solid px-9 py-4 rounded-full bg-white text-royal-blue font-bold tracking-wide text-sm flex items-center justify-center gap-3">
                          <CalendarCheck size={18} /> My Calendar
                        </motion.button>
                        <p className="text-[11px] font-bold tracking-wide text-white/70">Click to Schedule</p>
                      </div>
                      <div className="hidden md:block"><ShareButton variant="pill" /></div>
                    </motion.div>

                    {/* Hidden entirely when there are no near-term slots, so nothing points at an empty panel */}
                    {(av.state === 'checking' || av.upcoming.length > 0) && (
                      <>
                        <div className="mt-7">
                          <SlotsDivider delay={heroDelay + 0.75} />
                        </div>
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: heroDelay + 1.1, duration: 0.5 }}
                          className="mt-5 flex justify-center md:justify-start">
                          <NextOpen av={av} onPick={(t) => openBook(t)} />
                        </motion.div>
                      </>
                    )}
                  </div>

                  <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: heroDelay + 0.3, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                    className="order-1 md:order-2 flex flex-col items-center">
                    <Portrait />
                  </motion.div>
                </div>
              </section>

              {/* Save to Home Screen sits just above the footer */}
              <section className="pb-10 flex justify-center">
                <InstallButton />
              </section>
            </motion.div>
          ) : view === 'privacy' || view === 'terms' ? (
            <motion.div key={view} custom={dir} variants={screen} initial="initial" animate="animate" exit="exit">
              {view === 'privacy' ? <PrivacyPolicy /> : <TermsOfService />}
            </motion.div>
          ) : (
            <motion.div key="book" custom={dir} variants={screen} initial="initial" animate="animate" exit="exit">
              {/* Booking screen */}
              <section className="pt-5 md:pt-14 pb-16">
                <div className="max-w-5xl mx-auto px-3 sm:px-5">
                  <div className="text-center mb-5 md:mb-8">
                    <h2 className="signature-text whitespace-nowrap text-5xl sm:text-6xl md:text-7xl text-white leading-tight">Jack Dee</h2>
                  </div>
                  <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
                    <Booking key={quick || 'pick'} initialTime={quick} />
                  </motion.div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* App footer */}
      <footer className="relative z-10 border-t border-white/10 pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center gap-3 mb-8">
          {SITE_LINKS.map((l) => (
            <a key={l.name} href={l.href}
              className="rounded-full bg-white px-5 py-3 text-[11px] md:text-xs font-bold tracking-wide text-royal-blue shadow-md shadow-black/20 hover:shadow-[0_0_16px_rgba(255,255,255,0.45)] transition-shadow">
              {l.name}
            </a>
          ))}
        </div>
        <div className="max-w-6xl mx-auto px-3 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-5 text-[11px] tracking-wider text-white">
          <a href="https://geauxmab.com/" className="tap-target-y hover:text-white transition-colors">A GeauxMAB.com experience</a>
          <SocialIcons variant="footer" />
          <p>&copy; {new Date().getFullYear()} MrJackDee™</p>
        </div>
        <p className="max-w-6xl mx-auto px-6 mt-6 text-center text-[11px] leading-relaxed text-[#c8c9c7]">
          Not an official site of Phi Beta Sigma Fraternity, Inc.
        </p>
        <nav aria-label="Legal" className="max-w-6xl mx-auto px-6 mt-4 flex justify-center gap-5 text-[11px] tracking-wider">
          <a href="#privacy" className="tap-target-y text-white/80 underline-offset-4 hover:underline hover:text-white">Privacy Policy</a>
          <span aria-hidden="true" className="text-white/30">&middot;</span>
          <a href="#terms" className="tap-target-y text-white/80 underline-offset-4 hover:underline hover:text-white">Terms of Service</a>
        </nav>
      </footer>

    </div>
    </MotionConfig>
  );
}
