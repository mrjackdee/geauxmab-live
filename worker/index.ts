// © MrJackDee™. All rights reserved.
// Cloudflare Worker for https://book.geauxmab.com
// Serves the booking app and a small API that talks to Calendly behind the scenes,
// so visitors only ever see the custom GeauxMAB booking screens.
//
//   GET  /api/slots?month=YYYY-MM   open start times for that month (UTC ISO strings)
//   POST /api/book                  { start_time, name, email, timezone, notes? }
//
// Secret:  CALENDLY_TOKEN  (Calendly Personal Access Token: npx wrangler secret put CALENDLY_TOKEN)
// Var:     CALENDLY_EVENT_TYPE  (event type URI for "Jack Dee | ΦΒΣ Calendar")

export interface Env {
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
  CALENDLY_TOKEN?: string;
  CALENDLY_EVENT_TYPE?: string;
  MOCK_CALENDLY?: string; // local dev only: "1" fakes Calendly so the UI can be tried without a token
}

const API = 'https://api.calendly.com';
const NOTES_QUESTION = 'Please share anything that will help prepare for our meeting.';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

async function calendly(env: Env, path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${env.CALENDLY_TOKEN}`, 'content-type': 'application/json' },
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, any>;
  return { ok: res.ok, status: res.status, data };
}

/* ---------- slots ---------- */
async function slots(env: Env, month: string) {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return json({ error: 'Bad month' }, 400);
  // Pad a day either side so every local time zone sees its whole month
  const from = Math.max(Date.UTC(+m[1], +m[2] - 1, 1) - 86400000, Date.now() + 60000);
  const to = Date.UTC(+m[1], +m[2], 1) + 86400000;
  if (from >= to) return json({ slots: [] });

  if (env.MOCK_CALENDLY === '1') return json({ slots: mockSlots(from, to), mock: true });

  // Calendly allows at most 7 days per request
  const windows: [number, number][] = [];
  for (let s = from; s < to; s += WEEK_MS) windows.push([s, Math.min(s + WEEK_MS, to)]);
  const results = await Promise.all(
    windows.map(([s, e]) =>
      calendly(env, `/event_type_available_times?${new URLSearchParams({
        event_type: env.CALENDLY_EVENT_TYPE!,
        start_time: new Date(s).toISOString(),
        end_time: new Date(e).toISOString(),
      })}`),
    ),
  );
  const failed = results.find((r) => !r.ok);
  if (failed) return json({ error: 'Could not load availability' }, 502);
  const all = results.flatMap((r) => (r.data.collection || []).filter((x: any) => x.status === 'available').map((x: any) => x.start_time as string));
  return json({ slots: [...new Set(all)].sort() });
}

/* ---------- book ---------- */
async function book(env: Env, req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const start_time = String(body?.start_time || '');
  const name = String(body?.name || '').trim().slice(0, 120);
  const email = String(body?.email || '').trim().slice(0, 200);
  const timezone = String(body?.timezone || 'America/New_York').slice(0, 64);
  const notes = String(body?.notes || '').trim().slice(0, 2000);
  const phone = String(body?.phone || '').trim();
  const sms = body?.sms === true;

  if (!name) return json({ error: 'Please enter your name.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Please enter a valid email.' }, 400);
  if (Number.isNaN(Date.parse(start_time))) return json({ error: 'Please pick a time.' }, 400);
  if (phone && !/^\d{3}-\d{3}-\d{4}$/.test(phone)) return json({ error: 'Please enter a full 10-digit phone number, or leave it blank.' }, 400);

  // Phone is recorded in the booking notes as ###-###-####, along with the SMS choice
  const fullNotes = [
    notes,
    phone ? `Phone: ${phone}\nSMS updates: ${sms ? 'Yes, consented at booking' : 'No'}` : '',
  ].filter(Boolean).join('\n\n');

  if (env.MOCK_CALENDLY === '1') {
    return json({ ok: true, mock: true, start_time, name, email, cancel_url: '#', reschedule_url: '#' });
  }

  // Calendly's own text reminders need the number as +1##########; only sent when the visitor opted in
  const request = (withSms: boolean) => calendly(env, '/invitees', {
    method: 'POST',
    body: JSON.stringify({
      event_type: env.CALENDLY_EVENT_TYPE,
      start_time,
      invitee: { name, email, timezone, ...(withSms ? { text_reminder_number: `+1${phone.replace(/-/g, '')}` } : {}) },
      location: { kind: 'zoom_conference' },
      ...(fullNotes ? { questions_and_answers: [{ question: NOTES_QUESTION, answer: fullNotes, position: 0 }] } : {}),
    }),
  });
  let r = await request(sms && !!phone);
  // If text reminders are not enabled on the event type, book anyway; the number is still in the notes
  if (!r.ok && sms && phone && r.status === 400 && /text_reminder|phone/i.test(JSON.stringify(r.data))) r = await request(false);

  if (!r.ok) {
    const msg = String(r.data?.message || r.data?.title || '');
    if (r.status === 400 && /time|slot|available/i.test(msg)) {
      return json({ error: 'Someone just grabbed that time. Please pick another one of mine.', taken: true }, 409);
    }
    return json({ error: 'Booking did not go through. Please try again.' }, 502);
  }
  const inv = r.data.resource || {};
  return json({ ok: true, start_time, name, email, cancel_url: inv.cancel_url, reschedule_url: inv.reschedule_url });
}

/* ---------- local mock ---------- */
function mockSlots(from: number, to: number) {
  const out: string[] = [];
  for (let t = Math.ceil(from / 1800000) * 1800000; t < to; t += 1800000) {
    const d = new Date(t);
    const et = (d.getUTCHours() + 24 - 4) % 24; // rough Eastern hour
    const day = Math.floor(t / 86400000);
    if (et >= 10 && et < 21 && (day * 7 + et * 3 + d.getUTCMinutes()) % 5 < 2) out.push(d.toISOString());
  }
  return out;
}

export async function handleApi(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  if (env.MOCK_CALENDLY !== '1' && (!env.CALENDLY_TOKEN || !env.CALENDLY_EVENT_TYPE)) {
    return json({ error: 'Booking is not set up yet.' }, 503);
  }
  try {
    if (url.pathname === '/api/slots' && req.method === 'GET') return await slots(env, url.searchParams.get('month') || '');
    if (url.pathname === '/api/book' && req.method === 'POST') return await book(env, req);
    return json({ error: 'Not found' }, 404);
  } catch {
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith('/api/')) return handleApi(req, env);
    return env.ASSETS!.fetch(req);
  },
};
