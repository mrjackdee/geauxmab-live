// © MrJackDee™. All rights reserved.
// The Journal: Jack Dee's daily writing, laid out like a newspaper.
// Entries come from geauxmab.com/api/journal (site-worker/index.ts) and are also published
// as RSS at geauxmab.com/journal/rss.xml. Writing happens at #/journal/write behind Cloudflare Access.
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Eye, Loader2, LogIn, PenLine, Rss, Trash2, X } from 'lucide-react';
import { ShareButton } from './SiteChrome';

export type Entry = {
  slug: string; title: string; dek: string; category: string; body?: string; cover?: string;
  date: string; updated?: string; words: number;
};

const RSS_URL = '/journal/rss.xml';
const CATEGORIES = ['Life', 'Brotherhood', 'Scholarship', 'Service', 'Leadership', 'Faith', 'Wellness', 'Style', 'Travel'];

const fullDate = (iso: string) => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(iso));
const shortDate = (iso: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
const readTime = (words: number) => `${Math.max(1, Math.round(words / 220))} min read`;

// Same light formatting the RSS feed uses: blank lines = paragraphs, "## " heading, "> " pull quote, **bold**, *italic*
const Body = ({ text, dropCap = true }: { text: string; dropCap?: boolean }) => {
  const parts = text.replace(/\r/g, '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const inline = (s: string) => s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((seg, i) =>
    seg.startsWith('**') && seg.endsWith('**') ? <strong key={i}>{seg.slice(2, -2)}</strong>
      : seg.startsWith('*') && seg.endsWith('*') && seg.length > 2 ? <em key={i}>{seg.slice(1, -1)}</em>
        : <React.Fragment key={i}>{seg.split('\n').map((line, j, a) => <React.Fragment key={j}>{line}{j < a.length - 1 && <br />}</React.Fragment>)}</React.Fragment>);
  let firstPara = true;
  return (
    <div className="journal-body">
      {parts.map((p, i) => {
        if (p.startsWith('## ')) return <h2 key={i}>{inline(p.slice(3))}</h2>;
        if (p.startsWith('> ')) return <blockquote key={i}>{inline(p.replace(/^> ?/gm, ''))}</blockquote>;
        const cls = dropCap && firstPara ? 'drop-cap' : undefined;
        firstPara = false;
        return <p key={i} className={cls}>{inline(p)}</p>;
      })}
    </div>
  );
};

const useEntries = () => {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/journal', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (alive) setEntries(d.entries || []); })
      .catch(() => { if (alive) { setEntries([]); setError(true); } });
    return () => { alive = false; };
  }, []);
  return { entries, error };
};

/* ---------------- Masthead ---------------- */
const Masthead = ({ count }: { count: number }) => (
  <header className="text-center">
    <div className="flex items-center justify-between gap-3 border-b border-royal-blue/20 pb-2 text-[11px] font-bold tracking-wide text-royal-blue/70">
      <span className="truncate">Dallas, Texas</span>
      <span className="hidden sm:inline truncate">{fullDate(new Date().toISOString())}</span>
      <span className="truncate">{count ? `${count} ${count === 1 ? 'Edition' : 'Editions'}` : 'First Edition Soon'}</span>
    </div>
    <h1 className="newspaper-head mt-4 text-5xl sm:text-6xl md:text-8xl text-royal-blue leading-none">The Journal</h1>
    <p className="mt-3 text-sm md:text-base italic text-royal-blue/80" style={{ fontFamily: 'Georgia, serif' }}>
      Daily notes from Jack Dee on brotherhood, scholarship, service and life in motion.
    </p>
    <div className="mt-4 border-y-[3px] border-double border-royal-blue/60 py-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      <span className="text-[11px] font-bold tracking-wide text-royal-blue/70 sm:hidden">{shortDate(new Date().toISOString())}</span>
      <a href={RSS_URL} target="_blank" rel="noopener noreferrer"
        className="tap-target-y inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold tracking-wide text-royal-blue hover:underline underline-offset-4">
        <Rss size={13} /> Subscribe by RSS
      </a>
    </div>
  </header>
);

// Newspaper sheet: white paper with royal-blue ink, inside the app's blue frame
const Paper = ({ children }: { children: React.ReactNode }) => (
  <div className="relative rounded-[28px] bg-white text-royal-blue shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] px-5 py-6 sm:px-8 sm:py-8 md:px-12 md:py-10 overflow-hidden">
    {children}
  </div>
);

const Byline = ({ e }: { e: Entry }) => (
  <p className="text-[11px] sm:text-xs font-bold tracking-wide text-royal-blue/60">
    By Jack Dee · {shortDate(e.date)} · {readTime(e.words)}
  </p>
);

