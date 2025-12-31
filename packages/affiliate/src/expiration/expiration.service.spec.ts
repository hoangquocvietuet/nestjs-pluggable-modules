import { Test, TestingModule } from '@nestjs/testing';
import { ExpirationService } from './expiration.service';
import { ExpirationRepository } from './interfaces/expiration-repository.interface';

describe('ExpirationService', () => {
  let service: ExpirationService;
  let repository: jest.Mocked<ExpirationRepository>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<ExpirationRepository> = {
      setConstraints: jest.fn(),
      getConstraints: jest.fn(),
      incrementUsage: jest.fn(),
      deactivate: jest.fn(),
      activate: jest.fn(),
      getExpiredCodes: jest.fn(),
      getMaxedOutCodes: jest.fn(),
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
    it('should set constraints for a code', async () => {
      repository.setConstraints.mockResolvedValue();

      const constraints = { expiresAt: new Date(), maxUses: 100 };
      await service.setConstraints('CODE1', constraints);

      expect(repository.setConstraints).toHaveBeenCalledWith('CODE1', constraints);
    });
  });

  describe('setExpirationFromDuration', () => {
    it('should parse duration and set expiration', async () => {
      repository.setConstraints.mockResolvedValue();

      await service.setExpirationFromDuration('CODE1', '30d');

      expect(repository.setConstraints).toHaveBeenCalledWith('CODE1', {
        expiresAt: expect.any(Date),
      });
    });

    it('should throw for invalid duration format', async () => {
      await expect(
        service.setExpirationFromDuration('CODE1', 'invalid'),
      ).rejects.toThrow('Invalid duration format');
    });
  });

  describe('validateCode', () => {
    it('should return valid for active unexpired code', async () => {
      repository.getConstraints.mockResolvedValue({
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
      repository.getConstraints.mockResolvedValue(null);

      const result = await service.validateCode('CODE1');

      expect(result).toEqual({ isValid: false, reason: 'not_found' });
    });

    it('should return invalid for inactive code', async () => {
      repository.getConstraints.mockResolvedValue({
        code: 'CODE1',
        currentUses: 0,
        isActive: false,
      });

      const result = await service.validateCode('CODE1');

      expect(result).toEqual({ isValid: false, reason: 'inactive' });
    });

    it('should return invalid for expired code', async () => {
      repository.getConstraints.mockResolvedValue({
        code: 'CODE1',
        expiresAt: new Date(Date.now() - 86400000),
        currentUses: 0,
        isActive: true,
      });

      const result = await service.validateCode('CODE1');

      expect(result).toEqual({ isValid: false, reason: 'expired' });
    });

    it('should return invalid for maxed out code', async () => {
      repository.getConstraints.mockResolvedValue({
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
      repository.getConstraints.mockResolvedValue({
        code: 'CODE1',
        maxUses: 100,
        currentUses: 50,
        isActive: true,
      });
      repository.incrementUsage.mockResolvedValue(51);

      const result = await service.useCode('CODE1');

      expect(result).toEqual({ isValid: true, uses: 51 });
    });

    it('should not increment for invalid code', async () => {
      repository.getConstraints.mockResolvedValue(null);

      const result = await service.useCode('CODE1');

      expect(result).toEqual({ isValid: false, reason: 'not_found' });
      expect(repository.incrementUsage).not.toHaveBeenCalled();
    });
  });

  describe('getRemainingUses', () => {
    it('should return remaining uses', async () => {
      repository.getConstraints.mockResolvedValue({
        code: 'CODE1',
        maxUses: 100,
        currentUses: 60,
        isActive: true,
      });

      const result = await service.getRemainingUses('CODE1');

      expect(result).toBe(40);
    });

    it('should return null for unlimited code', async () => {
      repository.getConstraints.mockResolvedValue({
        code: 'CODE1',
        currentUses: 60,
        isActive: true,
      });

      const result = await service.getRemainingUses('CODE1');

      expect(result).toBeNull();
    });
  });

  describe('deactivate/activate', () => {
    it('should deactivate a code', async () => {
      repository.deactivate.mockResolvedValue();

      await service.deactivate('CODE1');

      expect(repository.deactivate).toHaveBeenCalledWith('CODE1');
    });

    it('should activate a code', async () => {
      repository.activate.mockResolvedValue();

      await service.activate('CODE1');

      expect(repository.activate).toHaveBeenCalledWith('CODE1');
    });
  });

  describe('setExpiration', () => {
    it('should set expiration date directly', async () => {
      repository.setConstraints.mockResolvedValue();
      const expiresAt = new Date('2025-12-31');

      await service.setExpiration('CODE1', expiresAt);

      expect(repository.setConstraints).toHaveBeenCalledWith('CODE1', { expiresAt });
    });
  });

  describe('setMaxUses', () => {
    it('should set max uses', async () => {
      repository.setConstraints.mockResolvedValue();

      await service.setMaxUses('CODE1', 50);

      expect(repository.setConstraints).toHaveBeenCalledWith('CODE1', { maxUses: 50 });
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
      repository.getConstraints.mockResolvedValue(constraints);

      const result = await service.getConstraints('CODE1');

      expect(result).toEqual(constraints);
    });
  });

  describe('getExpiredCodes', () => {
    it('should return expired codes', async () => {
      repository.getExpiredCodes.mockResolvedValue(['CODE1', 'CODE2']);

      const result = await service.getExpiredCodes();

      expect(result).toEqual(['CODE1', 'CODE2']);
    });
  });

  describe('getMaxedOutCodes', () => {
    it('should return maxed out codes', async () => {
      repository.getMaxedOutCodes.mockResolvedValue(['CODE3']);

      const result = await service.getMaxedOutCodes();

      expect(result).toEqual(['CODE3']);
    });
  });

  describe('getTimeUntilExpiration', () => {
    it('should return time until expiration', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      repository.getConstraints.mockResolvedValue({
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
      repository.getConstraints.mockResolvedValue({
        code: 'CODE1',
        currentUses: 0,
        isActive: true,
      });

      const result = await service.getTimeUntilExpiration('CODE1');

      expect(result).toBeNull();
    });

    it('should return null for non-existent code', async () => {
      repository.getConstraints.mockResolvedValue(null);

      const result = await service.getTimeUntilExpiration('CODE1');

      expect(result).toBeNull();
    });

    it('should return 0 for already expired code', async () => {
      repository.getConstraints.mockResolvedValue({
        code: 'CODE1',
        expiresAt: new Date(Date.now() - 3600000),
        currentUses: 0,
        isActive: true,
      });

      const result = await service.getTimeUntilExpiration('CODE1');

      expect(result).toBe(0);
    });
  });

  describe('getRemainingUses', () => {
    it('should return null for non-existent code', async () => {
      repository.getConstraints.mockResolvedValue(null);

      const result = await service.getRemainingUses('CODE1');

      expect(result).toBeNull();
    });

    it('should return 0 when uses exceed max', async () => {
      repository.getConstraints.mockResolvedValue({
        code: 'CODE1',
        maxUses: 100,
        currentUses: 150,
        isActive: true,
      });

      const result = await service.getRemainingUses('CODE1');

      expect(result).toBe(0);
    });
  });

  describe('setExpirationFromDuration - all units', () => {
    it('should parse seconds', async () => {
      repository.setConstraints.mockResolvedValue();
      await service.setExpirationFromDuration('CODE1', '30s');
      expect(repository.setConstraints).toHaveBeenCalledWith('CODE1', {
        expiresAt: expect.any(Date),
      });
    });

    it('should parse minutes', async () => {
      repository.setConstraints.mockResolvedValue();
      await service.setExpirationFromDuration('CODE1', '5m');
      expect(repository.setConstraints).toHaveBeenCalled();
    });

    it('should parse hours', async () => {
      repository.setConstraints.mockResolvedValue();
      await service.setExpirationFromDuration('CODE1', '24h');
      expect(repository.setConstraints).toHaveBeenCalled();
    });

    it('should parse weeks', async () => {
      repository.setConstraints.mockResolvedValue();
      await service.setExpirationFromDuration('CODE1', '2w');
      expect(repository.setConstraints).toHaveBeenCalled();
    });

    it('should parse months', async () => {
      repository.setConstraints.mockResolvedValue();
      await service.setExpirationFromDuration('CODE1', '3M');
      expect(repository.setConstraints).toHaveBeenCalled();
    });

    it('should parse years', async () => {
      repository.setConstraints.mockResolvedValue();
      await service.setExpirationFromDuration('CODE1', '1y');
      expect(repository.setConstraints).toHaveBeenCalled();
    });
  });
});
