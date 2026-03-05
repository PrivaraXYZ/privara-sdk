import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '../../src/core/http-client.js';
import { DEFAULT_RETRY_CONFIG } from '../../src/core/retry.js';
import { PrivaraApiError } from '../../src/errors/api-error.js';
import { PrivaraNotFoundError } from '../../src/errors/not-found-error.js';
import { PrivaraConnectionError } from '../../src/errors/connection-error.js';

function createClient(accessToken = 'test-token') {
  return new HttpClient({
    baseUrl: 'https://api.test.io',
    accessToken,
    timeout: 5000,
    retryConfig: { ...DEFAULT_RETRY_CONFIG, maxRetries: 0 },
  });
}

describe('HttpClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('makes GET request with auth header', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ id: '123' }), { status: 200 }),
    );
    const client = createClient();
    const result = await client.request('GET', '/api/v1/test');
    expect(result).toEqual({ id: '123' });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test.io/api/v1/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
  });

  it('makes POST request with body', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const client = createClient();
    await client.request('POST', '/api/v1/test', { body: { foo: 'bar' } });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test.io/api/v1/test',
      expect.objectContaining({
        method: 'POST',
        body: '{"foo":"bar"}',
      }),
    );
  });

  it('appends query parameters', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    const client = createClient();
    await client.request('GET', '/api/v1/test', { query: { limit: 10, status: 'active', empty: undefined } });
    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=10');
    expect(calledUrl).toContain('status=active');
    expect(calledUrl).not.toContain('empty');
  });

  it('skips auth when auth=false', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    const client = createClient();
    await client.request('GET', '/api/v1/public', { auth: false });
    const headers = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('adds idempotency key header', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    const client = createClient();
    await client.request('POST', '/api/v1/test', {
      requestOptions: { idempotencyKey: 'idem-123' },
    });
    const headers = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(headers['X-Idempotency-Key']).toBe('idem-123');
  });

  it('throws PrivaraNotFoundError for 404', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ title: 'Not Found', status: 404 }), { status: 404 }),
    );
    const client = createClient();
    await expect(client.request('GET', '/api/v1/missing')).rejects.toBeInstanceOf(PrivaraNotFoundError);
  });

  it('returns undefined for 204', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    const client = createClient();
    const result = await client.request('DELETE', '/api/v1/test');
    expect(result).toBeUndefined();
  });

  it('throws PrivaraConnectionError on network failure', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new TypeError('fetch failed'));
    const client = createClient();
    await expect(client.request('GET', '/api/v1/test')).rejects.toBeInstanceOf(PrivaraConnectionError);
  });

  it('calls request interceptor', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );
    const client = createClient();
    const interceptor = vi.fn((req) => ({ ...req, headers: { ...req.headers, 'X-Custom': 'yes' } }));
    client.addRequestInterceptor(interceptor);
    await client.request('GET', '/api/v1/test');
    expect(interceptor).toHaveBeenCalled();
    const headers = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(headers['X-Custom']).toBe('yes');
  });

  it('throws when no auth configured', async () => {
    const client = new HttpClient({
      baseUrl: 'https://api.test.io',
      timeout: 5000,
      retryConfig: { ...DEFAULT_RETRY_CONFIG, maxRetries: 0 },
    });
    await expect(client.request('GET', '/api/v1/test')).rejects.toThrow('No authentication configured');
  });
});
