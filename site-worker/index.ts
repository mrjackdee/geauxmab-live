// © MrJackDee™. All rights reserved.
// Cloudflare Worker for geauxmab.com (routes: geauxmab.com/api/*, geauxmab.com/journal/*).
// The site itself stays static on Hostinger; this Worker only answers these paths:
//   GET  /api/news                  Phi Beta Sigma news, videos and podcasts (cached 30 min)
//   GET  /api/following             "What Jack Dee is following": last-5-day news on his interests (cached 6 h)
//   GET  /api/following.xml         the same as an RSS feed
//   GET  /api/journal               published journal entries (newest first)
//   GET  /api/journal/:slug         one entry
//   GET  /journal/rss.xml           journal RSS feed
//   GET  /api/journal/admin/login   behind Cloudflare Access; sends the author to the write page
//   GET  /api/journal/admin/me      who is signed in
//   POST /api/journal/admin         publish an entry
//   PUT  /api/journal/admin/:slug   update an entry
//   DELETE /api/journal/admin/:slug remove an entry
// /os and every other path never reach this Worker.

export interface KV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  JOURNAL: KV;
  JOURNAL_AUTHOR: string;         // the only email allowed to write, e.g. jd@geauxmab.com
  ACCESS_TEAM_DOMAIN?: string;    // e.g. geauxmab.cloudflareaccess.com
  ACCESS_AUD?: string;            // Cloudflare Access application audience tag
  SITE_URL?: string;              // https://geauxmab.com
  DEV?: string;                   // '1' only in local dev: skips the Access check
}

const SITE = (env: Env) => env.SITE_URL || 'https://geauxmab.com';

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
  });

/* ---------------- Small XML helpers (Workers have no DOMParser) ---------------- */
const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .trim();
const tag = (block: string, name: string) => {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1]) : '';
};
const attr = (block: string, name: string, a: string) => {
  const m = block.match(new RegExp(`<${name}\\s[^>]*${a}="([^"]+)"`, 'i'));
  return m ? decode(m[1]) : '';
};
const blocks = (xml: string, name: string) => xml.match(new RegExp(`<${name}[\\s>][\\s\\S]*?</${name}>`, 'gi')) || [];
const stripHtml = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------------- News ---------------- */
export type NewsItem = { type: 'news' | 'video' | 'podcast'; title: string; link: string; source: string; date: string; image?: string; summary?: string };

const GOOGLE_NEWS = 'https://news.google.com/rss/search?q=%22Phi+Beta+Sigma%22+OR+%22Sigma+Beta+Club%22+OR+%22Phi+Beta+Sigma+Fraternity%22&hl=en-US&gl=US&ceid=US:en';
// Official Phi Beta Sigma Fraternity, Inc. YouTube channel
const YOUTUBE_CHANNELS = ['UCPq0pkVd7QZem1B5FAbhQHQ'];
const PODCASTS = [
  'https://feed.podbean.com/thecrescentpodcast/feed.xml', // The Crescent Podcast (official)
  'https://anchor.fm/s/e20d9034/podcast/rss',             // Code Blu: A Sigma Podcast
];
const MUST_MATCH = /phi beta sigma|sigma beta club|\bsigmas?\b.*fraternity|\bΦΒΣ\b/i;
const BLOCK = /hazing|lawsuit|sued|arrest|charged|killed|death|died|shooting|police|assault|suspend|investigat|scandal|indict|fraud/i;

const fetchText = async (url: string) => {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': 'Mozilla/5.0 (compatible; GeauxMAB/1.0; +https://geauxmab.com)' } });
    if (!r.ok) throw new Error(String(r.status));
    return await r.text();
  } finally { clearTimeout(t); }
};

