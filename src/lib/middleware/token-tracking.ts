import { NextRequest, NextResponse } from "next/server";
import {
  countMessageTokens,
  calculateCost,
  trackTokenUsage,
  checkUserQuota,
  updateUserUsage,
} from "../token-counter";

/**
 * Middleware to track token usage for OpenAI API calls
 */
export async function withTokenTracking(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  try {
    // Parse request body
    const body = await req.clone().json();
    const { messages, model = "gpt-4o-mini", userId, sessionId } = body;

    // Skip tracking if no messages
    if (!messages?.length) {
      return handler(req);
    }

    // Check user quota if userId is provided
    if (userId) {
      const hasQuota = await checkUserQuota(userId);
      if (!hasQuota) {
        return new NextResponse(
          JSON.stringify({
            error:
              "Token quota exceeded. Please try again later or contact support.",
            code: "token_quota_exceeded",
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Count input tokens
    const inputTokens = countMessageTokens(messages);

    // Process the request
    const response = await handler(req);

    // If response is not successful, don't track tokens
    if (!response.ok) {
      return response;
    }

    // Clone the response to read the body
    const clonedResponse = response.clone();

    // Try to parse the response as JSON
    let outputTokens = 0;
    try {
      const responseBody = await clonedResponse.json();

      // If response has content, count output tokens
      if (responseBody.content) {
        outputTokens = responseBody.content.length / 4; // Rough estimate
      }
    } catch (error) {
      // If response is not JSON (e.g., streaming), estimate output tokens
      // This is a rough estimate and should be replaced with actual token counting
      outputTokens = 500; // Default estimate for streaming responses
    }

    // Calculate cost
    const estimatedCostUsd = calculateCost(model, inputTokens, outputTokens);

    // Track token usage
    await trackTokenUsage({
      userId,
      sessionId,
      requestId: crypto.randomUUID(),
      model,
      feature: "chat",
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCostUsd,
      metadata: {
        messageCount: messages.length,
        lastMessageLength: messages[messages.length - 1].content.length,
      },
    });

    // Update user usage if userId is provided
    if (userId) {
      await updateUserUsage(userId, inputTokens + outputTokens);
    }

    return response;
  } catch (error) {
    console.error("Error in token tracking middleware:", error);
    // Continue with the request even if token tracking fails
    return handler(req);
  }
}
