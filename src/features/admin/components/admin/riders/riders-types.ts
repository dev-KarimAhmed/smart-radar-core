export interface RiderUser {
  id: string;
  serial_id: string;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'IDLE' | 'BUSY' | 'SUSPENDED' | 'BANNED';
  tier: string;
  rating: number;
  trust_score: number;
  consecutive_cancellations: number;
  completed_trips_count?: number;
  country_id?: number;
  country_name?: string;
  governorate_id?: number;
  district_id?: number;
  governorate: string;
  district: string;
  created_at: string;
  updated_at: string;
  wallet: {
    balance: number;
    currency_code: string;
  };
  referral_activity?: {
    has_referral: boolean;
    referral_id?: string | null;
    captain_id?: string | null;
    captain_name?: string | null;
    captain_phone?: string | null;
    captain_serial?: string | null;
    last_interacted_at?: string;
    days_inactive?: number;
    is_active?: boolean;
    last_notified_at?: string | null;
  };
}

export const styles = {
  header: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/10",
  kpiGrid: "grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6",
  kpiCard: "rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg relative overflow-hidden",
  kpiTitle: "text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5",
  kpiValue: "text-2xl font-black text-white font-mono",
  searchContainer: "relative w-full sm:w-80",
  searchInput: "bg-black/70 border-white/15 text-white px-9 h-10 text-xs rounded-xl focus:border-[#14B8A6] text-start font-medium placeholder:text-slate-500",
  searchIcon: "absolute start-3 top-3 h-4 w-4 text-slate-400",
  tableCard: "rounded-2xl border border-white/10 bg-[#0B0F19]/95 overflow-hidden shadow-2xl backdrop-blur-xl",
  tableHead: "border-b border-white/10 bg-[#0F172A]/90 text-slate-200 text-xs font-black tracking-wide",
  tableRow: "border-b border-white/[0.06] transition-colors hover:bg-white/[0.03]",
  avatar: "flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 font-black border border-cyan-500/30 text-xs",
  statusBadge: "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shadow-sm",
} as const;