/* ---------------- Front page ---------------- */
export const JournalPage = () => {
  const { entries, error } = useEntries();
  const [lead, ...rest] = entries || [];
  const [leadBody, setLeadBody] = useState<string | null>(null);

  useEffect(() => {
    if (!lead) return;
    fetch(`/api/journal/${lead.slug}`).then((r) => r.json()).then((d) => setLeadBody(d.entry?.body || '')).catch(() => setLeadBody(''));
  }, [lead?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // First two paragraphs of the lead story on the front page
  const teaser = useMemo(() => (leadBody || '').split(/\n{2,}/).filter((p) => p.trim() && !p.startsWith('## ')).slice(0, 2).join('\n\n'), [leadBody]);

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-3 sm:px-6 pt-6 md:pt-12 pb-12">
      <div className="max-w-6xl mx-auto">
        <Paper>
          <Masthead count={entries?.length || 0} />

          {entries === null ? (
            <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-royal-blue/60" /></div>
          ) : !lead ? (
            <div className="py-12 md:py-16 text-center max-w-xl mx-auto">
              <PenLine className="mx-auto text-royal-blue/50" size={32} />
              <h2 className="newspaper-head mt-4 text-3xl md:text-4xl">The presses are warming up.</h2>
              <p className="mt-3 text-royal-blue/75" style={{ fontFamily: 'Georgia, serif' }}>
                {error ? 'The Journal could not be reached just now. Check back shortly.' : 'The first edition is on its way. Subscribe by RSS and it will come to you.'}
              </p>
            </div>
          ) : (
            <>
              {/* Lead story */}
              <article className="mt-6 md:mt-8 grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-10 border-b border-royal-blue/20 pb-8">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold tracking-wide text-royal-blue/60">{lead.category}</p>
                  <Link to={`/journal/${lead.slug}`} className="group block">
                    <h2 className="newspaper-head mt-1 text-3xl sm:text-4xl md:text-5xl leading-[1.05] group-hover:underline decoration-2 underline-offset-4">{lead.title}</h2>
                  </Link>
                  {lead.dek && <p className="mt-3 text-lg italic text-royal-blue/80" style={{ fontFamily: 'Georgia, serif' }}>{lead.dek}</p>}
                  <div className="mt-3"><Byline e={lead} /></div>
                  {teaser && <div className="mt-4 text-royal-blue/90"><Body text={teaser} /></div>}
                  <Link to={`/journal/${lead.slug}`}
                    className="btn-pill mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-royal-blue text-white text-xs font-bold tracking-wide">
                    Continue Reading <ArrowRight size={14} />
                  </Link>
                </div>
                {lead.cover && (
                  <Link to={`/journal/${lead.slug}`} className="block order-first md:order-none">
                    <figure className="overflow-hidden rounded-2xl border border-royal-blue/15">
                      <img src={lead.cover} alt="" className="w-full aspect-[4/3] object-cover" loading="lazy" referrerPolicy="no-referrer" />
                    </figure>
                  </Link>
                )}
              </article>

              {/* More stories in newspaper columns */}
              {rest.length > 0 && (
                <section className="mt-6">
                  <h3 className="text-[11px] font-bold tracking-wide text-royal-blue/60 border-b border-royal-blue/20 pb-2">More From The Journal</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 sm:divide-x divide-royal-blue/15">
                    {rest.map((e, i) => (
                      <article key={e.slug} className={`py-5 sm:px-5 ${i % 3 === 0 ? 'lg:pl-0' : ''} border-b border-royal-blue/15`}>
                        <p className="text-[11px] font-bold tracking-wide text-royal-blue/60">{e.category}</p>
                        <Link to={`/journal/${e.slug}`} className="group block">
                          <h4 className="newspaper-head mt-1 text-2xl leading-tight group-hover:underline underline-offset-4">{e.title}</h4>
                        </Link>
                        {e.dek && <p className="mt-2 text-sm text-royal-blue/80" style={{ fontFamily: 'Georgia, serif' }}>{e.dek}</p>}
                        <div className="mt-2"><Byline e={e} /></div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </Paper>
      </div>
    </motion.main>
  );
};

/* ---------------- Article ---------------- */
export const JournalArticle = () => {
  const { slug = '' } = useParams();
  const [entry, setEntry] = useState<Entry | null | undefined>(undefined);
  const { entries } = useEntries();

  useEffect(() => {
    setEntry(undefined);
    fetch(`/api/journal/${slug}`).then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => setEntry(d.entry)).catch(() => setEntry(null));
  }, [slug]);

  useEffect(() => { if (entry) document.title = `${entry.title} | The Journal | GeauxMAB.com`; }, [entry]);

  const more = (entries || []).filter((e) => e.slug !== slug).slice(0, 3);

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-3 sm:px-6 pt-6 md:pt-12 pb-12">
      <div className="max-w-4xl mx-auto">
        <Link to="/journal" className="tap-target-y mb-4 inline-flex items-center gap-2 text-xs font-bold tracking-wide text-white/90 hover:text-white">
          <ArrowLeft size={14} /> The Journal
        </Link>
        <Paper>
          {entry === undefined ? (
            <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-royal-blue/60" /></div>
          ) : entry === null ? (
            <div className="py-12 text-center">
              <h1 className="newspaper-head text-3xl">This story could not be found.</h1>
              <Link to="/journal" className="mt-5 inline-flex items-center gap-2 text-sm font-bold underline underline-offset-4">Back to The Journal</Link>
            </div>
          ) : (
            <article>
              <p className="text-center text-[11px] font-bold tracking-wide text-royal-blue/60 border-b border-royal-blue/20 pb-2">
                The Journal · {entry.category}
              </p>
              <h1 className="newspaper-head mt-5 text-center text-4xl sm:text-5xl md:text-6xl leading-[1.05]">{entry.title}</h1>
              {entry.dek && <p className="mt-4 text-center text-lg md:text-xl italic text-royal-blue/80 max-w-2xl mx-auto" style={{ fontFamily: 'Georgia, serif' }}>{entry.dek}</p>}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 border-y border-royal-blue/20 py-3">
                <Byline e={entry} />
              </div>
              {entry.cover && (
                <figure className="mt-6 overflow-hidden rounded-2xl border border-royal-blue/15">
                  <img src={entry.cover} alt="" className="w-full max-h-[480px] object-cover" referrerPolicy="no-referrer" />
                </figure>
              )}
              <div className="mt-6 max-w-2xl mx-auto text-royal-blue/90">
                <Body text={entry.body || ''} />
                <p className="mt-8 text-right signature-text text-4xl text-royal-blue">Jack Dee</p>
              </div>
            </article>
          )}
        </Paper>

        {entry && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <ShareButton variant="pill" />
            <a href={RSS_URL} target="_blank" rel="noopener noreferrer"
              className="btn-pill btn-ghost px-8 py-4 rounded-full bg-white/5 border border-white/60 text-white font-bold tracking-wide text-xs hover:bg-white hover:text-royal-blue transition-all flex items-center gap-2">
              <Rss size={16} /> Subscribe by RSS
            </a>
          </div>
        )}

        {more.length > 0 && (
          <section className="mt-10">
            <h2 className="text-center text-xs font-bold tracking-wide text-[#c8c9c7]">More From The Journal</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {more.map((e) => (
                <Link key={e.slug} to={`/journal/${e.slug}`}
                  className="block rounded-[22px] bg-[#113b6c] border border-white/15 p-5 hover:border-white/50 transition-colors">
                  <p className="text-[11px] font-bold tracking-wide text-[#c8c9c7]">{e.category} · {shortDate(e.date)}</p>
                  <p className="newspaper-head mt-1 text-xl text-white leading-tight">{e.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </motion.main>
  );
};

/* ---------------- Home page preview ---------------- */
export const JournalLatest = () => {
  const { entries } = useEntries();
  const navigate = useNavigate();
  if (entries === null) return null;
  const latest = entries[0];
  return (
    <section className="py-12 md:py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-3">
          <span aria-hidden="true" className="h-px w-9 bg-white/40" />
          <span className="text-[11px] sm:text-xs font-bold tracking-wide text-[#c8c9c7]">From The Journal</span>
          <span aria-hidden="true" className="h-px w-9 bg-white/40" />
        </div>
        <motion.button initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          onClick={() => navigate(latest ? `/journal/${latest.slug}` : '/journal')}
          className="mt-5 block w-full text-left rounded-[28px] bg-white text-royal-blue px-5 py-6 sm:px-8 sm:py-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
          <p className="flex items-center justify-between gap-3 border-b border-royal-blue/20 pb-2 text-[11px] font-bold tracking-wide text-royal-blue/60">
            <span>The Journal</span>
            <span>{latest ? shortDate(latest.date) : 'Coming Soon'}</span>
          </p>
          <p className="newspaper-head mt-4 text-3xl sm:text-4xl leading-tight">{latest ? latest.title : 'Daily notes, coming soon.'}</p>
          <p className="mt-2 text-royal-blue/80 italic" style={{ fontFamily: 'Georgia, serif' }}>
            {latest ? latest.dek || `${latest.category} · ${readTime(latest.words)}` : 'Brotherhood, scholarship, service and life in motion, written daily.'}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold tracking-wide">
            {latest ? 'Read the Latest' : 'Visit The Journal'} <ArrowRight size={14} />
          </span>
        </motion.button>
      </div>
    </section>
  );
};

/* ---------------- Write (private) ---------------- */
const DRAFT_KEY = 'geauxmab_journal_draft';
type Draft = { title: string; dek: string; category: string; cover: string; body: string };
const EMPTY: Draft = { title: '', dek: '', category: 'Life', cover: '', body: '' };

export const JournalWrite = () => {
  const [auth, setAuth] = useState<'checking' | 'in' | 'out'>('checking');
  const [draft, setDraft] = useState<Draft>(() => {
    try { return { ...EMPTY, ...JSON.parse(window.localStorage.getItem(DRAFT_KEY) || '{}') }; } catch { return EMPTY; }
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; slug?: string } | null>(null);
  const [list, setList] = useState<Entry[]>([]);
  const navigate = useNavigate();

  const refresh = () => fetch('/api/journal', { cache: 'no-store' }).then((r) => r.json()).then((d) => setList(d.entries || [])).catch(() => {});

  useEffect(() => {
    fetch('/api/journal/admin/me', { cache: 'no-store', credentials: 'include' })
      .then((r) => setAuth(r.ok ? 'in' : 'out')).catch(() => setAuth('out'));
    refresh();
  }, []);

  // Drafts survive a closed tab or a dropped connection
  useEffect(() => {
    if (editing) return;
    try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* storage blocked */ }
  }, [draft, editing]);

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setDraft({ ...draft, [k]: e.target.value });

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(editing ? `/api/journal/admin/${editing}` : '/api/journal/admin', {
        method: editing ? 'PUT' : 'POST', credentials: 'include',
        headers: { 'content-type': 'application/json' }, body: JSON.stringify(draft),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Could not publish.');
      setMsg({ ok: true, text: editing ? 'Updated. The change is live and in the RSS feed.' : 'Published. It is live on the site and in the RSS feed.', slug: d.entry.slug });
      if (!editing) { setDraft(EMPTY); try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } }
      setEditing(null); setPreview(false);
      refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not publish.' });
    } finally { setBusy(false); }
  };

  const edit = async (slug: string) => {
    const d = await fetch(`/api/journal/${slug}`).then((r) => r.json());
    if (!d.entry) return;
    setEditing(slug);
    setDraft({ title: d.entry.title, dek: d.entry.dek || '', category: d.entry.category, cover: d.entry.cover || '', body: d.entry.body || '' });
    setMsg(null); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (slug: string, title: string) => {
    if (!window.confirm(`Remove "${title}" from the Journal and the RSS feed?`)) return;
    const r = await fetch(`/api/journal/admin/${slug}`, { method: 'DELETE', credentials: 'include' });
    if (r.ok) { refresh(); if (editing === slug) { setEditing(null); setDraft(EMPTY); } }
  };

  const input = 'w-full rounded-xl bg-white/95 text-royal-blue placeholder:text-royal-blue/50 px-4 py-3.5 text-base outline-none focus:ring-4 focus:ring-white/50 transition-shadow';
  const words = draft.body.split(/\s+/).filter(Boolean).length;

  if (auth === 'checking') return <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-white/70" /></div>;

  if (auth === 'out') {
    return (
      <main className="px-4 pt-10 pb-16">
        <div className="max-w-md mx-auto rounded-[28px] bg-[#113b6c] border border-white/15 p-8 text-center">
          <PenLine className="mx-auto text-white/80" size={32} />
          <h1 className="mt-4 text-2xl font-bold text-white">Write in The Journal</h1>
          <p className="mt-2 text-sm text-white/80">This page is only for Jack Dee. Sign in with your email to continue.</p>
          <a href="/api/journal/admin/login"
            className="btn-pill btn-solid mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-royal-blue font-bold tracking-wide text-sm">
            <LogIn size={16} /> Sign In
          </a>
        </div>
      </main>
    );
  }

  return (
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 sm:px-6 pt-6 md:pt-10 pb-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{editing ? 'Edit Entry' : 'New Entry'}</h1>
          <div className="flex gap-2">
            {editing && (
              <button onClick={() => { setEditing(null); setDraft(EMPTY); }}
                className="h-10 px-4 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5">
                <X size={14} /> Cancel
              </button>
            )}
            <button onClick={() => setPreview((p) => !p)} aria-pressed={preview}
              className="h-10 px-4 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5">
              {preview ? <PenLine size={14} /> : <Eye size={14} />} {preview ? 'Write' : 'Preview'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {msg && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status"
              className={`mt-4 px-4 py-3 rounded-xl text-sm flex flex-wrap items-center justify-between gap-2 ${msg.ok ? 'bg-emerald-400/15 border border-emerald-300/40 text-emerald-50' : 'bg-red-500/15 border border-red-300/30 text-red-100'}`}>
              <span className="flex items-center gap-2">{msg.ok && <Check size={16} />} {msg.text}</span>
              {msg.slug && <button onClick={() => navigate(`/journal/${msg.slug}`)} className="font-bold underline underline-offset-4">View it</button>}
            </motion.div>
          )}
        </AnimatePresence>

        {preview ? (
          <div className="mt-5">
            <Paper>
              <p className="text-center text-[11px] font-bold tracking-wide text-royal-blue/60 border-b border-royal-blue/20 pb-2">The Journal · {draft.category}</p>
              <h2 className="newspaper-head mt-4 text-center text-4xl leading-tight">{draft.title || 'Your headline'}</h2>
              {draft.dek && <p className="mt-3 text-center italic text-royal-blue/80" style={{ fontFamily: 'Georgia, serif' }}>{draft.dek}</p>}
              <div className="mt-6 max-w-2xl mx-auto"><Body text={draft.body || 'Start writing to see your story here.'} /></div>
            </Paper>
          </div>
        ) : (
          <form onSubmit={publish} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-[11px] font-bold tracking-wide text-white/90">Headline</span>
              <input required value={draft.title} onChange={set('title')} className={input} placeholder="What today was about" maxLength={160} />
            </label>
            <label className="block">
              <span className="mb-2 flex justify-between text-[11px] font-bold tracking-wide text-white/90">Subheadline <span className="text-white/40 font-normal">Optional</span></span>
              <input value={draft.dek} onChange={set('dek')} className={input} placeholder="One line that pulls readers in" maxLength={280} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold tracking-wide text-white/90">Section</span>
                <input list="journal-sections" value={draft.category} onChange={set('category')} className={input} maxLength={40} />
                <datalist id="journal-sections">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
              </label>
              <label className="block">
                <span className="mb-2 flex justify-between text-[11px] font-bold tracking-wide text-white/90">Photo link <span className="text-white/40 font-normal">Optional</span></span>
                <input type="url" value={draft.cover} onChange={set('cover')} className={input} placeholder="https://..." />
              </label>
            </div>
            <label className="block">
              <span className="mb-2 flex justify-between text-[11px] font-bold tracking-wide text-white/90">Story <span className="text-white/50 font-normal">{words} words · {readTime(words)}</span></span>
              <textarea required rows={14} value={draft.body} onChange={set('body')} className={`${input} leading-relaxed`}
                placeholder={'Write here. Leave a blank line between paragraphs.\n\n## A line starting with ## becomes a heading\n\n> A line starting with > becomes a pull quote\n\nUse **bold** or *italic* for emphasis.'} />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <motion.button type="submit" disabled={busy} whileTap={{ scale: 0.97 }}
                className="btn-pill btn-solid px-9 py-4 rounded-full bg-white text-royal-blue font-bold tracking-wide text-sm flex items-center gap-2 disabled:opacity-70">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />} {editing ? 'Save Changes' : 'Publish'}
              </motion.button>
              {!editing && <span className="text-[11px] text-white/60">Drafts save on this device as you type.</span>}
            </div>
          </form>
        )}

        {list.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xs font-bold tracking-wide text-[#c8c9c7]">Published</h2>
            <ul className="mt-3 space-y-2">
              {list.map((e) => (
                <li key={e.slug} className="flex items-center gap-3 rounded-2xl bg-[#113b6c] border border-white/15 px-4 py-3">
                  <button onClick={() => navigate(`/journal/${e.slug}`)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate font-bold text-white">{e.title}</span>
                    <span className="block text-[11px] text-[#c8c9c7]">{e.category} · {shortDate(e.date)}</span>
                  </button>
                  <button onClick={() => edit(e.slug)} aria-label={`Edit ${e.title}`} className="tap-target w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center"><PenLine size={15} /></button>
                  <button onClick={() => remove(e.slug, e.title)} aria-label={`Remove ${e.title}`} className="tap-target w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center"><Trash2 size={15} /></button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </motion.main>
  );
};
