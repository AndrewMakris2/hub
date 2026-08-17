// Job Search chunk — compiled separately by build.js and lazy-loaded via
// loadChunk("jobsearch", ...) only when the Job Search page is opened,
// instead of shipping with every page load. See app.jsx for the
// loadChunk()/window.__v bridge this depends on.
//
// This deliberately stops short of auto-applying. It fetches real listings
// from public, ToS-compliant company career-site APIs (Greenhouse/Lever —
// the same feeds those companies' own career pages embed), scores them
// against the resume already stored in Vantage, and prepares everything a
// human needs to apply fast: matched skills, tailored resume bullets, and
// your own pre-written answers to the common application questions. You
// still open the real posting and click submit yourself.
const { useState, useEffect, useMemo } = React;
const {
  Card, EmptyState, SectionLabel, IconBriefcase, IconClose, IconShare,
  cardBackgroundStyle, saveJSON, timeAgo, truncate, usePersistentState, STORAGE_KEYS, toast,
} = window.__v;

const JOB_STALE_MS = 60 * 60 * 1000;

// Public career-site job-board feeds (no login, no scraping — these are the
// same JSON endpoints each company's own careers page fetches to render its
// listings). Verified live before shipping; a board with zero current
// openings or a renamed token just returns nothing rather than erroring.
const JOB_BOARDS = [
  { company: "Cloudflare", ats: "greenhouse", token: "cloudflare" },
  { company: "Datadog", ats: "greenhouse", token: "datadog" },
  { company: "Okta", ats: "greenhouse", token: "okta" },
  { company: "Stripe", ats: "greenhouse", token: "stripe" },
  { company: "Coinbase", ats: "greenhouse", token: "coinbase" },
  { company: "Robinhood", ats: "greenhouse", token: "robinhood" },
  { company: "Affirm", ats: "greenhouse", token: "affirm" },
  { company: "Airbnb", ats: "greenhouse", token: "airbnb" },
  { company: "Pinterest", ats: "greenhouse", token: "pinterest" },
  { company: "Reddit", ats: "greenhouse", token: "reddit" },
  { company: "Discord", ats: "greenhouse", token: "discord" },
  { company: "Figma", ats: "greenhouse", token: "figma" },
  { company: "Asana", ats: "greenhouse", token: "asana" },
  { company: "Brex", ats: "greenhouse", token: "brex" },
  { company: "Gusto", ats: "greenhouse", token: "gusto" },
  { company: "Squarespace", ats: "greenhouse", token: "squarespace" },
  { company: "Vercel", ats: "greenhouse", token: "vercel" },
  { company: "Palantir", ats: "lever", token: "palantir" },
  { company: "Plaid", ats: "lever", token: "plaid" },
];

// Relevance gate — only cybersecurity-shaped titles/departments make it into
// the list at all, regardless of resume match score.
const SECURITY_TITLE_RE = /security|cyber|\bsoc\b|threat|vulnerabilit|infosec|siem|incident response|penetration|appsec|devsecops|\bgrc\b|compliance|identity.{0,20}access|\biam\b|detection engineer|red team|blue team|purple team|forensic|trust (and|&) safety/i;

async function fetchGreenhouseJobs(board) {
  const r = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board.token}/jobs`);
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  return (j.jobs || []).map((x) => {
    const dept = (x.metadata || [])
      .map((m) => (Array.isArray(m.value) ? m.value.join(" ") : String(m.value || "")))
      .join(" ");
    return {
      id: `gh:${board.token}:${x.id}`,
      source: "greenhouse",
      company: board.company,
      title: x.title || "",
      location: (x.location && x.location.name) || "",
      department: dept,
      description: "",
      url: x.absolute_url || "",
      postedAt: x.first_published || x.updated_at || "",
    };
  });
}

async function fetchLeverJobs(board) {
  const r = await fetch(`https://api.lever.co/v0/postings/${board.token}?mode=json`);
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  if (!Array.isArray(j)) return [];
  return j.map((x) => ({
    id: `lever:${board.token}:${x.id}`,
    source: "lever",
    company: board.company,
    title: x.text || "",
    location: (x.categories && x.categories.location) || "",
    department: (x.categories && x.categories.team) || "",
    description: x.descriptionPlain || "",
    url: x.hostedUrl || x.applyUrl || "",
    postedAt: x.createdAt ? new Date(x.createdAt).toISOString() : "",
  }));
}

function fetchJobBoard(board) {
  return board.ats === "lever" ? fetchLeverJobs(board) : fetchGreenhouseJobs(board);
}

