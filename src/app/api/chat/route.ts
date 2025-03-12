import { NextResponse } from "next/server";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { Configuration, OpenAIApi } from "openai-edge";
import { ContextManager } from "../../../lib/context-manager";
import { ResponseOptimizer } from "../../../lib/response/ResponseOptimizer";
import { TokenUsageTracker } from "../../../lib/analytics/TokenUsageTracker";
import { encode } from "gpt-tokenizer";
import pool from "../../../lib/db";

// Initialize OpenAI configuration
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

// Initialize managers
const contextManager = new ContextManager();
const responseOptimizer = new ResponseOptimizer();
const tokenTracker = TokenUsageTracker.getInstance();

interface DocumentChunk {
  vector_id: string;
  text: string;
  metadata?: Record<string, unknown>;
  chunk_index?: number;
}

interface ChunkData {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
  relevanceScore: number;
}

export async function POST(req: Request) {
  try {
    const { messages, useCase, documentIds = [] } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // Get context based on document IDs or query
    let chunks: ChunkData[] = [];
    let relevanceScores: number[] = [];

    if (documentIds && documentIds.length > 0) {
      // Get context from specific documents
      const client = await pool.connect();
      try {
        // Get vector IDs for the specified documents
        const vectorResult = await client.query<DocumentChunk>(
          `SELECT vector_id, text_content as text, '{}'::jsonb as metadata 
           FROM document_chunks 
           WHERE document_id IN (${documentIds.join(",")})
           ORDER BY document_id, chunk_index`
        );

        // Format chunks from the database
        chunks = vectorResult.rows.map((row) => ({
          id: row.vector_id,
          text: row.text,
          metadata: row.metadata || {},
          relevanceScore: 1.0, // All chunks from selected documents are considered relevant
        }));

        // Create scores array
        relevanceScores = chunks.map(() => 1.0);
      } finally {
        client.release();
      }
    } else {
      // Get context based on query
      const contextResult = await contextManager.getContext(
        lastMessage.content
      );

      // Convert ContextChunk[] to ChunkData[]
      chunks = contextResult.chunks.map((chunk, index) => ({
        id: `chunk_${index}`, // Generate an ID since ContextChunk doesn't have vector_id
        text: chunk.text,
        metadata: chunk.metadata || {},
        relevanceScore: chunk.relevanceScore || 0,
      }));

      // Use the scores array directly from contextResult
      relevanceScores = contextResult.scores;
    }

    // Prepare system message with context
    const contextStr = chunks.map((chunk) => chunk.text).join("\n\n");
    const systemMessage = {
      role: "system",
      content: `You are a helpful AI assistant. Use the following context to answer the user's question:\n\n${contextStr}\n\nIf the context doesn't contain relevant information, say so. Always cite your sources using [1], [2], etc.`,
    };

    // Calculate input tokens
    const inputTokens =
      encode(systemMessage.content).length +
      messages.reduce(
        (sum: number, msg: { content: string }) =>
          sum + encode(msg.content).length,
        0
      );

    // Make API request
    const response = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [systemMessage, ...messages],
      stream: true,
    });

    // Create stream transformer to optimize response and track tokens
    let responseContent = "";
    const stream = OpenAIStream(response, {
      async onToken(token) {
        responseContent += token;
      },
      async onFinal() {
        // Optimize response
        const { response: optimizedResponse, metrics } =
          await responseOptimizer.optimizeResponse(
            responseContent,
            { chunks, scores: relevanceScores },
            { useCase, targetLength: "balanced" }
          );

        // Track token usage
        const outputTokens = encode(optimizedResponse).length;
        await tokenTracker.trackUsage({
          model: "gpt-4o-mini",
          feature: "chat",
          inputTokens,
          outputTokens,
          estimatedCostUsd: tokenTracker.calculateCost(
            "gpt-4o-mini",
            inputTokens,
            outputTokens
          ),
          metadata: {
            useCase,
            documentIds: documentIds.length > 0 ? documentIds : undefined,
            contextChunks: chunks.length,
            averageScore: metrics.averageChunkScore,
            compressionRatio: metrics.compressionRatio,
          },
        });
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
