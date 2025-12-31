export interface ReferralChainNode {
  userId: string;
  level: number;
  referralCode: string;
}

export interface CommissionTier {
  level: number;
  rate: number; // 0.1 = 10%
}

/**
 * Abstract repository for multi-level referral operations.
 * Implement this interface to support referral chains and tiered commissions.
 */
export abstract class MultiLevelRepository {
  /**
   * Set the referrer for a user (who referred this user)
   */
  abstract setReferrer(userId: string, referrerId: string): Promise<void>;

  /**
   * Get the referral chain up to N levels
   * Returns array from direct referrer to highest level
   */
  abstract getReferralChain(
    userId: string,
    maxLevels: number,
  ): Promise<ReferralChainNode[]>;

  /**
   * Get all users referred by a user (direct referrals only)
   */
  abstract getDirectReferrals(userId: string): Promise<string[]>;

  /**
   * Add commission to a user with level info for tracking
   */
  abstract addTieredCommission(
    userId: string,
    amount: number,
    level: number,
    sourceUserId: string,
  ): Promise<void>;
}
