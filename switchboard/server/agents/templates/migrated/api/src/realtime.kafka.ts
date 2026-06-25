import { Router } from 'express'
import pg from 'pg'
import { pgConfig } from './db'

// High fan-out realtime via Aiven for Apache Kafka (the scale path the Migration
// Reporter recommends). Instead of every SSE client holding a Postgres LISTEN,
// a single bridge publishes card inserts to the `cards.changes` topic and each
// client tails it. Enable with REALTIME=kafka and the KAFKA_* env injected by
// the Aiven Kafka service integration. kafkajs is an optional dependency.
//
// This file is generated only when the Analyzer detects realtime usage AND the
// plan provisions Kafka; it is wired in place of realtime.ts.
export const realtime = Router()

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type KafkaModule = typeof import('kafkajs')

async function loadKafka(): Promise<KafkaModule | null> {
  try {
    return (await import('kafkajs')) as unknown as KafkaModule
  } catch {
    return null
  }
}

function brokerConfig(Kafka: KafkaModule) {
  return new Kafka.Kafka({
    clientId: 'pulseboard-api',
    brokers: (process.env.KAFKA_BOOTSTRAP_SERVER || '').split(','),
    ssl: {
      ca: process.env.KAFKA_CA_CERT,
      cert: process.env.KAFKA_ACCESS_CERT,
      key: process.env.KAFKA_ACCESS_KEY,
    },
  })
}

// One process-wide bridge: Postgres NOTIFY -> Kafka topic `cards.changes`.
export async function startCardsBridge() {
  const Kafka = await loadKafka()
  if (!Kafka) return
  const producer = brokerConfig(Kafka).producer()
  await producer.connect()
  const listener = new pg.Client(pgConfig())
  await listener.connect()
  await listener.query('listen cards_changes')
  listener.on('notification', (msg) => {
    if (msg.payload) producer.send({ topic: 'cards.changes', messages: [{ value: msg.payload }] })
  })
}

realtime.get('/cards/:boardId', async (req, res) => {
  const boardId = req.params.boardId
  if (!UUID.test(boardId)) return res.status(400).end()
  const Kafka = await loadKafka()
  if (!Kafka) return res.status(503).json({ error: 'kafkajs not installed' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  ;(res as any).flushHeaders?.()

  const consumer = brokerConfig(Kafka).consumer({ groupId: `sse-${boardId}-${process.pid}` })
  await consumer.connect()
  await consumer.subscribe({ topic: 'cards.changes', fromBeginning: false })
  await consumer.run({
    eachMessage: async ({ message }) => {
      const payload = message.value?.toString()
      if (!payload) return
      try {
        if (JSON.parse(payload).board_id === boardId) res.write(`data: ${payload}\n\n`)
      } catch {
        /* ignore */
      }
    },
  })
  req.on('close', () => consumer.disconnect().catch(() => {}))
})
