import { supabaseAdmin } from '@/lib/supabase-admin';

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const ALLOWED_ACTIONS = new Set(['REQUEST', 'ACCEPT', 'DECLINE', 'REVOKE']);

export async function broadcastMutualCancelEvent(
  requestId: string,
  event: 'REQUEST_CANCEL' | 'DECLINE_CANCEL' | 'REVOKE_CANCEL' | 'ACCEPT_CANCEL',
  payload: Record<string, unknown>,
): Promise<void> {
  const channel = supabaseAdmin.channel(`trip-mutual-cancel-${requestId}`, {
    config: { broadcast: { ack: false } },
  });
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    if (typeof (channel as any)?.httpSend !== 'function') return;
    await Promise.race([
      (channel as any).httpSend(event, payload),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, 350);
      }),
    ]);
  } catch {
    // Non-fatal real-time wakeup; persisted DB state and polling remain the SSOT
  } finally {
    if (timer) clearTimeout(timer);
    await supabaseAdmin.removeChannel(channel).catch(() => {});
  }
}

export function isMissingRpcFunctionError(error: unknown): boolean {
  const errObj = error as { code?: string; message?: string } | null;
  const code = String(errObj?.code || '').toUpperCase();
  const message = String(errObj?.message || '').toLowerCase();
  return code === 'PGRST202' || code === '42883' || message.includes('could not find the function');
}
