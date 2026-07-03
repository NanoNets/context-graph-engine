# Context Graph Engine — Demo Guide

> Read this to understand what's been built and to run a clean demo today.

---

## 1. What this is, in one sentence

An **open-source library** that turns any pile of docs into a **structured context graph** — entities + typed relationships grounded in the source text — that AI agents **read from before doing work** and **write learnings back into**, so the shared knowledge compounds over time.

Think "durable, structured memory for a team of agents" — the same integration shape as ByteRover, but self-hosted, embedded, and runnable with a single `curl`.

---

## 2. What's been built (status)

| Piece | What it does | Status |
|-------|--------------|--------|
| **Core engine** (`src/engine.ts`) | `ingest` → `read` → `contribute` over a graph | ✅ Done |
| **Knowledge graph model** (`src/graph/`) | Nodes (entities), edges (typed relations), chunks (evidence), each with `confidence` + `observation` counts | ✅ Done |
| **Dedup + reinforcement** (`src/graph/merge.ts`) | New knowledge is matched to existing nodes by name/alias **and** embedding similarity; matches are merged & reinforced, not duplicated | ✅ Done |
| **Retrieval** (`src/retrieval/`) | Semantic match on entities → one-hop graph expansion → supporting passages → a ready-to-inject prompt block | ✅ Done |
| **Storage** (`src/graph/sqlite-store.ts`) | Embedded SQLite (`better-sqlite3`), zero infra; swappable behind a `GraphStore` interface | ✅ Done |
| **Local-first providers** (`src/ai/local.ts`) | In-process embeddings (transformers.js) + local extraction (Ollama) — **runs with no API keys** | ✅ Done |
| **Cloud auto-upgrade** (`src/engine.ts`) | If `OPENROUTER_API_KEY` is set, uses OpenRouter for extraction automatically (any tool-calling model) for higher quality | ✅ Done |
| **PDF ingestion** (`src/ingest/pdf.ts`) | `.pdf` files parsed to text automatically (pure-JS `unpdf`, no native deps) — via CLI, library, or the `context_ingest_file` MCP tool | ✅ Done |
| **Three access modes** | Library, `context-graph` CLI, and `context-graph-mcp` MCP server (5 tools) for any agent | ✅ Done |
| **Demo PDFs** (`examples/demo-docs/`) | 3 detail-rich fictional docs + a generator script | ✅ Done |
| **One-line installer** (`install.sh`) | `curl … | sh` clones, builds, and puts both commands on PATH | ✅ Done |
| Update modes (silent vs. flagged) | Deferred per your call — needs discussion | ⏸ Deferred |
| Delete / decay of stale nodes | In the spec, not yet built | ⬜ Not started |

**The whole codebase is commented** — every module has a doc comment explaining its role, and the non-obvious logic (dedup matching, reinforcement, chunk overlap, one-hop expansion) is annotated inline.

---

## 3. ⚠️ Before you demo: pick a provider

The engine needs a model for **extraction** (pulling entities/relationships out of text). Embeddings run locally with no setup, but extraction needs one of:

**Right now this machine has neither Ollama nor any API key set**, so pick one path first:

### Path A — Cloud via OpenRouter (fastest to a clean demo, best quality) ✅ recommended for a live demo
```bash
export OPENROUTER_API_KEY=sk-or-...     # extraction (default model: openai/gpt-4o-mini)
export OPENAI_API_KEY=sk-...            # embeddings (optional; embeddings stay local otherwise)
```
Reliable, fast, produces the richest graph. One OpenRouter key covers extraction — embeddings run locally unless you also set an OpenAI key. Best if you want the demo to look sharp.

### Path B — Fully local (the "no keys" story your manager asked for)
```bash
# install Ollama from https://ollama.com, then:
ollama pull llama3.2
```
No accounts, nothing leaves the machine. Slightly coarser graph and a one-time model download — this is the story to *tell*, but Path A is smoother to *show* live if you're short on time.

> Tip: you can do both — run the demo on cloud for polish, then flip `CONTEXT_GRAPH_LOCAL=1` and re-run one command to prove it also works with zero keys.

---

## 4. The MCP demo (the main event)

This is the flow to show: **install → point an MCP client at it → ingest PDFs → ask questions → the facts from the PDFs come back.** Verified end-to-end (OpenRouter extraction + local embeddings).

There are 3 demo PDFs already generated in `examples/demo-docs/` (fictional "Northwind" company — architecture, billing runbook, onboarding). Regenerate them any time with `node scripts/make-demo-pdfs.mjs`.

### Step 1 — Install
```bash
# the one-liner your manager asked for (once the repo URL is filled in):
curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/context-graph-engine/main/install.sh | sh

# …or, from this checkout, for today:
npm install && npm run build && npm link
```
`npm link` puts `context-graph` and `context-graph-mcp` on your PATH.

