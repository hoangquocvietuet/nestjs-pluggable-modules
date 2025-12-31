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
  isActive?: boolean;
}

export interface UpdateCodeConstraints {
  expiresAt?: Date;
  maxUses?: number;
  currentUses?: number;
  isActive?: boolean;
}

/**
 * Abstract repository for code expiration and usage limits.
 * Implements basic CRUD operations - all business logic lives in the service.
 */
export abstract class ExpirationRepository {
  /**
   * Save constraints for a code (create or update)
   */
  abstract save(code: string, constraints: CreateCodeConstraints): Promise<void>;

  /**
   * Find constraints by code
   */
  abstract findByCode(code: string): Promise<CodeConstraints | null>;

  /**
   * Find all code constraints
   */
  abstract findAll(): Promise<CodeConstraints[]>;

  /**
   * Update constraints for a code
   */
  abstract update(
    code: string,
    data: UpdateCodeConstraints,
  ): Promise<void>;

  /**
   * Delete constraints for a code
   */
  abstract delete(code: string): Promise<void>;
}
