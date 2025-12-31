import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  MultiLevelRepository,
  ReferralChainNode,
  CommissionTier,
} from './interfaces/multi-level-repository.interface';

export const MULTI_LEVEL_OPTIONS = 'MULTI_LEVEL_OPTIONS';

export interface MultiLevelOptions {
  /**
   * Maximum levels in referral chain (default: 3)
   */
  maxLevels?: number;
  /**
   * Commission tiers per level
   * Default: [{ level: 1, rate: 0.1 }, { level: 2, rate: 0.05 }, { level: 3, rate: 0.02 }]
   */
  tiers?: CommissionTier[];
}

const DEFAULT_OPTIONS: Required<MultiLevelOptions> = {
  maxLevels: 3,
  tiers: [
    { level: 1, rate: 0.1 },
    { level: 2, rate: 0.05 },
    { level: 3, rate: 0.02 },
  ],
};

@Injectable()
export class MultiLevelService {
  private readonly options: Required<MultiLevelOptions>;

  constructor(
    private readonly repository: MultiLevelRepository,
    @Optional()
    @Inject(MULTI_LEVEL_OPTIONS)
    options?: MultiLevelOptions,
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Register a referral relationship
   */
  async registerReferral(userId: string, referrerId: string): Promise<void> {
    await this.repository.setReferrer(userId, referrerId);
  }

  /**
   * Get the referral chain for a user
   */
  async getReferralChain(userId: string): Promise<ReferralChainNode[]> {
    return this.repository.getReferralChain(userId, this.options.maxLevels);
  }

  /**
   * Get direct referrals (level 1 only)
   */
  async getDirectReferrals(userId: string): Promise<string[]> {
    return this.repository.getDirectReferrals(userId);
  }

  /**
   * Process multi-level commission for all referrers in the chain
   */
  async processMultiLevelCommission(
    userId: string,
    baseAmount: number,
  ): Promise<{ userId: string; level: number; amount: number }[]> {
    const chain = await this.repository.getReferralChain(
      userId,
      this.options.maxLevels,
    );

    const commissions: { userId: string; level: number; amount: number }[] = [];

    for (const node of chain) {
      const tier = this.options.tiers.find((t) => t.level === node.level);
      if (!tier) continue;

      const amount = baseAmount * tier.rate;
      await this.repository.addTieredCommission(
        node.userId,
        amount,
        node.level,
        userId,
      );

      commissions.push({
        userId: node.userId,
        level: node.level,
        amount,
      });
    }

    return commissions;
  }

  /**
   * Get commission rate for a specific level
   */
  getCommissionRate(level: number): number {
    const tier = this.options.tiers.find((t) => t.level === level);
    return tier?.rate ?? 0;
  }

  /**
   * Get all configured tiers
   */
  getTiers(): CommissionTier[] {
    return [...this.options.tiers];
  }
}
