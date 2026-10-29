// © MrJackDee™. All rights reserved.
// App frame for geauxmab.com: opening screen, app bar, phone tab bar, slide-out menu, footer.
// Mirrors book.geauxmab.com (calendar/CalendarPage.tsx) so both sites look and behave as one app.
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from 'motion/react';
import {
  Menu, X, ArrowUpRight, ArrowUp, Globe, Building2, Linkedin, Mail, Facebook, Instagram,
  CalendarCheck, Smartphone, Share, Share2, SquarePlus, Check, House,
} from 'lucide-react';

export const IMG = {
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

export const BOOK_URL = 'https://book.geauxmab.com/';

export const NAV = [
  { name: 'Home', path: '/' },
  { name: 'The Brotherhood', path: '/bio' },
  { name: 'The Scholarship', path: '/leadership' },
  { name: 'The Service', path: '/lifestyle' },
  { name: 'The Journal', path: '/journal' },
];

const LINKS = {
  fraternity: 'https://phibetasigma1914.org/',
  region: 'https://www.pbsgulfcoastregion.org/',
  chapter: 'https://omicronsigma1914.org/',
};

/* ---------------- Social icons ---------------- */
// X's current logo (lucide only ships the old Twitter bird)
const XLogo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

type Social = { href: string; label: string; tip: string; Icon: React.ComponentType<{ size?: number }> };
// Grouped as Personal | Social | Business, same as the booking app
export const SOCIAL_GROUPS: { title: string; items: Social[] }[] = [
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

const SocialIcon = ({ s, i, variant }: { s: Social; i: number; variant: SocialVariant }) => {
  const box = {
    header: 'w-8 h-8 sm:w-10 sm:h-10 bg-white/10 border border-white/20 text-white hover:bg-white hover:text-royal-blue',
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
        <Icon size={variant === 'header' ? 16 : 18} />
      </motion.a>
      <span role="tooltip"
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${tipPos} z-[70] whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide shadow-lg ${tipColor}
          opacity-0 scale-90 transition-[opacity,scale] duration-150 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100`}>
        {s.tip}
      </span>
    </span>
  );
};

// Personal | Social | Business: dividers in rows, labeled groups in the menu
export const SocialIcons = ({ variant }: { variant: SocialVariant }) => {
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

/* ---------------- Opening screen ---------------- */
// Plays on every load: seal, then "Jack Dee" written in by hand
export const Splash = ({ show }: { show: boolean }) => (
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
          <img src={IMG.sealWatermark} alt="" className="w-full h-full opacity-30 select-none" />
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
            GeauxMAB.com
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

/* ---------------- Save to Home Screen ---------------- */
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export const InstallButton = ({ compact = false }: { compact?: boolean }) => {
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
          <motion.div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-royal-blue/80 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)}>
            <motion.div role="dialog" aria-modal="true" aria-label="Save to Home Screen"
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[28px] p-7 shadow-2xl text-royal-blue">
              <div className="flex items-center gap-4 mb-6">
                <img src="/apple-touch-icon.png" alt="" width={56} height={56} className="w-14 h-14 rounded-2xl shadow-md" />
                <div>
                  <p className="font-bold text-royal-blue">GeauxMAB.com</p>
                  <p className="text-xs text-royal-blue/70">Save it like an app. One tap to come back.</p>
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

/* ---------------- Share ---------------- */
// Native share sheet on phones, copy-link fallback elsewhere. Shares the page being viewed.
export const ShareButton = ({ variant = 'icon' }: { variant?: 'icon' | 'pill' | 'tab' }) => {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    const data = { title: document.title, text: 'Jack Dee | GeauxMAB.com', url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(data); } catch { /* closed the sheet */ }
      return;
    }
    try { await navigator.clipboard.writeText(data.url); } catch { window.prompt('Copy this link', data.url); return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <>
      {variant === 'tab' ? (
        <motion.button whileTap={{ scale: 0.9 }} onClick={onShare} aria-label="Share this page"
          className="flex-1 flex flex-col items-center justify-center gap-1 text-white/70">
          <Share2 size={21} />
          <span className="text-[11px] font-bold tracking-wider">Share</span>
        </motion.button>
      ) : variant === 'icon' ? (
        <motion.button whileTap={{ scale: 0.9 }} onClick={onShare} aria-label="Share this page"
          className="w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-royal-blue transition-colors">
          <Share2 size={17} />
        </motion.button>
      ) : (
        <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onShare}
          className="btn-pill btn-ghost px-8 py-4 rounded-full bg-white/5 border border-white/60 text-white font-bold tracking-wide text-xs hover:bg-white hover:text-royal-blue transition-all flex items-center justify-center gap-2">
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

/* ---------------- Affiliations (menu) ---------------- */
// Shown as memberships, not endorsements; logos are used exactly as published
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
      {AFFILIATIONS.map(({ webp, png, alt, title, sub, href }, i) => (
        <motion.li key={title} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06 }}>
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-royal-blue/5 transition-colors">
            <picture className="shrink-0 w-14 h-14 flex items-center justify-center">
              <source srcSet={webp} type="image/webp" />
              <img src={png} alt={alt} width={56} height={56} className="max-w-full max-h-full object-contain" />
            </picture>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-sm font-bold text-royal-blue">{title}</span>
              <span className="block text-xs text-royal-blue/60">{sub}</span>
            </span>
            <ArrowUpRight size={16} className="shrink-0 text-royal-blue/40 group-hover:text-royal-blue" />
          </a>
        </motion.li>
      ))}
    </ul>
  </div>
);

/* ---------------- Slide-out menu ---------------- */
const SiteMenu = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const go = (path: string) => { navigate(path); onClose(); };
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[75]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-royal-blue/70" onClick={onClose} />
          <motion.nav aria-label="Site menu"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="absolute right-0 top-0 bottom-0 w-[86vw] max-w-sm overflow-y-auto bg-white text-royal-blue rounded-l-[32px] shadow-2xl p-7 flex flex-col"
            style={{ paddingTop: 'calc(1.75rem + env(safe-area-inset-top))' }}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-royal-blue text-white rounded-xl flex items-center justify-center font-bold">JD</div>
                <p className="font-bold text-royal-blue tracking-tight">GeauxMAB.com</p>
              </div>
              <button onClick={onClose} aria-label="Close menu" className="w-10 h-10 rounded-full bg-royal-blue/10 flex items-center justify-center text-royal-blue/80">
                <X size={18} />
              </button>
            </div>
            <ul className="space-y-1">
              {NAV.map((l, i) => (
                <motion.li key={l.name} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.06 }}>
                  <button onClick={() => go(l.path)} aria-current={pathname === l.path ? 'page' : undefined}
                    className={`group w-full flex items-center justify-between px-5 py-3.5 rounded-2xl transition-colors ${pathname === l.path ? 'bg-royal-blue/10' : 'hover:bg-royal-blue/10'}`}>
                    <span className="text-sm font-bold tracking-wide text-royal-blue">{l.name}</span>
                    <ArrowUpRight size={16} className="text-royal-blue/50 group-hover:text-royal-blue" />
                  </button>
                </motion.li>
              ))}
            </ul>
            <a href={BOOK_URL}
              className="btn-pill mt-5 self-start px-6 py-3 rounded-full bg-royal-blue text-white text-sm font-bold tracking-wide flex items-center gap-2">
              <CalendarCheck size={16} /> Book Time
            </a>
            <div className="mt-8 pt-6 border-t border-royal-blue/10">
              <Affiliations />
            </div>
            <div className="mt-8 pt-6 border-t border-royal-blue/10">
              <SocialIcons variant="menu" />
            </div>
          </motion.nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ---------------- Phone tab bar ---------------- */
const Tab = ({ active, label, Icon, onClick, href }: { active: boolean; label: string; Icon: typeof House; onClick?: () => void; href?: string }) => {
  const body = (
    <>
      {active && (
        <motion.span layoutId="tab-glow" className="absolute top-1.5 w-12 h-8 rounded-full bg-white/15 shadow-[0_0_18px_rgba(255,255,255,0.35)]"
          transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
      )}
      <Icon size={21} className="relative" />
      <span className="relative text-[11px] font-bold tracking-wider">{label}</span>
    </>
  );
  const cls = `relative flex-1 flex flex-col items-center justify-center gap-1 ${active ? 'text-white' : 'text-white/70'}`;
  return href
    ? <a href={href} aria-label={label} className={cls}>{body}</a>
    : <motion.button whileTap={{ scale: 0.9 }} onClick={onClick} aria-label={label} aria-current={active ? 'page' : undefined} className={cls}>{body}</motion.button>;
};

const TabBar = ({ onMenu }: { onMenu: () => void }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const home = pathname === '/';
  return (
    <nav aria-label="App" className="md:hidden fixed inset-x-0 bottom-0 z-[60] bg-royal-blue border-t border-white/15 shadow-[0_-10px_30px_rgba(0,0,0,0.35)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div aria-hidden="true" className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="h-16 flex">
        <Tab active={home} label="Home" Icon={House}
          onClick={() => (home ? window.scrollTo({ top: 0, behavior: 'smooth' }) : navigate('/'))} />
        <Tab active={false} label="Book" Icon={CalendarCheck} href={BOOK_URL} />
        <ShareButton variant="tab" />
        <Tab active={!home} label="More" Icon={Menu} onClick={onMenu} />
      </div>
    </nav>
  );
};

/* ---------------- App bar ---------------- */
const AppBar = ({ onMenu }: { onMenu: () => void }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <header className="sticky top-0 z-50 bg-royal-blue border-b border-white/10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <motion.div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/80 origin-left" style={{ scaleX: progress }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-5 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/')} aria-label="GeauxMAB.com home" className="leading-tight shrink-0 text-left">
            <span className="block text-white font-bold tracking-tight">Jack Dee</span>
            <span className="block text-[11px] font-bold tracking-wide text-white whitespace-nowrap">Life Member #2174</span>
          </button>
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
                <span role="tooltip"
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[70] whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide shadow-lg bg-white text-royal-blue
                    opacity-0 scale-90 transition-[opacity,scale] duration-150 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100">
                  {tip}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Laptop navigation: content-width pills, the current page filled white */}
        <nav aria-label="Main" className="hidden xl:flex items-center gap-1">
          {NAV.map((item) => {
            const on = pathname === item.path;
            return (
              <button key={item.path} onClick={() => navigate(item.path)} aria-current={on ? 'page' : undefined}
                className={`relative px-3.5 py-2 rounded-full text-xs font-bold tracking-wide transition-colors ${on ? 'text-royal-blue' : 'text-white/85 hover:text-white'}`}>
                {on && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-white" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <span className="relative">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a href={BOOK_URL}
            className="btn-pill btn-solid hidden lg:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-royal-blue text-xs font-bold tracking-wide">
            <CalendarCheck size={15} /> Book Time
          </a>
          <div className="hidden md:block"><ShareButton /></div>
          <InstallButton compact />
          <motion.button whileTap={{ scale: 0.94 }} onClick={onMenu} aria-label="Open menu"
            className="hidden md:flex xl:hidden w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white items-center justify-center hover:bg-white hover:text-royal-blue transition-colors">
            <Menu size={18} />
          </motion.button>
        </div>
      </div>
    </header>
  );
};

/* ---------------- Back to top ---------------- */
const BackToTop = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="fixed right-4 md:right-8 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-8 z-50 w-11 h-11 rounded-full bg-white text-royal-blue shadow-[0_10px_28px_-10px_rgba(0,0,0,0.6)] flex items-center justify-center">
          <ArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

/* ---------------- Footer ---------------- */
export const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="relative z-10 border-t border-white/10 pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center gap-3 mb-8">
        {NAV.filter((l) => l.path !== '/').map((l) => (
          <button key={l.name} onClick={() => navigate(l.path)}
            className="rounded-full bg-white px-5 py-3 text-[11px] md:text-xs font-bold tracking-wide text-royal-blue shadow-md shadow-black/20 hover:shadow-[0_0_16px_rgba(255,255,255,0.45)] transition-shadow">
            {l.name}
          </button>
        ))}
      </div>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-5 text-[11px] tracking-wider text-white">
        <nav aria-label="Legal" className="flex gap-5 md:flex-1">
          <button onClick={() => navigate('/privacy')} className="tap-target-y text-white/80 underline-offset-4 hover:underline hover:text-white">Privacy Policy</button>
          <span aria-hidden="true" className="text-white/30">&middot;</span>
          <button onClick={() => navigate('/terms')} className="tap-target-y text-white/80 underline-offset-4 hover:underline hover:text-white">Terms of Service</button>
        </nav>
        <SocialIcons variant="footer" />
        <p className="md:flex-1 md:text-right">&copy; {new Date().getFullYear()} MrJackDee™ | All Rights Reserved</p>
      </div>
    </footer>
  );
};

/* ---------------- Frame ---------------- */
// Header, phone tab bar, slide-out menu and back-to-top button for every page
export const AppFrame = () => {
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setMenu(false), [pathname]);
  return (
    <>
      <AppBar onMenu={() => setMenu(true)} />
      <TabBar onMenu={() => setMenu(true)} />
      <SiteMenu open={menu} onClose={() => setMenu(false)} />
      <BackToTop />
    </>
  );
};
