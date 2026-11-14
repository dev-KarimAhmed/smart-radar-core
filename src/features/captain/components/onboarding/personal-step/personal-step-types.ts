export interface CaptainPersonalValues {
  name: string;
  nickname: string;
  phone: string;
  email: string;
  password: string;
  country: string;
  countryIso: string;
  governorate: string;
  district: string;
}

export interface CaptainPersonalStepProps {
  values: CaptainPersonalValues;
  onChange: (values: CaptainPersonalValues) => void;
  rememberMe: boolean;
  onRememberMeChange: (remember: boolean) => void;
  onNext: () => void;
}

export const styles = {
  root: 'space-y-4 animate-fade-in',
  field: 'space-y-1.5',
  fieldRow: 'grid grid-cols-2 gap-3',
  label: 'flex items-center gap-1.5 text-[11px] font-bold text-[#94A3B8]',
  icon: 'h-3.5 w-3.5 text-[#14B8A6]',
  input:
    'w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300',
  passwordWrap: 'relative',
  eyeButton:
    'absolute top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-[#94A3B8] hover:text-[#14B8A6] transition-colors',
  eyeIcon: 'h-4 w-4',
  error: 'text-[10px] font-bold text-rose-400 mt-1',
  hint: 'text-[10px] font-medium text-[#94A3B8] mt-1',
  rememberRow:
    'flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0B0F19]/45 p-3',
  rememberText: '',
  rememberLabel: 'block text-sm font-black text-[#F8FAFC]',
  rememberHint: 'mt-0.5 block text-xs font-semibold text-[#94A3B8]',
  checkbox: 'h-5 w-5 shrink-0 accent-[#14B8A6]',
  continueButton:
    'w-full h-12 rounded-2xl bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black text-sm transition disabled:opacity-40 disabled:cursor-not-allowed',
} as const;
