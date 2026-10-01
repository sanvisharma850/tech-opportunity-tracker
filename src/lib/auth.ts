'use client';

import { UserProfile, UserRole } from '@/types/auth';

const AUTH_STORAGE_KEY = 'techradar_auth_session_v1';
const USERS_DB_KEY = 'techradar_registered_users_v1';

// Strict Admin Whitelist: TanayThapar, Sanvi850, and panchadip125
export const ADMIN_WHITELIST: string[] = ['tanaythapar', 'sanvi850', 'panchadip125'];

export function isWhitelistedAdmin(identifier: string): boolean {
  if (!identifier) return false;
  const clean = identifier.trim().toLowerCase().replace('@', '');
  return ADMIN_WHITELIST.some(allowed => clean === allowed.toLowerCase());
}

function getRegisteredUsers(): UserProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCurrentUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function login(identifier: string): { success: boolean; user?: UserProfile; error?: string } {
  const clean = identifier.trim();
  if (!clean) return { success: false, error: 'Username, Handle, or Email cannot be empty' };

  const users = getRegisteredUsers();
  const lowerClean = clean.toLowerCase().replace('@', '');

  let user = users.find(
    u => u.handle.toLowerCase() === lowerClean || u.email.toLowerCase() === lowerClean
  );

  const isAdmin = isWhitelistedAdmin(clean) || (user && isWhitelistedAdmin(user.handle));

  if (!user) {
    user = {
      id: `usr-${Date.now()}`,
      email: clean.includes('@') ? clean.toLowerCase() : `${lowerClean}@user.radar`,
      name: clean,
      handle: clean.replace('@', ''),
      role: isAdmin ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    }
  } else {
    if (isAdmin) {
      user.role = 'admin';
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('techradar_auth_change'));
  }

  return { success: true, user };
}

export function signup(name: string, identifier: string): { success: boolean; user?: UserProfile; error?: string } {
  const clean = identifier.trim();
  if (!clean) return { success: false, error: 'Username or Email is required' };
  if (!name.trim()) return { success: false, error: 'Name is required' };

  const users = getRegisteredUsers();
  const lowerClean = clean.toLowerCase().replace('@', '');

  const existing = users.find(
    u => u.handle.toLowerCase() === lowerClean || u.email.toLowerCase() === lowerClean
  );
  if (existing) {
    return login(clean);
  }

  const isAdmin = isWhitelistedAdmin(clean);

  const newUser: UserProfile = {
    id: `usr-${Date.now()}`,
    email: clean.includes('@') ? clean.toLowerCase() : `${lowerClean}@user.radar`,
    name: name.trim(),
    handle: clean.replace('@', ''),
    role: isAdmin ? 'admin' : 'user',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    window.dispatchEvent(new Event('techradar_auth_change'));
  }

  return { success: true, user: newUser };
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new Event('techradar_auth_change'));
  }
}
