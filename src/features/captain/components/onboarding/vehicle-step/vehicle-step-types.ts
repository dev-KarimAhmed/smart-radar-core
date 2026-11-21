import type { AffiliationType } from '@/core/types';

export interface CaptainTaxiVehicleValues {
  officeName: string;
  officePhone: string;
  sideId: string;
  make: string;
  model: string;
  plate: string;
  year: string;
  licenseNumber: string;
  facebookUrl: string;
  instagramUrl: string;
}

export interface CaptainSmartAppVehicleValues {
  companyName: string;
  companyCode: string;
  make: string;
  model: string;
  color: string;
  plate: string;
  year: string;
  licenseNumber: string;
  facebookUrl: string;
  instagramUrl: string;
}

export interface CaptainIndependentVehicleValues {
  make: string;
  model: string;
  color: string;
  plate: string;
  year: string;
  licenseNumber: string;
  facebookUrl: string;
  instagramUrl: string;
}

export type CaptainVehicleValues = CaptainTaxiVehicleValues &
  CaptainSmartAppVehicleValues &
  CaptainIndependentVehicleValues;

export const styles = {
  root: 'space-y-4 animate-fade-in',
  fieldRow: 'grid grid-cols-2 gap-2',
  label: 'block text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase mb-1',
  input:
    'w-full bg-[#0B0F19] border border-[#243249] focus:border-[#14B8A6] text-[#F8FAFC] placeholder-[#94A3B8]/30 rounded-xl px-4 h-11 text-sm outline-none transition-all duration-300',
  error: 'text-[10px] font-bold text-rose-400 mt-1',
  helper: 'text-[11px] text-slate-400 mt-1 leading-relaxed',
  documentBlock: 'p-3 rounded-xl bg-[#0B0F19] border border-[#14B8A6]/20 space-y-2',
  documentLabel: 'text-[10px] sm:text-[11px] font-black text-[#14B8A6] block',
  documentDropzone:
    'relative border border-dashed border-[#14B8A6]/35 rounded-lg p-3 flex flex-col items-center justify-center bg-black/40 hover:bg-black/60 transition-all cursor-pointer min-h-16',
  documentInput: 'absolute inset-0 w-full h-full opacity-0 cursor-pointer',
  documentDoneRow: 'flex items-center gap-2 max-w-full',
  documentDoneText: 'text-[10px] text-emerald-400 font-bold truncate',
  documentEmptyWrap: 'flex flex-col items-center',
  documentEmptyText: 'text-[9px] text-[#94A3B8]/80 leading-normal text-center font-medium',
  documentHint: 'text-[8px] text-[#14B8A6]/60 block font-mono',
  documentDoneCheck: 'text-emerald-400',
  submitWrap: 'pt-2',
  submitButton:
    'w-full bg-[#14B8A6] hover:bg-[#14B8A6]/90 text-[#0B0F19] font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(20,184,166,0.2)] hover:shadow-[0_4px_25px_rgba(20,184,166,0.35)] transform active:scale-[0.98] disabled:opacity-50 cursor-pointer',
  backButton: 'w-full text-xs text-[#94A3B8]/60 hover:text-white transition-colors py-2 cursor-pointer',
} as const;

export interface CaptainVehicleStepProps {
  affiliation: AffiliationType | null;
  vehicle: CaptainVehicleValues;
  setVehicle: (vehicle: CaptainVehicleValues) => void;
  serverErrors?: Record<string, string>;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  country?: string;
}
