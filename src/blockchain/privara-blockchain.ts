import type { KernelAccountClient } from '@zerodev/sdk';
import type { Hex } from 'viem';
import type { Privara } from '../client.js';
import type { CreateInvoiceParams, CreateInvoiceZerodevResponse } from '../types/invoices.js';
import { encodeInvoiceCallData } from './calldata-encoder.js';
import { createKernelClientFromSessionKey } from './kernel-client-factory.js';
import type { BlockchainConfig, CreateAndSubmitResult } from './types.js';

export class PrivaraBlockchain {
  readonly privara: Privara;
  private readonly config: BlockchainConfig;
  private kernelClientPromise: Promise<KernelAccountClient> | null = null;

  readonly invoices: BlockchainInvoices;

  constructor(privara: Privara, config: BlockchainConfig) {
    this.privara = privara;
    this.config = config;
    this.invoices = new BlockchainInvoices(this);
  }

  private getKernelClient(): Promise<KernelAccountClient> {
    if (!this.kernelClientPromise) {
      this.kernelClientPromise = createKernelClientFromSessionKey(this.config);
    }
    return this.kernelClientPromise;
  }

  async sendInvoiceTransaction(invoice: CreateInvoiceZerodevResponse): Promise<Hex> {
    const kernelClient = await this.getKernelClient();
    const calldata = encodeInvoiceCallData(invoice);

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
    const invoice = (await privara.invoices.create(params)) as unknown as CreateInvoiceZerodevResponse;
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
