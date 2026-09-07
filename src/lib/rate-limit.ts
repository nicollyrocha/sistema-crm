const WINDOW_MS = 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 5;

export function isRateLimited(submissionTimestamps: Date[], now: Date): boolean {
  const windowStart = now.getTime() - WINDOW_MS;
  const recentCount = submissionTimestamps.filter((t) => t.getTime() >= windowStart).length;
  return recentCount >= MAX_SUBMISSIONS_PER_WINDOW;
}
