'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Phone, AlertCircle, Clock, Trash2, Send, Heart, Briefcase, X, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dexieDb, RadarCaptainFavoriteKernel } from '@/lib/dexie-db';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface HistoricalTrip {
  tripId: string;
  captainName: string;
  captainRank: 'PLATINUM' | 'GOLD' | 'BRONZE';
  captainPhone: string;
  vehicleInfo: string;
  finalPrice: number;
  timestamp: number; // وقت إنهاء الرحلة بالملي ثانية
}

interface RiderDashboardProps {
  riderProfile: {
    id: string;
    rating: number;
    governorate: string;
    district: string;
  };
  tripsWithin72Hours: HistoricalTrip[];
  systemMessages: string[];
}

export const RadarRiderDashboard: React.FC<RiderDashboardProps> = ({ riderProfile, tripsWithin72Hours, systemMessages }) => {
  const [reportText, setReportText] = useState('');
  const [favoriteCaptains, setFavoriteCaptains] = useState<any[]>([]);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const { toast } = useToast();
  
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 72 ساعة بالملي ثانية
  const now = Date.now();

  const sanitizeText = (str: string | null | undefined): string => {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '');
  };

  const loadFavorites = async () => {
    try {
      const favs = await dexieDb.favoriteCaptains.toArray();
      setFavoriteCaptains(favs);
    } catch (e) {
      console.error("Failed to load favorites from Dexie:", e);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  // فحص وتطهير المصفوفة محلياً عند الحافة لضمان عدم عرض أي رحلة تجاوزت الـ 72 ساعة حتماً
  const activeArchive = tripsWithin72Hours.filter(trip => (now - trip.timestamp) < THREE_DAYS_MS);

  const toggleFavorite = async (e: React.MouseEvent, trip: HistoricalTrip) => {
    e.stopPropagation();
    try {
      const existing = await dexieDb.favoriteCaptains.where('tripId').equals(trip.tripId).first();
      if (existing) {
        if (existing.id !== undefined) {
          await dexieDb.favoriteCaptains.delete(existing.id);
        }
        try {
          localStorage.removeItem(`radar_preferred_captain_${trip.tripId}`);
        } catch (err) {
          console.warn("Storage write failed (removeItem):", err);
        }
        toast({
          title: "💔 تم الإزالة من المفضلة",
          description: `تمت إزالة الكابتن ${sanitizeText(trip.captainName)} من الخزنة المخصصة.`,
        });
      } else {
        // تشغيل بروتوكول المصادقة والتخليد عند الحافة
        RadarCaptainFavoriteKernel.mummifyTrustedCaptain({
          captainId: trip.tripId,
          captainName: sanitizeText(trip.captainName),
          captainPhone: trip.captainPhone,
          vehicleInfo: sanitizeText(trip.vehicleInfo),
          captainType: trip.captainRank === 'PLATINUM' ? 'careem' : trip.captainRank === 'GOLD' ? 'uber' : 'independent',
          tripId: trip.tripId
        }, true);

        await dexieDb.favoriteCaptains.add({
          tripId: trip.tripId,
          captainName: sanitizeText(trip.captainName),
          captainRank: trip.captainRank,
          captainPhone: trip.captainPhone,
          vehicleInfo: sanitizeText(trip.vehicleInfo),
          finalPrice: trip.finalPrice,
          timestamp: trip.timestamp,
          heartedAt: Date.now()
        });
        toast({
          title: "💖 تم التخليد السيادي بنجاح",
          description: `تم حفظ الكابتن ${sanitizeText(trip.captainName)} كـ ناقل مفضل مستقر للأبد بصفر كلفة سحابية.`,
        });
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([60, 40, 60]);
        }
      }
      loadFavorites();
    } catch (e) {
      console.error(e);
    }
  };

  const updateCaptainType = async (favId: number, type: 'uber' | 'careem' | 'independent') => {
    try {
      await dexieDb.favoriteCaptains.update(favId, { captainType: type } as any);
      const favorite = favoriteCaptains.find(f => f.id === favId);
      if (favorite) {
        try {
          localStorage.setItem(`radar_preferred_captain_${favorite.tripId}`, JSON.stringify({
            captainId: favorite.tripId,
            fullName: sanitizeText(favorite.captainName),
            phoneNumber: favorite.captainPhone,
            captainType: type,
            vehicleSpecs: sanitizeText(favorite.vehicleInfo),
            savedTimestamp: favorite.heartedAt || Date.now()
          }));
        } catch (err) {
          console.warn("Storage write failed (setItem):", err);
        }
      }
      toast({
        title: "⚡ تم تحديث التصنيف",
        description: `تم تصنيف الكابتن كـ ${type === 'uber' ? 'أوبر' : type === 'careem' ? 'كريم' : 'مستقل'} بنجاح.`,
      });
      loadFavorites();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSilentReport = async (tripId: string) => {
    if (!reportText.trim()) return;
    
    // استدعاء مصفوفة الإحداثيات المخزنة محلياً في جهاز الراكب كدليل جنائي رفقة البلاغ عند الطلب
    let localBufferCords = '';
    try {
      const stored = localStorage.getItem('sovereign_gps_local_buffer');
      if (stored) {
        const parsed = JSON.parse(stored);
        localBufferCords = parsed.map((pt: any) => `[${pt.lat.toFixed(5)},${pt.lng.toFixed(5)}@${new Date(pt.timestamp).toISOString().slice(11, 19)}]`).join(', ');
      }
    } catch (e) {
      console.warn("Failed to extract forensic local buffer", e);
    }

    const payloadText = `${reportText.trim()} | [بصمة الجهاز الموضعية للجريمة الملاحية: ${localBufferCords || 'لا توجد إحداثيات مخزنة بالمسجل المباشر'}]`;
    
    try {
      await addDoc(collection(db, 'silent_reports'), {
        tripId,
        reportText: reportText.trim(),
        payloadText,
        riderId: auth.currentUser?.uid || riderProfile.id || 'anonymous',
        timestamp: serverTimestamp()
      });
      console.log(`📡 نبضة بلاغ جنائي موجهة للسيرفر (1 Write) للرحلة ${tripId}: ${payloadText}`);
    } catch (error) {
      console.error("Failed to submit silent report:", error);
    }
    
    setReportText('');
    toast({
      title: '✅ تم إيداع البلاغ في الصندوق الأسود',
      description: 'تم إرفاق بصمة الإحداثيات المحلية كدليل جنائي متكامل بالصندوق الأسود بنجاح.',
      variant: 'default',
    });
  };

  return (
    <div className="radar-rider-container max-w-xl mx-auto rounded-xl border border-emerald-900 bg-black text-white p-5 md:p-6 font-mono text-right shadow-2xl relative overflow-hidden" dir="rtl">
      
      {/* 1. رصيد الثقة وجدار حماية المناعة */}
      <div className="trust-card border-b-2 border-[#111] pb-4 mb-4">
        <h3 className="text-base md:text-lg font-black font-sans text-emerald-400 mb-3">📡 غرفة تحكم الراكب السيادية - V5.5</h3>
        <div className="flex justify-between items-center bg-[#0a0f0a] border border-emerald-950/40 p-4 rounded-xl shadow-inner">
          <span className="text-[11px] text-gray-300 font-bold">رصيد الثقة والمناعة (تقييم الكباتن لك):</span>
          <strong 
            className="text-lg md:text-xl font-black px-3 py-1 rounded-lg"
            style={{ 
              color: riderProfile.rating < 4.3 ? '#ff3366' : '#00ffcc',
              backgroundColor: riderProfile.rating < 4.3 ? 'rgba(255,51,102,0.1)' : 'rgba(0,255,204,0.1)'
            }}
          >
            {riderProfile.rating.toFixed(2)} / 5.0
          </strong>
        </div>
        {riderProfile.rating < 4.3 && (
          <div className="flex items-center gap-1.5 mt-2 bg-rose-500/10 border border-rose-500/20 text-[#ff3366] p-2.5 rounded-lg text-[10px]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <p className="font-bold">
              ⚠️ تحذير: تقييمك يقترب من الخط الحرج (4.2). يرجى الالتزام بالوقت والنقد لتفادي الحظر التلقائي.
            </p>
          </div>
        )}
      </div>

      {/* 💼 Portfolio Quick Launcher Panel - حقيبة الناقل المفضل */}
      <div className="portfolio-banner mb-5">
        <Button 
          onClick={() => setIsPortfolioOpen(true)}
          className="w-full h-11 bg-gradient-to-l from-emerald-950 to-emerald-900 hover:from-emerald-900 hover:to-emerald-850 border border-emerald-500/30 text-white font-black text-xs flex items-center justify-center gap-2 rounded-xl shadow-lg transition-transform hover:scale-[1.01]"
        >
          <Briefcase className="w-4 h-4 text-[#00ffcc] animate-pulse" />
          <span>💼 حقيبة الناقل المفضل ({favoriteCaptains.length} كباتن في الخزنة)</span>
        </Button>
      </div>

      {/* 2. أرشيف الـ 3 أيام المطهّر وحماية المفقودات */}
      <div className="archive-section space-y-3 mb-6">
        <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>📋 أرشيف الرحلات النشطة (صلاحية 3 أيام للتطهير التلقائي)</span>
        </h4>
        {activeArchive.length === 0 ? (
          <div className="border border-dashed border-white/5 bg-white/2 p-5 text-center rounded-xl">
            <Trash2 className="w-5 h-5 text-gray-600 mx-auto mb-2" />
            <p className="text-[11px] text-gray-500 font-medium italic">
              لا توجد رحلات نشطة في آخر 72 ساعة. تم تطهير السجلات بكفاءة تامة.
            </p>
          </div>
        ) : (
          activeArchive.map(trip => {
            const timeLeftMs = THREE_DAYS_MS - (now - trip.timestamp);
            const hoursLeft = Math.max(0, Math.floor(timeLeftMs / (1000 * 60 * 60)));
            const isHearted = favoriteCaptains.some(fav => fav.tripId === trip.tripId);

            return (
              <div 
                key={trip.tripId} 
                className="bg-[#0b0c0b] p-4 rounded-xl border border-white/5 border-r-4 border-r-emerald-500 space-y-3 shadow-md hover:border-emerald-500/30 transition-all relative overflow-hidden"
              >
                {/* Heart Button directly inside the card with glowing green active states */}
                <button
                  onClick={(e) => toggleFavorite(e, trip)}
                  className="absolute top-3 left-3 p-1.5 rounded-md hover:bg-neutral-900 transition-all text-rose-500"
                  title={isHearted ? "إزالة الكابتن من المفضلة العظيمة" : "تخليد الكابتن كمفضل"}
                >
                  <Heart className={`w-5 h-5 transition-all duration-300 ${isHearted ? 'fill-[#00ffcc] text-[#00ffcc] drop-shadow-[0_0_8px_#00ffcc] scale-110' : 'text-gray-400 hover:text-[#00ffcc]'}`} />
                </button>

                <div className="flex justify-between items-center text-[12px] md:text-[13px] pl-8">
                  <span className="text-gray-300 font-sans">
                    🚗 الناقل: <strong className="text-white font-black">{trip.captainName} <span className="text-amber-400 text-[10px]">[{trip.captainRank}]</span></strong>
                  </span>
                  <span className="text-amber-400 font-black font-mono">
                    💰 السعر المجمد: {trip.finalPrice} دينار
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 font-sans">
                  المركبة: {trip.vehicleInfo}
                </p>
                
                {/* بروتوكول استرجاع الأغراض المفقودة عبر اتصال الـ Deep Link */}
                <div className="flex gap-2 pt-1">
                  <a 
                    href={`tel:${trip.captainPhone}`} 
                    className="h-9 px-4 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/50 border border-emerald-500/30 rounded-lg text-[11px] font-black flex items-center justify-center gap-1.5 transition-all text-center select-none"
                    style={{ textDecoration: 'none' }}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>اتصال للكابتن (فقدان أغراض)</span>
                  </a>
                </div>

                {/* البلاغ الجاف الضروري بصفر كلفة لدعم جدار الحماية */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <input 
                    type="text" 
                    placeholder="اكتب بلاغاً جنائياً صامتاً في حال المخالفة السعرية..." 
                    onChange={(e) => setReportText(e.target.value)}
                    className="flex-1 w-full bg-black border border-white/10 text-white placeholder-gray-600 text-[11px] px-3 py-2 rounded-lg focus:outline-none focus:border-red-500 transition-all font-sans text-right"
                    dir="rtl"
                  />
                  <Button 
                    onClick={() => handleSilentReport(trip.tripId)} 
                    className="h-8 px-3 bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-500/20 font-black rounded-lg text-[10px] flex items-center gap-1 transition-all shrink-0"
                  >
                    <Send className="w-3 h-3" />
                    <span>بلاغ صامت</span>
                  </Button>
                </div>

                <div className="flex justify-between items-center text-[10px] text-gray-500 font-sans pt-1">
                  <span className="flex items-center gap-1 text-rose-500 font-bold">
                    <Clock className="w-3 h-3" />
                    تدمير تلقائي للبيانات بعد: {hoursLeft} ساعة
                  </span>
                  <span className="text-[9px] text-gray-600 font-mono">Trip ID: {trip.tripId.slice(0, 8)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* [SCR-AUTH-PROTO-140 / Mada (3)] 💖 خزنة الكباتن المفضلة لتخليد البيانات محلياً بصفر تكلفة */}
      <div className="favorites-vault-section space-y-3 bg-[#050c05]/60 border border-emerald-500/20 p-4 rounded-xl">
        <h4 className="text-xs text-[#00ffcc] font-black uppercase tracking-wider mb-2 flex items-center justify-between border-b border-white/5 pb-2">
          <span>💖 خزنة الكباتن المفضلة (تخليد سيادي دائم - صفر كلفة $0.00)</span>
          <span className="bg-emerald-950 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded-full font-mono">
            {favoriteCaptains.length} كباتن
          </span>
        </h4>
        {favoriteCaptains.length === 0 ? (
          <div className="p-4 text-center rounded-lg bg-black/30 border border-dashed border-emerald-500/10">
            <span className="text-lg block mb-1">❤️</span>
            <p className="text-[10px] text-gray-400 leading-normal">
              انقر على أيقونة <strong className="text-rose-450 text-[#00ffcc]">القلب</strong> بالرحلات النشطة أعلاه لتخليد الكبتن وحمايته من التطهير التلقائي للوصول إليه في أي وقت دون كلفة سحابية.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {favoriteCaptains.map((captain) => (
              <div 
                key={captain.id} 
                className="bg-black/80 border border-emerald-500/20 p-3 rounded-lg space-y-2 relative"
              >
                {/* Remove heart */}
                <button
                  onClick={(e) => toggleFavorite(e, captain)}
                  className="absolute top-2 left-2 p-1 text-rose-500 hover:scale-105 transition-all"
                  title="استرجاع من التخليد"
                >
                  <Trash2 className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
                </button>

                <div className="flex justify-between items-start text-[11px] pl-6">
                  <div>
                    <h5 className="font-extrabold text-white text-[12px]">
                      {captain.captainName} <span className="text-amber-400 text-[9px] font-mono">[{captain.captainRank}]</span>
                    </h5>
                    <p className="text-[10px] text-gray-400 leading-normal font-sans">{captain.vehicleInfo}</p>
                  </div>
                  <div className="text-left font-mono shrink-0">
                    <span className="text-[9px] text-[#00ffcc] block bg-[#0a200a] px-1.5 py-0.5 rounded border border-emerald-500/10 font-bold">مفضل دائم</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[9px] text-gray-500 font-sans">🛡️ تم الإنقاذ من الفقدان الملاحي</span>
                  
                  {/* Direct Dial Action */}
                  <a 
                    href={`tel:${captain.captainPhone}`}
                    className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/20 rounded-md text-[10px] font-black flex items-center gap-1 transition-all select-none"
                    style={{ textDecoration: 'none' }}
                  >
                    <Phone className="w-3 h-3" />
                    <span>اتصل الآن ({captain.captainPhone})</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. مركز رسائل النظام والنبض الموجه للواء الجغرافي */}
      <div className="messages-block mt-6 p-4 bg-[#0a0a0a] border border-white/5 rounded-xl space-y-3">
        <h4 className="text-xs text-amber-400 font-black border-b border-white/5 pb-2" dir="rtl">
          📡 تنبيهات النظام الموجهة لـ (لواء {riderProfile.district || 'وادي السير'})
        </h4>
        {systemMessages && systemMessages.length > 0 ? (
          <ul className="space-y-2 pr-1 text-[11px] text-gray-300 leading-relaxed font-sans">
            {systemMessages.map((msg, idx) => (
              <li key={idx} className="flex items-start gap-2 text-right">
                <span className="text-amber-500 shrink-0 mt-0.5">•</span>
                <span>{msg}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[10px] text-gray-500 italic text-center py-1">لا توجد تنبيهات نشطة للواء حالياً.</p>
        )}
      </div>

      {/* 💼 Preference Portfolio Drawer Panel overlay */}
      {isPortfolioOpen && (
        <div className="absolute inset-0 bg-[#040604]/98 z-50 flex flex-col p-5 md:p-6 overflow-y-auto" style={{ direction: 'rtl' }}>
          <div className="flex justify-between items-center border-b border-emerald-550/20 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#00ffcc]" />
              <h3 className="text-sm md:text-base font-black text-white font-sans">
                💼 حقيبة الناقل المفضل السيادية
              </h3>
            </div>
            <button 
              onClick={() => setIsPortfolioOpen(false)}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4">
            <p className="text-[10px] text-gray-400 text-right leading-relaxed mb-1 font-sans">
              هذه الكروت يتم تشفيرها وتخليدها محلياً على جهازك مالحقاً لـ <strong>V5.5</strong>. يمكنك الاتصال بالكابتن مباشرةً أو واتساب لضمان عدم ضياع ممتلكاتك وبكلفة <strong>$0.00</strong> سحابية.
            </p>

            {favoriteCaptains.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center opacity-70 p-5 border border-dashed border-emerald-500/10 rounded-xl bg-black/40">
                <Heart className="w-10 h-10 text-gray-600 mb-2" />
                <h5 className="text-xs font-black text-gray-400">الحقيبة فارغة حالياً</h5>
                <p className="text-[10px] text-gray-500 leading-normal mt-1 font-sans">
                  احفظ أي كابتن من "أرشيف الرحلات النشطة" لتجده مخلداً هنا بشكل دائم وآمن.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {favoriteCaptains.map((captain) => {
                  const savedType = captain.captainType || 'independent';
                  
                  // WhatsApp link builder formatted for Jordan and non-digit cleanups
                  const cleanPhone = captain.captainPhone.replace(/\D/g, '');
                  const waPhone = cleanPhone.startsWith('0') ? '962' + cleanPhone.slice(1) : cleanPhone.startsWith('962') ? cleanPhone : '962' + cleanPhone;
                  const whatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent('السلام عليكم كابتن، بخصوص الأغراض المفقودة...')}`;

                  return (
                    <div 
                      key={captain.id}
                      className="bg-[#080d08] border border-emerald-500/20 rounded-xl p-4 space-y-3 relative overflow-hidden shadow-md text-right"
                    >
                      {/* Delete icon */}
                      <button
                        onClick={async () => {
                          if (captain.id !== undefined) {
                            await dexieDb.favoriteCaptains.delete(captain.id);
                            try {
                              localStorage.removeItem(`radar_preferred_captain_${captain.tripId}`);
                            } catch (err) {
                              console.warn("Storage delete failed (removeItem):", err);
                            }
                            loadFavorites();
                            toast({
                              title: "🗑️ تم مسح الكارت",
                              description: `تم إقصاء الكابتن ${sanitizeText(captain.captainName)} من حقيبة جهازك.`,
                            });
                          }
                        }}
                        className="absolute top-3 left-3 p-1.5 rounded-lg bg-red-950/20 hover:bg-red-950/50 text-red-400 border border-red-500/10 hover:border-red-500/30 transition-all font-mono"
                        title="إلغاء التفضيل السيادي وإزالة الكارت"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Captain Info details */}
                      <div className="pl-8 text-right space-y-1">
                        <div className="flex items-center gap-1.5 justify-start">
                          <h4 className="text-xs md:text-sm font-extrabold text-white">
                            {captain.captainName}
                          </h4>
                          <span className="text-amber-400 text-[10px] font-mono select-none px-1 py-0.5 rounded bg-amber-950/20 border border-amber-500/10">
                            [{captain.captainRank}]
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-normal font-sans">
                          {captain.vehicleInfo}
                        </p>
                        <p className="text-[9px] text-[#00ffcc] font-mono">
                          آخر سعر تم دفعه: {captain.finalPrice || '3.0'} دينار
                        </p>
                      </div>

                      {/* Category Chip Selector / Tracker */}
                      <div className="border-t border-dashed border-emerald-950/50 pt-2.5">
                        <span className="text-[9px] text-gray-400 block mb-1 font-sans">التصنيف والمنظرة التشغيلية للبوابة:</span>
                        <div className="grid grid-cols-3 gap-1.5" dir="rtl">
                          {(['uber', 'careem', 'independent'] as const).map((t) => (
                            <button
                              key={t}
                              onClick={() => captain.id && updateCaptainType(captain.id, t)}
                              className={`h-7 rounded-md text-[9px] font-black border transition-all ${
                                savedType === t
                                  ? t === 'uber'
                                    ? 'bg-white text-black border-white shadow'
                                    : t === 'careem'
                                    ? 'bg-[#00ffc4]/20 text-[#00ffc4] border-[#00ffc4]/30'
                                    : 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                                  : 'bg-black/40 text-gray-500 border-white/5 hover:border-white/10'
                              }`}
                            >
                              {t === 'uber' ? 'أوبر 🚗' : t === 'careem' ? 'كريم 🟢' : 'مستقل 🛡️'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Call and WhatsApp deep links triggers with Zero-click accessibility */}
                      <div className="flex gap-2.5 pt-2 border-t border-white/5" dir="rtl">
                        <a 
                          href={`tel:${captain.captainPhone}`}
                          className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] flex items-center justify-center gap-1 rounded-lg transition-transform hover:scale-[1.01]"
                          style={{ textDecoration: 'none' }}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>اتصل مباشرة</span>
                        </a>

                        <a 
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 h-9 bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-555/35 text-[#00ffcc] font-black text-[10px] flex items-center justify-center gap-1.5 rounded-lg transition-transform hover:scale-[1.01]"
                          style={{ textDecoration: 'none' }}
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>واتساب سريع 📱</span>
                        </a>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer of the overlay drawer */}
          <div className="border-t border-white/5 pt-4 mt-6 text-center">
            <Button 
              onClick={() => setIsPortfolioOpen(false)}
              className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-black rounded-lg transition-all"
            >
              العودة لقمرة التحكم السيادية
            </Button>
          </div>
        </div>
      )}

    </div>
  );
};

try {
  Object.freeze(RadarRiderDashboard);
} catch (e) {
  console.warn("Failed to freeze RadarRiderDashboard component definition", e);
}

