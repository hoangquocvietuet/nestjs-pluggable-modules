import { Test } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { AffiliateModule } from './affiliate.module';
import { AffiliateService } from './affiliate.service';
import { AffiliateRepository } from './interfaces/affiliate-repository.interface';
import { AffiliateFeature, AFFILIATE_FEATURES } from './interfaces/feature.interface';

@Injectable()
class MockAdapter implements AffiliateRepository {
  async createReferralCode() {}
  async findUserByCode() {
    return null;
  }
  async addCommission() {}
}

class MockFeature implements AffiliateFeature {
  readonly name = 'mock-feature';

  getProviders() {
    return [{ provide: 'MOCK_TOKEN', useValue: 'mock-value' }];
  }

  getExports() {
    return [];
  }
}

describe('AffiliateModule', () => {
  describe('register', () => {
    it('should register core providers', async () => {
      const module = await Test.createTestingModule({
        imports: [AffiliateModule.register({ adapter: MockAdapter })],
      }).compile();

      const service = module.get<AffiliateService>(AffiliateService);
      const repository = module.get<AffiliateRepository>(AffiliateRepository);

      expect(service).toBeDefined();
      expect(repository).toBeDefined();
    });

    it('should register with features', async () => {
      const mockFeature = new MockFeature();

      const module = await Test.createTestingModule({
        imports: [
          AffiliateModule.register({
            adapter: MockAdapter,
            features: [mockFeature],
          }),
        ],
      }).compile();

      const features = module.get<string[]>(AFFILIATE_FEATURES);
      const mockToken = module.get('MOCK_TOKEN');

      expect(features).toContain('mock-feature');
      expect(mockToken).toBe('mock-value');
    });

    it('should handle empty features array', async () => {
      const module = await Test.createTestingModule({
        imports: [
          AffiliateModule.register({
            adapter: MockAdapter,
            features: [],
          }),
        ],
      }).compile();

      const features = module.get<string[]>(AFFILIATE_FEATURES);
      expect(features).toEqual([]);
    });
  });

  describe('forRoot', () => {
    it('should register as global module', async () => {
      const dynamicModule = AffiliateModule.forRoot({ adapter: MockAdapter });

      expect(dynamicModule.global).toBe(true);
    });
  });

  describe('registerAsync', () => {
    it('should register with async factory', async () => {
      const module = await Test.createTestingModule({
        imports: [
          AffiliateModule.registerAsync({
            useFactory: () => ({
              adapter: MockAdapter,
            }),
          }),
        ],
      }).compile();

      const service = module.get<AffiliateService>(AffiliateService);
      expect(service).toBeDefined();
    });

    it('should handle async factory with features', async () => {
      const module = await Test.createTestingModule({
        imports: [
          AffiliateModule.registerAsync({
            useFactory: () => ({
              adapter: MockAdapter,
              features: [],
            }),
          }),
        ],
      }).compile();

      const features = module.get<string[]>(AFFILIATE_FEATURES);
      expect(features).toEqual([]);
    });
  });

  describe('forRootAsync', () => {
    it('should register as global module with async config', async () => {
      const dynamicModule = AffiliateModule.forRootAsync({
        useFactory: () => ({ adapter: MockAdapter }),
      });

      expect(dynamicModule.global).toBe(true);
    });
  });
});
