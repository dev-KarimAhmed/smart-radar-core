'use client';

import { useCallback } from 'react';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useWhatsAppGroupListener } from '../hooks/use-whatsapp-group-listener';
import { WhatsAppGroupErrorBoundary } from './whatsapp-group-error-boundary';
import { WhatsAppGroupSwitchModal } from './whatsapp-group-switch-modal';

const styles = {
  root: 'contents',
} as const;

function WhatsAppGroupCoordinatorInner() {
  const { isArabic } = useDashboardLanguage();
  const { switchDialogState, isConfirming, handleConfirmSwitch } = useWhatsAppGroupListener();

  const onConfirm = useCallback(
    (confirm: boolean) => {
      void handleConfirmSwitch(confirm);
    },
    [handleConfirmSwitch],
  );

  if (!switchDialogState.open) {
    return null;
  }

  return (
    <div className={styles.root}>
      <WhatsAppGroupSwitchModal
        open={switchDialogState.open}
        currentGroupName={switchDialogState.currentGroupName}
        targetGroupName={switchDialogState.targetGroupName}
        isConfirming={isConfirming}
        isArabic={isArabic}
        onConfirm={onConfirm}
      />
    </div>
  );
}

export function WhatsAppGroupCoordinator() {
  return (
    <WhatsAppGroupErrorBoundary scope="coordinator">
      <WhatsAppGroupCoordinatorInner />
    </WhatsAppGroupErrorBoundary>
  );
}
