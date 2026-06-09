import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * [SCR-2026-048] خوارزمية الهبوط الاضطراري (Emergency Descent)
 * تراقب عداد المخالفات وتنفذ تجريد الرتبة عند الوصول لـ 3 مخالفات.
 * تمنع الصعود مجدداً لمدة 72 ساعة سيادية (التطهير التأديبية).
 */
export const enforceEmergencyDescent = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
        const after = change.after.data();
        const before = change.before.data();

        if (after.role !== 'driver') return null;
        if (after.penaltyCount === undefined || before.penaltyCount === undefined) return null;
        if (after.penaltyCount <= before.penaltyCount) return null;

        // تفعيل المقصلة التأديبية عند المخالفة الثالثة
        if (after.penaltyCount >= 3 && after.rank !== 'Bronze') {
            const lockPeriodMillis = 72 * 60 * 60 * 1000; 
            const unlockTimestamp = admin.firestore.Timestamp.fromMillis(Date.now() + lockPeriodMillis);

            console.warn(`[Sovereign Penalty] Rank stripped for driver ${context.params.userId}. Demoted to Bronze for 72h.`);

            return change.after.ref.update({
                rank: 'Bronze', // العودة للقاع
                penaltyCount: 0, // تصفير السجل لبدء التطهير
                rankPenaltyExpiresAt: unlockTimestamp, // حظر الصعود (بروتوكول القصاص)
                auditLog: admin.firestore.FieldValue.arrayUnion(
                    `[Emergency Descent] Rank stripped to Bronze. Threshold exceeded at ${new Date().toISOString()}. Locked until ${unlockTimestamp.toDate().toISOString()}`
                )
            });
        }

        return null;
    });
