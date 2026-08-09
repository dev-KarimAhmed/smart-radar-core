'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { DestinationSearchMatch } from '@/shared/services/destination-search';
import type { DestinationSearchStatus } from '../hooks/use-destination-text-search';

const styles = {
  list: "overflow-hidden rounded-2xl border border-white/10 bg-[#0F172A] shadow-xl",
  header: "border-b border-white/10 px-3 py-2 text-[10px] font-black text-[#14F5D5]",
  scroll: "max-h-56 overflow-y-auto",
  item: "flex w-full items-start gap-2 border-b border-white/[0.06] px-3 py-3 text-start text-xs font-bold leading-relaxed text-slate-200 transition last:border-b-0 hover:bg-[#14B8A6]/10 hover:text-white",
  itemIcon: "mt-0.5 h-4 w-4 shrink-0 text-[#14B8A6]",
  statusWarning: "rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs font-bold text-amber-100",
  statusSuccess: "rounded-xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 p-3 text-xs font-bold text-[#BFFCF2]",
} as const;

export interface DestinationSearchResultsProps {
  results: DestinationSearchMatch[];
  status: DestinationSearchStatus;
  onSelectResult: (result: DestinationSearchMatch) => void;
}

export function DestinationSearchResults({ results, status, onSelectResult }: DestinationSearchResultsProps) {
  const destinationSearchCopy = useTranslations('riderDestinationSearch');

  return (
    <>
      {results.length > 0 ? (
        <div className={styles.list}>
          <p className={styles.header}>
            {destinationSearchCopy('results')}
          </p>
          <div className={styles.scroll}>
            {results.map((result) => (
              <button
                key={result.placeId}
                type="button"
                onClick={() => onSelectResult(result)}
                className={styles.item}
              >
                <MapPin className={styles.itemIcon} />
                <span>{result.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {status === 'empty' || status === 'error' ? (
        <p className={styles.statusWarning} role="status">
          {status === 'empty' ? destinationSearchCopy('noResults') : destinationSearchCopy('error')}
        </p>
      ) : null}

      {status === 'selected' ? (
        <p className={styles.statusSuccess} role="status">
          {destinationSearchCopy('selected')}
        </p>
      ) : null}
    </>
  );
}
