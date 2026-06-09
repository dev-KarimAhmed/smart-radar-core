
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { verifySovereignAccess } from '../core/guards';
import { calculateSovereignRank } from "../core/utils";
const db = admin.firestore();

export const submitTripFeedback = functions.https.onCall(async (data, context) => {
    verifySovereignAccess(context);
    const riderId = context.auth!.uid; // Safe after verifySovereignAccess
    const { tripId, driverId, vehicleId, driverRating, vehicleRating, giveHeart, sensory } = data;
    
    if (!tripId || !driverId || !vehicleId || !driverRating || !vehicleRating || !sensory) {
        throw new functions.https.HttpsError('invalid-argument', 'SENSORY_MISSING: بيانات الرحلة أو التقييمات الأساسية مفقودة.');
    }
    
    await db.runTransaction(async (transaction) => {
        const tripRef = db.collection('trips').doc(tripId);
        const driverRef = db.collection('users').doc(driverId);
        const riderRef = db.collection('users').doc(riderId);
        const vehicleRef = db.collection('vehicles').doc(vehicleId);

        const [tripDoc, driverDoc] = await Promise.all([
            transaction.get(tripRef),
            transaction.get(driverRef),
        ]);
        
        if (!tripDoc.exists || !driverDoc.exists) throw new functions.https.HttpsError('not-found', 'سجل مفقود.');
        
        const tripData = tripDoc.data()!;
        const driverData = driverDoc.data()!;

        if (tripData.riderId !== riderId) throw new functions.https.HttpsError('permission-denied', 'لا تملك صلاحية.');
        if (tripData.isRatedByRider) throw new functions.https.HttpsError('already-exists', 'FEEDBACK_001: تم التقييم مسبقاً.');
        
        // Driver Rating Update
        const newDriverSum = (driverData.ratingSum || 0) + driverRating;
        const newDriverCount = (driverData.ratingCount || 0) + 1;
        const driverUpdate: { [key: string]: any } = { 
            ratingSum: newDriverSum, 
            ratingCount: newDriverCount, 
            rating: newDriverSum / newDriverCount 
        };
        if (giveHeart) driverUpdate.heartCount = admin.firestore.FieldValue.increment(1);
        transaction.update(driverRef, driverUpdate);
        
        // Rider State Update (with 24h buffer window)
        const riderUpdate: { [key: string]: any } = {
            isRatingRequired: false,
            isBufferActive: true,
            lastTripBuffer: {
                driverId: driverId,
                driverName: driverData.name,
                driverPhone: driverData.phone,
                expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
            }
        };

        if (giveHeart) {
            riderUpdate.favoriteDrivers = admin.firestore.FieldValue.arrayUnion(driverId);
        }
        transaction.update(riderRef, riderUpdate);
        
        // Vehicle Rating Update (The Core Fix)
        const vehicleUpdatePayload = {
            ratingSum: admin.firestore.FieldValue.increment(vehicleRating),
            ratingCount: admin.firestore.FieldValue.increment(1),
            quietnessSum: admin.firestore.FieldValue.increment(sensory.quietness || 0),
            cleanlinessSum: admin.firestore.FieldValue.increment(sensory.cleanliness || 0),
            adherenceSum: admin.firestore.FieldValue.increment(sensory.adherence || 0),
            lastTripId: tripId,
        };

        // 🚀 Sovereign Zero-Waste Optimization: Create or update vehicle doc with 0 reads.
        transaction.set(vehicleRef, { 
            ...vehicleUpdatePayload,
            plateNumber: vehicleId,
         }, { merge: true });

        // Trip State Update
        transaction.update(tripRef, { isRatedByRider: true, status: 'archived', completedAt: admin.firestore.FieldValue.serverTimestamp() });
    });

    return { success: true };
});

export const generateWeeklyReport = functions.https.onCall(async (data, context) => {
    verifySovereignAccess(context);
    const driverRef = db.collection('users').doc(context.auth.uid);
    return await db.runTransaction(async (transaction) => {
        const driverDoc = await transaction.get(driverRef);
        if (!driverDoc.exists) throw new functions.https.HttpsError('not-found', 'ملف الكابتن غير موجود.');
        const driverData = driverDoc.data();
        if (!driverData.ratingCount) return { success: false, message: 'COURT_001: لا يوجد نبض جديد.', rank: driverData.rank || 'Bronze' };
        
        const newRank = calculateSovereignRank(driverData.rating || 0, driverData.heartCount || 0);
        transaction.update(driverRef, { rank: newRank, lastReportDate: admin.firestore.FieldValue.serverTimestamp() });
        return { success: true, stats: { averageRating: driverData.rating, heartCount: driverData.heartCount, newRank } };
    });
});

export const submitRiderRating = functions.https.onCall(async (data, context) => {
    verifySovereignAccess(context);
    const { tripId, riderId, rating } = data;
    if (!tripId || !riderId || !rating) throw new functions.https.HttpsError('invalid-argument', 'بيانات مفقودة.');
    
    await db.runTransaction(async (transaction) => {
        const tripRef = db.collection('trips').doc(tripId);
        const riderRef = db.collection('users').doc(riderId);
        const tripDoc = await transaction.get(tripRef);
        
        if (!tripDoc.exists || tripDoc.data()?.driverId !== context.auth.uid) throw new functions.https.HttpsError('permission-denied', 'رفض.');
        
        const rData = (await transaction.get(riderRef)).data() || {};
        const newCount = (rData.ratingCount || 0) + 1;
        const newSum = (rData.ratingSum || 0) + rating;
        
        transaction.update(riderRef, { ratingSum: newSum, ratingCount: newCount, rating: newSum / newCount });
        transaction.update(tripRef, { status: 'archived', isRatedByDriver: true, completedAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    return { success: true };
});
