export interface AdminGeoScope {
  countryId: number | null;
  governorateId: number | null;
  districtId: number | null;
}

export const UNRESTRICTED_GEO_SCOPE: AdminGeoScope = {
  countryId: null,
  governorateId: null,
  districtId: null,
};

export interface AdminSubPermissionDef {
  id: string;
  sectorId: string;
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

export const SECTOR_SUB_PERMISSIONS: Record<string, readonly AdminSubPermissionDef[]> = {
  captains: [
    { id: 'captains.view', sectorId: 'captains', labelAr: 'عرض وبحث الكباتن', labelEn: 'View & Search Captains', descriptionAr: 'استعراض قائمة الكباتن والبحث والتصفية الجغرافية', descriptionEn: 'Browse, filter, and search captains' },
    { id: 'captains.inspect', sectorId: 'captains', labelAr: 'مراجعة تفاصيل الكابتن', labelEn: 'Inspect Captain Profile', descriptionAr: 'الاطلاع على بيانات المركبة والوثائق والسجل', descriptionEn: 'Inspect vehicle, license, and audit info' },
    { id: 'captains.topup', sectorId: 'captains', labelAr: 'شحن الرصيد والدقائق', labelEn: 'Balance & Minutes Top-up', descriptionAr: 'شحن الرصيد والدقائق فردياً وجماعياً للكباتن', descriptionEn: 'Individual & bulk balance/minutes top-up' },
    { id: 'captains.security', sectorId: 'captains', labelAr: 'الإجراءات الأمنية والحالة', labelEn: 'Security & Status Controls', descriptionAr: 'تنشيط، تعليق، حظر، وتصفية الرحلات العالقة', descriptionEn: 'Activate, suspend, ban, or clear active trip' },
    { id: 'captains.tier_lang', sectorId: 'captains', labelAr: 'تعديل الرتبة واللغة', labelEn: 'Edit Tier & Language', descriptionAr: 'تغيير رتبة الكابتن وتبديل لغة التطبيق', descriptionEn: 'Modify captain rank tier and language' },
    { id: 'captains.message', sectorId: 'captains', labelAr: 'مراسلة الكباتن', labelEn: 'Message Captains', descriptionAr: 'إرسال إشعارات فردية وجماعية للكباتن', descriptionEn: 'Send direct or bulk messages to captains' },
    { id: 'captains.welcome_hours', sectorId: 'captains', labelAr: 'إدارة الساعات الترحيبية', labelEn: 'Manage Welcome Hours', descriptionAr: 'ضبط ومنح الساعات الترحيبية للكباتن الجدد', descriptionEn: 'Configure and apply captain welcome hours' },
  ],
  riders: [
    { id: 'riders.view', sectorId: 'riders', labelAr: 'عرض وبحث المستخدمين', labelEn: 'View & Search Users', descriptionAr: 'استعراض قائمة الركاب والبحث والتصفية الجغرافية', descriptionEn: 'Browse, filter, and search riders' },
    { id: 'riders.inspect', sectorId: 'riders', labelAr: 'تفاصيل الراكب والمناعة', labelEn: 'Inspect Rider Profile', descriptionAr: 'عرض الرحلات المكتملة ومؤشر المناعة السلوكية', descriptionEn: 'View completed trips and behavioral trust' },
    { id: 'riders.security', sectorId: 'riders', labelAr: 'الحالة الأمنية وتصفير العقوبات', labelEn: 'Security & Reset Penalties', descriptionAr: 'تعليق/حظر المستخدمين وتصفير الإلغاءات المتتالية', descriptionEn: 'Suspend/ban riders and reset penalties' },
    { id: 'riders.message', sectorId: 'riders', labelAr: 'مراسلة المستخدمين', labelEn: 'Message Users', descriptionAr: 'إرسال إشعارات فردية وجماعية للمستخدمين', descriptionEn: 'Send direct or bulk notifications to riders' },
    { id: 'riders.simulation', sectorId: 'riders', labelAr: 'لوحة محاكاة الخمول والنشاط', labelEn: 'Activity Simulation Panel', descriptionAr: 'تشغيل محاكاة خمول الركاب وإشعارات المتابعة', descriptionEn: 'Run rider activity simulation & checks' },
  ],
  wallet: [
    { id: 'wallet.overview', sectorId: 'wallet', labelAr: 'ملخص المحفظة وسجل الحركات', labelEn: 'Wallet Overview & Ledger', descriptionAr: 'الاطلاع على المؤشرات المالية وسجل الحركات', descriptionEn: 'View wallet KPIs and transactions ledger' },
    { id: 'wallet.receipts', sectorId: 'wallet', labelAr: 'اعتماد ورفض الإيصالات', labelEn: 'Review Recharge Receipts', descriptionAr: 'مراجعة واعتماد أو رفض إيصالات التحويل البنكي', descriptionEn: 'Approve or reject bank recharge receipts' },
    { id: 'wallet.direct_topup', sectorId: 'wallet', labelAr: 'الشحن المباشر للأرصدة', labelEn: 'Direct Balance Top-up', descriptionAr: 'شحن المحفظة والدقائق مباشرة لحساب الكابتن', descriptionEn: 'Direct wallet cash & minutes recharge' },
    { id: 'wallet.vouchers', sectorId: 'wallet', labelAr: 'إصدار وإدارة الأكواد (Vouchers)', labelEn: 'Generate Vouchers', descriptionAr: 'توليد أكواد الشحن المسبق ومتابعتها', descriptionEn: 'Create and track prepaid recharge vouchers' },
    { id: 'wallet.channels', sectorId: 'wallet', labelAr: 'أرقام وقنوات التحويل', labelEn: 'Transfer Channels', descriptionAr: 'إضافة وتعديل قنوات الدفع والتحويل المحلية', descriptionEn: 'Manage CliQ & e-wallet transfer channels' },
    { id: 'wallet.settings', sectorId: 'wallet', labelAr: 'إعدادات الشحن الذاتي والمراسلة', labelEn: 'Self Top-up & Receipt Messages', descriptionAr: 'تفعيل/تعطيل الشحن الذاتي ومراسلة أصحاب الإيصالات', descriptionEn: 'Toggle self-topup and send receipt notes' },
  ],
  hourly_rates: [
    { id: 'hourly_rates.view', sectorId: 'hourly_rates', labelAr: 'عرض مصفوفة التسعير', labelEn: 'View Hourly Rates', descriptionAr: 'الاطلاع على أسعار الساعة المخصصة للمحافظات والمناطق', descriptionEn: 'View governorate & district hourly pricing' },
    { id: 'hourly_rates.edit', sectorId: 'hourly_rates', labelAr: 'تعديل واعتماد الأسعار', labelEn: 'Edit Hourly Rates', descriptionAr: 'تعديل أو إعادة تعيين أسعار الساعة ضمن النطاق الجغرافي', descriptionEn: 'Update or reset hourly rates matrix' },
  ],
  delegates: [
    { id: 'delegates.view', sectorId: 'delegates', labelAr: 'عرض المناديب الماليين', labelEn: 'View Delegates', descriptionAr: 'الاطلاع على قائمة المناديب ونطاقاتهم الجغرافية', descriptionEn: 'Browse financial delegates and coverage' },
    { id: 'delegates.manage', sectorId: 'delegates', labelAr: 'إدارة المناديب (إضافة وتعديل وحذف)', labelEn: 'Manage Delegates', descriptionAr: 'إضافة أو تعديل أو تعطيل المناديب الماليين', descriptionEn: 'Add, edit, or delete financial delegates' },
  ],
  admins: [
    { id: 'admins.view', sectorId: 'admins', labelAr: 'عرض قائمة المشرفين ونطاقاتهم', labelEn: 'View Supervisors List', descriptionAr: 'الاطلاع على حسابات المشرفين وصلاحياتهم ونطاقاتهم', descriptionEn: 'View supervisors directory and assignments' },
  ],
} as const;

export const ALL_SUB_PERMISSION_IDS: string[] = Object.values(SECTOR_SUB_PERMISSIONS)
  .flat()
  .map((p) => p.id);

export function getSubPermissionsForSector(sectorId: string): readonly AdminSubPermissionDef[] {
  return SECTOR_SUB_PERMISSIONS[sectorId] || [];
}

export function getAllSubPermissionIdsForSectors(sectorIds: readonly string[]): string[] {
  const result = new Set<string>();
  for (const sectorId of sectorIds) {
    for (const perm of getSubPermissionsForSector(sectorId)) {
      result.add(perm.id);
    }
  }
  return Array.from(result);
}

export function deriveSectorsFromPermissions(permissionIds: readonly string[]): string[] {
  const sectors = new Set<string>();
  for (const permId of permissionIds) {
    const sector = permId.split('.')[0];
    if (sector && SECTOR_SUB_PERMISSIONS[sector]) {
      sectors.add(sector);
    }
  }
  return Array.from(sectors);
}

export function parseNullableGeoNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '' || val === 'ALL') return null;
  const num = Number(val);
  return Number.isInteger(num) && num > 0 ? num : null;
}

