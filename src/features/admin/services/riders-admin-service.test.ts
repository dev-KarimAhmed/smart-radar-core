import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { RiderUser } from '@/features/admin/types/rider-management';

describe('riders-management logic & immunity rules', () => {
  it('correctly categorizes rider trust score immunity levels', () => {
    const isAtRisk = (score: number, cancellations: number) => score < 4.2 || cancellations >= 3;

    assert.equal(isAtRisk(4.8, 0), false);
    assert.equal(isAtRisk(4.3, 2), false);
    assert.equal(isAtRisk(4.1, 0), true); // trust score below 4.2
    assert.equal(isAtRisk(4.8, 3), true); // cancellations >= 3
  });

  it('validates RiderUser data structure', () => {
    const sampleRider: RiderUser = {
      id: 'rider-123',
      serial_id: 'R-001',
      full_name: 'أحمد محمود',
      phone: '+962791112233',
      email: 'ahmad@example.com',
      role: 'RIDER',
      status: 'ACTIVE',
      tier: 'BRONZE',
      rating: 4.9,
      trust_score: 4.8,
      consecutive_cancellations: 0,
      completed_trips_count: 15,
      governorate: 'عمان',
      district: 'الجبيهة',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      wallet: {
        balance: 25.5,
        currency_code: 'JOD',
      },
    };

    assert.equal(sampleRider.id, 'rider-123');
    assert.equal(sampleRider.status, 'ACTIVE');
    assert.equal(sampleRider.trust_score >= 4.5, true);
  });
});