const googleNews = async (): Promise<NewsItem[]> => {
  const xml = await fetchText(GOOGLE_NEWS);
  return blocks(xml, 'item').map((b) => {
    const source = tag(b, 'source') || 'News';
    let title = tag(b, 'title');
    if (title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    return { type: 'news' as const, title, link: tag(b, 'link'), source, date: new Date(tag(b, 'pubDate')).toISOString() };
  }).filter((i) => MUST_MATCH.test(i.title) || /phi beta sigma/i.test(i.source));
};

const youtube = async (id: string): Promise<NewsItem[]> => {
  const xml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
  const channel = tag(xml.split('<entry')[0], 'title');
  return blocks(xml, 'entry').map((b) => ({
    type: 'video' as const,
    title: tag(b, 'title'),
    link: attr(b, 'link', 'href'),
    source: channel || 'YouTube',
    date: new Date(tag(b, 'published')).toISOString(),
    image: attr(b, 'media:thumbnail', 'url'),
  }));
};

const podcast = async (url: string): Promise<NewsItem[]> => {
  const xml = await fetchText(url);
  const head = xml.split(/<item[\s>]/)[0];
  const show = tag(head, 'title');
  const art = attr(head, 'itunes:image', 'href');
  return blocks(xml, 'item').map((b) => ({
    type: 'podcast' as const,
    title: tag(b, 'title'),
    link: tag(b, 'link') || attr(b, 'enclosure', 'url'),
    source: show || 'Podcast',
    date: new Date(tag(b, 'pubDate')).toISOString(),
    image: attr(b, 'itunes:image', 'href') || art,
    summary: stripHtml(tag(b, 'description')).slice(0, 180),
  }));
};

// Newest first, but woven so videos and podcasts show up between headlines
const weave = (groups: Record<NewsItem['type'], NewsItem[]>, max = 14) => {
  const order: NewsItem['type'][] = ['news', 'video', 'news', 'podcast'];
  const out: NewsItem[] = [];
  const idx = { news: 0, video: 0, podcast: 0 };
  for (let guard = 0; out.length < max && guard < 200; guard++) {
    const t = order[guard % order.length];
    const item = groups[t][idx[t]++];
    if (item) out.push(item);
    if (Object.keys(idx).every((k) => idx[k as NewsItem['type']] >= groups[k as NewsItem['type']].length)) break;
  }
  return out;
};

export const collectNews = async (): Promise<NewsItem[]> => {
  const results = await Promise.allSettled([googleNews(), ...YOUTUBE_CHANNELS.map(youtube), ...PODCASTS.map(podcast)]);
  const all = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .filter((i) => i.title && i.link && !Number.isNaN(Date.parse(i.date)) && !BLOCK.test(i.title));
  const seen = new Set<string>();
  const unique = all.filter((i) => { const k = i.title.toLowerCase().slice(0, 60); if (seen.has(k)) return false; seen.add(k); return true; });
  const byDate = (a: NewsItem, b: NewsItem) => Date.parse(b.date) - Date.parse(a.date);
  return weave({
    news: unique.filter((i) => i.type === 'news').sort(byDate).slice(0, 8),
    video: unique.filter((i) => i.type === 'video').sort(byDate).slice(0, 4),
    podcast: unique.filter((i) => i.type === 'podcast').sort(byDate).slice(0, 3),
  });
};

let memo: { at: number; items: NewsItem[] } | null = null; // per-isolate cache; edge cache below covers the rest
const NEWS_TTL = 30 * 60;

const news = async (request: Request, ctx?: { waitUntil(p: Promise<unknown>): void }) => {
  if (memo && Date.now() - memo.at < NEWS_TTL * 1000) return json({ items: memo.items }, 200, { 'cache-control': `public, max-age=${NEWS_TTL}` });
  const cache = (globalThis as unknown as { caches?: { default: Cache } }).caches?.default;
  const key = new Request(new URL('/api/news', request.url).toString());
  const hit = cache && await cache.match(key);
  if (hit) return hit;
  const items = await collectNews();
  if (!items.length) return json({ items: [], error: 'Headlines are taking a breather.' }, 502);
  memo = { at: Date.now(), items };
  const res = json({ items }, 200, { 'cache-control': `public, max-age=${NEWS_TTL}` });
  if (cache) { const p = cache.put(key, res.clone()); ctx ? ctx.waitUntil(p) : await p; }
  return res;
};

/* ---------------- What Jack Dee is following ---------------- */
// One Google News search per interest, limited to the last 5 days. Cached for 6 hours, so the
// feed rebuilds itself several times a day without anyone touching it.
export type FollowItem = { topic: string; title: string; link: string; source: string; date: string };

const TOPICS: { topic: string; q: string }[] = [
  { topic: 'Politics', q: '"Democrats" OR "Democratic Party" OR "Congress" national politics' },
  { topic: 'Black Politics', q: '"Black voters" OR "Congressional Black Caucus" OR "Black political"' },
  { topic: 'DEI', q: '"diversity, equity and inclusion" OR "DEI programs" OR "DEI policy"' },
  { topic: 'LGBTQ+ Rights', q: '"LGBTQ rights" OR "transgender rights" OR "LGBTQ" policy' },
  { topic: 'AI', q: 'ChatGPT OR OpenAI OR "Anthropic Claude" OR "Google Gemini" new features' },
  { topic: 'AI', q: '"AI adoption" OR "generative AI" enterprise' },
  { topic: 'Credit & Points', q: '"credit score" OR "credit card" bonus OR "credit card churning" OR "travel points"' },
  { topic: 'Air Jordans', q: '"Air Jordan" OR "Jordan Brand" release' },
  { topic: 'Yoga & Meditation', q: '"yoga" OR "meditation" benefits OR practice OR mindfulness' },
];
// Headlines must actually be about the topic (Google News matches article bodies too)
const MUST: Record<string, RegExp> = {
  'DEI': /DEI|diversity|equity|inclusion/i,
  'Air Jordans': /jordan/i,
  'Yoga & Meditation': /yoga|meditat|mindful/i,
  'LGBTQ+ Rights': /lgbt|gay|lesbian|trans|queer|pride|same-sex|gender/i,
  'Credit & Points': /credit|card|points|miles|bonus|rewards|churn/i,
};
const FOLLOW_PER_TOPIC = 3;
const FOLLOW_DAYS = 5;
const FOLLOW_TTL = 6 * 60 * 60;

const topicFeed = async ({ topic, q }: { topic: string; q: string }): Promise<FollowItem[]> => {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${q} when:${FOLLOW_DAYS}d`)}&hl=en-US&gl=US&ceid=US:en`;
  const xml = await fetchText(url);
  const cutoff = Date.now() - FOLLOW_DAYS * 86400000;
  return blocks(xml, 'item').map((b) => {
    const source = tag(b, 'source') || 'News';
    let title = tag(b, 'title');
    if (title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3));
    return { topic, title, link: tag(b, 'link'), source, date: new Date(tag(b, 'pubDate')).toISOString() };
  }).filter((i) => i.title && i.link && Date.parse(i.date) >= cutoff && (!MUST[topic] || MUST[topic].test(i.title)))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
};

