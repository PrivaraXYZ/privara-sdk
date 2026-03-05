import type { HttpClient } from '../core/http-client.js';
import type { RequestOptions } from '../types/common.js';
import type {
  GenerateCredentialsResponse,
  ListCredentialsResponse,
} from '../types/credentials.js';

export class Credentials {
  constructor(private client: HttpClient) {}

  async generate(options?: RequestOptions): Promise<GenerateCredentialsResponse> {
    return this.client.request('POST', '/api/v1/credentials', {
      requestOptions: options,
    });
  }

  async list(options?: RequestOptions): Promise<ListCredentialsResponse> {
    return this.client.request('GET', '/api/v1/credentials', {
      requestOptions: options,
    });
  }

  async revoke(clientId: string, options?: RequestOptions): Promise<void> {
    return this.client.request('DELETE', `/api/v1/credentials/${clientId}`, {
      requestOptions: options,
    });
  }
}
