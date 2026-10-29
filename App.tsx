// © MrJackDee™. All rights reserved.
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, MotionConfig, useScroll, useInView, useTransform, AnimatePresence } from 'motion/react';
import {
  ArrowRight, ArrowUpRight, Globe, Award, TrendingUp, Users, Activity, Building2, Facebook, Instagram, Linkedin,
  Briefcase, GraduationCap, Heart, Twitter, Clock,
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
    <div className="relative w-full h-[300px] md:h-[400px] overflow-hidden rounded-sm shadow-md mt-16">
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

const BioPage = () => {
  return (
    <motion.main 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-white"
    >
      <SubNav links={[
        { label: 'My Journey', id: 'journey' },
        { label: 'Timeline', id: 'timeline' },
        { label: 'Masonic', id: 'masonic' }
      ]} />
      {/* Header */}
      <header id="journey" className="relative py-8 md:py-12 lg:py-20 bg-slate-50 border-b border-sigma-gray/20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-2 h-2 bg-royal-blue rounded-full"></span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-royal-blue">The Brotherhood</span>
            </div>
            <h1 className="text-6xl font-bold text-royal-blue uppercase leading-none tracking-tighter mb-6">
              My Journey.
            </h1>
            <div className="flex flex-col items-start mt-12 w-full">
              <blockquote className="border-l-4 border-royal-blue pl-4 mb-12 text-slate-700 italic font-serif text-lg">
                "Service is the responsibility that comes with taking up space in the world. We should aim to ensure space leaves people stronger, clearer, and better prepared to move forward on their own."
              </blockquote>

              <div className="flex flex-col items-center w-full max-w-md">
                <div className="flex items-center gap-8 md:gap-12 mb-8 justify-center w-full border-2 border-royal-blue/20 bg-white p-6 rounded-sm shadow-sm">
                  <div className="flex flex-col text-center">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-sigma-gray mb-1">Initiated</span>
                    <span className="block text-3xl md:text-4xl font-bold text-royal-blue">Fall 1998</span>
                  </div>
                  
                  <div className="w-px bg-sigma-gray h-12"></div>

                  <div className="flex flex-col text-center">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-sigma-gray mb-1">Membership Status</span>
                    <span className="block text-3xl md:text-4xl font-bold text-[#D4AF37]">Gold</span>
                  </div>
                </div>
                
                <div className="w-full flex justify-center flex-col items-center">
                  <a href="https://phibetasigma1914.org/" target="_blank" rel="noopener noreferrer" className="inline-block hover:scale-105 transition-transform duration-300" aria-label="Phi Beta Sigma Fraternity Website">
                    <img 
                      src="https://lh3.googleusercontent.com/d/1ujWt304YSwhQIHht7yrT4GNP18dQJ-fY" 
                      alt="Phi Beta Sigma Fraternity Shield" 
                      className="h-48 object-contain"
                      referrerPolicy="no-referrer"
                      width="200"
                      height="192"
                      loading="lazy"
                    />
                  </a>
                  
                  {/* Audio Player */}
                  <div className="mt-8 relative z-20 bg-white p-4 border border-gray-200 shadow-sm rounded-sm w-full">
                    <h4 className="font-bold text-royal-blue text-[11px] uppercase mb-3 text-center leading-tight">The History of Phi Beta Sigma:<br/>A Podcast Discussion</h4>
                    <div className="text-center">
                      <a href="https://jumpshare.com/share/1nor4VeRITOkr6vXCJw1" target="_blank" rel="noopener noreferrer" className="inline-block bg-royal-blue text-white px-6 py-2 rounded-full text-[11px] uppercase tracking-widest font-bold hover:bg-blue-800 transition-colors shadow-md">
                        Listen
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative max-w-[280px] mx-auto"
          >
            <div className="aspect-[3/4] bg-slate-200 rounded-sm overflow-hidden shadow-2xl relative z-10">
               <img 
                 src="https://lh3.googleusercontent.com/d/1V3EMOWRsbopmMpif2quU70DvPPongmC7" 
                 alt="Jack Dee Portrait" 
                 className="w-full h-full object-cover" 
                 referrerPolicy="no-referrer"
                 width="280"
                 height="373"
                 loading="lazy"
               />
            </div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sigma-gray/20 rounded-full blur-3xl z-0"></div>
            <div className="mt-8 text-center relative z-20">
                <p className="font-bold text-royal-blue uppercase tracking-widest text-sm">Bro. Jack D. Givens</p>
                <p className="font-bold text-royal-blue uppercase tracking-widest text-sm mt-1">ZI-FA-98</p>
            </div>
            
          </motion.div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-royal-blue text-white py-12 border-b border-white/10 relative overflow-hidden">
        <FadeIn className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
          <div className="relative group">
            <div className="text-3xl font-bold mb-1"><Counter from={0} to={25} suffix="+" /></div>
            <div className="text-[11px] uppercase tracking-widest opacity-70">Years In SIGMA</div>
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: '100%' }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-1 bg-white/30 mt-2 rounded-full overflow-hidden"
            >
              <div className="h-full bg-white w-full origin-left"></div>
            </motion.div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">Zeta Iota</div>
            <div className="text-[11px] uppercase tracking-widest opacity-70">Initiated Chapter</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">Omicron Sigma</div>
            <div className="text-[11px] uppercase tracking-widest opacity-70">Current Chapter</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-1">"Wizard" #6</div>
            <div className="text-[11px] uppercase tracking-widest opacity-70">Line Name and Number</div>
          </div>
        </FadeIn>
      </div>

      {/* Timeline */}
      <section id="timeline" className="py-8 md:py-12 lg:py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="mb-16">
            <h2 className="text-3xl font-bold text-royal-blue uppercase tracking-tight">My SIGMA Timeline</h2>
            <div className="w-24 h-1 bg-royal-blue mt-4"></div>
          </FadeIn>
          
          <div className="grid md:grid-cols-4 gap-6 items-stretch">
            {[
              { 
                year: '1998-2001', 
                title: 'Zeta Iota Chapter', 
                type: 'Foundation', 
                desc: 'Initiated in the Gulf Coast Region at Northwestern State University on November 12, 1998. During collegiate tenure, I served as Chapter President, Vice President, Senior Advisor and NPHC chair.',
                image: "https://lh3.googleusercontent.com/d/13PuzhCyH15LmbRKny2nOa3yaltCh-wB0",
                imageClassName: "w-full h-full object-contain",
                link: "https://www.pbsgulfcoastregion.org/",
                icon: <GraduationCap size={24} />
              },
              { 
                year: '2006-Present', 
                title: 'Omicron Sigma Chapter', 
                type: 'Metriculation', 
                desc: 'Over 20 years financially active with the Omicron Sigma Chapter of North Dallas. Most recently served as the Director of Membership Intake.\n\nBecame Gulf Coast Life Member #7 in 2006.',
                image: "https://lh3.googleusercontent.com/d/1BGPAm6l9eCXBP55m8QLEb0QtPacvf6g9",
                imageClassName: "w-full h-full object-contain",
                link: "https://omicronsigma.clubexpress.com/",
                icon: <Users size={24} />
              },
              { 
                year: '2014', 
                title: 'Life Member #2174', 
                type: 'Life Member', 
                desc: "On January 9, 2014, I officially attained Life Membership status, which is significant not only because it occurred during my fraternity's centennial year but also because it solidified my lifetime financial commitment.",
                image: "https://bluculturecollections.com/cdn/shop/products/64dOJ104_2048x.jpg?v=1466704947",
                imageClassName: "w-full h-full object-contain",
                icon: <Award size={24} />
              },
              { 
                year: '2023', 
                title: '25 Years in SIGMA', 
                type: 'Milestone', 
                desc: 'On November 12, 2023, I officially became a 25-year member and proudly celebrated the milestone by serving as the Membership Intake Chair for Omicron Sigma and initiating three new members.',
                image: "https://image2url.com/r2/default/images/1772120015033-f60ab1a1-6c4a-447c-bcd8-c21913b76e05.png",
                imageClassName: "w-full h-full object-contain",
                icon: <Clock size={24} />
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1} className="group relative h-full">
                 <div className="absolute top-8 left-0 w-full h-0.5 bg-gray-100 -z-10 hidden md:block"></div>
                 <div className="w-16 h-16 bg-white border-2 border-royal-blue flex items-center justify-center text-royal-blue font-bold rounded-sm mb-6 z-10 relative shadow-sm group-hover:bg-royal-blue group-hover:text-white transition-colors">
                    {item.icon}
                 </div>
                  <div className="bg-white p-6 border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 flex flex-col">
                    <div className="flex flex-col">
                      <span className="text-royal-blue font-bold text-lg block mb-1">{item.year}</span>
                      <h4 className="font-bold text-sm uppercase mb-3">{item.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4 whitespace-pre-wrap">{item.desc}</p>
                    </div>
                    <div className="mt-auto flex flex-col">
                      {item.image && (
                        <div className="w-full flex justify-center items-center overflow-hidden h-40 rounded-sm mb-4">
                          {item.link ? (
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="w-full h-full flex justify-center items-center" aria-label={`Link to ${item.title}`}>
                              <img src={item.image} alt={item.title} className={item.imageClassName} referrerPolicy="no-referrer" loading="lazy" width="300" height="160" />
                            </a>
                          ) : (
                            <img src={item.image} alt={item.title} className={item.imageClassName} referrerPolicy="no-referrer" loading="lazy" width="300" height="160" />
                          )}
                        </div>
                      )}
                      <div className="w-full flex justify-center">
                        {item.type === 'Life Member' ? (
                          <span 
                            className="px-3 py-1 bg-royal-blue text-[#D4AF37] text-[11px] font-bold uppercase tracking-wider rounded-sm shadow-md animate-pulse gold-text-shadow"
                          >
                            {item.type}
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[11px] font-bold uppercase tracking-wider rounded-sm">{item.type}</span>
                        )}
                      </div>
                    </div>
                 </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Masonic */}
      <section id="masonic" className="py-8 md:py-12 lg:py-20 bg-slate-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="border-4 border-royal-blue/20 p-8 md:p-12 bg-white rounded-sm shadow-xl relative">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <FadeIn>
                <div className="w-16 h-1 bg-royal-blue mb-6"></div>
                <h2 className="text-3xl font-bold text-royal-blue uppercase mb-6">Masonic Affiliation</h2>
                <blockquote className="text-lg md:text-xl font-bold text-royal-blue italic leading-snug mb-8 border-l-4 border-royal-blue pl-6 py-2 bg-slate-50">
                  "Freemasonry chose me before I chose it. I just did not recognize it until I was ready, standing on the shoulders of a man of God who never needed a degree to understand dignity, service, and what it means to live with integrity"
                </blockquote>
                <div className="grid gap-6">
                  <div className="bg-white p-6 border border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-royal-blue transition-all duration-300 group cursor-default">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-royal-blue/10 flex items-center justify-center text-royal-blue shrink-0 group-hover:bg-royal-blue group-hover:text-white transition-colors">
                        <Users size={24} />
                      </div>
                      <div>
                        <h5 className="font-bold text-royal-blue text-sm uppercase">Free and Accepted Mason (F&AM)</h5>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Master Mason: November 17, 2000</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 border border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-royal-blue transition-all duration-300 group cursor-default">
                    <div className="flex gap-4 items-center">
                       <div className="w-12 h-12 bg-royal-blue/10 flex items-center justify-center text-royal-blue shrink-0 group-hover:bg-royal-blue group-hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2L3 21" />
                          <path d="M12 2L21 21" />
                          <path d="M7 11L12 16L17 11" />
                          <circle cx="12" cy="2" r="1" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="font-bold text-royal-blue text-sm uppercase">Current Affiliation: Silver Square #49</h5>
                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">District 9, Louisiana</p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
              <FadeIn delay={0.2} className="relative flex flex-col items-center justify-center h-full">
                 <div className="w-full max-w-[280px] flex flex-col items-center justify-center gap-6">
                    <img src="https://image2url.com/r2/default/images/1772167739816-2dcaa4ec-2705-4500-9574-7f7005b4a02e.png" className="w-full aspect-square object-contain mx-auto" alt="Masonic Logo" referrerPolicy="no-referrer" width="280" height="280" loading="lazy" />
                    <div className="bg-royal-blue p-4 text-white w-full text-center shadow-lg">
                      <h4 className="font-bold uppercase text-sm">Brotherhood</h4>
                      <p className="text-[11px] uppercase tracking-widest opacity-70">Strength in Unity</p>
                    </div>
                 </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
    </motion.main>
  );
}

const LeadershipPage = () => {
  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null);

  return (
    <motion.main 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-white"
    >
      <SubNav links={[
        { label: 'Disciplines', id: 'disciplines' },
        { label: 'Academic Focus', id: 'academic' },
        { label: 'Education', id: 'education' }
      ]} />
       {/* Hero */}
       <section className="py-12 px-6 text-center max-w-5xl mx-auto">
         <motion.h1 
           initial={{ opacity: 0, y: 15 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.5 }}
           className="text-5xl md:text-7xl font-bold text-royal-blue uppercase tracking-tighter"
         >
           Architecting the Future With Strategy.
         </motion.h1>
       </section>

       {/* Track Record */}
       <section id="disciplines" className="py-12 max-w-7xl mx-auto px-6">
          <FadeIn className="flex items-center gap-4 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-royal-blue whitespace-nowrap">Professional Disciplines</h2>
            <div className="h-px bg-gray-200 w-full"></div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: <Globe />, 
                  title: "Enterprise Transformation & Operating Governance", 
                  subtitle: "Strategy, Execution, and Organizational Clarity", 
                  text: "Big ideas fail without structure behind them. My focus is on building operating models, decision habits, and ownership frameworks that turn strategy into real, sustained execution. When teams know what they own and why it matters, results follow." 
                },
                { 
                  icon: <Activity />, 
                  title: "Intelligent & AI-Enabled Execution", 
                  subtitle: "Digital Infrastructure, Systems, and Responsible Adoption", 
                  text: "Speed matters. So does judgment. My approach centers on helping organizations adopt AI the right way, reduce complexity, improve decision quality, and keep humans accountable for outcomes. Better tools should make the work cleaner, not just faster." 
                },
                { 
                  icon: <TrendingUp />, 
                  title: "Governance, Risk & Servant Leadership", 
                  subtitle: "Decision Frameworks, Compliance, and People-First Performance", 
                  text: "In high-stakes environments, clarity and trust are not soft skills. My foundation is building guardrails that allow teams to move with confidence, manage risk without paralysis, and perform at their best because expectations are clear and leadership is present." 
                }
              ].map((item, i) => (
               <FadeIn key={i} delay={i * 0.2} className="p-8 border border-gray-200 hover:border-royal-blue hover:shadow-md hover:scale-[1.02] transition-all duration-300 group bg-white">
                  <div className="w-12 h-12 bg-slate-50 flex items-center justify-center text-royal-blue mb-6 border border-gray-100 group-hover:bg-royal-blue group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-royal-blue uppercase mb-2">{item.title}</h3>
                  <p className="text-xs font-bold text-sigma-gray uppercase tracking-widest mb-4">{item.subtitle}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
               </FadeIn>
             ))}
          </div>
       </section>

       {/* Digital Platforms */}
       <section className="py-8 max-w-7xl mx-auto px-6">
          <FadeIn className="flex flex-wrap justify-center items-center gap-4">
             <a href="https://www.MrJackDee.com/" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-royal-blue text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-blue-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                Professional Digital Page
             </a>
             <a href="https://donoraglobal.netlify.app/" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-royal-blue text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-blue-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                DonOra Group, LLC
             </a>
             <a href="https://curious2capable.netlify.app/#/" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-royal-blue text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-blue-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                Curious 2 Capable: AI Series
             </a>
          </FadeIn>
       </section>

       {/* Research */}
       <section id="academic" className="py-8 md:py-12 lg:py-20 max-w-7xl mx-auto px-6">
          <FadeIn className="flex items-center gap-4 mb-12">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-royal-blue whitespace-nowrap">Academic Focus</h2>
            <div className="h-px bg-gray-200 w-full"></div>
          </FadeIn>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
             <FadeIn className="relative p-4 border border-gray-200">
                <img 
                  src="https://lh3.googleusercontent.com/d/1LlTcEdkVnhW4j68ysp3rUpWWG9vJwKeL" 
                  alt="Academic Focus Logo" 
                  className="w-48 mb-6 object-contain"
                  referrerPolicy="no-referrer"
                  width="192"
                  height="192"
                  loading="lazy"
                />
                <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop" alt="Research Papers and Glasses" className="w-full grayscale hover:grayscale-0 transition-all duration-500" width="800" height="533" loading="lazy" />
                <div className="absolute bottom-8 left-8 bg-white border-l-4 border-royal-blue p-6 max-w-xs shadow-lg">
                   <p className="text-[11px] font-bold text-royal-blue uppercase tracking-widest mb-1">William Howard Taft University</p>
                   <p className="text-sm font-serif italic text-slate-900">"Developing a Strategic Advisory Framework to Advance Black Senior Leadership in the Technology Industry: The BeVISIBLE Alliance Model"</p>
                </div>
             </FadeIn>
             
             <FadeIn delay={0.2} className="space-y-8">
                <span className="inline-block px-4 py-1 border border-royal-blue text-royal-blue text-[11px] font-bold uppercase tracking-widest">Doctor of Business Administration Candidate</span>
                <h3 className="text-4xl font-bold text-royal-blue uppercase leading-tight">ADVANCING BLACK LEADERSHIP IN TECHNOLOGY</h3>
                <div className="text-slate-600 leading-relaxed space-y-4 text-sm">
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
                
                <div className="h-px bg-gray-200 w-full my-8"></div>
                
                <div className="bg-white p-6 md:p-8 border border-gray-200 shadow-sm rounded-sm">
                  <div className="mb-6 text-royal-blue font-bold tracking-wide whitespace-nowrap text-[14px] md:text-[16px] text-center border-b border-gray-100 pb-4">
                    The BeVISIBLE™ Alliance Model
                  </div>
                  <div className="bevisible-grid grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-y-8">
                    {[
                      { l: 'Be', t: 'Believing' },
                      { l: 'V', t: 'Voice' },
                      { l: 'I', t: 'Insight' },
                      { l: 'S', t: 'Sponsorship' },
                      { l: 'I', t: 'Intentionality' },
                      { l: 'B', t: 'Boldness' },
                      { l: 'L', t: 'Leverage' },
                      { l: 'E', t: 'Endurance' }
                    ].map((item, i) => (
                       <motion.div 
                         key={i} 
                         className="flex flex-col items-center gap-3 text-center cursor-pointer"
                         onMouseEnter={() => setHoveredLetter(item.t)}
                         onMouseLeave={() => setHoveredLetter(null)}
                         animate={{ 
                           opacity: hoveredLetter && hoveredLetter !== item.t ? 0.3 : 1,
                           scale: hoveredLetter === item.t ? 1.1 : 1
                         }}
                       >
                          <div
                            data-letter={item.l}
                            className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center font-bold text-xl md:text-2xl transition-colors shadow-sm ${
                              hoveredLetter === item.t ? 'bg-royal-blue text-white border-royal-blue shadow-md' : 'border-royal-blue/20 text-royal-blue bg-slate-50'
                            }`}
                          >
                             {item.l}
                          </div>
                          <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${
                            hoveredLetter === item.t ? 'text-royal-blue' : 'text-slate-500'
                          }`}>{item.t}</span>
                       </motion.div>
                    ))}
                 </div>
               </div>
             </FadeIn>
          </div>
          <FadeIn delay={0.4}>
            <AcademicCarousel />
          </FadeIn>
       </section>

       {/* Education and Industry Credentials */}
       <section id="education" className="py-12 bg-slate-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-6">
             <FadeIn className="mb-12 text-center">
                <div className="w-24 h-1 bg-royal-blue mx-auto"></div>
             </FadeIn>

             <div className="grid md:grid-cols-2 gap-12">
                {/* Education */}
                <div className="space-y-8">
                   <FadeIn delay={0.1}>
                      <div className="flex items-center gap-4 mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-royal-blue whitespace-nowrap">Education</h3>
                        <div className="h-px bg-gray-200 w-full"></div>
                      </div>
                      <div className="space-y-6">
                         <div className="bg-white p-6 border border-gray-200 shadow-sm flex items-start gap-6 hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                            <div className="w-20 h-20 shrink-0 flex items-center justify-center p-2 bg-white border border-gray-100 rounded-sm">
                               <img src="https://lh3.googleusercontent.com/d/1ELDMVAuy5eBx7QZk8x_jiZVo7rJAIlUK" alt="William Howard Taft University Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" width="80" height="80" loading="lazy" />
                            </div>
                            <div>
                               <a href="http://www.taft.edu" target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-royal-blue uppercase leading-tight mb-1 hover:underline block">William Howard Taft University</a>
                               <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Deming School of Business<br/>Denver, Colorado</p>
                               <div className="text-sm text-slate-700 space-y-1">
                                  <p>In Progress [Confirmed 2026]: Doctor of Business Administration, Organizational Strategy Concentration</p>
                                  <p className="mt-2">ADRP: "Developing a Strategic Advisory Framework to Advance Black Senior Leadership in the Technology Industry: The BeVISIBLE Alliance Model"</p>
                               </div>
                            </div>
                         </div>

                         <div className="bg-white p-6 border border-gray-200 shadow-sm flex items-start gap-6 hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                            <div className="w-20 h-20 shrink-0 flex items-center justify-center p-2 bg-white border border-gray-100 rounded-sm">
                               <img src="https://lh3.googleusercontent.com/d/12KggcKuWZV2P40deLWdvEXhkMagH4D6A" alt="Northwestern State University Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" width="80" height="80" loading="lazy" />
                            </div>
                            <div>
                               <a href="http://www.nsula.edu/" target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-royal-blue uppercase leading-tight mb-1 hover:underline block">Northwestern State University</a>
                               <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Natchitoches, LA</p>
                               <div className="text-sm text-slate-700 space-y-1">
                                  <p>M.Ed., Educational Technology Leadership</p>
                                  <p>Ed.S., Educational Leadership and Instruction</p>
                                  <p>B.Sc., Computer Information Systems</p>
                                  <p>B.Sc., Business Administration</p>
                               </div>
                            </div>
                         </div>

                         <div className="bg-white p-6 border border-gray-200 shadow-sm flex items-start gap-6 hover:shadow-md hover:scale-[1.02] transition-all duration-300">
                            <div className="w-20 h-20 shrink-0 flex items-center justify-center p-2 bg-white border border-gray-100 rounded-sm">
                               <img src="https://lh3.googleusercontent.com/d/16IyhlNnxV-GeY53BbgTooJ0tavKMUOHX" alt="Louisiana State University Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" width="80" height="80" loading="lazy" />
                            </div>
                            <div>
                               <a href="http://www.lsus.edu" target="_blank" rel="noopener noreferrer" className="text-lg font-bold text-royal-blue uppercase leading-tight mb-1 hover:underline block">Louisiana State University</a>
                               <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Shreveport, LA</p>
                               <div className="text-sm text-slate-700 space-y-1">
                                  <p>MBA, Project Management</p>
                               </div>
                            </div>
                         </div>
                      </div>
                   </FadeIn>
                </div>

                {/* Industry Certifications */}
                <div className="space-y-8">
                   <FadeIn delay={0.3}>
                      <div className="flex items-center gap-4 mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-royal-blue whitespace-nowrap">Industry Certifications</h3>
                        <div className="h-px bg-gray-200 w-full"></div>
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                         <div className="bg-white p-6 border border-gray-200 shadow-sm flex items-center gap-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                            <div className="w-16 h-16 shrink-0 flex items-center justify-center p-1 bg-white border border-gray-100 rounded-sm">
                               <img src="https://lh3.googleusercontent.com/d/1xXOFjtkLrGqVmimq3h5-eIt8TmSqkmSl" alt="Project Management Professional Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" width="64" height="64" loading="lazy" />
                            </div>
                            <div>
                               <h4 className="text-md font-bold text-royal-blue uppercase leading-tight">Project Management Professional (PMP®)</h4>
                               <p className="text-xs text-slate-500 mt-1">Project Management Institute<br/>PMP #3993606</p>
                            </div>
                         </div>

                         <div className="bg-white p-6 border border-gray-200 shadow-sm flex items-center gap-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                            <div className="w-16 h-16 shrink-0 flex items-center justify-center p-1 bg-white border border-gray-100 rounded-sm">
                               <img src="https://lh3.googleusercontent.com/d/1OD7CqiAEqIxWw-8Jd9-h_BdElBP7tRQq" alt="Lean Six Sigma Black Belt Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" width="64" height="64" loading="lazy" />
                            </div>
                            <div>
                               <h4 className="text-md font-bold text-royal-blue uppercase leading-tight">Lean Six Sigma Black Belt</h4>
                               <p className="text-xs text-slate-500 mt-1">Council for Six Sigma Certification</p>
                            </div>
                         </div>

                         <div className="bg-white p-6 border border-gray-200 shadow-sm flex items-center gap-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                            <div className="w-16 h-16 shrink-0 flex items-center justify-center p-1 bg-white border border-gray-100 rounded-sm">
                               <img src="https://lh3.googleusercontent.com/d/1ACOeqyyrqEtcTKC9ICXp9w5UfrFjUsYo" alt="SAFe 6 Product Owner Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" width="64" height="64" loading="lazy" />
                            </div>
                            <div>
                               <h4 className="text-md font-bold text-royal-blue uppercase leading-tight">SaFE 6® Product Owner / Product Manager</h4>
                               <p className="text-xs text-slate-500 mt-1">Scaled Agile, Inc.</p>
                            </div>
                         </div>

                         <div className="bg-white p-6 border border-gray-200 shadow-sm flex items-center gap-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                            <div className="w-16 h-16 shrink-0 flex items-center justify-center p-1 bg-white border border-gray-100 rounded-sm">
                               <img src="https://lh3.googleusercontent.com/d/1ACOeqyyrqEtcTKC9ICXp9w5UfrFjUsYo" alt="SAFe 6 Lean Portfolio Manager Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" width="64" height="64" loading="lazy" />
                            </div>
                            <div>
                               <h4 className="text-md font-bold text-royal-blue uppercase leading-tight">SaFE 6® Lean Portfolio Manager</h4>
                               <p className="text-xs text-slate-500 mt-1">Scaled Agile, Inc.</p>
                            </div>
                         </div>

                         <div className="bg-white p-6 border border-gray-200 shadow-sm flex items-center gap-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                            <div className="w-16 h-16 shrink-0 flex items-center justify-center p-1 bg-white border border-gray-100 rounded-sm">
                               <img src="https://lh3.googleusercontent.com/d/1otH78TM9tuDtUb_Cy4ILn14P0I_lma_7" alt="University of South Florida Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" width="64" height="64" loading="lazy" />
                            </div>
                            <div>
                               <h4 className="text-md font-bold text-royal-blue uppercase leading-tight">Diversity, Equity & Inclusion in the Workplace</h4>
                               <p className="text-xs text-slate-500 mt-1">University of South Florida</p>
                            </div>
                         </div>
                      </div>
                   </FadeIn>
                </div>
             </div>
          </div>
       </section>
    </motion.main>
  );
}

