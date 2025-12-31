import { Injectable } from '@nestjs/common';
import {
  AffiliateRepository,
  ReferralResult,
} from './interfaces/affiliate-repository.interface';
import { generate, Config } from '../utils/code-generator';

@Injectable()
export class AffiliateService {
  constructor(private readonly repository: AffiliateRepository) {}

  /**
   * Generate a unique referral code for a user
   */
  async generateReferralCode(userId: string, config?: Config): Promise<string> {
    const [code] = generate({ ...config, count: 1 });
    await this.repository.createReferralCode(userId, code);
    return code;
  }

  /**
   * Generate multiple unique referral codes
   */
  generateCodes(config: Config): string[] {
    return generate(config);
  }

  /**
   * Create a referral code with a custom value
   */
  async createReferralCode(userId: string, code: string): Promise<void> {
    await this.repository.createReferralCode(userId, code);
  }

  /**
   * Process a referral and add commission to the referrer
   */
  async processReferral(code: string, amount: number): Promise<ReferralResult> {
    const referrer = await this.repository.findUserByCode(code);
    if (referrer) {
      await this.repository.addCommission(referrer.id, amount);
      return { success: true, referrerId: referrer.id };
    }
    return { success: false };
  }

  /**
   * Get referrer information by code
   */
  async getReferrer(code: string) {
    return this.repository.findUserByCode(code);
  }
}
