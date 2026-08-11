'use client';

import {
  Eye,
  EyeOff,
  Languages,
  LockKeyhole,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { cn } from '@/lib/utils';
const styles = {
  style161_1: "relative min-h-screen overflow-hidden bg-[#0B0F19] text-slate-100",
  style163_2: "pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_12%,rgba(20,184,166,0.20),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(45,212,191,0.08),transparent_28%)]",
  style169_3: "fixed top-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-[#161F30]/70 px-4 text-sm font-bold text-slate-100 shadow-2xl backdrop-blur-xl transition hover:border-[#14B8A6] hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/50",
  style170_4: "left-4",
  style170_5: "right-4",
  style173_6: "h-4 w-4 text-[#14B8A6]",
  style177_7: "relative z-10 flex min-h-screen w-full items-center justify-center px-0 py-0 sm:px-6 sm:py-10",
  style178_8: "flex h-screen w-full max-w-md flex-col justify-center rounded-none border border-white/5 bg-[#161F30]/70 p-6 shadow-2xl backdrop-blur-xl sm:my-12 sm:h-auto sm:min-h-0 sm:rounded-3xl sm:p-8",
  style179_9: "mb-7 text-center",
  style180_10: "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14B8A6] shadow-[0_0_30px_rgba(20,184,166,0.18)]",
  style181_11: "h-7 w-7",
  style183_12: "text-sm font-bold text-[#14B8A6]",
  style194_13: "mt-3 text-3xl font-black tracking-normal text-[#F8FAFC]",
  style197_14: "mt-3 text-sm font-medium leading-6 text-[#94A3B8]",
  style204_15: "mb-5 grid grid-cols-2 rounded-2xl border border-white/10 bg-[#0B0F19]/45 p-1",
  style213_16: "relative min-h-11 rounded-xl px-3 text-sm font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/50",
  style218_17: "absolute inset-0 rounded-xl border border-[#14B8A6]/45 bg-[#14B8A6]/15 shadow-[0_0_18px_rgba(20,184,166,0.14)]",
  style222_18: "relative z-10",
  style222_19: "text-[#F8FAFC]",
  style222_20: "text-[#94A3B8]",
  style237_21: "space-y-4",
  style244_22: "h-5 w-5",
  style255_23: "h-5 w-5",
  style267_24: "grid grid-cols-1 gap-4 sm:grid-cols-2",
  style268_25: "h-5 w-5",
  style269_26: "relative",
  style274_27: "appearance-none pe-10",
  style282_28: "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8] ltr:right-3 rtl:left-3",
  style286_29: "h-5 w-5",
  style287_30: "relative",
  style288_31: "appearance-none pe-10",
  style295_32: "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8] ltr:right-3 rtl:left-3",
  style301_33: "h-5 w-5",
  style302_34: "relative",
  style307_35: "pe-12",
  style314_36: "absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#94A3B8] transition hover:bg-[#14B8A6]/10 hover:text-[#14B8A6] ltr:right-2 rtl:left-2",
  style316_37: "h-5 w-5",
  style316_38: "h-5 w-5",
  style325_39: "mt-2 w-full rounded-2xl bg-[#14B8A6] p-4 text-base font-black text-[#0B0F19] shadow-[0_16px_45px_rgba(20,184,166,0.22)] transition hover:bg-[#2DD4BF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60",
  style332_40: "mt-6 text-center text-sm font-semibold text-[#94A3B8]",
  style337_41: "font-black text-[#14B8A6] underline-offset-4 transition hover:text-[#2DD4BF] hover:underline",
  style345_42: "absolute inset-x-0 bottom-0 z-0 h-14 overflow-hidden border-t border-white/10 bg-slate-950/70 backdrop-blur-xl",
  style347_43: "flex w-max min-w-[200%] gap-8 whitespace-nowrap py-5",
  style349_44: "justify-center",
  style350_45: "justify-center",
  style354_46: "text-xs font-bold text-[#94A3B8] odd:text-[#F8FAFC]",
  style374_47: "block",
  style375_48: "mb-2 flex items-center gap-2 text-sm font-bold text-[#F8FAFC]",
  style376_49: "text-[#14B8A6]",
  input: 'min-h-12 w-full rounded-2xl border border-white/10 bg-[#0B0F19]/50 px-4 text-base font-semibold text-[#F8FAFC] outline-none transition placeholder:text-[#64748B] focus:border-[#14B8A6] focus:shadow-[0_0_10px_rgba(20,184,166,0.1)]',
  customSelectTrigger: 'h-11 w-full min-w-0 rounded-xl border border-white/10 bg-black/35 px-3 text-xs font-black text-white outline-none transition focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:outline-none data-[state=open]:ring-0 data-[state=open]:ring-offset-0',
  customSelectContent: 'border-white/10 bg-[#0F172A] text-white shadow-2xl shadow-black/40',
  customSelectItem: 'cursor-pointer rounded-lg py-2.5 text-xs font-black text-slate-200 focus:bg-[#14B8A6]/15 focus:text-[#14F5D5] data-[state=checked]:bg-[#14B8A6]/10 data-[state=checked]:text-[#14F5D5]',
} as const;


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

export function RegisterRoute({
  initialLanguage,
  initialRole = 'rider',
}: {
  initialLanguage?: string;
  initialRole?: string;
}) {
  const router = useRouter();
  const { language, setLanguage } = useDashboardLanguage();
  const [authType, setAuthType] = useState<AuthType>('register');
  const [governorate, setGovernorate] = useState<GovernorateKey>('cairo');
  const [showPassword, setShowPassword] = useState(false);

  // Honor a ?lang= deep link once on mount by driving the shared locale.
  useEffect(() => {
    const requestedLang = initialLanguage;
    if ((requestedLang === 'ar' || requestedLang === 'en') && requestedLang !== language) {
      setLanguage(requestedLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedRole = initialRole;
  const role = selectedRole in roleLabels ? selectedRole : 'rider';
  const isArabic = language === 'ar';
  const t = copy[language];
  const roleName = roleLabels[role as keyof typeof roleLabels][language];
  const districtOptions = governorates[governorate].districts;

  const tickerItems = useMemo(() => [...t.ticker, ...t.ticker, ...t.ticker], [t.ticker]);

  const submitMockAuth = () => {
    router.push('/rider');
  };

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className={styles.style161_1}
    >
      <div className={styles.style163_2} />

      <button
        type="button"
        aria-label={t.languageAria}
        onClick={() => setLanguage(isArabic ? 'en' : 'ar')}
        className={cn(styles.style169_3, isArabic ? styles.style170_4 : styles.style170_5)}
      >
        <Languages className={styles.style173_6} aria-hidden="true" />
        {t.languageButton}
      </button>

      <section className={styles.style177_7}>
        <div className={styles.style178_8}>
          <header className={styles.style179_9}>
            <div className={styles.style180_10}>
              <ShieldCheck className={styles.style181_11} aria-hidden="true" />
            </div>
            <p className={styles.style183_12}>
              {t.brand} · {roleName || t.riderContext}
            </p>
            <div
                key={`${authType}-${language}`}
              >
                <h1 className={styles.style194_13}>
                  {authType === 'register' ? t.registerTitle : t.loginTitle}
                </h1>
                <p className={styles.style197_14}>
                  {authType === 'register' ? t.registerSubtitle : t.loginSubtitle}
                </p>
            </div>
          </header>

          <div className={styles.style204_15}>
            {(['register', 'login'] as AuthType[]).map((mode) => {
              const active = authType === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAuthType(mode)}
                  className={styles.style213_16}
                >
                  {active ? (
                    <span
                      className={styles.style218_17}
                    />
                  ) : null}
                  <span className={cn(styles.style222_18, active ? styles.style222_19 : styles.style222_20)}>
                    {mode === 'register' ? t.register : t.login}
                  </span>
                </button>
              );
            })}
          </div>

            <form
              key={authType}
              className={styles.style237_21}
              onSubmit={(event) => {
                event.preventDefault();
                submitMockAuth();
              }}
            >
              {authType === 'register' ? (
                <Field label={t.fullName} icon={<UserRound className={styles.style244_22} />}>
                  <input
                    suppressHydrationWarning
                    type="text"
                    placeholder={t.fullNamePlaceholder}
                    className={styles.input}
                    autoComplete="name"
                  />
                </Field>
              ) : null}

              <Field label={t.phone} icon={<Phone className={styles.style255_23} />}>
                <input
                  suppressHydrationWarning
                  type="tel"
                  inputMode="numeric"
                  placeholder={t.phonePlaceholder}
                  className={styles.input}
                  autoComplete="tel"
                />
              </Field>

              {authType === 'register' ? (
                <div className={styles.style267_24}>
                  <Field label={t.governorate} icon={<MapPin className={styles.style268_25} />}>
                    <Select
                      value={governorate}
                      onValueChange={(value) => setGovernorate(value as GovernorateKey)}
                    >
                      <SelectTrigger className={styles.customSelectTrigger}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={styles.customSelectContent}>
                        {(Object.keys(governorates) as GovernorateKey[]).map((key) => (
                          <SelectItem key={key} value={key} className={styles.customSelectItem}>
                            {governorates[key][language]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label={t.district} icon={<MapPin className={styles.style286_29} />}>
                    <Select>
                      <SelectTrigger className={styles.customSelectTrigger}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={styles.customSelectContent}>
                        {districtOptions.map((district) => (
                          <SelectItem key={district.en} value={district.en} className={styles.customSelectItem}>
                            {district[language]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              ) : null}

              <Field label={t.password} icon={<LockKeyhole className={styles.style301_33} />}>
                <div className={styles.style302_34}>
                  <input
                    suppressHydrationWarning
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t.passwordPlaceholder}
                    className={cn(styles.input, styles.style307_35)}
                    autoComplete={authType === 'register' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? t.hidePassword : t.showPassword}
                    onClick={() => setShowPassword((current) => !current)}
                    className={styles.style314_36}
                  >
                    {showPassword ? <EyeOff className={styles.style316_37} /> : <Eye className={styles.style316_38} />}
                  </button>
                </div>
              </Field>

              <button
                type="submit"
                className={styles.style325_39}
              >
                {authType === 'register' ? t.submitRegister : t.submitLogin}
              </button>
            </form>

          <div className={styles.style332_40}>
            <span>{authType === 'register' ? t.hasAccount : t.noAccount}</span>{' '}
            <button
              type="button"
              onClick={() => setAuthType((current) => (current === 'register' ? 'login' : 'register'))}
              className={styles.style337_41}
            >
              {authType === 'register' ? t.switchToLogin : t.switchToRegister}
            </button>
          </div>
        </div>
      </section>

      <div className={styles.style345_42}>
        <div
          className={cn(styles.style347_43, isArabic
              ? styles.style349_44
              : styles.style350_45)}
        >
          {tickerItems.map((item, index) => (
            <span key={`${item}-${index}`} className={styles.style354_46}>
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
    <label className={styles.style374_47}>
      <span className={styles.style375_48}>
        <span className={styles.style376_49}>{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