export const collectFollowing = async (): Promise<FollowItem[]> => {
  const results = await Promise.allSettled(TOPICS.map(topicFeed));
  const seen = new Set<string>();
  const perTopic = new Map<string, FollowItem[]>();
  results.forEach((r) => {
    if (r.status !== 'fulfilled') return;
    for (const i of r.value) {
      const k = i.title.toLowerCase().slice(0, 60);
      if (seen.has(k)) continue;
      const bucket = perTopic.get(i.topic) || [];
      if (bucket.length >= FOLLOW_PER_TOPIC * (i.topic === 'AI' ? 2 : 1)) continue;
      seen.add(k); bucket.push(i); perTopic.set(i.topic, bucket);
    }
  });
  // Round-robin across topics so the carousel shows the full range of interests
  const lists = [...perTopic.values()].map((l) => l.sort((a, b) => Date.parse(b.date) - Date.parse(a.date)));
  const out: FollowItem[] = [];
  for (let round = 0; lists.some((l) => l[round]); round++) lists.forEach((l) => { if (l[round]) out.push(l[round]); });
  return out;
};

let followMemo: { at: number; items: FollowItem[] } | null = null;

const following = async (request: Request, ctx?: { waitUntil(p: Promise<unknown>): void }) => {
  if (followMemo && Date.now() - followMemo.at < FOLLOW_TTL * 1000) return followMemo.items;
  const cache = (globalThis as unknown as { caches?: { default: Cache } }).caches?.default;
  const key = new Request(new URL('/api/following', request.url).toString());
  const hit = cache && await cache.match(key);
  if (hit) return ((await hit.json()) as { items: FollowItem[] }).items;
  const items = await collectFollowing();
  if (items.length) {
    followMemo = { at: Date.now(), items };
    const res = json({ items }, 200, { 'cache-control': `public, max-age=${FOLLOW_TTL}` });
    if (cache) { const p = cache.put(key, res); ctx ? ctx.waitUntil(p) : await p; }
  }
  return items;
};

