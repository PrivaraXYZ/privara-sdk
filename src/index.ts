export { Privara, type PrivaraConfig } from './client.js';

export { PrivaraError } from './errors/privara-error.js';
export { PrivaraApiError } from './errors/api-error.js';
export { PrivaraAuthenticationError } from './errors/authentication-error.js';
export { PrivaraValidationError, type InvalidParam } from './errors/validation-error.js';
export { PrivaraNotFoundError } from './errors/not-found-error.js';
export { PrivaraConflictError } from './errors/conflict-error.js';
export { PrivaraRateLimitError } from './errors/rate-limit-error.js';
export { PrivaraConnectionError } from './errors/connection-error.js';

export type { Currency, ProblemJson, RequestOptions } from './types/common.js';
export type { OffsetPage, CursorPage } from './types/pagination.js';
export type {
  InvoiceStatus,
  CreateInvoiceParams,
  CreateInvoiceResponse,
  CreateInvoiceZerodevResponse,
  Invoice,
  ListInvoicesParams,
} from './types/invoices.js';
export type { Balance } from './types/balance.js';
export type {
  DestinationChain,
  WithdrawalStatus,
  CreateWithdrawalParams,
  CreateWithdrawalResponse,
  Withdrawal,
  ListWithdrawalsParams,
  BridgeChallengeResponse,
} from './types/withdrawals.js';
export type { ReportTransactionParams, ReportTransactionResponse } from './types/transactions.js';

export { toArray } from './core/pagination.js';

export type { RequestInterceptor, ResponseInterceptor, InterceptedRequest } from './core/http-client.js';
