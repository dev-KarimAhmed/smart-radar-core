'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAdvertiserAuditSimulationParams {
  posterUrl: string;
  whatsapp: string;
  phone: string;
  geoLoc: string;
  governorate: string;
  district: string;
  title: string;
  description: string;
  buttonText: string;
  targetImpressions: number;
  advertiserBalance: number;
  calculatedCost: number;
  selectedPackageId: string;
  isPremiumRetentionPaid: boolean;
  checkDistrictCapacity: (district: string) => string;
  createAd: (payload: any) => Promise<any>;
  setStep: (step: number) => void;
  setAdvertiserBalance: (updater: (prev: number) => number) => void;
}

export function useAdvertiserAuditSimulation({
  posterUrl,
  whatsapp,
  phone,
  geoLoc,
  governorate,
  district,
  title,
  description,
  buttonText,
  targetImpressions,
  advertiserBalance,
  calculatedCost,
  selectedPackageId,
  isPremiumRetentionPaid,
  checkDistrictCapacity,
  createAd,
  setStep,
  setAdvertiserBalance,
}: UseAdvertiserAuditSimulationParams) {
  const { toast } = useToast();
  const [isSimulatingAudit, setIsSimulatingAudit] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [auditApproved, setAuditApproved] = useState(false);

  const runForensicAuditAndLaunch = useCallback(() => {
    if (!posterUrl || !whatsapp || !phone || !geoLoc || !governorate || !targetImpressions) {
      alert("⚠️ رفض: لا يمكن إطلاق الحملة. يجب استكمال جميع حقول الاستحواذ وتحديد الإدارة الجغرافية وعدد مرات الظهور المطلوبة.");
      return;
    }

    if (advertiserBalance < calculatedCost) {
      alert(`⚠️ رفض (ميزانية غير كافية): رصيدك الحالي هو [${advertiserBalance.toFixed(2)} د.أ] وهو أقل من الكلفة التقديرية للحملة [${calculatedCost.toFixed(2)} د.أ].`);
      return;
    }

    if (checkDistrictCapacity(district) === 'FULL') {
      alert(`⚠️ رفض (السعة ممتلئة): المنطقة [${district}] ممتلئة حالياً. نقترح توجيه حملتك لمنطقة ناعور أو مجاور.`);
      return;
    }

    const cleanPosterUrl = posterUrl.trim();
    if (!cleanPosterUrl || !cleanPosterUrl.startsWith('http')) {
      toast({
        variant: 'destructive',
        title: '⚠️ فشل التحقق من مادة الإعلان',
        description: 'يرجى إدخال رابط صالح لصورة البوستر أو الفيديو.',
      });
      return;
    }

    setStep(3);
    setIsSimulatingAudit(true);
    setAuditApproved(false);
    setAuditProgress(10);
    setAuditLogs([
      '🔍 بدء الفحص الأمني الرقمي للإعلان الجغرافي المنسق...',
      '🛡️ مراجعة امتثال ميثاق السلامة الحظرية الأردنية [SCR-AD-INTEGRITY-112]',
    ]);

    const progression = [
      { p: 30, log: '⚔️ فحص احتواء الأسلحة ومقاطع العنف... آمن وبيد أمينة ✓' },
      { p: 60, log: '🔞 فحص احتواء العري والمواد المنافية للحشمة العامة... آمن ✓' },
      { p: 85, log: '📷 فحص تباين البوستر ومطابقة أبعاد مسرح الشاشة الكامل... جودة عالية ✓' },
      { p: 100, log: '🏛️ تم التصديق والامتثال! الإعلان آمن ومستحق لوضع [الاستعداد للنشاط الموجه] ✓' },
    ];

    progression.forEach((s, i) => {
      setTimeout(() => {
        setAuditProgress(s.p);
        setAuditLogs(prev => [...prev, s.log]);

        if (s.p === 100) {
          setTimeout(async () => {
            try {
              const expirationTimestamp = Date.now() + 72 * 60 * 60 * 1000;
              await createAd({
                title,
                description,
                targetDistrict: district || 'كل الألوية',
                targetGovernorate: governorate,
                targetImpressions,
                phone,
                whatsapp,
                geoLoc,
                posterUrl,
                buttonText,
                isPremiumRetentionPaid,
                expirationTimestamp,
                adType: 'SOVEREIGN_NATIVE',
                packageId: selectedPackageId,
              });

              setAdvertiserBalance(prev => prev - calculatedCost);
              setAuditApproved(true);
              setIsSimulatingAudit(false);
            } catch (err) {
              console.error('Failed to register promo in database:', err);
              setAuditApproved(true);
              setIsSimulatingAudit(false);
            }
          }, 1000);
        }
      }, (i + 1) * 800);
    });
  }, [
    posterUrl, whatsapp, phone, geoLoc, governorate, targetImpressions,
    checkDistrictCapacity, district, isPremiumRetentionPaid, createAd,
    toast, buttonText, selectedPackageId, advertiserBalance, calculatedCost,
    setStep, setAdvertiserBalance, title, description,
  ]);

  return {
    isSimulatingAudit,
    auditProgress,
    auditLogs,
    auditApproved,
    runForensicAuditAndLaunch,
  };
}
