# @privara/sdk

TypeScript SDK for the Privara API. Zero runtime dependencies, Node 18+.

## Commands

```bash
pnpm install
pnpm build        # ESM + CJS + d.ts via tsup
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest
pnpm test:coverage
```

## Architecture

- **Resource pattern** (Stripe-like): `privara.invoices.create()`, `privara.withdrawals.list()`
- **OAuth M2M**: Auto-refresh via `AuthManager` (client_credentials grant)
- **Error hierarchy**: `PrivaraError` → `PrivaraApiError` → status-specific subclasses
- **Pagination**: Offset (invoices) and Cursor (withdrawals) with `listAutoPaginate()` → `AsyncIterable<T>`
- **Retry**: Exponential backoff + jitter for 429/5xx
- **Types**: snake_case matching wire format, no transformation

## Key files

- `src/client.ts` — Main `Privara` class
- `src/core/http-client.ts` — Fetch wrapper with auth, retry, interceptors
- `src/core/auth-manager.ts` — OAuth token management
- `src/resources/` — One file per API resource
- `src/types/` — Request/response types (snake_case = wire format)
