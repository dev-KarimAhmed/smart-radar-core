import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import type { RiderUser } from '../riders-management-panel';

interface UseRiderSimulationProps {
  selectedRider: RiderUser | null;
  onRefresh: () => Promise<void> | void;
  isArabic: boolean;
}

export function useRiderSimulation({
  selectedRider,
  onRefresh,
  isArabic,
}: UseRiderSimulationProps) {
  const { toast } = useToast();
  const [isSimulating, setIsSimulating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [lastResult, setLastResult] = useState<{
    message: string;
    timestamp: string;
  } | null>(null);

  const referralInfo = selectedRider?.referral_activity;

  // Simulate shifting days ago
  const handleSimulateDays = async (days: number) => {
    if (!selectedRider) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'يرجى اختيار راكب أولاً' : 'Please select a rider first',
      });
      return;
    }

    setIsSimulating(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          action: 'simulate_rider_activity',
          riderId: selectedRider.id,
          daysAgo: days,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || (isArabic ? 'فشلت عملية المحاكاة' : 'Simulation failed'));
      }

      const msg = data.message || (isArabic ? 'تمت المحاكاة بنجاح' : 'Simulation successful');
      setLastResult({
        message: msg,
        timestamp: new Date().toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US'),
      });

      toast({
        title: isArabic ? '🧪 نجاح المحاكاة' : '🧪 Simulation Success',
        description: msg,
      });

      await onRefresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في المحاكاة' : 'Simulation Error',
        description: err?.message || (isArabic ? 'تعذر تطبيق المحاكاة' : 'Could not apply simulation'),
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Direct operational account status update (ACTIVE / IDLE)
  const handleUpdateStatus = async (status: 'ACTIVE' | 'IDLE') => {
    if (!selectedRider) return;
    setIsUpdatingStatus(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_status',
          userId: selectedRider.id,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || (isArabic ? 'فشل تحديث الحالة' : 'Failed to update status'));
      }

      toast({
        title: isArabic ? '⚡ تحديث الحالة التشغيلية' : '⚡ Operational Status Updated',
        description: data.message || (isArabic ? `تم تغيير حالة الحساب إلى ${status}` : `Status changed to ${status}`),
      });

      await onRefresh();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ' : 'Error',
        description: err?.message || (isArabic ? 'تعذر تحديث الحالة' : 'Could not update status'),
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Sweep and send 10-day inactivity alert notifications to referring captains
  const handleRunNotificationCheck = async () => {
    setIsChecking(true);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          action: 'run_inactivity_check',
          captainId: referralInfo?.captain_id || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || (isArabic ? 'فشل فحص عدم النشاط' : 'Inactivity check failed'));
      }

      const count = data.notificationsDispatched || 0;
      const msg = data.message || (count > 0
        ? (isArabic ? `تم إرسال (${count}) إشعار تنبيه للكباتن بنجاح 🚀` : `Successfully dispatched ${count} alerts to captains 🚀`)
        : (isArabic ? 'تم الفحص: لا توجد إشعارات مستحقة حالياً' : 'Check complete: no pending alerts due'));

      setLastResult({
        message: msg,
        timestamp: new Date().toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US'),
      });

      toast({
        title: count > 0 ? (isArabic ? '🚀 تم إرسال الإشعارات' : '🚀 Alerts Dispatched') : (isArabic ? 'ℹ️ اكتمل الفحص' : 'ℹ️ Check Complete'),
        description: msg,
      });

      await onRefresh();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('radar_notifications_updated'));
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'خطأ في الفحص والإرسال' : 'Check & Dispatch Error',
        description: err?.message || (isArabic ? 'تعذر تشغيل الفحص' : 'Could not run check'),
      });
    } finally {
      setIsChecking(false);
    }
  };

  return {
    isSimulating,
    isChecking,
    isUpdatingStatus,
    lastResult,
    handleSimulateDays,
    handleUpdateStatus,
    handleRunNotificationCheck,
  };
}
