import { NextResponse } from "next/server";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { Configuration, OpenAIApi } from "openai-edge";
import { ContextManager } from "../../../lib/context-manager";
import { ResponseOptimizer } from "../../../lib/response/ResponseOptimizer";
import { TokenUsageTracker } from "../../../lib/analytics/TokenUsageTracker";
import { encode } from "gpt-tokenizer";
import pool from "../../../lib/db";
import { Pinecone } from "@pinecone-database/pinecone";

// Initialize OpenAI configuration
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

// Initialize managers
const contextManager = new ContextManager();
const responseOptimizer = new ResponseOptimizer();
const tokenTracker = TokenUsageTracker.getInstance();

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY as string,
});

interface DocumentChunk {
  vector_id: string;
  text?: string;
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

    // Add debug logging
    console.log("Chat request received:", { useCase, documentIds });

    const lastMessage = messages[messages.length - 1];

    // Get context based on document IDs or query
    let chunks: ChunkData[] = [];
    let relevanceScores: number[] = [];

    if (documentIds && documentIds.length > 0) {
      // Add debug logging
      console.log("Processing document IDs:", documentIds);

      // Get context from specific documents
      const client = await pool.connect();
      try {
        // Get vector IDs for the specified documents
        console.log("Querying document_chunks for vector IDs...");

        const placeholders = documentIds
          .map((_: number, i: number) => `$${i + 1}`)
          .join(",");
        const vectorResult = await client.query<DocumentChunk>(
          `SELECT vector_id 
           FROM document_chunks 
           WHERE document_id IN (${placeholders})
           ORDER BY document_id, chunk_index`,
          documentIds
        );

        console.log(`Found ${vectorResult.rows.length} vector IDs`);

        if (vectorResult.rows.length > 0) {
          // Get the Pinecone index
          console.log("Getting Pinecone index...");
          const index = pinecone.index(process.env.PINECONE_INDEX!);

          // Get vector IDs
          const vectorIds = vectorResult.rows.map((row) => row.vector_id);
          console.log("Vector IDs:", vectorIds);

          try {
            // Fetch vectors from Pinecone
            console.log("Fetching vectors from Pinecone...");
            const fetchResponse = await index.fetch(vectorIds);
            console.log(
              "Pinecone fetch response:",
              Object.keys(fetchResponse.records || {})
            );

            // Check if we got all the vectors we requested
            const missingVectors = vectorIds.filter(
              (id) => !fetchResponse.records || !fetchResponse.records[id]
            );

            if (missingVectors.length > 0) {
              console.warn(
                `Missing ${missingVectors.length} vectors from Pinecone:`,
                missingVectors
              );
            }

            // Format chunks from Pinecone
            chunks = Object.entries(fetchResponse.records || {}).map(
              ([id, vector]) => ({
                id,
                text:
                  (vector.metadata?.text as string) || "No content available",
                metadata: vector.metadata || {},
                relevanceScore: 1.0, // All chunks from selected documents are considered relevant
              })
            );

            console.log(`Processed ${chunks.length} chunks from Pinecone`);

            // Create scores array
            relevanceScores = chunks.map(() => 1.0);
          } catch (error) {
            console.error("Error fetching vectors from Pinecone:", error);
            throw new Error(
              `Failed to retrieve document content: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }
        } else {
          console.log("No vector IDs found for the specified document IDs");
        }
      } catch (error) {
        console.error("Error retrieving document chunks:", error);
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

    // Log context information
    console.log(`Using ${chunks.length} chunks for context`);
    if (chunks.length > 0) {
      console.log(
        "First chunk sample:",
        chunks[0].text.substring(0, 100) + "..."
      );
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
      { error: "An error occurred during the chat request" },
      { status: 500 }
    );
  }
}
