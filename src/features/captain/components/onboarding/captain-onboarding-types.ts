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
