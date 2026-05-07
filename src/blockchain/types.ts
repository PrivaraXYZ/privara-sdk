import type { Account, Hex } from 'viem';

export interface BlockchainConfig {
  rpcUrl?: string;
  chain?: 'arbitrum-sepolia';

  serializedSessionKey?: string;
  zerodevProjectId?: string;
  zerodevBundlerUrl?: string;

  signer?: Account;
}

export interface CreateAndSubmitResult {
  public_id: string;
  tx_hash: Hex;
  status: 'processing';
}

export interface InvoiceTransactionResult {
  tx_hash: Hex;
}
