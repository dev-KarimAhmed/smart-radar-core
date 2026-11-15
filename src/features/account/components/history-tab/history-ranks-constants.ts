import {
  Award,
  Crown,
  Sparkles,
} from 'lucide-react';
import type { CaptainRankName } from '@/features/captain/services/captain-rank';

export const styles = {
  card: 'relative overflow-hidden rounded-3xl border border-amber-500/25 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl w-full text-white',
  accentBar: 'absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent shadow-[0_0_12px_rgba(251,191,36,0.5)]',
  header: 'p-4 sm:p-5 pb-3.5 sm:pb-3',
  headerButton: 'w-full text-right cursor-pointer select-none transition-colors hover:bg-white/[0.02]',
  headerRow: 'flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3',
  headerInfo: 'flex items-center gap-3 min-w-0',
  iconBox: 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
  icon: 'h-5 w-5',
  title: 'text-base font-black text-white font-sans',
  descDesktop: 'hidden sm:block text-xs text-slate-400 mt-0.5 leading-relaxed font-sans',
  descMobile: 'sm:hidden text-xs text-slate-400 leading-relaxed font-sans truncate min-w-0 flex-1',
  actionsRow: 'flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-white/[0.05] sm:border-0 shrink-0',
  actionsGroup: 'flex items-center gap-2 shrink-0',
  countBadge: 'shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 sm:px-3 py-1 text-xs font-bold text-amber-300 shadow-sm font-mono flex items-center gap-1.5',
  chevronBox: 'flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300 transition-all hover:bg-amber-500/20 shrink-0',
  chevronIcon: 'h-4 w-4 transition-transform duration-200',
  chevronRotated: 'rotate-180',
  content: 'p-5 pt-2 space-y-4',
} as const;

export interface HistoryRanksPointsProps {
  isArabic?: boolean;
}

export const RANK_DETAILS: Record<CaptainRankName, {
  nameAr: string;
  nameEn: string;
  color: string;
  border: string;
  bg: string;
  icon: any;
  ceilingPercent: number;
}> = {
  DIAMOND: {
    nameAr: 'ماسي',
    nameEn: 'Diamond',
    color: 'text-cyan-300',
    border: 'border-cyan-400/40',
    bg: 'bg-gradient-to-br from-cyan-500/20 via-cyan-900/10 to-blue-950/30',
    icon: Crown,
    ceilingPercent: 25,
  },
  PLATINUM: {
    nameAr: 'بلاتيني',
    nameEn: 'Platinum',
    color: 'text-purple-300',
    border: 'border-purple-400/40',
    bg: 'bg-gradient-to-br from-purple-500/20 via-purple-900/10 to-indigo-950/30',
    icon: Sparkles,
    ceilingPercent: 20,
  },
  GOLD: {
    nameAr: 'ذهبي',
    nameEn: 'Gold',
    color: 'text-amber-300',
    border: 'border-amber-400/40',
    bg: 'bg-gradient-to-br from-amber-500/20 via-amber-900/10 to-yellow-950/30',
    icon: Award,
    ceilingPercent: 15,
  },
  SILVER: {
    nameAr: 'فضي',
    nameEn: 'Silver',
    color: 'text-slate-300',
    border: 'border-slate-400/30',
    bg: 'bg-gradient-to-br from-slate-500/20 via-slate-800/10 to-slate-900/30',
    icon: Award,
    ceilingPercent: 10,
  },
  BRONZE: {
    nameAr: 'برونزي',
    nameEn: 'Bronze',
    color: 'text-amber-600',
    border: 'border-amber-700/30',
    bg: 'bg-gradient-to-br from-amber-800/20 via-amber-950/10 to-orange-950/30',
    icon: Award,
    ceilingPercent: 5,
  },
};

export const RANK_HIERARCHY: CaptainRankName[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
