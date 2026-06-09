'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useRegistration } from '@/hooks/use-registration';

export function AffiliationStep() {
  const { setAffiliation, setStep } = useRegistration();

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full h-14 border-primary/50 text-white hover:bg-primary"
        onClick={() => {
          setAffiliation('office-taxi');
          setStep('vehicle');
        }}
      >
        تكسي مكتب (أصفر)
      </Button>
      <Button
        variant="outline"
        className="w-full h-14 border-primary/50 text-white hover:bg-primary"
        onClick={() => {
          setAffiliation('smart-app');
          setStep('vehicle');
        }}
      >
        تطبيقات ذكية (خاص)
      </Button>
      <Button variant="ghost" className="w-full text-white/50" onClick={() => setStep('personal')}>
        العودة
      </Button>
    </div>
  );
}
