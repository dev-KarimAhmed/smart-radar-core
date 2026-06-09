'use client';

import { useSovereignControls } from '@/hooks/use-sovereign-controls';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Power, PowerOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function KillSwitchPanel() {
  const { 
    isRadarActive, 
    toggleKillSwitch, 
    isTogglingKillSwitch, 
    isLoadingControls 
  } = useSovereignControls();
  
  return (
    <Card className="bg-red-950/30 border-red-500/40 shadow-lg shadow-red-950/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-300">
          <AlertTriangle className="w-5 h-5" />
          بروتوكول الطوارئ: المفتاح السيادي
        </CardTitle>
        <CardDescription className="text-red-300/70">
          تفعيل هذا الزر يوقف الميدان بالكامل ويمنع استقبال أي طلبات جديدة فوراً.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive"
              className="w-full h-14 text-lg font-black tracking-widest shadow-[0_0_25px_rgba(239,68,68,0.4)] animate-pulse-slow disabled:animate-none"
              disabled={isLoadingControls || isTogglingKillSwitch}
            >
              {isLoadingControls ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isRadarActive ? (
                <>
                  <PowerOff className="w-6 h-6 ml-3" />
                  إغلاق الميدان (تفعيل المفتاح)
                </>
              ) : (
                 <>
                  <Power className="w-6 h-6 ml-3" />
                  فتح الميدان (إلغاء المفتاح)
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد من قرارك السيادي؟</AlertDialogTitle>
              <AlertDialogDescription>
                {isRadarActive 
                  ? "سيتم تجميد الميدان بالكامل ومنع جميع الركاب من إرسال طلبات جديدة. لن يتأثر الكباتن الذين في رحلات حالية."
                  : "سيتم إعادة تفعيل الميدان فوراً والسماح باستقبال الطلبات الجديدة."
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>تراجع</AlertDialogCancel>
              <AlertDialogAction onClick={toggleKillSwitch} disabled={isTogglingKillSwitch}>
                {isTogglingKillSwitch ? <Loader2 className="animate-spin" /> : `نعم، ${isRadarActive ? 'أغلق' : 'افتح'} الميدان`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
