export interface ReferralEvent {
  id: string;
  code: string;
  type: 'click' | 'signup' | 'conversion';
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ReferralStats {
  code: string;
  clicks: number;
  signups: number;
  conversions: number;
  totalCommission: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Abstract repository for affiliate analytics operations.
 * Implement this interface to track and report referral metrics.
 */
export abstract class AnalyticsRepository {
  /**
   * Track a referral event (click, signup, conversion)
   */
  abstract trackEvent(
    code: string,
    type: ReferralEvent['type'],
    metadata?: Record<string, unknown>,
  ): Promise<void>;

  /**
   * Get stats for a specific referral code
   */
  abstract getStatsByCode(
    code: string,
    dateRange?: DateRange,
  ): Promise<ReferralStats>;

  /**
   * Get stats for a user (all their referral codes)
   */
  abstract getStatsByUser(
    userId: string,
    dateRange?: DateRange,
  ): Promise<ReferralStats[]>;

  /**
   * Get top performing referral codes
   */
  abstract getTopCodes(
    limit: number,
    metric: 'clicks' | 'signups' | 'conversions' | 'commission',
    dateRange?: DateRange,
  ): Promise<ReferralStats[]>;

  /**
   * Get events for a referral code
   */
  abstract getEvents(
    code: string,
    type?: ReferralEvent['type'],
    dateRange?: DateRange,
  ): Promise<ReferralEvent[]>;
}
