import type { Hex } from 'viem';

export interface BlockchainConfig {
  serializedSessionKey: string;
  zerodevProjectId?: string;
  zerodevBundlerUrl?: string;
  rpcUrl?: string;
  chain?: 'arbitrum-sepolia';
}

export interface CreateAndSubmitResult {
  public_id: string;
  tx_hash: Hex;
  status: 'processing';
}

export interface InvoiceTransactionResult {
  tx_hash: Hex;
}
