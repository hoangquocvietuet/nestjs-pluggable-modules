import { Module, DynamicModule, Provider, Type } from '@nestjs/common';
import {
  MultiLevelService,
  MultiLevelOptions,
  MULTI_LEVEL_OPTIONS,
} from './multi-level.service';
import { MultiLevelRepository } from './interfaces/multi-level-repository.interface';

export interface MultiLevelModuleOptions extends MultiLevelOptions {
  adapter: Type<MultiLevelRepository>;
}

export interface MultiLevelModuleAsyncOptions {
  imports?: any[];
  useFactory: (
    ...args: any[]
  ) => MultiLevelModuleOptions | Promise<MultiLevelModuleOptions>;
  inject?: any[];
}

@Module({})
export class MultiLevelModule {
  static register(options: MultiLevelModuleOptions): DynamicModule {
    const adapterProvider: Provider = {
      provide: MultiLevelRepository,
      useClass: options.adapter,
    };

    const optionsProvider: Provider = {
      provide: MULTI_LEVEL_OPTIONS,
      useValue: options,
    };

    return {
      module: MultiLevelModule,
      providers: [adapterProvider, optionsProvider, MultiLevelService],
      exports: [MultiLevelService, MultiLevelRepository],
    };
  }

  static registerAsync(options: MultiLevelModuleAsyncOptions): DynamicModule {
    const asyncProviders: Provider[] = [
      {
        provide: MULTI_LEVEL_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      {
        provide: MultiLevelRepository,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory(...args);
          return new config.adapter();
        },
        inject: options.inject || [],
      },
    ];

    return {
      module: MultiLevelModule,
      imports: options.imports || [],
      providers: [...asyncProviders, MultiLevelService],
      exports: [MultiLevelService, MultiLevelRepository],
    };
  }

  static forRoot(options: MultiLevelModuleOptions): DynamicModule {
    return {
      ...this.register(options),
      global: true,
    };
  }

  static forRootAsync(options: MultiLevelModuleAsyncOptions): DynamicModule {
    return {
      ...this.registerAsync(options),
      global: true,
    };
  }
}
