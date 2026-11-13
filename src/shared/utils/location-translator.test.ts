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
  translateArabicDistrict,
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
    const corruptedIrbid = { id: 13, country_id: 1, name_ar: 'اربد', name_en: 'اربد' };
    const corruptedMadaba = { id: 14, country_id: 1, name_ar: 'مادبا', name_en: 'مادبا' };

    assert.equal(resolveLocationLabel(corruptedIrbid, 'en'), 'Irbid');
    assert.equal(resolveLocationLabel(corruptedMadaba, 'en'), 'Madaba');

    assert.equal(resolveLocationLabel(corruptedIrbid, 'ar'), 'إربد');
    assert.equal(resolveLocationLabel(corruptedMadaba, 'ar'), 'مادبا');
  });

  it('deduplicates governorate rows and eliminates duplicate entries', () => {
    const mixedRows = [
      { id: 1, country_id: 1, name_ar: 'عمّان', name_en: 'Amman' },
      { id: 6, country_id: 1, name_ar: 'مادبا', name_en: 'Madaba' },
      { id: 7, country_id: 1, name_ar: 'الكرك', name_en: 'Karak' },
      { id: 13, country_id: 1, name_ar: 'اربد', name_en: 'اربد' },
      { id: 14, country_id: 1, name_ar: 'مادبا', name_en: 'مادبا' },
    ];

    const cleaned = canonicalizeGovernorateRows(mixedRows);
    const madabaRows = cleaned.filter((r) => r.name_en === 'Madaba');
    assert.equal(madabaRows.length, 1);

    const irbidRow = cleaned.find((r) => r.name_ar === 'إربد');
    assert.ok(irbidRow);
    assert.equal(irbidRow?.name_en, 'Irbid');

    assert.equal(cleaned.length, 4);
    assert.deepEqual(
      cleaned.map((r) => r.name_en),
      ['Amman', 'Madaba', 'Karak', 'Irbid']
    );
  });

  it('translates all Maan districts from the user screenshot to pure English', () => {
    const maanDistricts = [
      { id: 201, governorate_id: 8, name_ar: 'لواء قصبة معان', name_en: 'لواء قصبة معان' },
      { id: 202, governorate_id: 8, name_ar: 'لواء البتراء', name_en: 'لواء البتراء' },
      { id: 203, governorate_id: 8, name_ar: 'لواء الشوبك', name_en: 'لواء الشوبك' },
      { id: 204, governorate_id: 8, name_ar: 'لواء الحسينية', name_en: 'لواء الحسينية' },
      { id: 205, governorate_id: 8, name_ar: 'قضاء الجفر', name_en: 'قضاء الجفر' },
      { id: 206, governorate_id: 8, name_ar: 'قضاء مريغة', name_en: 'قضاء مريغة' },
      { id: 207, governorate_id: 8, name_ar: 'قضاء ايل', name_en: 'قضاء ايل' },
      { id: 208, governorate_id: 8, name_ar: 'قضاء اذرح', name_en: 'قضاء اذرح' },
      { id: 999, governorate_id: 8, name_ar: 'الواء', name_en: 'الواء' }, // corrupted dummy row
    ];

    const canonicalDistricts = canonicalizeDistrictRows(maanDistricts);

    // Dummy row must be filtered out
    assert.equal(canonicalDistricts.length, 8);

    assert.equal(resolveDistrictLabel(maanDistricts[0], 'en'), "Ma'an Qasabah District");
    assert.equal(resolveDistrictLabel(maanDistricts[1], 'en'), 'Petra District');
    assert.equal(resolveDistrictLabel(maanDistricts[2], 'en'), 'Shobak District');
    assert.equal(resolveDistrictLabel(maanDistricts[3], 'en'), 'Al Husseiniya District');
    assert.equal(resolveDistrictLabel(maanDistricts[4], 'en'), 'Al Jafr Sub-district');
    assert.equal(resolveDistrictLabel(maanDistricts[5], 'en'), 'Mureigha Sub-district');
    assert.equal(resolveDistrictLabel(maanDistricts[6], 'en'), 'Ayl Sub-district');
    assert.equal(resolveDistrictLabel(maanDistricts[7], 'en'), 'Udhruh Sub-district');

    // Also via resolveLocationLabel
    for (const d of canonicalDistricts) {
      const enLabel = resolveLocationLabel(d, 'en');
      assert.ok(enLabel.length > 0);
      assert.ok(!/[\u0600-\u06FF]/.test(enLabel), `Expected English, got Arabic: ${enLabel}`);
    }
  });

  it('translates Amman, Irbid, Zarqa, Balqa districts properly', () => {
    assert.equal(resolveDistrictLabel('لواء قصبة عمان', 'en'), 'Amman Qasabah District');
    assert.equal(resolveDistrictLabel('لواء الجامعة', 'en'), 'University District');
    assert.equal(resolveDistrictLabel('لواء وادي السير', 'en'), 'Wadi Al Seer District');
    assert.equal(resolveDistrictLabel('لواء قصبة اربد', 'en'), 'Irbid Qasabah District');
    assert.equal(resolveDistrictLabel('لواء الرمثا', 'en'), 'Ramtha District');
    assert.equal(resolveDistrictLabel('لواء قصبة السلط', 'en'), 'Salt Qasabah District');
    assert.equal(resolveDistrictLabel('لواء قصبة الزرقاء', 'en'), 'Zarqa Qasabah District');
    assert.equal(resolveDistrictLabel('لواء الرصيفة', 'en'), 'Russeifa District');
  });

  it('correctly translates Egyptian governorates', () => {
    assert.equal(resolveGovernorateLabel('القاهرة', 'en'), 'Cairo');
    assert.equal(resolveGovernorateLabel('الإسكندرية', 'en'), 'Alexandria');
    assert.equal(resolveGovernorateLabel('Cairo', 'ar'), 'القاهرة');
    assert.equal(resolveGovernorateLabel('Alexandria', 'ar'), 'الإسكندرية');
  });
});
