import { createPublicClient, http } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { entryPoint07Address } from 'viem/account-abstraction';
import {
  createKernelAccountClient,
  createZeroDevPaymasterClient,
  constants,
  type KernelAccountClient,
} from '@zerodev/sdk';
import { deserializePermissionAccount } from '@zerodev/permissions';
import type { BlockchainConfig } from './types.js';

const DEFAULT_ZERODEV_PROJECT_ID = '94a91379-17e9-4e81-acc8-ce2aca6f299a';
const DEFAULT_RPC_URL = 'https://sepolia-rollup.arbitrum.io/rpc';

const ENTRY_POINT = { address: entryPoint07Address, version: '0.7' as const };
const KERNEL_VERSION = constants.KERNEL_V3_1;

const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

function buildBundlerUrl(projectId: string, chainId = ARBITRUM_SEPOLIA_CHAIN_ID): string {
  return `https://rpc.zerodev.app/api/v3/${projectId}/chain/${chainId}`;
}

export async function createKernelClientFromSessionKey(
  config: BlockchainConfig,
): Promise<KernelAccountClient> {
  const chain = arbitrumSepolia;
  const rpcUrl = config.rpcUrl ?? DEFAULT_RPC_URL;
  const projectId = config.zerodevProjectId ?? DEFAULT_ZERODEV_PROJECT_ID;
  const bundlerUrl = config.zerodevBundlerUrl ?? buildBundlerUrl(projectId);

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const account = await deserializePermissionAccount(
    publicClient,
    ENTRY_POINT,
    KERNEL_VERSION,
    config.serializedSessionKey,
  );

  const paymaster = createZeroDevPaymasterClient({
    chain,
    transport: http(bundlerUrl),
  });

  return createKernelAccountClient({
    account,
    chain,
    bundlerTransport: http(bundlerUrl),
    paymaster,
  });
}
