# geauxmab.com: App-Style Site, Live Feeds and The Journal

geauxmab.com now looks, feels and navigates like book.geauxmab.com. Both sites share:
- the same royal blue (#164F90) and dark blue panels
- the same buttons, header, phone tab bar, slide-out menu and footer
- the same opening screen

| Piece | Where it runs | Source |
|-------|---------------|--------|
| The site (all pages) | Hostinger (static files) | `App.tsx`, `SiteChrome.tsx`, `NewsFeed.tsx`, `Journal.tsx`, `index.css` |
| News feeds and The Journal | Cloudflare Worker on `geauxmab.com/api/*` and `geauxmab.com/journal/*` | `site-worker/index.ts`, `wrangler.site.jsonc` |
| Chapter pages under `/os` | Hostinger, **unchanged** | `public/os/` (copied as-is into every build) |

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.
- **Local API:** in dev, the news feeds, Journal and RSS run the same Worker code as production.
- **Local Journal entries:** saved to `.dev-journal.json`, which git ignores.
- **Write page:** `#/journal/write` works locally without signing in.
- **Skip the opening screen:** add `?nosplash` to any URL when testing.

## Pages

| Menu | Route | What's on it |
|------|-------|--------------|
| Home | `#/` | Dashboard: welcome card with handwritten name and roles, Life in Motion tiles, My Apps dock, Words I Live By, both live feeds |
| The Brotherhood | `#/bio` | Live "By the Numbers" counters, My Chapters, podcast card, scroll timeline since 1998, Brotherhood Beyond Sigma |
| The Scholarship | `#/leadership` | Doctoral progress ring, the research question with EEOC chart, doctoral journey, BeVISIBLE™ model, A Lifelong Student (degrees), What I'm Building |
| The Service | `#/lifestyle` | Lotus art opener, box-breathing widget, daily practice, Air Jordans and the hunt, On the Move, In the Community |
| The Journal | `#/journal`, `#/journal/<story>` | Newspaper-style front page and articles |
| (private) | `#/journal/write` | Write, edit and remove entries |

## Live feeds

### "There's Something Special Going on in Phi Beta Sigma" (`/api/news`)
- **Sources:**
  - Google News for Phi Beta Sigma and the Sigma Beta Club
  - the official Phi Beta Sigma YouTube channel
  - The Crescent Podcast (official)
  - Code Blu: A Sigma Podcast
- **Filtering:** negative headlines (hazing, arrests, lawsuits and similar) are left out.
- **Caching:** 30 minutes.
- **Fallback:** if the Worker isn't deployed yet, the carousel shows Google News headlines through a public relay.

### "What Jack Dee Is Following" (`/api/following`, RSS at `/api/following.xml`)
- **Topics:** Politics, Black Politics, DEI, LGBTQ+ Rights, AI (ChatGPT, Claude, Gemini, AI adoption), Credit & Points, Air Jordans, and Yoga & Meditation.
- **Freshness:** only stories from the last 5 days, rebuilt automatically every 6 hours.
- **Changing topics:** edit `TOPICS` in `site-worker/index.ts`.

## The Journal

### Writing an entry
1. On your phone or laptop, go to **geauxmab.com/#/journal/write**.
2. Tap **Sign In** and use **jd@geauxmab.com**. Cloudflare emails you a one-time code.
3. Fill in the entry:
   - a headline
   - an optional subheadline
   - a section (Life, Brotherhood, Faith and so on)
   - an optional photo link
   - the story
4. Tap **Publish**.

Formatting for the story:
- Leave a blank line between paragraphs.
- `## ` at the start of a line makes a heading.
- `> ` makes a pull quote.
- `**bold**` and `*italic*` work.

The entry appears on the Journal page at once and in the RSS feed at **https://geauxmab.com/journal/rss.xml**. Readers can subscribe to that link in any RSS reader, Feedly, or an email-by-RSS service. Drafts save on the device as you type. You can edit or remove published entries from the same page.

## Go-live checklist (one time)

1. **Publish the site to Hostinger.**
   - Run `npm run build`.
   - Upload the contents of `dist/` to the site's `public_html`.
   - `dist/os` is an exact copy of `public/os`, so the chapter pages stay as they are.
2. **Create the Journal storage.**
   - Run `npx wrangler kv namespace create JOURNAL`.
   - Paste the id into `wrangler.site.jsonc`.
3. **Protect the write page with Cloudflare Access.**
   - In Cloudflare Zero Trust, add a self-hosted application for `geauxmab.com/api/journal/admin`.
   - Allow only the email jd@geauxmab.com.
   - Copy the application's **Audience (AUD) tag** and your team domain (`<team>.cloudflareaccess.com`) into `wrangler.site.jsonc`.
4. **Deploy the Worker.**
   - Run `npx wrangler deploy -c wrangler.site.jsonc`.
   - It claims only `geauxmab.com/api/*` and `geauxmab.com/journal/*`. Every other path, including `/os`, still goes straight to Hostinger.
5. **Smoke test.**
   - Both feeds load on the home page.
   - `https://geauxmab.com/journal/rss.xml` opens.
   - Signing in at `#/journal/write` works, and you can publish and remove a test entry.

## Content to review

All page copy was written new, in Jack's voice. Please read it and confirm the facts:
- **Home:** the tile lines, the app notes, and the five quotes.
- **The Brotherhood:**
  - the page title and opening line
  - both chapter descriptions
  - the four timeline entries
- **The Scholarship:**
  - the research summary
  - the BeVISIBLE™ dimension descriptions (rewritten in plain words)
  - the degree list
  - the three "What I'm Building" lines
- **The Service:**
  - the breathing card
  - the four practice cards
  - the Air Jordans copy and chips
  - the travel line
  - the three community cards

Career content (disciplines, certifications, job history) stays off this site. mrjackdee.com covers it.

## AI concierge: free options using what is already paid for

Consumer plans (Google One AI Premium, Claude Max, ChatGPT Pro) cover the chat apps only. None of them give a website API access. These options cost nothing extra:

1. **Cloudflare Workers AI (recommended).**
   - Runs inside the Worker this site already uses, with a free daily allowance.
   - Open models (Llama and others).
   - No new account or API key to manage.
   - Best fit for a small "Ask about Jack" chat that answers from the site's own content.
2. **Gemini API free tier (Google AI Studio).**
   - A free key with rate limits.
   - Free-tier prompts may be used by Google to improve its products, so it is fine for public site content but not for anything private.
3. **No-AI fallback.** An FAQ-style concierge with canned answers and a Book Time hand-off. No model, no cost.

Paid APIs (Anthropic, OpenAI, Gemini paid tier) are only worth considering if the free options fall short.
