/**
 * Unified Rider Dashboard State Machine
 * Re-exports types, mappers, reducer, and React hooks.
 */

export {
  type RiderMachineScreen,
  type RiderDestination,
  type RiderLocalRating,
  type RiderActiveTripCaptain,
  type RiderActiveTrip,
  type RiderMachineState,
  type RiderMachineAction,
} from './rider-machine-types';

export {
  initialRiderMachineState,
  riderDashboardReducer,
} from './rider-machine-reducer';

export {
  createInitialRiderMachineState,
  shouldShowAdRiver,
  useRiderDashboardMachine,
} from './rider-machine-hooks';
