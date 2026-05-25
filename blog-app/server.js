const express = require("express");
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const REPO_ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(REPO_ROOT, "_posts");
const DATA_DIR = path.join(REPO_ROOT, "_data");
const SPARKS_FILE = path.join(DATA_DIR, "sparks.json");
const STREAMS_FILE = path.join(DATA_DIR, "streams.json");
const IMAGE_DIR = path.join(REPO_ROOT, "assets", "img", "posts");

const PORT = process.env.PORT || 4000;

const app = express();
app.use(express.json({ limit: "25mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(REPO_ROOT, "assets")));

// -------- helpers

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// Validate a post filename. The regex used to be `^[\w\-.]+\.(md|markdown)$`,
// but `\w` in JS only matches ASCII — so Korean (or any non-ASCII) filenames
// like `2026-05-05-kelpdao-리서치.md` were rejected with 400 even though
// nothing was wrong with them. We now explicitly reject path separators and
// parent-directory hops, then trust path.resolve() in the caller to confirm
// the resolved location is still inside POSTS_DIR.
function isSafePostFilename(file) {
  if (typeof file !== "string" || !file) return false;
  if (file.includes("/") || file.includes("\\")) return false;
  if (file.includes("..")) return false;
  if (file.startsWith(".")) return false;
  return /\.(md|markdown)$/i.test(file);
}

function stripCodeFences(md) {
  return md.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
}

function deriveExcerpt(body) {
  const cleaned = stripCodeFences(body)
    .replace(/^---[\s\S]*?---/, "")
    // Strip raw HTML before anything else — otherwise inline link-card markup
    // ("<a class=\"link-card\"...>") gets used as the auto excerpt verbatim.
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[#>*_`~]/g, "")
    .replace(/\s+/g, " ")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const line of cleaned) {
    if (line.length > 20) return line.length > 180 ? line.slice(0, 180) + "…" : line;
  }
  return cleaned[0] || "";
}

function wordCount(body) {
  return stripCodeFences(body).replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;
}

function readMinutes(body) {
  return Math.max(1, Math.round(wordCount(body) / 220));
}

function dateFromFilename(name) {
  const m = name.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function toIsoDate(val, fallback) {
  if (!val) return fallback;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  const s = String(val);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : fallback;
}

function slugify(s) {
  return (
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || ""
  );
}

// Read all posts from _posts and shape them for the frontend.
function readPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => /\.(md|markdown)$/i.test(f))
    .sort();

  const posts = files.map((file) => {
    const full = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(full, "utf8");
    let parsed;
    try {
      parsed = matter(raw);
    } catch {
      parsed = { data: {}, content: raw };
    }
    const fm = parsed.data || {};
    const body = parsed.content || "";
    const date = toIsoDate(fm.date, dateFromFilename(file) || new Date().toISOString().slice(0, 10));
    const tags = Array.isArray(fm.tags) ? fm.tags : fm.tags ? [fm.tags] : [];
    const categories = Array.isArray(fm.categories) ? fm.categories : fm.categories ? [fm.categories] : [];
    const title = fm.title || file.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/i, "").replace(/-/g, " ");
    const excerpt = fm.description || fm.excerpt || deriveExcerpt(body);
    return {
      file,
      slug: file.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/i, ""),
      title,
      titleKr: fm.titleKr || fm.title_kr || "",
      date,
      tags,
      categories,
      excerpt,
      body,
      readMin: readMinutes(body),
    };
  });

  // newest first and assign display ids p0001.. based on chronological rank
  posts.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.file.localeCompare(b.file)));
  posts.forEach((p, i) => {
    p.id = "p" + String(i + 1).padStart(4, "0");
  });
  posts.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : b.file.localeCompare(a.file)));
  return posts;
}

