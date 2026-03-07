import type { ProblemJson } from '../types/common.js';
import { PrivaraApiError } from './api-error.js';

export class PrivaraRateLimitError extends PrivaraApiError {
  readonly retryAfter: number | undefined;

  constructor(body: ProblemJson, headers: Headers) {
    super(429, body, headers);
    this.name = 'PrivaraRateLimitError';
    const ra = headers.get('retry-after');
    this.retryAfter = ra ? Number(ra) : undefined;
  }
}
