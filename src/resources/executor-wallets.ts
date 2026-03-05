import type { HttpClient } from '../core/http-client.js';
import type { RequestOptions } from '../types/common.js';
import type { CreateExecutorWalletParams, ExecutorWallet } from '../types/executor-wallets.js';

export class ExecutorWallets {
  constructor(private client: HttpClient) {}

  async create(
    params: CreateExecutorWalletParams,
    options?: RequestOptions,
  ): Promise<ExecutorWallet> {
    return this.client.request('POST', '/api/v1/executor-wallet', {
      body: params,
      requestOptions: options,
    });
  }
}
