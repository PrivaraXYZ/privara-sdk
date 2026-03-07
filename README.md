# Privara SDK for TypeScript

TypeScript SDK for the [Privara](https://app.privara.dev) — confidential stablecoin payments on compliant rails.

## Installation

```bash
pnpm add @privara/sdk
```

```bash
npm install @privara/sdk
```

```bash
yarn add @privara/sdk
```

**Requirements:** Node.js 18+. Zero runtime dependencies.

## Usage

```ts
import {Privara} from '@privara/sdk';

const privara = new Privara({
    clientId: 'pvr_...',
    clientSecret: 'pvrs_...',
});

const balance = await privara.balance.get();
console.log(balance.balance, balance.currency);
```

The SDK automatically obtains and refreshes OAuth tokens via the `client_credentials` grant. Concurrent requests share a
single token refresh — no duplicate auth calls.

### Using a pre-existing token

If you already have an access token (e.g. from a different auth flow), pass it directly:

```ts
const privara = new Privara({
    accessToken: 'eyJ...',
});
```

## Resources

All API resources follow a consistent pattern:

```ts
await privara.invoices.create({...});    // POST
await privara.invoices.get('inv_123');      // GET by ID
await privara.invoices.list({limit: 10}); // GET list
```

### Invoices

```ts
const invoice = await privara.invoices.create({
    from: 'alice@example.com',
    due_date: '2025-12-31',
    reference: 'Order #1234',
    amount: 100,
    currency: {type: 'crypto', code: 'USDC'},
    wallet_id: 'wallet_uuid',
});

// Get invoice (public, no auth required)
const inv = await privara.invoices.get(invoice.public_id);

// List with filters
const page = await privara.invoices.list({
    limit: 20,
    status: 'paid',
    sort_order: 'desc',
});
```

### Withdrawals

```ts
const withdrawal = await privara.withdrawals.create({
    invoice_ids: [1, 2, 3],
    destination_chain: 'BASE',
    recipient_address: '0x...',
    wallet_id: 'wallet_uuid',
});

// After redeem completes, initiate bridge
const bridge = await privara.withdrawals.createBridgeChallenge(withdrawal.public_id);
```

### Balance

```ts
const {balance, currency, paid_invoices_count} = await privara.balance.get();
```

### Transactions

```ts
await privara.transactions.report({
    tx_hash: '0x...',
    entity_type: 'invoice',
    entity_id: 'inv_uuid',
});
```

## Blockchain (on-chain invoices)

The SDK provides a separate entry point for on-chain invoice operations via ZeroDev account abstraction. See the full guide: **[docs/blockchain.md](docs/blockchain.md)**

Quick start:

```ts
import {Privara} from '@privara/sdk';
import {PrivaraBlockchain} from '@privara/sdk/blockchain';

const privara = new Privara({clientId: 'pvr_...', clientSecret: 'pvrs_...'});
const blockchain = new PrivaraBlockchain(privara, {serializedSessionKey: '...'});

const result = await blockchain.invoices.createAndSubmit({
    from: 'alice@example.com',
    due_date: '2025-12-31',
    reference: 'Order #1234',
    amount: 100,
    currency: {type: 'crypto', code: 'USDC'},
});
```

Requires additional peer dependencies: `viem`, `@zerodev/sdk`, `@zerodev/permissions`.

## Auto-pagination

List endpoints that return paginated data support automatic iteration via `listAutoPaginate()`. This returns an
`AsyncIterable` that fetches pages on demand:

```ts
for await (const invoice of privara.invoices.listAutoPaginate({status: 'paid'})) {
    console.log(invoice.public_id, invoice.amount);
}
```

Invoices use offset-based pagination, withdrawals use cursor-based — the SDK handles both transparently.

To collect all results into an array:

```ts
import {toArray} from '@privara/sdk';

const allInvoices = await toArray(privara.invoices.listAutoPaginate());
const allWithdrawals = await toArray(privara.withdrawals.listAutoPaginate());
```

## Error handling

All API errors extend `PrivaraApiError` and follow [RFC 7807](https://datatracker.ietf.org/doc/html/rfc7807) Problem
JSON:

```ts
import {Privara, PrivaraApiError, PrivaraValidationError} from '@privara/sdk';

try {
    await privara.invoices.create({ /* ... */});
} catch (error) {
    if (error instanceof PrivaraValidationError) {
        // 422 — check field-level errors
        console.log(error.invalidParams);
        // [{ name: 'amount', reason: 'must be positive' }]
    } else if (error instanceof PrivaraApiError) {
        console.log(error.status);  // HTTP status
        console.log(error.title);   // Short description
        console.log(error.detail);  // Detailed message
        console.log(error.type);    // Error type URI
    }
}
```

### Error types

| Class                        | Status | When                           |
|------------------------------|--------|--------------------------------|
| `PrivaraAuthenticationError` | 401    | Invalid or expired credentials |
| `PrivaraNotFoundError`       | 404    | Resource doesn't exist         |
| `PrivaraConflictError`       | 409    | Idempotency conflict           |
| `PrivaraValidationError`     | 422    | Invalid request parameters     |
| `PrivaraRateLimitError`      | 429    | Too many requests              |
| `PrivaraConnectionError`     | —      | Network failure or timeout     |

`PrivaraRateLimitError` exposes `retryAfter` (seconds) from the `Retry-After` header when available.

## Retries

The SDK automatically retries failed requests with exponential backoff and jitter:

- **Retryable:** 429, 500, 502, 503, 504, and network errors
- **Default:** 3 retries, 500ms initial delay, 8s max delay
- **429 responses** respect the `Retry-After` header

```ts
const privara = new Privara({
    clientId: 'pvr_...',
    clientSecret: 'pvrs_...',
    retry: {
        maxRetries: 5,
        initialDelayMs: 1000,
        maxDelayMs: 16000,
    },
});
```

Set `maxRetries: 0` to disable retries.

## Idempotency

`POST` endpoints that create resources (`invoices.create`, `withdrawals.create`) automatically generate an
`X-Idempotency-Key` header (UUID v4). This ensures safe retries — the server returns the same response for duplicate
requests.

To use your own key:

```ts
await privara.invoices.create(
    { /* params */},
    {idempotencyKey: 'my-unique-key'},
);
```

## Timeouts

Default timeout is 30 seconds. Configure globally or per-request:

```ts
// Global
const privara = new Privara({
    clientId: 'pvr_...',
    clientSecret: 'pvrs_...',
    timeout: 10_000, // 10s
});

// Per-request via AbortSignal
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

await privara.balance.get({signal: controller.signal});
```

## Interceptors

Add request or response interceptors for logging, tracing, or custom headers:

```ts
privara.addRequestInterceptor((req) => {
    console.log(`${req.method} ${req.path}`);
    return req;
});

privara.addResponseInterceptor((res) => {
    console.log(`${res.status} ${res.statusText}`);
    return res;
});
```

## TypeScript

The SDK is written in TypeScript and exports all request/response types:

```ts
import type {
    Invoice,
    CreateInvoiceParams,
    Withdrawal,
    Balance,
    OffsetPage,
    CursorPage,
} from '@privara/sdk';
```

All types use `snake_case` matching the wire format — no runtime transformation.

## Configuration reference

| Option                 | Type     | Default                  | Description                      |
|------------------------|----------|--------------------------|----------------------------------|
| `clientId`             | `string` | —                        | OAuth client ID (`pvr_...`)      |
| `clientSecret`         | `string` | —                        | OAuth client secret (`pvrs_...`) |
| `accessToken`          | `string` | —                        | Pre-existing Bearer token        |
| `baseUrl`              | `string` | `https://api.privara.io` | API base URL                     |
| `timeout`              | `number` | `30000`                  | Request timeout in ms            |
| `retry.maxRetries`     | `number` | `3`                      | Max retry attempts               |
| `retry.initialDelayMs` | `number` | `500`                    | Initial retry delay              |
| `retry.maxDelayMs`     | `number` | `8000`                   | Max retry delay                  |

Provide either `clientId`/`clientSecret` (recommended) or `accessToken`.
