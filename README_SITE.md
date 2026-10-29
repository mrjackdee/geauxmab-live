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
| Home | `#/` | Hero with photo and signature, pillars, Explore My Sites, latest Journal story, Follow Along, quotes, both live feeds |
| The Brotherhood | `#/bio` | My Journey, SIGMA stats, timeline, Masonic affiliation |
| The Scholarship | `#/leadership` | Disciplines, doctorate (status, milestones, BeVISIBLE™ model), DonOra Global and career highlights, education and certifications |
| The Service | `#/lifestyle` | Perspective, wellness (strength, yoga, meditation), Air Jordans and the hunt, travel, community service |
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

These sections were drafted in Jack's voice from his other sites and need his review:
- The Service:
  - the Yoga and Meditation cards
  - the second Air Jordans paragraph
  - the In the Community cards
- The Scholarship:
  - the DonOra Global summary and career highlights (from mrjackdee.com and donoraglobal.com)
  - the doctoral milestones (from bevisible.work)
  - the extra certification chips (CSPO, Google Project Management, Google Generative AI Leader, Anthropic AI Fluency)
- Home: the "Explore My Sites" and "Follow Along" descriptions.
