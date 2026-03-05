import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthManager } from '../../src/core/auth-manager.js';

describe('AuthManager', () => {
  const credentials = { clientId: 'pvr_test', clientSecret: 'pvrs_secret' };
  const baseUrl = 'https://api.test.io';

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockTokenResponse(expiresIn = 3600) {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(
        JSON.stringify({ access_token: 'tok_123', token_type: 'Bearer', expires_in: expiresIn }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
  }

  it('fetches token on first call', async () => {
    mockTokenResponse();
    const manager = new AuthManager(credentials, baseUrl);
    const token = await manager.getAccessToken();
    expect(token).toBe('tok_123');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/v1/auth/oauth/token`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: 'pvr_test',
          client_secret: 'pvrs_secret',
        }),
      }),
    );
  });

  it('returns cached token on subsequent calls', async () => {
    mockTokenResponse();
    const manager = new AuthManager(credentials, baseUrl);
    await manager.getAccessToken();
    await manager.getAccessToken();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent requests', async () => {
    mockTokenResponse();
    const manager = new AuthManager(credentials, baseUrl);
    const [t1, t2, t3] = await Promise.all([
      manager.getAccessToken(),
      manager.getAccessToken(),
      manager.getAccessToken(),
    ]);
    expect(t1).toBe('tok_123');
    expect(t2).toBe('tok_123');
    expect(t3).toBe('tok_123');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('throws on failed token response', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ title: 'Invalid credentials', status: 401 }), { status: 401 }),
    );
    const manager = new AuthManager(credentials, baseUrl);
    await expect(manager.getAccessToken()).rejects.toThrow('OAuth token request failed');
  });
});
