export type DestinationChain = 'BASE' | 'ETH' | 'POLYGON';

export type WithdrawalStatus = 'PENDING_REDEEM' | 'PENDING_BRIDGE' | 'BRIDGING' | 'COMPLETED' | 'FAILED';

export interface CreateWithdrawalParams {
  invoice_ids: number[];
  destination_chain: DestinationChain;
  recipient_address: string;
  wallet_id: string;
}

export interface CreateWithdrawalResponse {
  public_id: string;
  challenge_id: string;
  status: WithdrawalStatus;
  estimated_amount: number;
}

export interface Withdrawal {
  public_id: string;
  invoice_ids: number[];
  destination_chain: DestinationChain;
  destination_domain: number;
  recipient_address: string;
  status: WithdrawalStatus;
  estimated_amount: number;
  actual_amount?: number;
  fee?: number;
  redeem_tx_hash?: string;
  bridge_tx_hash?: string;
  destination_tx_hash?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ListWithdrawalsParams {
  limit?: number;
  continuation_token?: string;
}

export interface BridgeChallengeResponse {
  public_id: string;
  challenge_id: string;
  status: WithdrawalStatus;
  actual_amount: number;
}
