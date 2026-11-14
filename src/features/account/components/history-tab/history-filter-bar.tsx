'use client';

import React from 'react';
import {
  ReceiptText,
  FileCheck2,
  Car,
  Users,
  Award,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type HistoryCategoryKey = 'all' | 'financial' | 'legal' | 'activity' | 'customers' | 'ranks';

interface CategoryTabItem {
  key: HistoryCategoryKey;
  labelAr: string;
  labelEn: string;
  icon: any;
  color: string;
  activeClass: string;
}

export const HISTORY_CATEGORIES: CategoryTabItem[] = [
  {
    key: 'all',
    labelAr: 'الكل',
    labelEn: 'All',
    icon: Layers,
    color: 'text-slate-300',
    activeClass: 'bg-white/15 border-white/30 text-white shadow-md shadow-white/5',
  },
  {
    key: 'financial',
    labelAr: 'سجل المالية',
    labelEn: 'Financial',
    icon: ReceiptText,
    color: 'text-emerald-400',
    activeClass: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/10',
  },
  {
    key: 'legal',
    labelAr: 'السجل القانوني',
    labelEn: 'Legal',
    icon: FileCheck2,
    color: 'text-amber-400',
    activeClass: 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/10',
  },
  {
    key: 'activity',
    labelAr: 'سجل النشاط',
    labelEn: 'Activity',
    icon: Car,
    color: 'text-cyan-400',
    activeClass: 'bg-cyan-500/20 border-cyan-500/40 text-[#14F5D5] shadow-md shadow-cyan-500/10',
  },
  {
    key: 'customers',
    labelAr: 'سجل العملاء',
    labelEn: 'Customers',
    icon: Users,
    color: 'text-blue-400',
    activeClass: 'bg-blue-500/20 border-blue-500/40 text-blue-300 shadow-md shadow-blue-500/10',
  },
  {
    key: 'ranks',
    labelAr: 'سجل الرتب والنقاط',
    labelEn: 'Ranks & Points',
    icon: Award,
    color: 'text-purple-400',
    activeClass: 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-md shadow-purple-500/10',
  },
];

export interface HistoryFilterBarProps {
  activeCategory: HistoryCategoryKey;
  onSelectCategory: (category: HistoryCategoryKey) => void;
  isPassenger: boolean;
  isArabic: boolean;
}

export function HistoryFilterBar({
  activeCategory,
  onSelectCategory,
  isPassenger,
  isArabic,
}: HistoryFilterBarProps) {
  const categories = isPassenger
    ? HISTORY_CATEGORIES.filter((cat) => cat.key !== 'financial' && cat.key !== 'ranks')
    : HISTORY_CATEGORIES;

  return (
    <div className="w-full">
      <div
        className={cn(
          'grid gap-2 w-full select-none',
          isPassenger
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'
        )}
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat.key;
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelectCategory(cat.key)}
              className={cn(
                'w-full flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5 sm:py-3 rounded-2xl border text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-[0.98] text-center',
                isActive
                  ? cat.activeClass
                  : 'border-white/10 bg-black/40 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/20'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? cat.color : 'text-slate-500')} />
              <span className="whitespace-nowrap">{isArabic ? cat.labelAr : cat.labelEn}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
