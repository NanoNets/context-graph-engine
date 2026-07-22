---
name: Benchmarking Framework
slug: benchmarking-framework
type: system
sources:
  - path: bench/agent.ts
    hash: e10d64f913c9517cef84cce58ea042d71bed3e94182c791245170eca54060e31
  - path: bench/judge.ts
    hash: 94c222341b066e4f3134b3d9d3f30f31b9ffe7b92967086b07c58f297d349936
  - path: bench/llm.ts
    hash: 6c0d2a02ac6aa86de94f779355020700a4d9016e2f4b431bf75560e1d3c51229
  - path: bench/report.ts
    hash: 775be8c40a8e4172521bba8f6a1f026fa23c4d24b9b5225da3ed5b745077a5b0
  - path: bench/run.ts
    hash: a0d2859628588f45ae31862f5f801d6219802449c23bbbdba9aa51b7b9febf47
  - path: bench/selfcheck.ts
    hash: 0eaf577938e20fa27d9cd0157bc8843fdc37165d85696789334b8605138f4bb4
  - path: bench/tasks.ts
    hash: d21168797f40d193a914aca0c438409d29d300441bc0a6a518c93869240b3b69
sources_digest: afaac16d744b84811efe1b826c2bab23737665e1e62fe39b1267f20f5451b4d0
links:
  - to: ai-model-integration
    relation: uses
    description: Utilizes the OpenRouter service for model interactions.
  - to: benchmarking-results-reporting
    relation: produces
    description: Generates reports summarizing benchmarking results.
  - to: task-management
    relation: depends_on
    description: Relies on defined tasks and corpora for benchmarking.
generator:
  version: 1
covers:
  - symbol: AgentResult
    kind: interface
    at: 'bench/agent.ts:L20-L28'
  - symbol: RunAgentOptions
    kind: interface
    at: 'bench/agent.ts:L30-L42'
  - symbol: safePath
    kind: function
    at: 'bench/agent.ts:L51-L65'
  - symbol: listFiles
    kind: function
    at: 'bench/agent.ts:L67-L94'
  - symbol: walk
    kind: function
    at: 'bench/agent.ts:L69-L91'
  - symbol: globToRegExp
    kind: function
    at: 'bench/agent.ts:L97-L111'
  - symbol: runTool
    kind: function
    at: 'bench/agent.ts:L207-L277'
  - symbol: runAgent
    kind: function
    at: 'bench/agent.ts:L279-L376'
  - symbol: slideCacheBreakpoint
    kind: function
    at: 'bench/agent.ts:L308-L314'
  - symbol: Verdict
    kind: interface
    at: 'bench/judge.ts:L18-L24'
  - symbol: JudgeInput
    kind: interface
    at: 'bench/judge.ts:L26-L32'
  - symbol: extractJson
    kind: function
    at: 'bench/judge.ts:L35-L49'
  - symbol: judge
    kind: function
    at: 'bench/judge.ts:L51-L87'
  - symbol: makeClient
    kind: function
    at: 'bench/llm.ts:L14-L18'
  - symbol: Arm
    kind: type
    at: 'bench/report.ts:L6-L6'
  - symbol: Row
    kind: interface
    at: 'bench/report.ts:L8-L30'
  - symbol: costOf
    kind: function
    at: 'bench/report.ts:L37-L42'
  - symbol: mean
    kind: function
    at: 'bench/report.ts:L44-L46'
  - symbol: ArmAgg
    kind: interface
    at: 'bench/report.ts:L48-L58'
  - symbol: aggregate
    kind: function
    at: 'bench/report.ts:L60-L72'
  - symbol: pctDelta
    kind: function
    at: 'bench/report.ts:L74-L78'
  - symbol: fmt
    kind: function
    at: 'bench/report.ts:L80-L82'
  - symbol: metricTable
    kind: function
    at: 'bench/report.ts:L88-L114'
  - symbol: cells
    kind: function
    at: 'bench/report.ts:L93-L102'
  - symbol: verdictFor
    kind: function
    at: 'bench/report.ts:L117-L127'
  - symbol: buildMarkdown
    kind: function
    at: 'bench/report.ts:L129-L175'
  - symbol: Args
    kind: interface
    at: 'bench/run.ts:L38-L44'
  - symbol: parseArgs
    kind: function
    at: 'bench/run.ts:L46-L66'
  - symbol: pool
    kind: function
    at: 'bench/run.ts:L69-L80'
  - symbol: worker
    kind: function
    at: 'bench/run.ts:L72-L77'
  - symbol: main
    kind: function
    at: 'bench/run.ts:L82-L202'
  - symbol: makeStubClient
    kind: function
    at: 'bench/selfcheck.ts:L19-L48'
  - symbol: main
    kind: function
    at: 'bench/selfcheck.ts:L50-L114'
  - symbol: repoPath
    kind: function
    at: 'bench/tasks.ts:L30-L33'
  - symbol: Task
    kind: interface
    at: 'bench/tasks.ts:L35-L45'
  - symbol: Corpus
    kind: interface
    at: 'bench/tasks.ts:L47-L53'
---
<!-- context:generated:start -->
## Summary

This component orchestrates the benchmarking process, evaluating AI models through agents and judges, and reporting results. It integrates various modules for running benchmarks, scoring correctness, and managing configurations.

## Related

- uses [[ai-model-integration]] — Utilizes the OpenRouter service for model interactions.
- produces [[benchmarking-results-reporting]] — Generates reports summarizing benchmarking results.
- depends on [[task-management]] — Relies on defined tasks and corpora for benchmarking.
<!-- context:generated:end -->

## Notes

_Anything written below the generated block is preserved when the graph is regenerated._
