import { CAPTAIN_ADS_CONFIG } from '../config/captain-ads-config';
import type { AdValidationResult } from './captain-ads-types';

/**
 * التحقق من صحة نص الإعلان (اختياري، ولا يتجاوز الحد الأقصى المحدد)
 */
export function validateAdCaption(caption?: string): AdValidationResult {
  if (!caption) {
    return { valid: true };
  }
  const trimmed = caption.trim();
  if (trimmed.length > CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH) {
    return {
      valid: false,
      error: `نص الإعلان لا يجب أن يتجاوز ${CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH} حرفاً (الحالي: ${trimmed.length})`,
    };
  }
  return { valid: true };
}

/**
 * التحقق من صحة ملف صورة الإعلان
 */
export function validateAdImageFile(file: File): AdValidationResult {
  if (!file) {
    return { valid: false, error: 'يرجى اختيار ملف الصورة' };
  }

  const isTypeAllowed = (CAPTAIN_ADS_CONFIG.ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type);
  if (!isTypeAllowed) {
    return {
      valid: false,
      error: 'نوع الملف غير مدعوم، يرجى رفع صورة بصيغة (JPG, PNG, WEBP)',
    };
  }

  if (file.size > CAPTAIN_ADS_CONFIG.MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (CAPTAIN_ADS_CONFIG.MAX_IMAGE_SIZE_BYTES / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `حجم الصورة كبير جداً، الحد الأقصى هو ${sizeMb} ميجابايت`,
    };
  }

  return { valid: true };
}

/**
 * تحويل ملف الصورة محلياً إلى Base64 Data URL للرفع
 */
export function convertImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image as data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Image read error'));
    reader.readAsDataURL(file);
  });
}

export function normalizeCaptainAdImageUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  if (url.includes('/storage/v1/object/public/captain-documents/')) {
    const path = url.split('/storage/v1/object/public/captain-documents/')[1]?.replace(/^\/+/, '');
    if (path) {
      return `/api/captain/ads/image?bucket=captain-documents&path=${encodeURIComponent(path)}`;
    }
  }
  return url;
}
