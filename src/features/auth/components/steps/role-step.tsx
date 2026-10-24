'use client';

import React from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CarTaxiFront,
  Construction,
  Languages,
  Megaphone,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react';
import { useRegistration } from '../../hooks/use-registration';
import { useAuth } from '@/hooks/use-auth';
import { navigateAuth } from '@/lib/auth-routing';
import type { User } from '@/core/types';

import { cn } from '@/lib/utils';
const styles = {
  style260_1: "relative min-h-dvh overflow-x-hidden overflow-y-auto bg-[#0B0F19] text-slate-100",
  style262_2: "pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_10%,rgba(20,184,166,0.22),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(45,212,191,0.10),transparent_28%)]",
  style271_3: "fixed top-4 z-40 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-[#161F30]/60 px-4 text-sm font-bold text-slate-100 shadow-2xl backdrop-blur-xl transition-colors duration-300 hover:border-[#14B8A6] hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] focus-visible:border-[#14B8A6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/40 sm:top-6 sm:min-h-12 sm:px-5",
  style272_4: "left-4 sm:left-6",
  style272_5: "right-4 sm:right-6",
  style275_6: "h-4 w-4 text-[#14B8A6]",
  style279_7: "relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 pb-20 pt-24 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8 xl:justify-center",
  style280_8: "mx-auto flex max-w-3xl flex-col items-center text-center",
  style281_9: "mx-auto mb-4 flex items-center justify-center",
  brandLogoImg: "h-24 sm:h-28 md:h-32 w-auto object-contain drop-shadow-[0_6px_30px_rgba(20,184,166,0.45)] select-none transition-transform duration-300 hover:scale-105",
  style282_10: "h-7 w-7",
  style285_11: " max-w-3xl text-balance text-4xl font-black leading-tight tracking-normal text-[#F8FAFC] sm:text-5xl lg:text-7xl",
  style289_12: "mt-4 text-lg font-semibold leading-8 text-[#94A3B8] sm:text-xl",
  style328_19: "mx-auto mt-10 grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6",
  style329_20: "lg:grid-cols-5",
  style348_22: "group flex h-full min-h-52 flex-col items-start justify-between gap-4 rounded-3xl border border-white/5 bg-[#161F30]/60 p-5 text-start shadow-2xl backdrop-blur-xl transition-colors duration-300 hover:border-[#14B8A6] hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] focus-visible:border-[#14B8A6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/40 active:border-[#14B8A6] active:shadow-[0_0_20px_rgba(20,184,166,0.15)] sm:min-h-56 sm:p-6",
  style349_23: "text-right",
  style349_24: "text-left",
  style352_25: "flex w-full flex-col items-start gap-4",
  style353_26: "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 p-3 text-[#14B8A6] transition-colors duration-300 group-hover:border-[#14B8A6]/55 group-hover:bg-[#14B8A6]/15",
  style354_27: "h-7 w-7",
  style357_28: "block text-xl font-black leading-7 tracking-normal text-slate-100",
  style362_29: "block text-sm font-medium leading-7 text-slate-400 sm:text-[15px]",
  style372_30: "mx-auto mt-8 w-full max-w-6xl rounded-3xl border border-[#14B8A6]/20 bg-[#061414]/70 p-4 shadow-[0_20px_60px_rgba(20,184,166,0.08)] backdrop-blur-xl sm:p-5",
  style373_31: "flex flex-col gap-1",
  style373_32: "text-right",
  style373_33: "text-left",
  style374_34: "text-sm font-black tracking-normal text-[#14B8A6]",
  style377_35: "text-xs font-semibold leading-5 text-[#94A3B8]",
  style382_36: "mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5",
  style390_37: "min-h-24 rounded-2xl border border-white/10 bg-[#0B0F19]/70 p-4 text-left shadow-lg transition hover:border-[#14B8A6]/60 hover:bg-[#102033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/50",
  style392_38: "block text-sm font-black text-[#F8FAFC]",
  style395_39: "mt-2 block text-xs font-semibold leading-5 text-[#94A3B8]",
} as const;


type Lang = 'ar' | 'en';
type RoleKey = 'rider' | 'driver' | 'advertiser' | 'delegate' | 'admin';

