'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, BellRing, AlertTriangle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PromoCarousel } from '@/components/shared/promo-carousel';

export default function MessagesPage() {
  const router = useRouter();
  const messages: any[] = []; 

  return (
    <div className="min-h-[100dvh] bg-[#050D05] text-white font-sans selection:bg-emerald-500/30">
      
      <header className="sticky top-0 z-40 bg-[#091B09]/95 backdrop-blur-md border-b border-emerald-900/50 shadow-md">
        <div className="flex items-center justify-between px-4 py-4 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-emerald-400 hover:bg-emerald-950/50 rounded-full">
            <ChevronRight className="w-7 h-7" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-widest text-white">رسائل الرادار</h1>
            <BellRing className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto space-y-6">
        
        <div className="flex items-start gap-3 p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-xl shadow-inner">
          <AlertTriangle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400 font-medium leading-relaxed">
            وفقاً لبروتوكولات السيادة البرمجية، يتم الاحتفاظ بالرسائل والإشعارات لمدة <strong className="text-emerald-400">25 يوماً فقط</strong> ثم يتم محوها تلقائياً لتخفيف العبء عن الرادار.
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="pt-8 flex flex-col items-center space-y-8 animate-in fade-in duration-700">
            
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-pulse blur-xl"></div>
              <MessageSquare className="w-20 h-20 text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] relative z-10" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white drop-shadow-md">صندوقك نقي</h2>
              <p className="text-sm text-gray-400 font-medium">لا توجد رسائل أو إشعارات جديدة في الرادار حالياً.</p>
            </div>

            <PromoCarousel />

          </div>
        ) : (
          <div className="space-y-4"></div>
        )}
      </main>
    </div>
  );
}
