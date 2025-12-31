import { Test } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { MultiLevelModule } from './multi-level.module';
import { MultiLevelService } from './multi-level.service';
import { MultiLevelRepository } from './interfaces/multi-level-repository.interface';

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

describe('MultiLevelModule', () => {
  const defaultOptions = {
    adapter: MockMultiLevelAdapter,
    maxLevels: 3,
    tiers: [{ level: 1, rate: 0.1 }],
  };

  describe('register', () => {
    it('should register providers', async () => {
      const module = await Test.createTestingModule({
        imports: [MultiLevelModule.register(defaultOptions)],
      }).compile();

      const service = module.get<MultiLevelService>(MultiLevelService);
      expect(service).toBeDefined();
    });
  });

  describe('forRoot', () => {
    it('should register as global module', () => {
      const dynamicModule = MultiLevelModule.forRoot(defaultOptions);
      expect(dynamicModule.global).toBe(true);
    });
  });

  describe('registerAsync', () => {
    it('should register with async factory', async () => {
      const module = await Test.createTestingModule({
        imports: [
          MultiLevelModule.registerAsync({
            useFactory: () => defaultOptions,
          }),
        ],
      }).compile();

      const service = module.get<MultiLevelService>(MultiLevelService);
      expect(service).toBeDefined();
    });
  });

  describe('forRootAsync', () => {
    it('should register as global with async config', () => {
      const dynamicModule = MultiLevelModule.forRootAsync({
        useFactory: () => defaultOptions,
      });
      expect(dynamicModule.global).toBe(true);
    });
  });
});
