export {
  getServerSupabaseAdmin,
  createEphemeralSupabaseAnonClient,
  createUserScopedSupabaseClient,
} from './auth-guard/auth-guard-clients';

export {
  timingSafeCompare,
  consumeRateLimit,
  getPurposeHmacKey,
  hashOtpCode,
  verifyOtpHash,
  signTrackingToken,
  verifyTrackingToken,
} from './auth-guard/auth-guard-crypto';

export {
  extractBearerToken,
  isValidUuid,
  isMissingRpcError,
  getClientIp,
  getSafeAppOrigin,
  isValidStorageRelativePath,
} from './auth-guard/auth-guard-requests';

export {
  type VerifiedCallerUser,
  getVerifiedUser,
} from './auth-guard/auth-guard-verifier';
