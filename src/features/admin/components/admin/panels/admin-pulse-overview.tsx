'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { adminFetch } from '../../../lib/admin-api-client';
import { styles } from '../../admin-view-styles';

export function AdminPulseOverview() {
  const { isArabic } = useDashboardLanguage();
  const tAuto = useTranslations('auto');
  const [logs, setLogs] = useState<
    Array<{
      id: string;
      timestamp: string;
      type: string;
      message: string;
      actionLabel: string;
      resolved: boolean;
    }>
  >([]);

  const { toast } = useToast();

  const [totalCaptains, setTotalCaptains] = useState(0);
  const [activeCaptains, setActiveCaptains] = useState(0);
  const [totalRiders, setTotalRiders] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadRealPulse = useCallback(
    async (showToast = false) => {
      setIsRefreshing(true);
      try {
        const res = await adminFetch('/api/admin/kpis');
        const data = await res.json();

        if (data?.success && data?.stats) {
          setTotalCaptains(data.stats.totalCaptains ?? 0);
          setActiveCaptains(data.stats.activeCaptains ?? 0);
          setTotalRiders(data.stats.totalRiders ?? 0);

          if (showToast) {
            toast({
              title: isArabic ? '⚡ اكتمال التحديث اللحظي' : '⚡ Real-time Sync Complete',
              description: isArabic
                ? `تمت مزامنة بيانات الكباتن المعلنين (${data.stats.totalCaptains}) والمستخدمين (${data.stats.totalRiders}) مباشرة من قاعدة البيانات.`
                : `Synced ${data.stats.totalCaptains} captains and ${data.stats.totalRiders} users from DB.`,
            });
          }
        }
      } catch (err) {
        console.warn('[Admin Pulse] Fetch error:', err);
      } finally {
        setIsRefreshing(false);
      }
    },
    [isArabic, toast]
  );

  useEffect(() => {
    void loadRealPulse(false);
  }, [loadRealPulse]);

  const handleQuantumRefresh = () => {
    void loadRealPulse(true);
  };

  const handleResolve = (id: string, message: string, actionName: string) => {
    setLogs((prev) => prev.map((log) => (log.id === id ? { ...log, resolved: true } : log)));
    toast({
      title: isArabic ? '🛡️ معالجة السجل' : '🛡️ Resolve Record',
      description: isArabic
        ? `تم تطبيق الإجراء: ${actionName} لحل "${message}".`
        : `Action ${actionName} applied to resolve "${message}".`,
    });
  };

  return (
    <div className={styles.style789_151} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* 🔮 Edge computing visual stats card banner */}
      <div className={styles.style791_152}>
        <Card className={styles.style792_153}>
          <CardHeader className={styles.style793_154}>
            <CardDescription className={styles.style794_155}>
              {isArabic ? 'الكباتن المعلنين المسجلين' : 'Registered Advertiser Captains'}
            </CardDescription>
            <CardTitle className={styles.style795_156}>
              {totalCaptains} {isArabic ? 'كابتن معلن' : 'Captains'}
            </CardTitle>
          </CardHeader>
          <CardContent className={styles.style799_157}>
            <span className={styles.style800_158}>
              <ArrowUpRight className={styles.style800_159} /> {activeCaptains} {isArabic ? 'متصل' : 'online'}
            </span>
            <span>{isArabic ? 'نشط الآن' : 'Active Now'}</span>
          </CardContent>
        </Card>

        <Card className={styles.style805_160}>
          <CardHeader className={styles.style806_161}>
            <CardDescription className={styles.style807_162}>
              {isArabic ? 'المستخدمين المسجلين' : 'Registered Users'}
            </CardDescription>
            <CardTitle className={styles.style808_163}>
              {totalRiders} {isArabic ? 'مستخدم' : 'Users'}
            </CardTitle>
          </CardHeader>
          <CardContent className={styles.style810_164}>
            <span className={styles.style811_165}>{isArabic ? 'قاعدة المستخدمين' : 'User Base'}</span>
            <span>{isArabic ? 'في المنظومة' : 'In System'}</span>
          </CardContent>
        </Card>

        <Card className={styles.style816_166}>
          <CardHeader className={styles.style817_167}>
            <CardDescription className={styles.style818_168}>
              {isArabic ? 'استقرار الرادار' : 'Radar Stability'}
            </CardDescription>
            <CardTitle className={styles.style819_169}>100% {isArabic ? 'مستقر' : 'Stable'}</CardTitle>
          </CardHeader>
          <CardContent className={styles.style821_170}>
            <span className={styles.style822_171}>{isArabic ? 'المعمارية الحافة' : 'Edge Architecture'}</span>
            <span>{isArabic ? 'تعمل بكفاءة' : 'Operating Efficiently'}</span>
          </CardContent>
        </Card>
      </div>

      {/* 📈 Real-time Pulse Status */}
      <Card className={styles.style829_172}>
        <CardHeader className={styles.style830_173}>
          <div className={styles.style831_174}>
            <Button
              variant="outline"
              onClick={handleQuantumRefresh}
              disabled={isRefreshing}
              className={styles.style836_175}
            >
              {isRefreshing ? <Loader2 className={styles.style839_176} /> : <span className={styles.style841_177} />}
              {tAuto('key_5f873a9d')}
            </Button>
            <CardTitle className={styles.style845_178}>
              <TrendingUp className={styles.style846_179} />
              {tAuto('key_dd9c19fe')}
            </CardTitle>
          </div>
          <CardDescription className={styles.style850_180}>{tAuto('key_095d3534')}</CardDescription>
        </CardHeader>
        <CardContent className={styles.style854_181}>
          <div className={styles.style855_182}>
            <svg viewBox="0 0 500 100" className={styles.style856_183} preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,60 Q125,40 250,50 T500,45"
                fill="none"
                stroke="#14b8a6"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path d="M0,60 Q125,40 250,50 T500,45 L500,100 L0,100 Z" fill="url(#chartGradient)" />
              <circle cx="250" cy="50" r="4" fill="#14b8a6" className={styles.style877_185} />
              <circle cx="250" cy="50" r="3" fill="#14b8a6" />
            </svg>
            <div className={styles.style880_186}>
              {isArabic ? 'كافة خلايا H3 والنبضات الحافة تعمل في نطاق الأمان' : 'All H3 cells and edge pulses operating in safe zone'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ⚠️ Audit log and protocol deviations box */}
      <Card className={styles.style891_188}>
        <CardHeader className={styles.style892_189}>
          <div className={styles.style893_190}>
            <span className={styles.style895_192}>
              {logs.filter((l) => !l.resolved).length} {tAuto('key_d9038b05')}
            </span>
            <CardTitle className={styles.style913_195}>
              <AlertTriangle className={styles.style914_196} />
              {tAuto('key_8595850a')}
            </CardTitle>
          </div>
          <CardDescription className={styles.style918_197}>{tAuto('key_b2720174')}</CardDescription>
        </CardHeader>
        <CardContent className={styles.style942_206}>
          {logs.length === 0 ? (
            <div className="py-8 text-center text-xs font-bold text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              {isArabic
                ? 'لا توجد بلاغات أو انحرافات مسجلة - كافة النبضات مستقرة بنسبة 100%.'
                : 'No alerts or deviations recorded - all pulses 100% stable.'}
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className={cn(styles.style945_207, log.resolved ? styles.style946_208 : styles.style946_209)}
                dir="rtl"
              >
                <div className={styles.style948_210}>
                  <div className={styles.style949_211}>
                    <span className={styles.style950_212}>{log.timestamp}</span>
                    <Badge variant={log.resolved ? 'secondary' : 'destructive'} className={styles.style951_213}>
                      {log.resolved
                        ? tAuto('key_1f289735')
                        : log.type === 'severe'
                        ? tAuto('key_2c70af9e')
                        : tAuto('key_26cd11bc')}
                    </Badge>
                  </div>
                  <p className={styles.style955_214}>{log.message}</p>
                </div>

                {!log.resolved && (
                  <Button
                    onClick={() => handleResolve(log.id, log.message, log.actionLabel)}
                    className={styles.style961_215}
                  >
                    {log.actionLabel}
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
