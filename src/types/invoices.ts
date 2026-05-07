import type { Currency } from './common.js';

export type InvoiceStatus =
  | 'pending'
  | 'draft'
  | 'issued'
  | 'processing'
  | 'paid'
  | 'redeemed'
  | 'overdue'
  | 'canceled'
  | 'failed';

export interface CreateInvoiceParams {
  from: string;
  due_date: string;
  reference: string;
  amount: number;
  currency: Currency;
  wallet_id: string;
  provider_id?: 'CIRCLE';
  metadata?: string;
  signer_address?: string;
}

export interface CreateInvoiceResponse {
  public_id: string;
  challenge_id: string;
}

export interface Invoice {
  public_id: string;
  from: string;
  due_date: string;
  reference: string;
  amount: number;
  status: InvoiceStatus;
  currency: Currency;
  on_chain_id?: string;
}

export interface CreateInvoiceZerodevResponse {
  public_id: string;
  contract_address: string;
  abi_function_signature: string;
  abi_parameters: {
    encrypted_owner: [string, number, number, string];
    encrypted_amount: [string, number, number, string];
    resolver: string;
  };
}

export interface ListInvoicesParams {
  limit?: number;
  offset?: number;
  status?: InvoiceStatus;
  sort_order?: 'asc' | 'desc';
}
