import type { ProblemJson } from '../types/common.js';
import { PrivaraApiError } from './api-error.js';

export class PrivaraAuthenticationError extends PrivaraApiError {
  constructor(body: ProblemJson, headers: Headers) {
    super(401, body, headers);
    this.name = 'PrivaraAuthenticationError';
  }
}
