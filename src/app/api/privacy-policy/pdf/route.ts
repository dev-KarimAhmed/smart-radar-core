import { NextResponse } from 'next/server';
import { generatePrivacyPolicyPdf } from '@/server/services/privacy-pdf/privacy-pdf-service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const isDownload = url.searchParams.get('download') === 'true';
    const forceFresh = url.searchParams.get('fresh') === 'true';

    const pdfBuffer = await generatePrivacyPolicyPdf({
      fresh: forceFresh,
    });

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': isDownload
          ? 'attachment; filename="Bynkcom_Privacy_Policy.pdf"'
          : 'inline',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err) {
    console.error('[Privacy Policy PDF API Error]:', err);
    return NextResponse.json(
      { success: false, error: 'failed_to_generate_privacy_pdf' },
      { status: 500 }
    );
  }
}
