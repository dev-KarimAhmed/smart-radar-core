import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  findCanonicalGovernorate,
  resolveGovernorateLabel,
  resolveDistrictLabel,
  resolveLocationLabel,
  canonicalizeGovernorateRows,
  canonicalizeDistrictRows,
  normalizeArabicText,
} from './location-translator';

describe('location-translator', () => {
  it('normalizes Arabic text stripping diacritics and unifying Alef and Taa Marbuta', () => {
    assert.equal(normalizeArabicText('إربد'), 'اربد');
    assert.equal(normalizeArabicText('مأدبا'), 'مادبا');
    assert.equal(normalizeArabicText('عمّان'), 'عمان');
    assert.equal(normalizeArabicText('الزرقاءُ'), 'الزرقاء');
    assert.equal(normalizeArabicText('الطفيلة'), 'الطفيله');
  });

  it('identifies canonical governorates from Arabic with or without hamza', () => {
    const irbid1 = findCanonicalGovernorate('إربد');
    const irbid2 = findCanonicalGovernorate('اربد');
    assert.equal(irbid1?.key, 'irbid');
    assert.equal(irbid2?.key, 'irbid');
    assert.equal(irbid1?.nameEn, 'Irbid');

    const madaba1 = findCanonicalGovernorate('مادبا');
    const madaba2 = findCanonicalGovernorate('مأدبا');
    assert.equal(madaba1?.key, 'madaba');
    assert.equal(madaba2?.key, 'madaba');
    assert.equal(madaba1?.nameEn, 'Madaba');
  });

  it('corrects governorates where name_en was populated with Arabic text', () => {
    // Simulating row inserted by buggy SQL script
    const corruptedIrbid = { id: 13, country_id: 1, name_ar: 'اربد', name_en: 'اربد' };
    const corruptedMadaba = { id: 14, country_id: 1, name_ar: 'مادبا', name_en: 'مادبا' };

    // In English mode, must return proper English!
    assert.equal(resolveLocationLabel(corruptedIrbid, 'en'), 'Irbid');
    assert.equal(resolveLocationLabel(corruptedMadaba, 'en'), 'Madaba');

    // In Arabic mode, must return proper Arabic!
    assert.equal(resolveLocationLabel(corruptedIrbid, 'ar'), 'إربد');
    assert.equal(resolveLocationLabel(corruptedMadaba, 'ar'), 'مادبا');
  });

  it('deduplicates governorate rows and eliminates duplicate entries', () => {
    const mixedRows = [
      { id: 1, country_id: 1, name_ar: 'عمّان', name_en: 'Amman' },
      { id: 6, country_id: 1, name_ar: 'مادبا', name_en: 'Madaba' },
      { id: 7, country_id: 1, name_ar: 'الكرك', name_en: 'Karak' },
      { id: 13, country_id: 1, name_ar: 'اربد', name_en: 'اربد' }, // Corrupted name_en
      { id: 14, country_id: 1, name_ar: 'مادبا', name_en: 'مادبا' }, // Duplicate of Madaba with corrupted name_en!
    ];

    const cleaned = canonicalizeGovernorateRows(mixedRows);

    // Madaba should appear ONLY ONCE
    const madabaRows = cleaned.filter((r) => r.name_en === 'Madaba');
    assert.equal(madabaRows.length, 1);

    // Irbid should have clean English
    const irbidRow = cleaned.find((r) => r.name_ar === 'إربد');
    assert.ok(irbidRow);
    assert.equal(irbidRow?.name_en, 'Irbid');

    // Total rows must be 4, NOT 5
    assert.equal(cleaned.length, 4);
    assert.deepEqual(
      cleaned.map((r) => r.name_en),
      ['Amman', 'Madaba', 'Karak', 'Irbid']
    );
  });

  it('translates districts with Arabic text in name_en to English', () => {
    const row = { id: 101, governorate_id: 1, name_ar: 'قصبة عمان', name_en: 'قصبة عمان' };
    assert.equal(resolveDistrictLabel(row, 'en'), 'Amman Qasabah');
    assert.equal(resolveDistrictLabel(row, 'ar'), 'قصبة عمّان');

    const canonicalDistricts = canonicalizeDistrictRows([row]);
    assert.equal(canonicalDistricts[0].name_en, 'Amman Qasabah');
  });

  it('correctly translates Egyptian governorates', () => {
    assert.equal(resolveGovernorateLabel('القاهرة', 'en'), 'Cairo');
    assert.equal(resolveGovernorateLabel('الإسكندرية', 'en'), 'Alexandria');
    assert.equal(resolveGovernorateLabel('Cairo', 'ar'), 'القاهرة');
    assert.equal(resolveGovernorateLabel('Alexandria', 'ar'), 'الإسكندرية');
  });
});
