import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  maskEmail,
  copy,
  authCopy,
  roleLabels,
  authRoleLabels,
} from './personal-step.copy';

describe('personal-step.copy & maskEmail', () => {
  it('masks email properly for privacy', () => {
    assert.equal(maskEmail(''), '');
    assert.equal(maskEmail(null), '');
    assert.equal(maskEmail('invalid-email'), 'invalid-email');
    assert.equal(maskEmail('ab@test.com'), '**@test.com');
    assert.equal(maskEmail('ahmed@example.com'), 'a****d@example.com');
  });

  it('provides bilingual copy for both Arabic and English', () => {
    assert.ok(authCopy.ar.registerTitle);
    assert.ok(authCopy.en.registerTitle);
    assert.ok(copy.ar.brand);
    assert.ok(copy.en.brand);
  });

  it('covers all role labels in both languages', () => {
    const roles = ['rider', 'driver', 'advertiser', 'delegate', 'admin'] as const;
    for (const role of roles) {
      assert.ok(roleLabels[role].ar);
      assert.ok(roleLabels[role].en);
      assert.ok(authRoleLabels[role].ar);
      assert.ok(authRoleLabels[role].en);
    }
  });
});
