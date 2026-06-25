import type { RunSnapshot } from "@aiden/contracts"

export const deriveRunProgress = (snapshot: RunSnapshot | null) => {
  if (!snapshot) return 0
  const total = 14
  return Math.min(100, Math.round((snapshot.events.length / total) * 100))
}

export const hasEvent = (snapshot: RunSnapshot | null, type: string) =>
  Boolean(snapshot?.events.some((event) => event.type === type))

export const latestSummary = (snapshot: RunSnapshot | null) =>
  snapshot?.events.at(-1)?.summary ?? "Ready to graduate the controlled runtime path."
