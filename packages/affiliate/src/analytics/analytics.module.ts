import { Module, DynamicModule, Provider, Type } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './interfaces/analytics-repository.interface';

export interface AnalyticsModuleOptions {
  adapter: Type<AnalyticsRepository>;
}

export interface AnalyticsModuleAsyncOptions {
  imports?: any[];
  useFactory: (
    ...args: any[]
  ) => AnalyticsModuleOptions | Promise<AnalyticsModuleOptions>;
  inject?: any[];
}

@Module({})
export class AnalyticsModule {
  static register(options: AnalyticsModuleOptions): DynamicModule {
    const adapterProvider: Provider = {
      provide: AnalyticsRepository,
      useClass: options.adapter,
    };

    return {
      module: AnalyticsModule,
      providers: [adapterProvider, AnalyticsService],
      exports: [AnalyticsService, AnalyticsRepository],
    };
  }

  static registerAsync(options: AnalyticsModuleAsyncOptions): DynamicModule {
    const asyncProviders: Provider[] = [
      {
        provide: AnalyticsRepository,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory(...args);
          return new config.adapter();
        },
        inject: options.inject || [],
      },
    ];

    return {
      module: AnalyticsModule,
      imports: options.imports || [],
      providers: [...asyncProviders, AnalyticsService],
      exports: [AnalyticsService, AnalyticsRepository],
    };
  }

  static forRoot(options: AnalyticsModuleOptions): DynamicModule {
    return {
      ...this.register(options),
      global: true,
    };
  }

  static forRootAsync(options: AnalyticsModuleAsyncOptions): DynamicModule {
    return {
      ...this.registerAsync(options),
      global: true,
    };
  }
}
