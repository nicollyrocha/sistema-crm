const WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;

// `submissionTimestamps` must be prior submissions only (not including the one
// currently being attempted) — the caller checks this BEFORE inserting a row
// for the current attempt, so `>=` here correctly allows the 5th submission
// and blocks the 6th.
export function isRateLimited(submissionTimestamps: Date[], now: Date): boolean {
  const windowStart = now.getTime() - WINDOW_MS;
  const recentCount = submissionTimestamps.filter((t) => t.getTime() >= windowStart).length;
  return recentCount >= MAX_SUBMISSIONS_PER_WINDOW;
}
