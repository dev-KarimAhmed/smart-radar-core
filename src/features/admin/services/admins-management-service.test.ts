import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRIMARY_SOVEREIGN_ADMIN_ID,
  PRIMARY_SOVEREIGN_ADMIN_PHONE,
} from '../types/admin-profile';
import {
  ALL_SECTOR_IDS,
  ADMIN_SECTORS,
} from '../lib/admin-permissions';

describe('admins-management constants & permissions', () => {
  it('defines valid primary sovereign admin credentials', () => {
    assert.equal(PRIMARY_SOVEREIGN_ADMIN_ID, '70b4a26f-10ac-4888-8df6-c3a5ad824b8a');
    assert.equal(PRIMARY_SOVEREIGN_ADMIN_PHONE, '+201551981922');
  });

  it('contains complete sector definitions for admin role permissions', () => {
    assert.ok(ALL_SECTOR_IDS.length >= 6);
    assert.ok(ADMIN_SECTORS.length >= 6);
    for (const sector of ADMIN_SECTORS) {
      assert.ok(sector.id);
      assert.ok(sector.labelAr);
      assert.ok(sector.labelEn);
      assert.ok(ALL_SECTOR_IDS.includes(sector.id));
    }
  });
});

