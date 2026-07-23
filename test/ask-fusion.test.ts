/**
 * Pure tests for `fuseScopes` (src/ask/fuse.ts) — per-scope ranking +
 * reciprocal-rank fusion. No fs, no graph build: these pin the fusion math
 * that keeps a big sub-project from drowning a small one in `graft ask`.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { fuseScopes, RRF_K, PARTICIPATION_RATIO, type ScopedDoc } from "../src/ask/fuse.js";

/** A scope's docs with per-scope-normalized-looking scores, best first. */
function scopeDocs(scope: string, scores: number[]): ScopedDoc[] {
  return scores.map((score, i) => ({ id: `${scope}${i + 1}`, scope, score }));
}

test("fusion constants match the spec", () => {
  assert.equal(RRF_K, 60);
  assert.equal(PARTICIPATION_RATIO, 0.25);
});

test("10-doc scope vs 2-doc scope: top-6 of the fused order contains both scopes' best", () => {
  const huge = scopeDocs("h", [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1]);
  const tiny = scopeDocs("t", [1.0, 0.4]);
  const { ranked, federated } = fuseScopes([...huge, ...tiny]);
  const top6 = ranked.slice(0, 6).map((d) => d.id);
  assert.ok(top6.includes("h1"), `huge scope's best in top-6, got ${top6}`);
  assert.ok(top6.includes("t1"), `tiny scope's best in top-6, got ${top6}`);
  assert.deepEqual([...federated].sort(), ["h", "t"], "both scopes federated");
});

test("rank-1 of the tiny scope fuses equal to rank-1 of the huge scope, by construction", () => {
  const { ranked } = fuseScopes([
    ...scopeDocs("huge", [1.0, 0.9, 0.8, 0.7, 0.6, 0.5]),
    ...scopeDocs("tiny", [0.9]),
  ]);
  const byId = new Map(ranked.map((d) => [d.id, d.score]));
  assert.equal(byId.get("huge1"), byId.get("tiny1"), "equal fused score for both rank-1 docs");
  assert.equal(byId.get("huge1"), 1, "fused scores are normalized to [0,1], top = 1");
  assert.ok(byId.get("huge2")! < 1, "rank-2 fuses strictly below rank-1");
});

test("participation gate: a scope whose best is < 0.25 × global best is excluded but reported in alsoMatched", () => {
  const strong = scopeDocs("a", [1.0, 0.5, 0.3]);
  const weak = scopeDocs("b", [0.2, 0.1]); // 0.2 < 0.25 × 1.0
  const r = fuseScopes([...strong, ...weak]);
  assert.deepEqual(r.federated, ["a"]);
  assert.deepEqual(r.alsoMatched, [{ scope: "b", bestId: "b1" }]);
  assert.ok(r.ranked.every((d) => d.scope === "a"), "gated scope's docs are not in the fused order");
});

test("a scope at exactly the gate participates (gate is inclusive)", () => {
  const r = fuseScopes([...scopeDocs("a", [1.0]), ...scopeDocs("b", [0.25])]);
  assert.deepEqual([...r.federated].sort(), ["a", "b"]);
  assert.deepEqual(r.alsoMatched, []);
});

test("single-scope input returns the docs unchanged in order, with their original scores", () => {
  const docs = scopeDocs("only", [1.4, 0.9, 0.2, 0.05]); // below-gate scores stay too: no gate with one scope
  const r = fuseScopes(docs);
  assert.deepEqual(
    r.ranked,
    docs.map((d) => ({ id: d.id, scope: "only", score: d.score })),
    "order and scores pass through untouched — degrades to current single-scope behavior",
  );
  assert.deepEqual(r.federated, ["only"]);
  assert.deepEqual(r.alsoMatched, []);
});

test("non-scoring docs (score <= 0) never rank, federate, or report", () => {
  const r = fuseScopes([
    ...scopeDocs("a", [1.0, 0.6]),
    { id: "z1", scope: "z", score: 0 },
    { id: "z2", scope: "z", score: -1 },
  ]);
  assert.deepEqual(r.federated, ["a"]);
  assert.deepEqual(r.alsoMatched, []);
  assert.ok(r.ranked.every((d) => d.scope === "a"));
});

test("empty input fuses to an empty result", () => {
  assert.deepEqual(fuseScopes([]), { ranked: [], federated: [], alsoMatched: [] });
});

test("deterministic under input shuffle, including score ties", () => {
  const docs: ScopedDoc[] = [
    ...scopeDocs("api", [1.0, 0.8, 0.8, 0.3]), // tie inside a scope
    ...scopeDocs("web", [1.0, 0.5]),
    ...scopeDocs("docs", [0.1]), // gated out — must still be reported identically
  ];
  const baseline = fuseScopes(docs);
  const shuffles = [
    [...docs].reverse(),
    [docs[3], docs[6], docs[0], docs[5], docs[2], docs[1], docs[4]],
  ];
  for (const shuffled of shuffles) {
    assert.deepEqual(fuseScopes(shuffled), baseline, "same result regardless of input order");
  }
});
