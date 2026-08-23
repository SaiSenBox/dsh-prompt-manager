import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

function loadCore(windowOverrides = {}) {
  let core;
  function Component() {}
  Component.prototype = {};
  const React = { Component, createElement() {} };
  const testWindow = Object.assign({
    __DSH_PROMPT_MANAGER_TEST_HOOK__(value) { core = value; },
    __ModuleLoader__: {
      load(specification) {
        specification.factory((name) => {
          assert.equal(name, "react");
          return React;
        });
      }
    }
  }, windowOverrides);
  const context = {
    Blob,
    URL,
    console,
    Date,
    Math,
    Number,
    Object,
    Promise,
    String,
    window: testWindow
  };
  vm.runInNewContext(fs.readFileSync(new URL("../lib/client.js", import.meta.url), "utf8"), context);
  assert.ok(core, "client test hook should expose the pure core");
  return core;
}

const core = loadCore();

test("Chinese and English dictionaries stay in sync", () => {
  assert.deepEqual(Object.keys(core.messages.zh).sort(), Object.keys(core.messages.en).sort());
});

test("promptDescription collapses every kind of whitespace", () => {
  const description = core.promptDescription({ tags: ["dev"], content: "first\n\tsecond   third" });
  assert.equal(description, "dev — first second third");
});

test("slash aliases are removed before prompt search", () => {
  assert.equal(core.stripPromptAlias("prompt release"), "release");
  assert.equal(core.stripPromptAlias("提示词 代码"), "代码");
  assert.equal(core.stripPromptAlias("prompt"), "");
  assert.equal(core.stripPromptAlias("promptly"), "promptly");
});

test("normalizeTags trims, deduplicates, and caps tag length", () => {
  assert.deepEqual(Array.from(core.normalizeTags(" Dev, dev， Test ;  ")), ["Dev", "Test"]);
  assert.equal(core.normalizeTags(["x".repeat(80)])[0].length, 40);
});

test("sanitization rejects malformed entries without breaking valid prompts", () => {
  const result = core.sanitizePrompts([
    null,
    { id: "one", title: "  Useful  ", content: "  Do this  ", tags: ["A", "a"], useCount: -5 },
    { id: "two", title: "Missing content" },
    { id: "one", title: "Duplicate id", content: "ignored" }
  ]);
  assert.equal(result.prompts.length, 1);
  assert.equal(result.prompts[0].title, "Useful");
  assert.deepEqual(Array.from(result.prompts[0].tags), ["A"]);
  assert.equal(result.prompts[0].useCount, 0);
  assert.equal(result.skipped, 3);
});

test("exported backups round-trip through the importer", () => {
  const source = [{ id: "one", title: "Review", content: "Check it", tags: ["dev"], favorite: true }];
  const imported = core.parseImportText(core.exportDocument(source));
  assert.equal(imported.ok, true);
  assert.equal(imported.prompts.length, 1);
  assert.equal(imported.prompts[0].favorite, true);
});

test("import accepts legacy arrays and rejects unrelated JSON", () => {
  assert.equal(core.parseImportText('[{"title":"A","content":"B"}]').ok, true);
  assert.equal(core.parseImportText('{"hello":"world"}').ok, false);
  assert.equal(core.parseImportText('{not json').ok, false);
});

test("merge keeps existing prompts and lets imported matching ids win", () => {
  const current = [
    { id: "same", title: "Old", content: "Old body" },
    { id: "local", title: "Local", content: "Local body" }
  ];
  const incoming = [
    { id: "same", title: "New", content: "New body" },
    { id: "remote", title: "Remote", content: "Remote body" }
  ];
  const merged = core.mergePromptSets(current, incoming);
  assert.equal(merged.length, 3);
  assert.equal(merged.find((item) => item.id === "same").title, "New");
});

