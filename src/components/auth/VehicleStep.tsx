'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegistration } from '@/hooks/use-registration';

export function VehicleStep() {
  const { affiliation, vehicle, setVehicle, handleVehicleSubmit, isSubmitting, setStep } = useRegistration();
  const isTaxi = affiliation === 'office-taxi';

  return (
    <form onSubmit={handleVehicleSubmit} className="space-y-4">
      {isTaxi ? (
        <>
          <Input placeholder="اسم المكتب" value={vehicle.officeName} onChange={(e) => setVehicle({ ...vehicle, officeName: e.target.value })} className="bg-black/50 border-primary/50 text-white" required />
          <Input type="tel" placeholder="رقم هاتف المكتب" value={vehicle.officePhone} onChange={(e) => setVehicle({ ...vehicle, officePhone: e.target.value })} className="bg-black/50 border-primary/50 text-white" required />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="اللوحة الجانبية" value={vehicle.sideId} onChange={(e) => setVehicle({ ...vehicle, sideId: e.target.value })} className="bg-black/50 border-primary/50 text-white" required />
            <Input placeholder="لوحة السيارة" value={vehicle.plate} onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })} className="bg-black/50 border-primary/50 text-white" required />
          </div>
          <Input type="number" placeholder="سنة الصنع" value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} className="bg-black/50 border-primary/50 text-white" required min="1990" max="2027" />
        </>
      ) : (
        <>
          <Input placeholder="اسم الشركة (أوبر، كريم...)" value={vehicle.companyName} onChange={(e) => setVehicle({ ...vehicle, companyName: e.target.value })} className="bg-black/50 border-primary/50 text-white" required />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="نوع السيارة (تويوتا..)" value={vehicle.make} onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })} className="bg-black/50 border-primary/50 text-white" required />
            <Input placeholder="اللون" value={vehicle.color} onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })} className="bg-black/50 border-primary/50 text-white" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="لوحة السيارة" value={vehicle.plate} onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })} className="bg-black/50 border-primary/50 text-white" required />
            <Input type="number" placeholder="سنة الصنع" value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} className="bg-black/50 border-primary/50 text-white" required min="1990" max="2027" />
          </div>
        </>
      )}
      <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/80" disabled={isSubmitting}>
        دخول سيادي
      </Button>
      <Button type="button" variant="ghost" className="w-full text-white/50" onClick={() => setStep('affiliation')}>
        العودة
      </Button>
    </form>
  );
}
