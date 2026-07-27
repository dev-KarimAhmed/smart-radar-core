'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useRegistration } from '../../hooks/use-registration';

const styles = {
  style11_1: "space-y-4 animate-fade-in text-right",
  style14_2: "w-full h-14 text-base border border-[#243249] hover:border-[#14B8A6]/60 bg-[#0B0F19] hover:bg-[#161F30] text-white rounded-xl transition-all duration-300 font-bold shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(20,184,166,0.15)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]",
  style26_3: "w-full h-14 text-base border border-[#243249] hover:border-[#3B82F6]/60 bg-[#0B0F19] hover:bg-[#161F30] text-white rounded-xl transition-all duration-300 font-bold shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]",
  style38_4: "w-full text-xs text-[#94A3B8]/60 hover:text-white transition-colors py-2 cursor-pointer",
} as const;


export function AffiliationStep() {
  const { setAffiliation, setStep } = useRegistration();

  return (
    <div className={styles.style11_1} dir="rtl">
      <button
        type="button"
        className={styles.style14_2}
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
        className={styles.style26_3}
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
        className={styles.style38_4}
        onClick={() => setStep('personal')}
      >
        العودة للبيانات الشخصية
      </button>
    </div>
  );
}
