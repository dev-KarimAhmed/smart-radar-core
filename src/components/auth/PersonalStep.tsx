'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegistration } from '@/hooks/use-registration';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { jordanGovernorates } from '@/lib/data';

export function PersonalStep() {
  const { personal, setPersonal, handlePersonalSubmit, districts, isSubmitting, role, setStep } = useRegistration();

  return (
    <form onSubmit={handlePersonalSubmit} className="space-y-4">
      <Input
        placeholder="الاسم الكامل"
        value={personal.name}
        onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
        className="bg-black/50 border-primary/50 text-white"
        required
      />
      <Input
        type="tel"
        dir="ltr"
        placeholder="+962..."
        value={personal.phone}
        onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
        className="bg-black/50 border-primary/50 text-white"
        required
      />
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={personal.gov}
          onValueChange={(value) => setPersonal({ ...personal, gov: value, district: '' })}
          required
        >
          <SelectTrigger className="bg-black/50 border-primary/50 text-white">
            <SelectValue placeholder="اختر المحافظة" />
          </SelectTrigger>
          <SelectContent>
            {jordanGovernorates.map((gov) => (
              <SelectItem key={gov} value={gov}>{gov}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={personal.district}
          onValueChange={(value) => setPersonal({ ...personal, district: value })}
          disabled={!personal.gov}
          required
        >
          <SelectTrigger className="bg-black/50 border-primary/50 text-white">
            <SelectValue placeholder="اختر اللواء" />
          </SelectTrigger>
          <SelectContent>
            {districts.map((dist) => (
              <SelectItem key={dist} value={dist}>{dist}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/80" disabled={isSubmitting}>
        {isSubmitting ? 'جاري التحضير...' : role === 'rider' ? 'دخول سيادي' : 'متابعة'}
      </Button>
      <Button type="button" variant="ghost" className="w-full text-white/50" onClick={() => setStep('role')}>
        العودة
      </Button>
    </form>
  );
}
