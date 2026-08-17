// Golf chunk (scorecards + round logs) — compiled separately by build.js
// and lazy-loaded via loadChunk("golf", ...) only when the Golf page is
// actually opened. See app.jsx for the loadChunk()/window.__v bridge this
// depends on.
const { useRef, useState } = React;
const {
  Card, EmptyState, SectionLabel, IconClose, IconGolf,
  convertHeicIfNeeded, dbDeletePhoto, dbGetPhotosByIds, dbPutPhoto,
} = window.__v;

const GOLF_PAR72 = [4, 5, 4, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 4, 5, 3, 4];
function golfBlankCard() {
  return { date: new Date().toISOString().slice(0, 10), course: "", tee: "", holes: GOLF_PAR72.map((p) => ({ par: p, strokes: "" })) };
}
function golfCardStats(card) {
  const holes = card.holes || [];
  let strokes = 0, par = 0, played = 0;
  holes.forEach((h) => {
    const st = parseInt(h.strokes, 10);
    if (!isNaN(st) && st > 0) { strokes += st; par += Number(h.par) || 0; played++; }
  });
  const front = holes.slice(0, 9).reduce((a, h) => a + (parseInt(h.strokes, 10) > 0 ? parseInt(h.strokes, 10) : 0), 0);
  const back = holes.slice(9, 18).reduce((a, h) => a + (parseInt(h.strokes, 10) > 0 ? parseInt(h.strokes, 10) : 0), 0);
  const totalPar = holes.reduce((a, h) => a + (Number(h.par) || 0), 0);
  return { strokes, par, played, vs: strokes - par, front, back, totalPar, complete: played === holes.length };
}
function golfVsLabel(vs) { return vs === 0 ? "E" : vs > 0 ? `+${vs}` : `${vs}`; }

