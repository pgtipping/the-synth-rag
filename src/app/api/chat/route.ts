import { OpenAIStream } from "../../../lib/openai-stream";
import { NextRequest } from "next/server";
import { withCors } from "@/src/lib/middleware/cors";

export const runtime = "edge";
export const maxDuration = 30;

// Handler function with CORS middleware
export async function POST(req: NextRequest) {
  return withCors(req, handleChatRequest);
}

// Main handler function
async function handleChatRequest(req: NextRequest) {
  try {
    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response("OpenAI API key not configured", { status: 500 });
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

    // For now, we'll use a simple response without RAG
    // In a real app, you would fetch relevant context from Pinecone here
    const systemMessage = {
      role: "system",
      content: `You are a helpful AI assistant. Answer the user's questions to the best of your ability.`,
    };

    try {
      // Direct fetch to OpenAI API
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [systemMessage, ...messages],
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      // Return the streaming response
      return new Response(OpenAIStream(response), {
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
    console.error("Request processing error:", error);
    return new Response("Invalid request format", { status: 400 });
  }
}
