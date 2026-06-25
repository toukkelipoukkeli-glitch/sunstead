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
  return (
    <div className="panel">
      <div className="panel-h">
        <h3>KAFKA EVENT MESH</h3>
        <span className="meta">{events.length} events</span>
      </div>

      {events.length === 0 ? (
        <div className="empty pulse-wait">Realtime events will hop through Aiven Kafka here…</div>
      ) : (
        <div className="ticker">
          {events.map((e) => (
            <div className="kev" key={e.id}>
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
