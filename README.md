# NestJS Pluggable Modules

[![CI](https://github.com/hoangquocvietuet/nestjs-pluggable-module/actions/workflows/ci.yml/badge.svg)](https://github.com/hoangquocvietuet/nestjs-pluggable-module/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/hoangquocvietuet/nestjs-pluggable-module/branch/main/graph/badge.svg)](https://codecov.io/gh/hoangquocvietuet/nestjs-pluggable-module)

Database-agnostic NestJS modules built with **Hexagonal Architecture** (Ports and Adapters pattern). Use any database you want - Prisma, TypeORM, Mongoose, or your own custom solution.

## Why?

Most NestJS libraries force you to use a specific ORM. This project takes a different approach:

- **Zero database dependencies** - Your module, your database choice
- **Plug and play** - Write a small adapter, and you're done
- **Future-proof** - New database? Just write a new adapter

## Available Modules

| Package | Description |
|---------|-------------|
| `@nestjs-pluggable/affiliate` | Referral code generation, tracking, and commission processing |

## Installation

```bash
# Using pnpm
pnpm add @nestjs-pluggable/affiliate

# Using npm
npm install @nestjs-pluggable/affiliate

# Using yarn
yarn add @nestjs-pluggable/affiliate
```

## Quick Start

### 1. Create your adapter

Implement the abstract repository with your preferred database:

```typescript
// prisma-affiliate.adapter.ts
import { Injectable } from '@nestjs/common';
import { AffiliateRepository } from '@nestjs-pluggable/affiliate';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaAffiliateAdapter implements AffiliateRepository {
  constructor(private prisma: PrismaService) {}

  async createReferralCode(userId: string, code: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });
  }

  async findUserByCode(code: string) {
    return this.prisma.user.findUnique({
      where: { referralCode: code },
    });
  }

  async addCommission(userId: string, amount: number): Promise<void> {
    await this.prisma.wallet.update({
      where: { userId },
      data: { balance: { increment: amount } },
    });
  }
}
```

### 2. Register the module

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { AffiliateModule } from '@nestjs-pluggable/affiliate';
import { PrismaAffiliateAdapter } from './adapters/prisma-affiliate.adapter';

@Module({
  imports: [
    AffiliateModule.register({
      adapter: PrismaAffiliateAdapter,
    }),
  ],
  providers: [PrismaAffiliateAdapter],
})
export class AppModule {}
```

### 3. Use the service

```typescript
import { Injectable } from '@nestjs/common';
import { AffiliateService } from '@nestjs-pluggable/affiliate';

@Injectable()
export class PaymentService {
  constructor(private affiliateService: AffiliateService) {}

  async processPayment(referralCode: string, amount: number) {
    // Process referral commission (10%)
    const result = await this.affiliateService.processReferral(
      referralCode,
      amount * 0.1,
    );

    if (result.success) {
      console.log(`Commission added to user ${result.referrerId}`);
    }
  }
}
```

## Affiliate Module API

### AffiliateService

```typescript
// Generate a referral code for a user
const code = await affiliateService.generateReferralCode(userId);
// => "A3xK9mB2"

// Generate with custom config
const code = await affiliateService.generateReferralCode(userId, {
  length: 10,
  prefix: 'REF-',
  charset: charset(Charset.ALPHANUMERIC),
});
// => "REF-A3xK9mB2Yz"

// Generate with pattern
const code = await affiliateService.generateReferralCode(userId, {
  pattern: 'PROMO-####-####',
});
// => "PROMO-A3xK-9mB2"

// Generate multiple codes (synchronous, doesn't save to DB)
const codes = affiliateService.generateCodes({ count: 100, length: 6 });

// Assign a custom code
await affiliateService.createReferralCode(userId, 'CUSTOM-CODE');

// Process a referral
const result = await affiliateService.processReferral(code, commissionAmount);
// => { success: true, referrerId: "user-123" }

// Get referrer by code
const referrer = await affiliateService.getReferrer(code);
```

### Code Generation Options

```typescript
import { Charset, charset } from '@nestjs-pluggable/affiliate';

{
  length: 8,                              // Code length (default: 8)
  count: 1,                               // Number of codes to generate
  charset: charset(Charset.ALPHANUMERIC), // Character set
  prefix: 'REF-',                         // Prefix
  postfix: '-2024',                       // Postfix
  pattern: 'PROMO-####-####',             // Pattern (# = placeholder)
}

// Available charsets
Charset.NUMBERS      // 0-9
Charset.ALPHABETIC   // a-z, A-Z
Charset.ALPHANUMERIC // 0-9, a-z, A-Z
```

## Advanced Usage

### Async Configuration

```typescript
AffiliateModule.registerAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    adapter: config.get('USE_PRISMA')
      ? PrismaAffiliateAdapter
      : TypeOrmAffiliateAdapter,
  }),
  inject: [ConfigService],
})
```

### Global Module

```typescript
AffiliateModule.forRoot({
  adapter: PrismaAffiliateAdapter,
})
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your Application                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │ AffiliateModule │    │   Your Adapter (implements) │ │
│  │                 │    │   ┌─────────────────────┐   │ │
│  │ AffiliateService│───▶│   │ AffiliateRepository │   │ │
│  │   (uses Port)   │    │   │     (abstract)      │   │ │
│  │                 │    │   └─────────────────────┘   │ │
│  └─────────────────┘    │              │              │ │
│                         │              ▼              │ │
│                         │   ┌─────────────────────┐   │ │
│                         │   │ Prisma/TypeORM/etc  │   │ │
│                         │   └─────────────────────┘   │ │
│                         └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## License

MIT
