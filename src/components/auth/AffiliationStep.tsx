'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useRegistration } from '@/hooks/use-registration';

export function AffiliationStep() {
  const { setAffiliation, setStep } = useRegistration();

  return (
    <div className="space-y-4 animate-fade-in text-right" dir="rtl">
      <button
        type="button"
        className="w-full h-14 text-base border border-radar-muted hover:border-radar-teal/60 bg-radar-bg-deep hover:bg-radar-line text-white rounded-xl transition-all duration-300 font-bold shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgb(var(--radar-teal-rgb)/0.15)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        onClick={() => {
          setAffiliation('office-taxi');
          setStep('vehicle');
        }}
      >
        <span>🚕</span>
        <span>تكسي مكتب (أصفر)</span>
      </button>

      <button
        type="button"
        className="w-full h-14 text-base border border-radar-muted hover:border-radar-blue/60 bg-radar-bg-deep hover:bg-radar-line text-white rounded-xl transition-all duration-300 font-bold shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgb(var(--radar-blue-rgb)/0.15)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        onClick={() => {
          setAffiliation('smart-app');
          setStep('vehicle');
        }}
      >
        <span>📱</span>
        <span>تطبيقات ذكية (خاص)</span>
      </button>

      <button 
        type="button" 
        className="w-full text-xs text-radar-text-sub/60 hover:text-white transition-colors py-2 cursor-pointer"
        onClick={() => setStep('personal')}
      >
        العودة للبيانات الشخصية
      </button>
    </div>
  );
}
