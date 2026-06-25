import type { ProofSource } from "@aiden/contracts"

export const ProofSourceBadge = ({ source }: { source: ProofSource }) => (
  <span className={`mode-badge mode-${source}`}>{source}</span>
)

