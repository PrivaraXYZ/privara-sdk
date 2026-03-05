import { PrivaraError } from './privara-error.js';
import type { ProblemJson } from '../types/common.js';

export class PrivaraApiError extends PrivaraError {
  readonly status: number;
  readonly type: string;
  readonly title: string;
  readonly detail: string | undefined;
  readonly headers: Headers;

  constructor(
    status: number,
    body: ProblemJson,
    headers: Headers,
  ) {
    super(body.detail ?? body.title);
    this.name = 'PrivaraApiError';
    this.status = status;
    this.type = body.type ?? 'about:blank';
    this.title = body.title;
    this.detail = body.detail;
    this.headers = headers;
  }

  static async fromResponse(response: Response): Promise<PrivaraApiError> {
    let body: ProblemJson;
    try {
      body = await response.json() as ProblemJson;
    } catch {
      body = {
        type: 'about:blank',
        title: response.statusText || 'Unknown Error',
        status: response.status,
      };
    }

    const { status, headers } = response;

    const { PrivaraAuthenticationError } = await import('./authentication-error.js');
    const { PrivaraNotFoundError } = await import('./not-found-error.js');
    const { PrivaraConflictError } = await import('./conflict-error.js');
    const { PrivaraValidationError } = await import('./validation-error.js');
    const { PrivaraRateLimitError } = await import('./rate-limit-error.js');

    switch (status) {
      case 401:
        return new PrivaraAuthenticationError(body, headers);
      case 404:
        return new PrivaraNotFoundError(body, headers);
      case 409:
        return new PrivaraConflictError(body, headers);
      case 422:
        return new PrivaraValidationError(body, headers);
      case 429:
        return new PrivaraRateLimitError(body, headers);
      default:
        return new PrivaraApiError(status, body, headers);
    }
  }
}
