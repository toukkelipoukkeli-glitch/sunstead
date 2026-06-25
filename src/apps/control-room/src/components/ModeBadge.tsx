import type { ProofSource } from "@aiden/contracts"
import { ProofSourceBadge } from "./ProofSourceBadge"

export const ModeBadge = ({ source }: { source: ProofSource }) => <ProofSourceBadge source={source} />
