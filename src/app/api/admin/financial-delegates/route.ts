import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdminAccess } from '@/lib/admin-auth-verifier';
import {
  DEFAULT_FINANCIAL_DELEGATES,
  type FinancialDelegate,
} from '@/features/admin/types/wallet-directory';

export const dynamic = 'force-dynamic';

const FLAG_KEY = 'financial_delegates_directory';

function isSaudiPhone(raw: string): boolean {
  const compact = String(raw || '').replace(/[\s\-().]/g, '');
  if (compact.startsWith('+966') || compact.startsWith('00966')) return true;
  const digits = compact.replace(/\D/g, '');
  return digits.startsWith('966') && digits.length >= 11;
}

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
  const access = await requireAdminAccess(req, { sector: 'delegates' });
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: access.error },
      { status: access.status }
    );
  }

  try {
    const callerRank = access.rank;
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
    console.error('[financial-delegates] GET error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch financial delegates' },
      { status: 500 }
    );
  }
}

async function handleCreateDelegate(body: any, delegates: FinancialDelegate[]) {
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
  if (isSaudiPhone(phone) || (whatsapp && isSaudiPhone(whatsapp))) {
    return NextResponse.json(
      { success: false, error: 'أرقام الهواتف السعودية (+966) غير مدعومة' },
      { status: 403 }
    );
  }

  const cleanPhone = String(phone).trim().replace(/^\+/, '');
  const cleanWhatsapp = String(whatsapp || phone).trim().replace(/^\+/, '');
  const newId = `del_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  const newDelegate: FinancialDelegate = {
    id: newId,
    name: String(name).trim().slice(0, 120),
    phone: cleanPhone.slice(0, 24),
    whatsapp: cleanWhatsapp.slice(0, 24),
    countryId: countryId ? Number(countryId) : 1,
    governorateId: governorateId ? Number(governorateId) : null,
    governorateName: governorateName?.trim() || undefined,
    districtId: districtId ? Number(districtId) : null,
    districtName: districtName?.trim() || undefined,
    notes: notes?.trim()?.slice(0, 500) || undefined,
    isActive: isActive !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  delegates.push(newDelegate);
  const saved = await saveDelegatesToDb(delegates);
  if (!saved) {
    return NextResponse.json({ success: false, error: 'تعذر حفظ بيانات المندوب في قاعدة البيانات' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'تمت إضافة المندوب المالي بنجاح',
    delegate: newDelegate,
    delegates,
  });
}

async function handleUpdateDelegate(body: any, delegates: FinancialDelegate[]) {
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
  if ((phone && isSaudiPhone(phone)) || (whatsapp && isSaudiPhone(whatsapp))) {
    return NextResponse.json(
      { success: false, error: 'أرقام الهواتف السعودية (+966) غير مدعومة' },
      { status: 403 }
    );
  }

  const cleanPhone = phone ? String(phone).trim().replace(/^\+/, '') : delegates[index].phone;
  const cleanWhatsapp = whatsapp !== undefined
    ? (whatsapp ? String(whatsapp).trim().replace(/^\+/, '') : undefined)
    : delegates[index].whatsapp;

  delegates[index] = {
    ...delegates[index],
    name: name !== undefined ? String(name).trim().slice(0, 120) : delegates[index].name,
    phone: cleanPhone.slice(0, 24),
    whatsapp: cleanWhatsapp?.slice(0, 24),
    countryId: countryId !== undefined ? (countryId ? Number(countryId) : null) : delegates[index].countryId,
    governorateId: governorateId !== undefined ? (governorateId ? Number(governorateId) : null) : delegates[index].governorateId,
    governorateName: governorateName !== undefined ? (governorateName?.trim() || undefined) : delegates[index].governorateName,
    districtId: districtId !== undefined ? (districtId ? Number(districtId) : null) : delegates[index].districtId,
    districtName: districtName !== undefined ? (districtName?.trim() || undefined) : delegates[index].districtName,
    notes: notes !== undefined ? (notes?.trim()?.slice(0, 500) || undefined) : delegates[index].notes,
    isActive: isActive !== undefined ? Boolean(isActive) : delegates[index].isActive,
    updatedAt: new Date().toISOString(),
  };

  const updatedSaved = await saveDelegatesToDb(delegates);
  if (!updatedSaved) {
    return NextResponse.json({ success: false, error: 'تعذر تحديث بيانات المندوب في قاعدة البيانات' }, { status: 500 });
  }
  return NextResponse.json({
    success: true,
    message: 'تم تحديث بيانات المندوب بنجاح',
    delegate: delegates[index],
    delegates,
  });
}

async function handleToggleDelegate(id: string | undefined, explicitActive: boolean | undefined, delegates: FinancialDelegate[]) {
  const index = delegates.findIndex((d) => d.id === id);
  if (index === -1) {
    return NextResponse.json({ success: false, error: 'المندوب غير موجود' }, { status: 404 });
  }

  delegates[index].isActive = explicitActive !== undefined ? Boolean(explicitActive) : !delegates[index].isActive;
  delegates[index].updatedAt = new Date().toISOString();
  const toggledSaved = await saveDelegatesToDb(delegates);
  if (!toggledSaved) {
    return NextResponse.json({ success: false, error: 'تعذر تحديث حالة المندوب في قاعدة البيانات' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'تم تغيير حالة المندوب بنجاح',
    delegate: delegates[index],
    delegates,
  });
}

async function handleDeleteDelegate(id: string | null | undefined, delegates: FinancialDelegate[]) {
  if (!id) {
    return NextResponse.json({ success: false, error: 'معرف المندوب مطلوب' }, { status: 400 });
  }
  const filtered = delegates.filter((d) => d.id !== id);
  if (filtered.length === delegates.length) {
    return NextResponse.json({ success: false, error: 'المندوب غير موجود' }, { status: 404 });
  }

  const deletedSaved = await saveDelegatesToDb(filtered);
  if (!deletedSaved) {
    return NextResponse.json({ success: false, error: 'تعذر حذف المندوب في قاعدة البيانات' }, { status: 500 });
  }
  return NextResponse.json({ success: true, message: 'تم حذف المندوب بنجاح', delegates: filtered });
}

export async function POST(req: Request) {
  const access = await requireAdminAccess(req, { sector: 'delegates' });
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  try {
    const body = await req.json();
    const action = body?.action || 'create';
    const delegates = await loadDelegatesFromDb();

    if (action === 'create') return await handleCreateDelegate(body, delegates);
    if (action === 'update') return await handleUpdateDelegate(body, delegates);
    if (action === 'delete') return await handleDeleteDelegate(body?.id, delegates);
    if (action === 'toggle') return await handleToggleDelegate(body?.id, body?.isActive, delegates);

    return NextResponse.json({ success: false, error: 'إجراء غير مدعوم' }, { status: 400 });
  } catch (err: any) {
    console.error('[financial-delegates] POST error:', err);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حفظ التغييرات' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const access = await requireAdminAccess(req, { sector: 'delegates' });
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  try {
    const body = await req.json();
    const delegates = await loadDelegatesFromDb();
    return await handleUpdateDelegate(body, delegates);
  } catch (err: any) {
    console.error('[financial-delegates] PUT error:', err);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تحديث المندوب' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const access = await requireAdminAccess(req, { sector: 'delegates' });
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  try {
    const body = await req.json();
    const delegates = await loadDelegatesFromDb();
    return await handleToggleDelegate(body?.id, body?.isActive, delegates);
  } catch (err: any) {
    console.error('[financial-delegates] PATCH error:', err);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تحديث الحالة' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const access = await requireAdminAccess(req, { sector: 'delegates' });
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');
    if (!id) {
      const body = await req.json().catch(() => null);
      id = body?.id || null;
    }
    const delegates = await loadDelegatesFromDb();
    return await handleDeleteDelegate(id, delegates);
  } catch (err: any) {
    console.error('[financial-delegates] DELETE error:', err);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حذف المندوب' },
      { status: 500 }
    );
  }
}

