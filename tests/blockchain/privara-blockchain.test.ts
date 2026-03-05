import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CreateInvoiceZerodevResponse } from '../../src/types/invoices.js';

vi.mock('../../src/blockchain/kernel-client-factory.js', () => ({
  createKernelClientFromSessionKey: vi.fn(),
}));

import { PrivaraBlockchain } from '../../src/blockchain/privara-blockchain.js';
import { createKernelClientFromSessionKey } from '../../src/blockchain/kernel-client-factory.js';

const mockInvoiceResponse: CreateInvoiceZerodevResponse = {
  public_id: '550e8400-e29b-41d4-a716-446655440000',
  contract_address: '0xDafda4A3E8b98aBfb9909614BddA27B36B47f8B6',
  abi_function_signature:
    'create((uint256,uint8,uint8,bytes),(uint256,uint8,uint8,bytes),address)',
  abi_parameters: {
    encrypted_owner: [
      '0x0000000000000000000000000000000000000000000000000000000000000001',
      0,
      12,
      '0xdeadbeef',
    ],
    encrypted_amount: [
      '0x0000000000000000000000000000000000000000000000000000000000000002',
      0,
      4,
      '0xcafebabe',
    ],
    resolver: '0x1234567890abcdef1234567890abcdef12345678',
  },
};

const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

function createMockKernelClient() {
  return {
    account: {
      encodeCalls: vi.fn().mockResolvedValue('0xencodedcalldata'),
    },
    sendUserOperation: vi.fn().mockResolvedValue('0xuserophash'),
    waitForUserOperationReceipt: vi.fn().mockResolvedValue({
      receipt: { transactionHash: mockTxHash },
    }),
  };
}

describe('PrivaraBlockchain', () => {
  let mockKernelClient: ReturnType<typeof createMockKernelClient>;

  beforeEach(() => {
    mockKernelClient = createMockKernelClient();
    vi.mocked(createKernelClientFromSessionKey).mockResolvedValue(
      mockKernelClient as any,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const config = {
    serializedSessionKey: 'eyJhY2NvdW50UGFyYW1zIjp7fX0=',
  };

  function createMockPrivara() {
    return {
      invoices: {
        create: vi.fn().mockResolvedValue(mockInvoiceResponse),
      },
      transactions: {
        report: vi.fn().mockResolvedValue({
          entity_type: 'invoice',
          entity_id: mockInvoiceResponse.public_id,
          tx_hash: mockTxHash,
          status: 'processing',
        }),
      },
    };
  }

  describe('sendInvoiceTransaction', () => {
    it('encodes calldata and sends user operation', async () => {
      const blockchain = new PrivaraBlockchain(createMockPrivara() as any, config);
      const txHash = await blockchain.sendInvoiceTransaction(mockInvoiceResponse);

      expect(txHash).toBe(mockTxHash);
      expect(mockKernelClient.account.encodeCalls).toHaveBeenCalledWith([
        expect.objectContaining({
          to: mockInvoiceResponse.contract_address,
          value: 0n,
        }),
      ]);
      expect(mockKernelClient.sendUserOperation).toHaveBeenCalledWith({
        callData: '0xencodedcalldata',
      });
      expect(mockKernelClient.waitForUserOperationReceipt).toHaveBeenCalledWith({
        hash: '0xuserophash',
      });
    });

    it('lazily initializes and caches kernel client', async () => {
      const blockchain = new PrivaraBlockchain(createMockPrivara() as any, config);

      await blockchain.sendInvoiceTransaction(mockInvoiceResponse);
      await blockchain.sendInvoiceTransaction(mockInvoiceResponse);

      expect(createKernelClientFromSessionKey).toHaveBeenCalledTimes(1);
    });
  });

  describe('invoices.createAndSubmit', () => {
    it('creates invoice, sends transaction, and reports', async () => {
      const privara = createMockPrivara();
      const blockchain = new PrivaraBlockchain(privara as any, config);

      const result = await blockchain.invoices.createAndSubmit({
        from: 'test@test.com',
        due_date: '2025-12-31',
        reference: 'Test',
        amount: 100,
        currency: { type: 'crypto', code: 'USDC' },
        wallet_id: 'w_1',
      });

      expect(result.public_id).toBe(mockInvoiceResponse.public_id);
      expect(result.tx_hash).toBe(mockTxHash);
      expect(result.status).toBe('processing');

      expect(privara.invoices.create).toHaveBeenCalledTimes(1);
      expect(privara.transactions.report).toHaveBeenCalledWith({
        tx_hash: mockTxHash,
        entity_type: 'invoice',
        entity_id: mockInvoiceResponse.public_id,
      });
    });
  });
});
