import { encode } from "gpt-tokenizer";
import { TextChunk } from "./text-splitter";
import { calculateCosineSimilarity } from "./utils";
import { OpenAIEmbeddings } from "@langchain/openai";
import { getEnvironmentVariable } from "@langchain/core/utils/env";

export interface ContextChunk extends TextChunk {
  relevanceScore?: number;
  semanticScore?: number;
  keywordScore?: number;
  compressionRatio?: number;
  metadata?: {
    source: string;
    timestamp: string;
    additionalInfo?: Record<string, unknown>;
  };
}

export interface ContextManagerOptions {
  maxTokens?: number;
  minRelevanceScore?: number;
  overlapThreshold?: number;
  deduplicationThreshold?: number;
  compressionThreshold?: number;
  semanticWeight?: number;
  keywordWeight?: number;
  adaptiveThreshold?: boolean;
}

const DEFAULT_OPTIONS: Required<ContextManagerOptions> = {
  maxTokens: 3000,
  minRelevanceScore: 0.3,
  overlapThreshold: 0.8,
  deduplicationThreshold: 0.9,
  compressionThreshold: 0.5,
  semanticWeight: 0.7,
  keywordWeight: 0.3,
  adaptiveThreshold: true,
};

export class ContextManager {
  private options: Required<ContextManagerOptions>;
  private embeddings: OpenAIEmbeddings;

