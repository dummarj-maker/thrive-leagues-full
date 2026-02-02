import React from "react";

export default function Home() {
  const family = [
    { name: "Dad", points: 62, role: "System Builder" },
    { name: "Mom", points: 60, role: "Commissioner" },
    { name: "Cam", points: 41, role: "Challenger" },
    { name: "Chase", points: 39, role: "Challenger" },
    { name: "Callan", points: 25, role: "Rookie" },
  ];

  const matchups = [
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
  ];

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="brandDot" />
          <div>
            <div className="brandTitle">Thrive Leagues</div>
            <div className="brandSub">Living Mock • No auth • No data</div>
          </div>
        </div>

        <nav className="nav">
          <a href="#" aria-current="page">Home</a>
          <a href="#playbook">Playbook</a>
          <a href="#tools">Commissioner Tools</a>
          <a href="#achievements">Achievements</a>
          <a href="#badges">Badges</a>
        </nav>

        <div className="seasonPill">
          <span className="pillDot" />
          SEASON 1 • WEEK 1
        </div>
      </header>

      <div className="container">
        <div className="grid">
          {/* LEFT: Family + quick notes */}
          <section className="panel">
            <div className="panelTop">
              <h2 className="panelTitle">My Family</h2>
              <span className="badge cyan">ROSTER</span>
            </div>

            <div className="panelBody">
              <div className="stack">
                {family.map((p) => (
                  <div className="personRow" key={p.name}>
                    <div className="avatar">{p.name.slice(0, 1)}</div>
                    <div>
                      <div className="personName">{p.name}</div>
                      <div className="personRole">{p.role}</div>
                    </div>
                    <div className="points">
                      <span className="pointsNum">{p.points}</span>
                      <span className="pointsLbl">pts</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="subNote" id="tools">
                (Static demo roster. Later: roles + permissions for commissioner tools.)
              </div>
            </div>
          </section>

          {/* CENTER: Wheel + Moment */}
          <section className="panel">
            <div className="panelTop">
              <h2 className="panelTitle">Thrive Wheel</h2>
              <span className="badge green">BONUS</span>
            </div>

            <div className="panelBody">
              <div className="wheelWrap">
                <div className="wheelPanel">
                  <Wheel />
                </div>

                <div className="wheelLegend">
                  <div className="legendRow">
                    <span className="dot g" /> Fitness & Health
                  </div>
                  <div className="legendRow">
                    <span className="dot y" /> Knowledge & Learning
                  </div>
                  <div className="legendRow">
                    <span className="dot c" /> Household Responsibilities
                  </div>
                  <div className="legendRow">
                    <span className="dot p" /> Kindness & Empathy
                  </div>
                  <div className="subNote">
                    (Static wheel placeholder. Next brick: a more accurate wheel + category slicing.)
                  </div>
                </div>
              </div>

              <div style={{ height: 12 }} />

              <div className="momentCard">
                <div className="momentTitle">Thrive Moment of the Day</div>
                <div className="momentText">
                  Callan earned <strong style={{ color: "#FFD166" }}>+5</strong> points by helping his brother
                  with homework. That’s family momentum.
                </div>
                <div className="momentMeta">
                  Category: Knowledge & Learning • Proof: Self-check
                </div>
              </div>

              <div className="subNote" id="playbook">
                Next bricks: wire real challenges → log points → standings update.
              </div>
            </div>
          </section>

          {/* RIGHT: Matchups + Leaderboard */}
          <section className="panel">
            <div className="panelTop">
              <h2 className="panelTitle">Current Matchups</h2>
              <span className="badge pink">LIVE</span>
            </div>

            <div className="panelBody">
              <div className="stack">
                {matchups.map((m) => (
                  <div className="matchupCard" key={m.title}>
                    <div className="matchupTop">
                      <div className="matchupTitle">{m.title}</div>
                      <span className="status live">{m.status}</span>
                    </div>
                    <ul className="matchupList">
                      {m.lines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div style={{ height: 12 }} />

              <div className="panel" style={{ boxShadow: "none" }}>
                <div className="panelTop">
                  <h2 className="panelTitle">Season Leaderboard</h2>
                  <span className="badge gold">RANK</span>
                </div>
                <div className="panelBody">
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
                          <div className="strong">{i + 1}</div>
                          <div className="strong">{p.name}</div>
                          <div className="rightAlign strong">{p.points}</div>
                        </div>
                      ))}
                  </div>

                  <div className="subNote" id="achievements">
                    (Static standings from your sketch. Next brick: achievements + badges panel.)
                  </div>
                </div>
              </div>

              <div className="subNote" id="badges">
                Pinch-to-zoom is available on touch devices; we do not show any zoom UI.
              </div>
            </div>
          </section>
        </div>

        <footer className="footer">
          Thrive Leagues • v0.0.1 • Static Living Mock • No auth • No Supabase
        </footer>
      </div>
    </>
  );
}

/** Simple static SVG wheel */
function Wheel() {
  const slices = [
    { color: "rgba(46,255,122,0.45)" },
    { color: "rgba(34,211,238,0.40)" },
    { color: "rgba(255,209,102,0.28)" },
    { color: "rgba(255,77,255,0.30)" },
  ];

  const radius = 82;
  const cx = 100;
  const cy = 100;

  const paths = slices.map((s, i) => {
    const start = (2 * Math.PI * i) / slices.length - Math.PI / 2;
    const end = (2 * Math.PI * (i + 1)) / slices.length - Math.PI / 2;

    const x1 = cx + radius * Math.cos(start);
    const y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy + radius * Math.sin(end);

    const largeArc = end - start > Math.PI ? 1 : 0;

    return {
      d: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`,
      fill: s.color,
    };
  });

  return (
    <svg width="240" height="240" viewBox="0 0 200 200" aria-label="Thrive Wheel">
      {paths.map((p, idx) => (
        <path
          key={idx}
          d={p.d}
          fill={p.fill}
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1"
        />
      ))}

      <circle
        cx="100"
        cy="100"
        r="28"
        fill="rgba(0,0,0,0.25)"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
      />

      <text
        x="100"
        y="104"
        textAnchor="middle"
        fill="rgba(234,240,247,0.90)"
        fontSize="10"
        fontWeight="900"
        style={{ letterSpacing: "0.4px" }}
      >
        THRIVE
      </text>
    </svg>
  );
}
