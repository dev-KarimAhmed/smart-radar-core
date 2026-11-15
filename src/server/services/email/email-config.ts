import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Resend } from 'resend';

export type EmailLanguage = 'ar' | 'en';

export const DEFAULT_RESEND_FROM_EMAIL_AR = 'بينكم - bynkcom <noreply@bynkcom.com>';
export const DEFAULT_RESEND_FROM_EMAIL_EN = 'Bynkcom <noreply@bynkcom.com>';
export const DEFAULT_RESEND_FROM_EMAIL = DEFAULT_RESEND_FROM_EMAIL_AR;

export function resolveEmailLanguage(params: {
  explicitLang?: string | null;
  profileLang?: string | null;
  cookieHeader?: string | null;
  customHeader?: string | null;
  acceptLanguage?: string | null;
}): EmailLanguage {
  // 1. Explicit language requested
  if (params.explicitLang) {
    const l = params.explicitLang.trim().toLowerCase();
    if (l === 'en' || l === 'ar') return l;
  }

  // 2. Profile or user record language
  if (params.profileLang) {
    const l = params.profileLang.trim().toLowerCase();
    if (l === 'en' || l === 'ar') return l;
  }

  // 3. NEXT_LOCALE cookie from client session
  if (params.cookieHeader) {
    const match = params.cookieHeader.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
    if (match) {
      const val = decodeURIComponent(match[1]).trim().toLowerCase();
      if (val === 'en' || val === 'ar') return val;
    }
  }

  // 4. Custom dashboard language header
  if (params.customHeader) {
    const l = params.customHeader.trim().toLowerCase();
    if (l === 'en' || l === 'ar') return l;
  }

  // 5. Accept-Language header
  if (params.acceptLanguage) {
    const l = params.acceptLanguage.trim().toLowerCase();
    if (l.startsWith('en')) return 'en';
  }

  return 'ar';
}

export function getSenderFromEmail(lang: EmailLanguage = 'ar'): string {
  try {
    const envLocalPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const parsed = dotenv.parse(fs.readFileSync(envLocalPath, 'utf8'));
      if (parsed.RESEND_FROM_EMAIL?.trim()) {
        const candidate = parsed.RESEND_FROM_EMAIL.trim();
        if (!candidate.includes('الرادار') && !candidate.includes('Radar')) {
          return candidate;
        }
      }
    }
  } catch {
    // ignore
  }

  const envFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (envFrom && !envFrom.includes('الرادار') && !envFrom.includes('Radar')) {
    return envFrom;
  }

  return lang === 'en' ? DEFAULT_RESEND_FROM_EMAIL_EN : DEFAULT_RESEND_FROM_EMAIL_AR;
}

export function getResendClient(): Resend | null {
  let apiKey = '';
  try {
    const envLocalPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const parsed = dotenv.parse(fs.readFileSync(envLocalPath, 'utf8'));
      if (parsed.RESEND_API_KEY?.trim()) {
        apiKey = parsed.RESEND_API_KEY.trim();
        process.env.RESEND_API_KEY = apiKey;
      }
      if (parsed.RESEND_FROM_EMAIL?.trim()) {
        const candidate = parsed.RESEND_FROM_EMAIL.trim();
        if (!candidate.includes('الرادار') && !candidate.includes('Radar')) {
          process.env.RESEND_FROM_EMAIL = candidate;
        } else {
          process.env.RESEND_FROM_EMAIL = DEFAULT_RESEND_FROM_EMAIL;
        }
      }
    }
  } catch {
    // ignore
  }

  if (!apiKey) {
    apiKey = process.env.RESEND_API_KEY?.trim() || '';
  }

  if (!apiKey || !apiKey.startsWith('re_')) {
    return null;
  }
  return new Resend(apiKey);
}
