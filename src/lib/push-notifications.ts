'use client';

import { collection, addDoc, onSnapshot, query, where, orderBy, limit, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface SilentPushPayload {
  id?: string;
  type: 'PURGE_AD' | 'GLOBAL_FREEZE' | 'REGIONAL_ALERT' | 'ORDER_BROADCAST' | 'OFFER_DELIVERY' | 'PROFESSIONAL_BROADCAST' | 'GEO_DISTRICT_BROADCAST';
  targetDistrict?: string;
  targetId?: string; // Optional target ad ID or event ID
  message?: string;
  createdAt?: any;
  targetH3Cell?: string;
  targetCaptainType?: 'uber' | 'careem' | 'independent';
  targetGovernorate?: string;
  actionUrl?: string;
}

/**
 * 🛡️ [RAD-MAP-076-KILL-SWITCH] Sovereign Push-Notifications Client
 * Manages real-time silent push broadcast subscription and event notifications.
 * Uses a zero-read cost stream optimization for passive receivers.
 */

/**
 * 1. إشعارات وصول الطلبات (Order Broadcast Notification)
 * Targets captains within the k-ring of the rider based on matching current H3 index cells.
 */
export async function dispatchOrderNotification(h3Cell: string, tripId: string, message: string) {
  return broadcastSilentPush({
    type: 'ORDER_BROADCAST',
    targetH3Cell: h3Cell,
    targetId: tripId,
    message,
    targetDistrict: 'H3_REGULATION'
  });
}

/**
 * 2. إشعارات وصول العروض (Offer Delivery Notification)
 * Targets the specific rider when a Captain submits a live bid.
 */
export async function dispatchOfferNotification(riderId: string, tripId: string, message: string) {
  return broadcastSilentPush({
    type: 'OFFER_DELIVERY',
    targetId: tripId,
    targetDistrict: riderId, // Reuse field so that the rider selectively triggers
    message
  });
}

/**
 * 3. رسائل المالك حسب الفئات المهنية (Owner Professional Broadcast)
 * Dispatches a message filtered at edge strictly for relevant captain classes.
 */
export async function dispatchProfessionalNotification(captainType: 'uber' | 'careem' | 'independent', message: string) {
  return broadcastSilentPush({
    type: 'PROFESSIONAL_BROADCAST',
    targetCaptainType: captainType,
    message
  });
}

/**
 * 4. رسائل المالك حسب التقسيم الجغرافي (Owner Geo-District Broadcast)
 * Delivers bulletins based on the user's specific district and governorate codes.
 */
export async function dispatchGeoDistrictNotification(governorate: string, district: string, message: string) {
  return broadcastSilentPush({
    type: 'GEO_DISTRICT_BROADCAST',
    targetGovernorate: governorate,
    targetDistrict: district,
    message
  });
}

/**
 * Broadcasts a silent push event under administrative authority.
 */
export async function broadcastSilentPush(payload: Omit<SilentPushPayload, 'createdAt'>) {
  try {
    const pushId = 'push-' + Date.now();
    await setDoc(doc(db, 'sovereign_pushes', pushId), {
      ...payload,
      createdAt: serverTimestamp()
    });
    console.log(`[بروتوكول 30: ديكتاتورية الخادم] تم إرسال إشارة الإبادة اللحظية: ${payload.type}`, payload);
    return true;
  } catch (err) {
    console.error('Failed to broadcast silent push notification:', err);
    return false;
  }
}

/**
 * Subscribes user devices (Riders / Captains) to silent push streams.
 * If targeted notifications or global commands are dispatched, triggers callback instantly.
 */
export function subscribeToSilentPushes(callback: (payload: SilentPushPayload) => void) {
  // Listen for pushes in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const pushQuery = query(
    collection(db, 'sovereign_pushes'),
    orderBy('createdAt', 'desc'),
    limit(5)
  );

  return onSnapshot(pushQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data();
        callback({
          id: change.doc.id,
          type: data.type,
          targetDistrict: data.targetDistrict,
          targetId: data.targetId,
          message: data.message,
          createdAt: data.createdAt
        });
      }
    });
  }, (err) => {
    console.error('Push connection interrupted, silent bypass active:', err);
  });
}
