import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

function loadCore() {
  let core;
  function Component() {}
  Component.prototype = {};
  const React = { Component, createElement() {} };
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
    window: {
      __DSH_PROMPT_MANAGER_TEST_HOOK__(value) { core = value; },
      __ModuleLoader__: {
        load(specification) {
          specification.factory((name) => {
            assert.equal(name, "react");
            return React;
          });
        }
      }
    }
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
