import assert from 'node:assert/strict';
import {
  buildRiderSignUpMetadata,
  mapSupabaseAuthError,
  normalizeInternationalPhone,
  validatePhoneAndPassword,
} from './supabase-auth-logic';

assert.equal(normalizeInternationalPhone('+962 79 000 0000'), '+962790000000');
assert.equal(validatePhoneAndPassword('+962790000000', '123').ok, false);

assert.equal(
  mapSupabaseAuthError({ code: 'phone_exists', message: 'User already registered' }),
  'رقم الهاتف مسجل بالفعل، يرجى تسجيل الدخول.',
);

assert.equal(
  mapSupabaseAuthError({ code: 'invalid_credentials', message: 'Invalid login credentials' }),
  'رقم الهاتف أو كلمة المرور غير صحيحة.',
);

assert.equal(
  mapSupabaseAuthError({ code: 'otp_expired', message: 'Token has expired or is invalid' }),
  'رمز التحقق غير صحيح أو انتهت صلاحيته.',
);

assert.equal(
  mapSupabaseAuthError({ code: 'unexpected_failure', status: 500, message: 'Database error saving new user' }),
  'تعذر إنشاء الحساب من قاعدة البيانات. يرجى مراجعة إعدادات الحساب ثم المحاولة مرة أخرى.',
);

assert.equal(
  mapSupabaseAuthError({ code: 'unexpected_failure', status: 500, message: 'foreign key country_id district_id' }),
  'تعذر إنشاء الحساب لأن الدولة أو المحافظة أو المنطقة غير موجودة في قاعدة البيانات. حدّث الاختيارات ثم حاول مرة أخرى.',
);

assert.equal(
  mapSupabaseAuthError({ code: 'phone_provider_disabled', message: 'Phone provider disabled' }),
  'تسجيل الهاتف غير مفعّل حالياً في إعدادات الخدمة.',
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
