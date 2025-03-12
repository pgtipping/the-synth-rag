import { NextResponse } from "next/server";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { Configuration, OpenAIApi } from "openai-edge";
import { ContextManager } from "@/src/lib/context/ContextManager";
import { ResponseOptimizer } from "@/src/lib/response/ResponseOptimizer";
import { TokenUsageTracker } from "@/src/lib/analytics/TokenUsageTracker";
import { encode } from "gpt-tokenizer";

// Initialize OpenAI configuration
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

// Initialize managers
const contextManager = new ContextManager();
const responseOptimizer = new ResponseOptimizer();
const tokenTracker = TokenUsageTracker.getInstance();

export async function POST(req: Request) {
  try {
    const { messages, useCase } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // Get optimized context
    const { chunks, scores } = await contextManager.getContext(
      lastMessage.content
    );

    // Prepare system message with context
    const contextStr = chunks.map((chunk) => chunk.content).join("\n\n");
    const systemMessage = {
      role: "system",
      content: `You are a helpful AI assistant. Use the following context to answer the user's question:\n\n${contextStr}\n\nIf the context doesn't contain relevant information, say so. Always cite your sources using [1], [2], etc.`,
    };

    // Calculate input tokens
    const inputTokens =
      encode(systemMessage.content).length +
      messages.reduce(
        (sum: number, msg: any) => sum + encode(msg.content).length,
        0
      );

    // Make API request
    const response = await openai.createChatCompletion({
      model: "gpt-4-turbo-preview",
      messages: [systemMessage, ...messages],
      stream: true,
    });

    // Create stream transformer to optimize response and track tokens
    let responseContent = "";
    const stream = OpenAIStream(response, {
      async onToken(token) {
        responseContent += token;
      },
      async onFinal(completion) {
        // Optimize response
        const { response: optimizedResponse, metrics } =
          await responseOptimizer.optimizeResponse(
            responseContent,
            { chunks, scores },
            { useCase, targetLength: "balanced" }
          );

        // Track token usage
        const outputTokens = encode(optimizedResponse).length;
        await tokenTracker.trackUsage({
          model: "gpt-4-turbo-preview",
          feature: "chat",
          inputTokens,
          outputTokens,
          estimatedCostUsd: tokenTracker.calculateCost(
            "gpt-4-turbo-preview",
            inputTokens,
            outputTokens
          ),
          metadata: {
            useCase,
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
