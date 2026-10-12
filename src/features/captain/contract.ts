export { CaptainOnboarding } from './components/onboarding/captain-onboarding';
export {
  CAPTAIN_RANK_RULES,
  generateWeeklyReport,
  recordCaptainPenalty,
  resyncAllCaptainRanks,
} from './services/captain-rank';
export type { CaptainRankName, PenaltyResult, WeeklyReportResult } from './services/captain-rank';