function GolfScorecards({ theme, cards, setCards, delay }) {
  const list = cards || [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(golfBlankCard);
  const [expandedId, setExpandedId] = useState(null);

  function setHole(i, key, val) {
    setForm((f) => ({ ...f, holes: f.holes.map((h, idx) => (idx === i ? { ...h, [key]: val } : h)) }));
  }
  function save() {
    const st = golfCardStats(form);
    if (st.played === 0) return;
    setCards([{ id: "sc" + Date.now(), ...form }, ...list]);
    setForm(golfBlankCard());
    setShowForm(false);
  }
  function remove(id) { setCards(list.filter((c) => c.id !== id)); }

  const completed = list.map((c) => ({ c, s: golfCardStats(c) })).filter((x) => x.s.complete);
  const best = completed.length ? completed.reduce((a, b) => (b.s.strokes < a.s.strokes ? b : a)) : null;
  const avg = completed.length ? Math.round((completed.reduce((a, x) => a + x.s.strokes, 0) / completed.length) * 10) / 10 : null;
  const avgVs = completed.length ? Math.round((completed.reduce((a, x) => a + x.s.vs, 0) / completed.length) * 10) / 10 : null;

  const small = { width: "100%", padding: "5px 2px", borderRadius: "6px", fontSize: "13px", textAlign: "center", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent };
  const inputStyle = { padding: "8px 10px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent };
  const formStats = golfCardStats(form);

  function HoleGrid({ holes, editable }) {
    const cell = (h, i) => {
      const st = golfCardStats({ holes: [h] });
      const diff = parseInt(h.strokes, 10) > 0 ? parseInt(h.strokes, 10) - (Number(h.par) || 0) : null;
      const dColor = diff == null ? theme.textFaint : diff < 0 ? theme.positive : diff === 0 ? theme.textMuted : theme.danger;
      return (
        <div key={i} style={{ width: "40px", flexShrink: 0, textAlign: "center" }}>
          <div style={{ fontSize: "10px", color: theme.textFaint, marginBottom: "2px" }}>{i + 1}</div>
          {editable ? (
            <React.Fragment>
              <input value={h.par} onChange={(e) => setHole(i, "par", e.target.value)} inputMode="numeric" className="v-input" style={{ ...small, marginBottom: "3px", color: theme.textMuted }} title={`Hole ${i + 1} par`} />
              <input value={h.strokes} onChange={(e) => setHole(i, "strokes", e.target.value)} inputMode="numeric" placeholder="–" className="v-input" style={small} title={`Hole ${i + 1} strokes`} />
            </React.Fragment>
          ) : (
            <React.Fragment>
              <div style={{ fontSize: "10px", color: theme.textFaint }}>par {h.par}</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: dColor }}>{h.strokes || "–"}</div>
            </React.Fragment>
          )}
        </div>
      );
    };
    return (
      <div className="v-scroll" style={{ overflowX: "auto", "--scroll-thumb": theme.divider, paddingBottom: "4px" }}>
        <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
          {holes.slice(0, 9).map(cell)}
          <div style={{ width: "48px", flexShrink: 0, textAlign: "center", alignSelf: "flex-end", fontSize: "12px", fontWeight: 700, color: theme.text }}>
            <div style={{ fontSize: "10px", color: theme.textFaint }}>OUT</div>
            {holes.slice(0, 9).reduce((a, h) => a + (parseInt(h.strokes, 10) > 0 ? parseInt(h.strokes, 10) : 0), 0) || "–"}
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {holes.slice(9, 18).map((h, i) => cell(h, i + 9))}
          <div style={{ width: "48px", flexShrink: 0, textAlign: "center", alignSelf: "flex-end", fontSize: "12px", fontWeight: 700, color: theme.text }}>
            <div style={{ fontSize: "10px", color: theme.textFaint }}>IN</div>
            {holes.slice(9, 18).reduce((a, h) => a + (parseInt(h.strokes, 10) > 0 ? parseInt(h.strokes, 10) : 0), 0) || "–"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card theme={theme} delay={delay}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
        <SectionLabel theme={theme} icon={<IconGolf />} style={{ margin: 0 }}>Scorecards</SectionLabel>
        <button onClick={() => { setShowForm((v) => !v); setForm(golfBlankCard()); }} className="v-btn" style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: "10px", fontSize: "13px", fontWeight: 700, border: showForm ? `1px solid ${theme.cardBorder}` : "none", background: showForm ? "transparent" : theme.accent, color: showForm ? theme.textMuted : theme.accentText }}>
          {showForm ? "Cancel" : "New scorecard"}
        </button>
      </div>

      {completed.length > 0 && (
        <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginBottom: "14px" }}>
          <div><div style={{ fontSize: "11px", color: theme.textFaint }}>Best</div><div className="v-tabular" style={{ fontSize: "20px", fontWeight: 800, color: theme.text }}>{best.s.strokes} <span style={{ fontSize: "13px", color: theme.textMuted }}>{golfVsLabel(best.s.vs)}</span></div></div>
          <div><div style={{ fontSize: "11px", color: theme.textFaint }}>Average</div><div className="v-tabular" style={{ fontSize: "20px", fontWeight: 800, color: theme.text }}>{avg} <span style={{ fontSize: "13px", color: theme.textMuted }}>{golfVsLabel(avgVs)}</span></div></div>
          <div><div style={{ fontSize: "11px", color: theme.textFaint }}>Rounds</div><div className="v-tabular" style={{ fontSize: "20px", fontWeight: 800, color: theme.text }}>{completed.length}</div></div>
        </div>
      )}

      {showForm && (
        <div style={{ border: `1px solid ${theme.cardBorder}`, borderRadius: "12px", padding: "14px", marginBottom: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px", marginBottom: "12px" }}>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="v-input" style={inputStyle} />
            <input value={form.course} onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))} placeholder="Course" className="v-input" style={{ ...inputStyle, gridColumn: "span 2" }} />
            <input value={form.tee} onChange={(e) => setForm((f) => ({ ...f, tee: e.target.value }))} placeholder="Tees (optional)" className="v-input" style={inputStyle} />
          </div>
          <HoleGrid holes={form.holes} editable />
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: theme.text }}>{formStats.strokes || "–"} strokes <span style={{ color: theme.textMuted, fontWeight: 600 }}>({golfVsLabel(formStats.vs)} · par {formStats.totalPar})</span></span>
            <button onClick={save} className="v-btn" style={{ marginLeft: "auto", padding: "8px 18px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText }}>Save round</button>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        !showForm && <EmptyState theme={theme} art="golf" title="No scorecards yet" message="Tap “New scorecard” to log a round hole-by-hole." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {list.map((c) => {
            const st = golfCardStats(c);
            const open = expandedId === c.id;
            return (
              <div key={c.id} style={{ border: `1px solid ${theme.cardBorder}`, borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 12px", cursor: "pointer" }} onClick={() => setExpandedId(open ? null : c.id)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: theme.text }}>{c.course || "Round"}</div>
                    <div style={{ fontSize: "11.5px", color: theme.textFaint, marginTop: "2px" }}>{c.date}{c.tee ? " · " + c.tee : ""}{!st.complete ? ` · ${st.played}/18 holes` : ""}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="v-tabular" style={{ fontSize: "16px", fontWeight: 800, color: theme.text }}>{st.strokes}</div>
                    <div style={{ fontSize: "11.5px", fontWeight: 700, color: st.vs < 0 ? theme.positive : st.vs === 0 ? theme.textMuted : theme.danger }}>{golfVsLabel(st.vs)}</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); remove(c.id); }} className="v-btn v-iconbtn" title="Remove" style={{ border: "none", background: "transparent", color: theme.textMuted, padding: "4px", display: "inline-flex", flexShrink: 0 }}><IconClose /></button>
                </div>
                {open && (
                  <div style={{ padding: "0 12px 12px" }}>
                    <HoleGrid holes={c.holes} editable={false} />
                    <div style={{ fontSize: "12px", color: theme.textMuted, marginTop: "6px" }}>Out {st.front} · In {st.back} · Total {st.strokes} ({golfVsLabel(st.vs)})</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function GolfRoundLog({ theme, title, rounds, setRounds, delay }) {
  const emptyForm = {
    date: new Date().toISOString().slice(0, 10),
    course: "",
    par: "72",
    front9: "",
    back9: "",
    fairwayHits: "",
    gir: "",
    avgDrivingDistance: "",
    totalPutts: "",
    scrambling: "",
    sandSaves: "",
  };
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [convertingPhotos, setConvertingPhotos] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [roundPhotos, setRoundPhotos] = useState({});
  const photoInputRef = useRef(null);

  function updateForm(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handlePhotoSelect(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    setConvertingPhotos(true);
    try {
      const converted = await Promise.all(files.map(convertHeicIfNeeded));
      setPhotoFiles((prev) => [...prev, ...converted].slice(0, 6));
    } finally {
      setConvertingPhotos(false);
    }
  }

  function removeStagedPhoto(idx) {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function addRound() {
    if (!form.course.trim() || form.front9 === "" || form.back9 === "") return;
    setSaving(true);
    try {
      const id = "gr" + Date.now() + Math.random().toString(36).slice(2, 6);
      const photoIds = [];
      for (const file of photoFiles) {
        const photoId = "gp" + Date.now() + Math.random().toString(36).slice(2, 8);
        await dbPutPhoto({ id: photoId, roundId: id, blob: file, createdAt: Date.now() });
        photoIds.push(photoId);
      }
      const numOrNull = (v) => (v === "" ? null : Number(v));
      const round = {
        id,
        date: form.date || new Date().toISOString().slice(0, 10),
        course: form.course.trim(),
        par: Number(form.par) || 72,
        front9: Number(form.front9) || 0,
        back9: Number(form.back9) || 0,
        fairwayHits: numOrNull(form.fairwayHits),
        gir: numOrNull(form.gir),
        avgDrivingDistance: numOrNull(form.avgDrivingDistance),
        totalPutts: numOrNull(form.totalPutts),
        scrambling: numOrNull(form.scrambling),
        sandSaves: numOrNull(form.sandSaves),
        photoIds,
      };
      setRounds([round, ...rounds]);
      setForm(emptyForm);
      setPhotoFiles([]);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function removeRound(id) {
    const round = rounds.find((r) => r.id === id);
    if (round && round.photoIds && round.photoIds.length > 0) {
      await Promise.all(round.photoIds.map((pid) => dbDeletePhoto(pid)));
    }
    setRounds(rounds.filter((r) => r.id !== id));
  }

  async function loadPhotosFor(round) {
    if (roundPhotos[round.id] || !round.photoIds || round.photoIds.length === 0) return;
    const records = await dbGetPhotosByIds(round.photoIds);
    const withUrls = records.map((r) => ({ id: r.id, url: URL.createObjectURL(r.blob) }));
    setRoundPhotos((prev) => ({ ...prev, [round.id]: withUrls }));
  }

  function toggleExpand(round) {
    if (expandedId === round.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(round.id);
    loadPhotosFor(round);
  }

  const sorted = rounds.slice().sort((a, b) => b.date.localeCompare(a.date));
  const scores = rounds.map((r) => r.front9 + r.back9);
  const avgScore = scores.length ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10 : null;
  const bestScore = scores.length ? Math.min(...scores) : null;

  const inputStyle = {
    background: theme.inputBg,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "8px",
    color: theme.inputText,
    padding: "8px 10px",
    fontSize: "13px",
    minWidth: 0,
    width: "100%",
    "--focus-ring": theme.accentSoft,
    "--focus-border": theme.accent,
  };
  const fieldLabelStyle = {
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    color: theme.textFaint,
    marginBottom: "4px",
    display: "block",
  };

  function Field({ label, children }) {
    return (
      <div style={{ minWidth: 0 }}>
        <span style={fieldLabelStyle}>{label}</span>
        {children}
      </div>
    );
  }

  return (
    <Card theme={theme} delay={delay}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
        <SectionLabel theme={theme} icon={<IconGolf />} style={{ marginBottom: 0 }}>
          {title}
        </SectionLabel>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="v-btn"
          style={{ fontSize: "11.5px", fontWeight: 700, color: theme.textMuted, background: "transparent", border: `1px solid ${theme.divider}`, borderRadius: "999px", padding: "4px 10px" }}
        >
          {showForm ? "Cancel" : "+ Add Round"}
        </button>
      </div>

      {rounds.length > 0 && (
        <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: theme.textFaint, marginBottom: "16px" }}>
          <span>{rounds.length} round{rounds.length === 1 ? "" : "s"}</span>
          {avgScore !== null && (
            <span>
              avg <span className="v-tabular" style={{ color: theme.text, fontWeight: 700 }}>{avgScore}</span>
            </span>
          )}
          {bestScore !== null && (
            <span>
              best <span className="v-tabular" style={{ color: theme.text, fontWeight: 700 }}>{bestScore}</span>
            </span>
          )}
        </div>
      )}

      {showForm && (
        <div style={{ background: theme.accentSoft, border: `1px solid ${theme.divider}`, borderRadius: "12px", padding: "14px", marginBottom: "18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px", marginBottom: "10px" }}>
            <Field label="Course">
              <input value={form.course} onChange={(e) => updateForm("course", e.target.value)} className="v-input" style={inputStyle} placeholder="Ballyhack Golf Club" />
            </Field>
            <Field label="Date">
              <input type="date" value={form.date} onChange={(e) => updateForm("date", e.target.value)} className="v-input" style={inputStyle} />
            </Field>
            <Field label="Par">
              <input type="number" value={form.par} onChange={(e) => updateForm("par", e.target.value)} className="v-input v-tabular" style={inputStyle} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px", marginBottom: "10px" }}>
            <Field label="Front 9">
              <input type="number" value={form.front9} onChange={(e) => updateForm("front9", e.target.value)} className="v-input v-tabular" style={inputStyle} placeholder="42" />
            </Field>
            <Field label="Back 9">
              <input type="number" value={form.back9} onChange={(e) => updateForm("back9", e.target.value)} className="v-input v-tabular" style={inputStyle} placeholder="42" />
            </Field>
            <Field label="Total putts">
              <input type="number" value={form.totalPutts} onChange={(e) => updateForm("totalPutts", e.target.value)} className="v-input v-tabular" style={inputStyle} placeholder="30" />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px", marginBottom: "10px" }}>
            <Field label="Fairway hits %">
              <input type="number" value={form.fairwayHits} onChange={(e) => updateForm("fairwayHits", e.target.value)} className="v-input v-tabular" style={inputStyle} placeholder="43" />
            </Field>
            <Field label="GIR %">
              <input type="number" value={form.gir} onChange={(e) => updateForm("gir", e.target.value)} className="v-input v-tabular" style={inputStyle} placeholder="33" />
            </Field>
            <Field label="Avg drive (yd)">
              <input type="number" value={form.avgDrivingDistance} onChange={(e) => updateForm("avgDrivingDistance", e.target.value)} className="v-input v-tabular" style={inputStyle} placeholder="244" />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px", marginBottom: "12px" }}>
            <Field label="Scrambling %">
              <input type="number" value={form.scrambling} onChange={(e) => updateForm("scrambling", e.target.value)} className="v-input v-tabular" style={inputStyle} placeholder="75" />
            </Field>
            <Field label="Sand saves %">
              <input type="number" value={form.sandSaves} onChange={(e) => updateForm("sandSaves", e.target.value)} className="v-input v-tabular" style={inputStyle} placeholder="50" />
            </Field>
          </div>

          <span style={fieldLabelStyle}>Scorecard photos (optional)</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
            {photoFiles.map((f, i) => (
              <div key={i} style={{ position: "relative", width: "52px", height: "52px", borderRadius: "8px", overflow: "hidden", border: `1px solid ${theme.divider}` }}>
                <img src={URL.createObjectURL(f)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <button
                  onClick={() => removeStagedPhoto(i)}
                  title="Remove"
                  className="v-btn"
                  style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "10px", lineHeight: "16px", textAlign: "center", padding: 0 }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => photoInputRef.current && photoInputRef.current.click()}
              disabled={convertingPhotos}
              className="v-btn"
              style={{ width: "52px", height: "52px", borderRadius: "8px", border: `1px dashed ${theme.inputBorder}`, background: "transparent", color: theme.textMuted, fontSize: convertingPhotos ? "9px" : "20px", fontWeight: convertingPhotos ? 700 : 400, opacity: convertingPhotos ? 0.7 : 1 }}
            >
              {convertingPhotos ? "Loading…" : "+"}
            </button>
            <input ref={photoInputRef} type="file" accept="image/*,.heic,.heif" multiple onChange={handlePhotoSelect} style={{ display: "none" }} />
          </div>

          <button
            onClick={addRound}
            disabled={saving}
            className="v-btn"
            style={{ padding: "9px 18px", borderRadius: "8px", border: "none", background: theme.accent, color: theme.accentText, fontSize: "13px", fontWeight: 700, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : "Save Round"}
          </button>
        </div>
      )}

      {sorted.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {sorted.map((r) => {
            const total = r.front9 + r.back9;
            const toPar = total - r.par;
            const toParLabel = toPar === 0 ? "E" : toPar > 0 ? `+${toPar}` : `${toPar}`;
            const toParColor = toPar > 0 ? theme.danger : toPar < 0 ? theme.positive : theme.textMuted;
            const expanded = expandedId === r.id;
            const metrics = [
              ["Fairway hits", r.fairwayHits, "%"],
              ["GIR", r.gir, "%"],
              ["Avg drive", r.avgDrivingDistance, "yd"],
              ["Putts", r.totalPutts, ""],
              ["Scrambling", r.scrambling, "%"],
              ["Sand saves", r.sandSaves, "%"],
            ].filter(([, v]) => v !== null && v !== undefined);
            return (
              <div key={r.id} style={{ background: theme.accentSoft, border: `1px solid ${theme.divider}`, borderRadius: "10px", overflow: "hidden" }}>
                <div onClick={() => toggleExpand(r)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", cursor: "pointer" }}>
                  <span style={{ fontSize: "11px", color: theme.textFaint, flexShrink: 0, width: "44px" }}>
                    {r.date.slice(5).replace("-", "/")}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: "13.5px", fontWeight: 600, color: theme.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.course}
                  </span>
                  <span className="v-tabular" style={{ fontSize: "12px", color: theme.textFaint, flexShrink: 0 }}>
                    {r.front9}-{r.back9}
                  </span>
                  <span className="v-tabular" style={{ fontSize: "15px", fontWeight: 700, color: theme.text, flexShrink: 0 }}>
                    {total} <span style={{ fontSize: "12px", color: toParColor }}>({toParLabel})</span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRound(r.id);
                    }}
                    title="Remove"
                    className="v-btn"
                    style={{ width: "18px", height: "18px", borderRadius: "50%", border: "none", background: theme.dangerSoft, color: theme.danger, fontSize: "11px", lineHeight: "18px", textAlign: "center", padding: 0, flexShrink: 0 }}
                  >
                    ×
                  </button>
                </div>
                {expanded && (
                  <div style={{ padding: "0 12px 14px", borderTop: `1px solid ${theme.divider}` }}>
                    {metrics.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "10px", marginTop: "12px" }}>
                        {metrics.map(([label, value, suffix]) => (
                          <div key={label}>
                            <div style={fieldLabelStyle}>{label}</div>
                            <div className="v-tabular" style={{ fontSize: "14px", fontWeight: 700, color: theme.text }}>
                              {value}
                              {suffix}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {roundPhotos[r.id] && roundPhotos[r.id].length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                        {roundPhotos[r.id].map((p) => (
                          <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer">
                            <img src={p.url} alt="" style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "8px", border: `1px solid ${theme.divider}`, display: "block" }} />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !showForm && <div style={{ fontSize: "13px", color: theme.textFaint }}>No rounds logged yet.</div>
      )}
    </Card>
  );
}


window.__vChunks = window.__vChunks || {};
window.__vChunks.golf = { GolfScorecards, GolfRoundLog };
