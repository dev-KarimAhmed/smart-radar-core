import privacyData from '@/shared/data/privacy-policy.json';
import { PRIVACY_HTML_STYLES } from './privacy-html-styles';

export function buildPrivacyPolicyHtml(options?: {
  userSerial?: string;
  acceptedAt?: string;
  version?: string;
}): string {
  const version = options?.version || privacyData.version || 'V2.6-Privacy';
  const serial = options?.userSerial || 'BYNK-PRV-SECURED';
  const dateStr = options?.acceptedAt
    ? new Date(options.acceptedAt).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>${privacyData.title} - شبكة بينكم</title>
  <style>
${PRIVACY_HTML_STYLES}
  </style>
</head>
<body>
  <!-- PAGE 1: Preamble & Part 1 Core -->
  <div class="privacy-page">
    <div>
      <table class="header-table">
        <tr>
          <td style="vertical-align: top;">
            <div class="badge-sovereign">وثيقة رسمية معتمدة · قانون حماية البيانات الشخصية والمعاملات الإلكترونية</div>
            <h1 class="brand-title">${privacyData.title}</h1>
            <div class="sub-title">${privacyData.subtitle} · الإصدار المعتمد ${version}</div>
          </td>
          <td style="vertical-align: top; width: 220px;">
            <div class="serial-box">
              <div style="font-size: 11px; color: #94A3B8;">رمز السياسة المعتمدة:</div>
              <span class="serial-code">${serial}</span>
              <div class="status-active">● معتمد وساري المفعول</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Preamble Section -->
      <div class="section-box">
        <div class="section-title">${privacyData.preamble.title}</div>
        <div class="clause-item">
          ${privacyData.preamble.paragraphs.slice(0, 5).map((p) => `<p style="margin: 0 0 6px 0;">${p}</p>`).join('')}
        </div>
      </div>

      <!-- Part 1: Highlights -->
      <div class="section-box">
        <div class="section-title">${privacyData.sections[0]?.title || 'الجزء الأول: سياسة خصوصية المستخدم'}</div>
        ${(privacyData.sections[0]?.articles || []).slice(0, 6).map((art) => `
          <div class="clause-item">
            <b>${art.title}:</b>
            <span>${art.paragraphs.join(' ')}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="page-footer">
      <span>شبكة بينكم للإعلان الرقمي · سياسة خصوصية المستخدم والإعلانات</span>
      <span>الصفحة 1 من 3</span>
    </div>
  </div>

  <!-- PAGE 2: Part 1 Continued & Geolocation & 72h Purge -->
  <div class="privacy-page">
    <div>
      <table class="header-table">
        <tr>
          <td style="vertical-align: top;">
            <h2 class="brand-title" style="font-size: 20px;">شبكة بينكم للإعلان الرقمي</h2>
            <div class="sub-title" style="font-size: 13px;">تابع: الوظائف الجغرافية، الاتصال، وحماية البيانات الطرفية</div>
          </td>
          <td style="vertical-align: top; width: 220px; text-align: left;">
            <div style="font-size: 12px; color: #94A3B8;">الرمز: <span style="color: #14F5D5; font-family: monospace;">${serial}</span></div>
          </td>
        </tr>
      </table>

      <div class="section-box">
        <div class="section-title">تابع أحكام خصوصية المستخدم والتحكم المكاني</div>
        ${(privacyData.sections[0]?.articles || []).slice(6, 14).map((art) => `
          <div class="clause-item">
            <b>${art.title}:</b>
            <span>${art.paragraphs.join(' ')}</span>
          </div>
        `).join('')}
      </div>

      <div class="section-box">
        <div class="section-title">${privacyData.sections[1]?.title || 'الجزء الثاني: سياسة الخصوصية العامة للشبكة'}</div>
        ${(privacyData.sections[1]?.articles || []).slice(0, 5).map((art) => `
          <div class="clause-item">
            <b>${art.title}:</b>
            <span>${art.paragraphs.join(' ')}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="page-footer">
      <span>شبكة بينكم للإعلان الرقمي · سياسة خصوصية المستخدم والإعلانات</span>
      <span>الصفحة 2 من 3</span>
    </div>
  </div>

  <!-- PAGE 3: Advertisers Privacy & Source of Truth -->
  <div class="privacy-page">
    <div>
      <table class="header-table">
        <tr>
          <td style="vertical-align: top;">
            <h2 class="brand-title" style="font-size: 20px;">شبكة بينكم للإعلان الرقمي</h2>
            <div class="sub-title" style="font-size: 13px;">خصوصية المعلنين المستقلين والوثيقة المصدرية العامة</div>
          </td>
          <td style="vertical-align: top; width: 220px; text-align: left;">
            <div style="font-size: 12px; color: #94A3B8;">تاريخ التوثيق: <span style="color: #14F5D5;">${dateStr}</span></div>
          </td>
        </tr>
      </table>

      <div class="section-box">
        <div class="section-title">${privacyData.sections[2]?.title || 'الجزء الثالث: سياسة الخصوصية الخاصة بالمعلنين المستقلين'}</div>
        ${(privacyData.sections[2]?.articles || []).map((art) => `
          <div class="clause-item">
            <b>${art.title}:</b>
            <span>${art.paragraphs.join(' ')}</span>
          </div>
        `).join('')}
      </div>

      <!-- Legal Declaration Note -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; background: rgba(20, 184, 166, 0.08); padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(20, 184, 166, 0.25);">
        <div>
          <span style="color: #10B981; font-size: 12.5px; font-weight: 800; display: block;">✓ تم توثيق الموافقة على سياسة الخصوصية إلكترونياً</span>
          <span style="color: #94A3B8; font-size: 11px;">المرجع: قانون المعاملات الإلكترونية الأردني وقانون حماية البيانات الشخصية رقم (24) لسنة 2023</span>
        </div>
        <span style="color: #14F5D5; font-weight: 800; font-size: 12px;">ساري ومعتمد</span>
      </div>
    </div>

    <div class="page-footer">
      <span>شبكة بينكم للإعلان الرقمي · سياسة خصوصية المستخدم والإعلانات</span>
      <span>الصفحة 3 من 3</span>
    </div>
  </div>
</body>
</html>`;
}
