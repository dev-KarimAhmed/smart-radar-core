'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { WelcomeHoursConfig } from '@/features/admin/types/driver-management';

interface DriversWelcomePreviewCardProps {
  welcomeConfig: WelcomeHoursConfig;
  t: (key: string, values?: Record<string, any>) => string;
}

export function DriversWelcomePreviewCard({ welcomeConfig, t }: DriversWelcomePreviewCardProps) {
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-black/80 to-[#0F172A] border border-amber-500/20 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{t('welcomeHoursPreviewTitle')}</span>
        </div>
        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
          ثنائي اللغة آلياً
        </Badge>
      </div>

      {/* Arabic preview */}
      <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1 text-right" dir="rtl">
        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400">
          <span>🎁 هدية ترحيبية: {welcomeConfig.hours} ساعة رادار مجاناً ⚡</span>
          <Badge className="bg-emerald-950 text-emerald-400 border-none text-[9px]">عربي</Badge>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          أهلاً بك يا كابتن! تم إيداع رصيد ترحيبي قدره ({welcomeConfig.hours}) ساعة طيران رادار في محفظتك بنجاح وتمديد الصلاحية لـ {welcomeConfig.validityDays} يوماً لتنطلق في استقبال الرحلات فوراً.
        </p>
      </div>

      {/* English preview */}
      <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1 text-left" dir="ltr">
        <div className="flex items-center justify-between text-[11px] font-bold text-teal-400">
          <span>🎁 Welcome Gift: {welcomeConfig.hours} Free Radar Hours ⚡</span>
          <Badge className="bg-teal-950 text-teal-400 border-none text-[9px]">English</Badge>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Welcome Captain! A welcome credit of ({welcomeConfig.hours}) radar flight hours has been deposited into your wallet, valid for {welcomeConfig.validityDays} days, to start accepting rides immediately.
        </p>
      </div>
    </div>
  );
}

