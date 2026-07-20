/**
 * Tests for `graft ask` — specifically the `source` option, which turns the
 * pack from a locator (pointers only) into a retriever (source inlined at each
 * span). The retriever behaviour is what makes ask substitutive: the agent
 * reads the span from the pack instead of opening the file.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { buildGraph } from "../src/graph/build.js";
import { ask, formatAsk } from "../src/ask/ask.js";

function makeFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "graft-ask-"));
  writeFileSync(
    join(dir, "math.ts"),
    `export function addNumbers(a: number, b: number): number {\n` +
      `  return a + b;\n` +
      `}\n`,
  );
  return dir;
}

test("ask without source returns pointers but no inlined code", async () => {
  const dir = makeFixture();
  try {
    await buildGraph(dir); // $0, structure-only — cards + wiring.json
    const r = ask(dir, "addNumbers");
    const hit = r.hits.find((h) => h.title.startsWith("addNumbers"));
    assert.ok(hit, "should locate the addNumbers symbol");
    assert.match(hit.pointer, /^math\.ts:L\d+-L\d+$/);
    assert.equal(hit.code, undefined, "no source inlined without the option");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ask with source inlines the actual span from disk", async () => {
  const dir = makeFixture();
  try {
    await buildGraph(dir);
    const r = ask(dir, "addNumbers", { source: true });
    const hit = r.hits.find((h) => h.title.startsWith("addNumbers"));
    assert.ok(hit, "should locate the addNumbers symbol");
    assert.ok(hit.code, "source should be inlined");
    assert.match(hit.code, /return a \+ b;/, "inlined code is the real definition body");
    // formatAsk renders it as a fenced block so it drops into agent context.
    assert.match(formatAsk(r), /```[\s\S]*return a \+ b;[\s\S]*```/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
