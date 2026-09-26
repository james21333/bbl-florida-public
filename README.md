# BBL Florida public docket sites

| Site | Domain | Pages project | Publish folder |
|------|--------|---------------|----------------|
| English | https://bblinjuries.com | `bblinjuries` | `en/public/` |
| Spanish | https://lesionesbbl.com | `lesionesbbl` | `es/public/` |

Cloudflare account: `90fa56dbc08614d1d32188be4a870fd6`. Push to `main` deploys when Git integration is connected.

## Local preview

```bash
npx --yes serve en/public -p 8787
npx --yes serve es/public -p 8788
```

## Content edits

Edit `en/public/data/content.json` and `es/public/data/content.json`, then push.

Miami watch (above the fold): set `"featured": true` on Miami-area cases in the `cases` array, or list them under `miamiWatch.cases` in both language files.
