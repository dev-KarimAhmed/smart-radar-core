import assert from 'node:assert/strict';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';

// Mock localStorage for Node test runner
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

const {
  buildCaptainReferralLink,
  storePendingCaptainReferral,
  getPendingCaptainReferral,
  clearPendingCaptainReferral,
} = await import('./captain-referral');

// 1. URL Building
assert.equal(buildCaptainReferralLink('C-1002'), '/register/rider?ref=C-1002');
assert.equal(buildCaptainReferralLink('K-777'), '/register/rider?ref=K-777');
assert.equal(buildCaptainReferralLink('550e8400-e29b-41d4-a716-446655440000'), '/register/rider?ref=550e8400-e29b-41d4-a716-446655440000');

// 2. Storage cycle
clearPendingCaptainReferral();
assert.equal(getPendingCaptainReferral(), null);

storePendingCaptainReferral('C-1002');
assert.equal(getPendingCaptainReferral(), 'C-1002');

storePendingCaptainReferral('  C-9999  ');
assert.equal(getPendingCaptainReferral(), 'C-9999');

clearPendingCaptainReferral();
assert.equal(getPendingCaptainReferral(), null);

console.log('captain referral unit checks passed');
