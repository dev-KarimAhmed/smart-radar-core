'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldQuestion } from 'lucide-react';
import { RegistrationProvider, useRegistration } from '@/hooks/use-registration';
import { RoleStep } from '@/components/auth/RoleStep';
import { PersonalStep } from '@/components/auth/PersonalStep';
import { AffiliationStep } from '@/components/auth/AffiliationStep';
import { VehicleStep } from '@/components/auth/VehicleStep';
import { AdminStep } from '@/components/auth/AdminStep';

function LoginOrchestrator() {
  const { step, handleLogoTap } = useRegistration();

  const renderStep = () => {
    switch (step) {
      case 'role':
        return <RoleStep />;
      case 'personal':
        return <PersonalStep />;
      case 'affiliation':
        return <AffiliationStep />;
      case 'vehicle':
        return <VehicleStep />;
      case 'admin':
        return <AdminStep />;
      default:
        return <RoleStep />;
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'admin': return 'الوصول السيادي المحظور';
      default: return 'بوابة السيادة الموحدة';
    }
  };

  const getDescription = () => {
    switch (step) {
      case 'role': return 'حدد صفتك الميدانية';
      case 'personal': return 'البيانات الشخصية والسيادية';
      case 'affiliation': return 'تحديد الانتماء القطاعي';
      case 'vehicle': return 'البيانات المهنية للمركبة';
      case 'admin': return 'أدخل بيانات الاعتماد للمالك';
      default: return '';
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/90" />

      <Card className={`w-full max-w-md transition-all duration-500 glass-effect relative z-10 shadow-2xl ${step === 'admin' ? 'border-destructive/50 shadow-destructive/20' : 'border-primary/40 shadow-primary/10'}`}>
        <CardHeader className="items-center text-center pb-4">
          <div 
            className="p-1 rounded-full bg-primary/20 mb-2 border border-primary/30 cursor-pointer select-none active:scale-95 transition-transform flex items-center justify-center h-16 w-16"
            onClick={handleLogoTap}
          >
             <ShieldQuestion className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className={`text-xl font-headline tracking-wide ${step === 'admin' ? 'text-destructive' : 'text-white'}`}>
              {getTitle()}
          </CardTitle>
          <CardDescription className="text-white/60">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <RegistrationProvider>
      <LoginOrchestrator />
    </RegistrationProvider>
  );
}
