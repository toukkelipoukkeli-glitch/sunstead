import { useEffect, useMemo, useState } from "react";
import { Header } from "./components/Header";
import { PromptBox } from "./components/PromptBox";
import { Timeline } from "./components/Timeline";
import { Candidates } from "./components/Candidates";
import { PricingTable } from "./components/PricingTable";
import { ProvisionPanel } from "./components/ProvisionPanel";
import { BenchmarkChart } from "./components/BenchmarkChart";
import { Recommendation } from "./components/Recommendation";
import { useRun } from "./lib/useRun";
import { provision, runBenchmark, health } from "./lib/api";
import {
  MOCK_BENCHMARK,
  consoleUrl,
  PROVISION_NAME,
  PROVISION_CLOUD,
} from "./lib/mock";
import type { ServiceStatus } from "./lib/types";

// Mock can be forced on via ?mock=1 or VITE_MOCK=1 at build time. Default: off,
// but the UI nudges to it if the backend health check fails.
const FORCE_MOCK =
  new URLSearchParams(location.search).get("mock") === "1" ||
  import.meta.env.VITE_MOCK === "1";

export default function App() {
  const [mock, setMock] = useState<boolean>(FORCE_MOCK);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const { run, start, stop, patch } = useRun(mock);

  // wiring for the post-run live buttons
  const [provisioning, setProvisioning] = useState(false);
  const [benchmarking, setBenchmarking] = useState(false);
  const [adopted, setAdopted] = useState(false);

  // backend health probe (skipped when mock is forced)
  useEffect(() => {
    if (FORCE_MOCK) return;
    let cancelled = false;
    health().then((ok) => {
      if (cancelled) return;
      setBackendOnline(ok);
      if (!ok) setMock(true); // demo safety: fall back automatically
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onRun = (prompt: string) => {
    setAdopted(false);
    start(prompt);
  };

  const recommendedCandidate = useMemo(
    () => run.candidates?.find((c) => c.id === run.recommendation?.candidateId),
    [run.candidates, run.recommendation],
  );

  // The cloud the recommended candidate's primary store lands in (for the
  // "RUNNING in <region>" label). Falls back to the free-tier mock region.
  const provisionCloud =
    run.provision?.uri || mock
      ? PROVISION_CLOUD
      : recommendedCandidate?.services[0]?.cloud ?? PROVISION_CLOUD;

  // ── live provision (or scripted in mock) ──────────────────────────────────
  const handleProvision = async () => {
    if (run.provision?.state === "RUNNING") return;
    setProvisioning(true);
    if (mock) {
      patch({ provision: { name: PROVISION_NAME, state: "REBUILDING", consoleUrl: consoleUrl(PROVISION_NAME) } });
      await sleep(2200);
      patch({
        provision: {
          name: PROVISION_NAME,
          state: "RUNNING",
          uri: "postgres://avnadmin:****@fintech-pg-demo-touko-1f1c.l.aivencloud.com:13710/defaultdb?sslmode=require",
          consoleUrl: consoleUrl(PROVISION_NAME),
        },
      });
      setProvisioning(false);
      return;
    }
    try {
      const primary = recommendedCandidate?.services[0];
      const status = await provision({
        name: PROVISION_NAME,
        serviceType: primary?.serviceType ?? "pg",
        plan: "free-1-1gb",
        cloud: provisionCloud,
      });
      patch({ provision: status });
      // poll-ish: the server's getService drives state; if it returned
      // REBUILDING, the agent stream usually pushes RUNNING. As a safety net we
      // re-show whatever the server gave us.
    } catch (e: any) {
      patch({ provision: { name: PROVISION_NAME, state: "ERROR", consoleUrl: consoleUrl(PROVISION_NAME) } as ServiceStatus });
      patch({ error: e?.message });
    } finally {
      setProvisioning(false);
    }
  };

  // ── live benchmark (or scripted in mock) ──────────────────────────────────
  const handleBenchmark = async () => {
    setBenchmarking(true);
    if (mock) {
      await sleep(1600);
      patch({ benchmark: MOCK_BENCHMARK });
      setBenchmarking(false);
      return;
    }
    try {
      const result = await runBenchmark(run.provision?.name ?? PROVISION_NAME);
      patch({ benchmark: result });
    } catch (e: any) {
      patch({ error: e?.message });
    } finally {
      setBenchmarking(false);
    }
  };

  const handleTeardown = () => {
    setAdopted(false);
    patch({ provision: undefined, benchmark: undefined });
  };

  const provisioned = run.provision?.state === "RUNNING";
  const showResults = run.status !== "idle";

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <Header mock={mock} onToggleMock={setMock} backendOnline={backendOnline} />

        <PromptBox
          onRun={onRun}
          onStop={stop}
          streaming={run.status === "streaming"}
        />

        {run.status === "error" && (
          <div className="rounded-xl border border-accent/40 bg-accent/[0.07] px-4 py-3 text-sm text-accent-soft">
            {run.error}
          </div>
        )}

        {showResults && (
          <div className="space-y-5">
            <Timeline items={run.timeline} streaming={run.status === "streaming"} />

            {run.candidates && (
              <Candidates
                candidates={run.candidates}
                recommendedId={run.recommendation?.candidateId}
              />
            )}

            {run.pricing && run.pricing.length > 0 && (
              <PricingTable rows={run.pricing} />
            )}

            {(run.recommendation || run.provision) && (
              <ProvisionPanel
                status={run.provision}
                cloud={provisionCloud}
                onProvision={handleProvision}
                canProvision={!!run.recommendation}
                provisioning={provisioning}
              />
            )}

            {(provisioned || run.benchmark) && (
              <BenchmarkChart
                result={run.benchmark}
                onRun={handleBenchmark}
                canRun={provisioned}
                running={benchmarking}
              />
            )}

            {run.recommendation && (
              <Recommendation
                recommendation={run.recommendation}
                candidate={recommendedCandidate}
                adopted={adopted}
                onAdopt={() => setAdopted(true)}
                onTeardown={handleTeardown}
              />
            )}
          </div>
        )}

        <footer className="pt-4 text-center text-[11px] text-ink-faint">
          Aiven Architect · presales capacity planning · project{" "}
          <code className="font-mono">touko-1f1c</code> · cost numbers pulled live
          from the Aiven pricing API
        </footer>
      </div>
    </div>
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
