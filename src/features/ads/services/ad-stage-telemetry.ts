import { supabase } from '@/lib/supabase-client';

const AD_BATCH_WRITE_LIMIT = 50;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AdEventType = 'impression' | 'swipe' | 'click';

export interface AdMetricEvent {
  ad_id: string;
  event_type: AdEventType;
  occurred_at: string;
  source: 'ad_stage';
}

const runtimeEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? process.env;
const supabaseUrl = runtimeEnv.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adEventBuffer: AdMetricEvent[] = [];
let isAdEventFlushInFlight = false;

export function shouldTrackAd(ad: any) {
  return !!ad?.id && !ad.isPlaceholder && uuidPattern.test(String(ad.id));
}

export function enqueueAdEvent(ad: any, eventType: AdEventType) {
  if (!shouldTrackAd(ad)) return;

  adEventBuffer.push({
    ad_id: String(ad.id),
    event_type: eventType,
    occurred_at: new Date().toISOString(),
    source: 'ad_stage',
  });

  if (adEventBuffer.length >= AD_BATCH_WRITE_LIMIT) {
    void flushAdEventBuffer();
  }
}

export async function flushAdEventBuffer() {
  if (isAdEventFlushInFlight || adEventBuffer.length === 0) return;

  isAdEventFlushInFlight = true;
  const batch = adEventBuffer.splice(0, adEventBuffer.length);

  try {
    const { error } = await supabase.rpc('flush_ad_campaign_metrics', {
      p_events: batch,
    });
    if (error) throw error;
  } catch (error) {
    adEventBuffer.unshift(...batch);
    if (process.env.NODE_ENV !== 'production') console.warn('[AdStage] ad metrics stayed queued:', error);
  } finally {
    isAdEventFlushInFlight = false;
  }
}

export function flushAdEventBufferOnExit() {
  if (adEventBuffer.length === 0) return;

  const batch = adEventBuffer.splice(0, adEventBuffer.length);

  if (!supabaseUrl || !supabaseAnonKey) {
    adEventBuffer.unshift(...batch);
    return;
  }

  try {
    void fetch(`${supabaseUrl}/rest/v1/rpc/flush_ad_campaign_metrics`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: supabaseAnonKey,
        authorization: `Bearer ${supabaseAnonKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ p_events: batch }),
    });
  } catch {
    adEventBuffer.unshift(...batch);
  }
}

export function getVisibleAdForMetric(track: HTMLDivElement, ads: any[]) {
  const firstCard = Array.from(track.children)[0] as HTMLElement | undefined;
  if (!firstCard || ads.length === 0) return null;

  const cardWidth = firstCard.offsetWidth || 1;
  const gap = 32;
  const index = Math.round(Math.abs(track.scrollLeft) / (cardWidth + gap)) % ads.length;
  return ads[index] || null;
}
