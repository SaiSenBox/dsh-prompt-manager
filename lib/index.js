// dsh-prompt-manager host runtime.
// Keeps an ordered set of user-selected system prompts per live conversation and
// exposes a same-origin loopback API used by the Web client. The prompt library
// is mirrored to a local JSON file so it survives DSH restarts: the Web origin
// can change its port between launches, which isolates browser `localStorage`.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const VERSION = "1.5.0";
const MAX_BODY_BYTES = 256 * 1024;
const MAX_ACTIVE_SESSIONS = 200;
const MAX_ACTIVE_PROMPTS = 12;
const MAX_ACTIVE_CONTENT_LENGTH = 200000;
const MAX_SESSION_ID_LENGTH = 200;
const MAX_PROMPT_ID_LENGTH = 180;
const MAX_TITLE_LENGTH = 160;
const MAX_CONTENT_LENGTH = 100000;
const MAX_LIBRARY_BODY_BYTES = 64 * 1024 * 1024;
const MAX_LIBRARY_PROMPTS = 500;
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;

export const name = "prompt-manager";
export const inject = ["webServer", "systemPrompt", "sessions"];

function errorWithStatus(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function json(res, statusCode, value) {
  if (res.writableEnded) return;
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  res.end(JSON.stringify(value));
}

function methodAllowed(req, res, expected) {
  if (req.method === expected) return true;
  res.writeHead(405, { allow: expected, "cache-control": "no-store" });
  res.end();
  return false;
}

export function isLoopbackAddress(address) {
  const value = String(address || "").toLowerCase().split("%")[0];
  if (value === "::1" || value === "0:0:0:0:0:0:0:1") return true;
  if (value.startsWith("127.") || value.startsWith("::ffff:127.")) return true;
  return /^::ffff:7f[0-9a-f]{2}:[0-9a-f]{1,4}$/.test(value);
}

function remoteMutationEnabled() {
  return /^(1|true|yes)$/i.test(String(process.env.DSH_PROMPT_MANAGER_ALLOW_REMOTE || ""));
}

export function assertMutationRequest(req, allowRemote = false) {
  if (!allowRemote && !isLoopbackAddress(req.socket && req.socket.remoteAddress)) {
    throw errorWithStatus(403, "remote prompt mutation is disabled; use the DSH Web UI on this machine");
  }
  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  if (!contentType.startsWith("application/json")) throw errorWithStatus(415, "content-type must be application/json");
  const fetchSite = String(req.headers["sec-fetch-site"] || "").toLowerCase();
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") throw errorWithStatus(403, "cross-origin mutation denied");
  const origin = req.headers.origin;
  if (origin) {
    let parsed;
    try { parsed = new URL(origin); } catch (_) { throw errorWithStatus(403, "invalid origin"); }
    if (!req.headers.host || parsed.host !== req.headers.host) throw errorWithStatus(403, "origin does not match host");
  }
}

async function readJsonBody(req, maxBytes = MAX_BODY_BYTES) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) throw errorWithStatus(413, "request body too large");
    chunks.push(buffer);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  if (!text) return {};
  try { return JSON.parse(text); } catch (_) { throw errorWithStatus(400, "invalid JSON body"); }
}

export function normalizeSessionId(value) {
  const id = String(value == null ? "" : value).trim();
  if (!id || id.length > MAX_SESSION_ID_LENGTH || /[\u0000-\u001f\u007f]/.test(id)) {
    throw errorWithStatus(400, "invalid sessionId");
  }
  return id;
}

export function normalizeActivation(body) {
  const sessionId = normalizeSessionId(body && body.sessionId);
  const prompt = normalizePrompt(body && body.prompt);
  return { sessionId, prompt };
}

function normalizePrompt(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) throw errorWithStatus(400, "missing prompt");
  const id = String(source.id == null ? "" : source.id).trim().slice(0, MAX_PROMPT_ID_LENGTH);
  const title = String(source.title == null ? "" : source.title).trim().slice(0, MAX_TITLE_LENGTH);
  const content = String(source.content == null ? "" : source.content).trim().slice(0, MAX_CONTENT_LENGTH);
  if (!id || !title || !content) throw errorWithStatus(400, "prompt id, title, and content are required");
  return { id, title, content, activatedAt: Date.now() };
}

