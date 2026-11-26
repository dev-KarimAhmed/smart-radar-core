import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  getAdminGeoScope,
  getAdminRank,
  hasAdminPermission,
  isEntityWithinGeoScope,
  verifyAdminCaller,
} from '@/lib/admin-auth-verifier';
import type { FinancialDelegate } from '@/features/admin/types/wallet-directory';
import { loadDelegatesFromDb, saveDelegatesToDb } from './delegates-admin-db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin privileges required' },
      { status: 401 }
    );
  }
  if (!hasAdminPermission(admin, 'delegates.view')) {
    return NextResponse.json(
      { success: false, error: 'غير مصرح: لا تملك صلاحية عرض المناديب الماليين' },
      { status: 403 }
    );
  }

  try {
    const callerRank = getAdminRank(admin);
    const scope = getAdminGeoScope(admin);
    const delegates = (await loadDelegatesFromDb()).filter((d) =>
      isEntityWithinGeoScope(scope, {
        country_id: d.countryId ?? null,
        governorate_id: d.governorateId ?? null,
        district_id: d.districtId ?? null,
        phone: d.phone,
      })
    );

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
  if (!hasAdminPermission(admin, 'delegates.manage')) {
    return NextResponse.json(
      { success: false, error: 'غير مصرح: لا تملك صلاحية إدارة المناديب الماليين' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { action } = body;
    const scope = getAdminGeoScope(admin);
    const delegates = await loadDelegatesFromDb();

    if (action === 'create') {
      if (!isEntityWithinGeoScope(scope, { country_id: body.countryId ?? 1, governorate_id: body.governorateId ?? null, district_id: body.districtId ?? null })) {
        return NextResponse.json(
          { success: false, error: 'غير مصرح: لا يمكنك إضافة مندوب خارج نطاقك الجغرافي' },
          { status: 403 }
        );
      }
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
      if (!isEntityWithinGeoScope(scope, { country_id: delegates[index].countryId ?? null, governorate_id: delegates[index].governorateId ?? null, district_id: delegates[index].districtId ?? null, phone: delegates[index].phone })) {
        return NextResponse.json({ success: false, error: 'غير مصرح: المندوب خارج نطاقك الجغرافي' }, { status: 403 });
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
      const target = delegates.find((d) => d.id === id);
      if (!target) {
        return NextResponse.json({ success: false, error: 'المندوب غير موجود' }, { status: 404 });
      }
      if (!isEntityWithinGeoScope(scope, { country_id: target.countryId ?? null, governorate_id: target.governorateId ?? null, district_id: target.districtId ?? null, phone: target.phone })) {
        return NextResponse.json({ success: false, error: 'غير مصرح: المندوب خارج نطاقك الجغرافي' }, { status: 403 });
      }
      const filtered = delegates.filter((d) => d.id !== id);

      await saveDelegatesToDb(filtered);
      return NextResponse.json({ success: true, message: 'تم حذف المندوب بنجاح', delegates: filtered });
    }

    if (action === 'toggle') {
      const { id } = body;
      const index = delegates.findIndex((d) => d.id === id);
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'المندوب غير موجود' }, { status: 404 });
      }
      if (!isEntityWithinGeoScope(scope, { country_id: delegates[index].countryId ?? null, governorate_id: delegates[index].governorateId ?? null, district_id: delegates[index].districtId ?? null, phone: delegates[index].phone })) {
        return NextResponse.json({ success: false, error: 'غير مصرح: المندوب خارج نطاقك الجغرافي' }, { status: 403 });
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

