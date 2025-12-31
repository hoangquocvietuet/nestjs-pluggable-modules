export interface CodeConstraints {
  code: string;
  expiresAt?: Date;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
}

export interface CreateCodeConstraints {
  expiresAt?: Date;
  maxUses?: number;
}

/**
 * Abstract repository for code expiration and usage limits.
 * Implement this interface to support time-limited and usage-limited codes.
 */
export abstract class ExpirationRepository {
  /**
   * Set constraints for a referral code
   */
  abstract setConstraints(
    code: string,
    constraints: CreateCodeConstraints,
  ): Promise<void>;

  /**
   * Get constraints for a code
   */
  abstract getConstraints(code: string): Promise<CodeConstraints | null>;

  /**
   * Increment usage count for a code
   */
  abstract incrementUsage(code: string): Promise<number>;

  /**
   * Deactivate a code (soft delete)
   */
  abstract deactivate(code: string): Promise<void>;

  /**
   * Reactivate a code
   */
  abstract activate(code: string): Promise<void>;

  /**
   * Get all expired codes (for cleanup jobs)
   */
  abstract getExpiredCodes(): Promise<string[]>;

  /**
   * Get all codes that have reached max usage
   */
  abstract getMaxedOutCodes(): Promise<string[]>;
}
