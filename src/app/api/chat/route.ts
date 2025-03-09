import { OpenAIStream } from "../../../lib/openai-stream";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { withCors } from "@/src/lib/middleware/cors";
import { NextRequest } from "next/server";

export const runtime = "edge";
export const maxDuration = 30;

// Initialize OpenAI configuration
let openai: OpenAI;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });
} catch (error) {
  console.error("Failed to initialize OpenAI:", error);
  openai = {} as OpenAI; // Fallback empty object to prevent crashes
}

// Initialize rate limiter if Redis URL is configured
let ratelimit: Ratelimit | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "10 s"),
    });
  }
} catch (error) {
  console.warn("Failed to initialize rate limiter:", error);
}

// Initialize Pinecone client
let pinecone: Pinecone;
try {
  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || "",
  });
} catch (error) {
  console.error("Failed to initialize Pinecone:", error);
  pinecone = {} as Pinecone; // Fallback empty object to prevent crashes
}

// Initialize embeddings model
let embeddings: OpenAIEmbeddings;
try {
  embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY || "",
    modelName: "text-embedding-3-small",
  });
} catch (error) {
  console.error("Failed to initialize OpenAI embeddings:", error);
  embeddings = {} as OpenAIEmbeddings; // Fallback empty object to prevent crashes
}

// Handler function with CORS middleware
export async function POST(req: NextRequest) {
  return withCors(req, handleChatRequest);
}

// Main handler function
async function handleChatRequest(req: NextRequest) {
  try {
    // Rate limiting check
    if (ratelimit) {
      const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return new Response("Too many requests", { status: 429 });
      }
    }

    // Parse request
    const { messages } = await req.json();
    if (!messages?.length) {
      return new Response("Messages array is required", { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content) {
      return new Response("Invalid message format", { status: 400 });
    }

    // Environment checks
    if (!process.env.OPENAI_API_KEY) {
      return new Response("OpenAI API key not configured", { status: 500 });
    }

    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
      return new Response("Pinecone configuration missing", { status: 500 });
    }

    try {
      // Generate embedding for the query
      try {
        const queryEmbedding = await embeddings.embedQuery(lastMessage.content);
        console.log("Generated query embedding");

        // Query Pinecone for relevant context
        const index = pinecone.index(process.env.PINECONE_INDEX);
        console.log("Querying Pinecone with:", {
          query: lastMessage.content,
          indexName: process.env.PINECONE_INDEX,
        });

        try {
          const queryResponse = await index.query({
            vector: queryEmbedding,
            topK: 5,
            includeMetadata: true,
          });
          console.log("Pinecone query response:", {
            matchCount: queryResponse.matches.length,
            matches: queryResponse.matches.map((m) => ({
              score: m.score,
              metadata: m.metadata,
            })),
          });

          // Extract and process context from matches
          const contexts = queryResponse.matches
            .filter(
              (match) =>
                match.metadata && typeof match.metadata.text === "string"
            )
            .map((match) => ({
              text: match.metadata!.text as string,
              score: match.score || 0,
              source: (match.metadata!.originalName as string) || "unknown",
            }))
            .filter((context) => context.score > 0.3); // Lowered threshold for text-embedding-3-small model

          console.log("Processed contexts:", {
            beforeFiltering: queryResponse.matches.length,
            afterMetadataFilter: queryResponse.matches.filter(
              (m) => m.metadata && typeof m.metadata.text === "string"
            ).length,
            afterScoreFilter: contexts.length,
            scores: contexts.map((c) => c.score),
          });

          if (!contexts.length) {
            // Create an error message stream
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
              start(controller) {
                const message =
                  "I apologize, but I couldn't find any relevant information in the uploaded documents to answer your question. This could be because:\n\n1. The document might still be processing\n2. The relevant information might not be in the uploaded documents\n3. The question might need to be rephrased\n\nPlease try:\n- Waiting a moment if you just uploaded the document\n- Rephrasing your question\n- Checking if the correct documents are uploaded";

                // Send the message in the SSE format
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      content: message,
                      role: "assistant",
                    })}\n\n`
                  )
                );
                controller.close();
              },
            });

            return new Response(stream, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
              },
            });
          }

          // Prepare context for the prompt
          const contextText = contexts
            .map((ctx) => `[Source: ${ctx.source}]\n${ctx.text}`)
            .join("\n\n");

          // System message with context and instructions
          const systemMessage = {
            role: "system",
            content: `You are a helpful AI assistant. Use the following context to answer the user's questions. If you cannot find the answer in the context, say so - do not make up information.

Context:
${contextText}

Instructions:
1. Only use information from the provided context
2. If you're unsure, ask for clarification
3. Cite sources when possible using [Source: filename]`,
          };

          // Create the chat completion with streaming
          try {
            if (!openai.chat?.completions?.create) {
              throw new Error("OpenAI API not properly initialized");
            }

            const stream = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [systemMessage, ...messages],
              stream: true,
              temperature: 0.7,
              max_tokens: 2000,
            });

            // Return the streaming response
            return new Response(OpenAIStream(stream), {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
              },
            });
          } catch (error) {
            console.error("OpenAI API error:", error);
            return new Response(
              `OpenAI API error: ${
                error instanceof Error ? error.message : String(error)
              }`,
              {
                status: 500,
              }
            );
          }
        } catch (error) {
          console.error("Vector database error:", error);
          return new Response(
            `Vector database error: ${
              error instanceof Error ? error.message : String(error)
            }`,
            {
              status: 500,
            }
          );
        }
      } catch (error) {
        console.error("Embedding generation error:", error);
        return new Response(
          `Embedding generation error: ${
            error instanceof Error ? error.message : String(error)
          }`,
          {
            status: 500,
          }
        );
      }
    } catch (error) {
      console.error("AI processing error:", error);
      return new Response(
        `Failed to process your request: ${
          error instanceof Error ? error.message : String(error)
        }`,
        {
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error("Request processing error:", error);
    return new Response("Invalid request format", { status: 400 });
  }
}
