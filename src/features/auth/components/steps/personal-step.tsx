'use client';

import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  Loader2,
  LockKeyhole,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UserRound,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRegistration } from '../../hooks/use-registration';
import { requestPasswordRecovery } from '../../services/password-recovery';
import { navigateAuth } from '@/lib/auth-routing';

import { cn } from '@/lib/utils';
const styles = {
  style329_1: "relative min-h-screen overflow-hidden bg-[#0B0F19] text-slate-100",
  style331_2: "pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_12%,rgba(20,184,166,0.20),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(45,212,191,0.08),transparent_28%)]",
  style337_3: "fixed top-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-[#161F30]/70 px-4 text-sm font-bold text-slate-100 shadow-2xl backdrop-blur-xl transition hover:border-[#14B8A6] hover:shadow-[0_0_20px_rgba(20,184,166,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/50",
  style338_4: "left-4",
  style338_5: "right-4",
  style341_6: "h-4 w-4 text-[#14B8A6]",
  style345_7: "relative z-10 flex min-h-screen w-full items-center justify-center px-0 py-0 sm:px-6 sm:py-10",
  style346_8: "flex min-h-screen w-full max-w-md flex-col justify-center rounded-none border border-white/5 bg-[#161F30]/70 p-6 shadow-2xl backdrop-blur-xl sm:my-12 sm:min-h-0 sm:rounded-3xl sm:p-8",
  style347_9: "mb-7 text-center",
  style348_10: "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14B8A6] shadow-[0_0_30px_rgba(20,184,166,0.18)]",
  style349_11: "h-7 w-7",
  style351_12: "text-sm font-bold text-[#14B8A6]",
  style362_13: "mt-3 text-3xl font-black tracking-normal text-[#F8FAFC]",
  style365_14: "mt-3 text-sm font-medium leading-6 text-[#94A3B8]",
  style405_21: "space-y-4",
  style410_22: "space-y-4 animate-fadeIn text-right animate-in fade-in duration-200",
  style411_23: "flex justify-between items-center text-xs text-slate-400 mb-4 bg-white/5 border border-white/10 rounded-2xl p-3",
  style412_24: "font-bold text-[#14B8A6]",
  style413_25: "font-bold text-[#94A3B8]",
  style416_26: "h-5 w-5",
  style417_27: "relative",
  style421_28: "appearance-none text-right pl-10",
  style429_29: "pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#94A3B8]",
  style433_30: "grid grid-cols-2 gap-3",
  style434_31: "h-5 w-5",
  style440_32: "text-right",
  style444_33: "h-5 w-5",
  style450_34: "text-right",
  style456_35: "grid grid-cols-2 gap-3",
  style457_36: "h-5 w-5",
  style463_37: "text-right",
  style469_38: "h-5 w-5",
  style475_39: "text-right",
  style481_40: "h-5 w-5",
  style487_41: "text-right",
  style490_42: "text-[11px] text-[#94A3B8] mt-1.5 leading-relaxed text-right",
  style495_43: "flex gap-3 pt-2",
  style499_44: "flex-1 min-h-12 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-sm transition cursor-pointer",
  style505_45: "flex-1 min-h-12 rounded-2xl bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black text-sm transition shadow-[0_16px_45px_rgba(20,184,166,0.18)] cursor-pointer",
  style512_46: "space-y-4 animate-fadeIn text-right animate-in fade-in duration-200",
  style513_47: "flex justify-between items-center text-xs text-slate-400 mb-4 bg-white/5 border border-white/10 rounded-2xl p-3",
  style514_48: "font-bold text-[#14B8A6]",
  style515_49: "font-bold text-[#94A3B8]",
  style518_50: "h-5 w-5",
  style524_51: "text-left",
  style528_52: "space-y-3",
  style529_53: "block text-xs font-bold text-slate-300 pr-1",
  style530_54: "grid grid-cols-2 gap-3",
  style531_55: "flex flex-col items-center justify-center p-4 rounded-2xl border border-white/10 bg-white/5 hover:border-[#14B8A6]/40 transition relative group min-h-[96px] cursor-pointer",
  style532_56: "h-6 w-6 text-[#14B8A6] mb-1.5 animate-pulse",
  style533_57: "text-[10px] text-white font-bold text-center",
  style537_58: "absolute inset-0 opacity-0 cursor-pointer",
  style541_59: "flex flex-col items-center justify-center p-4 rounded-2xl border border-white/10 bg-white/5 hover:border-[#14B8A6]/40 transition relative group min-h-[96px] cursor-pointer",
  style542_60: "h-6 w-6 text-[#14B8A6] mb-1.5",
  style543_61: "text-[10px] text-white font-bold text-center",
  style547_62: "absolute inset-0 opacity-0 cursor-pointer",
  style551_63: "flex flex-col items-center justify-center p-4 rounded-2xl border border-white/10 bg-white/5 hover:border-[#14B8A6]/40 transition relative group min-h-[96px] cursor-pointer col-span-2",
  style552_64: "h-6 w-6 text-[#14B8A6] mb-1.5",
  style553_65: "text-[10px] text-white font-bold text-center",
  style557_66: "absolute inset-0 opacity-0 cursor-pointer",
  style563_67: "flex gap-3 pt-2",
  style567_68: "flex-1 min-h-12 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-sm transition cursor-pointer",
  style574_69: "flex-1 min-h-12 rounded-2xl bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black text-sm transition shadow-[0_16px_45px_rgba(20,184,166,0.22)] focus-visible:outline-none disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer",
  style584_70: "flex justify-between items-center text-xs text-slate-400 mb-4 bg-white/5 border border-white/10 rounded-2xl p-3",
  style585_71: "font-bold text-[#14B8A6]",
  style586_72: "font-bold text-[#94A3B8]",
  style591_73: "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0B0F19]/45 p-3",
  style592_74: "flex min-h-9 items-center gap-2 text-xs font-bold text-[#94A3B8]",
  style595_75: "h-4 w-4 animate-spin text-[#14B8A6]",
  style600_76: "h-4 w-4 text-[#14B8A6]",
  style611_77: "inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3 text-xs font-black text-[#14B8A6] transition hover:border-[#14B8A6] hover:bg-[#14B8A6]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/50 disabled:cursor-not-allowed disabled:opacity-50",
  style613_78: "h-4 w-4",
  style621_79: "h-5 w-5",
  style627_80: "text-right",
  style627_81: "text-left",
  style634_82: "h-5 w-5",
  style642_83: "text-left",
  style646_84: "text-right",
  style646_85: "text-left",
  style646_86: "mt-2 text-[11px] font-semibold text-[#94A3B8]",
  style652_87: "grid grid-cols-1 gap-4 sm:grid-cols-2",
  style653_88: "h-5 w-5",
  style654_89: "relative",
  style659_90: "appearance-none",
  style659_91: "text-right pl-10",
  style659_92: "text-left pr-10",
  style672_93: "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]",
  style673_94: "left-3",
  style673_95: "right-3",
  style679_96: "h-5 w-5",
  style680_97: "relative",
  style685_98: "appearance-none",
  style685_99: "text-right pl-10",
  style685_100: "text-left pr-10",
  style698_101: "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]",
  style699_102: "left-3",
  style699_103: "right-3",
  style705_104: "h-5 w-5",
  style706_105: "relative",
  style711_106: "appearance-none disabled:opacity-50",
  style711_107: "text-right pl-10",
  style711_108: "text-left pr-10",
  style722_109: "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]",
  style723_110: "left-3",
  style723_111: "right-3",
  style731_112: "h-5 w-5",
  style732_113: "relative",
  style738_114: "text-right pl-12",
  style738_115: "text-left pr-12",
  style746_116: "absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#94A3B8] transition hover:bg-[#14B8A6]/10 hover:text-[#14B8A6]",
  style747_117: "left-2",
  style747_118: "right-2",
  style750_119: "h-5 w-5",
  style750_120: "h-5 w-5",
  style759_121: "-mt-2 block w-full text-xs font-black text-[#14B8A6] underline-offset-4 transition hover:text-[#2DD4BF] hover:underline",
  style760_122: "text-left",
  style760_123: "text-right",
  style767_124: "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0B0F19]/45 p-3 transition hover:border-[#14B8A6]/40",
  style768_125: "text-right",
  style768_126: "text-left",
  style769_127: "block text-sm font-black text-[#F8FAFC]",
  style770_128: "mt-1 block text-xs font-semibold text-[#94A3B8]",
  style776_129: "h-5 w-5 shrink-0 accent-[#14B8A6]",
  style785_130: "mt-2 w-full rounded-2xl bg-[#14B8A6] p-4 text-base font-black text-[#0B0F19] shadow-[0_16px_45px_rgba(20,184,166,0.22)] transition hover:bg-[#2DD4BF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/60 disabled:opacity-50 cursor-pointer",
  style794_131: "mt-6 text-center text-sm font-semibold text-[#94A3B8]",
  createAccountLink: "inline-flex items-center gap-1 font-black text-[#14B8A6] underline-offset-4 transition hover:text-[#2DD4BF] hover:underline",
  createAccountIcon: "h-4 w-4",
  style807_133: "mt-5 w-full text-xs font-bold text-[#94A3B8]/70 transition hover:text-white",
  style818_134: "border border-[#14B8A6]/25 bg-[#0B0F19] text-white shadow-2xl sm:max-w-md",
  style820_135: "text-right",
  style820_136: "text-left",
  style821_137: "mb-2 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14B8A6]",
  style822_138: "h-5 w-5",
  style824_139: "text-2xl font-black text-white",
  style825_140: "text-sm leading-6 text-[#94A3B8]",
  style832_141: "space-y-4",
  style833_142: "rounded-2xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 p-4 text-sm leading-7 text-[#D8FDF8]",
  style839_143: "h-5 w-5",
  style847_144: "text-left",
  style851_145: "grid gap-3 sm:grid-cols-2",
  style856_146: "inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#14B8A6] px-4 text-sm font-black text-[#0B0F19] shadow-[0_16px_45px_rgba(20,184,166,0.18)] transition hover:bg-[#2DD4BF]",
  resetSubmit: "mt-3 w-full rounded-2xl bg-[#14B8A6] px-4 py-3 text-sm font-black text-[#04140F] transition hover:bg-[#2DD4BF] disabled:cursor-not-allowed disabled:opacity-50",
  resetSuccess: "mt-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs font-bold leading-relaxed text-emerald-200",
  resetError: "mt-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs font-bold leading-relaxed text-rose-200",
  style862_147: "inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/15",
  style871_148: "absolute inset-x-0 bottom-0 z-0 h-14 overflow-hidden border-t border-white/10 bg-slate-950/70 backdrop-blur-xl",
  style873_149: "flex w-max min-w-[200%] gap-8 whitespace-nowrap py-5",
  style875_150: "[animation:ad-river-rtl_28s_linear_infinite]",
  style876_151: "[animation:ad-river-ltr_28s_linear_infinite]",
  style880_152: "text-xs font-bold text-[#94A3B8] odd:text-[#F8FAFC]",
  style900_153: "block",
  style901_154: "mb-2 flex items-center gap-2 text-sm font-bold text-[#F8FAFC]",
  style902_155: "text-[#14B8A6]",
  input: 'min-h-12 w-full rounded-2xl border border-white/10 bg-[#0B0F19]/50 px-4 text-base font-semibold text-[#F8FAFC] outline-none transition placeholder:text-[#64748B] focus:border-[#14B8A6] focus:shadow-[0_0_10px_rgba(20,184,166,0.1)]',
  customSelectTrigger: 'h-11 w-full min-w-0 rounded-xl border border-white/10 bg-black/35 px-3 text-xs font-black text-white outline-none transition focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:outline-none data-[state=open]:ring-0 data-[state=open]:ring-offset-0',
  customSelectContent: 'border-white/10 bg-[#0F172A] text-white shadow-2xl shadow-black/40',
  customSelectItem: 'cursor-pointer rounded-lg py-2.5 text-xs font-black text-slate-200 focus:bg-[#14B8A6]/15 focus:text-[#14F5D5] data-[state=checked]:bg-[#14B8A6]/10 data-[state=checked]:text-[#14F5D5]',
} as const;


