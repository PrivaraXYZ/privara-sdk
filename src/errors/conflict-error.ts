import { PrivaraApiError } from './api-error.js';
import type { ProblemJson } from '../types/common.js';

export class PrivaraConflictError extends PrivaraApiError {
  constructor(body: ProblemJson, headers: Headers) {
    super(409, body, headers);
    this.name = 'PrivaraConflictError';
  }
}
