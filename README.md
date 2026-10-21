# malesh.com

The landing page for malesh.com and labs.malesh.com. Plain HTML and CSS, no build step, hosted on Vercel.

| Path | Serves |
| --- | --- |
| `index.html` | malesh.com |
| `labs/index.html` | labs.malesh.com (host rewrite in `vercel.json`) |
| `404.html` | Not-found page |
| `styles.css` | Shared styles, light and dark |

## Add something to labs

Copy the `<li>` block in `labs/index.html`, change the name, the one-line description and the link. Push. Vercel deploys it.

## Preview locally

```sh
npx serve .
```

Open http://localhost:3000. The labs page is at /labs locally; the host rewrite only applies on labs.malesh.com.

## Domains on Vercel

Add `malesh.com`, `www.malesh.com` and `labs.malesh.com` to this project. `vercel.json` sends www to the bare domain and serves `/labs` on the labs subdomain.
