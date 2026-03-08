import { randomUUID } from 'node:crypto';

export function generateIdempotencyKey(): string {
  return randomUUID();
}
