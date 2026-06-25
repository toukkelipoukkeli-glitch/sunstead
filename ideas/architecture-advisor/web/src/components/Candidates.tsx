import { Database, Radio, Boxes, Search, Layers, Check } from "lucide-react";
import type { Candidate } from "../lib/types";
import { usdMonthly, cloudLabel } from "../lib/format";
import { Card, SectionTitle, Badge } from "./ui";

const SERVICE_ICON: Record<string, typeof Database> = {
  pg: Database,
  kafka: Radio,
  clickhouse: Layers,
  opensearch: Search,
};

export function Candidates({
  candidates,
  recommendedId,
}: {
  candidates: Candidate[];
  recommendedId?: string;
}) {
  if (!candidates?.length) return null;
  const cheapest = Math.min(...candidates.map((c) => c.monthly));

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle
        step={2}
        title="Candidate architectures"
        hint="2–3 stacks, trade-offs spelled out"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {candidates.map((c) => {
          const isRec = c.id === recommendedId;
          const isCheapest = c.monthly === cheapest;
          return (
            <div
              key={c.id}
              className={[
                "anim-fade-up relative rounded-xl border p-3.5 flex flex-col gap-3 transition",
                isRec
                  ? "border-accent/50 bg-accent/[0.05] shadow-[0_0_0_1px_rgba(255,74,46,0.25)]"
                  : "border-line bg-panel-soft/60",
              ].join(" ")}
            >
              {isRec && (
                <Badge tone="accent" className="absolute -top-2 left-3">
                  <Check className="w-3 h-3" /> Recommended
                </Badge>
              )}

              <div className="flex items-start justify-between gap-2 mt-1">
                <h3 className="text-sm font-semibold text-ink">{c.label}</h3>
                <div className="flex gap-1 shrink-0">
                  {c.eu && <Badge tone="eu">EU</Badge>}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {c.services.map((s, i) => {
                  const Icon = SERVICE_ICON[s.serviceType] ?? Boxes;
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bg-soft border border-line-soft text-[11px] font-mono text-ink-muted whitespace-nowrap"
                    >
                      <Icon className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                      {s.serviceType}/{s.plan}
                      <span className="text-ink-faint">·{cloudLabel(s.cloud)}</span>
                    </span>
                  );
                })}
              </div>

              <p className="text-[12.5px] leading-relaxed text-ink-muted flex-1">
                {c.rationale}
              </p>

              <div className="flex items-end justify-between border-t border-line-soft pt-2.5">
                <div>
                  <div className="text-lg font-bold text-ink tabular-nums">
                    {usdMonthly(c.monthly)}
                  </div>
                  <div className="text-[10.5px] text-ink-faint">production scale</div>
                </div>
                {isCheapest && <Badge tone="good">cheapest</Badge>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
