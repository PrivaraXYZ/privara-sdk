import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Privara } from '../../src/client.js';

describe('Credentials resource', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const privara = new Privara({ accessToken: 'test-token', baseUrl: 'https://api.test.io' });

  it('generates credentials', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({
        client_id: 'pvr_abc',
        client_secret: 'pvrs_xyz',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z',
      }), { status: 200 }),
    );
    const result = await privara.credentials.generate();
    expect(result.client_id).toBe('pvr_abc');
    expect(result.client_secret).toBe('pvrs_xyz');
  });

  it('lists credentials', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({
        items: [{ client_id: 'pvr_abc', status: 'active', created_at: '2025-01-01T00:00:00Z', last_used_at: null }],
      }), { status: 200 }),
    );
    const result = await privara.credentials.list();
    expect(result.items).toHaveLength(1);
  });

  it('revokes credential', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    await privara.credentials.revoke('pvr_abc');
    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/v1/credentials/pvr_abc');
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].method).toBe('DELETE');
  });
});
