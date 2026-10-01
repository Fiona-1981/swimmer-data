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
