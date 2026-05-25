const { useState, useEffect, useRef, useMemo, useCallback } = React;


// ============================================================
// Shared data + helpers. Exposes to window for cross-script use.
// ============================================================

const SEED_POSTS = [
  {
    id: "p0141",
    title: "Graph Neural Networks for Intrusion Detection",
    titleKr: "그래프 신경망을 이용한 침입 탐지",
    date: "2026-04-12",
    tags: ["Data Science", "Security", "Research"],
    excerpt:
      "엣지 표현에 메시지 패싱을 적용할 때 생기는 over-smoothing 문제를 분리 레지듀얼로 풀었던 기록. 실험 노트와 함께.",
    body: "# Graph Neural Networks for Intrusion Detection\n\n엣지 표현에 메시지 패싱을 적용할 때...",
    readMin: 12,
  },
  {
    id: "p0140",
    title: "BlueNode: Weekly Sync Notes (W15)",
    titleKr: "블루노드 주간 싱크 기록",
    date: "2026-04-09",
    tags: ["BlueNode"],
    excerpt: "멤버 온보딩 플로우를 다시 그렸고, 온체인 데이터 파이프라인 초안을 공유했다.",
    body: "# BlueNode Weekly W15\n\n- 온보딩 리디자인 리뷰...",
    readMin: 4,
  },
  {
    id: "p0139",
    title: "Reading \"A Mathematical Theory of Communication\" — Part II",
    titleKr: "정보이론 고전 읽기 · 2부",
    date: "2026-04-05",
    tags: ["Research", "Data Science"],
    excerpt: "Shannon의 채널 용량 정의를 따라가며 내가 보안 맥락에서 어떻게 재해석했는지.",
    body: "# Shannon II\n\n...",
    readMin: 18,
  },
  {
    id: "p0138",
    title: "Threat Modeling for Small Teams",
    titleKr: "작은 팀을 위한 위협 모델링",
    date: "2026-03-28",
    tags: ["Security", "BlueNode"],
    excerpt: "STRIDE는 무겁다. 3명짜리 팀에서 실제로 돌아간 체크리스트를 남긴다.",
    body: "...",
    readMin: 9,
  },
  {
    id: "p0137",
    title: "Why I'm learning causal inference this quarter",
    titleKr: "이번 분기엔 인과추론을 공부한다",
    date: "2026-03-21",
    tags: ["Data Science", "Research"],
    excerpt: "상관과 인과 사이의 간극이 실무에서 왜 비용으로 환산되는지.",
    body: "...",
    readMin: 6,
  },
  {
    id: "p0136",
    title: "Secrets management without the vault",
    titleKr: "볼트 없이 시크릿 관리하기",
    date: "2026-03-14",
    tags: ["Security"],
    excerpt: "SOPS + age를 중심으로 한 경량 셋업.",
    body: "...",
    readMin: 7,
  },
  {
    id: "p0135",
    title: "Feature stores are overkill — until they aren't",
    titleKr: "피처 스토어는 언제 필요한가",
    date: "2026-03-07",
    tags: ["Data Science"],
    excerpt: "두 번의 실패한 도입과 한 번의 성공. 그 차이는 데이터 스케일보다 팀 크기였다.",
    body: "...",
    readMin: 11,
  },
  {
    id: "p0134",
    title: "BlueNode × 학회 부스 운영 회고",
    titleKr: "컨퍼런스 부스 운영기",
    date: "2026-02-28",
    tags: ["BlueNode"],
    excerpt: "이틀 동안 200명과 이야기했다. 가장 자주 받은 질문 7개.",
    body: "...",
    readMin: 8,
  },
  {
    id: "p0133",
    title: "Probabilistic thinking notebook #3",
    titleKr: "확률적 사고 노트 3",
    date: "2026-02-20",
    tags: ["Research", "Data Science"],
    excerpt: "베이즈 업데이트를 일기처럼 쓰기 시작한 뒤 바뀐 것들.",
    body: "...",
    readMin: 5,
  },
  {
    id: "p0132",
    title: "On red teaming ML pipelines",
    titleKr: "ML 파이프라인 레드팀",
    date: "2026-02-11",
    tags: ["Security", "Data Science", "Research"],
    excerpt: "데이터 포이즈닝부터 모델 추출까지, 어디에서 손을 대야 할까.",
    body: "...",
    readMin: 14,
  },
  {
    id: "p0131",
    title: "BlueNode 커뮤니티 규모 500명을 넘기며",
    titleKr: "커뮤니티 500명 돌파",
    date: "2026-02-03",
    tags: ["BlueNode"],
    excerpt: "숫자보다 밀도. 어떤 사람이 남았는지를 기록한다.",
    body: "...",
    readMin: 6,
  },
  {
    id: "p0130",
    title: "From anomaly detection to action",
    titleKr: "이상탐지에서 행동까지",
    date: "2026-01-24",
    tags: ["Data Science", "Security"],
    excerpt: "알람만 울리는 시스템이 실제 대응으로 이어지려면.",
    body: "...",
    readMin: 10,
  },
];

const SEED_SPARKS = [
  {
    id: "s01",
    text: "그래프 임베딩에서 노드 차수가 편향으로 작용하는 방식 — 짧게 써볼 것",
    date: "2026-04-18",
    rot: -3.4,
    color: "cream",
  },
  {
    id: "s02",
    text: "보안 사고 대응 체크리스트를 '냉장고 자석' 크기로 압축할 수 있을까?",
    date: "2026-04-16",
    rot: 2.1,
    color: "blush",
  },
  {
    id: "s03",
    text: "BlueNode 브랜드 가이드, 타이포그래피부터 정리 필요",
    date: "2026-04-14",
    rot: -1.2,
    color: "sky",
  },
  {
    id: "s04",
    text: "책 '생각에 관한 생각' 리뷰 → 보안 UX로 연결",
    date: "2026-04-11",
    rot: 4.0,
    color: "cream",
  },
  {
    id: "s05",
    text: "일기 형식으로 쓴 논문 리뷰 시리즈, 어떻게 인덱싱할지",
    date: "2026-04-08",
    rot: -2.6,
    color: "sage",
  },
  {
    id: "s06",
    text: "캐글 프라이빗 리더보드 트릭 정리",
    date: "2026-04-04",
    rot: 1.5,
    color: "cream",
  },
  {
    id: "s07",
    text: "커뮤니티 운영에 쓰는 Notion 템플릿 공개할 것",
    date: "2026-03-30",
    rot: 3.1,
    color: "blush",
  },
  {
    id: "s08",
    text: "RAG + 사내 위협인텔 결합한 프로토타입 구상",
    date: "2026-03-24",
    rot: -4.1,
    color: "sky",
  },
];

// Persistence --------------------------------------------------
// Posts + sparks live on the local server (blog-app/server.js). Theme/accent/route
// are UI preferences, so localStorage is fine for those.
const STORAGE = {
  route: "devblog.route",
  theme: "devblog.theme",
  accent: "devblog.accent",
};

const API = {
  posts:   "/api/posts",
  sparks:  "/api/sparks",
  streams: "/api/streams",
  images:  "/api/images",
  linkPreview: "/api/link-preview",
};

async function fetchJson(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
}

async function loadState() {
  try {
    const [posts, sparks, streams] = await Promise.all([
      fetchJson(API.posts),
      fetchJson(API.sparks),
      fetchJson(API.streams),
    ]);
    return { posts, sparks, streams };
  } catch (e) {
    console.warn("API unreachable; using seed data.", e);
    return { posts: SEED_POSTS, sparks: SEED_SPARKS, streams: [] };
  }
}

