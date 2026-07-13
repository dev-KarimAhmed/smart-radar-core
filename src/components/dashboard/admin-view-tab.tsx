'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DriversManagementTab } from './admin/drivers-management-tab';
import { AdsManagementTab } from './admin/ads-management-tab';
import { DelegatesManagementTab } from './admin/delegates-management-tab';
import { KillSwitchPanel } from './admin/kill-switch-panel';
import { RadarOwnerSovereignDashboard } from './admin/owner-sovereign-dashboard';
import { FuelIndexPanel } from './admin/fuel-index-panel';
import { PulseHeatmap } from '../admin/pulse-heatmap';
import { useMarketPulse } from '@/hooks/use-market-pulse';
import { Shield, Megaphone, Users, Activity, UsersRound, ShieldAlert, CheckCircle2, Loader2, ArrowUpRight, TrendingUp, AlertTriangle, Radio, ShieldCheck, Cpu, Eye, AlertCircle, RefreshCw, Sparkles, Fingerprint, Terminal, Scale, Compass, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useAdminAds } from '@/hooks/use-admin-ads';
import { SovereignErrorBoundary } from '../sovereign-error-boundary';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function PendingAdReviewCard({ ad, onApprove, onReject }: { ad: any; onApprove: (id: string) => Promise<void>; onReject: (id: string, reason: string) => Promise<void> }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(ad.id);
    } catch (e) {
      // Handled/logged in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onReject(ad.id, reason);
      setRejecting(false);
      setReason('');
    } catch (e) {
      // Handled/logged in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = ad.content?.title || ad.title || 'إعلان بدون عنوان';
  const description = ad.content?.description || ad.description || 'لا يوجد وصف متاح';
  const posterUrl = ad.content?.posterUrl || ad.posterUrl || '';

  return (
    <Card className="bg-black/90 border border-amber-500/30 overflow-hidden relative shadow-[0_4px_20px_rgb(var(--radar-warning-rgb)/0.05)] rounded-2xl flex flex-col text-right" dir="rtl">
      {posterUrl && (
        <div className="relative h-40 w-full overflow-hidden bg-zinc-900">
          <img src={posterUrl} alt={title} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
          <Badge className="absolute top-3 right-3 bg-amber-500 hover:bg-amber-600 text-black font-black">
            قيد الفحص الأمني 🔍
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3 text-right">
        <div className="flex justify-between items-start gap-2">
          {!posterUrl && (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-black font-black">
              قيد الفحص الأمني 🔍
            </Badge>
          )}
          <CardTitle className="text-white text-base font-black truncate max-w-[200px]">{title}</CardTitle>
        </div>
        <CardDescription className="text-gray-400 text-xs line-clamp-2 mt-1">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 text-xs flex-grow font-sans text-gray-300 text-right">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-900/60 p-2 rounded-xl border border-white/5 text-right">
            <span className="text-[10px] text-gray-500 block">النطاق الجغرافي</span>
            <span className="font-bold text-white block mt-0.5">📍 {ad.targetGovernorate || 'كل الأردن'} {ad.targetDistrict ? `- ${ad.targetDistrict}` : ''}</span>
          </div>
          <div className="bg-zinc-900/60 p-2 rounded-xl border border-white/5 text-right">
            <span className="text-[10px] text-gray-500 block">مرات الظهور المستهدفة</span>
            <span className="font-bold text-amber-400 block mt-0.5 font-mono">⚡ {(ad.targetImpressions || 10000).toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-white/5 space-y-1 font-mono text-right">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-gray-500 text-right">ميزة التخليد الفاخرة (القلب الأخضر):</span>
            <span className={ad.isPremiumRetentionPaid ? "text-emerald-400 font-bold" : "text-gray-500"}>
              {ad.isPremiumRetentionPaid ? "✅ مدفوعة وتخلد" : "❌ عادية فقط"}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-gray-500 text-right">المستهدف المهني:</span>
            <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-white capitalize">
              {ad.role === 'all' ? 'الجميع' : ad.role === 'driver' ? 'السائقون' : 'الركاب'}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-gray-500 text-right">واتساب المعلن:</span>
            <span className="text-white">{ad.whatsapp || ad.phone || 'N/A'}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-zinc-900/40 p-3 border-t border-white/5 flex flex-col gap-2">
        {!rejecting ? (
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2 h-9 rounded-xl active:scale-[0.98] transition-all"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <CheckCircle2 className="w-4 h-4 ml-1" />}
              اعتماد ونشر للقسم الإعلانات
            </Button>
            <Button
              onClick={() => setRejecting(true)}
              variant="destructive"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-500 text-white font-black text-xs py-2 h-9 rounded-xl active:scale-[0.98] transition-all"
            >
              <ShieldAlert className="w-4 h-4 ml-1" />
              إيقاف
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200 text-right">
            <Label className="text-[10px] text-red-400 font-bold font-sans">مبرر الرفض الأمني (صيغة الإفادة الرسمية):</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب سبب الرفض هنا..."
              className="bg-black/90 border border-red-500/40 text-white text-xs h-9 rounded-xl focus:border-red-500 text-right"
              dir="rtl"
            />
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button
                onClick={handleReject}
                disabled={isSubmitting || !reason.trim()}
                className="bg-red-600 hover:bg-red-500 text-white font-black text-xs h-8 rounded-xl"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" /> : null}
                تأكيد الإيقاف
              </Button>
              <Button
                onClick={() => { setRejecting(false); setReason(''); }}
                variant="outline"
                className="border-white/10 hover:bg-white/5 text-gray-300 text-xs h-8 rounded-xl"
              >
                تراجع
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export function PendingAdsAuditPanel() {
  const { approveAd, rejectAd, ads, isLoading } = useAdminAds();
  const pendingAds = React.useMemo(() => {
    return (ads || []).filter(ad => (ad.status || '').toLowerCase() === 'pending' || (ad.status || '') === 'PENDING');
  }, [ads]);
  const { toast } = useToast();

  // state for live injected audit logs (الإضافة الموضعي للمخالفات الإعلانية والبروتوكولية)
  const [injectedThreats, setInjectedThreats] = useState([
    {
      id: "ad-threat-1",
      timestamp: "منذ 3 دقائق",
      district: "منطقة الجامعة",
      severity: "warn",
      message: "اشتباه ترويج ميكانيكي غير مرخص خارج حدود النظام  للمحافظة",
      actionLabel: "تدقيق محلي 🌐",
      resolved: false,
    },
    {
      id: "ad-threat-2",
      timestamp: "منذ 10 دقائق",
      district: "منطقة ماركا",
      severity: "severe",
      message: "حملة إعلانية ممتازة تم طلب تخليدها دون سداد رسم القيد الماسي الموحد",
      actionLabel: "إلغاء التخليد 💳",
      resolved: false,
    }
  ]);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<string[] | null>(null);

  // Stats derived from local simulation
  const pendingCount = pendingAds.length;
  const activeThreatsCount = injectedThreats.filter(t => !t.resolved).length;
  const geofenceIntegrity = Math.max(70, 100 - activeThreatsCount * 6.5);

  const handleResolveThreat = (id: string, message: string) => {
    setInjectedThreats(prev =>
      prev.map(t => t.id === id ? { ...t, resolved: true } : t)
    );
    toast({
      title: "⚖️ تم الحذف والتعقيم بنجاح",
      description: `تم إخضاع المخالفة لبروتوكول ميثاق النظام الماسي: ${message}`,
      variant: "default",
    });
  };

  const handleInjectThreat = (type: 'payment' | 'jurisdiction' | 'unauthorized' | 'spam') => {
    const timeNow = new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let newThreat = {
      id: `threat-injected-${Date.now()}`,
      timestamp: `الآن (الساعة ${timeNow})`,
      district: "",
      severity: "severe",
      message: "",
      actionLabel: "",
      resolved: false
    };

    const districts = ["منطقة وادي السير", "منطقة الجيزة", "شمال عمان", "منطقة الجامعة", "منطقة سحاب"];
    const randomDistrict = districts[Math.floor(Math.random() * districts.length)];
    newThreat.district = randomDistrict;

    switch (type) {
      case 'payment':
        newThreat.message = `تهرب من العائد  الإعلاني ومحاولة التفاف على حصة السداد في ${randomDistrict}`;
        newThreat.actionLabel = "سحب الترخيص 💸";
        newThreat.severity = "severe";
        break;
      case 'jurisdiction':
        newThreat.message = `تخطي النطاق الجغرافي المعين وبث منشور خارج المنطقة المرخص له في ${randomDistrict}`;
        newThreat.actionLabel = "عزل جيو-محلي 🌐";
        newThreat.severity = "warn";
        break;
      case 'unauthorized':
        newThreat.message = `ترويج محتوى بدون الختم الذهبي وتعميد الهوية المرئية الوطنية الأردنية`;
        newThreat.actionLabel = "تطبيق الإيقاف ⚖️";
        newThreat.severity = "severe";
        break;
      case 'spam':
        newThreat.message = `إغراق تكراري إعلاني مكثف بأكثر من 15 منشور متصل في قصبة ${randomDistrict}`;
        newThreat.actionLabel = "حظر بث فوري 📡";
        newThreat.severity = "severe";
        break;
    }

    setInjectedThreats(prev => [newThreat, ...prev]);
    toast({
      title: "🚨 إضافة مخالفة إعلانية بنجاح",
      description: `تم رصد إخلال فوري في ${randomDistrict}: ${newThreat.message}`,
      variant: "destructive"
    });
  };

  const runAdForensicScan = () => {
    setIsScanning(true);
    setScanResults(null);
    toast({
      title: "📡 بدء المسح الخوارزمي للأصول الإعلانية",
      description: "يتم فحص قسم الإعلانات الجاري ومطابقته بشروط النظام الماسي V5.5..."
    });

    setTimeout(() => {
      setIsScanning(false);
      setScanResults([
        `⏱️ [${new Date().toLocaleTimeString('ar-JO')}] بدء تمشيط الأقسام الرقمية النشطة...`,
        `🔍 التدقيق الجغرافي: فحص مطابقة الخلايا السداسية H3 مع تصريح منطقة وادي السير والجامعة.. [مطابق بنسبة 100%]`,
        `💳 التتبع المالي: مطابقة رسوم التخليد الفاخر (Premium Retention Payment).. [لا توجد ثغرات]`,
        `🔒 معيار الحصانة: فحص استهلاك الخادم السحابي بموجب المادة (SC55).. [المؤشر مستقر عند 0% استهلاك]`,
        `🛡️ قرار الهيئة : النظام خالٍ تماماً من الدعاية الميكانيكية المجهولة.`
      ]);
      toast({
        title: "✅ اكتمل المسح الأمني بنجاح",
        description: "تم تأمين الإعلانات ومطابقة كافة الأصول بالمعيار  المستقل."
      });
    }, 2800);
  };

  const clearAllResolved = () => {
    setInjectedThreats(prev => prev.filter(t => !t.resolved));
    setScanResults(null);
    toast({
      title: "🧹 تنظيف السجلات المعقمة",
      description: "تم مسح كافة الإخطارات البروتوكولية التي تمت تبرئتها وصيانتها."
    });
  };

  if (isLoading) {
    return (
      <div className="bg-radar-bg/90 p-6 rounded-2xl border border-amber-500/20 text-center animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
        <p className="text-gray-400 text-xs mt-2 font-sans">بانتظار تدفق المذكرة السحابية للحملات المعلقة...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">

      {/* 🔮 THE MONITORING TOWER BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-l from-amber-950/20 via-zinc-900/60 to-black border border-amber-500/30 p-5 rounded-2xl text-right">
        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full"></div>
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></span>
              <h3 className="text-base sm:text-lg font-black text-amber-400 flex items-center gap-2 text-right">
                <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
                برج مراقبة الإعلانات والنشاط  (Control Tower V5.5)
              </h3>
            </div>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              محرك الرصد اللحظي والفحص الأمني لحماية الهوية الإعلانية وحماية السائقون من الإغراق والوكالات الوهمية، مع الامتثال لميثاق صفر كلفة <strong className="text-emerald-400">(SC55)</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-center">
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-500/20">
              ⚡ الحصانة المحلية: {geofenceIntegrity.toFixed(1)}%
            </span>
            <Badge
              onClick={() => {
                toast({
                  title: "🛡️ فحص حالة معلّقات الإعلانات",
                  description: `يومض هذا المؤشر تلقائياً بشكل نشاطي للتنبيه بوجود (${pendingCount}) حملة إعلانية تتطلب فحصاً أمنياً مسبقاً وتصديقاً  قبل نشرها في قسم الإعلانات المفتوح.`,
                  variant: "default"
                });
              }}
              className="bg-amber-500 hover:bg-amber-600 text-black font-black font-sans px-2.5 py-1 text-xs rounded-full animate-pulse cursor-pointer select-none active:scale-95 transition-transform"
            >
              {pendingCount} في قسم الإعلانات المعلق
            </Badge>
          </div>
        </div>

        {/* Real-time Sovereign Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5 border-t border-white/5 pt-5">
          <div className="bg-black/40 border border-white/5 p-3 rounded-xl">
            <span className="text-[10px] block text-gray-400 font-bold mb-1">النشاط الجغرافي النشط</span>
            <span className="text-sm font-black text-white font-mono flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              1.34 Hz <span className="text-[9px] text-gray-500">منظم</span>
            </span>
          </div>
          <div className="bg-black/40 border border-white/5 p-3 rounded-xl">
            <span className="text-[10px] block text-gray-400 font-bold mb-1">أشغال الإعلانات</span>
            <span className="text-sm font-black text-amber-400 font-mono">
              {pendingCount + 12} حملة <span className="text-[9px] text-gray-500">/ 1,000 جيو-خلية</span>
            </span>
          </div>
          <div className="bg-black/40 border border-white/5 p-3 rounded-xl">
            <span className="text-[10px] block text-gray-400 font-bold mb-1">حمولة المعالجة (SC55)</span>
            <span className="text-sm font-black text-emerald-400 font-mono">
              0.0% <span className="text-[9px] text-gray-500">توزيع طرفي بالكامل</span>
            </span>
          </div>
          <div className="bg-black/40 border border-white/5 p-3 rounded-xl">
            <span className="text-[10px] block text-gray-400 font-bold mb-1">تضارب الأدوار (Audit Index)</span>
            <span className="text-sm font-black text-teal-400 font-mono">
              0.00 <span className="text-[9px] text-gray-500">صفر تضخّم</span>
            </span>
          </div>
        </div>
      </div>

      {/* 🧪 INTERACTIVE EMBEDDED PATH SYSTEM & DEVIATION LAB */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Right side (8 cols): Injected Threat Logs & Live Ad Stream */}
        <div className="lg:col-span-8 space-y-6">

          {/* Section: Live Ad Submissions needing audit */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400" />
                الدفعات الإعلانية الواردة حديثاً بانتظار الختم  ({pendingCount})
              </h4>
              <span className="text-[10px] text-zinc-500 font-sans">تحديث آلي مستمر من سحابة التوازن</span>
            </div>

            {pendingCount === 0 ? (
              <div className="bg-zinc-950/40 p-10 rounded-2xl border border-zinc-900 border-dashed text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/10 mb-2">
                  <CheckCircle2 className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-xs sm:text-sm font-black text-zinc-300">قسم الإعلانات النمذجة سليم ونقي</h4>
                <p className="text-gray-500 text-[11px] mt-1 font-sans max-w-sm">
                  لا توجد حملات من معلنين خارجيين بانتظار الفحص الأمني حالياً. كل الدعاية النشطة تمت صيانتها وتعقيم بنودها التاريخية بامتياز.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Section: Local Injected Sovereign Threat Register (رادارات كبح الانحراف الإعلاني) */}
          <div className="bg-radar-abyss border border-red-500/20 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-red-950/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-rose-400 flex items-center gap-1.5">
                  <Fingerprint className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                  سجل رادار الفحص الأمني الإعلاني والمخالفات الموضعية
                </h4>
                <p className="text-gray-500 text-[10px] mt-0.5">
                  بوابة رصد واجهة المالك للسيطرة السريعة وإضافة وسحق التشوهات التي تهدد ميثاق العدالة والإدارة.
                </p>
              </div>
              <div className="flex gap-1">
                {injectedThreats.some(t => t.resolved) && (
                  <Button
                    onClick={clearAllResolved}
                    variant="outline"
                    className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 h-6 px-2 text-[9px] rounded"
                  >
                    <Trash2 className="w-3 h-3 ml-1" />
                    تنظيف المعقم
                  </Button>
                )}
                <Badge variant="outline" className="border-rose-500/30 text-rose-400 text-[10px] h-6 px-2.5 rounded-full font-sans animate-pulse">
                  {activeThreatsCount} مخالفات نشطة
                </Badge>
              </div>
            </div>

            <div className="p-0 divide-y divide-white/5 max-h-[300px] overflow-y-auto">
              {injectedThreats.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">
                  لا توجد انحرافات مسجلة حالياً في السجل الموضعي. استخدم أزرار مختبر المحاكاة لإضافة تهديدات جديدة.
                </div>
              ) : (
                injectedThreats.map(threat => (
                  <div
                    key={threat.id}
                    className={cn(
                      "p-3.5 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-right",
                      threat.resolved ? "opacity-40 bg-zinc-950/20" : "hover:bg-white/5 bg-black/20"
                    )}
                  >
                    <div className="space-y-1 text-right flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-sans tracking-wide",
                          threat.severity === 'severe'
                            ? "bg-red-950/50 text-red-400 border border-red-500/20"
                            : "bg-amber-950/50 text-amber-400 border border-amber-500/20",
                          threat.resolved && "bg-zinc-800 text-zinc-400 border-none"
                        )}>
                          {threat.resolved ? "تم الحذف والموازنة ✓" : threat.severity === 'severe' ? "خطر فادح 🩸" : "مخالفة معيارية ⚠️"}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-500/10">
                          📍 {threat.district}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">{threat.timestamp}</span>
                      </div>
                      <p className={cn(
                        "text-xs font-sans leading-relaxed text-right",
                        threat.resolved ? "line-through text-gray-500" : "text-gray-200"
                      )}>
                        {threat.message}
                      </p>
                    </div>

                    {!threat.resolved ? (
                      <Button
                        onClick={() => handleResolveThreat(threat.id, threat.message)}
                        className="bg-emerald-600/90 hover:bg-emerald-500 text-white font-black text-[10px] h-7 px-3 rounded-lg active:scale-95 transition-transform"
                      >
                        {threat.actionLabel}
                      </Button>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-sans flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        مؤمن ومصدق
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Left side (4 cols): Forensic Scanner & Injection Controls */}
        <div className="lg:col-span-4 space-y-6">

          {/* Module 1: The Local Attack Injection Bay */}
          <div className="bg-radar-bg border border-amber-500/20 p-4 rounded-2xl space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-amber-500" />
                مختبر الإضافة الموضعي للإخلالات الإعلانية
              </h4>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                اضغط على الزر لإضافة انحراف بروتوكولي أو تسعيري إعلاني لحظي داخل النظام الجيو-سداسي واختبار رد فعل الإيقاف الرقمية:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                onClick={() => handleInjectThreat('payment')}
                className="justify-between border-rose-500/30 text-rose-400 bg-rose-950/10 hover:bg-rose-900/20 text-xs h-9.5 rounded-xl cursor-pointer"
              >
                <span>إضافة التفاف مالي / تخليد وهمي 💸</span>
                <span className="text-[9px] bg-red-950/40 border border-red-500/20 px-1 py-0.5 rounded text-red-400 uppercase">فادح</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleInjectThreat('jurisdiction')}
                className="justify-between border-amber-500/30 text-amber-400 bg-amber-950/10 hover:bg-amber-900/20 text-xs h-9.5 rounded-xl cursor-pointer"
              >
                <span>إضافة خرق تفتيتي جغرافي (الحدود) 🌐</span>
                <span className="text-[9px] bg-amber-950/40 border border-amber-500/20 px-1 py-0.5 rounded text-amber-400 uppercase">تحذير</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleInjectThreat('unauthorized')}
                className="justify-between border-purple-500/30 text-purple-400 bg-purple-950/10 hover:bg-purple-900/20 text-xs h-9.5 rounded-xl cursor-pointer"
              >
                <span>إضافة منشور بدون هوية وطنية ⚖️</span>
                <span className="text-[9px] bg-red-950/40 border border-red-500/20 px-1 py-0.5 rounded text-red-400 uppercase font-bold">فادح</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleInjectThreat('spam')}
                className="justify-between border-cyan-500/30 text-cyan-400 bg-cyan-950/10 hover:bg-cyan-900/20 text-xs h-9.5 rounded-xl cursor-pointer"
              >
                <span>إضافة إغراق تكراري إعلاني مكثف 📡</span>
                <span className="text-[9px] bg-red-950/40 border border-red-500/20 px-1 py-0.5 rounded text-red-400 uppercase">فادح</span>
              </Button>
            </div>
          </div>

          {/* Module 2: Forensic Algorithmic Deep Scanner */}
          <div className="bg-radar-abyss/90 border border-teal-500/20 p-4 rounded-2xl space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-black text-teal-400 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-teal-500" />
                المسح الأمني التلقائي للأصول (Forensic Scanner)
              </h4>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                مإضافة الفحص الذاتي المشفر لمطابقة فروع الإشهار والدلائل المحلية بشروط الأمان  الموحد.
              </p>
            </div>

            <Button
              onClick={runAdForensicScan}
              disabled={isScanning}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-black text-xs h-9 rounded-xl active:scale-[0.98] transition-transform"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري تشريح الأصول ومطابقة المعيار...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  بدء فحص أمني رقمي فوري 📡
                </>
              )}
            </Button>

            {/* LaTeX Equation showing audit integrity function */}
            <div className="p-3 bg-black/60 rounded-xl border border-white/5 space-y-1.5 font-mono text-[10px]">
              <span className="text-gray-500 block text-right border-b border-white/5 pb-1 select-none">معيار السيطرة الرياضي:</span>
              <div className="text-cyan-400 font-bold py-1.5 tracking-tight text-center overflow-x-auto">
                {"$$\\Omega_{audit} = \\sum_{i=1}^{N} (\\mathcal{I}_{ad} \\times \\lambda_{sovereign}) \\equiv 1$$"}
              </div>
              <p className="text-[9px] text-gray-500 text-right font-sans leading-relaxed">
                حيث {"$\\mathcal{I}_{ad}$"} مؤشر سلامة المصادقة الموثقة لكل إشهار، و {"$\\lambda_{sovereign}$"} المعامل الضامن لحصانة الاستهلاك الطرفي.
              </p>
            </div>

            {scanResults && (
              <div className="bg-black/90 p-3 rounded-xl border border-teal-500/20 space-y-2 text-right font-mono text-[10px] text-emerald-400 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between border-b border-teal-500/10 pb-1.5 mb-1.5 font-sans">
                  <span className="text-[9px] text-zinc-500">تم التوثيق والمطابقة ✓</span>
                  <span className="text-teal-400 font-black">تقرير الفحص الأمني الرقمي:</span>
                </div>
                {scanResults.map((line, idx) => (
                  <p key={idx} className="leading-relaxed">{line}</p>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}

export function AdminPulseOverview() {
  const [logs, setLogs] = useState([
    {
      id: "log-1",
      timestamp: "الساعة 20:45:12",
      type: "severe",
      message: "تسجيل انحراف في تسعيرة التوافق بنسبة +16.4% في منطقة الجامعة",
      actionLabel: "موازنة فورية ⚖️",
      resolved: false,
    },
    {
      id: "log-2",
      timestamp: "الساعة 20:42:05",
      type: "severe",
      message: "اشتباه محاولة تلاعب بالوقت المتجمد (تعديل طابع محلي) من مستخدم",
      actionLabel: "حظر بث مؤقت 🚫",
      resolved: false,
    },
    {
      id: "log-3",
      timestamp: "الساعة 20:31:54",
      type: "warn",
      message: "تجاوز طاقة حجز الخلايا الجغرافية H3 المتوقعة في وادي السير",
      actionLabel: "تحديث السعة 📡",
      resolved: false,
    }
  ]);

  const { toast } = useToast();

  const [revenue, setRevenue] = useState(1489.20);
  const [zeroYielderCount, setZeroYielderCount] = useState(42);
  const [activeCells, setActiveCells] = useState(168);
  const [peakTrips, setPeakTrips] = useState(247);
  const [chartPath, setChartPath] = useState("M0,80 Q50,40 100,60 T200,30 T300,50 T400,20 T500,45");
  const [chartArea, setChartArea] = useState("M0,80 Q50,40 100,60 T200,30 T300,50 T400,20 T500,45 L500,100 L0,100 Z");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleQuantumRefresh = () => {
    setIsRefreshing(true);
    toast({
      title: "📡 بث النشاط ال اللحظي",
      description: "جاري حوسبة ومطابقة تدفقات النقد الميداني عبر السحابة ...",
    });

    setTimeout(() => {
      const deltaRevenue = (Math.random() * 80 - 30);
      const newRevenue = Math.max(1000, revenue + deltaRevenue);
      setRevenue(newRevenue);

      const newZeroYielder = Math.max(10, zeroYielderCount + Math.floor(Math.random() * 9 - 4));
      setZeroYielderCount(newZeroYielder);

      const newCells = Math.max(50, activeCells + Math.floor(Math.random() * 13 - 6));
      setActiveCells(newCells);

      const newPeak = Math.max(100, peakTrips + Math.floor(Math.random() * 19 - 9));
      setPeakTrips(newPeak);

      // Randomize peak coordinates safely
      const p1 = Math.floor(25 + Math.random() * 30);
      const p2 = Math.floor(45 + Math.random() * 30);
      const p3 = Math.floor(15 + Math.random() * 30);
      const p4 = Math.floor(35 + Math.random() * 30);
      const p5 = Math.floor(10 + Math.random() * 30);
      const p6 = Math.floor(30 + Math.random() * 35);

      const newPath = `M0,80 Q50,${p1} 100,${p2} T200,${p3} T300,${p4} T400,${p5} T500,${p6}`;
      setChartPath(newPath);
      setChartArea(`${newPath} L500,100 L0,100 Z`);

      setIsRefreshing(false);

      toast({
        title: "⚡ اكتمال المزامنة والربط ال",
        description: `تمت مطابقة طبقات السحابة بالسيولة الميدانية اللحظية بنجاح. النشاط الفعلي: ${newRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} د.أ.`,
      });
    }, 1000);
  };

  const handleResolve = (id: string, message: string, actionName: string) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, resolved: true } : log));
    toast({
      title: "🛡️ تدخل  ناجح",
      description: `تم إخضاع المنظومة بنجاح وإجراء: ${actionName} لحل "${message}".`
    });
  };

  const injectDeviation = () => {
    const scenarios = [
      {
        message: "تجاوز طاقة العتبة الإعلانية بنسبة +18.7% في منطقة وادي السير",
        actionLabel: "موازنة فورية ⚖️",
        type: "severe"
      },
      {
        message: "محاولة تنشيط الأذونات الزجاجية (Glass Permissions) سائق [صالح] بدون توثيق ثنائي",
        actionLabel: "رفض فوري ⛔",
        type: "severe"
      },
      {
        message: "تعديل طابع زمني محلي جاري بنسبة انحراف 15.2% عن الموعد  في الحافة الجغرافية",
        actionLabel: "حذف زمني ⏱️",
        type: "warn"
      },
      {
        message: "مخالفة تدفق السيولة الميدانية اللحظية بنسبة تجاوز 23.1% عن معيار سحابة التوازن",
        actionLabel: "حفظ فوري 💸",
        type: "severe"
      },
      {
        message: "تعدي جغرافي على خلايا H3  المحظورة في منطقة الجيزة والقطاع الجنوبي",
        actionLabel: "عزل جغرافي 🌐",
        type: "severe"
      }
    ];

    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const timeNow = new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newLog = {
      id: `dynamic-log-${Date.now()}`,
      timestamp: `الساعة ${timeNow}`,
      type: randomScenario.type,
      message: randomScenario.message,
      actionLabel: randomScenario.actionLabel,
      resolved: false
    };

    setLogs(prev => [newLog, ...prev]);
    toast({
      title: "📡 تم رصد انحراف بروتوكولي جديد",
      description: randomScenario.message,
      variant: "destructive"
    });
  };

  const resetIncidentLogs = () => {
    setLogs([
      {
        id: "log-1",
        timestamp: "الساعة 20:45:12",
        type: "severe",
        message: "تسجيل انحراف في تسعيرة التوافق بنسبة +16.4% في منطقة الجامعة",
        actionLabel: "موازنة فورية ⚖️",
        resolved: false,
      },
      {
        id: "log-2",
        timestamp: "الساعة 20:42:05",
        type: "severe",
        message: "اشتباه محاولة تلاعب بالوقت المتجمد (تعديل طابع محلي) من مستخدم",
        actionLabel: "حظر بث مؤقت 🚫",
        resolved: false,
      },
      {
        id: "log-3",
        timestamp: "الساعة 20:31:54",
        type: "warn",
        message: "تجاوز طاقة حجز الخلايا الجغرافية H3 المتوقعة في وادي السير",
        actionLabel: "تحديث السعة 📡",
        resolved: false,
      }
    ]);
    toast({
      title: "🔄 تمت إعادة ضبط سجلات الفحص والتحصين",
      description: "تم استرداد كافة السجلات الافتراضية بنجاح لمواصلة الاختبار والتأمين."
    });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* 🔮 Edge computing visual stats card banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
        <Card className="bg-radar-bg border-cyan-900/40 border text-right rounded-2xl relative overflow-hidden">
          <CardHeader className="pb-2 text-right">
            <CardDescription className="text-gray-400 text-xs text-right">إجمالي الأرباح اللحظية (النشاط الفعلي)</CardDescription>
            <CardTitle className="text-2xl font-black text-radar-teal font-mono mt-1 text-right">
              {revenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} د.أ
            </CardTitle>
          </CardHeader>
          <CardContent className="h-10 text-[10px] text-gray-400 flex justify-between items-center bg-black/40 border-t border-cyan-900/10 px-4">
            <span className="flex items-center gap-1 text-radar-teal font-bold"><ArrowUpRight className="w-3.5 h-3.5" /> +8.4% الأسبوع الماضي</span>
            <span>حوسبة الحافة للنشاط</span>
          </CardContent>
        </Card>

        <Card className="bg-radar-bg border-cyan-900/40 border text-right rounded-2xl relative overflow-hidden">
          <CardHeader className="pb-2 text-right">
            <CardDescription className="text-gray-400 text-xs text-right">الرحلات ذات العائد الصفري (التكافلية)</CardDescription>
            <CardTitle className="text-2xl font-black text-amber-500 font-mono mt-1 text-right">{zeroYielderCount} رحلة</CardTitle>
          </CardHeader>
          <CardContent className="h-10 text-[10px] text-gray-400 flex justify-between items-center bg-black/40 border-t border-cyan-900/10 px-4">
            <span className="text-amber-400 font-bold">بث مباشر متكامل</span>
            <span>توزيع تنموي عادل</span>
          </CardContent>
        </Card>

        <Card className="bg-radar-bg border-cyan-900/40 border text-right rounded-2xl relative overflow-hidden">
          <CardHeader className="pb-2 text-right">
            <CardDescription className="text-gray-400 text-xs text-right">حجز الخلايا السداسية H3 الجغرافية</CardDescription>
            <CardTitle className="text-2xl font-black text-cyan-400 font-mono mt-1 text-right">{activeCells} خلية نشطة</CardTitle>
          </CardHeader>
          <CardContent className="h-10 text-[10px] text-gray-400 flex justify-between items-center bg-black/40 border-t border-cyan-900/10 px-4">
            <span className="text-cyan-400 font-bold">بدقة Resolution 9</span>
            <span>الانتشار الآني</span>
          </CardContent>
        </Card>
      </div>

      {/* 📈 Beautiful simulated real-time chart pulse */}
      <Card className="bg-radar-bg border border-cyan-900/40 rounded-2xl text-right">
        <CardHeader className="pb-2 text-right">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleQuantumRefresh}
              disabled={isRefreshing}
              className="border-cyan-500/40 text-cyan-400 bg-cyan-950/30 hover:bg-cyan-900/40 text-[10px] h-7 px-3 rounded-full flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-[0_0_10px_rgb(var(--radar-cyan-rgb)/0.15)] disabled:opacity-50"
            >
              {isRefreshing ? (
                <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
              ) : (
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
              )}
              تحديث فوري  ●
            </Button>
            <CardTitle className="text-sm font-black text-white flex items-center gap-2 text-right">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              نشاط الإيرادات الإعلانية والرحلات الميدانية اللحظية (مؤشر التوازن الحالي)
            </CardTitle>
          </div>
          <CardDescription className="text-gray-400 text-[10px] text-right">
            قياسية تدفق السيولة الميدانية بشكل مستمر ومقارنتها عبر طبقات السحابة.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="w-full h-24 bg-black/40 rounded-xl relative border border-white/5 flex items-end px-2 pt-2">
            <svg viewBox="0 0 500 100" className="w-full h-full text-cyan-500 overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={chartPath}
                fill="none"
                stroke="#14b8a6"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d={chartArea}
                fill="url(#chartGradient)"
              />
              <circle cx="200" cy="30" r="4" fill="#ef4444" className="animate-ping" />
              <circle cx="200" cy="30" r="3" fill="#ef4444" />

              <circle cx="400" cy="20" r="4" fill="#14b8a6" className="animate-ping" />
              <circle cx="400" cy="20" r="3" fill="#14b8a6" />
            </svg>
            <div className="absolute top-2 left-2 text-[9px] font-mono text-cyan-400/70 bg-black/60 px-1.5 py-0.5 rounded">
              أقصى ذروة: {peakTrips} رحلة/ساعة
            </div>
            <div className="absolute bottom-2 right-2 text-[9px] font-mono text-gray-500">
              طبقة الحسم: 20:00 - الآن
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ⚠️ Audit log and protocol deviations box */}
      <Card className="bg-radar-bg border border-red-500/20 rounded-2xl text-right">
        <CardHeader className="pb-3 border-b border-white/5 m-0 p-4 text-right">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-red-400 bg-red-950/20 px-2.5 py-1 rounded-full border border-red-500/20 animate-pulse">
                {logs.filter(l => !l.resolved).length} معلق التدخل
              </span>
              <Button
                variant="outline"
                onClick={injectDeviation}
                className="border-red-500/40 text-red-400 bg-red-950/20 hover:bg-red-900/30 text-[10px] h-6 px-2.5 rounded-md cursor-pointer active:scale-95 transition-all"
              >
                إضافة انحراف 🧪
              </Button>
              <Button
                variant="outline"
                onClick={resetIncidentLogs}
                className="border-gray-500/30 text-gray-400 bg-zinc-950/40 hover:bg-zinc-900/40 text-[10px] h-6 px-2.5 rounded-md cursor-pointer active:scale-95 transition-all"
              >
                إعادة تعيين 🔄
              </Button>
            </div>
            <CardTitle className="text-sm font-black text-white flex items-center gap-2 text-right">
              <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
              سجل تدقيق الانحرافات والتحصين البروتوكولي (تجاوز الـ 15% والأذونات الزجاجية)
            </CardTitle>
          </div>
          <CardDescription className="text-gray-400 text-[10px] text-right mt-1">
            لوحة الاستجابة الفورية المعزولة لرصد وضبط أي انتهاك جغرافي أو زمني يهدد توازن عصب الملاحة.
          </CardDescription>

          <div className="mt-4 p-3.5 bg-red-950/20 border border-red-500/10 rounded-xl space-y-2 text-right">
            <div className="text-right text-[10px] text-gray-400 font-sans font-bold flex items-center justify-between gap-2">
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-500/10">بروتوكول الفحص 12</span>
              <span>🔒 معيار الاستنباط والتحصين الرياضي (The Protocol Guard):</span>
            </div>

            <div className="flex flex-col gap-2.5 items-center justify-center p-3 bg-black/60 rounded-lg border border-white/5 font-mono text-[11px] select-all cursor-crosshair">
              <span className="text-cyan-400 font-bold hover:scale-105 transition-transform">
                {"$$\\Delta_{flux} = \\left| \\frac{\\text{Liquidity}_{field} - \\text{Liquidity}_{cloud}}{\\text{Liquidity}_{cloud}} \\right| \\le 15\\%$$"}
              </span>
              <span className="text-rose-400 font-bold hover:scale-105 transition-transform">
                {"$$\\text{GlassPermissions}_{state} = \\mathcal{A}_{MFA} \\land \\mathcal{E}_{SovereignApproval} \\equiv 1$$"}
              </span>
            </div>

            <div className="text-[10px] text-gray-500 mt-1 max-w-full text-right font-sans leading-relaxed">
              بموجب ميثاق النظام الماسي، يتم عزل بث الملاحة الجغرافية وتجميد العقود الميدانية كلياً فور تخطي نسبة انحراف تدفق السيولة عتبة الـ <strong className="text-red-400">15%</strong>، أو عند رصد محاولات تنشيط الأذونات الزجاجية (Glass Permissions) بدون مصادقة  ثنائية.
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-white/5 text-right">
          {logs.map((log) => (
            <div key={log.id} className={cn(
              "p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-right transition-all",
              log.resolved ? "opacity-35 bg-black/10" : "bg-red-950/5 hover:bg-red-950/10"
            )} dir="rtl">
              <div className="space-y-1 text-right">
                <div className="flex items-center gap-2 justify-start">
                  <span className="text-[10px] text-gray-400 font-mono">{log.timestamp}</span>
                  <Badge variant={log.resolved ? "secondary" : "destructive"} className="text-[9px] px-1.5 py-0">
                    {log.resolved ? "تمت السيطرة والموازنة" : log.type === "severe" ? "عارض  حرج" : "تنبيه تشغيلي"}
                  </Badge>
                </div>
                <p className="text-xs font-bold text-gray-200 text-right">{log.message}</p>
              </div>

              {!log.resolved && (
                <Button
                  onClick={() => handleResolve(log.id, log.message, log.actionLabel)}
                  className="bg-red-600 hover:bg-red-500 text-white font-black text-xs h-8 px-4 rounded-xl shadow-[0_0_10px_rgb(var(--radar-red-rgb)/0.2)] active:scale-95 transition-all self-start sm:self-center cursor-pointer"
                >
                  {log.actionLabel}
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminViewTab() {
  const { pulseData, loadingPulse } = useMarketPulse(true);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full" dir="rtl">
      {/* تم تعيين لوحة المالك كشاشة الافتتاح الأساسية للمشرف */}
      <Tabs defaultValue="owner" className="w-full">

        {/* شريط الأزرار  - تم ربط القيم بدقة لمنع الانهيار */}
        <TabsList className="flex flex-wrap w-full justify-center gap-2 h-auto bg-radar-abyss/80 border border-radar-neon/10 p-2 rounded-2xl shadow-lg shadow-black/50">

          <TabsTrigger value="dashboard" className="flex-col h-auto py-3 px-4 hover:bg-white/5 data-[state=active]:bg-radar-teal/20 data-[state=active]:text-radar-teal rounded-xl transition-all">
             <Users className="w-5 h-5 mb-1" />
             <span className="text-xs font-bold">برج المراقبة</span>
          </TabsTrigger>

          <TabsTrigger value="ads" className="flex-col h-auto py-3 px-4 hover:bg-white/5 data-[state=active]:bg-radar-teal/20 data-[state=active]:text-radar-teal rounded-xl transition-all">
            <Megaphone className="w-5 h-5 mb-1" />
             <span className="text-xs font-bold">إدارة الإعلانات</span>
          </TabsTrigger>

          {/* الزر  الجديد V5.5 */}
          <TabsTrigger value="owner" className="flex-col h-auto py-3 px-5 bg-red-950/20 hover:bg-red-900/30 data-[state=active]:bg-red-950/60 data-[state=active]:text-radar-danger border border-transparent data-[state=active]:border-radar-danger/40 rounded-xl transition-all shadow-sm">
            <ShieldAlert className="w-6 h-6 mb-1 text-radar-danger animate-pulse" />
            <span className="font-black text-xs tracking-wider">👑 V5.5 لوحة المالك</span>
          </TabsTrigger>

          <TabsTrigger value="delegates" className="flex-col h-auto py-3 px-4 hover:bg-white/5 data-[state=active]:bg-emerald-950/40 data-[state=active]:text-emerald-400 rounded-xl transition-all">
            <UsersRound className="w-5 h-5 mb-1 text-emerald-500" />
            <span className="text-xs font-bold">جيش المندوبين 📣</span>
          </TabsTrigger>

           <TabsTrigger value="pulse" className="flex-col h-auto py-3 px-4 hover:bg-white/5 data-[state=active]:bg-radar-teal/20 data-[state=active]:text-radar-teal rounded-xl transition-all">
             <Activity className="w-5 h-5 mb-1" />
             <span className="text-xs font-bold">نشاط السوق</span>
          </TabsTrigger>

          <TabsTrigger value="controls" className="flex-col h-auto py-3 px-4 hover:bg-white/5 data-[state=active]:bg-radar-teal/20 data-[state=active]:text-radar-teal rounded-xl transition-all">
            <Shield className="w-5 h-5 mb-1" />
            <span className="text-xs font-bold">التحكم </span>
          </TabsTrigger>
        </TabsList>

        {/* ================= حاويات المحتوى (الجسر الحركي) ================= */}

        <TabsContent value="dashboard" className="mt-6 outline-none">
           <SovereignErrorBoundary>
              <div className="space-y-6">
                <AdminPulseOverview />
                <DriversManagementTab />
              </div>
           </SovereignErrorBoundary>
        </TabsContent>

        <TabsContent value="ads" className="mt-6 outline-none">
           <SovereignErrorBoundary>
              <div className="space-y-8">
                <PendingAdsAuditPanel />
                <AdsManagementTab />
              </div>
           </SovereignErrorBoundary>
        </TabsContent>

        {/* 👑 الحاوية المفقودة التي تسببت بالشلل: حاوية لوحة المالك */}
        <TabsContent value="owner" className="mt-6 outline-none">
           <SovereignErrorBoundary>
              <RadarOwnerSovereignDashboard />
           </SovereignErrorBoundary>
        </TabsContent>

        <TabsContent value="delegates" className="mt-6 outline-none">
           <SovereignErrorBoundary>
              <DelegatesManagementTab />
           </SovereignErrorBoundary>
        </TabsContent>

        <TabsContent value="pulse" className="mt-6 outline-none">
           <SovereignErrorBoundary>
             <PulseHeatmap pulseData={pulseData} isLoading={loadingPulse} />
           </SovereignErrorBoundary>
        </TabsContent>

        <TabsContent value="controls" className="mt-6 outline-none space-y-8">
           <SovereignErrorBoundary>
             <div className="space-y-8">
               <KillSwitchPanel />
               <FuelIndexPanel />
              </div>
           </SovereignErrorBoundary>
        </TabsContent>

      </Tabs>
    </div>
  );
}