function readSparks() {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(SPARKS_FILE)) return [];
  try {
    const raw = fs.readFileSync(SPARKS_FILE, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeSparks(sparks) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(SPARKS_FILE, JSON.stringify(sparks, null, 2), "utf8");
}

function readStreams() {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(STREAMS_FILE)) return [];
  try {
    const raw = fs.readFileSync(STREAMS_FILE, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeStreams(streams) {
  ensureDir(DATA_DIR);
  fs.writeFileSync(STREAMS_FILE, JSON.stringify(streams, null, 2), "utf8");
}

// -------- API

app.get("/api/posts", (req, res) => {
  try {
    res.json(readPosts());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

app.get("/api/posts/:file", (req, res) => {
  const file = req.params.file;
  if (!isSafePostFilename(file)) return res.status(400).json({ error: "bad filename" });
  const full = path.resolve(POSTS_DIR, file);
  if (!full.startsWith(POSTS_DIR + path.sep) || !fs.existsSync(full)) return res.status(404).json({ error: "not found" });
  const raw = fs.readFileSync(full, "utf8");
  const parsed = matter(raw);
  res.json({ file, frontMatter: parsed.data, body: parsed.content });
});

// Create a new markdown post file with Chirpy-compatible front matter.
// body: { title, titleKr, tags (string[]), categories (string[]), body (markdown), slug? }
app.post("/api/posts", (req, res) => {
  try {
    const { title, titleKr = "", tags = [], categories = [], body = "", slug: providedSlug } = req.body || {};
    if (!title || !title.trim()) return res.status(400).json({ error: "title required" });

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    let slug = slugify(providedSlug || title);
    // If slug is only Korean (no ASCII), fall back to a timestamped slug for clean filenames.
    if (!/[a-z0-9]/.test(slug)) {
      slug = `entry-${y}${m}${d}-${String(today.getHours()).padStart(2, "0")}${String(today.getMinutes()).padStart(2, "0")}`;
    }
    let filename = `${dateStr}-${slug}.md`;
    let full = path.join(POSTS_DIR, filename);
    let n = 1;
    while (fs.existsSync(full)) {
      filename = `${dateStr}-${slug}-${n}.md`;
      full = path.join(POSTS_DIR, filename);
      n++;
    }

    const frontMatter = {
      title,
      date: `${dateStr} ${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}:${String(today.getSeconds()).padStart(2, "0")} +0900`,
    };
    if (titleKr && titleKr.trim()) frontMatter.titleKr = titleKr.trim();
    if (categories && categories.length) frontMatter.categories = categories;
    if (tags && tags.length) frontMatter.tags = tags;

    const out = matter.stringify(body.trim() + "\n", frontMatter);
    ensureDir(POSTS_DIR);
    fs.writeFileSync(full, out, "utf8");
    res.status(201).json({ ok: true, file: filename });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

// Update an existing post. Preserves the original date + categories unless
// the request explicitly overrides them. Filename never changes — rename by
// hand on disk if you want a different slug.
app.put("/api/posts/:file", (req, res) => {
  try {
    const file = req.params.file;
    if (!isSafePostFilename(file)) return res.status(400).json({ error: "bad filename" });
    const full = path.resolve(POSTS_DIR, file);
    if (!full.startsWith(POSTS_DIR + path.sep) || !fs.existsSync(full)) return res.status(404).json({ error: "not found" });

    const existing = matter(fs.readFileSync(full, "utf8"));
    const fm = { ...(existing.data || {}) };

    const { title, titleKr, tags, categories, body } = req.body || {};
    if (title != null) fm.title = title;
    if (titleKr != null) {
      if (titleKr === "") delete fm.titleKr;
      else fm.titleKr = titleKr;
    }
    if (Array.isArray(tags)) fm.tags = tags;
    if (Array.isArray(categories)) {
      if (categories.length) fm.categories = categories;
      else delete fm.categories;
    }
    const newBody = body != null ? String(body) : existing.content;

    const out = matter.stringify(newBody.trim() + "\n", fm);
    fs.writeFileSync(full, out, "utf8");
    res.json({ ok: true, file });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

app.delete("/api/posts/:file", (req, res) => {
  try {
    const file = req.params.file;
    if (!isSafePostFilename(file)) return res.status(400).json({ error: "bad filename" });
    const full = path.resolve(POSTS_DIR, file);
    if (!full.startsWith(POSTS_DIR + path.sep) || !fs.existsSync(full)) return res.status(404).json({ error: "not found" });
    fs.unlinkSync(full);
    res.json({ ok: true, file });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

app.get("/api/sparks", (req, res) => {
  res.json(readSparks());
});

app.post("/api/sparks", (req, res) => {
  const { text, rot = 0, color = "cream" } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: "text required" });
  const sparks = readSparks();
  const id = "s" + Date.now().toString(36);
  const spark = {
    id,
    text: text.trim(),
    date: new Date().toISOString().slice(0, 10),
    rot: Number(rot) || 0,
    color,
  };
  sparks.unshift(spark);
  writeSparks(sparks);
  res.status(201).json(spark);
});

app.delete("/api/sparks/:id", (req, res) => {
  const id = req.params.id;
  const sparks = readSparks().filter((s) => s.id !== id);
  writeSparks(sparks);
  res.json({ ok: true });
});

// Streams (user-curated chains of posts) ----------------------------------
app.get("/api/streams", (req, res) => res.json(readStreams()));

app.post("/api/streams", (req, res) => {
  const { name = "Untitled stream", description = "", posts = [] } = req.body || {};
  const streams = readStreams();
  const id = "str_" + Date.now().toString(36);
  const now = new Date().toISOString();
  const stream = {
    id,
    name: String(name).slice(0, 200),
    description: String(description).slice(0, 1000),
    posts: Array.isArray(posts) ? posts : [],
    createdAt: now,
    updatedAt: now,
  };
  streams.unshift(stream);
  writeStreams(streams);
  res.status(201).json(stream);
});

// Reorder the streams list. Accepts { order: [id1, id2, ...] }. Any stream ids
// not in the request are appended at the end in their existing order, so a
// partial reorder is safe.
app.post("/api/streams/order", (req, res) => {
  const { order } = req.body || {};
  if (!Array.isArray(order)) return res.status(400).json({ error: "order array required" });
  const streams = readStreams();
  const byId = new Map(streams.map((s) => [s.id, s]));
  const out = [];
  for (const id of order) {
    if (byId.has(id)) { out.push(byId.get(id)); byId.delete(id); }
  }
  for (const leftover of byId.values()) out.push(leftover);
  writeStreams(out);
  res.json({ ok: true, streams: out });
});

app.put("/api/streams/:id", (req, res) => {
  const { id } = req.params;
  const streams = readStreams();
  const i = streams.findIndex((s) => s.id === id);
  if (i < 0) return res.status(404).json({ error: "not found" });
  const body = req.body || {};
  if (body.name !== undefined) streams[i].name = String(body.name).slice(0, 200);
  if (body.description !== undefined) streams[i].description = String(body.description).slice(0, 1000);
  if (Array.isArray(body.posts)) streams[i].posts = body.posts.filter((x) => typeof x === "string");
  streams[i].updatedAt = new Date().toISOString();
  writeStreams(streams);
  res.json(streams[i]);
});

app.delete("/api/streams/:id", (req, res) => {
  const { id } = req.params;
  const streams = readStreams().filter((s) => s.id !== id);
  writeStreams(streams);
  res.json({ ok: true });
});

// Link preview (OpenGraph) ------------------------------------------------
function isPrivateHost(host) {
  if (!host) return true;
  if (host === "localhost" || host === "0.0.0.0" || host === "::1") return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (/^169\.254\./.test(host)) return true;
  return false;
}

app.post("/api/link-preview", async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: "valid http(s) URL required" });
    let parsed;
    try { parsed = new URL(url); } catch { return res.status(400).json({ error: "bad URL" }); }
    if (isPrivateHost(parsed.hostname)) return res.status(400).json({ error: "private hosts not allowed" });

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    const r = await fetch(parsed.href, {
      headers: { "User-Agent": "Mozilla/5.0 field-notes-link-preview", Accept: "text/html,*/*" },
      redirect: "follow",
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer));
    const html = (await r.text()).slice(0, 200_000); // cap parsing surface

    const pick = (re) => { const m = html.match(re); return m ? m[1].trim().replace(/\s+/g, " ") : ""; };
    const decode = (s) => s
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");

    const ogTitle =
      pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i);
    const title = decode(ogTitle || pick(/<title[^>]*>([^<]+)<\/title>/i));
    const description = decode(
      pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    );
    let image = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                pick(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (image && image.startsWith("//")) image = parsed.protocol + image;
    if (image && image.startsWith("/")) image = parsed.origin + image;
    const siteName = decode(pick(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i));
    const finalUrl = r.url || parsed.href;
    let host = parsed.hostname;
    try { host = new URL(finalUrl).hostname; } catch {}

    res.json({
      url: finalUrl,
      title: title.slice(0, 200),
      description: description.slice(0, 300),
      image: image || "",
      siteName: siteName || host,
      host,
    });
  } catch (e) {
    console.error("link-preview error:", e.message);
    res.status(500).json({ error: e.message || String(e) });
  }
});

// Image upload: accepts a data URL, writes to assets/img/posts/, returns public path.
app.post("/api/images", (req, res) => {
  try {
    const { dataUrl, filename } = req.body || {};
    if (!dataUrl || !/^data:image\/[a-zA-Z+]+;base64,/.test(dataUrl)) {
      return res.status(400).json({ error: "dataUrl must be a base64 image" });
    }
    const match = dataUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
    const ext = (match[1] || "png").replace("jpeg", "jpg").replace("+xml", "");
    const buf = Buffer.from(match[2], "base64");
    ensureDir(IMAGE_DIR);
    const base = (filename && slugify(filename.replace(/\.[^.]+$/, ""))) || "img";
    const stamp = Date.now().toString(36);
    const name = `${base || "img"}-${stamp}.${ext}`;
    const full = path.join(IMAGE_DIR, name);
    fs.writeFileSync(full, buf);
    // Jekyll-served URL (works in both the local frontend and production site).
    const url = `/assets/img/posts/${name}`;
    res.status(201).json({ url, name });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`field notes — local editor on  http://localhost:${PORT}`);
  console.log(`  _posts dir: ${POSTS_DIR}`);
  console.log(`  sparks:     ${SPARKS_FILE}`);
});
