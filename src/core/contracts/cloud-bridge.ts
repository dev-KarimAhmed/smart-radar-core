import { getFunctions, httpsCallable } from 'firebase/functions';
import { trackSovereignError } from '@/lib/error-tracker';
import type { SovereignCloudContracts } from './cloud-bridge-contracts';
import { simulateSovereignCloud } from './cloud-bridge-simulator';

export type { SovereignCloudContracts } from './cloud-bridge-contracts';

/**
 * [SCR-CMD-310] Sovereign Cloud Bridge
 */
export async function callSovereignCloud<T extends keyof SovereignCloudContracts>(
  functionName: T,
  payload: SovereignCloudContracts[T]['request']
): Promise<SovereignCloudContracts[T]['response']> {
  try {
    const mockSimulation = await simulateSovereignCloud(functionName, payload);
    if (mockSimulation !== null) {
      return mockSimulation;
    }

    const functions = getFunctions();
    const callableFn = httpsCallable<
      SovereignCloudContracts[T]['request'],
      SovereignCloudContracts[T]['response']
    >(functions, functionName);

    const result = await callableFn(payload);
    return result.data;
  } catch (error) {
    trackSovereignError(error, { context: `CloudBridge_${functionName}` });

    const mockSimulation = await simulateSovereignCloud(functionName, payload, true);
    if (mockSimulation !== null) {
      return mockSimulation;
    }

    throw error;
  }
}
