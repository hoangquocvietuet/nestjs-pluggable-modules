import { Module, DynamicModule, Provider, Type } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { AffiliateRepository } from './interfaces/affiliate-repository.interface';

export interface AffiliateModuleOptions {
  /**
   * The adapter class that implements AffiliateRepository
   */
  adapter: Type<AffiliateRepository>;
}

export interface AffiliateModuleAsyncOptions {
  /**
   * Imports needed for the factory function
   */
  imports?: any[];
  /**
   * Factory function that returns the adapter class
   */
  useFactory: (
    ...args: any[]
  ) => Type<AffiliateRepository> | Promise<Type<AffiliateRepository>>;
  /**
   * Dependencies to inject into the factory function
   */
  inject?: any[];
}

@Module({})
export class AffiliateModule {
  /**
   * Register the affiliate module with a synchronous adapter
   *
   * @example
   * ```typescript
   * AffiliateModule.register({
   *   adapter: PrismaAffiliateAdapter,
   * })
   * ```
   */
  static register(options: AffiliateModuleOptions): DynamicModule {
    const adapterProvider: Provider = {
      provide: AffiliateRepository,
      useClass: options.adapter,
    };

    return {
      module: AffiliateModule,
      providers: [adapterProvider, AffiliateService],
      exports: [AffiliateService, AffiliateRepository],
    };
  }

  /**
   * Register the affiliate module with an async configuration
   *
   * @example
   * ```typescript
   * AffiliateModule.registerAsync({
   *   imports: [ConfigModule],
   *   useFactory: (config: ConfigService) => {
   *     return config.get('USE_PRISMA')
   *       ? PrismaAffiliateAdapter
   *       : TypeOrmAffiliateAdapter;
   *   },
   *   inject: [ConfigService],
   * })
   * ```
   */
  static registerAsync(options: AffiliateModuleAsyncOptions): DynamicModule {
    const adapterProvider: Provider = {
      provide: AffiliateRepository,
      useFactory: async (...args: any[]) => {
        const AdapterClass = await options.useFactory(...args);
        return new AdapterClass();
      },
      inject: options.inject || [],
    };

    return {
      module: AffiliateModule,
      imports: options.imports || [],
      providers: [adapterProvider, AffiliateService],
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
