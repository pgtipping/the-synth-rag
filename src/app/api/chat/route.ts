import { OpenAIStream } from "../../../lib/openai-stream";
import OpenAI from "openai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { withCors } from "@/src/lib/middleware/cors";
import { NextRequest } from "next/server";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { chatCache, generateChatCacheKey } from "@/src/lib/cache";
import { hybridSearch } from "@/src/lib/hybrid-search";

export const runtime = "edge";
export const maxDuration = 30;

// Initialize OpenAI configuration
let openai: OpenAI;
try {
  openai = new OpenAI({
    apiKey: getEnvironmentVariable("OPENAI_API_KEY") as string,
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
    const { messages, useCase } = await req.json();
    if (!messages?.length) {
      return new Response("Messages array is required", { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content) {
      return new Response("Invalid message format", { status: 400 });
    }

    // Check cache for exact chat response
    const chatCacheKey = generateChatCacheKey(messages);
    const cachedResponse = await chatCache.get<string>(chatCacheKey);
    if (cachedResponse) {
      // Return cached response as a stream
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(cachedResponse));
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

    // Environment checks
    if (!process.env.OPENAI_API_KEY) {
      return new Response("OpenAI API key not configured", { status: 500 });
    }

    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
      return new Response("Pinecone configuration missing", { status: 500 });
    }

    try {
      // Perform hybrid search
      console.log("Performing hybrid search for:", {
        query: lastMessage.content,
        useCase: useCase || "general",
      });

      const searchResults = await hybridSearch({
        query: lastMessage.content,
        useCase: useCase || undefined,
        topK: 5,
        minScore: 0.3,
        vectorWeight: 0.7,
        keywordWeight: 0.3,
      });

      console.log("Hybrid search results:", {
        resultCount: searchResults.length,
        scores: searchResults.map((r) => r.score),
      });

      if (!searchResults.length) {
        const noContextMessage =
          "I apologize, but I couldn't find any relevant information in the uploaded documents to answer your question. This could be because:\n\n1. The document might still be processing\n2. The relevant information might not be in the uploaded documents\n3. The question might need to be rephrased\n\nPlease try:\n- Waiting a moment if you just uploaded the document\n- Rephrasing your question\n- Checking if the correct documents are uploaded";

        // Cache the no-context response
        await chatCache.set(chatCacheKey, noContextMessage);

        // Create an error message stream
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  content: noContextMessage,
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
      const contextText = searchResults
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
          model: "gpt-4o",
          messages: [systemMessage, ...messages],
          stream: true,
          temperature: 0.7,
          max_tokens: 2000,
        });

        // Create a modified stream that caches the response
        let fullResponse = "";
        const modifiedStream = new TransformStream({
          transform(chunk, controller) {
            const text = new TextDecoder().decode(chunk);
            fullResponse += text;
            controller.enqueue(chunk);
          },
          flush(controller) {
            // Cache the complete response when the stream ends
            chatCache.set(chatCacheKey, fullResponse).catch(console.error);
            controller.terminate();
          },
        });

        // Return the streaming response through the modified stream
        const responseStream = OpenAIStream(stream);
        return new Response(responseStream.pipeThrough(modifiedStream), {
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
      console.error("Search error:", error);
      return new Response(
        `Search error: ${
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
