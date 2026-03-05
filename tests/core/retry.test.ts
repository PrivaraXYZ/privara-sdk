import { describe, it, expect, vi } from 'vitest';
import { withRetry, isRetryable, getRetryDelay, DEFAULT_RETRY_CONFIG } from '../../src/core/retry.js';
import { PrivaraApiError } from '../../src/errors/api-error.js';
import { PrivaraConnectionError } from '../../src/errors/connection-error.js';

describe('isRetryable', () => {
  it('returns true for 429', () => {
    const error = new PrivaraApiError(429, { title: 'Too Many', status: 429 }, new Headers());
    expect(isRetryable(error)).toBe(true);
  });

  it('returns true for 500, 502, 503, 504', () => {
    for (const status of [500, 502, 503, 504]) {
      const error = new PrivaraApiError(status, { title: 'Error', status }, new Headers());
      expect(isRetryable(error)).toBe(true);
    }
  });

  it('returns false for 400, 401, 404, 422', () => {
    for (const status of [400, 401, 404, 422]) {
      const error = new PrivaraApiError(status, { title: 'Error', status }, new Headers());
      expect(isRetryable(error)).toBe(false);
    }
  });

  it('returns true for PrivaraConnectionError', () => {
    expect(isRetryable(new PrivaraConnectionError('timeout'))).toBe(true);
  });

  it('returns false for generic errors', () => {
    expect(isRetryable(new Error('oops'))).toBe(false);
  });
});

describe('getRetryDelay', () => {
  it('respects Retry-After header for 429', () => {
    const headers = new Headers({ 'Retry-After': '5' });
    const error = new PrivaraApiError(429, { title: 'Rate limited', status: 429 }, headers);
    const delay = getRetryDelay(0, DEFAULT_RETRY_CONFIG, error);
    expect(delay).toBe(5000);
  });

  it('uses exponential backoff for non-429', () => {
    const delay0 = getRetryDelay(0, { ...DEFAULT_RETRY_CONFIG, jitterFraction: 0 });
    const delay1 = getRetryDelay(1, { ...DEFAULT_RETRY_CONFIG, jitterFraction: 0 });
    expect(delay0).toBe(500);
    expect(delay1).toBe(1000);
  });

  it('caps at maxDelayMs', () => {
    const delay = getRetryDelay(10, { ...DEFAULT_RETRY_CONFIG, jitterFraction: 0 });
    expect(delay).toBe(DEFAULT_RETRY_CONFIG.maxDelayMs);
  });
});

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { ...DEFAULT_RETRY_CONFIG, maxRetries: 3 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable error and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new PrivaraConnectionError('fail'))
      .mockResolvedValue('ok');
    const result = await withRetry(fn, { ...DEFAULT_RETRY_CONFIG, maxRetries: 3, initialDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws immediately on non-retryable error', async () => {
    const error = new PrivaraApiError(400, { title: 'Bad Request', status: 400 }, new Headers());
    const fn = vi.fn().mockRejectedValue(error);
    await expect(withRetry(fn, DEFAULT_RETRY_CONFIG)).rejects.toThrow(error);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throws after max retries exhausted', async () => {
    const error = new PrivaraConnectionError('fail');
    const fn = vi.fn().mockRejectedValue(error);
    await expect(withRetry(fn, { ...DEFAULT_RETRY_CONFIG, maxRetries: 2, initialDelayMs: 1 })).rejects.toThrow(error);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