type Lang = 'ar' | 'en';
type AuthMode = 'register' | 'login';

const roleLabels = {
  rider: { ar: 'راكب', en: 'Rider' },
  driver: { ar: 'سائق', en: 'Driver' },
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
    country: 'الدولة',
    countryPlaceholder: 'اختر الدولة',
    governorate: 'المحافظة',
    governoratePlaceholder: 'اختر المحافظة',
    district: 'المنطقة',
    districtPlaceholder: 'اختر المنطقة',
    loadingLocations: 'جاري تحميل المحافظات والمناطق...',
    mockData: 'بيانات تجربة',
    password: 'كلمة المرور',
    passwordPlaceholder: 'اكتب كلمة المرور',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور',
    rememberMe: 'تذكرني',
    rememberHint: 'ابق مسجلا على هذا الجهاز',
    forgotPassword: 'نسيت كلمة المرور؟',
    resetTitle: 'استعادة كلمة المرور',
    resetDescription: 'اكتب رقم هاتفك وسنرسل لك رمز تحقق لتعيين كلمة مرور جديدة.',
    resetPhone: 'رقم الهاتف',
    sendCode: 'إرسال الرمز',
    resetCode: 'رمز التحقق',
    resetCodePlaceholder: 'اكتب الرمز',
    newPassword: 'كلمة مرور جديدة',
    newPasswordPlaceholder: 'اكتب كلمة مرور جديدة',
    confirmReset: 'تحديث كلمة المرور',
    codeSent: 'تم إرسال رمز التحقق إلى هاتفك.',
    passwordUpdated: 'تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.',
    login: 'تسجيل الدخول',
    register: 'إنشاء الحساب',
    submitLogin: 'دخول الحساب',
    submitRegister: 'إنشاء الحساب',
    hasAccount: 'لديك حساب بالفعل؟',
    noAccount: 'ليس لديك حساب؟',
    switchToLogin: 'سجل دخولك',
    switchToRegister: 'اعمل حساب جديد',
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
    country: 'Country',
    countryPlaceholder: 'Choose country',
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
    forgotPassword: 'Forgot password?',
    resetTitle: 'Reset password',
    resetDescription: 'Enter your phone number and we will send a code to set a new password.',
    resetPhone: 'Phone number',
    sendCode: 'Send code',
    resetCode: 'Verification code',
    resetCodePlaceholder: 'Enter code',
    newPassword: 'New password',
    newPasswordPlaceholder: 'Enter new password',
    confirmReset: 'Update password',
    codeSent: 'Verification code sent to your phone.',
    passwordUpdated: 'Password updated. You can login now.',
    login: 'Login',
    register: 'Register',
    submitLogin: 'Login',
    submitRegister: 'Create account',
    hasAccount: 'Already have an account?',
    noAccount: 'New here?',
    switchToLogin: 'Login',
    switchToRegister: 'Create an account',
    back: 'Back to account type',
    ticker: ['Closer rides', 'Secure access', 'Clear choice', 'Smart Radar V5.5', 'Easy mobile flow'],
  },
} as const;

