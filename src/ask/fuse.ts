/**
 * Scope-aware ranking for `graft ask` — per-scope ranking + reciprocal-rank
 * fusion (RRF). Pure functions, no fs.
 *
 * The problem: lexical + graph scores are corpus-relative. In a multi-scope
 * repo (a monorepo's `frontend/` + `backend/`, sub-projects under one root),
 * pooling every node into one ranking lets the biggest sub-project set the
 * score scale and drown the small one — its IDF, its BM25 length prior, its
 * PageRank mass. The fix: rank each scope against ITS OWN corpus (per-scope
 * IDF/BM25/walk, done by the caller), then fuse the per-scope ORDERINGS here
 * with RRF — rank positions are comparable across corpora where raw scores
 * are not, so the tiny scope's best hit lands next to the huge scope's best.
 *
 * Soft federation: a scope whose best score is far below the global best
 * (< {@link PARTICIPATION_RATIO} ×) is probably an incidental word collision,
 * not a second home for the query — it is left out of the fused order and
 * reported in `alsoMatched` instead, so the output can say "also matched:
 * docs/ — narrow with --in docs/" rather than diluting the pack.
 */

/** One scored document, attributed to the ranking scope (path prefix, "" =
 * root) it was scored within. Scores must be per-scope-normalized (each
 * scope's best ≈ its own ceiling) — fusion compares ranks, not raw scores. */
export interface ScopedDoc {
  id: string;
  scope: string;
  score: number;
}

export interface FusionResult {
  /** fused order, best first; carries per-doc scope label + fused score in [0,1] */
  ranked: { id: string; scope: string; score: number }[];
  /** scopes that participated in fusion */
  federated: string[];
  /** scopes that matched weakly (≥1 scoring doc but below the participation gate) with their best doc */
  alsoMatched: { scope: string; bestId: string }[];
}

/** RRF smoothing constant — the standard value from the original RRF paper;
 * high enough that rank 1 vs 2 differ gently rather than by 2×. */
export const RRF_K = 60;

/** A scope federates only when its best doc scores at least this share of the
 * global best — below it the match is reported, not fused. */
export const PARTICIPATION_RATIO = 0.25;

/** Score-desc, id-asc ordering — the id tiebreak is what makes fusion
 * deterministic under input shuffle. */
function byScore(a: ScopedDoc, b: ScopedDoc): number {
  return b.score - a.score || a.id.localeCompare(b.id);
}

/**
 * Partition by scope, rank within scope (input scores are already
 * per-scope-normalized), gate by soft federation, fuse by RRF:
 * `fused(id) = Σ 1/(K + rank_in_scope(id))`, then normalized so the top fused
 * doc is 1. Non-scoring docs (score ≤ 0) are dropped entirely.
 *
 * Degenerate cases degrade to current behavior: zero scoring docs → empty
 * result; exactly one scoring scope → its docs pass through in score order
 * with their ORIGINAL scores (no RRF re-scoring, no gate) — byte-for-byte the
 * single-corpus ranking the caller would have produced anyway.
 */
export function fuseScopes(docs: ScopedDoc[]): FusionResult {
  const byScope = new Map<string, ScopedDoc[]>();
  for (const d of docs) {
    if (d.score <= 0) continue;
    const list = byScope.get(d.scope);
    if (list) list.push(d);
    else byScope.set(d.scope, [d]);
  }
  for (const list of byScope.values()) list.sort(byScore);

  if (byScope.size === 0) return { ranked: [], federated: [], alsoMatched: [] };
  if (byScope.size === 1) {
    const [scope, list] = byScope.entries().next().value as [string, ScopedDoc[]];
    return {
      ranked: list.map((d) => ({ id: d.id, scope, score: d.score })),
      federated: [scope],
      alsoMatched: [],
    };
  }

  // Gate: order scopes by their best doc (desc, scope-name tiebreak), split
  // into federated (≥ ratio × global best, inclusive) and alsoMatched.
  const scopesByBest = [...byScope.entries()].sort(
    (a, b) => b[1][0].score - a[1][0].score || a[0].localeCompare(b[0]),
  );
  const gate = PARTICIPATION_RATIO * scopesByBest[0][1][0].score;
  const federated: string[] = [];
  const alsoMatched: FusionResult["alsoMatched"] = [];
  for (const [scope, list] of scopesByBest) {
    if (list[0].score >= gate) federated.push(scope);
    else alsoMatched.push({ scope, bestId: list[0].id });
  }

  // RRF: each federated scope contributes 1/(K + rank) per doc; an id listed
  // in more than one scope sums its contributions and is attributed to the
  // scope where it ranked best.
  const acc = new Map<string, { scope: string; score: number; bestRank: number }>();
  for (const scope of federated) {
    byScope.get(scope)!.forEach((d, i) => {
      const contribution = 1 / (RRF_K + i + 1);
      const prev = acc.get(d.id);
      if (!prev) acc.set(d.id, { scope, score: contribution, bestRank: i });
      else {
        prev.score += contribution;
        if (i < prev.bestRank) {
          prev.scope = scope;
          prev.bestRank = i;
        }
      }
    });
  }

  let max = 0;
  for (const e of acc.values()) if (e.score > max) max = e.score;
  const ranked = [...acc.entries()].map(([id, e]) => ({
    id,
    scope: e.scope,
    score: e.score / max,
  }));
  ranked.sort(
    (a, b) => b.score - a.score || a.scope.localeCompare(b.scope) || a.id.localeCompare(b.id),
  );
  return { ranked, federated, alsoMatched };
}

/** The per-scope scoring hooks `rankScopesAndFuse` drives — the caller owns
 * the actual lexical math and graph walk (they need its corpus state); this
 * module owns the orchestration so the shape of "rank per scope, then fuse"
 * lives in one place. */
export interface ScopeRankOps {
  /** Lexical scores for the scope's own docs (positive entries only),
   * computed against the scope's OWN corpus statistics. */
  lex(scope: string): Map<string, number>;
  /** Graph walk restricted to the scope's subgraph, seeded by that scope's
   * lexical scores; returns top-normalized centrality (or an empty map). */
  walk(scope: string, seeds: Map<string, number>): Map<string, number>;
}

/**
 * Multi-scope orchestration for `ask`'s symbol ranking: for each scope, score
 * lexically, walk the scope's subgraph, blend exactly like the single-scope
 * path (`lexN + graphWeight·pr`, both per-scope-normalized; walk-rescued
 * nodes join above `rescueFloor`), then fuse all scopes' blended lists with
 * {@link fuseScopes}. A scope with zero lexical matches contributes nothing
 * (no seeds → no walk → no docs).
 */
export function rankScopesAndFuse(
  scopes: string[],
  ops: ScopeRankOps,
  graphWeight: number,
  rescueFloor: number,
): FusionResult {
  const scoped: ScopedDoc[] = [];
  for (const scope of scopes) {
    const lex = ops.lex(scope);
    if (lex.size === 0) continue;
    const pr = ops.walk(scope, lex);
    let maxLex = 0;
    for (const v of lex.values()) if (v > maxLex) maxLex = v;
    const candidates = new Set(lex.keys());
    for (const [id, p] of pr) if (p >= rescueFloor) candidates.add(id);
    for (const id of candidates) {
      const lexN = maxLex > 0 ? (lex.get(id) ?? 0) / maxLex : 0;
      const blended = lexN + graphWeight * (pr.get(id) ?? 0);
      if (blended > 0) scoped.push({ id, scope, score: blended });
    }
  }
  return fuseScopes(scoped);
}
