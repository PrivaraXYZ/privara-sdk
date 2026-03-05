import { Privara, PrivaraApiError } from '../src/index.js';

const clientId = process.env.PRIVARA_CLIENT_ID;
const clientSecret = process.env.PRIVARA_CLIENT_SECRET;
const baseUrl = process.env.PRIVARA_BASE_URL || 'https://api.privara.io';

if (!clientId || !clientSecret) {
  console.error('Set PRIVARA_CLIENT_ID and PRIVARA_CLIENT_SECRET in playground/.env');
  process.exit(1);
}

const privara = new Privara({ clientId, clientSecret, baseUrl });

privara.addRequestInterceptor((req) => {
  console.log(`→ ${req.method} ${req.path}`);
  return req;
});

async function section(name: string, fn: () => Promise<void>) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`  ${name}`);
  console.log('='.repeat(50));
  try {
    await fn();
  } catch (error) {
    if (error instanceof PrivaraApiError) {
      console.error(`  API Error ${error.status}: ${error.title}`);
      if (error.detail) console.error(`  Detail: ${error.detail}`);
    } else {
      console.error(`  Error:`, error);
    }
  }
}

await section('GET /balance', async () => {
  const balance = await privara.balance.get();
  console.log('  Balance:', JSON.stringify(balance, null, 2));
});

await section('GET /invoices (first page)', async () => {
  const page = await privara.invoices.list({ limit: 5 });
  console.log(`  Invoices: ${page.items.length} / ${page.pagination.total} total`);
  for (const inv of page.items) {
    console.log(`    - ${inv.public_id} | ${inv.status} | ${inv.amount} ${inv.currency.code}`);
  }
});

await section('GET /invoices (auto-paginate, max 10)', async () => {
  let count = 0;
  for await (const inv of privara.invoices.listAutoPaginate({ limit: 3 })) {
    console.log(`    - ${inv.public_id} | ${inv.status}`);
    if (++count >= 10) break;
  }
  console.log(`  Iterated: ${count} invoices`);
});

await section('GET /withdrawals (first page)', async () => {
  const page = await privara.withdrawals.list({ limit: 5 });
  console.log(`  Withdrawals: ${page.items.length} (has_more: ${page.has_more})`);
  for (const w of page.items) {
    console.log(`    - ${w.public_id} | ${w.status} | ${w.estimated_amount}`);
  }
});

// ── Blockchain flow (requires PRIVARA_SERIALIZED_SESSION_KEY env var) ──────────
const serializedSessionKey = process.env.PRIVARA_SERIALIZED_SESSION_KEY;

if (serializedSessionKey) {
  const { PrivaraBlockchain } = await import('../src/blockchain/index.js');

  const blockchain = new PrivaraBlockchain(privara, {
    serializedSessionKey,
  });

  await section('Blockchain: createAndSubmit invoice', async () => {
    const result = await blockchain.invoices.createAndSubmit({
      from: 'test@example.com',
      due_date: '2025-12-31',
      reference: 'SDK Playground Test',
      amount: 1,
      currency: { type: 'crypto', code: 'USDC' },
      wallet_id: 'playground',
    });
    console.log('  Result:', JSON.stringify(result, null, 2));
  });
} else {
  console.log('\n  Skipping blockchain tests (set PRIVARA_SERIALIZED_SESSION_KEY to enable)');
}

console.log('\n✓ Done\n');
