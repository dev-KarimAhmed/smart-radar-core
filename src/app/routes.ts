'use client';

import { useEffect } from 'react';
import { trackSovereignError } from '@/shared/services/error-tracker';

/**
 * 🛡️ [RAD-CMD-061]: Security Route Guard / Middleware for role isolation
 * Prevents Rider role from accessing any advertiser or admin paths or hashes.
 * Logs a SECURITY_BREACH and ejects them back to the default home screen.
 */
export function useSovereignRouteGuard(user: any) {
  useEffect(() => {
    if (!user) return;

    const enforceSecurityBarrier = () => {
      const pathAndQuery = (window.location.pathname + window.location.search).toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (user.role === 'rider') {
        const isViolatingAdvertiser = pathAndQuery.includes('advertiser') || hash.includes('advertiser');
        const isViolatingAdmin = pathAndQuery.includes('admin') || hash.includes('admin');

        if (isViolatingAdvertiser || isViolatingAdmin) {
          // Log Security Breach under Protocol 20
          trackSovereignError(
            new Error(`SECURITY_BREACH: Prohibited access attempt by role=rider to path=${pathAndQuery} hash=${hash}`),
            { userId: user.uid, role: user.role }
          );

          // Force redirect to safe default path
          window.location.hash = '#/';
          if (window.location.pathname !== '/') {
            window.history.replaceState(null, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }
      }

      // 🛡️ [RAD-CMD-064]: Protect /advertiser routes from non-advertiser access
      if (user.role !== 'advertiser') {
        if (pathAndQuery.includes('/advertiser')) {
          trackSovereignError(
            new Error(`SECURITY_BREACH: Unauthorized access attempt to /advertiser route by role=${user.role}`),
            { userId: user.uid, role: user.role }
          );

          window.location.hash = '#/';
          if (window.location.pathname !== '/') {
            window.history.replaceState(null, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }
      }
    };

    enforceSecurityBarrier();

    window.addEventListener('hashchange', enforceSecurityBarrier);
    window.addEventListener('popstate', enforceSecurityBarrier);

    return () => {
      window.removeEventListener('hashchange', enforceSecurityBarrier);
      window.removeEventListener('popstate', enforceSecurityBarrier);
    };
  }, [user]);
}
