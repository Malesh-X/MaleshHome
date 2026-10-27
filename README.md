# malesh.com

The Malesh Labs website. Plain HTML and CSS: no framework, no build step, no JavaScript. Hosted on Vercel; every push to `main` deploys.

| Path | Serves |
| --- | --- |
| `index.html` | malesh.com, the studio page |
| `labs/index.html` | labs.malesh.com, the experiments index (host rewrite in `vercel.json`, not indexed) |
| `404.html` | Not-found page |
| `styles.css` | All styles |
| `fonts/` | Self-hosted Inter and Geist Mono (variable, Latin subset, SIL OFL) |
| `og.png` | Social share image, 1200 × 630 |
| `favicon.svg`, `apple-touch-icon.png` | Icons |

## Editing

- Copy lives directly in `index.html`. Keep it factual: no invented staff, clients, funding or results.
- Colors and type are CSS variables at the top of `styles.css`.
- To add an experiment, copy the `<li>` in `labs/index.html`.
- If you change the headline, regenerate `og.png` so link previews match.

## Preview locally

```sh
npx serve .
```

Open http://localhost:3000. The labs page is at `/labs` locally; the host rewrite only applies on labs.malesh.com.

## Domains on Vercel

`malesh.com`, `www.malesh.com` and `labs.malesh.com` are attached to this project. `vercel.json` sends www to the bare domain, serves `/labs` on the labs subdomain, and sets security and cache headers.
