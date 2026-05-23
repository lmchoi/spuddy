// Dates are YYYY-MM-DD strings throughout.

function daysAgo(date: string, today: string): number {
  const d = new Date(date + 'T00:00:00');
  const t = new Date(today + 'T00:00:00');
  return Math.round((t.getTime() - d.getTime()) / 86_400_000);
}

function uniqueSortedDates(dates: string[]): string[] {
  return [...new Set(dates)].sort();
}

// Count consecutive days working backwards from today (or yesterday if today
// has no session yet). A gap of >1 day breaks the streak.
export function getCurrentStreak(dates: string[], today: string): number {
  const unique = uniqueSortedDates(dates);
  if (unique.length === 0) return 0;

  // If the most recent session is more than 1 day back, streak is broken.
  const mostRecentAgo = daysAgo(unique[unique.length - 1], today);
  if (mostRecentAgo > 1) return 0;

  let streak = 0;
  let expectedAgo = mostRecentAgo; // 0 (today) or 1 (yesterday)

  for (let i = unique.length - 1; i >= 0; i--) {
    const ago = daysAgo(unique[i], today);
    if (ago === expectedAgo) {
      streak++;
      expectedAgo++;
    } else {
      break;
    }
  }

  return streak;
}

// Scan the full history for the longest consecutive run of days.
export function getLongestStreak(dates: string[]): number {
  const unique = uniqueSortedDates(dates);
  if (unique.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1] + 'T00:00:00');
    const curr = new Date(unique[i] + 'T00:00:00');
    const gap = Math.round((curr.getTime() - prev.getTime()) / 86_400_000);

    if (gap === 1) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 1;
    }
  }

  return longest;
}
