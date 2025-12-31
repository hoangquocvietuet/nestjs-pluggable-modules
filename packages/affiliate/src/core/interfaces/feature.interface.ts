import { Provider, Type } from '@nestjs/common';

/**
 * Base interface for composable features.
 * Each feature module exports a Feature class implementing this interface.
 */
export interface AffiliateFeature {
  /**
   * Unique identifier for this feature
   */
  readonly name: string;

  /**
   * Providers to register when this feature is enabled
   */
  getProviders(): Provider[];

  /**
   * Exported providers from this feature
   */
  getExports(): (Type | string | symbol)[];
}

/**
 * Token for injecting enabled features
 */
export const AFFILIATE_FEATURES = 'AFFILIATE_FEATURES';
