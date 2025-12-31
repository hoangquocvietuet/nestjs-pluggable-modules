# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **pnpm monorepo** containing database-agnostic NestJS modules built using **Hexagonal Architecture** (Ports and Adapters pattern). Each module is designed as a pluggable library that users can integrate with any database by providing their own adapter.

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build a specific package
pnpm --filter @nestjs-pluggable/affiliate build

# Clean build outputs
pnpm clean
```

## Architecture

### Hexagonal Architecture Pattern

Each module follows the Ports and Adapters pattern:

1. **Port (Abstract Class)**: Defines the contract for data access operations
   - Located in `packages/<module>/src/interfaces/`
   - Example: `AffiliateRepository` abstract class

2. **Service**: Contains business logic, depends only on the abstract port
   - Receives the adapter via NestJS dependency injection
   - Never imports database-specific code

3. **Dynamic Module**: Accepts an adapter class from the consumer
   - `register()` / `forRoot()` - Synchronous registration
   - `registerAsync()` / `forRootAsync()` - Async registration with factory

### Consumer Usage Pattern

Consumers implement the abstract repository with their preferred database:

```typescript
// Consumer creates an adapter
@Injectable()
export class PrismaAffiliateAdapter implements AffiliateRepository {
  constructor(private prisma: PrismaService) {}
  // ... implement abstract methods
}

// Consumer registers the module with their adapter
AffiliateModule.register({ adapter: PrismaAffiliateAdapter })
```

## Monorepo Structure

```
packages/
  affiliate/          # Affiliate/referral module
    src/
      interfaces/     # Abstract repository contracts (ports)
      *.service.ts    # Business logic
      *.module.ts     # Dynamic module configuration
      index.ts        # Barrel exports
```

## Adding New Modules

1. Create `packages/<module-name>/` with the same structure as `affiliate`
2. Define abstract repository in `interfaces/`
3. Implement service depending only on the abstract repository
4. Create dynamic module with `register()` and `registerAsync()` methods
5. Export all public APIs via `index.ts`
