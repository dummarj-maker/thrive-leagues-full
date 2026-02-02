import React from "react";

const team = {
  name: "Tempe Thorns",
  owner: "Jesse Dummar",
};

const scores = [
  { name: "Tempe Thorns", record: "0-0-12" },
  { name: "Shanghai ...", record: "0-0-12" },
  { name: "Paris ...", record: "0-0-12" },
  { name: "Missoula ...", record: "0-0-12" },
  { name: "San Juan ...", record: "0-0-12" },
];

const matchups = [
  { user: "Mom", cats: ["Fitness", "Nutrition", "Mental Health", "Responsible Behavior"] },
  { user: "Callan", cats: ["Knowledge", "Household", "Kindness", "Adventure"] },
  { user: "Chase", cats: ["Fitness", "Self-Discipline", "Organization", "Resilience"] },
];

const leaderboard = [
  { name: "Dad", points: 62 },
  { name: "Mom", points: 60 },
  { name: "Cam", points: 41 },
  { name: "Chase", points: 39 },
  { name: "Callan", points: 25 },
];

function Card({ title, right, children }) {
  return (
    <section className="card">
      <div className="cardHeader">
        <h3 className="cardTitle">{title}</h3>
        {right ? <div className="cardRight">{right}</div> : null}
      </div>
      <div className="cardBody">{children}</div>
    </section>
  );
}

function Pill({ children }) {
  return <span className="pill">{children}</span>;
}

export default function Home() {
  return (
    <main className="grid">
      {/* LEFT COLUMN */}
      <aside className="col left">
        <Card title="My Team" right={<button className="iconBtn" title="Settings">⚙️</button>}>
          <div className="teamBox">
            <div className="teamLogo">🌵</div>
            <div className="teamMeta">
              <div className="teamName">{team.name}</div>
              <div className="teamOwner">{team.owner}</div>
            </div>
          </div>
          <button className="btnGhost" type="button">View Roster</button>
        </Card>

        <Card title="Scores" right={<a className="link" href="#">View Full</a>}>
          <ul className="list">
            {scores.map((s) => (
              <li key={s.name} className="row">
                <span className="rowLeft">
                  <span className="dot" />
                  <span className="truncate">{s.name}</span>
                </span>
                <span className="mono">{s.record}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Quick Links">
          <div className="quickLinks">
            <a className="quickLink" href="#">Rules</a>
            <a className="quickLink" href="#">FAQs</a>
            <a className="quickLink" href="#">Settings</a>
            <a className="quickLink" href="#">Fantasy Home</a>
          </div>
        </Card>
      </aside>

      {/* CENTER COLUMN */}
      <section className="col center">
        <Card title="Thrive Moment of the Day" right={<Pill>+5 pts</Pill>}>
          <div className="moment">
            <div className="momentTitle">Callan earned 5 points</div>
            <div className="momentBody">for helping his brother with homework 🎒📚</div>
          </div>
        </Card>

        <Card title="Thrive Wheel" right={<a className="link" href="#">View Details</a>}>
          <div className="wheelWrap">
            <div className="wheel">
              <div className="wheelCenter">Thrive</div>
            </div>
            <div className="wheelLegend">
              <div className="legendTitle">Bonus Points</div>
              <div className="legendRow"><span className="swatch s1" /> Fitness</div>
              <div className="legendRow"><span className="swatch s2" /> Household</div>
              <div className="legendRow"><span className="swatch s3" /> Knowledge</div>
              <div className="legendRow"><span className="swatch s4" /> Kindness</div>
              <div className="legendRow"><span className="swatch s5" /> Organization</div>
            </div>
          </div>
        </Card>

        <Card title="Season Hub">
          <div className="seasonGrid">
            <div className="seasonTile">
              <div className="tileKicker">Today</div>
              <div className="tileTitle">Daily Challenges</div>
              <div className="tileSub">Draft your tasks • Track points</div>
            </div>
            <div className="seasonTile">
              <div className="tileKicker">This Week</div>
              <div className="tileTitle">Matchups</div>
              <div className="tileSub">Head-to-head categories</div>
            </div>
            <div className="seasonTile">
              <div className="tileKicker">This Season</div>
              <div className="tileTitle">Achievements</div>
              <div className="tileSub">Badges • Milestones</div>
            </div>
          </div>
        </Card>
      </section>

      {/* RIGHT COLUMN */}
      <aside className="col right">
        <Card title="Current Matchups" right={<a className="link" href="#">All</a>}>
          <div className="matchups">
            {matchups.map((m) => (
              <div key={m.user} className="matchup">
                <div className="matchupTop">
                  <span className="avatar">{m.user.slice(0, 1)}</span>
                  <div className="matchupName">{m.user}</div>
                </div>
                <div className="chips">
                  {m.cats.map((c) => (
                    <span key={c} className="chip">{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Season Leaderboard" right={<a className="link" href="#">Full</a>}>
          <ol className="leaderboard">
            {leaderboard.map((p, idx) => (
              <li key={p.name} className="row">
                <span className="rowLeft">
                  <span className="rank">{String(idx + 1).padStart(2, "0")}</span>
                  <span className="truncate">{p.name}</span>
                </span>
                <span className="pillScore">{p.points}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card title="Commissioner Tools">
          <div className="tools">
            <button className="btnGhost" type="button">Manage Categories</button>
            <button className="btnGhost" type="button">Edit Scoring</button>
            <button className="btnGhost" type="button">Create Challenge</button>
          </div>
        </Card>
      </aside>
    </main>
  );
}