async function apiCreatePost(payload) {
  return fetchJson(API.posts, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function apiUpdatePost(file, payload) {
  return fetchJson(`${API.posts}/${encodeURIComponent(file)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function apiDeletePost(file) {
  return fetchJson(`${API.posts}/${encodeURIComponent(file)}`, { method: "DELETE" });
}

async function apiCreateSpark(payload) {
  return fetchJson(API.sparks, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function apiDeleteSpark(id) {
  return fetchJson(`${API.sparks}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

async function apiUploadImage(dataUrl, filename) {
  return fetchJson(API.images, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, filename }),
  });
}

// Streams ---------------------------------------------------------
async function apiCreateStream(payload) {
  return fetchJson(API.streams, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
async function apiUpdateStream(id, payload) {
  return fetchJson(`${API.streams}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
async function apiDeleteStream(id) {
  return fetchJson(`${API.streams}/${encodeURIComponent(id)}`, { method: "DELETE" });
}
async function apiReorderStreams(orderedIds) {
  return fetchJson(`${API.streams}/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order: orderedIds }),
  });
}
async function apiLinkPreview(url) {
  return fetchJson(API.linkPreview, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

function renderMarkdown(md) {
  if (!md) return "";
  const raw = window.marked ? window.marked.parse(md, { breaks: true, gfm: true }) : md;
  return window.DOMPurify ? window.DOMPurify.sanitize(raw) : raw;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" }).toUpperCase();
}

function nextId(prefix, posts) {
  const max = posts.reduce((acc, p) => {
    const n = parseInt((p.id || "").replace(/\D/g, ""), 10);
    return isNaN(n) ? acc : Math.max(acc, n);
  }, 100);
  return prefix + String(max + 1).padStart(4, "0");
}

function tagCounts(posts) {
  const m = {};
  posts.forEach((p) => (p.tags || []).forEach((t) => { m[t] = (m[t] || 0) + 1; }));
  return m;
}

// Most existing Jekyll posts have Korean text directly in `title` and an empty
// `titleKr`. Korean readers want that to be the prominent display title, in
// the Korean serif. Returns { primary, secondary, primaryIsKr } so callers can
// pick the right font and ordering.
const HANGUL_RE = /[가-힯ᄀ-ᇿ㄰-㆏]/;
function displayTitles(post) {
  const en = (post && post.title) || "";
  const kr = (post && post.titleKr) || "";
  const enHasKr = HANGUL_RE.test(en);
  if (kr && en && !enHasKr) {
    return { primary: kr, secondary: en, primaryIsKr: true };
  }
  if (enHasKr) {
    return { primary: en, secondary: kr || "", primaryIsKr: true };
  }
  if (kr) {
    return { primary: kr, secondary: en, primaryIsKr: true };
  }
  return { primary: en, secondary: "", primaryIsKr: false };
}

Object.assign(window, {
  SEED_POSTS, SEED_SPARKS, STORAGE, API,
  loadState, apiCreatePost, apiUpdatePost, apiDeletePost,
  apiCreateSpark, apiDeleteSpark, apiUploadImage,
  renderMarkdown, formatDate, nextId, tagCounts, displayTitles,
});

// Shared post row used by Home + Posts pages. KR title is the prominent line
// when the post has Korean text; the EN/secondary title sits underneath in
// a smaller muted style.
function PostRow({ post, onClick, dense }) {
  const { primary, secondary, primaryIsKr } = displayTitles(post);
  const primarySize = dense ? 22 : 24;
  return (
    <div className="post-row" onClick={onClick}>
      <div className="num">(N°{(post.id || "p0000").replace("p", "1")})</div>
      <div>
        <div className="title" style={{
          fontFamily: primaryIsKr ? "var(--kr)" : "var(--serif)",
          fontWeight: primaryIsKr ? 500 : 400,
          fontSize: primarySize, lineHeight: 1.2, letterSpacing: "-0.005em",
        }}>
          {primary}
        </div>
        {secondary && (
          <div style={{
            fontFamily: primaryIsKr ? "var(--serif)" : "var(--kr)",
            fontStyle: primaryIsKr ? "italic" : "normal",
            fontSize: 13, color: "var(--muted)", marginTop: 4,
          }}>
            {secondary}
          </div>
        )}
      </div>
      <div className="desc kr-sans" style={{ fontFamily: "var(--kr-sans)" }}>{post.excerpt}</div>
      <div className="tags">
        {(post.tags || []).slice(0, dense ? 2 : 99).map((t) => <span key={t} className="tag">{t}</span>)}
      </div>
      <div className="date">
        {formatDate(post.date)}
        {post.readMin != null && (dense
          ? <> · {post.readMin}min</>
          : <><br /><span style={{ color: "var(--muted-2)" }}>{post.readMin}MIN</span></>)}
      </div>
    </div>
  );
}
Object.assign(window, { PostRow });


// Top bar / navigation

function TopBar({ route, setRoute, onOpenTweaks }) {
  const tabs = [
    { id: "home", label: "Index" },
    { id: "stream", label: "Stream" },
    { id: "posts", label: "Posts" },
    { id: "write", label: "Write" },
    { id: "sparks", label: "Sparks" },
    { id: "tags", label: "Tags" },
    { id: "about", label: "About" },
  ];
  const now = new Date();
  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return (
    <header className="topbar">
      <div className="brand">
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", color: "var(--muted)", marginRight: 14, textTransform: "uppercase" }}>N°0001</span>
        field notes<em>—</em> <span style={{ fontStyle: "italic" }}>a dev journal</span>
      </div>
      <nav>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setRoute(t.id)} aria-current={route === t.id}>
            {t.label}
          </button>
        ))}
      </nav>
      <div className="right">
        <span className="mono">SEOUL · {time}</span>
        <button className="icon-btn" onClick={onOpenTweaks} title="Tweaks">⚙ TWEAKS</button>
      </div>
    </header>
  );
}

