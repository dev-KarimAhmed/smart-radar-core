'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { onAuthStateChanged, signOut, signInAnonymously, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
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
  isDelegate: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthContent({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SovereignUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [promoData, setPromoData] = useState<any>(null);
    
    const { registerDeviceToken } = useSovereignFCM();

    useEffect(() => {
      if (user?.uid) {
        registerDeviceToken(user);
      }
    }, [user?.uid, registerDeviceToken]);
    
    useEffect(() => {
        if (!user?.uid) {
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
    }, [user?.uid]);
    
    useEffect(() => {
        let unsubscribeUserDoc: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (unsubscribeUserDoc) {
                unsubscribeUserDoc();
                unsubscribeUserDoc = null;
            }

            // Check if there is a dynamic bypass user first (only in DEV)
            const savedBypassStr = import.meta.env.DEV ? localStorage.getItem('sovereign_dev_bypass_user') : null;
            let bypassUser: SovereignUser | null = null;
            if (savedBypassStr) {
                try {
                    bypassUser = JSON.parse(savedBypassStr) as SovereignUser;
                } catch (e) {
                    console.error("Failed to parse sovereign_dev_bypass_user from localStorage:", e);
                }
            }

            if (bypassUser) {
                // If not authenticated dynamically in Firebase, authenticate anonymously in background
                if (!firebaseUser) {
                    setLoading(true);
                    try {
                        await signInAnonymously(auth);
                    } catch (err) {
                        trackSovereignError(err, { context: 'Bypass_Anonymous_SignIn' });
                    }
                } else {
                    // Sync the bypass user properties to Firestore to align security tokens
                    try {
                        const userRef = doc(db, 'users', firebaseUser.uid);
                        const syncedUser = {
                            uid: firebaseUser.uid,
                            name: bypassUser.name,
                            role: bypassUser.role,
                            governorate: bypassUser.governorate || 'عمان',
                            district: bypassUser.district || 'الجامعة',
                            phone: bypassUser.phone || '',
                            isBufferActive: false,
                            referralCode: bypassUser.referralCode || '',
                            referredCount: bypassUser.referredCount || 0,
                            pendingDues: bypassUser.pendingDues || 0
                        };
                        await setDoc(userRef, syncedUser, { merge: true });
                        setUser(syncedUser as SovereignUser);
                        setLoading(false);
                    } catch (err) {
                        console.error('Error syncing bypass user to Firestore:', err);
                        setUser(bypassUser);
                        setLoading(false);
                    }
                }
            } else if (firebaseUser) {
                setLoading(true);
                const userRef = doc(db, "users", firebaseUser.uid);
                unsubscribeUserDoc = onSnapshot(userRef,
                    (docSnap) => {
                        if (docSnap.exists()) {
                            setUser({ uid: docSnap.id, ...docSnap.data() } as SovereignUser);
                        }
                        setLoading(false);
                    },
                    (error) => {
                        trackSovereignError(error, { context: "User_Doc_Listener" });
                        setUser(null);
                        setLoading(false);
                    }
                );
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeUserDoc) {
                unsubscribeUserDoc();
            }
        };
    }, []);


    const loginAsMockUser = useCallback(async (mockUser: SovereignUser) => {
        if (import.meta.env.DEV) {
            setLoading(true);
            localStorage.setItem('sovereign_dev_bypass_user', JSON.stringify(mockUser));
            
            // Force sign out to ensure a fresh, pristine anonymous session.
            // This guarantees resource == null, which satisfies all Firestore Security Rules for role assignment.
            try {
                await signOut(auth);
            } catch (err) {
                console.warn('Bypass sign-out warning:', err);
            }

            try {
                await signInAnonymously(auth);
            } catch (err) {
                trackSovereignError(err, { context: 'MockUser_Anonymous_SignIn' });
                // Fallback to local representation in case of connection failure
                setUser(mockUser);
                setLoading(false);
            }
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
        isDelegate
    }), [user, loading, promoData, logout, loginAsMockUser, isSovereign, isCaptain, isPassenger, isDelegate]);

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
