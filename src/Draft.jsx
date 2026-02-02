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

export default function Draft() {
  return (
    <div className="pageWrap">
      <Card title="Draft" right={<span className="pill">Wired In</span>}>
        <p className="muted" style={{ marginTop: 0 }}>
          This is a placeholder Draft screen so navigation + URLs are real now.
          Next brick will define the Draft model and how it connects to challenges.
        </p>

        <div className="seasonGrid">
          <div className="seasonTile">
            <div className="tileKicker">Step 1</div>
            <div className="tileTitle">Choose Category</div>
            <div className="tileSub">Fitness • Household • Knowledge • etc.</div>
          </div>
          <div className="seasonTile">
            <div className="tileKicker">Step 2</div>
            <div className="tileTitle">Pick Challenge</div>
            <div className="tileSub">Draft tasks for today/week</div>
          </div>
          <div className="seasonTile">
            <div className="tileKicker">Step 3</div>
            <div className="tileTitle">Track + Score</div>
            <div className="tileSub">Points + accountability rules</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
