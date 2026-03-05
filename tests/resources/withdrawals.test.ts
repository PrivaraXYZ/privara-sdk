import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Privara } from '../../src/client.js';
import { toArray } from '../../src/core/pagination.js';
import type { Withdrawal } from '../../src/types/withdrawals.js';

const mockWithdrawal: Withdrawal = {
  public_id: 'wd_1',
  invoice_ids: [1, 2],
  destination_chain: 'BASE',
  destination_domain: 6,
  recipient_address: '0x1234567890abcdef1234567890abcdef12345678',
  status: 'PENDING_REDEEM',
  estimated_amount: 200,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('Withdrawals resource', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const privara = new Privara({ accessToken: 'test-token', baseUrl: 'https://api.test.io' });

  it('creates a withdrawal with idempotency key', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({
        public_id: 'wd_1', challenge_id: 'ch_1', status: 'PENDING_REDEEM', estimated_amount: 200,
      }), { status: 200 }),
    );
    const result = await privara.withdrawals.create({
      invoice_ids: [1, 2],
      destination_chain: 'BASE',
      recipient_address: '0x1234567890abcdef1234567890abcdef12345678',
      wallet_id: 'w_1',
    });
    expect(result.public_id).toBe('wd_1');
    const headers = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(headers['X-Idempotency-Key']).toBeTruthy();
  });

  it('gets a withdrawal', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify(mockWithdrawal), { status: 200 }),
    );
    const result = await privara.withdrawals.get('wd_1');
    expect(result.public_id).toBe('wd_1');
  });

  it('auto-paginates with cursor', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          items: [mockWithdrawal],
          continuation_token: 'cursor_1',
          has_more: true,
          limit: 1,
        }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          items: [{ ...mockWithdrawal, public_id: 'wd_2' }],
          continuation_token: null,
          has_more: false,
          limit: 1,
        }), { status: 200 }),
      );

    const all = await toArray(privara.withdrawals.listAutoPaginate({ limit: 1 }));
    expect(all).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondUrl = fetchMock.mock.calls[1][0] as string;
    expect(secondUrl).toContain('continuation_token=cursor_1');
  });

  it('creates bridge challenge', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({
        public_id: 'wd_1', challenge_id: 'ch_2', status: 'PENDING_BRIDGE', actual_amount: 199,
      }), { status: 200 }),
    );
    const result = await privara.withdrawals.createBridgeChallenge('wd_1');
    expect(result.status).toBe('PENDING_BRIDGE');
    expect(result.actual_amount).toBe(199);
  });
});