const copy = {
  ar: {
    switchLabel: 'English',
    ariaSwitch: 'تغيير اللغة إلى الإنجليزية',
    title: 'مرحبا بك في بينكم - bynkcom',
    subtitle: 'اختر نوع حسابك وكمل دخولك بسهولة',
    underDevelopment: 'قيد التطوير',
    roles: {
      rider: {
        title: 'مستخدم',
        description: 'اطلب رحلتك وشوف الكباتن المعلنين القريبين منك، وحافظ على أمان حسابك.',
      },
      driver: {
        title: 'كابتن معلن',
        description: 'حدد سعرك، اشحن باقة الساعات، واستقبل الطلبات القريبة منك.',
      },
      admin: {
        title: 'مشرف',
        description: 'ادخل لوحة المتابعة، راجع الحسابات، وتابع حركة النظام بهدوء.',
      },
      advertiser: {
        title: 'معلن',
        description: 'اعمل إعلانات موجهة لمنطقتك، وتابع المشاهدات والنقرات بسهولة.',
      },
      delegate: {
        title: 'مندوب تسويق',
        description: 'سجل الكباتن المعلنين والمحلات، وتابع عمولتك من مكان واحد.',
      },
    },
  },
  en: {
    switchLabel: 'العربية',
    ariaSwitch: 'Switch language to Arabic',
    title: 'Welcome to bynkcom',
    subtitle: 'Choose your account type and continue securely',
    underDevelopment: 'Under Development',
    roles: {
      rider: {
        title: 'Rider',
        description: 'Request your ride, view nearby drivers, and secure your account with a trust score.',
      },
      driver: {
        title: 'Captain',
        description: 'Set your own rates, top up your hourly package, and receive requests silently.',
      },
      admin: {
        title: 'Admin',
        description: 'Open the control desk, review accounts, and keep system operations calm.',
      },
      advertiser: {
        title: 'Advertiser',
        description: 'Launch hyper-local ads targeted to specific areas and track live metrics.',
      },
      delegate: {
        title: 'Delegate',
        description: 'Onboard drivers and shops in the field, and earn guaranteed commissions.',
      },
    },
  },
} as const;

const roleConfig: Array<{
  key: RoleKey;
  Icon: typeof UserRound;
  disabled?: boolean;
}> = [
    { key: 'rider', Icon: UserRound },
    { key: 'driver', Icon: CarTaxiFront },
    { key: 'admin', Icon: ShieldCheck },
    { key: 'advertiser', Icon: Megaphone, disabled: true },
    { key: 'delegate', Icon: Store, disabled: true },
  ];

const demoUsers: Array<{
  role: User['role'];
  label: string;
  description: string;
  user: User;
}> = [
    {
      role: 'rider',
      label: 'Rider demo',
      description: 'Requests, wallet, ride history',
      user: {
        uid: 'demo-rider-001',
        serial_id: 'P-1001',
        phone: '+962790000001',
        role: 'rider',
        name: 'Demo Rider',
        countryId: 1,
        currencyAr: 'د.أ',
        currencyEn: 'JOD',
        governorate: 'عمّان',
        district: 'الجامعة',
        isBufferActive: false,
        rating: 5,
        walletBalanceJD: 42.5,
        ratingSum: 48,
        ratingCount: 10,
        favoriteDrivers: ['demo-driver-001'],
      },
    },
    {
      role: 'driver',
      label: 'Captain demo',
      description: 'Driver radar, pricing, hours',
      user: {
        uid: 'demo-driver-001',
        serial_id: 'D-1001',
        phone: '+962790000002',
        role: 'driver',
        name: 'Demo Captain',
        governorate: 'عمّان',
        district: 'الجامعة',
        status: 'idle',
        isBufferActive: false,
        rating: 4.9,
        rank: 'Gold',
        paidHoursRemaining: 540,
        bonusHoursRemaining: 60,
        subscriptionHours: 10,
        walletBalanceJD: 128,
        vehicle: {
          year: 2023,
          plate: '77-12345',
          make: 'Toyota Corolla Hybrid',
          color: 'White',
        },
        affiliation: {
          type: 'independent',
          name: 'مستقل',
        },
      },
    },
    {
      role: 'advertiser',
      label: 'Advertiser demo',
      description: 'Campaign portal and ad tools',
      user: {
        uid: 'demo-advertiser-001',
        serial_id: 'A-1001',
        phone: '+962790000003',
        role: 'advertiser',
        name: 'Demo Advertiser',
        governorate: 'عمّان',
        district: 'الجامعة',
        isBufferActive: false,
        rating: 5,
        walletBalanceJD: 250,
        companyName: 'bynkcom Ads',
        commercialRegister: 'CR-88294-A',
        adLicense: 'LIC-990-2026',
        businessType: 'commercial',
      },
    },
    {
      role: 'delegate',
      label: 'Delegate demo',
      description: 'Field onboarding cockpit',
      user: {
        uid: 'demo-delegate-001',
        serial_id: 'M-1001',
        phone: '+962790000004',
        role: 'delegate',
        name: 'Demo Delegate',
        governorate: 'عمّان',
        district: 'وادي السير',
        isBufferActive: false,
        rating: 4.8,
        referralCode: 'RAD-JOR-777',
        referredCount: 142,
        pendingDues: 85.5,
        walletBalanceJD: 85.5,
      },
    },
    {
      role: 'admin',
      label: 'Admin demo',
      description: 'Owner control dashboard',
      user: {
        uid: 'demo-admin-001',
        serial_id: 'S-1001',
        phone: '+962790000005',
        role: 'admin',
        name: 'Demo Admin',
        governorate: 'عمّان',
        district: 'الجامعة',
        isBufferActive: false,
        rating: 5,
      },
    },
  ];

