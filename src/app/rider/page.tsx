'use client';

import React from 'react';
import { RiderOperationsProvider } from '@/hooks/use-rider-operations';
import { Dashboard } from '@/components/dashboard';

export default function RiderPage() {
  return (
    <RiderOperationsProvider>
      <Dashboard />
    </RiderOperationsProvider>
  );
}
