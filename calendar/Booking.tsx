// © MrJackDee™. All rights reserved.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ClockToggle, formatClock, useClock24, useViewZone, zoneLabel, ZoneLabel, UseMyTime, TAP } from './clock';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, ChevronDown, Clock, Video, Zap, ArrowRight,
  ArrowLeft, CalendarDays, Loader2, Check, RefreshCw, XCircle, Sparkles,
} from 'lucide-react';

// Custom booking flow for book.geauxmab.com.
// Availability and bookings go through the Worker's /api routes (worker/index.ts),
// which talk to Calendly server-side. Nothing here loads or links to Calendly's pages.

type Step = 'pick' | 'info' | 'done';
type Booked = { start_time: string; name: string; email: string; cancel_url?: string; reschedule_url?: string };

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix',
  'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu',
];
const EASE = [0.2, 0.8, 0.2, 1] as const;
const TERMS_VERSION = 'Terms 2026-10-29';

// US phone numbers shown and sent as ###-###-####. A leading 1 is the country code (US area codes never start with 1), so it's dropped.
const formatPhone = (raw: string) => {
  const d = raw.replace(/\D/g, '').replace(/^1/, '').slice(0, 10);
  if (d.length > 6) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return d;
};
const PHONE_OK = /^\d{3}-\d{3}-\d{4}$/;

// YYYY-MM-DD for an instant, as seen in a time zone
const dayKey = (iso: string, tz: string) => {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
  return p; // en-CA formats as YYYY-MM-DD
};
const hourIn = (iso: string, tz: string) =>
  Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(new Date(iso)));
