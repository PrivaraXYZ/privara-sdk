import type { HttpClient } from '../core/http-client.js';
import type { RequestOptions } from '../types/common.js';
import type { CursorPage } from '../types/pagination.js';
import type {
  CreateWithdrawalParams,
  CreateWithdrawalResponse,
  Withdrawal,
  ListWithdrawalsParams,
  BridgeChallengeResponse,
} from '../types/withdrawals.js';
import { generateIdempotencyKey } from '../core/idempotency.js';

export class Withdrawals {
  constructor(private client: HttpClient) {}

  async create(
    params: CreateWithdrawalParams,
    options?: RequestOptions,
  ): Promise<CreateWithdrawalResponse> {
    return this.client.request('POST', '/api/v1/withdrawals', {
      body: params,
      requestOptions: {
        ...options,
        idempotencyKey: options?.idempotencyKey ?? generateIdempotencyKey(),
      },
    });
  }

  async get(publicId: string, options?: RequestOptions): Promise<Withdrawal> {
    return this.client.request('GET', `/api/v1/withdrawals/${publicId}`, {
      requestOptions: options,
    });
  }

  async list(
    params?: ListWithdrawalsParams,
    options?: RequestOptions,
  ): Promise<CursorPage<Withdrawal>> {
    return this.client.request('GET', '/api/v1/withdrawals', {
      query: {
        limit: params?.limit,
        continuation_token: params?.continuation_token,
      },
      requestOptions: options,
    });
  }

  async *listAutoPaginate(
    params?: Omit<ListWithdrawalsParams, 'continuation_token'>,
    options?: RequestOptions,
  ): AsyncIterable<Withdrawal> {
    let continuationToken: string | undefined;

    while (true) {
      const page = await this.list(
        { ...params, continuation_token: continuationToken },
        options,
      );
      for (const item of page.items) {
        yield item;
      }
      if (!page.has_more || !page.continuation_token) break;
      continuationToken = page.continuation_token;
    }
  }

  async createBridgeChallenge(
    publicId: string,
    options?: RequestOptions,
  ): Promise<BridgeChallengeResponse> {
    return this.client.request('POST', `/api/v1/withdrawals/${publicId}/bridge`, {
      requestOptions: options,
    });
  }
}
