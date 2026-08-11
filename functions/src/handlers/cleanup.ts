
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const purgeExpiredBuffers = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  const now = admin.firestore.Timestamp.now();
  const ridersWithBuffer = await db.collection('users')
    .where('role', '==', 'rider')
    .where('isBufferActive', '==', true)
    .where('lastTripBuffer.expiresAt', '<=', now)
    .get();

  if (ridersWithBuffer.empty) {
    console.log("[SC-55] No expired buffers to purge.");
    return null;
  }

  const batch = db.batch();
  ridersWithBuffer.forEach((doc) => {
    batch.update(doc.ref, {
      isBufferActive: false,
      lastTripBuffer: admin.firestore.FieldValue.delete()
    });
  });

  await batch.commit();
  console.log(`[SC-55] Purged ${ridersWithBuffer.size} expired buffers.`);
  return null;
});

export const purgeExpiredTrips72Hours = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  const nowMs = Date.now();
  const seventyTwoHoursAgo = admin.firestore.Timestamp.fromMillis(nowMs - 72 * 60 * 60 * 1000);
  
  const expiredTrips = await db.collection('trips')
    .where('createdAt', '<=', seventyTwoHoursAgo)
    .limit(100)
    .get();

  if (expiredTrips.empty) {
    console.log("[SC-55] No expired trip logs older than 72 hours to purge.");
    return null;
  }

  const batch = db.batch();
  expiredTrips.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`[SC-55] Purged ${expiredTrips.size} expired trip logs older than 72 hours.`);
  return null;
});

