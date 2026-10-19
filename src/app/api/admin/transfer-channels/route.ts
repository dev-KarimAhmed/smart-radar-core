import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminCaller, getAdminRank } from '@/lib/admin-auth-verifier';
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
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin privileges required' },
      { status: 401 }
    );
  }

  try {
    const callerRank = getAdminRank(admin);
    const channels = await loadChannelsFromDb();
    channels.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return NextResponse.json({
      success: true,
      callerRank,
      channels,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch transfer channels' },
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
    const channels = await loadChannelsFromDb();

    if (action === 'create') {
      const { nameAr, nameEn, accountNumber, accountHolder, descriptionAr, descriptionEn, countryId, isActive } = body;
      if (!nameAr?.trim() || !accountNumber?.trim()) {
        return NextResponse.json(
          { success: false, error: 'اسم القناة ورقم التحويل مطلوبان' },
          { status: 400 }
        );
      }

      const newId = `channel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newChannel: PaymentTransferChannel = {
        id: newId,
        nameAr: nameAr.trim(),
        nameEn: (nameEn || nameAr).trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder?.trim() || undefined,
        descriptionAr: descriptionAr?.trim() || '',
        descriptionEn: descriptionEn?.trim() || undefined,
        countryId: countryId !== undefined && countryId !== null && countryId !== '' ? Number(countryId) : null,
        isActive: isActive !== false,
        sortOrder: channels.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      channels.push(newChannel);
      await saveChannelsToDb(channels);

      return NextResponse.json({ success: true, message: 'تمت إضافة رقم التحويل بنجاح', channel: newChannel, channels });
    }

    if (action === 'update') {
      const { id, nameAr, nameEn, accountNumber, accountHolder, descriptionAr, descriptionEn, countryId, isActive } = body;
      const index = channels.findIndex((c) => c.id === id);
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'قناة التحويل غير موجودة' }, { status: 404 });
      }

      channels[index] = {
        ...channels[index],
        nameAr: nameAr !== undefined ? nameAr.trim() : channels[index].nameAr,
        nameEn: nameEn !== undefined ? nameEn.trim() : channels[index].nameEn,
        accountNumber: accountNumber !== undefined ? accountNumber.trim() : channels[index].accountNumber,
        accountHolder: accountHolder !== undefined ? (accountHolder.trim() || undefined) : channels[index].accountHolder,
        descriptionAr: descriptionAr !== undefined ? descriptionAr.trim() : channels[index].descriptionAr,
        descriptionEn: descriptionEn !== undefined ? (descriptionEn.trim() || undefined) : channels[index].descriptionEn,
        countryId: countryId !== undefined ? (countryId === null || countryId === '' ? null : Number(countryId)) : channels[index].countryId,
        isActive: isActive !== undefined ? Boolean(isActive) : channels[index].isActive,
        updatedAt: new Date().toISOString(),
      };

      await saveChannelsToDb(channels);
      return NextResponse.json({ success: true, message: 'تم تحديث رقم التحويل بنجاح', channel: channels[index], channels });
    }

    if (action === 'delete') {
      const { id } = body;
      const filtered = channels.filter((c) => c.id !== id);
      if (filtered.length === channels.length) {
        return NextResponse.json({ success: false, error: 'قناة التحويل غير موجودة' }, { status: 404 });
      }

      await saveChannelsToDb(filtered);
      return NextResponse.json({ success: true, message: 'تم حذف رقم التحويل بنجاح', channels: filtered });
    }

    if (action === 'toggle') {
      const { id } = body;
      const index = channels.findIndex((c) => c.id === id);
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'قناة التحويل غير موجودة' }, { status: 404 });
      }

      channels[index].isActive = !channels[index].isActive;
      channels[index].updatedAt = new Date().toISOString();
      await saveChannelsToDb(channels);

      return NextResponse.json({ success: true, message: 'تم تغيير حالة التفعيل بنجاح', channel: channels[index], channels });
    }

    return NextResponse.json({ success: false, error: 'إجراء غير مدعوم' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'حدث خطأ أثناء حفظ التغييرات' },
      { status: 500 }
    );
  }
}

