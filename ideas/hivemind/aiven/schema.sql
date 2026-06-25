-- Hivemind schema for Aiven for PostgreSQL (with the pgvector extension).
-- Apply once after provisioning:  psql "$PG_CONNECTION_STRING" -f aiven/schema.sql

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,
  ts          BIGINT NOT NULL,
  actor       TEXT   NOT NULL,
  session_id  TEXT   NOT NULL,
  project     TEXT   NOT NULL,
  cwd         TEXT,
  git_branch  TEXT,
  kind        TEXT   NOT NULL,
  text        TEXT   NOT NULL,
  tool        TEXT,
  model       TEXT,
  embedding   vector(256),  -- nullable; populated only when an embedder is configured
  tsv         tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED
);

CREATE INDEX IF NOT EXISTS events_ts_idx      ON events (ts DESC);
CREATE INDEX IF NOT EXISTS events_session_idx ON events (session_id, ts DESC);
CREATE INDEX IF NOT EXISTS events_tsv_idx     ON events USING GIN (tsv);
-- Create the ANN index after some embeddings exist (and tune `lists`):
-- CREATE INDEX events_embedding_idx ON events USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Materialized "who is doing what" — upserted on every event.
CREATE TABLE IF NOT EXISTS sessions (
  session_id  TEXT PRIMARY KEY,
  actor       TEXT,
  project     TEXT,
  title       TEXT,
  model       TEXT,
  git_branch  TEXT,
  last_ts     BIGINT,
  last_kind   TEXT,
  last_text   TEXT,
  event_count BIGINT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS sessions_last_ts_idx ON sessions (last_ts DESC);
