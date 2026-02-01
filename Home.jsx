import React, { useMemo, useState } from "react";

/**
 * Thrive Leagues - Home.jsx
 * Single-file "brick" homepage:
 * - 3-column dashboard (matches your sketch)
 * - Zoom controls (ESPN-style zoom out)
 * - Density toggle (Compact vs Comfortable)
 * - Placeholder data you can later wire to real data
 */

export default function Home() {
  // App-level zoom (not browser zoom). This gives you an ESPN-like "fit more on screen" feel.
  const [uiScale, setUiScale] = useState(0.92); // start slightly zoomed out
  const [density, setDensity] = useState("compact"); // "compact" | "comfortable"

  // Demo data (replace later)
  const family = useMemo(
    () => [
      { name: "Dad", points: 62, role: "System Builder" },
      { name: "Mom", points: 60, role: "Commissioner" },
      { name: "Cam", points: 41, role: "Challenger" },
      { name: "Chase", points: 39, role: "Challenger" },
      { name: "Callan", points: 25, role: "Rookie" },
    ],
    []
  );

  const matchups = useMemo(
    () => [
      {
        title: "Mom vs Callan",
        lines: ["Fitness & Health", "Nutrition", "Mental Health & Well-being"],
        status: "Live",
      },
      {
        title: "Chase vs Cam",
        lines: ["Knowledge & Learning", "Household Responsibilities", "Responsible Behavior"],
        status: "Live",
      },
      {
        title: "Dad Bye",
        lines: ["(No matchup this week)"],
        status: "Idle",
      },
    ],
    []
  );

  const moment = useMemo(
    () => ({
      title: "Thrive Moment of the Day",
      body:
        "Callan earned 5 points by helping his brother with homework. " +
        "This is exactly the kind of family momentum Thrive is designed to create.",
      tag: "Kindness & Empathy",
    }),
    []
  );

  // Simple “wheel” categories (visual placeholder)
  const wheelSlices = useMemo(
    () => [
      "Fitness",
      "Nutrition",
      "Household",
      "Learning",
      "Mindfulness",
      "Family",
      "Discipline",
      "Kindness",
    ],
    []
  );

  const isCompact = density === "compact";

  // Scale math:
  // We scale the whole dashboard visually using transform: scale().
  // To avoid it becoming “smaller but leaving extra whitespace”, we also expand width by inverse scale.
  // Example: scale 0.9 => width ~ 111% so it fills the viewport nicely.
  const inverseScalePct = `${Math.round((1 / uiScale) * 100)}%`;

  return (
    <div className="thrive-page">
      <style>{css}</style>

      {/* Top bar */}
      <header className="topbar">
        <div className="brand">
          <div className="logoDot" />
          <div>
            <div className="brandTitle">Thrive Leagues</div>
            <div className="brandSub">Stage 2 • Brick-by-brick build</div>
          </div>
        </div>

        <nav className="topnav">
          <a className="navLink active" href="#">
            Home
          </a>
          <a className="navLink" href="#">
            Playbook
          </a>
          <a className="navLink" href="#">
            Commissioner Tools
          </a>
          <a className="navLink" href="#">
            Achievements
          </a>
          <a className="navLink" href="#">
            Badges
          </a>
        </nav>

        {/* Controls: Zoom + Density */}
        <div className="controls">
          <div className="controlBlock">
            <div className="controlLabel">Density</div>
            <div className="segmented">
              <button
                className={`segBtn ${density === "compact" ? "segActive" : ""}`}
                onClick={() => setDensity("compact")}
              >
                Compact
              </button>
              <button
                className={`segBtn ${density === "comfortable" ? "segActive" : ""}`}
                onClick={() => setDensity("comfortable")}
              >
                Comfortable
              </button>
            </div>
          </div>

          <div className="controlBlock">
            <div className="controlLabel">Zoom</div>
            <div className="zoomRow">
              <button
                className="iconBtn"
                onClick={() => setUiScale((s) => clamp(round2(s - 0.05), 0.75, 1.25))}
                aria-label="Zoom out"
                title="Zoom out"
              >
                −
              </button>

              <input
                className="slider"
                type="range"
                min="0.75"
                max="1.25"
                step="0.01"
                value={uiScale}
                onChange={(e) => setUiScale(Number(e.target.value))}
                aria-label="Zoom slider"
              />

              <button
                className="iconBtn"
                onClick={() => setUiScale((s) => clamp(round2(s + 0.05), 0.75, 1.25))}
                aria-label="Zoom in"
                title="Zoom in"
              >
                +
              </button>

              <div className="zoomPct">{Math.round(uiScale * 100)}%</div>
              <button className="ghostBtn" onClick={() => setUiScale(0.92)}>
                Reset
              </button>
            </div>

            <div className="hint">
              Tip: You can still use browser zoom too (Ctrl + / Ctrl −). This slider is “app zoom”.
            </div>
          </div>
        </div>
      </header>

      {/* Scaled content wrapper */}
      <main
        className={`contentWrap ${isCompact ? "compact" : "comfortable"}`}
        style={{
          transform: `scale(${uiScale})`,
          width: inverseScalePct,
          transformOrigin: "top left",
        }}
      >
        <div className="grid">
          {/* LEFT COLUMN */}
          <section className="col left">
            <Card title="My Family" rightSlot={<span className="pill">Season 1</span>}>
              <div className="stack">
                {family.map((p) => (
                  <div className="row" key={p.name}>
                    <div className="avatar">{p.name.slice(0, 1)}</div>
                    <div className="rowMain">
                      <div className="rowTitle">{p.name}</div>
                      <div className="rowSub">{p.role}</div>
                    </div>
                    <div className="score">
                      <span className="scoreNum">{p.points}</span>
                      <span className="scoreLbl">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Quick Links">
              <div className="links">
                <button className="linkBtn">Rules</button>
                <button className="linkBtn">FAQs</button>
                <button className="linkBtn">Settings</button>
                <button className="linkBtn">Draft Board</button>
              </div>
            </Card>
          </section>

          {/* CENTER COLUMN */}
          <section className="col center">
            <Card title="Thrive Wheel" rightSlot={<span className="pill success">Bonus Points!</span>}>
              <div className="wheelArea">
                <div className="wheelWrap">
                  <Wheel labels={wheelSlices} />
                </div>

                <div className="wheelNotes">
                  <div className="bigTitle">Thrive Wheel</div>
                  <div className="muted">
                    This is your category engine. Eventually: click a slice → see challenges →
                    log points → update standings.
                  </div>
                  <div className="miniStats">
                    <MiniStat label="Active Players" value={family.length} />
                    <MiniStat label="Open Matchups" value={2} />
                    <MiniStat label="Today’s Bonus" value="+5" />
                  </div>
                </div>
              </div>
            </Card>

            <Card title={moment.title} rightSlot={<span className="pill">{moment.tag}</span>}>
              <div className="moment">
                <div className="momentBody">{moment.body}</div>
                <div className="momentActions">
                  <button className="primaryBtn">Log This</button>
                  <button className="ghostBtn">View Feed</button>
                </div>
              </div>
            </Card>
          </section>

          {/* RIGHT COLUMN */}
          <section className="col right">
            <Card title="Current Matchups" rightSlot={<span className="pill">Week 1</span>}>
              <div className="stack">
                {matchups.map((m) => (
                  <div className="matchup" key={m.title}>
                    <div className="matchupTop">
                      <div className="matchupTitle">{m.title}</div>
                      <span className={`status ${m.status === "Live" ? "live" : "idle"}`}>
                        {m.status}
                      </span>
                    </div>
                    <ul className="matchupList">
                      {m.lines.map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                    </ul>
                    <div className="matchupActions">
                      <button className="ghostBtn">Open</button>
                      <button className="ghostBtn">Compare</button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Season Leaderboard">
              <div className="table">
                <div className="thead">
                  <div>Rank</div>
                  <div>Player</div>
                  <div className="rightAlign">Points</div>
                </div>
                {family
                  .slice()
                  .sort((a, b) => b.points - a.points)
                  .map((p, i) => (
                    <div className="trow" key={p.name}>
                      <div className="muted">{i + 1}</div>
                      <div className="playerCell">
                        <span className="tinyAvatar">{p.name.slice(0, 1)}</span>
                        <span>{p.name}</span>
                      </div>
                      <div className="rightAlign strong">{p.points}</div>
                    </div>
                  ))}
              </div>

              <div className="footerActions">
                <button className="primaryBtn">View Season</button>
                <button className="ghostBtn">View Badges</button>
              </div>
            </Card>
          </section>
        </div>

        <footer className="footer">
          <div className="muted">
            Brick status: <span className="strong">Homepage Layout + Zoom/Density</span> (static demo)
          </div>
          <div className="muted">
            Next brick: wire real data sources + navigation routes (still no auth required).
          </div>
        </footer>
      </main>
    </div>
  );
}

/** Small components */
function Card({ title, rightSlot, children }) {
  return (
    <div className="card">
      <div className="cardTop">
        <div className="cardTitle">{title}</div>
        <div className="cardRight">{rightSlot}</div>
      </div>
      <div className="cardBody">{children}</div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="miniStat">
      <div className="miniVal">{value}</div>
      <div className="miniLbl">{label}</div>
    </div>
  );
}

/**
 * Simple SVG pie wheel (placeholder)
 * Later, you can make slices clickable and map to your 25 categories.
 */
function Wheel({ labels }) {
  const slices = labels.length;
  const radius = 86;
  const cx = 100;
  const cy = 100;

  const paths = labels.map((_, i) => {
    const startAngle = (2 * Math.PI * i) / slices - Math.PI / 2;
    const endAngle = (2 * Math.PI * (i + 1)) / slices - Math.PI / 2;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  });

  return (
    <div className="wheel">
      <svg width="220" height="220" viewBox="0 0 200 200">
        {paths.map((d, i) => (
          <path key={i} d={d} className={`slice s${i % 8}`} />
        ))}
        <circle cx="100" cy="100" r="26" className="hub" />
        <text x="100" y="105" textAnchor="middle" className="hubText">
          Thrive
        </text>
      </svg>

      <div className="wheelLegend">
        {labels.map((l, i) => (
          <div className="legendRow" key={l}>
            <span className={`dot d${i % 8}`} />
            <span>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Helpers */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function round2(n) {
  return Math.round(n * 100) / 100;
}

/** CSS (kept inside this file so you only paste one thing) */
const css = `
  :root{
    --bg: #0b1020;
    --panel: rgba(255,255,255,.06);
    --panel2: rgba(255,255,255,.08);
    --stroke: rgba(255,255,255,.10);
    --text: rgba(255,255,255,.92);
    --muted: rgba(255,255,255,.62);

    --brand1: #ff3b30; /* vibrant red */
    --brand2: #5ac8fa; /* electric blue */
    --brand3: #34c759; /* green pop */

    --radius: 16px;
    --shadow: 0 12px 36px rgba(0,0,0,.35);
  }

  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;background:radial-gradient(1200px 700px at 20% -10%, rgba(255,59,48,.22), transparent 60%),
                                         radial-gradient(900px 600px at 100% 0%, rgba(90,200,250,.18), transparent 55%),
                                         radial-gradient(900px 600px at 60% 120%, rgba(52,199,89,.12), transparent 55%),
                                         var(--bg);
            color:var(--text);
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
  }

  .thrive-page{min-height:100vh;}
  .topbar{
    position:sticky; top:0; z-index:5;
    display:flex; gap:16px; align-items:flex-start; justify-content:space-between;
    padding:14px 16px;
    background: linear-gradient(to bottom, rgba(11,16,32,.92), rgba(11,16,32,.72));
    backdrop-filter: blur(10px);
    border-bottom:1px solid var(--stroke);
  }

  .brand{display:flex; gap:10px; align-items:center; min-width: 220px;}
  .logoDot{
    width:14px;height:14px;border-radius:50%;
    background: radial-gradient(circle at 30% 30%, #fff, rgba(255,255,255,.2) 35%, transparent 60%),
                linear-gradient(135deg, var(--brand1), var(--brand2));
    box-shadow: 0 0 0 4px rgba(255,255,255,.06);
  }
  .brandTitle{font-weight:800; letter-spacing:.2px;}
  .brandSub{font-size:12px;color:var(--muted); margin-top:2px;}

  .topnav{
    display:flex; gap:12px; align-items:center; padding-top:2px;
    flex:1;
  }
  .navLink{
    color: var(--muted);
    text-decoration:none;
    font-weight:650;
    font-size:13px;
    padding:8px 10px;
    border-radius: 999px;
    border:1px solid transparent;
  }
  .navLink:hover{color:var(--text); border-color: var(--stroke); background: rgba(255,255,255,.04);}
  .navLink.active{color:var(--text); background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.12);}

  .controls{
    display:flex; gap:14px; align-items:flex-start; justify-content:flex-end;
    min-width: 520px;
  }
  .controlBlock{display:flex; flex-direction:column; gap:6px;}
  .controlLabel{font-size:12px; color:var(--muted); font-weight:700;}

  .segmented{
    display:flex; gap:0;
    border:1px solid var(--stroke);
    border-radius: 999px;
    overflow:hidden;
    background: rgba(255,255,255,.04);
  }
  .segBtn{
    border:0; background:transparent; color:var(--muted);
    padding:8px 12px; font-weight:750; font-size:12px;
    cursor:pointer;
  }
  .segBtn:hover{color:var(--text); background: rgba(255,255,255,.05);}
  .segActive{
    color:#0b1020;
    background: linear-gradient(135deg, var(--brand2), rgba(255,255,255,.85));
  }

  .zoomRow{display:flex; gap:10px; align-items:center;}
  .slider{width:160px;}
  .zoomPct{font-size:12px; color:var(--muted); width:46px; text-align:right;}
  .hint{font-size:11px; color:rgba(255,255,255,.50); max-width: 320px;}

  .iconBtn{
    width:32px; height:32px; border-radius:10px;
    border:1px solid var(--stroke);
    background: rgba(255,255,255,.04);
    color: var(--text);
    cursor:pointer;
    font-size:18px;
    display:flex; align-items:center; justify-content:center;
  }
  .iconBtn:hover{background: rgba(255,255,255,.07);}

  .ghostBtn{
    border:1px solid var(--stroke);
    background: rgba(255,255,255,.04);
    color: var(--text);
    padding:8px 10px;
    border-radius: 12px;
    cursor:pointer;
    font-weight:700;
    font-size:12px;
  }
  .ghostBtn:hover{background: rgba(255,255,255,.07);}

  .primaryBtn{
    border:1px solid rgba(255,255,255,.10);
    background: linear-gradient(135deg, var(--brand1), var(--brand2));
    color: #0b1020;
    padding:10px 12px;
    border-radius: 12px;
    cursor:pointer;
    font-weight:900;
    font-size:12px;
    box-shadow: 0 10px 24px rgba(255,59,48,.18);
  }
  .primaryBtn:hover{filter: brightness(1.05);}

  .contentWrap{
    padding: 18px 16px 28px;
  }

  .grid{
    display:grid;
    grid-template-columns: 300px minmax(520px, 1fr) 320px;
    gap: 14px;
    align-items:start;
  }

  /* Density modes */
  .contentWrap.compact .cardBody{padding: 12px;}
  .contentWrap.compact .cardTitle{font-size: 13px;}
  .contentWrap.compact .rowTitle{font-size: 13px;}
  .contentWrap.compact .rowSub{font-size: 11px;}
  .contentWrap.compact .momentBody{font-size: 13px; line-height: 1.35;}
  .contentWrap.compact .matchupList{font-size: 12px;}

  .contentWrap.comfortable .cardBody{padding: 16px;}
  .contentWrap.comfortable .cardTitle{font-size: 14px;}
  .contentWrap.comfortable .momentBody{font-size: 14px; line-height: 1.5;}

  @media (max-width: 1100px){
    .grid{grid-template-columns: 1fr; }
    .controls{min-width:auto; flex-wrap:wrap;}
    .topnav{display:none;}
  }

  .card{
    background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.05));
    border:1px solid rgba(255,255,255,.10);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow:hidden;
  }
  .cardTop{
    display:flex; justify-content:space-between; align-items:center;
    padding: 12px 12px 10px;
    border-bottom:1px solid rgba(255,255,255,.08);
  }
  .cardTitle{font-weight:900;}
  .cardBody{padding: 14px;}
  .pill{
    font-size: 11px;
    padding: 5px 8px;
    border-radius: 999px;
    border:1px solid rgba(255,255,255,.12);
    color: rgba(255,255,255,.78);
    background: rgba(255,255,255,.04);
    font-weight:800;
  }
  .pill.success{
    border-color: rgba(52,199,89,.30);
    color: rgba(210,255,225,.92);
    background: rgba(52,199,89,.10);
  }

  .stack{display:flex; flex-direction:column; gap:10px;}

  .row{
    display:flex; align-items:center; justify-content:space-between;
    gap:10px;
    padding: 10px;
    border-radius: 14px;
    background: rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.08);
  }
  .avatar{
    width:34px; height:34px; border-radius: 12px;
    background: linear-gradient(135deg, rgba(255,59,48,.55), rgba(90,200,250,.45));
    border:1px solid rgba(255,255,255,.10);
    display:flex; align-items:center; justify-content:center;
    font-weight:900;
  }
  .rowMain{flex:1; min-width:0;}
  .rowTitle{font-weight:900;}
  .rowSub{color:var(--muted); margin-top:2px;}
  .score{display:flex; gap:6px; align-items:baseline;}
  .scoreNum{font-weight:950; font-size:16px;}
  .scoreLbl{font-size:11px; color:var(--muted); font-weight:800;}

  .links{display:grid; grid-template-columns:1fr 1fr; gap:10px;}
  .linkBtn{
    text-align:left;
    padding:10px 12px;
    border-radius: 14px;
    border:1px solid rgba(255,255,255,.10);
    background: rgba(255,255,255,.04);
    color: var(--text);
    font-weight:850;
    cursor:pointer;
  }
  .linkBtn:hover{background: rgba(255,255,255,.07);}

  .wheelArea{
    display:grid;
    grid-template-columns: 320px 1fr;
    gap: 14px;
    align-items:center;
  }
  @media (max-width: 1100px){
    .wheelArea{grid-template-columns: 1fr;}
  }

  .wheelWrap{
    padding: 12px;
    border-radius: 16px;
    background: rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.08);
  }
  .bigTitle{font-weight:950; font-size:18px;}
  .muted{color:var(--muted);}
  .strong{color:var(--text); font-weight:900;}
  .miniStats{display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;}
  .miniStat{
    padding:10px 12px;
    border-radius: 14px;
    border:1px solid rgba(255,255,255,.10);
    background: rgba(255,255,255,.04);
    min-width: 120px;
  }
  .miniVal{font-weight:950; font-size:16px;}
  .miniLbl{color:var(--muted); font-size:11px; margin-top:2px; font-weight:800;}

  .momentBody{color:rgba(255,255,255,.86);}
  .momentActions{display:flex; gap:10px; margin-top:12px;}

  .matchup{
    padding:12px;
    border-radius: 16px;
    background: rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.10);
  }
  .matchupTop{display:flex; align-items:center; justify-content:space-between; gap:10px;}
  .matchupTitle{font-weight:950;}
  .status{
    font-size: 11px;
    font-weight:900;
    padding: 5px 8px;
    border-radius: 999px;
    border:1px solid rgba(255,255,255,.14);
    background: rgba(255,255,255,.04);
    color: rgba(255,255,255,.75);
  }
  .status.live{
    border-color: rgba(255,59,48,.28);
    background: rgba(255,59,48,.10);
    color: rgba(255,220,220,.92);
  }
  .status.idle{
    border-color: rgba(255,255,255,.12);
    background: rgba(255,255,255,.03);
    color: rgba(255,255,255,.62);
  }
  .matchupList{margin:10px 0 0; padding-left:18px; color: rgba(255,255,255,.80);}
  .matchupActions{display:flex; gap:10px; margin-top:10px;}

  .table{display:flex; flex-direction:column; gap:8px;}
  .thead{
    display:grid;
    grid-template-columns: 60px 1fr 80px;
    color: var(--muted);
    font-weight:900;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing:.6px;
  }
  .trow{
    display:grid;
    grid-template-columns: 60px 1fr 80px;
    gap:10px;
    padding: 10px;
    border-radius: 14px;
    background: rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.08);
    align-items:center;
  }
  .playerCell{display:flex; gap:10px; align-items:center; font-weight:900;}
  .tinyAvatar{
    width:26px;height:26px;border-radius: 10px;
    display:flex; align-items:center; justify-content:center;
    background: rgba(255,255,255,.08);
    border:1px solid rgba(255,255,255,.12);
  }
  .rightAlign{text-align:right;}
  .footerActions{display:flex; gap:10px; margin-top:12px;}

  .footer{
    margin-top: 14px;
    display:flex;
    justify-content:space-between;
    gap:14px;
    padding: 12px 6px 0;
    border-top: 1px solid rgba(255,255,255,.08);
    flex-wrap:wrap;
  }

  /* Wheel colors (8) */
  .slice{stroke: rgba(255,255,255,.12); stroke-width: 1;}
  .s0{fill: rgba(255,59,48,.42);}
  .s1{fill: rgba(90,200,250,.40);}
  .s2{fill: rgba(52,199,89,.34);}
  .s3{fill: rgba(255,214,10,.26);}
  .s4{fill: rgba(175,82,222,.28);}
  .s5{fill: rgba(255,149,0,.26);}
  .s6{fill: rgba(64,156,255,.26);}
  .s7{fill: rgba(255,45,85,.26);}

  .hub{fill: rgba(255,255,255,.08); stroke: rgba(255,255,255,.14); stroke-width:1;}
  .hubText{fill: rgba(255,255,255,.86); font-size: 10px; font-weight: 900; letter-spacing:.4px;}

  .wheel{display:grid; grid-template-columns: 220px 1fr; gap: 12px; align-items:center;}
  .wheelLegend{display:flex; flex-direction:column; gap:8px; font-size:12px; color: rgba(255,255,255,.82);}
  .legendRow{display:flex; gap:10px; align-items:center;}
  .dot{width:10px;height:10px;border-radius:3px; display:inline-block;}
  .d0{background: rgba(255,59,48,.85);}
  .d1{background: rgba(90,200,250,.85);}
  .d2{background: rgba(52,199,89,.85);}
  .d3{background: rgba(255,214,10,.85);}
  .d4{background: rgba(175,82,222,.85);}
  .d5{background: rgba(255,149,0,.85);}
  .d6{background: rgba(64,156,255,.85);}
  .d7{background: rgba(255,45,85,.85);}
`;

