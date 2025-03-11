import { encode } from "gpt-tokenizer";
import { v4 as uuidv4 } from "uuid";
import db from "./db";

// Model pricing in USD per 1M tokens
interface ModelPricing {
  input: number;
  output: number;
}

// Token usage data structure
export interface TokenUsage {
  userId?: string;
  sessionId?: string;
  requestId: string;
  model: string;
  feature: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  metadata?: Record<string, unknown>;
}

// User quota data structure
interface UserQuota {
  daily_token_limit: number | null;
  monthly_token_limit: number | null;
  current_daily_usage: number;
  current_monthly_usage: number;
  last_daily_reset: Date;
  last_monthly_reset: Date;
}

// Map of model names to their pricing
const MODEL_PRICING: Record<string, ModelPricing> = {
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4": { input: 3.0, output: 6.0 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "text-embedding-3-small": { input: 0.02, output: 0.0 },
  "text-embedding-3-large": { input: 0.13, output: 0.0 },
};

// Default to gpt-3.5-turbo pricing if model not found
const DEFAULT_PRICING: ModelPricing = { input: 0.5, output: 1.5 };

/**
 * Count tokens in a string using the GPT tokenizer
 */
export function countTokens(text: string): number {
  return encode(text).length;
}

/**
 * Count tokens in a chat message array
 */
export function countMessageTokens(
  messages: Array<{ role: string; content: string }>
): number {
  // Base tokens for the message format
  let tokens = 3; // Every reply is primed with <|start|>assistant<|message|>

  for (const message of messages) {
    // Add tokens for each message
    tokens += 4; // Every message follows <|im_start|>{role/name}\n{content}<|im_end|>\n
    tokens += countTokens(message.role);
    tokens += countTokens(message.content);
  }

  return tokens;
}

/**
 * Calculate the estimated cost for token usage
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model] || DEFAULT_PRICING;

  // Convert from per million tokens to per token
  const inputCost = (pricing.input / 1_000_000) * inputTokens;
  const outputCost = (pricing.output / 1_000_000) * outputTokens;

  return inputCost + outputCost;
}

/**
 * Track token usage in the database
 */
export async function trackTokenUsage({
  userId,
  sessionId,
  requestId = uuidv4(),
  model,
  feature,
  inputTokens,
  outputTokens,
  totalTokens = inputTokens + outputTokens,
  estimatedCostUsd,
  metadata = {},
}: TokenUsage): Promise<void> {
  try {
    await db.query(
      `INSERT INTO token_usage (
        user_id, 
        session_id, 
        request_id, 
        model, 
        feature, 
        input_tokens, 
        output_tokens, 
        total_tokens, 
        estimated_cost_usd, 
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        sessionId,
        requestId,
        model,
        feature,
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCostUsd,
        metadata,
      ]
    );

    console.log(
      `Tracked token usage: ${totalTokens} tokens for ${feature} using ${model}`
    );
  } catch (error) {
    console.error("Error tracking token usage:", error);
    // Don't throw - we don't want to break the application flow if tracking fails
  }
}

/**
 * Check if a user has exceeded their token quota
 */
export async function checkUserQuota(userId: string): Promise<boolean> {
  if (!userId) return true; // No user ID, no quota check

  try {
    // Get user quota
    const quotaResult = await db.query<UserQuota>(
      `SELECT 
        daily_token_limit, 
        monthly_token_limit, 
        current_daily_usage, 
        current_monthly_usage,
        last_daily_reset,
        last_monthly_reset
      FROM user_token_quota 
      WHERE user_id = $1`,
      [userId]
    );

    // If no quota set, allow usage
    if (quotaResult.rows.length === 0) return true;

    const quota = quotaResult.rows[0];
    const now = new Date();

    // Reset daily usage if needed
    const lastDailyReset = new Date(quota.last_daily_reset);
    if (
      lastDailyReset.getDate() !== now.getDate() ||
      lastDailyReset.getMonth() !== now.getMonth() ||
      lastDailyReset.getFullYear() !== now.getFullYear()
    ) {
      await db.query(
        `UPDATE user_token_quota 
        SET current_daily_usage = 0, last_daily_reset = CURRENT_TIMESTAMP 
        WHERE user_id = $1`,
        [userId]
      );
      quota.current_daily_usage = 0;
    }

    // Reset monthly usage if needed
    const lastMonthlyReset = new Date(quota.last_monthly_reset);
    if (
      lastMonthlyReset.getMonth() !== now.getMonth() ||
      lastMonthlyReset.getFullYear() !== now.getFullYear()
    ) {
      await db.query(
        `UPDATE user_token_quota 
        SET current_monthly_usage = 0, last_monthly_reset = CURRENT_TIMESTAMP 
        WHERE user_id = $1`,
        [userId]
      );
      quota.current_monthly_usage = 0;
    }

    // Check if user has exceeded daily limit
    if (
      quota.daily_token_limit &&
      quota.current_daily_usage >= quota.daily_token_limit
    ) {
      return false;
    }

    // Check if user has exceeded monthly limit
    if (
      quota.monthly_token_limit &&
      quota.current_monthly_usage >= quota.monthly_token_limit
    ) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking user quota:", error);
    return true; // Allow usage on error
  }
}

/**
 * Update user token usage
 */
export async function updateUserUsage(
  userId: string,
  tokens: number
): Promise<void> {
  if (!userId) return; // No user ID, no update

  try {
    // Check if user has a quota record
    const userExists = await db.query(
      `SELECT id FROM user_token_quota WHERE user_id = $1`,
      [userId]
    );

    if (userExists.rows.length === 0) {
      // Create new user quota record
      await db.query(
        `INSERT INTO user_token_quota (
          user_id, 
          current_daily_usage, 
          current_monthly_usage
        ) VALUES ($1, $2, $3)`,
        [userId, tokens, tokens]
      );
    } else {
      // Update existing user quota record
      await db.query(
        `UPDATE user_token_quota 
        SET 
          current_daily_usage = current_daily_usage + $2, 
          current_monthly_usage = current_monthly_usage + $2 
        WHERE user_id = $1`,
        [userId, tokens]
      );
    }
  } catch (error) {
    console.error("Error updating user usage:", error);
  }
}
