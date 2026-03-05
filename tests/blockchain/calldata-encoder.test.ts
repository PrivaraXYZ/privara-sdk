import { describe, it, expect } from 'vitest';
import { decodeFunctionData, parseAbiItem } from 'viem';
import { encodeInvoiceCallData } from '../../src/blockchain/calldata-encoder.js';
import type { CreateInvoiceZerodevResponse } from '../../src/types/invoices.js';

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

describe('encodeInvoiceCalldata', () => {
  it('encodes valid calldata from invoice response', () => {
    const calldata = encodeInvoiceCallData(mockInvoiceResponse);

    expect(calldata).toMatch(/^0x/);
    expect(calldata.length).toBeGreaterThan(10);
  });

  it('produces decodable calldata matching the ABI signature', () => {
    const calldata = encodeInvoiceCallData(mockInvoiceResponse);
    const abiItem = parseAbiItem(
      `function ${mockInvoiceResponse.abi_function_signature}`,
    );

    const decoded = decodeFunctionData({
      abi: [abiItem],
      data: calldata,
    });

    expect(decoded.functionName).toBe('create');
    expect(decoded.args).toHaveLength(3);

    const [ownerTuple, amountTuple, resolver] = decoded.args as [
      readonly [bigint, number, number, string],
      readonly [bigint, number, number, string],
      string,
    ];

    expect(ownerTuple[0]).toBe(1n);
    expect(ownerTuple[1]).toBe(0);
    expect(ownerTuple[2]).toBe(12);

    expect(amountTuple[0]).toBe(2n);
    expect(amountTuple[1]).toBe(0);
    expect(amountTuple[2]).toBe(4);

    expect(resolver.toLowerCase()).toBe(
      '0x1234567890abcdef1234567890abcdef12345678',
    );
  });
});
