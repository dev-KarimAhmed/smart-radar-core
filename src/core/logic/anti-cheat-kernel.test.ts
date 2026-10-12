import assert from 'node:assert/strict';
import { AntiCheatKernel } from './anti-cheat-kernel';

// 1. Initial default state verification
const riderId = 'rider-test-sovereign-01';
let record = AntiCheatKernel.createDefaultRecord(riderId);

assert.equal(record.riderId, riderId);
assert.equal(record.immunityScore, 5.0);
assert.equal(record.consecutiveCancellations, 0);
assert.equal(record.isSuspended, false);

// 2. Cancellation 1 (no penalty)
let result = AntiCheatKernel.evaluateCancellationPenalty(record);
record = result.updatedRecord;
assert.equal(record.consecutiveCancellations, 1);
assert.equal(record.immunityScore, 5.0);
assert.equal(result.penaltyApplied, false);
assert.equal(result.isSuspended, false);

// 3. Cancellation 2 (no penalty)
result = AntiCheatKernel.evaluateCancellationPenalty(record);
record = result.updatedRecord;
assert.equal(record.consecutiveCancellations, 2);
assert.equal(record.immunityScore, 5.0);
assert.equal(result.penaltyApplied, false);
assert.equal(result.isSuspended, false);

// 4. Cancellation 3 (penalty applied: 5.0 - 0.5 = 4.5, not yet suspended because 4.5 >= 4.2)
result = AntiCheatKernel.evaluateCancellationPenalty(record);
record = result.updatedRecord;
assert.equal(record.consecutiveCancellations, 3);
assert.equal(record.immunityScore, 4.5);
assert.equal(result.penaltyApplied, true);
assert.equal(result.isSuspended, false);

// 5. Successful trip breaks streak
record = AntiCheatKernel.recordSuccessfulTrip(record);
assert.equal(record.consecutiveCancellations, 0);
assert.equal(record.immunityScore, 4.5);

// 6. 3 new consecutive cancellations after reset
for (let i = 1; i <= 2; i++) {
  record = AntiCheatKernel.evaluateCancellationPenalty(record).updatedRecord;
}
assert.equal(record.consecutiveCancellations, 2);
assert.equal(record.immunityScore, 4.5);

// 3rd in this new series -> score drops from 4.5 to 4.0 (< 4.2 threshold -> suspension!)
result = AntiCheatKernel.evaluateCancellationPenalty(record);
record = result.updatedRecord;
assert.equal(record.consecutiveCancellations, 3);
assert.equal(record.immunityScore, 4.0);
assert.equal(result.penaltyApplied, true);
assert.equal(result.isSuspended, true);
assert.equal(record.isSuspended, true);
assert.equal(result.reason, 'IMMUNITY_SCORE_DROPPED_BELOW_THRESHOLD');

// 7. Evaluating cancellation on already suspended account
const suspendedEval = AntiCheatKernel.evaluateCancellationPenalty(record);
assert.equal(suspendedEval.isSuspended, true);
assert.equal(suspendedEval.reason, 'ACCOUNT_ALREADY_SUSPENDED');

// 8. Network Time Delta calculation
const deviceTime = 1726750000000;
const serverTime = 1726750005000; // 5 seconds ahead
const delta = AntiCheatKernel.calculateNetworkTimeDelta(deviceTime, serverTime);
assert.equal(delta, 5000);
assert.equal(AntiCheatKernel.getEffectiveNetworkTime(deviceTime, delta), serverTime);

console.log('anti-cheat kernel tests passed successfully');

