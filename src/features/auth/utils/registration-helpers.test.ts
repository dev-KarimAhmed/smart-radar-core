import assert from 'node:assert/strict';
import test from 'node:test';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';

const {
  normalizePhoneForCountry,
  toSupabaseAuthRole,
  getDemoPhoneForCountry,
  getLocationLabel,
} = await import('./registration-helpers');

test('normalizePhoneForCountry validates Jordanian and Egyptian numbers', () => {
  const jordanCountry = { id: 1, country_code: 'JO', name_ar: 'الأردن', name_en: 'Jordan' };
  const egyptCountry = { id: 2, country_code: 'EG', name_ar: 'مصر', name_en: 'Egypt' };

  // Jordan
  const resJoIntl = normalizePhoneForCountry('+962791234567', jordanCountry);
  assert.equal(resJoIntl.ok, true);
  if (resJoIntl.ok) assert.equal(resJoIntl.phone, '+962791234567');

  const resJoLocal = normalizePhoneForCountry('0791234567', jordanCountry);
  assert.equal(resJoLocal.ok, true);
  if (resJoLocal.ok) assert.equal(resJoLocal.phone, '+962791234567');

  // Egypt
  const resEgIntl = normalizePhoneForCountry('+201012345678', egyptCountry);
  assert.equal(resEgIntl.ok, true);
  if (resEgIntl.ok) assert.equal(resEgIntl.phone, '+201012345678');

  const resEgLocal = normalizePhoneForCountry('01012345678', egyptCountry);
  assert.equal(resEgLocal.ok, true);
  if (resEgLocal.ok) assert.equal(resEgLocal.phone, '+201012345678');
});

test('normalizePhoneForCountry strictly rejects all Saudi formats', () => {
  const saudiCountry = { id: 3, country_code: 'SA', name_ar: 'السعودية', name_en: 'Saudi Arabia' };

  // +966 prefix
  const res1 = normalizePhoneForCountry('+966501234567', null);
  assert.equal(res1.ok, false);
  assert.match(res1.message, /المملكة العربية السعودية/);

  // 00966 prefix
  const res2 = normalizePhoneForCountry('00966501234567', null);
  assert.equal(res2.ok, false);
  assert.match(res2.message, /المملكة العربية السعودية/);

  // Saudi country object
  const res3 = normalizePhoneForCountry('0501234567', saudiCountry);
  assert.equal(res3.ok, false);
  assert.match(res3.message, /المملكة العربية السعودية/);
});

test('normalizePhoneForCountry safely handles empty or invalid input', () => {
  assert.equal(normalizePhoneForCountry('', null).ok, false);
  assert.equal(normalizePhoneForCountry('   ', null).ok, false);
  assert.equal(normalizePhoneForCountry(undefined as any, null).ok, false);
});

test('toSupabaseAuthRole accurately maps all roles with case insensitivity and fallbacks', () => {
  assert.equal(toSupabaseAuthRole('driver'), 'CAPTAIN');
  assert.equal(toSupabaseAuthRole('captain'), 'CAPTAIN');
  assert.equal(toSupabaseAuthRole('DRIVER'), 'CAPTAIN');
  assert.equal(toSupabaseAuthRole('CAPTAIN'), 'CAPTAIN');

  assert.equal(toSupabaseAuthRole('advertiser'), 'ADVERTISER');
  assert.equal(toSupabaseAuthRole('ADVERTISER'), 'ADVERTISER');

  assert.equal(toSupabaseAuthRole('delegate'), 'DELEGATE');
  assert.equal(toSupabaseAuthRole('DELEGATE'), 'DELEGATE');

  assert.equal(toSupabaseAuthRole('admin'), 'ADMIN');
  assert.equal(toSupabaseAuthRole('ADMIN'), 'ADMIN');

  assert.equal(toSupabaseAuthRole('rider'), 'RIDER');
  assert.equal(toSupabaseAuthRole(null), 'RIDER');
  assert.equal(toSupabaseAuthRole(undefined), 'RIDER');
  assert.equal(toSupabaseAuthRole(''), 'RIDER');
});

test('getDemoPhoneForCountry provides valid defaults without Saudi leakage', () => {
  const saudiCountry = { id: 3, country_code: 'SA', name_ar: 'السعودية', name_en: 'Saudi Arabia' };
  const jordanCountry = { id: 1, country_code: 'JO', name_ar: 'الأردن', name_en: 'Jordan' };

  // Jordan should provide valid Jordan number
  assert.ok(getDemoPhoneForCountry(jordanCountry).startsWith('+962'));

  // Saudi country must NEVER return a Saudi number, must fallback to safe default
  assert.equal(getDemoPhoneForCountry(saudiCountry), '+962790000000');

  // Null/undefined country defaults to Jordan safe default
  assert.equal(getDemoPhoneForCountry(null), '+962790000000');
  assert.equal(getDemoPhoneForCountry(undefined), '+962790000000');
});

test('getLocationLabel returns localized name properly', () => {
  const row = { id: 1, name_ar: 'الأردن', name_en: 'Jordan' };
  assert.equal(getLocationLabel(row, 'ar'), 'الأردن');
  assert.equal(getLocationLabel(row, 'en'), 'Jordan');
});