const fmtTime = (iso: string, tz: string, h24 = false) => formatClock(iso, tz, h24);
const fmtEnd = (iso: string, tz: string, h24 = false) => fmtTime(new Date(Date.parse(iso) + 3600000).toISOString(), tz, h24);
const keyToLabel = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, d)));
};
const monthId = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, '0')}`;
const pad = (n: number) => String(n).padStart(2, '0');

/* ---------------- Progress rail ---------------- */
const STEPS: { id: Step; label: string }[] = [
  { id: 'pick', label: 'Select a Date' },
  { id: 'info', label: 'About You' },
  { id: 'done', label: 'Complete' },
];

const Progress = ({ step }: { step: Step }) => {
  const idx = STEPS.findIndex((s) => s.id === step);
  return (
    // Steps size to their labels; the connecting lines take up whatever space is left
    <div className="px-8 sm:px-12 md:px-16 pt-5 md:pt-7 pb-7">
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const state = i < idx || step === 'done' ? 'past' : i === idx ? 'now' : 'next';
          return (
            <React.Fragment key={s.id}>
              {i > 0 && (
                <div className="flex-1 mx-2 h-[3px] rounded-full bg-white/10 overflow-hidden">
                  <motion.div className="h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] origin-left"
                    initial={false} animate={{ scaleX: i <= idx ? 1 : 0 }} transition={{ duration: 0.5, ease: EASE }} />
                </div>
              )}
              <div className="relative flex flex-col items-center">
                <motion.div initial={false}
                  animate={{ scale: state === 'now' ? 1.12 : 1 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-500 ${
                    state === 'past' ? 'bg-white text-royal-blue' : state === 'now' ? 'bg-white text-royal-blue shadow-[0_0_0_5px_rgba(255,255,255,0.2),0_0_20px_rgba(255,255,255,0.6)]' : 'bg-white/10 text-[#c8c9c7] border border-white/20'}`}>
                  {state === 'past' ? <Check size={15} strokeWidth={3} /> : i + 1}
                </motion.div>
                <span className={`absolute top-full mt-2 whitespace-nowrap text-[11px] font-bold tracking-wide transition-colors ${state === 'next' ? 'text-white/40' : 'text-white'}`}>{s.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- Month grid ---------------- */
const MonthGrid = ({
  year, month, available, selected, loading, today, canPrev, onPrev, onNext, onPick,
}: {
  year: number; month: number; available: Set<string>; selected: string | null; loading: boolean; today: string;
  canPrev: boolean; onPrev: () => void; onNext: () => void; onPick: (key: string) => void;
}) => {
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const title = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month, 1)));
  const [dir, setDir] = useState(0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setDir(-1); onPrev(); }} disabled={!canPrev} aria-label="Previous month"
          className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white disabled:opacity-25 enabled:hover:bg-white enabled:hover:text-royal-blue transition-colors">
          <ChevronLeft size={18} />
        </motion.button>
        <AnimatePresence mode="wait" initial={false}>
          <motion.h3 key={title} initial={{ opacity: 0, y: dir * 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: dir * -8 }}
            className="whitespace-nowrap text-lg md:text-base lg:text-xl font-bold tracking-tight text-white">{title}</motion.h3>
        </AnimatePresence>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setDir(1); onNext(); }} aria-label="Next month"
          className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white hover:bg-white hover:text-royal-blue transition-colors">
          <ChevronRight size={18} />
        </motion.button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-bold tracking-wide text-white/70 py-1">{d}</div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={`${year}-${month}`} className="grid grid-cols-7 gap-0.5 sm:gap-1"
          initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }}
          transition={{ duration: 0.3, ease: EASE }}>
          {cells.map((d, i) => {
            if (d === null) return <div key={`b${i}`} />;
            const key = `${year}-${pad(month + 1)}-${pad(d)}`;
            const open = available.has(key);
            const isSel = selected === key;
            const isToday = key === today;
            return (
              <div key={key} className="aspect-square flex items-center justify-center">
                {loading ? (
                  <motion.div className="w-[78%] aspect-square rounded-2xl bg-white/[0.06]"
                    animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: (i % 7) * 0.08 }} />
                ) : (
                  <motion.button
                    disabled={!open}
                    onClick={() => onPick(key)}
                    whileHover={open ? { scale: 1.08 } : undefined}
                    whileTap={open ? { scale: 0.92 } : undefined}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(i * 0.012, 0.4), type: 'spring', stiffness: 300, damping: 22 }}
                    aria-label={`${keyToLabel(key)}${open ? ', times open' : ', no times'}`}
                    aria-pressed={isSel}
                    className={`relative w-full max-w-[52px] aspect-square rounded-xl sm:rounded-2xl text-[15px] md:text-base font-bold flex items-center justify-center transition-colors ${
                      open ? (isSel ? 'text-royal-blue' : 'text-white bg-white/[0.08] border border-white/30 hover:border-white/80 hover:shadow-[0_0_14px_rgba(255,255,255,0.4)]') : 'text-white/25 cursor-default'}`}>
                    {isSel && (
                      <motion.span layoutId="day-pill" className="absolute inset-0 rounded-xl sm:rounded-2xl bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.35),0_0_26px_rgba(255,255,255,0.6)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                    )}
                    <span className="relative">{d}</span>
                    {open && !isSel && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-white" />}
                    {isToday && !isSel && <span aria-hidden="true" className="absolute inset-1 rounded-lg sm:rounded-xl ring-1 ring-white/60" />}
                  </motion.button>
                )}
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/* ---------------- Time list ---------------- */
// Same panel, buttons and local-time pill as the home screen's Next Openings

// Dropdown names include the current abbreviation. Arizona keeps Mountain Standard Time all year,
// so it is named separately from Denver's Mountain Time (they differ by an hour in summer).
const optionLabel = (z: string, now: Date) => {
  const abbr = tzAbbr(z, now);
  if (z === 'America/Phoenix') return `Mountain Time, Arizona (${abbr}, no daylight saving)`;
  if (z === 'America/Denver') return `Mountain Time (${abbr})`;
  return `${zoneLabel(z)} (${abbr})`;
};
const PARTS = [
  { id: 'morning', label: 'Morning', test: (h: number) => h < 12 },
  { id: 'afternoon', label: 'Afternoon', test: (h: number) => h >= 12 && h < 17 },
  { id: 'evening', label: 'Evening', test: (h: number) => h >= 17 },
];
const FILTER_AT = 7; // the Morning / Afternoon / Evening filter only shows on busy days

const tzAbbr = (tz: string, d: Date) =>
  new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(d).find((p) => p.type === 'timeZoneName')?.value || '';
const keyToShort = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, d)));
};

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div className="relative mx-auto w-fit max-w-full md:w-full md:h-full md:flex md:flex-col md:justify-center rounded-[28px] bg-[#113b6c] border border-white/15 p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] overflow-hidden text-center">
    <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    {children}
  </div>
);

