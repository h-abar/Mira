import { create } from 'zustand';

export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'STYLIST';

export interface AuthUser {
  id: number;
  username: string;
  name?: string;
  role: UserRole;
  employeeId?: number | null;
  permissions?: string[];
  [key: string]: unknown;
}

const TOKEN_KEY = 'token';
const USER_KEY = 'auth-user';

const readUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  hasPermission: (...keys: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: readUser(),
  token: localStorage.getItem(TOKEN_KEY),
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),

  login: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },

  hasRole: (...roles) => {
    const user = get().user;
    return !!user && roles.includes(user.role);
  },

  hasPermission: (...keys) => {
    const user = get().user;
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    const permissions = user.permissions ?? [];
    return keys.some((key) => permissions.includes(key));
  },
}));