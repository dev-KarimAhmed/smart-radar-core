'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Eye,
  EyeOff,
  Languages,
  LockKeyhole,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

type AuthType = 'register' | 'login';
type GovernorateKey = 'cairo' | 'giza' | 'sohag';

const roleLabels = {
  rider: { ar: 'راكب', en: 'Rider' },
  captain: { ar: 'كابتن', en: 'Captain' },
  advertiser: { ar: 'معلن', en: 'Advertiser' },
  delegate: { ar: 'مندوب تسويق', en: 'Delegate' },
  admin: { ar: 'مشرف', en: 'Admin' },
} as const;

const governorates: Record<
  GovernorateKey,
  {
    ar: string;
    en: string;
    districts: Array<{ ar: string; en: string }>;
  }
> = {
  cairo: {
    ar: 'القاهرة',
    en: 'Cairo',
    districts: [
      { ar: 'مدينة نصر', en: 'Nasr City' },
      { ar: 'مصر الجديدة', en: 'Heliopolis' },
      { ar: 'المعادي', en: 'Maadi' },
    ],
  },
  giza: {
    ar: 'الجيزة',
    en: 'Giza',
    districts: [
      { ar: 'الدقي', en: 'Dokki' },
      { ar: 'الهرم', en: 'Haram' },
      { ar: '٦ أكتوبر', en: '6th of October' },
    ],
  },
  sohag: {
    ar: 'سوهاج',
    en: 'Sohag',
    districts: [
      { ar: 'مدينة سوهاج', en: 'Sohag City' },
      { ar: 'جرجا', en: 'Girga' },
      { ar: 'أخميم', en: 'Akhmim' },
    ],
  },
};

const copy = {
  ar: {
    languageButton: 'English',
    languageAria: 'تغيير اللغة إلى الإنجليزية',
    brand: 'الرادار الذكي',
    riderContext: 'حساب الراكب',
    registerTitle: 'حساب جديد للراكب',
    loginTitle: 'تسجيل الدخول للراكب',
    registerSubtitle: 'املأ بياناتك مرة واحدة، وبعدها تدخل رحلاتك بسرعة.',
    loginSubtitle: 'اكتب رقم الموبايل وكلمة السر علشان تكمل.',
    fullName: 'الاسم بالكامل',
    fullNamePlaceholder: 'اكتب اسمك',
    phone: 'رقم الموبايل',
    phonePlaceholder: 'رقم الموبايل',
    governorate: 'المحافظة',
    district: 'المركز أو المنطقة',
    password: 'كلمة السر',
    passwordPlaceholder: 'اكتب كلمة السر',
    showPassword: 'إظهار كلمة السر',
    hidePassword: 'إخفاء كلمة السر',
    login: 'تسجيل الدخول',
    register: 'إنشاء الحساب',
    submitLogin: 'دخول الراكب',
    submitRegister: 'ابدأ كراكب',
    hasAccount: 'لديك حساب بالفعل؟',
    noAccount: 'لسه جديد؟',
    switchToLogin: 'سجل دخولك',
    switchToRegister: 'اعمل حساب جديد',
    ticker: ['رحلات أقرب', 'دخول آمن', 'اختيار واضح', 'رادار ذكي V5.5', 'تجربة موبايل سهلة'],
  },
  en: {
    languageButton: 'العربية',
    languageAria: 'Switch language to Arabic',
    brand: 'Smart Radar',
    riderContext: 'Rider Account',
    registerTitle: 'Create Rider Account',
    loginTitle: 'Rider Login',
    registerSubtitle: 'Add your details once, then reach your rides faster.',
    loginSubtitle: 'Enter your phone number and password to continue.',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your name',
    phone: 'Phone Number',
    phonePlaceholder: 'Phone Number',
    governorate: 'Governorate',
    district: 'District or Town',
    password: 'Password',
    passwordPlaceholder: 'Enter password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    login: 'Login',
    register: 'Register',
    submitLogin: 'Login as Rider',
    submitRegister: 'Start as Rider',
    hasAccount: 'Already have an account?',
    noAccount: 'New here?',
    switchToLogin: 'Login',
    switchToRegister: 'Create an account',
    ticker: ['Closer rides', 'Secure access', 'Clear choice', 'Smart Radar V5.5', 'Easy mobile flow'],
  },
} as const;

