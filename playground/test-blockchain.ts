import { Privara, PrivaraApiError } from '../src/index.js';
import { PrivaraBlockchain } from '../src/blockchain/index.js';
import type { CreateInvoiceZerodevResponse } from '../src/types/invoices.js';
import { encodeInvoiceCallData } from '../src/blockchain/calldata-encoder.js';

const clientId = process.env.PRIVARA_CLIENT_ID;
const clientSecret = process.env.PRIVARA_CLIENT_SECRET;
const baseUrl = process.env.PRIVARA_BASE_URL || 'https://api.privara.io';
const serializedSessionKey = process.env.PRIVARA_SERIALIZED_SESSION_KEY;

if (!clientId || !clientSecret) {
  console.error('Set PRIVARA_CLIENT_ID and PRIVARA_CLIENT_SECRET in playground/.env');
  process.exit(1);
}

if (!serializedSessionKey) {
  console.error('Set PRIVARA_SERIALIZED_SESSION_KEY in playground/.env (base64 string from serializePermissionAccount)');
  process.exit(1);
}

const privara = new Privara({ clientId, clientSecret, baseUrl });

privara.addRequestInterceptor((req) => {
  console.log(`  -> ${req.method} ${req.path}`);
  return req;
});

const blockchain = new PrivaraBlockchain(privara, {
  serializedSessionKey,
});

async function section(name: string, fn: () => Promise<void>) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${name}`);
  console.log('='.repeat(60));
  try {
    await fn();
  } catch (error) {
    if (error instanceof PrivaraApiError) {
      console.error(`  API Error ${error.status}: ${error.title}`);
      if (error.detail) console.error(`  Detail: ${error.detail}`);
    } else if (error instanceof Error) {
      console.error(`  Error: ${error.message}`);
      if (error.stack) console.error(error.stack);
    } else {
      console.error('  Error:', error);
    }
  }
}

// Step 1: Create invoice via API (ZeroDev flow)
await section('Step 1: Create invoice via API', async () => {
  const response = await privara.invoices.create({
    from: 'sdk-test@privara.dev',
    due_date: '2025-12-31',
    reference: 'SDK Blockchain Test',
    amount: 1,
    currency: { type: 'crypto', code: 'USDC' },
    wallet_id: 'sdk-test',
  });

  console.log('  Response:', JSON.stringify(response, null, 2));

  const zerodevResponse = response as unknown as CreateInvoiceZerodevResponse;

  if (!zerodevResponse.contract_address) {
    console.error('  Got Circle response instead of ZeroDev response. Check auth walletProvider.');
    return;
  }

  console.log('  public_id:', zerodevResponse.public_id);
  console.log('  contract_address:', zerodevResponse.contract_address);
  console.log('  abi_function_signature:', zerodevResponse.abi_function_signature);
  console.log('  abi_parameters:', JSON.stringify(zerodevResponse.abi_parameters, null, 4));

  // Step 2: Encode calldata
  console.log('\n  --- Encoding calldata ---');
  const calldata = encodeInvoiceCallData(zerodevResponse);
  console.log('  calldata:', calldata.slice(0, 66) + '...');
  console.log('  calldata length:', calldata.length, 'chars');

  // Step 3: Send transaction
  console.log('\n  --- Sending user operation ---');
  const txHash = await blockchain.sendInvoiceTransaction(zerodevResponse);
  console.log('  tx_hash:', txHash);

  // Step 4: Report transaction
  console.log('\n  --- Reporting transaction ---');
  const report = await privara.transactions.report({
    tx_hash: txHash,
    entity_type: 'invoice',
    entity_id: zerodevResponse.public_id,
  });
  console.log('  Report:', JSON.stringify(report, null, 2));
});

// Full flow in one call
await section('Full flow: createAndSubmit', async () => {
  const result = await blockchain.invoices.createAndSubmit({
    from: 'sdk-test-full@privara.dev',
    due_date: '2025-12-31',
    reference: 'SDK Full Flow Test',
    amount: 2,
    currency: { type: 'crypto', code: 'USDC' },
    wallet_id: 'sdk-test',
  });

  console.log('  Result:', JSON.stringify(result, null, 2));
});

console.log('\nDone\n');
