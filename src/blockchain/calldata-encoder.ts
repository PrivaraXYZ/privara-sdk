import { encodeFunctionData, type Hex, parseAbiItem } from 'viem';
import type { CreateInvoiceZerodevResponse } from '../types/invoices.js';

export function encodeInvoiceCallData(invoice: CreateInvoiceZerodevResponse): Hex {
  const abiItem = parseAbiItem(`function ${invoice.abi_function_signature}`);
  const args = Object.values(invoice.abi_parameters);

  return encodeFunctionData({ abi: [abiItem], args: args as readonly unknown[] });
}
