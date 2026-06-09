import * as functions from "firebase-functions";

// ============================================================================
// 🛡️ [SSOT] بوابات الحماية السيادية (تم التوحيد والتعقيم حسب بروتوكول 16)
// ============================================================================
export function verifySovereignAccess(context: functions.https.CallableContext) {
    // 🏛️ [SCR-CMD-BYPASS-V3] Sovereign Bypass for Development Emulator
    // When running in the emulator, context.auth can be missing for mock users.
    if (process.env.FUNCTIONS_EMULATOR === 'true') {
        console.log('[Sovereign Guard Bypass] verifySovereignAccess check skipped for emulator.');
        return; 
    }

    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'SOVEREIGN_ACCESS_DENIED: وصول غير مصرح به.');
    }
    if (context.app === undefined) {
        throw new functions.https.HttpsError('failed-precondition', 'SOVEREIGN_SHIELD_ACTIVE: Unauthorized access. The request does not contain a valid App Check token.');
    }
}

export function verifyAdminAccess(context: functions.https.CallableContext) {
    verifySovereignAccess(context);
    
    // If we are in the emulator, the above check returns, but context.auth might still be null.
    if (process.env.FUNCTIONS_EMULATOR === 'true') {
        console.log('[Sovereign Guard Bypass] verifyAdminAccess check skipped for emulator.');
        return;
    }

    if (context.auth.token?.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'SOVEREIGN_REJECTED: صلاحيات القيادة العليا مطلوبة.');
    }
}
