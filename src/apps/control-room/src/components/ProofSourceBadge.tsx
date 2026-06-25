import type { ProofSource } from "@aiden/contracts"

const proofSourceLabel: Record<ProofSource, string> = {
  fixture: "prepared",
  cached: "cached",
  live: "live"
}

export const ProofSourceBadge = ({ source }: { source: ProofSource }) => (
  <span className={`mode-badge mode-${source}`}>{proofSourceLabel[source]}</span>
)
