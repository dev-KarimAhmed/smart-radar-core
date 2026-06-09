'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, X } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true); // Default to true to prevent flash
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed
    const isAppMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isAppMode);
    
    if (isAppMode) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setIsIOS(true);
      // Delay prompt so it's not annoying
      setTimeout(() => setShowPrompt(true), 5000);
    }

    // Detect Android/Chrome install event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    triggerHaptic('light');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-primary text-primary-foreground p-4 rounded-xl shadow-2xl z-[9998] flex items-center gap-3 animate-in slide-in-from-bottom-5">
      <div className="flex-1">
        <h4 className="text-sm font-bold mb-1">تجربة أسرع بدون إنترنت!</h4>
        {isIOS ? (
          <p className="text-[10px] opacity-90 flex items-center gap-1">
            اضغط على <Share className="h-3 w-3 inline" /> (مشاركة) بالأسفل ثم اختر <strong>"إضافة للشاشة الرئيسية"</strong>.
          </p>
        ) : (
          <p className="text-[10px] opacity-90">قم بتثبيت تطبيق الرادار الآن.</p>
        )}
      </div>
      
      {!isIOS && (
        <Button onClick={handleInstallClick} size="sm" variant="secondary" className="h-8 text-xs font-bold shrink-0 text-primary">
          <Download className="ml-1 h-3 w-3" /> تثبيت
        </Button>
      )}
      
      <button onClick={() => setShowPrompt(false)} className="p-1 opacity-50 hover:opacity-100 shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
