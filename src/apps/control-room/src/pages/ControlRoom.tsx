import type { Post, PulseWallEvent, RunSnapshot } from "@aiden/contracts"
import { finalReport as fixtureOutcomeReport } from "@aiden/fixtures"
import { Activity, CheckCircle2, Database, RadioTower, Zap } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { AgentMigrationSpine } from "../components/AgentMigrationSpine"
import { AivenProofPlane } from "../components/AivenProofPlane"
import { BehaviorMap } from "../components/BehaviorMap"
import { ColdOpenOutcome } from "../components/ColdOpenOutcome"
import { CommandStrip } from "../components/CommandStrip"
import { CutoverProof } from "../components/CutoverProof"
import { FinalReport } from "../components/FinalReport"
import { KafkaAgentBus } from "../components/KafkaAgentBus"
import { PresenterControls } from "../components/PresenterControls"
import { RealtimeProof } from "../components/RealtimeProof"
import { ReceiptStream } from "../components/ReceiptStream"
import { SourceAppPanel } from "../components/SourceAppPanel"
import { ValidationCards } from "../components/ValidationCards"
import {
  addReaction,
  createRun,
  getRun,
  graduateRun,
  listPosts,
  listRecentEvents,
  pauseRun,
  resetRun,
  runDataMigration,
  runKafkaAgentBus,
  runProofSpine,
  runProviderCutover,
  runSourceScan,
  stepRun
} from "../lib/api"
import { deriveRunProgress, latestSummary } from "../lib/deriveRunView"

export const ControlRoom = () => {
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [appEvents, setAppEvents] = useState<PulseWallEvent[]>([])
  const [coldOpen, setColdOpen] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [proofRunning, setProofRunning] = useState(false)
  const [scanRunning, setScanRunning] = useState(false)
  const [migrationRunning, setMigrationRunning] = useState(false)
  const [kafkaRunning, setKafkaRunning] = useState(false)
  const [cutoverRunning, setCutoverRunning] = useState(false)

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
        const run = await createRun()
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
    if (!runId || coldOpen) return
    const interval = window.setInterval(async () => {
      try {
        const next = await getRun(runId)
        setSnapshot(next)
      } catch (pollError) {
        setError(pollError instanceof Error ? pollError.message : "Failed to poll run")
      }
    }, 700)
    return () => window.clearInterval(interval)
  }, [runId, coldOpen])

  const visibleEvents = useMemo(() => snapshot?.events ?? [], [snapshot])

  const graduate = async () => {
    if (!runId) return
    setColdOpen(false)
    setError(null)
    setSnapshot(await graduateRun(runId))
  }

  const reset = async () => {
    if (!runId) return
    setSnapshot(await resetRun(runId))
    setColdOpen(true)
    await refreshAdapter()
  }

  const step = async () => {
    if (!runId) return
    setColdOpen(false)
    setSnapshot(await stepRun(runId))
  }

  const pause = async () => {
    if (!runId) return
    setSnapshot(await pauseRun(runId))
  }

  const runLiveProof = async () => {
    if (!runId || proofRunning) return
    setColdOpen(false)
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
    setColdOpen(false)
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
    setColdOpen(false)
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
    setColdOpen(false)
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
    setColdOpen(false)
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
    <main className={`app-shell control-room${coldOpen ? " cold-open-shell" : ""}`}>
      {coldOpen ? null : <CommandStrip snapshot={snapshot} onGraduate={graduate} />}

      {error ? <div className="error-strip">{error}</div> : null}

      {coldOpen ? (
        <ColdOpenOutcome report={fixtureOutcomeReport} onRewind={() => setColdOpen(false)} />
      ) : (
        <>
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
                {visibleEvents.length}/14 events
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

          <PresenterControls
            cutoverRunning={cutoverRunning}
            eventCount={visibleEvents.length}
            kafkaRunning={kafkaRunning}
            migrationRunning={migrationRunning}
            onColdOpen={() => setColdOpen(true)}
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
              <SourceAppPanel posts={posts} onReact={reactToTopPost} cutoverReady={cutoverReady} />
            </div>

            <div className="proof-lane center-lane">
              <div className="lane-header">
                <span>02</span>
                <strong>Execution timeline</strong>
              </div>
              <AgentMigrationSpine events={visibleEvents} />
              <BehaviorMap findings={snapshot.behaviorFindings} />
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
            <FinalReport report={snapshot.report} />
          </section>
        </>
      )}

      <footer className="footer-note">
        <Zap aria-hidden="true" size={14} />
        Evidence labels show fixture, live, or cached data while each slot is replaced behind the same contracts.
      </footer>
    </main>
  )
}
