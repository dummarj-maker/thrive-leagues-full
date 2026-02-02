export default function Home() {
  const team = [
    { name: "Dad", meta: "Fitness • Nutrition • Household", points: 62 },
    { name: "Mom", meta: "Mental Health • Kindness • Family", points: 60 },
    { name: "Cam", meta: "Knowledge • Responsibility", points: 41 },
    { name: "Chase", meta: "Fitness • Self-Discipline", points: 39 },
    { name: "Callan", meta: "Creativity • Kindness", points: 25 },
  ];

  const matchups = [
    { a: "Mom", b: "Callan", note: "Fitness & Nutrition" },
    { a: "Chase", b: "Cam", note: "Household + Responsibility" },
    { a: "Dad", b: "Bye", note: "Bonus Builder" },
  ];

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <div className="brandMark" />
          <div className="brandText">
            <div className="title">Thrive Leagues</div>
            <div className="subtitle">Home • Playbook • Tools • Achievements</div>
          </div>
        </div>

        <div className="nav">
          <a className="chip" href="#">Home</a>
          <a className="chip" href="#">Playbook</a>
          <a className="chip" href="#">Commissioner Tools</a>
          <a className="chip" href="#">Achievements</a>
          <a className="chip" href="#">Badges</a>
        </div>
      </div>

      <div className="viewport">
        <div className="grid">
          {/* LEFT SIDEBAR */}
          <div className="leftCol">
            <div className="card">
              <div className="cardHeader">
                <h3>Current Matchups</h3>
                <span className="badge">Week 1</span>
              </div>
              <div className="cardBody">
                <div className="list">
                  {matchups.map((m, idx) => (
                    <div className="row" key={idx}>
                      <div className="left">
                        <div className="name">{m.a} vs {m.b}</div>
                        <div className="meta">{m.note}</div>
                      </div>
                      <div className="badge">Live</div>
                    </div>
                  ))}
                </div>

                <div className="footerHint">
                  Tip: On phones, you can pinch-zoom and/or swipe sideways to see everything comfortably.
                </div>
              </div>
            </div>

            <div style={{ height: 14 }} />

            <div className="card">
              <div className="cardHeader">
                <h3>Quick Links</h3>
                <span className="badge">Shortcuts</span>
              </div>
              <div className="cardBody">
                <div className="list">
                  <div className="row"><div className="name">Rules</div><div className="badge">Open</div></div>
                  <div className="row"><div className="name">Challenges</div><div className="badge">Open</div></div>
                  <div className="row"><div className="name">Family Settings</div><div className="badge">Open</div></div>
                  <div className="row"><div className="name">Categories</div><div className="badge">Open</div></div>
                </div>
              </div>
            </div>
          </div>

          {/* CENTER */}
          <div className="centerCol">
            <div className="centerTop">
              <div className="bigCard">
                <h2 className="bigTitle">Thrive Wheel</h2>
                <p className="bigSub">
                  A quick snapshot of where your family is earning points this week.
                </p>

                <div className="wheelWrap">
                  <div className="wheel">
                    <div className="wheelLabel">Thrive</div>
                  </div>
                </div>
              </div>

              <div className="bigCard">
                <h2 className="bigTitle">Thrive Moment</h2>
                <p className="bigSub">A highlight worth celebrating today.</p>

                <div style={{ height: 12 }} />

                <div className="moment">
                  <strong>Camden</strong> earned <strong>5 points</strong> by helping his brother with homework.
                  <div style={{ height: 10 }} />
                  Next: log a follow-up challenge in <strong>Knowledge & Learning</strong> or
                  <strong> Kindness & Empathy</strong>.
                </div>
              </div>
            </div>

            <div className="card">
              <div className="cardHeader">
                <h3>Season Snapshot</h3>
                <span className="badge">2026</span>
              </div>
              <div className="cardBody">
                <div className="rightNote">
                  This middle section is where your “big visual” content goes (like the ESPN-style center panel):
                  featured badges, a rotating banner, weekly theme, or the Playbook spotlight.
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="rightCol">
            <div className="card">
              <div className="cardHeader">
                <h3>Season Leaderboard</h3>
                <span className="badge">Points</span>
              </div>
              <div className="cardBody">
                <div className="list">
                  {team.map((p) => (
                    <div className="row" key={p.name}>
                      <div className="left">
                        <div className="name">{p.name}</div>
                        <div className="meta">{p.meta}</div>
                      </div>
                      <div className="points">{p.points}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ height: 14 }} />

            <div className="card">
              <div className="cardHeader">
                <h3>Commissioner Note</h3>
                <span className="badge">Pinned</span>
              </div>
              <div className="cardBody">
                <div className="rightNote">
                  Keep this for announcements: weekly scoring tweaks, swap rules, reminders, or the “theme of the week.”
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
}
