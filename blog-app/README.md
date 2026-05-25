# field notes — local editor (blog-app)

Local Node server that bridges the **field notes** React frontend to the Jekyll
`_posts/` folder in this repo. Write in the browser; the server writes the
`.md` file for you. Jekyll + GitHub Pages keep publishing the public site as
before.

## Architecture

```
┌──────────────────┐   fetch    ┌──────────────────┐   fs.writeFile   ┌───────────────────┐
│ React frontend   │ ─────────► │  Express server  │ ───────────────► │ ../_posts/*.md    │
│ (Babel standalone│            │  (server.js)     │                  │ ../_data/sparks   │
│  + marked)       │ ◄───────── │                  │ ◄── readPosts ── │ ../assets/img/…   │
└──────────────────┘  JSON      └──────────────────┘                  └───────────────────┘
                                                                               │
                                                                 git push      ▼
                                                             ┌────────────────────────────┐
                                                             │ GitHub Pages (Jekyll build)│
                                                             │ https://sghtao.github.io   │
                                                             └────────────────────────────┘
```

- **Posts** are the source of truth — stored as Chirpy-compatible `.md` files
  in `../_posts/`. The frontend reads them via `GET /api/posts` and creates new
  ones via `POST /api/posts`.
- **Sparks** (short notes) live in `../_data/sparks.json`. Jekyll doesn't render
  them — they only exist in this editor.
- **Images** pasted into the Write view are saved to
  `../assets/img/posts/<name>-<id>.<ext>` and inserted with their Jekyll URL,
  so the same path works on both the editor and the public site.

## Run it

From this folder:

```bash
npm install    # first time only
npm start      # http://localhost:4000
```

Open the URL; you should see all 22 existing posts in the **Posts** tab, and
can write new ones in the **Write** tab.

## Workflow — from draft to live site

1. `npm start` in `blog-app/`.
2. Open http://localhost:4000, click **Write**.
3. Type; paste images with Cmd/Ctrl+V (auto-saved to `assets/img/posts/`).
4. Click **PUBLISH** → a `YYYY-MM-DD-<slug>.md` file lands in `_posts/`.
5. From the repo root: `git add _posts _data assets && git commit && git push`.
6. GitHub Pages rebuilds in ~1 min. Post is live on `sghtao.github.io`.

> Auto-commit hook on publish is deliberately **not** built in — you probably
> want a chance to skim the file before pushing. If you want one-click publish
> + push, add a `git` call inside the `POST /api/posts` handler in `server.js`.

## API reference

| Method | Path              | Purpose                                  |
| ------ | ----------------- | ---------------------------------------- |
| GET    | `/api/posts`      | List all posts from `_posts/`.           |
| GET    | `/api/posts/:f`   | Get raw front matter + body for one file.|
| POST   | `/api/posts`      | Create a new `_posts/*.md` file.         |
| PUT    | `/api/posts/:f`   | Update an existing post (preserves date). |
| DELETE | `/api/posts/:f`   | Remove a post file from `_posts/`.       |
| GET    | `/api/sparks`     | List sparks from `_data/sparks.json`.    |
| POST   | `/api/sparks`     | Append a spark.                          |
| DELETE | `/api/sparks/:id` | Remove a spark by id.                    |
| POST   | `/api/images`     | Upload a base64 image → returns URL.     |

## Post shape returned by the API

```jsonc
{
  "id":       "p0022",          // assigned chronologically on read
  "file":     "2026-04-10-bluenode-session-AI-Meets-Blockchain.md",
  "slug":     "bluenode-session-AI-Meets-Blockchain",
  "title":    "…",
  "titleKr":  "",               // optional custom front-matter field
  "date":     "2026-04-10",
  "tags":     ["blockchain", "session"],
  "categories": ["BlueNode - Blockchain"],
  "excerpt":  "…",              // from description/excerpt or first body line
  "body":     "…",              // raw markdown after the front matter
  "readMin":  7
}
```

## Post front matter written by `POST /api/posts`

```yaml
---
title: "…"
date: 2026-04-19 13:05:22 +0900
titleKr: "…"           # only if provided
categories: [Cat]      # only if provided
tags: [tag1, tag2]     # only if provided
---
```

The `titleKr` field is custom (not used by Chirpy). Jekyll will just ignore it,
and this editor picks it back up for the KR subtitle.

## Swapping workflows later

- Keep Jekyll public, ditch the editor: just delete `blog-app/` — nothing else
  depends on it.
- Drop Jekyll, deploy the React app directly: add a proper production build
  (Next.js / Astro) and keep the same `/api/*` routes backed by a DB.
