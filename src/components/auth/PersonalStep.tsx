'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Eye,
  EyeOff,
  Languages,
  Loader2,
  LockKeyhole,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useRegistration } from '@/hooks/use-registration';

type Lang = 'ar' | 'en';
type AuthMode = 'register' | 'login';

const roleLabels = {
  rider: { ar: 'راكب', en: 'Rider' },
  driver: { ar: 'كابتن', en: 'Captain' },
  advertiser: { ar: 'معلن', en: 'Advertiser' },
  delegate: { ar: 'مندوب تسويق', en: 'Delegate' },
} as const;

const copy = {
  ar: {
    languageButton: 'English',
    languageAria: 'تغيير اللغة إلى الإنجليزية',
    brand: 'الرادار الذكي',
    registerTitle: 'حساب جديد',
    loginTitle: 'تسجيل الدخول',
    registerSubtitle: 'اكتب بياناتك مرة واحدة، وبعدها تدخل رحلاتك بسرعة.',
    loginSubtitle: 'اكتب رقم الهاتف وكلمة المرور للمتابعة.',
    fullName: 'الاسم الكامل',
    fullNamePlaceholder: 'اكتب اسمك',
    phone: 'رقم الهاتف',
    phonePlaceholder: '+962790000000',
    governorate: 'المحافظة',
    governoratePlaceholder: 'اختر المحافظة',
    district: 'اللواء / المنطقة',
    districtPlaceholder: 'اختر المنطقة',
    loadingLocations: 'جاري تحميل المحافظات والمناطق...',
    mockData: 'بيانات تجربة',
    password: 'كلمة المرور',
    passwordPlaceholder: 'اكتب كلمة المرور',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور',
    rememberMe: 'تذكرني',
    rememberHint: 'ابق مسجلا على هذا الجهاز',
    login: 'تسجيل الدخول',
    register: 'إنشاء الحساب',
    submitLogin: 'دخول الحساب',
    submitRegister: 'إنشاء الحساب',
    hasAccount: 'لديك حساب بالفعل؟',
    noAccount: 'ليس لديك حساب؟',
    switchToLogin: 'سجل دخولك',
    switchToRegister: 'اعمل حساب جديد',
    idTitle: 'الهوية الشخصية',
    idReady: 'تم تجهيز الهوية',
    idCompressing: 'جاري ضغط الصورة...',
    idHint: 'أرفق صورة الهوية لإكمال التحقق',
    back: 'العودة لاختيار نوع الحساب',
    ticker: ['رحلات أقرب', 'دخول آمن', 'اختيار واضح', 'رادار ذكي V5.5', 'تجربة موبايل سهلة'],
  },
  en: {
    languageButton: 'العربية',
    languageAria: 'Switch language to Arabic',
    brand: 'Smart Radar',
    registerTitle: 'Create Account',
    loginTitle: 'Login',
    registerSubtitle: 'Add your details once, then reach your rides faster.',
    loginSubtitle: 'Enter your phone number and password to continue.',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Enter your name',
    phone: 'Phone Number',
    phonePlaceholder: '+962790000000',
    governorate: 'Governorate',
    governoratePlaceholder: 'Choose governorate',
    district: 'District or Area',
    districtPlaceholder: 'Choose district',
    loadingLocations: 'Loading governorates and districts...',
    mockData: 'Test data',
    password: 'Password',
    passwordPlaceholder: 'Enter password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    rememberMe: 'Remember me',
    rememberHint: 'Keep me signed in on this device',
    login: 'Login',
    register: 'Register',
    submitLogin: 'Login',
    submitRegister: 'Create account',
    hasAccount: 'Already have an account?',
    noAccount: 'New here?',
    switchToLogin: 'Login',
    switchToRegister: 'Create an account',
    idTitle: 'Personal ID',
    idReady: 'ID image prepared',
    idCompressing: 'Compressing image...',
    idHint: 'Attach an ID image to complete verification',
    back: 'Back to account type',
    ticker: ['Closer rides', 'Secure access', 'Clear choice', 'Smart Radar V5.5', 'Easy mobile flow'],
  },
} as const;

