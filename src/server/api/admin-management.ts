import { Router, type Request } from 'express';
import { requireRole } from './supabase-identity';

export const adminManagementRouter = Router();

function serviceConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) return null;
  return { url: url.replace(/\/$/, ''), serviceKey };
}

function serviceHeaders(serviceKey: string) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

function normalizePhone(phone: string): string {
  const cleaned = phone.trim().replace(/[\s()-]/g, '');
  if (cleaned.startsWith('00')) return '+' + cleaned.slice(2);
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('07') && cleaned.length === 10) return '+962' + cleaned.slice(1);
    if (cleaned.startsWith('01') && cleaned.length === 11) return '+20' + cleaned.slice(1);
    return '+' + cleaned;
  }
  return cleaned;
}

/**
 * POST /api/admin/create-sub-admin
 * Secure endpoint to create an administrator account.
 * Requires caller to hold role 'ADMIN' in public.profiles.
 */
adminManagementRouter.post('/admin/create-sub-admin', async (req: Request, res) => {
  const authorized = await requireRole(req, ['ADMIN', 'OWNER']);
  if (!authorized.ok) {
    return res.status(authorized.status).json({ success: false, error: authorized.error });
  }

  const config = serviceConfig();
  if (!config) {
    return res.status(503).json({ success: false, error: 'خدمة إنشاء الحسابات غير مهيأة على الخادم.' });
  }

  const { fullName, phone, password } = req.body;

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 3) {
    return res.status(400).json({ success: false, error: 'يرجى كتابة الاسم الكامل للمشرف (3 أحرف على الأقل).' });
  }

  if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
    return res.status(400).json({ success: false, error: 'يرجى إدخال رقم هاتف صالح بصيغة دولية.' });
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ success: false, error: 'كلمة المرور يجب ألا تقل عن 8 خانات.' });
  }

  const normalizedPhone = normalizePhone(phone);

  try {
    // 1. Call Supabase Auth Admin API using service_role key
    const response = await fetch(`${config.url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: serviceHeaders(config.serviceKey),
      body: JSON.stringify({
        phone: normalizedPhone,
        password: password,
        phone_confirm: true,
        user_metadata: {
          role: 'ADMIN',
          full_name: fullName.trim(),
          phone: normalizedPhone,
          created_by_admin: authorized.caller.userId,
          created_at_epoch: Date.now(),
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data?.msg || data?.message || data?.error_description || '';
      if (msg.includes('already exists') || msg.includes('phone_exists')) {
        return res.status(409).json({ success: false, error: 'رقم الهاتف هذا مسجل بالفعل لحساب آخر في النظام.' });
      }
      return res.status(response.status).json({ success: false, error: msg || 'فشل إنشاء حساب المشرف في خدمة المصادقة.' });
    }

    const createdUser = data;

    // 2. Return success payload
    return res.json({
      success: true,
      message: 'تم إنشاء وتفعيل حساب المشرف الجديد بنجاح.',
      admin: {
        id: createdUser.id,
        phone: normalizedPhone,
        fullName: fullName.trim(),
        role: 'ADMIN',
        createdAt: createdUser.created_at || new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Admin Management Error - create-sub-admin]:', error);
    return res.status(500).json({ success: false, error: error?.message || 'حدث خطأ غير متوقع أثناء معالجة الطلب.' });
  }
});

const PRIMARY_SOVEREIGN_ADMIN_ID = '70b4a26f-10ac-4888-8df6-c3a5ad824b8a';
const PRIMARY_SOVEREIGN_ADMIN_PHONE = '+201551981922';

function resolveAdminRank(adm: any): 'GENERAL_ADMIN' | 'ASSISTANT_ADMIN' {
  if (!adm) return 'ASSISTANT_ADMIN';
  if (adm.id === PRIMARY_SOVEREIGN_ADMIN_ID || adm.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE) {
    return 'GENERAL_ADMIN';
  }
  if (adm.admin_rank === 'GENERAL_ADMIN') return 'GENERAL_ADMIN';
  if (adm.admin_rank === 'ASSISTANT_ADMIN') return 'ASSISTANT_ADMIN';
  if (Array.isArray(adm.rank_audit_log)) {
    if (adm.rank_audit_log.includes('RANK_GENERAL_ADMIN')) return 'GENERAL_ADMIN';
    if (adm.rank_audit_log.includes('RANK_ASSISTANT_ADMIN')) return 'ASSISTANT_ADMIN';
  }
  return 'ASSISTANT_ADMIN';
}

/**
 * GET /api/admin/list-admins
 * Fetches all registered administrators from public.profiles with ranks.
 * Protected by requireRole(['ADMIN', 'OWNER']).
 */
adminManagementRouter.get('/admin/list-admins', async (req: Request, res) => {
  const authorized = await requireRole(req, ['ADMIN', 'OWNER']);
  if (!authorized.ok) {
    return res.status(authorized.status).json({ success: false, error: authorized.error });
  }

  const config = serviceConfig();
  if (!config) {
    return res.status(503).json({ success: false, error: 'خدمة استعلام الحسابات غير مهيأة.' });
  }

  try {
    const response = await fetch(
      `${config.url}/rest/v1/profiles?role=eq.ADMIN&select=id,full_name,phone,email,status,created_at,rank_audit_log&order=created_at.desc`,
      {
        headers: serviceHeaders(config.serviceKey),
      },
    );

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: 'تعذر جلب قائمة المشرفين من قاعدة البيانات.' });
    }

    const rawAdmins = await response.json();
    const adminsList = Array.isArray(rawAdmins) ? rawAdmins : [];

    const mappedAdmins = adminsList.map((adm: any) => {
      const isPrimary = adm.id === PRIMARY_SOVEREIGN_ADMIN_ID || adm.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE;
      const rank = isPrimary ? 'GENERAL_ADMIN' : resolveAdminRank(adm);
      return {
        id: adm.id,
        full_name: adm.full_name,
        phone: adm.phone,
        email: adm.email,
        status: adm.status,
        created_at: adm.created_at,
        admin_rank: rank,
        admin_rank_label: rank === 'GENERAL_ADMIN' ? 'مشرف عام' : 'مشرف مساعد',
        is_primary: isPrimary,
      };
    });

    const callerId = authorized.caller.userId;
    const callerAdmin = mappedAdmins.find((a: any) => a.id === callerId);
    const callerRank = callerId === PRIMARY_SOVEREIGN_ADMIN_ID
      ? 'GENERAL_ADMIN'
      : (callerAdmin?.admin_rank || 'ASSISTANT_ADMIN');

    return res.json({
      success: true,
      admins: mappedAdmins,
      callerRank,
      callerId,
    });
  } catch (error: any) {
    console.error('[Admin Management Error - list-admins]:', error);
    return res.status(500).json({ success: false, error: error?.message || 'خطأ داخلي في الخادم.' });
  }
});

