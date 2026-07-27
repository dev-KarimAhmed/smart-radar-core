'use client';

import { useEffect } from 'react';

import { UserCheck, Car, Key, Megaphone, Users } from 'lucide-react';
import { RegistrationProvider, useRegistration } from '../hooks/use-registration';
import { RoleStep } from './steps/role-step';
import { PersonalStep } from './steps/personal-step';
import { AdminStep } from './steps/admin-step';
import { useAuth } from '@/hooks/use-auth';
import { useAuthLocation } from '@/lib/auth-routing';

const styles = {
  style128_1: "min-h-screen bg-[#0B0F19] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans",
  style130_2: "absolute w-[500px] h-[500px] bg-[#14B8A6]/5 rounded-full blur-[120px] top-1/4 left-1/4 pointer-events-none",
  style131_3: "absolute w-[400px] h-[400px] bg-[#3B82F6]/5 rounded-full blur-[100px] bottom-1/4 right-1/4 pointer-events-none",
  style134_4: "w-full max-w-md bg-[#161F30]/95 border transition-all duration-500 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative z-10 border-destructive/50 shadow-destructive/20",
  style137_5: "text-center mb-8 select-none",
  style138_6: "flex items-center justify-center gap-2 tracking-wide cursor-pointer active:scale-95 transition-transform",
  style140_7: "text-3xl font-light text-[#3B82F6] font-mono lowercase",
  style143_8: "relative w-8 h-8 flex items-center justify-center bg-[#14B8A6] rotate-45 rounded-[4px] shadow-[0_0_15px_rgba(20,184,166,0.3)]",
  style144_9: "-rotate-45 font-black text-[#0B0F19] text-lg select-none",
  style148_10: "flex flex-col items-start leading-none",
  style149_11: "text-[9px] uppercase tracking-[0.2em] text-[#14B8A6] font-medium mb-0.5",
  style150_12: "text-3xl font-bold text-[#3B82F6] font-mono lowercase",
  style155_13: "flex justify-between items-center px-4 mt-2 text-[10px] uppercase tracking-[0.4em] text-[#94A3B8]/60 font-semibold border-t border-[#243249]/50 pt-2 w-[85%] mx-auto",
  style162_14: "text-center mb-6",
  style163_15: "text-xl font-bold tracking-wide text-destructive",
  style166_16: "text-xs text-[#94A3B8]/80 mt-1.5",
  style176_17: "pt-4 border-t border-[#243249]/50 mt-6 space-y-3",
  style177_18: "text-center",
  style178_19: "text-xs text-[#14B8A6]/80 font-semibold bg-[#14B8A6]/10 px-2.5 py-1 rounded-full border border-[#14B8A6]/20 inline-block",
  style181_20: "text-[10px] text-[#94A3B8]/50 mt-1",
  style185_21: "grid grid-cols-2 gap-2",
  style189_22: "flex flex-col items-center justify-center p-2.5 rounded-lg bg-[#0B0F19] border border-[#243249] hover:bg-[#161F30] hover:border-[#14B8A6]/50 text-white/85 text-[11px] transition-all cursor-pointer active:scale-95 select-none",
  style191_23: "h-4 w-4 text-[#14B8A6] mb-1",
  style197_24: "flex flex-col items-center justify-center p-2.5 rounded-lg bg-[#0B0F19] border border-[#243249] hover:bg-[#161F30] hover:border-[#14B8A6]/50 text-white/85 text-[11px] transition-all cursor-pointer active:scale-95 select-none",
  style199_25: "h-4 w-4 text-emerald-400 mb-1",
  style205_26: "flex flex-col items-center justify-center p-2.5 rounded-lg bg-[#0B0F19] border border-[#243249] hover:bg-[#161F30] hover:border-destructive/50 text-white/85 text-[11px] transition-all cursor-pointer active:scale-95 select-none",
  style207_27: "h-4 w-4 text-amber-500 mb-1",
  style213_28: "flex flex-col items-center justify-center p-2.5 rounded-lg bg-[#0B0F19] border border-[#243249] hover:bg-[#161F30] hover:border-[#00ffcc]/50 text-white/85 text-[11px] transition-all cursor-pointer active:scale-95 select-none",
  style215_29: "h-4 w-4 text-[#00ffcc] mb-1",
  style221_30: "col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[#0A1128] border border-[#243249] hover:bg-[#111C35] hover:border-amber-500/50 text-amber-300 text-[11px] font-bold transition-all cursor-pointer active:scale-95 select-none shadow-[0_0_15px_rgba(245,158,11,0.08)]",
  style223_31: "h-4 w-4 text-amber-400",
  style232_32: "mt-8 pt-6 border-t border-[#243249]/50 text-center text-[10px] text-[#94A3B8]/40",
} as const;


const isStrictDevelopment =
  (globalThis as any).process?.env?.NODE_ENV === 'development' ||
  ((process.env.NODE_ENV !== 'production') && process.env.MODE === 'development');

