// [SCR-TIME-KERNEL-108] محرك تجميد الوقت والتحكم بالرصيد النسيجي والساعات الإضافية

export interface SovereignTimeWallet {
  captainId: string;
  paidHoursRemaining: number;   // الساعات المدفوعة المتبقية (بالدقائق)
  bonusHoursRemaining: number;  // ساعات البونص الممنوحة من الرتب
  isRadarActive: boolean;       // هل قمرة العمليات نشطة وبث العروض مفتوح؟
  lastTickTimestamp: number;    // آخر توقيت تم تحديث العداد فيه
}

export const RadarTimeSubscriptionKernel = {
  // الثوابت الدستورية المقفلة
  CONFIG: Object.freeze({
    TICK_INTERVAL_MS: 60000, // حساب الوقت بدقة الدقيقة (كل 60 ثانية نبضة محلياً)
  }),

  /**
   * محرك النبض الزمني المحلي (يعمل في الـ Service Worker كخلفية صامتة)
   * يتم استهلاكه فقط عندما تكون قمرة العمليات نشطة (isRadarActive === true)
   */
  processLocalTimeTick: function(wallet: SovereignTimeWallet, nowOverride?: number): { updatedWallet: SovereignTimeWallet; triggerSync: boolean } {
    if (!wallet.isRadarActive) {
      // المادة (2): النظام في وضع الاستراحة، الوقت متجمد كلياً وصفر كلفة
      return { updatedWallet: { ...wallet }, triggerSync: false };
    }

    const now = nowOverride || Date.now();
    // احتساب الدقائق المستهلكة فعلياً منذ آخر نشاط
    const minutesElapsed = Math.floor((now - wallet.lastTickTimestamp) / this.CONFIG.TICK_INTERVAL_MS);

    if (minutesElapsed >= 1) {
      const updated = { ...wallet };
      let remainingToDeduct = minutesElapsed;

      // المادة (5): استهلاك ساعات البونص أولاً لحماية رصيده المدفوع، أو حسب رغبته
      if (updated.bonusHoursRemaining > 0) {
        const bonusDeduction = Math.min(updated.bonusHoursRemaining, remainingToDeduct);
        updated.bonusHoursRemaining -= bonusDeduction;
        remainingToDeduct -= bonusDeduction;
      }

      // استهلاك الساعات المدفوعة إذا انتهى البونص
      if (remainingToDeduct > 0) {
        updated.paidHoursRemaining = Math.max(0, updated.paidHoursRemaining - remainingToDeduct);
      }

      updated.lastTickTimestamp = now;

      // إذا نفدت الساعات بالكامل، يتم قفل الكود فوراً وإخراج السائق من صالة المزاد آلياً
      if (updated.paidHoursRemaining === 0 && updated.bonusHoursRemaining === 0) {
        updated.isRadarActive = false;
        console.log("🚫 بروتوكول الحظر الصامت: نفد رصيد الساعات، تم إيقاف قمرة العمليات.");
      }

      // تحديث السيرفر بنبضة مجمعة واحدة فقط عند الحاجه (تقليل فواتير Firebase)
      return { updatedWallet: updated, triggerSync: true };
    }

    return { updatedWallet: { ...wallet }, triggerSync: false };
  }
};

Object.freeze(RadarTimeSubscriptionKernel);
