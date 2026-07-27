'use client';

import React from 'react';
import { DriverOperationsProvider } from '@/hooks/use-driver-operations';
import { Dashboard } from '@/components/dashboard';

export default function CaptainPage() {
  return (
    <DriverOperationsProvider>
      <Dashboard />
    </DriverOperationsProvider>
  );
}
