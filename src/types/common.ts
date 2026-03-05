export interface Currency {
  type: 'fiat' | 'crypto';
  code: string;
}

export interface ProblemJson {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  invalid_params?: Array<{ name: string; reason: string }>;
}

export interface RequestOptions {
  signal?: AbortSignal;
  idempotencyKey?: string;
  headers?: Record<string, string>;
}
