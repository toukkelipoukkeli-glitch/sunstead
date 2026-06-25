// Hivemind — embedders. Turns text into a vector for pgvector cosine search.
//
// Two implementations:
//   - LexicalEmbedder: deterministic hashed bag-of-words, L2-normalized, no network.
//     This is the zero-dependency default; it lets pgvector do lexical-ish cosine offline.
//   - RemoteEmbedder: calls an OpenAI-compatible embeddings endpoint over fetch.
//
// `createEmbedder(config)` returns a RemoteEmbedder when `config.embed` is set,
// otherwise the LexicalEmbedder. No external deps in either path.

import type { Embedder } from "./types.ts";
import type { Config } from "./config.ts";

const DEFAULT_DIM = 256;

/** Split text into lowercase alphanumeric word tokens. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);
}

/**
 * FNV-1a 32-bit string hash. Deterministic, fast, no deps.
 * Used to map a token onto a vector bucket so the same word always lands
 * in the same dimension across machines.
 */
function hash32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    // h *= 16777619, kept in 32-bit unsigned range.
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** L2-normalize a vector in place and return it (zero vector stays zero). */
function l2normalize(vec: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) sumSq += vec[i] * vec[i];
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  }
  return vec;
}

/**
 * Deterministic hashed bag-of-words embedder. Each token bumps the bucket
 * `hash(token) % dim`; the resulting vector is L2-normalized so cosine
 * similarity behaves. Identical input always yields an identical vector,
 * with no network call.
 */
export class LexicalEmbedder implements Embedder {
  readonly dim: number;

  constructor(dim: number = DEFAULT_DIM) {
    this.dim = dim > 0 ? Math.floor(dim) : DEFAULT_DIM;
  }

  async embed(text: string): Promise<number[]> {
    const vec = new Array<number>(this.dim).fill(0);
    for (const token of tokenize(text ?? "")) {
      vec[hash32(token) % this.dim] += 1;
    }
    return l2normalize(vec);
  }
}

/**
 * Calls an OpenAI-compatible embeddings endpoint. POSTs `{ input, model }`
 * with a Bearer key and reads back `{ data: [{ embedding }] }`.
 * Only used by PgStore when `config.embed` is configured.
 */
export class RemoteEmbedder implements Embedder {
  readonly dim: number;
  private readonly url: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(opts: { url: string; apiKey: string; model: string; dim: number }) {
    this.url = opts.url;
    this.apiKey = opts.apiKey;
    this.model = opts.model;
    this.dim = opts.dim > 0 ? Math.floor(opts.dim) : DEFAULT_DIM;
  }

  async embed(text: string): Promise<number[]> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ input: text ?? "", model: this.model }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `RemoteEmbedder: ${res.status} ${res.statusText} from ${this.url}${body ? ` — ${body.slice(0, 200)}` : ""}`,
      );
    }

    const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
    const embedding = json?.data?.[0]?.embedding;
    if (!Array.isArray(embedding)) {
      throw new Error("RemoteEmbedder: response missing data[0].embedding");
    }
    return embedding;
  }
}

/** RemoteEmbedder when config.embed is set, else the zero-dep LexicalEmbedder. */
export function createEmbedder(config: Config): Embedder {
  if (config.embed) {
    return new RemoteEmbedder(config.embed);
  }
  return new LexicalEmbedder(config.embed?.dim ?? DEFAULT_DIM);
}
