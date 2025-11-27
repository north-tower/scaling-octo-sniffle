#!/usr/bin/env node

/**
 * Setup Verification Script
 * 
 * This script verifies that your frontend-backend integration is set up correctly.
 * Run with: node verify-setup.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - Missing: ${filePath}`, 'red');
    return false;
  }
}

function checkEnvVariable(content, variable, description) {
  const regex = new RegExp(`${variable}=`, 'm');
  if (regex.test(content)) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - Missing: ${variable}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🔍 Verifying Frontend-Backend Integration Setup\n', 'cyan');

  let allChecks = true;

  // Check critical files
  log('📁 Checking Critical Files:', 'blue');
  allChecks &= checkFile('src/lib/api.ts', 'API client');
  allChecks &= checkFile('src/lib/types.ts', 'Type definitions');
  allChecks &= checkFile('src/lib/validations.ts', 'Validation schemas');
  allChecks &= checkFile('src/store/auth.ts', 'Auth store');
  allChecks &= checkFile('src/hooks/useApi.ts', 'API hooks');
  allChecks &= checkFile('src/middleware.ts', 'Middleware');
  allChecks &= checkFile('.env.local', 'Environment file');

  // Check documentation
  log('\n📚 Checking Documentation:', 'blue');
  allChecks &= checkFile('QUICK_START.md', 'Quick start guide');
  allChecks &= checkFile('INTEGRATION_GUIDE.md', 'Integration guide');
  allChecks &= checkFile('USAGE_EXAMPLES.md', 'Usage examples');
  allChecks &= checkFile('INTEGRATION_SUMMARY.md', 'Integration summary');
  allChecks &= checkFile('INTEGRATION_CHECKLIST.md', 'Integration checklist');

  // Check example components
  log('\n🎨 Checking Example Components:', 'blue');
  allChecks &= checkFile('src/components/examples/StudentListExample.tsx', 'Student list example');
  allChecks &= checkFile('src/components/examples/PaymentFormExample.tsx', 'Payment form example');
  allChecks &= checkFile('src/components/examples/DashboardStatsExample.tsx', 'Dashboard stats example');

  // Check test page
  log('\n🧪 Checking Test Tools:', 'blue');
  allChecks &= checkFile('src/app/test-connection/page.tsx', 'Connection test page');
  allChecks &= checkFile('src/lib/api-examples.ts', 'API examples');

  // Check environment variables
  log('\n⚙️  Checking Environment Configuration:', 'blue');
  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    allChecks &= checkEnvVariable(envContent, 'NEXT_PUBLIC_API_URL', 'API URL configured');
  } else {
    log('✗ .env.local file not found', 'red');
    allChecks = false;
  }

  // Check package.json dependencies
  log('\n📦 Checking Dependencies:', 'blue');
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['axios', 'zustand', 'zod', 'react-hook-form', 'sonner'];
    
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies[dep]) {
        log(`✓ ${dep} installed`, 'green');
      } else {
        log(`✗ ${dep} not installed`, 'red');
        allChecks = false;
      }
    });
  }

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  if (allChecks) {
    log('✅ All checks passed! Your setup is complete.', 'green');
    log('\n📋 Next Steps:', 'cyan');
    log('1. Start your backend: cd backend && npm run dev', 'yellow');
    log('2. Start your frontend: npm run dev', 'yellow');
    log('3. Test connection: http://localhost:3000/test-connection', 'yellow');
    log('4. Login: http://localhost:3000/login', 'yellow');
    log('\n📖 Documentation:', 'cyan');
    log('- QUICK_START.md - Get started in 5 minutes', 'yellow');
    log('- INTEGRATION_GUIDE.md - Detailed API docs', 'yellow');
    log('- USAGE_EXAMPLES.md - Code examples', 'yellow');
  } else {
    log('❌ Some checks failed. Please review the errors above.', 'red');
    log('\n💡 Tips:', 'cyan');
    log('- Make sure you ran: npm install', 'yellow');
    log('- Check that all files were created correctly', 'yellow');
    log('- Verify .env.local exists and has correct values', 'yellow');
  }
  log('='.repeat(60) + '\n', 'cyan');
}

main().catch(error => {
  log(`\n❌ Error running verification: ${error.message}`, 'red');
  process.exit(1);
});
