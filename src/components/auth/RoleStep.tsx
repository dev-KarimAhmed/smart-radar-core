'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useRegistration } from '@/hooks/use-registration';
import { useAuth } from '@/hooks/use-auth';

export function RoleStep() {
  const { setRole, setStep } = useRegistration();
  const { loginAsMockUser } = useAuth();

  return (
    <div className="space-y-4">
      <button
        type="button"
        className="w-full h-14 text-lg border border-[#243249] hover:border-[#3B82F6]/60 bg-[#0B0F19] hover:bg-[#161F30] text-white rounded-xl transition-all duration-300 font-bold shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        onClick={() => {
          setRole('rider');
          setStep('personal');
        }}
      >
        <span className="text-xl">✈️</span>
        <span>أنا مسافر</span>
      </button>

      <button
        type="button"
        className="w-full h-14 text-lg border border-[#243249] hover:border-[#14B8A6]/60 bg-[#0B0F19] hover:bg-[#161F30] text-white rounded-xl transition-all duration-300 font-bold shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(20,184,166,0.15)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        onClick={() => {
          setRole('driver');
          setStep('personal');
        }}
      >
        <span className="text-xl">🚗</span>
        <span>أنا كابتن</span>
      </button>

      <button
        type="button"
        className="w-full h-14 text-lg border border-[#243249] hover:border-[#00ffcc]/60 bg-[#0B0F19] hover:bg-[#161F30] text-white rounded-xl transition-all duration-300 font-bold shadow-[0_4px_15px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_20px_rgba(0,255,204,0.15)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        onClick={() => {
          setRole('advertiser');
          setStep('personal');
        }}
      >
        <span className="text-xl">📢</span>
        <span>أنا معلن</span>
      </button>
    </div>
  );
}
