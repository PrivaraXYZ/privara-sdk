# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/PrivaraXYZ/privara-sdk/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/PrivaraXYZ/privara-sdk/releases/tag/v0.1.0