test("session injection records migrate one prompt and sanitize multiple prompts", () => {
  const record = core.sanitizeInjectionRecord({
    sessionId: " session-1 ",
    prompt: { id: "one", title: "Review", content: "Check it", tags: ["dev"], favorite: true },
    activatedAt: 42
  });
  assert.equal(record.sessionId, "session-1");
  assert.equal(record.prompts.length, 1);
  assert.deepEqual(Object.keys(record.prompts[0]).sort(), ["content", "id", "title"]);
  assert.equal(record.activatedAt, 42);
	const multiple = core.sanitizeInjectionRecord({
		sessionId: "session-3",
		prompts: [
			{ id: "one", title: "Review", content: "Check it" },
			{ id: "two", title: "Tests", content: "Test it" },
			{ id: "one", title: "Duplicate", content: "Ignored" }
		]
	});
	assert.deepEqual(Array.from(multiple.prompts, (prompt) => prompt.id), ["one", "two"]);
	const disabled = core.sanitizeInjectionRecord({ sessionId: "session-2", disabled: true, activatedAt: 43 });
	assert.equal(disabled.disabled, true);
	assert.equal(disabled.activatedAt, 43);
  assert.equal(core.sanitizeInjectionRecord({ sessionId: "session-1", prompts: [{ title: "Incomplete" }] }), null);
});

test("ranking favors strong title matches over favorites and favorites over ordinary items", () => {
  const prompts = core.sanitizePrompts([
    { id: "favorite", title: "General helper", content: "review this", favorite: true },
    { id: "match", title: "Review code", content: "do it" },
    { id: "plain", title: "Another helper", content: "review this" }
  ]).prompts;
  assert.equal(core.rankPrompts(prompts, "review")[0].id, "match");
  assert.equal(core.rankPrompts(prompts, "")[0].id, "favorite");
});

test("startup reconciliation preserves an intentionally empty durable library", () => {
	const result = core.reconcileLibraryStartup(
		{ exists: false, prompts: [], error: "", revision: 0, dirty: false },
		{ exists: true, corrupt: false, prompts: [], revision: 4, savedAt: 10 },
		[{ id: "seed", title: "Seed", content: "Default" }]
	);
	assert.deepEqual(Array.from(result.prompts), []);
	assert.equal(result.revision, 4);
	assert.equal(result.dirty, false);
});

test("startup reconciliation seeds only when browser and host libraries are both missing", () => {
	const seed = { id: "seed", title: "Seed", content: "Default" };
	const missing = { exists: false, corrupt: false, prompts: [], revision: 0, savedAt: 0 };
	const seeded = core.reconcileLibraryStartup(
		{ exists: false, prompts: [], error: "", revision: 0, dirty: false }, missing, [seed]
	);
	assert.deepEqual(Array.from(seeded.prompts, (prompt) => prompt.id), ["seed"]);
	assert.equal(seeded.dirty, true);

	const intentionallyEmpty = core.reconcileLibraryStartup(
		{ exists: true, prompts: [], error: "", revision: 0, dirty: false }, missing, [seed]
	);
	assert.deepEqual(Array.from(intentionallyEmpty.prompts), []);
	assert.equal(intentionallyEmpty.dirty, true);
});

test("startup reconciliation keeps dirty local changes and rebases conflicts without dropping entries", () => {
	const sameRevision = core.reconcileLibraryStartup(
		{ exists: true, prompts: [{ id: "local", title: "Local", content: "New" }], error: "", revision: 3, dirty: true },
		{ exists: true, corrupt: false, prompts: [{ id: "host", title: "Host", content: "Old" }], revision: 3 },
		[]
	);
	assert.deepEqual(Array.from(sameRevision.prompts, (prompt) => prompt.id), ["local"]);
	assert.equal(sameRevision.syncError, "");

	const conflict = core.reconcileLibraryStartup(
		{
			exists: true,
			prompts: [
				{ id: "same", title: "Local version", content: "Local" },
				{ id: "local", title: "Local", content: "Keep" }
			],
			error: "", revision: 2, dirty: true
		},
		{
			exists: true, corrupt: false, revision: 4,
			prompts: [
				{ id: "same", title: "Host version", content: "Host" },
				{ id: "host", title: "Host", content: "Keep" }
			]
		},
		[]
	);
	assert.deepEqual(Array.from(conflict.prompts, (prompt) => prompt.id).sort(), ["host", "local", "same"]);
	assert.equal(conflict.prompts.find((prompt) => prompt.id === "same").title, "Local version");
	assert.equal(conflict.revision, 4);
	assert.equal(conflict.dirty, true);
	assert.equal(conflict.syncError, "hostSyncConflict");
});

