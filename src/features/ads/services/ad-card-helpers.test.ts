import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAdCta,
  getAdDescription,
  getAdTitle,
} from './ad-card-helpers';
import { CAPTAIN_SECTOR_ADS } from '../config/captain-sector-ads';

test('getAdTitle returns language-appropriate title', () => {
  const ad = {
    title: 'عنوان بالعربي',
    titleEn: 'Title in English',
  };

  assert.equal(getAdTitle(ad, 'Fallback', 'ar'), 'عنوان بالعربي');
  assert.equal(getAdTitle(ad, 'Fallback', 'en'), 'Title in English');
  assert.equal(getAdTitle({ title: 'فقط عربي' }, 'Fallback', 'en'), 'فقط عربي');
  assert.equal(getAdTitle({}, 'Fallback', 'en'), 'Fallback');
});

test('getAdDescription returns language-appropriate description', () => {
  const ad = {
    description: 'وصف بالعربي',
    descriptionEn: 'Description in English',
  };

  assert.equal(getAdDescription(ad, 'Fallback', 'ar'), 'وصف بالعربي');
  assert.equal(getAdDescription(ad, 'Fallback', 'en'), 'Description in English');
});

test('getAdCta returns language-appropriate action text', () => {
  const ad = {
    buttonText: 'زر بالعربي',
    buttonTextEn: 'Button in English',
  };

  assert.equal(getAdCta(ad, 'Fallback', 'ar'), 'زر بالعربي');
  assert.equal(getAdCta(ad, 'Fallback', 'en'), 'Button in English');
});

test('CAPTAIN_SECTOR_ADS contains complete bilingual copy for all 5 ads', () => {
  assert.equal(CAPTAIN_SECTOR_ADS.length, 5);

  for (const ad of CAPTAIN_SECTOR_ADS) {
    assert.ok(ad.title && ad.title.length > 0, `Ad ${ad.id} missing Arabic title`);
    assert.ok(ad.titleEn && ad.titleEn.length > 0, `Ad ${ad.id} missing English title`);
    assert.ok(ad.description && ad.description.length > 0, `Ad ${ad.id} missing Arabic description`);
    assert.ok(ad.descriptionEn && ad.descriptionEn.length > 0, `Ad ${ad.id} missing English description`);
    assert.ok(ad.buttonText && ad.buttonText.length > 0, `Ad ${ad.id} missing Arabic buttonText`);
    assert.ok(ad.buttonTextEn && ad.buttonTextEn.length > 0, `Ad ${ad.id} missing English buttonText`);
    assert.ok(ad.badgeText && ad.badgeText.length > 0, `Ad ${ad.id} missing Arabic badgeText`);
    assert.ok(ad.badgeTextEn && ad.badgeTextEn.length > 0, `Ad ${ad.id} missing English badgeText`);
  }
});