export function RoleStep() {
  const { setRole, lang, setLang } = useRegistration();
  const { loginAsMockUser } = useAuth();
  const currentLang = lang as Lang;
  const content = copy[currentLang];
  const isArabic = currentLang === 'ar';

  // Every card leads straight to login for that role — there's no separate
  // "create account" switch here; a failed login is what offers to create
  // an account instead (see PersonalStep's create-account link).
  const handleRoleSelect = (role: RoleKey) => {
    setRole(role);
    navigateAuth('login', role);
  };

  const openDemoDashboard = (user: User) => {
    const roleRoutes: Partial<Record<User['role'], string>> = {
      rider: '/rider',
      driver: '/captain',
      advertiser: '/advertiser/dashboard',
      delegate: '/delegate',
      admin: '/admin',
    };
    window.history.replaceState(null, '', roleRoutes[user.role] || '/');
    window.location.hash = '#';
    window.dispatchEvent(new PopStateEvent('popstate'));
    loginAsMockUser(user);
  };

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className={styles.style260_1}
    >
      <div className={styles.style262_2} />

      <motion.button
        type="button"
        aria-label={content.ariaSwitch}
        onClick={() => setLang(isArabic ? 'en' : 'ar')}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className={cn(styles.style271_3, isArabic ? styles.style272_4 : styles.style272_5)}
      >
        <Languages aria-hidden="true" className={styles.style275_6} />
        <span>{content.switchLabel}</span>
      </motion.button>

      <section className={styles.style279_7}>
        <div className={styles.style280_8}>
          <div className={styles.style281_9}>
            <Image
              src="/icons/logo-header.png"
              alt="Radar"
              width={585}
              height={152}
              priority
              className={styles.brandLogoImg}
            />
          </div>

          <h1 className={styles.style285_11}>
            {content.title}
          </h1>

          <p className={styles.style289_12}>
            {content.subtitle}
          </p>
        </div>

        <motion.div
          layout
          className={cn(styles.style328_19, styles.style329_20)}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {roleConfig.map(({ key, Icon, disabled }, index) => {
              const role = content.roles[key];

              return (
                <motion.button
                  layout
                  key={key}
                  type="button"
                  disabled={disabled}
                  aria-disabled={disabled}
                  onClick={() => {
                    if (!disabled) {
                      handleRoleSelect(key);
                    }
                  }}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: disabled ? 0.55 : 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.94 }}
                  transition={{ duration: 0.32, delay: index * 0.035, ease: 'easeOut' }}
                  whileHover={disabled ? undefined : { scale: 1.05, y: -5 }}
                  whileTap={disabled ? undefined : { scale: 0.985 }}
                  className={cn(
                    styles.style348_22,
                    isArabic ? styles.style349_23 : styles.style349_24,
                    disabled && "cursor-not-allowed opacity-55 bg-[#161F30]/30 border-white/5 hover:border-white/5 hover:shadow-none select-none pointer-events-none sm:pointer-events-auto"
                  )}
                >
                  <div className={styles.style352_25}>
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className={cn(
                        styles.style353_26,
                        disabled && "border-slate-700/40 bg-slate-800/30 text-slate-500 group-hover:border-slate-700/40 group-hover:bg-slate-800/30"
                      )}>
                        <Icon aria-hidden="true" className={styles.style354_27} strokeWidth={1.8} />
                      </span>

                      {disabled && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-black text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                          <Construction className="h-3 w-3 text-amber-400" />
                          <span>{content.underDevelopment}</span>
                        </span>
                      )}
                    </div>

                    <span className={cn(styles.style357_28, disabled && "text-slate-400")}>
                      {role.title}
                    </span>
                  </div>

                  <span className={cn(styles.style362_29, disabled && "text-slate-500")}>
                    {role.description}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </section>
    </main>
  );
}
