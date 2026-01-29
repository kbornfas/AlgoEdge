/**
 * Platform Settings Service
 * Reads settings from database with fallback to environment variables/defaults
 */

import pool from '../config/database.js';

// Default settings
const DEFAULTS = {
  platformName: 'AlgoEdge',
  platformDescription: 'Professional Trading Tools & Signals Marketplace',
  maintenanceMode: false,
  allowNewRegistrations: true,
  marketplaceCommission: parseFloat(process.env.MARKETPLACE_COMMISSION_RATE) || 20,
  signalProviderCommission: 10,
  affiliateCommission: 5,
  minimumWithdrawal: parseFloat(process.env.MINIMUM_WITHDRAWAL) || 10,
  minimumDeposit: 5,
};

// Cache settings for 5 minutes
let settingsCache = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all platform settings
 */
export async function getPlatformSettings() {
  // Check cache first
  if (settingsCache && Date.now() < cacheExpiry) {
    return settingsCache;
  }

  try {
    const result = await pool.query('SELECT key, value FROM platform_settings');
    
    const settings = { ...DEFAULTS };
    
    result.rows.forEach(row => {
      try {
        // Try to parse as JSON first
        settings[row.key] = JSON.parse(row.value);
      } catch {
        // If not JSON, use as string or number
        const numVal = parseFloat(row.value);
        settings[row.key] = isNaN(numVal) ? row.value : numVal;
      }
    });

    // Update cache
    settingsCache = settings;
    cacheExpiry = Date.now() + CACHE_TTL;

    return settings;
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    return DEFAULTS;
  }
}

/**
 * Get a specific setting
 */
export async function getSetting(key, defaultValue = null) {
  const settings = await getPlatformSettings();
  return settings[key] !== undefined ? settings[key] : (defaultValue ?? DEFAULTS[key]);
}

/**
 * Get commission rate for marketplace
 */
export async function getMarketplaceCommission() {
  return await getSetting('marketplaceCommission', DEFAULTS.marketplaceCommission);
}

/**
 * Get minimum withdrawal amount
 */
export async function getMinimumWithdrawal() {
  return await getSetting('minimumWithdrawal', DEFAULTS.minimumWithdrawal);
}

/**
 * Get minimum deposit amount
 */
export async function getMinimumDeposit() {
  return await getSetting('minimumDeposit', DEFAULTS.minimumDeposit);
}

/**
 * Check if platform is in maintenance mode
 */
export async function isMaintenanceMode() {
  return await getSetting('maintenanceMode', false);
}

/**
 * Check if new registrations are allowed
 */
export async function allowNewRegistrations() {
  return await getSetting('allowNewRegistrations', true);
}

/**
 * Clear the settings cache (call after updating settings)
 */
export function clearSettingsCache() {
  settingsCache = null;
  cacheExpiry = 0;
}

export default {
  getPlatformSettings,
  getSetting,
  getMarketplaceCommission,
  getMinimumWithdrawal,
  getMinimumDeposit,
  isMaintenanceMode,
  allowNewRegistrations,
  clearSettingsCache,
};
