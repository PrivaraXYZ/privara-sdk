import { createWalletClient, http, type WalletClient } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import type { BlockchainConfig } from './types.js';

const DEFAULT_RPC_URL = 'https://sepolia-rollup.arbitrum.io/rpc';

export function createWalletClientFromSigner(config: BlockchainConfig): WalletClient {
  if (!config.signer) {
    throw new Error('signer is required to create a wallet client');
  }
  return createWalletClient({
    account: config.signer,
    chain: arbitrumSepolia,
    transport: http(config.rpcUrl ?? DEFAULT_RPC_URL),
  });
}
