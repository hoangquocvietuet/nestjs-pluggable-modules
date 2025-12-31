import { Injectable } from '@nestjs/common';
import { MultiLevelFeature } from './multi-level.feature';
import { MultiLevelRepository } from './interfaces/multi-level-repository.interface';
import { MultiLevelService, MULTI_LEVEL_OPTIONS } from './multi-level.service';

@Injectable()
class MockMultiLevelAdapter implements MultiLevelRepository {
  async setReferrer() {}
  async getReferralChain() {
    return [];
  }
  async getDirectReferrals() {
    return [];
  }
  async addTieredCommission() {}
}

describe('MultiLevelFeature', () => {
  const defaultOptions = {
    adapter: MockMultiLevelAdapter,
    maxLevels: 3,
    tiers: [{ level: 1, rate: 0.1 }],
  };

  describe('configure', () => {
    it('should create feature instance with options', () => {
      const feature = MultiLevelFeature.configure(defaultOptions);

      expect(feature).toBeInstanceOf(MultiLevelFeature);
      expect(feature.name).toBe('multi-level');
    });
  });

  describe('getProviders', () => {
    it('should return required providers', () => {
      const feature = MultiLevelFeature.configure(defaultOptions);
      const providers = feature.getProviders();

      expect(providers).toHaveLength(3);

      const repositoryProvider = providers.find(
        (p: any) => p.provide === MultiLevelRepository,
      );
      expect(repositoryProvider).toBeDefined();
      expect((repositoryProvider as any).useClass).toBe(MockMultiLevelAdapter);

      const optionsProvider = providers.find(
        (p: any) => p.provide === MULTI_LEVEL_OPTIONS,
      );
      expect(optionsProvider).toBeDefined();
      expect((optionsProvider as any).useValue).toEqual(defaultOptions);

      expect(providers).toContain(MultiLevelService);
    });
  });

  describe('getExports', () => {
    it('should return MultiLevelService', () => {
      const feature = MultiLevelFeature.configure(defaultOptions);
      const exports = feature.getExports();

      expect(exports).toContain(MultiLevelService);
    });
  });
});
