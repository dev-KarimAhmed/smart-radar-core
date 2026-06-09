'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegistration } from '@/hooks/use-registration';
import { ShieldAlert } from 'lucide-react';

export function AdminStep() {
  const { adminCreds, setAdminCreds, handleAdminSubmit, isSubmitting, setStep } = useRegistration();

  return (
    <form onSubmit={handleAdminSubmit} className="space-y-4 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-center mb-4">
        <ShieldAlert className="w-12 h-12 text-destructive animate-pulse" />
      </div>
      <Input
        type="email"
        dir="ltr"
        placeholder="المعرف الرقمي (Email)"
        value={adminCreds.email}
        onChange={(e) => setAdminCreds({ ...adminCreds, email: e.target.value })}
        className="bg-black/50 border-destructive/50 text-white focus-visible:ring-destructive"
        required
      />
      <Input
        type="password"
        dir="ltr"
        placeholder="رمز المرور (Password)"
        value={adminCreds.password}
        onChange={(e) => setAdminCreds({ ...adminCreds, password: e.target.value })}
        className="bg-black/50 border-destructive/50 text-white focus-visible:ring-destructive"
        required
      />
      <Button type="submit" variant="destructive" className="w-full h-12" disabled={isSubmitting}>
        {isSubmitting ? 'جاري التحقق...' : 'دخول المالك'}
      </Button>
      <Button type="button" variant="ghost" className="w-full text-white/50 hover:text-white" onClick={() => setStep('role')}>
        العودة للميدان
      </Button>
    </form>
  );
}
