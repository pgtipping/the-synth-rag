import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

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
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response("Too many requests", { status: 429 });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request body", { status: 400 });
    }

    // Get the latest user message
    const userMessage = messages[messages.length - 1].content;

    // Generate embedding for the query
    const queryEmbedding = await embeddings.embedQuery(userMessage);

    // Query Pinecone for relevant context
    const index = pinecone.index(process.env.PINECONE_INDEX!);
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 3,
      includeMetadata: true,
    });

    // Extract relevant context from Pinecone results
    const context = queryResponse.matches
      .map((match) => match.metadata?.text)
      .join("\n\n");

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
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
