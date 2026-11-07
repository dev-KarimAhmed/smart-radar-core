export const PRIMARY_SOVEREIGN_ADMIN_ID = '70b4a26f-10ac-4888-8df6-c3a5ad824b8a';
export const PRIMARY_SOVEREIGN_ADMIN_PHONE = '+201551981922';

export interface AdminProfile {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  status: string;
  created_at: string;
  admin_rank?: 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN';
  admin_rank_label?: string;
  is_primary?: boolean;
  allowed_sectors?: string[];
}

export const adminPanelStyles = {
  root: "space-y-6",
  statsGrid: "grid grid-cols-1 gap-3 sm:grid-cols-3",
  statCard: "rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg",
  statTitle: "text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1.5",
  statValue: "text-2xl font-black text-[#F8FAFC] font-mono",
  header: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2",
  addBtn: "inline-flex items-center justify-center gap-2 rounded-xl bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] px-4 py-2 text-xs font-black transition-all shadow-[0_4px_20px_rgba(20,184,166,0.25)] active:scale-95 cursor-pointer",
  formModal: "rounded-2xl border border-[#14B8A6]/30 bg-[#0B0F19]/95 p-5 shadow-2xl backdrop-blur-xl space-y-4 animate-in fade-in slide-in-from-top-3 duration-200",
  formTitle: "text-sm font-black text-white flex items-center justify-between border-b border-white/10 pb-3",
  formGrid: "grid grid-cols-1 gap-3 sm:grid-cols-3",
  label: "block text-[11px] font-bold text-slate-300 mb-1 text-start",
  input: "w-full min-h-10 rounded-xl border border-white/10 bg-black/50 px-3 text-xs font-semibold text-white outline-none focus:border-[#14B8A6] transition text-start",
  tableCard: "rounded-2xl border border-white/10 bg-[#0B0F19]/90 overflow-hidden shadow-xl",
  tableHead: "border-b border-white/10 bg-black/40 text-slate-300 text-xs font-bold",
  tableRow: "border-b border-white/5 transition hover:bg-white/[0.02]",
  avatar: "flex h-8 w-8 items-center justify-center rounded-xl bg-[#14B8A6]/10 text-[#14B8A6] font-black border border-[#14B8A6]/30 text-xs",
  statusBadge: "inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg",
} as const;
