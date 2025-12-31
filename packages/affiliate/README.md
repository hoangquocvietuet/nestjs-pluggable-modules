# @nestjs-pluggable/affiliate

Database-agnostic affiliate/referral module for NestJS. Use with any database - Prisma, TypeORM, Mongoose, or your own.

## Installation

```bash
pnpm add @nestjs-pluggable/affiliate
# or
npm install @nestjs-pluggable/affiliate
```

## Usage

### 1. Create an adapter

Implement `AffiliateRepository` with your database:

```typescript
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
    return this.prisma.user.findUnique({ where: { referralCode: code } });
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
import { Module } from '@nestjs/common';
import { AffiliateModule } from '@nestjs-pluggable/affiliate';
import { PrismaAffiliateAdapter } from './prisma-affiliate.adapter';

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
import { AffiliateService } from '@nestjs-pluggable/affiliate';

@Injectable()
export class PaymentService {
  constructor(private affiliateService: AffiliateService) {}

  async handlePayment(referralCode: string, amount: number) {
    const result = await this.affiliateService.processReferral(referralCode, amount * 0.1);
    if (result.success) {
      console.log(`Commission added to ${result.referrerId}`);
    }
  }
}
```

## API

### AffiliateService

| Method | Description |
|--------|-------------|
| `generateReferralCode(userId, config?)` | Generate and save a referral code |
| `generateCodes(config)` | Generate multiple codes (doesn't save) |
| `createReferralCode(userId, code)` | Save a custom referral code |
| `processReferral(code, amount)` | Find referrer and add commission |
| `getReferrer(code)` | Get user by referral code |

### Code Generation Config

```typescript
import { Charset, charset } from '@nestjs-pluggable/affiliate';

await affiliateService.generateReferralCode(userId, {
  length: 8,                              // Default: 8
  prefix: 'REF-',                         // Optional prefix
  postfix: '-2024',                       // Optional postfix
  pattern: 'PROMO-####-####',             // # = random char
  charset: charset(Charset.ALPHANUMERIC), // NUMBERS | ALPHABETIC | ALPHANUMERIC
});
```

### Module Registration

```typescript
// Basic
AffiliateModule.register({ adapter: YourAdapter })

// Global
AffiliateModule.forRoot({ adapter: YourAdapter })

// Async
AffiliateModule.registerAsync({
  imports: [ConfigModule],
  useFactory: (config) => ({ adapter: config.get('ADAPTER') }),
  inject: [ConfigService],
})
```

## License

MIT
