import type { HttpClient } from '../core/http-client.js';
import type { RequestOptions } from '../types/common.js';
import type { CreateBusinessProfileParams, CreateBusinessProfileResponse } from '../types/business-profiles.js';

export class BusinessProfiles {
  constructor(private client: HttpClient) {}

  async create(
    params: CreateBusinessProfileParams,
    options?: RequestOptions,
  ): Promise<CreateBusinessProfileResponse> {
    return this.client.request('POST', '/api/v1/business-profiles', {
      body: params,
      requestOptions: options,
    });
  }
}
