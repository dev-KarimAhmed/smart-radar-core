'use client';

export type DriverStatus = 'active' | 'idle' | 'busy' | 'rating';

export interface SovereignEvents {
  'DRIVER_STATUS_CHANGE': DriverStatus;
  'DRIVER_DOC_UPDATE': Record<string, any>;
  'DRIVER_LOCAL_LOCATION_UPDATE': Record<string, any>;
  'CLEAR_RADAR_TRIPS': void;
}

type EventCallback<T> = (data: T) => void;

class SovereignEventBroker {
  private listeners: { [K in keyof SovereignEvents]?: Set<EventCallback<any>> } = {};

  on<K extends keyof SovereignEvents>(event: K, callback: EventCallback<SovereignEvents[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event]!.add(callback);
    return () => this.off(event, callback);
  }

  off<K extends keyof SovereignEvents>(event: K, callback: EventCallback<SovereignEvents[K]>): void {
    if (this.listeners[event]) {
      this.listeners[event]!.delete(callback);
    }
  }

  emit<K extends keyof SovereignEvents>(event: K, data: SovereignEvents[K]): void {
    if (this.listeners[event]) {
      this.listeners[event]!.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[SovereignEventBroker] Error in listener for event ${event}:`, error);
        }
      });
    }
  }
}

export const sovereignEventBroker = new SovereignEventBroker();
