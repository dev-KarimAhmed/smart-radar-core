'use client';

import React from 'react';
import {
  SovereignPwaInstallModal,
  SovereignPwaInstallModalProps,
} from '@/components/sovereign-pwa-install-modal';

export type RiderPwaInstallModalProps = SovereignPwaInstallModalProps;

export function RiderPwaInstallModal(props: RiderPwaInstallModalProps) {
  return <SovereignPwaInstallModal role="rider" {...props} />;
}
