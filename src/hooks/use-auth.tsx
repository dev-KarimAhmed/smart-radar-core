'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User as SovereignUser } from '@/core/types';
import { buildUserFromSupabaseAuth, cacheSupabaseSession, clearSupabaseSessionCache } from '@/lib/supabase-auth';
import { supabase } from '@/lib/supabase-client';

interface AuthContextType {
  user: SovereignUser | null;
  loading: boolean;
  promoData: any;
  logout: () => void;
  loginAsMockUser: (user: SovereignUser) => void;
  isSovereign: boolean;
  isCaptain: boolean;
  isPassenger: boolean;
  isDelegate: boolean;
  suspendUserDocListener: () => void;
  resumeUserDocListener: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthContent({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SovereignUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      cacheSupabaseSession(data.session);
      setUser(data.session?.user ? (buildUserFromSupabaseAuth(data.session.user) as SovereignUser) : null);
      setLoading(false);
    }).catch(() => {
      if (!mounted) return;
      clearSupabaseSessionCache();
      setUser(null);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      cacheSupabaseSession(session);
      setUser(session?.user ? (buildUserFromSupabaseAuth(session.user) as SovereignUser) : null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const loginAsMockUser = useCallback((mockUser: SovereignUser) => {
    if (!import.meta.env.DEV) return;
    setUser(mockUser);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    clearSupabaseSessionCache();
    setUser(null);
    supabase.auth.signOut().catch(() => {
      setUser(null);
    });
  }, []);

  const suspendUserDocListener = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sovereign_write_lock', 'true');
    }
  }, []);

  const resumeUserDocListener = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sovereign_write_lock');
    }
  }, []);

  const isSovereign = useMemo(() => user?.role === 'admin', [user]);
  const isCaptain = useMemo(() => user?.role === 'driver', [user]);
  const isPassenger = useMemo(() => user?.role === 'rider', [user]);
  const isDelegate = useMemo(() => user?.role === 'delegate', [user]);

  const value = useMemo(() => ({
    user,
    loading,
    promoData,
    logout,
    loginAsMockUser,
    isSovereign,
    isCaptain,
    isPassenger,
    isDelegate,
    suspendUserDocListener,
    resumeUserDocListener,
  }), [
    user,
    loading,
    promoData,
    logout,
    loginAsMockUser,
    isSovereign,
    isCaptain,
    isPassenger,
    isDelegate,
    suspendUserDocListener,
    resumeUserDocListener,
  ]);

  if (loading && !user) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContent>{children}</AuthContent>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