export function PersonalStep() {
  const {
    personal,
    setPersonal,
    authPassword,
    setAuthPassword,
    rememberMe,
    setRememberMe,
    handlePersonalSubmit,
    governorates,
    districts,
    locationDataLoading,
    fillRandomRegistrationData,
    isSubmitting,
    role,
    setStep,
    authMode,
    setAuthMode,
    lang,
    setLang,
  } = useRegistration();
  const [compressing, setCompressing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const currentLang = lang as Lang;
  const mode = authMode as AuthMode;
  const isArabic = currentLang === 'ar';
  const t = copy[currentLang];
  const roleName = role ? roleLabels[role]?.[currentLang] : roleLabels.rider[currentLang];
  const tickerItems = useMemo(() => [...t.ticker, ...t.ticker, ...t.ticker], [t.ticker]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 250;
        const maxHeight = 250;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        } else if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        setPersonal({ ...personal, verificationDoc: canvas.toDataURL('image/jpeg', 0.4) });
        setCompressing(false);

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([50, 30, 50]);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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
        onClick={() => setLang(isArabic ? 'en' : 'ar')}
        className={`fixed top-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-[#161F30]/70 px-4 text-sm font-bold text-slate-100 shadow-2xl backdrop-blur-xl transition hover:border-[#14B8A6] hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/50 ${
          isArabic ? 'left-4' : 'right-4'
        }`}
      >
        <Languages className="h-4 w-4 text-[#14B8A6]" aria-hidden="true" />
        {t.languageButton}
      </button>

      <section className="relative z-10 flex min-h-screen w-full items-center justify-center px-0 py-0 sm:px-6 sm:py-10">
        <div className="flex min-h-screen w-full max-w-md flex-col justify-center rounded-none border border-white/5 bg-[#161F30]/70 p-6 shadow-2xl backdrop-blur-xl sm:my-12 sm:min-h-0 sm:rounded-3xl sm:p-8">
          <header className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14B8A6] shadow-[0_0_30px_rgba(20,184,166,0.18)]">
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-[#14B8A6]">
              {t.brand} · {roleName}
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${mode}-${currentLang}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <h1 className="mt-3 text-3xl font-black tracking-normal text-[#F8FAFC]">
                  {mode === 'register' ? t.registerTitle : t.loginTitle}
                </h1>
                <p className="mt-3 text-sm font-medium leading-6 text-[#94A3B8]">
                  {mode === 'register' ? t.registerSubtitle : t.loginSubtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </header>

          <div className="mb-5 grid grid-cols-2 rounded-2xl border border-white/10 bg-[#0B0F19]/45 p-1">
            {(['register', 'login'] as AuthMode[]).map((nextMode) => {
              const active = mode === nextMode;

              return (
                <button
                  key={nextMode}
                  type="button"
                  onClick={() => setAuthMode(nextMode)}
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
                    {nextMode === 'register' ? t.register : t.login}
                  </span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
              onSubmit={handlePersonalSubmit}
            >
              {mode === 'register' ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0B0F19]/45 p-3">
                  <div className="flex min-h-9 items-center gap-2 text-xs font-bold text-[#94A3B8]">
                    {locationDataLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-[#14B8A6]" aria-hidden="true" />
                        <span>{t.loadingLocations}</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 text-[#14B8A6]" aria-hidden="true" />
                        <span>{`${governorates.length} / ${districts.length}`}</span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={fillRandomRegistrationData}
                    disabled={locationDataLoading || !governorates.length}
                    className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3 text-xs font-black text-[#14B8A6] transition hover:border-[#14B8A6] hover:bg-[#14B8A6]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    {t.mockData}
                  </button>
                </div>
              ) : null}

              {mode === 'register' ? (
                <Field label={t.fullName} icon={<UserRound className="h-5 w-5" />}>
                  <input
                    type="text"
                    placeholder={t.fullNamePlaceholder}
                    value={personal.name}
                    onChange={(event) => setPersonal({ ...personal, name: event.target.value })}
                    className={`${inputClass} ${isArabic ? 'text-right' : 'text-left'}`}
                    autoComplete="name"
                    required
                  />
                </Field>
              ) : null}

              <Field label={t.phone} icon={<Phone className="h-5 w-5" />}>
                <input
                  type="tel"
                  dir="ltr"
                  inputMode="tel"
                  placeholder={t.phonePlaceholder}
                  value={personal.phone}
                  onChange={(event) => setPersonal({ ...personal, phone: event.target.value })}
                  className={`${inputClass} text-left`}
                  autoComplete="tel"
                  required
                />
              </Field>

              {mode === 'register' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label={t.governorate} icon={<MapPin className="h-5 w-5" />}>
                    <div className="relative">
                      <select
                        value={personal.gov}
                        onChange={(event) => setPersonal({ ...personal, gov: event.target.value, district: '' })}
                        disabled={locationDataLoading}
                        className={`${inputClass} appearance-none ${isArabic ? 'text-right pl-10' : 'text-left pr-10'}`}
                        required
                      >
                        <option value="">
                          {locationDataLoading ? '...' : t.governoratePlaceholder}
                        </option>
                        {governorates.map((gov) => (
                          <option key={gov.id} value={gov.id}>
                            {isArabic ? gov.label : gov.labelEn}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8] ${
                          isArabic ? 'left-3' : 'right-3'
                        }`}
                      />
                    </div>
                  </Field>

                  <Field label={t.district} icon={<MapPin className="h-5 w-5" />}>
                    <div className="relative">
                      <select
                        value={personal.district}
                        onChange={(event) => setPersonal({ ...personal, district: event.target.value })}
                        disabled={!personal.gov || locationDataLoading}
                        className={`${inputClass} appearance-none disabled:opacity-50 ${isArabic ? 'text-right pl-10' : 'text-left pr-10'}`}
                        required
                      >
                        <option value="">{locationDataLoading ? '...' : t.districtPlaceholder}</option>
                        {districts.map((district) => (
                          <option key={district.id} value={district.value}>
                            {isArabic ? district.label : district.labelEn}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8] ${
                          isArabic ? 'left-3' : 'right-3'
                        }`}
                      />
                    </div>
                  </Field>
                </div>
              ) : null}

              <Field label={t.password} icon={<LockKeyhole className="h-5 w-5" />}>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.passwordPlaceholder}
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    className={`${inputClass} ${isArabic ? 'text-right pl-12' : 'text-left pr-12'}`}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                    onClick={() => setShowPassword((current) => !current)}
                    className={`absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#94A3B8] transition hover:bg-[#14B8A6]/10 hover:text-[#14B8A6] ${
                      isArabic ? 'left-2' : 'right-2'
                    }`}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </Field>

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0B0F19]/45 p-3 transition hover:border-[#14B8A6]/40">
                <span className={`${isArabic ? 'text-right' : 'text-left'}`}>
                  <span className="block text-sm font-black text-[#F8FAFC]">{t.rememberMe}</span>
                  <span className="mt-1 block text-xs font-semibold text-[#94A3B8]">{t.rememberHint}</span>
                </span>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-5 w-5 shrink-0 accent-[#14B8A6]"
                />
              </label>

              {mode === 'register' && role === 'rider' ? (
                <div className="rounded-2xl border border-[#14B8A6]/20 bg-[#0B0F19]/50 p-3">
                  <label className="block text-sm font-black text-[#14B8A6]">
                    {t.idTitle}
                  </label>
                  <div className="relative mt-2 flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#14B8A6]/30 bg-black/30 p-3 transition hover:bg-black/50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    {personal.verificationDoc ? (
                      <span className="text-xs font-bold text-emerald-400">{t.idReady}</span>
                    ) : compressing ? (
                      <span className="text-xs text-[#94A3B8]">{t.idCompressing}</span>
                    ) : (
                      <span className="text-center text-xs font-semibold leading-5 text-[#94A3B8]">
                        {t.idHint}
                      </span>
                    )}
                  </div>
                </div>
              ) : null}

              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ y: -1 }}
                type="submit"
                disabled={isSubmitting || compressing}
                className="mt-2 w-full rounded-2xl bg-[#14B8A6] p-4 text-base font-black text-[#0B0F19] shadow-[0_16px_45px_rgba(20,184,166,0.22)] transition hover:bg-[#2DD4BF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60 disabled:opacity-50"
              >
                {isSubmitting ? '...' : mode === 'register' ? t.submitRegister : t.submitLogin}
              </motion.button>
            </motion.form>
          </AnimatePresence>

          <div className="mt-6 text-center text-sm font-semibold text-[#94A3B8]">
            <span>{mode === 'register' ? t.hasAccount : t.noAccount}</span>{' '}
            <button
              type="button"
              onClick={() => setAuthMode(mode === 'register' ? 'login' : 'register')}
              className="font-black text-[#14B8A6] underline-offset-4 transition hover:text-[#2DD4BF] hover:underline"
            >
              {mode === 'register' ? t.switchToLogin : t.switchToRegister}
            </button>
          </div>

          <button
            type="button"
            className="mt-5 w-full text-xs font-bold text-[#94A3B8]/70 transition hover:text-white"
            onClick={() => setStep('role')}
          >
            {t.back}
          </button>
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
