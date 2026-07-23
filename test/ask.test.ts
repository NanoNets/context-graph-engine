/**
 * Tests for `graft ask` — specifically the `source` option, which turns the
 * pack from a locator (pointers only) into a retriever (source inlined at each
 * span). The retriever behaviour is what makes ask substitutive: the agent
 * reads the span from the pack instead of opening the file.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readFileSync } from "node:fs";
import { buildGraph } from "../src/graph/build.js";
import { ask, formatAsk, skeleton, formatSkeleton } from "../src/ask/ask.js";

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

/** Stamp a crux onto the addNumbers node in the fixture's committed wiring.json
 * (fixtures build keyless, so Tier-2 fields ship null). */
function stampCrux(dir: string, code: string): void {
  const p = join(dir, "graft", ".graph", "wiring.json");
  const g = JSON.parse(readFileSync(p, "utf8"));
  const n = g.nodes.find((n: any) => n.name === "addNumbers");
  n.crux = { code, span: "L2-L2" };
  writeFileSync(p, JSON.stringify(g));
}

test("ask --source inlines the crux by default, the whole span with full", async () => {
  const dir = makeFixture();
  try {
    await buildGraph(dir);
    stampCrux(dir, "return a + b;");
    const cruxed = ask(dir, "addNumbers", { source: true });
    const hit = cruxed.hits.find((h) => h.title.startsWith("addNumbers"))!;
    assert.match(hit.code!, /^return a \+ b;/, "crux excerpt inlined, not the definition");
    assert.match(hit.code!, /rerun with --full/, "escalation marker present");
    const full = ask(dir, "addNumbers", { source: true, full: true });
    const fullHit = full.hits.find((h) => h.title.startsWith("addNumbers"))!;
    assert.match(fullHit.code!, /export function addNumbers/, "full definition span inlined");
    assert.doesNotMatch(fullHit.code!, /rerun with --full/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ask --source falls back to the span when a node has no crux", async () => {
  const dir = makeFixture();
  try {
    await buildGraph(dir); // keyless: crux is null on every node
    const r = ask(dir, "addNumbers", { source: true });
    const hit = r.hits.find((h) => h.title.startsWith("addNumbers"))!;
    assert.match(hit.code!, /export function addNumbers/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("skeleton lists a file's definitions in span order, matches by basename", async () => {
  const dir = mkdtempSync(join(tmpdir(), "graft-skel-"));
  try {
    writeFileSync(
      join(dir, "api.ts"),
      `export function first(a: number): number {\n  return a;\n}\n\n` +
        `export function second(b: string): string {\n  return b;\n}\n`,
    );
    await buildGraph(dir);
    const r = skeleton(dir, "api.ts");
    assert.deepEqual(r.entries.map((e) => e.name), ["first", "second"], "span order");
    assert.match(r.entries[0].signature ?? "", /first/);
    const byBase = skeleton(dir, "api.ts");
    assert.equal(byBase.file, "api.ts");
    const txt = formatSkeleton(r);
    assert.match(txt, /graft skeleton — api\.ts/);
    assert.match(txt, /L\d+-L\d+ {2}function first/);
    assert.match(skeleton(dir, "nope.ts").note ?? "", /no definitions/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ask reports coverage: 1.0 when every query term hits, low on mostly-off-corpus prompts", async () => {
  const dir = makeFixture();
  try {
    await buildGraph(dir);
    const exact = ask(dir, "addNumbers");
    assert.equal(exact.coverage, 1, "single term, fully matched");
    // Conversational prompt: only "numbers" overlaps the corpus (a common term
    // there, so low idf weight); the six off-corpus words each carry the heavy
    // df=0 weight unmatched, sinking the share under the injection floor.
    const chatty = ask(dir, "thanks looks good please continue numbers tomorrow morning");
    assert.ok(chatty.hits.length > 0, "still returns lexical hits");
    assert.ok((chatty.coverage ?? 1) < 0.15, `coverage should be under the floor, got ${chatty.coverage}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ask finds a symbol by a term that appears only in its body (body-indexing)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "graft-ask-body-"));
  try {
    // "stripe" is nowhere in the name/signature — only inside the body.
    writeFileSync(
      join(dir, "pay.ts"),
      `export function checkout(amount: number): string {\n` +
        `  const token = createStripeCharge(amount);\n` +
        `  return token;\n` +
        `}\n`,
    );
    await buildGraph(dir);
    const r = ask(dir, "stripe");
    const hit = r.hits.find((h) => h.title.startsWith("checkout"));
    assert.ok(hit, "checkout is findable via a term that only appears in its body");
    assert.match(hit.pointer, /^pay\.ts:L\d+-L\d+$/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ask surfaces a file by a term only in its module-level code (file-body indexing)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "graft-ask-file-"));
  try {
    // "telemetry" appears only in a module-level constant — inside no function
    // or class — so only file-level residual indexing can make it findable.
    writeFileSync(
      join(dir, "settings.ts"),
      `export const FEATURE_FLAG_TELEMETRY = false;\n\n` +
        `export function init(): number {\n  return 1;\n}\n`,
    );
    await buildGraph(dir);
    const r = ask(dir, "telemetry");
    const hit = r.hits.find((h) => h.pointer === "settings.ts");
    assert.ok(hit, "the file surfaces via a term that lives only in module-level code");
    assert.ok(hit.title.endsWith("· file"), "it is the file node, pointed at the whole file (no span)");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ask indexes a symbol past the 32KB tree-sitter boundary (chunked parse)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "graft-ask-big-"));
  try {
    // Build a >32KB Python file with the distinctive symbol AFTER the 32KB mark,
    // so it is only reachable if the whole file parsed (string parse caps at 32KB).
    let body = "";
    for (let i = 0; body.length < 40000; i++) body += `def filler_${i}():\n    return ${i}\n\n`;
    body += `def zzz_needle_marker():\n    return "found"\n`;
    assert.ok(body.length > 32768, "fixture must exceed the 32KB parse limit");
    writeFileSync(join(dir, "big.py"), body);
    await buildGraph(dir);
    const r = ask(dir, "zzz_needle_marker");
    assert.ok(
      r.hits.find((h) => h.title.startsWith("zzz_needle_marker")),
      "a symbol defined past the 32KB boundary is indexed and findable",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Structural intent: resolveSymbol fix + loud fallthrough ────────────────

/** `Cache.get` is called (via `c.get(key)`) from `loadItem`; `unusedHelper` is
 * never called by anything, so structural resolves the subject but finds zero
 * edges. Same shapes the traversal-core fixture (test/graph-traverse.test.ts)
 * uses for the qualified-name bug class. */
function qualifiedFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "graft-ask-qualified-"));
  writeFileSync(
    join(dir, "cache.ts"),
    `export class Cache {\n` +
      `  get(key: string): string {\n` +
      `    return key;\n` +
      `  }\n` +
      `}\n\n` +
      `export function loadItem(key: string): string {\n` +
      `  const c = new Cache();\n` +
      `  return c.get(key);\n` +
      `}\n\n` +
      `export function unusedHelper(): number {\n` +
      `  return 42;\n` +
      `}\n`,
  );
  return dir;
}

test("ask: 'who calls Cache.get' resolves via qualified id-suffix (the previously-broken case)", async () => {
  const dir = qualifiedFixture();
  try {
    await buildGraph(dir);
    const r = ask(dir, "who calls Cache.get");
    assert.equal(r.mode, "structural");
    assert.equal(r.subject, "get");
    assert.ok(
      r.hits.some((h) => h.title === "loadItem"),
      "loadItem calls Cache.get, and must show up as a caller",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ask: structural subject resolves but has zero edges — falls through to lexical with a loud note", async () => {
  const dir = qualifiedFixture();
  try {
    await buildGraph(dir);
    const r = ask(dir, "who calls unusedHelper");
    assert.equal(r.mode, "lexical", "never a bare empty structural result");
    assert.ok(r.note, "a fallthrough note must be set");
    assert.match(r.note!, /structural index: no entries for 'unusedHelper'/);
    assert.match(r.note!, /grep -rn 'unusedHelper'/);
    assert.ok(r.hits.length > 0, "lexical fallback still finds the function by name");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ask: structural intent for an unresolvable subject also falls through with a note, never a silent null", async () => {
  const dir = qualifiedFixture();
  try {
    await buildGraph(dir);
    const r = ask(dir, "who calls NoSuchSymbolXyz");
    assert.notEqual(r.mode, "structural");
    assert.ok(r.note, "a fallthrough note must be set even when nothing resolved");
    assert.match(r.note!, /structural index: no entries for 'NoSuchSymbolXyz'/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("formatAsk: the structural fallthrough note prints prominently, before any hit line", async () => {
  const dir = qualifiedFixture();
  try {
    await buildGraph(dir);
    const r = ask(dir, "who calls unusedHelper");
    const out = formatAsk(r);
    assert.ok(out.startsWith("graft ask —"), "header is the first line");
    const noteIdx = out.indexOf("⚠ structural index: no entries");
    assert.ok(noteIdx > 0, "the note is rendered");
    const firstHitIdx = out.search(/\n1\.\s/); // lexical hit numbering starts at "1. "
    assert.ok(firstHitIdx === -1 || noteIdx < firstHitIdx, "the note prints before any hit");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Scope-aware ranking: per-scope rank + RRF fusion (multi-scope repos) ────

/** Two sub-projects under one root: `frontend/` (ts, ~6 symbols) and
 * `backend/` (py, ~30 symbols — 5× bigger), each with its own project marker
 * so scope discovery splits them, and each with error-handling symbols so a
 * "how are errors handled" query matches in BOTH scopes. Without fusion the
 * backend's sheer size drowns the frontend's hits. */
function multiScopeFixture(): string {
  const dir = mkdtempSync(join(tmpdir(), "graft-ask-scopes-"));
  mkdirSync(join(dir, "frontend", "src"), { recursive: true });
  mkdirSync(join(dir, "backend"), { recursive: true });
  writeFileSync(join(dir, "frontend", "package.json"), "{}\n");
  writeFileSync(join(dir, "backend", "pyproject.toml"), `[project]\nname = "backend"\n`);
  writeFileSync(
    join(dir, "frontend", "src", "errors.ts"),
    `export function handleErrors(err: Error): string {\n` +
      `  // errors from the ui are handled with a banner\n` +
      `  return renderBanner(err.message);\n` +
      `}\n\n` +
      `export function renderBanner(msg: string): string {\n` +
      `  return "banner: " + msg;\n` +
      `}\n\n` +
      `export function reportErrors(err: Error): string {\n` +
      `  // handled errors are also reported upstream\n` +
      `  return handleErrors(err);\n` +
      `}\n\n` +
      `export function clearBanner(): string {\n  return "";\n}\n\n` +
      `export function bannerVisible(): boolean {\n  return false;\n}\n\n` +
      `export function resetUi(): string {\n  return "reset";\n}\n`,
  );
  let py =
    `def handle_errors(exc):\n` +
    `    """errors are handled by returning a serialized problem response"""\n` +
    `    return {"error": str(exc)}\n\n\n` +
    `def wrap_errors(fn):\n` +
    `    """errors raised by route handlers get handled and logged here"""\n` +
    `    return fn\n\n\n`;
  for (let i = 0; i < 28; i++) py += `def route_${i}(payload):\n    return payload\n\n\n`;
  writeFileSync(join(dir, "backend", "app.py"), py);
  return dir;
}

test("ask on a multi-scope repo: top hits federate both scopes, labeled, with a matched-in footer", async () => {
  const dir = multiScopeFixture();
  try {
    await buildGraph(dir);
    const r = ask(dir, "how are errors handled", { limit: 10 });
    const scopesHit = new Set(r.hits.map((h) => h.scope));
    assert.ok(scopesHit.has("frontend"), "top-10 contains a frontend/ hit despite backend being 5× bigger");
    assert.ok(scopesHit.has("backend"), "top-10 contains a backend/ hit");
    assert.ok(r.scopes, "multi-scope result carries fusion telemetry");
    const out = formatAsk(r);
    assert.match(out, /\[frontend\/\] /, "frontend hits carry a scope label");
    assert.match(out, /\[backend\/\] /, "backend hits carry a scope label");
    assert.match(out, /matched in: .*frontend\/ \(\d+\)/, "footer reports frontend's hit count");
    assert.match(out, /matched in: .*backend\/ \(\d+\)/, "footer reports backend's hit count");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** The regression pin Task 7's cross-version gate relies on: on a single-scope
 * graph the fusion code paths must be completely inert. `meta.scopes` hand-set
 * to the canonical single form vs deleted (an old graph) must produce
 * byte-identical `formatAsk` output — the early branch keys on
 * `scopesOfGraph(graph).length <= 1`, and both forms take it. */
test("regression pin: single-scope ask output is byte-equal with canonical meta.scopes vs no meta.scopes", async () => {
  const dir = makeFixture();
  try {
    await buildGraph(dir);
    const p = join(dir, "graft", ".graph", "wiring.json");
    const g = JSON.parse(readFileSync(p, "utf8"));
    delete g.meta.scopes;
    writeFileSync(p, JSON.stringify(g));
    const absent = formatAsk(ask(dir, "addNumbers", { source: true }));
    g.meta.scopes = [{ prefix: "", label: "", markers: [] }];
    writeFileSync(p, JSON.stringify(g));
    const canonical = formatAsk(ask(dir, "addNumbers", { source: true }));
    assert.equal(canonical, absent, "single-scope output must not drift by a byte");
    assert.doesNotMatch(absent, /matched in:|also matched:|\[\w+\/\] /, "zero new output on single-scope");
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
