'use client';

import { useCallback } from 'react';
import type { User } from '@/core/types';

/**
 * [ACT-PWA-05] Sovereign Push Notification Hook
 * Pruned dead Firestore writes and legacy FCM SDK coupling in favor of sovereign Web Push standards.
 */
export const useSovereignFCM = () => {
    const registerDeviceToken = useCallback(async (currentUser: User | null) => {
        if (!currentUser || typeof window === 'undefined' || !('Notification' in window)) return;

        try {
            if (Notification.permission === 'default') {
                await Notification.requestPermission();
            }
        } catch {
            // Non-blocking sovereign permission handling
        }
    }, []);

    return { registerDeviceToken };
};
