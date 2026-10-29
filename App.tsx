// © MrJackDee™. All rights reserved.
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, MotionConfig, useScroll, useInView, useTransform, AnimatePresence } from 'motion/react';
import {
  ArrowRight, ArrowUpRight, Globe, Award, TrendingUp, Users, Activity, Building2, Facebook, Instagram, Linkedin,
  Briefcase, GraduationCap, Heart, Twitter, Clock, Headphones, Check, Flower2, Sparkles, Handshake,
} from 'lucide-react';

import { AppFrame, Footer, InstallButton, SocialIcons, Splash } from './SiteChrome';
import NewsFeed, { FollowingFeed } from './NewsFeed';
import { JournalArticle, JournalLatest, JournalPage, JournalWrite } from './Journal';

// --- Utility ---

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const PageMetadata = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const metaData: Record<string, { title: string; description: string; keywords: string }> = {
      '/': {
        title: 'GeauxMAB.com | Jack Dee',
        description: 'Official website of Jack Dee. Techie, Strategist, Life Student, and Entrepreneur. Exploring leadership, fraternity legacy, and lifestyle.',
        keywords: 'Jack Dee, GeauxMAB, Phi Beta Sigma, Leadership, Strategy, Entrepreneurship, Lifestyle, Techie'
      },
      '/bio': {
        title: 'Bio | GeauxMAB.com',
        description: 'Learn more about Jack Dee’s journey, wellness practices, style, and travel experiences.',
        keywords: 'Jack Dee Bio, Wellness, Sneaker Collecting, Travel, Perspective'
      },
      '/leadership': {
        title: 'Leadership & Scholarship | GeauxMAB.com',
        description: 'Exploring academic focus, fraternity legacy, and professional digital platforms.',
        keywords: 'Leadership, Scholarship, Phi Beta Sigma, MrJackDee, DonOra Global, Curious 2 Capable'
      },
      '/lifestyle': {
        title: 'Lifestyle | GeauxMAB.com',
        description: 'A glimpse into the lifestyle, interests, and creative pursuits of Jack Dee.',
        keywords: 'Lifestyle, Creative, Interests, Jack Dee'
      }
    };

    metaData['/journal'] = {
      title: 'The Journal | GeauxMAB.com',
      description: 'Daily notes from Jack Dee on brotherhood, scholarship, service and life in motion.',
      keywords: 'Jack Dee Journal, Daily Journal, GeauxMAB, Phi Beta Sigma, Leadership'
    };
    // Article pages set their own title once the story loads
    if (pathname.startsWith('/journal/') && pathname !== '/journal/write') return;
    const current = metaData[pathname] || metaData['/'];
    document.title = current.title;
    
    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) {
      descriptionTag.setAttribute('content', current.description);
    }

    const keywordsTag = document.querySelector('meta[name="keywords"]');
    if (keywordsTag) {
      keywordsTag.setAttribute('content', current.keywords);
    }
  }, [pathname]);

  return null;
};

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  key?: React.Key;
}

