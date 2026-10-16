import type { Rep } from "@/lib/types"

// Set in .env.local for local dev. Vite bakes it into the build, so it's
// public: never put secrets in a VITE_ variable.
const API_URL = import.meta.env.VITE_API_URL

// Give up after this long, so a dead poolside connection can't leave the
// button stuck on "Saving…". Retrying is safe even if the save got through.
const TIMEOUT_MS = 15_000

// e.g. 2026-10-16T16:17:19.123Z-a1b2c3. The time records when the session
// started; the random suffix stops two devices starting in the same
// millisecond from clashing. Must match SESSION_ID_PATTERN in handler.py.
export function newSessionId() {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6)
  return `${new Date().toISOString()}-${suffix}`
}

// Sends one session's reps to the backend. Resolves when they're saved;
// throws an Error with a readable message if they weren't. Sending the same
// sessionId and reps again overwrites rather than duplicates, so retries are
// safe.
export async function submitSession(
  swimmerId: string,
  sessionId: string,
  reps: Rep[],
) {
  if (!API_URL) throw new Error("VITE_API_URL is not set")

  const response = await fetch(`${API_URL}/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      swimmerId,
      sessionId,
      // The backend uses shorter names than our Rep type does.
      reps: reps.map((rep, i) => ({
        // Same number the list shows as "Rep N"; it's part of the rep's key.
        repNumber: i + 1,
        protocol: rep.protocol,
        rate: rep.strokeRate,
        time: rep.timeSeconds,
        tags: rep.tags,
        // JSON.stringify drops undefined, so reps without a note omit it.
        note: rep.note,
      })),
    }),
  })

  // response.ok is true for any 2xx status, e.g. 200 OK.
  if (!response.ok) {
    // The backend sends { error: "..." } for bad input, but a crash or a
    // gateway problem may send something else, so don't rely on it.
    const body = await response.json().catch(() => null)
    const message =
      typeof body?.error === "string"
        ? body.error
        : `Save failed (status ${response.status})`
    throw new Error(message)
  }
}
