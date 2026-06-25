// Hivemind — parse one raw Claude Code transcript record into a normalized ActivityEvent.
// Pure + testable. Zero external deps (CORE module). Internal imports use the ".ts" extension.
import { createHash } from "node:crypto";
import path from "node:path";
import type { ActivityEvent, EventKind } from "./types.ts";

export interface ParseCtx {
  actor: string;
  redactSecrets: boolean;
}

const TEXT_LIMIT = 280; // human-readable one-liner cap for user/assistant text
const HINT_LIMIT = 120; // tool_use hint cap

/** Truncate to `max` chars, appending an ellipsis when cut. */
function clamp(s: string, max: number): string {
  const t = s.trim();
  return t.length > max ? t.slice(0, max).trimEnd() + "…" : t;
}

/** Short stable hash for fallback ids. */
function hash(s: string): string {
  return createHash("sha1").update(s).digest("hex");
}

/** Coerce an unknown value to a trimmed string, or "" if not a usable string. */
function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Redact obvious secrets (sk-..., ghp_..., AKIA..., Bearer tokens, long hex / JWT) from text.
 * Conservative: replaces matched tokens with a "[redacted]" placeholder.
 */
export function redact(text: string): string {
  if (!text) return text;
  let out = text;
  // Bearer <token>  → keep the "Bearer" label, hide the token.
  out = out.replace(/\bBearer\s+[A-Za-z0-9._\-]+/g, "Bearer [redacted]");
  // OpenAI-style keys: sk-..., sk-proj-..., etc.
  out = out.replace(/\bsk-[A-Za-z0-9_\-]{16,}/g, "[redacted]");
  // GitHub tokens: ghp_, gho_, ghu_, ghs_, ghr_, github_pat_
  out = out.replace(/\bgh[pousr]_[A-Za-z0-9]{20,}/g, "[redacted]");
  out = out.replace(/\bgithub_pat_[A-Za-z0-9_]{20,}/g, "[redacted]");
  // AWS access key ids: AKIA / ASIA + 16 uppercase alnum.
  out = out.replace(/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, "[redacted]");
  // Google API keys: AIza...
  out = out.replace(/\bAIza[A-Za-z0-9_\-]{30,}/g, "[redacted]");
  // Slack tokens: xox[abprs]-...
  out = out.replace(/\bxox[abprs]-[A-Za-z0-9\-]{10,}/g, "[redacted]");
  // JWTs: three base64url segments separated by dots.
  out = out.replace(/\beyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/g, "[redacted]");
  // Long hex blobs (e.g. raw API secrets / hashes) — 32+ hex chars.
  out = out.replace(/\b[0-9a-fA-F]{32,}\b/g, "[redacted]");
  return out;
}

/** Derive a short human hint from a tool_use block's input, keyed off the tool name. */
function toolHint(name: string, input: unknown): string {
  const inp = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const pick = (...keys: string[]): string => {
    for (const k of keys) {
      const v = asString(inp[k]);
      if (v) return v;
    }
    return "";
  };

  let hint = "";
  switch (name) {
    case "Bash":
      hint = pick("description", "command");
      break;
    case "Read":
    case "Edit":
    case "Write":
    case "NotebookEdit":
      hint = pick("file_path", "notebook_path");
      break;
    case "Grep":
      hint = pick("pattern");
      break;
    case "Glob":
      hint = pick("pattern");
      break;
    case "WebSearch":
    case "WebFetch":
      hint = pick("query", "url");
      break;
    case "Task":
    case "Agent":
      hint = pick("description");
      break;
    default:
      break;
  }
  // Fallback: first string-valued input field.
  if (!hint) {
    for (const v of Object.values(inp)) {
      const s = asString(v);
      if (s) {
        hint = s;
        break;
      }
    }
  }
  return hint;
}

