import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { calculateSovereignDistance } from "../core/geospatial";

const db = admin.firestore();

/**
 * [SCR-2026-047] المقصلة السحابية والاعتذار الآلي (The Cloud Guillotine)
 * تلتزم بالمادة (5) SSOT: تستورد محرك المسافات المركزي.
 */
export const onTripHandshake = functions.firestore
    .document('trips/{tripId}')
    .onUpdate(async (change, context) => {
        const tripBefore = change.before.data();
        const tripAfter = change.after.data();

        if (tripBefore.status !== 'busy' && tripAfter.status === 'busy') {
            const driverId = tripAfter.driverId;
            if (!driverId) return null;

            const driverDoc = await db.collection('users').doc(driverId).get();
            const startLocation = driverDoc.data()?.location;

            if (startLocation) {
                await change.after.ref.update({ ghostBusterStartLocation: startLocation });
            }

            // مؤقت الـ 3 دقائق (المقصلة الميدانية)
            setTimeout(async () => {
                const currentTrip = await change.after.ref.get();
                const data = currentTrip.data();

                if (data?.status === 'busy' && data?.driverId === driverId) {
                    const latestDriverDoc = await db.collection('users').doc(driverId).get();
                    const latestLoc = latestDriverDoc.data()?.location;

                    if (latestLoc && startLocation) {
                        const dist = calculateSovereignDistance(startLocation.lat, startLocation.lng, latestLoc.lat, latestLoc.lng);

                        if (dist < 0.1) { 
                            console.error(`[Guillotine] Executing Ghost Driver ${driverId} for trip ${context.params.tripId}`);
                            
                            await db.runTransaction(async (t) => {
                                // 1. عقوبة السائق (القصاص)
                                t.update(db.collection('users').doc(driverId), {
                                    penaltyCount: admin.firestore.FieldValue.increment(1),
                                    ratingSum: admin.firestore.FieldValue.increment(-15), 
                                    status: 'idle'
                                });

                                // 2. تعويض الراكب (الاعتذار والتدوير)
                                t.update(change.after.ref, {
                                    status: 'searching',
                                    driverId: admin.firestore.FieldValue.delete(),
                                    offerPrice: admin.firestore.FieldValue.delete(),
                                    rejectedDrivers: admin.firestore.FieldValue.arrayUnion(driverId),
                                    riderNotification: 'نعتذر، تم استبعاد الناقل لعدم التزامه بالحركة. جاري تعويضك بأقرب ناقل نشط فوراً.',
                                    auditLog: admin.firestore.FieldValue.arrayUnion(`Ghost Execution: Zero displacement detected.`)
                                });
                            });
                        }
                    }
                }
            }, 180000); 
        }
        return null;
    });

export const requestRide = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.');
    const riderId = context.auth.uid;
    let riderRating = 5.0;
    let riderRatingSum = 0;
    let riderRatingCount = 0;
    let riderName = 'فارس الأفق';

    try {
        const riderDoc = await db.collection('users').doc(riderId).get();
        if (riderDoc.exists) {
            const rData = riderDoc.data();
            riderName = rData?.name || 'فارس الأفق';
            riderRatingSum = rData?.ratingSum || 0;
            riderRatingCount = rData?.ratingCount || 0;
            if (rData?.rating !== undefined) {
                riderRating = rData.rating;
            } else if (riderRatingSum && riderRatingCount) {
                riderRating = riderRatingSum / riderRatingCount;
            }
        }
    } catch (e) {
        console.error('Failed to pre-fetch rider profile, safe defaults applied:', e);
    }

    const tripRef = await db.collection('trips').add({
        ...data,
        riderId,
        riderRating,
        riderRatingSum,
        riderRatingCount,
        riderName,
        status: 'searching',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        auditLog: [`Trip launched via Sovereign Ingestion at ${new Date().toISOString()}`]
    });
    return { tripId: tripRef.id };
});
