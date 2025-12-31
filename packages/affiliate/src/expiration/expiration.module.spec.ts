import { Test } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { ExpirationModule } from './expiration.module';
import { ExpirationService } from './expiration.service';
import { ExpirationRepository } from './interfaces/expiration-repository.interface';

@Injectable()
class MockExpirationAdapter implements ExpirationRepository {
  async setConstraints() {}
  async getConstraints() {
    return null;
  }
  async incrementUsage() {
    return 1;
  }
  async deactivate() {}
  async activate() {}
  async getExpiredCodes() {
    return [];
  }
  async getMaxedOutCodes() {
    return [];
  }
}

describe('ExpirationModule', () => {
  const defaultOptions = {
    adapter: MockExpirationAdapter,
  };

  describe('register', () => {
    it('should register providers', async () => {
      const module = await Test.createTestingModule({
        imports: [ExpirationModule.register(defaultOptions)],
      }).compile();

      const service = module.get<ExpirationService>(ExpirationService);
      expect(service).toBeDefined();
    });
  });

  describe('forRoot', () => {
    it('should register as global module', () => {
      const dynamicModule = ExpirationModule.forRoot(defaultOptions);
      expect(dynamicModule.global).toBe(true);
    });
  });

  describe('registerAsync', () => {
    it('should register with async factory', async () => {
      const module = await Test.createTestingModule({
        imports: [
          ExpirationModule.registerAsync({
            useFactory: () => defaultOptions,
          }),
        ],
      }).compile();

      const service = module.get<ExpirationService>(ExpirationService);
      expect(service).toBeDefined();
    });
  });

  describe('forRootAsync', () => {
    it('should register as global with async config', () => {
      const dynamicModule = ExpirationModule.forRootAsync({
        useFactory: () => defaultOptions,
      });
      expect(dynamicModule.global).toBe(true);
    });
  });
});
