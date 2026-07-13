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
    
    staleTime: TEN_MINUTES,
    gcTime: 10 * 60 * 1000, // keep cached data ~10 min after last use
    refetchInterval: TEN_MINUTES, // poll every 10 min while mounted
    refetchIntervalInBackground: false, // don't poll when the tab is hidden
  });
}