const authRoleLabels = {
  rider: { ar: 'راكب', en: 'Rider' },
  driver: { ar: 'سائق', en: 'Driver' },
  advertiser: { ar: 'معلن', en: 'Advertiser' },
  delegate: { ar: 'مندوب تسويق', en: 'Delegate' },
} as const;

const authCopy = {
  ar: {
    languageButton: 'English',
    languageAria: 'تغيير اللغة إلى الإنجليزية',
    brand: 'الرادار الذكي',
    registerTitle: 'حساب جديد',
    loginTitle: 'تسجيل الدخول',
    registerSubtitle: 'اكتب بياناتك مرة واحدة، وبعدها تدخل حسابك بسرعة.',
    loginSubtitle: 'اكتب رقم الهاتف وكلمة المرور للمتابعة.',
    fullName: 'الاسم الكامل',
    fullNamePlaceholder: 'اكتب اسمك',
    phone: 'رقم الهاتف',
    phonePlaceholder: '+962790000000',
    country: 'الدولة',
    countryPlaceholder: 'اختر الدولة',
    governorate: 'المحافظة',
    governoratePlaceholder: 'اختر المحافظة',
    district: 'المنطقة',
    districtPlaceholder: 'اختر المنطقة',
    loadingLocations: 'جاري تحميل المحافظات والمناطق...',
    mockData: 'بيانات تجربة',
    password: 'كلمة المرور',
    passwordPlaceholder: 'اكتب كلمة المرور',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور',
    rememberMe: 'تذكرني',
    rememberHint: 'ابق مسجلا على هذا الجهاز',
    forgotPassword: 'نسيت كلمة المرور؟',
    resetTitle: 'استعادة كلمة المرور',
    resetDescription: 'لإعادة كلمة المرور، تواصل مع الدعم الرسمي أو واتساب التحقق. سنراجع هويتك ونساعدك في تحديث كلمة المرور.',
    resetPhone: 'رقم الهاتف',
    sendCode: 'طلب مساعدة',
    resetCode: 'رمز التحقق',
    resetCodePlaceholder: 'اكتب الرمز',
    newPassword: 'كلمة مرور جديدة',
    newPasswordPlaceholder: 'اكتب كلمة مرور جديدة',
    confirmReset: 'تحديث كلمة المرور',
    codeSent: 'تم إرسال طلب المساعدة.',
    passwordUpdated: 'تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.',
    login: 'تسجيل الدخول',
    register: 'إنشاء الحساب',
    submitLogin: 'دخول الحساب',
    submitRegister: 'إنشاء الحساب',
    hasAccount: 'لديك حساب بالفعل؟',
    noAccount: 'ليس لديك حساب؟',
    switchToLogin: 'سجل دخولك',
    switchToRegister: 'اعمل حساب جديد',
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
    country: 'Country',
    countryPlaceholder: 'Choose country',
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
    forgotPassword: 'Forgot password?',
    resetTitle: 'Password help',
    resetDescription: 'For password reset, contact official support or WhatsApp verification. We will verify your identity and help update your password.',
    resetPhone: 'Phone number',
    sendCode: 'Request help',
    resetCode: 'Verification code',
    resetCodePlaceholder: 'Enter code',
    newPassword: 'New password',
    newPasswordPlaceholder: 'Enter new password',
    confirmReset: 'Update password',
    codeSent: 'Help request sent.',
    passwordUpdated: 'Password updated. You can login now.',
    login: 'Login',
    register: 'Register',
    submitLogin: 'Login',
    submitRegister: 'Create account',
    hasAccount: 'Already have an account?',
    noAccount: 'New here?',
    switchToLogin: 'Login',
    switchToRegister: 'Create an account',
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
    countries,
    selectedCountry,
    phonePlaceholder,
    phoneValidationHint,
    governorates,
    districts,
    locationDataLoading,
    canUseDevMockData,
    fillRandomRegistrationData,
    isSubmitting,
    role,
    authMode,
    setAuthMode,
    lang,
    setLang,
    createAccountPulseKey,
  } = useRegistration();
  const [showPassword, setShowPassword] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPhone, setResetPhone] = useState(personal.phone);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  // This dialog used to be a dead end: two links to WhatsApp and a phone number, with no
  // mechanism behind either and no way for support to actually reset anything. It now files
  // a real request — either Supabase mails a recovery link (accounts with an email) or the
  // request is queued for an admin to verify and approve.
  const submitPasswordRecovery = async () => {
    setResetSubmitting(true);
    setResetError('');
    setResetMessage('');
    try {
      setResetMessage(await requestPasswordRecovery(resetPhone));
    } catch (error) {
      setResetError(error instanceof Error ? error.message : 'تعذّر إرسال الطلب.');
    } finally {
      setResetSubmitting(false);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handlePersonalSubmit(e);
  };

  const currentLang = lang as Lang;
  const mode = authMode as AuthMode;
  const isArabic = currentLang === 'ar';
  const t = authCopy[currentLang];
  const roleName = role ? authRoleLabels[role]?.[currentLang] : authRoleLabels.rider[currentLang];
  const tickerItems = useMemo(() => [...t.ticker, ...t.ticker, ...t.ticker], [t.ticker]);

  const openPasswordReset = () => {
    setResetPhone(personal.phone);
    setResetMessage('');
    setResetError('');
    setResetOpen(true);
  };

  // Switching mode navigates to the sibling page instead of swapping in place.
  const goToMode = (nextMode: AuthMode) => {
    setAuthMode(nextMode);
    navigateAuth(nextMode, role);
  };

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className={styles.style329_1}
    >
      <div className={styles.style331_2} />

      <button
        type="button"
        aria-label={t.languageAria}
        onClick={() => setLang(isArabic ? 'en' : 'ar')}
        className={cn(styles.style337_3, isArabic ? styles.style338_4 : styles.style338_5)}
      >
        <Languages className={styles.style341_6} aria-hidden="true" />
        {t.languageButton}
      </button>

      <section className={styles.style345_7}>
        <div className={styles.style346_8}>
          <header className={styles.style347_9}>
            <div className={styles.style348_10}>
              <ShieldCheck className={styles.style349_11} aria-hidden="true" />
            </div>
            <p className={styles.style351_12}>
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
                <h1 className={styles.style362_13}>
                  {mode === 'register' ? t.registerTitle : t.loginTitle}
                </h1>
                <p className={styles.style365_14}>
                  {mode === 'register' ? t.registerSubtitle : t.loginSubtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </header>

          <AnimatePresence mode="wait" initial={false}>
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={styles.style405_21}
              onSubmit={onFormSubmit}
            >
                  {mode === 'register' && (role !== 'rider' && canUseDevMockData) ? (
                    <div className={styles.style591_73}>
                      <div className={styles.style592_74}>
                        {locationDataLoading ? (
                          <>
                            <Loader2 className={styles.style595_75} aria-hidden="true" />
                            <span>{t.loadingLocations}</span>
                          </>
                        ) : (
                          <>
                            <MapPin className={styles.style600_76} aria-hidden="true" />
                            <span>{`${countries.length} / ${governorates.length} / ${districts.length}`}</span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={fillRandomRegistrationData}
                        disabled={locationDataLoading}
                        className={styles.style611_77}
                      >
                        <Sparkles className={styles.style613_78} aria-hidden="true" />
                        {t.mockData}
                      </button>
                    </div>
                  ) : null}

                  {mode === 'register' ? (
                    <Field label={t.fullName} icon={<UserRound className={styles.style621_79} />}>
                      <input
                        type="text"
                        placeholder={t.fullNamePlaceholder}
                        value={personal.name}
                        onChange={(event) => setPersonal({ ...personal, name: event.target.value })}
                        className={cn(styles.input, isArabic ? styles.style627_80 : styles.style627_81)}
                        autoComplete="name"
                        required
                      />
                    </Field>
                  ) : null}

                  <Field label={t.phone} icon={<Phone className={styles.style634_82} />}>
                    <input
                      type="tel"
                      dir="ltr"
                      inputMode="tel"
                      placeholder={phonePlaceholder || t.phonePlaceholder}
                      value={personal.phone}
                      onChange={(event) => setPersonal({ ...personal, phone: event.target.value })}
                      className={cn(styles.input, styles.style642_83)}
                      autoComplete="tel"
                      required
                    />
                    <p className={cn(isArabic ? styles.style646_84 : styles.style646_85, styles.style646_86)}>
                      {phoneValidationHint}
                    </p>
                  </Field>

                  {mode === 'register' ? (
                    <div className={styles.style652_87}>
                      <Field label={t.country} icon={<MapPin className={styles.style653_88} />}>
                        <Select
                          value={personal.country}
                          onValueChange={(value) => setPersonal({ ...personal, country: value, gov: '', district: '' })}
                          disabled={locationDataLoading && !countries.length}
                        >
                          <SelectTrigger className={styles.customSelectTrigger}>
                            <SelectValue placeholder={locationDataLoading && !countries.length ? '...' : t.countryPlaceholder} />
                          </SelectTrigger>
                          <SelectContent className={styles.customSelectContent}>
                            {countries.map((country) => (
                              <SelectItem key={country.id} value={country.id} className={styles.customSelectItem}>
                                {isArabic ? country.label : country.labelEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label={t.governorate} icon={<MapPin className={styles.style679_96} />}>
                        <Select
                          value={personal.gov}
                          onValueChange={(value) => setPersonal({ ...personal, gov: value, district: '' })}
                          disabled={!personal.country || locationDataLoading}
                        >
                          <SelectTrigger className={styles.customSelectTrigger}>
                            <SelectValue placeholder={locationDataLoading ? '...' : t.governoratePlaceholder} />
                          </SelectTrigger>
                          <SelectContent className={styles.customSelectContent}>
                            {governorates.map((gov) => (
                              <SelectItem key={gov.id} value={gov.id} className={styles.customSelectItem}>
                                {isArabic ? gov.label : gov.labelEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label={t.district} icon={<MapPin className={styles.style705_104} />}>
                        <Select
                          value={personal.district}
                          onValueChange={(value) => setPersonal({ ...personal, district: value })}
                          disabled={!personal.gov || locationDataLoading}
                        >
                          <SelectTrigger className={styles.customSelectTrigger}>
                            <SelectValue placeholder={locationDataLoading ? '...' : t.districtPlaceholder} />
                          </SelectTrigger>
                          <SelectContent className={styles.customSelectContent}>
                            {districts.map((district) => (
                              <SelectItem key={district.id} value={district.value} className={styles.customSelectItem}>
                                {isArabic ? district.label : district.labelEn}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  ) : null}

                  <Field label={t.password} icon={<LockKeyhole className={styles.style731_112} />}>
                    <div className={styles.style732_113}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t.passwordPlaceholder}
                        value={authPassword}
                        onChange={(event) => setAuthPassword(event.target.value)}
                        className={cn(styles.input, isArabic ? styles.style738_114 : styles.style738_115)}
                        autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                        required
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? t.hidePassword : t.showPassword}
                        onClick={() => setShowPassword((current) => !current)}
                        className={cn(styles.style746_116, isArabic ? styles.style747_117 : styles.style747_118)}
                      >
                        {showPassword ? <EyeOff className={styles.style750_119} /> : <Eye className={styles.style750_120} />}
                      </button>
                    </div>
                  </Field>

                  {mode === 'login' ? (
                    <button
                      type="button"
                      onClick={openPasswordReset}
                      className={cn(styles.style759_121, isArabic ? styles.style760_122 : styles.style760_123)}
                    >
                      {t.forgotPassword}
                    </button>
                  ) : null}

                  <label className={styles.style767_124}>
                    <span className={cn(isArabic ? styles.style768_125 : styles.style768_126)}>
                      <span className={styles.style769_127}>{t.rememberMe}</span>
                      <span className={styles.style770_128}>{t.rememberHint}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className={styles.style776_129}
                    />
                  </label>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ y: -1 }}
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.style785_130}
                  >
                    {isSubmitting ? '...' : mode === 'register' ? t.submitRegister : t.submitLogin}
                  </motion.button>
            </motion.form>
          </AnimatePresence>

          <div className={styles.style794_131}>
            <span>{mode === 'register' ? t.hasAccount : t.noAccount}</span>{' '}
            {/* Remounts (via `key`) on every failed login attempt caused by a
                wrong phone/password, replaying the entrance animation to draw
                the eye toward creating a new account instead. */}
            <motion.button
              key={mode === 'login' ? createAccountPulseKey : 'static'}
              type="button"
              onClick={() => goToMode(mode === 'register' ? 'login' : 'register')}
              className={styles.createAccountLink}
              initial={mode === 'login' ? { scale: 1, color: '#94A3B8' } : false}
              animate={mode === 'login' ? { scale: [1, 1.22, 0.94, 1.06, 1], color: '#14B8A6' } : undefined}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
              {mode === 'login' ? <UserPlus className={styles.createAccountIcon} aria-hidden="true" /> : null}
              {mode === 'register' ? t.switchToLogin : t.switchToRegister}
            </motion.button>
          </div>

          <button
            type="button"
            className={styles.style807_133}
            onClick={() => navigateAuth('role')}
          >
            {t.back}
          </button>
        </div>
      </section>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent
          dir={isArabic ? 'rtl' : 'ltr'}
          className={styles.style818_134}
        >
          <DialogHeader className={isArabic ? styles.style820_135 : styles.style820_136}>
            <div className={styles.style821_137}>
              <KeyRound className={styles.style822_138} aria-hidden="true" />
            </div>
            <DialogTitle className={styles.style824_139}>{t.resetTitle}</DialogTitle>
            <DialogDescription className={styles.style825_140}>
              {isArabic
                ? 'إعادة كلمة المرور تتم عبر الدعم، بدون رسائل SMS مدفوعة.'
                : 'Password reset is handled through support, without paid SMS messages.'}
            </DialogDescription>
          </DialogHeader>

          <div className={styles.style832_141}>
            <div className={styles.style833_142}>
              {isArabic
                ? 'اكتب رقم هاتفك. لو حسابك عليه إيميل استرجاع، هيوصلك رابط عليه فوراً. لو لأ، الطلب هيروح للدعم ويتم التحقق من هويتك قبل إعادة التعيين.'
                : 'Enter your phone number. If your account has a recovery email, a link is sent there right away. If not, the request goes to support and your identity is verified before any reset.'}
            </div>

            <Field label={t.resetPhone} icon={<Phone className={styles.style839_143} />}>
              <input
                type="tel"
                dir="ltr"
                inputMode="tel"
                placeholder={phonePlaceholder || t.phonePlaceholder}
                value={resetPhone}
                onChange={(event) => setResetPhone(event.target.value)}
                className={cn(styles.input, styles.style847_144)}
              />
            </Field>

            {resetMessage ? (
              <p className={styles.resetSuccess}>{resetMessage}</p>
            ) : null}
            {resetError ? <p className={styles.resetError}>{resetError}</p> : null}

            <button
              type="button"
              onClick={() => void submitPasswordRecovery()}
              disabled={resetSubmitting || resetPhone.trim().length < 8}
              className={styles.resetSubmit}
            >
              {resetSubmitting
                ? (isArabic ? 'جاري الإرسال…' : 'Sending…')
                : (isArabic ? 'إرسال طلب الاسترجاع' : 'Send recovery request')}
            </button>

            {/* Kept as a way to chase a queued request, not as the mechanism itself. */}
            <div className={styles.style851_145}>
              <a
                href={buildSupportWhatsappUrl(resetPhone)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.style856_146}
              >
                {isArabic ? 'متابعة عبر واتساب' : 'Follow up on WhatsApp'}
              </a>
              <a
                href={buildSupportTelUrl()}
                className={styles.style862_147}
              >
                {isArabic ? 'اتصال بالدعم' : 'Call support'}
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className={styles.style871_148}>
        <div
          className={cn(styles.style873_149, isArabic
              ? styles.style875_150
              : styles.style876_151)}
        >
          {tickerItems.map((item, index) => (
            <span key={`${item}-${index}`} className={styles.style880_152}>
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
    <label className={styles.style900_153}>
      <span className={styles.style901_154}>
        <span className={styles.style902_155}>{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

function buildSupportWhatsappUrl(phone: string) {
  const supportPhone = getSupportPhone();
  const message = `طلب إعادة تعيين كلمة مرور الراكب. رقم الحساب: ${phone || 'غير مكتوب'}`;

  if (!supportPhone) {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  return `https://wa.me/${supportPhone}?text=${encodeURIComponent(message)}`;
}

function buildSupportTelUrl() {
  const supportPhone = getSupportPhone();
  return supportPhone ? `tel:+${supportPhone}` : '#';
}

function getSupportPhone() {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const rawPhone = env?.NEXT_PUBLIC_SUPPORT_WHATSAPP || env?.NEXT_PUBLIC_SUPPORT_PHONE || '';
  return rawPhone.replace(/\D/g, '');
}
