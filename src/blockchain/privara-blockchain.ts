import type { KernelAccountClient } from '@zerodev/sdk';
import type { Hex, WalletClient } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import type { Privara } from '../client.js';
import type { CreateInvoiceParams, CreateInvoiceZerodevResponse } from '../types/invoices.js';
import { encodeInvoiceCallData } from './calldata-encoder.js';
import { createKernelClientFromSessionKey } from './kernel-client-factory.js';
import type { BlockchainConfig, CreateAndSubmitResult } from './types.js';
import { createWalletClientFromSigner } from './wallet-client-factory.js';

export class PrivaraBlockchain {
  readonly privara: Privara;
  private readonly config: BlockchainConfig;
  private readonly useSignerMode: boolean;
  private kernelClientPromise: Promise<KernelAccountClient> | null = null;
  private walletClient: WalletClient | null = null;

  readonly invoices: BlockchainInvoices;

  constructor(privara: Privara, config: BlockchainConfig) {
    if (config.signer && config.serializedSessionKey) {
      throw new Error('BlockchainConfig: provide either `signer` or `serializedSessionKey`, not both');
    }
    if (!config.signer && !config.serializedSessionKey) {
      throw new Error('BlockchainConfig: one of `signer` or `serializedSessionKey` is required');
    }

    this.privara = privara;
    this.config = config;
    this.useSignerMode = Boolean(config.signer);
    this.invoices = new BlockchainInvoices(this);
  }

  private getKernelClient(): Promise<KernelAccountClient> {
    if (!this.kernelClientPromise) {
      this.kernelClientPromise = createKernelClientFromSessionKey(this.config);
    }
    return this.kernelClientPromise;
  }

  private getWalletClient(): WalletClient {
    if (!this.walletClient) {
      this.walletClient = createWalletClientFromSigner(this.config);
    }
    return this.walletClient;
  }

  getSignerAddress(): string | undefined {
    return this.config.signer?.address;
  }

  async sendInvoiceTransaction(invoice: CreateInvoiceZerodevResponse): Promise<Hex> {
    const calldata = encodeInvoiceCallData(invoice);

    if (this.useSignerMode) {
      const walletClient = this.getWalletClient();
      const account = walletClient.account;
      if (!account) {
        throw new Error('Wallet client has no account');
      }
      return walletClient.sendTransaction({
        account,
        chain: arbitrumSepolia,
        to: invoice.contract_address as Hex,
        data: calldata,
        value: 0n,
      });
    }

    const kernelClient = await this.getKernelClient();
    const { account } = kernelClient;
    if (!account) {
      throw new Error('Kernel account not initialized');
    }

    const encodedCallData = await account.encodeCalls([
      {
        to: invoice.contract_address as Hex,
        data: calldata,
        value: 0n,
      },
    ]);

    const userOpHash = await kernelClient.sendUserOperation({ callData: encodedCallData });
    const receipt = await kernelClient.waitForUserOperationReceipt({ hash: userOpHash });

    return receipt.receipt.transactionHash;
  }
}

class BlockchainInvoices {
  constructor(private blockchain: PrivaraBlockchain) {}

  async createAndSubmit(params: CreateInvoiceParams): Promise<CreateAndSubmitResult> {
    const privara = this.blockchain.privara;
    const signerAddress = this.blockchain.getSignerAddress();
    const invoiceParams = signerAddress ? { ...params, signer_address: signerAddress } : params;
    const invoice = (await privara.invoices.create(invoiceParams)) as unknown as CreateInvoiceZerodevResponse;
    const txHash = await this.blockchain.sendInvoiceTransaction(invoice);

    await privara.transactions.report({
      tx_hash: txHash,
      entity_type: 'invoice',
      entity_id: invoice.public_id,
    });

    return {
      public_id: invoice.public_id,
      tx_hash: txHash,
      status: 'processing',
    };
  }
}
