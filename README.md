# Slotted Golf — landing page

Static marketing site for **https://www.slottedgolf.org** — the consumer brand for the
Video Golf Club Fitter. Pure HTML/CSS/vanilla JS, zero dependencies, no build step.

```
site/
├── index.html    # the page
├── styles.css    # all styles (system font stacks, no CDN assets)
├── site.js          # waitlist form wiring (JSON POST to the API)
├── favicon.svg      # favicon — teal double-backslash mark on canvas
├── logo-lockup.png  # brand lockup (1920×410, transparent) used in topbar/hero/footer
├── og.png           # social share card (1200×630), referenced by OG/Twitter meta tags
└── og-card.html     # source used to render og.png — not linked from the page
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

`<form id="waitlist-form">` in `index.html` carries a `data-form-endpoint`
attribute pointing at the waitlist API
(`https://golf-fitter-server.fly.dev/api/waitlist`). On submit, `site.js`
prevents the default, does a basic client-side email check, then POSTs JSON
`{ "email": "…" }` with `Content-Type: application/json`. Any 2xx response
counts as success ("You're on the list"); non-2xx and network errors show an
inline retry message. The submit button is disabled while the request is in
flight. There is no mailto fallback — the only mailto on the page is the
contact link in the footer.

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

`og.png` is a 1200×630 screenshot of `og-card.html`. To regenerate after editing
(no new dependencies — uses installed Chrome):

```sh
cd site
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1200,630 --force-device-scale-factor=1 \
  --screenshot=og.png "file://$PWD/og-card.html"
```
