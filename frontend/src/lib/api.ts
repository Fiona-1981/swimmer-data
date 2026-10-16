import type { Rep } from "@/lib/types"

// Set in .env.local for local dev. Vite bakes it into the build, so it's
// public: never put secrets in a VITE_ variable.
const API_URL = import.meta.env.VITE_API_URL

// Sends one session's reps to the backend. Resolves when they're saved;
// throws an Error with a readable message if they weren't.
export async function submitSession(swimmerId: string, reps: Rep[]) {
  if (!API_URL) throw new Error("VITE_API_URL is not set")

  const response = await fetch(`${API_URL}/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      swimmerId,
      // The backend uses shorter names than our Rep type does.
      reps: reps.map((rep) => ({
        protocol: rep.protocol,
        rate: rep.strokeRate,
        time: rep.timeSeconds,
        tags: rep.tags,
        // JSON.stringify drops undefined, so reps without a note omit it.
        note: rep.note,
      })),
    }),
  })

  // response.ok is true for any 2xx status, e.g. 201 Created.
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
