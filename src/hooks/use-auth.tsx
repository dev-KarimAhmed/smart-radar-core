'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { onAuthStateChanged, signOut, signInAnonymously, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
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
  suspendUserDocListener: () => void;
  resumeUserDocListener: () => void;
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
    
    const userRefRef = useRef<any>(null);
    const unsubscribeUserDocRef = useRef<(() => void) | null>(null);

    const suspendUserDocListener = useCallback(() => {
        if (unsubscribeUserDocRef.current) {
            console.log("🛡️ [Protocol 88]: Unsubscribing from user doc real-time listener to prevent chatty updates during transaction.");
            unsubscribeUserDocRef.current();
            unsubscribeUserDocRef.current = null;
        }
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('sovereign_write_lock', 'true');
        }
    }, []);

    const resumeUserDocListener = useCallback(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('sovereign_write_lock');
        }
        if (userRefRef.current && !unsubscribeUserDocRef.current) {
            console.log("🛡️ [Protocol 88]: Resuming user doc real-time listener after transaction completed.");
            
            getDoc(userRefRef.current).then((docSnap) => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setUser({ uid: docSnap.id, ...(userData as any) } as SovereignUser);
                }
                
                const userData = docSnap.data() as any;
                const isIndependent = userData?.subRole === 'independent';
                if (!isIndependent) {
                    unsubscribeUserDocRef.current = onSnapshot(userRefRef.current,
                        (snapshot: any) => {
                            if (snapshot.exists()) {
                                setUser({ uid: snapshot.id, ...snapshot.data() } as SovereignUser);
                            }
                        },
                        (error: any) => {
                            trackSovereignError(error, { context: "User_Doc_Listener_Resume" });
                        }
                    );
                }
            }).catch((error: any) => {
                trackSovereignError(error, { context: "User_Doc_Fetch_Resume" });
            });
        }
    }, []);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (unsubscribeUserDocRef.current) {
                unsubscribeUserDocRef.current();
                unsubscribeUserDocRef.current = null;
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
                        userRefRef.current = userRef;
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
                userRefRef.current = userRef;
                
                getDoc(userRef).then((docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        const isIndependent = userData?.subRole === 'independent';
                        setUser({ uid: docSnap.id, ...userData } as SovereignUser);
                        
                        if (isIndependent) {
                            // Protocol 88: One-time read only. Do NOT subscribe.
                            setLoading(false);
                        } else {
                            // Captain or standard user: subscribe to real-time updates
                            unsubscribeUserDocRef.current = onSnapshot(userRef,
                                (snapshot) => {
                                    if (snapshot.exists()) {
                                        // 🛡️ [حارس قفل الكتابة التفاعلي المانع لتراجع الحالة V2.6-Secured]
                                        // عند وجود قفل نشط (مثل أثناء شحن المحفظة أو تقييم السائق)، يتم تجميد وتأخير استهلاك اللقطة (Snapshot)
                                        // لمنع ارتداد الحالة المحلية للواجهة قبل اكتمال النشر السحابي بالكامل.
                                        const isLockActive = typeof window !== 'undefined' && sessionStorage.getItem('sovereign_write_lock') === 'true';
                                        if (isLockActive) {
                                            console.log("🛡️ [Snapshot Write Lock Guard]: Delayed snapshot consumption during active write lock.");
                                            return;
                                        }
                                        setUser({ uid: snapshot.id, ...snapshot.data() } as SovereignUser);
                                    }
                                    setLoading(false);
                                },
                                (error) => {
                                    trackSovereignError(error, { context: "User_Doc_Listener" });
                                    setLoading(false);
                                }
                            );
                        }
                    } else {
                        setUser(null);
                        setLoading(false);
                    }
                }).catch((error) => {
                    trackSovereignError(error, { context: "User_Doc_Fetch" });
                    setUser(null);
                    setLoading(false);
                });
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeUserDocRef.current) {
                unsubscribeUserDocRef.current();
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
        isDelegate,
        suspendUserDocListener,
        resumeUserDocListener
    }), [user, loading, promoData, logout, loginAsMockUser, isSovereign, isCaptain, isPassenger, isDelegate, suspendUserDocListener, resumeUserDocListener]);

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