export function normalizeGeoScope(input: any): AdminGeoScope {
  if (!input || typeof input !== 'object') return { ...UNRESTRICTED_GEO_SCOPE };
  const countryId = parseNullableGeoNumber(input.countryId ?? input.country_id);
  if (!countryId) return { countryId: null, governorateId: null, districtId: null };
  const governorateId = parseNullableGeoNumber(input.governorateId ?? input.governorate_id);
  if (!governorateId) return { countryId, governorateId: null, districtId: null };
  const districtId = parseNullableGeoNumber(input.districtId ?? input.district_id);
  return { countryId, governorateId, districtId };
}

export function isGeoScopeRestricted(scope?: AdminGeoScope | null): boolean {
  if (!scope) return false;
  return scope.countryId !== null || scope.governorateId !== null || scope.districtId !== null;
}

export function parseAdminScopeAndPermsFromAudit(auditLog: unknown): {
  geoScope: AdminGeoScope | null;
  hasScopedPermissions: boolean;
  permissions: string[];
} {
  if (!Array.isArray(auditLog)) {
    return { geoScope: null, hasScopedPermissions: false, permissions: [] };
  }
  let countryId: number | null = null;
  let governorateId: number | null = null;
  let districtId: number | null = null;
  let hasGeoToken = false;
  let hasScopedPermissions = false;
  const permissions: string[] = [];

  for (const entry of auditLog) {
    if (typeof entry !== 'string') continue;
    if (entry.startsWith('GEO_COUNTRY:')) {
      hasGeoToken = true;
      countryId = parseNullableGeoNumber(entry.slice('GEO_COUNTRY:'.length));
    } else if (entry.startsWith('GEO_GOV:')) {
      hasGeoToken = true;
      governorateId = parseNullableGeoNumber(entry.slice('GEO_GOV:'.length));
    } else if (entry.startsWith('GEO_DIST:')) {
      hasGeoToken = true;
      districtId = parseNullableGeoNumber(entry.slice('GEO_DIST:'.length));
    } else if (entry === 'PERM_SCOPED_V1') {
      hasScopedPermissions = true;
    } else if (entry.startsWith('PERM:')) {
      hasScopedPermissions = true;
      const permId = entry.slice('PERM:'.length);
      if (ALL_SUB_PERMISSION_IDS.includes(permId)) {
        permissions.push(permId);
      }
    }
  }

  return {
    geoScope: hasGeoToken ? normalizeGeoScope({ countryId, governorateId, districtId }) : null,
    hasScopedPermissions,
    permissions: Array.from(new Set(permissions)),
  };
}

