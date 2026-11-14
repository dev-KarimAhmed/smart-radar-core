'use client';

import React from 'react';
import {
  MapPin,
  ClipboardCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';
import { styles } from './permissions/permissions-types';
import { usePermissionsManager } from './permissions/use-permissions-manager';
import { PermissionItemCard } from './permissions/permission-item-card';
import { PermissionEnvironmentGuidance } from './permissions/permission-environment-guidance';
import { PermissionDetailedInstructions } from './permissions/permission-detailed-instructions';

export function SystemPermissionsModal() {
  const { isArabic } = useDashboardLanguage();
  const manager = usePermissionsManager();

  if (!manager.mounted) return null;

  return (
    <Dialog
      open={manager.isOpen}
      onOpenChange={(open) => {
        if (!open) {
          manager.dismissModal();
        }
      }}
    >
      <DialogContent
        className={styles.content}
        dir={isArabic ? 'rtl' : 'ltr'}
        hideCloseButton={true}
        onPointerDownOutside={manager.dismissModal}
        onInteractOutside={manager.dismissModal}
      >
        {/* Header row */}
        <div className={styles.headerRow}>
          <div className={styles.headerStart}>
            <div className={styles.headerIconWrap}>
              <ShieldAlert className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className={styles.title}>
                {isArabic ? 'أذونات المنظومة' : 'System Permissions'}
              </DialogTitle>
              <DialogDescription className={styles.subtitle}>
                {isArabic ? 'الموقع الجغرافي والحافظة' : 'GPS & Clipboard'}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Insecure Context (HTTP on mobile) Warning */}
        {!manager.isSecureContext && (
          <div className={styles.warningBanner}>
            <AlertTriangle className={styles.warningIcon} />
            <p className={styles.warningText}>
              {isArabic
                ? 'تنبيه أمان: الرابط غير مشفر (HTTP). المتصفحات تحظر الـ GPS والحافظة خارج HTTPS.'
                : 'Security Warning: Insecure HTTP connection. Browsers block GPS outside HTTPS.'}
            </p>
          </div>
        )}

        {/* Permission items list */}
        <div className={styles.cardList}>
          {/* Card 1: GPS Location */}
          <PermissionItemCard
            icon={<MapPin className="h-3 w-3" />}
            title={isArabic ? 'الموقع الجغرافي (GPS)' : 'Location (GPS)'}
            description={isArabic ? 'لحساب المسافات والأسعار' : 'For live routes & pricing'}
            status={manager.locationStatus}
            isRequesting={manager.isRequestingLocation}
            onRequest={manager.requestLocation}
            isArabic={isArabic}
          />

          {/* Card 2: Clipboard Access */}
          <PermissionItemCard
            icon={<ClipboardCheck className="h-3 w-3" />}
            title={isArabic ? 'قراءة الحافظة (Clipboard)' : 'Clipboard'}
            description={isArabic ? 'لقراءة روابط الخرائط المنسوخة' : 'Reads copied map links'}
            status={manager.clipboardStatus}
            isRequesting={manager.isRequestingClipboard}
            onRequest={manager.requestClipboard}
            isArabic={isArabic}
          />
        </div>

        {/* Single Compact Denied Guidance Banner */}
        {manager.hasAnyDenied && (
          <PermissionEnvironmentGuidance
            detectedEnv={manager.detectedEnv}
            isArabic={isArabic}
          />
        )}

        {/* Browser Settings Help Accordion */}
        <PermissionDetailedInstructions
          showInstructions={manager.showInstructions}
          setShowInstructions={manager.setShowInstructions}
          isArabic={isArabic}
        />

        {/* Footer Actions */}
        <div className={styles.footerActions}>
          <Button
            type="button"
            variant="outline"
            onClick={manager.handleRecheck}
            disabled={manager.isChecking}
            className={styles.refreshButton}
          >
            <RefreshCw className={cn("h-3 w-3 text-[#14F5D5]", manager.isChecking && "animate-spin")} />
            <span>{manager.isChecking ? (isArabic ? 'جاري الفحص...' : 'Checking...') : (isArabic ? 'إعادة الفحص' : 'Re-check')}</span>
          </Button>

          <Button
            type="button"
            onClick={manager.dismissModal}
            className={styles.closeButton}
          >
            {manager.allGranted
              ? (isArabic ? 'تم التفعيل (متابعة)' : 'All Set (Continue)')
              : (isArabic ? 'المتابعة وتخطي' : 'Skip & Continue')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export * from './permissions/permissions-types';
export default SystemPermissionsModal;
