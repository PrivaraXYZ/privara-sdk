import { PrivaraError } from './privara-error.js';

export class PrivaraConnectionError extends PrivaraError {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PrivaraConnectionError';
    this.cause = cause;
  }
}
