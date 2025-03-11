import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { embeddingCache, generateEmbeddingCacheKey } from "./cache";

interface SearchResult {
  id: string;
  score: number;
  text: string;
  source: string;
  metadata: Record<string, unknown>;
}

interface HybridSearchOptions {
  query: string;
  useCase?: string;
  topK?: number;
  minScore?: number;
  vectorWeight?: number;
  keywordWeight?: number;
}

/**
 * Performs a hybrid search combining vector similarity and keyword matching
 * @param options Search options
 * @returns Array of search results with combined scores
 */
export async function hybridSearch({
  query,
  useCase,
  topK = 5,
  minScore = 0.3,
  vectorWeight = 0.7,
  keywordWeight = 0.3,
}: HybridSearchOptions): Promise<SearchResult[]> {
  try {
    // Initialize Pinecone client
    const pinecone = new Pinecone({
      apiKey: getEnvironmentVariable("PINECONE_API_KEY") as string,
    });

    // Initialize embeddings model
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: getEnvironmentVariable("OPENAI_API_KEY") as string,
      modelName: "text-embedding-3-mini",
    });

    // Check cache for query embedding
    const embeddingCacheKey = generateEmbeddingCacheKey(query);
    let queryEmbedding = await embeddingCache.get<number[]>(embeddingCacheKey);

    if (!queryEmbedding) {
      // Generate embedding if not in cache
      queryEmbedding = await embeddings.embedQuery(query);
      // Cache the embedding
      await embeddingCache.set(embeddingCacheKey, queryEmbedding);
    }

    // Get Pinecone index
    const index = pinecone.index(process.env.PINECONE_INDEX as string);

    // Prepare filter for use case if provided
    const filter = useCase ? { useCase } : undefined;

    // Perform vector search
    const vectorResults = await index.query({
      vector: queryEmbedding,
      topK: topK * 2, // Get more results for hybrid reranking
      includeMetadata: true,
      filter,
    });

    // Extract keywords from the query (simple implementation)
    const keywords = extractKeywords(query);

    // Process and score results
    const results = vectorResults.matches
      .filter(
        (match) => match.metadata && typeof match.metadata.text === "string"
      )
      .map((match) => {
        const text = match.metadata!.text as string;
        const source = (match.metadata!.originalName as string) || "unknown";

        // Calculate vector score (already normalized between 0-1)
        const vectorScore = match.score || 0;

        // Calculate keyword score
        const keywordScore = calculateKeywordScore(text, keywords);

        // Combine scores with weights
        const combinedScore =
          vectorScore * vectorWeight + keywordScore * keywordWeight;

        return {
          id: match.id,
          score: combinedScore,
          text,
          source,
          metadata: match.metadata as Record<string, unknown>,
        };
      })
      .filter((result) => result.score > minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return results;
  } catch (error) {
    console.error("Hybrid search error:", error);
    throw error;
  }
}

/**
 * Extract keywords from a query string
 * @param query The search query
 * @returns Array of keywords
 */
function extractKeywords(query: string): string[] {
  // Remove common stop words
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "about",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "can",
    "could",
    "will",
    "would",
    "should",
    "shall",
    "may",
    "might",
    "must",
    "of",
    "by",
    "from",
    "as",
    "this",
    "that",
    "these",
    "those",
  ]);

  // Tokenize and filter
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/) // Split by whitespace
    .filter((word) => word.length > 2 && !stopWords.has(word)); // Filter stop words and short words
}

/**
 * Calculate keyword match score for a text
 * @param text The text to search in
 * @param keywords Array of keywords to search for
 * @returns Score between 0-1 based on keyword matches
 */
function calculateKeywordScore(text: string, keywords: string[]): number {
  if (!keywords.length) return 0;

  const lowerText = text.toLowerCase();
  let matchCount = 0;

  // Count keyword matches
  for (const keyword of keywords) {
    if (lowerText.includes(keyword)) {
      matchCount++;
    }
  }

  // Calculate score based on percentage of keywords found
  return matchCount / keywords.length;
}
