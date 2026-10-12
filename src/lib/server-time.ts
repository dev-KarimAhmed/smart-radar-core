
import { supabase } from '@/lib/supabase-client';

let timeDelta = 0;
let isSynced = false;

export async function syncServerTime() {
  if (isSynced) return;
  try {
    const start = Date.now();
    const { data, error } = await supabase.rpc('get_server_time');
    if (error || !data) return;
    const end = Date.now();
    const rtt = end - start;
    const serverTime = new Date(data).getTime();
    
    // serverTime is approximately the time at start + rtt/2
    const estimatedServerTime = serverTime + rtt / 2;
    timeDelta = estimatedServerTime - end;
    isSynced = true;
  } catch (error) {
    console.warn('Failed to sync server time', error);
  }
}

export function getServerTime(): number {
  return Date.now() + timeDelta;
}

export function getSyncedDate(): Date {
  return new Date(getServerTime());
}

