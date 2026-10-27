# malesh.com

The Malesh Labs website. Plain HTML and CSS with one small motion script: no framework, no build step. Hosted on Vercel; every push to `main` deploys.

| Path | Serves |
| --- | --- |
| `home/index.html` | malesh.com, the studio page (served at `/` by a rewrite in `vercel.json`) |
| `404.html` | Not-found page |
| `styles.css` | All styles |
| `motion.js` | Motion layer, loaded on every page: dot-matrix field behind the whole site, text decode, scroll reveals, email roll. The page works fully without it and respects reduced-motion settings. |
| `fonts/` | Self-hosted Inter and Geist Mono (variable, Latin subset, SIL OFL) |
| `og.png` | Social share image, 1200 × 630 |
| `favicon.svg`, `apple-touch-icon.png` | Icons |

## Editing

- Copy lives directly in `home/index.html`. Keep it factual: no invented staff, clients, funding or results.
- Colors and type are CSS variables at the top of `styles.css`.
- If you change the headline, regenerate `og.png` so link previews match.

## Preview locally

```sh
npx serve .
```

Open http://localhost:3000/home/ (on Vercel, `/` is rewritten to `/home`).

## Domains on Vercel

`malesh.com`, `www.malesh.com` and `labs.malesh.com` are attached to this project. `vercel.json` sends www to the bare domain, sends labs.malesh.com and `/labs` to the home page (there is no public experiments index), and sets security and cache headers.
