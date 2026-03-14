#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const hookEventName = process.argv[2] ?? "unknown";

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8").trim();
}

function safeJsonParse(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { rawStdin: text };
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeWhitespace(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripDiacritics(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

function slugify(value, fallback = "untitled-chat") {
  const normalized = stripDiacritics(normalizeWhitespace(value))
    .toLowerCase()
    .replace(/[^a-z0-9._ -]/g, "")
    .replace(/[ _]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return normalized || fallback;
}

function formatFileTimestamp(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d}_${hh}-${mm}-${ss}`;
}

function formatHumanTimestamp(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function shortJson(value, maxLength = 400) {
  try {
    const text = JSON.stringify(value);
    return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
  } catch {
    return String(value);
  }
}

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function tryReadJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function appendLine(filePath, line) {
  fs.appendFileSync(filePath, `${line}\n`, "utf8");
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
}

function extractSessionId(payload) {
  return String(
    pickFirst(
      payload.sessionId,
      payload.session_id,
      payload.chatId,
      payload.chat_id,
      payload.conversationId,
      payload.conversation_id,
      payload.context?.sessionId,
      payload.context?.chatId,
      payload.metadata?.sessionId,
      payload.metadata?.chatId,
      payload.id
    ) ?? `unknown-session-${Date.now()}`
  );
}

function extractChatTitle(payload) {
  return normalizeWhitespace(
    pickFirst(
      payload.chatTitle,
      payload.chat_title,
      payload.sessionTitle,
      payload.session_title,
      payload.conversationTitle,
      payload.conversation_title,
      payload.title,
      payload.prompt,
      payload.userPrompt,
      payload.user_prompt,
      payload.input?.prompt,
      payload.input?.userPrompt,
      payload.message,
      payload.rawStdin
    ) ?? "Untitled chat"
  );
}

function extractModel(payload) {
  return pickFirst(
    payload.model,
    payload.modelName,
    payload.model_name,
    payload.usage?.model,
    payload.metadata?.model
  );
}

function extractTokens(payload) {
  const input =
    pickFirst(
      payload.tokens?.input,
      payload.usage?.inputTokens,
      payload.usage?.input_tokens,
      payload.inputTokens,
      payload.input_tokens,
      payload.promptTokens,
      payload.prompt_tokens
    ) ?? null;

  const output =
    pickFirst(
      payload.tokens?.output,
      payload.usage?.outputTokens,
      payload.usage?.output_tokens,
      payload.outputTokens,
      payload.output_tokens,
      payload.completionTokens,
      payload.completion_tokens
    ) ?? null;

  const cached =
    pickFirst(
      payload.tokens?.cached,
      payload.usage?.cachedTokens,
      payload.usage?.cached_tokens,
      payload.cachedTokens,
      payload.cached_tokens
    ) ?? null;

  return { input, output, cached };
}

function extractCost(payload) {
  return pickFirst(
    payload.costUsd,
    payload.cost_usd,
    payload.usage?.costUsd,
    payload.usage?.cost_usd,
    payload.billing?.costUsd,
    payload.billing?.cost_usd,
    null
  );
}

function extractAgentName(payload) {
  return pickFirst(
    payload.agent,
    payload.agentName,
    payload.agent_name,
    payload.subagent,
    payload.subagentName,
    payload.subagent_name,
    payload.delegate,
    payload.delegateName,
    payload.delegate_name
  );
}

function extractDelegate(payload) {
  return pickFirst(
    payload.delegate,
    payload.delegateName,
    payload.delegate_name,
    payload.subagent,
    payload.subagentName,
    payload.subagent_name,
    payload.tool === "subagent" ? payload.name : null
  );
}

function extractToolNames(payload) {
  return uniq(
    asArray(
      pickFirst(
        payload.tools,
        payload.toolNames,
        payload.tool_names,
        payload.tool,
        payload.toolName,
        payload.tool_name
      )
    ).map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return pickFirst(item.name, item.tool, item.toolName, item.type, item.id);
      }
      return null;
    })
  );
}

function extractSkills(payload) {
  return uniq(
    asArray(
      pickFirst(
        payload.skills,
        payload.skillNames,
        payload.skill_names,
        payload.skill,
        payload.skillName,
        payload.skill_name
      )
    ).map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return pickFirst(item.name, item.skill, item.skillName, item.id);
      }
      return null;
    })
  );
}

function extractFiles(payload) {
  const read = uniq(
    asArray(
      pickFirst(
        payload.filesRead,
        payload.files_read,
        payload.readFiles,
        payload.read_files,
        payload.file?.path && hookEventName.includes("Read") ? [payload.file.path] : null,
        payload.path && hookEventName.includes("Read") ? [payload.path] : null
      )
    ).map((item) => (typeof item === "string" ? item : item?.path ?? null))
  );

  const written = uniq(
    asArray(
      pickFirst(
        payload.filesWritten,
        payload.files_written,
        payload.writtenFiles,
        payload.written_files,
        payload.file?.path &&
          (hookEventName.includes("Edit") || hookEventName.includes("Write"))
          ? [payload.file.path]
          : null,
        payload.path &&
          (hookEventName.includes("Edit") || hookEventName.includes("Write"))
          ? [payload.path]
          : null
      )
    ).map((item) => (typeof item === "string" ? item : item?.path ?? null))
  );

  const created = uniq(
    asArray(
      pickFirst(payload.filesCreated, payload.files_created, payload.createdFiles, payload.created_files)
    ).map((item) => (typeof item === "string" ? item : item?.path ?? null))
  );

  const deleted = uniq(
    asArray(
      pickFirst(payload.filesDeleted, payload.files_deleted, payload.deletedFiles, payload.deleted_files)
    ).map((item) => (typeof item === "string" ? item : item?.path ?? null))
  );

  return { read, written, created, deleted };
}

function extractCommands(payload) {
  const command = pickFirst(
    payload.command,
    payload.cmd,
    payload.shellCommand,
    payload.shell_command,
    payload.input?.command
  );

  const commands = asArray(pickFirst(payload.commands, command ? [{ cmd: command }] : []))
    .map((item) => {
      if (typeof item === "string") {
        return {
          cmd: item,
          cwd: null,
          exitCode: null,
          durationMs: null,
          stdoutPreview: null,
          stderrPreview: null
        };
      }

      const stdoutPreview = pickFirst(item.stdoutPreview, item.stdout, item.output?.stdout, null);
      const stderrPreview = pickFirst(item.stderrPreview, item.stderr, item.output?.stderr, null);

      return {
        cmd: pickFirst(item.cmd, item.command, item.shellCommand, null),
        cwd: pickFirst(item.cwd, item.workingDirectory, item.working_directory, null),
        exitCode: pickFirst(item.exitCode, item.exit_code, item.statusCode, null),
        durationMs: pickFirst(item.durationMs, item.duration_ms, null),
        stdoutPreview:
          stdoutPreview === null ? null : String(stdoutPreview).slice(0, 500),
        stderrPreview:
          stderrPreview === null ? null : String(stderrPreview).slice(0, 500)
      };
    })
    .filter((item) => item.cmd);

  return commands;
}

function extractRetry(payload) {
  const count = Number(
    pickFirst(
      payload.retry?.count,
      payload.retryCount,
      payload.retry_count,
      payload.attempt && Number(payload.attempt) > 1 ? Number(payload.attempt) - 1 : 0,
      0
    )
  );

  const attempt = Number(
    pickFirst(payload.retry?.attempt, payload.attempt, payload.retryAttempt, payload.retry_attempt, count + 1)
  );

  const previousStatuses = asArray(
    pickFirst(payload.retry?.previousStatuses, payload.previousStatuses, payload.previous_statuses, [])
  ).map(String);

  const reason = pickFirst(payload.retry?.reason, payload.retryReason, payload.retry_reason, null);

  return {
    count: Number.isFinite(count) ? count : 0,
    attempt: Number.isFinite(attempt) ? attempt : 1,
    reason,
    previousStatuses
  };
}

function extractPlanStep(payload) {
  const index = pickFirst(
    payload.planStep?.index,
    payload.plan_step?.index,
    payload.stepIndex,
    payload.step_index,
    null
  );

  const label = pickFirst(
    payload.planStep?.label,
    payload.plan_step?.label,
    payload.stepLabel,
    payload.step_label,
    payload.task,
    null
  );

  if (index === null && !label) return null;
  return {
    index: index === null ? null : Number(index),
    label
  };
}

function extractRiskFlags(payload, commands, files) {
  const flags = new Set(
    asArray(pickFirst(payload.riskFlags, payload.risk_flags, [])).map(String)
  );

  for (const file of [...files.read, ...files.written, ...files.created, ...files.deleted]) {
    const lower = String(file).toLowerCase();

    if (lower.includes("prisma/") || lower.endsWith(".sql")) flags.add("database-migration");
    if (lower.includes("auth")) flags.add("auth-change");
    if (lower.includes("payment") || lower.includes("loan") || lower.includes("transaction")) flags.add("payments-logic");
    if (lower.includes(".env") || lower.includes("docker") || lower.includes("compose") || lower.includes("zerops")) {
      flags.add("infra-config");
    }
  }

  for (const command of commands) {
    const cmd = String(command.cmd).toLowerCase();
    if (/(rm\s+-rf|git\s+reset\s+--hard|drop\s+database|prisma\s+migrate\s+reset)/.test(cmd)) {
      flags.add("destructive-command");
    }
    if (/prisma\s+migrate|db\s+push|psql|createdb|dropdb/.test(cmd)) {
      flags.add("database-migration");
    }
    if (/playwright|vitest|pnpm\s+test|npm\s+test|bun\s+test/.test(cmd)) {
      flags.add("verification");
    }
  }

  return [...flags];
}

function computeStatusAndOutcome(payload, hookName) {
  const explicitStatus = pickFirst(payload.status, payload.state, payload.resultStatus, null);
  const explicitOutcome = pickFirst(payload.finalOutcome, payload.final_outcome, payload.outcome, null);

  if (explicitStatus || explicitOutcome) {
    return {
      status: explicitStatus ?? "completed",
      finalOutcome: explicitOutcome ?? null
    };
  }

  if (hookName === "sessionStart") {
    return { status: "started", finalOutcome: null };
  }
  if (hookName === "sessionEnd") {
    return { status: "completed", finalOutcome: "success" };
  }
  if (hookName === "postToolUseFailure") {
    return { status: "error", finalOutcome: "failed" };
  }
  if (hookName.startsWith("before")) {
    return { status: "running", finalOutcome: null };
  }
  return { status: "completed", finalOutcome: null };
}

function summarizeResult(payload) {
  return normalizeWhitespace(
    pickFirst(
      payload.resultSummary,
      payload.result_summary,
      payload.summary,
      payload.message,
      payload.error,
      payload.stderr,
      payload.stdout,
      ""
    )
  ).slice(0, 500);
}

function inferPhase(hookName) {
  if (hookName === "sessionStart" || hookName === "sessionEnd") return "lifecycle";
  if (hookName.includes("Shell")) return "shell";
  if (hookName.includes("Tool")) return "tool";
  return "execution";
}

function getRootDir() {
  return process.cwd();
}

function getPaths() {
  const rootDir = getRootDir();
  const chatLogsDir = path.join(rootDir, "tmp", "chat-logs");
  const machineDir = path.join(chatLogsDir, "machine");
  const indexDir = path.join(machineDir, "_index");

  ensureDir(chatLogsDir);
  ensureDir(machineDir);
  ensureDir(indexDir);

  return { rootDir, chatLogsDir, machineDir, indexDir };
}

function getIndexPath(indexDir, sessionId) {
  return path.join(indexDir, `${slugify(sessionId, "unknown-session")}.json`);
}

function findExistingSessionFiles(machineDir, sessionId) {
  const suffixJsonl = `_${sessionId}.jsonl`;
  const entries = fs.readdirSync(machineDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (entry.name.endsWith(suffixJsonl)) {
      const prefix = entry.name.slice(0, -suffixJsonl.length);
      return {
        jsonlPath: path.join(machineDir, entry.name),
        summaryPath: path.join(machineDir, `${prefix}_${sessionId}.summary.json`)
      };
    }
  }

  return null;
}

function createSessionFiles(paths, sessionId, chatTitle, now) {
  const timestamp = formatFileTimestamp(now);
  const safeSessionId = slugify(sessionId, "unknown-session");
  const titleSlug = slugify(chatTitle, "untitled-chat");

  const jsonlName = `${timestamp}_${safeSessionId}.jsonl`;
  const summaryName = `${timestamp}_${safeSessionId}.summary.json`;
  const humanName = `${timestamp}_${titleSlug}.md`;

  const jsonlPath = path.join(paths.machineDir, jsonlName);
  const summaryPath = path.join(paths.machineDir, summaryName);
  const humanPath = path.join(paths.chatLogsDir, humanName);

  return { jsonlPath, summaryPath, humanPath, timestamp, sessionId, chatTitle };
}

function loadOrCreateSessionMeta(paths, sessionId, chatTitle, now) {
  const indexPath = getIndexPath(paths.indexDir, sessionId);
  const existingMeta = tryReadJson(indexPath, null);

  if (existingMeta && fileExists(existingMeta.jsonlPath) && fileExists(existingMeta.humanPath)) {
    if (!existingMeta.chatTitle || existingMeta.chatTitle === "Untitled chat") {
      existingMeta.chatTitle = chatTitle;
      writeFile(indexPath, JSON.stringify(existingMeta, null, 2));
    }
    return existingMeta;
  }

  const existingFiles = findExistingSessionFiles(paths.machineDir, sessionId);
  if (existingFiles && existingMeta) return existingMeta;

  const meta = createSessionFiles(paths, sessionId, chatTitle, now);
  writeFile(indexPath, JSON.stringify(meta, null, 2));
  return meta;
}

function initHumanLogIfNeeded(humanPath, sessionId, chatTitle, startedAt) {
  if (fileExists(humanPath)) return;

  writeFile(
    humanPath,
    `# Chat log — ${chatTitle}

- Started: ${formatHumanTimestamp(startedAt)}
- Session ID: ${sessionId}
- Status: running
- Current outcome: n/a

## Summary
- Total duration: 00:00:00
- Delegations: 0
- Retries: 0
- Models used: n/a
- Tokens: input 0 / output 0 / cached 0
- Cost: unavailable

## Timeline

`
  );
}

function initSummaryIfNeeded(summaryPath, sessionId, chatTitle, now) {
  if (fileExists(summaryPath)) return;

  const summary = {
    sessionId,
    chatTitle,
    startedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    endedAt: null,
    status: "running",
    finalOutcome: null,
    modelsUsed: [],
    totals: {
      durationMs: 0,
      events: 0,
      delegations: 0,
      toolCalls: 0,
      retries: 0,
      tokens: {
        input: 0,
        output: 0,
        cached: 0
      },
      costUsd: null
    },
    delegationGraph: [],
    files: {
      read: [],
      written: [],
      created: [],
      deleted: []
    },
    toolsUsed: {},
    skillsUsed: {},
    riskFlags: [],
    lastResultSummary: ""
  };

  writeFile(summaryPath, JSON.stringify(summary, null, 2));
}

function upsertCounter(map, key, increment = 1) {
  if (!key) return;
  map[key] = (map[key] ?? 0) + increment;
}

function updateSummary(summaryPath, event) {
  const summary = tryReadJson(summaryPath, null);
  if (!summary) return;

  summary.updatedAt = event.ts;
  summary.status = event.status === "error" ? "error" : summary.status;

  if (event.hook === "sessionEnd") {
    summary.endedAt = event.ts;
    summary.status = "completed";
    summary.finalOutcome = event.finalOutcome ?? summary.finalOutcome ?? "success";
  } else if (event.finalOutcome) {
    summary.finalOutcome = event.finalOutcome;
  }

  summary.modelsUsed = uniq([...summary.modelsUsed, event.model].filter(Boolean));

  summary.totals.events += 1;
  summary.totals.durationMs += Number(event.durationMs ?? 0);

  if (event.delegate) {
    summary.totals.delegations += 1;
    const existing = summary.delegationGraph.find(
      (item) => item.from === (event.agent ?? "unknown") && item.to === event.delegate
    );
    if (existing) {
      existing.count += 1;
    } else {
      summary.delegationGraph.push({
        from: event.agent ?? "unknown",
        to: event.delegate,
        count: 1
      });
    }
  }

  if (event.tools.length > 0) {
    summary.totals.toolCalls += event.tools.length;
    for (const tool of event.tools) upsertCounter(summary.toolsUsed, tool, 1);
  }

  if (event.skills.length > 0) {
    for (const skill of event.skills) upsertCounter(summary.skillsUsed, skill, 1);
  }

  summary.totals.retries += Number(event.retry?.count ?? 0);

  summary.totals.tokens.input += Number(event.tokens.input ?? 0);
  summary.totals.tokens.output += Number(event.tokens.output ?? 0);
  summary.totals.tokens.cached += Number(event.tokens.cached ?? 0);

  if (typeof event.costUsd === "number") {
    summary.totals.costUsd = (summary.totals.costUsd ?? 0) + event.costUsd;
  }

  summary.files.read = uniq([...summary.files.read, ...event.filesRead]);
  summary.files.written = uniq([...summary.files.written, ...event.filesWritten]);
  summary.files.created = uniq([...summary.files.created, ...event.filesCreated]);
  summary.files.deleted = uniq([...summary.files.deleted, ...event.filesDeleted]);

  summary.riskFlags = uniq([...summary.riskFlags, ...event.riskFlags]);
  summary.lastResultSummary = event.resultSummary || summary.lastResultSummary;

  writeFile(summaryPath, JSON.stringify(summary, null, 2));
}

function formatDuration(durationMs) {
  const totalSeconds = Math.max(0, Math.floor((durationMs ?? 0) / 1000));
  const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function refreshHumanHeader(humanPath, summaryPath) {
  const summary = tryReadJson(summaryPath, null);
  if (!summary || !fileExists(humanPath)) return;

  const existing = fs.readFileSync(humanPath, "utf8");
  const timelineIndex = existing.indexOf("## Timeline");
  const timeline = timelineIndex >= 0 ? existing.slice(timelineIndex) : "## Timeline\n\n";

  const content = `# Chat log — ${summary.chatTitle}

- Started: ${formatHumanTimestamp(new Date(summary.startedAt))}
- Session ID: ${summary.sessionId}
- Status: ${summary.status}
- Current outcome: ${summary.finalOutcome ?? "n/a"}

## Summary
- Total duration: ${formatDuration(summary.totals.durationMs)}
- Delegations: ${summary.totals.delegations}
- Retries: ${summary.totals.retries}
- Models used: ${summary.modelsUsed.length ? summary.modelsUsed.join(", ") : "n/a"}
- Tokens: input ${summary.totals.tokens.input} / output ${summary.totals.tokens.output} / cached ${summary.totals.tokens.cached}
- Cost: ${typeof summary.totals.costUsd === "number" ? `$${summary.totals.costUsd.toFixed(6)}` : "unavailable"}

${timeline}`;

  writeFile(humanPath, content);
}

function appendHumanTimeline(humanPath, event) {
  const time = new Date(event.ts);
  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const ss = String(time.getSeconds()).padStart(2, "0");

  const lines = [];
  lines.push(`### ${hh}:${mm}:${ss} — ${event.hook}`);
  lines.push(`- Phase: ${event.phase}`);
  lines.push(`- Status: ${event.status}`);
  if (event.finalOutcome) lines.push(`- Outcome: ${event.finalOutcome}`);
  if (event.agent) lines.push(`- Agent: ${event.agent}`);
  if (event.delegate) lines.push(`- Delegate: ${event.delegate}`);
  if (event.delegationDepth !== null) lines.push(`- Delegation depth: ${event.delegationDepth}`);
  if (event.reason) lines.push(`- Reason: ${event.reason}`);
  if (event.model) lines.push(`- Model: ${event.model}`);

  const tokenLine = `- Tokens: input ${event.tokens.input ?? "n/a"} / output ${event.tokens.output ?? "n/a"} / cached ${event.tokens.cached ?? "n/a"}`;
  lines.push(tokenLine);

  if (typeof event.costUsd === "number") {
    lines.push(`- Cost: $${event.costUsd.toFixed(6)}`);
  }

  if (event.tools.length) lines.push(`- Tools: ${event.tools.join(", ")}`);
  if (event.skills.length) lines.push(`- Skills: ${event.skills.join(", ")}`);

  if (event.planStep) {
    lines.push(
      `- Plan step: ${event.planStep.index ?? "?"}${event.planStep.label ? ` — ${event.planStep.label}` : ""}`
    );
  }

  if (event.retry?.count) {
    lines.push(
      `- Retry: count ${event.retry.count}, attempt ${event.retry.attempt}${event.retry.reason ? `, reason ${event.retry.reason}` : ""}`
    );
  }

  if (event.commands.length) {
    lines.push("");
    lines.push("Commands:");
    for (const command of event.commands) {
      lines.push(
        `- \`${command.cmd}\`${command.exitCode !== null ? ` → exit ${command.exitCode}` : ""}${
          command.durationMs !== null ? ` (${command.durationMs}ms)` : ""
        }`
      );
    }
  }

  if (event.filesRead.length) {
    lines.push("");
    lines.push("Files read:");
    for (const file of event.filesRead) lines.push(`- \`${file}\``);
  }

  if (event.filesWritten.length) {
    lines.push("");
    lines.push("Files written:");
    for (const file of event.filesWritten) lines.push(`- \`${file}\``);
  }

  if (event.filesCreated.length) {
    lines.push("");
    lines.push("Files created:");
    for (const file of event.filesCreated) lines.push(`- \`${file}\``);
  }

  if (event.filesDeleted.length) {
    lines.push("");
    lines.push("Files deleted:");
    for (const file of event.filesDeleted) lines.push(`- \`${file}\``);
  }

  if (event.riskFlags.length) {
    lines.push("");
    lines.push(`Risks: ${event.riskFlags.join(", ")}`);
  }

  if (event.resultSummary) {
    lines.push("");
    lines.push(`Result: ${event.resultSummary}`);
  }

  lines.push("");
  appendLine(humanPath, lines.join("\n"));
}

function buildEvent(payload, now) {
  const sessionId = extractSessionId(payload);
  const chatTitle = extractChatTitle(payload);
  const model = extractModel(payload);
  const tokens = extractTokens(payload);
  const costUsdRaw = extractCost(payload);
  const tools = extractToolNames(payload);
  const skills = extractSkills(payload);
  const files = extractFiles(payload);
  const commands = extractCommands(payload);
  const retry = extractRetry(payload);
  const planStep = extractPlanStep(payload);
  const { status, finalOutcome } = computeStatusAndOutcome(payload, hookEventName);

  const agent = extractAgentName(payload);
  const delegate = extractDelegate(payload);

  const riskFlags = extractRiskFlags(payload, commands, files);

  const event = {
    eventId: String(
      pickFirst(payload.eventId, payload.event_id, payload.id, `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
    ),
    parentEventId: pickFirst(payload.parentEventId, payload.parent_event_id, payload.parentId, null),
    ts: now.toISOString(),
    sessionId,
    chatTitle,
    hook: hookEventName,
    event: pickFirst(payload.event, hookEventName),
    phase: inferPhase(hookEventName),
    agent,
    delegate,
    delegationDepth: pickFirst(payload.delegationDepth, payload.delegation_depth, delegate ? 1 : null),
    task: pickFirst(payload.task, payload.prompt, payload.userPrompt, null),
    reason: pickFirst(payload.reason, payload.why, null),
    status,
    finalOutcome,
    durationMs: pickFirst(payload.durationMs, payload.duration_ms, null),
    model,
    tokens,
    costUsd: typeof costUsdRaw === "number" ? costUsdRaw : costUsdRaw === null ? null : Number(costUsdRaw),
    tools,
    skills,
    filesRead: files.read,
    filesWritten: files.written,
    filesCreated: files.created,
    filesDeleted: files.deleted,
    commands,
    retry,
    planStep,
    resultSummary: summarizeResult(payload),
    riskFlags,
    rawPreview: shortJson(payload, 600)
  };

  return event;
}

async function main() {
  try {
    const now = new Date();
    const rawStdin = await readStdin();
    const payload = safeJsonParse(rawStdin);

    const event = buildEvent(payload, now);
    const paths = getPaths();
    const meta = loadOrCreateSessionMeta(paths, event.sessionId, event.chatTitle, now);

    initHumanLogIfNeeded(meta.humanPath, event.sessionId, event.chatTitle, now);
    initSummaryIfNeeded(meta.summaryPath, event.sessionId, event.chatTitle, now);

    appendLine(meta.jsonlPath, JSON.stringify(event));
    updateSummary(meta.summaryPath, event);
    appendHumanTimeline(meta.humanPath, event);
    refreshHumanHeader(meta.humanPath, meta.summaryPath);

    process.exit(0);
  } catch (error) {
    try {
      const rootDir = process.cwd();
      const fallbackDir = path.join(rootDir, "tmp", "chat-logs");
      ensureDir(fallbackDir);

      const errorLog = path.join(fallbackDir, "_logger-errors.log");
      appendLine(
        errorLog,
        `[${new Date().toISOString()}] ${error instanceof Error ? error.stack ?? error.message : String(error)}`
      );
    } catch {
      // ignore secondary logging failures
    }

    process.exit(0);
  }
}

main();