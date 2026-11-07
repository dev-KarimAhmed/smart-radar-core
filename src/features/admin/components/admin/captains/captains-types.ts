export interface CaptainUser {
  id: string;
  serial_id: string;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'IDLE' | 'BUSY' | 'SUSPENDED' | 'BANNED';
  tier: 'PLATINUM' | 'GOLD' | 'BRONZE' | 'SILVER';
  rating: number;
  rating_count: number;
  heart_count: number;
  penalty_count: number;
  trust_score: number;
  country_id?: number;
  country_name?: string;
  governorate_id?: number;
  district_id?: number;
  governorate: string;
  district: string;
  preferred_language?: string;
  created_at: string;
  vehicle: {
    brand: string;
    model: string;
    year: number;
    color: string;
    plate: string;
    type: string;
    affiliation_type: string;
    office_phone: string;
    side_id: string;
  };
  verification_status: 'APPROVED' | 'PENDING' | 'REJECTED';
  documents: {
    identity_url: string | null;
    driving_license_url: string | null;
    vehicle_registration_url: string | null;
    criminal_record_url: string | null;
  };
  wallet: {
    balance: number;
    paid_minutes_remaining: number;
    bonus_minutes_remaining: number;
    total_minutes: number;
    active_package_name: string | null;
    time_bundle_expires_at: string | null;
    currency_code: string;
    currency_ar?: string;
  };
  currency?: string;
}

export const getCaptainCurrency = (cap?: CaptainUser | null, isArabic = true): string => {
  if (!cap) return isArabic ? 'د.أ' : 'JOD';
  const isEgypt = cap.wallet?.currency_code === 'EGP' || cap.phone?.startsWith('+20');
  if (isEgypt) return isArabic ? 'ج.م' : 'EGP';
  return isArabic ? 'د.أ' : 'JOD';
};

export const styles = {
  header: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/10",
  kpiGrid: "grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6",
  kpiCard: "rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg relative overflow-hidden",
  kpiTitle: "text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5",
  kpiValue: "text-2xl font-black text-white font-mono",
  searchContainer: "relative w-full sm:w-80",
  searchInput: "bg-black/70 border-white/15 text-white pl-3 pr-9 h-10 text-xs rounded-xl focus:border-[#14B8A6] text-start font-medium placeholder:text-slate-500",
  searchIcon: "absolute right-3 top-3 h-4 w-4 text-slate-400",
  tableCard: "rounded-2xl border border-white/10 bg-[#0B0F19]/95 overflow-hidden shadow-2xl backdrop-blur-xl",
  tableHead: "border-b border-white/10 bg-[#0F172A]/90 text-slate-200 text-xs font-black tracking-wide",
  tableRow: "border-b border-white/[0.06] transition-colors hover:bg-white/[0.03]",
  avatar: "flex h-10 w-10 items-center justify-center rounded-xl bg-[#14B8A6]/15 text-[#14B8A6] font-black border border-[#14B8A6]/30 text-xs",
  statusBadge: "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-sm",
} as const;
