/**
 * Sovereign Ad Vault Types & Clean Container
 */

export interface SampleAdItem {
  id: string;
  title: string;
  description: string;
  bannerUrl: string;
  posterUrl: string;
  imageUrl?: string;
  phone: string;
  whatsapp: string;
  geoLoc: string;
  adType: 'RIDER_BENEFIT' | 'CAPTAIN_PROFESSIONAL' | 'NEARBY';
  targetDistrict: string;
  targetGovernorate: string;
  targetLocationName: string;
  buttonText: string;
  content: {
    title: string;
    description: string;
    posterUrl: string;
  };
  savedAtTimestamp?: number;
  isPlaceholder?: boolean;
}

export const SAMPLE_VAULT_ADS: SampleAdItem[] = [];
