import React from 'react';
import {
  RiderMachineState,
  RIDER_STATE_STORAGE_KEY,
} from './rider-machine-types';
import {
  initialRiderMachineState,
  riderDashboardReducer,
} from './rider-machine-reducer';

export function createInitialRiderMachineState(): RiderMachineState {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(RIDER_STATE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as RiderMachineState;
        if (
          parsed &&
          parsed.requestId &&
          (parsed.screen === 'RECEIVING_OFFERS' || parsed.screen === 'TRIP_ACTIVE' || parsed.screen === 'RATING_MODAL')
        ) {
          return parsed;
        }
      }
    } catch {}
  }
  return initialRiderMachineState;
}

export function shouldShowAdRiver(state: RiderMachineState): boolean {
  if (
    state.screen === 'TRIP_ACTIVE' ||
    state.screen === 'RATING_MODAL' ||
    state.screen === 'DESTINATION_SELECTION' ||
    state.screen === 'RECEIVING_OFFERS'
  ) {
    return false;
  }

  return true;
}

export function useRiderDashboardMachine() {
  const [state, dispatch] = React.useReducer(riderDashboardReducer, undefined, createInitialRiderMachineState);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (
        state.requestId &&
        (state.screen === 'RECEIVING_OFFERS' || state.screen === 'TRIP_ACTIVE' || state.screen === 'RATING_MODAL')
      ) {
        window.localStorage.setItem(RIDER_STATE_STORAGE_KEY, JSON.stringify(state));
      } else {
        window.localStorage.removeItem(RIDER_STATE_STORAGE_KEY);
      }
    } catch {}
  }, [state]);

  return { state, dispatch, showAdRiver: shouldShowAdRiver(state) };
}
