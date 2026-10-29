import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ExternalLink, Newspaper, RefreshCw } from 'lucide-react';

// Live "Sigma in the News" feed.
// Source: Google News RSS search for "Phi Beta Sigma", read in the browser through a
// public CORS proxy (the site is static, so there is no server to fetch it).
// Results are cached for an hour per visitor, so the section refreshes itself.

type NewsItem = {
  title: string;
  source: string;
  link: string;
  date: Date;
};

const FEED_URL =
  'https://news.google.com/rss/search?q=%22Phi+Beta+Sigma%22+OR+%22Sigma+Beta+Club%22&hl=en-US&gl=US&ceid=US:en';

const PROXIES = [
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
];

const CACHE_KEY = 'geauxmab_news_v1';
const CACHE_MS = 60 * 60 * 1000;
const MAX_ITEMS = 6;

// Keep it on-brand: must actually be about Sigma, and skip negative headlines.
const MUST_MATCH = /phi beta sigma|sigma beta club|\bsigmas?\b.*fraternity/i;
const BLOCK = /hazing|lawsuit|sued|arrest|charged|killed|death|died|shooting|police|assault|suspend|investigat|scandal/i;

const readCache = (): NewsItem[] | null => {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; items: (Omit<NewsItem, 'date'> & { date: string })[] };
    if (Date.now() - parsed.at > CACHE_MS) return null;
    return parsed.items.map((i) => ({ ...i, date: new Date(i.date) }));
  } catch {
    return null;
  }
};

const writeCache = (items: NewsItem[]) => {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items }));
  } catch {
    // storage blocked; the feed still works, it just refetches
  }
};

const parseFeed = (xml: string): NewsItem[] => {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const seen = new Set<string>();
  return Array.from(doc.querySelectorAll('item'))
    .map((item) => {
      const source = item.querySelector('source')?.textContent?.trim() || 'News';
      let title = item.querySelector('title')?.textContent?.trim() || '';
      const suffix = ` - ${source}`;
      if (title.endsWith(suffix)) title = title.slice(0, -suffix.length);
      return {
        title,
        source,
        link: item.querySelector('link')?.textContent?.trim() || '',
        date: new Date(item.querySelector('pubDate')?.textContent || 0),
      };
    })
    .filter((i) => i.title && i.link && MUST_MATCH.test(i.title) && !BLOCK.test(i.title))
    .filter((i) => {
      const key = i.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, MAX_ITEMS);
};

const fetchFeed = async (): Promise<NewsItem[]> => {
  for (const proxy of PROXIES) {
    try {
      const res = await fetch(proxy(FEED_URL), { cache: 'no-store' });
      if (!res.ok) continue;
      const text = await res.text();
      const xml = text.trim().startsWith('{') ? (JSON.parse(text).contents as string) : text;
      const items = parseFeed(xml || '');
      if (items.length) return items;
    } catch {
      // try the next proxy
    }
  }
  throw new Error('feed unavailable');
};

const timeAgo = (d: Date) => {
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const NewsFeed = () => {
  const [items, setItems] = useState<NewsItem[] | null>(() => readCache());
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (force = false) => {
    if (!force && readCache()) return;
    setRefreshing(true);
    try {
      const fresh = await fetchFeed();
      setItems(fresh);
      setFailed(false);
      writeCache(fresh);
    } catch {
      setFailed(true);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), CACHE_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-12 md:py-16 bg-transparent" aria-labelledby="sigma-news-heading">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-transparent border border-white/30 rounded-full mb-4">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-75 animate-ping"></span>
                <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-white"></span>
              </span>
              <span className="text-[11px] font-bold text-white uppercase tracking-widest">Live Feed</span>
            </div>
            <h2 id="sigma-news-heading" className="text-4xl md:text-5xl font-bold text-blue-200 tracking-tighter">
              Sigma in the News
            </h2>
            <p className="text-white/80 mt-2 text-sm md:text-base">
              The latest Phi Beta Sigma headlines, updated automatically.
            </p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="self-start md:self-auto btn-pill btn-ghost px-7 py-3.5 rounded-full bg-white/5 border border-white/60 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/15 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {!items && !failed && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-6 bg-white rounded-3xl shadow-sm animate-pulse">
                <div className="h-3 w-24 bg-slate-200 mb-4"></div>
                <div className="h-4 w-full bg-slate-200 mb-2"></div>
                <div className="h-4 w-3/4 bg-slate-200"></div>
              </div>
            ))}
          </div>
        )}

        {items && items.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item, idx) => (
              <motion.a
                key={item.link}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
                className="group flex flex-col p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md hover:scale-[1.02] hover:border-royal-blue/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-royal-blue truncate">
                    <Newspaper size={14} className="shrink-0" /> {item.source}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 shrink-0">{timeAgo(item.date)}</span>
                </div>
                <h3 className="text-slate-900 font-bold leading-snug mb-6 group-hover:text-royal-blue transition-colors">
                  {item.title}
                </h3>
                <span className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-royal-blue">
                  Read story <ExternalLink size={12} />
                </span>
              </motion.a>
            ))}
          </div>
        )}

        {(failed && !items) || (items && items.length === 0) ? (
          <div className="p-8 bg-white/10 border border-white/20 rounded-3xl text-center text-white">
            <p className="mb-4">Headlines are taking a breather. Catch the latest straight from the source.</p>
            <a
              href="https://phibetasigma1914.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex btn-pill btn-solid px-7 py-3.5 rounded-full bg-white text-royal-blue font-bold uppercase tracking-widest text-xs transition-all items-center gap-2"
            >
              Visit PhiBetaSigma1914.org <ArrowRight size={14} />
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default NewsFeed;
