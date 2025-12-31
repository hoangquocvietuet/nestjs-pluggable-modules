import { Test } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { AnalyticsModule } from './analytics.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './interfaces/analytics-repository.interface';

@Injectable()
class MockAnalyticsAdapter implements AnalyticsRepository {
  async trackEvent() {}
  async getStatsByCode() {
    return { code: '', clicks: 0, signups: 0, conversions: 0, totalCommission: 0 };
  }
  async getStatsByUser() {
    return [];
  }
  async getTopCodes() {
    return [];
  }
  async getEvents() {
    return [];
  }
}

describe('AnalyticsModule', () => {
  const defaultOptions = {
    adapter: MockAnalyticsAdapter,
  };

  describe('register', () => {
    it('should register providers', async () => {
      const module = await Test.createTestingModule({
        imports: [AnalyticsModule.register(defaultOptions)],
      }).compile();

      const service = module.get<AnalyticsService>(AnalyticsService);
      expect(service).toBeDefined();
    });
  });

  describe('forRoot', () => {
    it('should register as global module', () => {
      const dynamicModule = AnalyticsModule.forRoot(defaultOptions);
      expect(dynamicModule.global).toBe(true);
    });
  });

  describe('registerAsync', () => {
    it('should register with async factory', async () => {
      const module = await Test.createTestingModule({
        imports: [
          AnalyticsModule.registerAsync({
            useFactory: () => defaultOptions,
          }),
        ],
      }).compile();

      const service = module.get<AnalyticsService>(AnalyticsService);
      expect(service).toBeDefined();
    });
  });

  describe('forRootAsync', () => {
    it('should register as global with async config', () => {
      const dynamicModule = AnalyticsModule.forRootAsync({
        useFactory: () => defaultOptions,
      });
      expect(dynamicModule.global).toBe(true);
    });
  });
});
