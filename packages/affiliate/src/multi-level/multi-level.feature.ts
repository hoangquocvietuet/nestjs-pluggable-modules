import { Provider, Type } from '@nestjs/common';
import { AffiliateFeature } from '../core/interfaces/feature.interface';
import {
  MultiLevelService,
  MultiLevelOptions,
  MULTI_LEVEL_OPTIONS,
} from './multi-level.service';
import { MultiLevelRepository } from './interfaces/multi-level-repository.interface';

export interface MultiLevelFeatureOptions extends MultiLevelOptions {
  adapter: Type<MultiLevelRepository>;
}

/**
 * Multi-level referral feature.
 * Import this only if you need MLM-style tiered commissions.
 *
 * @example
 * ```typescript
 * import { AffiliateModule } from '@nestjs-pluggable/affiliate';
 * import { MultiLevelFeature } from '@nestjs-pluggable/affiliate/multi-level';
 *
 * AffiliateModule.register({
 *   adapter: MyAdapter,
 *   features: [
 *     MultiLevelFeature.configure({
 *       adapter: MyMultiLevelAdapter,
 *       tiers: [
 *         { level: 1, rate: 0.1 },
 *         { level: 2, rate: 0.05 },
 *       ],
 *     }),
 *   ],
 * })
 * ```
 */
export class MultiLevelFeature implements AffiliateFeature {
  readonly name = 'multi-level';

  private constructor(private readonly options: MultiLevelFeatureOptions) {}

  static configure(options: MultiLevelFeatureOptions): MultiLevelFeature {
    return new MultiLevelFeature(options);
  }

  getProviders(): Provider[] {
    return [
      {
        provide: MultiLevelRepository,
        useClass: this.options.adapter,
      },
      {
        provide: MULTI_LEVEL_OPTIONS,
        useValue: this.options,
      },
      MultiLevelService,
    ];
  }

  getExports(): Type[] {
    return [MultiLevelService];
  }
}
