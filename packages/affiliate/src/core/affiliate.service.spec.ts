import { Test, TestingModule } from '@nestjs/testing';
import { AffiliateService } from './affiliate.service';
import {
  AffiliateRepository,
  ReferralUser,
} from './interfaces/affiliate-repository.interface';

describe('AffiliateService', () => {
  let service: AffiliateService;
  let repository: jest.Mocked<AffiliateRepository>;

  const mockUser: ReferralUser = {
    id: 'user-123',
    referralCode: 'REF-CODE',
  };

  beforeEach(async () => {
    const mockRepository: jest.Mocked<AffiliateRepository> = {
      createReferralCode: jest.fn(),
      findUserByCode: jest.fn(),
      addCommission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AffiliateService,
        {
          provide: AffiliateRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AffiliateService>(AffiliateService);
    repository = module.get(AffiliateRepository);
  });

  describe('generateReferralCode', () => {
    it('should generate a referral code and save it', async () => {
      repository.createReferralCode.mockResolvedValue();

      const code = await service.generateReferralCode('user-123');

      expect(code).toBeDefined();
      expect(typeof code).toBe('string');
      expect(code.length).toBe(8);
      expect(repository.createReferralCode).toHaveBeenCalledWith(
        'user-123',
        code,
      );
    });

    it('should generate code with custom config', async () => {
      repository.createReferralCode.mockResolvedValue();

      const code = await service.generateReferralCode('user-123', {
        length: 12,
        prefix: 'REF-',
      });

      expect(code).toMatch(/^REF-.{12}$/);
      expect(repository.createReferralCode).toHaveBeenCalledWith(
        'user-123',
        code,
      );
    });

    it('should generate code with pattern', async () => {
      repository.createReferralCode.mockResolvedValue();

      const code = await service.generateReferralCode('user-123', {
        pattern: 'PROMO-####-####',
      });

      expect(code).toMatch(/^PROMO-.{4}-.{4}$/);
    });
  });

  describe('generateCodes', () => {
    it('should generate multiple unique codes', () => {
      const codes = service.generateCodes({ count: 10, length: 8 });

      expect(codes).toHaveLength(10);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(10);
    });

    it('should generate codes with custom config', () => {
      const codes = service.generateCodes({
        count: 5,
        prefix: 'BATCH-',
        length: 6,
      });

      expect(codes).toHaveLength(5);
      codes.forEach((code) => {
        expect(code).toMatch(/^BATCH-.{6}$/);
      });
    });
  });

  describe('createReferralCode', () => {
    it('should save custom referral code', async () => {
      repository.createReferralCode.mockResolvedValue();

      await service.createReferralCode('user-123', 'CUSTOM-CODE');

      expect(repository.createReferralCode).toHaveBeenCalledWith(
        'user-123',
        'CUSTOM-CODE',
      );
    });
  });

  describe('processReferral', () => {
    it('should process referral and add commission when referrer exists', async () => {
      repository.findUserByCode.mockResolvedValue(mockUser);
      repository.addCommission.mockResolvedValue();

      const result = await service.processReferral('REF-CODE', 100);

      expect(result).toEqual({ success: true, referrerId: 'user-123' });
      expect(repository.findUserByCode).toHaveBeenCalledWith('REF-CODE');
      expect(repository.addCommission).toHaveBeenCalledWith('user-123', 100);
    });

    it('should return failure when referrer does not exist', async () => {
      repository.findUserByCode.mockResolvedValue(null);

      const result = await service.processReferral('INVALID-CODE', 100);

      expect(result).toEqual({ success: false });
      expect(repository.findUserByCode).toHaveBeenCalledWith('INVALID-CODE');
      expect(repository.addCommission).not.toHaveBeenCalled();
    });
  });

  describe('getReferrer', () => {
    it('should return referrer when found', async () => {
      repository.findUserByCode.mockResolvedValue(mockUser);

      const result = await service.getReferrer('REF-CODE');

      expect(result).toEqual(mockUser);
      expect(repository.findUserByCode).toHaveBeenCalledWith('REF-CODE');
    });

    it('should return null when referrer not found', async () => {
      repository.findUserByCode.mockResolvedValue(null);

      const result = await service.getReferrer('INVALID-CODE');

      expect(result).toBeNull();
    });
  });
});
