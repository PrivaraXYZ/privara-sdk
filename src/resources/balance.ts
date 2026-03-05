import type { HttpClient } from '../core/http-client.js';
import type { RequestOptions } from '../types/common.js';
import type { Balance } from '../types/balance.js';

export class BalanceResource {
  constructor(private client: HttpClient) {}

  async get(options?: RequestOptions): Promise<Balance> {
    return this.client.request('GET', '/api/v1/balance', {
      requestOptions: options,
    });
  }
}