const FadeIn = ({ children, delay = 0, className = "" }: FadeInProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
      transition={{ duration: 0.5, delay: delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const Counter = ({ from, to, duration = 2, suffix = "" }: { from: number, to: number, duration?: number, suffix?: string }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true });
  
  useEffect(() => {
    if (!inView) return;
    
    const node = nodeRef.current;
    const controls = {
      value: from,
      stop: false
    };
    
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      if (controls.stop) return;
      
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quart
      const ease = 1 - Math.pow(1 - progress, 4);
      
      const current = Math.floor(from + (to - from) * ease);
      
      if (node) {
        node.textContent = current.toLocaleString() + suffix;
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
    
    return () => { controls.stop = true; };
  }, [from, to, duration, inView, suffix]);

  return <span ref={nodeRef} className="tabular-nums">{from}{suffix}</span>;
};

// --- Components ---

// Same living background as book.geauxmab.com: the seal stays upright and only drifts and breathes,
// with two soft glows. Pages with their own solid background sit on top of it.
const LivingBackground = () => {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 140]);
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <motion.div style={{ y: bgY }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:left-[62%] w-[150vw] max-w-[1100px] md:w-[78vw] aspect-square">
        <motion.div className="w-full h-full"
          animate={{ scale: [1, 1.06, 1], x: [0, 18, 0], y: [0, -14, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}>
          <img src="/img/pbs-seal-watermark.webp" alt="" width={900} height={900} decoding="async"
            className="w-full h-full select-none opacity-30" />
        </motion.div>
      </motion.div>
      <motion.div className="absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-white/10 blur-[100px]"
        animate={{ x: [0, -40, 0], y: [0, 30, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute -bottom-40 -left-32 w-[480px] h-[480px] rounded-full bg-white/[0.07] blur-[110px]"
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
    </div>
  );
};

const SubNav = ({ links }: { links: { label: string, id: string }[] }) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 136;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Section jump bar: sits under the app bar, outlined pills that fill white on hover
  return (
    <div className="sticky z-40 bg-royal-blue border-b border-white/10 py-2.5 px-4 overflow-x-auto shadow-[0_10px_24px_-14px_rgba(0,0,0,0.6)]"
      style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}>
      <div className="max-w-7xl mx-auto flex items-center gap-2 md:justify-center min-w-max">
        {links.map(link => (
          <button
            key={link.id}
            onClick={() => scrollTo(link.id)}
            className="px-4 py-2 rounded-full border border-white/25 bg-white/[0.06] text-[11px] md:text-xs font-bold tracking-wide text-white/90 hover:bg-white hover:text-royal-blue hover:border-white transition-colors"
          >
            {link.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- Pages ---

const QuoteCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const quotes = [
    "Grief does not go away. It just becomes the fuel you learn to run on when everything else runs out.",
    "I stopped trying to prove I belonged in the room the moment I realized my job was to build a better one.",
    "My faith does not make the path easier. It makes me harder to break when the path gets rough.",
    "Fitness taught me what no degree could. That consistency in the uncomfortable is the only real credential that transfers everywhere.",
    "Paying it forward is not generosity. It is accountability. Someone invested in me before I earned it, and I owe that debt to the next person in line."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [quotes.length]);

  return (
    <div className="relative h-32 md:h-24 w-full max-w-3xl mx-auto overflow-hidden flex items-center justify-center mb-6">
      <AnimatePresence mode="wait">
        <motion.h2
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          className="text-lg md:text-xl font-bold italic leading-relaxed absolute w-full"
        >
          "{quotes[currentIndex]}"
        </motion.h2>
      </AnimatePresence>
    </div>
  );
};

// Portrait carousel, framed like the booking app's photo: white border, rounded, gentle tilt-free shine
const PhotoCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = [
    "https://lh3.googleusercontent.com/d/1Y4Xo-KtdunIotExKgifHwpCiwPe0-L8Z",
    "https://lh3.googleusercontent.com/d/1FNA4TdQp7d3gw7Hyp-HBzfKLGWup4YdD"
  ];

  const captions = [
    "From curious...",
    "...to capable."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-[min(15rem,32svh)] sm:max-w-xs md:max-w-sm mx-auto">
      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-[32px] shadow-2xl border-8 border-white bg-white mb-4">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt="Jack Dee"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full object-contain bg-white"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
        <motion.div aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent pointer-events-none"
          initial={{ x: '-120%' }} animate={{ x: '120%' }}
          transition={{ duration: 2.2, delay: 3.2, repeat: Infinity, repeatDelay: 6 }} />
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`tap-target h-2 rounded-full transition-all shadow-sm ${idx === currentIndex ? 'bg-royal-blue w-6' : 'bg-royal-blue/30 w-2'}`}
            />
          ))}
        </div>
      </div>
      <div className="h-7 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-center text-[#c8c9c7] font-bold text-sm tracking-wide"
          >
            {captions[currentIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
};

const AcademicCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = [
    "https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Z3JhZHVhdGlvbnxlbnwwfHwwfHx8Mg%3D%3D",
    "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZWR1Y2F0aW9ufGVufDB8fDB8fHwy",
    "https://images.unsplash.com/photo-1557754897-ca12c5049d83?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fHN0dWR5aW5nfGVufDB8fDB8fHwy",
    "https://images.unsplash.com/photo-1585776245865-b92df54c6b25?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8YWNoaWV2ZW1lbnR8ZW58MHx8MHx8fDI%3D"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[240px] sm:h-[300px] md:h-[400px] overflow-hidden rounded-[28px] border border-white/15 shadow-2xl mt-10">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all shadow-sm ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/50 w-2'}`}
          />
        ))}
      </div>
    </div>
  );
};

/* ---------------- Shared building blocks (same as the booking app's panels) ---------------- */
// Dark blue card with the white hairline glow along the top edge
const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative rounded-[28px] bg-[#113b6c] border border-white/15 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] overflow-hidden ${className}`}>
    <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    {children}
  </div>
);

// Small label with a line on each side, like the booking app's "To Quick Book" divider
const SectionLabel = ({ children, align = 'center' }: { children: React.ReactNode; align?: 'center' | 'left' }) => (
  <div className={`flex items-center gap-3 ${align === 'center' ? 'justify-center' : 'justify-center md:justify-start'}`}>
    <span aria-hidden="true" className="h-px w-9 bg-white/40" />
    <span className="text-[11px] sm:text-xs font-bold tracking-wide text-[#c8c9c7] whitespace-nowrap">{children}</span>
    <span aria-hidden="true" className="h-px w-9 bg-white/40" />
  </div>
);

const SectionTitle = ({ label, title, sub }: { label: string; title: string; sub?: string }) => (
  <FadeIn className="text-center mb-8 md:mb-10">
    <SectionLabel>{label}</SectionLabel>
    <h2 className="mt-3 text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">{title}</h2>
    {sub && <p className="mt-3 text-sm md:text-base text-white/80 max-w-2xl mx-auto">{sub}</p>}
  </FadeIn>
);

/* ---------------- My other sites ---------------- */
const MY_SITES = [
  { name: 'MrJackDee.com', href: 'https://www.mrjackdee.com/', tag: 'Personal & Professional', Icon: Globe,
    text: 'My professional home: career highlights, portfolio, résumé and the work behind twenty-plus years of enterprise transformation.' },
  { name: 'BeVISIBLE.work', href: 'https://bevisible.work/', tag: 'Doctoral Research', Icon: GraduationCap,
    text: 'The BeVISIBLE™ Alliance Model, my applied doctoral research on advancing Black senior leadership in the technology industry.' },
  { name: 'DonOra Global', href: 'https://www.donoraglobal.com/', tag: 'Business', Icon: Building2,
    text: 'Strategic advisory for the AI era: enterprise transformation, AI governance and digital presence strategy for organizations ready to lead.' },
];

const MySites = ({ title = 'Explore My Sites' }: { title?: string }) => (
  <section className="py-12 md:py-16 px-4 sm:px-6">
    <div className="max-w-7xl mx-auto">
      <SectionTitle label="Beyond GeauxMAB.com" title={title} sub="Each site tells a different part of the story: the professional, the scholar and the entrepreneur." />
      <div className="grid gap-4 md:grid-cols-3">
        {MY_SITES.map(({ name, href, tag, Icon, text }, i) => (
          <FadeIn key={name} delay={i * 0.1}>
            <a href={href} target="_blank" rel="noopener noreferrer" className="group block h-full">
              <Panel className="h-full p-6 flex flex-col transition-colors group-hover:border-white/50">
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 shrink-0 rounded-2xl bg-white text-royal-blue flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                    <Icon size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold tracking-wide text-[#c8c9c7]">{tag}</span>
                    <span className="block text-xl font-bold text-white">{name}</span>
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/85">{text}</p>
                <span className="mt-auto pt-5 inline-flex items-center gap-2 text-xs font-bold tracking-wide text-white">
                  Visit {name} <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Panel>
            </a>
          </FadeIn>
        ))}
      </div>
    </div>
  </section>
);

/* ---------------- Follow along (social) ---------------- */
const XMark = ({ size = 22 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const FOLLOW = [
  { name: 'Instagram', handle: '@the.jackdee', href: 'https://www.instagram.com/the.jackdee', Icon: Instagram, note: 'Life in motion: fitness, style and travel' },
  { name: 'Facebook', handle: 'GeauxMAB', href: 'https://www.facebook.com/geauxmab', Icon: Facebook, note: 'Brotherhood, community and family' },
  { name: 'X', handle: '@MrKreducator', href: 'https://x.com/MrKreducator', Icon: XMark, note: 'Quick takes and deal hunting' },
  { name: 'LinkedIn', handle: 'in/mrjackdee', href: 'https://www.linkedin.com/in/mrjackdee/', Icon: Linkedin, note: 'Leadership, strategy and AI' },
];

const FollowAlong = () => (
  <section className="py-12 md:py-16 px-4 sm:px-6">
    <div className="max-w-7xl mx-auto">
      <SectionTitle label="Social" title="Follow Along" sub="Different platforms, same man in motion. Pick where you want to connect." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {FOLLOW.map(({ name, handle, href, Icon, note }, i) => (
          <FadeIn key={name} delay={i * 0.08}>
            <a href={href} target="_blank" rel="noopener noreferrer" className="group block h-full">
              <Panel className="h-full p-4 sm:p-5 flex flex-col items-center text-center transition-colors group-hover:border-white/50">
                <span className="w-12 h-12 rounded-full bg-white/10 border border-white/25 text-white flex items-center justify-center transition-colors group-hover:bg-white group-hover:text-royal-blue">
                  <Icon size={22} />
                </span>
                <span className="mt-3 text-sm sm:text-base font-bold text-white">{name}</span>
                <span className="text-[11px] sm:text-xs font-bold tracking-wide text-[#c8c9c7] break-all">{handle}</span>
                <span className="mt-2 hidden sm:block text-xs text-white/75">{note}</span>
              </Panel>
            </a>
          </FadeIn>
        ))}
      </div>
    </div>
  </section>
);

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <motion.main
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col"
    >
      {/* Hero: photo first on phones (like the booking app), side by side on laptops */}
      <section className="relative pt-7 md:pt-16 pb-10 md:pb-16">
        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full grid md:grid-cols-2 gap-6 md:gap-12 items-center">
          <div className="text-center md:text-left order-2 md:order-1">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 border border-white/30 rounded-full mb-4"
            >
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
              <span className="text-[11px] font-bold text-white tracking-wide">Welcome to GeauxMAB.com</span>
            </motion.div>

            {/* Handwritten name, written in left to right like the opening screen */}
            <motion.h1
              initial={{ clipPath: 'inset(-30% 100% -30% 0)' }}
              animate={{ clipPath: 'inset(-30% 0% -30% 0)' }}
              transition={{ duration: 1.4, delay: 0.35, ease: [0.45, 0.05, 0.55, 0.95] }}
              className="signature-text whitespace-nowrap text-6xl sm:text-7xl md:text-8xl text-white leading-tight loading-text-shadow"
            >
              Jack Dee
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-base md:text-lg text-white/90 font-normal mt-2 mb-7 max-w-xl mx-auto md:mx-0"
            >
              Techie | Strategist | Life Student | Entrepreneur | SIGMA
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="flex flex-wrap justify-center md:justify-start gap-3"
            >
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/bio')}
                className="btn-pill btn-solid px-5 sm:px-7 py-3.5 rounded-full bg-white text-royal-blue font-bold tracking-wide text-[13px] sm:text-sm flex items-center gap-2">
                My Journey <ArrowRight size={16} />
              </motion.button>
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/leadership')}
                className="btn-pill btn-ghost px-5 sm:px-7 py-3.5 rounded-full bg-white/5 border border-white/60 text-white font-bold tracking-wide text-[13px] sm:text-sm hover:bg-white hover:text-royal-blue transition-all flex items-center gap-2">
                Who Am I? <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            className="order-1 md:order-2 w-full flex flex-col items-center"
          >
            <PhotoCarousel />
            <div className="mt-2">
              <SocialIcons variant="header" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pillars */}
      <section className="pb-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-4">
          {[
            {
              icon: <Briefcase size={24} />,
              title: "Leadership.",
              desc: "I drive innovation and digital transformation at the highest levels with strategy and innovation."
            },
            {
              icon: <Award size={24} />,
              title: "Excellence.",
              desc: "I am deeply committed to the Phi Beta Sigma Fraternity principles of brotherhood, scholarship, and service."
            },
            {
              icon: <Globe size={24} />,
              title: "Impact.",
              desc: "As a servant leader and lifelong learner, I believe in the importance of sharing knowledge and opportunities to improve the world."
            }
          ].map((card, idx) => (
            <FadeIn key={idx} delay={idx * 0.15}>
              <Panel className="h-full p-6 md:p-7 group">
                <div className="w-12 h-12 bg-white text-royal-blue flex items-center justify-center rounded-2xl mb-5 shadow-lg group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                <p className="text-white/85 leading-relaxed text-sm">{card.desc}</p>
              </Panel>
            </FadeIn>
          ))}
        </div>
      </section>

      <MySites />

      {/* Latest from The Journal */}
      <JournalLatest />

      <FollowAlong />

      {/* Quote Carousel */}
      <section className="py-12 text-white text-center px-6">
        <FadeIn className="max-w-4xl mx-auto">
          <div className="mb-2 opacity-50"><span className="text-5xl font-serif">"</span></div>
          <QuoteCarousel />
          <img
            src="https://lh3.googleusercontent.com/d/1ujWt304YSwhQIHht7yrT4GNP18dQJ-fY"
            alt="Jack Dee Signature"
            className="mx-auto mb-3 max-h-20 object-contain"
            referrerPolicy="no-referrer"
            width="200"
            height="80"
            loading="lazy"
          />
          <p className="text-sm font-bold tracking-wide">Jack Dee</p>
        </FadeIn>
      </section>

      {/* Both live feeds sit at the bottom of the home page */}
      <NewsFeed />
      <FollowingFeed />

      {/* Save to Home Screen sits just above the footer, like the booking app */}
      <section className="pb-10 flex justify-center">
        <InstallButton />
      </section>
    </motion.main>
  );
};

// Page heading in the booking app's style: small label with lines, big mixed-case title
const PageHero = ({ label, title, children }: { label: string; title: string; children?: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
    <SectionLabel>{label}</SectionLabel>
    <h1 className="mt-3 text-4xl sm:text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.05]">{title}</h1>
    {children}
  </motion.div>
);

// White tile that holds a logo or photo so it reads cleanly on the blue panels
const LogoTile = ({ src, alt, size = 'w-16 h-16' }: { src: string; alt: string; size?: string }) => (
  <div className={`${size} shrink-0 flex items-center justify-center p-1.5 bg-white rounded-2xl shadow-lg`}>
    <img src={src} alt={alt} className="w-full h-full object-contain" referrerPolicy="no-referrer" loading="lazy" />
  </div>
);

/* ============================== The Brotherhood ============================== */
const BioPage = () => {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <SubNav links={[
        { label: 'My Journey', id: 'journey' },
        { label: 'Timeline', id: 'timeline' },
        { label: 'Masonic', id: 'masonic' }
      ]} />

      {/* Header */}
      <header id="journey" className="relative pt-8 md:pt-14 pb-10 md:pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <PageHero label="The Brotherhood" title="My Journey." />
          <div className="mt-8 md:mt-12 grid md:grid-cols-2 gap-8 md:gap-12 items-start">
            <div className="flex flex-col items-center md:items-start gap-6">
              <blockquote className="border-l-4 border-white pl-4 text-white/90 italic font-serif text-lg md:text-xl leading-relaxed text-left">
                "Service is the responsibility that comes with taking up space in the world. We should aim to ensure space leaves people stronger, clearer, and better prepared to move forward on their own."
              </blockquote>

              <Panel className="w-full p-5 md:p-6">
                <div className="flex items-center justify-center gap-6 md:gap-10">
                  <div className="flex flex-col text-center">
                    <span className="text-[11px] font-bold tracking-wide text-[#c8c9c7] mb-1">Initiated</span>
                    <span className="block text-3xl md:text-4xl font-bold text-white">Fall 1998</span>
                  </div>
                  <div className="w-px bg-white/25 h-14" />
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[11px] font-bold tracking-wide text-[#c8c9c7] mb-1">Membership Status</span>
                    {/* Brand rule: gold only on official insignia, so the word is white beside the gold pin */}
                    <span className="flex items-center gap-2">
                      <picture className="shrink-0">
                        <source srcSet="/img/life-member.webp" type="image/webp" />
                        <img src="/img/life-member.png" alt="Phi Beta Sigma Life Member insignia" width={122} height={176} className="h-10 w-auto" />
                      </picture>
                      <span className="text-3xl md:text-4xl font-bold text-white">Gold</span>
                    </span>
                  </div>
                </div>
              </Panel>

              <div className="w-full flex flex-col items-center">
                <a href="https://phibetasigma1914.org/" target="_blank" rel="noopener noreferrer" className="inline-block" aria-label="Phi Beta Sigma Fraternity Website">
                  <img
                    src="https://lh3.googleusercontent.com/d/1ujWt304YSwhQIHht7yrT4GNP18dQJ-fY"
                    alt="Phi Beta Sigma Fraternity Shield"
                    className="h-40 md:h-48 object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)]"
                    referrerPolicy="no-referrer"
                    width="200"
                    height="192"
                    loading="lazy"
                  />
                </a>

                {/* Podcast */}
                <Panel className="mt-6 w-full p-5 text-center">
                  <h4 className="font-bold text-white text-sm leading-tight">The History of Phi Beta Sigma:<br />A Podcast Discussion</h4>
                  <a href="https://jumpshare.com/share/1nor4VeRITOkr6vXCJw1" target="_blank" rel="noopener noreferrer"
                    className="btn-pill btn-solid mt-4 inline-flex items-center gap-2 bg-white text-royal-blue px-7 py-3 rounded-full text-xs tracking-wide font-bold">
                    <Headphones size={15} /> Listen
                  </a>
                </Panel>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative w-full max-w-[280px] mx-auto"
            >
              <div className="aspect-[3/4] bg-white rounded-[32px] border-8 border-white overflow-hidden shadow-2xl relative z-10">
                <img
                  src="https://lh3.googleusercontent.com/d/1V3EMOWRsbopmMpif2quU70DvPPongmC7"
                  alt="Jack Dee Portrait"
                  className="w-full h-full object-cover rounded-[24px]"
                  referrerPolicy="no-referrer"
                  width="280"
                  height="373"
                  loading="lazy"
                />
              </div>
              <div className="mt-6 text-center relative z-20">
                <p className="font-bold text-white tracking-wide">Bro. Jack D. Givens</p>
                <p className="font-bold text-[#c8c9c7] tracking-wide text-sm mt-1">ZI-FA-98</p>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="px-4 sm:px-6 pb-10">
        <FadeIn className="max-w-6xl mx-auto">
          <Panel className="p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-white mb-1"><Counter from={0} to={25} suffix="+" /></div>
                <div className="text-[11px] tracking-wide text-[#c8c9c7]">Years in SIGMA</div>
                <motion.div initial={{ width: 0 }} whileInView={{ width: '100%' }} viewport={{ once: true }} transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="h-1 bg-white mt-2 rounded-full mx-auto" />
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">Zeta Iota</div>
                <div className="text-[11px] tracking-wide text-[#c8c9c7]">Initiated Chapter</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">Omicron Sigma</div>
                <div className="text-[11px] tracking-wide text-[#c8c9c7]">Current Chapter</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">"Wizard" #6</div>
                <div className="text-[11px] tracking-wide text-[#c8c9c7]">Line Name and Number</div>
              </div>
            </div>
          </Panel>
        </FadeIn>
      </section>

      {/* Timeline */}
      <section id="timeline" className="py-10 md:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <SectionTitle label="Since 1998" title="My SIGMA Timeline" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            {[
              {
                year: '1998-2001',
                title: 'Zeta Iota Chapter',
                type: 'Foundation',
                desc: 'Initiated in the Gulf Coast Region at Northwestern State University on November 12, 1998. During collegiate tenure, I served as Chapter President, Vice President, Senior Advisor and NPHC chair.',
                image: "https://lh3.googleusercontent.com/d/13PuzhCyH15LmbRKny2nOa3yaltCh-wB0",
                link: "https://www.pbsgulfcoastregion.org/",
                icon: <GraduationCap size={22} />
              },
              {
                year: '2006-Present',
                title: 'Omicron Sigma Chapter',
                type: 'Metriculation',
                desc: 'Over 20 years financially active with the Omicron Sigma Chapter of North Dallas. Most recently served as the Director of Membership Intake.\n\nBecame Gulf Coast Life Member #7 in 2006.',
                image: "https://lh3.googleusercontent.com/d/1BGPAm6l9eCXBP55m8QLEb0QtPacvf6g9",
                link: "https://omicronsigma.clubexpress.com/",
                icon: <Users size={22} />
              },
              {
                year: '2014',
                title: 'Life Member #2174',
                type: 'Life Member',
                desc: "On January 9, 2014, I officially attained Life Membership status, which is significant not only because it occurred during my fraternity's centennial year but also because it solidified my lifetime financial commitment.",
                image: "https://bluculturecollections.com/cdn/shop/products/64dOJ104_2048x.jpg?v=1466704947",
                icon: <Award size={22} />
              },
              {
                year: '2023',
                title: '25 Years in SIGMA',
                type: 'Milestone',
                desc: 'On November 12, 2023, I officially became a 25-year member and proudly celebrated the milestone by serving as the Membership Intake Chair for Omicron Sigma and initiating three new members.',
                image: "https://image2url.com/r2/default/images/1772120015033-f60ab1a1-6c4a-447c-bcd8-c21913b76e05.png",
                icon: <Clock size={22} />
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1} className="h-full">
                <Panel className="h-full p-5 flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 bg-white text-royal-blue flex items-center justify-center rounded-2xl shadow-lg">{item.icon}</span>
                    <span className="text-white font-bold text-lg">{item.year}</span>
                  </div>
                  <h4 className="mt-4 font-bold text-white">{item.title}</h4>
                  <p className="mt-2 text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{item.desc}</p>
                  <div className="mt-auto pt-5 flex flex-col">
                    {item.image && (
                      <div className="w-full flex justify-center items-center overflow-hidden h-36 rounded-2xl bg-white p-2 mb-4">
                        {item.link ? (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="w-full h-full flex justify-center items-center" aria-label={`Link to ${item.title}`}>
                            <img src={item.image} alt={item.title} className="w-full h-full object-contain" referrerPolicy="no-referrer" loading="lazy" width="300" height="160" />
                          </a>
                        ) : (
                          <img src={item.image} alt={item.title} className="w-full h-full object-contain" referrerPolicy="no-referrer" loading="lazy" width="300" height="160" />
                        )}
                      </div>
                    )}
                    <div className="flex justify-center">
                      {item.type === 'Life Member' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-royal-blue text-[11px] font-bold tracking-wide shadow-md">
                          <img src="/img/life-member.png" alt="" className="h-4 w-auto" /> {item.type}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full border border-white/30 text-white/85 text-[11px] font-bold tracking-wide">{item.type}</span>
                      )}
                    </div>
                  </div>
                </Panel>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Masonic */}
      <section id="masonic" className="py-10 md:py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <Panel className="p-6 md:p-12">
            <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              <FadeIn>
                <SectionLabel align="left">Brotherhood Beyond SIGMA</SectionLabel>
                <h2 className="mt-3 text-3xl md:text-4xl font-bold text-white text-center md:text-left">Masonic Affiliation</h2>
                <blockquote className="mt-6 text-lg md:text-xl font-bold text-white italic leading-snug border-l-4 border-white pl-5 py-1">
                  "Freemasonry chose me before I chose it. I just did not recognize it until I was ready, standing on the shoulders of a man of God who never needed a degree to understand dignity, service, and what it means to live with integrity"
                </blockquote>
                <div className="mt-8 grid gap-3">
                  <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 flex gap-4 items-center">
                    <span className="w-11 h-11 bg-white text-royal-blue rounded-2xl flex items-center justify-center shrink-0"><Users size={22} /></span>
                    <div>
                      <h5 className="font-bold text-white text-sm">Free and Accepted Mason (F&AM)</h5>
                      <p className="text-xs text-[#c8c9c7] mt-1 tracking-wide">Master Mason: November 17, 2000</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 flex gap-4 items-center">
                    <span className="w-11 h-11 bg-white text-royal-blue rounded-2xl flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 2L3 21" />
                        <path d="M12 2L21 21" />
                        <path d="M7 11L12 16L17 11" />
                        <circle cx="12" cy="2" r="1" />
                      </svg>
                    </span>
                    <div>
                      <h5 className="font-bold text-white text-sm">Current Affiliation: Silver Square #49</h5>
                      <p className="text-xs text-[#c8c9c7] mt-1 tracking-wide">District 9, Louisiana</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
              <FadeIn delay={0.2} className="flex flex-col items-center">
                <div className="w-full max-w-[260px] flex flex-col items-center gap-5">
                  <div className="w-full aspect-square rounded-[28px] bg-white p-5 shadow-xl">
                    <img src="https://image2url.com/r2/default/images/1772167739816-2dcaa4ec-2705-4500-9574-7f7005b4a02e.png" className="w-full h-full object-contain" alt="Masonic Logo" referrerPolicy="no-referrer" width="280" height="280" loading="lazy" />
                  </div>
                  <div className="w-full text-center rounded-2xl border border-white/20 bg-white/[0.06] p-4">
                    <h4 className="font-bold text-white">Brotherhood</h4>
                    <p className="text-[11px] tracking-wide text-[#c8c9c7]">Strength in Unity</p>
                  </div>
                </div>
              </FadeIn>
            </div>
          </Panel>
        </div>
      </section>
    </motion.main>
  );
}

/* ============================== The Scholarship ============================== */
// BeVISIBLE™ dimensions, worded as on bevisible.work
const BEVISIBLE = [
  { l: 'Be', t: 'Believing', d: 'Leadership identity, conviction, readiness, and agency grounded in credible evidence rather than empty confidence.' },
  { l: 'V', t: 'Voice', d: 'Strategic expression shaped by whether expertise is heard, credited, and acted upon.' },
  { l: 'I', t: 'Insight', d: 'Access to candid developmental truth, decision criteria, feedback, and what the next level actually requires.' },
  { l: 'S', t: 'Sponsorship', d: 'Advocacy, access, opportunity, and the active use of influence by people positioned to affect consequential decisions.' },
  { l: 'I', t: 'Intentionality', d: 'Deliberate choices about preparation, exposure, relationships, career direction, and accountable action.' },
  { l: 'B', t: 'Boldness', d: 'Strategic action taken with awareness of timing, context, risk, authority, and available protection.' },
  { l: 'L', t: 'Leverage', d: 'Converting relationships, reputation, access, demonstrated performance, and organizational authority into meaningful opportunity.' },
  { l: 'E', t: 'Endurance', d: 'Sustainable performance, recovery, community, and informed choice without treating inequitable conditions as an individual burden to absorb.' },
];

// Doctoral milestones, as tracked on bevisible.work
const MILESTONES: { label: string; state: 'done' | 'now' | 'next' }[] = [
  { label: 'Research Topic', state: 'done' },
  { label: 'Project Justification', state: 'done' },
  { label: 'Proposal', state: 'done' },
  { label: 'Proposal Defense', state: 'done' },
  { label: 'IRB Approved', state: 'done' },
  { label: 'Interviews', state: 'now' },
  { label: 'Analysis & Project', state: 'next' },
  { label: 'Final Defense', state: 'next' },
];

const DoctoralTracker = () => (
  <ol className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {MILESTONES.map((m, i) => (
      <motion.li key={m.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${m.state === 'done' ? 'border-white/25 bg-white/[0.08]' : m.state === 'now' ? 'border-emerald-300/70 bg-emerald-400/10 shadow-[0_0_18px_rgba(52,211,153,0.35)]' : 'border-white/15 bg-transparent'}`}>
        <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${m.state === 'done' ? 'bg-white text-royal-blue' : m.state === 'now' ? 'bg-emerald-400 text-royal-blue' : 'border border-white/30 text-white/60'}`}>
          {m.state === 'done' ? <Check size={15} strokeWidth={3} /> : i + 1}
        </span>
        <span className="min-w-0">
          <span className={`block text-sm font-bold ${m.state === 'next' ? 'text-white/60' : 'text-white'}`}>{m.label}</span>
          <span className="block text-[11px] text-[#c8c9c7]">{m.state === 'done' ? 'Complete' : m.state === 'now' ? 'Underway' : 'Ahead'}</span>
        </span>
      </motion.li>
    ))}
  </ol>
);

const LeadershipPage = () => {
  const [open, setOpen] = useState<string | null>('Believing');
  const active = BEVISIBLE.find((b) => b.t === open);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <SubNav links={[
        { label: 'Disciplines', id: 'disciplines' },
        { label: 'Doctorate', id: 'academic' },
        { label: 'Business', id: 'business' },
        { label: 'Education', id: 'education' }
      ]} />

      <section className="pt-8 md:pt-14 pb-6 px-4 sm:px-6 max-w-5xl mx-auto">
        <PageHero label="The Scholarship" title="Architecting the Future With Strategy." />
      </section>

      {/* Professional disciplines */}
      <section id="disciplines" className="py-10 max-w-7xl mx-auto px-4 sm:px-6">
        <SectionTitle label="Professional Disciplines" title="How I Lead" />
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: <Globe size={22} />,
              title: "Enterprise Transformation & Operating Governance",
              subtitle: "Strategy, Execution, and Organizational Clarity",
              text: "Big ideas fail without structure behind them. My focus is on building operating models, decision habits, and ownership frameworks that turn strategy into real, sustained execution. When teams know what they own and why it matters, results follow."
            },
            {
              icon: <Activity size={22} />,
              title: "Intelligent & AI-Enabled Execution",
              subtitle: "Digital Infrastructure, Systems, and Responsible Adoption",
              text: "Speed matters. So does judgment. My approach centers on helping organizations adopt AI the right way, reduce complexity, improve decision quality, and keep humans accountable for outcomes. Better tools should make the work cleaner, not just faster."
            },
            {
              icon: <TrendingUp size={22} />,
              title: "Governance, Risk & Servant Leadership",
              subtitle: "Decision Frameworks, Compliance, and People-First Performance",
              text: "In high-stakes environments, clarity and trust are not soft skills. My foundation is building guardrails that allow teams to move with confidence, manage risk without paralysis, and perform at their best because expectations are clear and leadership is present."
            }
          ].map((item, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <Panel className="h-full p-6 md:p-7 group">
                <div className="w-12 h-12 bg-white text-royal-blue flex items-center justify-center rounded-2xl mb-5 shadow-lg group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">{item.title}</h3>
                <p className="text-[11px] font-bold text-[#c8c9c7] tracking-wide mb-4">{item.subtitle}</p>
                <p className="text-sm text-white/85 leading-relaxed">{item.text}</p>
              </Panel>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Digital platforms */}
      <section className="py-4 max-w-7xl mx-auto px-4 sm:px-6">
        <FadeIn className="flex flex-wrap justify-center items-center gap-3">
          {[
            { href: 'https://www.MrJackDee.com/', label: 'Professional Digital Page' },
            { href: 'https://www.donoraglobal.com/', label: 'DonOra Global' },
            { href: 'https://bevisible.work/', label: 'BeVISIBLE.work' },
            { href: 'https://curious2capable.netlify.app/#/', label: 'Curious 2 Capable: AI Series' },
          ].map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
              className="btn-pill btn-solid inline-flex items-center gap-2 px-5 py-3 bg-white text-royal-blue rounded-full text-xs font-bold tracking-wide">
              {l.label} <ArrowUpRight size={14} />
            </a>
          ))}
        </FadeIn>
      </section>

      {/* Doctorate */}
      <section id="academic" className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <SectionTitle label="Academic Focus" title="Advancing Black Leadership in Technology" />

        <div className="grid lg:grid-cols-2 gap-6 md:gap-10 items-start">
          <FadeIn>
            <Panel className="p-4">
              <div className="relative overflow-hidden rounded-[22px]">
                <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop" alt="Research Papers and Glasses" className="w-full aspect-[4/3] object-cover" width="800" height="533" loading="lazy" />
                <div className="absolute left-3 top-3"><LogoTile src="https://lh3.googleusercontent.com/d/1LlTcEdkVnhW4j68ysp3rUpWWG9vJwKeL" alt="Academic Focus Logo" size="w-20 h-20" /></div>
              </div>
              <div className="mt-4 rounded-2xl bg-white p-5 text-left">
                <p className="text-[11px] font-bold text-royal-blue tracking-wide mb-1">William Howard Taft University</p>
                <p className="text-sm font-serif italic text-royal-blue">"Developing a Strategic Advisory Framework to Advance Black Senior Leadership in the Technology Industry: The BeVISIBLE Alliance Model"</p>
              </div>
            </Panel>
          </FadeIn>

          <FadeIn delay={0.15} className="space-y-5 text-center lg:text-left">
            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              <span className="inline-block px-4 py-1.5 rounded-full border border-white/60 text-white text-[11px] font-bold tracking-wide">Doctor of Business Administration Candidate</span>
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-400/15 border border-emerald-300/60 text-emerald-100 text-[11px] font-bold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" /> Proposal Defense Complete · IRB Approved
              </span>
            </div>
            <div className="text-white/85 leading-relaxed space-y-4 text-sm md:text-base text-left">
              <p>
                In the technology sector, high-performing Black professionals routinely advance through mid-level leadership only to stall at the threshold of senior and executive opportunity. The gap is rarely about performance. It is about sponsorship, strategic visibility, and the institutional support structures that determine who gets elevated and who gets passed over.
              </p>
              <p>
                My applied doctoral research examines this structural reality directly -- investigating why demonstrated competence and progressive experience are necessary but insufficient conditions for sustained advancement, and what organizations and leaders must do differently to close that gap.
              </p>
              <p>
                This research produces the BeVISIBLE™ Alliance Model, an applied leadership framework I have curated to help Black technology leaders translate visibility into influence, build meaningful sponsorship relationships, and develop the institutional capital required for executive-level advancement.
              </p>
            </div>
          </FadeIn>
        </div>

        {/* Where the research stands */}
        <FadeIn className="mt-10">
          <Panel className="p-6 md:p-8">
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div>
                <p className="text-[11px] font-bold tracking-wide text-[#c8c9c7]">The Question</p>
                <p className="mt-1 text-lg font-bold text-white">How does a leadership record become recognized?</p>
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-wide text-[#c8c9c7]">The Method</p>
                <p className="mt-1 text-sm text-white/85 leading-relaxed">Semi-structured interviews with up to 15 Black leaders who hold, or held within the last five years, Director-level or higher technology roles in the United States, analyzed through reflexive thematic analysis.</p>
              </div>
              <div>
                <p className="text-[11px] font-bold tracking-wide text-[#c8c9c7]">The Context</p>
                <p className="mt-1 text-sm text-white/85 leading-relaxed">In 2022 high-tech data, Black employees held 7.6% of sector jobs, 4% of first- and mid-level manager positions, and 3% of executive and senior positions (EEOC).</p>
              </div>
            </div>
            <div className="mt-8">
              <p className="text-[11px] font-bold tracking-wide text-[#c8c9c7] text-center md:text-left">Doctoral Journey</p>
              <DoctoralTracker />
            </div>
          </Panel>
        </FadeIn>

        {/* BeVISIBLE model: tap a letter to read the dimension */}
        <FadeIn className="mt-10">
          <Panel className="p-6 md:p-8">
            <div className="text-center">
              <p className="text-white font-bold text-lg md:text-xl">The BeVISIBLE™ Alliance Model</p>
              <p className="mt-1 text-xs text-[#c8c9c7]">Tap a letter to explore each dimension</p>
            </div>
            <div className="mt-6 grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4 justify-items-center">
              {BEVISIBLE.map((item) => {
                const on = open === item.t;
                return (
                  <button key={item.t} onClick={() => setOpen(item.t)} aria-pressed={on}
                    className="flex flex-col items-center gap-2 text-center">
                    <span className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center font-bold text-xl md:text-2xl transition-colors ${on ? 'bg-white text-royal-blue border-white shadow-[0_0_20px_rgba(255,255,255,0.5)]' : 'border-white/40 text-white bg-white/[0.06]'}`}>
                      {item.l}
                    </span>
                    <span className={`text-[11px] font-bold tracking-wide ${on ? 'text-white' : 'text-[#c8c9c7]'}`}>{item.t}</span>
                  </button>
                );
              })}
            </div>
            <AnimatePresence mode="wait">
              {active && (
                <motion.p key={active.t} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="mt-6 mx-auto max-w-2xl rounded-2xl bg-white text-royal-blue p-5 text-sm md:text-base leading-relaxed text-center">
                  <b>{active.t}.</b> {active.d}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="mt-8 grid sm:grid-cols-3 gap-3">
              {[
                { n: '1', t: 'The Leader', d: 'Agency and preparation' },
                { n: '2', t: 'The Alliance', d: 'Advocacy and access' },
                { n: '3', t: 'The Organization', d: 'Opportunity and authority' },
              ].map((x) => (
                <div key={x.t} className="rounded-2xl border border-white/15 bg-white/[0.06] p-4 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-white text-royal-blue font-bold flex items-center justify-center shrink-0">{x.n}</span>
                  <span><span className="block font-bold text-white text-sm">{x.t}</span><span className="block text-xs text-[#c8c9c7]">{x.d}</span></span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-sm font-bold text-white">Mentorship advises. Sponsorship acts.</p>
            <p className="mt-2 text-center text-[11px] text-[#c8c9c7] max-w-2xl mx-auto">The framework is not presented as empirically validated, and no participant data or unpublished findings are shared here.</p>
            <div className="mt-6 flex justify-center">
              <a href="https://bevisible.work/" target="_blank" rel="noopener noreferrer"
                className="btn-pill btn-solid inline-flex items-center gap-2 px-7 py-3.5 bg-white text-royal-blue rounded-full text-sm font-bold tracking-wide">
                Explore BeVISIBLE.work <ArrowUpRight size={16} />
              </a>
            </div>
          </Panel>
        </FadeIn>

        <FadeIn delay={0.2}>
          <AcademicCarousel />
        </FadeIn>
      </section>

      {/* Business */}
      <section id="business" className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <SectionTitle label="Business" title="DonOra Global" sub="Strategic advisory for the AI era: enterprise transformation, AI governance, and digital presence strategy for organizations ready to lead." />
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-4">
          <FadeIn>
            <Panel className="h-full p-6 md:p-8">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-2xl bg-white text-royal-blue flex items-center justify-center shadow-lg"><Building2 size={22} /></span>
                <span>
                  <span className="block text-xl font-bold text-white">Founder & Chief Strategist</span>
                  <span className="block text-xs text-[#c8c9c7]">DonOra Global LLC · Dallas, Texas</span>
                </span>
              </div>
              <p className="mt-5 text-white/85 leading-relaxed text-sm md:text-base">
                Advancement is not accidental. DonOra Global helps organizations connect strategy, power, and execution, so transformation lands, AI is adopted responsibly, and leaders show up with authority.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {['AI Strategy & Governance', 'Organizational Transformation', 'Growth Infrastructure & Systems', 'Strategic Market Positioning', 'Digital Presence Architecture', 'Executive Authority & Leadership'].map((t) => (
                  <span key={t} className="px-3 py-1.5 rounded-full border border-white/25 bg-white/[0.06] text-[11px] font-bold tracking-wide text-white/90">{t}</span>
                ))}
              </div>
              <a href="https://www.donoraglobal.com/" target="_blank" rel="noopener noreferrer"
                className="btn-pill btn-solid mt-6 inline-flex items-center gap-2 px-7 py-3.5 bg-white text-royal-blue rounded-full text-sm font-bold tracking-wide">
                Visit DonOra Global <ArrowUpRight size={16} />
              </a>
            </Panel>
          </FadeIn>
          <FadeIn delay={0.15}>
            <Panel className="h-full p-6 md:p-8">
              <p className="text-[11px] font-bold tracking-wide text-[#c8c9c7]">Career Highlights</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { n: '$300M+', t: 'Technology programs led' },
                  { n: '600+', t: 'Implementations moved to AWS' },
                  { n: '17,000+', t: 'Hours saved' },
                  { n: '$12.3M', t: 'Annual cost reduction' },
                ].map((s) => (
                  <div key={s.t} className="rounded-2xl bg-white/[0.08] border border-white/15 p-4 text-center">
                    <p className="text-2xl md:text-3xl font-bold text-white">{s.n}</p>
                    <p className="mt-1 text-[11px] text-[#c8c9c7] leading-snug">{s.t}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-5 space-y-2 text-sm text-white/85">
                <li className="flex justify-between gap-3"><span className="font-bold text-white">JLL</span><span className="text-right">Director, Technology Program Management</span></li>
                <li className="flex justify-between gap-3"><span className="font-bold text-white">HCL Technologies</span><span className="text-right">2019–2021</span></li>
                <li className="flex justify-between gap-3"><span className="font-bold text-white">DXC Technology</span><span className="text-right">2016–2019</span></li>
                <li className="flex justify-between gap-3"><span className="font-bold text-white">Bank of America</span><span className="text-right">Analyst to Vice President</span></li>
              </ul>
              <a href="https://www.MrJackDee.com/" target="_blank" rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-white underline underline-offset-4">
                Full résumé on MrJackDee.com <ArrowUpRight size={13} />
              </a>
            </Panel>
          </FadeIn>
        </div>
      </section>

      {/* Education and industry credentials */}
      <section id="education" className="py-12 md:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <SectionTitle label="Credentials" title="Education & Certifications" />
          <div className="grid md:grid-cols-2 gap-8">
            <FadeIn delay={0.1}>
              <h3 className="text-xs font-bold tracking-wide text-[#c8c9c7] mb-4 text-center md:text-left">Education</h3>
              <div className="space-y-4">
                {[
                  { logo: 'https://lh3.googleusercontent.com/d/1ELDMVAuy5eBx7QZk8x_jiZVo7rJAIlUK', alt: 'William Howard Taft University Logo', name: 'William Howard Taft University', href: 'http://www.taft.edu', place: 'Deming School of Business · Denver, Colorado',
                    lines: ['In Progress [Confirmed 2026]: Doctor of Business Administration, Organizational Strategy Concentration', 'ADRP: "Developing a Strategic Advisory Framework to Advance Black Senior Leadership in the Technology Industry: The BeVISIBLE Alliance Model"'] },
                  { logo: 'https://lh3.googleusercontent.com/d/12KggcKuWZV2P40deLWdvEXhkMagH4D6A', alt: 'Northwestern State University Logo', name: 'Northwestern State University', href: 'http://www.nsula.edu/', place: 'Natchitoches, LA',
                    lines: ['M.Ed., Educational Technology Leadership', 'Ed.S., Educational Leadership and Instruction', 'B.Sc., Computer Information Systems', 'B.Sc., Business Administration'] },
                  { logo: 'https://lh3.googleusercontent.com/d/16IyhlNnxV-GeY53BbgTooJ0tavKMUOHX', alt: 'Louisiana State University Logo', name: 'Louisiana State University', href: 'http://www.lsus.edu', place: 'Shreveport, LA',
                    lines: ['MBA, Project Management'] },
                ].map((e) => (
                  <Panel key={e.name} className="p-5 flex items-start gap-4">
                    <LogoTile src={e.logo} alt={e.alt} />
                    <div className="min-w-0 text-left">
                      <a href={e.href} target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-white leading-tight hover:underline block">{e.name}</a>
                      <p className="text-xs font-bold text-[#c8c9c7] tracking-wide mb-2">{e.place}</p>
                      <div className="text-sm text-white/85 space-y-1">{e.lines.map((l) => <p key={l}>{l}</p>)}</div>
                    </div>
                  </Panel>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.25}>
              <h3 className="text-xs font-bold tracking-wide text-[#c8c9c7] mb-4 text-center md:text-left">Industry Certifications</h3>
              <div className="grid gap-4">
                {[
                  { logo: 'https://lh3.googleusercontent.com/d/1xXOFjtkLrGqVmimq3h5-eIt8TmSqkmSl', alt: 'Project Management Professional Logo', name: 'Project Management Professional (PMP®)', by: 'Project Management Institute · PMP #3993606' },
                  { logo: 'https://lh3.googleusercontent.com/d/1OD7CqiAEqIxWw-8Jd9-h_BdElBP7tRQq', alt: 'Lean Six Sigma Black Belt Logo', name: 'Lean Six Sigma Black Belt', by: 'Council for Six Sigma Certification' },
                  { logo: 'https://lh3.googleusercontent.com/d/1ACOeqyyrqEtcTKC9ICXp9w5UfrFjUsYo', alt: 'SAFe 6 Product Owner Logo', name: 'SaFE 6® Product Owner / Product Manager', by: 'Scaled Agile, Inc.' },
                  { logo: 'https://lh3.googleusercontent.com/d/1ACOeqyyrqEtcTKC9ICXp9w5UfrFjUsYo', alt: 'SAFe 6 Lean Portfolio Manager Logo', name: 'SaFE 6® Lean Portfolio Manager', by: 'Scaled Agile, Inc.' },
                  { logo: 'https://lh3.googleusercontent.com/d/1otH78TM9tuDtUb_Cy4ILn14P0I_lma_7', alt: 'University of South Florida Logo', name: 'Diversity, Equity & Inclusion in the Workplace', by: 'University of South Florida' },
                ].map((c) => (
                  <Panel key={c.name} className="p-4 flex items-center gap-4">
                    <LogoTile src={c.logo} alt={c.alt} size="w-14 h-14" />
                    <div className="text-left">
                      <h4 className="font-bold text-white leading-tight">{c.name}</h4>
                      <p className="text-xs text-[#c8c9c7] mt-1">{c.by}</p>
                    </div>
                  </Panel>
                ))}
                <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-1">
                  {['CSPO® · Scrum Alliance', 'Google Project Management', 'Google Generative AI Leader', 'Anthropic AI Fluency'].map((t) => (
                    <span key={t} className="px-3 py-1.5 rounded-full border border-white/25 bg-white/[0.06] text-[11px] font-bold tracking-wide text-white/90">{t}</span>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </motion.main>
  );
}

/* ============================== The Service ============================== */
const LifeStylePage = () => {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <SubNav links={[
        { label: 'Perspective', id: 'perspective' },
        { label: 'Wellness', id: 'wellness' },
        { label: 'Style', id: 'style' },
        { label: 'Community', id: 'community' }
      ]} />

      <section id="perspective" className="pt-8 md:pt-14 pb-10 px-4 sm:px-6 max-w-5xl mx-auto">
        <PageHero label="The Service" title="Balance and Perspective." />
        <div className="mt-8 flex flex-col gap-5 w-full max-w-3xl mx-auto text-left">
          <FadeIn>
            <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight leading-tight">
              At this stage of my life, balance feels earned.
            </h2>
          </FadeIn>
          <FadeIn delay={0.15}>
            <h3 className="text-base md:text-xl text-white/80 font-medium leading-relaxed">
              It lives somewhere between discipline and joy, between taking care of myself and still having fun.
            </h3>
          </FadeIn>
          <FadeIn delay={0.3}>
            <blockquote className="text-lg md:text-2xl text-white font-bold tracking-tight border-l-4 border-white pl-5 py-1">
              These are the things that keep me grounded and remind me who I have always been.
            </blockquote>
          </FadeIn>
        </div>
      </section>

      {/* Wellness: strength, yoga, meditation and therapy */}
      <section id="wellness" className="px-4 sm:px-6 pb-12 max-w-7xl mx-auto">
        <SectionTitle label="Wellness" title="Strength, Stillness, and Taking Care of My Mind" />
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-4">
          <FadeIn>
            <Panel className="h-full flex flex-col">
              <img src="https://lh3.googleusercontent.com/d/1ba5_nMDhov_ehq6YvM_-MRPzXGEfO8K4" alt="Man lifting weights in gym" className="w-full h-72 lg:h-80 object-cover object-top" referrerPolicy="no-referrer" width="600" height="400" loading="lazy" />
              <div className="p-6 flex-1 flex flex-col">
                <span className="self-start px-3 py-1 rounded-full bg-white text-royal-blue text-[11px] font-bold tracking-wide">Wellness</span>
                <p className="mt-4 text-white/85 text-sm leading-relaxed">
                  Weight training keeps me connected to my body and reminds me of what I am capable of. Meditation slows things down and gives me space to breathe. Therapy keeps my mental health strong and my perspective honest. None of this feels trendy to me. It feels necessary. Taking care of my body and mind is how I stay steady, present, and fully myself.
                </p>
                <div className="flex gap-3 text-white mt-auto pt-5">
                  <Activity size={20} />
                  <Heart size={20} />
                </div>
              </div>
            </Panel>
          </FadeIn>
          <div className="grid gap-4">
            {/* DRAFT copy for Jack's review: yoga and meditation, written in his voice */}
            <FadeIn delay={0.1}>
              <Panel className="p-6">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-2xl bg-white text-royal-blue flex items-center justify-center shadow-lg"><Flower2 size={20} /></span>
                  <h3 className="text-xl font-bold text-white">Yoga</h3>
                </div>
                <p className="mt-4 text-white/85 text-sm leading-relaxed">
                  Yoga is where strength meets patience. The mat does not care about titles or deadlines. It asks for breath, balance, and honesty about where my body is today. Some days that means a demanding flow. Other days it means a long hold and gratitude. Either way, I roll up the mat steadier than I rolled it out.
                </p>
              </Panel>
            </FadeIn>
            <FadeIn delay={0.2}>
              <Panel className="p-6">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-2xl bg-white text-royal-blue flex items-center justify-center shadow-lg"><Sparkles size={20} /></span>
                  <h3 className="text-xl font-bold text-white">Meditation</h3>
                </div>
                <p className="mt-4 text-white/85 text-sm leading-relaxed">
                  Meditation is how I clear the noise. A few quiet minutes before the day starts give me room to think before the world starts asking for answers. It sharpens my focus, softens my reactions, and keeps me anchored to what actually matters.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Breathe first', 'Respond, do not react', 'Rest is part of the work'].map((t) => (
                    <span key={t} className="px-3 py-1.5 rounded-full border border-white/25 bg-white/[0.06] text-[11px] font-bold tracking-wide text-white/90">{t}</span>
                  ))}
                </div>
              </Panel>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Style: Air Jordans and the hunt */}
      <section id="style" className="px-4 sm:px-6 pb-12 max-w-7xl mx-auto">
        <SectionTitle label="Style" title="Sneakers and the Joy of the Hunt" />
        <FadeIn>
          <Panel className="grid md:grid-cols-2">
            <div className="h-64 md:h-auto relative">
              <img src="https://lh3.googleusercontent.com/d/19I2Izijp1jMdeVZgewWrnqxCDylxasxP" alt="Air Jordan 1 Royal Blue Sneakers" className="w-full h-full object-cover object-center" referrerPolicy="no-referrer" width="600" height="400" loading="lazy" />
            </div>
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <span className="self-start px-3 py-1 rounded-full bg-white text-royal-blue text-[11px] font-bold tracking-wide">Nike Air Jordans</span>
              <p className="mt-4 text-white/85 text-sm leading-relaxed">
                I am a sneakerhead, always have been. Air Jordans, especially the classics, take me back. They remind me of growing up, paying attention to details, and understanding how style carries memory. I love a clean pair that just works.
              </p>
              {/* DRAFT copy for Jack's review */}
              <p className="mt-4 text-white/85 text-sm leading-relaxed">
                My collection is not about hype. Every pair carries a memory: the retros I wanted long before I could buy them, the colorways that defined a season, and anything in royal blue. I wear them, I take care of them, and I still get excited on release day.
              </p>
              <p className="mt-4 text-white/85 text-sm leading-relaxed">
                I also love the hunt. Thrift shopping, tracking down the right piece, finding the best deal, or catching a promo code before it disappears. Scrolling deal threads and following deal accounts is part nostalgia, part strategy, and part pure fun.
              </p>
              <p className="mt-4 text-white/70 text-xs italic border-l-2 border-white pl-3 flex items-center gap-1 flex-wrap">
                I keep an eye on deal feeds like
                <a href="https://x.com/FatKidDeals" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-white font-bold hover:underline">
                  @fatkiddeals <Twitter size={12} fill="currentColor" />
                </a>
                and treat bargain-hunting like a sport.
              </p>
            </div>
          </Panel>
        </FadeIn>

        {/* Travel */}
        <FadeIn delay={0.1} className="mt-4">
          <Panel>
            <div className="h-44 md:h-56 relative">
              <img src="https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=2831&auto=format&fit=crop" alt="Airplane flying over ocean" className="w-full h-full object-cover" width="800" height="400" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#113b6c] to-transparent" />
              <span className="absolute top-4 left-4 bg-white text-royal-blue px-3 py-1 text-[11px] font-bold tracking-wide rounded-full shadow-sm">Perspective</span>
            </div>
            <div className="p-6 md:p-8">
              <h3 className="text-2xl font-bold text-white mb-3">Travel</h3>
              <p className="text-white/85 text-sm leading-relaxed">
                Travel reminds me that the world is bigger than any room I have ever walked into. New places reset my thinking, sharpen my perspective, and feed my curiosity.
              </p>
            </div>
          </Panel>
        </FadeIn>
      </section>

      {/* Community and service */}
      <section id="community" className="px-4 sm:px-6 pb-14 max-w-7xl mx-auto">
        <SectionTitle label="Service" title="In the Community" sub="Brotherhood, scholarship, and service are not just principles I joined. They are how I show up." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { Icon: Users, t: 'Membership Intake', d: 'Served as Director of Membership Intake for Omicron Sigma, initiating three new members in my 25th year as a Sigma.' },
            { Icon: Handshake, t: 'Workplace Inclusion', d: 'Sponsored community strategic team initiatives focused on employee inclusion, engagement, and workforce effectiveness across a 150+ person organization.' },
            { Icon: Building2, t: 'Nonprofit Technology', d: 'Modernized a member organization through practical digital infrastructure: member, voting, and support workflows.' },
            { Icon: GraduationCap, t: 'Paying It Forward', d: 'Someone invested in me before I earned it. Mentoring, sharing knowledge, and opening doors is how I pay that forward.' },
          ].map(({ Icon, t, d }, i) => (
            <FadeIn key={t} delay={i * 0.08}>
              <Panel className="h-full p-6">
                <span className="w-11 h-11 rounded-2xl bg-white text-royal-blue flex items-center justify-center shadow-lg"><Icon size={20} /></span>
                <h3 className="mt-4 font-bold text-white">{t}</h3>
                <p className="mt-2 text-sm text-white/80 leading-relaxed">{d}</p>
              </Panel>
            </FadeIn>
          ))}
        </div>
      </section>
    </motion.main>
  );
}

/* ============================== Legal ============================== */
const LegalPage = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-3 sm:px-6 pt-6 md:pt-12 pb-12">
    <div className="max-w-4xl mx-auto">
      <Panel className="p-6 sm:p-8 md:p-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
        <p className="text-xs text-[#c8c9c7] mb-8">Last Updated: April 2026</p>
        <div className="legal-body text-white/85 leading-relaxed text-sm md:text-base">{children}</div>
      </Panel>
    </div>
  </motion.main>
);

const PrivacyPolicyPage = () => (
  <LegalPage title="Privacy Policy">
    <h2>1. Information We Collect</h2>
    <p>We may collect personal information that you voluntarily provide to us when you express an interest in obtaining information about us or our products and Services, when you participate in activities on the Website, or otherwise when you contact us.</p>

    <h2>2. How We Use Your Information</h2>
    <p>We use personal information collected via our Website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>

    <h2>3. Information Sharing</h2>
    <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>

    <h2>4. Cookies and Tracking Technologies</h2>
    <p>We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.</p>

    <h2>5. Contact Us</h2>
    <p>If you have questions or comments about this notice, you may email us at <a href="mailto:jd@geauxmab.com">jd@geauxmab.com</a>.</p>
  </LegalPage>
);

const TermsOfServicePage = () => (
  <LegalPage title="Terms of Service">
    <h2>1. Agreement to Terms</h2>
    <p>These Terms of Use constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and GeauxMAB.com ("Company", "we", "us", or "our"), concerning your access to and use of the website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto.</p>

    <h2>2. Intellectual Property Rights</h2>
    <p>Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us.</p>

    <h2>3. User Representations</h2>
    <p>By using the Site, you represent and warrant that: (1) you have the legal capacity and you agree to comply with these Terms of Use; (2) you are not a minor in the jurisdiction in which you reside; (3) you will not access the Site through automated or non-human means, whether through a bot, script or otherwise.</p>

    <h2>4. Modifications and Interruptions</h2>
    <p>We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Site.</p>

    <h2>5. Contact Us</h2>
    <p>In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at: <a href="mailto:jd@geauxmab.com">jd@geauxmab.com</a>.</p>
  </LegalPage>
);

// --- Main App ---

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      {/* Screens slide like the booking app */}
      <motion.div key={location.pathname}
        initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] } }}
        exit={{ opacity: 0, x: -60, transition: { duration: 0.3 } }}>
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/bio" element={<BioPage />} />
          <Route path="/leadership" element={<LeadershipPage />} />
          <Route path="/lifestyle" element={<LifeStylePage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/journal/write" element={<JournalWrite />} />
          <Route path="/journal/:slug" element={<JournalArticle />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

export default function App() {
  const [splash, setSplash] = useState(true); // opening screen plays on every load, like book.geauxmab.com

  useEffect(() => {
    if (!splash) return;
    const t = setTimeout(() => setSplash(false), 3000);
    return () => clearTimeout(t);
  }, [splash]);

  return (
    <HashRouter>
      <MotionConfig reducedMotion="user">
      <Splash show={splash} />
      <ScrollToTop />
      <PageMetadata />
      <div className="min-h-[100dvh] font-sans antialiased text-white bg-royal-blue selection:bg-white selection:text-royal-blue overflow-x-hidden">
        <LivingBackground />
        <div className="relative z-10">
          <AppFrame />
          <main>
            <AnimatedRoutes />
          </main>
          <Footer />
        </div>
      </div>
      </MotionConfig>
    </HashRouter>
  );
}
