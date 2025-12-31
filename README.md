# NestJS Pluggable Modules

[![CI](https://github.com/hoangquocvietuet/nestjs-pluggable-module/actions/workflows/ci.yml/badge.svg)](https://github.com/hoangquocvietuet/nestjs-pluggable-module/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/hoangquocvietuet/nestjs-pluggable-module/branch/main/graph/badge.svg)](https://codecov.io/gh/hoangquocvietuet/nestjs-pluggable-module)

A monorepo of database-agnostic NestJS modules built with **Hexagonal Architecture**.

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@nestjs-pluggable/affiliate](./packages/affiliate) | ![npm](https://img.shields.io/npm/v/@nestjs-pluggable/affiliate) | Referral codes, tracking & commissions |

## Philosophy

Most NestJS libraries force a specific ORM. We don't.

```
┌──────────────────┐     ┌─────────────────────┐
│  Our Module      │     │  Your Adapter       │
│                  │     │                     │
│  Service ──────────────▶ Abstract Repository │
│  (business logic)│     │         │           │
└──────────────────┘     │         ▼           │
                         │  Prisma/TypeORM/... │
                         └─────────────────────┘
```

- **Zero database dependencies** - You choose the database
- **Plug and play** - Implement one interface, done
- **Future-proof** - New database = new adapter, no library changes

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test

# Build specific package
pnpm --filter @nestjs-pluggable/affiliate build
```

## License

MIT
