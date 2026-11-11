import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { requireAdminAccess } from '@/lib/admin-auth-verifier';
import {
  DEFAULT_TRANSFER_CHANNELS,
  type PaymentTransferChannel,
} from '@/features/admin/types/wallet-directory';

export const dynamic = 'force-dynamic';

const FLAG_KEY = 'captain_transfer_channels';

async function loadChannelsFromDb(): Promise<PaymentTransferChannel[]> {
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
    console.warn('[transfer-channels] error loading from app_flags:', err);
  }

  // Pre-seed defaults if flag is missing
  try {
    await supabaseAdmin.from('app_flags').upsert({
      flag: FLAG_KEY,
      enabled: true,
      note: JSON.stringify(DEFAULT_TRANSFER_CHANNELS),
      updated_at: new Date().toISOString(),
    });
  } catch {}

  return DEFAULT_TRANSFER_CHANNELS;
}

async function saveChannelsToDb(channels: PaymentTransferChannel[]): Promise<boolean> {
  const { error } = await supabaseAdmin.from('app_flags').upsert({
    flag: FLAG_KEY,
    enabled: true,
    note: JSON.stringify(channels),
    updated_at: new Date().toISOString(),
  });
  return !error;
}

export async function GET(req: Request) {
  const access = await requireAdminAccess(req, { sector: 'wallet' });
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: access.error },
      { status: access.status }
    );
  }

  try {
    const callerRank = access.rank;
    const channels = await loadChannelsFromDb();
    channels.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return NextResponse.json({
      success: true,
      callerRank,
      channels,
    });
  } catch (err: any) {
    console.error('[transfer-channels] GET error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transfer channels' },
      { status: 500 }
    );
  }
}

