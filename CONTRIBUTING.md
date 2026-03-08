# Contributing

Thank you for your interest in contributing!

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
git clone https://github.com/PrivaraXYZ/privara-sdk.git
cd privara-sdk
pnpm install
```

### Running Tests

```bash
pnpm test              # Unit tests
pnpm test:coverage     # Tests with coverage
pnpm typecheck         # Type checking
pnpm build             # Build ESM + CJS
```

## Code Style

- [Biome](https://biomejs.dev/) for linting and formatting
- Minimal comments — code should be self-documenting
- Use `snake_case` for API types (matches wire format)
- Prefer explicit types over `any`

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `test:` — Tests
- `refactor:` — Code refactoring
- `chore:` — Build/config changes

## Pull Request Process

1. Fork the repository
2. Create feature branch (`git checkout -b feat/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feat/amazing-feature`)
5. Open Pull Request

### PR Checklist

- [ ] Tests pass (`pnpm test`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Type check passes (`pnpm typecheck`)
- [ ] No new warnings
- [ ] Documentation updated if needed
- [ ] Follows existing code patterns

## Questions?

Open an issue or start a discussion.