function normalizeActivationRequest(body) {
  const sessionId = normalizeSessionId(body && body.sessionId);
  const sources = Array.isArray(body && body.prompts) ? body.prompts : [body && body.prompt];
  if (!sources.length || sources.length > MAX_ACTIVE_PROMPTS) throw errorWithStatus(400, "invalid prompt count");
  const prompts = sources.map(normalizePrompt);
  const unique = [];
  const seen = new Set();
  for (const prompt of prompts) {
    if (seen.has(prompt.id)) continue;
    seen.add(prompt.id);
    unique.push(prompt);
  }
  return { sessionId, prompts: unique };
}

// SystemPrompt reserves {{name}} for variables. User prompt templates use the
// same visual convention, so separate the brace pairs without changing their
// human meaning and prevent an unknown-variable assembly failure.
export function escapePromptVariables(text) {
  return String(text || "").replace(/\{\{/g, "{ {").replace(/\}\}/g, "} }");
}

export function normalizeStoredPrompts(value) {
  if (!value) return [];
  const values = Array.isArray(value.prompts) ? value.prompts : [value];
  const seen = new Set();
  const prompts = [];
  for (const prompt of values) {
    if (!prompt || typeof prompt !== "object" || !prompt.id || !prompt.title || !prompt.content || seen.has(prompt.id)) continue;
    seen.add(prompt.id);
    prompts.push(prompt);
  }
  return prompts.slice(0, MAX_ACTIVE_PROMPTS);
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function normalizeLibraryPrompt(source) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return null;
  const id = String(source.id == null ? "" : source.id).trim().slice(0, MAX_PROMPT_ID_LENGTH);
  const title = String(source.title == null ? "" : source.title).trim().slice(0, MAX_TITLE_LENGTH);
  const content = String(source.content == null ? "" : source.content).trim().slice(0, MAX_CONTENT_LENGTH);
  if (!id || !title || !content) return null;
  const rawTags = Array.isArray(source.tags) ? source.tags : [];
  const tags = [];
  const seenTags = new Set();
  for (const rawTag of rawTags) {
    if (tags.length >= MAX_TAGS) break;
    const tag = String(rawTag == null ? "" : rawTag).trim().slice(0, MAX_TAG_LENGTH);
    const key = tag.toLocaleLowerCase();
    if (!tag || seenTags.has(key)) continue;
    seenTags.add(key);
    tags.push(tag);
  }
  const now = Date.now();
  return {
    id,
    title,
    content,
    tags,
    updatedAt: finiteNumber(source.updatedAt, now),
    favorite: source.favorite === true,
    useCount: Math.floor(finiteNumber(source.useCount, 0)),
    lastUsedAt: finiteNumber(source.lastUsedAt, 0)
  };
}

export function normalizeLibraryPrompts(sources) {
  if (!Array.isArray(sources)) return [];
  const seen = new Set();
  const prompts = [];
  for (const source of sources) {
    if (prompts.length >= MAX_LIBRARY_PROMPTS) break;
    const prompt = normalizeLibraryPrompt(source);
    if (!prompt || seen.has(prompt.id)) continue;
    seen.add(prompt.id);
    prompts.push(prompt);
  }
  return prompts;
}

export function libraryFile() {
  const directory = process.env.DSH_PROMPT_MANAGER_DATA_DIR ||
    join(process.env.DSH_HOME || join(homedir(), ".dsh"), "dsh-prompt-manager");
  return join(directory, "prompts.json");
}

async function readLibraryFile() {
  try {
    const text = await readFile(libraryFile(), "utf8");
    const parsed = JSON.parse(text);
    const sources = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.prompts)) ? parsed.prompts : [];
    return { exists: true, prompts: normalizeLibraryPrompts(sources), savedAt: finiteNumber(parsed && parsed.savedAt, 0) };
  } catch (error) {
    if (error && error.code === "ENOENT") return { exists: false, prompts: [], savedAt: 0 };
    return { exists: true, prompts: [], savedAt: 0, corrupt: true };
  }
}

