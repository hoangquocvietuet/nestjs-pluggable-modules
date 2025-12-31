import { Injectable } from '@nestjs/common';
import {
  ExpirationRepository,
  CodeConstraints,
  CreateCodeConstraints,
} from './interfaces/expiration-repository.interface';

export interface CodeValidationResult {
  isValid: boolean;
  reason?: 'expired' | 'max_uses_reached' | 'inactive' | 'not_found';
}

@Injectable()
export class ExpirationService {
  constructor(private readonly repository: ExpirationRepository) {}

  /**
   * Set expiration and/or usage limits for a code
   */
  async setConstraints(
    code: string,
    constraints: CreateCodeConstraints,
  ): Promise<void> {
    await this.repository.setConstraints(code, constraints);
  }

  /**
   * Set expiration date for a code
   */
  async setExpiration(code: string, expiresAt: Date): Promise<void> {
    await this.repository.setConstraints(code, { expiresAt });
  }

  /**
   * Set expiration using duration string (e.g., '30d', '24h', '1w')
   */
  async setExpirationFromDuration(
    code: string,
    duration: string,
  ): Promise<void> {
    const expiresAt = this.parseDuration(duration);
    await this.repository.setConstraints(code, { expiresAt });
  }

  /**
   * Set maximum usage limit for a code
   */
  async setMaxUses(code: string, maxUses: number): Promise<void> {
    await this.repository.setConstraints(code, { maxUses });
  }

  /**
   * Get constraints for a code
   */
  async getConstraints(code: string): Promise<CodeConstraints | null> {
    return this.repository.getConstraints(code);
  }

  /**
   * Check if a code is valid (not expired, not maxed out, is active)
   */
  async validateCode(code: string): Promise<CodeValidationResult> {
    const constraints = await this.repository.getConstraints(code);

    if (!constraints) {
      return { isValid: false, reason: 'not_found' };
    }

    if (!constraints.isActive) {
      return { isValid: false, reason: 'inactive' };
    }

    if (constraints.expiresAt && new Date() > constraints.expiresAt) {
      return { isValid: false, reason: 'expired' };
    }

    if (
      constraints.maxUses !== undefined &&
      constraints.currentUses >= constraints.maxUses
    ) {
      return { isValid: false, reason: 'max_uses_reached' };
    }

    return { isValid: true };
  }

  /**
   * Use a code (increment usage and validate)
   */
  async useCode(code: string): Promise<CodeValidationResult & { uses?: number }> {
    const validation = await this.validateCode(code);
    if (!validation.isValid) {
      return validation;
    }

    const uses = await this.repository.incrementUsage(code);
    return { isValid: true, uses };
  }

  /**
   * Deactivate a code
   */
  async deactivate(code: string): Promise<void> {
    await this.repository.deactivate(code);
  }

  /**
   * Activate a code
   */
  async activate(code: string): Promise<void> {
    await this.repository.activate(code);
  }

  /**
   * Get all expired codes (for cleanup)
   */
  async getExpiredCodes(): Promise<string[]> {
    return this.repository.getExpiredCodes();
  }

  /**
   * Get all codes that reached max usage
   */
  async getMaxedOutCodes(): Promise<string[]> {
    return this.repository.getMaxedOutCodes();
  }

  /**
   * Check remaining uses for a code
   */
  async getRemainingUses(code: string): Promise<number | null> {
    const constraints = await this.repository.getConstraints(code);
    if (!constraints || constraints.maxUses === undefined) {
      return null; // Unlimited
    }
    return Math.max(0, constraints.maxUses - constraints.currentUses);
  }

  /**
   * Check time until expiration
   */
  async getTimeUntilExpiration(code: string): Promise<number | null> {
    const constraints = await this.repository.getConstraints(code);
    if (!constraints || !constraints.expiresAt) {
      return null; // Never expires
    }
    return Math.max(0, constraints.expiresAt.getTime() - Date.now());
  }

  private parseDuration(duration: string): Date {
    const match = duration.match(/^(\d+)([smhdwMy])$/);
    if (!match) {
      throw new Error(
        `Invalid duration format: ${duration}. Use format like '30d', '24h', '1w'`,
      );
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const now = new Date();
    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      case 'w':
        return new Date(now.getTime() + value * 7 * 24 * 60 * 60 * 1000);
      case 'M':
        now.setMonth(now.getMonth() + value);
        return now;
      case 'y':
        now.setFullYear(now.getFullYear() + value);
        return now;
      default:
        throw new Error(`Unknown duration unit: ${unit}`);
    }
  }
}
