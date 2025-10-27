# Playwright Authentication Tests

This directory contains simple and effective Playwright tests for the authentication system of the hiring application.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Playwright installed
- Test users created in the database

### Running Tests

```bash
# Run all authentication tests
npm run test

# Run tests in UI mode (interactive)
npm run test:ui

# Run tests with browser visibility
npm run test:headed

# Run specific test file
npm run test tests/auth/basic-auth.spec.ts

# Generate test report
npm run test:report
```

## 📁 Test Structure

```
tests/
├── auth/                          # Authentication tests
│   ├── basic-auth.spec.ts         # Basic authentication functionality
│   └── smoke-test.spec.ts         # Smoke tests for core authentication
└── helpers/
    └── test-constants.ts          # Test constants and configurations
```

## 🔑 Test Accounts

### Admin Account
- **Email:** palepale@admin.com
- **Password:** palepale123!
- **Role:** Administrator

### Applicant Account
- **Email:** palepale@applicant.com
- **Password:** palepale123!
- **Role:** Job Seeker

## 🧪 Test Categories

### 1. Basic Authentication Tests (`basic-auth.spec.ts`)
- Admin login and dashboard redirect
- Applicant login and jobs redirect
- Invalid credentials rejection
- User dropdown verification (with auth loading delays)

### 2. Smoke Tests (`smoke-test.spec.ts`)
- Simple login page load test
- Basic password login flow
- Error handling for invalid credentials

## 🛠️ Test Utilities

### Test Constants
Located in `helpers/test-constants.ts`, includes:
- Test user credentials
- Application URLs
- Page titles
- Selectors for common elements
- Timeout values

## 📊 Test Reports

After running tests, generate HTML reports:
```bash
npm run test:report
```

This will create a `playwright-report/index.html` file with detailed test results.

## 🔧 Configuration

### Playwright Config
- **Base URL:** http://localhost:3002
- **Timeout:** 10 seconds (default)
- **Browser:** Chromium
- **Retries:** 0 (local), 2 (CI)
- **Screenshots:** On failure
- **Traces:** On first retry

### Test Environment
- Uses `.env.test` for test-specific environment variables
- Automatic server startup
- Cookie clearing between tests
- Viewport management

## 🎯 Best Practices

1. **Simple Tests:** Focus on core functionality
2. **Explicit Waits:** Use proper wait strategies for network operations
3. **Clear Assertions:** Verify expected redirects and behavior
4. **Test Isolation:** Each test runs independently

## 🚨 Important Notes

- Tests use real database users created in Supabase
- Tests require the development server to be running on port 3000
- Tests include proper wait strategies for authentication loading
- Focus on essential functionality that matters

## 🐛 Debugging

### Running Tests in Headed Mode
```bash
npm run test:headed
```

### Running Tests in UI Mode
```bash
npm run test:ui
```

### Viewing Test Details
```bash
npm run test --reporter=list
```

## 📝 Adding New Tests

1. Create a new `.spec.ts` file in the `tests/auth/` directory
2. Import basic Playwright test utilities
3. Follow the existing simple test patterns
4. Use test constants from `test-constants.ts`

Example:
```typescript
import { test, expect } from '@playwright/test';

test('my new test', async ({ page }) => {
  await page.goto('/login');
  // Your test logic here
});
```