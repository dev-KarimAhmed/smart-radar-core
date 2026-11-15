import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { mapRiderMarketplaceError } from './rider-server-marketplace';

export interface MarketplaceErrorLabels {
  permissionDenied: string;
  authRequired: string;
  network: string;
  fareCalculation: string;
  missingColumns: string;
  invalidStatus: string;
  foreignKeyMismatch: string;
  duplicateActive: string;
  generic: string;
}

export function getLocalizedMarketplaceError(error: unknown, language: AppLanguage, labels: MarketplaceErrorLabels) {
  if (language === 'ar') return mapRiderMarketplaceError(error);

  const typedError = error as { message?: string; code?: string; details?: string; hint?: string };
  const message = [
    typedError?.code,
    typedError?.message,
    typedError?.details,
    typedError?.hint,
    error,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (message.includes('captain_already_busy') || message.includes('captain_no_longer_available')) {
    return 'This captain has already accepted another ride. Please choose another available offer.';
  }

  if (message.includes('ride_offer_id_required') || message.includes('offer_id_required')) {
    return 'Offer details are incomplete. Wait for offers to refresh and try again.';
  }

  if (message.includes('ride_offer_not_found')) {
    return 'This offer is no longer available. Wait for a new offer and try again.';
  }

  if (message.includes('ride_offer_not_pending')) {
    return 'This offer has already been handled. Choose another available offer.';
  }

  if (message.includes('ride_request_not_accepting_offers')) {
    return 'Cannot accept this offer right now because the trip status has changed. Refresh and try again.';
  }

  if (message.includes('not_request_owner')) {
    return 'You cannot perform this action for this request. Please sign in with the right account.';
  }

  if (message.includes('42501') || message.includes('row-level security') || message.includes('permission denied')) {
    return labels.permissionDenied;
  }

  if (message.includes('jwt') || message.includes('auth') || message.includes('rider_id')) {
    return labels.authRequired;
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout') || message.includes('gateway')) {
    return labels.network;
  }

  if (message.includes('calculate_server_fare') || message.includes('server_estimated_fare')) {
    return labels.fareCalculation;
  }

  if (message.includes('42703') || message.includes('column') || message.includes('origin_h3') || message.includes('destination_h3')) {
    return labels.missingColumns;
  }

  if (message.includes('22p02') || message.includes('invalid input value for enum') || message.includes('ride_request_status')) {
    return labels.invalidStatus;
  }

  if (message.includes('23503') || message.includes('foreign key') || message.includes('country_id')) {
    return labels.foreignKeyMismatch;
  }

  if (message.includes('23505') || message.includes('duplicate') || message.includes('active request')) {
    return labels.duplicateActive;
  }

  return labels.generic;
}