function AuthRegisterRoute() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language, setLanguage } = useDashboardLanguage();
  const [authType, setAuthType] = useState<AuthType>('register');
  const [governorate, setGovernorate] = useState<GovernorateKey>('cairo');
  const [showPassword, setShowPassword] = useState(false);

  // Honor a ?lang= deep link once on mount by driving the shared locale.
  useEffect(() => {
    const requestedLang = searchParams.get('lang');
    if ((requestedLang === 'ar' || requestedLang === 'en') && requestedLang !== language) {
      setLanguage(requestedLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedRole = searchParams.get('role') || 'rider';
  const role = selectedRole in roleLabels ? selectedRole : 'rider';
  const isArabic = language === 'ar';
  const t = copy[language];
  const roleName = roleLabels[role as keyof typeof roleLabels][language];
  const districtOptions = governorates[governorate].districts;

  const tickerItems = useMemo(() => [...t.ticker, ...t.ticker, ...t.ticker], [t.ticker]);

  const submitMockAuth = () => {
    router.push('/rider/dashboard');
  };

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="relative min-h-screen overflow-hidden bg-[#0B0F19] text-slate-100"
    >
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_12%,rgba(20,184,166,0.20),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(45,212,191,0.08),transparent_28%)]" />

      <button
        type="button"
        aria-label={t.languageAria}
        onClick={() => setLanguage(isArabic ? 'en' : 'ar')}
        className={`fixed top-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-[#161F30]/70 px-4 text-sm font-bold text-slate-100 shadow-2xl backdrop-blur-xl transition hover:border-[#14B8A6] hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/50 ${
          isArabic ? 'left-4' : 'right-4'
        }`}
      >
        <Languages className="h-4 w-4 text-[#14B8A6]" aria-hidden="true" />
        {t.languageButton}
      </button>

      <section className="relative z-10 flex min-h-screen w-full items-center justify-center px-0 py-0 sm:px-6 sm:py-10">
        <div className="flex h-screen w-full max-w-md flex-col justify-center rounded-none border border-white/5 bg-[#161F30]/70 p-6 shadow-2xl backdrop-blur-xl sm:my-12 sm:h-auto sm:min-h-0 sm:rounded-3xl sm:p-8">
          <header className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14B8A6] shadow-[0_0_30px_rgba(20,184,166,0.18)]">
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-[#14B8A6]">
              {t.brand} · {roleName || t.riderContext}
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${authType}-${language}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <h1 className="mt-3 text-3xl font-black tracking-normal text-[#F8FAFC]">
                  {authType === 'register' ? t.registerTitle : t.loginTitle}
                </h1>
                <p className="mt-3 text-sm font-medium leading-6 text-[#94A3B8]">
                  {authType === 'register' ? t.registerSubtitle : t.loginSubtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </header>

          <div className="mb-5 grid grid-cols-2 rounded-2xl border border-white/10 bg-[#0B0F19]/45 p-1">
            {(['register', 'login'] as AuthType[]).map((mode) => {
              const active = authType === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAuthType(mode)}
                  className="relative min-h-11 rounded-xl px-3 text-sm font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/50"
                >
                  {active ? (
                    <motion.span
                      layoutId="auth-view-active"
                      className="absolute inset-0 rounded-xl border border-[#14B8A6]/45 bg-[#14B8A6]/15 shadow-[0_0_18px_rgba(20,184,166,0.14)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <span className={`relative z-10 ${active ? 'text-[#F8FAFC]' : 'text-[#94A3B8]'}`}>
                    {mode === 'register' ? t.register : t.login}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.form
              key={authType}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                submitMockAuth();
              }}
            >
              {authType === 'register' ? (
                <Field label={t.fullName} icon={<UserRound className="h-5 w-5" />}>
                  <input
                    suppressHydrationWarning
                    type="text"
                    placeholder={t.fullNamePlaceholder}
                    className={inputClass}
                    autoComplete="name"
                  />
                </Field>
              ) : null}

              <Field label={t.phone} icon={<Phone className="h-5 w-5" />}>
                <input
                  suppressHydrationWarning
                  type="tel"
                  inputMode="numeric"
                  placeholder={t.phonePlaceholder}
                  className={inputClass}
                  autoComplete="tel"
                />
              </Field>

              {authType === 'register' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={t.governorate} icon={<MapPin className="h-5 w-5" />}>
                    <div className="relative">
                      <select
                        suppressHydrationWarning
                        value={governorate}
                        onChange={(event) => setGovernorate(event.target.value as GovernorateKey)}
                        className={`${inputClass} appearance-none pe-10`}
                      >
                        {(Object.keys(governorates) as GovernorateKey[]).map((key) => (
                          <option key={key} value={key}>
                            {governorates[key][language]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8] ltr:right-3 rtl:left-3" />
                    </div>
                  </Field>

                  <Field label={t.district} icon={<MapPin className="h-5 w-5" />}>
                    <div className="relative">
                      <select suppressHydrationWarning className={`${inputClass} appearance-none pe-10`}>
                        {districtOptions.map((district) => (
                          <option key={district.en} value={district.en}>
                            {district[language]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8] ltr:right-3 rtl:left-3" />
                    </div>
                  </Field>
                </div>
              ) : null}

              <Field label={t.password} icon={<LockKeyhole className="h-5 w-5" />}>
                <div className="relative">
                  <input
                    suppressHydrationWarning
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.passwordPlaceholder}
                    className={`${inputClass} pe-12`}
                    autoComplete={authType === 'register' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#94A3B8] transition hover:bg-[#14B8A6]/10 hover:text-[#14B8A6] ltr:right-2 rtl:left-2"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </Field>

              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ y: -1 }}
                type="submit"
                className="mt-2 w-full rounded-2xl bg-[#14B8A6] p-4 text-base font-black text-[#0B0F19] shadow-[0_16px_45px_rgba(20,184,166,0.22)] transition hover:bg-[#2DD4BF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60"
              >
                {authType === 'register' ? t.submitRegister : t.submitLogin}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          <div className="mt-6 text-center text-sm font-semibold text-[#94A3B8]">
            <span>{authType === 'register' ? t.hasAccount : t.noAccount}</span>{' '}
            <button
              type="button"
              onClick={() => setAuthType((current) => (current === 'register' ? 'login' : 'register'))}
              className="font-black text-[#14B8A6] underline-offset-4 transition hover:text-[#2DD4BF] hover:underline"
            >
              {authType === 'register' ? t.switchToLogin : t.switchToRegister}
            </button>
          </div>
        </div>
      </section>

      <div className="absolute inset-x-0 bottom-0 z-0 h-14 overflow-hidden border-t border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div
          className={`flex w-max min-w-[200%] gap-8 whitespace-nowrap py-5 ${
            isArabic
              ? '[animation:ad-river-rtl_28s_linear_infinite]'
              : '[animation:ad-river-ltr_28s_linear_infinite]'
          }`}
        >
          {tickerItems.map((item, index) => (
            <span key={`${item}-${index}`} className="text-xs font-bold text-[#94A3B8] odd:text-[#F8FAFC]">
              {item}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-bold text-[#F8FAFC]">
        <span className="text-[#14B8A6]">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  'min-h-12 w-full rounded-2xl border border-white/10 bg-[#0B0F19]/50 px-4 text-base font-semibold text-[#F8FAFC] outline-none transition placeholder:text-[#64748B] focus:border-[#14B8A6] focus:shadow-[0_0_10px_rgba(20,184,166,0.1)]';

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading layout parameters...</div>}>
      <AuthRegisterRoute />
    </Suspense>
  );
}
