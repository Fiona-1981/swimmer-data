import { describe, expect, it } from "vitest"
import { describeDay, formatTime, toTotalSeconds } from "./calculations"

describe("toTotalSeconds", () => {
  it("combines minutes and seconds", () => {
    expect(toTotalSeconds(1, 32.45)).toBeCloseTo(92.45)
  })

  it("handles times under a minute", () => {
    expect(toTotalSeconds(0, 28.1)).toBeCloseTo(28.1)
  })
})

describe("formatTime", () => {
  it("formats as m:ss.hh", () => {
    expect(formatTime(92.45)).toBe("1:32.45")
  })

  it("pads single-digit seconds", () => {
    expect(formatTime(65.5)).toBe("1:05.50")
  })

  it("rounds up into the next minute rather than showing 60 seconds", () => {
    expect(formatTime(59.999)).toBe("1:00.00")
  })

  it("round-trips with toTotalSeconds", () => {
    expect(formatTime(toTotalSeconds(2, 7.3))).toBe("2:07.30")
  })
})

describe("describeDay", () => {
  // Local times, so these pass in any time zone. Monday 19 October 2026.
  const now = new Date(2026, 9, 19, 20, 0)

  it("says earlier today for the same day", () => {
    expect(describeDay(new Date(2026, 9, 19, 6, 30), now)).toBe("earlier today")
  })

  it("says yesterday for the day before, even late at night", () => {
    expect(describeDay(new Date(2026, 9, 18, 23, 59), now)).toBe("yesterday")
  })

  it("uses the day name within the last week", () => {
    expect(describeDay(new Date(2026, 9, 13, 18, 0), now)).toBe("Tuesday")
  })

  it("uses the date for a week ago or more", () => {
    expect(describeDay(new Date(2026, 9, 12, 18, 0), now)).toBe("12 October")
  })

  it("adds the year when it isn't this year", () => {
    expect(describeDay(new Date(2025, 11, 30, 18, 0), now)).toBe("30 December 2025")
  })
})
