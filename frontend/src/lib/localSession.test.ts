import { describe, expect, it } from "vitest"
import { EMPTY_SESSION, parseLocalSession, type LocalSession } from "./localSession"

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
