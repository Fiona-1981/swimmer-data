import { describe, expect, it } from "vitest"
import { formatTime, toTotalSeconds } from "./calculations"

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
