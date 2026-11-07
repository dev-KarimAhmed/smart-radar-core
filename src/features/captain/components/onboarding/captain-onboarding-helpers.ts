import type { CaptainPersonalValues } from './captain-personal-step';
import type { CaptainVehicleValues } from './captain-vehicle-step';

export const REMEMBER_ME_STORAGE_KEY = 'radar_captain_remember_me';

export type OnboardingStep = 1 | 2 | 3 | 'done';

export const emptyPersonal: CaptainPersonalValues = {
  name: '',
  nickname: '',
  phone: '',
  email: '',
  password: '',
  country: '',
  countryIso: '',
  governorate: '',
  district: '',
};

export const emptyVehicle: CaptainVehicleValues = {
  officeName: '',
  officePhone: '',
  sideId: '',
  companyName: '',
  companyCode: '',
  make: '',
  model: '',
  color: '#14b8a6',
  plate: '',
  year: '',
  nationalIdNumber: '',
  licenseNumber: '',
  facebookUrl: '',
  instagramUrl: '',
};

export function readStoredRememberMe(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(REMEMBER_ME_STORAGE_KEY) !== 'false';
}

export function maskEmail(email: string | null): string {
  if (!email || !email.includes('@')) return email || '';
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `**@${domain}`;
  const masked = '*'.repeat(Math.max(name.length - 2, 4));
  return `${name[0]}${masked}${name[name.length - 1]}@${domain}`;
}

export const styles = {
  hydrationShell: 'flex min-h-screen w-full items-center justify-center bg-[#0B0F19]',
  hydrationSpinner: 'h-8 w-8 animate-spin rounded-full border-2 border-[#14B8A6]/25 border-t-[#14B8A6]',
  main: 'relative min-h-screen overflow-hidden bg-[#0B0F19] text-slate-100',
  glow: 'pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_12%,rgba(20,184,166,0.20),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(45,212,191,0.08),transparent_28%)]',
  langButton:
    'fixed top-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-[#161F30]/70 px-4 text-sm font-bold text-slate-100 shadow-2xl backdrop-blur-xl transition hover:border-[#14B8A6] hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]',
  langButtonAr: 'left-4',
  langButtonEn: 'right-4',
  langIcon: 'h-4 w-4 text-[#14B8A6]',
  wrap: 'relative z-10 flex min-h-screen w-full items-center justify-center px-0 py-0 sm:px-6 sm:py-10',
  card: 'flex min-h-screen w-full max-w-md flex-col justify-center rounded-none border border-white/5 bg-[#161F30]/70 p-6 shadow-2xl backdrop-blur-xl sm:my-12 sm:min-h-0 sm:rounded-3xl sm:p-8',
  header: 'mb-6 text-center',
  badge: 'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14B8A6] shadow-[0_0_30px_rgba(20,184,166,0.18)]',
  badgeIcon: 'h-7 w-7',
  brand: 'text-sm font-bold text-[#14B8A6]',
  title: 'mt-3 text-2xl font-black tracking-normal text-[#F8FAFC]',
  subtitle: 'mt-2 text-sm font-medium leading-6 text-[#94A3B8]',
  stepRow: 'flex justify-between items-center text-xs text-slate-400 mb-4 bg-white/5 border border-white/10 rounded-2xl p-3',
  stepLabel: 'font-bold text-[#14B8A6]',
  stepName: 'font-bold text-[#94A3B8]',
  hasAccountRow: 'mt-6 text-center text-sm font-semibold text-[#94A3B8]',
  hasAccountLink: 'font-black text-[#14B8A6] underline-offset-4 transition hover:text-[#2DD4BF] hover:underline',
  backLink: 'mt-5 w-full text-xs font-bold text-[#94A3B8]/70 transition hover:text-white',
  doneWrap: 'flex flex-col items-center text-center gap-3 py-6',
  doneIcon: 'h-14 w-14 text-[#14B8A6]',
  doneTitle: 'text-lg font-black text-[#F8FAFC]',
  doneText: 'text-sm font-medium leading-6 text-[#94A3B8]',
} as const;