const LifeStylePage = () => {
  return (
    <motion.main 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-white"
    >
      <SubNav links={[
        { label: 'Perspective', id: 'perspective' },
        { label: 'Lifestyle', id: 'lifestyle' }
      ]} />
      {/* Header */}
      <section id="perspective" className="py-8 md:py-12 lg:py-20 px-6 max-w-7xl mx-auto text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-5xl md:text-7xl font-bold text-royal-blue mb-12"
        >
          Balance and Perspective.
        </motion.h1>
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto text-left">
          <FadeIn>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 tracking-tight leading-tight">
              At this stage of my life, balance feels earned.
            </h2>
          </FadeIn>
          <FadeIn delay={0.2}>
            <h3 className="text-base md:text-lg lg:text-xl text-slate-500 font-medium tracking-tight leading-relaxed">
              It lives somewhere between discipline and joy, between taking care of myself and still having fun.
            </h3>
          </FadeIn>
          <FadeIn delay={0.4}>
            <blockquote className="text-lg md:text-2xl lg:text-3xl text-royal-blue font-bold tracking-tight border-l-4 border-royal-blue pl-6 py-1 text-left">
              These are the things that keep me grounded and remind me who I have always been.
            </blockquote>
          </FadeIn>
        </div>
        
        <FadeIn delay={0.6} className="mt-16 mb-8">
           <div className="h-px bg-gray-200 w-full max-w-2xl mx-auto"></div>
        </FadeIn>
      </section>

      {/* Bento Grid */}
      <section id="lifestyle" className="px-6 pb-8 md:pb-12 lg:pb-20 max-w-7xl mx-auto">
         <div className="grid grid-cols-1 md:grid-cols-12 gap-6 grid-rows-[auto]">
            
            {/* Card A: Wellness (Left Large) */}
            <FadeIn className="md:col-span-4 md:row-span-2 bg-white border border-gray-200 rounded-sm overflow-hidden group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col">
               <div className="relative h-[400px] md:h-[45%] flex-shrink-0">
                  <img src="https://lh3.googleusercontent.com/d/1ba5_nMDhov_ehq6YvM_-MRPzXGEfO8K4" alt="Man lifting weights in gym" className="w-full h-full object-cover object-top" referrerPolicy="no-referrer" width="600" height="400" loading="lazy" />
               </div>
               <div className="p-8 flex-grow flex flex-col justify-between">
                  <div>
                    <span className="bg-slate-100 text-royal-blue px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-full mb-4 inline-block">WELLNESS</span>
                    <h3 className="text-2xl font-bold text-royal-blue leading-tight mb-6">Strength, Stillness, and Taking Care of My Mind</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
                      Weight training keeps me connected to my body and reminds me of what I am capable of. Meditation slows things down and gives me space to breathe. Therapy keeps my mental health strong and my perspective honest. None of this feels trendy to me. It feels necessary. Taking care of my body and mind is how I stay steady, present, and fully myself.
                    </p>
                  </div>
                  <div className="flex gap-4 text-royal-blue mt-auto">
                     <Activity size={20} />
                     <Heart size={20} />
                  </div>
               </div>
            </FadeIn>

            {/* Card B: Style (Top Right Large - Replaces previous Travel position) */}
            <FadeIn delay={0.2} className="md:col-span-8 bg-white border border-gray-200 rounded-sm overflow-hidden flex flex-col md:flex-row group hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
               <div className="md:w-1/2 h-64 md:h-auto relative">
                 <img src="https://lh3.googleusercontent.com/d/19I2Izijp1jMdeVZgewWrnqxCDylxasxP" alt="Air Jordan 1 Royal Blue Sneakers" className="w-full h-full object-cover object-center" referrerPolicy="no-referrer" width="600" height="400" loading="lazy" />
               </div>
               <div className="md:w-1/2 p-8 flex flex-col justify-center">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-royal-blue mb-2">STYLE</span>
                  <h3 className="text-3xl font-bold text-royal-blue mb-4">Sneakers and the Joy of the Hunt</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    I am a sneakerhead, always have been. Air Jordans, especially the classics, take me back. They remind me of growing up, paying attention to details, and understanding how style carries memory. I love a clean pair that just works.
                  </p>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    I also love the hunt. Thrift shopping, tracking down the right piece, finding the best deal, or catching a promo code before it disappears. Scrolling deal threads and following deal accounts is part nostalgia, part strategy, and part pure fun.
                  </p>
                  <p className="text-slate-500 text-xs italic mb-6 border-l-2 border-royal-blue pl-3 flex items-center gap-1 flex-wrap">
                    I keep an eye on deal feeds like 
                    <a href="https://x.com/FatKidDeals" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-royal-blue font-bold hover:underline">
                      @fatkiddeals <Twitter size={12} fill="currentColor" />
                    </a> 
                    and treat bargain-hunting like a sport.
                  </p>
                  
               </div>
            </FadeIn>

            {/* Card C: Travel (Bottom Middle - Moved from Top Right) */}
            <FadeIn delay={0.4} className="md:col-span-8 bg-white border border-gray-200 rounded-sm overflow-hidden flex flex-col group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative">
               <div className="h-48 relative">
                 <img src="https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=2831&auto=format&fit=crop" alt="Airplane flying over ocean" className="w-full h-full object-cover" width="800" height="400" loading="lazy" />
                 <div className="absolute inset-0 bg-black/40"></div>
                 <div className="absolute top-6 left-6">
                   <span className="bg-white text-royal-blue px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded-full shadow-sm">Perspective</span>
                 </div>
               </div>
               <div className="p-8 flex flex-col justify-center flex-grow">
                  <h3 className="text-2xl font-bold text-royal-blue mb-4">Travel</h3>
                  <p className="text-slate-800 font-medium text-sm leading-relaxed mb-6">
                    Travel reminds me that the world is bigger than any room I have ever walked into. New places reset my thinking, sharpen my perspective, and feed my curiosity.
                  </p>
               </div>
            </FadeIn>

            {/* Card D: Removed Socials & Blog (Moved to Connect Page) */}
         </div>
      </section>
    </motion.main>
  );
}

