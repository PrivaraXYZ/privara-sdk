import { PrivaraApiError } from './api-error.js';
import type { ProblemJson } from '../types/common.js';

export class PrivaraNotFoundError extends PrivaraApiError {
  constructor(body: ProblemJson, headers: Headers) {
    super(404, body, headers);
    this.name = 'PrivaraNotFoundError';
  }
}
