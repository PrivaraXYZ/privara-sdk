import type { HttpClient } from '../core/http-client.js';
import type { RequestOptions } from '../types/common.js';
import type { ReportTransactionParams, ReportTransactionResponse } from '../types/transactions.js';

export class Transactions {
  constructor(private client: HttpClient) {}

  async report(
    params: ReportTransactionParams,
    options?: RequestOptions,
  ): Promise<ReportTransactionResponse> {
    return this.client.request('POST', '/api/v1/transactions/report', {
      body: params,
      requestOptions: options,
    });
  }
}
