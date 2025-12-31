import { Provider, Type } from '@nestjs/common';
import { AffiliateFeature } from '../core/interfaces/feature.interface';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './interfaces/analytics-repository.interface';

export interface AnalyticsFeatureOptions {
  adapter: Type<AnalyticsRepository>;
}

/**
 * Analytics feature for tracking referral events.
 * Import this only if you need click/conversion tracking and stats.
 *
 * @example
 * ```typescript
 * import { AffiliateModule } from '@nestjs-pluggable/affiliate';
 * import { AnalyticsFeature } from '@nestjs-pluggable/affiliate/analytics';
 *
 * AffiliateModule.register({
 *   adapter: MyAdapter,
 *   features: [
 *     AnalyticsFeature.configure({
 *       adapter: MyAnalyticsAdapter,
 *     }),
 *   ],
 * })
 * ```
 */
export class AnalyticsFeature implements AffiliateFeature {
  readonly name = 'analytics';

  private constructor(private readonly options: AnalyticsFeatureOptions) {}

  static configure(options: AnalyticsFeatureOptions): AnalyticsFeature {
    return new AnalyticsFeature(options);
  }

  getProviders(): Provider[] {
    return [
      {
        provide: AnalyticsRepository,
        useClass: this.options.adapter,
      },
      AnalyticsService,
    ];
  }

  getExports(): Type[] {
    return [AnalyticsService];
  }
}
