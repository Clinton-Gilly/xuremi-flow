import { z } from "zod";
import { aiCredential, embeddingModelFor } from "@/lib/ai/providers";
import { ConnectorError, defineNode } from "../define";

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

type ExtractedDoc = {
  text: string;
  originalIndex: number;
  metadata: Record<string, unknown>;
};

function extractDocs(raw: unknown, textKey: string): ExtractedDoc[] {
  if (!raw) return [];
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
      else list = [raw];
    } catch {
      list = [raw];
    }
  } else {
    list = [raw];
  }

  const results: ExtractedDoc[] = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (typeof item === "string") {
      results.push({ text: item, originalIndex: i, metadata: {} });
    } else if (typeof item === "object" && item !== null) {
      const record = item as Record<string, unknown>;
      const textVal = record[textKey];
      const text = typeof textVal === "string" ? textVal : JSON.stringify(item);
      results.push({ text, originalIndex: i, metadata: record });
    }
  }
  return results;
}

export const vectorStoreNode = defineNode({
  type: "ai.vectorStore",
  name: "Vector Store & RAG",
  description: "Perform semantic search, retrieve relevant documents with vector embeddings, or generate embeddings.",
  category: "ai",
  guide: {
    summary:
      "Performs vector semantic search and RAG retrieval. Provide a search query and a list of documents or database rows; " +
      "the node embeds them and returns the top matching documents ranked by similarity score. Access matches via {{ this_node.matches }} " +
      "or the top answer via {{ this_node.topMatch }}.",
    outputs: { out: "ranked search matches and relevance scores" },
  },
  icon: "Database",
  credential: "ai",
  requiresFeature: null,
  version: "v1",
  inputs: z.object({
    connectionId: z.string().describe("AI Connection to use for embeddings (e.g. OpenAI, Google, Mistral)").meta({ label: "AI Connection" }),
    mode: z.enum(["semanticSearch", "embedTexts"]).default("semanticSearch").describe("Operation mode").meta({ label: "Mode" }),
    query: z.string().optional().default("").describe("Search query to match against documents").meta({ label: "Search query" }),
    documents: z.any().optional().describe("Array of text strings or objects to search through").meta({ label: "Documents" }),
    textKey: z.string().optional().default("text").describe("Field name containing the text if documents are objects").meta({ label: "Text key" }),
    topK: z.coerce.number().int().min(1).max(50).default(5).describe("Maximum number of matching documents to return").meta({ label: "Top K" }),
    minScore: z.coerce.number().min(0).max(1).default(0).describe("Minimum cosine similarity threshold (0 - 1)").meta({ label: "Minimum score" }),
    embeddingModel: z.string().optional().default("text-embedding-3-small").describe("Embedding model name").meta({ label: "Embedding model" }),
  }),
  outputs: z.object({
    matches: z.array(
      z.object({
        text: z.string(),
        score: z.number(),
        index: z.number(),
        metadata: z.record(z.string(), z.any()).optional(),
      }),
    ).describe("Ranked matching documents"),
    count: z.number().describe("Number of matched results"),
    topMatch: z.any().optional().describe("Top ranking document"),
    embeddings: z.array(z.array(z.number())).optional().describe("Raw embeddings when in embedTexts mode"),
  }),
  async run({ inputs, credential }) {
    const { provider, apiKey } = aiCredential(credential);
    const {
      mode = "semanticSearch",
      query = "",
      documents,
      textKey = "text",
      topK = 5,
      minScore = 0,
      embeddingModel = "text-embedding-3-small",
    } = inputs;

    const extracted = extractDocs(documents, textKey);
    if (extracted.length === 0) {
      return {
        matches: [],
        count: 0,
        topMatch: null,
      };
    }

    const { embed, embedMany } = await import("ai");
    const model = await embeddingModelFor(provider, apiKey, embeddingModel);

    if (mode === "embedTexts") {
      const { embeddings } = await embedMany({
        model,
        values: extracted.map((d) => d.text),
      });

      return {
        matches: [],
        count: 0,
        topMatch: null,
        embeddings,
      };
    }

    // Semantic search mode:
    if (!query || query.trim() === "") {
      throw new ConnectorError("A search query is required for semanticSearch mode", 400);
    }

    const [{ embedding: queryVector }, { embeddings: docVectors }] = await Promise.all([
      embed({ model, value: query }),
      embedMany({ model, values: extracted.map((d) => d.text) }),
    ]);

    const scored = extracted.map((doc, i) => {
      const score = cosineSimilarity(queryVector, docVectors[i]);
      return {
        text: doc.text,
        score: Math.round(score * 10000) / 10000,
        index: doc.originalIndex,
        metadata: doc.metadata,
      };
    });

    const matches = scored
      .filter((m) => m.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return {
      matches,
      count: matches.length,
      topMatch: matches[0] ?? null,
    };
  },
});
