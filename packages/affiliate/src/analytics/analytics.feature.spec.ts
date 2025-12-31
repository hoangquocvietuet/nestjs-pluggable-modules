import { Injectable } from '@nestjs/common';
import { AnalyticsFeature } from './analytics.feature';
import { AnalyticsRepository } from './interfaces/analytics-repository.interface';
import { AnalyticsService } from './analytics.service';

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

describe('AnalyticsFeature', () => {
  const defaultOptions = {
    adapter: MockAnalyticsAdapter,
  };

  describe('configure', () => {
    it('should create feature instance with options', () => {
      const feature = AnalyticsFeature.configure(defaultOptions);

      expect(feature).toBeInstanceOf(AnalyticsFeature);
      expect(feature.name).toBe('analytics');
    });
  });

  describe('getProviders', () => {
    it('should return required providers', () => {
      const feature = AnalyticsFeature.configure(defaultOptions);
      const providers = feature.getProviders();

      expect(providers).toHaveLength(2);

      const repositoryProvider = providers.find(
        (p: any) => p.provide === AnalyticsRepository,
      );
      expect(repositoryProvider).toBeDefined();
      expect((repositoryProvider as any).useClass).toBe(MockAnalyticsAdapter);

      expect(providers).toContain(AnalyticsService);
    });
  });

  describe('getExports', () => {
    it('should return AnalyticsService', () => {
      const feature = AnalyticsFeature.configure(defaultOptions);
      const exports = feature.getExports();

      expect(exports).toContain(AnalyticsService);
    });
  });
});
