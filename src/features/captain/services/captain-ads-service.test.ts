import assert from 'node:assert/strict';
import {
  CAPTAIN_ADS_CONFIG,
} from '../config/captain-ads-config';
import {
  validateAdCaption,
  validateAdImageFile,
} from './captain-ads-service';

// 1. فحص متغيرات وثوابت التحقق
assert.equal(CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH, 100, 'Max caption length should be 100');
assert.equal(CAPTAIN_ADS_CONFIG.STORY_DURATION_SECONDS, 6, 'Story duration should be 6s');
assert.equal(CAPTAIN_ADS_CONFIG.ALLOW_UNLIMITED_ADS, true, 'Captain can have unlimited ads');
assert.equal(CAPTAIN_ADS_CONFIG.SPEED_DURATIONS.slow, 95, 'Slow speed should be 95s');
assert.equal(CAPTAIN_ADS_CONFIG.SPEED_DURATIONS.normal, 60, 'Normal speed should be 60s');
assert.equal(CAPTAIN_ADS_CONFIG.SPEED_DURATIONS.fast, 32, 'Fast speed should be 32s');

// 2. فحص التحقق من صحة نص الإعلان (Caption validation)
// أ) النص الاختياري مسموح أن يكون فارغاً أو غير محدد
const emptyValidation = validateAdCaption(undefined);
assert.equal(emptyValidation.valid, true, 'Undefined caption is allowed');

const blankValidation = validateAdCaption('');
assert.equal(blankValidation.valid, true, 'Blank caption is allowed');

// ب) نص صالح ضمن الحد (أقل أو يساوي 100 حرف)
const validCaption = 'خدمة توصيل فاخرة وسريعة لجميع مناطق المملكة مع تكييف كامل وواي فاي مجاني';
assert.equal(validCaption.length <= 100, true);
assert.equal(validateAdCaption(validCaption).valid, true, 'Valid caption should pass');

// ج) نص يتجاوز 100 حرف يتم رفضه
const longCaption = 'أ'.repeat(101);
const longValidation = validateAdCaption(longCaption);
assert.equal(longValidation.valid, false, 'Caption over 100 chars must fail');
assert.match(longValidation.error || '', /100/, 'Error message should mention 100 chars');

// 3. فحص التحقق من نوع وحجم ملف الصورة
const mockValidFile = {
  name: 'promo.jpg',
  type: 'image/jpeg',
  size: 1024 * 1024, // 1MB
} as File;
assert.equal(validateAdImageFile(mockValidFile).valid, true, 'Valid image file should pass');

const mockOversizedFile = {
  name: 'huge.png',
  type: 'image/png',
  size: 5 * 1024 * 1024, // 5MB > 3MB limit
} as File;
const sizeValidation = validateAdImageFile(mockOversizedFile);
assert.equal(sizeValidation.valid, false, 'Oversized image file must fail');

const mockInvalidTypeFile = {
  name: 'document.pdf',
  type: 'application/pdf',
  size: 1024,
} as File;
assert.equal(validateAdImageFile(mockInvalidTypeFile).valid, false, 'Non-image file must fail');

console.log('✅ All Captain Ads Service and Validation tests passed successfully!');
