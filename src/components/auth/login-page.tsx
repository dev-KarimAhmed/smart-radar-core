'use client';

import React from 'react';
import { ShieldQuestion, UserCheck, Car, Key, Megaphone, Users } from 'lucide-react';
import { RegistrationProvider, useRegistration } from '@/hooks/use-registration';
import { RoleStep } from '@/components/auth/RoleStep';
import { PersonalStep } from '@/components/auth/PersonalStep';
import { AffiliationStep } from '@/components/auth/AffiliationStep';
import { VehicleStep } from '@/components/auth/VehicleStep';
import { AdminStep } from '@/components/auth/AdminStep';
import { AdvertiserStep } from '@/components/auth/AdvertiserStep';
import { useAuth } from '@/hooks/use-auth';

function LoginOrchestrator() {
  const { step, handleLogoTap } = useRegistration();
  const { loginAsMockUser } = useAuth();

  const handleDevBypass = (roleType: 'rider' | 'driver' | 'admin' | 'advertiser' | 'delegate') => {
    if (roleType === 'rider') {
      loginAsMockUser({
        uid: 'dev-rider-001',
        phone: '+962790000000',
        role: 'rider',
        name: 'Ø§Ù„Ø²Ø¹ÙŠÙ… Ø§Ù„Ø³ÙŠØ§Ø¯ÙŠ (Ù…Ø³Ø§ÙØ± ØªØ¬Ø±ÙŠØ¨ÙŠ)',
        governorate: 'Ø¹Ù…Ø§Ù†',
        countryId: 1,
        currencyAr: 'د.أ',
        currencyEn: 'JOD',
        district: 'Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©',
        isBufferActive: false,
        rating: 5.0
      });
    } else if (roleType === 'driver') {
      loginAsMockUser({
        uid: 'dev-driver-001',
        phone: '+962791111111',
        role: 'driver',
        name: 'Ø§Ù„ÙØ§Ø±Ø³ Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠ (ÙƒØ§Ø¨ØªÙ† ØªØ¬Ø±ÙŠØ¨ÙŠ)',
        governorate: 'Ø¹Ù…Ø§Ù†',
        district: 'Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©',
        isBufferActive: false,
        status: 'idle',
        rating: 4.9,
        paidHoursRemaining: 540,
        bonusHoursRemaining: 60,
        subscriptionHours: 10,
        rank: 'Gold',
        vehicle: {
          year: 2023,
          plate: '77-12345',
          make: 'Toyota Corolla Hybrid',
          color: 'White'
        },
        affiliation: {
          type: 'independent',
          name: 'Ù…Ø³ØªÙ‚Ù„'
        }
      });
    } else if (roleType === 'admin') {
      loginAsMockUser({
        uid: 'dev-admin-001',
        phone: '+962792222222',
        role: 'admin',
        name: 'Ù‚Ø§Ø¦Ø¯ Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ø³ÙŠØ§Ø¯ÙŠØ© (Ù…Ø´Ø±Ù ØªØ¬Ø±ÙŠØ¨ÙŠ)',
        governorate: 'Ø¹Ù…Ø§Ù†',
        district: 'Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©',
        isBufferActive: false,
        rating: 5.0
      });
    } else if (roleType === 'advertiser') {
      loginAsMockUser({
        uid: 'dev-advertiser-001',
        phone: '+962793333333',
        role: 'advertiser',
        name: 'Ø´Ø±ÙŠØ§Ù† Ø§Ù„ØªÙ…ÙˆÙŠÙ„ (Ù…Ø¹Ù„Ù† ØªØ¬Ø±ÙŠØ¨ÙŠ)',
        governorate: 'Ø¹Ù…Ø§Ù†',
        district: 'Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©',
        isBufferActive: false,
        rating: 5.0,
        companyName: 'Ø¨ÙŠÙ†ÙƒÙ… Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ø¥Ø¹Ù„Ø§Ù…',
        commercialRegister: 'CR-88294-A',
        adLicense: 'LIC-990-2026',
        businessType: 'commercial'
      });
    } else if (roleType === 'delegate') {
      loginAsMockUser({
        uid: 'dev-delegate-001',
        phone: '+962794444444',
        role: 'delegate',
        name: 'Ø³ÙÙŠØ± Ø§Ù„Ù…ÙŠØ¯Ø§Ù† (Ù…Ù†Ø¯ÙˆØ¨ ØªØ¬Ø±ÙŠØ¨ÙŠ)',
        governorate: 'Ø¹Ù…Ø§Ù†',
        district: 'ÙˆØ§Ø¯ÙŠ Ø§Ù„Ø³ÙŠØ±',
        isBufferActive: false,
        rating: 4.8,
        referralCode: 'RAD-JOR-777',
        referredCount: 142,
        pendingDues: 85.50
      });
    }
  };

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
      case 'advertiser':
      case 'ProfessionalStep':
        return <AdvertiserStep />;
      default:
        return <RoleStep />;
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'admin': return 'Ø§Ù„ÙˆØµÙˆÙ„ Ø§Ù„Ø³ÙŠØ§Ø¯ÙŠ Ø§Ù„Ù…Ø­Ø¸ÙˆØ±';
      default: return 'Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„Ø³ÙŠØ§Ø¯Ø© Ø§Ù„Ù…ÙˆØ­Ø¯Ø©';
    }
  };

  const getDescription = () => {
    switch (step) {
      case 'role': return 'Ø­Ø¯Ø¯ ØµÙØªÙƒ Ø§Ù„Ù…ÙŠØ¯Ø§Ù†ÙŠØ©';
      case 'personal': return 'Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø´Ø®ØµÙŠØ© ÙˆØ§Ù„Ø³ÙŠØ§Ø¯ÙŠØ©';
      case 'affiliation': return 'ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ø§Ù†ØªÙ…Ø§Ø¡ Ø§Ù„Ù‚Ø·Ø§Ø¹ÙŠ';
      case 'vehicle': return 'Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ù‡Ù†ÙŠØ© Ù„Ù„Ù…Ø±ÙƒØ¨Ø©';
      case 'admin': return 'Ø£Ø¯Ø®Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯ Ù„Ù„Ù…Ø§Ù„Ùƒ';
      case 'advertiser':
      case 'ProfessionalStep': return 'Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ù‡Ù†ÙŠØ© ÙˆØ§Ù„ØªØ¬Ø§Ø±ÙŠØ© Ù„Ù„Ù…Ø¹Ù„Ù†';
      default: return '';
    }
  };

  if (step === 'role' || step === 'personal') {
    return renderStep();
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* ØªØ£Ø«ÙŠØ± Ø¥Ø¶Ø§Ø¡Ø© Ø®Ù„ÙÙŠØ© Ø®Ø§ÙØªØ© (Spotlight Effect) Ø®Ù„Ù Ø§Ù„ÙƒØ§Ø±Ø¯ Ù„Ø²ÙŠØ§Ø¯Ø© Ø§Ù„Ø¹Ù…Ù‚ */}
      <div className="absolute w-[500px] h-[500px] bg-[#14B8A6]/5 rounded-full blur-[120px] top-1/4 left-1/4 pointer-events-none"></div>
      <div className="absolute w-[400px] h-[400px] bg-[#3B82F6]/5 rounded-full blur-[100px] bottom-1/4 right-1/4 pointer-events-none"></div>

      {/* Ø­Ø§ÙˆÙŠØ© Ø´Ø§Ø´Ø© Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© (Ø§Ù„ÙƒØ±Øª Ø§Ù„Ø·Ø§ÙÙŠ) */}
      <div className={`w-full max-w-md bg-[#161F30]/95 border transition-all duration-500 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative z-10 ${step === 'admin' ? 'border-destructive/50 shadow-destructive/20' : 'border-[#243249] hover:border-[#14B8A6]/50'}`}>
        
        {/* Ù…Ù†Ø·Ù‚Ø© Ø§Ù„Ø´Ø¹Ø§Ø± (Ø§Ù„Ù‡ÙˆÙŠØ© Ø§Ù„Ø¨ØµØ±ÙŠØ© Ø§Ù„Ù…ØªÙƒØ§Ù…Ù„Ø©) */}
        <div className="text-center mb-8 select-none" onClick={handleLogoTap}>
          <div className="flex items-center justify-center gap-2 tracking-wide cursor-pointer active:scale-95 transition-transform">
            {/* ÙƒÙ„Ù…Ø© byn Ø¨Ø§Ù„Ø£Ø²Ø±Ù‚ Ø§Ù„Ù…ØªÙˆØ³Ø· */}
            <span className="text-3xl font-light text-[#3B82F6] font-mono lowercase">byn</span>
            
            {/* Ø§Ù„Ù…Ø­ÙƒÙ… Ø§Ù„Ø¨ØµØ±ÙŠ - Ø±Ù…Ø² Ø§Ù„Ù€ K Ø§Ù„Ù‡Ù†Ø¯ÙŠ Ø§Ù„ÙÙŠØ±ÙˆØ²ÙŠ */}
            <div className="relative w-8 h-8 flex items-center justify-center bg-[#14B8A6] rotate-45 rounded-[4px] shadow-[0_0_15px_rgba(20,184,166,0.3)]">
              <span className="-rotate-45 font-black text-[#0B0F19] text-lg select-none">K</span>
            </div>
            
            {/* ÙƒÙ„Ù…Ø© com Ø¨Ø§Ù„Ø£Ø²Ø±Ù‚ Ù…Ø¹ Ø§Ù„ØªØ¹Ø¨ÙŠØ± Ø§Ù„Ø¯ÙˆÙ„ÙŠ ÙÙˆÙ‚Ù‡Ø§ */}
            <div className="flex flex-col items-start leading-none">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#14B8A6] font-medium mb-0.5">International</span>
              <span className="text-3xl font-bold text-[#3B82F6] font-mono lowercase">com</span>
            </div>
          </div>
          
          {/* Ø§Ù„ÙƒÙ„Ù…Ø§Øª Ø§Ù„ÙØ±Ø¹ÙŠØ© Ø¨Ø§Ù„ÙƒØ­Ù„ÙŠ Ø§Ù„Ø³Ø§Ø·Ø¹/Ø§Ù„Ø±Ù…Ø§Ø¯ÙŠ Ø§Ù„Ø¯Ø§ÙƒÙ† */}
          <div className="flex justify-between items-center px-4 mt-2 text-[10px] uppercase tracking-[0.4em] text-[#94A3B8]/60 font-semibold border-t border-[#243249]/50 pt-2 w-[85%] mx-auto">
            <span>Travel</span>
            <span>Booking</span>
          </div>
        </div>

        {/* Ø§Ù„ÙƒÙ„Ù…Ø§Øª ÙˆØ§Ù„Ø£ÙˆØµØ§Ù Ø§Ù„Ù…Ø­Ø¯Ø¯Ø© Ù„Ù„Ø®Ø·ÙˆØ§Øª */}
        <div className="text-center mb-6">
          <h2 className={`text-xl font-bold tracking-wide ${step === 'admin' ? 'text-destructive' : 'text-white'}`}>
            {getTitle()}
          </h2>
          <p className="text-xs text-[#94A3B8]/80 mt-1.5">
            {getDescription()}
          </p>
        </div>

        <div>
          {renderStep()}

          {/* ðŸ›¡ï¸ Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„Ø¹Ø¨ÙˆØ± Ø§Ù„Ø³Ø±ÙŠØ¹ Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ© - ØªØ¸Ù‡Ø± ÙÙŠ Ø¨ÙŠØ¦Ø© Ø§Ù„ØªØ·ÙˆÙŠØ± ÙÙ‚Ø· Ù„Ù…Ù†Ø¹ ØªØ²ÙŠÙŠÙ Ø§Ù„Ø­Ù‚Ø§Ø¦Ù‚ */}
          {import.meta.env.DEV && (
            <div className="pt-4 border-t border-[#243249]/50 mt-6 space-y-3">
              <div className="text-center">
                <span className="text-xs text-[#14B8A6]/80 font-semibold bg-[#14B8A6]/10 px-2.5 py-1 rounded-full border border-[#14B8A6]/20 inline-block">
                  ðŸ›¡ï¸ Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„Ø¹Ø¨ÙˆØ± Ø§Ù„Ø³Ø±ÙŠØ¹Ø© Ø§Ù„Ù…Ø±Ø¬Ø¹ÙŠØ© (Ø¨ÙŠØ¦Ø© Ø§Ù„ØªØ·ÙˆÙŠØ±)
                </span>
                <p className="text-[10px] text-[#94A3B8]/50 mt-1">
                  ØªØªÙŠØ­ Ù…Ø­Ø§ÙƒØ§Ø© Ø§Ù„Ø£Ø¯ÙˆØ§Ø± Ø¨Ù…Ø±ÙˆÙ†Ø© ØªØ§Ù…Ø© ÙˆØ§Ø³ØªØ¦ØµØ§Ù„Ø§Ù‹ Ù„ØªØ²ÙŠÙŠÙ Ø§Ù„Ø­Ù‚Ø§Ø¦Ù‚ Ø§Ù„ÙÙ†ÙŠØ©.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDevBypass('rider')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-[#0B0F19] border border-[#243249] hover:bg-[#161F30] hover:border-[#14B8A6]/50 text-white/85 text-[11px] transition-all cursor-pointer active:scale-95 select-none"
                >
                  <UserCheck className="h-4 w-4 text-[#14B8A6] mb-1" />
                  <span>Ø±Ø§ÙƒØ¨ ØªØ¬Ø±ÙŠØ¨ÙŠ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDevBypass('driver')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-[#0B0F19] border border-[#243249] hover:bg-[#161F30] hover:border-[#14B8A6]/50 text-white/85 text-[11px] transition-all cursor-pointer active:scale-95 select-none"
                >
                  <Car className="h-4 w-4 text-emerald-400 mb-1" />
                  <span>ÙƒØ§Ø¨ØªÙ† ØªØ¬Ø±ÙŠØ¨ÙŠ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDevBypass('admin')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-[#0B0F19] border border-[#243249] hover:bg-[#161F30] hover:border-destructive/50 text-white/85 text-[11px] transition-all cursor-pointer active:scale-95 select-none"
                >
                  <Key className="h-4 w-4 text-amber-500 mb-1" />
                  <span>Ù…Ø´Ø±Ù ØªØ¬Ø±ÙŠØ¨ÙŠ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDevBypass('advertiser')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-[#0B0F19] border border-[#243249] hover:bg-[#161F30] hover:border-[#00ffcc]/50 text-white/85 text-[11px] transition-all cursor-pointer active:scale-95 select-none"
                >
                  <Megaphone className="h-4 w-4 text-[#00ffcc] mb-1" />
                  <span>Ù…Ø¹Ù„Ù† ØªØ¬Ø±ÙŠØ¨ÙŠ ðŸ“¢</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDevBypass('delegate')}
                  className="col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[#0A1128] border border-[#243249] hover:bg-[#111C35] hover:border-amber-500/50 text-amber-300 text-[11px] font-bold transition-all cursor-pointer active:scale-95 select-none shadow-[0_0_15px_rgba(245,158,11,0.08)]"
                >
                  <Users className="h-4 w-4 text-amber-400" />
                  <span>Ù…Ù†Ø¯ÙˆØ¨ ØªØ¬Ø±ÙŠØ¨ÙŠ ðŸ¤ (Ù‚Ù…Ø±Ø© Ø§Ù„ÙˆÙƒÙŠÙ„)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ØªØ°ÙŠÙŠÙ„ Ø§Ù„Ø¨Ø·Ø§Ù‚Ø© */}
        <div className="mt-8 pt-6 border-t border-[#243249]/50 text-center text-[10px] text-[#94A3B8]/40">
          <p>Â© 2026 Ø¨ÙŠÙ†ÙƒÙ… Ø§Ù„Ø¯ÙˆÙ„ÙŠØ© Ù„Ù„Ø­Ø¬ÙˆØ²Ø§Øª. Ø¨Ø±ÙˆØªÙˆÙƒÙˆÙ„ Ù…Ø´ÙØ± Ø¨Ø§Ù„ÙƒØ§Ù…Ù„.</p>
        </div>
      </div>
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
