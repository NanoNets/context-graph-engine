/**
 * Tests for the `ask` build-time sidecar (`.cache/ask-index.json`).
 *
 * `graft build` writes token/document-frequency bags once so `ask` doesn't
 * re-tokenize the whole corpus per query. These tests pin down the contract
 * that makes the sidecar safe to ship: it is a byte-for-byte reproduction of
 * live tokenization, consuming it never changes a single `ask` result (hits
 * AND scores), and any way the sidecar can be missing/wrong falls back to the
 * live path rather than crashing or silently drifting.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, readFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { buildGraph } from "../src/graph/build.js";
import { ask } from "../src/ask/ask.js";
import { contextDirFor } from "../src/context/node-file.js";
import { readGraph, wiringPath } from "../src/graph/write.js";
import { askIndexPath, readAskIndex, tokenize, counts, writeAskIndex } from "../src/ask/index-file.js";

/** A small multi-file fixture with enough overlapping vocabulary that IDF and
 * BM25 actually differentiate hits, so a parity test on scores is meaningful. */
function makeFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "graft-ask-index-"));
  writeFileSync(
    join(dir, "auth.ts"),
    `/** Validate an incoming API request's auth token. */\n` +
      `export function validateAuthToken(token: string): boolean {\n` +
      `  return token.length > 0;\n` +
      `}\n\n` +
      `export function authMiddleware(req: unknown): boolean {\n` +
      `  return validateAuthToken("x");\n` +
      `}\n`,
  );
  writeFileSync(
    join(dir, "requests.ts"),
    `/** Parse an incoming API request body. */\n` +
      `export function parseRequestBody(raw: string): unknown {\n` +
      `  return JSON.parse(raw);\n` +
      `}\n`,
  );
  writeFileSync(
    join(dir, "unrelated.ts"),
    `export function addTwo(a: number, b: number): number {\n  return a + b;\n}\n`,
  );
  return dir;
}

const QUERY = "How does authentication middleware validate incoming API requests?";

