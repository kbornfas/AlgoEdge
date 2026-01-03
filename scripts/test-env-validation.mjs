#!/usr/bin/env node

// Test environment validation
import { config } from 'dotenv';
config();

import { validateEnvironment } from '../src/lib/env-validator.js';

console.log('Testing environment validation...\n');

const result = validateEnvironment();

console.log('Valid:', result.valid);

if (!result.valid) {
  console.log('\nErrors:');
  result.errors.forEach(e => console.log('  ❌', e));
}

if (result.warnings.length > 0) {
  console.log('\nWarnings:');
  result.warnings.forEach(w => console.log('  ⚠️ ', w));
}

if (result.valid) {
  console.log('\n✅ Environment validation passed!');
} else {
  console.log('\n❌ Environment validation failed!');
  process.exit(1);
}
