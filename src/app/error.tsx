'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';
import { triggerHaptic } from '@/lib/utils';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Boundary Caught:", error);
    triggerHaptic('heavy');
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="bg-destructive/10 p-6 rounded-full mb-6">
        <AlertTriangle className="h-16 w-16 text-destructive animate-pulse" />
      </div>
      <h2 className="text-2xl font-black mb-2">عذراً، حدث اضطراب رقمي</h2>
      <p className="text-muted-foreground text-sm mb-8 max-w-md">
        لقد اصطدمنا بمطب تقني غير متوقع. لا تقلق، تم تسجيل الخطأ في السجلات السيادية.
      </p>
      <div className="flex gap-4 justify-center">
        <Button onClick={() => reset()} variant="outline">
          إعادة المحاولة
        </Button>
        <Button onClick={() => window.location.href = '/'}>
          <Home className="ml-2 h-4 w-4" /> العودة للرئيسية
        </Button>
      </div>
    </div>
  );
}
