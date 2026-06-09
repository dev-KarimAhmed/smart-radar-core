import { doc, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { trackSovereignError } from './error-tracker';

interface AdMetrics {
  impressions: number;
  clicks: number;
}

interface BatchStore {
  [adId: string]: AdMetrics;
}

const STORAGE_KEY = 'sovereign_ad_edge_batch';
const FLUSH_THRESHOLD = 50; // المادة (13) عتبة الـ 50 مشاهدة

// دالة جلب المخزن الجاري من الحافة
function getLocalBatch(): BatchStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

// دالة حفظ المخزن الجاري في الحافة
function saveLocalBatch(batch: BatchStore) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(batch));
  } catch (e) {
    trackSovereignError(e, { context: 'SaveAdBatch_LocalStorage' });
  }
}

/**
 * تسجل مشاهدة محلية دون الاتصال بالسيرفر (صفر كلفة)
 */
export function recordLocalImpression(adId: string) {
  const batch = getLocalBatch();
  if (!batch[adId]) {
    batch[adId] = { impressions: 0, clicks: 0 };
  }
  batch[adId].impressions += 1;
  saveLocalBatch(batch);

  // فحص عتبة الـ 50 مشاهدة الإجمالية للنبضة العكسية المجمعة
  const totalImpressions = Object.values(batch).reduce((sum, item) => sum + item.impressions, 0);
  if (totalImpressions >= FLUSH_THRESHOLD) {
    console.log(`[بروتوكول صفر كلفة] عتبة الـ 50 مشاهدة اكتملت. إطلاق النبضة العكسية المجمعة...`);
    flushAdMetrics();
  }
}

/**
 * تسجل نقرة محلية دون الاتصال بالسيرفر
 */
export function recordLocalClick(adId: string) {
  const batch = getLocalBatch();
  if (!batch[adId]) {
    batch[adId] = { impressions: 0, clicks: 0 };
  }
  batch[adId].clicks += 1;
  saveLocalBatch(batch);
}

/**
 * النبضة العكسية المجمعة (Batch Flush)
 * تقوم بتفريغ العدادات التراكمية في حركة كتابة واحدة مجمعة (1 Write Only) لتخفيض تكاليف Firebase لصنع صفر تشغيلية حقيقية
 */
export async function flushAdMetrics() {
  const batchStore = getLocalBatch();
  const adIds = Object.keys(batchStore);
  if (adIds.length === 0) return;

  // فحص واستبعاد الإعلانات الافتراضية التجريبية لمنع أخطاء عدم وجود مستند في قاعدة البيانات (No document to update)
  const realAdIds = adIds.filter(id => !id.startsWith('promo-'));
  
  if (realAdIds.length === 0) {
    // جميع العدادات محلية افتراضية، نقوم بحذف المخزن المحلي فوراً وصفر الكلفة
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    return;
  }

  console.log(`[بروتوكول صفر كلفة] شحن مقاييس الإعلانات للحملات:`, realAdIds);

  try {
    const batch = writeBatch(db);
    let hasUpdates = false;

    for (const adId of realAdIds) {
      const metrics = batchStore[adId];
      if (metrics.impressions > 0 || metrics.clicks > 0) {
        const adRef = doc(db, 'promos', adId);
        
        const updates: any = {};
        if (metrics.impressions > 0) {
          updates.currentImpressions = increment(metrics.impressions);
        }
        if (metrics.clicks > 0) {
          updates.clicksCount = increment(metrics.clicks);
        }
        
        batch.update(adRef, updates);
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      await batch.commit();
      // تصفير المخزن المحلي بعد التزام السيرفر الكلي (1 Write Operation)
      localStorage.removeItem(STORAGE_KEY);
      console.log(`[بروتوكول صفر كلفة] تم تفريغ العدادات وحذف المخزن المحلي بنجاح.`);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.error('[بروتوكول صفر كلفة] فشل تفريغ العدادات المجمعة:', err);
    trackSovereignError(err, { context: 'FlushAdMetrics_Batch_Failed' });
  }
}
