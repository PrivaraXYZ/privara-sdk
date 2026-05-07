import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { CreateInvoiceZerodevResponse } from '../../src/types/invoices.js';

vi.mock('../../src/blockchain/kernel-client-factory.js', () => ({
  createKernelClientFromSessionKey: vi.fn(),
}));

vi.mock('../../src/blockchain/wallet-client-factory.js', () => ({
  createWalletClientFromSigner: vi.fn(),
}));

import { PrivaraBlockchain } from '../../src/blockchain/privara-blockchain.js';
import { createKernelClientFromSessionKey } from '../../src/blockchain/kernel-client-factory.js';
import { createWalletClientFromSigner } from '../../src/blockchain/wallet-client-factory.js';
import { encodeInvoiceCallData } from '../../src/blockchain/calldata-encoder.js';

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

function createMockWalletClient() {
  return {
    account: { address: '0x000000000000000000000000000000000000beef', type: 'local' as const },
    sendTransaction: vi.fn().mockResolvedValue(mockTxHash),
  };
}

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

describe('PrivaraBlockchain', () => {
  let mockKernelClient: ReturnType<typeof createMockKernelClient>;
  let mockWalletClient: ReturnType<typeof createMockWalletClient>;

  beforeEach(() => {
    mockKernelClient = createMockKernelClient();
    mockWalletClient = createMockWalletClient();
    vi.mocked(createKernelClientFromSessionKey).mockResolvedValue(
      mockKernelClient as any,
    );
    vi.mocked(createWalletClientFromSigner).mockReturnValue(mockWalletClient as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sessionKeyConfig = {
    serializedSessionKey: 'eyJhY2NvdW50UGFyYW1zIjp7fX0=',
  };

  const signerConfig = {
    signer: { address: '0x000000000000000000000000000000000000beef', type: 'local' as const } as any,
    rpcUrl: 'https://example.test/rpc',
  };

  describe('constructor config validation', () => {
    it('throws when both signer and serializedSessionKey are provided', () => {
      expect(
        () =>
          new PrivaraBlockchain(createMockPrivara() as any, {
            ...signerConfig,
            ...sessionKeyConfig,
          }),
      ).toThrow(/either `signer` or `serializedSessionKey`, not both/);
    });

    it('throws when neither signer nor serializedSessionKey is provided', () => {
      expect(
        () => new PrivaraBlockchain(createMockPrivara() as any, {} as any),
      ).toThrow(/one of `signer` or `serializedSessionKey` is required/);
    });
  });

  describe('legacy session-key mode', () => {
    describe('sendInvoiceTransaction', () => {
      it('encodes calldata and sends user operation', async () => {
        const blockchain = new PrivaraBlockchain(createMockPrivara() as any, sessionKeyConfig);
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
        expect(mockWalletClient.sendTransaction).not.toHaveBeenCalled();
      });

      it('lazily initializes and caches kernel client', async () => {
        const blockchain = new PrivaraBlockchain(createMockPrivara() as any, sessionKeyConfig);

        await blockchain.sendInvoiceTransaction(mockInvoiceResponse);
        await blockchain.sendInvoiceTransaction(mockInvoiceResponse);

        expect(createKernelClientFromSessionKey).toHaveBeenCalledTimes(1);
      });
    });

    describe('invoices.createAndSubmit', () => {
      it('creates invoice, sends transaction via kernel, and reports', async () => {
        const privara = createMockPrivara();
        const blockchain = new PrivaraBlockchain(privara as any, sessionKeyConfig);

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

  describe('signer mode', () => {
    describe('sendInvoiceTransaction', () => {
      it('sends a regular transaction via wallet client (no kernel)', async () => {
        const blockchain = new PrivaraBlockchain(createMockPrivara() as any, signerConfig);
        const txHash = await blockchain.sendInvoiceTransaction(mockInvoiceResponse);

        expect(txHash).toBe(mockTxHash);
        expect(mockWalletClient.sendTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            to: mockInvoiceResponse.contract_address,
            value: 0n,
            data: encodeInvoiceCallData(mockInvoiceResponse),
            account: mockWalletClient.account,
          }),
        );
        expect(createKernelClientFromSessionKey).not.toHaveBeenCalled();
        expect(mockKernelClient.sendUserOperation).not.toHaveBeenCalled();
      });

      it('lazily initializes and caches wallet client', async () => {
        const blockchain = new PrivaraBlockchain(createMockPrivara() as any, signerConfig);

        await blockchain.sendInvoiceTransaction(mockInvoiceResponse);
        await blockchain.sendInvoiceTransaction(mockInvoiceResponse);

        expect(createWalletClientFromSigner).toHaveBeenCalledTimes(1);
      });

      it('uses identical calldata to legacy mode', async () => {
        const expectedCalldata = encodeInvoiceCallData(mockInvoiceResponse);

        const signerBlockchain = new PrivaraBlockchain(createMockPrivara() as any, signerConfig);
        await signerBlockchain.sendInvoiceTransaction(mockInvoiceResponse);
        const signerCalldata = mockWalletClient.sendTransaction.mock.calls[0][0].data;

        const legacyBlockchain = new PrivaraBlockchain(
          createMockPrivara() as any,
          sessionKeyConfig,
        );
        await legacyBlockchain.sendInvoiceTransaction(mockInvoiceResponse);
        const legacyCalls = mockKernelClient.account.encodeCalls.mock.calls[0][0];
        const legacyCalldata = legacyCalls[0].data;

        expect(signerCalldata).toBe(expectedCalldata);
        expect(legacyCalldata).toBe(expectedCalldata);
      });
    });

    describe('invoices.createAndSubmit', () => {
      it('creates invoice, sends transaction via signer, and reports', async () => {
        const privara = createMockPrivara();
        const blockchain = new PrivaraBlockchain(privara as any, signerConfig);

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
        expect(mockWalletClient.sendTransaction).toHaveBeenCalledTimes(1);
        expect(privara.transactions.report).toHaveBeenCalledWith({
          tx_hash: mockTxHash,
          entity_type: 'invoice',
          entity_id: mockInvoiceResponse.public_id,
        });
      });
    });
  });
});
