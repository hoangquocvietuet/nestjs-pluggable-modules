import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './interfaces/analytics-repository.interface';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let repository: jest.Mocked<AnalyticsRepository>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<AnalyticsRepository> = {
      trackEvent: jest.fn(),
      getStatsByCode: jest.fn(),
      getStatsByUser: jest.fn(),
      getTopCodes: jest.fn(),
      getEvents: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: AnalyticsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    repository = module.get(AnalyticsRepository);
  });

  describe('trackClick', () => {
    it('should track a click event', async () => {
      repository.trackEvent.mockResolvedValue();

      await service.trackClick('CODE1', { source: 'email' });

      expect(repository.trackEvent).toHaveBeenCalledWith('CODE1', 'click', {
        source: 'email',
      });
    });
  });

  describe('trackSignup', () => {
    it('should track a signup event', async () => {
      repository.trackEvent.mockResolvedValue();

      await service.trackSignup('CODE1');

      expect(repository.trackEvent).toHaveBeenCalledWith(
        'CODE1',
        'signup',
        undefined,
      );
    });
  });

  describe('trackConversion', () => {
    it('should track a conversion event', async () => {
      repository.trackEvent.mockResolvedValue();

      await service.trackConversion('CODE1', { amount: 100 });

      expect(repository.trackEvent).toHaveBeenCalledWith('CODE1', 'conversion', {
        amount: 100,
      });
    });
  });

  describe('getCodeStats', () => {
    it('should get stats for a code', async () => {
      const stats = {
        code: 'CODE1',
        clicks: 100,
        signups: 50,
        conversions: 10,
        totalCommission: 500,
      };
      repository.getStatsByCode.mockResolvedValue(stats);

      const result = await service.getCodeStats('CODE1');

      expect(result).toEqual(stats);
    });
  });

  describe('getUserAggregatedStats', () => {
    it('should aggregate stats for all user codes', async () => {
      const stats = [
        {
          code: 'CODE1',
          clicks: 100,
          signups: 50,
          conversions: 10,
          totalCommission: 500,
        },
        {
          code: 'CODE2',
          clicks: 50,
          signups: 25,
          conversions: 5,
          totalCommission: 250,
        },
      ];
      repository.getStatsByUser.mockResolvedValue(stats);

      const result = await service.getUserAggregatedStats('user-1');

      expect(result).toEqual({
        code: 'all',
        clicks: 150,
        signups: 75,
        conversions: 15,
        totalCommission: 750,
      });
    });
  });

  describe('getTopCodes', () => {
    it('should get top codes by metric', async () => {
      const topCodes = [
        {
          code: 'CODE1',
          clicks: 100,
          signups: 50,
          conversions: 10,
          totalCommission: 500,
        },
      ];
      repository.getTopCodes.mockResolvedValue(topCodes);

      const result = await service.getTopCodes(10, 'conversions');

      expect(result).toEqual(topCodes);
      expect(repository.getTopCodes).toHaveBeenCalledWith(
        10,
        'conversions',
        undefined,
      );
    });
  });

  describe('getConversionRate', () => {
    it('should calculate conversion rate', async () => {
      repository.getStatsByCode.mockResolvedValue({
        code: 'CODE1',
        clicks: 100,
        signups: 50,
        conversions: 10,
        totalCommission: 500,
      });

      const result = await service.getConversionRate('CODE1');

      expect(result).toBe(0.1);
    });

    it('should return 0 when no clicks', async () => {
      repository.getStatsByCode.mockResolvedValue({
        code: 'CODE1',
        clicks: 0,
        signups: 0,
        conversions: 0,
        totalCommission: 0,
      });

      const result = await service.getConversionRate('CODE1');

      expect(result).toBe(0);
    });
  });
});
