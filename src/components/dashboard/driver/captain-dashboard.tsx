'use client';

import React, { useState, useEffect } from 'react';

interface CaptainDashboardProps {
  captainProfile: {
    id: string;
    rank: 'PLATINUM' | 'GOLD' | 'BRONZE' | 'SILVER';
    walletHours: number;
    bonusHours: number;
    rating: number;
    weeklyComments: string[]; // تعليقات مجهولة مطهرة برمجياً
  };
}

export const RadarCaptainDashboard: React.FC<CaptainDashboardProps> = ({ captainProfile }) => {
  const [isRadarActive, setIsRadarActive] = useState<boolean>(false);
  const [localHours, setLocalHours] = useState(captainProfile.walletHours);

  // بروتوكول تجميد الوقت عند الاستراحة - يعمل محلياً بالكامل بصفر كلفة
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRadarActive && localHours > 0) {
      interval = setInterval(() => {
        setLocalHours(prev => prev - 1); // خصم دقيقة واحدة محلياً في IndexedDB أو الذاكرة
      }, 60000); 
    }
    return () => clearInterval(interval);
  }, [isRadarActive, localHours]);

  // Sync state if prop changes
  useEffect(() => {
    setLocalHours(captainProfile.walletHours);
  }, [captainProfile.walletHours]);

  return (
    <div className="radar-sovereign-container max-w-2xl mx-auto rounded-xl border border-emerald-950 bg-black text-white p-5 md:p-6 font-mono text-right shadow-2xl relative overflow-hidden" dir="rtl">
      
      {/* 1. رأس اللوحة والسيادة التشغيلية */}
      <div className="header-card border-b-2 border-[#1a1a1a] pb-4 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-right">
        <div>
          <h2 className="text-lg md:text-xl font-bold font-sans text-emerald-400">🛡️ قمرة العمليات السيادية - الرادار V5.5</h2>
          <p className="text-[10px] text-gray-400 mt-1">التحكم الفوري بوضعية القيادة وحالة الاتصال بمستشعرات السوق الميدانية</p>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-transparent border-white/5">
          <span className="text-[11px] text-gray-300 font-bold">وضعية البث الميداني:</span>
          <button 
            onClick={() => setIsRadarActive(!isRadarActive)}
            className="px-4 py-2 text-xs font-black rounded-lg border-2 border-transparent transition-all duration-300 shadow-md transform hover:scale-102 active:scale-98 select-none"
            style={{
              backgroundColor: isRadarActive ? '#10b981' : '#ef4444', 
              color: '#ffffff', 
              cursor: 'pointer'
            }}
          >
            {isRadarActive ? '📡 النبض نشط (البث الميداني مفتوح)' : '⏳ وضع الاستراحة (الوقت متجمد)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 2. كتلة الاشتراكات والعداد الزمني المفتوح */}
        <div className="time-block p-4 bg-[#0a0f0a] border border-emerald-900/30 rounded-xl space-y-2">
          <h4 className="text-xs text-emerald-500/80 font-bold uppercase tracking-wider">⏳ رصيد ساعات العبور والنبض المعلوماتي</h4>
          <h3 className="text-2xl font-black text-[#00ffcc]" style={{ textShadow: '0 0 10px rgba(0,255,204,0.15)' }}>
            {Math.floor(localHours / 60)} ساعة و {localHours % 60} دقيقة صافية
          </h3>
          <p className="text-[10px] text-gray-400 leading-normal">
            * رصيدك يتناقص فقط أثناء النشاط الحقيقي للرادار، ويتجمد تلقائياً وبأمان ثاقب عند دخولك الاستراحة لمنع تسرب الثواني.
          </p>
        </div>

        {/* 3. كتلة الرتبة السيادية ومكافآت الساعات الحرة */}
        <div className="rank-block p-4 bg-[#080d12] border border-cyan-900/30 rounded-xl space-y-2 border-r-4 border-r-amber-500">
          <h4 className="text-xs text-amber-500 font-bold uppercase tracking-wider">🏅 الرتبة التشغيلية الحالية:</h4>
          <h3 className="text-xl font-bold text-amber-400">[{captainProfile.rank}]</h3>
          <p className="text-[11px] text-gray-300">
            🎁 رصيد ساعات البونص الممنوحة مميزاً: <strong className="text-amber-400 text-sm">{captainProfile.bonusHours} ساعة حرة</strong>
          </p>
          <p className="text-[10px] text-gray-45.00 leading-normal">
            * ميزة سيادية: ساعات البونص مُهداة تلقائياً لقاء التزامك بكوابح السوق ونبض الأسعار باللواء؛ استهلكها بحرية تشغيلية مطلقة.
          </p>
        </div>
      </div>

      {/* 4. حقل وسيط التقييم والاطلاع الأسبوعي المجهر (المطهر) */}
      <div className="feedback-block mt-4 p-4 bg-[#0d0d0d] border border-white/5 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <h4 className="text-xs font-bold text-gray-300">⭐️ رصيد الثقة والمناعة الرقمية:</h4>
          <span 
            className="text-base font-black px-2.5 py-0.5 rounded-full"
            style={{ 
              color: captainProfile.rating < 4.3 ? '#ff3366' : '#00ffcc',
              backgroundColor: captainProfile.rating < 4.3 ? 'rgba(255,51,102,0.1)' : 'rgba(0,255,204,0.1)'
            }}
          >
            {captainProfile.rating.toFixed(2)} / 5.00
          </span>
        </div>
        
        <div>
          <h5 className="text-[11px] font-bold text-[#00ffcc] mb-2">
            📋 النبض الأسبوعي لتعليقات المتلقين (مجهولة ومطهرة بالكامل لمنع الخلافات):
          </h5>
          {captainProfile.weeklyComments && captainProfile.weeklyComments.length > 0 ? (
            <ul className="space-y-2 pr-1 text-[11px] text-gray-300 leading-relaxed max-h-36 overflow-y-auto pl-2">
              {captainProfile.weeklyComments.map((comment, index) => (
                <li key={index} className="bg-white/5 p-2 rounded-lg border-r-2 border-emerald-500 italic">
                  “{comment}”
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[10px] text-gray-500 italic text-center py-2">لا توجد تعليقات جديدة مطهرة لهذا الأسبوع.</p>
          )}
        </div>
      </div>

    </div>
  );
};

try {
  Object.freeze(RadarCaptainDashboard);
} catch (e) {
  console.warn("Failed to freeze RadarCaptainDashboard component definition", e);
}
