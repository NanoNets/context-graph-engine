/**
 * Aggregation and reporting. Turns the raw per-trial rows into the summary
 * table that is the actual launch deliverable: per corpus, cold vs graph, with
 * the token / latency / correctness deltas that either back the pitch or don't.
 */
export type Arm = "cold" | "graph" | "pull";

export interface Row {
  corpus: string;
  taskId: string;
  arm: Arm;
  trial: number;
  /** "localized" (single-file answer) or "multi-file". */
  locality: string;
  tokensInput: number;
  tokensOutput: number;
  tokensTotal: number;
  cacheRead: number;
  cacheCreate: number;
  toolCalls: number;
  wallMs: number;
  correct: boolean;
  score: number;
  keywordPass: boolean;
  judgeCorrect: boolean;
  iterations: number;
  stopReason: string | null;
  answer: string;
  reasoning: string;
}

// Sonnet 5 pricing per MTok (standard sticker; intro is $2/$10 through 2026-08-31).
const IN_PER_TOK = 3 / 1_000_000;
const OUT_PER_TOK = 15 / 1_000_000;

/** Approximate USD cost of one agent run, accounting for cache read/write multipliers. */
export function costOf(r: { tokensInput: number; tokensOutput: number; cacheRead: number; cacheCreate: number }): number {
  return (
    (r.tokensInput + r.cacheCreate * 1.25 + r.cacheRead * 0.1) * IN_PER_TOK +
    r.tokensOutput * OUT_PER_TOK
  );
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

interface ArmAgg {
  n: number;
  tokensTotal: number;
  tokensInput: number;
  tokensOutput: number;
  toolCalls: number;
  wallMs: number;
  correctness: number; // fraction 0..1
  score: number;
  cost: number;
}

function aggregate(rows: Row[]): ArmAgg {
  return {
    n: rows.length,
    tokensTotal: mean(rows.map((r) => r.tokensTotal)),
    tokensInput: mean(rows.map((r) => r.tokensInput)),
    tokensOutput: mean(rows.map((r) => r.tokensOutput)),
    toolCalls: mean(rows.map((r) => r.toolCalls)),
    wallMs: mean(rows.map((r) => r.wallMs)),
    correctness: mean(rows.map((r) => (r.correct ? 1 : 0))),
    score: mean(rows.map((r) => r.score)),
    cost: mean(rows.map((r) => costOf(r))),
  };
}

function pctDelta(cold: number, graph: number): string {
  if (cold === 0) return "n/a";
  const d = ((graph - cold) / cold) * 100;
  return (d > 0 ? "+" : "") + d.toFixed(0) + "%";
}

function fmt(n: number): string {
  return n >= 1000 ? Math.round(n).toLocaleString() : n.toFixed(n < 10 ? 1 : 0);
}

const ARM_LABEL: Record<Arm, string> = { cold: "Cold", graph: "Graph (push)", pull: "Graft (pull)" };

/** The metric table for one row subset, one column per arm plus a Δ-vs-cold
 * column for every non-cold arm present. */
function metricTable(rows: Row[], arms: Arm[]): string[] {
  const agg = new Map<Arm, ArmAgg>(arms.map((a) => [a, aggregate(rows.filter((r) => r.arm === a))]));
  const cold = agg.get("cold");

  const header = ["Metric", ...arms.map((a) => ARM_LABEL[a])];
  const cells = (label: string, value: (a: ArmAgg) => number, render: (v: number) => string, delta?: (c: number, x: number) => string) => {
    const out = [label];
    for (const a of arms) {
      const v = value(agg.get(a)!);
      let cell = render(v);
      if (delta && cold && a !== "cold") cell += ` (${delta(value(cold), v)})`;
      out.push(cell);
    }
    return `| ${out.join(" | ")} |`;
  };

  const lines = [`| ${header.join(" | ")} |`, `|${header.map(() => "---").join("|")}|`];
  lines.push(cells("Cost / task ($)", (a) => a.cost, (v) => v.toFixed(4), pctDelta));
  lines.push(cells("Uncached input tokens", (a) => a.tokensInput, fmt, pctDelta));
  lines.push(cells("Total tokens (incl. cached)", (a) => a.tokensTotal, fmt, pctDelta));
  lines.push(cells("Output tokens", (a) => a.tokensOutput, fmt, pctDelta));
  lines.push(cells("Tool calls", (a) => a.toolCalls, fmt, pctDelta));
  lines.push(cells("Wall-clock (s)", (a) => a.wallMs, (v) => (v / 1000).toFixed(1), pctDelta));
  lines.push(cells("Correctness", (a) => a.correctness, (v) => (v * 100).toFixed(0) + "%"));
  lines.push(cells("Judge score", (a) => a.score, (v) => v.toFixed(2)));
  return lines;
}

/** Cost + correctness verdict for one non-cold arm vs cold. */
function verdictFor(label: string, c: ArmAgg, g: ArmAgg): string {
  const cheaper = g.cost < c.cost;
  const correctnessHeld = g.correctness >= c.correctness - 0.001;
  return cheaper && correctnessHeld
    ? `✅ ${label} is cheaper (${pctDelta(c.cost, g.cost)} cost) and correctness held or improved.`
    : !cheaper && g.correctness > c.correctness + 0.001
      ? `➖ ${label} costs more (${pctDelta(c.cost, g.cost)}) but is more correct (+${((g.correctness - c.correctness) * 100).toFixed(0)} pts) — a quality win, not a cost win.`
      : cheaper
        ? `⚠️ ${label} is cheaper but correctness dropped ${((c.correctness - g.correctness) * 100).toFixed(0)} pts — not a clean win.`
        : `❌ ${label} costs more with no correctness gain here.`;
}

export function buildMarkdown(rows: Row[]): string {
  const corpora = [...new Set(rows.map((r) => r.corpus))];
  const armOrder: Arm[] = ["cold", "graph", "pull"];
  const lines: string[] = [];
  lines.push("# graft — Benchmark Results", "");
  lines.push(
    `Agent: Claude Sonnet 5 · Judge: Claude Opus 4.8 · ${rows.length} agent runs total.`,
    "",
    "Each cell is the mean across all tasks × trials for that subset/arm; Δ is vs cold. " +
      "**Cold** = agent explores with filesystem tools from zero. **Graph (push)** = same agent, " +
      "same tools, plus a `graft ask --source` bundle injected up front. **Graft (pull)** = same " +
      "agent plus graft_ask/graft_skeleton tools over the prebuilt graph — nothing injected; " +
      "graph context is paid only when the agent asks for it.",
    "",
    "Judge on **cost** (cache-aware: reads ≈0.1×, writes 1.25×) + correctness — \"total tokens\" " +
      "overstates any arm that front-loads cacheable context.",
    "",
  );

  for (const corpus of corpora) {
    const inCorpus = rows.filter((r) => r.corpus === corpus);
    const arms = armOrder.filter((a) => inCorpus.some((r) => r.arm === a));

    lines.push(`## ${corpus}`, "");
    lines.push(...metricTable(inCorpus, arms), "");

    const cold = aggregate(inCorpus.filter((r) => r.arm === "cold"));
    if (arms.includes("cold")) {
      for (const a of arms.filter((x) => x !== "cold")) {
        lines.push(verdictFor(ARM_LABEL[a], cold, aggregate(inCorpus.filter((r) => r.arm === a))));
      }
      lines.push("");
    }

    // The locality split is the honest headline: pre-built context is expected
    // to help on multi-file questions and to be net overhead on localized ones.
    const localities = [...new Set(inCorpus.map((r) => r.locality))];
    if (localities.length > 1) {
      for (const loc of localities.sort()) {
        const sub = inCorpus.filter((r) => r.locality === loc);
        lines.push(`### ${corpus} — ${loc} tasks only`, "");
        lines.push(...metricTable(sub, arms), "");
      }
    }
  }
  return lines.join("\n");
}
