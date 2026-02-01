import React from "react";

export default function Home() {
  const leaderboard = [
    { name: "Dad", points: 62 },
    { name: "Mom", points: 60 },
    { name: "Cam", points: 41 },
    { name: "Chase", points: 39 },
    { name: "Collan", points: 25 },
  ];

  const categories = [
    "Fitness & Health",
    "Nutrition",
    "Household Responsibilities",
    "Knowledge & Learning",
    "Time Management",
    "Kindness & Empathy",
  ];

  return (
    <div style={styles.page}>
      <div style={styles.bgGlowA} />
      <div style={styles.bgGlowB} />
      <div style={styles.scanlines} />

      <div style={styles.container}>
        {/* Top Bar */}
        <header style={styles.topbar}>
          <div style={styles.brandWrap}>
            <div style={styles.brandMark} />
            <div>
              <div style={styles.brand}>Thrive Leagues</div>
              <div style={styles.subbrand}>Game Board • Living Mock</div>
            </div>
          </div>

          <div style={styles.topbarRight}>
            <div style={styles.pill}>
              <span style={styles.pillDot} />
              SEASON 1 • WEEK 1
            </div>
            <div style={styles.nav}>
              <a href="#how" style={styles.navLink}>
                How it works
              </a>
              <a href="#categories" style={styles.navLink}>
                Categories
              </a>
              <a href="#playbook" style={styles.navLink}>
                Playbook
              </a>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section style={styles.hero}>
          <div style={styles.heroLeft}>
            <div style={styles.kicker}>SYSTEM FIRST • APP SECOND</div>
            <h1 style={styles.h1}>Welcome to Thrive Leagues</h1>
            <p style={styles.lede}>
              Draft life categories. Run challenges. Track points. Build momentum —
              <span style={styles.neonText}> brick by brick</span>.
            </p>

            <div style={styles.ctaRow}>
              <button style={styles.primaryBtn} type="button">
                Start a Week (visual)
              </button>
              <button style={styles.secondaryBtn} type="button">
                View Achievements (visual)
              </button>
            </div>

            <div style={styles.microNote}>
              Buttons are visual only for now — no login, no data, no payments.
            </div>
          </div>

          <div style={styles.heroRight}>
            <div style={styles.statCard}>
              <div style={styles.statLabel}>Total points today</div>
              <div style={styles.statValue}>+17</div>
              <div style={styles.statSub}>Demo number</div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statLabel}>Active streaks</div>
              <div style={styles.statValue}>3</div>
              <div style={styles.statSub}>Demo number</div>
            </div>
          </div>
        </section>

        {/* Main grid */}
        <main style={styles.grid}>
          {/* LEFT: Moment */}
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.h2}>Thrive Moment of the Day</h2>
              <div style={styles.badgeHot}>LIVE</div>
            </div>

            <div style={styles.momentCard}>
              <div style={styles.momentTitle}>Momentum Highlight</div>
              <div style={styles.momentText}>
                <span style={styles.neonText}>Cam</span> earned{" "}
                <span style={styles.points}>+5</span> points by helping his brother
                with homework.
              </div>
              <div style={styles.momentMeta}>
                Category: Knowledge & Learning • Proof: Self-check
              </div>
            </div>

            <div style={styles.momentList}>
              {[
                { who: "Mom", pts: 10, what: "15-minute walk" },
                { who: "Dad", pts: 5, what: "Meal prep" },
                { who: "Chase", pts: 5, what: "Cleaned room" },
              ].map((x) => (
                <div key={`${x.who}-${x.what}`} style={styles.momentRow}>
                  <div style={styles.momentWho}>{x.who}</div>
                  <div style={styles.momentWhat}>{x.what}</div>
                  <div style={styles.momentPts}>+{x.pts}</div>
                </div>
              ))}
            </div>

            <div style={styles.subNote}>
              (Static demo feed — real events come later.)
            </div>
          </section>

          {/* CENTER: Thrive Wheel placeholder */}
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.h2}>Thrive Wheel</h2>
              <div style={styles.badgeNeon}>BONUS</div>
            </div>

            <div style={styles.wheelWrap}>
              <div style={styles.wheelOuter}>
                <div style={styles.wheelInner}>
                  <div style={styles.wheelLabel}>THRIVE</div>
                  <div style={styles.wheelSub}>Wheel (static)</div>
                </div>
              </div>

              <div style={styles.wheelLegend}>
                <div style={styles.legendRow}>
                  <span style={{ ...styles.legendDot, background: "#2EFF7A" }} />
                  Fitness & Health
                </div>
                <div style={styles.legendRow}>
                  <span style={{ ...styles.legendDot, background: "#FFD166" }} />
                  Knowledge & Learning
                </div>
                <div style={styles.legendRow}>
                  <span style={{ ...styles.legendDot, background: "#22D3EE" }} />
                  Household Responsibilities
                </div>
                <div style={styles.legendRow}>
                  <span style={{ ...styles.legendDot, background: "#FF4DFF" }} />
                  Kindness & Empathy
                </div>
              </div>
            </div>

            <div style={styles.subNote}>
              Next brick: replace this with a real static wheel rendering that matches
              your sketch more closely.
            </div>
          </section>

          {/* RIGHT: Leaderboard */}
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <h2 style={styles.h2}>Season Leaderboard</h2>
              <div style={styles.badgeGold}>RANK</div>
            </div>

            <div style={styles.leaderboard}>
              {leaderboard.map((row, i) => (
                <div
                  key={row.name}
                  style={{
                    ...styles.leaderRow,
                    borderBottom:
                      i === leaderboard.length - 1
                        ? "none"
                        : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div style={styles.rankPuck}>{i + 1}</div>
                  <div style={styles.leaderName}>{row.name}</div>
                  <div style={styles.leaderPoints}>
                    <span style={styles.points}>{row.points}</span> pts
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.subNote}>
              (Matches your sketch’s names + point totals.)
            </div>
          </section>

          {/* FULL WIDTH: Categories */}
          <section style={{ ...styles.panel, gridColumn: "1 / -1" }} id="categories">
            <div style={styles.panelHeader}>
              <h2 style={styles.h2}>Categories (v1)</h2>
              <div style={styles.badgeCyan}>DRAFT</div>
            </div>

            <div style={styles.categoryGrid}>
              {categories.map((c) => (
                <div key={c} style={styles.catCard}>
                  <div style={styles.catTitle}>{c}</div>
                  <div style={styles.catMeta}>Draftable • Challenge-ready</div>
                </div>
              ))}
            </div>

            <div style={styles.subNote}>
              We’ll expand to the full 25 official categories next.
            </div>
          </section>

          {/* FULL WIDTH: How it works */}
          <section style={{ ...styles.panel, gridColumn: "1 / -1" }} id="how">
            <div style={styles.panelHeader}>
              <h2 style={styles.h2}>How it works</h2>
              <div style={styles.badgeNeon}>RULES</div>
            </div>

            <div style={styles.howGrid}>
              {[
                { t: "1) Draft categories", d: "Pick what matters this season." },
                { t: "2) Run challenges", d: "Weekly structure without chaos." },
                { t: "3) Score honestly", d: "Clear rules prevent loopholes." },
                { t: "4) Review & improve", d: "Refine the system, not the vibes." },
              ].map((x) => (
                <div key={x.t} style={styles.howCard}>
                  <div style={styles.howTitle}>{x.t}</div>
                  <div style={styles.howText}>{x.d}</div>
                </div>
              ))}
            </div>

            <div style={styles.subNote}>
              Still static — we’re building slices that are complete and
              comprehensible.
            </div>
          </section>

          {/* Footer note */}
          <section style={{ ...styles.panel, gridColumn: "1 / -1" }} id="playbook">
            <div style={styles.panelHeader}>
              <h2 style={styles.h2}>Playbook</h2>
              <div style={styles.badgeHot}>STAGE 2</div>
            </div>
            <div style={styles.playbookNote}>
              Next bricks to match your sketch:{" "}
              <span style={styles.neonText}>Current Matchups</span> panel, then a
              more accurate{" "}
              <span style={styles.neonText}>Thrive Wheel</span> rendering.
            </div>
          </section>
        </main>

        <footer style={styles.footer}>
          <div>v0.0.1 • Static Living Mock • No auth • No Supabase</div>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    color: "rgba(234,240,247,0.95)",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
    background:
      "radial-gradient(1000px 600px at 12% 0%, rgba(46,255,122,0.16), transparent 55%), radial-gradient(900px 520px at 92% 8%, rgba(255,77,255,0.14), transparent 55%), radial-gradient(1000px 600px at 60% 110%, rgba(255,209,102,0.10), transparent 55%), #070A12",
    position: "relative",
    overflow: "hidden",
  },
  bgGlowA: {
    position: "absolute",
    inset: -200,
    background:
      "radial-gradient(closest-side at 20% 30%, rgba(34,211,238,0.10), transparent 55%)",
    filter: "blur(20px)",
    pointerEvents: "none",
  },
  bgGlowB: {
    position: "absolute",
    inset: -200,
    background:
      "radial-gradient(closest-side at 80% 40%, rgba(79,140,255,0.10), transparent 55%)",
    filter: "blur(22px)",
    pointerEvents: "none",
  },
  scanlines: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "100% 6px",
    opacity: 0.10,
    pointerEvents: "none",
  },

  container: {
    position: "relative",
    maxWidth: 1100,
    margin: "0 auto",
    padding: "22px 16px 40px",
  },

  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    padding: "14px 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  brandWrap: { display: "flex", alignItems: "center", gap: 10 },
  brandMark: {
    width: 14,
    height: 14,
    borderRadius: 6,
    background: "linear-gradient(135deg, #2EFF7A, #22D3EE)",
    boxShadow: "0 0 18px rgba(46,255,122,0.35)",
  },
  brand: { fontWeight: 900, letterSpacing: "0.2px" },
  subbrand: { fontSize: 12, opacity: 0.75, marginTop: 2 },

  topbarRight: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.25)",
    fontSize: 12,
    letterSpacing: "0.08em",
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "#2EFF7A",
    boxShadow: "0 0 14px rgba(46,255,122,0.55)",
  },
  nav: { display: "flex", gap: 10 },
  navLink: {
    color: "rgba(234,240,247,0.85)",
    textDecoration: "none",
    fontSize: 13,
    padding: "6px 8px",
    borderRadius: 10,
    border: "1px solid transparent",
  },

  hero: {
    marginTop: 14,
    display: "flex",
    gap: 14,
    justifyContent: "space-between",
    padding: "18px 16px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  heroLeft: { flex: 1, minWidth: 260 },
  heroRight: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 10,
    minWidth: 200,
    alignContent: "start",
  },
  kicker: {
    display: "inline-block",
    fontSize: 12,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    opacity: 0.8,
    marginBottom: 10,
  },
  h1: { fontSize: 32, lineHeight: 1.08, margin: 0, letterSpacing: "-0.02em" },
  lede: { margin: "10px 0 0", opacity: 0.88, maxWidth: 680, lineHeight: 1.5 },
  neonText: {
    color: "#2EFF7A",
    textShadow: "0 0 16px rgba(46,255,122,0.35)",
    fontWeight: 900,
  },
  points: { color: "#FFD166", textShadow: "0 0 16px rgba(255,209,102,0.25)", fontWeight: 900 },

  ctaRow: { display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "linear-gradient(135deg, #2EFF7A, #22D3EE)",
    color: "#070A12",
    fontWeight: 950,
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.22)",
    color: "rgba(234,240,247,0.95)",
    fontWeight: 850,
    cursor: "pointer",
  },
  microNote: { marginTop: 10, fontSize: 12, opacity: 0.7 },

  statCard: {
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.24)",
  },
  statLabel: { fontSize: 12, opacity: 0.75, letterSpacing: "0.06em", textTransform: "uppercase" },
  statValue: { fontSize: 26, fontWeight: 950, marginTop: 6 },
  statSub: { fontSize: 12, opacity: 0.65, marginTop: 2 },

  grid: {
    marginTop: 14,
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 0.9fr",
    gap: 14,
  },

  panel: {
    padding: "14px 14px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.02)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    minWidth: 0,
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  h2: { margin: 0, fontSize: 16, letterSpacing: "-0.01em" },

  badgeNeon: {
    fontSize: 11,
    letterSpacing: "0.10em",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(46,255,122,0.35)",
    background: "rgba(46,255,122,0.12)",
    color: "#2EFF7A",
    fontWeight: 900,
  },
  badgeGold: {
    fontSize: 11,
    letterSpacing: "0.10em",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,209,102,0.35)",
    background: "rgba(255,209,102,0.12)",
    color: "#FFD166",
    fontWeight: 900,
  },
  badgeCyan: {
    fontSize: 11,
    letterSpacing: "0.10em",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(34,211,238,0.35)",
    background: "rgba(34,211,238,0.12)",
    color: "#22D3EE",
    fontWeight: 900,
  },
  badgeHot: {
    fontSize: 11,
    letterSpacing: "0.10em",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,77,255,0.35)",
    background: "rgba(255,77,255,0.10)",
    color: "#FF4DFF",
    fontWeight: 900,
  },

  // Moment panel
  momentCard: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.22)",
    padding: 12,
    boxShadow: "0 0 22px rgba(46,255,122,0.08)",
  },
  momentTitle: { fontWeight: 950, marginBottom: 6, letterSpacing: "0.1px" },
  momentText: { lineHeight: 1.5, opacity: 0.92 },
  momentMeta: { marginTop: 8, fontSize: 12, opacity: 0.7 },
  momentList: { marginTop: 12, display: "flex", flexDirection: "column", gap: 8 },
  momentRow: {
    display: "grid",
    gridTemplateColumns: "90px 1fr 60px",
    gap: 10,
    alignItems: "center",
    padding: "10px 10px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
  },
  momentWho: { fontWeight: 900 },
  momentWhat: { fontSize: 13, opacity: 0.85 },
  momentPts: { textAlign: "right", fontWeight: 950, color: "#FFD166" },

  // Wheel
  wheelWrap: { display: "grid", gap: 12, justifyItems: "center" },
  wheelOuter: {
    width: 220,
    height: 220,
    borderRadius: 999,
    background:
      "conic-gradient(from 90deg, #2EFF7A, #22D3EE, #FFD166, #FF4DFF, #4F8CFF, #2EFF7A)",
    boxShadow: "0 0 40px rgba(34,211,238,0.12), 0 0 30px rgba(46,255,122,0.12)",
    padding: 10,
  },
  wheelInner: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    background: "rgba(7,10,18,0.92)",
    border: "1px solid rgba(255,255,255,0.10)",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
  },
  wheelLabel: { fontWeight: 950, letterSpacing: "0.18em", fontSize: 14 },
  wheelSub: { marginTop: 4, fontSize: 12, opacity: 0.7 },
  wheelLegend: { width: "100%", display: "grid", gap: 8 },
  legendRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 10px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    fontSize: 13,
    opacity: 0.9,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    boxShadow: "0 0 14px rgba(255,255,255,0.15)",
  },

  // Leaderboard
  leaderboard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    overflow: "hidden",
    background: "rgba(0,0,0,0.20)",
  },
  leaderRow: {
    display: "grid",
    gridTemplateColumns: "44px 1fr auto",
    gap: 10,
    alignItems: "center",
    padding: "12px 14px",
  },
  rankPuck: {
    width: 28,
    height: 28,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,209,102,0.14)",
    border: "1px solid rgba(255,209,102,0.35)",
    color: "#FFD166",
    fontWeight: 950,
    fontSize: 12,
    boxShadow: "0 0 18px rgba(255,209,102,0.15)",
  },
  leaderName: { fontWeight: 950, letterSpacing: "0.1px" },
  leaderPoints: { fontWeight: 900, opacity: 0.9 },

  // Categories
  categoryGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 12,
  },
  catCard: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.20)",
    padding: "12px 12px",
  },
  catTitle: { fontWeight: 950, marginBottom: 6 },
  catMeta: { fontSize: 12, opacity: 0.72 },

  // How it works
  howGrid: {
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  howCard: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.20)",
    padding: "12px 12px",
  },
  howTitle: { fontWeight: 950, marginBottom: 6 },
  howText: { fontSize: 13, opacity: 0.82, lineHeight: 1.5 },

  playbookNote: { lineHeight: 1.6, opacity: 0.9 },

  subNote: { marginTop: 10, fontSize: 12, opacity: 0.7 },

  footer: {
    marginTop: 14,
    opacity: 0.65,
    fontSize: 12,
    textAlign: "center",
  },
};
