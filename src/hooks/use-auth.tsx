'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { onAuthStateChanged, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { trackSovereignError } from '@/lib/error-tracker';
import type { User as SovereignUser } from '@/core/types';
import { useSovereignFCM } from './use-sovereign-fcm';

interface AuthContextType {
  user: SovereignUser | null;
  loading: boolean;
  promoData: any;
  logout: () => void;
  loginAsMockUser: (user: SovereignUser) => void;
  isSovereign: boolean;
  isCaptain: boolean;
  isPassenger: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthContent({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SovereignUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [promoData, setPromoData] = useState<any>(null);
    
    const { registerDeviceToken } = useSovereignFCM();

    useEffect(() => {
      if (user) {
        registerDeviceToken(user);
      }
    }, [user, registerDeviceToken]);
    
    useEffect(() => {
        if (!user) {
            setPromoData(null);
            return;
        }

        const promoRef = doc(db, 'settings', 'radar_promo');
        const unsubscribe = onSnapshot(promoRef, (docSnap) => {
            if (docSnap.exists()) {
                setPromoData(docSnap.data());
            } else {
                setPromoData(null);
            }
        }, (error) => {
            trackSovereignError(error, { context: 'PromoData_Listener' });
            setPromoData(null);
        });

        return () => unsubscribe();
    }, [user]);
    
    useEffect(() => {
        let unsubscribeUserDoc: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (unsubscribeUserDoc) {
                unsubscribeUserDoc();
            }

            if (firebaseUser) {
                setLoading(true);
                const userRef = doc(db, "users", firebaseUser.uid);
                unsubscribeUserDoc = onSnapshot(userRef,
                    (docSnap) => {
                        if (docSnap.exists()) {
                            setUser({ uid: docSnap.id, ...docSnap.data() } as SovereignUser);
                        }
                        // If doc doesn't exist, we just wait for the registration flow to create it.
                        setLoading(false);
                    },
                    (error) => {
                        trackSovereignError(error, { context: "User_Doc_Listener" });
                        setUser(null);
                        setLoading(false);
                    }
                );
            } else {
                // 🚩 [SCR-CMD-BYPASS-V2] Dynamic Sovereign Bypass Protocol for Development
                if (import.meta.env.DEV) {
                    const savedBypass = localStorage.getItem('sovereign_dev_bypass_user');
                    if (savedBypass) {
                        try {
                            setUser(JSON.parse(savedBypass) as SovereignUser);
                        } catch (e) {
                            setUser(null);
                        }
                    } else {
                        setUser(null);
                    }
                    setLoading(false);
                } else {
                     setUser(null);
                     setLoading(false);
                }
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeUserDoc) {
                unsubscribeUserDoc();
            }
        };
    }, []);


    const loginAsMockUser = useCallback((mockUser: SovereignUser) => {
        if (import.meta.env.DEV) {
            localStorage.setItem('sovereign_dev_bypass_user', JSON.stringify(mockUser));
            setUser(mockUser);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('sovereign_dev_bypass_user');
        setUser(null);
        signOut(auth).catch((error) => {
            trackSovereignError(error, { context: 'Logout_Execution' });
        });
    }, []);
    
    const isSovereign = useMemo(() => user?.role === 'admin', [user]);
    const isCaptain = useMemo(() => user?.role === 'driver', [user]);
    const isPassenger = useMemo(() => user?.role === 'rider', [user]);

    const value = useMemo(() => ({ 
        user, 
        loading, 
        promoData, 
        logout, 
        loginAsMockUser,
        isSovereign, 
        isCaptain, 
        isPassenger 
    }), [user, loading, promoData, logout, loginAsMockUser, isSovereign, isCaptain, isPassenger]);

    if (loading && !user) { return null; }

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
