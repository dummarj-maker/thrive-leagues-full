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
      <Card title="Achievements" right={<span className="pill">Stage 2</span>}>
        <div className="muted" style={{ marginTop: 0 }}>
          Achievements are coming after we freeze scoring + accountability rules.
        </div>
      </Card>
    </div>
  );
}