const followingRss = (env: Env, items: FollowItem[]) => {
  const site = SITE(env);
  const body = items.map((i) => `    <item>
      <title>${esc(i.title)}</title>
      <link>${esc(i.link)}</link>
      <guid isPermaLink="false">${esc(i.link)}</guid>
      <pubDate>${new Date(i.date).toUTCString()}</pubDate>
      <category>${esc(i.topic)}</category>
      <source url="${esc(i.link)}">${esc(i.source)}</source>
    </item>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>What Jack Dee Is Following | GeauxMAB.com</title>
    <link>${site}/</link>
    <atom:link href="${site}/api/following.xml" rel="self" type="application/rss+xml" />
    <description>Politics, Black politics, DEI, LGBTQ+ rights, AI, credit and points, sneakers and wellness: the stories Jack Dee is reading this week.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${body}
  </channel>
</rss>`, { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
};

/* ---------------- Journal ---------------- */
export type Entry = {
  slug: string; title: string; dek: string; category: string; body: string; cover?: string;
  date: string; updated?: string; words: number;
};
type IndexRow = Omit<Entry, 'body'>;

const INDEX = 'journal:index';
const readIndex = async (env: Env): Promise<IndexRow[]> => JSON.parse((await env.JOURNAL.get(INDEX)) || '[]');
const writeIndex = (env: Env, rows: IndexRow[]) =>
  env.JOURNAL.put(INDEX, JSON.stringify(rows.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))));

const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 70) || 'entry';

// Body is plain text: blank lines split paragraphs, "## " starts a heading, "> " a pull quote,
// **bold** and *italic* are allowed. Everything else is escaped.
export const renderBody = (body: string) =>
  body.replace(/\r/g, '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).map((p) => {
    const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
    if (p.startsWith('## ')) return `<h2>${inline(p.slice(3))}</h2>`;
    if (p.startsWith('> ')) return `<blockquote>${inline(p.replace(/^> ?/gm, ''))}</blockquote>`;
    return `<p>${inline(p)}</p>`;
  }).join('\n');

const clean = (input: Record<string, unknown>) => {
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const title = str(input.title, 160);
  const body = str(input.body, 40000);
  const cover = str(input.cover, 500);
  if (!title) throw new Error('Add a headline.');
  if (!body) throw new Error('Write something before publishing.');
  if (cover && !/^https:\/\//i.test(cover)) throw new Error('The photo link must start with https://');
  return {
    title, body, cover: cover || undefined,
    dek: str(input.dek, 280),
    category: str(input.category, 40) || 'Journal',
    words: body.split(/\s+/).filter(Boolean).length,
  };
};

/* ---------------- Cloudflare Access check ---------------- */
const b64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

// Verifies the Access JWT (signature, audience, expiry) and returns the signed-in email
const accessEmail = async (request: Request, env: Env): Promise<string | null> => {
  if (env.DEV === '1') return env.JOURNAL_AUTHOR || 'dev@localhost';
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;
  try {
    const [h, p, sig] = token.split('.');
    const header = JSON.parse(new TextDecoder().decode(b64url(h)));
    const payload = JSON.parse(new TextDecoder().decode(b64url(p)));
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(env.ACCESS_AUD) || payload.exp * 1000 < Date.now()) return null;
    const certs = await (await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`)).json() as { keys: (JsonWebKey & { kid: string })[] };
    const jwk = certs.keys.find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64url(sig), new TextEncoder().encode(`${h}.${p}`));
    return ok ? String(payload.email || '').toLowerCase() : null;
  } catch {
    return null;
  }
};

const isAuthor = async (request: Request, env: Env) => {
  const email = await accessEmail(request, env);
  return !!email && email === (env.JOURNAL_AUTHOR || '').toLowerCase();
};

const rss = async (env: Env) => {
  const site = SITE(env);
  const rows = (await readIndex(env)).slice(0, 30);
  const entries = await Promise.all(rows.map(async (r) => JSON.parse((await env.JOURNAL.get(`journal:entry:${r.slug}`)) || 'null') as Entry | null));
  const items = entries.filter(Boolean).map((e) => {
    const link = `${site}/#/journal/${e!.slug}`;
    return `    <item>
      <title>${esc(e!.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="false">geauxmab-journal-${esc(e!.slug)}</guid>
      <pubDate>${new Date(e!.date).toUTCString()}</pubDate>
      <category>${esc(e!.category)}</category>
      <description>${esc(e!.dek || stripHtml(e!.body).slice(0, 240))}</description>
      <content:encoded><![CDATA[${renderBody(e!.body).replace(/]]>/g, ']]&gt;')}]]></content:encoded>
    </item>`;
  }).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Journal | Jack Dee | GeauxMAB.com</title>
    <link>${site}/#/journal</link>
    <atom:link href="${site}/journal/rss.xml" rel="self" type="application/rss+xml" />
    <description>Daily notes from Jack Dee on brotherhood, scholarship, service and life in motion.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(rows[0]?.updated || rows[0]?.date || Date.now()).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=300' } });
};

