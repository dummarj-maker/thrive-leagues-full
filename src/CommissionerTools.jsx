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

export default function CommissionerTools() {
  return (
    <div className="pageWrap">
      <Card title="Commissioner Tools" right={<span className="pill">Admin</span>}>
        <p className="muted" style={{ marginTop: 0 }}>
          Placeholder screen. We’ll only add tools after we freeze the system rules that govern incentives,
          fairness, and accountability.
        </p>

        <div className="tools">
          <button className="btnGhost" type="button">Manage Categories</button>
          <button className="btnGhost" type="button">Edit Scoring</button>
          <button className="btnGhost" type="button">Create Challenge</button>
        </div>
      </Card>
    </div>
  );
}
