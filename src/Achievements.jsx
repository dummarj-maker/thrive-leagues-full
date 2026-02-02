import React from "react";

function Card({ title, children, right }) {
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

export default function Achievements() {
  return (
    <div className="pageWrap">
      <Card title="Achievements" right={<span className="pill">Badges inside</span>}>
        <p className="muted" style={{ marginTop: 0 }}>
          Achievements is the parent area. Badges live here (not a separate top tab).
        </p>
      </Card>

      <div className="grid" style={{ gridTemplateColumns: "1fr 420px", marginTop: 14 }}>
        <div className="col">
          <Card title="Milestones">
            <ul className="list">
              <li className="row">
                <span className="rowLeft">
                  <span className="dot" />
                  <span className="truncate">First Week Completed</span>
                </span>
                <span className="mono">+25</span>
              </li>
              <li className="row">
                <span className="rowLeft">
                  <span className="dot" />
                  <span className="truncate">10 Challenges Drafted</span>
                </span>
                <span className="mono">+10</span>
              </li>
              <li className="row">
                <span className="rowLeft">
                  <span className="dot" />
                  <span className="truncate">Kindness Streak (3)</span>
                </span>
                <span className="mono">+15</span>
              </li>
            </ul>
          </Card>
        </div>

        <div className="col">
          <Card title="Badges">
            <div className="matchups">
              <div className="matchup">
                <div className="matchupTop">
                  <span className="avatar">⭐</span>
                  <div className="matchupName">Starter Badge</div>
                </div>
                <div className="muted">Earned for completing your first challenge.</div>
              </div>

              <div className="matchup">
                <div className="matchupTop">
                  <span className="avatar">🔥</span>
                  <div className="matchupName">Streak Badge</div>
                </div>
                <div className="muted">Earned for consecutive-day completions.</div>
              </div>

              <div className="matchup">
                <div className="matchupTop">
                  <span className="avatar">🤝</span>
                  <div className="matchupName">Better Together</div>
                </div>
                <div className="muted">Earned for helping or mentoring.</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
