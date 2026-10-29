// © MrJackDee™. All rights reserved.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, CreditCard, ExternalLink, Flower2, Footprints, Headphones, Heart, Landmark, Newspaper, Pause, Play, PlayCircle, RefreshCw, Rss, Sparkles, Users, Vote } from 'lucide-react';

// "There's Something Special Going on in Phi Beta Sigma": a self-advancing carousel of
// Phi Beta Sigma headlines, official YouTube videos and podcast episodes.
// Source: geauxmab.com/api/news (site-worker/index.ts), cached at the edge for 30 minutes.
// If that endpoint is not reachable yet, headlines fall back to Google News through a public relay.

type Kind = 'news' | 'video' | 'podcast';
type NewsItem = { type: Kind; title: string; link: string; source: string; date: string; image?: string; summary?: string; topic?: string };

const ADVANCE_MS = 6000;

const readCache = (CACHE_KEY: string, CACHE_MS: number): NewsItem[] | null => {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; items: NewsItem[] };
    return Date.now() - parsed.at > CACHE_MS ? null : parsed.items;
  } catch {
    return null;
  }
};
const writeCache = (CACHE_KEY: string, items: NewsItem[]) => {
  try { window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items })); } catch { /* storage blocked */ }
};

/* ---- Fallback: headlines only, read in the browser through a public relay ---- */
const FALLBACK_FEED = 'https://news.google.com/rss/search?q=%22Phi+Beta+Sigma%22+OR+%22Sigma+Beta+Club%22&hl=en-US&gl=US&ceid=US:en';
const MUST_MATCH = /phi beta sigma|sigma beta club|\bsigmas?\b.*fraternity/i;
const BLOCK = /hazing|lawsuit|sued|arrest|charged|killed|death|died|shooting|police|assault|suspend|investigat|scandal|indict|fraud/i;
const fallback = async (): Promise<NewsItem[]> => {
  const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(FALLBACK_FEED)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('feed unavailable');
  const doc = new DOMParser().parseFromString(await res.text(), 'text/xml');
  return Array.from(doc.querySelectorAll('item')).map((item) => {
    const source = item.querySelector('source')?.textContent?.trim() || 'News';
    let title = item.querySelector('title')?.textContent?.trim() || '';
    if (title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    return { type: 'news' as const, title, source, link: item.querySelector('link')?.textContent?.trim() || '', date: new Date(item.querySelector('pubDate')?.textContent || 0).toISOString() };
  }).filter((i) => i.title && i.link && MUST_MATCH.test(i.title) && !BLOCK.test(i.title)).slice(0, 8);
};

const fetchFeed = async (endpoint: string, useFallback: boolean): Promise<NewsItem[]> => {
  try {
    const r = await fetch(endpoint, { cache: 'no-store' });
    const d = await r.json();
    // Topic stories from /api/following carry no type; they are headlines
    if (r.ok && d.items?.length) return (d.items as NewsItem[]).map((i) => ({ ...i, type: i.type || 'news' }));
  } catch { /* fall through */ }
  if (!useFallback) throw new Error('feed unavailable');
  const items = await fallback();
  if (!items.length) throw new Error('feed unavailable');
  return items;
};

const timeAgo = (iso: string) => {
  const d = new Date(iso);
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const TOPIC_ICON: Record<string, typeof Newspaper> = {
  'Politics': Landmark, 'Black Politics': Vote, 'DEI': Users, 'LGBTQ+ Rights': Heart, 'AI': Sparkles,
  'Credit & Points': CreditCard, 'Air Jordans': Footprints, 'Yoga & Meditation': Flower2,
};

const KIND: Record<Kind, { label: string; action: string; Icon: typeof Newspaper }> = {
  news: { label: 'News', action: 'Read the story', Icon: Newspaper },
  video: { label: 'Video', action: 'Watch', Icon: PlayCircle },
  podcast: { label: 'Podcast', action: 'Listen', Icon: Headphones },
};
const FILTERS: { id: 'all' | Kind; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'news', label: 'News' }, { id: 'video', label: 'Videos' }, { id: 'podcast', label: 'Podcasts' },
];

const Card = ({ item }: { item: NewsItem }) => {
  const { action, Icon: KindIcon } = KIND[item.type];
  const label = item.topic || KIND[item.type].label;
  const Icon = item.topic ? TOPIC_ICON[item.topic] || Newspaper : KindIcon;
  return (
    <a href={item.link} target="_blank" rel="noopener noreferrer"
      className="glass group relative flex h-full flex-col overflow-hidden rounded-[28px] hover:border-white/60 transition-colors">
      <div aria-hidden="true" className="absolute inset-x-8 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="relative aspect-[16/9] overflow-hidden bg-royal-blue">
        {item.image ? (
          <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          // Headlines have no artwork: a branded panel with the seal and the outlet name
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-royal-blue to-[#0e335e]">
            {!item.topic && <img src="/img/pbs-seal-watermark.webp" alt="" className="absolute inset-0 m-auto h-[140%] w-auto opacity-15" />}
            <Icon size={28} className="relative text-white/80" />
            <span className="relative px-4 text-center text-sm font-bold text-white">{item.source}</span>
          </div>
        )}
        {item.type !== 'news' && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/10">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-royal-blue shadow-lg transition-transform group-hover:scale-110">
              {item.type === 'video' ? <Play size={22} className="ml-1" fill="currentColor" /> : <Headphones size={22} />}
            </span>
          </span>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold tracking-wide text-royal-blue shadow">
          <Icon size={12} /> {label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 text-left">
        <p className="flex items-center justify-between gap-3 text-[11px] font-bold tracking-wide text-[#c8c9c7]">
          <span className="truncate">{item.source}</span>
          <span className="shrink-0">{timeAgo(item.date)}</span>
        </p>
        <h3 className="mt-2 line-clamp-3 font-bold leading-snug text-white">{item.title}</h3>
        <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-white">
          {action} <ExternalLink size={13} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </a>
  );
};

type FeedConfig = {
  endpoint: string; cacheKey: string; cacheMs: number; fallback: boolean;
  badge: string; title: string; sub: string; id: string; rss?: string;
  emptyLink: { href: string; label: string };
};

const FeedCarousel = ({ cfg }: { cfg: FeedConfig }) => {
  const [items, setItems] = useState<NewsItem[] | null>(() => readCache(cfg.cacheKey, cfg.cacheMs));
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);

  const load = async (force = false) => {
    if (!force && readCache(cfg.cacheKey, cfg.cacheMs)) return;
    setRefreshing(true);
    try {
      const fresh = await fetchFeed(cfg.endpoint, cfg.fallback);
      setItems(fresh); setFailed(false); writeCache(cfg.cacheKey, fresh);
    } catch {
      setFailed(true);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), cfg.cacheMs);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Only auto-advance while the carousel is on screen
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const groupOf = (i: NewsItem) => i.topic || i.type;
  const list = (items || []).filter((i) => filter === 'all' || groupOf(i) === filter);
  // Filter chips: topics for the interests feed, News / Videos / Podcasts for the Sigma feed
  const chips = [{ id: 'all', label: 'All' }, ...(items?.some((i) => i.topic)
    ? [...new Set((items || []).map((i) => i.topic!))].map((t) => ({ id: t, label: t }))
    : FILTERS.filter((f) => f.id !== 'all' && (items || []).some((i) => i.type === f.id)))];

  const goTo = useCallback((i: number) => {
    const el = track.current;
    if (!el || !list.length) return;
    const n = (i + list.length) % list.length;
    const card = el.children[n] as HTMLElement | undefined;
    if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' });
    setActive(n);
  }, [list.length]);

  useEffect(() => { setActive(0); track.current?.scrollTo({ left: 0 }); }, [filter]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (paused || !visible || reduce || list.length < 2) return;
    const t = setTimeout(() => goTo(active + 1), ADVANCE_MS);
    return () => clearTimeout(t);
  }, [active, paused, visible, list.length, goTo]);

  // Keep the dots in sync when people swipe
  const onScroll = () => {
    const el = track.current;
    if (!el) return;
    const kids = Array.from(el.children) as HTMLElement[];
    const x = el.scrollLeft + 8;
    let n = 0;
    kids.forEach((k, i) => { if (k.offsetLeft - el.offsetLeft <= x) n = i; });
    if (n !== active) setActive(n);
  };

  return (
    <section ref={section} className="pt-12 md:pt-16" aria-labelledby={cfg.id}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 border border-white/30 rounded-full">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[11px] font-bold text-white tracking-wide">{cfg.badge}</span>
            </span>
            <span className="flex gap-2">
              {cfg.rss && (
                <a href={cfg.rss} target="_blank" rel="noopener noreferrer" aria-label="Subscribe by RSS"
                  className="tap-target glass w-10 h-10 rounded-full text-white flex items-center justify-center hover:bg-white hover:text-royal-blue transition-colors">
                  <Rss size={16} />
                </a>
              )}
              <button onClick={() => load(true)} disabled={refreshing} aria-label="Refresh"
                className="tap-target glass w-10 h-10 rounded-full text-white flex items-center justify-center hover:bg-white hover:text-royal-blue transition-colors disabled:opacity-60">
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </span>
          </div>
          <h2 id={cfg.id} className="mt-4 font-display text-display font-extrabold text-white tracking-tight">{cfg.title}</h2>
          <p className="text-white/80 mt-2 text-sm md:text-base max-w-2xl">{cfg.sub}</p>
        </motion.div>

        {items && items.length > 0 && (
          // Segmented control: the white indicator slides to the chosen filter
          <div className="mt-5 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="glass inline-flex min-w-max gap-1 rounded-full p-1" role="tablist" aria-label="Show">
              {chips.map((f) => {
                const on = filter === f.id;
                return (
                  <button key={f.id} role="tab" aria-selected={on} onClick={() => setFilter(f.id)}
                    className={`relative h-9 px-4 rounded-full text-[11px] sm:text-xs font-bold tracking-wide whitespace-nowrap transition-colors ${on ? 'text-royal-blue' : 'text-white/85 hover:text-white'}`}>
                    {on && <motion.span layoutId={`seg-${cfg.id}`} className="absolute inset-0 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.45)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                    <span className="relative">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {items === null && !failed ? (
          <div className="mt-6 flex gap-4 overflow-hidden" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="h-80 w-[82%] sm:w-[46%] lg:w-[31%] shrink-0 rounded-[28px] bg-white/[0.06]"
                animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }} />
            ))}
          </div>
        ) : list.length > 0 ? (
          <div className="relative mt-6"
            onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
            <div ref={track} onScroll={onScroll}
              className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-0 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-roledescription="carousel" aria-label={cfg.title}>
              {list.map((item, i) => (
                <div key={item.link + i} className="snap-start shrink-0 w-[82%] sm:w-[46%] lg:w-[31%]"
                  aria-roledescription="slide" aria-label={`${i + 1} of ${list.length}`}>
                  <Card item={item} />
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button onClick={() => goTo(active - 1)} aria-label="Previous"
                className="tap-target w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-royal-blue transition-colors">
                <ChevronLeft size={18} />
              </button>
              {/* Dots for short lists; a "3 / 27" counter keeps long lists inside small screens */}
              {list.length <= 8 ? (
                <div className="flex items-center gap-1.5" aria-hidden="true">
                  {list.map((_, i) => (
                    <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-6 bg-white' : 'w-1.5 bg-white/35'}`} />
                  ))}
                </div>
              ) : (
                <span className="min-w-[4.5rem] text-center text-xs font-bold tabular-nums tracking-wide text-white/85" aria-live="polite">
                  {active + 1} / {list.length}
                </span>
              )}
              <button onClick={() => goTo(active + 1)} aria-label="Next"
                className="tap-target w-10 h-10 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-royal-blue transition-colors">
                <ChevronRight size={18} />
              </button>
              <button onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Resume auto-play' : 'Pause auto-play'}
                className="tap-target ml-1 w-10 h-10 rounded-full text-white/80 flex items-center justify-center hover:text-white">
                {paused ? <Play size={16} /> : <Pause size={16} />}
              </button>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass mt-6 p-8 rounded-[28px] text-center text-white">
              <p className="mb-5">Headlines are taking a breather. Catch the latest straight from the source.</p>
              <a href={cfg.emptyLink.href} target="_blank" rel="noopener noreferrer"
                className="btn-pill btn-solid inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-royal-blue font-bold tracking-wide text-xs">
                {cfg.emptyLink.label} <ExternalLink size={14} />
              </a>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
};

const NewsFeed = () => (
  <FeedCarousel cfg={{
    id: 'sigma-news-heading', endpoint: '/api/news', cacheKey: 'geauxmab_news_v2', cacheMs: 30 * 60 * 1000, fallback: true,
    badge: 'Live Feed', title: "There's Something Special Going on in Phi Beta Sigma",
    sub: 'The latest news, videos and podcasts from across the fraternity.',
    emptyLink: { href: 'https://phibetasigma1914.org/', label: 'Visit PhiBetaSigma1914.org' },
  }} />
);

// Stories from the last 5 days on the topics Jack follows; rebuilt on the server every 6 hours
export const FollowingFeed = () => (
  <FeedCarousel cfg={{
    id: 'following-heading', endpoint: '/api/following', cacheKey: 'geauxmab_following_v1', cacheMs: 60 * 60 * 1000, fallback: false,
    badge: 'Updated Daily', title: 'What Jack Dee Is Following',
    sub: 'Politics, Black politics, DEI, LGBTQ+ rights, AI, credit and points, Air Jordans, yoga and meditation. Only stories from the last five days.',
    rss: '/api/following.xml',
    emptyLink: { href: 'https://news.google.com/', label: 'Browse Google News' },
  }} />
);

export default NewsFeed;
