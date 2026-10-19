import { useEffect, useState } from "react"
import { useParams } from "react-router"
import App from "./App.tsx"
import NotFound from "./NotFound.tsx"
import { getSwimmer, type Swimmer } from "@/lib/swimmers"

// Looks up the swimmer in the address and shows their capture page.
function SwimmerRoute() {
  // Always set, since the route needs it; the default is for TypeScript.
  const { swimmerId = "" } = useParams()
  // Remembers which ID it's the answer for, so moving to another swimmer
  // shows "Loading…" rather than the previous swimmer for a moment.
  const [lookup, setLookup] = useState<{
    id: string
    swimmer: Swimmer | undefined
  } | null>(null)

  useEffect(() => {
    // See SwimmerList: drop the answer if the address has moved on.
    let ignore = false
    getSwimmer(swimmerId).then((swimmer) => {
      if (!ignore) setLookup({ id: swimmerId, swimmer })
    })
    return () => {
      ignore = true
    }
  }, [swimmerId])

  if (lookup === null || lookup.id !== swimmerId) {
    return (
      <main className="mx-auto w-full max-w-md p-4 md:p-8">
        <p className="text-base text-muted-foreground">Loading…</p>
      </main>
    )
  }
  if (lookup.swimmer === undefined) {
    return <NotFound message="Swimmer not found" />
  }
  // key: a different swimmer gets a fresh App, not the last one's reps.
  return <App key={lookup.swimmer.id} swimmer={lookup.swimmer} />
}

export default SwimmerRoute