### Step 2 — Point your MCP client at it
Add this to your Claude Code / Cursor MCP config (`.mcp.json` or the client's settings). Set a DB path for the demo graph and your OpenRouter key:

```json
{
  "mcpServers": {
    "context-graph": {
      "command": "context-graph-mcp",
      "env": {
        "CONTEXT_GRAPH_DB": "/absolute/path/to/northwind-demo.db",
        "OPENROUTER_API_KEY": "sk-or-..."
      }
    }
  }
}
```
Restart the client so it picks up the server. The agent now has 5 tools: `context_read`, `context_contribute`, `context_ingest`, `context_ingest_file`, `context_stats`.

### Step 3 — Ingest the PDFs (say this to the agent)
> "Ingest these files into the context graph:
> /abs/path/examples/demo-docs/northwind-architecture.pdf,
> /abs/path/examples/demo-docs/northwind-billing-runbook.pdf,
> /abs/path/examples/demo-docs/northwind-onboarding.pdf"

The agent calls `context_ingest_file`. The PDFs are parsed, chunked, embedded, and extracted into the graph. You'll see something like "✓ 3 chunks, +23 entities, +35 relationships" per file. Then ask it to run `context_stats` — ~58 entities, ~70 relationships across 3 documents.

### Step 4 — Ask questions (the payoff)
Ask the agent things that only live inside the PDFs. It calls `context_read` and gets the answer back — as structured entities/relationships **and** the exact source passages:

- *"How are failed charges retried, and when does an account get suspended?"*
  → 3 retries with exponential backoff (1h / 6h / 24h) → `past_due` → suspended after 7 days.
- *"How long do access tokens last and what backs the Auth Service?"*
  → access tokens expire after 15 minutes; Auth Service is backed by Redis for token revocation.
- *"Who do I escalate a Stripe outage to?"*
  → Dana Whitfield (Payments team lead), post in `#billing-incidents`, page PagerDuty service `northwind-billing`.
- *"What do I do in my first week as a new hire?"*
  → security training, ship one small prod change, on-call shadow; buddy assigned day one.

**The point to land:** these facts came from three separate PDFs, and the agent gets a *structured, cross-referenced* answer with the source text as evidence — not a blind vector-snippet dump.

### Step 5 (optional) — Show it getting smarter
Tell the agent: *"Contribute this learning: the Dunning Worker also posts to #billing-alerts after the final retry."* It calls `context_contribute`. Ask the billing question again — the new fact is now merged into the graph, and re-stated facts reinforce (bump confidence) rather than duplicate.

### Fallback (no MCP client handy) — same thing via CLI
```bash
context-graph --db ./northwind-demo.db ingest examples/demo-docs/*.pdf
context-graph --db ./northwind-demo.db query "how are failed charges retried?"
context-graph --db ./northwind-demo.db stats
```
(Delete `northwind-demo.db*` to reset.)

---

## 5. Talking points (what to say while it runs)

- **"It's a graph, not a bag of chunks."** A vector store gives you similar snippets. This gives an agent *structure* it can reason over — what things are, and how they connect — plus the source passages as evidence.
- **"Agents write back."** Most RAG is read-only. Here an agent contributes a learning and it's merged into shared knowledge with provenance, so the next agent benefits.
- **"It compounds."** Confidence + observation counts mean the tenth confirmation of a fact strengthens it; one-off noise stays low-confidence. The graph curates itself.
- **"Zero infrastructure, one command."** Embedded SQLite, in-process embeddings, `curl | sh`. No database to stand up, no keys required to start. Cloud is an *upgrade*, not a requirement.
- **"TypeScript & MCP-native."** Most comparable OSS (Graphiti, GraphRAG, Cognee, mem0) is Python and/or server/cloud-oriented. This slots directly into a JS/TS agent stack and speaks MCP out of the box.

---

## 6. One loose end before publishing

`install.sh` and the README's `curl` command still contain a placeholder repo URL:

```
https://github.com/YOUR_ORG/context-graph-engine.git
```

Once this is pushed to GitHub, replace `YOUR_ORG/context-graph-engine` in **`install.sh`** and **`README.md`** (the local branch is `master`; the installer/README reference `main` — align those too). After that the one-line install is live. Not needed for today's demo — the library/CLI/MCP paths all run straight from the repo.

---

## 7. Where to look in the code

```
src/
  engine.ts            ← start here: ingest / read / contribute, provider selection
  ai/
    providers.ts       ← config resolution (constructor → env → defaults) + interfaces
    local.ts           ← key-free LocalEmbedder + OllamaExtractor
    openrouter.ts      ← cloud extraction via OpenRouter (tool-calling)
    openai.ts          ← OpenAI embeddings (optional)
  graph/
    types.ts           ← the data model (nodes, edges, chunks) — read this to grok the domain
    merge.ts           ← dedup + reinforcement (the "gets smarter" logic)
    sqlite-store.ts    ← the embedded storage backend
  ingest/
    chunker.ts         ← paragraph-aware chunking with overlap
    pdf.ts             ← PDF → text extraction (unpdf)
  retrieval/retriever.ts ← semantic match + one-hop expansion + prompt rendering
  cli.ts               ← the CLI
  mcp.ts               ← the MCP server (context_read / _contribute / _ingest / _ingest_file / _stats)
examples/
  quickstart.ts        ← library quickstart
  demo-docs/*.pdf      ← the 3 demo PDFs used in §4
scripts/make-demo-pdfs.mjs ← regenerates the demo PDFs
```
