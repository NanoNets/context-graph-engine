/**
 * `graft ask "<task>"` — the ACTIVE channel.
 *
 * One tool that routes a plain-words query to the right graph and returns a lean,
 * ranked context pack (prose + exact `file:line` + related), never raw JSON and
 * never whole files:
 *
 *   - Structural intent ("what calls X", "callers of X", "what does X import")
 *     → walk the wiring graph's edges and return the neighbour symbols with spans.
 *   - Everything else → lexical rank over concept nodes (prose) and wiring symbols
 *     (name + signature + summary), returning the best few with pointers.
 *
 * v1 is deterministic and $0 (term-overlap scoring, no LLM, no embeddings). The
 * output is markdown so it drops straight into an agent's context.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import matter from "gray-matter";
import { contextDirFor } from "../context/node-file.js";
import { readGraph, wiringPath } from "../graph/write.js";
import type { EdgeV1, GraphV1, NodeV1, Relation } from "../graph/types.js";

export interface AskHit {
  kind: "concept" | "symbol" | "caller" | "callee";
  title: string;
  /** A `file` or `file:Lx-Ly` pointer the agent can open directly. */
  pointer: string;
  snippet: string;
  relation?: Relation;
  related?: string[];
  score: number;
  /** The actual source at `pointer`, sliced from disk when `source` is on.
   * This is what makes `ask` substitutive — the agent reads the span here
   * instead of opening the file, so no source read happens on top of the query. */
  code?: string;
}

/** Max source lines to inline per hit — a definition longer than this is
 * truncated with a marker, so one giant function can't blow up the pack. */
const MAX_SPAN_LINES = 80;

export interface AskResult {
  query: string;
  mode: "structural" | "lexical" | "empty";
  /** For structural mode: the symbol whose neighbours we walked. */
  subject?: string;
  hits: AskHit[];
  note?: string;
}

const STOP = new Set([
  "the", "a", "an", "of", "to", "in", "is", "are", "how", "does", "do", "what",
  "where", "which", "that", "this", "it", "for", "on", "and", "or", "with",
  "i", "we", "get", "set", "use", "used", "using", "when", "why", "can",
]);

/** Split prose + identifiers into lowercased subword tokens (camelCase, snake, kebab). */
function tokenize(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // camelCase → camel Case
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/** Term-frequency count map. */
function counts(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

/** First real prose line of a node body (skips headings, markers, blanks). */
function firstProse(body: string): string {
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("<!--") || line.startsWith("-")) continue;
    return line;
  }
  return "";
}

interface Corpus {
  concepts: Array<{ slug: string; name: string; sources: string[]; related: string[]; snippet: string; text: string }>;
  graph: GraphV1 | null;
}

function loadCorpus(outDir: string): Corpus {
  const concepts: Corpus["concepts"] = [];
  if (existsSync(outDir)) {
    for (const entry of readdirSync(outDir)) {
      if (!entry.endsWith(".md") || entry === "INDEX.md") continue;
      const parsed = matter(readFileSync(join(outDir, entry), "utf8"));
      const fm = parsed.data as Record<string, unknown>;
      const sources = Array.isArray(fm.sources)
        ? (fm.sources as Array<{ path: string }>).map((s) => s.path)
        : [];
      const related = Array.isArray(fm.links)
        ? (fm.links as Array<{ to: string }>).map((l) => l.to)
        : [];
      const snippet = firstProse(parsed.content);
      concepts.push({
        slug: String(fm.slug ?? entry.replace(/\.md$/, "")),
        name: String(fm.name ?? ""),
        sources,
        related,
        snippet,
        text: `${fm.name ?? ""} ${snippet} ${sources.join(" ")}`,
      });
    }
  }
  return { concepts, graph: readGraph(wiringPath(outDir)) };
}

/** Score a document's token counts against the query counts (name field pre-weighted by caller). */
function score(query: Map<string, number>, doc: Map<string, number>): number {
  let s = 0;
  for (const [t, qn] of query) {
    const dn = doc.get(t);
    if (dn) s += qn * dn;
  }
  return s;
}

