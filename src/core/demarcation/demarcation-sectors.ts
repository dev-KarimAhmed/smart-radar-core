import type { SovereignSectorId, ISovereignSector } from './demarcation-types';
import { userSectors } from './demarcation-user-sectors';
import { coreSectors } from './demarcation-core-sectors';

export const sovereignSectors = Object.freeze<Record<SovereignSectorId, ISovereignSector>>({
  ...userSectors,
  ...coreSectors,
});
