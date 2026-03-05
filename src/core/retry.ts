import { PrivaraApiError } from '../errors/api-error.js';
import { PrivaraConnectionError } from '../errors/connection-error.js';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFraction: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 8000,
  backoffMultiplier: 2,
  jitterFraction: 0.25,
};

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

export function isRetryable(error: unknown): boolean {
  if (error instanceof PrivaraApiError) {
    return RETRYABLE_STATUS_CODES.has(error.status);
  }
  return error instanceof PrivaraConnectionError;
}

export function getRetryDelay(attempt: number, config: RetryConfig, error?: unknown): number {
  if (error instanceof PrivaraApiError && error.status === 429) {
    const retryAfter = error.headers.get('retry-after');
    if (retryAfter) {
      return Number(retryAfter) * 1000;
    }
  }

  const base = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const capped = Math.min(base, config.maxDelayMs);
  const jitter = capped * config.jitterFraction * (Math.random() * 2 - 1);
  return Math.max(0, capped + jitter);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= config.maxRetries || !isRetryable(error)) {
        throw error;
      }
      const delay = getRetryDelay(attempt, config, error);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