// ── Structural intent ──────────────────────────────────────────────────────

const INCOMING = /\b(caller|callers|calls?\s+into|who\s+calls|what\s+calls|called\s+by|used\s+by|uses)\b/;
const OUTGOING = /\b(callee|callees|what\s+does\s+\w+\s+call|calls\s+what|imports?|depends\s+on)\b/;
const INCOMING_RELS: Relation[] = ["calls", "references", "implements", "extends"];
const OUTGOING_RELS: Relation[] = ["calls", "references", "imports", "implements", "extends"];

/** Pick the query word that names a real symbol (longest exact name match wins). */
function findSubject(query: string, graph: GraphV1): NodeV1[] {
  const byName = new Map<string, NodeV1[]>();
  for (const n of graph.nodes) {
    if (n.kind === "file") continue;
    const key = n.name.toLowerCase();
    byName.set(key, [...(byName.get(key) ?? []), n]);
  }
  const words = query.split(/[^A-Za-z0-9_.]+/).filter(Boolean);
  let best: NodeV1[] = [];
  let bestLen = 0;
  for (const w of words) {
    const hit = byName.get(w.toLowerCase());
    if (hit && w.length > bestLen) {
      best = hit;
      bestLen = w.length;
    }
  }
  return best;
}

function structural(query: string, graph: GraphV1, limit: number): AskResult | null {
  const wantsIn = INCOMING.test(query);
  const wantsOut = OUTGOING.test(query);
  if (!wantsIn && !wantsOut) return null;

  const subjects = findSubject(query, graph);
  if (subjects.length === 0) return null;

  const ids = new Set(subjects.map((n) => n.id));
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const outgoing = wantsOut && !wantsIn; // "what does X call / import" — else default to callers
  const rels = new Set(outgoing ? OUTGOING_RELS : INCOMING_RELS);

  const hits: AskHit[] = [];
  const seen = new Set<string>();
  for (const e of graph.edges as EdgeV1[]) {
    if (!rels.has(e.relation)) continue;
    const anchor = outgoing ? e.source : e.target;
    const other = outgoing ? e.target : e.source;
    if (!ids.has(anchor) || seen.has(other + e.relation)) continue;
    seen.add(other + e.relation);
    const node = byId.get(other);
    hits.push({
      kind: outgoing ? "callee" : "caller",
      title: node ? node.name : other, // unresolved import target → raw module string
      pointer: node ? `${node.path}:${node.span}` : other,
      snippet: node?.summary?.split("\n")[0].trim() ?? node?.signature ?? "",
      relation: e.relation,
      score: 1,
    });
  }
  hits.sort((a, b) => a.pointer.localeCompare(b.pointer));
  return {
    query,
    mode: "structural",
    subject: subjects[0].name,
    hits: hits.slice(0, limit),
    note: outgoing
      ? `outgoing edges from ${subjects[0].name}`
      : `callers / references of ${subjects[0].name}`,
  };
}

// ── Lexical rank ─────────────────────────────────────────────────────────────

