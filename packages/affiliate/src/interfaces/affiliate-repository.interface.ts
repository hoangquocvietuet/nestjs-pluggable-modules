export interface ReferralUser {
  id: string;
  referralCode: string;
  [key: string]: unknown;
}

export interface ReferralResult {
  success: boolean;
  referrerId?: string;
}

/**
 * Abstract repository contract for affiliate operations.
 * Users must implement this interface with their preferred database adapter.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class PrismaAffiliateAdapter implements AffiliateRepository {
 *   constructor(private prisma: PrismaService) {}
 *
 *   async createReferralCode(userId: string, code: string): Promise<void> {
 *     await this.prisma.user.update({
 *       where: { id: userId },
 *       data: { referralCode: code },
 *     });
 *   }
 *   // ... implement other methods
 * }
 * ```
 */
export abstract class AffiliateRepository {
  /**
   * Create or assign a referral code to a user
   */
  abstract createReferralCode(userId: string, code: string): Promise<void>;

  /**
   * Find a user by their referral code
   */
  abstract findUserByCode(code: string): Promise<ReferralUser | null>;

  /**
   * Add commission to a user's balance
   */
  abstract addCommission(userId: string, amount: number): Promise<void>;
}
