export const TEST_USERS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'palepale@admin.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'palepale123!',
    role: 'admin',
    displayName: 'Test User',
  },
  applicant: {
    email: process.env.TEST_APPLICANT_EMAIL || 'palepale@applicant.com',
    password: process.env.TEST_APPLICANT_PASSWORD || 'palepale123!',
    role: 'applicant',
    displayName: 'Test User',
  },
} as const;

export const APP_URLS = {
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  jobs: '/jobs',
} as const;

export const PAGE_TITLES = {
  login: 'Rakamin - Career Portal',
  register: 'Rakamin - Career Portal',
  dashboard: 'Rakamin - Career Portal',
  jobs: 'Rakamin - Career Portal',
} as const;

export const SELECTORS = {
  // Login page selectors
  login: {
    emailInput: 'input[name="email"]',
    passwordInput: 'input[name="password"]',
    loginButton: 'button[type="submit"]',
    passwordLoginButton: 'button:has-text("Masuk dengan Password")',
    magicLinkButton: 'button:has-text("Daftar dengan email")',
    googleSignInButton: 'button:has-text("Daftar dengan Google")',
    form: 'form',
    authError: 'text=Terjadi kesalahan',
    successMessage: 'text=Login berhasil',
  },
  // Common selectors
  userAvatar: '[data-testid="user-avatar"]',
  userDropdown: '[data-testid="user-dropdown"]',
  logoutButton: 'text=Logout',
  // Header selectors
  header: 'header',
  navigation: 'nav',
} as const;

export const TIMEOUTS = {
  default: 10000,
  short: 5000,
  long: 30000,
} as const;