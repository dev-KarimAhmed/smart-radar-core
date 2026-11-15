import React from 'react';
import { Phone, Lock, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface AdminLoginFormProps {
  isArabic: boolean;
  adminPhone: string;
  setAdminPhone: (val: string) => void;
  isAdminPhoneValid: boolean;
  adminPhoneValidation: { ok: boolean; message?: string };
  adminPassword: string;
  setAdminPassword: (val: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function AdminLoginForm({
  isArabic,
  adminPhone,
  setAdminPhone,
  isAdminPhoneValid,
  adminPhoneValidation,
  adminPassword,
  setAdminPassword,
  isSubmitting,
  onSubmit,
}: AdminLoginFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 pt-3 border-t border-white/10 text-start">
      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
          <Phone className="w-3 h-3 text-[#14B8A6]" />
          <span>{isArabic ? 'رقم هاتف المشرف' : 'Admin Phone'}</span>
        </label>
        <div className="relative">
          <Input
            type="tel"
            dir="ltr"
            value={adminPhone}
            onChange={(e) => setAdminPhone(e.target.value)}
            placeholder="+201551981922 أو +962..."
            className={cn(
              'bg-black/60 border-white/15 text-white h-10 rounded-xl text-xs',
              isAdminPhoneValid && '!border-emerald-500/70 focus-visible:!border-emerald-500 ring-1 ring-emerald-500/20',
              !isAdminPhoneValid && adminPhone.trim() && '!border-amber-500/60 focus-visible:!border-amber-500'
            )}
            required
          />
          {isAdminPhoneValid ? (
            <span className="absolute end-3 top-1/2 -translate-y-1/2 text-emerald-400 flex items-center pointer-events-none">
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            </span>
          ) : null}
        </div>
        {!isAdminPhoneValid ? (
          <p className="text-[10px] text-amber-400/90 font-medium pt-0.5">
            {adminPhone.trim()
              ? adminPhoneValidation.message || (isArabic ? 'رقم المشرف غير صالح' : 'Invalid phone number')
              : isArabic
              ? 'اكتب رقم المشرف بالصيغة الدولية (+962 أو +20)'
              : 'Enter admin phone in international format'}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
          <Lock className="w-3 h-3 text-[#14B8A6]" />
          <span>{isArabic ? 'كلمة المرور' : 'Password'}</span>
        </label>
        <Input
          type="password"
          dir="ltr"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          placeholder="••••••••"
          className="bg-black/60 border-white/15 text-white h-10 rounded-xl text-xs"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-10 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-teal-600/20"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null}
        <span>{isArabic ? 'تسجيل الدخول للإدارة' : 'Sign in as Admin'}</span>
      </Button>
    </form>
  );
}
