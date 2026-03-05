import { PrivaraApiError } from './api-error.js';
import type { ProblemJson } from '../types/common.js';

export interface InvalidParam {
  name: string;
  reason: string;
}

export class PrivaraValidationError extends PrivaraApiError {
  readonly invalidParams: InvalidParam[];

  constructor(body: ProblemJson, headers: Headers) {
    super(422, body, headers);
    this.name = 'PrivaraValidationError';
    this.invalidParams = (body as { invalid_params?: InvalidParam[] }).invalid_params ?? [];
  }
}
