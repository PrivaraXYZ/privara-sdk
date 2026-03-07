import { PrivaraApiError } from '../errors/api-error.js';
import { PrivaraConnectionError } from '../errors/connection-error.js';
import type { RequestOptions } from '../types/common.js';
import type { AuthManager } from './auth-manager.js';
import { type RetryConfig, withRetry } from './retry.js';

export interface HttpClientConfig {
  baseUrl: string;
  authManager?: AuthManager;
  accessToken?: string;
  timeout: number;
  retryConfig: RetryConfig;
}

export type RequestInterceptor = (request: InterceptedRequest) => InterceptedRequest | Promise<InterceptedRequest>;

export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

export interface InterceptedRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: string;
}

export class HttpClient {
  private config: HttpClientConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      query?: Record<string, string | number | undefined>;
      auth?: boolean;
      requestOptions?: RequestOptions;
    },
  ): Promise<T> {
    return withRetry(async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options?.requestOptions?.headers,
      };

      const auth = options?.auth ?? true;
      if (auth) {
        const token = await this.resolveToken();
        headers.Authorization = `Bearer ${token}`;
      }

      if (options?.requestOptions?.idempotencyKey) {
        headers['X-Idempotency-Key'] = options.requestOptions.idempotencyKey;
      }

      let url = `${this.config.baseUrl}${path}`;
      if (options?.query) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(options.query)) {
          if (value !== undefined) {
            params.set(key, String(value));
          }
        }
        const qs = params.toString();
        if (qs) url += `?${qs}`;
      }

      let req: InterceptedRequest = {
        method,
        path,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      };

      for (const interceptor of this.requestInterceptors) {
        req = await interceptor(req);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      const signal = options?.requestOptions?.signal;
      if (signal) {
        signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
      }

      let response: Response;
      try {
        response = await fetch(url, {
          method: req.method,
          headers: req.headers,
          body: req.body,
          signal: controller.signal,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          if (signal?.aborted) {
            throw error;
          }
          throw new PrivaraConnectionError('Request timed out', error);
        }
        throw new PrivaraConnectionError('Network request failed', error);
      } finally {
        clearTimeout(timeoutId);
      }

      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response);
      }

      if (!response.ok) {
        throw await PrivaraApiError.fromResponse(response);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    }, this.config.retryConfig);
  }

  private async resolveToken(): Promise<string> {
    if (this.config.accessToken) {
      return this.config.accessToken;
    }
    if (this.config.authManager) {
      return this.config.authManager.getAccessToken();
    }
    throw new Error('No authentication configured. Provide accessToken or clientId/clientSecret.');
  }
}
