import { Award, Check, Trash2, Database, Radio, Boxes } from "lucide-react";
import type { Candidate } from "../lib/types";
import { usdMonthly, cloudLabel } from "../lib/format";
import { Card, SectionTitle, Badge, Button } from "./ui";

const ICONS: Record<string, typeof Database> = { pg: Database, kafka: Radio };

export function Recommendation({
  recommendation,
  candidate,
  adopted,
  onAdopt,
  onTeardown,
}: {
  recommendation: { candidateId: string; why: string; monthly: number };
  candidate?: Candidate;
  adopted: boolean;
  onAdopt: () => void;
  onTeardown: () => void;
}) {
  return (
    <Card className="p-4 sm:p-5" glow>
      <SectionTitle step={6} title="Recommendation" hint="the costed, benchmarked answer" />

      <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/[0.08] to-transparent p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-accent/15 border border-accent/40">
              <Award className="w-5 h-5 text-accent" />
            </span>
            <div>
              <div className="text-base font-bold text-ink">
                {candidate?.label ?? recommendation.candidateId}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {candidate?.eu && <Badge tone="eu">EU resident</Badge>}
                <Badge tone="accent">recommended</Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-ink tabular-nums">
              {usdMonthly(recommendation.monthly)}
            </div>
            <div className="text-[11px] text-ink-faint">at production scale</div>
          </div>
        </div>

        {candidate && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {candidate.services.map((s, i) => {
              const Icon = ICONS[s.serviceType] ?? Boxes;
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-bg-soft border border-line-soft text-[11px] font-mono text-ink-muted whitespace-nowrap"
                >
                  <Icon className="w-3.5 h-3.5 text-accent-soft shrink-0" />
                  {s.serviceType}/{s.plan} · {cloudLabel(s.cloud)}
                </span>
              );
            })}
          </div>
        )}

        <p className="text-[13px] leading-relaxed text-ink-muted mt-3">
          {recommendation.why}
        </p>

        <div className="flex items-center gap-2 mt-4">
          {adopted ? (
            <Badge tone="good" className="px-3 py-1.5 text-xs">
              <Check className="w-3.5 h-3.5" /> Adopted — running on your project
            </Badge>
          ) : (
            <Button variant="primary" onClick={onAdopt}>
              <Check className="w-4 h-4" /> Adopt this stack
            </Button>
          )}
          <Button variant="danger" onClick={onTeardown}>
            <Trash2 className="w-3.5 h-3.5" /> Tear down
          </Button>
        </div>
      </div>
    </Card>
  );
}