/** Find the first assistant content block of each meaningful kind. */
function scanAssistantBlocks(content: unknown): {
  toolUse: { name: string; input: unknown } | null;
  text: string | null;
} {
  let toolUse: { name: string; input: unknown } | null = null;
  let text: string | null = null;
  if (!Array.isArray(content)) return { toolUse, text };
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const b = block as Record<string, unknown>;
    const type = b.type;
    if (type === "thinking" || type === "redacted_thinking") continue; // always skip
    if (type === "tool_use" && !toolUse) {
      toolUse = { name: asString(b.name) || "tool", input: b.input };
    } else if (type === "text" && text == null) {
      const t = asString(b.text);
      if (t) text = t;
    }
  }
  return { toolUse, text };
}

/** Try to discover a tool name from a user tool_result array (for nicer labels). */
function toolResultName(content: unknown): string {
  if (!Array.isArray(content)) return "";
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const b = block as Record<string, unknown>;
    if (b.type === "tool_result") {
      const n = asString(b.tool_name) || asString((b as any).name);
      if (n) return n;
    }
  }
  return "";
}

/**
 * Parse ONE raw transcript record (already JSON.parsed). Returns an event, or null to skip.
 * Pure: depends only on `rec` and `ctx`.
 */
export function parseRecord(rec: any, ctx: ParseCtx): ActivityEvent | null {
  if (!rec || typeof rec !== "object") return null;

  const type: string = typeof rec.type === "string" ? rec.type : "";
  const message = rec.message && typeof rec.message === "object" ? rec.message : undefined;

  // Common fields shared by every emitted event.
  const sessionId = asString(rec.sessionId) || "unknown";
  const cwd = asString(rec.cwd);
  const project = cwd ? path.basename(cwd) || "unknown" : "unknown";
  const gitBranch = asString(rec.gitBranch);
  const model = message ? asString(message.model) : "";

  const parsedTs = Date.parse(asString(rec.timestamp));
  const ts = Number.isFinite(parsedTs) ? parsedTs : 0;

  const id = asString(rec.uuid) || `${sessionId}:${hash(JSON.stringify(rec)).slice(0, 12)}`;

  // Decide kind / tool / text per record type.
  let kind: EventKind;
  let text: string;
  let tool: string | undefined;

  if (type === "assistant") {
    const { toolUse, text: blockText } = scanAssistantBlocks(message?.content);
    if (toolUse) {
      // Prefer tool_use over text — it's more informative.
      kind = "tool_use";
      tool = toolUse.name;
      const hint = clamp(toolHint(toolUse.name, toolUse.input), HINT_LIMIT);
      text = hint ? `${toolUse.name} ${hint}` : toolUse.name;
    } else if (blockText) {
      kind = "assistant";
      text = clamp(blockText, TEXT_LIMIT);
    } else {
      // Only thinking (or empty) — nothing meaningful to show.
      return null;
    }
  } else if (type === "user") {
    const content = message?.content;
    if (typeof content === "string") {
      const trimmed = content.trim();
      // Skip system-injected noise.
      if (
        trimmed === "" ||
        trimmed.startsWith("Caveat:") ||
        trimmed.startsWith("Shell cwd was reset") ||
        trimmed.startsWith("<") ||
        trimmed.includes("[Request interrupted")
      ) {
        return null;
      }
      kind = "user";
      text = clamp(trimmed, TEXT_LIMIT);
    } else if (Array.isArray(content)) {
      // tool_result payloads — de-emphasized in the UI.
      kind = "tool_result";
      const tn = toolResultName(content);
      text = tn ? `↳ result (${tn})` : "↳ result";
    } else {
      return null;
    }
  } else if (type === "custom-title" || type === "ai-title") {
    const title = asString(rec.customTitle) || asString(rec.aiTitle) || asString(rec.title);
    if (!title) return null;
    kind = "title";
    text = clamp(title, TEXT_LIMIT);
  } else {
    // attachment, system, queue-operation, mode, last-prompt, and anything unknown → skip.
    return null;
  }

  if (ctx.redactSecrets) text = redact(text);

  const event: ActivityEvent = {
    id,
    ts,
    actor: ctx.actor,
    sessionId,
    project,
    kind,
    text,
  };
  if (cwd) event.cwd = cwd;
  if (gitBranch) event.gitBranch = gitBranch;
  if (tool) event.tool = tool;
  if (model) event.model = model;

  return event;
}
