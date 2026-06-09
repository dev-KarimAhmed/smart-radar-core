import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { verifySovereignAccess } from '../core/guards';

const db = admin.firestore();

export const getCurrentDistrictByCoords = functions.https.onCall(async (data, context) => {
    verifySovereignAccess(context);
    const { lat, lng } = data;
    if (!lat || !lng) throw new functions.https.HttpsError('invalid-argument', 'Coordinates missing.');
    
    const gridLat = (Math.floor(lat * 100) / 100).toFixed(2);
    const gridLng = (Math.floor(lng * 100) / 100).toFixed(2);
    const geoRef = db.collection('geographical_registry').doc(`${gridLat}_${gridLng}`);
    const geoDoc = await geoRef.get();
    
    if (geoDoc.exists) return { district: geoDoc.data()?.districtName };
    
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    return { district: userDoc.data()?.district || "Unknown" };
});
