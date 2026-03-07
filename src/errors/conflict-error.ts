import type { ProblemJson } from '../types/common.js';
import { PrivaraApiError } from './api-error.js';

export class PrivaraConflictError extends PrivaraApiError {
  constructor(body: ProblemJson, headers: Headers) {
    super(409, body, headers);
    this.name = 'PrivaraConflictError';
  }
}
