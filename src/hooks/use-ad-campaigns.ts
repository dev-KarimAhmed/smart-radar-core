'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

/**
 * Raw `ad_campaigns` row (`select=*`). Columns are loosely typed since the
 * endpoint returns the full row; narrow it further if you need specific fields.
 */
export interface AdCampaignRow {
  id: string | number;
  status: string;
  [key: string]: unknown;
}

const TEN_MINUTES = 10 * 60 * 1000;

export const AD_CAMPAIGNS_QUERY_KEY = ['ad_campaigns', { status: 'ACTIVE' }] as const;

/**
 * Cached fetch of ACTIVE ad campaigns.
 *
 * Mirrors: GET /rest/v1/ad_campaigns?select=*&status=eq.ACTIVE
 *
 * Cached by TanStack Query and automatically refetched every 10 minutes.
 * Data stays "fresh" for 10 minutes (staleTime), so multiple components using
 * this hook share one cached result instead of each hitting Supabase.
 */
export function useAdCampaigns() {
  return useQuery({
    queryKey: AD_CAMPAIGNS_QUERY_KEY,
    queryFn: async (): Promise<AdCampaignRow[]> => {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('status', 'ACTIVE');

      if (error) throw error;
      return (data ?? []) as AdCampaignRow[];
    },
    // staleTime is the key to "never more than once per 10 min": while data is
    // < 10 min old, every mount / navigation / window-focus reuses the cache
    // instead of refetching. The only calls are the first load and the interval.
    staleTime: TEN_MINUTES,
    gcTime: 10 * 60 * 1000, // keep cached data ~10 min after last use
    refetchInterval: TEN_MINUTES, // poll every 10 min while mounted
    refetchIntervalInBackground: false, // don't poll when the tab is hidden
  });
}
