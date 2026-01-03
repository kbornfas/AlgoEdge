/**
 * Environment Variable Validator
 * 
 * This module validates that all required environment variables are set
 * before the application starts. It provides clear error messages for
 * missing or invalid configuration.
 */

interface EnvConfig {
  name: string;
  required: boolean;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

// Define all environment variables with their requirements
const ENV_CONFIG: EnvConfig[] = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    validator: (value) => value.startsWith('postgresql://'),
    errorMessage: 'DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql://',
  },

  // JWT Authentication
  {
    name: 'JWT_SECRET',
    required: true,
    validator: (value) => value.length >= 32,
    errorMessage: 'JWT_SECRET must be at least 32 characters long for security',
  },
  {
    name: 'JWT_EXPIRES_IN',
    required: false,
  },

  // SMTP Email Configuration
  {
    name: 'SMTP_HOST',
    required: true,
    errorMessage: 'SMTP_HOST is required for sending emails (e.g., smtp.gmail.com)',
  },
  {
    name: 'SMTP_PORT',
    required: true,
    validator: (value) => !isNaN(parseInt(value)) && parseInt(value) > 0,
    errorMessage: 'SMTP_PORT must be a valid port number',
  },
  {
    name: 'SMTP_SECURE',
    required: false,
  },
  {
    name: 'SMTP_USER',
    required: true,
    errorMessage: 'SMTP_USER is required for email authentication',
  },
  {
    name: 'SMTP_PASS',
    required: true,
    errorMessage: 'SMTP_PASS is required for email authentication',
  },
  {
    name: 'SMTP_FROM',
    required: true,
    errorMessage: 'SMTP_FROM is required for email sender address',
  },
  {
    name: 'EMAIL_BATCH_DELAY_MS',
    required: false,
  },

  // Application URLs
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    validator: (value) => value.startsWith('http://') || value.startsWith('https://'),
    errorMessage: 'NEXT_PUBLIC_APP_URL must be a valid URL (http:// or https://)',
  },
  {
    name: 'NEXT_PUBLIC_FRONTEND_URL',
    required: false,
  },

  // Stripe Payment (Optional for basic functionality)
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: false,
  },
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: false,
  },

  // WhatsApp & Instagram (Optional)
  {
    name: 'NEXT_PUBLIC_WHATSAPP_URL',
    required: false,
  },
  {
    name: 'NEXT_PUBLIC_INSTAGRAM_URL',
    required: false,
  },

  // MetaAPI (Optional for basic functionality)
  {
    name: 'METAAPI_TOKEN',
    required: false,
  },
  {
    name: 'METAAPI_ACCOUNT_ID',
    required: false,
  },

  // Admin Configuration
  {
    name: 'ADMIN_EMAIL',
    required: false,
  },
  {
    name: 'ADMIN_PASSWORD',
    required: false,
  },

  // Node Environment
  {
    name: 'NODE_ENV',
    required: false,
  },
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate all environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const config of ENV_CONFIG) {
    const value = process.env[config.name];

    // Check if required variable is missing
    if (config.required && !value) {
      const message = config.errorMessage || `${config.name} is required but not set`;
      errors.push(message);
      continue;
    }

    // Skip validation if optional and not set
    if (!value) {
      continue;
    }

    // Run custom validator if provided
    if (config.validator && !config.validator(value)) {
      const message = config.errorMessage || `${config.name} has an invalid value`;
      errors.push(message);
    }
  }

  // Check for production-specific requirements
  if (process.env.NODE_ENV === 'production') {
    // Warn if using weak JWT secret in production
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.includes('dev') || jwtSecret === 'your-super-secret-jwt-key-change-this-in-production') {
      warnings.push('JWT_SECRET appears to be a development value. Use a strong random secret in production!');
    }

    // Warn about missing optional but recommended variables
    if (!process.env.STRIPE_SECRET_KEY) {
      warnings.push('STRIPE_SECRET_KEY not set - payment processing will not be available');
    }

    if (!process.env.METAAPI_TOKEN) {
      warnings.push('METAAPI_TOKEN not set - MT5 trading features will not be available');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate environment and throw error if invalid
 * Call this at application startup to fail fast
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment();

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  Environment Configuration Warnings:');
    result.warnings.forEach((warning) => {
      console.warn(`   - ${warning}`);
    });
    console.warn('');
  }

  // Throw error if validation failed
  if (!result.valid) {
    console.error('\n❌ Environment Validation Failed!\n');
    console.error('The following required environment variables are missing or invalid:\n');
    result.errors.forEach((error) => {
      console.error(`   ❌ ${error}`);
    });
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    console.error('See .env.example for a template with all required variables.\n');
    
    throw new Error('Environment validation failed. Application cannot start.');
  }

  console.log('✅ Environment validation passed');
}

/**
 * Get a required environment variable or throw error
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Get an optional environment variable with a default value
 */
export function getEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}
