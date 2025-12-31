import { Module, DynamicModule, Provider, Type } from '@nestjs/common';
import { ExpirationService } from './expiration.service';
import { ExpirationRepository } from './interfaces/expiration-repository.interface';

export interface ExpirationModuleOptions {
  adapter: Type<ExpirationRepository>;
}

export interface ExpirationModuleAsyncOptions {
  imports?: any[];
  useFactory: (
    ...args: any[]
  ) => ExpirationModuleOptions | Promise<ExpirationModuleOptions>;
  inject?: any[];
}

@Module({})
export class ExpirationModule {
  static register(options: ExpirationModuleOptions): DynamicModule {
    const adapterProvider: Provider = {
      provide: ExpirationRepository,
      useClass: options.adapter,
    };

    return {
      module: ExpirationModule,
      providers: [adapterProvider, ExpirationService],
      exports: [ExpirationService, ExpirationRepository],
    };
  }

  static registerAsync(options: ExpirationModuleAsyncOptions): DynamicModule {
    const asyncProviders: Provider[] = [
      {
        provide: ExpirationRepository,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory(...args);
          return new config.adapter();
        },
        inject: options.inject || [],
      },
    ];

    return {
      module: ExpirationModule,
      imports: options.imports || [],
      providers: [...asyncProviders, ExpirationService],
      exports: [ExpirationService, ExpirationRepository],
    };
  }

  static forRoot(options: ExpirationModuleOptions): DynamicModule {
    return {
      ...this.register(options),
      global: true,
    };
  }

  static forRootAsync(options: ExpirationModuleAsyncOptions): DynamicModule {
    return {
      ...this.registerAsync(options),
      global: true,
    };
  }
}
