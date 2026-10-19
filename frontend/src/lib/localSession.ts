import { isProtocol } from "@/lib/protocols"
import { isTag } from "@/lib/tags"
import type { Rep } from "@/lib/types"

// A swimmer's session in progress, kept in the browser so it survives
// leaving the page, a refresh or the iPad sleeping. Saved reps are kept too,
// so their ticks come back.
export type LocalSession = {
  sessionId: string | null
  reps: Rep[]
}

export const EMPTY_SESSION: LocalSession = { sessionId: null, reps: [] }

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
    const { sessionId, reps } = data as Record<string, unknown>
    if (sessionId !== null && typeof sessionId !== "string") return EMPTY_SESSION
    if (!Array.isArray(reps) || !reps.every(isRep)) return EMPTY_SESSION
    return { sessionId, reps }
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
