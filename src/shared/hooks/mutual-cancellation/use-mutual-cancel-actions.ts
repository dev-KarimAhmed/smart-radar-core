import {
  useMutualCancelActionsRequest,
  type UseMutualCancelActionsRequestParams,
} from './use-mutual-cancel-actions-request';
import {
  useMutualCancelActionsResolution,
  type UseMutualCancelActionsResolutionParams,
} from './use-mutual-cancel-actions-resolution';

export interface UseMutualCancelActionsParams extends UseMutualCancelActionsRequestParams {}

export function useMutualCancelActions(params: UseMutualCancelActionsParams) {
  const { requestCancel, acceptCancel } = useMutualCancelActionsRequest(params);
  const { declineCancel, revokeCancel } = useMutualCancelActionsResolution(params);

  return { requestCancel, acceptCancel, declineCancel, revokeCancel };
}

export * from './use-mutual-cancel-actions-request';
export * from './use-mutual-cancel-actions-resolution';
