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
    await this.repository.save(code, constraints);
  }

  /**
   * Set expiration date for a code
   */
  async setExpiration(code: string, expiresAt: Date): Promise<void> {
    const existing = await this.repository.findByCode(code);
    if (existing) {
      await this.repository.update(code, { expiresAt });
    } else {
      await this.repository.save(code, { expiresAt });
    }
  }

  /**
   * Set expiration using duration string (e.g., '30d', '24h', '1w')
   */
  async setExpirationFromDuration(
    code: string,
    duration: string,
  ): Promise<void> {
    const expiresAt = this.parseDuration(duration);
    await this.setExpiration(code, expiresAt);
  }

  /**
   * Set maximum usage limit for a code
   */
  async setMaxUses(code: string, maxUses: number): Promise<void> {
    const existing = await this.repository.findByCode(code);
    if (existing) {
      await this.repository.update(code, { maxUses });
    } else {
      await this.repository.save(code, { maxUses });
    }
  }

  /**
   * Get constraints for a code
   */
  async getConstraints(code: string): Promise<CodeConstraints | null> {
    return this.repository.findByCode(code);
  }

  /**
   * Check if a code is valid (not expired, not maxed out, is active)
   */
  async validateCode(code: string): Promise<CodeValidationResult> {
    const constraints = await this.repository.findByCode(code);

    if (!constraints) {
      return { isValid: false, reason: 'not_found' };
    }

    if (!constraints.isActive) {
      return { isValid: false, reason: 'inactive' };
    }

    if (this.isExpired(constraints)) {
      return { isValid: false, reason: 'expired' };
    }

    if (this.isMaxedOut(constraints)) {
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

    const constraints = await this.repository.findByCode(code);
    if (!constraints) {
      return { isValid: false, reason: 'not_found' };
    }

    const newUses = constraints.currentUses + 1;
    await this.repository.update(code, { currentUses: newUses });
    return { isValid: true, uses: newUses };
  }

  /**
   * Deactivate a code
   */
  async deactivate(code: string): Promise<void> {
    await this.repository.update(code, { isActive: false });
  }

  /**
   * Activate a code
   */
  async activate(code: string): Promise<void> {
    await this.repository.update(code, { isActive: true });
  }

  /**
   * Get all expired codes (for cleanup)
   */
  async getExpiredCodes(): Promise<string[]> {
    const allConstraints = await this.repository.findAll();
    return allConstraints
      .filter((c) => this.isExpired(c))
      .map((c) => c.code);
  }

  /**
   * Get all codes that reached max usage
   */
  async getMaxedOutCodes(): Promise<string[]> {
    const allConstraints = await this.repository.findAll();
    return allConstraints
      .filter((c) => this.isMaxedOut(c))
      .map((c) => c.code);
  }

  /**
   * Check remaining uses for a code
   */
  async getRemainingUses(code: string): Promise<number | null> {
    const constraints = await this.repository.findByCode(code);
    if (!constraints || constraints.maxUses === undefined) {
      return null;
    }
    return Math.max(0, constraints.maxUses - constraints.currentUses);
  }

  /**
   * Check time until expiration
   */
  async getTimeUntilExpiration(code: string): Promise<number | null> {
    const constraints = await this.repository.findByCode(code);
    if (!constraints || !constraints.expiresAt) {
      return null;
    }
    return Math.max(0, constraints.expiresAt.getTime() - Date.now());
  }

  /**
   * Delete constraints for a code
   */
  async deleteConstraints(code: string): Promise<void> {
    await this.repository.delete(code);
  }

  /**
   * Check if constraints indicate an expired code
   */
  private isExpired(constraints: CodeConstraints): boolean {
    return !!(constraints.expiresAt && new Date() > constraints.expiresAt);
  }

  /**
   * Check if constraints indicate a maxed out code
   */
  private isMaxedOut(constraints: CodeConstraints): boolean {
    return !!(
      constraints.maxUses !== undefined &&
      constraints.currentUses >= constraints.maxUses
    );
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
      /* istanbul ignore next */
      default:
        throw new Error(`Unknown duration unit: ${unit}`);
    }
  }
}
