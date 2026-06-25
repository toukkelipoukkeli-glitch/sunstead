import type { Post, PulseWallEvent, RunSnapshot } from "@aiden/contracts"
import { Activity, CheckCircle2, Database, RadioTower, Zap } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { AgentMigrationSpine } from "../components/AgentMigrationSpine"
import { AccessBrokerPanel } from "../components/AccessBrokerPanel"
import { AivenProofPlane } from "../components/AivenProofPlane"
import { BehaviorMap } from "../components/BehaviorMap"
import { CommandStrip } from "../components/CommandStrip"
import { CutoverProof } from "../components/CutoverProof"
import { FinalReport } from "../components/FinalReport"
import { KafkaAgentBus } from "../components/KafkaAgentBus"
import { MigrationChangeTrace } from "../components/MigrationChangeTrace"
import { PresenterControls } from "../components/PresenterControls"
import { RealtimeProof } from "../components/RealtimeProof"
import { ReceiptStream } from "../components/ReceiptStream"
import { SourceAppPanel } from "../components/SourceAppPanel"
import { ValidationCards } from "../components/ValidationCards"
import {
  addReaction,
  createRun,
  getCurrentRun,
  getRun,
  graduateRun,
  listPosts,
  listRecentEvents,
  pauseRun,
  runAccessPreflight,
  resetRun,
  runDataMigration,
  runKafkaAgentBus,
  runProofSpine,
  runProviderCutover,
  runSourceScan,
  stepRun
} from "../lib/api"
import { deriveRunProgress, latestSummary, plannedWorkflowEventCount } from "../lib/deriveRunView"
import { readStoredSetupProfile } from "../lib/setupProfile"

