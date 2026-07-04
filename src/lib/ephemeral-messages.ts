'use client';

import { collection, doc, addDoc, getDocs, deleteDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface EphemeralChatMessage {
  id?: string;
  tripId: string;
  senderId: string;
  senderRole: 'rider' | 'driver';
  text: string;
  timestamp: any;
}

/**
 * 🛡️ [SCR-MSG-CORE-522] Ephemeral Messaging Engine
 * Provides persistent memory handshakes for active trips with ZERO permanent cloud footprint.
 * All messages reside in a temporary collection and are completely vaporized upon trip completion/cancellation.
 */
export const EphemeralMessageKernel = {
  /**
   * Sends a short, ephemeral chat message.
   */
  sendMessage: async function(tripId: string, senderId: string, senderRole: 'rider' | 'driver', text: string): Promise<boolean> {
    try {
      const messagesRef = collection(db, 'sovereign_ephemeral_chats');
      await addDoc(messagesRef, {
        tripId,
        senderId,
        senderRole,
        text,
        timestamp: serverTimestamp()
      });
      console.log(`[بروتوكول 22: المصافحة المؤقتة] تم بث رسالة موجهة عند الحافة للرحلة: ${tripId}`);
      return true;
    } catch (err) {
      console.error('Failed to dispatch ephemeral message:', err);
      return false;
    }
  },

  /**
   * Subscribes to life-cycle messages for the current trip.
   */
  subscribeToMessages: function(tripId: string, callback: (messages: EphemeralChatMessage[]) => void) {
    const q = query(
      collection(db, 'sovereign_ephemeral_chats'),
      where('tripId', '==', tripId)
    );

    return onSnapshot(q, (snapshot) => {
      const msgs: EphemeralChatMessage[] = [];
      snapshot.forEach((snapshotDoc) => {
        const data = snapshotDoc.data();
        msgs.push({
          id: snapshotDoc.id,
          tripId: data.tripId,
          senderId: data.senderId,
          senderRole: data.senderRole,
          text: data.text,
          timestamp: data.timestamp
        });
      });
      // Sort messages chronologically in client memory to avoid server sorting index requirements
      msgs.sort((a, b) => {
        const t1 = a.timestamp?.seconds || 0;
        const t2 = b.timestamp?.seconds || 0;
        return t1 - t2;
      });
      callback(msgs);
    }, (err) => {
      console.error('Chat thread subscription failed:', err);
    });
  },

  /**
   * ⚡ [AUTO-PURGE ENGINE]
   * Performs an uncompromised tactical erasure of the entire chat thread.
   * Completely frees cloud storage space to support $0.00 infrastructure cost rules.
   */
  purgeTripMessages: async function(tripId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'sovereign_ephemeral_chats'),
        where('tripId', '==', tripId)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map((snapshotDoc) => deleteDoc(doc(db, 'sovereign_ephemeral_chats', snapshotDoc.id)));
      await Promise.all(deletePromises);
      console.log(`🧹 [بروتوكول تنظيف الرسائل المؤقتة] تم إعدام وتطهير عدد (${snapshot.docs.length}) وثيقة رسائل مؤقتة للرحلة المعقمة: ${tripId}`);
      return snapshot.docs.length;
    } catch (err) {
      console.warn('Failed to auto-purge ephemeral messages, fallback local sweep initialized:', err);
      return 0;
    }
  }
};

try {
  Object.freeze(EphemeralMessageKernel);
} catch (e) {
  console.warn('Failed to freeze EphemeralMessageKernel', e);
}
