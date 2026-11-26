import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdminCaller } from '@/lib/admin-auth-verifier';

export const dynamic = 'force-dynamic';

type CardType = 'COMMERCIAL' | 'CRAFTS';

export async function GET(req: Request) {
  const admin = await verifyAdminCaller(req);
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin privileges required' },
      { status: 401 },
    );
  }

  try {
    const url = new URL(req.url);
    const summaryOnly = url.searchParams.get('summary') === '1';
    const cardType = String(url.searchParams.get('cardType') || '').toUpperCase() as CardType;

    if (summaryOnly) {
      const { data, error } = await supabaseAdmin
        .from('early_launch_ad_leads')
        .select('card_type, visitor_count');

      if (error) throw error;
      const rows = Array.isArray(data) ? data : [];
      const commercial = rows.filter((r) => r.card_type === 'COMMERCIAL');
      const crafts = rows.filter((r) => r.card_type === 'CRAFTS');

      return NextResponse.json({
        success: true,
        summary: {
          commercialCount: commercial.length,
          commercialVisitors: commercial.reduce((acc, r) => acc + Number(r.visitor_count || 0), 0),
          craftsCount: crafts.length,
          craftsVisitors: crafts.reduce((acc, r) => acc + Number(r.visitor_count || 0), 0),
        },
      });
    }

    if (cardType !== 'COMMERCIAL' && cardType !== 'CRAFTS') {
      return NextResponse.json({ success: false, error: 'invalid_card_type' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('early_launch_ad_leads')
      .select('entity_or_category, specialty, phone, country, governorate, district, share_code, visitor_count, created_at')
      .eq('card_type', cardType)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const origin = url.origin;
    const rows = Array.isArray(data) ? data : [];
    const firstColLabel = cardType === 'COMMERCIAL' ? 'اسم المنشأة' : 'التصنيف';

    const sheetRows = rows.map((row, idx) => ({
      '#': idx + 1,
      [firstColLabel]: row.entity_or_category,
      'التخصص': row.specialty,
      'رقم الهاتف': row.phone,
      'الدولة': row.country || '',
      'المحافظة': row.governorate,
      'اللواء': row.district,
      'كود المشاركة': row.share_code,
      'رابط المشاركة': `${origin}/?promo_ref=${encodeURIComponent(String(row.share_code || ''))}`,
      'عدد الزائرين': Number(row.visitor_count || 0),
      'تاريخ التسجيل': row.created_at ? new Date(row.created_at).toLocaleString('ar-EG') : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(
      sheetRows.length > 0
        ? sheetRows
        : [{
            '#': '',
            [firstColLabel]: '',
            'التخصص': '',
            'رقم الهاتف': '',
            'الدولة': '',
            'المحافظة': '',
            'اللواء': '',
            'كود المشاركة': '',
            'رابط المشاركة': '',
            'عدد الزائرين': 0,
            'تاريخ التسجيل': '',
          }],
    );

    const workbook = XLSX.utils.book_new();
    const sheetName = cardType === 'COMMERCIAL' ? 'منشآت تجارية' : 'مهن يدوية وحرفيين';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const filename = cardType === 'COMMERCIAL'
      ? `commercial-establishments-leads.xlsx`
      : `handcrafts-artisans-leads.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'export_failed' },
      { status: 500 },
    );
  }
}