const PrivacyPolicyPage = () => {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-8 md:pt-12 lg:pt-20 bg-slate-50"
    >
      <section className="py-8 md:py-12 lg:py-20 px-6">
        <div className="max-w-4xl mx-auto bg-white p-12 shadow-sm border border-gray-100">
          <h1 className="text-4xl font-bold text-royal-blue mb-8">Privacy Policy</h1>
          <div className="prose prose-slate max-w-none">
            <p className="text-sm text-slate-500 mb-8">Last Updated: April 2026</p>
            
            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">1. Information We Collect</h2>
            <p className="mb-4">We may collect personal information that you voluntarily provide to us when you express an interest in obtaining information about us or our products and Services, when you participate in activities on the Website, or otherwise when you contact us.</p>
            
            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use personal information collected via our Website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
            
            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">3. Information Sharing</h2>
            <p className="mb-4">We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>
            
            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">4. Cookies and Tracking Technologies</h2>
            <p className="mb-4">We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.</p>
            
            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">5. Contact Us</h2>
            <p className="mb-4">If you have questions or comments about this notice, you may email us at jd@geauxmab.com.</p>
          </div>
        </div>
      </section>
    </motion.main>
  );
};

const TermsOfServicePage = () => {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-8 md:pt-12 lg:pt-20 bg-slate-50"
    >
      <section className="py-8 md:py-12 lg:py-20 px-6">
        <div className="max-w-4xl mx-auto bg-white p-12 shadow-sm border border-gray-100">
          <h1 className="text-4xl font-bold text-royal-blue mb-8">Terms of Service</h1>
          <div className="prose prose-slate max-w-none">
            <p className="text-sm text-slate-500 mb-8">Last Updated: April 2026</p>
            
            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">1. Agreement to Terms</h2>
            <p className="mb-4">These Terms of Use constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and GeauxMAB.com ("Company", "we", "us", or "our"), concerning your access to and use of the website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto.</p>
            
            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">2. Intellectual Property Rights</h2>
            <p className="mb-4">Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us.</p>
            
            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">3. User Representations</h2>
            <p className="mb-4">By using the Site, you represent and warrant that: (1) you have the legal capacity and you agree to comply with these Terms of Use; (2) you are not a minor in the jurisdiction in which you reside; (3) you will not access the Site through automated or non-human means, whether through a bot, script or otherwise.</p>
            
            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">4. Modifications and Interruptions</h2>
            <p className="mb-4">We reserve the right to change, modify, or remove the contents of the Site at any time or for any reason at our sole discretion without notice. However, we have no obligation to update any information on our Site.</p>
            
            <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4">5. Contact Us</h2>
            <p className="mb-4">In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at: jd@geauxmab.com.</p>
          </div>
        </div>
      </section>
    </motion.main>
  );
};

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
