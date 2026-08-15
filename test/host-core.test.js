import assert from "node:assert/strict";
import { Readable } from "node:stream";
import test from "node:test";

import {
  apply,
  assertMutationRequest,
  escapePromptVariables,
  isLoopbackAddress,
  normalizeActivation,
  normalizeStoredPrompts,
  renderInjectedPrompt,
  resolveActivePrompt,
  resolveActivePrompts
} from "../lib/index.js";

function mutationRequest(address = "127.0.0.1", headers = {}) {
  return {
    socket: { remoteAddress: address },
    headers: Object.assign({ "content-type": "application/json", host: "127.0.0.1:3080" }, headers)
  };
}

test("loopback detection accepts IPv4 and IPv6 local clients", () => {
  assert.equal(isLoopbackAddress("127.0.0.1"), true);
  assert.equal(isLoopbackAddress("::1"), true);
  assert.equal(isLoopbackAddress("::ffff:127.0.0.1"), true);
  assert.equal(isLoopbackAddress("192.168.1.12"), false);
});

test("mutation requests are JSON, same-origin, and loopback by default", () => {
  assert.doesNotThrow(() => assertMutationRequest(mutationRequest()));
  assert.throws(() => assertMutationRequest(mutationRequest("192.168.1.12")), /remote prompt mutation is disabled/);
  assert.throws(() => assertMutationRequest(mutationRequest("127.0.0.1", { "content-type": "text/plain" })), /application\/json/);
  assert.throws(() => assertMutationRequest(mutationRequest("127.0.0.1", { origin: "http://example.com" })), /origin does not match/);
});

test("activation input is normalized without retaining extra fields", () => {
  const value = normalizeActivation({
    sessionId: " session-1 ",
    prompt: { id: " prompt-1 ", title: " Review ", content: " Be precise. ", ignored: true }
  });
  assert.equal(value.sessionId, "session-1");
  assert.deepEqual(Object.keys(value.prompt).sort(), ["activatedAt", "content", "id", "title"]);
  assert.equal(value.prompt.title, "Review");
  assert.throws(() => normalizeActivation({ sessionId: "session-1", prompt: { title: "Missing fields" } }), /required/);
});

test("user placeholder braces cannot become DSH system prompt variables", () => {
  assert.equal(escapePromptVariables("Use {{code}} and {{ framework }}"), "Use { {code} } and { { framework } }");
});

test("injected prompts are isolated to the addressed session", () => {
  const active = new Map([["session-1", { prompts: [{ id: "review", title: "Code review", content: "Review {{code}}" }] }]]);
  const first = renderInjectedPrompt(active, { agent: { session: { header: { id: "session-1" } } } });
  const second = renderInjectedPrompt(active, { agent: { session: { header: { id: "session-2" } } } });
  assert.match(first, /Code review/);
  assert.match(first, /Review \{ \{code\} \}/);
  assert.equal(second, "");
});

test("forked sessions inherit the nearest prompt set and can override it locally", () => {
  const first = { id: "review", title: "Code review", content: "Review carefully" };
  const second = { id: "tests", title: "Tests", content: "Add tests" };
  const active = new Map([["parent", { prompts: [first, second] }]]);
  const sessions = new Map([
    ["parent", { header: { id: "parent" } }],
    ["child", { header: { id: "child", parentSession: "parent" } }],
    ["grandchild", { header: { id: "grandchild", parentSession: "child" } }]
  ]);
  const inherited = resolveActivePrompt(active, sessions, "grandchild");
  assert.equal(inherited.prompt, first);
  assert.equal(inherited.sourceSessionId, "parent");
  assert.equal(inherited.inherited, true);
  assert.match(renderInjectedPrompt(active, { agent: { session: { header: { id: "grandchild" } } } }, sessions), /Review carefully/);
	const inheritedSet = resolveActivePrompts(active, sessions, "grandchild");
	assert.deepEqual(inheritedSet.prompts, [first, second]);
	assert.match(renderInjectedPrompt(active, { agent: { session: { header: { id: "grandchild" } } } }, sessions), /Add tests/);

	active.set("child", { prompts: [second] });
	assert.deepEqual(resolveActivePrompts(active, sessions, "grandchild").prompts, [second]);
	assert.doesNotMatch(renderInjectedPrompt(active, { agent: { session: { header: { id: "grandchild" } } } }, sessions), /Review carefully/);

  active.set("child", null);
  assert.equal(resolveActivePrompt(active, sessions, "grandchild"), null);
  assert.equal(renderInjectedPrompt(active, { agent: { session: { header: { id: "grandchild" } } } }, sessions), "");
});

test("stored prompt sets accept legacy single records and deduplicate ordered collections", () => {
	const legacy = { id: "legacy", title: "Legacy", content: "Keep working" };
	assert.deepEqual(normalizeStoredPrompts(legacy), [legacy]);
	assert.deepEqual(normalizeStoredPrompts({ prompts: [legacy, legacy, null] }), [legacy]);
});

test("host routes add several prompts and remove one without clearing the rest", async () => {
	let route;
	let render;
	const sessions = new Map([["session-1", { header: { id: "session-1" } }]]);
	const ctx = {
		sessions,
		emit() {},
		effect(setup) { return setup(); },
		systemPrompt: { section(options) { render = options.text; return () => {}; } },
		webServer: { register(options) { route = options.handler; return () => {}; } }
	};
	apply(ctx);

	async function request(path, body) {
		const req = Readable.from(body === undefined ? [] : [JSON.stringify(body)]);
		Object.assign(req, {
			method: body === undefined ? "GET" : "POST",
			url: path,
			socket: { remoteAddress: "127.0.0.1" },
			headers: { "content-type": "application/json", host: "127.0.0.1:3080" }
		});
		let status = 0;
		let responseBody = "";
		const res = {
			writableEnded: false,
			writeHead(value) { status = value; },
			end(value = "") { responseBody += value; this.writableEnded = true; }
		};
		await route(req, res);
		return { status, body: responseBody ? JSON.parse(responseBody) : null };
	}

	const first = { id: "review", title: "Review", content: "Review carefully" };
	const second = { id: "tests", title: "Tests", content: "Add tests" };
	assert.equal((await request("/prompt-manager/activate", { sessionId: "session-1", prompt: first })).status, 200);
	const added = await request("/prompt-manager/activate", { sessionId: "session-1", prompt: second });
	assert.deepEqual(added.body.prompts.map((prompt) => prompt.id), ["review", "tests"]);
	assert.match(render({ agent: { session: { header: { id: "session-1" } } } }), /Review carefully[\s\S]*Add tests/);

	const removed = await request("/prompt-manager/remove", { sessionId: "session-1", promptId: "review" });
	assert.deepEqual(removed.body.prompts.map((prompt) => prompt.id), ["tests"]);
	const state = await request("/prompt-manager/session?sessionId=session-1");
	assert.deepEqual(state.body.prompts.map((prompt) => prompt.id), ["tests"]);
});
