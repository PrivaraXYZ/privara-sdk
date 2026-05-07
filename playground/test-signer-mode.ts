import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import { Privara, PrivaraApiError } from '../src/index.js';
import { PrivaraBlockchain } from '../src/blockchain/index.js';

const clientId = process.env.PRIVARA_CLIENT_ID;
const clientSecret = process.env.PRIVARA_CLIENT_SECRET;
const baseUrl = process.env.PRIVARA_BASE_URL || 'https://api.privara.io';
const signerPk = process.env.PRIVARA_SIGNER_PK as `0x${string}` | undefined;
const walletId = process.env.PRIVARA_TEST_WALLET_ID;
const rpcUrl = process.env.PRIVARA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';

if (!clientId || !clientSecret) {
  console.error('Set PRIVARA_CLIENT_ID and PRIVARA_CLIENT_SECRET in playground/.env');
  process.exit(1);
}
if (!signerPk) {
  console.error('Set PRIVARA_SIGNER_PK in playground/.env (0x-prefixed test private key, funded on Arbitrum Sepolia)');
  process.exit(1);
}
if (!walletId) {
  console.error('Set PRIVARA_TEST_WALLET_ID in playground/.env (encrypted-owner address — main passkey wallet)');
  process.exit(1);
}

const signer = privateKeyToAccount(signerPk);
console.log(`Signer EOA: ${signer.address}`);
console.log(`RPC:        ${rpcUrl}`);
console.log(`Encrypted owner (wallet_id): ${walletId}`);

const publicClient = createPublicClient({ chain: arbitrumSepolia, transport: http(rpcUrl) });

const balance = await publicClient.getBalance({ address: signer.address });
console.log(`Balance:    ${balance} wei`);
if (balance === 0n) {
  console.error('Signer has 0 ETH on Arbitrum Sepolia — fund it before running.');
  process.exit(1);
}

const privara = new Privara({ clientId, clientSecret, baseUrl });
privara.addRequestInterceptor((req) => {
  console.log(`  -> ${req.method} ${req.path}`);
  return req;
});

const blockchain = new PrivaraBlockchain(privara, { signer, rpcUrl });

console.log('\n=== createAndSubmit (signer mode) ===');
try {
  const result = await blockchain.invoices.createAndSubmit({
    from: 'sdk-test-signer@privara.dev',
    due_date: '2026-12-31',
    reference: 'SDK Signer Mode E2E',
    amount: 1,
    currency: { type: 'crypto', code: 'USDC' },
    wallet_id: walletId,
  });
  console.log('Result:', JSON.stringify(result, null, 2));
  console.log(`Arbiscan: https://sepolia.arbiscan.io/tx/${result.tx_hash}`);

  console.log('\n--- Waiting for receipt ---');
  const receipt = await publicClient.waitForTransactionReceipt({ hash: result.tx_hash });
  console.log(`status:  ${receipt.status}`);
  console.log(`from:    ${receipt.from}`);
  console.log(`to:      ${receipt.to}`);
  console.log(`block:   ${receipt.blockNumber}`);
  console.log(`gas:     ${receipt.gasUsed}`);

  if (receipt.from.toLowerCase() !== signer.address.toLowerCase()) {
    console.error(`FAIL: receipt.from (${receipt.from}) != signer (${signer.address})`);
    process.exit(2);
  }
  if (receipt.status !== 'success') {
    console.error(`FAIL: tx reverted`);
    process.exit(2);
  }
  console.log('\nOK — signer mode works end-to-end on Arbitrum Sepolia.');
} catch (error) {
  if (error instanceof PrivaraApiError) {
    console.error(`API Error ${error.status}: ${error.title}`);
    if (error.detail) console.error(`Detail: ${error.detail}`);
  } else if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
    if (error.stack) console.error(error.stack);
  } else {
    console.error('Error:', error);
  }
  process.exit(1);
}
