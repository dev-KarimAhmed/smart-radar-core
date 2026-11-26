import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  ALL_SECTOR_IDS,
  ALL_SUB_PERMISSION_IDS,
  AdminSectorId,
  UNRESTRICTED_GEO_SCOPE,
  verifyAdminCaller,
  getAdminRank,
} from '@/lib/admin-auth-verifier';
import {
  deriveSectorsFromPermissions,
  encodeAdminScopeAndPermsIntoAudit,
  getAllSubPermissionIdsForSectors,
  normalizeGeoScope,
} from '@/features/admin/lib/admin-permissions';

function normalizePhone(phone: string): string {
  let cleaned = phone.trim().replace(/[\s()-]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  } else if (!cleaned.startsWith('+') && /^[1-9]\d{7,14}$/.test(cleaned)) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

export async function POST(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required' }, { status: 401 });
  }

  const callerRank = getAdminRank(admin);
  if (callerRank !== 'GENERAL_ADMIN') {
    return NextResponse.json(
      { success: false, error: 'غير مصرح: المشرف العام فقط يملك صلاحية إضافة مشرفين جدد' },
      { status: 403 }
    );
  }

  try {
    const { fullName, phone, password, adminRank, allowedSectors, allowedPermissions, geoScope } = await req.json();
    if (!fullName || !phone || !password) {
      return NextResponse.json({ success: false, error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!/^\+[1-9]\d{6,14}$/.test(normalizedPhone)) {
      return NextResponse.json({ success: false, error: 'يرجى كتابة رقم الهاتف بالصيغة الدولية المعتمدة' }, { status: 400 });
    }

    const phoneDigits = normalizedPhone.replace(/\D/g, '');
    const adminEmail = `admin_${phoneDigits}@bynkcom.internal`;

    const targetRank = adminRank === 'GENERAL_ADMIN' ? 'GENERAL_ADMIN' : 'ASSISTANT_ADMIN';
    const rankAuditValue = targetRank === 'GENERAL_ADMIN' ? 'RANK_GENERAL_ADMIN' : 'RANK_ASSISTANT_ADMIN';

    const requestedSectors = Array.isArray(allowedSectors)
      ? allowedSectors.filter((s: string) => ALL_SECTOR_IDS.includes(s as AdminSectorId))
      : ['captains', 'riders'];

    const finalPermissions: string[] =
      targetRank === 'GENERAL_ADMIN'
        ? [...ALL_SUB_PERMISSION_IDS]
        : Array.isArray(allowedPermissions)
          ? allowedPermissions.filter((p: string) => ALL_SUB_PERMISSION_IDS.includes(p))
          : getAllSubPermissionIdsForSectors(requestedSectors);

    const derivedSectors = deriveSectorsFromPermissions(finalPermissions) as AdminSectorId[];
    const finalSectors: AdminSectorId[] =
      targetRank === 'GENERAL_ADMIN'
        ? [...ALL_SECTOR_IDS]
        : derivedSectors.length > 0
          ? derivedSectors
          : (requestedSectors as AdminSectorId[]);

    if (targetRank === 'ASSISTANT_ADMIN' && (finalSectors.length === 0 || finalPermissions.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'يرجى تحديد قطاع واحد وصلاحية فرعية واحدة على الأقل للمشرف المساعد.' },
        { status: 400 }
      );
    }

    const finalGeoScope = targetRank === 'GENERAL_ADMIN' ? { ...UNRESTRICTED_GEO_SCOPE } : normalizeGeoScope(geoScope);
    const rankAuditLog = encodeAdminScopeAndPermsIntoAudit([], rankAuditValue, finalGeoScope, finalPermissions);

    // 1. Create user in Supabase Auth via Admin API
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      phone: normalizedPhone,
      email: adminEmail,
      password,
      phone_confirm: true,
      email_confirm: true,
      user_metadata: {
        role: 'ADMIN',
        admin_rank: targetRank,
        allowed_sectors: finalSectors,
        allowed_permissions: finalPermissions,
        geo_scope: finalGeoScope,
        full_name: fullName.trim(),
        phone: normalizedPhone,
        email: adminEmail,
        created_by_admin: admin.id,
        created_at_epoch: Date.now(),
      },
    });

    if (createErr) {
      const errMsg = (createErr.message || '').toLowerCase();
      if (errMsg.includes('already exists') || errMsg.includes('phone') || errMsg.includes('registered')) {
        return NextResponse.json({ success: false, error: 'رقم الهاتف مسجل بالفعل مسبقاً لحساب آخر في النظام.' }, { status: 409 });
      }
      throw createErr;
    }

    // 2. Insert or update public.profiles with role = ADMIN and valid non-null FK columns
    if (newUser?.user?.id) {
      const isEgypt = normalizedPhone.startsWith('+20');
      const fallbackCountryId = isEgypt ? 2 : 1;

      const profilePayload = {
        role: 'ADMIN',
        status: 'IDLE',
        full_name: fullName.trim(),
        phone: normalizedPhone,
        email: adminEmail,
        country_id: finalGeoScope.countryId ?? fallbackCountryId,
        governorate_id: finalGeoScope.governorateId ?? 1,
        district_id: finalGeoScope.districtId ?? 1,
        rank_audit_log: rankAuditLog,
        allowed_sectors: finalSectors,
        updated_at: new Date().toISOString(),
      };

      const { error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update(profilePayload)
        .eq('id', newUser.user.id);

      if (updateErr) {
        const { error: upsertErr } = await supabaseAdmin
          .from('profiles')
          .upsert({ id: newUser.user.id, ...profilePayload });
        if (upsertErr) throw upsertErr;
      }
    }

    return NextResponse.json({
      success: true,
      user: newUser.user,
      adminRank: targetRank,
      allowedSectors: finalSectors,
      allowedPermissions: finalPermissions,
      geoScope: finalGeoScope,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'فشل إنشاء حساب المشرف' }, { status: 500 });
  }
}
