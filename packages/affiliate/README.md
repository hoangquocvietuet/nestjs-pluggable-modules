# @nestjs-pluggable/affiliate

Database-agnostic affiliate/referral module for NestJS with **Rust-like feature composition**.

## Key Concept

**Import only what you need.** Unused features are NOT included in your bundle.

```typescript
// Core only - minimal bundle
import { AffiliateModule } from '@nestjs-pluggable/affiliate';

// Add features - each import adds only that feature's code
import { MultiLevelFeature } from '@nestjs-pluggable/affiliate/multi-level';
import { ExpirationFeature } from '@nestjs-pluggable/affiliate/expiration';
```

## Available Features

| Feature | Import | Description |
|---------|--------|-------------|
| Core | `@nestjs-pluggable/affiliate` | Referral codes & commissions |
| multi-level | `@nestjs-pluggable/affiliate/multi-level` | MLM tiered commissions |
| analytics | `@nestjs-pluggable/affiliate/analytics` | Click/conversion tracking |
| expiration | `@nestjs-pluggable/affiliate/expiration` | Code expiry & usage limits |

## Installation

```bash
pnpm add @nestjs-pluggable/affiliate
```

## Quick Start

### Core Only

```typescript
import { AffiliateModule, AffiliateRepository } from '@nestjs-pluggable/affiliate';

// 1. Create adapter
@Injectable()
class MyAdapter implements AffiliateRepository {
  async createReferralCode(userId: string, code: string) { /* ... */ }
  async findUserByCode(code: string) { /* ... */ }
  async addCommission(userId: string, amount: number) { /* ... */ }
}

// 2. Register
@Module({
  imports: [
    AffiliateModule.register({
      adapter: MyAdapter,
    }),
  ],
  providers: [MyAdapter],
})
export class AppModule {}

// 3. Use
@Injectable()
class MyService {
  constructor(private affiliate: AffiliateService) {}

  async createCode(userId: string) {
    return this.affiliate.generateReferralCode(userId);
  }
}
```

### With Features

```typescript
import { AffiliateModule } from '@nestjs-pluggable/affiliate';
import { MultiLevelFeature } from '@nestjs-pluggable/affiliate/multi-level';
import { ExpirationFeature } from '@nestjs-pluggable/affiliate/expiration';

@Module({
  imports: [
    AffiliateModule.register({
      adapter: MyAdapter,
      features: [
        // Each feature requires its own adapter
        MultiLevelFeature.configure({
          adapter: MyMultiLevelAdapter,
          maxLevels: 3,
          tiers: [
            { level: 1, rate: 0.10 },
            { level: 2, rate: 0.05 },
            { level: 3, rate: 0.02 },
          ],
        }),
        ExpirationFeature.configure({
          adapter: MyExpirationAdapter,
        }),
      ],
    }),
  ],
})
export class AppModule {}
```

---

## Feature: multi-level

MLM-style tiered referral commissions.

```typescript
import { MultiLevelFeature, MultiLevelService, MultiLevelRepository } from '@nestjs-pluggable/affiliate/multi-level';

// Adapter interface
@Injectable()
class MyMultiLevelAdapter implements MultiLevelRepository {
  async setReferrer(userId: string, referrerId: string) { /* ... */ }
  async getReferralChain(userId: string, maxLevels: number) { /* ... */ }
  async getDirectReferrals(userId: string) { /* ... */ }
  async addTieredCommission(userId: string, amount: number, level: number, sourceUserId: string) { /* ... */ }
}

// Usage
@Injectable()
class MyService {
  constructor(private multiLevel: MultiLevelService) {}

  async process(userId: string, amount: number) {
    // Returns commissions for all levels
    const commissions = await this.multiLevel.processMultiLevelCommission(userId, amount);
    // => [{ userId: "ref-1", level: 1, amount: 10 }, ...]
  }
}
```

---

## Feature: analytics

Track clicks, signups, conversions.

```typescript
import { AnalyticsFeature, AnalyticsService, AnalyticsRepository } from '@nestjs-pluggable/affiliate/analytics';

// Adapter interface
@Injectable()
class MyAnalyticsAdapter implements AnalyticsRepository {
  async trackEvent(code: string, type: 'click' | 'signup' | 'conversion', metadata?: Record<string, unknown>) { /* ... */ }
  async getStatsByCode(code: string, dateRange?: DateRange) { /* ... */ }
  async getStatsByUser(userId: string, dateRange?: DateRange) { /* ... */ }
  async getTopCodes(limit: number, metric: string, dateRange?: DateRange) { /* ... */ }
  async getEvents(code: string, type?: string, dateRange?: DateRange) { /* ... */ }
}

// Usage
@Injectable()
class MyService {
  constructor(private analytics: AnalyticsService) {}

  async trackClick(code: string, source: string) {
    await this.analytics.trackClick(code, { source });
  }

  async getStats(code: string) {
    return this.analytics.getCodeStats(code);
    // => { code, clicks: 100, signups: 50, conversions: 10, totalCommission: 500 }
  }
}
```

---

## Feature: expiration

Code expiry and usage limits.

```typescript
import { ExpirationFeature, ExpirationService, ExpirationRepository } from '@nestjs-pluggable/affiliate/expiration';

// Adapter interface - simple CRUD operations
@Injectable()
class MyExpirationAdapter implements ExpirationRepository {
  async save(code: string, constraints: CreateCodeConstraints) { /* ... */ }
  async findByCode(code: string) { /* ... */ }
  async findAll() { /* ... */ }
  async update(code: string, data: UpdateCodeConstraints) { /* ... */ }
  async delete(code: string) { /* ... */ }
}

// Usage
@Injectable()
class MyService {
  constructor(private expiration: ExpirationService) {}

  async setupCode(code: string) {
    await this.expiration.setExpirationFromDuration(code, '30d');
    await this.expiration.setMaxUses(code, 100);
  }

  async useCode(code: string) {
    const result = await this.expiration.useCode(code);
    if (!result.isValid) {
      throw new Error(result.reason); // 'expired' | 'max_uses_reached' | 'inactive'
    }
    return result.uses; // Current usage count
  }
}
```

Duration formats: `30d`, `24h`, `1w`, `1M`, `1y`

---

## Standalone Modules (Alternative)

Features can also be used as standalone modules:

```typescript
import { MultiLevelModule } from '@nestjs-pluggable/affiliate/multi-level';
import { AnalyticsModule } from '@nestjs-pluggable/affiliate/analytics';

@Module({
  imports: [
    MultiLevelModule.register({
      adapter: MyMultiLevelAdapter,
      maxLevels: 3,
      tiers: [...],
    }),
    AnalyticsModule.register({
      adapter: MyAnalyticsAdapter,
    }),
  ],
})
export class AppModule {}
```

## Bundle Size

| Import | Included |
|--------|----------|
| `@nestjs-pluggable/affiliate` | Core only |
| `+ multi-level` | Core + multi-level |
| `+ analytics` | Core + analytics |
| `+ expiration` | Core + expiration |

**Unused features = zero bytes in your bundle.**

## License

MIT
