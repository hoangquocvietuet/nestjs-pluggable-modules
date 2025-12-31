import { Injectable } from '@nestjs/common';
import { ExpirationFeature } from './expiration.feature';
import { ExpirationRepository } from './interfaces/expiration-repository.interface';
import { ExpirationService } from './expiration.service';

@Injectable()
class MockExpirationAdapter implements ExpirationRepository {
  async save() {}
  async findByCode() {
    return null;
  }
  async findAll() {
    return [];
  }
  async update() {}
  async delete() {}
}

describe('ExpirationFeature', () => {
  const defaultOptions = {
    adapter: MockExpirationAdapter,
  };

  describe('configure', () => {
    it('should create feature instance with options', () => {
      const feature = ExpirationFeature.configure(defaultOptions);

      expect(feature).toBeInstanceOf(ExpirationFeature);
      expect(feature.name).toBe('expiration');
    });
  });

  describe('getProviders', () => {
    it('should return required providers', () => {
      const feature = ExpirationFeature.configure(defaultOptions);
      const providers = feature.getProviders();

      expect(providers).toHaveLength(2);

      const repositoryProvider = providers.find(
        (p: any) => p.provide === ExpirationRepository,
      );
      expect(repositoryProvider).toBeDefined();
      expect((repositoryProvider as any).useClass).toBe(MockExpirationAdapter);

      expect(providers).toContain(ExpirationService);
    });
  });

  describe('getExports', () => {
    it('should return ExpirationService', () => {
      const feature = ExpirationFeature.configure(defaultOptions);
      const exports = feature.getExports();

      expect(exports).toContain(ExpirationService);
    });
  });
});
