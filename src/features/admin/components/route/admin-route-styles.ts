export const adminRouteStyles = {
  root: 'min-h-screen w-full bg-[#0A0F1D] p-4 text-white sm:p-8',
  gateContainer: 'flex min-h-[85vh] items-center justify-center p-4',
  card: 'w-full max-w-md space-y-4 rounded-3xl border border-[#14B8A6]/30 bg-[#0B1120] p-6 sm:p-8 text-center text-white shadow-2xl backdrop-blur-xl',
  iconWrap: 'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14F5D5] shadow-[0_0_30px_rgba(20,184,166,0.2)]',
  title: 'text-xl sm:text-2xl font-black text-[#14F5D5] tracking-tight',
  body: 'text-xs sm:text-sm text-slate-300 leading-relaxed',
} as const;

export const SOVEREIGN_DEV_USER = {
  uid: '70b4a26f-10ac-4888-8df6-c3a5ad824b8a',
  serial_id: 'M-1264',
  phone: '+201551981922',
  role: 'admin' as const,
  adminRank: 'GENERAL_ADMIN' as const,
  name: 'المدير العام',
  countryId: 1,
  currencyAr: 'د.أ',
  currencyEn: 'JOD',
  governorate: '1',
  district: '1',
  isBufferActive: false,
  rating: 5,
  status: 'active' as const,
};
