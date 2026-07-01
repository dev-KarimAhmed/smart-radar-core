'use client';

import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CarTaxiFront,
  Languages,
  Megaphone,
  ShieldCheck,
  Store,
  UserCog,
  UserRound,
} from 'lucide-react';
import { useRegistration } from '@/hooks/use-registration';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@/core/types';

type Lang = 'ar' | 'en';
type AuthMode = 'login' | 'register';
type RoleKey = 'rider' | 'driver' | 'advertiser' | 'delegate' | 'admin';

const copy = {
  ar: {
    switchLabel: 'English',
    ariaSwitch: 'تغيير اللغة إلى الإنجليزية',
    title: 'مرحباً بك في الرادار الذكي',
    subtitle: 'اختار نوع حسابك وكمل دخولك بسهولة',
    modes: {
      login: 'تسجيل الدخول',
      register: 'حساب جديد',
    },
    roles: {
      rider: {
        title: 'راكب',
        description: 'اطلب رحلتك وشوف السواقين اللي حواليك، وحافظ على أمان حسابك برصيد الثقة.',
      },
      driver: {
        title: 'كابتن',
        description: 'حدد سعرك براحتك، اشحن باقة الساعات بتاعتك، واستقبل طلباتك في صمت.',
      },
      advertiser: {
        title: 'معلن',
        description: 'اعمل إعلانات موجهة لمنطقتك بالظبط، وتابع المشاهدات والنقرات أول بأول.',
      },
      delegate: {
        title: 'مندوب تسويق',
        description: 'سجل السواقين والمحلات في الشارع، واكسب عمولتك المضمونة معانا.',
      },
      admin: {
        title: 'مشرف',
        description: 'ادخل لوحة المتابعة، راجع الحسابات، وخلي حركة النظام ماشية بهدوء.',
      },
    },
  },
  en: {
    switchLabel: 'العربية',
    ariaSwitch: 'Switch language to Arabic',
    title: 'Welcome to Smart Radar',
    subtitle: 'Choose your account type and continue securely',
    modes: {
      login: 'Login',
      register: 'Register',
    },
    roles: {
      rider: {
        title: 'Rider',
        description: 'Request your ride, view nearby drivers, and secure your account with a trust score.',
      },
      driver: {
        title: 'Captain',
        description: 'Set your own rates, top up your hourly package, and receive requests silently.',
      },
      advertiser: {
        title: 'Advertiser',
        description: 'Launch hyper-local ads targeted to specific areas and track live metrics.',
      },
      delegate: {
        title: 'Delegate',
        description: 'Onboard drivers and shops in the field, and earn guaranteed commissions.',
      },
      admin: {
        title: 'Admin',
        description: 'Open the control desk, review accounts, and keep system operations calm.',
      },
    },
  },
} as const;

const roleConfig: Array<{
  key: RoleKey;
  Icon: typeof UserRound;
}> = [
  { key: 'rider', Icon: UserRound },
  { key: 'driver', Icon: CarTaxiFront },
  { key: 'advertiser', Icon: Megaphone },
  { key: 'delegate', Icon: Store },
  { key: 'admin', Icon: UserCog },
];

const authModes: AuthMode[] = ['login', 'register'];

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
      governorate: 'عمان',
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
      governorate: 'عمان',
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
      governorate: 'عمان',
      district: 'الجامعة',
      isBufferActive: false,
      rating: 5,
      walletBalanceJD: 250,
      companyName: 'Smart Radar Ads',
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
      governorate: 'عمان',
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
      governorate: 'عمان',
      district: 'الجامعة',
      isBufferActive: false,
      rating: 5,
    },
  },
];