test("writeAskIndex + readAskIndex round-trip matches live tokenization exactly", async () => {
  const dir = makeFixture();
  try {
    await buildGraph(dir);
    const outDir = contextDirFor(dir);
    const graph = readGraph(wiringPath(outDir));
    assert.ok(graph, "wiring graph should exist after build");

    const index = readAskIndex(outDir);
    assert.ok(index, "sidecar should exist after build");
    assert.equal(index!.version, 1);
    assert.equal(index!.docCount, graph!.nodes.length);
    assert.equal(index!.docs.length, graph!.nodes.length);

    const sortPairs = (p: [string, number][]) => [...p].sort((a, b) => a[0].localeCompare(b[0]));
    const byId = new Map(index!.docs.map((d) => [d.id, d]));
    for (const n of graph!.nodes) {
      const d = byId.get(n.id);
      assert.ok(d, `sidecar should carry a doc for ${n.id}`);
      const liveName = [...counts(tokenize(n.name)).entries()];
      const livePath = [...counts(tokenize(n.path)).entries()];
      const liveBody = [
        ...counts(tokenize(`${n.signature ?? ""} ${n.summary ?? ""} ${n.body_text ?? ""}`)).entries(),
      ];
      assert.deepEqual(sortPairs(d!.name), sortPairs(liveName), `name bag for ${n.id}`);
      assert.deepEqual(sortPairs(d!.path), sortPairs(livePath), `path bag for ${n.id}`);
      assert.deepEqual(sortPairs(d!.body), sortPairs(liveBody), `body bag for ${n.id}`);
    }

    // Round-trip through writeAskIndex again (idempotent, deterministic).
    const path2 = writeAskIndex(outDir, graph!);
    assert.equal(path2, askIndexPath(outDir));
    const reread = readAskIndex(outDir);
    assert.deepEqual(reread, index, "re-writing an unchanged graph reproduces the same sidecar");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ask results are IDENTICAL with and without the sidecar (same hits, same scores)", async () => {
  const dir = makeFixture();
  try {
    await buildGraph(dir);
    const outDir = contextDirFor(dir);
    const idxPath = askIndexPath(outDir);

    const withIndex = ask(dir, QUERY, { source: false });
    assert.ok(readAskIndex(outDir), "sanity: sidecar is present for the first run");

    const backup = readFileSync(idxPath);
    unlinkSync(idxPath);
    try {
      assert.equal(readAskIndex(outDir), null, "sanity: sidecar is really gone");
      const withoutIndex = ask(dir, QUERY, { source: false });
      assert.deepEqual(withoutIndex, withIndex, "sidecar vs live fallback must produce identical AskResult");
      assert.ok(withIndex.hits.length > 0, "the fixture query should actually match something");
    } finally {
      writeFileSync(idxPath, backup);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("unknown sidecar version falls back to live tokenization without crashing", async () => {
  const dir = makeFixture();
  try {
    await buildGraph(dir);
    const outDir = contextDirFor(dir);
    const idxPath = askIndexPath(outDir);

    const live = ask(dir, QUERY, { source: false });

    const raw = JSON.parse(readFileSync(idxPath, "utf8"));
    raw.version = 2;
    writeFileSync(idxPath, JSON.stringify(raw));

    assert.equal(readAskIndex(outDir), null, "an unknown version reads as null (fallback signal)");
    const withBadVersion = ask(dir, QUERY, { source: false });
    assert.deepEqual(withBadVersion, live, "unknown-version sidecar must not change results");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a stale sidecar (docCount mismatch) falls back to live tokenization", async () => {
  const dir = makeFixture();
  try {
    await buildGraph(dir);
    const outDir = contextDirFor(dir);
    const idxPath = askIndexPath(outDir);

    const live = ask(dir, QUERY, { source: false });

    const raw = JSON.parse(readFileSync(idxPath, "utf8"));
    raw.docs = raw.docs.slice(1); // drop one doc — docs.length !== graph.nodes.length now
    writeFileSync(idxPath, JSON.stringify(raw));

    const stale = ask(dir, QUERY, { source: false });
    assert.deepEqual(stale, live, "a docCount-mismatched sidecar must not change results");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("an unparseable sidecar file falls back to live tokenization", async () => {
  const dir = makeFixture();
  try {
    await buildGraph(dir);
    const outDir = contextDirFor(dir);
    const idxPath = askIndexPath(outDir);

    const live = ask(dir, QUERY, { source: false });
    writeFileSync(idxPath, "{not json");

    assert.equal(readAskIndex(outDir), null);
    const withGarbage = ask(dir, QUERY, { source: false });
    assert.deepEqual(withGarbage, live);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("readAskIndex returns null when the sidecar is simply missing", () => {
  const dir = mkdtempSync(join(tmpdir(), "graft-ask-index-missing-"));
  try {
    assert.equal(readAskIndex(contextDirFor(dir)), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("readAskIndex returns null when docCount doesn't match docs.length", () => {
  const dir = mkdtempSync(join(tmpdir(), "graft-ask-index-doccount-"));
  try {
    const outDir = contextDirFor(dir);
    const idxPath = askIndexPath(outDir);
    mkdirSync(dirname(idxPath), { recursive: true });
    const corrupted = {
      version: 1,
      avgBodyLen: 3,
      df: [["foo", 1]],
      docCount: 5, // deliberately mismatched with docs below
      docs: [{ id: "a", name: [], path: [], body: [["foo", 1]] }],
    };
    writeFileSync(idxPath, JSON.stringify(corrupted));
    assert.equal(readAskIndex(outDir), null, "docCount !== docs.length must read as null");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a failed sidecar write is recorded in build errors, not fatal", async () => {
  const dir = makeFixture();
  try {
    const outDir = contextDirFor(dir);
    const idxPath = askIndexPath(outDir);
    // Pre-create the sidecar's own path AS A DIRECTORY so writeAskIndex's
    // writeFileSync fails with EISDIR — simulates any write failure without
    // needing real permission tricks.
    mkdirSync(idxPath, { recursive: true });

    const result = await buildGraph(dir);

    assert.ok(
      result.errors.some((e) => e.startsWith("ask-index:")),
      `expected an "ask-index: ..." entry in result.errors, got: ${JSON.stringify(result.errors)}`,
    );
    // The rest of the build must still have completed: wiring.json, cards,
    // and INDEX all still get written even though the sidecar write failed.
    const graph = readGraph(wiringPath(outDir));
    assert.ok(graph, "wiring graph should still be written despite the sidecar failure");
    assert.ok(result.cards > 0, "cards should still be written despite the sidecar failure");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
