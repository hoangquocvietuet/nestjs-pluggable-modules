import { Provider, Type } from '@nestjs/common';
import { AffiliateFeature } from '../core/interfaces/feature.interface';
import { ExpirationService } from './expiration.service';
import { ExpirationRepository } from './interfaces/expiration-repository.interface';

export interface ExpirationFeatureOptions {
  adapter: Type<ExpirationRepository>;
}

/**
 * Expiration feature for code time limits and usage limits.
 * Import this only if you need code expiry or max usage constraints.
 *
 * @example
 * ```typescript
 * import { AffiliateModule } from '@nestjs-pluggable/affiliate';
 * import { ExpirationFeature } from '@nestjs-pluggable/affiliate/expiration';
 *
 * AffiliateModule.register({
 *   adapter: MyAdapter,
 *   features: [
 *     ExpirationFeature.configure({
 *       adapter: MyExpirationAdapter,
 *     }),
 *   ],
 * })
 * ```
 */
export class ExpirationFeature implements AffiliateFeature {
  readonly name = 'expiration';

  private constructor(private readonly options: ExpirationFeatureOptions) {}

  static configure(options: ExpirationFeatureOptions): ExpirationFeature {
    return new ExpirationFeature(options);
  }

  getProviders(): Provider[] {
    return [
      {
        provide: ExpirationRepository,
        useClass: this.options.adapter,
      },
      ExpirationService,
    ];
  }

  getExports(): Type[] {
    return [ExpirationService];
  }
}
