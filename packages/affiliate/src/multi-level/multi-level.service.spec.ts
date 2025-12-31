import { Test, TestingModule } from '@nestjs/testing';
import {
  MultiLevelService,
  MULTI_LEVEL_OPTIONS,
} from './multi-level.service';
import { MultiLevelRepository } from './interfaces/multi-level-repository.interface';

describe('MultiLevelService', () => {
  let service: MultiLevelService;
  let repository: jest.Mocked<MultiLevelRepository>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<MultiLevelRepository> = {
      setReferrer: jest.fn(),
      getReferralChain: jest.fn(),
      getDirectReferrals: jest.fn(),
      addTieredCommission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MultiLevelService,
        {
          provide: MultiLevelRepository,
          useValue: mockRepository,
        },
        {
          provide: MULTI_LEVEL_OPTIONS,
          useValue: {
            maxLevels: 3,
            tiers: [
              { level: 1, rate: 0.1 },
              { level: 2, rate: 0.05 },
              { level: 3, rate: 0.02 },
            ],
          },
        },
      ],
    }).compile();

    service = module.get<MultiLevelService>(MultiLevelService);
    repository = module.get(MultiLevelRepository);
  });

  describe('registerReferral', () => {
    it('should register a referral relationship', async () => {
      repository.setReferrer.mockResolvedValue();

      await service.registerReferral('user-1', 'referrer-1');

      expect(repository.setReferrer).toHaveBeenCalledWith('user-1', 'referrer-1');
    });
  });

  describe('getReferralChain', () => {
    it('should get referral chain', async () => {
      const chain = [
        { userId: 'ref-1', level: 1, referralCode: 'CODE1' },
        { userId: 'ref-2', level: 2, referralCode: 'CODE2' },
      ];
      repository.getReferralChain.mockResolvedValue(chain);

      const result = await service.getReferralChain('user-1');

      expect(result).toEqual(chain);
      expect(repository.getReferralChain).toHaveBeenCalledWith('user-1', 3);
    });
  });

  describe('getDirectReferrals', () => {
    it('should get direct referrals', async () => {
      repository.getDirectReferrals.mockResolvedValue(['user-2', 'user-3']);

      const result = await service.getDirectReferrals('user-1');

      expect(result).toEqual(['user-2', 'user-3']);
    });
  });

  describe('processMultiLevelCommission', () => {
    it('should process commission for all levels in chain', async () => {
      const chain = [
        { userId: 'ref-1', level: 1, referralCode: 'CODE1' },
        { userId: 'ref-2', level: 2, referralCode: 'CODE2' },
        { userId: 'ref-3', level: 3, referralCode: 'CODE3' },
      ];
      repository.getReferralChain.mockResolvedValue(chain);
      repository.addTieredCommission.mockResolvedValue();

      const result = await service.processMultiLevelCommission('user-1', 100);

      expect(result).toEqual([
        { userId: 'ref-1', level: 1, amount: 10 },
        { userId: 'ref-2', level: 2, amount: 5 },
        { userId: 'ref-3', level: 3, amount: 2 },
      ]);
      expect(repository.addTieredCommission).toHaveBeenCalledTimes(3);
    });

    it('should skip levels without configured tiers', async () => {
      const chain = [
        { userId: 'ref-1', level: 1, referralCode: 'CODE1' },
        { userId: 'ref-4', level: 4, referralCode: 'CODE4' },
      ];
      repository.getReferralChain.mockResolvedValue(chain);
      repository.addTieredCommission.mockResolvedValue();

      const result = await service.processMultiLevelCommission('user-1', 100);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ userId: 'ref-1', level: 1, amount: 10 });
    });
  });

  describe('getCommissionRate', () => {
    it('should return rate for configured level', () => {
      expect(service.getCommissionRate(1)).toBe(0.1);
      expect(service.getCommissionRate(2)).toBe(0.05);
      expect(service.getCommissionRate(3)).toBe(0.02);
    });

    it('should return 0 for unconfigured level', () => {
      expect(service.getCommissionRate(4)).toBe(0);
    });
  });

  describe('getTiers', () => {
    it('should return all configured tiers', () => {
      const tiers = service.getTiers();

      expect(tiers).toHaveLength(3);
      expect(tiers[0]).toEqual({ level: 1, rate: 0.1 });
    });
  });
});
