'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Lock, Mail } from 'lucide-react';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { securityCopy } from './security/rider-security-copy';
import { RiderPasswordChangeForm } from './security/rider-password-change-form';
import { RiderEmailResetForm } from './security/rider-email-reset-form';

export function RiderSecuritySection() {
  const { isArabic } = useDashboardLanguage();
  const t = securityCopy[isArabic ? 'ar' : 'en'];

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 text-white shadow-2xl backdrop-blur-xl">
      {/* Top glowing accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />

      <CardHeader className="p-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] shadow-sm">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-black text-white flex items-center gap-2">
              {t.sectionTitle}
            </CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              {t.sectionDesc}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-2 space-y-6">
        <RiderPasswordChangeForm t={t} isArabic={isArabic} />

        {/* Divider between Direct Password and Email Reset */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#14B8A6]/15" />
          </div>
          <div className="relative flex items-center gap-1.5 rounded-full border border-[#14B8A6]/25 bg-[#0B0F19] px-3.5 py-1 text-[11px] font-bold text-slate-300 shadow-sm">
            <Mail className="h-3.5 w-3.5 text-[#14F5D5]" />
            <span>{t.emailResetDivider}</span>
          </div>
        </div>

        <RiderEmailResetForm t={t} isArabic={isArabic} />
      </CardContent>
    </Card>
  );
}
