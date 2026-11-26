import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRIMARY_SOVEREIGN_ADMIN_ID,
  PRIMARY_SOVEREIGN_ADMIN_PHONE,
} from '../types/admin-profile';
import {
  ALL_SECTOR_IDS,
  ALL_SUB_PERMISSION_IDS,
  ADMIN_SECTORS,
  encodeAdminScopeAndPermsIntoAudit,
  getAdminAllowedPermissions,
  getAdminAllowedSectors,
  getAdminGeoScope,
  getSubPermissionsForSector,
  hasAdminPermission,
  isEntityWithinGeoScope,
} from '../lib/admin-permissions';

describe('admins-management constants & permissions', () => {
  it('defines valid primary sovereign admin credentials', () => {
    assert.equal(PRIMARY_SOVEREIGN_ADMIN_ID, '70b4a26f-10ac-4888-8df6-c3a5ad824b8a');
    assert.equal(PRIMARY_SOVEREIGN_ADMIN_PHONE, '+201551981922');
  });

  it('contains complete sector and granular sub-permission definitions', () => {
    assert.ok(ALL_SECTOR_IDS.length >= 6);
    assert.ok(ADMIN_SECTORS.length >= 6);
    for (const sector of ADMIN_SECTORS) {
      assert.ok(sector.id);
      assert.ok(sector.labelAr);
      assert.ok(sector.labelEn);
      assert.ok(ALL_SECTOR_IDS.includes(sector.id));
      const subPerms = getSubPermissionsForSector(sector.id);
      assert.ok(subPerms.length >= 1, `Expected sub-permissions for ${sector.id}`);
    }
  });

  it('encodes and decodes granular sub-permissions and geographic scope via audit log', () => {
    const scope = { countryId: 1, governorateId: 3, districtId: null };
    const perms = ['captains.view', 'captains.topup', 'riders.view'];
    const auditLog = encodeAdminScopeAndPermsIntoAudit(
      ['OTHER_TAG'],
      'RANK_ASSISTANT_ADMIN',
      scope,
      perms
    );

    const mockAssistant = {
      id: 'sub-admin-1',
      phone: '+962791112233',
      admin_rank: 'ASSISTANT_ADMIN',
      allowed_sectors: ['captains', 'riders'],
      rank_audit_log: auditLog,
    };

    assert.deepEqual(getAdminGeoScope(mockAssistant), scope);
    assert.deepEqual(getAdminAllowedPermissions(mockAssistant), perms);
    assert.deepEqual(getAdminAllowedSectors(mockAssistant), ['captains', 'riders']);
    assert.equal(hasAdminPermission(mockAssistant, 'captains.topup'), true);
    assert.equal(hasAdminPermission(mockAssistant, 'captains.security'), false);

    assert.equal(isEntityWithinGeoScope(scope, { country_id: 1, governorate_id: 3, district_id: 12 }), true);
    assert.equal(isEntityWithinGeoScope(scope, { country_id: 1, governorate_id: 4, district_id: 12 }), false);
    assert.equal(isEntityWithinGeoScope(scope, { country_id: 2, governorate_id: 3, district_id: 12 }), false);
  });

  it('grants primary and general admins unrestricted geo scope and all permissions', () => {
    const generalAdmin = {
      id: PRIMARY_SOVEREIGN_ADMIN_ID,
      phone: PRIMARY_SOVEREIGN_ADMIN_PHONE,
    };
    assert.deepEqual(getAdminGeoScope(generalAdmin), {
      countryId: null,
      governorateId: null,
      districtId: null,
    });
    assert.equal(getAdminAllowedPermissions(generalAdmin).length, ALL_SUB_PERMISSION_IDS.length);
    assert.equal(hasAdminPermission(generalAdmin, 'wallet.receipts'), true);
  });
});
