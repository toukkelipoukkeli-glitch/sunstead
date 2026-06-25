import { useEffect, useRef } from "react";
import {
  Brain,
  Terminal,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import type { TimelineItem } from "../lib/types";
import { Card, SectionTitle } from "./ui";

// Friendly captions for the aiven_* tool names so judges instantly get what
// each MCP call does as it fires.
const TOOL_META: Record<string, { caption: string }> = {
  aiven_list_clouds: { caption: "list available cloud regions" },
  aiven_compare_pricing: { caption: "pull live pricing across regions" },
  aiven_service_create: { caption: "provision a service (free tier)" },
  aiven_service_get: { caption: "poll service state" },
  aiven_pg_query: { caption: "run SQL on the instance" },
  aiven_run_benchmark: { caption: "micro-benchmark the instance" },
};

export function Timeline({
  items,
  streaming,
}: {
  items: TimelineItem[];
  streaming: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items.length]);

  return (
    <Card className="p-4 sm:p-5">
      <SectionTitle
        step={1}
        title="Agent timeline"
        hint="live reasoning + Aiven MCP tool calls"
        right={
          <span className="text-[11px] font-mono text-ink-faint">
            {items.filter((i) => i.kind === "tool_call").length} tool calls
          </span>
        }
      />

      <div className="relative max-h-[340px] overflow-y-auto pr-1 -mr-1">
        {items.length === 0 && (
          <div className="text-sm text-ink-faint py-8 text-center">
            The agent's reasoning and live Aiven tool calls will stream here.
          </div>
        )}

        <ol className="space-y-1.5">
          {items.map((item, i) => (
            <TimelineRow key={i} item={item} />
          ))}
        </ol>

        {streaming && (
          <div className="flex items-center gap-2 pl-9 pt-2 text-xs text-accent-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-accent anim-pulse-dot" />
            thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>
    </Card>
  );
}

function TimelineRow({ item }: { item: TimelineItem }) {
  if (item.kind === "thought") {
    return (
      <li className="anim-fade-up flex gap-2.5 py-1.5">
        <Brain className="w-4 h-4 mt-0.5 text-ink-faint shrink-0" />
        <p className="text-[13.5px] leading-relaxed text-ink-muted">{item.text}</p>
      </li>
    );
  }

  if (item.kind === "tool_call") {
    const meta = TOOL_META[item.tool];
    const argStr = compactArgs(item.args);
    return (
      <li className="anim-fade-up">
        <div className="flex gap-2.5 items-start rounded-lg border border-accent/25 bg-accent/[0.06] px-2.5 py-2">
          <Terminal className="w-4 h-4 mt-0.5 text-accent shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <code className="text-[13px] font-mono font-semibold text-accent-soft">
                {item.tool}
              </code>
              {meta && (
                <span className="text-[11px] text-ink-faint">{meta.caption}</span>
              )}
            </div>
            {argStr && (
              <code className="block mt-0.5 text-[11.5px] font-mono text-ink-faint truncate">
                {argStr}
              </code>
            )}
          </div>
        </div>
      </li>
    );
  }

  // tool_result
  return (
    <li className="anim-fade-up flex gap-2.5 py-1 pl-1">
      <CheckCircle2 className="w-4 h-4 mt-0.5 text-good shrink-0" />
      <div className="min-w-0 text-[12.5px] leading-relaxed text-ink-muted">
        <span className="font-mono text-ink-faint mr-1.5 inline-flex items-center">
          {item.tool}
          <ChevronRight className="w-3 h-3 inline" />
        </span>
        {item.summary}
      </div>
    </li>
  );
}

function compactArgs(args: any): string {
  if (!args || typeof args !== "object") return "";
  const parts = Object.entries(args)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`);
  return parts.length ? `{ ${parts.join(", ")} }` : "";
}
