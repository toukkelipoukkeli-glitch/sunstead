# Sample env files — paste-an-env demo

The new front door for Switchboard: instead of one Supabase URL, a user pastes their
whole `.env`. The **Env Detector** ([../server/agents/env-detect.ts](../server/agents/env-detect.ts))
reads every `KEY=VALUE`, identifies each backing service + the provider it came from,
and maps it onto an Aiven managed service with a verdict.

These fixtures span the interesting cases (every password/key in them is fake).

**Supabase apps** — the headline use case (moving a Lovable/Bolt app off Supabase):

| File | App | Stack | Aiven verdict |
| --- | --- | --- | --- |
| [vibenote.env](vibenote.env) | Bolt/Lovable note app | Supabase only — URL + anon key, **no `postgres://` string** | **1 migrate** |
| [taskforge.env](taskforge.env) | Next.js + Prisma SaaS | Supabase PG (pooled + direct) · Upstash Redis | **2 migrate** |
| [feedbackhq.env](feedbackhq.env) | Feedback portal | Supabase PG · Confluent Kafka · S3 | 2 migrate, **1 gap** (S3) |
| [pulseboard.env](pulseboard.env) | Lovable-style dashboard | Supabase PG · Upstash Redis · S3 | 2 migrate, **1 gap** (S3) |

**Other stacks** — to show detection isn't Supabase-only:

| File | App | Stack | Aiven verdict |
| --- | --- | --- | --- |
| [shopflow.env](shopflow.env) | Headless commerce API | PlanetScale MySQL · Redis Cloud · Elastic Cloud · Confluent Kafka | **4 migrate**, 0 gap |
| [metrichub.env](metrichub.env) | Telemetry ingest + analytics | RDS PG · ClickHouse · Kafka · MongoDB Atlas · S3 | 3 migrate, **2 gaps** (Mongo, S3) |

`vibenote` is the canonical vibe-coded env (URL + anon key only — yet still resolves
to Supabase Postgres); `shopflow` is the "everything moves" win; `metrichub` is the
honest one that surfaces the gaps the pitch says Aiven should close.

## Run the detector

```sh
npx tsx server/agents/env-detect.ts samples/shopflow.env          # pretty
npx tsx server/agents/env-detect.ts samples/metrichub.env --json  # structured
```

## What maps onto Aiven

| Detected | Aiven target | Verdict |
| --- | --- | --- |
| Postgres (Supabase, RDS, Neon, …) | Aiven for PostgreSQL | ✅ migrate |
| MySQL / MariaDB (PlanetScale, …) | Aiven for MySQL | ✅ migrate |
| Redis (Upstash, Redis Cloud, …) | Aiven for Caching (Valkey) | ✅ migrate |
| Kafka (Confluent, MSK, …) | Aiven for Apache Kafka | ✅ migrate |
| Elasticsearch (Elastic Cloud, …) | Aiven for OpenSearch | ✅ migrate |
| ClickHouse | Aiven for ClickHouse | ✅ migrate |
| Cassandra / Scylla | Aiven for Apache Cassandra | ✅ migrate |
| RabbitMQ | Aiven for Apache Kafka | 🟡 adapter (remodel queues as topics) |
| MongoDB (Atlas, …) | — none today | ⛔ gap → PG + JSONB, or Aiven should build it |
| S3 / object storage | — none today | ⛔ gap → Aiven for Object Storage |

Credentials and non-infra vars (`*_API_KEY`, `STRIPE_SECRET_KEY`, `SUPABASE_ANON_KEY`,
`JWT_SECRET`, …) are recognized as **passthrough** and excluded from the service count.