function lexical(query: string, corpus: Corpus, limit: number): AskResult {
  const q = counts(tokenize(query));
  const scored: AskHit[] = [];

  for (const c of corpus.concepts) {
    const nameScore = score(q, counts(tokenize(c.name))) * 3;
    const bodyScore = score(q, counts(tokenize(c.text)));
    const total = nameScore + bodyScore;
    if (total > 0) {
      scored.push({
        kind: "concept",
        title: c.name || c.slug,
        pointer: c.sources.join(", ") || c.slug,
        snippet: c.snippet,
        related: c.related,
        score: total,
      });
    }
  }

  for (const n of corpus.graph?.nodes ?? []) {
    if (n.kind === "file") continue;
    const nameScore = score(q, counts(tokenize(n.name))) * 3;
    const pathScore = score(q, counts(tokenize(n.path))) * 2;
    const bodyScore = score(q, counts(tokenize(`${n.signature ?? ""} ${n.summary ?? ""}`)));
    const total = nameScore + pathScore + bodyScore;
    if (total > 0) {
      scored.push({
        kind: "symbol",
        title: `${n.name} · ${n.kind}`,
        pointer: `${n.path}:${n.span}`,
        snippet: n.summary?.split("\n")[0].trim() ?? n.signature ?? "",
        score: total,
      });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return {
    query,
    mode: scored.length ? "lexical" : "empty",
    hits: scored.slice(0, limit),
    note: scored.length ? undefined : "no matching nodes — try different words, or `graft build` if graft/ is empty",
  };
}

export interface AskOptions {
  contextDir?: string;
  limit?: number;
  /** Inline the source at each `path:Lx-Ly` hit, sliced from `dir`. Turns the
   * pack from a locator into a retriever so the agent needn't re-open the file. */
  source?: boolean;
}

/** Parse a `path:Lx-Ly` pointer into its parts, or null if it isn't one
 * (concept multi-path lists and raw import strings return null). */
function parseSpan(pointer: string): { path: string; from: number; to: number } | null {
  const m = pointer.match(/^(.*):L(\d+)-L(\d+)$/);
  if (!m) return null;
  return { path: m[1], from: Number(m[2]), to: Number(m[3]) };
}

/** Read the source lines [from, to] (1-indexed, inclusive) of `path` under `root`,
 * capped at {@link MAX_SPAN_LINES}. Returns null if the file can't be read. */
function sliceSpan(root: string, path: string, from: number, to: number): string | null {
  try {
    const lines = readFileSync(join(root, path), "utf8").split("\n");
    const start = Math.max(1, from);
    const end = Math.min(lines.length, to);
    const slice = lines.slice(start - 1, end);
    if (slice.length > MAX_SPAN_LINES) {
      const head = slice.slice(0, MAX_SPAN_LINES);
      head.push(`… (+${slice.length - MAX_SPAN_LINES} more lines; open ${path}:L${start}-L${end})`);
      return head.join("\n");
    }
    return slice.join("\n");
  } catch {
    return null;
  }
}

/** Attach inlined source to every hit whose pointer is a real `path:span`. */
function inlineSource(root: string, hits: AskHit[]): void {
  for (const h of hits) {
    const s = parseSpan(h.pointer);
    if (!s) continue;
    const code = sliceSpan(root, s.path, s.from, s.to);
    if (code) h.code = code;
  }
}

/** Answer a query from the graft/ graph at `dir`. Deterministic, $0. */
export function ask(dir: string, query: string, opts: AskOptions = {}): AskResult {
  const root = resolve(dir);
  const outDir = contextDirFor(root, opts.contextDir);
  const limit = opts.limit ?? 8;
  const corpus = loadCorpus(outDir);

  let result: AskResult;
  if (corpus.graph) {
    const s = structural(query, corpus.graph, limit);
    result = s ?? lexical(query, corpus, limit);
  } else {
    result = lexical(query, corpus, limit);
  }
  if (opts.source) inlineSource(root, result.hits);
  return result;
}

/** Render an {@link AskResult} as a compact markdown context pack. */
export function formatAsk(r: AskResult): string {
  const head = `graft ask — "${r.query}"  (${r.mode}${r.note ? `: ${r.note}` : ""})`;
  if (r.hits.length === 0) {
    return `${head}\n\n${r.note ?? "no matches."}`;
  }
  const lines = [head, ""];
  if (r.mode === "structural") {
    for (const h of r.hits) {
      const tail = h.snippet ? ` — ${h.snippet}` : "";
      lines.push(`- ${h.title}  ${h.pointer}  (${h.relation})${tail}`);
      if (h.code) lines.push("", "```", h.code, "```", "");
    }
  } else {
    r.hits.forEach((h, i) => {
      lines.push(`${i + 1}. ${h.title}  [${h.kind}]`);
      lines.push(`   ${h.pointer}`);
      if (h.snippet) lines.push(`   ${h.snippet}`);
      if (h.related?.length) lines.push(`   related: ${h.related.join(", ")}`);
      if (h.code) lines.push("", "```", h.code, "```");
      lines.push("");
    });
  }
  return lines.join("\n").trimEnd() + "\n";
}