// White "Your Local Time" pill; tapping it opens the time zone picker
const LocalTimePill = ({ tz, zones, onTz }: { tz: string; zones: string[]; onTz: (z: string) => void }) => {
  const [h24] = useClock24();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(t); }, []);
  return (
    <div className="inline-flex flex-col items-center">
    <label className="relative inline-flex flex-col items-center rounded-2xl bg-white text-royal-blue px-5 py-2 shadow-[0_6px_18px_-6px_rgba(0,0,0,0.5)] cursor-pointer">
      <ZoneLabel className="text-[11px] font-bold tracking-wide text-royal-blue/60" />
      <span className="mt-0.5 flex items-center gap-1 text-lg font-bold tabular-nums whitespace-nowrap leading-tight">
        {fmtTime(now.toISOString(), tz, h24)} <span className="text-[11px] font-bold tracking-wide text-royal-blue/60">{tzAbbr(tz, now)}</span>
        <ChevronDown size={14} className="text-royal-blue/60" />
      </span>
      <select aria-label="Time zone" value={tz} onChange={(e) => onTz(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer">
        {zones.map((z) => <option key={z} value={z}>{optionLabel(z, now)}</option>)}
      </select>
    </label>
    <UseMyTime />
    </div>
  );
};

const DayArrow = ({ dir, disabled, onClick }: { dir: -1 | 1; disabled: boolean; onClick: () => void }) => (
  <button onClick={onClick} disabled={disabled} aria-label={dir < 0 ? 'Previous open day' : 'Next open day'}
    className="tap-target w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white disabled:opacity-25 enabled:hover:bg-white enabled:hover:text-royal-blue transition-colors">
    {dir < 0 ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
  </button>
);

const TimeList = ({ dayKeyStr, times, tz, zones, onTz, chosen, onChoose, onNext, canPrevDay, canNextDay, onPrevDay, onNextDay }: {
  dayKeyStr: string | null; times: string[]; tz: string; zones: string[]; onTz: (z: string) => void;
  chosen: string | null; onChoose: (iso: string) => void; onNext: () => void;
  canPrevDay: boolean; canNextDay: boolean; onPrevDay: () => void; onNextDay: () => void;
}) => {
  const [part, setPart] = useState<string>('all');
  const [h24] = useClock24();

  if (!dayKeyStr) {
    return (
      <Panel>
        <CalendarDays size={32} className="mx-auto mb-3 text-[#c8c9c7]" />
        <p className="text-sm text-white/70">{TAP} a day with a dot to see when I’m free.</p>
        <div className="mt-6"><LocalTimePill tz={tz} zones={zones} onTz={onTz} /></div>
      </Panel>
    );
  }

  const parts = PARTS.filter((p) => times.some((t) => p.test(hourIn(t, tz))));
  const showFilter = times.length >= FILTER_AT && parts.length > 1;
  const active = PARTS.find((p) => p.id === part);
  const list = showFilter && active ? times.filter((t) => active.test(hourIn(t, tz))) : times;

  return (
    <motion.div key={dayKeyStr} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }} className="md:h-full">
      <Panel>
        <h3 className="flex items-center justify-center gap-2 whitespace-nowrap text-sm sm:text-base md:text-lg font-bold tracking-wide  text-white">
          <Zap size={16} /> Open Times
        </h3>
        <div className="mt-3 flex items-center justify-center gap-3">
          <DayArrow dir={-1} disabled={!canPrevDay} onClick={onPrevDay} />
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={dayKeyStr} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="heading-font text-xl md:text-2xl font-bold text-white tracking-tight whitespace-nowrap">{keyToShort(dayKeyStr)}</motion.p>
          </AnimatePresence>
          <DayArrow dir={1} disabled={!canNextDay} onClick={onNextDay} />
        </div>
        <p className="mt-1 text-xs text-white/70">{TAP} to select</p>
        <div className="mt-3"><ClockToggle /></div>

        {showFilter && (
          <div className="mt-4 flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="Time of day">
            {[{ id: 'all', label: 'All' }, ...parts].map((p) => (
              <button key={p.id} role="tab" aria-selected={part === p.id} onClick={() => setPart(p.id)}
                className={`tap-target h-8 px-3.5 rounded-full text-[11px] font-bold tracking-wide border transition-colors ${
                  part === p.id ? 'bg-white text-royal-blue border-white' : 'text-white/80 border-white/25 hover:border-white/70'}`}>
                {p.label}
              </button>
            ))}
          </div>
        )}

        <div className={`mt-4 grid grid-cols-[repeat(2,auto)] ${list.length === 3 || list.length > 4 ? 'sm:grid-cols-[repeat(3,auto)] md:grid-cols-[repeat(2,auto)] lg:grid-cols-[repeat(3,auto)]' : ''} justify-center gap-2 text-left`}>
          {list.map((t, i) => {
            const sel = chosen === t;
            return (
              <motion.button key={t} onClick={() => onChoose(t)}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}
                whileTap={{ scale: 0.96 }}
                aria-pressed={sel}
                className={`group rounded-2xl border px-4 py-3 transition-colors ${
                  sel ? 'bg-white border-white shadow-[0_0_0_3px_rgba(255,255,255,0.25),0_0_22px_rgba(255,255,255,0.5)]'
                    : 'border-white/20 bg-white/[0.06] hover:bg-white hover:border-white'}`}>
                <span className={`text-base font-bold tabular-nums whitespace-nowrap ${sel ? 'text-royal-blue' : 'text-white group-hover:text-royal-blue'}`}>
                  {fmtTime(t, tz, h24)} <span className={`text-[11px] font-bold tracking-wide ${sel ? 'text-royal-blue/60' : 'text-[#c8c9c7] group-hover:text-royal-blue/60'}`}>{tzAbbr(tz, new Date(t))}</span>
                </span>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {chosen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden hidden md:block">
              <motion.button onClick={onNext} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                className="mt-5 px-8 py-3.5 rounded-full bg-white text-royal-blue font-bold tracking-wide text-sm inline-flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.35)]">
                {fmtTime(chosen, tz, h24)} works for me <ArrowRight size={18} />
              </motion.button>
              <p className="mt-2 text-xs text-white/80">{TAP} to continue and add your details.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6"><LocalTimePill tz={tz} zones={zones} onTz={onTz} /></div>
      </Panel>
      {createPortal(
        <AnimatePresence>
          {chosen && (
            <motion.div key="dock" initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="md:hidden fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-[65] px-4 pt-3 bg-royal-blue border-t border-white/20 shadow-[0_-12px_40px_rgba(0,0,0,0.45)]"
              style={{ paddingBottom: '0.75rem' }}>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              <p className="mb-2 flex items-center gap-1.5 text-[12px] font-bold tracking-wide text-white">
                <Check size={14} strokeWidth={3} /> Time selected. Tap Next to Continue.
              </p>
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="text-[11px] font-bold tracking-wide text-white/80 truncate">{keyToLabel(dayKeyStr)}</p>
                  <p className="text-lg font-bold text-white tabular-nums">{fmtTime(chosen, tz, h24)} <span className="text-[11px] font-bold tracking-wide text-[#c8c9c7]">{tzAbbr(tz, new Date(chosen))}</span> <span className="text-[#c8c9c7] text-sm font-medium">· 60 min</span></p>
                </div>
                <motion.button onClick={onNext} whileTap={{ scale: 0.95 }} aria-label="Next: add your details"
                  className="relative shrink-0 h-12 pl-6 pr-5 rounded-full bg-white text-royal-blue font-bold tracking-wide text-sm flex items-center gap-2 shadow-[0_0_22px_rgba(255,255,255,0.5)]">
                  {/* soft pulse draws the eye to the next step */}
                  <motion.span aria-hidden="true" className="absolute inset-0 rounded-full ring-2 ring-white"
                    animate={{ scale: [1, 1.18], opacity: [0.7, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }} />
                  Next
                  <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} className="flex">
                    <ArrowRight size={16} />
                  </motion.span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </motion.div>
  );
};

/* ---------------- Summary chip ---------------- */
const Summary = ({ iso, tz, onChange }: { iso: string; tz: string; onChange?: () => void }) => {
  const [h24] = useClock24();
  return (
  <div className="flex w-fit max-w-full items-center gap-4 p-4 md:p-5 rounded-2xl bg-white/10 border border-white/15">
    <div className="w-14 h-14 shrink-0 rounded-2xl bg-white text-royal-blue flex flex-col items-center justify-center leading-none shadow-lg">
      <span className="text-[11px] font-bold tracking-wide">
        {new Intl.DateTimeFormat('en-US', { timeZone: tz, month: 'short' }).format(new Date(iso))}
      </span>
      <span className="text-xl font-bold">{new Intl.DateTimeFormat('en-US', { timeZone: tz, day: 'numeric' }).format(new Date(iso))}</span>
    </div>
    <div className="min-w-0">
      {/* Month and day are on the date tile, so only the weekday is spelled out here */}
      <p className="font-bold text-white">{new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' }).format(new Date(iso))}</p>
      <p className="text-sm text-white/80">
        <span className="whitespace-nowrap">{fmtTime(iso, tz, h24)} – {fmtEnd(iso, tz, h24)}</span>{' '}
        <span className="text-[11px] font-bold tracking-wide text-[#c8c9c7] whitespace-nowrap">{tzAbbr(tz, new Date(iso))}</span>
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold tracking-wide text-white/80">
        <span className="flex items-center gap-1 whitespace-nowrap"><Clock size={11} /> 60 min</span>
        <span className="flex items-center gap-1 whitespace-nowrap"><Video size={11} /> Zoom</span>
        {/* Sits on the details line so it never crowds the time on narrow phones */}
        {onChange && (
          <button onClick={onChange} className="tap-target-y text-[11px] font-bold tracking-wide text-white hover:text-white underline underline-offset-4">
            Change
          </button>
        )}
      </div>
    </div>
  </div>
  );
};

/* ---------------- Field ---------------- */
const Field = ({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) => (
  <label className="block">
    <span className="flex items-baseline justify-between mb-2">
      <span className="text-[11px] font-bold tracking-wide text-white/90">{label}</span>
      {optional && <span className="text-[11px] tracking-wide text-white/40">Optional</span>}
    </span>
    {children}
  </label>
);
const inputCls = 'w-full rounded-xl bg-white/95 text-royal-blue placeholder:text-royal-blue/50 px-4 py-3.5 text-base outline-none ring-0 focus:ring-4 focus:ring-white/50 focus:shadow-[0_0_24px_rgba(255,255,255,0.45)] transition-shadow';

/* ---------------- Celebration ---------------- */
const Burst = () => {
  const bits = useMemo(() => Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2;
    const r = 90 + (i % 3) * 30;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, c: i % 3 === 0 ? 'bg-white' : i % 3 === 1 ? 'bg-white' : 'bg-white/60', s: 4 + (i % 3) * 2 };
  }), []);
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      {bits.map((b, i) => (
        <motion.span key={i} className={`absolute rounded-full ${b.c}`} style={{ width: b.s, height: b.s }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }} animate={{ x: b.x, y: b.y, opacity: 0, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.25, ease: 'easeOut' }} />
      ))}
    </div>
  );
};

/* ---------------- Main flow ---------------- */
export default function Booking({ onBooked, initialTime }: { onBooked?: () => void; initialTime?: string | null }) {
  const { tz, setTz } = useViewZone(); // visitor's system zone unless they picked another, shared with the home screen
  const nowKey = dayKey(new Date().toISOString(), tz);
  const [view, setView] = useState(() => { const [y, m] = (initialTime ? dayKey(initialTime, tz) : nowKey).split('-').map(Number); return { y, m: m - 1 }; });
  const [slots, setSlots] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [day, setDay] = useState<string | null>(() => (initialTime ? dayKey(initialTime, tz) : null));
  const [time, setTime] = useState<string | null>(initialTime ?? null);
  const [touched, setTouched] = useState(!!initialTime); // hides the hint once they pick something
  // A time tapped on the home screen skips straight to the info step
  const [step, setStep] = useState<Step>(initialTime ? 'info' : 'pick');
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [smsOk, setSmsOk] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState<Booked | null>(null);
  const autoPicked = useRef(!!initialTime);
  const autoTries = useRef(0);
  const timesRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (id: string, force = false) => {
    if (!force && slots[id]) return slots[id];
    setLoading(true); setLoadError('');
    try {
      const r = await fetch(`/api/slots?month=${id}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Could not load times');
      setSlots((s) => ({ ...s, [id]: data.slots }));
      return data.slots as string[];
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load times');
      return [];
    } finally { setLoading(false); }
  }, [slots]);

  const id = monthId(view.y, view.m);
  useEffect(() => { load(id); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Group the visible month's slots by local day
  const byDay = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const t of slots[id] || []) {
      const k = dayKey(t, tz);
      if (!k.startsWith(id)) continue;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return map;
  }, [slots, id, tz]);
  const available = useMemo(() => new Set(byDay.keys()), [byDay]);

  // First visit: jump to the first open day (next month too, if this one is booked up)
  useEffect(() => {
    if (autoPicked.current || loading || loadError || !slots[id]) return;
    const first = [...available].sort()[0];
    if (first) { autoPicked.current = true; setDay(first); return; }
    if (autoTries.current < 1) { autoTries.current++; shift(1); } else autoPicked.current = true;
  }, [available, loading, loadError, slots, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const nowMonthIdx = Number(nowKey.slice(0, 4)) * 12 + Number(nowKey.slice(5, 7)) - 1;
  const canPrev = view.y * 12 + view.m > nowMonthIdx;
  const shift = (d: number) => setView((v) => { const n = v.y * 12 + v.m + d; return { y: Math.floor(n / 12), m: n % 12 }; });

  const allDays = useMemo(() => {
    const set = new Set<string>();
    for (const list of Object.values(slots)) for (const t of list) set.add(dayKey(t, tz));
    return [...set].filter((k) => k >= nowKey).sort();
  }, [slots, tz, nowKey]);
  const dayIdx = day ? allDays.indexOf(day) : -1;
  const pendingFirst = useRef(false);

  const stepDay = (d: -1 | 1) => {
    setTime(null);
    const target = allDays[dayIdx + d];
    if (target) {
      setDay(target);
      const [y, m] = target.split('-').map(Number);
      if (y !== view.y || m - 1 !== view.m) setView({ y, m: m - 1 });
    } else if (d > 0) {
      pendingFirst.current = true;
      setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));
    }
  };

  useEffect(() => {
    if (!pendingFirst.current || loading || !slots[id]) return;
    pendingFirst.current = false;
    const first = [...available].sort()[0];
    if (first) setDay(first);
  }, [available, loading, slots, id]);

  const pickDay = (k: string) => {
    setTouched(true);
    setDay(k); setTime(null);
    if (window.innerWidth < 768) setTimeout(() => timesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  };

  const go = (s: Step) => {
    setStep(s); setError('');
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time || sending || !agreed) return;
    if (form.phone && !PHONE_OK.test(form.phone)) { setError('Please enter a full 10-digit phone number, or leave it blank.'); return; }
    setSending(true); setError('');
    try {
      const r = await fetch('/api/book', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // The agreement line is saved with the booking in Calendly as a record that the Terms were accepted
        body: JSON.stringify({
          start_time: time, timezone: tz, ...form,
          sms: !!form.phone && smsOk,
          notes: `${form.notes.trim()}${form.notes.trim() ? '\n\n' : ''}[Agreed to Terms of Service and Privacy Policy (${TERMS_VERSION}), including recording consent and release, at ${new Date().toISOString()}]`,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        if (r.status === 409) {
          // Someone grabbed it first: refresh times and send them back to pick
          await load(id, true);
          setTime(null);
          go('pick');
        }
        throw new Error(data.error || 'Booking did not go through.');
      }
      setBooked(data);
      go('done');
      onBooked?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking did not go through.');
    } finally { setSending(false); }
  };

  const restart = () => {
    setBooked(null); setTime(null); setForm({ name: '', email: '', phone: '', notes: '' }); setSmsOk(false); setAgreed(false);
    load(id, true); go('pick');
  };

  const zones = ZONES.includes(tz) ? ZONES : [tz, ...ZONES];

  return (
    <div ref={topRef} className="relative scroll-mt-24 rounded-[28px] md:rounded-[32px] bg-royal-blue border border-white/20 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '28px 28px', maskImage: 'radial-gradient(ellipse at top, black 20%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse at top, black 20%, transparent 75%)' }} />
      <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
      <Progress step={step} />

      <AnimatePresence mode="wait" initial={false}>
        {step === 'pick' && (
          <motion.div key="pick" initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: EASE }} className="relative p-4 sm:p-6 md:p-10">
            {error && <p role="alert" className="mb-6 px-4 py-3 rounded-xl bg-white/10 border border-white/40 text-white text-sm">{error}</p>}
            <AnimatePresence initial={false}>
              {!touched && (
                <motion.p key="hint" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden text-center text-sm text-white/85">
                  <span className="block pb-5">{TAP} a day with a dot, then pick a time.</span>
                </motion.p>
              )}
            </AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-8 md:gap-10">
              {/* Calendar sits in its own card, matching the Open Times panel, so it stands apart from what's above and below */}
              <div className="relative rounded-[28px] bg-[#113b6c] border border-white/15 p-3 sm:p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] overflow-hidden">
                <div aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                <MonthGrid year={view.y} month={view.m} available={available} selected={day} loading={loading}
                  today={nowKey} canPrev={canPrev} onPrev={() => shift(-1)} onNext={() => shift(1)} onPick={pickDay} />
                {loadError && (
                  <div className="mt-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-red-500/15 border border-red-300/30 text-sm text-red-100">
                    <span>{loadError}</span>
                    <button onClick={() => load(id, true)} className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-white">
                      <RefreshCw size={12} /> Retry
                    </button>
                  </div>
                )}
                {!loading && !loadError && available.size === 0 && (
                  <p className="mt-4 text-sm text-[#c8c9c7] text-center">I’m booked up this month. Check next month.</p>
                )}
              </div>
              <div ref={timesRef} className="scroll-mt-24 md:h-full">
                <AnimatePresence mode="wait">
                  <TimeList key={day || 'none'} dayKeyStr={day} times={day ? byDay.get(day) || [] : []} tz={tz}
                    zones={zones} onTz={(z) => { setTz(z); setTime(null); }}
                    chosen={time} onChoose={(t) => { setTouched(true); setTime(t); }} onNext={() => go('info')}
                    canPrevDay={dayIdx > 0} canNextDay={dayIdx >= 0}
                    onPrevDay={() => stepDay(-1)} onNextDay={() => stepDay(1)} />
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'info' && time && (
          <motion.div key="info" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.35, ease: EASE }} className="relative p-4 sm:p-6 md:p-10">
            <div className="max-w-xl mx-auto">
              <button onClick={() => go('pick')} className="tap-target-y mb-6 flex items-center gap-2 text-[11px] font-bold tracking-wide text-white/90 hover:text-white">
                <ArrowLeft size={14} /> Back to my calendar
              </button>
              <Summary iso={time} tz={tz} onChange={() => go('pick')} />
              <form onSubmit={submit} className="mt-8 space-y-5">
                <Field label="Your Name">
                  <input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputCls} placeholder="A Langston Taylor" />
                </Field>
                <Field label="Where should I send your Zoom link?">
                  <input required type="email" autoComplete="email" inputMode="email" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="you@email.com" />
                </Field>
                <Field label="Phone number" optional>
                  <input type="tel" inputMode="tel" autoComplete="tel-national" value={form.phone}
                    onChange={(e) => { const phone = formatPhone(e.target.value); setForm({ ...form, phone }); if (!phone) setSmsOk(false); }}
                    className={inputCls} placeholder="###-###-####" pattern="\d{3}-\d{3}-\d{4}"
                    title="10-digit phone number, like 214-555-0123" />
                </Field>
                {/* SMS consent: optional, unchecked by default, and never required to book */}
                <div className="-mt-2 space-y-2 text-left">
                  <label className={`flex items-start gap-3 text-[13px] leading-snug ${form.phone ? 'text-white/85 cursor-pointer' : 'text-white/40 cursor-not-allowed'}`}>
                    <input type="checkbox" checked={smsOk} disabled={!form.phone} onChange={(e) => setSmsOk(e.target.checked)}
                      className="mt-0.5 h-6 w-6 shrink-0 accent-white cursor-pointer disabled:cursor-not-allowed" />
                    <span>Text me about this booking (optional).</span>
                  </label>
                  <p className="text-[11px] leading-relaxed text-[#c8c9c7]">
                    By checking this box, you agree to receive text messages from Jack Dee at the number above about this booking, such as
                    confirmations, reminders, and schedule changes. Message frequency varies. Message and data rates may apply. Reply STOP to
                    opt out or HELP for help. Consent is not a condition of booking. Your number is not shared or sold for marketing. See
                    the <a href="#privacy" target="_blank" rel="noopener" className="underline underline-offset-2 hover:text-white">Privacy Policy</a>.
                  </p>
                </div>
                <Field label="What do you want to talk about?" optional>
                  <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className={`${inputCls} resize-none`} placeholder="Give me a heads-up so I can come prepared" />
                </Field>
                {/* Active agreement (clickwrap) so the Terms, recording consent and release are accepted before booking */}
                <label className="flex items-start gap-3 text-left text-[13px] leading-snug text-white/85 cursor-pointer">
                  <input type="checkbox" required checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-6 w-6 shrink-0 accent-white cursor-pointer" />
                  <span>
                    I agree to the <a href="#terms" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-white">Terms of Service</a> and{' '}
                    <a href="#privacy" target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-white">Privacy Policy</a>, including
                    consent to the session being recorded and the recording release.
                  </span>
                </label>
                <AnimatePresence>
                  {error && (
                    <motion.p role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="px-4 py-3 rounded-xl bg-red-500/15 border border-red-300/30 text-red-100 text-sm">{error}</motion.p>
                  )}
                </AnimatePresence>
                <motion.button type="submit" disabled={sending} whileHover={sending ? undefined : { y: -2 }} whileTap={sending ? undefined : { scale: 0.97 }}
                  className="mx-auto w-fit px-10 py-4 rounded-full bg-white text-royal-blue font-bold tracking-wide text-sm flex items-center justify-center gap-3 shadow-xl shadow-black/20 disabled:opacity-80">
                  {sending ? <><Loader2 size={18} className="animate-spin" /> Saving your spot</> : <>Lock It In <Check size={18} strokeWidth={3} /></>}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}

        {step === 'done' && booked && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }} className="relative px-4 py-8 sm:p-6 md:p-12 text-center">
            <div className="relative mx-auto w-28 h-28 mb-6">
              <Burst />
              <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-[0_0_0_10px_rgba(255,255,255,0.18),0_20px_50px_-10px_rgba(0,0,0,0.5)]">
                <motion.svg viewBox="0 0 24 24" className="w-14 h-14 text-royal-blue" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.35, duration: 0.5 }} />
                </motion.svg>
              </motion.div>
            </div>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="text-[11px] font-bold tracking-wide text-white mb-2 flex items-center justify-center gap-2">
              <Sparkles size={12} /> Booking Complete
            </motion.p>
            <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="text-3xl md:text-5xl font-bold text-white tracking-tighter mb-3">
              See you then, {booked.name.split(' ')[0]}.
            </motion.h3>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-white/90 mb-8">
              Meeting details have been sent to <b className="text-white">{booked.email}</b>.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="flex justify-center text-left">
              <Summary iso={booked.start_time} tz={tz} />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
              className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center">
              {booked.reschedule_url && booked.reschedule_url !== '#' && (
                <a href={booked.reschedule_url} target="_blank" rel="noopener noreferrer"
                  className="px-6 py-3 rounded-full bg-white/10 border border-white/25 text-white text-[11px] font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-white hover:text-royal-blue">
                  <RefreshCw size={14} /> Reschedule
                </a>
              )}
              {booked.cancel_url && booked.cancel_url !== '#' && (
                <a href={booked.cancel_url} target="_blank" rel="noopener noreferrer"
                  className="px-6 py-3 rounded-full bg-white/10 border border-white/25 text-white text-[11px] font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-white hover:text-royal-blue">
                  <XCircle size={14} /> Cancel
                </a>
              )}
              <button onClick={restart}
                className="px-6 py-3 rounded-full bg-white text-royal-blue text-[11px] font-bold tracking-wide flex items-center justify-center gap-2">
                <CalendarDays size={14} /> Book Another
              </button>
            </motion.div>
            {/* Quiet credential: official Life Member insignia */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
              className="mt-10 pt-6 border-t border-white/10 flex items-center justify-center gap-3">
              <picture className="shrink-0">
                <source srcSet="/img/life-member.webp" type="image/webp" />
                <img src="/img/life-member.png" alt="Phi Beta Sigma Life Member insignia" width={122} height={176} className="h-12 w-auto" />
              </picture>
              <div className="text-left leading-tight">
                <p className="text-sm font-bold text-white">Jack Dee</p>
                <p className="text-[11px] font-bold tracking-wide text-[#c8c9c7]">Life Member #2174</p>
                <p className="text-[11px] text-[#c8c9c7]">Phi Beta Sigma Fraternity, Inc.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
