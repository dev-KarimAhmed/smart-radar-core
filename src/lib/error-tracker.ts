import { getSovereignErrorMessage } from '@/core/constants/error-dictionary';

/**
 * Centralized error tracking function.
 * In a real-world scenario, this would integrate with a monitoring service like Sentry.
 * @param error The error object.
 * @param context Additional context for the error.
 */
export function trackSovereignError(error: unknown, context?: Record<string, any>) {
  const errorMessage = getSovereignErrorMessage(error);
  
  console.warn("=== SOVEREIGN ERROR REPORT ===");
  console.warn("Error Message:", errorMessage);
  console.warn("Raw Error:", error);
  if (context) {
    console.warn("Context:", context);
  }
  console.warn("==============================");
}