export const ControlRoom = () => {
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [appEvents, setAppEvents] = useState<PulseWallEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [proofRunning, setProofRunning] = useState(false)
  const [scanRunning, setScanRunning] = useState(false)
  const [migrationRunning, setMigrationRunning] = useState(false)
  const [kafkaRunning, setKafkaRunning] = useState(false)
  const [cutoverRunning, setCutoverRunning] = useState(false)
  const [graduateRunning, setGraduateRunning] = useState(false)
  const [accessRunning, setAccessRunning] = useState(false)

  const runId = snapshot?.runId
  const progress = deriveRunProgress(snapshot)
  const currentSummary = latestSummary(snapshot)
  const cutoverReady = Boolean(
    snapshot?.events.some((event) => event.type === "cutover.demo_runtime.ready" && event.status === "ok")
  )

  const refreshAdapter = async () => {
    const [nextPosts, nextEvents] = await Promise.all([listPosts(), listRecentEvents()])
    setPosts(nextPosts)
    setAppEvents(nextEvents)
  }

  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      try {
        const currentRun = await getCurrentRun()
        const run = currentRun.events.length > 0 ? currentRun : await createRun(readStoredSetupProfile())
        await refreshAdapter()
        if (!cancelled) setSnapshot(run)
      } catch (bootError) {
        if (!cancelled) setError(bootError instanceof Error ? bootError.message : "Failed to boot scaffold")
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!runId) return
    const interval = window.setInterval(async () => {
      try {
        const next = await getRun(runId)
        setSnapshot(next)
      } catch (pollError) {
        setError(pollError instanceof Error ? pollError.message : "Failed to poll run")
      }
    }, 700)
    return () => window.clearInterval(interval)
  }, [runId])

  const visibleEvents = useMemo(() => snapshot?.events ?? [], [snapshot])
  const canGraduate = Boolean(snapshot?.accessSnapshot.canGraduate)

  const refreshAccess = async () => {
    if (!runId || accessRunning) return
    setError(null)
    setAccessRunning(true)
    try {
      setSnapshot(await runAccessPreflight(runId))
    } catch (accessError) {
      setError(accessError instanceof Error ? accessError.message : "Failed to refresh access")
    } finally {
      setAccessRunning(false)
    }
  }

  const graduate = async () => {
    if (!runId || graduateRunning || !canGraduate) return
    setError(null)
    setGraduateRunning(true)
    try {
      setSnapshot(await graduateRun(runId))
      await refreshAdapter()
    } catch (graduateError) {
      setError(graduateError instanceof Error ? graduateError.message : "Failed to run one-click graduation")
    } finally {
      setGraduateRunning(false)
    }
  }

  const reset = async () => {
    if (!runId) return
    setSnapshot(await resetRun(runId))
    await refreshAdapter()
  }

  const step = async () => {
    if (!runId) return
    setSnapshot(await stepRun(runId))
  }

  const pause = async () => {
    if (!runId) return
    setSnapshot(await pauseRun(runId))
  }

  const runLiveProof = async () => {
    if (!runId || proofRunning) return
    setError(null)
    setProofRunning(true)
    try {
      setSnapshot(await runProofSpine(runId))
    } catch (proofError) {
      setError(proofError instanceof Error ? proofError.message : "Failed to run live proof")
    } finally {
      setProofRunning(false)
    }
  }

  const runScanner = async () => {
    if (!runId || scanRunning) return
    setError(null)
    setScanRunning(true)
    try {
      setSnapshot(await runSourceScan(runId))
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Failed to scan source")
    } finally {
      setScanRunning(false)
    }
  }

  const runMigration = async () => {
    if (!runId || migrationRunning) return
    setError(null)
    setMigrationRunning(true)
    try {
      setSnapshot(await runDataMigration(runId))
    } catch (migrationError) {
      setError(migrationError instanceof Error ? migrationError.message : "Failed to migrate data")
    } finally {
      setMigrationRunning(false)
    }
  }

  const runCutover = async () => {
    if (!runId || cutoverRunning) return
    setError(null)
    setCutoverRunning(true)
    try {
      setSnapshot(await runProviderCutover(runId))
      await refreshAdapter()
    } catch (cutoverError) {
      setError(cutoverError instanceof Error ? cutoverError.message : "Failed to cut over provider")
    } finally {
      setCutoverRunning(false)
    }
  }

  const runKafka = async () => {
    if (!runId || kafkaRunning) return
    setError(null)
    setKafkaRunning(true)
    try {
      setSnapshot(await runKafkaAgentBus(runId))
    } catch (kafkaError) {
      setError(kafkaError instanceof Error ? kafkaError.message : "Failed to publish Kafka workflow event")
    } finally {
      setKafkaRunning(false)
    }
  }

  const reactToTopPost = async () => {
    const post = posts[0]
    if (!post) return
    await addReaction({ postId: post.id, emoji: "rocket" })
    await refreshAdapter()
  }

  if (!snapshot) {
    return (
      <main className="boot-screen">
        <div className="boot-panel">
          <Database aria-hidden="true" />
          <p>Loading Aiden Migration Control Room</p>
          {error ? <span>{error}</span> : null}
        </div>
      </main>
    )
  }

  return (
    <main className="app-shell control-room">
      <CommandStrip
        canGraduate={canGraduate}
        graduateBlockers={snapshot.accessSnapshot.blockers}
        isRunning={graduateRunning}
        snapshot={snapshot}
        onGraduate={graduate}
      />

      <AccessBrokerPanel
        accessSnapshot={snapshot.accessSnapshot}
        isRefreshing={accessRunning}
        onRefresh={refreshAccess}
      />

      {error ? <div className="error-strip">{error}</div> : null}

      <section className="run-strip">
        <div>
          <p className="eyebrow">Current state</p>
          <strong>{snapshot.state.replaceAll("_", " ")}</strong>
          <span>{currentSummary}</span>
        </div>
        <div className="progress-shell" aria-label={`Run progress ${progress}%`}>
          <div style={{ width: `${progress}%` }} />
        </div>
        <div className="run-proof">
          <span>
            <CheckCircle2 aria-hidden="true" size={16} />
            {visibleEvents.length}/{plannedWorkflowEventCount} events
          </span>
          <span>
            <Activity aria-hidden="true" size={16} />
            Postgres app_events
          </span>
          <span>
            <RadioTower aria-hidden="true" size={16} />
            Workflow events
          </span>
        </div>
      </section>

      <MigrationChangeTrace snapshot={snapshot} />

      <PresenterControls
        cutoverRunning={cutoverRunning}
        disabled={graduateRunning}
        eventCount={visibleEvents.length}
        plannedEventCount={plannedWorkflowEventCount}
        kafkaRunning={kafkaRunning}
        migrationRunning={migrationRunning}
        onPause={pause}
        onRunCutover={runCutover}
        onRunKafka={runKafka}
        onRunMigration={runMigration}
        onRunProof={runLiveProof}
        onRunScan={runScanner}
        onReset={reset}
        onStep={step}
        proofRunning={proofRunning}
        scanRunning={scanRunning}
      />

      <section className="proof-stage" aria-label="Migration execution stage">
        <div className="proof-lane">
          <div className="lane-header">
            <span>01</span>
            <strong>Source app</strong>
          </div>
          <SourceAppPanel
            posts={posts}
            onReact={reactToTopPost}
            cutoverReady={cutoverReady}
            sourceLabel={snapshot.setupProfile.sourceLabel}
          />
        </div>

        <div className="proof-lane center-lane">
          <div className="lane-header">
            <span>02</span>
            <strong>Execution timeline</strong>
          </div>
          <AgentMigrationSpine events={visibleEvents} plannedEventCount={plannedWorkflowEventCount} />
          <BehaviorMap findings={snapshot.behaviorFindings} behaviorGraph={snapshot.behaviorGraph} />
        </div>

        <div className="proof-lane">
          <div className="lane-header">
            <span>03</span>
            <strong>Aiven landing zone</strong>
          </div>
          <AivenProofPlane checks={snapshot.validationChecks} receipts={snapshot.receipts} events={visibleEvents} />
          <ReceiptStream receipts={snapshot.receipts} />
          <KafkaAgentBus events={snapshot.kafkaEvents} />
        </div>
      </section>

      <section className="outcome-rail" aria-label="Migration outcome rail">
        <RealtimeProof checks={snapshot.validationChecks} appEvents={appEvents} />
        <ValidationCards checks={snapshot.validationChecks} report={snapshot.report} />
        <CutoverProof snapshot={snapshot} />
        <FinalReport
          report={snapshot.report}
          generatedArtifacts={snapshot.generatedArtifacts}
          cutoverArtifacts={snapshot.cutoverArtifacts}
        />
      </section>

      <footer className="footer-note">
        <Zap aria-hidden="true" size={14} />
        Evidence labels show prepared, live, or cached data while each slot is replaced behind the same contracts.
      </footer>
    </main>
  )
}