async function handleCreateChannel(body: any, channels: PaymentTransferChannel[]) {
  const { nameAr, nameEn, accountNumber, accountHolder, descriptionAr, descriptionEn, countryId, isActive } = body;
  if (!nameAr?.trim() || !accountNumber?.trim()) {
    return NextResponse.json(
      { success: false, error: 'اسم القناة ورقم التحويل مطلوبان' },
      { status: 400 }
    );
  }

  const newId = `channel_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const newChannel: PaymentTransferChannel = {
    id: newId,
    nameAr: String(nameAr).trim().slice(0, 120),
    nameEn: String(nameEn || nameAr).trim().slice(0, 120),
    accountNumber: String(accountNumber).trim().slice(0, 64),
    accountHolder: accountHolder?.trim()?.slice(0, 120) || undefined,
    descriptionAr: descriptionAr?.trim()?.slice(0, 500) || '',
    descriptionEn: descriptionEn?.trim()?.slice(0, 500) || undefined,
    countryId: countryId !== undefined && countryId !== null && countryId !== '' ? Number(countryId) : null,
    isActive: isActive !== false,
    sortOrder: channels.length + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  channels.push(newChannel);
  const saved = await saveChannelsToDb(channels);
  if (!saved) {
    return NextResponse.json({ success: false, error: 'تعذر حفظ قناة التحويل في قاعدة البيانات' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'تمت إضافة رقم التحويل بنجاح', channel: newChannel, channels });
}

async function handleUpdateChannel(body: any, channels: PaymentTransferChannel[]) {
  const { id, nameAr, nameEn, accountNumber, accountHolder, descriptionAr, descriptionEn, countryId, isActive } = body;
  const index = channels.findIndex((c) => c.id === id);
  if (index === -1) {
    return NextResponse.json({ success: false, error: 'قناة التحويل غير موجودة' }, { status: 404 });
  }

  channels[index] = {
    ...channels[index],
    nameAr: nameAr !== undefined ? String(nameAr).trim().slice(0, 120) : channels[index].nameAr,
    nameEn: nameEn !== undefined && nameEn !== null ? String(nameEn).trim().slice(0, 120) : channels[index].nameEn,
    accountNumber: accountNumber !== undefined ? String(accountNumber).trim().slice(0, 64) : channels[index].accountNumber,
    accountHolder: accountHolder !== undefined ? (accountHolder?.trim()?.slice(0, 120) || undefined) : channels[index].accountHolder,
    descriptionAr: descriptionAr !== undefined && descriptionAr !== null ? String(descriptionAr).trim().slice(0, 500) : channels[index].descriptionAr,
    descriptionEn: descriptionEn !== undefined ? (descriptionEn?.trim()?.slice(0, 500) || undefined) : channels[index].descriptionEn,
    countryId: countryId !== undefined ? (countryId === null || countryId === '' ? null : Number(countryId)) : channels[index].countryId,
    isActive: isActive !== undefined ? Boolean(isActive) : channels[index].isActive,
    updatedAt: new Date().toISOString(),
  };

  const updatedSaved = await saveChannelsToDb(channels);
  if (!updatedSaved) {
    return NextResponse.json({ success: false, error: 'تعذر تحديث قناة التحويل في قاعدة البيانات' }, { status: 500 });
  }
  return NextResponse.json({ success: true, message: 'تم تحديث رقم التحويل بنجاح', channel: channels[index], channels });
}

async function handleToggleChannel(id: string | undefined, explicitActive: boolean | undefined, channels: PaymentTransferChannel[]) {
  const index = channels.findIndex((c) => c.id === id);
  if (index === -1) {
    return NextResponse.json({ success: false, error: 'قناة التحويل غير موجودة' }, { status: 404 });
  }

  channels[index].isActive = explicitActive !== undefined ? Boolean(explicitActive) : !channels[index].isActive;
  channels[index].updatedAt = new Date().toISOString();
  const toggledSaved = await saveChannelsToDb(channels);
  if (!toggledSaved) {
    return NextResponse.json({ success: false, error: 'تعذر تحديث حالة قناة التحويل في قاعدة البيانات' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'تم تغيير حالة التفعيل بنجاح', channel: channels[index], channels });
}

async function handleDeleteChannel(id: string | null | undefined, channels: PaymentTransferChannel[]) {
  if (!id) {
    return NextResponse.json({ success: false, error: 'معرف القناة مطلوب' }, { status: 400 });
  }
  const filtered = channels.filter((c) => c.id !== id);
  if (filtered.length === channels.length) {
    return NextResponse.json({ success: false, error: 'قناة التحويل غير موجودة' }, { status: 404 });
  }

  const deletedSaved = await saveChannelsToDb(filtered);
  if (!deletedSaved) {
    return NextResponse.json({ success: false, error: 'تعذر حذف قناة التحويل في قاعدة البيانات' }, { status: 500 });
  }
  return NextResponse.json({ success: true, message: 'تم حذف رقم التحويل بنجاح', channels: filtered });
}

export async function POST(req: Request) {
  const access = await requireAdminAccess(req, { sector: 'wallet' });
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  try {
    const body = await req.json();
    const action = body?.action || 'create';
    const channels = await loadChannelsFromDb();

    if (action === 'create') return await handleCreateChannel(body, channels);
    if (action === 'update') return await handleUpdateChannel(body, channels);
    if (action === 'delete') return await handleDeleteChannel(body?.id, channels);
    if (action === 'toggle') return await handleToggleChannel(body?.id, body?.isActive, channels);

    return NextResponse.json({ success: false, error: 'إجراء غير مدعوم' }, { status: 400 });
  } catch (err: any) {
    console.error('[transfer-channels] POST error:', err);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حفظ التغييرات' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const access = await requireAdminAccess(req, { sector: 'wallet' });
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  try {
    const body = await req.json();
    const channels = await loadChannelsFromDb();
    return await handleUpdateChannel(body, channels);
  } catch (err: any) {
    console.error('[transfer-channels] PUT error:', err);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء التحديث' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const access = await requireAdminAccess(req, { sector: 'wallet' });
  if (!access.ok) {
    return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  }

  try {
    const body = await req.json();
    const channels = await loadChannelsFromDb();
    return await handleToggleChannel(body?.id, body?.isActive, channels);
  } catch (err: any) {
    console.error('[transfer-channels] PATCH error:', err);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تحديث الحالة' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const access = await requireAdminAccess(req, { sector: 'wallet' });
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
    const channels = await loadChannelsFromDb();
    return await handleDeleteChannel(id, channels);
  } catch (err: any) {
    console.error('[transfer-channels] DELETE error:', err);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء الحذف' },
      { status: 500 }
    );
  }
}

