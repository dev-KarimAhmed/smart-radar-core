
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
