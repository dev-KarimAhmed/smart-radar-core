'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegistration } from '../../hooks/use-registration';
import { ShieldCheck } from 'lucide-react';
import { useTranslations } from "next-intl";

const styles = {
  style13_1: "space-y-4 animate-fade-in text-right",
  style14_2: "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14B8A6] shadow-[0_0_30px_rgba(20,184,166,0.18)]",
  style15_3: "h-7 w-7 text-[#14B8A6]",
  style18_4: "block text-[10px] font-bold text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right",
  style27_5: "w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-12 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_15px_rgba(20,184,166,0.15)] text-left",
  style33_6: "block text-[10px] font-bold text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right",
  style42_7: "w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-12 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_15px_rgba(20,184,166,0.15)] text-left",
  style47_8: "pt-2",
  style50_9: "w-full min-h-12 bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black py-3 px-4 rounded-2xl transition-all duration-300 shadow-[0_16px_45px_rgba(20,184,166,0.22)] transform active:scale-[0.98] disabled:opacity-50 cursor-pointer text-center text-sm",
  style59_10: "w-full text-xs text-[#94A3B8]/70 hover:text-[#14B8A6] transition-colors py-2 cursor-pointer font-medium text-center",
} as const;


export function AdminStep() {
    const tAuto = useTranslations('auto');
    const t = useTranslations('auto');
  const { adminCreds, setAdminCreds, handleAdminSubmit, isSubmitting, setStep } = useRegistration();

  return (
    <form onSubmit={handleAdminSubmit} className={styles.style13_1} dir="rtl">
      <div className={styles.style14_2}>
        <ShieldCheck className={styles.style15_3} />
      </div>
      <div>
        <label className={styles.style18_4}>
          {tAuto('key_f0090978')}
                          </label>
        <Input
          type="email"
          dir="ltr"
          placeholder="admin@bynkcom.com"
          value={adminCreds.email}
          onChange={(e) => setAdminCreds({ ...adminCreds, email: e.target.value })}
          className={styles.style27_5}
          required
        />
      </div>

      <div>
        <label className={styles.style33_6}>
          {tAuto('key_c3b1d7ff')}
                          </label>
        <Input
          type="password"
          dir="ltr"
          placeholder="••••••••"
          value={adminCreds.password}
          onChange={(e) => setAdminCreds({ ...adminCreds, password: e.target.value })}
          className={styles.style42_7}
          required
        />
      </div>

      <div className={styles.style47_8}>
        <button 
          type="submit" 
          className={styles.style50_9}
          disabled={isSubmitting}
        >
          {isSubmitting ? tAuto('key_dab541ae') : tAuto('key_9fad1828')}
        </button>
      </div>

      <button 
        type="button" 
        className={styles.style59_10}
        onClick={() => setStep('role')}
      >
        {tAuto('key_eb54aae2')}
                    </button>
    </form>
  );
}
