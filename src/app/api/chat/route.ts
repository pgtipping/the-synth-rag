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
  id: number;
  document_id: number;
  chunk_index: number;
  text: string; // aliased from text_content in the SQL query
  vector_id: string | null;
  metadata?: Record<string, unknown>;
}

interface ChunkData {
  id: string | null; // vector_id can be null
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
        // Get vector IDs and text for the specified documents
        console.log("Querying document_chunks for vector IDs and text...");

        const placeholders = documentIds
          .map((_: number, i: number) => `$${i + 1}`)
          .join(",");
        const vectorResult = await client.query<DocumentChunk>(
          `SELECT 
            id,
            document_id,
            chunk_index,
            vector_id,
            text_content as text,
            metadata::jsonb as metadata
           FROM document_chunks 
           WHERE document_id IN (${placeholders})
           ORDER BY document_id, chunk_index`,
          documentIds
        );

        console.log(`Found ${vectorResult.rows.length} chunks`);

        if (vectorResult.rows.length > 0) {
          // Get the Pinecone index
          console.log("Getting Pinecone index...");
          const index = pinecone.index(process.env.PINECONE_INDEX!);

          // Get vector IDs (filter out nulls)
          const vectorIds = vectorResult.rows
            .map((row) => row.vector_id)
            .filter((id): id is string => id !== null);
          console.log("Vector IDs:", vectorIds);

          try {
            // Only fetch from Pinecone if we have vector IDs
            if (vectorIds.length > 0) {
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

              // Format chunks using both database text and Pinecone data
              chunks = vectorResult.rows.map((row) => {
                const pineconeVector = row.vector_id
                  ? fetchResponse.records?.[row.vector_id]
                  : null;
                const text = row.text || pineconeVector?.metadata?.text;
                return {
                  id: row.vector_id,
                  text:
                    typeof text === "string" ? text : "No content available",
                  metadata: {
                    ...row.metadata,
                    ...pineconeVector?.metadata,
                    chunk_index: row.chunk_index,
                  },
                  relevanceScore: 1.0, // All chunks from selected documents are considered relevant
                };
              });
            } else {
              // If no vector IDs, just use database text
              chunks = vectorResult.rows.map((row) => ({
                id: row.vector_id,
                text: row.text || "No content available",
                metadata: row.metadata || {},
                relevanceScore: 1.0,
              }));
            }

            console.log(`Processed ${chunks.length} chunks`);

            // Create scores array
            relevanceScores = chunks.map(() => 1.0);
          } catch (error) {
            console.error("Error fetching vectors from Pinecone:", error);
            // Continue with database text if Pinecone fails
            chunks = vectorResult.rows.map((row) => ({
              id: row.vector_id,
              text: row.text || "No content available",
              metadata: row.metadata || {},
              relevanceScore: 1.0,
            }));
            relevanceScores = chunks.map(() => 1.0);
          }
        } else {
          console.log("No chunks found for the specified document IDs");
          return NextResponse.json(
            { error: "No content found in the selected documents" },
            { status: 404 }
          );
        }
      } catch (error) {
        console.error("Error retrieving document chunks:", error);
        throw error;
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
        id: `chunk_${index}`,
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

    // Prepare system message with context and instructions
    const contextStr = chunks.map((chunk) => chunk.text).join("\n\n");
    const systemMessage = {
      role: "system",
      content: `You are a helpful AI assistant. Use the following context to answer the user's question. The context contains relevant information from the selected documents:\n\n${contextStr}\n\nIf you find relevant information in the context, use it to provide a detailed and accurate response. If the context doesn't contain information relevant to the user's question, clearly state that you don't have the necessary information in the provided documents. Always maintain a helpful and professional tone.`,
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
      {
        error: "Failed to process your request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
