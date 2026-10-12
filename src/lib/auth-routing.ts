'use client';

import { usePathname } from 'next/navigation';

/**
 * URL-based routing for the unauthenticated auth flow.
 * Home (`/`) shows the role picker; each role routes to a dedicated page:
 *   - `/login/{role}`    → login form for that role
 *   - `/register/{role}` → registration form for that role
 *   - `/login/admin`     → admin control-desk login
 * Navigation reuses the app's existing pathname + popstate convention so
 * pages are shareable and refresh-safe.
 */

export type AuthView = 'role' | 'login' | 'register' | 'admin';
export type AuthRole = 'rider' | 'driver' | 'advertiser' | 'delegate';

const AUTH_ROLES = new Set<AuthRole>(['rider', 'driver', 'advertiser', 'delegate']);

export interface AuthLocation {
  view: AuthView;
  role: AuthRole | null;
}

function isAuthRole(value: string | undefined): value is AuthRole {
  return !!value && AUTH_ROLES.has(value as AuthRole);
}

export function parseAuthLocation(pathname: string): AuthLocation {
  if (pathname.replace(/\/+$/g, '') === '/rider') {
    return { view: 'login', role: 'rider' };
  }

  const [first, second] = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);

  if (first === 'login') {
    if (second === 'admin') return { view: 'admin', role: null };
    if (isAuthRole(second)) return { view: 'login', role: second };
  }

  if (first === 'register' && isAuthRole(second)) {
    return { view: 'register', role: second };
  }

  return { view: 'role', role: null };
}

export function buildAuthPath(view: AuthView, role?: AuthRole | null): string {
  if (view === 'admin') return '/login/admin';
  if (view === 'login' && role === 'rider') return '/rider';
  if (view === 'login' && role) return `/login/${role}`;
  if (view === 'register' && role) return `/register/${role}`;
  return '/';
}

export function navigateAuth(view: AuthView, role?: AuthRole | null): void {
  if (typeof window === 'undefined') return;

  const path = buildAuthPath(view, role);
  if (window.location.pathname === path) return;

  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useAuthLocation(): AuthLocation {
  // `usePathname()` is Next's router-driven pathname — unlike a manual
  // `popstate` listener, it stays in sync with both `navigateAuth()`'s
  // history.pushState calls (Next's router also reacts to popstate) and
  // regular `router.replace()`/`router.push()` calls used elsewhere in the
  // auth flow (login, logout), which never fire a native `popstate` event.
  const pathname = usePathname();
  return parseAuthLocation(pathname || '/');
}
