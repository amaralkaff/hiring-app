import { User, UserRole } from './types';

// Token management
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

// User management
export const getUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  }
  return null;
};

export const setUser = (user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_user', JSON.stringify(user));
  }
};

export const removeUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_user');
  }
};

// Authentication helpers
export const isAuthenticated = (): boolean => {
  const token = getToken();
  const user = getUser();
  return !!(token && user);
};

export const hasRole = (role: UserRole): boolean => {
  const user = getUser();
  return user?.role === role;
};

export const isAdmin = (): boolean => {
  return hasRole('admin');
};

export const isApplicant = (): boolean => {
  return hasRole('applicant');
};

// API helpers
export const authHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Login/logout functions
export const login = async (email: string, password: string) => {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'login',
        email,
        password,
      }),
    });

    const data = await response.json();

    if (data.success && data.user && data.token) {
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error || 'Login failed' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Network error' };
  }
};

export const register = async (email: string, password: string, name: string, role: UserRole) => {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'register',
        email,
        password,
        name,
        role,
      }),
    });

    const data = await response.json();

    if (data.success && data.user) {
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error || 'Registration failed' };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: 'Network error' };
  }
};

export const logout = async () => {
  try {
    const token = getToken();
    if (token) {
      await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'logout',
          token,
        }),
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    removeToken();
    removeUser();
    // Redirect to login page or home page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }
};

export const verifyToken = async (): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, error: 'No token found' };
    }

    const response = await fetch(`/api/auth?token=${encodeURIComponent(token)}`);
    const data = await response.json();

    if (data.success && data.user) {
      setUser(data.user);
      return { success: true, user: data.user };
    } else {
      removeToken();
      removeUser();
      return { success: false, error: data.error || 'Invalid token' };
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return { success: false, error: 'Network error' };
  }
};