import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { verifyAdminAccess } from '../core/guards';

const db = admin.firestore();

// دالة الدرع العاكس: تتعامل مع طلبات الواجهة المتمردة (postJSON) بقوة جبرية
export const syncAdStats = functions.https.onRequest(async (req, res) => {
    
    // [درع الثقب الأسود] - حقن الترويسات بالقوة الجبرية
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.set('Access-Control-Allow-Headers', '*');
    res.set('Access-Control-Allow-Credentials', 'true');

    // قطع الطريق على المتصفح: الرد فوراً قبل أي تفكير
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    // المنطق التشغيلي
    try {
        const stats = req.body.stats;

        if (!stats || typeof stats !== 'object' || Object.keys(stats).length === 0) {
            console.warn('syncAdStats called with empty or invalid payload.');
            res.status(200).json({ success: true, message: 'No stats to sync.' });
            return;
        }

        const batch = db.batch();

        for (const adId in stats) {
            for (const district in stats[adId]) {
                const districtStats = stats[adId][district];
                if (districtStats && (districtStats.impressions > 0 || districtStats.clicks > 0)) {
                    const statRef = db.doc(`ad_stats/${adId}/districts/${district}`);
                    batch.set(statRef, {
                        impressions: admin.firestore.FieldValue.increment(districtStats.impressions || 0),
                        clicks: admin.firestore.FieldValue.increment(districtStats.clicks || 0)
                    }, { merge: true });
                }
            }
        }

        await batch.commit();
        
        // الرد الإيجابي لإسكات أخطاء الواجهة
        res.status(200).json({ 
            success: true, 
            message: "Sovereign Ad Stats engulfed by the Black Hole." 
        });
    } catch (error) {
        console.error("Black Hole Error:", error);
        res.status(500).json({ error: "Internal Sovereign Error" });
    }
});


export const createSovereignAd = functions.https.onCall(async (data, context) => {
  verifyAdminAccess(context); // Use the existing helper for security

  const newAd = {
    ...data, // data is of type AdInput from the frontend
    currentImpressions: 0,
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  const adRef = await db.collection('ads').add(newAd); // Use 'ads' collection
  return { id: adRef.id, status: 'injected' };
});
