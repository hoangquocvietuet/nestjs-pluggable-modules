import { Test, TestingModule } from '@nestjs/testing';
import { ExpirationService } from './expiration.service';
import { ExpirationRepository } from './interfaces/expiration-repository.interface';

describe('ExpirationService', () => {
  let service: ExpirationService;
  let repository: jest.Mocked<ExpirationRepository>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<ExpirationRepository> = {
      save: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpirationService,
        {
          provide: ExpirationRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ExpirationService>(ExpirationService);
    repository = module.get(ExpirationRepository);
  });

  describe('setConstraints', () => {
    it('should save constraints for a code', async () => {
      repository.save.mockResolvedValue();

      const constraints = { expiresAt: new Date(), maxUses: 100 };
      await service.setConstraints('CODE1', constraints);

      expect(repository.save).toHaveBeenCalledWith('CODE1', constraints);
    });
  });

  describe('setExpiration', () => {
    it('should update expiration for existing code', async () => {
      const expiresAt = new Date('2025-12-31');
      repository.findByCode.mockResolvedValue({
        code: 'CODE1',
        currentUses: 0,
        isActive: true,
      });

      await service.setExpiration('CODE1', expiresAt);

      expect(repository.update).toHaveBeenCalledWith('CODE1', { expiresAt });
    });

    it('should save expiration for new code', async () => {
      const expiresAt = new Date('2025-12-31');
      repository.findByCode.mockResolvedValue(null);

      await service.setExpiration('CODE1', expiresAt);

      expect(repository.save).toHaveBeenCalledWith('CODE1', { expiresAt });
    });
  });

  describe('setMaxUses', () => {
    it('should update max uses for existing code', async () => {
      repository.findByCode.mockResolvedValue({
        code: 'CODE1',
        currentUses: 0,
        isActive: true,
      });

      await service.setMaxUses('CODE1', 50);

      expect(repository.update).toHaveBeenCalledWith('CODE1', { maxUses: 50 });
    });

    it('should save max uses for new code', async () => {
      repository.findByCode.mockResolvedValue(null);

      await service.setMaxUses('CODE1', 50);

      expect(repository.save).toHaveBeenCalledWith('CODE1', { maxUses: 50 });
    });
  });

  describe('setExpirationFromDuration', () => {
    it('should parse duration and set expiration', async () => {
      repository.findByCode.mockResolvedValue(null);
      repository.save.mockResolvedValue();

      await service.setExpirationFromDuration('CODE1', '30d');

      expect(repository.save).toHaveBeenCalledWith('CODE1', {
        expiresAt: expect.any(Date),
      });
    });

    it('should throw for invalid duration format', async () => {
      await expect(
        service.setExpirationFromDuration('CODE1', 'invalid'),
      ).rejects.toThrow('Invalid duration format');
    });
  });

  describe('getConstraints', () => {
    it('should return constraints', async () => {
      const constraints = {
        code: 'CODE1',
        maxUses: 100,
        currentUses: 50,
        isActive: true,
      };
      repository.findByCode.mockResolvedValue(constraints);

      const result = await service.getConstraints('CODE1');

      expect(result).toEqual(constraints);
    });

    it('should return null for non-existent code', async () => {
      repository.findByCode.mockResolvedValue(null);

      const result = await service.getConstraints('CODE1');

      expect(result).toBeNull();
    });
  });

  describe('validateCode', () => {
    it('should return valid for active unexpired code', async () => {
      repository.findByCode.mockResolvedValue({
        code: 'CODE1',
        expiresAt: new Date(Date.now() + 86400000),
        maxUses: 100,
        currentUses: 50,
        isActive: true,
      });

      const result = await service.validateCode('CODE1');

      expect(result).toEqual({ isValid: true });
    });

    it('should return invalid for not found code', async () => {
      repository.findByCode.mockResolvedValue(null);

      const result = await service.validateCode('CODE1');

      expect(result).toEqual({ isValid: false, reason: 'not_found' });
    });

    it('should return invalid for inactive code', async () => {
      repository.findByCode.mockResolvedValue({
        code: 'CODE1',
        currentUses: 0,
        isActive: false,
      });

      const result = await service.validateCode('CODE1');

      expect(result).toEqual({ isValid: false, reason: 'inactive' });
    });

    it('should return invalid for expired code', async () => {
      repository.findByCode.mockResolvedValue({
        code: 'CODE1',
        expiresAt: new Date(Date.now() - 86400000),
        currentUses: 0,
        isActive: true,
      });

      const result = await service.validateCode('CODE1');

      expect(result).toEqual({ isValid: false, reason: 'expired' });
    });

    it('should return invalid for maxed out code', async () => {
      repository.findByCode.mockResolvedValue({
        code: 'CODE1',
        maxUses: 100,
        currentUses: 100,
        isActive: true,
      });

      const result = await service.validateCode('CODE1');

      expect(result).toEqual({ isValid: false, reason: 'max_uses_reached' });
    });
  });

  describe('useCode', () => {
    it('should increment usage for valid code', async () => {
      repository.findByCode.mockResolvedValue({
        code: 'CODE1',
        maxUses: 100,
        currentUses: 50,
        isActive: true,
      });
      repository.update.mockResolvedValue();

      const result = await service.useCode('CODE1');

      expect(result).toEqual({ isValid: true, uses: 51 });
      expect(repository.update).toHaveBeenCalledWith('CODE1', { currentUses: 51 });
    });

    it('should not increment for invalid code', async () => {
      repository.findByCode.mockResolvedValue(null);

      const result = await service.useCode('CODE1');

      expect(result).toEqual({ isValid: false, reason: 'not_found' });
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should not increment for inactive code', async () => {
      repository.findByCode.mockResolvedValue({
        code: 'CODE1',
        currentUses: 0,
        isActive: false,
      });

      const result = await service.useCode('CODE1');

      expect(result).toEqual({ isValid: false, reason: 'inactive' });
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should handle race condition when code is deleted between validation and increment', async () => {
      // First call returns valid code (for validateCode)
      // Second call returns null (code was deleted)
      repository.findByCode
        .mockResolvedValueOnce({
          code: 'CODE1',
          maxUses: 100,
          currentUses: 50,
          isActive: true,
        })
        .mockResolvedValueOnce(null);

      const result = await service.useCode('CODE1');

      expect(result).toEqual({ isValid: false, reason: 'not_found' });
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('deactivate/activate', () => {
    it('should deactivate a code', async () => {
      repository.update.mockResolvedValue();

      await service.deactivate('CODE1');

      expect(repository.update).toHaveBeenCalledWith('CODE1', { isActive: false });
    });

    it('should activate a code', async () => {
      repository.update.mockResolvedValue();

      await service.activate('CODE1');

      expect(repository.update).toHaveBeenCalledWith('CODE1', { isActive: true });
    });
  });

  describe('getExpiredCodes', () => {
    it('should return expired codes filtered by service', async () => {
      repository.findAll.mockResolvedValue([
        {
          code: 'EXPIRED1',
          expiresAt: new Date(Date.now() - 86400000),
          currentUses: 0,
          isActive: true,
        },
        {
          code: 'EXPIRED2',
          expiresAt: new Date(Date.now() - 3600000),
          currentUses: 0,
          isActive: true,
        },
        {
          code: 'ACTIVE',
          expiresAt: new Date(Date.now() + 86400000),
          currentUses: 0,
          isActive: true,
        },
        {
          code: 'NO_EXPIRY',
          currentUses: 0,
          isActive: true,
        },
      ]);

      const result = await service.getExpiredCodes();

      expect(result).toEqual(['EXPIRED1', 'EXPIRED2']);
    });

    it('should return empty array when no expired codes', async () => {
      repository.findAll.mockResolvedValue([
        {
          code: 'ACTIVE',
          expiresAt: new Date(Date.now() + 86400000),
          currentUses: 0,
          isActive: true,
        },
      ]);

      const result = await service.getExpiredCodes();

      expect(result).toEqual([]);
    });
  });

  describe('getMaxedOutCodes', () => {
    it('should return maxed out codes filtered by service', async () => {
      repository.findAll.mockResolvedValue([
        {
          code: 'MAXED1',
          maxUses: 10,
          currentUses: 10,
          isActive: true,
        },
        {
          code: 'MAXED2',
          maxUses: 5,
          currentUses: 5,
          isActive: true,
        },
        {
          code: 'ACTIVE',
          maxUses: 100,
          currentUses: 50,
          isActive: true,
        },
        {
          code: 'UNLIMITED',
          currentUses: 1000,
          isActive: true,
        },
      ]);

      const result = await service.getMaxedOutCodes();

      expect(result).toEqual(['MAXED1', 'MAXED2']);
    });

    it('should return empty array when no maxed out codes', async () => {
      repository.findAll.mockResolvedValue([
        {
          code: 'ACTIVE',
          maxUses: 100,
          currentUses: 50,
          isActive: true,
        },
      ]);

      const result = await service.getMaxedOutCodes();

      expect(result).toEqual([]);
    });
  });

  describe('getRemainingUses', () => {
    it('should return remaining uses', async () => {
      repository.findByCode.mockResolvedValue({
        code: 'CODE1',
        maxUses: 100,
        currentUses: 60,
        isActive: true,
      });

      const result = await service.getRemainingUses('CODE1');

      expect(result).toBe(40);
    });

    it('should return null for unlimited code', async () => {
      repository.findByCode.mockResolvedValue({
        code: 'CODE1',
        currentUses: 60,
        isActive: true,
      });

      const result = await service.getRemainingUses('CODE1');

      expect(result).toBeNull();
    });

    it('should return null for non-existent code', async () => {
      repository.findByCode.mockResolvedValue(null);

      const result = await service.getRemainingUses('CODE1');

      expect(result).toBeNull();
    });

    it('should return 0 when uses exceed max', async () => {
      repository.findByCode.mockResolvedValue({
        code: 'CODE1',
        maxUses: 100,
        currentUses: 150,
        isActive: true,
      });

      const result = await service.getRemainingUses('CODE1');

      expect(result).toBe(0);
    });
  });

  describe('getTimeUntilExpiration', () => {
    it('should return time until expiration', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      repository.findByCode.mockResolvedValue({
        code: 'CODE1',
        expiresAt: futureDate,
        currentUses: 0,
        isActive: true,
      });

      const result = await service.getTimeUntilExpiration('CODE1');

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(3600000);
    });

    it('should return null for code without expiration', async () => {
      repository.findByCode.mockResolvedValue({
        code: 'CODE1',
        currentUses: 0,
        isActive: true,
      });

      const result = await service.getTimeUntilExpiration('CODE1');

      expect(result).toBeNull();
    });

    it('should return null for non-existent code', async () => {
      repository.findByCode.mockResolvedValue(null);

      const result = await service.getTimeUntilExpiration('CODE1');

      expect(result).toBeNull();
    });

    it('should return 0 for already expired code', async () => {
      repository.findByCode.mockResolvedValue({
        code: 'CODE1',
        expiresAt: new Date(Date.now() - 3600000),
        currentUses: 0,
        isActive: true,
      });

      const result = await service.getTimeUntilExpiration('CODE1');

      expect(result).toBe(0);
    });
  });

  describe('deleteConstraints', () => {
    it('should delete constraints for a code', async () => {
      repository.delete.mockResolvedValue();

      await service.deleteConstraints('CODE1');

      expect(repository.delete).toHaveBeenCalledWith('CODE1');
    });
  });

  describe('setExpirationFromDuration - all units', () => {
    beforeEach(() => {
      repository.findByCode.mockResolvedValue(null);
      repository.save.mockResolvedValue();
    });

    it('should parse seconds', async () => {
      await service.setExpirationFromDuration('CODE1', '30s');
      expect(repository.save).toHaveBeenCalledWith('CODE1', {
        expiresAt: expect.any(Date),
      });
    });

    it('should parse minutes', async () => {
      await service.setExpirationFromDuration('CODE1', '5m');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should parse hours', async () => {
      await service.setExpirationFromDuration('CODE1', '24h');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should parse days', async () => {
      await service.setExpirationFromDuration('CODE1', '30d');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should parse weeks', async () => {
      await service.setExpirationFromDuration('CODE1', '2w');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should parse months', async () => {
      await service.setExpirationFromDuration('CODE1', '3M');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should parse years', async () => {
      await service.setExpirationFromDuration('CODE1', '1y');
      expect(repository.save).toHaveBeenCalled();
    });
  });
});
