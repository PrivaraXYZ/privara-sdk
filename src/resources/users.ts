import type { HttpClient } from '../core/http-client.js';
import type { RequestOptions } from '../types/common.js';
import type { UserStatusResponse } from '../types/users.js';

export class Users {
  constructor(private client: HttpClient) {}

  async me(options?: RequestOptions): Promise<UserStatusResponse> {
    return this.client.request('GET', '/api/v1/users/me', {
      requestOptions: options,
    });
  }
}