function Ticker({ posts, sparks }) {
  const items = [
    `LAST UPDATED ${formatDate(posts[0]?.date || new Date().toISOString())}`,
    `${posts.length} POSTS`,
    `${sparks.length} SPARKS`,
    `CURRENTLY FOCUSED ON · DATA SCIENCE ∩ SECURITY`,
    `BUILT WITH JEKYLL + CHIRPY · CUSTOM FRONT`,
    `SEOUL, KR`,
    `PGP 4A1B 9E22 …`,
  ];
  const track = [...items, ...items];
  return (
    <div className="ticker">
      <div className="track">
        {track.map((t, i) => (
          <span key={i}><span className="dot">●</span>&nbsp;&nbsp;{t}</span>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { TopBar, Ticker });


// Stream tab — river delta visualization.

// Horizontal time axis left→right. Each tag = a stream.
// Stream thickness = post frequency at that time.
// When a post has multiple tags, all those streams converge at a node.

function StreamViz({ posts, preview = false }) {
  const W = preview ? 700 : 1280;
  const H = preview ? 360 : 580;
  const PAD = preview ? { l: 40, r: 40, t: 30, b: 30 } : { l: 140, r: 140, t: 60, b: 80 };

  const chronological = [...posts].sort((a, b) => new Date(a.date) - new Date(b.date));
  const counts = tagCounts(posts);
  const tags = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t]) => t);

  // Assign a base y to each tag, spaced evenly
  const tagY = {};
  tags.forEach((t, i) => {
    const frac = (i + 1) / (tags.length + 1);
    tagY[t] = PAD.t + frac * (H - PAD.t - PAD.b);
  });

  const minDate = new Date(chronological[0].date).getTime();
  const maxDate = new Date(chronological[chronological.length - 1].date).getTime();
  const range = Math.max(1, maxDate - minDate);

  const xOf = (iso) => {
    const t = new Date(iso).getTime();
    return PAD.l + ((t - minDate) / range) * (W - PAD.l - PAD.r);
  };

  // Build per-tag path nodes: (x, y) pairs along the axis, pulled toward
  // other tags when a post is shared.
  const tagPaths = {};
  tags.forEach((t) => { tagPaths[t] = []; });

  // Left anchor
  tags.forEach((t) => {
    tagPaths[t].push({ x: PAD.l - 20, y: tagY[t], w: 2 });
  });

  chronological.forEach((post) => {
    const x = xOf(post.date);
    const postTags = (post.tags || []).filter((t) => tagY[t] != null);
    if (postTags.length === 0) return;
    // Convergence point: weighted centroid of tag Ys for shared posts
    const centroid = postTags.reduce((s, t) => s + tagY[t], 0) / postTags.length;
    postTags.forEach((t) => {
      // Pull each tag's path toward the centroid, proportional to # shared tags
      const pull = Math.min(0.65, 0.22 * (postTags.length - 1));
      const y = tagY[t] + (centroid - tagY[t]) * pull;
      tagPaths[t].push({ x, y, w: postTags.length });
    });
  });

  // Right anchor — settle back to base
  tags.forEach((t) => {
    tagPaths[t].push({ x: W - PAD.r + 20, y: tagY[t], w: 1 });
  });

  // Build smooth bezier d-string for each tag path.
  const smoothPath = (pts) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const midX = (p0.x + p1.x) / 2;
      d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  // Stream thickness per tag = log-scaled post count
  const thickness = (t) => {
    const n = counts[t] || 1;
    const base = preview ? 6 : 14;
    return base + Math.log2(n + 1) * (preview ? 3 : 7);
  };

  // Accent color with tag-level hue shift
  const tagColor = (t, i) => {
    const hues = [22, 220, 150, 300, 50, 190, 340];
    return `oklch(0.62 0.14 ${hues[i % hues.length]})`;
  };

  // Time axis ticks — months
  const ticks = [];
  const start = new Date(minDate);
  start.setDate(1);
  const end = new Date(maxDate);
  for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
    ticks.push(new Date(d));
  }

  const [hover, setHover] = useState(null);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
      <defs>
        {tags.map((t, i) => (
          <linearGradient id={`g-${i}`} key={t} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={tagColor(t, i)} stopOpacity="0.15" />
            <stop offset="30%" stopColor={tagColor(t, i)} stopOpacity="0.55" />
            <stop offset="100%" stopColor={tagColor(t, i)} stopOpacity="0.85" />
          </linearGradient>
        ))}
        <filter id="softblur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={preview ? "0.4" : "0.6"} />
        </filter>
      </defs>

      {/* month ticks */}
      {!preview && ticks.map((d, i) => (
        <g key={i}>
          <line x1={xOf(d.toISOString())} y1={PAD.t - 14} x2={xOf(d.toISOString())} y2={H - PAD.b + 14}
            stroke="var(--rule)" strokeDasharray="1 4" />
          <text x={xOf(d.toISOString())} y={H - PAD.b + 34} fontFamily="var(--mono)" fontSize="10" fill="var(--muted)"
            textAnchor="middle" letterSpacing="1">
            {d.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
          </text>
        </g>
      ))}

      {/* streams */}
      {tags.map((t, i) => {
        const d = smoothPath(tagPaths[t]);
        const w = thickness(t);
        const active = hover === t || hover == null;
        return (
          <g key={t}
            onMouseEnter={() => setHover(t)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: "pointer" }}>
            <path d={d} fill="none" stroke={`url(#g-${i})`} strokeWidth={w}
              strokeLinecap="round" opacity={active ? 0.95 : 0.25}
              filter="url(#softblur)" />
            <path d={d} fill="none" stroke={tagColor(t, i)} strokeWidth={Math.max(1, w * 0.12)}
              strokeLinecap="round" opacity={active ? 0.9 : 0.3} />
            {!preview && (
              <>
                <text x={PAD.l - 26} y={tagY[t] + 4} fontFamily="var(--mono)" fontSize="11"
                  fill="var(--fg)" textAnchor="end" letterSpacing="1">
                  {t.toUpperCase()}
                </text>
                <text x={W - PAD.r + 26} y={tagY[t] + 4} fontFamily="var(--mono)" fontSize="11"
                  fill={tagColor(t, i)} textAnchor="start" letterSpacing="1">
                  {(counts[t] || 0).toString().padStart(2, "0")}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* post nodes */}
      {!preview && chronological.map((p) => {
        const x = xOf(p.date);
        const postTags = (p.tags || []).filter((t) => tagY[t] != null);
        if (!postTags.length) return null;
        const centroid = postTags.reduce((s, t) => s + tagY[t], 0) / postTags.length;
        const shared = postTags.length > 1;
        return (
          <g key={p.id}>
            <circle cx={x} cy={centroid} r={shared ? 5 : 3.2}
              fill={shared ? "var(--bg)" : "var(--fg)"}
              stroke="var(--fg)" strokeWidth={shared ? 1.4 : 0} />
            <title>{`${p.title} — ${postTags.join(", ")}`}</title>
          </g>
        );
      })}
    </svg>
  );
}

// Post-picker modal — shows all posts in a searchable list, click to add one
// to the current chain. Posts already in the chain are shown disabled.
function PostPicker({ posts, excludeFiles = [], onPick, onClose }) {
  const [q, setQ] = useState("");
  const norm = (s) => (s || "").toLowerCase();
  const filtered = posts.filter((p) => {
    if (!q.trim()) return true;
    const hay = norm(p.title) + " " + norm(p.titleKr) + " " + norm((p.tags || []).join(" "));
    return hay.includes(norm(q));
  });
  return (
    <div onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(10,10,10,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
        animation: "fadeUp 0.2s ease both",
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 92vw)", maxHeight: "78vh", display: "flex", flexDirection: "column",
          background: "var(--bg)", border: "1px solid var(--rule)",
        }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--rule)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--muted)", textTransform: "uppercase" }}>
            Pick a post to add
          </span>
          <button onClick={onClose} className="mono"
            style={{ background: "none", border: 0, cursor: "pointer", color: "var(--muted)", fontSize: 14 }}>✕</button>
        </div>
        <input
          autoFocus
          placeholder="Search title, KR title, tag…"
          value={q} onChange={(e) => setQ(e.target.value)}
          className="kr-sans"
          style={{
            padding: "16px 24px", border: 0, borderBottom: "1px solid var(--rule)",
            background: "transparent", outline: "none",
            fontFamily: "var(--kr-sans)", fontSize: 15, color: "var(--fg)",
          }}
        />
        <div style={{ overflow: "auto", flex: 1 }}>
          {filtered.length === 0 && (
            <div className="mono" style={{ padding: 24, color: "var(--muted)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              No matches
            </div>
          )}
          {filtered.map((p) => {
            const already = excludeFiles.includes(p.file);
            return (
              <div key={p.file}
                onClick={() => { if (!already) onPick(p); }}
                style={{
                  padding: "14px 24px", borderBottom: "1px solid var(--rule)",
                  cursor: already ? "default" : "pointer", opacity: already ? 0.4 : 1,
                  display: "grid", gridTemplateColumns: "60px 1fr 110px", gap: 16, alignItems: "center",
                }}
                onMouseEnter={(e) => { if (!already) e.currentTarget.style.background = "var(--card)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <span className="mono" style={{ color: "var(--muted)", fontSize: 11 }}>
                  {p.id ? "N°" + p.id.replace("p", "1") : ""}
                </span>
                <div>
                  {(() => {
                    const { primary, secondary, primaryIsKr } = displayTitles(p);
                    return (
                      <>
                        <div style={{
                          fontFamily: primaryIsKr ? "var(--kr)" : "var(--serif)",
                          fontWeight: primaryIsKr ? 500 : 400,
                          fontSize: 17, lineHeight: 1.25,
                        }}>
                          {primary}
                        </div>
                        {secondary && (
                          <div style={{
                            fontFamily: primaryIsKr ? "var(--serif)" : "var(--kr)",
                            fontStyle: primaryIsKr ? "italic" : "normal",
                            fontSize: 12, color: "var(--muted)", marginTop: 2,
                          }}>
                            {secondary}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)", textAlign: "right", textTransform: "uppercase" }}>
                  {already ? "ADDED" : formatDate(p.date)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// A single chain card (one stream). Editable inline; posts arranged horizontally
// with arrows; click + at the end to open PostPicker; ✕ on a post to remove.
function ChainCard({ stream, posts, onChange, onDelete, onOpenPost }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState(false);
  const [name, setName] = useState(stream.name);
  const [description, setDescription] = useState(stream.description || "");

  const postByFile = useMemo(() => Object.fromEntries(posts.map((p) => [p.file, p])), [posts]);
  const items = (stream.posts || []).map((f) => postByFile[f]).filter(Boolean);

  const persist = async (patch) => {
    try {
      const updated = await apiUpdateStream(stream.id, patch);
      onChange(updated);
    } catch (e) { alert("저장 실패: " + e.message); }
  };

  const saveMeta = async () => {
    setEditingMeta(false);
    if (name !== stream.name || description !== (stream.description || "")) {
      await persist({ name, description });
    }
  };

  const addPost = (post) => {
    setPickerOpen(false);
    if (stream.posts && stream.posts.includes(post.file)) return;
    persist({ posts: [...(stream.posts || []), post.file] });
  };

  const removePost = (file) => {
    persist({ posts: (stream.posts || []).filter((f) => f !== file) });
  };

  // Drag-reorder posts inside this chain. Distinct mime type so dragging
  // a post doesn't accidentally trigger a stream-card drop and vice versa.
  const POST_TYPE = "application/x-chain-post-index";
  const [dragFrom, setDragFrom] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const isPostDrag = (e) => Array.from(e.dataTransfer?.types || []).includes(POST_TYPE);
  const movePost = (from, to) => {
    if (from === to || from < 0 || to < 0) return;
    const arr = [...(stream.posts || [])];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    persist({ posts: arr });
  };

  return (
    <div style={{
      border: "1px solid var(--rule)", background: "var(--card)",
      padding: "28px 32px", marginBottom: 32, position: "relative",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingMeta ? (
            <>
              <input
                autoFocus value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveMeta(); }}
                className="serif"
                style={{
                  fontFamily: "var(--serif)", fontSize: 32, lineHeight: 1.1,
                  border: 0, borderBottom: "1px solid var(--accent)", background: "transparent",
                  outline: "none", color: "var(--fg)", width: "100%", padding: "2px 0",
                }}
              />
              <input
                value={description} placeholder="(short description, optional)"
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveMeta(); }}
                className="kr-sans"
                style={{
                  fontFamily: "var(--kr-sans)", fontSize: 14, color: "var(--muted)",
                  border: 0, background: "transparent", outline: "none",
                  width: "100%", marginTop: 8, padding: "2px 0",
                }}
              />
            </>
          ) : (
            <>
              <h2 onClick={() => setEditingMeta(true)}
                className="serif"
                style={{ fontFamily: "var(--serif)", fontSize: 32, lineHeight: 1.15, margin: 0, cursor: "text" }}>
                {stream.name || <span style={{ color: "var(--muted)" }}>Untitled stream</span>}
              </h2>
              {stream.description && (
                <div onClick={() => setEditingMeta(true)}
                  className="kr-sans"
                  style={{ fontFamily: "var(--kr-sans)", fontSize: 14, color: "var(--muted)", marginTop: 6, cursor: "text" }}>
                  {stream.description}
                </div>
              )}
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {editingMeta ? (
            <button className="btn ghost" onClick={saveMeta}>SAVE</button>
          ) : (
            <button className="btn ghost" onClick={() => setEditingMeta(true)}>EDIT</button>
          )}
          <button className="btn ghost" style={{ color: "#b04848" }} onClick={onDelete}>DELETE</button>
        </div>
      </div>

      <div className="mono-sm" style={{ color: "var(--muted)", marginBottom: 20 }}>
        {items.length} {items.length === 1 ? "POST" : "POSTS"} · UPDATED {formatDate(stream.updatedAt || stream.createdAt)}
      </div>

      <div className="chain">
        {items.map((p, i) => (
          <div key={p.file}
            className={`chain-item ${dragFrom === i ? "is-dragging" : ""} ${dragOver === i && dragFrom !== null && dragFrom !== i ? "is-drop-target" : ""}`}
            onClick={() => onOpenPost(p)}
            onDragOver={(e) => { if (isPostDrag(e)) { e.preventDefault(); setDragOver(i); e.dataTransfer.dropEffect = "move"; } }}
            onDragLeave={() => { setDragOver((prev) => (prev === i ? null : prev)); }}
            onDrop={(e) => {
              if (!isPostDrag(e)) return;
              e.preventDefault();
              setDragFrom(null); setDragOver(null);
              try {
                const { streamId, index } = JSON.parse(e.dataTransfer.getData(POST_TYPE));
                // Only reorder within the same stream — cross-stream moves
                // would silently rewrite the wrong stream's post list.
                if (streamId !== stream.id) return;
                if (Number.isFinite(index)) movePost(index, i);
              } catch {}
            }}>
            <button className="drag-handle" draggable
              title="Drag to reorder"
              onClick={(e) => e.stopPropagation()}
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData(POST_TYPE, JSON.stringify({ streamId: stream.id, index: i }));
                e.dataTransfer.effectAllowed = "move";
                setDragFrom(i);
              }}
              onDragEnd={() => { setDragFrom(null); setDragOver(null); }}
              style={{ cursor: "grab" }}>
              ⋮⋮
            </button>
            <div className="mono-sm" style={{ color: "var(--muted)" }}>
              {String(i + 1).padStart(2, "0")} · {formatDate(p.date)}
            </div>
            {(() => {
              const { primary, secondary, primaryIsKr } = displayTitles(p);
              return (
                <>
                  <div style={{
                    fontFamily: primaryIsKr ? "var(--kr)" : "var(--serif)",
                    fontWeight: primaryIsKr ? 500 : 400,
                    fontSize: 17, lineHeight: 1.25, flex: 1,
                  }}>
                    {primary}
                  </div>
                  {secondary && (
                    <div style={{
                      fontFamily: primaryIsKr ? "var(--serif)" : "var(--kr)",
                      fontStyle: primaryIsKr ? "italic" : "normal",
                      fontSize: 11, color: "var(--muted)",
                    }}>
                      {secondary}
                    </div>
                  )}
                </>
              );
            })()}
            {p.tags && p.tags.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                {p.tags.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); removePost(p.file); }}
              className="chain-remove"
              title="Remove from chain">✕</button>
          </div>
        ))}
        <button className="chain-add" onClick={() => setPickerOpen(true)}>
          + ADD POST
        </button>
      </div>

      {pickerOpen && (
        <PostPicker
          posts={posts}
          excludeFiles={stream.posts || []}
          onPick={addPost}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function StreamPage({ posts, streams, setStreams, setRoute, setActivePost }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const createStream = async () => {
    const name = newName.trim() || "Untitled stream";
    try {
      const created = await apiCreateStream({ name });
      setStreams([created, ...streams]);
      setNewName("");
      setCreating(false);
    } catch (e) { alert("스트림 생성 실패: " + e.message); }
  };

  const onChange = (updated) => {
    setStreams(streams.map((s) => (s.id === updated.id ? updated : s)));
  };

  const onDelete = async (s) => {
    if (!confirm(`Delete this stream?\n\n${s.name}`)) return;
    try {
      await apiDeleteStream(s.id);
      setStreams(streams.filter((x) => x.id !== s.id));
    } catch (e) { alert("삭제 실패: " + e.message); }
  };

  const onOpenPost = (post) => {
    setActivePost(post);
    setRoute("reader");
  };

  // Drag-reorder streams in the list. Uses a different mime type from
  // chain-item drags so a post drop never reorders a stream.
  const STREAM_TYPE = "application/x-stream-index";
  const [sDragFrom, setSDragFrom] = useState(null);
  const [sDragOver, setSDragOver] = useState(null);
  const isStreamDrag = (e) => Array.from(e.dataTransfer?.types || []).includes(STREAM_TYPE);
  const moveStream = async (from, to) => {
    if (from === to || from < 0 || to < 0) return;
    const arr = [...streams];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setStreams(arr);
    try {
      await apiReorderStreams(arr.map((s) => s.id));
    } catch (e) {
      alert("순서 저장 실패: " + e.message);
    }
  };

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>the<br /><em>streams.</em></h1>
        <div className="meta mono">
          <div>({String(streams.length).padStart(2, "0")})</div>
          <div style={{ marginTop: 8 }}>USER-CURATED CHAINS</div>
          <div style={{ marginTop: 8, color: "var(--fg)" }}>BUILD A SEQUENCE OF POSTS</div>
        </div>
      </div>

      <div style={{ marginBottom: 40 }}>
        {creating ? (
          <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "16px 24px", border: "1px solid var(--accent)", background: "var(--card)" }}>
            <span className="mono-sm" style={{ color: "var(--muted)" }}>NEW STREAM →</span>
            <input
              autoFocus value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createStream();
                if (e.key === "Escape") { setCreating(false); setNewName(""); }
              }}
              placeholder="What's this chain about? (e.g. RWA 리서치 흐름)"
              className="serif"
              style={{
                flex: 1, fontFamily: "var(--serif)", fontSize: 22,
                border: 0, background: "transparent", outline: "none", color: "var(--fg)",
              }}
            />
            <button className="btn primary" onClick={createStream}>CREATE</button>
            <button className="btn ghost" onClick={() => { setCreating(false); setNewName(""); }}>CANCEL</button>
          </div>
        ) : (
          <button className="btn primary" onClick={() => setCreating(true)}>+ NEW STREAM</button>
        )}
      </div>

      {streams.length === 0 && !creating && (
        <div style={{ padding: "60px 0", borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)", textAlign: "center" }}>
          <p className="serif" style={{ fontSize: 22, color: "var(--muted)", margin: 0 }}>
            아직 스트림이 없어요. 위 <em style={{ color: "var(--accent)" }}>+ NEW STREAM</em>으로 첫 흐름을 만들어 보세요.
          </p>
          <p className="mono-sm" style={{ color: "var(--muted-2)", marginTop: 16 }}>
            A stream is a hand-picked sequence of posts — the path your thinking actually walked.
          </p>
        </div>
      )}

      {streams.map((s, idx) => (
        <div key={s.id}
          className={`stream-card ${sDragFrom === idx ? "is-dragging" : ""} ${sDragOver === idx && sDragFrom !== null && sDragFrom !== idx ? "is-drop-target" : ""}`}
          onDragOver={(e) => { if (isStreamDrag(e)) { e.preventDefault(); setSDragOver(idx); e.dataTransfer.dropEffect = "move"; } }}
          onDragLeave={() => { setSDragOver((prev) => (prev === idx ? null : prev)); }}
          onDrop={(e) => {
            if (!isStreamDrag(e)) return;
            e.preventDefault();
            const from = parseInt(e.dataTransfer.getData(STREAM_TYPE), 10);
            setSDragFrom(null); setSDragOver(null);
            if (Number.isFinite(from)) moveStream(from, idx);
          }}>
          <button className="drag-handle" draggable
            title="Drag to reorder this stream"
            onDragStart={(e) => {
              e.dataTransfer.setData(STREAM_TYPE, String(idx));
              e.dataTransfer.effectAllowed = "move";
              setSDragFrom(idx);
            }}
            onDragEnd={() => { setSDragFrom(null); setSDragOver(null); }}
            style={{ cursor: "grab", top: 14, left: 14 }}>
            ⋮⋮
          </button>
          <ChainCard
            stream={s} posts={posts}
            onChange={onChange}
            onDelete={() => onDelete(s)}
            onOpenPost={onOpenPost}
          />
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { StreamViz, StreamPage, ChainCard, PostPicker });


// Home / Index page — editorial hero + latest posts

function HomePage({ posts, sparks, setRoute, setActivePost }) {
  const latest = posts.slice(0, 4);
  const counts = tagCounts(posts);
  const topTags = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>
          field<br />
          <em>notes,</em> by<br />
          an engineer<br />
          <span style={{ fontFamily: "var(--kr)", fontStyle: "normal" }}>탐구 중.</span>
        </h1>
        <div className="meta mono">
          <div>(N°10433)</div>
          <div style={{ marginTop: 8 }}>{formatDate(new Date().toISOString())}</div>
          <div style={{ marginTop: 8, color: "var(--fg)" }}>©2K26</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 80, marginBottom: 80 }}>
        <div>
          <div className="section-label">Currently <span className="count">[{topTags.length}]</span></div>
          <p className="serif" style={{ fontSize: 22, lineHeight: 1.3, margin: 0, color: "var(--fg-soft)" }}>
            데이터사이언스와 보안이 만나는 지점에서 일합니다. 그 사이의 작은 실험, 읽은 논문, 운영 중인 커뮤니티 <em style={{ color: "var(--accent)" }}>BlueNode</em>에 대한 기록.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 28 }}>
            {topTags.map(([tag, n]) => (
              <span key={tag} className="tag" onClick={() => setRoute("tags")}>
                {tag} · {n}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 36, display: "flex", gap: 10 }}>
            <button className="btn primary" onClick={() => setRoute("write")}>+ Write a post</button>
            <button className="btn ghost" onClick={() => setRoute("stream")}>See the stream →</button>
          </div>
        </div>

        <div>
          <div className="section-label">Latest <span className="count">[{posts.length}]</span> <span style={{ color: "var(--muted-2)", textTransform: "none", fontFamily: "var(--mono)" }}>— showing 4 of {posts.length}</span></div>
          <div>
            {latest.map((p, i) => (
              <PostRow key={p.id} post={p} onClick={() => { setActivePost(p); setRoute("reader"); }} dense />
            ))}
          </div>
        </div>
      </div>

      <Ticker posts={posts} sparks={sparks} />

      <div style={{ marginTop: 80, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60 }}>
        <div>
          <div className="section-label">Recent sparks <span className="count">[{sparks.length}]</span></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {sparks.slice(0, 3).map((s) => (
              <div key={s.id} style={{
                width: 220, padding: 16, background: "var(--card)", border: "1px solid var(--rule)",
                transform: `rotate(${s.rot}deg)`, fontFamily: "var(--kr-sans)", fontSize: 13, lineHeight: 1.5,
                boxShadow: "0 6px 14px rgba(0,0,0,0.05)"
              }}>
                <div className="mono-sm" style={{ color: "var(--muted)", marginBottom: 10 }}>{formatDate(s.date)}</div>
                {s.text}
              </div>
            ))}
          </div>
          <button className="btn ghost" style={{ marginTop: 20 }} onClick={() => setRoute("sparks")}>All sparks →</button>
        </div>

        <div>
          <div className="section-label">The stream <span className="count">[live]</span></div>
          <div style={{
            position: "relative", aspectRatio: "16/9", border: "1px solid var(--rule)",
            background: "var(--card)", overflow: "hidden", cursor: "pointer"
          }} onClick={() => setRoute("stream")}>
            <StreamPreview posts={posts} />
            <div style={{ position: "absolute", bottom: 14, left: 16, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
              Open full view →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mini river preview uses StreamViz via window (different Babel scope)
function StreamPreview({ posts }) {
  const V = window.StreamViz;
  return V ? <V posts={posts} preview={true} /> : null;
}

Object.assign(window, { HomePage });


// Posts index, reader, tags, about

function PostsPage({ posts, setRoute, setActivePost }) {
  const [filter, setFilter] = useState(null);
  const [sort, setSort] = useState("newest");
  const counts = tagCounts(posts);
  const allTags = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

  let filtered = filter ? posts.filter((p) => p.tags.includes(filter)) : posts;
  filtered = [...filtered].sort((a, b) => {
    if (sort === "newest") return new Date(b.date) - new Date(a.date);
    if (sort === "oldest") return new Date(a.date) - new Date(b.date);
    if (sort === "longest") return b.readMin - a.readMin;
    return 0;
  });

  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>all<br /><em>posts.</em></h1>
        <div className="meta mono">
          <div>(N°10536)</div>
          <div style={{ marginTop: 8 }}>({posts.length})</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 48 }}>
        <aside>
          <div className="section-label">Showing</div>
          <div style={{ marginBottom: 24 }}>
            <div
              onClick={() => setFilter(null)}
              className="mono"
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: "1px solid var(--rule)",
                color: !filter ? "var(--fg)" : "var(--muted)", cursor: "pointer",
              }}>
              <span>{!filter ? "●" : "○"} ALL POSTS</span>
              <span>({posts.length})</span>
            </div>
            {allTags.map((t) => (
              <div key={t}
                onClick={() => setFilter(filter === t ? null : t)}
                className="mono"
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 0", borderBottom: "1px solid var(--rule)",
                  color: filter === t ? "var(--accent)" : "var(--muted)", cursor: "pointer",
                }}>
                <span>{filter === t ? "●" : "○"} {t.toUpperCase()}</span>
                <span>({counts[t]})</span>
              </div>
            ))}
          </div>

          <div className="section-label">Sort</div>
          {["newest", "oldest", "longest"].map((s) => (
            <div key={s} onClick={() => setSort(s)} className="mono"
              style={{ padding: "6px 0", color: sort === s ? "var(--fg)" : "var(--muted)", cursor: "pointer" }}>
              {sort === s ? "●" : "○"} {s.toUpperCase()}
            </div>
          ))}
        </aside>

        <div>
          <div className="section-label">
            {filter ? filter.toUpperCase() : "ALL"} <span className="count">[{filtered.length}]</span>
          </div>
          {filtered.map((p) => (
            <PostRow key={p.id} post={p} onClick={() => { setActivePost(p); setRoute("reader"); }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReaderPage({ post, setRoute, onEdit, onDelete }) {
  if (!post) {
    return <div className="page"><p>No post selected.</p></div>;
  }
  const canEdit = !!post.file; // only server-backed posts can be edited
  return (
    <div className="page fade-in" style={{ maxWidth: 880 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40, gap: 12 }}>
        <button className="btn ghost" onClick={() => setRoute("posts")}>← Back to posts</button>
        {canEdit && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn ghost" onClick={() => onEdit && onEdit(post)}>EDIT</button>
            <button className="btn ghost"
              style={{ color: "#b04848" }}
              onClick={() => onDelete && onDelete(post)}>
              DELETE
            </button>
          </div>
        )}
      </div>
      <div className="mono" style={{ color: "var(--muted)", marginBottom: 14 }}>
        (N°{post.id.replace("p", "1")}) · {formatDate(post.date)} · {post.readMin} MIN READ
      </div>
      {(() => {
        const { primary, secondary, primaryIsKr } = displayTitles(post);
        return (
          <>
            <h1 style={{
              fontFamily: primaryIsKr ? "var(--kr)" : "var(--serif)",
              fontSize: primaryIsKr ? 56 : 68,
              fontWeight: primaryIsKr ? 500 : 400,
              lineHeight: 1.1, letterSpacing: "-0.01em", margin: "0 0 12px",
            }}>
              {primary}
            </h1>
            {secondary && (
              <div style={{
                fontFamily: primaryIsKr ? "var(--serif)" : "var(--kr)",
                fontStyle: primaryIsKr ? "italic" : "normal",
                fontSize: 20, color: "var(--muted)", marginBottom: 28,
              }}>
                {secondary}
              </div>
            )}
          </>
        );
      })()}
      <div style={{ display: "flex", gap: 6, marginBottom: 48 }}>
        {post.tags.map((t) => <span key={t} className="tag">{t}</span>)}
      </div>
      <hr className="rule" />
      <article className="post-body kr-sans"
        style={{ fontFamily: "var(--kr-sans)", fontSize: 17, lineHeight: 1.75, marginTop: 40 }}>
        {/* No auto-excerpt lede here — the body already starts with whatever
            the author chose. Showing a derived excerpt above duplicates it
            (and worse, surfaced raw link-card HTML as text). */}
        <div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body || "") }} />
      </article>
    </div>
  );
}

function TagsPage({ posts, setRoute }) {
  const counts = tagCounts(posts);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, n]) => n));
  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>all<br /><em>tags.</em></h1>
        <div className="meta mono">
          <div>(N°10292)</div>
          <div style={{ marginTop: 8 }}>({entries.length})</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 2, border: "1px solid var(--rule)" }}>
        {entries.map(([t, n]) => {
          const size = 20 + (n / max) * 42;
          return (
            <div key={t} style={{
              padding: "28px 24px", background: "var(--card)",
              borderRight: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)",
              display: "flex", flexDirection: "column", gap: 12, cursor: "pointer",
              transition: "background 0.2s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = "color-mix(in oklab, var(--accent) 8%, var(--card))"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--card)"}
              onClick={() => setRoute("posts")}>
              <div className="mono" style={{ color: "var(--muted)", display: "flex", justifyContent: "space-between" }}>
                <span>TAG</span><span>{String(n).padStart(2, "0")}</span>
              </div>
              <div className="serif" style={{ fontSize: size, lineHeight: 1, letterSpacing: "-0.01em" }}>{t}</div>
              <div className="mono-sm" style={{ color: "var(--muted)" }}>{n} {n === 1 ? "POST" : "POSTS"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AboutPage() {
  return (
    <div className="page fade-in" style={{ maxWidth: 980 }}>
      <div className="page-header">
        <h1>about<br /><em>me.</em></h1>
        <div className="meta mono">
          <div>(N°10140)</div>
          <div style={{ marginTop: 8 }}>CV ↓ · EMAIL ↗ · GITHUB ↗</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 60 }}>
        <div className="placeholder-img" style={{ aspectRatio: "3/4" }}>PORTRAIT · DROP IMAGE</div>
        <div>
          <p className="serif" style={{ fontSize: 30, lineHeight: 1.25, margin: 0, color: "var(--fg-soft)" }}>
            서울에서 일하는 <em style={{ color: "var(--accent)" }}>데이터사이언스 ·&nbsp;보안</em> 엔지니어. 커뮤니티 BlueNode를 운영하며 논문 · 실험 · 회고를 이곳에 기록합니다.
          </p>
          <hr className="rule" style={{ margin: "40px 0" }} />
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "20px 24px" }}>
            <div className="mono" style={{ color: "var(--muted)" }}>NOW</div>
            <div className="kr-sans" style={{ fontFamily: "var(--kr-sans)" }}>GNN 기반 네트워크 이상 탐지 연구 / BlueNode 운영</div>
            <div className="mono" style={{ color: "var(--muted)" }}>PREVIOUSLY</div>
            <div className="kr-sans" style={{ fontFamily: "var(--kr-sans)" }}>SOC 분석 · 데이터 엔지니어 · 대학원 RA</div>
            <div className="mono" style={{ color: "var(--muted)" }}>READING</div>
            <div className="kr-sans" style={{ fontFamily: "var(--kr-sans)" }}>Causal Inference: The Mixtape / 생각에 관한 생각</div>
            <div className="mono" style={{ color: "var(--muted)" }}>ELSEWHERE</div>
            <div className="kr-sans" style={{ fontFamily: "var(--kr-sans)" }}>github · linkedin · twitter · scholar</div>
            <div className="mono" style={{ color: "var(--muted)" }}>COLOPHON</div>
            <div className="kr-sans" style={{ fontFamily: "var(--kr-sans)" }}>Jekyll + Chirpy, 이 프론트는 HTML/React로 커스텀. 본문은 마크다운으로 저장됩니다.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PostsPage, ReaderPage, TagsPage, AboutPage });


// Sparks — polaroid index cards, scattered

function SparksPage({ sparks, setSparks }) {
  const [text, setText] = useState("");
  const palette = ["cream", "blush", "sky", "sage"];
  const bgFor = (c) => ({
    cream: "#f7f1e0",
    blush: "#f2dbd2",
    sky: "#d9e4ea",
    sage: "#dae3d6",
  }[c] || "#f7f1e0");
  const bgForDark = (c) => ({
    cream: "#2a251a",
    blush: "#2d1f1b",
    sky: "#1c2428",
    sage: "#1f2620",
  }[c] || "#2a251a");

  const addSpark = async () => {
    if (!text.trim()) return;
    const rot = (Math.random() - 0.5) * 8;
    const color = palette[Math.floor(Math.random() * palette.length)];
    try {
      const created = await apiCreateSpark({ text: text.trim(), rot, color });
      setSparks([created, ...sparks]);
      setText("");
    } catch (e) {
      alert("스파크 저장 실패: " + e.message);
    }
  };

  const removeSpark = async (id) => {
    try {
      await apiDeleteSpark(id);
      setSparks(sparks.filter((s) => s.id !== id));
    } catch (e) {
      alert("삭제 실패: " + e.message);
    }
  };

  // Layout scattered: wrap in a flex, apply rotation + slight translate
  return (
    <div className="page fade-in">
      <div className="page-header">
        <h1>sparks <em>&</em><br />half-thoughts.</h1>
        <div className="meta mono">
          <div>(N°10433)</div>
          <div style={{ marginTop: 8 }}>({sparks.length})</div>
          <div style={{ marginTop: 8, color: "var(--fg)" }}>DROP A NOTE. IT STAYS.</div>
        </div>
      </div>

      {/* capture input — feels like pinning a polaroid */}
      <div style={{
        display: "flex", gap: 12, padding: "20px 24px",
        border: "1px solid var(--rule)", background: "var(--card)",
        marginBottom: 48, alignItems: "center",
      }}>
        <span className="mono" style={{ color: "var(--muted)" }}>NEW SPARK →</span>
        <input
          className="kr-sans"
          style={{ flex: 1, fontFamily: "var(--kr-sans)", fontSize: 15, padding: "6px 0" }}
          placeholder="떠오른 것을 그대로 적어두세요. 정리는 나중에."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addSpark(); }}
        />
        <button className="btn primary" onClick={addSpark}>+ PIN</button>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 36,
        padding: "20px 0 60px",
      }}>
        {sparks.map((s, i) => {
          const dark = document.documentElement.dataset.theme === "dark";
          return (
            <div key={s.id}
              style={{
                background: dark ? bgForDark(s.color) : bgFor(s.color),
                color: dark ? "#e8e0cd" : "#1a1713",
                padding: "16px 16px 20px",
                transform: `rotate(${s.rot}deg)`,
                boxShadow: "0 10px 24px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)",
                transition: "transform 0.25s, box-shadow 0.25s",
                position: "relative",
                minHeight: 220,
                display: "flex", flexDirection: "column",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = `rotate(${s.rot * 0.3}deg) translateY(-4px) scale(1.03)`; e.currentTarget.style.zIndex = 5; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = `rotate(${s.rot}deg)`; e.currentTarget.style.zIndex = 1; }}>
              {/* pin */}
              <div style={{
                position: "absolute", top: -8, left: "50%", width: 14, height: 14, borderRadius: "50%",
                background: "var(--accent)", boxShadow: "0 2px 4px rgba(0,0,0,0.3)", transform: "translateX(-50%)",
              }} />
              <div className="mono-sm" style={{ opacity: 0.6, marginBottom: 12 }}>
                {formatDate(s.date)} · N°{s.id.slice(-4)}
              </div>
              <div className="kr-sans" style={{
                fontFamily: "var(--kr-sans)", fontSize: 15, lineHeight: 1.55, flex: 1,
              }}>
                {s.text}
              </div>
              <button onClick={() => removeSpark(s.id)} className="mono-sm"
                style={{ alignSelf: "flex-end", background: "none", border: 0, opacity: 0.4, cursor: "pointer", color: "inherit", marginTop: 12 }}>
                ✕ REMOVE
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { SparksPage });


// Write — WYSIWYG contenteditable editor outputting markdown.

function WritePage({ posts, setPosts, setRoute, editingPost, clearEditing }) {
  const isEditing = !!editingPost;
  const editorRef = useRef(null);
  const [title, setTitle] = useState(editingPost?.title || "");
  const [titleKr, setTitleKr] = useState(editingPost?.titleKr || "");
  const [tagsText, setTagsText] = useState((editingPost?.tags || []).join(", "));
  const [preview, setPreview] = useState(false);
  const [md, setMd] = useState(editingPost?.body || "");

  // Helper used by both editor modes — extract the first image file from a
  // ClipboardEvent. Returns null if no image was on the clipboard.
  const imageFromClipboard = (e) => {
    const items = e.clipboardData?.items || [];
    for (const item of items) {
      if (item.kind === "file" && item.type && item.type.startsWith("image/")) {
        return item.getAsFile();
      }
    }
    const files = e.clipboardData?.files;
    if (files && files.length) {
      for (const f of files) if (f.type && f.type.startsWith("image/")) return f;
    }
    return null;
  };

  // contentEditable mode: hook paste (for images) + input (for markdown sync).
  useEffect(() => {
    if (isEditing) return;
    const el = editorRef.current;
    if (!el) return;
    const onPaste = (e) => {
      const file = imageFromClipboard(e);
      if (!file) return;
      e.preventDefault();
      const reader = new FileReader();
      reader.onload = async (ev) => {
        let src = ev.target.result;
        try {
          const uploaded = await apiUploadImage(src, file.name || "pasted");
          src = uploaded.url;
        } catch (err) {
          console.warn("image upload failed, embedding as data URL", err);
        }
        const img = `<img src="${src}" alt="pasted image" style="max-width:100%;display:block;margin:18px 0" />`;
        document.execCommand("insertHTML", false, img);
        updateMd();
      };
      reader.readAsDataURL(file);
    };
    const onInput = () => updateMd();
    el.addEventListener("paste", onPaste);
    el.addEventListener("input", onInput);
    return () => {
      el.removeEventListener("paste", onPaste);
      el.removeEventListener("input", onInput);
    };
  }, [isEditing]);

  // textarea mode: hook paste so images can be dropped into raw-markdown editing too.
  useEffect(() => {
    if (!isEditing) return;
    const el = editorRef.current;
    if (!el) return;
    const onPaste = (e) => {
      const file = imageFromClipboard(e);
      if (!file) return;
      e.preventDefault();
      const reader = new FileReader();
      reader.onload = async (ev) => {
        let url = ev.target.result;
        try {
          const uploaded = await apiUploadImage(url, file.name || "pasted");
          url = uploaded.url;
        } catch (err) {
          console.warn("image upload failed, embedding data URL", err);
        }
        const at = el.selectionStart || 0;
        const before = md.slice(0, at);
        const after = md.slice(el.selectionEnd || at);
        const sep = before && !before.endsWith("\n\n") ? "\n\n" : "";
        const tail = after && !after.startsWith("\n\n") ? "\n\n" : "";
        const insertion = `${sep}![](${url})${tail}`;
        const next = before + insertion + after;
        setMd(next);
        // Reset caret after insertion
        requestAnimationFrame(() => {
          el.focus();
          const pos = before.length + insertion.length;
          el.setSelectionRange(pos, pos);
        });
      };
      reader.readAsDataURL(file);
    };
    el.addEventListener("paste", onPaste);
    return () => el.removeEventListener("paste", onPaste);
  }, [isEditing, md]);

  // ---- Markdown-aware formatting helpers (used by toolbar in textarea mode) ----
  const taSel = () => {
    const ta = editorRef.current;
    if (!ta || typeof ta.selectionStart !== "number") return null;
    return { ta, start: ta.selectionStart, end: ta.selectionEnd };
  };
  const wrapSel = (before, after = before) => {
    const ctx = taSel();
    if (!ctx) return;
    const { ta, start, end } = ctx;
    const sel = md.slice(start, end);
    const next = md.slice(0, start) + before + sel + after + md.slice(end);
    setMd(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + sel.length);
    });
  };
  const prefixLines = (prefix) => {
    const ctx = taSel();
    if (!ctx) return;
    const { ta, start, end } = ctx;
    const lineStart = md.lastIndexOf("\n", start - 1) + 1;
    const tail = md.slice(end);
    const nextNl = tail.indexOf("\n");
    const lineEnd = end + (nextNl >= 0 ? nextNl : tail.length);
    const block = md.slice(lineStart, lineEnd);
    const replaced = block.split("\n").map((l) => prefix + l).join("\n");
    const next = md.slice(0, lineStart) + replaced + md.slice(lineEnd);
    setMd(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(lineStart, lineStart + replaced.length);
    });
  };
  const replaceLineHeading = (level) => {
    const ctx = taSel();
    if (!ctx) return;
    const { ta, start } = ctx;
    const lineStart = md.lastIndexOf("\n", start - 1) + 1;
    const tail = md.slice(start);
    const nextNl = tail.indexOf("\n");
    const lineEnd = start + (nextNl >= 0 ? nextNl : tail.length);
    let line = md.slice(lineStart, lineEnd).replace(/^#{1,6}\s+/, "");
    line = "#".repeat(level) + " " + line;
    const next = md.slice(0, lineStart) + line + md.slice(lineEnd);
    setMd(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = lineStart + line.length;
      ta.setSelectionRange(pos, pos);
    });
  };
  const wrapCodeBlock = () => {
    const ctx = taSel();
    if (!ctx) return;
    const { ta, start, end } = ctx;
    const sel = md.slice(start, end) || "code";
    const insertion = "\n```\n" + sel + "\n```\n";
    const next = md.slice(0, start) + insertion + md.slice(end);
    setMd(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + 5, start + 5 + sel.length);
    });
  };
  const insertLink = () => {
    const u = prompt("URL?");
    if (!u) return;
    if (isEditing) {
      const ctx = taSel();
      if (!ctx) return;
      const { ta, start, end } = ctx;
      const sel = md.slice(start, end) || u;
      const next = md.slice(0, start) + `[${sel}](${u})` + md.slice(end);
      setMd(next);
    } else {
      exec("createLink", u);
    }
  };

  // Unified toolbar actions — same buttons, branch on edit mode.
  const fmt = {
    bold:   () => isEditing ? wrapSel("**") : exec("bold"),
    italic: () => isEditing ? wrapSel("*")  : exec("italic"),
    h1:     () => isEditing ? replaceLineHeading(1) : exec("formatBlock", "<h1>"),
    h2:     () => isEditing ? replaceLineHeading(2) : exec("formatBlock", "<h2>"),
    para:   () => isEditing ? null : exec("formatBlock", "<p>"),
    list:   () => isEditing ? prefixLines("- ") : exec("insertUnorderedList"),
    code:   () => isEditing ? wrapCodeBlock() : exec("formatBlock", "<pre>"),
    link:   () => insertLink(),
    clear:  () => isEditing ? null : exec("removeFormat"),
  };

  const htmlToMd = (html) => {
    // Preserve link-card <a> blocks verbatim — they're rich HTML we want to
    // round-trip into the saved markdown unchanged. Stash them, run the normal
    // strip pass, then restore.
    const keep = [];
    let s = html.replace(
      /<a\b[^>]*class=["'][^"']*\blink-card\b[^"']*["'][^>]*>[\s\S]*?<\/a>/gi,
      (m) => { keep.push(m); return `@@KEEP${keep.length - 1}@@`; }
    );
    s = s.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n# $1\n");
    s = s.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n");
    s = s.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n");
    s = s.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
    s = s.replace(/<b>(.*?)<\/b>/gi, "**$1**");
    s = s.replace(/<em>(.*?)<\/em>/gi, "*$1*");
    s = s.replace(/<i>(.*?)<\/i>/gi, "*$1*");
    s = s.replace(/<code>(.*?)<\/code>/gi, "`$1`");
    s = s.replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");
    s = s.replace(/<img [^>]*src="([^"]+)"[^>]*>/gi, "![image]($1)");
    s = s.replace(/<li>(.*?)<\/li>/gi, "- $1\n");
    s = s.replace(/<\/?(ul|ol)>/gi, "\n");
    s = s.replace(/<br\s*\/?>/gi, "\n");
    s = s.replace(/<\/p>/gi, "\n\n");
    s = s.replace(/<[^>]+>/g, "");
    s = s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    s = s.replace(/@@KEEP(\d+)@@/g, (_, i) => "\n\n" + keep[+i] + "\n\n");
    return s.replace(/\n{3,}/g, "\n\n").trim();
  };

  const buildLinkCardHtml = (preview) => {
    const safeAttr = (v) => String(v || "").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeText = (v) => String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // Use spans (inline elements) inside <a> so contentEditable can't split
    // the anchor across blocks. `contenteditable="false"` makes the whole card
    // an atomic unit in the editor — click to follow, no half-edits.
    const img = preview.image
      ? `<img class="link-card-img" src="${safeAttr(preview.image)}" alt="" />`
      : "";
    return (
      `<a class="link-card" href="${safeAttr(preview.url)}" target="_blank" rel="noopener noreferrer" contenteditable="false">` +
        `<span class="link-card-text">` +
          `<span class="link-card-title">${safeText(preview.title || preview.url)}</span>` +
          (preview.description ? `<span class="link-card-desc">${safeText(preview.description)}</span>` : "") +
          `<span class="link-card-host">${safeText(preview.siteName || preview.host || "")}</span>` +
        `</span>` +
        img +
      `</a>`
    );
  };

  const insertLinkCard = async () => {
    const url = prompt("Paste a URL — I'll fetch its preview and insert a card.");
    if (!url) return;
    let preview;
    try {
      preview = await apiLinkPreview(url.trim());
    } catch (e) {
      alert("미리보기 가져오기 실패: " + e.message);
      return;
    }
    const html = buildLinkCardHtml(preview);
    if (isEditing) {
      // Markdown textarea mode — splice raw HTML at cursor, surrounded by blank
      // lines so marked treats it as a block.
      const ta = editorRef.current;
      const at = ta && typeof ta.selectionStart === "number" ? ta.selectionStart : md.length;
      const before = md.slice(0, at);
      const after = md.slice(at);
      const sep = (before && !before.endsWith("\n\n") ? "\n\n" : "");
      const tail = (after && !after.startsWith("\n\n") ? "\n\n" : "");
      setMd(before + sep + html + tail + after);
    } else {
      // contentEditable WYSIWYG — drop the HTML at the caret.
      document.execCommand("insertHTML", false, html);
      updateMd();
    }
  };

  const updateMd = () => {
    if (editorRef.current) setMd(htmlToMd(editorRef.current.innerHTML));
  };

  const exec = (cmd, arg) => {
    document.execCommand(cmd, false, arg);
    editorRef.current?.focus();
    updateMd();
  };

  const onPublish = async () => {
    if (!title.trim()) { alert("제목을 입력해주세요"); return; }
    const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
    try {
      if (isEditing) {
        await apiUpdatePost(editingPost.file, {
          title: title.trim(),
          titleKr: titleKr.trim(),
          tags,
          body: md,
        });
      } else {
        await apiCreatePost({
          title: title.trim(),
          titleKr: titleKr.trim(),
          tags,
          // Categories default empty — add a sidebar field later if you want them.
          categories: [],
          body: md,
        });
      }
      // Refresh from the server (canonical source of truth now).
      const fresh = await fetchJson(API.posts);
      setPosts(fresh);
      if (clearEditing) clearEditing();
      setRoute("posts");
    } catch (e) {
      alert((isEditing ? "수정 " : "발행 ") + "실패: " + e.message);
    }
  };

  return (
    <div className="page fade-in" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <h1>{isEditing ? <>edit<br /><em>entry.</em></> : <>new<br /><em>entry.</em></>}</h1>
        <div className="meta mono">
          <div>{isEditing ? `(${editingPost.id})` : `(N°${nextId("p", posts).replace("p", "1")})`}</div>
          <div style={{ marginTop: 8 }}>{isEditing ? `EDITING · ${editingPost.file}` : "DRAFT"}</div>
          <div style={{ marginTop: 8, color: "var(--fg)" }}>
            {isEditing ? "RAW MARKDOWN MODE" : "CMD/CTRL+V TO PASTE IMAGES"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 48, alignItems: "start" }}>
        <div>
          <label className="field-label">TITLE (EN)</label>
          <input className="line serif" style={{ fontFamily: "var(--serif)", fontSize: 44, letterSpacing: "-0.01em" }}
            placeholder="On something I learned this week"
            value={title} onChange={(e) => setTitle(e.target.value)} />
          <div style={{ height: 20 }} />
          <label className="field-label">TITLE (KR)</label>
          <input className="line kr" style={{ fontFamily: "var(--kr)", fontSize: 22 }}
            placeholder="이번 주에 배운 것"
            value={titleKr} onChange={(e) => setTitleKr(e.target.value)} />
          <div style={{ height: 20 }} />
          <label className="field-label">TAGS (comma separated)</label>
          <input className="line mono" style={{ fontFamily: "var(--mono)", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em" }}
            placeholder="data science, security, research"
            value={tagsText} onChange={(e) => setTagsText(e.target.value)} />

          <div className="editor-toolbar" style={{
            display: "flex", gap: 4, marginTop: 36,
            padding: "8px", border: "1px solid var(--rule)", background: "var(--card)",
            position: "sticky", top: 76, zIndex: 3, flexWrap: "wrap",
          }}>
            {[
              ["B",  fmt.bold,   "Bold"],
              ["I",  fmt.italic, "Italic"],
              ["H1", fmt.h1,     "Heading 1"],
              ["H2", fmt.h2,     "Heading 2"],
              ...(isEditing ? [] : [["¶", fmt.para, "Paragraph"]]),
              ["•",  fmt.list,   "Bulleted list"],
              ["‹›", fmt.code,   "Code block"],
              ["↗",  fmt.link,   "Plain link"],
              ...(isEditing ? [] : [["↻", fmt.clear, "Clear formatting"]]),
            ].map(([label, fn, tip]) => (
              <button key={label} onClick={fn} title={tip}
                style={{
                  padding: "8px 12px", background: "transparent", border: 0,
                  cursor: "pointer", color: "var(--fg)", fontWeight: 600,
                  fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.06em",
                }}>
                {label}
              </button>
            ))}
            <button onClick={insertLinkCard} title="Fetch link preview and insert as a rich card"
              style={{
                padding: "8px 12px", background: "transparent", border: "1px solid var(--rule)",
                cursor: "pointer", color: "var(--accent)",
                fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
              + Link card
            </button>
            <div style={{ flex: 1 }} />
            {!isEditing && (
              <button onClick={() => setPreview(!preview)}
                style={{
                  padding: "8px 12px", background: "transparent", border: 0,
                  cursor: "pointer", color: "var(--muted)",
                  fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
                }}>
                {preview ? "Hide md" : "Show md"}
              </button>
            )}
          </div>

          {isEditing ? (
            <textarea
              ref={editorRef}
              value={md}
              onChange={(e) => setMd(e.target.value)}
              spellCheck={false}
              style={{
                width: "100%", marginTop: 16, minHeight: 520,
                padding: "20px", border: "1px solid var(--rule)", background: "var(--card)",
                fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1.7,
                color: "var(--fg)", resize: "vertical", outline: "none",
                whiteSpace: "pre-wrap",
                textTransform: "none", letterSpacing: "normal",
              }}
            />
          ) : (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="kr-sans editor-area"
              style={{
                minHeight: 480,
                padding: "32px 4px",
                fontFamily: "var(--kr-sans)",
                fontSize: 17, lineHeight: 1.75,
                outline: "none",
                borderBottom: "1px solid var(--rule)",
              }}
              dangerouslySetInnerHTML={{
                __html: "<p style='color:var(--muted);'>여기에 바로 글을 쓰세요. 이미지는 Cmd+V / Ctrl+V 로 붙여넣을 수 있어요. 저장하면 마크다운으로 변환되어 포스트 목록에 추가됩니다.</p>"
              }}
              onFocus={(e) => {
                if (e.target.textContent && e.target.textContent.startsWith("여기에 바로")) {
                  e.target.innerHTML = "<p><br/></p>";
                }
              }}
            />
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button className="btn primary" onClick={onPublish}>
              {isEditing ? "SAVE CHANGES" : "PUBLISH"}
            </button>
            <button className="btn ghost" onClick={() => {
              if (clearEditing) clearEditing();
              setRoute(isEditing ? "reader" : "home");
            }}>
              {isEditing ? "CANCEL" : "DISCARD"}
            </button>
          </div>
        </div>

        <aside style={{ position: "sticky", top: 100 }}>
          <div className="section-label">Meta</div>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "10px 14px", marginBottom: 24 }}>
            <div className="mono-sm" style={{ color: "var(--muted)" }}>DATE</div>
            <div className="mono-sm">{formatDate(new Date().toISOString())}</div>
            <div className="mono-sm" style={{ color: "var(--muted)" }}>WORDS</div>
            <div className="mono-sm">{md.split(/\s+/).filter(Boolean).length}</div>
            <div className="mono-sm" style={{ color: "var(--muted)" }}>READ</div>
            <div className="mono-sm">~ {Math.max(1, Math.round(md.split(/\s+/).length / 200))} MIN</div>
            <div className="mono-sm" style={{ color: "var(--muted)" }}>OUTPUT</div>
            <div className="mono-sm">_posts/*.md</div>
          </div>

          <div className="section-label">Tips</div>
          <ul className="mono-sm" style={{ color: "var(--muted)", paddingLeft: 16, lineHeight: 1.9, textTransform: "none", letterSpacing: "0.02em" }}>
            <li>Cmd/Ctrl+V에 이미지 바로 붙이기</li>
            <li>태그를 달면 STREAM에 자동 반영</li>
            <li>로컬 스토리지에 자동 저장</li>
            <li>발행 시 _posts/YYYY-MM-DD-slug.md 로 커밋</li>
          </ul>

          {preview && (
            <React.Fragment>
              <div className="section-label" style={{ marginTop: 24 }}>Markdown preview</div>
              <pre style={{
                background: "var(--card)", border: "1px solid var(--rule)", padding: 14,
                fontFamily: "var(--mono)", fontSize: 11, lineHeight: 1.55,
                maxHeight: 320, overflow: "auto", whiteSpace: "pre-wrap",
              }}>
                {md || "(empty)"}
              </pre>
            </React.Fragment>
          )}
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, { WritePage });


// App — routing, state, Tweaks panel

function App() {
  const [state, setState] = useState({ posts: [], sparks: [], streams: [] });
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(() => localStorage.getItem(STORAGE.route) || "home");
  const [activePost, setActivePost] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE.theme) || "light");
  const [accent, setAccent] = useState(() => localStorage.getItem(STORAGE.accent) || "#6b7dd3");

  useEffect(() => {
    let alive = true;
    loadState().then((s) => { if (alive) { setState(s); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE.route, route); }, [route]);
  // If we leave the editor by any path, drop the in-flight edit so the next
  // visit to /write starts as a fresh entry instead of resuming the old one.
  useEffect(() => { if (route !== "write") setEditingPost(null); }, [route]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE.theme, theme);
  }, [theme]);
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accent);
    localStorage.setItem(STORAGE.accent, accent);
  }, [accent]);

  const setPosts = (p) => setState((s) => ({ ...s, posts: p }));
  const setSparks = (sp) => setState((s) => ({ ...s, sparks: sp }));
  const setStreams = (st) => setState((s) => ({ ...s, streams: st }));

  const accents = [
    { name: "BlueNode",   val: "#6b7dd3" },
    { name: "Sky",        val: "#8fb4e8" },
    { name: "Cobalt",     val: "#3b54b0" },
    { name: "Ink",        val: "#1a1f2e" },
    { name: "Slate",      val: "#5a6478" },
    { name: "Electric",   val: "#4a6cff" },
  ];

  if (loading) {
    return (
      <div style={{ padding: 60, fontFamily: "var(--mono, monospace)", color: "var(--muted, #6e6e6e)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        loading field notes…
      </div>
    );
  }

  return (
    <div className="app">
      <TopBar route={route} setRoute={setRoute} onOpenTweaks={() => setTweaksOpen(!tweaksOpen)} />

      {route === "home" && <HomePage posts={state.posts} sparks={state.sparks} setRoute={setRoute} setActivePost={setActivePost} />}
      {route === "stream" && <StreamPage
        posts={state.posts}
        streams={state.streams}
        setStreams={setStreams}
        setRoute={setRoute}
        setActivePost={setActivePost}
      />}
      {route === "posts" && <PostsPage posts={state.posts} setRoute={setRoute} setActivePost={setActivePost} />}
      {route === "reader" && <ReaderPage
        post={activePost}
        setRoute={setRoute}
        onEdit={(p) => { setEditingPost(p); setRoute("write"); }}
        onDelete={async (p) => {
          if (!confirm(`정말 삭제할까요?\n\n${p.title}\n(${p.file})`)) return;
          try {
            await apiDeletePost(p.file);
            const fresh = await fetchJson(API.posts);
            setPosts(fresh);
            setActivePost(null);
            setRoute("posts");
          } catch (e) { alert("삭제 실패: " + e.message); }
        }}
      />}
      {route === "write" && <WritePage
        posts={state.posts}
        setPosts={setPosts}
        setRoute={setRoute}
        editingPost={editingPost}
        clearEditing={() => setEditingPost(null)}
      />}
      {route === "sparks" && <SparksPage sparks={state.sparks} setSparks={setSparks} />}
      {route === "tags" && <TagsPage posts={state.posts} setRoute={setRoute} />}
      {route === "about" && <AboutPage />}

      {/* Footer */}
      <footer style={{
        padding: "40px", borderTop: "1px solid var(--rule)",
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 40, color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
      }}>
        <div>© 2K26 · FIELD NOTES<br /><span style={{ color: "var(--muted-2)" }}>BUILT WITH JEKYLL + CHIRPY · CUSTOM FRONT</span></div>
        <div style={{ textAlign: "center" }}>MADE IN SEOUL</div>
        <div style={{ textAlign: "right" }}>
          RSS ↗ &nbsp;·&nbsp; GITHUB ↗ &nbsp;·&nbsp; EMAIL ↗
        </div>
      </footer>

      {/* Tweaks */}
      <div className={`tweaks ${tweaksOpen ? "open" : ""}`}>
        <h4>
          TWEAKS
          <span style={{ cursor: "pointer" }} onClick={() => setTweaksOpen(false)}>✕</span>
        </h4>
        <div className="row">
          <span className="label">THEME</span>
          <button className="toggle" aria-pressed={theme === "dark"} onClick={() => setTheme(theme === "dark" ? "light" : "dark")} />
        </div>
        <div className="row" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
          <span className="label">ACCENT</span>
          <div className="swatches">
            {accents.map((a) => (
              <button key={a.val} className="sw" aria-pressed={accent === a.val}
                style={{ background: a.val }}
                onClick={() => setAccent(a.val)} title={a.name} />
            ))}
          </div>
        </div>
        <div className="row">
          <span className="label">REFRESH</span>
          <button className="icon-btn" onClick={async () => {
            setLoading(true);
            setState(await loadState());
            setLoading(false);
          }}>RELOAD</button>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
