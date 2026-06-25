import type { RunSnapshot } from "@aiden/contracts"
import { CheckCircle2 } from "lucide-react"

export const CutoverProof = ({ snapshot }: { snapshot: RunSnapshot }) => {
  const cutoverReady = snapshot.events.some(
    (event) => event.type === "cutover.demo_runtime.ready" && event.status === "ok"
  )

  return (
    <section className="panel cutover-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Controlled cutover</p>
          <h2>Runtime cutover</h2>
        </div>
        <span className={cutoverReady ? "path-chip success" : "path-chip"}>{cutoverReady ? "ready" : "waiting"}</span>
      </div>
      <div className="path-compare">
        <div>
          <span>Old</span>
          <strong>Lovable UI -&gt; Supabase client -&gt; Postgres/Realtime</strong>
        </div>
        <div className={cutoverReady ? "active-path" : ""}>
          <span>New</span>
          <strong>Lovable UI -&gt; local Aiden adapter -&gt; Aiven Postgres + app_events</strong>
        </div>
        <div className={cutoverReady ? "active-path" : ""}>
          <span>Workflow events</span>
          <strong>Aiven Kafka migration.events</strong>
        </div>
      </div>
      <p className="cutover-note">
        <CheckCircle2 aria-hidden="true" size={15} />
        Supabase removal is limited to the controlled runtime path. Source stays untouched; rollback is ready.
      </p>
    </section>
  )
}
