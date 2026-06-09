'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useRegistration } from '@/hooks/use-registration';

export function RoleStep() {
  const { setRole, setStep } = useRegistration();

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full h-14 text-lg border-primary/50 text-white hover:bg-primary transition-all"
        onClick={() => {
          setRole('rider');
          setStep('personal');
        }}
      >
        أنا مسافر
      </Button>
      <Button
        variant="outline"
        className="w-full h-14 text-lg border-primary/50 text-white hover:bg-primary transition-all"
        onClick={() => {
          setRole('driver');
          setStep('personal');
        }}
      >
        أنا كابتن
      </Button>
    </div>
  );
}
