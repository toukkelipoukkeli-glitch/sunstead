import type { ProofSource, PulseWallProvider } from "@aiden/contracts"
import {
  createAivenPulseWallProvider,
  isAivenPulseWallConfigured,
  resetStubPulseWallProvider,
  stubPulseWallProvider
} from "@aiden/pulsewall-adapter"

type AdapterRuntimeState = {
  mode: ProofSource
  provider: PulseWallProvider
  runId?: string
}

let runtime: AdapterRuntimeState = {
  mode: "fixture",
  provider: stubPulseWallProvider
}

export const getAdapterRuntime = () => runtime

export const getPulseWallProvider = () => runtime.provider

export const resetAdapterRuntime = () => {
  resetStubPulseWallProvider()
  runtime = {
    mode: "fixture",
    provider: stubPulseWallProvider
  }
}

export const canUseAivenProvider = () => isAivenPulseWallConfigured()

export const switchToAivenProvider = (runId: string) => {
  runtime = {
    mode: "live",
    provider: createAivenPulseWallProvider({ runId }),
    runId
  }
}