async function fetchAllJobs() {
  const settled = await Promise.allSettled(JOB_BOARDS.map(fetchJobBoard));
  const jobs = [];
  settled.forEach((r) => { if (r.status === "fulfilled") jobs.push(...r.value); });
  return jobs.filter((j) => SECURITY_TITLE_RE.test(`${j.title} ${j.department}`));
}

const STOPWORDS = new Set(["and", "or", "the", "for", "with", "your", "you", "our", "are", "will", "this", "that", "from", "have"]);
function tokenize(s) {
  return String(s || "")
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function buildResumeKeywordTokens(resume) {
  const tokens = new Set();
  (resume.skills || []).forEach((g) => (g.items || []).forEach((i) => tokenize(i).forEach((t) => tokens.add(t))));
  (resume.experience || []).forEach((e) => { if (e.title) tokenize(e.title).forEach((t) => tokens.add(t)); });
  if (resume.title) tokenize(resume.title).forEach((t) => tokens.add(t));
  return tokens;
}

function scoreJob(job, keywordTokens) {
  const hayTokens = tokenize(`${job.title} ${job.department} ${job.description || ""}`);
  const matched = new Set();
  hayTokens.forEach((t) => { if (keywordTokens.has(t)) matched.add(t); });
  return { score: matched.size, matched: Array.from(matched) };
}

// Pick the resume bullets whose own wording overlaps most with this specific
// job's title/department/description — a lightweight per-application
// "here's what to lead with" instead of the same generic summary every time.
function tailoredBullets(resume, job, limit) {
  const jobTokens = new Set(tokenize(`${job.title} ${job.department} ${job.description || ""}`));
  const scored = [];
  (resume.experience || []).forEach((exp) => {
    (exp.bullets || []).forEach((b) => {
      const bTokens = tokenize(b);
      let overlap = 0;
      bTokens.forEach((t) => { if (jobTokens.has(t)) overlap++; });
      if (overlap > 0) scored.push({ text: b, overlap, company: exp.company });
    });
  });
  scored.sort((a, b) => b.overlap - a.overlap);
  return scored.slice(0, limit || 3);
}

const DEFAULT_JOB_SEARCH_PROFILE = {
  yearsExperience: "3+",
  workAuthorization: "Authorized to work in the US",
  requireSponsorship: "No",
  desiredSalaryMin: "",
  desiredSalaryMax: "",
  noticePeriod: "2 weeks",
  remotePreference: "Remote",
  willingToRelocate: "No",
  securityClearance: "None",
  linkedinUrl: "",
  portfolioUrl: "",
  startDate: "Immediately",
};

const PROFILE_FIELDS = [
  { key: "yearsExperience", label: "Years of experience" },
  { key: "workAuthorization", label: "Work authorization" },
  { key: "requireSponsorship", label: "Require sponsorship?" },
  { key: "desiredSalaryMin", label: "Desired salary — min" },
  { key: "desiredSalaryMax", label: "Desired salary — max" },
  { key: "noticePeriod", label: "Notice period" },
  { key: "remotePreference", label: "Remote preference" },
  { key: "willingToRelocate", label: "Willing to relocate?" },
  { key: "securityClearance", label: "Security clearance" },
  { key: "startDate", label: "Earliest start date" },
  { key: "linkedinUrl", label: "LinkedIn URL" },
  { key: "portfolioUrl", label: "Portfolio / GitHub URL" },
];

function JobSearchProfileForm({ theme, profile, setProfile, onDone }) {
  const [draft, setDraft] = useState(profile);
  function field(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  function save() {
    setProfile(draft);
    toast.success("Saved your application answers.");
    onDone();
  }
  return (
    <Card theme={theme} delay={0}>
      <SectionLabel theme={theme} icon={<IconBriefcase />} style={{ margin: 0 }}>Your application answers</SectionLabel>
      <p style={{ fontSize: "12.5px", color: theme.textMuted, margin: "8px 0 16px" }}>
        Fill these in once — every job below shows them ready to copy into the real application.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
        {PROFILE_FIELDS.map((f) => (
          <label key={f.key} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 700, color: theme.textMuted }}>{f.label}</span>
            <input
              value={draft[f.key] || ""}
              onChange={(e) => field(f.key, e.target.value)}
              style={{
                padding: "8px 10px", borderRadius: "8px", fontSize: "13px",
                border: `1px solid ${theme.inputBorder}`, background: theme.inputBg, color: theme.text,
              }}
            />
          </label>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "18px" }}>
        <button
          onClick={save}
          className="v-btn"
          style={{ padding: "9px 16px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText }}
        >
          Save answers
        </button>
        <button
          onClick={onDone}
          className="v-btn"
          style={{ padding: "9px 16px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.text }}
        >
          Cancel
        </button>
      </div>
    </Card>
  );
}

function CopyRow({ theme, label, value }) {
  if (!value) return null;
  function copy() {
    navigator.clipboard && navigator.clipboard.writeText(value).then(() => toast.info(`Copied ${label.toLowerCase()}.`)).catch(() => {});
  }
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "7px 0", borderTop: `1px solid ${theme.divider}` }}>
      <span style={{ fontSize: "12px", color: theme.textFaint, minWidth: "130px" }}>{label}</span>
      <span style={{ fontSize: "13px", color: theme.text, flex: 1, textAlign: "right" }}>{value}</span>
      <button
        onClick={copy}
        className="v-btn"
        title={`Copy ${label}`}
        style={{ padding: "4px 9px", borderRadius: "7px", fontSize: "11px", fontWeight: 700, border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.accent, flexShrink: 0 }}
      >
        Copy
      </button>
    </div>
  );
}

const JOB_STATUS_OPTIONS = [
  { id: null, label: "New" },
  { id: "interested", label: "Interested" },
  { id: "applied", label: "Applied" },
  { id: "dismissed", label: "Dismissed" },
];

function JobCard({ theme, job, matched, bullets, profile, status, setStatus, expanded, onToggle }) {
  const posted = job.postedAt ? timeAgo(job.postedAt) : "";
  return (
    <div style={{ ...cardBackgroundStyle(theme), padding: "16px", borderRadius: theme.cardRadius, opacity: status === "dismissed" ? 0.55 : 1 }}>
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div style={{ fontSize: "14.5px", fontWeight: 800, color: theme.text }}>{job.title}</div>
          <div style={{ fontSize: "12.5px", color: theme.accent, fontWeight: 700, marginTop: "2px" }}>{job.company}</div>
          <div style={{ fontSize: "11.5px", color: theme.textFaint, marginTop: "3px" }}>
            {job.location}{posted ? ` · Posted ${posted}` : ""}
          </div>
        </div>
        {status && (
          <span style={{
            fontSize: "10.5px", fontWeight: 800, padding: "3px 9px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.04em",
            color: status === "applied" ? theme.good || theme.accent : status === "dismissed" ? theme.textFaint : theme.accent,
            background: status === "applied" ? (theme.goodSoft || theme.accentSoft) : status === "dismissed" ? theme.chip : theme.accentSoft,
          }}>
            {JOB_STATUS_OPTIONS.find((o) => o.id === status)?.label || status}
          </span>
        )}
      </div>

      {matched.length > 0 && (
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "10px" }}>
          {matched.slice(0, 6).map((m) => (
            <span key={m} style={{ fontSize: "10.5px", fontWeight: 700, padding: "3px 8px", borderRadius: "999px", background: theme.chip, color: theme.chipText, border: `1px solid ${theme.cardBorder}` }}>{m}</span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
        <button
          onClick={onToggle}
          className="v-btn"
          style={{ padding: "7px 13px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.text }}
        >
          {expanded ? "Hide details" : "Ready to apply"}
        </button>
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="v-btn"
          style={{ padding: "7px 13px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "5px" }}
        >
          Open application <IconShare size={12} />
        </a>
        <select
          value={status || ""}
          onChange={(e) => setStatus(e.target.value || null)}
          style={{ marginLeft: "auto", padding: "7px 10px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, border: `1px solid ${theme.cardBorder}`, background: theme.inputBg, color: theme.text }}
        >
          {JOB_STATUS_OPTIONS.map((o) => (
            <option key={o.id || "new"} value={o.id || ""}>{o.label}</option>
          ))}
        </select>
      </div>

      {expanded && (
        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: `1px solid ${theme.divider}` }}>
          {bullets.length > 0 && (
            <>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.textMuted, marginBottom: "6px" }}>
                Lead with these
              </div>
              <ul style={{ margin: "0 0 14px", paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {bullets.map((b, i) => (
                  <li key={i} style={{ fontSize: "12.5px", lineHeight: 1.5, color: theme.textMuted }}>{b.text}</li>
                ))}
              </ul>
            </>
          )}
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.textMuted, marginBottom: "2px" }}>
            Your answers
          </div>
          {PROFILE_FIELDS.map((f) => (
            <CopyRow key={f.key} theme={theme} label={f.label} value={profile[f.key]} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobSearchPage({ theme, resume }) {
  const [cache, setCache] = usePersistentState(STORAGE_KEYS.jobSearchCache, { jobs: [], fetchedAt: null });
  const [profile, setProfile] = usePersistentState(STORAGE_KEYS.jobSearchProfile, DEFAULT_JOB_SEARCH_PROFILE);
  const [status, setStatus] = usePersistentState(STORAGE_KEYS.jobSearchStatus, {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("active");

  // Prefill LinkedIn from the resume the first time this page loads, so the
  // profile form isn't empty before the user's touched it.
  useEffect(() => {
    if (profile.linkedinUrl) return;
    const li = (resume.links || []).find((l) => /linkedin/i.test(l.label || ""));
    if (li && li.url) setProfile((p) => ({ ...p, linkedinUrl: li.url }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const jobs = await fetchAllJobs();
      setCache({ jobs, fetchedAt: Date.now() });
    } catch (e) {
      setError("Couldn't reach the job boards just now — try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const stale = !cache.fetchedAt || Date.now() - cache.fetchedAt > JOB_STALE_MS;
    if (stale && !loading) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const keywordTokens = useMemo(() => buildResumeKeywordTokens(resume), [resume]);

  const scored = useMemo(() => {
    return (cache.jobs || [])
      .map((j) => ({ job: j, ...scoreJob(j, keywordTokens) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [cache.jobs, keywordTokens]);

  const visible = scored.filter(({ job }) => {
    const s = status[job.id] || null;
    if (filter === "active") return s !== "dismissed";
    if (filter === "all") return true;
    return s === filter;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card theme={theme} delay={0}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <SectionLabel theme={theme} icon={<IconBriefcase />} style={{ margin: 0, flex: 1 }}>Job Search</SectionLabel>
          <span style={{ fontSize: "12px", color: theme.textFaint }}>
            {cache.fetchedAt ? `Updated ${timeAgo(new Date(cache.fetchedAt).toISOString())}` : "Not loaded yet"}
          </span>
          <button
            onClick={() => setEditingProfile((v) => !v)}
            className="v-btn"
            style={{ padding: "8px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.text }}
          >
            {editingProfile ? "Close" : "Your answers"}
          </button>
          <button
            onClick={refresh}
            disabled={loading}
            className="v-btn"
            style={{ padding: "8px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        <p style={{ fontSize: "12.5px", color: theme.textMuted, margin: "10px 0 0", lineHeight: 1.5 }}>
          Pulls open cybersecurity roles from {JOB_BOARDS.length} companies' real career-site feeds and ranks them
          against your resume. Nothing here submits on its own — open the real posting and apply yourself.
        </p>
        {error && (
          <div style={{ marginTop: "12px", fontSize: "12.5px", fontWeight: 600, padding: "10px 13px", borderRadius: "9px", color: theme.textMuted, background: theme.accentSoft }}>
            {error}
          </div>
        )}
      </Card>

      {editingProfile && (
        <JobSearchProfileForm theme={theme} profile={profile} setProfile={setProfile} onDone={() => setEditingProfile(false)} />
      )}

      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {[
          { id: "active", label: "Active" },
          { id: "interested", label: "Interested" },
          { id: "applied", label: "Applied" },
          { id: "all", label: "All" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="v-btn"
            style={{ padding: "6px 13px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, border: `1px solid ${filter === f.id ? theme.accent : theme.cardBorder}`, background: filter === f.id ? theme.accentSoft : "transparent", color: filter === f.id ? theme.accent : theme.textMuted }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card theme={theme} delay={40}>
          <EmptyState
            theme={theme}
            art="search"
            title={loading ? "Loading roles…" : "No matches right now"}
            message={loading ? "" : "Try Refresh, or check back later — these boards change daily."}
          />
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {visible.map(({ job, matched }) => (
            <JobCard
              key={job.id}
              theme={theme}
              job={job}
              matched={matched}
              bullets={expandedId === job.id ? tailoredBullets(resume, job, 3) : []}
              profile={profile}
              status={status[job.id] || null}
              setStatus={(s) => setStatus((prev) => ({ ...prev, [job.id]: s }))}
              expanded={expandedId === job.id}
              onToggle={() => setExpandedId((id) => (id === job.id ? null : job.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

window.__vChunks = window.__vChunks || {};
window.__vChunks.jobsearch = { JobSearchPage };
