# malesh.com

Two small static sites in one Vercel project: the malesh.com umbrella page and the Malesh Labs studio site on labs.malesh.com. Plain HTML and CSS, no framework, no build step. Every push to `main` deploys.

| Path | Serves |
| --- | --- |
| `home/` | malesh.com, the umbrella page (`index.html`, `home.css`, `year.js`, `favicon.svg`) |
| `labs/index.html` | labs.malesh.com, the Malesh Labs studio site |
| `styles.css`, `motion.js`, `fonts/`, `og.png`, `favicon.svg`, `apple-touch-icon.png` | Assets for the Labs site |
| `404.html` | Not-found page for both domains (umbrella style) |

`motion.js` is the Labs motion layer: dot-matrix field behind the page, text decode, scroll reveals, email roll. The page works fully without it and respects reduced-motion settings.

## Routing

Vercel serves a real file before it applies rewrites, so neither page sits at the repo root. `vercel.json` rewrites `/` by host: labs.malesh.com gets `/labs`, every other host gets `/home`. It also sends www to the bare domain, sends malesh.com/labs to labs.malesh.com, and sets security and cache headers.

Flow is private: don't list it on either site.

## Editing

- Labs copy lives in `labs/index.html`. Keep it factual: no invented staff, clients, funding or results.
- Labs colors and type are CSS variables at the top of `styles.css`.
- If you change the Labs headline, regenerate `og.png` so link previews match.

## Preview locally

```sh
npx serve .
```

Open http://localhost:3000/home/ for malesh.com and http://localhost:3000/labs/ for labs.malesh.com.
