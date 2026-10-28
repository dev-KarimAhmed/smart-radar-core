export interface AdminSectorConfig {
  id: string;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  iconName: string;
}

export const ADMIN_SECTORS: AdminSectorConfig[] = [
  {
    id: 'captains',
    labelAr: 'الكباتن',
    labelEn: 'Captains',
    descriptionAr: 'إدارة الكباتن والتحقق والوثائق وتعديل البيانات وحساباتهم',
    iconName: 'Users',
  },
  {
    id: 'riders',
    labelAr: 'المستخدمين',
    labelEn: 'Users / Riders',
    descriptionAr: 'إدارة الركاب والمستخدمين، سجلات الرحلات، والمناعة السلوكية',
    iconName: 'UserCheck',
  },
  {
    id: 'wallet',
    labelAr: 'المحفظة والشحن',
    labelEn: 'Wallet & Recharge',
    descriptionAr: 'شحن الأرصدة، باقات الدقائق، والتحويلات المالية',
    iconName: 'Wallet',
  },
  {
    id: 'hourly_rates',
    labelAr: 'تسعير الساعة والمناطق',
    labelEn: 'Hourly Rates & Pricing',
    descriptionAr: 'مؤشرات التسعير الجغرافي، تسعير الساعات، وكوابح السوق',
    iconName: 'Clock',
  },
  {
    id: 'delegates',
    labelAr: 'المندوبين',
    labelEn: 'Financial Delegates',
    descriptionAr: 'إدارة المندوبين الماليين، العمولات، ومتابعة المهام',
    iconName: 'UsersRound',
  },
  {
    id: 'admins',
    labelAr: 'المشرفين',
    labelEn: 'Supervisors & Admins',
    descriptionAr: 'إدارة المشرفين، صلاحيات القطاعات، والحسابات الإدارية',
    iconName: 'ShieldCheck',
  },
] as const;

export type AdminSectorId = typeof ADMIN_SECTORS[number]['id'];

export const ALL_SECTOR_IDS: AdminSectorId[] = ADMIN_SECTORS.map((s) => s.id);

export function isGeneralAdmin(admin: any): boolean {
  if (!admin) return false;
  if (
    admin.id === '70b4a26f-10ac-4888-8df6-c3a5ad824b8a' ||
    admin.phone === '+201551981922' ||
    admin.id === 'dev-admin-001' ||
    admin.admin_rank === 'GENERAL_ADMIN' ||
    admin.user_metadata?.admin_rank === 'GENERAL_ADMIN'
  ) {
    return true;
  }
  const auditLog = admin.rank_audit_log;
  if (Array.isArray(auditLog) && auditLog.includes('RANK_GENERAL_ADMIN')) {
    return true;
  }
  return false;
}

export function getAdminAllowedSectors(admin: any): AdminSectorId[] {
  if (!admin) return [];
  if (isGeneralAdmin(admin)) {
    return [...ALL_SECTOR_IDS];
  }

  const raw = admin.allowed_sectors || admin.user_metadata?.allowed_sectors;
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.filter((s) => ALL_SECTOR_IDS.includes(s as AdminSectorId)) as AdminSectorId[];
  }

  // Default fallback for assistant admins
  return ['captains', 'riders'];
}

export function hasAdminSectorAccess(admin: any, sectorId: string): boolean {
  if (!admin) return false;
  if (isGeneralAdmin(admin)) return true;
  const sectors = getAdminAllowedSectors(admin);
  return sectors.includes(sectorId as AdminSectorId);
}

