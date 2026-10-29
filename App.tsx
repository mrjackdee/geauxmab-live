// © MrJackDee™. All rights reserved.
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion, MotionConfig, useScroll, useTransform, AnimatePresence } from 'motion/react';

import { AppFrame, Footer, IntroContext, Splash } from './SiteChrome';
import { HomePage } from './Home';
import { JournalArticle, JournalPage, JournalWrite } from './Journal';
import { BrotherhoodPage, ScholarshipPage, ServicePage } from './Inner';

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
        description: 'Official website of Jack Dee. Techie, Strategist, Doctoral Candidate, Entrepreneur and proud Sigma. Brotherhood, scholarship and service in one place.',
        keywords: 'Jack Dee, GeauxMAB, Phi Beta Sigma, Leadership, Strategy, Entrepreneurship, Lifestyle, Techie'
      },
      '/bio': {
        title: 'The Brotherhood | GeauxMAB.com',
        description: 'Jack Dee’s journey in Phi Beta Sigma since 1998: chapters, milestones and brotherhood beyond Sigma.',
        keywords: 'Jack Dee, Phi Beta Sigma, Zeta Iota, Omicron Sigma, Life Member, Brotherhood'
      },
      '/leadership': {
        title: 'The Scholarship | GeauxMAB.com',
        description: 'Doctoral research on advancing Black senior leadership in technology, the BeVISIBLE Alliance Model, and what Jack Dee is building.',
        keywords: 'Doctoral Candidate, BeVISIBLE, Black Leadership in Tech, DonOra Global, Curious 2 Capable'
      },
      '/lifestyle': {
        title: 'The Service | GeauxMAB.com',
        description: 'Yoga, meditation, strength, Air Jordans, travel and community: how Jack Dee keeps balance and serves.',
        keywords: 'Yoga, Meditation, Air Jordans, Wellness, Community Service, Jack Dee'
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

// --- Components ---

// Same living background as book.geauxmab.com: the seal stays upright and only drifts and breathes,
// with two soft glows. Pages with their own solid background sit on top of it.
const LivingBackground = () => {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 140]);
  // Own compositing layer: the drifting seal never forces the glass panels above it to repaint
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true" style={{ transform: 'translateZ(0)', willChange: 'transform', contain: 'strict' }}>
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

/* ---------------- Shared building blocks (same as the booking app's panels) ---------------- */
// Dark blue card with the white hairline glow along the top edge
const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`glass relative rounded-[28px] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] overflow-hidden ${className}`}>
    <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    {children}
  </div>
);

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
          <Route path="/bio" element={<BrotherhoodPage />} />
          <Route path="/leadership" element={<ScholarshipPage />} />
          <Route path="/lifestyle" element={<ServicePage />} />
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
  // Opening screen plays on every load, like book.geauxmab.com (?nosplash skips it for screenshots and testing)
  const [splash, setSplash] = useState(() => !new URLSearchParams(window.location.search).has('nosplash'));

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
          <IntroContext.Provider value={!splash}>
            <main>
              <AnimatedRoutes />
            </main>
          </IntroContext.Provider>
          <Footer />
        </div>
      </div>
      </MotionConfig>
    </HashRouter>
  );
}
