// Hivemind — event bus. LocalBus (in-proc fan-out) + KafkaBus (Aiven, lazy kafkajs).
import type { Bus, ActivityEvent } from "./types.ts";
import type { Config } from "./config.ts";

type Handler = (e: ActivityEvent) => void;

/** Pick the bus implementation based on config.busKind. */
export function createBus(config: Config): Bus {
  return config.busKind === "kafka" ? new KafkaBus(config) : new LocalBus();
}

/**
 * In-process fan-out. No network, zero deps. Used in the default local path so a
 * single laptop's watcher + simulator feed the server without any broker.
 */
export class LocalBus implements Bus {
  private handlers = new Set<Handler>();

  async start(): Promise<void> {
    // no-op
  }

  async stop(): Promise<void> {
    this.handlers.clear();
  }

  async publish(e: ActivityEvent): Promise<void> {
    // Snapshot so a subscriber that (un)subscribes during dispatch can't disrupt iteration.
    for (const handler of [...this.handlers]) {
      try {
        handler(e);
      } catch (err) {
        // A bad subscriber must never break publish for the others.
        console.error("[hivemind] LocalBus subscriber threw:", err);
      }
    }
  }

  subscribe(handler: Handler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
}

/**
 * Aiven Kafka bus — the real cross-machine team bus. Every teammate publishes to the
 * same topic and runs a consumer, so each machine sees the whole team's events locally.
 * kafkajs is loaded lazily so the core (local) path never needs it installed.
 */
export class KafkaBus implements Bus {
  private config: Config;
  private handlers = new Set<Handler>();
  private kafka: any;
  private producer: any;
  private consumer: any;
  private started = false;

  constructor(config: Config) {
    this.config = config;
  }

  private kafkaCfg() {
    const k = this.config.kafka;
    if (!k || k.brokers.length === 0) {
      throw new Error(
        "[hivemind] busKind=kafka but no brokers configured. Set KAFKA_BROKERS (comma-separated host:port).",
      );
    }
    return k;
  }

  async start(): Promise<void> {
    if (this.started) return;
    const k = this.kafkaCfg();

    let Kafka: any, logLevel: any;
    try {
      ({ Kafka, logLevel } = await import("kafkajs"));
    } catch {
      throw new Error("[hivemind] kafkajs is not installed. Run `npm i kafkajs` to use the Kafka bus.");
    }

    const sasl =
      k.username && k.password
        ? { mechanism: (k.mechanism || "scram-sha-256") as any, username: k.username, password: k.password }
        : undefined;

    this.kafka = new Kafka({
      clientId: `hivemind-${this.config.actor}`,
      brokers: k.brokers,
      ssl: k.ssl,
      sasl,
      logLevel: logLevel ? logLevel.NOTHING : undefined,
    });

    this.producer = this.kafka.producer();
    await this.producer.connect();

    // Unique group per process so every teammate's machine receives every event
    // (no shared-group partition splitting). fromBeginning:false → live tail only.
    const groupId = `hivemind-${this.config.actor}-${process.pid}-${Date.now()}`;
    this.consumer = this.kafka.consumer({ groupId });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: k.topic, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ message }: any) => {
        const raw = message?.value;
        if (!raw) return;
        let event: ActivityEvent;
        try {
          event = JSON.parse(raw.toString("utf8")) as ActivityEvent;
        } catch (err) {
          console.error("[hivemind] KafkaBus: bad message JSON, skipping:", err);
          return;
        }
        for (const handler of [...this.handlers]) {
          try {
            handler(event);
          } catch (err) {
            console.error("[hivemind] KafkaBus subscriber threw:", err);
          }
        }
      },
    });

    this.started = true;
  }

  async stop(): Promise<void> {
    this.started = false;
    this.handlers.clear();
    try {
      await this.consumer?.disconnect();
    } catch (err) {
      console.error("[hivemind] KafkaBus: consumer disconnect failed:", err);
    }
    try {
      await this.producer?.disconnect();
    } catch (err) {
      console.error("[hivemind] KafkaBus: producer disconnect failed:", err);
    }
    this.producer = undefined;
    this.consumer = undefined;
    this.kafka = undefined;
  }

  async publish(e: ActivityEvent): Promise<void> {
    if (!this.producer) {
      throw new Error("[hivemind] KafkaBus.publish called before start().");
    }
    const k = this.kafkaCfg();
    await this.producer.send({
      topic: k.topic,
      messages: [{ key: e.actor, value: JSON.stringify(e) }],
    });
  }

  subscribe(handler: Handler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
}