test("startup reconciliation never overwrites a corrupt durable library automatically", () => {
	const result = core.reconcileLibraryStartup(
		{ exists: true, prompts: [{ id: "local", title: "Local", content: "Backup" }], error: "", revision: 2, dirty: false },
		{ exists: true, corrupt: true, prompts: [], revision: 0 },
		[{ id: "seed", title: "Seed", content: "Default" }]
	);
	assert.deepEqual(Array.from(result.prompts, (prompt) => prompt.id), ["local"]);
	assert.equal(result.hostCorrupt, true);
	assert.equal(result.syncError, "hostLibraryCorrupt");
	assert.equal(result.writeLocal, false);
});

test("async hydration keeps an existing empty host library empty", async () => {
	const values = new Map();
	const requests = [];
	const isolated = loadCore({
		localStorage: {
			getItem(key) { return values.has(key) ? values.get(key) : null; },
			setItem(key, value) { values.set(key, value); }
		},
		fetch(path, options) {
			requests.push({ path, options });
			return Promise.resolve({
				ok: true,
				status: 200,
				json() { return Promise.resolve({ ok: true, exists: true, corrupt: false, revision: 7, savedAt: 1, prompts: [] }); }
			});
		}
	});

	const pending = isolated.initializeStore();
	assert.equal(isolated.storeSnapshot().ready, false);
	await pending;
	assert.equal(isolated.storeSnapshot().ready, true);
	assert.deepEqual(Array.from(isolated.storeSnapshot().prompts), []);
	assert.equal(isolated.storeSnapshot().revision, 7);
	assert.equal(isolated.storeSnapshot().dirty, false);
	assert.equal(requests.length, 1);
	assert.equal(requests[0].options.method, "GET");
});

test("client mirror coalesces rapid mutations and advances the host revision in order", async () => {
	const values = new Map();
	const posts = [];
	const pendingResponses = [];
	const isolated = loadCore({
		localStorage: {
			getItem(key) { return values.has(key) ? values.get(key) : null; },
			setItem(key, value) { values.set(key, value); }
		},
		fetch(path, options) {
			if (options.method === "GET") {
				return Promise.resolve({
					ok: true, status: 200,
					json() { return Promise.resolve({ ok: true, exists: true, corrupt: false, revision: 1, savedAt: 1, prompts: [] }); }
				});
			}
			posts.push(JSON.parse(options.body));
			return new Promise((resolve) => {
				pendingResponses.push((payload) => resolve({ ok: true, status: 200, json() { return Promise.resolve(payload); } }));
			});
		}
	});
	await isolated.initializeStore();

	const first = { id: "one", title: "One", content: "First" };
	const second = { id: "two", title: "Two", content: "Second" };
	isolated.persistPrompts([first]);
	isolated.persistPrompts([first, second]);
	await Promise.resolve();
	assert.equal(posts.length, 1);
	assert.equal(posts[0].baseRevision, 1);
	assert.deepEqual(Array.from(posts[0].prompts, (prompt) => prompt.id), ["one"]);

	pendingResponses.shift()({ ok: true, exists: true, corrupt: false, revision: 2, savedAt: 2, prompts: [first] });
	for (let i = 0; i < 4 && posts.length < 2; i++) await new Promise((resolve) => setTimeout(resolve, 0));
	assert.equal(posts.length, 2);
	assert.equal(posts[1].baseRevision, 2);
	assert.deepEqual(Array.from(posts[1].prompts, (prompt) => prompt.id), ["one", "two"]);

	pendingResponses.shift()({ ok: true, exists: true, corrupt: false, revision: 3, savedAt: 3, prompts: [first, second] });
	await isolated.waitForLibrarySync();
	assert.equal(isolated.storeSnapshot().revision, 3);
	assert.equal(isolated.storeSnapshot().dirty, false);
	assert.deepEqual(Array.from(isolated.storeSnapshot().prompts, (prompt) => prompt.id), ["one", "two"]);
});
