// © MrJackDee™. All rights reserved.
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

// "Click" with a mouse, "Tap" on touch screens, for the little how-to hints
export const TAP = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ? 'Click' : 'Tap';

// 12-hour / 24-hour preference, shared by every time on the page and remembered on this device
const KEY = 'geauxmab_24h';
const EVT = 'geauxmab:clock';

const read = () => {
  try { return window.localStorage.getItem(KEY) === '1'; } catch { return false; }
};

export const useClock24 = (): [boolean, (v: boolean) => void] => {
  const [h24, setH24] = useState(read);
  useEffect(() => {
    const sync = () => setH24(read());
    window.addEventListener(EVT, sync);
    return () => window.removeEventListener(EVT, sync);
  }, []);
  const set = (v: boolean) => {
    try { window.localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* storage blocked */ }
    setH24(v);
    window.dispatchEvent(new Event(EVT));
  };
  return [h24, set];
};

// "2:30 pm" in standard time, "14:30" in 24-hour time
export const formatClock = (when: string | Date, tz: string | undefined, h24: boolean) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: h24 ? '2-digit' : 'numeric',
    minute: '2-digit',
    hourCycle: h24 ? 'h23' : 'h12',
  }).format(new Date(when)).toLowerCase();

// Small "12h | 24h" switch for the time panels
export const ClockToggle = () => {
  const [h24, setH24] = useClock24();
  return (
    <div role="radiogroup" aria-label="Time format" className="inline-flex rounded-full border border-white/25 bg-white/[0.06] p-0.5">
      {[{ v: false, label: '12-hour' }, { v: true, label: '24-hour' }].map(({ v, label }) => {
        const on = h24 === v;
        return (
          <button key={label} type="button" role="radio" aria-checked={on} onClick={() => setH24(v)}
            className={`tap-target relative h-8 px-3 rounded-full text-[11px] font-bold tracking-wide transition-colors ${on ? 'text-royal-blue' : 'text-white/80 hover:text-white'}`}>
            {on && <motion.span layoutId="clock-toggle" className="absolute inset-0 rounded-full bg-white" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

/* ---------------- Viewing time zone ---------------- */
// Times start in the visitor's own system zone. Picking another zone overrides it for this visit,
// on every screen, until they switch back.
const ZONE_KEY = 'geauxmab_tz';
const ZONE_EVT = 'geauxmab:zone';

export const systemZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'; } catch { return 'America/New_York'; }
};

const readZone = () => {
  try { return window.sessionStorage.getItem(ZONE_KEY) || systemZone(); } catch { return systemZone(); }
};

export const useViewZone = (): { tz: string; system: string; overridden: boolean; setTz: (z: string) => void } => {
  const [tz, setTzState] = useState(readZone);
  useEffect(() => {
    const sync = () => setTzState(readZone());
    window.addEventListener(ZONE_EVT, sync);
    return () => window.removeEventListener(ZONE_EVT, sync);
  }, []);
  const system = systemZone();
  const setTz = (z: string) => {
    try {
      if (z === system) window.sessionStorage.removeItem(ZONE_KEY);
      else window.sessionStorage.setItem(ZONE_KEY, z);
    } catch { /* storage blocked */ }
    setTzState(z);
    window.dispatchEvent(new Event(ZONE_EVT));
  };
  return { tz, system, overridden: tz !== system, setTz };
};

// "Pacific Time", "Central Time", ...
export const zoneLabel = (tz: string) => {
  try {
    const name = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'long' })
      .formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value || tz;
    return name.replace(/ (Standard|Daylight) /, ' ');
  } catch { return tz; }
};

// Label for the time pill: "Your Local Time", or "Showing Pacific Time" when another zone was picked
export const ZoneLabel = ({ className = '' }: { className?: string }) => {
  const { tz, overridden } = useViewZone();
  return <span className={className}>{overridden ? `Showing ${zoneLabel(tz)}` : 'Your Local Time'}</span>;
};

// "Use my time (Eastern)" link, only when another zone was picked
export const UseMyTime = ({ dark = true }: { dark?: boolean }) => {
  const { system, overridden, setTz } = useViewZone();
  if (!overridden) return null;
  return (
    <button type="button" onClick={() => setTz(system)}
      className={`tap-target-y mt-2 text-[11px] font-bold tracking-wide underline underline-offset-4 ${dark ? 'text-white/90 hover:text-white' : 'text-royal-blue'}`}>
      Use my time ({zoneLabel(system).replace(/ Time$/, '')})
    </button>
  );
};
