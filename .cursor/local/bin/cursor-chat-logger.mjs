#!/usr/bin/env node

/**
 * Session-level chat logger. Fires only on sessionStart and sessionEnd.
 * All other hook events are ignored immediately.
 *
 * Output: tmp/chat-logs/sessions.jsonl — one complete JSON record per session per line.
 * Temp:   tmp/chat-logs/.session-<ppid>.json — open-session marker, deleted on sessionEnd.
 */

import fs from "node:fs";
import path from "node:path";

const hookEvent = process.argv[2] ?? "unknown";

// Exit immediately for hooks we don't process — zero overhead on every tool call.
if (hookEvent !== "sessionStart" && hookEvent !== "sessionEnd") process.exit(0);

const ROOT_DIR = process.cwd();
const LOGS_DIR = path.join(ROOT_DIR, "tmp", "chat-logs");
const SESSIONS_JSONL = path.join(LOGS_DIR, "sessions.jsonl");
const SESSION_TMP = path.join(LOGS_DIR, `.session-${process.ppid}.json`);

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8").trim();
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return {}; }
}

function pick(...values) {
  for (const v of values) if (v !== undefined && v !== null && v !== "") return v;
  return null;
}

function extractSessionId(p) {
  return String(
    pick(
      p.sessionId, p.session_id, p.chatId, p.chat_id,
      p.conversationId, p.conversation_id,
      process.env.CURSOR_SESSION_ID,
      process.env.CURSOR_CHAT_ID,
      `fallback-${process.ppid}`
    )
  );
}

function extractTitle(p) {
  return String(
    pick(p.chatTitle, p.chat_title, p.sessionTitle, p.title, p.prompt, p.userPrompt, "Untitled")
  ).replace(/\s+/g, " ").trim().slice(0, 120);
}

function extractTokens(p) {
  return {
    input: pick(p.tokens?.input, p.usage?.inputTokens, p.usage?.input_tokens, p.inputTokens) ?? null,
    output: pick(p.tokens?.output, p.usage?.outputTokens, p.usage?.output_tokens, p.outputTokens) ?? null,
    cached: pick(p.tokens?.cached, p.usage?.cachedTokens, p.usage?.cached_tokens, p.cachedTokens) ?? null,
  };
}

function extractCost(p) {
  const v = pick(p.costUsd, p.cost_usd, p.usage?.costUsd, p.billing?.costUsd);
  return v === null ? null : Number(v);
}

function handleSessionStart(p, now) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  const record = {
    session_id: extractSessionId(p),
    chat_title: extractTitle(p),
    started_at: now.toISOString(),
    model: pick(p.model, p.modelName, p.model_name) ?? null,
  };
  fs.writeFileSync(SESSION_TMP, JSON.stringify(record), "utf8");
}

function handleSessionEnd(p, now) {
  let start = {};
  try { start = safeJson(fs.readFileSync(SESSION_TMP, "utf8")); } catch {}

  const started = start.started_at ? new Date(start.started_at) : now;

  const record = {
    session_id: start.session_id ?? extractSessionId(p),
    chat_title: start.chat_title ?? extractTitle(p),
    started_at: started.toISOString(),
    ended_at: now.toISOString(),
    duration_ms: now - started,
    model: pick(start.model, p.model, p.modelName, p.model_name) ?? null,
    tokens: extractTokens(p),
    cost_usd: extractCost(p),
    status: pick(p.status, p.finalOutcome, "completed"),
    risk_flags: Array.isArray(p.riskFlags) ? p.riskFlags : [],
    agents_delegated: Array.isArray(p.agentsDelegated) ? p.agentsDelegated : [],
    skills_invoked: Array.isArray(p.skillsInvoked) ? p.skillsInvoked : [],
    verification_outcome: pick(p.verificationOutcome, p.verification?.outcome) ?? null,
    commits_prepared: pick(p.commitsPrepared, p.commits_prepared) ?? null,
  };

  fs.mkdirSync(LOGS_DIR, { recursive: true });
  fs.appendFileSync(SESSIONS_JSONL, JSON.stringify(record) + "\n", "utf8");
  try { fs.unlinkSync(SESSION_TMP); } catch {}
}

async function main() {
  try {
    const now = new Date();
    const p = safeJson(await readStdin());
    if (hookEvent === "sessionStart") handleSessionStart(p, now);
    else handleSessionEnd(p, now);
  } catch (err) {
    try {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
      fs.appendFileSync(
        path.join(LOGS_DIR, "_logger-errors.log"),
        `[${new Date().toISOString()}] ${err?.stack ?? err}\n`,
        "utf8"
      );
    } catch {}
  }
  process.exit(0);
}

main();
