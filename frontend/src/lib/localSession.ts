import { isProtocol } from "@/lib/protocols"
import { isTag } from "@/lib/tags"
import type { Rep } from "@/lib/types"

// A swimmer's session in progress, kept in the browser so it survives
// leaving the page, a refresh or the iPad sleeping. Saved reps are kept too,
// so their ticks come back.
export type LocalSession = {
  sessionId: string | null
  reps: Rep[]
  // ISO time a rep was last added, undone or saved. Missing in sessions
  // stored before it existed.
  lastActivityAt?: string
}

export const EMPTY_SESSION: LocalSession = { sessionId: null, reps: [] }

// A session untouched for longer than this is treated as finished.
export const STALE_AFTER_HOURS = 12

// When the session was last worked on. Older stored sessions have no
// lastActivityAt, so fall back to when the session started (the timestamp
// at the front of its ID). That's never later than the real last activity,
// so it can make a session look older but never newer. null if neither.
export function lastActivity(session: LocalSession): Date | null {
  // e.g. "2026-10-16T16:17:19.123Z-a1b2c3" starts "2026-10-16T16:17:19.123Z"
  const startedAt = session.sessionId?.slice(0, "2026-10-16T16:17:19.123Z".length)
  const timestamp = session.lastActivityAt ?? startedAt
  if (timestamp === undefined) return null
  const date = new Date(timestamp)
  // An unparseable string gives an Invalid Date, whose time is NaN.
  return Number.isNaN(date.getTime()) ? null : date
}

// Pure: the caller passes the current time, so tests can fix it.
export function isStale(session: LocalSession, now: Date): boolean {
  const last = lastActivity(session)
  // No evidence of when it was used, so don't treat it as current.
  if (last === null) return true
  return now.getTime() - last.getTime() > STALE_AFTER_HOURS * 60 * 60 * 1000
}

// One entry per swimmer, so each has their own session.
function storageKey(swimmerId: string) {
  return `swimmer-data:session:${swimmerId}`
}

function isRep(value: unknown): value is Rep {
  if (typeof value !== "object" || value === null) return false
  const rep = value as Record<string, unknown>
  return (
    typeof rep.repNumber === "number" &&
    typeof rep.saved === "boolean" &&
    isProtocol(rep.protocol) &&
    typeof rep.strokeRate === "number" &&
    typeof rep.timeSeconds === "number" &&
    Array.isArray(rep.tags) &&
    rep.tags.every(isTag) &&
    (rep.note === undefined || typeof rep.note === "string")
  )
}

// Turns stored text back into a session. Anything missing, corrupt or from
// an older version of the app (e.g. a protocol since renamed) gives an empty
// session rather than crashing the page.
export function parseLocalSession(text: string | null): LocalSession {
  if (text === null) return EMPTY_SESSION
  try {
    const data: unknown = JSON.parse(text)
    if (typeof data !== "object" || data === null) return EMPTY_SESSION
    const { sessionId, reps, lastActivityAt } = data as Record<string, unknown>
    if (sessionId !== null && typeof sessionId !== "string") return EMPTY_SESSION
    if (!Array.isArray(reps) || !reps.every(isRep)) return EMPTY_SESSION
    // A bad timestamp shouldn't cost the reps, so just leave it out; the
    // session then counts as older stored data (see lastActivity).
    return typeof lastActivityAt === "string"
      ? { sessionId, reps, lastActivityAt }
      : { sessionId, reps }
  } catch {
    return EMPTY_SESSION
  }
}

// localStorage can throw (e.g. storage full or blocked in private browsing).
// Losing the local copy shouldn't stop the coach recording, so carry on.
export function loadLocalSession(swimmerId: string): LocalSession {
  try {
    return parseLocalSession(localStorage.getItem(storageKey(swimmerId)))
  } catch {
    return EMPTY_SESSION
  }
}

export function storeLocalSession(swimmerId: string, session: LocalSession) {
  try {
    if (session.sessionId === null && session.reps.length === 0) {
      // Nothing in progress, so don't leave an empty entry behind.
      localStorage.removeItem(storageKey(swimmerId))
    } else {
      localStorage.setItem(storageKey(swimmerId), JSON.stringify(session))
    }
  } catch {
    // See loadLocalSession.
  }
}
