import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Fingerprint,
  GitBranch,
  GitPullRequestArrow,
  MessageSquare,
  RadioTower,
  Search,
  Server,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { bucketLabels, repo, type Bucket, type EvidenceKind, type WorkItem, workItems } from "./data";

const bucketOrder: Bucket[] = ["review", "context", "batch"];

const kindIcons: Record<EvidenceKind, typeof Fingerprint> = {
  identity: Fingerprint,
  trust: ShieldCheck,
  pull: GitPullRequestArrow,
  issue: AlertTriangle,
  comment: MessageSquare,
  spindle: Activity,
  repo: Server,
};

function App() {
  const [activeBucket, setActiveBucket] = useState<Bucket>("review");
  const [selectedId, setSelectedId] = useState("pr-184");
  const selected = workItems.find((item) => item.id === selectedId) ?? workItems[0];

  const filteredItems = useMemo(
    () => workItems.filter((item) => item.bucket === activeBucket),
    [activeBucket],
  );

  const reviewCount = workItems.filter((item) => item.bucket === "review").length;
  const evidenceTotal = selected.evidence.reduce((sum, item) => sum + Math.max(item.weight, 0), 0);

  return (
    <main className="app-shell">
      <section className="workspace" aria-label="Tangled Evidence Radar">
        <header className="topbar">
          <div>
            <p className="eyebrow">Tangled Evidence Radar</p>
            <h1>{repo.name}</h1>
          </div>
          <div className="repo-strip" aria-label="Repository context">
            <span><Fingerprint size={14} />{repo.did}</span>
            <span><Server size={14} />{repo.knot}</span>
            <span><GitBranch size={14} />{repo.release}</span>
          </div>
        </header>

        <section className="summary-grid" aria-label="Queue summary">
          <div className="metric strong">
            <span className="metric-label">Review now</span>
            <strong>{reviewCount}</strong>
          </div>
          <div className="metric">
            <span className="metric-label">Maintainer</span>
            <strong>{repo.maintainerHandle}</strong>
          </div>
          <div className="metric">
            <span className="metric-label">Top evidence</span>
            <strong>{evidenceTotal}</strong>
          </div>
        </section>

        <section className="protocol-proof" aria-label="Protocol proof">
          <div>
            <span className="proof-label">Data mode</span>
            <strong>Seeded Tangled records</strong>
          </div>
          <div>
            <span className="proof-label">Live path</span>
            <strong>Appview/firehose to XRPC to PDS record writes</strong>
          </div>
          <div>
            <span className="proof-label">Boundary</span>
            <strong>Schema validation pending sponsor/API check</strong>
          </div>
        </section>

        <div className="main-grid">
          <section className="queue-pane" aria-label="Work queue">
            <div className="toolbar">
              <div className="segmented" role="tablist" aria-label="Queue filters">
                {bucketOrder.map((bucket) => (
                  <button
                    key={bucket}
                    className={bucket === activeBucket ? "active" : ""}
                    type="button"
                    onClick={() => setActiveBucket(bucket)}
                  >
                    {bucketLabels[bucket]}
                  </button>
                ))}
              </div>
              <button className="icon-button" type="button" title="Tune signals" aria-label="Tune signals">
                <SlidersHorizontal size={18} />
              </button>
            </div>

            <div className="search-row">
              <Search size={16} />
              <span>{filteredItems.length} items</span>
            </div>

            <div className="queue-list">
              {filteredItems.map((item) => (
                <WorkItemButton
                  item={item}
                  key={item.id}
                  selected={item.id === selected.id}
                  onSelect={() => setSelectedId(item.id)}
                />
              ))}
            </div>
          </section>

          <section className="detail-pane" aria-label="Evidence detail">
            <div className="detail-header">
              <div>
                <p className="eyebrow">{selected.status}</p>
                <h2>{selected.title}</h2>
              </div>
              <ScoreDial score={selected.score} />
            </div>

            <div className="reason-bar">
              <ShieldCheck size={18} />
              <span>{selected.reason}</span>
            </div>

            <section className="evidence-timeline" aria-label="Evidence timeline">
              {selected.evidence.map((evidence, index) => {
                const Icon = kindIcons[evidence.kind];
                return (
                  <article className="evidence-row" key={`${evidence.kind}-${evidence.value}`}>
                    <div className="step-index">{index + 1}</div>
                    <div className="evidence-icon">
                      <Icon size={18} />
                    </div>
                    <div className="evidence-copy">
                      <div className="evidence-title">
                        <strong>{evidence.label}</strong>
                        <span>{evidence.weight > 0 ? `+${evidence.weight}` : evidence.weight}</span>
                      </div>
                      <p>{evidence.note}</p>
                      <code>{evidence.value}</code>
                    </div>
                  </article>
                );
              })}
            </section>

            <div className="action-row">
              <button className="primary-action" type="button">
                <CheckCircle2 size={18} />
                {selected.action}
              </button>
              <a className="secondary-action" href="https://tangled.org" target="_blank" rel="noreferrer">
                <ExternalLink size={18} />
                Open Tangled
              </a>
            </div>

            <section className="files-panel" aria-label="Touched files">
              <div className="panel-heading">
                <GitBranch size={16} />
                <span>Touched files</span>
              </div>
              <div className="file-list">
                {selected.files.map((file) => (
                  <code key={file}>{file}</code>
                ))}
              </div>
            </section>
          </section>
        </div>
      </section>
    </main>
  );
}

function WorkItemButton({ item, selected, onSelect }: { item: WorkItem; selected: boolean; onSelect: () => void }) {
  const Icon = item.bucket === "review" ? AlertTriangle : item.bucket === "context" ? Clock3 : CheckCircle2;

  return (
    <button className={`work-item ${selected ? "selected" : ""}`} type="button" onClick={onSelect}>
      <span className="rank">{item.rank}</span>
      <span className={`item-icon ${item.bucket}`}>
        <Icon size={17} />
      </span>
      <span className="item-copy">
        <strong>{item.title}</strong>
        <span>{item.reason}</span>
      </span>
      <span className="item-score">{item.score}</span>
    </button>
  );
}

function ScoreDial({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(score, 110));
  const angle = `${Math.round((clamped / 110) * 360)}deg`;

  return (
    <div className="score-dial" style={{ "--angle": angle } as React.CSSProperties}>
      <RadioTower size={16} />
      <strong>{score}</strong>
    </div>
  );
}

export default App;
