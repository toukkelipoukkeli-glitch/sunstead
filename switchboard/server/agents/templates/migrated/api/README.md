# PulseBoard API (generated)

The thin middleware Switchboard generated to replace Supabase. Plain JSON over
HTTP to the front-end; **Aiven for PostgreSQL** underneath.

| Supabase call | Becomes |
| --- | --- |
| `supabase.auth.signUp` | `POST /auth/signup` — `crypt()/gen_salt('bf')` into `app_users` |
| `supabase.auth.signInWithPassword` | `POST /auth/login` — verify with pgcrypto, mint a session token |
| `supabase.from('boards').select()` | `GET /api/boards` |
| `supabase.from('cards').insert()` | `POST /api/cards` (+ `pg_notify`) |
| `supabase.channel().on('postgres_changes')` | `GET /realtime/cards/:boardId` (SSE over LISTEN/NOTIFY) |

Every data handler runs inside `withUser()`, which sets `app.user_id` so the
migrated **RLS policies enforce** on the connection.

## Run locally against Aiven

```sh
npm install
cp .env.example .env      # paste your Aiven DATABASE_URL
npm run dev               # :8089
```

## Deploy to Aiven Apps

`Dockerfile` is ready. Link the Postgres service and Aiven injects
`DATABASE_URL` + `PROJECT_CA_CERT`. For high fan-out realtime, link an Aiven
Kafka service, set `REALTIME=kafka`, and `realtime.kafka.ts` takes over.
