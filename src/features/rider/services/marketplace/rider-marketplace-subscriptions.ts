import type { SupabaseRealtimeLike } from '../../types/rider-marketplace-types';

export function subscribeToRideRequestStatus(
  client: SupabaseRealtimeLike,
  requestId: string,
  onStatus: (row: Record<string, unknown>) => void,
  onError?: (error: unknown) => void,
): () => void {
  const channel = client
    .channel(`ride-request-${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ride_requests',
        filter: `id=eq.${requestId}`,
      },
      (payload) => {
        if (payload.new) {
          onStatus(payload.new);
        }
      },
    )
    .subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError?.(error || new Error(status));
      }
    });

  let closed = false;

  return () => {
    if (closed) return;
    closed = true;

    const maybeChannel = channel as { unsubscribe?: () => Promise<unknown> | unknown };
    void maybeChannel.unsubscribe?.();
    if (typeof (client as any)?.removeChannel === 'function') {
      try {
        void (client as any).removeChannel(channel);
      } catch {
        // Channel already removed
      }
    }
  };
}

export function subscribeToRideOffers(
  client: SupabaseRealtimeLike,
  requestId: string,
  onChange: () => void,
  onError?: (error: unknown) => void,
): () => void {
  const channel = client
    .channel(`ride-offers-${requestId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ride_offers',
        filter: `request_id=eq.${requestId}`,
      },
      () => {
        onChange();
      },
    )
    .subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError?.(error || new Error(status));
      }
    });

  let closed = false;

  return () => {
    if (closed) return;
    closed = true;

    const maybeChannel = channel as { unsubscribe?: () => Promise<unknown> | unknown };
    void maybeChannel.unsubscribe?.();
    if (typeof (client as any)?.removeChannel === 'function') {
      try {
        void (client as any).removeChannel(channel);
      } catch {
        // Channel already removed
      }
    }
  };
}
