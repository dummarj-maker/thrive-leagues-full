import React from "react";

export default function Home() {
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>Thrive Leagues</div>
        <nav style={styles.nav}>
          <a href="#" style={styles.navLink}>How it works</a>
          <a href="#" style={styles.navLink}>Categories</a>
          <a href="#" style={styles.navLink}>About</a>
        </nav>
      </header>

      <main style={styles.main}>
        <section style={styles.hero}>
          <h1 style={styles.h1}>A family system for building real-life momentum.</h1>
          <p style={styles.lede}>
            Draft life categories. Complete challenges. Track points. Build habits — brick by brick.
          </p>

          <div style={styles.heroRow}>
            <div style={styles.heroCard}>
              <div style={styles.cardTitle}>System first</div>
              <div style={styles.cardText}>
                The constitution governs incentives, fairness, and accountability.
              </div>
            </div>
            <div style={styles.heroCard}>
              <div style={styles.cardTitle}>Brick by brick</div>
              <div style={styles.cardText}>
                Small, complete slices — frozen when approved.
              </div>
            </div>
            <div style={styles.heroCard}>
              <div style={styles.cardTitle}>Comprehensible</div>
              <div style={styles.cardText}>
                Every step stays readable to the system builder.
              </div>
            </div>
          </div>

          <div style={styles.ctaRow}>
            <button style={styles.primaryBtn} type="button">
              Start here
            </button>
            <button style={styles.secondaryBtn} type="button">
              View the playbook
            </button>
          </div>

          <div style={styles.note}>
            (Buttons are visual only for now — no login, no actions yet.)
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>How it works</h2>
          <div style={styles.grid2}>
            <div style={styles.panel}>
              <div style={styles.panelTitle}>1) Draft categories</div>
              <div style={styles.panelText}>
                Choose what matters this season: Fitness, Family, Knowledge, Household, and more.
              </div>
            </div>
            <div style={styles.panel}>
              <div style={styles.panelTitle}>2) Run challenges</div>
              <div style={styles.panelText}>
                Weekly and seasonal challenges create structure without micromanaging.
              </div>
            </div>
            <div style={styles.panel}>
              <div style={styles.panelTitle}>3) Score honestly</div>
              <div style={styles.panelText}>
                Clear rules remove loopholes and keep incentives fair.
              </div>
            </div>
            <div style={styles.panel}>
              <div style={styles.panelTitle}>4) Review & improve</div>
              <div style={styles.panelText}>
                Track what worked, then refine the system — not the vibes.
              </div>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.h2}>Categories (v1)</h2>
          <div style={styles.pills}>
            {[
              "Fitness & Health",
              "Nutrition",
              "Household Responsibilities",
              "Knowledge & Learning",
              "Career & Skill Development",
              "Spiritual & Personal Growth",
              "Mental Health & Well-being",
              "Creativity & Hobbies",
              "Social & Relationships",
              "Community & Service",
              "Financial Responsibility",
              "Time Management",
            ].map((label) => (
              <span key={label} style={styles.pill}>
                {label}
              </span>
            ))}
          </div>
          <div style={styles.subNote}>
            (We’ll wire the full 25-category list next — this is a layout placeholder.)
          </div>
        </section>

        <section style={styles.footer}>
          <div style={styles.footerLine}>
            Thrive Leagues is a system first, app second.
          </div>
          <div style={styles.footerSmall}>
            v0.0.1 — static mock (no auth, no data, no payments)
          </div>
        </section>
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0f14",
    color: "#eaf0f7",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 22px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    position: "sticky",
    top: 0,
    background: "rgba(11,15,20,0.9)",
    backdropFilter: "blur(8px)",
  },
  brand: { fontWeight: 800, letterSpacing: "0.2px" },
  nav: { display: "flex", gap: 14 },
  navLink: {
    color: "rgba(234,240,247,0.85)",
    textDecoration: "none",
    fontSize: 13,
  },
  main: { maxWidth: 980, margin: "0 auto", padding: "22px" },
  hero: {
    padding: "34px 22px",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    background: "rgba(255,255,255,0.03)",
  },
  h1: { fontSize: 36, lineHeight: 1.12, margin: 0, letterSpacing: "-0.6px" },
  lede: {
    fontSize: 16,
    color: "rgba(234,240,247,0.85)",
    marginTop: 12,
    marginBottom: 18,
    maxWidth: 720,
  },
  heroRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
    marginTop: 10,
    marginBottom: 18,
  },
  heroCard: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 14,
    padding: 14,
    background: "rgba(0,0,0,0.18)",
  },
  cardTitle: { fontWeight: 700, marginBottom: 6 },
  cardText: { fontSize: 13, color: "rgba(234,240,247,0.8)", lineHeight: 1.45 },
  ctaRow: { display: "flex", gap: 10, marginTop: 10 },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "#eaf0f7",
    color: "#0b0f14",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "transparent",
    color: "#eaf0f7",
    fontWeight: 700,
    cursor: "pointer",
  },
  note: { marginTop: 12, fontSize: 12, color: "rgba(234,240,247,0.65)" },
  section: { marginTop: 18, padding: "4px 4px" },
  h2: { margin: "16px 0 10px 0", fontSize: 18, letterSpacing: "-0.2px" },
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  panel: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 14,
    padding: 14,
    background: "rgba(255,255,255,0.02)",
  },
  panelTitle: { fontWeight: 750, marginBottom: 6 },
  panelText: { fontSize: 13, color: "rgba(234,240,247,0.8)", lineHeight: 1.5 },
  pills: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 },
  pill: {
    fontSize: 12,
    padding: "8px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    color: "rgba(234,240,247,0.9)",
  },
  subNote: { marginTop: 10, fontSize: 12, color: "rgba(234,240,247,0.65)" },
  footer: {
    marginTop: 22,
    padding: "18px 8px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  footerLine: { fontWeight: 700, marginBottom: 6 },
  footerSmall: { fontSize: 12, color: "rgba(234,240,247,0.65)" },
};

