import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminCaller, getAdminRank } from '@/lib/admin-auth-verifier';
import {
  DEFAULT_FINANCIAL_DELEGATES,
  type FinancialDelegate,
} from '@/features/admin/types/wallet-directory';

export const dynamic = 'force-dynamic';

const FLAG_KEY = 'financial_delegates_directory';

async function loadDelegatesFromDb(): Promise<FinancialDelegate[]> {
  try {
    const { data } = await supabaseAdmin
      .from('app_flags')
      .select('note')
      .eq('flag', FLAG_KEY)
      .maybeSingle();

    if (data?.note) {
      const parsed = JSON.parse(data.note);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[financial-delegates] error loading from app_flags:', err);
  }

  // Pre-seed defaults if flag is missing
  try {
    await supabaseAdmin.from('app_flags').upsert({
      flag: FLAG_KEY,
      enabled: true,
      note: JSON.stringify(DEFAULT_FINANCIAL_DELEGATES),
      updated_at: new Date().toISOString(),
    });
  } catch {}

  return DEFAULT_FINANCIAL_DELEGATES;
}

async function saveDelegatesToDb(delegates: FinancialDelegate[]): Promise<boolean> {
  const { error } = await supabaseAdmin.from('app_flags').upsert({
    flag: FLAG_KEY,
    enabled: true,
    note: JSON.stringify(delegates),
    updated_at: new Date().toISOString(),
  });
  return !error;
}

export async function GET(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin privileges required' },
      { status: 401 }
    );
  }

  try {
    const callerRank = getAdminRank(admin);
    const delegates = await loadDelegatesFromDb();

    // Fetch geography lists for selection dropdowns
    const [countriesRes, govRes, distRes] = await Promise.all([
      supabaseAdmin.from('countries').select('id, name_ar, name_en, country_code').order('id', { ascending: true }),
      supabaseAdmin.from('governorates').select('id, name_ar, name_en, country_id').order('id', { ascending: true }),
      supabaseAdmin.from('districts').select('id, name_ar, name_en, governorate_id').order('id', { ascending: true }),
    ]);

    return NextResponse.json({
      success: true,
      callerRank,
      delegates,
      countries: countriesRes.data || [],
      governorates: govRes.data || [],
      districts: distRes.data || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch financial delegates' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin privileges required' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;
    const delegates = await loadDelegatesFromDb();

    if (action === 'create') {
      const {
        name,
        phone,
        whatsapp,
        countryId,
        governorateId,
        governorateName,
        districtId,
        districtName,
        notes,
        isActive,
      } = body;

      if (!name?.trim() || !phone?.trim()) {
        return NextResponse.json(
          { success: false, error: 'اسم المندوب ورقم الهاتف مطلوبان' },
          { status: 400 }
        );
      }

      const cleanPhone = phone.trim().replace(/^\+/, '');
      const cleanWhatsapp = (whatsapp || phone).trim().replace(/^\+/, '');
      const newId = `del_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const newDelegate: FinancialDelegate = {
        id: newId,
        name: name.trim(),
        phone: cleanPhone,
        whatsapp: cleanWhatsapp,
        countryId: countryId ? Number(countryId) : 1,
        governorateId: governorateId ? Number(governorateId) : null,
        governorateName: governorateName?.trim() || undefined,
        districtId: districtId ? Number(districtId) : null,
        districtName: districtName?.trim() || undefined,
        notes: notes?.trim() || undefined,
        isActive: isActive !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      delegates.push(newDelegate);
      await saveDelegatesToDb(delegates);

      return NextResponse.json({
        success: true,
        message: 'تمت إضافة المندوب المالي بنجاح',
        delegate: newDelegate,
        delegates,
      });
    }

    if (action === 'update') {
      const {
        id,
        name,
        phone,
        whatsapp,
        countryId,
        governorateId,
        governorateName,
        districtId,
        districtName,
        notes,
        isActive,
      } = body;

      const index = delegates.findIndex((d) => d.id === id);
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'المندوب غير موجود' }, { status: 404 });
      }

      const cleanPhone = phone ? phone.trim().replace(/^\+/, '') : delegates[index].phone;
      const cleanWhatsapp = whatsapp !== undefined
        ? (whatsapp ? whatsapp.trim().replace(/^\+/, '') : undefined)
        : delegates[index].whatsapp;

      delegates[index] = {
        ...delegates[index],
        name: name !== undefined ? name.trim() : delegates[index].name,
        phone: cleanPhone,
        whatsapp: cleanWhatsapp,
        countryId: countryId !== undefined ? (countryId ? Number(countryId) : null) : delegates[index].countryId,
        governorateId: governorateId !== undefined ? (governorateId ? Number(governorateId) : null) : delegates[index].governorateId,
        governorateName: governorateName !== undefined ? (governorateName?.trim() || undefined) : delegates[index].governorateName,
        districtId: districtId !== undefined ? (districtId ? Number(districtId) : null) : delegates[index].districtId,
        districtName: districtName !== undefined ? (districtName?.trim() || undefined) : delegates[index].districtName,
        notes: notes !== undefined ? (notes?.trim() || undefined) : delegates[index].notes,
        isActive: isActive !== undefined ? Boolean(isActive) : delegates[index].isActive,
        updatedAt: new Date().toISOString(),
      };

      await saveDelegatesToDb(delegates);
      return NextResponse.json({
        success: true,
        message: 'تم تحديث بيانات المندوب بنجاح',
        delegate: delegates[index],
        delegates,
      });
    }

    if (action === 'delete') {
      const { id } = body;
      const filtered = delegates.filter((d) => d.id !== id);
      if (filtered.length === delegates.length) {
        return NextResponse.json({ success: false, error: 'المندوب غير موجود' }, { status: 404 });
      }

      await saveDelegatesToDb(filtered);
      return NextResponse.json({ success: true, message: 'تم حذف المندوب بنجاح', delegates: filtered });
    }

    if (action === 'toggle') {
      const { id } = body;
      const index = delegates.findIndex((d) => d.id === id);
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'المندوب غير موجود' }, { status: 404 });
      }

      delegates[index].isActive = !delegates[index].isActive;
      delegates[index].updatedAt = new Date().toISOString();
      await saveDelegatesToDb(delegates);

      return NextResponse.json({
        success: true,
        message: 'تم تغيير حالة المندوب بنجاح',
        delegate: delegates[index],
        delegates,
      });
    }

    return NextResponse.json({ success: false, error: 'إجراء غير مدعوم' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'حدث خطأ أثناء حفظ التغييرات' },
      { status: 500 }
    );
  }
}

