import { useState } from "react";
import { Sparkles, Loader2, Square } from "lucide-react";
import { Button } from "./ui";

const PRESETS: { label: string; prompt: string; strong?: boolean }[] = [
  {
    label: "EU fintech: Postgres + order stream",
    strong: true,
    prompt:
      "EU fintech: 50GB transactional Postgres + an order event stream, low p99 latency, data must stay in the EU, tight budget.",
  },
  {
    label: "RAG search over docs",
    prompt:
      "Semantic search over ~2M support docs with pgvector embeddings, mostly reads, EU users, want it cheap to start on a free tier.",
  },
  {
    label: "IoT time-series ingest",
    prompt:
      "High-throughput IoT telemetry: ~10k events/sec into Kafka, then rolled up into ClickHouse for dashboards. EU region preferred, latency matters.",
  },
];

export function PromptBox({
  onRun,
  onStop,
  streaming,
  initialPrompt,
}: {
  onRun: (prompt: string) => void;
  onStop: () => void;
  streaming: boolean;
  initialPrompt?: string;
}) {
  const [prompt, setPrompt] = useState(initialPrompt ?? PRESETS[0].prompt);

  const submit = () => {
    const p = prompt.trim();
    if (p && !streaming) onRun(p);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
          }}
          rows={3}
          placeholder="Describe your app or workload in plain English…"
          className="w-full resize-none rounded-2xl border border-line bg-panel/70 px-4 py-3.5 pr-4 text-[15px] leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setPrompt(p.prompt)}
            className={[
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors text-left",
              p.strong
                ? "border-accent/40 bg-accent/10 text-accent-soft hover:bg-accent/15"
                : "border-line bg-panel-soft text-ink-muted hover:text-ink hover:border-ink-faint",
            ].join(" ")}
          >
            {p.strong && "★ "}
            {p.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11px] text-ink-faint hidden md:inline">⌘↵ to run</span>
          {streaming ? (
            <Button variant="danger" onClick={onStop}>
              <Square className="w-3.5 h-3.5 fill-current" /> Stop
            </Button>
          ) : (
            <Button variant="primary" onClick={submit}>
              <Sparkles className="w-4 h-4" /> Architect it
            </Button>
          )}
        </div>
      </div>

      {streaming && (
        <div className="flex items-center gap-2 text-xs text-accent-soft">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Agent is planning the stack…
        </div>
      )}
    </div>
  );
}

export { PRESETS };
