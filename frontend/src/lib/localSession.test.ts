import { describe, expect, it } from "vitest"
import {
  EMPTY_SESSION,
  isStale,
  parseLocalSession,
  STALE_AFTER_HOURS,
  type LocalSession,
} from "./localSession"

const session: LocalSession = {
  sessionId: "2026-10-19T09:00:00.000Z-a1b2c3",
  reps: [
    {
      repNumber: 1,
      saved: true,
      protocol: "All out",
      strokeRate: 52,
      timeSeconds: 18.42,
      tags: ["Tired"],
    },
    {
      repNumber: 2,
      saved: false,
      protocol: "50 pace",
      strokeRate: 48,
      timeSeconds: 20.1,
      tags: [],
      note: "breathed on 3",
    },
  ],
}

describe("parseLocalSession", () => {
  it("round-trips a stored session", () => {
    expect(parseLocalSession(JSON.stringify(session))).toEqual(session)
  })

  it("gives an empty session when nothing is stored", () => {
    expect(parseLocalSession(null)).toEqual(EMPTY_SESSION)
  })

  it("gives an empty session for corrupt text", () => {
    expect(parseLocalSession("{not json")).toEqual(EMPTY_SESSION)
  })

  it("gives an empty session for a protocol that no longer exists", () => {
    const old = { ...session, reps: [{ ...session.reps[0], protocol: "All-out" }] }
    expect(parseLocalSession(JSON.stringify(old))).toEqual(EMPTY_SESSION)
  })

  it("gives an empty session for reps without the saved flag", () => {
    const repWithoutSaved: Record<string, unknown> = { ...session.reps[0] }
    delete repWithoutSaved.saved
    const old = { ...session, reps: [repWithoutSaved] }
    expect(parseLocalSession(JSON.stringify(old))).toEqual(EMPTY_SESSION)
  })
})

describe("isStale", () => {
  const now = new Date("2026-10-19T21:00:00.000Z")
  const hoursAgo = (hours: number) =>
    new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString()

  it("is fresh when the last activity was recent", () => {
    expect(isStale({ ...session, lastActivityAt: hoursAgo(1) }, now)).toBe(false)
  })

  it("is fresh at exactly the threshold", () => {
    expect(
      isStale({ ...session, lastActivityAt: hoursAgo(STALE_AFTER_HOURS) }, now),
    ).toBe(false)
  })

  it("is stale just past the threshold", () => {
    expect(
      isStale(
        { ...session, lastActivityAt: hoursAgo(STALE_AFTER_HOURS + 0.001) },
        now,
      ),
    ).toBe(true)
  })

  it("measures from the last activity, not the session start", () => {
    // Started two days ago, but a rep was added an hour ago.
    const longSession = {
      ...session,
      sessionId: `${hoursAgo(48)}-a1b2c3`,
      lastActivityAt: hoursAgo(1),
    }
    expect(isStale(longSession, now)).toBe(false)
  })

  it("falls back to the session start when lastActivityAt is missing", () => {
    // Data stored before lastActivityAt existed.
    expect(isStale({ ...session, sessionId: `${hoursAgo(1)}-a1b2c3` }, now)).toBe(false)
    expect(isStale({ ...session, sessionId: `${hoursAgo(13)}-a1b2c3` }, now)).toBe(true)
  })

  it("is stale with no timestamp at all", () => {
    expect(isStale({ sessionId: null, reps: [] }, now)).toBe(true)
  })
})

describe("parseLocalSession and lastActivityAt", () => {
  it("keeps lastActivityAt", () => {
    const stored = { ...session, lastActivityAt: "2026-10-19T09:30:00.000Z" }
    expect(parseLocalSession(JSON.stringify(stored))).toEqual(stored)
  })

  it("drops a malformed lastActivityAt but keeps the reps", () => {
    const stored = { ...session, lastActivityAt: 12345 }
    expect(parseLocalSession(JSON.stringify(stored))).toEqual(session)
  })
})
