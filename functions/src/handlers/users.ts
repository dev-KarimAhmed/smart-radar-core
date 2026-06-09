import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { SOVEREIGN_CONSTANTS } from '../core/constants';
import { verifySovereignAccess } from '../core/guards';

const db = admin.firestore();

export const listSovereignFleet = functions.https.onCall(async (data, context) => {
    verifySovereignAccess(context);
    const snapshot = await db.collection('users').where('role', '==', 'driver').limit(SOVEREIGN_CONSTANTS.RADAR_SCAN_LIMIT).get();
    return snapshot.docs.map(doc => ({
        uid: doc.id, name: doc.data().name, rank: doc.data().rank || 'Bronze',
        rating: doc.data().rating || 0, heartCount: doc.data().heartCount || 0, status: doc.data().status || 'idle'
    }));
});

export const registerSovereignUser = functions.https.onCall(async (payload, context) => {
    try {
        verifySovereignAccess(context);
        const { deviceId, role, name, phone, gov, district, affiliation, vehicle } = payload;
        const uid = context.auth!.uid;
        
        if (role === 'driver' && deviceId) {
            const snapshot = await db.collection('users').where('role', '==', 'driver').where('deviceId', '==', deviceId).limit(1).get();
            if (!snapshot.empty) throw new functions.https.HttpsError('permission-denied', 'SYBIL_ATTACK_DETECTED.');
        }
        
        await admin.auth().setCustomUserClaims(uid, { role });
        const newUser: { [key: string]: any } = { uid, phone, role, name, governorate: gov, district, deviceId: deviceId || null, avatar: `https://picsum.photos/seed/${uid}/100/100`, createdAt: admin.firestore.FieldValue.serverTimestamp() };
        
        if (role === 'driver') {
            Object.assign(newUser, { affiliation, vehicle, rating: 5.0, status: 'idle', rank: 'Bronze', penaltyCount: 0 });
        }
        
        await db.collection('users').doc(uid).set(newUser);
        return { success: true };
    } catch (error: any) {
        console.error("CRITICAL ERROR in registerSovereignUser:", error);
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred.');
    }
});

export const updateSovereignPricing = functions.https.onCall(async (data, context) => {
    verifySovereignAccess(context);
    const { baseFare, perKm, perMin, activeDistrict } = data;
    const userRef = db.collection('users').doc(context.auth.uid);
    const userDoc = await userRef.get();
    const district = activeDistrict || userDoc.data()?.district;
    if (!district) throw new functions.https.HttpsError('invalid-argument', 'District required.');
    
    return { success: true, momentum: 'STABLE' };
});