function LoginOrchestrator() {
  const { setRole, setAuthMode, handleLogoTap } = useRegistration();
  const { loginAsMockUser } = useAuth();
  const location = useAuthLocation();

  // Keep the registration context in sync with the URL so a direct visit or
  // refresh to /login/{role} or /register/{role} restores the right form.
  useEffect(() => {
    if (location.view === 'login' || location.view === 'register') {
      setRole(location.role);
      setAuthMode(location.view === 'login' ? 'login' : 'register');
    }
  }, [location.view, location.role, setRole, setAuthMode]);

  const handleDevBypass = (roleType: 'rider' | 'driver' | 'admin' | 'advertiser' | 'delegate') => {
    if (!isStrictDevelopment) return;

    if (roleType === 'rider') {
      loginAsMockUser({
        uid: 'dev-rider-001',
        phone: '+962790000000',
        role: 'rider',
        name: 'راكب تجريبي',
        governorate: 'عمّان',
        countryId: 1,
        currencyAr: 'د.أ',
        currencyEn: 'JOD',
        district: 'الجامعة',
        isBufferActive: false,
        rating: 5.0
      });
    } else if (roleType === 'driver') {
      loginAsMockUser({
        uid: 'dev-driver-001',
        phone: '+962791111111',
        role: 'driver',
        name: 'سائق تجريبي',
        governorate: 'عمّان',
        district: 'الجامعة',
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
          name: 'مستقل'
        }
      });
    } else if (roleType === 'admin') {
      loginAsMockUser({
        uid: 'dev-admin-001',
        phone: '+962792222222',
        role: 'admin',
        name: 'مشرف تجريبي',
        governorate: 'عمّان',
        district: 'الجامعة',
        isBufferActive: false,
        rating: 5.0
      });
    } else if (roleType === 'advertiser') {
      loginAsMockUser({
        uid: 'dev-advertiser-001',
        phone: '+962793333333',
        role: 'advertiser',
        name: 'معلن تجريبي',
        governorate: 'عمّان',
        district: 'الجامعة',
        isBufferActive: false,
        rating: 5.0,
        companyName: 'شركة إعلانات تجريبية',
        commercialRegister: 'CR-88294-A',
        adLicense: 'LIC-990-2026',
        businessType: 'commercial'
      });
    } else if (roleType === 'delegate') {
      loginAsMockUser({
        uid: 'dev-delegate-001',
        phone: '+962794444444',
        role: 'delegate',
        name: 'مندوب تجريبي',
        governorate: 'عمّان',
        district: 'وادي السير',
        isBufferActive: false,
        rating: 4.8,
        referralCode: 'RAD-JOR-777',
        referredCount: 142,
        pendingDues: 85.50
      });
    }
  };

  // Full-screen pages carry their own layout.
  if (location.view === 'role') {
    return <RoleStep />;
  }

  if (location.view === 'login' || location.view === 'register') {
    return <PersonalStep />;
  }

  // Admin control-desk login keeps the framed card layout.
  return (
    <div className={styles.style128_1}>
      {/* Background glow */}
      <div className={styles.style130_2}></div>
      <div className={styles.style131_3}></div>

      {/* Login card */}
      <div className={styles.style134_4}>
        
        {/* Logo */}
        <div className={styles.style137_5} onClick={handleLogoTap}>
          <div className={styles.style138_6}>
            {/* Brand text */}
            <span className={styles.style140_7}>byn</span>
            
            {/* Brand mark */}
            <div className={styles.style143_8}>
              <span className={styles.style144_9}>K</span>
            </div>
            
            {/* Domain text */}
            <div className={styles.style148_10}>
              <span className={styles.style149_11}>International</span>
              <span className={styles.style150_12}>com</span>
            </div>
          </div>
          
          {/* Subtitle */}
          <div className={styles.style155_13}>
            <span>Travel</span>
            <span>Booking</span>
          </div>
        </div>

        {/* Step title */}
        <div className={styles.style162_14}>
          <h2 className={styles.style163_15}>
            دخول المشرف
          </h2>
          <p className={styles.style166_16}>
            أدخل بيانات اعتماد المشرف
          </p>
        </div>

        <div>
          <AdminStep />

          {/* Development demo shortcuts */}
          {isStrictDevelopment && (
            <div className={styles.style176_17}>
              <div className={styles.style177_18}>
                <span className={styles.style178_19}>
                  اختصارات التجربة
                </span>
                <p className={styles.style181_20}>
                  أزرار مخصصة للتجربة السريعة أثناء التطوير.
                </p>
              </div>
              <div className={styles.style185_21}>
                <button
                  type="button"
                  onClick={() => handleDevBypass('rider')}
                  className={styles.style189_22}
                >
                  <UserCheck className={styles.style191_23} />
                  <span>راكب تجريبي</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDevBypass('driver')}
                  className={styles.style197_24}
                >
                  <Car className={styles.style199_25} />
                  <span>سائق تجريبي</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDevBypass('admin')}
                  className={styles.style205_26}
                >
                  <Key className={styles.style207_27} />
                  <span>مشرف تجريبي</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDevBypass('advertiser')}
                  className={styles.style213_28}
                >
                  <Megaphone className={styles.style215_29} />
                  <span>معلن تجريبي</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDevBypass('delegate')}
                  className={styles.style221_30}
                >
                  <Users className={styles.style223_31} />
                  <span>مندوب تجريبي</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.style232_32}>
          <p>© 2026 الرادار الذكي. جميع الحقوق محفوظة.</p>
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