async function writeLibraryFile(prompts, savedAt) {
  const file = libraryFile();
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify({ version: 1, savedAt: savedAt || Date.now(), prompts }), "utf8");
}

export function resolveActivePrompts(activeBySession, sessions, sessionId) {
  const origin = String(sessionId == null ? "" : sessionId);
  let current = origin;
  const seen = new Set();
  while (current && !seen.has(current)) {
    seen.add(current);
    if (activeBySession.has(current)) {
      const prompts = normalizeStoredPrompts(activeBySession.get(current));
      return prompts.length ? { prompts, sourceSessionId: current, inherited: current !== origin } : null;
    }
    const session = sessions && typeof sessions.get === "function" ? sessions.get(current) : undefined;
    const parent = session && session.header && session.header.parentSession;
    current = parent == null ? "" : String(parent);
  }
  return null;
}

// Compatibility helper for integrations that consumed the 1.3 single-prompt API.
export function resolveActivePrompt(activeBySession, sessions, sessionId) {
  const resolved = resolveActivePrompts(activeBySession, sessions, sessionId);
  return resolved ? {
    prompt: resolved.prompts[0],
    sourceSessionId: resolved.sourceSessionId,
    inherited: resolved.inherited
  } : null;
}

export function renderInjectedPrompt(activeBySession, context, sessions) {
  const sessionId = context && context.agent && context.agent.session && context.agent.session.header && context.agent.session.header.id;
  const resolved = sessionId == null ? null : resolveActivePrompts(activeBySession, sessions, sessionId);
  if (!resolved) return "";
  const sections = resolved.prompts.map((prompt, index) => {
    return "[Prompt " + (index + 1) + ": \"" + escapePromptVariables(prompt.title) + "\"]\n" + escapePromptVariables(prompt.content);
  });
  return "Additional system instructions selected by the user:\n\n" + sections.join("\n\n");
}

function publicRecord(value) {
  if (!value) return null;
  return { id: value.id, title: value.title, content: value.content, activatedAt: value.activatedAt };
}

