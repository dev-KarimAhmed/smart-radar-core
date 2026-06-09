'use client';

import { useCallback } from 'react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { trackSovereignError } from '@/lib/error-tracker';
import type { User } from '@/core/types';

export const useSovereignFCM = () => {
    const registerDeviceToken = useCallback(async (currentUser: User | null) => {
        if (!currentUser || typeof window === 'undefined' || !('Notification' in window)) return;

        if (process.env.NODE_ENV === 'development') {
            console.warn('[Sovereign FCM] Push notifications are disabled in development environment to prevent ServiceWorker errors. This is normal.');
            return;
        }

        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.warn('[Sovereign FCM] VAPID key is not configured. Skipping push notification registration.');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                const { getMessaging, getToken } = await import('firebase/messaging');
                const messaging = getMessaging();
                const currentToken = await getToken(messaging, { vapidKey });

                if (currentToken) {
                    const userRef = doc(db, 'users', currentUser.uid);
                    
                    if (!currentUser.fcmTokens?.includes(currentToken)) {
                      await updateDoc(userRef, {
                        fcmTokens: arrayUnion(currentToken)
                      });
                      console.log('FCM device token registered.');
                    }
                }
            } else {
                 console.warn('Notification permission denied.');
            }
        } catch (error) {
            trackSovereignError(error, { context: 'RegisterDeviceToken' });
        }
    }, []);

    return { registerDeviceToken };
};
