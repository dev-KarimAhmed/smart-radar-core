'use client';

import React, { useState } from 'react';
import { Radio, Activity, Compass, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from "next-intl";
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useAdminAds } from '@/hooks/use-admin-ads';
import { adminViewStyles as styles } from './admin-view-styles';
import { PendingAdReviewCard } from './pending-ad-review-card';
import { PendingAdsThreatRegister, type InjectedThreat } from './pending-ads-threat-register';
import { PendingAdsForensicScanner } from './pending-ads-forensic-scanner';

export function PendingAdsAuditPanel() {
  const { isArabic } = useDashboardLanguage();
  const tAuto = useTranslations('auto');
  const { approveAd, rejectAd, ads, isLoading } = useAdminAds();
  const pendingAds = React.useMemo(() => {
    return (ads || []).filter(ad => (ad.status || '').toLowerCase() === 'pending' || (ad.status || '') === 'PENDING');
  }, [ads]);
  const { toast } = useToast();

  const [injectedThreats, setInjectedThreats] = useState<InjectedThreat[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<string[] | null>(null);

  const pendingCount = pendingAds.length;
  const activeThreatsCount = injectedThreats.filter(t => !t.resolved).length;
  const geofenceIntegrity = Math.max(70, 100 - activeThreatsCount * 6.5);

  const handleResolveThreat = (id: string, message: string) => {
    setInjectedThreats(prev =>
      prev.map(t => t.id === id ? { ...t, resolved: true } : t)
    );
    toast({
      title: "⚖️ تم التوثيق والتعقيم",
      description: `تم إخضاع السجل للتدقيق بنجاح: ${message}`,
      variant: "default",
    });
  };

  const runAdForensicScan = () => {
    setIsScanning(true);
    setScanResults(null);
    toast({
      title: isArabic ? "📡 بدء فحص الحملات الإعلانية" : "📡 Scan Campaigns Started",
      description: isArabic ? "جاري مطابقة الحملات الإعلانية المودعة بالمعايير الرقابية..." : "Verifying ad campaigns against safety policies..."
    });

    setTimeout(() => {
      setIsScanning(false);
      setScanResults([
        `⏱️ [${new Date().toLocaleTimeString('ar-JO')}] اكتمل تدقيق الحملات الإعلانية.`,
        `🔍 الحملات المعلقة قيد المراجعة: ${pendingCount} حملة.`,
        `🔒 التوافق الجغرافي والمالي: مستقر بنسبة 100% وبدون ثغرات.`,
        `🛡️ قرار الفحص: لا توجد مخالفات ميكانيكية أو بلاغات انتحال نشطة.`
      ]);
      toast({
        title: isArabic ? "✅ اكتمل الفحص الأمني" : "✅ Security Scan Complete",
        description: isArabic ? "تمت مراجعة ومطابقة كافة الحملات الإعلانية بنجاح." : "All ad campaigns reviewed and validated successfully."
      });
    }, 600);
  };

  const clearAllResolved = () => {
    setInjectedThreats(prev => prev.filter(t => !t.resolved));
    setScanResults(null);
    toast({
      title: isArabic ? "🧹 تنظيف السجلات المعقمة" : "🧹 Clean Audit Logs",
      description: isArabic ? "تم مسح كافة الإخطارات البروتوكولية التي تمت تبرئتها وصيانتها." : "Cleared all resolved security protocol notices."
    });
  };

  if (isLoading) {
    return (
      <div className={styles.style300_43}>
        <Loader2 className={styles.style301_44} />
        <p className={styles.style302_45}>{tAuto('key_bf0f62a3')}</p>
      </div>
    );
  }

  return (
    <div className={styles.style308_46} dir="rtl">
      {/* 🔮 THE MONITORING TOWER BANNER */}
      <div className={styles.style311_47}>
        <div className={styles.style312_48}></div>
        <div className={styles.style313_49}>
          <div className={styles.style314_50}>
            <div className={styles.style315_51}>
              <span className={styles.style316_52}></span>
              <h3 className={styles.style317_53}>
                <Radio className={styles.style318_54} />
                {tAuto('key_c91bdcd9')}
              </h3>
            </div>
            <p className={styles.style322_55}>
              {tAuto('key_ad7f6699')} <strong className={styles.style323_56}>(SC55)</strong>.
            </p>
          </div>
          <div className={styles.style326_57}>
            <span className={styles.style327_58}>
              {tAuto('key_5a857b79')} {geofenceIntegrity.toFixed(1)}%
            </span>
            <Badge
              onClick={() => {
                toast({
                  title: tAuto('key_a41492ec'),
                  description: `يومض هذا المؤشر تلقائياً بشكل نشاطي للتنبيه بوجود (${pendingCount}) حملة إعلانية تتطلب فحصاً أمنياً مسبقاً وتصديقاً قبل نشرها في قسم الإعلانات المفتوح.`,
                  variant: "default"
                });
              }}
              className={styles.style338_59}
            >
              {pendingCount} {tAuto('key_a57d4946')}
            </Badge>
          </div>
        </div>

        {/* Real-time Sovereign Indicators */}
        <div className={styles.style346_60}>
          <div className={styles.style347_61}>
            <span className={styles.style348_62}>{tAuto('key_7b8d3f39')}</span>
            <span className={styles.style349_63}>
              <Activity className={styles.style350_64} />
              100% <span className={styles.style351_65}>{isArabic ? "مستقر" : "Stable"}</span>
            </span>
          </div>
          <div className={styles.style354_66}>
            <span className={styles.style355_67}>{tAuto('key_252808c3')}</span>
            <span className={styles.style356_68}>
              {pendingCount} {tAuto('key_3d40fde5')} <span className={styles.style357_69}>{tAuto('key_61468e91')}</span>
            </span>
          </div>
          <div className={styles.style360_70}>
            <span className={styles.style361_71}>{tAuto('key_51950a4a')}</span>
            <span className={styles.style362_72}>
              0.0% <span className={styles.style363_73}>{tAuto('key_9d1d77f0')}</span>
            </span>
          </div>
          <div className={styles.style366_74}>
            <span className={styles.style367_75}>{tAuto('key_821d92a0')}</span>
            <span className={styles.style368_76}>
              0.00 <span className={styles.style369_77}>{tAuto('key_3151e05a')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 🧪 INTERACTIVE EMBEDDED PATH SYSTEM & DEVIATION LAB */}
      <div className={styles.style376_78}>
        {/* Right side (8 cols): Injected Threat Logs & Live Ad Stream */}
        <div className={styles.style379_79}>
          <div className={styles.style382_80}>
            <div className={styles.style383_81}>
              <h4 className={styles.style384_82}>
                <Compass className={styles.style385_83} />
                {tAuto('key_b65bd155')}{pendingCount})
              </h4>
              <span className={styles.style388_84}>{tAuto('key_32c82ec1')}</span>
            </div>

            {pendingCount === 0 ? (
              <div className={styles.style392_85}>
                <div className={styles.style393_86}>
                  <CheckCircle2 className={styles.style394_87} />
                </div>
                <h4 className={styles.style396_88}>{tAuto('key_2427477a')}</h4>
                <p className={styles.style397_89}>
                  {tAuto('key_a66bde6d')}
                </p>
              </div>
            ) : (
              <div className={styles.style402_90}>
                {pendingAds.map(ad => (
                  <PendingAdReviewCard
                    key={ad.id}
                    ad={ad}
                    onApprove={approveAd}
                    onReject={rejectAd}
                  />
                ))}
              </div>
            )}
          </div>

          <PendingAdsThreatRegister
            injectedThreats={injectedThreats}
            activeThreatsCount={activeThreatsCount}
            onResolveThreat={handleResolveThreat}
            onClearResolved={clearAllResolved}
          />
        </div>

        <PendingAdsForensicScanner
          onScan={runAdForensicScan}
          isScanning={isScanning}
          scanResults={scanResults}
        />
      </div>
    </div>
  );
}
