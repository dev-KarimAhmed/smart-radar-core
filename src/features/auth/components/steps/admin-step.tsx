'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegistration } from '../../hooks/use-registration';
import { ShieldAlert } from 'lucide-react';

const styles = {
  style13_1: "space-y-4 animate-fade-in text-right",
  style14_2: "flex justify-center mb-4",
  style15_3: "w-12 h-12 text-rose-500 animate-pulse",
  style18_4: "block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right",
  style27_5: "w-full bg-[#0B0F19] border border-[#243249] focus:border-rose-500 text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-12 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_10px_rgba(239,68,68,0.1)] text-left",
  style33_6: "block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right",
  style42_7: "w-full bg-[#0B0F19] border border-[#243249] focus:border-rose-500 text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-12 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_10px_rgba(239,68,68,0.1)] text-left",
  style47_8: "pt-2",
  style50_9: "w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(239,68,68,0.2)] hover:shadow-[0_4px_25px_rgba(239,68,68,0.35)] transform active:scale-[0.98] disabled:opacity-50 cursor-pointer text-center",
  style59_10: "w-full text-xs text-[#94A3B8]/60 hover:text-rose-400 transition-colors py-2 cursor-pointer",
} as const;


export function AdminStep() {
  const { adminCreds, setAdminCreds, handleAdminSubmit, isSubmitting, setStep } = useRegistration();

  return (
    <form onSubmit={handleAdminSubmit} className={styles.style13_1} dir="rtl">
      <div className={styles.style14_2}>
        <ShieldAlert className={styles.style15_3} />
      </div>
      <div>
        <label className={styles.style18_4}>
          المعرف الرقمي (Email)
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
          رمز المرور (Password)
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
          {isSubmitting ? 'جاري التحقق...' : 'دخول المالك'}
        </button>
      </div>

      <button 
        type="button" 
        className={styles.style59_10}
        onClick={() => setStep('role')}
      >
        العودة لشاشة الاختيار
      </button>
    </form>
  );
}
