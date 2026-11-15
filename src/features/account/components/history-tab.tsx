'use client';

import React, { useState } from 'react';
import { useHistoryState } from './history-tab/use-history-state';
import { type HistoryCategoryKey } from './history-tab/history-filter-bar';
import { HistoryPassengerView } from './history-tab/history-passenger-view';
import { HistoryCaptainView } from './history-tab/history-captain-view';

export type { HistoryCategoryKey } from './history-tab/history-filter-bar';

export interface HistoryTabProps {
  hideCaptainDiagnostics?: boolean;
}

export function HistoryTab({ hideCaptainDiagnostics = false }: HistoryTabProps = {}) {
  const state = useHistoryState();
  const [activeCategory, setActiveCategory] = useState<HistoryCategoryKey>('all');

  const { isPassenger } = state;

  const effectiveCategory = isPassenger && (activeCategory === 'financial' || activeCategory === 'ranks')
    ? 'all'
    : activeCategory;

  if (isPassenger) {
    return (
      <HistoryPassengerView
        state={state}
        effectiveCategory={effectiveCategory}
        onSelectCategory={setActiveCategory}
      />
    );
  }

  return (
    <HistoryCaptainView
      state={state}
      activeCategory={activeCategory}
      onSelectCategory={setActiveCategory}
      hideCaptainDiagnostics={hideCaptainDiagnostics}
    />
  );
}
