import { describe, it, expect } from 'vitest';
import { PrivaraApiError } from '../../src/errors/api-error.js';
import { PrivaraAuthenticationError } from '../../src/errors/authentication-error.js';
import { PrivaraValidationError } from '../../src/errors/validation-error.js';
import { PrivaraNotFoundError } from '../../src/errors/not-found-error.js';
import { PrivaraConflictError } from '../../src/errors/conflict-error.js';
import { PrivaraRateLimitError } from '../../src/errors/rate-limit-error.js';

function mockResponse(status: number, body: unknown, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

describe('PrivaraApiError.fromResponse', () => {
  it('creates PrivaraAuthenticationError for 401', async () => {
    const res = mockResponse(401, { type: 'about:blank', title: 'Unauthorized', status: 401 });
    const error = await PrivaraApiError.fromResponse(res);
    expect(error).toBeInstanceOf(PrivaraAuthenticationError);
    expect(error.status).toBe(401);
    expect(error.title).toBe('Unauthorized');
  });

  it('creates PrivaraNotFoundError for 404', async () => {
    const res = mockResponse(404, { title: 'Not Found', status: 404 });
    const error = await PrivaraApiError.fromResponse(res);
    expect(error).toBeInstanceOf(PrivaraNotFoundError);
    expect(error.status).toBe(404);
  });

  it('creates PrivaraConflictError for 409', async () => {
    const res = mockResponse(409, { title: 'Conflict', status: 409, detail: 'Idempotency conflict' });
    const error = await PrivaraApiError.fromResponse(res);
    expect(error).toBeInstanceOf(PrivaraConflictError);
    expect(error.detail).toBe('Idempotency conflict');
  });

  it('creates PrivaraValidationError for 422 with invalid_params', async () => {
    const res = mockResponse(422, {
      title: 'Validation Error',
      status: 422,
      invalid_params: [{ name: 'amount', reason: 'must be positive' }],
    });
    const error = await PrivaraApiError.fromResponse(res);
    expect(error).toBeInstanceOf(PrivaraValidationError);
    expect((error as PrivaraValidationError).invalidParams).toEqual([
      { name: 'amount', reason: 'must be positive' },
    ]);
  });

  it('creates PrivaraRateLimitError for 429 with Retry-After', async () => {
    const res = mockResponse(429, { title: 'Too Many Requests', status: 429 }, { 'Retry-After': '30' });
    const error = await PrivaraApiError.fromResponse(res);
    expect(error).toBeInstanceOf(PrivaraRateLimitError);
    expect((error as PrivaraRateLimitError).retryAfter).toBe(30);
  });

  it('creates generic PrivaraApiError for 500', async () => {
    const res = mockResponse(500, { title: 'Internal Server Error', status: 500 });
    const error = await PrivaraApiError.fromResponse(res);
    expect(error).toBeInstanceOf(PrivaraApiError);
    expect(error).not.toBeInstanceOf(PrivaraAuthenticationError);
    expect(error.status).toBe(500);
  });

  it('handles non-JSON response body', async () => {
    const res = new Response('not json', { status: 502 });
    const error = await PrivaraApiError.fromResponse(res);
    expect(error.status).toBe(502);
    expect(error.title).toBeTruthy();
  });

  it('is instanceof PrivaraError', async () => {
    const { PrivaraError } = await import('../../src/errors/privara-error.js');
    const res = mockResponse(400, { title: 'Bad Request', status: 400 });
    const error = await PrivaraApiError.fromResponse(res);
    expect(error).toBeInstanceOf(PrivaraError);
  });
});
