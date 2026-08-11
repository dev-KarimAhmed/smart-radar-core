import React from 'react';
import type { RiderLocation } from '../components/rider-map';

/**
 * Owns the single "current destination pin" position shared across the
 * geography default, the main-map drag handle, the map-picker dialog, and
 * clipboard-link import — those hooks call the setters here rather than
 * each keeping their own copy of the pin. The "reset to the selected
 * district's anchor when the district changes" effect lives in the
 * orchestrator (it genuinely needs both this hook and the geography hook).
 */
export function useDestinationPin() {
  const [destinationPinLocation, setDestinationPinLocation] = React.useState<RiderLocation | null>(null);
  const [destinationFlyToTarget, setDestinationFlyToTarget] = React.useState<RiderLocation | null>(null);
  const [isDestinationPinMoving, setIsDestinationPinMoving] = React.useState(false);

  const handleDestinationPinMoveStart = React.useCallback(() => {
    setIsDestinationPinMoving(true);
  }, []);

  const handleDestinationPinChange = React.useCallback((location: RiderLocation) => {
    setDestinationPinLocation(location);
    setIsDestinationPinMoving(false);
  }, []);

  const reset = React.useCallback(() => {
    setDestinationPinLocation(null);
    setDestinationFlyToTarget(null);
    setIsDestinationPinMoving(false);
  }, []);

  return {
    destinationPinLocation,
    setDestinationPinLocation,
    destinationFlyToTarget,
    setDestinationFlyToTarget,
    isDestinationPinMoving,
    setIsDestinationPinMoving,
    handleDestinationPinMoveStart,
    handleDestinationPinChange,
    reset,
  };
}
