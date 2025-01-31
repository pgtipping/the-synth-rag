import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

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
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Initialize embeddings model
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "text-embedding-3-small",
});

export async function POST(req: Request) {
  try {
    // Only check rate limit if configured
    if (ratelimit) {
      const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
      const { success } = await ratelimit.limit(ip);

      if (!success) {
        return new Response("Too many requests", { status: 429 });
      }
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request body: messages must be an array", {
        status: 400,
      });
    }

    if (messages.length === 0) {
      return new Response("Invalid request body: messages array is empty", {
        status: 400,
      });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || typeof lastMessage.content !== "string") {
      return new Response(
        "Invalid request body: last message must have content",
        {
          status: 400,
        }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return new Response("OpenAI API key not configured", { status: 500 });
    }

    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
      return new Response("Pinecone configuration missing", { status: 500 });
    }

    // Get the latest user message
    const userMessage = lastMessage.content;

    try {
      // Generate embedding for the query
      const queryEmbedding = await embeddings.embedQuery(userMessage);

      // Query Pinecone for relevant context
      const index = pinecone.index(process.env.PINECONE_INDEX);
      const queryResponse = await index.query({
        vector: queryEmbedding,
        topK: 3,
        includeMetadata: true,
      });

      // Extract relevant context from Pinecone results
      const context = queryResponse.matches
        .map((match) => match.metadata?.text)
        .join("\n\n");

      if (!context) {
        return new Response(
          "No relevant context found for the query. Please ensure documents are properly uploaded and indexed.",
          { status: 400 }
        );
      }

      // Add context to the messages
      const systemMessage = {
        role: "system",
        content: `Context:\n${context}\n\nAnswer the question based on the above context.`,
      };

      const result = streamText({
        model: openai("gpt-4"),
        messages: [systemMessage, ...messages],
      });

      return result.toDataStreamResponse();
    } catch (error) {
      console.error("AI processing error:", error);
      let errorMessage = "AI processing failed";
      const statusCode = 500;

      if (error instanceof Error) {
        if (error.message.includes("OpenAI")) {
          errorMessage = "OpenAI API error: " + error.message;
        } else if (error.message.includes("Pinecone")) {
          errorMessage = "Vector database error: " + error.message;
        } else if (error.message.includes("embedQuery")) {
          errorMessage = "Embedding generation error: " + error.message;
        }
      }

      return new Response(errorMessage, { status: statusCode });
    }
  } catch (error) {
    console.error("Chat API error:", error);
    let errorMessage = "Internal server error";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("JSON")) {
        errorMessage = "Invalid request format: " + error.message;
        statusCode = 400;
      } else if (error.message.includes("Redis")) {
        errorMessage = "Rate limiting error: " + error.message;
        statusCode = 429;
      }
    }

    return new Response(errorMessage, { status: statusCode });
  }
}
