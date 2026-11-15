import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCaptainCurrency, type CaptainUser } from '@/features/admin/types/driver-management';

describe('drivers-management types & currency calculations', () => {
  it('correctly resolves currency based on wallet currency_code and phone country', () => {
    const jordanCaptain: Partial<CaptainUser> = {
      phone: '+962791112233',
      wallet: {
        currency_code: 'JOD',
        balance: 10,
        paid_minutes_remaining: 60,
        bonus_minutes_remaining: 0,
        total_minutes: 60,
        active_package_name: null,
        time_bundle_expires_at: null,
      },
    };

    const egyptCaptain: Partial<CaptainUser> = {
      phone: '+201011122334',
      wallet: {
        currency_code: 'EGP',
        balance: 50,
        paid_minutes_remaining: 120,
        bonus_minutes_remaining: 0,
        total_minutes: 120,
        active_package_name: null,
        time_bundle_expires_at: null,
      },
    };

    assert.equal(getCaptainCurrency(jordanCaptain as CaptainUser, true), 'د.أ');
    assert.equal(getCaptainCurrency(jordanCaptain as CaptainUser, false), 'JOD');
    assert.equal(getCaptainCurrency(egyptCaptain as CaptainUser, true), 'ج.م');
    assert.equal(getCaptainCurrency(egyptCaptain as CaptainUser, false), 'EGP');
  });

  it('validates CaptainUser data structure and vehicle specs', () => {
    const captain: CaptainUser = {
      id: 'cap-001',
      serial_id: 'C-001',
      full_name: 'كابتن أحمد الأردني',
      phone: '+962788889900',
      email: 'ahmed@example.com',
      role: 'CAPTAIN',
      status: 'ACTIVE',
      tier: 'PLATINUM',
      rating: 4.95,
      rating_count: 85,
      heart_count: 42,
      penalty_count: 0,
      trust_score: 4.9,
      governorate: 'عمان',
      district: 'تلاع العلي',
      created_at: '2026-01-15T00:00:00Z',
      vehicle: {
        brand: 'Toyota',
        model: 'Prius',
        year: 2022,
        color: 'White',
        plate: '24-12345',
        type: 'SEDAN',
        affiliation_type: 'independent',
        office_phone: '',
        side_id: '',
      },
      verification_status: 'APPROVED',
      documents: {
        identity_url: 'https://storage.example.com/id.jpg',
        driving_license_url: 'https://storage.example.com/license.jpg',
        vehicle_registration_url: null,
        criminal_record_url: null,
      },
      wallet: {
        balance: 15.0,
        paid_minutes_remaining: 180,
        bonus_minutes_remaining: 60,
        total_minutes: 240,
        active_package_name: 'Standard Gold',
        time_bundle_expires_at: '2026-03-01T00:00:00Z',
        currency_code: 'JOD',
      },
    };

    assert.equal(captain.status, 'ACTIVE');
    assert.equal(captain.tier, 'PLATINUM');
    assert.equal(captain.verification_status, 'APPROVED');
    assert.equal(captain.wallet.total_minutes, 240);
  });
});