export function RoleStep() {
  const { setRole, setStep, authMode, setAuthMode, lang, setLang } = useRegistration();
  const { loginAsMockUser } = useAuth();
  const currentLang = lang as Lang;
  const content = copy[currentLang];
  const isArabic = currentLang === 'ar';

  const visibleRoles = useMemo(
    () => roleConfig.filter((role) => authMode === 'login' || role.key !== 'admin'),
    [authMode],
  );

  const handleRoleSelect = (role: RoleKey) => {
    if (role === 'admin') {
      setStep('admin');
      return;
    }

    setRole(role);
    setStep('personal');
  };

  const openDemoDashboard = (user: User) => {
    if (user.role === 'advertiser') {
      window.history.replaceState(null, '', '/advertiser/dashboard');
    } else {
      window.history.replaceState(null, '', '/');
    }
    window.location.hash = '#';
    window.dispatchEvent(new PopStateEvent('popstate'));
    loginAsMockUser(user);
  };

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="relative min-h-screen overflow-x-hidden bg-[#0B0F19] text-slate-100"
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_10%,rgba(20,184,166,0.22),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(45,212,191,0.10),transparent_28%)]" />

      <motion.button
        type="button"
        aria-label={content.ariaSwitch}
        onClick={() => setLang(isArabic ? 'en' : 'ar')}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className={`fixed top-4 z-40 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-[#161F30]/60 px-4 text-sm font-bold text-slate-100 shadow-2xl backdrop-blur-xl transition-colors duration-300 hover:border-[#14B8A6] hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] focus-visible:border-[#14B8A6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/40 sm:top-6 sm:min-h-12 sm:px-5 ${
          isArabic ? 'left-4 sm:left-6' : 'right-4 sm:right-6'
        }`}
      >
        <Languages aria-hidden="true" className="h-4 w-4 text-[#14B8A6]" />
        <span>{content.switchLabel}</span>
      </motion.button>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/35 bg-[#14B8A6]/10 text-[#14B8A6] shadow-[0_0_32px_rgba(20,184,166,0.18)] sm:h-16 sm:w-16">
            <ShieldCheck aria-hidden="true" className="h-7 w-7" strokeWidth={1.8} />
          </div>

          <h1 className="mt-6 max-w-3xl text-balance text-4xl font-black leading-tight tracking-normal text-[#F8FAFC] sm:text-5xl lg:text-7xl">
            {content.title}
          </h1>

          <p className="mt-4 text-lg font-semibold leading-8 text-[#94A3B8] sm:text-xl">
            {content.subtitle}
          </p>

          <div
            className="mt-8 grid w-full max-w-md grid-cols-2 rounded-full border border-white/10 bg-[#161F30]/60 p-1.5 shadow-2xl backdrop-blur-xl"
            role="tablist"
            aria-label="Authentication mode"
          >
            {authModes.map((mode) => {
              const active = authMode === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setAuthMode(mode)}
                  className="relative min-h-11 rounded-full px-4 text-sm font-black tracking-normal text-slate-400 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/50 sm:text-base"
                >
                  {active ? (
                    <motion.span
                      layoutId="auth-mode-active-pill"
                      className="absolute inset-0 rounded-full border border-[#14B8A6]/45 bg-[#14B8A6]/15 shadow-[0_0_24px_rgba(20,184,166,0.18)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <span className={`relative z-10 ${active ? 'text-[#F8FAFC]' : 'text-[#94A3B8]'}`}>
                    {content.modes[mode]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <motion.div
          layout
          className={`mx-auto mt-10 grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6 ${
            authMode === 'login' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'
          }`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleRoles.map(({ key, Icon }, index) => {
              const role = content.roles[key];

              return (
                <motion.button
                  layout
                  key={key}
                  type="button"
                  onClick={() => handleRoleSelect(key)}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.94 }}
                  transition={{ duration: 0.32, delay: index * 0.035, ease: 'easeOut' }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.985 }}
                  className={`group flex h-full min-h-52 flex-col items-start justify-between gap-4 rounded-3xl border border-white/5 bg-[#161F30]/60 p-5 text-start shadow-2xl backdrop-blur-xl transition-colors duration-300 hover:border-[#14B8A6] hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] focus-visible:border-[#14B8A6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/40 active:border-[#14B8A6] active:shadow-[0_0_20px_rgba(20,184,166,0.15)] sm:min-h-56 sm:p-6 ${
                    isArabic ? 'text-right' : 'text-left'
                  }`}
                >
                  <div className="flex w-full flex-col items-start gap-4">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 p-3 text-[#14B8A6] transition-colors duration-300 group-hover:border-[#14B8A6]/55 group-hover:bg-[#14B8A6]/15">
                      <Icon aria-hidden="true" className="h-7 w-7" strokeWidth={1.8} />
                    </span>

                    <span className="block text-xl font-black leading-7 tracking-normal text-slate-100">
                      {role.title}
                    </span>
                  </div>

                  <span className="block text-sm font-medium leading-7 text-slate-400 sm:text-[15px]">
                    {role.description}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {import.meta.env.DEV ? (
          <section className="mx-auto mt-8 w-full max-w-6xl rounded-3xl border border-[#14B8A6]/20 bg-[#061414]/70 p-4 shadow-[0_20px_60px_rgba(20,184,166,0.08)] backdrop-blur-xl sm:p-5">
            <div className={`flex flex-col gap-1 ${isArabic ? 'text-right' : 'text-left'}`}>
              <p className="text-sm font-black tracking-normal text-[#14B8A6]">
                Demo dashboards
              </p>
              <p className="text-xs font-semibold leading-5 text-[#94A3B8]">
                Testing-only buttons that load demo data and enter each role dashboard.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {demoUsers.map((demo) => (
                <motion.button
                  key={demo.role}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openDemoDashboard(demo.user)}
                  className="min-h-24 rounded-2xl border border-white/10 bg-[#0B0F19]/70 p-4 text-left shadow-lg transition hover:border-[#14B8A6]/60 hover:bg-[#102033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/50"
                >
                  <span className="block text-sm font-black text-[#F8FAFC]">
                    {demo.label}
                  </span>
                  <span className="mt-2 block text-xs font-semibold leading-5 text-[#94A3B8]">
                    {demo.description}
                  </span>
                </motion.button>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
