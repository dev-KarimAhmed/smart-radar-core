'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegistration } from '@/hooks/use-registration';
import { ShieldAlert } from 'lucide-react';

export function AdminStep() {
  const { adminCreds, setAdminCreds, handleAdminSubmit, isSubmitting, setStep } = useRegistration();

  return (
    <form onSubmit={handleAdminSubmit} className="space-y-4 animate-fade-in text-right" dir="rtl">
      <div className="flex justify-center mb-4">
        <ShieldAlert className="w-12 h-12 text-rose-500 animate-pulse" />
      </div>
      <div>
        <label className="block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right">
          المعرف الرقمي (Email)
        </label>
        <Input
          type="email"
          dir="ltr"
          placeholder="admin@bynkcom.com"
          value={adminCreds.email}
          onChange={(e) => setAdminCreds({ ...adminCreds, email: e.target.value })}
          className="w-full bg-[#0B0F19] border border-[#243249] focus:border-rose-500 text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-12 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_10px_rgba(239,68,68,0.1)] text-left"
          required
        />
      </div>

      <div>
        <label className="block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1.5 text-right">
          رمز المرور (Password)
        </label>
        <Input
          type="password"
          dir="ltr"
          placeholder="••••••••"
          value={adminCreds.password}
          onChange={(e) => setAdminCreds({ ...adminCreds, password: e.target.value })}
          className="w-full bg-[#0B0F19] border border-[#243249] focus:border-rose-500 text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-12 text-sm outline-none transition-all duration-300 focus:shadow-[0_0_10px_rgba(239,68,68,0.1)] text-left"
          required
        />
      </div>

      <div className="pt-2">
        <button 
          type="submit" 
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(239,68,68,0.2)] hover:shadow-[0_4px_25px_rgba(239,68,68,0.35)] transform active:scale-[0.98] disabled:opacity-50 cursor-pointer text-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'جاري التحقق...' : 'دخول المالك'}
        </button>
      </div>

      <button 
        type="button" 
        className="w-full text-xs text-[#94A3B8]/60 hover:text-rose-400 transition-colors py-2 cursor-pointer"
        onClick={() => setStep('role')}
      >
        العودة لشاشة الاختيار
      </button>
    </form>
  );
}
