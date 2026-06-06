import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Privara } from '../../src/client.js';
import type { Invoice } from '../../src/types/invoices.js';
import { toArray } from '../../src/core/pagination.js';

const mockInvoice: Invoice = {
  public_id: 'inv_1',
  from: 'test@test.com',
  due_date: '2025-12-31',
  reference: 'Test Invoice',
  amount: 100,
  status: 'pending',
  currency: { type: 'crypto', code: 'USDC' },
};

describe('Invoices resource', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockFetch(body: unknown, status = 200) {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify(body), { status }),
    );
  }

  const privara = new Privara({ accessToken: 'test-token', baseUrl: 'https://api.test.io' });

  it('creates an invoice with auto-generated idempotency key', async () => {
    mockFetch({ public_id: 'inv_1', challenge_id: 'ch_1' });
    const result = await privara.invoices.create({
      from: 'test@test.com',
      due_date: '2025-12-31',
      reference: 'Test',
      amount: 100,
      currency: { type: 'crypto', code: 'USDC' },
      wallet_id: 'w_1',
    });
    expect(result.public_id).toBe('inv_1');
    const headers = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(headers['X-Idempotency-Key']).toBeTruthy();
  });

  // DEV-202: the SDK is a thin REST client with no crypto. Moving encryption
  // into the backend Lambda (server-side endpoint A) must keep the create()
  // path + request contract identical so SDK consumers need zero changes.
  it('create() targets endpoint A (POST /api/v1/invoices) with the contract unchanged', async () => {
    mockFetch({ public_id: 'inv_1', challenge_id: 'ch_1' });

    const params = {
      from: 'test@test.com',
      due_date: '2025-12-31',
      reference: 'Test',
      amount: 100,
      currency: { type: 'crypto', code: 'USDC' },
      wallet_id: 'w_1',
    } as const;

    await privara.invoices.create(params);

    const [url, init] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://api.test.io/api/v1/invoices');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual(params);
  });

  it('gets an invoice without auth', async () => {
    mockFetch(mockInvoice);
    await privara.invoices.get('inv_1');
    const headers = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].headers;
    expect(headers['Authorization']).toBeUndefined();
  });

  it('lists invoices with query params', async () => {
    mockFetch({ items: [mockInvoice], pagination: { limit: 10, offset: 0, total: 1 } });
    const result = await privara.invoices.list({ limit: 10, status: 'pending' });
    expect(result.items).toHaveLength(1);
    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('status=pending');
  });

  it('auto-paginates across multiple pages', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          items: [{ ...mockInvoice, public_id: 'inv_1' }, { ...mockInvoice, public_id: 'inv_2' }],
          pagination: { limit: 2, offset: 0, total: 3 },
        }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          items: [{ ...mockInvoice, public_id: 'inv_3' }],
          pagination: { limit: 2, offset: 2, total: 3 },
        }), { status: 200 }),
      );

    const all = await toArray(privara.invoices.listAutoPaginate({ limit: 2 }));
    expect(all).toHaveLength(3);
    expect(all.map((i) => i.public_id)).toEqual(['inv_1', 'inv_2', 'inv_3']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
