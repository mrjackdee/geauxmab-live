// © MrJackDee™. All rights reserved.
// The three inner pages (The Brotherhood, The Scholarship, The Service), built like the home dashboard:
// a frosted profile card up top, a section bar that tracks where you are, then glass widgets with original art.
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView, useScroll, useTransform } from 'motion/react';
import {
  ArrowUpRight, Award, BookOpen, Building2, Check, Clock, Dumbbell, Flower2, Footprints, GraduationCap, Handshake,
  Headphones, HeartPulse, Pause, Play, Plane, Sparkles, Sunrise, Users, Wind,
} from 'lucide-react';
import { SectionHead } from './Home';

/* ============================== Shared pieces ============================== */

// Section bar under the app bar: glass pills, and a white pill that slides to the section on screen
const JumpBar = ({ id, links }: { id: string; links: { label: string; id: string }[] }) => {
  const [on, setOn] = useState(links[0].id);
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setOn(e.target.id); }),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    links.forEach((l) => { const el = document.getElementById(l.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [links]);
  const go = (to: string) => {
    const el = document.getElementById(to);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 128, behavior: 'smooth' });
  };
  return (
    <div className="sticky z-40 px-3 py-2" style={{ top: 'calc(4rem + env(safe-area-inset-top))' }}>
      <div className="glass mx-auto w-fit max-w-full overflow-x-auto rounded-full p-1 [scrollbar-width:none]">
        <div className="flex min-w-max items-center gap-1">
          {links.map((l) => (
            <button key={l.id} onClick={() => go(l.id)} aria-current={on === l.id}
              className="relative rounded-full px-4 py-2.5 text-xs font-bold tracking-wide">
              {on === l.id && <motion.span layoutId={`jump-${id}`} className="absolute inset-0 rounded-full bg-white shadow" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className={`relative transition-colors ${on === l.id ? 'text-royal-blue' : 'text-white/85'}`}>{l.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Frosted card that rises in as it scrolls into view
const Glass = ({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-30px' }}
    transition={{ delay, type: 'spring', stiffness: 180, damping: 22 }}
    className={`glass relative overflow-hidden rounded-[28px] ${className}`}>
    <span aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    {children}
  </motion.div>
);

const IconChip = ({ Icon, size = 20 }: { Icon: typeof Users; size?: number }) => (
  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-royal-blue shadow-lg"><Icon size={size} /></span>
);

const Section = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <section id={id} className="px-4 sm:px-6 pt-12 md:pt-16 scroll-mt-32">
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

// Numbers that count up the first time they are seen
const CountUp = ({ to, suffix = '', duration = 1.6 }: { to: number; suffix?: string; duration?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min((t - t0) / (duration * 1000), 1);
      setN(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration]);
  return <span ref={ref} className="tabular-nums">{n.toLocaleString()}{suffix}</span>;
};

// Page opener: label, big display title, a line in Jack's voice, and an art or photo slot
const PageTop = ({ label, title, lead, side, children }: { label: string; title: string; lead: string; side: React.ReactNode; children?: React.ReactNode }) => (
  <section className="px-4 sm:px-6 pt-6 md:pt-12">
    <div className="max-w-6xl mx-auto grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] items-center gap-8 md:gap-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
        className="glass @container order-2 md:order-1 rounded-[32px] px-5 py-7 sm:px-8 md:px-10 md:py-10 text-center md:text-left">
        <p className="text-sm font-bold tracking-wide text-[#c8c9c7]">{label}</p>
        <h1 className="font-display mt-2 text-[clamp(1.4rem,8.6cqi,3rem)] font-extrabold leading-[1.15] text-white">{title}</h1>
        <p className="text-lead mt-4 font-semibold text-white/90 max-w-xl mx-auto md:mx-0">{lead}</p>
        {children}
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 18, delay: 0.1 }}
        className="order-1 md:order-2 relative mx-auto w-[min(16rem,66vw)] md:w-full md:max-w-[22rem] aspect-square">
        {side}
      </motion.div>
    </div>
  </section>
);

// Rings, ticks and a slow turn behind a photo or emblem
const Halo = ({ speed = 90 }: { speed?: number }) => (
  <motion.svg aria-hidden="true" viewBox="0 0 400 400" className="pointer-events-none absolute inset-[-14%] h-[128%] w-[128%]"
    animate={{ rotate: 360 }} transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}>
    <g fill="none" stroke="white">
      <circle cx="200" cy="200" r="190" strokeOpacity="0.12" />
      <circle cx="200" cy="200" r="170" strokeOpacity="0.2" strokeDasharray="2 7" />
      <circle cx="200" cy="200" r="150" strokeOpacity="0.08" strokeWidth="10" />
      {Array.from({ length: 24 }, (_, i) => (
        <line key={i} x1="200" y1="14" x2="200" y2={i % 6 === 0 ? 34 : 26} strokeOpacity={i % 6 === 0 ? 0.4 : 0.18} strokeWidth="1.5" transform={`rotate(${i * 15} 200 200)`} />
      ))}
    </g>
  </motion.svg>
);

const PhotoDisc = ({ src, alt, badge }: { src: string; alt: string; badge?: React.ReactNode }) => (
  <>
    <Halo />
    <span className="absolute inset-0 overflow-hidden rounded-full border-[5px] border-white bg-white shadow-[0_30px_70px_-20px_rgba(0,0,0,0.7)]">
      <img src={src} alt={alt} className="h-full w-full object-cover object-top" referrerPolicy="no-referrer" />
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-royal-blue/45 via-transparent to-transparent" />
    </span>
    {badge}
  </>
);

/* ============================== The Brotherhood ============================== */
const CROSSED = new Date('1998-11-12T00:00:00');
const SHIELD = 'https://lh3.googleusercontent.com/d/1ujWt304YSwhQIHht7yrT4GNP18dQJ-fY';

const sigmaSpan = () => {
  const now = new Date();
  let years = now.getFullYear() - CROSSED.getFullYear();
  if (now < new Date(now.getFullYear(), CROSSED.getMonth(), CROSSED.getDate())) years -= 1;
  const days = Math.floor((now.getTime() - CROSSED.getTime()) / 86400000);
  return { years, days };
};

const BRO_LINKS = [
  { label: 'Snapshot', id: 'snapshot' },
  { label: 'Chapters', id: 'chapters' },
  { label: 'Timeline', id: 'timeline' },
  { label: 'Masonic', id: 'masonic' },
];

const CHAPTERS = [
  { name: 'Zeta Iota', where: 'Northwestern State University', tag: 'Where I crossed', years: '1998 to 2001',
    line: 'This is where I learned to lead before anyone called it leadership. I served as President, Vice President, Senior Advisor and NPHC chair, and I made every mistake a young leader can make, out loud, with my brothers watching.',
    img: 'https://lh3.googleusercontent.com/d/13PuzhCyH15LmbRKny2nOa3yaltCh-wB0', href: 'https://www.pbsgulfcoastregion.org/' },
  { name: 'Omicron Sigma', where: 'North Dallas', tag: 'Home today', years: '2006 to now',
    line: 'Twenty years financially active and still showing up. Most recently I led Membership Intake, which means I got to help write the first chapter for the next brothers in line.',
    img: 'https://lh3.googleusercontent.com/d/1BGPAm6l9eCXBP55m8QLEb0QtPacvf6g9', href: 'https://omicronsigma.clubexpress.com/' },
];

const TIMELINE = [
  { when: 'Nov 12, 1998', title: 'Crossed into Sigma', Icon: GraduationCap,
    line: 'Zeta Iota chapter, line name "Wizard," number six. I walked in a student and walked out a brother.' },
  { when: '2006', title: 'Gulf Coast Life Member #7', Icon: Award,
    line: 'I joined Omicron Sigma in North Dallas and made a lifetime commitment to the Gulf Coast Region.' },
  { when: 'Jan 9, 2014', title: 'Life Member #2174', Icon: Award,
    line: 'National Life Membership in our centennial year. One hundred years of Sigma, and I wanted my name in the next hundred.' },
  { when: 'Nov 12, 2023', title: 'Twenty-five years', Icon: Clock,
    line: 'I celebrated my silver anniversary by chairing intake and welcoming three new brothers. That felt like the right way to mark it.' },
];

// Animated equalizer for the "now playing" card
const Bars = ({ playing }: { playing: boolean }) => (
  <span aria-hidden="true" className="flex h-6 items-end gap-[3px]">
    {[0.6, 1, 0.45, 0.8, 0.55].map((h, i) => (
      <motion.span key={i} className="w-1 rounded-full bg-white" style={{ height: `${h * 100}%` }}
        animate={playing ? { scaleY: [0.35, 1, 0.5, 0.9, 0.35] } : { scaleY: 0.35 }}
        transition={{ duration: 1.1 + i * 0.12, repeat: Infinity, ease: 'easeInOut' }} />
    ))}
  </span>
);

const ScrollTimeline = () => {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 55%'] });
  const fill = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  return (
    <ol ref={ref} className="relative ml-5 sm:ml-6">
      <span aria-hidden="true" className="absolute left-0 top-2 bottom-2 w-[3px] -translate-x-1/2 rounded-full bg-white/15" />
      <motion.span aria-hidden="true" style={{ height: fill }} className="absolute left-0 top-2 w-[3px] -translate-x-1/2 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.8)]" />
      {TIMELINE.map(({ when, title, line, Icon }, i) => (
        <motion.li key={title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
          transition={{ type: 'spring', stiffness: 180, damping: 22, delay: i * 0.05 }} className="relative pl-9 sm:pl-12 pb-6 last:pb-0">
          <span className="absolute left-0 top-3 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-4 border-royal-blue bg-white text-royal-blue shadow-lg">
            <Icon size={17} />
          </span>
          <div className="glass rounded-[24px] p-5 sm:p-6">
            <p className="text-xs font-bold tracking-wide text-[#c8c9c7]">{when}</p>
            <h3 className="font-display mt-1 text-xl sm:text-2xl font-bold text-white">{title}</h3>
            <p className="mt-2 text-sm sm:text-base text-white/85 leading-relaxed">{line}</p>
          </div>
        </motion.li>
      ))}
    </ol>
  );
};

export const BrotherhoodPage = () => {
  const [{ years, days }] = useState(sigmaSpan);
  const [playing, setPlaying] = useState(false);
  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-14">
      <JumpBar id="bro" links={BRO_LINKS} />

      <PageTop label="The Brotherhood" title="Brotherhood is a verb."
        lead="I crossed in the fall of 1998 and never left. Sigma is the room where I learned who I wanted to be."
        side={<PhotoDisc src="https://lh3.googleusercontent.com/d/1V3EMOWRsbopmMpif2quU70DvPPongmC7" alt="Bro. Jack D. Givens"
          badge={<span className="absolute -bottom-1 -right-1 flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-full border-4 border-white bg-white p-2 shadow-[0_12px_24px_rgba(0,0,0,0.5)]"><img src={SHIELD} alt="Phi Beta Sigma shield" referrerPolicy="no-referrer" className="h-full w-full object-contain" /></span>} />}>
        <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/[0.07] py-1.5 pl-1.5 pr-4">
          <picture className="shrink-0">
            <source srcSet="/img/life-member.webp" type="image/webp" />
            <img src="/img/life-member.png" alt="Life Member insignia" width={122} height={176} className="h-9 w-auto" />
          </picture>
          <span className="text-left">
            <span className="block text-sm font-bold text-white leading-tight">Bro. Jack D. Givens</span>
            <span className="block text-xs text-[#c8c9c7]">ZI-FA-98 · Life Member</span>
          </span>
        </div>
      </PageTop>

      {/* Snapshot widgets */}
      <Section id="snapshot">
        <SectionHead title="By the Numbers" note="Counted live from the day I crossed." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { big: <CountUp to={years} />, label: 'Years a Sigma', sub: 'and counting' },
            { big: <CountUp to={days} duration={2.2} />, label: 'Days a Sigma', sub: 'since Nov 12, 1998' },
            { big: <>#2174</>, label: 'Life Member', sub: 'national, 2014' },
            { big: <>Wizard</>, label: 'Line name', sub: 'number six' },
          ].map((w, i) => (
            <Glass key={w.label} delay={i * 0.06} className="@container p-4 sm:p-6">
              {/* sized to the card, so the widest number always fits */}
              <p className="font-display text-[clamp(1.1rem,13cqi,2.4rem)] font-extrabold leading-none text-white">{w.big}</p>
              <p className="mt-3 text-sm font-bold text-white">{w.label}</p>
              <p className="text-xs text-[#c8c9c7]">{w.sub}</p>
            </Glass>
          ))}
        </div>
      </Section>

      {/* Chapters */}
      <Section id="chapters">
        <SectionHead title="My Chapters" note="Two homes, one bond." />
        <div className="grid md:grid-cols-2 gap-4">
          {CHAPTERS.map((c, i) => (
            <Glass key={c.name} delay={i * 0.08} className="p-5 sm:p-6 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block rounded-full bg-white px-3 py-1 text-[11px] font-bold tracking-wide text-royal-blue">{c.tag}</span>
                  <h3 className="font-display mt-3 text-2xl sm:text-3xl font-bold text-white">{c.name}</h3>
                  <p className="text-xs text-[#c8c9c7]">{c.where} · {c.years}</p>
                </div>
                <a href={c.href} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${c.name}`}
                  className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-lg transition-transform hover:-translate-y-1">
                  <img src={c.img} alt={`${c.name} chapter`} className="h-full w-full object-contain" referrerPolicy="no-referrer" loading="lazy" />
                </a>
              </div>
              <p className="mt-4 text-sm sm:text-base text-white/85 leading-relaxed">{c.line}</p>
            </Glass>
          ))}
        </div>

        {/* Now playing */}
        <Glass className="mt-4 p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-royal-blue shadow-lg">
              <Headphones size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold tracking-wide text-[#c8c9c7]">Worth a listen</p>
              <p className="font-display text-base sm:text-lg font-bold text-white leading-tight">The History of Phi Beta Sigma: A Podcast Discussion</p>
            </div>
            <div className="hidden sm:block"><Bars playing={playing} /></div>
            <a href="https://jumpshare.com/share/1nor4VeRITOkr6vXCJw1" target="_blank" rel="noopener noreferrer"
              onPointerEnter={() => setPlaying(true)} onPointerLeave={() => setPlaying(false)} onFocus={() => setPlaying(true)} onBlur={() => setPlaying(false)}
              aria-label="Listen to the podcast"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-royal-blue shadow-lg transition-transform hover:scale-110">
              {playing ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </a>
          </div>
        </Glass>
      </Section>

      {/* Timeline */}
      <Section id="timeline">
        <SectionHead title="The Road Since 1998" note="The moments that marked the journey." />
        <ScrollTimeline />
      </Section>

      {/* Masonic */}
      <Section id="masonic">
        <SectionHead title="Brotherhood Beyond Sigma" />
        <Glass className="p-6 sm:p-8 md:p-10">
          <div className="grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] gap-8 items-center">
            <div>
              <span aria-hidden="true" className="block text-7xl leading-[0.6] text-white/20">"</span>
              <blockquote className="text-lg sm:text-2xl font-semibold leading-snug text-white">
                Freemasonry chose me before I chose it. I just did not recognize it until I was ready, standing on the shoulders of a man of God who never needed a degree to understand dignity, service, and what it means to live with integrity.
              </blockquote>
              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] p-3">
                  <IconChip Icon={Users} />
                  <span><span className="block text-sm font-bold text-white">Master Mason</span><span className="block text-xs text-[#c8c9c7]">Raised Nov 17, 2000</span></span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] p-3">
                  <IconChip Icon={Handshake} />
                  <span><span className="block text-sm font-bold text-white">Silver Square #49</span><span className="block text-xs text-[#c8c9c7]">District 9, Louisiana</span></span>
                </div>
              </div>
            </div>
            <div className="relative mx-auto aspect-square w-48 sm:w-56">
              <Halo speed={120} />
              <span className="absolute inset-[12%] flex items-center justify-center rounded-full bg-white p-5 shadow-xl">
                <img src="https://image2url.com/r2/default/images/1772167739816-2dcaa4ec-2705-4500-9574-7f7005b4a02e.png" alt="Masonic square and compass"
                  className="h-full w-full object-contain" referrerPolicy="no-referrer" loading="lazy" />
              </span>
            </div>
          </div>
        </Glass>
      </Section>
    </motion.main>
  );
};

/* ============================== The Scholarship ============================== */
const SCH_LINKS = [
  { label: 'Research', id: 'research' },
  { label: 'Journey', id: 'journey' },
  { label: 'BeVISIBLE', id: 'model' },
  { label: 'Learning', id: 'learning' },
  { label: 'Building', id: 'building' },
];

// Doctoral milestones
const MILESTONES: { label: string; state: 'done' | 'now' | 'next' }[] = [
  { label: 'Research Topic', state: 'done' },
  { label: 'Project Justification', state: 'done' },
  { label: 'Proposal', state: 'done' },
  { label: 'Proposal Defense', state: 'done' },
  { label: 'IRB Approved', state: 'done' },
  { label: 'Interviews', state: 'now' },
  { label: 'Analysis', state: 'next' },
  { label: 'Final Defense', state: 'next' },
];
const DONE = MILESTONES.filter((m) => m.state === 'done').length;

// BeVISIBLE™: one letter per dimension, described in Jack's words
const BEVISIBLE = [
  { l: 'Be', t: 'Believing', d: 'Confidence that rests on a real record, not on hype. You can name what you have done and why it is ready for more.' },
  { l: 'V', t: 'Voice', d: 'Not only speaking up, but being heard, credited and acted on when it counts.' },
  { l: 'I', t: 'Insight', d: 'The honest feedback nobody volunteers: what the next level actually asks of you.' },
  { l: 'S', t: 'Sponsorship', d: 'Someone with influence spending it on your name in rooms you are not in yet.' },
  { l: 'I', t: 'Intentionality', d: 'Choosing your preparation, relationships and exposure on purpose instead of waiting to be noticed.' },
  { l: 'B', t: 'Boldness', d: 'Taking the swing, with a clear read on timing, risk and who has your back.' },
  { l: 'L', t: 'Leverage', d: 'Turning reputation, relationships and results into the next real opportunity.' },
  { l: 'E', t: 'Endurance', d: 'Staying in it for the long run through rest, recovery and community, without treating an unfair system as a personal burden.' },
];

const EEOC = [
  { label: 'All tech jobs', v: 7.6 },
  { label: 'First and mid-level managers', v: 4 },
  { label: 'Executives and senior leaders', v: 3 },
];

const DEGREES = [
  { school: 'Northwestern State University', logo: 'https://lh3.googleusercontent.com/d/12KggcKuWZV2P40deLWdvEXhkMagH4D6A',
    items: ['B.S., Business Administration', 'B.S., Computer Information Systems', 'M.Ed., Educational Technology Leadership', 'Ed.S., Educational Leadership and Instruction'] },
  { school: 'LSU Shreveport', logo: 'https://lh3.googleusercontent.com/d/16IyhlNnxV-GeY53BbgTooJ0tavKMUOHX', items: ['MBA, Project Management'] },
  { school: 'William Howard Taft University', logo: 'https://lh3.googleusercontent.com/d/1ELDMVAuy5eBx7QZk8x_jiZVo7rJAIlUK', items: ['Doctor of Business Administration, Organizational Strategy'], now: true },
];

const BUILDING = [
  { name: 'BeVISIBLE.work', href: 'https://bevisible.work/', Icon: GraduationCap, line: 'Where my research lives in public, for the leaders it is about.' },
  { name: 'DonOra Global', href: 'https://www.donoraglobal.com/', Icon: Building2, line: 'My company. Strategy and responsible AI for organizations that want to lead, not follow.' },
  { name: 'Curious 2 Capable', href: 'https://curious2capable.netlify.app/#/', Icon: Sparkles, line: 'My AI series for anyone who is curious and ready to get capable.' },
];

// Progress ring for the doctorate
const Ring = ({ done, total }: { done: number; total: number }) => {
  const r = 150;
  const c = 2 * Math.PI * r;
  return (
    <>
      <Halo speed={140} />
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="200" cy="200" r={r} fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="18" />
        <motion.circle cx="200" cy="200" r={r} fill="none" stroke="white" strokeWidth="18" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - done / total) }} transition={{ duration: 1.8, delay: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.6))' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <GraduationCap className="text-white" size={34} />
        <p className="font-display mt-1 text-5xl md:text-6xl font-extrabold text-white leading-none">{done}<span className="text-white/50">/{total}</span></p>
        <p className="mt-2 text-xs font-bold tracking-wide text-[#c8c9c7]">milestones complete</p>
      </div>
    </>
  );
};

// Original art: a ladder whose top rungs fade out, for the research question
const LadderArt = () => (
  <svg aria-hidden="true" viewBox="0 0 200 200" className="absolute -right-6 -bottom-6 h-48 w-48 sm:h-56 sm:w-56">
    <g fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <path d="M70 190 L90 20" strokeOpacity="0.25" />
      <path d="M130 190 L110 20" strokeOpacity="0.25" />
      {Array.from({ length: 8 }, (_, i) => {
        const y = 175 - i * 20;
        const inset = (190 - y) * (20 / 170);
        return <line key={i} x1={70 + inset} y1={y} x2={130 - inset} y2={y} strokeOpacity={i < 5 ? 0.35 : 0.08} strokeDasharray={i < 5 ? undefined : '3 5'} />;
      })}
    </g>
  </svg>
);

export const ScholarshipPage = () => {
  const [open, setOpen] = useState('Believing');
  const active = BEVISIBLE.find((b) => b.t === open)!;
  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-14">
      <JumpBar id="sch" links={SCH_LINKS} />

      <PageTop label="The Scholarship" title="Curiosity never retires."
        lead="I'm a Doctoral Candidate studying why talented Black leaders in tech stall short of the top, and what it takes to change that."
        side={<Ring done={DONE} total={MILESTONES.length} />}>
        <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold tracking-wide text-royal-blue">
            <GraduationCap size={14} /> Doctoral Candidate
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-400/15 px-4 py-2 text-xs font-bold tracking-wide text-emerald-100">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" /></span>
            Interviews underway
          </span>
        </div>
      </PageTop>

      {/* The research */}
      <Section id="research">
        <SectionHead title="The Question I Can't Put Down" />
        <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-4">
          <Glass className="p-6 sm:p-8">
            <LadderArt />
            <div className="relative">
              <p className="font-display text-2xl sm:text-3xl font-bold leading-tight text-white">Why does a strong record stop being enough?</p>
              <div className="mt-4 space-y-3 text-sm sm:text-base text-white/85 leading-relaxed max-w-xl">
                <p>I have watched brilliant people do everything right and still stall one level short of the top. The work was never the problem. Who was in the room speaking their name was.</p>
                <p>So I am asking Black leaders who have held Director-level roles or higher in tech how their records were finally seen, and what got in the way. Their answers shape the BeVISIBLE™ Alliance Model.</p>
              </div>
              <p className="mt-5 rounded-2xl bg-white p-4 text-sm italic text-royal-blue">
                "Developing a Strategic Advisory Framework to Advance Black Senior Leadership in the Technology Industry: The BeVISIBLE Alliance Model"
              </p>
            </div>
          </Glass>

          <Glass delay={0.08} className="p-6 sm:p-8">
            <p className="text-sm font-bold text-white">Black representation in high tech</p>
            <p className="text-xs text-[#c8c9c7]">EEOC, 2022</p>
            <div className="mt-6 space-y-5">
              {EEOC.map((b, i) => (
                <div key={b.label}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm text-white/90">{b.label}</span>
                    <span className="font-display text-2xl font-extrabold text-white tabular-nums">{b.v}%</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-white/10 overflow-hidden">
                    <motion.div className="h-full rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]"
                      initial={{ width: 0 }} whileInView={{ width: `${(b.v / 8) * 100}%` }} viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.2 + i * 0.2, ease: [0.2, 0.8, 0.2, 1] }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm font-bold text-white">The higher you look, the thinner it gets.</p>
          </Glass>
        </div>
      </Section>

      {/* Doctoral journey */}
      <Section id="journey">
        <SectionHead title="The Doctoral Journey" note="Where the work stands today." />
        <Glass className="p-5 sm:p-8">
          <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div className="h-full rounded-full bg-white" initial={{ width: 0 }} whileInView={{ width: `${((DONE + 0.5) / MILESTONES.length) * 100}%` }}
              viewport={{ once: true }} transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }} />
          </div>
          <ol className="mt-6 grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3">
            {MILESTONES.map((m, i) => (
              <motion.li key={m.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${m.state === 'done' ? 'border-white/25 bg-white/[0.08]' : m.state === 'now' ? 'border-emerald-300/70 bg-emerald-400/10 shadow-[0_0_18px_rgba(52,211,153,0.35)]' : 'border-white/15'}`}>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${m.state === 'done' ? 'bg-white text-royal-blue' : m.state === 'now' ? 'bg-emerald-400 text-royal-blue' : 'border border-white/30 text-white/70'}`}>
                  {m.state === 'done' ? <Check size={15} strokeWidth={3} /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-bold leading-tight ${m.state === 'next' ? 'text-white/70' : 'text-white'}`}>{m.label}</span>
                  <span className="block text-[11px] text-[#c8c9c7]">{m.state === 'done' ? 'Complete' : m.state === 'now' ? 'Underway' : 'Ahead'}</span>
                </span>
              </motion.li>
            ))}
          </ol>
        </Glass>
      </Section>

      {/* BeVISIBLE model */}
      <Section id="model">
        <SectionHead title="The BeVISIBLE™ Model" note="Tap a letter to see what it means." />
        <Glass className="p-5 sm:p-8">
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 sm:gap-3">
            {BEVISIBLE.map((b) => {
              const on = open === b.t;
              return (
                <button key={b.t} onClick={() => setOpen(b.t)} aria-pressed={on} className="flex flex-col items-center gap-2 py-1">
                  <motion.span animate={{ scale: on ? 1.1 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border-2 font-display text-base sm:text-xl font-extrabold transition-colors ${on ? 'border-white bg-white text-royal-blue shadow-[0_0_24px_rgba(255,255,255,0.5)]' : 'border-white/35 bg-white/[0.06] text-white'}`}>
                    {b.l}
                  </motion.span>
                  <span className={`text-[11px] font-bold tracking-wide ${on ? 'text-white' : 'text-[#c8c9c7]'}`}>{b.t}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 min-h-[110px] sm:min-h-[84px]">
            <AnimatePresence mode="wait">
              <motion.div key={active.t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}
                className="mx-auto max-w-2xl rounded-2xl bg-white p-5 text-center text-royal-blue">
                <p className="font-display text-lg font-bold">{active.t}</p>
                <p className="mt-1 text-sm sm:text-base leading-relaxed">{active.d}</p>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            {[
              { n: '1', t: 'The Leader', d: 'Prepares and owns the story' },
              { n: '2', t: 'The Alliance', d: 'Advocates and opens doors' },
              { n: '3', t: 'The Organization', d: 'Creates the opportunity' },
            ].map((x) => (
              <div key={x.t} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white font-bold text-royal-blue">{x.n}</span>
                <span><span className="block text-sm font-bold text-white">{x.t}</span><span className="block text-xs text-[#c8c9c7]">{x.d}</span></span>
              </div>
            ))}
          </div>
          <p className="font-display mt-6 text-center text-xl sm:text-2xl font-bold text-white">Mentorship advises. Sponsorship acts.</p>
          <p className="mt-2 text-center text-xs text-[#c8c9c7] max-w-xl mx-auto">The model is still being studied. No participant data or unpublished findings are shared here.</p>
        </Glass>
      </Section>

      {/* Learning path */}
      <Section id="learning">
        <SectionHead title="A Lifelong Student" note="Every degree opened the next door." />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEGREES.map((d, i) => (
            <Glass key={d.school} delay={i * 0.08} className={`@container p-5 sm:p-6 ${d.now ? 'ring-1 ring-emerald-300/50' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg">
                  <img src={d.logo} alt="" className="h-full w-full object-contain" referrerPolicy="no-referrer" loading="lazy" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold tracking-wide text-[#c8c9c7]">Step {i + 1}{d.now ? ' · Now' : ''}</p>
                  <h3 className="font-display text-[clamp(0.8rem,6cqi,1.125rem)] font-bold leading-tight text-white">{d.school}</h3>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {d.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-sm text-white/90">
                    {d.now ? <BookOpen size={15} className="mt-0.5 shrink-0 text-emerald-200" /> : <Check size={15} className="mt-0.5 shrink-0 text-white" />}
                    {it}
                  </li>
                ))}
              </ul>
            </Glass>
          ))}
        </div>
      </Section>

      {/* What I'm building */}
      <Section id="building">
        <SectionHead title="What I'm Building" note="Where the ideas go to work." />
        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
          {BUILDING.map(({ name, href, Icon, line }, i) => (
            <motion.a key={name} href={href} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, type: 'spring', stiffness: 180, damping: 22 }}
              whileHover={{ y: -6 }} whileTap={{ scale: 0.97 }}
              className="glass @container group relative flex flex-col gap-4 overflow-hidden rounded-[28px] p-5 sm:p-6">
              <span className="flex items-start justify-between">
                <IconChip Icon={Icon} />
                <ArrowUpRight size={18} className="text-white/70 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
              </span>
              <span>
                <span className="font-display block text-[clamp(0.95rem,8.5cqi,1.5rem)] font-bold text-white">{name}</span>
                <span className="mt-1 block text-sm text-white/85 leading-relaxed">{line}</span>
              </span>
            </motion.a>
          ))}
        </div>
      </Section>
    </motion.main>
  );
};

/* ============================== The Service ============================== */
const SRV_LINKS = [
  { label: 'Breathe', id: 'breathe' },
  { label: 'Practice', id: 'practice' },
  { label: 'Style', id: 'style' },
  { label: 'Travel', id: 'travel' },
  { label: 'Community', id: 'community' },
];

// Box breathing: in, hold, out, hold, four seconds each
const PHASES = [
  { label: 'Breathe in', scale: 1 },
  { label: 'Hold', scale: 1 },
  { label: 'Breathe out', scale: 0.55 },
  { label: 'Hold', scale: 0.55 },
];

const BreatheWidget = () => {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(4);
  const [rounds, setRounds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setCount((c) => {
        if (c > 1) return c - 1;
        setPhase((p) => {
          const next = (p + 1) % 4;
          if (next === 0) setRounds((r) => r + 1);
          return next;
        });
        return 4;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);
  const toggle = () => {
    if (running) { setRunning(false); return; }
    setPhase(0); setCount(4); setRunning(true);
  };
  const p = PHASES[phase];
  return (
    <Glass className="p-6 sm:p-8">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="text-center md:text-left">
          <IconChip Icon={Wind} />
          <h3 className="font-display mt-4 text-2xl sm:text-3xl font-bold text-white">Take a breath with me.</h3>
          <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed max-w-md mx-auto md:mx-0">
            This is how I start most mornings and reset most afternoons. Four counts in, four to hold, four out, four to hold. Try a few rounds before you scroll on.
          </p>
          <button onClick={toggle}
            className="btn-pill btn-solid mt-6 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold tracking-wide text-royal-blue">
            {running ? <><Pause size={16} /> Pause</> : <><Play size={16} /> {rounds ? 'Keep going' : 'Start breathing'}</>}
          </button>
          {rounds > 0 && <p className="mt-3 text-xs text-[#c8c9c7]">{rounds} {rounds === 1 ? 'round' : 'rounds'} complete</p>}
        </div>
        <div className="relative mx-auto aspect-square w-[min(16rem,70vw)]">
          <span aria-hidden="true" className="absolute inset-0 rounded-full border border-white/20" />
          <span aria-hidden="true" className="absolute inset-[22%] rounded-full border border-dashed border-white/20" />
          <motion.span aria-hidden="true" className="absolute inset-0 rounded-full bg-gradient-to-br from-white/60 to-white/10 shadow-[0_0_60px_rgba(255,255,255,0.35)]"
            animate={{ scale: running ? p.scale : [0.6, 0.68, 0.6] }}
            transition={running ? { duration: phase % 2 === 0 ? 4 : 0.3, ease: 'easeInOut' } : { duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center" aria-live="polite">
            <p className="font-display text-xl font-bold text-white drop-shadow">{running ? p.label : 'Ready'}</p>
            {running && <p className="font-display text-5xl font-extrabold text-white tabular-nums drop-shadow">{count}</p>}
          </div>
        </div>
      </div>
    </Glass>
  );
};

const PRACTICE = [
  { Icon: Dumbbell, t: 'Strength', d: 'Lifting keeps me honest about what I am capable of. The weight does not care how my day went.' },
  { Icon: Flower2, t: 'Yoga', d: 'Where strength meets patience. Some days a hard flow, some days a long hold and gratitude. I always roll the mat up steadier.' },
  { Icon: Sparkles, t: 'Meditation', d: 'A few quiet minutes before the world starts asking for answers. It softens my reactions and sharpens my focus.' },
  { Icon: HeartPulse, t: 'Therapy', d: 'Taking care of my mind is not optional. It keeps my perspective honest and my presence real.' },
];

const ROTATION = ['Retros first', 'Anything royal blue', 'Worn, not shelved', 'Release-day kid'];

// Original art: a globe with flight paths and a plane that loops along one of them
const TravelArt = () => (
  <svg aria-hidden="true" viewBox="0 0 400 260" className="h-full w-full">
    <g fill="none" stroke="white">
      <circle cx="200" cy="300" r="210" strokeOpacity="0.18" />
      <ellipse cx="200" cy="300" rx="210" ry="80" strokeOpacity="0.12" />
      <ellipse cx="200" cy="300" rx="120" ry="210" strokeOpacity="0.12" />
      <ellipse cx="200" cy="300" rx="40" ry="210" strokeOpacity="0.1" />
      <path id="flight-a" d="M40 210 Q140 40 360 120" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="4 8" />
      <path d="M70 230 Q220 90 330 200" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="3 7" />
      <circle cx="40" cy="210" r="5" fill="white" fillOpacity="0.6" stroke="none" />
      <circle cx="360" cy="120" r="5" fill="white" fillOpacity="0.6" stroke="none" />
      <circle cx="330" cy="200" r="4" fill="white" fillOpacity="0.4" stroke="none" />
    </g>
    <g>
      <path d="M-9 -3 L9 0 L-9 3 L-6 0 Z" fill="white" />
      <animateMotion dur="7s" repeatCount="indefinite" rotate="auto">
        <mpath href="#flight-a" />
      </animateMotion>
    </g>
  </svg>
);

// Original art: a lotus that breathes inside slow rings, for the Service page opener
const LotusArt = () => (
  <>
    <Halo speed={110} />
    <motion.span aria-hidden="true" className="absolute inset-[10%] rounded-full bg-white/10 shadow-[0_0_80px_rgba(255,255,255,0.25)]"
      animate={{ scale: [0.9, 1.04, 0.9] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
    <motion.svg aria-hidden="true" viewBox="0 0 200 200" className="absolute inset-[16%] h-[68%] w-[68%]"
      animate={{ scale: [0.94, 1.04, 0.94] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}>
      <g fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round">
        <path d="M100 150 C76 120 76 76 100 40 C124 76 124 120 100 150 Z" fillOpacity="0.9" />
        <path d="M100 150 C64 142 40 112 42 74 C70 84 92 112 100 150 Z" fillOpacity="0.55" />
        <path d="M100 150 C136 142 160 112 158 74 C130 84 108 112 100 150 Z" fillOpacity="0.55" />
        <path d="M100 152 C58 156 26 136 16 108 C46 108 80 126 100 152 Z" fillOpacity="0.28" />
        <path d="M100 152 C142 156 174 136 184 108 C154 108 120 126 100 152 Z" fillOpacity="0.28" />
      </g>
      <path d="M36 172 Q100 158 164 172 M58 186 Q100 176 142 186" fill="none" stroke="white" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
    </motion.svg>
  </>
);

export const ServicePage = () => (
  <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-14">
    <JumpBar id="srv" links={SRV_LINKS} />

    <PageTop label="The Service" title="Balance feels earned."
      lead="It lives somewhere between discipline and joy, between taking care of myself and still having fun. Service starts there."
      side={<LotusArt />}>
      <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-2">
        {[{ Icon: Flower2, t: 'Yoga' }, { Icon: Sparkles, t: 'Meditation' }, { Icon: Footprints, t: 'Air Jordans' }, { Icon: Sunrise, t: 'Faith' }].map(({ Icon, t }) => (
          <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/[0.07] py-1 pl-1 pr-3 text-xs font-bold tracking-wide text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-royal-blue"><Icon size={14} /></span>{t}
          </span>
        ))}
      </div>
    </PageTop>

    <Section id="breathe">
      <SectionHead title="Breath First" note="Everything else second." />
      <BreatheWidget />
    </Section>

    <Section id="practice">
      <SectionHead title="My Daily Practice" note="None of it is trendy. All of it is necessary." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {PRACTICE.map(({ Icon, t, d }, i) => (
          <Glass key={t} delay={i * 0.06} className="p-5 sm:p-6">
            <motion.span className="inline-flex" animate={{ y: [0, -4, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}>
              <IconChip Icon={Icon} />
            </motion.span>
            <h3 className="font-display mt-4 text-xl font-bold text-white">{t}</h3>
            <p className="mt-2 text-sm text-white/85 leading-relaxed">{d}</p>
          </Glass>
        ))}
      </div>
    </Section>

    <Section id="style">
      <SectionHead title="Air Jordans and the Hunt" />
      <Glass className="grid md:grid-cols-2">
        <div className="relative h-64 md:h-auto min-h-[16rem] overflow-hidden">
          <motion.img src="https://lh3.googleusercontent.com/d/19I2Izijp1jMdeVZgewWrnqxCDylxasxP" alt="Royal blue Air Jordan 1s"
            className="absolute inset-0 h-full w-full object-cover" referrerPolicy="no-referrer" loading="lazy"
            initial={{ scale: 1.12 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.6, ease: [0.2, 0.8, 0.2, 1] }} />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-royal-blue/60 to-transparent md:bg-gradient-to-r md:from-transparent md:to-royal-blue/30" />
        </div>
        <div className="p-6 sm:p-8">
          <p className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">Every pair carries a memory.</p>
          <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed">
            Sneakerhead, always have been. The retros I wanted long before I could buy them, the colorways that defined a season, and anything in royal blue. I wear them, I take care of them, and I still get excited on release day.
          </p>
          <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed">
            I love the hunt just as much: a thrift find, a promo code before it disappears, a deal thread at midnight. Part nostalgia, part strategy, all fun.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {ROTATION.map((r, i) => (
              <motion.span key={r} initial={{ opacity: 0, scale: 0.7 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.08, type: 'spring', stiffness: 400, damping: 18 }}
                className="rounded-full border border-white/25 bg-white/[0.07] px-3 py-1.5 text-xs font-bold tracking-wide text-white">{r}</motion.span>
            ))}
          </div>
        </div>
      </Glass>
    </Section>

    <Section id="travel">
      <SectionHead title="On the Move" />
      <Glass className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center">
        <div className="h-52 sm:h-64 px-2 pt-4 md:order-2"><TravelArt /></div>
        <div className="p-6 sm:p-8 md:order-1">
          <IconChip Icon={Plane} />
          <p className="font-display mt-4 text-2xl sm:text-3xl font-bold text-white leading-tight">The world is bigger than any room I walk into.</p>
          <p className="mt-3 text-sm sm:text-base text-white/85 leading-relaxed">
            New places reset my thinking. A different city, a different table, a different way of seeing the same problem. I come home curious every time.
          </p>
        </div>
      </Glass>
    </Section>

    <Section id="community">
      <SectionHead title="In the Community" note="Brotherhood, scholarship and service are how I show up." />
      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { Icon: Users, t: 'Welcoming new brothers', d: 'Leading Membership Intake for Omicron Sigma and initiating three new brothers in my twenty-fifth year.' },
          { Icon: GraduationCap, t: 'Opening doors', d: 'Someone invested in me before I earned it. Mentoring and sharing what I know is how I pay that forward.' },
          { Icon: Handshake, t: 'Tech for good', d: 'Helping a member organization move its voting, membership and support work online so volunteers can focus on people.' },
        ].map(({ Icon, t, d }, i) => (
          <Glass key={t} delay={i * 0.08} className="p-5 sm:p-6">
            <IconChip Icon={Icon} />
            <h3 className="font-display mt-4 text-lg sm:text-xl font-bold text-white">{t}</h3>
            <p className="mt-2 text-sm text-white/85 leading-relaxed">{d}</p>
          </Glass>
        ))}
      </div>
    </Section>
  </motion.main>
);
