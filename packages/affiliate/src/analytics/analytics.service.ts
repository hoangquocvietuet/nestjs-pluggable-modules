import { Injectable } from '@nestjs/common';
import {
  AnalyticsRepository,
  ReferralEvent,
  ReferralStats,
  DateRange,
} from './interfaces/analytics-repository.interface';

@Injectable()
export class AnalyticsService {
  constructor(private readonly repository: AnalyticsRepository) {}

  /**
   * Track a click on a referral link
   */
  async trackClick(
    code: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.repository.trackEvent(code, 'click', metadata);
  }

  /**
   * Track a signup from a referral
   */
  async trackSignup(
    code: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.repository.trackEvent(code, 'signup', metadata);
  }

  /**
   * Track a conversion (purchase, subscription, etc.)
   */
  async trackConversion(
    code: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.repository.trackEvent(code, 'conversion', metadata);
  }

  /**
   * Get stats for a referral code
   */
  async getCodeStats(
    code: string,
    dateRange?: DateRange,
  ): Promise<ReferralStats> {
    return this.repository.getStatsByCode(code, dateRange);
  }

  /**
   * Get stats for all codes owned by a user
   */
  async getUserStats(
    userId: string,
    dateRange?: DateRange,
  ): Promise<ReferralStats[]> {
    return this.repository.getStatsByUser(userId, dateRange);
  }

  /**
   * Get aggregated stats for a user
   */
  async getUserAggregatedStats(
    userId: string,
    dateRange?: DateRange,
  ): Promise<ReferralStats> {
    const stats = await this.repository.getStatsByUser(userId, dateRange);

    return stats.reduce(
      (acc, stat) => ({
        code: 'all',
        clicks: acc.clicks + stat.clicks,
        signups: acc.signups + stat.signups,
        conversions: acc.conversions + stat.conversions,
        totalCommission: acc.totalCommission + stat.totalCommission,
      }),
      { code: 'all', clicks: 0, signups: 0, conversions: 0, totalCommission: 0 },
    );
  }

  /**
   * Get top performing codes by metric
   */
  async getTopCodes(
    limit: number = 10,
    metric: 'clicks' | 'signups' | 'conversions' | 'commission' = 'conversions',
    dateRange?: DateRange,
  ): Promise<ReferralStats[]> {
    return this.repository.getTopCodes(limit, metric, dateRange);
  }

  /**
   * Get conversion rate for a code
   */
  async getConversionRate(
    code: string,
    dateRange?: DateRange,
  ): Promise<number> {
    const stats = await this.repository.getStatsByCode(code, dateRange);
    if (stats.clicks === 0) return 0;
    return stats.conversions / stats.clicks;
  }

  /**
   * Get events for a code
   */
  async getEvents(
    code: string,
    type?: ReferralEvent['type'],
    dateRange?: DateRange,
  ): Promise<ReferralEvent[]> {
    return this.repository.getEvents(code, type, dateRange);
  }
}
