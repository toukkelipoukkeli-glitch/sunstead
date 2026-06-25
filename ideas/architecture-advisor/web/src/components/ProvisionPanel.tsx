import { Rocket, ExternalLink, Loader2, CheckCircle2, Server } from "lucide-react";
import type { ServiceStatus } from "../lib/types";
import { Card, SectionTitle, Badge, Button } from "./ui";
import { cloudLabel } from "../lib/format";

const STATES = ["REBUILDING", "RUNNING"] as const;

export function ProvisionPanel({
  status,
  cloud,
  onProvision,
  canProvision,
  provisioning,
}: {
  status?: ServiceStatus;
  cloud?: string;
  onProvision: () => void;
  canProvision: boolean;
  provisioning: boolean;
}) {
  const state = status?.state;
  const running = state === "RUNNING";
  const rebuilding = state === "REBUILDING" || provisioning;
  const regionLabel = cloud ? cloudLabel(cloud) : status ? "EU free region" : "";

  return (
    <Card className="p-4 sm:p-5" glow={running}>
      <SectionTitle
        step={4}
        title="Provision live"
        hint="free tier — costs $0 — the hero moment"
        right={
          status ? (
            <Badge tone={running ? "good" : "warn"}>
              {running ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Loader2 className="w-3 h-3 animate-spin" />
              )}
              {state}
            </Badge>
          ) : (
            <Badge tone="neutral">not provisioned</Badge>
          )
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* state machine viz */}
        <div className="flex items-center gap-2 flex-1">
          {STATES.map((s, i) => {
            const reached =
              running || (rebuilding && s === "REBUILDING");
            const active =
              (rebuilding && s === "REBUILDING") || (running && s === "RUNNING");
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={[
                    "flex items-center gap-2 px-3 py-2 rounded-xl border font-mono text-xs font-semibold transition",
                    s === "RUNNING" && running
                      ? "border-good/50 bg-good/12 text-good"
                      : active
                        ? "border-accent/50 bg-accent/12 text-accent-soft"
                        : reached
                          ? "border-line bg-panel-soft text-ink-muted"
                          : "border-line-soft bg-bg-soft text-ink-faint",
                  ].join(" ")}
                >
                  {s === "RUNNING" && running ? (
                    <Server className="w-3.5 h-3.5" />
                  ) : active ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                  )}
                  {s}
                </div>
                {i === 0 && (
                  <div className="w-6 h-px bg-line relative overflow-hidden">
                    {rebuilding && !running && (
                      <span className="absolute inset-0 anim-shimmer" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {!running && (
            <Button
              variant="primary"
              onClick={onProvision}
              disabled={!canProvision || rebuilding}
            >
              {rebuilding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Provisioning…
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" /> Provision free tier
                </>
              )}
            </Button>
          )}
          {status?.consoleUrl && (
            <a href={status.consoleUrl} target="_blank" rel="noreferrer">
              <Button variant="ghost">
                <ExternalLink className="w-3.5 h-3.5" /> Aiven console
              </Button>
            </a>
          )}
        </div>
      </div>

      {running && (
        <div className="anim-fade-up mt-3 rounded-xl border border-good/30 bg-good/[0.06] px-3.5 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-good">
            <CheckCircle2 className="w-4 h-4" />
            RUNNING in {regionLabel}
          </div>
          {status?.uri && (
            <code className="block mt-1.5 text-[11px] font-mono text-ink-faint break-all">
              {redactUri(status.uri)}
            </code>
          )}
        </div>
      )}

      {!status && (
        <p className="mt-3 text-[11.5px] text-ink-faint">
          Provisions the recommended shape on the <strong className="text-ink-muted">free
          tier</strong> ($0) on project{" "}
          <code className="font-mono">touko-1f1c</code>. Paid plans are rejected by
          the server.
        </p>
      )}
    </Card>
  );
}

// Never show credentials on a projector — keep host:port, mask the password.
function redactUri(uri: string): string {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:••••@");
}
