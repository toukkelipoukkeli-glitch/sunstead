import { Boxes, Wifi, WifiOff, FlaskConical } from "lucide-react";

export function Header({
  mock,
  onToggleMock,
  backendOnline,
}: {
  mock: boolean;
  onToggleMock: (v: boolean) => void;
  backendOnline: boolean | null;
}) {
  return (
    <header className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="grid place-items-center w-10 h-10 rounded-xl bg-accent/15 border border-accent/40 shrink-0">
          <Boxes className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-ink leading-tight">
            Aiven Architect
          </h1>
          <p className="text-[12.5px] text-ink-muted leading-snug">
            Describe a workload, get a costed, benchmarked, provisionable Aiven stack.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* backend status pill */}
        <span
          className={[
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border",
            mock
              ? "border-warn/40 bg-warn/10 text-warn"
              : backendOnline
                ? "border-good/40 bg-good/10 text-good"
                : backendOnline === false
                  ? "border-line bg-panel-soft text-ink-faint"
                  : "border-line bg-panel-soft text-ink-faint",
          ].join(" ")}
          title={
            mock
              ? "Mock mode: scripted run, no backend"
              : backendOnline
                ? "Backend reachable"
                : "Backend not reachable — use Mock mode"
          }
        >
          {mock ? (
            <FlaskConical className="w-3.5 h-3.5" />
          ) : backendOnline ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          {mock ? "mock" : backendOnline ? "live" : "offline"}
        </span>

        {/* mock toggle */}
        <button
          onClick={() => onToggleMock(!mock)}
          className={[
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition",
            mock
              ? "border-accent/50 bg-accent/15 text-accent-soft"
              : "border-line bg-panel-soft text-ink-muted hover:text-ink",
          ].join(" ")}
          title="Toggle scripted demo (no backend needed)"
        >
          <span
            className={[
              "relative w-8 h-4 rounded-full transition-colors",
              mock ? "bg-accent" : "bg-line",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                mock ? "left-4" : "left-0.5",
              ].join(" ")}
            />
          </span>
          Mock mode
        </button>
      </div>
    </header>
  );
}
