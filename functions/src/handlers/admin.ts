import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { verifyAdminAccess } from '../core/guards';
const db = admin.firestore();

export const toggleSovereignKillSwitch = functions.https.onCall(async (data, context) => {
    verifyAdminAccess(context);
    const stateRef = db.collection('settings').doc('system_state');
    return await db.runTransaction(async (transaction) => {
        const stateDoc = await transaction.get(stateRef);
        const newStatus = stateDoc.exists ? !stateDoc.data()?.isRadarActive : false;
        transaction.set(stateRef, { isRadarActive: newStatus, lastModifiedBy: context.auth.uid, lastModifiedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        return { success: true, isRadarActive: newStatus };
    });
});

export const adminUpdateFuelIndex = functions.https.onCall(async (data, context) => {
    verifyAdminAccess(context);
    const { district, price } = data;
    if (!district || !price || price <= 0) throw new functions.https.HttpsError('invalid-argument', 'بيانات غير صالحة.');
    
    await db.collection('settings').doc('fuel_prices').collection('districts').doc(district).set({
        pricePerLiter: price, lastUpdated: admin.firestore.FieldValue.serverTimestamp(), updatedBy: context.auth.uid,
    }, { merge: true });
    return { success: true };
});

export const syncMarketPulse = functions.pubsub.schedule('every 25 minutes').timeZone('Asia/Amman').onRun(async () => {
    const users = await db.collection('users').get();
    const marketData: { [key: string]: { demand: number; supply: number; } } = {};
    users.docs.forEach(doc => {
        const u = doc.data();
        if (!u.district) return;
        if (!marketData[u.district]) marketData[u.district] = { demand: 0, supply: 0 };
        if (u.role === 'driver' && u.status === 'active') marketData[u.district].supply++;
    });
    
    const trips = await db.collection('trips').where('status', '==', 'searching').get();
    trips.docs.forEach(doc => {
        const t = doc.data();
        if (t.district && marketData[t.district]) marketData[t.district].demand++;
    });
    
    const batch = db.batch();
    for (const district in marketData) {
        const d = marketData[district];
        const balance = d.supply > 0 ? d.demand / d.supply : d.demand;
        const trend = balance > 1.5 ? 'high_demand' : (d.supply > 0 && d.demand === 0 ? 'high_supply' : 'balanced');
        batch.set(db.collection('market_pulse').doc(district), { demand: d.demand, supply: d.supply, balance: parseFloat(balance.toFixed(2)), trend, lastUpdated: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
    await batch.commit();
    return null;
});
