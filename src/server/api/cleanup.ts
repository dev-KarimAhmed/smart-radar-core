import { Router } from 'express';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  addDoc,
  setDoc,
  Timestamp
} from 'firebase/firestore';

export const cleanupRouter = Router();

// [SR-CMD-2026-0104] "المجرفة الميكانيكية السحابية" (The Cloud-Side Mechanical Shovel / Purger)
cleanupRouter.post('/cleanup', async (req, res) => {
  console.log('[المجرفة السحابية] بدء دورة التطهير والكنس لثغرة التراكم البياني...');
  let deletedCount = 0;
  let bufferResetCount = 0;
  const nowMs = Date.now();
  const seventyTwoHoursAgoLimit = nowMs - 72 * 60 * 60 * 1000;

  try {
    // 1. تطهير وإبادة الرحلات المنتهية والقديمة (72 ساعة حتمية)
    const tripsQuery = query(collection(db, 'trips'));
    const tripsSnapshot = await getDocs(tripsQuery);
    
    const batch = writeBatch(db);
    let batchSize = 0;

    tripsSnapshot.forEach((tripDoc) => {
      const data = tripDoc.data();
      
      // جلب زمن الإنشاء بالملي ثانية
      let createdAtMs = 0;
      if (data.createdAt) {
        if (data.createdAt.seconds) {
          createdAtMs = data.createdAt.seconds * 1000;
        } else if (data.createdAt instanceof Date) {
          createdAtMs = data.createdAt.getTime();
        } else {
          createdAtMs = new Date(data.createdAt).getTime();
        }
      }

      // التحقق من انتهاء أجل الـ 72 ساعة
      if (createdAtMs > 0 && createdAtMs <= seventyTwoHoursAgoLimit) {
        // [القفل السيادي الحارس]: يُحظر حظراً باتاً مسح أي مستند يحمل الختم الرقمي للقلب الأخضر
        const isVaulted = data.isVaulted === true || data.isGreenHearted === true;
        
        if (!isVaulted) {
          batch.delete(tripDoc.ref);
          deletedCount++;
          batchSize++;
        } else {
          console.log(`[الحارس السيادي] حماية وتخطي وثيقة الرحلة المحصنة: ${tripDoc.id}`);
        }
      }
    });

    // 2. كنس وتطهير مخزن المؤقت الراكب (Rider Buffer Purge)
    const ridersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'rider'),
      where('isBufferActive', '==', true)
    );
    const ridersSnapshot = await getDocs(ridersQuery);

    ridersSnapshot.forEach((riderDoc) => {
      const data = riderDoc.data();
      const expiresAt = data.lastTripBuffer?.expiresAt;
      let expiresAtMs = 0;

      if (expiresAt) {
        if (expiresAt.seconds) {
          expiresAtMs = expiresAt.seconds * 1000;
        } else if (expiresAt instanceof Date) {
          expiresAtMs = expiresAt.getTime();
        } else {
          expiresAtMs = new Date(expiresAt).getTime();
        }
      }

      if (expiresAtMs > 0 && expiresAtMs <= nowMs) {
        batch.update(riderDoc.ref, {
          isBufferActive: false,
          lastTripBuffer: null
        });
        bufferResetCount++;
        batchSize++;
      }
    });

    // تنفيذ الـ Batch دفعة واحدة
    if (batchSize > 0) {
      await batch.commit();
    }

    console.log(`[المجرفة السحابية] تم تطهير وبتر ${deletedCount} رحلات ميتة، وإعادة تهيئة ${bufferResetCount} مؤقتات تالفة.`);

    // 3. [تطهير الحافة الميكانيكي]: إرسال نبضة تصفية صامتة لتزامن الهواتف ومخزن IndexedDB/LocalStorage
    await setDoc(doc(db, 'system_states', 'cleanup_pulse'), {
      lastPurgeTimestamp: nowMs,
      purgedTripsCount: deletedCount,
      purgedBuffersCount: bufferResetCount,
      action: 'PURGE_TRIGGER_LOCAL_TATHIR',
      integrityHash: `TXN-PURGE-${nowMs}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      protocol: 'SC-55-SHOVE-TATHIR'
    });

    // تسجيل دورة التطهير الناجحة في دفتر الأستاذ الجنائي (Audit Ledger)
    await addDoc(collection(db, 'audit_ledger'), {
      action: 'CLEANUP_PURGE_SUCCESS',
      deletedCount,
      bufferResetCount,
      timestamp: new Date().toISOString(),
      protocol: 'RAD-ANTI-CHEAT-20',
      verified: true
    });

    return res.json({
      success: true,
      message: 'تمت دورة كنس وإبادة التراكمات السحابية بنجاح مطلق وتلقيح الهواتف بنبضة التطهير الصامتة.',
      data: {
        purgedTrips: deletedCount,
        purgedBuffers: bufferResetCount,
        timestamp: nowMs
      }
    });

  } catch (error: any) {
    // [تجريم الأخطاء الصامتة (بروتوكول 20)]: تسجيل دقيق للخطأ وتدوينه فوراً في الصندوق الأسود الجنائي الموحد واعتراضه
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('🛑 [المجرفة السحابية - فشل الإبادة]:', errorMsg);

    try {
      await addDoc(collection(db, 'audit_ledger'), {
        action: 'CLEANUP_PURGE_FAILURE',
        error: errorMsg,
        stack: errorStack,
        timestamp: new Date().toISOString(),
        protocol: 'RAD-ANTI-CHEAT-20',
        verified: false
      });
    } catch (auditError) {
      console.error('Failed to log error to audit ledger:', auditError);
    }

    return res.status(500).json({
      success: false,
      error: 'عطل في التطهير الميكانيكي: تم احتجاز الخطأ والاعتراض عليه جنائياً ومنع تمريره صامتاً.',
      details: errorMsg
    });
  }
});
