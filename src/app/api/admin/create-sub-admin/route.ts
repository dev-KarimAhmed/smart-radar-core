import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdminAccess } from '@/lib/admin-auth-verifier';
import { ALL_SECTOR_IDS, AdminSectorId } from '@/features/admin/lib/admin-permissions';

function isSaudiPhone(raw: string): boolean {
  const compact = String(raw || '').replace(/[\s\-().]/g, '');
  if (compact.startsWith('+966') || compact.startsWith('00966')) return true;
  const digits = compact.replace(/\D/g, '');
  return digits.startsWith('966') && digits.length >= 11;
}

export async function POST(req: Request) {
  const access = await requireAdminAccess(req, { requireGeneralAdmin: true });
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: access.status === 403 ? 'غير مصرح: المشرف العام فقط يملك صلاحية إضافة مشرفين جدد' : access.error },
      { status: access.status }
    );
  }
  const { admin } = access;

  try {
    const body = await req.json();
    const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const adminRank = body?.adminRank;
    const allowedSectors = body?.allowedSectors;

    if (!fullName || !phone || !password) {
      return NextResponse.json({ success: false, error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }
    if (fullName.length < 3 || fullName.length > 100) {
      return NextResponse.json({ success: false, error: 'الاسم الكامل يجب أن يكون بين 3 و 100 حرف' }, { status: 400 });
    }
    if (!/^\+?[0-9]{8,16}$/.test(phone.replace(/[\s\-().]/g, ''))) {
      return NextResponse.json({ success: false, error: 'صيغة رقم الهاتف غير صحيحة' }, { status: 400 });
    }
    if (isSaudiPhone(phone)) {
      return NextResponse.json({ success: false, error: 'أرقام الهواتف السعودية (+966) غير مدعومة' }, { status: 403 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ success: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }, { status: 400 });
    }

    const normalizedPhone = phone.startsWith('+') ? phone : `+${phone.replace(/\D/g, '')}`;
    const targetRank = adminRank === 'GENERAL_ADMIN' ? 'GENERAL_ADMIN' : 'ASSISTANT_ADMIN';
    const rankAuditValue = targetRank === 'GENERAL_ADMIN' ? 'RANK_GENERAL_ADMIN' : 'RANK_ASSISTANT_ADMIN';
    const validatedSectors: AdminSectorId[] = Array.isArray(allowedSectors)
      ? allowedSectors.filter((s: unknown): s is AdminSectorId => typeof s === 'string' && ALL_SECTOR_IDS.includes(s as AdminSectorId))
      : [];
    const finalSectors: AdminSectorId[] = targetRank === 'GENERAL_ADMIN'
      ? [...ALL_SECTOR_IDS]
      : (validatedSectors.length > 0 ? validatedSectors : ['captains', 'riders']);

    // Create user via Admin API
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      phone: normalizedPhone,
      password,
      phone_confirm: true,
      user_metadata: {
        role: 'ADMIN',
        admin_rank: targetRank,
        allowed_sectors: finalSectors,
        full_name: fullName,
        phone: normalizedPhone,
        created_by_admin: admin.id,
        created_at_epoch: Date.now(),
      },
    });

    if (createErr) throw createErr;

    // Insert or update profiles
    if (newUser?.user?.id) {
      const { error: upsertErr } = await supabaseAdmin.from('profiles').upsert({
        id: newUser.user.id,
        role: 'ADMIN',
        status: 'IDLE',
        full_name: fullName,
        phone: normalizedPhone,
        rank_audit_log: [rankAuditValue],
        allowed_sectors: finalSectors,
        updated_at: new Date().toISOString(),
      });
      if (upsertErr) throw upsertErr;
    }

    return NextResponse.json({
      success: true,
      user: { id: newUser.user?.id, phone: newUser.user?.phone },
      adminRank: targetRank,
      allowedSectors: finalSectors,
    });
  } catch (error: any) {
    console.error('[create-sub-admin] error:', error);
    return NextResponse.json({ success: false, error: 'فشل إنشاء حساب المشرف' }, { status: 500 });
  }
}

