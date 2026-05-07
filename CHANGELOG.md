# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-05-07

### Added

- `BlockchainConfig.signer?: Account` — alternative signer mode for `PrivaraBlockchain` that sends a regular EOA transaction via viem `WalletClient` instead of a ZeroDev UserOperation. Designed for backend-caller patterns where the backend (e.g. KMS-backed account) creates invoices and pays gas itself, while the user's main wallet is passed as the encrypted owner via `wallet_id`.
- `createWalletClientFromSigner(config)` factory exported from `@privara/sdk/blockchain`.

### Changed

- `BlockchainConfig.serializedSessionKey` is now optional. The constructor of `PrivaraBlockchain` accepts exactly one of `signer` or `serializedSessionKey` and throws on conflict or when neither is provided.
- `PrivaraBlockchain.sendInvoiceTransaction` now branches on the configured mode. Calldata encoding and `Privara.transactions.report(...)` reporting are unchanged across modes.

### Backwards compatibility

- Legacy `serializedSessionKey` flow (ZeroDev kernel + paymaster) is unchanged. Existing consumers passing `{ serializedSessionKey }` continue to work without changes.

## [0.1.0] - 2026-03-07

### Added

- OAuth M2M authentication with auto-refresh (client_credentials grant)
- Invoice management (create, get, list with auto-pagination)
- Withdrawal management (create, get, list with cursor-based auto-pagination)
- Balance retrieval
- Transaction reporting
- Blockchain module for on-chain invoice operations via ZeroDev smart accounts
- Error hierarchy with typed exceptions (validation, auth, rate-limit, not-found, conflict)
- Exponential backoff retry with jitter for 429/5xx
- Request/response interceptors
- Idempotency key support
- Dual ESM/CJS build with TypeScript declarations

[Unreleased]: https://github.com/PrivaraXYZ/privara-sdk/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/PrivaraXYZ/privara-sdk/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/PrivaraXYZ/privara-sdk/releases/tag/v0.1.0
