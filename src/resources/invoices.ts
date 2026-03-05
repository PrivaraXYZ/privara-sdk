import type { HttpClient } from '../core/http-client.js';
import type { RequestOptions } from '../types/common.js';
import type { OffsetPage } from '../types/pagination.js';
import type {
  CreateInvoiceParams,
  CreateInvoiceResponse,
  Invoice,
  ListInvoicesParams,
} from '../types/invoices.js';
import { generateIdempotencyKey } from '../core/idempotency.js';

export class Invoices {
  constructor(private client: HttpClient) {}

  async create(
    params: CreateInvoiceParams,
    options?: RequestOptions,
  ): Promise<CreateInvoiceResponse> {
    return this.client.request('POST', '/api/v1/invoices', {
      body: params,
      requestOptions: {
        ...options,
        idempotencyKey: options?.idempotencyKey ?? generateIdempotencyKey(),
      },
    });
  }

  async get(publicId: string, options?: RequestOptions): Promise<Invoice> {
    return this.client.request('GET', `/api/v1/invoices/${publicId}`, {
      auth: false,
      requestOptions: options,
    });
  }

  async list(
    params?: ListInvoicesParams,
    options?: RequestOptions,
  ): Promise<OffsetPage<Invoice>> {
    return this.client.request('GET', '/api/v1/invoices', {
      query: {
        limit: params?.limit,
        offset: params?.offset,
        status: params?.status,
        sort_order: params?.sort_order,
      },
      requestOptions: options,
    });
  }

  async *listAutoPaginate(
    params?: Omit<ListInvoicesParams, 'offset'>,
    options?: RequestOptions,
  ): AsyncIterable<Invoice> {
    let offset = 0;
    const limit = params?.limit ?? 10;

    while (true) {
      const page = await this.list({ ...params, limit, offset }, options);
      for (const item of page.items) {
        yield item;
      }
      offset += page.items.length;
      if (offset >= page.pagination.total) break;
    }
  }
}
