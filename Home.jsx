import React from "react";

export default function Home() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Hero */}
        <header style={styles.hero}>
          <div>
            <div style={styles.kicker}>Thrive Leagues (Stage 2)</div>
            <h1 style={styles.h1}>Welcome to Thrive Leagues</h1>
            <p style={styles.p}>
              Brick-by-brick build. System first. App second.
            </p>
          </div>

          <div style={styles.heroActions}>
            <a style={styles.primaryBtn} href="#living-mock">
              View Living Mock
            </a>
            <a style={styles.secondaryBtn} href="#playbook">
              Open Playbook
            </a>
          </div>
        </header>

        {/* Main content */}
        <main style={styles.main} id="living-mock">
          {/* Season Leaderboard (Sketch Brick) */}
          <section style={styles.section}>
            <h2 style={styles.h2}>Season Leaderboard</h2>

            <div style={styles.leaderboard}>
              {[
                { name: "Dad", points: 62 },
                { name: "Mom", points: 60 },
                { name: "Cam", points: 41 },
                { name: "Chase", points: 39 },
                { name: "Collan", points: 25 },
              ].map((row, i) => (
                <div
                  key={row.name}
                  style={{
                    ...styles.leaderRow,
                    borderBottom:
                      i === 4 ? "none" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div style={styles.rank}>{i + 1}</div>
                  <div style={styles.leaderName}>{row.name}</div>
                  <div style={styles.leaderPoints}>{row.points} pts</div>
                </div>
              ))}
            </div>

            <div style={styles.subNote}>
              (Static demo data from your sketch — we’ll wire real scoring later.)
            </div>
          </section>

          {/* Categories (v1) */}
          <section style={styles.section}>
            <h2 style={styles.h2}>Categories (v1)</h2>

            <div style={styles.grid}>
              {[
                "Fitness & Health",
                "Nutrition",
                "Household Responsibilities",
                "Knowledge & Learning",
                "Time Management",
                "Kindness & Empathy",
              ].map((c) => (
                <div key={c} style={styles.card}>
                  <div style={styles.cardTitle}>{c}</div>
                  <div style={styles.cardMeta}>Draftable • Challenge-ready</div>
                </div>
              ))}
            </div>
          </section>

          {/* Playbook (placeholder) */}
          <section style={styles.section} id="playbook">
            <h2 style={styles.h2}>Playbook</h2>
            <div style={styles.note}>
              Next brick: turn your sketch into a dashboard layout (matchups,
              wheel, moment of the day). No auth yet.
            </div>
          </section>
        </main>

        <footer style={styles.footer}>
          <div style={styles.footerText}>
            Thrive Leagues • Living mock • No login required (yet)
          </div>
        </footer>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 700px at 20% 0%, rgba(72, 135, 255, 0.18), transparent 55%), radial-gradient(900px 600px at 90% 10%, rgba(0, 255, 179, 0.10), transparent 55%), #0b0f17",
    color: "rgba(234,240,247,0.95)",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  },
  container: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "28px 18px 40px",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-end",
    padding: "22px 18px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  },
  kicker: {
    display: "inline-block",
    fontSize: 12,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    opacity: 0.8,
    marginBottom: 10,
  },
  h1: {
    fontSize: 34,
    lineHeight: 1.05,
    margin: 0,
    letterSpacing: "-0.02em",
  },
  p: {
    margin: "10px 0 0",
    opacity: 0.85,
    maxWidth: 520,
  },
  heroActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  primaryBtn: {
    textDecoration: "none",
    background: "rgba(72, 135, 255, 0.95)",
    color: "#0b0f17",
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,0.10)",
  },
  secondaryBtn: {
    textDecoration: "none",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(234,240,247,0.95)",
    padding: "10px 14px",
    borderRadius: 12,
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,0.10)",
  },
  main: {
    marginTop: 18,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  section: {
    padding: "18px",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.02)",
  },
  h2: {
    margin: 0,
    fontSize: 18,
    letterSpacing: "-0.01em",
  },
  subNote: {
    marginTop: 10,
    fontSize: 12,
    opacity: 0.75,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginTop: 12,
  },
  card: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.20)",
    padding: "14px",
  },
  cardTitle: {
    fontWeight: 900,
    marginBottom: 6,
  },
  cardMeta: {
    fontSize: 12,
    opacity: 0.75,
  },
  note: {
    marginTop: 12,
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px dashed rgba(255,255,255,0.20)",
    background: "rgba(0,0,0,0.18)",
    opacity: 0.9,
  },

  // Leaderboard styles
  leaderboard: {
    marginTop: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 14,
    overflow: "hidden",
    background: "rgba(255,255,255,0.02)",
  },
  leaderRow: {
    display: "grid",
    gridTemplateColumns: "44px 1fr auto",
    gap: 10,
    alignItems: "center",
    padding: "12px 14px",
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontWeight: 900,
    fontSize: 12,
  },
  leaderName: {
    fontWeight: 900,
    letterSpacing: "0.1px",
  },
  leaderPoints: {
    fontWeight: 900,
    color: "rgba(234,240,247,0.85)",
  },

  footer: {
    marginTop: 18,
    paddingTop: 10,
    opacity: 0.65,
    fontSize: 12,
    textAlign: "center",
  },
  footerText: {},
};
