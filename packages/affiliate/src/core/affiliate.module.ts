import { Module, DynamicModule, Provider, Type } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { AffiliateRepository } from './interfaces/affiliate-repository.interface';
import {
  AffiliateFeature,
  AFFILIATE_FEATURES,
} from './interfaces/feature.interface';

export interface AffiliateModuleOptions {
  /**
   * The adapter class that implements AffiliateRepository
   */
  adapter: Type<AffiliateRepository>;

  /**
   * Optional features to enable.
   * Import only the features you need - unused features won't be bundled.
   *
   * @example
   * ```typescript
   * import { MultiLevelFeature } from '@nestjs-pluggable/affiliate/multi-level';
   * import { ExpirationFeature } from '@nestjs-pluggable/affiliate/expiration';
   *
   * AffiliateModule.register({
   *   adapter: MyAdapter,
   *   features: [
   *     MultiLevelFeature.configure({ adapter: MyMultiLevelAdapter, tiers: [...] }),
   *     ExpirationFeature.configure({ adapter: MyExpirationAdapter }),
   *   ],
   * })
   * ```
   */
  features?: AffiliateFeature[];
}

export interface AffiliateModuleAsyncOptions {
  imports?: any[];
  useFactory: (
    ...args: any[]
  ) => AffiliateModuleOptions | Promise<AffiliateModuleOptions>;
  inject?: any[];
}

@Module({})
export class AffiliateModule {
  /**
   * Register the affiliate module with optional features
   */
  static register(options: AffiliateModuleOptions): DynamicModule {
    const { adapter, features = [] } = options;

    // Core providers
    const coreProviders: Provider[] = [
      {
        provide: AffiliateRepository,
        useClass: adapter,
      },
      AffiliateService,
      {
        provide: AFFILIATE_FEATURES,
        useValue: features.map((f) => f.name),
      },
    ];

    // Collect feature providers
    const featureProviders = features.flatMap((feature) =>
      feature.getProviders(),
    );

    // Collect feature exports
    const featureExports = features.flatMap((feature) => feature.getExports());

    return {
      module: AffiliateModule,
      providers: [...coreProviders, ...featureProviders],
      exports: [AffiliateService, AffiliateRepository, ...featureExports],
    };
  }

  /**
   * Register the affiliate module with async configuration
   */
  static registerAsync(options: AffiliateModuleAsyncOptions): DynamicModule {
    const asyncProviders: Provider[] = [
      {
        provide: 'AFFILIATE_MODULE_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      {
        provide: AffiliateRepository,
        useFactory: async (moduleOptions: AffiliateModuleOptions) => {
          return new moduleOptions.adapter();
        },
        inject: ['AFFILIATE_MODULE_OPTIONS'],
      },
      {
        provide: AFFILIATE_FEATURES,
        useFactory: (moduleOptions: AffiliateModuleOptions) => {
          return (moduleOptions.features || []).map((f) => f.name);
        },
        inject: ['AFFILIATE_MODULE_OPTIONS'],
      },
      AffiliateService,
    ];

    return {
      module: AffiliateModule,
      imports: options.imports || [],
      providers: asyncProviders,
      exports: [AffiliateService, AffiliateRepository],
    };
  }

  /**
   * Register the affiliate module globally
   */
  static forRoot(options: AffiliateModuleOptions): DynamicModule {
    return {
      ...this.register(options),
      global: true,
    };
  }

  /**
   * Register the affiliate module globally with async configuration
   */
  static forRootAsync(options: AffiliateModuleAsyncOptions): DynamicModule {
    return {
      ...this.registerAsync(options),
      global: true,
    };
  }
}
