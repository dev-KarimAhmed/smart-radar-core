'use client';

import React, { useState, useEffect } from 'react';
import { useDriverOperations } from '@/hooks/use-driver-operations';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { 
  Shield, 
  Clock, 
  Award, 
  Bell, 
  MessageSquare, 
  Zap, 
  Activity, 
  AlertTriangle,
  Gift,
  HelpCircle,
  PlusCircle,
  TrendingDown,
  TrendingUp,
  UserCheck,
  CheckCircle,
  MapPin,
  Search,
  BookOpen
} from 'lucide-react';
import { SOVEREIGN_ERR_DICTIONARY } from '@/core/config/sovereign-errors';

interface CaptainDashboardProps {
  captainProfile?: {
    id: string;
    rank: 'PLATINUM' | 'GOLD' | 'BRONZE' | 'SILVER';
    walletHours: number;
    bonusHours: number;
    rating: number;
    weeklyComments: string[]; // تعليقات مجهولة مطهرة برمجياً
  };
}

export const RadarCaptainDashboard: React.FC<CaptainDashboardProps> = ({ captainProfile: propProfile }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentDistrict, currentH3Cell, driverStatus, isDisconnectionLockActive, toggleDriverStatus } = useDriverOperations() || {};

  const captainProfile = React.useMemo(() => {
    if (propProfile) return propProfile;

    const defaultComments = [
      'المركبة نظيفة جداً والكابتن متعاون للغاية.',
      'قيادة متزنة وملتزم تماماً بكوابح الأسعار القانونية باللواء.',
      'سرعة ممتازة وتواصل حكيم ومحترم ومهذب.'
    ];

    const ratingVal = user?.rating !== undefined 
      ? user.rating 
      : (user?.ratingSum && user?.ratingCount ? user.ratingSum / user.ratingCount : 5.0);

    return {
      id: user?.uid || 'temp-id',
      rank: (user?.rank ? user.rank.toUpperCase() : 'GOLD') as 'PLATINUM' | 'GOLD' | 'BRONZE' | 'SILVER',
      walletHours: user?.paidHoursRemaining !== undefined ? user.paidHoursRemaining : 180, 
      bonusHours: user?.bonusHoursRemaining !== undefined ? user.bonusHoursRemaining : 120, 
      rating: ratingVal,
      weeklyComments: defaultComments
    };
  }, [propProfile, user]);

  const isRadarActive = driverStatus === 'active' || driverStatus === 'busy';
  const localHours = captainProfile.walletHours;
  const localBonusHours = captainProfile.bonusHours;
  const [activePool, setActivePool] = useState<'wallet' | 'bonus'>('wallet');
  
  // Recharging system state
  const [showRechargeDialog, setShowRechargeDialog] = useState<boolean>(false);
  const [selectedPlanHours, setSelectedPlanHours] = useState<number>(24);

  // 🛡️ [حالة كشاف قاموس الأخطاء السيادي]
  const [errSearchQuery, setErrSearchQuery] = useState('');
  const [selectedErrCategory, setSelectedErrCategory] = useState<'ALL' | 'SOV' | 'FIN' | 'MAP' | 'ADV' | 'KNL'>('ALL');
  const [expandedErrorCode, setExpandedErrorCode] = useState<string | null>(null);

  const filteredErrors = React.useMemo(() => {
    return Object.values(SOVEREIGN_ERR_DICTIONARY).filter(err => {
      const matchCategory = 
        selectedErrCategory === 'ALL' ||
        (selectedErrCategory === 'SOV' && err.code.startsWith('ERR-SOV-')) ||
        (selectedErrCategory === 'FIN' && err.code.startsWith('ERR-FIN-')) ||
        (selectedErrCategory === 'MAP' && err.code.startsWith('ERR-MAP-')) ||
        (selectedErrCategory === 'ADV' && err.code.startsWith('ERR-ADV-')) ||
        (selectedErrCategory === 'KNL' && err.code.startsWith('ERR-KNL-'));

      const matchSearch = 
        err.code.toLowerCase().includes(errSearchQuery.toLowerCase()) ||
        err.name.toLowerCase().includes(errSearchQuery.toLowerCase()) ||
        err.description.toLowerCase().includes(errSearchQuery.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [errSearchQuery, selectedErrCategory]);

  // Geographic bulletin log feed
  const [bulletins, setBulletins] = useState<Array<{ id: string; category: string; content: string; geo: string; timestamp: string; level: 'critical' | 'warning' | 'info' }>>([
    {
      id: '1',
      category: 'تنظيم وتوجيه',
      content: 'تنبيه للكباتن النشطين: يرجى الحفاظ على استقرار الفوارق السعرية بمحيط جبل عمان لمنع فرض كوابح التجميد للمزاد.',
      geo: 'لواء ناعور / عمان الغربية',
      timestamp: 'منذ ١٢ دقيقة',
      level: 'warning'
    },
    {
      id: '2',
      category: 'أمان السوق',
      content: 'تم تفعيل بروتوكول الذوبان النسيجي [SCR-COMMUTE-PROTO-155] بنجاح في لواء الشونة الجنوبية لضمان انسياب الحصص.',
      geo: 'لواء الشونة الجنوبية',
      timestamp: 'منذ ٢ ساعة',
      level: 'info'
    },
    {
      id: '3',
      category: 'حزام الأمن السعري',
      content: 'تحذير سيادي: تم تجميد حساب مركب لم يتجاوب مع التنبيه الأول عند خفض السعر بنسبة تجاوزت ١٥٪ عن حد السوق المرجعي.',
      geo: 'عمان الكبرى',
      timestamp: 'منذ ٤ ساعة',
      level: 'critical'
    }
  ]);

  const handlePulseToggle = () => {
    if (!toggleDriverStatus) return;
    const nextState = !isRadarActive;
    toggleDriverStatus(nextState ? 'active' : 'idle');
    toast({
      title: nextState ? '📡 تم تشغيل النبض الميداني' : '⏸️ تم تفعيل جدار التجميد والاستراحة',
      description: nextState 
        ? 'تم تفعيل الاتصال بكامل طاقة مستشعرات السوق وعرض الترددات الحية.' 
        : 'الوقت متجمد بالكامل ومحمي بصفر تكلفة لمنع تسرب الثواني المقتطعة.'
    });
  };

  const handleRechargeHours = async (hours: number, price: number) => {
    try {
      const userRef = doc(db, 'users', captainProfile.id);
      await updateDoc(userRef, {
        paidHoursRemaining: increment(hours * 60),
        subscriptionHours: increment(hours)
      });
      setShowRechargeDialog(false);
      toast({
        title: '✅ شحن ناجح ومؤمن برمجياً',
        description: `تم إضافة باقة ساعات عبور صافية مرسلة لوتدك المالي بقيمة ${hours} ساعة بنجاح.`
      });
    } catch (err) {
      console.error("Error recharging hours in captain dashboard:", err);
      toast({
        variant: 'destructive',
        title: '❌ فشل في عملية الشحن',
        description: 'حدث خطأ غير متوقع أثناء تحديث الرصيد السحابي.'
      });
    }
  };

  // معايير الرتبة وشريط التقدم التفاعلي
  const getRankDetails = (rank: 'PLATINUM' | 'GOLD' | 'BRONZE' | 'SILVER') => {
    switch (rank) {
      case 'PLATINUM':
        return { name: 'بلاتيني سيادي', color: '#00ffcc', progress: 95, shieldClass: 'from-emerald-600 to-teal-500' };
      case 'GOLD':
        return { name: 'ذهبي ممتاز', color: '#fbbf24', progress: 75, shieldClass: 'from-amber-600 to-yellow-500' };
      case 'SILVER':
        return { name: 'فضي مستقر', color: '#94a3b8', progress: 50, shieldClass: 'from-slate-500 to-slate-400' };
      default:
        return { name: 'برونزي صاعد', color: '#b45309', progress: 25, shieldClass: 'from-amber-800 to-amber-700' };
    }
  };

  const rankInfo = getRankDetails(captainProfile.rank);
  const isCriticalRating = captainProfile.rating <= 4.3;

  return (
    <div className="radar-sovereign-container w-full rounded-2xl border border-emerald-950/40 bg-[#050505] text-white p-4 sm:p-6 font-mono text-right shadow-[0_20px_50px_rgba(16,185,129,0.06)] relative overflow-hidden" dir="rtl">
      
      {/* الخلفية الهندسية المعقمة من الخرائط الخيالية */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* الرأس والقشرة الخارجية لقمرة العمليات */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#111] pb-5 mb-5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRadarActive ? 'bg-[#00ffcc]' : 'bg-red-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRadarActive ? 'bg-[#00ffcc]' : 'bg-red-500'}`}></span>
            </span>
            <h2 className="text-md sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              🛡️ قمرة العمليات السيادية لعقود الساعات
            </h2>
          </div>
          <p className="text-[10px] text-gray-400 font-sans mt-1 leading-relaxed">
            التحكم الذاتي الكلي في نبض البث الترددي، واستقرار رصيد الساعات الحية، والاطلاع الأمني المجهول.
          </p>
        </div>

        <button
          onClick={handlePulseToggle}
          className="px-4 py-2 text-xs font-black rounded-xl border border-white/5 transition-all duration-300 shadow-md transform hover:scale-[1.02] active:scale-98 select-none flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
          style={{
            backgroundColor: isRadarActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            borderColor: isRadarActive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            color: isRadarActive ? '#00ffcc' : '#f87171'
          }}
        >
          <Activity className={`w-3.5 h-3.5 ${isRadarActive ? 'animate-pulse' : ''}`} />
          {isRadarActive ? '📡 النبض نشط (بث ومزادات حية مجنزرة)' : '⏳ وضع الاستراحة (الوقت متجمد)'}
        </button>
      </div>

      {/* المادة (1) صندوق العداد الزمني للاشتراكات والنبض (Time-Locked Token Pass) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        
        {/* العداد الأساسي وأسلوب التبديد والتحجم المحمي */}
        <div className="relative p-4 rounded-xl bg-gradient-to-br from-[#070b07] to-black border border-emerald-900/20 shadow-inner flex flex-col justify-between min-h-[140px] group">
          <div className="absolute top-2 left-2 text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
            رصيد اشتراك الوقت الصافي
          </div>
          
          <div className="space-y-1">
            <span className="text-[9px] text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-500" /> رصيد الوقت الأساسي المتجمد
            </span>
            <div className="text-3xl font-extrabold text-[#00ffcc] tracking-tight py-1 font-mono filter drop-shadow-[0_0_8px_rgba(0,255,200,0.1)]">
              {Math.floor(localHours / 60)}<span className="text-xs text-gray-500 font-sans mx-1">ساعة</span> {localHours % 60}<span className="text-xs text-gray-500 font-sans mx-1">دقيقة</span>
            </div>
            <p className="text-[9px] text-[#557] font-sans leading-normal">
              يتجمد العداد تلقائياً عند تعطيل النبض لحمايتك من فقدان الاشتراكات.
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-[#1a2a1a]/30 flex items-center justify-between gap-2">
            <button
              onClick={() => setActivePool('wallet')}
              className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${activePool === 'wallet' ? 'bg-[#00ffcc]/10 text-[#00ffcc] border-[#00ffcc]/40' : 'bg-transparent text-gray-400 border-white/5 hover:bg-white/5'}`}
            >
              الاستهلاك من المحفظة الأساسية {activePool === 'wallet' && '●'}
            </button>
            <button
              onClick={() => setShowRechargeDialog(true)}
              className="px-2.5 py-1 text-[10px] font-bold bg-[#10b981] hover:bg-[#059669] text-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
            >
              <PlusCircle className="w-3 h-3" /> شحن
            </button>
          </div>
        </div>

        {/* المادة (2) كتلة تطور الرتب عقود بونص الساعات الحرة */}
        <div className="relative p-4 rounded-xl bg-gradient-to-br from-[#0c0d10] to-black border border-blue-950/30 shadow-inner flex flex-col justify-between min-h-[140px]">
          <div className="absolute top-2 left-2 text-[8px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
            <Award className="w-2.5 h-2.5" /> باقة الرتب والأوراق المالية
          </div>

          <div className="space-y-1">
            <span className="text-[9px] text-gray-400 block">رصيد بونص الرتبة [{rankInfo.name}]</span>
            <div className={`text-2xl font-extrabold tracking-tight py-1 font-mono`} style={{ color: rankInfo.color }}>
              {Math.floor(localBonusHours / 60)}<span className="text-xs text-gray-500 font-sans mx-1">ساعة</span> {localBonusHours % 60}<span className="text-xs text-gray-500 font-sans mx-1">دقيقة بونص</span>
            </div>
            
            {/* شريط تقدم تطور الراتب وعقود الرتب */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[8px] text-gray-500">
                <span>تطور الرتبة للبلاتيني:</span>
                <span>{rankInfo.progress}%</span>
              </div>
              <div className="w-full bg-[#111] h-1.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-500" 
                  style={{ width: `${rankInfo.progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#1a1c22]/50 flex items-center justify-between gap-2 text-[9px] text-[#888]">
            <button
              onClick={() => setActivePool('bonus')}
              className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${activePool === 'bonus' ? 'bg-amber-400/10 text-amber-400 border-amber-400/40' : 'bg-transparent text-gray-400 border-white/5 hover:bg-white/5'}`}
            >
              الاستهلاك من البونص الممنوح {activePool === 'bonus' && '●'}
            </button>
          </div>
        </div>

      </div>

      {/* المادة (3) الملاحظة القانونية والدستورية الثابتة لقسم البونص */}
      <div className="bg-[#0c0905] border border-amber-950/20 p-2.5 rounded-xl flex items-start gap-2 mb-5">
        <Gift className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
        <p className="text-[9.5px] leading-relaxed text-amber-200/90 font-sans">
          <strong>ميثاق السيادة والاستحقاق الحر:</strong> ساعات البونص هي مكافأة من الرادار لقاء التزامك بكوابح السوق ونبض السعر باللواء؛ لك كامل السيادة في استغلالها وقت عملك أو راحتك بطريقتك الخاصة دون أي اقتطاع مالي أو شروط استثنائية.
        </p>
      </div>

      {/* الميدان والارتحال وحصانة الاتصال (SCR-COMMUTE-PROTO-155) */}
      <div className="p-3.5 bg-black border border-white/5 rounded-xl space-y-3 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-2 gap-2">
          <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 animate-pulse text-blue-400" /> بوابة الارتحال النسيجي اللحظي [SCR-COMMUTE-PROTO-155]
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {isDisconnectionLockActive ? (
              <span className="text-[8px] bg-red-950/60 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full animate-pulse font-sans">
                🔒 قفل المصافحة: تالف بانتظار الموازنة
              </span>
            ) : (
              <span className="text-[8px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full font-sans">
                💎 قفل المصافحة: معقم ونشط
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-right">
            <span className="text-[8px] text-gray-500 block">⚓ وتد التسجيل الأصلي:</span>
            <span className="text-[11px] font-bold text-gray-300">لواء {captainProfile.id ? 'وادي السير' : 'وادي السير'}</span>
          </div>
          <div className="p-2 bg-[#020509] rounded-lg border border-blue-900/10 text-right">
            <span className="text-[8px] text-blue-400 block block">🚗 لواء المزاد اللحظي:</span>
            <span className="text-[11px] font-black text-emerald-400">لواء {currentDistrict || 'وادي السير'}</span>
          </div>
          <div className="p-2 bg-white/5 rounded-lg border border-white/5 col-span-2 md:col-span-1 text-right">
            <span className="text-[8px] text-gray-500 block">🗺️ خلية H3 اللحظية (Res 9):</span>
            <span className="text-[10px] font-mono font-bold text-amber-500 truncate block">{currentH3Cell || '0x892f35ffffffff'}</span>
          </div>
        </div>
        <p className="text-[8.5px] text-gray-400 leading-relaxed font-sans mt-1">
          🛡️ يذوب نظامك وهاتفك برمجياً وميدانياً في اللواء المستهدف الذي تتواجد فيه لحظياً لعرض الإرسال بكفاءة، مع حفظ حقوق وتد منشئك المسجل.
        </p>
      </div>

      {/* المادة (4) مركز التنبيهات الجغرافية الصارم والإنذارات الموجهة (Four-Dimensional Push Hub) */}
      <div className="bg-[#0b0c10] border border-blue-950/20 rounded-xl p-4 mb-5 space-y-3">
        <h4 className="text-[11px] text-[#00ffcc] font-black border-b border-white/5 pb-2 flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-[#00ffcc] animate-bounce" /> بث ومستشعرات الرادار الموجه وموازين التنبيهات الجغرافية:
        </h4>
        
        <div className="space-y-2.5 max-h-[160px] overflow-y-auto pl-1 pr-0.5">
          {bulletins.map((bulletin) => (
            <div 
              key={bulletin.id} 
              className={`p-2.5 rounded-lg border text-right text-[10px] font-sans leading-normal ${
                bulletin.level === 'critical' 
                  ? 'bg-red-950/20 border-red-500/20 text-red-200' 
                  : bulletin.level === 'warning' 
                  ? 'bg-amber-950/20 border-amber-500/20 text-amber-200' 
                  : 'bg-blue-950/20 border-blue-500/20 text-blue-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold flex items-center gap-1 text-[10.5px]">
                  {bulletin.level === 'critical' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                  {bulletin.level === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                  {bulletin.level === 'info' && <CheckCircle className="w-3.5 h-3.5 text-blue-400" />}
                  [{bulletin.category}]
                </span>
                <span className="text-[8px] text-gray-500">{bulletin.timestamp}</span>
              </div>
              <p>{bulletin.content}</p>
              <div className="mt-1 flex items-center gap-1 text-[8px] text-gray-500 font-mono">
                <MapPin className="w-2.5 h-2.5" /> الاستهداف: مجمع {bulletin.geo}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🛡️ القاموس السيادي للأخطاء (SSOT Error Explorer) */}
      <div className="bg-[#0b0c10] border border-emerald-950/20 rounded-xl p-4 mb-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-2.5 gap-2">
          <h4 className="text-[11px] text-[#00ffcc] font-black flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[#00ffcc]" /> المرجع الأمني الحافة: القاموس السيادي للأخطاء (SSOT Explorer)
          </h4>
          <span className="text-[8px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 font-mono">
            الإصدار V5.5 - قطعي ومحلي
          </span>
        </div>

        <p className="text-[9.5px] leading-relaxed text-gray-400 font-sans">
          دليل التتبع التشخيصي التلقائي المشغل بالكامل على الحافة لمنع استنزاف الخوادم وسرعة تصفية الأخطاء الجنائية والمالية والملاحية بالمنصة.
        </p>

        {/* أدوات البحث والفلترة */}
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث بكود الخطأ، العنوان أو الوصف..."
              value={errSearchQuery}
              onChange={(e) => setErrSearchQuery(e.target.value)}
              className="w-full bg-[#050505] border border-white/10 rounded-lg py-2.5 pr-8 pl-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00ffcc]/50 transition-colors font-sans text-right"
              dir="rtl"
            />
            <Search className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-3.5" />
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              { id: 'ALL', label: 'الكل' },
              { id: 'SOV', label: '🛡️ السيادة' },
              { id: 'FIN', label: '💸 المالية' },
              { id: 'MAP', label: '🗺️ الخرائط' },
              { id: 'ADV', label: '📢 الإعلانات' },
              { id: 'KNL', label: '🎛️ النواة' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedErrCategory(cat.id as any);
                  setExpandedErrorCode(null);
                }}
                className={`px-2 py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${
                  selectedErrCategory === cat.id 
                    ? 'bg-[#00ffcc]/15 text-[#00ffcc] border border-[#00ffcc]/30' 
                    : 'bg-[#050505] text-gray-400 border border-white/5 hover:border-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* قائمة الأخطاء المفلترة */}
        <div className="space-y-2 max-h-[220px] overflow-y-auto pl-1 pr-0.5">
          {filteredErrors.length > 0 ? (
            filteredErrors.map((err) => {
              const isExpanded = expandedErrorCode === err.code;
              const isCrit = err.code.startsWith('ERR-KNL-') || err.code.startsWith('ERR-SOV-');
              return (
                <div 
                  key={err.code}
                  className={`border rounded-lg transition-all ${
                    isExpanded 
                      ? 'bg-[#050505] border-[#00ffcc]/25 shadow-[0_4px_20px_rgba(0,255,200,0.02)]' 
                      : 'bg-[#050505]/40 border-white/5 hover:border-white/10'
                  }`}
                >
                  <button
                    onClick={() => setExpandedErrorCode(isExpanded ? null : err.code)}
                    className="w-full p-2.5 text-right flex items-center justify-between text-[10px] font-mono cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold tracking-wider ${
                        isCrit ? 'bg-red-950/50 text-red-400 border border-red-500/10' : 'bg-emerald-950/50 text-[#00ffcc] border border-emerald-500/10'
                      }`}>
                        {err.code}
                      </span>
                      <span className="font-sans font-bold text-gray-200 text-xs truncate max-w-[180px] sm:max-w-none">
                        {err.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold">
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-2.5 text-[9.5px] font-sans text-right">
                      <div>
                        <span className="text-[8px] text-gray-500 block">وصف الخلل:</span>
                        <p className="text-gray-300 leading-relaxed font-sans">{err.description}</p>
                      </div>
                      <div className="p-2 bg-[#0a1512] border border-emerald-500/10 rounded-lg">
                        <span className="text-[8.5px] text-[#00ffcc] font-bold block">🛡️ الإجراء الوقائي الحركي الحافة:</span>
                        <p className="text-emerald-300/90 leading-relaxed font-sans mt-0.5">{err.action}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-[9.5px] text-gray-500 italic text-center py-4 bg-white/5 rounded-xl font-sans">
              لا توجد رموز مطابقة لمعايير البحث الحالية.
            </p>
          )}
        </div>
      </div>

      {/* المادة (5) صندوق الاطلاع الأسبوعي وتقييمات الركاب المطهّرة (Anonymized User Feedback) */}
      <div className="feedback-block p-4 bg-[#0a0a0a] border border-white/5 rounded-xl space-y-4">
        
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5 gap-2">
          <div>
            <span className="text-[10px] text-gray-400 block">معدل المناعة والامتثال للمعايرة:</span>
            <h4 className="text-xs font-black text-white flex items-center gap-1 pt-0.5">
              ⭐️ رصيد الامتثال والاستقرار كلياً:
            </h4>
          </div>
          
          <div className="text-right">
            <span 
              className={`text-md sm:text-lg font-black px-3.5 py-1 rounded-lg border flex items-center gap-1.5 font-mono ${
                isCriticalRating 
                  ? 'bg-red-950/40 border-red-500/30 text-red-400 animate-pulse' 
                  : 'bg-emerald-950/30 border-emerald-500/30 text-[#00ffcc]'
              }`}
            >
              {captainProfile.rating.toFixed(2)} / 5.00
            </span>
          </div>
        </div>

        {isCriticalRating && (
          <div className="p-2.5 bg-red-950/20 border border-red-500/20 rounded-lg text-[9.5px] text-red-300 leading-relaxed flex items-start gap-1.5 font-sans">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>
              <strong>تحذير الإيقاف الآلي:</strong> تقييمك العام قريب من عتبة التعليق (4.30). يرجى الالتزام بكوابح النبض، وراحة الركاب، والتسعير المجهول لتجنب تعليق النبض لـ 24 ساعة بمقتضى ميثاق الرادار الميداني.
            </span>
          </div>
        )}

        <div>
          <h5 className="text-[10px] font-black text-[#00ffcc] mb-2 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> النبض الأسبوعي لتعليقات الركاب (العمى المطبق ومطهّرة كلياً):
          </h5>
          <p className="text-[8.5px] text-gray-400 font-sans leading-relaxed mb-3.5">
            * لقد خضعت هذه الردود للغسيل والتعقيم البرمجي الصارم؛ لتجريدها من الهوية، الزاوية الجغرافية، والزمنية لمنع الاحتكاك وتصفية النزاعات الميدانية لسلامتك وعملاً بقانون "الحصانة السلوكية للناقل".
          </p>

          {captainProfile.weeklyComments && captainProfile.weeklyComments.length > 0 ? (
            <div className="space-y-2 max-h-36 overflow-y-auto pl-1 pr-0.5">
              {captainProfile.weeklyComments.map((comment, index) => (
                <div key={index} className="bg-white/5 p-3 rounded-xl border border-white/5 relative flex items-start gap-2">
                  <span className="text-[18px] text-emerald-500 font-serif leading-none select-none">“</span>
                  <p className="text-[10px] text-gray-300 italic leading-relaxed pt-0.5 font-sans">
                    {comment}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-gray-500 italic text-center py-4 bg-white/5 rounded-xl">لا توجد ردود أو تعليقات أمنية مطهّرة جديدة هذا الأسبوع.</p>
          )}
        </div>
      </div>

      {/* حوار الشحن السريع لباقات الساعات */}
      {showRechargeDialog && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#050505] border border-emerald-500/30 rounded-2xl p-5 text-right space-y-4 shadow-2xl">
            <div className="border-b border-white/5 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-black text-[#00ffcc] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" /> شحن وتمديد رصيد الساعات المفتوح
              </h3>
              <button 
                onClick={() => setShowRechargeDialog(false)}
                className="text-gray-400 hover:text-white font-bold text-xs"
              >
                إلغاء ×
              </button>
            </div>

            <p className="text-[10px] text-gray-300 leading-normal font-sans">
              اختر باقة الساعات المفتوحة للتفعيل اللحظي. الاستهلاك ينشط عند تفعيل "النبض" ويتجمد فوراً عند الاستراحة لمنع الفقد السلبي:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleRechargeHours(24, 1.00)}
                className="w-full p-3 bg-white/5 hover:bg-emerald-950/25 border border-white/5 hover:border-emerald-500/20 rounded-xl transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="text-right">
                  <span className="text-xs font-black text-white block">باقة "اليوم الواحد الممتد" 🕒</span>
                  <span className="text-[8px] text-gray-400">24 ساعة بث صافي ومجمد</span>
                </div>
                <span className="text-xs font-bold text-emerald-400">1.00 دينار</span>
              </button>

              <button
                onClick={() => handleRechargeHours(100, 3.50)}
                className="w-full p-3 bg-white/5 hover:bg-emerald-950/25 border border-white/5 hover:border-emerald-500/20 rounded-xl transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="text-right">
                  <span className="text-xs font-black text-white block">باقة "الجهد الميداني المتكامل" 💎</span>
                  <span className="text-[8px] text-gray-400">100 ساعة بث صافي للنبض</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-emerald-400">3.50 دينار</span>
                  <span className="text-[7px] text-[#00ffcc] bg-[#00ffcc]/10 px-1 py-0.5 rounded mt-0.5">خصم ٣٠٪</span>
                </div>
              </button>

              <button
                onClick={() => handleRechargeHours(300, 9.00)}
                className="w-full p-3 bg-white/5 hover:bg-emerald-950/25 border border-white/5 hover:border-emerald-500/20 rounded-xl transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="text-right">
                  <span className="text-xs font-black text-white block">ميثاق "الأمان السنوي الفائق" 🏛️</span>
                  <span className="text-[8px] text-gray-400">300 ساعة بث صافية تماماً</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-[#fbbf24]">9.00 دينار</span>
                  <span className="text-[7px] text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded mt-0.5">عرض القيادة</span>
                </div>
              </button>
            </div>

            <p className="text-[8.5px] text-gray-500 text-center font-sans">
              * جميع الرسوم والمستحقات يتم جدولتها على محفظتك لضمان صفر عشوائية.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

try {
  Object.freeze(RadarCaptainDashboard);
} catch (e) {
  console.warn("Failed to freeze RadarCaptainDashboard component definition", e);
}
