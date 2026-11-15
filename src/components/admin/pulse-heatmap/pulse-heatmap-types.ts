import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
} from 'lucide-react';
import type { MarketPulse } from '@/core/types';
import { jordanGovernorates, getDistrictsByGovernorate } from '@/lib/data';

export interface PulseHeatmapProps {
  pulseData: MarketPulse[];
  isLoading: boolean;
}

export interface ChartDataItem {
  name: string;
  demand: number;
  supply: number;
  density: number;
}

export function getTrendStyle(trend: MarketPulse['trend'], tAuto: (key: string) => string) {
  switch (trend) {
    case 'high_demand':
      return {
        bg: 'bg-red-950/20 border-red-500/30',
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
        iconColor: 'text-red-400',
        Icon: TrendingUp,
        label: tAuto('key_47bc21aa'),
      };
    case 'high_supply':
      return {
        bg: 'bg-blue-950/20 border-blue-500/30',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
        iconColor: 'text-blue-400',
        Icon: TrendingDown,
        label: tAuto('key_8b1b33e1'),
      };
    case 'balanced':
    default:
      return {
        bg: 'bg-emerald-950/20 border-emerald-500/30',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]',
        iconColor: 'text-emerald-400',
        Icon: ArrowRightLeft,
        label: tAuto('key_aaa488cb'),
      };
  }
}

// Programmatic mapping to reverse district to governorate
export function getGovernorateOfDistrict(districtName: string, fallback: string): string {
  for (const gov of jordanGovernorates) {
    const distList = getDistrictsByGovernorate(gov);
    if (distList.includes(districtName)) {
      return gov;
    }
  }
  return fallback;
}
