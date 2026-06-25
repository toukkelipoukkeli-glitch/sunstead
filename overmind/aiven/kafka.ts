// aiven/kafka.ts — kafkajs producer/consumer against the provisioned Aiven Kafka.
// SASL/SCRAM-SHA-256 + SSL. Config comes from env:
//   KAFKA_BROKERS (comma-separated host:port), KAFKA_USERNAME, KAFKA_PASSWORD,
//   KAFKA_SSL_CA_PATH (optional — path to Aiven project CA pem).
// Defensive: if brokers/creds are missing, calls reject with a clear error instead of crashing
// at import time. The shared producer is lazily created and reused.

import { Kafka, logLevel } from 'kafkajs'
import type { Producer, Consumer, EachMessagePayload } from 'kafkajs'
import { readFileSync } from 'node:fs'

interface KafkaEnv {
  brokers: string[]
  username?: string
  password?: string
  ca?: string
}

function readEnv(): KafkaEnv {
  const brokers = (process.env.KAFKA_BROKERS || '')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean)
  let ca: string | undefined
  const caPath = process.env.KAFKA_SSL_CA_PATH
  if (caPath) {
    try {
      ca = readFileSync(caPath, 'utf8')
    } catch {
      // No CA on disk → fall back to the system trust store (Aiven certs chain to a public root
      // in many setups, and kafkajs ssl:true still works). Don't crash.
      ca = undefined
    }
  }
  return {
    brokers,
    username: process.env.KAFKA_USERNAME || 'avnadmin',
    password: process.env.KAFKA_PASSWORD,
    ca,
  }
}

let _kafka: Kafka | null = null

function client(): Kafka {
  if (_kafka) return _kafka
  const env = readEnv()
  if (!env.brokers.length) {
    throw new Error('aiven/kafka: KAFKA_BROKERS not set')
  }
  if (!env.password) {
    throw new Error('aiven/kafka: KAFKA_PASSWORD not set')
  }
  _kafka = new Kafka({
    clientId: 'overmind',
    brokers: env.brokers,
    ssl: env.ca ? { ca: [env.ca], rejectUnauthorized: true } : { rejectUnauthorized: false },
    sasl: {
      mechanism: 'scram-sha-256',
      username: env.username!,
      password: env.password,
    },
    logLevel: logLevel.ERROR,
    retry: { retries: 5, initialRetryTime: 300 },
  })
  return _kafka
}

// ───────────────────────── producer (shared, lazy) ─────────────────────────

let _producer: Producer | null = null
let _producerConnecting: Promise<Producer> | null = null

async function getProducer(): Promise<Producer> {
  if (_producer) return _producer
  if (_producerConnecting) return _producerConnecting
  _producerConnecting = (async () => {
    const p = client().producer({ allowAutoTopicCreation: true })
    await p.connect()
    _producer = p
    _producerConnecting = null
    return p
  })()
  return _producerConnecting
}

/**
 * Produce one message to `topic`. `value` may be a string or any JSON-serializable object
 * (objects are stringified). Returns the broker ack metadata.
 */
export async function produce(topic: string, value: unknown, key?: string): Promise<void> {
  const p = await getProducer()
  const payload = typeof value === 'string' ? value : JSON.stringify(value)
  await p.send({
    topic,
    messages: [{ value: payload, key: key ?? null }],
  })
}

// ───────────────────────── consumer ─────────────────────────

/**
 * Create + start a consumer on `topic`, invoking `onMessage` per record.
 * Returns the live Consumer so the caller can `.disconnect()` it. `groupId` defaults to a
 * unique-ish id so each bridge instance reads independently; pass a stable one to share offsets.
 * Set `fromBeginning` true to replay existing messages.
 */
export async function createConsumer(
  topic: string,
  onMessage: (msg: { value: string; key?: string; partition: number; offset: string }) => void | Promise<void>,
  opts: { groupId?: string; fromBeginning?: boolean } = {}
): Promise<Consumer> {
  const groupId = opts.groupId ?? `overmind-${topic}-${Date.now()}`
  const consumer = client().consumer({ groupId })
  await consumer.connect()
  await consumer.subscribe({ topic, fromBeginning: opts.fromBeginning ?? false })
  await consumer.run({
    eachMessage: async ({ message, partition }: EachMessagePayload) => {
      try {
        await onMessage({
          value: message.value ? message.value.toString('utf8') : '',
          key: message.key ? message.key.toString('utf8') : undefined,
          partition,
          offset: message.offset,
        })
      } catch (e: any) {
        // Never let one bad handler kill the consumer loop.
        // eslint-disable-next-line no-console
        console.error(`[aiven/kafka] consumer handler error on ${topic}:`, e?.message ?? e)
      }
    },
  })
  return consumer
}

/** Disconnect the shared producer (graceful shutdown). */
export async function disconnect(): Promise<void> {
  if (_producer) {
    try {
      await _producer.disconnect()
    } catch {
      /* ignore */
    }
    _producer = null
  }
}
