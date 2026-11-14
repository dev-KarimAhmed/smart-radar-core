import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveEmailLanguage,
  getSenderFromEmail,
  buildAccountConfirmationEmail,
  buildPasswordResetEmail,
  buildCaptainContractEmail,
} from './email-service';
import { formatContractDate } from './contract-pdf-service';

describe('email-service localization & template checks', () => {
  it('resolves email language correctly across headers, cookies, and profile fields', () => {
    // 1. Explicit takes precedence
    assert.equal(resolveEmailLanguage({ explicitLang: 'en' }), 'en');
    assert.equal(resolveEmailLanguage({ explicitLang: 'ar' }), 'ar');

    // 2. Profile language
    assert.equal(resolveEmailLanguage({ profileLang: 'en' }), 'en');
    assert.equal(resolveEmailLanguage({ profileLang: 'ar' }), 'ar');

    // 3. NEXT_LOCALE cookie
    assert.equal(resolveEmailLanguage({ cookieHeader: 'foo=bar; NEXT_LOCALE=en; baz=1' }), 'en');
    assert.equal(resolveEmailLanguage({ cookieHeader: 'NEXT_LOCALE=ar' }), 'ar');

    // 4. Custom header
    assert.equal(resolveEmailLanguage({ customHeader: 'en' }), 'en');

    // 5. Accept-Language
    assert.equal(resolveEmailLanguage({ acceptLanguage: 'en-US,en;q=0.9' }), 'en');
    assert.equal(resolveEmailLanguage({ acceptLanguage: 'ar-JO,ar;q=0.9' }), 'ar');

    // 6. Default fallback
    assert.equal(resolveEmailLanguage({}), 'ar');
  });

  it('selects appropriate sender name based on language', () => {
    const senderAr = getSenderFromEmail('ar');
    const senderEn = getSenderFromEmail('en');

    assert.ok(senderAr.includes('بينكم') || senderAr.includes('bynkcom'));
    assert.ok(senderEn.includes('Bynkcom') || senderEn.includes('bynkcom'));
  });

  it('formats contract date in both Arabic and English', () => {
    const testDate = new Date('2026-11-14T14:30:00Z');
    const dateAr = formatContractDate(testDate, 'ar');
    const dateEn = formatContractDate(testDate, 'en');

    assert.ok(dateAr.includes('نوفمبر') && dateAr.includes('الساعة'), `Expected Arabic date, got: ${dateAr}`);
    assert.ok(dateEn.includes('November') && dateEn.includes('at'), `Expected English date, got: ${dateEn}`);
  });

  it('builds account confirmation email in Arabic with proper RTL and copy', () => {
    const email = buildAccountConfirmationEmail({
      userName: 'أحمد محمود',
      confirmUrl: 'https://bynkcom.com/auth/confirm?token=123',
      otpCode: '852963',
      lang: 'ar',
    });

    assert.ok(email.subject.includes('852963') && email.subject.includes('كود تفعيل حسابك'));
    assert.ok(email.html.includes('dir="rtl"'));
    assert.ok(email.html.includes('lang="ar"'));
    assert.ok(email.html.includes('تأكيد وتفعيل الحساب'));
    assert.ok(email.html.includes('852963'));
    assert.ok(email.html.includes('تأكيد وتفعيل الحساب مباشرة'));
    assert.ok(email.text.includes('852963'));
    assert.ok(email.text.includes('كود تفعيل حسابك'));
  });

  it('builds account confirmation email in English with proper LTR and copy', () => {
    const email = buildAccountConfirmationEmail({
      userName: 'John Doe',
      confirmUrl: 'https://bynkcom.com/auth/confirm?token=123',
      otpCode: '852963',
      lang: 'en',
    });

    assert.ok(email.subject.includes('852963') && email.subject.includes('Your Verification Code'));
    assert.ok(email.html.includes('dir="ltr"'));
    assert.ok(email.html.includes('lang="en"'));
    assert.ok(email.html.includes('Confirm & Activate Your Account'));
    assert.ok(email.html.includes('852963'));
    assert.ok(email.html.includes('Confirm & Activate Account'));
    assert.ok(email.text.includes('852963'));
    assert.ok(email.text.includes('Your verification code is:'));
  });

  it('builds password reset email in Arabic with proper RTL and copy', () => {
    const email = buildPasswordResetEmail({
      resetUrl: 'https://bynkcom.com/reset-password?token=abc',
      otpCode: '456789',
      lang: 'ar',
    });

    assert.ok(email.subject.includes('456789') && email.subject.includes('كود إعادة تعيين كلمة المرور'));
    assert.ok(email.html.includes('dir="rtl"'));
    assert.ok(email.html.includes('lang="ar"'));
    assert.ok(email.html.includes('طلب إعادة تعيين كلمة المرور'));
    assert.ok(email.html.includes('تعيين كلمة مرور جديدة'));
    assert.ok(email.text.includes('456789'));
  });

  it('builds password reset email in English with proper LTR and copy', () => {
    const email = buildPasswordResetEmail({
      resetUrl: 'https://bynkcom.com/reset-password?token=abc',
      otpCode: '456789',
      lang: 'en',
    });

    assert.ok(email.subject.includes('456789') && email.subject.includes('Password Reset Code'));
    assert.ok(email.html.includes('dir="ltr"'));
    assert.ok(email.html.includes('lang="en"'));
    assert.ok(email.html.includes('Password Reset Request'));
    assert.ok(email.html.includes('Set New Password'));
    assert.ok(email.text.includes('456789'));
  });

  it('builds captain contract email in Arabic and English', () => {
    const emailAr = buildCaptainContractEmail({
      captainName: 'كريم أحمد',
      contractHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      acceptedAt: '2026-11-14T14:30:00Z',
      lang: 'ar',
    });

    assert.ok(emailAr.subject.includes('وثيقة عقد اشتراك الكابتن'));
    assert.ok(emailAr.html.includes('dir="rtl"'));
    assert.ok(emailAr.html.includes('كابتن معلن مستقل'));
    assert.ok(emailAr.html.includes('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'));

    const emailEn = buildCaptainContractEmail({
      captainName: 'Karim Ahmed',
      contractHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      acceptedAt: '2026-11-14T14:30:00Z',
      lang: 'en',
    });

    assert.ok(emailEn.subject.includes('Certified Captain Advertiser Agreement'));
    assert.ok(emailEn.html.includes('dir="ltr"'));
    assert.ok(emailEn.html.includes('Independent Captain Advertiser'));
    assert.ok(emailEn.html.includes('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'));
  });
});