export function encodeAdminScopeAndPermsIntoAudit(
  existingAudit: unknown,
  rankAuditValue: 'RANK_GENERAL_ADMIN' | 'RANK_ASSISTANT_ADMIN',
  geoScope: AdminGeoScope,
  permissions: readonly string[]
): string[] {
  const cleaned = Array.isArray(existingAudit)
    ? existingAudit.filter(
        (entry) =>
          typeof entry === 'string' &&
          entry !== 'RANK_GENERAL_ADMIN' &&
          entry !== 'RANK_ASSISTANT_ADMIN' &&
          entry !== 'PERM_SCOPED_V1' &&
          !entry.startsWith('PERM:') &&
          !entry.startsWith('GEO_COUNTRY:') &&
          !entry.startsWith('GEO_GOV:') &&
          !entry.startsWith('GEO_DIST:')
      )
    : [];

  cleaned.push(rankAuditValue);

  if (rankAuditValue === 'RANK_ASSISTANT_ADMIN') {
    const normalized = normalizeGeoScope(geoScope);
    cleaned.push(`GEO_COUNTRY:${normalized.countryId ?? 'ALL'}`);
    cleaned.push(`GEO_GOV:${normalized.governorateId ?? 'ALL'}`);
    cleaned.push(`GEO_DIST:${normalized.districtId ?? 'ALL'}`);
    cleaned.push('PERM_SCOPED_V1');
    for (const permId of permissions) {
      if (ALL_SUB_PERMISSION_IDS.includes(permId)) {
        cleaned.push(`PERM:${permId}`);
      }
    }
  }

  return cleaned;
}

export function isEntityWithinGeoScope(
  scope: AdminGeoScope | null | undefined,
  entity: { countryId?: number | null; country_id?: number | null; governorateId?: number | null; governorate_id?: number | null; districtId?: number | null; district_id?: number | null; phone?: string | null }
): boolean {
  if (!scope || !isGeoScopeRestricted(scope)) return true;

  const rawCountry = entity.countryId ?? entity.country_id ?? null;
  let entityCountryId = rawCountry !== null && rawCountry !== undefined ? Number(rawCountry) : null;
  if (!entityCountryId && typeof entity.phone === 'string') {
    if (entity.phone.startsWith('+962')) entityCountryId = 1;
    else if (entity.phone.startsWith('+20')) entityCountryId = 2;
  }

  if (scope.countryId !== null && entityCountryId !== scope.countryId) {
    return false;
  }

  const rawGov = entity.governorateId ?? entity.governorate_id ?? null;
  const entityGovId = rawGov !== null && rawGov !== undefined ? Number(rawGov) : null;
  if (scope.governorateId !== null && entityGovId !== scope.governorateId) {
    return false;
  }

  const rawDist = entity.districtId ?? entity.district_id ?? null;
  const entityDistId = rawDist !== null && rawDist !== undefined ? Number(rawDist) : null;
  if (scope.districtId !== null && entityDistId !== scope.districtId) {
    return false;
  }

  return true;
}
