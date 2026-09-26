# Google Search Console & Bing Webmaster — setup

Domains are on Cloudflare (`dreamemailteam@gmail.com` account). Sitemaps are live:

- https://bblinjuries.com/sitemap.xml
- https://lesionesbbl.com/sitemap.xml

## Blocker: Google / Microsoft login

Programmatic GSC/Bing registration requires an authenticated session or API keys tied to a verified account. The Cursor browser hit **Google password / “too many failed attempts”** — Josh must sign in once in Chrome.

## Google Search Console (recommended: Domain + Cloudflare auto-verify)

1. Open https://search.google.com/search-console/welcome while signed in as **dreamemailteam@gmail.com**.
2. **Add property** → **Domain** → `bblinjuries.com` → Continue.
3. When offered **Verify via Cloudflare**, click **Start verification** and authorize (TXT record added automatically).
4. Repeat for `lesionesbbl.com`.
5. **Sitemaps** → add:
   - `https://bblinjuries.com/sitemap.xml`
   - `https://lesionesbbl.com/sitemap.xml`

URL-prefix alternative: `https://bblinjuries.com/` and `https://lesionesbbl.com/`.

## Bing Webmaster Tools

1. https://www.bing.com/webmasters/ → Sign in (Microsoft or Google).
2. **Add a site** → enter each URL → verify (DNS CNAME or HTML — Cloudflare DNS API can add records if manual).
3. **Sitemaps** → submit the same two sitemap URLs.
4. Copy **API key** from Settings → store as `BING_WEBMASTER_API_KEY` (optional) and run:

```bash
./scripts/submit-bing-sitemap.sh
```

## Already automated

| Item | Status |
|------|--------|
| `robots.txt` + Sitemap directive | Live |
| `sitemap.xml` + hreflang | Live |
| **IndexNow** key files + `./scripts/submit-indexnow.sh` | Run after each deploy |
| OAI-SearchBot allowed | Yes |

## After GSC service account (optional CI)

1. GCP: enable Search Console API, create service account JSON.
2. GSC → Settings → Users → add service account email as **Full** user on each property.
3. `GSC_CREDENTIALS_JSON=... gsc sitemaps submit https://bblinjuries.com/ https://bblinjuries.com/sitemap.xml`

See [Google sitemaps submit API](https://developers.google.com/webmaster-tools/v1/sitemaps/submit).