export function apply(ctx) {
  const activeBySession = new Map();
  const allowRemote = remoteMutationEnabled();

  function assertLiveSession(sessionId) {
    if (!ctx.sessions || typeof ctx.sessions.get !== "function") return;
    if (ctx.sessions.get(sessionId) === undefined) throw errorWithStatus(404, "session is not currently available");
  }

  function changed() {
    try { ctx.emit("system-prompt/change"); } catch (_) {}
  }

  function rememberSessionValue(sessionId, value) {
    if (!activeBySession.has(sessionId) && activeBySession.size >= MAX_ACTIVE_SESSIONS) {
      const oldest = activeBySession.keys().next().value;
      if (oldest !== undefined) activeBySession.delete(oldest);
    }
    activeBySession.delete(sessionId);
    activeBySession.set(sessionId, value);
  }

  async function stateHandler(req, res, url) {
    if (!methodAllowed(req, res, "GET")) return;
    const sessionId = normalizeSessionId(url.searchParams.get("sessionId"));
    const resolved = resolveActivePrompts(activeBySession, ctx.sessions, sessionId);
    const prompts = resolved ? resolved.prompts.map(publicRecord) : [];
    json(res, 200, {
      ok: true,
      version: VERSION,
      prompts,
      active: prompts[0] || null,
      inherited: resolved ? resolved.inherited : false,
      sourceSessionId: resolved ? resolved.sourceSessionId : null
    });
  }

  async function activateHandler(req, res) {
    if (!methodAllowed(req, res, "POST")) return;
    assertMutationRequest(req, allowRemote);
    const activation = normalizeActivationRequest(await readJsonBody(req));
    assertLiveSession(activation.sessionId);
    const resolved = resolveActivePrompts(activeBySession, ctx.sessions, activation.sessionId);
    const merged = resolved ? resolved.prompts.slice() : [];
    for (const prompt of activation.prompts) {
      const index = merged.findIndex((value) => value.id === prompt.id);
      if (index >= 0) merged[index] = prompt;
      else merged.push(prompt);
    }
    if (merged.length > MAX_ACTIVE_PROMPTS) throw errorWithStatus(400, "a session can use at most " + MAX_ACTIVE_PROMPTS + " prompts");
    const contentLength = merged.reduce((total, prompt) => total + prompt.content.length, 0);
    if (contentLength > MAX_ACTIVE_CONTENT_LENGTH) throw errorWithStatus(400, "active prompt content is too large");
    rememberSessionValue(activation.sessionId, { prompts: merged });
    changed();
    const prompts = merged.map(publicRecord);
    json(res, 200, { ok: true, prompts, active: prompts[0] || null });
  }

  async function removeHandler(req, res) {
    if (!methodAllowed(req, res, "POST")) return;
    assertMutationRequest(req, allowRemote);
    const body = await readJsonBody(req);
    const sessionId = normalizeSessionId(body && body.sessionId);
    assertLiveSession(sessionId);
    const promptId = body && body.promptId != null ? String(body.promptId).trim() : "";
    if (promptId.length > MAX_PROMPT_ID_LENGTH || /[\u0000-\u001f\u007f]/.test(promptId)) throw errorWithStatus(400, "invalid promptId");
    const resolved = resolveActivePrompts(activeBySession, ctx.sessions, sessionId);
    const current = resolved ? resolved.prompts : [];
    const next = promptId ? current.filter((prompt) => prompt.id !== promptId) : [];
    const removed = promptId ? next.length !== current.length : current.length > 0;
    if (removed || !promptId) {
      rememberSessionValue(sessionId, next.length ? { prompts: next } : null);
      if (removed) changed();
    }
    const prompts = next.map(publicRecord);
    json(res, 200, { ok: true, removed, prompts, active: prompts[0] || null });
  }

  async function libraryHandler(req, res) {
    if (req.method === "GET") {
      const documentValue = await readLibraryFile();
      json(res, 200, { ok: true, version: VERSION, prompts: documentValue.prompts, savedAt: documentValue.savedAt });
      return;
    }
    if (req.method === "POST") {
      assertMutationRequest(req, allowRemote);
      const body = await readJsonBody(req, MAX_LIBRARY_BODY_BYTES);
      if (!Array.isArray(body && body.prompts)) throw errorWithStatus(400, "prompts must be an array");
      const prompts = normalizeLibraryPrompts(body.prompts);
      const savedAt = Date.now();
      await writeLibraryFile(prompts, savedAt);
      json(res, 200, { ok: true, prompts, savedAt });
      return;
    }
    res.writeHead(405, { allow: "GET, POST", "cache-control": "no-store" });
    res.end();
  }

  async function routeHandler(req, res) {
    try {
      const url = new URL(req.url || "/", "http://x");
      const subpath = url.pathname.replace(/^\/prompt-manager/, "");
      if (subpath === "/health") {
        if (!methodAllowed(req, res, "GET")) return;
        json(res, 200, { ok: true, version: VERSION });
        return;
      }
      if (subpath === "/session") { await stateHandler(req, res, url); return; }
      if (subpath === "/activate") { await activateHandler(req, res); return; }
      if (subpath === "/remove") { await removeHandler(req, res); return; }
      if (subpath === "/library") { await libraryHandler(req, res); return; }
      res.writeHead(404, { "cache-control": "no-store" });
      res.end();
    } catch (error) {
      json(res, error.statusCode || 500, { ok: false, error: String(error && error.message || error) });
    }
  }

  ctx.effect(function () {
    return ctx.systemPrompt.section({
      name: "user:prompt-manager",
      order: 50,
      text: function (context) { return renderInjectedPrompt(activeBySession, context, ctx.sessions); }
    });
  }, "prompt-manager: system prompt section");

  ctx.effect(function () {
    return ctx.webServer.register({ kind: "prefix", path: "/prompt-manager", handler: routeHandler });
  }, "prompt-manager: session injection routes");
}