const journal = async (request: Request, env: Env, path: string) => {
  const method = request.method;
  const admin = path.startsWith('/api/journal/admin');

  if (!admin) {
    if (method !== 'GET') return json({ error: 'Not allowed' }, 405);
    const slug = path.replace(/^\/api\/journal\/?/, '');
    if (!slug) return json({ entries: await readIndex(env) }, 200, { 'cache-control': 'public, max-age=60' });
    const raw = await env.JOURNAL.get(`journal:entry:${slug}`);
    return raw ? json({ entry: JSON.parse(raw) }, 200, { 'cache-control': 'public, max-age=60' }) : json({ error: 'Entry not found' }, 404);
  }

  if (!(await isAuthor(request, env))) return json({ error: 'Sign in to write in the journal.' }, 401);

  if (path === '/api/journal/admin/login') return Response.redirect(`${SITE(env)}/#/journal/write`, 302);
  if (path === '/api/journal/admin/me') return json({ ok: true });

  const slugParam = path.replace(/^\/api\/journal\/admin\/?/, '');
  const index = await readIndex(env);

  if (method === 'POST' && !slugParam) {
    let data;
    try { data = clean(await request.json()); } catch (e) { return json({ error: e instanceof Error ? e.message : 'Bad entry' }, 400); }
    const day = new Date().toISOString().slice(0, 10);
    let slug = `${day}-${slugify(data.title)}`;
    for (let n = 2; index.some((r) => r.slug === slug); n++) slug = `${day}-${slugify(data.title)}-${n}`;
    const entry: Entry = { slug, date: new Date().toISOString(), ...data };
    await env.JOURNAL.put(`journal:entry:${slug}`, JSON.stringify(entry));
    const { body: _b, ...row } = entry;
    await writeIndex(env, [row, ...index]);
    return json({ entry }, 201);
  }

  const existing = slugParam ? await env.JOURNAL.get(`journal:entry:${slugParam}`) : null;
  if (!existing) return json({ error: 'Entry not found' }, 404);

  if (method === 'PUT') {
    let data;
    try { data = clean(await request.json()); } catch (e) { return json({ error: e instanceof Error ? e.message : 'Bad entry' }, 400); }
    const entry: Entry = { ...JSON.parse(existing), ...data, updated: new Date().toISOString() };
    await env.JOURNAL.put(`journal:entry:${slugParam}`, JSON.stringify(entry));
    const { body: _b, ...row } = entry;
    await writeIndex(env, index.map((r) => (r.slug === slugParam ? row : r)));
    return json({ entry });
  }

  if (method === 'DELETE') {
    await env.JOURNAL.delete(`journal:entry:${slugParam}`);
    await writeIndex(env, index.filter((r) => r.slug !== slugParam));
    return json({ ok: true });
  }

  return json({ error: 'Not allowed' }, 405);
};

/* ---------------- Router ---------------- */
export const handle = async (request: Request, env: Env, ctx?: { waitUntil(p: Promise<unknown>): void }) => {
  const path = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
  try {
    if (path === '/api/news') return await news(request, ctx);
    if (path === '/api/following') {
      const items = await following(request, ctx);
      return items.length ? json({ items }, 200, { 'cache-control': 'public, max-age=3600' }) : json({ items: [], error: 'Headlines are taking a breather.' }, 502);
    }
    if (path === '/api/following.xml') return followingRss(env, await following(request, ctx));
    if (path === '/journal/rss.xml' || path === '/api/journal/rss.xml') return await rss(env);
    if (path === '/api/journal' || path.startsWith('/api/journal/')) return await journal(request, env, path);
    return json({ error: 'Not found' }, 404);
  } catch {
    return json({ error: 'Something went wrong. Try again in a moment.' }, 500);
  }
};

export default {
  fetch: (request: Request, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) => handle(request, env, ctx),
};
