/**
 * Dynamic Notification Matcher: Wallet, Top-Ups, Receipts & Cash Deposits.
 */

import {
  DynamicNotificationMatch,
  hasArabicScript,
  normalizeCurrency,
  translateKnownReceiptRejectionReason,
} from './notification-i18n-types';

export function matchDynamicWalletNotification(
  t: string,
  d: string
): DynamicNotificationMatch | null {
  // 18. Recharge Receipt Rejected
  if (t.includes('رفض إيصال الشحن') || t.includes('تعذر اعتماد إيصال الشحن') || t.includes('تعذر قبول إيصال الشحن')) {
    const reasonMatch =
      d.match(/للأسباب التالية:\s*(.+?)\.\s*يرجى مراجعة الإدارة/) ||
      d.match(/للسبب التالي:\s*(.+?)\.\s*يمكنك إعادة إرسال/);
    const rawReason = reasonMatch ? reasonMatch[1].trim() : '';
    const translatedReason = rawReason ? translateKnownReceiptRejectionReason(rawReason) : null;

    if (!d) {
      return {
        titleAr: 'تم رفض إيصال الشحن ❌',
        descriptionAr: 'تم رفض إيصال الشحن من قبل الإدارة. يرجى مراجعة التفاصيل وإعادة المحاولة.',
        titleEn: 'Recharge Receipt Rejected ❌',
        descriptionEn: 'Your recharge receipt was rejected by administration. Please verify details and retry.',
        matched: true,
      };
    }

    if (translatedReason) {
      return {
        titleAr: t,
        descriptionAr: d,
        titleEn: 'Notice: Recharge Receipt Not Approved ⚠️',
        descriptionEn: `Your recharge receipt was rejected for the following reason: ${translatedReason} Please contact support or resubmit a clear receipt.`,
        matched: true,
      };
    }

    return {
      titleAr: t,
      descriptionAr: d,
      titleEn: 'Notice: Recharge Receipt Not Approved ⚠️',
      descriptionEn: d,
      matched: true,
      titleMatched: true,
      descriptionMatched: !hasArabicScript(d),
    };
  }

  // 19. Recharge Receipt Approved
  if (
    (t.includes('اعتماد إيصال الشحن') || t.includes('الموافقة على إيصال')) &&
    !t.includes('تعذر') &&
    !t.includes('رفض')
  ) {
    const minMatch = d.match(/تغذية حسابك بـ\s*(\d+)\s*دقيقة/);
    const cashMatch = d.match(/إيداع\s*([\d.]+)\s*([^\s]+)?\s*في رصيد/);

    if (minMatch) {
      const minutes = minMatch[1];
      return {
        titleAr: 'تم اعتماد إيصال الشحن بنجاح ⚡',
        descriptionAr: `تمت الموافقة على إيصالك وتغذية حسابك بـ ${minutes} دقيقة.`,
        titleEn: 'Recharge Receipt Approved Successfully ⚡',
        descriptionEn: `Your receipt was approved and ${minutes} minutes have been credited to your account.`,
        matched: true,
      };
    }
    if (cashMatch) {
      const amount = cashMatch[1];
      const cur = cashMatch[2] || 'د.أ';
      const hasRadarAllocHint = d.includes('تخصيص الرصيد لدقائق رادار');
      return {
        titleAr: t.includes('💰') ? 'تم اعتماد إيصال الشحن بنجاح 💰' : 'تم اعتماد إيصال الشحن بنجاح ⚡',
        descriptionAr: d || `تمت الموافقة على إيصالك وإيداع ${amount} ${cur} في رصيد محفظتك.`,
        titleEn: t.includes('💰') ? 'Recharge Receipt Approved Successfully 💰' : 'Recharge Receipt Approved Successfully ⚡',
        descriptionEn: hasRadarAllocHint
          ? `Your receipt was approved and ${amount} ${normalizeCurrency(cur, 'en')} was deposited into your wallet. You can allocate this balance to radar minutes anytime.`
          : `Your receipt was approved and ${amount} ${normalizeCurrency(cur, 'en')} has been deposited into your wallet.`,
        matched: true,
      };
    }

    return {
      titleAr: 'تم اعتماد إيصال الشحن بنجاح ⚡',
      descriptionAr: d || 'تمت الموافقة على إيصال الشحن وتحديث رصيد حسابك بنجاح.',
      titleEn: 'Recharge Receipt Approved Successfully ⚡',
      descriptionEn: 'Your recharge receipt was approved and your balance has been updated.',
      matched: true,
    };
  }

  // 20. Direct Top-Up from Administration
  if (t.includes('شحن رصيد من الإدارة')) {
    const cashMatch = d.match(/([+-]?[\d.]+)\s*(د\.أ|ج\.م|EGP|JOD)/);
    const minsMatch = d.match(/([+-]?\d+)\s*دقيقة/);
    const parts: string[] = [];
    if (cashMatch) {
      parts.push(`${cashMatch[1]} ${normalizeCurrency(cashMatch[2], 'en')}`);
    }
    if (minsMatch) {
      parts.push(`${minsMatch[1]} radar minutes`);
    }
    return {
      titleAr: 'شحن رصيد من الإدارة ⚡',
      descriptionAr: d,
      titleEn: 'Balance Top-Up from Administration ⚡',
      descriptionEn:
        parts.length > 0
          ? `Your account has been credited by administration: ${parts.join(' ')}.`
          : 'Your account balance has been credited by system administration.',
      matched: true,
    };
  }

  // 21. Bulk & Individual Radar Minutes Recharged
  if (t.includes('شحن دقائق رادار جماعي') || t.includes('شحن رصيد دقائق') || t.includes('شحن دقائق')) {
    const minMatch = d.match(/(\d+)\s*دقيقة/);
    const daysMatch = d.match(/لـ\s*(\d+)\s*يوماً/);
    const minutes = minMatch ? minMatch[1] : '';
    const days = daysMatch ? daysMatch[1] : '';
    const isBulk = t.includes('جماعي');

    return {
      titleAr: t,
      descriptionAr: d || (minutes ? `تم شحن (${minutes}) دقيقة للحساب بنجاح.` : ''),
      titleEn: isBulk ? 'Bulk Radar Minutes Top-Up ⚡' : 'Radar Minutes Recharged ⚡',
      descriptionEn: minutes
        ? days
          ? `Successfully credited (${minutes}) radar minutes to your account by administration and extended validity for ${days} days.`
          : `Successfully credited (${minutes}) radar minutes to your account by administration. Ready to use now!`
        : 'Radar minutes have been credited to your account by administration.',
      matched: true,
    };
  }

  // 22. Wallet Cash Deposit (Individual or Bulk)
  if (t.includes('إيداع نقدي') || t.includes('إيداع رصيد نقدي') || t.includes('إيداع رصيد')) {
    const amountMatch = d.match(/مبلغ\s*\(([^)]+)\)/);
    const balMatch = d.match(/الرصيد المالي الحالي:\s*([\d.]+)/);
    const amountStr = amountMatch ? amountMatch[1].trim() : '';
    const balanceStr = balMatch ? balMatch[1].trim() : '';

    return {
      titleAr: t,
      descriptionAr: d || 'تم إيداع رصيد نقدي في محفظتك بنجاح من قبل الإدارة.',
      titleEn: 'Wallet Cash Deposit 💰',
      descriptionEn: amountStr
        ? balanceStr
          ? `An amount of (${amountStr}) was deposited into your wallet by administration. Current cash balance: ${balanceStr}.`
          : `An amount of (${amountStr}) was deposited into your wallet by administration.`
        : 'Cash credit has been deposited into your wallet by administration.',
      matched: true,
    };
  }

  return null;
}
