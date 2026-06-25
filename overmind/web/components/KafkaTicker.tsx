import { Stream } from '../icons.tsx'

export interface KafkaEvent {
  id: number
  topic: string
  direction: 'produce' | 'consume'
  payload: string
}

/**
 * Zone 3c — proof that realtime actually hops over Aiven Kafka. Newest first.
 */
export function KafkaTicker({ events }: { events: KafkaEvent[] }) {
  const pub = events.filter((e) => e.direction === 'produce').length
  const sub = events.length - pub
  return (
    <div className="panel">
      <div className="panel-h">
        <h3>
          <span className="h-ico">
            <Stream size={15} />
          </span>
          Kafka event mesh
        </h3>
        <span className="meta">
          {events.length ? (
            <>
              <span className="km pub">▲ {pub}</span> <span className="km sub">▼ {sub}</span>
            </>
          ) : (
            'no events yet'
          )}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="empty pulse-wait">Realtime events will hop through Aiven Kafka here…</div>
      ) : (
        <div className="ticker">
          {events.map((e, i) => (
            <div className={`kev ${i === 0 ? 'fresh' : ''}`} key={e.id}>
              <span className={`dir ${e.direction}`}>{e.direction === 'produce' ? '▲ PUB' : '▼ SUB'}</span>
              <span className="topic">{e.topic}</span>
              <span className="payload">{e.payload}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
