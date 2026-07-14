# Slotted Golf — landing page

Static marketing site for **https://www.slottedgolf.org** — the consumer brand for the
Video Golf Club Fitter. Pure HTML/CSS/vanilla JS, zero dependencies, no build step.

```
site/
├── index.html    # the page
├── styles.css    # all styles (system font stacks, no CDN assets)
├── site.js       # waitlist form wiring + mailto fallback (progressive enhancement)
├── favicon.svg   # favicon
├── og.png        # social share card (1200×630), referenced by OG/Twitter meta tags
└── og-card.html  # source used to render og.png — not linked from the page
```

This directory intentionally sits **outside** the monorepo's `packages/*` npm-workspaces
glob, so root `npm run typecheck/test/build` never touch it.

## Local preview

```sh
cd site
python3 -m http.server 8000
# open http://localhost:8000
```

Any static file server works; there is no build step.

## Waitlist form

The form in `index.html` has two attributes on `<form id="waitlist-form">`:

- `data-form-endpoint` — URL to POST the email to (Formspree-style: form data,
  `Accept: application/json`, 2xx = success). **Empty by default.**
- `data-fallback-email` — used when no endpoint is set: submitting opens a
  pre-filled `mailto:` draft instead. Default `hello@slottedgolf.org`.

To wire a real backend (example with [Formspree](https://formspree.io)):

1. Create a form in Formspree; copy its endpoint, e.g. `https://formspree.io/f/abcdwxyz`.
2. In `index.html`, set both attributes on the form:
   ```html
   <form ... action="https://formspree.io/f/abcdwxyz"
             data-form-endpoint="https://formspree.io/f/abcdwxyz">
   ```
   (Setting `action` too means the form still works if JavaScript is disabled.)

Any endpoint that accepts a POSTed `email` field works the same way (Buttondown,
Basin, a tiny Cloudflare Worker, etc.). With JS disabled and no `action`, the browser
falls back to a same-page GET, which is harmless; set `action` for a true no-JS path.

## Deploy

### Option A — Cloudflare Pages (recommended: free, fast, easy apex domains)

1. Push the repo to GitHub (or use direct upload below).
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Pick the repo; set:
   - **Production branch**: `main`
   - **Build command**: *(leave empty)*
   - **Build output directory**: `site`
4. Deploy. You get `<project>.pages.dev`.
5. **Custom domains** tab → add `www.slottedgolf.org` and `slottedgolf.org`.
   If the domain's DNS is on Cloudflare, records are created automatically.

Direct upload alternative (no Git integration):

```sh
npx wrangler pages deploy site --project-name slotted-golf
```

(`npx` fetches wrangler ad-hoc; nothing is added to the repo.)

### Option B — GitHub Pages

GitHub Pages serves a repo root or `/docs`, not arbitrary subdirectories, so publish
`site/` via Actions:

1. Repo → **Settings → Pages → Source: GitHub Actions**.
2. Add `.github/workflows/pages.yml`:
   ```yaml
   name: Deploy site to Pages
   on:
     push:
       branches: [main]
       paths: ["site/**"]
   permissions:
     contents: read
     pages: write
     id-token: write
   jobs:
     deploy:
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - uses: actions/checkout@v4
         - uses: actions/upload-pages-artifact@v3
           with:
             path: site
         - id: deployment
           uses: actions/deploy-pages@v4
   ```
3. Repo → **Settings → Pages → Custom domain** → `www.slottedgolf.org`
   (this commits a `CNAME` file — or add `site/CNAME` containing `www.slottedgolf.org`
   yourself so the artifact carries it).
4. Enable **Enforce HTTPS** once the certificate is issued.

## DNS for slottedgolf.org

Canonical host is **`www`** (matches the `<link rel="canonical">` in `index.html`);
the apex should reach the same site (host-level redirect to `www` where supported).

### If deploying to Cloudflare Pages

| Type  | Name | Value                        | Notes                          |
|-------|------|------------------------------|--------------------------------|
| CNAME | www  | `<project>.pages.dev`        | proxied (orange cloud)         |
| CNAME | @    | `<project>.pages.dev`        | Cloudflare CNAME-flattens apex |

Add both hostnames as Custom Domains on the Pages project. To force apex → www, add a
Redirect Rule (Rules → Redirect Rules): `slottedgolf.org/*` → `https://www.slottedgolf.org/$1` (301).

### If deploying to GitHub Pages

| Type  | Name | Value                                             |
|-------|------|---------------------------------------------------|
| A     | @    | `185.199.108.153`                                 |
| A     | @    | `185.199.109.153`                                 |
| A     | @    | `185.199.110.153`                                 |
| A     | @    | `185.199.111.153`                                 |
| CNAME | www  | `<github-username>.github.io`                     |

With `www.slottedgolf.org` set as the custom domain, GitHub redirects apex → www
automatically once both resolve.

> DNS propagation can take up to an hour (longer if the registrar's old NS records
> had high TTLs). Verify with `dig +short www.slottedgolf.org`.

## Regenerating og.png

`og.png` is a 1200×630 screenshot of `og-card.html`. To regenerate after editing:
open `og-card.html` in a browser at exactly 1200×630 and screenshot, or use any
headless browser, e.g.:

```sh
npx playwright screenshot --viewport-size=1200,630 site/og-card.html site/og.png
```
