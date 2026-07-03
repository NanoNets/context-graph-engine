import OpenAI from "openai";
import type { Extractor } from "./providers.js";
import type { Extraction } from "../graph/types.js";

/**
 * Entity/relationship extractor backed by OpenRouter (https://openrouter.ai).
 *
 * OpenRouter exposes an OpenAI-compatible chat-completions API in front of many
 * model providers, so we reuse the `openai` SDK with a custom `baseURL` and rely
 * on OpenAI-style tool calling to get schema-valid structured output. Pick any
 * tool-calling model via `CONTEXT_GRAPH_OPENROUTER_MODEL` (default gpt-4o-mini).
 */
const EXTRACTION_TOOL = {
  type: "function" as const,
  function: {
    name: "record_graph",
    description:
      "Record the entities and relationships extracted from the text as a knowledge graph.",
    parameters: {
      type: "object",
      properties: {
        entities: {
          type: "array",
          description: "Distinct real-world entities or concepts mentioned in the text.",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Canonical, specific name of the entity." },
              type: {
                type: "string",
                description:
                  "Coarse category, lowercase, e.g. concept, system, service, api, person, org, policy, tool, event, metric.",
              },
              summary: {
                type: "string",
                description:
                  "One or two sentences describing the entity, grounded in the text.",
              },
              aliases: {
                type: "array",
                items: { type: "string" },
                description: "Alternate names/abbreviations used for this entity.",
              },
            },
            required: ["name", "type", "summary"],
          },
        },
        relations: {
          type: "array",
          description: "Directed relationships between the extracted entities.",
          items: {
            type: "object",
            properties: {
              source: { type: "string", description: "Name of the source entity." },
              target: { type: "string", description: "Name of the target entity." },
              relation: {
                type: "string",
                description:
                  "Predicate in snake_case, e.g. depends_on, part_of, authenticates_with, produces, owns, replaces.",
              },
              description: {
                type: "string",
                description: "Short explanation of the relationship.",
              },
            },
            required: ["source", "target", "relation"],
          },
        },
      },
      required: ["entities", "relations"],
    },
  },
};

const SYSTEM_PROMPT = `You are a knowledge-graph extraction engine. Given a passage of text, identify the salient entities/concepts and the relationships between them.

Rules:
- Prefer specific, canonical entity names over pronouns or vague phrases.
- Use coarse lowercase entity types, e.g. concept, system, service, api, person, org, policy, tool, event, metric.
- Use snake_case relation predicates, e.g. depends_on, part_of, authenticates_with, produces, owns, replaces.
- Only include relationships where BOTH endpoints are in your entities list.
- Deduplicate: merge obvious surface-form variants into one entity with aliases.
- Do not invent facts that are not supported by the text.
Always respond by calling the record_graph tool.`;

export class OpenRouterExtractor implements Extractor {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string, baseUrl = "https://openrouter.ai/api/v1") {
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl,
      // Optional attribution headers OpenRouter surfaces in dashboards; harmless if unused.
      defaultHeaders: { "X-Title": "Context Graph Engine" },
    });
    this.model = model;
  }

  async extract(text: string, opts?: { hint?: string }): Promise<Extraction> {
    const userContent = opts?.hint
      ? `Context hint: ${opts.hint}\n\nText:\n${text}`
      : `Text:\n${text}`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      tools: [EXTRACTION_TOOL],
      tool_choice: { type: "function", function: { name: "record_graph" } },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    const call = response.choices[0]?.message?.tool_calls?.[0];
    if (!call || call.type !== "function") return { entities: [], relations: [] };

    let parsed: Partial<Extraction>;
    try {
      parsed = JSON.parse(call.function.arguments) as Partial<Extraction>;
    } catch {
      return { entities: [], relations: [] };
    }

    return {
      entities: (parsed.entities ?? []).filter((e) => e && e.name && e.type),
      relations: (parsed.relations ?? []).filter(
        (r) => r && r.source && r.target && r.relation,
      ),
    };
  }
}
