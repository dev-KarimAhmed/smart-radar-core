import assert from 'node:assert/strict';
import {
  buildRiderSignUpMetadata,
  mapSupabaseAuthError,
  normalizeInternationalPhone,
  validatePhoneAndPassword,
} from './supabase-auth';

assert.equal(normalizeInternationalPhone('+962 79 000 0000'), '+962790000000');
assert.equal(validatePhoneAndPassword('+962790000000', '123').ok, false);

assert.equal(
  mapSupabaseAuthError({ code: 'phone_exists', message: 'User already registered' }),
  'Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ù…Ø³Ø¬Ù„ Ø¨Ø§Ù„ÙØ¹Ù„ØŒ ÙŠØ±Ø¬Ù‰ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„.',
);

assert.equal(
  mapSupabaseAuthError({ code: 'invalid_credentials', message: 'Invalid login credentials' }),
  'Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ø£Ùˆ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± ØµØ­ÙŠØ­Ø©.',
);

assert.equal(
  mapSupabaseAuthError({ code: 'otp_expired', message: 'Token has expired or is invalid' }),
  'Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚ ØºÙŠØ± ØµØ­ÙŠØ­ Ø£Ùˆ Ø§Ù†ØªÙ‡Øª ØµÙ„Ø§Ø­ÙŠØªÙ‡.',
);

assert.equal(
  mapSupabaseAuthError({ code: 'unexpected_failure', status: 500, message: 'Database error saving new user' }),
  'ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨ Ù…Ù† Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª. ÙŠØ±Ø¬Ù‰ Ù…Ø±Ø§Ø¬Ø¹Ø© Ø¯Ø§Ù„Ø© Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø´Ø®ØµÙŠ ÙÙŠ Supabase Ø«Ù… Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.',
);

assert.equal(
  mapSupabaseAuthError({ code: 'unexpected_failure', status: 500, message: 'foreign key country_id district_id' }),
  'تعذر إنشاء الحساب لأن الدولة أو المحافظة أو المنطقة غير موجودة في قاعدة البيانات. حدّث الاختيارات ثم حاول مرة أخرى.',
);

assert.equal(
  mapSupabaseAuthError({ code: 'phone_provider_disabled', message: 'Phone provider disabled' }),
  'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ù‡Ø§ØªÙ ØºÙŠØ± Ù…ÙØ¹Ù‘Ù„ Ø­Ø§Ù„ÙŠØ§Ù‹ ÙÙŠ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø®Ø¯Ù…Ø©. ÙŠØ±Ø¬Ù‰ ØªÙØ¹ÙŠÙ„Ù‡ Ù…Ù† Supabase.',
);

assert.deepEqual(
  buildRiderSignUpMetadata({
    phone: '+962 79 000 0000',
    password: '123456',
    fullName: ' Demo Rider ',
    countryId: 2,
    governorateId: 1,
    districtId: 9,
  }),
  {
    role: 'RIDER',
    full_name: 'Demo Rider',
    phone: '+962790000000',
    country_id: 2,
    governorate_id: 1,
    district_id: 9,
  },
);

assert.throws(
  () =>
    buildRiderSignUpMetadata({
      phone: '+962790000000',
      password: '123456',
      fullName: 'Demo Rider',
      countryId: 2,
      governorateId: 0,
      districtId: 9,
    }),
  /governorate_id/,
);

console.log('supabase auth mapping checks passed');
