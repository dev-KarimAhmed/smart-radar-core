import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface AuditLogPayload {
  actorId: string;
  actorName: string;
  actorRole: 'driver' | 'rider' | 'delegate' | 'admin' | 'unknown';
  action: string;
  securityClearance: 'INFO' | 'WARNING' | 'CRITICAL_SECURITY_ALERT';
  details: Record<string, any>;
}

/**
 * Writes an audit log entry securely and silently to the immutable Firestore audit ledger.
 */
export async function logAuditAction(payload: AuditLogPayload): Promise<void> {
  try {
    const ledgerCollection = collection(db, 'audit_ledger');
    await addDoc(ledgerCollection, {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    console.log(`[Audit Logger] Registered action: ${payload.action} for ${payload.actorRole} (${payload.actorId})`);
  } catch (error) {
    console.warn(`[Audit Logger] Failed to write audit log to ledger for ${payload.action}:`, error);
  }
}
