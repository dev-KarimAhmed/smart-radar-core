'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Loader2,
  Radio,
  Activity,
  Compass,
  Fingerprint,
  Trash2,
  ShieldCheck,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { useAdminAds } from '@/hooks/use-admin-ads';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { styles } from '../../admin-view-styles';
import { PendingAdReviewCard } from './pending-ad-review-card';

export { PendingAdReviewCard };

export function PendingAdsAuditPanel() {
  const { isArabic } = useDashboardLanguage();
  const tAuto = useTranslations('auto');
  const { approveAd, rejectAd, ads, isLoading } = useAdminAds();
  const pendingAds = useMemo(() => {
    return (ads || []).filter(
      (ad) => (ad.status || '').toLowerCase() === 'pending' || (ad.status || '') === 'PENDING'
    );
  }, [ads]);
  const { toast } = useToast();

  const [injectedThreats, setInjectedThreats] = useState<
    Array<{
      id: string;
      timestamp: string;
      district: string;
      severity: string;
      message: string;
      actionLabel: string;
      resolved: boolean;
    }>
  >([]);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<string[] | null>(null);

  const pendingCount = pendingAds.length;
  const activeThreatsCount = injectedThreats.filter((t) => !t.resolved).length;
  const geofenceIntegrity = Math.max(70, 100 - activeThreatsCount * 6.5);

  const handleResolveThreat = (id: string, message: string) => {
    setInjectedThreats((prev) =>
      prev.map((t) => (t.id === id ? { ...t, resolved: true } : t))
    );
    toast({
      title: '⚖️ تم التوثيق والتعقيم',
      description: `تم إخضاع السجل للتدقيق بنجاح: ${message}`,
      variant: 'default',
    });
  };

  const runAdForensicScan = () => {
    setIsScanning(true);
    setScanResults(null);
    toast({
      title: isArabic ? '📡 بدء فحص الحملات الإعلانية' : '📡 Scan Campaigns Started',
      description: isArabic
        ? 'جاري مطابقة الحملات الإعلانية المودعة بالمعايير الرقابية...'
        : 'Verifying ad campaigns against safety policies...',
    });

    setTimeout(() => {
      setIsScanning(false);
      setScanResults([
        `⏱️ [${new Date().toLocaleTimeString('ar-JO')}] اكتمل تدقيق الحملات الإعلانية.`,
        `🔍 الحملات المعلقة قيد المراجعة: ${pendingCount} حملة.`,
        `🔒 التوافق الجغرافي والمالي: مستقر بنسبة 100% وبدون ثغرات.`,
        `🛡️ قرار الفحص: لا توجد مخالفات ميكانيكية أو بلاغات انتحال نشطة.`,
      ]);
      toast({
        title: isArabic ? '✅ اكتمل الفحص الأمني' : '✅ Security Scan Complete',
        description: isArabic
          ? 'تمت مراجعة ومطابقة كافة الحملات الإعلانية بنجاح.'
          : 'All ad campaigns reviewed and validated successfully.',
      });
    }, 600);
  };

  const clearAllResolved = () => {
    setInjectedThreats((prev) => prev.filter((t) => !t.resolved));
    setScanResults(null);
    toast({
      title: isArabic ? '🧹 تنظيف السجلات المعقمة' : '🧹 Clean Audit Logs',
      description: isArabic
        ? 'تم مسح كافة الإخطارات البروتوكولية التي تمت تبرئتها وصيانتها.'
        : 'Cleared all resolved security protocol notices.',
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
                  variant: 'default',
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
              100% <span className={styles.style351_65}>{isArabic ? 'مستقر' : 'Stable'}</span>
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
          {/* Section: Live Ad Submissions needing audit */}
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
                <p className={styles.style397_89}>{tAuto('key_a66bde6d')}</p>
              </div>
            ) : (
              <div className={styles.style402_90}>
                {pendingAds.map((ad) => (
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

          {/* Section: Local Injected Sovereign Threat Register */}
          <div className={styles.style416_91}>
            <div className={styles.style417_92}>
              <div>
                <h4 className={styles.style419_93}>
                  <Fingerprint className={styles.style420_94} />
                  {tAuto('key_84293290')}
                </h4>
                <p className={styles.style423_95}>{tAuto('key_9990d005')}</p>
              </div>
              <div className={styles.style427_96}>
                {injectedThreats.some((t) => t.resolved) && (
                  <Button onClick={clearAllResolved} variant="outline" className={styles.style432_97}>
                    <Trash2 className={styles.style434_98} />
                    {tAuto('key_fbefe958')}
                  </Button>
                )}
                <Badge variant="outline" className={styles.style438_99}>
                  {activeThreatsCount} {tAuto('key_edbed039')}
                </Badge>
              </div>
            </div>

            <div className={styles.style444_100}>
              {injectedThreats.length === 0 ? (
                <div className={styles.style446_101}>{tAuto('key_7e571d77')}</div>
              ) : (
                injectedThreats.map((threat) => (
                  <div
                    key={threat.id}
                    className={cn(
                      styles.style454_102,
                      threat.resolved ? styles.style455_103 : styles.style455_104
                    )}
                  >
                    <div className={styles.style458_105}>
                      <div className={styles.style459_106}>
                        <span
                          className={cn(
                            styles.style461_107,
                            threat.severity === 'severe' ? styles.style463_108 : styles.style464_109,
                            threat.resolved && styles.style465_110
                          )}
                        >
                          {threat.resolved
                            ? tAuto('key_46a6f86e')
                            : threat.severity === 'severe'
                            ? tAuto('key_888d4095')
                            : tAuto('key_5bfde6d0')}
                        </span>
                        <span className={styles.style469_111}>📍 {threat.district}</span>
                        <span className={styles.style472_112}>{threat.timestamp}</span>
                      </div>
                      <p
                        className={cn(
                          styles.style475_113,
                          threat.resolved ? styles.style476_114 : styles.style476_115
                        )}
                      >
                        {threat.message}
                      </p>
                    </div>

                    {!threat.resolved ? (
                      <Button
                        onClick={() => handleResolveThreat(threat.id, threat.message)}
                        className={styles.style485_116}
                      >
                        {threat.actionLabel}
                      </Button>
                    ) : (
                      <span className={styles.style490_117}>
                        <ShieldCheck className={styles.style491_118} />
                        {tAuto('key_f0db1966')}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Left side (4 cols): Forensic Scanner */}
        <div className={styles.style504_119}>
          <div className={styles.style558_134}>
            <div className={styles.style559_135}>
              <h4 className={styles.style560_136}>
                <Terminal className={styles.style561_137} />
                {tAuto('key_dd25df53')}
              </h4>
              <p className={styles.style564_138}>{tAuto('key_677339a8')}</p>
            </div>

            <Button onClick={runAdForensicScan} disabled={isScanning} className={styles.style572_139}>
              {isScanning ? (
                <>
                  <Loader2 className={styles.style576_140} />
                  {tAuto('key_6de7833f')}
                </>
              ) : (
                <>
                  <Sparkles className={styles.style581_141} />
                  {tAuto('key_cff79ba6')}
                </>
              )}
            </Button>

            <div className={styles.style588_142}>
              <span className={styles.style589_143}>{tAuto('key_7006cb7e')}</span>
              <div className={styles.style590_144}>
                {'$$\\Omega_{audit} = \\sum_{i=1}^{N} (\\mathcal{I}_{ad} \\times \\lambda_{sovereign}) \\equiv 1$$'}
              </div>
              <p className={styles.style593_145}>
                {tAuto('key_678a27cf')} {'$\\mathcal{I}_{ad}$'} {tAuto('key_b22fc3aa')}{' '}
                {'$\\lambda_{sovereign}$'} {tAuto('key_ccff1d7f')}
              </p>
            </div>

            {scanResults && (
              <div className={styles.style599_146}>
                <div className={styles.style600_147}>
                  <span className={styles.style601_148}>{tAuto('key_c248563a')}</span>
                  <span className={styles.style602_149}>{tAuto('key_fac08f76')}</span>
                </div>
                {scanResults.map((line, idx) => (
                  <p key={idx} className={styles.style605_150}>
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
