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

export default function Playbook() {
  return (
    <div className="pageWrap">
      <Card title="Playbook" right={<span className="pill">Stage 2</span>}>
        <p className="muted" style={{ marginTop: 0 }}>
          This tab is now live and routed. Next brick: extract the system rules into a structured spec
          and display them here (Adult + Kid voice, same system).
        </p>
      </Card>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 14 }}>
        <div className="col">
          <Card title="Adult Playbook">
            <p className="muted" style={{ marginTop: 0 }}>
              Canonical language for commissioners/adults. We’ll map rules → mechanics.
            </p>
            <button className="btnGhost" type="button">Open (next brick)</button>
          </Card>
        </div>

        <div className="col">
          <Card title="Kid Playbook">
            <p className="muted" style={{ marginTop: 0 }}>
              Same system, kid-friendly voice. We’ll map concepts → kid UI copy.
            </p>
            <button className="btnGhost" type="button">Open (next brick)</button>
          </Card>
        </div>
      </div>
    </div>
  );
}