  constructor(options: ContextManagerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: getEnvironmentVariable("OPENAI_API_KEY") as string,
      modelName: "text-embedding-3-small",
    });
  }

  /**
   * Prunes and prioritizes context chunks based on relevance and token limits
   */
  public async optimizeContext(
    query: string,
    chunks: ContextChunk[],
    embeddings: number[][]
  ): Promise<ContextChunk[]> {
    // Calculate relevance scores using both semantic and keyword matching
    const scoredChunks = await this.calculateRelevanceScores(
      query,
      chunks,
      embeddings
    );

    // Calculate adaptive threshold if enabled
    const threshold = this.options.adaptiveThreshold
      ? this.calculateAdaptiveThreshold(scoredChunks)
      : this.options.minRelevanceScore;

    // Remove chunks with low relevance scores
    let filteredChunks = this.pruneByRelevance(scoredChunks, threshold);

    // Compress long chunks if needed
    filteredChunks = await this.compressChunks(filteredChunks);

    // Remove duplicate or highly overlapping content
    filteredChunks = this.deduplicateChunks(filteredChunks);

    // Sort chunks by relevance score
    filteredChunks.sort((a, b) => {
      return (b.relevanceScore || 0) - (a.relevanceScore || 0);
    });

    // Limit total tokens while keeping most relevant chunks
    return this.limitTokens(filteredChunks);
  }

  /**
   * Calculates relevance scores using both semantic and keyword matching
   */
  private async calculateRelevanceScores(
    query: string,
    chunks: ContextChunk[],
    embeddings: number[][]
  ): Promise<ContextChunk[]> {
    // Get query embedding
    const queryEmbedding = await this.embeddings.embedQuery(query);

    // Extract keywords from query
    const queryKeywords = this.extractKeywords(query);

    return chunks.map((chunk, index) => {
      const chunkEmbedding = embeddings[index];

      // Calculate semantic similarity
      const semanticScore = calculateCosineSimilarity(
        queryEmbedding,
        chunkEmbedding
      );

      // Calculate keyword match score
      const keywordScore = this.calculateKeywordScore(
        chunk.text,
        queryKeywords
      );

      // Combined relevance score
      const relevanceScore =
        this.options.semanticWeight * semanticScore +
        this.options.keywordWeight * keywordScore;

      return {
        ...chunk,
        relevanceScore,
        semanticScore,
        keywordScore,
      };
    });
  }

  /**
   * Calculates adaptive threshold based on score distribution
   */
  private calculateAdaptiveThreshold(chunks: ContextChunk[]): number {
    const scores = chunks
      .map((chunk) => chunk.relevanceScore || 0)
      .sort((a, b) => b - a);

    if (scores.length === 0) return this.options.minRelevanceScore;

    // Calculate mean and standard deviation
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
      scores.length;
    const stdDev = Math.sqrt(variance);

    // Set threshold at mean - 1 standard deviation, but not lower than base threshold
    return Math.max(mean - stdDev, this.options.minRelevanceScore);
  }

  /**
   * Removes chunks with relevance scores below the threshold
   */
  private pruneByRelevance(
    chunks: ContextChunk[],
    threshold: number
  ): ContextChunk[] {
    return chunks.filter((chunk) => (chunk.relevanceScore || 0) >= threshold);
  }

  /**
   * Compresses long chunks while preserving relevant information
   */
  private async compressChunks(
    chunks: ContextChunk[]
  ): Promise<ContextChunk[]> {
    return Promise.all(
      chunks.map(async (chunk) => {
        if (chunk.tokens <= 100) return chunk; // Don't compress small chunks

        // Split into sentences
        const sentences = chunk.text.match(/[^.!?]+[.!?]+/g) || [chunk.text];

        // Get embeddings for each sentence
        const sentenceEmbeddings = await Promise.all(
          sentences.map((sentence) => this.embeddings.embedQuery(sentence))
        );

        // Calculate importance score for each sentence
        const sentenceScores = sentenceEmbeddings.map((embedding, i) => ({
          sentence: sentences[i],
          score: calculateCosineSimilarity(
            embedding,
            chunk.semanticScore ? embedding : new Array(1536).fill(0)
          ),
        }));

        // Sort by importance and take top sentences
        sentenceScores.sort((a, b) => b.score - a.score);
        const compressedText = sentenceScores
          .slice(
            0,
            Math.ceil(sentences.length * this.options.compressionThreshold)
          )
          .map((s) => s.sentence)
          .join(" ");

        const compressedTokens = encode(compressedText).length;
        const compressionRatio = compressedTokens / chunk.tokens;

        return {
          ...chunk,
          text: compressedText,
          tokens: compressedTokens,
          compressionRatio,
        };
      })
    );
  }

  /**
   * Extracts keywords from text
   */
  private extractKeywords(text: string): Set<string> {
    const stopWords = new Set([
      "a",
      "an",
      "and",
      "are",
      "as",
      "at",
      "be",
      "by",
      "for",
      "from",
      "has",
      "he",
      "in",
      "is",
      "it",
      "its",
      "of",
      "on",
      "that",
      "the",
      "to",
      "was",
      "were",
      "will",
      "with",
    ]);

    return new Set(
      text
        .toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length > 2 && !stopWords.has(word))
    );
  }

  /**
   * Calculates keyword match score
   */
  private calculateKeywordScore(
    text: string,
    queryKeywords: Set<string>
  ): number {
    const textKeywords = this.extractKeywords(text);
    const intersection = new Set(
      [...queryKeywords].filter((keyword) => textKeywords.has(keyword))
    ).size;
    return queryKeywords.size > 0 ? intersection / queryKeywords.size : 0;
  }

  /**
   * Removes duplicate or highly overlapping chunks
   */
  private deduplicateChunks(chunks: ContextChunk[]): ContextChunk[] {
    const uniqueChunks: ContextChunk[] = [];

    for (const chunk of chunks) {
      let isDuplicate = false;

      for (const existingChunk of uniqueChunks) {
        const similarity = this.calculateTextSimilarity(
          chunk.text,
          existingChunk.text
        );

        if (similarity >= this.options.deduplicationThreshold) {
          isDuplicate = true;
          // Keep the chunk with higher relevance score
          if (
            (chunk.relevanceScore || 0) > (existingChunk.relevanceScore || 0)
          ) {
            const index = uniqueChunks.indexOf(existingChunk);
            uniqueChunks[index] = chunk;
          }
          break;
        }

        // Check for significant overlap
        if (similarity >= this.options.overlapThreshold) {
          isDuplicate = true;
          // Merge overlapping chunks if they're from the same source
          if (
            chunk.metadata?.source === existingChunk.metadata?.source &&
            chunk.metadata?.timestamp === existingChunk.metadata?.timestamp
          ) {
            const mergedChunk = this.mergeChunks(chunk, existingChunk);
            const index = uniqueChunks.indexOf(existingChunk);
            uniqueChunks[index] = mergedChunk;
          } else if (
            (chunk.relevanceScore || 0) > (existingChunk.relevanceScore || 0)
          ) {
            // Keep the chunk with higher relevance score
            const index = uniqueChunks.indexOf(existingChunk);
            uniqueChunks[index] = chunk;
          }
          break;
        }
      }

      if (!isDuplicate) {
        uniqueChunks.push(chunk);
      }
    }

    return uniqueChunks;
  }

  /**
   * Limits the total number of tokens while keeping the most relevant chunks
   */
  private limitTokens(chunks: ContextChunk[]): ContextChunk[] {
    const result: ContextChunk[] = [];
    let totalTokens = 0;

    for (const chunk of chunks) {
      if (totalTokens + chunk.tokens <= this.options.maxTokens) {
        result.push(chunk);
        totalTokens += chunk.tokens;
      } else {
        break;
      }
    }

    return result;
  }

  /**
   * Calculates similarity between two text strings
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity for now
    // TODO: Implement more sophisticated text similarity algorithm
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter((word) => words2.has(word)))
      .size;
    const union = new Set([...words1, ...words2]).size;
    return intersection / union;
  }

  /**
   * Merges two overlapping chunks
   */
  private mergeChunks(
    chunk1: ContextChunk,
    chunk2: ContextChunk
  ): ContextChunk {
    const combinedText = `${chunk1.text}\n${chunk2.text}`;
    const combinedTokens = encode(combinedText).length;

    return {
      text: combinedText,
      tokens: combinedTokens,
      relevanceScore: Math.max(
        chunk1.relevanceScore || 0,
        chunk2.relevanceScore || 0
      ),
      metadata: chunk1.metadata, // Use metadata from the first chunk
    };
  }
}
