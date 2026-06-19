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
import { Shield, Megaphone, Users, Activity, UsersRound, ShieldAlert, CheckCircle2, Loader2, ArrowUpRight, TrendingUp, AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';
import { useAdminAds } from '@/hooks/use-admin-ads';
import { useAdLifecycle } from '@/hooks/use-ad-lifecycle';
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
    <Card className="bg-black/90 border border-amber-500/30 overflow-hidden relative shadow-[0_4px_20px_rgba(245,158,11,0.05)] rounded-2xl flex flex-col text-right" dir="rtl">
      {posterUrl && (
        <div className="relative h-40 w-full overflow-hidden bg-zinc-900">
          <img src={posterUrl} alt={title} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
          <Badge className="absolute top-3 right-3 bg-amber-500 hover:bg-amber-600 text-black font-black">
            قيد الفحص الجنائي 🔍
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-3 text-right">
        <div className="flex justify-between items-start gap-2">
          {!posterUrl && (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-black font-black">
              قيد الفحص الجنائي 🔍
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
              {ad.role === 'all' ? 'الجميع' : ad.role === 'driver' ? 'الكباتن' : 'المسافرون'}
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
              اعتماد وقذف للنهر
            </Button>
            <Button
              onClick={() => setRejecting(true)}
              variant="destructive"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-500 text-white font-black text-xs py-2 h-9 rounded-xl active:scale-[0.98] transition-all"
            >
              <ShieldAlert className="w-4 h-4 ml-1" />
              إعدام سيادي
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200 text-right">
            <Label className="text-[10px] text-red-400 font-bold font-sans">مبرر الرفض الجنائي (صيغة الإفادة الرسمية):</Label>
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
                تأكيد الإعدام
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
  const { approveAd, rejectAd } = useAdminAds();
  const { pendingAds, loading: isLoading } = useAdLifecycle();

  if (isLoading) {
    return (
      <div className="bg-[#0A0D14]/90 p-6 rounded-2xl border border-amber-500/20 text-center animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
        <p className="text-gray-400 text-xs mt-2 font-sans">بانتظار تدفق المذكرة السحابية للحملات المعلقة...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-amber-950/20 border border-amber-500/20 p-4 rounded-2xl text-right" dir="rtl">
        <div>
          <h3 className="text-sm sm:text-base font-black text-amber-400 flex items-center gap-2 text-right">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            منصة حوكمة الإعلانات واعتماد الفحص الجنائي
          </h3>
          <p className="text-gray-400 text-[10px] sm:text-[11px] mt-0.5 text-right">
            كل الحملات المرفوعة من المعلنين تخضع للتصفية هنا. يُحظر بث أي حملة للميكانيكا أو الرحلات دون تصديق سيادي مطلق.
          </p>
        </div>
        <Badge className="bg-amber-500 text-black font-black font-sans px-2.5 py-1 text-xs rounded-full animate-pulse">
          {pendingAds.length} معلّقة
        </Badge>
      </div>

      {pendingAds.length === 0 ? (
        <div className="bg-[#0A0D14]/90 p-8 rounded-2xl border border-zinc-800/40 text-center flex flex-col items-center justify-center text-right" dir="rtl">
          <div className="w-10 h-10 bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-2">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="text-xs sm:text-sm font-black text-white">النبض سليم طهور</h4>
          <p className="text-gray-400 text-[11px] mt-0.5 font-sans">
            لا توجد حالياً أي حملات معلقة قيد الانتظار. جميع حملات المعلنين مصدقة ونشطة في النهر النسيجي.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
  );
}

export function AdminPulseOverview() {
  const [logs, setLogs] = useState([
    {
      id: "log-1",
      timestamp: "الساعة 20:45:12",
      type: "severe",
      message: "تسجيل انحراف في تسعيرة التوافق بنسبة +16.4% في لواء الجامعة",
      actionLabel: "موازنة فورية ⚖️",
      resolved: false,
    },
    {
      id: "log-2",
      timestamp: "الساعة 20:42:05",
      type: "severe",
      message: "اشتباه محاولة تلاعب بالوقت المتجمد (تعديل طابع نسيجي) من مستخدم",
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

  const handleResolve = (id: string, message: string, actionName: string) => {
    setLogs(prev => prev.map(log => log.id === id ? { ...log, resolved: true } : log));
    toast({
      title: "🛡️ تدخل سيادي ناجح",
      description: `تم إخضاع المنظومة بنجاح وإجراء: ${actionName} لحل "${message}".`
    });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* 🔮 Edge computing visual stats card banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
        <Card className="bg-[#090e1a] border-cyan-900/40 border text-right rounded-2xl relative overflow-hidden">
          <CardHeader className="pb-2 text-right">
            <CardDescription className="text-gray-400 text-xs text-right">إجمالي الأرباح اللحظية (النبض الفعلي)</CardDescription>
            <CardTitle className="text-2xl font-black text-[#14b8a6] font-mono mt-1 text-right">1,489.20 د.أ</CardTitle>
          </CardHeader>
          <CardContent className="h-10 text-[10px] text-gray-400 flex justify-between items-center bg-black/40 border-t border-cyan-900/10 px-4">
            <span className="flex items-center gap-1 text-[#14b8a6] font-bold"><ArrowUpRight className="w-3.5 h-3.5" /> +8.4% الأسبوع الماضي</span>
            <span>حوسبة الحافة للنبض</span>
          </CardContent>
        </Card>

        <Card className="bg-[#090e1a] border-cyan-900/40 border text-right rounded-2xl relative overflow-hidden">
          <CardHeader className="pb-2 text-right">
            <CardDescription className="text-gray-400 text-xs text-right">الرحلات ذات العائد الصفري (التكافلية)</CardDescription>
            <CardTitle className="text-2xl font-black text-amber-500 font-mono mt-1 text-right">42 رحلة</CardTitle>
          </CardHeader>
          <CardContent className="h-10 text-[10px] text-gray-400 flex justify-between items-center bg-black/40 border-t border-cyan-900/10 px-4">
            <span className="text-amber-400 font-bold">بث مباشر متكامل</span>
            <span>توزيع تنموي عادل</span>
          </CardContent>
        </Card>

        <Card className="bg-[#090e1a] border-cyan-900/40 border text-right rounded-2xl relative overflow-hidden">
          <CardHeader className="pb-2 text-right">
            <CardDescription className="text-gray-400 text-xs text-right">حجز الخلايا السداسية H3 الجغرافية</CardDescription>
            <CardTitle className="text-2xl font-black text-cyan-400 font-mono mt-1 text-right">168 خلية نشطة</CardTitle>
          </CardHeader>
          <CardContent className="h-10 text-[10px] text-gray-400 flex justify-between items-center bg-black/40 border-t border-cyan-900/10 px-4">
            <span className="text-cyan-400 font-bold">بدقة Resolution 9</span>
            <span>الانتشار الآني</span>
          </CardContent>
        </Card>
      </div>

      {/* 📈 Beautiful simulated real-time chart pulse */}
      <Card className="bg-[#090e1a] border border-cyan-900/40 rounded-2xl text-right">
        <CardHeader className="pb-2 text-right">
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-950/20 text-[10px]">تحديث فوري كوانتي ●</Badge>
            <CardTitle className="text-sm font-black text-white flex items-center gap-2 text-right">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              نبض الإيرادات الإعلانية والرحلات الميدانية اللحظية (مؤشر التوازن الدستوري)
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
                d="M0,80 Q50,40 100,60 T200,30 T300,50 T400,20 T500,45"
                fill="none"
                stroke="#14b8a6"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M0,80 Q50,40 100,60 T200,30 T300,50 T400,20 T500,45 L500,100 L0,100 Z"
                fill="url(#chartGradient)"
              />
              <circle cx="200" cy="30" r="4" fill="#ef4444" className="animate-ping" />
              <circle cx="200" cy="30" r="3" fill="#ef4444" />
              
              <circle cx="400" cy="20" r="4" fill="#14b8a6" className="animate-ping" />
              <circle cx="400" cy="20" r="3" fill="#14b8a6" />
            </svg>
            <div className="absolute top-2 left-2 text-[9px] font-mono text-cyan-400/70 bg-black/60 px-1.5 py-0.5 rounded">
              أقصى ذروة: 247 رحلة/ساعة
            </div>
            <div className="absolute bottom-2 right-2 text-[9px] font-mono text-gray-500">
              طبقة الحسم: 20:00 - الآن
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ⚠️ Audit log and protocol deviations box */}
      <Card className="bg-[#090e1a] border border-red-500/20 rounded-2xl text-right">
        <CardHeader className="pb-2 border-b border-white/5 text-right">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-red-400 bg-red-950/20 px-2.5 py-1 rounded-full border border-red-500/20 animate-pulse">
              {logs.filter(l => !l.resolved).length} معلق التدخل
            </span>
            <CardTitle className="text-sm font-black text-white flex items-center gap-2 text-right">
              <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
              سجل تدقيق الانحرافات والتحصين البروتوكولي (تجاوز الـ 15% والأذونات الزجاجية)
            </CardTitle>
          </div>
          <CardDescription className="text-gray-400 text-[10px] text-right">
            لوحة الاستجابة الفورية المعزولة لرصد وضبط أي انتهاك جغرافي أو زمني يهدد توازن عصب الملاحة.
          </CardDescription>
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
                    {log.resolved ? "تمت السيطرة والموازنة" : log.type === "severe" ? "عارض دستوري حرج" : "تنبيه تشغيلي"}
                  </Badge>
                </div>
                <p className="text-xs font-bold text-gray-200 text-right">{log.message}</p>
              </div>

              {!log.resolved && (
                <Button
                  onClick={() => handleResolve(log.id, log.message, log.actionLabel)}
                  className="bg-red-600 hover:bg-red-500 text-white font-black text-xs h-8 px-4 rounded-xl shadow-[0_0_10px_rgba(239,68,68,0.2)] active:scale-95 transition-all self-start sm:self-center cursor-pointer"
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
      {/* تم تعيين قمرة المالك كشاشة الافتتاح الأساسية للمشرف */}
      <Tabs defaultValue="owner" className="w-full">
        
        {/* شريط الأزرار السيادي - تم ربط القيم بدقة لمنع الانهيار */}
        <TabsList className="flex flex-wrap w-full justify-center gap-2 h-auto bg-[#050a0f]/80 border border-[#00ffcc]/10 p-2 rounded-2xl shadow-lg shadow-black/50">
          
          <TabsTrigger value="dashboard" className="flex-col h-auto py-3 px-4 hover:bg-white/5 data-[state=active]:bg-[#14b8a6]/20 data-[state=active]:text-[#14b8a6] rounded-xl transition-all">
             <Users className="w-5 h-5 mb-1" />
             <span className="text-xs font-bold">برج المراقبة</span>
          </TabsTrigger>

          <TabsTrigger value="ads" className="flex-col h-auto py-3 px-4 hover:bg-white/5 data-[state=active]:bg-[#14b8a6]/20 data-[state=active]:text-[#14b8a6] rounded-xl transition-all">
            <Megaphone className="w-5 h-5 mb-1" />
             <span className="text-xs font-bold">إدارة الإعلانات</span>
          </TabsTrigger>

          {/* الزر السيادي الجديد V5.5 */}
          <TabsTrigger value="owner" className="flex-col h-auto py-3 px-5 bg-red-950/20 hover:bg-red-900/30 data-[state=active]:bg-red-950/60 data-[state=active]:text-[#ff3366] border border-transparent data-[state=active]:border-[#ff3366]/40 rounded-xl transition-all shadow-sm">
            <ShieldAlert className="w-6 h-6 mb-1 text-[#ff3366] animate-pulse" />
            <span className="font-black text-xs tracking-wider">👑 V5.5 قمرة المالك</span>
          </TabsTrigger>

          <TabsTrigger value="delegates" className="flex-col h-auto py-3 px-4 hover:bg-white/5 data-[state=active]:bg-emerald-950/40 data-[state=active]:text-emerald-400 rounded-xl transition-all">
            <UsersRound className="w-5 h-5 mb-1 text-emerald-500" />
            <span className="text-xs font-bold">جيش المندوبين 📣</span>
          </TabsTrigger>

           <TabsTrigger value="pulse" className="flex-col h-auto py-3 px-4 hover:bg-white/5 data-[state=active]:bg-[#14b8a6]/20 data-[state=active]:text-[#14b8a6] rounded-xl transition-all">
             <Activity className="w-5 h-5 mb-1" />
             <span className="text-xs font-bold">نبض السوق</span>
          </TabsTrigger>

          <TabsTrigger value="controls" className="flex-col h-auto py-3 px-4 hover:bg-white/5 data-[state=active]:bg-[#14b8a6]/20 data-[state=active]:text-[#14b8a6] rounded-xl transition-all">
            <Shield className="w-5 h-5 mb-1" />
            <span className="text-xs font-bold">التحكم السيادي</span>
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

        {/* 👑 الحاوية المفقودة التي تسببت بالشلل: حاوية قمرة المالك */}
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
