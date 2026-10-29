<!-- © MrJackDee™. All rights reserved. -->

# Booking Page: book.geauxmab.com

**Owner:** Jack Dee (MrJackDee™) · **Status:** Final approved design, October 29, 2026 (rev. 2: desktop mode, Σ icon, share card, Michroma/Oxanium type, pen-trace splash, per-site naming) · **Branch:** `main`

A branded, mobile-first scheduling app (with an automatic desktop mode) that lets visitors book a one-on-one session with Jack Dee without ever seeing a third-party scheduling page. Calendly is the scheduling engine behind the scenes; every screen the visitor sees is custom.

This README holds the complete development notes for the approved version so the design and functionality can be **replicated for other sites**. Companion documents (Business Requirements, Technical Design, Test Cases) are in Google Drive under `GeauxMAB / Booking Page Kit`.

---

## Contents

1. [What the app does](#1-what-the-app-does)
2. [Architecture at a glance](#2-architecture-at-a-glance)
3. [Repository layout](#3-repository-layout)
4. [Run, build, deploy](#4-run-build-deploy)
5. [Configuration and secrets](#5-configuration-and-secrets)
6. [Screens and user flow](#6-screens-and-user-flow)
7. [Server API (Cloudflare Worker)](#7-server-api-cloudflare-worker)
8. [Calendly integration details](#8-calendly-integration-details)
9. [Time, time zones, and formatting](#9-time-time-zones-and-formatting)
10. [Phone number and SMS consent](#10-phone-number-and-sms-consent)
11. [Legal pages and consent capture](#11-legal-pages-and-consent-capture)
12. [Design system](#12-design-system)
13. [Brand rules (Phi Beta Sigma)](#13-brand-rules-phi-beta-sigma)
14. [Mobile-first and accessibility rules](#14-mobile-first-and-accessibility-rules)
15. [Motion and animation rules](#15-motion-and-animation-rules)
16. [Content and copy decisions](#16-content-and-copy-decisions)
17. [Assets](#17-assets)
18. [PWA (save to home screen)](#18-pwa-save-to-home-screen)
19. [Browser storage](#19-browser-storage)
20. [Replicating this for another site](#20-replicating-this-for-another-site)
21. [Go-live checklist](#21-go-live-checklist)
22. [Known limitations and decisions log](#22-known-limitations-and-decisions-log)
23. [Desktop mode](#23-desktop-mode)
24. [Naming, icon and link preview (per site)](#24-naming-icon-and-link-preview-per-site)
25. [Testing matrix](#25-testing-matrix)
26. [Deploying from a shared repo](#26-deploying-from-a-shared-repo)

---

## 1. What the app does

- **Home screen:** introduces Jack Dee with photo, credentials (Life Member #2174, fraternity, region and chapter insignia), social links, a **My Calendar** button, and a **Next Openings** panel of the four soonest open times that can be booked in one tap.
- **Calendar screen:** a custom month calendar showing only days with real availability, an **Open Times** panel for the selected day, and a three-step flow: **Select a Date → About You → Complete**.
- **Booking:** collects name, email, optional phone (with optional SMS consent) and optional notes, requires agreement to the Terms and Privacy Policy, then books the session directly in Calendly through a server API.
- **Confirmation:** shows the booked time, reschedule and cancel links from Calendly, and Jack's Life Member credential.
- **Legal:** Privacy Policy and Terms of Service pages (Texas law, Dallas County venue, recording consent and release, content ownership).
- **App-like behavior:** bottom tab bar on phones, share sheet, save to home screen (PWA), live availability status, 12/24-hour toggle, viewer-selectable time zone.
- **Desktop mode (1024 px and wider):** switches automatically to a website layout: header navigation, a hero with the next four openings beside the photo, and the full calendar on the home page. No manual toggle. See [§23](#23-desktop-mode).

---

## 2. Architecture at a glance

```
Visitor's browser                         Cloudflare (book.geauxmab.com)                Calendly API
──────────────────                        ──────────────────────────────                ────────────
React SPA (Vite build, dist-book/)  ──▶   Worker: worker/index.ts                  ──▶  GET  /event_type_available_times
  • Home, Calendar, Legal views            • GET  /api/slots?month=YYYY-MM               POST /invitees
  • All UI, no Calendly embed             • POST /api/book                             (Zoom link + emails sent by Calendly)
                                           • Everything else → static assets
                                           Secret: CALENDLY_TOKEN
```

- **Front end:** React 19 + TypeScript, Vite 6, Tailwind CSS v4, `motion` (Framer Motion) for animation, `lucide-react` icons.
- **Back end:** one Cloudflare Worker that serves the static build **and** a two-route API. The Calendly token never reaches the browser.
- **Hosting:** Cloudflare Workers with static assets (`assets.run_worker_first: ["/api/*"]`, single-page-app fallback).
- **Scheduling engine:** Calendly (availability, booking, Zoom link creation, confirmation and reminder emails, reschedule/cancel).

---

## 3. Repository layout

The booking app lives alongside the main geauxmab.com site in the same repo but builds separately.

| Path | Purpose |
|---|---|
| `calendar/index.html` | Booking app HTML shell, meta tags, manifest, fonts |
| `calendar/main.tsx` | React entry; registers the service worker on HTTPS |
| `calendar/CalendarPage.tsx` | App shell: splash, header, tab bar, home screen, menu, footer, routing between views |
| `calendar/Booking.tsx` | Booking flow: progress rail, month grid, Open Times panel, form, confirmation |
| `calendar/clock.tsx` | Shared 12/24-hour preference and viewing time zone (hooks + small components) |
| `calendar/Legal.tsx` | Privacy Policy and Terms of Service content |
| `calendar/app.css` | App-only CSS: hover/tap feedback, tap-target padding, brand color and text-size overrides |
| `calendar/public/` | Static assets: icons, manifest, service worker, images, share card |
| `calendar/tools/` | **Not deployed.** `make-icons.py` (builds all icons from one letter) and `share-card.html` (1200×630 link-preview template) |
| `worker/index.ts` | Cloudflare Worker: static assets + `/api/slots` + `/api/book` |
| `vite.book.config.ts` | Vite config for the booking build; runs the Worker API in dev |
| `wrangler.jsonc` | Worker name, assets, custom domain, event type variable |
| `index.css` | Shared Tailwind entry used by both the main site and the booking app |

---

## 4. Run, build, deploy

```bash
npm install
npm run dev:book          # http://localhost:3001  (booking app only)
npm run build:book        # outputs dist-book/
npx wrangler deploy       # deploys the Worker + dist-book to Cloudflare
```

- **Local data:** without `CALENDLY_TOKEN` in `.env.local`, the dev server **fakes** availability and bookings (mock mode) so the UI can be tested safely. Responses include `"mock": true`.
- **Real data locally:** create `.env.local` (git-ignored) with `CALENDLY_TOKEN=...`.
- **Cloudflare build settings (Workers Builds):** branch `main`, build command `npm run build:book`, deploy command `npx wrangler deploy`.
- **Main site** (`geauxmab.com`) is built separately with `npm run build` and hosted on Hostinger; it is not part of this Worker.

---

## 5. Configuration and secrets

| Name | Where | Value / purpose |
|---|---|---|
| `CALENDLY_TOKEN` | Cloudflare Worker **secret** (and `.env.local` for dev) | Calendly Personal Access Token. Never committed. |
| `CALENDLY_EVENT_TYPE` | `wrangler.jsonc` `vars` | Event type URI for "Jack Dee \| ΦΒΣ Calendar" (60 min, Zoom) |
| `MOCK_CALENDLY` | Dev only (set by `vite.book.config.ts`) | `"1"` when no token: fake slots and bookings |
| Custom domain | `wrangler.jsonc` `routes` | `book.geauxmab.com` (`custom_domain: true`; zone must be in the same Cloudflare account) |
| `workers_dev` | Not set | Cloudflare may disable the `*.workers.dev` URL when a custom domain is set. Add `"workers_dev": true` to keep it. |

Event type used: `https://api.calendly.com/event_types/dc9fc8cf-9a0c-4902-8035-35437aaa16fa` (location: Zoom; one optional question: "Please share anything that will help prepare for our meeting.").

---

## 6. Screens and user flow

### 6.1 Opening screen (splash)
- Plays on **every** page load (~3 s). Fraternity seal scales in, **"Jack Dee" is handwritten**: an SVG `<text>` with one `<tspan>` per letter; each letter's outline is traced with an animated `stroke-dashoffset` (left to right, 0.13 s apart), then fills white. Finishes at ~2.4 s. Reduced motion shows the filled name at once. CSS: `.sig-draw` in `calendar/app.css`. "Book Time · GeauxMAB" fades in, a light bar sweeps.
- Why not a clip-path wipe: with a block font (Michroma) a left-to-right wipe reads as a reveal, not as handwriting. The stroke trace looks like a pen with any font.
- Sits above everything (`z-[100]`), including the tab bar.

### 6.2 Header (sticky)
- Left: **Jack Dee / Life Member #2174**.
- Then three linked insignia (same size, same centerline): **Phi Beta Sigma seal** → phibetasigma1914.org, **Gulf Coast Region** → pbsgulfcoastregion.org, **North Dallas Sigmas** (Omicron Sigma Alumni Chapter) → omicronsigma1914.org. Each has a hover label.
- Right: **Save** (icon-only on phones, "Save App" on wider screens). In desktop mode Save is hidden (it is an app feature) and Share and Menu show instead.
- Desktop mode (≥ 1024 px) adds center navigation pills: Home, The Brotherhood, The Scholarship, The Service.
- On non-home views the left side becomes a back arrow; tablet center title shows the view name (hidden in desktop mode, where nav takes its place).

### 6.3 Home screen (phones and tablets, under 1024 px)
One centered column, `max-w-xl`. Desktop mode replaces this with the hero in [§23](#23-desktop-mode).

1. **Social row** (scrolls away, not sticky): grouped **Personal | Social | Business** with thin dividers and hover labels.
   - Personal: MrJackDee.com
   - Social: Facebook (geauxmab), Instagram (the.jackdee), X (MrKreducator)
   - Business: DonOra Global, LinkedIn (mrjackdee), Email (jd@geauxmab.com)
2. **Photo** (links to MrJackDee.com, new tab) with subtle 3D tilt and shine; **gold Life Member pin** fixed upright on the lower-right corner. Photo width = `min(16.5rem, 36svh)` on phones so the main button stays visible.
3. **Time Available** badge (green glow) appears **only** when Calendly confirms real openings in this month or next. Otherwise nothing renders.
4. **My Calendar** button with caption "Tap to Schedule" ("Click" with a mouse; see `TAP` below) → calendar screen. No Share pill here; the tab bar has Share.
5. Divider: "To Quick Book".
6. **Next Openings** panel: four soonest openings as two auto-width columns ("Today 10:00 am EDT"), "Click to select", 12/24-hour toggle, and the **Your Local Time** pill (plus "My Time" in Eastern when zones differ). Tapping a time jumps straight to the About You step with that time preselected. Hidden entirely when there are no near-term openings.
7. **Save to Home Screen** button, then footer.

### 6.4 Calendar screen (heading "Jack Dee" in Michroma)
- **Heading:** "Jack Dee" in Michroma (`.signature-text`), `text-3xl sm:text-4xl md:text-5xl`, one line.
- In desktop mode this screen does not exist on its own: `#book` scrolls to the calendar section on the home page.
- **Tap/Click wording:** every how-to hint uses `TAP` from `clock.tsx`: "Click" when the device has a mouse (`(hover: hover) and (pointer: fine)`), otherwise "Tap".
- **Progress rail:** Select a Date → About You → Complete. Steps size to their labels; connecting lines fill remaining space.
- **Hint:** "Tap a day with a dot, then pick a time." Hidden after the visitor taps a day or time (the auto-selected first day does not hide it).
- **Calendar card:** month grid; only days with openings are tappable (dot under the date); today has a thin white outline; selected day is a glowing white tile that animates between days. Month arrows; previous disabled on current month. First open day auto-selected; if this month has none, it advances one month.
- **Month title:** one line (`whitespace-nowrap`), `text-lg md:text-base lg:text-xl`. The `md` step down exists because Michroma is wide: at tablet width "September 2026" (the longest month) must fit between the arrows.
- **Open Times card:** "⚡ Open Times", **‹ day ›** arrows that step through open days across months (day label in Michroma via `.heading-font`), "Tap to select", 12/24-hour toggle, Morning/Afternoon/Evening filter (only when a day has 7+ times), and the **Your Local Time** pill which doubles as the time-zone picker.
- **Time button columns:** 2 on phones; 3 from 640 px; **back to 2 at 768–1023 px** (tablet, where the calendar and times sit side by side and 3 columns overflowed and were cut off); 3 again in desktop mode. With exactly 4 times it stays 2×2 so no time sits alone on a row.
- **Equal heights:** from 768 px the times card stretches to the calendar card's height (`md:h-full`, content centered).
- **Next action:** laptops get an inline "10:30 am works for me →" button with "Click to continue and add your details." under it; phones get a dock above the tab bar that says "Time selected. Tap Next to Continue.", shows the day, time with time-zone abbreviation and "60 min", and a **Next** button with a soft pulse and nudging arrow.

### 6.5 About You
- Summary card: date tile (month + day), **weekday** only (month/day already on the tile), time range **with time-zone abbreviation**, "60 min · Zoom", and **Change**.
- Fields: **Your Name** (placeholder "A Langston Taylor"), **Where should I send your Zoom link?** (email), **Phone number** (optional, auto-formats ###-###-####), **Text me about this booking (optional)** checkbox with SMS disclaimer, **What do you want to talk about?** (optional).
- Required checkbox: agreement to Terms of Service and Privacy Policy, including recording consent and release (links open in a new tab so the form is not lost).
- **Lock It In** button (shows "Saving your spot" while submitting).

### 6.6 Complete
- Gold check that draws itself, dot burst, "Booking Complete", "See you then, {first name}.", "Meeting details have been sent to {email}.", summary card, **Reschedule** / **Cancel** (Calendly links), **Book Another**, then a quiet credential row (Life Member pin, "Jack Dee · Life Member #2174 · Phi Beta Sigma Fraternity, Inc.").

### 6.7 Menu ("More" on phones)
- Links back to geauxmab.com sections, **Affiliations** (Life Member #2174, Gulf Coast Region, North Dallas Sigmas with Omicron Sigma Alumni Chapter · Dallas, Texas), then social icons grouped **Personal / Social / Business** with labels.

### 6.8 Footer
- White pills: Home, The Brotherhood, The Scholarship, The Service; "A GeauxMAB.com experience"; social icons; © MrJackDee™; disclaimer **"Not an official site of Phi Beta Sigma Fraternity, Inc."**; Privacy Policy · Terms of Service.

### 6.9 Routing
Hash-based, no router dependency: `#` home, `#book` calendar, `#privacy`, `#terms`. Browser back works. Screens slide left/right.

---

## 7. Server API (Cloudflare Worker)

File: `worker/index.ts`. All API responses are JSON with `cache-control: no-store`.

### `GET /api/slots?month=YYYY-MM`
- Returns `{ slots: string[] }` of UTC ISO start times that are `available`, sorted and de-duplicated.
- Pads one day on each side of the month so every visitor time zone sees its whole month.
- Never asks for the past (`max(monthStart - 1 day, now + 60 s)`).
- Calendly allows **at most 7 days per request**, so the Worker splits the range into week windows and fetches them in parallel.
- Errors: `400` bad month; `502` if any Calendly call fails; `503` "Booking is not set up yet." when token or event type is missing.

### `POST /api/book`
Body: `{ start_time, name, email, timezone, notes?, phone?, sms? }`

- Validates name, email, start time, and phone (`^\d{3}-\d{3}-\d{4}$` when present).
- Builds the notes answer: visitor notes + `Phone: ###-###-####` + `SMS updates: Yes/No` + the agreement line added by the client.
- Calls `POST /invitees` with `invitee {name, email, timezone}`, `location {kind: zoom_conference}`, `questions_and_answers` (the event's notes question, position 0).
- If the visitor opted into texts, also sends `invitee.text_reminder_number` as **`+1##########`** (E.164, Calendly's required format). If Calendly rejects it (text reminders not enabled on the event), the Worker **retries without it** so the booking still succeeds.
- Errors: `400` validation; `409` "Someone just grabbed that time…" (client reloads slots and returns to Pick a Time); `502` other Calendly failures.
- Success: `{ ok, start_time, name, email, cancel_url, reschedule_url }`.

### Dev mode
`vite.book.config.ts` mounts the same handler at `/api/*` in the Vite dev server via `ssrLoadModule`, passing `MOCK_CALENDLY: "1"` when no token is present. Mock slots are deterministic 30-minute times between 10:00 and 21:00 Eastern.

---

## 8. Calendly integration details

- **Plan:** creating bookings via `POST /invitees` (Scheduling API) requires a paid Calendly plan. Availability reads work on any plan with API access.
- **Token:** Personal Access Token (Calendly → Integrations & apps → API & Webhooks), stored as Worker secret `CALENDLY_TOKEN`.
- **Location must match the event type** (`zoom_conference`).
- **Questions:** answers must match the event's question text exactly. This build uses the single optional question: "Please share anything that will help prepare for our meeting."
- **Consent record:** every booking's notes include `[Agreed to Terms of Service and Privacy Policy (Terms 2026-10-29), including recording consent and release, at <ISO timestamp>]`. Bump `TERMS_VERSION` in `Booking.tsx` whenever the Terms change.
- **Emails, Zoom links, reminders, reschedule and cancel** are all handled by Calendly.

---

## 9. Time, time zones, and formatting

- **Source of truth:** Calendly returns UTC instants. The UI converts every time with `Intl.DateTimeFormat` in the **viewing time zone**.
- **Viewing time zone** (`useViewZone` in `clock.tsx`): defaults to the visitor's system zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`). The picker can override it; the override is shared across home and calendar via `sessionStorage` and a window event, and lasts for the visit only.
  - When overridden, the pill label reads **"Showing Pacific Time"** and a **"Use my time (Eastern)"** link appears.
  - Dropdown options show the current abbreviation, e.g. "Central Time (CDT)". Arizona is listed separately as **"Mountain Time, Arizona (MST, no daylight saving)"** because it does not observe DST.
- **Day grouping** uses the viewing zone (`en-CA` formatter gives `YYYY-MM-DD`), so "Today/Tomorrow" and calendar days are correct for the visitor.
- **12/24-hour** (`useClock24`): default 12-hour; stored in `localStorage` (`geauxmab_24h`) and shared across screens. 12-hour shows lowercase `am/pm` (style choice); 24-hour shows `14:30`.
- **Time zone abbreviations** (EDT, CDT…) accompany every displayed time.
- **Session length** is fixed at 60 minutes in display code (`fmtEnd` adds 1 hour).

---

## 10. Phone number and SMS consent

- Optional field, `type="tel"`, auto-formats as the visitor types: strips non-digits, drops a leading `1` (US area codes never start with 1), caps at 10 digits, formats `###-###-####`.
- Partial numbers block submission with: "Please enter a full 10-digit phone number, or leave it blank."
- SMS checkbox is **optional, unchecked by default, disabled until a number is entered**, and consent is **not** a condition of booking.
- Disclaimer text (under the field): messages from Jack Dee about this booking (confirmations, reminders, schedule changes), frequency varies, message and data rates may apply, STOP/HELP, consent not required, number not shared or sold for marketing, link to Privacy Policy.
- Privacy Policy has a **Text messages** section including the carrier-required statement that mobile numbers and SMS consent are never sold or shared with third parties for marketing.

---

## 11. Legal pages and consent capture

- `#privacy` and `#terms`, rendered by `Legal.tsx` in a card matching the app.
- **Terms highlights:** agreement with Jack Dee (Dallas County, Texas resident); eligibility 18+; booking/cancellation; conduct; **recording, transcription and release** (Texas one-party consent plus express consent); **intellectual property** (session content and recordings are Jack's; visitor grants a perpetual license including name, likeness and voice); brand (MrJackDee™; Phi Beta Sigma marks belong to the fraternity; not endorsed by it); informational only; third-party services; disclaimers and **$100 / amount-paid liability cap**; indemnification; **Texas law, Dallas County state courts or N.D. Tex. Dallas Division, no class actions, one-year filing limit**; general.
- **Privacy highlights:** data collected (booking info, phone if given, session recordings, technical data); uses; sharing (Calendly, Zoom, AI note-takers, Cloudflare); no sale or targeted advertising; text messages; browser storage; retention and security; rights including Texas Data Privacy and Security Act; children; contact **jd@geauxmab.com**.
- Conspicuous clauses (release, warranty disclaimer, liability, venue) are bold, boxed and high-contrast for Texas fair-notice requirements.
- **Clickwrap:** required checkbox on About You; acceptance line with version and timestamp saved in the Calendly booking.
- **Not legal advice.** Have a licensed Texas attorney review before relying on these documents.

---

## 12. Design system

### Colors
| Token | Value | Use |
|---|---|---|
| Royal Blue | `#164F90` | Page background, primary surfaces (Phi Beta Sigma official) |
| Pure White | `#FFFFFF` | Text, primary buttons, pills |
| Panel Blue | `#113B6C` | Raised cards (Next Openings, Calendar, Open Times, legal) |
| Cool Gray 3 | `#C8C9C7` | Secondary/muted text (fraternity secondary color) |
| Emerald | `emerald-400` | **Only** the "Time Available" status glow |
| Red | `red-*` | **Only** error messages |

- **No gold** anywhere except official insignia artwork (Life Member pin).
- Royal blue is overridden in `calendar/app.css` (`--color-royal-blue: #164f90`) so the shared `index.css` (used by the main site) is untouched.
- `--text-xs` is reset to `0.75rem` in `app.css` because the shared stylesheet shrinks it to 9 px.

### Typography
Two Google Fonts, loaded in `calendar/index.html` (`family=Michroma&family=Oxanium:wght@400;500;600;700;800`) and wired in `calendar/app.css`:

| Role | Font | How it is applied |
|---|---|---|
| "Jack Dee" and all headings | **Michroma** (one weight; wide, squared) | `--font-signature`; `.book-app :is(h1,h2,h3)` and `.heading-font` (for non-heading titles such as the Open Times day label). Letter-spacing `0.01em` (`0.02em` on `.signature-text`), line-height 1.2. Keep existing bold classes; the browser thickens Michroma, which is the approved look. |
| Everything else: body, buttons, links, form fields, labels | **Oxanium** (400–800; squared, readable small) | `--font-sans` and `--font-primary` overridden in `app.css`, so Tailwind's `font-sans` and plain `body` text both use it. Buttons and inputs inherit. |

- **Sizing rule:** Michroma is about 1.6× wider than a script font. "Jack Dee" sizes: splash `w-[16rem] md:w-[24rem]` (SVG), calendar heading `text-3xl sm:text-4xl md:text-5xl`, desktop hero `text-6xl xl:text-7xl`. Any `whitespace-nowrap` heading must be checked at 375 and 768 px with the longest real text.
- **Text 11 px and smaller stays in Oxanium** (e.g. the tablet header view title). Michroma is too wide to read that small.
- **Michroma has no Greek letters.** The Σ in the icon and share card uses Georgia Bold.
- The fonts are set in `calendar/app.css`, not in the shared `index.css`, so the booking build never depends on the main site's stylesheet.
- **Mixed case everywhere.** No `uppercase` styling except the share card's small "BOOK TIME WITH" kicker. Letter spacing `tracking-wide` at most.
- Minimum text size **11 px**; body copy 14 to 16 px; form inputs 16 px (prevents iOS zoom).
- History: the original signature font was Brittany Signature with Allura as fallback. Brittany was installed only on the owner's PC (never hosted), so every visitor actually saw Allura. Rejected alternatives: masculine scripts (Mr Dafoe, Yellowtail), Play, Russo One; Michroma was chosen for headings and Oxanium for small text (Exo 2, Saira, Titillium Web, Chakra Petch, Play also compared).

### Components and patterns
- **Pills and buttons size to their content.** No fixed widths; grids use `repeat(n, auto)` so panels shrink-wrap.
- **Cards:** `rounded-[28px]`, `border-white/15`, soft shadow, thin white gradient line along the top edge.
- **Primary button:** white pill, royal blue text. **Ghost button:** white outline; on hover flips to white with royal blue text.
- **Hover labels (tooltips):** white pill, royal blue text, below header icons, above footer/menu icons; also show on keyboard focus.
- **Hover/tap feedback** (global, `app.css`): lift 2 px + white glow on hover (mouse only), press to 95% on tap, white focus ring for keyboard. Uses the individual `translate`/`scale` CSS properties so it composes with Motion's transforms.
- **No `backdrop-filter`.** Blurred translucent layers over the animated background caused flicker; all surfaces are solid.

---

## 13. Brand rules (Phi Beta Sigma)

From the fraternity's Brand Standards (Rev. 2026.09.09):
- Official colors **Royal Blue `#164F90`** and **Pure White**; secondary **Cool Gray 3 `#C8C9C7`** and black.
- Seal and shield displayed only in royal blue and/or white; Greek letters ΦΒΣ only in royal blue or white.
- Symbols are not to be altered: **the seal never rotates** (backgrounds only drift and breathe; the photo pin is fixed upright).
- Use the **seal** (members may use it), not the shield (restricted to official documents and jewelry).
- Do not imply fraternity endorsement: footer disclaimer and Terms language.
- Chapter nickname ("North Dallas Sigmas") must appear with the full chapter name ("Omicron Sigma Alumni Chapter") and location.
- Official Life Member artwork comes from the brand guide (Gold tier, page 15). AI-upscaled versions were rejected because they distorted the Greek letters.

---

## 14. Mobile-first and accessibility rules

Breakpoints: under 1024 px = **app layout** (phones and tablets, bottom tab bar); 1024 px and wider = **desktop mode**. Full test matrix in [§25](#25-testing-matrix).

Verified at **320 px** (iPhone SE) and 375/390 px:
- No horizontal scrolling on any screen; nothing clipped inside cards (grid columns use `minmax(0, 1fr)`).
- Sticky header is a single row; the social row scrolls away.
- Primary action visible without scrolling on the home screen.
- **Tap targets ≥ ~44 px** using invisible padding (`.tap-target`, `.tap-target-y` pseudo-elements), so visuals stay compact.
- Bottom tab bar on phones: Home, Book, Share, More. Booking dock sits above it.
- Safe-area insets respected (`env(safe-area-inset-*)`).
- `prefers-reduced-motion`: Motion config `reducedMotion="user"`; hover lift/press disabled.
- Images have alt text; decorative layers `aria-hidden`; tooltips `role="tooltip"`; toggles are `role="radiogroup"`/`radio`; filters are tabs.
- Color is never the only signal (the status badge has text; selected states change fill and text).

---

## 15. Motion and animation rules

- Splash: seal scale-in, pen-trace "Jack Dee" (each letter outlined left to right, then filled; see §6.1), loading sweep.
- Desktop mode: quick picks and "Pick a Time" smooth-scroll to the calendar section.
- Screen transitions: horizontal slide.
- Calendar: days pop in, month slides, selected-day pill uses a shared layout animation.
- Lists: short staggered fade/slide-in (≤ 0.5 s total).
- Social icons: staggered pop-in on first view; hover lift + slight tilt; tap press.
- Divider "To Quick Book": lines draw outward, text fades in, once.
- Confirmation: check draws, dot burst.
- **Forbidden:** rotating the seal; continuous attention-seeking loops on content; blur layers over animation.

---

## 16. Content and copy decisions

| Element | Final copy |
|---|---|
| Home-screen app name (`short_name`, iOS app title) | ΦΒΣ Jack Dee |
| Browser tab, bookmark, `manifest.name`, Share title | ΦΒΣ Calendar \| Jack Dee |
| Link preview title / description | Book Time with Jack Dee / Pick a time and let's connect. |
| Header subtitle | Life Member #2174 |
| Home button / caption | My Calendar / Tap to Schedule ("Click" with a mouse) |
| Divider | To Quick Book |
| Quick-pick panel | Next Openings / Tap to select |
| Desktop hero | Jack Dee · "Book a 60-minute Zoom session with me. Pick a time that works for you, add your info, and you're booked." · chips 60 min / Zoom / Life Member #2174 · Pick a Time · Share · "Next openings · Click one to book it" |
| Desktop calendar section | Pick a time · "Times show in your time zone. Change it under the open times." |
| Calendar heading | Jack Dee (Michroma) |
| Steps | Select a Date · About You · Complete |
| After picking a time (phone) | Time selected. Tap Next to Continue. |
| Time panel | Open Times |
| Local time | Your Local Time / Showing {Zone} / Use my time ({Zone}) |
| Name placeholder | A Langston Taylor |
| Submit | Lock It In |
| Confirmation | Booking Complete · See you then, {name}. · Meeting details have been sent to {email}. |
| Footer disclaimer | Not an official site of Phi Beta Sigma Fraternity, Inc. |

- First-person voice ("my calendar", "when I'm free").
- No "Man in Motion" in the booking app; GeauxMAB is not presented as a trademark.

---

## 17. Assets

| File | Notes |
|---|---|
| `img/pbs-seal.png/.webp` | Official full-color seal (header, splash) |
| `img/pbs-seal-watermark.webp` | White line-art seal for backgrounds (low opacity, no rotation) |
| `img/life-member.png/.webp` | Gold Life Member logo extracted with transparency from brand guide p.15 |
| `img/region-gulf-coast.png/.webp` | Gulf Coast Region seal, trimmed to its circle |
| `img/chapter-omicron-sigma.png/.webp` | North Dallas Sigmas chapter seal, circular mask |
| `img/jack-dee.jpg/.webp` | Headshot |
| `favicon.ico` (16/32/48), `favicon-32.png`, `icon-192.png`, `icon-512.png` | Royal blue Σ on a rounded white tile. Generated by `calendar/tools/make-icons.py` |
| `icon-maskable-512.png`, `apple-touch-icon.png` | Same Σ on a full-bleed white square (Android masks, iOS rounds the corners itself) |
| `img/share-card.jpg` | 1200×630 link preview (og:image). Rendered from `calendar/tools/share-card.html`; see [§24](#24-naming-icon-and-link-preview-per-site) |

Images are served at ~2 to 4× display size, WebP with PNG/JPG fallback via `<picture>`.

---

## 18. PWA (save to home screen)

- `manifest.webmanifest`: `name` "ΦΒΣ Calendar | Jack Dee", `short_name` "ΦΒΣ Jack Dee", `display: standalone`, theme/background `#164F90`. iPhones read the home-screen name from `<meta name="apple-mobile-web-app-title">` in `index.html`, so set both. Naming rule in [§24](#24-naming-icon-and-link-preview-per-site).
- `sw.js`: network-first, cache fallback offline; **never caches `/api/*`** (availability must be live). Bump `CACHE` when shell assets or icons change (currently `book-jackdee-v3`).
- The "Save to Home Screen" sheet previews the icon and the exact home-screen name ("ΦΒΣ Jack Dee").
- Phones keep the name and icon a visitor saved; changes only show after they remove and re-save the app.
- Save button uses the `beforeinstallprompt` event where supported, otherwise shows an iOS "Share → Add to Home Screen" sheet.

---

## 19. Browser storage

| Key | Storage | Purpose |
|---|---|---|
| `geauxmab_24h` | localStorage | 12/24-hour preference |
| `geauxmab_tz` | sessionStorage | Time-zone override for this visit |
| Service worker cache `book-jackdee-v3` | Cache Storage | Offline shell |

All access is wrapped in try/catch; the app works with storage blocked. No cookies, analytics, or ad tracking.

---

## 20. Replicating this for another site

1. **Copy** `calendar/`, `worker/`, `vite.book.config.ts`, `wrangler.jsonc`, the `dev:book`/`build:book` scripts, and the dependencies from `package.json`.
2. **Calendly:** create the event type (fixed duration, Zoom or other location, one optional notes question). Copy its URI into `wrangler.jsonc` `CALENDLY_EVENT_TYPE` and the dev URI in `vite.book.config.ts`. If the question text differs, update `NOTES_QUESTION` in `worker/index.ts`.
3. **Identity:** update `IMG`, `LINKS`, `SITE_LINKS`, `SOCIAL_GROUPS`, `AFFILIATIONS`, `JACK_TZ` (host time zone), header name/subtitle, splash text, `SHARE`, and the copy table above.
4. **Brand:** change `--color-royal-blue` in `app.css` and the panel blue `#113b6c` / gray `#c8c9c7` utility values; check any organization brand rules (colors, symbol handling, disclaimers).
5. **Legal:** update `OWNER`, `CONTACT`, `SITE`, jurisdiction and venue in `Legal.tsx`; bump `TERMS_VERSION`; get local legal review.
6. **Naming, icon, link preview:** follow [§24](#24-naming-icon-and-link-preview-per-site). Each booking site gets its own purpose-first name, its own icon mark and color, and its own share card, so bookmarks never get confused between sites.
7. **Fonts:** keep Michroma (headings) and Oxanium (everything else) for the family look, or swap both in `calendar/index.html` and `calendar/app.css`. If the heading font changes, re-check every `whitespace-nowrap` heading and the time-button columns at 768 px.
8. **PWA:** update `manifest.webmanifest`, `apple-mobile-web-app-title`, icons, `index.html` meta, and the service worker cache name.
9. **Cloudflare:** rename the Worker in `wrangler.jsonc`, set the custom domain route, add the `CALENDLY_TOKEN` secret, connect the repo with the build/deploy commands.
10. **Test:** run the full matrix in [§25](#25-testing-matrix) in mock mode, then one real booking in production.

---

## 21. Go-live checklist

- [ ] Cloudflare build: branch `main`, `npm run build:book`, `npx wrangler deploy`.
- [ ] Worker secret `CALENDLY_TOKEN` set.
- [ ] geauxmab.com zone in the same Cloudflare account; `book.geauxmab.com` custom domain Active with certificate.
- [ ] Calendly plan supports the Scheduling API; optional: enable text reminders on the event.
- [ ] Zoom recording consent notice on.
- [ ] `jd@geauxmab.com` exists in Google Workspace.
- [ ] omicronsigma1914.org certificate fixed (currently browser warning).
- [ ] Texas attorney review of Terms and Privacy Policy.
- [ ] Real test booking: confirmation email, Zoom link, notes (agreement + phone), cancel test booking.
- [ ] Main site (geauxmab.com) rebuilt and redeployed to Hostinger for the updated social links and email.
- [ ] Link preview refreshed after any share-card change: Facebook Sharing Debugger and LinkedIn Post Inspector ("scrape again").
- [ ] Icons and names checked in a private window (browsers cache icons) and by re-saving to a phone home screen.

---

## 22. Known limitations and decisions log

- Calendly availability API is limited to 7-day windows; the Worker batches by week.
- Session length is assumed 60 minutes in display code.
- Phone handling assumes US numbers.
- AM/PM lowercase is a style choice; browsers default to uppercase.
- Time-zone override resets each visit by design.
- `*.workers.dev` URL may be disabled by deploys while a custom domain is configured.
- The Calendly embed was removed entirely; there is no fallback to Calendly's hosted page.
- Fonts: the brand guide recommends Arial; the owner chose Michroma (headings) and Oxanium (everything else), applied to both book.geauxmab.com and geauxmab.com for one family look. The Journal on geauxmab.com mixes them with Georgia for article text.
- Main site and booking app share `index.css`; booking-specific overrides live only in `calendar/app.css`.
- Desktop mode switches automatically at 1024 px; there is no manual toggle (fewer choices, and it always matches the screen).
- Home-screen names are limited to ~12 visible characters, so the distinguishing word comes first ("ΦΒΣ Jack Dee").
- No emoji in names: emoji render differently on each phone, and 📅 shows a fixed date (Apple's says July 17).
- Link previews are cached by social apps; old posts can show the old card until re-scraped.

---

## 23. Desktop mode

The app is built mobile-first, but at **1024 px and wider** it becomes a desktop website automatically. Phones and tablets (including tablet portrait at 768 px) keep the app layout.

- **Switch:** `useDesktop()` in `CalendarPage.tsx`, a `matchMedia('(min-width: 1024px)')` listener. Layout utilities that belong to the switch use the `lg:` prefix (not `md:`), so tablets never get a half-desktop layout.
- **Header:** center nav pills (Home, The Brotherhood, The Scholarship, The Service); Share and Menu on the right; Save hidden.
- **Tab bar:** hidden (`lg:hidden`).
- **Hero** (`max-w-6xl px-8`, grid `minmax(0,1fr) auto`, gap 16 to 24): left column has the Time Available badge (only when real openings exist), "Jack Dee" (`text-6xl xl:text-7xl`), the one-line description, chips (60 min · Zoom · Life Member #2174), **Pick a Time** + **Share**, then **Next openings** as one row of four time buttons (`NextOpen row`). Right column: the photo at `w-[22rem] xl:w-[26rem]`.
  - This layout replaced a 2-column grid where a narrow card sat left-aligned in its column and the photo was centered in the other, leaving ~377 px of dead space at 1440 px.
- **Calendar on the home page:** a "Pick a time" section (`id="pick-a-time"`, `scroll-mt-20`) holds the full `<Booking>` flow, left-aligned with the hero.
  - **Pick a Time** smooth-scrolls to it.
  - A quick-pick time scrolls down and opens **About You** with that time already chosen (`<Booking key={quick} initialTime={quick}>`).
  - `#book` links (old bookmarks, shared links) land on the home page and scroll to the section: `shown = desktop && view === 'book' ? 'home' : view`.
- **Wording:** hints say "Click" with a mouse and "Tap" on touch (`TAP` in `clock.tsx`).

---

## 24. Naming, icon and link preview (per site)

When this format is reused across several sites, each with its own Calendly event and availability, every site must be **instantly distinguishable** in bookmarks, browser tabs and on phone home screens.

### Naming rule
| Where | Rule | This site |
|---|---|---|
| Phone home screen (`short_name` and `apple-mobile-web-app-title`) | ≤ 12 characters, **distinguishing word first** | ΦΒΣ Jack Dee |
| Browser tab, bookmark, `manifest.name`, `SHARE.title` | "[Calendar name] \| [Person]" | ΦΒΣ Calendar \| Jack Dee |
| Calendly event type name | Match the tab name so emails and invites line up | Jack Dee \| ΦΒΣ Calendar |
| Link preview `og:title` | An invitation, not a label | Book Time with Jack Dee |

Phones and bookmark lists cut names off at the end, so names that all start with the person's name look identical. Greek letters render reliably everywhere; emoji do not (see §22).

### Icon
- One mark per site (a letter or symbol), in the site's brand color on white. **Never reuse another site's mark**; the icon is what people recognize first.
- Generate every size at once (Windows, Pillow installed):
  ```bash
  python calendar/tools/make-icons.py calendar/public "Σ" 164f90
  ```
  The script uses Georgia Bold (it has Greek letters). It writes the favicon (16/32/48), 32 px, 192, 512, maskable 512 (mark kept inside Android's safe zone) and the 180 px Apple icon (no transparency).
- `index.html` links: `favicon.ico` (48), `favicon-32.png`, `icon-192.png`, `apple-touch-icon.png`. The manifest lists 192, 512 and maskable 512.
- Bump the service-worker `CACHE` name after changing icons.

### Share card (link preview)
- Template: `calendar/tools/share-card.html` (1200×630). Edit the four marked values (brand colors, mark, name, domain); the photo comes from `calendar/public/img/jack-dee.jpg`.
- Render with headless Chrome. It loads the Google Fonts online, so stay connected. Then save as JPEG (about 65 KB):
  ```bash
  "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --hide-scrollbars --virtual-time-budget=5000 --window-size=1200,630 --screenshot="C:\temp\card.png" "file:///C:/Users/drjac/code/geauxmab-live/calendar/tools/share-card.html"
  ```
  ```bash
  python -c "from PIL import Image; Image.open('C:/temp/card.png').convert('RGB').save('calendar/public/img/share-card.jpg', quality=88, optimize=True)"
  ```
- Card content rules: name in Michroma, one short line ("Pick a time that works for you"), the domain pill, the site mark. **No session length on the card** (owner decision).
- `index.html` tags: `og:image` (absolute URL), `og:image:width` 1200, `og:image:height` 630, `og:image:alt`, `twitter:card` = `summary_large_image`. A small square image would only get the small thumbnail layout.

---

## 25. Testing matrix

Run before every deploy, in mock mode (`npm run dev:book`) and again on the live site.

| Size | Device | Layout |
|---|---|---|
| 320×568 | Small phone | App |
| 375×812 and 390×844 | Phone portrait | App |
| 812×375 | Phone landscape | App |
| 768×1024 | Tablet portrait | App |
| 1024×768 | Tablet landscape | Desktop |
| 1280×800 | Laptop | Desktop |
| 1440×900 | Desktop | Desktop |

Screens: home, `#book` (Select a Date with a day selected), About You (pick a time, press Next), Complete (mock booking), `#privacy`, `#terms`, the splash.

At each size check:
1. **No sideways scroll:** `document.documentElement.scrollWidth <= innerWidth`.
2. **Nothing off-screen or cut off.** Walk every text element and flag any that crosses the viewport edge or the edge of its nearest `overflow: hidden` parent. The second check matters: at 768 px three time-button columns overflowed and were silently clipped by the card, and only that check caught it.
3. **Longest content fits:** "September 2026", longest weekday and date, longest time with zone ("12:30 EDT").
4. **Fonts loaded:** `document.fonts.check('16px Michroma')` and `document.fonts.check('16px Oxanium')` are both true; computed `font-family` is Michroma on headings and Oxanium on body text and buttons.
5. **Splash animation:** screenshots lag behind fast animation, so verify by pausing. Run `document.getAnimations()`, filter to the `tspan` targets, pause them, set `currentTime` to 900 / 1500 / 2600 and read `stroke-dashoffset` and `fill`: letters should draw in order and all be filled by 2600 ms (the splash closes at 3000 ms).
6. **Desktop mode:** quick pick opens About You with that time; `#book` scrolls to the calendar; no tab bar; no Save button.
7. **Live only:** `GET /api/slots?month=YYYY-MM` returns real slots; the icons, `share-card.jpg` and `sw.js` return 200; the page title and manifest names are correct.

---

## 26. Deploying from a shared repo

This repo also holds geauxmab.com, which another person or session may be editing at the same time. The booking build imports the shared `index.css`, so a deploy from the working folder could ship someone else's unfinished edits. Deploy from a clean, temporary copy instead:

```bash
git worktree add --detach ../book-deploy HEAD          # last committed shared files
rm -rf ../book-deploy/calendar && cp -r calendar ../book-deploy/calendar   # your booking changes
cmd //c mklink //J "..\book-deploy\node_modules" "node_modules"            # reuse installed packages
cd ../book-deploy && npm run build:book && npx wrangler deploy
cmd //c rmdir "..\book-deploy\node_modules"            # remove the link first so packages are not deleted
cd ../geauxmab-live && git worktree remove --force ../book-deploy
```

Then commit **only** booking paths: `git add -- calendar README_BOOKINGPAGE.md && git commit -- calendar README_BOOKINGPAGE.md`. Never `git add -A` in a shared folder.
