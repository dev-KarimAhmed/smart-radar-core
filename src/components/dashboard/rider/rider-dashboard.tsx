'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Phone, AlertCircle, Clock, Trash2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 72 ساعة بالملي ثانية
  const now = Date.now();

  // فحص وتطهير المصفوفة محلياً عند الحافة لضمان عدم عرض أي رحلة تجاوزت الـ 72 ساعة حتماً
  const activeArchive = tripsWithin72Hours.filter(trip => (now - trip.timestamp) < THREE_DAYS_MS);

  const handleSilentReport = (tripId: string) => {
    if (!reportText.trim()) return;
    console.log(`📡 نبضة بلاغ جنائي موجهة للسيرفر (1 Write) للرحلة ${tripId}: ${reportText}`);
    
    setReportText('');
    
    toast({
      title: '✅ تم إيداع البلاغ في الصندوق الأسود',
      description: 'تم إيداع البلاغ في الصندوق الأسود الجنائي بنجاح، جاري المراجعة وتقويم الميدان.',
      variant: 'default',
    });
  };

  return (
    <div className="radar-rider-container max-w-xl mx-auto rounded-xl border border-emerald-900 bg-black text-white p-5 md:p-6 font-mono text-right shadow-2xl relative overflow-hidden" dir="rtl">
      
      {/* 1. رصيد الثقة وجدار حماية المناعة */}
      <div className="trust-card border-b-2 border-[#111] pb-4 mb-5">
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

      {/* 2. أرشيف الـ 3 أيام المطهّر وحماية المفقودات */}
      <div className="archive-section space-y-3">
        <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">
          📋 أرشيف الرحلات النشطة (صلاحية 3 أيام للتطهير التلقائي)
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

            return (
              <div 
                key={trip.tripId} 
                className="bg-[#0b0c0b] p-4 rounded-xl border border-white/5 border-r-4 border-r-emerald-500 space-y-3 shadow-md hover:border-emerald-500/30 transition-all"
              >
                <div className="flex justify-between items-center text-[12px] md:text-[13px]">
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
                    className="flex-1 w-full bg-black border border-white/10 text-white placeholder-gray-600 text-[11px] px-3 py-2 rounded-lg focus:outline-none focus:border-red-500 transition-all font-sans"
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

    </div>
  );
};

try {
  Object.freeze(RadarRiderDashboard);
} catch (e) {
  console.warn("Failed to freeze RadarRiderDashboard component definition", e);
}
