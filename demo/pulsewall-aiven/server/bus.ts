import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import type { PulseEvent } from '../shared/types.ts'

// The realtime spine. Producers call publish(); SSE clients subscribe via onEvent().
// If Aiven Kafka is configured, events round-trip through Kafka (cross-instance, the
// hero beat). Otherwise an in-process EventEmitter keeps a single instance live (dev).

const emitter = new EventEmitter()
emitter.setMaxListeners(0)

const TOPIC = process.env.KAFKA_TOPIC || 'pulsewall.events'
// Brokers come from KAFKA_BROKERS (console) or KAFKA_BOOTSTRAP_SERVER (Aiven Apps injection).
const BROKERS = process.env.KAFKA_BROKERS || process.env.KAFKA_BOOTSTRAP_SERVER || ''
const useKafka = !!BROKERS

let producer: any = null
let kafkaReady = false

async function initKafka(): Promise<void> {
  if (!useKafka) {
    console.log('[bus] in-process mode (set KAFKA_BROKERS to use Aiven Kafka)')
    return
  }
  const { Kafka, logLevel } = await import('kafkajs')
  const ssl = process.env.KAFKA_SSL_CA_PATH
    ? { ca: [readFileSync(process.env.KAFKA_SSL_CA_PATH, 'utf8')], rejectUnauthorized: true }
    : true
  const kafka = new Kafka({
    clientId: 'pulsewall',
    brokers: process.env.KAFKA_BROKERS!.split(',').map((b) => b.trim()),
    ssl,
    sasl: process.env.KAFKA_PASSWORD
      ? { mechanism: 'scram-sha-256', username: process.env.KAFKA_USERNAME!, password: process.env.KAFKA_PASSWORD! }
      : undefined,
    logLevel: logLevel.ERROR,
  })

  producer = kafka.producer()
  await producer.connect()

  // Unique group per instance → every instance receives every event (fan-out, not work-split).
  const groupId = `pulsewall-sse-${process.pid}-${Date.now()}`
  const consumer = kafka.consumer({ groupId })
  await consumer.connect()
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false })
  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return
      try {
        emitter.emit('event', JSON.parse(message.value.toString()) as PulseEvent)
      } catch {
        /* ignore malformed */
      }
    },
  })

  kafkaReady = true
  console.log(`[bus] Aiven Kafka connected → topic "${TOPIC}"`)
}

export const busReady: Promise<void> = initKafka().catch((e) => {
  console.error('[bus] Kafka init failed — falling back to in-process bus:', e?.message ?? e)
})

export async function publish(event: PulseEvent): Promise<void> {
  if (useKafka && producer && kafkaReady) {
    const key = 'post' in event ? event.post.id : 'post_id' in event ? event.post_id : ''
    await producer.send({ topic: TOPIC, messages: [{ key, value: JSON.stringify(event) }] })
    // The consumer above will deliver it back to local SSE clients — single, cross-instance path.
  } else {
    emitter.emit('event', event) // in-process fallback
  }
}

export function onEvent(fn: (e: PulseEvent) => void): () => void {
  emitter.on('event', fn)
  return () => emitter.off('event', fn)
}

export function busMode(): string {
  if (!useKafka) return 'in-process'
  return kafkaReady ? 'aiven-kafka' : 'aiven-kafka(connecting)'
}
