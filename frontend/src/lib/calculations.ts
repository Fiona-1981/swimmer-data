// Pure calculation helpers: numbers in, numbers (or strings) out.
// Keep these free of React, the DOM and the database so they're easy to test
// and can be shared with a backend later.

// Converts a minutes:seconds time into total seconds, e.g. 1, 32.45 -> 92.45.
export function toTotalSeconds(minutes: number, seconds: number): number {
  return minutes * 60 + seconds
}

// Formats total seconds as m:ss.hh for display, e.g. 92.45 -> "1:32.45".
export function formatTime(totalSeconds: number): string {
  // Work in whole hundredths so rounding can't produce "1:60.00".
  const hundredths = Math.round(totalSeconds * 100)
  const minutes = Math.floor(hundredths / 6000)
  const seconds = ((hundredths % 6000) / 100).toFixed(2).padStart(5, "0")
  return `${minutes}:${seconds}`
}

// Says when `then` was, relative to `now`, for messages like "2 unsaved reps
// from Tuesday": "earlier today", "yesterday", the day name within the last
// week, or the date for anything older. Uses the device's local time.
export function describeDay(then: Date, now: Date): string {
  // Count calendar days, not 24-hour periods: 11pm yesterday is "yesterday".
  // Rounding absorbs the hour gained or lost when the clocks change.
  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const daysAgo = Math.round((startOfDay(now) - startOfDay(then)) / 86_400_000)

  if (daysAgo === 0) return "earlier today"
  if (daysAgo === 1) return "yesterday"
  // Within the last week, so the day name can only mean one day.
  if (daysAgo < 7) return then.toLocaleDateString("en-GB", { weekday: "long" })
  return then.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    ...(then.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  })
}
